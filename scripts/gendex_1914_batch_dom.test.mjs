// 1.9.14 batch — The Shadow Keeps Its Ink.
// (Named 1914 in the suite sequence: 1911 pins the 1.9.11, 1912 the
//  1.9.12, 1913 the 1.9.13; this suite pins the 1.9.14 laws at their
//  roots. Built on the 1.9.13 line — the last release continues.)
// The reported item, pinned at its root law:
//   A.  THE SHADOW KEEPS ITS OWN INK ("its now deleting the shadow under
//       the text of the date and title"): the 1.9.13 contour carried the
//       ring's width and its body weight through the sweep, but its
//       pre-divided copies WASHED at the union's outer quarter (one 0.31
//       copy where three overlapped, against the resting flat 0.66) and
//       composited lighter over every ground behind them — so the
//       under-shadow band beneath the date and the title read half-gone
//       mid-sweep. The contour now speaks the RESTING COMPOSITE itself:
//       each of the eight copies paints the rim's own hue stripped
//       opaque (rgb(from var() r g b / 1) — the parse probed live, this
//       engine KEEPS the origin alpha without the /1) mixed onto the
//       card's own ground at the resting ratio (66% — the dark rim's
//       own alpha; the light voice lands within 8%) — a flat band, no
//       accumulation, the shadow's full darkness on any ground and
//       under any flood (measured after: 16/16 laws, the mid-sweep
//       band's own painted color byte-equal to rest — 168 against 168
//       — the under-shadow pixel-holds: 8519 against 8548 title,
//       6940 against 6926 date, 4721 against 4729 at the real grid
//       scale, the light voice within its 8: 4407 against 4193).
//   B.  THE FAMILY'S OTHER SEATS UNTOUCHED (the runs' contours, the
//       mirror's ink, the resting strokes the contours mirror).
//   C.  THE LIVE PROOF — the ink probe rides the tree (16/16 laws in the
//       app's own Electron: the composite, the flat outer quarter, the
//       width, the under-shadow on the plate and at the real grid
//       scales, the light voice, the label-only control byte-held, the
//       real Ctrl+A, the still-mode stand-down, the runs' carve-out
//       alive, and the PARSE witness that reads the computed
//       ::selection text-shadow itself).
//   D.  THE FURNITURE — the version seats speak 1.9.14, the changelog
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

// top-level rule extraction, the surgery's own law (line-start anchored,
// exactly one match, full text incl. braces)
const findRule = (text, selector) => {
  const anchor = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{';
  const re = new RegExp('^' + anchor, 'gm');
  const spans = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const b = text.indexOf('{', m.index);
    let depth = 1;
    let j = b + 1;
    while (j < text.length && depth) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    spans.push([m.index, j]);
    re.lastIndex = j;
  }
  assert.equal(spans.length, 1, `${selector}: expected 1 top-level rule, found ${spans.length}`);
  return text.slice(spans[0][0], spans[0][1]);
};

const css = src('src/index.css');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');

// 1.9.0 — THE WORKLOG SEAT LEARNS TOLERANCE (the 1912 suite's own law):
// the parent-folder worklog is a sandbox-only seat, so the check reads it
// when present and falls back to the app's own CHANGELOG.
const worklog = (() => {
  try {
    return readFileSync(path.join(root, '..', '..', 'worklog.md'), 'utf8');
  } catch {
    return src('CHANGELOG.md');
  }
})();

console.log('A. THE SHADOW KEEPS ITS OWN INK ("its now deleting the shadow under the text of the date and title")');

ok('A1 — the resting stroke law is untouched (the 1.7px centered stroke the contour must mirror)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp');
  assertMatch(rule, /-webkit-text-stroke: calc\(1\.7px \* var\(--card-scale, 1\)\) var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\);/, 'the resting stroke drifted');
  assertMatch(rule, /paint-order: stroke fill;/, 'the fill lost its top seat');
});
ok('A2 — the straight contour steps keep the stroke outer half (0.85px x card-scale, the 1.9.13 geometry verbatim)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /calc\(0\.85px \* var\(--card-scale, 1\)\) 0 0 color-mix\(in srgb,/, 'the straight steps lost the stroke\'s own width');
  assertMatch(rule, /calc\(-0\.85px \* var\(--card-scale, 1\)\) 0 0 color-mix\(in srgb,/, 'the -x step lost the width');
  assertMatch(rule, /0 calc\(0\.85px \* var\(--card-scale, 1\)\) 0 color-mix\(in srgb,/, 'the +y step lost the width');
  assertMatch(rule, /0 calc\(-0\.85px \* var\(--card-scale, 1\)\) 0 color-mix\(in srgb,/, 'the -y step lost the width');
});
ok('A3 — the diagonal steps keep the uniform reach (0.6px = 0.85 / sqrt(2) — one band width at every angle)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  for (const s of ['0.6px', '-0.6px']) {
    assertMatch(rule, new RegExp(`calc\\(${s.replace('.', '\\.')} \\* var\\(--card-scale, 1\\)\\) calc\\(${s.replace('.', '\\.')} \\* var\\(--card-scale, 1\\)\\) 0 color-mix\\(in srgb,`), `the ${s} diagonal step lost the uniform reach`);
  }
});
ok('A4 — THE COMPOSITE LAW: 8 stops, every one the RESTING COMPOSITE — the rim hue stripped OPAQUE mixed onto the card own ground at the resting ratio', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  const stops = rule.match(/color-mix\(in srgb, rgb\(from var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\) r g b \/ 1\) 66%, var\(--gd-card-tint, var\(--gd-panel\)\)\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 resting-composite stops (found ${stops.length})`);
  assert.equal(rule.includes(') 47%, transparent)'), false, 'a 1.9.13 pre-divided step still speaks (the outer-quarter wash the report caught)');
  assert.equal(rule.includes(') 0 0 var(--gd-fin-ink-outline'), false, 'a full-color 1.9.12 step still speaks (the weight disease)');
});
ok('A5 — THE ALPHA STRIP: every stop speaks the / 1 (this engine KEEPS the origin alpha without it — the raw ink would accumulate 3-deep to 0.96)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  const strips = rule.match(/rgb\(from var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\) r g b \/ 1\)/g) || [];
  assert.equal(strips.length, 8, `every one of the 8 stops must strip the alpha (found ${strips.length})`);
  assertMatch(css, /rgb\(from var\(\) r g b\) KEEPS the origin\s+alpha/, 'the engine-law note lost its seat');
});
ok('A6 — the family laws survive verbatim (the accent flood in the winning rule, the letters own ink, the stand-down)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /background: var\(--gd-accent\);/, 'the accent background lost its seat');
  assertMatch(rule, /color: currentcolor;/, 'the ink law is missing');
  assertMatch(rule, /-webkit-text-stroke-width: 0;/, 'the stroke stand-down is missing');
});
ok('A7 — the still-mode stand-down holds (no contour for an outline that does not exist)', () => {
  const rule = findRule(css, 'html.gd-finishes-still .gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /text-shadow: none;/, 'the still mode conjures a contour');
});
ok('A8 — the arithmetic is the sheet own documented law (the measured disease, the byte-exact composite, the 8% light voice)', () => {
  assertMatch(css, /the outer zone 105\s+against the resting 150/, 'the measured outer-quarter wash lost its seat');
  assertMatch(css, /17\/15\/13 byte-exact against the resting stroke/, 'the byte-exact composite lost its seat');
  assertMatch(css, /the light voice\'s 0\.72\s+lands within 8%/, 'the light voice arithmetic lost its seat');
  assertMatch(css, /the mid-sweep band\'s own painted color reads\s+byte-equal/, 'the flat-band law lost its seat');
});

console.log('B. THE FAMILY OTHER SEATS UNTOUCHED');

ok('B1 — the plain run contour keeps its own width (0.75px / 0.53px, opaque --gd-bg x 8)', () => {
  const rule = findRule(css, '.rt-outline::selection');
  assertMatch(rule, /0\.75px 0 0 var\(--gd-bg\),/, 'the plain straight step lost the stroke\'s own width');
  assertMatch(rule, /0\.53px 0\.53px 0 var\(--gd-bg\),/, 'the plain diagonal step lost the uniform reach');
  const stops = rule.match(/var\(--gd-bg\)/g) || [];
  assert.equal(stops.length, 8, `the plain contour must speak 8 ways (found ${stops.length})`);
});
ok('B2 — the BOLD run keeps its own seat (the 2px stroke fatter band: 1px / 0.71px)', () => {
  const rule = findRule(css, '.rt-b.rt-outline::selection');
  assertMatch(rule, /1px 0 0 var\(--gd-bg\),/, 'the bold straight step lost its band');
  assertMatch(rule, /0\.71px 0\.71px 0 var\(--gd-bg\),/, 'the bold diagonal step lost its band');
  const stops = rule.match(/var\(--gd-bg\)/g) || [];
  assert.equal(stops.length, 8, `the bold contour must speak 8 ways (found ${stops.length})`);
});
ok('B3 — the bold seat sits AFTER the plain seat (the class pair outranks, the order never floats)', () => {
  const plainAt = css.indexOf('.rt-outline::selection {');
  const boldAt = css.indexOf('.rt-b.rt-outline::selection {');
  assert.ok(plainAt >= 0 && boldAt > plainAt, 'the bold contour rule must follow the plain one in source');
});
ok('B4 — the resting strokes the contours mirror are untouched (1.5px plain, 2px bold)', () => {
  const plain = findRule(css, '.rt-outline');
  assertMatch(plain, /-webkit-text-stroke: 1\.5px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the plain inverse law drifted');
  const bold = findRule(css, '.rt-b.rt-outline');
  assertMatch(bold, /-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the bold inverse law drifted');
});
ok('B5 — the truncation mirror keeps its ink law (the 1.9.11 family, verbatim)', () => {
  const mirror = findRule(css, '.gd-card-title:has(.rt-outline) *::selection');
  assertMatch(mirror, /color: currentcolor;/, 'the mirror lost its ink law');
  assertMatch(mirror, /-webkit-text-stroke-width: 0;/, 'the mirror lost its stand-down');
});

console.log('C. THE LIVE PROOF (the ink probe, in the app\'s own Electron)');

ok('C1 — the ink probe rides the tree with the whole verdict road', () => {
  const probe = readFileSync(path.join(root, 'probe_rim_ink_1914.cjs'), 'utf8');
  assertMatch(probe, /verdict: \$\{verdicts\.length - bad\}\/\$\{verdicts\.length\} laws hold/, 'the probe lost its verdict road');
  for (const gate of ['CURE COMPOSITE', 'CURE FLAT', 'CURE WIDTH', 'UNDER-SHADOW', 'LIGHT VOICE', 'GRID SCALE']) {
    assertMatch(probe, new RegExp(gate.replace(' ', ' ')), `the ${gate} gate is missing`);
  }
});
ok('C2 — the probe measures the report own seats and gestures (title + date on the real composite, the real grid scale, sweep + real Ctrl+A, the label-only control, the still mode)', () => {
  const probe = readFileSync(path.join(root, 'probe_rim_ink_1914.cjs'), 'utf8');
  assertMatch(probe, /'titleA', 'metaA', 'runP', 'runK', 'titleD', 'metaD', 'titleF', 'metaF', 'titleS', 'metaS'/, 'the seat family lost its boxes');
  assertMatch(probe, /sendInputEvent/, 'the real Ctrl+A lost its road');
  assertMatch(probe, /label-only/, 'the control phase is missing');
  assertMatch(probe, /gd-finishes-still/, 'the still-mode phase is missing');
});
ok('C3 — THE PARSE WITNESS: the probe reads the computed ::selection text-shadow itself (a dead parse would kill the ring outright)', () => {
  const probe = readFileSync(path.join(root, 'probe_rim_ink_1914.cjs'), 'utf8');
  assertMatch(probe, /getComputedStyle\(el, '::selection'\)/, 'the computed-style witness lost its seat');
  assertMatch(probe, /PARSE: rgb\(from var\(\) r g b\) resolves/, 'the parse verdict lost its word');
  const parseProbe = readFileSync(path.join(root, 'probe_parse_1914.cjs'), 'utf8');
  assertMatch(parseProbe, /r g b \/ 1\);/, 'the alpha-strip parse rig lost its seat');
  assertMatch(parseProbe, /color-mix\(in srgb, rgb\(from var\(--gd-fin-ink-outline\) r g b \/ 1\) 66%/, 'the mixed-ink parse rig lost its seat');
});
ok('C4 — the parse rig rides the tree too (the byte-exact composite it proved: 17/15/13 against the resting stroke own composite)', () => {
  const parseProbe = readFileSync(path.join(root, 'probe_parse_1914.cjs'), 'utf8');
  assertMatch(parseProbe, /PARSE RESULTS/, 'the rig lost its verdict road');
});

console.log('D. THE FURNITURE');

ok('D1 — the version is 1.9.14 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  const consts = src('src/constants/index.js');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});
ok('D2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.14 entry');
  assertMatch(changelog, /The under-shadow keeps its own ink through the sweep/, 'the under-shadow bullet is missing');
});
ok('D3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});
ok('D4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1914_batch_dom/, 'the runner never welcomed 1914');
});
ok('D5 — the worklog keeps the 1.9.14 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.14');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
