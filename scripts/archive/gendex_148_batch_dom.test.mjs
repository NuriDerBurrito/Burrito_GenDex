// 1.3.8 batch — THE IMAGE, THEN THE CARD (superseded in place by 1.3.9).
// The reported items, each pinned at its root law:
//   1.  the right panel's tags container never lifts on open ("when
//       opening right pannel, the container of tags on the right seem to
//       do that same small lift up ... but not the tags themselves, its
//       instead just the top of their container"): the rAF-1 breath and
//       its 98px placeholder guess are retired — the tags zone mounts
//       with the view's OWN first commit (the stamps' 1.3.6 law,
//       extended), so there is no guess to mismatch and no jump
//   2.  the fade stays on the image ("i think its related to the fade
//       color, its affecting the two corners ... so just fix it by
//       limiting the fade to the image"): the --gd-foot-tint layer is
//       retired from the rise and from every surface that wrote it; the
//       seam's bloom speaks ONE length law (calc(24px * --card-scale))
//       on both sides of the seam at every card size; the line-family
//       trims' seam-side rule goes silent on extreme plates
//       (.is-seamless, luminance <= 0.2 or >= 0.8 — "keep it but i want
//       it hidden")
//   2b. the hue family: the HUE OVER STAMP switch commits ("fix the
//       issue where the hue over stamp switch isnt turning on when i
//       press on it" — the transform cleaner's whitelist learned
//       hueOver), and the color window gains HUE OVER TRIM ("implement
//       an option in the hue settings to be above the trim too") — one
//       wash at z-4 above the trims while it is on
//   3.  the card's name clears the clip plane ("the card name clips to
//       the left when its enlarged and bold and so on"): the title and
//       the panel's name fold carry the headroom law (0.14em padding +
//       matching negative margin)
//   4.  THE CARD'S OWN LOOKS (the "for fun" pass): a secondary color,
//       four finishes + an affect-image switch, and twelve pattern
//       seats + their own switch — one shared section in BOTH windows,
//       every card surface rendering it, the fields riding the same
//       sanitize + undo + persist pipeline the color always spoke
// Plus: the version is 1.4.3 everywhere.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as helpersModule from '../src/utils/helpers.js';

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
assert.deepEqual = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

const css = src('src/index.css');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const colorSrc = src('src/components/StampColorControls.jsx');
const appSrc = src('src/App.jsx');
const helpersSrc = src('src/utils/helpers.js');
const constantsModule = await import(join(appRoot, 'src/constants/index.js'));
const {
  APP,
  CARD_FINISHES,
  CARD_PATTERNS, // 1.3.9: retired — undefined on purpose (the assertions below)
  DEFAULT_CARD_FINISH,
  DEFAULT_CARD_PATTERN, // 1.3.9: retired — undefined on purpose
  migrateCardFinish, // 1.4.0: polychrome replaces chromatic (the load migration)
  sanitizeCardLook,
  sanitizeStampSettings,
  makeCharacter,
} = constantsModule;
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

// ===========================================================================
// 1 — THE TAGS ZONE MOUNTS WITH THE PANEL'S FIRST FRAME
// ===========================================================================
ok('1 — the tags row renders unconditionally (no staged breath, no placeholder)', () => {
  assert(!/mountStage\s*>=\s*1\s*\?/.test(charSrc), 'the mountStage >= 1 gate is retired');
  assert(!/TRAY_ZONE_H_CACHE\.get/.test(charSrc), 'no placeholder reads the retired cache');
  assert(!/const TRAY_ZONE_H_CACHE/.test(charSrc), 'the cache itself is retired');
  assert(/THE TAGS ZONE MOUNTS WITH THE FIRST FRAME/.test(charSrc), 'the law is documented at the seat');
  // the zone's own tree (TagsFlowRow) is a direct render, and the cache
  // write effect left with the reader
  assert(!/TRAY_ZONE_H_CACHE\.set/.test(charSrc), 'the cache write left with its reader');
});

// ===========================================================================
// 2 — THE FADE STAYS ON THE IMAGE (the seam law)
// ===========================================================================
ok('2 — the tint layer is retired from the rise', () => {
  const block = stripComments(/\.gd-card-foot::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '');
  assert(block.length > 0, 'the rise law exists');
  assert(!/background-image/.test(block), 'the plain rise paints no image layer at all');
  assert(!/linear-gradient\(var\(--gd-foot-tint/.test(css), 'no tint gradient remains in the css');
  assert(/THE FADE STAYS ON THE IMAGE/.test(css), 'the retirement quotes the report');
});

ok('2 — no surface writes the retired tint var', () => {
  assert(!/\['--gd-foot-tint'\]/.test(gridSrc), 'GridView dropped the tint write');
  assert(!/\['--gd-foot-tint'\]/.test(lookSrc), 'CardLookEditor dropped the tint write');
  assert(!/--gd-foot-tint/.test(ribbonSrc), 'TagRibbon never spoke it (and still does not)');
  assert(!/foot-tint["']?\s*:/.test(css), 'the css var itself is retired');
});

ok('2b — the bloom speaks ONE length law on both sides of the seam', () => {
  const rise = /\.gd-card-foot-vers\.is-colored::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(rise.length > 0, 'the colored rise law exists');
  assert(/calc\(24px \* var\(--card-scale, 1\)\)/.test(rise), 'the rise fades at the scale-matched length');
  const foot = /\.gd-card-foot-vers\.is-colored\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(foot.length > 0, 'the colored foot law exists');
  assert(/calc\(24px \* var\(--card-scale, 1\)\)/.test(foot), 'the foot fades at the same length');
  // the plain (uncolored) rise paints NO bloom — the paper foot speaks no
  // gradient, so its rise speaks none either (one voice on paper cards)
  const plain = /\.gd-card-foot::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/background-image/.test(plain), 'the plain rise carries no image layer');
});

ok('2b — math mirror: the length reproduces the old 44% at every measured size', () => {
  // footH is linear in scale (measured live: 46px @ 0.84, 71px @ 1.30 →
  // ~54.6px per scale-1); the old stop was 44% of footH; the new law is
  // 24px * scale. Check the reproduction at the two measured points.
  const smallScale = 46 / 54.6; // 0.842
  const expandedScale = 71 / 54.6; // 1.301
  const smallOld = 0.44 * 46;
  const expandedOld = 0.44 * 71;
  assert.ok(Math.abs(24 * smallScale - smallOld) < 0.6, `small: ${24 * smallScale} vs ${smallOld}`);
  assert.ok(Math.abs(24 * expandedScale - expandedOld) < 0.8, `expanded: ${24 * expandedScale} vs ${expandedOld}`);
});

ok('2c — the seam-side trim rule speaks its WHOLE frame on every plate (1.4.0 supersede)', () => {
  // 1.4.0 supersede: the 1.3.8 seamless HIDING was exactly the reported
  // bug — the LINE family's bottom rule went transparent on extreme
  // plates, so "the bottom of them stops or doesnt get rendered" on
  // exactly the four trims, exactly on the dark / light cards. The
  // hiding is RETIRED (the 150 suite's 1d holds the whole law): the
  // is-seamless class still rides the markup but paints nothing.
  assert(!/border-bottom-color:\s*transparent/.test(css), 'the line family never hides its seam side anymore');
  assert(/THE SEAMLESS BOTTOM-RULE HIDING IS RETIRED/.test(css), 'the retirement is documented at the seat');
  // the gate still computes (the class rides the markup, painting nothing)
  assert(/seamless/.test(ribbonSrc), 'TrimOverlay still speaks the seamless seat');
  assert(/isExtremePlateHex/.test(gridSrc), 'GridView still computes the gate');
  assert(/isExtremePlateHex/.test(ribbonSrc), 'CardPreview still computes the gate');
});

ok('2c — math mirror: the luminance gate', () => {
  const lum = (hex) => {
    const c = [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16) / 255);
    const lin = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };
  void lum; // the mirror of the helper's own math (kept for the record)
  const gate = helpersModule.isExtremePlateHex;
  for (const [hex, want] of [
    ['#000000', true], // black — the report's case
    ['#ffffff', true], // white — the report's other case
    ['#e8e8e8', true], // near-white
    ['#2c2c2c', true], // near-black
    ['#123456', true], // deep navy — dark enough to gate
    ['#e67e22', false], // the classic orange keeps the frame
    ['#e8b84b', false], // a mid gold keeps the frame
    [null, false], // uncolored cards never gate
  ]) {
    assert.equal(gate(hex), want, `${hex} gate`);
  }
});

// ===========================================================================
// 2d — THE HUE FAMILY: the switches commit
// ===========================================================================
ok('2d — the transform cleaner learned hueOver (the stuck switch)', () => {
  const m = /const setCharacterStampTransform[\s\S]*?mutateDb/.exec(appSrc)?.[0] || '';
  assert(m.length > 0, 'the cleaner exists');
  assert(/'hueOver'\s+in\s+patch/.test(m), 'hueOver rides the whitelist');
  assert(/'hueOverTrim'\s+in\s+patch/.test(m), 'hueOverTrim rides the whitelist');
  assert(/hueOver was born in 0\.38\.0/.test(appSrc), 'the fix documents the root cause');
});

ok('2d — the color window carries the OVER TRIM switch', () => {
  assert(/HUE OVER TRIM/.test(colorSrc), 'the switch renders in the hue settings');
  assert(/onHueOverTrim/.test(colorSrc), 'the commit lane exists');
  assert(/gd-hue-over-trim/.test(css), 'the z-4 wash law exists');
  const wash = /\.gd-card-stamp-hue\.gd-hue-over-trim\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*4/.test(wash), 'the wash sits above the trims (z 3)');
  assert(/height:\s*52%/.test(wash), 'the wash keeps the classic halfcard geometry');
  // the renderers: one wash above the trim while the setting is on, the
  // band's + free layer's own washes stand down
  assert(/gd-hue-over-trim/.test(gridSrc), 'GridView renders the over-trim wash');
  assert(/hueOverTrim/.test(gridSrc), 'GridView reads the setting');
  assert(/!hueOverTrim/.test(gridSrc), 'the lower washes stand down while it is on');
  assert(/gd-hue-over-trim/.test(lookSrc), 'the look editor mirrors the law');
  // the settings object + sanitizer
  assert.equal(sanitizeStampSettings({}).hueOverTrim, false, 'hueOverTrim defaults off');
  assert.equal(sanitizeStampSettings({ hueOverTrim: true }).hueOverTrim, true, 'hueOverTrim sanitizes on');
});

// ===========================================================================
// 3 — THE NAME CLEARS THE CLIP PLANE
// ===========================================================================
ok('3 — the title + the fold carry the left headroom', () => {
  const title = /\.gd-card-title\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/padding-left:\s*0\.14em/.test(title), 'the title carries the headroom padding');
  assert(/margin-left:\s*-0\.14em/.test(title), 'the title carries the matching negative margin');
  const fold = /\.gd-name-fold\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/padding-left:\s*0\.14em/.test(fold), 'the fold carries the headroom padding');
  assert(/margin-left:\s*-0\.14em/.test(fold), 'the fold carries the matching negative margin');
  assert(/LEFT HEADROOM FOR THE GLYPHS' OWN INK/.test(css), 'the law is documented');
});

// ===========================================================================
// 4 — THE CARD'S OWN LOOKS
// ===========================================================================
ok('4 — the constants: five finishes, no patterns, one sanitizer (1.3.9 supersede)', () => {
  // 1.3.9 — THE SECONDARY COLOR AND THE PATTERN ARE RETIRED: the twelve
  // pattern seats, their prints and every field that carried them left
  // with the request; the FINISH keeps its seat. The assertions below
  // supersede this suite's 1.3.8 originals (twelve patterns -> none).
  // 1.4.0 supersede: polychrome replaces chromatic (the coat that
  // replaces the card's own colors); the migration maps saved chromatic
  // cards onto it at load.
  // 1.4.3 supersede: NURI, the ember coat, joins the family.
  // 1.4.3 supersede: OPALESCENT replaces polychrome ("remove polychrome,
  // replace it with Opalescent") — chromatic AND polychrome both migrate
  // onto the pearl at load.
  assert.equal(CARD_FINISHES.length, 6, 'six finishes (none + five materials)');
  assert.deepEqual(CARD_FINISHES.map((f) => f.id), ['none', 'opalescent', 'foil', 'holographic', 'prismatic', 'nuri']);
  assert.equal(migrateCardFinish('chromatic'), 'opalescent', 'the legacy chromatic migrates');
  assert.equal(migrateCardFinish('polychrome'), 'opalescent', '1.4.3: the legacy polychrome migrates onto the pearl');
  assert.equal(migrateCardFinish('foil'), 'foil', 'the living names pass through');
  // 1.4.3 supersede: the sanitizer lands imageMotion with the same strict law.
  // 1.4.5 SUPERSEDED: the rails grew the coat's reach switches — the shape
  // deepEquals through them.
  assert.deepEqual(sanitizeCardLook({ finish: 'chromatic' }), { finish: 'opalescent', finishOnImage: false, finishOnTrim: false, finishOnStamp: false, imageMotion: false });
  assert(!('CARD_PATTERNS' in constantsModule), 'CARD_PATTERNS is retired');
  assert(!('isCardPattern' in constantsModule), 'isCardPattern is retired');
  assert(!('DEFAULT_CARD_PATTERN' in constantsModule), 'DEFAULT_CARD_PATTERN is retired');
  assert.equal(DEFAULT_CARD_FINISH, 'none');
  assert.deepEqual(sanitizeCardLook({}), {
    finish: 'none',
    finishOnImage: false,
    finishOnTrim: false,
    finishOnStamp: false,
    imageMotion: false,
  });
  assert.deepEqual(sanitizeCardLook({ color2: '#ABCDEF', finish: 'foil', finishOnImage: 1, pattern: 'waves', patternOnImage: 'yes' }), {
    finish: 'foil',
    finishOnImage: false, // the strict-boolean law: only true is true
    finishOnTrim: false,
    finishOnStamp: false,
    imageMotion: false,
  });
  assert.deepEqual(sanitizeCardLook({ finish: 'junk', pattern: 'junk', color2: 'nope' }), {
    finish: 'none',
    finishOnImage: false,
    finishOnTrim: false,
    finishOnStamp: false,
    imageMotion: false,
  });
});

ok('4 — the CSS: the prints are gone, four LIVING materials + their seats (1.3.9 supersede)', () => {
  // 1.3.9 — the eleven prints and both pattern seats are RETIRED; the four
  // materials keep their seats and now carry their own slow clocks.
  for (const id of ['stripes', 'bands', 'dots', 'checker', 'diagonal', 'crosshatch', 'diamonds', 'grid', 'waves', 'squiggles', 'confetti']) {
    assert(!new RegExp(`\\.gd-pat-${id}\\s*\\{`).test(css), `the ${id} print is retired`);
  }
  assert(!/\.gd-card-plate-pat\s*\{/.test(css), 'the plate pattern seat is retired');
  assert(!/\.gd-sleeve-pat\s*\{/.test(css), 'the image pattern seat is retired');
  // 1.4.0 supersede: polychrome replaces chromatic; the plate coat seat
  // left for ONE continuous root coat (the AFFECTS IMAGE mask law).
  // 1.4.3 supersede: opalescent replaces polychrome — the pearl's seat.
  for (const id of ['opalescent', 'foil', 'holographic', 'prismatic']) {
    assert(new RegExp(`\\.gd-finish-${id}\\s*\\{`).test(css), `the ${id} material exists`);
  }
  assert(!/\.gd-finish-chromatic\s*\{/.test(css), 'the chromatic satin left with the name');
  assert(!/\.gd-finish-polychrome\s*\{/.test(css), '1.4.3: the polychrome pour left with the name');
  assert(!/\.gd-card-plate-finish\s*\{/.test(css), 'the plate finish seat left (ONE root coat now)');
  assert(/\.gd-card-face-finish\s*\{/.test(css), 'the root finish seat exists');
  assert(/\.gd-card-face-finish\.is-plate-only/.test(css), 'the plate-only mask exists (the switch lifts it)');
  // the text cells keep their rise above the foot's floor (the seat the
  // pattern once motivated, kept for the finish's own law)
  assert(/\.gd-card-foot-vers > \.gd-card-foot-name[\s\S]*?z-index:\s*1/.test(css), 'the name cell keeps its rise');
  // 1.4.0 — THE COATS ARE SHADERS: every clock reads the card's own phase
  // 1.4.3 supersede: the liquid spectrum leads with its own pour clock.
  // 1.4.3 supersede: the pearl leads with its own glow clock (14s) and
  // turns on the shared 21s conic clock.
  /* 1.4.4 supersede: the pearl's body is static (the 1.4.4 perf law) —
     its motion lives in the tide (19s) + glints (7s); the prism's chaos
     clock retired with its background-position animation (the waves'
     16s NE drift speaks instead). */
  assert(/gd-opal-tide 19s linear infinite/.test(css) && /gd-opal-glint 7s ease-in-out infinite/.test(css), 'opalescent tide + glints (1.4.4: the pearl\'s elements)');
  assert(/gd-prism-drift-ne 16s linear infinite/.test(css), 'prismatic waves drift on the 16s clock (1.4.4)');
  assert(/gd-foil-gleam 9s ease-in-out infinite/.test(css), 'foil breathes on a 9s clock');
  assert(/gd-finish-hue 12s linear infinite/.test(css), 'holographic cycles hue on a 12s clock');
  /* 1.4.4 supersede: the chaos clock retired with the background-position
     animation (the perf law) — the waves' 16s NE drift speaks above. */
  assert(!/gd-prism-chaos/.test(css), '1.4.4: the chaos clock is gone (compositor-only flights)');
  assert(/prefers-reduced-motion: reduce[\s\S]*?animation: none/.test(css), 'reduced motion stills every coat');
});

ok('4 — the shared layers + every surface renders them (1.3.9 supersede)', () => {
  // 1.3.9 — CardPatternLayer is retired; CardFinishLayer alone is shared.
  assert(!/export function CardPatternLayer/.test(ribbonSrc), 'CardPatternLayer is retired');
  assert(/export function CardFinishLayer/.test(ribbonSrc), 'CardFinishLayer is shared');
  for (const surface of [gridSrc, lookSrc, ribbonSrc]) {
    assert(!/CardPatternLayer/.test(surface), 'the surface no longer renders the pattern');
    assert(/CardFinishLayer/.test(surface), 'the surface renders the finish');
  }
  // the surfaces read the character's own fields
  assert(!/character\.cardPattern/.test(gridSrc), 'the grid card dropped the pattern read');
  assert(/character\.cardFinish/.test(gridSrc), 'the grid card reads the finish');
  assert(!/character\.cardColor2/.test(gridSrc), 'the grid card dropped the secondary color read');
});

ok('4 — the fields ride the record: makeCharacter + the load sanitizer (1.3.9 supersede)', () => {
  const c = makeCharacter('Look Test', 'root', [], {
    color: '#123456',
    color2: '#abcdef',
    finish: 'foil',
    finishOnImage: true,
    pattern: 'dots',
    patternOnImage: true,
  });
  assert.equal(c.cardColor, '#123456', 'the card color survives');
  assert.equal(c.cardFinish, 'foil');
  assert.equal(c.cardFinishOnImage, true);
  assert(!('cardColor2' in c), 'the secondary color field is retired');
  assert(!('cardPattern' in c), 'the pattern field is retired');
  assert(!('cardPatternOnImage' in c), 'the pattern switch field is retired');
  const legacy = makeCharacter('Legacy', 'root', [], {});
  assert.equal(legacy.cardFinish, 'none');
  // the load-side sanitizer carries the finish fields (a reload keeps the
  // look) and DROPS any 1.3.9 pattern fields a saved card still carries
  assert(!/cardColor2:/.test(helpersSrc), 'sanitizeCharacter dropped the secondary color');
  assert(/cardFinish:/.test(helpersSrc), 'sanitizeCharacter carries the finish');
  assert(!/cardPattern:/.test(helpersSrc), 'sanitizeCharacter dropped the pattern');
  assert(/cardFinishOnImage:/.test(helpersSrc), 'the finish image switch survives loads');
});

ok('4 — both windows seat the shared section + the commit lanes (1.3.9 supersede)', () => {
  assert(/import CardStyleControls/.test(newSrc), 'the creation window seats it');
  assert(/import CardStyleControls/.test(charSrc), 'the edit window seats it');
  assert(!/>SECONDARY COLOR</.test(styleSrc), 'the secondary color row is retired');
  assert(/FINISH/.test(styleSrc), 'the finish chips');
  assert(!/>PATTERN</.test(styleSrc) && !/<select/.test(styleSrc), 'the pattern dropdown is retired');
  assert(/affect the image/.test(styleSrc), 'the finish image switch');
  assert(!/cardColor2/.test(newSrc) && !/cardPattern/.test(newSrc), 'the creation window dropped the retired fields');
  // 1.4.3 supersede: image motion rides the same object.
  // 1.4.5 SUPERSEDED: the submit carries the whole finish family now.
  assert(new RegExp(String.raw`card: \{ ratio, trim, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishOnStamp, imageMotion \}`).test(newSrc), 'the creation submit carries the finish family');
  assert(!/cardColor2: card\.color2/.test(appSrc), 'the edit apply dropped the secondary color');
  assert(/cardFinishOnImage: card\.finishOnImage/.test(appSrc), 'the edit apply carries the finish switch');
  assert(!/cardPatternOnImage: card\.patternOnImage/.test(appSrc), 'the edit apply dropped the pattern switch');
  // the previews thread the drafts (what you frame is what ships)
  assert(!/color2=\{color2\}/.test(lookSrc), 'CardLookEditor dropped the secondary color');
  assert(!/patternOnImage=\{patternOnImage\}/.test(lookSrc), 'CardLookEditor dropped the pattern switch');
});

ok('4 — the hue settings + the look windows agree (the switch twins)', () => {
  assert(/hueOverTrim=\{stampSettings\.hueOverTrim === true\}/.test(newSrc), 'the creation window threads the trim switch');
  assert(/onHueOverTrim=\{\(v\) => patchSettings\(\{ hueOverTrim: v \}\)\}/.test(newSrc), 'the creation window commits it');
  assert(/onHueOverTrim=\{\(v\) => onColor\(character\.id, \{ hueOverTrim: v \}\)\}/.test(charSrc), 'the panel commits it through the color lane');
  assert(/'hueOverTrim' in patch/.test(appSrc), "App's color cleaner learned the name");
});

// ===========================================================================
// 5 — THE VERSION FURNITURE
// ===========================================================================
/* 1.4.4 supersede: the release is 1.4.4 now. */
ok('5 — the version is 1.4.6 everywhere (1.3.9 supersede)', () => {
  assert.equal(APP.version, '1.4.6');
  assert.equal(pkg.version, '1.4.6');
  assert.equal(lock.version, '1.4.6');
  assert.equal(lock.packages[''].version, '1.4.6');
  assert(/1\.4\.6/.test(src('README.md')), 'README speaks it');
  assert(/1\.4\.6/.test(src('START.bat')), 'START.bat speaks it');
  // 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
  // release ships without it"): the one-file page left the repo
  // with the final release; this suite's page-pins retired with it.
  assert(/v1\.4\.5/.test(web), 'the website ver chip');
  // 1.4.5: the tagline follows the release title.
  assert(/THE KEYS FIND THEIR SEAT/.test(web), 'the website tagline');
  assert(/var CURRENT = \[1, 4, 6\]/.test(web), 'the version-check gate');
  assert(/v1\.4\.6\/Burrito_GenDex_1\.4\.6_source\.zip/.test(web), 'the source zip link');
  assert(/<td class="v">1\.4\.6<\/td>/.test(web), 'the versions table row');
  const changelog = src('CHANGELOG.md');
  assert(/^## 1\.4\.6 — The Keys Find Their Seat/.test(changelog), 'the changelog leads with 1.4.6');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
