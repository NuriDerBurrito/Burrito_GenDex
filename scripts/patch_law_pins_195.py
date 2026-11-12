#!/usr/bin/env python3
"""1.9.4 law-pin heals — the seats whose laws themselves MOVED this
release, re-worded at their birth suites (the sweep moved the version
furniture; these are the behavior pins). Exactly the way the 1.8.4,
1.8.8, 1.8.9, 1.8.10, 1.9.0, 1.9.1, 1.9.2 and 1.9.3 passes taught.

The patients:
· gendex_159 — the veil check: the 1.9.4 ground rules seat
  `.gd-finish-nuri::before` under .gd-fin-ground scopes BEFORE the veil's
  own rule, so the old unanchored regex now reads the ground flip instead
  of the veil — and the veil's weight itself stepped 0.5 -> 0.4 (the
  forge's own stripes carry the card's color at the source now; the veil
  only deepens the lean). The check anchors to the sheet's margin and
  speaks the new weight.
· gendex_194 — the true-X stroke band (2.3-3.6 -> 2.9-4.6, the ✖'s own
  proportion) and the tone rail (0.84/0.16 -> 0.78/0.19, widened so the
  bright-but-not-white plates meet the ink law) — both laws moved under
  them; the pins re-word to the 1.9.4 seats.
· gendex_194 — the D1 birth pin (THE KEY RETURNS TO PRESS): the sweep
  over-swept it to 1.9.4, but the app source's own law note still speaks
  its birth version 1.9.3 (the CREATE-key law did not move this release).
  The pin reverts to its birth word, exactly the way the 1.9.2 pass
  reverted the 193 suite's A2 birth pin.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"


def sub(fname: str, old: str, new: str, count: int = 1) -> None:
    p = SCRIPTS / fname
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {fname}: already healed")
        return
    found = raw.count(old)
    assert found == count, f"{fname}: expected {count} seat(s), found {found}:\n{old[:160]}"
    raw = raw.replace(old, new)
    p.write_text(raw, encoding="utf8")
    print(f"  {fname}: healed")


# --- gendex_159 — the veil (anchored + the 1.9.4 weight) -------------------
sub(
    "gendex_159_batch_dom.test.mjs",
    """ok('4b — the body veil softened to 38%', () => {
  // 1.5.0 — THE FORGE SPEAKS THE CARD'S OWN COLORS: the veil became the
  // card-tint wash (0.5) — the 0.38 plate veil left with the rework.
  const veil = css.match(/\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/)?.[0] || '';
  assert(/background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/.test(veil), 'the veil never took the card tint');
  assert(/opacity: 0\\.5;/.test(veil), 'the veil lost its weight');
});""",
    """ok('4b — the body veil softened to 38%', () => {
  // 1.5.0 — THE FORGE SPEAKS THE CARD'S OWN COLORS: the veil became the
  // card-tint wash — the 0.38 plate veil left with the rework. 1.9.4 —
  // THE FORGE'S OWN STRIPES LEAN TOO: the wash steps down to 0.4 (the
  // body's stripes and band carry the card's color at the source now;
  // the veil only deepens the lean), and the check anchors to the
  // sheet's margin because the 1.9.4 ground rules seat the same selector
  // under .gd-fin-ground scopes above the veil's own rule.
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0] || '';
  assert(/background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/.test(veil), 'the veil never took the card tint');
  assert(/opacity: 0\\.4;/.test(veil), 'the veil lost its weight');
});""",
)

# --- gendex_194 — the true-X stroke band -----------------------------------
sub(
    "gendex_194_batch_dom.test.mjs",
    """  for (const w of [...widths, ...widthsFar]) {
    assert.ok(w >= 2.3 && w <= 3.6, `a stroke left the semi-thick band: ${w}`);
  }""",
    """  /* 1.9.4 — THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick
     enough sometimes, fix that"): every stroke steps up to the ✖'s own
     proportion (~16-18% of its diagonal span — 2.9-4.6 on the same
     12-20px spans), still semi-thick, never bold. */
  for (const w of [...widths, ...widthsFar]) {
    assert.ok(w >= 2.9 && w <= 4.6, `a stroke left the full-weight band: ${w}`);
  }""",
)

# --- gendex_194 — the tone rail (widened) ----------------------------------
sub(
    "gendex_194_batch_dom.test.mjs",
    """  // the source's own thresholds, pinned where they live
  assertMatch(ribbon, /if \\(lum >= 0\\.84\\) return 'gd-fin-ground-light';/, 'the light threshold drifted');
  assertMatch(ribbon, /if \\(lum <= 0\\.16\\) return 'gd-fin-ground-dark';/, 'the dark threshold drifted');
  assertMatch(ribbon, /if \\(sat >= 0\\.85 && lum >= 0\\.2\\) return 'gd-fin-ground-vivid';/, 'the vivid gate drifted');""",
    """  /* the source's own thresholds, pinned where they live — 1.9.4 — THE
     RAIL WIDENS: the light rail steps down to 0.78 and the dark rail up
     to 0.19, so the bright-but-not-white plates (a gold, a cream, a
     bright lilac) meet the ink law before their glints thin away. */
  assertMatch(ribbon, /if \\(lum >= 0\\.78\\) return 'gd-fin-ground-light';/, 'the light threshold drifted');
  assertMatch(ribbon, /if \\(lum <= 0\\.19\\) return 'gd-fin-ground-dark';/, 'the dark threshold drifted');
  assertMatch(ribbon, /if \\(sat >= 0\\.85 && lum >= 0\\.2\\) return 'gd-fin-ground-vivid';/, 'the vivid gate drifted');""",
)
sub(
    "gendex_194_batch_dom.test.mjs",
    """    if (lum >= 0.84) return 'gd-fin-ground-light';
    if (lum <= 0.16) return 'gd-fin-ground-dark';
    if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';""",
    """    if (lum >= 0.78) return 'gd-fin-ground-light';
    if (lum <= 0.19) return 'gd-fin-ground-dark';
    if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';""",
)

# --- gendex_194 — the D1 birth pin reverts to its birth word ---------------
sub(
    "gendex_194_batch_dom.test.mjs",
    "assertMatch(ncm, /1\\.9\\.4 — THE KEY RETURNS TO PRESS/, 'the law note never spoke');",
    "assertMatch(ncm, /1\\.9\\.3 — THE KEY RETURNS TO PRESS/, 'the law note never spoke');",
)
sub(
    "gendex_194_batch_dom.test.mjs",
    "assertMatch(ncm, /setNeedFlash\\(null\\);\\s*\\n\\s*\\/\\* 1\\.9\\.4 — THE KEY RETURNS TO PRESS[\\s\\S]*?setCreating\\(false\\);/, 'the latch never joined the RESET law');",
    "assertMatch(ncm, /setNeedFlash\\(null\\);\\s*\\n\\s*\\/\\* 1\\.9\\.3 — THE KEY RETURNS TO PRESS[\\s\\S]*?setCreating\\(false\\);/, 'the latch never joined the RESET law');",
)

# --- the badge pins the sweep's lookbehind cannot reach --------------------
# (the shield form `version-1.9.3-purple` carries a '-' before the digits —
# the sweep's [vV(] lookbehind never sees it; the 1.9.3 pass healed the
# same seats for the same reason)
for suite in ("gendex_192_batch_dom.test.mjs", "gendex_193_batch_dom.test.mjs", "gendex_194_batch_dom.test.mjs"):
    sub(suite, "version-1.9.3-purple", "version-1.9.4-purple", 1)

print("\n1.9.4 law pins healed.")
