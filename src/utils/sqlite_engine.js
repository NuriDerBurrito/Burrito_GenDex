// 1.8.9 — THE LIBRARY'S OWN HOUSE (the storage report: "i thought our db
// was working on sqlite ... and that upgrading to newer versions just adds
// what the json database had to sqlite and it doesnt use it anymore, if
// possible fix that so its the case, it should also be able to recognize
// if the data was imported before or not so it doesnt reimport them
// everytime").
//
// From this release the archive IS a SQLite database file — gendex_db.sqlite
// in the user-data folder — written and read by the official SQLite engine
// compiled to WebAssembly (sql.js, the sql.js/dist/sql-wasm.js glue with the
// wasm binary EMBEDDED in the sibling sqlite_wasm.js, so the packaged app
// never has to find a file on disk to boot its engine). The file on disk is
// a real SQLite database — magic header 'SQLite format 3', openable and
// inspectable with any SQLite tool — not a JSON text anymore.
//
// THE SHAPE (deliberately small and honest):
//   gendex_meta — one row per housekeeping fact. The one that matters most
//     is `legacyImported`: the library's OWN memory of whether the old JSON
//     archive has already been folded in. The flag lives INSIDE the SQLite
//     file, so it can never disagree with the data it guards — a fresh
//     install says nothing, the first import stamps '1', and every later
//     boot reads the flag and walks past the JSON door without touching it.
//     (A factory reset deletes the file, and the memory dies with it — a
//     library dropped in afterwards would be folded in once again, which is
//     exactly the promise: recognized, added, never re-imported.)
//     appVersion / savedAt / schemaVersion ride the same table — the stamp
//     the JSON era wrote on every save, moved to where a single writer
//     keeps it true.
//   gendex_data — one row per top-level library section (characters,
//     classes, tags, stamps, settings, and any section a future version
//     invents): key TEXT, value TEXT (the section, JSON-encoded). The
//     sections reassemble into EXACTLY the db object the renderer has
//     always spoken, so createSafeDb's whitelist law is untouched — the
//     sanitizer never learns that the seat beneath it changed.
//
// WHY KEY/VALUE INSTEAD OF A TABLE PER SECTION: the app's whole history of
// compatibility lives in ONE place — createSafeDb forgives unknown keys and
// missing fields on load, and the single writer re-stamps on save. A
// relational reshaping would move that law into SQL schema migrations
// overnight; the document seat keeps every past and future field riding
// free, while the FILE gains everything SQLite was promised for: one
// transactional write, a binary format a text editor can no longer half
// corrupt, and a magic header that tells the truth about what it is.
//
// THE WRITER IS STILL ATOMIC: every save builds the whole archive fresh in
// memory (BEGIN … COMMIT), exports the bytes, writes the .tmp and renames
// over the seat — the same ceremony the JSON era used, so a power cut
// leaves either yesterday's whole file or today's, never a half of either.
// The backup rotator in main.js shelves the previous file exactly as it
// always did (gendex_db-<stamp>.sqlite now, newest 8 kept).
//
// THE LEGACY DOOR (the one-time import) is driven from main.js: when the
// flag is unset and a gendex_db.json exists, the old salvage ladder
// (dbio.js) reads it — BOM-repaired, brace-sliced, tmp, backup shelf, the
// whole ladder — and mergeLegacyJsonIntoSections ADDS what it had: arrays
// merge by id (a character the SQLite side has never seen is appended;
// one it knows is left alone), objects fill only missing sub-keys, and the
// live library's own word always wins. The JSON file itself is never
// written, never moved, never deleted — it stays on the user's disk as the
// pre-migration snapshot it already was.
//
// PURITY LAW (the dbio.js rule, kept): the renderer never imports this
// module — only main.js and the batteries do. It carries the whole
// vendored engine — the glue and the embedded wasm, one seat since
// 1.8.10 — and neither belongs in a sandboxed
// page. The comparators the renderer needs stayed in dbio.js, exactly
// where they always lived.
//
// 1.8.10 — THE ENGINE'S OWN SEAT: the import below used to speak
// 'sql.js' — a real node_modules dependency — and that leg broke the
// boot on every machine whose install never carried the package
// ("Cannot find module 'sql.js'", the webpack missing-module shim
// throwing before a single window is born). The glue now rides the
// tree beside its fuel: the sibling sqlite_glue.js is the verbatim
// sql.js@1.13.0 dist/sql-wasm.js, vendored as an ES module with its
// four diseases cured statically, and sql.js is struck from the
// dependencies — the engine wakes on src/utils alone, in dev, in the
// packaged asar, and in the batteries' native ES module seat.

// The house file's own shape revision — bump ONLY when the table layout
// itself changes in a way an older reader could misread. v1: gendex_meta +
// gendex_data, as born in 1.8.9.
export const SQLITE_SCHEMA_VERSION = 1;

// Every SQLite file on earth begins with these 16 bytes. The door checks
// them BEFORE handing bytes to the engine, so a renamed zip or a text file
// wearing the name reads as 'corrupt' without ever entering WASM.
const SQLITE_MAGIC = 'SQLite format 3';

// The three quiet fields the JSON writer stamped on every save. They ride
// gendex_meta now, and the import door must never fold them in as sections.
export const STAMP_KEYS = ['appVersion', 'savedAt', 'schemaVersion'];

const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------------------
// THE ENGINE — initialized once per process, from the embedded wasm. The
// promise is memoized: every caller after the first awaits the same engine.
// ---------------------------------------------------------------------------
import initSqlJs from './sqlite_glue.js';
import { SQLITE_WASM_B64 } from './sqlite_wasm.js';

let enginePromise = null;
export function initSqliteEngine() {
  if (!enginePromise) {
    enginePromise = initSqlJs({ wasmBinary: Buffer.from(SQLITE_WASM_B64, 'base64') });
  }
  return enginePromise;
}

// ---------------------------------------------------------------------------
// THE DOOR — open one seat, honestly. Result:
//   { kind: 'ok',      db } — a live SQL.Database (CALLER closes it)
//   { kind: 'missing', db: null } — no file at all
//   { kind: 'corrupt', db: null } — bytes exist but they are not a database:
//                                   wrong magic, or the engine itself
//                                   refused them (truncated, damaged). The
//                                   caller sets the file aside, never saves
//                                   over it.
// ---------------------------------------------------------------------------
export function openSqliteFile(io, SQL, dbFile) {
  const { fs } = io;
  if (!fs || !SQL || !dbFile) return { kind: 'missing', db: null };
  let bytes = null;
  try {
    if (!fs.existsSync(dbFile)) return { kind: 'missing', db: null };
    bytes = fs.readFileSync(dbFile);
  } catch {
    return { kind: 'corrupt', db: null };
  }
  if (!bytes || !bytes.length || bytes.length < 16) return { kind: 'corrupt', db: null };
  for (let i = 0; i < SQLITE_MAGIC.length; i += 1) {
    if (bytes[i] !== SQLITE_MAGIC.charCodeAt(i)) return { kind: 'corrupt', db: null };
  }
  if (bytes[15] !== 0) return { kind: 'corrupt', db: null };
  let db = null;
  try {
    db = new SQL.Database(bytes);
    // Structural validation: a file with the right magic can still be
    // truncated past the first page — the engine only objects when asked.
    db.exec('SELECT count(*) FROM sqlite_master');
  } catch {
    try {
      if (db) db.close();
    } catch {
      /* already gone */
    }
    return { kind: 'corrupt', db: null };
  }
  return { kind: 'ok', db };
}

// Read the whole archive out of a live database: the sections table becomes
// a plain db object (each row JSON-decoded), the meta table a flat string
// map. A single damaged section value never buries the rest — the row is
// skipped, the way the JSON ladder's repairs always kept the readable half.
export function readSqliteArchive(db) {
  const sections = {};
  const meta = {};
  const tableNames = () => {
    const out = new Set();
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    for (const row of res[0]?.values || []) out.add(String(row[0]));
    return out;
  };
  const tables = tableNames();
  if (tables.has('gendex_meta')) {
    const res = db.exec('SELECT key, value FROM gendex_meta');
    for (const row of res[0]?.values || []) meta[String(row[0])] = String(row[1]);
  }
  if (tables.has('gendex_data')) {
    const res = db.exec('SELECT key, value FROM gendex_data');
    for (const row of res[0]?.values || []) {
      try {
        sections[String(row[0])] = JSON.parse(String(row[1]));
      } catch {
        /* one damaged section — the archive keeps its other words */
      }
    }
  }
  return { sections, meta };
}

// Build a whole archive fresh: the tables, the meta stamp, and one row per
// section — all inside a single transaction, so the exported bytes are
// either the whole library or nothing. Undefined section values cannot ride
// (JSON never spoke them; a live object never should).
export function buildSqliteArchive(SQL, sections, meta) {
  const db = new SQL.Database();
  db.run('CREATE TABLE gendex_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  db.run('CREATE TABLE gendex_data (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  db.run('BEGIN');
  const insMeta = db.prepare('INSERT INTO gendex_meta (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(meta || {})) {
    if (v === undefined) continue;
    insMeta.run([String(k), String(v)]);
  }
  insMeta.free();
  const insData = db.prepare('INSERT INTO gendex_data (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(sections || {})) {
    if (v === undefined) continue;
    insData.run([String(k), JSON.stringify(v === undefined ? null : v)]);
  }
  insData.free();
  db.run('COMMIT');
  return db;
}

// The whole file as bytes — ready for the .tmp + rename ceremony.
export function exportSqliteBytes(db) {
  return db.export();
}

// Does this archive carry anything at all? A saved library always speaks at
// least its settings/classes/characters seats; a file with no rows is a
// newborn (or a set-aside's ghost) and must not masquerade as a library.
export function hasAnySectionData(sections) {
  return isPlainObject(sections) && Object.keys(sections).length > 0;
}

// ---------------------------------------------------------------------------
// THE ONE-TIME DOOR'S OWN HANDS — the merge ("adds what the json database
// had"). Never destructive, never duplicating:
//   · a section the SQLite side lacks is carried over whole;
//   · arrays merge BY ID — an entry the library has never seen is appended,
//     one it already knows is left exactly as the library holds it;
//   · objects (settings) fill ONLY sub-keys that are missing — the live
//     library's own choices always win;
//   · the JSON era's three stamp fields never fold in (they ride meta).
// ---------------------------------------------------------------------------
export function mergeLegacyJsonIntoSections(current, legacy) {
  const merged = isPlainObject(current) ? { ...current } : {};
  const report = {
    keysAdded: [],
    keysFilled: 0,
    charactersAdded: 0,
    entriesAdded: {},
    stampFieldsSkipped: [],
  };
  if (!isPlainObject(legacy)) return { merged, report };
  for (const [key, value] of Object.entries(legacy)) {
    if (STAMP_KEYS.includes(key)) {
      report.stampFieldsSkipped.push(key);
      continue;
    }
    const seat = merged[key];
    if (seat === undefined) {
      merged[key] = value;
      report.keysAdded.push(key);
      continue;
    }
    if (Array.isArray(seat) && Array.isArray(value)) {
      const copy = [...seat];
      const ids = new Set(
        copy
          .map((x) => (isPlainObject(x) && x.id != null ? String(x.id) : null))
          .filter((x) => x != null),
      );
      let added = 0;
      for (const item of value) {
        const id = isPlainObject(item) && item.id != null ? String(item.id) : null;
        if (id == null || ids.has(id)) continue;
        copy.push(item);
        ids.add(id);
        added += 1;
      }
      merged[key] = copy;
      report.entriesAdded[key] = added;
      if (key === 'characters') report.charactersAdded = added;
      continue;
    }
    if (isPlainObject(seat) && isPlainObject(value)) {
      const copy = { ...seat };
      let filled = 0;
      for (const [sk, sv] of Object.entries(value)) {
        if (copy[sk] === undefined) {
          copy[sk] = sv;
          filled += 1;
        }
      }
      merged[key] = copy;
      report.keysFilled += filled;
    }
    // anything else (primitive vs primitive, or a shape disagreement): the
    // live library's own word wins — the import ADDS, it never replaces.
  }
  return { merged, report };
}
