// 1.8.9 — debug probe: boot the compiled main bundle (forge-mirror build)
// and inspect what the priming door actually did: engine state, sqlite file,
// migration verdict, and db:load's answer. Mirrors 162's bootMain harness.
import { readFileSync, mkdtempSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import os from 'node:os';
import webpack from 'webpack';

const require_ = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const workDir = mkdtempSync(path.join(os.tmpdir(), 'gd-house-dbg-'));

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

const bootMain = async (bundlePath, { seed } = {}) => {
  const userData = mkdtempSync(path.join(os.tmpdir(), 'gd-boot-dbg-'));
  if (seed != null) writeFileSync(path.join(userData, 'gendex_db.json'), seed);
  const handlers = {};
  const windows = [];
  const noop = () => {};
  const app = {
    setName: noop,
    getPath: (which) => (which === 'userData' ? userData : path.join(userData, which)),
    getVersion: () => '1.8.9',
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
  const origLoad = Module._load;
  Module._load = function patched(request) {
    if (request === 'electron') return electron;
    return origLoad.apply(this, arguments);
  };
  try {
    const resolved = require_.resolve(bundlePath);
    delete require_.cache[resolved];
    require_(resolved);
    await new Promise((r) => setTimeout(r, 150)); // let the async prime truly finish
    return { handlers, windows, userData };
  } finally {
    Module._load = origLoad;
  }
};

await compile(forgeLikeMain('production'));
console.log('--- production bundle compiled');

const seeded = JSON.stringify({
  characters: [{ id: 'c1', name: 'Probe Burrito' }],
  classes: [],
  tags: [],
  settings: { theme: 'nuri' },
  appVersion: '1.5.5',
  savedAt: 1700000000000,
  schemaVersion: 2,
});
const { handlers, windows, userData } = await bootMain(path.join(workDir, 'production', 'index.js'), { seed: seeded });
console.log('windows:', windows.length, '| handlers:', Object.keys(handlers).slice(0, 6).join(','));
console.log('userData files:', readdirSync(userData).join(', '));
const r = await handlers['db:load']();
console.log('db:load -> status:', r.status, '| fromAppVersion:', r.fromAppVersion, '| characters:', r.db?.characters?.length, '| db.appVersion:', r.db?.appVersion);
// second boot on the same seat: must NOT re-import (status ok now)
const r2 = await handlers['db:save']({}, { characters: [{ id: 'c1', name: 'Probe Burrito' }, { id: 'c2', name: 'Second' }], settings: { theme: 'nuri' } });
console.log('db:save ->', JSON.stringify(r2));
console.log('userData files after save:', readdirSync(userData).join(', '));
if (existsSync(path.join(userData, 'gendex_db.sqlite'))) {
  const head = readFileSync(path.join(userData, 'gendex_db.sqlite')).slice(0, 16).toString('latin1').replace(/\x00/g, '');
  console.log('sqlite magic:', JSON.stringify(head));
}
// THE NO-REIMPORT PROOF: tamper with the json (an intruder drops in) and
// boot a SECOND main instance on a COPY of the SAME seat — the flag inside
// the sqlite file must keep the door shut.
writeFileSync(path.join(userData, 'gendex_db.json'), JSON.stringify({ characters: [{ id: 'c9', name: 'Intruder' }] }));
const { handlers: h2, userData: ud2 } = await bootMain(path.join(workDir, 'production', 'index.js'), { seed: null });
const r3 = await h2['db:load']();
console.log('fresh-dir boot -> status:', r3.status, '(expected missing)');
console.log('DEBUG DONE');
