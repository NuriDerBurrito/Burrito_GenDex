#!/usr/bin/env python3
"""1.9.19 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1919.py, and the 1919 suite is born
speaking 1.9.19 — the sweep excludes it by law, exactly as every release
before it).

1.9.19 — THE ENDS TRADE PLACES, one law, quoted from the report:
"just make the zoom options on the right with the reset the view
button, (reset the view button should be the one inwards towards the
center of course not towards the edge , basically just mirror it) , and
the count of the images should be on the left instead, thats all" — the
two end crews trade seats. The FLANK carries the whole view crew
MIRRORED (reset · zoom-in · % · zoom-out, the 1.9.18 cluster's literal
mirror: the reset key stands INWARDS, nearest the switcher, never
against the edge; the zoom-out key parks at the bar's own right end)
and the LEFT zone carries the count alone at the bar's own left end.
The one-shape law carries whole — one markup, the same three zones
whatever the viewer holds, the switcher locked when solo; the parking
laws are untouched, only the ends traded their crews.

The README base is the owner's own manual seat — fetched live from
GitHub during the 1.9.16 session (the repo's raw seat answered 404 on
every later re-fetch); only the version numbers and the battery count
move on it, per the owner's word.

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


CHANGELOG_ENTRY = """## 1.9.19 — The Ends Trade Places

The bar's ends trade their crews — mirrored, so nothing parks against the edge.

- **The view crew rides the right end, mirrored — the reset stands inwards** ("just make the zoom options on the right with the reset the view button, (reset the view button should be the one inwards towards the center of course not towards the edge , basically just mirror it)"): the whole view-control cluster trades ends with the count. The right end now carries reset · zoom-in · percentage · zoom-out — the 1.9.18 crew (zoom-out · percentage · zoom-in · reset) literally mirrored — so the reset key stands INWARDS, nearest the switcher in the middle, and the zoom-out key parks at the bar's own right edge. The keys that move the view still sit together as one crew; only their end traded, and their order turned with it.

- **The count rides the left end** ("and the count of the images should be on the left instead"): the image count parks in the left zone, at the bar's own left end — the seat the view crew kept since 1.9.16. The middle still belongs to the switcher alone, the one-shape law carries whole (one markup for every viewer, a single image included — the very same three zones, the switcher still standing locked with its peeks painting the set and the walk pinned), and the parking laws are untouched: weight at both ends, the navigator alone in the middle.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.18",', '"version": "1.9.19",')
    sub("package-lock.json", '"version": "1.9.18",', '"version": "1.9.19",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.18',", "version: '1.9.19',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.19 — The Ends Trade Places" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.18 — The Bar Keeps One Shape"), "changelog head is not the 1.9.18 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats — the owner's own manual GitHub text (fetched live in
    # the 1.9.16 session): only the version numbers and the battery count
    # move on it, everything else preserved verbatim per the owner's word.
    sub("README.md", "**v1.9.18**", "**v1.9.19**")
    sub("README.md", "version-1.9.18-purple", "version-1.9.19-purple")
    sub("README.md", "92 DOM/source test suites", "93 DOM/source test suites")
    # the battery runner welcomes the 1919 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1919_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1918_batch_dom" in raw, "runner missing the 1918 seat"
        raw = raw.replace("gendex_1918_batch_dom", "gendex_1918_batch_dom gendex_1919_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.19 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
