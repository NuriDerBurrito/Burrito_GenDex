#!/usr/bin/env python3
"""1.9.17 — THE SWEEP'S MISSES HEALED (the standing law of every release:
a pin whose ground a newer law moved is re-seated onto the new ground at
its root, with the law's own note).

Two kinds of miss this release:

1) the 1916 suite's law-birth pins were over-swept: the sweep's digit
   pass carried `1.9.16 — THE WALL WAITS FOR THE OPEN` / `THE BAR FINDS
   ITS BALANCE` onto 1.9.17, but those markers are the 1.9.16 release's
   OWN birth stamps — they live in the source stamped 1.9.16 forever (the
   comment history the seats accumulate). The pins are re-seated back
   onto their birth stamps with the law's note, so the 1916 suite keeps
   proving the 1.9.16 laws at the roots where 1.9.17 touched nothing
   (the A-family wall laws) — and the B-family's superseded parking pins
   are re-seated onto THE MIDDLE BELONGS TO THE SWITCHER:

   · the 1916 suite's B6 — the CSS balance law's lean pin: the left
     zone's justify-content moved flex-end -> flex-start (the 1.9.16
     lean WAS the reported mixing: both control groups pressed against
     the switcher's arrows). Re-seated onto the LEFT-end parking with
     the retired-lean guard (the flex-end shape banned from the rule),
     the grid law and the mid's dead-center word kept, the birth stamp
     healed, the retired-seats guards kept.
   · the 1916 suite's B7 — the flank's lean pin: justify-content moved
     flex-start -> flex-end. Re-seated onto the RIGHT-end parking with
     the retired-lean guard, the gaps and the wrap word kept.

2) the 192-196 badge pins (the same shapes every release heals — the
   sweep's regex shapes never touch the plain
   readme.includes('version-1.9.16-purple') form).

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


B6_OLD = r"""ok('B6 — the zones lean toward the center (the CSS balance law)', () => {
  const hud = css.match(/^\.gd-imgview-hud \{[^}]*\}/m)?.[0] || '';
  assertMatch(hud, /grid-template-columns:\s*1fr auto 1fr/, 'the bar lost its 1fr · auto · 1fr grid');
  const left = css.match(/^\.gd-imgview-hud-left \{[^}]*\}/m)?.[0] || '';
  assertMatch(left, /justify-content:\s*flex-end/, 'the left zone stopped leaning toward the center');
  const mid = css.match(/^\.gd-imgview-hud-mid \{[^}]*\}/m)?.[0] || '';
  assertMatch(mid, /justify-content:\s*center/, 'the mid zone lost its dead-center word');
  assertMatch(mid, /gap:\s*8px;/, 'the mid zone lost its own gaps');
  assertMatch(css, /1\.9\.17 — THE BAR FINDS ITS BALANCE/, 'the balance law note is missing in the css');
  // the retired seats stay retired (the 1.9.15 word carries forward)
  assert.ok(!css.includes('.gd-imgview-hud-right'), 'the right-zone rule resurrected');
  assert.ok(!css.includes('.gd-imgview-hint'), 'the hint rule resurrected');
});"""

B6_NEW = r"""ok('B6 — the parking law (the 1.9.17 retrue): the family parks at the bar\'s ends', () => {
  const hud = css.match(/^\.gd-imgview-hud \{[^}]*\}/m)?.[0] || '';
  assertMatch(hud, /grid-template-columns:\s*1fr auto 1fr/, 'the bar lost its 1fr · auto · 1fr grid');
  const left = css.match(/^\.gd-imgview-hud-left \{[^}]*\}/m)?.[0] || '';
  /* 1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER re-seated this pin: the
     1.9.16 lean (flex-end, toward the switcher) was the mixing the
     report retired — the zone parks at the bar's LEFT end now. */
  assertMatch(left, /justify-content:\s*flex-start/, 'the left zone drifted off the bar\'s left end');
  assert.ok(!left.includes('justify-content: flex-end'), 'the 1.9.16 lean still drives the left zone (the mixing disease)');
  const mid = css.match(/^\.gd-imgview-hud-mid \{[^}]*\}/m)?.[0] || '';
  assertMatch(mid, /justify-content:\s*center/, 'the mid zone lost its dead-center word');
  assertMatch(mid, /gap:\s*8px;/, 'the mid zone lost its own gaps');
  /* the balance law's own birth stamp — the sweep over-carried the
     digits; the css keeps its 1.9.16 stanza as comment history. */
  assertMatch(css, /1\.9\.16 — THE BAR FINDS ITS BALANCE/, 'the balance law note is missing in the css');
  // the retired seats stay retired (the 1.9.15 word carries forward)
  assert.ok(!css.includes('.gd-imgview-hud-right'), 'the right-zone rule resurrected');
  assert.ok(!css.includes('.gd-imgview-hint'), 'the hint rule resurrected');
});"""

B7_OLD = r"""ok('B7 — the flank zone is a real seat of its own (the balance\'s right hand)', () => {
  assertMatch(css, /\.gd-imgview-hud-flank \{/, 'the flank rule never took its seat');
  const flank = css.match(/^\.gd-imgview-hud-flank \{[^}]*\}/m)?.[0] || '';
  assertMatch(flank, /justify-content:\s*flex-start/, 'the flank stopped leaning toward the center');
  assertMatch(flank, /gap:\s*8px;/, 'the flank lost its own gaps');
  assertMatch(flank, /flex-wrap:\s*wrap;/, 'the flank lost its wrap word');
});"""

B7_NEW = r"""ok('B7 — the flank keeps its own seat, parked at the bar\'s right end (the 1.9.17 retrue)', () => {
  assertMatch(css, /\.gd-imgview-hud-flank \{/, 'the flank rule never took its seat');
  const flank = css.match(/^\.gd-imgview-hud-flank \{[^}]*\}/m)?.[0] || '';
  /* 1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER re-seated this pin: the
     1.9.16 lean (flex-start, toward the switcher) was the mixing the
     report retired — the flank parks at the bar's RIGHT end now. */
  assertMatch(flank, /justify-content:\s*flex-end/, 'the flank drifted off the bar\'s right end');
  assert.ok(!flank.includes('justify-content: flex-start'), 'the 1.9.16 lean still drives the flank (the mixing disease)');
  assertMatch(flank, /gap:\s*8px;/, 'the flank lost its own gaps');
  assertMatch(flank, /flex-wrap:\s*wrap;/, 'the flank lost its wrap word');
});"""


def main() -> None:
    # 1) the 1916 suite: the superseded parking pins re-seated onto the
    #    1.9.17 law (B6 carries its own healed birth stamp inside the block)
    reseat(
        "scripts/gendex_1916_batch_dom.test.mjs",
        [(B6_OLD, B6_NEW), (B7_OLD, B7_NEW)],
        "the middle-law parking",
    )

    # 2) the 1916 suite's law-birth pins outside the re-seated blocks
    #    (the sweep over-carried the digits; the markers keep their 1.9.16
    #    birth stamps in source)
    NOTE = (
        "  /* 1.9.17 — the version sweep over-carried this pin's digits: the\n"
        "     marker is the 1.9.16 release's own BIRTH STAMP and lives in\n"
        "     the source stamped 1.9.16 forever — the pin re-seats onto it. */\n"
    )
    reseat(
        "scripts/gendex_1916_batch_dom.test.mjs",
        [(
            "  assertMatch(masonrySrc, /1\\.9\\.17 — THE WALL WAITS FOR THE OPEN/, 'the wall law note is missing at the seat');",
            NOTE + "  assertMatch(masonrySrc, /1\\.9\\.16 — THE WALL WAITS FOR THE OPEN/, 'the wall law note is missing at the seat');",
        ), (
            "  assertMatch(viewerSrc, /1\\.9\\.17 — THE BAR FINDS ITS BALANCE/, 'the balance law note is missing at the seat');",
            NOTE + "  assertMatch(viewerSrc, /1\\.9\\.16 — THE BAR FINDS ITS BALANCE/, 'the balance law note is missing at the seat');",
        )],
        "law-birth",
    )

    # 3) the 192-196 badge pins (the same shapes every release heals —
    #    the sweep's regex shapes never touch the plain
    #    readme.includes('version-1.9.16-purple') form)
    for name in (
        "gendex_192_batch_dom.test.mjs",
        "gendex_193_batch_dom.test.mjs",
        "gendex_194_batch_dom.test.mjs",
        "gendex_195_batch_dom.test.mjs",
        "gendex_196_batch_dom.test.mjs",
    ):
        p = ROOT / "scripts" / name
        raw = p.read_text(encoding="utf8")
        if "version-1.9.17-purple" in raw and "version-1.9.16-purple" not in raw:
            print(f"  {name}: already healed")
            continue
        assert "version-1.9.16-purple" in raw, f"{name}: the badge pin never spoke"
        p.write_text(raw.replace("version-1.9.16-purple", "version-1.9.17-purple"), encoding="utf8")
        print(f"  {name}: healed")


if __name__ == "__main__":
    main()
