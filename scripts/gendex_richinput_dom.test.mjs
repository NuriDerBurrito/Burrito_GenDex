// Behavioral DOM test for the 0.10.0 one-layer WYSIWYG RichInput.
// Simulates what Chromium's contentEditable does to the DOM (typing mutates
// text nodes / spans in place), then asserts the model follows: onChange
// emits the right marked string, the DOM is reconciled, the toolbar appears
// on real selections, and the smart toggle applies-all-first / removes when
// the whole selection already has the format.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — rich-input DOM test skipped (dev-only dependency)');
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
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};

const { default: RichInput } = require('../src/components/RichText.jsx');

let passed = 0;
const ok = async (name, fn) => {
  await fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};
const sleep = () => new Promise((r) => setTimeout(r, 0));

// Mount a controlled RichInput. onChange only RECORDS (never re-renders
// inside the event) — every interaction is: act(event) -> render(new value),
// exactly how a real parent component cycles.
// 0.25.0 — harness fix: the format pill is PORTALED to document.body
// (0.20.0), so a stale editor from the previous test leaves its pill in the
// body (jsdom never fires selectionchange, so it can't close itself). Each
// mount now unmounts the previous editor — React removes its portal — and
// toolbar/button queries go to the DOCUMENT, not the container.
let lastEditor = null;
const mountEditor = async (initial) => {
  if (lastEditor) {
    await React.act(async () => { lastEditor.root.unmount(); });
    lastEditor.container.remove();
    lastEditor = null;
  }
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const state = { value: initial, calls: [] };

  const render = () =>
    React.act(async () => {
      root.render(
        React.createElement(RichInput, {
          value: state.value,
          placeholder: 'Type a name',
          onChange: (v) => {
            state.value = v;
            state.calls.push(v);
          },
        })
      );
      await sleep();
    });

  await render();

  const el = () => container.querySelector('.gd-rt-edit');
  const interact = async (fn) => {
    await React.act(async () => {
      fn(el());
      await sleep();
    });
    await render(); // feed the recorded value back in (parent state update)
  };
  const type = (mutation) => interact((e) => {
    mutation(e);
    e.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  const pressKey = (key) =>
    interact((e) => {
      e.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    });
  const select = (node, a, node2, b) =>
    interact(() => {
      dom.window.getSelection().setBaseAndExtent(node, a, node2 ?? node, b ?? a);
      el().dispatchEvent(new dom.window.Event('keyup', { bubbles: true }));
    });
  const clickBold = () =>
    interact(() => {
      const boldBtn = [...document.querySelectorAll('.gd-rt-btn')][0];
      boldBtn.click();
    });
  const boldBtn = () => [...document.querySelectorAll('.gd-rt-btn')][0];
  const ed = { container, root, state, el, render, type, pressKey, select, clickBold, boldBtn };
  lastEditor = ed;
  return ed;
};

await ok('mount builds the DOM from the model (formatted + plain segments)', async () => {
  const ed = await mountEditor('<b>bold</b> plain');
  const kids = ed.el().childNodes;
  assert.equal(kids.length, 2);
  assert.equal(kids[0].nodeType, Node.ELEMENT_NODE);
  assert.equal(kids[0].getAttribute('class'), 'rt-b');
  assert.equal(kids[0].textContent, 'bold');
  assert.equal(kids[1].nodeType, Node.TEXT_NODE);
  assert.equal(kids[1].textContent, ' plain');
  assert.equal(ed.el().getAttribute('contenteditable'), 'true');
});

await ok('typing at the end appends to the stored value, DOM untouched', async () => {
  const ed = await mountEditor('hello');
  await ed.type((e) => {
    e.firstChild.textContent = 'helloX';
  });
  assert.deepEqual(ed.state.calls, ['helloX']);
  assert.equal(ed.el().firstChild.textContent, 'helloX');
  assert.equal(ed.el().childNodes.length, 1);
});

await ok('typing inside a bold run extends the bold range', async () => {
  const ed = await mountEditor('<b>bold</b>');
  await ed.type((e) => {
    e.firstChild.textContent = 'boXld';
  });
  assert.equal(ed.state.value, '<b>boXld</b>');
});

await ok('deleting a char shrinks the range', async () => {
  const ed = await mountEditor('<b>bold</b>');
  await ed.type((e) => {
    e.firstChild.textContent = 'bod';
  });
  assert.equal(ed.state.value, '<b>bod</b>');
});

await ok('typing in plain text between formats shifts later ranges', async () => {
  const ed = await mountEditor('<b>a</b>mid<i>tail</i>');
  await ed.type((e) => {
    e.childNodes[1].textContent = 'mXid';
  });
  assert.equal(ed.state.value, '<b>a</b>mXid<i>tail</i>');
});

await ok('selection shows the toolbar; bolding a plain selection works', async () => {
  const ed = await mountEditor('plain words');
  await React.act(async () => { ed.el().focus(); await sleep(); });
  const node = ed.el().firstChild;
  await ed.select(node, 6, node, 11); // "words"
  assert.ok(document.querySelector('.gd-rt-toolbar'), 'toolbar rendered');
  await ed.clickBold();
  assert.equal(ed.state.value, 'plain <b>words</b>');
  // DOM rebuilt to match: plain text + bold span.
  const kids = ed.el().childNodes;
  assert.equal(kids.length, 2);
  assert.equal(kids[1].getAttribute('class'), 'rt-b');
  assert.equal(kids[1].textContent, 'words');
  // selection restored — the toolbar stays open for the next press
  assert.equal(dom.window.getSelection().toString(), 'words');
});

await ok('smart toggle: PARTLY bold selection -> pressing B bolds it ALL', async () => {
  const ed = await mountEditor('<b>bo</b>ld');
  await React.act(async () => { ed.el().focus(); await sleep(); });
  const kids = ed.el().childNodes;
  // DOM selection spanning the whole word "bold" (bold "bo" + plain "ld")
  await ed.select(kids[0].firstChild, 0, kids[1], 2);
  assert.ok(!ed.boldBtn().classList.contains('is-active'), 'partial coverage: button not lit');
  await ed.clickBold();
  assert.equal(ed.state.value, '<b>bold</b>');
});

await ok('smart toggle: fully bold selection -> pressing B removes it', async () => {
  const ed = await mountEditor('<b>bold</b>');
  await React.act(async () => { ed.el().focus(); await sleep(); });
  const span = ed.el().firstChild;
  await ed.select(span.firstChild, 0, span.firstChild, 4);
  assert.ok(ed.boldBtn().classList.contains('is-active'), 'full coverage: button lit');
  await ed.clickBold();
  assert.equal(ed.state.value, 'bold');
});

await ok('Enter never inserts a newline and fires onEnter', async () => {
  const seen = [];
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(
      React.createElement(RichInput, {
        value: 'name',
        onChange: () => {},
        onEnter: () => seen.push('enter'),
      })
    );
    await sleep();
  });
  const el = container.querySelector('.gd-rt-edit');
  await React.act(async () => { el.focus(); await sleep(); });
  let prevented = null;
  document.addEventListener(
    'keydown',
    (e) => {
      prevented = e.defaultPrevented;
    },
    { once: true }
  );
  await React.act(async () => {
    el.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    );
    await sleep();
  });
  assert.equal(prevented, true);
  assert.deepEqual(seen, ['enter']);
  assert.equal(el.textContent, 'name');
});

await ok('foreign nodes (an image dropped in) are snapped back to the model', async () => {
  const ed = await mountEditor('name');
  await ed.type((e) => {
    const img = document.createElement('img');
    e.append(img);
  });
  assert.equal(ed.state.value, 'name'); // value never changed
  assert.equal(ed.el().querySelectorAll('img').length, 0, 'img removed from the DOM');
  assert.equal(ed.el().textContent, 'name');
});

// 0.11.0 — the reported bug: a fully-bold selection whose bold came from TWO
// touching runs. The button must light up AND one press must unbold.
await ok('0.11.0 fix: adjacent bold tags parse as ONE run (canonical model)', async () => {
  const ed = await mountEditor('<b>ab</b><b>cd</b>');
  const kids = ed.el().childNodes;
  assert.equal(kids.length, 1, 'adjacent tags render as one bold run');
  assert.equal(kids[0].getAttribute('class'), 'rt-b');
  assert.equal(kids[0].textContent, 'abcd');
});

await ok('0.11.0 fix: deleting the gap between two bold runs merges them; select-all + ONE press unbolds', async () => {
  const ed = await mountEditor('<b>ab</b>X<b>cd</b>');
  const kids = ed.el().childNodes;
  assert.equal(kids.length, 3); // bold span, plain X, bold span
  // delete the plain 'X' between them
  await ed.type((e) => {
    e.childNodes[1].textContent = '';
  });
  assert.equal(ed.state.value, '<b>abcd</b>', 'runs merge after the gap is deleted');
  // select everything and press B — the button must be lit and one press removes
  await React.act(async () => { ed.el().focus(); await sleep(); });
  const span = ed.el().firstChild;
  assert.equal(span.getAttribute('class'), 'rt-b');
  await ed.select(span.firstChild, 0, span.firstChild, 4);
  assert.ok(ed.boldBtn().classList.contains('is-active'), 'touching runs, full cover: button lit');
  await ed.clickBold();
  assert.equal(ed.state.value, 'abcd');
});

console.log(`\n${passed} rich-input DOM behaviors passing`);
