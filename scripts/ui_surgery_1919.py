#!/usr/bin/env python3
"""1.9.19 — THE ENDS TRADE PLACES, the hud mirror surgery (jsx + css).

The report, quoted whole:
"just make the zoom options on the right with the reset the view button,
(reset the view button should be the one inwards towards the center of
course not towards the edge , basically just mirror it) , and the count
of the images should be on the left instead, thats all"

THE CURE: the two end crews trade seats, and the view crew rides MIRRORED.
The FLANK (the bar's own right end) carries the whole view crew in the
1.9.18 cluster's mirror order — reset · zoom-in · % · zoom-out — so the
reset key stands INWARDS, nearest the switcher, never parked against the
edge (the literal mirror of the 1.9.18 crew − · % · + · reset, whose
reset was the inwards key at the left end). The LEFT zone (the bar's own
left end) carries the COUNT alone. The one-shape law carries whole —
one markup, the same three zones whatever the viewer holds, the
switcher locked when solo, the middle still the switcher's alone; the
parking laws (left flex-start, flank flex-end + wrap, mid dead-center,
the 1fr · auto · 1fr grid) are untouched — only the ends trade their
crews and the crew's own order turns with its end.

The jsx surgery: the zone contents swap (count -> hud-left, the mirrored
crew -> hud-flank) + the 1.9.19 law entry appended to the stanza at the
seat. The css surgery: the 1.9.19 law entry appended to the hud stanza +
the seats' own notes re-seated onto the mirror ground (the 1.9.17 birth
stamps kept verbatim — the comment history the seats accumulate).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already seated")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:160]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


# ---- the jsx: the zone contents trade, the crew rides mirrored ---------

JSX_LEFT_OLD = """        <div className="gd-imgview-hud-left">
          <button
            className="gd-btn !px-2"
            title="Zoom out (−)"
            onClick={() => setZoomChecked(zoom / ZOOM_STEP)}
          >
            <ZoomOut size={13} />
          </button>
          <span className="gd-imgview-zoomval">{`${Math.round(zoom * 100)}%`}</span>
          <button
            className="gd-btn !px-2"
            title="Zoom in (+)"
            onClick={() => setZoomChecked(zoom * ZOOM_STEP)}
          >
            <ZoomIn size={13} />
          </button>
          <button
            className="gd-btn !px-2"
            title="Reset the view (0 / double-click)"
            onClick={resetView}
          >
            <Maximize2 size={13} />
          </button>
        </div>"""

JSX_LEFT_NEW = """        <div className="gd-imgview-hud-left">
          <span className="gd-imgview-count">
            {safeIndex + 1} / {images.length}
          </span>
        </div>"""

JSX_FLANK_OLD = """        <div className="gd-imgview-hud-flank">
          <span className="gd-imgview-count">
            {safeIndex + 1} / {images.length}
          </span>
        </div>"""

# the 1.9.18 view crew, MIRRORED: reset (the inwards key, nearest the
# switcher) · zoom-in · the percentage · zoom-out at the bar's own edge
JSX_FLANK_NEW = """        <div className="gd-imgview-hud-flank">
          <button
            className="gd-btn !px-2"
            title="Reset the view (0 / double-click)"
            onClick={resetView}
          >
            <Maximize2 size={13} />
          </button>
          <button
            className="gd-btn !px-2"
            title="Zoom in (+)"
            onClick={() => setZoomChecked(zoom * ZOOM_STEP)}
          >
            <ZoomIn size={13} />
          </button>
          <span className="gd-imgview-zoomval">{`${Math.round(zoom * 100)}%`}</span>
          <button
            className="gd-btn !px-2"
            title="Zoom out (−)"
            onClick={() => setZoomChecked(zoom / ZOOM_STEP)}
          >
            <ZoomOut size={13} />
          </button>
        </div>"""

JSX_LAW_OLD = """          multiples — and it stands LOCKED (is-locked + disabled): the
          center bottom still shows the next and previous images, but
          the walk is pinned. */}"""

JSX_LAW_NEW = """          multiples — and it stands LOCKED (is-locked + disabled): the
          center bottom still shows the next and previous images, but
          the walk is pinned.
          1.9.19 — THE ENDS TRADE PLACES ("just make the zoom options on
          the right with the reset the view button, (reset the view
          button should be the one inwards towards the center of course
          not towards the edge , basically just mirror it) , and the
          count of the images should be on the left instead, thats
          all"): the two end crews trade seats. The view crew rides the
          FLANK now — the bar's own right end — MIRRORED, so the order
          reads reset · zoom-in · % · zoom-out and the reset key stands
          INWARDS, nearest the switcher (never parked against the edge,
          the literal mirror of the 1.9.18 crew whose reset was the
          inwards key at the left end), with the zoom-out key at the
          bar's own right edge. The count rides the LEFT zone at the
          bar's own left end. The one-shape law carries whole — one
          markup, the same three zones whatever the viewer holds, the
          switcher locked when solo, the middle still the switcher's
          alone; the parking laws are untouched, only the ends traded
          their crews. */}"""

# ---- the css: the law entry + the seats' own notes ---------------------

CSS_LAW_OLD = """   LOCKED in the middle (.is-locked + disabled — the peeks paint the
   set, but the walk is pinned). */"""

CSS_LAW_NEW = """   LOCKED in the middle (.is-locked + disabled — the peeks paint the
   set, but the walk is pinned).
   1.9.19 — THE ENDS TRADE PLACES ("just make the zoom options on the
   right with the reset the view button, (reset the view button should
   be the one inwards towards the center of course not towards the edge
   , basically just mirror it) , and the count of the images should be
   on the left instead, thats all"): the two end crews trade seats — the
   FLANK carries the whole view crew MIRRORED (reset · zoom-in · % ·
   zoom-out, the 1.9.18 cluster's literal mirror: the reset key stands
   INWARDS, nearest the switcher, never against the edge; the zoom-out
   key parks at the bar's own right end) and the LEFT zone carries the
   count alone at the bar's own left end. The one-shape law carries
   whole (one markup, the same three zones whatever the viewer holds,
   the switcher locked when solo); the parking (left flex-start, flank
   flex-end + wrap, mid dead-center, the 1fr · auto · 1fr grid) is
   untouched — only the ends traded their crews. */"""

CSS_LEFT_NOTE_OLD = """  /* 1.9.17 — the lean is retired (see the middle law above): the zone
     parks at the bar's own LEFT end — the zoom trio keeps its own
     ground, away from the switcher's arrows, so nothing ever presses
     against the peeks. */"""

CSS_LEFT_NOTE_NEW = """  /* 1.9.17 — the lean is retired (see the middle law above): the zone
     parks at the bar's own LEFT end — the zoom trio keeps its own
     ground, away from the switcher's arrows, so nothing ever presses
     against the peeks. 1.9.19 — THE ENDS TRADE PLACES: the LEFT-end
     parking holds; the COUNT parks here now — the view crew traded
     ends with it and rides the flank mirrored (see the law above). */"""

CSS_FLANK_NOTE_OLD = """/* 1.9.17 — the lean is retired (see the middle law above): the count +
   the fit key park at the bar's own RIGHT end — the retired hint's old
   territory, carrying controls now instead of usage text: a short,
   wrap-capable cluster that can never clip off the right edge the way
   the long single-line hint once did. */"""

CSS_FLANK_NOTE_NEW = """/* 1.9.17 — the lean is retired (see the middle law above): the count +
   the fit key park at the bar's own RIGHT end — the retired hint's old
   territory, carrying controls now instead of usage text: a short,
   wrap-capable cluster that can never clip off the right edge the way
   the long single-line hint once did.
   1.9.19 — THE ENDS TRADE PLACES: the RIGHT-end parking + the wrap
   guard hold; the VIEW CREW parks here now — reset · zoom-in · % ·
   zoom-out, mirrored so the reset key stands inwards toward the
   switcher (see the law above) — the count having traded ends with it. */"""


def main() -> None:
    # the jsx: the zones trade their crews, the crew rides mirrored
    sub("src/components/ImageViewer.jsx", JSX_LEFT_OLD, JSX_LEFT_NEW)
    sub("src/components/ImageViewer.jsx", JSX_FLANK_OLD, JSX_FLANK_NEW)
    sub("src/components/ImageViewer.jsx", JSX_LAW_OLD, JSX_LAW_NEW)
    # the css: the law entry + the seats' own notes
    sub("src/index.css", CSS_LAW_OLD, CSS_LAW_NEW)
    sub("src/index.css", CSS_LEFT_NOTE_OLD, CSS_LEFT_NOTE_NEW)
    sub("src/index.css", CSS_FLANK_NOTE_OLD, CSS_FLANK_NOTE_NEW)
    print("1.9.19 hud mirror seated: jsx zones x2 + jsx law, css law + notes x2")


if __name__ == "__main__":
    main()
