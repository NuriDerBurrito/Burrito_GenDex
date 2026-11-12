// loader_jsx_1919.mjs — on-the-fly babel transform for .jsx imports in the
// live-DOM probes (the webpack build normally owns this job).
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const preset = require.resolve('@babel/preset-react');

export async function load(url, context, next) {
  if (url.endsWith('.jsx')) {
    const source = await readFile(new URL(url), 'utf8');
    const code = babel.transformSync(source, {
      presets: [[preset, { runtime: 'automatic' }]],
      filename: url,
      configFile: false,
      babelrc: false,
      sourceType: 'module',
    }).code;
    return { format: 'module', source: code, shortCircuit: true };
  }
  return next(url, context, next);
}
