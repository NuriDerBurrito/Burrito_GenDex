// 1.7.4 targeted render — a grid card wearing a finish + the trim effect +
// a stamp hue, through jsdom: shakes out runtime errors in the restructured
// ladder (the clone seat, the under/over wash seats, the finish ground).
// Transpile .jsx on the fly with the project's babel (the smoke suite's own law).
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
const React = require('react');
const { renderToString } = require('react-dom/server');

const GridView = require('../src/components/GridView.jsx').default;
const CardLookEditor = require('../src/components/CardLookEditor.jsx').default;
const CardPreview = require('../src/components/TagRibbon.jsx').CardPreview;

const stampLibrary = [{ id: 's1', image: 'seal.png', name: 'seal', createdAt: 1 }];
const base = {
  id: 'c1',
  name: '<b>Trim</b> Clone',
  tags: ['t1'],
  createdAt: 1700000000000,
  versions: [{ id: 'v1', label: 'v1', images: [], parts: [] }],
  cardFinish: 'auric',
  cardFinishOnTrim: true,
  cardFinishOnImage: false,
  cardTrim: 'frame',
  cardTrimColor: '#38e0c8',
  cardColor: null,
  stampSettings: { pos: null, hueOver: false, hueOverTrim: false, hue: '#ff3df5', hueAlpha: 0.5, alpha: 0.5, clip: true },
  stamps: ['s1'],
};

const empty = () => null;
const props = {
  character: base,
  spotStamps: [],
  stampLibrary,
  imagesPath: '/img',
  ratio: { w: 3, h: 4 },
  cardWidth: 240,
  scale: 1,
  tags: [{ id: 't1', name: 'wip', color: '#ffd400', icon: null, trim: 'straight' }],
  selectedVersionId: 'v1',
  previewVersionId: null,
  editingVersionId: null,
  onOpen: empty, onCardDragStart: empty, onCardDragOver: empty,
  settings: {},
  onStatus: empty,
};

let failures = 0;
const cases = [
  ['grid card — finish + trim effect + stamp hue (under-stamp seat)', () => props],
  ['grid card — hue OVER stamp while the coat rides (over seat)', () => ({ ...props, character: { ...base, stampSettings: { ...base.stampSettings, hueOver: true } } })],
  ['grid card — hue over TRIM + trim effect together', () => ({ ...props, character: { ...base, stampSettings: { ...base.stampSettings, hueOverTrim: true } } })],
  ['grid card — dash trim (gaps) + prismatic + no color (the ground law)', () => ({ ...props, character: { ...base, cardTrim: 'dash', cardFinish: 'prismatic', cardTrimColor: null } })],
  ['grid card — deep trim color + image effect ON (full-face coat)', () => ({ ...props, character: { ...base, cardFinishOnImage: true, cardColor: '#20222b' } })],
  ['CardPreview — the compact clone + ground', () => null],
  ['CardLookEditor — the panzoom clone + under/over seats', () => null],
];

for (const [name, mk] of cases) {
    try {
      if (name.startsWith('grid card')) {
        const html = renderToString(React.createElement(GridView, { ...props, ...mk() }));
        if (!html || html.length < 200) throw new Error('thin render');
      } else if (name.startsWith('CardPreview')) {
        renderToString(React.createElement(CardPreview, {
          name: 'Preview', imageUrl: null, ratio: { w: 3, h: 4 }, width: 240,
          trim: 'scallop', trimColor: '#38e0c8', finish: 'nuri', finishOnTrim: true, finishOnImage: false,
        }));
      } else {
        renderToString(React.createElement(CardLookEditor, {
          name: 'Editor', imageUrl: null, ratio: { w: 3, h: 4 }, width: 240,
          trim: 'gold', trimColor: null, finish: 'foil', finishOnTrim: true, finishOnImage: false,
          stampHueOver: false, stampHue: '#ff3df5', stampAlpha: 0.5,
        }));
      }
      console.log(`  ok — ${name}`);
    } catch (e) {
      failures += 1;
      console.log(`  FAIL — ${name}: ${e.message}`);
    }
  }
  console.log(failures ? `\n${failures} FAILURES` : '\nALL RENDER CHECKS GREEN');
  process.exit(failures ? 1 : 0);
// (server render — no DOM needed — the smoke suite's own pattern)
