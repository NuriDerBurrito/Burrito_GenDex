#!/usr/bin/env python3
"""1.8.8 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_188.py). The compression@1.8.2 dependency
lesson holds: only the app's OWN version seats move.

1.8.8 is THE FINAL RELEASE (built from the 1.8.6 tree, the 1.8.7 line
discarded): the one-file website retired with it (the repo ships as the app
alone), so this furniture pass carries NO website section for the first
time since 1.2.5.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    assert old in raw, f"{path}: missing seat:\n{old[:120]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


CHANGELOG_ENTRY = """## 1.8.8 — The Layout Census

Two answers — the version strip's arrows learn to read the layout instead of the paint, and the legal notice finally tells every platform and the library's whole history. The final release: the one-file website retired with it, and the repo ships as the app alone.

- **The census reads the layout, not the paint** ("when opening a card that has alot of versions that it has the left and right buttons for versions to scroll sideways, then switching to a version with small amount of versions, for some reason the arrows remain still even if there is nothing to scroll, fix the logic for that"): the old census read `el.scrollWidth` — the PAINT — and the paint lies while anything flies. The strip's own switch ceremony flies the trailing NEW VERSION key from the old card's seat to its new one (the 1.6.9 FLIP), and for the whole 0.15s glide the key's transformed box pokes past the content's end — the ENGINE counts that poke as scrollable ground (measured live on real Chromium: a short card with 0px of honest overflow reads 538px of scrollWidth while the flight lives), and every net the old law trusted spoke while the lie was airborne — the door-read at the commit, the MutationObserver's own childList beats, the one-shot rAF — all mid-flight, all lighting the edges over a rim that dies before the paint dries. One settle re-read 200ms later was the only truth-teller, a clock the switch's own busy breath (the new card's images decoding, the swap fade, the panel's own work) regularly outruns: the flight outlives the knock, the last word was spoken mid-lie, and the arrows stand guard over a scroll that ended before they were born — nothing ever speaks again. The census now reads the LAYOUT: the chips' own seats (`offsetLeft + offsetWidth` — transform-blind by construction, the same law the FLIP itself measured its seats with, and scroll-blind besides) never wear a flight, so the truth no longer depends on WHEN it is read — the first read at the switch's own door already speaks the settled word, and the arrows retire in the same breath the short card arrives, however busy that breath is. The census speaks a WORTH threshold beside — a third of a chip (24px), the smallest travel the eye ever reads as a page worth turning; a short card's strip presses within a few pixels of the frame's edge (the chips' gaps, the NEW VERSION key's own width), and a rim's shave under it is not overflow at all: no arrows, no fades, no dead keys borrowing a clamped offset. THE STALE SEAT RETIRES WITH ITS CONTENT: a shrunk strip's old offset (the long card's scroll, the center-scroll's landing) can outlive the content that earned it — the engine clamps it only at its own leisure — so the read pins it to the fresh truth itself (an idempotent write), guarded twice because both guards were earned: never on a scroll beat (the auto-pan's own writes must not fight the census mid-drag) and never while a sort drag lives (the dragged chip's poke is a flight, not a seat — the body's own gd-sort-live word). THE CONTENT SPEAKS FOR ITSELF (the MutationObserver on childList + characterData, attributes deliberately unwatched — not because the census fears a transform now, it cannot see one at all, but because the observer has no business sitting in the drag's pocket), the box RO and the one-shot rAF keep their seats, and the settling re-read 200ms after the swap stays as insurance — every read speaks the settled word now, the second knock is for the engine's own lazy clamps.
- **The notice tells every platform, and the database's whole history** ("update the tos and data privacy like you did"): the terms move to 1.0.4 — a meaningful change, so every library meets the gate once more. The privacy notice used to tell every reader where their data lives through Windows eyes alone (%APPDATA% and nothing else); macOS and Linux users now see their own seats beside it (~/Library/Application Support/Burrito GenDex, ~/.config/Burrito GenDex). The storage story finally tells its whole history: today's library is ONE plain human-readable JSON file (openable, inspectable, copyable with any text editor), while the older releases kept theirs in a SQLite database file in the same folder — the notice now says what that old file is, that the current app never reads it, never writes it, and never sends it anywhere, and that it stays on the user's disk exactly as it was until they choose to delete it (the factory-reset note says the same). The terms speak the three platforms in their own local-data seat, and the whole document family carries the new version stamp.
- **The final release's own housekeeping**: the one-file website (the landing page the repo carried since 1.2.5) retires with the final version — the release ships as the app alone, and every suite's page-pins retired with the page; the README carries no private material (no passwords, no certificate paths, no signing commands — the recipe lives in RELEASE.md with placeholders only); the CI workflow's one unparseable step name is quoted so strict parsers take the whole file; and the battery welcomes its newest suite (gendex_189) with the census, the notice and the discarded-bezel guardrail pinned as laws.

## 1.8.6 — The Patient Wheel"""

README_PARA = """1.8.8 — the layout census. THE CENSUS READS THE LAYOUT, NOT THE
PAINT ("when opening a card that has alot of versions that it has the
left and right buttons for versions to scroll sideways, then switching
to a version with small amount of versions, for some reason the arrows
remain still even if there is nothing to scroll, fix the logic for
that"): the switch ceremony flies the trailing NEW VERSION key from
the old card's seat to its new one (the 1.6.9 FLIP), and for the
whole 0.15s glide the key's transformed box pokes past the content's
end — the engine counts the poke as scrollable ground (measured live:
a short card with 0px of honest overflow reads 538px of scrollWidth
while the flight lives), and every net the old census trusted spoke
while the lie was airborne, one 200ms settle re-read the only
truth-teller — a clock the switch's own busy breath regularly outruns,
leaving the arrows standing guard over a scroll that ended before they
were born. The census reads the chips' own LAYOUT seats now
(offsetLeft + offsetWidth — transform-blind by construction, the same
law the FLIP itself measured its seats with), so the truth no longer
depends on WHEN it is read: the first read at the switch's own door
speaks the settled word, and the arrows retire in the same breath the
short card arrives — with a WORTH threshold (a third of a chip, 24px)
so a rim's shave never counts as a scroll, the stale offset pinned to
the fresh truth (guarded off the scroll beats and out of every drag),
and a MutationObserver on the chips themselves re-reading the census
on every content change. THE NOTICE TELLS EVERY PLATFORM ("update the
tos and data privacy like you did"): the terms move to 1.0.4 — the
privacy notice now names the user-data seat on all three platforms
(Windows %APPDATA%, macOS ~/Library/Application Support, Linux
~/.config) and tells the library's whole history: today's ONE plain
human-readable JSON file, the older releases' SQLite database file
left on the disk — never read, never written, never sent, free to
delete. The final release ships as the app alone: the one-file website
retired with it, and the README carries no private material.

1.8.6 — the patient wheel. THE SILENT ASCENT ("currently when i"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.8.6",', '"version": "1.8.8",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    assert raw.count('"version": "1.8.6"') == 2
    raw = raw.replace('"version": "1.8.6"', '"version": "1.8.8"', 2)
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.8.6',", "version: '1.8.8',")

    # the README: header, the new paragraph, the battery count
    sub("README.md", "**v1.8.6**", "**v1.8.8**")
    sub("README.md", "1.8.6 — the patient wheel. THE SILENT ASCENT (\"currently when i", README_PARA)
    sub("README.md", "the regression battery (70 DOM/source test suites)", "the regression battery (71 DOM/source test suites)")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.8.6 — The Patient Wheel", CHANGELOG_ENTRY)

    # 1.8.8 — THE FINAL RELEASE: no website furniture (the folder retired
    # with the final version; the suites' page-pins retire separately in
    # retire_web_pins_188.py)

    print("\n1.8.8 furniture seated.")


if __name__ == "__main__":
    main()
