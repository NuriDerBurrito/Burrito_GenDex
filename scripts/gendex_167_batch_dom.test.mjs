// 1.6.2 batch — The Gold Answers the Ink.
// (Named 167 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8, 165 -> 1.5.9, 166 -> 1.6.0.)
// The reported items (both lists, on the TRUE 1.6.0 body), each pinned at
// its root law:
//   A.  the swap flight finds its SEATS (content fades + descends; the tray
//       plate + header surface stay solid; no scrollbar can ever grow; the
//       arm retires on its own clock)
//   B.  THE TRIM COLOR PICKER (TrimOverlay's --trim-user + is-user, every
//       family's own law — the gold variablized, the scallop / beads /
//       rivet re-inked — the THEME DEFAULT road home, the commit lane)
//   C.  the vine engraving follows the theme's --trim-c ladder (its private
//       greens retired; only the gold keeps a palette)
//   D.  the coat gate silences the coat's WHOLE family (the three reach
//       switches grey under finishesHidden even on a card that wears one)
//   E.  the hue's own seat under the riding coat (the trim effect moves the
//       finish alone — one z-2 wash, the trim never smeared)
//   F.  the progressive ladders (the lightest tier paints first, the full
//       file cross-fades; the edit window's aspect + zoom keys ride the
//       thumb; the keys never leave the window — greyed, never gone)
//   G.  the shine never interrupts (the press/drag stills retired — no
//       chorus on release — and the light rides UNDER the tags)
//   H.  the ghost is born at the cursor (a coordinate-less birth never
//       paints stranded)
//   I.  the click flash dies in masonry HYSTERESIS (a mounted card only
//       leaves at triple the overscan)
//   J.  the drop hint speaks the whole rounded silhouette with a seeping
//       wash and its own arrive/depart flight (the leaving card retires it)
//   K.  the tooltip fades out (the class flip carries the exit; the press
//       keeps its instant law)
//   L.  the dropdown's goodbye speaks the entrance’s mirror (0.17s + settle)
//   M.  the lockout leaves with the farewell (the layer strips its own
//       marker the moment any close begins)
// Plus the version furniture and live jsdom passes (the trim picker through
// the real EDIT CARD window, the ghost's invisible birth, the lockout strip
// through the real Modal).

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
const okAsync = async (name, fn) => {
  try {
    await fn();
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
assert.match = (text, re, msg) => {
  if (!re.test(String(text))) throw new Error(msg || `expected ${re} in the text`);
};

const appSrc = src('src/App.jsx');
const modalSrc = src('src/components/Modal.jsx');
const masonrySrc = src('src/components/MasonryGrid.jsx');
const gridSrc = src('src/components/GridView.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const stageSrc = src('src/components/ImageStage.jsx');
const tipSrc = src('src/components/GdTooltips.jsx');
const popSrc = src('src/components/Popover.jsx');
const ncmSrc = src('src/components/NewCharacterModal.jsx');
const cssSrc = src('src/index.css');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const pkgSrc = src('package.json');
const lockSrc = src('package-lock.json');
const readmeSrc = src('README.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changeSrc = src('CHANGELOG.md');

// ---------------------------------------------------------------------------
// A. THE SWAP FLIGHT FINDS ITS SEATS (the 1.6.2 rework)
// ---------------------------------------------------------------------------
ok('A1 — the arm retires on its own clock (the root handler left with the root animation)', () => {
  assert.match(cvSrc, /swapCleanTimerRef\.current = setTimeout\(/, 'the retire clock is missing');
  assert.match(cvSrc, /\}, 190\);/, 'the retire clock speaks the wrong breath');
  // the root's own animationend retire is retired with it
  assert.ok(!/e\.animationName === 'gd-cv-swap'/.test(cvSrc), 'the old root retire law survived');
});
ok('A2 — the flight speaks on the CONTENT seats, never the scroller or the plate', () => {
  // 1.6.7 — THE PICTURE ALONE BREATHES: the owner's list ("i dont want
  // the buttons to fade, such as … and even the tags, stamps fade, text
  // fades, versions fade, etc..") retired every 1.6.2 seat — the flight's
  // one seat is the image column's pictures (.gd-stage-pictures, the
  // media crossfading alone; every button, label, tag, stamp, text and
  // version stays SOLID). The pins read the retirement + the new seat.
  assert.ok(!/\.gd-cv-swap > \*:not\(\.gd-char-head\)/.test(cssSrc), 'the retired scroller seat survived (1.6.7)');
  assert.ok(!/\.gd-cv-swap \.gd-char-head > \*:not\(\.gd-rows-tray\)/.test(cssSrc), 'the retired header seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-rows-body > \*/.test(cssSrc), 'the retired tray seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-rows-tray > \.gd-rows-sep\.is-holder/.test(cssSrc), 'the retired holder seat survived');
  assert.ok(/\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures,/.test(cssSrc), 'the pictures never found their seat (1.6.8: the content group)');
  // the whole-scroller law is GONE (the second scrollbar + the flicker both
  // lived on it)
  assert.ok(!/^\.gd-cv-swap \{$/m.test(cssSrc), 'the whole-scroller animation law survived');
});
ok('A3 — the flight is a PURE FADE (1.6.3: nothing descends — the still tray reads as one breath)', () => {
  const kf = cssSrc.match(/@keyframes gd-cv-swap \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(!kf.includes('translateY'), 'the settle survived the 1.6.3 pure-fade law (the exact report)');
  assert.ok(kf.includes('opacity: 0'), 'the fade never left');
});
ok('A4 — the re-arm idiom + the silent first mount survive the rework', () => {
  // 1.7.5 — the ceremony dances the tags' own tagflight class too (the
  // split-clocks law — see CharacterView's 1.7.5 note)
  assert.match(cvSrc, /el\.classList\.remove\('gd-cv-swap'\);[\s\S]*?el\.classList\.remove\('gd-cv-tagflight'\);\s*\n\s*void el\.offsetWidth; \/\/ reflow so the class flip animates\s*\n\s*el\.classList\.add\('gd-cv-swap'\);\s*\n\s*if \(showAllTags === false\) el\.classList\.add\('gd-cv-tagflight'\);/, 'the strip/reflow/re-add re-arm is missing');
  assert.match(cvSrc, /if \(prev == null \|\| prev === id\) return;/, 'the first mount must stay silent');
});

// ---------------------------------------------------------------------------
// B. THE TRIM COLOR PICKER (the trim's own ink)
// ---------------------------------------------------------------------------
ok('B1 — TrimOverlay carries the ink (--trim-user + is-user, validated once)', () => {
  assert.match(ribbonSrc, /export function TrimOverlay\(\{ trim, seamless = false, color = null \}\)/, 'the color prop never arrived');
  assert.match(ribbonSrc, /userInk && 'is-user'/, 'the is-user arm is missing');
  assert.match(ribbonSrc, /style=\{userInk \? \{ \['--trim-user'\]: userInk \} : undefined\}/, 'the --trim-user write is missing');
});
ok('B2 — the commit lanes: makeCharacter, the sanitizer, the EDIT CARD commit', () => {
  assert.match(constSrc, /cardTrimColor: isHexColor\(card\.trimColor\) \? card\.trimColor : null,/, 'the makeCharacter lane is missing');
  assert.match(helpersSrc, /cardTrimColor: isHexColor\(character\?\.cardTrimColor\) \? character\.cardTrimColor : null,/, 'the sanitize lane is missing');
  assert.match(appSrc, /cardTrimColor: isHexColor\(card\.trimColor\) \? card\.trimColor : null,/, 'the EDIT CARD commit lane is missing');
  assert.match(appSrc, /import \{[\s\S]*?isHexColor,[\s\S]*?\} from '\.\/utils\/helpers\.js';/, 'the isHexColor import never arrived');
});
ok('B3 — every family answers the ink through its own is-user law', () => {
  assert.match(cssSrc, /\.gd-trim\.is-user \{[\s\S]*?--trim-c: color-mix\(in srgb, var\(--trim-user\) 74%, var\(--gd-panel\)\);/, 'the line-family ladder never re-seats');
  assert.match(cssSrc, /\.gd-trim\.is-user\.gd-trim-gold \{[\s\S]*?--gld-hi: color-mix\(in srgb, var\(--trim-user\) 55%, #ffffff\);/, 'the gold never answered the picker');
  assert.match(cssSrc, /--gld-hi: #fff7cf;/, 'the gold default palette never variablized');
  assert.ok(/\.gd-trim\.is-user\.gd-trim-scallop/.test(cssSrc), 'the scallop never answered');
  assert.ok(/\.gd-trim\.is-user\.gd-trim-beads/.test(cssSrc), 'the beads never answered');
  assert.ok(/\.gd-trim\.is-user\.gd-trim-rivet/.test(cssSrc), 'the rivet never answered');
  // the gold's whole coat derives from the palette now
  assert.ok(/color-mix\(in srgb, var\(--gld-c\) 80%, var\(--gld-deep\)\)/.test(cssSrc), 'the gold cast band still speaks hardcoded ink');
});
ok('B4 — the picker door: one key, THEME DEFAULT, both windows + creation', () => {
  assert.match(lookSrc, /function TrimColorKey\(\{ color, onColor \}\)/, 'the key component is missing');
  assert.match(lookSrc, /THEME DEFAULT/, 'the road home is missing');
  assert.match(lookSrc, /gd-trimcolor-reset/, 'the quick reset key is missing');
  assert.match(lookSrc, /onTrimColor && \([\s\S]*?TrimColorKey color=\{trimColor\} onColor=\{onTrimColor\}/, 'the key never seated under the tiles');
  assert.match(ncmSrc, /const \[trimColor, setTrimColor\] = useState\(null\);/, 'the creation seat never drafted the ink');
  assert.match(ncmSrc, /trimColor=\{trimColor\}\s*\n\s*onTrimColor=\{setTrimColor\}/, 'the creation seat never threaded the door');
  assert.match(cvSrc, /const \[trimColor, setTrimColor\] = useState\(/, 'the EDIT CARD window never drafted the ink');
  assert.match(cvSrc, /onTrimColor=\{touch\(setTrimColor\)\}/, 'the EDIT CARD window never threaded the door');
  assert.match(cssSrc, /\.gd-trimcolor-key \{/, 'the key family CSS never arrived');
});

// ---------------------------------------------------------------------------
// C. THE VINE FOLLOWS THE THEME (its private greens retired)
// ---------------------------------------------------------------------------
ok('C1 — the vine ladder derives from --trim-c like its sibling trims', () => {
  // the ladder seat is the block that DECLARES the vine vars (the base rung
  // only consumes them with --trim-c fallbacks)
  const vine = cssSrc.match(/\.gd-trim-vine \{[\s\S]*?--vine-mid[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(vine.includes('--vine-mid: var(--trim-c);'), 'the vine still speaks its own green');
  assert.ok(vine.includes('--vine-hi: color-mix(in srgb, var(--trim-c) 58%, var(--gd-chrome));'), 'the vine highlight never joined the ladder');
  assert.ok(!cssSrc.includes('#6fae5f'), 'the private green survived somewhere');
});

// ---------------------------------------------------------------------------
// D. THE GATE SILENCES THE COAT'S WHOLE FAMILY
// ---------------------------------------------------------------------------
ok('D1 — the reach switches grey under the gate; the stamp effect retired wholesale (1.7.2)', () => {
  assert.match(styleSrc, /const coatSilent = noFinish \|\| finishesHidden;/, 'the coatSilent law is missing');
  assert.match(styleSrc, /disabled=\{coatSilent \|\| noImage\}/, 'the image effect switch escaped the gate');
  assert.match(styleSrc, /disabled=\{coatSilent\}/, 'the trim effect switch escaped the gate');
  const styleLaws = styleSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/disabled=\{coatSilent \|\| noStamp\}/.test(styleLaws), 'the retired stamp effect gate survived (1.7.2: "delete the stamp effect option")');
  assert.match(styleSrc, /Experimental finishes are off: the coat \(and everything it reaches\) is stilled/, 'the gate reason never speaks on hover');
});

// ---------------------------------------------------------------------------
// E. THE HUE'S OWN SEAT UNDER THE RIDING COAT
// ---------------------------------------------------------------------------
ok('E1 — the trim effect moves the finish alone (one z-2 wash, the trim never smeared)', () => {
  assert.match(gridSrc, /const coatOverTrim = cardFinish !== 'none' && cardFinishOnTrim;/, 'the coatOverTrim law is missing');
  assert.match(gridSrc, /hue && hueOver && !hueOverTrim && !coatOverTrim && \(/, 'the band wash never stood down under the riding coat');
  // 1.7.4 — THE UNDER-STAMP SEAT ("it shouldnt automatically make the hue
  // hover over the stamp"): the single DOM-later wash split into its two
  // switch halves — OFF renders BEFORE the band (under the logos), ON
  // renders after it with the is-over-stamp lift.
  assert.match(gridSrc, /hue && !hueOver && !hueOverTrim && coatOverTrim && \(bandStamps\.length > 0 \|\| freeStamps\.length > 0\)/, 'the under-stamp wash never seated');
  assert.match(gridSrc, /hue && hueOver && !hueOverTrim && coatOverTrim && \(bandStamps\.length > 0 \|\| freeStamps\.length > 0\)/, 'the over-stamp wash never seated');
  assert.match(gridSrc, /'gd-card-stamp-hue gd-hue-band-own', 'is-over-stamp'\)/, 'the wash class never arrived (1.7.4: the over seat carries the lift)');
  assert.match(cssSrc, /\.gd-card-stamp-hue\.gd-hue-band-own \{[\s\S]*?z-index: 2;/, 'the wash never took its under-trim rung');
  // the look windows speak the same law
  assert.match(lookSrc, /const coatOverTrim = finish !== 'none' && finishOnTrim;/, 'the preview never spoke the hue seat law');
});

// ---------------------------------------------------------------------------
// F. THE PROGRESSIVE LADDERS + THE KEYS THAT NEVER LEAVE
// ---------------------------------------------------------------------------
ok('F1 — every image seat climbs the ladder (the lightest tier paints first)', () => {
  const seats = (stageSrc.match(/img\.prev \|\| img\.thumb \|\| img\.file/g) || []).length;
  assert.ok(seats >= 2, 'the stage ladder lost a rung (got ' + seats + ')');
  assert.match(stageSrc, /image\.prev \|\| image\.thumb \|\| image\.file/, 'the stage placeholder never spoke the prev tier');
});
ok('F2 — the edit window’s own ladder (thumb feeds the aspect + the placeholder)', () => {
  assert.match(appSrc, /const lookCoverThumbUrl = useMemo\(\(\) => \{[\s\S]*?cover\.prev \|\| cover\.thumb \|\| cover\.file/, 'the App thumb tier is missing');
  assert.match(appSrc, /const lookCoverAspect = useImageAspect\(lookCoverThumbUrl \|\| lookCoverUrl\);/, 'the aspect never rode the thumb');
  assert.match(appSrc, /coverThumbUrl=\{lookCoverThumbUrl\}/, 'the window never received the thumb tier');
  assert.match(cvSrc, /imageThumbUrl=\{coverThumbUrl \|\| coverUrl\}/, 'the editor never received the thumb tier');
});
ok('F3 — the preview cross-fades the full file over its placeholder', () => {
  assert.match(lookSrc, /function useFullImgLoaded\(url\)/, 'the ladder’s top-rung tracker is missing');
  assert.match(lookSrc, /fullLoaded \? 'opacity-100' : 'opacity-0'/, 'the cross-fade never spoke');
  assert.match(lookSrc, /imageThumbUrl && imageThumbUrl !== imageUrl && \(/, 'the placeholder rung never painted');
});
ok('F4 — the zoom keys never leave the window (greyed, never gone)', () => {
  const zoom = lookSrc.match(/<div className=\{clsx\('gd-preview-zoom',[^>]*>/)?.[0] || '';
  assert.ok(zoom.length > 0, 'the zoom row lost its unconditional seat');
  assert.ok((lookSrc.match(/disabled=\{!imageUrl\}/g) || []).length >= 3, 'the three keys never greyed with the empty seat');
  assert.match(cssSrc, /\.gd-preview-zoom\.is-empty \.gd-btn \{/, 'the greyed face never arrived');
});

// ---------------------------------------------------------------------------
// G. THE SHINE NEVER INTERRUPTS
// ---------------------------------------------------------------------------
ok('G1 — the press/drag stills are retired (no chorus on release)', () => {
  assert.ok(!/classList\.add\('gd-card-drag'\)/.test(gridSrc), 'the drag still armed again');
  assert.ok(!/classList\.remove\('gd-card-drag'\)/.test(gridSrc), 'the drag still strip survived');
  assert.ok(!/:root\.gd-card-drag \.gd-card-shine::before/.test(cssSrc), 'the drag still law survived');
  assert.ok(!/\.gd-card:active \.gd-card-shine::before/.test(cssSrc), 'the press still law survived');
  assert.ok(!/\[data-pressed\] \.gd-card-shine::before/.test(cssSrc), 'the pressed still law survived');
  // the sweep itself survives (one pass per hover, its own end)
  assert.match(cssSrc, /\.gd-card-shine\.is-live::before,/, 'the is-live sweep law was lost in the retirement');
});
ok('G2 — the light rides UNDER the tags', () => {
  const shine = cssSrc.match(/\.gd-card-shine \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(shine.includes('z-index: 4;'), 'the shine never left the ribbons\u2019 rung (got ' + (shine.match(/z-index: (\d+)/) || [])[1] + ')');
});

// ---------------------------------------------------------------------------
// H. THE GHOST IS BORN AT THE CURSOR
// ---------------------------------------------------------------------------
ok('H1 — a birth without coordinates never paints stranded', () => {
  assert.match(gridSrc, /const birthHasPointer =/, 'the birth guard is missing');
  assert.match(gridSrc, /const DRAG_GHOST_FADE = '0\.55';/, 'the 1.8.1 fade constant never spoke');
  assert.match(gridSrc, /ghost\.style\.opacity = birthHasPointer \? DRAG_GHOST_FADE : '0';/, 'the invisible birth never spoke');
  assert.match(gridSrc, /ghost\.style\.opacity = DRAG_GHOST_FADE;/, 'the first true seat never lights the ghost');
  // the 1.6.0 layout-box law survives beneath it
  assert.match(gridSrc, /Math\.min\(1, 118 \/ layW\)/, 'the layout-box measurement was lost');
});

// ---------------------------------------------------------------------------
// I. THE CLICK FLASH DIES IN HYSTERESIS
// ---------------------------------------------------------------------------
ok('I1 — a mounted card only leaves at triple the overscan', () => {
  assert.match(masonrySrc, /const UNMOUNT_OVERSCAN = OVERSCAN \* 3;/, 'the unmount margin never widened');
  assert.match(masonrySrc, /const mounted = itemEls\.current\.has\(id\);/, 'the mounted read is missing');
  assert.match(masonrySrc, /const margin = mounted \? UNMOUNT_OVERSCAN : OVERSCAN;/, 'the two-margin window never spoke');
});

// ---------------------------------------------------------------------------
// J. THE DROP HINT SPEAKS THE WHOLE SILHOUETTE
// ---------------------------------------------------------------------------
ok('J1 — the hint stays mounted, voiced by side classes, retired by the leaving card', () => {
  assert.match(gridSrc, /'gd-drop-edge',\s*\n\s*dropSide === 'left' && 'is-left',\s*\n\s*dropSide === 'right' && 'is-right',\s*\n\s*dropSide && 'is-on'/, 'the side-class dialect is missing');
  assert.match(gridSrc, /onCardDragLeave=\{leaveCard\}/, 'the leave lane never threaded');
  // 1.6.7 — the leave carries the EVENT now: leaveCard's stillness guard
  // reads its coordinates (a layout-shift echo leaves at the same seat the
  // last dragover spoke — the hint keeps its glow under a resting cursor;
  // a true exit still retires it). The law the pin guards — the hint
  // retires on the pointer's TRUE exit — survives the rework.
  assert.match(gridSrc, /const leaveCard = \(e, id\) => \{[\s\S]*?setDropHint/, 'the leaveCard law is missing');
  assert.match(gridSrc, /onCardDragLeave\(e, character\.id\);/, 'the event never threaded to the leave');
});
ok('J2 — the hint curves on all four corners and breathes its own flight', () => {
  const edge = cssSrc.match(/\.gd-drop-edge \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(edge.replace(/\s+/g, ' ').includes('border-radius: calc(var(--gd-shape-radius, var(--gd-radius)) + var(--gd-border-w, 2px));'), 'the four-corner radius is missing');
  assert.ok(edge.includes('opacity: 0;'), 'the rest state never arrived');
  assert.ok(/\.gd-drop-edge\.is-on \{[\s\S]*?opacity: 1;/.test(cssSrc), 'the arrive state never arrived');
  assert.ok(/\.gd-drop-edge\.is-left\.is-on \{[\s\S]*?linear-gradient\(/.test(cssSrc), 'the seeping wash never arrived');
  assert.ok(!/inset 4px 0 0 var\(--gd-accent\);/.test(cssSrc), 'the hard 4px bar survived');
});

// ---------------------------------------------------------------------------
// K. THE TOOLTIP FADES OUT
// ---------------------------------------------------------------------------
ok('K1 — the class flip carries the exit; the press keeps its instant law', () => {
  assert.match(tipSrc, /const hideNow = \(instant = false\) => \{/, ' the fadeout signature never arrived');
  assert.match(tipSrc, /hideFlightTimer = setTimeout\(\(\) => \{[\s\S]*?tip\.style\.display = 'none';[\s\S]*?\}, 180\);/, 'the exit clock is missing');
  assert.ok((tipSrc.match(/hideNow\(true\)/g) || []).length >= 4, 'the instant exceptions never kept their law');
  assert.match(tipSrc, /if \(hideFlightTimer\) \{[\s\S]*?clearTimeout\(hideFlightTimer\);/, 'the paint never cancels a pending exit');
});

// ---------------------------------------------------------------------------
// L. THE DROPDOWN'S GOODBYE GREW A VOICE
// ---------------------------------------------------------------------------
ok('L1 — the exit is a readable fadeout (1.6.3: 0.22s ease-out, opacity first)', () => {
  const kf2 = cssSrc.match(/@keyframes gd-pop-out \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(!kf2.includes('transform'), 'the settle/rise whisper survived (it hid the fade — the exact report)');
  assert.ok(kf2.includes('opacity: 1') && kf2.includes('opacity: 0'), 'the fade keyframes drifted');
  assert.match(cssSrc, /animation: gd-pop-out 0\.22s ease-out forwards;/, 'the goodbye never grew its readable fade');
  assert.match(popSrc, /\}, 220\);/, 'the leaving clock never walked with the flight');
});

// ---------------------------------------------------------------------------
// M. THE LOCKOUT LEAVES WITH THE FAREWELL
// ---------------------------------------------------------------------------
ok('M1 — the layer strips its own marker the moment any close begins', () => {
  assert.match(modalSrc, /const beginFarewell = \(\) => \{[\s\S]*?el\.removeAttribute\('data-gd-modal'\);/, 'the farewell strip is missing');
  assert.match(modalSrc, /beginFarewell\(\);\s*\n\s*onClose\?\.\(\);/, 'the accidental closes never strip on their way out');
  assert.match(modalSrc, /onAnimationStart=\{\s*flight\s*\?\s*undefined\s*:\s*\(def\) => \{[\s\S]*?if \(def && def\.opacity === 0\) beginFarewell\(\);/, 'the framer seats never strip on the exit\u2019s first frame');
  assert.match(modalSrc, /askLayerElRef/, 'the ask’s own marker seat is missing');
});

// ---------------------------------------------------------------------------
// P. THE VERSION FURNITURE
// ---------------------------------------------------------------------------
ok('P1 — the version is 1.6.5 everywhere', () => {
  assert.match(pkgSrc, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.ok((lockSrc.match(/"version": "1\.9\.19"/g) || []).length >= 2, 'the lock root pins never moved');
  assert.match(constSrc, /version: '1\.9\.19',/, 'APP.version never moved');
  assert.match(readmeSrc, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readmeSrc), 'the version roll retired with the public README');
  assert.match(readmeSrc, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /releases\/download\/v1\.8\.6\/Burrito%20GenDex-1\.8\.6%20Setup\.exe/, 'the website installer URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assert.match(changeSrc, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(webSrc.includes('<tr class="current-row">\n          <td class="v">1.7.8</td>'), 'the website current-row never moved');
  assert.match(changeSrc, /built on the TRUE 1\.6\.0/, 'the honest re-foundation note never arrived');
});

// ---------------------------------------------------------------------------
// LIVE — the real tree in jsdom
// ---------------------------------------------------------------------------
let dom = null;
try {
  const { JSDOM } = await import('jsdom');
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
} catch {
  dom = null;
}

if (dom) {
  const g = globalThis;
  g.window = dom.window;
  g.document = dom.window.document;
  g.Node = dom.window.Node;
  g.NodeFilter = dom.window.NodeFilter;
  Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
  g.getComputedStyle = dom.window.getComputedStyle;
  g.requestAnimationFrame = dom.window.requestAnimationFrame;
  g.cancelAnimationFrame = dom.window.cancelAnimationFrame;
  g.requestIdleCallback = undefined;
  g.cancelIdleCallback = undefined;
  for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'HTMLAnchorElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'ImageBitmap', 'getSelection', 'URL', 'DOMParser']) {
    if (dom.window[k] !== undefined && g[k] === undefined) g[k] = dom.window[k];
  }
  g.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  try { g.localStorage = dom.window.localStorage; } catch { /* guarded seats degrade */ }
  g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.IS_REACT_ACT_ENVIRONMENT = false;

  const req = (await import('node:module')).createRequire(import.meta.url);
  const reactReq = req('react');
  const React = reactReq.default || reactReq;
  const { createRoot } = req('react-dom/client');
  const babel = req('@babel/core');
  req.extensions['.jsx'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]],
    });
    module._compile(code, filename);
  };
  for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
    req.extensions[ext] = (module, filename) => { module.exports = filename; };
  }
  const { createSafeDb } = req('../src/utils/helpers.js');
  const { TOS_VERSION } = await import('../src/constants/legal.js');

  const errors = [];
  console.error = (...args) => {
    const t = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
    if (/Warning|act\(|deprecated|Not implemented/i.test(t)) return;
    errors.push(t);
  };
  dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const App = req('../src/App.jsx').default;
  const Modal = req('../src/components/Modal.jsx').default;
  const GridView = req('../src/components/GridView.jsx').default;

  // --- LIVE 1: the trim picker through the real EDIT CARD window -----------
  const dbPayload = createSafeDb(null);
  dbPayload.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
  dbPayload.characters.push(
    { id: 'char-a', name: 'alpha', classId: 'root', createdAt: 1, versions: [{ id: 'va', label: 'V1', images: [], parts: [] }], stamps: [] },
  );
  window.api = {
    loadDB: async () => ({ db: dbPayload, imagesPath: '/mock/images' }),
    saveDB: async () => ({ ok: true }), sendUnsavedState: () => {}, onPromptUnsaved: () => () => {},
    saveAndClose: async () => ({ ok: true }), forceClose: () => {}, windowControl: () => {},
    onWindowMaximized: () => () => {}, onWindowUnmaximized: () => () => {}, openExternal: () => {},
    clipboardReadText: async () => '', clipboardWriteText: async () => {}, importImagesFromFiles: async () => [],
    saveImageBuffer: async () => ({ ok: true, file: 'x.png' }), deleteImageFile: async () => ({ ok: true }),
  };
  localStorage.setItem('gd:last-run-version', '1.9.19');
  await okAsync('LIVE1 — the trim color key through the real EDIT CARD window', async () => {
    const rt = createRoot(document.getElementById('root'));
    rt.render(React.createElement(App));
    await sleep(3400);
    const card = [...document.querySelectorAll('.gd-card')].find((c) => (c.textContent || '').includes('alpha'));
    assert.ok(card, 'the card never mounted');
    // open the card settings menu and press EDIT CARD
    click(card);
    await sleep(300);
    const gear = [...document.querySelectorAll('button')].find((b) => /card settings/i.test(b.title || ''));
    assert.ok(gear, 'the card settings key never seated');
    click(gear);
    await sleep(120);
    const edit = [...document.querySelectorAll('button')].find((b) => /edit card/i.test(b.textContent || ''));
    assert.ok(edit, 'the EDIT CARD key never spoke');
    click(edit);
    await sleep(300);
    const trimKey = [...document.querySelectorAll('button')].find((b) => /TRIM COLOR/i.test(b.textContent || ''));
    assert.ok(trimKey, 'the TRIM COLOR key never mounted in the edit window');
    click(trimKey);
    await sleep(200);
    const themeDefault = [...document.querySelectorAll('button')].find((b) => /THEME DEFAULT/i.test(b.textContent || ''));
    assert.ok(themeDefault, 'the THEME DEFAULT chip never mounted');
    // pick a hex through the picker's own panel lane (the swatch key's onColor)
    const panel = document.querySelector('.gd-pop-in');
    assert.ok(panel, 'the picker popover never opened');
    // the commit lane: DONE carries the trim ink (validated + threaded)
    const done = [...document.querySelectorAll('button')].reverse().find((b) => /^DONE$/i.test((b.textContent || '').trim()));
    assert.ok(done, 'the DONE key never seated');
    rt.unmount();
  });

  // --- LIVE 2: the ghost's invisible birth ----------------------------------
  await okAsync('LIVE2 — a coordinate-less birth never paints; the first true seat lights it', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    const mkDb = () => {
      const d = createSafeDb(null);
      d.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      d.characters.push({ id: 'char-g', name: 'ghosty', classId: 'root', createdAt: 1, versions: [{ id: 'vg', label: 'V1', images: [], parts: [] }], stamps: [] });
      return d;
    };
    rt.render(React.createElement(App));
    await sleep(3400);
    const card = [...document.querySelectorAll('[draggable="true"]')].find((d) => String(d.className || '').includes('gd-card'));
    assert.ok(card, 'no draggable card on the board');
    Object.defineProperty(card, 'offsetWidth', { value: 236 });
    Object.defineProperty(card, 'offsetHeight', { value: 340 });
    Object.defineProperty(card, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }) });
    const dt = { effectAllowed: '', setData: () => {}, setDragImage: () => {} };
    // the coordinate-less birth: a dragstart whose clientX/Y read 0
    const ev = new dom.window.MouseEvent('dragstart', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 });
    Object.defineProperty(ev, 'dataTransfer', { value: dt });
    card.dispatchEvent(ev);
    await sleep(40);
    let ghost = document.querySelector('.gd-drag-ghost');
    assert.ok(ghost, 'the owned ghost never mounted');
    assert.equal(ghost.style.opacity, '0', 'a coordinate-less birth painted stranded (the guard never spoke)');
    // the first true flight event seats AND lights it
    dom.window.dispatchEvent(new dom.window.MouseEvent('dragover', { clientX: 300, clientY: 220, bubbles: true }));
    await sleep(40);
    ghost = document.querySelector('.gd-drag-ghost');
    assert.equal(ghost.style.opacity, '0.55', 'the first true seat never lit the ghost at the faded weight');
    assert.ok(ghost.style.transform.includes('241px'), 'the seat is not centered on the cursor (got ' + ghost.style.transform + ')');
    card.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
    await sleep(40);
    assert.ok(!document.querySelector('.gd-drag-ghost'), 'the ghost survived its own dragend');
    rt.unmount();
    host.remove();
  });

  // --- LIVE 3: the lockout leaves with the farewell -------------------------
  await okAsync('LIVE3 — the layer strips its marker the moment the close begins', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    let closed = false;
    rt.render(
      React.createElement(Modal, {
        title: 'LOCK TEST',
        onClose: () => { closed = true; },
        footer: React.createElement('button', { className: 'gd-btn', onClick: () => { closed = true; } }, 'CANCEL'),
      }, React.createElement('p', null, 'the body'))
    );
    await sleep(200);
    const layer = document.querySelector('.gd-modal-layer');
    assert.ok(layer, 'the layer never mounted');
    assert.equal(layer.getAttribute('data-gd-modal'), '1', 'the live layer never carried its window marker');
    const x = [...document.querySelectorAll('.gd-icon-btn')].pop();
    assert.ok(x, 'the close key is missing');
    click(x);
    await sleep(30);
    assert.ok(closed, 'the close never landed');
    assert.ok(!layer.getAttribute('data-gd-modal'), 'the marker survived the close it began (the lockout lingers)');
    assert.ok(document.body.contains(layer), 'the layer left before its farewell could speak');
    rt.unmount();
    host.remove();
  });

  console.log(errors.length ? `\n  render errors: ${errors.slice(0, 2).join(' | ').slice(0, 300)}` : '');
  if (errors.length) failed += 1;
} else {
  console.log('  (jsdom unavailable — live passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
