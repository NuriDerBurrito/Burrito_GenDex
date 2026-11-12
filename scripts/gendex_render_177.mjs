// 1.7.7 render probe — the new seats mount and speak their laws:
//   1. THE TRIM'S OWN VOICE: a colored card without a pick keeps the
//      THEME's ink (no is-user, no clone — the card-color rung retired),
//      the pick arms both seats, and the trim effect rides washes alone
//   2. THE KEYS SECTOR: the explanatory copy + hints ride HELP TEXT, the
//      armed row carries its CANCEL key, RESET asks before it wipes
//   3. THE LOOK DIVIDE: the three cloths render on Look, the dials on
//      Shape, the tag family on Cards
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
const { CardPreview } = TagRibbonModule;
const SettingsModal = require('../src/components/SettingsModal.jsx').default;

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

const settings = {
  theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
  textures: { titlebar: 'none', sidebar: 'none', viewer: 'none', panel: 'none' },
  buttonStyle: 'theme', detailPanel: true, tagScale: 1, tagLimit: 3,
  cardRatio: { w: 3, h: 4 }, shortcuts: { save: 'Ctrl+S', undo: 'Ctrl+Z', redo: 'Ctrl+Y', newCharacter: 'Ctrl+N', settings: 'Ctrl+,', panel: 'Alt+P', outputBar: 'Alt+B', tooltips: 'Alt+T' },
};
const noop = () => {};
const settingsRender = (tab, extra = {}) =>
  renderToString(
    React.createElement(SettingsModal, {
      settings: { ...settings, ...extra }, initial: { ...settings, ...extra },
      onClose: noop, onChange: noop, onRevert: noop, initialTab: tab,
    })
  );

console.log('\n1. THE TRIM\'S OWN VOICE ("never the card\'s borrowed color")');
ok('1a — a colored card without a pick keeps the theme\'s ink (at rest)', () => {
  const html = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    cardColor: '#336699', finish: 'none', finishOnTrim: false,
  }));
  assert.ok(!html.includes('is-user'), "the card's color still re-inked the ring at rest");
  assert.ok(!html.includes('--trim-user'), 'a card-colored trim still spoke a user ink');
});
ok('1b — the trim effect rides WASHES ALONE without a pick (no clone, no re-ink)', () => {
  const html = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    cardColor: '#336699', finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(!html.includes('gd-trim-coat'), 'the clone still re-inked a pickless trim');
  assert.ok(!html.includes('--trim-user'), 'the effect still re-inked the ring');
  assert.ok(html.includes('gd-card-face-finish'), 'the finish itself still rides');
});
ok('1c — the pick arms BOTH seats (the real trim + the clone under the effect)', () => {
  const html = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'dash',
    trimColor: '#e8590c', finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(html.includes('is-user'), 'the pick never armed the real trim');
  assert.ok(html.includes('--trim-user:#e8590c'), 'the pick never spoke its ink');
  assert.ok(html.includes('gd-trim-coat'), 'the clone never rode the picked effect');
});
ok('1d — the gold engraving keeps its own default under a finish', () => {
  const html = renderToString(React.createElement(CardPreview, {
    name: 'amy', imageUrl: '', ratio: { w: 3, h: 4 }, trim: 'gold',
    cardColor: '#336699', finish: 'auric', finishOnTrim: true,
  }));
  assert.ok(!html.includes('gd-trim-coat'), 'a clone rode the gold (no ink to speak)');
  assert.ok(!html.includes('--trim-user'), 'the gold lost its own default');
});

console.log('\n2. THE KEYS SECTOR EARNS ITS MANNERS');
ok('2a — the explanatory copy rides HELP TEXT (off: no paragraph, no hints)', () => {
  const quiet = settingsRender('Keys');
  assert.ok(quiet.includes('REASSIGN KEYS'), 'the roster never rendered');
  assert.ok(!quiet.includes('Click a key, then press a two-key combo'), 'the copy leaked past the switch');
  assert.ok(!quiet.includes('gd-scut-hint'), 'the hints leaked past the switch');
  assert.ok(quiet.includes('RESET'), 'the reset key never rendered');
  assert.ok(!quiet.includes('CONFIRM RESET'), 'the confirm armed on its own');
});
ok('2b — the explanatory copy rides HELP TEXT (on: the paragraph + per-row hints)', () => {
  const chatty = settingsRender('Keys', { showHelpText: true });
  assert.ok(chatty.includes('Click a key, then press a two-key combo'), 'the copy never rode the switch');
  assert.ok(chatty.includes('gd-scut-hint'), 'the per-row hints never rode the switch');
  assert.ok(chatty.includes('an invalid press is forgotten until a valid combo lands'), 'the forgetting law never printed');
  assert.ok(!chatty.includes('gd-scut-cancel'), 'a CANCEL key rendered without an armed row');
});
ok('2c — the fixed-keys note rides the switch too', () => {
  const quiet = settingsRender('Keys');
  assert.ok(!quiet.includes('Fixed:'), 'the fixed note leaked past the switch');
  const chatty = settingsRender('Keys', { showHelpText: true });
  assert.ok(chatty.includes('Fixed:'), 'the fixed note never rode the switch');
});

console.log('\n3. THE LOOK DIVIDE ("at most theme, background textures and manual colors")');
ok('3a — Look keeps the three cloths; the dials left', () => {
  const look = settingsRender('Appearance');
  assert.ok(look.includes('BACKGROUND TEXTURE') && look.includes('MANUAL COLORS'), 'a cloth went missing');
  assert.ok(!look.includes('CORNER STYLE') && !look.includes('APP FONT'), 'a dial overstayed');
});
ok('3b — Shape carries the typeface + the dials + the tooltips', () => {
  const shape = settingsRender('Shape');
  assert.ok(shape.includes('APP FONT') && shape.includes('TOOLTIPS') && shape.includes('STAMP TILT'), 'a dial went missing');
});
ok('3c — Cards carries the tag family + the shine family under its own header', () => {
  const cards = settingsRender('Cards');
  assert.ok(cards.includes('TAG POSITION') && cards.includes('UNSELECTED TAGS'), 'a tag card went missing');
  assert.ok(cards.includes('CARD SHINE') && cards.includes('SHINE STYLE'), 'the shine family went missing');
  assert.ok(!cards.includes('APP FONT'), 'a font card overstayed');
});

console.log(`\n${passed} render checks passing`);
if (passed < 10) process.exit(1);
