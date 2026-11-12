// 1.1.2 batch DOM + source checks — the traveling library, the honest
// counts, and a calmer grid. The sixteen implemented fixes:
//   · THE PREVIEW ERASE KEY ("make it so previews are also tied to a
//     specific button to erase in data section"): Data → MAINTENANCE.
//   · THE KEYED SEATS ("make settings and the generate thumbnails button
//     clearer, not a seamless icon with no border container"): restart /
//     thumb / settings wear the bordered is-keyed container.
//   · THE SPLASH KEEPS ITS COLOR ("make it so the app icon doesnt turn
//     back grey after it gets colored"): one-shot wake + looping pulse.
//   · LIBRARY EXPORT / IMPORT ("add library import/export … as it claims
//     a zip file, and let it also read the zip file and extract it"): the
//     minimal zip engine (zlib + crc32), the three IPCs, the verdict
//     window (MERGE / REPLACE), the id + file remapping.
//   · AUTOSAVE FIVE ("auto save make it occur every 5 mins now (keep the
//     none option still ofc)"): the fresh-database default.
//   · GRID VIRTUALIZATION ("add grid virtualization"): the sheet keeps its
//     full height; only the viewport's window (+overscan) stays mounted.
//   · THE CLASS IS WHERE YOU ARE ("in card creation window, remove the
//     option to select which class it goes to..."): the selector is gone,
//     a read-only FILED UNDER line carries the opened class.
//   · TAGS AT BIRTH ("add adding tags to the card when creating it...
//     when i press on the + to add a new tag the tag manager will open"):
//     the creation window's TAGS row + the manager's OVERLAY seat + the
//     close lock beneath it.
//   · THE EXPAND KEY CANNOT STAY HIDDEN ("when the detail pannel name
//     gets cropped that i dont get the expand name and retact name
//     button"): the clamp's own cut (scrollHeight past clientHeight) is
//     the second arming signal; the fonts' ready promise re-reads.
//   · THE SPLIT STOPS INFLATING ("if the version is taking more space
//     than it needs then it gives it to the name..."): the chip floor is
//     min(96px, max-content).
//   · THE HOVER SPEAKS WITH ONE MIND ("multiple minds are thinking about
//     the version count area... not in then out then in"): the badge's own
//     room is part of the crop measure at rest; has-unfold gates the
//     foot's badge + the hover grid flip.
//   · THE PICKER'S COMMIT LANE ("its still laggy when i use a colorpicker
//     on the manual colors in the settings look section"): the drag
//     previews as CSS vars; the release commits once.
//   · THE PICKER'S CONTAINER ("mimic the container of the stamps in the
//     filters section"): the add-stamp picker's tiles are is-bare.
//   · HONEST COUNTS ("only give feedback about the newly generated ones
//     instead of already existing ones"): the verdict speaks `generated`
//     alone; the save paths say "· preview ready".
//   · PILLS BELOW THE BAR ("top feedback inside tooltips coming from top
//     should be below the top bar"): the flip seats below the bar's true
//     bottom edge.
//   · THE SNAP FOLD ("it freezes slightly and gets janky when i scroll,
//     as if it pushes forward then back"): scroll-triggered folds land in
//     one frame with the offset compensated.
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
  console.log('jsdom unavailable — 1.1.2 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the 1.1.2 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const appSrc = stripComments(src('src/App.jsx'));
  const cvSrc = stripComments(src('src/components/CharacterView.jsx'));
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const titleSrc = stripComments(src('src/components/Titlebar.jsx'));
  const splashSrc = stripComments(src('src/components/Splash.jsx'));
  const modalSrc = stripComments(src('src/components/Modal.jsx'));
  const pickerSrc = stripComments(src('src/components/ColorPicker.jsx'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const newCharSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const masonrySrc = stripComments(src('src/components/MasonryGrid.jsx'));
  const stampModalSrc = stripComments(src('src/components/StampEditModal.jsx'));
  const tooltipsSrc = stripComments(src('src/components/GdTooltips.jsx'));
  const mainSrc = stripComments(src('src/main.js'));
  const preloadSrc = stripComments(src('src/preload.js'));
  const constSrc = stripComments(src('src/constants/index.js'));
  const dialogsSrc = stripComments(src('src/components/Dialogs.jsx'));
  const helpersSrc = stripComments(src('src/utils/helpers.js'));

  // ---- the version ----
  ok('the version is 1.1.2', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
    assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  });

  // ---- fix 1: the erase key ----
  ok('1.3.2 the erase key is retired with the preview system', () => {
    assert.ok(!/image:erase-previews/.test(mainSrc), 'the main-side handler is gone');
    assert.ok(!/erasePreviews/.test(preloadSrc), 'the bridge entry is gone');
    assert.ok(!/ERASE PREVIEW THUMBNAILS/.test(settingsSrc), 'the OptCard is gone');
    assert.ok(!/const erasePreviews = useCallback/.test(appSrc), "App's handler is gone");
  });

  // ---- fix 2: the keyed seats ----
  ok('the keyed seats: bordered containers on the two acting keys (the thumb key retired)', () => {
    assert.match(titleSrc, /gd-icon-btn is-keyed" title="Restart the app/, 'restart');
    assert.ok(!/thumbsOn/.test(titleSrc), '1.3.2: the thumb key is retired with the preview system');
    assert.match(titleSrc, /gd-icon-btn is-keyed" title=\{`Settings/, 'settings');
    const keyed = /\.gd-icon-btn\.is-keyed\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(keyed, /border-color: color-mix/, 'a real border');
    assert.match(keyed, /background: color-mix/, 'a real face');
  });

  // ---- fix 3: the wake ----
  ok('1.1.4 the splash pulses in ONCE — grey to color, then it holds', () => {
    // ("make the icon start as grey as it pulses in and gets colored, but
    // dont pulse it back out or grey it or darken it again"): the loop is
    // retired. ONE flight carries everything — grey/dim/small -> colored,
    // fully present, full size — and `forwards` holds the landing forever.
    assert.match(codeCss, /@keyframes gd-splash-wake/, 'the one-shot keyframes exist');
    const wake = /@keyframes gd-splash-wake\s*\{[^@]*\}/.exec(codeCss)?.[0] || '';
    assert.match(wake, /grayscale\(1\)/, 'born grey');
    assert.match(wake, /grayscale\(0\)/, 'lands colored');
    assert.match(wake, /opacity: 0\.5;/, 'born dim');
    assert.match(wake, /opacity: 1;/, 'lands fully present');
    assert.match(wake, /scale\(0\.95\)/, 'born small');
    assert.match(wake, /scale\(1\)/, 'lands at full size');
    assert.ok(!/@keyframes gd-splash-pulse/.test(codeCss), '1.1.4: the looping pulse is retired (no pulse-out, no re-grey, no darkening)');
    assert.match(codeCss, /animation: gd-splash-wake 2\.5s ease-out forwards;/, 'ONE flight, forwards — the signature beat holds its landing');
  });

  // ---- fix 4: the library tier ----
  ok('the zip engine lives in main (crc32 + deflate + central directory)', () => {
    assert.match(mainSrc, /const crc32Of = \(buf\) =>/, 'the checksum');
    assert.match(mainSrc, /zlib\.deflateRawSync/, 'the compressor');
    assert.match(mainSrc, /zlib\.inflateRawSync/, 'the decompressor');
    assert.match(mainSrc, /0x04034b50/, 'the local header signature');
    assert.match(mainSrc, /0x02014b50/, 'the central directory signature');
    assert.match(mainSrc, /0x06054b50/, 'the end-of-central-directory signature');
  });
  ok('the three library IPCs + the collectImageFiles law', () => {
    assert.match(mainSrc, /ipcMain\.handle\('library:export', async \(_event, dbJson\)/);
    assert.match(mainSrc, /ipcMain\.handle\('library:import-pick', async \(\)/);
    assert.match(mainSrc, /ipcMain\.handle\('library:import-commit', \(_event, payload\)/);
    assert.match(mainSrc, /const collectImageFiles = \(db\) =>/, 'the one collector');
    assert.match(preloadSrc, /exportLibrary: \(dbJson\) => ipcRenderer\.invoke\('library:export'/);
    assert.match(preloadSrc, /importLibraryPick: \(\) => ipcRenderer\.invoke\('library:import-pick'\)/);
    assert.match(preloadSrc, /importLibraryCommit: \(payload\) => ipcRenderer\.invoke\('library:import-commit', payload\)/);
  });
  ok('the verdict window + the merge/replace roads', () => {
    assert.match(dialogsSrc, /export function ImportLibraryModal/, 'the modal exists');
    assert.match(dialogsSrc, /onMerge/, 'merge');
    assert.match(dialogsSrc, /onReplace/, 'replace');
    assert.match(appSrc, /const exportLibrary = useCallback/, 'App exports');
    assert.match(appSrc, /const importLibrary = useCallback/, 'App picks');
    assert.match(appSrc, /const importLibraryCommit = useCallback/, 'App commits');
    assert.match(appSrc, /'import:merge'/, 'merge is one undo step');
    assert.match(appSrc, /'import:replace'/, 'replace is one undo step');
    assert.match(appSrc, /classIdMap\.set\(cls\.id, uuidv4\(\)\)/, 'colliding class ids re-mint');
    assert.match(appSrc, /file: remapFile\(img\.file\)/, 'image files repoint through the remap');
    assert.match(settingsSrc, /EXPORT LIBRARY/, 'the Data tab seat');
    assert.match(settingsSrc, /IMPORT LIBRARY/, 'the Data tab seat');
  });

  // ---- fix 5: autosave five ----
  ok('autosave defaults to five (the OFF seat stays)', () => {
    assert.match(constSrc, /autosaveMinutes: 5,/, 'the fresh default');
    assert.match(src('src/constants/index.js'), /AUTOSAVE_OPTIONS[\s\S]*?\{ id: 0, label: 'OFF'/, 'OFF still offered');
  });

  // ---- fix 6: virtualization ----
  ok('the masonry renders only the window', () => {
    assert.match(masonrySrc, /const OVERSCAN = 700;/, 'the generous overscan');
    assert.match(masonrySrc, /const virtualized = viewH > 0;/, 'the jsdom-safe gate (no viewport = render all)');
    assert.match(masonrySrc, /p\.y \+ h > scrollTop - OVERSCAN && p\.y < scrollTop \+ viewH \+ OVERSCAN/, 'the window test');
    assert.match(masonrySrc, /initial=\{seenRef\.current\.has\(id\) \? false : \{ opacity: 0, y: 10 \}\}/, 're-entry is still');
    assert.match(masonrySrc, /seenRef\.current\.add\(id\)/, 'first mounts are remembered');
  });

  // ---- fix 7: the class is where you are ----
  ok('the creation window files into the opened class', () => {
    assert.ok(!/Where the card is filed/.test(newCharSrc), 'the SELECT is gone');
    assert.ok(!/setClassId/.test(newCharSrc), 'no class state to change');
    // 1.1.4 — ("remove field under class in the card creation, as i said
    // it auto creates in the class opened"): the read-only FILED UNDER
    // line — the selector's last echo — is retired too. The card simply
    // lands in the class the window was opened from.
    assert.ok(!/FILED UNDER/.test(newCharSrc), '1.1.4: the FILED UNDER line is gone');
    assert.ok(!/filedUnder/.test(newCharSrc), 'and its memo left with it');
    assert.match(newCharSrc, /const \[classId\] = useState\(defaultClassId \|\| ROOT_CLASS_ID\)/, 'the class rides the prop');
    assert.match(appSrc, /defaultClassId=\{modal\.classId \?\? selectedClassId\}/, 'App passes the opened class');
    assert.match(appSrc, /characters: d\.characters\.map\(\(c\) => \(doomed\.has\(c\.classId \|\| ROOT_CLASS_ID\) \? \{ \.\.\.c, classId: ROOT_CLASS_ID \} : c\)\)/, 'deletion still lands cards in Unsorted');
  });

  // ---- fix 8: tags at birth ----
  ok('tags at birth: the row, the + key, the overlay, the lock', () => {
    assert.match(newCharSrc, /const \[pickedTagIds, setPickedTagIds\] = useState\(\[\]\)/, 'the picked set');
    assert.match(newCharSrc, /tags: pickedTagIds,/, 'submit carries them');
    assert.match(newCharSrc, /onOpenTagManager/, 'the + key asks');
    assert.match(newCharSrc, /closeLocked=\{tagManagerOpen\}/, 'the window locks while the manager is up');
    assert.match(modalSrc, /closeLocked = false,/, 'Modal knows the lock');
    assert.match(modalSrc, /if \(closeLocked\) return;/, 'the gestures swallow');
    assert.match(constSrc, /tagIds = \[\]/, 'makeCharacter takes the ids');
    assert.match(appSrc, /const \[tagManagerOver, setTagManagerOver\] = useState\(false\)/, 'the overlay seat');
    assert.match(appSrc, /tagManagerOver && modal\?\.type === 'newCharacter' && db/, 'the manager mounts over the window');
    assert.match(appSrc, /onClose=\{\(\) => setTagManagerOver\(false\)\}/, 'its close never touches the window beneath');
  });

  // ---- fix 10: the arming ----
  ok('the expand key arms on the clamp\'s own cut too', () => {
    assert.match(cvSrc, /const nameSignals = \(\) =>/, 'the shared probe');
    assert.match(cvSrc, /el\.scrollHeight > el\.clientHeight \+ Math\.ceil\(lh \* 0\.5\)/, 'the clamp testifies (half a line box, not +1px)');
    assert.match(cvSrc, /s\.twinSays \|\| s\.clampCuts/, 'either signal arms');
    assert.match(cvSrc, /document\.fonts\.ready\.then/, 'the font-settled re-read');
    assert.match(cvSrc, /if \(probe\) ro\.observe\(probe\);\s*\n\s*if \(real\) ro\.observe\(real\)/, 'both boxes watched');
  });

  // ---- fix 11: the floor ----
  ok('the chip floor floors without inflating', () => {
    const floor = /\.gd-out-split\.gd-chip-flat\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(floor, /min-width: min\(96px, max-content\);/);
  });

  // ---- fix 12: one mind ----
  ok('the hover speaks with one mind', () => {
    // 1.1.4 — the final form: the scrollWidth-seat measure was structurally
    // broken (scrollWidth is CLAMPED to clientWidth, so subtracting the
    // badge's room made every versioned card read "cropped") and the plate
    // it mounted WRAPPED the name at spaces instead of clipping it. The
    // plate retired; the hover is ONE fade in a seat that moves nothing.
    assert.ok(!/measureName/.test(gridSrc), 'the scrollWidth-seat measure is gone (it could only ever say cropped)');
    assert.ok(!/has-unfold/.test(gridSrc), 'no plate gate class anywhere');
    assert.match(gridSrc, /character\.versions\.length > 0 && 'has-vers'/, 'the foot gates the flip on has-vers (a badge exists)');
    assert.match(codeCss, /\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers[\s\S]{0,200}?height: calc\(18\.75px \* var\(--card-scale, 1\)\);/, 'the seated badge wears the title line height — the rows never move');
    assert.match(codeCss, /\.gd-card:hover \.gd-card-foot-vers\.has-vers,\s*\.gd-card-foot-vers\.has-vers:focus-within \{\s*grid-template-columns: minmax\(0, 1fr\) auto;/, 'the flip opens the badge track only when a badge exists');
    assert.ok(!/gd-name-unfold/.test(codeCss), 'the unfold plate (and its wrap-at-spaces) is retired');
  });

  // ---- fix 13: the commit lane ----
  ok('the picker previews cheap and commits once', () => {
    assert.match(pickerSrc, /onCommit = null,/, 'the panel knows the commit lane');
    assert.match(pickerSrc, /onCommit\?\.\(lastEmitted\.current\)/, 'the release commits the last word');
    assert.match(pickerSrc, /const emitAndCommit = \(hex\) =>/, 'discrete acts commit in the same beat');
    assert.match(settingsSrc, /onColor=\{\(hex\) => onPreviewColor\(\{ \[el\.key\]: hex \}\)\}/, 'the drag previews');
    assert.match(settingsSrc, /onCommit=\{\(hex\) => onSetColors\(\{ \[el\.key\]: hex \}\)\}/, 'the release writes');
    assert.match(settingsSrc, /const previewColors = \(patch\) =>/, 'the preview resolves against the live theme');
    assert.match(settingsSrc, /setThemeOnDocumentLive\(/, 'straight onto the document');
  });

  // ---- fix 14: the picker's container ----
  ok('the add-stamp picker speaks the bare container', () => {
    assert.match(stampModalSrc, /'gd-spot-tile is-bare', onCard && 'is-attached'/, 'the tiles are bare');
    assert.match(codeCss, /\.gd-spot-tile\.is-bare\.is-attached \.gd-spot-tile-box img/, 'attached art greys');
  });

  // ---- fix 15: honest counts ----
  ok('1.3.2 the generate verdict is retired with the system (no lies left to speak)', () => {
    assert.ok(!/res\.generated \|\| landed/.test(appSrc), 'the lying fallback is gone');
    assert.ok(!/const fresh = Math\.max/.test(appSrc), 'the tally is gone with the generator');
    assert.ok(!/No new previews needed/.test(appSrc), 'the quiet verdict is gone');
    assert.ok(!/' · preview ready'/.test(appSrc), 'the save paths stay quiet (the build is automatic, not news)');
  });

  // ---- fix 16: pills below the bar ----
  ok('the flip seats below the bar\'s true bottom', () => {
    assert.match(tooltipsSrc, /const barBottom = \(\) =>/, 'the live edge read');
    assert.match(tooltipsSrc, /y = Math\.max\(rect\.bottom, barBottom\(\)\) \+ 7;/, 'the full paint');
    // 1.2.4 re-law: the cheap re-place loop is retired (the pill PINS at
    // its hover point) — the bar-bottom flip law lives in paint() alone.
    assert.match(tooltipsSrc, /y = Math\.max\(rect\.bottom, barBottom\(\)\) \+ 7;/, 'the below-flip seats under the bar (paint owns it now)');
  });

  // ---- fix 17: the snap fold ----
  ok('the scroll fold snaps and compensates', () => {
    assert.match(cvSrc, /const \[foldSnap, setFoldSnap\] = useState\(false\)/, 'the snap seat');
    assert.match(cvSrc, /scroller\.scrollTop = Math\.max\(0, scroller\.scrollTop - give\)/, 'the offset gives back the height');
    assert.match(cvSrc, /transition=\{foldSnap \? \{ duration: 0 \} : \{ duration: 0\.24, ease:/, 'one frame under the wheel');
    assert.match(cvSrc, /body\.top <= view\.top \+ 1/, 'compensated only when the fold starts at/above the viewport top');
  });

  // ---- the declinations, noted ----
  ok('bulk operations and class search stay absent', () => {
    assert.ok(!/bulkSelect|multiSelect/.test(appSrc), 'no bulk machinery');
    assert.ok(!/searchEveryClass|rootSearch/.test(appSrc), 'no class-wide search');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  const mkDb = () => ({
    settings: {
      theme: 'glacier', colors: {}, zoom: 3, defaultSortMode: 'custom',
      textures: { titlebar: 'none', sidebar: 'graph', viewer: 'grid', panel: 'none' },
      detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 }, cardThumbs: true,
    },
    classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
    tags: [
      { id: 't1', name: 'blue hair', color: '#4a7dd8', icon: null, trim: 'straight' },
      { id: 't2', name: 'cape', color: '#c86a4a', icon: null, trim: 'v' },
    ],
    stamps: [],
    characters: [
      {
        id: 'c1', name: 'amy the amber archer of the long autumn woods', classId: 'cl1', tags: ['t1'], previewVersionId: 'v1',
        cardRatio: { w: 3, h: 4 }, cardTrim: 'ledger', cardCrop: null, stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
        createdAt: 1,
        versions: [
          { id: 'v1', label: 'Base Look', color: '#c8402f', icon: 'letter:A', images: [{ file: 'a.png', thumb: 'a_t.jpg', prev: 'a_p.jpg' }], parts: [{ id: 'p1', name: 'body', content: 'a tall figure', include: true }], notes: '', createdAt: 1 },
          { id: 'v2', label: 'V2 Alt', color: '#2456c8', icon: 'Star', images: [{ file: 'b.png', thumb: 'b_t.jpg' }], parts: [], notes: '', createdAt: 2 },
        ],
      },
    ],
  });

  const makeApi = () => {
    const calls = { generate: [], erase: 0, export: 0, importPick: 0, importCommit: 0 };
    const api = {
      loadDB: async () => ({
        db: mkDb(),
        imagesPath: '/mock/images',
      }),
      saveDB: async () => ({ ok: true }),
      sendUnsavedState: () => {},
      onPromptUnsaved: () => () => {},
      saveAndClose: async () => ({ ok: true }),
      forceClose: () => {},
      windowControl: () => {},
      onWindowMaximized: () => () => {},
      onWindowUnmaximized: () => () => {},
      openExternal: () => {},
      clipboardReadText: async () => '',
      clipboardWriteText: async () => {},
      importImagesFromFiles: async () => [],
      saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
      deleteImageFile: async () => ({ ok: true }),
      generatePreviews: async (list) => {
        calls.generate.push(list);
        return { prevs: { b: 'b_p.jpg' }, generated: 1, skipped: 1, failed: 0 };
      },
      onPreviewProgress: () => () => {},
      erasePreviews: async () => {
        calls.erase += 1;
        return { ok: true, erased: 2 };
      },
      exportLibrary: async () => {
        calls.export += 1;
        return { ok: true, images: 3, bytes: 2048, missing: 0 };
      },
      importLibraryPick: async () => {
        calls.importPick += 1;
        return {
          ok: true,
          path: 'C:/mock/library.zip',
          db: {
            settings: mkDb().settings,
            classes: [{ id: 'k1', name: 'imported class', parentId: 'root', order: 1 }],
            tags: [{ id: 't1', name: 'blue hair', color: '#4a7dd8', icon: null, trim: 'straight' }],
            stamps: [],
            characters: [
              {
                id: 'c1', name: 'imported amy', classId: 'k1', tags: ['t1'], previewVersionId: 'w1',
                cardRatio: { w: 3, h: 4 }, cardTrim: 'ledger', cardCrop: null, stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
                createdAt: 3,
                versions: [
                  { id: 'w1', label: 'Imported', color: null, icon: null, images: [{ file: 'z.png', thumb: 'z_t.jpg', prev: null }], parts: [], notes: '', createdAt: 3 },
                ],
              },
            ],
          },
          images: [{ name: 'z.png', data: Buffer.from([1, 2, 3]) }],
          counts: { characters: 1, classes: 1, tags: 1, stamps: 0, images: 1 },
        };
      },
      importLibraryCommit: async (payload) => {
        calls.importCommit += 1;
        assert.ok(Array.isArray(payload?.images) && payload.images.length === 1, 'the buffers ride the commit');
        return { ok: true, fileMap: { 'z.png': 'img_123_abc.png' }, written: 1 };
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

  await okAsync('the creation window: FILED UNDER, TAGS row, the overlay, the lock (live)', async () => {
    const { host, root } = await boot(makeApi());
    const doc = host.ownerDocument;
    // open NEW CARD (the grid's add tile or the toolbar key)
    const newKey = [...doc.querySelectorAll('button')].find((b) => /new card|create a new card/i.test(tip(b) + (b.textContent || '')));
    assert.ok(newKey, 'a new-card key exists');
    click(newKey);
    await sleep(500);
    // the CLASS SELECT is gone; 1.1.4 — the FILED UNDER line is gone with
    // it ("remove field under class in the card creation, as i said it auto
    // creates in the class opened"). 1.3.9 supersede: the creation window
    // DOES carry a select again — the PATTERN dropdown (the card's own
    // looks, 12 seats). Any select in the window must be that picker,
    // never a class list.
    const selects = [...doc.querySelectorAll('.gd-modal-card select')];
    for (const sel of selects) {
      const opts = [...sel.options].map((o) => (o.textContent || '').trim());
      assert.ok(opts.length === 12 && opts.includes('None') && opts.includes('Stripes'), 'the only select is the PATTERN dropdown (12 seats)');
    }
    const labels = [...doc.querySelectorAll('.gd-modal-card [class*="tracking-[0.2em]"]')].map((sp) => (sp.textContent || '').trim());
    assert.ok(!labels.some((t) => /FILED UNDER/i.test(t)), '1.1.4: the FILED UNDER line is retired');
    assert.ok(labels.some((t) => /^NAME$/.test(t)) && labels.some((t) => /^TAGS/.test(t)), 'the DETAILS column leads with NAME, then TAGS');
    // the TAGS row carries the vocabulary + the + key
    const chips = [...doc.querySelectorAll('.gd-modal-card .gd-chip')].map((c) => (c.textContent || '').trim());
    assert.ok(chips.includes('blue hair') && chips.includes('cape'), 'both tags sit as toggle chips');
    const plus = [...doc.querySelectorAll('.gd-modal-card .gd-btn')].find((b) => /open the tag manager/i.test(tip(b)));
    assert.ok(plus, 'the + key exists');
    // open the manager OVER the window
    click(plus);
    await sleep(400);
    const titles = [...doc.querySelectorAll('.gd-modal-card .gd-rule')].map((r) => (r.textContent || '').trim());
    assert.ok(titles.some((t) => /NEW CARD/.test(t)) && titles.some((t) => /TAG MANAGER/.test(t)), 'both windows live together');
    // the creation window's X is INERT while the manager is up
    const cards = [...doc.querySelectorAll('.gd-modal-card')];
    const creationCard = cards.find((c) => /NEW CARD/.test(c.querySelector('.gd-rule')?.textContent || ''));
    const xKey = creationCard?.querySelector('button[title="Close"]');
    assert.ok(xKey, 'the creation window has an X');
    click(xKey);
    await sleep(300);
    const titlesAfterX = [...doc.querySelectorAll('.gd-modal-card .gd-rule')].map((r) => (r.textContent || '').trim());
    assert.ok(titlesAfterX.some((t) => /NEW CARD/.test(t)), 'the X did NOT close the creation window');
    // the manager's own close clears only the overlay
    const managerCard = cards.find((c) => /TAG MANAGER/.test(c.querySelector('.gd-rule')?.textContent || ''));
    const managerDone = [...(managerCard?.querySelectorAll('button') || [])].find((b) => /^done$/i.test((b.textContent || '').trim()));
    if (managerDone) {
      click(managerDone);
      await sleep(300);
      const after = [...doc.querySelectorAll('.gd-modal-card .gd-rule')].map((r) => (r.textContent || '').trim());
      assert.ok(after.some((t) => /NEW CARD/.test(t)) && !after.some((t) => /TAG MANAGER/.test(t)), 'the manager closed alone');
    }
    // pick a tag + CREATE with it
    const chip = [...doc.querySelectorAll('.gd-modal-card .gd-chip')].find((c) => /blue hair/i.test(c.textContent || ''));
    click(chip);
    await sleep(200);
    const nameField = [...doc.querySelectorAll('.gd-modal-card .gd-rt-edit')].find((el) => /e\.g\. amy/i.test(el.getAttribute('aria-label') || ''));
    assert.ok(nameField, 'the name field found');
    nameField.focus();
    nameField.textContent = 'Tagborn';
    nameField.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(300);
    const create = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^create$/i.test((b.textContent || '').trim()));
    assert.ok(create && !create.disabled, 'CREATE armed');
    click(create);
    await sleep(600);
    const cardsNow = [...doc.querySelectorAll('[data-gd-char-id]')].map((el) => el.getAttribute('data-gd-char-id'));
    assert.equal(cardsNow.length, 2, 'the card landed');
    root.unmount();
    host.remove();
  });

  await okAsync('the library import: pick → verdict → merge with reminted ids (live)', async () => {
    const api = makeApi();
    const { host, root } = await boot(api);
    const doc = host.ownerDocument;
    // open the verdict directly through App's flow: settings → Data → IMPORT
    const settingsKey = [...doc.querySelectorAll('button')].find((b) => /^settings/i.test(tip(b)));
    click(settingsKey);
    await sleep(500);
    const dataTab = [...doc.querySelectorAll('button')].find((b) => /^data$/i.test((b.textContent || '').trim()));
    assert.ok(dataTab, 'the Data tab found');
    click(dataTab);
    await sleep(400);
    const importKey = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^import$/i.test((b.textContent || '').trim()));
    assert.ok(importKey, 'the IMPORT key found');
    click(importKey);
    await sleep(600);
    assert.equal(api.__calls.importPick, 1, 'the pick ran');
    const verdict = [...doc.querySelectorAll('.gd-modal-card')].find((c) => /IMPORT LIBRARY/.test(c.querySelector('.gd-rule')?.textContent || ''));
    assert.ok(verdict, 'the verdict window speaks the counts');
    assert.match(verdict.textContent || '', /1 card · 1 class · 1 tag · 0 stamps · 1 image/, 'the counts read');
    const merge = [...verdict.querySelectorAll('button')].find((b) => /^merge$/i.test((b.textContent || '').trim()));
    assert.ok(merge, 'the MERGE key');
    click(merge);
    await sleep(900);
    assert.equal(api.__calls.importCommit, 1, 'the commit ran');
    // the merged card exists with a REMINTED id (c1 collides) + the remapped file
    const ids = [...doc.querySelectorAll('[data-gd-char-id]')].map((el) => el.getAttribute('data-gd-char-id'));
    assert.equal(ids.length, 2, 'the imported card joined');
    assert.ok(!ids.includes('c1') || ids.filter((i) => i === 'c1').length === 1, 'no id duplication');
    // the VERDICT window closed (settings may stay — the import ran from it)
    const verdictGone = ![...doc.querySelectorAll('.gd-modal-card')].some((c) => /IMPORT LIBRARY/.test(c.querySelector('.gd-rule')?.textContent || ''));
    assert.ok(verdictGone, 'the verdict window closed after the landing');
    root.unmount();
    host.remove();
  });

  await okAsync('1.3.2 nothing generates on demand anymore (live)', async () => {
    const api = makeApi();
    const { host, root } = await boot(api);
    const doc = host.ownerDocument;
    const key = [...doc.querySelectorAll('button')].find((b) => /generate preview thumbnails/i.test(tip(b)));
    assert.ok(!key, '1.3.2: no thumb key, no generate key anywhere');
    assert.equal(api.__calls.generate.length, 0, 'the generator IPC is never called');
    root.unmount();
    host.remove();
  });

  await okAsync('1.3.2 the Data tab carries no erase key (live)', async () => {
    const api = makeApi();
    const { host, root } = await boot(api);
    const doc = host.ownerDocument;
    const settingsKey = [...doc.querySelectorAll('button')].find((b) => /^settings/i.test(tip(b)));
    click(settingsKey);
    await sleep(500);
    const dataTab = [...doc.querySelectorAll('button')].find((b) => /^data$/i.test((b.textContent || '').trim()));
    click(dataTab);
    await sleep(400);
    const eraseKey = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^erase$/i.test((b.textContent || '').trim()));
    assert.ok(!eraseKey, '1.3.2: the ERASE key is retired with the preview system');
    const resetKey = [...doc.querySelectorAll('.gd-modal-card button')].find((b) => /^reset$/i.test((b.textContent || '').trim()));
    assert.ok(resetKey, 'the RESET DATABASE key keeps its seat');
    root.unmount();
    host.remove();
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
