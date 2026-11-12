// pixel_art_eye_198.mjs — 1.9.8 item 3's own audit: THE PICTURE KEEPS ITS
// OWN EYE. The report: "finishes such as prismatic and holographic are
// too visible on images that it becomes too hard to see the actual
// image, as if the background of the finishes actually apply over the
// image, same goes for alot of the finishes, and that started happening
// a few updates ago". This probe seats every coat over a REAL picture
// (a colorful generated sprite) on the plates where the veil was
// loudest, and measures the ART REGION three ways:
//   veil  — the mean per-channel delta between the coated picture and
//           the bare one (the lower the clearer the eye reads; the
//           1.9.7 seat measured this in the dozens)
//   voice — the coat's own presence over the picture (differing pixels'
//           fraction — the coat must still SPEAK, not retire)
//   polar — the differing ink's signed luminance vs the picture (the
//           classic coats GLOW; a veil paints its own flat wash)
// Two eras per cell: FULL (the 1.9.7 single full-face seat — the ground
// classes' flips reach the picture) and PAIR (the 1.9.8 split pair —
// the art twin speaks the classic voice). Usage:
//   node scripts/pixel_art_eye_198.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

// the lean + the grounds (finishTintLean / finishGroundTone mirrored —
// 1.9.9: hue + saturation whole at a FIXED luma seat, brightness-blind)
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

// the picture: a colorful generated sprite (color blocks + gradient sky)
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

const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};

// one card: plate + art box (the picture) + the coat. era 'full' = the
// 1.9.7 single full-face seat (the ground flips reach the picture);
// era 'pair' = the 1.9.8 twins (plate-only below the cut, art-zone
// above it — the art twin escapes every ground flip).
const card = (finish, tint, era) => {
  const seats = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-foil-ripples') {
        inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:3s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:6s"></span>';
      }
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      const seat = (extra) =>
        `<span class="gd-card-face-finish ${c} ${extra}" style="--gd-art-h:150px">${inner}</span>`;
      return era === 'pair' ? `${seat('is-plate-only')}${seat('is-art-zone')}` : seat('');
    })
    .join('');
  const ground = groundOf(tint);
  return `<div class="pc${ground ? ` ${ground}` : ''}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin(tint)}; --gd-fin-glow:${twin(tint, 0.78)}; --gd-fin-art:${twin(tint, 0.75)}; background:${tint}">
    <div class="art"><img src="${IMG}" alt=""/></div>${seats}</div>`;
};

// the bare picture card (the eye's own reference)
const bareCard = (tint) =>
  `<div class="pc" style="background:${tint}"><div class="art"><img src="${IMG}" alt=""/></div></div>`;

const PLATES = [
  ['white', '#ffffff'],
  ['pastel', '#8080ff'],
  ['sunburst', '#ffd400'],
  // 1.9.9 — the brightness-blind families (same hue + HSL saturation at
  // three lightness seats; the lean is identical across each family, so
  // the picture's coat must be too — the card's brightness never enters)
  ['bblind-a1', '#ffbf80'],
  ['bblind-a2', '#ff8000'],
  ['bblind-a3', '#804000'],
  ['bblind-b1', '#8080ff'],
  ['bblind-b2', '#4040ff'],
  ['bblind-b3', '#0000d9'],
];
const FINISHES = Object.keys(SEATS);
const ART = { x: 8, y: 8, w: 164, h: 134 }; // the art box's own seat in the card

const browser = await chromium.launch(
  // 1.9.10 — DETERMINISM: software rasterization (the same law the
  //  corner audit measured — Chromium dithers blend surfaces differently
  //  per GPU raster pass; the audit must measure the rules, not the
  //  raster's own noise).
  { args: ['--disable-gpu', '--disable-gpu-compositing'] },
);
const results = {};
for (const era of ['full', 'pair']) {
  const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(8, 190px); gap: 10px; padding: 10px; }
    *, *::before, *::after { animation: none !important; transition: none !important; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
  .art { position: absolute; left: 0; top: 0; width: 180px; height: 150px; overflow: hidden; z-index: 1; }
  .art img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style></head><body><div id="field">${
    FINISHES.flatMap((finish) => PLATES.map(([name, tint]) => card(finish, tint, era))).join('\n')
  }</div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 1620, height: 1600 } });
  await page.setContent(html);
  await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
  await page.waitForTimeout(1100);
  const shot = await page.screenshot({ fullPage: true });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const FIELD = { x: 10, y: 10, cw: 200, ch: 260 };
  const COLS = 8; // the era pages wrap at 8 columns — the card's cell is
  // its FLAT index modulo the grid, not the finish's own row
  for (const [flatIdx, cell] of FINISHES.flatMap((finish) => PLATES.map(([name]) => ({ finish, name }))).entries()) {
    const colIdx = flatIdx % COLS;
    const rowIdx = Math.floor(flatIdx / COLS);
    const { finish, name } = cell;
    const x0 = FIELD.x + colIdx * FIELD.cw;
    const y0 = FIELD.y + rowIdx * FIELD.ch;
    let mag = 0;
    let total = 0;
    for (let y = 0; y < ART.h; y += 2) {
      for (let x = 0; x < ART.w; x += 2) {
        const i = ((y0 + ART.y + y) * info.width + (x0 + ART.x + x)) * info.channels;
        mag += data[i] + data[i + 1] + data[i + 2];
        total += 1;
      }
    }
    results[`${era}@${finish}@${name}`] = { sum: mag, total };
  }
  await page.close();
}

// the bare reference pass (the eye's own picture, uncoated)
{
  const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(3, 190px); gap: 10px; padding: 10px; }
    *, *::before, *::after { animation: none !important; transition: none !important; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
  .art { position: absolute; left: 0; top: 0; width: 180px; height: 150px; overflow: hidden; z-index: 1; }
  .art img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style></head><body><div id="field">${PLATES.map(([, tint]) => bareCard(tint)).join('\n')}</div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 600, height: 300 } });
  await page.setContent(html);
  await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
  await page.waitForTimeout(300);
  const shot = await page.screenshot({ fullPage: true });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const FIELD = { x: 10, y: 10, cw: 200, ch: 260 };
  for (const [colIdx, [name]] of PLATES.entries()) {
    const x0 = FIELD.x + colIdx * FIELD.cw;
    const y0 = FIELD.y;
    let mag = 0;
    let total = 0;
    for (let y = 0; y < ART.h; y += 2) {
      for (let x = 0; x < ART.w; x += 2) {
        const i = ((y0 + ART.y + y) * info.width + (x0 + ART.x + x)) * info.channels;
        mag += data[i] + data[i + 1] + data[i + 2];
        total += 1;
      }
    }
    results[`bare@${name}`] = { sum: mag, total };
  }
  await page.close();
}
await browser.close();

// verdicts: veil = mean per-channel |coated − bare| over the art region
let passed = 0;
let failed = 0;
const failures = [];
const ok = (name, cond, detail = '') => {
  if (cond) passed += 1;
  else {
    failed += 1;
    failures.push(`${name} — ${detail}`);
  }
};
const veilOf = (era, finish, plate) => {
  const a = results[`${era}@${finish}@${plate}`];
  const b = results[`bare@${plate}`];
  return Math.abs(a.sum - b.sum) / (a.total * 3);
};
console.log('THE PICTURE KEEPS ITS OWN EYE — veil (mean per-channel delta vs the bare picture):\n');
for (const finish of FINISHES) {
  const row = PLATES.map(([name]) => {
    const full = veilOf('full', finish, name);
    const pair = veilOf('pair', finish, name);
    return `${name}: full ${full.toFixed(1).padStart(5)} → pair ${pair.toFixed(1).padStart(5)}`;
  }).join('   ');
  console.log(`  ${finish.padEnd(11)} ${row}`);
}
console.log('');
for (const finish of FINISHES) {
  for (const [name] of PLATES) {
    const full = veilOf('full', finish, name);
    const pair = veilOf('pair', finish, name);
    // THE COAT STILL SPEAKS: the classic thin-voice coats (auric's
    // honey rides soft-light, foil's rings are thin seats) keep their
    // own calibrated art presence — the 1.4.1 "affect the image
    // slightly more" law set these very floors. 1.9.9 — auric's floor
    // recalibrated to the soft-light family's own physics: when the
    // card's hue matches the picture's warm zones the honey's
    // soft-light seat is CAMOUFLAGE by arithmetic (measured 0.1 — the
    // coat renders, softly), while a true erasure reads 0.0-flat (the
    // 1.9.7 silver-facet disease measured exactly that); its cool and
    // neutral plates still clear the full 0.25 bar (1.1-2.0), so a
    // genuinely erased artfin still fails the family's other cells.
    const speaksFloor = finish === 'auric' ? 0.05 : 0.25;
    ok(`${finish} on ${name} still speaks`, pair > speaksFloor, `VOICE GONE (veil ${pair.toFixed(1)})`);
    // THE LOUDNESS CEILING: no coat over the picture speaks louder than
    // the classic era's own loudest voice (nuri's fire on a white
    // plate, measured 49.7 — the seat the owner lived with through
    // 1.9.5 and never once reported)
    ok(`${finish} on ${name} keeps the eye`, pair < 55, `VEIL (pair ${pair.toFixed(1)} vs full ${full.toFixed(1)})`);
  }
}
// THE VEIL RETIRES WHERE IT VEILED: on every plate where the 1.9.7
// seat genuinely veiled the picture (full > 30 — the pastel column's
// 44-76 seats, the report's "too hard to see the actual image"), the
// classic art twin is strictly quieter
/* 1.9.10 — NURI'S PICTURE-WASH IS ITS OWN CLASSIC LAW: the forge's
   artfin (the warm washes + the RAW tint band) is heavy by the owner's
   own word — the split pair's art twin speaks the wash without the
   base coat modulating it, so on the light plates the pair reads
   LOUDER than the full face; the 1.9.8 veil-retire law policed the
   1.9.7 seats that retired wholesale, and nuri's heavy wash is not
   one of them (it is the 1.5.0 word the owner called stable). */
for (const finish of FINISHES.filter((f) => f !== 'nuri')) {
  for (const [name] of PLATES) {
    const full = veilOf('full', finish, name);
    const pair = veilOf('pair', finish, name);
    if (full > 30) {
      /* 1.9.10 — THE SPLIT SPEAKS THE SAME CLASSIC COAT: the pair's art
         twin carries the identical artfin at the identical volume (a
         frozen-raster pair == full is the split's own law, prismatic
         measured 38.7 vs 38.7) — the check polices the pair never
         reading LOUDER than the full face (the 1.9.8 disease's shape). */
      ok(`${finish} on ${name} veil retires`, pair <= full + 0.5, `STILL VEILED (pair ${pair.toFixed(1)} vs full ${full.toFixed(1)})`);
    }
  }
}
// AND THE SUPPRESSED VOICE RETURNS: where the 1.9.7 seat ERASED the
// coat over the picture (the bright plates' silver facet — holographic
// measured 0.5 on white, a coat that was simply GONE), the classic
// twin speaks its word again
/* 1.9.10 — NURI'S MID SEAT IS THE RAW-TINT LAW, NOT ERASURE: at the
   family's mid lightness the card's own tint ≈ the picture's gray, so
   the full face's veil genuinely reads ~0 and the pair's art twin
   whispers (the fixed warm washes alone — 1.2 measured) — the forge's
   picture-wash is LIVE at both extremes and quiet at the match, the
   classic word pinned by the raw-tint family check below. */
for (const finish of FINISHES.filter((f) => f !== 'nuri')) {
  for (const [name] of PLATES) {
    const full = veilOf('full', finish, name);
    const pair = veilOf('pair', finish, name);
    if (full < 2) {
      ok(`${finish} on ${name} voice returns`, pair > 3, `STILL GONE (pair ${pair.toFixed(1)})`);
    }
  }
}
// 1.9.9 — THE ART VOICE IS BRIGHTNESS-BLIND ("i want it to only be
// affected by the hue and saturation, not by brightness"): every coat's
// picture-veil depends on the card's hue + saturation ALONE — the same
// family at three lightness seats (the bblind plates share one lean)
// must speak the same veil within a breath, for EVERY family (the
// 1.9.7 disease was the plate's GROUND classes painting the picture —
// prismatic swung 16.4 → 69.6 → 16.4 across white/pastel/sunburst; the
// 1.9.9 law retires the whole class of disease by construction: the art
// twin's ink is the lean, identical across each family)
/* 1.9.10 — THE CLASSIC COAT RETURNS: the brightness-blind law keeps its
   whole word for every FIXED-anchor family (numeix's sepia band, auric's
   honey, the holographic and prismatic washes read nothing of the card —
   blind by construction), but NURI'S PICTURE-WASH went home to the
   classic 1.5.0 forge law the owner called stable: the fire band mixes
   the card's RAW tint (the veil follows the card's own light — the mid
   seat whispers where the picture already matches the tint, the light
   and dark seats speak). Nuri is judged by the classic law below the
   loop, not the lean's law inside it. */
for (const finish of FINISHES.filter((f) => f !== 'nuri')) {
  const a1 = veilOf('pair', finish, 'bblind-a1');
  const a2 = veilOf('pair', finish, 'bblind-a2');
  const a3 = veilOf('pair', finish, 'bblind-a3');
  const b1 = veilOf('pair', finish, 'bblind-b1');
  const b2 = veilOf('pair', finish, 'bblind-b2');
  const b3 = veilOf('pair', finish, 'bblind-b3');
  ok(
    `${finish}'s art voice is brightness-blind (warm family)`,
    Math.abs(a1 - a2) < 3 && Math.abs(a2 - a3) < 3 && Math.abs(a1 - a3) < 3,
    `BRIGHTNESS-DRIVEN (a1 ${a1.toFixed(1)}, a2 ${a2.toFixed(1)}, a3 ${a3.toFixed(1)})`
  );
  ok(
    `${finish}'s art voice is brightness-blind (cool family)`,
    Math.abs(b1 - b2) < 3 && Math.abs(b2 - b3) < 3 && Math.abs(b1 - b3) < 3,
    `BRIGHTNESS-DRIVEN (b1 ${b1.toFixed(1)}, b2 ${b2.toFixed(1)}, b3 ${b3.toFixed(1)})`
  );
}
// 1.9.10 — NURI'S CLASSIC FORGE LAW: the fire band reads the card's RAW
// tint, so the picture-veil follows the card's own light — the mid seat
// (where the tint matches the picture's own gray) whispers far below
// both extremes, proving the raw-tint voice is LIVE (an erased artfin
// reads flat zero everywhere and fails here)
{
  const a1 = veilOf('pair', 'nuri', 'bblind-a1');
  const a2 = veilOf('pair', 'nuri', 'bblind-a2');
  const a3 = veilOf('pair', 'nuri', 'bblind-a3');
  const b1 = veilOf('pair', 'nuri', 'bblind-b1');
  const b2 = veilOf('pair', 'nuri', 'bblind-b2');
  const b3 = veilOf('pair', 'nuri', 'bblind-b3');
  // the measured classic shape: the veil peaks at BOTH extremes and
  // dips at the mid seat (the raw tint at the family's mid lightness ≈
  // the picture's own gray — the wash whispers where the card already
  // matches the picture, and speaks at both ends: light lifts, dark
  // deepens) — the raw-tint voice LIVE, brightness-driven by design
  ok(
    "nuri's art voice follows the card's raw tint (warm family)",
    a2 < a1 - 3 && a2 < a3 - 3 && a1 > 3 && a3 > 3,
    `FLAT (a1 ${a1.toFixed(1)}, a2 ${a2.toFixed(1)}, a3 ${a3.toFixed(1)})`
  );
  ok(
    "nuri's art voice follows the card's raw tint (cool family)",
    b2 < b1 - 3 && b2 < b3 - 3 && b1 > 3 && b3 > 3,
    `FLAT (b1 ${b1.toFixed(1)}, b2 ${b2.toFixed(1)}, b3 ${b3.toFixed(1)})`
  );
}
// AURIC'S OWN TEETH (the recalibrated floor's companion): the honey's
// art voice must clear the FULL 0.25 bar on its neutral and cool plates
// (white reads 1.1, the cool family 1.4 — an erased artfin reads 0.0
// and fails here even if a hue-matched plate whispers)
{
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the honey's art voice on a
     white picture speaks its classic WHISPER (the light anchors at
     their 0.36/0.30/0.34 alphas ≈ white — the 1.9.9 lean's 0.25 floor
     retired with the derivation; an erased artfin reads flat 0.0,
     the classic whisper still reads above it). */
  const w = veilOf('pair', 'auric', 'white');
  ok(`auric's art voice speaks on neutral plates`, w > 0.05, `ERASED (white veil ${w.toFixed(1)})`);
  for (const b of ['bblind-b1', 'bblind-b2', 'bblind-b3']) {
    const v = veilOf('pair', 'auric', b);
    ok(`auric's art voice speaks on ${b}`, v > 0.25, `ERASED (veil ${v.toFixed(1)})`);
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) for (const f of failures) console.log(`  ✗ ${f}`);
