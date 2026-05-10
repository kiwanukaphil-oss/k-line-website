import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import type { Category, ProductListPage } from "../../functions/_lib/types";
import { ApiError, listCategories, listProducts } from "../lib/api";
import { CatalogTable } from "../components/CatalogTable";

// Catalog browse page. Composes search input, category dropdown, status
// dropdown, sortable table, and pager. Each filter change reissues the API
// call; the search box is debounced ~300ms so we don't spam the API per
// keystroke. URL params aren't synced yet — that's nice-to-have for the
// editor (1d-iii) since deep-linking matters more there.

type SortKey = "name" | "price" | "updated_at" | "created_at";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "draft" | "pending_review" | "published" | "archived";

const PAGE_SIZE = 50;

export function Catalog() {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState<ProductListPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state. We keep `searchInput` (uncontrolled-ish) separate from
  // `searchApplied` so we can debounce the API call without lagging the
  // input — typing feels instant, the request fires after 300ms of idle.
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [offset, setOffset] = useState(0);

  // Categories load once on mount.
  useEffect(() => {
    listCategories().then(setCategories).catch((e) => setError(errorMessage(e)));
  }, []);

  // Debounce searchInput → searchApplied.
  const searchTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimeout.current != null) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      setSearchApplied(searchInput);
      setOffset(0);  // any new search resets to page 1
    }, 300);
    return () => {
      if (searchTimeout.current != null) window.clearTimeout(searchTimeout.current);
    };
  }, [searchInput]);

  // The actual API call. Reruns whenever any filter / sort / pagination changes.
  useEffect(() => {
    setLoading(true);
    setError(null);
    listProducts({
      categorySlug: categoryFilter || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchApplied || undefined,
      sortBy: sortKey,
      sortDir,
      limit: PAGE_SIZE,
      offset
    })
      .then(setPage)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [categoryFilter, statusFilter, searchApplied, sortKey, sortDir, offset]);

  // Click a sortable column header: same key flips direction, new key resets to desc.
  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setOffset(0);
  };

  const total = page?.total ?? 0;
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = page ? offset + page.products.length : 0;
  const canPrev = offset > 0;
  const canNext = page != null && offset + page.products.length < total;

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (searchApplied) parts.push(`matching "${searchApplied}"`);
    if (categoryFilter) {
      const label = categories.find((c) => c.slug === categoryFilter)?.label ?? categoryFilter;
      parts.push(`in ${label}`);
    }
    if (statusFilter !== "all") parts.push(`status: ${statusFilter.replace("_", " ")}`);
    return parts.length > 0 ? ` ${parts.join(" · ")}` : "";
  }, [searchApplied, categoryFilter, statusFilter, categories]);

  return (
    <div class="page page-catalog">
      <header class="catalog-header">
        <div class="catalog-header-titles">
          <h1 class="page-title">Catalog</h1>
          <p class="catalog-summary">
            {loading && total === 0 ? "Loading…" : `${total} product${total === 1 ? "" : "s"}${filterSummary}`}
          </p>
        </div>
        <a href="/catalog/new" class="catalog-new-button">+ New product</a>
      </header>

      <div class="catalog-filters">
        <input
          type="search"
          class="catalog-search"
          placeholder="Search by name or description"
          value={searchInput}
          onInput={(e) => setSearchInput((e.currentTarget as HTMLInputElement).value)}
        />
        <select
          class="catalog-select"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter((e.currentTarget as HTMLSelectElement).value); setOffset(0); }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
        <select
          class="catalog-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter((e.currentTarget as HTMLSelectElement).value as StatusFilter); setOffset(0); }}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending review</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <div class="catalog-error">{error}</div>}

      {page && (
        <CatalogTable
          products={page.products}
          categories={categories}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          onRowClick={(p) => location.route(`/catalog/${p.id}`)}
        />
      )}

      <footer class="catalog-pager">
        <span class="catalog-pager-summary">
          {total === 0 ? "—" : `Showing ${showingFrom}–${showingTo} of ${total}`}
        </span>
        <div class="catalog-pager-buttons">
          <button
            type="button"
            class="catalog-pager-button"
            disabled={!canPrev}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            ← Previous
          </button>
          <button
            type="button"
            class="catalog-pager-button"
            disabled={!canNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next →
          </button>
        </div>
      </footer>
    </div>
  );
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return `${e.message} (HTTP ${e.status})`;
  if (e instanceof Error) return e.message;
  return "Could not load catalog";
}
