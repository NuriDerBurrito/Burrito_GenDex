#!/usr/bin/env python3
"""1.9.15 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1915.py, and the 1915 suite is born
speaking 1.9.15 — the sweep excludes it by law, exactly as every release
before it).

1.9.15 — THE WIDE CARD WRAPS THE ROW, two laws, both quoted from the
report: (1) "in full image viewer, remove the text bottom right 'drag to
pan · zoom with the keys or +/− · right-click for options · do.u. etc'"
— the viewer's usage hint is retired with its whole right zone, the bar
keeping the same 1fr · auto · 1fr grid so the peek trio stays dead
center; (2) "in a class there is 4 normal cards (3:4 small size), then
after them there is a card (16:10 enlarged) and a card (3:4 enlarged
card) ... the cards wont stay next to the 4 normal cards, instead
leaving exactly a 1 card gab inbetween" — the 1.8.2 strand guard
demanded every lane left of a rightward pair be stacked past the wide
card's FULL height, a demand a doubled card can never meet against
singles, so every enlarged card was banished to the leftmost pair and
the wall read as a tower of wide cards with a card-wide gap held open
beside the normals. The coverage demand caps at ONE CARD-ROW now
(cw × 1.33 + g): a lane a full row past the seat's top already faces
the card with content, and the room below is the wall's ordinary
next-flow space — the same air the leftmost seat would leave on the
other side, never a NEW pocket. The indent stays banned exactly as
before (a card no taller than a row speaks the 1.8.2 verdict
byte-for-byte); a tall wide card wraps the row instead of towering
past it — the enlarged cards sit side by side dead under the normals,
and the gap closes.

Built on the 1.9.14 line ("The Shadow Keeps Its Ink" — the shadow's
own ink law carries forward into this tree; the 1.9.14 release was
never published to GitHub, and the numbering keeps its build: 1.9.15
is the next seat).

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


CHANGELOG_ENTRY = """## 1.9.15 — The Wide Card Wraps the Row

Two laws, one wall, one bar.

- **The viewer's hint is retired** ("in full image viewer, remove the text bottom right 'drag to pan · zoom with the keys or +/− · right-click for options · do.u. etc'"): the usage line is gone with its whole right zone — the bottom bar keeps the same 1fr · auto · 1fr grid, so the [previous · CURRENT · next] trio stays dead center with the count and zoom keys holding the left end, and the stage keeps speaking its controls the way it always did without a caption: the keys, the drag, the right-click menu.
- **The wide card wraps the row — the 1-card gap beside the normals is closed** ("lets say in a class there is 4 normal cards (3:4 small size), then after them there is a card (16:10 enlarged) and a card (3:4 enlarged card), enlarged as in right click then enlarged, for some reason the cards wont stay next to the 4 normal cards, instead leaving exactly a 1 card gab inbetween"): reproduced pure in the packer — four 3:4 normals (293px) then a 16:10 enlarged (290px) and a 3:4 enlarged (566px). The 1.8.2 strand guard demanded every lane left of a rightward pair be stacked past the wide card's FULL floor, and a doubled card is taller than the singles around it by construction, so the demand could never be met: every enlarged card was banished to the leftmost pair, the second one dropping a whole row below the first — a tower of wide cards with the card-wide gap held open beside the normals (the estimate phase even packed the pair side by side first, then the ResizeObserver told the truth and the re-flow collapsed the row into the tower). The demand caps at ONE CARD-ROW now (card width × 1.33 + gap — the wall's own visual row): a lane stacked a full row past the seat's top already faces the card with CONTENT down to the row line, and the room below it is the wall's ordinary next-flow space — the same air the leftmost seat would leave on the other side, never a NEW pocket beside the card. An INDENT (a lane ending inside the card's first row — the 1.8.2 report's tucked seat) stays banned exactly as before: for a card no taller than a row the cap IS the card's own height and the guard speaks the 1.8.2 verdict byte-for-byte (the 183-era walls re-verified: two normals + a short wide keeps its leftmost seat, the flank-covered indent keeps its word, the single-span packing is untouched). A tall wide card wraps the row instead of towering past it — measured after: both enlarged cards sit in the SAME row directly under the four normals (side by side at 0 / 2×stride, flush at the normals' floor), the estimate-phase pack and the measured pack agree on the same seats (no re-flow flip), and on a wall with room to spare the 16:10 rides the top right beside the normals in reading order. The gap closes.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.14",', '"version": "1.9.15",')
    sub("package-lock.json", '"version": "1.9.14",', '"version": "1.9.15",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.14',", "version: '1.9.15',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.15 — The Wide Card Wraps the Row" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.14 — The Shadow Keeps Its Ink"), "changelog head is not the 1.9.14 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats (the version numbers only, per the owner's word)
    sub("README.md", "**v1.9.14**", "**v1.9.15**")
    sub("README.md", "version-1.9.14-purple", "version-1.9.15-purple")
    sub("README.md", "88 DOM/source test suites", "89 DOM/source test suites")
    # the battery runner welcomes the 1915 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1915_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1914_batch_dom" in raw, "runner missing the 1914 seat"
        raw = raw.replace("gendex_1914_batch_dom", "gendex_1914_batch_dom gendex_1915_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.15 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
