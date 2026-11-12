// pixel_speaking_coat_193.mjs — the eye's verdict, spoken in numbers: the
// same three-by-four field the render shot paints, measured pixel by
// pixel. Three laws per card:
//   1. THE COAT IS PRESENT — a healthy fraction of the plate's pixels
//      differ from the bare plate color (the finish never "dissapears").
//   2. THE COAT LEANS THE CARD — the differing pixels' mean hue follows
//      the plate's own hue (blue card → blue-leaning ink, red → red).
//   3. THE EXTREMES SPEAK — white and black plates still carry the coat
//      (the 1.9.2-era screen-only seats used to vanish there).
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
};
const card = (finish, tint, toneClass) => {
  const seats = SEATS[finish]
    .map((c) => `<span class="gd-card-face-finish ${c}">${c === 'gd-finish-foil-ripples' ? '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:3s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:6s"></span>' : ''}</span>`)
    .join('');
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}" id="c-${finish}" style="--gd-card-tint:${tint}; background:${tint};">${seats}</div>`;
};
const PLATES = [
  ['white', '#f7f7f7', 'gd-fin-ground-light'],
  ['black', '#141414', 'gd-fin-ground-dark'],
  ['vivid', '#e02020', 'gd-fin-ground-vivid'],
  ['blue', '#4466aa', ''],
];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const rows = [];
for (const [finish] of Object.entries(SEATS)) rows.push(PLATES.map(([name, tint, tone]) => ({ finish, name, tint, tone })));

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(4, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${rows.flat().map((r) => card(r.finish, r.tint, r.tone)).join('\n')}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(900);

const FIELD = { x: 10, y: 10, cw: 200, ch: 260 };
const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 796, height: 800 } });

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

const stats = {};
for (const [rowIdx, finish] of Object.keys(SEATS).entries()) {
  for (const [colIdx, plate] of PLATES.entries()) {
    const [name, tint] = plate;
    const x0 = FIELD.x + colIdx * FIELD.cw + 8;
    const y0 = FIELD.y + rowIdx * FIELD.ch + 8;
    const w = 164;
    const h = 234;
    const [pr, pg, pb] = hexToRgb(tint);
    let diff = 0;
    let total = 0;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (let y = y0; y < y0 + h; y += 2) {
      for (let x = x0; x < x0 + w; x += 2) {
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
    const ratio = diff / total;
    const mean = diff ? [sr / diff, sg / diff, sb / diff] : null;
    stats[`${finish}@${name}`] = { ratio, mean };
  }
}

console.log('1. THE COAT IS PRESENT (a healthy fraction of the plate carries the coat)');
for (const finish of Object.keys(SEATS)) {
  for (const [name] of PLATES) {
    const s = stats[`${finish}@${name}`];
    ok(`${finish} on ${name} still speaks (${(s.ratio * 100).toFixed(1)}% of the plate)`, s.ratio > 0.02, `ratio ${s.ratio.toFixed(3)}`);
  }
}

console.log('\n2. THE COAT LEANS THE CARD (the differing pixels follow the plate\'s hue)');
{
  const lean = (finish, plateA, plateB, sign) => {
    const a = stats[`${finish}@${plateA}`].mean;
    const b = stats[`${finish}@${plateB}`].mean;
    if (!a || !b) return false;
    // the ink over the blue plate must be BLUER than the same ink over the
    // red plate (and vice versa) — the coat reads the card's own color
    return sign === 'blue' ? a[2] - a[0] > b[2] - b[0] : a[0] - a[2] > b[0] - b[2];
  };
  for (const finish of Object.keys(SEATS)) {
    ok(`${finish}'s ink over blue is bluer than over the vivid red`, lean(finish, 'blue', 'vivid', 'blue'), JSON.stringify(stats[`${finish}@blue`].mean && stats[`${finish}@blue`].mean.map((v) => v.toFixed(0))));
    ok(`${finish}'s ink over the vivid red is redder than over blue`, lean(finish, 'vivid', 'blue', 'red'));
  }
}

console.log('\n3. THE EXTREMES SPEAK (the 1.9.2-era vanishings, disproven by paint)');
{
  // white + black + vivid all carry MORE coat than a bare plate would
  // (the floor is low: a whisper of grain counts, but a VANISHED coat
  // reads under 0.5% — the retired era's own arithmetic)
  for (const finish of Object.keys(SEATS)) {
    ok(`${finish} on white beats the vanish floor 6x`, stats[`${finish}@white`].ratio > 0.03, `ratio ${stats[`${finish}@white`].ratio.toFixed(3)}`);
    ok(`${finish} on black beats the vanish floor 6x`, stats[`${finish}@black`].ratio > 0.03, `ratio ${stats[`${finish}@black`].ratio.toFixed(3)}`);
    ok(`${finish} on vivid beats the vanish floor 6x`, stats[`${finish}@vivid`].ratio > 0.03, `ratio ${stats[`${finish}@vivid`].ratio.toFixed(3)}`);
  }
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
