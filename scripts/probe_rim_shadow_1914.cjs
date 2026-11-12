#!/usr/bin/env node
// 1.9.14 UNDER-SHADOW PROBE (in the app's own Electron 42.9.3). The report:
//   "its now deleting the shadow under the text of the date and title".
// The 1.9.13 cure retrued the ::selection contour's ring (width + body
// weight matched the resting stroke's outer band) — but the audit's own
// p75 statistic deliberately sat INSIDE the 3-copy inner body and called
// the outer quarter's single light copy "the AA-soft edge the stroke
// always wore". This round measures the band the EYE reads as the shadow
// UNDER the lettering: a per-depth alpha profile straight down from every
// column's glyph-bottom (and up from the glyph-top, the control side),
// rest vs whole-document sweep, on the title and the date, at the probe
// scale (3) AND the real grid scale (1) — plus PNG crops for the eye.
// Run: node_modules/electron/dist/electron scripts/probe_rim_shadow_1914.cjs
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
.probe-stage { padding: 24px; }
.probe-stage { --gd-accent: #000000; --gd-accent-ink: #000000; background: #000; }
#cardA, #cardD { --gd-fin-ink-outline: rgba(255, 0, 0, 0.66); background: #000; }
/* card D: the light-accent composite (what the real sweep seat reads like
   behind the rim — the accent flood ON, isolation off, the eye's truth) */
#cardD { --gd-accent: #e8e2d6; --gd-accent-ink: #e8e2d6; background: #202020; }
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stage">
    <!-- card A at the probe scale 3 (clean geometry) -->
    <div id="cardA" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:3; width:420px; position:relative;">
      <div id="titleA" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
      <div id="metaA" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
    </div>
    <!-- card D at the REAL grid scale 1 + the light accent behind -->
    <div id="cardD" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:1; width:140px; background:#202020; position:relative; margin-top:40px;">
      <div id="titleD" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
      <div id="metaD" class="gd-card-meta" style="color:#0044cc;">OCT 12 2025</div>
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
  const tmpHtml = path.join(os.tmpdir(), 'rim_shadow_1914.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  const ids = ['titleA', 'metaA', 'titleD', 'metaD'];
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

  // fill ink = STRONG blue; rim = red-dominant. Both sides profiled off the
  // glyph's own ink edges.
  const isFill = (r, g, b) => b >= 100 && r <= b * 0.45 && g <= b * 0.45;
  const redOf = (r, g, b) => (r >= 20 && g <= r * 0.55 && b <= r * 0.55 ? r : 0);

  // THE UNDER/OVER PROFILE: the box may carry the NEIGHBOR seat's ink (the
  // title's glyphs sit within the meta box's top margin and vice versa), so
  // the glyph rows are clustered first — the title's own rows are the FIRST
  // blue cluster, the date's own rows are the LAST one — then each column's
  // edges are read inside the seat's own cluster only.
  const profile = (bmp, W, H, side, maxDepth, clusterPick) => {
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
    if (!clusters.length) return { profile: [], cols: 0 };
    const [y0, y1] = clusterPick === 'last' ? clusters[clusters.length - 1] : clusters[0];
    const rows = [];
    for (let x = 0; x < W; x += 1) {
      let edge = -1;
      let first = -1;
      for (let y = y0; y <= y1; y += 1) {
        const i = (y * W + x) * 4;
        const r = bmp[i + 2], g = bmp[i + 1], b = bmp[i];
        if (isFill(r, g, b)) { edge = y; if (first < 0) first = y; }
      }
      if (edge < 0) continue;
      if (side === 'top') edge = first;
      const col = [];
      for (let d = 1; d <= maxDepth; d += 1) {
        const y = side === 'under' ? edge + d : edge - d;
        if (y < 0 || y >= H) { col.push(0); continue; }
        const i = (y * W + x) * 4;
        col.push(redOf(bmp[i + 2], bmp[i + 1], bmp[i]));
      }
      rows.push(col);
    }
    const out = [];
    for (let d = 0; d < maxDepth; d += 1) {
      out.push(median(rows.map((c) => c[d]).filter((v) => v !== null)));
    }
    return { profile: out, cols: rows.length, clusters: clusters.length, band: [y0, y1] };
  };

  const readSeat = async (id, maxDepth, clusterPick) => {
    const { bmp, W, H, png } = await grab(id);
    return {
      under: profile(bmp, W, H, 'under', maxDepth, clusterPick),
      over: profile(bmp, W, H, 'top', maxDepth, clusterPick),
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

  const dump = (png, file) => fs.writeFileSync(path.join('/tmp', 'render_1914', file), png);
  fs.mkdirSync('/tmp/render_1914', { recursive: true });

  console.log('\n== REST (the 1.7px stroke: the under-band under the lettering) ==');
  await clearSel();
  const rest = {};
  for (const id of ids) { rest[id] = await readSeat(id, id.endsWith('A') ? 12 : 5, id.startsWith('meta') ? 'last' : 'first'); }
  dump(rest.titleA.png, 'titleA_rest.png');
  dump(rest.metaA.png, 'metaA_rest.png');
  dump(rest.titleD.png, 'titleD_rest.png');
  dump(rest.metaD.png, 'metaD_rest.png');

  console.log('\n== whole-document selection (the disease seat) ==');
  await selectAllDoc();
  const sweep = {};
  for (const id of ids) { sweep[id] = await readSeat(id, id.endsWith('A') ? 12 : 5, id.startsWith('meta') ? 'last' : 'first'); }
  dump(sweep.titleA.png, 'titleA_sweep.png');
  dump(sweep.metaA.png, 'metaA_sweep.png');
  dump(sweep.titleD.png, 'titleD_sweep.png');
  dump(sweep.metaD.png, 'metaD_sweep.png');
  await clearSel();

  const fmt = (p) => (p && p.profile ? p.profile.map((v) => (v === null || v === undefined ? ' --' : String(Math.round(v)).padStart(3))).join(' ') : '(none)');
  for (const id of ids) {
    const r = rest[id];
    const s = sweep[id];
    console.log(`\n[${id}] cols=${r.under.cols} clusters=${r.under.clusters} band=${r.under.band}`);
    console.log(`  rest  under(d1..): ${fmt(r.under)}`);
    console.log(`  sweep under(d1..): ${fmt(s.under)}`);
    console.log(`  rest  over (d1..): ${fmt(r.over)}`);
    console.log(`  sweep over (d1..): ${fmt(s.over)}`);
  }
  app.exit(0);
};

run().catch((e) => {
  console.error('probe crashed:', e);
  app.exit(1);
});
