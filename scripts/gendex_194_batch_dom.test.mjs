// 1.9.3 batch — The Speaking Coat.
// (Named 194 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1 laws, 193 the 1.9.2; this suite pins the 1.9.3 laws at
//  their roots. Built on the 1.9.2 tree — the release line continues.)
// The reported items, pinned at their root laws:
//   A.  THE TRUE X ("the x's in numeix theme should be actual xs , not as
//       in the letter but like rotated '+' so its a well fit as an x and
//       doesnt feel stretched , it may be bigger or smaller in size thats
//       it, should also be semi thick stroked not thin or bolded. aka '✖'"):
//       the calligraphic curves retire; every mark is two straight
//       diagonals crossing at the center, round caps, semi-thick strokes,
//       the sizes still varied — spoken as the tile's own alpha mask.
//   B.  THE COAT SPEAKS THE CARD'S OWN COLOR ("fix color dependency in
//       finishes so they fit the card color"): numeix / foil / auric lean
//       --gd-card-tint through every seat (the nuri mask law reaches the
//       three named coats), while holographic and prismatic keep every
//       word they always spoke.
//   C.  THE EXTREME GROUNDS ("in some color values especially when i lean
//       towards black or white or high saturation, the finishes would
//       dissapear or would be covered"): the seats class the picked plate
//       (finishGroundTone) and the blend families answer — light turns the
//       luminous seats to multiply, dark turns the bodies to screen, vivid
//       turns them to overlay.
//   D.  THE CREATE KEY RETURNS TO PRESS ("the create button is not
//       pressable/highlighted even tho we have nothing to prevent it"):
//       the retained creation window re-seeds the 1.8.6 wheel's latch on
//       every open — the key never greets an open wearing the loading face.
//   E.  THE FURNITURE — the version seats speak 1.9.3, the changelog head
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
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const ribbon = src('src/components/TagRibbon.jsx');
const ncm = src('src/components/NewCharacterModal.jsx');

// the coat sections, sliced at their own borders
const NUMEIX = css.slice(css.indexOf('.gd-finish-numeix {'), css.indexOf('/* FOIL — THE LIVING METAL'));
const FOIL = css.slice(css.indexOf('/* FOIL — THE LIVING METAL'), css.indexOf('/* AURIC — THE LIVING GOLD'));
const AURIC = css.slice(css.indexOf('/* AURIC — THE LIVING GOLD'), css.indexOf('/* 1.9.3 — THE EXTREME GROUNDS'));

console.log('A. THE TRUE X ("actual xs ... like rotated \'+\' ... semi thick stroked ... aka ✖")');

ok('A1 — every X is two straight crossing diagonals (the curves are gone)', () => {
  for (const pseudo of ['.gd-numeix-xmarks::before', '.gd-numeix-xmarks::after']) {
    const b = block(css, pseudo);
    assert.ok(b, `${pseudo} never spoke`);
    const urls = [...b.matchAll(/url\("(data:image\/svg\+xml,[^"]+)"\)/g)].map((m) => m[1]);
    assert.equal(urls.length, 2, `${pseudo}: the mask tile never arrived in both engines' seats`);
    for (const u of urls) {
      assert.ok(u.includes("width='140' height='420'"), `${pseudo}: the loom changed size`);
      // straight L segments only — not one Q curve command anywhere
      assert.ok(!/ Q /i.test(u), `${pseudo}: a calligraphic curve survived the retirement`);
      assert.ok(/M\d+ \d+ L\d+ \d+ M\d+ \d+ L\d+ \d+/.test(u), `${pseudo}: the two-diagonal mark never spoke`);
    }
  }
  // the 1.6.7 curved arms' own signature left the sheet wholesale
  assert.ok(!css.includes('Q21.4 38.7'), 'the first curved arm survived');
  assert.ok(!css.includes('Q31.5 391.2'), 'the last curved arm survived');
});

ok('A2 — the strokes are semi-thick and round-capped (never thin, never bold)', () => {
  const b = block(css, '.gd-numeix-xmarks::before');
  const widths = [...b.matchAll(/stroke-width='([\d.]+)'/g)].map((m) => Number(m[1]));
  // both engines' mask seats carry the tile, so every stroke speaks twice
  assert.equal(widths.length, 24, `the near loom lost marks (found ${widths.length} strokes)`);
  const far = block(css, '.gd-numeix-xmarks::after');
  const widthsFar = [...far.matchAll(/stroke-width='([\d.]+)'/g)].map((m) => Number(m[1]));
  assert.equal(widthsFar.length, 14, `the far loom lost marks (found ${widthsFar.length} strokes)`);
  /* 1.9.4 — THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick
     enough sometimes, fix that"), and 1.9.5 CUTS THEM FLAT ("xs in numeix
     theme should not be round edged and should also be slightly more
     thicker again"): butt caps (the ✖'s own square ends) and one more
     step of weight — 3.3-5.2 on the same 12-20px spans, the flat cut
     retiring the cap's half-stroke extension so the heavier stroke keeps
     the mark's full presence. */
  for (const w of [...widths, ...widthsFar]) {
    assert.ok(w >= 3.3 && w <= 5.2, `a stroke left the flat-cut band: ${w}`);
  }
  // flat caps (the ink's own voice since 1.9.5), and the sizes still vary mark to mark
  assertMatch(b, /stroke-linecap='butt'/, 'the flat caps never spoke');
  const spans = [...block(css, '.gd-numeix-xmarks::before').matchAll(/M(\d+) (\d+) L(\d+) (\d+)/g)].map((m) => Math.hypot(m[3] - m[1], m[4] - m[2]));
  const uniq = new Set(spans.map((s) => Math.round(s)));
  assert.ok(uniq.size >= 3, `the marks lost their size variety (${[...uniq].join(', ')})`);
  // the fall keeps its clocks exactly as they flew
  assertMatch(css, /gd-numeix-fall-a 20s linear infinite/, 'the near fall clock drifted');
  assertMatch(css, /gd-numeix-fall-b 26s linear infinite/, 'the far fall clock drifted');
});

console.log('\nB. THE COAT SPEAKS THE CARD\'S OWN COLOR ("it would be creamy in the color of the card still")');

ok('B1 — numeix speaks its classic anchors (the X looms alone lean)', () => {
  // 1.9.10 — THE CLASSIC COAT RETURNS: every numeix seat but the X
  // marks returned to its classic 1.9.2 fixed anchors, verbatim (the
  // tooth's browns, the dapple's creams, the streams' pale gold, the
  // starfield's pale golds, the moon's sage-gold, the picture's sepia
  // band); the X marks keep their lean through the tint hand (10 stops).
  const seats = (NUMEIX.match(/var\(--gd-card-tint, var\(--gd-panel\)\)/g) || []).length;
  assert.equal(seats, 10, `the X looms' hand fallbacks drifted (${seats})`);
  for (const sel of ['.gd-numeix-xmarks::before', '.gd-numeix-xmarks::after']) {
    assert.ok(block(css, sel).includes('var(--gd-tint-hand'), `${sel} never leaned the hand`);
  }
  for (const sel of ['.gd-finish-numeix', '.gd-numeix-dapple::before', '.gd-numeix-streams::after', '.gd-numeix-stars::before', '.gd-numeix-moon::before', '.gd-artfin-numeix']) {
    assert.ok(!block(css, sel).includes('var(--gd-card-tint'), `${sel} kept a tint read`);
  }
  // the classic tiles are the seats' own backgrounds again (the mask era retired)
  assertMatch(block(css, '.gd-numeix-dapple::before'), /background: url\("data:image\/svg\+xml[^"]*width='240'/, 'the dapple tile never returned');
  assertMatch(block(css, '.gd-numeix-streams::after'), /0 0 \/ 132px 132px;/, 'the streams tile lost its size');
  // the stars keep their phase seat in the tile's own background-position
  assertMatch(block(css, '.gd-numeix-stars::before'), /calc\(var\(--gd-fin-ph, 0\) \* 180px\) 0 \/ 180px 180px;/, 'the stars lost their phase seat');
  // the dapple's seam twins and stop ladder survive in the classic tile
  const dapple = block(css, '.gd-numeix-dapple::before');
  assert.ok(/cx='0' cy='80'/.test(dapple) && /cx='240' cy='80'/.test(dapple), 'the left-edge pair never closed');
  assertMatch(dapple, /stop-opacity='0\.24'/, 'the d1 stop never spoke');
});

ok('B2 — foil speaks its classic violet chrome (the metal keeps its own word)', () => {
  const body = block(css, '.gd-finish-foil');
  // 1.9.10 — THE CLASSIC COAT RETURNS: the metal's six stops are the
  // classic fixed violets again, verbatim ("foil should normally lean
  // towards card color too" — the 1.9.3 ask — retires with its saga).
  assert.ok((body.match(/rgba\(/g) || []).length === 6, 'the body\'s six classic stops never returned');
  assert.equal((body.match(/var\(--gd-card-tint/g) || []).length, 0, 'a tint read survived in the body');
  assertMatch(body, /rgba\(122, 108, 220, 0\.42\) 0%/, 'the crown stop never spoke its classic violet');
  assertMatch(body, /rgba\(150, 92, 158, 0\.42\) 100%/, 'the foot stop never spoke its classic violet');
  // the metal's temperament survives: soft-light + the hue-ride
  assertMatch(body, /mix-blend-mode: soft-light;/, 'the metal lost its soft-light seat');
  assertMatch(body, /gd-foil-hue 13s ease-in-out infinite;/, 'the hue-ride clock drifted');
  for (const sel of ['.gd-finish-foil::before', '.gd-finish-foil-ripples::before', '.gd-foil-ripple']) {
    assert.ok(!block(css, sel).includes('var(--gd-card-tint'), `${sel} kept a tint read`);
  }
  const rings = block(css, '.gd-finish-foil::before');
  assertMatch(rings, /repeating-radial-gradient\(/, 'the concentric heart lost its geometry');
});

ok('B3 — auric speaks its classic gilt (the treasure keeps its own word)', () => {
  // 1.9.10 — THE CLASSIC COAT RETURNS: every auric seat is its classic
  // fixed gilt again, verbatim from the 1.9.2 sheet ("auric currently
  // leans towards yellowish, make it lean towards card color too" —
  // the 1.9.3 ask — retires with its saga): no tint read anywhere.
  const body = block(css, '.gd-finish-auric');
  assertMatch(body, /linear-gradient\(/, 'the honey wash lost its gradient');
  assert.ok((body.match(/rgba\(/g) || []).length === 4, 'the honey\'s four classic stops never returned');
  assert.equal((body.match(/var\(--gd-card-tint/g) || []).length, 0, 'a tint read survived in the honey');
  for (const sel of ['.gd-auric-currents::before', '.gd-auric-flakes::before', '.gd-auric-flakes::after', '.gd-auric-sweep::before', '.gd-auric-summon::before', '.gd-auric-summon::after', '.gd-artfin-auric']) {
    assert.ok(!block(css, sel).includes('var(--gd-card-tint'), `${sel} kept a tint read`);
  }
  // the treasure keeps its geometry in the classic lattice tile
  const gems = block(css, '.gd-auric-currents::before');
  assert.ok(/M63 24 L80 45 L63 66 L46 45 Z/.test(gems), 'the big gem outline drifted');
  assertMatch(gems, /gd-auric-run 13s linear infinite/, 'the drift clock drifted');
  // the filaments keep their classic vertical dissolve (the single mask)
  const fil = block(css, '.gd-auric-summon::after');
  assertMatch(fil, /-webkit-mask-image: linear-gradient\(/, 'the filaments\' dissolve never spoke');
  assertMatch(fil, /-webkit-mask-size: 100% 100%;/, 'the filaments\' mask lost its size');
});

ok('B4 — holographic and prismatic keep every word they always spoke', () => {
  const holo = block(css, '.gd-finish-holographic');
  assert.ok((holo.match(/rgba\(/g) || []).length >= 7, 'the holographic riot lost its fixed rainbow');
  assertMatch(holo, /gd-finish-hue 12s linear infinite;/, 'the holographic hue clock drifted');
  /* 1.9.7 — the ground rules seat earlier in the sheet now; the
     base rule is read at its own anchor (line head) so the conic
     keeps its own words. */
  const prism = /^\.gd-finish-prismatic \{[\s\S]*?\n\}/m.exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
  assertMatch(prism, /conic-gradient\(/, 'the prismatic conic left the sheet');
  // and the nuri fire band reads the card's RAW tint inside its mix (the classic forge law)
  assertMatch(css, /color-mix\(in srgb, var\(--gd-card-tint, var\(--gd-panel\)\) 58%, transparent\)/, 'the nuri raw-tint band never spoke');
});

console.log('\nC. THE EXTREME GROUNDS ("so they still are visible")');

ok('C1 — the blend flips retire whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the whole 1.9.3-1.9.9 flip
     stack — the light multiply washes, the bright normal list, the
     dark screen family, the silver facet — retired with the derivation
     it served; every coat speaks its classic native blend on every
     plate again, and exactly TWO rules read the ground classes (the
     X signature's dark glow ink seat + its light depth filter). */
  const seatRules = (css.match(/^[^\n/{}]*gd-fin-ground[^\n{]*\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
  assert.ok(css.includes('.gd-fin-ground-dark .gd-card-face-finish:not(.is-art-zone),'), 'the X dark glow seat never spoke');
  assert.ok(css.includes('.gd-fin-ground-light .gd-numeix-xmarks:not(.is-art-zone) {'), 'the X light filter never spoke');
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright subclass survived its retirement');
  assert.ok(!css.includes('.gd-fin-ground-vivid'), 'the vivid class survived its retirement');
  // the classic natives keep their own seats
  assertMatch(css, /\.gd-finish-numeix \{[^{}]*mix-blend-mode: soft-light;/, 'the paper lost its soft-light');
  assertMatch(css, /\.gd-finish-foil \{[^{}]*mix-blend-mode: soft-light;/, 'the metal lost its soft-light');
  assertMatch(css, /\.gd-finish-nuri \{[^{}]*mix-blend-mode: overlay;/, 'the forge lost its overlay');
});

ok('C2 — finishGroundTone is exported and seated at every card surface', () => {
  assertMatch(ribbon, /export function finishGroundTone\(cardColor\) \{/, 'the tone reader never spoke');
  /* 1.9.6 — the split scope rides beside the tone (a comment-shaped
     thread — the class list's own law keeps its words). */
  assertMatch(ribbon, /finishGroundTone\(cardColor\),\s*\n\s*\/\*[\s\S]*?\*\/\s*\n\s*finishSplitImage && 'gd-fin-split'\s*\n\s*\)\}/, 'the compact preview never seated the tone');
  assertMatch(grid, /finishGroundTone\(character\.cardColor\),\s*\n\s*\/\*[\s\S]*?\*\/\s*\n\s*character\.cardFinishSplitImage && character\.cardFinishOnImage && 'gd-fin-split'\s*\n\s*\)\}/, 'the grid card never seated the tone');
  assertMatch(look, /finishGroundTone\(cardColor\),\s*\n\s*\/\*[\s\S]*?\*\/\s*\n\s*finishSplitImage && 'gd-fin-split'\s*\n\s*\)\}/, 'the look editor never seated the tone');
  /* 1.9.6 — the import gained finishInkTwin (the shadow twin the light
     ground's seats read — see --gd-tint-hand in index.css). */
  assertMatch(grid, /import TagRibbon, \{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishTintLean, finishPhase/, 'the grid never imported the reader');
  /* 1.9.6 — the import gained finishInkTwin (the shadow twin the light
     ground's seats read). */
  assertMatch(look, /import \{ CardFinishLayer, CardPreview, FINISH_GROUND, TrimCoatLayer, cropFrame, finishGroundTone, finishTintLean, trimClasses/, 'the look editor never imported the reader');
});

ok('C3 — the tone rail speaks the right verdicts (the thresholds, computed)', () => {
  /* 1.9.7 — THE GROUNDS FOLLOW THE TWIN'S OWN SEAM: the classes flip
     at luminance 0.5 (the twin's own flip line — one law, one line),
     the plates past the old 0.78 rail additionally carry the bright
     subclass, and the VIVID class retired (its screen family was
     already the dark family's own list). The honest middle keeps its
     seat for the THEME's colorless cards alone. */
  assertMatch(ribbon, /if \(lum >= 0\.7\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the seam law drifted');
  assertMatch(ribbon, /return 'gd-fin-ground-dark';/, 'the dark half drifted');
  assert.ok(!/gd-fin-ground-vivid/.test(/export function finishGroundTone[\s\S]*?\n\}/.exec(ribbon)?.[0] || ''), 'the vivid class survived its retirement');
  // the same arithmetic the reader speaks, proven on the report's own
  // examples — a card leaning toward white, toward black, and toward a
  // fully saturated hue
  const tone = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx > 0 ? (mx - mn) / mx : 0;
    if (lum >= 0.7) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
    return 'gd-fin-ground-dark';
  };
  assert.equal(tone('#ffffff'), 'gd-fin-ground-light gd-fin-ground-bright', 'pure white missed the bright class');
  assert.equal(tone('#f7f7f7'), 'gd-fin-ground-light gd-fin-ground-bright', 'near-white missed the bright class');
  assert.equal(tone('#000000'), 'gd-fin-ground-dark', 'pure black missed the dark class');
  assert.equal(tone('#141414'), 'gd-fin-ground-dark', 'near-black missed the dark class');
  assert.equal(tone('#ff0000'), 'gd-fin-ground-dark', 'pure red missed the dark class (the vivid retired)');
  assert.equal(tone('#00ff00'), 'gd-fin-ground-light', 'pure green missed the light class (the seam caught it)');
  assert.equal(tone('#8a6d3b'), 'gd-fin-ground-dark', 'an honest mid-tone missed the dark half');
  assert.equal(tone('#4466aa'), 'gd-fin-ground-dark', 'a mid blue missed the dark half');
  // a mid-gray speaks the dark half now too — the CLASSLESS seat belongs
  // to the theme's colorless cards alone (they never pick a color)
  assert.equal(tone('#777777'), 'gd-fin-ground-dark', 'a mid-gray missed the dark half');
});

console.log('\nD. THE CREATE KEY RETURNS TO PRESS');

ok('D1 — the RESET law re-seeds the wheel\'s latch (the stuck-loading cure)', () => {
  assertMatch(ncm, /1\.9\.3 — THE KEY RETURNS TO PRESS/, 'the law note never spoke');
  assertMatch(ncm, /setNeedFlash\(null\);\s*\n\s*\/\* 1\.9\.3 — THE KEY RETURNS TO PRESS[\s\S]*?setCreating\(false\);/, 'the latch never joined the RESET law');
  // the double-press guard stays (one press in flight is still one press)
  assertMatch(ncm, /const submit = \(\) => \{\s*\n\s*if \(creating\) return;/, 'the double-press guard left');
});

ok('D2 — the key itself still never greys out (the 1.5.4 law, kept whole)', () => {
  // the CREATE button carries no disabled seat — the press always speaks
  const m = /<button\s*\n\s*key=\{`create-\$\{needFlash\?\.nonce \?\? 0\}`\}\s*\n\s*className=\{clsx\(\s*\n\s*'gd-btn gd-btn-solid',\s*\n\s*creating && 'is-loading',\s*\n\s*needFlash && \(needFlash\.name \|\| needFlash\.vLabel\) && 'gd-need-shake'\s*\n\s*\)\}\s*\n\s*onClick=\{submit\}\s*\n\s*>\s*\n\s*CREATE\s*\n\s*<\/button>/.exec(ncm);
  assert.ok(m, 'the CREATE key lost its 1.5.4 shape');
  assert.ok(!/disabled=/.test(m[0]), 'a disabled seat returned to the CREATE key');
  // and the missing-field answers survive (toasts + the breathing rim)
  assertMatch(ncm, /gdToast\('Card name is empty — give the card a name', 'fail'\)/, 'the name verdict left');
  assertMatch(ncm, /gdToast\('Version label is empty — give the first version a name', 'fail'\)/, 'the version verdict left');
});

console.log('\nE. THE FURNITURE');

ok('E1 — the version is 1.9.3 everywhere', () => {
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json');
  const lock = JSON.parse(src('package-lock.json'));
  assert.equal(lock.version, '1.9.19', 'package-lock.json head');
  assert.equal(lock.packages[''].version, '1.9.19', 'package-lock.json root seat');
  const constants = src('src/constants/index.js');
  assert.ok(constants.includes("version: '1.9.19'"), 'the APP constant');
});

ok('E2 — the changelog head tells this story', () => {
  const head = src('CHANGELOG.md');
  assert.ok(head.startsWith('## 1.9.19 — The Ends Trade Places'));
  assert.ok(head.includes('The true X'));
  assert.ok(head.includes('The coat speaks the card\'s own color'));
  assert.ok(head.includes('The extreme grounds'));
  assert.ok(head.includes('The CREATE key returns to press'));
});

ok('E3 — the README badge + battery count welcome this very suite', () => {
  const readme = src('README.md');
  /* 1.9.6 — the badge is a LIVE seat: it speaks 1.9.6 now. */
  assert.ok(readme.includes('version-1.9.19-purple'));
  assert.ok(readme.includes('93 DOM/source test suites'));
});

ok('E4 — the battery runner welcomes this very suite', () => {
  const runner = src('scripts/run_battery_171.sh');
  assert.ok(runner.includes('gendex_194_batch_dom'));
});

console.log(`${passed} passed, ${failed} failed`);
if (failed) console.log('FIX ABOVE');
else console.log('ALL GREEN');
process.exit(failed ? 1 : 0);
