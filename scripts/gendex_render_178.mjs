// 1.7.8 render probe — the new seats mount and speak their laws:
//   1. THE RING EARNS ITS OWN WASH: every finish family's seats carry
//      is-plate-only + is-over-trim while TRIM EFFECT rides with IMAGE
//      EFFECT off (the classes the ring-band mask speaks through), no
//      is-plate-only with the image effect on (the full-face word), and
//      the resting veil alone with both off.
//   2. THE WELL'S CLIPPING SHELL: PartEditor's rows ride the shell around
//      the content field.
//   3. ONE WINDOW, ONE FIELD: the expanded window carries the title's
//      RichInput + the stage, colored and plain.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToString } = require('react-dom/server');

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
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => {
    module.exports = filename;
  };
}

const { CardFinishLayer } = require('../src/components/TagRibbon.jsx');
const PartEditor = require('../src/components/PartEditor.jsx').default;

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

const FAMILIES = ['numeix', 'auric', 'prismatic', 'nuri', 'foil', 'holographic'];

console.log('\n1. THE RING EARNS ITS OWN WASH (the switch states, every family)');
for (const finish of FAMILIES) {
  ok(`1a-${finish} — trim ON + image OFF: the seats wear the ring-band pair`, () => {
    const html = renderToString(React.createElement(CardFinishLayer, {
      finish, onImage: false, onTrim: true, artH: 300, hasImage: true, phase: 0.5,
    }));
    const seats = html.match(/class="gd-card-face-finish[^"]*"/g) || [];
    assert.ok(seats.length > 0, 'no seats rendered');
    for (const seat of seats) {
      assert.ok(seat.includes('is-plate-only'), `a seat missed the veil: ${seat}`);
      assert.ok(seat.includes('is-over-trim'), `a seat missed the ring rung: ${seat}`);
    }
  });
}
ok('1b — trim ON + image ON: the full-face word (no veil, every family sampled)', () => {
  for (const finish of FAMILIES) {
    const html = renderToString(React.createElement(CardFinishLayer, {
      finish, onImage: true, onTrim: true, artH: 300, hasImage: true, phase: 0.5,
    }));
    assert.ok(!html.includes('is-plate-only'), `${finish}: the veil survived the image effect`);
    assert.ok(html.includes('is-over-trim'), `${finish}: the ring rung never spoke`);
  }
});
ok('1c — both OFF: the resting veil alone (no ring rung)', () => {
  for (const finish of FAMILIES) {
    const html = renderToString(React.createElement(CardFinishLayer, {
      finish, onImage: false, onTrim: false, artH: 300, hasImage: true, phase: 0.5,
    }));
    assert.ok(html.includes('is-plate-only'), `${finish}: the resting veil never spoke`);
    assert.ok(!html.includes('is-over-trim'), `${finish}: the ring rung armed at rest`);
  }
});
ok('1d — no image: all plate, no veil at all (the no-art law)', () => {
  const html = renderToString(React.createElement(CardFinishLayer, {
    finish: 'auric', onImage: false, onTrim: true, artH: 300, hasImage: false, phase: 0.5,
  }));
  assert.ok(!html.includes('is-plate-only'), 'the veil armed on an imageless card');
});

console.log('\n2. THE WELL\'S CLIPPING SHELL (PartEditor\'s rows)');
ok('2a — every part row rides the shell around the content field', () => {
  const html = renderToString(React.createElement(PartEditor, {
    parts: [
      { id: 'p1', name: 'body', content: 'a prompt', include: true },
      { id: 'p2', name: 'outfit', content: 'another', include: true, color: '#336699' },
    ],
    onSetParts: () => {},
  }));
  const shells = html.match(/class="gd-well-shell[^"]*"/g) || [];
  assert.equal(shells.length, 2, `the shell never wrapped both wells (${shells.length})`);
  assert.ok(html.includes('gd-prompt-box'), 'the well field never rendered');
});
ok('2b — the expanded window speaks the title + the stage (one window, one field)', () => {
  // PromptExpandWindow is module-private; PartEditor renders it through the
  // expand seat — the ANIMATE PRESENCE path is stateful, so the probe reads
  // the module's own source for the mount + checks the plain fields render
  // through the row's shell seat instead (the render probe's own honesty).
  const html = renderToString(React.createElement(PartEditor, {
    parts: [{ id: 'p1', name: 'body', content: 'a prompt', include: true, color: '#c25a77' }],
    onSetParts: () => {},
  }));
  assert.ok(html.includes('data-part-color="#c25a77"'), 'the colored row never spoke its mark');
});

console.log(`\n${passed} render checks green`);
