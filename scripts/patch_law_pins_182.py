#!/usr/bin/env python3
"""1.8.2 law-pin patch — re-pins the SUPERSEDED laws in the older suites
and reverts the over-swept HISTORICAL note pins to their birth versions.

The supersessions this version leaves behind:
  · 173's D1 — the 1.6.9 ghost-retirement gate (livePreviewRef term) —
    the pull now outlives the preview (1.8.2); the note's tombstone
    keeps its name, the gate pin moves to the switchless form.
  · 179's G1 + 180's E1 — the .gd-scut-grid one-column law carried the
    title-era 8px headroom in its regex; the headroom rides off with
    the title (1.8.2) and the pin reads margin-top: 0.
  · 182's D2 — the toolbar HELP TEXT tooltip carried the explanatory
    paragraph; the key earns its combo and the tooltip speaks the
    sibling form (1.8.2), the cluster window widening past the new law
    note that now sits between the keys.

The over-sweeps (historical notes keep their birth version):
  · 181's C1 grip-capsule note pin -> 1.8.1 (its birth).
  · 182's A1/B1/B3/C1/D1/E1 note pins -> 1.8.1 (their birth).
  · 181's H1 second changelog pin had been degenerate since the 1.8.0
    sweep (it pinned the HEAD while claiming the 1.7.9 entry) — restored
    to its true intent: the 1.7.9 entry keeps its seat.

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
    # 173 — the ghost outlives the preview (real supersession)
    patch(
        "scripts/gendex_173_batch_dom.test.mjs",
        [
            (
                "ok('D1 — the miniature is born only while the preview lives (the gate reads the REF — 1.7.2)', () => {",
                "ok('D1 — the miniature is born on EVERY drag (the preview gates the switching alone — 1.8.2)', () => {",
            ),
            (
                "  assertMatch(gridSrc, /if \\(livePreviewRef\\.current && layW > 4 && layH > 4 && typeof card\\.cloneNode === 'function'\\)/, 'the ghost gate never spoke (1.7.2: the memoized cards read the live truth from the ref — a mount-era closure still built the ghost with the setting off)');",
                "  // 1.8.2 — the pull outlives the preview: the gate's livePreviewRef term rides off\n"
                "  // (the switch is the dynamic switching alone; the faded miniature rides every drag).\n"
                "  assertMatch(gridSrc, /if \\(layW > 4 && layH > 4 && typeof card\\.cloneNode === 'function'\\)/, 'the ghost gate never spoke (1.8.2: the miniature rides every drag — live board or still)');",
            ),
        ],
    )

    # 179 + 180 — the roster rises to the card's own padding (regex re-seat)
    scut_old = "assertMatch(cssLaws, /\\.gd-scut-grid \\{\\s*display: flex;\\s*flex-direction: column;\\s*gap: 0;\\s*margin-top: 8px;/, 'the column law never spoke');"
    scut_new = (
        "  // 1.8.2 — the title-era headroom rides off with the title (the roster meets the\n"
        "  // card's padding directly; the sibling law below the teaching copy owns the 8px).\n"
        "  assertMatch(cssLaws, /\\.gd-scut-grid \\{\\s*display: flex;\\s*flex-direction: column;\\s*gap: 0;\\s*margin-top: 0;/, 'the column law never spoke');"
    )
    patch("scripts/gendex_179_batch_dom.test.mjs", [("  " + scut_old, scut_new)])
    patch("scripts/gendex_180_batch_dom.test.mjs", [("  " + scut_old, scut_new)])

    # 181 — historical note reversion + the degenerate 1.7.9 pin restored
    patch(
        "scripts/gendex_181_batch_dom.test.mjs",
        [
            (
                "assertMatch(css, /1\\.8\\.2 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');",
                "assertMatch(css, /1\\.8\\.1 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');",
            ),
            (
                "assertMatch(changelog, /^## 1\\.8\\.2 — The Still Wall/m, 'the 1.7.9 entry lost its seat');",
                "assertMatch(changelog, /^## 1\\.7\\.9 — The Shape Of The Trim/m, 'the 1.7.9 entry lost its seat');",
            ),
        ],
    )

    # 182 — the birth-version note reverts + the tooltip supersession
    patch(
        "scripts/gendex_182_batch_dom.test.mjs",
        [
            (
                "assertMatch(css, /1\\.8\\.2 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');",
                "assertMatch(css, /1\\.8\\.1 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.2 — THE I-BEAM RETURNS TO THE TEXT/, 'the I-beam note is missing');",
                "assertMatch(css, /1\\.8\\.1 — THE I-BEAM RETURNS TO THE TEXT/, 'the I-beam note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.2 — THE CHROME'S OWN ARROWS/, 'the arrows note is missing');",
                "assertMatch(css, /1\\.8\\.1 — THE CHROME'S OWN ARROWS/, 'the arrows note is missing');",
            ),
            (
                "assertMatch(settings, /1\\.8\\.2 — THE TITLE SPEAKS ONCE/, 'the title-once note is missing');",
                "assertMatch(settings, /1\\.8\\.1 — THE TITLE SPEAKS ONCE/, 'the title-once note is missing');",
            ),
            (
                "assertMatch(titlebar, /1\\.8\\.2 — HELP TEXT JOINS THE APP KEYS/, 'the app-keys note is missing');",
                "assertMatch(titlebar, /1\\.8\\.1 — HELP TEXT JOINS THE APP KEYS/, 'the app-keys note is missing');",
            ),
            (
                "assertMatch(grid, /1\\.8\\.2 — THE PULL FADES/, 'the GridView note is missing');",
                "assertMatch(grid, /1\\.8\\.1 — THE PULL FADES/, 'the GridView note is missing');",
            ),
            (
                "assertMatch(css, /1\\.8\\.2 — THE PULL FADES/, 'the CSS note is missing');",
                "assertMatch(css, /1\\.8\\.1 — THE PULL FADES/, 'the CSS note is missing');",
            ),
            (
                "  const after = titlebar.slice(at, at + 1400);",
                "  // 1.8.2 — the window widened past the key's own law notes (the 1.8.1 birth\n"
                "  // note + the 1.8.2 combo note both sit between the two keys now).\n"
                "  const after = titlebar.slice(at, at + 2600);",
            ),
            (
                "  assertMatch(after, /Help text on \\(the explanatory paragraphs\\)/, 'the tooltip never spoke');",
                "  // 1.8.2 — the tooltip speaks the sibling form: the on/off word and the combo\n"
                "  // in parens, the explanatory paragraph riding off with the shortcut's arrival.\n"
                "  assertMatch(after, /Help text on \\(\\$\\{combo\\('helpText'\\)\\}\\)/, 'the tooltip never spoke');",
            ),
        ],
    )


if __name__ == "__main__":
    main()
