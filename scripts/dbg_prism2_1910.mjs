import { chromium } from 'playwright';
import path from 'node:path';
const tint = '#ff0000';
const card = `<div class="pc" style="--gd-card-tint:${tint}; background:${tint}"><span class="gd-card-face-finish gd-finish-prismatic"><span class="gd-prism-stars"></span><span class="gd-prism-particles"></span><span class="gd-prism-waves"></span><span class="gd-prism-sweep"></span></span></div>`;
const freeze = '* { animation-play-state: paused !important; }';
const browser = await chromium.launch();
const out = {};
for (const [name, cssPath] of [['cur', path.resolve('src/index.css')], ['fix', path.resolve('scripts/fixtures/index_classic_192_coat.css')]]) {
  const page = await browser.newPage({ viewport: { width: 220, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body>${card}</body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.waitForTimeout(400);
  const dump = await page.evaluate(() => {
    const rows = [];
    for (const el of document.querySelectorAll('.gd-card-face-finish, .gd-card-face-finish *')) {
      const cs = getComputedStyle(el, '::before');
      const csB = getComputedStyle(el);
      rows.push({
        cls: el.className,
        op: csB.opacity, blend: csB.mixBlendMode,
        tf: csB.transform.slice(0, 60),
        bgB: csB.background.slice(0, 90),
        bgPseudo: (cs.backgroundImage || '').slice(0, 60),
        opPseudo: cs.opacity,
        anims: el.getAnimations({ subtree: false }).map(a => `${a.animationName}(${a.playState},t=${a.currentTime == null ? 'null' : Math.round(a.currentTime)})`).join(','),
      });
    }
    return rows;
  });
  out[name] = dump;
  await page.close();
}
await browser.close();
const a = JSON.stringify(out.cur, null, 1).split('\n');
const b = JSON.stringify(out.fix, null, 1).split('\n');
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) console.log(`L${i}\n  cur: ${a[i]}\n  fix: ${b[i]}`);
}
console.log('done');
