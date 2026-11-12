import { chromium } from 'playwright';
import path from 'node:path';
const tint = '#ff0000';
const card = `<div class="pc" style="--gd-card-tint:${tint}; --gd-fin-ink:#8c2020; --gd-fin-glow:#e08a8a; --gd-fin-art:#d97c7c; background:${tint}"><span class="gd-card-face-finish gd-finish-foil"></span><span class="gd-card-face-finish gd-finish-foil-ripples"><span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:3s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:6s"></span></span><span class="gd-card-face-finish gd-finish-auric"></span></div>`;
const freeze = '* { animation-play-state: paused !important; }';
const browser = await chromium.launch();
for (const [name, cssPath] of [['cur', path.resolve('src/index.css')], ['fix', path.resolve('scripts/fixtures/index_classic_192_coat.css')]]) {
  const page = await browser.newPage({ viewport: { width: 240, height: 320 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body>${card}</body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/tmp/render/fixprobe_${name}.png` });
  const styles = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.gd-card-face-finish')) {
      const cs = getComputedStyle(el);
      out.push({ cls: el.className.slice(19), bg: cs.background.slice(0, 100), blend: cs.mixBlendMode, op: cs.opacity, anim: cs.animationName + ' ' + cs.animationPlayState });
    }
    const rip = getComputedStyle(document.querySelector('.gd-foil-ripple'));
    out.push({ cls: 'ripple', bg: rip.background.slice(0, 100), blend: rip.mixBlendMode, op: rip.opacity, anim: rip.animationName + ' ' + rip.animationPlayState + ' delay=' + rip.animationDelay });
    return out;
  });
  console.log(name, JSON.stringify(styles, null, 1));
  await page.close();
}
await browser.close();
