import { chromium } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const PLATES = [
  ['dgray', '#2a2a2a'], ['deepred', '#800000'], ['deepgreen', '#008000'],
  ['deepblue', '#000080'], ['g52', '#525252'], ['lagoon', '#2f9e77'],
  ['ember', '#c8402f'], ['sunburst', '#ffd400'],
];
const SEATS = {
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
};
const twin = () => '#123456'; // irrelevant for non-numeix
const groundOf = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum >= 0.7) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
  return 'gd-fin-ground-dark';
};
const card = (finish, tint) => {
  const seats = SEATS[finish].map((c) => `<span class="gd-card-face-finish ${c}"></span>`).join('');
  return `<div class="pc${groundOf(tint) ? ` ${groundOf(tint)}` : ''}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin()}; --gd-fin-glow:${twin()}; --gd-fin-art:${twin()}; background:${tint}">${seats}</div>`;
};
const freeze = '* { animation: none !important; }';
const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-gpu-compositing'] });
async function render(cssPath, finish) {
  const cards = PLATES.map(([, t]) => card(finish, t)).join('\n');
  const page = await browser.newPage({ viewport: { width: 8 * 200, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}#field{display:grid;grid-template-columns:repeat(8,190px);gap:10px;padding:10px}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body><div id="field">${cards}</div></body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.addStyleTag({ content: 'html, body { background: #2a2a33 !important; margin: 0 !important; }' });
  await page.waitForTimeout(300);
  const shot = await page.screenshot({ fullPage: true });
  await page.close();
  return sharp(shot).raw().toBuffer({ resolveWithObject: true });
}
for (const finish of Object.keys(SEATS)) {
  const A1 = await render(path.resolve('src/index.css'), finish);
  const A2 = await render(path.resolve('src/index.css'), finish);
  const B = await render(path.resolve('scripts/fixtures/index_classic_192_coat.css'), finish);
  let dAB = 0, dA1A2 = 0, tot = 0;
  for (let y = 10; y < 260; y += 2) for (let x = 10; x < 10 + 8 * 200 - 14; x += 2) {
    const i = (y * A1.info.width + x) * A1.info.channels;
    const i2 = (y * A2.info.width + x) * A2.info.channels;
    const j = (y * B.info.width + x) * B.info.channels;
    dAB += (Math.abs(A1.data[i] - B.data[j]) + Math.abs(A1.data[i+1] - B.data[j+1]) + Math.abs(A1.data[i+2] - B.data[j+2])) / 3;
    dA1A2 += (Math.abs(A1.data[i] - A2.data[i2]) + Math.abs(A1.data[i+1] - A2.data[i2+1]) + Math.abs(A1.data[i+2] - A2.data[i2+2])) / 3;
    tot += 1;
  }
  console.log(`${finish}: cur-vs-classic=${(dAB/tot).toFixed(3)}  cur-vs-cur(run stability)=${(dA1A2/tot).toFixed(3)}`);
}
await browser.close();
