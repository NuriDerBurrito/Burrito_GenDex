#!/usr/bin/env node
// 0.41.0 — parse/require check for every touched module (babel hook, jsdom globals).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — parse check skipped');
  process.exit(0);
}
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
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
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

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

const modules = [
  'src/components/useThumbSort.js',
  'src/components/StampEditModal.jsx',
  'src/components/StampColorControls.jsx',
  'src/components/useAutoStampColor.js',
  'src/components/CharacterView.jsx',
  'src/components/NewCharacterModal.jsx',
  'src/components/ImageStage.jsx',
  'src/components/ImageManagerModal.jsx',
  'src/components/ImageViewer.jsx',
  'src/components/GridView.jsx',
  'src/components/ClassSidebar.jsx',
  'src/components/CardLookEditor.jsx',
  'src/components/TagRibbon.jsx',
  'src/components/Modal.jsx',
  'src/App.jsx',
  'src/utils/helpers.js',
  'src/constants/index.js',
];

let failed = 0;
for (const rel of modules) {
  try {
    const mod = require(join(appRoot, rel));
    console.log(`  ok   ${rel}${mod && mod.default ? ' (default export)' : ''}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${rel}\n      ${e.message.split('\n').slice(0, 3).join('\n      ')}`);
  }
}
console.log(failed ? `\n${failed} module(s) failed` : '\nall modules parse & load');
process.exit(failed ? 1 : 0);
