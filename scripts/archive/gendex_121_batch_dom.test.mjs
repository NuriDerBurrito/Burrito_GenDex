// 1.1.1 batch DOM + source checks — the dots, the two rows, and a lighter
// grid. The eleven fixes:
//   · THE CHIP'S SHRINK FLOOR + THE TWO-ROW HEADER ("when expanding the
//     output panel, the version emojie becomes so small again" + "lines,
//     parts, words and chars all should be moved to a new line, first line
//     should contain the two buttons and the name and version and the full
//     prompt label"): the expanded cover's header is a column now — row one
//     (label + split texts + CONTRACT/COPY), row two (the ledger) — and the
//     split chip carries min-width 96px so a squeeze ellipsizes its label
//     instead of crushing the glyph.
//   · THE RESTING ELLIPSIS ("the name in details pannel still doesnt show
//     the 3 dots when its cropped..."): the folded name wears the true
//     two-line clamp at rest; a hidden MEASUREMENT TWIN (unclamped, same
//     width) answers the overflow probe; the clamp lifts on expand and
//     re-lands when the retract settles.
//   · THE RETRACT-AWARE BACK ("clicking back while the output window is
//     expanded stretches it then it dissapears, fix that so it gets
//     retracted too"): closeViewToGrid raises a retract nonce, the cover
//     folds on the live tree, the view close follows a beat later.
//   · THE BADGE RIDES THE PLATE ("when hovering over card, the name covers
//     the version count"): the unfold leaf is a two-track grid — name,
//     badge, date — so the N VER stamp stays visible for the whole hover.
//   · THE COLOR GOVERNOR + THE TWO LANES ("fix the lag coming from the
//     color picker when i change color values in the settings"): the
//     picker's gestures report at most every ~40ms (last color wins,
//     pointer-up flushes the final word), and the theme apply splits into
//     cheap tokens (this frame) + a debounced heavy lane (textures +
//     snapshot, one rebuild per pause).
//   · THE REFLECTION RETIRED ("there is some weird grey shape on the glow
//     in the splash screen"): the mirrored mark is gone — node and rule.
//   · THE PREVIEW TIER ("card preview images would be a less quality
//     version... add an option in performance to disable that, and a
//     button to generate the thumbnails"): PREV files (~340px, soft encode,
//     PNG where alpha lives) ride the save pipeline, the records carry
//     `prev`, the cards read them only while the switch is on, and the
//     GENERATE key (Performance tab + titlebar) is idempotent.
//   · THE TOP BAR'S TWO KEYS ("one next to the save which would restart
//     the app... would warn the user if there is unsaved changes... and
//     the second button which will be on the right next to the switches"):
//     RESTART beside SAVE (confirm-gated), the THUMB key beside the
//     switches (lit while on, offers to turn on while off).
//   · THE ABOUT GLOW ("make the about glow slightly bigger"): -62% -> -72%.
//   · THE COVERED STATUS ("allow it to scroll left and right, ONLY IF THE
//     TEXT IS BEING COVERED"): the seat rides the row's leftover space, and
//     the marquee alternates direction when it arms.
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
  console.log('jsdom unavailable — 1.1.1 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the 1.1.1 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const appSrc = stripComments(src('src/App.jsx'));
  const cvSrc = stripComments(src('src/components/CharacterView.jsx'));
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const titleSrc = stripComments(src('src/components/Titlebar.jsx'));
  const statusSrc = stripComments(src('src/components/StatusText.jsx'));
  const cpSrc = stripComments(src('src/components/ColorPicker.jsx'));
  const themeSrc = stripComments(src('src/utils/theme.js'));
  const splashSrc = stripComments(src('src/components/Splash.jsx'));
  const helpersSrc = stripComments(src('src/utils/helpers.js'));
  const constsSrc = stripComments(src('src/constants/index.js'));
  const mainSrc = stripComments(src('src/main.js'));
  const preloadSrc = stripComments(src('src/preload.js'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));

  ok('1.1.1 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src("README.md"), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
  });

  // ---- fix 1 + 6: the chip's shrink floor + the two-row header ----
  ok('1.1.1 the split chip carries a SHRINK FLOOR (the glyph can never collapse)', () => {
    const floor = /\.gd-out-split\.gd-chip-flat\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    // 1.1.2 — the floor stopped INFLATING: min(96px, max-content) keeps the
    // squeeze protection while a narrow chip floors at its own content (a
    // bare 96px beat the max-width cap and widened 60px labels).
    assert.match(floor, /min-width: min\(96px, max-content\);/, 'the floor floors without inflating');
  });
  ok('1.1.1 the expanded header speaks in TWO rows (stats on their own line)', () => {
    /* the stripped view can mangle App.jsx's regex literals (the
       decodeResourceUrl lesson: a `/*` inside a regex swallows a county),
       so the ORDERING laws ride the raw source through indexOf. */
    const rawApp = src('src/App.jsx');
    const row1Idx = rawApp.indexOf('flex items-center gap-3 px-4 pt-3 pb-2"');
    const statsIdx = rawApp.indexOf('gd-output-full-stats');
    assert.ok(row1Idx >= 0, 'row one\'s seat exists');
    assert.ok(statsIdx > row1Idx, 'the stats row follows row one');
    assert.ok(statsIdx - row1Idx < 5000, 'close behind it (the header block, notes included)');
    // row one: label + split + keys, and NO wrap — read from the row to the
    // CONTRACT key (the keys end row one)
    const contractIdx = rawApp.indexOf('CONTRACT', row1Idx);
    assert.ok(contractIdx > row1Idx && contractIdx < statsIdx, 'the keys ride row one');
    assert.ok(rawApp.indexOf('FULL PROMPT', row1Idx) < contractIdx, 'the label leads row one');
    const row1 = rawApp.slice(row1Idx, contractIdx);
    assert.ok(!/flex-wrap/.test(row1), 'row one never wraps (the 0.40.6 ragged-wrap is dead)');
    const stats = /\.gd-output-full-stats\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(stats, 'the stats row has its own CSS seat');
    const statsBlock = /<div className="gd-output-full-stats">[\s\S]{0,700}?LINES/.exec(rawApp)?.[0] || '';
    assert.match(statsBlock, /PARTS · \{stats\.words\} WORDS · \{stats\.chars\} CHARS · \{stats\.lines\} LINES/, 'the ledger keeps its four counts, on their own line');
  });

  // ---- fix 2: the resting ellipsis + the measurement twin ----
  ok('1.1.1 the folded name wears the true clamp recipe at rest', () => {
    const clampRule = /\.gd-name-clamp\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(clampRule, /-webkit-line-clamp: 2;/, 'two lines');
    assert.match(clampRule, /-webkit-box-orient: vertical;/, 'vertical boxes');
    assert.match(clampRule, /overflow: hidden;/, 'the 119 law: the clamp is nothing without its overflow companion');
    assert.match(cvSrc, /nameClamped && 'gd-name-clamp'/, 'the class is CONDITIONAL on the settled state');
    assert.match(cvSrc, /const \[nameClamped, setNameClamped\] = useState\(true\)/, 'a fresh mount starts clamped (retracted by default)');
  });
  ok('1.1.1 the overflow probe reads the MEASUREMENT TWIN (never the clamped name)', () => {
    const probeRule = /\.gd-name-probe\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(probeRule, /visibility: hidden;/, 'the twin never paints');
    assert.match(probeRule, /position: absolute;/, 'the twin never takes flow');
    assert.match(cvSrc, /ref=\{nameMeasureRef\}/, 'the twin mounts with its own ref');
    // 1.1.2 — the twin's height still answers inside nameSignals
    // (twinSays), and the clamp's OWN CUT (scrollHeight past clientHeight —
    // the element painting the dots cannot lie) is the second voice: EITHER
    // arms the key. The old law ("never the clamped element") was about its
    // offsetHeight, which still never answers.
    // 1.2.9 re-law — THE TWIN SPEAKS LINE BOXES, NOT PIXELS: a display
  // face's glyphs overhang their line boxes by 1-2px per line, and the old
  // +2px pixel bar armed the key over two-line names with a hair of
  // overhang (the full-window report). A real third line adds a whole line
  // box; the verdict counts only when half a line of true content sits
  // below the two.
  assert.match(cvSrc, /const twinSays = probe\.offsetHeight > Math\.ceil\(lh \* 2\.5\);/, 'the twin still answers (in whole line boxes)');
    // 1.2.6 — the cut counts only when half a LINE of true content sits below
    // the clamp (a display face's glyph overhang measured 1-2px per line and
    // armed the expand key for names that fit).
    assert.match(cvSrc, /const clampCuts = clampedNow && el\.scrollHeight > el\.clientHeight \+ Math\.ceil\(lh \* 0\.5\);/, 'the clamp testifies too (in LINE BOXES, not pixels)');
    assert.match(cvSrc, /s\.twinSays \|\| s\.clampCuts/, 'either signal arms');
    assert.ok(!/nameRef\.current\.offsetHeight > Math\.ceil\(lh \* 2\)/.test(cvSrc), 'the REAL (clamped) element\'s offsetHeight still never answers');
  });
  ok('1.1.1 the dots lift on expand and re-land when the retract SETTLES', () => {
    assert.match(cvSrc, /if \(next\) setNameClamped\(false\)/, 'expanding lifts the clamp immediately');
    assert.match(cvSrc, /onAnimationComplete=\{\(\) => \{\s*foldFirstLandingRef\.current = false;\s*if \(!nameExpanded\) setNameClamped\(true\);\s*\}\}/, 'the retract landing re-arms the dots (1.3.9: the first-landing release rides the same completion)');
  });

  // ---- fix 3: the retract-aware back ----
  ok('1.1.1 the back is RETRACT-AWARE (two phases while the cover is expanded)', () => {
    assert.match(appSrc, /const closeViewToGrid = useCallback/, 'the close helper exists');
    assert.match(appSrc, /outputExpandedRef\.current[\s\S]{0,240}?setRetractRequest\(retractNonceRef\.current\)/, 'an expanded cover raises the retract nonce FIRST');
    assert.match(appSrc, /setTimeout\(\(\) => \{\s*retractTimerRef\.current = 0;\s*setView\(\{ mode: 'grid' \}\);\s*\}, 200\)/, 'the view close follows a beat later');
    assert.match(appSrc, /onBack=\{closeViewToGrid\}/, 'the BACK button rides the helper');
    assert.match(appSrc, /onPick: closeViewToGrid/, 'the context menu back rides it too');
    assert.match(appSrc, /retractRequest=\{retractRequest\}/, 'both bar mounts hear the nonce');
    assert.match(appSrc, /onExpandedChange=\{setOutputExpandedRef\}/, 'both bar mounts mirror their expanded truth');
    assert.match(appSrc, /useEffect\(\(\) => \{\s*if \(retractRequest\) setExpanded\(false\);\s*\}, \[retractRequest\]\)/, 'the bar folds its cover on the nonce');
  });

  // ---- fix 4: the badge rides the plate ---- RETIRED in 1.1.4 ----
  // (the plate itself retired — see the 120 batch's 1.1.4 note): the badge
  // now rides its OWN seat in the FOOT at the title's line height, so the
  // plate's badge copy left with the plate. These checks pin the new seat.
  ok('1.1.1 the badge rides its own seat — the plate (and its copy) retired in 1.1.4', () => {
    assert.ok(!/gd-name-unfold/.test(gridSrc), 'the plate (and its badge copy) no longer mounts');
    assert.match(gridSrc, /<span ref=\{versRef\} className="gd-card-vers"/, 'the foot renders its one badge');
    const hoverBadge = /\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers,[\s\S]{0,200}?\.gd-card-foot-vers\.has-vers:focus-within \.gd-card-vers\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(hoverBadge, /position: static;/, 'hover seats the badge in flow (never hidden)');
    assert.match(hoverBadge, /height: calc\(18\.75px \* var\(--card-scale, 1\)\);/, 'at the title line height — the date row never moves');
    const dateRule = /\.gd-card-meta-line\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(dateRule, /grid-column: 1 \/ -1;/, 'the date spans the full width below, both states');
  });

  // ---- fix 5: the color governor + the two lanes ----
  ok('1.1.1 the picker\'s gesture is GOVERNED (at most every ~40ms, last color wins)', () => {
    assert.match(cpSrc, /const emitAtMostEveryMs = 40;/, 'the window is 40ms');
    assert.match(cpSrc, /const emitGoverned = useCallback/, 'the governed emitter exists');
    assert.match(cpSrc, /emitGoverned\(hsvToHex\(next\.h, next\.s, next\.v\)\)/, 'the drags speak through it');
    assert.ok(!/emit\(hsvToHex/.test(cpSrc), 'no unthrottled drag emit survives');
    assert.match(cpSrc, /const flushPending = \(\) => \{/, 'the flush exists');
    // 1.1.2 — the release also COMMITs through the new lane (preview during
    // the drag, one write on release — see ColorPicker's onCommit note).
    assert.match(cpSrc, /onPointerUp: \(e\) => \{\s*handlers\.onPointerUp\?\.\(e\);\s*flushPending\(\);\s*onCommit\?\.\(lastEmitted\.current\);\s*\},/, 'pointer-up lands the last word AND commits it');
  });
  ok('1.1.1 the theme apply is SPLIT INTO TWO LANES (cheap now, heavy debounced)', () => {
    assert.match(themeSrc, /function applyThemeTokens\(/, 'the cheap lane exists');
    assert.match(themeSrc, /function applyThemeHeavy\(/, 'the heavy lane exists');
    assert.match(themeSrc, /export function setThemeOnDocumentLive\(/, 'the live form exists');
    assert.match(themeSrc, /heavyTimer = setTimeout\(run, 130\)/, 'the heavy lane trails by 130ms');
    assert.match(themeSrc, /export function setThemeOnDocument\([\s\S]{0,140}?applyThemeTokens\([\s\S]{0,80}?applyThemeHeavy\(/, 'the boot path stays synchronous (both lanes, no debounce)');
    assert.match(appSrc, /setThemeOnDocumentLive\(themeId/, 'the App theme effect drives the live form');
    assert.ok(!/setThemeOnDocument\(themeId/.test(appSrc), 'the live effect never calls the synchronous form');
  });

  // ---- fix 7: the reflection retired ----
  ok('1.1.1 the splash reflection is RETIRED (the grey shape on the glow)', () => {
    assert.ok(!/gd-splash-reflect/.test(splashSrc), 'no reflect node in the splash');
    assert.ok(!/\.gd-splash-reflect\s*\{/.test(codeCss), 'no reflect rule in the CSS');
    // the retirement note rides a COMMENT — read the raw source (comments survive there)
    assert.match(src('src/components/Splash.jsx'), /THE REFLECTION IS RETIRED/, 'the retirement note rides the mark\'s stage');
    // 1.1.8 — the halo itself retired with the splash glow ("remove glow
    // from the splash screen"): no rule, no node, nothing pools anywhere.
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: the splash halo rule is gone with the glow');
  });

  // ---- fix 8: the preview tier ----
  ok('1.3.2 the PREVIEW TIER rides the pipeline with the SYSTEM retired (records, cards, auto-build)', () => {
    // 1.3.2 — the switch, the GENERATE key and the erase key are GONE; the
    // tiers build automatically at import, always, and every cover reads
    // the record's lightest tier.
    assert.ok(!/cardThumbs:\s*true/.test(constsSrc), '1.3.2: DEFAULT_SETTINGS ships NO cardThumbs switch');
    assert.ok(!/autoPreviews:\s*true/.test(constsSrc), '1.3.2: DEFAULT_SETTINGS ships NO autoPreviews switch');
    assert.ok(!/rawSettings\.cardThumbs/.test(helpersSrc), 'the sanitizer drops the dead cardThumbs key');
    assert.ok(!/rawSettings\.autoPreviews/.test(helpersSrc), 'the sanitizer drops the dead autoPreviews key');
    assert.match(helpersSrc, /prev: img\?\.prev \? String\(img\.prev\) : null/, 'sanitizeImage carries the prev field');
    /* helpers.js carries the decodeResourceUrl regex literal — the comment
       stripper eats a county from there on, so the record-shape law reads
       the RAW source. */
    assert.match(src('src/utils/helpers.js'), /export const imageRecord = \(rec\) => \(\{/, 'the one true record shape exists');
    assert.match(gridSrc, /const coverSrc = coverImage\?\.prev \? coverImage\.prev : thumbOf\(coverImage\)/, 'the card reads the lightest tier, always');
    assert.ok(!/cardThumbs/.test(gridSrc), 'the cover knows no switch anymore');
    assert.match(mainSrc, /const PREV_WIDTH = 340;/, 'main builds 340px prevs');
    assert.match(mainSrc, /const PREV_JPEG_QUALITY = 68;/, 'softly encoded');
    assert.match(mainSrc, /const writePrev = \(name, buffer, ext\) => \{/, 'the builder exists');
    assert.ok(!/ipcMain\.handle\('image:generate-previews'/.test(mainSrc), '1.3.2: the generator IPC is gone');
    assert.ok(!/ipcMain\.handle\('image:erase-previews'/.test(mainSrc), '1.3.2: the erase IPC is gone');
    assert.ok(!/autoPreviewsOn/.test(mainSrc), 'the auto-off gate is gone: the tiers ALWAYS build');
    assert.ok(!/generatePreviews/.test(preloadSrc), 'the bridge exposes no generator');
    assert.ok(!/onPreviewProgress/.test(preloadSrc), 'no progress stream');
    assert.ok(!/const generatePreviews = useCallback/.test(appSrc), 'App owns no generate flow');
    assert.ok(!/'gen:prevs'/.test(appSrc), 'no record patch to coalesce');
  });
  ok('1.1.1 the delete cleanup walks the PREV flavors with the thumbs', () => {
    assert.match(mainSrc, /`\$\{base\}_prev\.jpg`,\s*`\$\{base\}_prev\.png`,/, 'both prev candidates ride image:delete');
  });

  // ---- fix 9: the about glow ----
  ok('1.1.1 the about glow is slightly bigger', () => {
    const glowRule = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(glowRule, /inset: -72%;/, '-62% grew to -72%');
  });

  // ---- fix 10: the top bar's two keys ----
  ok('1.1.1 the RESTART key rides the history group beside SAVE', () => {
    assert.match(titleSrc, /onRestart = null,/, 'the prop is accepted');
    assert.match(titleSrc, /<RotateCcw size=\{13\} \/>/, 'the icon is a restart arrow');
    const restartBlock = /\{onRestart && \([\s\S]{0,340}?<\/button>\s*\)\}/.exec(titleSrc)?.[0] || '';
    assert.ok(/Restart the app/.test(restartBlock), 'the tooltip speaks the restart');
    assert.match(appSrc, /const restartApp = useCallback/, 'App owns the confirm');
    assert.match(appSrc, /onConfirm: \(\) => window\.location\.reload\(\)/, 'the confirm reloads');
    assert.match(appSrc, /RESTART ANYWAY/, 'unsaved work gets the warning');
    assert.match(appSrc, /onRestart=\{restartApp\}/, 'the titlebar hears it');
  });
  ok('1.3.2 the THUMB key is retired with the preview system', () => {
    assert.ok(!/thumbsOn/.test(titleSrc), 'the prop is gone');
    assert.ok(!/onGenerateThumbs/.test(titleSrc), 'the handler prop is gone');
    assert.ok(!/\bImages\b/.test(titleSrc), 'no images-mark key anywhere in the bar');
    assert.ok(!/askGeneratePreviews/.test(appSrc), 'App owns no off-state prompt');
    assert.ok(!/TURN ON PREVIEW THUMBNAILS\?/.test(appSrc), 'the prompt is gone');
  });

  // ---- fix 11: the covered status scrolls both ways ----
  ok('1.1.1 the status seat rides the row\'s leftover space (covered only when encroached)', () => {
    assert.match(statusSrc, /flex-1 min-w-0 max-w-\[560px\]/, 'no fixed 280px cap anymore');
    assert.ok(!/max-w-\[280px\]/.test(statusSrc), 'the old seat is gone');
    const marqueeRule = /\.gd-marquee\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(marqueeRule, /alternate/, 'the flight alternates (left AND right)');
    assert.match(statusSrc, /new ResizeObserver\(\(\) => measure\(\)\)/, 'the measurement follows the box\'s own resize');
  });

  // ---- the Performance tab speaks the tier ----
  ok('1.3.2 the Performance tab carries NEITHER preview switch NOR generate key', () => {
    assert.ok(!/title="CARD PREVIEW THUMBNAILS"/.test(settingsSrc), 'the option card is gone');
    assert.ok(!/title="AUTO PREVIEW GENERATION"/.test(settingsSrc), 'the auto switch is gone');
    assert.ok(!/GENERATE PREVIEWS/.test(settingsSrc), 'the generate key is gone');
    assert.ok(!/onGeneratePreviews/.test(settingsSrc), 'the prop is gone');
    assert.ok(!/onErasePreviews/.test(settingsSrc), 'the erase prop is gone with the key');
    assert.ok(!/title="ERASE PREVIEW THUMBNAILS"/.test(settingsSrc), 'the erase card is gone');
    assert.ok(!/onGeneratePreviews=\{generatePreviews\}/.test(appSrc), 'the modal hears no flow');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  const makeApi = (over = {}) => {
    const calls = { generate: [] };
    const api = {
      loadDB: async () => ({
        db: {
          settings: {
            theme: 'burrito', colors: {}, zoom: 2, defaultSortMode: 'custom',
            textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'confetti', panel: 'grid' },
            detailPanel: true, promptBottom: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
            autoSwipeImages: true, ...over.settings,
          },
          classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
          tags: [], stamps: [],
          characters: [
            {
              id: 'c1', name: 'amy the amber archer of the long autumn woods', classId: 'cl1', tags: [], previewVersionId: null,
              cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
              stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
              createdAt: Date.now(),
              versions: [
                {
                  id: 'v1', label: 'V1', color: '#c8402f', icon: 'letter:A',
                  images: [{ file: 'a.png', thumb: 'a_t.jpg', prev: 'a_p.jpg' }],
                  parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
                  notes: 'first pass', createdAt: 1,
                },
              ],
            },
          ],
        },
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
        return { prevs: { b: 'b_p.jpg' }, generated: 1, skipped: 0, failed: 0 };
      },
      onPreviewProgress: () => () => {},
    };
    api.__calls = calls;
    return api;
  };

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  // GdTooltips never mounts in the test DOM (it lives outside App's root),
  // so titles are NOT lifted onto data-gd-tip-src here — read whichever seat
  // a key actually carries.
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

  await okAsync('1.1.1 the expanded cover speaks in two rows + the chip keeps its floor (live)', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    assert.ok(card, 'the card mounted');
    click(card);
    await sleep(400);
    const bar = document.querySelector('.gd-output-bar');
    assert.ok(bar, 'the bar mounted under the open card');
    const expand = [...bar.querySelectorAll('button')].find((b) => /EXPAND/.test(b.textContent || ''));
    assert.ok(expand, 'the EXPAND key found');
    click(expand);
    await sleep(300);
    const cover = document.querySelector('.gd-output-full');
    assert.ok(cover, 'the expanded cover mounted');
    // row one: label + split + keys, no wrap
    const rows = [...cover.children].filter((c) => c.tagName === 'DIV');
    const row1 = rows[0];
    assert.ok(row1 && /FULL PROMPT/.test(row1.textContent || ''), 'row one carries the FULL PROMPT label');
    assert.ok(row1 && /CONTRACT/.test(row1.textContent || '') && /COPY/.test(row1.textContent || ''), 'row one carries both keys');
    const chip = cover.querySelector('.gd-chip.gd-chip-flat');
    assert.ok(chip, 'the version chip mounted');
    // row two: the ledger alone
    const stats = cover.querySelector('.gd-output-full-stats');
    assert.ok(stats, 'the ledger owns its own row');
    assert.ok(/PARTS/.test(stats.textContent || '') && /LINES/.test(stats.textContent || ''), 'all four counts ride it');
    assert.ok(stats.compareDocumentPosition(row1) & dom.window.Node.DOCUMENT_POSITION_PRECEDING, 'the ledger sits below row one');
    // the chip keeps its class seat (the floor is CSS — jsdom measures no layout)
    assert.match(chip.className || '', /gd-out-split gd-chip gd-chip-flat/, 'the twin seat survives');
    root.unmount();
    host.remove();
  });

  await okAsync('1.1.1 the folded name wears its dots at rest, lifts them on expand, re-lands on retract (live)', async () => {
    let host;
    let root;
    // jsdom reads no layout — arm the expand key by lying about the twin's
    // height (the probe class is the only element the override answers for)
    const proto = dom.window.HTMLElement.prototype;
    const elemProto = dom.window.Element.prototype;
    const wasOwn = Object.prototype.hasOwnProperty.call(proto, 'offsetHeight');
    const desc = wasOwn ? Object.getOwnPropertyDescriptor(proto, 'offsetHeight') : Object.getOwnPropertyDescriptor(elemProto, 'offsetHeight');
    Object.defineProperty(proto, 'offsetHeight', {
      configurable: true,
      get() { return this.classList && this.classList.contains('gd-name-probe') ? 400 : desc.get.call(this); },
    });
    const restore = () => {
      if (wasOwn) Object.defineProperty(proto, 'offsetHeight', desc);
      else delete proto.offsetHeight;
    };
    try {
      // boot with the lie already installed: the panel's layout effect arms
      // the expand key at mount (no remount dance needed)
      ({ host, root } = await boot(makeApi()));
      const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
      click(card);
      await sleep(600);
      const panel = host.ownerDocument.querySelector('[data-gd-region="panel"]');
      assert.ok(panel, 'the detail panel mounted');
      const twin = panel.querySelector('.gd-name-probe');
      const real = panel.querySelector('.gd-name-fold > div');
      assert.ok(twin, 'the measurement twin mounted');
      assert.ok(real, 'the real name mounted');
      assert.match(real.className || '', /gd-name-clamp/, 'the name starts CLAMPED (the resting dots)');
      const key = [...panel.querySelectorAll('button')].find((b) => /expand the rest of the card name/i.test(tip(b)));
      assert.ok(key, 'the expand key ARMED (the twin answered the overflow question)');
      click(key);
      await sleep(100);
      const realExpanded = panel.querySelector('.gd-name-fold > div');
      assert.ok(!/gd-name-clamp/.test(realExpanded.className || ''), 'expanding LIFTED the clamp (the name reveals)');
      const retractKey = [...panel.querySelectorAll('button')].find((b) => /retract the card name/i.test(tip(b)));
      assert.ok(retractKey, 'the retract key took the seat');
      click(retractKey);
      await sleep(800); // the 0.24s tween + settle
      const realRetracted = panel.querySelector('.gd-name-fold > div');
      assert.match(realRetracted.className || '', /gd-name-clamp/, 'the retract SETTLED back onto the dots');
    } finally {
      restore();
      if (root) root.unmount();
      if (host) host.remove();
    }
  });

  await okAsync('1.3.2 the top bar carries RESTART and NO thumb key (live)', async () => {
    const api = makeApi();
    const { host, root } = await boot(api);
    try {
      const bar = host.ownerDocument.querySelector('.gd-titlebar');
      assert.ok(bar, 'the titlebar mounted');
      const history = bar.querySelector('.gd-history-group');
      assert.ok(history, 'the history group mounted');
      const restart = [...history.querySelectorAll('button')].find((b) => /restart/i.test(tip(b)));
      assert.ok(restart, 'the RESTART key rides the history group');
      assert.ok(/SAVE/.test((restart.previousElementSibling?.textContent) || ''), 'right after SAVE');
      const thumbs = [...bar.querySelectorAll('button')].find((b) => /preview thumbnail|generate preview/i.test(tip(b)));
      assert.ok(!thumbs, '1.3.2: the THUMB key is retired with the preview system');
      assert.equal(api.__calls.generate.length, 0, 'nothing ever generates on demand');
    } finally {
      root.unmount();
      host.remove();
    }
  });

  await okAsync('1.3.2 the card cover seats on the PREV always (the switch is retired) (live)', async () => {
    // 1.3.2 — there is no switch: the cover reads the record's lightest
    // tier (the prev when the record owns one), and a dead cardThumbs key
    // in an old database changes nothing.
    const a = makeApi();
    const { host, root } = await boot(a);
    const coverOn = host.ownerDocument.querySelector('[data-gd-char-id="c1"] img');
    assert.ok(coverOn, 'the card art mounted');
    assert.match(decodeURIComponent(coverOn.getAttribute('src') || ''), /a_p\.jpg/, 'the PREV seats the art');
    root.unmount();
    host.remove();
    const b = makeApi({ settings: { cardThumbs: false } });
    const { host: h2, root: r2 } = await boot(b);
    const coverOff = h2.ownerDocument.querySelector('[data-gd-char-id="c1"] img');
    assert.ok(coverOff, 'the card art mounted again');
    assert.match(decodeURIComponent(coverOff.getAttribute('src') || ''), /a_p\.jpg/, 'a dead cardThumbs key changes nothing: the PREV still seats the art');
    r2.unmount();
    h2.remove();
  });

  await okAsync('1.1.1 the badge keeps its own seat without any plate (live)', async () => {
    // 1.1.4 — the plate retired; even a title that MEASURES cropped (same
    // jsdom lie as 120) must mount nothing — the badge lives in the foot,
    // the date keeps its row, the cropped title keeps its dots.
    const proto = dom.window.HTMLElement.prototype;
    const elemProto = dom.window.Element.prototype;
    const wasOwnSW = Object.prototype.hasOwnProperty.call(proto, 'scrollWidth');
    const wasOwnCW = Object.prototype.hasOwnProperty.call(proto, 'clientWidth');
    const swDesc = wasOwnSW ? Object.getOwnPropertyDescriptor(proto, 'scrollWidth') : Object.getOwnPropertyDescriptor(elemProto, 'scrollWidth');
    const cwDesc = wasOwnCW ? Object.getOwnPropertyDescriptor(proto, 'clientWidth') : Object.getOwnPropertyDescriptor(elemProto, 'clientWidth');
    Object.defineProperty(proto, 'scrollWidth', {
      configurable: true,
      get() { return this.classList && this.classList.contains('gd-card-title') ? 500 : swDesc.get.call(this); },
    });
    Object.defineProperty(proto, 'clientWidth', {
      configurable: true,
      get() { return this.classList && this.classList.contains('gd-card-title') ? 131 : cwDesc.get.call(this); },
    });
    const restore = () => {
      if (wasOwnSW) Object.defineProperty(proto, 'scrollWidth', swDesc);
      else delete proto.scrollWidth;
      if (wasOwnCW) Object.defineProperty(proto, 'clientWidth', cwDesc);
      else delete proto.clientWidth;
    };
    let host;
    let root;
    try {
      ({ host, root } = await boot(makeApi()));
      const c1 = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
      assert.ok(c1, 'the long-name card mounted');
      assert.ok(!c1.querySelector('.gd-name-unfold'), '1.1.4: no plate mounts, cropped or not');
      const badge = c1.querySelector('.gd-card-foot-vers > .gd-card-vers');
      assert.ok(badge, 'the foot carries its one badge');
      assert.match(badge.textContent || '', /1 VER/, 'it speaks the count');
      const title = c1.querySelector('.gd-card-title');
      assert.ok(title && /truncate/.test(title.className || ''), 'the cropped title keeps its own dots');
      const date = c1.querySelector('.gd-card-foot-vers > .gd-card-meta-line');
      assert.ok(date, 'the date still rides its own row beneath');
    } finally {
      restore();
      if (root) root.unmount();
      if (host) host.remove();
    }
  });
}

console.log(`\n1.1.1 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed > 0) process.exit(1);
