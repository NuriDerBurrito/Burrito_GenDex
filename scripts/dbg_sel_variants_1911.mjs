#!/usr/bin/env node
// 1.9.11 SELECTION-RING DIAGNOSTIC — a variant matrix: which ::selection
// declaration combination actually HOLDS the inverse ring in Chromium?
// Each variant is one white-letter glyph on gray, selected, measured:
//   V1 color: currentcolor                          (alone)
//   V2 color: inherit                               (alone)
//   V3 color: currentcolor + -webkit-text-fill-color: accent-ink
//   V4 color: inherit    + -webkit-text-fill-color: accent-ink
//   V5 no color override + -webkit-text-fill-color: accent-ink
//   V6 color: currentcolor + fill via literal hex (no var)
//   V7 the OLD law (color: accent-ink + fill: accent-ink) — the flip
// Reading: resting ring (black) vs selected ring; fill resting/selected.
import { chromium } from 'playwright';
import sharp from 'sharp';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #1c1208; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .rt-b.rt-outline {
    -webkit-text-stroke: 2px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .v1 .rt-outline::selection { color: currentcolor; }
  .v2 .rt-outline::selection { color: inherit; }
  .v3 .rt-outline::selection { color: currentcolor; -webkit-text-fill-color: var(--gd-accent-ink); }
  .v4 .rt-outline::selection { color: inherit; -webkit-text-fill-color: var(--gd-accent-ink); }
  .v5 .rt-outline::selection { -webkit-text-fill-color: var(--gd-accent-ink); }
  .v6 .rt-outline::selection { color: currentcolor; -webkit-text-fill-color: #1c1208; }
  .v7 .rt-outline::selection { color: var(--gd-accent-ink); -webkit-text-fill-color: var(--gd-accent-ink); }
  body { margin: 0; background: #808088; }
  .row { display: flex; gap: 30px; padding: 20px; }
  .glyph {
    font: 900 96px/1 "DejaVu Sans", sans-serif;
    color: #ffffff;
    background: #808088;
    padding: 6px 10px;
  }
</style></head><body>
  <div class="row">
    <div id="g-v1" class="glyph v1"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v2" class="glyph v2"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v3" class="glyph v3"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v4" class="glyph v4"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v5" class="glyph v5"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v6" class="glyph v6"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v7" class="glyph v7"><span class="rt-b rt-outline">I</span></div>
  </div>
</body></html>`;

async function readRing(page, id) {
  const box = await page.locator(`#${id}`).boundingBox();
  const shot = await page.screenshot({ clip: box });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const y = Math.floor(info.height / 2);
  const px = (x) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const line = [];
  for (let x = 0; x < info.width; x += 1) line.push(px(x));
  const mid = line.slice(Math.floor(line.length * 0.3), Math.floor(line.length * 0.7));
  const counts = new Map();
  for (const c of mid) {
    const k = c.join(',');
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let fill = null;
  let fillN = 0;
  for (const [k, n] of counts) if (n > fillN) { fillN = n; fill = k.split(',').map(Number); }
  const cx = Math.floor(info.width / 2);
  const offFill = (c) => Math.abs(c[0] - fill[0]) + Math.abs(c[1] - fill[1]) + Math.abs(c[2] - fill[2]) > 120;
  let leftEdge = cx;
  while (leftEdge > 1 && !offFill(line[leftEdge - 1])) leftEdge -= 1;
  let rightEdge = cx;
  while (rightEdge < info.width - 2 && !offFill(line[rightEdge + 1])) rightEdge += 1;
  const accent = [255, 140, 66];
  const dist = (c) => Math.abs(c[0] - accent[0]) + Math.abs(c[1] - accent[1]) + Math.abs(c[2] - accent[2]);
  const pickRing = (from, dir) => {
    let best = null;
    let bestD = -1;
    for (let k = 0; k <= 4; k += 1) {
      const x = from + dir * k;
      if (x < 0 || x >= info.width) break;
      const d = dist(line[x]);
      if (d > bestD) { bestD = d; best = line[x]; }
    }
    return best;
  };
  return { fill, leftRing: pickRing(leftEdge - 1, -1), rightRing: pickRing(rightEdge + 1, 1) };
}

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);
  const ids = ['g-v1', 'g-v2', 'g-v3', 'g-v4', 'g-v5', 'g-v6', 'g-v7'];
  const rest = {};
  for (const id of ids) {
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await settle(60);
    rest[id] = await readRing(page, id);
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
    sel[id] = await readRing(page, id);
  }
  await browser.close();
  for (const id of ids) {
    console.log(
      id.padEnd(5),
      'ring rest L', String(rest[id].leftRing), 'R', String(rest[id].rightRing),
      '-> sel L', String(sel[id].leftRing), 'R', String(sel[id].rightRing),
      '| fill rest', String(rest[id].fill), '-> sel', String(sel[id].fill)
    );
  }
};

run().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
