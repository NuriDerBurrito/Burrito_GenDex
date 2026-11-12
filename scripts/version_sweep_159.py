#!/usr/bin/env python3
"""1.5.8 -> 1.5.9 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.5.9). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.5.9 entry is "The Field
Pass, Swept Again"), and the "version is X everywhere" titles.
Historical notes are LEFT ALONE.

Special 1.5.9 law pins (the laws this version legitimately superseded):

  gendex_159 (the 1.4.9-entrance pin):
    - the Modal entrance { opacity: 0, y: 10 } -> { opacity: 0, scale: 0.965 }
      (the pop-in: the rise read as a swipe-up on tall windows)

  gendex_160 (the 1.5.4 ghost + 1.5.8 toast pins):
    - setDragImage(ghost, miniW/2, miniH/2) -> setDragImage(canvas, 0, 0)
      (the owned flight: the transparent 1x1 canvas suppression)
    - the toast face color-mix(accent-2 26%, bg) -> var(--gd-accent-2, ...)
      (the pill speaks the secondary's OWN VALUE now)

  gendex_163 (the 1.5.7 finishes switch, restated):
    - .gd-finishes-still's animation-play-state: paused -> display: none
      (the coats leave the stage entirely while the switch is off)

  gendex_161 (the About CSS presence list):
    - .gd-about-credit-role -> .gd-about-credit-badge (the chip became the
      row's own right-space key)

  gendex_164 (the 1.5.8 battery whose laws 1.5.9 superseded):
    - the L1 ghost block -> the owned-flight laws (canvas + .gd-drag-ghost +
      the window listeners + the dispose ref)
    - the H2 gates count 3 -> 4 (the App-level EDIT CARD window rides the
      gate too; optional-chaining tolerant)
    - LIVE2's credit celebration -> the key/badge split (the key redirects,
      the badge fires the confetti)

gendex_162's stub getVersion is swept like any live pin; its 1.5.5-stamped
seeded archive is the deliberate past-version fixture and stays. Run from
the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.5.8"
NEW = "1.5.9"
OLD_TAG = "The Field Pass of Small Comforts"
NEW_TAG = "The Field Pass, Swept Again"


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    # the ok() labels (159/160 carry the born title from the 154 sweep)
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /*])", NEW, line)
        line = line.replace(f"**v{OLD}**", f"**v{NEW}**")
    return line


def move(old: str, new: str, text: str, where: str) -> str:
    if old in text:
        return text.replace(old, new)
    print(f"  !! pin not found in {where}: {old[:70]!r}")
    return text


def sweep_file(path: Path) -> bool:
    try:
        raw = path.read_text(encoding="utf8")
    except Exception:
        return False
    out = "\n".join(sweep_line(l) for l in raw.split("\n"))
    name = path.name

    if name == "gendex_159_batch_dom.test.mjs":
        out = move(
            r"initial=\{flight \|\| parked \? undefined : \{ opacity: 0, y: 10 \}\}",
            r"initial=\{flight \|\| parked \? undefined : \{ opacity: 0, scale: 0.965 \}\}",
            out, name,
        )
        out = move("'the fade + rise never arrived'", "'the pop-in pulse never arrived'", out, name)

    if name == "gendex_160_batch_dom.test.mjs":
        out = move(
            r"setDragImage\(ghost, Math\.round\(miniW \/ 2\), Math\.round\(miniH \/ 2\)\)",
            r"setDragImage\(canvas, 0, 0\)",
            out, name,
        )
        out = move("'the ghost is not centered on the cursor'", "'the native drag image is not canvas-suppressed (1.5.9)'", out, name)
        out = move(
            r"background: color-mix\(in srgb, var\(--gd-accent-2\) 26%, var\(--gd-bg\)\);",
            r"background: var\(--gd-accent-2, var\(--gd-accent\)\);",
            out, name,
        )
        out = move("'the secondary face is missing (1.5.9)'", "'the secondary VALUE face is missing (1.5.9)'", out, name)

    if name == "gendex_163_batch_dom.test.mjs":
        out = move(
            r"html\.gd-finishes-still \.gd-card-face-finish,[\s\S]*?animation-play-state: paused !important;",
            r"html\.gd-finishes-still \.gd-card-face-finish,[\s\S]*?display: none !important;",
            out, name,
        )
        out = move("'the still law lost family seats'", "'the retirement law lost family seats'", out, name)

    if name == "gendex_161_compat_legal.test.mjs":
        out = move("'.gd-about-credit-role'", "'.gd-about-credit-badge'", out, name)

    if name == "gendex_164_batch_dom.test.mjs":
        # H2: the gates count grows to 4 (the App-level edit-card window)
        out = move(
            r"const gates = (appSrc.match(/finishesHidden=\{db\.settings\.livingFinishes === false\}/g) || []).length;",
            r"const gates = (appSrc.match(/finishesHidden=\{db\??\.settings\??\.livingFinishes === false\}/g) || []).length;",
            out, name,
        )
        out = move(
            "assert.equal(gates, 3, 'App passes the gate at ' + gates + ' seats (needs 3: panel view, full view, creation seat)');",
            "assert.equal(gates, 4, 'App passes the gate at ' + gates + ' seats (needs 4: panel view, full view, creation seat, the App-level edit-card window)');",
            out, name,
        )
        out = move(
            "assert(/finishesHidden=\\{finishesHidden\\}/.test(cvSrc), 'the edit window never passes the gate');",
            "assert(/finishesHidden=\\{finishesHidden\\}/.test(cvSrc), 'the edit window never passes the gate');\n  assert(/export function CardLookModal\\(\\{[^}]*finishesHidden = false,/.test(cvSrc), 'the App-level edit-card window lost the gate in its own signature (the 1.5.9 crash)');",
            out, name,
        )
        # L1: the ghost block -> the owned flight
        old_l1 = """ok('L1 — the drag ghost is an exact miniature, offscreen, attached long enough', () => {
  assert(/'left: -10000px',/.test(gridSrc), 'the ghost still sits at the viewport edge');
  assert(!/'z-index: -1',/.test(gridSrc), 'the negative-z wager survived');
  assert(/'width: ' \\+ miniW \\+ 'px',/.test(gridSrc), 'the ghost box is not the exact miniature');
  assert(/setDragImage\\(ghost, Math\\.round\\(miniW \\/ 2\\), Math\\.round\\(miniH \\/ 2\\)\\)/.test(gridSrc), 'the anchor left the bitmap center');
  assert(/\\}, 150\\);/.test(gridSrc), 'the ghost still detaches on the next tick');
});"""
        new_l1 = """ok('L1 — the owned flight: canvas suppression + the live miniature under the cursor (1.5.9)', () => {
  assert(/setDragImage\\(canvas, 0, 0\\)/.test(gridSrc), 'the native drag image is not canvas-suppressed');
  assert(/gd-drag-ghost/.test(gridSrc), 'the owned ghost class is missing');
  assert(/window\\.addEventListener\\('drag', onFlight, true\\);/.test(gridSrc), 'the drag listener never armed');
  assert(/window\\.addEventListener\\('dragover', onFlight, true\\);/.test(gridSrc), 'the dragover listener never armed');
  assert(/dragGhostDisposeRef/.test(gridSrc), 'the dispose ref is missing (the drop clears dragRef first)');
  assert(!/'left: -10000px',/.test(gridSrc), 'the offscreen snapshot wager survived');
  assert(!/setDragImage\\(ghost,/.test(gridSrc), 'the element-snapshot road survived');
});"""
        out = move(old_l1, new_l1, out, name)
        # LIVE2: the key redirects, the badge fires the confetti
        old_live2 = """    const credit = [...settings.querySelectorAll('.gd-about-credit')][0];
    assert.ok(credit, 'the SPECIAL THANKS key is missing');
    assert.match(credit.textContent || '', /BETA TESTER/, 'the role chip is missing');
    assert.ok(document.querySelectorAll('.gd-confetti-piece').length === 0, 'confetti pieces lingered from a prior pass');
    credit.click();
    await sleep(120);
    const pieces = document.querySelectorAll('.gd-confetti-piece');
    assert.ok(pieces.length >= 24, 'the confetti burst never fired (got ' + pieces.length + ' pieces)');
    assert.ok(externals.includes('https://github.com/Ktiseos-Nyx/'), 'the Ktiseos Nyx home never opened (got ' + JSON.stringify(externals) + ')');
    await sleep(1900);
    assert.ok(document.querySelectorAll('.gd-confetti-piece').length === 0, 'the confetti never cleaned up after itself');"""
        new_live2 = """    const credit = [...settings.querySelectorAll('.gd-about-credit')][0];
    assert.ok(credit, 'the SPECIAL THANKS key is missing');
    assert.ok(!/BETA TESTER/.test(credit.textContent || ''), 'the badge must not ride the key itself (1.5.9)');
    const badge = [...settings.querySelectorAll('.gd-about-credit-badge')][0];
    assert.ok(badge, 'the BETA TESTER badge is missing from the row (1.5.9)');
    assert.match(badge.textContent || '', /BETA TESTER/, 'the badge lost its label');
    assert.ok(document.querySelectorAll('.gd-confetti-piece').length === 0, 'confetti pieces lingered from a prior pass');
    badge.click();
    await sleep(120);
    const pieces = document.querySelectorAll('.gd-confetti-piece');
    assert.ok(pieces.length >= 24, 'the badge never fired its burst (got ' + pieces.length + ' pieces)');
    assert.ok(externals.length === 0, 'the badge must celebrate only, never redirect (got ' + JSON.stringify(externals) + ')');
    credit.click();
    await sleep(120);
    assert.ok(externals.includes('https://github.com/Ktiseos-Nyx/'), 'the Ktiseos Nyx home never opened (got ' + JSON.stringify(externals) + ')');
    await sleep(1900);
    assert.ok(document.querySelectorAll('.gd-confetti-piece').length === 0, 'the confetti never cleaned up after itself');"""
        out = move(old_live2, new_live2, out, name)
        out = move(
            "await okAsync('LIVE2 — SPECIAL THANKS fires confetti and opens the Ktiseos Nyx home', async () => {",
            "await okAsync('LIVE2 — the badge celebrates, the key redirects (the 1.5.9 split)', async () => {",
            out, name,
        )

    if out != raw:
        path.write_text(out, encoding="utf8")
        return True
    return False


moved = 0
for f in sorted(ROOT.glob("scripts/gendex_*.test.mjs")):
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
for f in sorted(ROOT.glob("scripts/*.mjs")):
    if f.name.startswith("gendex_") or f.name.startswith("version_sweep"):
        continue
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (+ the 1.5.9 law pins in 159/160/161/163/164)")
