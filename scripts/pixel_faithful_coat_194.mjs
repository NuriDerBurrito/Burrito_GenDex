// pixel_faithful_coat_194.mjs — the eye's verdict, spoken in numbers: a
// six-by-five field (EVERY coat in the wall × five plates), measured
// pixel by pixel. The 1.9.3 probe spoke three coats; the coats it never
// measured (nuri, holographic, prismatic) are exactly the ones the
// 1.9.4 report caught vanishing on the extremes — this probe closes that
// gap. Four laws per card:
//   1. THE COAT IS PRESENT — a healthy fraction of the plate's pixels
//      differs from the bare plate color (the finish never "dissapears"),
//      on EVERY plate including the extremes.
//   2. THE EXTREMES CARRY THE INK — white, bright gold (the newly-rail-
//      caught plate) and black all beat a floor the vanished era could
//      never reach (the 1.9.4 ink law: multiply + brightness on light,
//      screen on dark).
//   3. THE LEANING COATS LEAN — numeix / foil / auric / nuri differing
//      pixels follow the plate's own hue (blue plate → bluer ink); the
//      fixed-rainbow coats (holographic, prismatic) are presence-only by
//      their own 1.9.3 law ("good as it is").
//   4. THE GLINTS RETURN ON WHITE — the luminous family's own seats
//      (numeix's dapple + moon + stars, auric's gems) measure their own
//      presence on the white plate: the report's exact vanished seats.
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
// the glint law's own measured seats (the report's exact words: "white and
// numeix theme would make the glint/shine glow spots dissapear")
const GLINT_SEATS = {
  numeix: ['gd-numeix-dapple', 'gd-numeix-stars', 'gd-numeix-moon'],
  auric: ['gd-auric-currents', 'gd-auric-flakes', 'gd-auric-summon'],
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
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" id="c-${finish}" style="--gd-card-tint:${tint}; background:${tint};">${seats}</div>`;
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

const FINISHES = Object.keys(SEATS);
const rows = FINISHES.map((finish) => PLATES.map(([name, tint, tone]) => ({ finish, name, tint, tone })));

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(5, 190px); gap: 10px; padding: 10px; }
    *, *::before, *::after { animation: none !important; transition: none !important; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${rows.flat().map((r) => card(r.finish, r.tint, r.tone)).join('\n')}</div>
<div id="glints" style="display:grid; grid-template-columns: repeat(4, 190px); gap: 10px; padding: 10px;">
${['numeix', 'auric'].map((f) => [['white', '#f7f7f7', 'gd-fin-ground-light'], ['purewhite', '#ffffff', 'gd-fin-ground-light'], ['gold', '#ffcc33', 'gd-fin-ground-light'], ['blue', '#4466aa', '']].map(([n, t, tone]) => glintCard(f, t, tone)).join('\n')).join('\n')}
</div></body></html>`;

const browser = await chromium.launch(
  // 1.9.10 — DETERMINISM: software rasterization (the same law the
  //  corner audit measured — Chromium dithers blend surfaces differently
  //  per GPU raster pass; the audit must measure the rules, not the
  //  raster's own noise).
  { args: ['--disable-gpu', '--disable-gpu-compositing'] },
);
const page = await browser.newPage({ viewport: { width: 1000, height: 2200 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);

const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 996, height: 2196 } });

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
const stats = {};
for (const [rowIdx, finish] of FINISHES.entries()) {
  for (const [colIdx, plate] of PLATES.entries()) {
    const [name, tint] = plate;
    const x0 = FIELD.x + colIdx * FIELD.cw + 8;
    const y0 = FIELD.y + rowIdx * FIELD.ch + 8;
    const [pr, pg, pb] = hexToRgb(tint);
    let diff = 0;
    let total = 0;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (let y = y0; y < y0 + 234; y += 2) {
      for (let x = x0; x < x0 + 164; x += 2) {
        const i = (y * info.width + x) * info.channels;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        total += 1;
        if (Math.abs(r - pr) > 12 || Math.abs(g - pg) > 12 || Math.abs(b - pb) > 12) {
          diff += 1;
          sr += r;
          sg += g;
          sb += b;
        }
      }
    }
    stats[`${finish}@${name}`] = { ratio: diff / total, mean: diff ? [sr / diff, sg / diff, sb / diff] : null };
  }
}

// the glint field: two rows (numeix / auric luminous families) × four
// plates, seated below the main field
const glintStats = {};
{
  const baseY = FIELD.y + FINISHES.length * FIELD.ch + 10 + 10;
  const plates = [['white', '#f7f7f7'], ['purewhite', '#ffffff'], ['gold', '#ffcc33'], ['blue', '#4466aa']];
  for (const [rowIdx, finish] of ['numeix', 'auric'].entries()) {
    for (const [colIdx, [name, tint]] of plates.entries()) {
      const x0 = FIELD.x + colIdx * FIELD.cw + 8;
      const y0 = baseY + rowIdx * FIELD.ch + 8;
      const [pr, pg, pb] = hexToRgb(tint);
      let diff = 0;
      let total = 0;
      for (let y = y0; y < y0 + 234; y += 2) {
        for (let x = x0; x < x0 + 164; x += 2) {
          const i = (y * info.width + x) * info.channels;
          if (Math.abs(data[i] - pr) > 12 || Math.abs(data[i + 1] - pg) > 12 || Math.abs(data[i + 2] - pb) > 12) diff += 1;
          total += 1;
        }
      }
      glintStats[`${finish}@${name}`] = diff / total;
    }
  }
}

console.log('1. THE COAT IS PRESENT (every coat, every plate — never "dissapear")');
for (const finish of FINISHES) {
  for (const [name] of PLATES) {
    const s = stats[`${finish}@${name}`];
    ok(`${finish} on ${name} still speaks (${(s.ratio * 100).toFixed(1)}% of the plate)`, s.ratio > 0.02, `ratio ${s.ratio.toFixed(3)}`);
  }
}

console.log('\n2. THE EXTREMES CARRY THE INK (the 1.9.4 ink law, measured)');
for (const finish of FINISHES) {
  for (const name of ['white', 'gold', 'black', 'vivid']) {
    const s = stats[`${finish}@${name}`];
    ok(`${finish} on ${name} beats the vanish floor 10x (${(s.ratio * 100).toFixed(1)}%)`, s.ratio > 0.05, `ratio ${s.ratio.toFixed(3)}`);
  }
}

console.log('\n3. THE LEANING COATS LEAN (the card\'s own hue in the ink)');
{
  const LEANERS = ['numeix', 'foil', 'auric', 'nuri'];
  const lean = (finish, plateA, plateB, sign) => {
    const a = stats[`${finish}@${plateA}`].mean;
    const b = stats[`${finish}@${plateB}`].mean;
    if (!a || !b) return false;
    return sign === 'blue' ? a[2] - a[0] > b[2] - b[0] : a[0] - a[2] > b[0] - b[2];
  };
  for (const finish of LEANERS) {
    ok(`${finish}'s ink over blue is bluer than over the vivid red`, lean(finish, 'blue', 'vivid', 'blue'), JSON.stringify(stats[`${finish}@blue`].mean && stats[`${finish}@blue`].mean.map((v) => v.toFixed(0))));
    ok(`${finish}'s ink over the vivid red is redder than over blue`, lean(finish, 'vivid', 'blue', 'red'));
    // the forge's OWN stripes lean (the 1.9.4 law): nuri over the blue
    // plate reads bluer than nuri over the bright gold plate
    if (finish === 'nuri') {
      ok(`nuri's stripes over blue are bluer than over gold (the body's own lean)`, lean(finish, 'blue', 'gold', 'blue'));
    }
  }
}

console.log('\n4. THE GLINTS RETURN ON WHITE (the report\'s exact vanished seats)');
for (const finish of Object.keys(GLINT_SEATS)) {
  for (const name of ['white', 'purewhite', 'gold']) {
    const r = glintStats[`${finish}@${name}`];
    ok(`${finish}'s luminous family speaks on ${name} (${(r * 100).toFixed(1)}%)`, r > 0.03, `ratio ${r.toFixed(3)}`);
  }
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
