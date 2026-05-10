// /api/products/:id
//   GET    → fetch one assembled product
//   PATCH  → partial update, snapshot prior state, audit log
//   DELETE → soft-archive

import { getUserEmail } from "../../_lib/auth";
import { writeAudit } from "../../_lib/audit";
import { jsonError, jsonOk } from "../../_lib/json";
import {
  archiveProduct,
  getProductById,
  updateProduct,
  type ProductUpdate
} from "../../_lib/products";
import { writeRevision } from "../../_lib/revisions";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = params.id as string;
  const product = await getProductById(env.DB, id);
  if (!product) return jsonError(404, `Product '${id}' not found`);
  return jsonOk({ product });
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string;
  const userEmail = getUserEmail(request);

  let body: ProductUpdate;
  try {
    body = (await request.json()) as ProductUpdate;
  } catch {
    return jsonError(400, "Body must be valid JSON");
  }

  const before = await getProductById(env.DB, id);
  if (!before) return jsonError(404, `Product '${id}' not found`);

  // Snapshot the assembled product (parent + child rows) before we mutate.
  // This is what one-click undo restores.
  await writeRevision(env.DB, {
    entityType: "products",
    entityId: id,
    snapshot: before,
    userEmail
  });

  let updated;
  try {
    updated = await updateProduct(env.DB, id, body, userEmail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.toLowerCase().includes("unknown category")) return jsonError(400, message);
    return jsonError(500, message);
  }
  if (!updated) return jsonError(404, `Product '${id}' disappeared during update`);

  await writeAudit(env.DB, {
    action: "update",
    entityType: "products",
    entityId: id,
    userEmail,
    details: { changedKeys: Object.keys(body) }
  });

  return jsonOk({ ok: true, product: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string;
  const userEmail = getUserEmail(request);

  const before = await getProductById(env.DB, id);
  if (!before) return jsonError(404, `Product '${id}' not found`);

  await writeRevision(env.DB, { entityType: "products", entityId: id, snapshot: before, userEmail });

  const ok = await archiveProduct(env.DB, id, userEmail);
  if (!ok) return jsonError(500, "Archive failed");

  await writeAudit(env.DB, {
    action: "delete",
    entityType: "products",
    entityId: id,
    userEmail,
    details: { mode: "soft-archive" }
  });

  return jsonOk({ ok: true });
};
