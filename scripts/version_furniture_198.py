#!/usr/bin/env python3
"""1.9.8 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_199.py, and the 199 suite is born
speaking 1.9.8 — the sweep excludes it by law, exactly as the 198 suite
was born excluded at 1.9.7).

1.9.8 — THE QUIET SEAM, built on the 1.9.7 cornered ink: four laws. The
wheel keeps its hue through the achromatic column (the black-to-white
drag no longer resets to red); the coat's polarity seam moves to the
quiet line where the glow's own voice has already faded (the center-top
pastel band keeps its glow — no more mid-drag inversion); the picture
keeps its own eye (the art twin speaks the coat's classic voice, the
plate's ground cures never again veil the sprite); and the class drag's
ghost is a static offscreen card (the weak CPUs' raster thrash retires
with it).

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


CHANGELOG_ENTRY = """## 1.9.8 — The Quiet Seam

Four laws — the wheel keeps its hue through the colorless column, the coat's polarity flips only where the glow has already faded, the picture keeps its own eye under every coat, and the class drag's ghost rides a static card the weak CPUs never chase.

- **The quiet seam** ("the finishes have the same issue but now its in middle way, aka the center top of the color picker it would get inverted, it relates to the background of the finish dissapearing then i assume"): the 1.9.7 corner law flipped the whole coat's polarity at luminance 0.5 — one law, one line — and the wheel's own geometry seated that line EXACTLY at the center-top pastel band for the hues the owner drags (a #8080ff plate measures luma 0.536, a #9a80ff one 0.56): mid-drag toward white the entire coat inverted at the band, measured on the owner's own sweep — foil spoke +0.15 of glow one step and -0.10 of ink the next, nuri's forge swung +0.29 to -0.17, and the broad washes the flip retired read as "the background of the finish dissapearing". The seam now sits at the QUIET line — luminance 0.70 — chosen where the glow's own reach has already whispered under 5% (a screen seat's word is (1-plate)(1-ink): past 0.70 even a full lift twin can barely speak), so the pastel band keeps the GLOWING voice it wore at the pure hue (character continuity across the whole drag: every center-top plate now measures its coat LIGHTER than the plate, the sweep's polarity column positive end to end), and the shadow twin only takes the hand near the wheel's bright edge, where the 1.9.6/1.9.7 white measurements already live and the owner already knows the ink's voice. The pure hues keep their measured seats (pure green 0.7152 and pure cyan 0.7874 stay above the line exactly as they sat; the yellow cure's #ffd400 never moves). The twin's rail and the ground classes still speak ONE law at ONE line — both now say 0.70 — no thresholds to loop past, no passthrough for any plate the wheel can name. Measured: the corner audit's whole matrix (the four corners, twelve channel-pure hues, six deep saturates, the entire suggestion palette) — 408 of 408, every coat present, none crushed, none washed, none sunk — and the new seam sweep (the owner's own drag, pure hue to white in ten steps on blue AND purple, plus the center-top row of every hue) reads the pastel band glowing end to end with the hand-off quiet.
- **The wheel keeps its hue** ("when pulling the color wheel from black to white it resets the color to red hue even if i was on some other color like blue or purple etc"): the hex the picker stores is the whole truth a gray can speak — #808080 carries no hue, and hexToHsv answers h: 0 (RED) for every achromatic value. The panel kept its own hue through a gesture, but every MOUNT (a popover reopened, a window re-seeded) re-derived the state from the stored hex — so a drag that passed through black or white landed the rail at red, and the next step out of the achromatic column spoke red tints instead of the blue or purple the owner was on. The wheel now carries a hue MEMORY — one module-level seat every picker panel in the app shares (the OS pickers' own law), written by every chromatic color the panels see (incoming or emitted) and by every turn of the hue rail itself; a colorless incoming (saturation under 2% — the black-to-white column, the grays, the pure whites) keeps the remembered hue instead of resetting to red. The SV field's own tint and the rail's dot read the same remembered hue, so dragging out of white returns to exactly the hue the owner left.
- **The picture keeps its own eye** ("finishes such as prismatic and holographic are too visible on images that it becomes too hard to see the actual image, as if the background of the finishes actually apply over the image, same goes for alot of the finishes, and that started happening a few updates ago"): the 1.9.6/1.9.7 extreme-ground cures (the twin's ink, the ground classes' blend flips) answer the PLATE's extremes — but they rode the CARD ROOT and reached the ONE full-face seat the coat wore over the picture, so the same flips that cure a white plate also flipped the coat's whole voice over the SPRITE: a normal-blended riot, a multiply wash, the twin's shadow ink, all painting their own alphas straight onto the image (measured on a generated sprite: prismatic veiled the picture at a mean 69.6 per channel on the pastel plate, and on white the silver facet ERASED holographic outright — 0.5, a coat simply gone). The pair that the split-volume law built (the plate twin masked below the notch, the art twin masked above it) now arms whenever a coat covers a real image — not only under the split's checkbox — and the ART TWIN speaks the coat's CLASSIC voice: its seats fall out of every ground-class flip (the :not(.is-art-zone) scope, the three child seats carrying it on their ancestor) and its hand falls back to the card's RAW tint (the artfin's own law, extended to the whole art half). The plate twin below the notch keeps every word the corner audit ever measured; the split checkbox keeps its own word unchanged (with it off both twins read the main knob; with it on the art twin reads the second knob exactly as it always did). Measured on the sprite across white / the pastel / the sunburst yellow: the veil retires where it veiled (foil 44.9 to 9.8, nuri 75.7 to 19.7, prismatic 69.6 to 25.1, holographic 24.9 to 6.0), the erased voices return (holographic on white 0.5 to 6.0), and the classic art voice is plate-stable again — prismatic speaks the same 25.1 on every plate instead of swinging with the ground classes — 44 of 44 checks.
- **The ghost is a static card** ("when dragging a class it becomes so laggy even when i let go on weaker cpus unlike before"): the 1.9.7 ghost handed setDragImage the LIVE card element — and a live-element drag image makes the browser track the seat through the whole gesture, while the drop highlight's setDrop wrote a fresh object on EVERY dragover tick (~100/s), re-rendering the sidebar and re-rasterizing the ghost's layer over and over — the weak CPUs the report names lived the whole drag behind the raster, and the promoted layers lingered a beat after the release. Two laws answer it: the ghost is a DETACHED CLONE seated offscreen (one static raster at dragstart, carrying the row's own color scope so the card reads exactly as the sidebar paints it — retired at dragend, drop, unmount, or the next gesture's fresh ghost), and the drop highlight only speaks when its seat actually CHANGES (the same row, the same zone, no re-render at all). The grab point keeps its 1.9.7 law — the card's leading edge, vertically centered — and what follows the pointer is still only the class.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.7",', '"version": "1.9.8",')
    sub("package-lock.json", '"version": "1.9.7",', '"version": "1.9.8",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.7',", "version: '1.9.8',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.8 — The Quiet Seam" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.7 — The Cornered Ink"), "changelog head is not the 1.9.7 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.7**", "**v1.9.8**")
    sub("README.md", "version-1.9.7-purple", "version-1.9.8-purple")
    sub("README.md", "81 DOM/source test suites", "82 DOM/source test suites")
    print("1.9.8 furniture seated: pkg x3, constants, changelog, readme x3")


if __name__ == "__main__":
    main()
