#!/usr/bin/env python3
"""1.9.11 patch_law_pins — heals the sweep's two misses, the standing law
of every release (the 198/1810/190 lineage):

1. THE BADGE SHAPE the sweep never reached: five suites pin the README
   badge inside a longer quoted string ('version-1.9.10-purple') — the
   sweep's quoted/escaped shapes only speak the bare version, so the
   embedded form fell through. The badge is a LIVE seat by the suites'
   own word ("the badge is a LIVE seat; it speaks the current release"),
   so the pins move to 1.9.11 like every other live seat.

2. THE OVER-SWEPT BIRTH PINS in the 1910 suite: two pins speak the
   HISTORICAL word that still lives in the tree (the 1.9.10 provenance
   notes above every classic coat seat in index.css, and the 1.9.10
   HARNESS LAW #3 comment in pixel_corner_law_197.mjs) — the sweep moved
   their digits to 1.9.11 and unmoored them from the word they pin.
   Both revert to their birth version, exactly as the tombstones keep
   their names.

Plus one display seat: the 1910 suite's D1 ok-title ('the version is
1.9.10 everywhere') — the sweep's title shape only matched titles that
are EXACTLY the phrase, and this one carries the 'D1 — ' prefix; the
title moves to 1.9.11 to match its own swept assertions.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BADGE_SUITES = [
    "gendex_192_batch_dom.test.mjs",
    "gendex_193_batch_dom.test.mjs",
    "gendex_194_batch_dom.test.mjs",
    "gendex_195_batch_dom.test.mjs",
    "gendex_196_batch_dom.test.mjs",
]


def sub(path: str, old: str, new: str, count = None) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if old not in raw:
        if new in raw:
            print(f"  {path}: already seated")
            return
        raise SystemExit(f"{path}: missing seat:\n{old[:160]}")
    raw = raw.replace(old, new) if count is None else raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


def main() -> None:
    # 1 — the badge shape (a LIVE seat; it speaks the current release)
    for s in BADGE_SUITES:
        sub(f"scripts/{s}", "'version-1.9.10-purple'", "'version-1.9.11-purple'", count=1)

    # 2 — the over-swept birth pins (the tree still speaks their word)
    sub(
        "scripts/gendex_1910_batch_dom.test.mjs",
        r"assertMatch(above, /1\.9\.11 — THE .* SPEAKS? (?:ITS|THEIR) CLASSIC/",
        r"assertMatch(above, /1\.9\.10 — THE .* SPEAKS? (?:ITS|THEIR) CLASSIC/",
    )
    sub(
        "scripts/gendex_1910_batch_dom.test.mjs",
        r"assertMatch(cornerAudit, /1\.9\.11 HARNESS LAW #3/",
        r"assertMatch(cornerAudit, /1\.9\.10 HARNESS LAW #3/",
    )

    # 3 — the display title catches up with its own assertions
    sub(
        "scripts/gendex_1910_batch_dom.test.mjs",
        "ok('D1 — the version is 1.9.10 everywhere'",
        "ok('D1 — the version is 1.9.11 everywhere'",
    )
    print("patch_law_pins_1911: 5 badge seats + 2 birth reverts + 1 title seated")


if __name__ == "__main__":
    main()
