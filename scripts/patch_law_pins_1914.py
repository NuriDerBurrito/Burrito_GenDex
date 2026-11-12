#!/usr/bin/env python3
"""1.9.14 law-pin healing — the sweep's misses (the standing law: the prior
suites' shape-pins that the new cure legitimately retires get re-seated
onto the new law, exactly as every release before it).

Two seats heal:
  · the 1913 suite's A4 — the weight law: the 8 stops were "pre-divided
    to 47%" (the 1.9.13 arithmetic); the 1.9.14 cure retired the
    pre-division (the outer-quarter wash) and speaks the RESTING
    COMPOSITE instead (the opaque rim hue mixed onto the card's own
    ground at 66%). The law re-seats onto the new stop shape + keeps
    the retired-disease guards.
  · the 1912 suite's B3 — the same stop-count line inside the retrue
    law; re-seated the same way.

The worklog seat (D5) needs no patch — the 1.9.14 worklog entry itself
turns it green the moment this release's entry lands.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NEW_STOP = r"color-mix\(in srgb, rgb\(from var\(--gd-fin-ink-outline, rgba\(13, 10, 7, 0\.66\)\) r g b \/ 1\) 66%, var\(--gd-card-tint, var\(--gd-panel\)\)\)"


def sub(path: str, old: str, new: str) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already seated")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:140]}"
    raw = raw.replace(old, new, 1)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


def main() -> None:
    # the 1913 suite's A4
    sub(
        "scripts/gendex_1913_batch_dom.test.mjs",
        """ok('A4 — the weight law: 8 stops, every one pre-divided to 47%, the FULL-color stop retired', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  const stops = rule.match(/color-mix\\(in srgb, var\\(--gd-fin-ink-outline, rgba\\(13, 10, 7, 0\\.66\\)\\) 47%, transparent\\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 pre-divided stops (found ${stops.length})`);
  assert.equal(rule.includes(') 0 0 var(--gd-fin-ink-outline'), false, 'a full-color 1.9.12 step still speaks (the weight disease)');
});""",
        f"""ok('A4 — the weight law (the 1.9.14 retrue): 8 stops, every one the RESTING COMPOSITE — the opaque rim hue mixed onto the card own ground at 66%, the pre-division retired', () => {{
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  const stops = rule.match(/{NEW_STOP}/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 resting-composite stops (found ${{stops.length}})`);
  assert.equal(rule.includes(') 47%, transparent)'), false, 'a 1.9.13 pre-divided step still speaks (the outer-quarter wash the 1.9.14 report caught)');
  assert.equal(rule.includes(') 0 0 var(--gd-fin-ink-outline'), false, 'a full-color 1.9.12 step still speaks (the weight disease)');
}});""",
    )

    # the 1912 suite's B3
    sub(
        "scripts/gendex_1912_batch_dom.test.mjs",
        """  const stops = rule.match(/color-mix\\(in srgb, var\\(--gd-fin-ink-outline, rgba\\(13, 10, 7, 0\\.66\\)\\) 47%, transparent\\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 ways at the pre-divided weight (found ${stops.length})`);""",
        f"""  const stops = rule.match(/{NEW_STOP}/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 ways at the resting composite (found ${{stops.length}})`);""",
    )
    print("1.9.14 law pins healed: 1913 A4 + 1912 B3 re-seated onto the mixed-ink law")

    # ---- the 159/160/165 bold README pins (the sweep's shapes never reach
    #      the includes('**v…**') form — the same miss every release heals;
    #      the README fronts the LIVE version) ----
    for suite in ("159", "160", "165"):
        sub(f"scripts/gendex_{suite}_batch_dom.test.mjs", "**v1.9.13**", "**v1.9.14**")
    print("1.9.14 bold README pins re-seated: 159/160/165")

    # ---- the five 192-196 badge pins (the sweep's shapes never reach the
    #      includes('version-…-purple') form — the same miss every release
    #      heals; the badge is a LIVE seat tracking the current release) ----
    for suite in ("192", "193", "194", "195", "196"):
        sub(f"scripts/gendex_{suite}_batch_dom.test.mjs", "version-1.9.13-purple", "version-1.9.14-purple")
    print("1.9.14 badge pins re-seated: 192/193/194/195/196")


if __name__ == "__main__":
    main()
