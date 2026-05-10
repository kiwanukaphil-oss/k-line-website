// Shared types for the admin API. Pages Function route files import from
// here so the request/response shape stays consistent across endpoints and
// the SPA can rely on a single source of truth (we'll re-export a subset of
// these to the SPA later).

export interface Env {
  DB: D1Database;
  CF_ACCOUNT_ID: string;
  CF_IMAGES_TOKEN: string;
  CF_IMAGES_HASH: string;
}

export type EntityStatus = "draft" | "pending_review" | "published" | "archived";

export interface Category {
  id: number;
  slug: string;
  label: string;
  sortOrder: number;
  introCopy: string | null;
  heroImageUrl: string | null;
  status: EntityStatus;
  updatedAt: number;
  updatedBy: string;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface ProductSize {
  size: string;
  sortOrder: number;
  stockCount: number | null;
}

export interface Product {
  id: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  price: number;
  salePrice: number | null;
  colorName: string | null;
  colorHex: string | null;
  description: string | null;
  featured: boolean;
  status: EntityStatus;
  images: ProductImage[];
  sizes: ProductSize[];
  occasions: string[];
  badges: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export interface ProductListFilters {
  categorySlug?: string;
  status?: EntityStatus;
  search?: string;
  sortBy?: "name" | "price" | "updated_at" | "created_at";
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface ProductListPage {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}
