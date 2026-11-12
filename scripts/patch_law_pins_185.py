#!/usr/bin/env python3
r"""1.8.5 law-pin patch — re-pins the SUPERSEDED laws the payer superseded.

The supersessions this version leaves behind:
  · 178's E2 + 179's D1 + 180's D4 — the 1.7.7/1.7.8 :has focus family
    DOUBLES ITS OWN CLASS now (the honest weight lift): the DEEP shade's
    own hover seat (0,4,0, later in the file) tied the colored focus rule
    and won by source order — hovering a DEEP colored prompt replaced the
    selected outline with the raw color-on-color edge ("when hovering
    over the prompt the highlighted selected outline dissapears from the
    container", proven live on real Chromium). The selector pins move to
    the doubled-class law.
  · 183's G1/G2 + 184's A1/A2/A3/A5/A8 + 185's A1/A3/A4/A5/A6/A7/A8/A9/
    A11 — the 1.8.4 cover economy (one-frame paints, the hem guard's
    revert, the cheap hem, the un-clamp writes, the is-snap seat) is
    superseded whole by THE PAYER (one formula, both directions — the
    seat mirrors the header's live loss frame by frame through a
    ResizeObserver) and THE ROAD CHOICE (the seat road past the hem, the
    FLOW road from the top — the report's own case — and the
    between-band standing down): the tray TWEENS on every road (the
    0.39.0 breath, restored), the expand animation plays on every
    restore and every manual road, the flow's total never changes
    THROUGH any flight, and the listener never writes the offset at all.

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
    # 178 — the :has family doubles its class (the outline outranks the deep hover)
    patch(
        "scripts/gendex_178_batch_dom.test.mjs",
        [
            (
                r"""  // 1.7.8 supersede — THE TITLE JOINS THE CHORUS: the :has family
  // speaks both fields now (the well + the title's .gd-rt-edit).
  assertMatch(cssLaws, /\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row:has\(\.gd-rt-edit:focus\) \{[\s\S]*?border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the frame hue law never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored frame hue law never spoke');""",
                r"""  // 1.7.8 supersede — THE TITLE JOINS THE CHORUS: the :has family
  // speaks both fields now (the well + the title's .gd-rt-edit).
  // 1.8.5 supersede — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER: the
  // family doubles its own class (the honest weight lift, no
  // !important) because the DEEP shade's hover seat tied the colored
  // focus rule and won by source order — the outline "disappearing"
  // into the color-on-color edge exactly as the report told it.
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{[\s\S]*?border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the frame hue law never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored frame hue law never spoke');""",
            ),
        ],
        1,
    )

    # 179 — the same doubled-class law at the title's own suite
    patch(
        "scripts/gendex_179_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(cssLaws, /\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row:has\(\.gd-rt-edit:focus\) \{\s*border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the uncolored family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored family never spoke');""",
                r"""  // 1.8.5 supersede — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER: the
  // family doubles its own class (the DEEP shade's hover seat tied the
  // colored focus rule by specificity and won by source order — the
  // outline "disappearing" on every deep colored prompt).
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{\s*border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the uncolored family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored family never spoke');""",
            ),
        ],
        1,
    )

    # 180 — the main view keeps its row answer (the doubled-class family)
    patch(
        "scripts/gendex_180_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(cssLaws, /\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row:has\(\.gd-rt-edit:focus\) \{/, 'the row family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored row family never spoke');""",
                r"""  // 1.8.5 supersede — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER: the
  // family doubles its own class (the DEEP shade's hover seat tied it
  // and won by order — the outline "disappearing" on the deep rows).
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{/, 'the row family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored row family never spoke');""",
            ),
        ],
        1,
    )

    # 183 — the seat's economy became the payer; the snap retired with its fight
    patch(
        "scripts/gendex_183_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(cv, /1\.8\.4 — THE FOLD PAYS THE SEAT, NOT THE SCROLL/, 'the give-back note is missing');""",
                r"""  // 1.8.5 — the cover's one-frame economy became THE PAYER (one
  // formula, both directions — the seat mirrors the header's live loss
  // frame by frame), and the fold's note became THE ROAD CHOICE (the
  // seat road past the hem, the flow road from the top, the
  // between-band standing down — the cover law kept, spoken per frame).
  assertMatch(cv, /1\.8\.5 — THE PAYER \(one formula, both directions/, 'the payer note is missing');
  assertMatch(cv, /1\.8\.5 — THE ROAD CHOICE/, 'the road-choice note is missing');""",
            ),
            (
                r"""ok('G2 — the tray joins the snap (is-snap rides the foldSnap window)', () => {
  assertMatch(cv, /foldSnap && 'is-snap'/, 'the tray class never spoke');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY/, 'the tray-snap note is missing');""",
                r"""ok('G2 — the tray snap retires with the fight it fled (the tombstone keeps its seat)', () => {
  // 1.8.5 — THE SNAP SEAT RETIRES: the payer holds the flow's total
  // still THROUGH every flight, so there is no layout fight to still
  // and no snap to land — the tray tweens on every road (the 0.39.0
  // breath, restored) and the is-snap class never arms again; its CSS
  // block stays as the tombstone.
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tray-snap tombstone never spoke');""",
            ),
        ],
        2,
    )

    # 184 — the fold is a state flip; the payer carries the paint
    patch(
        "scripts/gendex_184_batch_dom.test.mjs",
        [
            (
                r"""  assertMatch(cv, /1\.8\.4 — THE FOLD PAYS THE SEAT, NOT THE SCROLL/, 'the same-breath note is missing');""",
                r"""  // 1.8.5 — the cover's one-frame economy became THE PAYER (one
  // formula, both directions) and the fold's note became THE ROAD
  // CHOICE: the same-breath paint had nothing left to synchronize once
  // the flow's total stands still through the whole flight.
  assertMatch(cv, /1\.8\.5 — THE ROAD CHOICE/, 'the road-choice note is missing');
  assertMatch(cv, /1\.8\.5 — THE PAYER \(one formula, both directions/, 'the payer note is missing');""",
            ),
            (
                r"""ok('A2 — the listener paints the fold itself (tray classes + body heights, one task)', () => {
  assertMatch(cv, /const before = scroller\.scrollHeight;/, 'the before-measure never spoke');
  assertMatch(cv, /if \(zone\) zone\.classList\.add\('gd-rows-folded', 'is-snap'\);/, 'the tray classes never landed in the listener');
  assertMatch(cv, /rowsBody\.style\.height = '0px';/, "the body's height never landed on the node");
  assertMatch(cv, /rowsBody\.style\.opacity = '0';/, "the body's opacity never landed on the node");
});""",
                r"""ok('A2 — the listener commits the fold as a state flip (the payer carries the paint)', () => {
  // 1.8.5 — the listener paints NOTHING anymore: the fold is a state
  // flip (React + framer + the tray's own CSS tweens carry the flight)
  // and the payer — a ResizeObserver — tracks the header's live loss
  // frame by frame, so the flow's total never changes THROUGH the
  // flight and the same-breath paint retired with the pay it served.
  assertMatch(cv, /launchSeatPayer\(\);\s*\n\s*flowFoldRef\.current = false;/, 'the seat road never launched the payer');
  assertMatch(cv, /flowFoldRef\.current = true;\s*\n\s*flowOriginRef\.current = scroller\.scrollTop;/, 'the flow road never recorded its origin');
  assertMatch(cv, /setAutoCollapsed\(\(was\) => \(was \? was : true\)\);/, 'the fold never flipped its state');
});""",
            ),
            (
                r"""ok('A3 — the give-back reads what ACTUALLY left (scrollHeight, before against after)', () => {
  // 1.8.4 — the seat keeps its own truth under the new name: Chromium
  // clamps the offset the moment the height leaves, so the guard still
  // reads the PRE-paint seat (seatNow — paying from the clamped seat
  // would pay the clamp TWICE at the bottom).
  assertMatch(cv, /const seatNow = scroller\.scrollTop;/, 'the seat never rode the breath it held');
  assertMatch(cv, /const left = before - scroller\.scrollHeight;/, 'the measured delta never spoke');
  // 1.8.4 — the give is a DEBT now: the seat holds exactly what the fold
  // removed (measured from the scroller's own scrollHeight, never guessed).
  assertMatch(cv, /const owed = seatDebtRef\.current \+ Math\.max\(0, left\);/, 'the give never spoke its bounded word');
  // 1.8.4 — the write rides the SEAT, never the scroll offset: the
  // scrollbar's map never moves (a drag on the thumb is never fought and
  // never snapped to the top and back — the report's own word).
  assertMatch(cv, /if \(rowsSeatRef\.current\) rowsSeatRef\.current\.style\.height = `\$\{owed\}px`;/, 'the give-back write lost its seat');
});""",
                r"""ok('A3 — the debt is discovered live (the payer's formula, never a commit-time measure)', () => {
  // 1.8.5 — the seat's height is whatever the header has LOST at this
  // breath, written per observed frame by the payer's formula — never
  // measured at commit and never guessed. The road choice only
  // ESTIMATES the give up front (dEst — the tray's own height against
  // the cached folded rest) to pick the road before any paint.
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the road choice never estimated the give');
  assertMatch(cv, /const next = Math\.max\(0, d0 - \(h - h0\)\);/, 'the payer formula never spoke');
  assertMatch(cv, /seat\.style\.height = `\$\{next\}px`;/, 'the seat never held what the header lost');
  assertMatch(cv, /seatDebtRef\.current = next;/, 'the debt never took its live seat');
});""",
            ),
            (
                r"""ok('A5 — an expanded name retracts in the same stroke (its measured two-line target)', () => {
  // 1.8.4 — the gate reads the captured nameWasOpen (the fold captures
  // the name it swallows so the restore can return it — its height rides
  // into the debt with the tray's own).
  assertMatch(cv, /if \(nameFoldEl && nameWasOpen && nameFoldHRef\.current != null\) \{/, 'the name retract gate never spoke');
  assertMatch(cv, /nameFoldEl\.style\.height = `\$\{nameFoldHRef\.current\}px`;/, "the name's target never landed on the node");
});""",
                r"""ok('A5 — an expanded name retracts on its own flight (the same breath the tray speaks)', () => {
  // 1.8.5 — the direct write retired with the same-breath paint: the
  // name retracts by STATE (framer's own 0.24s flight carries the
  // retract), the fold captures the name it swallows so the restore can
  // return it, and the name's height rides in the PAYER'S measure with
  // the tray's own (the seat carries both).
  assertMatch(cv, /nameOpenAtFoldRef\.current = nameWasOpen;/, 'the fold never captured the name it swallowed');
  assertMatch(cv, /setNameExpanded\(\(was\) => \(was \? false : was\)\);/, 'the name never retracted with the rows');
});""",
            ),
            (
                r"""ok('A8 — the tray snap law keeps its seat (the 1.8.2 word stands)', () => {
  assertMatch(cv, /foldSnap && 'is-snap'/, 'the tray class never spoke');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(m, /transition: none !important;/, 'the snap never stills the tray');
});""",
                r"""ok('A8 — the tray snap retires with the fight it fled (the tombstone keeps its seat)', () => {
  // 1.8.5 — THE SNAP SEAT RETIRES: the payer holds the flow's total
  // still THROUGH every flight, so there is no layout fight to still —
  // the tray tweens on every road and the is-snap class never arms
  // again (its CSS block stays as the tombstone).
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tombstone never spoke');
});""",
            ),
        ],
        5,
    )

    # 185 — the payer era's own seats
    patch(
        "scripts/gendex_185_batch_dom.test.mjs",
        [
            (
                r"""ok('A1 — the law note speaks its name', () => {
  assertMatch(cv, /1\.8\.4 — THE FOLD PAYS THE SEAT, NOT THE SCROLL/, 'the cover note is missing');
  assertMatch(cv, /1\.8\.4 — THE COVER'S HEM/, "the hem's own note never spoke");
  assertMatch(cv, /1\.8\.4 — THE HEM GUARD/, "the guard's own note never spoke");
});""",
                r"""ok('A1 — the law note speaks its name', () => {
  // 1.8.5 supersede — the cover's one-frame economy became THE PAYER
  // (one formula, both directions), the hem guard's revert became THE
  // ROAD CHOICE, and the hem's return became a FLIGHT: the notes tell
  // their own supersession in the code's own voice.
  assertMatch(cv, /1\.8\.5 — THE PAYER \(one formula, both directions/, 'the payer note is missing');
  assertMatch(cv, /1\.8\.5 — THE HEM RETURNS THE LOAN AS A FLIGHT/, "the hem's own note never spoke");
  assertMatch(cv, /1\.8\.5 — THE ROAD CHOICE/, "the road-choice note never spoke");
});""",
            ),
            (
                r"""ok('A3 — the fold writes the debt into the seat (measured, never guessed)', () => {
  assertMatch(cv, /const left = before - scroller\.scrollHeight;/, 'the measured delta never spoke');
  assertMatch(cv, /const owed = seatDebtRef\.current \+ Math\.max\(0, left\);/, 'the cumulative debt never spoke');
  assertMatch(cv, /seatDebtRef\.current = owed;/, 'the debt never took its seat');
  assertMatch(cv, /if \(rowsSeatRef\.current\) rowsSeatRef\.current\.style\.height = `\$\{owed\}px`;/, 'the seat never held what the fold removed');
});""",
                r"""ok('A3 — the debt is discovered live (the payer's formula, never a commit-time measure)', () => {
  // 1.8.5 supersede — the seat's height is whatever the header has LOST
  // at this breath, written per observed frame by the payer's formula;
  // the road choice only ESTIMATES the give (dEst, from the tray's own
  // height against the cached folded rest) to pick the road pre-paint.
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the road choice never estimated the give');
  assertMatch(cv, /const next = Math\.max\(0, d0 - \(h - h0\)\);/, 'the payer formula never spoke');
  assertMatch(cv, /seat\.style\.height = `\$\{next\}px`;/, 'the seat never held what the header lost');
  assertMatch(cv, /seatDebtRef\.current = next;/, 'the debt never took its live seat');
});""",
            ),
            (
                r"""ok('A4 — the give-back is retired (the listener\'s only offset writes are the un-clamp\'s give-backs)', () => {
  assert.ok(!cv.includes('seatBefore'), 'the pre-fold seat variable survived the cover law');
  assert.ok(!cv.includes('const give = Math.min('), 'the bounded give survived the cover law');
  // 1.8.4 — THE UN-CLAMP: the eager clamp (the 1.8.3 discovery) can steal
  // the seat in the breath between the fold's paint and the measure; the
  // seat (or the guard's revert) returns the page's length in the same
  // task and the stolen offset returns with it — to the PRE-paint seat
  // the hand still owns. The listener's ONLY offset writes, both of them
  // this give-back (land + revert), never a re-map, never a pay.
  assertMatch(cv, /if \(scroller\.scrollTop < seatNow\) scroller\.scrollTop = seatNow;/, 'the un-clamp never spoke');
  const writes = (cv.match(/scroller\.scrollTop = /g) || []).length;
  assert.ok(writes === 2, `the offset is written ${writes} times — the un-clamp's two seats (land + revert) are the whole word`);
});""",
                r"""ok('A4 — the give-back is retired whole (the listener never writes the offset at all)', () => {
  assert.ok(!cv.includes('seatBefore'), 'the pre-fold seat variable survived the cover law');
  assert.ok(!cv.includes('const give = Math.min('), 'the bounded give survived the cover law');
  // 1.8.5 supersede — even THE UN-CLAMP rides off: the fold is a state
  // flip now (nothing paints in the listener's own task, so the eager
  // clamp has no mid-task breath to steal from), and the seat road's
  // payer keeps the flow's total constant THROUGH the flight — the
  // offset is never written by this listener on any road: no pay, no
  // re-map, no un-clamp, the drag's own offset whole forever.
  const writes = (cv.match(/scroller\.scrollTop = /g) || []).length;
  assert.ok(writes === 0, `the offset is written ${writes} times — no road touches it anymore`);
});""",
            ),
            (
                r"""ok('A5 — the hem guard reverts an early attempt in the same task (no class, no state, nothing landed)', () => {
  assertMatch(cv, /if \(left <= 0 \|\| seatNow < owed\) \{/, 'the guard never spoke its word');
  assertMatch(cv, /const seatNow = scroller\.scrollTop;/, 'the guard never read the pre-paint seat (the clamp law)');
  const guard = cv.slice(cv.indexOf('if (left <= 0 || seatNow < owed)'));
  const revert = guard.slice(0, guard.indexOf('foldHemRef.current = owed;'));
  // 1.8.4 — THE REVERT LANDS THE REST VALUES BEFORE THE SNAP LEAVES (the
  // freeze the live probe caught): the folded class leaves FIRST, with
  // is-snap still seating transition: none; the forced recalc lands every
  // rest value with no flight at all; THEN is-snap leaves onto values that
  // no longer change — no transition ever arms, the attempt truly never was
  assertMatch(revert, /zone\.classList\.remove\('gd-rows-folded'\);/, 'the revert never un-painted the tray');
  assertMatch(revert, /void zone\.offsetHeight;/, 'the revert never forced the recalc that lands the rest');
  assertMatch(revert, /zone\.classList\.remove\('is-snap'\);/, 'the snap never left after the rest values landed');
  assertMatch(revert, /rowsBody\.style\.height = '';/, "the revert never gave the body's height back");
  assertMatch(revert, /rowsBody\.style\.opacity = '';/, "the revert never gave the body's opacity back");
  assertMatch(revert, /nameFoldEl\.style\.height = '';/, 'the revert never gave the expanded name its height back');
  assertMatch(revert, /if \(scroller\.scrollTop < seatNow\) scroller\.scrollTop = seatNow;/, "the revert's own un-clamp never spoke");
});""",
                r"""ok('A5 — the between-band stands down (an attempt short of the hem never lands at all)', () => {
  // 1.8.5 supersede — the hem guard's paint-measure-revert became THE
  // ROAD CHOICE: the give is ESTIMATED before any paint (nothing ever
  // lands to revert — no class, no height, no state, the attempt never
  // exists), and a journey begun mid-page short of the hem simply stands
  // down — the 1.8.4 ground, spoken with one comparison. The journey
  // that BEGAN at the top rides the flow road (the report's own case:
  // "when scrolling down from top of the detail panel").
  assertMatch(cv, /if \(!fromTop && scroller\.scrollTop < dEst\) return; \/\/ the between-band/, 'the between-band never spoke its word');
  assertMatch(cv, /const fromTop = \(journeyStartRef\.current == null \? prev : journeyStartRef\.current\) <= 32;/, 'the journey gate never read its start');
  assertMatch(cv, /if \(down && !wasDown\) journeyStartRef\.current = prev == null \? scroller\.scrollTop : prev;/, "the journey's start was never recorded");
});""",
            ),
            (
                r"""ok('A6 — the cheap hem answers the early ticks with one comparison', () => {
  assertMatch(cv, /const foldHemRef = useRef\(0\);/, 'the cached hem never declared its seat');
  assertMatch(cv, /if \(scroller\.scrollTop < foldHemRef\.current \* 0\.85\) return;/, 'the cheap hem never spoke');
  assertMatch(cv, /foldHemRef\.current = Math\.max\(foldHemRef\.current, owed\);/, 'the reverted attempt never cached its measure');
});""",
                r"""ok('A6 — the dead zone answers the restore-edge ticks with one comparison', () => {
  // 1.8.5 supersede — the cheap hem (the revert cache) rides off with
  // the revert itself: the attempt is two cheap reads now, and the
  // anti-flap breath at the RESTORE edge is the dead zone — 48px of
  // downward grace after any restore before the fold re-arms. The
  // folded rest the road choice estimates is cached by the payer's own
  // retire instead (measured honestly, the CSS's 26 only the fallback).
  assertMatch(cv, /const foldDeadRef = useRef\(0\);/, 'the dead zone never declared its seat');
  assertMatch(cv, /if \(scroller\.scrollTop < foldDeadRef\.current\) return;/, 'the dead zone never spoke');
  assertMatch(cv, /foldDeadRef\.current = scroller\.scrollTop \+ 48;/, 'a restore never armed its grace');
  assertMatch(cv, /const foldRestHRef = useRef\(0\);/, 'the folded-rest cache never declared its seat');
});""",
            ),
            (
                r"""ok('A7 — the hem unfold returns the loan (the cover re-extends over content that never moved)', () => {
  assertMatch(cv, /if \(debt > 0 && scroller\.scrollTop < debt\) \{/, 'the hem-unfold gate never spoke');
  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));
  const body = hem.slice(0, hem.indexOf('if (prev == null)'));
  assertMatch(body, /rowsSeatRef\.current\.style\.height = '0px';/, 'the seat never paid itself to zero');
  // 1.8.4 — THE RESTORE LANDS THE REST VALUES BEFORE THE SNAP LEAVES (the
  // same two-step law the revert rides): the folded class leaves FIRST,
  // the forced recalc lands the rest, is-snap leaves LAST
  assertMatch(body, /zone\.classList\.remove\('gd-rows-folded'\);/, 'the folded class never left first in the restore');
  assertMatch(body, /void zone\.offsetHeight;/, 'the restore never forced the recalc that lands the rest');
  assertMatch(body, /zone\.classList\.remove\('is-snap'\);/, 'the snap never left last in the restore');
  assertMatch(body, /rowsBody\.style\.height = '';/, "the body's height never returned in the restore");
  assertMatch(body, /setAutoCollapsed\(false\);/, "the fold's state never returned in the restore");
  assert.ok(!/zone\.classList\.remove\('gd-rows-folded', 'is-snap'\);/.test(cv), 'the one-shot class removal survived — the freeze\'s own door stayed open');
});""",
                r"""ok('A7 — the hem unfold returns the loan as a flight (the cover re-extends over content that never moved)', () => {
  assertMatch(cv, /if \(debt > 0 && scroller\.scrollTop < debt\) \{/, 'the hem-unfold gate never spoke');
  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));
  const body = hem.slice(0, hem.indexOf('if (prev == null)'));
  // 1.8.5 supersede — the restore hands the loan to THE PAYER instead of
  // zeroing it at once: the seat pays down per observed frame while the
  // tray TWEENS open into the space it vacates (the 1.8.4 one-frame
  // paint left with the snap it served — the expand animation PLAYS
  // now), and the plate and everything below never move a pixel through
  // the whole return.
  assertMatch(body, /launchSeatPayer\(\);/, 'the restore never handed the loan to the payer');
  assertMatch(body, /setAutoCollapsed\(false\);/, "the fold's state never returned in the restore");
  assertMatch(body, /foldDeadRef\.current = scroller\.scrollTop \+ 48;/, 'the restore never armed its anti-flap grace');
  assert.ok(!/zone\.classList\.remove\('gd-rows-folded', 'is-snap'\);/.test(cv), 'the one-shot class removal survived — the freeze\'s own door stayed open');
});""",
            ),
            (
                r"""  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));
  const body = hem.slice(0, hem.indexOf('if (prev == null)'));
  assertMatch(body, /if \(nameReturns\) \{/, 'the restore never asked for the name back');""",
                r"""  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));
  const body = hem.slice(0, hem.indexOf('if (prev == null)'));
  // 1.8.5 — the restore asks the ref at its own door (the payer era's
  // restore reads nameOpenAtFoldRef directly — the name the fold
  // swallowed returns with the tray on BOTH restore roads, its height
  // riding in the payer's measure all the while).
  assertMatch(body, /if \(nameOpenAtFoldRef\.current\) \{/, 'the restore never asked for the name back');""",
            ),
            (
                r"""  const dis = cv.slice(cv.indexOf('const dismissSeatDebt = useCallback('));
  const disBody = dis.slice(0, dis.indexOf('}, []);'));
  assertMatch(disBody, /seatDebtRef\.current = 0;/, 'the dismissal never zeroed the debt');
  assertMatch(disBody, /rowsSeatRef\.current\.style\.height = '0px';/, 'the dismissal never zeroed the seat');
  assertMatch(disBody, /rowsBody\.style\.height = '';/, 'the dismissal never painted the expansion itself');""",
                r"""  const dis = cv.slice(cv.indexOf('const dismissSeatDebt = useCallback('));
  const disBody = dis.slice(0, dis.indexOf('}, [launchSeatPayer]);'));
  // 1.8.5 — the dismissal HANDS the loan to the payer instead of zeroing
  // it at once: the tray tweens open into the space the seat vacates
  // (the 1.8.4 direct paint left with the snap it served — the expand
  // animation plays on every manual road now, "isnt playing anymore"
  // retired).
  assertMatch(disBody, /launchSeatPayer\(\);/, 'the dismissal never handed the loan to the payer');
  assertMatch(disBody, /flowFoldRef\.current = false;/, 'the dismissal never closed the flow road');""",
            ),
            (
                r"""ok('A11 — the tray snap law keeps its seat (one fold, one frame — the 1.8.2 word stands)', () => {
  assertMatch(cv, /foldSnap && 'is-snap'/, 'the tray class never spoke');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(m, /transition: none !important;/, 'the snap never stills the tray');
});""",
                r"""ok('A11 — the tray snap retires with the fight it fled (the tombstone keeps its seat)', () => {
  // 1.8.5 — THE SNAP SEAT RETIRES: the payer holds the flow's total
  // still THROUGH every flight, so there is no layout fight to still
  // and no snap to land — the tray tweens on every road (the 0.39.0
  // breath, restored) and the is-snap class never arms again; its CSS
  // block stays as the tombstone (the selector family pinned as the
  // law it used to be).
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tombstone never spoke');
});""",
            ),
        ],
        9,
    )

    print("\n1.8.5 law-pin patch: all superseded pins moved with their supersessions told.")


if __name__ == "__main__":
    main()
