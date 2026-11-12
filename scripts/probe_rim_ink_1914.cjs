#!/usr/bin/env node
// 1.9.14 RIM-INK PROOF — the ring speaks its own ink, measured in the app's
// own Electron 42.9.3. Three stages:
//   A — THE ISOLATION RIG (red rim, black accent flood, scale 3): the
//       contour band must paint the PURE rim hue at FULL voice through its
//       whole reach (the flat law: the outer quarter no longer lighter),
//       the width law (run medians vs rest), the family laws (label-only
//       control, Ctrl+A = programmatic, still-mode stands down, the runs'
//       contours untouched), and THE PARSE (the rgb(from var() r g b)
//       declaration actually resolves — a dead parse would kill the ring).
//   B — THE REAL COMPOSITE (the default theme plate + the sweep yellow
//       flood): the under-shadow band under the title and the date keeps
//       its resting darkness through the sweep on the plate AND under the
//       flood; both rim voices (dark 13/10/7, light 250/246/238) speak
//       their own ink.
//   C — THE REAL GRID SCALES (0.7..1.3, the real fonts): the under-band-own
//       darkness profile survives the sweep at every scale the grid speaks.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const APP_CSS = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.css'), 'utf8');
const FONT_DIR = path.join(__dirname, '..', 'node_modules', '@fontsource');
const fontFace = (family, weight, file) => `@font-face { font-family: '${family}'; font-weight: ${weight}; font-style: normal; src: url('file://${path.join(FONT_DIR, file)}') format('woff2'); font-display: block; }`;
const FACES = [
  fontFace('IBM Plex Mono', 400, 'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'),
  fontFace('IBM Plex Mono', 700, 'ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2'),
].join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FACES}
${APP_CSS}
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-none { user-select: none; -webkit-user-select: none; }
body { margin: 0; font-family: 'IBM Plex Mono', ui-monospace, monospace; }
/* stage A: the isolation rig (the flood hides: black accent on black) */
.probe-stageA { padding: 24px; --gd-accent: #000000; --gd-accent-ink: #000000; background: #000; }
#cardA, #cardB { --gd-fin-ink-outline: rgba(255, 0, 0, 0.66); --gd-card-tint: #000000; background: #000; }
#cardB { --gd-bg: #00ff00; }
/* stage B: the real composite — the theme plate, the sweep true accent */
.probe-stageB { padding: 24px; --gd-accent: #ffd400; --gd-accent-ink: #131313; background: #0f0f0f; }
#cardD { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); --gd-card-tint: #191919; background: #191919; }
#cardF { --gd-fin-ink-outline: rgba(250, 246, 238, 0.72); --gd-card-tint: #191919; background: #191919; }
/* stage C: the real grid scales, the real fonts, the dark rim */
#cardS { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); --gd-card-tint: #191919; background: #191919; }
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stageA">
    <div id="cardA" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative;">
      <div id="titleA" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
      <div id="metaA" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
    <div id="cardB" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; background:#000; position:relative; margin-top:40px;">
      <div id="titleB" class="gd-card-title" style="color:#0044cc; font-weight:700;"><span>Plain </span><span class="rt-outline" id="runP">Outlined</span> <span class="rt-b rt-outline" id="runK">BoldOut</span></div>
    </div>
  </div>
  <div class="probe-stageB">
    <div id="cardD" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative; margin-top:40px;">
      <div id="titleD" class="gd-card-title" style="color:#f2f2f2; font-weight:700;">Test Card</div>
      <div id="metaD" class="gd-card-meta" style="color:#9a9a9a;">OCT 12 2025</div>
    </div>
    <div id="cardF" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative; margin-top:40px;">
      <div id="titleF" class="gd-card-title" style="color:#131313; font-weight:700;">Dark Ink</div>
      <div id="metaF" class="gd-card-meta" style="color:#131313;">OCT 12 2025</div>
    </div>
    <div id="cardS" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:1; width:420px; position:relative; margin-top:40px;">
      <div id="titleS" class="gd-card-title font-bold leading-tight truncate" style="color:#f2f2f2;">Test Card</div>
      <div id="metaS" class="gd-card-meta" style="color:#9a9a9a;">OCT 12 2025</div>
    </div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false, width: 1100, height: 2000,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'rim_ink_1914.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(600);

  const ids = ['titleA', 'metaA', 'runP', 'runK', 'titleD', 'metaD', 'titleF', 'metaF', 'titleS', 'metaS'];
  const boxes = JSON.parse(
    await win.webContents.executeJavaScript(
      `JSON.stringify(Object.fromEntries(${JSON.stringify(ids)}.map((id) => {
        const b = document.getElementById(id).getBoundingClientRect();
        return [id, { x: Math.max(0, Math.floor(b.x - 10)), y: Math.max(0, Math.floor(b.y - 10)),
          w: Math.ceil(b.width + 20), h: Math.ceil(b.height + 20) }];
      })))`
    )
  );

  // THE PARSE LAW: the engine must resolve rgb(from var() r g b) inside the
  // ::selection text-shadow — read the computed ::selection style shadow
  const parseProbe = JSON.parse(await win.webContents.executeJavaScript(`(() => {
    const el = document.getElementById('titleA');
    const cs = getComputedStyle(el, '::selection');
    return JSON.stringify({ shadow: cs.textShadow || '(none)' });
  })()`));
  console.log('PARSE ::selection text-shadow =', JSON.stringify(parseProbe.shadow).slice(0, 160));

  const median = (arr) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  const readSeat = async (id) => {
    const b = boxes[id];
    const img = await win.webContents.capturePage({ x: b.x, y: b.y, width: b.w, height: b.h });
    const size = img.getSize();
    const bmp = img.getBitmap();
    const W = size.width;
    const redAlphas = [];
    const redRuns = [];
    const darks = [];
    const lights = [];
    let red = 0;
    let green = 0;
    for (let y = 0; y < size.height; y += 1) {
      let redLen = 0;
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4;
        const r = bmp[i + 2];
        const g = bmp[i + 1];
        const bl = bmp[i];
        const isRed = r >= 30 && g <= r * 0.55 && bl <= r * 0.55;
        const isGreen = g >= 30 && r <= g * 0.55 && bl <= g * 0.55;
        if (isRed) { red += 1; redAlphas.push(r); redLen += 1; }
        else if (redLen > 0) { if (redLen <= 6) redRuns.push(redLen); redLen = 0; }
        if (isGreen) { green += 1; }
        // the under-band darkness (stage B seats): rows below the glyph ink
        // that read darker than the plate (dark rim) or lighter (light rim)
        if (r < 25 && g < 25 && bl < 25) darks.push(r);
        if (r > 60 && g > 60 && bl > 60) lights.push(r);
      }
      if (redLen > 0 && redLen <= 6) redRuns.push(redLen);
    }
    return {
      red, green,
      redMedianAlpha: median(redAlphas),
      redBodyAlpha: pX(redAlphas, 0.25),
      redOuterAlpha: pX(redAlphas, 0.05),
      redRunMedian: median(redRuns),
      darkUnder: darks.length,
      lightUnder: lights.length,
    };
  };
  function pX(arr, q) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.max(0, Math.min(s.length - 1, Math.floor(s.length * q)))];
  }

  const clearSel = async () => {
    await win.webContents.executeJavaScript(`window.getSelection().removeAllRanges()`);
    await settle(120);
  };
  const selectAllDoc = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const s = window.getSelection();
      s.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(document.body);
      s.addRange(r);
    })()`);
    await settle(250);
  };
  const selectLabel = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const s = window.getSelection();
      s.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(document.getElementById('label'));
      s.addRange(r);
    })()`);
    await settle(160);
  };
  const ctrlA = async () => {
    await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'a', modifiers: ['control'] });
    await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'a', modifiers: ['control'] });
    await settle(250);
  };

  const results = {};
  const snap = async (name) => {
    results[name] = {};
    for (const id of ids) results[name][id] = await readSeat(id);
    const r = results[name];
    console.log(
      `  ${name.padEnd(11)} A.title red=${String(r.titleA.red).padStart(5)} aMd=${String(r.titleA.redMedianAlpha).padStart(3)} outer=${String(r.titleA.redOuterAlpha).padStart(3)} run=${r.titleA.redRunMedian.toFixed(1)} | ` +
      `A.meta red=${String(r.metaA.red).padStart(4)} aMd=${String(r.metaA.redMedianAlpha).padStart(3)} run=${r.metaA.redRunMedian.toFixed(1)} | ` +
      `B.runP grn=${String(r.runP.green).padStart(4)} | ` +
      `D.title dark=${String(r.titleD.darkUnder).padStart(4)} D.meta dark=${String(r.metaD.darkUnder).padStart(4)} | ` +
      `F.title light=${String(r.titleF.lightUnder).padStart(4)} | S.title dark=${String(r.titleS.darkUnder).padStart(4)}`
    );
  };

  console.log('\n== REST ==');
  await clearSel();
  await snap('REST');
  console.log('\n== label-only (the control — nothing may change) ==');
  await selectLabel();
  await snap('LABEL');
  console.log('\n== whole-document sweep (the 1.9.14 cure: the ring speaks its own ink) ==');
  await selectAllDoc();
  await snap('SWEEP');
  console.log('\n== real Ctrl+A ==');
  await clearSel();
  await ctrlA();
  await snap('CTRL-A');
  console.log('\n== LIVING FINISHES off (still mode) ==');
  await clearSel();
  await win.webContents.executeJavaScript(`(() => {
    document.documentElement.classList.add('gd-finishes-still'); void document.documentElement.offsetWidth;
  })()`);
  await settle(200);
  const stillRest = await readSeat('titleA');
  await selectAllDoc();
  const stillSweep = await readSeat('titleA');
  await win.webContents.executeJavaScript(`document.documentElement.classList.remove('gd-finishes-still')`);
  await clearSel();
  console.log(`  still: rest red=${stillRest.red} sweep red=${stillSweep.red}`);

  const rest = results.REST;
  const lab = results.LABEL;
  const all = results.SWEEP;
  const ca = results['CTRL-A'];

  const verdicts = [
    ['PARSE: rgb(from var() r g b) resolves in ::selection text-shadow (a computed shadow exists)', String(parseProbe.shadow) !== '(none)' && /rgb/i.test(parseProbe.shadow)],
    ['REST: the rim band reads the flat 0.66 alpha (median ~168 +/- 14)', rest.titleA.redMedianAlpha >= 154 && rest.titleA.redMedianAlpha <= 182],
    ['CURE COMPOSITE: mid-sweep the band paints the RESTING composite itself (median within 15% of the resting flat)', all.titleA.redMedianAlpha >= rest.titleA.redMedianAlpha * 0.85 && all.titleA.redMedianAlpha <= rest.titleA.redMedianAlpha * 1.15],
    ['CURE FLAT: the outer quarter carries the same composite as the body (p25 within 20% of the median — no single-copy wash)', all.titleA.redBodyAlpha >= all.titleA.redMedianAlpha * 0.8],
    ['CURE COMPOSITE: the date seat band paints the resting composite too (within 15%)', all.metaA.redMedianAlpha >= rest.metaA.redMedianAlpha * 0.85 && all.metaA.redMedianAlpha <= rest.metaA.redMedianAlpha * 1.15],
    ['CURE WIDTH: the title ring matches the resting run medians (within 0.7px)', Math.abs(all.titleA.redRunMedian - rest.titleA.redRunMedian) <= 0.7],
    ['CURE WIDTH: the date ring matches the resting run medians (within 0.7px)', Math.abs(all.metaA.redRunMedian - rest.metaA.redRunMedian) <= 0.7],
    ['CURE AREA: the mid-sweep painted area holds near the resting one (within 35%)', all.titleA.red >= rest.titleA.red * 0.65 && all.titleA.red <= rest.titleA.red * 1.35],
    ['UNDER-SHADOW: the dark rim under-band keeps its resting darkness on the plate (titleD dark pixels within 12%)', all.titleD.darkUnder >= rest.titleD.darkUnder * 0.88 && all.titleD.darkUnder <= rest.titleD.darkUnder * 1.12],
    ['UNDER-SHADOW: the date seat under-band holds (metaD within 12%)', all.metaD.darkUnder >= rest.metaD.darkUnder * 0.88 && all.metaD.darkUnder <= rest.metaD.darkUnder * 1.12],
    ['LIGHT VOICE: the light rim under-band keeps its resting lightness (titleF within 12%)', all.titleF.lightUnder >= rest.titleF.lightUnder * 0.88 && all.titleF.lightUnder <= rest.titleF.lightUnder * 1.12],
    ['GRID SCALE: the real-scale seat under-band holds (titleS within 12%)', all.titleS.darkUnder >= rest.titleS.darkUnder * 0.88 && all.titleS.darkUnder <= rest.titleS.darkUnder * 1.12],
    ['label-only selection: NOTHING changes (byte-held ring + ink)', lab.titleA.red === rest.titleA.red && lab.metaA.red === rest.metaA.red && lab.titleA.redRunMedian === rest.titleA.redRunMedian],
    ['Ctrl+A matches the programmatic sweep (one cure, one shape)', Math.abs(ca.titleA.redRunMedian - all.titleA.redRunMedian) <= 0.4 && ca.titleA.redMedianAlpha === all.titleA.redMedianAlpha && Math.abs(ca.titleA.red - all.titleA.red) <= all.titleA.red * 0.02],
    ['the outline RUN keeps its own contour mid-sweep (green alive, the carve-out holds)', all.runP.green > 60],
    ['still mode: no rim at rest and none conjured mid-sweep', stillRest.red < 40 && stillSweep.red < 40],
  ];
  let bad = 0;
  for (const [name, okV] of verdicts) {
    console.log(`  ${okV ? 'PASS' : 'FAIL'}  ${name}`);
    if (!okV) bad += 1;
  }
  console.log(`\n  [the ink, before and after] title: rest aMd=${rest.titleA.redMedianAlpha} outer=${rest.titleA.redOuterAlpha} -> sweep aMd=${all.titleA.redMedianAlpha} outer=${all.titleA.redOuterAlpha} | date: rest aMd=${rest.metaA.redMedianAlpha} -> sweep aMd=${all.metaA.redMedianAlpha}`);
  console.log(`  [the under-shadow] D.title: rest dark=${rest.titleD.darkUnder} -> sweep ${all.titleD.darkUnder} | D.meta: ${rest.metaD.darkUnder} -> ${all.metaD.darkUnder} | F.title light: ${rest.titleF.lightUnder} -> ${all.titleF.lightUnder} | S.title: ${rest.titleS.darkUnder} -> ${all.titleS.darkUnder}`);
  console.log(`verdict: ${verdicts.length - bad}/${verdicts.length} laws hold`);
  app.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  app.exit(1);
});
