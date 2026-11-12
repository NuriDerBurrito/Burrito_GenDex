#!/usr/bin/env python3
"""1.9.12 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1912.py, and the 1912 suite is born
speaking 1.9.12 — the sweep excludes it by law, exactly as the 1911 suite
was born excluded at 1.9.11).

1.9.12 — THE RESTING STATE, four laws: the ledger's dial waits for the
okay ("when changing how many lines the log should contain it activates
instantly, it shouldnt do that it should only update after i press on
okay, since currently if i type 60, it applies 6 first and deletes the
rest"), the finish rim survives any selection ("when i select 'ALL
cards , x cards' on top bar still, it removes the outline around the
date and the title of the cards in the cards viewer" — probed live: a
whole-document sweep kills every text stroke mid-selection, so the rim
now rides an 8-way contour in its own color through the highlight), the
still wall is the default ("the live drag previews option default should
be off"), and the press speaks only when asked ("add an option for the
squish/stretch animation when clicking on a card in settings, the option
should allow to either (squish (current) / pulse / none) with the default
being none (meaning also add a pulse animation)" — the bloom born, the
jelly optional, the silence default).

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


CHANGELOG_ENTRY = """## 1.9.12 — The Resting State

Four last answers, each at its root — and the app learns to rest.

- **The dial waits for the okay** ("when changing how many lines the log should contain it activates instantly, it shouldnt do that it should only update after i press on okay, since currently if i type 60, it applies 6 first and deletes the rest"): the 1.9.11 dial committed every keystroke that parsed — typing "60" landed "6" the instant it parsed, and the trim effect cut the ledger to 6 ON THE SPOT; the "0" that followed could only ever re-raise the ceiling, never recover the lines the "6" had already deleted. The field is a pure draft now: no keystroke writes the setting, nothing trims, nothing is lost mid-type — the ONE commit is the DONE key itself (clamped whole, landed before the window closes so the trim happens after it is already gone), Enter inside the cell rides the same road, blur only normalizes the field's shape without writing, and ESC / CANCEL never see the draft at all. A pending draft speaks through the DONE key's own 1.2.9 law (the solid accent asks for the save), and CANCEL's tooltip stays honest — a draft that never landed simply dies with the window.
- **The rim survives the sweep** ("when i select 'ALL cards , x cards' on top bar still, it removes the outline around the date and the title of the cards in the cards viewer"): the 1.9.11 cure spoke for the OUTLINE FORMAT seats alone; this report named the FINISH RIM — the opposite-ink stroke a coat lends the title, date, badge and stamp — a seat no ::selection rule ever covered. Probed live in the app's own Electron (42.9.3): a selection confined to the top bar's label holds the rim byte-for-byte, but a WHOLE-DOCUMENT sweep (Ctrl+A, or a drag that runs past the header's edge) kills every text stroke inside the selection's painted span — the engine never paints a text stroke mid-selection, the same law the 1.9.11 rounds proved — so every rimmed title and date in the viewer lost its outline the whole time the selection stood. The rim now speaks the 1.9.11 law at its own four seats, both floors (the box's own ::selection for the bare text and the truncate's dots, every descendant's for the rich runs): the letters keep their exact resting ink, the stroke's width stands down, and the rim's own color carries the ring through the highlight as an 8-way text-shadow contour at the rim's own scaled width — the one channel the engine does paint under ::selection (proven with a magenta witness: the stroke dead at 0 red pixels, the contour painted in its seat, the fill never moving). The outline format's own runs are scoped out — their 1.9.11 cure keeps its contour verbatim — and with LIVING FINISHES off the contour stands down with the stroke it replaces (an outline that does not exist never paints one mid-sweep).
- **The still wall is the default** ("the live drag previews option default should be off"): the LIVE DRAG PREVIEW switch now rests at OFF — fresh databases hold the wall still through a card drag (the hovered card's edge glow marking the seat, the reorder landing with the release as one animated commit), and every read speaks the === true polarity so a missing key never previews. A stored choice keeps its own, the house law every default flip has ever spoken.
- **The press speaks only when asked** ("add an option for the squish/stretch animation when clicking on a card in settings, the option should allow to either (squish (current) / pulse / none) with the default being none (meaning also add a pulse animation)"): PRESS ANIMATION joins Settings → Cards — SQUISH, the 1.4.0 jelly exactly as it always flew; PULSE, the new bloom (one soft uniform swell in place, no squash, 380ms of compositor-only `scale`); NONE, silence — the default, for fresh databases and every pre-1.9.12 save alike. The dial rides the same root-attribute lane as the shine family (App arms data-gd-press-mode; the flights key on it in CSS), and the grid's own arm gate reads the same dial so 'none' never even sets [data-pressed] — no flight, no lingering ribbons-hold seat, the card holds perfectly still under the finger. The new-card tile speaks the same law, and every press still respects the button gates and the never-interrupted flight the 1.4.x laws spoke.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.11",', '"version": "1.9.12",')
    sub("package-lock.json", '"version": "1.9.11",', '"version": "1.9.12",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.11',", "version: '1.9.12',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.12 — The Resting State" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.11 — The Quiet Answers"), "changelog head is not the 1.9.11 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.11**", "**v1.9.12**")
    sub("README.md", "version-1.9.11-purple", "version-1.9.12-purple")
    sub("README.md", "85 DOM/source test suites", "86 DOM/source test suites")
    # the battery runner welcomes the 1912 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1912_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1911_batch_dom" in raw, "runner missing the 1911 seat"
        raw = raw.replace("gendex_1911_batch_dom", "gendex_1911_batch_dom gendex_1912_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.12 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
