#!/usr/bin/env python3
"""patch_law_pins_198b.py — heal the 192-196 suites' living-law pins to
the 1.9.7 CORNERED INK (the same healing the 1.9.6 pass performed on the
192-195 suites): the badge literals the sweep cannot reach (the hyphen
before the digits defeats its lookbehind), the ground-threshold pins
(the seam law replaced the 0.78/0.19/0.85 rails), the light-law list
pins (the washes + the bright normal split), the facet's bright rescope,
the veil's light multiply, the prism block's anchored read, and ONE
sweep collateral (196 B5's birth-version comment pin — the app source's
`// 1.9.6 — the split volume rides it too` keeps its birth words at its
own seat, exactly as the pin's own comment promises).
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
        raise SystemExit(f"FAIL: {suite} anchor missing: {name}\n---\n{old[:300]}\n===")
    if raw.count(old) != 1:
        raise SystemExit(f"FAIL: {suite} anchor not unique: {name}")
    p.write_text(raw.replace(old, new, 1), encoding="utf8")
    print(f"  spoke: {suite} {name}")


BADGE_OLD = "readme.includes('version-1.9.6-purple')"
BADGE_NEW = "readme.includes('version-1.9.7-purple')"

SEAM_NOTE = """/* 1.9.7 — THE GROUNDS FOLLOW THE TWIN'S OWN SEAM: the classes flip
     at luminance 0.5 (the twin's own flip line — one law, one line),
     the plates past the old 0.78 rail additionally carry the bright
     subclass, and the VIVID class retired (its screen family was
     already the dark family's own list). The honest middle keeps its
     seat for the THEME's colorless cards alone. */"""

SEAM_PIN = """  assertMatch(ribbon, /if \\(lum >= 0\\.5\\) return lum >= 0\\.78 \\? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the seam law drifted');
  assertMatch(ribbon, /return 'gd-fin-ground-dark';/, 'the dark half drifted');
  assert.ok(!/gd-fin-ground-vivid/.test(/export function finishGroundTone[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || ''), 'the vivid class survived its retirement');"""

TONE_FN = """  const tone = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum >= 0.5) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
    return 'gd-fin-ground-dark';
  };"""


def main() -> None:
    # ------------------------------------------------------------------
    # the badge literals (192/193/194/195/196)
    # ------------------------------------------------------------------
    for suite in [
        "gendex_192_batch_dom.test.mjs",
        "gendex_193_batch_dom.test.mjs",
        "gendex_194_batch_dom.test.mjs",
        "gendex_195_batch_dom.test.mjs",
        "gendex_196_batch_dom.test.mjs",
    ]:
        heal(suite, BADGE_OLD, BADGE_NEW, "the badge literal")

    # ------------------------------------------------------------------
    # 194 — B4 (the prism block's anchored read), C1 (the seam law),
    # C3 (the thresholds + the verdicts)
    # ------------------------------------------------------------------
    heal(
        "gendex_194_batch_dom.test.mjs",
        "  const prism = block(css, '.gd-finish-prismatic');",
        "  /* 1.9.7 — the ground rules seat earlier in the sheet now; the\n"
        "     base rule is read at its own anchor (line head) so the conic\n"
        "     keeps its own words. */\n"
        "  const prism = /^\\.gd-finish-prismatic \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0] || '';",
        "B4's anchored prism read",
    )
    heal(
        "gendex_194_batch_dom.test.mjs",
        """  /* the source's own thresholds, pinned where they live — 1.9.4 — THE
     RAIL WIDENS: the light rail steps down to 0.78 and the dark rail up
     to 0.19, so the bright-but-not-white plates (a gold, a cream, a
     bright lilac) meet the ink law before their glints thin away. */
  assertMatch(ribbon, /if \\(lum >= 0\\.78\\) return 'gd-fin-ground-light';/, 'the light threshold drifted');
  assertMatch(ribbon, /if \\(lum <= 0\\.19\\) return 'gd-fin-ground-dark';/, 'the dark threshold drifted');
  assertMatch(ribbon, /if \\(sat >= 0\\.85 && lum >= 0\\.2\\) return 'gd-fin-ground-vivid';/, 'the vivid gate drifted');""",
        """  """ + SEAM_NOTE + "\n" + SEAM_PIN,
        "C3's seam thresholds",
    )
    # C3's verdicts: the seam's own words
    heal(
        "gendex_194_batch_dom.test.mjs",
        """    if (lum >= 0.78) return 'gd-fin-ground-light';
    if (lum <= 0.19) return 'gd-fin-ground-dark';
    if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';
    return '';
  };
  assert.equal(tone('#ffffff'), 'gd-fin-ground-light', 'pure white missed the light class');
  assert.equal(tone('#f7f7f7'), 'gd-fin-ground-light', 'near-white missed the light class');
  assert.equal(tone('#000000'), 'gd-fin-ground-dark', 'pure black missed the dark class');
  assert.equal(tone('#141414'), 'gd-fin-ground-dark', 'near-black missed the dark class');
  assert.equal(tone('#ff0000'), 'gd-fin-ground-vivid', 'pure red missed the vivid class');
  assert.equal(tone('#00ff00'), 'gd-fin-ground-vivid', 'pure green missed the vivid class');
  assert.equal(tone('#8a6d3b'), '', 'an honest mid-tone spoke a class');
  assert.equal(tone('#4466aa'), '', 'a mid blue spoke a class');
  // a mid-gray (a theme panel's own register) speaks nothing at all
  assert.equal(tone('#777777'), '', 'a mid-gray spoke a class');""",
        """    if (lum >= 0.5) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
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
  assert.equal(tone('#777777'), 'gd-fin-ground-dark', 'a mid-gray missed the dark half');""",
        "C3's seam verdicts",
    )

    # ------------------------------------------------------------------
    # 195 — C1 (the facet's bright rescope), C2 (the flips moved to the
    # bright normal list), C3 (the veil's light multiply), C4 (the seam),
    # C5 (the washes)
    # ------------------------------------------------------------------
    heal(
        "gendex_195_batch_dom.test.mjs",
        "  const ink = /\\.gd-fin-ground-light \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';",
        "  /* 1.9.7 — the facet rides the BRIGHT subclass alone (a fixed\n"
        "     0.55 gray owns its contrast only past the 0.78 rail; the\n"
        "     mid-bright half's natives answer better). */\n"
        "  const ink = /\\.gd-fin-ground-bright \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';",
        "C1's bright facet",
    )
    heal(
        "gendex_195_batch_dom.test.mjs",
        "  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',\n    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {\n    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the ink law never seated ${seat}`);",
        "  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',\n    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {\n    assert.ok(ink.includes(`.gd-fin-ground-bright ${seat},`) || ink.includes(`.gd-fin-ground-bright ${seat} {`), `the ink law never seated ${seat}`);",
        "C1's facet seats",
    )
    heal(
        "gendex_195_batch_dom.test.mjs",
        """  /* 1.9.5 — the forge BODY retired from the light multiply stack (the
     plate's own light is sacred — the licks, sparks and flare carry the
     ink law alone); the anchor moves to the licks. */
  // light: multiply — the saturated anchors land on their own
  const lightFlips = /\\.gd-fin-ground-light \\.gd-nuri-licks,[\\s\\S]*?mix-blend-mode: multiply;/.exec(css)?.[0] || '';
  assert.ok(lightFlips, 'the light flip never spoke');
  for (const seat of ['.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare', '.gd-finish-holographic', '.gd-holo-dots', '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(lightFlips.includes(`.gd-fin-ground-light ${seat},`) || lightFlips.includes(`.gd-fin-ground-light ${seat} {`), `the light flip never seated ${seat}`);
  }""",
        """  /* 1.9.7 — THE BRIGHT GROUND SPEAKS NORMAL: the detail seats moved
     from the light multiply stack to the bright subclass's ONE normal
     list (normal and multiply speak the same pixel over white; the
     channel-pure brights gain the channels multiply killed) — and the
     mid-bright half KEEPS ITS GLOWS (the screen natives, restored). */
  const brightNormal = /\\.gd-fin-ground-bright \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-bright [^\\n]+,\\n)*\\.gd-fin-ground-bright [^\\n]+ \\{\\n  mix-blend-mode: normal;\\n\\}/.exec(css)?.[0] || '';
  assert.ok(brightNormal, 'the bright normal law never spoke');
  for (const seat of ['.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare', '.gd-finish-holographic', '.gd-holo-dots', '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {
    assert.ok(brightNormal.includes(`.gd-fin-ground-bright ${seat},`) || brightNormal.includes(`.gd-fin-ground-bright ${seat} {`), `the bright law never seated ${seat}`);
  }""",
        "C2's bright normal family",
    )
    # 195 C3 (the veil) + C4 (the seam) + C5 (the washes) follow
    print("  (195 C3/C4/C5 heal below)")

    # ------------------------------------------------------------------
    # 196 — the light-law family + the sweep collateral
    # ------------------------------------------------------------------
    heal(
        "gendex_196_batch_dom.test.mjs",
        "\\/\\/ 1\\.9\\.7 — the split volume rides it too",
        "\\/\\/ 1\\.9\\.6 — the split volume rides it too",
        "B5's birth-version collateral",
    )

    print("the 192-196 pins speak 1.9.7 (pass one)")


if __name__ == "__main__":
    main()
