import { chromium } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const tint = '#ff0000';
const prismCard = `<div class="pc" style="--gd-card-tint:${tint}; background:${tint}"><span class="gd-card-face-finish gd-finish-prismatic"><span class="gd-prism-stars"></span><span class="gd-prism-particles"></span><span class="gd-prism-waves"></span><span class="gd-prism-sweep"></span></span></div>`;
const freeze = '* { animation: none !important; }';
const browser = await chromium.launch();
async function render(cssPath, cols) {
  const cards = Array(cols).fill(prismCard).join('\n');
  const page = await browser.newPage({ viewport: { width: 200 * cols, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}#field{display:grid;grid-template-columns:repeat(${cols},190px);gap:10px;padding:10px}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body><div id="field">${cards}</div></body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.addStyleTag({ content: 'html, body { background: #2a2a33 !important; margin: 0 !important; }' });
  await page.waitForTimeout(400);
  const shot = await page.screenshot({ fullPage: true });
  await page.close();
  return (await sharp(shot).raw().toBuffer({ resolveWithObject: true }));
}
for (const cols of [1, 2, 3, 6]) {
  const A = await render(path.resolve('src/index.css'), cols);
  const B = await render(path.resolve('scripts/fixtures/index_classic_192_coat.css'), cols);
  let mag = 0, tot = 0;
  for (let y = 10; y < 260; y += 2) {
    for (let x = 10; x < 10 + cols * 190 - 14; x += 2) {
      const i = (y * A.info.width + x) * A.info.channels;
      const j = (y * B.info.width + x) * B.info.channels;
      tot += 1;
      mag += (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2])) / 3;
    }
  }
  console.log(`cols=${cols}: mean render diff = ${(mag / tot).toFixed(2)}`);
}
await browser.close();
