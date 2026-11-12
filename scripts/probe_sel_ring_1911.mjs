#!/usr/bin/env node
// 1.9.11 SELECTION-RING PROBE (Playwright/Chromium + sharp) — settles the
// mechanism of "when i select the text 'ALL cards , X cards' on the top
// bar, cards in the card viewer with the text bolded/outlined would have
// their outline reverse in color, from black to white or from white to
// black, it shouldnt do so" BEFORE the cure is written, and proves the
// cure after — the house's own law (probe first, then code).
//
// The probe replicates the app's own seats verbatim (the global
// ::selection, the .rt-outline / .rt-b.rt-outline inverse-ring laws, the
// .rt-outline::selection override, and the .gd-card-title:has(.rt-outline)
// truncation mirror) on one page — in BOTH accent-ink families, because
// the report speaks both directions ("from black to white or from white
// to black"): a DARK accent-ink (the light-cloth themes, where a white
// letter's black ring flips toward white) and a LIGHT accent-ink (the
// dark-cloth themes, where a dark letter's white ring flips toward
// black). Then:
//   · screenshots the resting glyph,
//   · paints the OS selection over it (a real Range + Selection, exactly
//     the drag that sweeps the toolbar label into the card wall),
//   · screenshots again,
//   · reads the RING pixels off both shots (a scanline across a fat 'I'
//     stem: background / ring / fill / ring / background) and compares.
//
// Verdicts:
//   A. OLD LAW  — resting ring vs selected ring: the reported flip must
//      REPRODUCE here, or the whole theory is wrong (both directions).
//   B. MIRROR   — the :has() title mirror's ring under the GLOBAL
//      ::selection color override: same flip, same root.
//   C. CURED    — the 1.9.11 law (the ::selection state keeps the
//      letter's own ink as its color source, so the inverse ring's
//      currentColor never re-derives mid-highlight; the fill still
//      answers the highlight like every selected text): the ring must
//      HOLD in both families, and the fill must still darken.
import { chromium } from 'playwright';
import sharp from 'sharp';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// the app's own law shapes, verbatim from index.css — parameterized by the
// accent-ink family (dark ink on the light cloths, light ink on the dark)
const baseCss = (accentInk) => `
  :root {
    --gd-bg: #101014;
    --gd-chrome: #f2efe9;
    --gd-accent: #ff8c42;
    --gd-accent-ink: ${accentInk};
  }
  ::selection {
    background: var(--gd-accent);
    color: var(--gd-accent-ink);
  }
  .rt-outline {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .rt-b.rt-outline {
    -webkit-text-stroke: 2px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
  }
  .gd-card-title:has(.rt-outline) {
    -webkit-text-stroke: 1.5px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
`;
// the OLD selection override — the 0.37.0/1.1.8 seat as shipped in 1.9.10
const OLD_SEL_CSS = `
  .old .rt-outline::selection {
    background: var(--gd-accent);
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
  }
`;
// the CURED selection override — the 1.9.11 law: the ::selection state
// keeps the letter's OWN ink as its color (currentcolor on a pseudo
// inherits the originating element's color), never the accent-ink, so
// the inverse ring's currentColor source never moves mid-highlight —
// while the fill still answers the highlight exactly as before
const NEW_SEL_CSS = `
  .cured .rt-outline::selection {
    background: var(--gd-accent);
    color: currentcolor;
    -webkit-text-fill-color: var(--gd-accent-ink);
  }
  .cured .gd-card-title:has(.rt-outline)::selection {
    color: currentcolor;
  }
`;

const stage = (scope, family, accentInk) => `
  <div class="stage ${scope} ${family}" style="--gd-accent-ink:${accentInk}">
    <div class="row">
      <div id="${family}-${scope}" class="glyph"><span class="rt-b rt-outline">I</span></div>
      <div id="${family}-${scope}-dark" class="glyph dark"><span class="rt-b rt-outline">I</span></div>
      <div id="${family}-${scope}-mirror" class="glyph gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    </div>
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${baseCss('#1c1208')}
${OLD_SEL_CSS}
${NEW_SEL_CSS}
  body { margin: 0; background: #808088; }
  .stage { margin: 20px; }
  .stage .row { display: flex; align-items: flex-start; gap: 40px; }
  .glyph {
    font: 900 96px/1 "DejaVu Sans", sans-serif;
    letter-spacing: 0;
    color: #ffffff;
    background: #808088;
    padding: 6px 10px;
  }
  .glyph.dark { color: #101014; }
</style></head><body>
${stage('old', 'darkink', '#1c1208')}
${stage('cured', 'darkink', '#1c1208')}
${stage('old', 'lightink', '#f5efe6')}
${stage('cured', 'lightink', '#f5efe6')}
</body></html>`;

// ring reader: a scanline across the glyph's stem at mid-height —
// returns the ring colors found left and right of the fill band
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
  // the fill: the modal color of the middle 40% of the line
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
  // the ring band sits just outside the fill edge; the selection paints the
  // accent behind it — the ring sample is the pixel FURTHEST from the
  // accent among the 4px walking outward (black or white both sit far
  // from the orange; the orange itself sits at zero distance)
  const accent = [255, 140, 66];
  const dist = (c) => Math.abs(c[0] - accent[0]) + Math.abs(c[1] - accent[1]) + Math.abs(c[2] - accent[2]);
  const pickRing = (from, dir) => {
    let best = null;
    let bestD = -1;
    for (let k = 0; k <= 3; k += 1) {
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
  const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await settle(250);

  const ids = ['darkink-old', 'darkink-old-dark', 'darkink-old-mirror', 'darkink-cured', 'darkink-cured-dark', 'darkink-cured-mirror',
    'lightink-old', 'lightink-old-dark', 'lightink-old-mirror', 'lightink-cured', 'lightink-cured-dark', 'lightink-cured-mirror'];

  // the selection is painted ONE ELEMENT AT A TIME — Chromium paints a
  // single Range honestly, while a multi-range addRange pile paints
  // unpredictably; per-element loops keep every verdict deterministic
  const snap = async (select) => {
    const out = {};
    for (const id of ids) {
      if (select) {
        await page.evaluate((one) => {
          const sel = window.getSelection();
          sel.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(document.getElementById(one));
          sel.addRange(range);
        }, id);
        await settle(90);
      } else {
        await page.evaluate(() => window.getSelection().removeAllRanges());
        await settle(90);
      }
      out[id] = await readRing(page, id);
    }
    await page.evaluate(() => window.getSelection().removeAllRanges());
    return out;
  };

  const rest = await snap(false);
  const sel = await snap(true);

  const lum = (c) => (c ? (c[0] + c[1] + c[2]) / 3 : -1);
  const flip = (a, b) => Math.abs(lum(a) - lum(b)) > 60;
  const held = (a, b) => !flip(a, b);
  const fam = {
    darkink: 'dark accent-ink (light cloths)',
    lightink: 'light accent-ink (dark cloths)',
  };

  // A. the OLD law — the reported flip must reproduce, both directions
  check(
    'A1 — OLD law / dark-ink family: the white letter resting ring is BLACK',
    lum(rest['darkink-old'].leftRing) < 70 && lum(rest['darkink-old'].rightRing) < 70,
    `L${rest['darkink-old'].leftRing} R${rest['darkink-old'].rightRing}`
  );
  check(
    'A2 — OLD law / dark-ink family under selection: the ring REVERSES black->light (the report reproduces)',
    flip(rest['darkink-old'].leftRing, sel['darkink-old'].leftRing) || flip(rest['darkink-old'].rightRing, sel['darkink-old'].rightRing),
    `L${rest['darkink-old'].leftRing} R${rest['darkink-old'].rightRing} -> L${sel['darkink-old'].leftRing} R${sel['darkink-old'].rightRing}`
  );
  check(
    'A3 — OLD law / light-ink family: the dark letter resting ring is WHITE',
    lum(rest['lightink-old-dark'].leftRing) > 185 || lum(rest['lightink-old-dark'].rightRing) > 185,
    `L${rest['lightink-old-dark'].leftRing} R${rest['lightink-old-dark'].rightRing}`
  );
  check(
    'A4 — OLD law / light-ink family under selection: the dark letter ring REVERSES white->dark (the report\'s other direction)',
    flip(rest['lightink-old-dark'].leftRing, sel['lightink-old-dark'].leftRing) || flip(rest['lightink-old-dark'].rightRing, sel['lightink-old-dark'].rightRing),
    `L${rest['lightink-old-dark'].leftRing} R${rest['lightink-old-dark'].rightRing} -> L${sel['lightink-old-dark'].leftRing} R${sel['lightink-old-dark'].rightRing}`
  );

  // B. the mirror — the :has() title seat flips through the GLOBAL override
  check(
    'B1 — MIRROR seat under selection: the lent ring reverses through the global ::selection color (dark-ink family)',
    flip(rest['darkink-old-mirror'].leftRing, sel['darkink-old-mirror'].leftRing) || flip(rest['darkink-old-mirror'].rightRing, sel['darkink-old-mirror'].rightRing),
    `L${rest['darkink-old-mirror'].leftRing} R${rest['darkink-old-mirror'].rightRing} -> L${sel['darkink-old-mirror'].leftRing} R${sel['darkink-old-mirror'].rightRing}`
  );

  // C. the CURED law — the ring must HOLD under the same selection
  for (const family of ['darkink', 'lightink']) {
    check(
      `C-${fam[family]} — CURED white letter: resting ring BLACK, and it HOLDS under selection`,
      lum(rest[`${family}-cured`].leftRing) < 70 &&
        held(rest[`${family}-cured`].leftRing, sel[`${family}-cured`].leftRing) &&
        held(rest[`${family}-cured`].rightRing, sel[`${family}-cured`].rightRing),
      `L${rest[`${family}-cured`].leftRing} R${rest[`${family}-cured`].rightRing} -> L${sel[`${family}-cured`].leftRing} R${sel[`${family}-cured`].rightRing}`
    );
    check(
      `C-${fam[family]} — CURED dark letter: resting ring WHITE, and it HOLDS under selection`,
      (lum(rest[`${family}-cured-dark`].leftRing) > 185 || lum(rest[`${family}-cured-dark`].rightRing) > 185) &&
        held(rest[`${family}-cured-dark`].leftRing, sel[`${family}-cured-dark`].leftRing) &&
        held(rest[`${family}-cured-dark`].rightRing, sel[`${family}-cured-dark`].rightRing),
      `L${rest[`${family}-cured-dark`].leftRing} R${rest[`${family}-cured-dark`].rightRing} -> L${sel[`${family}-cured-dark`].leftRing} R${sel[`${family}-cured-dark`].rightRing}`
    );
  }
  // the cured MIRROR — the lent ring holds through the same cure
  check(
    'C5 — CURED MIRROR seat under selection: the lent ring HOLDS (dark-ink family)',
    held(rest['darkink-cured-mirror'].leftRing, sel['darkink-cured-mirror'].leftRing) &&
      held(rest['darkink-cured-mirror'].rightRing, sel['darkink-cured-mirror'].rightRing),
    `L${rest['darkink-cured-mirror'].leftRing} R${rest['darkink-cured-mirror'].rightRing} -> L${sel['darkink-cured-mirror'].leftRing} R${sel['darkink-cured-mirror'].rightRing}`
  );
  // the fill still answers the highlight — the letters darken like every
  // other selected text (the 0.37.0 fill law survives the cure)
  check(
    'C4 — CURED white letter under selection: the FILL still paints the accent-ink (the highlight still answers)',
    lum(sel['darkink-cured'].fill) < 90,
    `fill ${sel['darkink-cured'].fill}`
  );

  await browser.close();
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} checks passing`);
  process.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  process.exit(1);
});
