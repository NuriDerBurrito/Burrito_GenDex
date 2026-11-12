// 1.1.3 batch DOM + source checks — the reset, the channel, and the
// pipeline. The three implemented features:
//   · THE FACTORY RESET ("implement a factory reset button in the data
//     settings, pressing on it would reset everything (add DOUBLE
//     confirmation of course)"): Data → FACTORY RESET — two confirm
//     windows, the dead-man switch, the theme-clearing reload.
//   · THE UPDATE CHANNEL ("add auto update channel … https://github.com/
//     NuriDerBurrito/Burrito_GenDex"): Data → UPDATES — the STABLE/OFF
//     seats, the quiet boot ask, the CHECK key, VIEW RELEASE, the verdict
//     line; the ask lives in main (net.fetch, 10s timeout, 404 = none).
//   · THE CI PIPELINE ("add that CI since it seems important"):
//     .github/workflows/ci.yml — tests on every push, build on main,
//     installers + GitHub Releases on v* tags (the channel's own feed).
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 1.1.3 batch DOM test skipped (dev-only dependency)');
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

// ===========================================================================
// Part A — source checks for the 1.1.3 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const appSrc = stripComments(src('src/App.jsx'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const mainSrc = stripComments(src('src/main.js'));
  const preloadSrc = stripComments(src('src/preload.js'));
  const constSrc = stripComments(src('src/constants/index.js'));
  const helpersSrc = stripComments(src('src/utils/helpers.js'));
  const packageJson = src('package.json');

  // ---- the version ----
  ok('the version is 1.1.3', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(packageJson, /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
    assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  });

  // ---- the update channel: main's ask ----
  ok('the channel asks GitHub in main (repo, agent, timeout, honest 404)', () => {
    const rawMain = src('src/main.js'); // raw: the // stripper would eat https:// inside strings
    assert.match(rawMain, /const UPDATE_REPO = 'NuriDerBurrito\/Burrito_GenDex'/, 'the repo id');
    assert.ok(/api\.github\.com\/repos\/\$\{UPDATE_REPO\}\/releases\/latest/.test(rawMain), 'the releases/latest feed');
    assert.match(mainSrc, /'User-Agent': 'Burrito-GenDex-updater'/, "GitHub's agent rule honored");
    assert.match(mainSrc, /const fetchWithTimeout = \(url, opts, ms\) =>/, 'the hung-fetch guard');
    assert.ok(/if \(res\.status === 404\) return \{ ok: true, none: true/.test(rawMain), 'an empty repo is a live channel, not an error');
    assert.match(mainSrc, /ipcMain\.handle\('updates:check', async \(\) =>/, 'the IPC');
  });
  ok('the version compare is numeric per dot part', () => {
    assert.match(mainSrc, /const cmpVersions = \(a, b\) =>/, 'the comparator exists');
    assert.match(mainSrc, /parseInt\(n, 10\) \|\| 0/, 'parts parse as numbers (1.2.10 beats 1.2.9)');
    // prove the law on the comparator's own terms: extract + run it
    const body = /const cmpVersions = \(a, b\) => \{[\s\S]*?\n\};/.exec(src('src/main.js'))?.[0];
    const fn = new Function(`${body}; return cmpVersions;`)();
    assert.equal(fn('1.1.3', '1.1.3'), 0, 'equal is equal');
    assert.ok(fn('1.2.10', '1.2.9') > 0, '1.2.10 > 1.2.9 (the string law would say otherwise)');
    assert.ok(fn('1.1.3', '1.1.2') > 0, '1.1.3 > 1.1.2');
    assert.ok(fn('v1.1.3', '1.1.2') > 0, 'a v prefix is tolerated');
    assert.ok(fn('1.1', '1.1.0') === 0, 'missing parts count as 0');
  });
  ok('the channel never downloads — the renderer only reads a verdict', () => {
    assert.ok(!/net\.fetch/.test(appSrc), 'App never fetches');
    assert.ok(!/net\.fetch/.test(settingsSrc), 'Settings never fetches');
    assert.match(preloadSrc, /updatesCheck: \(\) => ipcRenderer\.invoke\('updates:check'\)/, 'the one bridge');
    assert.ok(!/download/i.test(stripComments(src('src/preload.js'))), 'no download lane anywhere');
  });

  // ---- the update channel: the settings seat ----
  ok('the channel seats: constants + sanitize + the Data tab UI', () => {
    assert.match(constSrc, /export const UPDATE_CHANNELS = \[/, 'the picker options');
    assert.match(src('src/constants/index.js'), /UPDATE_CHANNELS[\s\S]*?\{ id: 'off', label: 'OFF'/, 'OFF offered');
    assert.match(src('src/constants/index.js'), /UPDATE_CHANNELS[\s\S]*?\{ id: 'stable', label: 'STABLE'/, 'STABLE offered');
    assert.match(constSrc, /updateChannel: 'stable',/, 'the fresh default is STABLE');
    assert.match(helpersSrc, /updateChannel: \['off', 'stable'\]\.includes\(rawSettings\.updateChannel\)/, 'createSafeDb whitelists');
    assert.match(settingsSrc, /UPDATE CHANNEL/, 'the OptCard title');
    assert.match(settingsSrc, /options=\{UPDATE_CHANNELS\.map\(\(o\) => \(\{ id: o\.id, label: o\.label, title: o\.title \}\)\)\}/, 'the Seg speaks the constant');
    assert.match(settingsSrc, /value=\{settings\.updateChannel \?\? 'stable'\}/, 'the stored choice rides, stable defaults');
    assert.match(settingsSrc, /onPick=\{\(id\) => set\('updateChannel', id\)\}/, 'the pick lands as a setting');
  });
  ok('the CHECK key + the verdict line + VIEW RELEASE', () => {
    assert.match(settingsSrc, /CHECK FOR UPDATES/, 'the card');
    assert.match(settingsSrc, /disabled=\{!onCheckUpdates \|\| updateState\?\.status === 'checking'\}/, 'one ask at a time');
    assert.match(settingsSrc, /VIEW RELEASE/, 'the release key');
    assert.match(settingsSrc, /window\.api\?\.openExternal\?\.\(updateState\.url\)/, 'it opens the browser, not a download');
    assert.match(settingsSrc, /className="gd-update-line" data-gd-update-status=/, 'the verdict line + its status hook');
    for (const verdict of ['checking', 'none', 'latest', 'available', 'error']) {
      assert.ok(new RegExp(`updateState\\?\\.status === '${verdict}'`).test(settingsSrc), `the ${verdict} verdict speaks`);
    }
    const line = /\.gd-update-line\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(line, /color: var\(--gd-mute\)/, 'the quiet default voice');
    assert.match(codeCss, /\.gd-update-line\[data-gd-update-status='available'\]/, 'the available tint');
    assert.match(codeCss, /\.gd-update-line\[data-gd-update-status='error'\]/, 'the error tint');
  });
  ok("App owns the ask: once per boot on STABLE, never on OFF, main's words only", () => {
    assert.match(appSrc, /const \[updateState, setUpdateState\] = useState\(\{ status: 'idle' \}\)/, 'the one state slot');
    assert.match(appSrc, /const updateAutoCheckedRef = useRef\(false\)/, 'the once guard');
    assert.match(appSrc, /const channel = db\.settings\?\.updateChannel \?\? 'stable';/, 'the stored seat read');
    assert.match(appSrc, /if \(channel !== 'stable' \|\| updateAutoCheckedRef\.current\) return;/, 'OFF never asks, STABLE asks once');
    assert.match(appSrc, /checkUpdates\(false\);/, 'the quiet boot ask');
    assert.match(appSrc, /onCheckUpdates=\{\(\) => checkUpdates\(true\)\}/, 'the CHECK key routes through App');
    assert.match(appSrc, /updateState=\{updateState\}/, 'the verdict flows to the section');
    assert.match(appSrc, /res = await api\?\.updatesCheck\?\.\(\);/, "the ask rides the bridge — a missing bridge is an honest error, never a crash");
    assert.match(appSrc, /setStatus\(`Update available · v\$\{res\.latest\}`\)/, 'the bottom bar speaks the news');
  });

  // ---- the factory reset ----
  ok("the wipe in main: every surface, best-effort, with the dead-man switch", () => {
    assert.match(mainSrc, /ipcMain\.handle\('data:factory-reset', \(\) =>/, 'the IPC');
    assert.match(mainSrc, /let factoryResetting = false;/, 'the switch exists');
    assert.match(mainSrc, /if \(factoryResetting\) return;/, 'writeDb refuses after the wipe');
    assert.match(mainSrc, /fs\.rmSync\(IMAGES_PATH, \{ recursive: true, force: true \}\)/, 'every image dies');
    assert.match(mainSrc, /fs\.rmSync\(BACKUP_DIR, \{ recursive: true, force: true \}\)/, 'every backup dies');
    assert.match(mainSrc, /fs\.rmSync\(DB_FILE, \{ force: true \}\)/, 'the database dies');
    assert.match(mainSrc, /fs\.mkdirSync\(IMAGES_PATH, \{ recursive: true \}\);/, 'a fresh empty images home is reborn');
    assert.match(preloadSrc, /factoryReset: \(\) => ipcRenderer\.invoke\('data:factory-reset'\)/, 'the bridge');
  });
  ok('the DOUBLE confirmation: two windows, distinct stakes, only the second fires', () => {
    assert.match(appSrc, /title: 'FACTORY RESET · STEP 1 OF 2',/, 'step one titled');
    assert.match(appSrc, /confirmLabel: 'CONTINUE',/, 'step one continues');
    assert.match(appSrc, /title: 'FACTORY RESET · STEP 2 OF 2',/, 'step two titled');
    assert.match(appSrc, /confirmLabel: 'ERASE EVERYTHING',/, "step two's key is the only gun");
    const step1 = /title: 'FACTORY RESET · STEP 1 OF 2',[\s\S]*?onConfirm: \(\) => \{\s*confirm\(\{/.exec(appSrc)?.[0] || '';
    assert.ok(step1.includes('confirm({'), 'step one chains into step two (both must pass)');
  });
  ok('the reset clears the renderer world too, and fails honestly', () => {
    assert.match(appSrc, /const res = await api\?\.factoryReset\?\.\(\);/, 'the wipe is awaited');
    assert.match(appSrc, /localStorage\.clear\(\);/, 'the theme snapshot dies with the rest');
    assert.match(appSrc, /window\.location\.reload\(\);/, 'the fresh boot follows');
    assert.match(appSrc, /setStatusTransient\('Factory reset failed: nothing was erased'\)/, 'a failed wipe speaks');
    assert.match(appSrc, /unsavedRef\.current = false;/, 'the unsaved trackers stand down first');
    assert.match(appSrc, /api\?\.sendUnsavedState\?\.\(false\);/, 'the quit-time prompt can never fire over a wipe');
    assert.match(settingsSrc, /RESET ALL/, 'the Data tab key');
    assert.match(settingsSrc, /gd-btn gd-btn-danger/, 'the strongest key wears the danger face');
    assert.match(settingsSrc, /disabled=\{!onFactoryReset\}/, 'no road, no key');
    assert.match(appSrc, /onFactoryReset=\{factoryReset\}/, 'App wires its road');
  });

  // ---- the CI pipeline ----
  ok('the CI file ships in the tree with all three lanes', () => {
    const ci = src('.github/workflows/ci.yml');
    assert.match(ci, /node --test --test-concurrency=1 'scripts\/\*\.test\.mjs'/, 'the test battery runs (glob form — a bare directory is not a test target)');
    assert.match(ci, /node scripts\/css_check\.cjs src\/index\.css/, 'the CSS gate runs');
    assert.match(ci, /node scripts\/parse_check\.mjs/, 'the syntax gate runs');
    assert.match(ci, /if: startsWith\(github\.ref, 'refs\/tags\/v'\)/, 'releases fire on v* tags only');
    assert.match(ci, /npx electron-forge publish --publisher github/, 'the installers publish themselves');
    assert.match(ci, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/, "Actions' own token — no secrets to set");
    assert.match(ci, /needs: tests/, 'nothing ships untested');
    assert.ok(!/password|secret\s*[:=]\s*['"][^'"]+['"]/i.test(ci), 'no secret material in the workflow');
  });
  ok('package.json points home (the publisher + the channel read it)', () => {
    assert.match(
      packageJson,
      /"repository":\s*\{\s*"type": "git",\s*"url": "https:\/\/github\.com\/NuriDerBurrito\/Burrito_GenDex"/
    );
  });

  // ---- the docs tell the same story ----
  ok('the docs speak the new lanes', () => {
    assert.match(src('README.md'), /Update channel \+ CI/, 'the README feature line');
    assert.match(src('README.md'), /Factory reset/, 'the README feature line');
    assert.match(src('README.md'), /\.github\/workflows\/ci\.yml/, 'the layout names the workflow');
    assert.match(src('RELEASE.md'), /The CI road \(preferred\)/, 'the release recipe prefers CI');
    assert.match(src('RELEASE.md'), /`v\*` tag/, 'the recipe names the trigger');
    assert.match(src('CHANGELOG.md'), /## 1\.1\.3[\s\S]*?factory reset/i, 'the changelog entry');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  const mkDb = (channel) => ({
    settings: {
      theme: 'glacier', colors: {}, zoom: 3, defaultSortMode: 'custom',
      textures: { titlebar: 'none', sidebar: 'graph', viewer: 'grid', panel: 'none' },
      detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 }, cardThumbs: true,
      ...(channel ? { updateChannel: channel } : {}),
    },
    classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
    tags: [],
    stamps: [],
    characters: [
      {
        id: 'c1', name: 'amy', classId: 'cl1', tags: [], previewVersionId: 'v1',
        cardRatio: { w: 3, h: 4 }, cardTrim: 'ledger', cardCrop: null, stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
        createdAt: 1,
        versions: [
          { id: 'v1', label: 'Base Look', color: '#c8402f', icon: 'letter:A', images: [{ file: 'a.png', thumb: 'a_t.jpg', prev: 'a_p.jpg' }], parts: [], notes: '', createdAt: 1 },
        ],
      },
    ],
  });

  const makeApi = ({ updateResult = null } = {}) => {
    const calls = { updates: 0, factory: 0, external: [] };
    const api = {
      loadDB: async () => ({ db: mkDb(updateResult && updateResult.__channel), imagesPath: '/mock/images' }),
      saveDB: async () => ({ ok: true }),
      sendUnsavedState: () => {},
      onPromptUnsaved: () => () => {},
      saveAndClose: async () => ({ ok: true }),
      forceClose: () => {},
      windowControl: () => {},
      onWindowMaximized: () => () => {},
      onWindowUnmaximized: () => () => {},
      openExternal: (url) => { calls.external.push(String(url)); },
      clipboardReadText: async () => '',
      clipboardWriteText: async () => {},
      importImagesFromFiles: async () => [],
      saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
      deleteImageFile: async () => ({ ok: true }),
      generatePreviews: async () => ({ prevs: {}, generated: 0, skipped: 0, failed: 0 }),
      onPreviewProgress: () => () => {},
      erasePreviews: async () => ({ ok: true, erased: 0 }),
      exportLibrary: async () => ({ ok: true, images: 0, bytes: 0, missing: 0 }),
      importLibraryPick: async () => ({ ok: false, canceled: true }),
      importLibraryCommit: async () => ({ ok: true, fileMap: {}, written: 0 }),
      updatesCheck: async () => {
        calls.updates += 1;
        return updateResult && updateResult.__ask
          ? updateResult.__ask
          : { ok: true, none: true, current: '1.1.3' };
      },
      factoryReset: async () => {
        calls.factory += 1;
        return { ok: true, removedImages: 3, removedBackups: 2 };
      },
    };
    api.__calls = calls;
    return api;
  };

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const tip = (el) => el.getAttribute('title') || el.getAttribute('data-gd-tip-src') || '';
  const boot = async (api) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400);
    return { host, root };
  };
  const openDataTab = async (doc) => {
    const settingsKey = [...doc.querySelectorAll('button')].find((b) => /^settings/i.test(tip(b)));
    click(settingsKey);
    await sleep(500);
    const dataTab = [...doc.querySelectorAll('button')].find((b) => /^data$/i.test((b.textContent || '').trim()));
    assert.ok(dataTab, 'the Data tab found');
    click(dataTab);
    await sleep(400);
  };
  const modalTitle = (doc) => {
    const cards = [...doc.querySelectorAll('.gd-modal-card')];
    const titled = cards.map((c) => (c.querySelector('.gd-rule')?.textContent || '').trim());
    return titled;
  };

  await okAsync('the factory reset: double confirmation, and only both keys fire it (live)', async () => {
    const api = makeApi();
    const { host, root } = await boot(api);
    const doc = host.ownerDocument;
    // a sentinel in the renderer world — it must die with the reset
    localStorage.setItem('gd_113_probe', 'sentinel');
    await openDataTab(doc);
    const resetAll = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^reset all$/i.test((b.textContent || '').trim()));
    assert.ok(resetAll, 'the RESET ALL key found');
    // every confirm query is scoped to ITS modal card — the settings window
    // underneath carries its own CANCEL/DONE, and a stray match there would
    // close the wrong world (the stacked-window law).
    const confirmCard = () =>
      [...doc.querySelectorAll('.gd-modal-card')].find((c) => /FACTORY RESET/.test(c.querySelector('.gd-rule')?.textContent || ''));
    const confirmKey = (re) => {
      const card = confirmCard();
      return card ? [...card.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim())) : undefined;
    };
    // first press: step one
    click(resetAll);
    await sleep(400);
    assert.match(confirmCard()?.querySelector('.gd-rule')?.textContent || '', /FACTORY RESET · STEP 1 OF 2/, 'step one speaks');
    // continue: step two
    click(confirmKey(/^continue$/i));
    await sleep(400);
    assert.match(confirmCard()?.querySelector('.gd-rule')?.textContent || '', /FACTORY RESET · STEP 2 OF 2/, 'step two speaks');
    assert.equal(api.__calls.factory, 0, 'nothing wiped yet');
    assert.ok(confirmKey(/^erase everything$/i), 'the ERASE EVERYTHING key');
    // ...but CANCEL at step two first: the escape hatch must leave the world untouched
    click(confirmKey(/^cancel$/i));
    await sleep(400);
    assert.equal(api.__calls.factory, 0, 'cancel at step two wipes nothing');
    assert.equal(localStorage.getItem('gd_113_probe'), 'sentinel', 'the renderer world untouched');
    assert.ok(!confirmCard(), 'the confirm window closed on cancel');
    // full road: RESET ALL → CONTINUE → ERASE EVERYTHING
    click(resetAll);
    await sleep(400);
    click(confirmKey(/^continue$/i));
    await sleep(400);
    click(confirmKey(/^erase everything$/i));
    await sleep(700);
    assert.equal(api.__calls.factory, 1, 'the wipe ran exactly once');
    assert.equal(localStorage.getItem('gd_113_probe'), null, 'the renderer world died with it');
    assert.equal(localStorage.getItem('gdThemeSnapshot'), null, 'the theme snapshot died too');
    root.unmount();
    host.remove();
  });

  await okAsync('the update channel: quiet boot ask, verdict line, VIEW RELEASE, CHECK (live)', async () => {
    const api = makeApi({
      updateResult: {
        __ask: {
          ok: true, newer: true, latest: '9.9.9', current: '1.1.3',
          name: 'Burrito GenDex 9.9.9',
          url: 'https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v9.9.9',
          publishedAt: '2026-10-01T00:00:00Z',
        },
      },
    });
    const { host, root } = await boot(api);
    const doc = host.ownerDocument;
    assert.equal(api.__calls.updates, 1, 'the boot asked exactly once (no ask-loop)');
    // the bottom bar speaks the news
    assert.match(doc.body.textContent || '', /Update available · v9\.9\.9/, 'the status bar speaks');
    await openDataTab(doc);
    // the STABLE seat is picked
    const stable = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^stable$/i.test((b.textContent || '').trim()));
    assert.ok(stable, 'the STABLE seat found');
    // the verdict line carries the available verdict
    const line = doc.querySelector('.gd-update-line');
    assert.ok(line, 'the verdict line renders');
    assert.equal(line.getAttribute('data-gd-update-status'), 'available', 'the status hook');
    assert.match(line.textContent || '', /v9\.9\.9/, 'the new version speaks');
    assert.match(line.textContent || '', /2026-10-01/, 'the publish date speaks');
    // VIEW RELEASE opens the browser at the release page
    const view = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^view release$/i.test((b.textContent || '').trim()));
    assert.ok(view, 'the VIEW RELEASE key');
    click(view);
    await sleep(200);
    assert.ok(
      api.__calls.external.includes('https://github.com/NuriDerBurrito/Burrito_GenDex/releases/tag/v9.9.9'),
      'the browser opened at the release page'
    );
    // CHECK asks again
    const before = api.__calls.updates;
    const check = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^check$/i.test((b.textContent || '').trim()));
    assert.ok(check, 'the CHECK key');
    click(check);
    await sleep(400);
    assert.equal(api.__calls.updates, before + 1, 'the CHECK key asked once more');
    root.unmount();
    host.remove();
  });

  await okAsync('the OFF seat never asks, and the section stays honest (live)', async () => {
    const api = makeApi({ updateResult: { __channel: 'off' } });
    const { host, root } = await boot(api);
    const doc = host.ownerDocument;
    await sleep(600);
    assert.equal(api.__calls.updates, 0, 'OFF never asked — full silence');
    await openDataTab(doc);
    const off = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^off$/i.test((b.textContent || '').trim()));
    assert.ok(off, 'the OFF seat found');
    const line = doc.querySelector('.gd-update-line');
    assert.ok(line, 'the verdict line renders');
    assert.equal(line.getAttribute('data-gd-update-status'), 'idle', 'never asked');
    assert.match(line.textContent || '', /v1\.4\.3/, 'it still speaks the running version');
    // CHECK is right there even on OFF — the user's hand beats the switch
    const check = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^check$/i.test((b.textContent || '').trim()));
    assert.ok(check && !check.disabled, 'CHECK stays armed for a manual ask');
    click(check);
    await sleep(400);
    assert.equal(api.__calls.updates, 1, 'the manual ask ran');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.1.3 batch: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
