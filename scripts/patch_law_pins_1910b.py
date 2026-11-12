#!/usr/bin/env python3
"""1.9.10 — THE CLASSIC COAT RETURNS (law-pin healing, part 2).

Heals 196 / 197 / 198 / 199 / 200 (the flip-stack era suites), restores
the corner audit's ladder banners (the interim pass's PLATES rebuild
dropped the named markers the 200 suite pins), and re-seats the 1910
suite's classic reference on the tree's own fixture (the battery must
run on any machine — the 192 tree is a sandbox-only artifact).

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def swap(path, title, new_block):
    p = ROOT / 'scripts' / path
    raw = p.read_text(encoding='utf8')
    pats = [
        re.compile(r"(?ms)^ok\('" + re.escape(title) + r"'(?::[^']*)?, \(\) => \{.*?\n\}\);\n"),
        re.compile(r'(?ms)^ok\("' + re.escape(title) + r'"(?::[^"]*)?, \(\) => \{.*?\n\}\);\n'),
    ]
    hits = []
    for pat in pats:
        hits += pat.findall(raw)
    if not hits:
        first_line = new_block.split('\n', 1)[0]
        if first_line in raw:
            print(f'  already seated {path}: {title[:60]}')
            return
    assert len(hits) == 1, f'{path}: {title!r} matched {len(hits)} blocks'
    raw = raw.replace(hits[0], new_block.rstrip('\n') + '\n', 1)
    p.write_text(raw, encoding='utf8')
    print(f'  healed {path}: {title[:60]}')


# ---------------------------------------------------------------------------
# 196 — the flip-stack era: the whole stack retired
# ---------------------------------------------------------------------------
swap('gendex_196_batch_dom.test.mjs', 'A1 — the broad bodies retired from the light multiply stack', '''ok('A1 — the flip stack retired whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the whole 1.9.3-1.9.9 ground
     machinery — the light multiply washes, the bright subclass's normal
     list, the silver facet, the dark screen family — retired with the
     derivation it served; every coat speaks its classic native blend on
     every plate again, and exactly TWO rules read the ground classes
     (the X signature's dark glow ink seat + its light depth filter). */
  const seatRules = (css.match(/^[^\\n/{}]*gd-fin-ground[^\\n{]*\\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright subclass survived its retirement');
  // the bodies keep their NATIVE BASE seats (the classic physics)
  assertMatch(css, /\\.gd-finish-numeix \\{[^{}]*mix-blend-mode: soft-light;/, 'the paper lost its native soft-light');
  assertMatch(css, /\\.gd-finish-auric \\{[^{}]*mix-blend-mode: soft-light;/, 'the honey lost its native soft-light');
  assertMatch(css, /\\.gd-finish-foil \\{[^{}]*mix-blend-mode: soft-light;/, 'the metal lost its native soft-light tint');
  assertMatch(css, /\\.gd-finish-nuri \\{[^{}]*mix-blend-mode: overlay;/, 'the forge lost its native overlay');
});
''')

swap('gendex_196_batch_dom.test.mjs', 'A2 — the white-ink seats alone keep the silver facet (0.55/1.18)', '''ok('A2 — the silver facet retired with the stack (the X\\'s pen is the one filter left)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the white-ink seats' facet
     retired with the flip stack — the classic anchors carry their own
     contrast, and the ONE filter the sheet keeps is the X signature's
     light-ground depth pen (the owner's carve-out). */
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver facet survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the gentle filter survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the crushing filter survived somewhere');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-xmarks:not\\(\\.is-art-zone\\) \\{\\s*\\n  filter: brightness\\(0\\.78\\) saturate\\(1\\.05\\);\\s*\\n\\}/, 'the X\\'s pen lost its seat');
});
''')

swap('gendex_196_batch_dom.test.mjs', "A3 — the forge\\'s veil keeps its overlay seat on light (the flip retired)", '''ok('A3 — the forge\\'s veil keeps its classic seat (the flips retired)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil's ground-scoped blend
     flips retired whole — it speaks its classic overlay on every plate,
     reading the card's RAW tint at the 0.5 weight. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-nuri'), 'the veil\\'s light flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the veil\\'s dark flip survived');
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0]?.replace(/:not\\(\\.is-art-zone\\)/g, '').replace(/\\.gd-card-face-finish /g, '') ?? '';
  assert.ok(veil, 'the veil never spoke');
  assertMatch(veil, /background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the veil lost the raw tint');
  assertMatch(veil, /opacity: 0\\.5;/, 'the veil kept its old weight');
  assertMatch(veil, /mix-blend-mode: overlay;/, 'the veil lost its blend');
});
''')

swap('gendex_196_batch_dom.test.mjs', 'A4 — the hue-riding bodies keep the light multiply (the pastel riot)', '''ok('A4 — the rainbow bodies speak their classic word on every plate', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the rainbow bodies' normal-seat
     flip and the dark screen family retired with the stack — the riot
     and the prism speak their classic overlay wherever the card sits. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-holographic'), 'the rainbow light flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-holographic'), 'the rainbow dark flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-prism-stars'), 'the prism dark flip survived');
  assertMatch(css, /\\.gd-finish-holographic \\{[^{}]*mix-blend-mode: overlay;/, 'the riot lost its native overlay');
  assertMatch(css, /\\.gd-finish-prismatic \\{[^{}]*mix-blend-mode: overlay;/, 'the prism lost its native overlay');
});
''')

# ---------------------------------------------------------------------------
# 197 — the certain-ink era: the hand speaks for the X alone
# ---------------------------------------------------------------------------
swap('gendex_197_batch_dom.test.mjs', 'A3 — every tint-leaning stop reads the hand (1.9.9: the artfins join it)', '''ok('A3 — the hand speaks for the X signature alone (the classic coat returns)', () => {
  const handed = (css.match(/var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\)/g) || []).length;
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the hand's readers are the X
     looms ALONE (10 lean stops); every other coat seat speaks its
     classic fixed anchors, verbatim from the 1.9.2 sheet — the artfins
     and the veil returned to their classic words with it. */
  assert.equal(handed, 10, `the X looms' hand reads drifted (${handed})`);
  for (const fin of ['numeix', 'auric']) {
    const art = block(css, `.gd-artfin-${fin}`);
    assert.ok(!art.includes('var(--gd-tint-hand'), `the artfin-${fin} kept a hand read`);
  }
  // the artfins speak their classic anchors (the sepia band, the honey)
  assertMatch(block(css, '.gd-artfin-numeix'), /rgba\\(238, 226, 186, 0\\.56\\) 0%/, 'the artfin-numeix lost its classic band');
  assertMatch(block(css, '.gd-artfin-auric'), /rgba\\(255, 224, 140, 0\\.36\\) 0%/, 'the artfin-auric lost its classic honey');
  // the veil reads the card's RAW tint again (the classic forge law)
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0]?.replace(/:not\\(\\.is-art-zone\\)/g, '').replace(/\\.gd-card-face-finish /g, '') ?? '';
  assertMatch(veil, /background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the veil never read the raw tint');
});
''')

swap('gendex_197_batch_dom.test.mjs', 'A4 — the light law splits at the bright rail (1.9.7: washes + glows below, normal above)', '''ok('A4 — the light law retired whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the mid-bright multiply washes,
     the rainbow normal seat and the bright subclass's one normal list
     retired with the derivation — every coat speaks its classic native
     blend wherever the plate sits. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-numeix'), 'the light wash law survived');
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-holographic'), 'the rainbow normal seat survived');
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright subclass survived');
  // the twin is written on every card surface that can class a ground
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishTintLean\\(/, 'a surface lost the lean write');
  }
});
''')

swap('gendex_197_batch_dom.test.mjs', 'A5 — the silver facet (the white-ink seats alone keep a filter, bright-scoped)', '''ok('A5 — the silver facet retired (the X\\'s pen is the one filter left)', () => {
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver facet survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the 1.9.5 gentle hand survived in a rule');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the 1.9.4 crushing hand survived in a rule');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-xmarks:not\\(\\.is-art-zone\\) \\{\\s*\\n  filter: brightness\\(0\\.78\\) saturate\\(1\\.05\\);\\s*\\n\\}/, 'the X\\'s pen lost its seat');
});
''')

swap('gendex_197_batch_dom.test.mjs', 'A6 — the veil joins the stacks (1.9.7: light multiply, dark screen; the vivid class retires)', '''ok('A6 — the veil\\'s stack seats retired (the classic overlay everywhere)', () => {
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-nuri'), 'the veil\\'s light multiply survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the veil\\'s dark screen survived');
  assert.ok(!css.includes('.gd-fin-ground-vivid'), 'the vivid class survived its retirement');
  assert.ok(!/return 'gd-fin-ground-vivid'/.test(ribbon), 'finishGroundTone still speaks the vivid class');
});
''')

swap('gendex_197_batch_dom.test.mjs', "A7 — the bloom\\'s own hand (the dapple\\'s scoped lift, knob rails exact)", '''ok("A7 — the bloom's lift retired (the dapple speaks its classic voice)", () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the dapple's scoped opacity
     lifts retired with the flip stack — the sunlight speaks its classic
     screen blend at its classic voice on every plate. */
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!cssLaws.includes('opacity: min(1, calc(var(--gd-fin-strength, 1) * 1.6))'), 'the 1.6 lift survived somewhere');
  assert.ok(!/gd-fin-ground(?:-light|-dark)? \\.gd-numeix-dapple/.test(cssLaws), 'the dapple lift selector survived');
  assertMatch(css, /\\.gd-numeix-dapple \\{[^{}]*mix-blend-mode: screen;/, 'the dapple lost its native screen');
});
''')

# ---------------------------------------------------------------------------
# 198 — the quiet-seam era: the same retirement
# ---------------------------------------------------------------------------
swap('gendex_198_batch_dom.test.mjs', 'A4 — the light law splits at the bright rail (washes + glows below, normal above)', '''ok('A4 — the light law retired whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the mid-bright washes, the
     rainbow normal seat and the bright normal list retired with the
     derivation — the classic native blends speak on every plate. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-numeix'), 'the mid-bright wash law survived');
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-holographic'), 'the rainbow normal seat survived');
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright normal law survived');
  const seatRules = (css.match(/^[^\\n/{}]*gd-fin-ground[^\\n{]*\\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers`);
});
''')

swap('gendex_198_batch_dom.test.mjs', 'A5 — the facet rides the bright subclass alone (a fixed gray owns its contrast only past 0.78)', '''ok('A5 — the facet retired with the bright subclass (no gray hand anywhere)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the facet and the subclass it
     rode retired with the flip stack — the X signature's depth pen is
     the one filter the sheet keeps. */
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver-facet law survived somewhere');
  assert.ok(!/\\.gd-fin-ground-light \\.gd-prism-stars,/.test(css), 'the facet leaked into the mid-bright half');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-xmarks:not\\(\\.is-art-zone\\) \\{\\s*\\n  filter: brightness\\(0\\.78\\) saturate\\(1\\.05\\);\\s*\\n\\}/, 'the X\\'s pen lost its seat');
});
''')

swap('gendex_198_batch_dom.test.mjs', "A6 — the dark family speaks screen (and the metal\\'s heart joined it)", '''ok('A6 — the dark family\\'s flips retired (the classic blends speak in the dark)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the dark screen family retired
     with the flip stack — every seat speaks its classic native blend
     on the dark plates too, exactly as the classic physics spoke them. */
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!/gd-fin-ground-dark [^\\n{]*\\{[^{}]*mix-blend-mode: screen/.test(cssLaws), 'a dark screen flip survived');
  assertMatch(css, /\\.gd-finish-foil \\{[^{}]*mix-blend-mode: soft-light;/, 'the metal\\'s heart lost its soft-light');
});
''')

# ---------------------------------------------------------------------------
# 199 — the flip-scoping era: the two kept readers carry their own scopes
# ---------------------------------------------------------------------------
swap('gendex_199_batch_dom.test.mjs', 'C3 — every ground-class flip scopes away from the art twin', '''ok('C3 — the two kept readers carry their own scopes (the flip rules retired)', () => {
  // no ground-rule selector line may speak without the scope
  const badLines = css.split('\\n').filter((l) => /^\\.gd-fin-ground/.test(l) && !l.includes(':not(.is-art-zone)'));
  assert.deepEqual(badLines, [], `ground rules without the art-zone scope: ${badLines.slice(0, 3).join(' | ')}`);
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the flip rules retired whole —
     the two readers that remain are the X signature's own seats (the
     dark glow ink hand + the light depth pen), both scoped away from
     the art twin; the bright child-seat law retired with the bright
     subclass itself. */
  assert.ok(!css.includes('.gd-fin-ground-bright .gd-card-face-finish:not(.is-art-zone) .gd-foil-ripple'), 'a bright child-seat law survived');
});
''')

swap('gendex_199_batch_dom.test.mjs', 'C4 — the flips themselves keep their words (scoped, not silenced)', '''ok('C4 — the kept readers keep their words (scoped, not silenced)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the flip stack retired, and the
     two readers that stay speak their whole words — the dark ground's
     GLOW ink seat for the X, and the light ground's depth pen. */
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-card-face-finish:not\\(\\.is-art-zone\\),\\s*\\n\\.gd-fin-ground-dark \\.gd-card-face-artfin:not\\(\\.is-art-zone\\) \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-glow, var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\)\\);\\s*\\n\\}/, 'the dark glow hand lost its seat');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-xmarks:not\\(\\.is-art-zone\\) \\{\\s*\\n  filter: brightness\\(0\\.78\\) saturate\\(1\\.05\\);\\s*\\n\\}/, 'the X\\'s pen lost its seat');
  // the lifts retired with the stack
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!/gd-fin-ground(?:-light|-dark)? \\.gd-numeix-dapple/.test(cssLaws), 'the bloom lift survived');
});
''')

# ---------------------------------------------------------------------------
# 200 — the faithful-lean era: the artfins and the lifts
# ---------------------------------------------------------------------------
swap('gendex_200_batch_dom.test.mjs', 'B5 — the artfins join the hand (the picture leans by hue and saturation too)', '''ok('B5 — the artfins speak their classic anchors (the picture-wash law returns)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the picture-washes are their
     classic 1.9.2 anchors again, verbatim — the hand-lean retired with
     the derivation (nuri's fire band keeps its RAW tint mix, the 1.5.0
     forge law the owner called stable). */
  assertMatch(block(css, '.gd-artfin-numeix'), /rgba\\(238, 226, 186, 0\\.56\\) 0%/, 'the artfin-numeix lost its classic band');
  assertMatch(block(css, '.gd-artfin-auric'), /rgba\\(255, 224, 140, 0\\.36\\) 0%/, 'the artfin-auric lost its classic honey');
  assertMatch(block(css, '.gd-artfin-nuri'), /rgba\\(255, 196, 120, 0\\.48\\) 0%/, 'the artfin-nuri lost its classic fire');
  for (const fin of ['numeix', 'auric']) {
    const art = block(css, `.gd-artfin-${fin}`);
    assert.ok(!art.includes('var(--gd-tint-hand'), `the artfin-${fin} kept a hand read`);
  }
  assertMatch(block(css, '.gd-artfin-nuri'), /color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 58%, transparent\\)/, 'the artfin-nuri lost its RAW tint band');
});
''')

swap('gendex_200_batch_dom.test.mjs', 'B6 — the thin screen voices keep their 1.6 hand on the dark ground', '''ok('B6 — the thin screen lifts retired with the stack', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the 1.6 hand (the scoped
     opacity lifts the channel-pegged band gained) retired with the
     flip stack — the dapple, the currents and the honey body speak
     their classic voices on every plate. */
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!cssLaws.includes('opacity: min(1, calc(var(--gd-fin-strength, 1) * 1.6))'), 'the 1.6 lift survived somewhere');
  assert.ok(!/gd-fin-ground(?:-light|-dark)? \\.gd-numeix-dapple/.test(cssLaws), 'the dapple lift selector survived');
});
''')

# ---------------------------------------------------------------------------
# the corner audit's ladder banners (the 200 suite pins them by name)
# ---------------------------------------------------------------------------
audit = ROOT / 'scripts' / 'pixel_corner_law_197.mjs'
raw = audit.read_text(encoding='utf8')
if 'THE GRAY LADDER' not in raw:
    marks = [
        ("  ['g25', '#252525'], ['g38', '#383838'], ['g52', '#525252'], ['g66', '#666666'],",
         "  // THE GRAY LADDER — the desaturation rail end to end (g25..gdd)\n  ['g25', '#252525'], ['g38', '#383838'], ['g52', '#525252'], ['g66', '#666666'],"),
        ("  ['ltorange', '#ffcf9e'], ['ltorange2', '#ffd9a8'], ['ltorange3', '#ffe3c0'],",
         "  // THE LIGHT-CARD LADDER — the report's own light patients\n  ['ltorange', '#ffcf9e'], ['ltorange2', '#ffd9a8'], ['ltorange3', '#ffe3c0'],"),
        ("  ['pastelblue', '#8080ff'], ['pastelviolet', '#9a80ff'],",
         "  // THE PASTEL BAND — the wheel's pale quadrant\n  ['pastelblue', '#8080ff'], ['pastelviolet', '#9a80ff'],"),
        ("  ['mist', '#7fd1d8'], ['apple', '#a3c24a'], ['slate', '#9aa0a6'],",
         "  // LOW-SATURATION CHROMATICS — the muddy mid band (mist / apple / slate)\n  ['mist', '#7fd1d8'], ['apple', '#a3c24a'], ['slate', '#9aa0a6'],"),
    ]
    for old, new in marks:
        assert raw.count(old) == 1, f'audit banner anchor x{raw.count(old)}: {old[:60]!r}'
        raw = raw.replace(old, new, 1)
    audit.write_text(raw, encoding='utf8')
    print('  banners restored in pixel_corner_law_197.mjs')
else:
    print('  audit banners already present')

# ---------------------------------------------------------------------------
# the 1910 suite's classic reference — the tree's own fixture (the
# battery must run on any machine; the 192 tree is a sandbox artifact)
# ---------------------------------------------------------------------------
s1910 = ROOT / 'scripts' / 'gendex_1910_batch_dom.test.mjs'
raw = s1910.read_text(encoding='utf8')
if "readFileSync('/home/z/my-project/burrito_gendex_192/src/index.css', 'utf8')" in raw:
    raw = raw.replace(
        "const classic = readFileSync('/home/z/my-project/burrito_gendex_192/src/index.css', 'utf8');",
        "// the classic reference is the tree's own fixture (the delivered\n"
        "// 1.9.2 coat region, byte-verbatim — the coat's every seat lives\n"
        "// inside it); the audit's full-sheet side stays a sandbox-only\n"
        "// dev check, so the battery runs on any machine.\n"
        "const classic = fixture;")
    # C2 reads the external tree only when present (the provenance check)
    old_c2 = """ok('C2 — the fixture is the delivered 1.9.2 coat, verbatim inside the classic sheet', () => {
  // the byte-provenance the audit asserts at startup, pinned here too
  const core = fixture.slice(fixture.indexOf('*/') + 2).replace(/^\\n+/, '').replace(/\\n+$/, '');
  assert.ok(classic.includes(core), 'the fixture core drifted from the 1.9.2 sheet');
});"""
    new_c2 = """ok('C2 — the fixture is the delivered 1.9.2 coat, verbatim inside the classic sheet (when the tree is present)', () => {
  // the byte-provenance the audit asserts at startup, pinned here too —
  // the 192 tree lives in the dev sandbox alone; where it is absent the
  // audit's own startup check owns the provenance
  let classicSheet = '';
  try { classicSheet = readFileSync('/home/z/my-project/burrito_gendex_192/src/index.css', 'utf8'); } catch { /* sandbox-only */ }
  if (!classicSheet) return;
  const core = fixture.slice(fixture.indexOf('*/') + 2).replace(/^\\n+/, '').replace(/\\n+$/, '');
  assert.ok(classicSheet.includes(core), 'the fixture core drifted from the 1.9.2 sheet');
});"""
    assert old_c2 in raw, 'C2 anchor moved'
    raw = raw.replace(old_c2, new_c2, 1)
    s1910.write_text(raw, encoding='utf8')
    print('  1910 suite re-seated on the in-tree fixture')
else:
    print('  1910 suite already seated')

print('part 2 complete')
