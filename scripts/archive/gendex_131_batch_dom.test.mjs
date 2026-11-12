// 1.2.1 batch source + function checks — the two-item list, one law per item:
//   1  the top toolbar starts at 'none' in every theme (Carbon's blueprint and
//      Crimson's hatch left the bar; the cloth survives on the viewer/panel;
//      a stored theme-landed pattern wakes clean through createSafeDb, while
//      a hand-picked pattern on any seat keeps its place)
//   2  the auto-save cycle never triggers while the settings window is open
//      (the tick is skipped, not deferred — the cadence keeps its own time)
// Plus: the version is 1.2.1 everywhere and the download page fronts it true
// (the 1.1.9 row restored, the current-row link fixed, the gate reads 1.2.1).
// Run: node scripts/gendex_131_batch_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP, THEME_PRESETS, DEFAULT_SETTINGS, TEX_SURFACES } = require(join(appRoot, 'src/constants/index.js'));
const { createSafeDb } = require(join(appRoot, 'src/utils/helpers.js'));
const pkg = require(join(appRoot, 'package.json'));

const appSrc = src('src/App.jsx');
const helpersSrc = src('src/utils/helpers.js');
const constSrc = src('src/constants/index.js');
const settingsSrc = src('src/components/SettingsModal.jsx');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

// ---- the version -------------------------------------------------------------
ok('the version is 1.2.9', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('CHANGELOG.md'), /^## 1\.2\.3 /m);
  assert.match(src('START.bat'), /launcher \(1\.4\.3\)/);
});

// ---- 1a: the clean bar — every theme, no exceptions ---------------------------
ok('1a — every theme starts its TOP TOOLBAR at none (all twelve seats)', () => {
  assert.ok(THEME_PRESETS.length >= 12, 'the theme table is intact');
  const offenders = THEME_PRESETS.filter((t) => t.texDefaults?.titlebar !== 'none');
  assert.deepEqual(offenders.map((t) => t.id), [], 'no theme lands its cloth on the bar anymore');
});

ok('1b — Carbon and Crimson keep their cloth where it reads best (viewer + panel)', () => {
  const carbon = THEME_PRESETS.find((t) => t.id === 'carbon');
  const metal = THEME_PRESETS.find((t) => t.id === 'metal');
  assert.equal(carbon.texDefaults.titlebar, 'none', 'carbon bar clean');
  assert.equal(carbon.texDefaults.viewer, 'grid', 'carbon keeps the blueprint viewer');
  assert.equal(carbon.texDefaults.panel, 'hatch', 'carbon keeps the hatched panel');
  assert.equal(metal.texDefaults.titlebar, 'none', 'crimson bar clean');
  assert.equal(metal.texDefaults.viewer, 'grid', 'crimson keeps the gridded viewer');
  assert.equal(metal.texDefaults.panel, 'hatch', 'crimson keeps the hatched panel');
});

ok('1c — the fresh-database seat and the surface table are untouched', () => {
  assert.equal(DEFAULT_SETTINGS.textures.titlebar, 'none', 'a fresh db starts clean');
  assert.ok(TEX_SURFACES.some((s) => s.id === 'titlebar'), 'the Top Toolbar surface still exists for hand-picking');
  // a hand-picked pattern still CAN be chosen — the surface picker is intact
  assert.match(settingsSrc, /const setSurfacePattern = \(pattern\) => \{[\s\S]{0,120}onChange\('textures', \{ \.\.\.textures, \[texSurface\]: pattern \}\);/, 'the Look tab still writes any pattern to any surface');
});

// ---- 1d: the pair check on the load path (live createSafeDb) ------------------
ok('1d — a stored theme-landed pattern wakes clean (the pair is the tell)', () => {
  const mk = (theme, titlebar) => ({
    settings: { theme, textures: { titlebar, sidebar: 'none', viewer: 'grid', panel: 'none' } },
  });
  assert.equal(createSafeDb(mk('carbon', 'grid')).settings.textures.titlebar, 'none', 'carbon + its old blueprint landing wakes clean');
  assert.equal(createSafeDb(mk('metal', 'hatch')).settings.textures.titlebar, 'none', 'crimson + its old hatch landing wakes clean');
});

ok('1e — a hand-picked pattern keeps its seat (only the theme\'s OWN landing resets)', () => {
  const mk = (theme, titlebar) => ({
    settings: { theme, textures: { titlebar, sidebar: 'none', viewer: 'grid', panel: 'none' } },
  });
  assert.equal(createSafeDb(mk('glacier', 'grid')).settings.textures.titlebar, 'grid', 'grid on glacier was hand-picked (glacier never landed it) — it stays');
  assert.equal(createSafeDb(mk('carbon', 'dots')).settings.textures.titlebar, 'dots', 'dots on carbon is not the theme\'s landing — it stays');
  assert.equal(createSafeDb(mk('metal', 'grid')).settings.textures.titlebar, 'grid', 'grid on crimson is not the theme\'s landing — it stays');
  assert.equal(createSafeDb(null).settings.textures.titlebar, 'none', 'a fresh db starts clean');
});

ok('1f — the migration lives in the sanitizer (no unsaved flag, no undo step)', () => {
  assert.match(helpersSrc, /safeTheme === 'carbon' && safeTextures\.titlebar === 'grid'/, 'the carbon pair');
  assert.match(helpersSrc, /safeTheme === 'metal' && safeTextures\.titlebar === 'hatch'/, 'the crimson pair');
  assert.match(helpersSrc, /safeTextures\.titlebar = 'none';/, 'the clean wake');
  // the sanitized pair feeds the settings exactly once (no double compute)
  assert.match(helpersSrc, /theme: safeTheme,/, 'the hoisted theme feeds the settings');
  assert.match(helpersSrc, /textures: safeTextures,/, 'the hoisted textures feed the settings');
});

ok('1g — picking a theme still lands its set (the one-patch law unchanged)', () => {
  assert.match(settingsSrc, /if \(theme\.texDefaults\) patch\.textures = \{ \.\.\.textures, \.\.\.theme\.texDefaults \};/, 'the spread lands every surface the theme ships');
});

// ---- 2: the quiet cycle --------------------------------------------------------
ok('2a — the cycle knows whether the settings window is up (the render-time ref)', () => {
  assert.match(appSrc, /const settingsOpenRef = useRef\(false\);/, 'the ref exists');
  assert.match(appSrc, /settingsOpenRef\.current = modal\?\.type === 'settings';/, 'assigned every render — the expandedCardsRef pattern, never a stale closure');
});

ok('2b — a tick inside an open settings window is skipped, not deferred', () => {
  const intervalBlock = /const id = setInterval\(\(\) => \{([\s\S]{0,700}?)\}, minutes \* 60 \* 1000\);/.exec(appSrc);
  assert.ok(intervalBlock, 'the autosave interval exists');
  const body = intervalBlock[1];
  const skipAt = body.indexOf('if (settingsOpenRef.current) return;');
  const saveAt = body.indexOf('if (unsavedRef.current) saveDbRef.current?.(true);');
  assert.ok(skipAt !== -1, 'the settings skip exists inside the tick');
  assert.ok(saveAt !== -1, 'the unsaved write still exists inside the tick');
  assert.ok(skipAt < saveAt, 'the skip guards the write — nothing fires while the window is up');
});

ok('2c — the cadence keeps its own time (no re-arm on window open/close)', () => {
  const effectBlock = /useEffect\(\(\) => \{[\s\S]{0,900}?const minutes = Number\(db\?\.settings\?\.autosaveMinutes\) \|\| 0;[\s\S]{0,900}?\}, \[db\?\.settings\?\.autosaveMinutes\]\);/.exec(appSrc);
  assert.ok(effectBlock, 'the autosave effect is bound');
  assert.ok(!/settingsOpenRef/.test(effectBlock[0].slice(0, 200)), 'the ref never enters the effect — the interval is bound once per cadence');
  // the manual-save and clean-db laws are untouched
  assert.match(effectBlock[0], /if \(unsavedRef\.current\) saveDbRef\.current\?\.\(true\);/, 'it still only writes when there is something to write');
  assert.match(effectBlock[0], /saveDbRef\.current\?\.\(true\)/, 'it still hands saveDb its AUTO flag');
});

// ---- the download page fronts 1.2.1 (and the table is whole again) ------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page fronts 1.2.3');

ok('the all-versions table is whole again (1.1.9 restored, the current row links true)', () => {
  /* 1.2.2 re-law: the current row is 1.2.2 and the demoted 1.2.1 keeps its
     own true link (the page-update law: add the new row, demote the old). */
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<td class="v">1\.2\.2<\/td>/, 'the 1.2.2 row');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<td class="v">1\.2\.1<\/td>/, 'the demoted 1.2.1 row');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<td class="v">1\.2\.0<\/td>/, 'the 1.2.0 row');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<td class="v">1\.1\.9<\/td>/, 'the 1.1.9 row is back (the 1.2.0 update had replaced it)');
  // the current row's release link points at its own tag (it pointed at v1.1.9 before)
  // 1.8.8 — RETIRED WITH THE WEBSITE: const currentRow = /<tr class="current-row">[\s\S]{0,2400}?<\/tr>/.exec(website); // 1.3.9: the row's highlights grew — the window widens
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(currentRow, 'the current row exists');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(currentRow[0], /1\.4\.3/, 'it fronts the live current');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(currentRow[0], /releases\/tag\/v1\.4\.3/, 'its link points at its own release');
  // 1.8.8 — RETIRED WITH THE WEBSITE: const rows = website.match(/<tr>\s*<td class="v">[\s\S]*?<\/tr>/g) || [];
  // 1.8.8 — RETIRED WITH THE WEBSITE: const r121 = rows.find((r) => />1\.2\.1</.test(r));
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(r121, 'the demoted 1.2.1 row exists');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(r121, /releases\/tag\/v1\.2\.1/, 'and its link points at its own release');
  // 1.8.8 — RETIRED WITH THE WEBSITE: const r123 = rows.find((r) => />1\.2\.3</.test(r));
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(r123, 'the demoted 1.2.3 row exists (1.2.4 re-law)');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(r123, /releases\/tag\/v1\.2\.3/, 'and its link points at its own release');
  // the demoted 1.2.0 row links at v1.2.0 now
  // 1.8.8 — RETIRED WITH THE WEBSITE: const r120 = rows.find((r) => />1\.2\.0</.test(r));
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(r120, 'the demoted 1.2.0 row exists');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(r120, /releases\/tag\/v1\.2\.0/, 'and its link is fixed');
});

// ---- summary -------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed — 1.2.1 batch`);
if (failed) process.exit(1);
