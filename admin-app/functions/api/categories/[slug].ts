// /api/categories/:slug
//   GET    → fetch one
//   PATCH  → partial update, snapshot prior state, audit log
//   DELETE → soft-archive (status='archived'), audit log

import { getUserEmail } from "../../_lib/auth";
import { writeAudit } from "../../_lib/audit";
import {
  archiveCategory,
  getCategoryBySlug,
  updateCategory,
  type CategoryUpdate
} from "../../_lib/categories";
import { jsonError, jsonOk } from "../../_lib/json";
import { writeRevision } from "../../_lib/revisions";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const slug = params.slug as string;
  const category = await getCategoryBySlug(env.DB, slug);
  if (!category) return jsonError(404, `Category '${slug}' not found`);
  return jsonOk({ category });
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  const slug = params.slug as string;
  const userEmail = getUserEmail(request);

  let body: CategoryUpdate;
  try {
    body = (await request.json()) as CategoryUpdate;
  } catch {
    return jsonError(400, "Body must be valid JSON");
  }

  const before = await getCategoryBySlug(env.DB, slug);
  if (!before) return jsonError(404, `Category '${slug}' not found`);

  // Snapshot the prior state *before* mutating. The undo flow reads from
  // revisions, so the snapshot has to be the state that should be restored.
  await writeRevision(env.DB, {
    entityType: "categories",
    entityId: slug,
    snapshot: before,
    userEmail
  });

  const updated = await updateCategory(env.DB, slug, body, userEmail);
  if (!updated) return jsonError(404, `Category '${slug}' disappeared during update`);

  // The audit details capture the diff so a reviewer can see what changed
  // without having to inspect snapshots. Keys-only is enough for v1.
  await writeAudit(env.DB, {
    action: "update",
    entityType: "categories",
    entityId: slug,
    userEmail,
    details: { changedKeys: Object.keys(body) }
  });

  return jsonOk({ ok: true, category: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params, request }) => {
  const slug = params.slug as string;
  const userEmail = getUserEmail(request);

  const before = await getCategoryBySlug(env.DB, slug);
  if (!before) return jsonError(404, `Category '${slug}' not found`);

  await writeRevision(env.DB, { entityType: "categories", entityId: slug, snapshot: before, userEmail });

  const ok = await archiveCategory(env.DB, slug, userEmail);
  if (!ok) return jsonError(500, "Archive failed");

  await writeAudit(env.DB, {
    action: "delete",
    entityType: "categories",
    entityId: slug,
    userEmail,
    details: { mode: "soft-archive" }
  });

  return jsonOk({ ok: true });
};
