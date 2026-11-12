// 1.8.1 batch — The Soft Chrome.
// (Named 182 in the sequence: 181 pins the 1.8.0 laws; this suite pins
//  the 1.8.1 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE ("the well is better ,
//       but the outline of the resizing box outline isnt good, its not
//       fitting the container style , fix that")
//   B.  THE I-BEAM RETURNS TO THE TEXT ("when hovering over text inside
//       note/prompt area, the cursor keeps on the normal cursor instead
//       of the I-beam and such , i just wanted the i beam to be on the
//       text but not on the scrollbar/resize box, you know what i mean?")
//   C.  THE TITLE SPEAKS ONCE ("remove the two 'reassign keys' inside
//       the keybinds area (one is a title separator the other is a
//       container one , remove whichever one so the other one fits with
//       the rest)")
//   D.  HELP TEXT JOINS THE APP KEYS ("add a help text switch on the top
//       toolbar next to the tooltips option and side panel and bottom
//       panel option")
//   E.  THE PULL FADES ("lastly when dragging cards around , have a
//       faded effect on the preview pull (the one following the cursor),
//       so it doesnt block or get confusing")
// Plus the version furniture (1.8.1 everywhere).

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

const css = src('src/index.css');
const grid = src('src/components/GridView.jsx');
const settings = src('src/components/SettingsModal.jsx');
const titlebar = src('src/components/Titlebar.jsx');
const app = src('src/App.jsx');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');
const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');

const gripRule = () => {
  // the FIRST ::-webkit-resizer literal is the cursor group (no geometry
  // inside its braces); the grip's own rule is the one that speaks the
  // gradient.
  const m = /\.gd-prompt-box::-webkit-resizer \{[^}]*repeating-linear-gradient\([^}]*\}/.exec(cssLaws);
  return m?.[0] || '';
};

console.log('\nA. THE GRIP SPEAKS THE CAPSULE\'S OWN TONGUE ("its not fitting the container style")');
ok('A1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.1 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');
});
ok('A2 — no drawn border survives on any resizer seat (the frame retires)', () => {
  assert.ok(!/::-webkit-resizer \{[^}]*border:/.test(cssLaws), 'a resizer rule still declares a border — the 1.8.0 square frame survived');
});
ok('A3 — the resting grip is the capsule (radius + 32% strokes over the 14% fill)', () => {
  const rule = gripRule();
  assertMatch(rule, /border-radius: 4px;/, 'the capsule radius never spoke');
  assertMatch(rule, /color-mix\(in srgb, var\(--gd-ink\) 32%, transparent\) 0 1px,/, 'the hatch strokes never spoke');
  assertMatch(rule, /color-mix\(in srgb, var\(--gd-ink\) 14%, transparent\);/, 'the translucent fill never spoke');
});
ok('A4 — the focused grip gathers (38% strokes over the 20% fill)', () => {
  const m = /\.gd-prompt-box:focus::-webkit-resizer \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assertMatch(m, /color-mix\(in srgb, var\(--gd-ink\) 38%, transparent\) 0 1px,/, 'the focused strokes never spoke');
  assertMatch(m, /color-mix\(in srgb, var\(--gd-ink\) 20%, transparent\);/, 'the focused fill never spoke');
});
ok('A5 — the colored grip speaks the capsule in the color\'s own ink (34% / 16%)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-resizer \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assertMatch(m, /border-radius: 4px;/, 'the colored capsule radius never spoke');
  assertMatch(m, /color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 34%, transparent\) 0 1px,/, 'the colored strokes never spoke');
  assertMatch(m, /color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 16%, transparent\);/, 'the colored fill never spoke');
});
ok('A6 — the archive grip rides the capsule at the resting weights (32% / 14%)', () => {
  const m = /\[data-theme='archive'\] \.gd-prompt-box::-webkit-resizer \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assertMatch(m, /border-radius: 4px;/, 'the archive capsule radius never spoke');
  assertMatch(m, /color-mix\(in srgb, var\(--gd-ink\) 32%, transparent\) 0 1px,/, 'the archive strokes never spoke');
  assertMatch(m, /color-mix\(in srgb, var\(--gd-ink\) 14%, transparent\);/, 'the archive fill never spoke');
});

console.log('\nB. THE I-BEAM RETURNS TO THE TEXT ("on the text but not on the scrollbar/resize box")');
ok('B1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.1 — THE I-BEAM RETURNS TO THE TEXT/, 'the I-beam note is missing');
});
ok('B2 — the field lost the default cursor + kept its constant lane', () => {
  const at = cssLaws.indexOf('.gd-well-shell .gd-prompt-box {');
  const rule = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assert.ok(!rule.includes('cursor:'), 'the 1.8.0 cursor: default survived — the text cannot speak its I-beam');
  assertMatch(rule, /scrollbar-gutter: stable;/, 'the stable gutter lost its word');
  assertMatch(rule, /overflow-y: auto;/, 'the scroll seat lost its word');
});
ok('B3 — the chrome\'s parts declare the plain DEFAULT arrow', () => {
  assertMatch(css, /1\.8\.1 — THE CHROME'S OWN ARROWS/, 'the arrows note is missing');
  const m = /\.gd-prompt-box::-webkit-scrollbar,\s*\.gd-prompt-box::-webkit-scrollbar-thumb,\s*\.gd-prompt-box::-webkit-scrollbar-track,\s*\.gd-prompt-box::-webkit-scrollbar-corner,\s*\.gd-prompt-box::-webkit-resizer \{\s*cursor: default;\s*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the chrome arrows group rule never spoke');
});
ok('B4 — the grip speaks its native diagonal (the resize promise)', () => {
  const rule = gripRule();
  assertMatch(rule, /cursor: nwse-resize;/, 'the diagonal never spoke');
});

console.log('\nC. THE TITLE SPEAKS ONCE ("one is a title separator the other is a container one")');
ok('C1 — the law note speaks its name', () => {
  assertMatch(settings, /1\.8\.1 — THE TITLE SPEAKS ONCE/, 'the title-once note is missing');
});
ok('C2 — the card-internal title rides off', () => {
  assert.ok(!settings.includes('<div className="gd-opt-title">REASSIGN KEYS</div>'), 'the card-internal REASSIGN KEYS title survived');
});
ok('C3 — the section separator keeps the word + the roster keeps its mount', () => {
  assertMatch(settings, /<div className="gd-set-section">REASSIGN KEYS<\/div>/, 'the section header lost the word');
  assertMatch(settings, /<ShortcutsCard shortcuts=\{settings\.shortcuts\} onChange=\{\(map\) => set\('shortcuts', map\)\} showHelp=\{showHelp\} \/>/, 'the roster lost its mount');
});

console.log('\nD. HELP TEXT JOINS THE APP KEYS ("next to the tooltips option and side panel and bottom panel option")');
ok('D1 — the law note speaks its name', () => {
  assertMatch(titlebar, /1\.8\.1 — HELP TEXT JOINS THE APP KEYS/, 'the app-keys note is missing');
});
ok('D2 — the key rides the cluster beside its fellow teacher tooltips', () => {
  const at = titlebar.indexOf('<Speech size={13} />');
  assert.ok(at >= 0, 'the tooltips key left the cluster');
  // 1.8.2 — the window widened past the key's own law notes (the 1.8.1 birth
  // note + the 1.8.2 combo note both sit between the two keys now).
  const after = titlebar.slice(at, at + 2600);
  assertMatch(after, /<CircleHelp size=\{13\} \/>/, 'the help key never mounted beside tooltips');
  assertMatch(after, /className=\{`gd-switch \$\{helpMode \? 'is-on' : ''\}`\} aria-hidden="true"/, 'the switch pill never spoke');
  assertMatch(after, /onClick=\{onToggleHelp\}/, 'the key never answers its handler');
  // 1.8.2 — the tooltip speaks the sibling form: the on/off word and the combo
  // in parens, the explanatory paragraph riding off with the shortcut's arrival.
  assertMatch(after, /Help text on \(\$\{combo\('helpText'\)\}\)/, 'the tooltip never spoke');
});
ok('D3 — the prop seats arrive (helpMode / onToggleHelp / the CircleHelp import)', () => {
  assertMatch(titlebar, /import \{ CircleHelp, PanelBottom, PanelRight,/, 'the CircleHelp import never arrived');
  assertMatch(titlebar, /helpMode = false,/, 'the helpMode seat never arrived');
  assertMatch(titlebar, /onToggleHelp = null,/, 'the onToggleHelp seat never arrived');
});
ok('D4 — App threads the same switch the footers write', () => {
  assertMatch(app, /helpMode=\{showHelp\}/, 'App never threaded the mode');
  assertMatch(app, /onToggleHelp=\{seatToggleHelp\}/, 'App never threaded the handler');
  assertMatch(app, /const seatToggleHelp = useCallback\(\(\) => setSetting\('showHelpText', !showHelpRef\.current\), \[setSetting\]\);/, 'the stable handler never spoke');
});

console.log('\nE. THE PULL FADES ("so it doesnt block or get confusing")');
ok('E1 — the law notes speak their name (both seats)', () => {
  assertMatch(grid, /1\.8\.1 — THE PULL FADES/, 'the GridView note is missing');
  assertMatch(css, /1\.8\.1 — THE PULL FADES/, 'the CSS note is missing');
});
ok('E2 — the birth writes the faded weight', () => {
  assertMatch(grid, /const DRAG_GHOST_FADE = '0\.55';/, 'the fade constant never spoke');
  assertMatch(grid, /ghost\.style\.opacity = birthHasPointer \? DRAG_GHOST_FADE : '0';/, 'the birth never spoke the fade');
});
ok('E3 — the flight + the focus re-seat light at the faded weight, the guard keeps its word', () => {
  assertMatch(grid, /if \(ghost\.style\.opacity !== '0'\) return; \/\/ already lit — nothing to recover/, 'the lit-guard never re-seated');
  const writes = grid.match(/ghost\.style\.opacity = DRAG_GHOST_FADE;/g) || [];
  assert.equal(writes.length, 2, 'the flight + focus writes lost their seats (got ' + writes.length + ')');
});
ok('E4 — no full-ink write survives', () => {
  assert.ok(!/ghost\.style\.opacity = '1'/.test(grid), "a full-opacity write survived — the pull rides at full ink");
});
ok('E5 — the CSS speaks the same number + the soft arrival', () => {
  const ghostCss = cssLaws.match(/\.gd-drag-ghost \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(ghostCss.includes('opacity: 0.55'), 'the ghost rule never spoke the fade');
  assert.ok(ghostCss.includes('transition: opacity 0.12s ease'), 'the soft arrival never spoke');
});

console.log('\nF. THE VERSION FURNITURE (1.8.1 everywhere)');
ok('F1 — the version is 1.8.1 everywhere', () => {
  assert.equal(JSON.parse(pkg).version, '1.9.19', 'package.json');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL<\/span>/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.6"/, 'the release URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the source URL never moved');
});
ok('F2 — the 1.8.0 entry keeps its own seat (the sweep disease cured)', () => {
  assertMatch(changelog, /^## 1\.8\.0 — One Band, One Seat/m, 'the 1.8.0 entry lost its seat');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.0"/, 'the 1.8.0 row\'s link lost its release');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
