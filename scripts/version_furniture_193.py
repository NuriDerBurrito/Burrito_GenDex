#!/usr/bin/env python3
"""1.9.3 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_194.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_194.py). The
compression@1.8.2 dependency lesson holds: only the app's OWN version seats
move.

1.9.3 — THE SPEAKING COAT, built on the 1.9.2 listening ground: four laws.
The X's are true rotated-plus crosses at last; the three named coats
(numeix / foil / auric) speak the CARD'S OWN COLOR through the nuri mask
law; the extreme grounds (near-white / near-black / high-saturation
plates) can no longer swallow a coat; and the CREATE key returns to press
(the retained seat re-seeds the 1.8.6 wheel's latch on every open).

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


CHANGELOG_ENTRY = """## 1.9.3 — The Speaking Coat

Four laws — the coat finally speaks the color of the card it wears, the X's sign their true name, the extreme grounds can no longer swallow a finish, and the CREATE key returns to press.

- **The true X** ("the x's in numeix theme should be actual xs, not as in the letter but like rotated '+' so its a well fit as an x and doesnt feel stretched, it may be bigger or smaller in size thats it, should also be semi thick stroked not thin or bolded. aka '✖'"): the 1.6.7 calligraphic curves — four bowed arms pinching short of the heart, the glyph the eye read as stretched — retire wholesale. Every mark is a true rotated plus now: two straight diagonals crossing at the center, round caps, semi-thick strokes (2.4–3.5 against 12–20px spans, the weight between thin ruled lines and a bold ✖), the sizes still varied mark to mark and the three depth tiers still keeping their seats. The fall, the sway and the twinkle keep every word they spoke.
- **The coat speaks the card's own color** ("fix color dependency in finishes so they fit the card color"): the nuri law — the gradient-masked tint lean — reaches the three named coats. Numeix's every effect (the paper grain, the dappled sun, the streams, the X marks, the stars, the moon, the sprite's ink-light) leans the card's tint through --gd-card-tint while cream anchors keep the material's character, so the effect reads creamy IN the color of the card ("numeix should color its effects towards the card color instead of the creamy effect"). Foil's metal leans the same way at ~42–54% while the bright metal register keeps its gleam — a blue card's foil stays cold chrome, a red card's burns rose-gold, never "always towards blue". Auric's honey, gems, flakes, polish, summon and sprite wash lean at ~44–58% — never "yellowish" unless the card itself is. Holographic and prismatic keep every word they always spoke ("good as it is"); nuri already spoke the law.
- **The extreme grounds** ("in some color values especially when i lean towards black or white or high saturation, the finishes would dissapear or would be covered, fix that so they still are visible"): the seats class the picked plate — near-white speaks gd-fin-ground-light (the luminous screen seats and the soft-light bodies turn to multiply tints: light on white finally reads as color), near-black speaks gd-fin-ground-dark (the soft-light bodies turn to screen: the veil glows instead of sinking into black), high saturation speaks gd-fin-ground-vivid (the bodies turn to overlay: the plate's own saturation amplifies the wash's anchors instead of covering the coat). The X ink needs no law — its mid-tone anchors already separate from both extremes.
- **The CREATE key returns to press** ("im unable to create cards, the create button is not pressable/highlighted even tho we have nothing to prevent it"): the 1.8.6 wheel parked the retained creation window with its `creating` latch still true — nothing ever re-seeded it — so every open after the first create of a session greeted a CREATE key wearing the pressed loading face, unclickable and unhighlighted. The RESET law re-seeds the latch with every other draft field: each open is born with a key that takes the press, exactly the way the 1.5.4 law promised.

## 1.9.2 — The Listening Ground"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.9.2",', '"version": "1.9.3",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    # 3 seats speak 1.9.2: the app's own two (root + packages."") plus
    # serve-index's unrelated version — only the app's two move (the 1.9.2
    # pass taught the same lesson with ipaddr.js's 1.9.1).
    assert raw.count('"version": "1.9.2"') == 3, f"expected 3 seats, found {raw.count(chr(34) + 'version' + chr(34) + ': ' + chr(34) + '1.9.2' + chr(34))}"
    raw = raw.replace('"version": "1.9.2"', '"version": "1.9.3"', 2)
    assert raw.count('"version": "1.9.2"') == 1
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.9.2',", "version: '1.9.3',")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.9.2 — The Listening Ground", CHANGELOG_ENTRY)

    # the README: the public face's own seats (badge line, shield, battery
    # count — the suite the battery welcomes is gendex_194)
    sub("README.md", "**v1.9.2** · a local card & prompt-version tracker", "**v1.9.3** · a local card & prompt-version tracker")
    sub("README.md", "version-1.9.2-purple", "version-1.9.3-purple")
    sub("README.md", "the regression battery (76 DOM/source test suites)", "the regression battery (77 DOM/source test suites)")

    print("\n1.9.3 furniture seated.")


if __name__ == "__main__":
    main()
