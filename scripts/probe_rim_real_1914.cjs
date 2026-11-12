#!/usr/bin/env node
// 1.9.14 REAL-COMPOSITE PROBE (the app's own Electron 42.9.3). The isolation
// rig (black accent) proved the contour's own alpha geometry; this rig seats
// the SAME seats on the REAL default theme composite — plate #191919, text
// #f2f2f2, the sweep's accent flood #ffd400 (the app's own --gd-accent) —
// and measures what the EYE reads as "the shadow under the text": the band
// beneath the glyph bottoms, its width and its DARKNESS (channel depth vs
// the local background), rest vs whole-document sweep. Both rim voices:
//   · card E — the DEFAULT voice: light text, DARK rim rgba(13,10,7,0.66)
//   · card F — the colored-card voice: dark text, LIGHT rim rgba(250,246,238,0.72)
// Crops dumped for the eye. Run with Xvfb in the SAME shell invocation.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const APP_CSS = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.css'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${APP_CSS}
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-none { user-select: none; -webkit-user-select: none; }
body { margin: 0; }
.probe-stage { padding: 24px; --gd-accent: #ffd400; --gd-accent-ink: #131313; background: #0f0f0f; }
#cardE, #cardF { background: #191919; }
#cardE { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); }
#cardF { --gd-fin-ink-outline: rgba(250, 246, 238, 0.72); }
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stage">
    <div id="cardE" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative;">
      <div id="titleE" class="gd-card-title" style="color:#f2f2f2; font-weight:700;">Test Card</div>
      <div id="metaE" class="gd-card-meta" style="color:#9a9a9a;">OCT 12 2025</div>
    </div>
    <div id="cardF" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; background:#191919; position:relative; margin-top:40px;">
      <div id="titleF" class="gd-card-title" style="color:#131313; font-weight:700;">Dark Ink</div>
      <div id="metaF" class="gd-card-meta" style="color:#131313;">OCT 12 2025</div>
    </div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 1100,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'rim_real_1914.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  const ids = ['titleE', 'metaE', 'titleF', 'metaF'];
  const boxes = JSON.parse(
    await win.webContents.executeJavaScript(
      `JSON.stringify(Object.fromEntries(${JSON.stringify(ids)}.map((id) => {
        const b = document.getElementById(id).getBoundingClientRect();
        return [id, { x: Math.max(0, Math.floor(b.x - 14)), y: Math.max(0, Math.floor(b.y - 14)),
          w: Math.ceil(b.width + 28), h: Math.ceil(b.height + 28) }];
      })))`
    )
  );

  const median = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  const grab = async (id) => {
    const b = boxes[id];
    const img = await win.webContents.capturePage({ x: b.x, y: b.y, width: b.w, height: b.h });
    const size = img.getSize();
    return { bmp: img.getBitmap(), W: size.width, H: size.height, png: img.toPNG() };
  };

  // E seat: light fill ink (strong R+G+B, low-mid B); F seat: dark fill ink
  // (all channels low). Rim read as LUMA distance from the LOCAL background
  // (sampled beside the glyph edge at the same depth).
  const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const isFillE = (r, g, b) => r >= 180 && g >= 180 && b >= 150 && Math.abs(r - g) < 40;
  const isFillF = (r, g, b) => r <= 90 && g <= 90 && b <= 90 && luma(r, g, b) < 60;

  const profile = (bmp, W, H, side, maxDepth, clusterPick, isFill) => {
    const rowBlue = new Array(H).fill(0);
    for (let y = 0; y < H; y += 1) {
      let n = 0;
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4;
        if (isFill(bmp[i + 2], bmp[i + 1], bmp[i])) n += 1;
      }
      rowBlue[y] = n;
    }
    const clusters = [];
    let start = -1;
    for (let y = 0; y <= H; y += 1) {
      const on = y < H && rowBlue[y] > 0;
      if (on && start < 0) start = y;
      if (!on && start >= 0) { clusters.push([start, y - 1]); start = -1; }
    }
    if (!clusters.length) return { profile: [], bg: [], cols: 0 };
    const [y0, y1] = clusterPick === 'last' ? clusters[clusters.length - 1] : clusters[0];
    const rows = [];
    for (let x = 0; x < W; x += 1) {
      let edge = -1;
      let first = -1;
      for (let y = y0; y <= y1; y += 1) {
        const i = (y * W + x) * 4;
        if (isFill(bmp[i + 2], bmp[i + 1], bmp[i])) { edge = y; if (first < 0) first = y; }
      }
      if (edge < 0) continue;
      if (side === 'top') edge = first;
      const col = [];
      const bgCol = [];
      for (let d = 1; d <= maxDepth; d += 1) {
        const y = side === 'under' ? edge + d : edge - d;
        if (y < 0 || y >= H) { col.push(null); bgCol.push(null); continue; }
        const i = (y * W + x) * 4;
        col.push(Math.round(luma(bmp[i + 2], bmp[i + 1], bmp[i])));
        // the local background: the same depth read at a column-gap 10px left
        const xi = Math.max(0, x - 10) * 4 + y * W * 4;
        bgCol.push(Math.round(luma(bmp[xi + 2], bmp[xi + 1], bmp[xi])));
      }
      rows.push({ col, bgCol });
    }
    const out = [];
    const bgOut = [];
    const deltaOut = [];
    for (let d = 0; d < maxDepth; d += 1) {
      out.push(median(rows.map((r) => r.col[d]).filter((v) => v !== null)));
      bgOut.push(median(rows.map((r) => r.bgCol[d]).filter((v) => v !== null)));
      const pairs = rows.map((r) => [r.col[d], r.bgCol[d]]).filter(([c, g]) => c !== null && g !== null);
      deltaOut.push(median(pairs.map(([c, g]) => c - g)));
    }
    return { profile: out, bg: bgOut, delta: deltaOut, cols: rows.length };
  };

  const readSeat = async (id, isFill) => {
    const { bmp, W, H, png } = await grab(id);
    return {
      under: profile(bmp, W, H, 'under', 12, id.startsWith('meta') ? 'last' : 'first', isFill),
      over: profile(bmp, W, H, 'top', 12, id.startsWith('meta') ? 'last' : 'first', isFill),
      png,
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

  fs.mkdirSync('/tmp/render_1914', { recursive: true });
  const dump = (png, file) => fs.writeFileSync(path.join('/tmp', 'render_1914', file), png);

  await clearSel();
  const rest = {};
  for (const id of ids) { rest[id] = await readSeat(id, id.endsWith('E') ? isFillE : isFillF); }
  dump(rest.titleE.png, 'titleE_rest.png');
  dump(rest.metaE.png, 'metaE_rest.png');
  dump(rest.titleF.png, 'titleF_rest.png');
  dump(rest.metaF.png, 'metaF_rest.png');

  await selectAllDoc();
  const sweep = {};
  for (const id of ids) { sweep[id] = await readSeat(id, id.endsWith('E') ? isFillE : isFillF); }
  dump(sweep.titleE.png, 'titleE_sweep.png');
  dump(sweep.metaE.png, 'metaE_sweep.png');
  dump(sweep.titleF.png, 'titleF_sweep.png');
  dump(sweep.metaF.png, 'metaF_sweep.png');
  await clearSel();

  const fmt = (p) => (p && p.profile ? p.profile.map((v) => (v === null || v === undefined ? ' --' : String(Math.round(v)).padStart(3))).join(' ') : '(none)');
  const fmtD = (p) => (p && p.delta ? p.delta.map((v) => (v === null || v === undefined ? ' --' : String(Math.round(v)).padStart(4))).join(' ') : '(none)');
  for (const id of ids) {
    console.log(`\n[${id}] cols=${rest[id].under.cols}`);
    console.log(`  rest  under luma: ${fmt(rest[id].under)}   delta-vs-bg: ${fmtD(rest[id].under)}`);
    console.log(`  sweep under luma: ${fmt(sweep[id].under)}   delta-vs-bg: ${fmtD(sweep[id].under)}`);
    console.log(`  rest  over  luma: ${fmt(rest[id].over)}   delta-vs-bg: ${fmtD(rest[id].over)}`);
    console.log(`  sweep over  luma: ${fmt(sweep[id].over)}   delta-vs-bg: ${fmtD(sweep[id].over)}`);
  }
  app.exit(0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  app.exit(1);
});
