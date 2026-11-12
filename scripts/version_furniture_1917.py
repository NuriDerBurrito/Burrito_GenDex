#!/usr/bin/env python3
"""1.9.17 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1917.py, and the 1917 suite is born
speaking 1.9.17 — the sweep excludes it by law, exactly as every release
before it).

1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER, one law, quoted from the
report: "the image count and zoom and zoom percentage and the images
right and left viewer in the huge image viewer window, they are mixing
together and look bad, rework it so it fits in the new space and redo it
properly, if worse come to worst readd the text from before but ensure it
doesnt clip to the right side of the screen like before" — the 1.9.16
balance leaned both control zones toward the center (the zoom trio
pressing against the peek's left arrow, the count + fit against its
right), so on a huge window the bar read as one mashed cluster with
empty ends: the mixing the report names. The zoning keeps its word (the
family flanks the switcher; a single image rides dead center alone) but
the parking is reworked: the zoom trio parks at the bar's LEFT end, the
count + fit park at the bar's RIGHT end (the retired hint's old
territory — a short wrap-capable cluster that can never clip off the
edge the way the long hint text once did), and the middle belongs to
the switcher alone.

The README base is the owner's own manual seat — fetched live from
GitHub during the 1.9.16 session (the repo's raw seat answered 404 during
this release's re-fetch, so the 1.9.16-fetched text rides forward);
only the version numbers and the battery count move on it, per the
owner's word.

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


CHANGELOG_ENTRY = """## 1.9.17 — The Middle Belongs to the Switcher

The bar learns its places.

- **The family parks at the ends** ("the image count and zoom and zoom percentage and the images right and left viewer in the huge image viewer window, they are mixing together and look bad, rework it so it fits in the new space and redo it properly"): the 1.9.16 balance leaned BOTH control zones toward the center — the zoom trio (− · % · +) pressing right up against the peek's left arrow and the count + fit pressing against its right — so on a huge viewer the whole bottom bar read as one mashed cluster crowding the switcher while the bar's own ends sat empty: the mixing the report names. The zoning keeps its word (the control family still flanks the switcher; a single image still rides the whole family dead center through the mid zone alone) but the parking is reworked to fit the freed space: the left zone parks the zoom trio at the bar's own LEFT end and the flank parks the count + fit at the bar's own RIGHT end — the retired hint's old territory, now carrying a short, wrap-capable control cluster that can never clip off the right edge the way the long single-line hint text once did. The middle belongs to the switcher alone; the bar's full breathing width is the separation between the family and the peeks; weight at both ends, the navigator alone in the middle — nothing touching, nothing mixed, and the freed space finally reads as used.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.16",', '"version": "1.9.17",')
    sub("package-lock.json", '"version": "1.9.16",', '"version": "1.9.17",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.16',", "version: '1.9.17',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.17 — The Middle Belongs to the Switcher" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.16 — The Wall Waits for the Open"), "changelog head is not the 1.9.16 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats — the owner's own manual GitHub text (fetched live in
    # the 1.9.16 session): only the version numbers and the battery count
    # move on it, everything else preserved verbatim per the owner's word.
    sub("README.md", "**v1.9.16**", "**v1.9.17**")
    sub("README.md", "version-1.9.16-purple", "version-1.9.17-purple")
    sub("README.md", "90 DOM/source test suites", "91 DOM/source test suites")
    # the battery runner welcomes the 1917 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1917_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1916_batch_dom" in raw, "runner missing the 1916 seat"
        raw = raw.replace("gendex_1916_batch_dom", "gendex_1916_batch_dom gendex_1917_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.17 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
