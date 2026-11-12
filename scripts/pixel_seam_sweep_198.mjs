// pixel_seam_sweep_198.mjs — the 1.9.8 diagnosis probe: THE SEAM SWEEP.
// The report: "the finishes have the same issue but now its in middle
// way, aka the center top of the color picker it would get inverted, it
// relates to the background of the finish dissapearing then i assume".
// The 1.9.7 corner law flipped the whole coat's polarity at the twin's
// own seam (luminance 0.5) — and for the hues the owner lives on (the
// blues and the purples) the wheel's own geometry seats that seam EXACTLY
// at the center-top pastel band (HSV S=0.5, V=1): #8080ff measures luma
// 0.536. This probe walks the owner's own drag — pure hue → white, in
// ten steps, on blue AND purple, plus the center-top row of every hue —
// and speaks per finish per plate:
//   ratio  — the coat's presence (differing pixels / total)
//   mag    — the mean per-channel delta (the coat's loudness)
//   inkLum — the differing ink's own luminance vs the plate's
//   POLAR  — + means the ink GLOWS above the plate, − means it sinks
//            below (the inversion the report names)
// Usage: node scripts/pixel_seam_sweep_198.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

// the lean (finishTintLean's own math, mirrored — 1.9.9: hue +
// saturation whole at a FIXED luma seat; the twin's plate-solved rail
// retired with the brightness-dependence the report named)
const twin = (hex6, seat = 0.45) => {
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

// the owner's own drag: pure hue -> white in ten steps (HSV S = 1-t, V=1),
// for the two hues the report names (blue 240, purple 275) — plus the
// center-top row (S=0.5, V=1) of every major hue, the exact seat the
// report calls out.
const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const WHITE = [255, 255, 255];
const sweepPlates = (base) => {
  const out = [];
  for (let i = 0; i <= 10; i += 1) out.push([`t${String(i).padStart(2, '0')}`, hex(mix(base, WHITE, i / 10))]);
  return out;
};
const PLATES = [
  ...sweepPlates([0, 0, 255]).map(([n, h]) => [`blue-${n}`, h]),
  ...sweepPlates([0x99, 0x33, 0xff]).map(([n, h]) => [`purple-${n}`, h]),
  ['ct-red', '#ff8080'], ['ct-yellow', '#ffff80'], ['ct-green', '#80ff80'],
  ['ct-cyan', '#80ffff'], ['ct-blue', '#8080ff'], ['ct-purple', '#9a80ff'],
  ['ct-magenta', '#ff80ff'], ['ct-orange', '#ff9980'],
];

const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};

const card = (finish, tint, toneClass) => {
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
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin(tint)}; --gd-fin-glow:${twin(tint, 0.78)}; --gd-fin-art:${twin(tint, 0.75)}; background:${tint}">${seats}</div>`;
};

const COLS_PER_PAGE = 8;
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lumOf = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const FINISHES = Object.keys(SEATS);

const browser = await chromium.launch(
  // 1.9.10 — DETERMINISM: software rasterization (the same law the
  //  corner audit measured — Chromium dithers blend surfaces differently
  //  per GPU raster pass; the audit must measure the rules, not the
  //  raster's own noise).
  { args: ['--disable-gpu', '--disable-gpu-compositing'] },
);
const stats = {};
for (let base = 0; base < PLATES.length; base += COLS_PER_PAGE) {
  const chunk = PLATES.slice(base, base + COLS_PER_PAGE);
  const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(${chunk.length}, 190px); gap: 10px; padding: 10px; }
    *, *::before, *::after { animation: none !important; transition: none !important; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${FINISHES.flatMap((finish) => chunk.map(([name, tint]) => card(finish, tint, groundOf(tint)))).join('\n')}</div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 190 * chunk.length, height: 1600 } });
  await page.setContent(html);
  await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
  await page.waitForTimeout(1100);
  const shot = await page.screenshot({ fullPage: true });
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const FIELD = { x: 10, y: 10, cw: 200, ch: 260 };
  for (const [rowIdx, finish] of FINISHES.entries()) {
    for (const [colIdx, [name, tint]] of chunk.entries()) {
      const x0 = FIELD.x + colIdx * FIELD.cw + 8;
      const y0 = FIELD.y + rowIdx * FIELD.ch + 8;
      const [pr, pg, pb] = hexToRgb(tint);
      let diff = 0, total = 0, sr = 0, sg = 0, sb = 0, mag = 0;
      for (let y = y0; y < y0 + 234; y += 2) {
        for (let x = x0; x < x0 + 164; x += 2) {
          const i = (y * info.width + x) * info.channels;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          total += 1;
          mag += (Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb)) / 3;
          if (Math.abs(r - pr) > 12 || Math.abs(g - pg) > 12 || Math.abs(b - pb) > 12) {
            diff += 1; sr += r; sg += g; sb += b;
          }
        }
      }
      stats[`${finish}@${name}`] = {
        ratio: diff / total,
        mean: diff ? [sr / diff, sg / diff, sb / diff] : null,
        mag: mag / total,
        plateLum: lumOf(...hexToRgb(tint)),
        lean: twin(tint),
        ground: groundOf(tint),
      };
    }
  }
  await page.close();
}
await browser.close();

for (const finish of FINISHES) {
  console.log(`\n=== ${finish} ===`);
  for (const [name, tint] of PLATES) {
    const s = stats[`${finish}@${name}`];
    const inkLum = s.mean ? lumOf(s.mean[0], s.mean[1], s.mean[2]) : null;
    const polar = inkLum == null ? 0 : inkLum - s.plateLum;
    console.log(
      `  ${name.padEnd(12)} plate=${tint} lum=${s.plateLum.toFixed(2)} ground=${s.ground.replace('gd-fin-ground-', '').padEnd(13)} lean=${s.lean} ratio=${(s.ratio * 100).toFixed(1).padStart(5)}% mag=${s.mag.toFixed(1).padStart(6)} inkLum=${inkLum == null ? '   —' : inkLum.toFixed(2)} polar=${polar >= 0 ? '+' : ''}${polar.toFixed(2)}`
    );
  }
}
