#!/usr/bin/env python3
"""1.7.6 — patch the superseded law pins in the historical suites (the
sweep moved the version furniture; these are the LAW pins the 1.7.6
reports legitimately superseded). Convention: re-pin to the new law,
leave the historical ok() labels speaking their era."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "scripts"


def patch(name: str, pairs: list) -> None:
    p = ROOT / name
    t = p.read_text(encoding="utf8")
    for old, new in pairs:
        if old not in t:
            print(f"  !! pin not found in {name}: {old[:80]!r}")
            continue
        t = t.replace(old, new)
    p.write_text(t, encoding="utf8")
    print(f"patched {name}")


# gendex_173 — the stage's spine fallback climbs toward white now
patch(
    "gendex_173_batch_dom.test.mjs",
    [
        (
            "// 1.7.5 — the spine speaks its own rung now (--part-spine, the 1.6:1\n  // walk; the 92% mix survives as the fallback)",
            "// 1.7.6 — the spine is the LIGHTEST ELEMENT now (the climb toward\n  // white; the 92% mix retired with the anchor-walk)",
        ),
        (
            r"inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 92%, var\(--part-face, var\(--gd-ink\)\)\)\)",
            r"inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)",
        ),
        (
            "'the rail never moved into the shadow'",
            "'the rail never climbed toward white'",
        ),
    ],
)

# gendex_174 — the title drops to the well rung; the spine fallbacks
# climb toward white; the wake is chunked + fresh-phased
patch(
    "gendex_174_batch_dom.test.mjs",
    [
        (
            r"s*\n\s*background: var\(--part-title,",
            r"s*\n\s*background: var\(--part-well,",
        ),
        (
            "// 1.7.5 — the spine speaks its own rung (--part-spine, the 1.6:1 walk;\n  // the 82% mix survives as the fallback)",
            "// 1.7.6 — the spine is the LIGHTEST ELEMENT (--part-spine's climb\n  // toward white; the 82% / 92% mixes retired with the anchor-walk)",
        ),
        (
            r"inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 82%, var\(--part-well, var\(--gd-accent\)\)\)\)",
            r"inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)",
        ),
        (
            r"inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 92%, var\(--part-well, var\(--gd-accent\)\)\)\)",
            r"inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)",
        ),
        (
            "'the colored spine never spoke at 82%'",
            "'the colored spine never climbed toward white'",
        ),
        (
            "'the colored focus spine never deepened'",
            "'the colored focus spine never kept the climb'",
        ),
        (
            r"assertMatch(app, /if \(a\.playState === 'paused'\) a\.play\(\);/, 'the wake never resumed from the hold');",
            r"assertMatch(app, /if \(infinite\) a\.currentTime = 0;\s*\n\s*a\.play\(\);/, 'the wake never came back fresh');",
        ),
    ],
)

# gendex_175 — the FINISH_TRIM_INK tombstone speaks 1.7.5 history (the
# sweep over-swept it); the pour's blanket arm gains the membership gate
patch(
    "gendex_175_batch_dom.test.mjs",
    [
        (
            r"/RETIRED IN 1\.7\.6/",
            r"/RETIRED IN 1\.7\.5/",
        ),
        (
            r"assertMatch(charview, /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null;/, 'the every-chip gate never spoke');",
            r"assertMatch(charview, /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null && wasActive !== active;/, 'the every-chip gate never spoke');",
        ),
    ],
)

# gendex_176 — the 1.7.5 laws the 1.7.6 reports superseded
patch(
    "gendex_176_batch_dom.test.mjs",
    [
        # A3 — the tombstone speaks 1.7.5 history (the sweep over-swept it)
        (
            r"/RETIRED IN 1\.7\.6/",
            r"/RETIRED IN 1\.7\.5/",
        ),
        # C1 — the untinted title deepens to the 58% well ground first
        (
            r"\.gd-modal-card \.gd-notes-title\.gd-input,\s*\n\.gd-modal-card \.gd-notes-title\.gd-rt-edit \{\s*\n\s*border: 1\.5px solid color-mix\(in srgb, var\(--gd-ink\) 40%, transparent\);",
            r"\.gd-modal-card \.gd-notes-title\.gd-input,\s*\n\.gd-modal-card \.gd-notes-title\.gd-rt-edit \{\s*\n\s*background: color-mix\(in srgb, var\(--gd-bg\) 58%, var\(--gd-panel\)\);\s*\n\s*border: 1\.5px solid color-mix\(in srgb, var\(--gd-ink\) 40%, transparent\);",
        ),
        # C2 — the tinted title drops to the WELL rung + the theme-accent ring
        (
            r"\{\s*\n\s*background: var\(--part-title[\s\S]*?\s*border: 1\.5px solid var\(--part-line",
            r"\{\s*\n\s*background: var\(--part-well[\s\S]*?\s*border: 1\.5px solid var\(--part-line",
        ),
        (
            r"box-shadow: 0 0 0 2px color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 22%, transparent\);",
            r"box-shadow: 0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 22%, transparent\);",
        ),
        (
            "assertMatch(css, /THE TITLE'S OWN OUTLINE/, 'the 1.7.5 outline note is missing');",
            "assertMatch(css, /THE TITLE LEAVES THE BAND/, 'the 1.7.6 title note is missing');",
        ),
        # D1 — the spine climbs toward the light extreme (luminance law)
        (
            r"assertMatch(helpers, /const spine = partStepToContrast\(raw, anchor, 1\.6, face\);/, 'the spine rung never walked');",
            r"assertMatch(helpers, /const spineTarget = lightestSeat \+ 0\.09;/, 'the spine rung never walked');",
        ),
        # J1 — the arrival speaks :not(.is-ghost) + the zone's + key
        (
            r"\.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-kept\) \{\s*\n\s*animation: gd-tag-chip-in 0\.16s ease-out 0\.12s both;",
            r"\.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-ghost\),\s*\n\.gd-cv-tagflight \.gd-tag-zone-seat \.gd-btn\[data-no-sort\] \{\s*\n\s*animation: gd-tag-chip-in 0\.16s ease-out 0\.12s both;",
        ),
        # J2 — the ghost carries the WHOLE old row; .is-kept retires
        (
            r"assertMatch(charview, /const ghostTags =\s*\n\s*pickerMode && swapOldActive\s*\n\s*\? tags\.filter\(\(t\) => swapOldActive\.has\(t\.id\) && !activeIds\.includes\(t\.id\)\)/, 'the ghost set never spoke');",
            r"assertMatch(charview, /const ghostTags = pickerMode && swapOldActive \? tags\.filter\(\(t\) => swapOldActive\.has\(t\.id\)\) : \[\];/, 'the ghost set never spoke');",
        ),
        (
            "assertMatch(charview, /const kept = active && wasActive === true;/, 'the kept chip never spoke');",
            "assert.ok(!charview.includes('is-kept'), 'the kept class never retired');",
        ),
        (
            "assertMatch(charview, /kept && 'is-kept'/, 'the kept class never armed');",
            "assertMatch(charview, /gd-tag-chip is-ghost !py-1 !px-2 text-\[10px\]/, 'the ghost chips never wore their exemption');",
        ),
        # J4 — the pour arms only on membership moves; the stills speak is-ghost
        (
            r"assertMatch(charview, /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null;/, 'the pour gate never spoke the on mode');",
            r"assertMatch(charview, /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null && wasActive !== active;/, 'the pour gate never spoke the on mode');",
        ),
        (
            r"(css.match(/\.gd-reduced-motion \.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-kept\)/g) || []).length",
            r"(css.match(/\.gd-reduced-motion \.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-ghost\)/g) || []).length",
        ),
        (
            "assert.ok(media.includes('.gd-cv-tagflight .gd-rows-tray .gd-tag-chip:not(.is-kept)'), 'the OS media law never stilled the arrival');",
            "assert.ok(media.includes('.gd-cv-tagflight .gd-rows-tray .gd-tag-chip:not(.is-ghost)'), 'the OS media law never stilled the arrival');",
        ),
        # K1 — the README paragraph speaks the 1.7.6 tag
        (
            r"assertMatch(src('README.md'), /1\.7\.6 — the trim's own ink, and ten reports land as one wall\./, 'the README 1.7.5 paragraph never landed');",
            r"assertMatch(src('README.md'), /1\.7\.6 — the ink that stays, and the dark finally sleeps\./, 'the README 1.7.6 paragraph never landed');",
        ),
    ],
)

print("done")
