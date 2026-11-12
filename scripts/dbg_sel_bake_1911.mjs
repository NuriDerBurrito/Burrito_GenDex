#!/usr/bin/env node
// 1.9.11 SELECTION-RING DIAGNOSTIC, ROUND 2 — the registered-ink bake.
// Round 1 proved NO color-declaration trick holds the ring (currentcolor,
// inherit, fill-color pins — the stroke's currentColor always re-reads the
// selection-merged color). The remaining candidate: bake the letter's own
// ink into a REGISTERED custom property (@property, <color> syntax — the
// value substitutes at computed time on the element, BEFORE any
// ::selection style exists), and derive the ring from the baked var:
//   V8  registered --rt-ink, element sets --rt-ink: currentcolor,
//       stroke = rgb(from var(--rt-ink) inverse)          — the candidate
//   V9  same but UNREGISTERED (late-bound tokens)         — the control
//   V10 registered, stroke via var, letter colors VARY (white/dark/red)
//        — the bake must follow each element's own color
//   V11 registered + the ::selection override ALSO pins
//       -webkit-text-stroke-color from the same baked var — double seat
//   V12 the OLD law again (the flip baseline for this run)
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

  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  /* V9 — the UNREGISTERED control (its --rt-ink9 is a late-bound token) */
  .v9 .rt-outline { --rt-ink9: currentcolor; }
  .v9 .rt-outline {
    -webkit-text-stroke: 2px rgb(from var(--rt-ink9, currentColor) calc(255 - r) calc(255 - g) calc(255 - b));
  }
  /* V8/V10/V11 — the REGISTERED bake */
  .bake .rt-outline { --rt-ink: currentcolor; }
  .bake .rt-outline {
    -webkit-text-stroke: 2px rgb(from var(--rt-ink) calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .v11 .rt-outline::selection {
    background: var(--gd-accent);
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
  .glyph.red { color: #e03030; }
</style></head><body>
  <div class="row">
    <div id="g-v8" class="glyph bake v8"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v8-dark" class="glyph dark bake v8"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v9" class="glyph v9"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v10-red" class="glyph red bake v10"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v11" class="glyph bake v11"><span class="rt-b rt-outline">I</span></div>
    <div id="g-v12" class="glyph v12"><span class="rt-b rt-outline">I</span></div>
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);
  const ids = ['g-v8', 'g-v8-dark', 'g-v9', 'g-v10-red', 'g-v11', 'g-v12'];
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
      id.padEnd(10),
      'ring rest L', String(rest[id].leftRing).padEnd(14), 'R', String(rest[id].rightRing).padEnd(14),
      '-> sel L', String(sel[id].leftRing).padEnd(14), 'R', String(sel[id].rightRing).padEnd(14),
      '| fill rest', String(rest[id].fill).padEnd(14), '-> sel', String(sel[id].fill)
    );
  }
};

run().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
