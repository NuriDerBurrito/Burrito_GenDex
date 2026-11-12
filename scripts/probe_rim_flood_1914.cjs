#!/usr/bin/env node
// 1.9.14 FLOOD PROBE — does the REAL sweep paint the accent flood OVER the
// none-selectable card wall? Three roads, same rig (label + card, dark rim,
// plate #191919, accent #ffd400): the programmatic body range (the control —
// already known to fire the ::selection style without painting the flood),
// the real Ctrl+A through the input pipeline, and the real mouse DRAG from
// the top-bar label down across the card wall (the user's actual gesture).
// Yellow-pixel census in the card's plate region + a raw strip through the
// title's under-band, per road.
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
         style="--card-scale:1; width:420px; position:relative;">
      <div id="titleE" class="gd-card-title" style="color:#f2f2f2; font-weight:700;">Test Card</div>
      <div id="metaE" class="gd-card-meta" style="color:#9a9a9a;">OCT 12 2025</div>
    </div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false, width: 900, height: 600,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmpHtml = path.join(os.tmpdir(), 'rim_flood_1914.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  await win.loadFile(tmpHtml);
  await settle(500);

  const rect = JSON.parse(await win.webContents.executeJavaScript(`(() => {
    const b = document.getElementById('titleE').getBoundingClientRect();
    return JSON.stringify({ x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) });
  })()`));

  const isYellow = (r, g, b) => r > 200 && g > 170 && b < 60;

  const census = async (label) => {
    const img = await win.webContents.capturePage({ x: rect.x, y: rect.y, width: rect.w, height: rect.h + 40 });
    const size = img.getSize();
    const bmp = img.getBitmap();
    const W = size.width;
    let yellow = 0;
    const x = Math.floor(W * 0.18);
    const strip = [];
    for (let y = 0; y < size.height; y += 1) {
      let rowYellow = 0;
      for (let xx = 0; xx < W; xx += 1) {
        const i = (y * W + xx) * 4;
        if (isYellow(bmp[i + 2], bmp[i + 1], bmp[i])) { yellow += 1; rowYellow += 1; }
      }
      if (y >= 40 && y <= 50) strip.push(`y=${y} yellow=${rowYellow}`);
      const i = (y * W + x) * 4;
      const r = bmp[i + 2], g = bmp[i + 1], b = bmp[i];
      if (y >= 14 && y <= 48) strip.push(`  strip x=${x} y=${y}: ${r} ${g} ${b}`);
    }
    console.log(`\n[${label}] yellow pixels in title box+40 = ${yellow} (of ${W * size.height})`);
    console.log(strip.join('\n'));
  };

  const clearSel = async () => {
    await win.webContents.executeJavaScript(`window.getSelection().removeAllRanges()`);
    await settle(150);
  };
  const bodyRange = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const s = window.getSelection();
      s.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(document.body);
      s.addRange(r);
    })()`);
    await settle(250);
  };
  const ctrlA = async () => {
    await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'a', modifiers: ['control'] });
    await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'a', modifiers: ['control'] });
    await settle(300);
  };
  const dragFromLabel = async () => {
    const labelRect = JSON.parse(await win.webContents.executeJavaScript(`(() => {
      const b = document.getElementById('label').getBoundingClientRect();
      return JSON.stringify({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
    })()`));
    await win.webContents.sendInputEvent({ type: 'mouseDown', x: Math.round(labelRect.x), y: Math.round(labelRect.y), button: 'left', clickCount: 1 });
    await settle(60);
    // the drag sweeps down through the header's edge and across the card
    await win.webContents.sendInputEvent({ type: 'mouseMove', x: 400, y: 200, button: 'left' });
    await settle(40);
    await win.webContents.sendInputEvent({ type: 'mouseMove', x: 400, y: 320, button: 'left' });
    await settle(40);
    await win.webContents.sendInputEvent({ type: 'mouseUp', x: 400, y: 320, button: 'left' });
    await settle(300);
  };

  await clearSel();
  await census('REST');
  await clearSel();
  await bodyRange();
  await census('BODY-RANGE');
  await clearSel();
  await ctrlA();
  await census('CTRL-A');
  await clearSel();
  await dragFromLabel();
  await census('DRAG-FROM-LABEL');
  await clearSel();
  app.exit(0);
};

run().catch((e) => { console.error('probe crashed:', e); app.exit(1); });
