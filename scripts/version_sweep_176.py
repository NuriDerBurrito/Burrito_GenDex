#!/usr/bin/env python3
"""1.7.5 -> 1.7.6 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.7.6). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.7.6 entry is "The
Ink That Stays"), the boot fixtures' lastRun seeds, and the "version is
X everywhere" titles. Historical notes are LEFT ALONE.

Special 1.7.6 law pins (the laws this version legitimately superseded —
patched separately after this sweep runs):

  gendex_176 (the 1.7.5 laws the 1.7.6 reports retired):
    - the spine is the LIGHTEST ELEMENT (the 1.6:1 anchor-walk and its
      82%/92% fallbacks retire with the luminance climb)
    - the ghost carries the WHOLE old row; .is-kept retires with the
      solid-through-both-beats law; the tagflight class arms in the
      picker mode alone; the pour arms only on membership moves
    - the notes-title drops to the WELL rung (away from the band)
    - the empty marks climb to z 3 and WEAR THE PLATE

  gendex_175 (the 1.7.5 seats the 1.7.6 laws moved):
    - the ghost-set filter (lost-only -> the whole old row)
    - the tagflight arm (unconditional -> picker mode alone)

  gendex_174 (the 1.7.4 fallback pins the lightest-spine law rewrote):
    - the 8146/8170/8258 spine fallback color-mix strings

  the README battery count walks 59 -> 60 (the new gendex_177 suite)

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.7.5"
NEW = "1.7.6"
OLD_TAG = "The Trim's Own Ink"  # (the apostrophe — the old pins carry escaped forms)
NEW_TAG = "The Ink That Stays"


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
