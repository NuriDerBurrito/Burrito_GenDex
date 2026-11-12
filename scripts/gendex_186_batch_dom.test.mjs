// 1.8.5 batch — The Cover Breathes.
// (Named 186 in the sequence: 185 pins the 1.8.4 laws; this suite pins
//  the 1.8.5 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE PAYER, ONE FORMULA, BOTH DIRECTIONS ("the expand animation for
//       stamps/tags isnt playing anymore" + "its still buggy and only
//       occurs when i do the collapse animation") — the seat finally has
//       an engine: a ResizeObserver holds it at exactly what the header's
//       folding ground has LOST at each observed frame, so the tray TWEENS
//       on every road while the flow's total stands stone-still THROUGH
//       the flight.
//   B.  THE ROAD CHOICE ("when scrolling down from top of the detail
//       panel , the stamps/tags doesnt collapse (i suspect you did
//       something last version where it doesnt effect the scroll , i want
//       it to effect it when opeining and closing but do it in a way that
//       it doesnt look buggy when scrolling like before i mean , and at
//       the same time not how it is currently)") — the fold commits from
//       the top on the FLOW road (the page shortens with the flight), the
//       seat road past the hem keeps the 1.8.4 cover law frame-by-frame,
//       and the between-band stands down.
//   C.  THE RESTORES RETURN THE LOAN AS A FLIGHT — the hem unfold hands
//       the debt to the payer, the flow road's origin re-opens the tray,
//       and every manual road out of a scroll-fold does the same.
//   D.  THE TWEEN SEATS (the 0.39.0 breath, restored) — the snap seat
//       retires with the fight it fled, on every seat it ever stillled.
//   E.  THE SWAP FLIGHT READS THE PRESS BREATH ("when moving prompts up
//       or down for the first time they snap to the very top and then
//       snap back , fix that")
//   F.  THE SELECTED OUTLINE OUT-RANKS EVERY HOVER ("when hovering over
//       the prompt the highlighted selected outline dissapears from the
//       container, fix that")
// Plus the version furniture (1.8.5 everywhere).

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
const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
const cv = src('src/components/CharacterView.jsx');
const pe = src('src/components/PartEditor.jsx');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');

console.log('\nA. THE PAYER (one formula, both directions — the seat finally has an engine)');

ok('A1 — the law note speaks its name', () => {
  // 1.8.6 — THE SILENT ASCENT: the payer retired WITH the seat it wrote
  // (no fold ever borrows anymore — the observer's whole economy left).
  assertMatch(cv, /THE PAYER \(one formula, both directions[\s\S]*?RETIRED IN 1\.8\.6/, 'the payer retirement note is missing');
  assertMatch(cv, /the tray TWEENS on every road still \(framer \+ the CSS's/, 'the retirement never kept the tween');
});

ok('A2 — the payer declares its seat and launches whole', () => {
  // 1.8.6 — the payer's whole declaration retired with the seat it
  // wrote; the folded-rest settle effect took the retire clock's place.
  assert.ok(!cv.includes('const seatPayerRef'), 'the payer state survived its retirement');
  assert.ok(!cv.includes('const launchSeatPayer'), 'the payer launcher survived its retirement');
  assertMatch(cv, /1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');
});

ok('A3 — the formula holds the seat at what the header lost (measured live, never guessed)', () => {
  // 1.8.6 — the formula left with the payer; the honest folded rest
  // is read once the fold's flight has settled (the 420ms clock kept).
  assertMatch(cv, /const t = setTimeout\(\(\) => \{[\s\S]*?if \(zone && zone\.offsetHeight > 0\) foldRestHRef\.current = zone\.offsetHeight;[\s\S]*?\}, 420\);/, 'the settle clock never spoke');
});

ok('A4 — the folded rest is measured where the payer left it (the settle clock)', () => {
  // 1.8.6 — THE SILENT ASCENT: the payer's retire clock became the SETTLE
  // EFFECT — 420ms after a fold commits, the tray zone's settled height is
  // read once, honestly (never mid-flight).
  assertMatch(cv, /useEffect\(\(\) => \{\s*\n\s*if \(!autoCollapsed\) return undefined;\s*\n\s*const t = setTimeout\(\(\) => \{[\s\S]*?foldRestHRef\.current = zone\.offsetHeight;\s*\n\s*\}, 420\);/, 'the settle clock never armed');
  assertMatch(cv, /1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');
});

ok('A5 — the listener never writes the scroll offset at all (the 1.8.4 crown, kept frame-by-frame)', () => {
  const writes = (cv.match(/scroller\.scrollTop = /g) || []).length;
  assert.ok(writes === 0, `the offset is written ${writes} times — no road pays, re-maps, or un-clamps it anymore`);
  assert.ok(!cv.includes('scroller.scrollTop = seatNow'), 'the un-clamp survived the state-flip era');
});

ok('A6 — the unmount lets the payer go (no observer outlives the view)', () => {
  // 1.8.6 — the payer's unmount seat left with the payer itself: no
  // observer is ever created, so none can outlive the view.
  assert.ok(!cv.includes('seatPayerRef'), 'the payer state survived its retirement');
  assert.ok(!cv.includes('new ResizeObserver(() => {\n      apply();'), 'a payer-shaped observer survived');
});

ok('A7 — a card swap re-anchors a live payer (the old card heights never carry over)', () => {
  // 1.8.6 — the re-anchor retired with the payer (no fold ever borrows,
  // so there is no anchor to re-seat at a swap); the swap effect tells
  // the retirement in the code's own voice.
  assertMatch(cv, /RETIRED IN 1\.8\.6\s*\n\s*\/\/ \(THE SILENT ASCENT retired the payer with the seat it wrote/, 'the swap never told the retirement');
  assert.ok(!cv.includes('const seatDebtRef'), 'the debt survived its retirement');
});

console.log('\nB. THE ROAD CHOICE (the flow road from the top — the report own case)');

ok('B1 — the road-choice note speaks its name (with the report own words)', () => {
  // 1.8.6 — THE SILENT ASCENT: the road choice speaks its ONE road now
  // (the flow road), the seat road retired with its debt, and the
  // between-band keeps its own 1.8.4 ground verbatim.
  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\.8\.6 THERE IS ONLY ONE ROAD \("when\s*\n\s*\/\/ scrolling down from top of the/, 'the one-road note is missing');
  assertMatch(cv, /THE FLOW ROAD — the ONLY road: the page shortens WITH the/, 'the flow road never told its gate');
  assertMatch(cv, /The 1\.8\.4 SEAT ROAD retired with/, 'the seat road never told its retirement');
  assertMatch(cv, /THE BETWEEN-BAND \(a journey begun mid-page, short of the hem\)/, 'the between-band never told its ground');
});

ok('B2 — the journey gate reads the start, not the seat', () => {
  assertMatch(cv, /const journeyStartRef = useRef\(null\);/, "the journey's start never declared its seat");
  assertMatch(cv, /if \(down && !wasDown\) journeyStartRef\.current = prev == null \? scroller\.scrollTop : prev;/, "the journey's start was never recorded");
  assertMatch(cv, /const fromTop = \(journeyStartRef\.current == null \? prev : journeyStartRef\.current\) <= 32;/, 'the from-top gate never spoke');
});

ok('B3 — the give is estimated before any paint (two cheap measures, never a paint-and-measure)', () => {
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the estimate never spoke');
  assertMatch(cv, /if \(!fromTop && scroller\.scrollTop < dEst\) return; \/\/ the between-band/, 'the between-band never stood down');
  assertMatch(cv, /if \(dEst < 4\) return; \/\/ nothing to fold — a tray already at its plate/, 'the nothing-to-fold floor never spoke');
});

ok('B4 — the fold commits on the one road (the state flips, the page shortens with the flight)', () => {
  // 1.8.6 — THE SILENT ASCENT: there is no road branch anymore — no
  // payer launch, no flow origin to record; the fold is one state flip
  // and the page shortens with the flight.
  assertMatch(cv, /\/\/ THE FOLD — one road: the state flips, framer \+ the CSS's own\s*\n\s*\/\/ tweens carry the flight, and the page shortens with it/, 'the one-road fold never spoke');
  assertMatch(cv, /setAutoCollapsed\(\(was\) => \(was \? was : true\)\);/, 'the fold never flipped its state');
  assert.ok(!cv.includes('const flowFoldRef'), 'the flow-road memory survived the silence');
});

ok('B5 — the dead zone retires with the restores it guarded (the ascent cannot oscillate)', () => {
  // 1.8.6 — THE SILENT ASCENT: down folds, up answers NOTHING — there
  // is no restore edge left to flap against, so the 48px grace left too.
  assert.ok(!cv.includes('const foldDeadRef'), 'the dead zone survived the silence');
});

console.log('\nC. THE RESTORES (the loan returns as a flight)');

ok('C1 — the hem unfold retires with the loan it returned (the ascent answers nothing)', () => {
  // 1.8.6 — THE SILENT ASCENT: the hem gate, the payer hand-off and the
  // name's restore all left with the debt they served — the scroll's
  // ascent never opens the tray, and the name returns on the hand's roads.
  assert.ok(!cv.includes('if (debt > 0 && scroller.scrollTop < debt)'), 'the hem gate survived the silence');
  assertMatch(cv, /1\.8\.6 — THE SILENT ASCENT \("currently when i scroll up it opens the/, 'the ascent note never spoke');
  assertMatch(cv, /if \(!down\) return; \/\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the ascent never fell silent');
});

ok("C2 — the flow road's origin restore retires with the ascent (the page grows only by the hand)", () => {
  // 1.8.6 — THE SILENT ASCENT: the flow origin + its restore gate left
  // with the auto-expand they served — the page grows back only when the
  // HAND opens the tray (openTrayByHand).
  assert.ok(!cv.includes('const flowOriginRef'), 'the flow origin survived the silence');
  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));
  const handBody = hand.slice(0, hand.indexOf('}, []);'));
  assertMatch(handBody, /setAutoCollapsed\(false\);/, "the hand's road never opened the tray");
});

ok("C3 — the dismissal retires with the loan it paid (the hand opens the tray itself)", () => {
  // 1.8.6 — THE HAND OPENS THE TRAY ITSELF: the dismissal retired with
  // the loan it paid (there is no loan left to dismiss), and every
  // manual road — the chip, a label toggle, the wake, the two pin roads —
  // speaks openTrayByHand, the page growing back with the tray's flight.
  assertMatch(cv, /1\.8\.6 — THE HAND OPENS THE TRAY ITSELF/, "the hand's-road note never spoke");
  assert.ok(!cv.includes('const dismissSeatDebt'), 'the dismissal survived its retirement');
  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));
  const handBody = hand.slice(0, hand.indexOf('}, []);'));
  assertMatch(handBody, /if \(nameOpenAtFoldRef\.current\) \{/, "the hand's road never asked for the name back");
  assertMatch(handBody, /setAutoCollapsed\(false\);/, "the hand's road never opened the tray");
  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));
  assertMatch(exp.slice(0, 400), /openTrayByHand\(\);/, "the chip's road never joined the hand");
  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));
  assertMatch(tog.slice(0, 500), /openTrayByHand\(\);/, "a label toggle's road never joined the hand");
  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));
  assertMatch(wake.slice(0, 900), /openTrayByHand\(\);/, "the panel's wake never joined the hand");
  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);
  const pinReturns = pinSegs.filter((seg) => {
    const near = seg.slice(0, 620);
    return near.includes('if (!rowsPinned) {') && near.includes('openTrayByHand();');
  }).length;
  assert.ok(pinSegs.length === 2 && pinReturns === 2, `the pin roads never joined the hand (found ${pinReturns} of ${pinSegs.length})`);
});

ok("C4 — the column reads the header alone (the seat's sum retired with the seat)", () => {
  // 1.8.6 — THE SILENT ASCENT: the header-plus-debt sum retired with the
  // seat it summed — the column reads the header's own live height, and
  // through a flow-road fold it rides the same tween the header speaks.
  assertMatch(cv, /setHeadH\(Math\.round\(el\.offsetHeight\)\)/, 'the column never read the header alone');
  assert.ok(!cv.includes('col.style.top'), "the old same-stroke column write survived — the column's seat is still being moved by hand");
});

console.log('\nD. THE TWEEN SEATS (the 0.39.0 breath, restored — the snap retires with the fight it fled)');

ok('D1 — the rows body tweens on every road (no snap branch survives)', () => {
  const m = /animate=\{autoCollapsed \? \{ height: 0, opacity: 0 \} : \{ height: 'auto', opacity: 1 \}\}[\s\S]{0,900}?transition=\{\{ duration: 0\.24, ease: \[0\.25, 0\.9, 0\.35, 1\] \}\}/.exec(cv)?.[0] || '';
  assert.ok(m.length > 0, 'the always-tween transition never spoke');
  assert.ok(!cv.includes('foldSnap ? { duration: 0 }'), 'the foldSnap branch survived the payer era');
  assert.ok(!cv.includes('foldSnapTimerRef'), 'the foldSnap clock survived the payer era');
});

ok('D2 — the tray class list carries no snap seat (and the name keeps only its mount-measure snap)', () => {
  assertMatch(cv, /className=\{clsx\(\s*'gd-rows-tray',\s*\n\s*autoCollapsed && 'gd-rows-folded'/, 'the tray class list never spoke its two seats');
  const trayCls = cv.slice(cv.indexOf("className={clsx(\n            'gd-rows-tray',"));
  const trayBody = trayCls.slice(0, trayCls.indexOf('onPointerEnter'));
  assert.ok(!trayBody.includes('foldSnap'), 'the tray class list still carries a third class');
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  assertMatch(cv, /transition=\{foldFirstLandingRef\.current \? \{ duration: 0 \} : \{ duration: 0\.24, ease: \[0\.25, 0\.9, 0\.35, 1\] \}\}/, 'the name lost its mount-measure snap');
});

ok('D3 — the is-snap law stands as its own tombstone', () => {
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tombstone never spoke');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(m, /transition: none !important;/, 'the tombstone never stills the tray');
});

ok('D4 — the seat JSX tells its retirement (the tombstone keeps its CSS seat)', () => {
  // 1.8.6 — THE SILENT ASCENT: the seat element left the tree with the
  // debt it held; the JSX tombstone + the CSS law keep its seat as the
  // law it used to be (the is-snap precedent).
  assertMatch(cv, /THE SEAT LEFT WITH THE RESTORES IT SERVED/, "the seat's retirement never spoke");
  assert.ok(!cv.includes('ref={rowsSeatRef}'), 'the seat element survived its retirement');
  const seatLaw = /\.gd-rows-seat \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(seatLaw.length > 0, 'the seat law never spoke in css');
  assertMatch(seatLaw, /height: 0;/, 'the seat never rests at zero');
});

console.log('\nE. THE SWAP FLIGHT READS THE PRESS BREATH ("snap to the very top and then snap back")');

ok('E1 — the press-time origins are measured pre-commit', () => {
  assertMatch(pe, /const flipOriginsRef = useRef\(null\); \/\/ partId -> press-time top/, 'the press-time origins never declared their seat');
  assertMatch(pe, /1\.8\.5 — THE PRESS-TIME ORIGINS/, 'the press-time note never spoke');
  assertMatch(pe, /1\.8\.5 — THE ORIGINS ARE MEASURED IN THE PRESS BREATH/, 'the movePart note never spoke');
  const mv = pe.slice(pe.indexOf('const movePart = (partId, dir) => {'));
  const body = mv.slice(0, mv.indexOf('const deletePart'));
  assertMatch(body, /const origins = new Map\(\);/, 'the press measure never declared its map');
  assertMatch(body, /flipOriginsRef\.current = origins\.size \? origins : null;/, 'the press measure never took its seat');
  assert.ok(body.indexOf('onSetParts(next)') > body.indexOf('flipOriginsRef.current = origins.size'), 'the origins were not read BEFORE the commit');
});

ok('E2 — the flight reads the press origins (the mount-memory map is retired)', () => {
  const fx = pe.slice(pe.indexOf('useLayoutEffect(() => {'));
  const body = fx.slice(0, fx.indexOf('const flashPair ='));
  assertMatch(body, /const origins = flipOriginsRef\.current;/, 'the flight never read the press origins');
  assertMatch(body, /if \(origins && targets\) \{/, 'the flight gate never spoke');
  assertMatch(pe, /flipOriginsRef\.current = null;/, 'the flight never cleared its origins');
  assert.ok(!pe.includes('prevTopsRef'), 'the mount-memory map survived the press law');
});

ok('E3 — the scroller lookup covers BOTH mounts', () => {
  const lookup = "el.closest('.gd-tex-panel') || el.closest('.gd-tex-viewer') || null";
  assert.ok(pe.split(lookup).length - 1 === 2, `the widened lookup speaks ${pe.split(lookup).length - 1} times — the flight and the press are the whole word`);
});

console.log('\nF. THE SELECTED OUTLINE OUT-RANKS EVERY HOVER ("the highlighted selected outline dissapears")');

ok('F1 — the :has family doubles its own class (the honest weight lift)', () => {
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{[\s\S]*?border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the doubled plain family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the doubled colored family never spoke');
  // the boundary lookbehind: the DOUBLED form contains the undoubled
  // selector as a substring (".gd-part-row.gd-part-row:has(" carries
  // ".gd-part-row:has(" inside it) — only a selector that STARTS a compound
  // (line head, space, or a brace before it) is the undoubled law.
  assert.ok(!/(?<![\w.-])\.gd-part-row:has\(\.gd-prompt-box:focus\)/.test(cssLaws), 'the undoubled plain family survived');
  assert.ok(!/(?<![\w.-])\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\)/.test(cssLaws), 'the undoubled colored family survived');
});

ok('F2 — the tie that was still speaks (the deep hover keeps its seat, answering the hand now)', () => {
  // 1.8.6 — THE OUTLINE ANSWERS THE HAND: the deep hover keeps its seat
  // but changed its word — the raw color (the face itself at 1:1, the
  // outline gone) became the ink-rung gather, so the unselected outline
  // reads and REACTS under the pointer exactly as the report asks.
  assertMatch(css, /1\.8\.5 — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER/, 'the 1.8.5 outline note never spoke');
  assertMatch(css, /1\.8\.6 — THE OUTLINE ANSWERS THE HAND/, 'the 1.8.6 outline note never spoke');
  const deepHover = /\.gd-part-row\.is-colored\.is-shade-deep:hover \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(deepHover.length > 0, 'the deep hover law never spoke (the tie the family had to out-rank)');
  assertMatch(deepHover, /border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 50%, var\(--part-ink, var\(--gd-ink\)\)\);/, 'the deep hover never gathered toward the ink rung');
  assertMatch(deepHover, /box-shadow: 2\.5px 2\.5px 0 color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 62%, #0e0e0e\);/, 'the deep hover never firmed its shadow');
});

console.log('\nG. THE VERSION FURNITURE');

ok('G1 — the version is 1.8.5 everywhere', () => {
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

ok('G2 — the previous entry keeps its own seat (each version keeps its release)', () => {
  assertMatch(changelog, /^## 1\.8\.4 — The Cover/m, 'the 1.8.4 entry lost its seat');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.4">release page<\/a>/, 'the 1.8.4 row lost its own release link');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
