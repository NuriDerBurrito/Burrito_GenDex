#!/usr/bin/env python3
"""1.9.1 law-pins patch, part two — the seats the first pass didn't reach:

  · the TERMS-VERSION pins (1.0.5 -> 1.0.6) in suites 161 / 163 / 164 / 166 /
    189 — the pin follows the live seat, exactly as the 1.8.9 pass taught;
  · suite 189's B3/B4/B5 — the privacy story pins, re-worded for the paper
    house (same re-words suite 190's D-block already carries);
  · suites 190/191's LIVE boot tests (the compiled real entry, booted under
    a mocked electron): the legacy JSON fold-in lands in the DOCUMENT STORE
    now, the save law appends the journal (and shelves a .nosql copy), and
    the corrupt-recovery rung burns the journal, not the sqlite seat — the
    sqlite house is never built again (the snapshot's own promise).

Run AFTER version_sweep_192.py + patch_law_pins_192.py, from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    assert old in raw, f"{path}: missing seat:\n{old[:160]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


# --- the terms-version pins follow the live seat (1.0.5 -> 1.0.6) ----------

for suite in ("gendex_161_compat_legal.test.mjs", "gendex_163_batch_dom.test.mjs", "gendex_164_batch_dom.test.mjs", "gendex_166_batch_dom.test.mjs"):
    sub(
        f"scripts/{suite}",
        "  // 1.8.9 — the terms moved to 1.0.5 (the storage report); the pin follows the live seat.",
        "  // 1.9.1 — the terms moved to 1.0.6 (the paper house); the pin follows the live seat.",
    )

sub(
    "scripts/gendex_161_compat_legal.test.mjs",
    """  assert(/export const TOS_VERSION = '1\\.0\\.5';/.test(legalSrc), 'TOS_VERSION is missing or moved');""",
    """  assert(/export const TOS_VERSION = '1\\.0\\.6';/.test(legalSrc), 'TOS_VERSION is missing or moved');""",
)

for suite in ("gendex_163_batch_dom.test.mjs", "gendex_164_batch_dom.test.mjs"):
    sub(
        f"scripts/{suite}",
        """  assert(/export const TOS_VERSION = '1\\.0\\.5';/.test(legalConstSrc), 'the terms version never moved to 1.0.5');""",
        """  assert(/export const TOS_VERSION = '1\\.0\\.6';/.test(legalConstSrc), 'the terms version never moved to 1.0.6');""",
    )
    sub(
        f"scripts/{suite}",
        """  assert.equal(TOS_VERSION, '1.0.5'); // 1.8.9 — the storage report moved the seat""",
        """  assert.equal(TOS_VERSION, '1.0.6'); // 1.9.1 — the paper house moved the seat""",
    )

sub(
    "scripts/gendex_166_batch_dom.test.mjs",
    """  assert.match(legalSrc, /export const TOS_VERSION = '1\\.0\\.5';/, 'the terms version never moved to 1.0.5');""",
    """  assert.match(legalSrc, /export const TOS_VERSION = '1\\.0\\.6';/, 'the terms version never moved to 1.0.6');""",
)

sub(
    "scripts/gendex_166_batch_dom.test.mjs",
    """ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  // 1.8.9 — the terms moved to 1.0.5 (the storage report): the 1.0.4
  // record now re-asks too, and the resting seat belongs to 1.0.5.
  assert.equal(TOS_VERSION, '1.0.5');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const prior = createSafeDb({ settings: { tosAcceptance: { version: '1.0.4', at: 12345 } } });
  assert.notEqual(prior.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.4 record must not count as current either (the 1.8.9 bump)');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.5', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.5 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.5');
  assert.equal(PRIVACY_DOC.version, '1.0.5');
});""",
    """ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  // 1.9.1 — the terms moved to 1.0.6 (the paper house): the 1.0.4 AND 1.0.5
  // records re-ask too, and the resting seat belongs to 1.0.6.
  assert.equal(TOS_VERSION, '1.0.6');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const prior = createSafeDb({ settings: { tosAcceptance: { version: '1.0.4', at: 12345 } } });
  assert.notEqual(prior.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.4 record must not count as current either (the 1.8.9 bump)');
  const paper = createSafeDb({ settings: { tosAcceptance: { version: '1.0.5', at: 12345 } } });
  assert.notEqual(paper.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.5 record must not count as current either (the 1.9.1 bump)');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.6', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.6 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.6');
  assert.equal(PRIVACY_DOC.version, '1.0.6');
});""",
)

# --- suite 189 — the privacy story pins speak the paper house ---------------

sub(
    "scripts/gendex_189_batch_dom.test.mjs",
    """ok('B1 — the terms moved to 1.0.5 (a meaningful change, the gate re-asks)', () => {
  assertMatch(legal, /export const TOS_VERSION = '1\\.0\\.5';/, 'the terms version never moved');
  assertMatch(legal, /1\\.8\\.9 — '1\\.0\\.4' -> '1\\.0\\.5' \\(the storage report/, 'the bump note never spoke');
  assertMatch(legal, /A meaningful change: the version moves and every library meets/, 'the re-ask word never spoke');
});""",
    """ok('B1 — the terms moved to 1.0.6 (a meaningful change, the gate re-asks)', () => {
  // 1.9.1 — the paper house moved the seat again; the re-ask word keeps its law.
  assertMatch(legal, /export const TOS_VERSION = '1\\.0\\.6';/, 'the terms version never moved');
  assertMatch(legal, /A meaningful change: the version moves and every library meets/, 'the re-ask word never spoke');
});""",
)

sub(
    "scripts/gendex_189_batch_dom.test.mjs",
    """ok('B3 — the SQLite library tells what it is (one transactional database file)', () => {
  assert.ok(legal.includes('stored as ONE SQLite database file'), 'the SQLite word never spoke');
  assert.ok(legal.includes('the file is transactional (a save is either written whole or not at all)'), 'the transactional word never spoke');
  assert.ok(legal.includes('you can open and inspect it with any common SQLite tool'), 'the tool word never spoke');
});""",
    """ok('B3 — the document library tells what it is', () => {
  // 1.9.1 — THE PAPER HOUSE: the notice speaks the journal now.
  assert.ok(legal.includes('gendex_db.nosql: the whole library'), 'the house never spoke its name');
  assert.ok(legal.includes('append-only journal of JSON documents'), 'the format word never spoke');
  assert.ok(legal.includes('It is not a server and not a cloud'), 'the local word never spoke');
});""",
)

sub(
    "scripts/gendex_189_batch_dom.test.mjs",
    """ok('B4 — the one-time import is told whole (read once, added, remembered)', () => {
  assert.ok(legal.includes('releases before the SQLite library kept their data in a plain JSON file (gendex_db.json) in this same folder'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('reads that file once and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('the JSON file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your SQLite library'), 'the deletion word never spoke');
});""",
    """ok('B4 — the one-time imports are told whole (read once, added, remembered)', () => {
  // 1.9.1 — the whole chain speaks: JSON -> SQLite -> NoSQL.
  assert.ok(legal.includes('each upgrade reads the old seat exactly ONCE and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('Releases before 1.9.1 used a SQLite database file (gendex_db.sqlite)'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('the old file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your current library'), 'the deletion word never spoke');
});""",
)

sub(
    "scripts/gendex_189_batch_dom.test.mjs",
    """ok('B5 — the factory reset names the old file too', () => {
  assert.ok(legal.includes('(including any old JSON file an earlier version left there)'), 'the deletion note never named the JSON file');
});""",
    """ok('B5 — the factory reset names the old files too', () => {
  // 1.9.1 — the whole chain's seats speak.
  assert.ok(legal.includes('(including any old SQLite or JSON file an earlier version left there)'), 'the deletion note never named the old files');
});""",
)

# --- suite 190 — the LIVE boot tests speak the paper house ------------------

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """  const sqliteFile = path.join(userData, 'gendex_db.sqlite');
  assert.ok(existsSync(sqliteFile), 'the house was never built');
  const engine = await initSqliteEngine();
  const open = openSqliteFile({ fs: require_('node:fs'), join: path.join }, engine, sqliteFile);
  const read = readSqliteArchive(open.db);
  open.db.close();
  assert.equal(read.meta.legacyImported, '1', 'the flag never stamped inside the file');
  assert.equal(read.meta.appVersion, '1.8.8', 'meta lost the imported stamp');
});""",
    """  // 1.9.1 — THE PAPER HOUSE: the fold-in lands in the document store now
  // (the sqlite house is never built again — the JSON door writes the journal).
  const { readNosqlArchive } = await import('../src/utils/nosql_engine.js');
  const nosqlFile = path.join(userData, 'gendex_db.nosql');
  assert.ok(existsSync(nosqlFile), 'the house was never built');
  assert.ok(!existsSync(path.join(userData, 'gendex_db.sqlite')), 'a sqlite house was built on a json boot (never again)');
  const read = readNosqlArchive(io, nosqlFile);
  assert.equal(read.kind, 'ok', 'the journal refused to open');
  assert.equal(read.meta.legacyImported, '1', 'the flag never stamped inside the store');
  assert.equal(read.meta.appVersion, '1.8.8', 'meta lost the imported stamp');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """  assert.equal(readFileSync(jsonPath, 'utf8'), seeded, 'a save wrote the legacy json (it must never write it)');
  const engine = await initSqliteEngine();
  const open = openSqliteFile({ fs: require_('node:fs'), join: path.join }, engine, path.join(userData, 'gendex_db.sqlite'));
  const read = readSqliteArchive(open.db);
  open.db.close();
  assert.equal(read.sections.characters.length, 2, 'the save never reached the house');
  assert.equal(read.meta.legacyImported, '1', 'the save lost the memory');
  assert.equal(read.meta.appVersion, '1.9.1', 'the save never stamped its own version');
  // the shelf: one rotated .sqlite copy, the json backups untouched
  const backupDir = path.join(userData, 'gendex_backups');
  assert.ok(existsSync(backupDir), 'the shelf never grew');
  const shelf = readdirSync(backupDir).filter((n) => /^gendex_db-\\d{8}-\\d{6}\\.sqlite$/.test(n));
  assert.equal(shelf.length, 1, 'the rotated copy never shelved');
});""",
    """  assert.equal(readFileSync(jsonPath, 'utf8'), seeded, 'a save wrote the legacy json (it must never write it)');
  // 1.9.1 — THE PAPER HOUSE: the save APPENDS the journal now — the changed
  // sections ride as documents, the stamp rides meta, and the shelf grew a
  // rotated .nosql copy.
  const { readNosqlArchive } = await import('../src/utils/nosql_engine.js');
  const read = readNosqlArchive(io, path.join(userData, 'gendex_db.nosql'));
  assert.equal(read.kind, 'ok', 'the journal refused to open');
  assert.equal(read.sections.characters.length, 2, 'the save never reached the house');
  assert.equal(read.sections.settings.theme, 'zine', 'a whole section never rode');
  assert.equal(read.meta.legacyImported, '1', 'the save lost the memory');
  assert.equal(read.meta.appVersion, '1.9.1', 'the save never stamped its own version');
  // the shelf: one rotated .nosql copy, the json backups untouched
  const backupDir = path.join(userData, 'gendex_backups');
  assert.ok(existsSync(backupDir), 'the shelf never grew');
  const shelf = readdirSync(backupDir).filter((n) => /^gendex_db-\\d{8}-\\d{6}\\.nosql$/.test(n));
  assert.equal(shelf.length, 1, 'the rotated copy never shelved');
});""",
)

sub(
    "scripts/gendex_190_batch_dom.test.mjs",
    """  // the damage: garbage over the house (the flag dies with the file)
  writeFileSync(path.join(userData, 'gendex_db.sqlite'), '~~~ not a database ~~~ the house burned down ~~~');""",
    """  // 1.9.1 — the damage: garbage over the JOURNAL (the flag dies with the
  // store; the sqlite seat is never the live word again).
  writeFileSync(path.join(userData, 'gendex_db.nosql'), '~~~ not a journal ~~~ the house burned down ~~~');""",
)

# --- suite 191 — the production boot's fold-in lands in the journal ---------

sub(
    "scripts/gendex_191_batch_dom.test.mjs",
    """  const sqliteFile = path.join(userData, 'gendex_db.sqlite');
  assert.ok(existsSync(sqliteFile), 'the house was never built');
  const open = openSqliteFile(io, SQL, sqliteFile);
  const read = readSqliteArchive(open.db);
  open.db.close();
  assert.equal(read.meta.legacyImported, '1', 'the flag never stamped inside the file');
  assert.equal(read.meta.appVersion, '1.8.9', 'meta lost the imported stamp');
});""",
    """  // 1.9.1 — THE PAPER HOUSE: the fold-in lands in the document store now
  // (the sqlite house is never built again — the JSON door writes the journal).
  const { readNosqlArchive } = await import('../src/utils/nosql_engine.js');
  const nosqlFile = path.join(userData, 'gendex_db.nosql');
  assert.ok(existsSync(nosqlFile), 'the house was never built');
  const read = readNosqlArchive(io, nosqlFile);
  assert.equal(read.kind, 'ok', 'the journal refused to open');
  assert.equal(read.meta.legacyImported, '1', 'the flag never stamped inside the store');
  assert.equal(read.meta.appVersion, '1.8.9', 'meta lost the imported stamp');
});""",
)

print("law pins, part two: the live seats and the terms version follow the paper house.")
