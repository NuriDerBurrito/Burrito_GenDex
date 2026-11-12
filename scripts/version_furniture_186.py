#!/usr/bin/env python3
"""1.8.6 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_186.py). The compression@1.8.2 dependency
lesson holds: only the app's OWN version seats move.

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


CHANGELOG_ENTRY = """## 1.8.6 — The Patient Wheel

Three answers — the scroll's ascent finally falls silent, the unselected outline answers the hand, and every loading road learns the wheel that outlives the freeze.

- **The silent ascent: expanding belongs to the hand alone** ("currently when i scroll up it opens the tags/stamps , fix that so the scroll upwards wont affect so (the tags/stamps collapse when scrolling down , thats correct and i love how it is now , but when scrolling up , i dont want to have it expand , instead expanding should just be manual by the user like usual)"): the whole 1.8.4/1.8.5 seat economy — the spacer below the header, the debt it held, the payer that wrote it frame by frame, the hem that called the loan back, the flow road's origin restore, the dead zone that guarded the restore edge, the manual dismissal that paid the standing loans — RETIRES with this report, because every piece of it served one promise ("the page's length never changes while the tray moves") whose bill always came due on the ascent: a debt standing is a geometric obligation, the seat's blank band showing below the stuck header the moment the scroll rises above the loan, so the tray HAD to expand — the exact behavior the owner retires now. The scroll speaks ONE direction: DOWN. Every fold rides the FLOW ROAD (the one the owner has loved from the top since 1.8.5 — the page shortens WITH the tray's own 0.24s tweened flight, the content rises into the space the tray vacates, monotonic, never a snap-back because nothing is ever paid at all), the journey's start still decides the gate (a journey from the top folds wherever its first tick lands; one begun mid-page stands down until the scroll passes the tray's hem — the between-band's own 1.8.4 ground, kept verbatim), and an up-tick answers NOTHING: the tray stays exactly as folded as the last down-tick left it. Expanding is the HAND's work again — the EXPAND chip below the folded plate, a row's own label toggle, the pin, the panel's wake — each one the state flipping open, the tray tweening out on framer + the CSS's own flights while the PAGE GROWS BACK WITH IT ("it effects the scroll when opening", the owner's own 1.8.5 word): the standard accordion breath, the content below pushing down exactly as it once rose. The preview column's pinned seat reads the header's own live height now (the header-plus-debt sum retired with the seat — through a fold the column rides the same tween the header speaks), the folded-rest cache is measured by a settle effect where the payer's retire clock used to sit, and the .gd-rows-seat + is-snap laws stay in index.css as the era's tombstones.
- **The outline answers the hand** ("prompt/note container have an outline , that outline dissapears when i hover over them (unselected ones , not selected ones) fix that so its visible and maybe reacts to it too"): the 1.8.5 pass saved the SELECTED outline from the deep hover's tie — and left the UNSELECTED row's own hover speaking the 1.8.3 law ("the row hover's own word: the raw color's edge"), which on a DEEP colored container is the face ITSELF at 1:1: the outline simply stopped existing under the pointer, exactly as reported (the selected row kept its accent-tinted pick, which is exactly why the report says "not selected ones"). The hover gathers toward the face's own INK RUNG at half weight now — the one value the ladder guarantees reads against the face — so a LIGHT face's frame DARKENS under the pointer and a DEEP face's frame BRIGHTENS: both directions step AWAY from the face, the outline growing MORE legible exactly when the hand reaches for the container, and the grounded shadow firms a rung with it (the plain row's own hover step). The plain row's hover keeps its 1.7.7 accent hue but deepens the ink floor (62% → 50%), so a pale accent on a light theme can never weaken the frame below its own rest line — every road reacts, and no road vanishes.
- **The wheel that outlives the freeze** ("when pressing on buttons that load things (such as expand prompt/note , opening settings, new card button etc.. , or the image previews loading etc..) , i want you to darken it slightly as if pressed and add a loading wheel , in some situations like on preview image it would just be visible with the darken , or in settings button it would replace the icon until the window pops up , or in new card in the card viewer the card will have the loading wheel animation as it loads , ensure the wheel works even when app is frozen since it does freeze when these actions occur , and ensure it has an out animation for the image preview one instead of the rest where it would be an appear and dissapear etc.."): one wheel, one law, every loading road. THE WHEEL is a ring drawn once and turned by a TRANSFORM animation carrying `will-change: transform` — the rotation runs ON THE COMPOSITOR, so it keeps turning through the very freezes these roads cause (the main thread can block for the whole heavy mount; the wheel's layer never learns). THE DOOR is `deferToPaint` (utils/helpers.js): every press sets its pending state, then hands the heavy work through two animation frames and one macrotask — the render commits, the browser PAINTS the wheel (and promotes its layer, starting the compositor's turn), and only then does the work run, so the freeze meets a wheel already on screen instead of owning the first frame the user ever sees. THE ROADS: the expand keys on every prompt row and the notes box (the glyph swaps for the wheel, the key darkened as pressed, the big editor window building inside the freeze — the mark clears in the same commit that mounts it, an appear and a disappear); the settings gear ("it would replace the icon until the window pops up" — the wheel holds the key until the window's own mount commits, the keyboard and context-menu roads keeping their instant seats); the CREATE road (the key darkens and stands down; the creation window closes the moment the hand commits, and THE CARD VIEWER carries the story — a veil with the darken + the wheel over the panel or the full-window cover, the wheel turning through the whole build, the veil clearing one painted breath after the new card's view has landed); and the image previews — the detail panel's stage and the huge viewer — where the veil rides the picture's own wrapper ("visible with the darken") and ALONE carries the OUT FLIGHT: the leaving edge fades over 0.24s while the arrival stays an appear, every other road appearing and disappearing whole, exactly as the report words it. The viewer's veil speaks the 1.7.0 completion sweep (a load that finishes before the listener attaches never fires onLoad — one honest img.complete read on the next tick), and the old corner ring retired with its seat.

## 1.8.5 — The Cover Breathes"""

README_PARA = """1.8.6 — the patient wheel. THE SILENT ASCENT ("currently when i
scroll up it opens the tags/stamps ... instead expanding should just be
manual by the user like usual"): the whole 1.8.4/1.8.5 seat economy —
the spacer, the debt, the payer, the hem restore, the flow origin, the
dead zone — retires with the loans it served, because a debt standing
is a geometric obligation the ascent can no longer pay: the scroll
speaks ONE direction now (DOWN — every fold rides the flow road the
owner loved from the top, the page shortening with the tray's own
tweened flight), an up-tick answers NOTHING, and expanding is the
HAND's work alone (the chip, a label toggle, the pin, the wake — the
page growing back with the tray's flight, the standard accordion
breath). THE OUTLINE ANSWERS THE HAND ("that outline dissapears when i
hover over them (unselected ones ...) fix that so its visible and maybe
reacts to it too"): the colored hovers gather toward the face's own INK
rung at half weight — a light face's frame darkens under the pointer, a
deep face's frame brightens, both stepping AWAY from the face so the
outline grows more legible exactly when the hand reaches for it (the
raw-color hover on a deep container was the face itself at 1:1, the
outline simply gone); the plain hover keeps its accent hue over a
deeper ink floor. THE WHEEL THAT OUTLIVES THE FREEZE (every loading
road — the expand keys, the settings gear, the CREATE road, the image
previews, the new card's veil over the card viewer): a ring turned by
a transform animation on its will-change layer, running ON THE
COMPOSITOR so it keeps turning through the very freezes these roads
cause, and THE DOOR (deferToPaint — two frames and a macrotask between
the press and the work) that puts every wheel on screen BEFORE the
freeze begins; the image previews alone carry the OUT FLIGHT (the
leaving edge fades, the arrival stays an appear), every other road an
appear and a disappear.

1.8.5 — the cover breathes. THE PAYER (one formula, both directions —"""

WHATS_NEW = """THE SILENT
ASCENT: the
scroll speaks
DOWN only —
no debt, no
seat, no
payer, and an
up-tick
answers
NOTHING
(expanding is
the hand's
work alone);
THE OUTLINE
ANSWERS THE
HAND (the
hover steps
toward the
face's ink
rung — never
into the
face); THE
WHEEL THAT
OUTLIVES THE
FREEZE (a
compositor
ring +
deferToPaint
on every
loading road,
the image
previews
carrying the
out flight)."""

SITE_ROW = """        <tr class="current-row">
          <td class="v">1.8.6</td>
          <td class="d">The patient wheel: THE SILENT ASCENT ("currently when i scroll up it opens the tags/stamps , fix that so the scroll upwards wont affect so (the tags/stamps collapse when scrolling down , thats correct and i love how it is now , but when scrolling up , i dont want to have it expand , instead expanding should just be manual by the user like usual)" &mdash; the whole 1.8.4/1.8.5 seat economy retires with the loans it served: a debt standing was a geometric obligation the ascent had to answer (the seat's blank band below the stuck header), so the tray HAD to expand on the way up; the scroll speaks ONE direction now &mdash; every fold rides the FLOW road the owner loved from the top, the page shortening with the tray's own 0.24s tweened flight, the content rising into the space it vacates, monotonic, nothing ever paid &mdash; and an up-tick answers NOTHING: expanding is the HAND's work alone (the EXPAND chip, a label toggle, the pin, the wake), the page growing back with the tray's flight; the between-band keeps its 1.8.4 ground and the preview column rides the header's own live height). THE OUTLINE ANSWERS THE HAND ("prompt/note container have an outline , that outline dissapears when i hover over them (unselected ones , not selected ones) fix that so its visible and maybe reacts to it too" &mdash; the colored hover used to gather to the RAW picked color, which on a DEEP container is the face itself at 1:1: the outline simply stopped existing under the pointer; the hover gathers toward the face's own INK rung at half weight now &mdash; a light face's frame darkens, a deep face's frame brightens, both stepping AWAY from the face so the outline grows more legible exactly when the hand reaches for it, the shadow firming a rung with it; the plain row's accent hue keeps a deeper ink floor). THE WHEEL THAT OUTLIVES THE FREEZE ("when pressing on buttons that load things (such as expand prompt/note , opening settings, new card button etc.. , or the image previews loading etc..) , i want you to darken it slightly as if pressed and add a loading wheel ... ensure the wheel works even when app is frozen since it does freeze when these actions occur , and ensure it has an out animation for the image preview one instead of the rest" &mdash; one wheel, one law, every loading road: a ring turned by a transform animation on its will-change layer, running ON THE COMPOSITOR so it keeps turning through the very freezes these roads cause, and THE DOOR &mdash; deferToPaint, two frames and a macrotask between the press and the work &mdash; puts every wheel on screen BEFORE the freeze begins; the expand keys and the settings gear swap their glyphs for the wheel until the window pops up, the CREATE road darkens its key and carries the story to the CARD VIEWER's veil (the wheel turning through the whole build), and the image previews &mdash; the stage and the huge viewer &mdash; wear the darken + the wheel with the out flight alone: the leaving edge fades, every other road an appear and a disappear).</td>
          <td><a href="https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v1.8.6">release page</a></td>
        </tr>
"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.8.5",', '"version": "1.8.6",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    assert raw.count('"version": "1.8.5"') == 2
    raw = raw.replace('"version": "1.8.5"', '"version": "1.8.6"', 2)
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.8.5',", "version: '1.8.6',")

    # the README: header, the new paragraph, the battery count
    sub("README.md", "**v1.8.5**", "**v1.8.6**")
    sub("README.md", "1.8.5 — the cover breathes. THE PAYER (one formula, both directions —", README_PARA)
    sub("README.md", "the regression battery (69 DOM/source test suites)", "the regression battery (70 DOM/source test suites)")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.8.5 — The Cover Breathes", CHANGELOG_ENTRY)

    # the website: hero, whats-new, the download doors, the current row
    sub("website/index.html", '<span class="ver">v1.8.5</span>\n      <span class="ver-date">THE COVER BREATHES</span>', '<span class="ver">v1.8.6</span>\n      <span class="ver-date">THE PATIENT WHEEL</span>')
    site = ROOT / "website/index.html"
    raw = site.read_text(encoding="utf8")
    start = raw.index('<div class="whats-new">')
    end = raw.index("</div></div></div>", start)
    raw = raw[:start] + '<div class="whats-new">' + WHATS_NEW + "</div>" + raw[end:]
    raw = raw.replace(
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.5/Burrito%20GenDex-1.8.5%20Setup.exe",
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.6/Burrito%20GenDex-1.8.6%20Setup.exe",
    )
    raw = raw.replace(
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.5/Burrito_GenDex_1.8.5_source.zip",
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.6/Burrito_GenDex_1.8.6_source.zip",
    )
    raw = raw.replace(
        '<a class="btn" href="https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v1.8.5">\n        RELEASE NOTES',
        '<a class="btn" href="https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v1.8.6">\n        RELEASE NOTES',
    )
    raw = raw.replace('        <tr class="current-row">\n          <td class="v">1.8.5</td>', SITE_ROW + '        <tr class="current-row">\n          <td class="v">1.8.5</td>', 1)
    site.write_text(raw, encoding="utf8")
    print("  website/index.html: seated (hero, whats-new, doors, the current row)")

    print("\n1.8.6 furniture seated.")


if __name__ == "__main__":
    main()
