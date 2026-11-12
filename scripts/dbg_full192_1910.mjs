// dbg_full192_1910.mjs — ground truth: computed paint of every finish seat
// under THREE sheets: cur(196 full) vs full192(192 tree full sheet) vs
// fixture(coat-region extract). If full192-vs-fixture shows the same
// borderColor/transform diffs, the audit's 78 failures are fixture-
// extraction artifacts, not regressions; the true verdict is cur-vs-full192.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const SHEETS = {
  cur: path.join(root, '..', 'src', 'index.css'),
  full192: '/home/z/my-project/burrito_gendex_192/src/index.css',
  fixture: path.join(root, 'fixtures', 'index_classic_192_coat.css'),
};

const twin = (hex6, seat = 0.45) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = ((n & 255) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0, s = 0; const l = (mx + mn) / 2;
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
      let tt = t; if (tt < 0) tt += 1; if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    return [hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)];
  };
  const lumaAt = (ll) => { const [rr, gg, bb] = hslToRgb(h, s, ll); return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb; };
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i += 1) { const mid = (lo + hi) / 2; if (lumaAt(mid) < target) lo = mid; else hi = mid; }
  const rgb = hslToRgb(h, s, (lo + hi) / 2);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${rgb.map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

const groundOf = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = ((n & 255) & 255) / 255;
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
const FINISHES = Object.keys(SEATS);
const PLATES = [
  ['white', '#ffffff'], ['black', '#000000'], ['tangerine', '#ff8c42'],
  ['deepred', '#800000'], ['g80', '#808080'], ['lighth0', hsl60(1, 0.75)],
];
function hsl60(s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
  const hue = (t) => { let tt = t; if (tt < 0) tt += 1; if (tt > 1) tt -= 1; if (tt < 1 / 6) return p + (q - p) * 6 * tt; if (tt < 1 / 2) return q; if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6; return p; };
  const ch = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${ch(hue(0 / 360 + 1 / 3))}${ch(hue(0))}${ch(hue(-1 / 3))}`;
}

const card = (finish, tint) => {
  const seats = SEATS[finish].map((c) => {
    let inner = '';
    if (c === 'gd-finish-foil-ripples') inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span>';
    if (c === 'gd-finish-holographic') inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
    return `<span class="gd-card-face-finish ${c}">${inner}</span>`;
  }).join('');
  return `<div class="pc ${groundOf(tint)}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin(tint)}; --gd-fin-glow:${twin(tint, 0.78)}; --gd-fin-art:${twin(tint, 0.75)}; background:${tint}">${seats}</div>`;
};

const PAINT_PROPS = [
  'backgroundImage', 'backgroundColor', 'backgroundPosition', 'backgroundSize',
  'backgroundRepeat', 'backgroundBlendMode', 'backgroundAttachment',
  'mixBlendMode', 'opacity', 'filter', 'isolation',
  'maskImage', 'webkitMaskImage', 'maskSize', 'maskPosition', 'maskRepeat',
  'transform', 'borderRadius', 'borderColor', 'boxShadow', 'color',
];
const PROBE = `(() => {
  const PROPS = ${JSON.stringify(PAINT_PROPS)};
  const rows = [];
  for (const el of document.querySelectorAll('.gd-card-face-finish, .gd-card-face-finish *')) {
    const cs = getComputedStyle(el);
    const row = { cls: el.className };
    for (const p of PROPS) {
      let v; try { v = cs[p]; } catch (e) { v = undefined; }
      if (v === undefined) {
        if (p === 'webkitMaskImage') v = cs.getPropertyValue('-webkit-mask-image');
        else v = cs.getPropertyValue(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
      }
      row[p] = String(v);
    }
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      const prow = { cls: el.className + pseudo };
      for (const p of PROPS) {
        let v; try { v = ps[p]; } catch (e) { v = undefined; }
        if (v === undefined) {
          if (p === 'webkitMaskImage') v = ps.getPropertyValue('-webkit-mask-image');
          else v = ps.getPropertyValue(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
        }
        prow[p] = String(v);
      }
      rows.push(prow);
    }
    rows.push(row);
  }
  return rows;
})()`;

const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-gpu-compositing'] });
const field = FINISHES.map((f) => PLATES.map(([name, tint]) => card(f, tint)).join('')).join('\n');
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(${PLATES.length}, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
</style></head><body><div id="field">${field}</div></body></html>`;

const rowsBy = {};
for (const [tag, cssPath] of Object.entries(SHEETS)) {
  const page = await browser.newPage({ viewport: { width: 190 * PLATES.length, height: 1200 } });
  await page.setContent(html);
  await page.addStyleTag({ path: cssPath });
  await page.waitForTimeout(200);
  rowsBy[tag] = await page.evaluate(PROBE);
  await page.close();
  console.error(`loaded ${tag}: ${rowsBy[tag].length} rows`);
}
await browser.close();

const seatOf = (cls) => {
  const toks = cls.replace(/::(before|after)$/, '').split(/\s+/);
  for (const t of toks) {
    for (const f of FINISHES) if (SEATS[f].includes(t)) return { finish: f, seat: t };
    if (t === 'gd-foil-ripple') return { finish: 'foil', seat: 'gd-foil-ripple' };
    if (t === 'gd-holo-shards' || t === 'gd-holo-dots') return { finish: 'holographic', seat: t };
  }
  return null;
};

for (const pair of [['cur', 'full192'], ['full192', 'fixture'], ['cur', 'fixture']]) {
  const [a, b] = pair;
  const diffs = [];
  const seen = new Set();
  for (let i = 0; i < rowsBy[a].length; i += 1) {
    const ra = rowsBy[a][i]; const rb = rowsBy[b][i];
    if (!rb || ra.cls !== rb.cls) continue;
    const seat = seatOf(ra.cls);
    if (!seat) continue;
    if (seat.finish === 'numeix' && seat.seat === 'gd-numeix-xmarks') continue; // carve-out
    const key = `${seat.finish}|${ra.cls}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const bad = [];
    for (const p of PAINT_PROPS) if (ra[p] !== rb[p]) bad.push(p);
    if (bad.length) diffs.push({ key, bad, a: ra, b: rb });
  }
  console.log(`\n=== ${a} vs ${b}: ${diffs.length} seat-classes differ (of ${seen.size}) ===`);
  for (const d of diffs.slice(0, 12)) {
    console.log(`  ${d.key}  <- ${d.bad.join(', ')}`);
    for (const p of d.bad.slice(0, 3)) console.log(`     ${p}: ${a}="${String(d.a[p]).slice(0, 90)}" ${b}="${String(d.b[p]).slice(0, 90)}"`);
  }
  if (diffs.length > 12) console.log(`  ... +${diffs.length - 12} more`);
}
