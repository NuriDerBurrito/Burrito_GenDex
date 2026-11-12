// 1.9.1 batch — The Paper House.
// (Named 192 in the sequence: 190 pins the 1.8.9 laws and 191 the 1.8.10
//  laws, both extended to speak 1.9.0's; this suite pins the 1.9.1 laws
//  at their roots. Built from the 1.9.0 tree — the release line
//  continues.)
// The reported items, pinned at their root laws:
//   A.  THE GHOST BLUR AFTER THE WHEEL ("when images are loading with
//       the circle, when the circle vanishes the image is still blurry
//       for another second or so, something funky seems to be going on
//       fix that"): a load is not a paint — every road into "clear" now
//       hands its element to revealImgWhenPainted (the decode() promise
//       + two committed frames + the hidden-window and absolute rails),
//       in the stage AND the big viewer.
//   B.  THE DOCUMENT HOUSE ("experiment, i wanna try and see if we can
//       make the database in nosql instead, since our data will be big
//       and to handle things such as images too alongside increasing
//       prompts and versions and cards and such"): the journal engine's
//       own laws, live from its seat — round-trip, append/delete
//       replay, torn-tail tolerance, bad magic, CRLF tails, the
//       compaction threshold — and the single writer's diff law (a save
//       appends only what changed, deletions tombstone, the merged
//       truth reads back whole).
//   C.  THE TRANSLATION DOOR ("dont delete the old sqlite database too,
//       just translate it from sql to nosql since i wanna test it"): a
//       real SQLite file (built by the vendored engine, woken in the
//       batteries' own native ES-module home) is read once through the
//       door's own hands and carried whole into the journal — sections,
//       meta, and the door's own stamp — and the SQLite bytes on disk
//       stay byte-identical through the whole ceremony.
//   D.  THE HOUSE'S SEATS — main.js speaks the document house at every
//       live seat (prime, writer, load, peek, reset), the retired seats
//       are gone, and the renderer's verdict tells the translation's
//       own story.
//   E.  THE FURNITURE — the version seats speak 1.9.1, the changelog
//       head tells this story, the README badge speaks the document
//       database, the privacy notice tells the whole chain (and its
//       version moves to 1.0.6), and the battery runner welcomes this
//       very suite.
//   F.  THE TRANSLATION DOOR, LIVE — the real compiled entry, booted
//       under the batteries' mocked electron with a REAL pre-1.9.1
//       SQLite library staged on the seat: the door reads it once,
//       builds the journal whole, never touches the snapshot's bytes,
//       closes itself on the second boot, and a save appends the
//       journal without the snapshot ever learning it happened.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';
import webpack from 'webpack';
import {
  readNosqlArchive,
  writeNosqlStore,
  appendNosqlOps,
  shouldCompactNosql,
  nosqlSectionOp,
  nosqlMetaOp,
  nosqlDeleteOp,
} from '../src/utils/nosql_engine.js';
import {
  initSqliteEngine,
  buildSqliteArchive,
  exportSqliteBytes,
  readSqliteArchive,
  openSqliteFile,
} from '../src/utils/sqlite_engine.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');
const tmpHome = mkdtempSync(path.join(os.tmpdir(), 'gendex-192-'));
const io = { fs, join: path.join };
const seat = (name) => path.join(tmpHome, name);
const require_ = createRequire(import.meta.url);

// The vendored engine wakes ONCE, at the suite's own top level — the
// translation door's own law (the one wake this era ever asks of the
// wasm), spoken here in the batteries' native ES-module home.
const SQL = await initSqliteEngine();

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message.split('\n')[0]}`);
  }
};

// --- A. THE ENGINE, LIVE, FROM ITS OWN SEAT --------------------------------

ok('A1 — the journal round-trips whole (sections + meta + the measure)', () => {
  const store = seat('a1.nosql');
  const sections = { characters: [{ id: 'c1', name: 'Burrito' }], settings: { theme: 'zine' } };
  const meta = { legacyImported: '1', sqlTranslated: '1', appVersion: '1.9.19', savedAt: '123', schemaVersion: '1' };
  const lines = writeNosqlStore(io, store, sections, meta);
  assert.equal(lines, 7, 'the store spoke 7 op lines (2 sections + 5 meta)');
  const read = readNosqlArchive(io, store);
  assert.equal(read.kind, 'ok');
  assert.deepEqual(read.sections, sections);
  assert.deepEqual(read.meta, meta);
  assert.equal(read.lineCount, 7);
});

ok('A2 — the journal appends and replays (upsert + delete + meta stamp)', () => {
  const store = seat('a2.nosql');
  writeNosqlStore(io, store, { characters: [{ id: 'c1' }], tags: [] }, { legacyImported: '0' });
  appendNosqlOps(io, store, [
    nosqlSectionOp('characters', [{ id: 'c1' }, { id: 'c2' }]),
    nosqlDeleteOp('tags'),
    nosqlMetaOp('appVersion', '1.9.19'),
  ]);
  const read = readNosqlArchive(io, store);
  assert.deepEqual(read.sections, { characters: [{ id: 'c1' }, { id: 'c2' }] });
  assert.ok(!('tags' in read.sections), 'the tombstone spoke');
  assert.equal(read.meta.appVersion, '1.9.19');
  assert.equal(read.meta.legacyImported, '0');
});

ok('A3 — a torn tail costs exactly the torn line (the power-cut law)', () => {
  const store = seat('a3.nosql');
  writeNosqlStore(io, store, { characters: [{ id: 'c1' }] }, {});
  appendNosqlOps(io, store, [nosqlSectionOp('settings', { theme: 'ember' })]);
  const grown = readFileSync(store, 'utf8');
  writeFileSync(store, grown.slice(0, grown.length - 12), 'utf8'); // cut the last line in half
  const read = readNosqlArchive(io, store);
  assert.equal(read.kind, 'ok');
  assert.deepEqual(read.sections, { characters: [{ id: 'c1' }] }, 'the whole words survive');
  assert.ok(!('settings' in read.sections), 'the torn word dies alone');
});

ok('A4 — bad magic / empty head / newer format refuse boarding', () => {
  const store = seat('a4.nosql');
  writeFileSync(store, 'not a journal at all\n', 'utf8');
  assert.equal(readNosqlArchive(io, store).kind, 'corrupt');
  writeFileSync(store, '', 'utf8');
  assert.equal(readNosqlArchive(io, store).kind, 'corrupt');
  writeFileSync(store, '{"gd":"nosql","format":99}\n', 'utf8');
  assert.equal(readNosqlArchive(io, store).kind, 'corrupt', 'a newer format is not guessed at');
  assert.equal(readNosqlArchive(io, seat('never-written.nosql')).kind, 'missing');
});

ok('A5 — CRLF tails board as cleanly as LF', () => {
  const probe = seat('a5src.nosql');
  writeNosqlStore(io, probe, { characters: [] }, { savedAt: '1' });
  const body = readFileSync(probe, 'utf8');
  const store = seat('a5.nosql');
  writeFileSync(store, body.split('\n').join('\r\n'), 'utf8');
  const read = readNosqlArchive(io, store);
  assert.equal(read.kind, 'ok');
  assert.deepEqual(read.sections, { characters: [] });
  assert.equal(read.meta.savedAt, '1');
});

ok('A6 — the compaction threshold quadruples the live truth (+64 grace)', () => {
  assert.equal(shouldCompactNosql(4 * 10 + 64, 10), false);
  assert.equal(shouldCompactNosql(4 * 10 + 65, 10), true);
  assert.equal(shouldCompactNosql(0, 0), false);
});

// --- B. THE SINGLE WRITER'S DIFF LAW, LIVE ---------------------------------

ok('B1 — a save appends only what changed; deletions tombstone', () => {
  const store = seat('b1.nosql');
  const first = { characters: [{ id: 'c1', notes: 'old' }], settings: { theme: 'zine' }, tags: [] };
  writeNosqlStore(io, store, first, { appVersion: '1.9.19' });
  const before = readFileSync(store, 'utf8').split('\n').filter(Boolean).length;
  // one card's notes change; everything else identical — the journal
  // grows by ONE section plus the stamp's meta, not by the library
  const second = { characters: [{ id: 'c1', notes: 'new' }], settings: { theme: 'zine' }, tags: [] };
  const ops = [];
  for (const [k, v] of Object.entries(second)) {
    if (JSON.stringify(first[k]) === JSON.stringify(v)) continue;
    ops.push(nosqlSectionOp(k, v));
  }
  for (const k of Object.keys(first)) if (!(k in second)) ops.push(nosqlDeleteOp(k));
  for (const [k, v] of Object.entries({ appVersion: '1.9.19', savedAt: '2' })) ops.push(nosqlMetaOp(k, v));
  appendNosqlOps(io, store, ops);
  const after = readFileSync(store, 'utf8').split('\n').filter(Boolean).length;
  assert.equal(after - before, 3, 'one section + two meta stamps rode the file');
  const read = readNosqlArchive(io, store);
  assert.deepEqual(read.sections, second, 'the merged truth reads back whole');
  // and the deletion tombstone speaks too
  appendNosqlOps(io, store, [nosqlDeleteOp('tags')]);
  assert.ok(!('tags' in readNosqlArchive(io, store).sections));
});

// --- C. THE TRANSLATION DOOR, LIVE, ENGINE-TO-ENGINE ------------------------

ok('C1 — a real SQLite file carried whole into the journal, bytes untouched', () => {
  const sqliteSeat = seat('c1.sqlite');
  const sections = {
    characters: [{ id: 'c1', name: 'Vendored', versions: [{ label: 'v1', prompt: 'a burrito' }] }],
    classes: [{ id: 'root' }],
    settings: { theme: 'ember', colors: { bg: '#170f09' } },
  };
  const meta = { legacyImported: '1', appVersion: '1.9.0', savedAt: '42', schemaVersion: '1' };
  const db = buildSqliteArchive(SQL, sections, meta);
  const bytes = Buffer.from(exportSqliteBytes(db));
  db.close();
  writeFileSync(sqliteSeat, bytes);
  const before = readFileSync(sqliteSeat);
  // THE DOOR — main.js's own hands: read once through the honest door...
  const open = openSqliteFile(io, SQL, sqliteSeat);
  assert.equal(open.kind, 'ok');
  const sqlRead = readSqliteArchive(open.db);
  open.db.close();
  // ...write whole into the journal with the door's own stamp...
  const journalSeat = seat('c1.nosql');
  writeNosqlStore(io, journalSeat, sqlRead.sections, { ...sqlRead.meta, sqlTranslated: '1' });
  // ...and the SQLite bytes never learn the journal exists:
  assert.deepEqual(readFileSync(sqliteSeat), before, 'the snapshot stayed byte-identical');
  const read = readNosqlArchive(io, journalSeat);
  assert.equal(read.kind, 'ok');
  assert.deepEqual(read.sections, sections, 'the whole truth carried');
  assert.equal(read.meta.appVersion, '1.9.0');
  assert.equal(read.meta.legacyImported, '1');
  assert.equal(read.meta.sqlTranslated, '1', 'the door stamped its own memory inside the store');
});

// --- D. THE HOUSE'S SEATS (source pins) -------------------------------------

const main = src('src/main.js');

ok('D1 — the house primes the DOCUMENT seat; the retired seats are gone', () => {
  assert.ok(main.includes('await primeNosqlArchive();'), 'whenReady speaks the new prime');
  assert.ok(!main.includes('primeSqliteArchive'), 'the sqlite prime is retired');
  assert.ok(!main.includes('sqliteState'), 'the sqlite state is retired');
  assert.ok(!main.includes('persistSqliteArchive'), 'the sqlite writer is retired');
  assert.ok(!main.includes('rotateSqliteBackup'), 'the sqlite rotator is retired');
  assert.ok(!main.includes('newestSqliteBackupRead'), 'the sqlite shelf reader is retired');
});

ok('D2 — the seats and the single writer speak the journal', () => {
  assert.ok(main.includes("'gendex_db.nosql'"), 'the document seat is named');
  assert.ok(main.includes('const nosqlState = {'));
  assert.ok(main.includes('appendNosqlOps(DB_IO, NOSQL_FILE, ops)'));
  assert.ok(main.includes('shouldCompactNosql(nosqlState.lineCount, liveDocs)'));
  assert.ok(main.includes('rotateNosqlBackup();'));
  assert.ok(main.includes('newestNosqlBackupRead'));
});

ok('D3 — the translation door wakes the engine for its ONE read, stamps its memory', () => {
  assert.ok(main.includes('await initSqliteEngine(); // the one wake this era ever asks of the wasm'));
  assert.ok(main.includes("meta = { ...sqlRead.meta, sqlTranslated: '1' };"));
  assert.ok(main.includes("kind: 'translated'"));
});

ok('D4 — the factory reset wipes the journal with the rest', () => {
  assert.ok(main.includes('fs.rmSync(NOSQL_FILE, { force: true });'));
  assert.ok(main.includes('fs.rmSync(`${NOSQL_FILE}.tmp`, { force: true });'));
  assert.ok(main.includes('nosqlState.lastSections = null;'));
});

ok('D5 — the boot verdict keeps its tongues; the renderer tells the translation', () => {
  assert.ok(main.includes("status = 'migrated'"));
  assert.ok(main.includes("status = 'backup'"));
  assert.ok(main.includes("status = 'corrupt'"));
  const app = src('src/App.jsx');
  assert.ok(app.includes('Library translated into the NoSQL document store'), 'the verdict speaks the new house');
});

ok('D6 — the peek and the belt keep their laws under the new house', () => {
  assert.ok(main.includes('peekSettingsBgOf(nosqlState.ready ? nosqlState.peekSettings : null)'));
  assert.ok(main.includes('(store dark — the belt under the braces)'));
});

// --- E. THE FURNITURE --------------------------------------------------------

ok('E1 — the version is 1.9.2 everywhere', () => {
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json');
  const lock = JSON.parse(src('package-lock.json'));
  assert.equal(lock.version, '1.9.19', 'package-lock.json head');
  assert.equal(lock.packages[''].version, '1.9.19', 'package-lock.json root seat');
  const constants = src('src/constants/index.js');
  assert.ok(constants.includes("version: '1.9.19'"), 'the APP constant');
});

ok('E2 — the changelog head tells this story', () => {
  const head = src('CHANGELOG.md');
  assert.ok(head.startsWith('## 1.9.19 — The Ends Trade Places'));
  assert.ok(head.includes('revealImgWhenPainted'));
  assert.ok(head.includes('gendex_db.nosql'));
});

ok('E3 — the README speaks the document database and its battery', () => {
  const readme = src('README.md');
  /* 1.9.3 — the badge is a LIVE seat (it tracks the current release);
     it speaks 1.9.6 now. */
  assert.ok(readme.includes('version-1.9.19-purple'));
  assert.ok(readme.includes('database-NoSQL-informational'));
  assert.ok(readme.includes('gendex_db.nosql'));
  assert.ok(readme.includes('93 DOM/source test suites'));
});

ok('E4 — the privacy notice tells the whole chain, and its version moved', () => {
  const legal = src('src/constants/legal.js');
  assert.ok(legal.includes("export const TOS_VERSION = '1.0.6';"));
  assert.ok(legal.includes('gendex_db.nosql'));
  assert.ok(legal.includes('append-only journal of JSON documents'));
  assert.ok(legal.includes('Releases before 1.9.1 used a SQLite database file'));
});

ok('E5 — the reveal law is wired at every road into clear', () => {
  const helpers = src('src/utils/helpers.js');
  assert.ok(helpers.includes('export function revealImgWhenPainted'), 'the helper exists');
  assert.ok(helpers.includes('el.decode()'), 'the decode promise gates the mark');
  const stage = src('src/components/ImageStage.jsx');
  assert.equal((stage.match(/revealImgWhenPainted\(/g) || []).length, 3, 'the stage: two onLoad roads + the ladder rung');
  assert.ok(stage.includes('if (found) revealImgWhenPainted(found, () => markLoaded(file));'));
  const viewer = src('src/components/ImageViewer.jsx');
  assert.equal((viewer.match(/revealImgWhenPainted\(/g) || []).length, 2, 'the viewer: the sweep + the onLoad road');
  assert.ok(viewer.includes('onLoad={(ev) => revealImgWhenPainted(ev.currentTarget, () => setFullLoaded(true))}'));
});

ok('E6 — the battery runner welcomes this very suite', () => {
  const runner = src('scripts/run_battery_171.sh');
  assert.ok(runner.includes('gendex_192_batch_dom'));
});

// --- F. THE TRANSLATION DOOR, LIVE — the real compiled entry -------------

// the compiled bundle's seat, filled by the F0 compile below before any
// boot speaks it
let bundlePath = '';

const bootMain = async (userData) => {
  const handlers = {};
  const windows = [];
  const noop = () => {};
  const app = {
    setName: noop,
    getPath: (which) => (which === 'userData' ? userData : path.join(userData, which)),
    getVersion: () => '1.9.19',
    on: noop,
    quit: noop,
    whenReady: () => Promise.resolve(),
  };
  const BrowserWindow = class {
    constructor() {
      windows.push(this);
    }
    loadURL() {} once() {} on() {} show() {} destroy() {}
    isDestroyed() { return false; }
    static getAllWindows() { return windows; }
  };
  const electron = {
    app,
    BrowserWindow,
    ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on: noop, removeHandler: noop },
    protocol: { registerSchemesAsPrivileged: noop, handle: () => {} },
    net: {}, shell: {}, dialog: {}, clipboard: {}, nativeImage: {}, screen: {},
  };
  const origLoad = Module._load;
  Module._load = function patched(request) {
    if (request === 'electron') return electron;
    return origLoad.apply(this, arguments);
  };
  try {
    const resolved = require_.resolve(bundlePath);
    delete require_.cache[resolved];
    require_(resolved);
    await new Promise((r) => setTimeout(r, 600)); // the wasm wakes in its own breath (the translation's one wake)
    return { handlers, windows, userData };
  } finally {
    Module._load = origLoad;
  }
};

let bundleReady = false;
await (async () => {
  const workDir = mkdtempSync(path.join(os.tmpdir(), 'gd-pack-192-'));
  const config = {
    ...require_(path.join(root, '..', 'webpack.main.config.js')),
    mode: 'production',
    target: 'electron-main',
    entry: path.join(root, '..', 'src', 'main.js'),
    output: { path: workDir, filename: 'index.js', library: { type: 'commonjs2' } },
    devtool: false,
    plugins: [
      new webpack.DefinePlugin({
        MAIN_WINDOW_WEBPACK_ENTRY: JSON.stringify('file://' + path.join(workDir, 'index.html')),
        MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: JSON.stringify(path.join(workDir, 'preload.js')),
      }),
    ],
  };
  await new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err);
      if (stats.hasErrors()) return reject(new Error(stats.toString({ errors: true, chunks: false, modules: false })));
      bundleReady = true;
      resolve();
    });
  });
  bundlePath = path.join(workDir, 'index.js');
  console.log('  ok — F0 — the real entry compiles with the document house aboard (production)');
  passed += 1;
})();

if (bundleReady) {
  await (async () => {
    const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-192-'));
    const sqliteFile = path.join(userData, 'gendex_db.sqlite');
    // the pre-1.9.1 library, exactly as the old house would have left it
    const sections = {
      characters: [{ id: 'c1', name: 'Paper Burrito', versions: [{ label: 'v1', prompt: 'a burrito' }] }],
      classes: [{ id: 'root' }],
      settings: { theme: 'ember', colors: { bg: '#170f09' } },
    };
    const meta = { legacyImported: '1', appVersion: '1.9.0', savedAt: '7', schemaVersion: '1' };
    const archive = buildSqliteArchive(SQL, sections, meta);
    const bytes = Buffer.from(exportSqliteBytes(archive));
    archive.close();
    writeFileSync(sqliteFile, bytes);
    const snapshotBefore = readFileSync(sqliteFile);
    const first = await bootMain(userData);
    const r = await first.handlers['db:load']();
    assert.equal(r.status, 'migrated', `the translation said "${r.status}"`);
    assert.equal(r.fromAppVersion, '1.9.0', 'the old stamp never rode the verdict');
    assert.ok(r.db?.characters?.[0]?.name === 'Paper Burrito', 'the library did not carry whole');
    const nosqlFile = path.join(userData, 'gendex_db.nosql');
    assert.ok(existsSync(nosqlFile), 'the journal was never built');
    const read = readNosqlArchive(io, nosqlFile);
    assert.equal(read.kind, 'ok', 'the journal refused to open');
    assert.equal(read.meta.sqlTranslated, '1', 'the door never stamped its memory');
    assert.equal(read.meta.legacyImported, '1', 'the carried memory never rode');
    assert.equal(read.meta.appVersion, '1.9.0', 'the carried stamp never rode');
    assert.deepEqual(read.sections, sections, 'the sections did not carry whole');
    assert.deepEqual(readFileSync(sqliteFile), snapshotBefore, 'the snapshot was touched (it must never be)');
    console.log('  ok — F1 — a pre-1.9.1 library translates whole: read once, journal built, snapshot untouched');
    passed += 1;
    // the second boot: the door is closed, the library answers 'ok'
    const second = await bootMain(userData);
    const r2 = await second.handlers['db:load']();
    assert.equal(r2.status, 'ok', `the second boot said "${r2.status}" (the door re-opened!)`);
    assert.ok(r2.db?.characters?.[0]?.name === 'Paper Burrito', 'the second boot lost the library');
    console.log('  ok — F2 — the translation door opens once and never again');
    passed += 1;
    // a save appends the journal; the snapshot never learns it happened
    const saved = await second.handlers['db:save']({}, { ...sections, characters: [...sections.characters, { id: 'c2', name: 'Second' }] });
    assert.equal(saved.ok, true, `the save refused: ${JSON.stringify(saved)}`);
    assert.deepEqual(readFileSync(sqliteFile), snapshotBefore, 'a save touched the snapshot (it must never be)');
    const after = readNosqlArchive(io, nosqlFile);
    assert.equal(after.sections.characters.length, 2, 'the save never appended the journal');
    assert.equal(after.meta.appVersion, '1.9.19', 'the save never stamped its own version');
    assert.equal(after.meta.sqlTranslated, '1', 'the save lost the translation memory');
    console.log('  ok — F3 — saves append the journal; the snapshot never learns they happened');
    passed += 1;
  })().catch((e) => {
    failed += 1;
    console.log(`  FAIL — F1-F3 — the live translation door\n      ${e.message.split('\n')[0]}`);
  });
} else {
  failed += 1;
  console.log('  FAIL — F0 — the real entry never compiled');
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
