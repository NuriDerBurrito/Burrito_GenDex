#!/usr/bin/env python3
"""1.9.16 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1916.py, and the 1916 suite is born
speaking 1.9.16 — the sweep excludes it by law, exactly as every release
before it).

1.9.16 — THE WALL WAITS FOR THE OPEN, two laws, both quoted from the
report: (1) "when dragging or reordering cards around, for some reason
it will always snap the viewer to the currently open card, fix that so
its only when i open a card" — the 1.9.6 follow re-ran on every re-pack
trigger (the order key, the columns, the heights, the spans), and each
re-run re-fired the smooth settle, so every drag's commit teleported the
view back to the open card. The effect re-runs on the SELECTION alone
now; the resize beats ride only the open event's own flight window
(~0.7s) and then the observer retires — the wall keeps its own scroll
through reorders, zoom steps, late heights and later resizes alike. (2)
"have the image count, zoom and zoom percetage and fit buttons and such
be in the middle when its a single image, but when its multiple, have
them on the left and right of the image switcher at the bottom, since
currently the right side feels so empty, basically balance it" — the
viewer's bar splits the control family around the switcher (the zoom
trio hugging its left flank, the count + fit hugging its right, both
leaning toward the center), and a single image rides the whole family
dead center through the mid zone alone.

The README base is the owner's own manual seat, fetched live from
GitHub (the 1.9.13 text with the logos, the screenshots and the
rewordings — preserved verbatim); only the version numbers and the
battery count move on it, per the owner's word.

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


CHANGELOG_ENTRY = """## 1.9.16 — The Wall Waits for the Open

The wall learns patience; the bar learns balance.

- **The wall follows the open card — and nothing else** ("when dragging or reordering cards around, for some reason it will always snap the viewer to the currently open card, fix that so its only when i open a card"): the 1.9.6 law re-ran its follow effect on every re-pack trigger — the order key, the column count, the measured heights, the spans — and every re-run re-fired the smooth settle, so the drag's commit (and every live preview flip, back when the preview rode the default on) teleported the view back to the open card the moment you rearranged anything near it: the "always snaps" the report names. The follow now speaks the open event alone. The effect re-runs on the SELECTION only — one smooth settle when you open (or switch to) a card, exactly the 1.9.6 word; the scroller's resize beats ride only the open's own FLIGHT WINDOW (~0.7s — the panel flight the open itself summoned, a window resize in the same breath), re-asserting directly so the card reads as pinned while the wall breathes under it; when the window retires the observer disconnects with it. A reorder, a zoom step, a late height landing, an expand, a resize an hour later — none of them move the wall again until the next open. The packed-seat fallback reads the LIVE pack through a ref (the effect's closure would otherwise freeze the wall at open time), and the mounted read keeps speaking the card's true box exactly as it always did.
- **The viewer's bar finds its balance** ("have the image count, zoom and zoom percetage and fit buttons and such be in the middle when its a single image, but when its multiple, have them on the left and right of the image switcher at the bottom, since currently the right side feels so empty, basically balance it"): the controls no longer pile onto the bar's left end with an empty right column beside the switcher. With MULTIPLE images the family splits around the switcher — the zoom trio (− · % · +) hugs its left flank and the count + the fit key hug its right, each zone leaning toward the center through the same 1fr · auto · 1fr grid — so the whole cluster reads as one balanced crown around the picture's navigator: the empty right side is gone without leaning the bar back the other way. With a SINGLE image the whole family — count, zoom, fit — rides the mid zone alone: the only grid child centers dead in the bar, exactly the seat the switcher owns when it exists.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.15",', '"version": "1.9.16",')
    sub("package-lock.json", '"version": "1.9.15",', '"version": "1.9.16",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.15',", "version: '1.9.16',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.16 — The Wall Waits for the Open" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.15 — The Wide Card Wraps the Row"), "changelog head is not the 1.9.15 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats — the owner's own manual GitHub text (fetched live,
    # the 1.9.13 base): only the version numbers and the battery count
    # move on it, everything else preserved verbatim per the owner's word.
    sub("README.md", "**v1.9.13**", "**v1.9.16**")
    sub("README.md", "version-1.9.13-purple", "version-1.9.16-purple")
    sub("README.md", "87 DOM/source test suites", "90 DOM/source test suites")
    # the battery runner welcomes the 1916 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1916_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1915_batch_dom" in raw, "runner missing the 1915 seat"
        raw = raw.replace("gendex_1915_batch_dom", "gendex_1915_batch_dom gendex_1916_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.16 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
