// 1.8.10 batch — The Engine's Own Seat.
// (Named 191 in the sequence: 190 pins the 1.8.9 laws; this suite pins the
//  1.8.10 laws at their roots. Built from the 1.8.9 tree — the release
//  line continues.)
// The reported item, pinned at its root law:
//   A.  THE BOOT REPORT ("App threw an error during load — Error: Cannot
//       find module 'sql.js'", on a machine whose node_modules never
//       carried the package): the engine's whole body rides the tree now —
//       the glue vendored beside the fuel it already carried — and sql.js
//       is struck from the dependencies, so the boot can never again
//       depend on a package the app does not carry. The four vendoring
//       cures are pinned at their source seats, and the loader rule that
//       used to patch the node_modules glue on the fly is retired with its
//       patient (a vendored file carries its cure forever).
//   B.  THE ENGINE, LIVE, FROM ITS OWN SEAT — the vendored pair wakes in
//       the batteries' native ES-module home (no node_modules lamps: the
//       node-lamp cure speaks), speaks the real SQLite format, and the
//       door's verdicts keep their 1.8.9 tongues (missing / corrupt / ok).
//   C.  THE HOUSE ANSWERS THE BOOT — from inside the compiled artifact,
//       with NO sql.js anywhere in node_modules: the real entry compiles
//       dev AND production, the engine's body rides the bundle (the
//       sqlite3 vocabulary inlined, the missing-module shim gone, the
//       emcc export guard statically cured), a fresh seat says 'missing',
//       a legacy JSON seat is folded in once ('migrated', the flag
//       stamped INSIDE the file) and a tampered json never boards twice.
//   D.  THE FURNITURE — the version seats speak 1.8.10, the changelog
//       head tells this story, the parse gate walks the whole engine trio,
//       the battery welcomes this very suite, and the worklog keeps its
//       seat.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
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
const glueSrc = src('src/utils/sqlite_glue.js');
const wasmSrc = src('src/utils/sqlite_wasm.js');
const { SQLITE_WASM_B64 } = await import('../src/utils/sqlite_wasm.js');
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
// A. THE ENGINE'S OWN SEAT — the source laws
// ---------------------------------------------------------------------------
console.log('\nA. THE ENGINE\'S OWN SEAT (the boot report: "Cannot find module \'sql.js\'")');

ok('A1 — the vendored glue speaks its own seat (with the report own words)', () => {
  assert.ok(existsSync(path.join(root, '..', 'src', 'utils', 'sqlite_glue.js')), 'the vendored glue is missing from the tree');
  // 1.9.0 — the birth tombstone: the glue's own note keeps its 1.8.10 birth
  // version in the source forever (the sweep's word is for LIVE pins).
  assertMatch(glueSrc, /1\.8\.10 — THE ENGINE'S OWN SEAT \(the boot report: "App threw an error\s*\n\/\/ during load — Error: Cannot find module 'sql\.js'"/, 'the seat note never spoke');
  assertMatch(glueSrc, /sql\.js@1\.13\.0 \(MIT/, 'the provenance word never spoke');
});
ok('A2 — the engine takes its seat from the TREE, never from node_modules', () => {
  assertMatch(engineSrc, /import initSqlJs from '\.\/sqlite_glue\.js';/, 'the engine never took its vendored seat');
  assertMatch(engineSrc, /import \{ SQLITE_WASM_B64 \} from '\.\/sqlite_wasm\.js';/, 'the embedded fuel lost its seat');
  assertMatch(engineSrc, /initSqlJs\(\{ wasmBinary: Buffer\.from\(SQLITE_WASM_B64, 'base64'\) \}\)/, 'the engine never drank its embedded fuel');
  // no file of the app's own tree may ask node_modules for the engine
  for (const f of ['src/main.js', 'src/preload.js', 'src/utils/sqlite_engine.js']) {
    const t = src(f);
    assert.ok(!/from 'sql\.js'|require\('sql\.js'\)|from "sql\.js"|require\("sql\.js"\)/.test(t), `${f} still asks node_modules for the engine`);
  }
});
ok('A3 — the dependency is STRUCK: the app carries no sql.js of its own', () => {
  assert.ok(!('sql.js' in (pkg.dependencies || {})), 'sql.js still rides package.json dependencies');
  assert.ok(!('sql.js' in (pkg.devDependencies || {})), 'sql.js still rides package.json devDependencies');
  assert.ok(!/"node_modules\/sql\.js"/.test(lock), 'the lock still seats a sql.js package');
  assert.ok(!/node_modules[\\/]sql\.js/.test(mainConfigSrc), 'the webpack config still knows the node_modules path');
  assert.ok(!existsSync(path.join(root, '..', 'node_modules', 'sql.js')), 'a sql.js package sits in node_modules (the proof seat itself went soft)');
});
ok('A4 — the four cures are pinned at their source seats', () => {
  // 1.9.0 — the birth tombstones: the vendored cures keep their 1.8.10 birth
  // versions in the glue's own prose forever (the sweep's word is for LIVE pins).
  assertMatch(glueSrc, /vendored cure 1 \(1\.8\.10\): `module` no longer exists in this ES module/, 'cure 1 (the undefine ritual) never spoke');
  assertMatch(glueSrc, /vendored cure 2 \(1\.8\.10\): the emcc node-export path is dead inside the app bundle/, 'cure 2 (the emcc export guard) never spoke');
  assertMatch(glueSrc, /1\.8\.10 — vendored cure 3: the UMD tail retired/, 'cure 3 (the UMD tail) never spoke');
  assertMatch(glueSrc, /"renderer"!=process\.type&&"string"==typeof __dirname/, 'cure 4 (the node-lamp test) never spoke');
  // and none of the dead bindings may live outside comments
  const live = glueSrc.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('/*') && !l.trim().startsWith('*')).join('\n');
  for (const banned of [/module\s*=\s*undefined/, /module\.exports\s*=\s*initSqlJs/, /exports\["Module"\]/, /typeof\s+exports\s*===\s*'object'/]) {
    assert.ok(!banned.test(live), `a dead binding still lives: ${banned}`);
  }
  assertMatch(glueSrc, /export default initSqlJs;\s*\nexport \{ initSqlJs \};/, 'the module\'s own export never took its seat');
});
ok('A5 — the runtime loader rule retires with its patient (the cure moved to the source)', () => {
  // 1.9.0 — the birth tombstone: the retirement note keeps its 1.8.10 birth
  // version in webpack.main.config.js's own prose forever.
  assertMatch(mainConfigSrc, /1\.8\.10 — THE SQL\.JS COMPAT SHIM RULE, RETIRED/, 'the retirement note never spoke');
  assert.ok(!/sqljs_compat_loader\.cjs/.test(mainConfigSrc), 'the config still speaks the retired loader');
  assert.ok(existsSync(path.join(root, 'sqljs_compat_loader.cjs')), 'the cure\'s own history lost its seat');
  assert.ok(existsSync(path.join(root, 'embed_sqlite_glue_1810.py')), 'the vendoring script lost its seat');
  assertMatch(src('scripts/embed_sqlite_glue_1810.py'), /the pair disagrees/, 'the pair-verification word never spoke');
});
ok('A6 — the fuel still rides its 1.8.9 seat, a real wasm binary', () => {
  assertMatch(wasmSrc, /export const SQLITE_WASM_B64 = \[/, 'the fuel stopped riding the flat array');
  const bytes = Buffer.from(SQLITE_WASM_B64, 'base64');
  assert.ok(bytes.length > 600000, 'the fuel is suspiciously small');
  assert.equal(bytes[0], 0x00, 'the wasm magic never spoke (byte 0)');
  assert.equal(bytes[1], 0x61, 'the wasm magic never spoke (byte 1)');
  assert.equal(bytes[2], 0x73, 'the wasm magic never spoke (byte 2)');
  assert.equal(bytes[3], 0x6d, 'the wasm magic never spoke (byte 3)');
});
ok('A7 — THE PURITY LAW, kept: the renderer never learns the engine\'s name', () => {
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
    assert.ok(!/sqlite_engine|sqlite_glue/.test(t), `${f} learned the engine's name`);
    assert.ok(!/sql\.js/.test(t), `${f} learned the dependency's name`);
  }
  assertMatch(engineSrc, /PURITY LAW \(the dbio\.js rule, kept\): the renderer never imports this\s*\n\/\/ module/, 'the purity note never spoke');
});

// ---------------------------------------------------------------------------
// B. THE ENGINE, LIVE, FROM ITS OWN SEAT — the vendored pair, no lamps
// ---------------------------------------------------------------------------
console.log('\nB. THE ENGINE, LIVE ("no node_modules lookups ... at runtime")');

const { initSqliteEngine, openSqliteFile, readSqliteArchive, buildSqliteArchive, exportSqliteBytes, SQLITE_SCHEMA_VERSION, STAMP_KEYS } =
  await import('../src/utils/sqlite_engine.js');
const io = { fs: require_('node:fs'), join: path.join };
const SQL = await initSqliteEngine();

const stage = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'gd-seat-191-'));
  return { dir, sqliteFile: path.join(dir, 'gendex_db.sqlite') };
};

ok('B1 — the vendored pair wakes in the native ES-module seat and speaks real SQLite', () => {
  const seat = stage();
  const archive = buildSqliteArchive(SQL, { characters: [{ id: 'c1', name: 'Vendored' }] }, { legacyImported: '1', appVersion: '1.9.19' });
  const bytes = exportSqliteBytes(archive);
  archive.close();
  assert.equal(Buffer.from(bytes.slice(0, 15)).toString('latin1'), 'SQLite format 3', 'the exported bytes are not a real SQLite file');
  writeFileSync(seat.sqliteFile, Buffer.from(bytes));
  const open = openSqliteFile(io, SQL, seat.sqliteFile);
  try {
    assert.equal(open.kind, 'ok', 'the vendored engine refused its own house');
    const read = readSqliteArchive(open.db);
    assert.equal(read.sections.characters[0].name, 'Vendored', 'the section did not ride');
    assert.equal(read.meta.appVersion, '1.9.19', 'the stamp did not ride meta');
  } finally {
    try { open.db.close(); } catch { /* already gone */ }
  }
  rmSync(seat.dir, { recursive: true, force: true });
});
ok('B2 — the door keeps its 1.8.9 tongues (missing / corrupt / ok)', () => {
  const seat = stage();
  assert.equal(openSqliteFile(io, SQL, seat.sqliteFile).kind, 'missing', 'an absent seat said something else');
  writeFileSync(seat.sqliteFile, '~~~ not a database ~~~ nobody home ~~~');
  assert.equal(openSqliteFile(io, SQL, seat.sqliteFile).kind, 'corrupt', 'a text file wearing the name read as ok');
  const archive = buildSqliteArchive(SQL, {}, {});
  writeFileSync(seat.sqliteFile, Buffer.from(exportSqliteBytes(archive)));
  archive.close();
  assert.equal(openSqliteFile(io, SQL, seat.sqliteFile).kind, 'ok', 'a real house refused to open');
  rmSync(seat.dir, { recursive: true, force: true });
});
ok('B3 — the house shape did not drift with the seat (schema v1, the stamp keys)', () => {
  assert.equal(SQLITE_SCHEMA_VERSION, 1, 'the shape number drifted');
  assert.deepEqual(STAMP_KEYS, ['appVersion', 'savedAt', 'schemaVersion'], 'the stamp keys drifted');
});

// ---------------------------------------------------------------------------
// C. THE HOUSE ANSWERS THE BOOT — the compiled artifact, NO sql.js aboard
// ---------------------------------------------------------------------------
console.log('\nC. THE HOUSE ANSWERS THE BOOT (the compiled bundle, no sql.js in node_modules)');

const workDir = mkdtempSync(path.join(os.tmpdir(), 'gd-pack-191-'));
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

await okAsync('C0 — the real entry compiles dev AND production with no sql.js aboard', async () => {
  await compile(forgeLikeMain('development'));
  await compile(forgeLikeMain('production'));
  for (const mode of ['development', 'production']) {
    const bundle = readFileSync(path.join(workDir, mode, 'index.js'), 'utf8');
    assert.ok(bundle.length > 1000, `the ${mode} bundle is suspiciously small`);
    assert.ok(bundle.includes('SQLite format 3'), `the magic-door word never reached the ${mode} bundle`);
    assert.ok(bundle.includes('gendex_meta'), `the meta table never reached the ${mode} bundle`);
    assert.ok(bundle.includes('sqlite3_open'), `the engine's own body (the sqlite3 vocabulary) never reached the ${mode} bundle`);
    // THE BOOT REPORT'S OWN SHAPE: the missing-module shim, gone (the
    // report's own words are quoted by the vendored seat's comments, so
    // their absence is only a production law — terser strips the comments,
    // and any survivor there would be the shim's living code)
    assert.ok(!bundle.includes('webpackMissingModule'), `a missing module still rides the ${mode} bundle`);
    assert.ok(!/"undefined"\s*!=\s*typeof\s+module\s*&&\s*\(module\.exports\s*=\s*\w+\)/.test(bundle), `the emcc export guard survived into the ${mode} bundle`);
    if (mode === 'production') {
      assert.ok(!bundle.includes("Cannot find module 'sql.js'"), `the boot report's own words still ride the ${mode} bundle`);
    }
  }
});

const bootMain = async (mode, userData) => {
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
    constructor() { windows.push(this); }
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
  const bundlePath = path.join(workDir, mode, 'index.js');
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

await okAsync('C1 — THE DEV BOOT (the report\'s own mode): a fresh seat says missing and builds no house', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-191-'));
  const { handlers, windows } = await bootMain('development', userData);
  assert.equal(windows.length, 1, 'the window never arrived');
  const r = await handlers['db:load']();
  assert.equal(r.status, 'missing', `fresh seat said "${r.status}"`);
  assert.equal(r.db, null, 'a fresh seat handed the renderer a db');
  assert.ok(!existsSync(path.join(userData, 'gendex_db.sqlite')), 'a fresh boot built a house nobody asked for');
});

await okAsync('C2 — the production boot folds a legacy JSON in once, the flag riding INSIDE the file', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-191-'));
  writeFileSync(
    path.join(userData, 'gendex_db.json'),
    JSON.stringify({ characters: [{ id: 'c1', name: 'Seat Burrito' }], settings: { theme: 'zine' }, appVersion: '1.8.9', savedAt: 1, schemaVersion: 2 })
  );
  const { handlers } = await bootMain('production', userData);
  const r = await handlers['db:load']();
  assert.equal(r.status, 'migrated', `a legacy seat said "${r.status}"`);
  assert.equal(r.fromAppVersion, '1.8.9', 'the imported stamp never rode the verdict');
  assert.ok(r.db?.characters?.[0]?.name === 'Seat Burrito', 'the archive did not fold in whole');
  // 1.9.1 — THE PAPER HOUSE: the fold-in lands in the document store now
  // (the sqlite house is never built again — the JSON door writes the journal).
  const { readNosqlArchive } = await import('../src/utils/nosql_engine.js');
  const nosqlFile = path.join(userData, 'gendex_db.nosql');
  assert.ok(existsSync(nosqlFile), 'the house was never built');
  const read = readNosqlArchive(io, nosqlFile);
  assert.equal(read.kind, 'ok', 'the journal refused to open');
  assert.equal(read.meta.legacyImported, '1', 'the flag never stamped inside the store');
  assert.equal(read.meta.appVersion, '1.8.9', 'meta lost the imported stamp');
});

await okAsync('C3 — THE NO-REIMPORT PROOF from inside the compiled bundle: a tampered json never boards twice', async () => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-191-'));
  const jsonPath = path.join(userData, 'gendex_db.json');
  writeFileSync(jsonPath, JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }], appVersion: '1.8.9' }));
  const first = await bootMain('production', userData);
  const r1 = await first.handlers['db:load']();
  assert.equal(r1.status, 'migrated', 'the first boot never migrated');
  const tampered = JSON.stringify({ characters: [{ id: 'c1', name: 'Burrito' }, { id: 'c9', name: 'INTRUDER' }] });
  writeFileSync(jsonPath, tampered);
  const second = await bootMain('production', userData);
  const r2 = await second.handlers['db:load']();
  assert.equal(r2.status, 'ok', `the second boot said "${r2.status}" (the door re-opened!)`);
  assert.ok(!r2.db.characters.some((c) => c.id === 'c9'), 'the intruder boarded through the re-opened door');
  assert.equal(readFileSync(jsonPath, 'utf8'), tampered, 'the house edited the legacy json (it must never write it)');
});

// ---------------------------------------------------------------------------
// D. THE FURNITURE
// ---------------------------------------------------------------------------
console.log('\nD. THE FURNITURE');

ok('D1 — the version is 1.9.0 everywhere', () => {
  assert.equal(pkg.version, '1.9.19', 'package.json');
  assert.ok((lock.match(/"version": "1\.9\.19"/g) || []).length >= 2, 'the lock root pins never moved');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  assertMatch(changelog, /^## 1\.8\.9 — The Library's Own House/m, 'the 1.8.9 entry lost its seat');
});
ok('D2 — the battery and the README welcome this very suite', () => {
  assertMatch(battery, /gendex_190_batch_dom gendex_191_batch_dom/, 'the battery never registered the 191 suite');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
});
ok('D3 — the CI parse gate walks the whole engine trio', () => {
  assertMatch(ci, /parse_check\.mjs[^\n]*sqlite_engine\.js[^\n]*sqlite_wasm\.js[^\n]*sqlite_glue\.js/, 'the gate never learned the glue module');
});
ok('D4 — the worklog keeps the 1.8.10 seat', () => {
  // 1.9.0 — the birth tombstone: the worklog keeps EVERY version's entry —
  // this one watches the 1.8.10 seat the suite was born under.
  assertMatch(worklog, /1\.8\.10 — The Engine's Own Seat/, 'the worklog entry never arrived');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
