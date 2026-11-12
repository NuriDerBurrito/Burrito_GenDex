// 1.5.6 batch — The Door Ships With The House.
// The reported item, pinned at its root law:
//   A. SOURCE LAWS — main.js speaks ESM imports only (ZERO require()
//      call sites in live code — the raw-require disease that killed the
//      1.5.5 packaged build, and the 1.1.7 squirrel build before it),
//      webpack.main.config.js forces javascript/auto for the main entry
//      (THE PACKAGED-MAIN GUARD, the net underneath), and preload.js —
//      the one file that still speaks CJS by right — still requires
//      nothing but 'electron' (the raw-require floor that has always
//      worked at preload runtime).
//   B. BUILD LAWS — the REAL entry at its REAL path, built exactly the
//      way the forge plugin builds it (electron-main target, commonjs2
//      output, the renderer-entry Defines, dev AND production): dbio.js
//      IN the compiled module graph, ZERO raw relative requires in the
//      emitted text (a relative require in a bundle = an un-bundled
//      module = the exact crash class), and the salvage door's own
//      vocabulary inlined in the production artifact.
//   C. BOOT LAWS — the emitted bundles BOOT under plain Node with
//      'electron' stubbed (the user's crash reproduces HERE whenever a
//      module is missing), the whenReady chain runs for real (window
//      created, protocol + handlers registered), and db:load answers
//      END-TO-END from inside the compiled artifact: a fresh seat says
//      'missing', a seeded archive reads whole carrying its version
//      stamp, and a corrupt seat is set aside with its evidence
//      preserved — the door ships with the house.
// The 1.5.5 session's interop probe was blind to all of this because its
// probe entry lived OUTSIDE src/ (where src/package.json's
// {"type":"module"} never applied) — this battery builds the real entry,
// and the manual twin ships with the source (scripts/probe_main_bundle.cjs).

import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import os from 'node:os';
import webpack from 'webpack';

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
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};
assert.ok = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.match = (text, re, msg) => {
  if (!re.test(String(text))) throw new Error(msg || `expected ${re} in the text`);
};

// String-aware comment stripper — a naive // strip would eat 'https://…'
// inside strings, and main.js's own 1.1.7 note quotes a require() inside
// a comment (which is exactly the noise the law must NOT count).
const stripComments = (code) => {
  let out = '';
  let i = 0;
  let mode = 'code';
  while (i < code.length) {
    const c = code[i];
    const d = code[i + 1];
    if (mode === 'code') {
      if (c === '/' && d === '/') { mode = 'line'; i += 2; continue; }
      if (c === '/' && d === '*') { mode = 'block'; i += 2; continue; }
      if (c === "'") { mode = 'single'; out += c; i += 1; continue; }
      if (c === '"') { mode = 'double'; out += c; i += 1; continue; }
      if (c === '`') { mode = 'template'; out += c; i += 1; continue; }
      out += c; i += 1; continue;
    }
    if (mode === 'line') {
      if (c === '\n') { mode = 'code'; out += c; }
      i += 1; continue;
    }
    if (mode === 'block') {
      if (c === '*' && d === '/') { mode = 'code'; i += 2; continue; }
      i += 1; continue;
    }
    if (c === '\\') { out += c + (d || ''); i += 2; continue; }
    if ((mode === 'single' && c === "'") || (mode === 'double' && c === '"') || (mode === 'template' && c === '`')) {
      mode = 'code'; out += c; i += 1; continue;
    }
    out += c; i += 1; continue;
  }
  return out;
};

const requireSites = (code) =>
  [...stripComments(code).matchAll(/\brequire\s*\(\s*(['"][^'"]+['"])\s*\)/g)].map((m) => m[1].slice(1, -1));

// ---------------------------------------------------------------------------
// A. SOURCE LAWS — the main process's module voice
// ---------------------------------------------------------------------------
const mainSrc = src('src/main.js');
const preloadSrc = src('src/preload.js');
const mainConfigSrc = src('webpack.main.config.js');

ok('A1 — main.js speaks imports only: ZERO require() call sites in live code', () => {
  const sites = requireSites(mainSrc);
  assert.equal(sites.length, 0, `raw require survived in main.js: ${sites.join(', ')}`);
});

ok('A2 — the salvage door is a static import (bundled, build-checked)', () => {
  assert.match(
    mainSrc,
    /import\s*\{[^}]*readDatabaseFile[^}]*setAsideCorruptDb[^}]*stampDatabaseForSave[^}]*parseDbText[^}]*\}\s*from\s*'\.\/utils\/dbio\.js'/,
    'main.js never imports dbio statically'
  );
});

ok('A3 — electron and the node builtins arrive as imports, not requires', () => {
  assert.match(mainSrc, /import\s*\{[^}]*\bapp\b[^}]*BrowserWindow[^}]*\}\s*from\s*'electron'/, 'electron import missing');
  for (const builtin of ['node:path', 'node:fs', 'node:url', 'node:child_process', 'node:zlib']) {
    assert(new RegExp(`from\\s*'${builtin.replace(/[/]/g, '\\/')}'`).test(mainSrc), `${builtin} import missing`);
  }
});

ok('A4 — webpack.main.config.js carries THE PACKAGED-MAIN GUARD (javascript/auto for the entry)', () => {
  assert(mainConfigSrc.includes("type: 'javascript/auto'"), 'the auto-type rule is gone');
  // the file literally carries src[\\/]main (a two-backslash character
  // class: backslash or slash, so it matches both windows and posix paths)
  assert(mainConfigSrc.includes('src[\\\\/]main'), 'the rule no longer matches src/main.js');
  assert(/PACKAGED-MAIN GUARD/.test(mainConfigSrc), 'the guard note is gone');
});

ok('A5 — preload.js still requires nothing but electron (the raw-require floor holds)', () => {
  const sites = requireSites(preloadSrc);
  assert(sites.length > 0, 'preload lost its electron require entirely?');
  for (const s of sites) assert.equal(s, 'electron', `preload requires something beyond electron: ${s}`);
});

ok('A6 — the manual packaging probe ships with the source', () => {
  assert(existsSync(path.join(root, 'probe_main_bundle.cjs')), 'scripts/probe_main_bundle.cjs is missing');
});

// ---------------------------------------------------------------------------
// B + C. THE REAL BUILD, THE REAL BOOT — the forge plugin's own recipe
// ---------------------------------------------------------------------------
const workDir = mkdtempSync(path.join(os.tmpdir(), 'gd-pack-162-'));

// A faithful mirror of what @electron-forge/plugin-webpack generates for
// the MAIN process config around the project's webpack.main.config.js.
const forgeLikeMain = (mode) => ({
  ...require_(path.join(root, '..', 'webpack.main.config.js')),
  mode,
  target: 'electron-main',
  entry: path.join(root, '..', 'src', 'main.js'),
  output: {
    path: path.join(workDir, mode),
    filename: 'index.js',
    library: { type: 'commonjs2' },
  },
  devtool: mode === 'development' ? 'source-map' : false,
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
      if (stats.hasErrors()) {
        return reject(new Error(stats.toString({ errors: true, chunks: false, modules: false })));
      }
      resolve(stats);
    });
  });

const rawRelativeRequires = (text) =>
  [...text.matchAll(/require\(\s*(['"])(\.[^'"]*)\1\s*\)/g)].map((m) => m[2]);

const dbioInGraph = (stats) => {
  const json = stats.toJson({ modules: true, assets: false, chunks: false });
  return (json.modules || []).some((m) => /dbio\.js/.test(String(m.identifier || m.name || m.resource || '')));
};

let devStats = null;
let prodStats = null;
let devBundle = '';
let prodBundle = '';

await okAsync('B1 — the real entry compiles under the forge-mirror config (dev)', async () => {
  devStats = await compile(forgeLikeMain('development'));
  devBundle = readFileSync(path.join(workDir, 'development', 'index.js'), 'utf8');
  assert(devBundle.length > 1000, 'the dev bundle is suspiciously small');
});

ok('B2 — the salvage door is IN the compiled module graph (dev)', () => {
  assert(dbioInGraph(devStats), 'src/utils/dbio.js never entered the compilation');
});

ok('B3 — the emitted dev bundle carries ZERO raw relative requires + the door\'s own words', () => {
  const raw = rawRelativeRequires(devBundle);
  assert.equal(raw.length, 0, `raw relative requires survived into the bundle: ${raw.join(', ')}`);
  assert(devBundle.includes('THE TEXT DOOR'), 'dbio\'s text-door note is not in the bundle (not inlined)');
});

await okAsync('B4 — the production build (what actually ships in the asar)', async () => {
  prodStats = await compile(forgeLikeMain('production'));
  prodBundle = readFileSync(path.join(workDir, 'production', 'index.js'), 'utf8');
  assert(dbioInGraph(prodStats), 'dbio.js missing from the production graph');
  const raw = rawRelativeRequires(prodBundle);
  assert.equal(raw.length, 0, `raw relative requires in the SHIPPING bundle: ${raw.join(', ')}`);
  // the stamp vocabulary, inlined as code (prod strips comments, so these
  // literals can only come from dbio's living source, not its notes)
  assert(prodBundle.includes('schemaVersion'), 'the stamp vocabulary is not inlined');
  assert(prodBundle.includes('savedAt'), 'the stamp vocabulary is not inlined');
});

// The electron stand-in for the boot laws. Captures everything the
// whenReady chain touches so the drive can see the compiled main WORK.
const bootMain = async (bundlePath, { seed } = {}) => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-162-'));
  if (seed != null) writeFileSync(path.join(userData, 'gendex_db.json'), seed);
  const handlers = {};
  const protocols = {};
  const windows = [];
  const noop = () => {};
  const app = {
    setName: noop,
    getPath: (which) => (which === 'userData' ? userData : path.join(userData, which)),
    getVersion: () => '1.6.2',
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
    protocol: { registerSchemesAsPrivileged: noop, handle: (scheme, fn) => { protocols[scheme] = fn; } },
    net: {}, shell: {}, dialog: {}, clipboard: {}, nativeImage: {}, screen: {},
  };
  const origLoad = Module._load;
  Module._load = function patched(request) {
    if (request === 'electron') return electron;
    return origLoad.apply(this, arguments);
  };
  try {
    // a fresh module instance per seat (require caches the module init)
    const resolved = require_.resolve(bundlePath);
    delete require_.cache[resolved];
    require_(resolved); // ← the user's crash fires HERE when a module is missing
    await Promise.resolve();
    await Promise.resolve();
    // 1.8.9 — THE ENGINE WAKES IN ITS OWN BREATH: the house's priming door
    // awaits a real wasm compile, and WebAssembly resolves on the job queue
    // (a MACROTASK) — two microtask ticks can never cover a boot whose house
    // actually primed. A true tick of the clock waits the prime out before
    // the drive reads the seats. (Before 1.8.9 the engine failed fast and
    // the JSON fallback answered within the ticks — the timing law changed
    // the day the engine became real.)
    await new Promise((r) => setTimeout(r, 250));
    return { handlers, protocols, windows, userData };
  } finally {
    Module._load = origLoad;
  }
};

await okAsync('C1 — the compiled dev bundle BOOTS: window created, handlers registered, fresh seat says missing', async () => {
  const { handlers, protocols, windows, userData } = await bootMain(path.join(workDir, 'development', 'index.js'));
  assert.equal(windows.length, 1, 'the whenReady chain never created the window');
  assert(protocols['local-resource'], 'the local-resource protocol never registered');
  assert(handlers['db:load'], 'db:load never registered');
  const r = await handlers['db:load']();
  assert.equal(r.status, 'missing', `fresh seat said "${r.status}"`);
  assert.equal(r.db, null, 'a fresh seat must hand the renderer a null db');
  assert(existsSync(path.join(userData, 'gendex_images')), 'the images seat was never built');
});

await okAsync('C2 — the compiled PRODUCTION bundle reads a real archive whole, stamp and all', async () => {
  const seeded = JSON.stringify({
    characters: [{ id: 'c1', name: 'Probe Burrito' }],
    classes: [],
    tags: [],
    settings: { theme: 'nuri' },
    appVersion: '1.5.5',
    savedAt: 1700000000000,
    schemaVersion: 2,
  });
  const { handlers } = await bootMain(path.join(workDir, 'production', 'index.js'), { seed: seeded });
  const r = await handlers['db:load']();
  // 1.8.9 — THE HOUSE ANSWERS FIRST: a seeded legacy JSON archive is FOLDED
  // IN at the boot's priming door (the one-time import), so the load speaks
  // 'migrated' — and the stamps ride the database's own meta table now,
  // never the sections the renderer reads.
  assert.equal(r.status, 'migrated', `seeded seat said "${r.status}"`);
  assert.equal(r.fromAppVersion, '1.5.5', 'the stamp did not ride the read');
  assert.ok(r.db && Array.isArray(r.db.characters) && r.db.characters[0].name === 'Probe Burrito', 'the archive did not read whole');
  assert.equal(r.db.appVersion, undefined, 'the raw stamp fields retired to the house meta table');
});

await okAsync('C3 — a corrupt seat is SET ASIDE from inside the compiled bundle (evidence preserved)', async () => {
  const { handlers, userData } = await bootMain(path.join(workDir, 'development', 'index.js'), {
    seed: '~~~ not json ~~~ nobody home ~~~',
  });
  const r = await handlers['db:load']();
  assert.equal(r.status, 'corrupt', `corrupt seat said "${r.status}"`);
  assert.ok(r.corruptSetAside, 'the set-aside never reported a name');
  assert(existsSync(path.join(userData, r.corruptSetAside)), 'the corrupt file was not actually renamed aside');
  assert(!existsSync(path.join(userData, 'gendex_db.json')), 'the broken file still squats on the db seat');
});

try {
  rmSync(workDir, { recursive: true, force: true });
} catch {
  /* best effort */
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
