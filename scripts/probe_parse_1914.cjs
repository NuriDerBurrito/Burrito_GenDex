const { app, BrowserWindow } = require('electron');
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const html = `<!doctype html><html><head><style>
#t1, #t2, #t3 { --gd-fin-ink-outline: rgba(13, 10, 7, 0.66); --gd-card-tint: #191919; color: #fff; font-size: 40px; }
#t1::selection { text-shadow: 2px 0 0 rgb(from var(--gd-fin-ink-outline) r g b / 1); }
#t2::selection { text-shadow: 2px 0 0 color-mix(in srgb, rgb(from var(--gd-fin-ink-outline) r g b / 1) 66%, var(--gd-card-tint, var(--gd-panel))); }
#t3::selection { text-shadow: 2px 0 0 color-mix(in srgb, rgb(from var(--gd-fin-ink-outline) r g b / 1) 66%, var(--gd-card-tint, var(--gd-panel))), -2px 0 0 color-mix(in srgb, rgb(from var(--gd-fin-ink-outline) r g b / 1) 66%, var(--gd-card-tint, var(--gd-panel))); }
</style></head><body><div id="t1">A</div><div id="t2">A</div><div id="t3">A</div></body></html>`;
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 400, height: 300, webPreferences: { offscreen: true } });
  const fs = require('fs'); const os = require('os'); const path = require('path');
  const f = path.join(os.tmpdir(), 'parse_1914.html');
  fs.writeFileSync(f, html, 'utf8');
  await win.loadFile(f);
  await settle(400);
  const out = await win.webContents.executeJavaScript(`JSON.stringify([1,2,3].map((n) => getComputedStyle(document.getElementById('t'+n), '::selection').textShadow))`);
  console.log('PARSE RESULTS:');
  JSON.parse(out).forEach((s, i) => console.log(`  t${i+1}:`, s));
  app.exit(0);
});
