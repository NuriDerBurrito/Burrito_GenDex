#!/usr/bin/env node
// 1.9.11 SELECTION-RING DIAGNOSTIC, ROUND 5 — the shadow channel.
// Rounds 1-4 proved: Chromium's ::selection paint REPLACES the text
// stroke color with the selection color — currentColor-derived, var-baked,
// even a hard literal all fall to it, and -webkit-text-stroke-color in the
// ::selection rule is ignored. The one channel ::selection is documented
// to honor (and the app's own 0.37.0 rule already uses): TEXT-SHADOW.
// This round asks three questions:
//   W0  what does the app's CURRENT ::selection (color+fill accent-ink +
//       the 8-way --gd-bg shadow) paint mid-highlight? (the baseline)
//   W1  does a LITERAL-colored 8-way shadow paint mid-highlight? (the
//       channel works at all)
//   W2  does a REGISTERED var-baked inverse (--rt-ring, RCS resolved at
//       computed time) reach the ::selection shadow as a definite color?
//   W3  does -webkit-text-stroke-width: 0 in the ::selection rule kill
//       the fat accent-ink band the replaced stroke paints?
// Gray selection backgrounds again; fixed-coordinate ring measurement.
import { chromium } from 'playwright';
import sharp from 'sharp';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const shadow8 = (color) =>
  `1px 0 0 ${color}, -1px 0 0 ${color}, 0 1px 0 ${color}, 0 -1px 0 ${color},
   0.7px 0.7px 0 ${color}, -0.7px 0.7px 0 ${color}, 0.7px -0.7px 0 ${color}, -0.7px -0.7px 0 ${color}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @property --rt-ring {
    syntax: '<color>';
    inherits: true;
    initial-value: #ffffff;
  }
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #1c1208; --gd-bg: #101014; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  .t .rt-outline::selection { background: #808088; }

  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  /* W0 — the app's own 1.9.10 rule (the baseline) */
  .w0 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  /* W1 — a LITERAL black shadow ring mid-highlight */
  .w1 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    text-shadow: ${shadow8('#000000')};
  }
  /* W2 — the registered baked inverse reaching the shadow */
  .w2 .rt-outline {
    --rt-ring: rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .w2 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    text-shadow: ${shadow8('var(--rt-ring)')};
  }
  /* W3 — W1 + the width kill */
  .w3 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('#000000')};
  }

  body { margin: 0; background: #808088; }
  .row { display: flex; gap: 30px; padding: 20px; }
  .glyph {
    font: 900 96px/1 "DejaVu Sans", sans-serif;
    color: #ffffff;
    background: #808088;
    padding: 6px 10px;
  }
</style></head><body>
  <div class="row t">
    <div id="g-w0" class="glyph w0"><span class="rt-b rt-outline">I</span></div>
    <div id="g-w1" class="glyph w1"><span class="rt-b rt-outline">I</span></div>
    <div id="g-w2" class="glyph w2"><span class="rt-b rt-outline">I</span></div>
    <div id="g-w3" class="glyph w3"><span class="rt-b rt-outline">I</span></div>
  </div>
</body></html>`;

// fixed-coordinate ring measurement — here the "ring" region extends a
// little further out (the shadow contour paints 1px beyond the stroke)
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
  const isFill = (c) => lum(c) < 60 || Math.abs(lum(c) - 255) < 20; // white rest / accent-ink sel
  // find the fill band around the center: the widest dark-or-white run
  let cx = Math.floor(info.width / 2);
  const band = (c) => lum(c) < 90 || lum(c) > 235; // strong paint (fill or fat stroke)
  let leftEdge = cx;
  while (leftEdge > 0 && band(line[leftEdge - 1])) leftEdge -= 1;
  const win = [];
  for (let k = 1; k <= 6; k += 1) {
    const x = leftEdge - k;
    if (x >= 0) win.push(line[x]);
  }
  const darkest = win.reduce((a, c) => (lum(c) < lum(a) ? c : a), win[0]);
  const lightest = win.reduce((a, c) => (lum(c) > lum(a) ? c : a), win[0]);
  return { darkest, lightest, fill: line[cx], win };
}

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);
  const ids = ['g-w0', 'g-w1', 'g-w2', 'g-w3'];
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
    console.log(
      id.padEnd(6),
      'rest darkest', String(rest[id].darkest).padEnd(14), 'lightest', String(rest[id].lightest).padEnd(14),
      '-> sel darkest', String(sel[id].darkest).padEnd(14), 'lightest', String(sel[id].lightest).padEnd(14),
      '| fill rest', String(rest[id].fill).padEnd(14), '-> sel', String(sel[id].fill)
    );
  }
};

run().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
