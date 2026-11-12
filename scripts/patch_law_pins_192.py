#!/usr/bin/env python3
"""1.9.1 law-pins patch — the suites whose LAWS themselves moved this
release (version_sweep_192.py already moved the digits; this pass re-words
the seats whose truth changed with the paper house):

  · suite 190 (the 1.8.9 laws, extended through 1.9.0): the live main.js
    seats it pinned — the single writer, the priming door, the factory
    reset's memory, the boot verdict's words, the notice's whole storage
    story, and the README's storage feature — all speak the document house
    now. The 1.8.9-era pins retire with their seats; the LAWS stay, told
    in the new tongue, with the 1.9.1 note saying why.
  · suite 187 (the wheels that outlive the freeze): the viewer's two roads
    into fullLoaded now hand their element to revealImgWhenPainted (the
    1.9.1 reveal law) — the pins follow the roads.
  · the CI parse gate carries the document house's own module
    (nosql_engine.js rides beside the engine trio).

Run AFTER version_sweep_192.py, from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    assert old in raw, f"{path}: missing seat:\n{old[:160]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


# --- suite 190 — the live seats speak the document house -------------------

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """ok('A5 — the single writer speaks SQLite first (build -> export -> .tmp -> rename)', () => {
  assertMatch(mainSrc, /const persistSqliteArchive = \\(sections, meta\\) => \\{/, 'the atomic writer never spoke');
  assertMatch(mainSrc, /rotateSqliteBackup\\(\\);\\s*\\n\\s*persistSqliteArchive\\(db \\|\\| \\{\\}, \\{/, 'the save never shelved then persisted');
  assertMatch(mainSrc, /legacyImported: sqliteState\\.legacyImported \\? '1' : '0',/, 'the save never re-stamped the memory');
  assertMatch(mainSrc, /const rotateSqliteBackup = \\(\\) => \\{/, 'the house rotator never spoke');
  assertMatch(mainSrc, /gendex_db-\\$\\{stamp\\.getFullYear\\(\\)\\}\\$\\{pad\\(stamp\\.getMonth\\(\\) \\+ 1\\)\\}\\$\\{pad\\(stamp\\.getDate\\(\\)\\)\\}-\\$\\{pad\\(stamp\\.getHours\\(\\)\\)\\}\\$\\{pad\\(stamp\\.getMinutes\\(\\)\\)\\}\\$\\{pad\\(stamp\\.getSeconds\\(\\)\\)\\}\\.sqlite/, 'the shelf name law changed');
});""",
    """ok('A5 — the single writer speaks the JOURNAL (diff -> append -> compact)', () => {
  // 1.9.1 — THE PAPER HOUSE: the SQLite writer retired with its seat — the
  // save law is the journal's own now (append only what changed, compact
  // when the history outgrows the truth, re-stamp the memories).
  assertMatch(mainSrc, /const rotateNosqlBackup = \\(\\) => \\{/, 'the house rotator never spoke');
  assertMatch(mainSrc, /appendNosqlOps\\(DB_IO, NOSQL_FILE, ops\\);/, 'the save never appended its diff');
  assertMatch(mainSrc, /legacyImported: nosqlState\\.legacyImported \\? '1' : '0',/, 'the save never re-stamped the memory');
  assertMatch(mainSrc, /shouldCompactNosql\\(nosqlState\\.lineCount, liveDocs\\)/, 'the compaction threshold never spoke');
  assertMatch(mainSrc, /gendex_db-\\$\\{stamp\\.getFullYear\\(\\)\\}\\$\\{pad\\(stamp\\.getMonth\\(\\) \\+ 1\\)\\}\\$\\{pad\\(stamp\\.getDate\\(\\)\\)\\}-\\$\\{pad\\(stamp\\.getHours\\(\\)\\)\\}\\$\\{pad\\(stamp\\.getMinutes\\(\\)\\)\\}\\$\\{pad\\(stamp\\.getSeconds\\(\\)\\)\\}\\.nosql/, 'the shelf name law changed');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """ok('A6 — the boot primes the house BEFORE the window is born', () => {
  assertMatch(mainSrc, /const primeSqliteArchive = async \\(\\) => \\{/, 'the priming door never spoke');
  assertMatch(mainSrc, /await primeSqliteArchive\\(\\);\\s*\\n\\s*registerIpc\\(\\);/, 'the boot never awaited its own house');
  assertMatch(mainSrc, /peekSettingsBgOf\\(sqliteState\\.ready \\? sqliteState\\.peekSettings : null\\)/, 'the theme peek never asked the house first');
});""",
    """ok('A6 — the boot primes the house BEFORE the window is born', () => {
  // 1.9.1 — THE PAPER HOUSE: the prime speaks the document house now (the
  // sqlite prime retired with its seat; the law itself never moved).
  assertMatch(mainSrc, /const primeNosqlArchive = async \\(\\) => \\{/, 'the priming door never spoke');
  assertMatch(mainSrc, /await primeNosqlArchive\\(\\);\\s*\\n\\s*registerIpc\\(\\);/, 'the boot never awaited its own house');
  assertMatch(mainSrc, /peekSettingsBgOf\\(nosqlState\\.ready \\? nosqlState\\.peekSettings : null\\)/, 'the theme peek never asked the house first');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """ok('A7 — the factory reset kills the house AND its memory together', () => {
  assertMatch(mainSrc, /fs\\.rmSync\\(SQLITE_FILE, \\{ force: true \\}\\);/, 'the reset never wiped the house');
  assertMatch(mainSrc, /fs\\.rmSync\\(`\\$\\{SQLITE_FILE\\}\\.tmp`, \\{ force: true \\}\\);/, 'the reset never wiped the staged tmp');
  assertMatch(mainSrc, /sqliteState\\.legacyImported = false;\\s*\\n\\s*sqliteState\\.migration = null;\\s*\\n\\s*sqliteState\\.peekSettings = null;/, 'the memory never died with the file');
});""",
    """ok('A7 — the factory reset kills the house AND its memory together', () => {
  // 1.9.1 — the reset wipes the journal with the rest; the sqlite seats keep
  // their own removals (the snapshot dies only under the user's explicit
  // reset, its own law).
  assertMatch(mainSrc, /fs\\.rmSync\\(SQLITE_FILE, \\{ force: true \\}\\);/, 'the reset never wiped the old house');
  assertMatch(mainSrc, /fs\\.rmSync\\(NOSQL_FILE, \\{ force: true \\}\\);/, 'the reset never wiped the journal');
  assertMatch(mainSrc, /nosqlState\\.legacyImported = false;\\s*\\n\\s*nosqlState\\.sqlTranslated = false;\\s*\\n\\s*nosqlState\\.migration = null;\\s*\\n\\s*nosqlState\\.peekSettings = null;/, 'the memory never died with the file');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """  assertMatch(appSrc, /Library imported into the SQLite database/, 'the verdict words never landed');""",
    """  // 1.9.1 — the verdict speaks the translation's own story now.
  assertMatch(appSrc, /Library translated into the NoSQL document store/, 'the verdict words never landed');""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """// D. THE NOTICE TELLS THE NEW STORY (the terms move to 1.0.5)
// ---------------------------------------------------------------------------
console.log('\\nD. THE NOTICE TELLS THE NEW STORY (the storage report)');

ok('D1 — the terms moved to 1.0.5 (a meaningful change, the gate re-asks)', () => {
  assertMatch(legal, /export const TOS_VERSION = '1\\.0\\.5';/, 'the terms version never moved');
  assertMatch(legal, /1\\.8\\.9 — '1\\.0\\.4' -> '1\\.0\\.5' \\(the storage report/, 'the bump note never spoke');
});""",
    """// D. THE NOTICE TELLS THE NEW STORY (the terms move to 1.0.6)
// ---------------------------------------------------------------------------
console.log('\\nD. THE NOTICE TELLS THE NEW STORY (the storage report)');

ok('D1 — the terms moved to 1.0.6 (a meaningful change, the gate re-asks)', () => {
  assertMatch(legal, /export const TOS_VERSION = '1\\.0\\.6';/, 'the terms version never moved');
  assertMatch(legal, /1\\.9\\.1 — '1\\.0\\.5' -> '1\\.0\\.6' \\(the experiment's own word/, 'the bump note never spoke');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """ok('D2 — the SQLite library tells what it is', () => {
  assert.ok(legal.includes('gendex_db.sqlite: the whole library'), 'the house never spoke its name');
  assert.ok(legal.includes('stored as ONE SQLite database file'), 'the format word never spoke');
  assert.ok(legal.includes('the file is transactional (a save is either written whole or not at all)'), 'the transactional word never spoke');
  assert.ok(legal.includes('you can open and inspect it with any common SQLite tool'), 'the tool word never spoke');
});""",
    """ok('D2 — the document library tells what it is', () => {
  // 1.9.1 — THE PAPER HOUSE: the notice speaks the journal now.
  assert.ok(legal.includes('gendex_db.nosql: the whole library'), 'the house never spoke its name');
  assert.ok(legal.includes('append-only journal of JSON documents'), 'the format word never spoke');
  assert.ok(legal.includes('It is not a server and not a cloud'), 'the local word never spoke');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """ok('D3 — the one-time import is told whole (read once, added, remembered)', () => {
  assert.ok(legal.includes('releases before the SQLite library kept their data in a plain JSON file (gendex_db.json) in this same folder'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('reads that file once and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('the JSON file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your SQLite library'), 'the deletion word never spoke');
});""",
    """ok('D3 — the one-time imports are told whole (read once, added, remembered)', () => {
  // 1.9.1 — the whole chain speaks: JSON -> SQLite -> NoSQL.
  assert.ok(legal.includes('each upgrade reads the old seat exactly ONCE and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('Releases before 1.9.1 used a SQLite database file (gendex_db.sqlite)'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('the old file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your current library'), 'the deletion word never spoke');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """  assert.ok(legal.includes('(including any old JSON file an earlier version left there)'), 'the factory reset never flipped its file');""",
    """  assert.ok(legal.includes('(including any old SQLite or JSON file an earlier version left there)'), 'the factory reset never flipped its file');""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """  assertMatch(readme, /Local SQLite database/, 'the storage feature never spoke');""",
    """  // 1.9.1 — the storage feature speaks the document database now.
  assertMatch(readme, /Local NoSQL document database/, 'the storage feature never spoke');""",
)

# --- suite 187 — the viewer's roads hand the element to the reveal law ------

sub(
    "scripts/gendex_187_batch_dom.test.mjs",
    """  assertMatch(viewer, /onLoad=\\{\\(\\) => setFullLoaded\\(true\\)\\}/, 'the viewer never spoke its onLoad');
  assertMatch(viewer, /im && im\\.complete && im\\.naturalWidth\\) setFullLoaded\\(true\\);/, "the viewer's completion sweep never spoke");""",
    """  // 1.9.1 — THE REVEAL WAITS FOR THE PAINT: both roads hand the element to
  // revealImgWhenPainted (decode + two frames + the rails) — the load's own
  // word no longer retires the wheel before the raster paints.
  assertMatch(viewer, /onLoad=\\{\\(ev\\) => revealImgWhenPainted\\(ev\\.currentTarget, \\(\\) => setFullLoaded\\(true\\)\\)\\}/, 'the viewer never spoke its onLoad');
  assertMatch(viewer, /im && im\\.complete && im\\.naturalWidth\\) revealImgWhenPainted\\(im, \\(\\) => setFullLoaded\\(true\\)\\);/, "the viewer's completion sweep never spoke");""",
)

# --- the CI parse gate carries the document house's own module -------------

sub(
    ".github/workflows/ci.yml",
    "node scripts/parse_check.mjs src/App.jsx src/components/SettingsModal.jsx src/components/Dialogs.jsx src/components/NewCharacterModal.jsx src/components/Titlebar.jsx src/utils/sqlite_engine.js src/utils/sqlite_wasm.js src/utils/sqlite_glue.js",
    "node scripts/parse_check.mjs src/App.jsx src/components/SettingsModal.jsx src/components/Dialogs.jsx src/components/NewCharacterModal.jsx src/components/Titlebar.jsx src/utils/sqlite_engine.js src/utils/sqlite_wasm.js src/utils/sqlite_glue.js src/utils/nosql_engine.js",
)

print("law pins: the suites speak the paper house.")
