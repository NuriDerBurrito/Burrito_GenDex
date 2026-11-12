#!/usr/bin/env python3
"""patch_law_pins_198.py — the 197 suite's living-law pins speak 1.9.7.

The 197 suite (born pinning the 1.9.6 CERTAIN INK) carries the ink law's
pins at their roots; the 1.9.7 CORNERED INK moved those laws, and the
pins move with them — exactly the way the 196 pass healed the 192-195
suites' pins. A1/A2/A4/A5/A6 speak the new derivation + grounds + blends;
E2 speaks the emblem's plain truth (the halo and under-shadow RETIRED by
the 1.9.7 report itself); the F seats are swept by version_sweep_198.py.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITE = ROOT / "scripts" / "gendex_197_batch_dom.test.mjs"


def sub(old: str, new: str, name: str) -> None:
    raw = SUITE.read_text(encoding="utf8")
    if old not in raw:
        if new in raw:
            print(f"  skip (idempotent): {name}")
            return
        raise SystemExit(f"FAIL: anchor missing: {name}")
    raw = raw.replace(old, new, 1)
    SUITE.write_text(raw, encoding="utf8")
    print(f"  spoke: {name}")


def main() -> None:
    # ------------------------------------------------------------------
    # A1 — the twin measures in light (the luma rail + the solver)
    # ------------------------------------------------------------------
    sub(
        """ok('A1 — the twin itself (finishInkTwin, one monotone rail, no thresholds)', () => {
  assertMatch(ribbon, /export function finishInkTwin\\(cardColor\\) \\{/, 'finishInkTwin never left TagRibbon');
  // the rail: one fixed compression above 0.5, a passthrough below
  assertMatch(ribbon, /if \\(l <= 0\\.5\\) return `#\\$\\{m\\.slice\\(1\\)\\.toLowerCase\\(\\)\\}`;/, 'the dark passthrough left the twin');
  assertMatch(ribbon, /const twinL = 0\\.5 \\+ \\(l - 0\\.5\\) \\* 0\\.3;/, 'the twin lost its lightness rail');
  // no threshold branches beyond the rail itself (the "values dont loop"
  // promise: ONE monotone function, nothing to cross)
  const twin = /export function finishInkTwin[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assert.ok(!/finishGroundTone|0\\.78|0\\.19|0\\.85/.test(twin), 'a ground threshold leaked into the twin');
});""",
        """ok('A1 — the twin measures in light (1.9.7: the luma rail, both sides, the solver)', () => {
  assertMatch(ribbon, /export function finishInkTwin\\(cardColor\\) \\{/, 'finishInkTwin never left TagRibbon');
  // the yardstick: perceptual luminance (the HSL-lightness rail let the
  // fully-saturated high-luminance corners pass through raw — the yellow)
  assertMatch(ribbon, /const lum = 0\\.2126 \\* r \\+ 0\\.7152 \\* g \\+ 0\\.0722 \\* b;/, 'the twin lost its luminance yardstick');
  // the ONE rail, both sides: the bright half's shadow (compression where
  // it carries, floored 0.16 of light below the plate), the dark half's
  // lift (0.16 above it)
  assertMatch(ribbon, /const target = lum >= 0\\.5 \\? Math\\.min\\(0\\.35 \\+ 0\\.3 \\* lum, lum - 0\\.16\\) : lum \\+ 0\\.16;/, 'the twin lost its two-sided rail');
  // the lightness SOLVED exactly (bisection against the twin's own luma
  // curve — no threshold branches, nothing to loop past)
  assertMatch(ribbon, /const lumaAt = \\(ll\\) => \\{/, 'the solver never spoke');
  assertMatch(ribbon, /for \\(let i = 0; i < 24; i \\+= 1\\) \\{/, 'the bisection lost its steps');
  // the passthrough is GONE (the 1.9.6 dark passthrough was the yellow's
  // whole disease: HSL L <= 0.5 returned the raw hex)
  const twin = /export function finishInkTwin[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assert.ok(!/return `#\\$\\{m\\.slice\\(1\\)/.test(twin), 'the raw passthrough survived');
  assert.ok(!/finishGroundTone|0\\.78|0\\.19|0\\.85/.test(twin), 'a ground threshold leaked into the twin');
});""",
        'A1 speaks the luma rail',
    )

    # ------------------------------------------------------------------
    # A2 — the hand speaks everywhere (the universal swap)
    # ------------------------------------------------------------------
    sub(
        """ok('A2 — the tint-hand seat (declared on the coat, swapped by the light ground)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the coat never declared the hand');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-card-face-finish,\\s*\\n\\.gd-fin-ground-light \\.gd-card-face-artfin \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);\\s*\\n\\}/, 'the light ground never swapped the hand');
});""",
        """ok('A2 — the hand speaks everywhere (1.9.7: the universal swap, both wrappers)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the coat never declared the hand');
  assertMatch(css, /\\.gd-card-face-finish,\\s*\\n\\.gd-card-face-artfin \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);\\s*\\n\\}/, 'the universal hand never spoke');
});""",
        'A2 speaks the universal hand',
    )

    # ------------------------------------------------------------------
    # A4 — the light law splits at the bright rail (multiply washes +
    #      native glows on the mid half; normal everywhere on bright)
    # ------------------------------------------------------------------
    sub(
        """ok('A4 — the bodies rejoin the light multiply stack (the whole wall, one blend)', () => {
  const light = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(light, 'the light law never spoke');
  for (const seat of ['.gd-finish-numeix', '.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-xmarks', '.gd-numeix-stars', '.gd-numeix-moon',
    '.gd-finish-foil', '.gd-finish-foil::before', '.gd-finish-foil-ripples', '.gd-foil-ripple',
    '.gd-finish-auric', '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon',
    '.gd-finish-nuri', '.gd-finish-nuri::after', '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',
    '.gd-finish-holographic', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',
    '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(light.includes(`.gd-fin-ground-light ${seat},`) || light.includes(`.gd-fin-ground-light ${seat} {`), `the light law never seated ${seat}`);
  }
  // the twin is written on every card surface that can class light
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishInkTwin\\(/, 'a surface lost the twin write');
  }
});""",
        """ok('A4 — the light law splits at the bright rail (1.9.7: washes + glows below, normal above)', () => {
  // the mid-bright half: the broad tint washes multiply, the glows keep
  // their native screen, the X's keep their normal native
  const washes = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light \\.gd-finish-nuri::before \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(washes, 'the mid-bright wash law never spoke');
  for (const seat of ['.gd-finish-numeix', '.gd-finish-foil', '.gd-finish-foil::before', '.gd-finish-auric', '.gd-finish-nuri', '.gd-finish-nuri::before']) {
    assert.ok(washes.includes(`.gd-fin-ground-light ${seat},`) || washes.includes(`.gd-fin-ground-light ${seat} {`), `the wash law never seated ${seat}`);
  }
  // the rainbow bodies speak normal on the whole light ground (their
  // fixed hues never re-hue against the plate)
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-holographic,\\s*\\n\\.gd-fin-ground-light \\.gd-finish-prismatic \\{\\s*\\n  mix-blend-mode: normal;\\s*\\n\\}/, 'the rainbow bodies lost their normal seat');
  // the BRIGHT subclass speaks normal for the whole coat at once
  const bright = /\\.gd-fin-ground-bright \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  mix-blend-mode: normal;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(bright, 'the bright normal law never spoke');
  for (const seat of ['.gd-finish-numeix', '.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-xmarks', '.gd-numeix-stars', '.gd-numeix-moon',
    '.gd-finish-foil', '.gd-finish-foil::before', '.gd-finish-foil-ripples', '.gd-foil-ripple',
    '.gd-finish-auric', '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon',
    '.gd-finish-nuri', '.gd-finish-nuri::before', '.gd-finish-nuri::after', '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',
    '.gd-finish-holographic', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',
    '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(bright.includes(`.gd-fin-ground-bright ${seat},`) || bright.includes(`.gd-fin-ground-bright ${seat} {`), `the bright law never seated ${seat}`);
  }
  // the twin is written on every card surface that can class a ground
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishInkTwin\\(/, 'a surface lost the twin write');
  }
});""",
        'A4 speaks the split light law',
    )

    # ------------------------------------------------------------------
    # A5 — the facet rides the bright subclass alone
    # ------------------------------------------------------------------
    sub(
        """ok('A5 — the silver facet (the white-ink seats alone keep a filter)', () => {
  const facet = /\\.gd-fin-ground-light \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';
  assert.ok(facet, 'the silver-facet law never spoke');
  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',
    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(facet.includes(`.gd-fin-ground-light ${seat},`) || facet.includes(`.gd-fin-ground-light ${seat} {`), `the silver facet never seated ${seat}`);
  }""",
        """ok('A5 — the silver facet (the white-ink seats alone keep a filter, bright-scoped)', () => {
  const facet = /\\.gd-fin-ground-bright \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';
  assert.ok(facet, 'the silver-facet law never spoke');
  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',
    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(facet.includes(`.gd-fin-ground-bright ${seat},`) || facet.includes(`.gd-fin-ground-bright ${seat} {`), `the silver facet never seated ${seat}`);
  }""",
        'A5 speaks the bright-scoped facet',
    )

    # ------------------------------------------------------------------
    # A6 — the veil joins the stacks (light multiply, dark screen) and
    #      the vivid class retires
    # ------------------------------------------------------------------
    sub(
        """ok('A6 — the veil keeps its overlay seat (the twin is its ink)', () => {
  assert.ok(!/\\.gd-fin-ground-light \\.gd-finish-nuri::before \\{[^}]*mix-blend-mode/.test(css), 'the veil gained a light flip');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: screen;\\s*\\n\\}/, 'the dark veil lost its glow');
});""",
        """ok('A6 — the veil joins the stacks (1.9.7: light multiply, dark screen; the vivid class retires)', () => {
  // overlay spoke identity on channel-pure brights (exactly 1.0 in a
  // channel is 1.0 out of it) — the veil vanished on yellow and pure
  // white alike; it multiplies on the light ground now, with the twin as
  // its ink, and keeps its dark screen glow
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-nuri::before,/, 'the veil never joined the light wash stack');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: screen;\\s*\\n\\}/, 'the dark veil lost its glow');
  // the VIVID class retired with the band it served — its screen family
  // was already the dark family's own list
  assert.ok(!css.includes('.gd-fin-ground-vivid .gd-finish-foil,'), 'the vivid class survived its retirement');
  assert.ok(!/return 'gd-fin-ground-vivid'/.test(ribbon), 'finishGroundTone still speaks the vivid class');
});""",
        'A6 speaks the veil stacks + the vivid retirement',
    )

    # ------------------------------------------------------------------
    # E2 — the emblem's plain truth (the mark + rim alone)
    # ------------------------------------------------------------------
    sub(
        """ok('E2 — the polished emblem (the raised seat + the halo)', () => {
  assertMatch(css, /drop-shadow\\(0 1px 1px rgba\\(0, 0, 0, 0\\.42\\)\\)/, 'the under-shadow never lifted the emblem');
  assertMatch(css, /\\.gd-ribbon-glyph::before \\{/, 'the halo never spoke');
  assertMatch(css, /width: calc\\(var\\(--gd-glyph-size, 12px\\) \\* 1\\.9\\);/, 'the halo never read the emblem measure');
  assertMatch(css, /color-mix\\(in srgb, currentColor 22%, transparent\\)/, 'the halo lost its ink');
  assertMatch(ribbon, /'--gd-glyph-size': `\\$\\{glyphSize\\}px`,/, 'the glyph never threaded its measure');
});""",
        """ok('E2 — the emblem\\'s plain truth (1.9.7: the mark and its rim alone, no shadows)', () => {
  // the 1.9.6 polish seated a luminous halo (the pale stain below the
  // emoji the report caught) and an under-shadow — both retire
  assert.ok(!css.includes('.gd-ribbon-glyph::before'), 'the halo survived the retirement');
  assert.ok(!/drop-shadow\\(0 1px 1px rgba\\(0, 0, 0, 0\\.42\\)\\)/.test(css), 'the under-shadow survived the retirement');
  // the rim keeps its fence seat (the outline the report keeps)
  assertMatch(css, /drop-shadow\\(0 0 0\\.75px var\\(--gd-glyph-rim, rgba\\(0, 0, 0, 0\\.55\\)\\)\\)/, 'the rim lost its fence');
  assertMatch(ribbon, /'--gd-glyph-size': `\\$\\{glyphSize\\}px`,/, 'the glyph never threaded its measure');
});""",
        "E2 speaks the emblem's plain truth",
    )

    print('the 197 suite pins speak 1.9.7')


if __name__ == "__main__":
    main()
