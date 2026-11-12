#!/usr/bin/env node
// 1.9.14 FULL-DIFF PROBE — the whole title+date region, rest vs each sweep
// road, pixel-diffed. Roads verified live (selection state printed). The
// card sits at the REAL grid scale (1 and 1.2 both measured). If the
// ::selection contour fires, the diff is nonzero and the under-band's
// darkness profile tells whether the shadow under the lettering survives.
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
.gd-card { border: none !important; }
#cardE { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); background: #191919; }
</style></head><body>
  <div id="header" style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
    <div style="flex:1"></div>
    <div id="label" class="truncate" style="font-size:10px;letter-spacing:0.22em;">ALL CARDS &middot; 42 CARDS</div>
  </div>
  <div class="probe-stage">
    <div id="cardE" class="gd-card gd-card-collector gd-card-pulse gd-has-finish select-none"
         style="--card-scale:SCALETOKEN; width:420px; position:relative;">
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

  const grabRegion = async () => {
    const rect = JSON.parse(await win.webContents.executeJavaScript(`(() => {
      const b = document.getElementById('cardE').getBoundingClientRect();
      return JSON.stringify({ x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) });
    })()`));
    const img = await win.webContents.capturePage({ x: rect.x, y: rect.y, width: rect.w, height: rect.h });
    return { bmp: img.getBitmap(), W: img.getSize().width, H: img.getSize().height };
  };

  const diffCount = (a, b) => {
    let n = 0;
    const rows = {};
    for (let i = 0; i < a.length; i += 4) {
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) {
        n += 1;
        const y = Math.floor((i / 4) / (a.length / 4 / (a.length / 4 / Math.sqrt(a.length / 4)))); // unused
      }
    }
    return n;
  };

  const selState = async () => JSON.parse(await win.webContents.executeJavaScript(`(() => {
    const s = window.getSelection();
    return JSON.stringify({ ranges: s.rangeCount, text: s.toString().slice(0, 40) });
  })()`));

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

  for (const scale of ['0.7', '0.8', '0.9', '1', '1.2', '1.3']) {
    const tmpHtml = path.join(os.tmpdir(), `rim_diff_1914_${scale}.html`);
    fs.writeFileSync(tmpHtml, html.replace('SCALETOKEN', scale), 'utf8');
    await win.loadFile(tmpHtml);
    await settle(400);
    const debug = JSON.parse(await win.webContents.executeJavaScript(`(() => {
      const t = document.getElementById('titleE');
      const c = document.getElementById('cardE');
      const b = c.getBoundingClientRect();
      return JSON.stringify({ font: getComputedStyle(t).fontSize, cardH: b.height, cardScaleVar: c.style.getPropertyValue('--card-scale') });
    })()`));
    console.log(`\n===== --card-scale ${scale} (page: ${JSON.stringify(debug)}) =====`);

    await clearSel();
    const rest = await grabRegion();

    await bodyRange();
    const st1 = await selState();
    const sweepBody = await grabRegion();
    console.log(`  body-range sel=${JSON.stringify(st1)} diff=${diffCount(rest.bmp, sweepBody.bmp)}px (of ${rest.bmp.length / 4})`);

    await clearSel();
    await ctrlA();
    const st2 = await selState();
    const sweepCA = await grabRegion();
    console.log(`  ctrl-A     sel=${JSON.stringify(st2)} diff=${diffCount(rest.bmp, sweepCA.bmp)}px`);

    // the under-band profile, clustered — TITLE (bright white ink) and
    // DATE (gray ink) both profiled; the date is the small seat the report
    // names first
    const prof = (bmp, W, H, gray) => {
      const bright = gray
        ? (i) => bmp[i + 2] > 90 && bmp[i + 1] > 90 && bmp[i] > 90 && Math.abs(bmp[i + 2] - bmp[i + 1]) < 30 && bmp[i] < 200
        : (i) => bmp[i + 2] > 180 && bmp[i + 1] > 180 && bmp[i] > 180;
      const rowBright = new Array(H).fill(0);
      for (let y = 0; y < H; y += 1) {
        let n = 0;
        for (let x = 0; x < W; x += 1) if (bright((y * W + x) * 4)) n += 1;
        rowBright[y] = n;
      }
      const clusters = [];
      let start = -1;
      for (let y = 0; y <= H; y += 1) {
        const on = y < H && rowBright[y] > 0;
        if (on && start < 0) start = y;
        if (!on && start >= 0) { clusters.push([start, y - 1]); start = -1; }
      }
      if (!clusters.length) return '(no ink)';
      const pick = gray ? clusters[clusters.length - 1] : clusters[0];
      const [y0, y1] = pick;
      const darks = [];
      for (let x = 0; x < W; x += 1) {
        let edge = -1;
        for (let y = y0; y <= y1; y += 1) if (bright((y * W + x) * 4)) edge = y;
        if (edge < 0) continue;
        for (let d = 1; d <= 6; d += 1) {
          const y = edge + d;
          if (y >= H) break;
          const i = (y * W + x) * 4;
          darks.push(`${d}:${Math.round((bmp[i + 2] + bmp[i + 1] + bmp[i]) / 3)}`);
        }
      }
      const agg2 = {};
      for (const v of darks) { const [d, l] = v.split(':'); (agg2[d] = agg2[d] || []).push(Number(l)); }
      return Object.keys(agg2).sort((a, b) => a - b).map((d) => {
        const s = agg2[d].sort((a, b) => a - b);
        return `d${d}=${s[Math.floor(s.length / 2)]}`;
      }).join(' ');
    };
    console.log(`  rest  title-under: ${prof(rest.bmp, rest.W, rest.H, false)}`);
    console.log(`  ctrlA title-under: ${prof(sweepCA.bmp, sweepCA.W, sweepCA.H, false)}`);
    console.log(`  rest  date-under : ${prof(rest.bmp, rest.W, rest.H, true)}`);
    console.log(`  ctrlA date-under : ${prof(sweepCA.bmp, sweepCA.W, sweepCA.H, true)}`);
    await clearSel();
  }
  app.exit(0);
};

run().catch((e) => { console.error('probe crashed:', e); app.exit(1); });
