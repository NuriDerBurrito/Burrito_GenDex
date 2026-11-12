// 1.4.6 batch — THE KEYS FIND THEIR SEAT.
// The reported items, each pinned at its root law:
//   1.  the white-out ("most menus and stamps areas are all white" +
//       "the right panel stamp area is all white, same with card creation
//       window") — the classic COLOR key's absolutely-positioned swatch
//       fill exploded over the nearest positioned ancestor (the key never
//       spoke position: relative); the opaque sheet of the WHITE default
//       hue covered the panel's strip seat, the whole creation modal and
//       every classic-key menu while the DOM's own styles stayed dark
//   2.  the classic face becomes legible (the ink-vouched frame, the
//       stepped face, the fill's inner ring — even the WHITE default
//       reads as a picked swatch)
//   3.  the tower seats where the eye can find it ("cant see the other
//       style") — under the + STAMP key in the row's own fixed column,
//       never buried behind the stamp wall's sideways scroll
//   4.  trim effect + stamp effect finally speak ("stamp effect and trim
//       effect options arent working") — CardLookEditor never declared or
//       forwarded the reach switches, so the previews never wore them
//   5.  the gate speaks the card's own truth ("i can still use the stamp
//       one even if there is no stamp, same with the image one") — image
//       effect greys without an image, stamp effect greys without a stamp
//   6.  the panel opens like it was always there ("the detail panel lags
//       alot when opening") — the aside parks at width 0 instead of
//       unmounting; every reopen after the first is the width flight alone
// Plus: the version is 1.4.6 everywhere.

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
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const stageSrc = src('src/components/ImageStage.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const colorSrc = src('src/components/StampColorControls.jsx');
const posSrc = src('src/components/StampPosControls.jsx');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

// ===========================================================================
// 1 — THE WHITE-OUT, DEAD AT ITS ROOT
// ===========================================================================
ok('1a — the classic COLOR key speaks position: relative (the fill insets against the key)', () => {
  const rule = /\.gd-stamp-key-classic\.gd-stamp-key-color\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/position:\s*relative/.test(rule), 'the color key is the fill\'s positioned box');
  const fill = /\.gd-stamp-key-classic \.gd-stamp-key-fill\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/position:\s*absolute/.test(fill) && /inset:\s*0/.test(fill), 'the fill stays absolute inset:0');
  assert(/THE WHITE-OUT'S ROOT/.test(css), 'the root is documented at the rule');
});
ok('1b — the labeled key never carried the exploding fill (why the edit window survived)', () => {
  // the edit window's pair paints a STATIC swatch chip — no absolute layer
  const swatch = /\.gd-stamp-key-swatch\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/position:\s*absolute/.test(swatch), 'the labeled swatch is a static chip');
  assert(/gd-stamp-key-swatch/.test(colorSrc), 'the labeled face still speaks its chip');
});

// ===========================================================================
// 2 — THE CLASSIC FACE BECOMES LEGIBLE
// ===========================================================================
ok('2a — the frame the ink can vouch for', () => {
  const key = /\.gd-stamp-key-classic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/border:\s*1\.5px solid color-mix\(in srgb, var\(--gd-ink\) 58%, transparent\)/.test(key), 'the 58% ink frame');
  assert(/background:\s*color-mix\(in srgb, var\(--gd-panel\) 88%, var\(--gd-chrome\)\)/.test(key), 'the face a step off the panel');
  assert(/box-shadow:\s*inset 0 1px 0 rgba\(255, 255, 255, 0\.16\), 0 1px 2px rgba\(0, 0, 0, 0\.3\)/.test(key), 'the top-lit inset + soft drop');
});
ok('2b — the swatch reads as a picked color even at the WHITE default', () => {
  const colorKey = /\.gd-stamp-key-classic\.gd-stamp-key-color\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/--gd-ink\) 12%, transparent\) 0% 25%/.test(colorKey), 'the checker firms to 12% ink');
  const fill = /\.gd-stamp-key-classic \.gd-stamp-key-fill\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset 0 0 0 1px color-mix\(in srgb, var\(--gd-ink\) 22%, transparent\)/.test(fill), 'the fill\'s own inner ring');
});

// ===========================================================================
// 3 — THE TOWER SEATS WHERE THE EYE CAN FIND IT
// ===========================================================================
ok('3a — the tower rides the row\'s own left column (under the + STAMP key)', () => {
  assert(/THE TOWER SEATS IN THE COLUMN/.test(charSrc), 'the seat move is documented');
  assert(/gd-row-tower/.test(charSrc), 'the column seat class rides the cluster');
  const rule = /\.gd-stamp-settings-cluster\.is-tower\.gd-row-tower\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(rule.length > 0, 'the column seat speaks CSS');
  // the cluster markup rides INSIDE the left column (before the SideFlowZone)
  const colStart = charSrc.indexOf('flex flex-col items-center gap-1 flex-shrink-0');
  const zoneStart = charSrc.indexOf('<SideFlowZone');
  const clusterStart = charSrc.indexOf('gd-stamp-settings-cluster is-tower gd-row-tower');
  assert(colStart > 0 && zoneStart > colStart, 'the left column exists before the zone');
  assert(clusterStart > colStart && clusterStart < zoneStart, 'the tower sits inside the column, not the zone');
});
ok('3b — the strip\'s flow carries only the slots + ADD + PASTE', () => {
  // the cluster markup appears exactly once in the panel (the live copy —
  // the measurement twin no longer renders it)
  assert.equal((charSrc.match(/gd-stamp-settings-cluster is-tower/g) || []).length, 1, 'one tower seat in the panel');
  assert(/THE SETTINGS TOWER LEFT THE FLOW/.test(charSrc), 'the flow\'s new crew is documented');
});
ok('3c — the stays-without-a-stamp law rides the new seat', () => {
  assert(/stays-without-a-\s*stamp law/.test(charSrc), 'the ungate is documented at the column');
  assert(/className=\{clsx\(!charStamps\.length && 'gd-locked-key'\)\}/.test(charSrc), 'the settings key still locks while empty');
  // the creation window keeps its own cluster in the plain wrap
  assert(/gd-stamp-settings-cluster is-tower/.test(newSrc), 'the creation window keeps the tower');
});

// ===========================================================================
// 4 — TRIM EFFECT + STAMP EFFECT FINALLY SPEAK
// ===========================================================================
ok('4a — CardLookEditor declares the reach switches in its signature', () => {
  const sig = /export default function CardLookEditor\(\{[\s\S]*?\}\) \{/.exec(lookSrc)?.[0] || '';
  assert(/finishOnTrim = false/.test(sig), 'finishOnTrim is declared');
  assert(/finishOnStamp = false/.test(sig), 'finishOnStamp is declared');
  assert(/THE COAT'S REACH SWITCHES ARRIVE AT THE EDITOR'S OWN SIGNATURE/.test(lookSrc), 'the fix is documented');
});
ok('4b — the panzoom preview receives the reach switches', () => {
  const seat = /<PanZoomPreview[\s\S]*?imageMotion=\{imageMotion\}/.exec(lookSrc)?.[0] || '';
  assert(/finishOnTrim=\{finishOnTrim\}/.test(seat), 'the panzoom wears trim effect');
  assert(/finishOnStamp=\{finishOnStamp\}/.test(seat), 'the panzoom wears stamp effect');
});
ok('4c — the compact CardPreview receives them too', () => {
  const seat = /<CardPreview[\s\S]*?finishOnStamp=\{finishOnStamp\}/.exec(lookSrc)?.[0] || '';
  assert(/finishOnTrim=\{finishOnTrim\}/.test(seat), 'the compact preview wears trim effect');
  assert(/finishOnStamp=\{finishOnStamp\}/.test(seat), 'the compact preview wears stamp effect');
});

// ===========================================================================
// 5 — THE GATE SPEAKS THE CARD'S OWN TRUTH
// ===========================================================================
ok('5a — the subject props exist and the switches gate on them', () => {
  assert(/hasImage = true,/.test(styleSrc), 'hasImage is declared');
  assert(/hasStamp = true,/.test(styleSrc), 'hasStamp is declared');
  assert(/const noImage = !hasImage;/.test(styleSrc), 'the image truth is spoken');
  assert(/const noStamp = !hasStamp;/.test(styleSrc), 'the stamp truth is spoken');
  assert(/disabled=\{noFinish \|\| noImage\}/.test(styleSrc), 'image effect refuses without an image');
  assert(/disabled=\{noFinish \|\| noStamp\}/.test(styleSrc), 'stamp effect refuses without a stamp');
  // the TRIM row keeps its noFinish-only gate (every card wears its trim
  // ring — the one subject that always exists)
  const trimRow = /\{seatTrim && \([\s\S]*?\n\s*\)\}/.exec(styleSrc)?.[0] || '';
  assert(/disabled=\{noFinish\}/.test(trimRow), 'the trim row keeps its finish-only gate');
  const others = styleSrc.replace(/\{seatTrim && \([\s\S]*?\n\s*\)\}/, '').replace(/\{onImageMotion && \([\s\S]*?\n\s*\)\}/, '');
  assert(!/disabled=\{noFinish\}/.test(others), 'no ungated seat remains outside the trim row');
});
ok('5b — the grey-out reasons speak their own tooltips', () => {
  assert(/Needs an image: this card has no image for the coat to cover/.test(styleSrc), 'the image reason');
  assert(/Needs a stamp: this card has no stamp for the coat to cover/.test(styleSrc), 'the stamp reason');
});
ok('5c — the callers thread the card\'s own truth', () => {
  assert(/hasImage=\{!!coverUrl\}/.test(charSrc), 'the edit window threads its cover');
  assert(/hasImage=\{!!cover\}/.test(newSrc), 'the creation window threads its cover draft');
  assert(/hasStamp=\{\(character\.stamps\?\.length \|\| 0\) > 0\}/.test(charSrc), 'the edit window threads its stamps');
  assert(/hasStamp=\{stamps\.length > 0\}/.test(newSrc), 'the creation window threads its stamps draft');
});

// ===========================================================================
// 6 — THE PANEL OPENS LIKE IT WAS ALWAYS THERE
// ===========================================================================
ok('6a — the aside parks instead of unmounting (the retained seat)', () => {
  assert(/panelRetainedId/.test(appSrc), 'the retained id state exists');
  assert(/const panelShown = panelCharacter \|\| panelRetained;/.test(appSrc), 'the shown character speaks the retention');
  assert(/detailPanelOn && panelShown && \(/.test(appSrc), 'the mount condition keeps the retained character');
  assert(/animate=\{\{ width: panelLive \? rightPanelW : 0, opacity: panelLive \? 1 : 0\.6 \}\}/.test(appSrc), 'the width target speaks the parked seat');
  assert(/gd-panel-parked/.test(appSrc), 'the parked class rides the aside');
  const rule = /\.gd-panel-parked\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/pointer-events:\s*none/.test(rule), 'the parked seat never answers the pointer');
});
ok('6b — the parked tree sleeps its own clocks (the dormant gate)', () => {
  assert(/dormant=\{!panelLive\}/.test(appSrc), 'the view sleeps while parked');
  assert(/dormant = false,/.test(charSrc), 'CharacterView declares the dormant seat');
  assert(/dormant=\{dormant\}/.test(charSrc), 'the image stage receives it');
  assert(/!autoSwipe \|\| dormant \|\| images\.length < 2/.test(stageSrc.replace(/\s+/g, ' ')), 'the auto-swipe walk sleeps while dormant');
});
ok('6c — the first open keeps the owner-blessed boot', () => {
  // the skeleton + the 150ms-gated transition are untouched — only the
  // reopen changed (it no longer pays the boot at all)
  assert(/gd-panel-skeleton/.test(appSrc), 'the skeleton seat stays');
  assert(/setTimeout\([\s\S]*?150\)/.test(appSrc), 'the gate still waits out the curtain head');
  assert(/THE PANEL'S RETAINED SEAT/.test(appSrc), 'the retained seat is documented');
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
