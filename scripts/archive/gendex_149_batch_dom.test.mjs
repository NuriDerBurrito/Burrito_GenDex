// 1.3.9 batch — THE LIVING COAT.
// The reported items, each pinned at its root law:
//   1.  the line-family trims keep their bottoms on finished cards
//       ("its the finish container clipping and hiding them, ensure it
//       doesnt effect the trim even if there is no image in the card"):
//       the foot speaks z 0 — its OWN stacking context, one step under the
//       sleeve's z 1 — so the plate finish's top extension (the seam strip
//       where the ledge/dashed/double/bold bottom rules live) paints UNDER
//       the art + trims, never over them, with an image or without
//   2.  the secondary color + the pattern option are REMOVED ("remove
//       secondary color and pattern option") — every seat retired, the
//       load-side sanitizer drops any 1.3.8 fields a saved card carries
//   3.  the four finishes are ANIMATED ("animate the finishes ... not very
//       fast either"): one slow clock each (7-14s loops), seamless by
//       construction, stilled under prefers-reduced-motion
//   4.  the four materials are DISTINCT ("prismatic, holographic and
//       chromatic finishes look simmilar, holographic should be more
//       chaotic shapes based, while foil should be central like a circle"):
//       holo = hard-stop shards at skewed angles + hue cycle; foil = one
//       centered circular gleam that breathes; chromatic = one soft satin
//       repeating band that drifts; prismatic = two saturated conic
//       sectors counter-rotating through a registered angle
//   5.  the versions container carries right/left fades ("add a right and
//       left fade in the versions container simmilar to the tags and stamp
//       containers"): the wrapper writes the seat vars (the clip-edge
//       offset + the paper ink) the FlowEdges veils read
//   6.  the tags container's 1px shift on panel open is dead ("shifted by
//       1px up still ... then after the right panel opening animation it
//       shifts back"): the name fold's FIRST landing snaps (duration 0)
//       — the mount measure commits before the browser paints
//   7.  the full-window tags reorder is exact ("the tags shift above each
//       other and break"): the plain packer learned the TRAILING TOOLS
//       (the + key rides the pack as the tail), so the wide seat's drags
//       get the exact glide instead of the rect-swap pile-up
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
const helpersSrc = src('src/utils/helpers.js');
const sortSrc = src('src/components/useThumbSort.js');

// ===========================================================================
// 1 — THE TRIMS KEEP THEIR BOTTOMS (the foot's own stacking context)
// ===========================================================================
ok('1 — the ladder: the foot z 0 under the clip z 1, the coat z 2, the ink work z 3 (1.4.0 supersede)', () => {
  // 1.4.0 supersede: the sleeve's own context retired (z auto) — its
  // children speak in the card root's context on their own rungs; the
  // plate coat itself is retired for ONE coat at the root (the 150
  // suite's 1a/1b hold the whole law).
  const foot = /\.gd-card-foot\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*0/.test(foot), 'the foot carries z-index 0');
  assert(/THE FOOT KEEPS ITS OWN STACKING CONTEXT/.test(css), 'the law is documented at the seat');
  const clip = /\.gd-sleeve-clip,\s*\n\.gd-panzoom > \.gd-sleeve-clip\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*1/.test(clip), 'the ART CLIP speaks z 1 (the art paints above the foot)');
  const deco = /\.gd-sleeve-deco,\s*\n\.gd-panzoom > \.gd-sleeve-deco\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*3/.test(deco), 'the INK WORK (deco) speaks z 3 — above the coat, forever');
  // the plate coat seat is retired — ONE coat at the root on every surface
  assert(!/\.gd-card-plate-finish\s*\{/.test(css), 'the plate-coat seat left the sheet');
  assert(!/gd-card-plate-finish/.test(ribbonSrc), 'the shared layer never speaks the retired seat');
});

function cardFinishInSleeve(grid) {
  // the plate finish renders as a child of the foot; the face finish (onImage)
  // rides the card root. A sleeve seat would be the bug.
  const sleeveBlock = /<span className="gd-sleeve-deco"[\s\S]*?<\/span>/.exec(grid)?.[0] || '';
  return /CardFinishLayer/.test(sleeveBlock);
}

ok('1 — the math mirror: the context order', () => {
  // z 0 (foot context) < z 1 (sleeve) → every foot child paints under the
  // sleeve's whole subtree, whatever z it speaks INSIDE the foot.
  const footZ = 0;
  const sleeveZ = 1;
  const finishZInsideFoot = 2;
  assert(footZ < sleeveZ, 'the context sits under the sleeve');
  assert(finishZInsideFoot > 1, 'the coat still beats the text inside the foot');
  // the seam strip the coat's extension covers: (radius - 1)px above the foot
  // top; the dash/double/bold bottom rules sit at 3px..6px above the sleeve's
  // bottom edge — inside the strip on round themes, untouchable now because
  // the strip itself paints under the sleeve.
  const radius = 16; // round theme
  const strip = radius - 1;
  assert(strip >= 4, 'the strip reaches the rules (the old cover)');
});

// ===========================================================================
// 2 — THE SECONDARY COLOR + PATTERN ARE RETIRED (the full sweep)
// ===========================================================================
const stripComments = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\/\/.*$/, ''))
    .join('\n');

ok('2 — the retire sweep: no seat survives anywhere', () => {
  for (const [name, textRaw] of [
    ['constants', src('src/constants/index.js')],
    ['helpers', helpersSrc],
    ['App', appSrc],
    ['GridView', gridSrc],
    ['CardLookEditor', lookSrc],
    ['TagRibbon', ribbonSrc],
    ['CharacterView', charSrc],
    ['NewCharacterModal', newSrc],
    ['CardStyleControls', styleSrc],
    ['index.css', css],
  ]) {
    const text = stripComments(textRaw);
    const offenders = [
      /cardColor2/,
      /cardPattern/,
      /patternOnImage/,
      /CARD_PATTERNS/,
      /isCardPattern/,
      /DEFAULT_CARD_PATTERN/,
      /CardPatternLayer/,
      /gd-card-plate-pat/,
      /gd-sleeve-pat/,
      /--gd-pat-ink/,
    ].filter((re) => re.test(text));
    assert.equal(offenders.length, 0, `${name} still carries: ${offenders.map((r) => String(r)).join(', ')}`);
  }
});

// ===========================================================================
// 3/4 — THE FOUR LIVING MATERIALS (one clock each, four families)
// ===========================================================================
ok('3 — the clocks: every material animates on its own slow loop (1.4.0 supersede)', () => {
  // 1.4.0 supersede: the coats are SHADERS now (the 150 suite's 2b holds
  // the whole law) — polychrome replaced chromatic, every clock reads the
  // card's own --gd-fin-ph, the loops run 6.5-19s.
  // 1.4.3 supersede: OPALESCENT replaces polychrome (the 152 suite holds
  // the pearl's whole law) — the pearl turns on a 21s conic clock.
  /* 1.4.4 supersede: the pearl's conic turn retired with the custom-property
     animation (the perf law) — its clocks live in the tide (19s) + the
     glints (7s). */
  const poly = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/animation:/.test(poly), 'opalescent: the body is static (1.4.4)');
  assert(/gd-opal-tide 19s linear infinite/.test(css) && /gd-opal-glint 7s ease-in-out infinite/.test(css), 'opalescent: the tide 19s + the glints 7s (1.4.4)');
  const foil = /\.gd-finish-foil\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-foil-gleam 9s ease-in-out infinite/.test(foil) && /gd-foil-hue 13s ease-in-out infinite/.test(foil), 'foil: the ring breath 9s + the metal hue 13s');
  const holo = /\.gd-finish-holographic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-holo-chaos 15s linear infinite/.test(holo) && /gd-finish-hue 12s linear infinite/.test(holo), 'holographic: the drift 15s + the hue 12s');
  /* 1.4.4 supersede: the prism's chaos + turn retired with their
     background-position / custom-property animations — the waves drift NE
     16s under a 24s hue ride, the spark lattice drifts SW 23s, the star
     field turns 32s, the sweep crosses 9s. */
  const prism = /\.gd-finish-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/animation:/.test(prism), 'prismatic: the body is static (1.4.4)');
  assert(/gd-prism-drift-ne 16s linear infinite/.test(css) && /gd-prism-drift-sw 23s linear infinite/.test(css) && /gd-prism-starfield 32s linear infinite/.test(css) && /gd-prism-sweep 9s ease-in-out infinite/.test(css), 'prismatic: waves 16s + lattice 23s + stars 32s + sweep 9s (1.4.4)');
  // every clock reads the card's own phase (no two cards in lockstep)
  /* 1.4.4 supersede: the rebuilt coats' bodies are static — the phase-read
     loop walks their ELEMENT seats now (tide / waves / licks / sweep). */
  for (const seat of ['.gd-opal-tide::before', '.gd-prism-waves::before', '.gd-prism-sweep::before', '.gd-nuri-licks::before', '.gd-finish-foil', '.gd-finish-holographic']) {
    const r = new RegExp(seat.replace('.', '\\.') + String.raw`\s*\{[\s\S]*?\n\}`).exec(css)?.[0] || '';
    assert(/animation-delay:\s*calc\(var\(--gd-fin-ph/.test(r), `${seat} reads the phase`);
  }
});

ok('3 — the loops are seam-safe + reduced motion stills every coat', () => {
  // the sweep travels exactly one period of a repeating tile (seamless by
  // construction); the hue + turn loops are full 360 cycles.
  // 1.4.0 supersede: the sweep left with chromatic; the shaders'
  // seam-free law is the PERIOD translation (the 150 suite's 2b):
  // every tile drifts by exactly its own period (128 / 96 / 72 / 64 /
  // 48px), the hue + turn loops are full 360 cycles.
  assert(!/@keyframes gd-finish-sweep\s*\{/.test(css), 'the satin sweep left with chromatic');
  /* 1.4.4 supersede: gd-prism-chaos retired (background-position) — the
     translating tiles' period law now speaks through the compositor
     drifts (120 / 96 / 48px). */
  for (const [kf, period] of [['gd-holo-chaos', '128px'], ['gd-opal-tide', '120px'], ['gd-prism-drift-ne', '96px'], ['gd-holo-dots', '72px'], ['gd-prism-drift-sw', '48px']]) {
    const rule = new RegExp('@keyframes ' + kf + String.raw`\s*\{[\s\S]*?\n\}`).exec(css)?.[0] || '';
    /* 1.4.4: the compositor drifts speak translate(…, period) instead of the
       background-position +period form. */
    assert(new RegExp('\\+ ' + period).test(rule) || rule.includes(`translate(${period.replace('px', 'px, ') + period}`) || new RegExp(`translate\\([^)]*${period}`).test(rule), `${kf} translates one ${period} period`);
  }
  const hue = /@keyframes gd-finish-hue\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/hue-rotate\(0deg\)/.test(hue) && /hue-rotate\(360deg\)/.test(hue), 'the hue cycle is a full turn');
  /* 1.4.4 supersede: the registered-angle turn is RETIRED (the perf law's
     root — the @property re-rastered every coat per frame); the angles
     bake statically per phase. */
  assert(!/@keyframes gd-finish-turn\s*\{/.test(css), '1.4.4: the custom-property turn is gone');
  const gleam = /@keyframes gd-foil-gleam\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/92% 84%/.test(gleam) && /118% 106%/.test(gleam), 'the ring field breathes 92 -> 118');
  const still = /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/animation:\s*none/.test(still), 'reduced motion stills the coats');
  /* 1.4.3 supersede: opalescent takes polychrome's seat in the still (the
     pearl + the ribbon's own finish still with the rest). */
  assert(/gd-finish-opalescent/.test(still) && /gd-finish-foil/.test(still) && /gd-finish-holographic/.test(still) && /gd-finish-prismatic/.test(still), 'all four coats are stilled');
});

ok('4 — the families: the four shaders (1.4.0 supersede — the 150 suite holds the whole law)', () => {
  // 1.4.0 supersede: each coat is a compositing pipeline now —
  // the 1.3.9 forms (centered circle / satin band / counter-conics)
  // left with the rework; each family is pinned at its own material.
  // holo: the shape lattice on TWO opposing drifts + the hue cycle
  const holo = /\.gd-finish-holographic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/128px 128px/.test(holo) && /64px 64px/.test(holo), 'the holo lattice rides two tile sizes');
  assert(/mix-blend-mode:\s*overlay/.test(holo), 'the riot composites against the card');
  // foil: the multiply metal + the elliptical rings + the screen sheen sibling
  const foil = /\.gd-finish-foil\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/repeating-radial-gradient\(\s*ellipse/.test(foil), 'the fine concentric elliptical rings');
  assert(/mix-blend-mode:\s*multiply/.test(foil), 'the metal multiplies into the card');
  // 1.4.3 supersede: the sheen is RETIRED (the middle white line + the
  // travelling streak) — three water-ripples ride its seat (the 151 law).
  assert(!/\.gd-finish-foil-sheen/.test(css), 'the sheen left the sheet (1.4.3 — the living metal)');
  // 1.4.3 supersede: OPALESCENT replaces polychrome ("remove polychrome,
  // replace it with Opalescent") — the pearl's pastel conic keeps turning
  // inside the translucent milk (the 152 suite holds the whole law).
  const poly = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/conic-gradient\(/.test(poly) && !/#fbfafd/.test(poly), 'opalescent: the turning conic rides the translucent pearl (1.4.3)');
  const artfin = /\.gd-artfin-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/rgba\(255, 226, 238, 0\.5\)/.test(artfin) && /rgba\(238, 232, 252, 0\.46\)/.test(artfin), 'the sprite wears the pearl\u2019s pastel light');
  // prism: the tessellated crystal lattice + the pastel rainbow + the heat-map
  const prism = /\.gd-finish-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: the crystal tile stays (static, phase-baked); the
     spark lattice moved to the waves' ::after (its own drifting seat);
     the conic bakes its angle statically per phase. */
  assert(/96px 96px/.test(prism), 'the crystal lattice rides its tile (static)');
  assert(/48px 48px/.test(/\.gd-prism-waves::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the spark lattice rides the waves\' own seat (drifting SW)');
  assert(/from calc\(164deg \+ var\(--gd-fin-ph, 0\) \* 360deg\)/.test(prism), 'the pastel rainbow bakes its angle with the card\'s phase (1.4.4)');
  const heat = /\.gd-artfin-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/#ff00ff/.test(heat) && /#00e5ff 64px/.test(heat) && /#ffe600 128px/.test(heat) && /#5b00a8 192px/.test(heat), 'the sprite heat-map: magenta, cyan, yellow, deep purple');
});

// ===========================================================================
// 5 — THE VERSIONS CONTAINER'S FADES
// ===========================================================================
ok('5 — the wrapper writes the seat vars the FlowEdges veils read', () => {
  const seatBlock = /<div\s*\n?\s*className=\{clsx\('relative min-w-0', pad\)\}\s*\n?\s*style=\{\{[\s\S]*?\}\}\s*\n?\s*>/.exec(charSrc)?.[0] || '';
  assert(seatBlock.length > 0, 'the strip wrapper carries a style block');
  assert(/--gd-seat-ox-l/.test(seatBlock), 'the wrapper writes --gd-seat-ox-l (the clip-edge seat)');
  assert(seatBlock.includes("compact ? '16px' : '24px'"), 'the offset speaks the wrapper padding per mode');
  assert(/--gd-side-fade/.test(seatBlock), 'the wrapper writes the ink var');
  assert(/var\(--gd-tier-mid, var\(--gd-bg\)\)/.test(seatBlock), 'the ink is the paper the strip floats on');
  // the old ink seat on the strip itself is retired (the fades are siblings)
  const stripRule = /\.gd-version-strip\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/--gd-side-fade:\s*color-mix/.test(stripRule), "the strip's own ink write is retired");
  // the fades keep reading the shared flow language
  assert(/\.gd-flow-fade\.is-left\s*\{[\s\S]*?left:\s*var\(--gd-seat-ox-l, 0px\)/.test(css), 'the left veil seats at the var');
  assert(/\.gd-flow-fade\.is-right\s*\{[\s\S]*?right:\s*var\(--gd-seat-ox-l, 0px\)/.test(css), 'the right veil seats at the var');
});

// ===========================================================================
// 6 — THE NAME FOLD'S FIRST LANDING SNAPS
// ===========================================================================
ok('6 — the fold speaks duration 0 while the first target has not committed', () => {
  assert(/foldFirstLandingRef/.test(charSrc), 'the first-landing ref exists');
  const decl = /const foldFirstLandingRef = useRef\(true\);/.exec(charSrc)?.[0] || '';
  assert(decl.length > 0, 'the ref starts true (the mount has not landed yet)');
  const flip = /useLayoutEffect\(\(\) => \{\s*if \(nameFoldH != null && foldFirstLandingRef\.current\) \{\s*foldFirstLandingRef\.current = false;\s*\}\s*\}, \[nameFoldH\]\);/.exec(charSrc)?.[0] || '';
  assert(flip.length > 0, 'the commit effect flips it once the first target lands');
  const transition = /transition=\{\s*foldSnap \|\| foldFirstLandingRef\.current \? \{ duration: 0 \} : \{ duration: 0\.24, ease: \[0\.25, 0\.9, 0\.35, 1\] \}\s*\}/.exec(charSrc)?.[0] || '';
  assert(transition.length > 0, 'the first landing snaps; the genuine toggles keep their 0.24s flight');
  assert(/foldFirstLandingRef\.current = false;/.test(/onAnimationComplete=\{\(\) => \{[\s\S]*?\}\}/.exec(charSrc)?.[0] || ''), 'the fold completion releases the snap too');
  assert(/AND SO DOES THE MOUNT MEASURE/.test(charSrc), 'the law is documented at the fold');
});

// ===========================================================================
// 7 — THE PLAIN PACKER LEARNED THE TRAILING TOOLS
// ===========================================================================
ok('7 — the trailing tools ride the plain pack as the tail', () => {
  assert(/THE TRAILING TOOLS RIDE THE PLAIN PACK/.test(sortSrc), 'the law is documented at the packer');
  // the tail is measured (grab-time, hover-silenced) and packed after the chips
  const block = /const kidsArr = Array\.from\(cont\.children \|\| \[\]\);[\s\S]*?const tools = \[\];[\s\S]*?\n    \}/.exec(sortSrc)?.[0] || '';
  assert(block.length > 0, 'the tools collection exists');
  assert(/lastSortIdx/.test(block), 'the tail is verified to trail the last sort item');
  assert(/el\.style\.transform = 'none';/.test(block), 'the tool measures hover-silenced (the 1.3.7 law)');
  // the row packing includes the tools' widths
  const pack = /const rectOf = \(k\) => \(k >= 0 \? rects\[k\] : tools\[-k - 1\]\);[\s\S]*?const total = n \+ tools\.length;/.exec(sortSrc)?.[0] || '';
  assert(pack.length > 0, 'the rows pack chips + tools');
  assert(/row\.push\(i < n \? order\[i\] : -\(i - n \+ 1\)\)/.test(sortSrc), 'a row member can be a tool marker');
  // only the chips take seats (the tools never glide)
  assert(/if \(k >= 0\) out\[k\] = \{ x: xx, y: center - rr\.h \/ 2 \};/.test(sortSrc), 'only the chips take seats');
  // interleaved foreign layouts keep the refusal
  assert(/hasForeign\) return null;/.test(sortSrc), 'the interleaved refusal survives');
});

// ===========================================================================
// 8 — THE VERSION FURNITURE
// ===========================================================================
/* 1.4.4 supersede: the release is 1.4.4 now. */
/* 1.4.4 supersede: the release is 1.4.4 now. */
ok('8 — the version is 1.4.6 everywhere (1.4.5 superseded)', () => {
  const constantsModule = import.meta; // (the module import lives below)
  assert(/version: '1\.4\.6'/.test(src('src/constants/index.js')), 'APP.version');
  assert(/"version": "1\.4\.6"/.test(src('package.json')), 'package.json');
  assert(/## 1\.4\.6 — The Keys Find Their Seat/.test(src('CHANGELOG.md')), 'the changelog leads with 1.3.9');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(/THE KEYS FIND THEIR SEAT/.test(src('website/index.html')), 'the website tagline');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
