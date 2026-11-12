// 1.4.0 batch — THE SHADER COAT.
// The reported items, each pinned at its root law:
//   1.  the trims' bottoms, whole on every card ("the bottom of the trim is
//       still covered in some of the cards ... only the 4 i mentioned"):
//       TWO causes retired — the 1.3.8 seamless law that hid the LINE
//       family's seam-side rule on extreme plates (exactly those four
//       trims, exactly "in some cards"), and the sleeve's stacking
//       context that let the face coat wash the trims. The card speaks a
//       Z LADDER now: art clip 1 · coat 2 · INK WORK 3 — the trim never
//       wears the coat, with an image or without
//   2.  the shaders ("each of them should be like a shader ... seamless
//       repeat ... ensure its not repeatable between different cards"):
//       four compositing pipelines with fixed-px tiles that translate by
//       exactly one period, full hue turns, per-card --gd-fin-ph phases,
//       and ONE continuous surface (the AFFECTS IMAGE switch lifts a mask
//       — the pattern never re-anchors, never a lazy stretch)
//   3.  foil: multiply metal + fine concentric elliptical rings + a
//       screen-blended vertical white sheen through the card's axis
//   4.  prismatic: pastel rainbow conic + tessellated crystal/starburst
//       lattice + the sprite's heat-map (magenta/cyan/yellow/deep purple)
//   5.  polychrome (chromatic's successor): pearlescent white plate +
//       cyan-head/neon-face/magenta-purple sprite + gradient text and
//       borders; saved chromatic cards migrate at load
//   6.  holographic: reworked chaos — shapes, shards, sparkles on two
//       opposing drifts + a hue cycle ("stretches up goofily" is gone)
//   7.  the versions strip's arrows ride the content's own midline
//       ("lifted up slightly so they are centered, currently they are too
//       low"): the platform scrollbar's height is measured live and half
//       of it lifts the keys
//   8.  the versioned card's name keeps its full width at rest ("you
//       reversed the state of the card ... the container extend downwards,
//       ending up with version counter on the right stranded"): the
//       phantom badge row + the phantom badge lane are dead — the resting
//       badge places no grid, the seated one claims its cell exactly on
//       hover
//   9.  the card pulses on press ("both when opening or closing ... ensure
//       it doesnt effect its size or reorder cards"): a pure-transform
//       squash-and-settle on a wrapper that owns no context at rest
//  10.  the edit card window is two columns and carries the stamp color +
//       settings ("dont include tags and stamps though")
//  11.  the panel's ±1px dance while the rows expand at scroll-bottom is
//       dead: the height flight writes WHOLE pixels on rAF (the same
//       320ms curve) and every panel scroller's scroll anchor stands down
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
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const sideSrc = src('src/components/SideFlow.jsx');

// ===========================================================================
// 1 — THE Z LADDER (the trim never wears the coat)
// ===========================================================================
ok('1a — the sleeve\'s context is retired; the ladder speaks per child', () => {
  // the old law (z 1 on .gd-sleeve/.gd-panzoom) is GONE
  const oldLadder = /\.gd-sleeve,\n\.gd-panzoom\s*\{\s*\n?\s*z-index:\s*1;\s*\n?\s*\}/.exec(css);
  assert.equal(oldLadder, null, 'the sleeve no longer owns z 1 (no context)');
  // the new rungs: clip 1, deco 3
  const clipRule = /\.gd-sleeve-clip,\n\.gd-panzoom > \.gd-sleeve-clip\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*1/.test(clipRule), 'the art\'s clip rides z 1 (above the foot\'s rise)');
  const decoRule = /\.gd-sleeve-deco,\n\.gd-panzoom > \.gd-sleeve-deco\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*3/.test(decoRule), 'the ink work (trims/band/washes) rides z 3');
  // the coat: z 2 at the card root — between them
  const coatRule = /\.gd-card-face-finish\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*2/.test(coatRule), 'the coat rides z 2');
  // the ladder is documented
  assert(/THE CARD\'S OWN Z LADDER/.test(css), 'the ladder law is documented');
});

ok('1b — the plate coat is retired; ONE coat at the root on every surface', () => {
  assert(!/\.gd-card-plate-finish\s*\{/.test(css), 'the plate-coat seat left the sheet');
  for (const [name, text] of [['GridView', gridSrc], ['CardLookEditor', lookSrc], ['TagRibbon', ribbonSrc]]) {
    assert(!/gd-card-plate-finish/.test(text), `${name} never speaks the retired seat`);
  }
  // every surface seats CardFinishLayer exactly once, at the card root
  assert((gridSrc.match(/<CardFinishLayer/g) || []).length === 1, 'the grid card renders one coat');
  assert((lookSrc.match(/<CardFinishLayer/g) || []).length === 1, 'the panzoom renders one coat');
  assert((ribbonSrc.match(/<CardFinishLayer/g) || []).length === 1, 'the compact preview renders one coat');
});

ok('1c — the seam strip the coat\'s mask cuts (the math mirror)', () => {
  // the cut = artH - (max(radius-2,0)+1) — exactly the old plate coat top
  const radius = 16;
  const notch = Math.max(radius - 2, 0) + 1;
  const artH = 207; // a 155px card at 3:4
  const cut = artH - notch;
  assert.equal(cut, 192, 'the veil cut lands at the old plate coat top edge');
  // the mask rule reads the same law
  const maskRule = /\.gd-card-face-finish\.is-plate-only\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/--gd-fin-cut/.test(maskRule), 'the mask speaks the cut var');
  const varRule = /--gd-fin-cut:\s*calc\(([^;]+)\);/.exec(css)?.[1] || '';
  assert(/var\(--gd-art-h\)/.test(varRule) && /--gd-shape-radius/.test(varRule) && /- 2px, 0px\)\s*\+\s*1px/.test(varRule), 'the cut = artH - (max(radius-2,0)+1)');
});

ok('1d — the seamless bottom-rule hiding is retired', () => {
  // the 1.3.8 law (border-bottom-color: transparent on dash/double/bold)
  // painted exactly the reported bug: those four trims, extreme plates
  assert(!/border-bottom-color:\s*transparent/.test(css), 'the line family never hides its seam side anymore');
  assert(/THE SEAMLESS BOTTOM-RULE HIDING IS RETIRED/.test(css), 'the retirement is documented at the seat');
  assert(!/linear-gradient\(var\(--trim-c-strong\) 0 0\) 0 6px \/ 100% 1\.5px no-repeat;?\s*\n\}/.test(/\.gd-trim-ledger\.is-seamless::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the ledger\'s seamless override is gone too');
});

// ===========================================================================
// 2 — THE SHADER MODEL (phase, seamless loops, one surface)
// ===========================================================================
ok('2a — the per-card phase: every clock reads --gd-fin-ph', () => {
  assert(/export function finishPhase\(id\)/.test(ribbonSrc), 'finishPhase exists (the id hash)');
  assert(/--gd-fin-ph/.test(ribbonSrc), 'the layer writes the phase var');
  assert(/finishPhase\(character\.id\)/.test(gridSrc), 'the grid card phases by its own id');
  // the clocks bake the phase into their delays
  const delays = css.match(/animation-delay:\s*calc\(var\(--gd-fin-ph, 0\) \* -[^)]+\)/g) || [];
  assert(delays.length >= 8, `the clocks read the phase (${delays.length} delay seats)`);
  // the drifting tiles bake it into their positions
  /* 1.4.4 supersede: the crystal tile no longer drifts (static, phase-baked
     position); the WOVEN WAVES tile carries the phase into its delay seat
     instead, and the tide drifts its own period. */
  assert(/calc\(var\(--gd-fin-ph, 0\) \* 96px\)/.test(/\.gd-finish-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the crystal tile bakes its phase seat (static, 1.4.4)');
  assert(/gd-prism-drift-ne 16s linear infinite/.test(css) && /gd-opal-tide 19s linear infinite/.test(css), 'the waves + tide drift their own periods (1.4.4)');
  assert(/calc\(var\(--gd-fin-ph, 0\) \* 128px \+ 128px\)/.test(css), 'the holo shapes drift a full period from their phase seat');
});

ok('2b — the loops are seam-safe + reduced motion stills every coat', () => {
  // the turn + hue cycles are full revolutions
  /* 1.4.4 supersede: the registered-angle turn + its @property are RETIRED
     (the perf law's root — a custom-property animation re-rastered every
     coat per frame); the conics bake their angles statically per phase. */
  assert(!/@keyframes gd-finish-turn\s*\{/.test(css), '1.4.4: the conic turn keyframes are gone');
  assert(!/@property --gd-prism-a\s*\{/.test(css), '1.4.4: the angle registration is gone');
  const heat = /@keyframes gd-prism-heat-hue\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/hue-rotate\(360deg\)/.test(heat), 'the heat-map cycles a full turn');
  // the breaths are there-and-back (0/100% share a frame)
  // 1.4.3 supersede: the pearl's sheen breath replaced the pour's hue
  // breath — same there-and-back law, new name.
  const breathe = /@keyframes gd-opal-sheen\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/0%,\s*\n?\s*100%/.test(breathe), 'the opalescent sheen breath returns to origin');
  const still = /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/animation:\s*none/.test(still), 'reduced motion stills the coats');
  /* 1.4.4 supersede: the ribbon's own finish retired with the tag
     manager's ladder; the rebuilt coats' ELEMENT seats join the still. */
  for (const f of ['gd-finish-opalescent', 'gd-finish-foil', 'gd-finish-holographic', 'gd-finish-prismatic', 'gd-artfin-opalescent', 'gd-artfin-prismatic', 'gd-opal-tide', 'gd-opal-glint', 'gd-prism-waves', 'gd-prism-sweep', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare']) {
    assert(still.includes(f), `${f} is stilled`);
  }
  // nothing loops fast — the FINISH FAMILY's own clocks only (the UI's
  // micro-pops (gd-rt-pop and friends) are legitimately instant; the
  // greedy sheet-wide sweep used to catch them)
  // 1.4.3 supersede: the pearl takes the pour's seats; the poly ring left
  // with the coat; the ribbon's own finishes join the family.
  const family = [
    '.gd-finish-opalescent', '.gd-finish-foil',
    '.gd-finish-holographic', '.gd-finish-holographic::after',
    '.gd-finish-prismatic', '.gd-artfin-opalescent',
    '.gd-artfin-prismatic', '.gd-opal-tide::before',
    '.gd-prism-waves::before', '.gd-nuri-licks::before',
  ];
  for (const seat of family) {
    const rule = new RegExp(seat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      String.raw`\s*\{(?![^{}]*animation:\s*none)[\s\S]*?\n\}`).exec(css)?.[0] || '';
    if (!rule) continue; // a seat that never animates on this sheet
    for (const m of rule.matchAll(/gd-[a-z-]+\s+(\d+(?:\.\d+)?)s/g)) {
      assert(+m[1] >= 6, `the ${seat} ${m[0]} clock is gentle`);
    }
  }
});

ok('2c — the AFFECTS IMAGE switch lifts a mask (never a re-anchor)', () => {
  const layerBlock = /export function CardFinishLayer\(\{ finish, onImage = false[\s\S]*?\n\}/.exec(ribbonSrc)?.[0] || '';
  assert(/is-plate-only/.test(layerBlock), 'the switch speaks the plate-only veil');
  // 1.4.0: polychrome keeps the plate mask even with the switch on (its
  // pearlescent material is OPAQUE — flooding the art zone would bury the
  // sprite; the artfin layer speaks the art). A no-image card is all plate.
  // 1.4.3 supersede: polychrome seats like every coat — one law.
  assert(/const plateOnly = !onImage && hasImage;/.test(layerBlock), 'the plate veil is the one law for every coat (1.4.3)');
  assert(/--gd-art-h/.test(layerBlock), 'the mask cut rides the art-height var');
  assert(/hasImage=\{!!coverUrl\}/.test(gridSrc), 'the grid card passes its own image truth');
  // the artfin layers (the sprite's own treatment) mount only while ON
  // 1.4.3 supersede: opalescent takes polychrome's seat in the artfin list.
  assert(/finish === 'prismatic' \|\| finish === 'opalescent'/.test(layerBlock), 'the sprite layers know their finishes');
  // no surface swaps the coat between seats anymore
  assert(!/\!cardFinishOnImage && <CardFinishLayer/.test(gridSrc), 'the old two-seat swap is gone (grid)');
  assert(!/\!finishOnImage && <CardFinishLayer/.test(lookSrc), 'the old two-seat swap is gone (panzoom)');
});

// ===========================================================================
// 3 — FOIL (multiply metal + rings + the sheen sibling)
// ===========================================================================
ok('3 — foil: the multiply body, the elliptical rings, the vertical sheen', () => {
  const foil = /\.gd-finish-foil\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*multiply/.test(foil), 'the body multiplies the metal into the card');
  assert(/repeating-radial-gradient\(\s*\n?\s*ellipse 150% 110% at 50% 46%/.test(foil), 'FINE CONCENTRIC ELLIPTICAL RINGS radiate from the center');
  assert(/163deg/.test(foil), 'the violet/blue -> magenta/pink body gradient');
  const hue = /@keyframes gd-foil-hue\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/hue-rotate\(-24deg\)/.test(hue) && /hue-rotate\(38deg\)/.test(hue), 'the tint shifts cool violet toward reds/oranges/magenta/pink');
  // the sheen is a SIBLING (screen) — never trapped in the body's blend group
  // 1.4.3 supersede: the sheen is RETIRED outright — three staggered
  // water-ripples + a sparkle lattice ride its seat (the 151 law).
  assert(!/\.gd-finish-foil-sheen/.test(css), 'the sheen (middle white line + travelling streak) is gone');
  assert(/\.gd-finish-foil-ripples/.test(css) && /gd-foil-sparkle 8s linear infinite/.test(css), 'the ripples + sparkle lattice ride the seat');
  assert(/gd-finish-foil-ripples/.test(ribbonSrc), 'the layer renders the ripple sibling (1.4.3)');
  // the rings breathe (per-layer background-size)
  const gleam = /@keyframes gd-foil-gleam\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/92% 84%, 100% 100%/.test(gleam) && /118% 106%, 100% 100%/.test(gleam), 'the ring field breathes; the body holds still');
});

// ===========================================================================
// 4 — PRISMATIC (pastel rainbow + crystal lattice + the heat-map sprite)
// ===========================================================================
ok('4 — prismatic: the crystal lattice, the turning rainbow, the heat-map', () => {
  const prism = /\.gd-finish-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: the spark lattice moved to the waves' own drifting
     seat; the crystal tile stays static in the body. */
  assert(/96px 96px/.test(prism), 'the crystal lattice rides its tile (static, 1.4.4)');
  assert(/48px 48px/.test(/\.gd-prism-waves::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the spark lattice rides the waves\' seat (drifting SW)');
  assert(/data:image\/svg\+xml/.test(prism), 'the lattice is a tessellated SVG tile');
  assert(/conic-gradient\(/.test(prism), 'the pastel rainbow is a turning conic');
  /* 1.4.4 supersede: the rainbow's turn retired with the custom-property
     animation; the angle bakes statically and the WAVES carry the motion. */
  assert(!/animation:/.test(prism), 'the body is static (1.4.4)');
  assert(/gd-prism-drift-ne 16s linear infinite/.test(/\.gd-prism-waves::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the waves drift on their own clock (1.4.4)');
  assert(/mix-blend-mode:\s*overlay/.test(prism), 'the lattice overlays the card');
  // the drifts travel exactly one period, both lattices, opposite signs
  /* 1.4.4 supersede: the chaos keyframes retired (background-position);
     the opposing vectors speak through the NE + SW compositor drifts. */
  const ne = /@keyframes gd-prism-drift-ne\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  const sw = /@keyframes gd-prism-drift-sw\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(96px, -96px\)/.test(ne) && /translate\(-48px, 48px\)/.test(sw), 'the lattices drift on opposing vectors (1.4.4)');
  // the sprite's heat-map
  const heat = /\.gd-artfin-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*color/.test(heat), 'the heat-map replaces the sprite\'s colors');
  assert(/#ff00ff/.test(heat) && /#00e5ff/.test(heat) && /#ffe600/.test(heat) && /#5b00a8/.test(heat), 'magenta, cyan, yellow, deep purple');
  assert(/repeating-linear-gradient\(\s*\n?\s*155deg/.test(heat), 'the heat-map flows diagonally');
  assert(/gd-prism-heat-hue 22s linear infinite/.test(heat), 'the heat cycles slowly');
});

// ===========================================================================
// 5 — POLYCHROME'S SEAT (1.4.3 supersede: OPALESCENT, the pearl)
// ===========================================================================
ok('5a — polychrome replaces chromatic everywhere (the migration)', () => {
  /* 1.4.3 supersede: OPALESCENT replaces polychrome ("remove polychrome,
     replace it with Opalescent") — the pearl takes the pour's seat, and
     BOTH legacy ids (chromatic + polychrome) migrate onto it at load. */
  assert(!/id: 'chromatic'/.test(constSrc), 'the constants carry no chromatic');
  assert(!/id: 'polychrome'/.test(constSrc), '1.4.3: the constants carry no polychrome');
  assert(/id: 'opalescent'/.test(constSrc), '1.4.3: opalescent takes the seat');
  assert(/export const migrateCardFinish = \(v\) => \(v === 'chromatic' \|\| v === 'polychrome' \? 'opalescent' : v\);/.test(constSrc), '1.4.3: both legacy ids migrate onto the pearl');
  assert(/migrateCardFinish\(character\.cardFinish\)/.test(helpersSrc), 'sanitizeCharacter migrates at load');
  assert(/migrateCardFinish\(character\.cardFinish\)/.test(gridSrc), 'the grid card migrates (even before a save)');
  assert(/migrateCardFinish\(character\.cardFinish\)/.test(charSrc), 'the edit window\'s draft migrates');
  assert(!/chromatic/.test(styleSrc), 'the picker never speaks the retired name');
  // the 1.3.9 chromatic material left the sheet
  assert(!/\.gd-finish-chromatic\s*\{/.test(css), 'the satin sweep left with the name');
  assert(!/\.gd-finish-polychrome\s*\{/.test(css), '1.4.3: the liquid spectrum left with its name');
});

ok('5b — polychrome: the pearlescent plate, the head-to-body sprite, gradient text + borders', () => {
  /* 1.4.3 supersede: the pearl speaks the pour's seat — a milky pastel
     wash (soft-light — the plate's printing reads through), the pastel
     conic still turns, and the TEXT + BORDER laws retired with the pour
     (the pearl is a translucent veil, never a plate that buries the name).
     The 152 suite holds the pearl's whole law. */
  const poly = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/conic-gradient\(/.test(poly), 'the pearlescent shimmer is a pale turning conic');
  assert(!/#fbfafd|#f2f0f7|#fcfbfd/.test(poly), 'no near-white opaque plate (1.4.3 — the translucent law)');
  assert(/mix-blend-mode:\s*soft-light/.test(poly), '1.4.3: the pearl blends milky + translucent');
  const art = /\.gd-artfin-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*soft-light/.test(art), '1.4.3: the sprite keeps its own shading under the pearl\u2019s light');
  assert(/rgba\(255, 226, 238, 0\.5\)/.test(art), '1.4.3: the sprite wears the pearl\u2019s pastel wash');
  // 1.4.3: the text gradient + the gradient ring retired with the pour —
  // the scope class + the ring never seat on any surface again.
  assert(!/\.is-fin-poly \.gd-card-title/.test(css), '1.4.3: the gradient text clip left with the pour');
  assert(!/is-fin-poly/.test(gridSrc) && !/is-fin-poly/.test(lookSrc) && !/is-fin-poly/.test(ribbonSrc), '1.4.3: no surface seats the retired scope');
  assert(!/\.gd-trim-poly-ring\s*\{/.test(css), '1.4.3: the gradient ring left with the pour');
  assert(!/gd-trim-poly-ring/.test(gridSrc) && !/gd-trim-poly-ring/.test(lookSrc), '1.4.3: no surface renders the retired ring');
});

// ===========================================================================
// 6 — HOLOGRAPHIC (the reworked chaos)
// ===========================================================================
ok('6 — holographic: shapes on opposing drifts + the hue cycle', () => {
  const holo = /\.gd-finish-holographic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/128px 128px/.test(holo) && /64px 64px/.test(holo), 'two shape lattices (128 + 64)');
  assert(/data:image\/svg\+xml/.test(holo), 'the shapes are an SVG lattice');
  assert(/gd-holo-chaos 15s linear infinite/.test(holo) && /gd-finish-hue 12s linear infinite/.test(holo), 'the drift + the hue cycle');
  const chaos = /@keyframes gd-holo-chaos\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/\+ 128px\)/.test(chaos) && (/- 64px\)/.test(chaos)), 'the shapes drift on opposing vectors');
  assert(!/translateY|scale\(/.test(chaos), 'nothing stretches ("stretches up goofily" is dead) — the tiles translate');
  const gloss = /\.gd-finish-holographic::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*screen/.test(gloss) && /72px 72px/.test(gloss), 'the sparkle lattice + gloss ride ::after');
});

// ===========================================================================
// 7 — THE VERSIONS STRIP'S ARROWS RIDE THE CONTENT'S MIDLINE
// ===========================================================================
ok('7 — the scrollbar is measured; the keys lift by half of it', () => {
  assert(/arrowLift/.test(sideSrc), 'useFlowEdges measures the lift');
  const liftRead = /const sb = Math\.max\(0, \(el\.offsetHeight \|\| 0\) - \(el\.clientHeight \|\| 0\)\);/.exec(sideSrc)?.[0] || '';
  assert(liftRead.length > 0, 'the lift reads the strip\'s real scrollbar height');
  assert(/--gd-flow-arrow-lift/.test(sideSrc), 'FlowEdges writes the var');
  const arrow = /\.gd-flow-arrow\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translateY\(calc\(-50% - var\(--gd-flow-arrow-lift, 0px\)\)\)/.test(arrow), 'the centering transform subtracts the lift');
});

// ===========================================================================
// 8 — THE PHANTOM BADGE ROW IS DEAD (the foot's resting state)
// ===========================================================================
ok('8 — the resting badge places no grid; the seated one claims its cell', () => {
  // the 1.3.8 text-cell lift no longer includes the badge (specificity!)
  const liftRule = /\.gd-card-foot-vers > \.gd-card-foot-name,[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/gd-card-vers/.test(liftRule), 'the badge left the two-class lift list');
  assert(/THE BADGE LEFT THIS LIST/.test(css), 'the retirement is documented');
  const badge = /\.gd-card-vers\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/position:\s*absolute/.test(badge), 'the resting badge is absolute (out of flow)');
  assert(/grid-column:\s*auto/.test(badge) && /grid-row:\s*auto/.test(badge), 'the resting badge places no grid (no phantom lane)');
  const seated = /\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers,[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/position:\s*static/.test(seated) && /grid-column:\s*2/.test(seated), 'the seated badge claims its cell');
  assert(/height:\s*calc\(18\.75px \* var\(--card-scale, 1\)\)/.test(seated), 'the seat stays height-neutral');
});

// ===========================================================================
// 9 — THE PRESS PULSE (visual only)
// ===========================================================================
ok('9 — the pulse: one wrapper, one keyframe flight, no layout', () => {
  assert(/gd-card-pulse/.test(gridSrc), 'the wrapper exists');
  assert(/const firePulse = \(\) => \{[\s\S]*?el\.classList\.add\('is-pressed'\);/.test(gridSrc), 'the flight arms by class flip');
  assert(/onPointerDown=\{firePulse\}/.test(gridSrc), 'every press fires it (open AND close — the toggle)');
  assert(/e\.animationName === 'gd-press-pulse'/.test(gridSrc), 'the flight retires on its own animationend');
  const pulse = /\.gd-card-pulse\.is-pressed\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.3 supersede: the flight is a REAL squish now — 380ms, animating
     the independent `scale` PROPERTY (composes with the hover transform,
     so the lift holds through the flight — "the squish/stretch animation
     from click is missing, right now it just repeats the hover
     animation" is dead). The 152 suite holds the whole law. */
  /* 1.4.4 supersede: the jelly learned its beats — five beats, 620ms
     (squish wide+short, stretch narrow+tall, counter, overshoot, home). */
  assert(/gd-press-pulse 620ms/.test(pulse), 'the 620ms five-beat flight (1.4.4)');
  const kf = /@keyframes gd-press-pulse\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/scale: 1\.06 0\.9/.test(kf) && /scale: 0\.955 1\.075/.test(kf), '1.4.4: the squish + stretch speak the proper axes');
  assert(!/transform: scale\(/.test(kf), '1.4.3: the keyframes never touch transform (the hover lift composes)');
  const base = /\.gd-card-pulse\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/will-change/.test(base) && !/position/.test(base), 'the wrapper owns no context at rest (the z-ladder survives it)');
});

// ===========================================================================
// 10 — THE EDIT CARD WINDOW (two columns + the stamp settings)
// ===========================================================================
ok('10 — two columns, the stamp color + settings drafted with the look', () => {
  // 1.4.3 supersede: three columns — the trims own a fixed left rail.
  assert(/w-\[860px\]/.test(charSrc), 'the window grew wide for the rail (1.4.3: 860px)');
  assert(/flex gap-x-5 items-start/.test(charSrc), 'the body seats its columns');
  // the right column carries the stamp sections
  const stampBlock = /STAMP SETTINGS[\s\S]*?StampPosControls[\s\S]*?onPatch=\{\(patch\) => touchStamp\(\(s\) => \(\{ \.\.\.s, \.\.\.patch \}\)\)\}/.exec(charSrc)?.[0] || '';
  assert(stampBlock.length > 0, 'the stamp settings ride the draft');
  assert(/<StampColorControls[\s\S]*?hueOverTrim=\{stampSet\.hueOverTrim === true\}/.test(charSrc), 'the stamp color + the over-trim switch ride it too');
  assert(/const \[stampSet, setStampSet\] = useState\(\(\) => sanitizeStampSettings\(character\.stampSettings\)\);/.test(charSrc), 'the draft starts sanitized');
  assert(/stampSettings: stampSet,/.test(charSrc), 'DONE carries the draft');
  // the App lane: one mutate, merged onto the card's own settings
  const lane = /next\.stampSettings = \{\s*\.\.\.sanitizeStampSettings\(c\.stampSettings\),\s*\.\.\.sanitizeStampSettings\(card\.stampSettings\),\s*\};/.exec(appSrc)?.[0] || '';
  assert(lane.length > 0, 'the commit merges in the same mutate');
  assert(/'look:' \+ lookCharacter\.id/.test(appSrc), 'one undo step for the whole window');
  // the stamps list itself stays in the panel
  assert(!/StampSlots/.test(/export function CardLookModal[\s\S]*?\n\}\n/.exec(charSrc)?.[0] || ''), 'no stamp list inside the window');
});

// ===========================================================================
// 11 — THE INTEGER FLIGHT + THE QUIET ANCHOR
// ===========================================================================
ok('11a — the height flight writes whole pixels on rAF', () => {
  assert(/flightRafRef/.test(sideSrc), 'the driver exists');
  assert(/const v = Math\.round\(from \+ \(to - from\) \* bezY\(t\)\);/.test(sideSrc), 'every frame is an integer');
  assert(/zone\.style\.transition = 'none';/.test(sideSrc), 'the CSS curve stands down while the driver runs');
  assert(/const DUR = 320;/.test(sideSrc), 'the same 320ms beat');
  assert(/0\.22, 0\.61, 0\.36, 1/.test(sideSrc), 'the sheet\'s own curve, solved for y');
  assert(/flightFromRef\.current = Math\.round\(Math\.max\(1, prime\)\);/.test(sideSrc), 'the retract\'s from-seat is captured at the prime');
  assert(/flightFromRef\.current = Math\.round\(zone\.offsetHeight \|\| retractH \|\| 0\);/.test(sideSrc), 'the expand\'s from-seat is captured at the fold');
  assert(/if \(zone && flightRafRef\.current && flightPosRef\.current != null\)/.test(sideSrc), 'React\'s own inline write never wins a frame against the tween');
  assert(/if \(flightRafRef\.current\) cancelAnimationFrame\(flightRafRef\.current\);/.test(sideSrc), 'the flight dies with the zone');
});

ok('11b — every panel scroller\'s anchor stands down', () => {
  const anchor = /\.gd-tex-scroll,\n\.gd-tex-viewer,\n\.gd-tex-panel\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/overflow-anchor:\s*none/.test(anchor), 'the three surfaces speak it');
  assert(/gd-tex-scroll/.test(charSrc), 'the compact view\'s own scroller carries the class');
});

// ===========================================================================
// 12 — THE VERSION FURNITURE
// ===========================================================================
ok('12 — the version is 1.4.6 everywhere (1.4.5 superseded by the 1.4.6 release)', () => {
  assert(/version: '1\.4\.6'/.test(constSrc), 'APP.version');
  assert(/"version": "1\.4\.6"/.test(src('package.json')), 'package.json');
  assert(/## 1\.4\.6 — The Keys Find Their Seat/.test(src('CHANGELOG.md')), 'the changelog leads with 1.4.5');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(/THE KEYS FIND THEIR SEAT/.test(src('website/index.html')), 'the website tagline');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(/v1\.4\.6/.test(src('website/index.html')), 'the website ver chip');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
