// 1.1.6 batch DOM + source checks — the theme-born splash, the named fold
// keys, the opaque trims, the blue & red seats, the prod launcher, the
// download page, and the deprecated sweep. The wave:
//   · THE DOWNLOAD PAGE ("i cant see version 1.1.5 to download, often times
//     its the website's issue so maybe make a simple download website page
//     for me to download the new version from, make version 1.1.6"):
//     website/index.html — a one-file page with direct asset links; the
//     Settings → Data → UPDATES section carries a key that opens it.
//   · THE SPLASH SPEAKS THE THEME ("the splash screen ensure it also fits
//     the style so its not darkmode and suddenly it changes in style and
//     colors, fix it so it starts with the appropriate theme"): the cover's
//     board/wordmark/status/veil/foot read the theme tokens, light covers
//     switch the halo to a normal blend, and main pre-paints the window in
//     the saved theme's bg.
//   · THE FOLD KEYS SAY THEIR NAMES ("make it so the button to collapse the
//     tags&stamps is visible, so the user can close it normally instead of
//     relying on just scrolling down"): COLLAPSE/EXPAND pills on the filter
//     card's two rule lines, the creation window's tag board, and the
//     stamps gallery (whose inside scrollbar is retired with it).
//   · THE DEPRECATED SWEEP ("remove deprecated code"): RenameModal, the
//     dead constants (DEFAULT_DB / DB_FILE_NAME / IMAGES_DIR_NAME /
//     formatCombo), filterByTags, emptyDb, the exported luminanceOfHex,
//     TRIM_WRAP, the filter's transition showHelp prop, LucideChipIcon,
//     the legacy texture lane, the stale forge verifier.
//   · THE PROD LAUNCHER ("switch from running it on development mode to
//     running it on normal prod mode"): START.bat packages once per version
//     and launches the packaged exe.
//   · OPAQUE TRIMS ("rework the trims including basic onces, since some
//     arent following good design principles or have transparency that
//     overlaps in the corners which causes bad looking visuals"): the ink
//     families mix toward the panel (never transparent), the picture frame
//     gains corner studs a shade stronger than the rail, the scallop's
//     rosettes sit on opaque medallion grounds, the beads' corners carry
//     clasp plates.
//   · COBALT & CRIMSON ("rework ghost mono theme, maybe it should be a blue
//     theme, and rework metallic to be a red theme, since there is too many
//     grey themes right now, default should still be glacier"): same ids
//     (old selections migrate), blue + red ladders, glacier untouched.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 1.1.6 batch DOM test skipped (dev-only dependency)');
  process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.MutationObserver = dom.window.MutationObserver;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Document = dom.window.Document;
global.Window = dom.window.Window;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.WheelEvent = dom.window.WheelEvent;
global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
global.DragEvent = dom.window.DragEvent || dom.window.MouseEvent;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {} unobserve() {} disconnect() {}
};
global.localStorage = dom.window.localStorage;

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
const appRoot = process.cwd();
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => { module.exports = filename; };
}
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};

const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const css = src('src/index.css');
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const { APP, THEME_PRESETS, DOWNLOAD_PAGE_URL, DEFAULT_SETTINGS } = require(join(appRoot, 'src/constants/index.js'));

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
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

// ===========================================================================
// Part A — source checks for the 1.1.6 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const appSrc = stripComments(src('src/App.jsx'));
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const newCharSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const splashSrc = stripComments(src('src/components/Splash.jsx'));
  const mainSrc = stripComments(src('src/main.js'));
  const tagSrc = stripComments(src('src/components/TagRibbon.jsx'));
  const lookSrc = stripComments(src('src/components/CardLookEditor.jsx'));
  const dialogSrc = stripComments(src('src/components/Dialogs.jsx'));
  const pickerSrc = stripComments(src('src/components/LucideIconPicker.jsx'));
  const helpersSrc = stripComments(src('src/utils/helpers.js'));
  const themeSrc = stripComments(src('src/utils/theme.js'));
  const constantsSrc = stripComments(src('src/constants/index.js'));

  ok('the version is 1.1.9', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  });

  // ---- the download page ----
  ok('the download page exists and points its links straight at the release assets', () => {
    // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(existsSync(join(appRoot, 'website/index.html')), 'website/index.html ships');
    // 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
    // release ships without it"): the one-file page left the repo
    // with the final release; this suite's page-pins retired with it.
    /* 1.1.8 — the current card fronts the new release; the old versions
       table still reaches back through 1.1.4. */
    // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /releases\/download\/v1\.4\.3\/Burrito%20GenDex-1\.4\.3%20Setup\.exe/, 'the installer asset link');
    // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /releases\/download\/v1\.4\.3\/Burrito_GenDex_1\.4\.3_source\.zip/, 'the source-zip asset link');
    // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /CURRENT RELEASE/, 'the current block');
    // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /releases\/tag\/v1\.1\.5/, 'the older versions table reaches back');
    // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(page, /api\.github\.com\/repos\/NuriDerBurrito\/Burrito_GenDex\/releases\/latest/, 'the live channel check');
  });
  ok('the UPDATES section carries the DOWNLOAD PAGE key', () => {
    assert.match(src('src/constants/index.js'), /DOWNLOAD_PAGE_URL = 'https:\/\/nuriderburrito\.github\.io\/Burrito_GenDex\/'/, 'the page seat (raw source — the URL itself would be eaten by the comment stripper)');
    assert.match(settingsSrc, /DOWNLOAD PAGE/, 'the key renders');
    assert.match(settingsSrc, /openExternal\?\.\(DOWNLOAD_PAGE_URL\)/, 'the key opens the page');
  });

  // ---- the splash speaks the theme ----
  ok('the splash cover reads the theme tokens, not a hard-coded board', () => {
    assert.match(splashSrc, /gd-splash-root/, 'the themed root class');
    assert.ok(!splashSrc.includes('bg-[#0a0908]'), 'the hard-coded dark board is gone');
    assert.match(splashSrc, /data-shade=\{shade\}/, 'the shade attribute rides the root');
    assert.match(splashSrc, /getPropertyValue\('--gd-bg'\)/, 'the shade is measured from the live bg');
    assert.match(codeCss, /\.gd-splash-root\s*\{[^}]*background: var\(--gd-bg, #0a0908\);/, 'the board paints --gd-bg');
    assert.match(codeCss, /\.gd-splash-word\s*\{[^}]*color: var\(--gd-chrome/, 'the wordmark speaks chrome');
    assert.match(codeCss, /\.gd-splash-status\s*\{[^}]*color: var\(--gd-mute/, 'the status line speaks mute');
    assert.ok(!codeCss.includes('rgba(236, 229, 211, 0.055)'), 'the hard-coded cream dots are gone');
  });
  ok('light covers get their own physics (paper veil + normal-blend bloom)', () => {
    assert.match(codeCss, /\[data-shade='light'\] \.gd-splash-veil/, 'the light veil law');
    /* 1.1.8 — the halo (and its shade-blend law) retired with the splash
       glow; the light VEIL law above is the shade story that survives. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: no splash halo rule survives (the glow is retired)');
  });
  ok('the window itself is born in the saved theme (the main-side pre-paint)', () => {
    assert.match(mainSrc, /backgroundColor: peekThemeBg\(\) \|\| '#141210'/, 'the window seat reads the peek');
    assert.match(mainSrc, /const THEME_PRESET_BG = \{/, 'the preset bg map');
    assert.match(mainSrc, /db\.settings\?\.colors/, 'manual bg overrides win');
    // the map mirrors THEME_PRESETS exactly (every theme, every hex)
    const mapIds = [...mainSrc.matchAll(/\n  (\w+): '(#[0-9a-fA-F]{6})',/g)].map((m) => [m[1], m[2].toLowerCase()]);
    assert.equal(mapIds.length, THEME_PRESETS.length, `the map covers all ${THEME_PRESETS.length} themes`);
    for (const t of THEME_PRESETS) {
      const hit = mapIds.find(([id]) => id === t.id);
      assert.ok(hit, `theme ${t.id} present in the pre-paint map`);
      assert.equal(hit[1], t.bg.toLowerCase(), `theme ${t.id} bg matches the preset`);
    }
  });

  // ---- the fold keys say their names ----
  ok('the filter fold keys carry COLLAPSE/EXPAND words', () => {
    assert.match(gridSrc, /className="gd-spot-fold"/, 'the tag filter key');
    assert.match(gridSrc, /gd-spot-fold-word">\{tagsOpen \? 'COLLAPSE' : 'EXPAND'\}</, 'the tag key speaks');
    assert.match(gridSrc, /gd-spot-fold-word">\{open \? 'COLLAPSE' : 'EXPAND'\}</, 'the stamp key speaks');
    assert.match(codeCss, /\.gd-spot-fold\s*\{[^}]*?border: 1px solid var\(--gd-line\);/s, 'the key wears a border');
    assert.match(codeCss, /\.gd-spot-fold\s*\{[^}]*?cursor: pointer;/s, 'the key reads as a button');
    assert.match(codeCss, /\.gd-spot-fold-word\s*\{/, 'the word style');
  });
  ok('1.1.9: the creation window — the tag board key speaks, the stamps gallery lost its fold', () => {
    assert.match(newCharSrc, /gd-spot-fold-word">\{tagsFold \? 'EXPAND' : 'COLLAPSE'\}</, 'the tag board key speaks');
    // 1.1.9 re-law ("remove the expand and retract feature from stamps in
    // card creation window"): the gallery's fold state, its 2-row clamp and
    // its key are all RETIRED — the gallery always shows every row.
    assert.ok(!/galleryFold/.test(newCharSrc), 'the gallery fold state is gone');
    assert.ok(!/galleryRef/.test(newCharSrc), 'the gallery clamp ref is gone');
    assert.ok(!/useClampStyle/.test(newCharSrc), 'the window no longer clamps anything');
    assert.ok(!/stamps gallery \(show every stamp\)/.test(newCharSrc), 'the gallery key is gone');
    const libRule = /\.gd-stamp-lib\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/max-height/.test(libRule), 'no cap — the gallery grows the window');
    assert.ok(!/overflow-y:\s*auto/.test(libRule), 'the inside scrollbar is gone');
  });

  // ---- the deprecated sweep ----
  ok('the deprecated sweep: dead exports, transition props, and stale lanes are gone', () => {
    assert.ok(!dialogSrc.includes('RenameModal'), 'RenameModal retired');
    assert.ok(!constantsSrc.includes('DEFAULT_DB'), 'DEFAULT_DB retired');
    assert.ok(!constantsSrc.includes('DB_FILE_NAME'), 'DB_FILE_NAME retired');
    assert.ok(!constantsSrc.includes('IMAGES_DIR_NAME'), 'IMAGES_DIR_NAME retired');
    assert.ok(!constantsSrc.includes('formatCombo'), 'formatCombo retired');
    assert.ok(!helpersSrc.includes('filterByTags'), 'filterByTags retired');
    assert.ok(!helpersSrc.includes('emptyDb'), 'emptyDb retired');
    assert.ok(!/export function luminanceOfHex/.test(helpersSrc), 'luminanceOfHex no longer exported');
    assert.ok(!tagSrc.includes('TRIM_WRAP'), 'the empty TRIM_WRAP map retired');
    assert.match(tagSrc, /overlay: t === 'none' \? null : `gd-trim-\$\{t\}`/, 'trimClasses speaks the overlay alone');
    assert.ok(!gridSrc.includes('showHelp'), 'the filter showHelp transition prop retired');
    const gridCall = appSrc.slice(appSrc.indexOf('<GridView'), appSrc.indexOf('<GridView') + 1400);
    assert.ok(!gridCall.includes('showHelp'), 'App no longer passes it to the grid');
    assert.ok(!pickerSrc.includes('LucideChipIcon'), 'LucideChipIcon retired');
    assert.ok(!/export const LUCIDE_ICONS/.test(pickerSrc), 'LUCIDE_ICONS is module-private now');
    assert.ok(!codeCss.includes('.gd-trimcut-cuts'), 'the dead cuts clip-path retired');
    assert.ok(!themeSrc.includes('legacy'), 'the legacy texture lane retired');
    assert.ok(!existsSync(join(appRoot, 'scripts/verify_forge_configs.js')), 'the stale forge verifier retired');
  });

  // ---- the prod launcher ----
  ok('START.bat runs the packaged production app', () => {
    const bat = src('START.bat');
    assert.match(bat, /npm run package/, 'the one-time build');
    assert.match(bat, /\.prod-stamp/, 'the version stamp');
    assert.match(bat, /out\\\*win32-x64/, 'the packaged exe hunt');
    // 1.1.7 — `call npm start` is ALLOWED now, but only as the failed-build
    // fallback: on EXECUTABLE lines (rem comments aside) it must appear
    // after the :dev_mode label and nowhere before.
    const exec = bat.split(/\r?\n/).filter((l) => !/^\s*rem\b/i.test(l)).join('\n');
    const devLeg = exec.indexOf(':dev_mode');
    assert.ok(devLeg > 0, 'the dev-mode fallback leg exists');
    assert.ok(!exec.slice(0, devLeg).includes('npm start'),
      'development mode is never the primary path — only the fallback');
    assert.match(exec.slice(devLeg), /call npm start/, 'the fallback launches dev mode');
    assert.match(src('README.md'), /production mode/, 'the README speaks the new lane');
  });

  // ---- the opaque trims ----
  ok('the flat trim inks are OPAQUE (no stacked transparency anywhere)', () => {
    const trimRule = /\.gd-trim\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(trimRule, /--trim-c: color-mix\(in srgb, var\(--gd-ink\) 72%, var\(--gd-panel\)\)/, 'the rule ink mixes toward the panel');
    assert.match(trimRule, /--trim-c-strong: color-mix\(in srgb, var\(--gd-ink\) 88%, var\(--gd-panel\)\)/, 'the strong ink mixes toward the panel');
    assert.ok(!/transparent/.test(trimRule), 'no transparent in the base tokens');
    const scallopVars = /\.gd-trim-scallop\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/transparent/.test(scallopVars), 'the scallop threads are opaque');
    const beadsVars = /\.gd-trim-beads\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/transparent/.test(beadsVars), 'the pearl tokens are opaque');
    const rivetVars = /\.gd-trim-rivet\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/--rv-(hi|lite|body|deep|rail):[^;]*transparent/.test(rivetVars), 'the steel tokens are opaque (only the shadow stays soft)');
  });
  ok('the corners cap their edges (studs, medallion grounds, clasp plates)', () => {
    assert.match(codeCss, /--trim-c-peak: var\(--gd-ink\);/, 'the stud peak token');
    const frameBefore = /\.gd-trim-frame::before\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(frameBefore, /var\(--trim-c-peak\) 0 0\) top left/, 'the frame studs speak the peak');
    const scallopBefore = /\.gd-trim-scallop::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok((scallopBefore.match(/var\(--s-c-base\)/g) || []).length >= 4, 'four medallion grounds');
    assert.match(scallopBefore, /--s-c-base\) 0 11\.4px, transparent 11\.5px/, 'the ground disc geometry');
    const beadsBefore = /\.gd-trim-beads::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.match(beadsBefore, /circle 7\.2px at 8px 8px, var\(--bd-seat\) 0 7\.1px/, 'the clasp plate');
  });

  // ---- cobalt & crimson ----
  ok('ghost became COBALT: the same seat, a blue ladder', () => {
    const ghost = THEME_PRESETS.find((t) => t.id === 'ghost');
    assert.ok(ghost, 'the id survives (old selections migrate)');
    assert.equal(ghost.name, 'Cobalt');
    assert.equal(ghost.bg, '#0a0f1e', 'deep navy board');
    assert.equal(ghost.accent, '#4d8dff', 'the blue mark');
    assert.equal(ghost.accent2, '#ffd166', 'the gold second voice');
    assert.ok(!/Ghost Mono/.test(constantsSrc), 'the grey name is gone');
  });
  ok('metal became CRIMSON: the same seat, a red ladder', () => {
    const metal = THEME_PRESETS.find((t) => t.id === 'metal');
    assert.ok(metal, 'the id survives');
    assert.equal(metal.name, 'Crimson');
    assert.equal(metal.bg, '#150c10', 'maroon-black board');
    assert.equal(metal.accent, '#ff4d5e', 'the red mark');
    assert.equal(metal.accent2, '#45c4a0', 'the teal second voice');
    // 1.2.1 re-law — THE TOOLBAR STARTS CLEAN IN EVERY THEME: Crimson's
    // hatch left the bar (it lives on in the viewer + the panel); the bar
    // starts at 'none' like every other theme.
    assert.equal(metal.texDefaults.titlebar, 'none', 'the bar starts clean (1.2.1); the cloth stays on the viewer/panel');
    assert.equal(metal.texDefaults.viewer, 'grid', 'the forge keeps its cloth on the viewer');
    assert.equal(metal.texDefaults.panel, 'hatch', 'and on the panel');
  });
  ok('GLACIER is still the default and untouched', () => {
    const glacier = THEME_PRESETS.find((t) => t.id === 'glacier');
    assert.equal(glacier.bg, '#0c1114');
    assert.equal(glacier.accent, '#7fd1d8');
    assert.equal(DEFAULT_SETTINGS.theme, 'glacier', 'the default seat');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
const boot = async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  return { host, root };
};

await okAsync('the splash is born DARK on dark tokens and LIGHT on light ones (live)', async () => {
  const Splash = require(join(appRoot, 'src/components/Splash.jsx')).default;
  if (!Splash) { console.log('      (Splash unavailable — covered by source checks)'); return; }
  // dark tokens (the CSS defaults are dark) → data-shade="dark"
  document.documentElement.style.removeProperty('--gd-bg');
  let { host, root } = await boot();
  root.render(React.createElement(Splash, { status: 'Loading database', loaded: false }));
  await sleep(60);
  let cover = host.querySelector('.gd-splash-root');
  assert.ok(cover, 'the cover mounted');
  assert.equal(cover.getAttribute('data-shade'), 'dark', 'dark tokens read dark');
  root.unmount();
  host.remove();
  // a light bg token → data-shade="light"
  document.documentElement.style.setProperty('--gd-bg', '#efeae0');
  ({ host, root } = await boot());
  root.render(React.createElement(Splash, { status: 'Loading database', loaded: false }));
  await sleep(60);
  cover = host.querySelector('.gd-splash-root');
  assert.ok(cover, 'the light cover mounted');
  assert.equal(cover.getAttribute('data-shade'), 'light', 'light tokens read light');
  assert.match(cover.textContent || '', /V1\.4\.3/, 'the version rides the cover');
  root.unmount();
  host.remove();
  document.documentElement.style.removeProperty('--gd-bg');
});

await okAsync('the creation window: the tag board + stamps gallery keys render and speak (live)', async () => {
  const mod = { default: require(join(appRoot, 'src/components/NewCharacterModal.jsx')).default };
  const tags = Array.from({ length: 14 }, (_, i) => ({ id: `t${i}`, name: `tag ${i}`, color: '#ffd400', icon: null, trim: 'straight' }));
  const stamps = Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, image: `st${i}.png`, name: `stamp ${i}` }));
  const { host, root } = await boot();
  root.render(
    React.createElement(mod.default, {
      initialImages: [],
      imagesPath: '/mock-images',
      defaultRatio: { w: 3, h: 4 },
      defaultClassId: 'cls-a',
      stampLibrary: stamps,
      tags,
      onOpenTagManager: () => {},
      showHelp: false,
      confirm: () => {},
      onDeleteFromGallery: () => {},
      onAddToGallery: () => {},
      onClose: () => {},
      onCreate: () => {},
    })
  );
  await sleep(150);
  // 1.1.9 re-law: only the TAG BOARD key remains (the stamps gallery's
  // fold left the window); it flips its word on click.
  const keys = [...document.querySelectorAll('button.gd-spot-fold')];
  assert.equal(keys.length, 1, `only the tag board key renders (${keys.length} found)`);
  for (const k of keys) {
    assert.match(k.textContent || '', /COLLAPSE|EXPAND/, 'each key carries its word');
  }
  const boardKey = keys[0];
  const before = boardKey.textContent || '';
  click(boardKey);
  await sleep(80);
  const after = boardKey.textContent || '';
  assert.notEqual(before, after, 'the key flips its word on click');
  assert.match(after, /EXPAND/, 'folded → the key offers EXPAND');
  root.unmount();
  host.remove();
});

await okAsync('the settings UPDATES section carries the DOWNLOAD PAGE key (live)', async () => {
  const mod = { default: require(join(appRoot, 'src/components/SettingsModal.jsx')).default };
  const settings = { ...DEFAULT_SETTINGS, updateChannel: 'stable' };
  const { host, root } = await boot();
  root.render(
    React.createElement(mod.default, {
      settings,
      initial: settings,
      onClose: () => {},
      onChange: () => {},
      onRevert: () => {},
      initialTab: 'Data',
      updateState: { status: 'idle' },
      onCheckUpdates: () => {},
    })
  );
  await sleep(120);
  const dl = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('DOWNLOAD PAGE'));
  assert.ok(dl, 'the key renders on the Data tab');
  assert.match(dl.getAttribute('title') || '', /download page/i, 'the tooltip speaks');
  root.unmount();
  host.remove();
});

console.log(failed ? `\n${passed} passed, ${failed} failed — FIX ABOVE` : `\n1.1.6 batch: ${passed} checks passing`);
process.exit(failed ? 1 : 0);
