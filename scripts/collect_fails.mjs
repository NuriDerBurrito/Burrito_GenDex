#!/usr/bin/env node
// Collect per-suite failure diagnostics for the current battery.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'scripts';
const files = readdirSync(dir).filter((f) => /^gendex_.*\.test\.mjs$/.test(f) || f === 'gendex_panel_handoff_dom.test.mjs');
const only = process.argv.slice(2);
const targets = only.length ? only.map((o) => (o.endsWith('.test.mjs') ? o : `${o}.test.mjs`)) : files;
const report = {};
for (const f of targets) {
  let out = '';
  let err = '';
  try {
    out = execFileSync('node', ['--test', join(dir, f)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
  } catch (e) {
    out = (e.stdout || '');
    err = (e.stderr || '');
  }
  const lines = (out + '\n' + err).split('\n');
  const fails = [];
  let cur = null;
  for (const l of lines) {
    const m = /^  FAIL (.+)$/.exec(l);
    if (m) {
      cur = { name: m[1].trim(), err: '' };
      fails.push(cur);
      continue;
    }
    if (cur && !cur.err && /AssertionError|ReferenceError|TypeError|SyntaxError/.test(l)) {
      cur.err = l.trim().slice(0, 200);
    }
    if (cur && /AssertionError|Error: /.test(l) && cur.err) {
      const msg = /^(\s*)(AssertionError.*|.*Error:.*)$/.exec(l);
      if (msg && !cur.err.includes(l.trim().slice(0, 80))) cur.detail = l.trim().slice(0, 160);
    }
  }
  if (fails.length) report[f] = fails;
}
for (const [f, fails] of Object.entries(report)) {
  console.log(`\n=== ${f} (${fails.length} failing) ===`);
  for (const x of fails) console.log(` - ${x.name}\n   ${x.err || x.detail || ''}`);
}
console.log(`\nTOTAL suites failing: ${Object.keys(report).length}`);
