#!/usr/bin/env node
// 1.9.11 SELECTION-RING DIAGNOSTIC, ROUND 3 — clean measurement.
// The round-1/2 sampler was biased (it picked "furthest from accent"
// pixels, which favor dark antialias edges and misread light rings), so
// every verdict was suspect. This round removes the confound entirely:
// the test variants' ::selection paints the PAGE GRAY as its background
// (same gray as the page), so the ONLY visible change under selection is
// the glyph's own paint — fill and ring. The ring is then measured at
// FIXED coordinates (the resting shot locates the ring window beside the
// fill boundary; the selected shot reads the same window):
//   held  -> the window's extreme pixel keeps its resting value
//   flip  -> the window's extreme pixel moves to bg-gray / the far end
// Variants:
//   V8   registered --rt-ink bake (element sets --rt-ink: currentcolor;
//        stroke = rgb(from var(--rt-ink) inverse)) — white + dark letters
//   V9   the same shape UNREGISTERED (late-bound token) — the control
//   V11  registered bake + ::selection pins -webkit-text-stroke-color
//        from the same baked var
//   V12  the OLD law (the 1.9.10 rule) — the flip baseline
//   Vbare no scoped ::selection at all (the global alone) — the app's
//        fallback behavior
import { chromium } from 'playwright';
import sharp from 'sharp';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @property --rt-ink {
    syntax: '<color>';
    inherits: true;
    initial-value: #ffffff;
  }
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #1c1208; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  /* every test variant's selection paints the PAGE GRAY background —
     the glyph's own paint is the only visible change */
  .t .rt-outline::selection { background: #808088; }

  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .v12 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
  }
  .v9 .rt-outline { --rt-ink9: currentcolor; }
  .v9 .rt-outline {
    -webkit-text-stroke: 2px rgb(from var(--rt-ink9, currentColor) calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .bake .rt-outline { --rt-ink: currentcolor; }
  .bake .rt-outline {
    -webkit-text-stroke: 2px rgb(from var(--rt-ink) calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .v11 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke-color: rgb(from var(--rt-ink) calc(255 - r) calc(255 - g) calc(255 - b));
  }

  body { margin: 0; background: #808088; }
  .row { display: flex; gap: 30px; padding: 20px; }
  .glyph {
    font: 900 96px/1 "DejaVu Sans", sans-serif;
    color: #ffffff;
    background: #808088;
    padding: 6px 10px;
  }
  .glyph.dark { color: #101014; }
</style></head><body>
  <div class="row t">
    <div id="g-v8" class="glyph bake v8"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v8-dark" class="glyph dark bake v8"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v9" class="glyph v9"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v11" class="glyph bake v11"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v12" class="glyph v12"><span class="rt-b rt-outline">I</span></div>
    <div id="g-bare" class="glyph bare"><span class="rt-b rt-outline">I</span></div>
  </div>
</body></html>`;

// measure the ring at FIXED coordinates: the resting shot locates the
// fill boundary (first column whose mid-height pixel is the fill), then
// the ring window = the 4 columns left of it; the darkest (white-letter
// seats) / lightest (dark-letter seats) pixel in that window is the ring
async function measure(page, id, rest) {
  const box = await page.locator(`#${id}`).boundingBox();
  const shot = await page.screenshot({ clip: box });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const y = Math.floor(info.height / 2);
  const px = (x) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  const line = [];
  for (let x = 0; x < info.width; x += 1) line.push(px(x));
  // the fill boundary: the widest run of pixels within 25 lum of the
  // element's KNOWN letter color (white 255 / dark 16), scanned from the
  // center outward to the left edge of the run
  const darkLetter = id.endsWith('-dark');
  const target = darkLetter ? 16 : 255;
  const isFill = (c) => Math.abs(lum(c) - target) < 30;
  let cx = Math.floor(info.width / 2);
  if (!isFill(line[cx])) {
    // the center missed the stem (antialias) — walk to the nearest fill
    let best = -1;
    for (let d = 0; d < info.width / 2 && best < 0; d += 1) {
      if (isFill(line[cx - d])) best = cx - d;
      else if (isFill(line[cx + d])) best = cx + d;
    }
    cx = best < 0 ? cx : best;
  }
  let leftEdge = cx;
  while (leftEdge > 0 && isFill(line[leftEdge - 1])) leftEdge -= 1;
  // the ring window: 4 columns left of the fill boundary
  const win = [];
  for (let k = 1; k <= 4; k += 1) {
    const x = leftEdge - k;
    if (x >= 0) win.push(line[x]);
  }
  const extreme = darkLetter
    ? win.reduce((a, c) => (lum(c) > lum(a) ? c : a), win[0])
    : win.reduce((a, c) => (lum(c) < lum(a) ? c : a), win[0]);
  // the fill sample (the center pixel)
  return { ring: extreme, fill: line[cx], leftEdge };
}

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);
  const ids = ['g-v8', 'g-v8-dark', 'g-v9', 'g-v11', 'g-v12', 'g-bare'];
  const rest = {};
  for (const id of ids) {
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await settle(60);
    rest[id] = await measure(page, id, true);
  }
  const sel = {};
  for (const id of ids) {
    await page.evaluate((one) => {
      const s = window.getSelection();
      s.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(document.getElementById(one));
      s.addRange(r);
    }, id);
    await settle(90);
    sel[id] = await measure(page, id, false);
  }
  await browser.close();
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  for (const id of ids) {
    const r = rest[id].ring;
    const s = sel[id].ring;
    const moved = Math.abs(lum(r) - lum(s));
    console.log(
      id.padEnd(10),
      'ring rest', String(r).padEnd(14),
      '-> sel', String(s).padEnd(14),
      moved < 25 ? 'HELD' : 'MOVED',
      `(${moved.toFixed(0)} lum)`,
      '| fill rest', String(rest[id].fill).padEnd(14), '-> sel', String(sel[id].fill)
    );
  }
};

run().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
