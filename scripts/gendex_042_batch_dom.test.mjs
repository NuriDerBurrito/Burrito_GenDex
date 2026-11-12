#!/usr/bin/env node
// Behavioral DOM + source checks for the 0.42.0 batch:
//   · THE CREATION PREVIEW FINALLY EDITS THE CARD — the window's onChange
//     carries the crop, the draft stores it, submit lands it (drag-to-place
//     and scroll-to-zoom move the picture at last), and the wheel direction
//     matches the huge viewer (scroll up = zoom IN — the old factor was
//     inverted, so every scroll-up pushed the card to its furthest
//     zoomed-OUT and "it just zooms out right away").
//   · THE MARKS ARE WELDED AND ON TOP — the COVER / TOP / RING marks are
//     plain absolute spans (no framer shared-layout flight to drift on
//     scroll or window resize), and while a sort runs their slots sit at
//     z 45, above the dragged tile (z 40) — "the top label/outline should
//     be above their layer".
//   · THE VIEWER IS A MODAL CITIZEN WITH ITS OWN MENU — data-gd-modal on
//     the overlay (no app regions bleeding through, the stage's auto-switch
//     rests while it is open), and a right-click menu: set as cover, open
//     the manager (managerSignal), copy image, reset view, close.
//   · STICK-BY-FILE — the stage and the huge viewer anchor on the image's
//     FILE, not its slot: reorders never change the picture on screen; a
//     deleted anchor re-anchors on a survivor and sticks.
//   · THE PINNED MODAL — the creation window's cap drag pins the window's
//     seat (no re-centering) while the content flows LIVE (the 0.41 height
//     reserve — the "parks then snaps back" — is gone).
//   · THE FOOT'S THIRD PASS — a static [title · badge / date-full-width]
//     grid, no animated tracks, the badge fades as one fully-formed block
//     (the half-second grey line between the art and the foot is gone at
//     the root), the date can never be cropped by the right side, and a
//     colored foot paints as a plate (sheen + inner rim), not a flat slab.
//   · THE VERSION STRIP GREW A MENU — right-click any chip: edit details,
//     set as cover version, delete (confirm-gated); the settings window's
//     COVER key acts on the EDITED version, not the viewed one; the edit
//     pencil colors in on hover.
//   · THE FULL-WINDOW VIEW IS FRAMED — hairline above the details, closing
//     hairline below, and the preview column is STICKY under the measured
//     header height while the prompts scroll.
//   · THE STAMPS COLLAPSE CALMED DOWN — the .is-collapsed class carries no
//     height of its own (the 34px crush frame is gone) and single-row zones
//     skip the clamp entirely.
//   · CLASS DELETE, UNDONE PROPERLY — the EDIT CLASS window stays open
//     under the confirm; CANCEL (or the confirm's isolated Escape) returns
//     to it; only DELETE closes both. The right-click path never opens the
//     editor.
//   · THE CONFETTI STOPPED REPEATING — a big 480px Math.random scatter
//     (per app launch, stable in-session), edge margins so nothing clips,
//     a cell scaffold so no pocket runs empty.
//   · MUFFIN + NO THEME DESCRIPTIONS + THE FONT SETTING (Look tab).
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
  console.log('jsdom unavailable — 0.42.0 batch DOM test skipped (dev-only dependency)');
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

// ===========================================================================
// Part A — the creation preview finally edits the card (crop wiring + wheel)
// ===========================================================================
{
  const modalSrc = src('src/components/NewCharacterModal.jsx');
  const editorSrc = src('src/components/CardLookEditor.jsx');

  ok('0.42.0 the creation window CARRIES the crop (drag + zoom land)', () => {
    assert.ok(/const \[crop, setCrop\] = useState\(null\);/.test(modalSrc), 'the crop is a draft value');
    assert.ok(/crop=\{crop\}/.test(modalSrc), 'the preview receives it');
    assert.ok(/setCrop\(c\);/.test(modalSrc), 'the onChange commits it');
    // 1.4.3 supersede: image motion rides the same object (the sway switch).
    // 1.4.5 SUPERSEDED: the submit's card object carries the coat's reach
    // switches (trim + stamp) with the family — one object, one create.
    assert.ok(/card: \{ ratio, trim, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishOnStamp, imageMotion \}/.test(modalSrc), 'CREATE ships it (the finish family rides the same object)');
  });

  ok('0.42.0 the preview zoom speaks the 0.45 law (the wheel is RETIRED)', () => {
    // 0.45.0 — the scroll-zoom was removed for good on both surfaces; the
    // preview's zoom lives in the three-key row (out / in / reset).
    assert.ok(!/onWheel/.test(editorSrc), 'no wheel handler on the preview');
    assert.ok(!/deltaY/.test(editorSrc), 'no wheel math anywhere in the editor');
    assert.ok(editorSrc.includes('className="gd-preview-zoom"'), 'the zoom key row mounted');
    assert.ok(/stepZoom\(1 \/ 0\.9\)/.test(editorSrc), 'the OUT key steps out');
    assert.ok(/stepZoom\(0\.9\)/.test(editorSrc), 'the IN key steps in');
    assert.ok(/onClick=\{\(\) => applyCrop\(null\)\}/.test(editorSrc), 'the RESET key returns to the auto fit');
  });

  ok('0.42.0 the creation cover marks are WELDED + outrank the ride (0.45.0: they pop)', () => {
    assert.ok(modalSrc.includes('className="gd-thumb-topmark"'), 'the marks ride one welded wrapper');
    assert.ok(modalSrc.includes('<span className="gd-thumb-ring" />'), 'plain ring span');
    assert.ok(modalSrc.includes('<span className="gd-thumb-badge">COVER</span>'), 'plain badge span');
    assert.ok(/<AnimatePresence initial=\{false\}>/.test(modalSrc), '0.45.0: the hand-off pops through AnimatePresence');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(modalSrc), 'keyed by the cover image\'s own file');
    assert.ok(/exit=\{\{ opacity: 0, scale: 0\.6 \}\}/.test(modalSrc), 'pop out on the demoted image');
    assert.ok(!/useFlipMark/.test(modalSrc), 'no FLIP machinery left');
    assert.ok(!/layoutId/.test(modalSrc), 'no shared-layout flight left');
    assert.ok(/\.\.\.\(!isDragged && i === 0 && sorting \? \{ zIndex: 45 \} : null\),/.test(modalSrc), 'the parked cover slot keeps its marks at 45 while sorting');
  });
}

// ===========================================================================
// Part B — the stamp / manager marks: welded + z-lift
// ===========================================================================
{
  const stampSrc = src('src/components/StampEditModal.jsx');
  const managerSrc = src('src/components/ImageManagerModal.jsx');

  ok('0.42.0 the stamp TOP ring + tab are welded, the top slot outranks the ride (0.45.0: they pop)', () => {
    assert.ok(stampSrc.includes('className="gd-stamp-topmark"'), 'the marks ride one welded wrapper');
    assert.ok(stampSrc.includes('<span className="gd-stamp-topring" />'), 'welded ring');
    assert.ok(stampSrc.includes('<span className="gd-stamp-slot-top">TOP</span>'), 'welded tab');
    assert.ok(/<AnimatePresence initial=\{false\}>/.test(stampSrc), '0.45.0: the hand-off pops through AnimatePresence');
    assert.ok(/key=\{stamps\[0\]\.id\}/.test(stampSrc), 'keyed by the top stamp\'s own id');
    assert.ok(!/useFlipMark/.test(stampSrc), 'no FLIP machinery left');
    assert.ok(/\(!isDragged && \(isTop \|\| i === 0\) && sorting \? \{ zIndex: 45 \} : null\)/.test(stampSrc), 'the parked TOP slot keeps z 45 while sorting');
    assert.ok(/\.\.\.\(isDragged \? \{ zIndex: 50 \} : null\)/.test(stampSrc), '0.47.0: the dragged slot rides at 50');
  });

  ok('0.42.0 the manager COVER badge + SELECTION ring are welded + lifted (0.45.0: they pop)', () => {
    assert.ok(managerSrc.includes('className="gd-img-slot-cover"'), 'welded badge');
    assert.ok(managerSrc.includes('className="gd-img-slot-ring"'), 'welded ring');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(managerSrc), '0.45.0: the badge is keyed by the cover file');
    assert.ok(/key=\{`ring-\$\{img\.file\}`\}/.test(managerSrc), 'the ring is keyed by the selected file');
    assert.ok(/<AnimatePresence initial=\{false\}>/.test(managerSrc), 'both pop through AnimatePresence');
    assert.ok(!/useFlipMark/.test(managerSrc), 'no FLIP machinery left');
    assert.ok(/const markZ = !isDragged && sorting && \(i === 0 \|\| i === selectedIndex\) \? 45 : null;/.test(managerSrc), 'the parked cover + selected slots keep z 45 while sorting');
    assert.ok(/\.\.\.\(isDragged \? \{ zIndex: 50 \} : null\)/.test(managerSrc), '0.47.0: the dragged tile rides at 50, above every mark');
  });
}

// ===========================================================================
// Part C — the viewer: modal citizen, own menu, stick-by-file
// ===========================================================================
{
  const viewerSrc = src('src/components/ImageViewer.jsx');
  const stageSrc = src('src/components/ImageStage.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');

  ok('0.42.0 the viewer declares itself a modal citizen + speaks its own menu', () => {
    assert.ok(/data-gd-modal="1"/.test(viewerSrc), 'data-gd-modal on the overlay');
    assert.ok(viewerSrc.includes('onContextMenu={onViewerContext}'), 'its own right-click handler');
    assert.ok(viewerSrc.includes("'Set as cover image'"), 'set as cover item');
    assert.ok(viewerSrc.includes("'Image manager'"), 'manager item');
    assert.ok(viewerSrc.includes("'Copy image'"), 'copy item');
    assert.ok(viewerSrc.includes("onOpenManager?.()"), 'the manager handoff prop');
    const z = /\.gd-ctx-menu\s*\{[^}]*z-index:\s*950;/s.exec(css)?.[0] || '';
    assert.ok(z, 'the ctx menu sits at z 950 — above the viewer (900), under toasts (1100)');
  });

  ok('0.42.0 the stage menu gained VIEW IMAGE + the walk rests while menus are open', () => {
    assert.ok(stageSrc.includes("{ id: 'view', label: 'View image', icon: Eye"), 'view image item');
    assert.ok(stageSrc.includes("querySelector('[data-gd-modal], .gd-ctx-menu')"), 'auto-swipe rests under modals AND open menus');
  });

  ok('0.42.0 STICK-BY-FILE — the stage anchors on the file, not the slot', () => {
    assert.ok(/const \[pinnedFile, setPinnedFile\] = useState\(null\);/.test(stageSrc), 'the pinned file state');
    assert.ok(/images\.findIndex\(\(im\) => im\.file === pinnedFile\)/.test(stageSrc), 'the view follows the file');
    assert.ok(!/setIndex\(to\)/.test(stageSrc), 'no setIndex(to) after a reorder commit');
  });

  ok('0.42.0 the huge viewer anchors on the file too (delete re-anchors + sticks)', () => {
    assert.ok(/const \[viewer, setViewer\] = useState\(null\); \/\/ \{ file \}/.test(viewSrc), 'the seat carries the file');
    assert.ok(/setViewer\(\{ file: version\.images\[0\]\.file \}\)/.test(viewSrc), 'a lost anchor re-anchors on a survivor');
    assert.ok(/onOpenViewer=\{\(i\) => setViewer\(\{ file: version\.images\[i\]\?\.file \?\? null \}\)\}/.test(viewSrc), 'opens on the file');
    assert.ok(/managerSignal=\\{managerSignal\\}/.test(viewSrc) || /managerSignal=\{managerSignal\}/.test(viewSrc), 'the remote manager opener is wired');
    assert.ok(/setManagerSignal\(\(s\) => s \+ 1\);/.test(viewSrc), 'the viewer menu bumps the signal');
  });
}

// ===========================================================================
// Part D — the pinned modal (live flow, frozen seat)
// ===========================================================================
{
  const modalSrc = src('src/components/Modal.jsx');
  const createSrc = src('src/components/NewCharacterModal.jsx');

  ok('0.42.0 the Modal pins (position freeze) while the creation grip drags', () => {
    assert.ok(/pinned = false,/.test(modalSrc), 'the pinned prop exists');
    assert.ok(/setPinTop/.test(modalSrc), 'the seat is captured at pin start');
    assert.ok(/transition: 'none'/.test(modalSrc), 'no height tween while pinned');
    assert.ok(/pinned=\{capLive\}/.test(createSrc), 'the creation window pins during the cap drag');
    assert.ok(!/gridReserveH/.test(createSrc), 'the 0.41 fake-height reserve is gone — the layout follows the grip live');
  });
}

// ===========================================================================
// Part E — the foot's third pass (static grid, no transient, date untouchable)
// ===========================================================================
{
  const gridSrc = src('src/components/GridView.jsx');

  ok('0.42.0 (0.44 amended) the foot grid — one track at rest, badge seated on hover', () => {
    const foot = /\.gd-card-foot-vers\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/grid-template-columns:\s*minmax\(0, 1fr\);/.test(foot), '0.44.0: ONE track at rest — the name owns the whole foot');
    assert.ok(!/transition:/.test(foot), 'no animated tracks on the foot itself');
    assert.ok(!/0fr/.test(foot), 'no 0fr track anywhere');
    const vers = /^\.gd-card-vers \{[^}]*\}/ms.exec(css)?.[0] || '';  // 1.3.9: line-anchored — the foot's new z-step rule no longer shadows it
    assert.ok(/opacity 0\.14s ease/.test(vers), 'the badge fades');
    assert.ok(/position: absolute;/.test(vers), '0.44.0: the resting badge claims no room (out of flow)');
    assert.ok(/\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers[\s\S]{0,160}?position: static;/.test(css), '0.44.0: hover seats it back in flow (1.1.4: gated on has-vers, and the seat wears the title line height — nothing moves)');
    assert.ok(!/delay/.test(vers), 'no gated delays left to half-paint');
    assert.ok(/\.gd-card-meta-line/.test(css) && /grid-column: 1 \/ -1/.test(/\.gd-card-meta-line\s*\{[^}]*\}/s.exec(css)?.[0] || ''), 'the date spans the full width');
    assert.ok(gridSrc.includes('gd-card-meta-line'), 'the grid card renders the date on its own row');
    assert.ok(gridSrc.includes('backgroundColor: character.cardColor'), 'the colored foot paints through backgroundColor (plate-friendly)');
  });

  ok('0.42.0 a colored foot is a plate, not a slab', () => {
    const colored = /\.gd-card-foot-vers\.is-colored\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/linear-gradient/.test(colored), 'the vertical sheen');
    // 1.3.7 supersede: the TOP rim is retired ("a white ish line that
    // seperates them" — the rimmed first row read as a line at the seam);
    // the grounded base rim stays, the bloom alone carries the top's light
    assert.ok(!/inset 0 1px 0/.test(colored), 'the top rim is retired (1.3.7 — a gradient, never a line)');
    assert.ok(/inset 0 -2px 0/.test(colored), 'the base shade rim stays');
  });

  ok('0.42.0 the preview foot matches the grid card (same grid law)', () => {
    const editorSrc = src('src/components/CardLookEditor.jsx');
    assert.ok(editorSrc.includes('gd-card-foot-vers'), 'the preview foot wears the same class');
    assert.ok(editorSrc.includes('gd-card-meta-line'), 'the preview date rides its own row');
    assert.ok(editorSrc.includes('backgroundColor: cardColor'), 'the preview colored foot paints the same way');
  });
}

// ===========================================================================
// Part F — the version strip's menu, the honest cover key, the hover pencil
// ===========================================================================
{
  ok('0.42.0 right-click a version chip — edit details / cover / delete', () => {
    assert.ok(/const \[verCtx, setVerCtx\] = useState\(null\);/.test(src('src/components/CharacterView.jsx')), 'the menu state');
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(viewSrc.includes("'Edit version details'"), 'edit details item');
    assert.ok(viewSrc.includes("'Set as cover version'"), 'cover item');
    assert.ok(viewSrc.includes("'Delete version'"), 'delete item');
    assert.ok(/onContextMenu=\{\(e\) => \{/.test(viewSrc), 'the chips carry the handler');
  });

  ok('0.42.0 the cover key acts on the EDITED version (not the viewed one)', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(/const togglePreviewFor = \(v\) => \{/.test(viewSrc), 'the addressable cover toggle');
    assert.ok(/onTogglePreview=\{\(\) => togglePreviewFor\(editingVersion\)\}/.test(viewSrc), 'the settings window uses the EDITED version');
    assert.ok(/onPick: \(\) => togglePreviewFor\(v\),/.test(viewSrc), 'the strip menu covers ANY version without selecting it');
  });

  ok('0.42.0 the version edit pencil colors in on hover', () => {
    assert.ok(/className="gd-version-edit absolute/.test(src('src/components/CharacterView.jsx')), 'the pencil carries the class');
    const rule = /\.gd-version-edit:hover\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/var\(--gd-accent\)/.test(rule), 'it fills with the accent');
  });
}

// ===========================================================================
// Part G — the framed full-window view + the sticky preview
// ===========================================================================
{
  const viewSrc = src('src/components/CharacterView.jsx');

  ok('0.42.0 the details section is framed (top rule + closing rule)', () => {
    assert.ok((viewSrc.match(/gd-detail-rule/g) || []).length >= 2, 'two rules render (above + below)');
    assert.ok(/\.gd-detail-rule\s*\{[^}]*border-top/.test(css), 'the rule paints a hairline');
  });

  ok('0.42.0 the preview column rides along (sticky under the measured header)', () => {
    assert.ok(/position: 'sticky'/.test(viewSrc), 'the column is sticky');
    assert.ok(/top: headH \? headH \+ 10 : 66/.test(viewSrc), 'its top tracks the live header height');
    assert.ok(/const ro = new ResizeObserver\(\(\) => setHeadH\(Math\.round\(el\.offsetHeight\)\)\);/.test(viewSrc), 'the header is measured through a ResizeObserver');
    assert.ok(/ref=\{headRef\}/.test(viewSrc), 'the header carries the ref');
  });
}

// ===========================================================================
// Part H — the stamps collapse calmed down
// ===========================================================================
{
  ok('0.42.0 the collapse class carries no height; single-row zones skip the clamp', () => {
    const collapsed = /\.gd-collapse-zone\.is-collapsed\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(!/max-height/.test(collapsed), 'no 34px crush frame from the class');
    assert.ok(/overflow: hidden/.test(collapsed), 'the clip guard stays');
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(/const natural = el\.scrollHeight \|\| el\.offsetHeight \|\| 0;/.test(viewSrc), 'the natural height is measured');
    assert.ok(/const fitsKept = natural <= measureRows\(el\) \+ 2;/.test(viewSrc), 'a zone that fits its kept rows is left alone entirely');
  });
}

// ===========================================================================
// Part I — class delete, undone properly
// ===========================================================================
{
  const sidebarSrc = src('src/components/ClassSidebar.jsx');
  const dialogsSrc = src('src/components/Dialogs.jsx');

  ok('0.42.0 cancel returns to the EDIT CLASS window (editor stays open)', () => {
    assert.ok(!/setModal\(null\);\s*\n\s*askDelete\(victim\);/.test(sidebarSrc), 'the editor is NOT dropped when the confirm opens');
    assert.ok(/onConfirm: \(\) => \{\s*setModal\(null\);\s*onDeleteClass\(victim\.id\);/.test(sidebarSrc), 'only DELETE closes the editor');
  });

  ok('0.42.0 the confirm owns its Escape (isolation via capture-phase stop)', () => {
    assert.ok(/document\.addEventListener\('keydown', onKey, true\);/.test(dialogsSrc), 'capture-phase listener');
    assert.ok(/e\.stopPropagation\(\);/.test(dialogsSrc), 'the press stops at the confirm');
  });

  // DOM: press DELETE CLASS inside the editor with a confirm that does NOT
  // auto-confirm — the editor window must STILL be in the DOM afterwards.
  await okAsync('0.42.0 the DOM law: cancel keeps the editor, DELETE closes it', async () => {
    const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
    document.body.innerHTML = '<div id="root"></div>';
    const root = createRoot(document.getElementById('root'));
    let confirmOpts = null;
    root.render(
      React.createElement(ClassSidebar, {
        classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 0 }],
        characters: [],
        selectedClassId: 'cl1',
        dragRef: { current: null },
        onSelectClass: () => {},
        onAddClass: () => {},
        onRenameClass: () => {},
        onDeleteClass: () => {},
        onMoveClass: () => {},
        onAssignCharacter: () => {},
        onNewCharacter: () => {},
        confirm: (opts) => { confirmOpts = opts; }, // the ask opens; nothing confirmed
        onStatus: () => {},
        editClassRequest: 'cl1',
        onEditClassHandled: () => {},
      })
    );
    // yield for effects + the lazy portal (jsdom effects land slowly under
    // suite load — 400ms is the honest wait)
    await new Promise((r) => setTimeout(r, 400));
    const delBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('DELETE CLASS'));
    assert.ok(delBtn, 'the editor carries the DELETE CLASS key');
    delBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    assert.ok(confirmOpts && confirmOpts.title === 'DELETE CLASS', 'the confirm was asked');
    assert.ok(confirmOpts.danger === true, 'the ask is danger-toned');
    // the editor window is STILL mounted (cancel would return straight to it)
    assert.ok(document.querySelector('.gd-modal-card'), 'the EDIT CLASS window stays open under the confirm');
    // and confirming closes it
    confirmOpts.onConfirm();
    await new Promise((r) => setTimeout(r, 400));
    assert.ok(!document.querySelector('.gd-modal-card'), 'DELETE closes the editor');
    root.unmount();
    document.body.innerHTML = '<div id="root"></div>';
  });
}

// ===========================================================================
// Part J — the confetti that stopped repeating
// ===========================================================================
{
  const texSrc = src('src/utils/textures.js');

  ok('0.42.0 confetti is a big random scatter, not a repeating lattice', () => {
    assert.ok(/confettiScatter\(\{ tile: 480, color: c, cSoft \}\)/.test(texSrc), 'the 480px build');
    assert.ok(/backgroundSize: '480px 480px'/.test(texSrc), 'the field is 480px');
    assert.ok(!/confettiTile\(/.test(texSrc), 'the seeded 64px tile is gone');
    assert.ok(/const reach = 4\.5;/.test(texSrc), 'the edge margin exists (no clipping)');
    assert.ok(/const lo = reach;/.test(texSrc) && /const hi = step - reach;/.test(texSrc), 'every mark is placed inside the margins');
    assert.ok(/Math\.random\(\) < 0\.14/.test(texSrc), 'the skip keeps breathing room without pockets');
  });

  ok('0.42.0 Muffin, no descriptions, and the FONT setting', () => {
    const constantsSrc = src('src/constants/index.js');
    assert.ok(/name: 'Muffin',/.test(constantsSrc), 'the craft theme answers to Muffin');
    assert.ok(!/name: 'Bastel',/.test(constantsSrc), 'Bastel is gone');
    const settingsSrc = src('src/components/SettingsModal.jsx');
    assert.ok(!settingsSrc.includes('gd-theme-desc'), 'the description line is gone from the theme cards');
    assert.ok(/BODY_FONT_OPTIONS/.test(constantsSrc), 'the font options ship');
    assert.ok(/uiFont: 'mono',/.test(constantsSrc), 'the default body font');
    assert.ok(settingsSrc.includes("set('uiFont', id)"), 'the Look tab writes it');
    assert.ok(/uiFont: \['mono', 'grotesk', 'serif'\]\.includes/.test(src('src/utils/helpers.js')), 'it sanitizes (1.0.0: the custom seat retired)');
    assert.ok(/BODY_FONT_STACKS/.test(src('src/utils/theme.js')), 'theme.js resolves the stacks');
    assert.ok(/--gd-body-font/.test(src('src/utils/theme.js')), 'the var is set');
    assert.ok(/var\(--gd-body-font/.test(css), 'the body reads the var');
    assert.ok(/themeUiFont \|\| 'mono'/.test(src('src/App.jsx')), 'the app wires it');
  });
}

// ===========================================================================
// Part K — shadows behave (mumei blobs, drag lift, ribbon group)
// ===========================================================================
{
  ok('0.42.0 the mumei chip shadow follows the painted blob; the drag lift is soft', () => {
    const mumei = /\[data-theme='mumei'\] \.gd-chip\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/drop-shadow\(/.test(mumei), 'drop-shadow on the silhouette');
    assert.ok(/box-shadow: none/.test(mumei), 'no box-shadow rectangle');
    const drag = /\.gd-version-item\.is-dragging\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/color-mix\(in srgb, var\(--gd-ink\) 38%, transparent\)/.test(drag), 'the soft ink-tinted lift');
    assert.ok(/\.gd-ribbon-shadow\s*\{[^}]*\}/s.test(css) && !/drop-shadow/.test(/\.gd-ribbon-shadow\s*\{[^}]*\}/s.exec(css)?.[0] || ''), 'ribbons carry no per-piece shadow');
    assert.ok(/\.gd-card-ribbons\s*\{[^}]*filter: drop-shadow/s.test(css), 'one shared shadow under the whole ribbon group');
  });
}

// ===========================================================================
// Part L — a live render smoke: the creation window mounts with the crop
// wiring in place (server-render path — the lazy body portal renders the
// window inline, exactly what the harness can see).
// ===========================================================================
{
  const { renderToString } = require('react-dom/server');
  const { default: NewCharacterModal } = require(join(appRoot, 'src/components/NewCharacterModal.jsx'));
  ok('0.42.0 the creation window renders (drag + zoom wired through the crop)', () => {
    const out = renderToString(
      React.createElement(NewCharacterModal, {
        initialImages: [{ file: 'a.png', thumb: 'a.png' }],
        imagesPath: 'imgs',
        defaultRatio: { w: 3, h: 4 },
        classes: [],
        stampLibrary: [],
        showHelp: false,
        confirm: () => {},
        onClose: () => {},
        onCreate: () => {},
      })
    );
    assert.ok(out.includes('data-gd-modal'), 'the window rendered');
    assert.ok(out.includes('CREATE'), 'the CREATE key exists');
    assert.ok(out.includes('gd-card-foot-vers'), 'the preview foot wears the new grid class');
    assert.ok(out.includes('gd-thumb-badge'), 'the first image wears the welded COVER badge');
  });
}

console.log(failed ? `\n${passed} passed, ${failed} failed` : `\n${passed} 0.42.0 batch DOM checks passing`);
process.exit(failed ? 1 : 0);
