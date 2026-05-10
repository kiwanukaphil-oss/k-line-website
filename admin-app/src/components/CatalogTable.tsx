import type { Category, Product } from "../../functions/_lib/types";
import { formatPrice, formatRelative } from "../lib/format";
import { resolveImageUrl } from "../lib/imageUrl";

// The catalog table itself — pure presentation, parent passes data and
// callbacks. Click a column header to sort (the parent toggles direction
// and reissues the API call); click a row to navigate to the editor (which
// arrives in 1d-iii).

type SortKey = "name" | "price" | "updated_at" | "created_at";
type SortDir = "asc" | "desc";

interface Props {
  products: Product[];
  categories: Category[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onRowClick?: (product: Product) => void;
}

interface Column {
  key: SortKey | null;        // null columns aren't sortable
  label: string;
  align?: "left" | "right";
  width?: string;
}

const COLUMNS: readonly Column[] = [
  { key: null,         label: "",          width: "60px" },
  { key: "name",       label: "Name" },
  { key: null,         label: "Category",  width: "140px" },
  { key: "price",      label: "Price",     align: "right", width: "120px" },
  { key: null,         label: "Status",    width: "110px" },
  { key: "updated_at", label: "Updated",   align: "right", width: "100px" }
];

export function CatalogTable(props: Props) {
  const { products, sortKey, sortDir, onSort, onRowClick } = props;

  if (products.length === 0) {
    return (
      <div class="catalog-empty">
        <p>No products match the current filters.</p>
      </div>
    );
  }

  return (
    <table class="catalog-table">
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th
              key={col.label || "thumb"}
              style={col.width ? `width: ${col.width}` : undefined}
              data-align={col.align}
              data-sortable={col.key ? "true" : undefined}
              onClick={col.key ? () => onSort(col.key!) : undefined}
            >
              {col.label}
              {col.key === sortKey && (
                <span class="catalog-table-sort-indicator">{sortDir === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <CatalogRow key={p.id} product={p} onClick={onRowClick} />
        ))}
      </tbody>
    </table>
  );
}

function CatalogRow(props: { product: Product; onClick?: (p: Product) => void }) {
  const { product, onClick } = props;
  const thumbUrl = resolveImageUrl(product.images[0]?.url);
  return (
    <tr
      onClick={onClick ? () => onClick(product) : undefined}
      data-clickable={onClick ? "true" : undefined}
    >
      <td class="catalog-table-thumb-cell">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" class="catalog-table-thumb" loading="lazy" />
        ) : (
          <span class="catalog-table-thumb-placeholder" aria-hidden="true" />
        )}
      </td>
      <td>
        <div class="catalog-table-name">{product.name}</div>
        <div class="catalog-table-id">{product.id}</div>
      </td>
      <td>{product.categoryLabel}</td>
      <td data-align="right" class="catalog-table-price">
        {product.salePrice != null ? (
          <>
            <span class="catalog-table-price-sale">{formatPrice(product.salePrice)}</span>
            <span class="catalog-table-price-original">{formatPrice(product.price)}</span>
          </>
        ) : (
          formatPrice(product.price)
        )}
      </td>
      <td>
        <span class="catalog-table-status" data-status={product.status}>
          {product.status.replace("_", " ")}
        </span>
      </td>
      <td data-align="right" class="catalog-table-updated">
        {formatRelative(product.updatedAt)}
      </td>
    </tr>
  );
}
