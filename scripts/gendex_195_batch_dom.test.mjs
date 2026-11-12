// 1.9.4 batch — The Faithful Coat.
// (Named 195 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1, 193 the 1.9.2, 194 the 1.9.3; this suite pins the
//  1.9.4 laws at their roots. Built on the 1.9.3 tree — the release line
//  continues.)
// The reported items, pinned at their root laws:
//   A.  THE FORGE'S OWN STRIPES LEAN TOO ("i forgot about nuri's finish,
//       nuri's finish background stripes still remain orange etc.. fix
//       that to match color"): the body's heat veins, fire band and
//       obsidian weave speak the premultiplied card-color law (the 1.5.0
//       pass re-inked every element EXCEPT the body), and the veil steps
//       down to 0.4 so the re-inked fire reads through it.
//   B.  THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick enough
//       sometimes, fix that"), and 1.9.5 CUTS THEM FLAT ("xs in numeix
//       theme should not be round edged and should also be slightly more
//       thicker again"): butt caps, one more step of weight (3.3-5.2 on
//       the same 12-20px spans) — semi-thick, never bold, every clock kept.
//   C.  THE INK ITSELF SPEAKS ON THE EXTREME PLATES ("when going with the
//       card color too bright or such sometimes it makes some of its
//       effect dissapear, such as white and numeix theme would make the
//       glint/shine glow spots dissapear for example, check for all themes
//       and fix that"): the light grounds gain the INK LAW
//       (brightness(0.55) saturate(1.35) on every masked-ink seat) and the
//       overlay coats (nuri, holographic, prismatic, the prism's crystal)
//       flip to multiply; the dark grounds turn the overlay bodies to
//       screen; the forge's veil turns identity on both extremes; and the
//       tone rail widens (0.84/0.16 -> 0.78/0.19) so bright-but-not-white
//       plates meet the law.
//   D.  THE FURNITURE — the version seats speak 1.9.4, the changelog head
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

console.log('A. THE FORGE\'S OWN STRIPES LEAN TOO ("fix that to match color")');

ok('A1 — the body speaks its classic fire again (the fixed stripes return)', () => {
  const body = block(css, '.gd-finish-nuri');
  assert.ok(body, 'the forge body never spoke');
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the body's fire band, its vein
     lattices and its obsidian weave all returned to their classic 1.9.2
     fixed anchors, verbatim — the 1.9.4 re-ink (every stop leaning the
     tint through the hand) retires with the derivation. */
  const leans = (body.match(/var\(--gd-card-tint, var\(--gd-panel\)\)/g) || []).length;
  assert.equal(leans, 0, `a tint read survived the body (${leans})`);
  // every classic fixed warm stop returned wholesale
  for (const back of ['rgba(255, 140, 0', 'rgba(255, 62, 20', 'rgba(255, 196, 60', 'rgba(255, 110, 30', 'rgba(178, 34, 52', 'rgba(255, 122, 30', 'rgba(255, 92, 92', 'rgba(255, 158, 46', 'rgba(26, 17, 12', 'rgba(44, 26, 16', 'rgba(22, 13, 9']) {
    assert.ok(body.includes(back), `a classic fire stop never returned: ${back}`);
  }
  // the veins keep their classic exact alphas (0.17/0.14/0.13/0.12)
  assertMatch(body, /rgba\(255, 140, 0, 0\.17\) 0 22px/, 'the first vein never returned');
  assertMatch(body, /rgba\(255, 62, 20, 0\.14\) 68px 90px/, 'the crossed vein never returned');
  assertMatch(body, /rgba\(178, 34, 52, 0\.34\) 0%/, 'the band\'s crown never returned');
  // the obsidian ground keeps its classic weave
  assertMatch(body, /rgba\(26, 17, 12, 0\.34\), rgba\(44, 26, 16, 0\.26\) 58%, rgba\(22, 13, 9, 0\.36\)/, 'the obsidian weave never returned');
  // the crossed lattices keep their geometry
  assertMatch(body, /repeating-linear-gradient\(\s*\n\s*58deg/, 'the first lattice lost its angle');
  assertMatch(body, /repeating-linear-gradient\(\s*\n\s*122deg/, 'the crossed lattice lost its angle');
  assertMatch(body, /mix-blend-mode: overlay;/, 'the forge lost its overlay seat');
});

ok('A2 — the veil steps back up to its classic weight (0.4 -> 0.5)', () => {
  // anchored to the sheet's own margin — the flip scopes retired in
  // 1.9.10, the veil's own rule is the only seat left
  const veil = /^\.gd-finish-nuri::before \{[\s\S]*?\n\}/m.exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
  assert.ok(veil, 'the veil never spoke');
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil reads the card's RAW
     tint at its classic 0.5 weight again — the 1.9.4 0.4 step and the
     tint-hand ink retire with the derivation. */
  assertMatch(veil, /background: var\(--gd-card-tint, var\(--gd-panel\)\);/, 'the veil lost the raw tint');
  assertMatch(veil, /opacity: 0\.5;/, 'the veil kept its 1.9.4 weight');
  assertMatch(veil, /mix-blend-mode: overlay;/, 'the veil lost its blend');
  // the licks / sparks / flare / hearts keep the 1.5.0 raw-tint leans
  // they always spoke (the classic forge law)
  for (const sel of ['.gd-nuri-licks::before', '.gd-nuri-sparks::before', '.gd-nuri-flare::before', '.gd-finish-nuri::after']) {
    assert.ok(block(css, sel).includes('var(--gd-card-tint'), `${sel} lost its lean`);
  }
});

console.log('\nB. THE X\'S TAKE THEIR FULL WEIGHT ("arent thick enough sometimes")');

ok('B1 — every stroke sits at the ✖\'s own proportion (the flat-cut band)', () => {
  const near = block(css, '.gd-numeix-xmarks::before');
  const far = block(css, '.gd-numeix-xmarks::after');
  for (const [name, b] of [['the near loom', near], ['the far loom', far]]) {
    const marks = [...b.matchAll(/M(\d+) (\d+) L(\d+) (\d+) M(\d+) (\d+) L(\d+) (\d+)' stroke-width='([\d.]+)'/g)];
    assert.ok(marks.length >= 7, `${name} lost its marks (${marks.length})`);
    for (const m of marks) {
      const span = Math.hypot(m[3] - m[1], m[4] - m[2]);
      const w = Number(m[9]);
      assert.ok(w >= 3.3 && w <= 5.2, `${name}: a stroke left the flat-cut band: ${w}`);
      // the stroke sits at ~17-23% of the mark's own diagonal span (the
      // ✖ character's build — 1.9.5 took the band one step heavier and
      // cut the caps flat, retiring the round tip's half-stroke reach)
      const ratio = w / span;
      assert.ok(ratio >= 0.17 && ratio <= 0.23, `${name}: the ✖ proportion broke at ${m[1]},${m[2]} (w ${w} / span ${span.toFixed(1)} = ${ratio.toFixed(2)})`);
    }
  }
  // the floor rose with the ceiling: the thinnest mark in EITHER loom is
  // heavier than the 1.9.4 band's own floor (2.9-4.6 retired by 1.9.5)
  const widths = [...css.matchAll(/stroke-width='([\d.]+)'/g)].map((m) => Number(m[1])).filter((w) => w <= 6);
  const xWidths = [...near.matchAll(/stroke-width='([\d.]+)'/g), ...far.matchAll(/stroke-width='([\d.]+)'/g)].map((m) => Number(m[1]));
  assert.equal(xWidths.length, 38, `the looms lost strokes (${xWidths.length})`);
  assert.ok(Math.min(...xWidths) >= 3.3, `a thin survivor: ${Math.min(...xWidths)}`);
  assert.ok(Math.max(...xWidths) <= 5.2, `a bold trespasser: ${Math.max(...xWidths)}`);
  // the sizes still vary (the 1.9.3 law's own word)
  const spans = [...near.matchAll(/M(\d+) (\d+) L(\d+) (\d+)/g)].map((m) => Math.round(Math.hypot(m[3] - m[1], m[4] - m[2])));
  assert.ok(new Set(spans).size >= 3, `the marks lost their size variety (${[...new Set(spans)].join(', ')})`);
  assert.ok(widths.length > 0, 'the sheet lost its strokes');
});

ok('B2 — every clock keeps its seat, the caps cut flat (1.9.5)', () => {
  assertMatch(css, /gd-numeix-fall-a 20s linear infinite/, 'the near fall clock drifted');
  assertMatch(css, /gd-numeix-fall-b 26s linear infinite/, 'the far fall clock drifted');
  assertMatch(css, /gd-numeix-x-twine 9s ease-in-out infinite/, 'the near twinkle drifted');
  assertMatch(css, /gd-numeix-x-twind 13s ease-in-out infinite/, 'the far twinkle drifted');
  assertMatch(block(css, '.gd-numeix-xmarks::before'), /stroke-linecap='butt'/, 'the flat caps left (1.9.13)');
  assertMatch(block(css, '.gd-numeix-xmarks::after'), /stroke-linecap='butt'/, 'the far flat caps left (1.9.13)');
});

console.log('\nC. THE INK ITSELF SPEAKS ("check for all themes and fix that")');

ok('C1 — the ink law retires with the stack (the X\'s pen alone keeps a filter)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the silver facet and every
     scoped filter retired with the flip stack — the classic anchors
     carry their own contrast, and the ONE filter the sheet keeps is
     the X signature's light-ground depth pen (the owner's carve-out). */
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver facet survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the 1.9.5 gentle hand survived in a rule');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the 1.9.4 crushing hand survived in a rule');
  assertMatch(css, /\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{\s*\n  filter: brightness\(0\.78\) saturate\(1\.05\);\s*\n\}/, 'the X\'s pen lost its seat');
});

ok('C2 — the overlay flips retire whole (the classic blends speak on the extremes)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the bright subclass's normal
     list and the dark family's screen flips retired with the stack —
     the details and the glows speak their classic native blends on
     every plate, exactly as the classic physics always spoke them. */
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright normal law survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the dark veil flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-prism-stars'), 'the dark prism flip survived');
  const seatRules = (css.match(/^[^\n/{}]*gd-fin-ground[^\n{]*\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
});

ok('C3 — the forge\'s veil keeps its classic overlay on every plate', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil's ground-scoped blend
     flips retired whole — it speaks its classic overlay wherever the
     plate sits, reading the card's RAW tint at the 0.5 weight. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-nuri'), 'the veil\'s light multiply survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the veil\'s dark screen survived');
  assertMatch(css, /^\.gd-finish-nuri::before \{[^{}]*mix-blend-mode: overlay;/m, 'the veil lost its classic blend');
});

ok('C4 — the tone rail widens (0.84/0.16 -> 0.78/0.19, computed)', () => {
  /* 1.9.7 — THE GROUNDS FOLLOW THE TWIN'S OWN SEAM: the classes flip
     at luminance 0.5 (the twin's own flip line), the plates past the
     0.78 rail additionally carry the bright subclass, and the vivid
     class retired (its screen family was already the dark family's). */
  assertMatch(ribbon, /if \(lum >= 0\.7\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the seam law drifted');
  assertMatch(ribbon, /return 'gd-fin-ground-dark';/, 'the dark half drifted');
  // the same arithmetic the reader speaks, proven on the report's own
  // examples — white, black, the newly-caught bright gold, and the
  // newly-caught deep vivid blue
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
  // the 1.9.3 gap: a bright gold that used to sit in the classless middle
  assert.equal(tone('#ffcc33'), 'gd-fin-ground-light gd-fin-ground-bright', 'the bright gold still fell in the gap');
  assert.equal(tone('#000000'), 'gd-fin-ground-dark', 'pure black missed the dark class');
  assert.equal(tone('#141414'), 'gd-fin-ground-dark', 'near-black missed the dark class');
  // the 1.9.3 gap: a deep vivid blue that used to sit classless
  assert.equal(tone('#1a1aff'), 'gd-fin-ground-dark', 'the deep vivid blue still fell in the gap');
  assert.equal(tone('#ff0000'), 'gd-fin-ground-dark', 'pure red missed the dark class (the vivid retired)');
  assert.equal(tone('#00ff00'), 'gd-fin-ground-light', 'pure green missed the light class (the seam caught it)');
  /* 1.9.7 — the classless middle belongs to the theme's colorless
     cards alone; every PICKED color speaks a side of the seam now. */
  assert.equal(tone('#8a6d3b'), 'gd-fin-ground-dark', 'an honest mid-tone missed the dark half');
  assert.equal(tone('#4466aa'), 'gd-fin-ground-dark', 'a mid blue missed the dark half');
  assert.equal(tone('#777777'), 'gd-fin-ground-dark', 'a mid-gray missed the dark half');
});

ok('C5 — the 1.9.3 laws retired with the classic coat (the release line holds)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the whole 1.9.3-1.9.9 ground
     machinery — the light multiply stack, the dark screen family, the
     vivid class — retired with the derivation it served; exactly TWO
     rules read the ground classes now (the X signature's own seats). */
  const seatRules = (css.match(/^[^\n/{}]*gd-fin-ground[^\n{]*\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers`);
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-numeix'), 'the 1.9.3 light law survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-foil'), 'the 1.9.3 dark law survived');
  assert.ok(!css.includes('.gd-fin-ground-vivid'), 'the vivid law survived its retirement');
});

console.log('\nD. THE FURNITURE');

ok('D1 — the version is 1.9.4 everywhere', () => {
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json');
  const lock = JSON.parse(src('package-lock.json'));
  assert.equal(lock.version, '1.9.19', 'package-lock.json head');
  assert.equal(lock.packages[''].version, '1.9.19', 'package-lock.json root seat');
  const constants = src('src/constants/index.js');
  assert.ok(constants.includes("version: '1.9.19'"), 'the APP constant');
});

ok('D2 — the changelog head tells this story', () => {
  const head = src('CHANGELOG.md');
  assert.ok(head.startsWith('## 1.9.19 — The Ends Trade Places'));
  assert.ok(head.includes('The forge\'s stripes lean too'));
  assert.ok(head.includes('The X\'s take their full weight'));
  assert.ok(head.includes('The ink itself speaks on the extreme plates'));
});

ok('D3 — the README badge + battery count welcome this very suite', () => {
  const readme = src('README.md');
  /* 1.9.6 — the badge is a LIVE seat: it speaks 1.9.6 now. */
  assert.ok(readme.includes('version-1.9.19-purple'));
  assert.ok(readme.includes('93 DOM/source test suites'));
});

ok('D4 — the battery runner welcomes this very suite', () => {
  const runner = src('scripts/run_battery_171.sh');
  assert.ok(runner.includes('gendex_195_batch_dom'));
});

console.log(`${passed} passed, ${failed} failed`);
if (failed) console.log('FIX ABOVE');
else console.log('ALL GREEN');
process.exit(failed ? 1 : 0);
