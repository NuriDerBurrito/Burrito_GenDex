#!/usr/bin/env python3
"""patch_law_pins_199.py — heal the 194-198 suites' living-law pins to the
1.9.8 laws (the same healing the 1.9.7 pass performed on the 192-196
suites). Three families of drift:

  1. THE QUIET SEAM — the twin's rail and the ground classes flip at
     luminance 0.70 now (the center-top pastel band keeps its glow);
     the seam pins and the computed tone mirrors speak the new line.
  2. THE PICTURE KEEPS ITS OWN EYE — every ground-class flip scopes
     :not(.is-art-zone) (the art twin speaks the classic voice), and
     the three child seats take the exclusion on their ancestor; the
     pins' regex heads/tails fold the scope in, and the extracted rule
     blocks are normalized before the seat loops read them.
  3. THE PAIR SPEAKS FOR EVERY PROTECTED PICTURE + THE STATIC GHOST —
     the 197 suite's pair gate loses its splitArt clause; the 198
     suite's ghost pin speaks the offscreen clone + its retirement.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITES = ["gendex_194_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs",
          "gendex_196_batch_dom.test.mjs", "gendex_197_batch_dom.test.mjs",
          "gendex_198_batch_dom.test.mjs"]

NORM = ".exec(css)?.[0]?.replace(/:not\\(\\.is-art-zone\\)/g, '').replace(/\\.gd-card-face-finish /g, '') ?? ''"


def heal(suite: str, old: str, new: str, name: str, all_: bool = False) -> None:
    p = ROOT / "scripts" / suite
    raw = p.read_text(encoding="utf-8")
    if old not in raw:
        if new in raw:
            print(f"  skip (idempotent): {suite} {name}")
            return
        raise SystemExit(f"FAIL: {suite} anchor missing: {name}\n---\n{old[:300]}\n===")
    n = raw.count(old)
    if not all_ and n != 1:
        raise SystemExit(f"FAIL: {suite} anchor count {n} != 1: {name}")
    p.write_text(raw.replace(old, new), encoding="utf-8")
    print(f"  spoke: {suite} {name}" + (f" ({n} seats)" if n > 1 else ""))


def main() -> None:
    # ------------------------------------------------------------------
    # 1. THE QUIET SEAM — the rail + the seam pins + the computed mirrors
    # ------------------------------------------------------------------
    for s in ["gendex_197_batch_dom.test.mjs", "gendex_198_batch_dom.test.mjs"]:
        heal(s,
             r"const target = lum >= 0\.5 \? Math\.min\(0\.35 \+ 0\.3 \* lum, lum - 0\.16\) : lum \+ 0\.16;",
             r"const target = lum >= 0\.7 \? Math\.min\(0\.35 \+ 0\.3 \* lum, lum - 0\.16\) : lum \+ 0\.16;",
             "the twin's rail speaks the quiet seam")
    for s in ["gendex_194_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs", "gendex_198_batch_dom.test.mjs"]:
        heal(s,
             r"if \(lum >= 0\.5\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';",
             r"if \(lum >= 0\.7\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';",
             "the seam law pin speaks the quiet seam")
    # the computed tone() mirrors (plain JS, no regex escapes) — 194 + 195
    for s in ["gendex_194_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs"]:
        heal(s,
             "if (lum >= 0.5) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';",
             "if (lum >= 0.7) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';",
             "the computed mirror speaks the quiet seam")

    # ------------------------------------------------------------------
    # 2. THE ART-ZONE SCOPE — regex heads/tails fold :not(.is-art-zone)
    # ------------------------------------------------------------------
    REPLS = [
        # the light wash list's head (numeix first) + the veil's tail
        (r"\.gd-fin-ground-light \.gd-finish-numeix,\n",
         r"\.gd-fin-ground-light \.gd-finish-numeix:not\(\.is-art-zone\),\n",
         ["gendex_196_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs", "gendex_194_batch_dom.test.mjs",
          "gendex_197_batch_dom.test.mjs", "gendex_198_batch_dom.test.mjs"]),
        (r"\.gd-fin-ground-light \.gd-finish-nuri::before \{\n  mix-blend-mode: multiply;\n\}",
         r"\.gd-fin-ground-light \.gd-finish-nuri:not\(\.is-art-zone\)::before \{\n  mix-blend-mode: multiply;\n\}",
         ["gendex_197_batch_dom.test.mjs", "gendex_198_batch_dom.test.mjs"]),
        (r"\.gd-fin-ground-light \.gd-finish-nuri::before\s*\{\s*\n  mix-blend-mode: multiply;",
         r"\.gd-fin-ground-light \.gd-finish-nuri:not\(\.is-art-zone\)::before\s*\{\s*\n  mix-blend-mode: multiply;",
         ["gendex_197_batch_dom.test.mjs", "gendex_196_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs"]),
        # the rainbow bodies' normal pair
        (r"\.gd-fin-ground-light \.gd-finish-holographic,\s*\n\.gd-fin-ground-light \.gd-finish-prismatic \{",
         r"\.gd-fin-ground-light \.gd-finish-holographic:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-light \.gd-finish-prismatic:not\(\.is-art-zone\) \{",
         ["gendex_197_batch_dom.test.mjs", "gendex_196_batch_dom.test.mjs", "gendex_198_batch_dom.test.mjs"]),
        # the bright normal list's head
        (r"\.gd-fin-ground-bright \.gd-finish-numeix,\n",
         r"\.gd-fin-ground-bright \.gd-finish-numeix:not\(\.is-art-zone\),\n",
         ["gendex_197_batch_dom.test.mjs", "gendex_196_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs",
          "gendex_198_batch_dom.test.mjs"]),
        # the facet list's head
        (r"\.gd-fin-ground-bright \.gd-finish-foil-ripples,\n",
         r"\.gd-fin-ground-bright \.gd-finish-foil-ripples:not\(\.is-art-zone\),\n",
         ["gendex_197_batch_dom.test.mjs", "gendex_196_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs",
          "gendex_198_batch_dom.test.mjs"]),
        # the dark veil + the dark family heads
        (r"\.gd-fin-ground-dark \.gd-finish-nuri::before \{\s*\n  mix-blend-mode: screen;\s*\n\}",
         r"\.gd-fin-ground-dark \.gd-finish-nuri:not\(\.is-art-zone\)::before \{\s*\n  mix-blend-mode: screen;\s*\n\}",
         ["gendex_197_batch_dom.test.mjs", "gendex_196_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs"]),
        (r"\.gd-fin-ground-dark \.gd-finish-foil,\s*\n\.gd-fin-ground-dark \.gd-finish-auric \{",
         r"\.gd-fin-ground-dark \.gd-finish-foil:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-finish-auric:not\(\.is-art-zone\) \{",
         ["gendex_195_batch_dom.test.mjs"]),
        (r"\.gd-fin-ground-dark \.gd-finish-numeix,[\s\S]*?mix-blend-mode: screen;",
         r"\.gd-fin-ground-dark \.gd-finish-numeix:not\(\.is-art-zone\),[\s\S]*?mix-blend-mode: screen;",
         ["gendex_195_batch_dom.test.mjs"]),
        # the scoped hands (the dapple's lift + the X's pen)
        (r"\.gd-fin-ground-light \.gd-numeix-dapple \{",
         r"\.gd-fin-ground-light \.gd-numeix-dapple:not\(\.is-art-zone\) \{",
         ["gendex_197_batch_dom.test.mjs"]),
        (r"\.gd-fin-ground-light \.gd-numeix-xmarks \{",
         r"\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{",
         ["gendex_198_batch_dom.test.mjs"]),
        # 194 C1's assertMatch pair (the light law's own two seats)
        (r"\.gd-fin-ground-light \.gd-finish-numeix,\s*\n\.gd-fin-ground-light \.gd-finish-foil,",
         r"\.gd-fin-ground-light \.gd-finish-numeix:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-light \.gd-finish-foil:not\(\.is-art-zone\),",
         ["gendex_194_batch_dom.test.mjs"]),
    ]
    for old, new, targets in REPLS:
        for s in targets:
            heal(s, old, new, f"art-zone scope: {old[:52]}...", all_=True)

    # the extracted rule blocks normalize before the seat loops read them
    # (the count varies per suite — a plain sweep, idempotent by construction)
    for s in SUITES:
        p = ROOT / "scripts" / s
        raw = p.read_text(encoding="utf-8")
        n = raw.count(".exec(css)?.[0] || '';")
        if n == 0:
            if NORM in raw:
                print(f"  skip (idempotent): {s} the extraction normalizer")
            else:
                print(f"  note: {s} has no plain extraction tails")
            continue
        raw = raw.replace(".exec(css)?.[0] || '';", NORM + ";")
        p.write_text(raw, encoding="utf-8")
        print(f"  spoke: {s} the extraction normalizer ({n} seats)")

    # the 198 A6 seat loop's ::before entries need the scope between
    heal("gendex_198_batch_dom.test.mjs",
         "for (const seat of ['.gd-finish-foil', '.gd-finish-foil::before', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri', '.gd-finish-nuri::before', '.gd-finish-holographic', '.gd-finish-prismatic', '.gd-prism-stars']) {\n    assert.ok(css.includes(`.gd-fin-ground-dark ${seat}`), `the dark family never seated ${seat}`);",
         "for (const seat of ['.gd-finish-foil', '.gd-finish-foil::before', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri', '.gd-finish-nuri::before', '.gd-finish-holographic', '.gd-finish-prismatic', '.gd-prism-stars']) {\n    assert.ok(css.includes(`.gd-fin-ground-dark ${seat}`) || css.includes(`.gd-fin-ground-dark ${seat.replace('::before', ':not(.is-art-zone)::before')}`), `the dark family never seated ${seat}`);",
         "the dark family's ::before seats speak the art-zone scope")

    # ------------------------------------------------------------------
    # 3. THE PAIR + THE GHOST
    # ------------------------------------------------------------------
    heal("gendex_197_batch_dom.test.mjs",
         r"assertMatch(ribbon, /const pair = splitArt && onImage && hasImage;/, 'the pair gate never spoke');",
         r"assertMatch(ribbon, /const pair = onImage && hasImage;/, 'the pair gate never spoke');",
         "the pair speaks for every protected picture")

    heal("gendex_198_batch_dom.test.mjs",
         """ok('C1 — the ghost is the class card, handed at its leading edge', () => {
  assertMatch(sidebar, /e\\.currentTarget\\.querySelector\\('\\.gd-tree-card'\\)/, 'the ghost never found the class card');
  assertMatch(sidebar, /e\\.dataTransfer\\.setDragImage\\(cardEl, /, 'setDragImage never spoke');
  assertMatch(sidebar, /Math\\.max\\(10, Math\\.min\\(16, Math\\.round\\(r\\.width \\* 0\\.12\\)\\)\\), Math\\.round\\(r\\.height \\/ 2\\)\\)/, 'the grab point lost its seat');
});""",
         """ok('C1 — the ghost is the class card, handed at its leading edge', () => {
  assertMatch(sidebar, /e\\.currentTarget\\.querySelector\\('\\.gd-tree-card'\\)/, 'the ghost never found the class card');
  /* 1.9.8 — the ghost is a STATIC offscreen clone now (one raster at
     dragstart, retired at the gesture's end — never a live seat the
     browser tracks through the drag). */
  assertMatch(sidebar, /cardEl\\.cloneNode\\(true\\)/, 'the ghost never took its static clone');
  assertMatch(sidebar, /document\\.body\\.appendChild\\(host\\);/, 'the offscreen host never seated');
  assertMatch(sidebar, /e\\.dataTransfer\\.setDragImage\\(\\s*host,/, 'setDragImage never spoke to the host');
  assertMatch(sidebar, /Math\\.max\\(10, Math\\.min\\(16, Math\\.round\\(r\\.width \\* 0\\.12\\)\\)\\),\\s*\\n\\s*Math\\.round\\(r\\.height \\/ 2\\)\\s*\\n\\s*\\);/, 'the grab point lost its seat');
  assertMatch(sidebar, /retireGhost\\(\\);/, 'the ghost never learned its retirement');
});""",
         "the static ghost law")

    # ------------------------------------------------------------------
    # 4. THE SWEEP'S OWN BLIND SPOTS (healed after version_sweep_199 ran:
    #    the badge literals inside includes() — the lookbehind the sweep's
    #    digit pass cannot reach, exactly as the 1.9.7 flow found) and the
    #    two straggler pin shapes the first pass missed (194 C1's dark
    #    pair, 196 A4's six-line dark screen list)
    # ------------------------------------------------------------------
    for s in ["gendex_192_batch_dom.test.mjs", "gendex_193_batch_dom.test.mjs", "gendex_194_batch_dom.test.mjs",
              "gendex_195_batch_dom.test.mjs", "gendex_196_batch_dom.test.mjs"]:
        heal(s,
             "readme.includes('version-1.9.7-purple')",
             "readme.includes('version-1.9.8-purple')",
             "the badge literal the sweep cannot reach")
    heal("gendex_194_batch_dom.test.mjs",
         r"assertMatch(css, /\.gd-fin-ground-dark \.gd-finish-foil,\s*\n\.gd-fin-ground-dark \.gd-finish-auric \{\s*\n  mix-blend-mode: screen;/, 'the dark law never turned the veils to light');",
         r"assertMatch(css, /\.gd-fin-ground-dark \.gd-finish-foil:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-finish-auric:not\(\.is-art-zone\) \{\s*\n  mix-blend-mode: screen;/, 'the dark law never turned the veils to light');",
         "the 194 dark pair speaks the art-zone scope")
    heal("gendex_196_batch_dom.test.mjs",
         r"\.gd-fin-ground-dark \.gd-finish-numeix,\s*\n\.gd-fin-ground-dark \.gd-finish-nuri,\s*\n\.gd-fin-ground-dark \.gd-finish-holographic,\s*\n\.gd-fin-ground-dark \.gd-finish-prismatic,\s*\n\.gd-fin-ground-dark \.gd-prism-stars,\s*\n\.gd-fin-ground-dark \.gd-finish-foil::before \{\s*\n  mix-blend-mode: screen;",
         r"\.gd-fin-ground-dark \.gd-finish-numeix:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-finish-nuri:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-finish-holographic:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-finish-prismatic:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-prism-stars:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-finish-foil:not\(\.is-art-zone\)::before \{\s*\n  mix-blend-mode: screen;",
         "the 196 dark screen list speaks the art-zone scope")

    print("OK — the 194-198 suites speak the 1.9.8 laws")


if __name__ == "__main__":
    main()
