#!/usr/bin/env python3
"""1.8.0 law-pin patches for the TEST SUITES — the superseded pins re-seated
(the app tree already speaks the new laws):

  1. gendex_180 A1 — the sweep over-reached on the HISTORICAL note pin
     (the "THE WASH SPEAKS THE FAMILY'S OWN SHAPE" note keeps its birth
     version 1.7.9 in the CSS) — reverted.
  2. gendex_161 G6 — the mock future archive version (1.7.20) no longer
     out-runs the app's 1.8.0 — bumped to 1.8.20 (both the mock and the
     assertion).
  3. gendex_174 D1 — the tinted title's placeholder speaks the WELL's own
     ink now (--part-well-ink, the 1.8.0 one-field coherence).
  4. gendex_176 I1 — the picker's signature grew showHelp (the hint rides
     the HELP TEXT switch).
  5. gendex_179 G1/G2/G3 + gendex_180 E1/E2/E3 — the keys sector earned
     its areas (44px row floor + 9px breathing, 11px row text, 30px icon
     squares with 15px glyphs, 178px cluster reservation).

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


# 1. the over-swept historical note pin, reverted to its birth version
patch(
    "gendex_180_batch_dom.test.mjs",
    [(
        "assertMatch(css, /1\\.8\\.0 — THE WASH SPEAKS THE FAMILY'S OWN SHAPE/, 'the family-shape note is missing');",
        "assertMatch(css, /1\\.7\\.9 — THE WASH SPEAKS THE FAMILY'S OWN SHAPE/, 'the family-shape note is missing');",
    )],
)

# 2. the future-archive mock out-runs the app's 1.8.0
patch(
    "gendex_161_compat_legal.test.mjs",
    [
        ("fromAppVersion: '1.7.20'", "fromAppVersion: '1.8.20'"),
        ("last saved by v1\\.7\\.20", "last saved by v1\\.8\\.20"),
    ],
)

# 3. the tinted title's placeholder whispers the well's own ink
patch(
    "gendex_174_batch_dom.test.mjs",
    [(
        "assertMatch(css, /\\.gd-modal-card\\.is-part-tinted \\.gd-notes-title:empty::before \\{\\s*\\n\\s*color: color-mix\\(in srgb, var\\(--part-ink, var\\(--gd-mute\\)\\) 46%, transparent\\);/, 'the title placeholder never whispered the face\\'s ink');",
        "assertMatch(css, /\\.gd-modal-card\\.is-part-tinted \\.gd-notes-title:empty::before \\{\\s*\\n\\s*color: color-mix\\(in srgb, var\\(--part-well-ink, var\\(--part-ink, var\\(--gd-mute\\)\\)\\) 46%, transparent\\);/, 'the title placeholder never whispered the well\\'s own ink');",
    )],
)

# 4. the picker's signature grew showHelp
patch(
    "gendex_176_batch_dom.test.mjs",
    [(
        "assertMatch(picker, /export default function TagPickerModal\\(\\{[\\s\\S]*?onReorderTags,[\\s\\S]*?onClose,\\s*\\}\\)/, 'the picker signature never spoke');",
        "assertMatch(picker, /export default function TagPickerModal\\(\\{[\\s\\S]*?onReorderTags,[\\s\\S]*?onClose,[\\s\\S]*?showHelp = false,\\s*\\}\\)/, 'the picker signature never spoke');",
    )],
)

# 5a. the 179 suite's keys laws re-seated (the rows earned their stature)
patch(
    "gendex_179_batch_dom.test.mjs",
    [
        (
            "assertMatch(cssLaws, /\\.gd-scut-row \\{\\s*min-height: 30px;\\s*padding: 5px 0;/, 'the row breathing never spoke');",
            "assertMatch(cssLaws, /\\.gd-scut-row \\{\\s*min-height: 44px;\\s*padding: 9px 0;/, 'the row breathing never spoke');",
        ),
        (
            "assertMatch(cssLaws, /\\.gd-scut-row \\{\\s*min-height: 30px;/, 'the row floor never spoke');",
            "assertMatch(cssLaws, /\\.gd-scut-row \\{\\s*min-height: 44px;/, 'the row floor never spoke');",
        ),
        (
            'assertMatch(settings, /className="gd-scut-row flex items-center justify-between gap-3 text-\\[10px\\] text-gd-chrome min-w-0"/, \'the row seat never spoke\');',
            'assertMatch(settings, /className="gd-scut-row flex items-center justify-between gap-3 text-\\[11px\\] text-gd-chrome min-w-0"/, \'the row seat never spoke\');',
        ),
        (
            "assertMatch(cssLaws, /\\.gd-scut-keys \\{\\s*display: flex;\\s*align-items: center;\\s*justify-content: flex-end;\\s*gap: 6px;\\s*flex-shrink: 0;\\s*min-width: 132px;/, 'the reserved cluster never spoke');",
            "assertMatch(cssLaws, /\\.gd-scut-keys \\{\\s*display: flex;\\s*align-items: center;\\s*justify-content: flex-end;\\s*gap: 6px;\\s*flex-shrink: 0;\\s*min-width: 178px;/, 'the reserved cluster never spoke');",
        ),
    ],
)

# 5b. the 180 suite's keys laws re-seated (the same report)
patch(
    "gendex_180_batch_dom.test.mjs",
    [
        (
            "assertMatch(cssLaws, /\\.gd-scut-row \\{\\s*min-height: 30px;\\s*padding: 5px 0;/, 'the row breathing never spoke');",
            "assertMatch(cssLaws, /\\.gd-scut-row \\{\\s*min-height: 44px;\\s*padding: 9px 0;/, 'the row breathing never spoke');",
        ),
        (
            "assertMatch(cssLaws, /\\.gd-scut-ico \\{\\s*display: inline-flex;\\s*align-items: center;\\s*justify-content: center;\\s*width: 22px;\\s*height: 22px;/, 'the icon seat never spoke');",
            "assertMatch(cssLaws, /\\.gd-scut-ico \\{\\s*display: inline-flex;\\s*align-items: center;\\s*justify-content: center;\\s*width: 30px;\\s*height: 30px;/, 'the icon seat never spoke');",
        ),
        (
            "assertMatch(settings, /<span className=\"gd-scut-ico\" aria-hidden>\\s*<RowIcon size=\\{11\\} \\/>/, 'the icon mount never spoke');",
            "assertMatch(settings, /<span className=\"gd-scut-ico\" aria-hidden>\\s*<RowIcon size=\\{15\\} \\/>/, 'the icon mount never spoke');",
        ),
    ],
)

print("law pins re-seated")
