// 1.9.1 — THE DOCUMENT HOUSE (the experiment's own word: "experiment, i
// wanna try and see if we can make the database in nosql instead, since
// our data will be big and to handle things such as images too alongside
// increasing prompts and versions and cards and such").
//
// From this release the library lives in a NoSQL DOCUMENT STORE —
// gendex_db.nosql in the user-data folder — spoken by this module: a
// dependency-free, pure-JavaScript engine in the family of the embedded
// document databases (NeDB's own persistence shape, evolved to this
// app's laws), built for the way this library actually grows.
//
// THE SHAPE:
//   The file is an APPEND-ONLY JOURNAL of JSON lines (JSONL):
//     line 1 — the format's own magic: {"gd":"nosql","format":1}
//     then  — one line per write, each a whole document upsert:
//       {"c":"sections","_id":"characters","d":[ …the whole section… ]}
//       {"c":"meta","_id":"savedAt","v":"1699…"}          (meta: strings)
//       {"c":"sections","_id":"retiredKey","x":1}         (a deletion)
//   Two collections, exactly the two tables the SQLite house kept —
//   gendex_meta and gendex_data — translated row-for-row into documents,
//   so the renderer's whole compatibility law (createSafeDb's whitelist,
//   the sections reassembling into EXACTLY the db object it always
//   spoke) never learns that the seat beneath it changed.
//
// WHY A JOURNAL (the honest answer to "our data will be big"): the
// SQLite era rebuilt the WHOLE archive on every save — every section
// re-inserted, the whole database re-exported, the whole file
// re-written, no matter how small the change was. The journal APPENDS:
// a save that touched one section writes one line, and the file grows
// by the size of the change, not by the size of the library. A
// compaction pass (shouldCompactNosql) rewrites the file whole only
// when the journal has more than quadrupled its own live weight, so a
// load never replays more history than the data it holds is worth. And
// a torn tail — a power cut caught mid-append — costs exactly the last
// line: the reader skips what does not parse and keeps every whole word
// above it, the same half-a-file-beats-all-of-nothing law the salvage
// ladder always kept.
//
// THE DOORS (verdicts, the sqlite tongue kept): readNosqlArchive
// answers 'ok' (header spoken, sections replayed), 'missing' (no file),
// or 'corrupt' (bytes that are not this format — wrong magic, a
// truncated head, a format this reader cannot honestly replay). The
// set-aside law, the shelf, and the one-time doors all live in main.js,
// exactly where the SQLite era kept its own.
//
// PURITY LAW (the dbio.js rule, kept): the renderer never imports this
// module — only main.js and the batteries do. The engine is injected
// with its own fs (io = { fs, join }) exactly the way dbio.js and
// sqlite_engine.js always were, so the batteries can speak it from
// their native ES-module home against a temp dir of their own.
//
// THE OLD HOUSE IS NOT DEMOLISHED: gendex_db.sqlite is never written,
// moved, or deleted from this release on. The first 1.9.1 boot reads it
// exactly ONCE (the translation door in main.js), writes its whole
// truth into this journal, and the SQLite file stays on the disk as the
// pre-translation snapshot it already was — a deep recovery seat the
// corrupt ladder can always re-read, and the user's own guarantee that
// the experiment can be walked back from.

// The house file's own shape revision — bump ONLY when the line format
// itself changes in a way an older reader could misread. v1: the two
// collections and the three op kinds, as born in 1.9.1.
export const NOSQL_FORMAT_VERSION = 1;

// The magic the first line must speak. A file whose head is not this
// word is not this format: 'corrupt', never boarded on a guess.
const headerLine = () => `{"gd":"nosql","format":${NOSQL_FORMAT_VERSION}}`;
const HEADER_RE = /^\{"gd":"nosql","format":(\d+)\}$/;

const lineOf = (op) => JSON.stringify(op);
const metaOp = (key, value) => ({ c: 'meta', _id: String(key), v: String(value) });
const sectionOp = (key, value) => ({ c: 'sections', _id: String(key), d: value });
const deleteOp = (key) => ({ c: 'sections', _id: String(key), x: 1 });

// ---------------------------------------------------------------------------
// THE DOOR — read one seat, honestly. Result:
//   { kind: 'ok',      sections, meta, lineCount } — the journal replayed
//   { kind: 'missing', …empty } — no file at all
//   { kind: 'corrupt', …empty } — bytes exist but they are not this
//                                  format: wrong magic, a truncated head,
//                                  or a format version this reader refuses
//                                  to guess at. The caller sets the file
//                                  aside, never saves over it.
// A torn TAIL is not corruption: a last line cut short by a power cut is
// skipped, the whole words above it survive — the crash-safety the
// append-only design buys for free.
// ---------------------------------------------------------------------------
export function readNosqlArchive(io, dbFile) {
  const empty = { kind: 'missing', sections: {}, meta: {}, lineCount: 0 };
  const { fs } = io || {};
  if (!fs || !dbFile) return empty;
  let raw = '';
  try {
    if (!fs.existsSync(dbFile)) return empty;
    raw = fs.readFileSync(dbFile, 'utf8');
  } catch {
    return { kind: 'corrupt', sections: {}, meta: {}, lineCount: 0 };
  }
  const lines = String(raw)
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.length > 0);
  if (!lines.length) return { kind: 'corrupt', sections: {}, meta: {}, lineCount: 0 };
  const head = HEADER_RE.exec(lines[0]);
  if (!head) return { kind: 'corrupt', sections: {}, meta: {}, lineCount: 0 };
  if (Number(head[1]) !== NOSQL_FORMAT_VERSION) {
    // a journal from a newer shape of this format: this reader refuses
    // what it cannot honestly replay — the caller sets it aside.
    return { kind: 'corrupt', sections: {}, meta: {}, lineCount: 0 };
  }
  const sections = {};
  const meta = {};
  let lineCount = 0;
  for (let i = 1; i < lines.length; i += 1) {
    let op = null;
    try {
      op = JSON.parse(lines[i]);
    } catch {
      continue; // a torn tail line costs itself alone
    }
    if (!op || typeof op !== 'object') continue;
    const { c, _id } = op;
    if (typeof _id !== 'string' || !_id) continue;
    if (c === 'sections') {
      if (op.x) delete sections[_id];
      else if ('d' in op) sections[_id] = op.d;
    } else if (c === 'meta') {
      if (op.x) delete meta[_id];
      else if ('v' in op) meta[_id] = String(op.v);
    }
    lineCount += 1;
  }
  return { kind: 'ok', sections, meta, lineCount };
}

// The whole journal as text (the compact form): the header, every meta
// row, every section — one document per line. Undefined values never
// ride (JSON never spoke them; a live object never should) — the same
// law buildSqliteArchive kept.
export function buildNosqlJournalText(sections, meta) {
  const out = [headerLine()];
  for (const [k, v] of Object.entries(meta || {})) {
    if (v === undefined) continue;
    out.push(lineOf(metaOp(k, v)));
  }
  for (const [k, v] of Object.entries(sections || {})) {
    if (v === undefined) continue;
    out.push(lineOf(sectionOp(k, v)));
  }
  return `${out.join('\n')}\n`;
}

// The whole-store atomic write — the translation door's own ceremony and
// the compaction pass: the entire journal built fresh in memory, staged
// to .tmp, renamed over the seat. The same ceremony the JSON and SQLite
// writers always kept, so a power cut leaves either yesterday's whole
// file or today's, never a half of either. Returns the op-line count
// (the compaction measure's own truth).
export function writeNosqlStore(io, dbFile, sections, meta) {
  const { fs } = io;
  const out = [headerLine()];
  for (const [k, v] of Object.entries(meta || {})) {
    if (v === undefined) continue;
    out.push(lineOf(metaOp(k, v)));
  }
  for (const [k, v] of Object.entries(sections || {})) {
    if (v === undefined) continue;
    out.push(lineOf(sectionOp(k, v)));
  }
  const text = `${out.join('\n')}\n`;
  const tmp = `${dbFile}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, dbFile);
  return out.length - 1;
}

// The journal's own increment: append the ops (upserts and deletions,
// built by the callers through the op helpers below) as one aligned
// block. A store that vanished between the read and this append is
// re-headed first — the belt for the belt. Returns the count appended.
export function appendNosqlOps(io, dbFile, ops) {
  const { fs } = io;
  if (!Array.isArray(ops) || !ops.length) return 0;
  try {
    if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, `${headerLine()}\n`, 'utf8');
  } catch {
    /* the append below speaks the refusal honestly */
  }
  fs.appendFileSync(dbFile, `${ops.map(lineOf).join('\n')}\n`, 'utf8');
  return ops.length;
}

// The compaction policy: a journal earns a whole-file rewrite only when
// its history has more than quadrupled its live weight (plus a
// newborn's grace of 64 lines) — dead tail lines cost a load nothing
// until they outnumber the truth they trail.
export function shouldCompactNosql(lineCount, liveDocs) {
  return lineCount > 4 * Math.max(0, liveDocs) + 64;
}

// The op builders the single writer speaks (main.js diffs the sections
// and asks for exactly the lines the change is worth).
export const nosqlSectionOp = sectionOp;
export const nosqlMetaOp = metaOp;
export const nosqlDeleteOp = deleteOp;

// Does this archive carry anything at all? A saved library always speaks
// at least its settings/classes/characters seats; an empty replay is a
// newborn (or a set-aside's ghost) and must not masquerade as a library.
// (The sqlite engine's own law, spoken here for callers that never touch
// the old house.)
export function hasAnyNosqlSectionData(sections) {
  return sections != null && typeof sections === 'object' && !Array.isArray(sections) && Object.keys(sections).length > 0;
}
