#!/usr/bin/env python3
"""1.9.6 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_197.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_197.py). The
compression@1.8.2 dependency lesson holds: only the app's OWN version seats
move.

1.9.6 — THE CERTAIN INK, built on the 1.9.5 yielding coat: five laws. The
ink's contrast is guaranteed at its own derivation (the light ground's
shadow twin — no more blend-flip whack-a-mole that traded one vanished
family for another); the coat's volume SPLITS (a checkbox + a second
transparency slider that speaks the image alone); the wall FOLLOWS the open
card through the panel's flight; the side panel's own scrollbar breathes;
and the tag emblems fit their containers and gain their polish.

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


CHANGELOG_ENTRY = """## 1.9.6 — The Certain Ink

Five laws — the ink's contrast is guaranteed at its own derivation, the coat's volume splits in two, the wall follows the open card, the side panel's bar breathes, and the tag emblems take their seat.

- **The certain ink** ("the same issue still occurs, but its specific to when i make the card color to the white, aka brightness, the bloom effects in numeix theme dissapear, nuri's effect becomes invisible/negative, foil effects are invisible unless i make the card color darker instead of lighter/hue, auric becomes invisible when i do bright white, prismatic stars becomes invisible when i lean towards the left half of the color wheel, and then the rest of the effects become invisible when i get closer to the brightness, holographic becomes invisibel, fix that, etc in other finishes, fix that, i suspect its related to a change u did to the finishes where they would be visible regardless of color or would be affected by the card color better to the point they broke, i wat you to account for tht e specially so values dont loop or these mistakes occur for fucks sake"): three passes of blend flips (1.9.3's screen-to-multiply, 1.9.4's crushing brightness(0.55) filter, 1.9.5's body-retirement) each traded one vanished family for another because every pass re-BLENDED an ink whose COLOR had already drifted into the plate — a cream mixed 44% toward a white card IS white (multiply prints a whisper, screen prints identity), the pale anchors carried the plate's own lightness under every flip, and the bodies left on their native soft-light/overlay seats spoke IDENTITY on white outright: the whole report, one disease. The cure moves to the ink's own derivation, spoken once for every seat at once. Every tint-leaning stop in every material now reads the tint through --gd-tint-hand, which the light ground re-speaks as the plate's SHADOW TWIN (finishInkTwin in TagRibbon: the same hue, the same saturation, lightness compressed by one monotone rail — L' = 0.5 + (L - 0.5) * 0.3, white speaks a 65% gray shadow, the 0.78 rail a 58% one): the inks ARRIVE at the plate already carrying the contrast no blend could lend them — no per-family exceptions, no threshold to loop past, exactly the "values dont loop" the report demanded. With the ink carrying its own contrast, every plate coat seat speaks multiply on the light ground alike (the bodies rejoin the stack they were retired from — their twin-mixed washes land as gentle colored tints, never the 1.9.4 coffee, because the crushing FILTER is gone), the forge's veil alone keeps its overlay seat (its ink is the twin itself — overlay with a dark top deepens a bright plate, and the white-wash "negative" the raw tint printed on white retires with it), and the ONE family that keeps a filter is the white-ink seats (prismatic's stars/particles/waves/sweep, holographic's shards/dots/riot tile, foil's rings and sparkle lattice): their ink is white by design, no tint to twin, and multiply(white) is identity — the one honest shadow a white light can speak on a bright plate is GRAY, so those seats alone carry brightness(0.55) saturate(1.18) (the silver-facet law: the stars read as the plate's own pale steel). Numeix's dapple alone gains a scoped 1.6 opacity lift (the 1.6.4 canopy-thinning answered a MID plate; a 20%-alpha shadow on white needed the louder voice to read at all — the knob's 0 and 1 rails hold exact). The plate's own light keeps its word (measured: the coated card keeps well over 70% of the bare plate's luminance, where the 1.9.4 stack crushed it toward 40%), and every family in the wall answers on the bright plate: the blooms bloom, the forge burns tinted, the metal shows, the honey lands, the riot reads, the rainbow speaks — none of them black, none of them gone.
- **The split volume** ("add a checkbox that adds another transparency slider, but this slider affects the transparency of teh finishes on the image itself, so main one would affect both normally, but when checked the main one will only affect the finishes over the trim and the card, but the second one will affect the finishes over images etc.."): the coat's volume SPLITS. A checkbox in the shared finish section (CardStyleControls — the one voice both the creation window and the edit card window speak, seated beside the reach switches with the family's grey-out law while there is no image or IMAGE EFFECT is off) arms the split and ADDS the second slider — "Image transparency", 0..1 born at the same 15% the main knob speaks (arming it changes nothing until the second slider moves). While the split holds, every full-face coat seat renders as TWO complementary twins (the plate twin wearing the plate-only mask — the MAIN knob's ink over the trim and the card; the art twin wearing the art zone's own mirror mask — the SECOND knob's ink over the picture), both sharing the same geometry and phase so the pattern continues across the notch seam exactly as the 1.4.0 one-seat law promised; the artfin sprite washes read the image knob through a local --gd-fin-strength override (the .gd-fin-split scope — the one place a custom-property re-speak switches a whole family's volume without touching a single keyframe). cardFinishSplitImage + cardFinishImageTransparency ride the card object through CREATE, DONE and every sanitize rail; a card saved before the split was born opens at OFF + the shared default.
- **The wall follows the open card** ("when opening a card and the cards viewer would resize to fit the cards in as the right panel comes into view, it should still scroll to follow the selected card so its fully in view, currently its chaotic, should also apply when opening a card thats half out or such"): the panel's width flight re-packs the wall (a column crossing springs every card to a new seat) and the opened card could land anywhere — half under the fold, fully past it, the "chaotic" jump the report names. The wall now keeps the open card in view through every move it can foresee: the scroller's own resizes re-assert the card's full visibility with a DIRECT minimal scroll each ResizeObserver beat (the card reads as PINNED while the wall breathes under it — smooth by construction, never two clocks fighting), the pack's own changes re-assert the frame after, and the selection's own change (opening a card that sat half out, or switching to a distant one) settles with ONE smooth eased call — a card already fully visible never moves a pixel, and a selected card the virtual window holds out is scrolled to by its packed seat so it mounts on arrival.
- **The side panel's own bar breathes** ("when switching between cards, the scrollbars if transitioning (aka if the card they are switching to invalidates them, whether its low amount to alot of amount or high amount to low amount) it should not just snap the items in the side pannel, it should expand smoothly or retract smoothly simmilar to the fade and right and left buttons"): the right panel's root scroller joins the family the version strip already speaks (1.7.0) — switching cards swaps the panel's whole content height in one render, the bar used to take (or hand back) its 10px gutter in a single frame, and every row under the sticky header SNAPPED sideways with it. The bar grows and shrinks through its own 0.18s tween now and the content takes its place frame by frame, the same breath the fades and the strip's arrows ride. The hook itself learns the deeper law: a fixed-height scroller never resizes when its CONTENT grows or shrinks, so the observer now watches the content wrapper too — every driver the deps could forget (a notes field growing, an image landing, a tab swapping) flips the bar through the tween instead of the snap.
- **The emblems take their seat** ("emotes clip outside of the tag containers on the card, fix that so they dont (especially on special shaped ones like bead and v), and while you are at it, improve their apperance so they dont look too plain"): the tag's emblem used to paint at ONE fixed size no matter which shape carried it — full-width bodies swallowed it fine, but the V's converging sides and the bead's round heart are narrower than the emblem's own box at almost every scale, so the mark's corners rode past the outline (measured at scale 1: a 12px glyph's bottom corners sat ~1.5px past the V's sides; the bead's corners poked past its circle at every scale below 1.1, rim and all). Every trim now derives the LARGEST emblem its own geometry honestly holds — the V's inscribed box against its sloped sides (solved exactly at the glyph's own bottom edge, stroke + rim margin paid), the bead's inscribed square inside the circle, the full-width bodies their straight inner width — and the seat centers the fitted mark the way each family always spoke it. And the emblem gains its polish: a soft under-shadow lifts it OFF the folded ribbon the way raised enamel sits on stamped material, a faint luminous halo (sized to the emblem's own measure) lays its light behind it — the mark reads as lit, never as a flat stencil printed on the strip.

## 1.9.5 — The Yielding Coat"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.9.5",', '"version": "1.9.6",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    # exactly the app's two seats speak 1.9.5 head-first (a dependency that
    # happens to carry the same number keeps its own version — the 1.9.3
    # pass's own lesson; str.replace(count=2) takes the two leading app
    # seats alone)
    n = raw.count('"version": "1.9.5"')
    assert n >= 2, "expected the app's two lock seats"
    raw = raw.replace('"version": "1.9.5"', '"version": "1.9.6"', 2)
    assert raw.count('"version": "1.9.6"') >= 2
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")

    sub("src/constants/index.js", "version: '1.9.5',", "version: '1.9.6',")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.9.5 — The Yielding Coat", CHANGELOG_ENTRY)

    # the README: the public face's own seats (badge line, shield, battery
    # count — the suite the battery welcomes is gendex_197)
    sub("README.md", "**v1.9.5** · a local card & prompt-version tracker", "**v1.9.6** · a local card & prompt-version tracker")
    sub("README.md", "version-1.9.5-purple", "version-1.9.6-purple")
    sub("README.md", "the regression battery (79 DOM/source test suites)", "the regression battery (80 DOM/source test suites)")

    print("\n1.9.6 furniture seated.")


if __name__ == "__main__":
    main()
