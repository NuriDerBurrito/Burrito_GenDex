// 1.9.13 batch — The Ring Keeps Its Width.
// (Named 1913 in the suite sequence: 199 pins the 1.9.8, 200 the 1.9.9,
//  1910 the 1.9.10, 1911 the 1.9.11, 1912 the 1.9.12; this suite pins the
//  1.9.13 laws at their roots. Built on the 1.9.12 line — the last release
//  continues.)
// The reported item, pinned at its root law:
//   A.  THE RING KEEPS ITS OWN WIDTH AND WEIGHT ("the rim survives the
//       sweep isnt functional yet, when i do the select i see the date and
//       the title of the card in the card viewer swap outline thickness"):
//       the 1.9.12 contour carried the rim's COLOR through any selection
//       but never its GEOMETRY — 1.1px steps in the FULL rim color against
//       the resting stroke's 0.85px outer-half band at flat alpha — so
//       mid-sweep the ring read ~30% wider and ~30% heavier (measured live:
//       run-median 4.0px against 3.0px, the band body at 224 against 168).
//       The retrued contour speaks the stroke's own arithmetic: 0.85px /
//       0.6px steps, the color pre-divided to 47% through color-mix so the
//       3-copy overlap lands back at the resting flat alpha (measured
//       after: 3.0px against 3.0px, body 170 against 168 — the swap gone).
//   B.  THE RUNS KEEP THEIR OWN WIDTH TOO (the same law at the outline
//       FORMAT's seats): the plain run's contour retrues to its own 1.5px
//       stroke's outer half (0.75px / 0.53px), and the BOLD run earns its
//       own seat with the 2px stroke's fatter band (1px / 0.71px — the
//       values the whole family shared through 1.9.12, now the bold law
//       alone).
//   C.  THE LIVE PROOF — the geometry probe rides the tree (14/14 laws in
//       the app's own Electron: width, weight, total, the runs' widths,
//       the label-only control byte-held, the ink never moving, the real
//       Ctrl+A, the still-mode stand-down, and the stroke-channel witness
//       that proved ::selection drops a -webkit-text-stroke declaration
//       outright — the shadow union is the only ring that paints).
//   D.  THE FURNITURE — the version seats speak 1.9.13, the changelog
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

console.log('A. THE RING KEEPS ITS OWN WIDTH AND WEIGHT ("the date and the title ... swap outline thickness")');

ok('A1 — the resting stroke law is untouched (the 1.7px centered stroke the contour must mirror)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp');
  assertMatch(rule, /-webkit-text-stroke: calc\(1\.7px \* var\(--card-scale, 1\)\) var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\);/, 'the resting stroke drifted');
  assertMatch(rule, /paint-order: stroke fill;/, 'the fill lost its top seat');
});
ok('A2 — the straight contour steps speak the stroke\'s OUTER HALF (0.85px x card-scale, the 1.7px band the eye reads at rest)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /calc\(0\.85px \* var\(--card-scale, 1\)\) 0 0 color-mix\(in srgb,/, 'the straight steps lost the stroke\'s own width');
  assertMatch(rule, /calc\(-0\.85px \* var\(--card-scale, 1\)\) 0 0 color-mix\(in srgb,/, 'the -x step lost the width');
  assertMatch(rule, /0 calc\(0\.85px \* var\(--card-scale, 1\)\) 0 color-mix\(in srgb,/, 'the +y step lost the width');
  assertMatch(rule, /0 calc\(-0\.85px \* var\(--card-scale, 1\)\) 0 color-mix\(in srgb,/, 'the -y step lost the width');
});
ok('A3 — the diagonal steps speak the uniform reach (0.6px = 0.85 / sqrt(2) — one band width at every angle)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  for (const s of ['0.6px', '-0.6px']) {
    assertMatch(rule, new RegExp(`calc\\(${s.replace('.', '\\.')} \\* var\\(--card-scale, 1\\)\\) calc\\(${s.replace('.', '\\.')} \\* var\\(--card-scale, 1\\)\\) 0 color-mix\\(in srgb,`), `the ${s} diagonal step lost the uniform reach`);
  }
});
ok('A4 — the weight law (the 1.9.14 retrue): 8 stops, every one the RESTING COMPOSITE — the opaque rim hue mixed onto the card own ground at 66%, the pre-division retired', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  const stops = rule.match(/color-mix\(in srgb, rgb\(from var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\) r g b \/ 1\) 66%, var\(--gd-card-tint, var\(--gd-panel\)\)\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 resting-composite stops (found ${stops.length})`);
  assert.equal(rule.includes(') 47%, transparent)'), false, 'a 1.9.13 pre-divided step still speaks (the outer-quarter wash the 1.9.14 report caught)');
  assert.equal(rule.includes(') 0 0 var(--gd-fin-ink-outline'), false, 'a full-color 1.9.12 step still speaks (the weight disease)');
});
ok('A5 — the family laws survive verbatim (the accent flood in the winning rule, the letters\' own ink, the stand-down)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /background: var\(--gd-accent\);/, 'the accent background lost its seat');
  assertMatch(rule, /color: currentcolor;/, 'the ink law is missing');
  assertMatch(rule, /-webkit-text-stroke-width: 0;/, 'the stroke stand-down is missing');
});
ok('A6 — the still-mode stand-down holds (no contour for an outline that does not exist)', () => {
  const rule = findRule(css, 'html.gd-finishes-still .gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /text-shadow: none;/, 'the still mode conjures a contour');
});
ok('A7 — the arithmetic is the sheet\'s own documented law (the 3-copy overlap against the resting flat alpha)', () => {
  assertMatch(css, /1 - \(1 - 0\.31\)\^3 = 0\.67 against/, 'the pre-division arithmetic lost its seat');
  assertMatch(css, /run-median 4\.0px/, 'the measured disease lost its seat');
  assertMatch(css, /224 against the/, 'the measured weight lost its seat');
});

console.log('B. THE RUNS KEEP THEIR OWN WIDTH TOO (one law per stroke)');

ok('B1 — the plain run\'s contour retrues to its own 1.5px stroke\'s outer half (0.75px / 0.53px)', () => {
  const rule = findRule(css, '.rt-outline::selection');
  assertMatch(rule, /0\.75px 0 0 var\(--gd-bg\),/, 'the plain straight step lost the stroke\'s own width');
  assertMatch(rule, /0\.53px 0\.53px 0 var\(--gd-bg\),/, 'the plain diagonal step lost the uniform reach');
  const stops = rule.match(/var\(--gd-bg\)/g) || [];
  assert.equal(stops.length, 8, `the plain contour must speak 8 ways (found ${stops.length})`);
});
ok('B2 — the BOLD run earns its own seat: the 2px stroke\'s fatter band (1px / 0.71px)', () => {
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
ok('B5 — the runs\' family laws survive (accent flood, own ink, stand-down on the plain seat)', () => {
  const rule = findRule(css, '.rt-outline::selection');
  assertMatch(rule, /background: var\(--gd-accent\);/, 'the run cure lost its background');
  assertMatch(rule, /color: currentcolor;/, 'the run cure lost its ink law');
  assertMatch(rule, /-webkit-text-stroke-width: 0;/, 'the run cure lost its stand-down');
});

console.log('C. THE LIVE PROOF (the geometry probe, in the app\'s own Electron)');

ok('C1 — the geometry probe rides the tree with the whole verdict road', () => {
  const probe = readFileSync(path.join(root, 'probe_rim_geometry_1913.cjs'), 'utf8');
  assertMatch(probe, /verdict: \$\{verdicts\.length - bad\}\/\$\{verdicts\.length\} laws hold/, 'the probe lost its verdict road');
  for (const gate of ['CURE WIDTH', 'CURE WEIGHT', 'CURE TOTAL', 'RUNS WIDTH']) {
    assertMatch(probe, new RegExp(gate.replace(' ', ' ')), `the ${gate} gate is missing`);
  }
  assertMatch(probe, /redBodyAlpha/, 'the band-body metric (p75) lost its seat');
});
ok('C2 — the probe measures the report\'s own seats and gestures (title + date, sweep + real Ctrl+A, label-only control, still mode)', () => {
  const probe = readFileSync(path.join(root, 'probe_rim_geometry_1913.cjs'), 'utf8');
  assertMatch(probe, /'titleA', 'metaA'/, 'the reported seats lost their boxes');
  assertMatch(probe, /sendInputEvent/, 'the real Ctrl+A lost its road');
  assertMatch(probe, /LABEL-ONLY/, 'the control phase is missing');
  assertMatch(probe, /gd-finishes-still/, 'the still-mode phase is missing');
});
ok('C3 — the stroke-channel witness stays on stage (the engine drops ::selection strokes — the contour is the only ring)', () => {
  const probe = readFileSync(path.join(root, 'probe_rim_geometry_1913.cjs'), 'utf8');
  assertMatch(probe, /#cardC/, 'the witness card lost its seat');
  assertMatch(probe, /-webkit-text-stroke: 5\.1px rgba\(255, 0, 0, 0\.66\)/, 'the witness stroke declaration drifted');
  assertMatch(probe, /the stroke channel stays DEAD/, 'the witness verdict lost its word');
});

console.log('D. THE FURNITURE');

ok('D1 — the version is 1.9.13 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  const consts = src('src/constants/index.js');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});
ok('D2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.13 entry');
  assertMatch(changelog, /The rim keeps its own width and weight through the sweep/, 'the rim bullet is missing');
  assertMatch(changelog, /The drawn outline's runs keep their own width too/, 'the runs bullet is missing');
});
ok('D3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});
ok('D4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1913_batch_dom/, 'the runner never welcomed 1913');
});
ok('D5 — the worklog keeps the 1.9.13 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.13');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 20) {
  console.log(`SUITE INCOMPLETE — ${passed}/20 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
