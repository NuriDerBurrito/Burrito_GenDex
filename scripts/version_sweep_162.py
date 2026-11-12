#!/usr/bin/env python3
"""1.6.0 -> 1.6.2 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.6.2). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.6.2 entry is "The Gold
Answers the Ink"), the "version is X everywhere" titles, and the boot
harnesses' lastRun seeds (a stale lastRun mounts the update window and
breaks the parked-seat live passes — 163's C1-C4 cascade). Historical
notes are LEFT ALONE.

Special 1.6.2 law pins (the laws this version legitimately superseded):

  gendex_166 (the 1.6.0 battery):
    - B1's swap-law pins: the flight no longer rides the ROOT SCROLLER —
      it speaks on the CONTENT seats (CSS descendant selectors) and the
      arm retires on its own short CLOCK (the root's animationend handler
      left with the root's animation); the settle DESCENDS (-10px, never
      +10px: an upward edge can never grow a scrollbar); the reduced-
      motion guards speak the seat dialect.
    - P1's README battery count: 50 -> 51 (the 167 battery arrives).
    - P1's furniture pins move to 1.6.2 wholesale.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.6.0"
NEW = "1.6.2"
OLD_TAG = "The Thunder Leaves the Gold"
NEW_TAG = "The Gold Answers the Ink"


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

    if name == "gendex_166_batch_dom.test.mjs":
        # B1 — the swap law found its seats (1.6.2): retire clock, seat
        # selectors, the descending settle, the seat-dialect reduced-motion.
        out = move(
            "  // the flight retires its own class when it lands\n"
            "  assert.match(cvSrc, /e\\.animationName === 'gd-cv-swap'/, 'the swap flight never retires its class');",
            "  // 1.6.2 — the arm retires on its own clock (the flight speaks on\n"
            "  // descendant seats now; the root's animationend handler left with\n"
            "  // the root's own animation)\n"
            "  assert.match(cvSrc, /swapCleanTimerRef\\.current = setTimeout\\(/, 'the swap arm never retires on its own clock');",
            out, name,
        )
        out = move(
            "  const block = cssSrc.match(/\\.gd-cv-swap \\{[\\s\\S]*?\\n\\}/)?.[0] || '';\n"
            "  assert.ok(block.includes('animation: gd-cv-swap 0.15s ease-out'), 'the swap clock is missing');",
            "  // 1.6.2 — the flight speaks on the CONTENT seats, never the scroller\n"
            "  assert.ok(/\\.gd-cv-swap > \\*:not\\(\\.gd-char-head\\)/.test(cssSrc), 'the scroller children never found their seat');\n"
            "  assert.ok(/\\.gd-cv-swap \\.gd-char-head > \\*:not\\(\\.gd-rows-tray\\)/.test(cssSrc), 'the header children never found their seat');\n"
            "  assert.ok(/\\.gd-cv-swap \\.gd-rows-body > \\*/.test(cssSrc), 'the tray content never found its seat');\n"
            "  assert.ok(/animation: gd-cv-swap 0\\.15s ease-out;/.test(cssSrc), 'the swap clock is missing');",
            out, name,
        )
        out = move(
            "  assert.ok(kf.includes('translateY(10px)') && kf.includes('opacity: 0'), 'the swap flight lost the arrival breath (fade + 10px settle)');",
            "  assert.ok(kf.includes('translateY(-10px)') && kf.includes('opacity: 0'), 'the swap flight lost the arrival breath (1.6.2: the settle DESCENDS — an upward edge can never grow a scrollbar)');",
            out, name,
        )
        out = move(
            "  assert.ok(/\\.gd-reduced-motion \\.gd-cv-swap \\{\\s*animation: none;/.test(cssSrc), 'the reduced-motion seat still moves');",
            "  assert.ok(/\\.gd-reduced-motion \\.gd-cv-swap > \\*/.test(cssSrc) && /@media \\(prefers-reduced-motion: reduce\\) \\{[\\s\\S]*?\\.gd-cv-swap > \\*/.test(cssSrc), 'the reduced-motion seats still move (1.6.2: the seat dialect)');",
            out, name,
        )
        # P1 — the battery count grew with the 167 suite.
        out = move(
            "assert.match(readmeSrc, /the regression battery \\(50 DOM\\/source test suites\\)/, 'the README battery count never moved');",
            "assert.match(readmeSrc, /the regression battery \\(51 DOM\\/source test suites\\)/, 'the README battery count never moved (1.6.2: the 167 battery)');",
            out, name,
        )

    if out != raw:
        path.write_text(out, encoding="utf8")
        return True
    return False


def main():
    print(f"sweeping {OLD} -> {NEW} ({OLD_TAG} -> {NEW_TAG})")
    for path in sorted(ROOT.glob("scripts/*.test.mjs")):
        if sweep_file(path):
            print(f"  swept {path.name}")
    for path in sorted(ROOT.glob("scripts/probe_159_drag.mjs")):
        if sweep_file(path):
            print(f"  swept {path.name}")
    # the README's own battery count: the 167 suite arrives
    readme = ROOT / "README.md"
    s = readme.read_text(encoding="utf8")
    if "the regression battery (50 DOM/source test suites)" in s:
        s = s.replace("the regression battery (50 DOM/source test suites)",
                      "the regression battery (51 DOM/source test suites)", 1)
        readme.write_text(s, encoding="utf8")
        print("  README battery count 50 -> 51")
    print("done")


if __name__ == "__main__":
    main()
