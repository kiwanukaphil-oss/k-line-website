/* ============================================================================
   K-LINE MEN — Sitemap builder
   Emits sitemap.xml covering:
     - Static pages at root (/, /shop.html, /about.html, etc.)
     - Per-category shop URLs (/shop.html?cat={slug})
     - Pre-rendered product pages (/product/{id}.html)
   Run: npm run build:sitemap   (or :  npm run build:all)
   ============================================================================ */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://k-line-men.com';
const OUT_PATH = path.join(ROOT, 'sitemap.xml');

// Cart and wishlist are intentionally excluded — both ship `<meta name="robots"
// content="noindex">` because they're per-device shopping state, not crawlable
// content. Including them in the sitemap would contradict the noindex hint.
const STATIC_PAGES = [
  { path: '/',              priority: '1.0' },
  { path: '/shop.html',     priority: '0.9' },
  { path: '/about.html',    priority: '0.6' },
  { path: '/contact.html',  priority: '0.6' },
  { path: '/faq.html',      priority: '0.5' },
  { path: '/privacy.html',  priority: '0.3' },
  { path: '/terms.html',    priority: '0.3' }
];

async function loadCatalog() {
  const text = await fs.readFile(path.join(ROOT, 'assets', 'js', 'products.js'), 'utf8');
  const fakeWindow = {};
  new Function('window', text)(fakeWindow);
  return { products: fakeWindow.KLINE_PRODUCTS, categories: fakeWindow.KLINE_CATEGORIES };
}

function urlEntry(loc, lastmod, priority) {
  const lines = ['  <url>', '    <loc>' + loc + '</loc>', '    <lastmod>' + lastmod + '</lastmod>'];
  if (priority) lines.push('    <priority>' + priority + '</priority>');
  lines.push('  </url>');
  return lines.join('\n');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const { products, categories } = await loadCatalog();

  const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const page of STATIC_PAGES) {
    lines.push(urlEntry(SITE_URL + page.path, today, page.priority));
  }
  for (const c of categories) {
    lines.push(urlEntry(SITE_URL + '/shop.html?cat=' + c.slug, today, '0.7'));
  }
  for (const p of products) {
    lines.push(urlEntry(SITE_URL + '/product/' + p.id + '.html', today, '0.8'));
  }

  lines.push('</urlset>');

  await fs.writeFile(OUT_PATH, lines.join('\n') + '\n', 'utf8');
  const totalUrls = STATIC_PAGES.length + categories.length + products.length;
  console.log('✓ sitemap.xml — ' + totalUrls + ' URLs (' + STATIC_PAGES.length + ' static + ' + categories.length + ' category + ' + products.length + ' product)');
}

main().catch(err => { console.error(err); process.exit(1); });
