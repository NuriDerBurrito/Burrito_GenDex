#!/usr/bin/env python3
"""1.7.4 -> 1.7.5 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.7.5). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.7.5 entry is "The
Trim's Own Ink"), the boot fixtures' lastRun seeds, and the "version is
X everywhere" titles. Historical notes are LEFT ALONE.

Special 1.7.5 law pins (the laws this version legitimately superseded —
patched separately after this sweep runs):

  gendex_174 (the 1.7.3 laws the 1.7.5 reports retired):
    - the seam rail RETIRES (the over-trim mask is the plate alone; the
      clone speaks the trim's own bottom rails)

  gendex_173 (the 1.6.9 laws the 1.7.5 clocks superseded):
    - the tag state clears on its OWN 320ms clock (the wholesale class
      keeps its 190ms law) — the split-clocks ceremony

  the README battery count walks 58 -> 59 (the new gendex_176 suite)

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.7.4"
NEW = "1.7.5"
OLD_TAG = "The Trim's Own Shape"
NEW_TAG = "The Trim's Own Ink"  # (the apostrophe — the sweep carries the escaped form)


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    # the apostrophe breaks single-quoted pins — sweep the escaped form too
    line = line.replace(f"{OLD_TAG}".replace("'", "\\'"), NEW_TAG)
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

    if name in ("gendex_166_batch_dom.test.mjs", "gendex_167_batch_dom.test.mjs", "gendex_169_batch_dom.test.mjs"):
        # the website current-row includes-pin: preceded by ">", unreachable
        # by the generic line sweep (the 1.7.0/1.7.1/1.7.2 sweeps' own follow-up)
        out = move(
            'class="v">' + OLD + '</td>\'), \'the website current-row never moved\'',
            'class="v">' + NEW + '</td>\'), \'the website current-row never moved\'',
            out, name,
        )

    path.write_text(out, encoding="utf8")
    return True


def main() -> None:
    files = sorted(ROOT.glob("scripts/gendex_*.test.mjs"))
    files += sorted(ROOT.glob("scripts/gendex_*_dom.test.mjs"))
    seen: set[Path] = set()
    for p in files:
        if p in seen:
            continue
        seen.add(p)
        sweep_file(p)
    print(f"swept {len(seen)} suites: {OLD} -> {NEW} ('{NEW_TAG}')")


if __name__ == "__main__":
    main()
