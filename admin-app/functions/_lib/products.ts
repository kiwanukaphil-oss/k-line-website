// Product CRUD primitives. Each product is a parent row plus four sets of
// child rows (images, sizes, occasions, badges); list and read assemble
// them into a clean Product object, write replaces all child rows in one
// transaction. Routes layer auth + audit + revisions on top of these.

import type {
  EntityStatus,
  Product,
  ProductImage,
  ProductListFilters,
  ProductListPage,
  ProductSize
} from "./types";

interface ProductRow {
  id: string;
  name: string;
  category_id: number;
  category_slug: string;
  category_label: string;
  price: number;
  sale_price: number | null;
  color_name: string | null;
  color_hex: string | null;
  description: string | null;
  featured: number;
  status: string;
  created_at: number;
  updated_at: number;
  created_by: string;
  updated_by: string;
}

interface ImageRow {
  id: number;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

interface SizeRow {
  product_id: string;
  size: string;
  sort_order: number;
  stock_count: number | null;
}

interface TagRow {
  product_id: string;
  value: string;
  sort_order: number;
}

const PRODUCT_SELECT =
  "SELECT p.id, p.name, p.category_id, c.slug AS category_slug, c.label AS category_label, " +
  "p.price, p.sale_price, p.color_name, p.color_hex, p.description, p.featured, p.status, " +
  "p.created_at, p.updated_at, p.created_by, p.updated_by " +
  "FROM products p JOIN categories c ON c.id = p.category_id";

function assembleProduct(
  row: ProductRow,
  images: ProductImage[],
  sizes: ProductSize[],
  occasions: string[],
  badges: string[]
): Product {
  return {
    id: row.id,
    name: row.name,
    categorySlug: row.category_slug,
    categoryLabel: row.category_label,
    price: row.price,
    salePrice: row.sale_price,
    colorName: row.color_name,
    colorHex: row.color_hex,
    description: row.description,
    featured: row.featured === 1,
    status: row.status as EntityStatus,
    images,
    sizes,
    occasions,
    badges,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by
  };
}

// Loads the four child sets for a list of product IDs in one batch round
// trip and groups them by product_id. Avoids the N+1 pattern where listing
// 50 products would issue 200 child queries.
async function loadChildRowsFor(db: D1Database, productIds: string[]) {
  if (productIds.length === 0) {
    return {
      imagesByProduct: new Map<string, ProductImage[]>(),
      sizesByProduct: new Map<string, ProductSize[]>(),
      occasionsByProduct: new Map<string, string[]>(),
      badgesByProduct: new Map<string, string[]>()
    };
  }

  const placeholders = productIds.map(() => "?").join(", ");
  const [imageRes, sizeRes, occasionRes, badgeRes] = await db.batch([
    db
      .prepare(`SELECT id, product_id, url, alt, sort_order FROM product_images WHERE product_id IN (${placeholders}) ORDER BY product_id, sort_order`)
      .bind(...productIds),
    db
      .prepare(`SELECT product_id, size, sort_order, stock_count FROM product_sizes WHERE product_id IN (${placeholders}) ORDER BY product_id, sort_order`)
      .bind(...productIds),
    db
      .prepare(`SELECT product_id, occasion AS value, sort_order FROM product_occasions WHERE product_id IN (${placeholders}) ORDER BY product_id, sort_order`)
      .bind(...productIds),
    db
      .prepare(`SELECT product_id, badge AS value, sort_order FROM product_badges WHERE product_id IN (${placeholders}) ORDER BY product_id, sort_order`)
      .bind(...productIds)
  ]);

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const r of (imageRes.results ?? []) as ImageRow[]) {
    const list = imagesByProduct.get(r.product_id) ?? [];
    list.push({ id: r.id, url: r.url, alt: r.alt, sortOrder: r.sort_order });
    imagesByProduct.set(r.product_id, list);
  }

  const sizesByProduct = new Map<string, ProductSize[]>();
  for (const r of (sizeRes.results ?? []) as SizeRow[]) {
    const list = sizesByProduct.get(r.product_id) ?? [];
    list.push({ size: r.size, sortOrder: r.sort_order, stockCount: r.stock_count });
    sizesByProduct.set(r.product_id, list);
  }

  const occasionsByProduct = new Map<string, string[]>();
  for (const r of (occasionRes.results ?? []) as TagRow[]) {
    const list = occasionsByProduct.get(r.product_id) ?? [];
    list.push(r.value);
    occasionsByProduct.set(r.product_id, list);
  }

  const badgesByProduct = new Map<string, string[]>();
  for (const r of (badgeRes.results ?? []) as TagRow[]) {
    const list = badgesByProduct.get(r.product_id) ?? [];
    list.push(r.value);
    badgesByProduct.set(r.product_id, list);
  }

  return { imagesByProduct, sizesByProduct, occasionsByProduct, badgesByProduct };
}

export async function getProductById(db: D1Database, id: string): Promise<Product | null> {
  const row = await db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).bind(id).first<ProductRow>();
  if (!row) return null;

  const { imagesByProduct, sizesByProduct, occasionsByProduct, badgesByProduct } =
    await loadChildRowsFor(db, [id]);

  return assembleProduct(
    row,
    imagesByProduct.get(id) ?? [],
    sizesByProduct.get(id) ?? [],
    occasionsByProduct.get(id) ?? [],
    badgesByProduct.get(id) ?? []
  );
}

const SORT_COLUMN_MAP: Record<NonNullable<ProductListFilters["sortBy"]>, string> = {
  name: "p.name",
  price: "p.price",
  updated_at: "p.updated_at",
  created_at: "p.created_at"
};

// Lists products with filters, search, sort, and pagination. Builds the
// WHERE clause from whatever filters were provided; unspecified filters
// don't constrain. `total` reflects the filtered set, not the table — the
// SPA uses it for the pager.
export async function listProducts(
  db: D1Database,
  filters: ProductListFilters
): Promise<ProductListPage> {
  const where: string[] = [];
  const binds: Array<string | number> = [];

  if (filters.categorySlug) { where.push("c.slug = ?");   binds.push(filters.categorySlug); }
  if (filters.status)       { where.push("p.status = ?"); binds.push(filters.status); }
  if (filters.search) {
    where.push("(p.name LIKE ? OR p.description LIKE ?)");
    const like = `%${filters.search}%`;
    binds.push(like, like);
  }
  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy ?? "updated_at"];
  const sortDir = filters.sortDir === "asc" ? "ASC" : "DESC";
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  const listSql =
    `${PRODUCT_SELECT}${whereClause} ORDER BY ${sortColumn} ${sortDir}, p.id ASC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id${whereClause}`;

  const [listRes, countRes] = await db.batch([
    db.prepare(listSql).bind(...binds, limit, offset),
    db.prepare(countSql).bind(...binds)
  ]);

  const rows = (listRes.results ?? []) as ProductRow[];
  const productIds = rows.map((r) => r.id);
  const { imagesByProduct, sizesByProduct, occasionsByProduct, badgesByProduct } =
    await loadChildRowsFor(db, productIds);

  const products = rows.map((row) =>
    assembleProduct(
      row,
      imagesByProduct.get(row.id) ?? [],
      sizesByProduct.get(row.id) ?? [],
      occasionsByProduct.get(row.id) ?? [],
      badgesByProduct.get(row.id) ?? []
    )
  );

  const total = ((countRes.results?.[0] as { total: number } | undefined)?.total) ?? 0;

  return { products, total, limit, offset };
}

// Inputs for create/update. Child arrays are *complete replacement* sets —
// passing `images: []` clears all images. This matches how the editor UI
// works (the form holds the canonical list; partial diffs are an
// optimization we don't need at v1).
export interface ProductInput {
  id: string;
  name: string;
  categorySlug: string;
  price: number;
  salePrice?: number | null;
  colorName?: string | null;
  colorHex?: string | null;
  description?: string | null;
  featured?: boolean;
  status?: EntityStatus;
  images?: Array<{ url: string; alt?: string | null }>;
  sizes?: Array<{ size: string; stockCount?: number | null }>;
  occasions?: string[];
  badges?: string[];
}

export interface ProductUpdate {
  name?: string;
  categorySlug?: string;
  price?: number;
  salePrice?: number | null;
  colorName?: string | null;
  colorHex?: string | null;
  description?: string | null;
  featured?: boolean;
  status?: EntityStatus;
  images?: Array<{ url: string; alt?: string | null }>;
  sizes?: Array<{ size: string; stockCount?: number | null }>;
  occasions?: string[];
  badges?: string[];
}

async function resolveCategoryId(db: D1Database, slug: string): Promise<number | null> {
  const row = await db.prepare("SELECT id FROM categories WHERE slug = ?").bind(slug).first<{ id: number }>();
  return row?.id ?? null;
}

// Replaces all child rows for a product. Used by both create and update so
// the assembled set always matches what the caller passed.
async function replaceChildRows(db: D1Database, input: ProductInput | ProductUpdate, productId: string) {
  const statements: D1PreparedStatement[] = [];

  if (input.images !== undefined) {
    statements.push(db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(productId));
    input.images.forEach((img, idx) => {
      statements.push(
        db
          .prepare("INSERT INTO product_images (product_id, url, alt, sort_order) VALUES (?, ?, ?, ?)")
          .bind(productId, img.url, img.alt ?? null, idx)
      );
    });
  }

  if (input.sizes !== undefined) {
    statements.push(db.prepare("DELETE FROM product_sizes WHERE product_id = ?").bind(productId));
    input.sizes.forEach((sz, idx) => {
      statements.push(
        db
          .prepare("INSERT INTO product_sizes (product_id, size, sort_order, stock_count) VALUES (?, ?, ?, ?)")
          .bind(productId, sz.size, idx, sz.stockCount ?? null)
      );
    });
  }

  if (input.occasions !== undefined) {
    statements.push(db.prepare("DELETE FROM product_occasions WHERE product_id = ?").bind(productId));
    input.occasions.forEach((occ, idx) => {
      statements.push(
        db
          .prepare("INSERT INTO product_occasions (product_id, occasion, sort_order) VALUES (?, ?, ?)")
          .bind(productId, occ, idx)
      );
    });
  }

  if (input.badges !== undefined) {
    statements.push(db.prepare("DELETE FROM product_badges WHERE product_id = ?").bind(productId));
    input.badges.forEach((badge, idx) => {
      statements.push(
        db
          .prepare("INSERT INTO product_badges (product_id, badge, sort_order) VALUES (?, ?, ?)")
          .bind(productId, badge, idx)
      );
    });
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function createProduct(
  db: D1Database,
  input: ProductInput,
  userEmail: string
): Promise<Product> {
  const categoryId = await resolveCategoryId(db, input.categorySlug);
  if (categoryId == null) {
    throw new Error(`Unknown category slug: ${input.categorySlug}`);
  }

  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO products (id, name, category_id, price, sale_price, color_name, color_hex, description, featured, status, created_at, updated_at, created_by, updated_by) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      input.id,
      input.name,
      categoryId,
      input.price,
      input.salePrice ?? null,
      input.colorName ?? null,
      input.colorHex ?? null,
      input.description ?? null,
      input.featured ? 1 : 0,
      input.status ?? "draft",
      now,
      now,
      userEmail,
      userEmail
    )
    .run();

  await replaceChildRows(db, input, input.id);

  const created = await getProductById(db, input.id);
  if (!created) throw new Error("Product insert succeeded but lookup failed");
  return created;
}

export async function updateProduct(
  db: D1Database,
  id: string,
  patch: ProductUpdate,
  userEmail: string
): Promise<Product | null> {
  const sets: string[] = [];
  const binds: Array<string | number | null> = [];

  if (patch.name !== undefined)        { sets.push("name = ?");        binds.push(patch.name); }
  if (patch.categorySlug !== undefined) {
    const categoryId = await resolveCategoryId(db, patch.categorySlug);
    if (categoryId == null) throw new Error(`Unknown category slug: ${patch.categorySlug}`);
    sets.push("category_id = ?");
    binds.push(categoryId);
  }
  if (patch.price !== undefined)       { sets.push("price = ?");       binds.push(patch.price); }
  if (patch.salePrice !== undefined)   { sets.push("sale_price = ?");  binds.push(patch.salePrice); }
  if (patch.colorName !== undefined)   { sets.push("color_name = ?");  binds.push(patch.colorName); }
  if (patch.colorHex !== undefined)    { sets.push("color_hex = ?");   binds.push(patch.colorHex); }
  if (patch.description !== undefined) { sets.push("description = ?"); binds.push(patch.description); }
  if (patch.featured !== undefined)    { sets.push("featured = ?");    binds.push(patch.featured ? 1 : 0); }
  if (patch.status !== undefined)      { sets.push("status = ?");      binds.push(patch.status); }

  sets.push("updated_at = ?", "updated_by = ?");
  binds.push(Date.now(), userEmail);
  binds.push(id);

  await db.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
  await replaceChildRows(db, patch, id);

  return getProductById(db, id);
}

export async function archiveProduct(db: D1Database, id: string, userEmail: string): Promise<boolean> {
  const result = await db
    .prepare("UPDATE products SET status = 'archived', updated_at = ?, updated_by = ? WHERE id = ?")
    .bind(Date.now(), userEmail, id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}
