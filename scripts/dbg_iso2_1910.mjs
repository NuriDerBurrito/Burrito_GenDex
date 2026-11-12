import { chromium } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const tint = '#800000';
const SEATS = ['gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'];
const inner = SEATS.map((c) => `<span class="${c}"></span>`).join('');
const card = `<div class="pc gd-fin-ground-dark" style="--gd-card-tint:${tint}; background:${tint}"><span class="gd-card-face-finish gd-finish-prismatic">${inner}</span></div>`;
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
console.log('A', A.info.width, 'x', A.info.height, ' B', B.info.width, 'x', B.info.height, 'channels', A.info.channels, B.info.channels);
let mag = 0, tot = 0;
const W = Math.min(A.info.width, B.info.width), H = Math.min(A.info.height, B.info.height);
let worst = 0, worstXY = [0, 0];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * A.info.width + x) * A.info.channels;
  const j = (y * B.info.width + x) * B.info.channels;
  const d = (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2])) / 3;
  mag += d; tot += 1;
  if (d > worst) { worst = d; worstXY = [x, y]; }
}
console.log(`mean diff = ${(mag / tot).toFixed(3)}  worst = ${worst.toFixed(1)} at (${worstXY[0]},${worstXY[1]})`);
await browser.close();
