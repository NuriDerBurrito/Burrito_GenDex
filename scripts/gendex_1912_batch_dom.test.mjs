// 1.9.12 batch — The Resting State.
// (Named 1912 in the suite sequence: 199 pins the 1.9.8, 200 the 1.9.9,
//  1910 the 1.9.10, 1911 the 1.9.11; this suite pins the 1.9.12 laws at
//  their roots. Built on the 1.9.11 line — the last release continues.)
// The reported items, pinned at their root laws:
//   A.  THE DIAL WAITS FOR THE OKAY ("when changing how many lines the
//       log should contain it activates instantly, it shouldnt do that
//       it should only update after i press on okay, since currently if
//       i type 60, it applies 6 first and deletes the rest"): the field
//       is a pure draft — no keystroke writes the setting, nothing trims,
//       nothing is lost mid-type; the ONE commit is DONE's own close
//       road (Enter in the cell rides it too), the blur normalizes the
//       field without writing, and ESC / CANCEL never see the draft.
//   B.  THE RIM SURVIVES THE SWEEP ("when i select 'ALL cards , x cards'
//       on top bar still, it removes the outline around the date and the
//       title of the cards in the cards viewer"): the finish rim's four
//       seats speak the 1.9.11 selection law at both floors — the
//       letters keep their own ink, the stroke stands down, and the
//       rim's own color carries the ring through the highlight as an
//       8-way text-shadow contour (retrued at the stroke's own width and
//       weight by the 1.9.13 law — the ring you wear at rest is the ring
//       you keep mid-selection; the
//       engine never paints a text stroke inside a selection — proven
//       live with a magenta witness in the app's own Electron, 13/13
//       laws: the stroke dead at 0 pixels, the contour painted in its
//       seat, the fill never moving, the label-only control
//       byte-identical, the still mode conjuring nothing).
//   C.  THE STILL WALL IS THE DEFAULT ("the live drag previews option
//       default should be off"): fresh databases hold the wall still
//       through a drag; every read speaks the === true polarity so a
//       missing key never previews; a stored choice keeps its own.
//   D.  THE PRESS SPEAKS ONLY WHEN ASKED ("add an option for the
//       squish/stretch animation when clicking on a card in settings,
//       the option should allow to either (squish (current) / pulse /
//       none) with the default being none (meaning also add a pulse
//       animation)"): PRESS ANIMATION joins Settings → Cards — the
//       jelly, the new bloom, or silence (the default); the dial rides
//       the root-attribute lane the shine family speaks, the flights
//       key on it in CSS, and the grid's own arm gate reads it so
//       'none' never even arms.
//   E.  THE FURNITURE — the version seats speak 1.9.12, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/constants/index.js';
import { createSafeDb } from '../src/utils/helpers.js';

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
const app = src('src/App.jsx');
const setm = src('src/components/SettingsModal.jsx');
const gv = src('src/components/GridView.jsx');
const consts = src('src/constants/index.js');
const helpers = src('src/utils/helpers.js');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');

// 1.9.0 — THE WORKLOG SEAT LEARNS TOLERANCE: the parent-folder worklog is
// a sandbox-only seat (it never ships inside the zip), so the check reads
// it when present and falls back to the app's own CHANGELOG (which keeps
// every version's entry) — the worklog assertion holds in both seats.
const worklog = (() => {
  try {
    return readFileSync(path.join(root, '..', '..', 'worklog.md'), 'utf8');
  } catch {
    return src('CHANGELOG.md');
  }
})();

console.log('A. THE DIAL WAITS FOR THE OKAY ("it activates instantly ... it applies 6 first and deletes the rest")');

ok('A1 — the keystroke road types the DRAFT alone (no set, no trim, no line lost mid-type)', () => {
  assertMatch(setm, /const typeLogLimit = \(raw\) => \{\s*setLogLimitDraft\(raw\);\s*\};/, 'the draft road drifted');
  const road = setm.slice(setm.indexOf('const typeLogLimit'), setm.indexOf('const parseLogLimitDraft'));
  assert.equal(/set\(|onChange\(/.test(road), false, 'the keystroke road still writes the setting');
});
ok('A2 — the ONE commit rides DONE\'s own close road (finishLogLimit before onClose)', () => {
  assertMatch(setm, /const doneClose = \(\) => \{\s*finishLogLimit\(\);\s*onClose\(\);\s*\};/, 'the DONE commit road is missing');
  assertMatch(setm, /const finishLogLimit = \(\) => \{\s*const clamped = parseLogLimitDraft\(\);\s*if \(clamped != null && clamped !== liveLogCap\) set\('logLimit', clamped\);\s*\};/, 'the commit road lost its one-law shape');
});
ok('A3 — the parse keeps the ladder\'s clamp (junk and empty commit nothing)', () => {
  assertMatch(setm, /const parseLogLimitDraft = \(\) => \{\s*const trimmed = String\(logLimitDraft \?\? ''\)\.trim\(\);\s*if \(!trimmed\) return null;.*?return clampLogLimit\(n\);/s, 'the parse road drifted');
});
ok('A4 — the blur normalizes the field WITHOUT writing (normalizing is not committing)', () => {
  assertMatch(setm, /const normalizeLogLimit = \(\) => \{\s*const clamped = parseLogLimitDraft\(\);\s*setLogLimitDraft\(clamped != null \? String\(clamped\) : String\(liveLogCap\)\);\s*\};/, 'the blur road drifted');
  const road = setm.slice(setm.indexOf('const normalizeLogLimit'), setm.indexOf('// 0.26.0'));
  assert.equal(/set\(/.test(road), false, 'the blur road writes the setting');
});
ok('A5 — Enter inside the cell rides the same DONE road', () => {
  assertMatch(setm, /onKeyDown=\{\(e\) => \{\s*\/\/ Enter inside the cell is a DONE in the owner's\s*\/\/ hand.*?if \(e\.key === 'Enter'\) \{\s*e\.preventDefault\(\);\s*doneClose\(\);\s*\}/s, 'the Enter road drifted');
});
ok('A6 — a pending draft speaks through the DONE key\'s own dirty law', () => {
  assertMatch(setm, /const dirty =\s*useMemo\(\(\) => normSettings\(settings\) !== normSettings\(initial\), \[settings, initial\]\) \|\|[\s\S]*?logLimitPending\(\);/, 'the dirty flag forgot the pending draft');
});
ok('A7 — CANCEL reverts only LANDED changes (the draft dies un-landed)', () => {
  assertMatch(setm, /const cancel = \(\) => \{[\s\S]*?if \(landedDirty\) onRevert\(initial\);\s*onClose\(\);\s*\};/, 'the cancel road drifted');
  assertMatch(setm, /const landedDirty = useMemo\(\(\) => normSettings\(settings\) !== normSettings\(initial\), \[settings, initial\]\);/, 'the landed-dirty seat is missing');
});
ok('A8 — the field and its titles speak the commit law (lands only on DONE)', () => {
  assertMatch(setm, /onChange=\{\(e\) => typeLogLimit\(e\.target\.value\)\}/, 'the field still commits live');
  assertMatch(setm, /onBlur=\{normalizeLogLimit\}/, 'the blur road lost its seat');
  assertMatch(setm, /— lands only on DONE/, 'the field title lost the commit law');
  assertMatch(setm, /LAST \$\{liveLogCap\} KEPT/, 'the footer count lost the committed cap');
});

console.log('B. THE RIM SURVIVES THE SWEEP ("it removes the outline around the date and the title")');

ok('B1 — the rim cure speaks at all four seats, both floors', () => {
  assertMatch(css, /\.gd-has-finish \.gd-card-title::selection,/, 'the title seat is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-meta::selection,/, 'the meta (date) seat is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-vers-badge::selection,/, 'the badge seat is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-stamp::selection,/, 'the stamp seat is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-title \*:not\(\.rt-outline\)::selection,/, 'the title descendant floor is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-meta \*:not\(\.rt-outline\)::selection,/, 'the meta descendant floor is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-vers-badge \*:not\(\.rt-outline\)::selection,/, 'the badge descendant floor is missing');
  assertMatch(css, /\.gd-has-finish \.gd-card-stamp \*:not\(\.rt-outline\)::selection \{/, 'the stamp descendant floor is missing');
});
ok('B2 — the letters keep their own ink and the stroke stands down (the 1.9.11 law, verbatim)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /color: currentcolor;/, 'the ink law is missing');
  assertMatch(rule, /-webkit-text-stroke-width: 0;/, 'the stroke stand-down is missing');
});
ok('B3 — the rim\'s own color carries the ring through the highlight, at the STROKE\'s own width and weight (the 1.9.13 retrue)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\)/, 'the contour lost the rim\'s own color');
  assertMatch(rule, /calc\(0\.85px \* var\(--card-scale, 1\)\) 0 0 color-mix\(in srgb,/, 'the straight contour steps lost the stroke\'s outer half');
  assertMatch(rule, /calc\(0\.6px \* var\(--card-scale, 1\)\) calc\(0\.6px \* var\(--card-scale, 1\)\) 0 color-mix\(in srgb,/, 'the diagonal contour steps lost the uniform reach');
  const stops = rule.match(/color-mix\(in srgb, rgb\(from var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\) r g b \/ 1\) 66%, var\(--gd-card-tint, var\(--gd-panel\)\)\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 ways at the resting composite (found ${stops.length})`);
});
ok('B4 — the accent flood is declared in the winning rule (the engine takes the seat whole — one voice with the runs)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /background: var\(--gd-accent\);/, 'the accent background lost its seat');
});
ok('B5 — the outline FORMAT\'s runs are scoped OUT (their own cure keeps its contour, retrued to its own width)', () => {
  const runRule = findRule(css, '.rt-outline::selection');
  assertMatch(runRule, /background: var\(--gd-accent\);/, 'the run cure lost its background');
  assertMatch(runRule, /color: currentcolor;/, 'the run cure lost its ink law');
  assertMatch(runRule, /-webkit-text-stroke-width: 0;/, 'the run cure lost its stand-down');
  assertMatch(runRule, /0\.75px 0 0 var\(--gd-bg\),/, 'the run cure lost its backdrop contour');
  const boldRule = findRule(css, '.rt-b.rt-outline::selection');
  assertMatch(boldRule, /1px 0 0 var\(--gd-bg\),/, 'the bold run lost its own fatter contour');
  const mirror = findRule(css, '.gd-card-title:has(.rt-outline) *::selection');
  assertMatch(mirror, /color: currentcolor;/, 'the mirror lost its ink law');
});
ok('B6 — LIVING FINISHES off: the contour stands down with the stroke it replaces', () => {
  const rule = findRule(css, 'html.gd-finishes-still .gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /text-shadow: none;/, 'the still mode conjures a contour for an outline that is not there');
});
ok('B7 — the global ::selection keeps its own word for every other text', () => {
  const rule = findRule(css, '::selection');
  assertMatch(rule, /background: var\(--gd-accent\);/, 'the global background drifted');
  assertMatch(rule, /color: var\(--gd-accent-ink\);/, 'the global ink drifted');
});
ok('B8 — the live proof rides the tree (the magenta-witness probe, 13/13 laws)', () => {
  const probe = readFileSync(path.join(root, 'probe_sel_rim_1912.cjs'), 'utf8');
  assertMatch(probe, /13\/13 laws hold|verdict: \$\{verdicts\.length - bad\}/, 'the probe lost its verdict road');
  assertMatch(probe, /#ff00ff/, 'the magenta witness lost its color');
  assertMatch(probe, /gd-finishes-still/, 'the probe lost the still-mode phase');
});

console.log('C. THE STILL WALL IS THE DEFAULT ("the live drag previews option default should be off")');

ok('C1 — the default is OFF at the constant', () => {
  assert.equal(DEFAULT_SETTINGS.liveDragPreview, false, 'the default must be OFF');
});
ok('C2 — createSafeDb keeps a stored choice; junk and fresh databases rest at OFF', () => {
  const stored = createSafeDb({ settings: { liveDragPreview: true } });
  assert.equal(stored.settings.liveDragPreview, true, 'a stored ON must survive (the house law)');
  const storedOff = createSafeDb({ settings: { liveDragPreview: false } });
  assert.equal(storedOff.settings.liveDragPreview, false, 'a stored OFF must survive');
  const junk = createSafeDb({ settings: { liveDragPreview: 'wat' } });
  assert.equal(junk.settings.liveDragPreview, false, 'junk must fall to the default');
  const fresh = createSafeDb(null);
  assert.equal(fresh.settings.liveDragPreview, false, 'a fresh database never previews');
});
ok('C3 — App passes the === true polarity (a missing key never previews)', () => {
  assertMatch(app, /liveDragPreview=\{db\?\.settings\?\.liveDragPreview === true\}/, 'the App seat kept the old polarity');
});
ok('C4 — the settings switch reads and toggles the === true polarity', () => {
  assertMatch(setm, /settings\.liveDragPreview === true && 'is-on'/, 'the switch lost its polarity');
  assertMatch(setm, /set\('liveDragPreview', settings\.liveDragPreview !== true\)/, 'the toggle lost its polarity');
});
ok('C5 — the grid prop\'s fallback rests at the still wall', () => {
  assertMatch(gv, /liveDragPreview = false,/, 'the grid fallback still previews');
});

console.log('D. THE PRESS SPEAKS ONLY WHEN ASKED ("squish (current) / pulse / none, the default being none")');

ok('D1 — the dial owns its ladder (default none; junk and pre-1.9.12 saves rest silent)', () => {
  assert.equal(DEFAULT_SETTINGS.cardPressAnim, 'none', 'the default must be silence');
  const squish = createSafeDb({ settings: { cardPressAnim: 'squish' } });
  assert.equal(squish.settings.cardPressAnim, 'squish', 'a stored squish must survive');
  const pulse = createSafeDb({ settings: { cardPressAnim: 'pulse' } });
  assert.equal(pulse.settings.cardPressAnim, 'pulse', 'a stored pulse must survive');
  const junk = createSafeDb({ settings: { cardPressAnim: 'jelly' } });
  assert.equal(junk.settings.cardPressAnim, 'none', 'junk must fall to silence');
  const fresh = createSafeDb(null);
  assert.equal(fresh.settings.cardPressAnim, 'none', 'a fresh database rests silent');
});
ok('D2 — App arms the root attribute the CSS and the arm gate both read', () => {
  assertMatch(app, /if \(db\.settings\.cardPressAnim === 'squish' \|\| db\.settings\.cardPressAnim === 'pulse'\) \{\s*document\.documentElement\.dataset\.gdPressMode = db\.settings\.cardPressAnim;\s*\} else \{\s*delete document\.documentElement\.dataset\.gdPressMode;\s*\}/s, 'the root-attribute lane drifted');
  assertMatch(app, /db\?\.settings\?\.cardPressAnim,/, 'the effect deps forgot the dial');
});
ok('D3 — the flights key on the dial (the jelly verbatim; the bare attribute rule is RETIRED)', () => {
  assertMatch(css, /html\[data-gd-press-mode='squish'\] \.gd-card-pulse\[data-pressed\] \{\s*animation: gd-press-pulse 620ms ease-in-out both;\s*\}/s, 'the jelly flight lost its dial seat');
  assertMatch(css, /html\[data-gd-press-mode='pulse'\] \.gd-card-pulse\[data-pressed\] \{\s*animation: gd-press-bloom 380ms ease-out both;\s*\}/s, 'the bloom flight lost its dial seat');
  assert.equal(/^\.gd-card-pulse\[data-pressed\] \{/m.test(css), false, 'the unattributed flight rule still speaks (none would fly)');
});
ok('D4 — THE BLOOM is born: one uniform swell, compositor-only, the same scale property', () => {
  const rule = findRule(css, '@keyframes gd-press-bloom');
  assertMatch(rule, /scale: 1\.05 1\.05;/, 'the bloom lost its swell');
  assertMatch(rule, /scale: 1 1;/, 'the bloom lost its home');
  assert.equal(rule.includes('transform'), false, 'the bloom must speak the scale property, not transform');
});
ok('D5 — the arm gate reads the dial: none never even arms (both grid seats)', () => {
  const seats = gv.split('const pressMode = () => {').length - 1;
  assert.equal(seats, 2, `the arm gate must live at both seats (found ${seats})`);
  assertMatch(gv, /return mode === 'squish' \|\| mode === 'pulse' \? mode : 'none';/, 'the gate lost its ladder');
  assertMatch(gv, /if \(pressMode\(\) === 'none'\) return; \/\/ the dial's silence is the arm's own/, 'the gate lost its stand-down');
});
ok('D6 — the retirement handler answers BOTH flight names (both grid seats)', () => {
  const both = gv.split("e.animationName === 'gd-press-pulse' || e.animationName === 'gd-press-bloom'").length - 1;
  assert.equal(both, 2, `both seats must retire either flight (found ${both})`);
});
ok('D7 — Settings → Cards carries the PRESS ANIMATION dial (Squish / Pulse / None)', () => {
  assertMatch(setm, /title="PRESS ANIMATION"/, 'the dial lost its title');
  assertMatch(setm, /id: 'squish', label: 'Squish'/, 'the squish voice is missing');
  assertMatch(setm, /id: 'pulse', label: 'Pulse'/, 'the pulse voice is missing');
  assertMatch(setm, /id: 'none', label: 'None'/, 'the none voice is missing');
  assertMatch(setm, /value=\{\['squish', 'pulse', 'none'\]\.includes\(settings\.cardPressAnim\) \? settings\.cardPressAnim : 'none'\}/, 'the dial lost its default law');
  assertMatch(setm, /onPick=\{\(id\) => set\('cardPressAnim', id\)\}/, 'the dial lost its pick road');
});

console.log('E. THE FURNITURE');

ok('E1 — the version is 1.9.12 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});
ok('E2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.12 entry');
  assertMatch(changelog, /The dial waits for the okay/, 'the dial bullet is missing');
  assertMatch(changelog, /The rim survives the sweep/, 'the rim bullet is missing');
  assertMatch(changelog, /The still wall is the default/, 'the still-wall bullet is missing');
  assertMatch(changelog, /The press speaks only when asked/, 'the press bullet is missing');
});
ok('E3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});
ok('E4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1912_batch_dom/, 'the runner never welcomed 1912');
});
ok('E5 — the worklog keeps the 1.9.12 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.12');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 33) {
  console.log(`SUITE INCOMPLETE — ${passed}/33 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
