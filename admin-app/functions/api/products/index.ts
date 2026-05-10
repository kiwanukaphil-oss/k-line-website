// /api/products
//   GET  → list with filters / search / sort / pagination
//   POST → create a product (with images, sizes, occasions, badges)

import { getUserEmail } from "../../_lib/auth";
import { writeAudit } from "../../_lib/audit";
import { jsonError, jsonOk } from "../../_lib/json";
import { createProduct, listProducts, type ProductInput } from "../../_lib/products";
import type { Env, EntityStatus, ProductListFilters } from "../../_lib/types";

const VALID_STATUSES: ReadonlySet<EntityStatus> = new Set([
  "draft",
  "pending_review",
  "published",
  "archived"
]);
const VALID_SORT_BY: ReadonlySet<NonNullable<ProductListFilters["sortBy"]>> = new Set([
  "name",
  "price",
  "updated_at",
  "created_at"
]);

// Parses query params into a typed filter object. Anything unrecognised is
// silently dropped so a stray ?foo=bar can't widen the SQL surface.
function parseFilters(url: URL): ProductListFilters {
  const filters: ProductListFilters = {};
  const category = url.searchParams.get("category");
  if (category) filters.categorySlug = category;

  const status = url.searchParams.get("status");
  if (status && VALID_STATUSES.has(status as EntityStatus)) filters.status = status as EntityStatus;

  const search = url.searchParams.get("search");
  if (search) filters.search = search;

  const sortBy = url.searchParams.get("sort");
  if (sortBy && VALID_SORT_BY.has(sortBy as ProductListFilters["sortBy"] & string)) {
    filters.sortBy = sortBy as ProductListFilters["sortBy"];
  }

  const sortDir = url.searchParams.get("order");
  if (sortDir === "asc" || sortDir === "desc") filters.sortDir = sortDir;

  const limit = url.searchParams.get("limit");
  if (limit) {
    const n = parseInt(limit, 10);
    if (!Number.isNaN(n)) filters.limit = n;
  }
  const offset = url.searchParams.get("offset");
  if (offset) {
    const n = parseInt(offset, 10);
    if (!Number.isNaN(n)) filters.offset = n;
  }

  return filters;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const page = await listProducts(env.DB, parseFilters(url));
  return jsonOk(page);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let body: Partial<ProductInput>;
  try {
    body = (await request.json()) as Partial<ProductInput>;
  } catch {
    return jsonError(400, "Body must be valid JSON");
  }

  if (!body.id || typeof body.id !== "string")     return jsonError(400, "id is required");
  if (!body.name || typeof body.name !== "string") return jsonError(400, "name is required");
  if (!body.categorySlug || typeof body.categorySlug !== "string") return jsonError(400, "categorySlug is required");
  if (typeof body.price !== "number")              return jsonError(400, "price (number) is required");

  const userEmail = getUserEmail(request);
  try {
    const product = await createProduct(env.DB, body as ProductInput, userEmail);
    await writeAudit(env.DB, {
      action: "create",
      entityType: "products",
      entityId: product.id,
      userEmail
    });
    return jsonOk({ ok: true, product }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    if (message.toLowerCase().includes("unique")) return jsonError(409, `Product id '${body.id}' already exists`);
    if (message.toLowerCase().includes("unknown category")) return jsonError(400, message);
    return jsonError(500, message);
  }
};
