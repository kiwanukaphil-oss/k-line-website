import type { ManagedImage } from "./ImageManager";
import { formatPrice } from "../lib/format";
import { resolveImageUrl } from "../lib/imageUrl";

// Live product card preview. Mirrors the public storefront's card layout
// so the editor can see what the change looks like before it ships, in
// real time as fields are typed. Not pixel-identical to the production
// styles — close enough that the owner can tell colour/price/sale-price
// are right without leaving the admin.

interface Props {
  name: string;
  categoryLabel: string;
  price: number;
  salePrice: number | null;
  colorName: string | null;
  colorHex: string | null;
  badges: string[];
  description: string | null;
  images: ManagedImage[];
}

export function ProductPreview(props: Props) {
  const cover = props.images[0];
  const coverUrl = cover ? resolveImageUrl(cover.url) : null;
  const onSale = props.salePrice != null && props.salePrice < props.price;

  return (
    <aside class="preview" aria-label="Live preview">
      <p class="preview-label">Live preview</p>
      <article class="preview-card">
        <div class="preview-image-wrap">
          {coverUrl ? (
            <img src={coverUrl} alt={props.name} class="preview-image" />
          ) : (
            <div class="preview-image-placeholder">No image yet</div>
          )}
          {props.badges.length > 0 && (
            <div class="preview-badges">
              {props.badges.map((b) => (
                <span key={b} class="preview-badge" data-kind={b}>{b}</span>
              ))}
            </div>
          )}
        </div>
        <div class="preview-body">
          <p class="preview-category">{props.categoryLabel || "Uncategorised"}</p>
          <h3 class="preview-name">{props.name || "Untitled product"}</h3>
          {(props.colorName || props.colorHex) && (
            <p class="preview-color">
              {props.colorHex && <span class="preview-color-swatch" style={`background: ${props.colorHex}`} aria-hidden="true" />}
              <span>{props.colorName ?? props.colorHex}</span>
            </p>
          )}
          <p class="preview-price">
            {onSale ? (
              <>
                <span class="preview-price-sale">{formatPrice(props.salePrice!)}</span>
                <span class="preview-price-original">{formatPrice(props.price)}</span>
              </>
            ) : (
              formatPrice(props.price)
            )}
          </p>
          {props.description && (
            <p class="preview-description">{props.description}</p>
          )}
        </div>
      </article>
    </aside>
  );
}
