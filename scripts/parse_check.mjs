#!/usr/bin/env node
// Parse-check JSX files with the project's own @babel (used by the tests).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { argv, exitCode } from 'node:process';

const require = createRequire(import.meta.url);
let babel;
try {
  babel = require('@babel/core');
} catch {
  console.error('babel unavailable');
  process.exit(3);
}

let bad = 0;
for (const file of argv.slice(2)) {
  try {
    babel.parseSync(readFileSync(file, 'utf8'), {
      presets: [require.resolve('@babel/preset-react'), require.resolve('@babel/preset-env')],
      filename: file,
      parserOpts: { sourceType: 'module', plugins: ['jsx'] },
    });
    console.log(`OK  ${file}`);
  } catch (e) {
    bad += 1;
    console.error(`ERR ${file}\n  ${e.message.split('\n').slice(0, 6).join('\n  ')}`);
  }
}
process.exit(bad ? 1 : 0);
