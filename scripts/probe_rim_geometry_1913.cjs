#!/usr/bin/env node
// 1.9.13 RIM GEOMETRY PROBE, ROUND 1 — THE THICKNESS AUDIT (in the app's
// own Electron 42.9.3). The 1.9.12 cure proved the rim SURVIVES the sweep
// (a contour paints in the dead stroke's seat) — but the user's 1.9.13
// report says the rim still is not right: "when i do the select i see the
// date and the title of the card in the card viewer swap outline
// thickness". This round MEASURES the rim's ring as geometry + weight,
// rest vs mid-sweep, on the shipped sheet:
//   · REST: the 1.7px centered stroke's visible band (the OUTER half:
//     0.85px x --card-scale) at the rim color's flat alpha (0.66)
//   · SWEEP: the 1.9.12 contour's 8-way union (1.1px cardinal steps in
//     the FULL rim color — geometry the stroke never wore, and weight the
//     stroke never carried: translucent copies ACCUMULATE where they
//     overlap, up to ~0.96 against the resting flat 0.66)
// Expected disease: the mid-sweep ring reads ~30% wider and ~45% heavier —
// the "swap outline thickness" the user sees (worst on the small date
// seat). Also on stage: card C, the STROKE-CHANNEL WITNESS — a probe-only
// ::selection rule that declares -webkit-text-stroke itself (5.1px, the
// resting width). If the engine paints a stroke FROM ::selection, the
// perfect cure is a real stroke mid-sweep; if it drops the declaration
// (the expected engine law: ::selection honors only color /
// background-color / text-shadow / text-decoration-color), the cure is the
// retrued contour and card C reads ~0 red mid-sweep.
// Run: node_modules/electron/dist/electron scripts/probe_rim_geometry_1913.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// the app's own sheet, verbatim (the shipped 1.9.12 cure rides it)
const APP_CSS = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.css'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${APP_CSS}
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-none { user-select: none; -webkit-user-select: none; }
body { margin: 0; }
.probe-stage { padding: 24px; }
/* the flood hides: every selection seat composites over the SAME black
   the cards wear, so the ring's own alpha profile is the only signal
   (the 1.9.12 rig already proved the accent flood paints; this round
   measures geometry, not the highlight's honesty) */
.probe-stage { --gd-accent: #000000; --gd-accent-ink: #000000; background: #000; }
/* the rim's detection color: the production dark rim's exact alpha on a
   pure red hue (rgba(13,10,7,0.66) -> rgba(255,0,0,0.66)); card B's runs
   keep --gd-bg pure green so each ring counts alone */
#cardA, #cardB, #cardC { --gd-fin-ink-outline: rgba(255, 0, 0, 0.66); background: #000; }
#cardB { --gd-bg: #00ff00; }
</style>
<style id="witness-style">
/* PROBE-ONLY WITNESS (card C): does the engine paint a text stroke that
   ::selection itself DECLARES? Same width and alpha as the resting rim,
   the contour suppressed, so a live stroke channel reads as C's ring
   holding byte-for-byte mid-sweep and a dead one reads ~0 red. */
#cardC .gd-card-title::selection,
#cardC .gd-card-meta::selection {
  -webkit-text-stroke: 5.1px rgba(255, 0, 0, 0.66);
  paint-order: stroke fill;
  text-shadow: none;
}
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stage">
    <!-- card A: the plain rimmed title + date (the report's seats; the
         sheet sizes them 15px/10px x --card-scale = 45px/30px here) -->
    <div id="cardA" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative;">
      <div id="titleA" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
      <div id="metaA" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
    <!-- card B: the same rim + OUTLINE FORMAT runs in the title (plain +
         bold — the 1.9.11 carve-out family; their own contour's geometry
         is on trial too: 1.5px/2px strokes wear 0.75px/1px bands, the
         shipped contour speaks 1px steps for both) -->
    <div id="cardB" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; background:#000; position:relative; margin-top:40px;">
      <div id="titleB" class="gd-card-title" style="color:#0044cc; font-weight:700;"><span>Plain </span><span class="rt-outline" id="runP">Outlined</span> <span class="rt-b rt-outline" id="runK">BoldOut</span></div>
      <div id="metaB" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
    <!-- card C: the stroke-channel witness (identical rim; the witness
         rule above is the only difference) -->
    <div id="cardC" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative; margin-top:40px;">
      <div id="titleC" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
      <div id="metaC" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 1400,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'rim_geom_1913.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  const ids = ['titleA', 'metaA', 'titleB', 'runP', 'runK', 'metaB', 'titleC', 'metaC'];
  const boxes = JSON.parse(
    await win.webContents.executeJavaScript(
      `JSON.stringify(Object.fromEntries(${JSON.stringify(ids)}.map((id) => {
        const b = document.getElementById(id).getBoundingClientRect();
        return [id, { x: Math.max(0, Math.floor(b.x - 10)), y: Math.max(0, Math.floor(b.y - 10)),
          w: Math.ceil(b.width + 20), h: Math.ceil(b.height + 20) }];
      })))`
    )
  );

  const median = (arr) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  // the band BODY's darkness: the 75th percentile of the ring's pixels —
  // the contour's outer quarter runs a single light copy BY DESIGN (the
  // AA-soft edge the stroke always wore), so a value-median conflates
  // that sliver with the body and misreads the cure; the 75th percentile
  // sits inside the 3-copy body, the seat the resting flat band occupies
  const p75 = (arr) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length * 0.75)];
  };

  const readSeat = async (id) => {
    const b = boxes[id];
    const img = await win.webContents.capturePage({ x: b.x, y: b.y, width: b.w, height: b.h });
    const size = img.getSize();
    const bmp = img.getBitmap(); // BGRA, row-major
    const W = size.width;
    let red = 0;
    let green = 0;
    let blue = 0;
    let yellow = 0;
    const redAlphas = [];
    const redRuns = [];
    const greenRuns = [];
    const yellowRuns = [];
    for (let y = 0; y < size.height; y += 1) {
      let redLen = 0;
      let grnLen = 0;
      let yelLen = 0;
      for (let x = 0; x < size.width; x += 1) {
        const i = (y * W + x) * 4;
        const r = bmp[i + 2];
        const g = bmp[i + 1];
        const bl = bmp[i];
        const isRed = r >= 30 && g <= r * 0.55 && bl <= r * 0.55;
        const isGreen = g >= 30 && r <= g * 0.55 && bl <= g * 0.55;
        const isYellow = r >= 150 && g >= 120 && g <= 220 && bl <= 90;
        if (isRed) {
          red += 1;
          redAlphas.push(r);
          redLen += 1;
        } else if (redLen > 0) { if (redLen <= 6) redRuns.push(redLen); redLen = 0; }
        if (isGreen) {
          green += 1;
          grnLen += 1;
        } else if (grnLen > 0) { if (grnLen <= 6) greenRuns.push(grnLen); grnLen = 0; }
        if (isYellow) {
          yellow += 1;
          yelLen += 1;
        } else if (yelLen > 0) { if (yelLen <= 6) yellowRuns.push(yelLen); yelLen = 0; }
        if (!isRed && !isGreen && !isYellow && bl >= 100 && r <= bl * 0.45 && g <= bl * 0.45) blue += 1;
      }
      if (redLen > 0 && redLen <= 6) redRuns.push(redLen);
      if (grnLen > 0 && grnLen <= 6) greenRuns.push(grnLen);
      if (yelLen > 0 && yelLen <= 6) yellowRuns.push(yelLen);
    }
    return {
      red,
      green,
      blue,
      yellow,
      redMedianAlpha: median(redAlphas),
      redBodyAlpha: p75(redAlphas),
      redRunMedian: median(redRuns),
      redRunCount: redRuns.length,
      greenRunMedian: median(greenRuns),
      yellowRunMedian: median(yellowRuns),
    };
  };

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
    await settle(200);
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
    await settle(220);
  };

  const results = {};
  const snap = async (name) => {
    results[name] = {};
    for (const id of ids) results[name][id] = await readSeat(id);
    const r = results[name];
    console.log(
      `  ${name.padEnd(12)} A.title red=${String(r.titleA.red).padStart(5)} aMd=${String(r.titleA.redMedianAlpha).padStart(3)} run=${r.titleA.redRunMedian.toFixed(1)} | ` +
      `A.meta red=${String(r.metaA.red).padStart(4)} aMd=${String(r.metaA.redMedianAlpha).padStart(3)} run=${r.metaA.redRunMedian.toFixed(1)} | ` +
      `B.runP grn=${String(r.runP.green).padStart(4)} grun=${r.runP.greenRunMedian.toFixed(1)} yrun=${r.runP.yellowRunMedian.toFixed(1)} | ` +
      `B.runK grn=${String(r.runK.green).padStart(4)} grun=${r.runK.greenRunMedian.toFixed(1)} yrun=${r.runK.yellowRunMedian.toFixed(1)} | ` +
      `C.title red=${String(r.titleC.red).padStart(5)} | blueA=${r.titleA.blue}`
    );
  };

  console.log('\n== REST (the 1.7px stroke band: 0.85px x scale reach, flat 0.66 alpha) ==');
  await clearSel();
  await snap('REST');

  console.log('\n== label-only selection (the control — nothing may change) ==');
  await selectLabel();
  await snap('LABEL-ONLY');

  console.log('\n== whole-document selection (the disease seat — the shipped 1.9.12 contour) ==');
  await selectAllDoc();
  await snap('ALL-DOC');

  console.log('\n== real Ctrl+A through the input pipeline ==');
  await clearSel();
  await ctrlA();
  await snap('CTRL-A');

  console.log('\n== LIVING FINISHES off (still mode): no rim at rest, none conjured mid-sweep ==');
  await clearSel();
  await win.webContents.executeJavaScript(`(() => {
    document.documentElement.classList.add('gd-finishes-still'); void document.documentElement.offsetWidth;
  })()`);
  await settle(200);
  await snap('STILL-REST');
  await selectAllDoc();
  await snap('STILL-ALLDOC');
  await win.webContents.executeJavaScript(`document.documentElement.classList.remove('gd-finishes-still')`);
  await clearSel();

  console.log('\n== VERDICTS (ROUND 2 — the 1.9.13 cure: the ring keeps its own width and weight) ==');
  const rest = results.REST;
  const lab = results['LABEL-ONLY'];
  const all = results['ALL-DOC'];
  const ca = results['CTRL-A'];
  const sr = results['STILL-REST'];
  const sa = results['STILL-ALLDOC'];
  const inkHeld = (v) => v.titleA.blue > rest.titleA.blue * 0.55;
  const verdicts = [
    ['REST: the rim band reads ~2.55px on both seats (the stroke\'s outer half at scale 3)', rest.titleA.redRunMedian >= 2.0 && rest.titleA.redRunMedian <= 3.2 && rest.metaA.redRunMedian >= 2.0 && rest.metaA.redRunMedian <= 3.2],
    ['REST: the rim band paints the flat 0.66 alpha (median red channel ~168 +/- 12)', rest.titleA.redMedianAlpha >= 156 && rest.titleA.redMedianAlpha <= 180],
    ['label-only selection: NOTHING changes (byte-held ring + ink)', lab.titleA.red === rest.titleA.red && lab.metaA.red === rest.metaA.red && lab.titleA.redRunMedian === rest.titleA.redRunMedian && inkHeld(lab)],
    ['CURE WIDTH: the mid-sweep ring matches the resting band on the TITLE (run medians within 0.6px)', Math.abs(all.titleA.redRunMedian - rest.titleA.redRunMedian) <= 0.6],
    ['CURE WIDTH: the mid-sweep ring matches the resting band on the DATE (run medians within 0.6px)', Math.abs(all.metaA.redRunMedian - rest.metaA.redRunMedian) <= 0.6],
    ['CURE WEIGHT: the mid-sweep band BODY matches the resting flat alpha on both seats (75th percentile within 15%)', all.titleA.redBodyAlpha >= rest.titleA.redBodyAlpha * 0.85 && all.titleA.redBodyAlpha <= rest.titleA.redBodyAlpha * 1.15 && all.metaA.redBodyAlpha >= rest.metaA.redBodyAlpha * 0.85 && all.metaA.redBodyAlpha <= rest.metaA.redBodyAlpha * 1.15],
    ['CURE TOTAL: the mid-sweep ring\'s painted area stays near the resting one on both seats (within 25%/30%)', all.titleA.red >= rest.titleA.red * 0.75 && all.titleA.red <= rest.titleA.red * 1.3 && all.metaA.red >= rest.metaA.red * 0.7 && all.metaA.red <= rest.metaA.red * 1.3],
    ['the letters keep their own ink mid-sweep (no accent-ink flip)', inkHeld(all) && inkHeld(ca)],
    ['Ctrl+A matches the programmatic sweep (one cure, one shape)', Math.abs(ca.titleA.redRunMedian - all.titleA.redRunMedian) <= 0.4 && ca.titleA.redBodyAlpha === all.titleA.redBodyAlpha && Math.abs(ca.titleA.red - all.titleA.red) <= all.titleA.red * 0.02],
    ['the outline RUN keeps its own contour mid-sweep (green alive, the carve-out holds)', all.runP.green > 60 && all.runK.green > 60],
    ['RUNS WIDTH: the plain run\'s contour matches its resting band (within 0.5px)', Math.abs(all.runP.greenRunMedian - rest.runP.yellowRunMedian) <= 0.5],
    ['RUNS WIDTH: the bold run\'s contour matches its resting band (within 0.5px)', Math.abs(all.runK.greenRunMedian - rest.runK.yellowRunMedian) <= 0.5],
    ['still mode at rest: no rim (the coat is off)', sr.titleA.red < 40 && sr.metaA.red < 20],
    ['still mode under the sweep: no contour conjured, ink held', sa.titleA.red < 40 && sa.metaA.red < 20 && inkHeld(sa)],
  ];
  let bad = 0;
  for (const [name, okV] of verdicts) {
    console.log(`  ${okV ? 'PASS' : 'FAIL'}  ${name}`);
    if (!okV) bad += 1;
  }
  console.log(`\n  [the swap, before and after] title: rest run=${rest.titleA.redRunMedian.toFixed(1)} body=${rest.titleA.redBodyAlpha} -> sweep run=${all.titleA.redRunMedian.toFixed(1)} body=${all.titleA.redBodyAlpha} | date: rest run=${rest.metaA.redRunMedian.toFixed(1)} body=${rest.metaA.redBodyAlpha} -> sweep run=${all.metaA.redRunMedian.toFixed(1)} body=${all.metaA.redBodyAlpha}`);
  console.log(`  [witness] card C mid-sweep red=${all.titleC.red} vs rest red=${rest.titleC.red} -> ${all.titleC.red < rest.titleC.red * 0.15 ? 'the stroke channel stays DEAD (the contour is the only ring mid-sweep, as designed)' : 'UNEXPECTED — investigate'}`);
  console.log(`verdict: ${verdicts.length - bad}/${verdicts.length} laws hold`);
  app.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  app.exit(1);
});
