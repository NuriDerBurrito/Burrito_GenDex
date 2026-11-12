import { chromium } from 'playwright';
import path from 'node:path';
const tint = '#ff0000';
const card = (c) => `<div class="pc" style="--gd-card-tint:${tint}; background:${tint}"><span class="gd-card-face-finish ${c}"></span></div>`;
const seats = ['gd-finish-foil', 'gd-finish-auric', 'gd-finish-prismatic'];
const freeze = '* { animation-play-state: paused !important; }';
const html = `<!doctype html><html><head><style>body{margin:0;background:#2a2a33}#field{display:grid;grid-template-columns:repeat(${seats.length},190px);gap:10px;padding:10px}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body><div id="field">${seats.map((s) => card(s)).join('\n')}</div></body></html>`;
const browser = await chromium.launch();
for (const [name, cssPath] of [['cur', path.resolve('src/index.css')], ['fix', path.resolve('scripts/fixtures/index_classic_192_coat.css')]]) {
  const page = await browser.newPage({ viewport: { width: 600, height: 320 } });
  await page.setContent(html);
  await page.addStyleTag({ path: cssPath });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/tmp/render/field_${name}.png` });
  await page.close();
}
await browser.close();
console.log('rendered');
