// 1.7.6 render probe — the new seats mount and speak their laws:
//   1. THE INK NEVER MOVES: the REAL trim speaks the same ink whether the
//      trim effect rides or not (the OFF/ON parity the report asked for)
//   2. CardPreview's clone rides the SAME ink the real trim speaks
//   3. The empty stage's marks WEAR THE PLATE (the z-3 climb + the
//      opaque framed badge over any veil)
//   4. The tags row's ON/OFF census keeps its 1.7.5 word (no regression)
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
const { CardPreview, TrimOverlay, trimCoatInk } = TagRibbonModule;
const CharacterView = require('../src/components/CharacterView.jsx').default;
const ImageStage = require('../src/components/ImageStage.jsx').default;

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

console.log('\n1. THE INK NEVER MOVES (the real trim speaks the ladder at rest)');
ok('1a — a colored card\'s real trim speaks the card\'s color with the effect OFF', () => {
  const html = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    trimColor: '#336699', finish: 'none', finishOnTrim: false,
  }));
  assert.ok(html.includes('is-user'), 'the real trim never armed is-user at rest');
  assert.ok(html.includes('--trim-user:#336699'), 'the real trim never spoke the picked ink at rest');
  assert.ok(!html.includes('gd-trim-coat'), 'a clone rode without the effect');
});
ok('1b — the SAME ink with the effect ON (no flip on the toggle)', () => {
  const html = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    trimColor: '#336699', finish: 'auric', finishOnTrim: true,
  }));
  const userInks = html.match(/--trim-user:#336699/g) || [];
  assert.ok(userInks.length >= 2, `the clone never echoed the real trim's ink (${userInks.length} < 2)`);
  assert.ok(html.includes('gd-trim-coat'), 'the clone never rode the effect');
});
ok('1c — a picked trim color wins on BOTH seats, effect or not', () => {
  const off = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    cardColor: '#336699', trimColor: '#e8590c', finish: 'none', finishOnTrim: false,
  }));
  assert.ok(off.includes('--trim-user:#e8590c'), 'the pick never won at rest');
  assert.ok(!off.includes('--trim-user:#336699'), 'the card color overreached the pick at rest');
  const on = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    cardColor: '#336699', trimColor: '#e8590c', finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(!on.includes('--trim-user:#336699'), 'the card color overreached the pick under the effect');
});
ok('1d — the gold engraving keeps its own default on both seats', () => {
  const off = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'gold',
    cardColor: '#336699', finish: 'none', finishOnTrim: false,
  }));
  assert.ok(!off.includes('--trim-user'), 'the gold never kept its own default at rest');
  const on = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'gold',
    cardColor: '#336699', finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(!on.includes('gd-trim-coat'), 'a clone rode the gold (no ink to speak)');
});
ok('1e — the TrimOverlay seat threads the ladder (the grid card\'s own law)', () => {
  // 1.7.7 — the card-color rung is retired: a colored card without a pick
  // keeps the theme's own ink (no is-user); the PICK arms the seat.
  const plain = renderToString(React.createElement(TrimOverlay, {
    trim: 'dash', color: trimCoatInk('dash', null, '#654321'),
  }));
  assert.ok(!plain.includes('is-user'), "the card's color still re-inked the ring (the 1.7.7 retirement missed)");
  const picked = renderToString(React.createElement(TrimOverlay, {
    trim: 'dash', color: trimCoatInk('dash', '#654321'),
  }));
  assert.ok(picked.includes('is-user'), 'the pick never armed is-user');
  assert.ok(picked.includes('--trim-user:#654321'), 'the pick never spoke its ink');
  const none = renderToString(React.createElement(TrimOverlay, {
    trim: 'dash', color: trimCoatInk('dash', null, null),
  }));
  assert.ok(!none.includes('is-user'), 'a colorless card never spoke is-user');
});

console.log('\n2. THE EMPTY STAGE\'S MARKS WEAR THE PLATE');
ok('2a — the empty block climbs + grounds its marks on the plate', () => {
  const html = renderToString(React.createElement(ImageStage, {
    images: [], image: null, version: { id: 'v1', images: [] },
    characterId: 'c1', imagesPath: '', onAddImages: async () => {},
    onPick: () => {}, onDeleteImage: () => {}, onSetCover: () => {},
    onOpenManager: () => {}, onActiveVersion: () => {}, confirm: () => {},
    onStatus: () => {},
  }));
  assert.ok(html.includes('gd-empty-marks'), 'the empty block never climbed');
  assert.ok(html.includes('gd-empty-plate'), 'the plate never grounded the marks');
  assert.ok(html.includes('No images yet'), 'the caption never spoke');
  assert.ok(html.includes('gd-empty-mark'), 'the mark never spoke');
});

console.log('\n3. THE TAGS CENSUS KEEPS ITS 1.7.5 WORD (no regression)');
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
ok('3a — ON mode: the full vocabulary rides', () => {
  const html = renderToString(React.createElement(CharacterView, { ...viewBase, character: mkChar(['t1', 't3']), showAllTags: true }));
  const chips = (html.match(/gd-tag-chip/g) || []).length;
  assert.ok(chips >= 3, `the full vocabulary never rode (${chips} chips < 3)`);
});
ok('3b — OFF mode: only the card\'s own chips ride', () => {
  const html = renderToString(React.createElement(CharacterView, { ...viewBase, character: mkChar(['t1']), showAllTags: false }));
  assert.ok(html.includes('wip'), "the card's own tag never showed");
  assert.ok(!html.includes('letter tag'), 'an unselected tag survived the census');
  assert.ok(!html.includes('notch'), 'another unselected tag survived the census');
});

console.log(`\n${passed} render checks passing`);
process.exit(0);
