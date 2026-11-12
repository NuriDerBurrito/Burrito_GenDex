// render_yielding_coat_195.mjs — the render shot: every coat on every
// extreme plate PLUS the volume knob's own row (the default 0.85 the app
// now speaks, and the slider's two ends), saved as one PNG for the eye's
// own verdict.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};
const PLATES = [
  ['white', '#f7f7f7', 'gd-fin-ground-light'],
  ['gold', '#ffcc33', 'gd-fin-ground-light'],
  ['black', '#141414', 'gd-fin-ground-dark'],
  ['vivid', '#e02020', 'gd-fin-ground-vivid'],
  ['blue', '#4466aa', ''],
];
const card = (finish, tint, toneClass, strength = null, label = null) => {
  const seats = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-foil-ripples') {
        inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:3s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:6s"></span>';
      }
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      return `<span class="gd-card-face-finish ${c}">${inner}</span>`;
    })
    .join('');
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" style="--gd-card-tint:${tint}; background:${tint};${strength != null ? ` --gd-fin-strength:${strength};` : ''}"><span class="lbl">${label || finish}</span>${seats}</div>`;
};
const rows = Object.keys(SEATS).map((finish) => PLATES.map(([name, tint, tone]) => ({ finish, name, tint, tone })));
// the knob row: prismatic + nuri on blue at strength 1 / 0.85 (the app's
// new default voice) / 0.4 / 0 — the slider's whole rail in one breath
const KNOB = [
  ['prismatic', 1, 'prismatic · 0%'], ['prismatic', 0.85, 'prismatic · 15% (default)'], ['prismatic', 0.4, 'prismatic · 60%'], ['prismatic', 0, 'prismatic · 100%'],
  ['nuri', 1, 'nuri · 0%'], ['nuri', 0.85, 'nuri · 15% (default)'], ['nuri', 0.4, 'nuri · 60%'], ['nuri', 0, 'nuri · 100%'],
];
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #232329; }
  #field { display: grid; grid-template-columns: repeat(5, 196px); gap: 12px; padding: 12px; }
  #knob { display: grid; grid-template-columns: repeat(4, 196px); gap: 12px; padding: 12px; }
  .pc { position: relative; width: 190px; height: 258px; overflow: hidden; border-radius: 10px; }
  .lbl { position: absolute; bottom: 4px; right: 8px; z-index: 9; font: 600 10px/1 sans-serif; color: #fff; background: rgba(0,0,0,.55); padding: 3px 6px; border-radius: 4px; letter-spacing: .08em; text-transform: uppercase; }
</style></head><body><div id="field">${rows.flat().map((r) => card(r.finish, r.tint, r.tone)).join('\n')}</div>
<div id="knob">${KNOB.map(([f, s, l]) => card(f, '#4466aa', '', s, l)).join('\n')}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1060, height: 2100 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);
await page.screenshot({ path: '/tmp/render/yielding_coat_195.png', fullPage: true });
await browser.close();
console.log('/tmp/render/yielding_coat_195.png saved');
