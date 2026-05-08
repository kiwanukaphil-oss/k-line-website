/* ============================================================================
   K-LINE MEN — PDP pre-renderer
   For every product in assets/js/products.js, emits /product/{id}.html with
   pre-baked <title>, <meta description>, canonical, Open Graph, Twitter card,
   and Product + Breadcrumb JSON-LD — so search-engine crawlers and social
   previews get the right metadata without depending on JS execution.
   The page body and scripts are reused from product.html unchanged; the
   pre-rendered file injects `<base href="../">` so existing relative paths
   resolve correctly from /product/.
   Run: npm run prerender:products
   Output: ./product/{id}.html (one file per product)
   ============================================================================ */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_PATH = path.join(ROOT, 'product.html');
const PRODUCTS_JS_PATH = path.join(ROOT, 'assets', 'js', 'products.js');
const OUT_DIR = path.join(ROOT, 'product');
const SITE_URL = 'https://k-line-men.com';

// Products.js is a browser script that assigns to `window` globals. We run it
// in a Function-scoped sandbox with a fake `window` to extract the catalog
// without spinning up jsdom.
async function loadCatalog() {
  const text = await fs.readFile(PRODUCTS_JS_PATH, 'utf8');
  const fakeWindow = {};
  new Function('window', text)(fakeWindow);
  if (!fakeWindow.KLINE_PRODUCTS) throw new Error('Could not load KLINE_PRODUCTS from products.js');
  const categoryLabels = {};
  for (const c of fakeWindow.KLINE_CATEGORIES) categoryLabels[c.slug] = c.label;
  return { products: fakeWindow.KLINE_PRODUCTS, categoryLabels };
}

function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// JSON inside <script> needs `<` escaped so a stray `</script>` in a product
// description can't break out of the script tag.
function safeJSON(value) {
  return JSON.stringify(value).replace(/</g, '\\u003C');
}

function buildHeadInjection(product, categoryLabel) {
  const url = SITE_URL + '/product/' + product.id + '.html';
  const imageUrl = SITE_URL + '/' + product.image;
  const title = product.name + ' — K-LINE MEN';
  const description = product.description || (product.name + ' from K-LINE MEN.');

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': product.description || '',
    'sku': product.id.toUpperCase(),
    'image': imageUrl,
    'url': url,
    'brand': { '@type': 'Brand', 'name': 'K-LINE MEN' },
    'category': categoryLabel,
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'UGX',
      'price': product.price,
      'availability': 'https://schema.org/InStock',
      'url': url,
      'seller': { '@type': 'Organization', 'name': 'K-LINE MEN' }
    }
  };
  if (product.color && product.color.name) productLd.color = product.color.name;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Shop', 'item': SITE_URL + '/shop' },
      { '@type': 'ListItem', 'position': 3, 'name': categoryLabel, 'item': SITE_URL + '/shop?cat=' + product.category },
      { '@type': 'ListItem', 'position': 4, 'name': product.name, 'item': url }
    ]
  };

  // <base href="../"> resolves all relative paths (assets/, shop.html, etc.)
  // against the site root even though this file lives at /product/.
  return [
    '  <base href="../">',
    '  <link rel="canonical" href="' + escapeAttr(url) + '">',
    '  <meta property="og:type" content="product">',
    '  <meta property="og:title" content="' + escapeAttr(title) + '">',
    '  <meta property="og:description" content="' + escapeAttr(description) + '">',
    '  <meta property="og:image" content="' + escapeAttr(imageUrl) + '">',
    '  <meta property="og:url" content="' + escapeAttr(url) + '">',
    '  <meta name="twitter:card" content="summary_large_image">',
    '  <script type="application/ld+json" id="jsonld-product">' + safeJSON(productLd) + '</script>',
    '  <script type="application/ld+json" id="jsonld-breadcrumb">' + safeJSON(breadcrumbLd) + '</script>',
    '  <script>window.PRODUCT_ID = ' + JSON.stringify(product.id) + ';</script>'
  ].join('\n');
}

function applyTemplate(template, product, categoryLabel) {
  const title = product.name + ' — K-LINE MEN';
  const description = product.description || (product.name + ' from K-LINE MEN.');

  let html = template;

  // Replace the boilerplate <title> and <meta description> with product-
  // specific values so search engines and social cards see them at parse time.
  html = html.replace(/<title>.*?<\/title>/, '<title>' + escapeAttr(title) + '</title>');
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*">/,
    '<meta name="description" content="' + escapeAttr(description) + '">'
  );

  // Inject <base href="../">, canonical, OG tags, and JSON-LD just before the
  // first stylesheet link — keeps the head order: charset, viewport, title,
  // description, OG/canonical/JSON-LD, then preconnects + stylesheet.
  const injection = buildHeadInjection(product, categoryLabel);
  html = html.replace(
    /(\s*<!--\s*Favicons \+ PWA manifest)/,
    '\n' + injection + '\n$1'
  );

  return html;
}

async function ensureCleanOutDir() {
  // Remove the directory entirely so stale files (renamed/deleted products)
  // don't linger as 200-OK pages search engines keep returning to.
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function main() {
  const template = await fs.readFile(TEMPLATE_PATH, 'utf8');
  const { products, categoryLabels } = await loadCatalog();
  console.log('Loaded ' + products.length + ' products from products.js');

  await ensureCleanOutDir();

  let written = 0;
  for (const product of products) {
    const categoryLabel = categoryLabels[product.category] || product.category;
    const html = applyTemplate(template, product, categoryLabel);
    const outPath = path.join(OUT_DIR, product.id + '.html');
    await fs.writeFile(outPath, html, 'utf8');
    written++;
  }

  console.log('✓ Wrote ' + written + ' files to ' + path.relative(ROOT, OUT_DIR) + '/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
