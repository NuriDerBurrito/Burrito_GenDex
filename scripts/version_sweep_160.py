#!/usr/bin/env python3
"""1.5.9 -> 1.6.0 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.6.0). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.6.0 entry is "The
Thunder Leaves the Gold"), the "version is X everywhere" titles, and the
boot harnesses' lastRun seeds (a stale lastRun mounts the update window
and breaks the parked-seat live passes). Historical notes are LEFT ALONE.

Special 1.6.0 law pins (the laws this version legitimately superseded):

  gendex_160 (the 1.5.4 arm + ghost pins):
    - setTimeout(() => setNewCardSeatArmed(true), 350) ->
      requestIdleCallback(arm, { timeout: 350 }) (the beat became a breathe)
    - Math.min(1, 118 / rect.width) -> Math.min(1, 118 / layW)
      (the ghost measures the card's LAYOUT box, never the jelly rect)

  gendex_164 (the 1.5.8 battery):
    - I1's arm-clock pin -> the idle-breathe law (same as 160's)
    - A1/P1's TOS '1.0.2' pins -> '1.0.3' (the visibility bump; P1's
      immediately-past fixture '1.0.1' -> '1.0.2')

  gendex_163 (the 1.5.7 battery):
    - A4/B2's TOS '1.0.2' pins -> '1.0.3'
    - the lastRun '1.5.9' seeds -> '1.6.0' (the generic sweep's own work,
      listed here because they are what broke C1-C4)

  gendex_165 (the 1.5.9 battery):
    - LIVE2's box loan: the card gains offsetWidth/offsetHeight mocks
      (the ghost reads the layout box now, not getBoundingClientRect)

  gendex_161 (the 1.5.5 compat battery):
    - the TOS_VERSION regex pin '1.0.2' -> '1.0.3'

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.5.9"
NEW = "1.6.0"
OLD_TAG = "The Field Pass, Swept Again"
NEW_TAG = "The Thunder Leaves the Gold"


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
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

    if name == "gendex_160_batch_dom.test.mjs":
        out = move(
            r"assert(/setTimeout\(\(\) => setNewCardSeatArmed\(true\), 350\)/.test(appSrc), 'the idle arm clock is missing (1.5.8: 900 -> 350ms)');",
            r"assert(/requestIdleCallback\(arm, \{ timeout: 350 \}\)/.test(appSrc), 'the idle arm breath is missing (1.6.0: the fixed beat became requestIdleCallback with a 350ms ceiling)');",
            out, name,
        )
        out = move(
            "assert(fn.includes('Math.min(1, 118 / rect.width)'), 'the miniature scale is missing');",
            "assert(fn.includes('Math.min(1, 118 / layW)'), 'the miniature scale is missing (1.6.0: the layout box, never the jelly rect)');",
            out, name,
        )

    if name == "gendex_164_batch_dom.test.mjs":
        out = move(
            r"assert(/setTimeout\(\(\) => setNewCardSeatArmed\(true\), 350\);/.test(appSrc), 'the arm beat never shortened');",
            r"assert(/requestIdleCallback\(arm, \{ timeout: 350 \}\)/.test(appSrc), 'the arm breath never arrived (1.6.0: the idle call)');",
            out, name,
        )
        out = move(
            "ok('I1 — the retained seat arms at 350ms; the settle re-arm is a layout effect', () => {",
            "ok('I1 — the retained seat arms on the idle breath; the settle re-arm is a layout effect', () => {",
            out, name,
        )
        out = move(
            r"assert(/export const TOS_VERSION = '1\.0\.2';/.test(legalConstSrc), 'the terms version never moved to 1.0.2');",
            r"assert(/export const TOS_VERSION = '1\.0\.3';/.test(legalConstSrc), 'the terms version never moved to 1.0.3');",
            out, name,
        )
        out = move(
            "ok('A1 — the terms moved to 1.0.2 and the texts lost their em dashes', () => {",
            "ok('A1 — the terms moved to 1.0.3 and the texts lost their em dashes', () => {",
            out, name,
        )
        out = move(
            "ok('P1 — 1.0.2 re-asks every 1.0.1 library; the texts carry no em dash', () => {",
            "ok('P1 — 1.0.3 re-asks every 1.0.2 library; the texts carry no em dash', () => {",
            out, name,
        )
        out = move("assert.equal(TOS_VERSION, '1.0.2');", "assert.equal(TOS_VERSION, '1.0.3');", out, name)
        out = move(
            "const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.1', at: 12345 } } });",
            "const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });",
            out, name,
        )
        out = move(
            "assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.1 record must not count as current');",
            "assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');",
            out, name,
        )

    if name == "gendex_163_batch_dom.test.mjs":
        out = move(
            r"assert(/export const TOS_VERSION = '1\.0\.2';/.test(legalConstSrc), 'the terms version never moved to 1.0.2');",
            r"assert(/export const TOS_VERSION = '1\.0\.3';/.test(legalConstSrc), 'the terms version never moved to 1.0.3');",
            out, name,
        )
        out = move("assert.equal(TOS_VERSION, '1.0.2');", "assert.equal(TOS_VERSION, '1.0.3');", out, name)

    if name == "gendex_161_compat_legal.test.mjs":
        out = move(
            r"assert(/export const TOS_VERSION = '1\.0\.2';/.test(legalSrc), 'TOS_VERSION is missing or moved');",
            r"assert(/export const TOS_VERSION = '1\.0\.3';/.test(legalSrc), 'TOS_VERSION is missing or moved');",
            out, name,
        )

    if name == "gendex_165_batch_dom.test.mjs":
        out = move(
            """    Object.defineProperty(card, 'getBoundingClientRect', {
      value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }),
    });""",
            """    Object.defineProperty(card, 'getBoundingClientRect', {
      value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }),
    });
    // 1.6.0 — the ghost reads the card's LAYOUT box (transform-blind), so the
    // loan extends to the offset seats jsdom never measures.
    Object.defineProperty(card, 'offsetWidth', { value: 236 });
    Object.defineProperty(card, 'offsetHeight', { value: 340 });""",
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
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (+ the 1.6.0 law pins in 160/161/163/164/165)")
