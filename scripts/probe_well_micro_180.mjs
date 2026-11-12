#!/usr/bin/env node
// 1.8.0 MICRO-PROBE (Playwright/Chromium) — settles two engine facts before
// the well's CSS is written:
//   A. Does `border` render on ::-webkit-resizer? (the thumb's border is a
//      shipped precedent, the resizer is its own pseudo — never assume)
//   B. Does `scrollbar-gutter: stable` reserve the lane on a textarea with
//      a custom 10px ::-webkit-scrollbar (constant width with/without bar)?
//   C. Does the resizer plate paint when NO scrollbar exists (the "even if
//      hidden" half of the user's report)?
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 20px; background: #ffffff; }
  .well {
    display: block;
    width: 260px;
    height: 120px;
    margin: 0 0 30px 0;
    padding: 8px 10px;
    box-sizing: border-box;
    border: 2px solid #333333;
    border-radius: 8px;
    background: #d8d8d8;
    font: 12px/1.4 monospace;
    overflow-y: auto;
    resize: vertical;
  }
  .gutter { scrollbar-gutter: stable; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.38); border-radius: 6px; }
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
  #t1::-webkit-resizer {
    border: 1px solid rgba(255, 0, 0, 1);
    background: repeating-linear-gradient(135deg, rgba(0,0,255,0.5) 0 1px, transparent 1px 5px), transparent;
  }
  #t1 { margin-bottom: 40px; }
</style></head><body>
  <textarea id="t1" class="well" spellcheck="false">border probe — long enough line to force nothing, short content, no scrollbar needed at all here because this is only one line</textarea>
  <textarea id="short" class="well gutter" spellcheck="false">short</textarea>
  <textarea id="long" class="well gutter" spellcheck="false">line1
line2
line3
line4
line5
line6
line7
line8
line9
line10
line11
line12
line13
line14
line15</textarea>
  <textarea id="short-nog" class="well" spellcheck="false">short</textarea>
  <textarea id="long-nog" class="well" spellcheck="false">line1
line2
line3
line4
line5
line6
line7
line8
line9
line10
line11
line12
line13
line14
line15</textarea>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 700 } });
await page.setContent(html);

// --- B: scrollbar-gutter reserves the lane? ---
const widths = await page.evaluate(() => {
  const r = (id) => {
    const el = document.getElementById(id);
    return { clientWidth: el.clientWidth, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  };
  return {
    short: r('short'), long: r('long'),
    shortNoG: r('short-nog'), longNoG: r('long-nog'),
  };
});
const gutterStable = widths.short.clientWidth === widths.long.clientWidth;
const gutterDelta = widths.long.clientWidth - widths.short.clientWidth;
const noGutterDelta = widths.longNoG.clientWidth - widths.shortNoG.clientWidth;

// --- A + C: does the resizer's BORDER render, with no scrollbar? ---
const box = await page.locator('#t1').boundingBox();
const pad = 2 + 1; // page padding 20 + safety
// the resizer plate is the bottom-right 10x10 of the padding box (inside the 2px border)
const px = Math.round(box.x + box.width - 2 - 5); // plate center-x (5px into the plate)
const py = Math.round(box.y + box.height - 2 - 5); // plate center-y
const buf = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
// decode via canvas in the page itself
const b64 = buf.toString('base64');
const scan = await page.evaluate(async ({ b64, w, h }) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, w, h).data;
  const at = (x, y) => { const i = (Math.round(y) * w + Math.round(x)) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  // the plate occupies the bottom-right 10x10 inside the border:
  const plateL = w - 2 - 10, plateT = h - 2 - 10;
  const plateR = w - 2, plateB = h - 2;
  // scan the plate for RED (border ink) and BLUE (hatch) pixels
  let red = 0, blue = 0, other = 0;
  for (let y = Math.round(plateT); y < plateB; y++) {
    for (let x = Math.round(plateL); x < plateR; x++) {
      const [r, g, b] = at(x, y);
      if (r > 180 && g < 90 && b < 90) red++;
      else if (b > 120 && r < 120) blue++;
      else other++;
    }
  }
  // edge-line samples: the border should paint the plate's 4 edges
  const edge = {
    top: [], bottom: [], left: [], right: [],
  };
  for (let x = Math.round(plateL); x < plateR; x++) { edge.top.push(at(x, plateT)); edge.bottom.push(at(x, plateB - 1)); }
  for (let y = Math.round(plateT); y < plateB; y++) { edge.left.push(at(plateL, y)); edge.right.push(at(plateR - 1, y)); }
  const isRed = ([r, g, b]) => r > 180 && g < 90 && b < 90;
  const redCount = (arr) => arr.filter(isRed).length;
  return {
    plate: { red, blue, other },
    edges: {
      top: redCount(edge.top), bottom: redCount(edge.bottom),
      left: redCount(edge.left), right: redCount(edge.right),
    },
  };
}, { b64, w: Math.round(box.width), h: Math.round(box.height) });

console.log('=== B: scrollbar-gutter: stable ===');
console.log(`gutter pair:  short=${widths.short.clientWidth} long=${widths.long.clientWidth} -> stable=${gutterStable} (delta ${gutterDelta})`);
console.log(`no-gutter:    short=${widths.shortNoG.clientWidth} long=${widths.longNoG.clientWidth} -> delta ${noGutterDelta} (the disease)`);
console.log('=== A/C: resizer border renders with NO scrollbar ===');
console.log(`plate pixels: red(border)=${scan.plate.red} blue(hatch)=${scan.plate.blue} other=${scan.plate.other}`);
console.log(`edge red counts: top=${scan.edges.top} bottom=${scan.edges.bottom} left=${scan.edges.left} right=${scan.edges.right}`);
const borderRenders = scan.edges.top >= 6 && scan.edges.left >= 6 && scan.plate.red > 0;
console.log(`VERDICT border-renders=${borderRenders}, gutter-stable=${gutterStable}, resizer-paints-without-bar=${scan.plate.blue > 0 || scan.plate.red > 0}`);
await browser.close();
