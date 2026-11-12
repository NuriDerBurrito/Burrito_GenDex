import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

(async () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  const g = globalThis;
  g.window = dom.window;
  g.document = dom.window.document;
  g.Node = dom.window.Node;
  g.NodeFilter = dom.window.NodeFilter;
  Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
  g.getComputedStyle = dom.window.getComputedStyle;
  g.requestAnimationFrame = dom.window.requestAnimationFrame;
  g.cancelAnimationFrame = dom.window.cancelAnimationFrame;
  for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'HTMLAnchorElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'ImageBitmap', 'getSelection', 'URL', 'DOMParser']) {
    if (dom.window[k] !== undefined && g[k] === undefined) g[k] = dom.window[k];
  }
  g.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  try { g.localStorage = dom.window.localStorage; } catch {}
  g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.IS_REACT_ACT_ENVIRONMENT = false;

  const require2 = require;
  const React = require2('react');
  const { createRoot } = require2('react-dom/client');
  const babel = require2('@babel/core');
  require.extensions['.jsx'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]],
    });
    module._compile(code, filename);
  };
  for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
    require.extensions[ext] = (module, filename) => { module.exports = filename; };
  }
  console.error = (...a) => console.log('[console.error]', ...a.map(x => String(x && x.stack || x).slice(0, 300)));
  const App = require2('../src/App.jsx').default;

  const mkDb = () => ({
    settings: {
      theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
      textures: { sidebar: 'none', titlebar: 'none', viewer: 'dots', panel: 'none' },
    },
    classes: [{ id: 'cl1', name: 'heroes', parentId: 'root' }],
    tags: [{ id: 't1', name: 'wip', color: '#ffd400', trim: 'straight' }],
    stamps: [],
    characters: [
      { id: 'c1', name: 'amy', classId: 'cl1', tags: ['t1'], versions: [{ id: 'v1', label: 'V1', images: [], parts: [] }], stamps: [] },
    ],
  });

  window.api = {
    loadDB: async () => ({ db: mkDb(), imagesPath: '/mock/images', status: 'ok', fromAppVersion: '', recoveredFrom: '', corruptSetAside: '' }),
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
  };
  localStorage.clear();
  localStorage.setItem('gd:last-run-version', '1.6.4');
  const host = document.createElement('div');
  document.body.appendChild(host);
  const rt = createRoot(host);
  rt.render(React.createElement(App));
  await new Promise((r) => setTimeout(r, 3600));

  const draggables = [...document.querySelectorAll('[draggable]')];
  console.log('draggable count:', draggables.length);
  draggables.slice(0, 6).forEach((d) => console.log('  draggable:', d.nodeName, d.className && String(d.className).slice(0, 60), '| title:', d.title));
  const titles = [...document.querySelectorAll('button')].map((b) => b.title).filter(Boolean);
  console.log('button titles sample:', JSON.stringify(titles.slice(0, 14)));
  console.log('body has amy?', (document.body.textContent || '').includes('amy'));
  console.log('grid card count (.gd-card):', document.querySelectorAll('.gd-card').length);
  console.log('masonry sheet?', !!document.querySelector('.gd-masonry, [class*="masonry"]'));

  // try the dragstart on the first draggable that is a .gd-card
  const card = draggables.find((d) => String(d.className || '').includes('gd-card')) || draggables[0];
  if (card) {
    Object.defineProperty(card, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }) });
    let dragImage = null;
    const dt = { effectAllowed: '', setData: () => {}, setDragImage: (img, x, y) => { dragImage = { img, x, y }; } };
    const ev = new dom.window.Event('dragstart', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'dataTransfer', { value: dt });
    try {
      card.dispatchEvent(ev);
      console.log('dispatch ok; root has gd-card-drag?', document.documentElement.classList.contains('gd-card-drag'));
      console.log('dragImage captured?', !!dragImage, dragImage && dragImage.img && dragImage.img.nodeName);
      console.log('ghost?', !!document.querySelector('.gd-drag-ghost'));
    } catch (e) {
      console.log('dispatch THREW:', String(e.message).slice(0, 200));
    }
  }
  rt.unmount();
  host.remove();
  process.exit(0);
})();
