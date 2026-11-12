#!/usr/bin/env node
// 1.5.6 — THE PACKAGING PROBE (the lesson of the 1.5.5 build crash).
//
// The shipped 1.5.5 packaged app died at boot with:
//     Error: Cannot find module '../src/utils/dbio.js'
//     Require stack: …/app.asar/.webpack/main/index.js
//
// Root cause: src/main.js spoke CommonJS (`require(...)`) while
// src/package.json declares {"type":"module"} — so webpack parsed the file
// as an ES module, and in ESM webpack does NOT bundle `require()` calls:
// it leaves them as raw runtime Node requires. Every require the file ever
// made was 'electron' or a node builtin (resolvable at runtime inside the
// asar), so the app quietly rode on un-bundled requires for its whole
// history — until 1.5.5 added the FIRST RELATIVE require
// (../src/utils/dbio.js), which does not exist next to .webpack/main/.
// The 1.1.7 squirrel-startup crash was the same disease, earlier.
//
// The 1.5.5 session's interop probe was blind to this because its test
// entry lived OUTSIDE src/ (no {"type":"module"} above it) — webpack
// parsed it javascript/auto and bundled the require happily. This probe
// exists so that mistake can never repeat: it builds the REAL entry at
// its REAL path with a faithful mirror of the forge plugin's main-config
// generation, then inspects the EMITTED BUNDLE (the thing the asar runs):
//
//   1. stats: src/utils/dbio.js must be IN the compilation graph;
//   2. the emitted text must contain NO raw relative require()
//      (a relative require in the bundle = an un-bundled module = the
//      exact crash class);
//   3. the emitted bundle must BOOT under plain Node with 'electron'
//      stubbed — the literal reproduction of the user's crash: a missing
//      module throws at require time, before any window exists.
//
// Run plain for a report; pass --expect-clean to exit non-zero when any
// packaging law is violated (the batteries run it that way).
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const Module = require('module');
const webpack = require('webpack');

const root = path.resolve(__dirname, '..');
const base = require(path.join(root, 'webpack.main.config.js'));

const expectClean = process.argv.includes('--expect-clean');
const onlyProd = process.argv.includes('--prod');

// A faithful mirror of what @electron-forge/plugin-webpack generates for
// the MAIN process config around the user's webpack.main.config.js:
// target, the real entry, .webpack-shaped output (commonjs2 library),
// devtool per mode, and the renderer-entry Defines the source references
// (MAIN_WINDOW_WEBPACK_ENTRY / MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY).
const forgeLikeMain = (mode) => ({
  ...base,
  mode,
  target: 'electron-main',
  entry: path.join(root, 'src/main.js'),
  output: {
    path: path.join(root, '.probe-main', mode),
    filename: 'index.js',
    library: { type: 'commonjs2' },
  },
  devtool: mode === 'development' ? 'source-map' : false,
  plugins: [
    ...(base.plugins || []),
    new webpack.DefinePlugin({
      MAIN_WINDOW_WEBPACK_ENTRY: JSON.stringify(
        'file://' + path.join(root, '.probe-main', 'index.html')
      ),
      MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: JSON.stringify(
        path.join(root, '.probe-main', 'preload.js')
      ),
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

// The 'electron' stand-in for the boot check. The compiled main only
// TOUCHES these at module load: app.setName, app.getPath('userData'),
// protocol.registerSchemesAsPrivileged, app.whenReady().then(...),
// app.on('window-all-closed'). Everything else (BrowserWindow, ipcMain,
// net, …) is referenced at import time but only CALLED inside callbacks
// that never run without a real app — so the stub keeps them inert.
const makeElectronStub = () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-probe-userdata-'));
  const noop = () => {};
  const app = {
    setName: noop,
    getPath: (which) => (which === 'userData' ? userData : path.join(userData, which)),
    getVersion: () => '0.0.0-probe',
    on: noop,
    quit: noop,
    whenReady: () => ({ then: noop, catch: noop, finally: noop }),
  };
  const BrowserWindow = class {
    constructor() {}
    loadURL() {}
    once() {}
    on() {}
    destroy() {}
    isDestroyed() {
      return true;
    }
    static getAllWindows() {
      return [];
    }
  };
  return {
    app,
    BrowserWindow,
    ipcMain: { handle: noop, on: noop, removeHandler: noop },
    protocol: { registerSchemesAsPrivileged: noop, handle: noop },
    net: {},
    shell: {},
    dialog: {},
    clipboard: {},
    nativeImage: {},
    screen: {},
  };
};

const bootBundle = (bundlePath) => {
  const stub = makeElectronStub();
  const origLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === 'electron') return stub;
    return origLoad.apply(this, arguments);
  };
  try {
    require(bundlePath); // the user's crash fires HERE when a module is missing
    return { ok: true, error: '' };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  } finally {
    Module._load = origLoad;
  }
};

(async () => {
  fs.rmSync(path.join(root, '.probe-main'), { recursive: true, force: true });
  const modes = onlyProd ? ['production'] : ['development', 'production'];
  const report = [];
  let violations = 0;

  for (const mode of modes) {
    const stats = await compile(forgeLikeMain(mode));
    const json = stats.toJson({ modules: true, assets: false, chunks: false });
    const dbioInGraph = json.modules.some((m) => {
      const id = String(m.identifier || m.name || m.resource || '');
      return /src[\\/]utils[\\/]dbio\.js$/.test(id) || /dbio\.js/.test(id);
    });
    const bundlePath = path.join(root, '.probe-main', mode, 'index.js');
    const text = fs.readFileSync(bundlePath, 'utf8');
    const rawRelativeRequires = [...text.matchAll(/require\(\s*(['"])(\.[^'"]*)\1\s*\)/g)].map(
      (m) => m[2]
    );
    const warnings = json.warnings || [];
    report.push({
      mode,
      dbioInGraph,
      rawRelativeRequires,
      bundleBytes: text.length,
      warningCount: warnings.length,
    });
    if (!dbioInGraph) violations += 1;
    if (rawRelativeRequires.length) violations += 1;
  }

  // THE BOOT — run the PRODUCTION bundle (the one that ships in the asar)
  // under plain Node with 'electron' stubbed. If any require was left raw
  // and unresolvable, this throws the user's exact error.
  const boot = bootBundle(path.join(root, '.probe-main', 'production', 'index.js'));
  report.push({ boot });
  if (!boot.ok) violations += 1;

  console.log(JSON.stringify(report, null, 2));
  if (boot.ok) {
    // the stub's whenReady() never resolves; leave cleanly once the
    // module graph has proven itself loaded
    setTimeout(() => process.exit(expectClean && violations ? 1 : 0), 250);
  } else {
    process.exit(expectClean ? 1 : 0);
  }
})().catch((e) => {
  console.error('PROBE FATAL:', e);
  process.exit(2);
});
