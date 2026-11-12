#!/usr/bin/env python3
"""1.9.1 main.js surgery — the document house takes the live seats.

The SQLite house becomes the snapshot (read once, at the translation
door, never written again); the library LIVES in gendex_db.nosql, an
append-only JSON-lines document journal (src/utils/nosql_engine.js).
This pass moves every live seat in main.js:

  1. the imports (sqlite thins to the translation's own hands; the
     nosql engine's voice joins)
  2. the seats (SQLITE_FILE re-told as the snapshot; NOSQL_FILE +
     nosqlState born; sqliteState retired)
  3. the rotator + the shelf reader (the .nosql copies' own law; the
     sqlite rotator/reader/persist-writer retire with their seats)
  4. writeDb (the single writer speaks the JOURNAL: diff-append +
     compaction instead of the whole-file rebuild)
  5. the priming door (primeNosqlArchive: shelf rung, the ONE-TIME
     TRANSLATION door, the legacy JSON door)
  6. the pre-paint theme peek (the document house speaks first)
  7. db:load (the journal answers the boot; the recovery rungs re-seat
     what they recover — the diff-append law needs its whole base on
     disk)
  8. the factory reset (the journal dies with the rest)
  9. whenReady (the new prime call)

Run from the app root: python3 scripts/patch_house_192.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "src" / "main.js"


def replace_between(text, start, end, new, include_start=True, include_end=False, label=""):
    i = text.index(start)
    j = text.index(end, i + len(start))
    a = i if include_start else i + len(start)
    b = j + len(end) if include_end else j
    print(f"  {label}: {b - a} bytes replaced")
    return text[:a] + new + text[b:]


def sub(text, old, new, label=""):
    assert old in text, f"{label}: missing seat:\n{old[:160]}"
    print(f"  {label}: seated")
    return text.replace(old, new, 1)


raw = TARGET.read_text(encoding="utf8")

# --- 1. THE IMPORTS -------------------------------------------------------
old_imports = """import {
  initSqliteEngine,
  openSqliteFile,
  readSqliteArchive,
  buildSqliteArchive,
  exportSqliteBytes,
  mergeLegacyJsonIntoSections,
  hasAnySectionData,
  SQLITE_SCHEMA_VERSION,
} from './utils/sqlite_engine.js';"""
new_imports = """// 1.9.1 — THE SQLITE IMPORTS THIN TO THE TRANSLATION'S OWN HANDS: the
// engine is no longer the house's live voice — it wakes exactly ONCE, at
// the translation door below, to read the old file's truth into the new
// document store. buildSqliteArchive / exportSqliteBytes /
// SQLITE_SCHEMA_VERSION retire with the writer they served (nothing
// builds a SQLite file from this release on); the honest door, the
// reader, and the merge hands stay — the translation's whole vocabulary.
import {
  initSqliteEngine,
  openSqliteFile,
  readSqliteArchive,
  mergeLegacyJsonIntoSections,
  hasAnySectionData,
} from './utils/sqlite_engine.js';
// 1.9.1 — THE DOCUMENT HOUSE'S OWN VOICE (see src/utils/nosql_engine.js
// for the whole shape): the journal the library lives in from this
// release on — read, written whole (the translation / the compaction
// pass), appended per save, and compacted when its history outgrows its
// truth.
import {
  readNosqlArchive,
  writeNosqlStore,
  appendNosqlOps,
  shouldCompactNosql,
  nosqlSectionOp,
  nosqlMetaOp,
  nosqlDeleteOp,
  NOSQL_FORMAT_VERSION,
} from './utils/nosql_engine.js';"""
raw = sub(raw, old_imports, new_imports, "imports")

# --- 2. THE SEATS ---------------------------------------------------------
old_seats = """// 1.8.9 — THE HOUSE ITSELF: gendex_db.sqlite, the SQLite database the
// whole archive lives in from this release on. One transactional file with
// a magic header that tells the truth about what it is; the sections and
// the housekeeping meta (including the one-time-import flag) ride inside —
// see src/utils/sqlite_engine.js for the whole shape.
const SQLITE_FILE = path.join(app.getPath('userData'), 'gendex_db.sqlite');
const SQLITE_BACKUP_RE = /^gendex_db-\\d{8}-\\d{6}\\.sqlite$/;

// The house's session state, written by primeSqliteArchive() before the
// window is born and read by every later seat:
//   ready           — the engine woke and the house answers (false = the
//                     JSON path below keeps the app alive, belt to braces)
//   legacyImported  — mirrors the flag INSIDE the file, so every save
//                     re-stamps the same memory the boot read
//   peekSettings    — the raw settings section, cached for the pre-paint
//                     theme peek (the old peek read the raw JSON; this is
//                     the same raw word from the new seat)
//   migration       — the boot's one-time verdict (what the import door
//                     did), spoken once by the first db:load and never
//                     again for the session
const sqliteState = {
  ready: false,
  SQL: null,
  legacyImported: false,
  peekSettings: null,
  migration: null,
};"""
new_seats = """// 1.8.9 — THE HOUSE ITSELF: gendex_db.sqlite, the SQLite database the
// whole archive lived in from that release on. 1.9.1 — THE HOUSE BECOMES
// THE SNAPSHOT ("dont delete the old sqlite database too, just translate
// it from sql to nosql since i wanna test it"): the library LIVES in
// gendex_db.nosql now (the document house below); the SQLite file is read
// exactly ONCE — at the one-time translation door — and never written,
// moved, or deleted afterwards. It stays on the user's disk as the
// pre-translation snapshot it already was: the deep recovery seat the
// corrupt ladder can always re-read, and the walking-back guarantee the
// experiment promised.
const SQLITE_FILE = path.join(app.getPath('userData'), 'gendex_db.sqlite');

// 1.9.1 — THE DOCUMENT HOUSE: gendex_db.nosql, the append-only
// JSON-lines journal the whole library lives in from this release on —
// one file, two collections (sections + meta), every save appending only
// the documents that changed. See src/utils/nosql_engine.js for the
// shape and the ceremony.
const NOSQL_FILE = path.join(app.getPath('userData'), 'gendex_db.nosql');
const NOSQL_BACKUP_RE = /^gendex_db-\\d{8}-\\d{6}\\.nosql$/;

// The document house's session state, written by primeNosqlArchive()
// before the window is born and read by every later seat:
//   ready           — the store answers (false = the JSON belt below
//                     keeps the app alive, the old belt under braces)
//   legacyImported  — mirrors the meta flag INSIDE the store, so every
//                     save re-stamps the same memory the boot read
//   sqlTranslated   — the translation door's own stamp, same mirror law
//   peekSettings    — the raw settings section, cached for the pre-paint
//                     theme peek (the same raw pre-sanitize word the
//                     peek always read, from the new seat)
//   migration       — the boot's one-time verdict (what the doors did),
//                     spoken once by the first db:load and never again
//                     for the session
//   lastSections    — the last whole truth the journal holds: the diff
//                     base that decides which sections a save appends
//   lineCount       — the journal's live op-line count, the compaction
//                     measure's own truth
const nosqlState = {
  ready: false,
  legacyImported: false,
  sqlTranslated: false,
  peekSettings: null,
  migration: null,
  lastSections: null,
  lineCount: 0,
};"""
raw = sub(raw, old_seats, new_seats, "seats")

# --- 3. THE ROTATOR + THE SHELF READER (the sqlite trio retires) ---------
raw = replace_between(
    raw,
    "// 1.8.9 — THE HOUSE'S OWN ROTATOR: the same shelf, the same law, the new",
    "  fs.renameSync(tmp, SQLITE_FILE);\n};",
    """// 1.9.1 — THE DOCUMENT HOUSE'S OWN ROTATOR: the same shelf, the same
// law, the new seat — every save first copies the PREVIOUS
// gendex_db.nosql to <userData>/gendex_backups/
// gendex_db-<YYYYMMDD-HHMMSS>.nosql, newest 8 kept (the JSON-era .json
// copies and the SQLite-era .sqlite copies on the shelf are never
// touched; they are history, and history keeps its own name).
// Best-effort only — backup trouble must NEVER fail the save itself.
const rotateNosqlBackup = () => {
  try {
    if (!fs.existsSync(NOSQL_FILE)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const name = `gendex_db-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}.nosql`;
    fs.copyFileSync(NOSQL_FILE, path.join(BACKUP_DIR, name));
    const old = fs.readdirSync(BACKUP_DIR).filter((f) => NOSQL_BACKUP_RE.test(f)).sort();
    while (old.length > BACKUP_KEEP) fs.unlinkSync(path.join(BACKUP_DIR, old.shift()));
  } catch {
    /* best-effort: never block a save on backup trouble */
  }
};

// The shelf's newest readable .nosql copy (the name IS the timestamp, so
// a plain sort desc walks backwards through time) — the recovery rung
// for a journal too damaged to replay. Null when the shelf has nothing
// to say.
const newestNosqlBackupRead = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return null;
    const names = fs
      .readdirSync(BACKUP_DIR)
      .filter((n) => NOSQL_BACKUP_RE.test(n))
      .sort()
      .reverse();
    for (const name of names) {
      const read = readNosqlArchive(DB_IO, path.join(BACKUP_DIR, name));
      if (read.kind !== 'ok') continue;
      if (!hasAnySectionData(read.sections)) continue;
      return { name, sections: read.sections, meta: read.meta };
    }
  } catch {
    /* the shelf refused — the ladder simply ends */
  }
  return null;
};
""",
    include_start=True,
    include_end=True,
    label="rotator+reader",
)
# (the sqlite atomic writer retire line — where persistSqliteArchive's
# own comment lived, the story is already told at the seats above; the
# blank seam below keeps the writeDb comment's own voice.)

# --- 4. THE SINGLE WRITER -------------------------------------------------
raw = replace_between(
    raw,
    "  // 1.8.9 — THE SINGLE WRITER SPEAKS SQLITE FIRST: every save builds the",
    "  // (engine down — the belt under the braces) the JSON writer, exactly as",
    """  // 1.9.1 — THE SINGLE WRITER SPEAKS THE JOURNAL ("our data will be
  // big"): the diff against the last whole truth the journal holds says
  // which sections changed, and ONLY those ride the file as appended
  // documents — a save that touched one card's notes grows the file by
  // that one section, not by the whole library (the SQLite era rebuilt
  // everything on every save). The stamp the JSON era wrote on every
  // file rides the meta collection now: appVersion / savedAt /
  // schemaVersion (the house's own shape number), plus the two memories
  // (legacyImported, sqlTranslated) re-stamped from the boot's own read
  // of them — so the file never forgets what its doors already closed.
  // When the journal's history has more than quadrupled its live truth,
  // the compaction pass rewrites it whole (the old atomic ceremony:
  // .tmp + rename), and the measure starts over.
  if (nosqlState.ready) {
    rotateNosqlBackup();
    const sections = db || {};
    const prev = nosqlState.lastSections || {};
    const ops = [];
    for (const [k, v] of Object.entries(sections)) {
      if (v === undefined) continue; // JSON never spoke it; the row never rides
      if (JSON.stringify(prev[k]) === JSON.stringify(v)) continue; // unchanged
      ops.push(nosqlSectionOp(k, v));
    }
    for (const k of Object.keys(prev)) {
      if (!(k in sections)) ops.push(nosqlDeleteOp(k));
    }
    const stamp = {
      legacyImported: nosqlState.legacyImported ? '1' : '0',
      sqlTranslated: nosqlState.sqlTranslated ? '1' : '0',
      appVersion: app.getVersion(),
      savedAt: String(Date.now()),
      schemaVersion: String(NOSQL_FORMAT_VERSION),
    };
    for (const [k, v] of Object.entries(stamp)) ops.push(nosqlMetaOp(k, v));
    if (ops.length) {
      appendNosqlOps(DB_IO, NOSQL_FILE, ops);
      nosqlState.lineCount += ops.length;
    }
    nosqlState.lastSections = sections;
    const liveDocs = Object.keys(sections).length + 5; // sections + the stamp's own five
    if (shouldCompactNosql(nosqlState.lineCount, liveDocs)) {
      nosqlState.lineCount = writeNosqlStore(DB_IO, NOSQL_FILE, sections, stamp);
    }
    return;
  }
""",
    include_start=True,
    include_end=False,
    label="writeDb",
)

# --- 5. THE PRIMING DOOR --------------------------------------------------
raw = replace_between(
    raw,
    "// 1.8.9 — THE HOUSE PRIMES ITSELF BEFORE THE WINDOW IS BORN. The engine",
    "// Must run before app is ready.",
    """// 1.9.1 — THE DOCUMENT HOUSE PRIMES ITSELF BEFORE THE WINDOW IS BORN.
// No engine wakes for the store itself — the journal is plain bytes and
// the reader is pure JavaScript, so the boot's own cost is one file read
// (the wasm compile the SQLite era paid on EVERY boot is now paid only
// by the one-time translation below, and never again after it). The
// doors, in their order, each speaking only while the store has no
// truth of its own yet:
//   · a CORRUPT store is set aside first — evidence, never overwritten —
//     and the shelf answers (the newest readable .nosql copy: its word
//     is newer than anything else the disk still holds);
//   · THE ONE-TIME TRANSLATION DOOR: a gendex_db.sqlite on the disk is
//     read EXACTLY ONCE (the engine wakes for this read alone), its
//     whole truth — sections and meta — written into the journal, and
//     the SQLite file itself never touched again: not written, not
//     moved, not deleted. It stays as the pre-translation snapshot, the
//     deep recovery seat for every boot after this one;
//   · THE LEGACY JSON DOOR (the 1.8.9 law, kept whole): while the flag
//     says the old JSON archive was never folded in, the salvage ladder
//     reads it ONE last time and its data is ADDED into the store
//     (arrays by id, objects fill-only — the merge never replaces and
//     never duplicates).
// Every door's memory lives INSIDE the store (the meta mirror), so it
// dies exactly when the store does — a factory reset, or a store deleted
// by hand, re-opens the doors once and never twice.
const primeNosqlArchive = async () => {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    const read = readNosqlArchive(DB_IO, NOSQL_FILE);
    let sections = read.sections || {};
    let meta = read.meta || {};
    let lineCount = read.kind === 'ok' ? read.lineCount : 0;
    let corruptAside = '';
    if (read.kind === 'corrupt') {
      // Evidence first, the law unchanged: the unreadable journal keeps
      // its bytes next to the shelf (gendex_db.corrupt-<stamp>.nosql).
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const asideName = `gendex_db.corrupt-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.nosql`;
      corruptAside = setAsideCorruptDb(DB_IO, NOSQL_FILE, asideName) || '';
      sections = {};
      meta = {};
      lineCount = 0;
      // THE SHELF RUNG — only for a corrupt seat (a missing seat is a
      // newborn or a hand-deletion; the doors below own that world): the
      // newest readable journal copy answers first, its word newer than
      // the snapshot or the JSON ever were.
      const shelf = newestNosqlBackupRead();
      if (shelf) {
        sections = shelf.sections;
        meta = shelf.meta;
        lineCount = writeNosqlStore(DB_IO, NOSQL_FILE, sections, meta);
        nosqlState.migration = { kind: 'backup', recoveredFrom: shelf.name, corruptAside, spoken: false };
      }
    }
    // THE ONE-TIME TRANSLATION DOOR — the SQLite house's whole truth,
    // read once, written whole into the journal, the file untouched.
    if (!hasAnySectionData(sections) && fs.existsSync(SQLITE_FILE)) {
      try {
        const SQL = await initSqliteEngine(); // the one wake this era ever asks of the wasm
        const open = openSqliteFile(DB_IO, SQL, SQLITE_FILE);
        if (open.kind === 'ok') {
          try {
            const sqlRead = readSqliteArchive(open.db);
            if (hasAnySectionData(sqlRead.sections)) {
              sections = sqlRead.sections;
              meta = { ...sqlRead.meta, sqlTranslated: '1' };
              lineCount = writeNosqlStore(DB_IO, NOSQL_FILE, sections, meta);
              nosqlState.migration = {
                kind: 'translated',
                fromAppVersion: sqlRead.meta.appVersion || '',
                corruptAside,
                spoken: false,
              };
            }
          } finally {
            try {
              open.db.close();
            } catch {
              /* already gone */
            }
          }
        } else if (open.kind === 'corrupt') {
          // the snapshot's own honest word: unreadable bytes are set
          // aside (renamed, never overwritten) — evidence, not loss.
          const d = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          const asideName = `gendex_db.corrupt-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.sqlite`;
          setAsideCorruptDb(DB_IO, SQLITE_FILE, asideName);
        }
      } catch {
        /* the engine refused to wake — the JSON door below keeps the library alive */
      }
    }
    // THE LEGACY JSON DOOR — the 1.8.9 law, kept whole.
    if (!hasAnySectionData(sections) && meta.legacyImported !== '1') {
      const jsonRead = readDatabaseFile(DB_IO, {
        dbFile: DB_FILE,
        tmpFile: `${DB_FILE}.tmp`,
        backupDir: BACKUP_DIR,
      });
      let legacy = jsonRead.db;
      if (jsonRead.status === 'corrupt') {
        // the old law, kept: the unreadable JSON is set aside (renamed,
        // never overwritten) before any fresh start could bury it.
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const jsonAsideName = `gendex_db.corrupt-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
        const jsonAside = setAsideCorruptDb(DB_IO, DB_FILE, jsonAsideName) || '';
        legacy = null;
        if (!nosqlState.migration) {
          nosqlState.migration = { kind: 'json-corrupt', corruptAside: jsonAside, spoken: false };
        }
      }
      if (legacy) {
        const stampV = readAppVersion(legacy);
        const { merged, report } = mergeLegacyJsonIntoSections(sections, legacy);
        meta = {
          legacyImported: '1',
          appVersion: stampV || app.getVersion(),
          savedAt: String(Date.now()),
          schemaVersion: String(NOSQL_FORMAT_VERSION),
        };
        lineCount = writeNosqlStore(DB_IO, NOSQL_FILE, merged, meta);
        sections = merged;
        nosqlState.migration = {
          kind: 'import',
          report,
          via: jsonRead.status,
          recoveredFrom: jsonRead.recoveredFrom || '',
          fromAppVersion: stampV,
          corruptAside,
          spoken: false,
        };
      }
    }
    // the mirrors + the peek: the boot's own read of what the doors said.
    nosqlState.legacyImported = meta.legacyImported === '1';
    nosqlState.sqlTranslated = meta.sqlTranslated === '1';
    nosqlState.lineCount = lineCount;
    nosqlState.lastSections = hasAnySectionData(sections) ? sections : {};
    nosqlState.peekSettings =
      sections && typeof sections.settings === 'object' && sections.settings ? sections.settings : null;
    nosqlState.ready = true;
  } catch {
    // any surprise in the doors: the store stays dark and the JSON belt
    // keeps the app alive exactly as it always did — no fresh start is
    // ever painted over an archive the doors could not speak for.
    nosqlState.ready = false;
    nosqlState.legacyImported = false;
    nosqlState.sqlTranslated = false;
    nosqlState.migration = null;
    nosqlState.peekSettings = null;
    nosqlState.lastSections = null;
    nosqlState.lineCount = 0;
  }
};

""",
    include_start=True,
    include_end=False,
    label="prime",
)

# --- 6. THE PRE-PAINT THEME PEEK -----------------------------------------
raw = replace_between(
    raw,
    "  // 1.8.9 — THE HOUSE SPEAKS FIRST: primeSqliteArchive() has already read",
    "  const fromHouse = peekSettingsBgOf(sqliteState.ready ? sqliteState.peekSettings : null);",
    """  // 1.9.1 — THE DOCUMENT HOUSE SPEAKS FIRST: primeNosqlArchive() has
  // already read the journal (and run whatever door the day demanded —
  // shelf, translation, JSON fold) before the window was born, so the
  // peek reads the raw settings section it cached — the same RAW
  // pre-sanitize word the peek always read, from the new seat. (Store
  // dark or nothing cached → the legacy JSON peek below, exactly as it
  // always was.)
  const fromHouse = peekSettingsBgOf(nosqlState.ready ? nosqlState.peekSettings : null);""",
    include_start=True,
    include_end=True,
    label="peek",
)

# --- 7. db:load — THE DOCUMENT HOUSE ANSWERS THE BOOT --------------------
raw = replace_between(
    raw,
    "      // 1.8.9 — THE HOUSE ANSWERS THE BOOT. The seat is opened honestly",
    "      // (engine down — the belt under the braces) the JSON ladder, exactly",
    """      // 1.9.1 — THE DOCUMENT HOUSE ANSWERS THE BOOT. The journal is read
      // honestly (a file that is not this format is set aside, never
      // saved over), the sections and the meta come back out, and the
      // boot's verdicts keep their old tongues: 'ok' when the library
      // simply answers, 'migrated' the ONE time the translation door
      // carried the SQLite house in (or the legacy JSON archive was
      // folded in — one word for both doors, exactly as 1.8.9 spoke its
      // own two), 'backup' when the shelf answered, 'corrupt' only when
      // NOTHING answered — and then the broken file was already set
      // aside, so no fresh start can ever bury it. The store being dark
      // falls to the JSON ladder below, exactly as the app always spoke
      // it.
      if (nosqlState.ready) {
        let db = null;
        let status = 'missing';
        let fromAppVersion = '';
        let recoveredFrom = '';
        let corruptSetAside = '';
        const read = readNosqlArchive(DB_IO, NOSQL_FILE);
        if (read.kind === 'corrupt') {
          const d = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          const asideName = `gendex_db.corrupt-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.nosql`;
          corruptSetAside = setAsideCorruptDb(DB_IO, NOSQL_FILE, asideName) || '';
        }
        if (read.kind === 'ok') {
          db = hasAnySectionData(read.sections) ? read.sections : null;
          fromAppVersion = read.meta.appVersion || '';
          status = db ? 'ok' : 'missing';
          if (db) {
            // the diff base + the measure keep step with the truth the
            // renderer actually receives (a reload re-asks; the mirrors
            // never drift from the file on disk).
            nosqlState.lastSections = read.sections;
            nosqlState.lineCount = read.lineCount;
            nosqlState.legacyImported = read.meta.legacyImported === '1';
            nosqlState.sqlTranslated = read.meta.sqlTranslated === '1';
          }
          // THE BOOT'S OWN ONE-TIME VERDICT (parked by the priming
          // door): spoken here, once per session, never again on a
          // reload.
          if (nosqlState.migration && !nosqlState.migration.spoken) {
            nosqlState.migration.spoken = true;
            if (nosqlState.migration.kind === 'translated' || nosqlState.migration.kind === 'import') {
              status = 'migrated';
              recoveredFrom = nosqlState.migration.recoveredFrom || '';
              fromAppVersion = fromAppVersion || nosqlState.migration.fromAppVersion || '';
              corruptSetAside = corruptSetAside || nosqlState.migration.corruptAside || '';
            } else if (nosqlState.migration.kind === 'backup') {
              status = 'backup';
              recoveredFrom = nosqlState.migration.recoveredFrom || '';
              corruptSetAside = corruptSetAside || nosqlState.migration.corruptAside || '';
            } else if (nosqlState.migration.kind === 'json-corrupt' && !db) {
              status = 'corrupt';
              corruptSetAside = nosqlState.migration.corruptAside || '';
            }
          }
        } else {
          // the seat is missing (or was just set aside): the shelf
          // first, then the legacy doors. The diff-append law needs its
          // whole base ON DISK, so a recovery rung that answers RE-SEATS
          // the whole truth it found (one atomic .tmp + rename — the
          // same ceremony, at load) before any save can append on top of
          // it; the memories ride the re-seated meta so this archive is
          // never folded in twice.
          const shelf = newestNosqlBackupRead();
          if (shelf) {
            db = hasAnySectionData(shelf.sections) ? shelf.sections : null;
            status = 'backup';
            recoveredFrom = shelf.name;
            fromAppVersion = shelf.meta.appVersion || '';
            if (db) {
              nosqlState.lineCount = writeNosqlStore(DB_IO, NOSQL_FILE, shelf.sections, shelf.meta);
              nosqlState.lastSections = shelf.sections;
              nosqlState.legacyImported = shelf.meta.legacyImported === '1';
              nosqlState.sqlTranslated = shelf.meta.sqlTranslated === '1';
            }
          } else {
            const readJson = readDatabaseFile(DB_IO, {
              dbFile: DB_FILE,
              tmpFile: `${DB_FILE}.tmp`,
              backupDir: BACKUP_DIR,
            });
            if (readJson.db) {
              db = readJson.db;
              status = 'migrated';
              recoveredFrom = readJson.recoveredFrom || '';
              fromAppVersion = readAppVersion(readJson.db);
              // the JSON era's three stamp keys never ride as sections
              // (they ride meta, where the single writer re-stamps them
              // on every save — the same law the SQLite door kept).
              const seat = { ...readJson.db };
              delete seat.appVersion;
              delete seat.savedAt;
              delete seat.schemaVersion;
              nosqlState.lineCount = writeNosqlStore(DB_IO, NOSQL_FILE, seat, {
                legacyImported: '1',
                appVersion: fromAppVersion || app.getVersion(),
                savedAt: String(Date.now()),
                schemaVersion: String(NOSQL_FORMAT_VERSION),
              });
              nosqlState.lastSections = seat;
              nosqlState.legacyImported = true;
              nosqlState.sqlTranslated = false;
            } else if (readJson.status === 'corrupt') {
              const d = new Date();
              const pad = (n) => String(n).padStart(2, '0');
              const asideName = `gendex_db.corrupt-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
              corruptSetAside = corruptSetAside || setAsideCorruptDb(DB_IO, DB_FILE, asideName) || '';
              status = 'corrupt';
            } else {
              status = 'missing';
            }
            // a json-corrupt verdict the priming door already set aside
            // (evidence, not loss): speak its name when nothing else did.
            if (
              status === 'missing' &&
              nosqlState.migration &&
              !nosqlState.migration.spoken &&
              nosqlState.migration.kind === 'json-corrupt' &&
              nosqlState.migration.corruptAside
            ) {
              nosqlState.migration.spoken = true;
              status = 'corrupt';
              corruptSetAside = corruptSetAside || nosqlState.migration.corruptAside;
            }
          }
        }
        factoryResetting = false;
        return {
          db,
          imagesPath: IMAGES_PATH,
          status,
          fromAppVersion,
          recoveredFrom,
          corruptSetAside,
        };
      }
""",
    include_start=True,
    include_end=False,
    label="db:load",
)

# --- 8. THE FACTORY RESET -------------------------------------------------
raw = replace_between(
    raw,
    "      sqliteState.legacyImported = false;",
    "      fs.mkdirSync(IMAGES_PATH, { recursive: true });",
    """      // 1.9.1 — THE DOCUMENT HOUSE DIES WITH THE REST: the journal seat,
      // its staged .tmp, and the house's own memories (the flags lived
      // INSIDE the store, so a library dropped in after a reset is
      // folded in once again — recognized, added, never re-imported).
      try {
        fs.rmSync(NOSQL_FILE, { force: true });
      } catch {
        /* best-effort */
      }
      try {
        fs.rmSync(`${NOSQL_FILE}.tmp`, { force: true });
      } catch {
        /* best-effort */
      }
      nosqlState.legacyImported = false;
      nosqlState.sqlTranslated = false;
      nosqlState.migration = null;
      nosqlState.peekSettings = null;
      nosqlState.lastSections = null;
      nosqlState.lineCount = 0;
""",
    include_start=True,
    include_end=False,
    label="factory-reset",
)

# --- 9. whenReady ----------------------------------------------------------
raw = replace_between(
    raw,
    "  // 1.8.9 — THE HOUSE PRIMES ITSELF BEFORE THE WINDOW IS BORN: the engine",
    "  await primeSqliteArchive();",
    """  // 1.9.1 — THE DOCUMENT HOUSE PRIMES ITSELF BEFORE THE WINDOW IS BORN:
  // the journal is read (one file, no engine to wake), the doors decide,
  // and the theme peek reads the library that will actually paint. The
  // wasm compile the SQLite era paid on every boot is paid only by the
  // one-time translation now — after it, boots never touch an engine at
  // all.
  await primeNosqlArchive();""",
    include_start=True,
    include_end=True,
    label="whenReady",
)

TARGET.write_text(raw, encoding="utf8")
print("main.js: the document house holds the live seats.")
