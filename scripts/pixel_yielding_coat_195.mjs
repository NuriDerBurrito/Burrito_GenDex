// pixel_yielding_coat_195.mjs — the eye's verdict, spoken in numbers: the
// same six-by-five field the 1.9.4 probe spoke (EVERY coat in the wall ×
// five plates), measured pixel by pixel against the 1.9.5 laws, plus the
// knob's own row. Five laws per card:
//   1. THE COAT IS PRESENT — a healthy fraction of the plate's pixels
//      differs from the bare plate color (the finish never "dissapears"),
//      on EVERY plate including the extremes.
//   2. THE PLATE KEEPS ITS OWN LIGHT — on the LIGHT plates (white,
//      purewhite, gold — the report's own "too bright" seats) the coated
//      card's mean luminance stays within a breath of the bare plate:
//      the 1.9.4 multiply stack crushed a white numeix card toward dark
//      coffee ("when its too bright it becomes black"), the 1.9.5
//      retirement keeps the plate's own color under the coat.
//   3. THE INK STILL SPEAKS ON THE EXTREMES — the glint family's own
//      seats measure their presence on the white plates (the gentled
//      brightness(0.74) hand answers the vanished-glint report without
//      printing the 1.9.4 black).
//   4. THE LEANING COATS LEAN — numeix / foil / auric / nuri differing
//      pixels follow the plate's own hue (the 1.9.3/1.9.4 laws hold).
//   5. THE KNOB ATTENUATES — the volume row: the same coat at
//      --gd-fin-strength 1, 0.4 and 0 — the middle card's presence sits
//      well under the full coat's, the zero card all but vanishes (the
//      slider's own mechanics, proven live in the compositor).
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
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};
const GLINT_SEATS = {
  numeix: ['gd-numeix-dapple', 'gd-numeix-stars', 'gd-numeix-moon'],
  auric: ['gd-auric-currents', 'gd-auric-flakes', 'gd-auric-summon'],
};
const card = (finish, tint, toneClass, strength = null) => {
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
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" style="--gd-card-tint:${tint}; background:${tint};${strength != null ? ` --gd-fin-strength:${strength};` : ''}">${seats}</div>`;
};
const glintCard = (finish, tint, toneClass) => {
  const seats = GLINT_SEATS[finish].map((c) => `<span class="gd-card-face-finish ${c}"></span>`).join('');
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" style="--gd-card-tint:${tint}; background:${tint};">${seats}</div>`;
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
// the knob's own field: nuri + prismatic on the honest blue plate at
// strengths 1 / 0.4 / 0 (the slider's whole rail, two rows of three)
const KNOB = [
  ['nuri', 1], ['nuri', 0.4], ['nuri', 0],
  ['prismatic', 1], ['prismatic', 0.4], ['prismatic', 0],
];

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(5, 190px); gap: 10px; padding: 10px; }
  #glints { display: grid; grid-template-columns: repeat(4, 190px); gap: 10px; padding: 10px; }
  #knob { display: grid; grid-template-columns: repeat(3, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${rows.flat().map((r) => card(r.finish, r.tint, r.tone)).join('\n')}</div>
<div id="glints">
${['numeix', 'auric'].map((f) => [['white', '#f7f7f7', 'gd-fin-ground-light'], ['purewhite', '#ffffff', 'gd-fin-ground-light'], ['gold', '#ffcc33', 'gd-fin-ground-light'], ['blue', '#4466aa', '']].map(([n, t, tone]) => glintCard(f, t, tone)).join('\n')).join('\n')}
</div><div id="knob">
${KNOB.map(([f, s]) => card(f, '#4466aa', '', s)).join('\n')}
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 2700 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);

// the exact grid math (the 1.9.4 probe's own arithmetic): field bottom =
// 10 + 6*(250+10) = 1570; the glints' cards seat at 1580 and 1840; the
// knob field's cards at 2110 and 2370
const GLINT_BASE_Y = 1580;
const KNOB_BASE_Y = 2110;
const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 996, height: 2370 + 250 + 10 } });

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
const measure = (x0, y0, tint) => {
  const [pr, pg, pb] = hexToRgb(tint);
  let diff = 0;
  let total = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let lum = 0;
  let mag = 0;
  for (let y = y0; y < y0 + 234; y += 2) {
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

const glintStats = {};
{
  const plates = [['white', '#f7f7f7'], ['purewhite', '#ffffff'], ['gold', '#ffcc33'], ['blue', '#4466aa']];
  for (const [rowIdx, finish] of ['numeix', 'auric'].entries()) {
    for (const [colIdx, [name, tint]] of plates.entries()) {
      const x0 = FIELD.x + colIdx * FIELD.cw + 8;
      const y0 = GLINT_BASE_Y + rowIdx * FIELD.ch + 8;
      glintStats[`${finish}@${name}`] = measure(x0, y0, tint).ratio;
    }
  }
}

const knobStats = {};
for (const [i, [finish, strength]] of KNOB.entries()) {
  const colIdx = i % 3;
  const rowIdx = Math.floor(i / 3);
  const x0 = FIELD.x + colIdx * FIELD.cw + 8;
  const y0 = KNOB_BASE_Y + rowIdx * FIELD.ch + 8;
  const m = measure(x0, y0, '#4466aa');
  knobStats[`${finish}@${strength}`] = { ratio: m.ratio, mag: m.mag };
}

console.log('1. THE COAT IS PRESENT (every coat, every plate — never "dissapear")');
for (const finish of FINISHES) {
  for (const [name] of PLATES) {
    const s = stats[`${finish}@${name}`];
    ok(`${finish} on ${name} still speaks (${(s.ratio * 100).toFixed(1)}% of the plate)`, s.ratio > 0.015, `ratio ${s.ratio.toFixed(3)}`);
  }
}

console.log('\n2. THE PLATE KEEPS ITS OWN LIGHT (the 1.9.5 law, measured on the bright plates)');
// the WASH coats — the retirement's own patients: the plate's own color
// survives under the coat (the 1.9.4 stack crushed a white numeix card
// toward dark coffee; "when its too bright it becomes black")
const WASHES = ['numeix', 'foil', 'auric', 'nuri'];
for (const finish of WASHES) {
  for (const [name, tint] of [['white', '#f7f7f7'], ['gold', '#ffcc33']]) {
    const s = stats[`${finish}@${name}`];
    const plateLum = lumOf(...hexToRgb(tint));
    ok(`${finish} on ${name} keeps the plate's light (${(s.lum).toFixed(2)} vs plate ${plateLum.toFixed(2)})`, s.lum >= 0.8 * plateLum, `coated mean lum ${s.lum.toFixed(3)} < 80% of the plate's ${plateLum.toFixed(3)} — the 1.9.4 black returned`);
  }
}
// the MATERIAL coats (holographic, prismatic): the rainbow IS the card —
// the plate's light is re-spoken by design, but never crushed to the
// report's black either
for (const finish of ['holographic', 'prismatic']) {
  for (const [name] of [['white'], ['gold']]) {
    const s = stats[`${finish}@${name}`];
    ok(`${finish} on ${name} speaks its material without reading black (${(s.lum).toFixed(2)})`, s.lum > 0.3, `coated mean lum ${s.lum.toFixed(3)} sank toward the black floor`);
  }
}

console.log('\n3. THE INK STILL SPEAKS ON THE EXTREMES (the gentled hand, never the black)');
for (const finish of FINISHES) {
  for (const name of ['white', 'gold', 'black', 'vivid']) {
    const s = stats[`${finish}@${name}`];
    // foil's bright-plate voice is its thin ring field alone now (the
    // broad sheen retired with the bodies) — a line's own area floor
    const floor = finish === 'foil' ? 0.012 : 0.04;
    ok(`${finish} on ${name} beats the vanish floor (${(s.ratio * 100).toFixed(1)}%)`, s.ratio > floor, `ratio ${s.ratio.toFixed(3)}`);
  }
}
for (const finish of Object.keys(GLINT_SEATS)) {
  for (const name of ['white', 'purewhite', 'gold']) {
    const r = glintStats[`${finish}@${name}`];
    ok(`${finish}'s luminous family speaks on ${name} (${(r * 100).toFixed(1)}%)`, r > 0.03, `ratio ${r.toFixed(3)}`);
  }
}

console.log("\n4. THE LEANING COATS LEAN (the card's own hue in the ink)");
{
  const LEANERS = ['numeix', 'foil', 'auric', 'nuri'];
  const lean = (finish, plateA, plateB, sign) => {
    const a = stats[`${finish}@${plateA}`].mean;
    const b = stats[`${finish}@${plateB}`].mean;
    if (!a || !b) return false;
    return sign === 'blue' ? a[2] - a[0] > b[2] - b[0] : a[0] - a[2] > b[0] - b[2];
  };
  for (const finish of LEANERS) {
    ok(`${finish}'s ink over blue is bluer than over the vivid red`, lean(finish, 'blue', 'vivid', 'blue'));
    ok(`${finish}'s ink over the vivid red is redder than over blue`, lean(finish, 'vivid', 'blue', 'red'));
    if (finish === 'nuri') {
      ok(`nuri's stripes over blue are bluer than over gold (the body's own lean)`, lean(finish, 'blue', 'gold', 'blue'));
    }
  }
}

console.log('\n5. THE KNOB ATTENUATES (the volume var, proven live)');
for (const finish of ['nuri', 'prismatic']) {
  const full = knobStats[`${finish}@1`];
  const mid = knobStats[`${finish}@0.4`];
  const zero = knobStats[`${finish}@0`];
  // the ink's MAGNITUDE fades with the knob (a full-cover conic keeps its
  // AREA at low strength — the binary presence can't see a fade — so the
  // knob's law reads the average color distance the coat prints)
  ok(`${finish}'s ink at strength 0.4 sits well under the full coat (mag ${mid.mag.toFixed(1)} vs ${full.mag.toFixed(1)})`, mid.mag < 0.6 * full.mag && mid.mag > 1, `mid ${mid.mag.toFixed(2)} full ${full.mag.toFixed(2)}`);
  ok(`${finish}'s coat at strength 0 all but vanishes (mag ${zero.mag.toFixed(2)}, presence ${(zero.ratio * 100).toFixed(2)}%)`, zero.mag < 3 && zero.ratio < 0.02, `mag ${zero.mag.toFixed(2)} ratio ${zero.ratio.toFixed(3)}`);
  ok(`${finish}'s presence at strength 0.4 still speaks (${(mid.ratio * 100).toFixed(1)}%)`, mid.ratio > 0.02, `ratio ${mid.ratio.toFixed(3)}`);
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
