#!/usr/bin/env python3
"""1.9.19 — THE SWEEP'S MISSES HEALED (the standing law of every release:
a pin whose ground a newer law moved is re-seated onto the new ground at
its root, with the law's own note).

Three kinds of miss this release:

1) the 1918 suite's law-birth pins were over-swept: the sweep's digit
   pass carried `1.9.18 — THE BAR KEEPS ONE SHAPE` (the jsx + css seats)
   and `1.9.18 — THE LOCK rides its own seat` (the css lock note) onto
   1.9.19, but those markers are the 1.9.18 release's OWN birth stamps
   — they live in the source stamped 1.9.18 forever (the comment history
   the seats accumulate). The pins are re-seated back onto their birth
   stamps with the law's note.

2) the 1916 + 1917 + 1918 suites' MEMBERSHIP pins: THE ENDS TRADE
   PLACES moved their ground — the two end crews traded seats. The view
   crew (reset · zoom-in · % · zoom-out, MIRRORED so the reset key
   stands inwards, nearest the switcher, never against the edge) rides
   the FLANK at the bar's own right end, and the count rides the LEFT
   zone at the bar's own left end. The membership pins re-seat onto
   the mirror ground (with the order pinned where the suite already
   speaks the crew whole), and the parking titles re-seat onto the
   crews that park there now.

3) the 192-196 badge pins (the same shapes every release heals — the
   sweep's regex shapes never touch the plain
   readme.includes('version-1.9.18-purple') form).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def reseat(path: str, pairs: list, label: str) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    changed = False
    for old, new in pairs:
        if new in raw and old not in raw:
            print(f"  {path}: already re-seated ({label})")
            continue
        assert old in raw, f"{path}: missing the {label} pin:\n{old[:120]}"
        raw = raw.replace(old, new, 1)
        changed = True
    if changed:
        p.write_text(raw, encoding="utf8")
        print(f"  {path}: {label} pins re-seated")


BIRTH_NOTE = (
    "  /* 1.9.19 — the version sweep over-carried this pin's digits: the\n"
    "     marker is the 1.9.18 release's own BIRTH STAMP and lives in\n"
    "     the source stamped 1.9.18 forever — the pin re-seats onto it. */\n"
)

# ---- the 1918 suite -------------------------------------------------------

B1_1918_OLD = r"""ok('B1 — the view crew rides the left zone: − · % · + · reset, one cluster', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(left, /ZoomOut/, 'the zoom-out key left the left zone');
  assertMatch(left, /gd-imgview-zoomval/, 'the zoom percentage left the left zone');
  assertMatch(left, /ZoomIn/, 'the zoom-in key left the left zone');
  assertMatch(left, /resetView/, 'the reset key left the left zone (it moved home here)');
  assert.ok(!left.includes('gd-imgview-count'), 'the count never belonged at the left end');
});"""

B1_1918_NEW = r"""ok('B1 — the count rides the left zone alone (the 1.9.19 retrue: the ends traded crews)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the count traded
     ends with the view crew — it parks at the bar's LEFT end now, the
     seat the crew kept since 1.9.16. */
  assertMatch(left, /gd-imgview-count/, 'the count left the left end');
  assert.ok(!left.includes('resetView'), 'the reset key never belonged at the left end');
  assert.ok(!left.includes('ZoomOut') && !left.includes('ZoomIn'), 'the zoom keys never belonged at the left end');
  assert.ok(!left.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the left end');
});"""

B2_1918_OLD = r"""ok('B2 — the count rides the flank alone (the reset went home)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right end');
  assert.ok(!flank.includes('resetView'), 'the reset key still parks at the right end');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right end');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right end');
});"""

B2_1918_NEW = r"""ok('B2 — the view crew rides the flank MIRRORED — reset inwards (the 1.9.19 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the whole view
     crew traded ends with the count and rides the right end MIRRORED —
     reset · zoom-in · % · zoom-out — so the reset key stands inwards,
     nearest the switcher, never against the edge. */
  assertMatch(flank, /resetView/, 'the reset key left the right end (the crew must sit whole)');
  assertMatch(flank, /ZoomIn/, 'the zoom-in key left the right end');
  assertMatch(flank, /gd-imgview-zoomval/, 'the zoom percentage left the right end');
  assertMatch(flank, /ZoomOut/, 'the zoom-out key left the right end');
  const iReset = flank.indexOf('Reset the view');
  const iIn = flank.indexOf('Zoom in (+)');
  const iVal = flank.indexOf('gd-imgview-zoomval');
  const iOut = flank.indexOf('Zoom out (−)');
  assert.ok(iReset > -1 && iIn > iReset && iVal > iIn && iOut > iVal, 'the mirror order broke: reset must be the inwards key');
  assert.ok(!flank.includes('gd-imgview-count'), 'the count never belonged at the right end');
});"""

# ---- the 1917 suite -------------------------------------------------------

B1_1917_OLD = r"""ok('B1 — the view crew rides the left zone (the 1.9.18 retrue: the reset joins the zoom family)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(left, /ZoomOut/, 'the zoom-out key left the left zone');
  assertMatch(left, /gd-imgview-zoomval/, 'the zoom percentage left the left zone');
  assertMatch(left, /ZoomIn/, 'the zoom-in key left the left zone');
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the reset key
     moved home — out of the flank, in with the zoom family (the view
     crew − · % · + · reset, one cluster at the bar's left end). */
  assertMatch(left, /resetView/, 'the reset key left the left zone');
  assert.ok(!left.includes('gd-imgview-count'), 'the count never belonged at the left end');
});"""

B1_1917_NEW = r"""ok('B1 — the count rides the left zone alone (the 1.9.19 retrue: the ends traded crews)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the count traded
     ends with the view crew — it parks at the bar's LEFT end now. */
  assertMatch(left, /gd-imgview-count/, 'the count left the left end');
  assert.ok(!left.includes('resetView'), 'the reset key never belonged at the left end');
  assert.ok(!left.includes('ZoomOut') && !left.includes('ZoomIn'), 'the zoom keys never belonged at the left end');
  assert.ok(!left.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the left end');
});"""

B2_1917_OLD = r"""ok('B2 — the count rides the flank alone (the 1.9.18 retrue: the reset went home)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right end');
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the reset key
     moved home to the left zone — the right end carries the count
     alone, exactly where it stood. */
  assert.ok(!flank.includes('resetView'), 'the reset key still parks at the right end');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right end');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right end');
});"""

B2_1917_NEW = r"""ok('B2 — the view crew rides the flank MIRRORED — reset inwards (the 1.9.19 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the whole view
     crew traded ends with the count and rides the right end MIRRORED —
     reset · zoom-in · % · zoom-out — the reset key standing inwards,
     nearest the switcher, never against the edge. */
  assertMatch(flank, /resetView/, 'the reset key left the right end (the crew must sit whole)');
  assertMatch(flank, /ZoomIn/, 'the zoom-in key left the right end');
  assertMatch(flank, /gd-imgview-zoomval/, 'the zoom percentage left the right end');
  assertMatch(flank, /ZoomOut/, 'the zoom-out key left the right end');
  assert.ok(!flank.includes('gd-imgview-count'), 'the count never belonged at the right end');
});"""

# ---- the 1916 suite -------------------------------------------------------

B2_1916_OLD = r"""ok('B2 — the zoom trio + the reset key ride the LEFT zone (the 1.9.18 retrue)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(left, /ZoomOut/, 'the zoom-out key left the left zone');
  assertMatch(left, /gd-imgview-zoomval/, 'the zoom percentage left the left zone');
  assertMatch(left, /ZoomIn/, 'the zoom-in key left the left zone');
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the reset key
     moved home — out of the flank, in with the zoom family (the view
     crew − · % · + · reset, one cluster at the bar's left end). */
  assertMatch(left, /resetView/, 'the reset key left the left zone');
  assert.ok(!left.includes('gd-imgview-count'), 'the count never belonged at the left flank');
});"""

B2_1916_NEW = r"""ok('B2 — the count rides the LEFT zone alone (the 1.9.19 retrue)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the count traded
     ends with the view crew — it parks at the bar's LEFT end now. */
  assertMatch(left, /gd-imgview-count/, 'the count left the left flank');
  assert.ok(!left.includes('resetView'), 'the reset key never belonged at the left flank');
  assert.ok(!left.includes('ZoomOut') && !left.includes('ZoomIn'), 'the zoom keys never belonged at the left flank');
  assert.ok(!left.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the left flank');
});"""

B3_1916_OLD = r"""ok('B3 — the count hugs the RIGHT flank alone (the 1.9.18 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right flank');
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the reset key
     moved home to the left zone — the right end carries the count
     alone, exactly where it stood. */
  assert.ok(!flank.includes('resetView'), 'the reset key still parks at the right flank');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right flank');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right flank');
});"""

B3_1916_NEW = r"""ok('B3 — the view crew hugs the RIGHT flank MIRRORED — reset inwards (the 1.9.19 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the whole view
     crew traded ends with the count and rides the right end MIRRORED —
     reset · zoom-in · % · zoom-out — the reset key standing inwards,
     nearest the switcher, never against the edge. */
  assertMatch(flank, /resetView/, 'the reset key left the right flank');
  assertMatch(flank, /ZoomIn/, 'the zoom-in key left the right flank');
  assertMatch(flank, /gd-imgview-zoomval/, 'the zoom percentage left the right flank');
  assertMatch(flank, /ZoomOut/, 'the zoom-out key left the right flank');
  assert.ok(!flank.includes('gd-imgview-count'), 'the count never belonged at the right flank');
});"""


def main() -> None:
    # 1) the 1918 suite's law-birth pins (the sweep over-carried the
    #    digits; the markers keep their 1.9.18 birth stamps in source)
    reseat(
        "scripts/gendex_1918_batch_dom.test.mjs",
        [(
            "  assertMatch(viewerSrc, /1\\.9\\.19 — THE BAR KEEPS ONE SHAPE/, 'the one-shape law note is missing at the seat');",
            BIRTH_NOTE + "  assertMatch(viewerSrc, /1\\.9\\.18 — THE BAR KEEPS ONE SHAPE/, 'the one-shape law note is missing at the seat');",
        ), (
            "  assertMatch(css, /1\\.9\\.19 — THE BAR KEEPS ONE SHAPE/, 'the one-shape law note is missing in the css');",
            BIRTH_NOTE + "  assertMatch(css, /1\\.9\\.18 — THE BAR KEEPS ONE SHAPE/, 'the one-shape law note is missing in the css');",
        ), (
            "  assertMatch(css, /1\\.9\\.19 — THE LOCK rides its own seat/, 'the lock note is missing in the css');",
            BIRTH_NOTE + "  assertMatch(css, /1\\.9\\.18 — THE LOCK rides its own seat/, 'the lock note is missing in the css');",
        )],
        "law-birth",
    )

    # 2) the 1918 suite's membership pins + parking titles (the mirror ground)
    reseat(
        "scripts/gendex_1918_batch_dom.test.mjs",
        [
            (B1_1918_OLD, B1_1918_NEW),
            (B2_1918_OLD, B2_1918_NEW),
            (
                "ok('A3 — the left zone keeps its LEFT-end parking for the view crew', () => {",
                "ok('A3 — the left zone keeps its LEFT-end parking (the 1.9.19 ground: the count parks here now)', () => {",
            ),
            (
                "ok('A4 — the flank keeps its RIGHT-end parking for the count alone', () => {",
                "ok('A4 — the flank keeps its RIGHT-end parking + its wrap guard (the 1.9.19 ground: the mirrored view crew parks here now)', () => {",
            ),
        ],
        "mirror membership",
    )

    # 3) the 1917 suite's membership pins + parking titles (the mirror ground)
    reseat(
        "scripts/gendex_1917_batch_dom.test.mjs",
        [
            (B1_1917_OLD, B1_1917_NEW),
            (B2_1917_OLD, B2_1917_NEW),
            (
                "ok('A3 — the left zone parks the zoom trio at the bar\\'s own LEFT end', () => {",
                "ok('A3 — the left zone parks the bar\\'s own LEFT end (the 1.9.19 ground: the count parks here now)', () => {",
            ),
            (
                "ok('A4 — the flank parks the count + fit at the bar\\'s own RIGHT end', () => {",
                "ok('A4 — the flank parks the bar\\'s own RIGHT end + its wrap guard (the 1.9.19 ground: the mirrored view crew parks here now)', () => {",
            ),
        ],
        "mirror membership",
    )

    # 4) the 1916 suite's membership pins (the mirror ground)
    reseat(
        "scripts/gendex_1916_batch_dom.test.mjs",
        [
            (B2_1916_OLD, B2_1916_NEW),
            (B3_1916_OLD, B3_1916_NEW),
        ],
        "mirror membership",
    )

    # 5) the 192-196 badge pins (the same shapes every release heals —
    #    the sweep's regex shapes never touch the plain
    #    readme.includes('version-1.9.18-purple') form)
    for name in (
        "gendex_192_batch_dom.test.mjs",
        "gendex_193_batch_dom.test.mjs",
        "gendex_194_batch_dom.test.mjs",
        "gendex_195_batch_dom.test.mjs",
        "gendex_196_batch_dom.test.mjs",
    ):
        p = ROOT / "scripts" / name
        raw = p.read_text(encoding="utf8")
        if "version-1.9.19-purple" in raw and "version-1.9.18-purple" not in raw:
            print(f"  {name}: already healed")
            continue
        assert "version-1.9.18-purple" in raw, f"{name}: the badge pin never spoke"
        p.write_text(raw.replace("version-1.9.18-purple", "version-1.9.19-purple"), encoding="utf8")
        print(f"  {name}: healed")


if __name__ == "__main__":
    main()
