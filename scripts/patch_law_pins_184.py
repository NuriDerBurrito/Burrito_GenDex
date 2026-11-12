#!/usr/bin/env python3
r"""1.8.4 law-pin patch — re-pins the SUPERSEDED laws the seat superseded
and reverts the over-swept HISTORICAL note pins to their birth versions.

The supersessions this version leaves behind:
  · 184's A1/A3/A5/A7 + 183's G1 — the 1.8.2/1.8.3 give-back lineage (pay
    the fold's height debt OUT OF THE SCROLL OFFSET, from the pre-fold
    seat) is retired whole: THE FOLD PAYS THE SEAT, NOT THE SCROLL now
    (1.8.4) — the debt is paid into a borrowed flow seat below the sticky
    header, measured from the scroller's own scrollHeight, and the
    listener never writes the scroll offset at all. The same-breath note
    itself was replaced by the cover's own note (the code tells the
    supersession in its own voice); the pins move with it.
  · 184's B3/B5 — the 1.8.3 colored-hover gather (the face 42% into the
    title, the border to the raw color) is superseded by the ink-step law
    (a 16% face-gather and a 45% hem onto the row's own INK rung — never
    yellow on yellow), the danger key steps OUT of the family to its own
    red face + white X, and the copied beat flips to the family's own
    extreme rungs (the spine under the ink).
  · 181's E2 — the dormant wake opens the rows AND returns the cover's
    loan now (dismissSeatDebt rides the edge before the rows open).

The over-sweeps (historical notes keep their birth version):
  · 184's B1/C1 note pins -> 1.8.3 (their birth — the tombstones in the
    css still speak their 1.8.3 names; only the hover/danger/copied CODE
    was superseded, and B3/B5's line pins move).
  · 184's A-section title -> its birth tagline (THE SAME BREATH).
  · 185's E2 previous-entry pins -> the 1.8.3 entry's own name (the
    "keeps its own seat" check must pin the PREVIOUS version's entry,
    never the new head — the sweep's hand moved all three forward).

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
    if count_required is not None and n != count_required:
        raise SystemExit(f"  !! {path}: expected {count_required} pins, moved {n}")


def main() -> None:
    # 181 — the wake returns the cover's loan before it opens the tray
    patch(
        "scripts/gendex_181_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(charview, /const wasDormantRef = useRef\(dormant\);\s*useEffect\(\(\) => \{\s*if \(wasDormantRef\.current && !dormant\) \{\s*setRowsCollapsed\(\{ tags: false, stamps: false \}\);\s*setAutoCollapsed\(false\);\s*\}\s*wasDormantRef\.current = dormant;\s*\}, \[dormant\]\);/, 'the wake effect never spoke');""",
                r"""  // 1.8.4 — the wake opens a tray that may hold a scroll-fold's loan: the
  // cover's dismissal rides the edge now (dismissSeatDebt, before the rows
  // open — waking with the debt still standing would count the tray's
  // height TWICE and the scrollbar's map would lie about the page). The
  // regex's comment-tolerant arm lets the dismissal's own 1.8.4 note sit
  // between the edge and the call (notes are not code).
  assertMatch(charview, /const wasDormantRef = useRef\(dormant\);\s*useEffect\(\(\) => \{\s*if \(wasDormantRef\.current && !dormant\) \{\s*(?:\/\/[^\n]*\n\s*)*dismissSeatDebt\(\);\s*setRowsCollapsed\(\{ tags: false, stamps: false \}\);\s*setAutoCollapsed\(false\);\s*\}\s*wasDormantRef\.current = dormant;\s*\}, \[dormant\]\);/, 'the wake effect never spoke');""",
            ),
        ],
    )

    # 183 — the give-back lineage is retired: the fold pays the seat
    patch(
        "scripts/gendex_183_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(cv, /1\.8\.2 — THE GIVE-BACK MEETS THE STICKY HEADER/, 'the give-back note is missing');""",
                r"""  // 1.8.4 — the give-back's whole lineage is retired: THE FOLD PAYS THE
  // SEAT, NOT THE SCROLL (the 1.8.2 tombstone that named this law here was
  // replaced by the cover's own note — the debt is paid into a borrowed
  // flow seat below the sticky header, never out of the scroll offset).
  assertMatch(cv, /1\.8\.4 — THE FOLD PAYS THE SEAT, NOT THE SCROLL/, 'the give-back note is missing');""",
            ),
            (
                r"""  assertMatch(cv, /const give = Math\.min\(left, Math\.max\(0, seatBefore\)\);/, 'the give never spoke its bounded word');""",
                r"""  // 1.8.4 — the give is a DEBT now: the seat holds exactly what the fold
  // removed (measured, never guessed), so the flow's total never changes.
  assertMatch(cv, /const owed = seatDebtRef\.current \+ Math\.max\(0, left\);/, 'the give never spoke its bounded word');""",
            ),
            (
                r"""  assertMatch(cv, /if \(give > 0\) scroller\.scrollTop = Math\.max\(0, seatBefore - give\);/, 'the give-back write lost its seat');""",
                r"""  // 1.8.4 — the write rides the SEAT, never the scroll offset: the drag
  // on the thumb is never fought, never re-mapped, never snapped.
  assertMatch(cv, /if \(rowsSeatRef\.current\) rowsSeatRef\.current\.style\.height = `\$\{owed\}px`;/, 'the give-back write lost its seat');""",
            ),
        ],
    )

    # 184 — the same-breath fold is superseded by the seat; the colored
    # hover/danger/copied tongues move to the ink-step + red-face laws; the
    # note tombstones keep their 1.8.3 birth names
    patch(
        "scripts/gendex_184_batch_dom.test.mjs",
        [
            # the A-section title keeps its birth tagline (the sweep's hand
            # moved THE SAME BREATH -> THE COVER inside a historical name)
            (
                r"""console.log('\nA. THE FOLD AND ITS GIVE-BACK LAND IN THE COVER ("now the content snaps downwards as i scroll down")');""",
                r"""console.log('\nA. THE FOLD AND ITS GIVE-BACK LAND IN THE SAME BREATH ("now the content snaps downwards as i scroll down")');""",
            ),
            # A1 — the note pin moves to the cover's own note
            (
                r"""  assertMatch(cv, /1\.8\.4 — THE FOLD AND ITS GIVE-BACK LAND IN THE COVER/, 'the same-breath note is missing');""",
                r"""  // 1.8.4 — the same-breath note was superseded by the cover's own note
  // (the fold still lands in one task, one paint — it simply owes the seat
  // instead of the scroll: the debt is paid into a borrowed flow seat
  // below the sticky header, never out of the scroll offset).
  assertMatch(cv, /1\.8\.4 — THE FOLD PAYS THE SEAT, NOT THE SCROLL/, 'the same-breath note is missing');""",
            ),
            # A3 — the seat rides the breath it held (the clamp law kept);
            # the give is a debt paid into the seat, never the scroll
            (
                r"""  assertMatch(cv, /const seatBefore = scroller\.scrollTop;/, 'the seat never rode the breath it held');""",
                r"""  // 1.8.4 — the seat keeps its own truth under the new name: Chromium
  // clamps the offset the moment the height leaves, so the guard still
  // reads the PRE-paint seat (seatNow — paying from the clamped seat
  // would pay the clamp TWICE at the bottom).
  assertMatch(cv, /const seatNow = scroller\.scrollTop;/, 'the seat never rode the breath it held');""",
            ),
            (
                r"""  assertMatch(cv, /const give = Math\.min\(left, Math\.max\(0, seatBefore\)\);/, 'the give never spoke its bounded word');""",
                r"""  // 1.8.4 — the give is a DEBT now: the seat holds exactly what the fold
  // removed (measured from the scroller's own scrollHeight, never guessed).
  assertMatch(cv, /const owed = seatDebtRef\.current \+ Math\.max\(0, left\);/, 'the give never spoke its bounded word');""",
            ),
            (
                r"""  assertMatch(cv, /if \(give > 0\) scroller\.scrollTop = Math\.max\(0, seatBefore - give\);/, 'the give-back write lost its seat');""",
                r"""  // 1.8.4 — the write rides the SEAT, never the scroll offset: the
  // scrollbar's map never moves (a drag on the thumb is never fought and
  // never snapped to the top and back — the report's own word).
  assertMatch(cv, /if \(rowsSeatRef\.current\) rowsSeatRef\.current\.style\.height = `\$\{owed\}px`;/, 'the give-back write lost its seat');""",
            ),
            # A5 — the name retract gate reads the captured open state
            (
                r"""  assertMatch(cv, /if \(nameFoldEl && nameExpandedRef\.current === true && nameFoldHRef\.current != null\) \{/, 'the name retract gate never spoke');""",
                r"""  // 1.8.4 — the gate reads the captured nameWasOpen (the fold captures
  // the name it swallows so the restore can return it — its height rides
  // into the debt with the tray's own).
  assertMatch(cv, /if \(nameFoldEl && nameWasOpen && nameFoldHRef\.current != null\) \{/, 'the name retract gate never spoke');""",
            ),
            # A7 — the same-stroke column write is retired with the give-back
            # it served; the RO's landing lands on a number that never changed
            (
                r"""  assertMatch(cv, /if \(col && head && window\.getComputedStyle\?\.\(col\)\?\.position === 'sticky'\) \{/, 'the sticky-column gate never spoke');""",
                r"""  // 1.8.4 — the hand-written column seat is retired with the give-back
  // it served: the RO measures the header PLUS the debt, so through a fold
  // both change by the same number in opposite directions and the column
  // never learns the tray left (its seat never hops a frame after the fact).
  assertMatch(cv, /new ResizeObserver\(\(\) =>/, 'the sticky-column gate never spoke');""",
            ),
            (
                r"""  assertMatch(cv, /col\.style\.top = `\$\{liveHead \+ 10\}px`;/, "the column's top never landed in the stroke");""",
                r"""  assertMatch(cv, /setHeadH\(Math\.round\(el\.offsetHeight \+ seatDebtRef\.current\)\)/, "the column's top never landed in the stroke");""",
            ),
            (
                r"""  assertMatch(cv, /setHeadH\(liveHead\);/, 'the headH state never landed in the stroke');""",
                r"""  assert.ok(!cv.includes('col.style.top'), 'the hand-written column seat survived — the RO is still being fought');""",
            ),
            # B1 — the tombstone keeps its 1.8.3 birth name
            (
                r"""  assertMatch(css, /1\.8\.4 — THE KEYS SPEAK THE ROW'S OWN COLOR/, 'the colored-keys note is missing');""",
                r"""  assertMatch(css, /1\.8\.3 — THE KEYS SPEAK THE ROW'S OWN COLOR/, 'the colored-keys note is missing');""",
            ),
            # B3 — the gather steps toward the ink (never yellow on yellow)
            (
                r"""  assertMatch(m, /border-color: var\(--part-color, var\(--gd-ink\)\);/, 'the raw color\'s edge never spoke');""",
                r"""  // 1.8.4 — the gather steps toward the INK now: the 1.8.3 adjacent-rung
  // gather (the face 42% into the title, the border to the raw color)
  // melted yellow-on-yellow on a saturated family — the row's own ink
  // rung carries both the 16% face step and the 45% hem.
  assertMatch(m, /border-color: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 45%, var\(--part-line, var\(--gd-line\)\)\);/, 'the raw color\'s edge never spoke');""",
            ),
            (
                r"""  assertMatch(m, /background: color-mix\(in srgb, var\(--part-face, var\(--gd-panel\)\) 42%, var\(--part-title, var\(--gd-panel\)\)\);/, 'the lift toward the face never spoke');""",
                r"""  assertMatch(m, /background: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 16%, var\(--part-title, var\(--gd-panel\)\)\);/, 'the lift toward the face never spoke');""",
            ),
            # B5 — the danger key speaks its own red; the copied beat speaks
            # the family's own extreme rungs
            (
                r"""  assertMatch(del, /color: #ff8d7d;/, 'the danger tongue lost its word');""",
                r"""  // 1.8.4 — the danger key steps OUT of the family (its own red face,
  // its white X — never the salmon tongue) and the copied beat flips to
  // the family's own extreme rungs (the spine under the ink).
  assertMatch(del, /background: #c8402f;/, 'the danger tongue lost its word');
  assertMatch(del, /color: #ffffff;/, "the white X never spoke above the danger's red");""",
            ),
            (
                r"""  assertMatch(copied, /background: var\(--gd-accent\);/, 'the confirmation beat lost its accent face');""",
                r"""  assertMatch(copied, /background: var\(--part-spine, var\(--gd-accent\)\);/, 'the confirmation beat lost its accent face');""",
            ),
            # C1 — the tombstone keeps its 1.8.3 birth name
            (
                r"""  assertMatch(css, /1\.8\.4 — THE NOTES' KEYS JOIN THE FRAME/, 'the notes-keys note is missing');""",
                r"""  assertMatch(css, /1\.8\.3 — THE NOTES' KEYS JOIN THE FRAME/, 'the notes-keys note is missing');""",
            ),
        ],
    )

    # 185 — the previous-entry pins keep the 1.8.3 entry's own name (the
    # "keeps its own seat" check must pin the PREVIOUS version, never the
    # new head — the sweep's hand moved all three forward)
    patch(
        "scripts/gendex_185_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(changelog, /^## 1\.8\.4 — The Cover/m, "the 1.8.3 entry lost its seat");""",
                r"""  assertMatch(changelog, /^## 1\.8\.3 — The Same Breath/m, "the 1.8.3 entry lost its seat");""",
            ),
            (
                r"""  assertMatch(readme, /^1\.8\.4 — the cover\./m, 'the 1.8.3 README paragraph lost its seat');""",
                r"""  assertMatch(readme, /^1\.8\.3 — the same breath\./m, 'the 1.8.3 README paragraph lost its seat');""",
            ),
            (
                r"""  assertMatch(website, /releases\/tag\/v1\.8\.4">release page<\/a>/, 'the 1.8.3 row lost its own release link');""",
                r"""  assertMatch(website, /releases\/tag\/v1\.8\.3">release page<\/a>/, 'the 1.8.3 row lost its own release link');""",
            ),
        ],
    )


if __name__ == "__main__":
    main()
