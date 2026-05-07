/* ============================================================================
   K-LINE MEN — Favicon + footer-logo generator
   Produces every brand-mark variant the site needs from the single Logo.png:
     /favicon-16.png         16×16 (browser tab fallback)
     /favicon-32.png         32×32 (modern browser tab)
     /apple-touch-icon.png  180×180 (iOS home screen)
     /icon-192.png          192×192 (Android / PWA)
     /icon-512.png          512×512 (PWA splash)
     /Logo-footer.webp      ~220px tall, transparent bg, white mark only
   Run with: npm run generate:favicons
   ============================================================================ */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'Logo.png');

// Favicons render against light *and* dark browser tabs; matching the brand
// (white-on-black square) reads as confident and premium across both. fit:contain
// preserves the wordmark instead of cropping sides like fit:cover would.
const FAVICONS = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 }
];

async function makeFavicon(target) {
  const out = path.join(ROOT, target.name);
  await sharp(SRC)
    .resize(target.size, target.size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .png({ compressionLevel: 9 })
    .toFile(out);
  const stat = await fs.stat(out);
  console.log(`✓ ${target.name} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Source Logo.png is opaque white-on-black RGB. To drop the CSS
// `mix-blend-mode: screen` hack in the footer, we project the source luminance
// (roughly: how "white" each pixel is) into the alpha channel of a new image
// whose RGB is forced to pure white. Result: a transparent-background, white-
// only mark that drops onto any dark footer at any opacity without artefacts.
async function makeFooterLogo() {
  const targetHeight = 220;
  const { data, info } = await sharp(SRC)
    .resize({ height: targetHeight })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = info.width * info.height;
  const out = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    // Rec.601 luminance — close enough for a near-grayscale source.
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    out[i * 4]     = 255;
    out[i * 4 + 1] = 255;
    out[i * 4 + 2] = 255;
    out[i * 4 + 3] = lum;
  }

  const outPath = path.join(ROOT, 'Logo-footer.webp');
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(outPath);
  const stat = await fs.stat(outPath);
  console.log(`✓ Logo-footer.webp (${(stat.size / 1024).toFixed(1)} KB) — transparent bg, drops mix-blend hack`);
}

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Source: Logo.png — ${meta.width}×${meta.height}, ${meta.channels}ch, alpha=${meta.hasAlpha}`);
  console.log('');
  for (const target of FAVICONS) await makeFavicon(target);
  await makeFooterLogo();
}

main().catch(err => { console.error(err); process.exit(1); });
