#!/usr/bin/env python3
"""patch_law_pins_198c.py — heal pass two: the 195/196 suites' living-law
pins speak the 1.9.7 corner law (the seats that moved: the facet's
bright rescope, the veil's light multiply, the seam thresholds + their
computed verdicts, the vivid retirement, and the details' bright-normal
family).
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def heal(suite: str, old: str, new: str, name: str) -> None:
    p = ROOT / "scripts" / suite
    raw = p.read_text(encoding="utf8")
    if old not in raw:
        if new in raw:
            print(f"  skip (idempotent): {suite} {name}")
            return
        raise SystemExit(f"FAIL: {suite} anchor missing: {name}\n---\n{old[:400]}\n===")
    if raw.count(old) != 1:
        raise SystemExit(f"FAIL: {suite} anchor not unique: {name}")
    p.write_text(raw.replace(old, new, 1), encoding="utf8")
    print(f"  spoke: {suite} {name}")


S195 = "gendex_195_batch_dom.test.mjs"
S196 = "gendex_196_batch_dom.test.mjs"


def main() -> None:
    # ------------------------------------------------------------------
    # 195 C1 — the facet's seat loops speak bright
    # ------------------------------------------------------------------
    heal(
        S195,
        """  for (const seat of [
    '.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards',
    '.gd-holo-dots', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep',
  ]) {
    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the silver facet never seated ${seat}`);
  }""",
        """  for (const seat of [
    '.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards',
    '.gd-holo-dots', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep',
  ]) {
    assert.ok(ink.includes(`.gd-fin-ground-bright ${seat},`) || ink.includes(`.gd-fin-ground-bright ${seat} {`), `the silver facet never seated ${seat}`);
  }""",
        "C1's facet seats speak bright",
    )
    heal(
        S195,
        """  for (const leaner of ['.gd-numeix-dapple', '.gd-numeix-xmarks', '.gd-nuri-licks', '.gd-auric-currents',
    '.gd-finish-auric', '.gd-finish-foil', '.gd-finish-numeix', '.gd-finish-nuri', '.gd-finish-holographic', '.gd-finish-prismatic']) {
    assert.ok(!ink.includes(`.gd-fin-ground-light ${leaner},`) && !ink.includes(`.gd-fin-ground-light ${leaner} {`), `a tint-leaning seat joined the facet: ${leaner}`);
  }""",
        """  for (const leaner of ['.gd-numeix-dapple', '.gd-numeix-xmarks', '.gd-nuri-licks', '.gd-auric-currents',
    '.gd-finish-auric', '.gd-finish-foil', '.gd-finish-numeix', '.gd-finish-nuri', '.gd-finish-holographic', '.gd-finish-prismatic']) {
    assert.ok(!ink.includes(`.gd-fin-ground-bright ${leaner},`) && !ink.includes(`.gd-fin-ground-bright ${leaner} {`), `a tint-leaning seat joined the facet: ${leaner}`);
  }""",
        "C1's leaner loop speaks bright",
    )

    # ------------------------------------------------------------------
    # 195 C3 — the veil joins the light multiply stack (1.9.7)
    # ------------------------------------------------------------------
    heal(
        S195,
        """  assert.ok(!/\\.gd-fin-ground-light \\.gd-finish-nuri::before \\{/.test(css), 'the light veil flip survived the 1.9.5 retirement (it only ever darkened the fire it was meant to tint)');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: screen;\\s*\\n\\}/, 'the dark veil never stepped aside');""",
        """  /* 1.9.7 — THE VEIL JOINS THE LIGHT MULTIPLY STACK: overlay spoke
     identity on channel-pure brights (exactly 1.0 in a channel is 1.0
     out of it) — the veil vanished on yellow and pure white alike; it
     multiplies with the twin as its ink now, and keeps its dark glow. */
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-nuri::before\\s*\\{\\s*\\n  mix-blend-mode: multiply;/, 'the veil never joined the light wash stack');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: screen;\\s*\\n\\}/, 'the dark veil never stepped aside');""",
        "C3's veil stacks",
    )

    # ------------------------------------------------------------------
    # 195 C4 — the seam thresholds + the verdicts
    # ------------------------------------------------------------------
    heal(
        S195,
        """  assertMatch(ribbon, /if \\(lum >= 0\\.78\\) return 'gd-fin-ground-light';/, 'the light rail never widened');
  assertMatch(ribbon, /if \\(lum <= 0\\.19\\) return 'gd-fin-ground-dark';/, 'the dark rail never widened');
  assertMatch(ribbon, /if \\(sat >= 0\\.85 && lum >= 0\\.2\\) return 'gd-fin-ground-vivid';/, 'the vivid gate drifted');""",
        """  /* 1.9.7 — THE GROUNDS FOLLOW THE TWIN'S OWN SEAM: the classes flip
     at luminance 0.5 (the twin's own flip line), the plates past the
     0.78 rail additionally carry the bright subclass, and the vivid
     class retired (its screen family was already the dark family's). */
  assertMatch(ribbon, /if \\(lum >= 0\\.5\\) return lum >= 0\\.78 \\? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the seam law drifted');
  assertMatch(ribbon, /return 'gd-fin-ground-dark';/, 'the dark half drifted');""",
        "C4's seam thresholds",
    )
    heal(
        S195,
        """    if (lum >= 0.78) return 'gd-fin-ground-light';
    if (lum <= 0.19) return 'gd-fin-ground-dark';
    if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';
    return '';
  };""",
        """    if (lum >= 0.5) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
    return 'gd-fin-ground-dark';
  };""",
        "C4's tone mirror",
    )
    heal(
        S195,
        """  assert.equal(tone('#ff0000'), 'gd-fin-ground-vivid', 'pure red missed the vivid class');
  assert.equal(tone('#00ff00'), 'gd-fin-ground-vivid', 'pure green missed the vivid class');
  // the honest middle keeps its seat
  assert.equal(tone('#8a6d3b'), '', 'an honest mid-tone spoke a class');
  assert.equal(tone('#4466aa'), '', 'a mid blue spoke a class');
  assert.equal(tone('#777777'), '', 'a mid-gray spoke a class');""",
        """  assert.equal(tone('#ff0000'), 'gd-fin-ground-dark', 'pure red missed the dark class (the vivid retired)');
  assert.equal(tone('#00ff00'), 'gd-fin-ground-light', 'pure green missed the light class (the seam caught it)');
  /* 1.9.7 — the classless middle belongs to the theme's colorless
     cards alone; every PICKED color speaks a side of the seam now. */
  assert.equal(tone('#8a6d3b'), 'gd-fin-ground-dark', 'an honest mid-tone missed the dark half');
  assert.equal(tone('#4466aa'), 'gd-fin-ground-dark', 'a mid blue missed the dark half');
  assert.equal(tone('#777777'), 'gd-fin-ground-dark', 'a mid-gray missed the dark half');""",
        "C4's seam verdicts",
    )

    # ------------------------------------------------------------------
    # 195 C5 — the vivid law retired (the washes keep their bodies)
    # ------------------------------------------------------------------
    heal(
        S195,
        """  assertMatch(css, /\\.gd-fin-ground-vivid \\.gd-finish-foil,\\s*\\n\\.gd-fin-ground-vivid \\.gd-finish-auric,\\s*\\n\\.gd-fin-ground-vivid \\.gd-finish-numeix \\{\\s*\\n  mix-blend-mode: overlay;/, 'the 1.9.3 vivid law left');""",
        """  /* 1.9.7 — THE VIVID CLASS RETIRED: its overlay flip answered a
     mid-saturated plate the twin now answers better, and its screen
     family was already the dark family's own list. */
  assert.ok(!css.includes('.gd-fin-ground-vivid .gd-finish-foil,'), 'the vivid law survived its retirement');""",
        "C5's vivid retirement",
    )

    # ------------------------------------------------------------------
    # 196 A1 — the details moved to the bright normal family
    # ------------------------------------------------------------------
    heal(
        S196,
        """  const light = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(light, 'the light law never spoke');
  for (const seat of ['.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-moon', '.gd-numeix-stars',
    '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon', '.gd-finish-foil-ripples']) {
    assert.ok(light.includes(`.gd-fin-ground-light ${seat},`) || light.includes(`.gd-fin-ground-light ${seat} {`), `the light law never seated ${seat}`);
  }""",
        """  /* 1.9.7 — THE LIGHT LAW SPLITS AT THE BRIGHT RAIL: the broad bodies
     keep the multiply washes on the whole light ground, and the detail
     seats moved to the BRIGHT subclass's one normal list (normal and
     multiply speak the same pixel over white; the channel-pure brights
     gain the channels multiply killed). */
  const light = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(light, 'the light wash law never spoke');
  const brightNorm = /\\.gd-fin-ground-bright \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  mix-blend-mode: normal;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(brightNorm, 'the bright normal law never spoke');
  for (const seat of ['.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-moon', '.gd-numeix-stars',
    '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon', '.gd-finish-foil-ripples']) {
    assert.ok(brightNorm.includes(`.gd-fin-ground-bright ${seat},`) || brightNorm.includes(`.gd-fin-ground-bright ${seat} {`), `the bright law never seated ${seat}`);
  }""",
        "A1's bright normal family",
    )

    # ------------------------------------------------------------------
    # 196 A2 — the facet speaks bright (regex + seats + leaners)
    # ------------------------------------------------------------------
    heal(
        S196,
        "  const ink = /\\.gd-fin-ground-light \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';",
        "  /* 1.9.7 — the facet rides the BRIGHT subclass alone. */\n"
        "  const ink = /\\.gd-fin-ground-bright \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';",
        "A2's bright facet",
    )
    heal(
        S196,
        """  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',
    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the silver facet never seated ${seat}`);
  }""",
        """  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',
    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(ink.includes(`.gd-fin-ground-bright ${seat},`) || ink.includes(`.gd-fin-ground-bright ${seat} {`), `the silver facet never seated ${seat}`);
  }""",
        "A2's facet seats",
    )
    # (the 196 A2 leaner loop keeps its own words — the bright rescope
    # above already covers the facet's scope)


    # ------------------------------------------------------------------
    # 196 A3 — the veil joins the light multiply stack
    # ------------------------------------------------------------------
    heal(
        S196,
        """  assert.ok(!/\\.gd-fin-ground-light \\.gd-finish-nuri::before \\{/.test(css), 'the light veil flip survived the retirement');""",
        """  /* 1.9.7 — the veil MULTIPLIES on the light ground (overlay spoke
     identity on channel-pure brights — the veil vanished on yellow and
     pure white alike). */
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-nuri::before\\s*\\{\\s*\\n  mix-blend-mode: multiply;/, 'the veil never joined the light wash stack');""",
        "A3's veil stack",
    )

    # ------------------------------------------------------------------
    # 196 A4 — the hue-riding bodies speak normal (the rainbow law)
    # ------------------------------------------------------------------
    heal(
        S196,
        """  const flips = /\\.gd-fin-ground-light \\.gd-nuri-licks,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(flips, 'the overlay flip rule never spoke');
  for (const seat of ['.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare', '.gd-finish-holographic', '.gd-holo-dots', '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(flips.includes(`.gd-fin-ground-light ${seat},`) || flips.includes(`.gd-fin-ground-light ${seat} {`), `the overlay flip never seated ${seat}`);
  }""",
        """  /* 1.9.7 — THE RAINBOW SPEAKS NORMAL + THE BRIGHT SUBCLASS CARRIES
     THE DETAILS: the hue-riding bodies (holographic, prismatic) keep
     their fixed hues under normal (multiply re-hued them against the
     plate — a yellow plate turned their blue bands black), and the
     detail seats ride the bright normal list. */
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-holographic,\\s*\\n\\.gd-fin-ground-light \\.gd-finish-prismatic \\{\\s*\\n  mix-blend-mode: normal;\\s*\\n\\}/, 'the rainbow bodies lost their normal seat');
  const brightNorm = /\\.gd-fin-ground-bright \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  mix-blend-mode: normal;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(brightNorm, 'the bright normal law never spoke');
  for (const seat of ['.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare', '.gd-finish-holographic', '.gd-holo-dots', '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(brightNorm.includes(`.gd-fin-ground-bright ${seat},`) || brightNorm.includes(`.gd-fin-ground-bright ${seat} {`), `the bright law never seated ${seat}`);
  }""",
        "A4's rainbow + bright family",
    )

    print("the 195/196 pins speak 1.9.7")


if __name__ == "__main__":
    main()
