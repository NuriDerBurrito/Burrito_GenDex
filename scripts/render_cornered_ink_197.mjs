// render_cornered_ink_197.mjs — the eye's own field for THE CORNERED INK:
// every coat on the report's own corner patients (the suggestion
// palette's sunburst yellow, the pure channel hues, the white rail, the
// black rail) plus the emblem's plain truth on a ribbon card — one PNG
// for the record (/tmp/render/cornered_ink_197.png).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

// the twin (finishInkTwin's own math, mirrored — the luma rail + solver)
const twin = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  let s = 0;
  const l = (mx + mn) / 2;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  }
  const target = lum >= 0.5 ? Math.min(0.35 + 0.3 * lum, lum - 0.16) : lum + 0.16;
  const hslToRgb = (hh, ss, ll) => {
    if (ss === 0) return [ll, ll, ll];
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const hue = (t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    return [hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)];
  };
  const lumaAt = (ll) => {
    const [rr, gg, bb] = hslToRgb(h, s, ll);
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (lumaAt(mid) < target) lo = mid;
    else hi = mid;
  }
  const rgb = hslToRgb(h, s, (lo + hi) / 2);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${rgb.map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

const groundOf = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum >= 0.5) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
  return 'gd-fin-ground-dark';
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
  return `<div class="pc ${groundOf(tint)}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin(tint)}; --gd-fin-ph:0.31; background:${tint}">${seats}</div>`;
};

// the report's own patients: the suggestion yellow first
const PLATES = [
  ['#ffd400', 'sunburst'], ['#ffff00', 'yellow'], ['#00ff00', 'green'], ['#ff0000', 'red'],
  ['#ffffff', 'white'], ['#141414', 'black'],
];
const FINISHES = Object.keys(SEATS);

// the emblem's plain truth: a ribbon card with tags (the real ribbon CSS
// needs the SVG shape; the glyph + rim alone render from the CSS)
const tagCard = (color, ink) => `
<div class="tg" style="--gd-glyph-rim:${ink}; --gd-glyph-size:14px; background:${color}">
  <span class="gd-ribbon-glyph" style="position:relative; inset:auto; display:flex; color:${ink}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/></svg>
  </span>
</div>`;

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; font-family: sans-serif; }
  .row { display: flex; gap: 10px; padding: 10px; }
  .pc { position: relative; width: 150px; height: 210px; overflow: hidden; border-radius: 10px; }
  .lbl { position: absolute; bottom: 4px; left: 6px; z-index: 9; font-size: 10px; color: #fff; opacity: .8; text-shadow: 0 0 3px #000; }
  .tg { position: relative; width: 120px; height: 40px; margin: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .tg .gd-ribbon-glyph { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: auto; display: flex; align-items: flex-start; justify-content: center; }
</style></head><body>
${FINISHES.map(
  (f) => `<div class="row">${PLATES.map(
    ([tint, name]) => `${card(f, tint)}<span class="lbl" style="position:fixed;visibility:hidden"></span>`
  ).join('')}</div>`
).join('\n')}
<div class="row" style="background:#444">
  <div style="color:#ddd; font-size:11px; align-self:center; padding-right:8px">emblem plain truth:</div>
  ${tagCard('#e0567a', '#fff0f3')}${tagCard('#3f7fd6', '#ffffff')}${tagCard('#d8a03c', '#231a06')}${tagCard('#8a4fd0', '#ffffff')}
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 980, height: 1450 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1300);
mkdirSync('/tmp/render', { recursive: true });
await page.screenshot({ path: '/tmp/render/cornered_ink_197.png', fullPage: true });
await browser.close();
console.log('saved /tmp/render/cornered_ink_197.png');
