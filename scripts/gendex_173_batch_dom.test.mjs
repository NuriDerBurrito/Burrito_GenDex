// 1.6.9 batch — The Fifteen Answers.
// (Named 173 in the sequence: 170 -> 1.6.5, 171 -> 1.6.7, 172 -> 1.6.8.)
// The reported items, each pinned at its root law:
//   A.  THE WALL'S SLOT IS ITS OWN FINAL INDEX (the lanes + column walls' row
//       targeting; no more one-row-off commits)
//   B.  THE COLUMN WALL READS THE ROW FIRST (the stamps' own bands)
//   C.  THE HYSTERESIS ARM + THE FRESH-SEAT DROP (the grid's multiple-turn
//       shuffle and the release shift)
//   D.  THE GHOST RETIRES WITH THE PREVIEW (the still board keeps no miniature)
//   E.  THE PULSE IS ONE PULSE (the shine's single swell)
//   F.  THE CHIPLINE CHIP CENTERS ON THE LINE (left/top die with the flip)
//   G.  THE RECOVERY IS A FLIGHT (the keyed family's springy return)
//   H.  THE PILL NEVER CLIPS THE BOTTOM (the tooltip's viewport floor)
//   I.  THE EMPTY SEATS BREATHE (no parts yet — shortened + faded)
//   J.  THE CHANGED TAGS CROSSFADE THEIR COLORS (the color seats + the
//       shared-state chips never move)
//   K.  THE DATE + THE ARROWS BREATHE TOO
//   L.  THE NEW VERSION KEY GLIDES BETWEEN ITS SEATS (the transform-blind FLIP)
//   M.  THE BAR SPEAKS THE FLIGHT + THE SKIPPED CHIP (the bottom panel's
//       content fade + the EMPTY SKIPPED ledger)
//   N.  THE OVER-TRIM COAT LEAVES THE STAMP AREA ALONE (the band mask)
//   O.  THE VIEW IS MEMO'D (the stable handles + the skip)
// Plus the version furniture (1.6.9 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};
assert.ok = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
const assertMatch = (hay, re, msg) => {
  if (!re.test(hay)) throw new Error(msg || 'pattern missing');
};

const sortSrc = src('src/components/useThumbSort.js');
const gridSrc = src('src/components/GridView.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const appSrc = src('src/App.jsx');
const cssSrc = src('src/index.css');
const tipSrc = src('src/components/GdTooltips.jsx');
const partSrc = src('src/components/PartEditor.jsx');
const constsSrc = src('src/constants/index.js');
const pkgSrc = src('package.json');
const modalSrc = src('src/components/Modal.jsx');
const viewSrc = src('src/components/ImageViewer.jsx');
const ctlSrc = src('src/components/CardStyleControls.jsx');
const peSrc = src('src/components/PartEditor.jsx');

console.log('\nA. THE WALL\'S SLOT IS ITS OWN FINAL INDEX ("moving tags issue … fix that so it corresponds to its own row")');
ok('A1 — the wall commit splices at the slot itself', () => {
  assertMatch(sortSrc, /to = clampIndex\(wallCtx \? ins : finalIndexOf\(drag\.from, ins\)\);/, 'the wall branch never spoke');
  assertMatch(sortSrc, /THE WALL'S SLOT IS ITS OWN FINAL INDEX/, 'the law never spoke its name');
  // the plain strips keep the classic conversion
  assertMatch(sortSrc, /finalIndexOf\(drag\.from, ins\)\)/, 'the classic conversion died');
});
ok('A2 — the lanes row-first law survives (the 1.6.5 verdict keeps its seats)', () => {
  assertMatch(sortSrc, /THE LANES VERDICT READS THE ROW FIRST/, 'the lanes law left');
  assertMatch(sortSrc, /const rrLane = count % R;/, 'the rr lane died');
});

console.log('\nB. THE COLUMN WALL READS THE ROW FIRST ("the tag issue has also moved to stamps")');
ok('B1 — the column wall owns its own bands', () => {
  assertMatch(sortSrc, /THE COLUMN WALL READS THE ROW FIRST/, 'the law never spoke its name');
  assertMatch(sortSrc, /if \(!rowMajor\) \{\s*\n\s*const rrRow = count % R;/, 'the column bands never armed');
  assertMatch(sortSrc, /const slot = row === rrRow \? rects\.length : q;/, 'the row end gap lost its slot');
});

console.log('\nC. THE HYSTERESIS ARM + THE FRESH-SEAT DROP ("shuffle on multiple turns … or let go")');
ok('C1 — the arm-point memory + the 12px gate', () => {
  assertMatch(gridSrc, /const armPtRef = useRef\(null\); \/\/ \{ x, y \} — the seat where the current preview armed/, 'the arm-point never lived');
  assertMatch(gridSrc, /dragPreviewRef\.current &&\s*\n\s*armPt &&[\s\S]*?Math\.abs\(e\.clientX - armPt\.x\) < 12 &&\s*\n\s*Math\.abs\(e\.clientY - armPt\.y\) < 12/, 'the travel gate never spoke');
});
ok('C2 — a traveling release re-derives the seat it lands on', () => {
  assertMatch(gridSrc, /THE FRESH-SEAT DROP/, 'the law never spoke its name');
  assertMatch(gridSrc, /Math\.abs\(e\.clientX - lastPt\.x\) > 4 \|\| Math\.abs\(e\.clientY - lastPt\.y\) > 4/, 'the travel read died');
  assertMatch(gridSrc, /seat = \{ over: id, side: rel < 0\.5 \? 'left' : 'right' \};/, 'the fresh seat never landed');
});

console.log('\nD. THE GHOST RETIRES WITH THE PREVIEW ("i turn off live drag preview but it still works")');
ok('D1 — the miniature is born on EVERY drag (the preview gates the switching alone — 1.8.2)', () => {
  assertMatch(gridSrc, /THE GHOST RETIRES WITH THE PREVIEW/, 'the law never spoke its name');
  // 1.8.2 — the pull outlives the preview: the gate's livePreviewRef term rides off
  // (the switch is the dynamic switching alone; the faded miniature rides every drag).
  assertMatch(gridSrc, /if \(layW > 4 && layH > 4 && typeof card\.cloneNode === 'function'\)/, 'the ghost gate never spoke (1.8.2: the miniature rides every drag — live board or still)');
});

console.log('\nE. THE PULSE IS ONE PULSE ("pulse shine style should be one time not two pulses")');
ok('E1 — one swell, no second rise', () => {
  const m = cssSrc.match(/@keyframes gd-shine-pulse \{[\s\S]*?\n\}/);
  assert.ok(m, 'the pulse keyframes left');
  // strip the explanatory comment — the LAW lives in the stops alone
  const body = m[0].replace(/\/\*[\s\S]*?\*\//g, '');
  const stops = [...body.matchAll(/(\d+(?:\.\d+)?)% \{/g)].map((x) => Number(x[1])).sort((a, b) => a - b);
  assert.ok(stops.length >= 3, 'the swell never spoke');
  // one swell: exactly ONE stop above 0.9 opacity, and none between the peak and the end
  const peaks = [...body.matchAll(/(\d+(?:\.\d+)?)% \{\s*\n\s*opacity: ([\d.]+)/g)].map((x) => ({ at: Number(x[1]), op: Number(x[2]) }));
  const high = peaks.filter((p) => p.op >= 0.9);
  assert.equal(high.length, 1, 'the swell peaks more than once');
  assert.ok(high[0].at < 55, 'the single peak sits too late');
  assert.ok(!peaks.some((p) => p.op > 0.45 && p.at > high[0].at), 'a second rise survived');
});

console.log('\nF. THE CHIPLINE CHIP CENTERS ON THE LINE ("collapse and expand button is pushed to the right")');
ok('F1 — the relative offsets die with the flip', () => {
  assertMatch(cssSrc, /\.gd-rows-chipline \.gd-rows-expand \{[\s\S]*?left: auto;\s*\n\s*top: auto;/, 'the offsets never died');
  assertMatch(cssSrc, /THE RELATIVE OFFSETS DIE TOO/, 'the law never spoke its name');
});

console.log('\nG. THE RECOVERY IS A FLIGHT ("after i click, the recovery animation feels like just a snap")');
ok('G1 — the keyed family speaks the springy return', () => {
  assertMatch(cssSrc, /transition: border-color 0\.12s ease, background-color 0\.12s ease, transform 0\.22s cubic-bezier\(0\.34, 1\.56, 0\.64, 1\),/, 'the base recovery never spoke');
  assertMatch(cssSrc, /\.gd-btn:active \{[\s\S]*?transition: transform 0\.08s ease-out/, 'the quick press died');
  assertMatch(cssSrc, /\.gd-icon-btn:hover \{[\s\S]*?transform: translateY\(-1px\);/, 'the ghost keys never lifted');
});

console.log('\nH. THE PILL NEVER CLIPS THE BOTTOM ("some tooltips clip to the bottom")');
ok('H1 — the below seat clamps to the viewport floor', () => {
  assertMatch(tipSrc, /THE PILL NEVER CLIPS THE WINDOW'S BOTTOM/, 'the law never spoke its name');
  assertMatch(tipSrc, /const maxTop = Math\.max\(TOP_FLOOR, \(window\.innerHeight \|\| 800\) - cachedH - 8\);/, 'the floor clamp never spoke');
});

console.log('\nI. THE EMPTY SEATS BREATHE ("fade also the no parts yet area … shorten it to no parts yet")');
ok('I1 — the short label + the seat', () => {
  assertMatch(partSrc, /gd-parts-empty/, 'the empty seat never took its name');
  assertMatch(partSrc, /No parts yet\s*<\/span>/, 'the short label never spoke');
  assert.ok(!/split this version's prompt into named pieces/.test(partSrc), 'the long label survived');
  assertMatch(cssSrc, /\.gd-cv-swap \.gd-parts-empty,/, 'the empty seat never joined the flight');
});

console.log('\nJ. THE CHANGED TAGS CROSSFADE THEIR COLORS ("the colors themselves to be the faded ones")');
ok('J1 — the changed chips alone animate, structure solid', () => {
  assertMatch(cvSrc, /setTagSwapOldActive\(prevChar && Array\.isArray\(prevChar\.tags\) \? new Set\(prevChar\.tags\) : null\);/, "the old card's set never armed");
  assertMatch(cvSrc, /colorSwap && 'is-swap-colorfade'/, 'the colorfade class never spoke');
  assertMatch(cssSrc, /@keyframes gd-tag-color-swap \{[\s\S]*?--gd-swap-old-face/, 'the color keyframes died');
  assert.ok(!/\.gd-cv-swap \.gd-rows-tray \.gd-tag-chip,/.test(cssSrc), 'the wholesale chip fade survived');
});

console.log('\nK. THE DATE BREATHES, THE ARROWS STAY SOLID (1.7.1: "dont make the left and right arrow buttons fade with the card switch feedback")');
ok('K1 — the date joins the flight alone; the arrows keep their chrome', () => {
  assertMatch(cvSrc, /gd-cv-date/, 'the date never took its name');
  assertMatch(cssSrc, /\.gd-cv-swap \.gd-cv-date,/, 'the date seat never joined');
  assert.ok(!/\.gd-cv-swap \.gd-flow-arrow/.test(cssSrc), 'the arrows still ride the card-switch fade (1.7.1: they stay solid)');
  assert.ok(!/@keyframes gd-cv-arrow-swap/.test(cssSrc), 'the retired arrow keyframes survived');
});

console.log('\nL. THE NEW VERSION KEY GLIDES ("animate the new version button to go left or right")');
ok('L1 — the transform-blind FLIP', () => {
  assertMatch(cvSrc, /const x = key\.offsetLeft;/, 'the FLIP never measured the layout seat');
  assertMatch(cvSrc, /verKeyRef = useRef\(null\);/, 'the key seat never lived');
  assertMatch(cvSrc, /key\.style\.transition = 'none';\s*\n\s*key\.style\.transform = `translateX\(\$\{Math\.round\(prev - x\)\}px\)`;/, 'the FLIP paint never spoke');
  assertMatch(cvSrc, /THE SEAT IS TRANSFORM-BLIND/, 'the measured-live lesson never spoke its name');
});

console.log('\nM. THE BAR SPEAKS THE FLIGHT + THE SKIPPED CHIP ("add the fade feedback … to the bottom composed output panel")');
ok("M1 — the bar\'s own swap class + seats", () => {
  assertMatch(appSrc, /gd-ob-swap/, 'the bar never spoke the flight');
  assertMatch(cssSrc, /\.gd-ob-swap \.gd-chip-flat,/, 'the chip seat never joined');
  assertMatch(cssSrc, /\.gd-ob-swap pre,/, 'the output seat never joined');
  assert.ok(!/\.gd-ob-swap \.gd-output-bar/.test(cssSrc), 'the container faded anyway');
});
ok("M2 — the ledger wears the sheet\'s own chips + the skipped counter", () => {
  assertMatch(appSrc, /gd-output-full-stats gd-compose-stats/, 'the ledger never wore the chips');
  assertMatch(appSrc, /stats\.skipped > 0 && \(\s*\n\s*<span className="gd-compose-stat is-accent">/, 'the skipped chip never spoke');
});

console.log('\nN. THE TRIM EFFECT WEARS THE TRIM\'S OWN RING (1.7.2: "it just looks like a lazy box... fix that so it applies to the trim perfectly (ignore stamp...)")');
ok('N1 — the ring RETIRED, the trim wears itself (1.7.4); the rail + the plate keep their masked seats', () => {
  const cssLaws = cssSrc.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/gd-has-stampart/.test(cssLaws), 'the stamp-art scope survived the retirement');
  assertMatch(cssLaws, /\.gd-fin-on-trim \.gd-card-face-finish\.is-plate-only\.is-over-trim \{\s*\n\s*z-index: 4;/, 'the veiled coat never lifted over the trims (the 1.7.1 z fix, kept)');
  // 1.7.4 — THE SYNTHETIC RING IS RETIRED, THE TRIM WEARS ITSELF ("the
  // trim effect isnt perfect on the trims, it just does an area"): the
  // 1.7.3 four-layer composite (the content-box CORE + the FULL box's
  // subtract) left with the ring it painted — TrimCoatLayer clones the
  // card's own trim re-inked in the finish's signature ink instead, and
  // the washes keep the PLATE + the SEAM RAIL alone (two plain unions).
  // 1.7.5 — THE SEAM RAIL RETIRES TOO (the plate alone below the art
  // line; the clone speaks the trim's own bottom rails — see the 1.7.5
  // note in index.css): the mask is ONE layer, one plain cut.
  const rule = cssLaws.slice(
    cssLaws.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {'),
    cssLaws.indexOf('}', cssLaws.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {'))
  );
  // 1.7.9 supersede — THE WASH SPEAKS THE FAMILY'S OWN SHAPE ("its not
  // accounting for the trim's shape and the gabs that it has"): the
  // uniform ring band retired for good — every family carries its OWN
  // mask now (unioned with the plate, no composite anywhere) and the
  // base rule is the plate alone.
  assert.ok(!/content-box/.test(rule), 'the 9px-inset core survived the family-shape retirement');
  assert.ok(!/--gd-trim-reach/.test(rule), 'the ring-reach padding survived the retirement');
  assert.ok(!/mask-composite/.test(rule), 'the composite list survived the family-shape retirement');
  assert.ok(
    cssLaws.includes('.gd-fin-on-trim:has(.gd-trim-dash) .gd-card-face-finish.is-plate-only.is-over-trim {'),
    'the family masks never spoke'
  );
  assert.ok(!/- 12px/.test(rule), 'the rail\'s soft shoulder survived the 1.7.5 retirement');
  assertMatch(rule, /-webkit-mask-image: linear-gradient\(/, 'the plate-alone mask never spoke');
  assert.ok(!/calc\(var\(--gd-art-h\) - 12px\)/.test(rule), 'the seam rail survived the 1.7.5 retirement');
  assert.ok(!/calc\(var\(--gd-art-h\) - 9px\)/.test(rule), 'the rail band survived the 1.7.5 retirement');
  assertMatch(rule, /rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\),\s*\n\s*#000 calc\(var\(--gd-art-h\) - 0\.5px\)/, 'the plate never spoke (from the art line down)');
  assertMatch(cssLaws, /\.gd-trim\.gd-trim-coat \{\s*\n\s*z-index: 4;\s*\n\}/, 'the coat clone never took its rung');
  assert.ok(!/linear-gradient\(to right, #000 0, #000 6%/.test(cssSrc), 'the 1.7.1 rim strips survived');
  assert.ok(!/ellipse 46%/.test(cssSrc), 'the 1.7.1 logos column survived');
});

console.log('\nO. THE VIEW IS MEMO\'D ("do fix that long delay issue")');
ok('O1 — the memo + the stable handles', () => {
  assertMatch(cvSrc, /export default memo\(CharacterView\);/, 'the view never took the memo');
  assertMatch(appSrc, /const openTagManagerWindow = useCallback\(\(\) => \{/, 'the stable handles never lived');
  assertMatch(appSrc, /onEditCard=\{editPanelCard\}/, 'the panel mount kept its inline closure');
});

console.log('\nQ. THE 1.7.1 LAWS ("the one breath — eight answers")');
ok('Q1 — the back closes as one breath, with the goodbye on the BODY (1.7.2)', () => {
  assertMatch(appSrc, /retractNonceRef\.current \+= 1;\s*\n\s*setRetractRequest\(retractNonceRef\.current\);\s*\n\s*\/\* 1\.7\.\d[\s\S]*?armCoverRetract\(\);\s*\n\s*setPanelCharacterId\(null\);/, 'the concurrent close never spoke (nonce + the body seat + the id in the same tick)');
  assertMatch(appSrc, /document\.body\.classList\.add\('gd-cover-retract'\);/, 'the goodbye never seated on the body (the exiting bar\'s framer snapshot never saw the nonce — the 1.7.1 prop road was dead, live-probed)');
  assertMatch(cssSrc, /body\.gd-cover-retract \.gd-output-full \{\s*\n\s*animation: gd-cover-out 0\.15s ease-out forwards;/, 'the body-scoped retract flight never spoke');
  assertMatch(cssSrc, /@keyframes gd-cover-out \{[\s\S]*?transform: translateY\(28px\);/, 'the retract keyframes lost the settle');
  assertMatch(appSrc, /THE COVER JOINS THE HOUSE CLOCK[\s\S]*?transition=\{\{ duration: 0\.15, ease: 'easeOut' \}\}/, 'the cover left the 1.4.8 house clock');
});
ok('Q2 — the tag colors DEPART on the first frame (the expo-out cross; the pour widened in 1.7.4)', () => {
  // 1.7.4 — THE POUR WIDENS ("have the color inside of all fade"): the
  // window arms EVERY chip now, so the clock rises 0.1s -> 0.14s (still
  // expo-out, still inside the 190ms ceremony window) — a room full of
  // pours reads as color arriving, not as one blink.
  // 1.7.5 — THE POUR TAKES ITS TIME: 0.24s, still expo-out (the cross
  // still departs on the first frame — the 1.7.2 law, kept)
  assertMatch(cssSrc, /animation: gd-tag-color-swap 0\.15s cubic-bezier\(0\.16, 1, 0\.3, 1\);/, 'the color cross lost its instant departure (the expo-out curve is the 1.7.2 law, kept)');
});
ok('Q3 — the containers speak neumorphic depths (the 1.7.2 seat law; the ladder graduated in 1.7.3)', () => {
  const helpersSrc = readFileSync(path.join(root, '..', 'src/utils/helpers.js'), 'utf8');
  assertMatch(helpersSrc, /deep\s*\n\s*\? raw\s*\n\s*: mixHex\(raw, '#ffffff', 1 - \(0\.2 \+ 0\.34 \* lum\)\);/, 'the face law kept its slab');
  // 1.7.4 — THE LADDER EARNS ITS RUNGS BY CONTRAST ("colors such as pink
  // and such blend in too much"): the 1.7.3 fixed-percent steps (8% /
  // 24% around a cliff-named anchor) left with the measured walk — every
  // rung climbs to a TARGET CONTRAST (title 1.35:1, well 1.8:1, the new
  // --part-line outline ink 1.45:1), the anchor is whichever extreme
  // separates by measurement, and the ink is measured against every rung.
  assertMatch(helpersSrc, /function partStepToContrast\(base, toward, target, against\)/, 'the contrast walk never spoke');
  assertMatch(helpersSrc, /const title = partStepToContrast\(face, anchor, 1\.35, face\);/, 'the title rung never earned its contrast');
  assertMatch(helpersSrc, /const well = partStepToContrast\(face, anchor, 1\.8, face\);/, 'the well rung never earned its contrast');
  assertMatch(helpersSrc, /\['--part-title'\]: title,/, 'the title var never left the ladder');
  assertMatch(cssSrc, /\.gd-part-row\.is-colored \.gd-rt-edit \{\s*\n\s*background: var\(--part-title/, 'the title field kept the white theme box');
  assertMatch(cssSrc, /\.gd-part-row\.is-colored \.gd-notes-cap \{/, "the notes' cap never read the face");
  assertMatch(cvSrc, /partContainerFace\(version\.notesColor, version\.notesColorShade === 'deep'\)/, "the notes box never threaded the face");
});
ok('Q4 — the tag manager crops into its own scroller', () => {
  const tmSrc = readFileSync(path.join(root, '..', 'src/components/TagManagerModal.jsx'), 'utf8');
  assertMatch(tmSrc, /grid-rows-\[minmax\(0,1fr\)\]/, 'the row never received the ceiling');
  assertMatch(tmSrc, /flex flex-col min-h-0 min-w-0/, 'the columns kept min-height auto');
});
ok('Q5 — the pulse carries the sweep\'s own rhythm (the 1.7.3 re-entry law rides it)', () => {
  assertMatch(gridSrc, /const SHINE_PULSE_CYCLE = 2200;/, 'the 2.2s cycle never spoke');
  // 1.7.3 — the ENTRY WINDOW retired: a fresh re-hover arms the moment
  // the flight is done (the is-live branch refuses only in-flight
  // re-entries); the continuous-hover heartbeat keeps the cycle.
  assert.ok(!/if \(pulseAt && Date\.now\(\) - pulseAt < SHINE_PULSE_CYCLE\) return;/.test(gridSrc), 'the 2.2s entry window survived the retirement');
  assertMatch(gridSrc, /THE ENTRY WINDOW RETIRES/, 'the re-entry law never spoke its name');
  assertMatch(gridSrc, /host\._gdPulseRest = setTimeout\(/, 'the retire never scheduled its re-arm');
});
ok('Q6 — the UI MOTION text speaks its true scope', () => {
  const setSrc = readFileSync(path.join(root, '..', 'src/components/SettingsModal.jsx'), 'utf8');
  assertMatch(setSrc, /The heavy movement lands instantly: the panel\\u2019s opening curtain, the cards\\u2019 layout glides and the finish coats\\u2019 animation\. Fades, hover lifts and the rest of the motion keep running\./, 'the REDUCED text kept its lie');
  assertMatch(setSrc, /Panel curtain, card glides and finish coats land instantly; fades and hover lifts keep running/, 'the REDUCED key kept its lie');
});

console.log('\nR. THE 1.7.2 LAWS ("the trim\'s own ring — eleven answers")');
ok('R1 — the editor windows wear the color whole (the tint seat)', () => {
  assertMatch(cvSrc, /tint=\{\s*\n\s*version\?\.notesColor\s*\n\s*\? \{\s*\n\s*\['--part-color'\]: version\.notesColor,/, 'the notes window never threaded the tint');
  assertMatch(peSrc, /partContainerFace\(part\.color, deep\)/, 'the prompt window never threaded the tint');
  assertMatch(modalSrc, /tint && 'is-part-tinted'/, 'the modal card never took the tint class');
  assertMatch(cssSrc, /\.gd-modal-card\.is-part-tinted \{\s*\n\s*background: var\(--part-face, var\(--gd-panel\)\);/, 'the window never wore the face');
  assertMatch(cssSrc, /\.gd-modal-card\.is-part-tinted \.gd-prompt-stage\.is-colored,\s*\n\.gd-modal-card\.is-part-tinted \.gd-notes-stage\.is-colored \{\s*\n\s*background: var\(--part-well, var\(--part-face\)\);/, 'the stage never stepped to the well');
});
ok('R2 — the stage\'s rail sits inside the frame ("the border highlight is above it")', () => {
  assert.ok(!/\.gd-prompt-stage\.is-colored[\s\S]{0,220}?border-left-color/.test(cssSrc), 'the stage still REPLACed its left border');
  // 1.7.6 — the spine is the LIGHTEST ELEMENT now (the climb toward
  // white; the 92% mix retired with the anchor-walk)
  assertMatch(cssSrc, /inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)/, 'the rail never climbed toward white');
});
ok('R3 — the corner chip is the dashed circle again (the squared seat retired)', () => {
  assert.ok(!/\.gd-part-color-chip::before/.test(cssSrc), 'the squared seat survived the retirement');
  assertMatch(cssSrc, /\.gd-part-color-chip:hover \{\s*\n\s*transform: scale\(1\.18\);/, 'the expand lost its hover');
});
ok('R4 — the huge viewer owns the window from frame one', () => {
  assertMatch(viewSrc, /className="gd-imgview"/, 'the layer still rode the pop-in scale');
  assert.ok(!/gd-pop-in/.test(viewSrc.replace(/\/\*[\s\S]*?\*\//g, '')), 'the pop-in class still rode the layer');
  assertMatch(viewSrc, /exit=\{\{ opacity: 0 \}\}/, 'the exit fade left');
  assertMatch(cssSrc, /\.gd-imgview-img,\s*\n\.gd-imgview-hud,\s*\n\.gd-imgview-close \{\s*\n\s*animation: gd-imgview-in 0\.14s ease-out;/, 'the content fade never spoke');
});
ok('R5 — the flight truths live in refs (the memo staleness fix)', () => {
  assertMatch(gridSrc, /const livePreviewRef = useRef\(liveDragPreview\);\s*\n\s*livePreviewRef\.current = liveDragPreview;/, 'the setting never moved into the ref');
  assertMatch(gridSrc, /const visibleRef = useRef\(visible\);\s*\n\s*visibleRef\.current = visible;/, 'the visible order never moved into the ref');
  assertMatch(gridSrc, /const expandedIdsRef = useRef\(expandedIds\);\s*\n\s*expandedIdsRef\.current = expandedIds;/, 'the expanded seats never moved into the ref');
});
ok('R6 — the honest drag commit (the glow outranks a held preview)', () => {
  assertMatch(gridSrc, /const hasSpan2 = !!\(expandedIdsRef\.current && expandedIdsRef\.current\.size > 0\);/, 'the toggle guard never learned its span-2 scope');
  assertMatch(gridSrc, /seat = \{ over: mem\.over, side: mem\.side \};\s*\n\s*\}\s*\n\s*}/, 'the memory never outranked the held preview');
});
ok('R7 — the stamp effect option left the editors entirely', () => {
  assert.ok(!/stamp effect<\/span>/.test(ctlSrc), 'the stamp effect switch survived in an editor');
  const ctlLaws = ctlSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/onFinishOnStamp/.test(ctlLaws), 'the stamp prop survived the controls');
  assert.ok(!/finishOnStamp && 'gd-fin-on-stamp'/.test(gridSrc), 'the grid still armed the dead scope');
});

console.log('\nP. THE VERSION FURNITURE');
ok('P1 — the version is 1.6.9 everywhere', () => {
  const pkg = JSON.parse(pkgSrc);
  assert.equal(pkg.version, '1.9.19', 'package.json never spoke 1.6.9');
  assertMatch(constsSrc, /version: '1\.9\.19',/, 'constants never spoke 1.6.9');
  const log = readFileSync(path.join(root, '..', 'CHANGELOG.md'), 'utf8');
  assertMatch(log, /## 1\.9\.19 —/, 'the changelog never spoke 1.6.9');
});

console.log(`\n${passed} passed, ${failed} failed — ${failed ? 'FIX ABOVE' : 'ALL GREEN'}`);
process.exit(failed ? 1 : 0);
