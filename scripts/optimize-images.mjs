/* ============================================================================
   K-LINE MEN — Image optimizer
   Walks assets/images/ and produces three WebP variants per PNG:
     <name>-400.webp  → mobile cards, thumbnails
     <name>-800.webp  → desktop cards, retina mobile
     <name>.webp      → PDP / hero full-size (capped at 1200w)
   Skips files where every output is newer than the source.
   Run with: npm run optimize:images
   ============================================================================ */

import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');

const VARIANTS = [
  { suffix: '-400', width: 400, quality: 78 },
  { suffix: '-800', width: 800, quality: 80 },
  { suffix: '',     width: 1200, quality: 82 } // capped full-size
];

let totalIn = 0;
let totalOut = 0;
let converted = 0;
let skipped = 0;

async function walk(dir) {
  // Recursively yield every .png file under dir.
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else if (entry.isFile() && /\.png$/i.test(entry.name)) out.push(p);
  }
  return out;
}

async function isUpToDate(srcPath, outputPaths) {
  // Skip work if every output exists and is newer than the source.
  try {
    const srcStat = await fs.stat(srcPath);
    for (const out of outputPaths) {
      const outStat = await fs.stat(out).catch(() => null);
      if (!outStat || outStat.mtimeMs < srcStat.mtimeMs) return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

async function processOne(srcPath) {
  // Convert one PNG into the three WebP variants. Smaller variants are
  // resized down; the full-size variant is only resized if larger than 1200w.
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, '.png');
  const outputs = VARIANTS.map(v => path.join(dir, `${base}${v.suffix}.webp`));

  if (await isUpToDate(srcPath, outputs)) {
    skipped++;
    return;
  }

  const srcStat = await fs.stat(srcPath);
  totalIn += srcStat.size;

  // Read once, branch into pipelines.
  const buffer = await fs.readFile(srcPath);
  const meta = await sharp(buffer).metadata();
  const srcWidth = meta.width || 0;

  for (let i = 0; i < VARIANTS.length; i++) {
    const v = VARIANTS[i];
    const targetWidth = Math.min(v.width, srcWidth);
    const pipeline = sharp(buffer).webp({ quality: v.quality, effort: 5 });
    if (targetWidth && targetWidth < srcWidth) pipeline.resize({ width: targetWidth });
    await pipeline.toFile(outputs[i]);
    const outStat = await fs.stat(outputs[i]);
    totalOut += outStat.size;
  }

  converted++;
  const rel = path.relative(ROOT, srcPath);
  process.stdout.write(`✓ ${rel}\n`);
}

async function main() {
  console.log(`Scanning ${IMAGES_DIR}…`);
  const files = await walk(IMAGES_DIR);
  console.log(`Found ${files.length} PNG${files.length === 1 ? '' : 's'}.\n`);

  for (const file of files) {
    try {
      await processOne(file);
    } catch (err) {
      console.error(`✗ ${path.relative(ROOT, file)}: ${err.message}`);
    }
  }

  const mb = b => (b / 1024 / 1024).toFixed(1) + ' MB';
  console.log('');
  console.log(`Converted: ${converted}   Skipped (up-to-date): ${skipped}`);
  if (totalIn > 0) {
    const saved = totalIn - totalOut;
    const pct = ((saved / totalIn) * 100).toFixed(0);
    console.log(`Source PNG total: ${mb(totalIn)}`);
    console.log(`WebP variants total: ${mb(totalOut)}`);
    console.log(`Bytes saved: ${mb(saved)} (${pct}%)`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
