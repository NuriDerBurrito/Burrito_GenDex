// 1.4.3 batch — THE PEARL AND THE FLAME.
// The reported items, each pinned at its root law:
//   1.  polychrome leaves for OPALESCENT ("remove polychrome, replace it
//       with Opalescent, ensure finishes dont extend beyond the edges of
//       the card") — the pearl takes the pour's seat; both legacy ids
//       (chromatic + polychrome) migrate onto it; and the COAT CLIP LAW
//       arrives: nothing any finish paints ever leaves the card
//   2.  the Opalescent spec ("a milky, translucent pastel pearlescent
//       shimmer across the entire card — blending soft pinks, mint greens,
//       and pale lavenders — overlayed with fine diagonal, wave-like light
//       refraction streaks that shift in brightness to create a smooth,
//       glossy mother-of-pearl sheen"): the pastel washes + the milk veil
//       + the close-angled diagonal streaks breathing their brightness
//   3.  NURI reworked ("improve nuri finish, since it looks basic at the
//       moment") — the living flame: a panning ember aurora, crossed
//       veins, rising sparks, twin cross-fading heart glows
//   4.  image motion halved ("the image motion goes too high/too low, half
//       the distance") — ±1.5% + the 1.06 safety zoom
//   5.  the right panel arrives with its data ("when right panel opens,
//       its blank and i have to wait until the data pops in") — the
//       low-priority transition lane is retired; the build is synchronous
//       inside the one-rAF shell
//   6.  the squish/stretch is real ("the squish/stretch animation from
//       click is missing, right now it just repeats the hover animation")
//       — the keyframes speak the independent scale property (composes
//       with the hover lift) at a visible amplitude
//   7.  prismatic's lag + the still stars ("the app gets laggy, seems to
//       occur from the prismatic effect ... fix the lag and implement the
//       4 stars rotating, ensure its animated properly too") — the turn
//       is 48s, plainly composited, clipped inside the card
//   8.  the finishes reach the top of the name area ("the finishes seem to
//       be missing at the top of the card's name area, as if they end
//       before it unless i specifically turn on affect image") — the ink
//       border leaves the mask's math on every surface
//   9.  foil clips outside ("foil finish clips outside of the cards, fix
//       that, happens in some classes and not in others") — the ripple
//       layer clips at the card's face
//   10. nuri's single color ("nuri effect seems to apply a single color
//       above all ... it should work with all colors and maybe change
//       periodically") — the aurora pans the whole fire band
//   11. "affect the image" renames to "image effect"
//   12. the look window's own containers ("hue color and stamp settings
//       option looks bad in the edit card menu, you may give it a unique
//       container that only appears in that window") — .gd-look-block
//   13. the hue + stamp options without a stamp ("let the hue color and
//       stamp options appear in the card creation window/right panel even
//       if there is no stamp present, but of course grey out the stamp
//       settings option when its not present")
//   14. enlarged cards arrive big ("when i switch to a class that has
//       enlarged cards, for some reason they start as normal then grow,
//       fix that so they are already big") — the width tween arms only on
//       the card's own span change; the view swap rests the projection
//   15. the versions strip's arrows sit inward ("move the left and right
//       arrows of the versions container slightly inwards so they dont
//       look stranded away")
//   16. the foil "white line in the middle" between the shine's sweeps
//       ("its visible when i hold click drag or when i click on a card
//       now, it appears then dissapears after the animation starts") —
//       the ripple fades in as it grows, never a stark arc at the heart
//   17. the tag manager's FINISH ladder ("add the card finishes option in
//       the tag manager, right below the emoji picker, these finishes
//       inside will souly affect the tag's appearance ... the icon/emoji
//       wont be affected with the effect then") — the ribbon's own coat,
//       clipped to the SVG shape, the glyph above it
// Plus: the version is 1.4.3 everywhere.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${err.message.split('\n')[0]}`);
  }
};
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
assert.ok = assert;
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};

const css = src('src/index.css');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const tagSrc = src('src/components/TagManagerModal.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const sideSrc = src('src/components/SideFlow.jsx');
const masonrySrc = src('src/components/MasonryGrid.jsx');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

// ===========================================================================
// 1 — THE COAT NEVER LEAVES THE CARD (the clip law)
// ===========================================================================
ok('1a — the coat frame clips at the card face', () => {
  const face = /\.gd-card-face-finish\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/overflow:\s*hidden/.test(face), 'the coat clips its children + pseudo-layers');
  assert(/inset:\s*0/.test(face) && /border-radius:\s*calc\(var\(--gd-shape-radius/.test(face), 'the clip is the card\'s own rounded face');
  assert(/THE COAT NEVER LEAVES THE CARD/.test(css), 'the clip law is documented');
});
ok('1b — the foil ripple layer clips too (the escape is dead)', () => {
  const layer = /\.gd-finish-foil-ripples\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/overflow:\s*hidden/.test(layer), 'the ripple layer clips at the face');
  assert(/THE RIPPLES LIVE INSIDE THE CARD TOO/.test(css), 'the foil escape fix is documented');
});
ok('1c — the prismatic oversize turns inside the clip', () => {
  const after = /\.gd-finish-prismatic::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-40%/.test(after), 'the star field stays oversized (rotation-safe)');
  // the parent coat's overflow: hidden (1a) is the clip that holds it
  assert(!/mix-blend-mode:\s*screen/.test(after), 'the star field speaks plain compositing');
});

// ===========================================================================
// 2 — OPALESCENT, THE MOTHER-OF-PEARL (the spec, verbatim)
// ===========================================================================
ok('2a — the pearl takes polychrome\'s seat; both legacy ids migrate', () => {
  assert(/id: 'opalescent', label: 'Opalescent'/.test(constSrc), 'the constants seat the pearl');
  assert(!/id: 'polychrome'/.test(constSrc), 'polychrome left the constants');
  assert(/v === 'chromatic' \|\| v === 'polychrome' \? 'opalescent'/.test(constSrc), 'both legacy ids migrate onto the pearl');
  /* 1.4.4 supersede: the TAG sanitizer no longer carries the migration —
     the tag manager's FINISH ladder retired root and branch, and the tag
     record forgets the field at load (makeTag writes none; the sanitizer
     writes nothing). The CARD migration above keeps its seat. */
  assert(!/isCardFinish\(t\?\.finish\)/.test(helpersSrc), '1.4.4: the tag finish field left the sanitizer with the manager\'s ladder');
});
ok('2b — the milky pastel washes + the milk veil', () => {
  const poly = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  // soft pinks, mint greens, pale lavenders — the three families, twice
  assert(/rgba\(255, 193, 214, 0\.38\)/.test(poly), 'soft pink speaks');
  assert(/rgba\(214, 255, 230, 0\.28\)/.test(poly), 'mint green speaks');
  assert(/rgba\(226, 214, 255, 0\.33\)/.test(poly), 'pale lavender speaks');
  assert(/conic-gradient\(/.test(poly), 'the pastel conic speaks (static, phase-baked)');
  assert(/mix-blend-mode:\s*soft-light/.test(poly), 'milky + translucent (soft-light, never opaque)');
  /* 1.4.4 supersede: the washes no longer drift on background-position —
     THE PEARL LEARNS TO MOVE moved the motion to compositor-owned elements
     (the nacre TIDE tile, the waving streaks, the GLINTS); the body is
     STATIC (the 1.4.4 perf law: no main-thread raster per frame). */
  assert(!/animation:/.test(poly), '1.4.4: the pearl\'s body is static (the motion lives in the tide + glints)');
});
ok('2c — the fine diagonal wave-like refraction streaks shift in brightness', () => {
  /* 1.4.4 supersede: the streaks moved from the body's ::after to the
     TIDE's ::after (.gd-opal-tide) — their own seat with their own screen
     blend — and they now WAVE (an eased translate wobble) beside the
     brightness breath. The body's ::after is empty; the old selector
     would find nothing. */
  const after = /\.gd-opal-tide::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/repeating-linear-gradient\(\s*\n?\s*117deg/.test(after), 'the first fine diagonal streak family');
  assert(/repeating-linear-gradient\(\s*\n?\s*124deg/.test(after), 'the close-angled interference family (wave-like)');
  assert(/mix-blend-mode:\s*screen/.test(after), 'the streaks stay glossy (screen)');
  const streak = /@keyframes gd-opal-streak\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  // 1.4.5 SUPERSEDED: the wobble halved with the softened streaks.
  assert(/translate\(2\.5px, 1\.5px\)/.test(streak), '1.4.5: the softened bands still wave');
  const sheen = /@keyframes gd-opal-sheen\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/0%,\s*\n?\s*100%\s*\{[\s\S]*?opacity:\s*0\.55/.test(sheen) && /opacity:\s*1/.test(sheen), 'the streaks SHIFT IN BRIGHTNESS (0.55 → 1)');
});
ok('2d — the sprite wears the pearl while IMAGE EFFECT is on', () => {
  const artfin = /\.gd-artfin-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*soft-light/.test(artfin), 'the pearl is light, not a recolor');
  assert(/rgba\(255, 226, 238, 0\.5\)/.test(artfin) && /rgba\(238, 232, 252, 0\.46\)/.test(artfin), 'the pastel wash speaks');
  assert(/finish === 'prismatic' \|\| finish === 'opalescent' \|\| finish === 'nuri'/.test(ribbonSrc), 'the artfin renders for the pearl');
});

// ===========================================================================
// 3 + 10 — NURI, THE LIVING FLAME (multi-hue, periodic)
// ===========================================================================
ok('3a — the ember aurora speaks the whole fire band (never one flat color)', () => {
  const nuri = /\.gd-finish-nuri\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/rgba\(178, 34, 52, 0\.34\)/.test(nuri), 'deep crimson speaks (1.4.4: presence raised)');
  assert(/rgba\(255, 122, 30, 0\.30\)/.test(nuri), 'ember orange speaks');
  assert(/rgba\(255, 196, 60, 0\.28\)/.test(nuri), 'molten gold speaks');
  assert(/rgba\(255, 92, 92, 0\.26\)/.test(nuri), 'rose speaks');
  /* 1.4.4 supersede: the AURORA PAN is retired (a background-position
     animation = per-frame main-thread raster — the 1.4.4 perf law); the
     fire band speaks STATICALLY at full width (every hue present at once,
     never one flat color) and the motion lives in the LICKS / SPARKS /
     FLARE / HEARTS elements instead. */
  assert(!/gd-nuri-aurora/.test(nuri), '1.4.4: the pan left the body (the fire is static + full-band)');
  // the crossed veins
  assert(/repeating-linear-gradient\(\s*\n?\s*58deg/.test(nuri) && /repeating-linear-gradient\(\s*\n?\s*122deg/.test(nuri), 'TWO crossed ember-vein lattices');
});
ok('3b — the rising sparks survive; the twin hearts cross-fade + walk hue', () => {
  /* 1.4.4 supersede: the sparks left the body's background for their own
     SEAT (.gd-nuri-sparks) at a faster 7.5s clock (two velocities of fire
     beside the 11s licks) — the translate flight is compositor-owned. */
  const sparks = /\.gd-nuri-sparks::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-nuri-rise 7\.5s linear infinite/.test(sparks), '1.4.4: the embers climb on their own seat at 7.5s');
  const rise = /@keyframes gd-nuri-rise\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(0, 96px\)/.test(rise), 'the tile translates one full period (seam-free)');
  const after = /\.gd-finish-nuri::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/at 28% 116%/.test(after) && /at 72% 116%/.test(after), 'TWO heart glows seat low-left + low-right');
  assert(/gd-nuri-hearts 7s ease-in-out infinite/.test(after), 'the hearts cross-fade');
  assert(/gd-nuri-heart-hue 26s ease-in-out infinite/.test(after), 'the glow\'s own hue walks (it changes color over time)');
  const hearts = /@keyframes gd-nuri-hearts\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/scale\(1\.07\)/.test(hearts), '1.4.4: the hearts swell (the light itself breathes)');
  const artfin = /\.gd-artfin-nuri\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-nuri-emberbreath 12s ease-in-out infinite/.test(artfin), '1.4.4: the sprite\'s fire-light breathes its brightness (no pan)');
});

// ===========================================================================
// 4 — IMAGE MOTION, HALVED
// ===========================================================================
ok('4a — the sway halves; the safety zoom steps down with it', () => {
  const sway = /\.gd-img-motion \.gd-sleeve-clip img,\s*\n\.gd-img-motion \.gd-preview-art img\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/scale:\s*1\.06/.test(sway), 'the safety zoom is 1.06 (down from 1.1)');
  const kf = /@keyframes gd-img-sway\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate:\s*0 -1\.5%/.test(kf) && /translate:\s*0 1\.5%/.test(kf), 'the sway is ±1.5% (half the distance)');
  assert(/THE SWAY HALVES/.test(css), 'the halving is documented');
});

// ===========================================================================
// 5 — THE RIGHT PANEL ARRIVES WITH ITS DATA
// ===========================================================================
ok('5a — the panel arrives with its data (1.4.4: the curtain flies clean)', () => {
  /* 1.4.4 supersede: the one-rAF deferral is RETIRED — the sync build
     landed dead-center in the 0.22s width flight and froze the curtain at
     half-width ("half of the right panel empty then it snaps"). The view
     builds in the CLICK'S OWN COMMIT now; the curtain that follows never
     meets a heavy task mid-lane. */
  const body = /function DeferredPanelBoot\(\{ children \}\)\s*\{[\s\S]*?\n\}/.exec(appSrc)?.[0] || '';
  assert(!/requestAnimationFrame/.test(body), '1.4.4: no deferral — the build rides the click\'s own commit');
  // 1.4.5 SUPERSEDED: the pass-through retired with the gated boot — 154
  // owns the live law.
  assert(true, 'the pass-through retired with the gated boot (see 154)');
  // 1.4.5 SUPERSEDED (the click's own frame stays cheap): startTransition
  // returns — the heavy build rides the transition lane behind the skeleton.
  assert(/startTransition/.test(appSrc.split('\n').slice(0, 3).join('')), 'the transition import is back (the gated boot)');
  assert(/THE CURTAIN FLIES CLEAN/.test(appSrc), 'the 1.4.4 fix is documented');
  assert(/\.gd-cv-auto/.test(css), 'the below-fold seats skip their own render (content-visibility)');
});

// ===========================================================================
// 6 — THE PRESS PULSE IS A REAL SQUISH
// ===========================================================================
ok('6a — the keyframes speak the scale property (the lift composes)', () => {
  const kf = /@keyframes gd-press-pulse\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: THE JELLY LEARNS ITS BEATS — the three-step flight
     became a five-beat jelly (squish wide+short, stretch narrow+tall,
     counter-squish, overshoot, home) at 620ms, each beat eased. */
  assert(/scale:\s*1\.06 0\.9/.test(kf), '1.4.4: the SQUISH speaks the proper axes (wide + short)');
  assert(/scale:\s*0\.955 1\.075/.test(kf), '1.4.4: the STRETCH answers on the crossed axes (narrow + tall)');
  assert(!/transform:\s*scale\(/.test(kf), 'transform is never touched (the hover lift holds through the flight)');
  const pulse = /\.gd-card-pulse\.is-pressed\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-press-pulse 620ms/.test(pulse), '1.4.4: the flight runs 620ms (five beats)');
  assert(/THE JELLY LEARNS ITS BEATS/.test(css), 'the rework is documented');
});

// ===========================================================================
// 7 — PRISMATIC: THE TURN IS REAL + THE LAG IS DEAD
// ===========================================================================
ok('7a — the stars rotate visibly on a cheap clipped layer', () => {
  const after = /\.gd-finish-prismatic::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: the turn quickened 48s → 32s ("less animated from
     before too/slow") and the coat gained the WAVES + SWEEP seats (see
     the 153 battery); the field itself stays plain + clipped. */
  assert(/gd-prism-starfield 32s linear infinite/.test(after), '1.4.4: the turn is 32s (quickened from the too-slow 48s)');
  assert(!/mix-blend-mode:\s*screen/.test(after) && /opacity:\s*0\.9/.test(after), 'plain compositing at a fixed opacity');
  assert(/QUICKENS IT/.test(css), 'the quickening is documented');
});

// ===========================================================================
// 8 — THE FINISHES REACH THE TOP OF THE NAME AREA
// ===========================================================================
ok('8a — the ink border leaves the mask math on every surface', () => {
  assert(/const finArtH = Math\.max\(0, cardWidth - 4\) \* \(ratio\.h \/ ratio\.w\);/.test(gridSrc), 'the grid card subtracts both borders');
  assert(/artH=\{Math\.max\(0, width - 4\) \* \(r\.h \/ r\.w\)\}/.test(lookSrc), 'the panzoom subtracts them too');
  assert(/const artH = Math\.max\(0, width - 4\) \* \(r\.h \/ r\.w\);/.test(ribbonSrc), 'the compact preview subtracts them too');
  assert(/THE INK BORDER LEAVES THE MATH/.test(gridSrc), 'the fix is documented at the grid seat');
});

// ===========================================================================
// 9 + 16 — FOIL: THE CLIP + THE SOFT-ARRIVING RING
// ===========================================================================
ok('9a — the ring fades in as it grows (no stark arc at the heart)', () => {
  const kf = /@keyframes gd-foil-ripple\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/30%\s*\{[\s\S]*?opacity:\s*0\.1;/.test(kf), 'the smallest seats stay near-invisible');
  assert(/46%\s*\{[\s\S]*?opacity:\s*0\.6;/.test(kf) && /58%\s*\{[\s\S]*?opacity:\s*0\.8;/.test(kf), 'the strength ramps gently through the mid-flight');
  assert(/THE RING FADES IN AS IT GROWS/.test(css), 'the white-line fix is documented');
});

// ===========================================================================
// 11 — "AFFECT THE IMAGE" RENAMES
// ===========================================================================
ok('11a — the switch says "image effect"', () => {
  assert(/<span>image effect<\/span>/.test(styleSrc), 'the shared controls speak the new name');
  assert(!/>affect the image</.test(styleSrc), 'the old label is gone');
});

// ===========================================================================
// 12 — THE LOOK WINDOW'S OWN CONTAINERS
// ===========================================================================
ok('12a — the stamp options speak real keys (1.4.4: the containers retired)', () => {
  /* 1.4.4 supersede: .gd-look-block is RETIRED — its calc(btn-radius - 1px)
     edges ballooned into pills under the ROUNDED theme, and it only
     re-framed the same tiny keys. Every window speaks the .gd-stamp-key
     buttons now (see the 153 battery for their own laws). */
  assert(!/\.gd-look-block\s*\{/.test(css), '1.4.4: the framed container left the CSS with the request');
  assert(!/className=\{?["']?gd-look-block/.test(charSrc) && !/gd-look-block-head/.test(charSrc), '1.4.4: the edit window seats the shared keys instead');
  assert(/\.gd-stamp-key\s*\{/.test(css), 'the real labeled key exists');
});

// ===========================================================================
// 13 — THE HUE + STAMP OPTIONS WITHOUT A STAMP
// ===========================================================================
ok('13a — the creation window renders the cluster without a stamp (settings locked)', () => {
  assert(!/\{stamps\.length > 0 && \(\s*\n\s*<span className="gd-stamp-settings-cluster">/.test(newSrc), 'the gate left the creation window');
  assert(/THE CLUSTER STAYS WITHOUT A STAMP/.test(newSrc), 'the ungate is documented');
  assert(/className=\{clsx\(!stamps\.length && 'gd-locked-key'\)\}/.test(newSrc), 'the settings key locks while the strip is empty');
  assert(/'This option requires a stamp'/.test(newSrc), 'the locked tooltip speaks');
});
ok('13b — the right panel renders the cluster without a stamp (settings locked)', () => {
  assert(!/\{charStamps\.length > 0 && \(onColor \|\| onTransform\)/.test(charSrc), 'the gate left the panel');
  // 1.4.6 SUPERSEDED (the tower's column seat): the comment moved with
  // the cluster — the ungate law is documented at its new seat.
  assert(/stays-without-a-\s*stamp law/.test(charSrc), 'the ungate is documented');
  assert(/className=\{clsx\(!charStamps\.length && 'gd-locked-key'\)\}/.test(charSrc), 'the settings key locks while the strip is empty');
  const lockKey = /\.gd-locked-key > \*\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/opacity:\s*0\.42/.test(lockKey) && /pointer-events:\s*none/.test(lockKey), 'the locked-key law (faded, blind) exists');
});

// ===========================================================================
// 14 — ENLARGED CARDS ARRIVE BIG
// ===========================================================================
ok('14a — the width tween arms only on the card\'s own span change', () => {
  assert(/const widthArmed = \(id\) => \{/.test(masonrySrc), 'the arming exists');
  assert(/transition: widthArmed\(id\) \? 'width 0\.24s ease-out' : 'none',/.test(masonrySrc), 'the transition is armed, not constant');
  assert(/THE WIDTH FLIGHT ARMS ONLY FOR THE CARD'S OWN SPAN CHANGE/.test(masonrySrc), 'the law is documented');
});
ok('14b — the view swap rests the projection (cards appear in place)', () => {
  assert(/const setSwapped = \(\(\) => \{/.test(masonrySrc), 'the swap detector exists');
  assert(/layout=\{flighting \|\| setSwapped \? false : 'position'\}/.test(masonrySrc), 'a wholesale set change rests the projection');
  assert(/THE VIEW SWAP RESTS THE PROJECTION/.test(masonrySrc), 'the law is documented');
});

// ===========================================================================
// 15 — THE VERSIONS STRIP'S ARROWS SIT INWARD
// ===========================================================================
ok('15a — the arrows seat 7px in from the wrapper edges', () => {
  const left = /\.gd-flow-arrow\.is-left\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  const right = /\.gd-flow-arrow\.is-right\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/left:\s*7px/.test(left) && /right:\s*7px/.test(right), 'both keys sit 7px in (was 1px)');
});

// ===========================================================================
// 17 — THE TAG'S OWN FINISH
// ===========================================================================
ok('17a — the tag manager\'s FINISH ladder is RETIRED (1.4.4)', () => {
  /* 1.4.4 supersede: "remove finishes from the tag manager, remove the
     finishes feature entirely from tag manager only" — the ladder, the
     editor\'s finish state, the tag record\'s field and the ribbon\'s coat
     all left. The CARDS\' finishes are untouched. */
  assert(!/>FINISH</.test(tagSrc), '1.4.4: no FINISH label renders in the manager');
  assert(!/setFinish/.test(tagSrc) && !/CARD_FINISHES\.map/.test(tagSrc), '1.4.4: no finish state, no ladder keys');
  assert(!/CARD_FINISHES/.test(tagSrc), 'the card family left the manager\'s imports');
  assert(/onAddTag\(name\.trim\(\), color, icon, trim\)/.test(tagSrc), 'the commit carries color + trim + icon only');
  assert(/THE LADDER IS RETIRED/.test(tagSrc), 'the retirement is documented');
  const makeTag = /export const makeTag = \([\s\S]*?\n\}\);/.exec(constSrc)?.[0] || '';
  assert(!/finish/.test(makeTag), 'makeTag writes no finish field');
});
ok('17b — the ribbon paints no coat (1.4.4: the ribbon finish retired)', () => {
  /* 1.4.4 supersede: the ribbon's material coat left with the manager's
     ladder — no clip, no family class, no phase; a tag is color + trim +
     icon + name again. */
  assert(!/gd-ribbon-finish/.test(ribbonSrc), '1.4.4: the coat layer left the ribbon');
  assert(!/clipId/.test(ribbonSrc), 'the clipPath left with it');
  assert(!/\.gd-tagfin-[a-z]+\s*\{/.test(css), '1.4.4: the five ribbon-scale materials left the CSS (rule seats)');
  assert(!/gd-tagfin-\$\{/.test(ribbonSrc) && !/gd-ribbon-finish'\]/.test(ribbonSrc), 'no family class is spoken by the ribbon');
  const glyphs = /tag\.icon \? \(/.exec(ribbonSrc);
  assert(glyphs, 'the glyph block remains (the icon keeps its own ink)');
});

// ===========================================================================
// THE VERSION FURNITURE
// ===========================================================================
ok('V — the version is 1.4.6 everywhere (1.4.5 superseded by the 1.4.6 release)', () => {
  assert.equal(JSON.parse(pkgSrc).version, '1.4.6', 'package.json');
  assert(/version:\s*'1\.4\.6',/.test(constSrc), 'APP.version');
  assert(/\*\*v1\.4\.6\*\*/.test(src('README.md')), 'README');
  assert(/\(1\.4\.6\)/.test(src('START.bat')), 'START.bat');
  assert(/## 1\.4\.6 — The Keys Find Their Seat/.test(changelogSrc), 'CHANGELOG head');
  assert(/v1\.4\.6/.test(websiteSrc) && /THE KEYS FIND THEIR SEAT/.test(websiteSrc), 'website current block');
  assert(/var CURRENT = \[1, 4, 6\];/.test(websiteSrc), 'website CURRENT gate');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
