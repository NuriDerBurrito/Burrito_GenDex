// probe_speaking_coat_193.mjs — THE SPEAKING COAT, proven live on real
// Chromium. The 194 suite pins the laws at their source seats; this probe
// proves them by PAINT, on the app's own sheet (the real src/index.css,
// loaded whole into a live page):
//   1. THE TRUE X — the new mask tile itself, rasterized: two straight
//      crossing diagonals (ink at the crossing, daylight between the
//      arms), round caps, not one curve command anywhere.
//   2. THE CARD-COLOR LAW — the retinted seats REACT to --gd-card-tint in
//      the same read: a blue card's numeix ink leans blue, a red card's
//      leans red, foil's metal follows the plate, auric's honey follows
//      the plate ("it would be creamy in the color of the card still").
//   3. THE EXTREME GROUNDS — the blend families answer the plate's tone
//      classes exactly as the law dictates (multiply / screen / overlay),
//      and speak their classic seats on an honest mid-tone plate.
//   4. THE MASK INTERSECT — the filaments' two mask layers composite as
//      intersect in Chromium's own engine.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(root, '..', 'src/index.css'), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
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

// the app's own sheet, loaded whole
await page.setContent('<!doctype html><html><body><div id="stage"></div></body></html>');
await page.addStyleTag({ path: path.join(root, '..', 'src/index.css') });

// one mini card per (finish, tint, tone-class) — the coat's own seats,
// painted on a plate the color the card speaks
const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
};
const buildCard = (id, finish, tint, toneClass) => {
  const seats = SEATS[finish].map((c) => `<span class="gd-card-face-finish ${c}"></span>`).join('');
  const cls = toneClass ? ` ${toneClass}` : '';
  return `<div id="${id}" class="probe-card${cls}" style="--gd-card-tint:${tint}; background:${tint}; position:relative; width:180px; height:250px; overflow:hidden; border-radius:10px; margin:6px;">${seats}</div>`;
};

console.log('1. THE TRUE X — the mask tile itself, rasterized');
{
  // pull the new glyph's mask URL straight out of the sheet
  const m = /-webkit-mask-image: url\("(data:image\/svg\+xml,[^"]+)"\);\n\s*-webkit-mask-size: 140px 420px;/.exec(css);
  ok('1a — the true-X tile seats the mask at its true size', !!m);
  const uri = m ? m[1] : '';
  ok('1b — not one curve command anywhere in the tile', !/ Q /i.test(decodeURIComponent(uri)));
  // rasterize the SVG and read the alpha of the first mark (center 29,45,
  // arms to the corners 20,36 / 38,54 / 20,54 / 38,36 — stroke 3.2)
  // the captured URI carries its own scheme prefix — the tile speaks without it
  const svgRaw = decodeURIComponent(uri.replace(/^data:image\/svg\+xml,/, ''));
  const alpha = await page.evaluate(async (svg) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('the tile never loaded'));
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
    const cv = document.createElement('canvas');
    cv.width = 140;
    cv.height = 420;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, 140, 420);
    const px = (x, y) => ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data[3] / 255;
    return {
      center: px(29, 45), // the crossing: ink over ink
      between: px(25, 45), // the open quarter between the arms: daylight
      farCorner: px(5, 5), // nowhere near any mark
      armMid: px(24, 40), // on the first diagonal (y = x + 16)
      capEnd: px(20, 36), // the round cap at the arm's very end
    };
  }, svgRaw);
  ok('1c — the crossing carries ink (two diagonals crossing AT the center)', alpha.center > 0.5, `alpha ${alpha.center.toFixed(3)}`);
  ok('1d — the quarter between the arms stays see-through', alpha.between < 0.05, `alpha ${alpha.between.toFixed(3)}`);
  ok('1e — the tile\'s corner carries no ink', alpha.farCorner < 0.02, `alpha ${alpha.farCorner.toFixed(3)}`);
  ok('1f — the diagonal\'s midspan carries its stroke', alpha.armMid > 0.3, `alpha ${alpha.armMid.toFixed(3)}`);
  ok('1g — the arm\'s end speaks its round cap', alpha.capEnd > 0.2, `alpha ${alpha.capEnd.toFixed(3)}`);
}

console.log('\n2. THE CARD-COLOR LAW — the seats react to the plate in the same read');
{
  const tints = { blue: '#4466aa', red: '#aa3344' };
  const stage = [];
  let n = 0;
  for (const [tone, tint] of Object.entries(tints)) {
    for (const finish of Object.keys(SEATS)) {
      stage.push(buildCard(`c-${tone}-${finish}`, finish, tint, ''));
      n += 1;
    }
  }
  await page.evaluate((html) => {
    document.getElementById('stage').innerHTML = html;
  }, stage.join('\n'));

  // Chromium speaks computed gradient colors as color(srgb …) / rgba(…)
  const readInk = (sel, pseudo) =>
    page.evaluate(
      ({ sel, pseudo }) => {
        const el = document.querySelector(sel);
        const cs = getComputedStyle(el, pseudo || null);
        const img = cs.backgroundImage || cs.backgroundColor;
        const colors = [...img.matchAll(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)|rgba?\((\d+), (\d+), (\d+)/g)].map((m) => {
          if (m[1]) return [Number(m[1]), Number(m[2]), Number(m[3])];
          return [Number(m[5]) / 255, Number(m[6]) / 255, Number(m[7]) / 255];
        });
        if (!colors.length) return null;
        return colors.reduce((a, c) => [a[0] + c[0] / colors.length, a[1] + c[1] / colors.length, a[2] + c[2] / colors.length], [0, 0, 0]);
      },
      { sel, pseudo }
    );

  // numeix's X ink (the signature) leans the plate's own hue
  const xBlue = await readInk('#c-blue-numeix .gd-numeix-xmarks', '::before');
  const xRed = await readInk('#c-red-numeix .gd-numeix-xmarks', '::before');
  ok('2a — a blue card\'s X ink leans blue (B > R)', xBlue && xBlue[2] > xBlue[0] + 0.02, xBlue && `avg rgb ${xBlue.map((v) => v.toFixed(2)).join(' ')}`);
  ok('2b — a red card\'s X ink leans red (R > B)', xRed && xRed[0] > xRed[2] + 0.02, xRed && `avg rgb ${xRed.map((v) => v.toFixed(2)).join(' ')}`);

  // foil's metal follows the plate ("not always towards blue")
  const foilBlue = await readInk('#c-blue-foil .gd-finish-foil');
  const foilRed = await readInk('#c-red-foil .gd-finish-foil');
  ok('2c — foil on a red card speaks the plate\'s hue (R > B)', foilRed && foilRed[0] > foilRed[2] + 0.02, foilRed && `avg rgb ${foilRed.map((v) => v.toFixed(2)).join(' ')}`);
  ok('2d — foil on a blue card stays cold (B > R)', foilBlue && foilBlue[2] > foilBlue[0] + 0.02, foilBlue && `avg rgb ${foilBlue.map((v) => v.toFixed(2)).join(' ')}`);

  // auric's honey follows the plate ("not always towards yellowish")
  const auricBlue = await readInk('#c-blue-auric .gd-finish-auric');
  const auricRed = await readInk('#c-red-auric .gd-finish-auric');
  ok('2e — auric on a blue card speaks cold gilt (B > R)', auricBlue && auricBlue[2] > auricBlue[0] + 0.01, auricBlue && `avg rgb ${auricBlue.map((v) => v.toFixed(2)).join(' ')}`);
  ok('2f — auric on a red card speaks warm gilt (R > B)', auricRed && auricRed[0] > auricRed[2] + 0.01, auricRed && `avg rgb ${auricRed.map((v) => v.toFixed(2)).join(' ')}`);

  // the dapple (a masked screen seat) reacts in the same read — flip the
  // tint, the computed ink follows, no re-render owed
  const before = await readInk('#c-blue-numeix .gd-numeix-dapple', '::before');
  await page.evaluate(() => {
    document.getElementById('c-blue-numeix').style.setProperty('--gd-card-tint', '#aa3344');
  });
  const after = await readInk('#c-blue-numeix .gd-numeix-dapple', '::before');
  ok('2g — a tint flip repaints the masked seat in the same read', before && after && Math.abs(after[0] - before[0]) > 0.04, `avg R ${before && before[0].toFixed(2)} -> ${after && after[0].toFixed(2)}`);
}

console.log('\n3. THE EXTREME GROUNDS — the blend families answer the plate\'s tone');
{
  const stage = [
    buildCard('g-light-numeix', 'numeix', '#f7f7f7', 'gd-fin-ground-light'),
    buildCard('g-light-foil', 'foil', '#f7f7f7', 'gd-fin-ground-light'),
    buildCard('g-dark-foil', 'foil', '#141414', 'gd-fin-ground-dark'),
    buildCard('g-dark-auric', 'auric', '#141414', 'gd-fin-ground-dark'),
    buildCard('g-vivid-foil', 'foil', '#ff0000', 'gd-fin-ground-vivid'),
    buildCard('g-mid-numeix', 'numeix', '#8a6d3b', ''),
  ];
  await page.evaluate((html) => {
    document.getElementById('stage').innerHTML = html;
  }, stage.join('\n'));
  const blend = (sel, pseudo) =>
    page.evaluate(
      ({ sel, pseudo }) => getComputedStyle(document.querySelector(sel), pseudo || null).mixBlendMode,
      { sel, pseudo }
    );
  ok('3a — a light plate turns the luminous dapple to a multiply tint', (await blend('#g-light-numeix .gd-numeix-dapple')) === 'multiply');
  ok('3b — a light plate turns the foil body to a multiply tint', (await blend('#g-light-foil .gd-finish-foil')) === 'multiply');
  ok('3c — a dark plate turns the foil body to screen light', (await blend('#g-dark-foil .gd-finish-foil')) === 'screen');
  ok('3d — a dark plate turns the auric honey to screen light', (await blend('#g-dark-auric .gd-finish-auric')) === 'screen');
  ok('3e — a vivid plate turns the foil body to overlay', (await blend('#g-vivid-foil .gd-finish-foil')) === 'overlay');
  ok('3f — an honest mid-tone keeps the classic screen seat', (await blend('#g-mid-numeix .gd-numeix-dapple')) === 'screen');
  ok('3g — an honest mid-tone keeps the metal\'s soft-light seat', (await blend('#g-mid-numeix .gd-finish-numeix')) === 'soft-light');
}

console.log('\n4. THE MASK INTERSECT — the filaments\' two layers speak one law');
{
  const mc = await page.evaluate(() => {
    const el = document.querySelector('#g-dark-auric .gd-auric-summon');
    const cs = getComputedStyle(el, '::after');
    return { composite: cs.maskComposite, layers: (cs.maskImage.match(/(?:none|url\(|linear-gradient\(|radial-gradient\()/g) || []).length };
  });
  // Chromium serializes the composite PER LAYER — every layer must speak it
  const seats = mc.composite.split(',').map((s) => s.trim());
  ok('4a — the filaments composite their two mask layers as intersect', seats.length === 2 && seats.every((s) => s === 'intersect'), `mask-composite: ${mc.composite}`);
  ok('4b — both mask layers seat (the tile AND the dissolve)', mc.layers === 2, `layers: ${mc.layers}`);
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
