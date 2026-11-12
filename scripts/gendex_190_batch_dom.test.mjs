// 1.8.9 batch — The Library's Own House.
// (Named 190 in the sequence: 189 pins the 1.8.8 laws; this suite pins the
//  1.8.9 laws at their roots. Built from the 1.8.8 tree — the final
//  release line continues.)
// The reported items, each pinned at its root law:
//   A.  THE ENGINE ("i thought our db was working on sqlite ... if possible
//       fix that so its the case") — the archive is a real SQLite database
//       file now: sql.js (the official SQLite compiled to WebAssembly) with
//       its wasm binary EMBEDDED in the bundle, one transactional writer
//       (build fresh -> export -> .tmp -> rename), the same shelf law for
//       backups, and the webpack compat shim that keeps the engine awake in
//       the PRODUCTION build (the terser-folded emcc export guard).
//   B.  THE ONE-TIME DOOR ("upgrading to newer versions just adds what the
//       json database had to sqlite and it doesnt use it anymore, it should
//       also be able to recognize if the data was imported before or not so
//       it doesnt reimport them everytime") — the legacy JSON archive is
//       read through the old salvage ladder ONE last time, its data is
//       ADDED (arrays by id, objects fill-only — never replace, never
//       duplicate), and the flag stamped INSIDE the file keeps the door
//       shut forever after. Proven live at the engine seat AND from inside
//       the real compiled bundle: a tampered JSON never boards twice.
//   C.  THE HOUSE ANSWERS THE BOOT — from inside the compiled artifact:
//       fresh seats say 'missing', legacy seats say 'migrated' with the
//       stamp riding meta (never the sections the renderer reads), saves
//       write the real SQLite file and never touch the JSON, and a corrupt
//       house is set aside and RECOVERED through the legacy door.
//   D.  THE NOTICE TELLS THE NEW STORY — the terms move to 1.0.5: the
//       library is ONE SQLite database file, the JSON file is the legacy
//       seat (read once, added, remembered, then never touched again), and
//       the whole document family carries the stamp.
//   E.  THE BADGE WEARS THE WALL'S OWN CLOTH ("the 'beta tester' label next
//       to duskfallcrew button in settings about section style is different
//       from the others, fix that so its stylized too like them") — the
//       badge's frame is the link family's own; nothing it declares
//       overrides the family anymore.
//   F.  THE FIRST PUBLIC RELEASE — the README written whole as the public
//       face (features, not history), the furniture speaking 1.8.9, and the
//       battery welcoming this very suite.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import os from 'node:os';
import webpack from 'webpack';
import assert from 'node:assert/strict';

const require_ = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

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
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message.split('\n')[0]}`);
  }
};
const assertMatch = (hay, re, msg) => {
  if (!re.test(hay)) throw new Error(msg || `pattern never spoke: ${re}`);
};

const mainSrc = src('src/main.js');
const engineSrc = src('src/utils/sqlite_engine.js');
const appSrc = src('src/App.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const css = src('src/index.css');
const legal = src('src/constants/legal.js');
const pkg = JSON.parse(src('package.json'));
const lock = src('package-lock.json');
const constants = src('src/constants/index.js');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const ci = src('.github/workflows/ci.yml');
const battery = src('scripts/run_battery_171.sh');
const mainConfigSrc = src('webpack.main.config.js');
// 1.9.0 — THE WORKLOG SEAT LEARNS TOLERANCE: the parent-folder worklog is
// a DEV-SEAT truth (it lives beside the tree, never inside it) — a user
// extracting the source zip anywhere has no such file, and the suite died
// on load before a single check could speak. The seat reads it when
// present and falls back to the app's own CHANGELOG (which keeps every
// version's entry) — the worklog assertion holds in both seats.
const worklog = (() => {
  try {
    return readFileSync(path.join(root, '..', '..', 'worklog.md'), 'utf8');
  } catch {
    return src('CHANGELOG.md');
  }
})();

// ---------------------------------------------------------------------------
// A. THE ENGINE — the source laws
// ---------------------------------------------------------------------------
console.log('\nA. THE ENGINE ("i thought our db was working on sqlite ... fix that so its the case")');

ok('A1 — the law note speaks its name (with the report own words)', () => {
  assertMatch(engineSrc, /1\.8\.9 — THE LIBRARY'S OWN HOUSE \(the storage report: "i thought our db\s*\n\/\/ was working on sqlite \.\.\. and that upgrading to newer versions/, 'the house note never spoke');
});
ok('A2 — the engine is real SQLite (sql.js, VENDORED since 1.8.10) with the wasm EMBEDDED in the tree', () => {
  // 1.8.10 — THE ENGINE'S OWN SEAT: the import speaks the vendored glue of
  // the app's own tree, never node_modules (the boot report: "Cannot find
  // module 'sql.js'" — the missing-module shim, thrown before a window).
  assertMatch(engineSrc, /import initSqlJs from '\.\/sqlite_glue\.js';/, 'the engine never took its vendored seat');
  assertMatch(engineSrc, /import \{ SQLITE_WASM_B64 \} from '\.\/sqlite_wasm\.js';/, 'the embedded fuel never arrived');
  assertMatch(engineSrc, /initSqlJs\(\{ wasmBinary: Buffer\.from\(SQLITE_WASM_B64, 'base64'\) \}\)/, 'the engine never drank its embedded fuel');
  assert.ok(existsSync(path.join(root, '..', 'src', 'utils', 'sqlite_wasm.js')), 'the embedded wasm module is missing from the tree');
  assertMatch(src('src/utils/sqlite_wasm.js'), /export const SQLITE_WASM_B64 = \[/, 'the fuel stopped riding the flat array');
  assert.ok(!('sql.js' in pkg.dependencies), 'the engine dependency survived the strike (the boot depends on it again)');
  assert.ok(existsSync(path.join(root, '..', 'src', 'utils', 'sqlite_glue.js')), 'the vendored glue is missing from the tree');
});
ok('A3 — the house seats: SQLITE_FILE beside the legacy JSON seat', () => {
  assertMatch(mainSrc, /const SQLITE_FILE = path\.join\(app\.getPath\('userData'\), 'gendex_db\.sqlite'\);/, 'the house never took its seat');
  assertMatch(mainSrc, /const DB_FILE = path\.join\(app\.getPath\('userData'\), 'gendex_db\.json'\);/, 'the legacy seat lost its name');
  assertMatch(mainSrc, /THE LEGACY SEAT: gendex_db\.json is the JSON-era archive/, 'the legacy note never spoke');
});
ok('A4 — THE PACKAGED-MAIN GUARD\'s engine twin retires with its patient (the compat shim rule)', () => {
  // 1.8.10 — THE SQL.JS COMPAT SHIM RULE, RETIRED: the cure moved into the
  // vendored source (src/utils/sqlite_glue.js), so the rule and its loader
  // stood down — the loader file keeps its seat as the cure's own history.
  // 1.9.0 — the birth tombstone: the retirement note keeps its 1.8.10 birth
  // version in webpack.main.config.js's own prose forever.
  assertMatch(mainConfigSrc, /1\.8\.10 — THE SQL\.JS COMPAT SHIM RULE, RETIRED/, 'the retirement note never spoke');
  assert.ok(!/test: \/node_modules.*sql-wa/.test(mainConfigSrc), 'the shim rule still rides the config');
  assert.ok(!/sqljs_compat_loader\.cjs/.test(mainConfigSrc), 'the config still speaks the retired loader');
  assert.ok(existsSync(path.join(root, 'sqljs_compat_loader.cjs')), 'the cure\'s own history lost its seat');
  const loader = src('scripts/sqljs_compat_loader.cjs');
  assertMatch(loader, /Cannot set properties of undefined \(setting 'exports'\)/, 'the disease note never spoke');
  assertMatch(loader, /sqljs-compat: the emcc node-export path is dead inside the bundle/, 'the replacement word never spoke');
});
ok('A5 — the single writer speaks the JOURNAL (diff -> append -> compact)', () => {
  // 1.9.1 — THE PAPER HOUSE: the SQLite writer retired with its seat — the
  // save law is the journal's own now (append only what changed, compact
  // when the history outgrows the truth, re-stamp the memories).
  assertMatch(mainSrc, /const rotateNosqlBackup = \(\) => \{/, 'the house rotator never spoke');
  assertMatch(mainSrc, /appendNosqlOps\(DB_IO, NOSQL_FILE, ops\);/, 'the save never appended its diff');
  assertMatch(mainSrc, /legacyImported: nosqlState\.legacyImported \? '1' : '0',/, 'the save never re-stamped the memory');
  assertMatch(mainSrc, /shouldCompactNosql\(nosqlState\.lineCount, liveDocs\)/, 'the compaction threshold never spoke');
  assertMatch(mainSrc, /gendex_db-\$\{stamp\.getFullYear\(\)\}\$\{pad\(stamp\.getMonth\(\) \+ 1\)\}\$\{pad\(stamp\.getDate\(\)\)\}-\$\{pad\(stamp\.getHours\(\)\)\}\$\{pad\(stamp\.getMinutes\(\)\)\}\$\{pad\(stamp\.getSeconds\(\)\)\}\.nosql/, 'the shelf name law changed');
});
ok('A6 — the boot primes the house BEFORE the window is born', () => {
  // 1.9.1 — THE PAPER HOUSE: the prime speaks the document house now (the
  // sqlite prime retired with its seat; the law itself never moved).
  assertMatch(mainSrc, /const primeNosqlArchive = async \(\) => \{/, 'the priming door never spoke');
  assertMatch(mainSrc, /await primeNosqlArchive\(\);\s*\n\s*registerIpc\(\);/, 'the boot never awaited its own house');
  assertMatch(mainSrc, /peekSettingsBgOf\(nosqlState\.ready \? nosqlState\.peekSettings : null\)/, 'the theme peek never asked the house first');
});
ok('A7 — the factory reset kills the house AND its memory together', () => {
  // 1.9.1 — the reset wipes the journal with the rest; the sqlite seats keep
  // their own removals (the snapshot dies only under the user's explicit
  // reset, its own law).
  assertMatch(mainSrc, /fs\.rmSync\(SQLITE_FILE, \{ force: true \}\);/, 'the reset never wiped the old house');
  assertMatch(mainSrc, /fs\.rmSync\(NOSQL_FILE, \{ force: true \}\);/, 'the reset never wiped the journal');
  assertMatch(mainSrc, /nosqlState\.legacyImported = false;\s*\n\s*nosqlState\.sqlTranslated = false;\s*\n\s*nosqlState\.migration = null;\s*\n\s*nosqlState\.peekSettings = null;/, 'the memory never died with the file');
});
ok('A8 — THE PURITY LAW: the renderer never imports the engine', () => {
  const rendererFiles = [
    'src/renderer.js',
    'src/App.jsx',
    'src/components/CharacterView.jsx',
    'src/components/SettingsModal.jsx',
    'src/components/Titlebar.jsx',
    'src/components/Dialogs.jsx',
    'src/utils/helpers.js',
    'src/utils/theme.js',
    'src/utils/dbio.js',
  ];
  for (const f of rendererFiles) {
    const t = src(f);
    assert.ok(!/sqlite_engine/.test(t), `${f} learned the engine's name (the renderer must never carry it)`);
    assert.ok(!/sql\.js/.test(t), `${f} learned the dependency's name`);
  }
  assertMatch(engineSrc, /PURITY LAW \(the dbio\.js rule, kept\): the renderer never imports this\s*\n\/\/ module/, 'the purity note never spoke');
});
ok('A9 — the load ledger learned the door\'s own verdict', () => {
  assertMatch(appSrc, /\['ok', 'repaired', 'tmp', 'backup', 'corrupt', 'missing', 'migrated'\]\.includes\(res\.status\)/, 'the allow-list never welcomed the verdict');
  assertMatch(appSrc, /info\.status === 'migrated'/, 'the verdict never spoke');
  // 1.9.1 — the verdict speaks the translation's own story now.
  assertMatch(appSrc, /Library translated into the NoSQL document store/, 'the verdict words never landed');
});

// ---------------------------------------------------------------------------
// B. THE ONE-TIME DOOR — the engine, live, against staged seats
// ---------------------------------------------------------------------------
console.log('\nB. THE ONE-TIME DOOR ("adds what the json database had ... so it doesnt reimport them everytime")');

const { initSqliteEngine, openSqliteFile, readSqliteArchive, buildSqliteArchive, exportSqliteBytes, mergeLegacyJsonIntoSections, hasAnySectionData, SQLITE_SCHEMA_VERSION, STAMP_KEYS } =
  await import('../src/utils/sqlite_engine.js');
const { readDatabaseFile, readAppVersion } = await import('../src/utils/dbio.js');
const io = { fs: require_('node:fs'), join: path.join };
const SQL = await initSqliteEngine();

const stage = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'gd-house-190-'));
  return {
    dir,
    sqliteFile: path.join(dir, 'gendex_db.sqlite'),
    jsonFile: path.join(dir, 'gendex_db.json'),
    backupDir: path.join(dir, 'gendex_backups'),
  };
};
const writeArchive = (seat, sections, meta) => {
  const archive = buildSqliteArchive(SQL, sections, meta);
  const bytes = exportSqliteBytes(archive);
  archive.close();
  writeFileSync(seat.sqliteFile, Buffer.from(bytes));
  return bytes;
};
const readArchive = (seat) => {
  const open = openSqliteFile(io, SQL, seat.sqliteFile);
  try {
    if (open.kind !== 'ok') return { kind: open.kind };
    const read = readSqliteArchive(open.db);
    return { kind: 'ok', ...read };
  } finally {
    try {
      if (open.db) open.db.close();
    } catch {
      /* already gone */
    }
  }
};

ok('B1 — the schema law: meta + data tables, the stamp keys never ride sections', () => {
  assert.equal(SQLITE_SCHEMA_VERSION, 1, 'the shape number drifted');
  assert.deepEqual(STAMP_KEYS, ['appVersion', 'savedAt', 'schemaVersion'], 'the stamp keys drifted');
  const seat = stage();
  const bytes = writeArchive(seat, { characters: [{ id: 'c1' }], settings: { theme: 'zine' } }, { legacyImported: '1', appVersion: '1.9.19' });
  const magic = Buffer.from(bytes.slice(0, 15)).toString('latin1');
  assert.equal(magic, 'SQLite format 3', 'the exported bytes are not a real SQLite file');
  const r = readArchive(seat);
  assert.equal(r.kind, 'ok');
  assert.equal(r.sections.characters.length, 1, 'the section did not ride');
  assert.equal(r.meta.appVersion, '1.9.19', 'the stamp did not ride meta');
  assert.equal(r.sections.appVersion, undefined, 'a stamp leaked into the sections');
  rmSync(seat.dir, { recursive: true, force: true });
});
ok('B2 — the open door speaks honestly (missing / corrupt / ok)', () => {
  const seat = stage();
  assert.equal(openSqliteFile(io, SQL, seat.sqliteFile).kind, 'missing', 'an absent seat said something else');
  writeFileSync(seat.sqliteFile, '~~~ not a database ~~~ nobody home ~~~');
  assert.equal(openSqliteFile(io, SQL, seat.sqliteFile).kind, 'corrupt', 'a text file wearing the name read as ok');
  writeArchive(seat, {}, {});
  assert.equal(openSqliteFile(io, SQL, seat.sqliteFile).kind, 'ok', 'a real house refused to open');
  rmSync(seat.dir, { recursive: true, force: true });
});
ok('B3 — the merge ADDS and never replaces (arrays by id, objects fill-only)', () => {
  const current = { characters: [{ id: 'a', name: 'Kept' }], settings: { theme: 'zine', zoom: 8 } };
  const legacy = {
    characters: [{ id: 'a', name: 'Intruder' }, { id: 'b', name: 'Added' }],
    settings: { theme: 'ghost', density: 3 },
    tags: [{ id: 't1', name: 'new' }],
    appVersion: '1.8.8',
    savedAt: 1,
    schemaVersion: 2,
  };
  const { merged, report } = mergeLegacyJsonIntoSections(current, legacy);
  assert.equal(merged.characters.length, 2, 'the merge lost or duplicated a character');
  assert.equal(merged.characters.find((c) => c.id === 'a').name, 'Kept', 'the merge REPLACED the live word');
  assert.equal(merged.characters.find((c) => c.id === 'b').name, 'Added', 'the merge never added the stranger');
  assert.equal(merged.settings.theme, 'zine', 'the merge replaced a live choice');
  assert.equal(merged.settings.density, 3, 'the merge never filled a missing key');
  assert.equal(merged.settings.zoom, 8, 'the merge dropped a live key');
  assert.equal(merged.tags.length, 1, 'a whole missing section never boarded');
  assert.equal(merged.appVersion, undefined, 'a stamp field boarded as a section');
  assert.equal(report.charactersAdded, 1, 'the report miscounted');
  assert.deepEqual(report.stampFieldsSkipped, ['appVersion', 'savedAt', 'schemaVersion'], 'the report lost the stamp skips');
  assert.equal(hasAnySectionData({}), false, 'an empty object read as data');
  assert.equal(hasAnySectionData({ settings: {} }), true, 'a section read as no data');
});
ok('B4 — THE FLAG LAW, live: the door opens once and never again', () => {
  const seat = stage();
  // the JSON-era seat, exactly as an upgrade would leave it
  writeFileSync(
    seat.jsonFile,
    JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }], settings: { theme: 'zine' }, appVersion: '1.8.8', savedAt: 1, schemaVersion: 2 })
  );
  // boot one: no house yet, flag unset, json exists -> the ladder reads it,
  // the merge folds it in, the flag is stamped INSIDE the new file
  const ladder = readDatabaseFile(io, { dbFile: seat.jsonFile, tmpFile: `${seat.jsonFile}.tmp`, backupDir: seat.backupDir });
  assert.equal(ladder.status, 'ok', 'the ladder refused a whole json');
  const { merged } = mergeLegacyJsonIntoSections({}, ladder.db);
  writeArchive(seat, merged, { legacyImported: '1', appVersion: readAppVersion(ladder.db), savedAt: String(Date.now()), schemaVersion: String(SQLITE_SCHEMA_VERSION) });
  let r = readArchive(seat);
  assert.equal(r.meta.legacyImported, '1', 'the flag never stamped');
  assert.equal(r.meta.appVersion, '1.8.8', 'the imported stamp did not ride meta');
  assert.equal(r.sections.appVersion, undefined, 'the raw stamps boarded the sections');
  // boot two: the json is TAMPERED (a newer copy drops in) — the flag keeps
  // the door shut, the intruder never boards
  writeFileSync(seat.jsonFile, JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }, { id: 'c9', name: 'INTRUDER' }] }));
  const flag = readArchive(seat).meta.legacyImported === '1';
  assert.ok(flag, 'the flag lost its memory');
  const second = flag ? readArchive(seat) : { sections: {} };
  assert.equal(second.sections.characters.length, 1, 'the door re-opened (re-import!)');
  assert.ok(!second.sections.characters.some((c) => c.id === 'c9'), 'the intruder boarded through a re-opened door');
  // and the house never touched the json's bytes either
  const jsonNow = JSON.parse(readFileSync(seat.jsonFile, 'utf8'));
  assert.equal(jsonNow.characters.length, 2, 'the house edited the legacy json (it must never write it)');
  rmSync(seat.dir, { recursive: true, force: true });
});
ok('B5 — a damaged house is refused at the magic door (evidence over faith)', () => {
  const seat = stage();
  writeArchive(seat, { characters: [{ id: 'c1' }] }, { legacyImported: '1' });
  // truncate the file past its first page: right magic, broken body
  const whole = readFileSync(seat.sqliteFile);
  writeFileSync(seat.sqliteFile, whole.slice(0, 4096));
  const open = openSqliteFile(io, SQL, seat.sqliteFile);
  assert.equal(open.kind, 'corrupt', 'a truncated house read as ok');
  try {
    if (open.db) open.db.close();
  } catch {
    /* already gone */
  }
  rmSync(seat.dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// C. THE HOUSE ANSWERS THE BOOT — the real compiled artifact
// ---------------------------------------------------------------------------
console.log('\nC. THE HOUSE ANSWERS THE BOOT (the compiled production bundle)');

const workDir = mkdtempSync(path.join(os.tmpdir(), 'gd-pack-190-'));
const forgeLikeMain = (mode) => ({
  ...require_(path.join(root, '..', 'webpack.main.config.js')),
  mode,
  target: 'electron-main',
  entry: path.join(root, '..', 'src', 'main.js'),
  output: { path: path.join(workDir, mode), filename: 'index.js', library: { type: 'commonjs2' } },
  devtool: false,
  plugins: [
    new webpack.DefinePlugin({
      MAIN_WINDOW_WEBPACK_ENTRY: JSON.stringify('file://' + path.join(workDir, 'index.html')),
      MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: JSON.stringify(path.join(workDir, 'preload.js')),
    }),
  ],
});
const compile = (config) =>
  new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err);
      if (stats.hasErrors()) return reject(new Error(stats.toString({ errors: true, chunks: false, modules: false })));
      resolve(stats);
    });
  });
const bundlePath = path.join(workDir, 'production', 'index.js');

await okAsync('C0 — the real entry compiles with the engine aboard (production)', async () => {
  await compile(forgeLikeMain('production'));
  const bundle = readFileSync(bundlePath, 'utf8');
  assert.ok(bundle.length > 1000, 'the bundle is suspiciously small');
  // the engine's own vocabulary, inlined into the shipping artifact
  assert.ok(bundle.includes('SQLite format 3'), 'the magic-door word never reached the bundle');
  assert.ok(bundle.includes('gendex_meta'), 'the meta table never reached the bundle');
  // the compat shim spoke: the dead emcc export statement is gone
  assert.ok(!/"undefined"\s*!=\s*typeof\s+module\s*&&\s*\(module\.exports\s*=\s*\w+\)/.test(bundle), 'the emcc export guard survived into the shipping bundle (engine would fall back to JSON silently)');
});

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
    await new Promise((r) => setTimeout(r, 250)); // the wasm wakes in its own breath
    return { handlers, windows, userData };
  } finally {
    Module._load = origLoad;
  }
};

await okAsync('C1 — a fresh seat says missing and builds no house', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-190-'));
  const { handlers, windows } = await bootMain(userData);
  assert.equal(windows.length, 1, 'the window never arrived');
  const r = await handlers['db:load']();
  assert.equal(r.status, 'missing', `fresh seat said "${r.status}"`);
  assert.equal(r.db, null, 'a fresh seat handed the renderer a db');
  assert.ok(!existsSync(path.join(userData, 'gendex_db.sqlite')), 'a fresh boot built a house nobody asked for');
});

await okAsync('C2 — a legacy JSON seat is FOLDED IN once, and the stamp rides meta', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-190-'));
  writeFileSync(
    path.join(userData, 'gendex_db.json'),
    JSON.stringify({ characters: [{ id: 'c1', name: 'Probe Burrito' }], settings: { theme: 'zine' }, appVersion: '1.8.8', savedAt: 1, schemaVersion: 2 })
  );
  const { handlers } = await bootMain(userData);
  const r = await handlers['db:load']();
  assert.equal(r.status, 'migrated', `a legacy seat said "${r.status}"`);
  assert.equal(r.fromAppVersion, '1.8.8', 'the imported stamp never rode the verdict');
  assert.ok(r.db?.characters?.[0]?.name === 'Probe Burrito', 'the archive did not fold in whole');
  assert.equal(r.db.appVersion, undefined, 'the raw stamps boarded the sections (they ride meta now)');
  // 1.9.1 — THE PAPER HOUSE: the fold-in lands in the document store now
  // (the sqlite house is never built again — the JSON door writes the journal).
  const { readNosqlArchive } = await import('../src/utils/nosql_engine.js');
  const nosqlFile = path.join(userData, 'gendex_db.nosql');
  assert.ok(existsSync(nosqlFile), 'the house was never built');
  assert.ok(!existsSync(path.join(userData, 'gendex_db.sqlite')), 'a sqlite house was built on a json boot (never again)');
  const read = readNosqlArchive(io, nosqlFile);
  assert.equal(read.kind, 'ok', 'the journal refused to open');
  assert.equal(read.meta.legacyImported, '1', 'the flag never stamped inside the store');
  assert.equal(read.meta.appVersion, '1.8.8', 'meta lost the imported stamp');
});

await okAsync('C3 — THE NO-REIMPORT PROOF from inside the bundle: a tampered json never boards twice', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-190-'));
  const jsonPath = path.join(userData, 'gendex_db.json');
  writeFileSync(jsonPath, JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }], appVersion: '1.8.8' }));
  const first = await bootMain(userData);
  const r1 = await first.handlers['db:load']();
  assert.equal(r1.status, 'migrated', 'the first boot never migrated');
  // the tamper: a brand-new character rides the legacy json
  const tampered = JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }, { id: 'c9', name: 'INTRUDER' }] });
  writeFileSync(jsonPath, tampered);
  const second = await bootMain(userData);
  const r2 = await second.handlers['db:load']();
  assert.equal(r2.status, 'ok', `the second boot said "${r2.status}" (the door re-opened!)`);
  assert.ok(!r2.db.characters.some((c) => c.id === 'c9'), 'the intruder boarded through the re-opened door');
  assert.equal(readFileSync(jsonPath, 'utf8'), tampered, 'the house edited the legacy json (it must never write it)');
});

await okAsync('C4 — THE SAVE LAW: saves write the real house and never touch the json', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-190-'));
  const jsonPath = path.join(userData, 'gendex_db.json');
  const seeded = JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }], appVersion: '1.8.8' });
  writeFileSync(jsonPath, seeded);
  const { handlers } = await bootMain(userData);
  await handlers['db:load']();
  const saved = await handlers['db:save']({}, { characters: [{ id: 'c1', name: 'Burrito' }, { id: 'c2', name: 'Second' }], settings: { theme: 'zine' } });
  assert.equal(saved.ok, true, `the save refused: ${JSON.stringify(saved)}`);
  assert.equal(readFileSync(jsonPath, 'utf8'), seeded, 'a save wrote the legacy json (it must never write it)');
  // 1.9.1 — THE PAPER HOUSE: the save APPENDS the journal now — the changed
  // sections ride as documents, the stamp rides meta, and the shelf grew a
  // rotated .nosql copy.
  const { readNosqlArchive } = await import('../src/utils/nosql_engine.js');
  const read = readNosqlArchive(io, path.join(userData, 'gendex_db.nosql'));
  assert.equal(read.kind, 'ok', 'the journal refused to open');
  assert.equal(read.sections.characters.length, 2, 'the save never reached the house');
  assert.equal(read.sections.settings.theme, 'zine', 'a whole section never rode');
  assert.equal(read.meta.legacyImported, '1', 'the save lost the memory');
  assert.equal(read.meta.appVersion, '1.9.19', 'the save never stamped its own version');
  // the shelf: one rotated .nosql copy, the json backups untouched
  const backupDir = path.join(userData, 'gendex_backups');
  assert.ok(existsSync(backupDir), 'the shelf never grew');
  const shelf = readdirSync(backupDir).filter((n) => /^gendex_db-\d{8}-\d{6}\.nosql$/.test(n));
  assert.equal(shelf.length, 1, 'the rotated copy never shelved');
});

await okAsync('C5 — a corrupt house is set aside and RECOVERED through the legacy door', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-190-'));
  const jsonPath = path.join(userData, 'gendex_db.json');
  writeFileSync(jsonPath, JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }], appVersion: '1.8.8' }));
  const first = await bootMain(userData);
  await first.handlers['db:load']();
  // 1.9.1 — the damage: garbage over the JOURNAL (the flag dies with the
  // store; the sqlite seat is never the live word again).
  writeFileSync(path.join(userData, 'gendex_db.nosql'), '~~~ not a journal ~~~ the house burned down ~~~');
  const second = await bootMain(userData);
  const r = await second.handlers['db:load']();
  assert.equal(r.status, 'migrated', `the recovered seat said "${r.status}"`);
  assert.ok(r.corruptSetAside, 'the burned file was never set aside with its name');
  assert.ok(existsSync(path.join(userData, r.corruptSetAside)), 'the set-aside never kept its bytes');
  assert.ok(r.db?.characters?.[0]?.name === 'Burrito', 'the legacy door never answered the recovery');
});

try {
  rmSync(workDir, { recursive: true, force: true });
} catch {
  /* best effort */
}

// ---------------------------------------------------------------------------
// D. THE NOTICE TELLS THE NEW STORY (the terms move to 1.0.6)
// ---------------------------------------------------------------------------
console.log('\nD. THE NOTICE TELLS THE NEW STORY (the storage report)');

ok('D1 — the terms moved to 1.0.6 (a meaningful change, the gate re-asks)', () => {
  assertMatch(legal, /export const TOS_VERSION = '1\.0\.6';/, 'the terms version never moved');
  assertMatch(legal, /1\.9\.1 — '1\.0\.5' -> '1\.0\.6' \(the experiment's own word/, 'the bump note never spoke');
});
ok('D2 — the document library tells what it is', () => {
  // 1.9.1 — THE PAPER HOUSE: the notice speaks the journal now.
  assert.ok(legal.includes('gendex_db.nosql: the whole library'), 'the house never spoke its name');
  assert.ok(legal.includes('append-only journal of JSON documents'), 'the format word never spoke');
  assert.ok(legal.includes('It is not a server and not a cloud'), 'the local word never spoke');
});
ok('D3 — the one-time imports are told whole (read once, added, remembered)', () => {
  // 1.9.1 — the whole chain speaks: JSON -> SQLite -> NoSQL.
  assert.ok(legal.includes('each upgrade reads the old seat exactly ONCE and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('Releases before 1.9.1 used a SQLite database file (gendex_db.sqlite)'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('the old file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your current library'), 'the deletion word never spoke');
});
ok('D4 — the old story is gone (no file is called "a binary .db file" anymore)', () => {
  assert.ok(!legal.includes('a binary .db file'), 'the old story survived the flip');
  assert.ok(!legal.includes('stored as one plain, human-readable JSON file you can open'), 'the JSON library story survived the flip');
  assert.ok(legal.includes('(including any old SQLite or JSON file an earlier version left there)'), 'the factory reset never flipped its file');
});
ok('D5 — the 1.0.2 em-dash law holds through the pass', () => {
  const codeOnly = legal
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  assert.ok(!codeOnly.includes('\u2014'), 'an em dash survived in the legal code');
});

// ---------------------------------------------------------------------------
// E. THE BADGE WEARS THE WALL'S OWN CLOTH
// ---------------------------------------------------------------------------
console.log("\nE. THE BADGE WEARS THE WALL'S OWN CLOTH (\"stylized too like them\")");

const badgeRule = css.slice(css.indexOf('.gd-about-credit-badge {'), css.indexOf('.gd-about-credit-badge-dot {'));

ok('E1 — the badge rides the link family beside its own class', () => {
  assertMatch(settingsSrc, /className="gd-about-link gd-about-credit-badge"/, 'the badge never joined the family');
  assertMatch(settingsSrc, /1\.8\.9 — THE BADGE WEARS THE WALL'S OWN CLOTH/, 'the cloth note never spoke');
});
ok('E2 — the badge rule overrides NOTHING the family\'s FRAME says (cloth is 1.9.0\'s)', () => {
  // 1.9.0 — BUT THE CLOTH TAKES THE ACCENT'S OWN COLOR: the badge keeps the
  // family's FRAME (geometry, radius, shadow, transition, lift) but its
  // CLOTH — border-color, ink, fill, and its own hover/active deepening —
  // is the accent's own again (see .gd-about-credit-badge in index.css).
  for (const banned of [/border\s*:/, /border-radius\s*:/, /box-shadow\s*:/, /transition\s*:/, /transform\s*:/]) {
    assert.ok(!banned.test(badgeRule), `the badge still steals the family's ${banned}`);
  }
  assertMatch(badgeRule, /border-color: color-mix\(in srgb, var\(--gd-accent\) 45%, transparent\);/, 'the accent border never spoke');
  assertMatch(badgeRule, /color: var\(--gd-accent\);/, 'the accent ink never spoke');
  assertMatch(badgeRule, /background: color-mix\(in srgb, var\(--gd-accent\) 12%, var\(--gd-panel\)\);/, 'the accent tint never spoke');
  assertMatch(css, /\.gd-about-credit-badge:not\(:disabled\):hover \{[\s\S]*?background: color-mix\(in srgb, var\(--gd-accent\) 22%, var\(--gd-panel\)\);/, 'the badge hover never deepened');
  // the family's own lift still answers underneath the badge's cloth
  assertMatch(css, /\.gd-about-link:not\(:disabled\):hover \{[\s\S]*?transform: translateY\(-1px\);/, 'the family hover never spoke');
});
ok('E3 — the badge speaks the label voice (the family metrics)', () => {
  assertMatch(badgeRule, /font-size: 9px;/, 'the label size never matched');
  assertMatch(badgeRule, /font-weight: 800;/, 'the label weight never matched');
  assertMatch(badgeRule, /letter-spacing: 0\.12em;/, 'the label spacing never matched');
  assertMatch(css, /\.gd-about-credit-badge-dot \{[\s\S]*?background: var\(--gd-accent\);/, 'the dot lost its accent');
});

// ---------------------------------------------------------------------------
// F. THE VERSION FURNITURE + THE FIRST PUBLIC RELEASE
// ---------------------------------------------------------------------------
console.log('\nF. THE VERSION FURNITURE + THE FIRST PUBLIC RELEASE');

ok('F1 — the version is 1.8.9 everywhere', () => {
  assert.equal(pkg.version, '1.9.19', 'package.json');
  assert.ok((lock.match(/"version": "1\.9\.19"/g) || []).length >= 2, 'the lock root pins never moved');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  assertMatch(changelog, /^## 1\.8\.8 — The Layout Census/m, 'the 1.8.8 entry lost its seat');
});
ok('F2 — THE PUBLIC FACE: features, not history (no version roll in the README)', () => {
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'a version-history paragraph spoke in the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.9.1 — the storage feature speaks the document database now.
  assertMatch(readme, /Local NoSQL document database/, 'the storage feature never spoke');
  assertMatch(readme, /One-time import/, 'the import feature never spoke');
  assertMatch(readme, /gendex_db\.sqlite/, 'the house never spoke its name in the README');
});
ok('F3 — the README carries no private material', () => {
  const low = readme.toLowerCase();
  assert.ok(!low.includes('password'), 'a password spoke in the README');
  assert.ok(!low.includes('ilovemumei'), 'the private word spoke in the README');
  assert.ok(!readme.includes('signtool'), 'a signing command spoke in the README');
  assert.ok(!readme.includes('.pfx'), 'a certificate path spoke in the README');
  assert.ok(!readme.includes('SIGNING_CERT'), 'a signing variable spoke in the README');
});
ok('F4 — the CI parse gate carries the house modules', () => {
  assertMatch(ci, /parse_check\.mjs[^\n]*sqlite_engine\.js[^\n]*sqlite_wasm\.js/, 'the gate never learned the engine modules');
});
ok('F5 — the battery welcomes this very suite', () => {
  assertMatch(battery, /gendex_189_batch_dom gendex_190_batch_dom/, 'the battery never registered the 190 suite');
});
ok('F6 — the worklog keeps the 1.8.9 seat', () => {
  assertMatch(worklog, /1\.8\.9 — The Library's Own House/, 'the worklog entry never arrived');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
