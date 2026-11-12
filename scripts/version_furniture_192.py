#!/usr/bin/env python3
"""1.9.2 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_193.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_193.py). The
compression@1.8.2 dependency lesson holds: only the app's OWN version seats
move.

1.9.2 — THE LISTENING GROUND, built on the 1.9.1 document house (the
journal engine, the translation door, the paint-gated reveal — all riding
untouched): one law. The finish's own ground for colorless cards stops
being a fixed hex plate and becomes a color-mix over the theme's own
panel — the coat's materials keep their receptive plate, the card's face
speaks the theme's color itself, and no bright paper plate ever lands
inverted in a dark theme again.

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


CHANGELOG_ENTRY = """## 1.9.2 — The Listening Ground

One law — the coat's ground finally hears the cloth it paints on. A colorless card wearing a finish speaks the theme's own color now, material and all, and no bright paper plate ever lands inverted in a dark theme again.

- **The ground listens to the cloth** ("when applying finishes to colorless cards (aka cards defaulted to theme color) it should react to the theme color itself, since for some reason in finishes such as numeix finish would make it inverted or not react to the color correctly, fix that so it does"): the 1.7.4 law gave every finish a receptive plate for the blend-mode washes to burn on — but the plates were FIXED HEXES (numeix's bright parchment #e9dec4 among them), so an uncolored card wearing a coat spoke the COAT's own plate no matter what cloth the app wore: a light paper card planted in a dark theme read as INVERTED, and a Manual Colors drag never moved it ("not react to the color correctly"). The fixed plates retire: every ground is now a color-mix over var(--gd-panel) itself — the theme's own cloth carrying the material's hue lean (numeix's warm parchment, foil's violet metal, auric's honey, the deep plates for holographic, prismatic and nuri), mixed at a light hand for the pale materials and a heavier one for the deep ones. The ground follows the theme's own LIGHTNESS direction (a dark theme paints a dark warm paper, a light theme a light one — never an inversion again), and because the mix reads the live CSS var it answers a theme switch AND a Manual Colors drag in the same frame, no re-render owed. The ink seats that used to derive their text from the ground's own hex fall to the theme's own tokens — the plate's printing speaks the theme's panel text, the rim the theme's counter rim, the badge the theme's accent — the same voice an uncolored card without a coat always spoke, honest on any cloth because the ground IS two-thirds that cloth. The nuri lean and the foot plate's corner rise read the mix through --gd-card-tint / --gd-foot-plate exactly as they read a hex (both vars are consumed inside color-mix expressions in index.css, and a nested mix is a legal color), and a picked cardColor keeps every word it always spoke — the ground only ever arrives when the card itself is colorless. Every card surface speaks the one law: the grid card, the look editor's panzoom, and the compact preview. The battery welcomes its newest suite (gendex_193) with the ground's own laws pinned.

## 1.9.1 — The Paper House"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.9.1",', '"version": "1.9.2",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    # 3 seats speak 1.9.1: the app's own two (root + packages."") plus
    # ipaddr.js's unrelated birth version — only the app's two move.
    assert raw.count('"version": "1.9.1"') == 3
    raw = raw.replace('"version": "1.9.1"', '"version": "1.9.2"', 2)
    assert raw.count('"version": "1.9.1"') == 1
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats; ipaddr.js untouched)")
    sub("src/constants/index.js", "version: '1.9.1',", "version: '1.9.2',")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.9.1 — The Paper House", CHANGELOG_ENTRY)

    # the README: the public face's own seats (badge line, shield, battery
    # count — the suite the battery welcomes is gendex_193)
    sub("README.md", "**v1.9.1** · a local card & prompt-version tracker", "**v1.9.2** · a local card & prompt-version tracker")
    sub("README.md", "version-1.9.1-purple", "version-1.9.2-purple")
    sub("README.md", "the regression battery (75 DOM/source test suites)", "the regression battery (76 DOM/source test suites)")

    print("\n1.9.2 furniture seated.")


if __name__ == "__main__":
    main()
