// probe: when does the ErrorBoundary fallback commit under jsdom?
const { createRequire } = require('node:module');
const req = createRequire(__filename);
const { JSDOM } = req('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.navigator = dom.window.navigator;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.IS_REACT_ACT_ENVIRONMENT = false;
window.api = { saveDB: async () => ({ ok: true }), clipboardWriteText: async () => {} };
window.__GENDX_DB = {};

const React = req('react');
const { createRoot } = req('react-dom/client');
const babel = req('@babel/core');
require.extensions['.jsx'] = (m, f) => {
  const { code } = babel.transformFileSync(f, {
    presets: [
      [req.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
      [req.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
  });
  m._compile(code, f);
};
const EB = req(require('node:path').join(__dirname, '..', 'src', 'components', 'ErrorBoundary.jsx')).default;
const Bomb = () => { throw new Error('boom'); };
const host = document.getElementById('host');
const root = createRoot(host);
const quiet = console.error;
console.error = () => {};
root.render(React.createElement(EB, null, React.createElement(Bomb)));
console.error = quiet;
let t = 0;
const tick = () => {
  t += 50;
  console.log(t + 'ms host length:', host.innerHTML.length, 'panel:', host.innerHTML.includes('gd-crash-panel'));
  if (t < 600) setTimeout(tick, 50);
};
setTimeout(tick, 50);
