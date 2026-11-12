// 1.0.6 batch DOM + source checks — edges that dissolve, windows that ask.
// Nine fixes:
//   · THE × MOVED INTO THE FIELD'S OWN SEAT ("the x in the search should not
//     take extra space, it should take part of the already existing space
//     instead"): no clearable padding class/rule survives; the key rides the
//     field's own right padding zone (right: 2px), text scrolls under it.
//   · THE CREATION LABEL IS CAPPED + THE PREVIEWS KEEP THEIR SEATS ("version
//     character limit should apply on the card creation first version, also
//     fix the issue where the preview clips out of the window"): the FIRST
//     VERSION label wears maxLength 35; the preview chips (creation + version
//     windows) are min-w-0 with capped, ellipsizing labels.
//   · THE CAP SPEAKS AND CANNOT BE BYPASSED ("show feedback about the
//     character limit, like current / max, and clipboard paste should not
//     bypass it"): every capped field carries a current/max counter (accent
//     at full); the beforeinput guard reads paste/drop payloads from
//     e.dataTransfer; a MODEL-LEVEL net trims any overflow path back to the
//     cap (it only ever shrinks).
//   · THE SELECTED VERSION WEARS ITS WHOLE NAME ("when version is selected it
//     shows full name, if not then it shows only part of it"): resting strip
//     chips ellipsize at the cap; the active chip shows everything.
//   · THE GLOW'S EDGE DISSOLVES ("the glow in splash screen and in about
//     section has an outline that is visible, aka the edge is visible, fix
//     that so it fades properly and dont have it as a simple one"): three
//     eased fields per halo, every one reaching EXACT ZERO well inside the
//     circle's border — no ring where the light stops.
//   · WINDOWS ASK BEFORE THROWING WORK AWAY ("closing a window with unsaved
//     changes should warn about it and when its confirmed to close it
//     shouldnt apply said changes"): Modal's confirmClose guard routes the
//     accidental gestures (✕ / Escape / backdrop) through an ask; confirming
//     closes WITHOUT applying. Wired: tag manager, version settings, new
//     card, class editor, edit card. Labeled footer keys stay direct.
//   · THE OUTPUT BAR SPEAKS IN PARTS ("composed output should only show part
//     of the name … enough so it doesnt clip the rest outside of it"): name
//     and version chip truncate; EXPAND / COPY keep their seats.
//   · A CARD OPENS ON ITS FACE ("fix the issue where opening a card always
//     opens on the first version instead of the top version"): the open seats
//     the selection on getPreviewVersion's answer (cover, else newest).
//   · THE SOLID KEYS HOVER LIKE THEMSELVES ("change how the buttons … hover
//     shape looks since it feels not aligning with the base version"): the
//     solid hover keeps its accent border and hard offset shadow (deepening
//     one step) instead of inheriting the base key's construction.
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
  console.log('jsdom unavailable — 1.0.6 batch DOM test skipped (dev-only dependency)');
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
// strip comments — the history notes name retired identifiers; the
// assertions read the CODE only.
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
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// Part A — source checks for the 1.0.6 wave
// ===========================================================================
{
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const richSrc = stripComments(src('src/components/RichText.jsx'));
  const modalSrc = stripComments(src('src/components/Modal.jsx'));
  const tagSrc = stripComments(src('src/components/TagManagerModal.jsx'));
  const verSrc = stripComments(src('src/components/VersionSettingsModal.jsx'));
  const newSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const classSrc = stripComments(src('src/components/ClassSidebar.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const appSrc = stripComments(src('src/App.jsx'));
  const codeCss = stripComments(css);

  ok('1.0.6 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src("README.md"), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.6 /m);
  });

  // ---- fix 1: the × rides the field's own seat ----
  ok('1.0.6 the × takes part of the already existing space', () => {
    assert.ok(!/gd-input-clearable/.test(gridSrc), 'the field never wears the clearable pad class');
    assert.ok(!/\.gd-input\.gd-input-clearable\s*\{[^}]*\}/.test(codeCss), 'the clearable padding rule is retired');
    const keyRule = /\.gd-search-clear\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(keyRule, /position: absolute;/, 'the key still rides the field');
    // 1.0.7 — the key stepped off the border ("move it to the left slightly
    // so it doesnt hug the right border"): 5px, still inside the field's
    // own padding zone (the in-seat law holds).
    // 1.0.9 — the key rides at 8px now ("move the search x slightly to the
    // left"), still inside the field's own padding zone.
    assert.match(keyRule, /right: 8px;/, 'it sits inside the field\'s own padding zone, off the border (8px, 1.0.9)');
    assert.match(gridSrc, /className="gd-search-clear"/, 'the × key itself still exists');
    // 1.0.8 — THE GLYPHS CUT BEFORE THE × ("text clips into the x in search
    // container, fix that so it doesnt and cuts before it"): the input's
    // class list became a clsx call carrying the conditional gd-input-has-x
    // seat (26px of right padding while the key is mounted).
    assert.match(gridSrc, /clsx\('gd-input gd-input-icon gd-input-solid w-60', search && 'gd-input-has-x'\)/, 'the input keeps its class list and gains the conditional × seat (1.0.8)');
  });

  // ---- fixes 2 + 3: the cap hardens, speaks, and the previews keep their seats ----
  ok('1.0.6 the creation label is capped; the previews keep their seats', () => {
    // the FIRST VERSION label in creation carries the 35 cap
    assert.match(newSrc, /maxLength=\{35\}/, 'the creation window\'s first-version label is capped');
    // both preview chips are min-w-0 with capped labels (no more clipping out)
    // 1.0.7 — the preview chip also stands STRAIGHT (the version-label law).
    assert.match(newSrc, /gd-chip gd-chip-flat min-w-0/, 'the creation preview chip is min-w-0 (and flat)');
    assert.match(newSrc, /gd-chip-label-cap/, 'its label ellipsizes at the cap');
    assert.match(verSrc, /gd-chip gd-chip-flat min-w-0/, 'the version window\'s preview chip is min-w-0 (and flat, 1.0.7)');
    assert.match(verSrc, /gd-chip-label-cap/, 'its label ellipsizes at the cap');
    // the cap class itself exists with the right construction
    const capRule = /\.gd-chip-label-cap\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(capRule, /max-width: 132px;/, 'the label cap exists');
    assert.match(capRule, /text-overflow: ellipsis;/, 'it ellipsizes');
    assert.match(capRule, /overflow: hidden;/, 'it clips its own overflow');
  });

  ok('1.0.6 the cap speaks (current / max) and cannot be bypassed', () => {
    // the counter row renders on every capped field
    assert.match(richSrc, /gd-rt-count-row/, 'the counter row exists');
    assert.match(richSrc, /gd-rt-count/, 'the counter exists');
    assert.match(richSrc, /\{plain\.length\}\/\{maxLength\}/, 'it speaks current/max');
    assert.match(richSrc, /atCap && 'is-max'/, 'it turns accent at full');
    const countRule = /\.gd-rt-count\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(countRule, /font-variant-numeric: tabular-nums;/, 'the digits are tabular');
    const maxRule = /\.gd-rt-count\.is-max\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(maxRule, /color: var\(--gd-accent\);/, 'full reads accent');
    // the paste/drop payloads ride e.dataTransfer — the guard reads them now
    assert.match(richSrc, /insertedTextOf/, 'the guard resolves the inserted text');
    assert.match(richSrc, /e\.dataTransfer\?\.getData\('text\/plain'\)/, 'paste/drop payloads are read from the transfer');
    // the MODEL-LEVEL net: any overflow path trims the value itself
    assert.match(richSrc, /plain\.length <= maxLength/, 'the net watches the model');
    assert.match(richSrc, /plain\.slice\(0, maxLength\)/, 'the net trims to the cap');
    assert.match(richSrc, /onChange\(serializeRichText\(nextPlain, nextRanges\)\)/, 'the trimmed value is pushed through onChange');
  });

  // ---- fix 4: the selected version wears its whole name ----
  ok('1.0.6 the selected chip shows the full name; the resting ones speak in parts', () => {
    assert.match(viewSrc, /className=\{active \? undefined : 'gd-chip-label-cap'\}/, 'only the ACTIVE chip escapes the cap');
  });

  // ---- fix 5: the glow's edge dissolves ----
  ok('1.0.6 the glow fades to nothing before its border — no visible edge', () => {
    const aboutGlow = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok((aboutGlow.match(/radial-gradient/g) || []).length >= 3, 'About: three eased fields stack');
    // 1.0.7 — the stops speak the theme's accent pair through color-mix and
    // end at `transparent` (same exact-zero law, whatever the hue).
    assert.match(aboutGlow, /color-mix\(in srgb, var\(--gd-accent, #4ade80\) 30%, transparent\) 0%/, 'the core speaks the theme accent');
    assert.match(aboutGlow, /transparent 42%/, 'the core field reaches exact zero by 42%');
    assert.match(aboutGlow, /transparent 56%/, 'the wide field reaches exact zero by 56%');
    assert.match(aboutGlow, /transparent 64%/, 'the far base reaches exact zero by 64% (the border draws nothing)');
    /* 1.1.1 — the halo grew slightly ("make the about glow slightly bigger"). */
    assert.match(aboutGlow, /inset: -72%;/, 'the spread stays wide');
    /* 1.1.8 — the splash halo retired with the glow ("remove glow from the
       splash screen"); the About glow above keeps every zero-stop law. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: no splash halo rule survives');
    assert.ok(!/@keyframes gd-splash-swell/.test(codeCss), 'the swell keyframes retired with it');
    const breathe = /@keyframes gd-splash-breathe\s*\{[\s\S]*?\n\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/transform|filter|width|height|left|top/.test(breathe), 'the surviving breathe (progress-bar fallback) is opacity-only');
  });

  // ---- fix 6: windows ask before throwing work away ----
  ok('1.0.6 the unsaved-changes guard exists and routes the accidental gestures', () => {
    // the Modal itself carries the ask
    assert.match(modalSrc, /confirmClose = null/, 'the guard is opt-in per window');
    assert.match(modalSrc, /const requestClose = \(\) => \{/, 'the accidental gestures route through one door');
    assert.match(modalSrc, /setAskOpen\(true\)/, 'a pending draft opens the ask instead of closing');
    assert.match(modalSrc, /KEEP EDITING/, 'the ask offers KEEP EDITING');
    /* 1.3.0 — the em-dash sweep: the ask's key reads CLOSE: DISCARD. */
    assert.match(modalSrc, /CLOSE: DISCARD/, 'the ask offers CLOSE: DISCARD');
    assert.match(modalSrc, /confirmDiscard = \(\) => \{[\s\S]*?onClose\?\.\(\);/, 'confirming closes WITHOUT applying anything');
    // the five draft windows wired in
    assert.match(tagSrc, /pendingDraft/, 'the tag manager guards its editor draft');
    assert.match(tagSrc, /onClose=\{closeManager\}/, 'its window close no longer silently commits');
    assert.match(verSrc, /guardClose/, 'the version window guards its draft');
    assert.match(newSrc, /draftStarted/, 'the creation window guards its draft');
    assert.match(classSrc, /classDraftPending/, 'the class editor guards its draft');
    assert.match(viewSrc, /lookDirty/, 'the edit-card window guards its look draft');
    // the ask layer paints inside the modal's own portal (never clipped)
    assert.match(modalSrc, /gd-modal-ask/, 'the ask is its own card');
    assert.match(modalSrc, /aria-label=\{askCfg\.title \|\| 'UNSAVED CHANGES'\}/, 'it announces itself');
  });

  // ---- fix 7: the output bar speaks in parts ----
  ok('1.0.6 the composed-output bar truncates its texts, never its keys', () => {
    // 1.0.8 — the header grew (the version's own face + the name marks),
    // so the window widens to keep the whole bar in view.
    const barBlock = /className="gd-output-bar flex-shrink-0"[\s\S]{0,8400}?<\/motion\.div>/.exec(appSrc)?.[0] || '';
    assert.ok(barBlock, 'the bar node exists');
    // 1.0.7 — the texts are the REAL texts ("ensure that in bottom output
    // panel that the version would be accurate in name, with text formats
    // and emojies included"): the name and the version label render through
    // RichText (formats + emojis), still capped and titled — and the chip
    // stands flat like every version label. 1.0.8 — the name span grew the
    // data-gd-tip-name mark between its title and its seat, so the pin
    // follows the mark instead of the old adjacency.
    assert.match(barBlock, /title=\{stripRichText\(character\.name\)\}[\s\S]{0,220}?<RichText text=\{character\.name\}\s*\/>/, 'the name truncates, its real self inside (name-marked, 1.0.8)');
    // 1.0.9 — the chip's seat is the 50/50 split class now ("50% for the
    // card, 50% for the tag…"): gd-out-split carries the shrink law the old
    // min-w-0 spoke. 1.1.0 — THE TWIN LAW ("the output panel version emojie
    // is smaller than the normal version emojie"): the slimming classes
    // (!py-0.5 !px-2 + the outranked text-[10px]) are retired — the bar's
    // chip wears the strip chip's exact geometry.
    assert.match(barBlock, /className="gd-out-split gd-chip gd-chip-flat"/, 'the version chip is the strip chip\'s exact twin (flat, split-seated, unslimmed — 1.1.0)');
    assert.ok(!/gd-chip-flat !py-0\.5/.test(barBlock), 'no slimming seat left on the chip (1.1.0)');
    assert.match(barBlock, /<RichText text=\{version\.label\} className="gd-chip-label-cap" \/>/, 'the version label renders rich at the cap');
    assert.match(barBlock, /EXPAND/, 'the EXPAND key survives');
    assert.match(barBlock, /COPY/, 'the COPY key survives');
  });

  // ---- fix 8: a card opens on its face ----
  ok('1.0.6 opening a card seats the selection on its face (the cover / newest)', () => {
    assert.match(viewSrc, /setSelectedVersionId\(previewVersion\?\.id \?\? character\?\.versions\?\.\[0\]\?\.id \?\? null\)/, 'the open follows getPreviewVersion\'s answer');
  });

  // ---- fix 9: the solid keys hover like themselves ----
  ok('1.0.6 the solid key\'s hover keeps its own construction', () => {
    const hoverRule = /\.gd-btn-solid:hover\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(hoverRule, 'the solid hover rule exists');
    assert.match(hoverRule, /border-color: var\(--gd-accent\);/, 'the border STAYS accent (no ink flip)');
    assert.match(hoverRule, /box-shadow: 3px 3px 0/, 'the shadow stays a hard offset, one step deeper');
    assert.match(hoverRule, /filter: brightness\(1\.07\);/, 'the face still brightens');
    // the base key's hover construction is NOT what the solid key wears
    const baseHover = /\.gd-btn:hover\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(baseHover, /box-shadow: 0 2\.5px 0/, 'the base key keeps its own soft shadow (the two families parted)');
  });
}

// ===========================================================================
// Part B — live DOM: the asking windows, the counting field, the face-first open
// ===========================================================================
{
  const mkChar = (id, name, classId, versions, previewVersionId = null) => ({
    id, name, classId, tags: [], previewVersionId,
    cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
    stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
    createdAt: Date.now(),
    versions,
  });
  const mkVer = (id, label, createdAt, extra = {}) => ({
    id, label, color: null, icon: null,
    images: [{ file: `${id}.png` }],
    parts: [{ id: `${id}-p1`, name: 'body', content: `${id} shading`, include: true }],
    notes: '', createdAt, ...extra,
  });

  const makeApi = (over = {}) => ({
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
          autoSwipeImages: false, ...over.settings,
        },
        classes: [
          { id: 'cl1', name: 'heroes', parentId: 'root', order: 1 },
          { id: 'cl2', name: 'villains', parentId: 'root', order: 2 },
        ],
        tags: [{ id: 't1', name: 'green', color: '#7ecb8f', icon: null, trim: 'straight' }],
        stamps: [],
        characters: over.characters || [
          mkChar('c1', 'amy the amber archer', 'cl1', [mkVer('v1', 'V1', 1)]),
          mkChar('c2', 'bruno the brutal baron', 'cl2', [mkVer('v2', 'V1', 1)]),
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
  });

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const rclick = (el) => el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
  const pressEscape = () => window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
  const searchInput = () => [...document.querySelectorAll('input')].find((i) => /Search/i.test(i.placeholder || ''));
  const typeSearch = async (text) => {
    const input = searchInput();
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, text);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
  };
  const askLayer = () => document.querySelector('[aria-label="UNSAVED CHANGES"]');
  const askBtn = (re) =>
    [...(askLayer()?.querySelectorAll('button') || [])].find((b) => re.test(b.textContent || ''));

  const boot = async (api) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400); // splash timeline
    return { host, root };
  };

  await okAsync('1.0.6 the × rides the field\'s own seat — no padding class ever lands', async () => {
    const { host, root } = await boot(makeApi());
    assert.ok(!document.querySelector('.gd-search-clear'), 'no × while the field is empty');
    await typeSearch('bru');
    const input = searchInput();
    const x = document.querySelector('.gd-search-clear');
    assert.ok(x, 'the × appears with text');
    assert.ok(!/gd-input-clearable/.test(input.className), 'the field wears NO extra padding class while it carries text');
    click(x);
    await sleep(80);
    assert.equal(searchInput().value, '', 'the × clears the field');
    assert.ok(!document.querySelector('.gd-search-clear'), 'the × leaves with the text');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.6 the creation label counts (2/35) and trims a 40-char dump to 35 — accent at full', async () => {
    const { host, root } = await boot(makeApi());
    // open the NEW CARD window (the sidebar dock key)
    const newBtn = [...host.querySelectorAll('button')].find((b) => /NEW CARD/.test((b.textContent || '').trim()));
    assert.ok(newBtn, 'the NEW CARD key exists');
    click(newBtn);
    await sleep(400);
    const modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /NEW CARD/.test(m.textContent || ''));
    assert.ok(modal, 'the creation window opened');
    // the FIRST VERSION label field (placeholder distinguishes it from the NAME field)
    const field = modal.querySelector('.gd-rt-edit[data-placeholder^="V1, alt outfit"]');
    assert.ok(field, 'the first-version label field mounted');
    // the counter row rides the same wrap — and it already speaks 2/35 (the "V1" seed)
    const wrap = field.closest('.gd-rt-wrap');
    let count = wrap.querySelector('.gd-rt-count');
    assert.ok(count, 'the counter row exists');
    assert.equal((count.textContent || '').trim(), '2/35', 'it counts the seeded V1');
    assert.ok(!count.classList.contains('is-max'), 'not yet at the cap');
    // dump 40 characters through the input path — the net trims to 35
    field.focus();
    field.textContent = 'a'.repeat(40);
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
    await sleep(80);
    const fieldAfter = modal.querySelector('.gd-rt-edit[data-placeholder^="V1, alt outfit"]');
    assert.equal((fieldAfter.textContent || '').length, 35, 'a 40-char dump lands as exactly 35');
    count = fieldAfter.closest('.gd-rt-wrap').querySelector('.gd-rt-count');
    assert.equal((count.textContent || '').trim(), '35/35', 'the counter says 35/35');
    assert.ok(count.classList.contains('is-max'), 'a full field reads accent (is-max)');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.6 closing the NEW CARD draft asks first — and DISCARD closes without creating', async () => {
    const { host, root } = await boot(makeApi());
    const newBtn = [...host.querySelectorAll('button')].find((b) => /NEW CARD/.test((b.textContent || '').trim()));
    click(newBtn);
    await sleep(400);
    let modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /NEW CARD/.test(m.textContent || ''));
    assert.ok(modal, 'the creation window opened');
    // put a real draft in it (type a name)
    const nameField = modal.querySelector('.gd-rt-edit[data-placeholder^="e.g. amy"]');
    assert.ok(nameField, 'the NAME field mounted');
    nameField.focus();
    nameField.textContent = 'draft card';
    nameField.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
    // ESCAPE — the accidental gesture — must OPEN THE ASK, not close the window
    pressEscape();
    await sleep(200);
    let ask = askLayer();
    assert.ok(ask, 'the ask appeared on Escape');
    assert.ok(/KEEP EDITING/.test(ask.textContent || ''), 'it offers KEEP EDITING');
    assert.ok(/DISCARD/.test(ask.textContent || ''), 'it offers CLOSE — DISCARD');
    // KEEP EDITING — the window stays exactly as it was
    click(askBtn(/KEEP EDITING/));
    await sleep(200);
    assert.ok(!askLayer(), 'the ask closed');
    modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /NEW CARD/.test(m.textContent || ''));
    assert.ok(modal, 'the creation window is still open');
    assert.equal((modal.querySelector('.gd-rt-edit[data-placeholder^="e.g. amy"]')?.textContent || ''), 'draft card', 'the draft survived KEEP EDITING');
    // the header ✕ — the second accidental gesture — asks again
    const closeX = [...modal.querySelectorAll('.gd-icon-btn')].find((b) => (b.title || '') === 'Close');
    assert.ok(closeX, 'the header ✕ exists');
    click(closeX);
    await sleep(200);
    ask = askLayer();
    assert.ok(ask, 'the ask appeared on the header ✕');
    // CLOSE — DISCARD: the window dies, nothing is created
    click(askBtn(/DISCARD/));
    await sleep(400);
    assert.ok(!askLayer(), 'the ask is gone');
    assert.ok(![...document.querySelectorAll('[data-gd-modal]')].some((m) => /NEW CARD/.test(m.textContent || '')), 'the window closed');
    assert.equal(document.querySelectorAll('[data-gd-char-id]').length, 2, 'NO card was created by the discard');
    assert.ok(!/draft card/.test(host.textContent || ''), 'the draft\'s name appears nowhere');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.6 a card opens on its FACE version; the bar\'s texts speak in parts', async () => {
    // c1 wears a COVER on its second version and a long name — what fronts
    // the card in the grid must be what opens.
    const characters = [
      mkChar(
        'c1',
        'amy the amber archer of the long autumn woods and farther beyond',
        'cl1',
        [mkVer('v1', 'Alpha base', 1), mkVer('v2', 'Beta the long awaited winter gala encore', 2)],
        'v2'
      ),
      mkChar('c2', 'bruno the brutal baron', 'cl2', [mkVer('v3', 'V1', 1)]),
    ];
    const { host, root } = await boot(makeApi({ characters }));
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    assert.ok(card, 'the grid card mounted');
    click(card);
    await sleep(500);
    // the version strip: the SECOND chip (the cover) is the active one
    const chips = [...document.querySelectorAll('.gd-version-item .gd-chip')];
    assert.ok(chips.length >= 2, 'both version chips render');
    assert.ok(chips[1].className.includes('is-active'), 'the COVER version (Beta) is the active one on open');
    assert.ok(!chips[0].className.includes('is-active'), 'the raw first slot (Alpha) is not auto-selected');
    // the resting chip speaks in parts; the active one wears its whole name
    assert.ok(chips[0].querySelector('.gd-chip-label-cap'), 'the resting chip\'s label is capped');
    assert.ok(!chips[1].querySelector('.gd-chip-label-cap'), 'the active chip\'s label is whole');
    // the output bar: texts truncate, keys keep their seats
    const bar = document.querySelector('.gd-output-bar');
    assert.ok(bar, 'the output bar mounted');
    assert.ok(bar.querySelector('.gd-chip-label-cap'), 'the bar\'s version label is capped');
    const nameSpan = [...bar.querySelectorAll('span')].find((s) => (s.className || '').includes('truncate'));
    assert.ok(nameSpan, 'the bar\'s name truncates');
    assert.equal(nameSpan.getAttribute('title'), 'amy the amber archer of the long autumn woods and farther beyond', 'its full self rides the title');
    assert.ok([...bar.querySelectorAll('button')].some((b) => /EXPAND/.test(b.textContent || '')), 'the EXPAND key keeps its seat');
    assert.ok([...bar.querySelectorAll('button')].some((b) => /COPY/.test(b.textContent || '')), 'the COPY key keeps its seat');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.6 the tag manager asks before dropping an unsaved tag — and never applies it on close', async () => {
    const { host, root } = await boot(makeApi());
    // open the details panel, then the tags row's right-click menu
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const tagsToggle = [...host.querySelectorAll('button')].find((b) => (b.textContent || '') === 'TAGS');
    assert.ok(tagsToggle, 'the tags row toggle exists');
    rclick(tagsToggle.parentElement);
    await sleep(120);
    const mgrItem = [...document.querySelectorAll('.gd-ctx-menu button')].find((b) => /Open the tag manager/.test(b.textContent || ''));
    assert.ok(mgrItem, 'the manager menu item exists');
    click(mgrItem);
    await sleep(300);
    let modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /TAG MANAGER/.test(m.textContent || ''));
    assert.ok(modal, 'the tag manager opened');
    // build an unsaved tag draft
    const nameField = modal.querySelector('.gd-rt-edit');
    assert.ok(nameField, 'the NAME field mounted');
    nameField.focus();
    nameField.textContent = 'purple rain';
    nameField.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
    // the header ✕ asks first
    const closeX = [...modal.querySelectorAll('.gd-icon-btn')].find((b) => (b.title || '') === 'Close');
    assert.ok(closeX, 'the manager\'s header ✕ exists');
    click(closeX);
    await sleep(200);
    let ask = askLayer();
    assert.ok(ask, 'the ask appeared');
    assert.ok(/tag that has not been applied/.test(ask.textContent || ''), 'it speaks the pending tag');
    // KEEP EDITING — the draft survives
    click(askBtn(/KEEP EDITING/));
    await sleep(200);
    modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /TAG MANAGER/.test(m.textContent || ''));
    assert.ok(modal, 'the manager is still open');
    // CLOSE — DISCARD — the tag is NOT applied
    const closeX2 = [...modal.querySelectorAll('.gd-icon-btn')].find((b) => (b.title || '') === 'Close');
    click(closeX2);
    await sleep(200);
    ask = askLayer();
    assert.ok(ask, 'the ask appeared again');
    click(askBtn(/DISCARD/));
    await sleep(400);
    assert.ok(![...document.querySelectorAll('[data-gd-modal]')].some((m) => /TAG MANAGER/.test(m.textContent || '')), 'the manager closed');
    assert.ok(!/purple rain/.test(host.textContent || ''), 'the discarded tag was never applied');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.0.6 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed) process.exitCode = 1;
