import { chromium } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const tint = '#525252';
const SEATS = ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'];
const inner = SEATS.slice(1).map((c) => `<span class="${c}"></span>`).join('');
const card = `<div class="pc gd-fin-ground-dark" style="--gd-card-tint:${tint}; --gd-fin-ink:#123456; --gd-fin-glow:#123456; --gd-fin-art:#123456; background:${tint}"><span class="gd-card-face-finish gd-finish-prismatic">${inner}</span></div>`;
const freeze = '* { animation: none !important; }';
const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-gpu-compositing'] });
async function render(cssPath) {
  const page = await browser.newPage({ viewport: { width: 220, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body>${card}</body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.addStyleTag({ content: 'html, body { background: #2a2a33 !important; margin: 0 !important; }' });
  await page.waitForTimeout(250);
  const shot = await page.screenshot();
  if (cssPath.includes('fixtures')) {
    const styles = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('.gd-card-face-finish, .gd-card-face-finish *')) {
        const cs = getComputedStyle(el);
        out.push({ cls: el.className, bg: cs.backgroundImage.slice(0, 70), blend: cs.mixBlendMode, op: cs.opacity, filt: cs.filter, mask: (cs.maskImage || cs.webkitMaskImage || '').slice(0, 50), trans: cs.transform.slice(0, 40) });
      }
      return out;
    });
    globalThis.B_STYLES = JSON.stringify(styles);
  } else {
    const styles = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('.gd-card-face-finish, .gd-card-face-finish *')) {
        const cs = getComputedStyle(el);
        out.push({ cls: el.className, bg: cs.backgroundImage.slice(0, 70), blend: cs.mixBlendMode, op: cs.opacity, filt: cs.filter, mask: (cs.maskImage || cs.webkitMaskImage || '').slice(0, 50), trans: cs.transform.slice(0, 40) });
      }
      return out;
    });
    globalThis.A_STYLES = JSON.stringify(styles);
  }
  await page.close();
  return sharp(shot).raw().toBuffer({ resolveWithObject: true });
}
const A = await render(path.resolve('src/index.css'));
const B = await render(path.resolve('scripts/fixtures/index_classic_192_coat.css'));
console.log('computed styles identical:', globalThis.A_STYLES === globalThis.B_STYLES);
if (globalThis.A_STYLES !== globalThis.B_STYLES) {
  const a = JSON.parse(globalThis.A_STYLES), b = JSON.parse(globalThis.B_STYLES);
  for (let i = 0; i < a.length; i++) console.log('A:', JSON.stringify(a[i]), '\nB:', JSON.stringify(b[i]));
}
// 3x3 region drift map (interior of card at x 20..200, y 20..280)
const RX = [20, 80, 140], RY = [20, 106, 192];
for (const [ry, rn] of [[20, 'top'], [106, 'mid'], [192, 'bot']]) {
  const row = [];
  for (const rx of RX) {
    let mag = 0, tot = 0;
    for (let y = ry; y < ry + 60; y += 2) for (let x = rx; x < rx + 60; x += 2) {
      const i = (y * A.info.width + x) * A.info.channels;
      const j = (y * B.info.width + x) * B.info.channels;
      mag += (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2])) / 3;
      tot += 1;
    }
    row.push((mag / tot).toFixed(2));
  }
  console.log(`${rn}: ${row.join('  ')}`);
}
await browser.close();
