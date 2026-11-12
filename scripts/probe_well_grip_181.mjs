#!/usr/bin/env node
// 1.8.1 PIXEL-PROBE (Playwright/Chromium) — settles the grip's new law on
// a real engine before the version ships:
//   A. Does the CAPSULE render — the translucent fill + the hatch over it,
//      with NO drawn border ring anywhere on the plate? (the 1.8.0 square
//      frame is the control: its border must paint where the capsule's
//      edges stay bare)
//   B. Does border-radius speak on ::-webkit-resizer? (the plate's extreme
//      corner pixels must read as the FIELD's own gray — rounded out —
//      while the center carries the seat)
//   C. Does the capsule paint with NO scrollbar riding the lane (the
//      "even if hidden" carry-over from the 1.8.0 report)?
// Engine facts this probe also pins: the scrollbar IS 10px (the lane the
// gutter reserves) yet the resizer PLATE is Chromium's own ~15x15 — the
// grip's footprint, measured live, never assumed.
// The colors are probe-loud on purpose: GREEN fill at 14%, BLUE hatch
// strokes at 32%, RED border on the 1.8.0 control — over a #d8d8d8 field.
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 20px; background: #ffffff; }
  .well {
    display: block;
    width: 260px;
    height: 120px;
    margin: 0 0 40px 0;
    padding: 8px 10px;
    box-sizing: border-box;
    border: 2px solid #333333;
    border-radius: 8px;
    background: #d8d8d8;
    font: 12px/1.4 monospace;
    overflow-y: auto;
    resize: vertical;
    scrollbar-gutter: stable;
  }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.38); border-radius: 6px; }
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
  /* the 1.8.1 capsule, probe-loud: rounded translucent seat + hatch, NO border */
  #capsule::-webkit-resizer {
    border-radius: 4px;
    background:
      repeating-linear-gradient(135deg, rgba(0,0,255,0.32) 0 1px, transparent 1px 5px),
      rgba(0,128,0,0.14);
  }
  /* the 1.8.0 frame, the control: a hard 1px square border */
  #frame::-webkit-resizer {
    border: 1px solid rgba(255,0,0,1);
    background: repeating-linear-gradient(135deg, rgba(0,0,255,0.32) 0 1px, transparent 1px 5px), transparent;
  }
  /* the capsule WITH a scrollbar riding the lane above it (the both-states law) */
  #capsule-bar::-webkit-resizer {
    border-radius: 4px;
    background:
      repeating-linear-gradient(135deg, rgba(0,0,255,0.32) 0 1px, transparent 1px 5px),
      rgba(0,128,0,0.14);
  }
</style></head><body>
  <textarea id="capsule" class="well" spellcheck="false">capsule probe — one short line, no scrollbar needed here at all, the plate alone must speak</textarea>
  <textarea id="frame" class="well" spellcheck="false">frame control — one short line, the 1.8.0 square border must paint its ring</textarea>
  <textarea id="capsule-bar" class="well" spellcheck="false">line1
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

// a 22x22 window on the inner bottom-right corner; the plate is measured
// live from the tinted coverage (Chromium's own resizer footprint)
const WIN = 22;
const scan = async (id) => {
  const box = await page.locator('#' + id).boundingBox();
  const buf = await page.screenshot({ clip: { x: box.x + box.width - 2 - WIN, y: box.y + box.height - 2 - WIN, width: WIN, height: WIN } });
  const b64 = buf.toString('base64');
  return await page.evaluate(async ({ b64, w, h }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, w, h).data;
    const at = (x, y) => { const i = (Math.round(y) * w + Math.round(x)) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    const isRed = ([r, g, b]) => r > 180 && g < 90 && b < 90;
    const isBlue = ([r, g, b]) => b > r + 40;
    const isGreen = ([r, g, b]) => g > r + 8 && g > b + 8;
    const isGray = ([r, g, b]) => Math.abs(r - 216) < 14 && Math.abs(g - 216) < 14 && Math.abs(b - 216) < 14;
    const tinted = (p) => isGreen(p) || isBlue(p) || isRed(p);
    // measure the plate: columns/rows whose tinted coverage reaches the
    // plate's own body (the 1.8.0 control's border-only columns carry < 3)
    let red = 0, blue = 0, green = 0;
    const colHits = new Array(w).fill(0);
    const rowHits = new Array(h).fill(0);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = at(x, y);
        if (isRed(p)) red++;
        else if (isBlue(p)) blue++;
        else if (isGreen(p)) green++;
        if (tinted(p)) { colHits[x]++; rowHits[y]++; }
      }
    }
    let plateL = -1, plateR = -1, plateT = -1, plateB = -1;
    for (let x = 0; x < w; x++) if (colHits[x] >= 4) { if (plateL < 0) plateL = x; plateR = x; }
    for (let y = 0; y < h; y++) if (rowHits[y] >= 4) { if (plateT < 0) plateT = y; plateB = y; }
    const size = plateL >= 0 ? { w: plateR - plateL + 1, h: plateB - plateT + 1 } : { w: 0, h: 0 };
    // the plate's extreme corner pixel + its 2px-in neighbor + the center
    const corner = plateL >= 0 ? at(plateL, plateT) : null;
    const inner2 = plateL >= 0 ? at(plateL + 2, plateT + 2) : null;
    const center = plateL >= 0 ? at(plateL + Math.floor(size.w / 2), plateT + Math.floor(size.h / 2)) : null;
    return {
      counts: { red, blue, green },
      plate: { ...size, present: plateL >= 0 },
      corner: { px: corner, gray: corner ? isGray(corner) : false },
      inner2: { px: inner2, tinted: inner2 ? (isGreen(inner2) || isBlue(inner2)) : false },
      center: { px: center, tinted: center ? (isGreen(center) || isBlue(center)) : false },
    };
  }, { b64, w: WIN, h: WIN });
};

const capsule = await scan('capsule');
const frame = await scan('frame');
const capsuleBar = await scan('capsule-bar');

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok — ${name}`); }
  else { fail++; console.log(`  FAIL — ${name}${detail ? ' — ' + detail : ''}`); }
};

console.log('A. THE CAPSULE RENDERS, THE FRAME RETIRES');
check('A1 — the 1.8.0 control paints its red border ring (the probe sees borders)',
  frame.counts.red > 25, JSON.stringify(frame.counts));
check('A2 — the capsule paints zero border pixels',
  capsule.counts.red === 0, JSON.stringify(capsule.counts));
check('A3 — the capsule speaks its translucent fill (green present)',
  capsule.counts.green > 100, JSON.stringify(capsule.counts));
check('A4 — the hatch strokes ride over the fill (blue present)',
  capsule.counts.blue > 4, JSON.stringify(capsule.counts));

console.log('B. THE RADIUS SPEAKS ON THE RESIZER');
check('B0 — the plate measured live (Chromium\'s own resizer footprint)',
  capsule.plate.present && capsule.plate.w >= 10 && capsule.plate.h >= 10, JSON.stringify(capsule.plate));
check('B1 — the plate\'s extreme corner reads the field\'s own gray (rounded out)',
  capsule.corner.gray, JSON.stringify(capsule.corner.px));
check('B2 — 2px in from the corner, the seat carries (the arc\'s inside)',
  capsule.inner2.tinted, JSON.stringify(capsule.inner2.px));
check('B3 — the plate\'s center carries the seat (tinted)',
  capsule.center.tinted, JSON.stringify(capsule.center.px));

console.log('C. THE CAPSULE PAINTS WITH THE BAR RIDING THE LANE');
check('C1 — scrollbar present, the capsule still speaks (fill + hatch)',
  capsuleBar.counts.green > 100 && capsuleBar.counts.blue > 4, JSON.stringify(capsuleBar.counts));
check('C2 — scrollbar present, still no border ring',
  capsuleBar.counts.red === 0, JSON.stringify(capsuleBar.counts));
check('C3 — scrollbar present, the corner still rounds out (gray)',
  capsuleBar.corner.gray, JSON.stringify(capsuleBar.corner.px));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
