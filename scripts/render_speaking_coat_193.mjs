// render_speaking_coat_193.mjs — the coat painted on real plates, for the
// eye's own verdict: a three-by-three field of mini cards (numeix / foil /
// auric) on the report's own extreme grounds (white / black / vivid red)
// beside an honest mid-tone blue, screenshotted for review.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
};

const card = (finish, tint, toneClass) => {
  const seats = SEATS[finish]
    .map((c) => `<span class="gd-card-face-finish ${c}">${c === 'gd-finish-foil-ripples' ? '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:3s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:6s"></span>' : ''}</span>`)
    .join('');
  const cls = toneClass ? ` ${toneClass}` : '';
  return `<div class="pc${cls}" style="--gd-card-tint:${tint}; background:${tint};">${seats}</div>`;
};

const PLATES = [
  ['white', '#f7f7f7', 'gd-fin-ground-light'],
  ['black', '#141414', 'gd-fin-ground-dark'],
  ['vivid', '#e02020', 'gd-fin-ground-vivid'],
  ['blue', '#4466aa', ''],
];

const cells = [];
for (const [finish] of Object.entries(SEATS)) {
  for (const [name, tint, tone] of PLATES) {
    cells.push(card(finish, tint, tone));
  }
}

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(4, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${cells.join('\n')}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/render/speaking_coat_193.png', clip: { x: 0, y: 0, width: 796, height: 530 } });
console.log('shot: /tmp/render/speaking_coat_193.png');
await browser.close();
