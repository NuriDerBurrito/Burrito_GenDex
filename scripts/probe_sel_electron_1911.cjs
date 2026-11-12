#!/usr/bin/env node
// 1.9.11 SELECTION-RING PROBE — IN THE APP'S OWN ELECTRON (42.9.3).
// The Playwright rounds mapped the mechanism on a newer Chromium, but the
// app renders through ITS OWN engine — this probe is the ground truth the
// cure must answer to. Run with:
//   node_modules/electron/dist/electron scripts/probe_sel_electron_1911.cjs
// Seats (300px glyphs, 8px strokes — the ring band is a fat PURE region,
// pixel F-3 is deep inside it), both accent-ink families:
//   S1  .rt-outline run, GLOBAL ::selection only (no scoped rule)
//   S2  .rt-outline run, the app's CURRENT 1.9.10 scoped rule
//   S3  candidate A: accent-ink fill + -webkit-text-stroke-width: 0 +
//       the backdrop contour (letters answer the highlight, band dies)
//   S6  candidate B: color: currentcolor + width 0 + contour (the text
//       keeps its OWN ink mid-highlight — nothing about it changes)
//   S4  the :has() TITLE MIRROR, global only
//   S5  mirror + width 0 (candidate A mirror)
//   S7  mirror + currentcolor + width 0 (candidate B mirror)
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const shadow8 = (color) =>
  `1px 0 0 ${color}, -1px 0 0 ${color}, 0 1px 0 ${color}, 0 -1px 0 ${color},
   0.7px 0.7px 0 ${color}, -0.7px 0.7px 0 ${color}, 0.7px -0.7px 0 ${color}, -0.7px -0.7px 0 ${color}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --gd-accent: #ff8c42; --gd-accent-ink: #1c1208; --gd-bg: #101014; }
  ::selection { background: var(--gd-accent); color: var(--gd-accent-ink); }
  .litink { --gd-accent-ink: #f5efe6; }
  .t ::selection { background: #808088; }

  .rt-outline {
    -webkit-text-stroke: 8px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .gd-card-title:has(.rt-outline) {
    -webkit-text-stroke: 8px rgb(from currentColor calc(255 - r) calc(255 - g) calc(255 - b));
    paint-order: stroke fill;
  }
  .s2 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  .s3 .rt-outline::selection {
    color: var(--gd-accent-ink);
    -webkit-text-fill-color: var(--gd-accent-ink);
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  /* S6 — the SHIPPED 1.9.11 law, verbatim */
  .s6 .rt-outline::selection {
    background: var(--gd-accent);
    color: currentcolor;
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('var(--gd-bg)')};
  }
  .s5.gd-card-title::selection { -webkit-text-stroke-width: 0; }
  /* S7 — the SHIPPED mirror law, verbatim (both floors) */
  .s7.gd-card-title::selection,
  .s7.gd-card-title *::selection { color: currentcolor; -webkit-text-stroke-width: 0; }
  .s8 .rt-outline::selection {
    color: currentcolor;
    -webkit-text-stroke-width: 0;
    text-shadow: ${shadow8('#ff0000')};
  }

  body { margin: 0; background: #808088; }
  .row { display: flex; gap: 40px; padding: 30px; align-items: flex-start; }
  .glyph {
    font: 900 300px/1 "DejaVu Sans", sans-serif;
    color: #ffffff;
    background: #808088;
    padding: 10px 20px;
  }
</style></head><body>
  <div class="row t">
    <div id="d-s1" class="glyph s1"><span class="rt-outline">I</span></div>
    <div id="d-s2" class="glyph s2"><span class="rt-outline">I</span></div>
    <div id="d-s3" class="glyph s3"><span class="rt-outline">I</span></div>
    <div id="d-s6" class="glyph s6"><span class="rt-outline">I</span></div>
    <div id="d-s4" class="glyph gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="d-s5" class="glyph s5 gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="d-s7" class="glyph s7 gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="d-s8" class="glyph s8"><span class="rt-outline">I</span></div>
  </div>
  <div class="row t litink">
    <div id="l-s1" class="glyph s1"><span class="rt-outline">I</span></div>
    <div id="l-s2" class="glyph s2"><span class="rt-outline">I</span></div>
    <div id="l-s3" class="glyph s3"><span class="rt-outline">I</span></div>
    <div id="l-s6" class="glyph s6"><span class="rt-outline">I</span></div>
    <div id="l-s4" class="glyph gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="l-s5" class="glyph s5 gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="l-s7" class="glyph s7 gd-card-title"><span>I</span><span class="rt-outline" style="display:none">I</span></div>
    <div id="l-s8" class="glyph s8"><span class="rt-outline">I</span></div>
  </div>
</body></html>`;

// fixed-coordinate band measurement, run inside the renderer
const MEASURE = (id, F) => {
  const el = document.getElementById(id);
  const box = el.getBoundingClientRect();
  // paint the element alone into a canvas at 1x via the engine's own
  // rasterizer is not available — the capture happens outside; here we
  // only resolve geometry
  return { box: { x: box.x, y: box.y, w: box.width, h: box.height }, F: F ?? null };
};

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false,
    width: 1900,
    height: 820,
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  const tmpHtml = path.join(os.tmpdir(), 'sel_ring_1911.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(400);

  const ids = [];
  for (const fam of ['d', 'l']) for (const seat of ['s1', 's2', 's3', 's6', 's4', 's5', 's7', 's8']) ids.push(`${fam}-${seat}`);

  const boxes = JSON.parse(
    await win.webContents.executeJavaScript(
      `JSON.stringify(Object.fromEntries(${JSON.stringify(ids)}.map((id) => {
        const b = document.getElementById(id).getBoundingClientRect();
        return [id, { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }];
      })))`
    )
  );

  const readSeat = async (id, F) => {
    const b = boxes[id];
    const img = await win.webContents.capturePage({ x: b.x, y: b.y, width: b.w, height: b.h });
    const size = img.getSize();
    const bmp = img.getBitmap(); // BGRA, row-major
    const px = (x, y) => {
      const i = (y * size.width + x) * 4;
      return [bmp[i + 2], bmp[i + 1], bmp[i]]; // back to RGB
    };
    const y = Math.floor(size.height / 2);
    const lum = (c) => (c[0] + c[1] + c[2]) / 3;
    const line = [];
    for (let x = 0; x < size.width; x += 1) line.push(px(x, y));
    let FF = F;
    if (FF == null) {
      let cx = Math.floor(size.width / 2);
      const isFill = (c) => lum(c) > 235;
      if (!isFill(line[cx])) {
        let best = -1;
        for (let d = 0; d < size.width / 2 && best < 0; d += 1) {
          if (isFill(line[cx - d])) best = cx - d;
          else if (isFill(line[cx + d])) best = cx + d;
        }
        cx = best < 0 ? cx : best;
      }
      FF = cx;
      while (FF > 0 && isFill(line[FF - 1])) FF -= 1;
    }
    let red = 0;
    for (let yy = Math.floor(size.height * 0.3); yy < Math.floor(size.height * 0.7); yy += 1) {
      for (let xx = 0; xx < size.width; xx += 1) {
        const c = px(xx, yy);
        if (c[0] > 150 && c[1] < 90 && c[2] < 90) red += 1;
      }
    }
    return { F: FF, band: line[FF - 3], fill: line[Math.floor(size.width / 2)], red };
  };

  const rest = {};
  for (const id of ids) {
    await win.webContents.executeJavaScript(`window.getSelection().removeAllRanges()`);
    await settle(80);
    rest[id] = await readSeat(id, null);
  }
  const sel = {};
  for (const id of ids) {
    await win.webContents.executeJavaScript(`(() => {
      const s = window.getSelection();
      s.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(document.getElementById(${JSON.stringify(id)}));
      s.addRange(r);
    })()`);
    await settle(140);
    sel[id] = await readSeat(id, rest[id].F);
  }

  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  const verdict = (r, s, fam) => {
    const ink = fam === 'l' ? [245, 239, 230] : [28, 18, 8];
    const isInk = Math.abs(s[0] - ink[0]) < 25 && Math.abs(s[1] - ink[1]) < 25 && Math.abs(s[2] - ink[2]) < 25;
    const isBg = Math.abs(s[0] - 128) < 12 && Math.abs(s[1] - 128) < 12 && Math.abs(s[2] - 136) < 14;
    if (isInk) return 'PAINTED-INK (reversal)';
    if (isBg) return 'GONE (band absent)';
    if (Math.abs(lum(r) - lum(s)) < 30) return 'HELD';
    return 'CHANGED';
  };
  for (const fam of ['d', 'l']) {
    const label = fam === 'd' ? 'dark accent-ink #1c1208' : 'light accent-ink #f5efe6';
    console.log(`\n== ${label} ==`);
    for (const seat of ['s1', 's2', 's3', 's6', 's4', 's5', 's7', 's8']) {
      const id = `${fam}-${seat}`;
      console.log(
        `  ${seat}  band rest`, String(rest[id].band).padEnd(14),
        '-> sel', String(sel[id].band).padEnd(14),
        verdict(rest[id].band, sel[id].band, fam),
        '| fill rest', String(rest[id].fill).padEnd(14), '-> sel', String(sel[id].fill),
        `| redpx rest ${rest[id].red} -> sel ${sel[id].red}`
      );
    }
  }
  // the verdict: the shipped law must hold its ink (the fill never moves)
  // and the contour channel must paint; the old law must show the disease
  const verdicts = [
    ['the OLD law shows the disease (dark-ink family: the letters flip)', lum(sel['d-s2'].fill) < 90],
    ['the OLD law shows the disease (light-ink family: the letters flip)', lum(sel['l-s2'].fill) > 200],
    ['the SHIPPED law holds the letters\' own ink (dark-ink family)', Math.abs(lum(rest['d-s6'].fill) - lum(sel['d-s6'].fill)) < 10],
    ['the SHIPPED law holds the letters\' own ink (light-ink family)', Math.abs(lum(rest['l-s6'].fill) - lum(sel['l-s6'].fill)) < 10],
    ['the SHIPPED mirror holds the letters\' own ink (both floors, dark-ink family)', Math.abs(lum(rest['d-s7'].fill) - lum(sel['d-s7'].fill)) < 10],
    ['the contour channel paints in the app\'s own engine (the red shadow proof)', sel['d-s8'].red > 50 && rest['d-s8'].red === 0],
  ];
  let bad = 0;
  for (const [name, okV] of verdicts) {
    console.log(`${okV ? 'PASS' : 'FAIL'}  ${name}`);
    if (!okV) bad += 1;
  }
  console.log(`\nverdict: ${verdicts.length - bad}/${verdicts.length} laws hold`);
  app.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  app.exit(1);
});
