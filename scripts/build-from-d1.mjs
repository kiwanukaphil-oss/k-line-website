// Regenerates assets/js/products.js from Cloudflare D1 at build time.
// Runs as the first step of `npm run build:all` so prerender-products,
// build-sitemap, and the rest of the static-site pipeline can read the
// fresh catalog data and emit consistent /product/*.html and sitemap.xml.
//
// Reads three Pages env vars (set on the kline-men project, production):
//   CLOUDFLARE_API_TOKEN   — secret with D1 read permission
//   CLOUDFLARE_ACCOUNT_ID  — the account that owns klinemen-cms
//   D1_DATABASE_ID         — the klinemen-cms database UUID
//
// Output preserves the same window.KLINE_CATEGORIES / KLINE_PRODUCTS /
// KLINE shape that products.js had pre-CMS, so every page that imported
// this script keeps working unchanged.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(REPO_ROOT, "assets", "js", "products.js");

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error(
    "[build-from-d1] Missing CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / D1_DATABASE_ID env vars.\n" +
      "  These are set as Pages env vars on the kline-men project. For local runs,\n" +
      "  export them before running `npm run build:all`."
  );
  process.exit(1);
}

const D1_QUERY_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

// Tiny REST wrapper. Cloudflare's D1 query endpoint accepts SQL + bound
// params; we never compose strings, every variable goes through `params`.
async function d1Query(sql, params = []) {
  const res = await fetch(D1_QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sql, params })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 ${res.status}: ${text.slice(0, 500)}`);
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(body.errors)}`);
  }
  return body.result?.[0]?.results ?? [];
}

console.log("[build-from-d1] Fetching catalog from D1…");

// Pull everything we need in parallel. Each query filters to status='published'
// so drafts and archived rows never reach the live storefront.
const [categoryRows, productRows, imageRows, sizeRows, occasionRows, badgeRows, settingsRows] =
  await Promise.all([
    d1Query(
      "SELECT slug, label, sort_order FROM categories " +
        "WHERE status = 'published' ORDER BY sort_order, label"
    ),
    d1Query(
      "SELECT p.id, p.name, c.slug AS category, p.price, p.sale_price, " +
        "p.color_name, p.color_hex, p.description, p.featured " +
        "FROM products p JOIN categories c ON c.id = p.category_id " +
        "WHERE p.status = 'published' AND c.status = 'published' " +
        "ORDER BY c.sort_order, p.id"
    ),
    d1Query(
      "SELECT pi.product_id, pi.url, pi.sort_order FROM product_images pi " +
        "JOIN products p ON p.id = pi.product_id " +
        "WHERE p.status = 'published' " +
        "ORDER BY pi.product_id, pi.sort_order"
    ),
    d1Query(
      "SELECT ps.product_id, ps.size, ps.sort_order FROM product_sizes ps " +
        "JOIN products p ON p.id = ps.product_id " +
        "WHERE p.status = 'published' " +
        "ORDER BY ps.product_id, ps.sort_order"
    ),
    d1Query(
      "SELECT po.product_id, po.occasion, po.sort_order FROM product_occasions po " +
        "JOIN products p ON p.id = po.product_id " +
        "WHERE p.status = 'published' " +
        "ORDER BY po.product_id, po.sort_order"
    ),
    d1Query(
      "SELECT pb.product_id, pb.badge, pb.sort_order FROM product_badges pb " +
        "JOIN products p ON p.id = pb.product_id " +
        "WHERE p.status = 'published' " +
        "ORDER BY pb.product_id, pb.sort_order"
    ),
    d1Query("SELECT * FROM settings WHERE id = 1")
  ]);

// Bucket child rows by product_id so we can attach them in one pass.
const groupBy = (rows, key) => {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.product_id) ?? [];
    list.push(row[key]);
    map.set(row.product_id, list);
  }
  return map;
};

const imagesByProduct = groupBy(imageRows, "url");
const sizesByProduct = groupBy(sizeRows, "size");
const occasionsByProduct = groupBy(occasionRows, "occasion");
const badgesByProduct = groupBy(badgeRows, "badge");

// Assemble products into the legacy KLINE_PRODUCTS shape: image is the cover
// (sort_order 0), gallery captures the rest if present, color is always an
// object (matches existing site code's destructuring), badges/salePrice are
// only emitted when populated.
const products = productRows.map((p) => {
  const images = imagesByProduct.get(p.id) ?? [];
  const occasions = occasionsByProduct.get(p.id) ?? [];
  const badges = badgesByProduct.get(p.id) ?? [];

  const obj = {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    image: images[0] ?? "",
    color: { name: p.color_name, hex: p.color_hex },
    sizes: sizesByProduct.get(p.id) ?? [],
    occasion: occasions,
    description: p.description ?? ""
  };

  if (p.sale_price != null) obj.salePrice = p.sale_price;
  if (badges.length > 0) obj.badges = badges;
  if (images.length > 1) obj.gallery = images.slice(1);
  if (p.featured === 1) obj.featured = true;

  return obj;
});

const settings = settingsRows[0] ?? {};
const json = (v) => JSON.stringify(v ?? "");

// File contents — header explains why hand-edits are pointless, then three
// global assignments. Keeps the file shape that existing pages rely on.
const content = `/* K-LINE MEN — Product catalog (generated)
   This file is regenerated from Cloudflare D1 at every public-site build.
   Edit catalog data via the admin dashboard at https://admin.klinemen.ug —
   DO NOT edit this file directly; changes will be overwritten on the next
   build. The committed version in the repo is a frozen snapshot kept only
   as an emergency rollback target.

   Last built: ${new Date().toISOString()} */

window.KLINE_CATEGORIES = ${JSON.stringify(
  categoryRows.map((c) => ({ slug: c.slug, label: c.label })),
  null,
  2
)};

window.KLINE_PRODUCTS = ${JSON.stringify(products, null, 2)};

window.KLINE = {
  all:        () => window.KLINE_PRODUCTS,
  byId:       (id) => window.KLINE_PRODUCTS.find(p => p.id === id),
  byCategory: (slug) => window.KLINE_PRODUCTS.filter(p => p.category === slug),
  byBadge:    (badge) => window.KLINE_PRODUCTS.filter(p => (p.badges || []).includes(badge)),

  whatsappUrl: (message) => 'https://wa.me/' + window.KLINE.WHATSAPP_RAW + '?text=' + encodeURIComponent(message),

  WHATSAPP_DISPLAY: ${json(settings.whatsapp_display)},
  WHATSAPP_RAW:     ${json(settings.whatsapp_raw)},
  CALL_DISPLAY:     ${json(settings.call_display)},
  CALL_RAW:         ${json(settings.call_raw)},
  EMAIL:            ${json(settings.email)},

  INSTAGRAM_HANDLE: ${json(settings.instagram_handle)},
  INSTAGRAM_URL:    ${json(settings.instagram_url)},

  FORMSPREE_ENDPOINT: 'https://formspree.io/f/xykodlge'
};
`;

await fs.writeFile(OUT_PATH, content, "utf8");

console.log(
  `[build-from-d1] ✓ Wrote ${path.relative(REPO_ROOT, OUT_PATH)}\n` +
    `  ${categoryRows.length} categories · ${products.length} products · ` +
    `${imageRows.length} images · ${sizeRows.length} sizes · ` +
    `${occasionRows.length} occasions · ${badgeRows.length} badges`
);
