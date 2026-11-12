#!/usr/bin/env node
// 1.9.11 SELECTION-RING DIAGNOSTIC, ROUND 6 (final) — the band kill.
// The whole mechanism, now fully mapped:
//   · Chromium's ::selection paint REPLACES the text stroke color with the
//     selection's text color — RCS, var-baked, literal: all fall; the
//     stroke-color declaration inside ::selection is ignored too.
//   · currentColor stays late-bound even inside REGISTERED custom
//     properties, so the inverse cannot be pre-baked in CSS.
//   · The one channel ::selection honors: text-shadow (the app's own
//     0.37.0 contour) — and, to be proven here, -webkit-text-stroke-width.
// THE CANDIDATE CURE: keep the accent-ink fill (the letters answer the
// highlight like every selected text), KILL the fat band the replaced
// stroke paints (-webkit-text-stroke-width: 0 — the ring's seat stands
// EMPTY mid-highlight), and let the backdrop-colored 8-way contour carry
// the edge exactly as the 0.37.0 law already speaks it.
// This round uses a LIGHT accent-ink (#f5efe6) so the fat band reads
// unambiguously (a light band where the black ring was = the user's
// "from black to white"), and measures at FIXED coordinates.
//   X0  the app's current 1.9.10 rule            — the reversal baseline
//   X1  current + -webkit-text-stroke-width: 0   — the candidate
//   X2  current + -webkit-text-stroke: 0         — the shorthand form
//   X3  color: currentcolor + width 0 + contour  — the keep-own-ink form
//   X4  X1 exactly (duplicate seat, dark letter) — the white-ring side
import { chromium } from 'playwright';
import sharp from 'sharp';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const shadow8 = (color) =>
  `1px 0 0 ${color}, -1px 0 0 ${color}, 0 1px 0 ${color}, 0 -1px 0 ${color},
   0.7px 0.7px 0 ${color}, -0.7px 0.7px 0 ${color}, 0.7px -0.7px 0 ${color}, -0.7px -0.7px 0 ${color}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #f5efe6; --gd-bg: #101014; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  .t .rt-outline::selection { background: #808088; }

  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .rt-b.rt-outline {
    -webkit-text-stroke: 2px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .x0 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  .x1 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  .x2 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke: 0;
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  .x3 .rt-outline::selection {
    color: currentcolor;
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('var(--gd-bg)')};
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
    <div id="g-x0" class="glyph x0"><span class="rt-b rt-outline">I</span></div>
    <div id="g-x1" class="glyph x1"><span class="rt-b rt-outline">I</span></div>
    <div id="g-x2" class="glyph x2"><span class="rt-b rt-outline">I</span></div>
    <div id="g-x3" class="glyph x3"><span class="rt-b rt-outline">I</span></div>
    <div id="g-x4" class="glyph dark x1"><span class="rt-b rt-outline">I</span></div>
  </div>
</body></html>`;

// FIXED-coordinate measurement: the resting shot finds the fill boundary
// (walking left from center while the pixel is letter-colored); the ring
// window is the 4 columns left of it — the SAME columns are read in both
// shots, so resting vs selected compare pixel-for-pixel.
async function measure(page, id, coords = null) {
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
  let F;
  if (coords) {
    F = coords.F;
  } else {
    let cx = Math.floor(info.width / 2);
    const isFill = (c) => Math.abs(lum(c) - target) < 30;
    if (!isFill(line[cx])) {
      let best = -1;
      for (let d = 0; d < info.width / 2 && best < 0; d += 1) {
        if (isFill(line[cx - d])) best = cx - d;
        else if (isFill(line[cx + d])) best = cx + d;
      }
      cx = best < 0 ? cx : best;
    }
    F = cx;
    while (F > 0 && isFill(line[F - 1])) F -= 1;
  }
  const win = [];
  for (let k = 1; k <= 4; k += 1) {
    const x = F - k;
    if (x >= 0) win.push(line[x]);
  }
  const mn = win.reduce((a, c) => (lum(c) < lum(a) ? c : a), win[0]);
  const mx = win.reduce((a, c) => (lum(c) > lum(a) ? c : a), win[0]);
  return { F, win, mn, mx, fill: line[Math.min(F + 6, info.width - 1)] };
}

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);
  const ids = ['g-x0', 'g-x1', 'g-x2', 'g-x3', 'g-x4'];
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
    sel[id] = await measure(page, id, { F: rest[id].F });
  }
  await browser.close();
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  const describe = (m) => `min ${String(m.mn).padEnd(14)} max ${String(m.mx).padEnd(14)}`;
  console.log('id       RING (fixed coords)                                          | fill');
  for (const id of ids) {
    console.log(
      id.padEnd(8),
      'rest', describe(rest[id]), '-> sel', describe(sel[id]),
      '| fill rest', String(rest[id].fill).padEnd(14), '-> sel', String(sel[id].fill)
    );
  }
};

run().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
