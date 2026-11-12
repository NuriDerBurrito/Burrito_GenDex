#!/usr/bin/env python3
r"""1.8.6 law-pin patch — re-pins the SUPERSEDED laws the silence superseded.

The supersessions this version leaves behind:
  · THE SILENT ASCENT — the whole 1.8.4/1.8.5 seat economy (the seat, the
    debt, the payer, the hem restore, the flow origin, the dead zone, the
    dismissal) retires with the loans it served: the scroll speaks DOWN
    only, every fold rides the flow road, and an up-tick answers NOTHING
    (expanding is the hand's work alone — openTrayByHand). The 181/183/
    184/185/186 suites' pins on the seat economy move to the retirement
    forms; the over-swept birth-version tombstones revert.
  · THE OUTLINE ANSWERS THE HAND — the deep hover's raw-color border
    became the ink-rung gather (the 1.8.5 F2 tie-pin moves with it).
  · THE WHEEL THAT OUTLIVES THE FREEZE — the 0.22.0 corner-spinner pin in
    the smoke-render fleet already moved inline (gd-load-veil has-out).

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
    # ---- 181: the wake edge joins the hand's roads -------------------------
    patch(
        "scripts/gendex_181_batch_dom.test.mjs",
        [
            (
                """  // 1.8.4 — the wake opens a tray that may hold a scroll-fold's loan: the
  // cover's dismissal rides the edge now (dismissSeatDebt, before the rows
  // open — waking with the debt still standing would count the tray's
  // height TWICE and the scrollbar's map would lie about the page).
  assertMatch(charview, /const wasDormantRef = useRef\\(dormant\\);\\s*useEffect\\(\\(\\) => \\{\\s*if \\(wasDormantRef\\.current && !dormant\\) \\{\\s*(?:\\/\\/[^\\n]*\\n\\s*)*dismissSeatDebt\\(\\);\\s*setRowsCollapsed\\(\\{ tags: false, stamps: false \\}\\);\\s*setAutoCollapsed\\(false\\);\\s*\\}\\s*wasDormantRef\\.current = dormant;\\s*\\}, \\[dormant\\]\\);/, 'the wake effect never spoke');""",
                """  // 1.8.4 — the wake opens a tray that may hold a scroll-fold's loan: the
  // cover's dismissal rode the edge (dismissSeatDebt, before the rows
  // opened). 1.8.6 — THE SILENT ASCENT retired the loan whole: no fold
  // ever borrows, so the wake opens the tray by the hand's own word
  // (openTrayByHand — the page growing back with the tray's flight).
  assertMatch(charview, /const wasDormantRef = useRef\\(dormant\\);\\s*useEffect\\(\\(\\) => \\{\\s*if \\(wasDormantRef\\.current && !dormant\\) \\{\\s*(?:\\/\\/[^\\n]*\\n\\s*)*setRowsCollapsed\\(\\{ tags: false, stamps: false \\}\\);\\s*openTrayByHand\\(\\);\\s*\\}\\s*wasDormantRef\\.current = dormant;\\s*\\}, \\[dormant\\]\\);/, 'the wake effect never spoke');""",
            ),
        ],
    )

    # ---- 183: the payer + road-choice notes tell their retirement ----------
    patch(
        "scripts/gendex_183_batch_dom.test.mjs",
        [
            (
                "  assertMatch(cv, /1\\.8\\.6 — THE PAYER \\(one formula, both directions/, 'the payer note is missing');\n  assertMatch(cv, /1\\.8\\.6 — THE ROAD CHOICE/, 'the road-choice note is missing');",
                "  // 1.8.6 — THE SILENT ASCENT: the payer retired WITH the seat it\n  // wrote, and the road choice speaks its one road now.\n  assertMatch(cv, /THE PAYER \\(one formula, both directions[\\s\\S]*?RETIRED IN 1\\.8\\.6/, 'the payer retirement note is missing');\n  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\\.8\\.6 THERE IS ONLY ONE ROAD/, 'the one-road note is missing');",
            ),
            (
                "  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.6/, 'the tray-snap tombstone never spoke');",
                "  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.5/, 'the tray-snap tombstone never spoke');",
            ),
        ],
    )

    # ---- 184: the fold's state-flip + the column's header-alone measure ----
    patch(
        "scripts/gendex_184_batch_dom.test.mjs",
        [
            (
                "  assertMatch(cv, /1\\.8\\.6 — THE ROAD CHOICE/, 'the road-choice note is missing');\n  assertMatch(cv, /1\\.8\\.6 — THE PAYER \\(one formula, both directions/, 'the payer note is missing');",
                "  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\\.8\\.6 THERE IS ONLY ONE ROAD/, 'the one-road note is missing');\n  assertMatch(cv, /THE PAYER \\(one formula, both directions[\\s\\S]*?RETIRED IN 1\\.8\\.6/, 'the payer retirement note is missing');",
            ),
            (
                "  assertMatch(cv, /launchSeatPayer\\(\\);\\s*\\n\\s*flowFoldRef\\.current = false;/, 'the seat road never launched the payer');\n  assertMatch(cv, /flowFoldRef\\.current = true;\\s*\\n\\s*flowOriginRef\\.current = scroller\\.scrollTop;/, 'the flow road never recorded its origin');\n  assertMatch(cv, /setAutoCollapsed\\(\\(was\\) => \\(was \\? was : true\\)\\);/, 'the fold never flipped its state');",
                "  // 1.8.6 — THE SILENT ASCENT: there are no roads to choose between\n  // anymore — the fold is ONE state flip on ONE road, the ascent silent.\n  assertMatch(cv, /if \\(!down\\) return; \\/\\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the ascent never fell silent');\n  assertMatch(cv, /if \\(!fromTop && scroller\\.scrollTop < dEst\\) return; \\/\\/ the between-band/, 'the between-band never stood down');\n  assertMatch(cv, /setAutoCollapsed\\(\\(was\\) => \\(was \\? was : true\\)\\);/, 'the fold never flipped its state');",
            ),
            (
                "  assertMatch(cv, /const next = Math\\.max\\(0, d0 - \\(h - h0\\)\\);/, 'the payer formula never spoke');\n  assertMatch(cv, /seat\\.style\\.height = `\\$\\{next\\}px`;/, 'the seat never held what the header lost');\n  assertMatch(cv, /seatDebtRef\\.current = next;/, 'the debt never took its live seat');",
                "  // 1.8.6 — the formula left with the payer; the folded rest is\n  // measured by the settle effect where the payer's retire clock sat.\n  assertMatch(cv, /1\\.8\\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');\n  assertMatch(cv, /if \\(zone && zone\\.offsetHeight > 0\\) foldRestHRef\\.current = zone\\.offsetHeight;/, 'the folded rest never took its honest measure');",
            ),
            (
                "  assertMatch(cv, /setHeadH\\(Math\\.round\\(el\\.offsetHeight \\+ seatDebtRef\\.current\\)\\)/, \"the column's top never landed in the stroke\");",
                "  assertMatch(cv, /setHeadH\\(Math\\.round\\(el\\.offsetHeight\\)\\)/, \"the column's top never landed on the header alone\");",
            ),
            (
                "  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.6/, 'the tombstone never spoke');",
                "  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.5/, 'the tombstone never spoke');",
            ),
        ],
    )

    # ---- 185: the cover's own suite tells the ascent -----------------------
    patch(
        "scripts/gendex_185_batch_dom.test.mjs",
        [
            (
                "  assertMatch(cv, /1\\.8\\.6 — THE PAYER \\(one formula, both directions/, 'the payer note is missing');\n  assertMatch(cv, /1\\.8\\.6 — THE HEM RETURNS THE LOAN AS A FLIGHT/, \"the hem's own note never spoke\");\n  assertMatch(cv, /1\\.8\\.6 — THE ROAD CHOICE/, \"the road-choice note never spoke\");",
                "  // 1.8.6 — THE SILENT ASCENT: the payer, the hem restore and the road\n  // choice all retired with the loans they served.\n  assertMatch(cv, /THE PAYER \\(one formula, both directions[\\s\\S]*?RETIRED IN 1\\.8\\.6/, 'the payer retirement note is missing');\n  assertMatch(cv, /1\\.8\\.6 — THE SILENT ASCENT \\(\"currently when i scroll up it opens the/, 'the ascent note never spoke');\n  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\\.8\\.6 THERE IS ONLY ONE ROAD/, 'the one-road note never spoke');",
            ),
            (
                "  assertMatch(cv, /const rowsSeatRef = useRef\\(null\\);/, 'the seat ref never declared its seat');\n  assertMatch(cv, /const seatDebtRef = useRef\\(0\\);/, 'the debt ref never declared its seat');\n  assertMatch(cv, /ref=\\{rowsSeatRef\\} className=\"gd-rows-seat\"/, 'the seat element never mounted below the header');",
                "  // 1.8.6 — the seat element left the tree with the debt it held; the\n  // JSX tombstone + the CSS law keep its seat as the law it used to be.\n  assertMatch(cv, /THE SEAT LEFT WITH THE RESTORES IT SERVED/, \"the seat's retirement never spoke\");\n  assert.ok(!cv.includes('const rowsSeatRef'), 'the seat ref survived its retirement');",
            ),
            (
                "  assertMatch(cv, /const next = Math\\.max\\(0, d0 - \\(h - h0\\)\\);/, 'the payer formula never spoke');\n  assertMatch(cv, /seat\\.style\\.height = `\\$\\{next\\}px`;/, 'the seat never held what the header lost');\n  assertMatch(cv, /seatDebtRef\\.current = next;/, 'the debt never took its live seat');",
                "  // 1.8.6 — the formula left with the payer; the folded rest is\n  // measured by the settle effect where the payer's retire clock sat.\n  assertMatch(cv, /1\\.8\\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');\n  assertMatch(cv, /if \\(zone && zone\\.offsetHeight > 0\\) foldRestHRef\\.current = zone\\.offsetHeight;/, 'the folded rest never took its honest measure');",
            ),
            (
                "  assertMatch(cv, /const foldDeadRef = useRef\\(0\\);/, 'the dead zone never declared its seat');\n  assertMatch(cv, /if \\(scroller\\.scrollTop < foldDeadRef\\.current\\) return;/, 'the dead zone never spoke');\n  assertMatch(cv, /foldDeadRef\\.current = scroller\\.scrollTop \\+ 48;/, 'a restore never armed its grace');\n  assertMatch(cv, /const foldRestHRef = useRef\\(0\\);/, 'the folded-rest cache never declared its seat');",
                "  // 1.8.6 — the dead zone retired with the restores it guarded (the\n  // ascent cannot oscillate: down folds, up answers nothing).\n  assert.ok(!cv.includes('const foldDeadRef'), 'the dead zone survived the silence');\n  assertMatch(cv, /if \\(!down\\) return; \\/\\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the ascent never fell silent');\n  assertMatch(cv, /const foldRestHRef = useRef\\(0\\);/, 'the folded-rest cache never declared its seat');",
            ),
            (
                "  assertMatch(cv, /if \\(debt > 0 && scroller\\.scrollTop < debt\\) \\{/, 'the hem-unfold gate never spoke');\n  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));\n  const body = hem.slice(0, hem.indexOf('if (prev == null)'));\n  // 1.8.5 supersede — the restore hands the loan to THE PAYER instead of\n  // zeroing it at once: the seat pays down per observed frame while the\n  // tray TWEENS open into the space it vacates (the 1.8.4 one-frame\n  // paint left with the snap it served — the expand animation PLAYS\n  // now), and the plate and everything below never move a pixel through\n  // the whole return.\n  assertMatch(body, /launchSeatPayer\\(\\);/, 'the restore never handed the loan to the payer');\n  assertMatch(body, /setAutoCollapsed\\(false\\);/, \"the fold's state never returned in the restore\");\n  assertMatch(body, /foldDeadRef\\.current = scroller\\.scrollTop \\+ 48;/, 'the restore never armed its anti-flap grace');\n  assert.ok(!/zone\\.classList\\.remove\\('gd-rows-folded', 'is-snap'\\);/.test(cv), 'the one-shot class removal survived — the freeze\\'s own door stayed open');",
                "  // 1.8.6 — THE SILENT ASCENT: the hem unfold retired with the debt it\n  // returned (an up-tick answers NOTHING; expanding is the hand's work).\n  assert.ok(!cv.includes('if (debt > 0 && scroller.scrollTop < debt)'), 'the hem gate survived the silence');\n  assert.ok(!cv.includes('launchSeatPayer'), 'the payer survived its retirement');\n  assert.ok(!/zone\\.classList\\.remove\\('gd-rows-folded', 'is-snap'\\);/.test(cv), 'the one-shot class removal survived — the freeze\\'s own door stayed open');",
            ),
            (
                "  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));\n  const body = hem.slice(0, hem.indexOf('if (prev == null)'));\n  // 1.8.5 — the restore asks the ref at its own door (the payer era's\n  // restore reads nameOpenAtFoldRef directly — the name the fold\n  // swallowed returns with the tray on BOTH restore roads, its height\n  // riding in the payer's measure all the while).\n  assertMatch(body, /if \\(nameOpenAtFoldRef\\.current\\) \\{/, 'the restore never asked for the name back');\n  assertMatch(body, /setNameExpanded\\(true\\);/, \"the name's state never returned\");\n  assertMatch(body, /setNameClamped\\(false\\);/, \"the name's clamp never lifted\");",
                "  // 1.8.6 — the name returns on the HAND's roads now (openTrayByHand\n  // asks the ref at its own door — the fold swallowed both, the hand's\n  // word pays both back out).\n  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));\n  const handBody = hand.slice(0, hand.indexOf('}, []);'));\n  assertMatch(handBody, /if \\(nameOpenAtFoldRef\\.current\\) \\{/, \"the hand's road never asked for the name back\");\n  assertMatch(handBody, /setNameExpanded\\(true\\);/, \"the name's state never returned\");\n  assertMatch(handBody, /setNameClamped\\(false\\);/, \"the name's clamp never lifted\");",
            ),
            (
                "  assertMatch(cv, /const dismissSeatDebt = useCallback\\(/, 'the dismissal never declared its seat');\n  const dis = cv.slice(cv.indexOf('const dismissSeatDebt = useCallback('));\n  const disBody = dis.slice(0, dis.indexOf('}, [launchSeatPayer]);'));\n  // 1.8.5 — the dismissal HANDS the loan to the payer instead of zeroing\n  // it at once: the tray tweens open into the space the seat vacates\n  // (the 1.8.4 direct paint left with the snap it served — the expand\n  // animation plays on every manual road now, \"isnt playing anymore\"\n  // retired).\n  assertMatch(disBody, /launchSeatPayer\\(\\);/, 'the dismissal never handed the loan to the payer');\n  assertMatch(disBody, /flowFoldRef\\.current = false;/, 'the dismissal never closed the flow road');\n  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));\n  assertMatch(exp.slice(0, 400), /dismissSeatDebt\\(\\);/, \"the chip's road never returned the loan\");\n  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));\n  assertMatch(tog.slice(0, 500), /dismissSeatDebt\\(\\);/, \"a label toggle's road never returned the loan\");\n  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));\n  assertMatch(wake.slice(0, 500), /dismissSeatDebt\\(\\);/, \"the panel's wake never returned the loan\");\n  // (the two roads sit at different nestings — the key's and the menu's —\n  //  so the pair is read from the ROAD itself: the guarded dismissal that\n  //  follows each pin write, never one literal indent)\n  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);\n  const pinReturns = pinSegs.filter((seg) => {\n    const near = seg.slice(0, 400);\n    return near.includes('if (!rowsPinned) {') && near.includes('dismissSeatDebt();');\n  }).length;\n  const pinSeats = pinSegs.length;\n  assert.ok(pinSeats === 2 && pinReturns === 2, `the pin roads never returned the loan (found ${pinReturns} of ${pinSeats})`);",
                "  // 1.8.6 — THE HAND OPENS THE TRAY ITSELF: the dismissal retired with\n  // the loan it paid (there is no loan left to dismiss), and every\n  // manual road — the chip, a label toggle, the wake, the two pin roads —\n  // speaks openTrayByHand, the page growing back with the tray's flight.\n  assertMatch(cv, /1\\.8\\.6 — THE HAND OPENS THE TRAY ITSELF/, \"the hand's-road note never spoke\");\n  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));\n  const handBody = hand.slice(0, hand.indexOf('}, []);'));\n  assertMatch(handBody, /setAutoCollapsed\\(false\\);/, \"the hand's road never opened the tray\");\n  assert.ok(!cv.includes('const dismissSeatDebt'), 'the dismissal survived its retirement');\n  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));\n  assertMatch(exp.slice(0, 400), /openTrayByHand\\(\\);/, \"the chip's road never joined the hand\");\n  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));\n  assertMatch(tog.slice(0, 500), /openTrayByHand\\(\\);/, \"a label toggle's road never joined the hand\");\n  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));\n  assertMatch(wake.slice(0, 500), /openTrayByHand\\(\\);/, \"the panel's wake never joined the hand\");\n  // (the two roads sit at different nestings — the key's and the menu's —\n  //  so the pair is read from the ROAD itself: the guarded opening that\n  //  follows each pin write, never one literal indent)\n  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);\n  const pinReturns = pinSegs.filter((seg) => {\n    const near = seg.slice(0, 400);\n    return near.includes('if (!rowsPinned) {') && near.includes('openTrayByHand();');\n  }).length;\n  const pinSeats = pinSegs.length;\n  assert.ok(pinSeats === 2 && pinReturns === 2, `the pin roads never joined the hand (found ${pinReturns} of ${pinSeats})`);",
            ),
            (
                "  assertMatch(cv, /setHeadH\\(Math\\.round\\(el\\.offsetHeight \\+ seatDebtRef\\.current\\)\\)/, 'the debt never rode the measure');",
                "  assertMatch(cv, /setHeadH\\(Math\\.round\\(el\\.offsetHeight\\)\\)/, 'the column never read the header alone');",
            ),
            (
                "  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.6/, 'the tombstone never spoke');",
                "  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.5/, 'the tombstone never spoke');",
            ),
        ],
    )

    # ---- 186: the 1.8.5 laws suite tells the payer's retirement -----------
    patch(
        "scripts/gendex_186_batch_dom.test.mjs",
        [
            (
                "  assertMatch(cv, /1\\.8\\.6 — THE PAYER \\(one formula, both directions/, 'the payer note is missing');\n  assertMatch(cv, /The engine is a RESIZE OBSERVER, never a rAF/, 'the observer-engine note never spoke');\n  assertMatch(cv, /a rAF reader registered before the tween's own rAF would read the/, 'the lag lesson never spoke');",
                "  // 1.8.6 — THE SILENT ASCENT: the payer retired WITH the seat it wrote\n  // (no fold ever borrows anymore — the observer's whole economy left).\n  assertMatch(cv, /THE PAYER \\(one formula, both directions[\\s\\S]*?RETIRED IN 1\\.8\\.6/, 'the payer retirement note is missing');\n  assertMatch(cv, /the tray TWEENS on every road still \\(framer \\+ the CSS's/, 'the retirement never kept the tween');",
            ),
            (
                "  assertMatch(cv, /const seatPayerRef = useRef\\(\\{ ro: null, retireT: 0, d0: 0, h0: 0 \\}\\);/, 'the payer state never declared its seat');\n  assertMatch(cv, /const launchSeatPayer = useCallback\\(\\(\\) => \\{/, 'the launcher never declared its seat');\n  const pay = cv.slice(cv.indexOf('const launchSeatPayer = useCallback('));\n  const body = pay.slice(0, pay.indexOf('}, []);'));\n  assertMatch(body, /const d0 = seat\\.offsetHeight;/, 'the launch never read the debt it stands at');\n  assertMatch(body, /const h0 = zone\\.offsetHeight \\+ \\(nameFoldEl \\? nameFoldEl\\.offsetHeight : 0\\);/, 'the launch never anchored the folding ground');\n  assertMatch(body, /ro\\.observe\\(zone\\);/, 'the observer never watched the tray');\n  assertMatch(body, /if \\(nameFoldEl\\) ro\\.observe\\(nameFoldEl\\);/, 'the observer never watched the name fold');\n  assert.ok(!body.includes('requestAnimationFrame'), 'the payer still runs a rAF loop — the one-frame lag lives on');",
                "  // 1.8.6 — the payer's whole declaration retired with the seat it\n  // wrote; the folded-rest settle effect took the retire clock's place.\n  assert.ok(!cv.includes('const seatPayerRef'), 'the payer state survived its retirement');\n  assert.ok(!cv.includes('const launchSeatPayer'), 'the payer launcher survived its retirement');\n  assertMatch(cv, /1\\.8\\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');",
            ),
            (
                "  const pay = cv.slice(cv.indexOf('const launchSeatPayer = useCallback('));\n  const body = pay.slice(0, pay.indexOf('}, []);'));\n  assertMatch(body, /const h = zone\\.offsetHeight \\+ \\(nameFoldEl \\? nameFoldEl\\.offsetHeight : 0\\);/, 'the live measure never spoke');\n  assertMatch(body, /const next = Math\\.max\\(0, d0 - \\(h - h0\\)\\);/, 'the formula never spoke');\n  assertMatch(body, /seat\\.style\\.height = `\\$\\{next\\}px`;/, 'the seat never held the live loss');\n  assertMatch(body, /seatDebtRef\\.current = next;/, 'the debt never took its live seat');",
                "  // 1.8.6 — the formula left with the payer; the honest folded rest\n  // is read once the fold's flight has settled (the 420ms clock kept).\n  assertMatch(cv, /const t = setTimeout\\(\\(\\) => \\{[\\s\\S]*?if \\(zone && zone\\.offsetHeight > 0\\) foldRestHRef\\.current = zone\\.offsetHeight;[\\s\\S]*?\\}, 420\\);/, 'the settle clock never spoke');",
            ),
            (
                "ok('A4 — the payer retires after the last change it sees (and caches the folded rest)', () => {",
                "ok('A4 — the folded rest is measured where the payer left it (the settle clock)', () => {",
            ),
            (
                "  const pay = cv.slice(cv.indexOf('const launchSeatPayer = useCallback('));\n  const body = pay.slice(0, pay.indexOf('}, []);'));\n  assertMatch(body, /seatPayerRef\\.current\\.retireT = setTimeout\\(\\(\\) => \\{/, 'the retire clock never armed');\n  assertMatch(body, /ro\\.disconnect\\(\\);/, 'the observer never disconnected');\n  assertMatch(body, /if \\(autoCollapsedRef\\.current\\) foldRestHRef\\.current = zone\\.offsetHeight;/, 'a folded retire never cached the folded rest');",
                "  // 1.8.6 — the settle effect is the retire clock's whole word now.\n  assertMatch(cv, /useEffect\\(\\(\\) => \\{\\s*\\n\\s*if \\(!autoCollapsed\\) return undefined;[\\s\\S]*?\\}, 420\\);\\s*\\n\\s*\\}\\);/, 'the settle effect never spoke');",
            ),
            (
                "ok('A6 — the unmount lets the payer go (no observer outlives the view)', () => {\n  // the payer's OWN unmount seat: the effect that follows the engine's\n  // definition — the file's FIRST () => () => { belongs to the 1.7.x\n  // swap-timers cleanup, and a slice anchored there never reaches the\n  // payer's release at all (the locator, not the law, was the failure)\n  const engine = cv.indexOf('const launchSeatPayer = useCallback');\n  const clean = cv.slice(cv.indexOf('() => () => {', engine));\n  const body = clean.slice(0, clean.indexOf('[]'));\n  assertMatch(body, /seatPayerRef\\.current\\.ro\\.disconnect\\(\\);/, 'the cleanup never released the observer');\n  assertMatch(body, /clearTimeout\\(seatPayerRef\\.current\\.retireT\\);/, 'the cleanup never released the retire clock');\n});",
                "ok('A6 — the unmount lets the payer go (no observer outlives the view)', () => {\n  // 1.8.6 — the payer's unmount seat left with the payer itself: no\n  // observer is ever created, so none can outlive the view.\n  assert.ok(!cv.includes('seatPayerRef'), 'the payer state survived its retirement');\n  assert.ok(!cv.includes('new ResizeObserver(() => {\\n      apply();'), 'a payer-shaped observer survived');\n});",
            ),
            (
                "ok('A7 — a card swap re-anchors a live payer (the old card heights never carry over)', () => {\n  const swap = cv.slice(cv.indexOf('useLayoutEffect(() => {', cv.indexOf('swapCharIdRef.current = id;') - 400));\n  assertMatch(cv, /if \\(seatDebtRef\\.current > 0\\) launchSeatPayer\\(\\);/, 'the swap never re-anchored the payer');\n  assertMatch(cv, /1\\.8\\.5 — A LIVE PAYER RE-ANCHORS AT THE SWAP/, 'the re-anchor note never spoke');\n});",
                "ok('A7 — a card swap re-anchors a live payer (the old card heights never carry over)', () => {\n  // 1.8.6 — the re-anchor retired with the payer (no fold ever borrows,\n  // so there is no anchor to re-seat at a swap); the swap effect tells\n  // the retirement in the code's own voice.\n  assertMatch(cv, /RETIRED IN 1\\.8\\.6\\s*\\n\\s*\\/\\/ \\(THE SILENT ASCENT retired the payer with the seat it wrote/, 'the swap never told the retirement');\n  assert.ok(!cv.includes('seatDebtRef'), 'the debt survived its retirement');\n});",
            ),
            (
                "  assertMatch(cv, /1\\.8\\.6 — THE ROAD CHOICE \\(\"when scrolling down from top of the/, 'the road-choice note is missing');\n  assertMatch(cv, /THE FLOW ROAD \\(the downward journey began at the top/, 'the flow road never told its gate');\n  assertMatch(cv, /THE SEAT ROAD \\(scrollTop >= the tray's measured give\\)/, 'the seat road never told its gate');\n  assertMatch(cv, /BETWEEN THE TWO \\(a journey begun mid-page, short of the hem\\)/, 'the between-band never told its ground');",
                "  // 1.8.6 — THE SILENT ASCENT: the road choice speaks its ONE road now\n  // (the flow road), the seat road retired with its debt, and the\n  // between-band keeps its own 1.8.4 ground verbatim.\n  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\\.8\\.6 THERE IS ONLY ONE ROAD \\(\"when\\s*\\n\\s*\\/\\/ scrolling down from top of the/, 'the one-road note is missing');\n  assertMatch(cv, /THE FLOW ROAD — the ONLY road: the page shortens WITH the/, 'the flow road never told its gate');\n  assertMatch(cv, /The 1\\.8\\.4 SEAT ROAD retired with/, 'the seat road never told its retirement');\n  assertMatch(cv, /THE BETWEEN-BAND \\(a journey begun mid-page, short of the hem\\)/, 'the between-band never told its ground');",
            ),
            (
                "ok('B4 — the seat road charges the payer; the flow road records its origin', () => {\n  assertMatch(cv, /if \\(scroller\\.scrollTop >= dEst\\) \\{\\s*\\n\\s*\\/\\/ THE SEAT ROAD — the payer charges up from zero with the flight\\s*\\n\\s*launchSeatPayer\\(\\);\\s*\\n\\s*flowFoldRef\\.current = false;/, 'the seat road never launched the payer');\n  assertMatch(cv, /flowFoldRef\\.current = true;\\s*\\n\\s*flowOriginRef\\.current = scroller\\.scrollTop;/, 'the flow road never recorded its origin');\n  assertMatch(cv, /setAutoCollapsed\\(\\(was\\) => \\(was \\? was : true\\)\\);/, 'the fold never flipped its state');\n});",
                "ok('B4 — the fold commits on the one road (the state flips, the page shortens with the flight)', () => {\n  // 1.8.6 — THE SILENT ASCENT: there is no road branch anymore — no\n  // payer launch, no flow origin to record; the fold is one state flip\n  // and the page shortens with the flight.\n  assertMatch(cv, /\\/\\/ THE FOLD — one road: the state flips, framer \\+ the CSS's own\\s*\\n\\s*\\/\\/ tweens carry the flight, and the page shortens with it/, 'the one-road fold never spoke');\n  assertMatch(cv, /setAutoCollapsed\\(\\(was\\) => \\(was \\? was : true\\)\\);/, 'the fold never flipped its state');\n  assert.ok(!cv.includes('flowFoldRef'), 'the flow-road memory survived the silence');\n});",
            ),
            (
                "ok('B5 — the dead zone arms at every restore (the anti-flap breath)', () => {\n  assertMatch(cv, /const foldDeadRef = useRef\\(0\\);/, 'the dead zone never declared its seat');\n  assertMatch(cv, /if \\(scroller\\.scrollTop < foldDeadRef\\.current\\) return;/, 'the dead zone never spoke');\n  const armed = (cv.match(/foldDeadRef\\.current = scroller\\.scrollTop \\+ 48;/g) || []).length;\n  assert.ok(armed === 2, `the dead zone arms ${armed} times — both restores are the whole word`);\n});",
                "ok('B5 — the dead zone retires with the restores it guarded (the ascent cannot oscillate)', () => {\n  // 1.8.6 — THE SILENT ASCENT: down folds, up answers NOTHING — there\n  // is no restore edge left to flap against, so the 48px grace left too.\n  assert.ok(!cv.includes('foldDeadRef'), 'the dead zone survived the silence');\n});",
            ),
            (
                "ok('C1 — the hem unfold hands the loan to the payer (the cover re-extends over content that never moved)', () => {\n  assertMatch(cv, /if \\(debt > 0 && scroller\\.scrollTop < debt\\) \\{/, 'the hem-unfold gate never spoke');\n  const hem = cv.slice(cv.indexOf('if (debt > 0 && scroller.scrollTop < debt)'));\n  const body = hem.slice(0, hem.indexOf('if (prev == null)'));\n  assertMatch(body, /launchSeatPayer\\(\\);/, 'the restore never handed the loan to the payer');\n  assertMatch(body, /setAutoCollapsed\\(false\\);/, \"the fold's state never returned in the restore\");\n  assertMatch(body, /if \\(nameOpenAtFoldRef\\.current\\) \\{/, 'the restore never asked for the name back');\n  assertMatch(body, /setNameExpanded\\(true\\);/, \"the name's state never returned\");\n  assertMatch(body, /setNameClamped\\(false\\);/, \"the name's clamp never lifted\");\n});",
                "ok('C1 — the hem unfold retires with the loan it returned (the ascent answers nothing)', () => {\n  // 1.8.6 — THE SILENT ASCENT: the hem gate, the payer hand-off and the\n  // name's restore all left with the debt they served — the scroll's\n  // ascent never opens the tray, and the name returns on the hand's roads.\n  assert.ok(!cv.includes('if (debt > 0 && scroller.scrollTop < debt)'), 'the hem gate survived the silence');\n  assertMatch(cv, /1\\.8\\.6 — THE SILENT ASCENT \\(\"currently when i scroll up it opens the/, 'the ascent note never spoke');\n  assertMatch(cv, /if \\(!down\\) return; \\/\\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the ascent never fell silent');\n});",
            ),
            (
                "ok('C2 — the flow road restores at its own origin (the page grows back with the same flight)', () => {\n  assertMatch(cv, /1\\.8\\.6 — THE FLOW ROAD'S RESTORE/, 'the flow-restore note never spoke');\n  assertMatch(\n    cv,\n    /if \\(\\s*\\n?\\s*!down &&\\s*\\n\\s*flowFoldRef\\.current &&\\s*\\n\\s*prev - scroller\\.scrollTop > 2 &&\\s*\\n\\s*scroller\\.scrollTop <= flowOriginRef\\.current \\+ 8\\s*\\n?\\s*\\) \\{/,\n    'the flow-restore gate never spoke'\n  );\n  const flow = cv.slice(cv.indexOf(\"scroller.scrollTop <= flowOriginRef.current + 8\"));\n  const body = flow.slice(0, flow.indexOf('if (!down) return;'));\n  assertMatch(body, /setAutoCollapsed\\(false\\);/, 'the flow restore never re-opened the tray');\n});",
                "ok('C2 — the flow road's origin restore retires with the ascent (the page grows only by the hand)', () => {\n  // 1.8.6 — THE SILENT ASCENT: the flow origin + its restore gate left\n  // with the auto-expand they served — the page grows back only when the\n  // HAND opens the tray (openTrayByHand).\n  assert.ok(!cv.includes('flowOriginRef'), 'the flow origin survived the silence');\n  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));\n  const handBody = hand.slice(0, hand.indexOf('}, []);'));\n  assertMatch(handBody, /setAutoCollapsed\\(false\\);/, \"the hand's road never opened the tray\");\n});",
            ),
            (
                "  assertMatch(cv, /const dismissSeatDebt = useCallback\\(/, 'the dismissal never declared its seat');\n  const dis = cv.slice(cv.indexOf('const dismissSeatDebt = useCallback('));\n  const disBody = dis.slice(0, dis.indexOf('}, [launchSeatPayer]);'));\n  assertMatch(disBody, /launchSeatPayer\\(\\);/, 'the dismissal never handed the loan to the payer');\n  assertMatch(disBody, /flowFoldRef\\.current = false;/, 'the dismissal never closed the flow road');\n  assertMatch(disBody, /if \\(nameOpenAtFoldRef\\.current\\) \\{/, 'the dismissal never asked for the name back');\n  assertMatch(cv, /1\\.8\\.6 — THE PAYER PAYS IT DOWN/, 'the dismissal supersession note never spoke');\n  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));\n  assertMatch(exp.slice(0, 400), /dismissSeatDebt\\(\\);/, \"the chip's road never returned the loan\");\n  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));\n  assertMatch(tog.slice(0, 500), /dismissSeatDebt\\(\\);/, \"a label toggle's road never returned the loan\");\n  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));\n  assertMatch(wake.slice(0, 500), /dismissSeatDebt\\(\\);/, \"the panel's wake never returned the loan\");\n  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);\n  const pinReturns = pinSegs.filter((seg) => {\n    const near = seg.slice(0, 400);\n    return near.includes('if (!rowsPinned) {') && near.includes('dismissSeatDebt();');\n  }).length;\n  const pinSeats = pinSegs.length;\n  assert.ok(pinSeats === 2 && pinReturns === 2, `the pin roads never returned the loan (found ${pinReturns} of ${pinSeats})`);\n});",
                "  // 1.8.6 — THE HAND OPENS THE TRAY ITSELF: the dismissal retired with\n  // the loan it paid, and every manual road speaks openTrayByHand now.\n  assertMatch(cv, /1\\.8\\.6 — THE HAND OPENS THE TRAY ITSELF/, \"the hand's-road note never spoke\");\n  assert.ok(!cv.includes('const dismissSeatDebt'), 'the dismissal survived its retirement');\n  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));\n  const handBody = hand.slice(0, hand.indexOf('}, []);'));\n  assertMatch(handBody, /if \\(nameOpenAtFoldRef\\.current\\) \\{/, \"the hand's road never asked for the name back\");\n  assertMatch(handBody, /setAutoCollapsed\\(false\\);/, \"the hand's road never opened the tray\");\n  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));\n  assertMatch(exp.slice(0, 400), /openTrayByHand\\(\\);/, \"the chip's road never joined the hand\");\n  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));\n  assertMatch(tog.slice(0, 500), /openTrayByHand\\(\\);/, \"a label toggle's road never joined the hand\");\n  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));\n  assertMatch(wake.slice(0, 500), /openTrayByHand\\(\\);/, \"the panel's wake never joined the hand\");\n  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);\n  const pinReturns = pinSegs.filter((seg) => {\n    const near = seg.slice(0, 400);\n    return near.includes('if (!rowsPinned) {') && near.includes('openTrayByHand();');\n  }).length;\n  const pinSeats = pinSegs.length;\n  assert.ok(pinSeats === 2 && pinReturns === 2, `the pin roads never joined the hand (found ${pinReturns} of ${pinSeats})`);\n});",
            ),
            (
                "ok('C4 — the column keeps the 1.8.4 law (the payer preserves the invariant by construction)', () => {\n  assertMatch(cv, /setHeadH\\(Math\\.round\\(el\\.offsetHeight \\+ seatDebtRef\\.current\\)\\)/, 'the debt never rode the measure');\n  assert.ok(!cv.includes('col.style.top'), \"the old same-stroke column write survived — the column's seat is still being moved by hand\");\n});",
                "ok('C4 — the column reads the header alone (the seat's sum retired with the seat)', () => {\n  // 1.8.6 — THE SILENT ASCENT: the header-plus-debt sum retired with the\n  // seat it summed — the column reads the header's own live height, and\n  // through a flow-road fold it rides the same tween the header speaks.\n  assertMatch(cv, /setHeadH\\(Math\\.round\\(el\\.offsetHeight\\)\\)/, 'the column never read the header alone');\n  assert.ok(!cv.includes('col.style.top'), \"the old same-stroke column write survived — the column's seat is still being moved by hand\");\n});",
            ),
            (
                "ok('D3 — the is-snap law stands as its own tombstone', () => {\n  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.6/, 'the tombstone never spoke');",
                "ok('D3 — the is-snap law stands as its own tombstone', () => {\n  assertMatch(css, /1\\.8\\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\\.8\\.5/, 'the tombstone never spoke');",
            ),
            (
                "ok('D4 — the seat JSX speaks the payer (the tombstone and the node both keep their seats)', () => {\n  assertMatch(cv, /ref=\\{rowsSeatRef\\} className=\"gd-rows-seat\"/, 'the seat element never mounted below the header');\n  const seatLaw = /\\.gd-rows-seat \\{[^}]*\\}/.exec(cssLaws)?.[0] || '';\n  assert.ok(seatLaw.length > 0, 'the seat law never spoke in css');\n  assertMatch(seatLaw, /height: 0;/, 'the seat never rests at zero');\n  assertMatch(css, /1\\.8\\.6 — THE PAYER WRITES IT/, 'the seat note never told the payer');\n});",
                "ok('D4 — the seat JSX tells its retirement (the tombstone keeps its CSS seat)', () => {\n  // 1.8.6 — THE SILENT ASCENT: the seat element left the tree with the\n  // debt it held; the JSX tombstone + the CSS law keep its seat as the\n  // law it used to be (the is-snap precedent).\n  assertMatch(cv, /THE SEAT LEFT WITH THE RESTORES IT SERVED/, \"the seat's retirement never spoke\");\n  assert.ok(!cv.includes('ref={rowsSeatRef}'), 'the seat element survived its retirement');\n  const seatLaw = /\\.gd-rows-seat \\{[^}]*\\}/.exec(cssLaws)?.[0] || '';\n  assert.ok(seatLaw.length > 0, 'the seat law never spoke in css');\n  assertMatch(seatLaw, /height: 0;/, 'the seat never rests at zero');\n});",
            ),
            (
                "  assertMatch(pe, /1\\.8\\.6 — THE PRESS-TIME ORIGINS/, 'the press-time note never spoke');\n  assertMatch(pe, /1\\.8\\.6 — THE ORIGINS ARE MEASURED IN THE PRESS BREATH/, 'the movePart note never spoke');",
                "  assertMatch(pe, /1\\.8\\.5 — THE PRESS-TIME ORIGINS/, 'the press-time note never spoke');\n  assertMatch(pe, /1\\.8\\.5 — THE ORIGINS ARE MEASURED IN THE PRESS BREATH/, 'the movePart note never spoke');",
            ),
            (
                "ok('F2 — the tie that was still speaks (the deep hover keeps its seat, outranked now)', () => {\n  assertMatch(css, /1\\.8\\.6 — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER/, 'the 1.8.5 outline note never spoke');\n  const deepHover = /\\.gd-part-row\\.is-colored\\.is-shade-deep:hover \\{[^}]*\\}/.exec(cssLaws)?.[0] || '';\n  assert.ok(deepHover.length > 0, 'the deep hover law never spoke (the tie the family had to out-rank)');\n  assertMatch(deepHover, /border-color: var\\(--part-color, var\\(--gd-accent\\)\\);/, 'the deep hover lost its own word');\n});",
                "ok('F2 — the tie that was still speaks (the deep hover keeps its seat, answering the hand now)', () => {\n  // 1.8.6 — THE OUTLINE ANSWERS THE HAND: the deep hover keeps its seat\n  // but changed its word — the raw color (the face itself at 1:1, the\n  // outline gone) became the ink-rung gather, so the unselected outline\n  // reads and REACTS under the pointer exactly as the report asks.\n  assertMatch(css, /1\\.8\\.5 — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER/, 'the 1.8.5 outline note never spoke');\n  assertMatch(css, /1\\.8\\.6 — THE OUTLINE ANSWERS THE HAND/, 'the 1.8.6 outline note never spoke');\n  const deepHover = /\\.gd-part-row\\.is-colored\\.is-shade-deep:hover \\{[^}]*\\}/.exec(cssLaws)?.[0] || '';\n  assert.ok(deepHover.length > 0, 'the deep hover law never spoke (the tie the family had to out-rank)');\n  assertMatch(deepHover, /border-color: color-mix\\(in srgb, var\\(--part-color, var\\(--gd-accent\\)\\) 50%, var\\(--part-ink, var\\(--gd-ink\\)\\)\\);/, 'the deep hover never gathered toward the ink rung');\n  assertMatch(deepHover, /box-shadow: 2\\.5px 2\\.5px 0 color-mix\\(in srgb, var\\(--part-color, var\\(--gd-accent\\)\\) 62%, #0e0e0e\\);/, 'the deep hover never firmed its shadow');\n});",
            ),
        ],
    )

    print("\n1.8.6 law pins moved.")


if __name__ == "__main__":
    main()
