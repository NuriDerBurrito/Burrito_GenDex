#!/usr/bin/env python3
"""1.9.18 — THE SWEEP'S MISSES HEALED (the standing law of every release:
a pin whose ground a newer law moved is re-seated onto the new ground at
its root, with the law's own note).

Three kinds of miss this release:

1) the 1917 suite's law-birth pins were over-swept: the sweep's digit
   pass carried `1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER` (jsx + css
   seats) and `1.9.17 — the lean is retired` (the left rule's parking
   note) onto 1.9.18, but those markers are the 1.9.17 release's OWN
   birth stamps — they live in the source stamped 1.9.17 forever (the
   comment history the seats accumulate). The pins are re-seated back
   onto their birth stamps with the law's note.

2) the 1916 + 1917 suites' MEMBERSHIP pins: THE BAR KEEPS ONE SHAPE
   moved their ground — the ternary that bred two bars is retired (one
   hud markup paints every viewer), the reset key moved home to the
   LEFT zone with the zoom family, the flank now carries the count
   alone, and a single image rides the very same three zones with the
   switcher LOCKED. The branch extraction (split at the ternary) is
   re-seated onto the one hud block, and the membership pins re-seated
   onto the new grounds:

   · B1/B2 (1917) and B2/B3 (1916) — the left zone gains the reset key
     (the view crew − · % · + · reset), the flank loses it (count
     alone).
   · B3 (1917) / B4 (1916) — the mid-seat pins read the one hud block.
   · B4 (1917) / B5 (1916) — the solo pins re-seated onto the lock the
     jsx speaks (const solo + is-locked + disabled + the locked hand),
     with the two-bar ternary banned outright.

3) the 192-196 badge pins (the same shapes every release heals — the
   sweep's regex shapes never touch the plain
   readme.includes('version-1.9.17-purple') form).

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
    "  /* 1.9.18 — the version sweep over-carried this pin's digits: the\n"
    "     marker is the 1.9.17 release's own BIRTH STAMP and lives in\n"
    "     the source stamped 1.9.17 forever — the pin re-seats onto it. */\n"
)

# the one-shape branch extraction — the ternary is retired, the hud block
# is ONE markup now (identical preamble in both suites)
PREAMBLE_OLD = """// the bar's two branches, split at the ternary — the single branch ends
// at the first `</div>` followed by the ternary's close `)}` (the mid
// zone holds no nested div of its own in the single-image family).
const ternAt = viewerSrc.indexOf('images.length > 1 ? (');
const elseAt = viewerSrc.indexOf(') : (', ternAt);
assert.ok(ternAt > 0 && elseAt > ternAt, 'the hud ternary never split');
const multiBranch = viewerSrc.slice(ternAt, elseAt);
const singleBranch = viewerSrc.slice(elseAt).match(/[\\s\\S]*?<\\/div>\\s*\\)\\}/)?.[0] || '';"""

PREAMBLE_NEW = """/* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this extraction: the
   ternary that bred two bars is retired — the hud block is ONE markup
   now, the same shape for every viewer, so the membership pins read it
   whole instead of splitting at a branch that no longer exists. */
const hudBlock = viewerSrc.match(/<div className="gd-imgview-hud">[\\s\\S]*?\\n      <\\/div>/)?.[0] || '';
assert.ok(hudBlock.length > 0, 'the hud block never split');"""

# ---- the 1917 suite -------------------------------------------------------

B1_1917_OLD = r"""ok('B1 — multiple images: the zoom trio rides the left zone alone', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(left, /ZoomOut/, 'the zoom-out key left the left zone');
  assertMatch(left, /gd-imgview-zoomval/, 'the zoom percentage left the left zone');
  assertMatch(left, /ZoomIn/, 'the zoom-in key left the left zone');
  assert.ok(!left.includes('gd-imgview-count'), 'the count never belonged at the left end');
  assert.ok(!left.includes('resetView'), 'the fit key never belonged at the left end');
});"""

B1_1917_NEW = r"""ok('B1 — the view crew rides the left zone (the 1.9.18 retrue: the reset joins the zoom family)', () => {
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

B2_1917_OLD = r"""ok('B2 — multiple images: the count + the fit ride the flank alone', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right end');
  assertMatch(flank, /resetView/, 'the fit key left the right end');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right end');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right end');
});"""

B2_1917_NEW = r"""ok('B2 — the count rides the flank alone (the 1.9.18 retrue: the reset went home)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right end');
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the reset key
     moved home to the left zone — the right end carries the count
     alone, exactly where it stood. */
  assert.ok(!flank.includes('resetView'), 'the reset key still parks at the right end');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right end');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right end');
});"""

B3_1917_OLD = r"""ok('B3 — multiple images: the switcher keeps the mid seat, its zone holds no count', () => {
  assertMatch(multiBranch, /gd-imgview-hud-mid/, 'the mid zone left the multiple branch');
  assertMatch(multiBranch, /gd-imgview-peeks/, 'the peek trio left the multiple branch');
  const midHead = multiBranch.match(/gd-imgview-hud-mid"\s*>[\s\S]*?gd-imgview-peeks/)?.[0] || '';
  assert.ok(!midHead.includes('gd-imgview-count'), 'the count leaned onto the switcher\'s own zone');
});"""

B3_1917_NEW = r"""ok('B3 — the switcher keeps the mid seat, its zone holds no count', () => {
  assertMatch(hudBlock, /gd-imgview-hud-mid/, 'the mid zone left the one-shape bar');
  assertMatch(hudBlock, /gd-imgview-peeks/, 'the peek trio left the one-shape bar');
  const midHead = hudBlock.match(/gd-imgview-hud-mid"\s*>[\s\S]*?gd-imgview-peeks/)?.[0] || '';
  assert.ok(!midHead.includes('gd-imgview-count'), 'the count leaned onto the switcher\'s own zone');
});"""

B4_1917_OLD = r"""ok('B4 — a single image: the whole family rides the MID zone alone, dead center', () => {
  assertMatch(singleBranch, /className="gd-imgview-hud-mid"/, 'the single image lost its mid seat');
  assertMatch(singleBranch, /gd-imgview-count/, 'the count left the single-image family');
  assertMatch(singleBranch, /ZoomOut/, 'the zoom-out key left the single-image family');
  assertMatch(singleBranch, /gd-imgview-zoomval/, 'the zoom percentage left the single-image family');
  assertMatch(singleBranch, /ZoomIn/, 'the zoom-in key left the single-image family');
  assertMatch(singleBranch, /resetView/, 'the fit key left the single-image family');
  assert.ok(!singleBranch.includes('gd-imgview-hud-left'), 'a single image still paints the left zone');
  assert.ok(!singleBranch.includes('gd-imgview-hud-flank'), 'a single image still paints the flank zone');
  assert.ok(!singleBranch.includes('gd-imgview-peeks'), 'a single image still paints a switcher');
});"""

B4_1917_NEW = r"""ok('B4 — a single image: the SAME bar rides, the switcher stands LOCKED (the one-shape law)', () => {
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the solo branch
     is gone with the ternary — one hud markup paints both cases, so the
     solo word rides the lock the jsx speaks, not a second shape. */
  assertMatch(viewerSrc, /const solo = images\.length < 2;/, 'the solo word never spoke');
  assertMatch(viewerSrc, /clsx\('gd-imgview-peeks', solo && 'is-locked'\)/, 'the lock never rides the peeks');
  assertMatch(viewerSrc, /disabled=\{solo\}/, 'the locked peeks never pin the walk');
  assertMatch(viewerSrc, /No other images \(locked\)/, 'the locked hand never speaks its truth');
  assert.ok(!viewerSrc.includes('images.length > 1 ?'), 'the two-bar ternary resurrected');
});"""

# ---- the 1916 suite -------------------------------------------------------

B2_1916_OLD = r"""ok('B2 — multiple images: the zoom trio hugs the switcher\'s LEFT flank', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(left, /ZoomOut/, 'the zoom-out key left the left zone');
  assertMatch(left, /gd-imgview-zoomval/, 'the zoom percentage left the left zone');
  assertMatch(left, /ZoomIn/, 'the zoom-in key left the left zone');
  assert.ok(!left.includes('gd-imgview-count'), 'the count never belonged at the left flank');
  assert.ok(!left.includes('resetView'), 'the fit key never belonged at the left flank');
});"""

B2_1916_NEW = r"""ok('B2 — the zoom trio + the reset key ride the LEFT zone (the 1.9.18 retrue)', () => {
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

B3_1916_OLD = r"""ok('B3 — multiple images: the count + the fit hug the switcher\'s RIGHT flank', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right flank');
  assertMatch(flank, /resetView/, 'the fit key left the right flank');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right flank');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right flank');
});"""

B3_1916_NEW = r"""ok('B3 — the count hugs the RIGHT flank alone (the 1.9.18 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /gd-imgview-count/, 'the count left the right flank');
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the reset key
     moved home to the left zone — the right end carries the count
     alone, exactly where it stood. */
  assert.ok(!flank.includes('resetView'), 'the reset key still parks at the right flank');
  assert.ok(!flank.includes('ZoomOut') && !flank.includes('ZoomIn'), 'the zoom trio never belonged at the right flank');
  assert.ok(!flank.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the right flank');
});"""

B4_1916_OLD = r"""ok('B4 — multiple images: the switcher keeps its dead-center seat (the mid zone)', () => {
  assertMatch(multiBranch, /gd-imgview-hud-mid/, 'the mid zone left the multiple branch');
  assertMatch(multiBranch, /gd-imgview-peeks/, 'the peek trio left the multiple branch');
  // the mid zone's own head (between its seat and the peeks cluster)
  // holds no count — the count rides the flank, never the switcher's bar
  const midHead = multiBranch.match(/gd-imgview-hud-mid"\s*>[\s\S]*?gd-imgview-peeks/)?.[0] || '';
  assert.ok(!midHead.includes('gd-imgview-count'), 'the count leaned onto the switcher\'s own zone');
});"""

B4_1916_NEW = r"""ok('B4 — the switcher keeps its dead-center seat (the mid zone of the one-shape bar)', () => {
  assertMatch(hudBlock, /gd-imgview-hud-mid/, 'the mid zone left the one-shape bar');
  assertMatch(hudBlock, /gd-imgview-peeks/, 'the peek trio left the one-shape bar');
  // the mid zone's own head (between its seat and the peeks cluster)
  // holds no count — the count rides the flank, never the switcher's bar
  const midHead = hudBlock.match(/gd-imgview-hud-mid"\s*>[\s\S]*?gd-imgview-peeks/)?.[0] || '';
  assert.ok(!midHead.includes('gd-imgview-count'), 'the count leaned onto the switcher\'s own zone');
});"""

B5_1916_OLD = r"""ok('B5 — a single image: the whole family rides the MID zone alone, dead center', () => {
  assertMatch(singleBranch, /className="gd-imgview-hud-mid"/, 'the single image lost its mid seat');
  assertMatch(singleBranch, /gd-imgview-count/, 'the count left the single-image family');
  assertMatch(singleBranch, /ZoomOut/, 'the zoom-out key left the single-image family');
  assertMatch(singleBranch, /gd-imgview-zoomval/, 'the zoom percentage left the single-image family');
  assertMatch(singleBranch, /ZoomIn/, 'the zoom-in key left the single-image family');
  assertMatch(singleBranch, /resetView/, 'the fit key left the single-image family');
  assert.ok(!singleBranch.includes('gd-imgview-hud-left'), 'a single image still paints the left zone');
  assert.ok(!singleBranch.includes('gd-imgview-hud-flank'), 'a single image still paints the flank zone');
  assert.ok(!singleBranch.includes('gd-imgview-peeks'), 'a single image still paints a switcher');
});"""

B5_1916_NEW = r"""ok('B5 — a single image: the SAME bar rides, the switcher stands LOCKED (the one-shape law)', () => {
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the solo branch
     is gone with the ternary — one hud markup paints both cases, so the
     solo word rides the lock the jsx speaks, not a second shape. */
  assertMatch(viewerSrc, /const solo = images\.length < 2;/, 'the solo word never spoke');
  assertMatch(viewerSrc, /clsx\('gd-imgview-peeks', solo && 'is-locked'\)/, 'the lock never rides the peeks');
  assertMatch(viewerSrc, /disabled=\{solo\}/, 'the locked peeks never pin the walk');
  assertMatch(viewerSrc, /No other images \(locked\)/, 'the locked hand never speaks its truth');
  assert.ok(!viewerSrc.includes('images.length > 1 ?'), 'the two-bar ternary resurrected');
});"""


def main() -> None:
    # 1) the 1917 suite's law-birth pins (the sweep over-carried the
    #    digits; the markers keep their 1.9.17 birth stamps in source)
    reseat(
        "scripts/gendex_1917_batch_dom.test.mjs",
        [(
            "  assertMatch(viewerSrc, /1\\.9\\.18 — THE MIDDLE BELONGS TO THE SWITCHER/, 'the middle law note is missing at the seat');",
            BIRTH_NOTE + "  assertMatch(viewerSrc, /1\\.9\\.17 — THE MIDDLE BELONGS TO THE SWITCHER/, 'the middle law note is missing at the seat');",
        ), (
            "  assertMatch(css, /1\\.9\\.18 — THE MIDDLE BELONGS TO THE SWITCHER/, 'the middle law note is missing in the css');",
            BIRTH_NOTE + "  assertMatch(css, /1\\.9\\.17 — THE MIDDLE BELONGS TO THE SWITCHER/, 'the middle law note is missing in the css');",
        ), (
            "  assertMatch(left, /1\\.9\\.18 — the lean is retired/, 'the parking note is missing at the rule');",
            BIRTH_NOTE + "  assertMatch(left, /1\\.9\\.17 — the lean is retired/, 'the parking note is missing at the rule');",
        )],
        "law-birth",
    )

    # 2) the 1917 suite's membership pins (the one-shape ground)
    reseat(
        "scripts/gendex_1917_batch_dom.test.mjs",
        [
            (PREAMBLE_OLD, PREAMBLE_NEW),
            (B1_1917_OLD, B1_1917_NEW),
            (B2_1917_OLD, B2_1917_NEW),
            (B3_1917_OLD, B3_1917_NEW),
            (B4_1917_OLD, B4_1917_NEW),
        ],
        "one-shape membership",
    )

    # 3) the 1916 suite's membership pins (the one-shape ground)
    reseat(
        "scripts/gendex_1916_batch_dom.test.mjs",
        [
            (PREAMBLE_OLD, PREAMBLE_NEW),
            (B2_1916_OLD, B2_1916_NEW),
            (B3_1916_OLD, B3_1916_NEW),
            (B4_1916_OLD, B4_1916_NEW),
            (B5_1916_OLD, B5_1916_NEW),
        ],
        "one-shape membership",
    )

    # 4) the 192-196 badge pins (the same shapes every release heals —
    #    the sweep's regex shapes never touch the plain
    #    readme.includes('version-1.9.17-purple') form)
    for name in (
        "gendex_192_batch_dom.test.mjs",
        "gendex_193_batch_dom.test.mjs",
        "gendex_194_batch_dom.test.mjs",
        "gendex_195_batch_dom.test.mjs",
        "gendex_196_batch_dom.test.mjs",
    ):
        p = ROOT / "scripts" / name
        raw = p.read_text(encoding="utf8")
        if "version-1.9.18-purple" in raw and "version-1.9.17-purple" not in raw:
            print(f"  {name}: already healed")
            continue
        assert "version-1.9.17-purple" in raw, f"{name}: the badge pin never spoke"
        p.write_text(raw.replace("version-1.9.17-purple", "version-1.9.18-purple"), encoding="utf8")
        print(f"  {name}: healed")


if __name__ == "__main__":
    main()
