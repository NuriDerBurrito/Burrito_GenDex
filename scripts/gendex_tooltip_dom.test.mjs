// 0.29.0 — THE TOOLTIP LAYER (GdTooltips.jsx), behavioral DOM test. The
// layer is now a TOTAL title stripper: a document-wide MutationObserver
// moves every `title` attribute into data-gd-tip-src the moment it appears
// (initial sweep included) — no element ever keeps a title, so the OS's
// plain white box physically cannot show ("the old tooltip sometimes
// appears, fix that"). Hovering reads the stash and paints the .gd-tip pill;
// a gd-tooltips-mode event turns the pills off entirely (the setting's
// app-wide switch). Run: node --test scripts/gendex_tooltip_dom.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

// 0.32.0 — the app root resolves RELATIVE to this file (the script used to
// hardcode /home/z/my-project/burrito-app/Burrito_GenDex_0.23.0 — a stale
// machine-local path that broke the test anywhere else). scripts/ sits one
// level under the project root.
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const appRequire = createRequire(join(appRoot, 'package.json'));

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.MutationObserver = dom.window.MutationObserver;
global.CustomEvent = dom.window.CustomEvent;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.IS_REACT_ACT_ENVIRONMENT = false;

const React = appRequire('react');
const { createRoot } = appRequire('react-dom/client');
const babel = appRequire('@babel/core');

require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      [appRequire.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
      [appRequire.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};
for (const ext of ['.png', '.jpg', '.ico', '.woff2']) require.extensions[ext] = (m) => { m.exports = ''; };

const { default: GdTooltips } = appRequire(join(appRoot, 'src/components/GdTooltips.jsx'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
const ok = (name, fn) => {
  const result = fn();
  const done = () => {
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  };
  if (result && typeof result.then === 'function') return result.then(done);
  done();
  return Promise.resolve();
};

const run = async () => {
  // Mount the layer + a titled button.
  const host = document.getElementById('host');
  const root = createRoot(host);
  await new Promise((resolve) => {
    root.render(
      React.createElement(
        'div',
        null,
        React.createElement(GdTooltips),
        React.createElement('button', { id: 'btn', title: 'Save everything to disk' }, 'SAVE'),
        React.createElement('button', { id: 'plain' }, 'NO TITLE')
      )
    );
    setTimeout(resolve, 30);
  });

  const btn = document.getElementById('btn');
  const fire = (type, target, related = null) =>
    target.dispatchEvent(
      new dom.window.PointerEvent(type, { bubbles: true, cancelable: true, relatedTarget: related, pointerId: 1 })
    );
  const tip = () => document.querySelector('.gd-tip');
  const mode = (on) =>
    document.dispatchEvent(new dom.window.CustomEvent('gd-tooltips-mode', { detail: { on } }));

  await sleep(60); // the stripper's initial sweep runs in the mount effect

  ok('the layer mounts with its pill parked invisible (pure behavior otherwise)', () => {
    // the wrapper div holds the two buttons ONLY — GdTooltips contributed no node
    assert.equal(host.firstElementChild.childElementCount, 2);
    assert.ok(tip(), 'the one pill div is created eagerly');
    assert.ok(!tip().classList.contains('is-on'), 'and it starts invisible');
    assert.equal(tip().textContent, '', 'with no text');
  });

  ok('0.29.0 THE STRIPPER: the initial sweep lifts EVERY existing title (the OS box cannot show)', () => {
    assert.equal(btn.getAttribute('title'), null, 'the mount-time title is gone already');
    assert.equal(btn.dataset.gdTipSrc, 'Save everything to disk', 'the text lives in the stash');
  });

  await ok('0.29.0 a title ADDED AFTER MOUNT is lifted too (the mounted-under-a-stationary-pointer hole)', async () => {
    const late = document.createElement('button');
    late.id = 'late';
    late.textContent = 'LATE';
    host.firstElementChild.appendChild(late);
    late.setAttribute('title', 'Popped open under the cursor');
    await sleep(40); // the stripper's observer is async
    assert.equal(late.getAttribute('title'), null, 'no title attr survives a mutation tick');
    assert.equal(late.dataset.gdTipSrc, 'Popped open under the cursor', 'the stash caught it');
    late.remove();
  });

  await ok('0.29.0 a subtree MOUNTED WITH ITS TITLE (set at creation, detached) is lifted on arrival', async () => {
    // React builds nodes detached: the title attribute is set BEFORE the
    // node ever joins the document — no attribute record can fire for it,
    // so the stripper scans every ADDED SUBTREE.
    const frag = document.createElement('div');
    const kid = document.createElement('button');
    kid.textContent = 'MOUNTED';
    kid.setAttribute('title', 'Born with a title while detached');
    frag.appendChild(kid);
    host.firstElementChild.appendChild(frag);
    await sleep(40);
    assert.equal(kid.getAttribute('title'), null, 'the creation-time title was lifted on arrival');
    assert.equal(kid.dataset.gdTipSrc, 'Born with a title while detached', 'the stash caught the mounted node');
    frag.remove();
  });

  await ok('pointerover shows the pill after the delay, reading the STASH (no title attr anywhere)', async () => {
    fire('pointerover', btn);
    assert.equal(btn.getAttribute('title'), null, 'still no title — nothing to restore, nothing to race');
    await sleep(380);
    assert.ok(tip().classList.contains('is-on'), 'the pill is visible');
    assert.equal(tip().textContent, 'Save everything to disk');
    assert.equal(tip().getAttribute('role'), 'tooltip');
  });

  await ok('pointerout dismisses the pill — and NEVER restores a title (the old box cannot come back)', async () => {
    fire('pointerout', btn, document.getElementById('plain'));
    await sleep(80);
    assert.ok(!tip().classList.contains('is-on'), 'the pill is dismissed');
    assert.equal(btn.getAttribute('title'), null, 'no title re-armed on leave');
    assert.equal(btn.dataset.gdTipSrc, 'Save everything to disk', 'the stash stays as the storage');
  });

  await ok('focusin paints the pill too (keyboard parity the native tooltip never had)', async () => {
    btn.dispatchEvent(new dom.window.FocusEvent('focusin', { bubbles: true }));
    await sleep(20);
    assert.ok(tip().classList.contains('is-on'), 'focused elements get the pill immediately');
    assert.equal(tip().textContent, 'Save everything to disk');
    btn.dispatchEvent(new dom.window.FocusEvent('focusout', { bubbles: true }));
    await sleep(20);
    assert.ok(!tip().classList.contains('is-on'), 'focusout ends it');
    assert.equal(btn.getAttribute('title'), null, 'still no title — no native race on focus moves');
  });

  fire('pointerover', document.getElementById('plain'));
  await sleep(380);

  ok('elements without a stash are ignored', () => {
    assert.ok(!tip().classList.contains('is-on'), 'no pill for a title-less element');
    assert.equal(document.getElementById('plain').dataset.gdTipSrc, undefined);
  });

  // ---- LIVE TOOLTIPS (0.28.0, carried into the stash model) ----------------
  await ok('a title SWAPPED mid-hover re-paints the pill with the new text', async () => {
    fire('pointerover', btn);
    await sleep(380);
    assert.equal(tip().textContent, 'Save everything to disk');
    // React re-renders a new label onto the element while it is hovered —
    // the stripper moves it into the stash, the pill watcher swaps the text.
    btn.setAttribute('title', 'Everything is saved');
    await sleep(60); // both observers are async
    assert.equal(btn.getAttribute('title'), null, 'the new title is lifted off again');
    assert.equal(btn.dataset.gdTipSrc, 'Everything is saved', 'the stash tracks the newest text');
    assert.ok(tip().classList.contains('is-on'), 'and it stayed visible throughout');
    assert.equal(tip().textContent, 'Everything is saved', 'the pill swapped its text in place');
    fire('pointerout', btn, document.getElementById('plain'));
    await sleep(80);
    assert.equal(btn.getAttribute('title'), null, 'leaving still restores nothing');
  });

  await ok('scrolling under the hover FOLLOWS the anchor instead of dismissing', async () => {
    fire('pointerover', btn);
    await sleep(380);
    assert.ok(tip().classList.contains('is-on'));
    window.dispatchEvent(new dom.window.Event('scroll'));
    await sleep(40); // the follow rides a rAF
    assert.ok(tip().classList.contains('is-on'), 'the pill survives the scroll and re-anchors');
    assert.equal(tip().textContent, 'Everything is saved');
    // Escape still dismisses it cleanly
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(!tip().classList.contains('is-on'));
  });

  // ---- 0.29.0 — THE ON/OFF MODE --------------------------------------------
  await ok('the gd-tooltips-mode event: OFF paints nothing at all (and hides a live pill)', async () => {
    mode(false);
    fire('pointerover', btn);
    await sleep(380);
    assert.ok(!tip().classList.contains('is-on'), 'no pill paints while the layer is off');
    assert.equal(btn.getAttribute('title'), null, 'titles stay stripped while off — no native boxes back');
    // back ON: the next hover paints again
    mode(true);
    fire('pointerover', btn);
    await sleep(380);
    assert.ok(tip().classList.contains('is-on'), 'back on: a fresh hover paints the pill');
    // flipping off MID-HOVER dismisses the visible pill immediately
    mode(false);
    await sleep(20);
    assert.ok(!tip().classList.contains('is-on'), 'flipping off mid-hover dismisses the visible pill');
    assert.equal(btn.dataset.gdTipSrc, 'Everything is saved', 'the stash keeps working while off');
    mode(true);
  });

  await ok('an anchor UNMOUNTED mid-hover dismisses the pill on its next paint', async () => {
    const gone = document.createElement('button');
    gone.id = 'gone';
    gone.textContent = 'GONE';
    host.firstElementChild.appendChild(gone);
    gone.setAttribute('title', 'Here one frame, gone the next');
    await sleep(40); // the stripper catches the late title
    fire('pointerover', gone);
    await sleep(380);
    assert.ok(tip().classList.contains('is-on'));
    gone.remove(); // React unmounts the hovered node mid-hover
    window.dispatchEvent(new dom.window.Event('resize')); // any follow trigger re-paints
    await sleep(40);
    assert.ok(!tip().classList.contains('is-on'), 'the pill dismisses once its anchor is gone');
  });

  root.unmount();
  console.log(`\n${passed} tooltip DOM checks passing`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
