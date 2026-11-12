// 1.5.5 — THE ARCHIVE'S OWN DOOR (the compatibility report: "the old
// database i was working on for some reason wasnt updated in the latest
// patch, it just showed me default, fix that, as you must always have
// compatibility with the past versions").
//
// For versions now the whole archive rode ONE unguarded read: db:load did
// existsSync -> JSON.parse -> hand it back, and ANY hiccup — a UTF-8 BOM a
// text editor left on the file, a write cut short by a power loss, a
// hand-edited trailing comma, a file the disk mis-served — fell into the
// SAME silent catch as "no file at all". The renderer then happily painted
// the fresh-install default, and the autosave buried the user's only copy
// under it minutes later. The door said "fresh start" to every casualty.
//
// This module is the new door, and it is PURE on purpose: no node imports
// at the top level (the renderer bundles this file too — it only ever
// touches the pure comparators there), while the file-touching readers
// take an injected { fs, join } bundle so main.js and the test batteries
// can drive them against real or staged folders.
//
// THE SALVAGE LADDER (readDatabaseFile), softest rung first:
//   1. gendex_db.json, parsed with the BOM stripped and trailing junk
//      trimmed (a direct read);
//   2. the same text brace-sliced — first '{' to the last '}' — which
//      recovers a file that merely grew junk at either end (editors love
//      adding both BOMs and trailing newlines/notes);
//   3. gendex_db.json.tmp — the atomic writer's staged copy: a power cut
//      between the tmp write and the rename leaves yesterday's archive
//      there, whole and parseable;
//   4. gendex_backups/, newest first — the save rotator already keeps the
//      last eight previous databases exactly for this day.
// Only when EVERY rung fails does the door say 'corrupt' — and main.js
// then sets the broken file ASIDE (never over it) so even a fresh-start
// save cannot destroy the evidence.
//
// THE COMPATIBILITY STAMP: every save now carries three quiet top-level
// fields (appVersion, savedAt, schemaVersion) written by the MAIN process
// — the single writer, so the stamp is always true. createSafeDb never
// copies them into the live db (its whitelist drops unknown top-level
// keys), which keeps the renderer's world exactly as it was while the
// file on disk finally knows its own story. The stamp answers the OTHER
// half of the promise: a database written by a NEWER app version that
// lands in an older one can now be SEEN (the boot warns before any
// save could quietly drop fields it doesn't know).

// The db file's own shape revision — bump ONLY when the on-disk shape
// changes in a way a past version could misread. The sanitizer is
// field-wise defensive (unknown keys fall away, missing keys default),
// so the shape has never needed a hard gate; the number exists so a
// future gate can tell how far back a file comes.
export const DB_SCHEMA_VERSION = 2;

// The backup rotator's naming law (main.js rotateDbBackup):
// gendex_db-YYYYMMDD-HHMMSS.json, zero-padded, sortable by name.
export const BACKUP_NAME_RE = /^gendex_db-\d{8}-\d{6}\.json$/;

// A db payload is a plain object (never an array, never null). Anything
// else parses but is not an archive — the ladder treats it as unreadable.
const isPlainDbObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// THE TEXT DOOR: one parse pass with every quiet repair the field has
// ever needed. Returns { db, via: 'direct' | 'repaired' } or null.
//
//   direct   — the text parsed as-is (after stripping a UTF-8 BOM
//              \uFEFF, which JSON.parse refuses outright: a file saved
//              from Windows Notepad in "UTF-8 with BOM" used to read as
//              TOTAL damage, default library, buried archive).
//   repaired — the text had junk on an end; the slice from the first '{'
//              to the last '}' parsed clean. Editors appending notes,
//              logs growing into the tail, a truncated head — recovered.
export function parseDbText(text) {
  if (typeof text !== 'string') return null;
  let t = text;
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  // Trailing control characters / whitespace are damage, never content
  // (JSON.stringify never emits them): trim before the first attempt so
  // a file that merely grew a NUL tail still reads directly.
  t = t.replace(/[\s\u0000-\u001f]+$/, '');
  if (!t) return null;
  try {
    const db = JSON.parse(t);
    if (isPlainDbObject(db)) return { db, via: 'direct' };
  } catch {
    /* fall to the slice */
  }
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const slice = t.slice(first, last + 1);
    if (slice) {
      try {
        const db = JSON.parse(slice);
        if (isPlainDbObject(db)) return { db, via: 'repaired' };
      } catch {
        /* genuinely broken inside */
      }
    }
  }
  return null;
}

// THE STAMP (see the module note): three quiet fields on the written
// file, added by main.js's writeDb — the single writer. Non-destructive
// by construction: it spreads the db and never touches its arrays.
export function stampDatabaseForSave(db, appVersion, now = Date.now()) {
  if (!isPlainDbObject(db)) return db;
  return {
    ...db,
    appVersion: String(appVersion || '').trim(),
    savedAt: Number.isFinite(now) ? now : Date.now(),
    schemaVersion: DB_SCHEMA_VERSION,
  };
}

// The version stamp a loaded file carries ('' for every pre-1.5.5
// archive — they simply never spoke one). Leading 'v' tolerated.
export function readAppVersion(db) {
  const v = isPlainDbObject(db) ? db.appVersion : null;
  if (typeof v !== 'string') return '';
  return v.replace(/^v/i, '').trim().slice(0, 24);
}

// Dotted numeric compare ('1.5.10' > '1.5.9', never stringwise). Shared
// by the downgrade check in the renderer and the batteries. -1 / 0 / 1.
export function cmpVersions(a, b) {
  const parts = (v) =>
    String(v == null ? '' : v)
      .replace(/^v/i, '')
      .split('.')
      .map((s) => parseInt(s, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// THE FILE LADDER — io-driven (main.js passes { fs, join: path.join };
// the batteries pass staged folders). Pure otherwise: no top-level node
// requires anywhere in this module, so the renderer bundle can carry the
// comparators above without dragging node builtins into a sandboxed page.
// ---------------------------------------------------------------------------

// Runs the whole salvage ladder for one archive seat. Result:
//   { db, status, fromAppVersion, recoveredFrom }
//     status: 'ok'       — the file read directly
//             'repaired' — the file read after the brace-slice repair
//             'tmp'      — the file was lost; the staged .tmp read whole
//             'backup'   — the file AND tmp were lost; the newest
//                          readable backup answered (recoveredFrom names it)
//             'corrupt'  — something exists but NOTHING parsed: db is null
//                          and the CALLER must set the file aside before
//                          any fresh start can save over it
//             'missing'  — no file at all: a true fresh start
// The read is read-only by design — nothing is written back until the
// app's own next save (whose rotator backs the old file up first).
export function readDatabaseFile(io, { dbFile, tmpFile, backupDir }) {
  const { fs, join } = io;
  const miss = { db: null, status: 'missing', fromAppVersion: '', recoveredFrom: '' };
  if (!fs || !join || !dbFile) return miss;

  const readFileText = (p) => {
    try {
      if (!fs.existsSync(p)) return null;
      const raw = fs.readFileSync(p, 'utf8');
      return typeof raw === 'string' && raw.length ? raw : null;
    } catch {
      return null;
    }
  };

  // Rungs 1+2 — the archive itself.
  const mainText = readFileText(dbFile);
  if (mainText != null) {
    const hit = parseDbText(mainText);
    if (hit) {
      return {
        db: hit.db,
        status: hit.via === 'repaired' ? 'repaired' : 'ok',
        fromAppVersion: readAppVersion(hit.db),
        recoveredFrom: '',
      };
    }
  }

  // Rung 3 — the atomic writer's staged copy (yesterday's whole archive
  // when a power cut landed between the tmp write and the rename).
  const tmpText = readFileText(tmpFile || `${dbFile}.tmp`);
  if (tmpText != null) {
    const hit = parseDbText(tmpText);
    if (hit) {
      return { db: hit.db, status: 'tmp', fromAppVersion: readAppVersion(hit.db), recoveredFrom: '' };
    }
  }

  // Rung 4 — the save rotator's shelf, newest first (the name IS the
  // timestamp, so a plain sort desc walks backwards through time).
  if (backupDir) {
    try {
      const names = fs
        .readdirSync(backupDir)
        .filter((n) => BACKUP_NAME_RE.test(n))
        .sort()
        .reverse();
      for (const name of names) {
        const text = readFileText(join(backupDir, name));
        if (text == null) continue;
        const hit = parseDbText(text);
        if (hit) {
          return { db: hit.db, status: 'backup', fromAppVersion: readAppVersion(hit.db), recoveredFrom: name };
        }
      }
    } catch {
      /* no shelf, or the shelf refused — the ladder simply ends */
    }
  }

  // The verdict: something exists on the seat but nothing read.
  return mainText != null ? { db: null, status: 'corrupt', fromAppVersion: '', recoveredFrom: '' } : miss;
}

// THE SET-ASIDE: when the ladder ends at 'corrupt', the caller RENAMES
// the broken file next to itself (gendex_db.corrupt-<stamp>.json) BEFORE
// any fresh start exists that could save over it. Evidence is preserved;
// the app may start clean with a clear conscience. Returns the new
// basename, or null when the rename itself refused (the caller then
// reports the file as-is; the renderer's corrupt notice still fires).
export function setAsideCorruptDb(io, dbFile, newName) {
  const { fs, join } = io;
  if (!fs || !join || !dbFile || !newName) return null;
  try {
    if (!fs.existsSync(dbFile)) return null;
    const target = join(dbFile.replace(/[\\/][^\\/]+$/, ''), newName);
    fs.renameSync(dbFile, target);
    return newName;
  } catch {
    return null;
  }
}
