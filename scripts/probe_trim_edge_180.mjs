#!/usr/bin/env node
// 1.8.0 PIXEL PROBE (Playwright/Chromium) — ONE BAND AT THE EDGE ("the trim
// on the right side seems to have the trim effect overlay duplicated once
// more inwards, hovering mid image"): verifies, on real Chromium + the real
// index.css, that every family's over-trim wash hugs the RIGHT edge of its
// own coat box exactly as it hugs the left — no second band floating a
// tile-width inward.
//   GEOMETRY NOTE: percentages in mask-position resolve against the coat
//   span's OWN box (self-relative — flush at 100% whatever the span's true
//   width), so the probe measures the span's own rect and speaks every seat
//   in span-relative coordinates (W = the span's measured width).
//   Method A (every family): the family shapes are mirror-symmetric by
//   construction — count the washed pixels in the LEFT 10px strip vs the
//   RIGHT 10px strip across the art zone; the pre-fix duplicate band broke
//   the mirror badly, the fix restores it.
//   Method B (clean families): pointed seats — the TRUE band's seat must
//   wash, the OLD duplicate's heart must stay raw.
// Run: node probe_trim_edge_180.mjs [css-path]
//   (default: the 180 tree — pass the 179 path to watch it FAIL, proving
//   the probe catches the very disease the report named.)
import { readFileSync, writeFileSync } from 'node:fs';

const CSS_PATH = process.argv[2] || '/home/z/my-project/burrito_gendex_180/src/index.css';
const CSS = readFileSync(CSS_PATH, 'utf8');

const FAMS = ['dash', 'double', 'bold', 'ledger', 'frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet', 'none'];

const CARD = (id, fam) => `
  <div id="${id}" class="gd-card gd-has-finish gd-fin-on-trim gd-fin-under-art" style="position:absolute; width:300px;">
    <span id="fin_${id}" class="gd-card-face-finish is-plate-only is-over-trim" style="--gd-fin-ph: 0.5; --gd-art-h: 160px; background: rgba(255,0,0,0.55);"></span>
    <div class="probe-sleeve" style="position:relative; height:160px; border-radius: 8px;">
      <div class="gd-sleeve-clip" style="position:absolute; inset:0; overflow:hidden; border-radius: inherit; background: rgb(0,170,60);"></div>
      <div class="gd-sleeve-deco" style="position:absolute; inset:0;">
        ${fam && fam !== 'none' ? `<span class="gd-trim gd-trim-${fam}"></span>` : ''}
      </div>
    </div>
    <div class="probe-foot" style="height:80px; background: rgb(0,170,60);"></div>
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${CSS.replace(/@tailwind[^;]+;/g, '')}</style>
<style>
  body { margin: 0; background: #0f0f0f; --gd-shape-radius: 10px; --gd-radius: 10px; }
</style></head><body>
${FAMS.map((f, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return CARD(`card_${f}`, f).replace(
    'style="position:absolute; width:300px;"',
    `style="position:absolute; left:${16 + col * 316}px; top:${8 + row * 246}px; width:300px;"`
  );
}).join('\n')}
</body></html>`;

writeFileSync('/tmp/probe_trim_edge_180.html', html);

const { chromium } = await import('/home/z/.npm-global/lib/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });
await page.goto('file:///tmp/probe_trim_edge_180.html');
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
await page.waitForTimeout(250);
const shot = await page.screenshot();
const dataUrl = `data:image/png;base64,${shot.toString('base64')}`;

const ART_H = 160;
// pointed seats, expressed as offsets FROM THE RIGHT EDGE of the span
// (r = W - x), [r, y, 'red'|'raw'] — the TRUE band's seat + the OLD dup's heart
const POINTED_R = {
  dash: [[3, 42, 'red'], [4, 42, 'raw']], // the 1px run sits at r 3-4
  double: [[3, 80, 'red'], [5, 80, 'red'], [5, 6, 'red']], // both runs + the TR annulus ring (dx 5, dy -5 -> r 7.07, on the [7,8] arc)
  bold: [[4, 80, 'red'], [7, 80, 'raw']], // the 3px run at r 3-6; the old dup at r 6-9
  ledger: [[9, 80, 'raw'], [9, 80, 'raw']],
  frame: [[2, 80, 'red'], [9, 80, 'raw'], [5, 5, 'red']], // the band + the old dup heart + the TR stud
  gallery: [[1, 80, 'red'], [4, 80, 'raw']], // the seal at r 0-3; the old dup at r 3-6
  scallop: [[0, 80, 'red'], [6, 80, 'raw']], // the seal at r 0-2.5; r=6 is past both the main arc (r<=6.1 only at the mid row) and the echo — air at the mid row
  gold: [[2, 80, 'red'], [8, 80, 'raw']], // the band at r 0-6; the old dup at r 6-12
  vine: [[1, 80, 'red']], // the stem band at r 0-4 (the old dup zone now carries the leaves — symmetry carries the verdict)
  beads: [[0, 80, 'red']], // the seal at r 0-3 (the pearls crowd the inner zone — symmetry carries the verdict)
  rivet: [[0, 80, 'red']], // the seal at r 0-2.5 (the domes crowd the inner zone — symmetry carries the verdict)
};

const payload = await page.evaluate(async ({ dataUrl, FAMS, ART_H, pointedR }) => {
  const img = new Image();
  await new Promise((res) => { img.onload = res; img.src = dataUrl; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const isRed = (x, y) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return d[0] > d[1] + 30 && d[0] > d[2] + 30;
  };
  const out = {};
  for (const f of FAMS) {
    const fin = document.getElementById(`fin_card_${f}`);
    const r = fin.getBoundingClientRect();
    const ox = Math.round(r.left);
    const oy = Math.round(r.top);
    const W = Math.round(r.width);
    let leftCount = 0;
    let rightCount = 0;
    for (let y = 0; y < ART_H; y += 1) {
      for (let x = 0; x < 10; x += 1) if (isRed(ox + x, oy + y)) leftCount += 1;
      for (let x = W - 10; x < W; x += 1) if (isRed(ox + x, oy + y)) rightCount += 1;
    }
    const pts = (pointedR[f] || []).map(([rr, y, want]) => {
      const x = W - 1 - rr; // r=0 -> the last integer column (W-1)
      return [rr, y, want, isRed(ox + x, oy + y)];
    });
    out[f] = { leftCount, rightCount, W, pts };
  }
  return out;
}, { dataUrl, FAMS, ART_H, pointedR: POINTED_R });

await browser.close();

const results = [];
const check = (name, cond, detail) => {
  results.push({ name, ok: !!cond });
  console.log(`  ${cond ? 'ok' : 'FAIL'} — ${name} ${detail}`);
};

console.log(`\n1.8.0 right-edge probe — ONE BAND AT THE EDGE (${CSS_PATH.includes('_179') ? 'the PRE-FIX css — the disease must show' : 'the 180 css'}):\n`);

for (const f of FAMS) {
  const { leftCount, rightCount, W, pts } = payload[f];
  const tol = Math.max(14, 0.16 * Math.max(leftCount, rightCount));
  const sym = Math.abs(leftCount - rightCount) <= tol;
  check(`${f} — the right edge mirrors the left (no duplicate band)`, sym,
    `left=${leftCount} right=${rightCount} (tol ${tol.toFixed(0)}, W=${W})`);
  for (const [r, y, want, gotRed] of pts) {
    check(`${f} — pointed seat (r=${r}, y=${y}) ${want === 'red' ? 'washed' : 'raw'}`, gotRed === (want === 'red'),
      `got=${gotRed ? 'washed' : 'raw'}`);
  }
}

const bad = results.filter((r) => !r.ok).length;
console.log(`\n${bad === 0 ? 'ALL GREEN' : `${bad} FAILURES`} — ${results.length} checks`);
process.exit(bad === 0 ? 0 : 1);
