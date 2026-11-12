#!/usr/bin/env python3
"""1.8.1 law-pin patches for the TEST SUITES — the superseded pins re-seated
(the app tree already speaks the new laws):

  1. gendex_165 L — the owned flight's ghost rule speaks the 1.8.1 fade
     (opacity: 0.55 — the pull no longer rides at full ink).
  2. gendex_167 LIVE — the first true seat lights the ghost at the faded
     weight ('0.55', not '1').
  3. gendex_180 B3 — the resizer speaks the 1.8.1 capsule (32% strokes
     over the 14% fill), the quiet-20%-hatch pin retired with the frame.
  4. gendex_181 B1/B2 — the well's own rule lost the 1.8.0 cursor: default
     (the I-beam returns to the text; the lane keeps its word).
  5. gendex_181 C1/C2 — the grip frame retired for the capsule's own
     tongue (borderless, rounded, translucent fill under the hatch).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def patch(path: str, pairs: list, notes: dict = None) -> None:
    p = ROOT / "scripts" / path
    raw = p.read_text(encoding="utf8")
    for old, new in pairs:
        if old not in raw:
            print(f"  !! pin not found in {path}: {old[:72]!r}")
            continue
        raw = raw.replace(old, new, 1)
    p.write_text(raw, encoding="utf8")
    print(f"  patched {path}")


# 1. the ghost rule speaks the fade
patch(
    "gendex_165_batch_dom.test.mjs",
    [(
        "assert.ok(ghostCss.includes('opacity: 1'), 'the ghost rides faded');",
        "assert.ok(ghostCss.includes('opacity: 0.55'), 'the pull never faded (the 1.8.1 law)');",
    )],
)

# 2. the first true seat lights the faded weight
patch(
    "gendex_167_batch_dom.test.mjs",
    [(
        "assert.equal(ghost.style.opacity, '1', 'the first true seat never lit the ghost');",
        "assert.equal(ghost.style.opacity, '0.55', 'the first true seat never lit the ghost at the faded weight');",
    )],
)

# 3. the 180 suite's quiet hatch speaks the capsule
patch(
    "gendex_180_batch_dom.test.mjs",
    [
        (
            "ok('B3 — the resizer hatch reads as a quiet texture (20% ink, transparent plate)', () => {",
            "ok('B3 — the resizer speaks the 1.8.1 capsule (32% strokes over the 14% fill)', () => {",
        ),
        (
            "assertMatch(res, /135deg,[\\s\\S]*?color-mix\\(in srgb, var\\(--gd-ink\\) 20%, transparent\\) 0 1px,[\\s\\S]*?transparent 1px 5px[\\s\\S]*?transparent;/, 'the quiet hatch never spoke');",
            "assertMatch(res, /135deg,[\\s\\S]*?color-mix\\(in srgb, var\\(--gd-ink\\) 32%, transparent\\) 0 1px,[\\s\\S]*?transparent 1px 5px[\\s\\S]*?color-mix\\(in srgb, var\\(--gd-ink\\) 14%, transparent\\);/, 'the 1.8.1 capsule seat never spoke');",
        ),
    ],
)

# 4. the 181 suite's well cursor law re-seated (the I-beam returns)
patch(
    "gendex_181_batch_dom.test.mjs",
    [
        (
            "assertMatch(css, /1\\.8\\.0 — THE WELL'S OWN CURSOR \\+ ITS CONSTANT LANE/, 'the well cursor/lane note is missing');",
            "assertMatch(css, /1\\.8\\.0 — THE WELL'S CONSTANT LANE/, 'the well lane note is missing');",
        ),
        (
            "assertMatch(rule, /cursor: default;/, 'the default cursor never spoke');",
            "assert.ok(!rule.includes('cursor:'), 'the 1.8.0 default cursor survived — the I-beam cannot return to the text');",
        ),
    ],
)

# 5. the 181 suite's grip frame retired for the capsule
patch(
    "gendex_181_batch_dom.test.mjs",
    [
        (
            "assertMatch(css, /1\\.8\\.0 — THE GRIP EARNS ITS FRAME/, 'the grip frame note is missing');",
            "assertMatch(css, /1\\.8\\.1 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');",
        ),
        (
            "ok('C2 — all four resizer seats carry the 1px frame in the quiet ink family', () => {",
            "ok('C2 — all four resizer seats speak the capsule (no border, radius + translucent fill)', () => {",
        ),
        (
            "assertMatch(cssLaws, /\\.gd-prompt-box::-webkit-resizer \\{[\\s\\S]*?border: 1px solid color-mix\\(in srgb, var\\(--gd-ink\\) 26%, transparent\\);[\\s\\S]*?repeating-linear-gradient\\(\\s*135deg,\\s*color-mix\\(in srgb, var\\(--gd-ink\\) 20%, transparent\\) 0 1px,/, 'the resting grip frame never spoke');",
            "assertMatch(cssLaws, /\\.gd-prompt-box::-webkit-resizer \\{[^}]*border-radius: 4px;[^}]*color-mix\\(in srgb, var\\(--gd-ink\\) 32%, transparent\\) 0 1px,[^}]*color-mix\\(in srgb, var\\(--gd-ink\\) 14%, transparent\\);/, 'the resting grip capsule never spoke');",
        ),
        (
            "assertMatch(cssLaws, /\\.gd-prompt-box:focus::-webkit-resizer \\{[\\s\\S]*?border: 1px solid color-mix\\(in srgb, var\\(--gd-ink\\) 30%, transparent\\);[\\s\\S]*?color-mix\\(in srgb, var\\(--gd-ink\\) 24%, transparent\\) 0 1px,/, 'the focused grip frame never spoke');",
            "assertMatch(cssLaws, /\\.gd-prompt-box:focus::-webkit-resizer \\{[^}]*color-mix\\(in srgb, var\\(--gd-ink\\) 38%, transparent\\) 0 1px,[^}]*color-mix\\(in srgb, var\\(--gd-ink\\) 20%, transparent\\);/, 'the focused grip capsule never spoke');",
        ),
        (
            "assertMatch(cssLaws, /\\.gd-part-row\\.is-colored \\.gd-prompt-box::-webkit-resizer \\{[\\s\\S]*?border: 1px solid color-mix\\(in srgb, var\\(--part-ink, var\\(--gd-ink\\)\\) 28%, transparent\\);/, 'the colored grip frame never spoke');",
            "assertMatch(cssLaws, /\\.gd-part-row\\.is-colored \\.gd-prompt-box::-webkit-resizer \\{[^}]*border-radius: 4px;[^}]*color-mix\\(in srgb, var\\(--part-ink, var\\(--gd-ink\\)\\) 34%, transparent\\) 0 1px,[^}]*color-mix\\(in srgb, var\\(--part-ink, var\\(--gd-ink\\)\\) 16%, transparent\\);/, 'the colored grip capsule never spoke');",
        ),
        (
            "assertMatch(cssLaws, /\\[data-theme='archive'\\] \\.gd-prompt-box::-webkit-resizer \\{[\\s\\S]*?border: 1px solid color-mix\\(in srgb, var\\(--gd-ink\\) 26%, transparent\\);/, 'the archive grip frame never spoke');",
            "assertMatch(cssLaws, /\\[data-theme='archive'\\] \\.gd-prompt-box::-webkit-resizer \\{[^}]*border-radius: 4px;[^}]*color-mix\\(in srgb, var\\(--gd-ink\\) 32%, transparent\\) 0 1px,[^}]*color-mix\\(in srgb, var\\(--gd-ink\\) 14%, transparent\\);/, 'the archive grip capsule never spoke');",
        ),
    ],
)

# 6. the over-swept HISTORICAL note pins reverted (the notes keep their
#    birth version 1.8.0 — only B1/C1 speak the 1.8.1 rename)
patch(
    "gendex_181_batch_dom.test.mjs",
    [
        (
            "assertMatch(css, /1\\.8\\.1 — ONE BAND AT THE EDGE/, 'the right-edge law note is missing');",
            "assertMatch(css, /1\\.8\\.0 — ONE BAND AT THE EDGE/, 'the right-edge law note is missing');",
        ),
        (
            "assertMatch(css, /1\\.8\\.1 — THE WELL'S OWN CURSOR \\+ ITS CONSTANT LANE/, 'the well cursor/lane note is missing');",
            "assertMatch(css, /1\\.8\\.0 — THE WELL'S CONSTANT LANE/, 'the well lane note is missing');",
        ),
        (
            "assertMatch(css, /1\\.8\\.1 — THE GRIP EARNS ITS FRAME/, 'the grip frame note is missing');",
            "assertMatch(css, /1\\.8\\.1 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');",
        ),
        (
            "assertMatch(charview, /1\\.8\\.1 — THE PANEL WAKES OPEN/, 'the wake note is missing');",
            "assertMatch(charview, /1\\.8\\.0 — THE PANEL WAKES OPEN/, 'the wake note is missing');",
        ),
        (
            "assertMatch(helpers, /1\\.8\\.1 — THE WELL'S OWN INK/, 'the well-ink note is missing');",
            "assertMatch(helpers, /1\\.8\\.0 — THE WELL'S OWN INK/, 'the well-ink note is missing');",
        ),
        (
            "assertMatch(picker, /1\\.8\\.1 — THE HINT RIDES THE HELP TEXT SWITCH/, 'the hint-gate note is missing');",
            "assertMatch(picker, /1\\.8\\.0 — THE HINT RIDES THE HELP TEXT SWITCH/, 'the hint-gate note is missing');",
        ),
        (
            "assertMatch(app, /1\\.8\\.1 — the footer's hint joins the HELP TEXT law/, 'the App threading note is missing');",
            "assertMatch(app, /1\\.8\\.0 — the footer's hint joins the HELP TEXT law/, 'the App threading note is missing');",
        ),
    ],
)

# 7. the 167 suite's source pins on the ghost writes speak the fade
patch(
    "gendex_167_batch_dom.test.mjs",
    [
        (
            "assert.match(gridSrc, /ghost\\.style\\.opacity = birthHasPointer \\? '1' : '0';/, 'the invisible birth never spoke');",
            "assert.match(gridSrc, /const DRAG_GHOST_FADE = '0\\.55';/, 'the 1.8.1 fade constant never spoke');\n  assert.match(gridSrc, /ghost\\.style\\.opacity = birthHasPointer \\? DRAG_GHOST_FADE : '0';/, 'the invisible birth never spoke');",
        ),
        (
            "assert.match(gridSrc, /ghost\\.style\\.opacity = '1';/, 'the first true seat never lights the ghost');",
            "assert.match(gridSrc, /ghost\\.style\\.opacity = DRAG_GHOST_FADE;/, 'the first true seat never lights the ghost');",
        ),
    ],
)

print("law pins re-seated")
