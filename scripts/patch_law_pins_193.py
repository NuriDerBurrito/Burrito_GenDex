#!/usr/bin/env python3
"""1.9.2 law-pin patches — the seats whose laws themselves MOVED this
release, re-worded exactly the way the 1.8.4, 1.8.8, 1.8.9, 1.8.10, 1.9.0
and 1.9.1 passes taught (the supersession told in comments, the birth
version kept where the prose owns it).

The moved law: FINISH_GROUND's fixed hex plates retired in 1.9.2 (see
TagRibbon's "THE GROUND LISTENS TO THE CLOTH" note) — every ground is a
color-mix over var(--gd-panel) now, and the ink seats that derived from
the ground's hex (readableInk(finishGround), the plateInk ground rung)
fall to the theme's own tokens. Suite 175's B-section pins the 1.7.4
shapes at their roots; the pins that described the RETIRED seats are
re-worded to the 1.9.2 forms, with the supersession named at the seat.

The sweep stragglers: suite 192 was the NEWBORN of the 1.9.1 pass — its
README-purple pin and its E1 title were born in shapes the 1.9.2 sweep's
patterns never learned (a plain includes() string the lookbehind misses,
an ok() title with a prefix). Both are LIVE pins and move here. The
"Releases before 1.9.1 used a SQLite database file" pins stay 1.9.1 in
every suite BY LAW — that is the old house's own name, a truth no sweep
may retell.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITE = ROOT / "scripts" / "gendex_175_batch_dom.test.mjs"
SUITE192 = ROOT / "scripts" / "gendex_192_batch_dom.test.mjs"
SUITE190 = ROOT / "scripts" / "gendex_190_batch_dom.test.mjs"


def sub_file(suite: Path, old: str, new: str, count=1) -> None:
    raw = suite.read_text(encoding="utf8")
    if old in raw:
        raw = raw.replace(old, new, count)
        suite.write_text(raw, encoding="utf8")
        print(f"  {suite.name}: re-worded — {new.strip().splitlines()[0][:72]}")
    else:
        print(f"  {suite.name}: already seated")


def sub(old: str, new: str, count=1) -> None:
    sub_file(SUITE, old, new, count)


def main() -> None:
    # B1 — the ground map's values: fixed hexes -> color-mixes over the
    # theme's own panel (the 1.9.2 supersession, named at the seat)
    sub(
        """ok('B1 — the finish ground map speaks (one receptive plate per material)', () => {
  assertMatch(ribbon, /export const FINISH_GROUND = \\{/, 'the ground map never spoke');
  for (const f of ['numeix', 'foil', 'auric', 'holographic', 'prismatic', 'nuri']) {
    assertMatch(ribbon, new RegExp(`${f}: '#[0-9a-f]{6}',`), `the ${f} ground never spoke`);
  }
});""",
        """ok('B1 — the finish ground map speaks (one receptive plate per material)', () => {
  assertMatch(ribbon, /export const FINISH_GROUND = \\{/, 'the ground map never spoke');
  // 1.9.2 — THE GROUND LISTENS TO THE CLOTH: the fixed hex plates retired
  // (an uncolored card read INVERTED on dark themes, deaf to the theme's
  // own color); every ground mixes the theme's panel with the material's
  // hue now — pinned at the map's own seat.
  for (const f of ['numeix', 'foil', 'auric', 'holographic', 'prismatic', 'nuri']) {
    assertMatch(ribbon, new RegExp(`${f}: 'color-mix\\\\(in srgb, var\\\\(--gd-panel\\\\) \\\\d+%, #[0-9a-f]{6} \\\\d+%\\\\)',`), `the ${f} ground never spoke the theme's own cloth`);
  }
});""",
    )

    # B2 — the foot plate's ground rung: readableInk(ground) -> the theme's
    # own panel text (a color-mix is not a hex readableInk could read)
    sub(
        """  assertMatch(grid, /: finishGround\\s*\\n\\s*\\? \\{ backgroundColor: finishGround, color: readableInk\\(finishGround\\) \\}/, 'the foot never painted the ground');""",
        """  // 1.9.2 — the ground is the theme's cloth now; the plate's printing
  // speaks the theme's own text token (readableInk never reads a mix).
  assertMatch(grid, /: finishGround\\s*\\n\\s*\\? \\{ backgroundColor: finishGround, color: 'var\\(--gd-panel-text\\)' \\}/, 'the foot never painted the ground');""",
    )

    # B2 — the printing ink rung: the ground no longer earns an ink of its
    # own; the themed token speaks directly
    sub(
        """  assertMatch(grid, /: finishGround\\s*\\n\\s*\\? readableInk\\(finishGround\\)/, 'the printing ink never earned the ground');""",
        """  // 1.9.2 — the printing's ground rung is retired with the fixed plates;
  // the theme's panel text speaks exactly as the uncoated card's always did.
  assertMatch(grid, /style=\\{\\{ color: character\\.cardColor \\? readableInk\\(character\\.cardColor\\) : 'var\\(--gd-panel-text\\)' \\}\\}/, 'the printing never spoke the theme text');""",
    )

    # B2 — the rim's plateInk: the ground rung is shed (a mix has no hex
    # to read); colorless falls to the theme's counter token
    sub(
        """  assertMatch(grid, /const plateInk = character\\.cardColor\\s*\\n\\s*\\? readableInk\\(character\\.cardColor\\)\\s*\\n\\s*: finishGround\\s*\\n\\s*\\? readableInk\\(finishGround\\)/, 'the rim never derived from the ground');""",
        """  // 1.9.2 — the rim derives from the picked ink alone; a colorless card
  // falls to the theme's own counter token (the ground rung is retired).
  assertMatch(grid, /const plateInk = character\\.cardColor \\? readableInk\\(character\\.cardColor\\) : null;/, 'the rim never shed the ground rung');""",
    )

    print("\n175's ground pins re-worded to the 1.9.2 law.")

    # --- suite 192's sweep stragglers (LIVE pins the patterns missed) ---
    # the E1 ok() title (a prefix the quoted-title replace never saw)
    sub_file(SUITE192, "ok('E1 — the version is 1.9.1 everywhere', () => {", "ok('E1 — the version is 1.9.2 everywhere', () => {")
    # the README purple badge pin (a plain includes() string whose dots no
    # lookbehind ever caught)
    sub_file(SUITE192, "assert.ok(readme.includes('version-1.9.1-purple'));", "assert.ok(readme.includes('version-1.9.2-purple'));")

    print("\n192's straggler pins moved to 1.9.2.")

    # --- the over-swept birth tombstone (reverted, the way the 1.8.4 and
    # 1.9.1 passes taught): suite 190's D1 pins legal.js's OWN bump note —
    # a 1.9.1 birth comment in the source ("1.9.1 — '1.0.5' -> '1.0.6'")
    # that the sweep's escaped-dot replace caught because the pin itself
    # is a regex. The birth version returns; the pin re-anchors to the
    # source's own words.
    sub_file(
        SUITE190,
        "assertMatch(legal, /1\\.9\\.2 — '1\\.0\\.5' -> '1\\.0\\.6' \\(the experiment's own word/",
        "assertMatch(legal, /1\\.9\\.1 — '1\\.0\\.5' -> '1\\.0\\.6' \\(the experiment's own word/",
    )

    print("\n190's over-swept tombstone reverted to its birth version.")


if __name__ == "__main__":
    main()
