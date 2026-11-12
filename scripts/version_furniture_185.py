#!/usr/bin/env python3
"""1.8.5 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_185.py). The compression@1.8.2 dependency
lesson holds: only the app's OWN version seats move (shell-quote's ^1.8.4
range is a dependency's own seat, untouched).

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


CHANGELOG_ENTRY = """## 1.8.5 — The Cover Breathes

Five answers — the tray's cover finally breathes both ways, the swap flight reads the press breath, and the selected outline out-ranks every hover.

- **The payer: one formula, both directions** ("the expand animation for stamps/tags isnt playing anymore" + "its still buggy and only occurs when i do the collapse animation" + the fifth report's whole word): the 1.8.4 cover held the page's length by SNAPPING the whole fold into one frame — the tray blinking out (the "buggy" collapse), the expansion landing whole with no flight at all — and its guard (the content must have risen past the plate's hem before any debt may stand) meant a fold attempted from the top NEVER landed: the tray stayed open until the scroll passed the tray's whole height, and on a page shorter than that, forever. The seat now has an ENGINE — a payer, one formula (`seat = max(0, D0 - (H(t) - H0))` driven by a ResizeObserver, never a rAF loop: the observer fires after the frame's layout, so the measured height always includes the tween's per-frame write — a rAF reader registered before the tween's own rAF reads the LAST frame's height and the seat lags a frame behind; the live probe caught exactly that ~26px wobble on its first run) that holds the seat at exactly what the header's folding ground has LOST at each observed frame. Through a fold the seat charges UP as the header thins; through a restore or a manual dismissal it pays DOWN as the header regains — so the tray TWEENS on every road (the 0.39.0 breath, restored: the rows visibly slide away, the traveling chip rides, the name retracts) while the flow's total stands stone-still THROUGH the whole flight: no layout fight to flee (the 1.1.2 fear dies with the fight), no one-frame blink, and THE EXPAND ANIMATION PLAYS on every restore and every manual road — the rows pour back in as a cover re-extending over content that never moves a pixel. The listener never paints anything anymore (the fold is a state flip; React + framer + the tray's own CSS tweens carry the flight) and never writes the offset AT ALL — the un-clamp included (nothing paints in the listener's own task, so the eager clamp has no mid-task breath to steal from).
- **The road choice: the flow road from the top** ("when scrolling down from top of the detail panel , the stamps/tags doesnt collapse (i suspect you did something last version where it doesnt effect the scroll , i want it to effect it when opeining and closing but do it in a way that it doesnt look buggy when scrolling like before i mean , and at the same time not how it is currently)"): the road is chosen BEFORE any paint, from two cheap measures. Scrolled past the tray's hem, the fold rides the SEAT ROAD — the payer charging up, the cover law whole (the content in the back acts independently, the scrollbar's map never moves, a drag never fought — the 1.8.4 crown, kept frame-by-frame instead of landed-at-once). A downward journey that BEGAN at the top rides the FLOW ROAD — no seat, no pay: the page shortens WITH the 0.24s flight and the content rises into the space the tray vacates ("it effects the scroll when opening and closing", exactly the report's ask), monotonic, never a snap-back, because nothing is ever paid back late — nothing is ever paid at all; scrolling back up to the fold's own origin re-opens the tray and the page grows back with the same flight. Between the two (a journey begun mid-page, short of the hem) the attempt stands down — the 1.8.4 ground, where a seat would show its band and a flow fold would shove the reading content a full tray-height in one gesture. A 48px dead zone after any restore keeps the restore edge from flapping, and the journey's start — not its current seat — decides the road, so the first down-tick from the top commits wherever it lands.
- **The swap flight reads the press breath** ("when moving prompts up or down for the first time they snap to the very top and then snap back , fix that"): the 1.4.5 FLIP read its origin from the tops map recorded at the LAST parts-commit — which on the first move was the MOUNT breath's layout, and everything the panel settled between mount and press (the opening flight, the tray's fold state, the name's measure, a late font, the content-visibility estimates) had left it stale; where that drift was not uniform (a row above the pressed one changing height, the estimate pile-up) the FLIP painted the pressed row at a seat that never was — teleporting by the whole drift toward the top of the stack, then gliding back (proven live: a 140px drift carrying a 210px teleport where the honest swap is 70px). The origins are measured in the PRESS breath itself now, pre-commit, from the layout the eye is actually looking at — nothing settled anywhere can leak into the flight (the same live probe: the drift-free -70px glide), and the scroller lookup covers BOTH mounts (`.gd-tex-panel` for the right panel, `.gd-tex-viewer` for the full-window view the old lookup never found).
- **The selected outline out-ranks every hover** ("when hovering over the prompt the highlighted selected outline dissapears from the container, fix that"): the 1.7.7 claim that the `:has` focus pick beats the hover held for the plain row (0,3,0 over 0,2,0) and the colored LIGHT row (0,4,0 over 0,3,0) — but the DEEP shade's own hover seat (`.gd-part-row.is-colored.is-shade-deep:hover`, also 0,4,0, later in the file) TIED the colored focus rule and won by source order: hovering a DEEP colored prompt replaced the selected outline with the raw color-on-color edge — an edge the eye cannot read on the deep face, the outline "disappearing" exactly as the report tells it (proven live on real Chromium: the border flipping from the accent-tinted pick to the raw hex the moment the pointer enters; the fix verified the same way — identical computed border under focus and focus+hover on plain, light and deep rows alike). The whole `:has` family doubles its own class now — the codebase's honest weight lift, no `!important` — so the selected container outline out-ranks every hover the row can ever wear.
- **The retired seats** (the era's own housekeeping): the snap seat (`foldSnap` + `is-snap`) retires with the fight it fled — its CSS stays as a tombstone; the cheap hem rides off with the revert it served (the attempt is two cheap reads now); the same-breath direct paints, the two-step class dances and the forced recalcs all leave with the pay they synchronized; the preview column's `headH` keeps its 1.8.4 law untouched (the payer preserves the header-plus-debt invariant by construction — the sum never moves, the RO's landing stays stable); and a live payer re-anchors at a card swap so a mid-flight episode never carries the old card's open heights into the new card's tray.

## 1.8.4 — The Cover"""

README_PARA = """1.8.5 — the cover breathes. THE PAYER (one formula, both directions —
a ResizeObserver holds the seat at exactly what the header's folding
ground has lost at each observed frame, so the tray TWEENS closed and
pours back open on every road while the flow's total stands stone-still
THROUGH the whole flight: the expand animation plays again, the
collapse is a flight instead of a blink, and nothing below the header
ever moves a pixel in either direction), THE ROAD CHOICE (a downward
journey begun at the top rides the FLOW road — the page shortens with
the tray's own 0.24s flight and the content rises into the space it
vacates, never a snap-back because nothing is ever paid at all;
scrolled past the tray's hem the fold rides the seat road — the 1.8.4
cover law kept frame-by-frame; between the two the attempt stands
down), THE SWAP FLIGHT READS THE PRESS BREATH (the 1.4.5 FLIP's origin
is measured in the press itself, pre-commit — the mount-state drift
that teleported the first move's row toward the top of the stack and
glided it back can never leak into the flight again), and THE SELECTED
OUTLINE OUT-RANKS EVERY HOVER (the :has focus family doubles its own
class — the DEEP shade's hover seat tied it by specificity and won by
source order, the outline "disappearing" into the color-on-color edge
on every deep colored prompt). The live payer-probe (Playwright on real
Chromium, the app's own geometry and gates verbatim) earned its keep
twice: the rAF-reader's one-frame lag (the content drifting ~26px
through the flight, cured by the ResizeObserver engine) and the
sampler-artifact lesson (the painted truth reads from inside the
observer, post-sync) — 20/20 checks green.

1.8.4 — the cover. THE FOLD PAYS THE SEAT, NOT THE SCROLL (the"""

WHATS_NEW = """THE PAYER
(one formula,
both directions)
holds the
seat at
exactly what
the header
lost — the
tray TWEENS
closed and
pours back
open on
every road
while the
page's length
stands still,
and the road
FROM THE TOP
lets the
content rise
into the
space it
vacates; the
swap flight
READS THE
PRESS BREATH,
and the
selected
outline
OUT-RANKS
EVERY HOVER."""

SITE_ROW = """        <tr class="current-row">
          <td class="v">1.8.5</td>
          <td class="d">The cover breathes: THE PAYER, ONE FORMULA, BOTH DIRECTIONS ("the expand animation for stamps/tags isnt playing anymore" + "its still buggy and only occurs when i do the collapse animation" &mdash; the 1.8.4 cover held the page's length by SNAPPING the whole fold into one frame: the tray blinking out, the expansion landing whole with no flight at all; the seat now has an ENGINE &mdash; a ResizeObserver-driven formula that holds it at exactly what the header's folding ground has LOST at each observed frame, charging up through a fold and paying down through a restore &mdash; so the tray TWEENS on every road while the flow's total stands stone-still THROUGH the flight: no layout fight, no one-frame blink, the expand animation playing on every road; the live probe caught the rAF-reader's one-frame lag on its first run &mdash; the observer engine cures it). THE ROAD CHOICE ("when scrolling down from top of the detail panel , the stamps/tags doesnt collapse (i suspect you did something last version where it doesnt effect the scroll , i want it to effect it when opeining and closing but do it in a way that it doesnt look buggy when scrolling like before i mean , and at the same time not how it is currently)" &mdash; the 1.8.4 guard meant a fold attempted from the top never landed; the road is chosen before any paint now: from the top the fold rides the FLOW road, the page shortening with the tray's own 0.24s flight and the content rising into the space it vacates &mdash; monotonic, never a snap-back, nothing ever paid; past the tray's hem it rides the seat road, the 1.8.4 cover law kept frame-by-frame; between the two the attempt stands down, and a 48px dead zone after any restore keeps the edge from flapping). THE SWAP FLIGHT READS THE PRESS BREATH ("when moving prompts up or down for the first time they snap to the very top and then snap back" &mdash; the 1.4.5 FLIP read its origin from the mount-breath map, and the panel's settling drift teleported the first move's row by the whole drift toward the top of the stack before gliding it home; the origins are measured in the press breath itself now, pre-commit, on both mounts). THE SELECTED OUTLINE OUT-RANKS EVERY HOVER ("when hovering over the prompt the highlighted selected outline dissapears from the container" &mdash; the DEEP shade's hover seat tied the :has focus family by specificity and won by source order, the outline dissolving into the color-on-color edge on every deep colored prompt; the family doubles its own class &mdash; the honest weight lift, verified live on plain, light and deep rows alike).</td>
          <td><a href="https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v1.8.5">release page</a></td>
        </tr>
"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.8.4",', '"version": "1.8.5",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    assert raw.count('"version": "1.8.4"') == 2
    raw = raw.replace('"version": "1.8.4"', '"version": "1.8.5"', 2)
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.8.4',", "version: '1.8.5',")

    # the README: header, the new paragraph, the battery count
    sub("README.md", "**v1.8.4**", "**v1.8.5**")
    sub("README.md", "1.8.4 — the cover. THE FOLD PAYS THE SEAT, NOT THE SCROLL (the", README_PARA)
    sub("README.md", "the regression battery (68 DOM/source test suites)", "the regression battery (69 DOM/source test suites)")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.8.4 — The Cover", CHANGELOG_ENTRY)

    # the website: hero, whats-new, the download doors, the current row
    sub("website/index.html", '<span class="ver">v1.8.4</span>\n      <span class="ver-date">THE COVER</span>', '<span class="ver">v1.8.5</span>\n      <span class="ver-date">THE COVER BREATHES</span>')
    site = ROOT / "website/index.html"
    raw = site.read_text(encoding="utf8")
    start = raw.index('<div class="whats-new">')
    end = raw.index("</div></div></div>", start)
    raw = raw[:start] + '<div class="whats-new">' + WHATS_NEW + "</div>" + raw[end:]
    raw = raw.replace(
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.4/Burrito%20GenDex-1.8.4%20Setup.exe",
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.5/Burrito%20GenDex-1.8.5%20Setup.exe",
    )
    raw = raw.replace(
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.4/Burrito_GenDex_1.8.4_source.zip",
        "https://github.com/NuriDerBurrito/Burrito_GenDex/releases/download/v1.8.5/Burrito_GenDex_1.8.5_source.zip",
    )
    raw = raw.replace(
        '<a class="btn" href="https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v1.8.4">\n        RELEASE NOTES',
        '<a class="btn" href="https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v1.8.5">\n        RELEASE NOTES',
    )
    raw = raw.replace('        <tr class="current-row">\n          <td class="v">1.8.4</td>', SITE_ROW + '        <tr class="current-row">\n          <td class="v">1.8.4</td>', 1)
    site.write_text(raw, encoding="utf8")
    print("  website/index.html: seated (hero, whats-new, doors, the current row)")

    print("\n1.8.5 furniture seated.")


if __name__ == "__main__":
    main()
