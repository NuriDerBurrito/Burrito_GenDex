#!/usr/bin/env python3
r"""1.8.3 law-pin patch — re-pins the SUPERSEDED law in the 183 suite and
reverts the over-swept HISTORICAL note pins to their birth versions.

The supersession this version leaves behind:
  · 183's G1 — the 1.8.2 give-back read the height from the rows body's
    own rect and paid it at LISTENER time; the fold and its give-back
    land in the SAME BREATH now (1.8.3) — the listener paints the fold
    on the DOM itself and reads what ACTUALLY left from the scroller's
    scrollHeight. The note's tombstone keeps its 1.8.2 name; the give
    pin moves to the measured form.

The over-sweeps (historical notes keep their birth version):
  · 183's A1/B1/D1/E1/E2/F1/G2/H1 note pins -> 1.8.2 (their birth —
    every one of those laws still speaks its 1.8.2 comment in the code;
    only the give-back's CODE was superseded, and G1's line pins move).
  · 161's G6 newer-archive pin — the escaped sweep's substring hand
    caught the FUTURE-version simulation (v1\.8\.20 read as 1\.8\.2
    plus a trailing 0) and left it speaking v1\.8\.30; restored to the
    v1\.8\.20 the gate actually threads.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def patch(path: str, pairs, count_required=None) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    n = 0
    for old, new in pairs:
        if old in raw:
            raw = raw.replace(old, new, 1)
            n += 1
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: {n} pin(s) moved")


def main() -> None:
    # 161 — the newer-archive simulation keeps its future version
    patch(
        "scripts/gendex_161_compat_legal.test.mjs",
        [
            (
                "assert.match(bodyText, /last saved by v1\\.8\\.30/i, 'the newer-archive warning never spoke');",
                "assert.match(bodyText, /last saved by v1\\.8\\.20/i, 'the newer-archive warning never spoke');",
            ),
        ],
    )

    # 183 — the fold lands in the same breath (the real supersession) + the
    # birth-version note reverts
    patch(
        "scripts/gendex_183_batch_dom.test.mjs",
        [
            (
                "assertMatch(cv, /1\\.8\\.3 — THE GIVE-BACK MEETS THE STICKY HEADER/, 'the give-back note is missing');",
                "assertMatch(cv, /1\\.8\\.2 — THE GIVE-BACK MEETS THE STICKY HEADER/, 'the give-back note is missing');",
            ),
            (
                "  assertMatch(cv, /give = Math\\.min\\(body\\.height, Math\\.max\\(0, scroller\\.scrollTop\\)\\);/, 'the give never spoke its bounded word');",
                "  // 1.8.3 — the fold and its give-back land in the SAME BREATH: the listener\n"
                "  // paints the fold on the DOM itself and reads what ACTUALLY left from the\n"
                "  // scroller's own scrollHeight (the body-rect guess rides off — it under-paid\n"
                "  // by the tray's own 13px and paid a breath ahead of the height it bought).\n"
                "  assertMatch(cv, /const give = Math\\.min\\(left, Math\\.max\\(0, seatBefore\\)\\);/, 'the give never spoke its bounded word');",
            ),
            (
                "  assertMatch(cv, /if \\(give > 0\\) scroller\\.scrollTop = Math\\.max\\(0, scroller\\.scrollTop - give\\);/, 'the give-back write lost its seat');",
                "  // 1.8.3 — and the seat rides the breath it held: Chromium clamps the offset\n"
                "  // the moment the height leaves, so the pay reads the PRE-fold seat (paying\n"
                "  // from the clamped seat would pay the clamp TWICE at the bottom).\n"
                "  assertMatch(cv, /if \\(give > 0\\) scroller\\.scrollTop = Math\\.max\\(0, seatBefore - give\\);/, 'the give-back write lost its seat');",
            ),
            (
                "assertMatch(css, /1\\.8\\.3 — THE BORDER'S OWN ARROW/, 'the border-arrow note is missing');",
                "assertMatch(css, /1\\.8\\.2 — THE BORDER'S OWN ARROW/, 'the border-arrow note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.3 — THE ROSTER RISES TO THE CARD'S OWN PADDING/, 'the roster note is missing');",
                "assertMatch(css, /1\\.8\\.2 — THE ROSTER RISES TO THE CARD'S OWN PADDING/, 'the roster note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.3 — THE PULL IS A SNAPSHOT/, 'the snapshot note is missing');",
                "assertMatch(css, /1\\.8\\.2 — THE PULL IS A SNAPSHOT/, 'the snapshot note is missing');",
            ),
            (
                "assertMatch(settings, /1\\.8\\.3 — THE SWAP LANDS IN ONE FRAME UNDER REDUCED MOTION/, 'the one-frame note is missing');",
                "assertMatch(settings, /1\\.8\\.2 — THE SWAP LANDS IN ONE FRAME UNDER REDUCED MOTION/, 'the one-frame note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.3 — THE GHOST'S OWN RESTING SILENCE/, 'the resting-silence note is missing');",
                "assertMatch(css, /1\\.8\\.2 — THE GHOST'S OWN RESTING SILENCE/, 'the resting-silence note is missing');",
            ),
            (
                "assertMatch(grid, /1\\.6\\.9 — THE GHOST RETIRES WITH THE PREVIEW[\\s\\S]*?RETIRED by 1\\.8\\.3/, 'the retired-retirement note is missing');",
                "assertMatch(grid, /1\\.6\\.9 — THE GHOST RETIRES WITH THE PREVIEW[\\s\\S]*?RETIRED by 1\\.8\\.2/, 'the retired-retirement note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.3 — THE SNAP SEAT COVERS THE WHOLE TRAY/, 'the tray-snap note is missing');",
                "assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY/, 'the tray-snap note is missing');",
            ),
            (
                "assertMatch(helpersSrc, /1\\.8\\.3 — A WIDE CARD NEVER INDENTS PAST AN OPEN LANE/, 'the lane note is missing');",
                "assertMatch(helpersSrc, /1\\.8\\.2 — A WIDE CARD NEVER INDENTS PAST AN OPEN LANE/, 'the lane note is missing');",
            ),
        ],
    )


if __name__ == "__main__":
    main()
