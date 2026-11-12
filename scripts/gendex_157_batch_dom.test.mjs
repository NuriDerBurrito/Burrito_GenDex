// 1.4.8 batch — THE OWL TAKES THE SEAT.
// The reported items, each pinned at its root law:
//   1.  the drawers restack (solid faces, soft shadows, row rungs,
//       keys centering on the live drawer height)
//   2.  the veiled coat rides UNDER the image (the corner law kept)
//   3.  prismatic's stars veil with the rest while image effect is off
//   5.  nuri leans on the card's own color (--gd-card-tint)
//   6.  MUMEI replaces opalescent (four materials + the migration map)
//   7.  stamp motion stands on its own (any stamp arms it)
//   8.  the squish is never interrupted (no mid-flight kills)
//   9.  no white outline around the breathing card
//   10. the stampless hue wash rides the band's rung
//   11. the skeleton is retired (one rAF, then the content)
//   12. the NEW CARD tile answers the press
//   13. the freeze is full (every pseudo) and speaks the menus
//   14. every window a third faster (0.15s / 0.1s / 0.12s)
//   15. the version chips glide home (transition-only seats + guard)
//   16. the coats leave the main thread (foil + holographic converted)
//   17. the decorative trims weld their corners (tucked double ring)
// Plus: the version is 1.4.8 everywhere.

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
const gridSrc = src('src/components/GridView.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const sideSrc = src('src/components/SideFlow.jsx');
const modalSrc = src('src/components/Modal.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const ctxSrc = src('src/components/GdContextMenu.jsx');
const popSrc = src('src/components/Popover.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const readmeSrc = src('README.md');

// ===========================================================================
// 1 — THE DRAWERS RESTACK
// ===========================================================================
ok('1a — the cover face is paper, not a ghost (92% + soft shadow)', () => {
  const rule = /\.gd-side-seat\.is-cover-seat > \.gd-collapse-zone\.is-cover-open \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/var\(--gd-panel\) 92%/.test(rule), 'the face speaks 92% panel');
  assert(/0 10px 22px rgba\(0, 0, 0, 0\.2\)/.test(rule), 'the drop softens');
  assert(!/0 14px 30px rgba\(0, 0, 0, 0\.34\)/.test(rule), 'the bruise shadow is gone');
  assert(/THE DRAWER LEARNS ITS THREE LAWS/.test(css), 'the law is documented at the seat');
});
ok('1b — the rows speak their own rungs (tags over stamps)', () => {
  assert(/\.gd-side-seat\.gd-cover-row-tags \{\s*\n\s*z-index: 2;\s*\n\}/.test(css), 'the tags seat rides z 2');
  assert(/\.gd-side-seat\.gd-cover-row-stamps \{\s*\n\s*z-index: 1;\s*\n\}/.test(css), 'the stamps seat rides z 1');
  assert(/seatClassName="gd-cover-row-tags"/.test(charSrc), 'the tags zone speaks its seat');
  assert(/seatClassName="gd-cover-row-stamps"/.test(charSrc), 'the stamps zone speaks its seat');
});
ok('1c — the pan keys center on the drawer\u2019s live height', () => {
  assert(/:has\(\> \.gd-collapse-zone\.is-cover-open\) \.gd-flow-arrow/.test(css), 'the open-drawer arrow law exists');
  assert(/--gd-cover-h, 100%/.test(css), 'the var carries a seat-height fallback');
  assert(/'--gd-cover-h'/.test(sideSrc), 'the overhang write carries the var');
  assert(/setProperty\('--gd-cover-h'/.test(sideSrc), 'the height flight writes the var on every beat');
});

// ===========================================================================
// 2 — THE VEILED COAT RIDES UNDER THE IMAGE
// ===========================================================================
ok('2a — the under-image scope drops the masked coat to the art\u2019s rung', () => {
  assert(/\.gd-fin-under-art \.gd-card-face-finish\.is-plate-only \{\s*\n\s*z-index: 1;\s*\n\}/.test(css), 'the veiled coat rides z 1');
  assert(/\.gd-fin-under-art \.gd-sleeve-clip \{\s*\n\s*z-index: 1;\s*\n\}/.test(css), 'the art keeps its own rung');
  assert(/THE VEILED COAT RIDES UNDER THE IMAGE/.test(css), 'the law is documented');
});
ok('2b — the scope arms on all three surfaces (finish + no image effect + image)', () => {
  for (const [label, m] of [
    ['grid', /cardFinish !== 'none' && !cardFinishOnImage && !!coverUrl && 'gd-fin-under-art'/.exec(gridSrc)?.[0]],
    ['look editor', /finish !== 'none' && !finishOnImage && !!imageUrl && 'gd-fin-under-art'/.exec(lookSrc)?.[0]],
    ['compact preview', /finUnderArt && 'gd-fin-under-art'/.exec(ribbonSrc)?.[0]],
  ]) {
    assert(m, `the ${label} seat arms the scope`);
  }
  assert(/const finUnderArt = finish !== 'none' && !finishOnImage && !!imageUrl;/.test(ribbonSrc), 'the preview computes its own gate');
});
ok('2c — the stamp-effect switch re-lifts the veiled coat (the ladder wins)', () => {
  assert(/\.gd-fin-on-stamp \.gd-card-face-finish\.is-plate-only \{\s*\n\s*z-index: 2;\s*\n\}/.test(css), 'the stamp law re-lifts the coat');
  const underAt = css.indexOf('.gd-fin-under-art .gd-card-face-finish.is-plate-only');
  const stampAt = css.indexOf('.gd-fin-on-stamp .gd-card-face-finish.is-plate-only');
  assert(stampAt > underAt, 'the stamp law is declared after the under-image law it overrules');
});

// ===========================================================================
// 3 — THE STARS VEIL WITH THE REST
// ===========================================================================
ok('3 — prismatic\u2019s star seat takes the plate-only veil again', () => {
  assert(!/seat\('gd-prism-stars', null, false\)/.test(ribbonSrc), 'the unmasked seat is retired');
  assert(/seat\('gd-prism-stars'\)/.test(ribbonSrc), 'the star seat veils with the family');
  assert(/veiled with the rest while IMAGE EFFECT is off/.test(ribbonSrc), 'the law is documented at the seat');
});

// ===========================================================================
// 5 — NURI LEANS ON THE CARD'S OWN COLOR
// ===========================================================================
ok('5a — the forge carries the card-tint veil', () => {
  assert(/\.gd-finish-nuri::before \{[\s\S]*?var\(--gd-card-tint, var\(--gd-panel\)\);[\s\S]*?mix-blend-mode: overlay;/.test(css), 'the veil seats the tint over the forge');
  assert(/opacity: 0\.46;/.test(/\.gd-finish-nuri::before \{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the veil speaks its 46% wash');
  assert(/THE FORGE LEANS ON THE CARD'S OWN COLOR/.test(css), 'the law is documented');
});
ok('5b — every surface writes --gd-card-tint', () => {
  assert(/\['--gd-card-tint'\]: character\.cardColor \|\| 'var\(--gd-panel\)'/.test(gridSrc), 'the grid card writes the tint');
  assert(/\['--gd-card-tint'\]: cardColor \|\| 'var\(--gd-panel\)'/.test(lookSrc), 'the look editor writes the tint');
  assert(/\['--gd-card-tint'\]: cardColor \|\| 'var\(--gd-panel\)'/.test(ribbonSrc), 'the compact preview writes the tint');
  assert(/color-mix\(in srgb, var\(--gd-card-tint, var\(--gd-panel\)\) 42%, transparent\)/.test(css), 'the artfin leans the same way');
});

// ===========================================================================
// 6 — MUMEI REPLACES OPALESCENT
// ===========================================================================
ok('6a — the constants seat mumei and retire the pearl', () => {
  assert(/{ id: 'mumei', label: 'Mumei' },/.test(constSrc), 'mumei takes the seat');
  assert(!/id: 'opalescent'/.test(constSrc), 'the pearl leaves the ladder');
  assert(/v === 'chromatic' \|\| v === 'polychrome' \|\| v === 'opalescent' \? 'mumei' : v;/.test(constSrc), 'the migration walks all three retired coats');
});
ok('6b — the coat speaks its four materials', () => {
  for (const seat of ['gd-finish-mumei', 'gd-mumei-streams', 'gd-mumei-feathers', 'gd-mumei-moon']) {
    assert(css.includes(`.${seat}`), `the ${seat} rule exists`);
  }
  assert(/gd-mumei-ink-sw 26s/.test(css), 'the broad rivers drift SW on the 26s clock');
  assert(/gd-mumei-ink-ne 17s/.test(css), 'the contour lines drift NE on the 17s clock');
  assert(/gd-mumei-fall-a 29s/.test(css) && /gd-mumei-fall-b 41s/.test(css), 'the two feather looms fall at their own tempos');
  assert(/gd-mumei-moon 13s/.test(css), 'the halo breathes on the 13s clock');
  assert(/MUMEI — THE NAMELESS INK/.test(css), 'the material is documented');
});
ok('6c — the pearl\u2019s seats left the sheet (mumei keeps the still)', () => {
  assert(!/\.gd-finish-opalescent \{/.test(css), 'the pearl body is retired');
  assert(!/\.gd-opal-tide/.test(css) && !/\.gd-opal-ripple/.test(css) && !/\.gd-opal-glint/.test(css), 'the tide/ripple/glints are retired');
  assert(!/\.gd-artfin-opalescent/.test(css), 'the pearl artfin is retired');
  const still = /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(still.includes('.gd-finish-mumei') && still.includes('.gd-mumei-streams') && still.includes('.gd-artfin-mumei'), 'mumei joins the reduced-motion still');
});
ok('6d — the layer seats mumei\u2019s family + the artfin', () => {
  assert(/finish === 'mumei' && \(/.test(ribbonSrc), 'the coat arms on mumei');
  for (const seat of ['gd-finish-mumei', 'gd-mumei-streams', 'gd-mumei-feathers', 'gd-mumei-moon']) {
    assert(ribbonSrc.includes(`seat('${seat}')`), `the ${seat} seat renders`);
  }
  assert(/onImage && \(finish === 'mumei' \|\| finish === 'nuri'\)/.test(ribbonSrc), 'the artfin speaks mumei + nuri');
  assert(/gd-artfin-mumei \{/.test(css), 'the artfin rule exists');
});

// ===========================================================================
// 7 — STAMP MOTION STANDS ON ITS OWN
// ===========================================================================
ok('7a — the switch gates on the stamp alone (both windows, one voice)', () => {
  const m = /<span>stamp motion<\/span>/.exec(styleSrc)?.[0];
  assert(m, 'the switch keeps its name');
  assert(!/\(noStamp \|\| !imageMotion\) && 'is-off'/.test(styleSrc), 'the image-motion gate is retired');
  assert(/className=\{clsx\('gd-check-row', noStamp && 'is-off'\)\}/.test(styleSrc), 'the grey law speaks the stamp alone');
  assert(/disabled=\{noStamp\}/.test(styleSrc), 'the input is blind only without a stamp');
  assert(/THE STAMP IS THE ONLY SUBJECT/.test(styleSrc), 'the law is documented at the switch');
});
ok('7b — the scope arms on stampMotion alone (the offset stays)', () => {
  assert(/stampMotion && 'gd-stamp-motion',/.test(lookSrc), 'the look editor\u2019s scope arms alone');
  assert(/cardStampMotion && 'gd-stamp-motion',/.test(gridSrc), 'the grid card\u2019s scope already stood alone');
  assert(/\+ 0\.42s/.test(css) && /calc\(var\(--gd-fin-ph, 0\) \* -7\.5s \+ 0\.42s\)/.test(css), 'the +0.42s offset to the image clock stays baked in');
  assert(/THE SWAY STANDS ON ITS OWN/.test(css), 'the CSS law is documented');
});

// ===========================================================================
// 8 — THE SQUISH IS NEVER INTERRUPTED
// ===========================================================================
ok('8 — the mid-flight kills are gone (the flight always finishes)', () => {
  assert(!/pressAtRef/.test(gridSrc), 'the 5px travel gate is retired');
  assert(!/killPulse\(\)/.test(gridSrc), 'no kill call survives at the press sites');
  assert(/firePulse\(e\);\s*\n\s*\}\}/.test(gridSrc), 'the pointerdown arms and nothing else');
  assert(/THE JELLY NEVER DIES MID-FLIGHT/.test(gridSrc), 'the law is documented');
  assert(/onDragStart=\{\(e\) => \{\s*\n\s*\/\/ 1\.4\.8 — the carry no longer retires the jelly/.test(gridSrc), 'the drag start keeps the flight');
});

// ===========================================================================
// 9 — NO WHITE OUTLINE AROUND THE BREATHING CARD
// ===========================================================================
ok('9 — the focus ring stands down while the flight runs', () => {
  assert(/\.gd-card-pulse\[data-pressed\]:focus-visible \{\s*\n\s*outline: none;\s*\n\}/.test(css), 'the ring is suppressed mid-flight');
  assert(/THE PULSE FLIES CLEAN OF THE RING/.test(css), 'the law is documented');
});

// ===========================================================================
// 10 — THE STAMPLESS HUE WASH RIDES THE BAND'S RUNG
// ===========================================================================
ok('10 — the stampless wash speaks z 2, over any coat', () => {
  assert(/\.gd-card-stamp-hue\.gd-hue-halfcard \{\s*\n\s*z-index: 2;\s*\n\}/.test(css), 'the wash carries the band\u2019s rung');
  assert(/THE STAMPLESS WASH RIDES THE BAND'S RUNG/.test(css), 'the law is documented');
});

// ===========================================================================
// 11 — THE SKELETON RETIRES
// ===========================================================================
ok('11 — the boot is one rAF and no placeholder', () => {
  assert(!/gd-panel-skeleton/.test(appSrc), 'the skeleton markup is gone');
  assert(!/startTransition\(/.test(appSrc), 'the transition lane is gone from App');
  assert(/const raf = requestAnimationFrame\(\(\) => setReady\(true\)\);/.test(appSrc), 'one rAF, then the build');
  assert(/return ready \? children : null;/.test(appSrc), 'nothing renders in the deferred frame');
  assert(!/gd-panel-skeleton-name/.test(css), 'the skeleton CSS is retired');
  assert(/THE SKELETON LEAVES, THE DRAWER ARRIVES LOADED/.test(appSrc), 'the law is documented');
});

// ===========================================================================
// 12 — THE NEW CARD TILE ANSWERS THE PRESS
// ===========================================================================
ok('12 — the add tile carries the jelly', () => {
  assert(/gd-card-add gd-card-pulse/.test(gridSrc), 'the tile wears the pulse class');
  assert(/onPointerDown=\{firePulse\}/.test(gridSrc), 'the press arms the flight');
  assert(/animationName === 'gd-press-pulse'/.test(gridSrc), 'the flight retires on its own end');
  assert(/THE TILE ANSWERS THE PRESS/.test(gridSrc), 'the law is documented');
});

// ===========================================================================
// 13 — THE FREEZE IS FULL AND SPEAKS THE MENUS
// ===========================================================================
ok('13a — the freeze list reaches every pseudo', () => {
  assert(/\*::before,\s*\n:root\.gd-coats-frozen \[data-gd-region\] \.gd-card-face-finish \*::after,/.test(css), 'the children\u2019s pseudos join the list');
  assert(/\.gd-card-face-artfin::before/.test(css), 'the artfin\u2019s pseudos join the list');
  assert(/\.gd-foil-ripple::before/.test(css), 'the ripple\u2019s pseudos join the list');
});
ok('13b — the menus arm the same reference-counted still', () => {
  /* 1.6.5 supersede: the still belongs to the Modal family alone — the
     ctx menu and the popover no longer arm it (a right-click / a filters
     dropdown must never pause the coats; only big windows do). The seats
     document their retirement; Modal keeps the counter. */
  assert(!/dataset\.gdModals/.test(ctxSrc) && !/classList\.add\('gd-coats-frozen'\)/.test(ctxSrc), '1.6.5: the ctx menu no longer arms the still');
  assert(/THE MENU NO LONGER STILLS THE COATS/.test(ctxSrc), 'the retirement is documented at the menu');
  assert(!/dataset\.gdModals/.test(popSrc) && !/classList\.add\('gd-coats-frozen'\)/.test(popSrc), '1.6.5: the popover no longer arms the still');
  assert(/THE DROPDOWN NO LONGER STILLS THE COATS/.test(popSrc), 'the retirement is documented at the popover');
});

// ===========================================================================
// 14 — EVERY WINDOW A THIRD FASTER
// ===========================================================================
ok('14 — the flights quicken everywhere', () => {
  assert(/\{ duration: 0\.15, ease: 'easeOut' \}/.test(appSrc) && !/duration: 0\.22/.test(appSrc), 'the panel + cover speak 0.15s');
  assert(/transition=\{\{ duration: 0\.1 \}\}/.test(modalSrc), 'the modal scrim speaks 0.1s');
  // 1.5.4 — the duration stays 0.12s for mount-flights; the retained
  // seat's CSS flight speaks the same clock.
  assert(/transition=\{flight \? undefined : \{ duration: 0\.12 \}\}/.test(modalSrc), 'the modal card speaks 0.12s');
  assert(/setTimeout\(\(\) => setSettling\(false\), 240\)/.test(modalSrc), 'the settle window shortens with them');
  assert(/THE WINDOWS QUICKEN/.test(modalSrc), 'the law is documented');
});

// ===========================================================================
// 15 — THE VERSION CHIPS GLIDE HOME
// ===========================================================================
ok('15a — a homecoming neighbor keeps its transition (no snap)', () => {
  // 1.5.4 — the seat speaks two rungs now (a glided chip keeps z 8 while
  // its transform clears; a never-moved chip keeps z 5) — both keep the
  // transition.
  const m = /if \(!d\) \{[\s\S]{0,900}?return \{ transition: 'transform 0\.15s ease', zIndex: (?:5|8) \};[\s\S]{0,400}?return \{ transition: 'transform 0\.15s ease', zIndex: (?:5|8) \};/.exec(sortSrc)?.[0];
  assert(m, 'the transition-only seat exists');
  assert(!/if \(!d\) return null;/.test(sortSrc), 'the null-return snap is retired');
  assert(/THE GLIDE HOME \("when dragging around an element such as a/.test(sortSrc), 'the law is documented');
});
ok('15b — the glide-home guard rides the drop-back + the interrupt', () => {
  assert(/\.gd-glide-home \.gd-sort-item \{\s*\n\s*transition: transform 0\.15s ease !important;\s*\n\}/.test(css), 'the guard\u2019s CSS law exists');
  assert(/if \(from === to\) \{\s*\n\s*armGlideHome\(cont\);/.test(sortSrc), 'the drop-back arms the guard');
  assert(/if \(drag0\?\.el\) armGlideHome\(containerRef\?\.current \|\| el\?\.parentElement \|\| null\);/.test(sortSrc), 'the interrupt arms the guard');
  assert(/const armGlideHome = \(cont\) => \{/.test(sortSrc), 'the arm helper exists');
  assert(/glideHomeContRef.current\?\.classList\?\.remove\?\.\('gd-glide-home'\);/.test(sortSrc), 'the unmount lifts the guard');
});

// ===========================================================================
// 16 — THE COATS LEAVE THE MAIN THREAD
// ===========================================================================
ok('16a — foil\u2019s last two loops are compositor-owned', () => {
  const body = /\.gd-finish-foil \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/gd-foil-gleam,/.test(body), 'the body no longer animates background-size');
  assert(/animation: gd-foil-hue 13s ease-in-out infinite;/.test(body), 'the body keeps the hue-ride alone');
  const rings = /\.gd-finish-foil::before \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/transform: scale\(0\.92\)/.test(/@keyframes gd-foil-gleam \{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the gleam became a scale breath');
  assert(/inset: -60px;/.test(rings), 'the ring field rides an oversized pseudo');
  assert(!/background-position: calc\(/.test(/\.gd-finish-foil-ripples \{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the ripples seat no longer paints the sparkle');
  const spark = /@keyframes gd-foil-sparkle \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(spark.includes('translate(84px, 0)'), 'the sparkle drifts by transform');
});
ok('16b — holographic\u2019s chaos loop retired (pseudos + children)', () => {
  assert(!/@keyframes gd-holo-chaos \{/.test(css), 'the background-position chaos keyframes are gone');
  const body = /\.gd-finish-holographic \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/animation: gd-finish-hue 12s linear infinite;/.test(body), 'the body keeps the hue-ride alone');
  assert(/gd-holo-chaos-ne 15s/.test(css), 'the shape lattice translates NE');
  assert(/\.gd-holo-shards \{[\s\S]*?gd-holo-shards-sw 11s/.test(css), 'the shard lattice rides its own child seat');
  assert(/\.gd-holo-dots \{[\s\S]*?gd-holo-dots 6\.5s/.test(css), 'the sparkle dots ride their own seat');
  assert(/<span className="gd-holo-shards" aria-hidden \/>/.test(ribbonSrc), 'the layer renders the children');
  assert(/THE CHAOS LOOP RETIRES/.test(css), 'the law is documented');
});

// ===========================================================================
// 17 — THE TRIMS WELD THEIR CORNERS
// ===========================================================================
ok('17 — every decorative seal speaks the tucked double ring', () => {
  for (const cls of ['gd-trim-frame', 'gd-trim-gallery', 'gd-trim-scallop', 'gd-trim-gold', 'gd-trim-vine', 'gd-trim-beads', 'gd-trim-rivet']) {
    const rule = new RegExp(`\\.${cls} \\{[\\s\\S]*?\\n\\}`).exec(css)?.[0] || '';
    assert(/inset 0 0 0 (2\.5|3|3\.5)px/.test(rule), `${cls} carries the outer weld lip`);
  }
  const dash = /\.gd-trim-dash::after \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/box-shadow/.test(dash), 'the line family stays exempt');
  assert(/THE SEAL WELDS ITS CORNERS/.test(css), 'the law is documented');
});

// ===========================================================================
// THE VERSION
// ===========================================================================
ok('the version is 1.4.8 everywhere', () => {
  assert.equal(JSON.parse(pkgSrc).version, '1.4.8', 'package.json');
  assert(/version: '1\.4\.8',/.test(constSrc), 'APP.version');
  assert(readmeSrc.includes('**v1.4.8**'), 'README');
  assert(changelogSrc.startsWith('## 1.4.8 — The Owl Takes The Seat'), 'CHANGELOG');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(websiteSrc.includes('<span class="ver">v1.4.8</span>'), 'website current card');
  assert(/releases\/download\/v1\.4\.8\//.test(websiteSrc), 'website download links');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(websiteSrc.includes('<td class="v">1.4.8</td>'), 'website table row');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
