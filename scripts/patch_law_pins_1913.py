#!/usr/bin/env python3
"""1.9.13 law-pin patches — the sweep's misses healed (the standing law of
every release: when a LAW moves, the older suites' pins re-seat onto the
new law at the same seat; the sweep only carries version digits).

The 1.9.13 retrue moved three pinned shapes:
  · the 1912 suite's B3 — the rim contour's steps (1.1px/0.8px at the full
    rim color -> 0.85px/0.6px at the 47% pre-divided color) re-seat onto
    the stroke's own width and weight
  · the 1912 suite's B5 — the plain run's contour (1px -> 0.75px) re-seats
    onto its own stroke's outer half, and the BOLD run's own seat joins
    the check (1px/0.71px, the values the family shared before)
  · the 1911 suite's B3 — the 0.37.0 contour's 8-way offsets (1px/0.7px ->
    0.75px/0.53px) re-seat onto the plain stroke's own width, so the
    birth suite of the selection cure keeps answering the sheet it audits

Run from the app root (after version_sweep_1913.py)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already re-seated")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:160]}"
    assert raw.count(old) == 1, f"{path}: seat not unique: {old[:80]}"
    raw = raw.replace(old, new, 1)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: re-seated")


# ---- the 1912 suite: B3 (the rim contour's steps + the pre-division) ----
sub(
    "scripts/gendex_1912_batch_dom.test.mjs",
    """ok('B3 — the rim\\'s own color carries the ring through the highlight, at the rim\\'s scaled width (8-way)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /var\\(--gd-fin-ink-outline, rgba\\(13, 10, 7, 0\\.66\\)\\)/, 'the contour lost the rim\\'s own color');
  assertMatch(rule, /calc\\(1\\.1px \\* var\\(--card-scale, 1\\)\\) 0 0/, 'the straight contour steps lost the card scale');
  assertMatch(rule, /calc\\(0\\.8px \\* var\\(--card-scale, 1\\)\\) calc\\(0\\.8px \\* var\\(--card-scale, 1\\)\\) 0/, 'the diagonal contour steps lost the card scale');
  const stops = rule.match(/var\\(--gd-fin-ink-outline, rgba\\(13, 10, 7, 0\\.66\\)\\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 ways (found ${stops.length})`);
});""",
    """ok('B3 — the rim\\'s own color carries the ring through the highlight, at the STROKE\\'s own width and weight (the 1.9.13 retrue)', () => {
  const rule = findRule(css, '.gd-has-finish .gd-card-stamp *:not(.rt-outline)::selection');
  assertMatch(rule, /var\\(--gd-fin-ink-outline, rgba\\(13, 10, 7, 0\\.66\\)\\)/, 'the contour lost the rim\\'s own color');
  assertMatch(rule, /calc\\(0\\.85px \\* var\\(--card-scale, 1\\)\\) 0 0 color-mix\\(in srgb,/, 'the straight contour steps lost the stroke\\'s outer half');
  assertMatch(rule, /calc\\(0\\.6px \\* var\\(--card-scale, 1\\)\\) calc\\(0\\.6px \\* var\\(--card-scale, 1\\)\\) 0 color-mix\\(in srgb,/, 'the diagonal contour steps lost the uniform reach');
  const stops = rule.match(/color-mix\\(in srgb, var\\(--gd-fin-ink-outline, rgba\\(13, 10, 7, 0\\.66\\)\\) 47%, transparent\\)/g) || [];
  assert.equal(stops.length, 8, `the contour must speak 8 ways at the pre-divided weight (found ${stops.length})`);
});""",
)

# ---- the 1912 suite: B5 (the runs' contour width + the bold seat) ----
sub(
    "scripts/gendex_1912_batch_dom.test.mjs",
    """ok('B5 — the outline FORMAT\\'s runs are scoped OUT (their own 1.9.11 cure keeps its contour verbatim)', () => {
  const runRule = findRule(css, '.rt-outline::selection');
  assertMatch(runRule, /background: var\\(--gd-accent\\);/, 'the run cure lost its background');
  assertMatch(runRule, /color: currentcolor;/, 'the run cure lost its ink law');
  assertMatch(runRule, /-webkit-text-stroke-width: 0;/, 'the run cure lost its stand-down');
  assertMatch(runRule, /1px 0 0 var\\(--gd-bg\\),/, 'the run cure lost its backdrop contour');
  const mirror = findRule(css, '.gd-card-title:has(.rt-outline) *::selection');
  assertMatch(mirror, /color: currentcolor;/, 'the mirror lost its ink law');
});""",
    """ok('B5 — the outline FORMAT\\'s runs are scoped OUT (their own cure keeps its contour, retrued to its own width)', () => {
  const runRule = findRule(css, '.rt-outline::selection');
  assertMatch(runRule, /background: var\\(--gd-accent\\);/, 'the run cure lost its background');
  assertMatch(runRule, /color: currentcolor;/, 'the run cure lost its ink law');
  assertMatch(runRule, /-webkit-text-stroke-width: 0;/, 'the run cure lost its stand-down');
  assertMatch(runRule, /0\\.75px 0 0 var\\(--gd-bg\\),/, 'the run cure lost its backdrop contour');
  const boldRule = findRule(css, '.rt-b.rt-outline::selection');
  assertMatch(boldRule, /1px 0 0 var\\(--gd-bg\\),/, 'the bold run lost its own fatter contour');
  const mirror = findRule(css, '.gd-card-title:has(.rt-outline) *::selection');
  assertMatch(mirror, /color: currentcolor;/, 'the mirror lost its ink law');
});""",
)

# ---- the 1912 suite: the header comment's contour line follows the law ----
sub(
    "scripts/gendex_1912_batch_dom.test.mjs",
    """//       rim's own color carries the ring through the highlight as an
//       8-way text-shadow contour at the rim's own scaled width (the""",
    """//       rim's own color carries the ring through the highlight as an
//       8-way text-shadow contour (retrued at the stroke's own width and
//       weight by the 1.9.13 law — the ring you wear at rest is the ring
//       you keep mid-selection; the""",
)

# ---- the 1911 suite: B3 (the 0.37.0 contour's 8-way offsets) ----
sub(
    "scripts/gendex_1911_batch_dom.test.mjs",
    """ok('B3 — the 0.37.0 backdrop contour keeps its whole 8-way seat', () => {
  const rule = findRule(css, '.rt-outline::selection');
  for (const off of ['1px 0 0', '-1px 0 0', '0 1px 0', '0 -1px 0', '0.7px 0.7px 0', '-0.7px 0.7px 0', '0.7px -0.7px 0', '-0.7px -0.7px 0']) {
    assertMatch(rule, new RegExp(off.replace(/[.+-]/g, '\\\\$&') + ' var\\\\(--gd-bg\\\\)'), `the ${off} contour seat is missing`);
  }
});""",
    """ok('B3 — the 0.37.0 backdrop contour keeps its whole 8-way seat (retrued to the plain stroke\\'s own width — the 1.9.13 law)', () => {
  const rule = findRule(css, '.rt-outline::selection');
  for (const off of ['0.75px 0 0', '-0.75px 0 0', '0 0.75px 0', '0 -0.75px 0', '0.53px 0.53px 0', '-0.53px 0.53px 0', '0.53px -0.53px 0', '-0.53px -0.53px 0']) {
    assertMatch(rule, new RegExp(off.replace(/[.+-]/g, '\\\\$&') + ' var\\\\(--gd-bg\\\\)'), `the ${off} contour seat is missing`);
  }
});""",
)

print("1.9.13 law pins re-seated: 1912 B3 + B5 + header, 1911 B3")

# ---- the five 192-196 badge pins (the sweep's shapes never reach the
#      includes('version-…-purple') form — the same miss every release
#      heals; the badge is a LIVE seat tracking the current release) ----
for suite in ("192", "193", "194", "195", "196"):
    sub(
        f"scripts/gendex_{suite}_batch_dom.test.mjs",
        "version-1.9.12-purple",
        "version-1.9.13-purple",
    )
print("1.9.13 badge pins re-seated: 192/193/194/195/196")
