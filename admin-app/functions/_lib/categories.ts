// Category CRUD primitives. Routes call these instead of writing SQL inline
// so the data-access layer can be tested in isolation if we ever pull it
// out for unit tests.

import type { Category, EntityStatus } from "./types";

interface CategoryRow {
  id: number;
  slug: string;
  label: string;
  sort_order: number;
  intro_copy: string | null;
  hero_image_url: string | null;
  status: string;
  updated_at: number;
  updated_by: string;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    sortOrder: row.sort_order,
    introCopy: row.intro_copy,
    heroImageUrl: row.hero_image_url,
    status: row.status as EntityStatus,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}

export async function listCategories(db: D1Database): Promise<Category[]> {
  const result = await db
    .prepare(
      "SELECT id, slug, label, sort_order, intro_copy, hero_image_url, status, updated_at, updated_by " +
        "FROM categories ORDER BY sort_order, label"
    )
    .all<CategoryRow>();

  return (result.results ?? []).map(rowToCategory);
}

export async function getCategoryBySlug(db: D1Database, slug: string): Promise<Category | null> {
  const row = await db
    .prepare(
      "SELECT id, slug, label, sort_order, intro_copy, hero_image_url, status, updated_at, updated_by " +
        "FROM categories WHERE slug = ?"
    )
    .bind(slug)
    .first<CategoryRow>();

  return row ? rowToCategory(row) : null;
}

export interface CategoryInput {
  slug: string;
  label: string;
  sortOrder?: number;
  introCopy?: string | null;
  heroImageUrl?: string | null;
  status?: EntityStatus;
}

export async function createCategory(
  db: D1Database,
  input: CategoryInput,
  userEmail: string
): Promise<Category> {
  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO categories (slug, label, sort_order, intro_copy, hero_image_url, status, created_at, updated_at, created_by, updated_by) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      input.slug,
      input.label,
      input.sortOrder ?? 0,
      input.introCopy ?? null,
      input.heroImageUrl ?? null,
      input.status ?? "draft",
      now,
      now,
      userEmail,
      userEmail
    )
    .run();

  const created = await getCategoryBySlug(db, input.slug);
  if (!created) throw new Error("Category insert succeeded but lookup failed");
  return created;
}

export interface CategoryUpdate {
  label?: string;
  sortOrder?: number;
  introCopy?: string | null;
  heroImageUrl?: string | null;
  status?: EntityStatus;
}

// Builds an UPDATE statement only for fields that were actually provided.
// Avoids overwriting a column with NULL just because the client omitted it.
export async function updateCategory(
  db: D1Database,
  slug: string,
  patch: CategoryUpdate,
  userEmail: string
): Promise<Category | null> {
  const sets: string[] = [];
  const binds: Array<string | number | null> = [];

  if (patch.label !== undefined)        { sets.push("label = ?");          binds.push(patch.label); }
  if (patch.sortOrder !== undefined)    { sets.push("sort_order = ?");     binds.push(patch.sortOrder); }
  if (patch.introCopy !== undefined)    { sets.push("intro_copy = ?");     binds.push(patch.introCopy); }
  if (patch.heroImageUrl !== undefined) { sets.push("hero_image_url = ?"); binds.push(patch.heroImageUrl); }
  if (patch.status !== undefined)       { sets.push("status = ?");         binds.push(patch.status); }

  // Always touch updated_at and updated_by, even on a no-op patch — the
  // PATCH was a deliberate save and the audit log expects matching ts.
  sets.push("updated_at = ?", "updated_by = ?");
  binds.push(Date.now(), userEmail);
  binds.push(slug);

  await db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE slug = ?`).bind(...binds).run();

  return getCategoryBySlug(db, slug);
}

// Soft delete. We mark the row archived rather than dropping it so revisions
// keep referring to a real entity_id and existing prerendered URLs don't
// break for visitors who hit a stale link before the next site rebuild.
export async function archiveCategory(db: D1Database, slug: string, userEmail: string): Promise<boolean> {
  const result = await db
    .prepare("UPDATE categories SET status = 'archived', updated_at = ?, updated_by = ? WHERE slug = ?")
    .bind(Date.now(), userEmail, slug)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}
