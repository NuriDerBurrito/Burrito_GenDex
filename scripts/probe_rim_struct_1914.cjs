#!/usr/bin/env node
// 1.9.14 STRUCTURAL RIG — the REAL card markup stack (gd-card root > foot >
// foot-name > title[truncate] + meta + vers badge), the real inline vars
// (--gd-foot-plate, --card-scale 1), the top-bar label present, rest vs
// whole-document sweep. Full-pixel diff + under-band profile + crops.
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
  fontFace('Space Grotesk', 700, 'space-grotesk/files/space-grotesk-latin-700-normal.woff2'),
].join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FACES}
${APP_CSS}
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-none { user-select: none; -webkit-user-select: none; }
.min-w-0 { min-width: 0; }
.font-bold { font-weight: 700; }
.leading-tight { line-height: 1.25; }
.tracking-014em { letter-spacing: 0.14em; }
body { margin: 0; font-family: var(--gd-body-font, 'IBM Plex Mono', ui-monospace, monospace); }
.probe-stage { padding: 24px; --gd-accent: #ffd400; --gd-accent-ink: #131313; background: #0f0f0f; --gd-body-font: 'IBM Plex Mono', ui-monospace, monospace; }
#cardE { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); --gd-card-tint: #191919; background: #191919; width: 180px; }
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stage">
    <div id="cardE" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:1; position:relative;">
      <div class="gd-card-foot" style="--gd-foot-plate: #191919;">
        <div class="gd-card-foot-name min-w-0">
          <div id="titleE" class="gd-card-title font-bold leading-tight truncate" style="color: var(--gd-panel-text);">Test Card</div>
        </div>
        <div id="metaE" class="gd-card-meta gd-card-meta-line tracking-014em" style="color: var(--gd-mute);">OCT 12 2025</div>
        <span class="gd-card-vers" aria-label="3 versions"><span class="gd-card-vers-badge" style="color: var(--gd-accent);">3 VER</span></span>
      </div>
    </div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false, width: 900, height: 600,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'rim_struct_1914.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  fs.mkdirSync('/tmp/render_1914', { recursive: true });
  const grabCard = async (file) => {
    const rect = JSON.parse(await win.webContents.executeJavaScript(`(() => {
      const b = document.getElementById('cardE').getBoundingClientRect();
      return JSON.stringify({ x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) });
    })()`));
    const img = await win.webContents.capturePage({ x: rect.x, y: rect.y, width: rect.w, height: rect.h });
    fs.writeFileSync(path.join('/tmp/render_1914', file), img.toPNG());
    return { bmp: img.getBitmap(), W: img.getSize().width, H: img.getSize().height };
  };

  const prof = (bmp, W, H, seat) => {
    // title ink: bright (panel-text #f2f2f2); date ink: mid gray; both darker
    // than every plate. Detect by brightness threshold relative to plate 25.
    const thr = seat === 'title' ? 150 : 60;
    const isInk = (i) => bmp[i + 2] > thr && bmp[i + 1] > thr && bmp[i] > thr;
    const rowInk = new Array(H).fill(0);
    for (let y = 0; y < H; y += 1) {
      let n = 0;
      for (let x = 0; x < W; x += 1) if (isInk((y * W + x) * 4)) n += 1;
      rowInk[y] = n;
    }
    const clusters = [];
    let start = -1;
    for (let y = 0; y <= H; y += 1) {
      const on = y < H && rowInk[y] > 0;
      if (on && start < 0) start = y;
      if (!on && start >= 0) { clusters.push([start, y - 1]); start = -1; }
    }
    if (!clusters.length) return '(no ink)';
    const pick = seat === 'date' ? clusters[clusters.length - 1] : clusters[0];
    const [y0, y1] = pick;
    const darks = [];
    for (let x = 0; x < W; x += 1) {
      let edge = -1;
      for (let y = y0; y <= y1; y += 1) if (isInk((y * W + x) * 4)) edge = y;
      if (edge < 0) continue;
      for (let d = 1; d <= 5; d += 1) {
        const y = edge + d;
        if (y >= H) break;
        const i = (y * W + x) * 4;
        darks.push(`${d}:${Math.round((bmp[i + 2] + bmp[i + 1] + bmp[i]) / 3)}`);
      }
    }
    const agg = {};
    for (const v of darks) { const [d, l] = v.split(':'); (agg[d] = agg[d] || []).push(Number(l)); }
    return Object.keys(agg).sort((a, b) => a - b).map((d) => {
      const s = agg[d].sort((a, b) => a - b);
      return `d${d}=${s[Math.floor(s.length / 2)]}`;
    }).join(' ');
  };

  const clearSel = async () => {
    await win.webContents.executeJavaScript(`window.getSelection().removeAllRanges()`);
    await settle(150);
  };
  const sweepDoc = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const s = window.getSelection();
      s.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(document.body);
      s.addRange(r);
    })()`);
    await settle(300);
  };

  await clearSel();
  const rest = await grabCard('struct_rest.png');
  console.log(`rest  title-under: ${prof(rest.bmp, rest.W, rest.H, 'title')}`);
  console.log(`rest  date-under : ${prof(rest.bmp, rest.W, rest.H, 'date')}`);

  await sweepDoc();
  const sweep = await grabCard('struct_sweep.png');
  console.log(`sweep title-under: ${prof(sweep.bmp, sweep.W, sweep.H, 'title')}`);
  console.log(`sweep date-under : ${prof(sweep.bmp, sweep.W, sweep.H, 'date')}`);

  let diff = 0;
  for (let i = 0; i < rest.bmp.length; i += 4) {
    if (rest.bmp[i] !== sweep.bmp[i] || rest.bmp[i + 1] !== sweep.bmp[i + 1] || rest.bmp[i + 2] !== sweep.bmp[i + 2]) diff += 1;
  }
  console.log(`diff = ${diff}px (of ${rest.bmp.length / 4})`);
  await clearSel();
  app.exit(0);
};

run().catch((e) => { console.error('probe crashed:', e); app.exit(1); });
