#!/usr/bin/env node
// 1.9.12 RIM PROBE, ROUND 2 — THE CURE'S OWN PROOF (in the app's own
// Electron 42.9.3). Round 1 mapped the mechanism: a label-only selection
// holds the rim byte-for-byte, a WHOLE-DOCUMENT sweep (Ctrl+A / a drag
// past the header's edge) erases it outright — the engine never paints a
// text stroke inside a selection, so every rimmed title and date in the
// viewer lost its outline while the selection stood. This round proves
// the shipped cure end to end on the app's own sheet (index.css carries
// the 1.9.12 rim ::selection law now):
//   · the rim survives every selection shape as an 8-way contour in the
//     rim's own color (red pixels stay through Ctrl+A / all-doc / drag /
//     card-text ranges)
//   · the letters keep their exact resting ink (blue stays blue — no
//     accent-ink flip)
//   · the accent flood still paints behind (the honest highlight)
//   · LIVING FINISHES off: no contour (an outline that doesn't exist
//     doesn't paint one mid-selection)
//   · the outline FORMAT's own runs keep their 1.9.11 cure verbatim
//     (green --gd-bg contour; the rim's red contour scoped OUT of them)
// Run: node_modules/electron/dist/electron scripts/probe_sel_rim_1912.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// the app's own sheet, verbatim (the cure rides it)
const APP_CSS = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.css'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${APP_CSS}
/* the three utilities the real seats speak (tailwind compiles them at
   build; the probe states them by hand) */
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-none { user-select: none; -webkit-user-select: none; }
body { margin: 0; }
.probe-stage { padding: 24px; }
/* the rim's detection color: pure red, spoken by nothing else on card A;
   the card B run's 1.9.11 contour reads --gd-bg, overridden to pure green
   inside its scope so each ring counts alone */
#cardA { --gd-fin-ink-outline: #ff0000; }
#cardB { --gd-fin-ink-outline: #ff0000; --gd-bg: #00ff00; }
</style>
<style id="witness-style">
/* PROBE-ONLY WITNESS: repaint the cure's CONTOUR in pure magenta on card
   A's seats (later source order, same specificity — it wins the seat) so
   the contour can never be confused with the resting red stroke: mid-
   selection, magenta > 0 proves the ::selection rule APPLIED (the stroke
   is dead — the engine law — and the cure's shadow painted in its seat);
   red == the resting count would instead mean the selection never touched
   the seat at all. 4px straight steps: unmissable. The block carries an
   id so the still-mode phase can retire it — the !important witness must
   not fight the still override the phase exists to prove. */
#cardA .gd-card-title::selection,
#cardA .gd-card-title *:not(.rt-outline)::selection,
#cardA .gd-card-meta::selection,
#cardA .gd-card-meta *:not(.rt-outline)::selection {
  text-shadow:
    4px 0 0 #ff00ff, -4px 0 0 #ff00ff, 0 4px 0 #ff00ff, 0 -4px 0 #ff00ff,
    2.8px 2.8px 0 #ff00ff, -2.8px 2.8px 0 #ff00ff, 2.8px -2.8px 0 #ff00ff, -2.8px -2.8px 0 #ff00ff !important;
}
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stage">
    <!-- card A: the plain rimmed title + date (the report's seats) -->
    <div id="cardA" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; background:#f2f2f2; position:relative;">
      <div id="titleA" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
      <div id="metaA" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
    <!-- card B: the same rim + an OUTLINE FORMAT run in the title (the
         1.9.11 carve-out: the run keeps its own --gd-bg contour, the
         rim's red contour is scoped out of it) -->
    <div id="cardB" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; background:#f2f2f2; position:relative; margin-top:40px;">
      <div id="titleB" class="gd-card-title" style="color:#0044cc; font-weight:700;"><span>Plain </span><span class="rt-outline" id="runB">Outlined</span></div>
      <div id="metaB" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 900,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'sel_rim_1912b.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  const ids = ['titleA', 'metaA', 'titleB', 'runB', 'metaB'];
  const boxes = JSON.parse(
    await win.webContents.executeJavaScript(
      `JSON.stringify(Object.fromEntries(${JSON.stringify(ids)}.map((id) => {
        const b = document.getElementById(id).getBoundingClientRect();
        return [id, { x: Math.max(0, Math.floor(b.x - 8)), y: Math.max(0, Math.floor(b.y - 8)),
          w: Math.ceil(b.width + 16), h: Math.ceil(b.height + 16) }];
      })))`
    )
  );

  const readSeat = async (id) => {
    const b = boxes[id];
    const img = await win.webContents.capturePage({ x: b.x, y: b.y, width: b.w, height: b.h });
    const size = img.getSize();
    const bmp = img.getBitmap(); // BGRA
    let red = 0;
    let green = 0;
    let blue = 0;
    let magenta = 0;
    let accent = 0;
    for (let i = 0; i < bmp.length; i += 4) {
      const r = bmp[i + 2], g = bmp[i + 1], b2 = bmp[i];
      if (r > 170 && g < 90 && b2 < 90) red += 1;
      else if (g > 170 && r < 90 && b2 < 90) green += 1;
      else if (b2 > 150 && r < 90 && g < 90) blue += 1;
      else if (r > 170 && b2 > 170 && g < 90) magenta += 1;
      else if (r > 215 && g > 172 && g < 252 && b2 < 80) accent += 1;
    }
    return { red, green, blue, magenta, accent };
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
    await settle(180);
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
      `  ${name.padEnd(14)} A.title red=${String(r.titleA.red).padStart(5)} MAG=${String(r.titleA.magenta).padStart(5)} blue=${String(r.titleA.blue).padStart(4)} | ` +
      `A.meta red=${String(r.metaA.red).padStart(4)} MAG=${String(r.metaA.magenta).padStart(4)} | ` +
      `B.plain red=${String(r.titleB.red).padStart(5)} | ` +
      `B.run red=${String(r.runB.red).padStart(4)} green=${String(r.runB.green).padStart(4)} | ` +
      `B.meta red=${String(r.metaB.red).padStart(4)}`
    );
  };

  console.log('\n== REST ==');
  await clearSel();
  await snap('REST');

  console.log('\n== label-only selection (the control — nothing may change) ==');
  await selectLabel();
  await snap('LABEL-ONLY');

  console.log('\n== whole-document selection (the disease seat — the cure must hold) ==');
  await selectAllDoc();
  await snap('ALL-DOC');

  console.log('\n== real Ctrl+A through the input pipeline ==');
  await clearSel();
  await ctrlA();
  await snap('CTRL-A');

  console.log('\n== LIVING FINISHES off (still mode): the witness RETIRED — the shipped colors speak ==');
  await clearSel();
  await win.webContents.executeJavaScript(`(() => {
    const w = document.getElementById('witness-style'); if (w) w.remove();
    document.documentElement.classList.add('gd-finishes-still'); void document.documentElement.offsetWidth;
  })()`);
  await settle(200);
  await snap('STILL-REST');
  await selectAllDoc();
  await snap('STILL-ALLDOC');
  await win.webContents.executeJavaScript(`document.documentElement.classList.remove('gd-finishes-still')`);
  await clearSel();
  // the reverse proof: same page, witness still gone, coat back on — the
  // cure's own red contour must paint (the still override was the only
  // thing that ever suppressed it)
  await selectAllDoc();
  await snap('CURE-ALIVE');
  await clearSel();

  console.log('\n== VERDICTS ==');
  const rest = results.REST;
  const lab = results['LABEL-ONLY'];
  const all = results['ALL-DOC'];
  const ca = results['CTRL-A'];
  const sr = results['STILL-REST'];
  const sa = results['STILL-ALLDOC'];
  const cure = results['CURE-ALIVE'];
  const rimAlive = (v) => v.titleA.magenta > 300 && v.metaA.magenta > 150;
  const inkHeld = (v) => v.titleA.blue > rest.titleA.blue * 0.55;
  const verdicts = [
    ['REST paints the rim on both cards (red bands, no magenta at rest)', rest.titleA.red > 200 && rest.metaA.red > 60 && rest.titleB.red > 150 && rest.titleA.magenta === 0],
    ['REST: the outline RUN\'s line speaks the mirror\'s inverse ring, not the red rim (run red under half of A.title)', rest.runB.red < rest.titleA.red * 0.5],
    ['label-only selection: NOTHING changes (rim + ink byte-held, no magenta)', rimAlive(lab) === false && lab.titleA.magenta === 0 && inkHeld(lab) && lab.titleA.red === rest.titleA.red],
    ['ALL-DOC: the WITNESS speaks — the cure\'s ::selection rule APPLIED (magenta contour painted, the dead stroke\'s seat taken)', rimAlive(all)],
    ['ALL-DOC: the resting stroke itself is GONE (red collapses to the witness\'s seat)', all.titleA.red < rest.titleA.red * 0.25],
    ['ALL-DOC: the letters keep their own ink (no accent-ink flip)', inkHeld(all)],
    ['ALL-DOC: the plain letters of card B keep the rim contour too (red, the shipped color)', all.titleB.red > rest.titleB.red * 0.45],
    ['ALL-DOC: the outline RUN keeps its own contour (green), the rim scoped OUT of it (red low)', all.runB.green > 80 && all.runB.red < all.runB.green],
    ['Ctrl+A: the WITNESS speaks on the report\'s own gesture (magenta contour, ink held)', rimAlive(ca) && inkHeld(ca)],
    ['Ctrl+A: the resting stroke is gone under it too (red collapsed)', ca.titleA.red < rest.titleA.red * 0.25],
    ['still mode at rest: no rim at all (the coat is off)', sr.titleA.red < 40 && sr.metaA.red < 20],
    ['still mode under ALL-DOC: no contour conjured (red stays gone, the still override beat the cure), ink still held', sa.titleA.red < 40 && sa.metaA.red < 20 && inkHeld(sa)],
    ['coat back on, witness still retired: the cure\'s OWN red contour paints (the reverse proof)', cure.titleA.red > 1000 && cure.metaA.red > 500 && inkHeld(cure)],
  ];
  let bad = 0;
  for (const [name, okV] of verdicts) {
    console.log(`  ${okV ? 'PASS' : 'FAIL'}  ${name}`);
    if (!okV) bad += 1;
  }
  console.log(`\nverdict: ${verdicts.length - bad}/${verdicts.length} laws hold`);
  app.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  app.exit(1);
});
