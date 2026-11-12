#!/usr/bin/env python3
"""1.7.2 -> 1.7.3 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.7.3). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.7.3 entry is "The
Honest Ring"), the boot fixtures' lastRun seeds, and the "version is
X everywhere" titles. Historical notes are LEFT ALONE.

Special 1.7.3 law pins (the laws this version legitimately superseded —
patched separately after this sweep runs):

  gendex_172 (the trim-effect stamp lift + the battery count):
    - the z-5 stamp lift RETIRES ("it forces the stamp to clip over the
      trim") — the band + confined stickers keep their resting z 2 under
      the ink work + the ring coat in every switch state
    - the README battery count walks 56 -> 57 (the new gendex_174 suite)

  gendex_173 (N1 / Q3 / Q5 — the 1.7.2 laws the 1.7.3 reports retired):
    - N1: the ring's mask layers REORDERED to the true paint order (the
      core is the LAST layer = the base; the full box's subtract lands
      on it; the rail + the plate union on top)
    - Q3: the depth ladder graduates (--part-title 8% + --part-well 24%
      around a named anchor)
    - Q5: the pulse's 2.2s ENTRY WINDOW retires (a fresh re-hover arms
      the moment the flight is done; the in-flight guard stays)

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.7.2"
NEW = "1.7.3"
OLD_TAG = "The Trim's Own Ring"
NEW_TAG = "The Honest Ring"  # (no apostrophe — the pins ride clean)


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
