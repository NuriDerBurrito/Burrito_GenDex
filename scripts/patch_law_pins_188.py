#!/usr/bin/env python3
"""1.8.8 — the law-pin pass after the sweep (version_sweep_188.py moved
every live 1.8.6 pin to 1.8.8; two families need their own word):

1. THE OVER-SWEPT BIRTH TOMBSTONES — the pins that watch the 1.8.6 laws'
   own notes (THE SILENT ASCENT, THE HAND OPENS THE TRAY ITSELF, THE
   FOLDED REST, THE OUTLINE ANSWERS THE HAND, THE WHEEL'S OWN DOOR)
   still speak 1.8.6 in the SOURCE — the birth version stays in the
   law's own prose forever — so the pins revert to the birth digits,
   exactly the way the 1.8.4 pass taught. (The D-section furniture pins
   keep their swept 1.8.8: the version seats are the one thing that DOES
   move.)

2. THE TERMS MOVE TO 1.0.4 — legal.js bumped TOS_VERSION 1.0.3 -> 1.0.4
   with the platform + SQLite pass (ported from the discarded 1.8.7
   line, shipping with 1.8.8), so every pin on the live constant follows
   the live seat (suite titles keep their birth story; assertion bodies
   speak the current truth), and 166's P2 learns the new asking
   arithmetic: a 1.0.3 record now RE-ASKS, and the resting seat belongs
   to 1.0.4.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITES = ROOT / "scripts"


def sub(fname: str, old: str, new: str, count=None) -> None:
    p = SUITES / fname
    raw = p.read_text(encoding="utf8")
    n = raw.count(old)
    assert n > 0, f"{fname}: the over-swept pin never spoke:\n{old[:110]}"
    if count is not None:
        assert n == count, f"{fname}: expected {count} seats, found {n}"
    raw = raw.replace(old, new)
    p.write_text(raw, encoding="utf8")
    print(f"  {fname}: {n} pin(s) re-seated")


LAW_SUITS = [
    "gendex_183_batch_dom.test.mjs",
    "gendex_184_batch_dom.test.mjs",
    "gendex_185_batch_dom.test.mjs",
    "gendex_186_batch_dom.test.mjs",
    "gendex_187_batch_dom.test.mjs",
]

# the birth-tombstone reverts (each form lives only in law pins — the
# D-section furniture pins speak the swept title-case forms, which none of
# these ever match)
LAW_REVERTS = [
    (r"1\.8\.8 — THE SILENT ASCENT", r"1\.8\.6 — THE SILENT ASCENT"),
    (r"1\.8\.8 — THE HAND OPENS THE TRAY ITSELF", r"1\.8\.6 — THE HAND OPENS THE TRAY ITSELF"),
    (r"1\.8\.8 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT", r"1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT"),
    (r"1\.8\.8 — THE OUTLINE ANSWERS THE HAND", r"1\.8\.6 — THE OUTLINE ANSWERS THE HAND"),
    (r"1\.8\.8 — THE WHEEL'S OWN DOOR", r"1\.8\.6 — THE WHEEL'S OWN DOOR"),
    # the second-pass finds: the payer's retirement tombstone and the road
    # choice's inner digit both speak their 1.8.6 births in the source
    (r"RETIRED IN 1\.8\.8", r"RETIRED IN 1\.8\.6"),
    (r"THE ROAD CHOICE, AND IN 1\.8\.8 THERE IS ONLY ONE ROAD", r"THE ROAD CHOICE, AND IN 1\.8\.6 THERE IS ONLY ONE ROAD"),
]


def main() -> None:
    print("the birth tombstones revert:")
    for fname in LAW_SUITS:
        for old, new in LAW_REVERTS:
            p = SUITES / fname
            raw = p.read_text(encoding="utf8")
            if old in raw:
                sub(fname, old, new)

    print("\nthe terms move to 1.0.4:")

    # 161 D1 — the pin on the live constant
    sub(
        "gendex_161_compat_legal.test.mjs",
        "  assert(/export const TOS_VERSION = '1\\.0\\.3';/.test(legalSrc), 'TOS_VERSION is missing or moved');",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.4';/.test(legalSrc), 'TOS_VERSION is missing or moved');",
    )

    # 163 A4 + B2
    sub(
        "gendex_163_batch_dom.test.mjs",
        "  assert(/export const TOS_VERSION = '1\\.0\\.3';/.test(legalConstSrc), 'the terms version never moved to 1.0.3');",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.4';/.test(legalConstSrc), 'the terms version never moved to 1.0.4');",
    )
    sub(
        "gendex_163_batch_dom.test.mjs",
        "  assert.equal(TOS_VERSION, '1.0.3');",
        "  assert.equal(TOS_VERSION, '1.0.4'); // 1.8.8 — the platform + SQLite pass moved the seat",
    )

    # 164 A1 + P1
    sub(
        "gendex_164_batch_dom.test.mjs",
        "  assert(/export const TOS_VERSION = '1\\.0\\.3';/.test(legalConstSrc), 'the terms version never moved to 1.0.3');",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.4';/.test(legalConstSrc), 'the terms version never moved to 1.0.4');",
    )
    sub(
        "gendex_164_batch_dom.test.mjs",
        "  assert.equal(TOS_VERSION, '1.0.3');",
        "  assert.equal(TOS_VERSION, '1.0.4'); // 1.8.8 — the platform + SQLite pass moved the seat",
    )

    # 166 I1 + P2
    sub(
        "gendex_166_batch_dom.test.mjs",
        "  assert.match(legalSrc, /export const TOS_VERSION = '1\\.0\\.3';/, 'the terms version never moved to 1.0.3');",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert.match(legalSrc, /export const TOS_VERSION = '1\\.0\\.4';/, 'the terms version never moved to 1.0.4');",
    )
    sub(
        "gendex_166_batch_dom.test.mjs",
        """ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  assert.equal(TOS_VERSION, '1.0.3');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.3', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.3 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.3');
  assert.equal(PRIVACY_DOC.version, '1.0.3');
});""",
        """ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass): the
  // 1.0.3 record now re-asks too, and the resting seat belongs to 1.0.4.
  assert.equal(TOS_VERSION, '1.0.4');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const prior = createSafeDb({ settings: { tosAcceptance: { version: '1.0.3', at: 12345 } } });
  assert.notEqual(prior.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.3 record must not count as current either (the 1.8.8 bump)');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.4', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.4 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.4');
  assert.equal(PRIVACY_DOC.version, '1.0.4');
});""",
    )

    print("\nlaw pins re-seated for 1.8.8.")


if __name__ == "__main__":
    main()
