// 1.9.5 batch — The Yielding Coat.
// (Named 196 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1, 193 the 1.9.2, 194 the 1.9.3, 195 the 1.9.4; this
//  suite pins the 1.9.5 laws at their roots. Built on the 1.9.4 tree —
//  the release line continues.)
// The reported items, pinned at their root laws:
//   A.  THE PLATE'S OWN LIGHT IS SACRED ("for some reason in some
//       finishes such as nuri finish, when applying a card color so high
//       to the top, aka bright and high saturation, it would darken the
//       card color and then make teh effects darker for some reason, fix
//       that" + "effects still vanish vin bright deep playes, aka issue
//       one, when its too bright it becomes black, fix that"): the broad
//       bodies retire from the light-ground multiply stack (a wash was
//       never an ink), the detail inks' filter gentles from the crushing
//       brightness(0.55) to brightness(0.74) saturate(1.5), and the
//       forge's veil keeps its overlay seat on light plates.
//   B.  THE COAT'S OWN VOLUME ("finish effects are a bit too clear now on
//       the cards like prismatic effects and such, you may add also a
//       transparency slider for the finishes in order to control it, add
//       that slider in the card creation window and card edit window"):
//       cardFinishTransparency rides the card object (0..1, born at
//       15%), the shared finish section seats the slider in BOTH
//       windows, every coat seat reads --gd-fin-strength, and every card
//       surface writes it beside --gd-card-tint.
//   C.  THE X'S CUT FLAT ("xs in numeix theme should not be round edged
//       and should also be slightly more thicker again"): butt caps (the
//       ✖'s own square ends — the round pebble tips retired) and one
//       more step of weight (3.3-5.2 on the same 12-20px spans).
//   D.  THE FURNITURE — the version seats speak 1.9.5, the changelog head
//       tells this story, the README badge + battery count welcome this
//       very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

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
const assertMatch = (text, re, msg) => {
  if (!re.test(text)) throw new Error(msg || 'pattern missing');
};
const block = (css, selector) => {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{[\\s\\S]*?\\n\\}');
  const m = re.exec(css);
  return m ? m[0] : '';
};

const css = src('src/index.css');
const ribbon = src('src/components/TagRibbon.jsx');
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const style = src('src/components/CardStyleControls.jsx');
const newchar = src('src/components/NewCharacterModal.jsx');
const charview = src('src/components/CharacterView.jsx');
const app = src('src/App.jsx');
const constants = src('src/constants/index.js');
const helpers = src('src/utils/helpers.js');

console.log('A. THE PLATE\'S OWN LIGHT IS SACRED ("it would darken the card color")');

ok('A1 — the flip stack retired whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the whole 1.9.3-1.9.9 ground
     machinery — the light multiply washes, the bright subclass's normal
     list, the silver facet, the dark screen family — retired with the
     derivation it served; every coat speaks its classic native blend on
     every plate again, and exactly TWO rules read the ground classes
     (the X signature's dark glow ink seat + its light depth filter). */
  const seatRules = (css.match(/^[^\n/{}]*gd-fin-ground[^\n{]*\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright subclass survived its retirement');
  // the bodies keep their NATIVE BASE seats (the classic physics)
  assertMatch(css, /\.gd-finish-numeix \{[^{}]*mix-blend-mode: soft-light;/, 'the paper lost its native soft-light');
  assertMatch(css, /\.gd-finish-auric \{[^{}]*mix-blend-mode: soft-light;/, 'the honey lost its native soft-light');
  assertMatch(css, /\.gd-finish-foil \{[^{}]*mix-blend-mode: soft-light;/, 'the metal lost its native soft-light tint');
  assertMatch(css, /\.gd-finish-nuri \{[^{}]*mix-blend-mode: overlay;/, 'the forge lost its native overlay');
});

/* 1.9.6 — THE CERTAIN INK supersedes the gentle hand: the ink's
   contrast moved to its own derivation (the twin), the static filter
   retired from every tint-leaning seat, and the white-ink seats alone
   keep the SILVER FACET (brightness(0.55) saturate(1.18)) — their ink
   is white by design, no tint to twin, and the one honest shadow a
   white light speaks on a bright plate is gray. */
ok('A2 — the silver facet retired with the stack (the X\'s pen is the one filter left)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the white-ink seats' facet
     retired with the flip stack — the classic anchors carry their own
     contrast, and the ONE filter the sheet keeps is the X signature's
     light-ground depth pen (the owner's carve-out). */
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver facet survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the gentle filter survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the crushing filter survived somewhere');
  assertMatch(css, /\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{\s*\n  filter: brightness\(0\.78\) saturate\(1\.05\);\s*\n\}/, 'the X\'s pen lost its seat');
});

ok('A3 — the forge\'s veil keeps its classic seat (the flips retired)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil's ground-scoped blend
     flips retired whole — it speaks its classic overlay on every plate,
     reading the card's RAW tint at the 0.5 weight. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-nuri'), 'the veil\'s light flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the veil\'s dark flip survived');
  const veil = /^\.gd-finish-nuri::before \{[\s\S]*?\n\}/m.exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
  assert.ok(veil, 'the veil never spoke');
  assertMatch(veil, /background: var\(--gd-card-tint, var\(--gd-panel\)\);/, 'the veil lost the raw tint');
  assertMatch(veil, /opacity: 0\.5;/, 'the veil kept its old weight');
  assertMatch(veil, /mix-blend-mode: overlay;/, 'the veil lost its blend');
});

ok('A4 — the rainbow bodies speak their classic word on every plate', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the rainbow bodies' normal-seat
     flip and the dark screen family retired with the stack — the riot
     and the prism speak their classic overlay wherever the card sits. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-holographic'), 'the rainbow light flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-holographic'), 'the rainbow dark flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-prism-stars'), 'the prism dark flip survived');
  assertMatch(css, /\.gd-finish-holographic \{[^{}]*mix-blend-mode: overlay;/, 'the riot lost its native overlay');
  assertMatch(css, /\.gd-finish-prismatic \{[^{}]*mix-blend-mode: overlay;/, 'the prism lost its native overlay');
});

console.log('\nB. THE COAT\'S OWN VOLUME ("add that slider in the card creation window and card edit window")');

ok('B1 — every coat seat reads the strength var (the premultiplied fade)', () => {
  // the base seats
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /opacity: var\(--gd-fin-strength, 1\);/, 'the finish seat never read the volume var');
  const artfin = block(css, '.gd-card-face-artfin');
  assertMatch(artfin, /opacity: var\(--gd-fin-strength, 1\);/, 'the artfin twin never read the volume var');
  // the trim coat's own rule (beside the rung law it never touched)
  assertMatch(css, /\.gd-trim\.gd-trim-coat \{\s*\n  opacity: var\(--gd-fin-strength, 1\);\s*\n\}/, 'the trim coat never read the volume var');
  assertMatch(css, /\.gd-trim\.gd-trim-coat \{\s*\n  z-index: 4;\s*\n\}/, 'the trim coat lost its rung');
  // the three artfin breath clocks carry the var INSIDE their keyframes
  // (an animated opacity would shout over the base seat otherwise)
  for (const clock of ['gd-numeix-inkbreath', 'gd-auric-honeybreath', 'gd-nuri-emberbreath']) {
    const kf = new RegExp(`@keyframes ${clock} \\{[\\s\\S]*?\\n\\}`).exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
    assert.ok(kf, `the ${clock} clock never spoke`);
    assert.ok((kf.match(/calc\(var\(--gd-fin-strength, 1\) \* /g) || []).length === 2, `the ${clock} clock never carried the volume var`);
    assert.ok(!/opacity: [0-9]/.test(kf), `the ${clock} clock kept a bare opacity seat`);
  }
});

ok('B2 — the knob rides the card object (rails + defaults)', () => {
  assertMatch(constants, /export const DEFAULT_FINISH_TRANSPARENCY = 0\.15;/, 'the softened default never spoke');
  assertMatch(constants, /export const normalizeFinishTransparency = \(v\) =>\s*\n  Number\.isFinite\(\+v\) \? Math\.min\(1, Math\.max\(0, \+v\)\) : DEFAULT_FINISH_TRANSPARENCY;/, 'the rail never spoke');
  assertMatch(constants, /finishTransparency: normalizeFinishTransparency\(card\.finishTransparency\),/, 'sanitizeCardLook never railed the knob');
  assertMatch(constants, /cardFinishTransparency: sanitizeCardLook\(card\)\.finishTransparency,/, 'makeCharacter never carried the knob');
  assertMatch(helpers, /cardFinishTransparency: normalizeFinishTransparency\(character\?\.cardFinishTransparency\),/, 'the load sanitizer never railed the knob');
});

ok('B3 — the shared finish section seats the slider (both windows, one voice)', () => {
  assertMatch(style, /import \{ CARD_FINISHES, normalizeFinishTransparency \} from '\.\.\/constants\/index\.js';/, 'the section never imported the rail');
  assertMatch(style, /finishTransparency = null,\s*\n  onFinishTransparency = null,/, 'the section never declared the knob props');
  // the slider row itself
  assertMatch(style, /type="range"/, 'the slider never rendered');
  assertMatch(style, /className="gd-range flex-1 min-w-\[110px\]"/, 'the slider lost the app\'s own range voice');
  assertMatch(style, /min=\{0\}\s*\n\s*max=\{1\}\s*\n\s*step=\{0\.05\}/, 'the slider lost its 0..1 rail');
  assertMatch(style, /value=\{normalizeFinishTransparency\(finishTransparency\)\}/, 'the slider never normalized its value');
  assertMatch(style, /aria-label="Finish transparency"/, 'the slider never spoke its name');
  assertMatch(style, /Math\.round\(normalizeFinishTransparency\(finishTransparency\) \* 100\)\}%/, 'the readout lost its percent voice');
  // the grey-out law holds with the family (never hidden — dimmed and blind)
  assertMatch(style, /coatSilent && 'opacity-45 pointer-events-none'/, 'the knob never learned the grey-out law');
  assertMatch(style, /disabled=\{coatSilent \|\| !onFinishTransparency\}/, 'the knob never went blind');
});

ok('B4 — the creation window drafts the knob (create-time law)', () => {
  assertMatch(newchar, /const \[finishTransparency, setFinishTransparency\] = useState\(DEFAULT_FINISH_TRANSPARENCY\);/, 'the creation draft never spoke');
  assertMatch(newchar, /setFinishTransparency\(DEFAULT_FINISH_TRANSPARENCY\);/, 'the RESET law never re-seeded the knob');
  /* 1.9.6 — the split volume rides the same CREATE commit (the
     checkbox + the image knob — one family, one birth). */
  assertMatch(newchar, /card: \{ ratio, trim, trimColor, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishTransparency, finishSplitImage, finishImageTransparency, imageMotion, stampMotion \}/, 'the CREATE commit never carried the knob');
  assertMatch(newchar, /finishTransparency=\{finishTransparency\}\s*\n\s*onFinishTransparency=\{setFinishTransparency\}/, 'the window never threaded the knob into the shared section');
  assertMatch(newchar, /finishTransparency=\{finishTransparency\}\s*\n\s*\/\*[\s\S]*?\*\/\s*\n\s*finishSplitImage=\{finishSplitImage\}\s*\n\s*finishImageTransparency=\{finishImageTransparency\}\s*\n\s*imageMotion=\{imageMotion\}/, 'the window never threaded the knob into the preview');
});

ok('B5 — the edit window drafts the knob (draft-commit law)', () => {
  assertMatch(charview, /const \[finishTransparency, setFinishTransparency\] = useState\(\s*\n\s*normalizeFinishTransparency\(character\.cardFinishTransparency\)\s*\n\s*\);/, 'the edit draft never spoke');
  assertMatch(charview, /onFinishTransparency=\{touch\(setFinishTransparency\)\}/, 'the window never threaded the knob into the shared section');
  /* 1.9.6 — the split volume threads into the preview beside the knob
     (a comment-shaped thread — the law keeps its words). */
  assertMatch(charview, /finishTransparency=\{finishTransparency\}\s*\n\s*\/\*[\s\S]*?\*\/\s*\n\s*finishSplitImage=\{finishSplitImage\}\s*\n\s*finishImageTransparency=\{finishImageTransparency\}\s*\n\s*imageMotion=\{imageMotion\}/, 'the window never threaded the knob into the preview');
  // the DONE commit carries it, and the App lane lands it on the card
  /* 1.9.6 — the DONE commit carries the split beside the knob (the
     birth-version comments keep their own words at their own seats). */
  assertMatch(charview, /finishOnTrim,\s*\n\s*\/\/ 1\.9\.5 — the coat's own volume rides it too[\s\S]*?finishTransparency,\s*\n\s*\/\/ 1\.9\.6 — the split volume rides it too[\s\S]*?finishSplitImage,\s*\n\s*finishImageTransparency,/, 'the DONE commit never carried the knob');
  assertMatch(app, /cardFinishTransparency: normalizeFinishTransparency\(card\.finishTransparency\),/, 'the App commit lane never landed the knob');
});

ok('B6 — every card surface writes the strength var (what you slide is what you ship)', () => {
  // the one derivation, exported beside the tone reader
  assertMatch(ribbon, /export function finishStrength\(transparency\) \{/, 'the strength derivation never spoke');
  assertMatch(ribbon, /return Number\(\(1 - t\)\.toFixed\(3\)\);/, 'the derivation lost its rounding law');
  assertMatch(ribbon, /import \{ DEFAULT_FINISH_TRANSPARENCY \} from '\.\.\/constants\/index\.js';/, 'the derivation lost its default');
  // the compact preview
  assertMatch(ribbon, /\['--gd-fin-strength'\]: finishStrength\(finishTransparency\),/, 'the compact preview never wrote the var');
  assertMatch(ribbon, /finishTransparency = null,/, 'the compact preview never declared the prop');
  // the grid card (the shipped card's own seat)
  assertMatch(grid, /\['--gd-fin-strength'\]: finishStrength\(character\.cardFinishTransparency\),/, 'the grid card never wrote the var');
  /* 1.9.6 — the import gained finishInkTwin (the shadow twin the light
     ground's seats read). */
  assertMatch(grid, /finishGroundTone, finishTintLean, finishPhase, finishStrength,/, 'the grid never imported the derivation');
  // the look editor's panzoom + both forwarded seats
  assertMatch(look, /\['--gd-fin-strength'\]: finishStrength\(finishTransparency\),/, 'the panzoom never wrote the var');
  assertMatch(look, /import \{ finishStrength \} from '\.\/TagRibbon\.jsx';/, 'the look editor never imported the derivation');
  assert.equal((look.match(/finishTransparency=\{finishTransparency\}/g) || []).length, 2, 'the editor never forwarded the knob to BOTH preview seats');
});

console.log('\nC. THE X\'S CUT FLAT ("not round edged, slightly more thicker again")');

ok('C1 — the caps cut flat in every loom and every engine seat', () => {
  assert.equal((css.match(/stroke-linecap='butt'/g) || []).length, 4, `the flat caps never seated everywhere (${(css.match(/stroke-linecap='butt'/g) || []).length})`);
  // the ban is the X glyph's alone: the two looms carry no round cap
  // (other coats' glyphs — the numeix streams' wavy lines among them —
  // keep their own caps; the report spoke of the X's alone)
  for (const sel of ['.gd-numeix-xmarks::before', '.gd-numeix-xmarks::after']) {
    assert.ok(!block(css, sel).includes("stroke-linecap='round'"), `${sel} kept a round cap`);
    assertMatch(block(css, sel), /stroke-linecap='butt'/, `${sel} never spoke the butt caps`);
  }
  assertMatch(css, /stroke='%23fff' stroke-linecap='butt'/, 'the glyphs never spoke the butt caps');
});

ok('C2 — the band steps up once more (3.3-5.2, the ✖\'s own proportion)', () => {
  const near = block(css, '.gd-numeix-xmarks::before');
  const far = block(css, '.gd-numeix-xmarks::after');
  const xWidths = [...near.matchAll(/stroke-width='([\d.]+)'/g), ...far.matchAll(/stroke-width='([\d.]+)'/g)].map((m) => Number(m[1]));
  assert.equal(xWidths.length, 38, `the looms lost strokes (${xWidths.length})`);
  for (const [name, b] of [['the near loom', near], ['the far loom', far]]) {
    const marks = [...b.matchAll(/M(\d+) (\d+) L(\d+) (\d+) M(\d+) (\d+) L(\d+) (\d+)' stroke-width='([\d.]+)'/g)];
    assert.ok(marks.length >= 7, `${name} lost its marks (${marks.length})`);
    for (const m of marks) {
      const span = Math.hypot(m[3] - m[1], m[4] - m[2]);
      const w = Number(m[9]);
      assert.ok(w >= 3.3 && w <= 5.2, `${name}: a stroke left the flat-cut band: ${w}`);
      const ratio = w / span;
      assert.ok(ratio >= 0.17 && ratio <= 0.23, `${name}: the ✖ proportion broke at ${m[1]},${m[2]} (w ${w} / span ${span.toFixed(1)} = ${ratio.toFixed(2)})`);
    }
  }
  assert.ok(Math.min(...xWidths) >= 3.3, `a thin survivor: ${Math.min(...xWidths)}`);
  assert.ok(Math.max(...xWidths) <= 5.2, `a bold trespasser: ${Math.max(...xWidths)}`);
  // the sizes still vary (the 1.9.3 law's own word)
  const spans = [...near.matchAll(/M(\d+) (\d+) L(\d+) (\d+)/g)].map((m) => Math.round(Math.hypot(m[3] - m[1], m[4] - m[2])));
  assert.ok(new Set(spans).size >= 3, `the marks lost their size variety (${[...new Set(spans)].join(', ')})`);
});

ok('C3 — every clock keeps its seat and the law note speaks the flat cut', () => {
  assertMatch(css, /gd-numeix-fall-a 20s linear infinite/, 'the near fall clock drifted');
  assertMatch(css, /gd-numeix-fall-b 26s linear infinite/, 'the far fall clock drifted');
  assertMatch(css, /gd-numeix-x-twine 9s ease-in-out infinite/, 'the near twinkle drifted');
  assertMatch(css, /gd-numeix-x-twind 13s ease-in-out infinite/, 'the far twinkle drifted');
  assertMatch(css, /BUTT caps \(the flat square ends the glyph itself\s+wears/, 'the flat-cut law note never spoke');
  assertMatch(css, /3\.3-5\.2 on the same 12-20px\s+spans/, 'the band note never spoke its numbers');
});

console.log('\nD. THE FURNITURE');

ok('D1 — the version is 1.9.5 everywhere', () => {
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json');
  const lock = JSON.parse(src('package-lock.json'));
  assert.equal(lock.version, '1.9.19', 'package-lock.json head');
  assert.equal(lock.packages[''].version, '1.9.19', 'package-lock.json root seat');
  assert.ok(constants.includes("version: '1.9.19'"), 'the APP constant');
});

ok('D2 — the changelog head tells this story', () => {
  const head = src('CHANGELOG.md');
  assert.ok(head.startsWith('## 1.9.19 — The Ends Trade Places'));
  assert.ok(head.includes("The plate's own light is sacred"));
  assert.ok(head.includes('The coat\'s own volume'));
  assert.ok(head.includes("The X's cut flat"));
});

ok('D3 — the README badge + battery count welcome this very suite', () => {
  const readme = src('README.md');
  assert.ok(readme.includes('version-1.9.19-purple'));
  assert.ok(readme.includes('93 DOM/source test suites'));
});

ok('D4 — the battery runner welcomes this very suite', () => {
  const runner = src('scripts/run_battery_171.sh');
  assert.ok(runner.includes('gendex_196_batch_dom'));
});

console.log(`${passed} passed, ${failed} failed`);
if (failed) console.log('FIX ABOVE');
else console.log('ALL GREEN');
process.exit(failed ? 1 : 0);
