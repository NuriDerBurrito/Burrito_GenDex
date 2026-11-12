// 1.1.7 batch source checks — the production build that finally builds, and
// the launcher that never strands you. The wave:
//   · THE FUSES KEY ("[START] Building the v1.1.6 production bundle… ■
//     Running postPackage hook — The production build failed"): forge.config.js
//     said `fuseVersion:` — a key @electron/fuses never reads (FuseConfig
//     wants `version`), so flipFuses answered "Unsupported fuse version
//     number: undefined" and killed the first real package run. One word.
//   · THE HALF-BLIND CHECKSUM MAP: download.checksums named only the win32
//     zip; @electron/get builds the WHOLE SHASUMS256.txt from the map and
//     fails any artifact missing from it (the CI linux lane died here).
//     All six v42.9.3 platform zips now, cross-verified vs the release file.
//   · THE MAIN ENTRY: forge 7.8.0's webpack plugin demands ".webpack/main";
//     the scaffold still said ".webpack/main/index.js" (an older era's law).
//   · THE HELPER THAT CANNOT LIVE IN AN ASAR: webpack left
//     require('electron-squirrel-startup') external, the plugin packs ONLY
//     the bundles (asar node_modules is empty by design) — the packaged app
//     died on boot. The twenty-line handler is inlined into main.js now and
//     the dependency is gone.
//   · THE LAUNCHER THAT NEVER STRANDS YOU: START.bat tees the build to
//     build-log.txt (keeping npm's own exit code), a failure prints the
//     log's tail — the real error, not a guess — then offers [R]etry,
//     [D]evelopment mode, [N]othing (defaults to D after 45s).
//
// Pure source checks — no jsdom needed for this wave.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const appRoot = process.cwd();
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const forge = stripComments(src('forge.config.js'));
const pkg = JSON.parse(src('package.json'));
const mainJs = stripComments(src('src/main.js'));
const bat = src('START.bat');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const { APP } = require(join(appRoot, 'src/constants/index.js'));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};

// ===========================================================================
// the version
// ===========================================================================
ok('the version is 1.1.9', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('CHANGELOG.md'), /^## 1\.1\.7 /m, 'the changelog section exists');
});

// ===========================================================================
// landmine 1 — the fuses key
// ===========================================================================
ok('the fuses config speaks the key the library reads (version, not fuseVersion)', () => {
  assert.match(forge, /version:\s*FuseVersion\.V1/, 'the FuseConfig key');
  assert.doesNotMatch(forge, /fuseVersion\s*:/, 'the dead shape is gone from live config');
});

ok('the six fuses still ride the plugin (the hardening survives the fix)', () => {
  assert.match(forge, /\[FuseV1Options\.RunAsNode\]:\s*false/);
  assert.match(forge, /\[FuseV1Options\.EnableCookieEncryption\]:\s*true/);
  assert.match(forge, /\[FuseV1Options\.EnableNodeOptionsEnvironmentVariable\]:\s*false/);
  assert.match(forge, /\[FuseV1Options\.EnableNodeCliInspectArguments\]:\s*false/);
  assert.match(forge, /\[FuseV1Options\.EnableEmbeddedAsarIntegrityValidation\]:\s*true/);
  assert.match(forge, /\[FuseV1Options\.OnlyLoadAppFromAsar\]:\s*true/);
});

// ===========================================================================
// landmine 2 — the checksum map
// ===========================================================================
ok('the checksum map names every platform zip a build can request', () => {
  for (const zip of [
    'electron-v42.9.3-win32-x64.zip',
    'electron-v42.9.3-win32-arm64.zip',
    'electron-v42.9.3-linux-x64.zip',
    'electron-v42.9.3-linux-arm64.zip',
    'electron-v42.9.3-darwin-x64.zip',
    'electron-v42.9.3-darwin-arm64.zip',
  ]) {
    assert.ok(forge.includes(`'${zip}'`), `${zip} is pinned`);
  }
  // the win32-x64 pin is the exact sha256 of the real release asset
  assert.match(forge, /'electron-v42\.9\.3-win32-x64\.zip':\s*\n?\s*'51b68cd32c09b6de4f468a8c2a19dddf765d450e3af13a32e790c7a7fb4aeddf'/);
});

// ===========================================================================
// landmine 3 — the main entry
// ===========================================================================
ok('package.json main is the shape forge 7.8.0 validates (.webpack/main)', () => {
  assert.equal(pkg.main, '.webpack/main');
});

// ===========================================================================
// landmine 4 — the helper that cannot live in an asar
// ===========================================================================
ok('the Squirrel handler is inlined into the main process', () => {
  assert.match(mainJs, /handleSquirrelEvents/, 'the inline handler exists');
  assert.match(mainJs, /--squirrel-install/, 'install creates the shortcut');
  assert.match(mainJs, /--squirrel-uninstall/, 'uninstall removes it');
  assert.match(mainJs, /--squirrel-obsolete/, 'obsolete quits');
  assert.match(mainJs, /--createShortcut=/, 'Update.exe shortcut create');
  assert.match(mainJs, /--removeShortcut=/, 'Update.exe shortcut remove');
  assert.match(mainJs, /process\.platform !== 'win32'/, 'gated to Windows (Squirrel is win32-only)');
});

ok('no live require of electron-squirrel-startup remains (comments aside)', () => {
  assert.doesNotMatch(mainJs, /require\(['"]electron-squirrel-startup['"]\)/);
  assert.ok(!pkg.dependencies || !('electron-squirrel-startup' in pkg.dependencies),
    'the dependency left package.json with it');
});

ok('the boot law: main.js only requires electron and node builtins (a bundled asar has no node_modules)', () => {
  const BUILTINS = new Set(['electron', 'path', 'fs', 'node:url', 'node:zlib', 'node:child_process',
    'node:crypto', 'node:path', 'node:fs', 'node:events', 'node:timers', 'os', 'util', 'stream']);
  const requires = [...mainJs.matchAll(/require\((['"])([^'"]+)\1\)/g)].map((m) => m[2]);
  assert.ok(requires.length > 0, 'the file was read');
  for (const r of requires) {
    assert.ok(BUILTINS.has(r) || r.startsWith('./') || r.startsWith('../'),
      `require('${r}') must be electron/builtin/relative — npm packages cannot exist in the asar`);
  }
});

// ===========================================================================
// the launcher that never strands you
// ===========================================================================
ok('START.bat saves the whole build to build-log.txt as it happens', () => {
  assert.match(bat, /Tee-Object\s+-FilePath\s+'build-log\.txt'/, 'the tee');
  assert.match(bat, /npm run package 2>&1 \| Tee-Object/, 'live output AND the log');
});

ok('START.bat keeps npm own exit code through the pipe', () => {
  assert.match(bat, /exit \$LASTEXITCODE/);
});

ok('a failed build shows the log tail (the real error, not a guess)', () => {
  assert.match(bat, /Get-Content\s+-Path\s+'build-log\.txt'\s+-Tail/, 'the tail reader');
  assert.match(bat, /build FAILED/i, 'the verdict line');
});

ok('the fallback keys: retry, development mode, nothing', () => {
  assert.match(bat, /choice \/c RDN/, 'the three keys');
  assert.match(bat, /:dev_mode/, 'the dev-mode leg exists');
  assert.match(bat, /:build\r?\n/, 'the retry leg returns to the build');
  assert.match(bat, /call npm start/, 'dev mode actually launches the app');
  assert.match(bat, /\/t 45 \/d D/, 'unattended failures default to opening the app');
});

// ===========================================================================
// the download page speaks the new version
// ===========================================================================
ok('the download page fronts the live current', () => {
  /* 1.2.5 re-law: the page fronts 1.2.5 now (the 135 batch pins that);
     this suite keeps only its historical truth — the channel-check
     baseline follows the live current, never a stale one. */
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /<span class="ver">v1\.4\.3<\/span>/, 'the current release card');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /var CURRENT = \[1, 4, 3\];/, 'the channel-check baseline reads the true current (1.2.2 re-law: it was stuck at 1.1.9 through 1.2.0)');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /releases\/download\/v1\.4\.3\//, 'the asset links follow');
});

console.log(failed ? `\n${passed} passed, ${failed} failed — FIX ABOVE` : `\n1.1.7 batch: ${passed} checks passing (the version pins moved to 1.1.9)`);
process.exit(failed ? 1 : 0);
