// /api/categories
//   GET  → list all categories (no pagination — only 17 of them)
//   POST → create a category, snapshot prior state for revisions, audit log

import { getUserEmail } from "../../_lib/auth";
import { writeAudit } from "../../_lib/audit";
import { createCategory, listCategories, type CategoryInput } from "../../_lib/categories";
import { jsonError, jsonOk } from "../../_lib/json";
import type { Env } from "../../_lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const categories = await listCategories(env.DB);
  return jsonOk({ categories });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let body: Partial<CategoryInput>;
  try {
    body = (await request.json()) as Partial<CategoryInput>;
  } catch {
    return jsonError(400, "Body must be valid JSON");
  }

  if (!body.slug || typeof body.slug !== "string") return jsonError(400, "slug is required");
  if (!body.label || typeof body.label !== "string") return jsonError(400, "label is required");

  const userEmail = getUserEmail(request);
  try {
    const category = await createCategory(env.DB, body as CategoryInput, userEmail);
    await writeAudit(env.DB, {
      action: "create",
      entityType: "categories",
      entityId: category.slug,
      userEmail
    });
    return jsonOk({ ok: true, category }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    // UNIQUE constraint on slug → 409 Conflict
    if (message.toLowerCase().includes("unique")) return jsonError(409, `Category slug '${body.slug}' already exists`);
    return jsonError(500, message);
  }
};
