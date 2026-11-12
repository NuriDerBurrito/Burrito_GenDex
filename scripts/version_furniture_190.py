#!/usr/bin/env python3
"""1.9.0 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_190.py, and the law pins that must keep
their birth versions are healed by patch_law_pins_190.py). The
compression@1.8.2 dependency lesson holds: only the app's OWN version seats
move.

1.9.0 — THE CLEAR PANE, built on the 1.8.10 engine seat (the vendored
sql.js pair — glue + fuel — riding the tree, the boot never asking
node_modules for the engine again): three answers and one build seat. The
stage's readiness becomes the mounted picture's own word (the wheel rides
whenever the picture is not clear yet — a cached decode included), the tags
farewell's clip plane learns the wall's own 6px left reach (the marks stop
shaving flat mid animation), and the beta tester badge takes the accent's
own color on the family's frame. The build's own red line (the Babel 500kB
note on the generated fuel) retires with the babel exclusion.

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


CHANGELOG_ENTRY = """## 1.9.0 — The Clear Pane

Three answers and one build seat — the picture clears the moment its own paint lands, the farewell's clip learns the wall's left reach, and the badge takes the accent's own color.

- **The stage's readiness is the picture's own word** ("when images are loading in the right panel, for some reason after it finishes loading sometimes they stay blurred for longer then become clear, fix that so once its loaded it becomes clear, it also occurs when i switch cards to cards already loaded it becomes blurry without the loading circle then becomes clear later, my issue is mostly that the loading circle isnt on it too, fix that"): `loaded` used to read a module-level Set of files that had EVER decoded — a memory of loads past, not a report of the picture on screen. Two diseases grew out of that seat: a late or swallowed load event left the low-res placeholder painting long after the decode ("stays blurred for longer"), and switching to a card whose file sat in the Set flipped `loaded` true on the first paint while the freshly-mounted img element was still decoding from cache — the cheap blurred thumb painted alone beneath a veil already marked done: blur with NO wheel, exactly the report's second half. The truth moves to the element itself: `readyFile` is per-mount state that resets on every image change and lands only when THIS mounted img speaks — its own onLoad, or the completion sweep, which now asks on a short ladder (0/60/180/420/900ms, each ask matching the img's own currentSrc so the exiting slide's twin can never answer for the incoming file) instead of the single 0ms tick that could miss a load landing one breath later. The veil rides the whole gap: the wheel is on whenever the picture is not clear yet, cached or not — a fast cache answers in a frame or two and the wheel's own out flight swallows the flash, and a slow one finally says what it always was: loading. The big viewer already spoke this law (its own per-src fullLoaded); the stage joins it. The STAGE_LOADED Set and its data-tick re-render nudge retire with the seat.
- **The farewell's clip learns the wall's own left reach** ("when switching cards, the feedback of tags is good, but the tags marks (aka the tag shape on the left of each of the tags container) clips to the left side of the tags container mid feedback animation, fix that"): every tag chip hangs its mark shape 6px past its own left edge, and the live wall's scroller carries 6px of left headroom for exactly that reach — but the off mode's farewell twin (the absolutely-positioned ghost row that dissolves the old card's chips through the first beat of the switch) seated its chips at their MEASURED on-screen seats inside a box that started exactly at the seat's left edge, with overflow hidden: the first-column chips' marks reached 6px past the ghost's clip plane and were shaved flat for the whole 0.07s farewell — the tag shape clipped at the container's left edge, mid animation. The ghost's border box now extends the same 6px left (left: -6px — the same ground the live scroller's own border box already occupies, so no pixel of new territory is ever painted), and the chips' seats shift +6 so every chip keeps painting at its exact measured on-screen seat while its mark keeps its full reach inside the clip. The marks clear the cut; the farewell stays pixel-faithful.
- **The beta tester badge takes the accent's own color** ("beta tester container should be colored not clear like the rest like before, taking in teh accent theme color"): the 1.8.9 frame (the link family's geometry, radius, drop shadow, transition and hover lift — the "stylized too like them" word) holds, but the family's clear panel cloth made the badge read as one more key on the wall, its only color the 5px dot. The badge's CLOTH is the accent's own again: an accent border at the family's border weight, an accent-tinted fill, accent ink — the colored seat the badge wore before 1.8.9, now cut to the family's measurements — and its own hover/active seats return to deepen the tint (12% to 22%) while the family's lift and shadow answer underneath.
- **The build's own red line retires, and the battery's worklog seats learn tolerance**: every build printed "BABEL note: styling deoptimised because the file size (902 kB) exceeds 500 kB" for the generated wasm fuel module (src/utils/sqlite_wasm.js — a flat array of base64 strings, nothing any target could want rewritten). The note was benign but read as an error in red on every launch, and the pass was pure waste: the fuel joins the babel exclusion (webpack parses its plain ESM natively, byte-identical payload, faster builds — the 1.8.10 vendored engine pair rides untouched, its glue keeps its own seat beside the fuel). And the two suite seats that read the parent folder's worklog (a dev-seat truth that lives beside the tree, never inside it) learn tolerance: a missing worklog falls back to the app's own CHANGELOG, so the shipped battery runs green wherever the zip is extracted. The battery welcomes its newest suite (gendex_192) with the readiness ladder, the ghost's reach, the badge's cloth and the furniture pinned as laws.

## 1.8.10 — The Engine's Own Seat"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.8.10",', '"version": "1.9.0",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    assert raw.count('"version": "1.8.10"') == 2
    raw = raw.replace('"version": "1.8.10"', '"version": "1.9.0"', 2)
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.8.10',", "version: '1.9.0',")

    # the CHANGELOG: the new head entry
    sub("CHANGELOG.md", "## 1.8.10 — The Engine's Own Seat", CHANGELOG_ENTRY)

    # the README: the public face's own three seats (badge line, shield,
    # battery count — the suite the battery welcomes is gendex_192)
    sub("README.md", "**v1.8.10** · a local card & prompt-version tracker", "**v1.9.0** · a local card & prompt-version tracker")
    sub("README.md", "version-1.8.10-purple", "version-1.9.0-purple")
    sub("README.md", "the regression battery (73 DOM/source test suites)", "the regression battery (74 DOM/source test suites)")

    print("\n1.9.0 furniture seated.")


if __name__ == "__main__":
    main()
