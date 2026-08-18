/**
 * Convert all public/img PNGs to WebP at maximum visual quality.
 *
 * Images that actually USE transparency (any pixel alpha < 255)
 *   → lossless WebP  (bit-exact, perfect for logos / stickers / overlays)
 * Images with only fully-opaque pixels (alpha channel but no real transparency)
 *   → lossy WebP quality 92  (visually identical to PNG, far smaller)
 *
 * Run once:  node _convert-webp.mjs
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const SRC_DIR = 'public/img';
const files   = (await readdir(SRC_DIR))
  .filter(f => /\.(png|jpe?g)$/i.test(f));

let saved = 0;
let total = 0;

/** Return true only if the image contains at least one genuinely-transparent pixel. */
async function hasRealAlpha(src) {
  const img  = sharp(src);
  const meta = await img.metadata();
  if (!meta.hasAlpha) return false;

  // Extract just the alpha channel and check whether any value < 255.
  const { data } = await img
    .extractChannel('alpha')
    .raw()
    .toBuffer({ resolveWithObject: true });

  return data.some(v => v < 255);
}

for (const file of files) {
  const src  = join(SRC_DIR, file);
  const dest = join(SRC_DIR, basename(file, extname(file)) + '.webp');
  const realAlpha = await hasRealAlpha(src);

  const img = sharp(src);
  let encoder;
  if (realAlpha) {
    // True transparency — lossless preserves exact pixels.
    encoder = img.webp({ lossless: true });
  } else {
    // Opaque image — lossy q92 looks indistinguishable but is far smaller.
    encoder = img.flatten({ background: { r: 255, g: 255, b: 255 } })
                 .webp({ quality: 92, effort: 6 });
  }

  const [srcStat, buf] = await Promise.all([stat(src), encoder.toBuffer()]);
  await sharp(buf).toFile(dest);

  const srcKB  = Math.round(srcStat.size / 1024);
  const destKB = Math.round(buf.length / 1024);
  const saving = srcKB - destKB;
  saved += saving;
  total += srcKB;

  const mode = realAlpha ? 'lossless' : 'q92';
  const pct  = saving > 0 ? `-${Math.round(saving/srcKB*100)}%` : `+${Math.round(-saving/srcKB*100)}%`;
  console.log(`${file.padEnd(38)} ${mode.padEnd(9)} ${srcKB}KB → ${destKB}KB  (${pct})`);
}

console.log(`\nTotal: ${Math.round(total/1024)}MB → saved ${Math.round(saved/1024)}MB  (new total ${Math.round((total-saved)/1024)}MB)`);
