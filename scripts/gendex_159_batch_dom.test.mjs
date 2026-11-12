// 1.4.9 batch — THE INK SIGNS ITS X.
// The reported items, each pinned at its root law:
//   1.  the cover drawer retires; the rows expand in the flow
//   2.  mumei -> mumeix: see-through streams, X marks, stars
//   3.  instances of mumei renamed (constants + CSS + JSX + migration)
//   4.  nuri's stripes lean toward the card's own color
//   5.  kintsugi joins the ladder after foil
//   6.  the off-screen wall + the hidden app sleep; textures halved
//   7.  the ribbons' shadow holds through the jelly
//   8.  the focus ring leaves the card for good
//   9.  the menu holds the card fully hovered
//   10. the hover glare replaces the filter (cursor loop CPU)
//   11. the reduced-motion still learns its scope
//   12. the trim seals weld their corners (tighter radius)
//   13. the window entrance is light (no scale, fade + rise)
//   14. the drawer arrives with its content (pass-through boot)
//   15. the NEW CARD tile breathes (pulse seat widened)
// Plus: the version is 1.6.5 everywhere.

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
assert.deepEqual = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};

const css = src('src/index.css');
const charSrc = src('src/components/CharacterView.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const gridSrc = src('src/components/GridView.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const sideSrc = src('src/components/SideFlow.jsx');
const modalSrc = src('src/components/Modal.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const ctxSrc = src('src/components/GdContextMenu.jsx');

// --- 1. the cover drawer retires ------------------------------------------
ok('1a — SideFlow seats no cover: the prop, the pinned height and the tinted plate all left', () => {
  assert(!/coverOpen/.test(sideSrc), 'coverOpen prop still referenced');
  assert(!/is-cover-seat/.test(sideSrc), 'is-cover-seat still armed');
  assert(!/is-cover-open/.test(sideSrc), 'is-cover-open still armed');
  assert(!/--gd-cover-h/.test(sideSrc), '--gd-cover-h still written');
});
ok('1b — the CSS cover laws left with the prop (tombstone remains)', () => {
  assert(!/\.gd-side-seat\.is-cover-seat/.test(css), 'is-cover-seat rules remain');
  assert(!/\.gd-cover-row-tags/.test(css) && !/\.gd-cover-row-stamps/.test(css), 'cover row rungs remain');
  assert(/THE COVER SEAT IS RETIRED/.test(css), 'the retirement note is missing');
});
ok('1c — CharacterView speaks neither cover prop nor row rung', () => {
  assert(!/coverOpen/.test(charSrc), 'coverOpen still passed');
  assert(!/gd-cover-row/.test(charSrc), 'cover row rung still passed');
});

// --- 2 + 3. mumeix: the rework + the rename --------------------------------
ok('2a — the streams went see-through (a third of the old voice)', () => {
  // 1.5.0 — THE INK STEPS INTO THE SUN: the broad rivers left outright; ONE
  // octave of contour lines carries the water (see-through, 0.16-0.22).
  const streams = css.match(/\.gd-numeix-streams::after \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/stroke-opacity='0\.1[0-9]'/.test(streams) || /stroke-opacity='0\.2[0-9]*'/.test(streams), 'the contour lines never stepped down');
  assert(!/stroke-opacity='0\.[3-9]'/.test(streams), 'a loud river survived the 1.5.0 pass');
});
ok('2b — the feathers left; X marks took the looms', () => {
  assert(!/\.gd-mumei-feathers/.test(css) && !/gd-mumeix-feathers/.test(css), 'feather looms remain');
  assert(/\.gd-numeix-xmarks::before/.test(css) && /\.gd-numeix-xmarks::after/.test(css), 'the X looms are missing');
  // 1.5.0 — the fall quickened and the twine rides inside (20s / 26s).
  assert(/gd-numeix-fall-a 20s/.test(css) && /gd-numeix-fall-b 26s/.test(css), 'the X looms lost their clocks');
});
ok('2c — the star field joined the wash', () => {
  assert(/\.gd-numeix-stars::before/.test(css), 'the star seat is missing');
  assert(/gd-numeix-stars-ne 36s/.test(css), 'the star clock is missing');
  assert(/seat\('gd-numeix-stars'\)/.test(ribbonSrc), 'the JSX never seats the stars');
});
ok('3a — the ladder speaks mumeix (and kintsugi after foil)', () => {
  assert(constSrc.includes("{ id: 'numeix', label: 'Numeix' }"), 'mumeix not seated');
  // 1.5.0 — the THEME keeps its mumei id under the Mumeix name (the rename
  // law: ids never move); only a FINISH seat would be a bare mumei.
  assert(!/\{ id: 'mumei', label: 'Mumei' \}/.test(constSrc), 'a bare mumei finish id remains');
});
ok('3b — the migration walks mumei onto mumeix with the retired coats', () => {
  assert(/v === 'chromatic' \|\| v === 'polychrome' \|\| v === 'opalescent' \|\| v === 'mumei' \|\| v === 'mumeix'/.test(constSrc), 'the migration map lost the retired coats (1.6.4: mumeix joined the road)');
  assert(/v === 'kintsugi'\n      \? 'auric'/.test(constSrc), 'the migration map lost the kintsugi road onto auric (1.5.0)');
});
ok('3c — the sheet speaks no bare mumei finish seat', () => {
  assert(!/\.gd-finish-mumei \{/.test(css), 'a .gd-finish-mumei rule remains');
  assert(!/\.gd-mumei-/.test(css), 'a .gd-mumei-* rule remains');
  assert(!/gd-artfin-mumei\b/.test(css), 'a bare artfin-mumei remains');
});

// --- 4. nuri's stripes lean ------------------------------------------------
ok('4a — the tongues paint through the card\'s raw tint at the 1.5.0 forge weights', () => {
  const licks = css.match(/\.gd-nuri-licks::before \{[\s\S]*?\n  -webkit-mask-size:/)?.[0] || '';
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the tongues speak their classic
     law again — the card's RAW tint mixed at the 1.5.0 forge weights
     (58/48/40), verbatim from the 1.9.2 sheet; the tint-hand lean
     retired with the derivation that wrote it. */
  assert(/color-mix\(in srgb, var\(--gd-card-tint, var\(--gd-panel\)\) 58%, #ff7a26\)/.test(licks), 'the licks never color-mix the raw tint');
  assert(/color-mix\(in srgb, var\(--gd-card-tint, var\(--gd-panel\)\) 40%, #ffe3a0\)/.test(licks), 'the licks lost their crown weight');
  assert(/mask-image:/.test(licks) && /-webkit-mask-image:/.test(licks), 'the alpha mask never arrived');
});
ok('4b — the body veil speaks its classic depth (the raw tint at 0.5)', () => {
  // anchored to the sheet's own margin — the ground scopes retired in
  // 1.9.10, the veil's own rule is the only seat left
  const veil = /^\.gd-finish-nuri::before \{[\s\S]*?\n\}/m.exec(css)?.[0] || '';
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil reads the card's RAW
     tint at its classic 0.5 opacity again — the 1.9.4 0.4 step and the
     tint-hand ink retire with the derivation. */
  assert(/background: var\(--gd-card-tint, var\(--gd-panel\)\);/.test(veil), 'the veil never took the card tint');
  assert(/opacity: 0\.5;/.test(veil), 'the veil lost its weight');
  assert(/mix-blend-mode: overlay;/.test(veil), 'the veil lost its blend');
});

// --- 5. kintsugi ------------------------------------------------------------
ok('5a — the constants seat kintsugi right after foil', () => {
  const ladder = constSrc.match(/export const CARD_FINISHES = \[([\s\S]*?)\];/)?.[1] || '';
  const ids = [...(ladder.matchAll(/\{ id: '([a-z]+)'/g))].map((m) => m[1]);
  // 1.5.0 — kintsugi retired onto AURIC (the living gold, shorter name).
  // 1.6.4 — mumeix walked onto numeix (the rename's own step).
  assert.deepEqual(ids, ['none', 'numeix', 'foil', 'auric', 'holographic', 'prismatic', 'nuri'], 'the ladder order broke: ' + ids.join(','));
});
ok('5b — the coat speaks its four materials', () => {
  for (const seat of ['.gd-finish-auric', '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-artfin-auric']) {
    assert(css.includes(seat), seat + ' rule missing');
  }
  assert(/gd-auric-run 13s/.test(css) && /gd-auric-breath 8s/.test(css), 'an auric clock is missing');
});
ok('5c — the layer seats the family + the artfin', () => {
  assert(/finish === 'auric' && \(/.test(ribbonSrc), 'auric never seats in the layer');
  for (const seat of ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep']) {
    assert(ribbonSrc.includes(`seat('${seat}')`), seat + ' never seated in JSX');
  }
  assert(/finish === 'numeix' \|\| finish === 'nuri' \|\| finish === 'auric'/.test(ribbonSrc), 'the artfin gate never gained auric');
});

// --- 6. the sleeping wall ----------------------------------------------------
ok('6a — the off-view pause law speaks the whole family', () => {
  const law = css.match(/\.gd-card\[data-off-view\] \.gd-card-face-finish,[\s\S]*?animation-play-state: paused !important;\n\}/)?.[0] || '';
  assert(law.includes('.gd-card-face-finish *::after'), 'the pause law stops at the seats');
  assert(law.includes('.gd-foil-ripple'), 'the ripple never pauses');
});
ok('6b — the hidden app pauses the whole family', () => {
  assert(/html\.gd-app-hidden \.gd-card-face-finish,/.test(css), 'the hidden law is missing');
});
ok('6c — the grid watches the viewport (IO + the off-view mark)', () => {
  assert(/IntersectionObserver/.test(gridSrc), 'the observer never arrived');
  assert(/data-off-view/.test(gridSrc), 'the off-view mark is never written');
  assert(/rootMargin: '120px 0px'/.test(gridSrc), 'the pre-wake margin is missing');
});
ok('6d — App arms the hidden class on visibilitychange', () => {
  assert(/visibilitychange/.test(appSrc) && /gd-app-hidden/.test(appSrc), 'the visibility law is missing');
});
ok('6e — the oversized pseudos keep only the sides they travel', () => {
  // 1.5.0 — the broad river retired with the mumeix rework; every coat
  // that still travels keeps only the sides its flight needs.
  // 1.6.7 — two pins move with the entry-side law ("the holographic
  // layer ... as it moves to the bottom it gets cropped"): the holo
  // lattice's overhang flipped to the sides its content ENTERS from
  // (TOP + LEFT for the +x/+y drift — the old bottom+left overhang
  // starved the entry and the lattice emptied from the top as it
  // descended), and the auric flakes' halo flipped to the BOTTOM when
  // the coat's leaf turned to RISING (the 1.6.7 direction law). The
  // X looms keep their falling halo untouched.
  assert(!/inset: -220px -220px 0 0;/.test(css), 'a broad-river halo survived the rework');
  assert(/inset: 0 0 -132px -132px;/.test(css), 'the contour lines keep their full halo');
  assert(/inset: -420px -8px 0 -8px;/.test(css), 'the X looms keep their full halo');
  assert(/inset: 0 -1px 0 -84px;/.test(css), 'the foil sparkle keeps its full halo (or its LEFT gap)');
  assert(/inset: -128px 0 0 -128px;/.test(css), 'the holo chaos lattice feeds its ENTRY sides (1.6.7)');
  assert(/inset: 0 -8px -360px -8px;/.test(css), 'the auric flakes feed their RISE (1.6.7)');
});

// --- 7. the shadow holds ------------------------------------------------------
ok('7 — the ribbons hold their shadow through the flight', () => {
  assert(/\.gd-card\.gd-card-pulse\[data-pressed\] \.gd-card-ribbons \{\n  filter: drop-shadow\(1px 1\.9px 0 rgba\(0, 0, 0, 0\.42\)\);\n\}/.test(css), 'the held shadow seat is missing');
});

// --- 8. the ring leaves --------------------------------------------------------
ok('8 — the card never paints a focus ring (press, drag, or rest)', () => {
  const law = css.match(/\.gd-card:focus,\n\.gd-card:focus-visible,\n\.gd-card-add:focus,\n\.gd-card-add:focus-visible \{\n  outline: none;\n\}/);
  assert(law, 'the full ring retirement is missing');
});

// --- 9. the menu holds the card -------------------------------------------------
ok('9a — the menu holds every wrapping card (ctxHoldList)', () => {
  assert(/function ctxHoldList/.test(ctxSrc), 'ctxHoldList never arrived');
  assert(/gd-card-hover/.test(ctxSrc), 'the hold walk never looks for cards');
  assert(/hotRef\.current = live;/.test(ctxSrc), 'the hold never became a list');
});
ok('9b — the hot card speaks the base hover geometry + the glare + the column', () => {
  assert(/\.gd-card-hover\.is-ctx-hot \{\n  transform: translate\(-2px, -2px\);\n  box-shadow: 6px 6px 0 rgba\(0, 0, 0, 0\.45\);/.test(css), 'the base pairing never upgraded');
  assert(/\.gd-card-hover\.is-ctx-hot \.gd-sleeve-clip::after/.test(css), 'the hot card never wears the glare');
  assert(/\.gd-card\.is-ctx-hot \.gd-card-hovercol/.test(css), 'the hot card never shows its column');
});
ok('9c — the themes carry their own hot arms', () => {
  for (const theme of ['burrito', 'archive', 'moss', 'glacier']) {
    assert(css.includes(`[data-theme='${theme}'] .gd-card-hover.is-ctx-hot,`), theme + ' never gained its hot arm');
  }
});
ok('9d — the version badge seats while the card is hot', () => {
  assert(/\.gd-card\.gd-card-hover\.is-ctx-hot \.gd-card-foot-vers\.has-vers,/.test(css), 'the template flip never gained the hot arm');
  assert(/\.gd-card\.gd-card-hover\.is-ctx-hot \.gd-card-foot-vers\.has-vers \.gd-card-vers,/.test(css), 'the badge seat never gained the hot arm');
});

// --- 10. the glare replaces the filter ------------------------------------------
ok('10a — no brightness filter rides the hover', () => {
  assert(!/filter: brightness\(1\.05\) saturate\(1\.04\)/.test(css), 'the filter survived');
});
ok('10b — the glare pseudo fades on the compositor', () => {
  assert(/\.gd-card-hover \.gd-sleeve-clip::after \{/.test(css), 'the glare seat is missing');
  assert(/transition: opacity 0\.24s ease-out;/.test(css), 'the glare never learned to fade');
});
ok('10c — the hover column carries its own class', () => {
  assert(/gd-card-hovercol/.test(gridSrc), 'the column class never arrived');
});

// --- 11. the still learns its scope ------------------------------------------------
ok('11a — the global kill switch retires', () => {
  assert(!/html\.gd-reduced-motion \*,/.test(css), 'the global kill remains');
});
ok('11b — the targeted stills speak the finish family + the card moves alone', () => {
  // 1.5.0 — THE STILL SPEAKS THE FAMILY, NOT THE NAMES: one family selector
  // (.gd-card-face-finish + its pseudos + its children + the artfin) covers
  // every coat the ladder will ever grow.
  assert(/html\.gd-reduced-motion \.gd-card-face-finish,/.test(css), 'the manual still never spoke the family');
  assert(/\.gd-card-face-finish \*/.test(css.match(/html\.gd-reduced-motion \.gd-card-face-finish,[\s\S]*?transition: none !important;\n\}/)?.[0] || ''), 'the family still stops at the seats');
  assert(/html\.gd-reduced-motion \.gd-glide-home \.gd-sort-item,/.test(css), 'the manual still never reached the glide-home');
});
ok('11c — the jelly speaks under the switch (the pulse never stills)', () => {
  const still = css.match(/html\.gd-reduced-motion \.gd-finish-foil::before,[\s\S]*?transition: none !important;\n\}/)?.[0] || '';
  assert(!/gd-press-pulse/.test(still), 'the press pulse joined the still');
});
ok('11d — skipAnimations leaves (framer keeps reducedMotion alone)', () => {
  assert(!/skipAnimations=\{/.test(appSrc), 'the skipAnimations prop survived');
  assert(/reducedMotion=\{db\?\.settings\?\.reduceMotion \? 'always' : 'normal'\}/.test(appSrc), 'the framer still lost its seat');
});
ok('11e — the OS hover guards retired (the shine + zoom keep their voice)', () => {
  assert(!/\.gd-card-shine::before \{\n    display: none;/.test(css), 'the shine still dies under the OS query');
});

// --- 12. the corner weld ------------------------------------------------------------
ok('12 — every decorative seal speaks a radius tighter than its trim', () => {
  for (const trim of ['frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet']) {
    const rule = css.match(new RegExp('\\.gd-trim-' + trim + ' \\{[\\s\\S]*?\\n\\}'))?.[0] || '';
    assert(rule.includes('max(calc(var(--trim-radius) - 2px), 0px)'), trim + ' never tightened its corner');
  }
});

// --- 13 + 14. the windows ------------------------------------------------------------
ok('13 — the entrance is light: the pop-in pulse (1.5.9 — fade + a centered scale, never a rise)', () => {
  assert(!/initial=\{\{ opacity: 0, scale: 0\.96, y: 8 \}\}/.test(modalSrc), 'the old scale entrance survived');
  // 1.5.9 — the same law speaks twice: framer's initial for mount-flights,
  // and the CSS flight for the retained seat (the pop, either way).
  assert(/initial=\{flight \|\| parked \? undefined : \{ opacity: 0, scale: 0\.965 \}\}/.test(modalSrc), 'the pop-in pulse never arrived');
  assert(/animate=\{flight \? undefined : \{ opacity: 1, scale: 1 \}\}/.test(modalSrc), 'the card animate lost its landing scale');
  assert(/\.gd-modal-layer\.gd-modal-flight \.gd-modal-card \{[\s\S]*?transform: scale\(0\.965\);[\s\S]*?\}/.test(css), 'the CSS flight never learned the pop');
});
ok('14 — the panel boot is a pass-through (no rAF gate)', () => {
  assert(/function DeferredPanelBoot\(\{ children \}\) \{\n  return children;\n\}/.test(appSrc), 'the boot still gates a frame');
});

// --- 15. the tile breathes --------------------------------------------------------------
ok('15 — the pulse seat is the class alone (the tile included); 1.9.12 — the flight speaks the dial', () => {
  assert(/\.gd-card-pulse \{\n  transform-origin: 50% 50%;\n\}/.test(css), 'the base seat drifted');
  // 1.9.12 — THE PRESS DIAL: the flights key on the root attribute App
  // arms; the class alone still owns the seat (no .gd-card demand, the
  // add tile included), and the unattributed rule is RETIRED so the
  // default 'none' never flies.
  assert(/html\[data-gd-press-mode='squish'\] \.gd-card-pulse\[data-pressed\] \{\n  animation: gd-press-pulse 620ms ease-in-out both;\n\}/.test(css), 'the jelly flight lost its class-alone seat');
  assert(/html\[data-gd-press-mode='pulse'\] \.gd-card-pulse\[data-pressed\] \{\n  animation: gd-press-bloom 380ms ease-out both;\n\}/.test(css), 'the bloom flight lost its class-alone seat');
  assert(!/^\.gd-card-pulse\[data-pressed\] \{/m.test(css), 'an unattributed flight rule still speaks');
});

// --- the version --------------------------------------------------------------------------
ok('the version is 1.6.5 everywhere', () => {
  assert.equal(JSON.parse(src('package.json')).version, '1.9.19', 'package.json');
  assert(constSrc.includes("version: '1.9.19',"), 'constants');
  assert(src('README.md').includes('**v1.9.19**'), 'README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('<span class="ver">v1.8.6</span>'), 'website card');
  assert(src('CHANGELOG.md').startsWith('## 1.9.19 — The Ends Trade Places'), 'CHANGELOG');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
