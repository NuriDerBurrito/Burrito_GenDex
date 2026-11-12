#!/usr/bin/env node
// 1.9.14 RAW PIXEL DUMP — one vertical strip through the title's glyphs,
// rest vs sweep, printing raw RGB per pixel so the band under the letters
// is seen byte-level (the profile rigs' fill detection got contaminated by
// the card's white trim + the near-invisible dark-on-dark contrast).
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
#cardE { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); background: #191919; }
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
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false, width: 900, height: 500,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'rim_raw_1914.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  const rect = JSON.parse(await win.webContents.executeJavaScript(`(() => {
    const b = document.getElementById('titleE').getBoundingClientRect();
    return JSON.stringify({ x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) });
  })()`));

  const dumpStrip = async (label) => {
    const img = await win.webContents.capturePage({ x: rect.x, y: rect.y, width: rect.w, height: rect.h + 40 });
    const size = img.getSize();
    const bmp = img.getBitmap();
    const W = size.width;
    // a strip through the middle of the glyphs (the 'st' of Test)
    const xs = [Math.floor(W * 0.18), Math.floor(W * 0.5)];
    for (const x of xs) {
      const lines = [];
      for (let y = 0; y < size.height; y += 1) {
        const i = (y * W + x) * 4;
        const r = bmp[i + 2], g = bmp[i + 1], b = bmp[i];
        lines.push(`${String(y).padStart(3)}: ${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}`);
      }
      console.log(`\n[${label}] column x=${x} (rect ${rect.w}x${rect.h})`);
      console.log(lines.join('\n'));
    }
  };

  await win.webContents.executeJavaScript(`window.getSelection().removeAllRanges()`);
  await settle(150);
  await dumpStrip('REST');
  await win.webContents.executeJavaScript(`(() => {
    const s = window.getSelection();
    s.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(document.body);
    s.addRange(r);
  })()`);
  await settle(200);
  await dumpStrip('SWEEP');
  app.exit(0);
};

run().catch((e) => { console.error('probe crashed:', e); app.exit(1); });
