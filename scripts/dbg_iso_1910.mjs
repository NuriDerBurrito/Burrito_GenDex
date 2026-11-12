import { chromium } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const tint = '#800000';
const SEATS = ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'];
const inner = SEATS.slice(1).map((c) => `<span class="${c}"></span>`).join('');
const card = `<div class="pc gd-fin-ground-dark" style="--gd-card-tint:${tint}; --gd-fin-ink:#5a1616; --gd-fin-glow:#c96a6a; --gd-fin-art:#c26262; background:${tint}"><span class="gd-card-face-finish gd-finish-prismatic">${inner}</span></div>`;
const freeze = '* { animation: none !important; }';
const browser = await chromium.launch();
async function render(cssPath) {
  const page = await browser.newPage({ viewport: { width: 220, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body>${card}</body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.addStyleTag({ content: 'html, body { background: #2a2a33 !important; margin: 0 !important; }' });
  await page.waitForTimeout(300);
  const shot = await page.screenshot();
  await page.close();
  return sharp(shot).raw().toBuffer({ resolveWithObject: true });
}
const A = await render(path.resolve('src/index.css'));
const B = await render(path.resolve('scripts/fixtures/index_classic_192_coat.css'));
let mag = 0, tot = 0, worst = 0, worstXY = [0, 0];
for (let y = 0; y < 300; y++) for (let x = 0; x < 220; x++) {
  const i = (y * A.info.width + x) * 4;
  const d = (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2])) / 3;
  mag += d; tot += 1;
  if (d > worst) { worst = d; worstXY = [x, y]; }
}
console.log(`mean diff = ${(mag / tot).toFixed(3)}  worst = ${worst.toFixed(1)} at (${worstXY[0]},${worstXY[1]})`);
await browser.close();
