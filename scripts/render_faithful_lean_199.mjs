// render_faithful_lean_199.mjs — the eye's own field for THE FAITHFUL
// LEAN: the report's own patients, rendered for the record
// (/tmp/render/faithful_lean_199.png):
//   · the LIGHT-CARD ladder (item 3): light orange at three lightness
//     seats + its pastel — every card must speak the SAME orange coat
//     (the brightness-blind law, seen not measured);
//   · the named patients (item 2): #bbbbbb and #e7c35b — the plates
//     where foil's background vanished;
//   · the brightness-blind blue family: three lightness seats, one blue
//     coat;
//   · the channel-pegged band (#ff80ff, #ff8c42) + the white/black
//     rails;
//   · and the picture's own eye: the art pair over a real sprite on a
//     light orange card (the art seat's light register).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

// the lean (finishTintLean's own math, mirrored — the fixed seats)
const lean = (hex6, seat = 0.45) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
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
  const target = Number.isFinite(+seat) ? +seat : 0.45;
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
  if (lum >= 0.7) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
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
const seatsHtml = (finish) =>
  SEATS[finish]
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

// the picture's own eye: the split pair over a real sprite
const sharp = (await import('sharp')).default;
const W = 176;
const H = 148;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2e3a59"/><stop offset="0.5" stop-color="#7a4a6d"/><stop offset="1" stop-color="#d9a05b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="38" cy="42" r="22" fill="#f2e9c9"/>
  <rect x="96" y="18" width="58" height="34" rx="6" fill="#3f7ac2"/>
  <rect x="12" y="86" width="48" height="44" rx="8" fill="#c25a4a"/>
  <path d="M70 130 L104 78 L138 130 Z" fill="#4a9a5e"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#10131a" stroke-width="4"/>
</svg>`;
const imgBuf = await sharp(Buffer.from(svg)).png().toBuffer();
const IMG = `data:image/png;base64,${imgBuf.toString('base64')}`;

const plateCard = (finish, tint) =>
  `<div class="cell"><div class="pc ${groundOf(tint)}" style="--gd-card-tint:${tint}; --gd-fin-ink:${lean(tint)}; --gd-fin-glow:${lean(tint, 0.78)}; --gd-fin-art:${lean(tint, 0.75)}; --gd-fin-ph:0.31; background:${tint}">${seatsHtml(finish)}</div><div class="cap">${tint}</div></div>`;
const artCard = (finish, tint) => {
  const pair = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-foil-ripples') inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span>';
      if (c === 'gd-finish-holographic') inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      const seat = (extra) => `<span class="gd-card-face-finish ${c} ${extra}" style="--gd-art-h:150px">${inner}</span>`;
      return `${seat('is-plate-only')}${seat('is-art-zone')}`;
    })
    .join('');
  const artfin = ['numeix', 'nuri', 'auric'].includes(finish)
    ? `<span class="gd-card-face-artfin gd-artfin-${finish} is-art-zone" style="--gd-fin-ph:0.31; --gd-art-h:150px"></span>`
    : '';
  return `<div class="cell"><div class="pc ${groundOf(tint)}" style="--gd-card-tint:${tint}; --gd-fin-ink:${lean(tint)}; --gd-fin-glow:${lean(tint, 0.78)}; --gd-fin-art:${lean(tint, 0.75)}; --gd-fin-ph:0.31; background:${tint}">
    <div class="art"><img src="${IMG}" alt=""/></div>${pair}${artfin}</div><div class="cap">art ${tint}</div></div>`;
};

const ROWS = [
  ['THE LIGHT-CARD LADDER (item 3 — one orange coat at every brightness)', ['#ffcf9e', '#ffd9a8', '#ffbf80', '#ff8000', '#804000']],
  ['THE NAMED PATIENTS (item 2 — #bbbbbb / #e7c35b)', ['#bbbbbb', '#e7c35b', '#cccccc', '#999999', '#808080']],
  ['THE BRIGHTNESS-BLIND BLUE FAMILY', ['#8080ff', '#4040ff', '#0000d9', '#b3b3ff', '#e6e6ff']],
  ['THE CHANNEL-PPEGED BAND + THE RAILS', ['#ff80ff', '#ff8c42', '#ffd400', '#ffffff', '#000000']],
];
const FINISHES = Object.keys(SEATS);

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; font-family: sans-serif; }
  h2 { color: #e8e8f0; font-size: 12px; margin: 14px 10px 4px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .row { display: flex; gap: 10px; padding: 4px 10px; align-items: flex-start; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    *, *::before, *::after { animation: none !important; transition: none !important; }
  .pc { position: relative; width: 150px; height: 210px; overflow: hidden; border-radius: 10px; }
  .art { position: absolute; left: 0; top: 0; width: 150px; height: 150px; overflow: hidden; z-index: 1; }
  .art img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cap { font-size: 10px; color: #cfcfe0; font-family: monospace; }
  .frow { display: flex; gap: 10px; padding: 4px 10px; align-items: flex-start; }
</style></head><body>
${ROWS.map(([title, plates]) => `<h2>${title}</h2>${FINISHES.map(
    (f) => `<div class="row"><div class="cap" style="width:70px;padding-top:90px;text-align:right">${f}</div>${plates.map((t) => plateCard(f, t)).join('')}</div>`
  ).join('')}`).join('')}
<h2>THE PICTURE KEEPS ITS OWN EYE (the art seat over a real sprite)</h2>
${FINISHES.map((f) => `<div class="row"><div class="cap" style="width:70px;padding-top:90px;text-align:right">${f}</div>${['#ffcf9e', '#8080ff'].map((t) => artCard(f, t)).join('')}</div>`).join('')}
</body></html>`;

const browser = await chromium.launch(
  // 1.9.10 — DETERMINISM: software rasterization (the same law the
  //  corner audit measured — Chromium dithers blend surfaces differently
  //  per GPU raster pass; the audit must measure the rules, not the
  //  raster's own noise).
  { args: ['--disable-gpu', '--disable-gpu-compositing'] },
);
const page = await browser.newPage({ viewport: { width: 1080, height: 900 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1300);
mkdirSync('/tmp/render', { recursive: true });
await page.screenshot({ path: '/tmp/render/faithful_lean_199.png', fullPage: true });
await browser.close();
console.log('rendered /tmp/render/faithful_lean_199.png');
