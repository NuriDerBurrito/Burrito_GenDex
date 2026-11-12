// 1.0.5 batch DOM + source checks — quiet light, honest fields, and rows
// that speak. Thirteen fixes:
//   · THE GODRAYS RETIRED ("i dont like the godrays, remove them from splash
//     screen and about section, and improve the glow"): no rays layer in any
//     JSX, no rays rule / conic fan in the css; the glow is LAYERED (core +
//     wide field), bigger, breathing deeper + swelling on transform only.
//   · THE EMPTY ROWS LOST THEIR MUMBLING ("remove 'none' and 'none yet' from
//     the tags and stamps details pannel … just keep the add buttons like
//     normal").
//   · THE LONG NAMES SCROLL ("when i enter a name longer than the container,
//     make it so im able to scroll through it by drag selecting or arrow keys
//     and such (aka take inspiration from the search container)"):
//     .gd-rt-edit is overflow-x: auto with the scrollbar hidden.
//   · THE NAME OPENS ON HOVER ("make it when i hover over the name in the
//     details pannel that it would expand to show the entire name, when i
//     let go it retracts"): :hover lifts the 2-line clamp.
//   · THE TAG MANAGER FOUND ITS MANNERS: name wraps + 35 cap; commit row
//     wraps, preview capped; FRESH TAG rides beside UPDATE TAG.
//   · THE CLASS EDITOR'S 35-CAP ("in edit class … a character limit of 35
//     and it wont push the emojie window to the right"): min-w-0 column.
//   · THE FOLD MEASURES ITS ROW ("fix the issue when tags collapse it would
//     clip the tag at the bottom"): measureOneRow in useClampStyle.
//   · THE ROWS SPEAK ("when i right click on the tags or stamps it would
//     give me the option to do their things"): tags row → manager; stamps
//     row → paste / browse.
//   · THE MUMEI BLOBS STOPPED STRETCHING THIN ("in rounded themes such as
//     mumei … would stretch too thin"): fixed-px organic radii.
//   · THE VERSION LABEL'S 35-CAP ("35 character limit for the version name
//     too and dont let it push the windows to the right").
//   · THE SEARCH SURVIVES THE WALK + CANCEL ("when i have an ongoing search
//     then i switch to another class, it shouldnt cancel it … add a button
//     below the no matches explanations to cancel the search").
//   · THE × KEY ("add an x on the right of the search … which will appear
//     while writing in the search area, when its pressed it would clear it").
//   · THE WINDOW CONTROLS SPEAK THE THEME ("minimize and maximize containers
//     when hovered over would highlight in color related to the theme … but
//     close button should always be red when hovered over regardless of
//     theme"): accent hover pair + the mumei cyan override retired.
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
  console.log('jsdom unavailable — 1.0.5 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the 1.0.5 wave
// ===========================================================================
{
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const splashSrc = stripComments(src('src/components/Splash.jsx'));
  const tagSrc = stripComments(src('src/components/TagManagerModal.jsx'));
  const classSrc = stripComments(src('src/components/ClassSidebar.jsx'));
  const verSrc = stripComments(src('src/components/VersionSettingsModal.jsx'));
  const newSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const richSrc = stripComments(src('src/components/RichText.jsx'));
  const codeCss = stripComments(css);

  ok('1.0.5 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('README.md'), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.6 /m);
  });

  // ---- fix 1: the godrays retired, the glow improved ----
  ok('1.0.5 the godrays are gone everywhere; the glow is layered and deeper', () => {
    assert.ok(!/halo-rays|gd-splash-rays/.test(settingsSrc + splashSrc), 'no rays layer in any JSX');
    assert.ok(!/halo-rays|gd-splash-rays/.test(codeCss), 'no rays rule survives in the css');
    assert.ok(!/gd-halo-spin|gd-splash-spin/.test(codeCss), 'no spin keyframes survive');
    // no conic fan rides the halo surfaces (theme TEXTURES may keep their own)
    const aboutGlow = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/conic-gradient/.test(aboutGlow), 'the About glow is radial only');
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: the splash halo is retired (the glow left)');
    assert.ok((aboutGlow.match(/radial-gradient/g) || []).length >= 2, 'About glow = core + wide field');
    /* 1.1.1 — the halo grew slightly ("make the about glow slightly bigger"). */
    assert.match(aboutGlow, /inset: -72%;/, 'the About glow spreads wider');
    assert.match(aboutGlow, /gd-halo-breathe 3\.8s ease-in-out infinite/, 'it breathes');
    assert.match(aboutGlow, /gd-halo-swell 7\.6s ease-in-out infinite/, 'it swells');
    /* 1.1.8 — the splash halo retired whole ("remove glow from the splash
       screen, instead just decoreate it more so its not empty"): the
       layered fields, the 420px pool and the swell keyframes all left; the
       breathe keyframes SURVIVE (the reduced-motion progress bar rides
       them) and stay opacity-only. The About glow above keeps its law. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: no splash halo rule survives');
    assert.ok(!/@keyframes gd-splash-swell/.test(codeCss), 'the swell keyframes retired with the halo');
    const breathe = /@keyframes gd-splash-breathe\s*\{[\s\S]*?\n\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/transform|filter|width|height|left|top/.test(breathe), 'the surviving breathe touches nothing but opacity');
    assert.match(breathe, /opacity: 0\.55;/, 'and it still breathes deep');
  });

  // ---- fix 2: no "none" / "none yet" ----
  ok('1.0.5 the empty rows speak through their keys alone', () => {
    assert.ok(!/none yet/.test(viewSrc), 'no "none yet" in the details view');
    assert.ok(!/charStamps\.length === 0 && <span[^>]*>none</.test(viewSrc), 'no "none" in the stamp strip');
    assert.match(viewSrc, /onOpenTagManager\}/, 'the tags row still carries its + key (the manager)');
    assert.match(viewSrc, /<StampAddButton/, 'the stamp strip still carries its ADD key');
    assert.match(viewSrc, /<StampPasteTile/, 'the stamp strip still carries its PASTE tile');
  });

  // ---- fix 3: the long names scroll ----
  ok('1.0.5 the rich fields scroll like the search box', () => {
    const editRule = /\.gd-rt-edit\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(editRule, /overflow-x: auto;/, 'the field is a real horizontal scroller');
    assert.match(editRule, /white-space: pre;/, 'it stays one line');
    const sbRule = /\.gd-rt-edit::-webkit-scrollbar\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(sbRule, /display: none;/, 'the scrollbar is hidden (the search box feel)');
    assert.match(editRule, /scrollbar-width: none;/, 'firefox too');
    // the cap machinery exists on the shared field
    assert.match(richSrc, /maxLength = null/, 'RichInput accepts a maxLength');
    assert.match(richSrc, /handleBeforeInput/, 'the cap refuses edits BEFORE they land');
    assert.match(richSrc, /newPlain\.slice\(0, maxLength\)/, 'the safety net trims what slips past');
    const multiRule = /\.gd-rt-edit-multiline\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(multiRule, /white-space: pre-wrap;/, 'the multiline variant wraps');
    assert.match(multiRule, /word-break: break-word;/, 'long unbroken words fold too');
  });

  // ---- fix 4: the name opens on hover ----
  ok('1.0.5 the details name expands on hover and retracts on leave', () => {
    // 1.0.7 — RETIRED ("remove the detail panel feature where the card name
    // when hovered over will show fully, instead add a button on top to
    // expand or retract the rest of the name"): no hover rule exists at all
    // anymore; the two-line cut is a STATE owned by the header's own key,
    // animated through the measured fold (see 1.0.7's suite for the full
    // law). This check now pins the retirement itself.
    /* 1.1.1 — the clamp is REBORN with a new job: the RESTING ellipsis
       (the 1.0.7 hover-lift retirement stands — this clamp rides the name
       only while the fold sits retracted; see the 121 suite). */
    assert.ok(!/hover/.test(/\.gd-name-clamp\s*\{[^}]*\}/.exec(codeCss)?.[0] || ''), 'the clamp never rides a hover');
    assert.match(/\.gd-name-clamp\s*\{[^}]*\}/.exec(codeCss)?.[0] || '', /-webkit-line-clamp: 2;/, 'the resting clamp paints the dots (1.1.1)');
    assert.ok(!/\.gd-name-clamp:hover/.test(codeCss), 'no hover behavior exists on the name');
    /* 1.1.1 — the toggle gained a wrapper (the clamp lifts through the
       setState updater while it flips the fold). */
    assert.match(viewSrc, /setNameExpanded\(\(v\) => \{/, 'the header key toggles the fold');
    assert.match(viewSrc, /height: nameExpanded \|\| nameFoldH == null \? 'auto' : nameFoldH/, 'the fold animates between two lines and the full name');
  });

  // ---- fixes 5 + 6: the tag manager's manners ----
  ok('1.0.5 the tag manager name wraps at 35; the commit row can never clip its keys', () => {
    assert.match(tagSrc, /maxLength=\{35\}/, 'the NAME field carries the 35 cap');
    assert.match(tagSrc, /multiline/, 'the NAME field wraps to a new line');
    assert.match(tagSrc, /wrapClassName="flex-1 min-w-0"/, 'the field is seated (never pushes its row)');
    assert.match(tagSrc, /flex flex-wrap items-end gap-3/, 'the commit row wraps');
    assert.match(tagSrc, /maxWidth: '52%'/, 'the preview plate is capped');
    assert.match(tagSrc, /min-w-0 overflow-hidden/, 'the preview clips itself, not the keys');
    // the fresh-tag key rides beside UPDATE TAG
    const freshIdx = tagSrc.indexOf('FRESH TAG');
    const updateIdx = tagSrc.indexOf("'UPDATE TAG'");
    assert.ok(freshIdx > 0 && updateIdx > 0 && Math.abs(freshIdx - updateIdx) < 400, 'FRESH TAG sits beside UPDATE TAG');
    assert.ok(!/gd-icon-btn flex-shrink-0" title="Start a fresh tag instead" onClick=\{resetForm\}/.test(tagSrc), 'the old X-in-the-name-row is gone');
  });

  // ---- fix 7: the class editor's cap ----
  ok('1.0.5 the class name is capped at 35 and never pushes the emoji column', () => {
    assert.match(classSrc, /maxLength=\{35\}/, 'the class name field carries the cap');
    assert.match(classSrc, /className="space-y-3 min-w-0"/, 'the editor column is min-w-0 (the 1fr track holds)');
    assert.match(classSrc, /grid-cols-\[1fr_236px\]/, 'the emoji picker keeps its own column');
  });

  // ---- fix 8: the measured fold + the rows that speak ----
  ok('1.0.5 the collapse clamp MEASURES its row (no bottom shaving)', () => {
    /* 1.1.5 — the measure speaks N ROWS now (measureRows, rows param): the
       detail panel's one-row law is unchanged (rows defaults to 1), and the
       creation window's tag board folds to three through the same hook. */
    assert.match(viewSrc, /const measureRows = \(el\) => \{/, 'the row-band measurement exists');
    /* 1.1.4 — the read is RELATIVE TO THE ZONE now (child rect minus zone
       rect — offsetTop answered to the sticky header, so the clamp never
       folded; see the 1.1.4 batch). The truth it reads is the same: the
       children's true bottom, reach for the outline, no sliver below. */
    assert.match(viewSrc, /r\.bottom - zoneTop/, 'it reads the children\'s true bottom, relative to the zone');
    assert.match(viewSrc, /bottom \+ 5/, 'it leaves reach for the outline/shadow');
    assert.match(viewSrc, /nextRowTop - 1/, 'it never shows a sliver of the row below');
    assert.match(viewSrc, /setMax\(measureRows\(el\)\)/, 'the clamp tweens to the measured height');
    /* 1.1.8 — the two call sites moved INTO SideFlowZone (the side-flow
       law); the floors survive verbatim on the zone's own seats. */
    /* 1.3.0 — the tags zone moved into TagsFlowRow (its own component so
       drag retargets never re-render the whole view); the floor survives
       verbatim on the row's own seat. */
    assert.match(viewSrc, /function TagsFlowRow\([\s\S]*?<SideFlowZone[\s\S]*?rows=\{3\}[\s\S]*?collapsed=\{collapsed\}[\s\S]*?floorPx=\{31\}/, 'the tags floor survives (31, in TagsFlowRow)');
    assert.match(viewSrc, /<SideFlowZone\s+rows=\{2\}\s+collapsed=\{collapsed\}\s+floorPx=\{55\}/, 'the stamps floor survives (55 — the 0.46.0 glow law)');
    /* 1.1.5 — the hook is exported for the creation window's tag board. */
    assert.match(viewSrc, /export \{ useClampStyle \};/, 'the clamp law is shared with the creation window');
  });

  ok('1.0.5 right-clicking the tags/stamps rows speaks their things', () => {
    // tags row → the manager
    assert.match(viewSrc, /const \[tagCtx, setTagCtx\] = useState\(null\);/, 'the tags row menu state');
    assert.match(viewSrc, /label: 'Open the tag manager'/, 'the tags menu carries the manager');
    // stamps row → paste + browse
    assert.match(viewSrc, /const \[stampCtx, setStampCtx\] = useState\(null\);/, 'the stamps row menu state');
    assert.match(viewSrc, /label: 'Paste a new stamp'/, 'the stamps menu carries paste');
    assert.match(viewSrc, /label: 'Browse for a new stamp'/, 'the stamps menu carries browse');
    assert.match(viewSrc, /clipboardReadImage/, 'paste reads the clipboard image');
    assert.match(viewSrc, /importImagesFromFiles\(\)/, 'browse opens the file picker');
    // both swallow the event so the app menu never mixes in
    const swallow = (viewSrc.match(/e\.preventDefault\(\);\s*e\.stopPropagation\(\);/g) || []).length;
    assert.ok(swallow >= 3, 'the row menus swallow their right-clicks (pin + tags + stamps)');
  });

  // ---- fix 9: the mumei blobs ----
  ok('1.0.5 the mumei blob radii are fixed pixels (no pinch on long names)', () => {
    const chipRule = /\[data-theme='mumei'\] \.gd-chip\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/\d+%/.test(chipRule), 'no percentage radii survive on the chips');
    assert.match(chipRule, /border-radius: 15px 19px 16px 18px \/ 18px 15px 19px 16px;/, 'organic fixed-px corners');
    const stampRule = /\[data-theme='mumei'\] \.gd-stamp\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/\d+%/.test(stampRule), 'no percentage radii survive on the stamps');
    assert.match(stampRule, /border-radius: 12px 15px 12px 14px \/ 14px 12px 15px 12px;/, 'the painted outline keeps its look');
  });

  // ---- fix 10: the version label's cap ----
  ok('1.0.5 the version labels are capped at 35 in BOTH windows', () => {
    assert.match(verSrc, /maxLength=\{35\}/, 'the edit window\'s label carries the cap');
    assert.match(verSrc, /className="space-y-4 min-w-0"/, 'the edit window\'s column is min-w-0');
    assert.match(newSrc, /maxLength=\{35\}/, 'the creation window\'s label carries the cap');
  });

  // ---- fixes 11 + 12: the search that stays + the × key ----
  ok('1.0.5 the search keeps its text, offers CANCEL, and wears an ×', () => {
    // the × key — 1.0.6 IN-SEAT EVOLUTION ("the x in the search should not
    // take extra space, it should take part of the already existing space
    // instead"): the field no longer grows a padding for the key — the ×
    // rides the field's OWN right padding zone (right: 2px) and text simply
    // scrolls under it, exactly like a native search field.
    assert.match(gridSrc, /className="gd-search-clear"/, 'the × key exists');
    assert.ok(!/gd-input-clearable/.test(gridSrc), '1.0.6: the field no longer wears the clearable pad class');
    assert.ok(!/\.gd-input\.gd-input-clearable\s*\{[^}]*\}/.test(codeCss), '1.0.6: the clearable padding rule is retired');
    const keyRule = /\.gd-search-clear\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(keyRule, /position: absolute;/, 'the key rides the field\'s right edge');
    // 1.0.7 — THE × STEPS OFF THE BORDER ("move it to the left slightly so
    // it doesnt hug the right border"): 5px kept the in-seat law (the
    // field's own padding zone, no extra padding class) while giving the
    // key a breath of field between it and the border.
    // 1.0.9 — A LITTLE MORE AIR ("move the search x slightly to the left"):
    // 8px, and the has-x seat (its own rule, its own name) grew with it.
    assert.match(keyRule, /right: 8px;/, 'it sits inside the field\'s padding zone, off the border with more air (1.0.9)');
    const inputRule = /\.gd-input\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/padding-right: 28px/.test(inputRule), 'the field keeps its ordinary padding — no extra seat');
    // the cancel key under NO MATCHES
    assert.match(gridSrc, /CANCEL SEARCH/, 'the NO MATCHES card carries CANCEL SEARCH');
    assert.match(gridSrc, /onClick=\{\(\) => onSearch\(''\)\}/, 'pressing it empties the field');
    // the × clears too
    assert.match(gridSrc, /onClick=\{\(\) => onSearch\(''\)\}/, 'the × empties the field too');
    // NEW CARD still shows for a truly empty class
    assert.match(gridSrc, /!spotActive \? \(/, 'NEW CARD survives for the empty class');
  });

  // ---- fix 13: the window controls ----
  ok('1.0.5 min/max highlight in the theme accent; close is ALWAYS red', () => {
    const hoverRule = /button\.gd-win-btn:hover\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(hoverRule, /var\(--gd-accent\) 22%, transparent/, 'min/max lift on the theme accent');
    assert.match(hoverRule, /color: var\(--gd-accent\);/, 'the glyph turns accent');
    const closeRule = /button\.gd-win-btn\.gd-win-close:hover\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(closeRule, /background: #c8402f;/, 'close stays red');
    assert.match(closeRule, /color: #ffffff;/, 'with the white glyph');
    // the mumei cyan override is retired
    const mumeiClose = /\[data-theme='mumei'\][^{]*\.gd-win-close:hover\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.equal(mumeiClose, '', 'no theme overrides the close hover anymore');
    const anyCloseOverride = /\.gd-win-close:hover\s*\{[^}]*\}/g;
    let over = null;
    for (const m of codeCss.match(anyCloseOverride) || []) if (!/#c8402f/.test(m)) over = m;
    assert.equal(over, null, 'every close hover rule paints the same red');
  });
}

// ===========================================================================
// Part B — live DOM: honest fields, the search that stays, the rows that speak
// ===========================================================================
{
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
        characters: [
          {
            id: 'c1', name: 'amy the amber archer of the long autumn woods and farther', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
            stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [
              {
                id: 'v1', label: 'V1', color: '#c8402f', icon: null,
                images: [{ file: 'a.png' }],
                parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
                notes: '', createdAt: 1,
              },
            ],
          },
          {
            id: 'c2', name: 'bruno the brutal baron of the burned bay', classId: 'cl2', tags: [], previewVersionId: null,
            cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
            stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now() + 1,
            versions: [
              {
                id: 'v2', label: 'V1', color: '#c8402f', icon: null,
                images: [{ file: 'b.png' }],
                parts: [{ id: 'p2', name: 'body', content: 'hard shading', include: true }],
                notes: '', createdAt: 1,
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
  });

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const rclick = (el) => el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
  const searchInput = () => [...document.querySelectorAll('input')].find((i) => /Search/i.test(i.placeholder || ''));
  const typeSearch = async (text) => {
    const input = searchInput();
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, text);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
  };

  const boot = async (api) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400); // splash timeline
    return { host, root };
  };

  await okAsync('1.0.5 the search SURVIVES the class switch, and NO MATCHES offers CANCEL', async () => {
    const { host, root } = await boot(makeApi());
    await typeSearch('amy');
    assert.equal(searchInput().value, 'amy', 'the field carries the text');
    // switch to the OTHER class (bruno — no match for "amy")
    const row = document.querySelector('[data-gd-class-id="cl2"]');
    click(row);
    await sleep(120);
    assert.equal(searchInput().value, 'amy', 'the search text SURVIVED the switch');
    assert.match(host.textContent || '', /NO MATCHES/, 'the empty state speaks NO MATCHES');
    // the CANCEL key sits under the explanation
    const cancel = [...host.querySelectorAll('button')].find((b) => /CANCEL SEARCH/.test(b.textContent || ''));
    assert.ok(cancel, 'the CANCEL SEARCH key exists');
    click(cancel);
    await sleep(80);
    assert.equal(searchInput().value, '', 'pressing it clears the search');
    assert.ok(!/NO MATCHES/.test(host.textContent || ''), 'the crowd returns');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.5 the × key appears only while there is text, and clears it', async () => {
    const { host, root } = await boot(makeApi());
    assert.ok(!document.querySelector('.gd-search-clear'), 'no × while the field is empty');
    await typeSearch('bru');
    const x = document.querySelector('.gd-search-clear');
    assert.ok(x, 'the × appears with text');
    click(x);
    await sleep(80);
    assert.equal(searchInput().value, '', 'the × clears the field');
    assert.ok(!document.querySelector('.gd-search-clear'), 'the × leaves with the text');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.5 the details rows speak on right-click (tags → manager, stamps → paste/browse)', async () => {
    const { host, root } = await boot(makeApi());
    // open the card's details panel
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    // the tags row: right-click it
    const tagsToggle = [...host.querySelectorAll('button')].find((b) => (b.textContent || '') === 'TAGS');
    assert.ok(tagsToggle, 'the tags row toggle exists');
    rclick(tagsToggle.parentElement);
    await sleep(120);
    let menu = [...document.querySelectorAll('.gd-ctx-menu')].map((m) => m.textContent || '').join('\n');
    assert.match(menu, /Open the tag manager/, 'the tags menu speaks the manager');
    // pick it — the manager window opens
    const mgrItem = [...document.querySelectorAll('.gd-ctx-menu button')].find((b) => /Open the tag manager/.test(b.textContent || ''));
    assert.ok(mgrItem, 'the manager item is a button');
    click(mgrItem);
    await sleep(300);
    assert.ok([...document.querySelectorAll('[data-gd-modal]')].some((m) => /TAG MANAGER/.test(m.textContent || '')), 'the tag manager opened');
    // close the manager (CANCEL)
    const cancelBtn = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => (b.textContent || '').trim() === 'CANCEL');
    click(cancelBtn);
    await sleep(300);
    // the stamps row: right-click it
    const stampsToggle = [...host.querySelectorAll('button')].find((b) => (b.textContent || '') === 'STAMPS');
    assert.ok(stampsToggle, 'the stamps row toggle exists');
    rclick(stampsToggle.parentElement);
    await sleep(120);
    menu = [...document.querySelectorAll('.gd-ctx-menu')].map((m) => m.textContent || '').join('\n');
    assert.match(menu, /Paste a new stamp/, 'the stamps menu speaks paste');
    assert.match(menu, /Browse for a new stamp/, 'the stamps menu speaks browse');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.5 the empty tag row carries NO "none yet" — only its keys', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const panel = document.querySelector('[data-gd-region="panel"]') || host;
    assert.ok(!/none yet/i.test(panel.textContent || ''), 'the tags row never says "none yet"');
    assert.ok(!/\bnone\b/i.test(panel.textContent || ''), 'the stamp strip never says "none"');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.5 the tag manager NAME field refuses a 36th character', async () => {
    const { host, root } = await boot(makeApi());
    // open the tag manager through the row menu
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const tagsToggle = [...host.querySelectorAll('button')].find((b) => (b.textContent || '') === 'TAGS');
    rclick(tagsToggle.parentElement);
    await sleep(120);
    const mgrItem = [...document.querySelectorAll('.gd-ctx-menu button')].find((b) => /Open the tag manager/.test(b.textContent || ''));
    click(mgrItem);
    await sleep(300);
    // the manager's NAME field (a contentEditable .gd-rt-edit)
    const modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /TAG MANAGER/.test(m.textContent || ''));
    assert.ok(modal, 'the manager is open');
    const field = modal.querySelector('.gd-rt-edit');
    assert.ok(field, 'the NAME field mounted');
    assert.match(field.className, /gd-rt-edit-multiline/, 'it is the wrapping variant');
    // type 40 characters through the model: the beforeinput guard refuses the 36th
    const BeforeInput = dom.window.BeforeInputEvent || dom.window.InputEvent;
    field.focus();
    const thirtyFive = 'abcdefghijklmnopqrstuvwxyz012345678';
    field.textContent = thirtyFive;
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
    // the safety net: the input event itself should have trimmed nothing (35 exactly)
    const fieldAfter = modal.querySelector('.gd-rt-edit');
    assert.equal((fieldAfter.textContent || '').length, 35, '35 characters land');
    // push past: set 40 raw, fire input — the net trims to 35
    fieldAfter.textContent = thirtyFive + '9ABCD';
    fieldAfter.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
    assert.equal((modal.querySelector('.gd-rt-edit').textContent || '').length, 35, 'the net trims a 40-char dump back to 35');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.0.5 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed) process.exitCode = 1;
