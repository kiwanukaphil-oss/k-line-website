// Resolves a stored image URL to something a browser can render. Three
// shapes appear in the catalog right now:
//   1. Cloudflare Images delivery URL (https://imagedelivery.net/...) —
//      use as-is. Future uploads via Phase 1c land here.
//   2. Public-site relative path (assets/images/shirts/shirts-001.png) —
//      the seeded products from products.js. Resolve against the live
//      storefront so the admin can show the same images without a copy.
//   3. Anything else absolute — pass through.
//
// PUBLIC_SITE_ORIGIN is the production storefront. We're hardcoding it
// rather than reading from env because the value never changes in this
// project; if K-LINE ever adds staging it'll move to a runtime config.

const PUBLIC_SITE_ORIGIN = "https://klinemen.ug";

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative path — strip any leading slash before joining so we don't end
  // up with double slashes.
  return `${PUBLIC_SITE_ORIGIN}/${url.replace(/^\//, "")}`;
}
