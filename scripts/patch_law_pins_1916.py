#!/usr/bin/env python3
"""1.9.16 — THE SWEEP'S MISSES HEALED (the standing law of every release:
a pin whose ground a newer law moved is re-seated onto the new ground at
its root, with the law's own note).

Two kinds of miss this release:

1) gendex_197_batch_dom.test.mjs C1 pinned the follow effect's packed-seat
   fallback as `const p = posById.get(keepInViewId);` — the 1.9.6 closure
   read. 1.9.16's THE WALL WAITS FOR THE OPEN re-runs the effect on the
   SELECTION alone, so the fallback now reads the LIVE pack through the
   ref (`posByIdRef.current.get(...)`) — the pin is re-seated onto the
   ref read with the law's note, keeping the C1 family (pin + smooth +
   mounted read) byte-true for the rest.

2) the 1915 suite's LAW-BIRTH pins were over-swept: the sweep's digit
   pass carried `1\.9\.15 — THE HINT IS RETIRED` / `THE HINT ZONE IS
   RETIRED` / `THE COVERAGE DEMAND CAPS AT ONE ROW` onto 1.9.16, but
   those markers are the 1.9.15 release's OWN birth stamps — they live in
   the source stamped 1.9.15 forever (the sweep excludes birth pins of
   the CURRENT suite; the PREVIOUS suite's law pins are the same breed).
   The three pins are re-seated back onto their birth stamps with the
   law's note, so the 1915 suite keeps proving the 1.9.15 laws at the
   roots where 1.9.16 touched nothing.

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


def main() -> None:
    # 1) the 197 suite's moved ground (the effect reads the ref now)
    reseat(
        "scripts/gendex_197_batch_dom.test.mjs",
        [(
            "  assertMatch(masonry, /const p = posById\\.get\\(keepInViewId\\);/, 'the packed-seat fallback never spoke');",
            (
                "  /* 1.9.16 — THE WALL WAITS FOR THE OPEN re-seated this pin: the\n"
                "     follow effect re-runs on the selection alone now, so the\n"
                "     packed-seat fallback reads the LIVE pack through the ref. */\n"
                "  assertMatch(masonry, /const p = posByIdRef\\.current\\.get\\(keepInViewId\\);/, 'the packed-seat fallback never spoke');"
            ),
        )],
        "C1 packed-seat",
    )

    # 2) the 1915 suite's law-birth pins (the sweep over-carried the
    #    digits; the markers keep their 1.9.15 birth stamps in source)
    NOTE = (
        "  /* 1.9.16 — the version sweep over-carried this pin's digits: the\n"
        "     marker is the 1.9.15 release's own BIRTH STAMP and lives in\n"
        "     the source stamped 1.9.15 forever — the pin re-seats onto it. */\n"
    )
    reseat(
        "scripts/gendex_1915_batch_dom.test.mjs",
        [(
            "  assertMatch(viewerSrc, /1\\.9\\.16 — THE HINT IS RETIRED/, 'the retirement law is missing at the seat');",
            NOTE + "  assertMatch(viewerSrc, /1\\.9\\.15 — THE HINT IS RETIRED/, 'the retirement law is missing at the seat');",
        ), (
            "  assertMatch(css, /1\\.9\\.16 — THE HINT ZONE IS RETIRED/, 'the retirement law is missing in the css');",
            NOTE + "  assertMatch(css, /1\\.9\\.15 — THE HINT ZONE IS RETIRED/, 'the retirement law is missing in the css');",
        ), (
            "  assertMatch(helpersSrc, /1\\.9\\.16 — THE COVERAGE DEMAND CAPS AT ONE ROW/, 'the row-cap law note is missing');",
            NOTE + "  assertMatch(helpersSrc, /1\\.9\\.15 — THE COVERAGE DEMAND CAPS AT ONE ROW/, 'the row-cap law note is missing');",
        )],
        "law-birth",
    )


    # 3) the 192-196 badge pins (the same shapes every release heals —
    #    the sweep's regex shapes never touch the plain
    #    readme.includes('version-1.9.15-purple') form)
    for name in (
        "gendex_192_batch_dom.test.mjs",
        "gendex_193_batch_dom.test.mjs",
        "gendex_194_batch_dom.test.mjs",
        "gendex_195_batch_dom.test.mjs",
        "gendex_196_batch_dom.test.mjs",
    ):
        p = ROOT / "scripts" / name
        raw = p.read_text(encoding="utf8")
        if "version-1.9.16-purple" in raw and "version-1.9.15-purple" not in raw:
            print(f"  {name}: already healed")
            continue
        assert "version-1.9.15-purple" in raw, f"{name}: the badge pin never spoke"
        p.write_text(raw.replace("version-1.9.15-purple", "version-1.9.16-purple"), encoding="utf8")
        print(f"  {name}: healed")


if __name__ == "__main__":
    main()
