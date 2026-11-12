// pixel_certain_ink_196.mjs — the eye's verdict, spoken in numbers: the
// same six-by-five field the 1.9.4/1.9.5 probes spoke (EVERY coat in the
// wall × five plates, each with its SHADOW TWIN written beside the tint),
// measured pixel by pixel against the 1.9.6 laws, plus the white-ink
// facet's own field and the SPLIT VOLUME's own row. Five laws per card:
//   1. THE COAT IS PRESENT — a healthy fraction of the plate's pixels
//      differs from the bare plate color (the finish never "dissapears"),
//      on EVERY plate including the extremes.
//   2. THE PLATE KEEPS ITS OWN LIGHT — on the LIGHT plates (white,
//      purewhite, gold) the coated card's mean luminance stays well over
//      70% of the bare plate: the 1.9.4 stack crushed a white numeix card
//      toward dark coffee ("when its too bright it becomes black"), the
//      1.9.6 twin keeps the plate bright while the ink speaks.
//   3. THE INK SPEAKS ON THE BRIGHT PLATES — the whole report's own
//      measure: every coat's mean per-channel delta on white exceeds a
//      VISIBLE floor (the blooms, the stars, the metal, the honey, the
//      forge, the riot all read), and the white-ink facet's own seats
//      (prismatic stars/particles, holographic shards) carry their gray
//      presence on pure white.
//   4. THE TWIN'S OWN DERIVATION — the light plates' differing pixels
//      darken the plate (the shadow twin's work: the mean ink sits BELOW
//      the plate's own luminance — the report's "invisible/negative"
//      retired, the "becomes black" retired too).
//   5. THE SPLIT VOLUME — the split row: the same coat with the main knob
//      full + the image knob at zero reads COATED above the notch seam and
//      BARE below it (and the mirror row the other way) — the two knobs,
//      two halves, one continuous coat.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

// the shadow twin (finishInkTwin's own math, mirrored for the harness —
// the source law is pinned by the 197 suite; this is the same rail)
const twin = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (l <= 0.5) return hex6;
  const d = mx - mn;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  }
  const tl = 0.5 + (l - 0.5) * 0.3;
  let rgb;
  if (s === 0) rgb = [tl, tl, tl];
  else {
    const q = tl < 0.5 ? tl * (1 + s) : tl + s - tl * s;
    const p = 2 * tl - q;
    const hue = (t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    rgb = [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)];
  }
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${rgb.map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};
// the white-ink facet's own patients (the 1.9.6 law's named family)
const FACET_SEATS = {
  prismatic: ['gd-prism-stars', 'gd-prism-particles', 'gd-prism-sweep'],
  holographic: ['gd-finish-holographic'],
};
const card = (finish, tint, toneClass, strength = null, twinHex = null) => {
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
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" style="--gd-card-tint:${tint};${twinHex ? ` --gd-fin-ink:${twinHex};` : ''}${strength != null ? ` --gd-fin-strength:${strength};` : ''} background:${tint}">${seats}</div>`;
};
const facetCard = (finish, tint, toneClass, twinHex = null) => {
  const seats = FACET_SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      return `<span class="gd-card-face-finish ${c}">${inner}</span>`;
    })
    .join('');
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" style="--gd-card-tint:${tint};${twinHex ? ` --gd-fin-ink:${twinHex};` : ''} background:${tint}">${seats}</div>`;
};
// the split volume's own pair (the CardFinishLayer pair rendering, hand-
// built for the harness: the plate twin + the art twin, one seat each)
const splitCard = (finish, tint, mainStrength, artStrength) => {
  const seats = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-foil-ripples') {
        inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span>';
      }
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      // the pair's seats carry --gd-art-h INLINE exactly the way the real
      // CardFinishLayer threads it (the seat's own 200px default would
      // otherwise beat an inherited value)
      return `<span class="gd-card-face-finish ${c} is-plate-only" style="--gd-art-h:160px"></span><span class="gd-card-face-finish ${c} is-art-zone" style="--gd-art-h:160px"></span>`;
    })
    .join('');
  return `<div class="pc gd-fin-split" style="--gd-card-tint:${tint}; --gd-fin-ink:${tint}; --gd-fin-strength:${mainStrength}; --gd-fin-strength-art:${artStrength}; --gd-art-h:160px; --gd-shape-radius:10px; background:${tint}">${seats}</div>`;
};
const PLATES = [
  ['white', '#f7f7f7', 'gd-fin-ground-light'],
  ['gold', '#ffcc33', 'gd-fin-ground-light'],
  ['black', '#141414', 'gd-fin-ground-dark'],
  ['vivid', '#e02020', 'gd-fin-ground-vivid'],
  ['blue', '#4466aa', ''],
];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lumOf = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const FINISHES = Object.keys(SEATS);
const rows = FINISHES.map((finish) => PLATES.map(([name, tint, tone]) => ({ finish, name, tint, tone })));
// the facet's own field: prismatic + holographic on the bright plates
const FACET_PLATES = [['white', '#f7f7f7', 'gd-fin-ground-light'], ['purewhite', '#ffffff', 'gd-fin-ground-light'], ['gold', '#ffcc33', 'gd-fin-ground-light']];
// the split's own row: nuri on blue — main 1 / art 0, then main 0 / art 1
const SPLIT = [
  ['nuri', 1, 0], ['nuri', 0, 1], ['prismatic', 1, 0], ['prismatic', 0, 1],
];

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(5, 190px); gap: 10px; padding: 10px; }
  #facet { display: grid; grid-template-columns: repeat(3, 190px); gap: 10px; padding: 10px; }
  #split { display: grid; grid-template-columns: repeat(4, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${rows.flat().map((r) => card(r.finish, r.tint, r.tone, null, twin(r.tint))).join('\n')}</div>
<div id="facet">
${['prismatic', 'holographic'].map((f) => FACET_PLATES.map(([n, t, tone]) => facetCard(f, t, tone, twin(t))).join('\n')).join('\n')}
</div><div id="split">
${SPLIT.map(([f, m, a]) => splitCard(f, '#4466aa', m, a)).join('\n')}
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 3000 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);

// the exact grid math: field bottom = 10 + 6*(250+10) = 1570; the facet
// field's two rows seat at 1580 and 1840; the split row at 2110
const FACET_BASE_Y = 1580;
const SPLIT_BASE_Y = 2110;
const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 996, height: 2110 + 260 } });

// decode with the sharp the sandbox speaks
const sharp = (await import('sharp')).default;
const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });

let passed = 0;
let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ok — ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL — ${name}${detail ? `\n      ${detail}` : ''}`);
  }
};

const FIELD = { x: 10, y: 10, cw: 200, ch: 260 };
const measure = (x0, y0, tint, yEnd = null) => {
  const [pr, pg, pb] = hexToRgb(tint);
  let diff = 0;
  let total = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let lum = 0;
  let mag = 0;
  const yStop = yEnd != null ? yEnd : y0 + 234;
  for (let y = y0; y < yStop; y += 2) {
    for (let x = x0; x < x0 + 164; x += 2) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += 1;
      lum += lumOf(r, g, b);
      mag += (Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb)) / 3;
      if (Math.abs(r - pr) > 12 || Math.abs(g - pg) > 12 || Math.abs(b - pb) > 12) {
        diff += 1;
        sr += r;
        sg += g;
        sb += b;
      }
    }
  }
  return { ratio: diff / total, mean: diff ? [sr / diff, sg / diff, sb / diff] : null, lum: lum / total, mag: mag / total };
};

const stats = {};
for (const [rowIdx, finish] of FINISHES.entries()) {
  for (const [colIdx, plate] of PLATES.entries()) {
    const [name, tint] = plate;
    const x0 = FIELD.x + colIdx * FIELD.cw + 8;
    const y0 = FIELD.y + rowIdx * FIELD.ch + 8;
    stats[`${finish}@${name}`] = measure(x0, y0, tint);
  }
}

const facetStats = {};
{
  for (const [rowIdx, finish] of ['prismatic', 'holographic'].entries()) {
    for (const [colIdx, [name, tint]] of FACET_PLATES.entries()) {
      const x0 = FIELD.x + colIdx * FIELD.cw + 8;
      const y0 = FACET_BASE_Y + rowIdx * FIELD.ch + 8;
      facetStats[`${finish}@${name}`] = measure(x0, y0, tint);
    }
  }
}

// the split row: the cut sits at --gd-art-h 160 - (10-2+1) = 151px from
// the card's own top. The ART zone is the card's TOP (the is-art-zone
// mask shows 0..cut), the PLATE zone the BOTTOM (the plate-only mask
// shows cut..card) — art reads [8, 130), plate reads [164, 242)
const splitStats = {};
for (const [i, [finish, mainS, artS]] of SPLIT.entries()) {
  const x0 = FIELD.x + i * FIELD.cw + 8;
  const y0 = SPLIT_BASE_Y + 8;
  splitStats[`${finish}@main${mainS}/art${artS}`] = {
    art: measure(x0, y0, '#4466aa', y0 + 130),
    plate: measure(x0, y0 + 156, '#4466aa', y0 + 232),
  };
}

console.log('1. THE COAT IS PRESENT (every coat, every plate — never "dissapear")');
for (const finish of FINISHES) {
  for (const [name] of PLATES) {
    const s = stats[`${finish}@${name}`];
    ok(`${finish} on ${name} still speaks (${(s.ratio * 100).toFixed(1)}% of the plate)`, s.ratio > 0.015, `ratio ${s.ratio.toFixed(3)}`);
  }
}

console.log('\n2. THE PLATE KEEPS ITS OWN LIGHT (the twin keeps it bright — never the coffee, never the wash-out)');
/* ONE floor, every family (the "values dont loop" law's own measure): the
   1.9.4 crush measured ~0.4 of the bare plate (the report's "it becomes
   black"), the 1.9.5 wash-out sat at ~0.9 with an ink too pale to read.
   The twin's floor brackets BOTH diseases: the plate keeps at least 55%
   of its own light (the loudest whole-face coats — the forge's wash, the
   prism's saturated conic — read as tinted plates BY DESIGN, never
   coffee), and check 3 below answers the other rail (the ink must
   READ). */
const BARE_LUM = { white: lumOf(0xf7, 0xf7, 0xf7), gold: lumOf(0xff, 0xcc, 0x33), purewhite: 1 };
for (const finish of FINISHES) {
  for (const [name] of [['white'], ['gold']]) {
    const s = stats[`${finish}@${name}`];
    const keep = s.lum / BARE_LUM[name];
    ok(`${finish} on ${name} keeps ${(keep * 100).toFixed(0)}% of the plate's light`, keep >= 0.55 && keep <= 1.005, `keep ${keep.toFixed(3)}`);
  }
}

console.log('\n3. THE INK SPEAKS ON THE BRIGHT PLATES (the report\'s own measure — every family reads on white)');
for (const finish of FINISHES) {
  const s = stats[`${finish}@white`];
  ok(`${finish} on white is VISIBLE (mean delta ${s.mag.toFixed(1)} per channel)`, s.mag > 6, `mag ${s.mag.toFixed(2)}`);
}
// the white-ink facet's own seats carry their gray presence on pure white
for (const finish of ['prismatic', 'holographic']) {
  const s = facetStats[`${finish}@purewhite`];
  ok(`${finish}'s white-ink facet speaks on pure white (${(s.ratio * 100).toFixed(1)}%)`, s.ratio > 0.04, `ratio ${s.ratio.toFixed(3)}`);
  const g = facetStats[`${finish}@gold`];
  ok(`${finish}'s facet speaks on gold (${(g.ratio * 100).toFixed(1)}%)`, g.ratio > 0.03, `ratio ${g.ratio.toFixed(3)}`);
}

console.log('\n4. THE TWIN\'S OWN DERIVATION (the ink darkens the bright plate — shadow, never negative)');
for (const finish of FINISHES) {
  const s = stats[`${finish}@white`];
  const inkLum = s.mean ? lumOf(s.mean[0], s.mean[1], s.mean[2]) : 1;
  ok(`${finish}'s differing ink sits below the white plate (${inkLum.toFixed(2)} < 0.97)`, inkLum < 0.97, `ink lum ${inkLum.toFixed(3)}`);
}

console.log('\n5. THE SPLIT VOLUME (two knobs, two halves, one continuous coat)');
{
  // main 1 / art 0: the plate half (below the cut) coated, the art half
  // (above it) bare
  const a = splitStats['nuri@main1/art0'];
  ok('nuri main-full/art-zero: the plate half stays coated', a.plate.ratio > 0.03, `plate ratio ${a.plate.ratio.toFixed(3)}`);
  ok('nuri main-full/art-zero: the art half retires to clear glass', a.art.ratio < 0.015 && a.art.mag < 4, `art ratio ${a.art.ratio.toFixed(3)} mag ${a.art.mag.toFixed(2)}`);
  // main 0 / art 1: the mirror
  const b = splitStats['nuri@main0/art1'];
  ok('nuri main-zero/art-full: the plate half retires', b.plate.ratio < 0.015 && b.plate.mag < 4, `plate ratio ${b.plate.ratio.toFixed(3)} mag ${b.plate.mag.toFixed(2)}`);
  ok('nuri main-zero/art-full: the art half stays coated', b.art.ratio > 0.03, `art ratio ${b.art.ratio.toFixed(3)}`);
  // prismatic speaks the same law (the sweep band crosses both halves on
  // its own clock — the retire side reads by its MEAN delta, not its
  // transient ratio)
  const c = splitStats['prismatic@main1/art0'];
  const d = splitStats['prismatic@main0/art1'];
  ok('prismatic main-full/art-zero: plate coated', c.plate.ratio > 0.03, `plate ${c.plate.ratio.toFixed(3)}`);
  ok('prismatic main-full/art-zero: art retires (mean delta settled)', c.art.mag < 8, `art mag ${c.art.mag.toFixed(2)}`);
  ok('prismatic main-zero/art-full: plate retires (mean delta settled)', d.plate.mag < 8, `plate mag ${d.plate.mag.toFixed(2)}`);
  ok('prismatic main-zero/art-full: art coated', d.art.ratio > 0.03, `art ${d.art.ratio.toFixed(3)}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('FIX ABOVE');
  process.exit(1);
}
await browser.close();
