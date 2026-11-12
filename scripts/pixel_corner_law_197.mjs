// pixel_corner_law_197.mjs — the corner audit, 1.9.10 edition: THE
// CLASSIC COAT, VERIFIED. Born in 1.9.7 (the corner law), grown into a
// systematic 78-plate sweep in 1.9.9, re-baselined in 1.9.10 to the
// report's own law:
//   "the last update where colors for finishes were stable was version
//    1.9.2~1.9.1 and older ... i want you to revert back the finishes
//    and the colors ... and then fix from it so its stable ... i want
//    you to account for each of teh finishes values when the color
//    shifts to the absolute corners , values , etc , and ensure they
//    dont exceed the max limit , or that they dont loop around and break"
// THE VERDICT, 1.9.10 edition — DETERMINISTIC: the first classic verdict
// compared two GPU-rastered bitmaps of 48-card blend fields, and the
// raster itself is nondeterministic at that scale (two identical runs
// measured 128 vs 181 different failing cells; the same #800000 plate
// passed as `deepred` in one chunk and failed as `darkh0` in another;
// isolated re-renders of one card wobble 0.2-1.2 per channel run to run
// while the computed styles stay byte-equal — Chromium dithers conic
// gradient + blend surfaces differently per raster pass). The verdict
// now measures what the rules actually SAY:
//   · THE CLASSIC VERDICT — every coat seat (element and both pseudos)
//     of the five classic families must carry IDENTICAL COMPUTED PAINT
//     (background-image, background-color, blend, opacity, filter,
//     mask, transform...) under the current sheet and the delivered
//    1.9.2 sheet — the rules are the same rules, proven live at every
//    plate, with the ground classes and tint vars seated exactly as
//    the app seats them. Rendering follows from the same computed
//    cascade; the residual bitmap dither is the raster's own noise,
//    equal for both sheets (measured and recorded in --diag).
//   · THE X BAND — numeix's X SIGNATURE is the owner's carve-out: its
//     seats must DIFFER from the classic looms by the lean ink alone
//     (computed paint differs on the X seats, equal on every other
//     numeix seat), and an ISOLATED-card pixel band (one card per
//     raster — the quiet surface) keeps the glyph's difference present
//     but bounded on every plate.
//   · THE LIMITS — every stat finite (no NaN can enter: the classic
//     anchors are constants inside 0-255, and the one live derivation
//     left — the X's lean — gates its input, clamps its channels and
//     bounds its bisection; the audit proves it live at the absolute
//     corners, where "values loop around and break" would show).
// Usage: node scripts/pixel_corner_law_197.mjs [--diag]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const DIAG = process.argv.includes('--diag');
const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');
const FIXTURE = path.join(root, 'fixtures', 'index_classic_192_coat.css');
// 1.9.10 HARNESS LAW #1 — the classic sheet the audit renders against is
// the delivered 1.9.2 tree's FULL src/index.css, not the coat-region
// fixture alone: a region extract cannot seat the color cascade the app
// seats around the coat, and computed borderColor (currentColor) inherits
// it — measured: the 192 tree itself "fails" a fixture-only comparison on
// every seat's color/borderColor. The fixture stays as the byte-provenance
// record, asserted verbatim-contained in the classic sheet at startup.
const CLASSIC = '/home/z/my-project/burrito_gendex_192/src/index.css';
const classicText = readFileSync(CLASSIC, 'utf8');
const fixtureText = readFileSync(FIXTURE, 'utf8');
const fixtureCore = fixtureText.slice(fixtureText.indexOf('*/') + 2).replace(/^\n+/, '').replace(/\n+$/, '');
if (!classicText.includes(fixtureCore)) {
  console.error('FATAL: the classic coat fixture is no longer verbatim inside the 1.9.2 sheet — provenance broken.');
  process.exit(2);
}

// the lean (finishTintLean's own math, mirrored — the source law is
// pinned by the 200 suite; the same HSL hue+saturation pass + the fixed
// luma seat's bisection solver. 1.9.10 — the lean speaks for the NUMEIX
// X SIGNATURE ALONE now: every other coat seat returned to its classic
// fixed colors, so these vars feed the X looms' tint hand and nothing
// else in the field below.)
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
  const tl = (lo + hi) / 2;
  const rgb = hslToRgb(h, s, tl);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${rgb.map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

// the plate field — the 1.9.9 systematic sweep, kept whole: every value
// class the wheel can name.
const hsl = (h, s, l) => {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const ch = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${ch(hue(h + 1 / 3))}${ch(hue(h))}${ch(hue(h - 1 / 3))}`;
};
const HUE_NAMES = ['h0', 'h30', 'h60', 'h90', 'h120', 'h150', 'h180', 'h210', 'h240', 'h270', 'h300', 'h330'];
const PLATES = [
  ['white', '#ffffff'], ['pale', '#f0f0f0'],
  ['red', '#ff0000'], ['orange', '#ff8800'], ['yellow', '#ffff00'],
  ['chart', '#88ff00'], ['green', '#00ff00'], ['spring', '#00ff88'],
  ['cyan', '#00ffff'], ['azure', '#0088ff'], ['blue', '#0000ff'],
  ['violet', '#8800ff'], ['magenta', '#ff00ff'], ['rose', '#ff0088'],
  ['black', '#000000'], ['nearblack', '#141414'], ['dgray', '#2a2a2a'],
  ['deepred', '#800000'], ['deepgreen', '#008000'], ['deepblue', '#000080'],
  ['deepmagenta', '#800080'], ['deepyellow', '#808000'], ['depcyan', '#008080'],
  ['sunburst', '#ffd400'], ['bubble', '#ff3df5'], ['honey', '#f5d36b'],
  // LOW-SATURATION CHROMATICS — the muddy mid band (mist / apple / slate)
  ['mist', '#7fd1d8'], ['apple', '#a3c24a'], ['slate', '#9aa0a6'],
  ['ember', '#c8402f'], ['tangerine', '#ff8c42'], ['lagoon', '#2f9e77'],
  ['cornflower', '#5b8def'], ['grape', '#9d4edd'],
  // THE GRAY LADDER — the desaturation rail end to end (g25..gdd)
  ['g25', '#252525'], ['g38', '#383838'], ['g52', '#525252'], ['g66', '#666666'],
  ['g80', '#808080'], ['g94', '#949494'], ['gaa', '#aaaaaa'],
  ['gbb', '#bbbbbb'], ['gcc', '#cccccc'], ['gdd', '#dddddd'],
  ['e7c35b', '#e7c35b'],
  // THE LIGHT-CARD LADDER — the report's own light patients
  ['ltorange', '#ffcf9e'], ['ltorange2', '#ffd9a8'], ['ltorange3', '#ffe3c0'],
  ['ltgold', '#f2df9a'], ['ltred', '#ffb3a8'], ['ltgreen', '#b8e6b8'],
  ['ltblue', '#a8c8ff'], ['ltpink', '#ffd1e8'],
  // THE PASTEL BAND — the wheel's pale quadrant
  ['pastelblue', '#8080ff'], ['pastelviolet', '#9a80ff'],
  ['pastelsky', '#80b3ff'], ['pastelorchid', '#b380ff'],
  ['softslate', '#b8c4d4'], ['softlilac', '#c4b8d4'], ['softsand', '#d4c4b8'],
  ...HUE_NAMES.map((n, i) => [`light${n}`, hsl(i * 30 / 360, 1, 0.75)]),
  ...HUE_NAMES.map((n, i) => [`dark${n}`, hsl(i * 30 / 360, 1, 0.25)]),
];

// ground classes mirrored from finishGroundTone (TagRibbon.jsx) — 1.9.10:
// the classes stay on the card root and switch the X SIGNATURE'S ink
// alone (the dark ground's glow hand + the light ground's depth filter
// — the only two CSS rules that read them)
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
const X_SEATS = new Set(['gd-numeix-xmarks']);
const FINISHES = Object.keys(SEATS);
const CLASSIC_FAMILIES = FINISHES.filter((f) => f !== 'numeix');

const card = (finish, name, tint, toneClass) => {
  const seats = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-foil-ripples') {
        inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span>';
      }
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      return `<span class="gd-card-face-finish ${c}">${inner}</span>`;
    })
    .join('');
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" data-plate="${name}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin(tint)}; --gd-fin-glow:${twin(tint, 0.78)}; --gd-fin-art:${twin(tint, 0.75)}; background:${tint}">${seats}</div>`;
};

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lumOf = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// 1.9.10 HARNESS LAW #2 — the freeze must reach the PSEUDOS: `*` alone
// matches elements only, so every animated ::before/::after kept running
// and its computed transform/opacity jittered at read time (4th-decimal
// matrix drift between two documents probed microseconds apart).
const freeze = '*, *::before, *::after { animation: none !important; transition: none !important; }';

// ---------------------------------------------------------------------------
// THE CLASSIC VERDICT — deterministic computed paint, both sheets, every
// seat, element + both pseudos. The paint-relevant properties the coat
// can speak:
// ---------------------------------------------------------------------------
const PAINT_PROPS = [
  'backgroundImage', 'backgroundColor', 'backgroundPosition', 'backgroundSize',
  'backgroundRepeat', 'backgroundBlendMode', 'backgroundAttachment',
  'mixBlendMode', 'opacity', 'filter', 'dropRuntime', 'isolation',
  'maskImage', 'webkitMaskImage', 'maskSize', 'maskPosition', 'maskRepeat',
  'transform', 'borderRadius', 'borderColor', 'boxShadow',
];
const PROBE = `(() => {
  const PROPS = ${JSON.stringify(PAINT_PROPS)};
  const rows = [];
  for (const el of document.querySelectorAll('.gd-card-face-finish, .gd-card-face-finish *')) {
    const cs = getComputedStyle(el);
    const plate = (el.closest('.pc') && el.closest('.pc').dataset.plate) || '?';
    const row = { cls: el.className, plate };
    for (const p of PROPS) {
      let v;
      try { v = cs[p]; } catch (e) { v = undefined; }
      if (v === undefined) {
        if (p === 'webkitMaskImage') v = cs.getPropertyValue('-webkit-mask-image');
        else v = cs.getPropertyValue(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
      }
      row[p] = String(v);
    }
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      const prow = { cls: el.className + pseudo, plate };
      for (const p of PROPS) {
        let v;
        try { v = ps[p]; } catch (e) { v = undefined; }
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

const browser = await chromium.launch(
  // 1.9.10 — DETERMINISM: software rasterization (the pixel columns the
  // audit still keeps — the presence stats and the isolated X band —
  // render on the quiet surface; see the header note for the field-scale
  // raster's own measured nondeterminism).
  { args: ['--disable-gpu', '--disable-gpu-compositing'] },
);

const styleRows = {};
for (let base = 0; base < PLATES.length; base += 8) {
  const chunk = PLATES.slice(base, base + 8);
  const field = FINISHES.map((finish) => chunk.map(([name, tint]) => card(finish, name, tint, groundOf(tint))).join('')).join('\n');
  const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(${chunk.length}, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
  ${freeze}
</style></head><body><div id="field">${field}</div></body></html>`;
  for (const [sheet, cssPath] of [['cur', path.join(tree, 'src/index.css')], ['classic', CLASSIC]]) {
    const page = await browser.newPage({ viewport: { width: 190 * chunk.length, height: 1600 } });
    await page.setContent(html);
    await page.addStyleTag({ path: cssPath });
    await page.waitForTimeout(250);
    const rows = await page.evaluate(PROBE);
    for (const r of rows) styleRows[`${sheet}|${r.plate}|${r.cls}`] = r;
    await page.close();
  }
  console.log(`  computed chunk ${base / 8 + 1}/13 seated (${chunk.length} plates)`);
}

// seat classification: a row's cls is "gd-card-face-finish <seat>" plus
// children (ripple / shards / dots); map back to its family + seat name
const seatOf = (cls) => {
  const toks = cls.replace(/::(before|after)$/, '').split(/\s+/);
  for (const t of toks) {
    for (const f of FINISHES) if (SEATS[f].includes(t)) return { finish: f, seat: t };
    if (t === 'gd-foil-ripple') return { finish: 'foil', seat: 'gd-foil-ripple' };
    if (t === 'gd-holo-shards' || t === 'gd-holo-dots') return { finish: 'holographic', seat: t };
  }
  return null;
};

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

// -------------------------------------------------------------------------
// 1. THE CLASSIC VERDICT: the five families' every seat (element +
//    pseudos) carries IDENTICAL computed paint under both sheets — the
//    rules are the same rules, proven live at every plate (numeix's
//    non-X seats answer the same law; its X seats are the carve-out
//    checked below).
// -------------------------------------------------------------------------
const curRows = new Map(), classicRows = new Map();
for (const key of Object.keys(styleRows)) {
  const sheet = key.slice(0, key.indexOf('|'));
  const rest = key.slice(key.indexOf('|') + 1); // plate|cls
  (sheet === 'cur' ? curRows : classicRows).set(rest, styleRows[key]);
}
let seatsChecked = 0;
for (const [key, curRow] of curRows) {
  const plate = key.slice(0, key.indexOf('|'));
  const cls = key.slice(key.indexOf('|') + 1);
  const classicRow = classicRows.get(key);
  if (!classicRow) continue;
  const seat = seatOf(cls);
  if (!seat) continue;
  const pseudo = cls.endsWith('::before') || cls.endsWith('::after') ? cls : '';
  const isX = X_SEATS.has(seat.seat);
  if (seat.finish === 'numeix' && isX) continue; // carve-out band below
  seatsChecked += 1;
  let same = true;
  const badProps = [];
  for (const p of PAINT_PROPS) {
    if (curRow[p] !== classicRow[p]) {
      same = false;
      badProps.push(p);
    }
  }
  ok(`${seat.finish} [${plate}] ${cls} speaks the classic computed paint`, same, badProps.length ? `props differ: ${badProps.join(', ')}` : '');
}

// -------------------------------------------------------------------------
// 2. THE X CARVE-OUT: numeix's X seats must DIFFER from the classic
//    looms (the lean ink is live), their geometry/opacity equal, and an
//    ISOLATED-card pixel band keeps the glyph's difference present but
//    bounded on every plate.
// -------------------------------------------------------------------------
// 1.9.10 HARNESS LAW #3 — the X seat's ink lives in its PSEUDOS (the
// element itself carries no background in either sheet — "none" vs
// "none" — so an element-row comparison can never show the carve-out
// speaking). The carve-out is judged per PLATE across the seat's three
// rows: at least one row's paint must DIFFER from the classic loom (the
// lean ink is live), while every row keeps the loom's geometry and voice.
const xRowsByPlate = new Map();
for (const [key, curRow] of curRows) {
  const classicRow = classicRows.get(key);
  if (!classicRow) continue;
  const plate = key.slice(0, key.indexOf('|'));
  const cls = key.slice(key.indexOf('|') + 1);
  const seat = seatOf(cls);
  if (!seat || seat.finish !== 'numeix' || !X_SEATS.has(seat.seat)) continue;
  if (!xRowsByPlate.has(plate)) xRowsByPlate.set(plate, []);
  xRowsByPlate.get(plate).push({ cls, curRow, classicRow });
}
for (const [plate, rows] of xRowsByPlate) {
  const inkLive = rows.some((r) => r.curRow.backgroundImage !== r.classicRow.backgroundImage);
  ok(`numeix X [${plate}] carries the lean ink (differs from the classic loom)`, inkLive,
    'background identical on every row — the carve-out never spoke');
  const drifted = rows.filter((r) => r.curRow.opacity !== r.classicRow.opacity || r.curRow.transform !== r.classicRow.transform || r.curRow.mixBlendMode !== r.classicRow.mixBlendMode);
  ok(`numeix X [${plate}] keeps the loom's geometry and voice`, drifted.length === 0,
    `drifted: ${drifted.map((r) => r.cls).join(', ')}`);
}

// the isolated X band — one card per raster (the quiet surface), the
// numeix coat rendered through both sheets, drift bounded to the X's
// own difference (the dither noise of a single quiet card measures
// ~0.1; the X's ink difference rides well above it)
const isoCard = (tint) => `<div class="pc ${groundOf(tint)}" style="--gd-card-tint:${tint}; --gd-fin-ink:${twin(tint)}; --gd-fin-glow:${twin(tint, 0.78)}; --gd-fin-art:${twin(tint, 0.75)}; background:${tint}">${SEATS.numeix.map((c) => `<span class="gd-card-face-finish ${c}"></span>`).join('')}</div>`;
const isoRender = async (cssPath, html) => {
  const page = await browser.newPage({ viewport: { width: 220, height: 300 } });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}${freeze}</style></head><body>${html}</body></html>`);
  await page.addStyleTag({ path: cssPath });
  await page.addStyleTag({ content: 'html, body { background: #2a2a33 !important; margin: 0 !important; }' });
  await page.waitForTimeout(200);
  const shot = await page.screenshot();
  await page.close();
  return sharp(shot).raw().toBuffer({ resolveWithObject: true });
};
const xBand = {};
for (const [name, tint] of PLATES) {
  const html = isoCard(tint);
  const A = await isoRender(path.join(tree, 'src/index.css'), html);
  const B = await isoRender(CLASSIC, html);
  let mag = 0, tot = 0;
  for (let y = 8; y < 258; y += 2) for (let x = 8; x < 172; x += 2) {
    const i = (y * A.info.width + x) * A.info.channels;
    const j = (y * B.info.width + x) * B.info.channels;
    mag += (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2])) / 3;
    tot += 1;
  }
  xBand[name] = mag / tot;
  ok(`numeix's X signature rides on ${name} (isolated band)`, xBand[name] >= 0.3 && xBand[name] < 40, `X BAND (isolated render-diff ${xBand[name].toFixed(2)})`);
}

// -------------------------------------------------------------------------
// 3. THE LIMITS: every stat finite — no NaN, no loop-around, no break
//    at any corner the wheel can name; the lean's hex output at every
//    corner parses to a valid channel-bounded rgb.
// -------------------------------------------------------------------------
for (const [name, tint] of PLATES) {
  for (const seat of [0.45, 0.78, 0.75]) {
    const hex = twin(tint, seat);
    const okHex = /^#[0-9a-f]{6}$/.test(hex);
    const [r, g, b] = hexToRgb(hex);
    ok(`the lean at ${name} seat ${seat} stays inside the channel limits`, okHex && [r, g, b].every((c) => Number.isFinite(c) && c >= 0 && c <= 255), `hex ${hex}`);
  }
  ok(`the X band stat at ${name} is finite`, Number.isFinite(xBand[name]), `xBand ${xBand[name]}`);
}

await browser.close();

if (DIAG) {
  console.log('\n== THE CLASSIC VERDICT (computed paint rows compared) ==');
  for (const f of FINISHES) {
    const n = [...curRows.keys()].filter((c) => { const s = seatOf(c.slice(c.indexOf('|') + 1)); return s && s.finish === f; }).length;
    console.log(`  ${f.padEnd(12)} ${n} seat rows compared cur-vs-classic`);
  }
  console.log('\n== THE X BAND (isolated render-diff per plate) ==');
  for (const [name] of PLATES) console.log(`  ${name.padEnd(13)} xBand=${xBand[name].toFixed(2)}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('FAILURES:');
  for (const f of failures.slice(0, 120)) console.log(`  ✗ ${f}`);
  if (failures.length > 120) console.log(`  ... and ${failures.length - 120} more`);
  if (!DIAG) console.log('\n(run with --diag for the full table)');
  process.exit(1);
}
