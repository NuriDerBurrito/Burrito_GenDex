#!/usr/bin/env python3
"""1.9.5 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_196.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_196.py). The
compression@1.8.2 dependency lesson holds: only the app's OWN version seats
move.

1.9.5 — THE YIELDING COAT, built on the 1.9.4 faithful coat: three laws.
The plate's own light is sacred under a coat (the broad bodies retire from
the light-ground multiply stack, the ink's filter gentles from the crushing
brightness(0.55) to brightness(0.74)); the coat gains a VOLUME KNOB of its
own (the transparency slider in the card creation window and the card edit
window, 0..1 with a 15% default); and the X's cut flat (butt caps) and one
step heavier.

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


CHANGELOG_ENTRY = """## 1.9.5 — The Yielding Coat

Three laws — the plate's own light is sacred under a coat, the coat gains a volume knob of its own, and the X's cut flat.

- **The plate's own light is sacred** ("for some reason in some finishes such as nuri finish, when applying a card color so high to the top, aka bright and high saturation, it would darken the card color and then make teh effects darker for some reason, fix that" + "effects still vanish vin bright deep playes, aka issue one, when its too bright it becomes black, fix that"): the 1.9.4 ink law answered the vanished glints by turning the masked seats into the plate's own colored shadows — but it classed the broad BODIES with the details, and the bodies carry the coat's whole wash: on a plate the rail catches as light (a white, a gold, a bright saturated yellow) the multiply stack compounded — body over licks over sparks over flare, each printing its brightness(0.55) shadow over the last — until the plate's own light was crushed (a white numeix card read as dark coffee; a gold nuri card as deep umber; "when its too bright it becomes black"). The bodies retire from the light multiply stack now — numeix's paper, auric's honey, foil's metal and nuri's forge wash keep their NATIVE seats (soft-light for the paper, the honey and the metal — foil's own 1.4.7 tint law, never a shade — and overlay for the forge's wash: a wash over a bright plate is the whisper it always was, and the card keeps its own color), the detail inks keep the multiply flip but their filter steps up to brightness(0.74) saturate(1.5) — the glints return as gentle colored ink, present and never black — and the forge's veil loses its light-ground multiply flip (it only ever darkened the re-inked fire it was meant to tint, "make the effects darker" in the report's own words). The hue-riding bodies (holographic, prismatic) keep the light multiply — their streaks ride at low alpha and tint a white plate into a pastel riot without ever crushing it.
- **The coat's own volume** ("finish effects are a bit too clear now on the cards like prismatic effects and such, you may add also a transparency slider for the finishes in order to control it, add that slider in the card creation window and card edit window"): the coat's clarity is a knob on the card itself — cardFinishTransparency, 0 (the full coat, every word the material ever spoke) to 1 (clear glass), born at 15% — the report's "a bit too clear" answered at the default seat, one slider-move from either extreme. The slider rides the SHARED finish section (CardStyleControls — the one voice both the creation window and the edit card window speak), seated under the picker with the family's grey-out law while no finish is picked; the coat seats read it as --gd-fin-strength on the card root (every surface writes it beside --gd-card-tint: the grid card, the look editor's panzoom, the compact preview — and both windows' previews paint the DRAFT, so what you slide is what you ship). The fade is the PREMULTIPLIED kind — each seat keeps its own blend word against the plate, the whole ink simply softens by the knob — reaching every coat seat, the sprite's own wash (the three artfin breath clocks carry the var inside their keyframes, the one place an animated opacity would shout over the base seat) and the trim coat alike. A card saved before the knob was born opens at the softened default; the value rides the card object through CREATE, DONE and every sanitize rail.
- **The X's cut flat** ("xs in numeix theme should not be round edged and should also be slightly more thicker again"): the 1.9.4 round caps left the true-X glyph with soft pebble tips. Every stroke cuts FLAT now (stroke-linecap butt — the square ends the ✖ itself wears) and the whole band steps up once more (×~1.14, 3.3-5.2 on the same 12-20px spans): the flat cut retires the cap's half-stroke extension, so the heavier stroke keeps the mark's full presence — the varied sizes, the three depth tiers and every clock keeping their seats.

## 1.9.4 — The Faithful Coat"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.9.4",', '"version": "1.9.5",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    # exactly the app's two seats speak 1.9.4 head-first (the third is
    # @types/serve-index@1.9.4 — a dependency that keeps its own version,
    # the 1.9.3 pass's own lesson; str.replace(count=2) takes the two
    # leading app seats alone)
    assert raw.count('"version": "1.9.4"') == 3, "expected the app's two lock seats + serve-index's own"
    raw = raw.replace('"version": "1.9.4"', '"version": "1.9.5"', 2)
    assert raw.count('"version": "1.9.4"') == 1
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.9.4',", "version: '1.9.5',")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.9.4 — The Faithful Coat", CHANGELOG_ENTRY)

    # the README: the public face's own seats (badge line, shield, battery
    # count — the suite the battery welcomes is gendex_196)
    sub("README.md", "**v1.9.4** · a local card & prompt-version tracker", "**v1.9.5** · a local card & prompt-version tracker")
    sub("README.md", "version-1.9.4-purple", "version-1.9.5-purple")
    sub("README.md", "the regression battery (78 DOM/source test suites)", "the regression battery (79 DOM/source test suites)")

    print("\n1.9.5 furniture seated.")


if __name__ == "__main__":
    main()
