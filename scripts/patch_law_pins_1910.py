#!/usr/bin/env python3
"""1.9.10 — THE CLASSIC COAT RETURNS (law-pin healing, part 1).

The interim session's revert moved the sheet's laws; the historical
suites' pins for the retired 1.9.3-1.9.9 derivation era must be re-worded
to pin the 1.9.10 truth — exactly the way patch_law_pins_198.py healed
the 192-197 seats in its own era. This part heals 159 / 169 / 193 /
194 / 195; part 2 (patch_law_pins_1910b.py) heals 196-200, the audit's
ladder banners, and the 1910 suite's classic reference.

The one law every healed check speaks: the five classic families are
their 1.9.2 anchors again, VERBATIM; the X signature (the owner's
carve-out) keeps its lean through the tint hand; the transparency knobs
keep their volume var; the whole flip/lift/facet stack retired with
exactly TWO ground readers left.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def swap(path, title, new_block):
    p = ROOT / 'scripts' / path
    raw = p.read_text(encoding='utf8')
    pat = re.compile(r"(?ms)^ok\('" + re.escape(title) + r"'(?::[^']*)?, \(\) => \{.*?\n\}\);\n")
    hits = pat.findall(raw)
    if not hits:
        # already seated (idempotent re-run) or the anchor moved
        first_line = new_block.split('\n', 1)[0]
        if first_line in raw:
            print(f'  already seated {path}: {title[:60]}')
            return
    assert len(hits) == 1, f'{path}: {title!r} matched {len(hits)} blocks'
    raw = raw.replace(hits[0], new_block.rstrip('\n') + '\n', 1)
    p.write_text(raw, encoding='utf8')
    print(f'  healed {path}: {title[:60]}')


def line_swap(path, old, new, count=1):
    p = ROOT / 'scripts' / path
    raw = p.read_text(encoding='utf8')
    if old not in raw and new in raw:
        print(f'  already seated {path}: {new[:56]!r}')
        return
    assert raw.count(old) == count, f'{path}: anchor x{raw.count(old)} (want {count}): {old[:80]!r}'
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding='utf8')
    print(f'  seated {path}: {old[:56]!r} -> {new[:56]!r}')


# ---------------------------------------------------------------------------
# the badge literal the sweep's comment-skip leaves behind (the standing
# hand-heal every release — the 199 worklog's own law)
# ---------------------------------------------------------------------------
for p in sorted((ROOT / 'scripts').glob('gendex_*.test.mjs')):
    raw = p.read_text(encoding='utf8')
    if "version-1.9.9-purple" in raw:
        p.write_text(raw.replace("version-1.9.9-purple", "version-1.9.10-purple"), encoding='utf8')
        print(f'  badge-healed {p.name}')

# ---------------------------------------------------------------------------
# 159 — the licks and the veil speak the classic raw-tint law again
# ---------------------------------------------------------------------------
swap('gendex_159_batch_dom.test.mjs', "4a — the tongues paint through a tint-leaning gradient under an alpha mask", '''ok('4a — the tongues paint through the card\\'s raw tint at the 1.5.0 forge weights', () => {
  const licks = css.match(/\\.gd-nuri-licks::before \\{[\\s\\S]*?\\n  -webkit-mask-size:/)?.[0] || '';
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the tongues speak their classic
     law again — the card's RAW tint mixed at the 1.5.0 forge weights
     (58/48/40), verbatim from the 1.9.2 sheet; the tint-hand lean
     retired with the derivation that wrote it. */
  assert(/color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 58%, #ff7a26\\)/.test(licks), 'the licks never color-mix the raw tint');
  assert(/color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 40%, #ffe3a0\\)/.test(licks), 'the licks lost their crown weight');
  assert(/mask-image:/.test(licks) && /-webkit-mask-image:/.test(licks), 'the alpha mask never arrived');
});
''')

swap('gendex_159_batch_dom.test.mjs', "4b — the body veil softened to 38%", '''ok('4b — the body veil speaks its classic depth (the raw tint at 0.5)', () => {
  // anchored to the sheet's own margin — the ground scopes retired in
  // 1.9.10, the veil's own rule is the only seat left
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0] || '';
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil reads the card's RAW
     tint at its classic 0.5 opacity again — the 1.9.4 0.4 step and the
     tint-hand ink retire with the derivation. */
  assert(/background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/.test(veil), 'the veil never took the card tint');
  assert(/opacity: 0\\.5;/.test(veil), 'the veil lost its weight');
  assert(/mix-blend-mode: overlay;/.test(veil), 'the veil lost its blend');
});
''')

# ---------------------------------------------------------------------------
# 169 — the picture-washes and the dapple tile are the classic anchors
# ---------------------------------------------------------------------------
line_swap('gendex_169_batch_dom.test.mjs', '''  /* 1.9.9 — the washes lean through the HAND now (the lean's own art
     seat — hue + saturation alone; see .gd-card-face-finish's note). */
  assert.match(cssSrc, /color-mix\\(in srgb, transparent 44%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #fff0c8\\)\\) 0%/, 'the numeix wash stops drifted');
  assert.match(cssSrc, /color-mix\\(in srgb, transparent 64%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 48%, #ffe08c\\)\\) 0%/, 'the auric wash stops drifted');''', '''  /* 1.9.10 — THE CLASSIC COAT RETURNS: the picture-washes speak their
     classic fixed anchors again, verbatim from the 1.9.2 sheet (the
     sepia band, the honey gradient); the hand-leans retired with the
     derivation. */
  assert.match(cssSrc, /rgba\\(238, 226, 186, 0\\.56\\) 0%/, 'the numeix wash stops drifted');
  assert.match(cssSrc, /rgba\\(255, 224, 140, 0\\.36\\) 0%/, 'the auric wash stops drifted');''')

line_swap('gendex_169_batch_dom.test.mjs', '''  // the SVG rides percent-encoded in the data URI (%3Cellipse / %3Ccircle)
  /* 1.9.3 — the tile is the seat's own ALPHA MASK now, and both engines'
     seats (-webkit-mask-image + mask-image) carry it: every bloom and
     spark dot speaks twice. The budget counts them where they live. */''', '''  // the SVG rides percent-encoded in the data URI (%3Cellipse / %3Ccircle)
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the tile is the seat's own
     BACKGROUND again (the 1.9.3 alpha-mask doubling retired with the
     derivation) — every bloom and spark dot speaks once, at the classic
     budget the 1.9.2 sheet drew. */''')

line_swap('gendex_169_batch_dom.test.mjs', "  const blooms = (dapple.match(/%3Cellipse/g) || []).length;\n  assert.equal(blooms, 20, 'the bloom budget drifted (got ' + blooms + ')');", "  const blooms = (dapple.match(/%3Cellipse/g) || []).length;\n  assert.equal(blooms, 10, 'the bloom budget drifted (got ' + blooms + ')');")
line_swap('gendex_169_batch_dom.test.mjs', "  const dots = (dapple.match(/%3Ccircle/g) || []).length;\n  assert.equal(dots, 4, 'the spark dot budget drifted (got ' + dots + ')');", "  const dots = (dapple.match(/%3Ccircle/g) || []).length;\n  assert.equal(dots, 2, 'the spark dot budget drifted (got ' + dots + ')');")

# ---------------------------------------------------------------------------
# 193 — the nested-mix law keeps its word in the classic form
# ---------------------------------------------------------------------------
line_swap('gendex_193_batch_dom.test.mjs', '''  /* 1.9.6 — the lean reads the tint through the HAND (the light
     ground's twin swap — a nested mix is still a legal color, and the
     hand is itself just a var the ground re-speaks). */
  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #ffc454\\)/, 'the nuri lean never read the tint inside a mix');''', '''  /* 1.9.10 — THE CLASSIC COAT RETURNS: the nested-mix law keeps its
     word in the classic form — the picture's fire band reads the card's
     RAW tint inside a color-mix (a ground that is itself a mix is a
     legal nested color), verbatim from the 1.9.2 sheet. */
  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 58%, transparent\\)/, 'the nuri lean never read the tint inside a mix');''')

# ---------------------------------------------------------------------------
# 194 — the card-color law suite: every family speaks its classic anchors
# ---------------------------------------------------------------------------
swap('gendex_194_batch_dom.test.mjs', "B1 — numeix leans the tint at every seat (body, dapple, streams, X, moon, stars, artfin)", '''ok('B1 — numeix speaks its classic anchors (the X looms alone lean)', () => {
  // 1.9.10 — THE CLASSIC COAT RETURNS: every numeix seat but the X
  // marks returned to its classic 1.9.2 fixed anchors, verbatim (the
  // tooth's browns, the dapple's creams, the streams' pale gold, the
  // starfield's pale golds, the moon's sage-gold, the picture's sepia
  // band); the X marks keep their lean through the tint hand (10 stops).
  const seats = (NUMEIX.match(/var\\(--gd-card-tint, var\\(--gd-panel\\)\\)/g) || []).length;
  assert.equal(seats, 10, `the X looms' hand fallbacks drifted (${seats})`);
  for (const sel of ['.gd-numeix-xmarks::before', '.gd-numeix-xmarks::after']) {
    assert.ok(block(css, sel).includes('var(--gd-tint-hand'), `${sel} never leaned the hand`);
  }
  for (const sel of ['.gd-finish-numeix', '.gd-numeix-dapple::before', '.gd-numeix-streams::after', '.gd-numeix-stars::before', '.gd-numeix-moon::before', '.gd-artfin-numeix']) {
    assert.ok(!block(css, sel).includes('var(--gd-card-tint'), `${sel} kept a tint read`);
  }
  // the classic tiles are the seats' own backgrounds again (the mask era retired)
  assertMatch(block(css, '.gd-numeix-dapple::before'), /background: url\\("data:image\\/svg\\+xml[^"]*width='240'/, 'the dapple tile never returned');
  assertMatch(block(css, '.gd-numeix-streams::after'), /0 0 \\/ 132px 132px;/, 'the streams tile lost its size');
  // the stars keep their phase seat in the tile's own background-position
  assertMatch(block(css, '.gd-numeix-stars::before'), /calc\\(var\\(--gd-fin-ph, 0\\) \\* 180px\\) 0 \\/ 180px 180px;/, 'the stars lost their phase seat');
  // the dapple's seam twins and stop ladder survive in the classic tile
  const dapple = block(css, '.gd-numeix-dapple::before');
  assert.ok(/cx='0' cy='80'/.test(dapple) && /cx='240' cy='80'/.test(dapple), 'the left-edge pair never closed');
  assertMatch(dapple, /stop-opacity='0\\.24'/, 'the d1 stop never spoke');
});
''')

swap('gendex_194_batch_dom.test.mjs', "B2 — foil leans the card\\'s color (never \"always towards blue\")", '''ok('B2 — foil speaks its classic violet chrome (the metal keeps its own word)', () => {
  const body = block(css, '.gd-finish-foil');
  // 1.9.10 — THE CLASSIC COAT RETURNS: the metal's six stops are the
  // classic fixed violets again, verbatim ("foil should normally lean
  // towards card color too" — the 1.9.3 ask — retires with its saga).
  assert.ok((body.match(/rgba\\(/g) || []).length === 6, 'the body\\'s six classic stops never returned');
  assert.equal((body.match(/var\\(--gd-card-tint/g) || []).length, 0, 'a tint read survived in the body');
  assertMatch(body, /rgba\\(122, 108, 220, 0\\.42\\) 0%/, 'the crown stop never spoke its classic violet');
  assertMatch(body, /rgba\\(150, 92, 158, 0\\.42\\) 100%/, 'the foot stop never spoke its classic violet');
  // the metal's temperament survives: soft-light + the hue-ride
  assertMatch(body, /mix-blend-mode: soft-light;/, 'the metal lost its soft-light seat');
  assertMatch(body, /gd-foil-hue 13s ease-in-out infinite;/, 'the hue-ride clock drifted');
  for (const sel of ['.gd-finish-foil::before', '.gd-finish-foil-ripples::before', '.gd-foil-ripple']) {
    assert.ok(!block(css, sel).includes('var(--gd-card-tint'), `${sel} kept a tint read`);
  }
  const rings = block(css, '.gd-finish-foil::before');
  assertMatch(rings, /repeating-radial-gradient\\(/, 'the concentric heart lost its geometry');
});
''')

swap('gendex_194_batch_dom.test.mjs', "B3 — auric leans the card\\'s color (never \"always towards yellowish\")", '''ok('B3 — auric speaks its classic gilt (the treasure keeps its own word)', () => {
  // 1.9.10 — THE CLASSIC COAT RETURNS: every auric seat is its classic
  // fixed gilt again, verbatim from the 1.9.2 sheet ("auric currently
  // leans towards yellowish, make it lean towards card color too" —
  // the 1.9.3 ask — retires with its saga): no tint read anywhere.
  const body = block(css, '.gd-finish-auric');
  assertMatch(body, /linear-gradient\\(/, 'the honey wash lost its gradient');
  assert.ok((body.match(/rgba\\(/g) || []).length === 4, 'the honey\\'s four classic stops never returned');
  assert.equal((body.match(/var\\(--gd-card-tint/g) || []).length, 0, 'a tint read survived in the honey');
  for (const sel of ['.gd-auric-currents::before', '.gd-auric-flakes::before', '.gd-auric-flakes::after', '.gd-auric-sweep::before', '.gd-auric-summon::before', '.gd-auric-summon::after', '.gd-artfin-auric']) {
    assert.ok(!block(css, sel).includes('var(--gd-card-tint'), `${sel} kept a tint read`);
  }
  // the treasure keeps its geometry in the classic lattice tile
  const gems = block(css, '.gd-auric-currents::before');
  assert.ok(/M63 24 L80 45 L63 66 L46 45 Z/.test(gems), 'the big gem outline drifted');
  assertMatch(gems, /gd-auric-run 13s linear infinite/, 'the drift clock drifted');
  // the filaments keep their classic vertical dissolve (the single mask)
  const fil = block(css, '.gd-auric-summon::after');
  assertMatch(fil, /-webkit-mask-image: linear-gradient\\(/, 'the filaments\\' dissolve never spoke');
  assertMatch(fil, /-webkit-mask-size: 100% 100%;/, 'the filaments\\' mask lost its size');
});
''')

line_swap('gendex_194_batch_dom.test.mjs', '''  // and the nuri lean (the law this release generalizes) still speaks
  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #ffc454\\)/, 'the nuri lean never spoke');''', '''  // and the nuri fire band reads the card's RAW tint inside its mix (the classic forge law)
  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 58%, transparent\\)/, 'the nuri raw-tint band never spoke');''')

swap('gendex_194_batch_dom.test.mjs', "C1 — the blend families answer the plate\\'s tone (the three laws)", '''ok('C1 — the blend flips retire whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the whole 1.9.3-1.9.9 flip
     stack — the light multiply washes, the bright normal list, the
     dark screen family, the silver facet — retired with the derivation
     it served; every coat speaks its classic native blend on every
     plate again, and exactly TWO rules read the ground classes (the
     X signature's dark glow ink seat + its light depth filter). */
  const seatRules = (css.match(/^[^\\n/{}]*gd-fin-ground[^\\n{]*\\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
  assert.ok(css.includes('.gd-fin-ground-dark .gd-card-face-finish:not(.is-art-zone),'), 'the X dark glow seat never spoke');
  assert.ok(css.includes('.gd-fin-ground-light .gd-numeix-xmarks:not(.is-art-zone) {'), 'the X light filter never spoke');
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright subclass survived its retirement');
  assert.ok(!css.includes('.gd-fin-ground-vivid'), 'the vivid class survived its retirement');
  // the classic natives keep their own seats
  assertMatch(css, /\\.gd-finish-numeix \\{[^{}]*mix-blend-mode: soft-light;/, 'the paper lost its soft-light');
  assertMatch(css, /\\.gd-finish-foil \\{[^{}]*mix-blend-mode: soft-light;/, 'the metal lost its soft-light');
  assertMatch(css, /\\.gd-finish-nuri \\{[^{}]*mix-blend-mode: overlay;/, 'the forge lost its overlay');
});
''')

# ---------------------------------------------------------------------------
# 195 — the re-inked fire retires; the classic fire returns
# ---------------------------------------------------------------------------
swap('gendex_195_batch_dom.test.mjs', "A1 — the body\\'s every stop leans the card\\'s tint (the fixed fire retired)", '''ok('A1 — the body speaks its classic fire again (the fixed stripes return)', () => {
  const body = block(css, '.gd-finish-nuri');
  assert.ok(body, 'the forge body never spoke');
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the body's fire band, its vein
     lattices and its obsidian weave all returned to their classic 1.9.2
     fixed anchors, verbatim — the 1.9.4 re-ink (every stop leaning the
     tint through the hand) retires with the derivation. */
  const leans = (body.match(/var\\(--gd-card-tint, var\\(--gd-panel\\)\\)/g) || []).length;
  assert.equal(leans, 0, `a tint read survived the body (${leans})`);
  // every classic fixed warm stop returned wholesale
  for (const back of ['rgba(255, 140, 0', 'rgba(255, 62, 20', 'rgba(255, 196, 60', 'rgba(255, 110, 30', 'rgba(178, 34, 52', 'rgba(255, 122, 30', 'rgba(255, 92, 92', 'rgba(255, 158, 46', 'rgba(26, 17, 12', 'rgba(44, 26, 16', 'rgba(22, 13, 9']) {
    assert.ok(body.includes(back), `a classic fire stop never returned: ${back}`);
  }
  // the veins keep their classic exact alphas (0.17/0.14/0.13/0.12)
  assertMatch(body, /rgba\\(255, 140, 0, 0\\.17\\) 0 22px/, 'the first vein never returned');
  assertMatch(body, /rgba\\(255, 62, 20, 0\\.14\\) 68px 90px/, 'the crossed vein never returned');
  assertMatch(body, /rgba\\(178, 34, 52, 0\\.34\\) 0%/, 'the band\\'s crown never returned');
  // the obsidian ground keeps its classic weave
  assertMatch(body, /rgba\\(26, 17, 12, 0\\.34\\), rgba\\(44, 26, 16, 0\\.26\\) 58%, rgba\\(22, 13, 9, 0\\.36\\)/, 'the obsidian weave never returned');
  // the crossed lattices keep their geometry
  assertMatch(body, /repeating-linear-gradient\\(\\s*\\n\\s*58deg/, 'the first lattice lost its angle');
  assertMatch(body, /repeating-linear-gradient\\(\\s*\\n\\s*122deg/, 'the crossed lattice lost its angle');
  assertMatch(body, /mix-blend-mode: overlay;/, 'the forge lost its overlay seat');
});
''')

swap('gendex_195_batch_dom.test.mjs', "A2 — the veil steps down so the re-inked fire reads (0.5 -> 0.4)", '''ok('A2 — the veil steps back up to its classic weight (0.4 -> 0.5)', () => {
  // anchored to the sheet's own margin — the flip scopes retired in
  // 1.9.10, the veil's own rule is the only seat left
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0]?.replace(/:not\\(\\.is-art-zone\\)/g, '').replace(/\\.gd-card-face-finish /g, '') ?? '';
  assert.ok(veil, 'the veil never spoke');
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil reads the card's RAW
     tint at its classic 0.5 weight again — the 1.9.4 0.4 step and the
     tint-hand ink retire with the derivation. */
  assertMatch(veil, /background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the veil lost the raw tint');
  assertMatch(veil, /opacity: 0\\.5;/, 'the veil kept its 1.9.4 weight');
  assertMatch(veil, /mix-blend-mode: overlay;/, 'the veil lost its blend');
  // the licks / sparks / flare / hearts keep the 1.5.0 raw-tint leans
  // they always spoke (the classic forge law)
  for (const sel of ['.gd-nuri-licks::before', '.gd-nuri-sparks::before', '.gd-nuri-flare::before', '.gd-finish-nuri::after']) {
    assert.ok(block(css, sel).includes('var(--gd-card-tint'), `${sel} lost its lean`);
  }
});
''')

swap('gendex_195_batch_dom.test.mjs', "C1 — the light grounds gain the INK LAW (the masked seats darken)", '''ok('C1 — the ink law retires with the stack (the X\\'s pen alone keeps a filter)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the silver facet and every
     scoped filter retired with the flip stack — the classic anchors
     carry their own contrast, and the ONE filter the sheet keeps is
     the X signature's light-ground depth pen (the owner's carve-out). */
  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver facet survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the 1.9.5 gentle hand survived in a rule');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the 1.9.4 crushing hand survived in a rule');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-xmarks:not\\(\\.is-art-zone\\) \\{\\s*\\n  filter: brightness\\(0\\.78\\) saturate\\(1\\.05\\);\\s*\\n\\}/, 'the X\\'s pen lost its seat');
});
''')

swap('gendex_195_batch_dom.test.mjs', "C2 — the overlay coats flip on the extremes (they were identity there)", '''ok('C2 — the overlay flips retire whole (the classic blends speak on the extremes)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the bright subclass's normal
     list and the dark family's screen flips retired with the stack —
     the details and the glows speak their classic native blends on
     every plate, exactly as the classic physics always spoke them. */
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright normal law survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the dark veil flip survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-prism-stars'), 'the dark prism flip survived');
  const seatRules = (css.match(/^[^\\n/{}]*gd-fin-ground[^\\n{]*\\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
});
''')

swap('gendex_195_batch_dom.test.mjs', "C3 — the forge\\'s veil keeps its overlay seat on light, glows on dark (1.9.5)", '''ok('C3 — the forge\\'s veil keeps its classic overlay on every plate', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the veil's ground-scoped blend
     flips retired whole — it speaks its classic overlay wherever the
     plate sits, reading the card's RAW tint at the 0.5 weight. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-nuri'), 'the veil\\'s light multiply survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the veil\\'s dark screen survived');
  assertMatch(css, /^\\.gd-finish-nuri::before \\{[^{}]*mix-blend-mode: overlay;/m, 'the veil lost its classic blend');
});
''')

swap('gendex_195_batch_dom.test.mjs', "C5 — the 1.9.3 laws keep their own words (the release line holds)", '''ok('C5 — the 1.9.3 laws retired with the classic coat (the release line holds)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the whole 1.9.3-1.9.9 ground
     machinery — the light multiply stack, the dark screen family, the
     vivid class — retired with the derivation it served; exactly TWO
     rules read the ground classes now (the X signature's own seats). */
  const seatRules = (css.match(/^[^\\n/{}]*gd-fin-ground[^\\n{]*\\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers`);
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-numeix'), 'the 1.9.3 light law survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-foil'), 'the 1.9.3 dark law survived');
  assert.ok(!css.includes('.gd-fin-ground-vivid'), 'the vivid law survived its retirement');
});
''')

print('part 1 complete')
