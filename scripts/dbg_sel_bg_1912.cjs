#!/usr/bin/env node
// mini-diagnosis: does ::selection background resolve/paint from a var(),
// a literal, my scoped rule, or the global rule — and what does the
// computed ::selection style actually say on the rimmed title?
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
#cardA { --gd-fin-ink-outline: #ff0000; }
#literal ::selection { background: #ffd400; color: #0044cc; }
</style></head><body>
  <div id="label" style="font-size:14px; padding:10px;">PLAIN SELECTABLE LABEL TEXT</div>
  <div id="literal" style="font-size:14px; padding:10px;">LITERAL BACKGROUND SEAT</div>
  <div id="cardA" class="gd-has-finish" style="--card-scale:3; background:#f2f2f2; width:420px;">
    <div id="titleA" class="gd-card-title" style="color:#0044cc; font-weight:700;">Test Card</div>
  </div>
</body></html>`;

const run = async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    show: false, width: 900, height: 600,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
  });
  const tmp = path.join(os.tmpdir(), 'sel_diag_1912.html');
  fs.writeFileSync(tmp, html, 'utf8');
  await win.loadFile(tmp);
  await settle(400);

  const diag = JSON.parse(await win.webContents.executeJavaScript(`JSON.stringify((() => {
    const out = {};
    for (const id of ['label', 'literal', 'titleA']) {
      const el = document.getElementById(id);
      const cs = getComputedStyle(el, '::selection');
      out[id] = { bg: cs.backgroundColor, color: cs.color, shadow: cs.textShadow.slice(0, 60) };
    }
    return out;
  })())`));
  console.log('computed ::selection at rest:');
  for (const [k, v] of Object.entries(diag)) console.log(`  ${k.padEnd(8)} bg=${v.bg} color=${v.color}`);

  // paint check: select the whole body, then read the label/literal/title boxes
  const sel = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const s = window.getSelection(); s.removeAllRanges();
      const r = document.createRange(); r.selectNodeContents(document.body); s.addRange(r);
    })()`);
    await settle(180);
  };
  await sel();
  const out = JSON.parse(await win.webContents.executeJavaScript(`JSON.stringify((() => {
    const count = (id) => {
      const el = document.getElementById(id);
      const b = el.getBoundingClientRect();
      // note: capturePage happens outside; here just report the rects
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    };
    return { label: count('label'), literal: count('literal'), titleA: count('titleA') };
  })())`));
  const read = async (b) => {
    const img = await win.webContents.capturePage({ x: Math.floor(b.x) - 4, y: Math.floor(b.y) - 4, width: Math.ceil(b.w) + 8, height: Math.ceil(b.h) + 8 });
    const bmp = img.getBitmap();
    let acc = 0;
    for (let i = 0; i < bmp.length; i += 4) {
      const r = bmp[i + 2], g = bmp[i + 1], b2 = bmp[i];
      if (r > 215 && g > 172 && g < 252 && b2 < 80) acc += 1;
    }
    return acc;
  };
  console.log('\nmid whole-document selection, accent pixels per seat:');
  console.log('  label   ', await read(out.label));
  console.log('  literal ', await read(out.literal));
  console.log('  titleA  ', await read(out.titleA));
  app.exit(0);
};
run().catch((e) => { console.error(e); app.exit(1); });
