#!/usr/bin/env python3
"""1.8.10 — the law-pin pass after the sweep (version_sweep_1810.py moved
every live 1.8.9 pin to 1.8.10; the families that need their own word):

1. THE OVER-SWEPT BIRTH NOTES — four pins watch prose whose version is the
   LAW'S OWN BIRTH, not the live tree: the engine's 1.8.9 house note
   (sqlite_engine.js), the legal bump note (1.8.9 — '1.0.4' -> '1.0.5'),
   the badge's cloth note (SettingsModal.jsx), and the worklog's 1.8.9
   entry — each keeps its birth digits forever, exactly the way the 1.8.4,
   1.8.8 and 1.8.9 passes taught. (One message-prose seat rides with them:
   176's "(1.8.9 retired the rung)".)

2. THE ENGINE'S OWN SEAT — 190's A2/A4 pins follow the live tree onto the
   vendored law: the import speaks ./sqlite_glue.js (never node_modules),
   the sql.js dependency is STRUCK (the pin inverts to the strike), the
   glue file itself takes its seat beside the fuel, and the compat-shim
   rule retires with its patient (the cure moved into the vendored source,
   so the config pins the retirement note and the rule's absence).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITES = ROOT / "scripts"


def sub(fname: str, old: str, new: str, count=None) -> None:
    p = SUITES / fname
    raw = p.read_text(encoding="utf8")
    n = raw.count(old)
    if n == 0:
        if new in raw:
            print(f"  {fname}: already seated")
            return
        raise AssertionError(f"{fname}: the pin never spoke:\n{old[:110]}")
    if count is not None:
        assert n == count, f"{fname}: expected {count} seats, found {n}"
    raw = raw.replace(old, new)
    p.write_text(raw, encoding="utf8")
    print(f"  {fname}: {n} pin(s) re-seated")


def main() -> None:
    print("the birth notes keep their birth digits:")

    # the engine's 1.8.9 house note (sqlite_engine.js header)
    sub(
        "gendex_190_batch_dom.test.mjs",
        r"/1\.8\.10 — THE LIBRARY'S OWN HOUSE \(the storage report",
        r"/1\.8\.9 — THE LIBRARY'S OWN HOUSE \(the storage report",
    )
    # the legal bump note (1.8.9 — '1.0.4' -> '1.0.5'), pinned by two suites
    sub(
        "gendex_189_batch_dom.test.mjs",
        r"/1\.8\.10 — '1\.0\.4' -> '1\.0\.5' \(the storage report",
        r"/1\.8\.9 — '1\.0\.4' -> '1\.0\.5' \(the storage report",
    )
    sub(
        "gendex_190_batch_dom.test.mjs",
        r"/1\.8\.10 — '1\.0\.4' -> '1\.0\.5' \(the storage report",
        r"/1\.8\.9 — '1\.0\.4' -> '1\.0\.5' \(the storage report",
    )
    # the badge's cloth note (SettingsModal.jsx)
    sub(
        "gendex_190_batch_dom.test.mjs",
        r"/1\.8\.10 — THE BADGE WEARS THE WALL'S OWN CLOTH/",
        r"/1\.8\.9 — THE BADGE WEARS THE WALL'S OWN CLOTH/",
    )
    # the worklog's 1.8.9 entry (the 1.8.10 entry is 191's own pin)
    sub(
        "gendex_190_batch_dom.test.mjs",
        r"/1\.8\.10 — The Library's Own House/",
        r"/1\.8\.9 — The Library's Own House/",
    )
    # 176's message prose (the rung retired at 1.8.9 — a birth word)
    sub(
        "gendex_176_batch_dom.test.mjs",
        "(1.8.10 retired the rung)",
        "(1.8.9 retired the rung)",
    )

    print("\nthe engine's own seat (190's A2/A4 follow the vendored law):")

    sub(
        "gendex_190_batch_dom.test.mjs",
        """ok('A2 — the engine is real SQLite (sql.js) with the wasm EMBEDDED in the tree', () => {
  assertMatch(engineSrc, /import initSqlJs from 'sql\\.js';/, 'the engine never took its dependency');""",
        """ok('A2 — the engine is real SQLite (sql.js, VENDORED since 1.8.10) with the wasm EMBEDDED in the tree', () => {
  // 1.8.10 — THE ENGINE'S OWN SEAT: the import speaks the vendored glue of
  // the app's own tree, never node_modules (the boot report: "Cannot find
  // module 'sql.js'" — the missing-module shim, thrown before a window).
  assertMatch(engineSrc, /import initSqlJs from '\\.\\/sqlite_glue\\.js';/, 'the engine never took its vendored seat');""",
    )
    sub(
        "gendex_190_batch_dom.test.mjs",
        """  assertMatch(pkg.dependencies['sql.js'] || '', /^\\^?1\\.13\\.0$/, 'the engine dependency is unpinned');
});""",
        """  assert.ok(!('sql.js' in pkg.dependencies), 'the engine dependency survived the strike (the boot depends on it again)');
  assert.ok(existsSync(path.join(root, '..', 'src', 'utils', 'sqlite_glue.js')), 'the vendored glue is missing from the tree');
});""",
    )
    sub(
        "gendex_190_batch_dom.test.mjs",
        """ok('A4 — THE PACKAGED-MAIN GUARD gains its engine twin (the compat shim rule)', () => {
  assertMatch(mainConfigSrc, /test: \\/node_modules.*sql-wa/, 'the shim rule never took its seat');
  assertMatch(mainConfigSrc, /sqljs_compat_loader\\.cjs/, 'the loader never spoke its path');
  assert.ok(existsSync(path.join(root, 'sqljs_compat_loader.cjs')), 'the loader file is missing');""",
        """ok('A4 — THE PACKAGED-MAIN GUARD\'s engine twin retires with its patient (the compat shim rule)', () => {
  // 1.8.10 — THE SQL.JS COMPAT SHIM RULE, RETIRED: the cure moved into the
  // vendored source (src/utils/sqlite_glue.js), so the rule and its loader
  // stood down — the loader file keeps its seat as the cure's own history.
  assertMatch(mainConfigSrc, /1\\.8\\.10 — THE SQL\\.JS COMPAT SHIM RULE, RETIRED/, 'the retirement note never spoke');
  assert.ok(!/test: \\/node_modules.*sql-wa/.test(mainConfigSrc), 'the shim rule still rides the config');
  assert.ok(!/sqljs_compat_loader\\.cjs/.test(mainConfigSrc), 'the config still speaks the retired loader');
  assert.ok(existsSync(path.join(root, 'sqljs_compat_loader.cjs')), 'the cure\'s own history lost its seat');""",
    )

    print("\nlaw pins re-seated for 1.8.10.")


if __name__ == "__main__":
    main()
