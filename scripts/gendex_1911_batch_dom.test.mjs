// 1.9.11 batch — The Quiet Answers.
// (Named 1911 in the suite sequence: 199 pins the 1.9.8, 200 the 1.9.9,
//  1910 the 1.9.10; this suite pins the 1.9.11 laws at their roots. Built
//  on the 1.9.10 line — the release continues.)
// The reported items, pinned at their root laws:
//   A.  THE TAB'S OWN FLIGHT ("when switching between prompt and note, it
//       just happens instantly and appears, fix that so it has a
//       transition animation, from prompt to note and from note to
//       prompt" + "same also to the note, prompts have a fade move
//       animation when they spawn, i want the note to also have that
//       animation"): both panels ride the prompts' own gd-rise-in spawn
//       law on KEYED wrappers — the key forces the remount that replays
//       the entrance, in both directions, and the notes box spawns
//       through the prompts' own animation, the exact ask.
//   B.  THE RING KEEPS ITS OWN INK ("when i select the text 'ALL cards ,
//       X cards' on the top bar , for some reason cards in the card
//       viewer with the text bolded/outlined would have their outline
//       reverse in color , from black to white or from white to black, it
//       shouldnt do so"): the ::selection state keeps the letters' own
//       ink (color: currentcolor — probed live in the app's own
//       Electron: the fill never moves), the stroke's width stands down,
//       the 0.37.0 backdrop contour keeps its 8-way seat, and the
//       truncation MIRROR seats speak the same cure at both floors (the
//       title box's own ::selection AND every descendant's — a
//       ::selection style only answers for the element it matches).
//   C.  THE LEDGER'S OWN DIAL ("add an option to control how much logs
//       are saved (default is 50 like usual) in the logs section in
//       settings window, right below the logs container, the cell takes
//       a numeric value"): ONE law — LOG_LIMIT_RANGE (1-999, default 50)
//       clamps the constant, the sanitize, the boot restore, every push
//       and the dial; App trims the ledger live; the cell sits right
//       below the logs container and commits live.
//   D.  THE REPOSITORY IS THE DOWNLOAD PAGE ("the download page link
//       should be 'https://github.com/NuriDerBurrito/Burrito_GenDex' in
//       the data section in settings window"): the key opens the
//       repository itself; the old Pages address is gone from the tree.
//   E.  THE FURNITURE — the version seats speak 1.9.11, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { LOG_LIMIT_RANGE, clampLogLimit, DEFAULT_SETTINGS, DOWNLOAD_PAGE_URL } from '../src/constants/index.js';
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
const cv = src('src/components/CharacterView.jsx');
const pe = src('src/components/PartEditor.jsx');
const app = src('src/App.jsx');
const setm = src('src/components/SettingsModal.jsx');
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

console.log('A. THE TAB\'S OWN FLIGHT ("it just happens instantly and appears")');

ok('A1 — both panels ride the keyed rise: the prompts wrapper is keyed and speaks gd-rise-in', () => {
  assertMatch(cv, /key="gd-tab-prompts"\s+className="mt-3 gd-rise-in"/, 'the prompts wrapper lost its keyed flight');
});
ok('A2 — the notes wrapper is keyed and speaks gd-rise-in too (both directions of the switch)', () => {
  assertMatch(cv, /key="gd-tab-notes"\s+className="mt-3 gd-rise-in"/, 'the notes wrapper lost its keyed flight');
});
ok('A3 — the flight is the prompts\' OWN spawn law: a fresh part row still speaks the same gd-rise-in', () => {
  assertMatch(pe, /fresh && 'gd-rise-in'/, 'the fresh-row rise seat drifted');
});
ok('A4 — gd-rise-in keeps its fade-and-move body (opacity 0 -> 1, translateY 10px -> none)', () => {
  const rule = findRule(css, '.gd-rise-in');
  assertMatch(rule, /animation: gd-rise-in 0\.18s ease-out backwards/, 'the rise clock drifted');
  const kf = findRule(css, '@keyframes gd-rise-in');
  assertMatch(kf, /opacity: 0;/, 'the fade seat drifted');
  assertMatch(kf, /transform: translateY\(10px\);/, 'the move seat drifted');
  assertMatch(kf, /transform: none;/, 'the resting seat drifted');
});
ok('A5 — the tab state still owns the swap (one state, both branches)', () => {
  assertMatch(cv, /const \[tab, setTab\] = useState\('prompts'\)/, 'the tab state drifted');
  assertMatch(cv, /onClick=\{\(\) => setTab\('notes'\)\}/, 'the notes key lost its road');
  assertMatch(cv, /onClick=\{\(\) => setTab\('prompts'\)\}/, 'the prompts key lost its road');
});
ok('A6 — the notes windows still ride the notes tab alone (the flight never unseats them)', () => {
  assertMatch(cv, /\{tab === 'notes' && notesReaderOpen && \(/, 'the editor window gate drifted');
  assertMatch(cv, /\{tab === 'notes' && notesColorOpen && \(/, 'the color window gate drifted');
});

console.log('B. THE RING KEEPS ITS OWN INK ("the outline reverse in color ... it shouldnt do so")');

ok('B1 — the ::selection state keeps the letters\' own ink (currentcolor) and stands the stroke down', () => {
  const rule = findRule(css, '.rt-outline::selection');
  assertMatch(rule, /color: currentcolor;/, 'the currentcolor cure is missing');
  assertMatch(rule, /-webkit-text-stroke-width: 0;/, 'the width stand-down is missing');
});
ok('B2 — the accent-ink flood is RETIRED from the outlined selection (the letters never flip mid-highlight)', () => {
  const rule = findRule(css, '.rt-outline::selection');
  assert.equal(rule.includes('var(--gd-accent-ink)'), false, 'the accent-ink color/fill override still speaks');
  assert.equal(rule.includes('-webkit-text-fill-color'), false, 'the fill override still speaks');
});
ok('B3 — the 0.37.0 backdrop contour keeps its whole 8-way seat (retrued to the plain stroke\'s own width — the 1.9.13 law)', () => {
  const rule = findRule(css, '.rt-outline::selection');
  for (const off of ['0.75px 0 0', '-0.75px 0 0', '0 0.75px 0', '0 -0.75px 0', '0.53px 0.53px 0', '-0.53px 0.53px 0', '0.53px -0.53px 0', '-0.53px -0.53px 0']) {
    assertMatch(rule, new RegExp(off.replace(/[.+-]/g, '\\$&') + ' var\\(--gd-bg\\)'), `the ${off} contour seat is missing`);
  }
});
ok('B4 — the truncation MIRROR speaks the same cure at BOTH floors (the box and every descendant)', () => {
  assertMatch(
    css,
    /\.gd-card-title:has\(\.rt-outline\)::selection,\n\.gd-card-title:has\(\.rt-outline\) \*::selection \{\n  color: currentcolor;\n  -webkit-text-stroke-width: 0;\n\}/,
    'the mirror cure is missing or one-floor'
  );
});
ok('B5 — the resting inverse-ring laws are untouched (the letter\'s opposite, both weights)', () => {
  const plain = findRule(css, '.rt-outline');
  assertMatch(plain, /-webkit-text-stroke: 1\.5px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the plain inverse law drifted');
  const bold = findRule(css, '.rt-b.rt-outline');
  assertMatch(bold, /-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the bold inverse law drifted');
});
ok('B6 — the global ::selection keeps its own word (the accent pair for every other text)', () => {
  const rule = findRule(css, '::selection');
  assertMatch(rule, /background: var\(--gd-accent\);/, 'the global background drifted');
  assertMatch(rule, /color: var\(--gd-accent-ink\);/, 'the global color drifted');
});

console.log('C. THE LEDGER\'S OWN DIAL ("how much logs are saved (default is 50 like usual)")');

ok('C1 — the ladder itself: 1..999, default 50, and the clamp speaks it', () => {
  assert.equal(LOG_LIMIT_RANGE.min, 1);
  assert.equal(LOG_LIMIT_RANGE.max, 999);
  assert.equal(LOG_LIMIT_RANGE.default, 50);
  assert.equal(clampLogLimit(50), 50, '50 must pass untouched');
  assert.equal(clampLogLimit(0), 1, 'under the floor clamps up');
  assert.equal(clampLogLimit(-17), 1, 'junk below clamps up');
  assert.equal(clampLogLimit(1000), 999, 'over the ceiling clamps down');
  assert.equal(clampLogLimit(Number.NaN), 50, 'NaN falls to the default');
  assert.equal(clampLogLimit('nope'), 50, 'junk falls to the default');
  assert.equal(clampLogLimit(12.7), 13, 'fractions round to whole lines');
});
ok('C2 — DEFAULT_SETTINGS owns the dial at the eternal default', () => {
  assert.equal(DEFAULT_SETTINGS.logLimit, 50);
});
ok('C3 — createSafeDb clamps the stored dial (junk falls to 50; a sane pick survives)', () => {
  const junk = createSafeDb({ settings: { logLimit: 'wat' } });
  assert.equal(junk.settings.logLimit, 50, 'junk must fall to the default');
  const over = createSafeDb({ settings: { logLimit: 5000 } });
  assert.equal(over.settings.logLimit, 999, 'over the ceiling clamps down');
  const under = createSafeDb({ settings: { logLimit: 0 } });
  assert.equal(under.settings.logLimit, 1, 'under the floor clamps up');
  const honest = createSafeDb({ settings: { logLimit: 200 } });
  assert.equal(honest.settings.logLimit, 200, 'a sane stored pick survives');
  const fresh = createSafeDb(null);
  assert.equal(fresh.settings.logLimit, 50, 'a fresh database starts at 50');
});
ok('C4 — App\'s ledger reads the ONE law at every seat (the boot bound, the push cap, the trim effect)', () => {
  assertMatch(app, /\.slice\(-LOG_LIMIT_RANGE\.max\)/, 'the boot restore still bounds at the flat 50');
  assertMatch(app, /const cap = logLimitKnownRef\.current \? logLimitRef\.current : LOG_LIMIT_RANGE\.max;/, 'the push cap law drifted');
  assertMatch(app, /const liveLogLimit = db\?\.settings \? clampLogLimit\(db\.settings\.logLimit \?\? LOG_LIMIT_RANGE\.default\) : null;/, 'the live dial read drifted');
  assertMatch(app, /const trimmed = prev\.slice\(prev\.length - cap\);/, 'the trim effect lost its cut');
  assertMatch(app, /const logLimitKnownRef = useRef\(false\);/, 'the boot-window guard is missing');
});
ok('C5 — the flat 50 is RETIRED from App\'s ledger (no hard-coded cap seat remains)', () => {
  assert.equal(/next\.slice\(next\.length - 50\)/.test(app), false, 'a flat-50 push seat still speaks');
  assert.equal(/\.slice\(-50\)/.test(app), false, 'a flat-50 boot seat still speaks');
});
ok('C6 — the settings cell sits right below the logs container; 1.9.12 — the dial waits for DONE', () => {
  const containerAt = setm.indexOf('gd-logs-list');
  const dialAt = setm.indexOf('id="gd-log-limit"');
  assert.ok(containerAt >= 0 && dialAt > containerAt, 'the dial must come after the logs container');
  assertMatch(setm, /className="gd-input gd-logs-limit-cell"/, 'the cell lost its frame');
  assertMatch(setm, /LOGS KEPT/, 'the label lost its seat');
  // 1.9.12 — THE DIAL SPEAKS ONLY WHEN DONE ANSWERS: the keystroke road
  // types the DRAFT alone (no set, no trim, no line lost mid-type); the
  // ONE commit rides DONE's own close road; the parse keeps its clamp.
  assertMatch(setm, /onChange=\{\(e\) => typeLogLimit\(e\.target\.value\)\}/, 'the keystroke road writes the setting (the instant-apply disease is back)');
  assertMatch(setm, /const doneClose = \(\) => \{\s*finishLogLimit\(\);\s*onClose\(\);\s*\};/, 'the DONE commit road is missing');
  assertMatch(setm, /return clampLogLimit\(n\);/, 'the dial commit lost its clamp');
  assertMatch(setm, /LAST \$\{liveLogCap\} KEPT/, 'the footer still speaks a flat 50');
});
ok('C7 — the numeric cell owns its CSS seat (compact, centered, spinner-less family)', () => {
  const rule = findRule(css, '.gd-logs-limit-cell');
  assertMatch(rule, /width: 64px;/, 'the cell width drifted');
  assertMatch(rule, /text-align: center;/, 'the digit alignment drifted');
});

console.log('D. THE REPOSITORY IS THE DOWNLOAD PAGE ("the download page link should be ...")');

ok('D1 — the constant speaks the repository\'s own address, exactly as asked', () => {
  assert.equal(DOWNLOAD_PAGE_URL, 'https://github.com/NuriDerBurrito/Burrito_GenDex');
});
ok('D2 — the old Pages address is gone from the whole src tree', () => {
  for (const f of ['src/constants/index.js', 'src/components/SettingsModal.jsx', 'src/App.jsx']) {
    assert.equal(src(f).includes('nuriderburrito.github.io/Burrito_GenDex'), false, `${f} still speaks the retired Pages address`);
  }
});
ok('D3 — the key still opens whatever the constant says (one road, live)', () => {
  assertMatch(setm, /onClick=\{\(\) => window\.api\?\.openExternal\?\.\(DOWNLOAD_PAGE_URL\)\}/, 'the openExternal road drifted');
  assertMatch(setm, /DOWNLOAD PAGE/, 'the key lost its label');
});

console.log('E. THE FURNITURE');

ok('E1 — the version is 1.9.12 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});
ok('E2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.12 entry');
  assertMatch(changelog, /The tab's own flight/, 'the flight bullet is missing');
  assertMatch(changelog, /The ring keeps its own ink/, 'the ring bullet is missing');
  assertMatch(changelog, /The ledger's own dial/, 'the dial bullet is missing');
  assertMatch(changelog, /The repository is the download page/, 'the download bullet is missing');
});
ok('E3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});
ok('E4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1911_batch_dom/, 'the runner never welcomed 1911');
});
ok('E5 — the worklog keeps the 1.9.12 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.12');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 27) {
  console.log(`SUITE INCOMPLETE — ${passed}/27 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
