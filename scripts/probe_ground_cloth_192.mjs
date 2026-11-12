// probe_ground_cloth_192.mjs — THE LISTENING GROUND, proven live on real
// Chromium. The suite's D-section proves the direction law by arithmetic;
// this probe proves it by PAINT: the six real ground values (parsed from
// TagRibbon's own seat) are painted on a real element under every real
// theme preset's own --gd-panel, and Chromium's own color engine is asked
// what it computed. Three laws:
//   1. THE DIRECTION — a dark cloth paints a dark ground, a light cloth a
//      light one: the reported numeix inversion ("it would make it
//      inverted") cannot happen on any preset.
//   2. THE REACTIVITY — flipping --gd-panel (a theme switch) repaints the
//      ground in the SAME read, no re-render owed: "it should react to the
//      theme color itself".
//   3. THE OLD LAW'S ARROW — the retired fixed plate (#e9dec4, the 1.7.4
//      numeix ground) still reads BRIGHT on every dark cloth: the disease
//      the 1.9.2 law retires, shown live for the record.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { THEME_PRESETS } from '../src/constants/index.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const ribbon = readFileSync(path.join(root, '..', 'src/components/TagRibbon.jsx'), 'utf8');

// the six real grounds, parsed from the law's own seat
const GROUND = {};
const block = ribbon.match(/export const FINISH_GROUND = \{\n((?:[ ]+\w+: '[^']+',\n)+)\};/);
if (!block) throw new Error('the FINISH_GROUND map never spoke');
for (const line of block[1].trim().split('\n')) {
  const m = line.match(/^\s*(\w+): '(.+)',\s*$/);
  if (m) GROUND[m[1]] = m[2];
}
const MATERIALS = Object.keys(GROUND);
if (MATERIALS.length !== 6) throw new Error(`the map spoke ${MATERIALS.length} materials, not six`);

const relLumChannels = (r, g, b) => {
  const lin = [r, g, b].map((c) => {
    const v = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return v;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};
// a computed color string — Chromium speaks color-mix results as
// color(srgb r g b) floats, plain fills as rgb(r, g, b) ints
const relLum = (str) => {
  const s = String(str);
  let m = s.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)/);
  if (m) return relLumChannels(Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return relLumChannels(Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255);
  return NaN;
};
// a plain #rrggbb panel
const relLumHex = (hex) => {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return relLumChannels(c[0], c[1], c[2]);
};

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

// one element per material, painted with the real ground value, under a
// root that speaks the preset's own panel var — exactly the card's seat
const cells = MATERIALS.map((f) => `<div class="ground" data-f="${f}" style="background: ${GROUND[f]}"></div>`).join('\n');
await page.setContent(`<!doctype html><html><body>
<div id="cloth" style="--gd-panel: #1c1330;">
${cells}
<div class="ground" data-f="RETIRED_PLATE" style="background: #e9dec4"></div>
</div>
<style>
  .ground { width: 60px; height: 24px; }
</style>
</body></html>`);

const readGrounds = () =>
  page.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('.ground')) out[el.dataset.f] = getComputedStyle(el).backgroundColor;
    return out;
  });

console.log('1. THE DIRECTION LAW (every preset, every material, Chromium\'s own math)');
for (const t of THEME_PRESETS) {
  await page.evaluate((panel) => {
    document.getElementById('cloth').style.setProperty('--gd-panel', panel);
  }, t.panel);
  const grounds = await readGrounds();
  const panelLum = relLumHex(t.panel);
  for (const f of MATERIALS) {
    const gLum = relLum(grounds[f]);
    if (panelLum < 0.5) {
      ok(`${f} on ${t.id} (dark cloth #${t.panel}) stays dark`, gLum < 0.5, `computed ${grounds[f]} (lum ${gLum.toFixed(3)})`);
    } else {
      ok(`${f} on ${t.id} (light cloth #${t.panel}) stays light`, gLum > 0.14, `computed ${grounds[f]} (lum ${gLum.toFixed(3)})`);
    }
  }
}

console.log('\n2. THE REACTIVITY LAW (a theme switch repaints in the same read)');
{
  const dark = THEME_PRESETS.find((t) => relLumHex(t.panel) < 0.5);
  const light = THEME_PRESETS.find((t) => relLumHex(t.panel) >= 0.5);
  await page.evaluate((panel) => {
    document.getElementById('cloth').style.setProperty('--gd-panel', panel);
  }, dark.panel);
  const before = await readGrounds();
  await page.evaluate((panel) => {
    document.getElementById('cloth').style.setProperty('--gd-panel', panel);
  }, light.panel);
  const after = await readGrounds();
  for (const f of MATERIALS) {
    ok(`${f} answered the panel flip without a re-render`, before[f] !== after[f], `${before[f]} -> ${after[f]}`);
  }
  // and the flip kept the direction on both cloths
  const beforeLum = relLum(before.numeix);
  const afterLum = relLum(after.numeix);
  ok('numeix rode the flip dark -> light', beforeLum < 0.5 && afterLum > 0.14, `lum ${beforeLum.toFixed(3)} -> ${afterLum.toFixed(3)}`);
}

console.log('\n3. THE OLD LAW\'S ARROW (the retired fixed plate, shown for the record)');
{
  await page.evaluate((panel) => {
    document.getElementById('cloth').style.setProperty('--gd-panel', panel);
  }, THEME_PRESETS[0].panel);
  const grounds = await readGrounds();
  const retired = relLum(grounds.RETIRED_PLATE);
  const numeix = relLum(grounds.numeix);
  ok('the retired #e9dec4 plate read bright on the dark cloth (the reported inversion)', retired > 0.5, `lum ${retired.toFixed(3)}`);
  ok('the living numeix ground reads dark on the same cloth', numeix < 0.5, `lum ${numeix.toFixed(3)}`);
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed — ${failed ? 'FIX ABOVE' : 'ALL GREEN'}`);
process.exit(failed ? 1 : 0);
