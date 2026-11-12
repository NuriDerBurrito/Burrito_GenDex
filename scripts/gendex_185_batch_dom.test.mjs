// 1.8.4 batch — The Cover.
// (Named 185 in the sequence: 184 pins the 1.8.3 laws; this suite pins
//  the 1.8.4 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE FOLD PAYS THE SEAT, NOT THE SCROLL ("scroll-fold is still
//       weird , right now when i scroll down the content would move down
//       like it should and then snap to where it was , the content in the
//       back should act independently of the tags/stamp container, as if
//       its covering it , since currently its buggy when i scroll down
//       while giving unexpected behavior etc.. (especially when i drag
//       with the scrollbar on the right , it snaps to the top then back
//       down , fix that)")
//   B.  THE DANGER KEY SPEAKS ITS OWN RED ("make the prompt delete button
//       red and not follow the theme (also the x should be clear above it
//       so its not red on red)")
//   C.  THE HIGHLIGHT STEPS TOWARD THE INK ("the highlights of the buttons
//       in the notes/prompts should not blend in to the color , currently
//       its like yellow on yellow etc , fix that")
//   D.  THE CHECK WEARS ITS OWN OUTLINE ("add an outline around the
//       checkmark in the prompts container so its color doesnt blend into
//       the container")
// Plus the version furniture (1.8.4 everywhere).

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

console.log('\nA. THE FOLD PAYS THE SEAT, NOT THE SCROLL ("the content in the back should act independently of the tags/stamp container, as if its covering it")');
ok('A1 — the law note speaks its name', () => {
  // 1.8.5 supersede — the cover's one-frame economy became THE PAYER
  // (one formula, both directions), the hem guard's revert became THE
  // ROAD CHOICE, and the hem's return became a FLIGHT: the notes tell
  // their own supersession in the code's own voice.
  // 1.8.6 — THE SILENT ASCENT: the payer, the hem restore and the road
  // choice all retired with the loans they served.
  assertMatch(cv, /THE PAYER \(one formula, both directions[\s\S]*?RETIRED IN 1\.8\.6/, 'the payer retirement note is missing');
  assertMatch(cv, /1\.8\.6 — THE SILENT ASCENT \("currently when i scroll up it opens the/, 'the ascent note never spoke');
  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\.8\.6 THERE IS ONLY ONE ROAD/, 'the one-road note never spoke');
});
ok('A2 — the seat rides below the header (the debt-bearer exists at all three seats)', () => {
  // 1.8.6 — the seat element left the tree with the debt it held; the
  // JSX tombstone + the CSS law keep its seat as the law it used to be.
  assertMatch(cv, /THE SEAT LEFT WITH THE RESTORES IT SERVED/, "the seat's retirement never spoke");
  assert.ok(!cv.includes('const rowsSeatRef'), 'the seat ref survived its retirement');
  const m = /\.gd-rows-seat \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the seat law never spoke in css');
  assertMatch(m, /height: 0;/, 'the seat never rests at zero');
});
ok('A3 — the debt is discovered live (the payer formula, never a commit-time measure)', () => {
  // 1.8.5 supersede — the seat's height is whatever the header has LOST
  // at this breath, written per observed frame by the payer's formula;
  // the road choice only ESTIMATES the give (dEst, from the tray's own
  // height against the cached folded rest) to pick the road pre-paint.
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the road choice never estimated the give');
  // 1.8.6 — the formula left with the payer; the folded rest is
  // measured by the settle effect where the payer's retire clock sat.
  assertMatch(cv, /1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');
  assertMatch(cv, /if \(zone && zone\.offsetHeight > 0\) foldRestHRef\.current = zone\.offsetHeight;/, 'the folded rest never took its honest measure');
});
ok('A4 — the give-back is retired whole (the listener never writes the offset at all)', () => {
  assert.ok(!cv.includes('seatBefore'), 'the pre-fold seat variable survived the cover law');
  assert.ok(!cv.includes('const give = Math.min('), 'the bounded give survived the cover law');
  // 1.8.5 supersede — even THE UN-CLAMP rides off: the fold is a state
  // flip now (nothing paints in the listener's own task, so the eager
  // clamp has no mid-task breath to steal from), and the seat road's
  // payer keeps the flow's total constant THROUGH the flight — the
  // offset is never written by this listener on any road: no pay, no
  // re-map, no un-clamp, the drag's own offset whole forever.
  const writes = (cv.match(/scroller\.scrollTop = /g) || []).length;
  assert.ok(writes === 0, `the offset is written ${writes} times — no road touches it anymore`);
});
ok('A5 — the between-band stands down (an attempt short of the hem never lands at all)', () => {
  // 1.8.5 supersede — the hem guard's paint-measure-revert became THE
  // ROAD CHOICE: the give is ESTIMATED before any paint (nothing ever
  // lands to revert — no class, no height, no state, the attempt never
  // exists), and a journey begun mid-page short of the hem simply stands
  // down — the 1.8.4 ground, spoken with one comparison. The journey
  // that BEGAN at the top rides the flow road (the report's own case:
  // "when scrolling down from top of the detail panel").
  assertMatch(cv, /if \(!fromTop && scroller\.scrollTop < dEst\) return; \/\/ the between-band/, 'the between-band never spoke its word');
  assertMatch(cv, /const fromTop = \(journeyStartRef\.current == null \? prev : journeyStartRef\.current\) <= 32;/, 'the journey gate never read its start');
  assertMatch(cv, /if \(down && !wasDown\) journeyStartRef\.current = prev == null \? scroller\.scrollTop : prev;/, "the journey's start was never recorded");
});
ok('A6 — the dead zone answers the restore-edge ticks with one comparison', () => {
  // 1.8.5 supersede — the cheap hem (the revert cache) rides off with
  // the revert itself: the attempt is two cheap reads now, and the
  // anti-flap breath at the RESTORE edge is the dead zone — 48px of
  // downward grace after any restore before the fold re-arms. The
  // folded rest the road choice estimates is cached by the payer's own
  // retire instead (measured honestly, the CSS's 26 only the fallback).
  // 1.8.6 — the dead zone retired with the restores it guarded (the
  // ascent cannot oscillate: down folds, up answers nothing).
  assert.ok(!cv.includes('const foldDeadRef'), 'the dead zone survived the silence');
  assertMatch(cv, /if \(!down\) return; \/\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the ascent never fell silent');
  assertMatch(cv, /const foldRestHRef = useRef\(0\);/, 'the folded-rest cache never declared its seat');
});
ok('A7 — the hem unfold returns the loan as a flight (the cover re-extends over content that never moved)', () => {
  // 1.8.6 — THE SILENT ASCENT: the hem unfold retired with the debt it
  // returned (an up-tick answers NOTHING; expanding is the hand's work).
  assert.ok(!cv.includes('if (debt > 0 && scroller.scrollTop < debt)'), 'the hem gate survived the silence');
  assert.ok(!cv.includes('const launchSeatPayer'), 'the payer launcher survived its retirement');
  assert.ok(!/zone\.classList\.remove\('gd-rows-folded', 'is-snap'\);/.test(cv), 'the one-shot class removal survived — the freeze\'s own door stayed open');
});
ok('A8 — the name the fold swallowed returns with the tray (its height rode into the debt)', () => {
  assertMatch(cv, /const nameOpenAtFoldRef = useRef\(false\);/, "the name's seat-at-fold ref never declared");
  assertMatch(cv, /nameOpenAtFoldRef\.current = nameWasOpen;/, 'the fold never captured the name it swallowed');
  // 1.8.6 — the name returns on the HAND's roads now (openTrayByHand
  // asks the ref at its own door — the fold swallowed both, the hand's
  // word pays both back out).
  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));
  const handBody = hand.slice(0, hand.indexOf('}, []);'));
  assertMatch(handBody, /if \(nameOpenAtFoldRef\.current\) \{/, "the hand's road never asked for the name back");
  assertMatch(handBody, /setNameExpanded\(true\);/, "the name's state never returned");
  assertMatch(handBody, /setNameClamped\(false\);/, "the name's clamp never lifted");
  assertMatch(cv, /if \(nameExpanded\) nameOpenAtFoldRef\.current = false;/, 'a manual retract never retired the restore memory');
});
ok('A9 — every manual road out of a scroll-fold returns the loan in one frame', () => {
  // 1.8.6 — THE HAND OPENS THE TRAY ITSELF: the dismissal retired with
  // the loan it paid (there is no loan left to dismiss), and every
  // manual road — the chip, a label toggle, the wake, the two pin roads —
  // speaks openTrayByHand, the page growing back with the tray's flight.
  assertMatch(cv, /1\.8\.6 — THE HAND OPENS THE TRAY ITSELF/, "the hand's-road note never spoke");
  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));
  const handBody = hand.slice(0, hand.indexOf('}, []);'));
  assertMatch(handBody, /setAutoCollapsed\(false\);/, "the hand's road never opened the tray");
  assert.ok(!cv.includes('const dismissSeatDebt'), 'the dismissal survived its retirement');
  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));
  assertMatch(exp.slice(0, 400), /openTrayByHand\(\);/, "the chip's road never joined the hand");
  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));
  assertMatch(tog.slice(0, 500), /openTrayByHand\(\);/, "a label toggle's road never joined the hand");
  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));
  assertMatch(wake.slice(0, 900), /openTrayByHand\(\);/, "the panel's wake never joined the hand");
  // (the two roads sit at different nestings — the key's and the menu's —
  //  so the pair is read from the ROAD itself: the guarded opening that
  //  follows each pin write, never one literal indent)
  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);
  const pinReturns = pinSegs.filter((seg) => {
    const near = seg.slice(0, 620);
    return near.includes('if (!rowsPinned) {') && near.includes('openTrayByHand();');
  }).length;
  const pinSeats = pinSegs.length;
  assert.ok(pinSeats === 2 && pinReturns === 2, `the pin roads never joined the hand (found ${pinReturns} of ${pinSeats})`);
});
ok('A10 — the RO measures the rendered header PLUS the debt (the column never learns the tray left)', () => {
  assertMatch(cv, /setHeadH\(Math\.round\(el\.offsetHeight\)\)/, 'the column never read the header alone');
  assert.ok(!cv.includes('col.style.top'), "the old same-stroke column write survived — the column's seat is still being moved by hand");
});
ok('A11 — the tray snap retires with the fight it fled (the tombstone keeps its seat)', () => {
  // 1.8.5 — THE SNAP SEAT RETIRES: the payer holds the flow's total
  // still THROUGH every flight, so there is no layout fight to still
  // and no snap to land — the tray tweens on every road (the 0.39.0
  // breath, restored) and the is-snap class never arms again; its CSS
  // block stays as the tombstone (the selector family pinned as the
  // law it used to be).
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tombstone never spoke');
});

console.log("\nB. THE DANGER KEY SPEAKS ITS OWN RED (\"make the prompt delete button red and not follow the theme\")");
ok('B1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.4 — THE DANGER KEY SPEAKS ITS OWN RED/, 'the danger note is missing');
  assertMatch(css, /1\.8\.4 — THE DANGER KEY KEEPS ITS OWN RED IN THE COLORED ROW/, 'the colored danger note is missing');
});
ok('B2 — the plain seat: a red face, a white X, a darker hem', () => {
  const m = /\.gd-part-keys \.gd-icon-btn\.is-part-del \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the plain danger rule never spoke');
  assertMatch(m, /background: #c8402f;/, 'the red face never spoke');
  assertMatch(m, /color: #ffffff;/, 'the white X never spoke');
  assertMatch(m, /border-color: color-mix\(in srgb, #000000 25%, #c8402f\);/, 'the darker hem never spoke');
  assertMatch(m, /box-shadow: 0 1\.5px 0 color-mix\(in srgb, #000000 30%, #c8402f\);/, 'the red ground never spoke');
  assert.ok(!m.includes('#ff8d7d'), 'the salmon glyph survived inside the danger key');
});
ok('B3 — the hover brightens the red (never the theme, never the container)', () => {
  const m = /\.gd-part-keys \.gd-icon-btn\.is-part-del:not\(:disabled\):hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the danger hover rule never spoke');
  assertMatch(m, /background: #d94b38;/, 'the brighter red never spoke');
  assertMatch(m, /color: #ffffff;/, 'the X never kept its white above the hover');
  assertMatch(m, /transform: translateY\(-1px\);/, 'the lift never spoke');
});
ok('B4 — the colored twin speaks the same tongue (no container color ever reaches it)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn\.is-part-del \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the colored danger rule never spoke');
  assertMatch(m, /background: #c8402f;/, 'the red face never spoke at the heavier weight');
  assertMatch(m, /color: #ffffff;/, 'the white X never spoke at the heavier weight');
  assert.ok(!m.includes('--part-'), "a container rung reached the danger key's face");
  assert.ok(!m.includes('#ff8d7d'), 'the salmon tongue survived at the heavier weight');
});

console.log("\nC. THE HIGHLIGHT STEPS TOWARD THE INK (\"currently its like yellow on yellow etc , fix that\")");
ok('C1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.4 — THE HIGHLIGHT STEPS TOWARD THE INK/, 'the ink-step note is missing');
});
ok('C2 — the plain keys: a real 10% ink gather (both lanes — the parts and the notes)', () => {
  for (const lane of ['.gd-part-keys', '.gd-notes-keys']) {
    const m = new RegExp(
      lane.replace(/\./g, '\\.') + ' \\.gd-icon-btn:not\\(:disabled\\):hover \\{[^}]*\\}'
    ).exec(cssLaws)?.[0] || '';
    assert.ok(m.length > 0, `the ${lane} hover rule never spoke`);
    assertMatch(m, /background: color-mix\(in srgb, var\(--gd-ink\) 10%, var\(--gd-panel\)\);/, `the ${lane} hover never gathered the ink`);
    assert.ok(!/background: var\(--gd-panel\);/.test(m), `the ${lane} hover still whispers panel-on-panel`);
  }
});
ok('C3 — the colored keys: the ink rung carries the step (face + hem)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn:not\(:disabled\):hover,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn:not\(:disabled\):hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the colored hover rule never spoke');
  assertMatch(m, /background: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 16%, var\(--part-title, var\(--gd-panel\)\)\);/, 'the 16% ink gather onto the title band never spoke');
  assertMatch(m, /border-color: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 45%, var\(--part-line, var\(--gd-line\)\)\);/, 'the 45% ink hem never spoke');
});
ok('C4 — the adjacent-rung gather is retired (no more yellow on yellow)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn:not\(:disabled\):hover,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn:not\(:disabled\):hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the colored hover rule never spoke');
  assert.ok(!m.includes('42%'), 'the face-over-title gather survived the ink-step law');
  assert.ok(!/border-color: var\(--part-color, var\(--gd-ink\)\);/.test(m), 'the raw-color border survived the ink-step law');
});
ok('C5 — the copied beat speaks the row\'s own extreme rungs (the flash never melts)', () => {
  const m = /\.gd-part-row\.is-colored \.gd-part-keys \.gd-icon-btn\.is-copied,\s*\n\.gd-part-row\.is-colored \.gd-notes-keys \.gd-icon-btn\.is-copied \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the colored copied rule never spoke');
  assertMatch(m, /background: var\(--part-spine, var\(--gd-accent\)\);/, "the family's lightest rung never grounded the flash");
  assertMatch(m, /color: var\(--part-ink, var\(--gd-accent-ink\)\);/, "the family's ink never spoke the flash's glyph");
  assertMatch(m, /border-color: var\(--part-ink, var\(--gd-accent\)\);/, "the family's ink never hemmed the flash");
  assert.ok(!m.includes('background: var(--gd-accent)'), 'the theme accent still flashes inside a colored row');
  const deep = /\.gd-part-row\.is-colored\.is-shade-deep \.gd-part-keys \.gd-icon-btn\.is-copied,\s*\n\.gd-part-row\.is-colored\.is-shade-deep \.gd-notes-keys \.gd-icon-btn\.is-copied \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(deep.length > 0, 'the deep-shade twin never spoke');
  assertMatch(deep, /background: var\(--part-well, var\(--gd-accent\)\);/, "the deep family's dark rung never grounded the flash");
  assertMatch(deep, /color: var\(--part-spine, var\(--gd-accent-ink\)\);/, "the deep family's light rung never spoke the flash's glyph");
});

console.log('\nD. THE CHECK WEARS ITS OWN OUTLINE ("so its color doesnt blend into the container")');
ok('D1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.4 — THE CHECK WEARS ITS OWN OUTLINE/, 'the check outline note is missing');
});
ok('D2 — the ON state keeps a permanent ink edge (the fill never melts into itself)', () => {
  const m = /\.gd-check\.is-on \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the is-on rule never spoke');
  assertMatch(m, /border-color: var\(--gd-ink\);/, 'the permanent ink edge never spoke');
  assertMatch(m, /background: var\(--gd-accent-2, var\(--gd-accent\)\);/, 'the fill lost its own tongue');
  assert.ok(!m.includes('border-color: var(--gd-accent-2'), 'the edge still melts into the fill');
});
ok('D3 — the colored row speaks its own ink rung (the ladder\'s guaranteed read)', () => {
  const rest = /\.gd-part-row\.is-colored \.gd-check \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(rest.length > 0, 'the colored check rule never spoke');
  assertMatch(rest, /border-color: var\(--part-ink, var\(--gd-ink\)\);/, "the row's own ink rung never framed the check");
  const on = /\.gd-part-row\.is-colored \.gd-check\.is-on \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(on.length > 0, 'the colored is-on rule never spoke');
  assertMatch(on, /border-color: var\(--part-ink, var\(--gd-ink\)\);/, "the filled check's ink edge never spoke");
  const hov = /\.gd-part-row\.is-colored \.gd-check:hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(hov.length > 0, 'the colored hover rule never spoke');
  assertMatch(hov, /border-color: var\(--part-line, var\(--gd-accent\)\);/, "the hover's own word never spoke");
});
ok('D4 — the border joins the transition (the edge breathes with the fill)', () => {
  // (anchored to the line: the part row's own scoped .gd-check seat sits
  //  earlier in the sheet and would answer for the base rule otherwise)
  const m = /^\.gd-check \{[^}]*\}/m.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the check rule never spoke');
  assertMatch(m, /transition: background-color 0\.12s ease, border-color 0\.12s ease;/, 'the border never joined the transition');
});

console.log('\nE. THE VERSION FURNITURE');
ok('E1 — the version is 1.8.4 everywhere', () => {
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
ok('E2 — the 1.8.3 entry keeps its own seat (each version keeps its release)', () => {
  assertMatch(changelog, /^## 1\.8\.3 — The Same Breath/m, "the 1.8.3 entry lost its seat");
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.3">release page<\/a>/, 'the 1.8.3 row lost its own release link');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
