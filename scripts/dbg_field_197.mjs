import { chromium } from 'playwright';
import path from 'node:path';
const tree = '/home/z/my-project/burrito_gendex_196';
const PLATES = [['red','#ff0000'],['yellow','#ffff00'],['green','#00ff00'],['magenta','#ff00ff'],['black','#000000'],['nearblack','#141414']];
const groundOf = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const sat = mx > 0 ? (mx - mn) / mx : 0;
  if (lum >= 0.78) return 'gd-fin-ground-light';
  if (lum <= 0.19) return 'gd-fin-ground-dark';
  if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';
  return '';
};
const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};
const card = (finish, tint) => {
  const seats = SEATS[finish].map((c) => {
    let inner = '';
    if (c === 'gd-finish-foil-ripples') inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span>';
    if (c === 'gd-finish-holographic') inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
    return `<span class="gd-card-face-finish ${c}">${inner}</span>`;
  }).join('');
  return `<div class="pc${groundOf(tint) ? ' ' + groundOf(tint) : ''}" style="--gd-card-tint:${tint}; background:${tint}">${seats}</div>`;
};
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(${PLATES.length}, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${Object.keys(SEATS).flatMap(f => PLATES.map(([,t]) => card(f, t))).join('\n')}</div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 190*PLATES.length, height: 1600 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);
await page.screenshot({ path: '/tmp/render/dbg_field_197.png', fullPage: true });
await browser.close();
console.log('saved');
