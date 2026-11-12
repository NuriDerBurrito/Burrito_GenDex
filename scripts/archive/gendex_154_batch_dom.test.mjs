// 1.4.5 batch — THE COAT LEARNS ITS REACH.
// The reported items, each pinned at its root law:
//   1.  two styles, two windows ("the hue color and stamp settings, i want
//       their buttons to be 2 different style ... the card edit window one
//       should be the one we have currently, but ensure that the stamp
//       settings isnt sliding downwards and on the same row as hue color,
//       while the rest should be the old one and stack them above each
//       other, and dont offset the settings down right") — the classic
//       20px squares + the is-tower rail + the offset bug's root
//   2.  the rim law ("when a finish is applied, ensure that the text
//       (alongside the version counter and date and name) should have an
//       outline that is opposite to the text's current color")
//   3.  trim effect ("add trim effect next to image effect and image motion,
//       which will make the finish apply above the trim")
//   4.  the squish never interrupted + 5 the panel's click-frame lag dead
//       ("fix the lag issue coming from the right panel opening (it wasnt
//       laggy before)" + "keep it delayed")
//   6.  stamp effect + the grey-out law ("add option to effect stamp too,
//       where finishes would effect the stamp if checked, also when options
//       are unavailable such as image effect and such, dont hide it,
//       instead grey it out")
//   7.  the hue without a stamp ("make it so hue can be applied even without
//       a stamp ... since hue shouldnt rely on it") + the drafts line gone
//   8.  the white ring around the pressed image (the art seat + the crop
//       overdraw)
//   9.  opalescent's water ("add a wavy effect / that effect where u would
//       look at uncalm water from above like, like noise map going up and
//       down, noise etc") + the streaks not distracting
//   10. prismatic rainbow in plate mode ("prismatic effect should be
//       rainbow colorful even when not in image effect mode") + the finishes
//       never above the text
//   11. the prompt swap flies both rows ("only the affected swapped plays
//       the swap animation, not the one i swapped, fix that and also make
//       the animation better so its clearer which swapped")
//   12. the fold answers the first motion ("the tags/stamps collapse later
//       than usual, not on the first down motion but instead when its
//       midway, fix that")
// Plus: the version is 1.4.5 everywhere.

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

const css = src('src/index.css');
const gridSrc = src('src/components/GridView.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const partSrc = src('src/components/PartEditor.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const themeSrc = src('src/utils/theme.js');
const colorSrc = src('src/components/StampColorControls.jsx');
const posSrc = src('src/components/StampPosControls.jsx');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

// ===========================================================================
// 1 — TWO STYLES, TWO WINDOWS
// ===========================================================================
ok('1a — the classic keys are back (the anonymous 20px squares)', () => {
  const key = /\.gd-stamp-key-classic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/width:\s*20px/.test(key) && /height:\s*20px/.test(key), 'the 20px square face');
  assert(/\.gd-stamp-key-classic\.gd-stamp-key-color/.test(css), 'the color square speaks the swatch fill');
  assert(/gd-stamp-key-fill/.test(colorSrc), 'the live hue fills the classic square');
  assert(/variant === 'classic'/.test(colorSrc), 'the classic face is selectable');
  assert(/variant === 'classic'/.test(posSrc), 'the settings key speaks it too');
});
ok('1b — the tower rail returns for the classic windows', () => {
  const tower = /\.gd-stamp-settings-cluster\.is-tower\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/flex-direction:\s*column/.test(tower), 'stacked above each other');
  assert(/align-items:\s*flex-start/.test(tower), 'left-aligned — no down-right offset');
  assert(/is-tower/.test(charSrc), 'the right panel seats the tower');
  assert(/is-tower/.test(newSrc), 'the creation window seats the tower');
  // the classic seats speak the classic face
  assert(/variant="classic"/.test(charSrc), 'the panel passes the classic variant');
  assert(/variant="classic"/.test(newSrc), 'the creation window passes the classic variant');
});
ok('1c — the edit window keeps the labeled keys on ONE row', () => {
  const seat = /<span className="gd-stamp-settings-cluster">[\s\S]*?StampColorControls[\s\S]*?StampPosControls/.exec(charSrc)?.[0] || '';
  assert(seat.length > 0, 'the look window speaks the ROW cluster');
  assert(!/variant="classic"/.test(seat), 'the edit window never speaks the classic face');
  const cluster = /\.gd-stamp-settings-cluster\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/flex-direction:\s*row/.test(cluster), 'the default cluster stays a row');
});
ok('1d — the offset bug is dead at its root', () => {
  // the zeroing must speak DESCENDANTS (the locked-key wrapper broke the
  // direct-child form and the settings key slid 9px down / 2px right)
  assert(/\.gd-stamp-settings-cluster \.gd-stamp-color,\s*\n\.gd-stamp-settings-cluster \.gd-stamp-pos\s*\{[\s\S]*?margin-top:\s*0;[\s\S]*?margin-left:\s*0;/.test(css), 'descendant zeroing — no wrapper can resurrect the slide');
  assert(!/\.gd-stamp-settings-cluster > \.gd-stamp-pos,/.test(css), 'the direct-child form is gone');
});

// ===========================================================================
// 2 — THE RIM LAW
// ===========================================================================
ok('2a — the printing wears the opposite-ink rim while a finish is applied', () => {
  const rim = /\.gd-has-finish \.gd-card-title,[\s\S]*?\.gd-has-finish \.gd-card-stamp\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/-webkit-text-stroke:\s*calc\(1\.1px \* var\(--card-scale, 1\)\) var\(--gd-fin-ink-outline/.test(rim), 'the stroke speaks the seat var at the card scale');
  assert(/paint-order:\s*stroke fill/.test(rim), 'the fill stays on top');
  assert(/\.gd-has-finish \.gd-card-meta/.test(rim) && /\.gd-has-finish \.gd-card-vers-badge/.test(rim), 'the date + the counter ride it');
});
ok('2b — the rim color is derived, per seat', () => {
  assert(/export const counterRimFor/.test(helpersSrc), 'the luminance pick lives in helpers');
  assert(/rgba\(13, 10, 7, 0\.66\)/.test(helpersSrc) && /rgba\(250, 246, 238, 0\.72\)/.test(helpersSrc), 'light ink, dark rim; dark ink, light rim');
  assert(/counterRimFor\(plateInk\)/.test(gridSrc), 'the grid card derives its rim from its own plate ink');
  assert(/--gd-text-counter/.test(themeSrc), 'theme.js writes the themed counter token');
  assert(/--gd-fin-ink-outline/.test(gridSrc), 'the grid threads the var');
});

// ===========================================================================
// 3 + 6 — TRIM EFFECT + STAMP EFFECT + THE GREY-OUT LAW
// ===========================================================================
ok('3a — the rails carry the reach switches', () => {
  const san = /export const sanitizeCardLook[\s\S]*?\}\);/.exec(constSrc)?.[0] || '';
  assert(/finishOnTrim: card\.finishOnTrim === true/.test(san), 'the trim switch sanitizes');
  assert(/finishOnStamp: card\.finishOnStamp === true/.test(san), 'the stamp switch sanitizes');
  assert(/cardFinishOnTrim: sanitizeCardLook\(card\)\.finishOnTrim/.test(constSrc), 'makeCharacter seats it');
  assert(/cardFinishOnTrim: character\?\.cardFinishOnTrim === true/.test(helpersSrc), 'the load sanitizer keeps it');
  assert(/cardFinishOnTrim: card\.finishOnTrim === true/.test(appSrc), 'the edit window commits it');
  assert(/finishOnTrim,/.test(newSrc) && /finishOnStamp,/.test(newSrc), 'the creation window carries both');
});
ok('3b — the coat lifts over the trim ring', () => {
  assert(/onTrim && 'is-over-trim'/.test(ribbonSrc), 'CardFinishLayer arms the over-trim class');
  const lift = /\.gd-card-face-finish\.is-over-trim,\s*\n\.gd-card-face-artfin\.is-over-trim\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*4/.test(lift), 'the over-trim rung');
  assert(/onTrim=\{cardFinishOnTrim\}/.test(gridSrc), 'the grid threads the trim switch');
  assert(/finishOnTrim=\{finishOnTrim\}/.test(charSrc), 'the edit window threads the switch to its preview');
});
ok('6a — stamp effect seats the stamps under the coat', () => {
  assert(/\.gd-fin-on-stamp \.gd-card-stamp-band\s*\{[\s\S]*?z-index:\s*1;[\s\S]*?\n\}/.test(css), 'the band drops under the coat');
  assert(/\.gd-fin-on-stamp \.gd-card-stamp-free\.is-clipped\s*\{[\s\S]*?z-index:\s*1;/.test(css), 'the confined stickers drop with it');
  // the stamp law wins when both are on (declared after the trim law)
  const stampAt = css.indexOf('.gd-fin-on-stamp .gd-card-stamp-band');
  const trimAt = css.indexOf('.gd-fin-on-trim .gd-card-stamp-band');
  assert(stampAt > trimAt, 'the stamp law has the last word');
  assert(/gd-fin-on-stamp/.test(gridSrc), 'the grid arms the scope class');
});
ok('6b — the ladder is a spoken law (the coat first, the text above all)', () => {
  assert(/<CardFinishLayer[\s\S]*?\/>[\s\S]*?\{\/\* 1\.4\.5 — THE COAT SPEAKS FIRST/.test(gridSrc) || gridSrc.indexOf('<CardFinishLayer') < gridSrc.indexOf('gd-card-ribbons'), 'the coat is DOM-first in the grid card');
  assert(/z-index:\s*5/.test(/\.gd-card-foot-vers > \.gd-card-foot-name,[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the text cells own z 5');
  assert(/\.gd-card-vers\s*\{[\s\S]*?z-index:\s*5;/.test(css), 'the badge rises with them (its base rule carries the rung)');
  assert(/z-index:\s*0;/.test(/\.gd-card-foot\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '') === false, 'the foot cage is retired');
});
ok('6c — unavailable switches GREY OUT, never hide', () => {
  const off = /\.gd-check-row\.is-off\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/opacity:\s*0\.42/.test(off) && /filter:\s*grayscale/.test(off), 'the greyed seat speaks');
  assert(/is-off/.test(styleSrc), 'CardStyleControls arms it');
  const gates = /noFinish && 'is-off'/.exec(styleSrc)?.[0] || '';
  assert(gates.length > 0, 'the gate reads the finish');
  assert(/disabled=\{noFinish\}/.test(styleSrc), 'the inputs go blind, not gone');
  assert(/trim effect/.test(styleSrc) && /stamp effect/.test(styleSrc), 'both labels seat the family row');
});

// ===========================================================================
// 4 + 5 — THE CLICK'S FRAME IS CHEAP; THE SQUISH BREATHES THROUGH
// ===========================================================================
ok('4a — the boot mounts a skeleton and builds in a gated transition', () => {
  assert(/gd-panel-skeleton/.test(appSrc), 'the skeleton seat exists');
  assert(/startTransition\(\(\) => setReady\(true\)\)/.test(appSrc), 'the build rides the transition lane');
  assert(/setTimeout\([\s\S]*?150\)/.test(appSrc), 'the gate waits out the curtain head');
  const skel = /\.gd-panel-skeleton\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(skel.length > 0, 'the skeleton speaks CSS');
});
ok('4b — the squish is untouched by the open (the flight stays compositor paint)', () => {
  // the pulse still animates the independent scale property (composited) —
  // nothing in 1.4.5 moved it; the click's commit stays cheap so the
  // animation's frames are never starved.
  const pulse = /@keyframes gd-press-pulse\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/scale:\s*1\.06 0\.9/.test(pulse) && /scale:\s*0\.955 1\.075/.test(pulse), 'the five beats keep their axes');
  assert(/DeferredPanelBoot/.test(appSrc), 'the boot seat stays named');
});

// ===========================================================================
// 7 — THE HUE WITHOUT A STAMP
// ===========================================================================
ok('7a — a picked hue paints with no stamp on the card', () => {
  assert(/export const customStampHue/.test(helpersSrc), 'the custom-only hue pick exists');
  assert(/cardStamps\.length \? resolvedHue : customStampHue\(settings\)/.test(gridSrc), 'the grid paints the draft with no stamp');
  assert(/topStamp \? resolvedHue : customStampHue\(stampSet\)/.test(charSrc), 'the edit window threads it');
  assert(/topStamp \? resolvedHue : customStampHue\(stampSettings\)/.test(newSrc), 'the creation window threads it');
  assert(/gd-hue-halfcard[\s\S]*?bandStamps\.length === 0 && freeStamps\.length === 0/.test(gridSrc.replace(/\/\/[^\n]*/g, '')) || /bandStamps\.length === 0 && freeStamps\.length === 0/.test(gridSrc), 'the stampless wash seats only without stamps');
});
ok('7b — the drafts line is gone', () => {
  assert(!/drafts on the card and speaks/.test(charSrc), 'the misdescribing line left the edit window');
  assert(!/drafts on the card and speaks/.test(newSrc), 'and the creation window');
});

// ===========================================================================
// 8 — THE WHITE RING AROUND THE PRESSED IMAGE
// ===========================================================================
ok('8a — the art seat speaks the shadow-toned ground', () => {
  assert(/color-mix\(in srgb, var\(--gd-ink\) 30%, var\(--gd-bg\)\)/.test(gridSrc), 'the grid art seat');
  assert(/color-mix\(in srgb, var\(--gd-ink\) 30%, var\(--gd-bg\)\)/.test(ribbonSrc), 'the compact preview seat');
  assert(!/var\(--gd-ink\) 10%, var\(--gd-panel\)\)/.test(gridSrc), 'the near-white paper wash is retired everywhere');
});
ok('8b — the crop frame overdraws its box by a hair', () => {
  const frame = /width: `calc\(\$\{f\(1 \/ crop\.w\)\} \+ 1px\)`,\s*\n\s*height: `calc\(\$\{f\(1 \/ crop\.h\)\} \+ 1px\)`,\s*\n\s*left: `calc\(\$\{f\(-crop\.x \/ crop\.w\)\} - 0\.5px\)`,/.exec(ribbonSrc)?.[0] || '';
  assert(frame.length > 0, 'the overdraw math rides the frame');
});

// ===========================================================================
// 9 — OPALESCENT LEARNS THE WATER
// ===========================================================================
ok('9a — the RIPPLE: two caustic octaves drifting opposite ways', () => {
  const layer = /\.gd-opal-ripple\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*screen/.test(layer), 'screen-blended like the tide');
  assert(/gd-opal-ripple-breath 12s/.test(layer), 'the noise breath glows and settles');
  const o1 = /\.gd-opal-ripple::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  const o2 = /\.gd-opal-ripple::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-96px/.test(o1) && /gd-opal-ripple-ne 23s/.test(o1), 'the fine octave drifts NE');
  assert(/inset:\s*-148px/.test(o2) && /gd-opal-ripple-sw 31s/.test(o2), 'the broad octave drifts SW');
  assert(/seat\('gd-opal-ripple'\)/.test(ribbonSrc), 'the pearl pipeline seats it');
  assert(/gd-opal-ripple/.test(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\n\}/.exec(css)?.[0] || '') || /gd-opal-ripple,/.test(css), 'reduced motion stills it');
});
ok('9b — the streaks softened (not ruled paper)', () => {
  const streaks = /\.gd-opal-tide::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/rgba\(255, 255, 255, 0\.11\) 7px 9px/.test(streaks), 'the fine band halved');
  assert(/rgba\(255, 250, 252, 0\.09\) 13px 16px/.test(streaks), 'the counter band halved');
  const wobble = /@keyframes gd-opal-streak\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(2\.5px, 1\.5px\)/.test(wobble), 'the wobble halved');
});

// ===========================================================================
// 10 — PRISMATIC RAINBOW IN PLATE MODE + THE TEXT ABOVE THE COAT
// ===========================================================================
ok('10a — the plate-mode conic speaks saturated spectral stops', () => {
  const body = /\.gd-finish-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/rgba\(255, 64, 129, 0\.58\)/.test(body) && /rgba\(64, 230, 130, 0\.55\)/.test(body) && /rgba\(178, 86, 255, 0\.6\)/.test(body), 'full-voice spectral stops');
  assert(!/rgba\(255, 189, 197, 0\.24\)/.test(body), 'the pastel whisper is retired');
  assert(/rgba\(88, 28, 135, 0\.32\)/.test(body), 'the deeper tint under the crystal');
});
ok('10b — the finishes never sit above the text', () => {
  // the text's z 5 beats every coat rung (2 base, 4 over-trim)
  assert(/\.gd-card-face-finish\.is-over-trim[\s\S]*?z-index:\s*4/.test(css), 'the over-trim coat tops out at 4');
  assert(/\.gd-card-foot-vers > \.gd-card-foot-name,[\s\S]*?z-index:\s*5/.test(css), 'the text sits at 5 — above them all');
});

// ===========================================================================
// 11 — THE PROMPT SWAP FLIES BOTH ROWS
// ===========================================================================
ok('11a — the FLIP glide + the flash pair', () => {
  assert(/useLayoutEffect/.test(partSrc), 'the measured flight lives in a layout effect');
  assert(/prevTopsRef/.test(partSrc) && /rowRefs/.test(partSrc), 'the seats are measured');
  assert(/translateY\(\$\{old - top\}px\)/.test(partSrc), 'the FLIP speaks the delta');
  assert(/cubic-bezier\(0\.22, 1\.2, 0\.36, 1\)/.test(partSrc), 'the eased glide home');
  assert(/scroller\.scrollTop/.test(partSrc), 'positions read scroll-relative (the scroller never masquerades as a swap)');
  assert(/is-move-flash/.test(partSrc) && /is-move-peer/.test(partSrc), 'the pressed row + its partner both flash');
  assert(/flashPair\(partId, peer \? peer\.id : null\)/.test(partSrc), 'the pair rides the same commit');
  assert(/fresh && 'gd-rise-in'/.test(partSrc), 'only fresh parts rise on entrance');
  assert(/\.gd-part-row\.is-move-flash/.test(css) && /\.gd-part-row\.is-move-peer/.test(css), 'the flashes speak CSS');
});

// ===========================================================================
// 12 — THE FOLD ANSWERS THE FIRST MOTION
// ===========================================================================
ok('12a — the listener seeds at attach; the hover guard is retired', () => {
  assert(/lastScrollRef\.current = scroller\.scrollTop;/.test(charSrc), 'the mirror seeds at attach');
  assert(!/matches\?\('\:hover'\)/.test(charSrc), 'the rows-zone hover guard is gone');
  assert(/if \(rowsPinned\) return;/.test(charSrc), 'the pin keeps its law');
  assert(/1\.4\.5 — THE FIRST DOWN MOTION FOLDS/.test(charSrc), 'the law is documented');
});

// ===========================================================================
// V — THE VERSION FURNITURE
// ===========================================================================
ok('V — the version is 1.4.6 everywhere', () => {
  assert.equal(JSON.parse(pkgSrc).version, '1.4.6', 'package.json');
  assert(/version:\s*'1\.4\.6',/.test(constSrc), 'APP.version');
  assert(/\*\*v1\.4\.6\*\*/.test(src('README.md')), 'README');
  assert(/\(1\.4\.6\)/.test(src('START.bat')), 'START.bat');
  assert(/## 1\.4\.6 — The Keys Find Their Seat/.test(changelogSrc), 'CHANGELOG head');
  assert(/v1\.4\.6/.test(websiteSrc) && /THE KEYS FIND THEIR SEAT/.test(websiteSrc), 'website current block');
  assert(/var CURRENT = \[1, 4, 6\];/.test(websiteSrc), 'website CURRENT gate');
  assert(/releases\/download\/v1\.4\.6\//.test(websiteSrc), 'the download links speak 1.4.6');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
