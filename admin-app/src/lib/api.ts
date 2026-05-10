// Typed API client for the admin SPA. Wraps fetch with sensible defaults
// (JSON content-type, error unwrapping) so pages can call e.g.
// `await api.listProducts({ search: 'oxford' })` and get a typed result.
//
// All requests are same-origin (admin.klinemen.ug → /api/...) so the
// Cloudflare Access cookie tags along automatically.

import type {
  Category,
  EntityStatus,
  Product,
  ProductListFilters,
  ProductListPage
} from "../../functions/_lib/types";

// Shapes the editor sends. Mirrors the backend's ProductInput / ProductUpdate
// but redeclared here so the SPA doesn't pull in workers-types via the
// products.ts module (only types.ts is import-clean).
export interface ProductWriteInput {
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

export interface ProductCreateInput extends ProductWriteInput {
  id: string;
  name: string;
  categorySlug: string;
  price: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Wraps fetch and surfaces server-side error messages when present so the UI
// can render something more useful than "HTTP 500".
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // body wasn't JSON; keep the HTTP status as the message
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export async function listProducts(filters: ProductListFilters = {}): Promise<ProductListPage> {
  const params = new URLSearchParams();
  if (filters.categorySlug)        params.set("category", filters.categorySlug);
  if (filters.status)              params.set("status", filters.status);
  if (filters.search)              params.set("search", filters.search);
  if (filters.sortBy)              params.set("sort", filters.sortBy);
  if (filters.sortDir)             params.set("order", filters.sortDir);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));

  const qs = params.toString();
  return request<ProductListPage>(`/api/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: string): Promise<Product> {
  const data = await request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`);
  return data.product;
}

export async function listCategories(): Promise<Category[]> {
  const data = await request<{ categories: Category[] }>("/api/categories");
  return data.categories;
}

export async function updateProduct(id: string, patch: ProductWriteInput): Promise<Product> {
  const data = await request<{ ok: boolean; product: Product }>(
    `/api/products/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(patch) }
  );
  return data.product;
}

export async function createProduct(input: ProductCreateInput): Promise<Product> {
  const data = await request<{ ok: boolean; product: Product }>(
    "/api/products",
    { method: "POST", body: JSON.stringify(input) }
  );
  return data.product;
}

export async function archiveProduct(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" });
}
