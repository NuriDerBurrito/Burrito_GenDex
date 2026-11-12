// probe_xweight_194.mjs — the X's weight, measured in the MASK'S OWN
// RASTER (the 1.9.3 speaking-coat probe's own lane: the tile's data URI
// rendered as an image at 4x, the loudest mark's two arms measured above
// their crossing). A 45deg stroke of width w crosses a horizontal scan
// as w*sqrt(2): the 1.9.4 law (4.2 on the 18px-step mark) reads ~5.9px
// at 1x / ~23.7px at 4x, where the retired 1.9.3 floor (2.4) read
// ~13.6px at 4x. Semi-thick, never bold.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(root, '..', 'src/index.css'), 'utf8');

// the near loom's own tile, pulled from the sheet
const block = /\.gd-numeix-xmarks::before \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
const uri = /url\("(data:image\/svg\+xml,[^"]+)"\)/.exec(block)?.[1] || '';
if (!uri) {
  console.log('FAIL — the near loom\'s mask tile never spoke');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #000; }
  img { display: block; width: 560px; height: 1680px; image-rendering: auto; }
</style></head><body><img src="${uri.replace(/"/g, '&quot;')}"></body></html>`;
await page.setContent(html);
await page.waitForTimeout(400);
const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 560, height: 300 } });
await browser.close();

const sharp = (await import('sharp')).default;
const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });

// the loudest mark spans (20,36)-(38,54) at 1x -> (80,144)-(152,216) at
// 4x: scan ABOVE the crossing (y=160) where the two arms read as two
// separate runs — arm A near x=96, arm B near x=136.
let passed = 0;
let failed = 0;
const ok = (name, cond, detail = '') => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? 'ok' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
};
const scan = (y) => {
  let runs = [];
  let run = 0;
  for (let x = 60; x < 180; x += 1) {
    const i = (y * info.width + x) * info.channels;
    const on = data[i] > 60; // the stroke paints at ~0.62*255 = 158
    if (on) run += 1;
    else if (run) { runs.push(run); run = 0; }
  }
  if (run) runs.push(run);
  return runs;
};
const runs = scan(160);
const arms = runs.filter((r) => r >= 10);
console.log('ink runs above the crossing (y=160):', runs.join(', '));
ok(`the scan sees TWO arms`, arms.length === 2, runs.join(','));
// w*sqrt(2) at 4x: 4.2 -> ~23.7px (the retired 1.9.3 floor read ~13.6)
ok(`each arm carries the full weight (~19-29px at 4x)`, arms.length === 2 && arms.every((r) => r >= 19 && r <= 29), arms.join(','));
ok(`never bold (the widest run stays under 30)`, Math.max(...runs, 0) <= 30, String(Math.max(...runs, 0)));
// and a second mark (span 14px, sw 3.6 -> ~20.3px at 4x) speaks the
// proportion law at its own smaller seat: (102,120)-(116,134) -> y=130·4=... scan y=508? out of clip;
// use the 20px-span mark (54,226)-(74,246) -> (216,904)-(296,984): out of the 300px clip — the
// proportion is pinned at the source by the 195 suite; the raster speaks the loudest mark alone.
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
