#!/usr/bin/env python3
"""1.9.7 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_198.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_198.py).

1.9.7 — THE CORNERED INK, built on the 1.9.6 certain ink: five laws. The
color wheel's four extreme corners can no longer swallow or invert a coat
(the twin measures in perceptual luminance with a guaranteed distance on
both sides of its one seam, the grounds follow that same seam, the light
ground speaks normal where the plate is bright, and the vivid class
retires into the screen family); the tag emblem speaks its plain truth
(the mark and its rim alone — the halo and the under-shadow retire); the
class's own container follows the cursor; and the selected lane speaks
its accent at a visible volume.

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


CHANGELOG_ENTRY = """## 1.9.7 — The Cornered Ink

Five laws — no corner of the color wheel can swallow a coat again, the tag emblem speaks its plain truth, the class's own container follows the cursor, and the selected lane says its name at a volume the eye can hear.

- **The cornered ink** ("the effects vanishing or becoming inverted or turn from white to black when the color is going to high saturation or high brightness or low brightness or low saturation (aka if i pull the color wheel to the most extreme 4 corners, top left or top right bottom left bottom right) they always break, and it varries between finishes how they break, some effects become invisible, some turn from bright white to dark black, some just shift in hue weirdly, please test each finish with different colors (especially yellow in the color suggestions) and fix this, i dont wanna see this issue anymore because this project has become too long"): the 1.9.6 twin spoke its rail in HSL lightness, and the wheel's own geometry wrote the blind corner — every FULLY SATURATED color sits at HSL L = 0.5 exactly, so the pure hues with high luminance (the suggestion palette's own #ffd400 sunburst, the #ffff00 yellow, the greens and cyans) classed LIGHT yet passed through the twin untouched: the inks arrived at the yellow plate carrying the plate's own yellow, and every seat whispered (measured across the corner matrix: whole families at a fraction of their voice, six coats fully vanished on the pure reds and magentas, black-banded rainbows on the yellows). The corner audit now measures EVERY finish against the four corners and the whole suggestion palette — 408 pixel checks — and the law that answers it is one line, spoken at every seat at once. THE TWIN MEASURES IN LIGHT: the derivation reads perceptual LUMINANCE (the ground classes' own yardstick), the bright half of the wheel speaks the shadow twin (the 1.9.6 compression where it carries — white keeps its measured 65% gray — floored so the mid-bright band never thins: every bright plate a full 16% of light away from its ink), the dark half speaks the lift twin (luma + 0.16 — the screen seats receive an ink that already carries its own light), the lightness itself SOLVED exactly by bisection against the twin's own luma curve, and the hand that mixes every stop reads it EVERYWHERE now (the 1.9.6 swap armed only under the light ground — the classless middle, the widest band the wheel owns, kept blending raw tints, and its pale half watched the light anchors wash into the plate). THE GROUNDS FOLLOW THE TWIN'S OWN SEAM: the classes flip at luminance 0.5 — the exact line the ink's derivation already flips at, one law, one line — with a bright subclass past the old 0.78 rail where the white-ink seats' fixed gray facet owns its contrast; the VIVID class retires with the band it served (its overlay flip answered a mid-saturated plate the twin now answers better, and its screen family was already the dark family's own list: pure red, green and magenta — where overlay and soft-light both speak identity — wore no forge, no metal, no paper, no riot at all, measured ratio 0.0%). THE BRIGHT GROUND SPEAKS NORMAL: multiply was itself the final identity — on a channel-pure bright plate every channel the plate holds at 0 stays 0 under ANY same-hue ink, so a third of the ink's voice died with the dead channel (measured: numeix at mag 1.7 on pure green), and the hue-riding bodies re-hued against the plate (a yellow plate turned their blue bands BLACK, their magentas red — the "shift in hue weirdly" in the report's own words); over a white plate normal and multiply speak the SAME pixel — every word the 1.9.6 law measured on white keeps its seat — while normal never multiplies: the dead channels LIVE (a cream's blue reads on a yellow plate), the rainbow keeps its own hues, and the mid-bright half keeps its glows (the light-throwing seats keep their native screen, the broad washes multiply). The X signature signs in ink on the light ground (the calligraphic looms' cream anchors rode the cream-bright plates' own channels — the suggestion honey measured the family at its whisper; the marks deepen by a scoped hand while the glows keep their glow). THE DARK GROUND'S RINGS SPEAK: foil's concentric heart was never in the dark flip list — soft-light never lifts a black plate, so the metal's heart vanished there; it joins the screen family. Measured across the matrix (the four corners, twelve channel-pure hues, six deep saturates, the whole suggestion palette): every coat on every plate PRESENT, none crushed to black, none washed to negative, none sunk on the dark grounds, no hue inversions — 408 of 408.
- **The emblem's plain truth** ("the tags are semi worse below the emoji, as if there is a pale spot or a stain or shadow that is too large fix that so there isnt that, i want the emojie and the emojie outline and thats it, no shadows (on the tag ofc)"): the 1.9.6 polish seated a luminous halo behind the mark (sized 1.9x its own measure — the pale stain the report caught below the emoji) and an under-shadow beneath it, and both retire: the mark and its rim alone speak, exactly as asked — the fit law keeps every emblem inside its shape, the rim keeps its fence seat, and no light the tag never asked for paints below the emoji again.
- **The class's own container follows the cursor** ("when dragging a class around, the preview that follows the cursor is the class with background and so on as if its a cropped screenshot, fix that so its only the class container"): the browser's default drag image is a snapshot of the whole ROW — full sidebar width, the lane's wash edge to edge, the junction dot, the indent rail — a cropped screenshot of the sidebar, exactly as the report names it. The ghost is the class's OWN CARD now (the compact container: chevron, icon, name, count), handed to the cursor through setDragImage with the grab point at its leading edge — the row stays whole behind it, and what follows the pointer is only the class.
- **The selected lane speaks louder** ("when a class is selected and the accent color affects the background, make it a bit more visible since right now it somewhat blends in"): the 0.38.0 lane wash spoke the accent at 9% and the card at 14% — a whisper against the theme's own panel. Both step up a register (16% lane / 20% card, hover 24%), the lane's inset bar and the card's ring deepen with them, and the colored classes' selected ladder steps the same register so the two voices keep one law.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.6",', '"version": "1.9.7",')
    sub("package-lock.json", '"version": "1.9.6",', '"version": "1.9.7",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.6',", "version: '1.9.7',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.7 — The Cornered Ink" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.6 — The Certain Ink"), "changelog head is not the 1.9.6 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.6**", "**v1.9.7**")
    sub("README.md", "version-1.9.6-purple", "version-1.9.7-purple")
    sub("README.md", "80 DOM/source test suites", "81 DOM/source test suites")
    print("1.9.7 furniture seated: pkg x3, constants, changelog, readme x3")


if __name__ == "__main__":
    main()
