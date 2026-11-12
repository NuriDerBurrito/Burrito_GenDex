// 1.8.3 batch — The Same Breath.
// (Named 184 in the sequence: 183 pins the 1.8.2 laws; this suite pins
//  the 1.8.3 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE FOLD AND ITS GIVE-BACK LAND IN THE SAME BREATH ("you didnt
//       fix the scroll-fold snap , now the content snaps downwards as i
//       scroll down, i dont want the prompts/preview or anything to snap
//       or move while scrolling downwards , basically i dont want sudden
//       snaps or movement as it closes , act as it would normally do")
//   B.  THE KEYS SPEAK THE ROW'S OWN COLOR ("the buttons on the right of
//       the prompt container should follow the container's color theme
//       too")
//   C.  THE NOTES' KEYS JOIN THE FRAME ("the buttons for the note (aka
//       copy and expand) arent clear , they dont have a button style ,
//       fix that, by making them have the same style as the prompt
//       buttons on the right except the notes one are on top as they are
//       currently")
// Plus the version furniture (1.8.3 everywhere).

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
const cv = src('src/components/CharacterView.jsx');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');
const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\nA. THE FOLD AND ITS GIVE-BACK LAND IN THE SAME BREATH ("now the content snaps downwards as i scroll down")');
ok('A1 — the law note speaks its name', () => {
  // 1.8.4 — the same-breath note was superseded by the cover's own note
  // (the fold still lands in one task, one paint — it simply owes the seat
  // instead of the scroll: the debt is paid into a borrowed flow seat
  // below the sticky header, never out of the scroll offset).
  // 1.8.5 — the cover's one-frame economy became THE PAYER (one
  // formula, both directions) and the fold's note became THE ROAD
  // CHOICE: the same-breath paint had nothing left to synchronize once
  // the flow's total stands still through the whole flight.
  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\.8\.6 THERE IS ONLY ONE ROAD/, 'the one-road note is missing');
  assertMatch(cv, /THE PAYER \(one formula, both directions[\s\S]*?RETIRED IN 1\.8\.6/, 'the payer retirement note is missing');
});
ok('A2 — the listener commits the fold as a state flip (the payer carries the paint)', () => {
  // 1.8.5 — the listener paints NOTHING anymore: the fold is a state
  // flip (React + framer + the tray's own CSS tweens carry the flight)
  // and the payer — a ResizeObserver — tracks the header's live loss
  // frame by frame, so the flow's total never changes THROUGH the
  // flight and the same-breath paint retired with the pay it served.
  // 1.8.6 — THE SILENT ASCENT: there are no roads to choose between
  // anymore — the fold is ONE state flip on ONE road, the ascent silent.
  assertMatch(cv, /if \(!down\) return; \/\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the ascent never fell silent');
  assertMatch(cv, /if \(!fromTop && scroller\.scrollTop < dEst\) return; \/\/ the between-band/, 'the between-band never stood down');
  assertMatch(cv, /setAutoCollapsed\(\(was\) => \(was \? was : true\)\);/, 'the fold never flipped its state');
});
ok('A3 — the debt is discovered live (the payer formula, never a commit-time measure)', () => {
  // 1.8.5 — the seat's height is whatever the header has LOST at this
  // breath, written per observed frame by the payer's formula — never
  // measured at commit and never guessed. The road choice only
  // ESTIMATES the give up front (dEst — the tray's own height against
  // the cached folded rest) to pick the road before any paint.
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the road choice never estimated the give');
  // 1.8.6 — the formula left with the payer; the folded rest is
  // measured by the settle effect where the payer's retire clock sat.
  assertMatch(cv, /1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');
  assertMatch(cv, /if \(zone && zone\.offsetHeight > 0\) foldRestHRef\.current = zone\.offsetHeight;/, 'the folded rest never took its honest measure');
});
ok('A4 — the listener-time-only give-back is retired (no paint can slip between)', () => {
  assert.ok(!cv.includes('give = Math.min(body.height'), 'the body-rect guess survived — the under-paying read lives on');
  assert.ok(!cv.includes('let give = 0;'), 'the pre-measured give variable survived');
});
ok('A5 — an expanded name retracts on its own flight (the same breath the tray speaks)', () => {
  // 1.8.5 — the direct write retired with the same-breath paint: the
  // name retracts by STATE (framer's own 0.24s flight carries the
  // retract), the fold captures the name it swallows so the restore can
  // return it, and the name's height rides in the PAYER'S measure with
  // the tray's own (the seat carries both).
  assertMatch(cv, /nameOpenAtFoldRef\.current = nameWasOpen;/, 'the fold never captured the name it swallowed');
  assertMatch(cv, /setNameExpanded\(\(was\) => \(was \? false : was\)\);/, 'the name never retracted with the rows');
});
ok('A6 — the mirrors the listener reads (the long-lived closure law)', () => {
  assertMatch(cv, /const nameFoldHRef = useRef\(null\);/, 'the fold-target mirror never declared its seat');
  assertMatch(cv, /nameFoldHRef\.current = nameFoldH;/, 'the mirror never wired its state');
  assertMatch(cv, /ref=\{nameFoldRef\}/, "the name fold's node ref never spoke");
});
ok('A7 — the sticky preview column is paid in the same stroke (the RO never hops)', () => {
  // 1.8.4 — the hand-written column seat is retired with the give-back
  // it served: the RO measures the header PLUS the debt, so through a fold
  // both change by the same number in opposite directions and the column
  // never learns the tray left (its seat never hops a frame after the fact).
  assertMatch(cv, /new ResizeObserver\(\(\) =>/, 'the sticky-column gate never spoke');
  assertMatch(cv, /setHeadH\(Math\.round\(el\.offsetHeight\)\)/, "the column's top never landed on the header alone");
  assert.ok(!cv.includes('col.style.top'), 'the hand-written column seat survived — the RO is still being fought');
});
ok('A8 — the tray snap retires with the fight it fled (the tombstone keeps its seat)', () => {
  // 1.8.5 — THE SNAP SEAT RETIRES: the payer holds the flow's total
  // still THROUGH every flight, so there is no layout fight to still —
  // the tray tweens on every road and the is-snap class never arms
  // again (its CSS block stays as the tombstone).
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tombstone never spoke');
});

console.log('\nB. THE KEYS SPEAK THE ROW\'S OWN COLOR ("should follow the container\'s color theme too")');
ok('B1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.3 — THE KEYS SPEAK THE ROW'S OWN COLOR/, 'the colored-keys note is missing');
});
ok('B2 — the colored scope seats BOTH lanes (the parts\' rail + the notes\' line)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the grouped colored rule never spoke');
  assertMatch(m, /background: var\(--part-title,/, 'the title band\'s rung never grounded the key');
  assertMatch(m, /color: var\(--part-ink,/, 'the face\'s readable ink never spoke the glyph');
  assertMatch(m, /border-color: color-mix\(in srgb, var\(--part-line, var\(--gd-ink\)\) 55%, var\(--part-title,/, 'the outline ink never framed the key');
  assertMatch(m, /box-shadow: 0 1\.5px 0 color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 26%, transparent\);/, 'the grounded shadow never spoke the color\'s ink');
});
ok('B3 — the hover gathers toward the color itself (the row hover\'s own word)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn:not\(:disabled\):hover,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn:not\(:disabled\):hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the colored hover rule never spoke');
  // 1.8.4 — the gather steps toward the INK now: the 1.8.3 adjacent-rung
  // gather (the face 42% into the title, the border to the raw color)
  // melted yellow-on-yellow on a saturated family — the row's own ink
  // rung carries both the 16% face step and the 45% hem.
  assertMatch(m, /border-color: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 45%, var\(--part-line, var\(--gd-line\)\)\);/, 'the raw color\'s edge never spoke');
  assertMatch(m, /background: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 16%, var\(--part-title, var\(--gd-panel\)\)\);/, 'the lift toward the face never spoke');
});
ok('B4 — the press keeps its seat under the heavier hand (transform re-seated)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn:not\(:disabled\):active,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn:not\(:disabled\):active \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the colored active rule never spoke');
  assertMatch(m, /transform: translateY\(0\);/, 'the press lost its landing');
});
ok('B5 — the danger + copied keys keep their own tongues inside the scope', () => {
  const del = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn\.is-part-del \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(del.length > 0, 'the colored danger rule never spoke');
  // 1.8.4 — the danger key steps OUT of the family (its own red face,
  // its white X — never the salmon tongue) and the copied beat flips to
  // the family's own extreme rungs (the spine under the ink).
  assertMatch(del, /background: #c8402f;/, 'the danger tongue lost its word');
  assertMatch(del, /color: #ffffff;/, "the white X never spoke above the danger's red");
  const copied = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn\.is-copied,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn\.is-copied \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(copied.length > 0, 'the colored copied rule never spoke');
  assertMatch(copied, /background: var\(--part-spine, var\(--gd-accent\)\);/, 'the confirmation beat lost its accent face');
});

console.log("\nC. THE NOTES' KEYS JOIN THE FRAME (\"they dont have a button style, fix that\")");
ok('C1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.3 — THE NOTES' KEYS JOIN THE FRAME/, 'the notes-keys note is missing');
});
ok('C2 — the wrapper speaks the notes\' own key lane (the ghost utilities ride off)', () => {
  assertMatch(cv, /<div className="gd-notes-keys">/, 'the lane class never spoke at the wrapper');
  assert.ok(!cv.includes('<div className="flex items-center gap-1 flex-shrink-0">'), 'the ghost-era utilities survived at the seat');
});
ok('C3 — the lane carries the parts\' framed law verbatim (the 24px framed key)', () => {
  const lane = /\.gd-notes-keys \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(lane.length > 0, 'the lane rule never spoke');
  assertMatch(lane, /display: flex;/, 'the lane lost its row');
  assertMatch(lane, /gap: 4px;/, 'the lane lost the parts\' own gap');
  const key = /\.gd-notes-keys \.gd-icon-btn \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(key.length > 0, 'the framed key rule never spoke');
  assertMatch(key, /width: 24px;/, 'the framed key lost the parts\' own stature');
  assertMatch(key, /border: 1px solid color-mix\(in srgb, var\(--gd-ink\) 55%, var\(--gd-line\)\);/, 'the ink-weight border never spoke');
  assertMatch(key, /background: color-mix\(in srgb, var\(--gd-panel\) 92%, var\(--gd-bg\)\);/, 'the panel-mix face never spoke');
  assertMatch(key, /box-shadow: 0 1\.5px 0 color-mix\(in srgb, var\(--gd-ink\) 26%, transparent\);/, 'the grounded shadow never spoke');
  assertMatch(key, /color: var\(--gd-chrome\);/, 'the glyph lost the chrome ink');
});
ok('C4 — the copied beat reaches the notes pair now (the accent face, at last)', () => {
  const m = /\.gd-notes-keys \.gd-icon-btn\.is-copied \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the notes copied rule never spoke');
  assertMatch(m, /background: var\(--gd-accent\);/, 'the accent face never spoke');
  assertMatch(m, /border-color: var\(--gd-accent\);/, 'the accent edge never spoke');
});
ok('C5 — the hover lift + the press + the disabled keep their seats', () => {
  const hover = /\.gd-notes-keys \.gd-icon-btn:not\(:disabled\):hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(hover.length > 0, 'the notes hover rule never spoke');
  assertMatch(hover, /transform: translateY\(-1px\);/, 'the hover lift never spoke');
  const active = /\.gd-notes-keys \.gd-icon-btn:not\(:disabled\):active \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(active.length > 0, 'the notes active rule never spoke');
  assertMatch(active, /transform: translateY\(0\);/, 'the press landing never spoke');
  const dis = /\.gd-notes-keys \.gd-icon-btn:disabled \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(dis.length > 0, 'the notes disabled rule never spoke');
  assertMatch(dis, /opacity: 0\.25;/, 'the disabled whisper never spoke');
});

console.log('\nD. THE VERSION FURNITURE (1.8.3 everywhere)');
ok('D1 — the version is 1.8.3 everywhere', () => {
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
ok('D2 — the previous entry keeps its own seat (each version keeps its release)', () => {
  // 1.8.5 — the previous entry is 1.8.4 now (The Cover); its own seat and
  // its own release link stand exactly where they were born.
  assertMatch(changelog, /^## 1\.8\.4 — The Cover/m, 'the 1.8.4 entry lost its seat');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.4">release page<\/a>/, "the 1.8.4 row's link lost its release");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
