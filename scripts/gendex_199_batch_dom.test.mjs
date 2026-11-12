// 1.9.8 batch — The Quiet Seam.
// (Named 199 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1, 193 the 1.9.2, 194 the 1.9.3, 195 the 1.9.4, 196 the
//  1.9.5, 197 the 1.9.6, 198 the 1.9.7; this suite pins the 1.9.8 laws
//  at their roots. Built on the 1.9.7 tree — the release line continues.)
// The reported items, pinned at their root laws:
//   A.  THE WHEEL KEEPS ITS HUE ("when pulling the color wheel from
//       black to white it resets the color to red hue even if i was on
//       some other color like blue or purple etc"): the picker carries a
//       module-level hue MEMORY — every chromatic color the panels see
//       writes it, every turn of the rail writes it, and an achromatic
//       incoming (the black-to-white column, the grays, the whites)
//       keeps the remembered hue instead of resetting the rail to red.
//   B.  THE QUIET SEAM ("the finishes have the same issue but now its
//       in middle way, aka the center top of the color picker it would
//       get inverted, it relates to the background of the finish
//       dissapearing then i assume"): the twin's rail and the ground
//       classes flip at luminance 0.70 now (was 0.5 — the exact line the
//       wheel seats at the center-top pastel band for the blues and
//       purples the owner drags), so the pastel band keeps its GLOWING
//       dark-family voice end to end and the shadow twin only takes the
//       hand near the bright edge. The pure hues keep their 1.9.7
//       measured seats (green 0.7152 light, cyan 0.7874 bright, the
//       yellow cure untouched).
//   C.  THE PICTURE KEEPS ITS OWN EYE ("finishes such as prismatic and
//       holographic are too visible on images that it becomes too hard
//       to see the actual image, as if the background of the finishes
//       actually apply over the image, same goes for alot of the
//       finishes, and that started happening a few updates ago"): the
//       plate/art twin pair arms whenever a coat covers a real image,
//       the art twin's seats fall out of every ground-class flip
//       (:not(.is-art-zone), the child seats on their ancestor), and
//       its hand falls back to the card's RAW tint — the classic voice
//       over the picture, the corner audit's every word below the notch.
//   D.  THE GHOST IS A STATIC CARD ("when dragging a class it becomes so
//       laggy even when i let go on weaker cpus unlike before"): the
//       drag ghost is a detached offscreen clone (one raster at
//       dragstart, retired at dragend / drop / unmount), and the drop
//       highlight only speaks when its seat actually changes.
//   E.  THE FURNITURE — the version seats speak 1.9.8, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assertMatch = (text, re, msg) => {
  if (!re.test(text)) throw new Error(msg || 'pattern missing');
};
const block = (css, selector) => {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{[\\s\\S]*?\\n\\}');
  const m = re.exec(css);
  return m ? m[0] : '';
};

const css = src('src/index.css');
const ribbon = src('src/components/TagRibbon.jsx');
const picker = src('src/components/ColorPicker.jsx');
const sidebar = src('src/components/ClassSidebar.jsx');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');
const helpers = src('src/utils/helpers.js');

console.log('A. THE WHEEL KEEPS ITS HUE ("it resets the color to red hue even if i was on some other color like blue or purple")');

ok('A1 — the wheel carries its hue memory (the module-level seat)', () => {
  assertMatch(picker, /const wheelHueMemory = \{ h: null \};/, 'the memory seat never spoke');
  assertMatch(picker, /const HUE_KEEP_SAT = 0\.02;/, 'the achromatic rail never spoke');
  assertMatch(picker, /if \(parsed\.s >= HUE_KEEP_SAT\) \{\s*\n    wheelHueMemory\.h = parsed\.h;\s*\n    return parsed;\s*\n  \}/, 'a chromatic color never wrote the memory');
  assertMatch(picker, /return \{ \.\.\.parsed, h: wheelHueMemory\.h \?\? parsed\.h \};/, 'an achromatic color never kept the remembered hue');
});

ok('A2 — every mount and re-sync seeds through the memory', () => {
  // 1.9.9 — the seed rides the hsvRef MIRROR (the gesture's own book):
  // the lazy init seeds it at mount, the re-sync writes it on genuine
  // external changes — and the state itself is born from the mirror
  assertMatch(picker, /if \(hsvRef\.current == null\) hsvRef\.current = seedHsv\(incoming\);/, 'the mount never seeded through the memory');
  assertMatch(picker, /const seeded = seedHsv\(incoming\);\s*\n      hsvRef\.current = seeded;\s*\n      setHsv\(seeded\);/, 'the re-sync never seeded through the memory');
});

ok('A3 — the gesture writes the memory (the rail and the chromatic watcher)', () => {
  assertMatch(picker, /wheelHueMemory\.h = next\.h;/, 'a turn of the rail never wrote the memory');
  assertMatch(picker, /if \(hsv\.s >= HUE_KEEP_SAT\) wheelHueMemory\.h = hsv\.h;/, 'the chromatic watcher never spoke');
});

ok('A4 — the seed speaks (evaluated live: a gray keeps the last chromatic hue)', () => {
  // hexToHsv + seedHsv + the memory, lifted from their own sources and
  // spoken together — the same math the panel runs at its own seats
  const hexToHsvSrc = /export function hexToHsv[\s\S]*?\n\}/.exec(helpers)?.[0] || '';
  assert.ok(hexToHsvSrc, 'hexToHsv never left helpers');
  const seedSrc = /const seedHsv = \(hex\) => \{[\s\S]*?\n\};/.exec(picker)?.[0] || '';
  assert.ok(seedSrc, 'seedHsv never spoke in the picker');
  const hexToHsv = new Function('return ' + hexToHsvSrc.replace('export function', 'function'))();
  const seedArrow = seedSrc.replace('const seedHsv = ', '').replace(/;\s*$/, '');
  const seedOf = (mem) => new Function('hexToHsv', 'wheelHueMemory', 'HUE_KEEP_SAT', 'return ' + seedArrow)(hexToHsv, mem, 0.02);
  // a chromatic blue seeds the memory (hsv h for #3355ff sits at 230)
  const blue = seedOf({ h: null })('#3355ff');
  assert.ok(Math.abs(blue.h - 230) < 1.5, `the blue seed spoke h ${blue.h}`);
  // the gray keeps the remembered hue — the report's own drag, answered
  const gray = seedOf({ h: 230 })('#808080');
  assert.equal(gray.h, 230, `the gray reset the wheel to h ${gray.h}`);
  const white = seedOf({ h: 230 })('#ffffff');
  assert.equal(white.h, 230, `the white reset the wheel to h ${white.h}`);
  // a fresh memory with no word yet falls to the hex's own red 0 (the
  // law's honest fallback — nothing to remember, nothing to keep)
  const fresh = seedOf({ h: null })('#808080');
  assert.equal(fresh.h, 0, 'the fresh memory kept a hue it never heard');
});

console.log('\nB. THE QUIET SEAM ("the center top of the color picker it would get inverted")');

ok('B1 — the lean speaks the fixed seats (1.9.9: brightness never enters the ink)', () => {
  const fnSrc = /export function finishTintLean[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assertMatch(fnSrc, /const LEAN_LUMA = Number\.isFinite\(\+seat\) \? Math\.min\(0\.9, Math\.max\(0\.1, \+seat\)\) : 0\.45;/, 'the fixed seat never spoke');
  assert.ok(!/const lum = 0\.2126/.test(fnSrc), 'the lean still measured the plate');
  // evaluated live: the center-top patients the report names keep their
  // glow — the GLOW seat (0.78) sits above every pastel plate (the
  // screen family's carrying light, fixed and brightness-blind now)
  const lean = new Function('return ' + fnSrc.replace('export function', 'function'))();
  const lumOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  // the glow's FIXED 0.78 seat clears the worst center-top plate (the
  // warm #ff9980 at luma 0.68) by a full tenth of light — the carrying
  // light is no longer plate-solved, so the distance is the seat's own
  for (const plate of ['#8080ff', '#9a80ff', '#ff8080', '#ff80ff', '#ff9980']) {
    const t = lean(plate, 0.78);
    const d = lumOf(t) - lumOf(plate);
    assert.ok(d >= 0.09, `${plate}: the pastel glow sat ${d.toFixed(3)} above the plate (needed the lift)`);
  }
  // the bright edge keeps its contrast (white's honest gray at the fixed
  // seat, the sunburst's dark gold — the 1.9.7 cures keep their seats)
  assert.equal(lean('#ffffff'), '#737373', 'white lost its honest gray');
  for (const [plate, minDist] of [['#ffffff', 0.3], ['#ffd400', 0.18], ['#ffff00', 0.2], ['#00ff00', 0.15], ['#ff0000', 0.15], ['#000000', 0.15]]) {
    const dist = Math.abs(lumOf(lean(plate)) - lumOf(plate));
    assert.ok(dist >= minDist, `${plate}: the lean sat ${dist.toFixed(3)} from its plate (needed ${minDist})`);
  }
  // and the quiet seam lives on in the GROUND classes alone (the blend
  // families' own line — the ink's seam retired with the twin)
  assertMatch(ribbon, /if \(lum >= 0\.7\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the ground seam law never spoke');
});

ok('B2 — the grounds follow the twin\'s quiet seam (the pastel band glows)', () => {
  const toneSrc = /export function finishGroundTone[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assertMatch(toneSrc, /if \(lum >= 0\.7\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the seam law never spoke the 0.70 line');
  assertMatch(toneSrc, /return 'gd-fin-ground-dark';/, 'the dark half never spoke');
  // evaluated live: the wheel's own geometry answered
  const tone = new Function('return ' + toneSrc.replace('export function', 'function'))();
  // the center-top pastel band — the report's own seats — glows now
  assert.equal(tone('#8080ff'), 'gd-fin-ground-dark', 'the center-top blue flipped at the old 0.5 seam');
  assert.equal(tone('#9a80ff'), 'gd-fin-ground-dark', 'the center-top purple flipped at the old 0.5 seam');
  assert.equal(tone('#ff8080'), 'gd-fin-ground-dark', 'the center-top red flipped at the old 0.5 seam');
  // the pure hues keep their 1.9.7 measured seats
  assert.equal(tone('#00ff00'), 'gd-fin-ground-light', 'pure green lost its light seat');
  assert.equal(tone('#00ffff'), 'gd-fin-ground-light gd-fin-ground-bright', 'pure cyan lost its bright seat');
  assert.equal(tone('#ffd400'), 'gd-fin-ground-light gd-fin-ground-bright', 'the yellow cure lost its seat');
  assert.equal(tone('#ffffff'), 'gd-fin-ground-light gd-fin-ground-bright', 'white lost its bright seat');
  assert.equal(tone('#000000'), 'gd-fin-ground-dark', 'black lost its dark seat');
  // the quiet line itself: 0.69 glows, 0.71 speaks the light family
  assert.equal(tone('#a9a9a9'), 'gd-fin-ground-dark', 'a 0.69 gray spoke the light family early');
  assert.equal(tone('#b4b4b4'), 'gd-fin-ground-light', 'a 0.71 gray missed the light family');
});

console.log('\nC. THE PICTURE KEEPS ITS OWN EYE ("as if the background of the finishes actually apply over the image")');

ok('C1 — the pair speaks for every protected picture', () => {
  assertMatch(ribbon, /const pair = onImage && hasImage;/, 'the pair still gated on the split checkbox');
  assertMatch(ribbon, /one\('is-plate-only'\)\}\s*\n\s*\{one\('is-art-zone'\)\}/, 'the complementary twins never rendered');
});

ok('C2 — the art twin speaks the lean\'s own ART seat (1.9.9: hue + saturation at the picture\'s register)', () => {
  assertMatch(
    css,
    /\.gd-card-face-finish\.is-art-zone,\s*\n\.gd-card-face-artfin\.is-art-zone \{\s*\n  --gd-tint-hand: var\(--gd-fin-art, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/,
    'the art twin never spoke the art seat'
  );
});

ok('C3 — the two kept readers carry their own scopes (the flip rules retired)', () => {
  // no ground-rule selector line may speak without the scope
  const badLines = css.split('\n').filter((l) => /^\.gd-fin-ground/.test(l) && !l.includes(':not(.is-art-zone)'));
  assert.deepEqual(badLines, [], `ground rules without the art-zone scope: ${badLines.slice(0, 3).join(' | ')}`);
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the flip rules retired whole —
     the two readers that remain are the X signature's own seats (the
     dark glow ink hand + the light depth pen), both scoped away from
     the art twin; the bright child-seat law retired with the bright
     subclass itself. */
  assert.ok(!css.includes('.gd-fin-ground-bright .gd-card-face-finish:not(.is-art-zone) .gd-foil-ripple'), 'a bright child-seat law survived');
});

ok('C4 — the kept readers keep their words (scoped, not silenced)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the flip stack retired, and the
     two readers that stay speak their whole words — the dark ground's
     GLOW ink seat for the X, and the light ground's depth pen. */
  assertMatch(css, /\.gd-fin-ground-dark \.gd-card-face-finish:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-card-face-artfin:not\(\.is-art-zone\) \{\s*\n  --gd-tint-hand: var\(--gd-fin-glow, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/, 'the dark glow hand lost its seat');
  assertMatch(css, /\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{\s*\n  filter: brightness\(0\.78\) saturate\(1\.05\);\s*\n\}/, 'the X\'s pen lost its seat');
  // the lifts retired with the stack
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/gd-fin-ground(?:-light|-dark)? \.gd-numeix-dapple/.test(cssLaws), 'the bloom lift survived');
});

console.log('\nD. THE GHOST IS A STATIC CARD ("so laggy even when i let go on weaker cpus")');

ok('D1 — the ghost is a detached offscreen clone, not a live seat', () => {
  assertMatch(sidebar, /e\.currentTarget\.querySelector\('\.gd-tree-card'\)/, 'the ghost never found the class card');
  assertMatch(sidebar, /cardEl\.cloneNode\(true\)/, 'the ghost never took its static clone');
  assertMatch(sidebar, /host\.className = 'gd-tree-row gd-tree-ghost';/, 'the offscreen host never took its seat');
  assertMatch(sidebar, /document\.body\.appendChild\(host\);/, 'the offscreen host never seated');
  assertMatch(sidebar, /e\.dataTransfer\.setDragImage\(\s*host,/, 'setDragImage never spoke to the host');
  assertMatch(sidebar, /Math\.max\(10, Math\.min\(16, Math\.round\(r\.width \* 0\.12\)\)\),\s*\n\s*Math\.round\(r\.height \/ 2\)\s*\n\s*\);/, 'the grab point lost its seat');
  // the row's own color law rides the clone through the wrapper
  assertMatch(sidebar, /rowEl\.style\.getPropertyValue\('--cls'\)/, 'the ghost never carried the row\'s color var');
  assertMatch(sidebar, /host\.setAttribute\('data-colored', ''\);/, 'the ghost never carried the colored scope');
});

ok('D2 — the ghost retires with the gesture (every road ends it)', () => {
  assertMatch(sidebar, /const retireGhost = useCallback\(\(\) => \{/, 'the retirement lane never spoke');
  assertMatch(sidebar, /ghostRef\.current = null;/, 'the retirement never cleared its seat');
  assertMatch(sidebar, /host\.parentNode\.removeChild\(host\)/, 'the retirement never left the body');
  // the three roads: dragend, drop, and the unmount sweep
  const endIdx = sidebar.indexOf('const endDrag = () => {');
  const endBlock = sidebar.slice(endIdx, sidebar.indexOf('};', endIdx));
  assertMatch(endBlock, /retireGhost\(\);/, 'dragend never retired the ghost');
  const dropIdx = sidebar.indexOf('const dropOnRow = (e, cls) => {');
  const dropBlock = sidebar.slice(dropIdx, sidebar.indexOf('};', dropIdx));
  assertMatch(dropBlock, /retireGhost\(\);/, 'the drop never retired the ghost');
  assertMatch(sidebar, /\(\) => \(\) => \{\s*\n      retireGhost\(\);\s*\n    \},\s*\n    \[retireGhost\]\s*\n  \);/, 'the unmount never retired the ghost');
});

ok('D3 — the highlight speaks its changes alone (the dragover churn retires)', () => {
  assertMatch(
    sidebar,
    /const setDropIfChanged = useCallback\(\(next\) => \{\s*\n    setDrop\(\(prev\) =>\s*\n      prev && next && prev\.id === next\.id && prev\.zone === next\.zone \? prev : next\s*\n    \);\s*\n  \}, \[\]\);/,
    'the equality bailout never spoke'
  );
  // every object write rides the bailout lane now
  const overIdx = sidebar.indexOf('const overRow = (e, cls) => {');
  const overBlock = sidebar.slice(overIdx, sidebar.indexOf('};', overIdx));
  assert.ok(!/setDrop\(\{ id:/.test(overBlock), 'a raw object write survived in the dragover lane');
  assertMatch(overBlock, /setDropIfChanged\(\{ id: cls\.id, zone: 'inside' \}\);/, 'the card lane never took the bailout');
  assertMatch(overBlock, /setDropIfChanged\(\{ id: cls\.id, zone \}\);/, 'the class lane never took the bailout');
});

ok('D4 — the ghost\'s CSS seat is offscreen and inert', () => {
  const ghost = block(css, '.gd-tree-row.gd-tree-ghost');
  assert.ok(ghost, 'the ghost seat never spoke');
  assertMatch(ghost, /position: fixed;/, 'the ghost never left the flow');
  assertMatch(ghost, /left: -4000px;/, 'the ghost never went offscreen');
  assertMatch(ghost, /pointer-events: none;/, 'the ghost still answered the pointer');
});

console.log('\nE. THE FURNITURE');

ok('E1 — the version is 1.9.8 everywhere', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'package.json drifted');
  const constants = src('src/constants/index.js');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants drifted');
  assertMatch(readme, /\*\*v1\.9\.19\*\* · a local card & prompt-version tracker/, 'the README badge line drifted');
});

ok('E2 — the changelog head tells this story', () => {
  assertMatch(changelog, /## 1\.9\.19 — The Ends Trade Places/, 'the changelog head drifted');
  assertMatch(changelog, /the coat's polarity flips only where the glow has already faded/, 'the changelog summary drifted');
});

ok('E3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the shield drifted');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the battery count drifted');
});

ok('E4 — the battery runner runs this very suite', () => {
  assertMatch(runner, /gendex_199_batch_dom/, 'the runner never welcomed this suite');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('FIX ABOVE');
  process.exit(1);
}
