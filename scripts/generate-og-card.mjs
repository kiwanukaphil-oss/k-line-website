/* ============================================================================
   K-LINE MEN — Open Graph card generator
   Composes a 1200×630 og-card.jpg from the navy-suit hero shot, a left-side
   dark gradient panel for legibility, and SVG text/accent overlays. Used as
   og:image on the homepage and any non-PDP page; PDPs keep the product photo
   as og:image so social previews show the actual product.
   Run: npm run generate:og
   ============================================================================ */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_HERO = path.join(ROOT, 'assets', 'images', 'suits', 'suits-001.png');
const OUT = path.join(ROOT, 'og-card.jpg');

const W = 1200;
const H = 630;

const PANEL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"  stop-color="#111827" stop-opacity="0.96"/>
      <stop offset="48%" stop-color="#111827" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#111827" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- Bronze hairline matches the eyebrow accent used across the site -->
  <line x1="80" y1="244" x2="240" y2="244" stroke="#a67845" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// Georgia (serif) and Arial (sans) are present on every major OS where sharp
// might run, so we don't depend on Manrope/Cormorant being system-installed
// the way they are in the browser via Google Fonts.
const TEXT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="80" y="220" fill="#d9c0a2" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="18" letter-spacing="4">MODERN MENSWEAR · KAMPALA</text>
  <text x="80" y="370" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="92">K-LINE MEN</text>
  <text x="80" y="440" fill="#d9c0a2" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="500" font-size="42">Real Men. Real Style.</text>
  <text x="80" y="540" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="16" letter-spacing="3" opacity="0.78">SHIRTS · SUITS · BLAZERS · SHOES · DELIVERED ACROSS UGANDA</text>
</svg>`;

async function main() {
  const productBuf = await sharp(SRC_HERO)
    .resize(W, H, { fit: 'cover', position: 'right top' })
    .modulate({ brightness: 0.94 })
    .toBuffer();

  await sharp(productBuf)
    .composite([
      { input: Buffer.from(PANEL_SVG), top: 0, left: 0 },
      { input: Buffer.from(TEXT_SVG),  top: 0, left: 0 }
    ])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(OUT);

  const stat = await fs.stat(OUT);
  console.log(`✓ og-card.jpg (${(stat.size / 1024).toFixed(1)} KB) — 1200×630, ready for og:image`);
}

main().catch(err => { console.error(err); process.exit(1); });
