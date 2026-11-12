#!/usr/bin/env python3
"""1.9.13 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1913.py, and the 1913 suite is born
speaking 1.9.13 — the sweep excludes it by law, exactly as every release
before it).

1.9.13 — THE RING KEEPS ITS WIDTH, one law: "the rim survives the sweep
isnt functional yet, when i do the select i see the date and the title
of the card in the card viewer swap outline thickness" — the 1.9.12
contour carried the rim's color through any selection but never its
geometry (1.1px steps in the FULL rim color against the resting stroke's
0.85px outer-half band at flat alpha), so mid-sweep the ring read ~30%
wider and ~30% heavier and the date and the title traded their resting
weights. The contour retrues to the stroke's own arithmetic (0.85px /
0.6px steps, the color pre-divided to 47% so the 3-copy overlap lands at
the resting flat alpha) — measured live in the app's own Electron: 3.0px
against 3.0px, body 170 against 168, the swap gone. The drawn outline's
runs retrue by the same law (0.75px / 0.53px plain, 1px / 0.71px bold).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already seated")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:120]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


CHANGELOG_ENTRY = """## 1.9.13 — The Ring Keeps Its Width

One law, measured before and after: the ring you wear at rest is the ring you keep mid-selection.

- **The rim keeps its own width and weight through the sweep** ("the rim survives the sweep isnt functional yet, when i do the select i see the date and the title of the card in the card viewer swap outline thickness"): the 1.9.12 cure proved the rim's COLOR survives any selection — an 8-way text-shadow contour in the rim's own color painted through the highlight in the dead stroke's seat — but it never spoke the stroke's GEOMETRY. The resting ring is the stroke's outer half (a 1.7px centered stroke under paint-order: stroke fill shows a 0.85px × card-scale band at the rim color's flat alpha), while the contour wore 1.1px steps in the FULL rim color — so mid-sweep the ring read ~30% wider and, where the eight translucent copies overlap along every straight edge, ~30% heavier (measured live in the app's own Electron: the ring's run-median 4.0px against the resting 3.0px, the band's body at 224 against the resting 168) — the date and the title visibly traded their resting weights the whole time the selection stood, worst on the small date seat. The contour now speaks the stroke's own arithmetic: cardinal steps at 0.85px × card-scale and diagonals at 0.6px (0.85 / √2 — one uniform 0.85px reach, the exact band the resting stroke paints), with the color pre-divided to 47% through color-mix so the three copies that overlap along a straight edge land back at the resting flat alpha (1 − (1 − 0.31)³ = 0.67 against the resting 0.66 dark rim, 0.71 against the 0.72 light one — one fraction serves both). Measured again after the retrue: the mid-sweep ring reads 3.0px against the resting 3.0px with the band body at 170 against 168 — the swap is gone, proven on both seats (title and date), through the programmatic whole-document sweep and a real Ctrl+A, with the label-only control byte-held, the letters' own ink never moving, and the still-mode stand-down intact (an outline that does not exist never paints one mid-sweep). A witness card proved the one remaining compromise is the engine's own: ::selection drops a -webkit-text-stroke declaration outright, so the shadow union is the only ring that ever paints mid-selection — its outer quarter runs a single light copy, reading as the AA-soft edge the stroke always wore.
- **The drawn outline's runs keep their own width too** (the same law at their own seat): the outline FORMAT's 0.37.0 selection contour spoke the BOLD stroke's band — 1px steps — for every run, so a plain outlined run (a 1.5px stroke, a 0.75px resting band) swelled ~33% mid-highlight exactly the way the rim did, and would have stood fat beside the rim's retrued letters the moment a mixed title was swept. The plain run's contour retrues to its own outer half (0.75px cardinal, 0.53px diagonal — 0.75 / √2) in the same opaque backdrop color, and the BOLD run earns its own seat with the fatter band its 2px stroke actually wears (1px cardinal, 0.71px diagonal — the values the whole family shared through 1.9.12, now the bold law alone). Measured live: both runs' contours now match their resting bands (1.0px run-median against 1.0px at rest, plain and bold alike).

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.12",', '"version": "1.9.13",')
    sub("package-lock.json", '"version": "1.9.12",', '"version": "1.9.13",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.12',", "version: '1.9.13',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.13 — The Ring Keeps Its Width" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.12 — The Resting State"), "changelog head is not the 1.9.12 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.12**", "**v1.9.13**")
    sub("README.md", "version-1.9.12-purple", "version-1.9.13-purple")
    sub("README.md", "86 DOM/source test suites", "87 DOM/source test suites")
    # the battery runner welcomes the 1913 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1913_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1912_batch_dom" in raw, "runner missing the 1912 seat"
        raw = raw.replace("gendex_1912_batch_dom", "gendex_1912_batch_dom gendex_1913_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.13 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
