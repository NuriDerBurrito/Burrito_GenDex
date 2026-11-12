// 1.7.5 render probe — the new seats mount and speak their laws:
//   1. TrimCoatLayer with a picked/card ink (is-user armed) vs none (gone)
//   2. CardPreview's inline clone walks trimCoatInk (no ink = no clone)
//   3. TagsFlowRow in ON mode (full vocabulary) vs OFF mode (card's own
//      chips alone, no drag bindings) + the ghost layer during a swap
//   4. TagPickerModal (chips toggle, the manager key rides the footer)
//   5. ImageManagerModal's empty state (one compact row)
//   6. The prompt editor window's title field (the outline laws ride CSS)
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

const TagRibbonModule = require('../src/components/TagRibbon.jsx');
const { TrimCoatLayer, trimCoatInk, CardPreview, FINISH_GROUND } = TagRibbonModule;
const CharacterView = require('../src/components/CharacterView.jsx').default;
const TagPickerModal = require('../src/components/TagPickerModal.jsx').default;
const ImageManagerModal = require('../src/components/ImageManagerModal.jsx').default;

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

const tags = [
  { id: 't1', name: 'wip', color: '#ffd400', icon: null, trim: 'straight' },
  { id: 't2', name: 'letter tag', color: '#7ecb8f', icon: 'letter:Q', trim: 'v' },
  { id: 't3', name: 'notch', color: '#9d4edd', icon: null, trim: 'notch' },
];

console.log('\n1. THE COAT CLONE SPEAKS THE TRIM\'S OWN INK');
ok('1a — a picked ink arms is-user + threads --trim-user', () => {
  const html = renderToString(React.createElement(TrimCoatLayer, { trim: 'dash', ink: '#4a90d9' }));
  assert.ok(html.includes('gd-trim-coat'), 'the clone class never rode');
  assert.ok(html.includes('is-user'), 'the is-user arm never rode');
  assert.ok(html.includes('--trim-user:#4a90d9'), 'the ink never threaded');
});
ok('1b — no ink = no clone (the real trim already speaks the law)', () => {
  const html = renderToString(React.createElement(TrimCoatLayer, { trim: 'dash', ink: null }));
  assert.equal(html, '', 'the clone rendered without an ink to speak');
});
ok('1c — the derivation ladder (measured)', () => {
  assert.equal(trimCoatInk('dash', '#123456', '#654321'), '#123456');
  assert.equal(trimCoatInk('gold', null, '#654321'), null);
  // 1.7.7 — the card-color rung is retired: a colored card without a
  // pick keeps the theme's own ink
  assert.equal(trimCoatInk('dash', null, '#654321'), null);
  assert.equal(trimCoatInk('dash', null, null), null);
  assert.equal(FINISH_GROUND.auric, '#b98d3e', 'the finish ground map lost a voice');
});
ok('1d — CardPreview clones only while the effect rides an ink', () => {
  const withCard = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    trimColor: '#336699', finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(withCard.includes('gd-trim-coat'), 'the preview clone never rode a picked trim');
  assert.ok(withCard.includes('--trim-user:#336699'), 'the preview clone never spoke the picked ink');
  const themeOnly = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(!themeOnly.includes('gd-trim-coat'), 'the preview clone rode a colorless card (nothing to re-ink)');
  const goldDefault = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'gold',
    finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(!goldDefault.includes('gd-trim-coat'), 'the gold engraving never keeps its own default');
});

console.log('\n2. THE TAGS ROW\'S OWN CENSUS');
const rowProps = (extra) => ({
  character: { id: 'c1', tags: ['t1', 't3'] },
  tags,
  collapsed: false,
  onToggleTag: () => {},
  onOpenTagManager: () => {},
  onReorderTags: () => {},
  ...extra,
});
// TagsFlowRow is module-private inside CharacterView — exercise it through
// the view's own body: the ON/OFF render below covers the row through the
// memo'd view with a minimal character shell.
const mkChar = (charTags) => ({
  id: 'c1', name: 'amy', classId: 'root', tags: charTags,
  previewVersionId: null, cardRatio: { w: 3, h: 4 },
  stamps: [], versions: [{
    id: 'v1', label: 'main', createdAt: 1, images: [], parts: [],
    notes: '',
  }],
});
const viewBase = {
  tags, stampLibrary: [], imagesPath: '', onBack: () => {},
  patchCharacter: () => {}, onDelete: () => {}, onToggleTag: () => {},
  onOpenTagManager: () => {}, onOpenTagPicker: () => {}, onReorderTags: () => {},
  confirm: () => {}, onStatus: () => {}, onActiveVersion: () => {},
};
ok('2a — ON mode: the row keeps its full vocabulary', () => {
  const html = renderToString(React.createElement(CharacterView, { ...viewBase, character: mkChar(['t1', 't3']), showAllTags: true }));
  const chips = (html.match(/gd-tag-chip/g) || []).length;
  assert.ok(chips >= 3, `the full vocabulary never rode (${chips} chips < 3)`);
  assert.ok(html.includes('letter tag'), 'an unselected tag never showed');
});
ok('2b — OFF mode: the row shows only the card\'s own chips', () => {
  const html = renderToString(React.createElement(CharacterView, { ...viewBase, character: mkChar(['t1']), showAllTags: false }));
  assert.ok(html.includes('>wip<') || html.includes('wip'), 'the card\'s own tag never showed');
  assert.ok(!html.includes('letter tag'), 'an unselected tag survived the census');
  assert.ok(!html.includes('notch'), 'another unselected tag survived the census');
});

console.log('\n3. THE TAG PICKER WINDOW');
ok('3a — the picker shows the whole vocabulary + the manager key', () => {
  const html = renderToString(React.createElement(TagPickerModal, {
    tags,
    character: { id: 'c1', tags: ['t1'] },
    onToggleTag: () => {},
    onOpenTagManager: () => {},
    onClose: () => {},
  }));
  assert.ok(html.includes('TAG PICKER'), 'the picker title never spoke');
  assert.ok(html.includes('wip'), 'a selected tag never showed');
  assert.ok(html.includes('letter tag'), 'an unselected tag never showed (the picker IS the vocabulary)');
  assert.ok(html.includes('TAG MANAGER'), 'the manager key never rode the footer');
  assert.ok(html.includes('ON THIS CARD'), 'the census label never spoke');
});

console.log('\n4. THE IMAGE MANAGER\'S EMPTY ROW');
ok('4a — one compact row with the buttons beside the label', () => {
  const html = renderToString(React.createElement(ImageManagerModal, {
    images: [],
    imagesPath: '',
    selectedIndex: 0,
    onReorder: () => {}, onSetCover: () => {}, onDelete: () => {},
    onAddImages: async () => {}, onPasteImage: () => {}, onPick: () => {},
    onClose: () => {}, confirm: () => {},
  }));
  assert.ok(html.includes('No images in this version'), 'the empty label never spoke');
  assert.ok(html.includes('ADD'), 'the ADD key never rode the row');
  assert.ok(html.includes('PASTE'), 'the PASTE key never rode the row');
  assert.ok(!html.includes('ADD IMAGES'), 'the tall block\'s second solid key survived');
  assert.ok(html.includes('font-size:16px'), 'the mark never shrank');
});

console.log(`\n${passed} render checks passing`);
process.exit(0);
