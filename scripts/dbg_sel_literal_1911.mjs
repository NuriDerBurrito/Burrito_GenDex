#!/usr/bin/env node
// 1.9.11 SELECTION-RING DIAGNOSTIC, ROUND 4 — the literal test.
// Round 3 proved: under ::selection (any color override), the stroke
// paints THE SELECTION COLOR — the RCS inversion vanishes, the baked-var
// path (V8) is ignored. The decisive question now: does a LITERAL stroke
// color survive the selection paint? If yes, a registered-var-baked
// LITERAL (computed at element style time) can hold the inverse ring.
//   V-lit    literal black stroke (no currentColor anywhere)
//   V-bake2  registered --rt-ring = the RCS inverse, stroke = var(--rt-ring)
//            (the RCS resolves at COMPUTED time on a registered <color> —
//            the stroke's computed value should be a definite literal)
//   V-bake2-dark  the same, dark letter (the baked ring is white)
//   V-selpin ::selection pins -webkit-text-stroke-color to a LITERAL
//   V-old    the OLD law — the flip baseline (selection color ring)
// All selections paint the page gray background; the ring is measured at
// fixed coordinates (round 3's clean harness).
import { chromium } from 'playwright';
import sharp from 'sharp';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @property --rt-ring {
    syntax: '<color>';
    inherits: true;
    initial-value: #ffffff;
  }
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #1c1208; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  .t .rt-outline::selection { background: #808088; }

  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .v-old .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
  }
  .v-lit .rt-outline {
    -webkit-text-stroke: 2px #000000;
  }
  .v-lit .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
  }
  .bake2 .rt-outline {
    --rt-ring: rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    -webkit-text-stroke: 2px var(--rt-ring);
  }
  .bake2 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
  }
  .v-selpin .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke-color: #000000;
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
    <div id="g-lit" class="glyph v-lit"><span class="rt-b rt-outline">I</span></div>
    <div id="g-bake2" class="glyph bake2"><span class="rt-b rt-outline">I</span></div>
    <div id="g-bake2-dark" class="glyph dark bake2"><span class="rt-b rt-outline">I</span></div>
    <div id="g-selpin" class="glyph v-selpin"><span class="rt-b rt-outline">I</span></div>
    <div id="g-old" class="glyph v-old"><span class="rt-b rt-outline">I</span></div>
  </div>
</body></html>`;

async function measure(page, id) {
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
  const darkLetter = id.endsWith('-dark');
  const target = darkLetter ? 16 : 255;
  const isFill = (c) => Math.abs(lum(c) - target) < 30;
  let cx = Math.floor(info.width / 2);
  if (!isFill(line[cx])) {
    let best = -1;
    for (let d = 0; d < info.width / 2 && best < 0; d += 1) {
      if (isFill(line[cx - d])) best = cx - d;
      else if (isFill(line[cx + d])) best = cx + d;
    }
    cx = best < 0 ? cx : best;
  }
  let leftEdge = cx;
  while (leftEdge > 0 && isFill(line[leftEdge - 1])) leftEdge -= 1;
  const win = [];
  for (let k = 1; k <= 4; k += 1) {
    const x = leftEdge - k;
    if (x >= 0) win.push(line[x]);
  }
  const extreme = darkLetter
    ? win.reduce((a, c) => (lum(c) > lum(a) ? c : a), win[0])
    : win.reduce((a, c) => (lum(c) < lum(a) ? c : a), win[0]);
  return { ring: extreme, fill: line[cx] };
}

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);
  const ids = ['g-lit', 'g-bake2', 'g-bake2-dark', 'g-selpin', 'g-old'];
  const rest = {};
  for (const id of ids) {
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await settle(60);
    rest[id] = await measure(page, id);
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
    sel[id] = await measure(page, id);
  }
  await browser.close();
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  for (const id of ids) {
    const r = rest[id].ring;
    const s = sel[id].ring;
    const moved = Math.abs(lum(r) - lum(s));
    console.log(
      id.padEnd(12),
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
