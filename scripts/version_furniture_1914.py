#!/usr/bin/env python3
"""1.9.14 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1914.py, and the 1914 suite is born
speaking 1.9.14 — the sweep excludes it by law, exactly as every release
before it).

1.9.14 — THE SHADOW KEEPS ITS INK, one law: "its now deleting the shadow
under the text of the date and title" — the 1.9.13 contour carried the
ring's width and its body weight through the sweep, but its pre-divided
copies WASHED at the union's outer quarter (one 0.31 copy where three
overlapped, against the resting flat 0.66) and composited lighter over
every ground behind them, so the under-shadow band beneath the date and
the title read half-gone mid-sweep. The contour now speaks the RESTING
COMPOSITE itself: each of the eight copies paints the rim's own hue
stripped opaque (rgb(from var() r g b / 1)) mixed onto the card's own
ground at the resting ratio (66%) — a flat band, no accumulation, the
shadow's full darkness on any ground and under any flood — measured live
in the app's own Electron: 16/16 laws, the mid-sweep band's own painted
color reads byte-equal to rest (168 against 168), the under-shadow
pixel-holds (8519 against 8548), the light voice within its 8%.

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


CHANGELOG_ENTRY = """## 1.9.14 — The Shadow Keeps Its Ink

One law, measured before and after: the shadow under the lettering at rest is the shadow you keep mid-selection — its color, its width, and its weight.

- **The under-shadow keeps its own ink through the sweep** ("its now deleting the shadow under the text of the date and title"): the 1.9.13 cure proved the rim's ring keeps its width and its body weight mid-selection — the contour's eight copies retrued to the stroke's own 0.85px band — but the copies spoke the rim's color PRE-DIVIDED to 47% (the arithmetic that makes three overlapping copies land at the resting flat alpha), and that division was the disease the report caught: the union's OUTER QUARTER carries a single 0.31 copy where three overlapped at 0.66, and translucent copies composite over whatever ground sits behind them — the plate through the band, the accent flood wherever the sweep paints it — so mid-sweep the dark band beneath the date and the title washed to a ghost exactly where the eye reads it as "the shadow under the text" (measured live in the app's own Electron: the outer zone at 105 against the resting 150 on the title, the date's whole under-band 7–12% lighter at the grid's own scales; the 1.9.13 audit sat its weight statistic inside the three-copy body and never measured the outer quarter's single-copy truth). The opposite road is the 1.9.12 disease come back — probed live this round, `rgb(from var() r g b)` KEEPS the origin alpha in this engine, so the raw ink at its own 0.66 would accumulate three-deep to 0.96 and the ring would read ~45% heavier mid-sweep, the very "swap outline thickness" 1.9.13 cured. The contour now speaks the RESTING COMPOSITE itself: every copy paints the rim's own hue STRIPPED OPAQUE (`rgb(from var() r g b / 1)` — the parse probed live, byte-verified: the dark rim's 13/10/7) mixed onto the card's own ground at the resting ratio (66% — the dark rim's own alpha; the light voice's 0.72 lands within 8%, one fraction for both) through `color-mix(in srgb, … 66%, var(--gd-card-tint, var(--gd-panel)))`. The union is the flat resting band across its whole 0.85px × card-scale reach: opaque copies never accumulate (1 is 1 — the pre-division arithmetic retires entirely), the outer quarter carries the same composite as the body, and the band reads its resting darkness on ANY ground and under ANY flood (the mixed ink lands 17/15/13 byte-exact against the resting stroke's own composite over the #191919 plate; under a yellow accent flood the opaque composite still paints 17/15/13 — where the 47% copies washed to an olive ghost, the shadow keeps its full weight). The steps keep the 1.9.13 geometry verbatim: 0.85px × card-scale cardinals and 0.6px diagonals (0.85 / √2 — one uniform reach, the exact band the resting stroke paints). Measured again after the cure: 16/16 laws hold — the mid-sweep band's own painted color reads byte-equal to rest (168 against 168 on both seats, outer quarter flat), the under-shadow's pixel count holds (8519 against 8548 on the title, 6940 against 6926 on the date, 4721 against 4729 at the real grid scale), the light rim's band lands within its 8% (4407 against 4193), the width law holds (3.0px run-median against 3.0px), and the whole family survives verbatim: the label-only control byte-held, the real Ctrl+A identical to the programmatic sweep, the still-mode stand-down conjuring nothing, the letters' own ink never moving, and the drawn outline's runs keeping their own contours at their own seats.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.13",', '"version": "1.9.14",')
    sub("package-lock.json", '"version": "1.9.13",', '"version": "1.9.14",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.13',", "version: '1.9.14',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.14 — The Shadow Keeps Its Ink" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.13 — The Ring Keeps Its Width"), "changelog head is not the 1.9.13 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.13**", "**v1.9.14**")
    sub("README.md", "version-1.9.13-purple", "version-1.9.14-purple")
    sub("README.md", "87 DOM/source test suites", "88 DOM/source test suites")
    # the battery runner welcomes the 1914 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1914_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1913_batch_dom" in raw, "runner missing the 1913 seat"
        raw = raw.replace("gendex_1913_batch_dom", "gendex_1913_batch_dom gendex_1914_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.14 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
