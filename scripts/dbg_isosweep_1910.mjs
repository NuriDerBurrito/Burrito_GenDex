import { chromium } from 'playwright';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

// worst offenders from the field diag
const PLATES = [
  ['dgray', '#2a2a2a'], ['deepred', '#800000'], ['deepgreen', '#008000'],
  ['deepblue', '#000080'], ['g52', '#525252'], ['lagoon', '#2f9e77'],
  ['ember', '#c8402f'], ['sunburst', '#ffd400'], ['black', '#000000'],
  ['deepmagenta', '#800080'], ['g66', '#666666'], ['e7c35b', '#e7c35b'],
];
const FINISHES = ['prismatic', 'auric', 'foil', 'nuri', 'holographic'];
const SEATS = {
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
};
const twin = () => '#123456';
const groundOf = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum >= 0.7) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
  return 'gd-fin-ground-dark';
};
const mkCard = (finish, tint) => {
  let inner = '';
  if (finish === 'foil') inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span>';
  if (finish === 'holographic') inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
  const seats = SEATS[finish].map((c) => `<span class="gd-card-face-finish ${c}">${c.includes('ripples') ? inner : ''}</span>`).join('');
  return `<div class="pc ${groundOf(tint)}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin()}; --gd-fin-glow:${twin()}; --gd-fin-art:${twin()}; background:${tint}">${seats}</div>`;
};
const freeze = '* { animation: none !important; }';
const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-gpu-compositing'] });
async function render(cssPath, html) {
  const page = await browser.newPage({ viewport: { width: 220, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body>${html}</body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.addStyleTag({ content: 'html, body { background: #2a2a33 !important; margin: 0 !important; }' });
  await page.waitForTimeout(250);
  const shot = await page.screenshot();
  await page.close();
  return sharp(shot).raw().toBuffer({ resolveWithObject: true });
}
let worst = 0, worstName = '';
for (const finish of FINISHES) {
  for (const [name, tint] of PLATES) {
    const html = mkCard(finish, tint);
    const A = await render(path.resolve('src/index.css'), html);
    const B = await render(path.resolve('scripts/fixtures/index_classic_192_coat.css'), html);
    let mag = 0, tot = 0;
    for (let y = 8; y < 258; y += 2) for (let x = 8; x < 172; x += 2) {
      const i = (y * A.info.width + x) * A.info.channels;
      const j = (y * B.info.width + x) * B.info.channels;
      mag += (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2])) / 3;
      tot += 1;
    }
    const d = mag / tot;
    if (d > worst) { worst = d; worstName = `${finish}@${name}`; }
    console.log(`${finish.padEnd(12)} ${name.padEnd(13)} iso drift = ${d.toFixed(3)}`);
  }
}
console.log(`\nWORST: ${worstName} = ${worst.toFixed(3)}`);
await browser.close();
