// probe_xweight_195.mjs — the X's weight AND its flat cut, measured in the
// MASK'S OWN RASTER (the 1.9.4 probe's own lane: the tile's data URI
// rendered as an image at 4x, the loudest mark's two arms measured above
// their crossing). A 45deg stroke of width w crosses a horizontal scan as
// w*sqrt(2): the 1.9.5 law (4.8 on the 18px-step mark) reads ~27.2px at
// 4x, where the retired 1.9.4 band (4.2) read ~23.7px. And the CAPS: a
// butt cap cuts the stroke exactly at its endpoint's perpendicular — above
// the endpoint (y < 144 at 4x) the round cap's half-stroke bulge is GONE,
// the flat end speaks.
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
// w*sqrt(2) at 4x: 4.8 -> ~27.2px (the retired 1.9.4 band read ~23.7)
ok(`each arm carries the 1.9.5 weight (~22-32px at 4x)`, arms.length === 2 && arms.every((r) => r >= 22 && r <= 32), arms.join(','));
ok(`never bold (the widest run stays under 34)`, Math.max(...runs, 0) <= 34, String(Math.max(...runs, 0)));
// THE FLAT CUT — the geometry speaks: a butt cap cuts PERPENDICULAR to
// the arm (a 45deg cut), so just above the endpoint (y=140) a corner
// sliver of the stroke legitimately remains (~7px of run — the cut's own
// diagonal), but the round cap's half-stroke BULGE (a ~30px run at
// y=140, reaching up to y~130) is gone: by y=134 the butt cut has
// nothing left to say, where the round cap still spoke ~20px
const corner = scan(140).filter((r) => r >= 3);
console.log('the cut corner sliver above the endpoint (y=140):', corner.join(', ') || '(none)');
ok(`y=140 carries only the cut's corner sliver (< 14px each — the round cap spoke ~30)`, corner.length === 2 && corner.every((r) => r < 14), corner.join(','));
const gone = scan(134).filter((r) => r >= 3);
console.log('the ink above the cut last corner (y=134):', gone.join(', ') || '(none)');
ok(`y=134 is bare (the round cap's bulge reached here — ~20px runs)`, gone.length === 0, gone.join(','));
// and the arm still speaks its full weight below the cut (the stroke's own body)
const below = scan(150).filter((r) => r >= 4);
ok(`the arm's body speaks below the cut (y=150)`, below.length >= 1, below.join(','));
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
