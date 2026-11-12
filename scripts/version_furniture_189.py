#!/usr/bin/env python3
"""1.8.9 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_189.py). The compression@1.8.2 dependency
lesson holds: only the app's OWN version seats move.

1.8.9 is THE FIRST PUBLIC RELEASE: the README is rewritten whole (the
public face of the app, modeled on the GenStack readme's shape but speaking
GenDex's own story — no version-history paragraphs, no private material),
so this pass carries NO README paragraph surgery for the first time since
the readme grew its version roll: the new file is written directly (it
ships its own version badge and battery count), and only the app's own
seats move here.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    assert old in raw, f"{path}: missing seat:\n{old[:120]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


CHANGELOG_ENTRY = """## 1.8.9 — The Library's Own House

Two answers — the library finally lives in the SQLite database it was always said to keep, and the beta tester badge wears the wall's own cloth. The first public release: a public README, written whole.

- **The house is real now** ("i thought our db was working on sqlite ... and that upgrading to newer versions just adds what the json database had to sqlite and it doesnt use it anymore, if possible fix that so its the case, it should also be able to recognize if the data was imported before or not so it doesnt reimport them everytime"): the archive is a real SQLite database file — gendex_db.sqlite, written and read by the official engine compiled to WebAssembly (sql.js, its wasm binary EMBEDDED inside the app bundle so nothing is ever looked up on disk at runtime), one transactional file with a magic header any SQLite tool can open. The whole save ceremony keeps its old law: the previous file shelves to gendex_backups/ first, the new one stages to .tmp and renames into place, and the stamps (appVersion / savedAt / schemaVersion) ride the database's own meta table. THE ONE-TIME DOOR is the heart of the report: while the flag inside the SQLite file says the legacy JSON archive was never folded in, and a gendex_db.json exists, the old salvage ladder reads it ONE last time (BOM-repaired, brace-sliced, tmp, backup shelf — the whole ladder, kept) and its data is ADDED into the house (arrays merge by id, objects fill only missing keys — the merge never replaces and never duplicates), the flag is stamped '1' INSIDE the file, and the JSON is never read again: not on the next boot, not ever, until the user deletes it. The flag lives in the file it guards, so the memory can never disagree with the data — and a factory reset kills both together, which is exactly the promise: recognized once, added once, remembered forever. The boot speaks the whole story once ('migrated', the door's own verdict), the corrupt laws kept their old tongues (a file that is not a database is set aside, never saved over, and a damaged house recovers through the legacy door or the backup shelf), and an engine that cannot wake falls back to the JSON writer, belt under braces, so no fresh default library can ever paint over an archive the house could not speak for. The webpack disease underneath it all is named and cured at the build seat: sql.js assigns `module = undefined` inside its init and leans on emcc's `typeof module` guard, which terser constant-folds away in the production bundle — one surgical loader (scripts/sqljs_compat_loader.cjs) retires the dead statement so every shipped build wakes its engine (the 162 packaging battery and the new 190 engine battery pin it from inside the real compiled artifact).
- **The beta tester badge wears the wall's own cloth** ("the 'beta tester' label next to duskfallcrew button in settings about section style is different from the others, fix that so its stylized too like them"): the badge keeps its own job (the dot, the celebration, the right-hand seat) but its frame is the link family's own now — the same border, panel fill, text color, radius, drop shadow and hover lift every other key on the About wall wears; only its layout and type metrics (the label voice: 9px / 800 / 0.12em) stay its own, so it reads as one of the wall's keys that happens to celebrate.
- **The first public release's own face**: the README is written whole as the public front page of the app (the features, the SQLite storage story and its one-time JSON import, the data seats on all three platforms, the update channel's honesty, getting started, updating, uninstalling, platform support, built-with, license, the Duskfallcrew beta-tester credit and the contact roads) — no version-history paragraphs, no private material (the signing recipe keeps living in RELEASE.md with placeholders only), and the terms move to 1.0.5 to tell the storage story as it now stands. The battery welcomes its newest suite (gendex_190) with the engine, the one-time door, the badge and the furniture pinned as laws.

## 1.8.8 — The Layout Census"""


def main() -> None:
    # the app's own version seats (the dependency ranges untouched)
    sub("package.json", '"version": "1.8.8",', '"version": "1.8.9",')
    lock = ROOT / "package-lock.json"
    raw = lock.read_text(encoding="utf8")
    assert raw.count('"version": "1.8.8"') == 2
    raw = raw.replace('"version": "1.8.8"', '"version": "1.8.9"', 2)
    lock.write_text(raw, encoding="utf8")
    print("  package-lock.json: seated (both app seats)")
    sub("src/constants/index.js", "version: '1.8.8',", "version: '1.8.9',")

    # the CHANGELOG: the new head entry (the README is written whole, not
    # surgically — it ships its own badge and battery count)
    sub("CHANGELOG.md", "## 1.8.8 — The Layout Census", CHANGELOG_ENTRY)

    print("\n1.8.9 furniture seated.")


if __name__ == "__main__":
    main()
