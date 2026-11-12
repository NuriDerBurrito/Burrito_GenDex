#!/usr/bin/env python3
"""1.9.4 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_195.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_195.py). The
compression@1.8.2 dependency lesson holds: only the app's OWN version seats
move.

1.9.4 — THE FAITHFUL COAT, built on the 1.9.3 speaking coat: three laws.
The forge's own stripes (the body's heat veins, fire band and obsidian
weave) finally speak the card's color; the X's take their full weight
(~23-26% of their spans); and the ink itself speaks on the extreme
plates — every coat answers a bright or deep ground with visible,
colored presence, and the tone rail widens to meet the plates the eye
reads as bright before they reach the outermost extremes.

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


CHANGELOG_ENTRY = """## 1.9.4 — The Faithful Coat

Three laws — the forge's own stripes finally speak the card's color, the X's take their full weight, and no bright or deep plate can swallow a coat's ink again.

- **The forge's stripes lean too** ("i forgot about nuri's finish, nuri's finish background stripes still remain orange etc.. fix that to match color"): the 1.5.0 pass re-inked the licks, the sparks, the flare and the hearts, but the body's OWN washes — the crossed heat-vein lattices, the fire band, the obsidian weave — still spoke their fixed crimson / ember / gold stops on every card, and the 0.5 overlay veil could only tint their light, never re-ink them: the stripes the eye reads first stayed orange on a blue card. Every stop now speaks the premultiplied card-color law at the licks' own weight (the veins ~52-55%, the band ~48-50%, the obsidian ground ~22-24% — deep plates stay deep), and the veil steps down to a 0.4 wash so the re-inked fire reads through it. A blue card's forge burns blue-hearted from the stripes out; an orange card burns the pure gold it always did.
- **The X's take their full weight** ("the x's arent thick enough sometimes, fix that"): the 1.9.3 true-X band (2.4-3.5 on 12-20px spans) read thin at its floor — the smaller marks all but vanished beside their partners. Every stroke in both looms steps up to the ✖'s own proportion, ~23-26% of its span (2.9-4.6 on the same spans): still semi-thick, never bold, the round caps, the varied sizes, the three depth tiers and every clock keeping their seats.
- **The ink itself speaks on the extreme plates** ("when going with the card color too bright or such sometimes it makes some of its effect dissapear, such as white and numeix theme would make the glint/shine glow spots dissapear for example, check for all themes and fix that"): the 1.9.3 extreme-ground laws moved the BLEND, and the blend alone was half a cure — the card-color law had mixed every masked ink TOWARD the plate's tint, so on a white card the creams and gilts arrived carrying the plate's own lightness and multiply printed nothing (the glints, the shine, the bloom spots vanished exactly as reported), while the coats the pass never classed (the overlay bodies — nuri, holographic, prismatic, the prism's crystal — are IDENTITY over white and black alike) never spoke a word on the extremes at all. The ink learns to speak now: on light grounds every masked-ink seat carries brightness(0.55) saturate(1.35) — the glints return as the plate's own colored shadows — and the overlay coats flip to multiply, where their saturated anchors land on their own (the hue-riding bodies keep their clocks; their masked children darken with the family). On dark grounds the overlay bodies turn to screen and the forge's veil turns identity so it stops washing the fire it was only ever meant to tint. The tone rail widens with them (0.84/0.16 → 0.78/0.19) so the bright-but-not-white plates — a gold, a cream, a bright lilac — meet the ink law before their glints thin away. Every coat in the wall answers: numeix, foil, auric, holographic, prismatic, nuri.

## 1.9.3 — The Speaking Coat"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.9.3",', '"version": "1.9.4",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    # exactly the app's two seats speak 1.9.3 (the dependencies keep their
    # own versions — the 1.9.3 pass taught the same lesson with
    # serve-index)
    assert raw.count('"version": "1.9.3"') == 2, "expected the app's two lock seats"
    raw = raw.replace('"version": "1.9.3"', '"version": "1.9.4"', 2)
    assert raw.count('"version": "1.9.3"') == 0
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.9.3',", "version: '1.9.4',")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.9.3 — The Speaking Coat", CHANGELOG_ENTRY)

    # the README: the public face's own seats (badge line, shield, battery
    # count — the suite the battery welcomes is gendex_195)
    sub("README.md", "**v1.9.3** · a local card & prompt-version tracker", "**v1.9.4** · a local card & prompt-version tracker")
    sub("README.md", "version-1.9.3-purple", "version-1.9.4-purple")
    sub("README.md", "the regression battery (77 DOM/source test suites)", "the regression battery (78 DOM/source test suites)")

    print("\n1.9.4 furniture seated.")


if __name__ == "__main__":
    main()
