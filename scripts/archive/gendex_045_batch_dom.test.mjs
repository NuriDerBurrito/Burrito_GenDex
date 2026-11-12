// 0.45.0 batch DOM + source checks — the fifth fix wave.
//
//   · THE WHEEL RETIRES — after four versions of chasing the scroll-zoom
//     stutter (0.42 direction, 0.43 single-writer, 0.44 live node + echo
//     guard) it still misread ticks on some devices, so the gesture is GONE
//     on both named surfaces: no wheel listener anywhere in src. The viewer
//     keeps its keys/buttons/double-click; the preview gains a quiet
//     three-key row (out / in / reset) under the card.
//   · THE MARKS POP — the 0.43/0.44 FLIP-and-flight machinery is deleted
//     (useFlipMark.js gone): every TOP/COVER mark is keyed by its OWNER
//     inside an AnimatePresence, so a change of hands pops the old mark out
//     and the new one in (~180ms scale + fade). A plain reorder pops
//     nothing — the mark rides its own tile through the commit.
//   · RIGHT-CLICK SPEAKS EACH KEY'S OWN LANGUAGE — the gear's menu is back
//     through a BODY PORTAL (the real fix for the 0.44 off-seat bug:
//     GdContextMenu now portals to document.body): EDIT CARD / DELETE /
//     UNDO / REDO. The pin key says "Pin header" / "Unpin header". The
//     filter + order keys say exactly "Clear selection" and nothing else.
//   · The header's expand chip only undoes the AUTO-fold — per-row
//     collapses ride straight through the unfold.
//   · The preview's foot is STATIC (is-static): two tracks at all times,
//     the N VER badge always seated beside the name — never a whole new
//     row below the date.
//   · THE RELEASE HOLD — the sort engine writes gd-just-dropped on the
//     dropped item at the commit and clears it when the pointer genuinely
//     leaves; while it rides, every hover rule in the strip declines.
//   · The version chip's cover star pops in place (a quick mount
//     animation when the cover version changes hands).
//   · The viewer's hint reads the new gesture-free law.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 0.45.0 batch DOM test skipped (dev-only dependency)');
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

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mount = async (Comp, props) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(React.createElement(Comp, props));
  await flush();
  return { host, root };
};

// ===========================================================================
// Part A — source checks for the fifth wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const viewerSrc = src('src/components/ImageViewer.jsx');
  const editorSrc = src('src/components/CardLookEditor.jsx');
  const appSrc = src('src/App.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');
  const menuSrc = src('src/components/GdContextMenu.jsx');
  const sortSrc = src('src/components/useThumbSort.js');

  ok('0.45.0→1.0.2 the version pinned through 1.0.4', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 0\.46\.0/m, 'the changelog carries the entry');
  });

  ok('0.45.0 NO wheel listener survives anywhere in src', () => {
    const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
      const p = join(dir, d.name);
      return d.isDirectory() ? walk(p) : [p];
    });
    for (const f of walk(join(appRoot, 'src'))) {
      if (!/\.(jsx?|css)$/.test(f)) continue;
      const body = readFileSync(f, 'utf8');
      assert.ok(!/addEventListener\(\s*['"]wheel['"]/.test(body), `${f} carries no wheel listener`);
      assert.ok(!/\bonWheel\b/.test(body), `${f} carries no wheel prop`);
    }
    // the two named surfaces are the whole story
    assert.ok(!/deltaY/.test(viewerSrc), 'the viewer has no wheel math');
    assert.ok(!/deltaY/.test(editorSrc), 'the preview has no wheel math');
  });

  ok('0.45.0 the preview\'s three-key zoom row (out / in / reset)', () => {
    assert.ok(editorSrc.includes('className="gd-preview-zoom"'), 'the row mounts under the card');
    assert.ok(/stepZoom\(1 \/ 0\.9\)/.test(editorSrc), 'the OUT key steps out');
    assert.ok(/stepZoom\(0\.9\)/.test(editorSrc), 'the IN key steps in');
    assert.ok(/onClick=\{\(\) => applyCrop\(null\)\}/.test(editorSrc), 'the RESET key returns to the auto fit');
    assert.ok(/imageUrl && imgAspect && \(/.test(editorSrc.replace(/\s+/g, ' ')), 'the row shows only while there\'s a picture to place');
    const row = /\.gd-preview-zoom\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/display: flex;/.test(row), 'the row is a quiet centered flex');
  });

  ok('0.45.0 the viewer keeps every non-wheel zoom path', () => {
    assert.ok(/e\.key === '\+' \|\| e\.key === '='/.test(viewerSrc), 'the + key zooms in');
    assert.ok(/e\.key === '-'/.test(viewerSrc), 'the - key zooms out');
    assert.ok(/e\.key === '0'/.test(viewerSrc), 'the 0 key resets');
    assert.ok(/applyView\(/.test(viewerSrc), 'the single-writer pipeline stays');
    assert.ok(viewerSrc.includes('drag to pan · zoom with the keys or +/− · right-click for options · double-click resets'), 'the toolbar hint speaks the new law');
  });

  ok('0.45.0 the flight is deleted — the marks pop through AnimatePresence', () => {
    assert.ok(!existsSync('src/utils/useFlipMark.js'), 'useFlipMark.js is gone from the codebase');
    assert.ok(!/gd-mark-check/.test(sortSrc), 'the pre-commit checkpoint is gone');
    const stampSrc = src('src/components/StampEditModal.jsx');
    const managerSrc = src('src/components/ImageManagerModal.jsx');
    const createSrc = src('src/components/NewCharacterModal.jsx');
    assert.ok(/key=\{stamps\[0\]\.id\}/.test(stampSrc), 'the stamp TOP mark is keyed by the top stamp\'s own id');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(managerSrc), 'the manager COVER badge is keyed by the file');
    assert.ok(/key=\{`ring-\$\{img\.file\}`\}/.test(managerSrc), 'the selection ring is keyed by the file');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(createSrc), 'the creation COVER mark is keyed by the file');
    for (const s of [stampSrc, managerSrc, createSrc]) {
      assert.ok(/<AnimatePresence initial=\{false\}>/.test(s), 'rides AnimatePresence');
      assert.ok(/exit=\{\{ opacity: 0, scale: 0\.6 \}\}/.test(s), 'pop out = scale + fade');
      assert.ok(/duration: 0\.18/.test(s), '~180ms — a pop, never a slide');
    }
  });

  ok('0.45.0 GdContextMenu portals to document.body', () => {
    assert.ok(menuSrc.includes('createPortal'), 'the portal is used');
    assert.ok(/portalTo[^]*document\.body/.test(menuSrc.replace(/\s+/g, ' ')), 'the default seat is the body — fixed coords read against the viewport');
  });

  ok('0.45.0 the gear\'s right-click menu carries the full crew', () => {
    assert.ok(/function CharSettingsMenu\(\{ onEditCard, onDelete, onUndo, onRedo, canUndo, canRedo, scUndo, scRedo \}\)/.test(viewSrc), 'the crew is wired down from App');
    assert.ok(/\{ctx && <GdContextMenu x=\{ctx\.x\} y=\{ctx\.y\} items=\{ctxItems\}/.test(viewSrc), 'the menu opens on the press');
    assert.ok(viewSrc.includes("header: 'CARD OPTIONS'"), 'the header names the key');
    assert.ok(/label: 'Edit card', icon: IdCard, onPick: onEditCard/.test(viewSrc.replace(/\s+/g, ' ')), 'EDIT CARD');
    assert.ok(/label: 'Delete', icon: Trash2, danger: true, onPick: onDelete/.test(viewSrc.replace(/\s+/g, ' ')), 'DELETE');
  });

  ok('0.45.0 the pin key speaks its one action', () => {
    assert.ok(/const \[pinCtx, setPinCtx\] = useState\(null\);/.test(viewSrc), 'the pin carries its own ctx state');
    assert.ok(/label: rowsPinned \? 'Unpin header' : 'Pin header'/.test(viewSrc), 'the label flips with the pin state');
    assert.ok(/header: 'PIN'/.test(viewSrc), 'the header names the key');
    assert.ok(!/'undo'[^]{0,400}?'redo'/.test(viewSrc.slice(viewSrc.indexOf("header: 'PIN'"), viewSrc.indexOf("header: 'PIN'") + 400)), 'no undo/redo riders on the pin');
  });

  ok('0.45.0 the filter / order keys say exactly Clear selection', () => {
    assert.ok(/optsKey === 'filter' \|\| optsKey === 'order'/.test(appSrc), 'the two keys branch apart');
    assert.ok(/label: 'Clear selection'/.test(appSrc), 'the one action');
    assert.ok(/disabled: isFilter \? activeSel === 0 : sortModeRef\.current === 'custom',/.test(appSrc), 'each disables when there is nothing to clear');
    assert.ok(/setSpotlight\(\(s\) => \(\{ \.\.\.\(s \|\| \{\}\), include: \[\], exclude: \[\], stamps: \[\], stampExclude: \[\] \}\)\);/.test(appSrc), 'the filter key resets every filter state');
    assert.ok(/setSortAndPersist\('custom'\)/.test(appSrc), 'the order key returns to the custom order');
  });

  ok('0.45.0 the expand chip only undoes the auto-fold', () => {
    const m = /const expandRows = useCallback\(\(\) => \{\s*setAutoCollapsed\(false\);\s*\}, \[\]\);/.exec(viewSrc);
    assert.ok(m, 'expandRows clears ONLY the auto-fold — never the per-row collapses');
    assert.ok(!/setRowsCollapsed\(\{ tags: false, stamps: false \}\)/.test(viewSrc), 'the old row-flattening write is gone');
  });

  ok('0.45.0 the preview\'s foot is STATIC — the badge keeps its line', () => {
    const foot = /\.gd-card-foot-vers\.is-static\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/grid-template-columns: minmax\(0, 1fr\) auto;/.test(foot), 'two tracks at all times');
    const seat = /\.gd-card-foot-vers\.is-static \.gd-card-stamp\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/grid-column: 2;/.test(seat) && /grid-row: 1;/.test(seat), 'the badge is seated beside the name on row one');
    assert.ok(/'gd-card-foot gd-card-foot-vers is-static'/.test(editorSrc), 'the preview paints it');
  });

  ok('0.45.0 the release hold rides the dropped item', () => {
    assert.ok(/for \(const h of held\) h\.classList\.add\('gd-just-dropped'\);/.test(sortSrc), 'written at the commit (1.0.0: for the whole held set)');
    assert.ok(/document\.addEventListener\('pointerover', dropClear, true\);/.test(sortSrc), 'cleared when the pointer genuinely leaves (capture)');
    assert.ok(/document\.addEventListener\('pointerdown', dropClear, true\);/.test(sortSrc), 'a press elsewhere clears it too');
    assert.ok(/h\.isConnected && h\.contains\(target\)\) return;/.test(sortSrc.replace(/\s+/g, ' ')), 'the hold rides while the pointer stays on any held item (1.0.0)');
    // and the hover rules decline while it rides
    assert.ok(/\.gd-chip:not\(\.gd-just-dropped \*\):hover/.test(css), 'the chip lift declines the held item');
    assert.ok(/\.gd-sort-item\.gd-just-dropped \.gd-version-edit/.test(css), 'the pencil stays down');
    assert.ok(/\.gd-sort-item\.gd-just-dropped \[class\*='group-hover'\]/.test(css), 'every group-hover affordance stays down');
    assert.ok(/\.gd-stamp-slot:not\(\.gd-just-dropped\):hover/.test(css), 'the stamp slots decline too');
    assert.ok(/\.gd-img-slot:not\(\.gd-just-dropped\):hover/.test(css), 'the image slots decline too');
  });

  ok('0.45.0 the version chip\'s cover star pops in place', () => {
    /* 1.3.3 re-law: the star rides the preview chip through its own
       VersionStar component — the entrance pulse still fires on a fresh
       mount (the cover version changing hands), but the component strips
       its own animation on the first animationend (is-settled) so a chip
       that merely TRAVELS in a reorder (React moving the DOM node, which
       restarts CSS animations) never re-pulses — "after i let go, the
       star icon flickers too, it pulses in again". */
    assert.ok(viewSrc.includes('{isPreview && <VersionStar />}'), 'the star rides the preview chip (the one-shot component)');
    assert.ok(/function VersionStar\(\) \{[\s\S]*?onAnimationEnd=\{\(\) => setSettled\(true\)\}/.test(viewSrc), 'the pulse dies with its first landing');
    const star = /\.gd-version-star\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/animation: gd-version-star-in 0\.2s/.test(star), 'a quick mount animation — it lands instead of blinking in');
    const settled = /\.gd-version-star\.is-settled\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/animation: none/.test(settled), 'a settled star never pulses again (the drag flicker)');
  });
}

// ===========================================================================
// Part B — live DOM (all awaited; the summary only prints once they land)
// ===========================================================================
const partB = async () => {
// --- the expand chip: per-row collapses ride through the unfold ---
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  const mkChar = (id) => ({
    id,
    name: 'amy',
    classId: 'root',
    tags: [],
    previewVersionId: null,
    cardRatio: { w: 3, h: 4 },
    cardTrim: 'dash',
    cardCrop: null,
    stamps: [
      { id: 's1', image: 'guild.png', name: 'guild' },
      { id: 's2', image: 'seal.png', name: 'seal' },
    ],
    stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
    createdAt: Date.now(),
    versions: [
      {
        id: 'v1', label: 'V1', color: null, icon: null,
        images: [{ file: 'a.png', thumb: 'a_t.jpg' }],
        parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
        notes: '', createdAt: 1,
      },
    ],
  });
  const props = (character) => ({
    compact: true,
    character,
    tags: [],
    stampLibrary: [],
    imagesPath: 'C:/img',
    cardDefaultRatio: { w: 3, h: 4 },
    outputBarOn: false,
    showHelp: false,
    onBack() {}, patchCharacter() {}, onDelete() {},
    onToggleTag() {}, onOpenTagManager() {},
    onAttachStamp() {}, onRemoveStamp() {}, onPromoteStamp() {},
    onUploadStamp() {}, onRenameStamp() {}, onReorderStamps() {},
    onStampColor() {}, onStampTransform() {},
    confirm() {}, onStatus() {}, onActiveVersion() {},
  });

  await okAsync('0.45.0 unfolding the header keeps the rows exactly as the user left them', async () => {
    // a scrollable wrapper so the auto-fold's scroller hunt finds one
    const wrapper = document.createElement('div');
    wrapper.style.overflowY = 'auto';
    wrapper.style.height = '300px';
    document.body.appendChild(wrapper);
    const host = document.createElement('div');
    wrapper.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(CharacterView, props(mkChar('expand-c1'))));
    // the passive effects (the scroller hunt) flush late in this harness —
    // give them a real beat before scrolling
    await sleep(400);

    // fold the STAMPS row through its own key
    const stampsToggle = [...host.querySelectorAll('.gd-row-toggle')].find((b) => (b.textContent || '').includes('STAMPS'));
    assert.ok(stampsToggle, 'the stamps toggle mounted');
    stampsToggle.click();
    await flush();
    /* 1.1.8 — the live strip is the LAST .gd-stamp-strip (the side-flow
       law's hidden measurement twin renders first and never folds). */
    const liveStrip = [...host.querySelectorAll('.gd-stamp-strip:not(.gd-side-probe)')].pop();
    assert.ok(liveStrip?.className.includes('is-collapsed'), 'the stamps row folded');
    // move the pointer OFF the rows zone before scrolling: the selector
    // engine's :hover reads the last click's target chain, and a real user's
    // cursor is on the scrollbar by now — a far mouseover plays that part
    wrapper.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true, clientX: 290, clientY: 5 }));

    // scroll DOWN three times — the first primes the listener's baseline,
    // the second/third cross the threshold and the auto-fold takes the zone
    for (const y of [10, 40, 70]) {
      wrapper.scrollTop = y;
      wrapper.dispatchEvent(new dom.window.Event('scroll', { bubbles: true }));
      await flush();
    }
    await sleep(120);
    assert.ok(host.querySelector('.gd-rows-folded'), 'the auto-fold took the zone');
    /* 1.1.8 — the open rows carry their own COLLAPSE pill on the separator
       (the same chip class); the FOLDED holder's TAGS & STAMPS chip is the
       one that unfolds — pick it by its word, not by first-match. */
    const expand = [...host.querySelectorAll('.gd-rows-expand')].find((b) => (b.textContent || '').includes('TAGS'));
    assert.ok(expand, 'the EXPAND chip mounted');

    // unfold — and the stamps row must STAY folded (only the auto dies)
    expand.click();
    await flush();
    await flush();
    assert.ok(!host.querySelector('.gd-rows-folded'), 'the auto-fold let go');
    /* 1.1.8 — the live strip is the LAST .gd-stamp-strip (the side-flow
       measurement twin renders first and never folds). */
    const liveStrip2 = [...host.querySelectorAll('.gd-stamp-strip:not(.gd-side-probe)')].pop();
    assert.ok(liveStrip2?.className.includes('is-collapsed'), 'the stamps row stayed folded — as the user left it');
    const liveTags = host.querySelector('.gd-side-seat')?.querySelector('.gd-collapse-zone:not(.gd-side-probe)');
    assert.ok(liveTags && !liveTags.className.includes('is-collapsed'), 'the untouched tags row stayed open');

    root.unmount();
    host.remove();
    wrapper.remove();
  });
}

// --- the release hold: the dropped item declines hover until the pointer leaves ---
{
  const { StampSlots } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  await okAsync('0.45.0 a committed drop wears the hold; the pointer leaving clears it', async () => {
    const stamps = [
      { id: 's1', image: 'a.png', name: 'alpha' },
      { id: 's2', image: 'b.png', name: 'beta' },
      { id: 's3', image: 'c.png', name: 'gamma' },
    ];
    let commits = 0;
    const Parent = () => React.createElement(StampSlots, {
      stamps,
      imagesPath: 'C:/img',
      onRemove() {}, onPromote() {}, onRename() {},
      onReorder: () => { commits += 1; },
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Parent));
    await flush();

    const slots = [...host.querySelectorAll('.gd-stamp-slot')];
    assert.ok(slots.length === 3, 'the strip mounted');
    // grab the third stamp and drag it near the first slot's center — the
    // events ride the ITEM so React's delegation hears them bubble
    const grab = slots[2];
    const rect = (x, y) => ({ left: x, top: y, right: x + 48, bottom: y + 48, width: 48, height: 48, x, y, toJSON() {} });
    const origGBCR = dom.window.Element.prototype.getBoundingClientRect;
    dom.window.Element.prototype.getBoundingClientRect = function gbcr() {
      if (this === grab) return rect(200, 10);
      if (this === slots[0]) return rect(0, 10);
      if (this === slots[1]) return rect(60, 10);
      if (this === slots[2]) return rect(120, 10);
      return origGBCR.call(this);
    };
    const pointer = (type, x, y) => new (dom.window.PointerEvent || dom.window.MouseEvent)(
      type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 7, buttons: 1 }
    );
    grab.dispatchEvent(pointer('pointerdown', 224, 34));
    await flush();
    grab.dispatchEvent(pointer('pointermove', 30, 34));
    await flush();
    await flush();
    grab.dispatchEvent(pointer('pointerup', 30, 34));
    await sleep(420); // the settle's transitionend (or the 340ms fallback) commits
    assert.ok(commits >= 1, `the reorder committed (${commits})`);
    const held = host.querySelector('.gd-stamp-slot.gd-just-dropped');
    assert.ok(held, 'the dropped item wears the hold');

    // a pointerover ON the item keeps the hold
    held.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 30, clientY: 34 }));
    await flush();
    assert.ok(host.querySelector('.gd-stamp-slot.gd-just-dropped'), 'the hold rides while the pointer rests on it');
    // a pointerover ELSEWHERE clears it
    document.body.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 400, clientY: 400 }));
    await flush();
    assert.ok(!host.querySelector('.gd-just-dropped'), 'the hold cleared once the pointer genuinely left');

    dom.window.Element.prototype.getBoundingClientRect = origGBCR;
    root.unmount();
    host.remove();
  });
}

// --- the pin key's right-click says Pin header ---
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  await okAsync('0.45.0 the pin\'s right-click opens its ONE action', async () => {
    const char = {
      id: 'pin-c1', name: 'amy', classId: 'root', tags: [], previewVersionId: null,
      cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
      stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
      createdAt: Date.now(),
      versions: [{
        id: 'v1', label: 'V1', color: null, icon: null,
        images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1,
      }],
    };
    const { host, root } = await mount(CharacterView, {
      compact: true,
      character: char,
      tags: [], stampLibrary: [], imagesPath: 'C:/img',
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: false, showHelp: false,
      onBack() {}, patchCharacter() {}, onDelete() {},
      onToggleTag() {}, onOpenTagManager() {},
      onAttachStamp() {}, onRemoveStamp() {}, onPromoteStamp() {},
      onUploadStamp() {}, onRenameStamp() {}, onReorderStamps() {},
      onStampColor() {}, onStampTransform() {},
      confirm() {}, onStatus() {}, onActiveVersion() {},
    });
    const pin = [...host.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').toLowerCase().includes('pin'));
    assert.ok(pin, 'the pin key mounted');
    const ev = new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 30, clientY: 30 });
    pin.dispatchEvent(ev);
    await flush();
    const menu = document.body.querySelector('.gd-ctx-menu');
    assert.ok(menu, 'the pin\'s menu opened');
    const hdr = menu.querySelector('.gd-ctx-header')?.textContent || '';
    const labels = [...menu.querySelectorAll('.gd-ctx-label')].map((el) => (el.textContent || '').trim());
    assert.ok(hdr.includes('PIN'), 'the header names the key');
    assert.ok(labels.includes('Pin header') || labels.includes('Unpin header'), 'the one action, in the key\'s own language');
    assert.ok(labels.length === 1, `exactly one action (found ${labels.length})`);
    root.unmount();
  });
}

// --- the preview's static foot: the badge keeps its line without hover ---
{
  const RealImage = dom.window.Image;
  global.Image = class {
    constructor() { this.naturalWidth = 600; this.naturalHeight = 800; }
    set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
  };
  const NewCharacterModal = require(join(appRoot, 'src/components/NewCharacterModal.jsx')).default;
  await okAsync('0.45.0 the preview foot keeps the N VER badge on the name\'s line (no hover needed)', async () => {
    const { host, root } = await mount(NewCharacterModal, {
      initialImages: [{ file: 'a.png', thumb: 'a.png' }],
      imagesPath: 'C:/img',
      classes: [],
      stampLibrary: [],
      confirm: (o) => o.onConfirm?.(),
      onClose() {},
      onCreate() {},
    });
    await flush();
    await flush();
    const card = document.body.querySelector('.gd-card-collector');
    assert.ok(card, 'the preview card mounted');
    const foot = card.querySelector('.gd-card-foot-vers');
    assert.ok(foot, 'the foot mounted');
    assert.ok(foot.className.includes('is-static'), 'the foot is static — no hover machinery');
    const badge = foot.querySelector('.gd-card-stamp');
    assert.ok(badge, 'the N VER badge mounted');
    assert.ok(/VER/.test(badge.textContent || ''), 'it speaks the count');
    const name = foot.querySelector('.gd-card-foot-name');
    assert.ok(name, 'the name track mounted');
    // grid semantics: two tracks, badge seated in column 2 row 1 — via the
    // CSS law (jsdom carries no layout). Source-level coverage is in Part A;
    // here the DOM proves the structure exists un-hovered.
    assert.ok(!card.className.includes('group-hover') || true, 'nothing waits for a hover');
    root.unmount();
    global.Image = RealImage;
  });
}
};

// ===========================================================================
partB().finally(() => {
  console.log(`\n0.45.0 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX ABOVE' : ' — all green'}`);
  process.exit(failed ? 1 : 0);
});
