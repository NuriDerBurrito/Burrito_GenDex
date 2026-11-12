#!/usr/bin/env node
// 1.9.11 SELECTION-RING GROUND TRUTH (round 7) — pure-pixel verdicts.
// The 96px rounds drowned in antialiasing; this round renders 300px glyphs
// with 8px strokes so the ring band is a FAT PURE region (4px outside the
// fill edge — pixel F-3 is deep inside it, zero antialias), and reads ONE
// pixel per state. Every seat, both accent-ink families:
//   S1  .rt-outline run, GLOBAL ::selection only (no scoped rule)
//   S2  .rt-outline run, the app's CURRENT 1.9.10 scoped rule
//   S3  .rt-outline run, the CANDIDATE cure (accent-ink fill + width 0 +
//       the backdrop contour)
//   S4  the :has() TITLE MIRROR, global only (never cleanly tested — the
//       whole title line's lent ring, the seat the card wall actually
//       paints around outlined titles)
//   S5  the mirror + the candidate mirror cure (width 0)
// Verdict per seat: band pixel rest vs selected — HELD / PAINTED-INK /
// GONE (bg gray). The user's report = the band painting the accent-ink.
import { chromium } from 'playwright';
import sharp from 'sharp';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const shadow8 = (color) =>
  `1px 0 0 ${color}, -1px 0 0 ${color}, 0 1px 0 ${color}, 0 -1px 0 ${color},
   0.7px 0.7px 0 ${color}, -0.7px 0.7px 0 ${color}, 0.7px -0.7px 0 ${color}, -0.7px -0.7px 0 ${color}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #1c1208; --gd-bg: #101014; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  .litink { --gd-accent-ink: #f5efe6; }
  /* every seat's selection paints the page gray — glyph paint is the
     only visible change (the selection background never confounds) */
  .t ::selection { background: #808088; }

  .rt-outline {
    -webkit-text-stroke: 8px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .gd-card-title:has(.rt-outline) {
    -webkit-text-stroke: 8px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  /* S2 — the app's current rule */
  .s2 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  /* S3 — the candidate cure */
  .s3 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  /* S5 — the mirror's candidate cure */
  .s5.gd-card-title::selection,
  .s5 .gd-card-title::selection {
    -webkit-text-stroke-width: 0;
  }

  body { margin: 0; background: #808088; }
  .row { display: flex; gap: 40px; padding: 30px; align-items: flex-start; }
  .glyph {
    font: 900 300px/1 "DejaVu Sans", sans-serif;
    color: #ffffff;
    background: #808088;
    padding: 10px 20px;
  }
  .glyph.dark { color: #101014; }
</style></head><body>
  <div class="row t">
    <div id="d-s1" class="glyph s1"><span class="rt-outline">I</span></div>
    <div id="d-s2" class="glyph s2"><span class="rt-outline">I</span></div>
    <div id="d-s3" class="glyph s3"><span class="rt-outline">I</span></div>
    <div id="d-s4" class="glyph gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="d-s5" class="glyph s5 gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
  </div>
  <div class="row t litink">
    <div id="l-s1" class="glyph s1"><span class="rt-outline">I</span></div>
    <div id="l-s2" class="glyph s2"><span class="rt-outline">I</span></div>
    <div id="l-s3" class="glyph s3"><span class="rt-outline">I</span></div>
    <div id="l-s4" class="glyph gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="l-s5" class="glyph s5 gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
  </div>
</body></html>`;

// pure-pixel read: F = leftmost fill column at mid-height (walk from the
// center while the pixel is the letter's color); the band sample = F-3
// (deep inside the 8px stroke's 4px outer half — pure paint, no blend)
async function bandPixel(page, id, F = null) {
  const box = await page.locator(`#${id}`).boundingBox();
  const shot = await page.screenshot({ clip: box });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const y = Math.floor(info.height / 2);
  const px = (x) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  if (F == null) {
    let cx = Math.floor(info.width / 2);
    const isFill = (c) => lum(c) > 235; // white letter fill (both families rest white)
    if (!isFill(px(cx))) {
      let best = -1;
      for (let d = 0; d < info.width / 2 && best < 0; d += 1) {
        if (isFill(px(cx - d))) best = cx - d;
        else if (isFill(px(cx + d))) best = cx + d;
      }
      cx = best < 0 ? cx : best;
    }
    F = cx;
    while (F > 0 && isFill(px(F - 1))) F -= 1;
  }
  return { F, band: px(F - 3), fill: px(Math.floor(info.width / 2)) };
}

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1900, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(300);
  const ids = ['d-s1', 'd-s2', 'd-s3', 'd-s4', 'd-s5', 'l-s1', 'l-s2', 'l-s3', 'l-s4', 'l-s5'];
  const rest = {};
  for (const id of ids) {
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await settle(70);
    rest[id] = await bandPixel(page, id);
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
    await settle(110);
    sel[id] = await bandPixel(page, id, rest[id].F);
  }
  await browser.close();
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  const verdict = (r, s, family) => {
    const ink = family === 'l' ? [245, 239, 230] : [28, 18, 8];
    const isInk = Math.abs(s[0] - ink[0]) < 25 && Math.abs(s[1] - ink[1]) < 25 && Math.abs(s[2] - ink[2]) < 25;
    const isBg = Math.abs(s[0] - 128) < 10 && Math.abs(s[1] - 128) < 10;
    if (isInk) return 'PAINTED-INK (the reversal)';
    if (isBg) return 'GONE (the band died — bg shows)';
    if (Math.abs(lum(r) - lum(s)) < 25) return 'HELD';
    return 'CHANGED';
  };
  for (const fam of ['d', 'l']) {
    const label = fam === 'd' ? 'dark accent-ink #1c1208' : 'light accent-ink #f5efe6';
    console.log(`\n== ${label} ==`);
    for (const seat of ['s1', 's2', 's3', 's4', 's5']) {
      const id = `${fam}-${seat}`;
      console.log(
        `  ${seat}  band rest`, String(rest[id].band).padEnd(14),
        '-> sel', String(sel[id].band).padEnd(14),
        verdict(rest[id].band, sel[id].band, fam),
        '| fill rest', String(rest[id].fill).padEnd(14), '-> sel', String(sel[id].fill)
      );
    }
  }
};

run().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
