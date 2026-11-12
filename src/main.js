// 1.5.6 — THE PACKAGING LAW: this file speaks ESM imports, period. It
// lives under src/package.json {"type":"module"}, so webpack parses it as
// an ES module — and in ESM webpack does NOT bundle require() calls: it
// leaves them as raw runtime Node requires with no build-time warning at
// all. That silently worked for the app's whole history because every
// require the file ever made was 'electron' or a node builtin (resolvable
// at runtime inside the asar), but 1.5.5 added the first RELATIVE
// require — the dbio salvage door — and the packaged app died at boot:
// "Cannot find module '../src/utils/dbio.js'" from
// app.asar/.webpack/main/index.js, before a single window could open
// (the 1.1.7 squirrel-startup crash was the same disease, one victim
// earlier). Every module this file needs is now a static import —
// resolved and bundled at build time — and webpack.main.config.js
// additionally forces javascript/auto for this entry as the net
// underneath (THE PACKAGED-MAIN GUARD there). The gendex_162 packaging
// battery builds this entry exactly as forge does and BOOTS the emitted
// bundle, so a regression of this class can never again ship quietly.
import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  shell,
  dialog,
  clipboard,
  nativeImage,
  screen,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import { spawn } from 'node:child_process';
import zlib from 'node:zlib';

// 1.1.7 — SQUIRREL EVENTS, INLINED. The old first line of this file was
// `if (require('electron-squirrel-startup')) app.quit();` — and that require
// was the PACKAGED app's boot crash. The forge webpack plugin packs only the
// webpack bundles (the asar's node_modules is empty by design — everything
// must be bundled), but webpack left that require external, so the packaged
// app died with "Cannot find module 'electron-squirrel-startup'" before a
// single window opened. The handler is twenty lines; it lives here now, so
// no build mode can ever lose it. Squirrel only fires these commands on
// Windows, and only for an app INSTALLED by the Squirrel installer
// (Setup.exe) — dev runs and START.bat-packaged runs never see them.
(function handleSquirrelEvents() {
  if (process.platform !== 'win32') return;
  const cmd = process.argv[1];
  const target = path.basename(process.execPath);
  const run = (args, done) => {
    const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
    spawn(updateExe, args, { detached: true }).on('close', done);
  };
  if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
    run([`--createShortcut=${target}`], app.quit);
  } else if (cmd === '--squirrel-uninstall') {
    run([`--removeShortcut=${target}`], app.quit);
  } else if (cmd === '--squirrel-obsolete') {
    app.quit();
  }
})();

app.setName('Burrito GenDex');

// 1.5.5 — THE ARCHIVE'S OWN DOOR (the compatibility report: "the old
// database i was working on for some reason wasnt updated in the latest
// patch, it just showed me default, fix that, as you must always have
// compatibility with the past versions"). The pure salvage/stamp layer
// lives in src/utils/dbio.js (renderer-safe, battery-tested); this seat
// injects the fs it runs against. See that file for the whole ladder.
import {
  readDatabaseFile,
  setAsideCorruptDb,
  stampDatabaseForSave,
  parseDbText,
  readAppVersion,
} from './utils/dbio.js';
// 1.8.9 — THE LIBRARY'S OWN HOUSE (the storage report: "i thought our db
// was working on sqlite ... if possible fix that so its the case"): the
// archive is a real SQLite database file now — gendex_db.sqlite — spoken
// by the official engine compiled to WebAssembly (sql.js, wasm EMBEDDED in
// the bundle). The engine's whole law lives in that module; this seat only
// injects the fs it runs against, exactly the way dbio.js always did.
// 1.9.1 — THE SQLITE IMPORTS THIN TO THE TRANSLATION'S OWN HANDS: the
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
} from './utils/nosql_engine.js';
const DB_IO = { fs, join: path.join };

// 1.8.9 — THE LEGACY SEAT: gendex_db.json is the JSON-era archive. The
// library LIVES in gendex_db.sqlite now (below); the JSON file is read
// exactly ONCE — at the one-time import door, and only while the flag
// inside the SQLite file says the fold-in never happened — and never
// written, moved, or deleted afterwards. It stays on the user's disk as
// the pre-migration snapshot it already was.
const DB_FILE = path.join(app.getPath('userData'), 'gendex_db.json');
const IMAGES_PATH = path.join(app.getPath('userData'), 'gendex_images');
// 0.25.0 — SAVE BACKUPS: every write first copies the PREVIOUS database to
// <userData>/gendex_backups/gendex_db-<YYYYMMDD-HHMMSS>.json, newest 8 kept.
// A save that corrupts or drops data (bug, power cut mid-write) can then be
// rolled back by renaming a backup over gendex_db.json. Best-effort only —
// backup trouble must NEVER fail the save itself.
const BACKUP_DIR = path.join(app.getPath('userData'), 'gendex_backups');
const BACKUP_KEEP = 8;

// 1.8.9 — THE HOUSE ITSELF: gendex_db.sqlite, the SQLite database the
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
const NOSQL_BACKUP_RE = /^gendex_db-\d{8}-\d{6}\.nosql$/;

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
};

const rotateDbBackup = () => {
  try {
    if (!fs.existsSync(DB_FILE)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const name = `gendex_db-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}.json`;
    fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, name));
    const old = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => /^gendex_db-\d{8}-\d{6}\.json$/.test(f))
      .sort();
    while (old.length > BACKUP_KEEP) fs.unlinkSync(path.join(BACKUP_DIR, old.shift()));
  } catch {
    /* best-effort: never block a save on backup trouble */
  }
};

// 1.9.1 — THE DOCUMENT HOUSE'S OWN ROTATOR: the same shelf, the same
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

const writeDb = (db) => {
  if (factoryResetting) return; // the dead-man switch: nothing resurrects a wiped archive
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.mkdirSync(IMAGES_PATH, { recursive: true });
  // 1.9.1 — THE SINGLE WRITER SPEAKS THE JOURNAL ("our data will be
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
  // (store dark — the belt under the braces) the JSON writer, exactly as
  // it always was:
  rotateDbBackup();
  const tmp = `${DB_FILE}.tmp`;
  // 1.5.5 — every save carries the ARCHIVE'S OWN STAMP (appVersion /
  // savedAt / schemaVersion — see dbio.js): the file finally knows which
  // app wrote it and when, so a future boot can warn before an OLDER app
  // ever saves over a NEWER archive's fields. main.js is the single
  // writer, so the stamp is always true; the renderer never sees these
  // keys (createSafeDb's whitelist drops them on load).
  fs.writeFileSync(tmp, JSON.stringify(stampDatabaseForSave(db, app.getVersion()), null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
};

// 1.9.1 — THE DOCUMENT HOUSE PRIMES ITSELF BEFORE THE WINDOW IS BORN.
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

// Must run before app is ready.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-resource',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      // 0.40.0 — CORS ENABLED: the renderer's huge viewer now FETCHES the
      // picture for its crop (a blob: copy can never taint a canvas), and
      // the stamp AUTO-hue derivation still loads with crossorigin — both
      // need the scheme to speak CORS properly (the handler already serves
      // ACAO:* on every image).
      corsEnabled: true,
    },
  },
]);

let mainWindow = null;
let mainUnsaved = false;

// 1.1.3 — THE UPDATE CHANNEL ("add auto update channel ... https://github.com/
// NuriDerBurrito/Burrito_GenDex"): the app asks GitHub for the repository's
// latest published release and compares it against its own version — that
// feed IS the channel. It is read-only, it never downloads or installs
// anything by itself (the release page opens in the browser at the user's
// hand), and it only ever runs when the renderer asks (the STABLE channel
// seat in Settings → Data → UPDATES, on launch + on demand). OFF never
// touches the network at all. The repo id lives here once; the package.json
// `repository` field and the CI workflow speak the same home.
const UPDATE_REPO = 'NuriDerBurrito/Burrito_GenDex';

// Numeric compare of dotted version strings ('1.2.10' vs '1.2.9'): each dot
// part compared as a NUMBER (so 10 > 9, never the string's '10' < '9');
// missing parts count as 0. Returns >0 when a is newer, <0 when b is.
const cmpVersions = (a, b) => {
  const pa = String(a || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
};

// net.fetch guarded by a hard timeout — Electron's net fetch is proxy-aware
// and offline-honest, but a hung connection must never hang the asker.
const fetchWithTimeout = (url, opts, ms) =>
  Promise.race([
    net.fetch(url, opts),
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

// 1.1.3 — FACTORY RESET's dead-man switch: once the reset has wiped the
// data, every later save is a no-op — an in-flight autosave or a quit-time
// save-and-close can never resurrect the database the user asked to erase.
// 1.1.4 — THE SWITCH IS A WINDOW, NOT A LIFE SENTENCE: it armed on the wipe
// and never cleared, and since the factory reset only RELOADS the renderer
// (window.location.reload), the main process — switch still thrown — went
// on silently ignoring every db:save for the rest of the session. The
// re-arm lives in db:load: the fresh renderer's first breath is the moment
// the new (empty) world begins, and saves are lawful again from there.
let factoryResetting = false;

const isPathInsideImages = (p) => {
  const rel = path.relative(IMAGES_PATH, p);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

const normalizeExt = (ext) => {
  const clean = String(ext || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const map = {
    png: '.png',
    jpg: '.jpg',
    jpeg: '.jpg',
    jpe: '.jpg',
    jfif: '.jpg',
    webp: '.webp',
    gif: '.gif',
    bmp: '.bmp',
    avif: '.avif',
    svg: '.svg',
    tiff: '.tiff',
    tif: '.tiff',
    ico: '.ico',
  };
  return map[clean] || '.png';
};

// Save a full image + a crisp thumbnail.
// - Thumbs are 480px wide (2x the largest card) at JPEG q92 — sharp at every
//   zoom level.
// - 0.33.0 — THE RENDERER'S CANVAS THUMB WINS FIRST ("make it so that the
//   outer thumbnail of the card is not the high quality of the image, so it
//   doesnt lag out when processing"): Electron's nativeImage only decodes
//   PNG/JPEG — a WEBP or AVIF import fell through to `thumb = file`, and the
//   grid decoded the FULL file for every card (the lag). The renderer now
//   draws its own 480px thumb through Chromium's decoder (it reads
//   every format the browser does) and ships it here as base64; only when
//   the renderer has no bitmap (main-side imports, odd sources) does the
//   nativeImage fallback run.
// - 0.40.0 — TRANSPARENCY LIVES ("also account for all image formats
//   including webp , transparency and so on"): the thumb carries its OWN
//   extension — the renderer's alpha scan flips see-through sources to
//   PNG thumbs (a JPEG would blacken every transparent pixel), and the
//   nativeImage fallback below does the same for alpha-capable formats.
//   image:delete cleans both `_thumb.jpg` and `_thumb.png`.
// - If the source is already small (never needs resizing), the ORIGINAL file
//   is referenced as its own thumb — no lossy re-encode, zero blur.
//
// 1.1.1 — THE PREVIEW TIER ("make it so that the card preview images would
// be a less quality version of the original image just so it doesnt lag
// when viewing the entire class"): every save also writes a PREV — a
// ~340px, softly-encoded copy that ONLY the card grid's covers ever read
// (the image viewer and the detail panel keep the thumb / the original).
// The prev builds from whatever decodes cheapest-first: the renderer's
// 480px thumb buffer when the renderer provided one (decoding a small
// JPEG beats decoding the original), else the original through
// nativeImage. Small sources (≤ PREV_WIDTH wide) get no prev — the thumb
// already decodes as cheap as a re-encode would — and undecodable formats
// simply skip the tier (the record's `prev` stays null and the card falls
// back to the thumb). Alpha-capable sources keep PNG prevs so
// transparency survives; everything else takes the soft JPEG.
const THUMB_WIDTH = 480;
const PREV_WIDTH = 340;
const PREV_JPEG_QUALITY = 68;
// formats that can carry alpha — their nativeImage thumbs encode PNG
const ALPHA_CAPABLE_EXTS = new Set(['.png', '.webp', '.gif', '.avif', '.svg', '.ico', '.tiff', '.bmp']);
const thumbExtOf = (ext) => (ext === '.png' ? '.png' : '.jpg');
// 1.3.2 — THE PREVIEW SYSTEM IS RETIRED ("just remove the preview system
// and options, just make it so the thumbnail is auto generated and thats
// it"): the AUTO PREVIEW GENERATION switch, the GENERATE PREVIEWS key and
// every verdict they spoke are GONE. The generation itself is not a choice
// anymore — every import builds its lightweight thumb + preview copies in
// the same breath it lands, always (the historical DEFAULT ON behavior,
// now the only behavior). Old databases may still carry a dead
// settings.autoPreviews key; it is simply never read.
// One prev build from any decodable buffer. Returns the filename written,
// 'small' when the source is already prev-sized (nothing lighter to make),
// or 'bad' when the buffer is empty / undecodable — saveImage keeps only
// real filenames; the generator counts the tags so a quiet library never
// reads as a failed one.
const writePrev = (name, buffer, ext) => {
  try {
    if (!buffer || !buffer.length) return 'bad';
    const img = nativeImage.createFromBuffer(buffer);
    if (img.isEmpty()) return 'bad';
    const size = img.getSize();
    if (!size.width || size.width <= PREV_WIDTH) return 'small'; // nothing lighter to make
    const resized = img.resize({ width: PREV_WIDTH });
    if (resized.isEmpty()) return 'bad';
    const lossless = ALPHA_CAPABLE_EXTS.has(normalizeExt(ext));
    const prevName = `${name}_prev${lossless ? '.png' : '.jpg'}`;
    fs.writeFileSync(
      path.join(IMAGES_PATH, prevName),
      lossless ? resized.toPNG() : resized.toJPEG(PREV_JPEG_QUALITY)
    );
    return prevName;
  } catch {
    return 'bad'; // the tier is optional — a null record just falls back to the thumb
  }
};
// 1.3.1 — THE THUMB BUILDER, EXTRACTED (the preview tier rework): the same
// nativeImage pass saveImage speaks (its step 2), pulled out so the
// GENERATE key can build the 480px tier on demand exactly the way the
// import path builds it. Returns the filename written, 'small' when the
// source is already thumb-sized (nothing lighter to make), or 'bad' when
// the buffer is undecodable. Alpha-capable sources keep PNG thumbs; the
// rest take the soft JPEG.
const writeThumb = (name, buffer, ext) => {
  try {
    if (!buffer || !buffer.length) return 'bad';
    const img = nativeImage.createFromBuffer(buffer);
    if (img.isEmpty()) return 'bad';
    const size = img.getSize();
    if (!size.width || size.width <= THUMB_WIDTH) return 'small';
    const resized = img.resize({ width: THUMB_WIDTH });
    if (resized.isEmpty()) return 'bad';
    const lossless = ALPHA_CAPABLE_EXTS.has(normalizeExt(ext));
    const thumbName = `${name}_thumb${lossless ? '.png' : '.jpg'}`;
    fs.writeFileSync(
      path.join(IMAGES_PATH, thumbName),
      lossless ? resized.toPNG() : resized.toJPEG(92)
    );
    return thumbName;
  } catch {
    return 'bad';
  }
};
const saveImage = (buffer, ext, thumbBase64 = null, thumbExt = null) => {
  const name = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const file = `${name}${normalizeExt(ext)}`;
  fs.mkdirSync(IMAGES_PATH, { recursive: true });
  fs.writeFileSync(path.join(IMAGES_PATH, file), buffer);
  let thumb = file;
  let prev = null;
  // 1.3.2 — the tiers ALWAYS build now (the switch is retired — see the
  // note above the builders): the thumbnail is auto generated, that is
  // the whole system.
  // 1) the renderer's canvas thumb — decodes everything Chromium does
  if (thumbBase64) {
    try {
      const tbuf = Buffer.from(String(thumbBase64), 'base64');
      if (tbuf.length > 0) {
        const thumbName = `${name}_thumb${thumbExtOf(thumbExt)}`;
        fs.writeFileSync(path.join(IMAGES_PATH, thumbName), tbuf);
        thumb = thumbName;
        // 1.1.1 — the prev builds from the DECODED THUMB (a 480px decode is
        // far cheaper than the original's), keeping the same extension law.
        // ('small' / 'bad' both land as NO prev — the card falls back to
        // the thumb.)
        const prevTry = writePrev(name, tbuf, thumbExt || ext);
        prev = typeof prevTry === 'string' && prevTry !== 'small' && prevTry !== 'bad' ? prevTry : null;
        return { file, thumb, prev };
      }
    } catch {
      /* fall through to the nativeImage pass */
    }
  }
  // 2) the nativeImage fallback (main-side imports, clipboard bitmaps) —
  //    PNG thumbs for alpha-capable sources, JPEG for the rest
  try {
    const img = nativeImage.createFromBuffer(buffer);
    if (!img.isEmpty()) {
      const size = img.getSize();
      const needsResize = size.width > THUMB_WIDTH;
      if (needsResize) {
        const resized = img.resize({ width: THUMB_WIDTH });
        if (!resized.isEmpty()) {
          const lossless = ALPHA_CAPABLE_EXTS.has(normalizeExt(ext));
          const thumbName = `${name}_thumb${lossless ? '.png' : '.jpg'}`;
          fs.writeFileSync(path.join(IMAGES_PATH, thumbName), lossless ? resized.toPNG() : resized.toJPEG(92));
          thumb = thumbName;
        }
      }
      // else: source is already thumb-sized or smaller — keep the original
      // file as the thumb. Re-encoding would only blur it.
      const prevTry2 = writePrev(name, buffer, ext);
      if (typeof prevTry2 === 'string' && !['small', 'bad'].includes(prevTry2)) prev = prevTry2;
    }
  } catch {
    /* thumb is optional; the full file already exists */
  }
  return { file, thumb, prev };
};

// (writeDb + rotateDbBackup live above, next to the paths they guard.)

// 1.1.6 — THE PRE-PAINT THEME PEEK ("the splash screen … fix it so it starts
// with the appropriate theme"): the native window's backgroundColor used to
// be a hard-coded dark, so on a light theme the very first sliver of window
// (and any frame the renderer hasn't painted yet) flashed dark before the
// theme-aware splash covered it. The renderer already replays the theme
// snapshot before its first paint (1.0.9) — this is the MAIN-side twin: at
// window creation the database on disk is peeked at (best-effort, sync,
// tiny) for its settings.theme + manual bg override, and the window is born
// in that shade. The map mirrors THEME_PRESETS' bg tokens (the theme ladder
// test pins the two together — see scripts/gendex_126_batch_dom.test.mjs);
// manual color overrides take precedence when present. Any miss (no db yet,
// unreadable json, unknown theme) falls back to the historical dark — the
// splash covers the whole window a frame later anyway.
const THEME_PRESET_BG = {
  zine: '#101014',
  burrito: '#120c1d',
  archive: '#e7dfc9',
  carbon: '#0e1012',
  moss: '#0f1308',
  ember: '#170f09',
  glacier: '#0c1114',
  ghost: '#0a0f1e',
  craft: '#2a2119',
  paper: '#efeae0',
  metal: '#150c10',
  mumei: '#E7F5F9',
  // 1.6.4 — numeix joins the peek map (the theme id's rename); mumei
  // stays: the peek reads the RAW database before any sanitizer walks it.
  numeix: '#E7F5F9',
};
const peekThemeBg = () => {
  // 1.9.1 — THE DOCUMENT HOUSE SPEAKS FIRST: primeNosqlArchive() has
  // already read the journal (and run whatever door the day demanded —
  // shelf, translation, JSON fold) before the window was born, so the
  // peek reads the raw settings section it cached — the same RAW
  // pre-sanitize word the peek always read, from the new seat. (Store
  // dark or nothing cached → the legacy JSON peek below, exactly as it
  // always was.)
  const fromHouse = peekSettingsBgOf(nosqlState.ready ? nosqlState.peekSettings : null);
  if (fromHouse) return fromHouse;
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db || typeof db !== 'object') return null;
    return peekSettingsBgOf(db.settings);
  } catch {
    return null;
  }
};
const peekSettingsBgOf = (settings) => {
  if (!settings || typeof settings !== 'object') return null;
  const colors = settings.colors;
  const manual = colors && typeof colors === 'object' ? colors.bg : null;
  if (typeof manual === 'string' && /^#[0-9a-fA-F]{6}$/.test(manual)) return manual;
  const theme = settings.theme;
  return (typeof theme === 'string' && THEME_PRESET_BG[theme]) || null;
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    // 1.6.0 — the no-database-yet fallback is ZINE PUNK's own ground (the
    // default theme since 1.6.0): a fresh install's first sliver of window
    // paints the cloth its database is about to speak.
    backgroundColor: peekThemeBg() || '#101014',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      // 1.7.7 — THE SPELLCHECK ENGINE IS OFF AT THE DOOR ("remove the red
      //   underline under words that are misspelled"): the engine paints its
      //   own squiggle under every word it disagrees with, a foreign voice
      //   no cloth ever asked for. Killed here (the renderer's fields also
      //   carry spellCheck={false} as the belt under the braces).
      spellcheck: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // 0.32.0 — the NATIVE right-click menu is RETIRED ("make the selection
  // text context window stylized like the rest"): every editable field,
  // text selection and picture now speaks the app's own styled menu,
  // built by the renderer's contextmenu listener (App.jsx) — cut / copy /
  // paste / delete / select-all run through it, and paste routes back
  // here through the clipboard-paste channel. There is no native fallback
  // anymore, so nothing OS-styled can ever pop over the app's own pills.

  mainWindow.on('maximize', () => mainWindow?.webContents?.send('window-maximized'));
  mainWindow.on('unmaximize', () => mainWindow?.webContents?.send('window-unmaximized'));

  mainWindow.on('close', (event) => {
    if (mainUnsaved && mainWindow && !mainWindow.isDestroyed()) {
      event.preventDefault();
      mainWindow.webContents.send('prompt-unsaved');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const registerIpc = () => {
  ipcMain.handle('db:load', () => {
    try {
      fs.mkdirSync(IMAGES_PATH, { recursive: true });
      // 1.9.1 — THE DOCUMENT HOUSE ANSWERS THE BOOT. The journal is read
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
      // (engine down — the belt under the braces) the JSON ladder, exactly
      // as it always was:
      // 1.5.5 — THE SALVAGE LADDER OWNS THE BOOT (the compatibility
      // report): the old read was existsSync -> JSON.parse, and EVERY
      // casualty — a BOM a text editor left on the file, a write cut
      // short by a power loss, trailing junk, disk damage — fell into
      // the same silent catch as "no file at all", so the app opened a
      // DEFAULT library and the autosave buried the user's archive
      // minutes later. The ladder (dbio.js) answers softly: the file
      // direct, the file repaired, the staged .tmp, then the backup
      // shelf newest-first. Only a seat where NOTHING parsed ends at
      // 'corrupt' — and then the broken file is SET ASIDE (renamed,
      // never overwritten) before any fresh start exists that could
      // destroy it, and the renderer is told the whole story so the
      // user reads it in the boot's verdicts instead of a silent
      // default library.
      const read = readDatabaseFile(DB_IO, {
        dbFile: DB_FILE,
        tmpFile: `${DB_FILE}.tmp`,
        backupDir: BACKUP_DIR,
      });
      let db = read.db;
      let status = read.status;
      let corruptSetAside = '';
      if (status === 'corrupt') {
        // Evidence first: the unreadable file keeps its bytes next to
        // the shelf (gendex_db.corrupt-<stamp>.json). Best-effort — a
        // refused rename leaves the file in place, and the renderer is
        // still told the truth (it never saves silently over a corrupt
        // seat without the user having read why the library is empty).
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const asideName = `gendex_db.corrupt-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
        corruptSetAside = setAsideCorruptDb(DB_IO, DB_FILE, asideName) || '';
        db = null;
      }
      // 1.1.4 — THE DEAD-MAN SWITCH RE-ARMS ON THE FRESH BOOT (see the
      // factoryResetting note above its declaration): db:load is the FIRST
      // call every renderer boot makes, and the only db:load that can
      // arrive AFTER a factory reset is the fresh session's own — the old
      // renderer died with its reload, and any save it had in flight was
      // handled (or dropped) before the wipe ever ran. Without this
      // re-arm, the switch stayed thrown for the REST OF THE APP'S LIFE:
      // every save after a factory reset silently no-opped while the
      // renderer kept toasting "Saved ✓" — the archive rebuilt itself into
      // a world that could never persist (the 1.1.4 save report).
      factoryResetting = false;
      return {
        db,
        imagesPath: IMAGES_PATH,
        status,
        fromAppVersion: read.fromAppVersion || '',
        recoveredFrom: read.recoveredFrom || '',
        corruptSetAside,
      };
    } catch {
      return { db: null, imagesPath: IMAGES_PATH, status: 'missing', fromAppVersion: '', recoveredFrom: '', corruptSetAside: '' };
    }
  });

  ipcMain.handle('db:save', (_event, db) => {
    try {
      writeDb(db);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  });

  ipcMain.handle('save-and-close', (_event, db) => {
    try {
      writeDb(db);
    } catch {
      /* best effort — closing either way */
    }
    mainUnsaved = false;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    return { ok: true };
  });

  ipcMain.on('force-close', () => {
    mainUnsaved = false;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  });

  ipcMain.on('send-unsaved-state', (_event, unsaved) => {
    mainUnsaved = !!unsaved;
  });

  ipcMain.on('window-control', (_event, action) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (action === 'minimize') {
      mainWindow.minimize();
    } else if (action === 'maximize') {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    } else if (action === 'close') {
      mainWindow.close();
    }
  });

  // 1.2.7 — THE STATUS STRIP'S MANUAL MOVE (see StatusText.jsx): the top
  // toolbar's status strip is a no-drag hole in the titlebar's drag region
  // (it must keep its hover-freeze and press-to-skip, which app-region drag
  // would swallow) — so a press that TRAVELS there asks the main process to
  // move the window instead. 'begin' captures the cursor-to-window offset
  // and runs a ~60Hz follow loop (screen.getCursorScreenPoint is the source
  // of truth — no renderer round-trips per step); 'end' stops it. A
  // maximized window never manual-drags (nothing to move), and a second
  // 'begin' while a move lives is a no-op — one loop per press, whatever
  // the renderer does next. Every end path in the renderer (release,
  // cancel, lost capture, blur, unmount) speaks 'end', so the loop cannot
  // outlive its press.
  let manualDragTimer = 0;
  const stopManualDrag = () => {
    if (manualDragTimer) {
      clearTimeout(manualDragTimer);
      manualDragTimer = 0;
    }
  };
  ipcMain.on('window-manual-drag', (_event, state) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      stopManualDrag();
      return;
    }
    if (state === 'begin') {
      if (manualDragTimer || mainWindow.isMaximized()) return;
      const cursor0 = screen.getCursorScreenPoint();
      const pos0 = mainWindow.getPosition();
      const offX = cursor0.x - pos0[0];
      const offY = cursor0.y - pos0[1];
      const step = () => {
        manualDragTimer = 0;
        if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMaximized()) {
          stopManualDrag();
          return;
        }
        const c = screen.getCursorScreenPoint();
        mainWindow.setPosition(c.x - offX, c.y - offY);
        manualDragTimer = setTimeout(step, 16);
      };
      step();
    } else {
      stopManualDrag();
    }
  });
  // the loop never outlives the window it moves. NOTE: the ipc handlers
  // register at module scope, BEFORE the window exists — a mainWindow.on
  // listener here would throw on null (the 1.2.7 boot check caught exactly
  // that); the app-level hooks are the safe seats, and the loop's own step
  // re-checks the window every tick anyway.
  app.on('before-quit', stopManualDrag);
  app.on('window-all-closed', stopManualDrag);

  ipcMain.on('open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle('clipboard-read-text', () => clipboard.readText());
  ipcMain.handle('clipboard-write-text', (_event, text) => {
    clipboard.writeText(String(text ?? ''));
  });

  // 0.30.0 — read the clipboard's IMAGE for the manual PASTE keys (the
  // stage's PASTE key, the creation window's paste tile, the context
  // menu's Paste item). Returns { base64, ext } or null when the clipboard
  // holds no image — the renderer turns that into a quiet no-op.
  // 0.32.0 — THE MULTI-STRATEGY READ ("paste button isnt working even if i
  // have a png copied, make it support all image types and detect them
  // well"). clipboard.readImage() only sees BITMAP data (screenshots,
  // copies made inside browsers/editors) — an image FILE copied in the OS
  // file manager is a FILE LIST (Explorer: the FileNameW/FileName shell
  // formats; Finder: a public.file-url), and several Windows apps put the
  // lossless "PNG" format on the clipboard as a buffer. The old handler
  // saw none of those — "no image" for a clipboard that clearly held
  // one. The hunt now runs, in order:
  //   1. the native bitmap (readImage — screenshots, browser copies)
  //   2. Windows copied FILES (FileNameW UTF-16, then FileName ANSI)
  //   3. the raw Windows "PNG" clipboard format
  //   4. macOS Finder file copies (public.file-url)
  //   5. the Linux image/png buffer
  // Copied FILES keep their original bytes and extension — PNG, JPG,
  // WEBP, GIF, BMP, AVIF, TIFF, ICO, SVG all survive as themselves; raw
  // buffers are typed by MAGIC BYTES (sniffImageExt), never by trusting
  // a name.
  const IMAGE_FILE_RE = /\.(png|jpe?g|jpe|jfif|webp|gif|bmp|avif|tiff?|svg|ico)$/i;

  // Type a buffer by its signature — png/jpg/gif/bmp/webp/tiff/ico/avif
  // (the ISO-BMFF ftyp brand) and a text-leading SVG. Returns null when
  // nothing matches.
  const sniffImageExt = (buf) => {
    try {
      if (!buf || buf.length < 12) return null;
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return '.png';
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
      if (buf.toString('ascii', 0, 3) === 'GIF') return '.gif';
      if (buf[0] === 0x42 && buf[1] === 0x4d) return '.bmp';
      if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return '.webp';
      if (
        (buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a) ||
        (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a)
      )
        return '.tiff';
      if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return '.ico';
      if (buf.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(buf.toString('ascii', 8, 12))) return '.avif';
      const head = buf.toString('utf8', 0, Math.min(buf.length, 512)).trim();
      if (head.startsWith('<')) return '.svg';
      return null;
    } catch {
      return null;
    }
  };

  // Read one copied image FILE from anywhere on disk (the user's own
  // clipboard named it — same trust level as the import dialog's picked
  // paths). Keeps the original bytes; falls back to signature typing when
  // the name carries no usable extension.
  const readImageFileRecord = (filePath) => {
    try {
      const p = path.resolve(String(filePath || ''));
      if (!p || !fs.existsSync(p) || !fs.statSync(p).isFile()) return null;
      const buffer = fs.readFileSync(p);
      if (!buffer.length) return null;
      const ext = path.extname(p).toLowerCase();
      return {
        base64: buffer.toString('base64'),
        ext: IMAGE_FILE_RE.test(ext) ? ext : sniffImageExt(buffer) || '.png',
      };
    } catch {
      return null;
    }
  };

  ipcMain.handle('clipboard-read-image', () => {
    // 1) the native bitmap
    try {
      const img = clipboard.readImage();
      if (img && !img.isEmpty()) return { base64: img.toPNG().toString('base64'), ext: '.png' };
    } catch {
      /* keep hunting */
    }
    // 2) Windows: image FILES copied in Explorer (a file list, not a
    //    bitmap — the old handler's blind spot). FileNameW is UTF-16,
    //    FileName the legacy ANSI twin; each may carry several
    //    NUL-separated paths.
    if (process.platform === 'win32') {
      for (const fmt of ['FileNameW', 'FileName']) {
        try {
          const buf = clipboard.readBuffer(fmt);
          if (!buf || !buf.length) continue;
          const decoded = fmt === 'FileNameW' ? buf.toString('utf16le') : buf.toString('latin1');
          const paths = decoded.split('\0').map((s) => s.trim()).filter(Boolean);
          for (const p of paths) {
            if (!IMAGE_FILE_RE.test(p)) continue;
            const rec = readImageFileRecord(p);
            if (rec) return rec;
          }
        } catch {
          /* next format */
        }
      }
      // 3) the raw "PNG" format (browsers, the Snipping tool…)
      try {
        const png = clipboard.readBuffer('PNG');
        if (png && png.length > 8 && png[0] === 0x89 && png[1] === 0x50) {
          return { base64: png.toString('base64'), ext: '.png' };
        }
      } catch {
        /* keep hunting */
      }
    }
    // 4) macOS: Finder file copies
    if (process.platform === 'darwin') {
      try {
        const fileUrl = clipboard.read('public.file-url');
        const p = decodeURIComponent(String(fileUrl || '').trim()).replace(/^file:\/\//i, '');
        if (p && IMAGE_FILE_RE.test(p)) {
          const rec = readImageFileRecord(p);
          if (rec) return rec;
        }
      } catch {
        /* keep hunting */
      }
    }
    // 5) Linux: the image/png buffer several clipboard managers carry
    try {
      const png = clipboard.readBuffer('image/png');
      if (png && png.length > 8 && png[0] === 0x89 && png[1] === 0x50) {
        return { base64: png.toString('base64'), ext: '.png' };
      }
    } catch {
      /* nothing anywhere */
    }
    return null;
  });

  // 0.33.0 shipped a `clipboard-has-image` boolean probe for the renderer
  // to POLL; 0.34.0 removed the polling ("remove the clipboard image ready
  // button, i dont want you to always check it, check it only when pressing
  // on paste") and with it the probe — the READ itself is the check now.

  // 0.32.0 — PASTE INTO THE FOCUSED FIELD (the stylized text menu's Paste
  // item). webContents.paste() runs the browser's own paste against
  // whatever the renderer currently has focused — exactly what the OS
  // menu's paste role did, so rich boxes keep their plain-text-only paste
  // rule (they own their paste event) and plain fields insert at the caret.
  ipcMain.on('clipboard-paste', () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.paste();
    } catch {
      /* quiet — nothing focused, nothing to do */
    }
  });

  // 0.32.0 — COPY A STORED IMAGE FILE to the clipboard (the stylized menu
  // inside windows, where pictures used to offer the native Copy Image).
  ipcMain.handle('clipboard-write-image-file', (_event, filename) => {
    try {
      const name = path.basename(String(filename || ''));
      if (!name || name === '.' || name === '..') return { ok: false };
      const full = path.resolve(IMAGES_PATH, name);
      if (!isPathInsideImages(full) || !fs.existsSync(full)) return { ok: false };
      const img = nativeImage.createFromPath(full);
      if (img.isEmpty()) return { ok: false };
      clipboard.writeImage(img);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  // 0.30.0 — open the app's data / images / backups folders in the OS file
  // browser (Settings → Data & System).
  ipcMain.on('open-data-folder', (_event, which) => {
    try {
      const target =
        which === 'images' ? IMAGES_PATH : which === 'backups' ? BACKUP_DIR : app.getPath('userData');
      fs.mkdirSync(target, { recursive: true });
      shell.openPath(target);
    } catch {
      /* quiet — the renderer's status line already said what it tried */
    }
  });

  // 0.30.0 — clear the renderer's cache (Settings → Data & System).
  ipcMain.handle('clear-cache', async () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        await mainWindow.webContents.session.clearCache();
        return { ok: true };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  });

  ipcMain.handle('image:import-files', async () => {
    try {
      const res = await dialog.showOpenDialog(mainWindow, {
        title: 'Import images',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'jfif', 'webp', 'gif', 'bmp', 'avif', 'svg', 'tiff', 'tif', 'ico'] },
        ],
      });
      if (res.canceled || !res.filePaths?.length) return [];
      fs.mkdirSync(IMAGES_PATH, { recursive: true });
      const records = [];
      for (const filePath of res.filePaths) {
        try {
          const buffer = fs.readFileSync(filePath);
          records.push(saveImage(buffer, path.extname(filePath)));
        } catch {
          /* skip unreadable file */
        }
      }
      return records;
    } catch {
      return [];
    }
  });

  ipcMain.handle('image:save-buffer', (_event, base64, ext, thumbBase64, thumbExt) => {
    try {
      fs.mkdirSync(IMAGES_PATH, { recursive: true });
      const buffer = Buffer.from(String(base64 || ''), 'base64');
      if (!buffer.length) return null;
      return saveImage(buffer, ext, thumbBase64 || null, thumbExt || null);
    } catch {
      return null;
    }
  });

  // 0.31.0 — DUPLICATE support (the context menu's "Duplicate" on a card):
  // a duplicated character must OWN its image files, or deleting a version
  // image on the copy would unlink the original's art. This copies one
  // stored image (full file + a fresh thumb) and returns the new record —
  // the same { file, thumb } shape image:save-buffer hands back.
  ipcMain.handle('image:copy', (_event, filename) => {
    try {
      const name = path.basename(String(filename || ''));
      if (!name || name === '.' || name === '..') return null;
      const full = path.resolve(IMAGES_PATH, name);
      if (!isPathInsideImages(full) || !fs.existsSync(full)) return null;
      const buffer = fs.readFileSync(full);
      return saveImage(buffer, path.extname(name));
    } catch {
      return null;
    }
  });

  ipcMain.handle('image:delete', (_event, filename) => {
    try {
      const name = path.basename(String(filename || ''));
      if (!name || name === '.' || name === '..') return { ok: false };
      const full = path.resolve(IMAGES_PATH, name);
      if (!isPathInsideImages(full)) return { ok: false };
      // 0.40.0 — BOTH thumb flavors ride the cleanup: thumbs can be .jpg
      // (opaque) or .png (see-through) now. 1.1.1 — and both PREV flavors
      // with them (the preview tier's files never outlive their source).
      const base = name.replace(/\.[^.]+$/, '');
      for (const candidate of [
        name,
        `${base}_thumb.jpg`,
        `${base}_thumb.png`,
        `${base}_prev.jpg`,
        `${base}_prev.png`,
      ]) {
        const target = path.join(IMAGES_PATH, candidate);
        if (fs.existsSync(target)) {
          try {
            fs.unlinkSync(target);
          } catch {
            /* quiet */
          }
        }
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  // 1.3.2 — THE PREVIEW GENERATOR IS RETIRED with the whole preview
  // system (see the builders' note above): thumbnails and previews build
  // automatically at import, always — there is no GENERATE key, no
  // verdicts, no progress stream. The IPC channel is gone with it; the
  // old preload's callers are gone too.

  // ==========================================================================
  // 1.1.2 — THE LIBRARY PORTABILITY TIER ("add library import/export, also
  // include logic to tie them to their images as it claims a zip file, and
  // let it also read the zip file and extract it to import the data").
  // An archive is ONE .zip: gendex_db.json at the root plus every referenced
  // image (originals, thumbs, prevs, stamp art) under images/ — the whole
  // library, self-contained, movable to another machine by hand. The format
  // is written and read by a MINIMAL ZIP ENGINE right here (node's own zlib:
  // deflateRaw for compression, a 8-line CRC32 table for the checksums — no
  // dependency, no native module, nothing the forge build has to carry).
  // --------------------------------------------------------------------------

  // CRC32 (the zip checksum) — a 256-entry table, the classic polynomial.
  let CRC_TABLE = null;
  const crc32Of = (buf) => {
    if (!CRC_TABLE) {
      CRC_TABLE = new Uint32Array(256);
      for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        CRC_TABLE[n] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i += 1) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const dosTimeOf = (d) => ({
    time: ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f),
    date: (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0xf) << 5) | (d.getDate() & 0x1f),
  });

  // zipBuild([{ name, data }]) — one central directory, DEFLATE per entry,
  // sizes and CRCs recorded per spec. Everything little-endian, as zip says.
  const zipBuild = (entries) => {
    const chunks = [];
    const central = [];
    let offset = 0;
    const stamp = dosTimeOf(new Date());
    for (const entry of entries) {
      const nameBuf = Buffer.from(entry.name, 'utf8');
      const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), 'utf8');
      const crc = crc32Of(data);
      const deflated = zlib.deflateRawSync(data, { level: 6 });
      const useDeflate = deflated.length < data.length;
      const payload = useDeflate ? deflated : data;
      const method = useDeflate ? 8 : 0;
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4); // version needed
      local.writeUInt16LE(0, 6); // flags
      local.writeUInt16LE(method, 8);
      local.writeUInt16LE(stamp.time, 10);
      local.writeUInt16LE(stamp.date, 12);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(payload.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(nameBuf.length, 26);
      local.writeUInt16LE(0, 28);
      chunks.push(local, nameBuf, payload);
      const cen = Buffer.alloc(46);
      cen.writeUInt32LE(0x02014b50, 0);
      cen.writeUInt16LE(20, 4); // version made by
      cen.writeUInt16LE(20, 6); // version needed
      cen.writeUInt16LE(0, 8);
      cen.writeUInt16LE(method, 10);
      cen.writeUInt16LE(stamp.time, 12);
      cen.writeUInt16LE(stamp.date, 14);
      cen.writeUInt32LE(crc, 16);
      cen.writeUInt32LE(payload.length, 20);
      cen.writeUInt32LE(data.length, 24);
      cen.writeUInt16LE(nameBuf.length, 28);
      cen.writeUInt16LE(0, 30); // extra
      cen.writeUInt16LE(0, 32); // comment
      cen.writeUInt16LE(0, 34); // disk
      cen.writeUInt16LE(0, 36); // internal attrs
      cen.writeUInt32LE(0, 38); // external attrs
      cen.writeUInt32LE(offset, 42);
      central.push(Buffer.concat([cen, nameBuf]));
      offset += local.length + nameBuf.length + payload.length;
    }
    const centralBuf = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralBuf.length, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);
    return Buffer.concat([...chunks, centralBuf, end]);
  };

  // zipRead(buf) — walks the END OF CENTRAL DIRECTORY record backwards, then
  // each central entry, inflating what needs it. Handles STORE and DEFLATE,
  // skips directories, and refuses pathological entries (a 2GB "image").
  const zipRead = (buf) => {
    const out = [];
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i -= 1) {
      if (buf.readUInt32LE(i) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error('not a zip archive');
    const count = buf.readUInt16LE(eocd + 10);
    let ptr = buf.readUInt32LE(eocd + 16);
    for (let n = 0; n < count; n += 1) {
      if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('corrupt central directory');
      const method = buf.readUInt16LE(ptr + 10);
      const compSize = buf.readUInt32LE(ptr + 20);
      const rawSize = buf.readUInt32LE(ptr + 24);
      const nameLen = buf.readUInt16LE(ptr + 28);
      const extraLen = buf.readUInt16LE(ptr + 30);
      const commentLen = buf.readUInt16LE(ptr + 32);
      const localOff = buf.readUInt32LE(ptr + 42);
      const name = buf.slice(ptr + 46, ptr + 46 + nameLen).toString('utf8');
      ptr += 46 + nameLen + extraLen + commentLen;
      if (name.endsWith('/') || rawSize > 400 * 1024 * 1024) continue;
      if (localOff + 30 > buf.length || buf.readUInt32LE(localOff) !== 0x04034b50) continue;
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const payload = buf.slice(dataStart, dataStart + compSize);
      if (method === 0) out.push({ name, data: Buffer.from(payload) });
      else if (method === 8) out.push({ name, data: zlib.inflateRawSync(payload) });
      else out.push({ name, data: null }); // unknown method — skipped by name
    }
    return out;
  };

  // Every image filename a db references: characters' versions' images
  // (file/thumb/prev) plus the stamp library's art. The one collector the
  // export and the import share.
  const collectImageFiles = (db) => {
    const names = new Set();
    for (const ch of db?.characters || []) {
      for (const v of ch?.versions || []) {
        for (const img of v?.images || []) {
          for (const key of ['file', 'thumb', 'prev']) {
            const n = path.basename(String(img?.[key] || ''));
            if (n && n !== '.' && n !== '..') names.add(n);
          }
        }
      }
      for (const s of ch?.stamps || []) {
        const n = path.basename(String(s?.image || ''));
        if (n && n !== '.' && n !== '..') names.add(n);
      }
    }
    for (const s of db?.stamps || []) {
      // 1.1.4 — the stamp library's own PREVIEW files ride the archive too
      // (the generator builds them now; a db that references them travels
      // with them, exactly like a character image's prev).
      for (const key of ['image', 'prev']) {
        const n = path.basename(String(s?.[key] || ''));
        if (n && n !== '.' && n !== '..') names.add(n);
      }
    }
    return [...names];
  };



  // EXPORT: the db (as the renderer holds it — unsaved edits included) plus
  // every referenced image that still exists on disk. Missing files are
  // counted, not fatal (an archive can only carry what it has).
  ipcMain.handle('library:export', async (_event, dbJson) => {
    try {
      const stamp = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const defaultName = `Burrito_GenDex_Library_${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}.zip`;
      const picked = await dialog.showSaveDialog(mainWindow, {
        title: 'Export the library',
        defaultPath: defaultName,
        filters: [{ name: 'Burrito GenDex library', extensions: ['zip'] }],
      });
      if (picked.canceled || !picked.filePath) return { ok: false, canceled: true };
      const db = JSON.parse(typeof dbJson === 'string' ? dbJson : JSON.stringify(dbJson || {}));
      const entries = [{ name: 'gendex_db.json', data: JSON.stringify(stampDatabaseForSave(db, app.getVersion()), null, 2) }];
      let missing = 0;
      for (const name of collectImageFiles(db)) {
        const full = path.resolve(IMAGES_PATH, name);
        if (!isPathInsideImages(full) || !fs.existsSync(full)) {
          missing += 1;
          continue;
        }
        entries.push({ name: `images/${name}`, data: fs.readFileSync(full) });
      }
      const zip = zipBuild(entries);
      fs.writeFileSync(picked.filePath, zip);
      return { ok: true, path: picked.filePath, images: entries.length - 1, missing, bytes: zip.length };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });

  // IMPORT, step one: pick + read + validate — NOTHING is written yet. The
  // renderer gets the counts (for the confirm window) and the parsed db.
  ipcMain.handle('library:import-pick', async () => {
    try {
      const picked = await dialog.showOpenDialog(mainWindow, {
        title: 'Import a library archive',
        filters: [{ name: 'Burrito GenDex library', extensions: ['zip'] }],
        properties: ['openFile'],
      });
      if (picked.canceled || !picked.filePaths?.length) return { ok: false, canceled: true };
      const file = picked.filePaths[0];
      const entries = zipRead(fs.readFileSync(file));
      const dbEntry = entries.find((e) => e.name === 'gendex_db.json' || e.name.endsWith('/gendex_db.json'));
      if (!dbEntry || !dbEntry.data) return { ok: false, error: 'The archive has no gendex_db.json inside: not a Burrito GenDex library.' };
      // 1.5.5 — the archive's db rides the SAME door as the boot (dbio's
      // parseDbText: BOM stripped, junk ends repaired). An exported
      // library hand-edited, re-zipped by a picky tool, or grown a BOM
      // reads whole instead of failing the import outright.
      const hit = parseDbText(dbEntry.data.toString('utf8'));
      if (!hit) return { ok: false, error: 'The archive has a gendex_db.json inside, but it cannot be read: the file is damaged.' };
      const db = hit.db;
      const images = entries.filter((e) => e.data && /(^|\/)images\//.test(e.name) && !e.name.endsWith('/'));
      return {
        ok: true,
        path: file,
        db,
        images: images.map((e) => ({ name: path.basename(e.name), data: e.data })),
        counts: {
          characters: (db.characters || []).length,
          classes: (db.classes || []).length,
          tags: (db.tags || []).length,
          stamps: (db.stamps || []).length,
          images: images.length,
        },
      };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });

  // IMPORT, step two: the renderer has the user's verdict (merge or
  // replace) — write every image file (renaming on collision, reporting the
  // remap so the renderer can repoint the incoming db) and hand back the
  // records + the file map. The db merge/replace itself is renderer-side
  // (uuid lives there; one mutateDb write, one undo step).
  ipcMain.handle('library:import-commit', (_event, payload) => {
    try {
      const images = Array.isArray(payload?.images) ? payload.images : [];
      const fileMap = {};
      fs.mkdirSync(IMAGES_PATH, { recursive: true });
      for (const img of images) {
        const base = path.basename(String(img?.name || ''));
        if (!base || base === '.' || base === '..' || !Buffer.isBuffer(img?.data) || !img.data.length) continue;
        const target = path.resolve(IMAGES_PATH, base);
        if (!isPathInsideImages(target)) continue;
        if (fs.existsSync(target)) {
          // COLLISION: a fresh unique name, the saveImage convention —
          // imported art never overwrites a local file.
          const ext = path.extname(base) || '.png';
          const fresh = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
          fs.writeFileSync(path.join(IMAGES_PATH, fresh), img.data);
          fileMap[base] = fresh;
        } else {
          fs.writeFileSync(target, img.data);
          fileMap[base] = base;
        }
      }
      return { ok: true, fileMap, written: Object.keys(fileMap).length };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });

  // 1.1.3 — THE UPDATE CHANNEL ASK: GitHub's latest release for the repo,
  // compared against this build's own version. Verdict shapes:
  //   { ok: true, newer: true/false, latest, current, url, publishedAt }
  //   { ok: true, none: true }                      — the repo has no releases yet
  //   { ok: false, error }                           — offline / rate-limited / timeout
  // The renderer owns every word the user reads; main only fetches + judges.
  ipcMain.handle('updates:check', async () => {
    try {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${UPDATE_REPO}/releases/latest`,
        {
          headers: {
            // GitHub's API refuses requests without a User-Agent.
            'User-Agent': 'Burrito-GenDex-updater',
            Accept: 'application/vnd.github+json',
          },
        },
        10000
      );
      if (res.status === 404) return { ok: true, none: true, current: app.getVersion() };
      if (res.status === 403 || res.status === 429) {
        return { ok: false, error: 'GitHub is rate-limiting this connection: try again in a little while.', current: app.getVersion() };
      }
      if (!res.ok) return { ok: false, error: `GitHub answered ${res.status}.`, current: app.getVersion() };
      const rel = await res.json();
      const tag = String(rel && rel.tag_name ? rel.tag_name : '').trim();
      if (!tag) return { ok: true, none: true, current: app.getVersion() };
      const latest = tag.replace(/^v/i, '');
      const current = app.getVersion();
      return {
        ok: true,
        newer: cmpVersions(latest, current) > 0,
        latest,
        current,
        name: String(rel.name || tag),
        url: String(rel.html_url || `https://github.com/${UPDATE_REPO}/releases/latest`),
        publishedAt: rel.published_at || null,
      };
    } catch {
      return { ok: false, error: 'Could not reach GitHub: you may be offline.', current: app.getVersion() };
    }
  });

  // 1.1.3 — FACTORY RESET ("pressing on it would reset everything"): the
  // one key that returns the app to the day it was first installed. In one
  // pass, best-effort per surface (any single failure is reported, never
  // thrown): the database file, EVERY imported image / thumb / preview /
  // stamp file, and every save backup. The renderer separately clears its
  // own localStorage (theme snapshot included) and reloads — the next boot
  // finds no database anywhere and builds the fresh default one. The
  // dead-man switch above keeps any straggler save from writing the old
  // world back during that window.
  ipcMain.handle('data:factory-reset', () => {
    try {
      factoryResetting = true;
      let removedImages = 0;
      let removedBackups = 0;
      try {
        if (fs.existsSync(IMAGES_PATH)) {
          removedImages = fs.readdirSync(IMAGES_PATH).length;
          fs.rmSync(IMAGES_PATH, { recursive: true, force: true });
        }
      } catch {
        /* best-effort — reported as far as it got */
      }
      try {
        if (fs.existsSync(BACKUP_DIR)) {
          removedBackups = fs.readdirSync(BACKUP_DIR).length;
          fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
        }
      } catch {
        /* best-effort */
      }
      try {
        fs.rmSync(DB_FILE, { force: true });
      } catch {
        /* best-effort */
      }
      // 1.8.9 — THE HOUSE DIES WITH THE REST: the SQLite seat, its staged
      // .tmp, and the house's own memory (the import flag lived INSIDE the
      // file, so a library dropped in after a reset is folded in once
      // again — recognized, added, never re-imported).
      try {
        fs.rmSync(SQLITE_FILE, { force: true });
      } catch {
        /* best-effort */
      }
      try {
        fs.rmSync(`${SQLITE_FILE}.tmp`, { force: true });
      } catch {
        /* best-effort */
      }
      // 1.9.1 — THE DOCUMENT HOUSE DIES WITH THE REST: the journal seat,
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
      fs.mkdirSync(IMAGES_PATH, { recursive: true });
      return { ok: true, removedImages, removedBackups };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  });
};

const registerProtocol = () => {
  protocol.handle('local-resource', async (request) => {
    // URLs arrive as local-resource://l/<percent-encoded absolute path>.
    // Keeping the whole path in the URL *path* portion (with a fixed dummy
    // host) round-trips exactly: hosts get re-parsed and can eat drive
    // colons or spaces (e.g. ".../Burrito GenDex/..."), paths do not.
    let rawPath = String(request.url).replace(/^local-resource:\/\/[^/]*\//, '');
    // Tolerate legacy whole-path-as-host URLs.
    if (!rawPath) rawPath = String(request.url).replace(/^local-resource:\/*/i, '');
    let p = decodeURIComponent(rawPath);
    if (process.platform === 'win32' && p.match(/^[a-zA-Z][\\/]/)) {
      p = p.charAt(0) + ':' + p.slice(1); // drive-colon fix
    }
    const normalized = path.normalize(p);
    const rel = path.relative(IMAGES_PATH, normalized);
    const isAllowed = !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
    if (!isAllowed) return new Response('Forbidden', { status: 403 });
    if (!fs.existsSync(normalized)) return new Response('Not Found', { status: 404 });
    // 0.22.0 — CORS headers on every image: the renderer's AUTO-hue
    // derivation reads stamp pixels through a canvas (dominantColorOf loads
    // the image with crossOrigin='anonymous'); without ACAO the canvas
    // would be tainted and getImageData would throw, so the AUTO hue could
    // never derive. The privileged scheme + these headers keep that read
    // clean while every other load stays exactly as before.
    const upstream = await net.fetch(url.pathToFileURL(normalized).toString());
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...Object.fromEntries(upstream.headers.entries()), 'Access-Control-Allow-Origin': '*' },
    });
  });
};

app.whenReady().then(async () => {
  registerProtocol();
  // 1.9.1 — THE DOCUMENT HOUSE PRIMES ITSELF BEFORE THE WINDOW IS BORN:
  // the journal is read (one file, no engine to wake), the doors decide,
  // and the theme peek reads the library that will actually paint. The
  // wasm compile the SQLite era paid on every boot is paid only by the
  // one-time translation now — after it, boots never touch an engine at
  // all.
  await primeNosqlArchive();
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
