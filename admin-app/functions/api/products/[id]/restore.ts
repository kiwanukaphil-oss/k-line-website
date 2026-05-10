// POST /api/products/:id/restore
// Body: { revisionId: number }
//
// Restores the product to the state captured by the named revision.
// Snapshots the current state to a new revision first (so the restore is
// itself undoable), then applies the snapshot via updateProduct, then
// writes an audit log entry that records which revision was restored.

import { getUserEmail } from "../../../_lib/auth";
import { writeAudit } from "../../../_lib/audit";
import { jsonError, jsonOk } from "../../../_lib/json";
import { getProductById, updateProduct, type ProductUpdate } from "../../../_lib/products";
import { writeRevision } from "../../../_lib/revisions";
import type { Env, Product } from "../../../_lib/types";

interface RestoreBody {
  revisionId?: number;
}

interface RevisionRow {
  snapshot: string;
}

// Converts a saved Product snapshot back into the ProductUpdate shape that
// updateProduct() consumes. Mostly identity, but image/size arrays need
// their richer shape unwrapped.
function snapshotToUpdate(snapshot: Product): ProductUpdate {
  return {
    name: snapshot.name,
    categorySlug: snapshot.categorySlug,
    price: snapshot.price,
    salePrice: snapshot.salePrice,
    colorName: snapshot.colorName,
    colorHex: snapshot.colorHex,
    description: snapshot.description,
    featured: snapshot.featured,
    status: snapshot.status,
    images: snapshot.images.map((i) => ({ url: i.url, alt: i.alt })),
    sizes: snapshot.sizes.map((s) => ({ size: s.size, stockCount: s.stockCount })),
    occasions: snapshot.occasions,
    badges: snapshot.badges
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string;
  const userEmail = getUserEmail(request);

  let body: RestoreBody;
  try {
    body = (await request.json()) as RestoreBody;
  } catch {
    return jsonError(400, "Body must be valid JSON");
  }
  if (typeof body.revisionId !== "number") {
    return jsonError(400, "revisionId (number) is required");
  }

  // Fetch the named revision and confirm it belongs to this product.
  // Cross-product restores would be a security hole — defence-in-depth
  // since Access already gates the host, but cheap to enforce.
  const rev = await env.DB.prepare(
    "SELECT snapshot FROM revisions WHERE id = ? AND entity_type = 'products' AND entity_id = ?"
  )
    .bind(body.revisionId, id)
    .first<RevisionRow>();

  if (!rev) return jsonError(404, `Revision ${body.revisionId} not found for this product`);

  let snapshot: Product;
  try {
    snapshot = JSON.parse(rev.snapshot) as Product;
  } catch {
    return jsonError(500, "Revision snapshot is corrupted and cannot be restored");
  }

  // Snapshot the current state before restoring so the restore itself can
  // be undone with one click.
  const before = await getProductById(env.DB, id);
  if (before) {
    await writeRevision(env.DB, {
      entityType: "products",
      entityId: id,
      snapshot: before,
      userEmail
    });
  }

  let restored;
  try {
    restored = await updateProduct(env.DB, id, snapshotToUpdate(snapshot), userEmail);
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Restore failed");
  }
  if (!restored) return jsonError(500, "Restore succeeded but lookup failed");

  await writeAudit(env.DB, {
    action: "update",
    entityType: "products",
    entityId: id,
    userEmail,
    details: { restoredFromRevisionId: body.revisionId }
  });

  return jsonOk({ ok: true, product: restored });
};
