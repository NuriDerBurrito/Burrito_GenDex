#!/usr/bin/env node
// Parallel battery runner for the gendex jsdom suites (node --test).
// Usage: node scripts/run_battery_parallel.mjs [suite ...]   (default: all)
import { execFile } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'scripts';
const only = process.argv.slice(2);
const files = only.length
  ? only.map((o) => (o.endsWith('.test.mjs') ? o : `${o}.test.mjs`))
  : readdirSync(dir).filter((f) => /^gendex_.*\.test\.mjs$/.test(f) || f === 'gendex_panel_handoff_dom.test.mjs');

const run = (f) =>
  new Promise((resolve) => {
    execFile(
      'node',
      ['--test', join(dir, f)],
      { maxBuffer: 1 << 26, timeout: 120000 },
      (err, stdout, stderr) => {
        const text = `${stdout || ''}\n${stderr || ''}`;
        // the house harness prints "N passed, M failed — ALL GREEN|FIX ABOVE" and exits 1 on red.
        const m = text.match(/(\d+) passed, (\d+) failed/);
        const pass = m ? Number(m[1]) : 0;
        const fail = m ? Number(m[2]) : -1;
        const skipped = 0;
        const timeout = /test timed out|span longer/i.test(text) || (fail === -1 && !!err && !stdout);
        resolve({ f, pass, fail, skipped, timeout, text });
      }
    );
  });

const CONCURRENCY = 12;
const results = [];
let idx = 0;
async function worker() {
  while (idx < files.length) {
    const mine = idx++;
    results.push(await run(files[mine]));
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
results.sort((a, b) => a.f.localeCompare(b.f, undefined, { numeric: true }));
let suitesGreen = 0;
let suitesRed = 0;
for (const r of results) {
  const red = r.fail > 0 || r.timeout;
  if (red) suitesRed += 1; else suitesGreen += 1;
  console.log(`${red ? 'RED ' : 'green'} ${r.f}  pass=${r.pass} fail=${r.fail} skip=${r.skipped}${r.timeout ? ' TIMEOUT' : ''}`);
}
console.log(`\nsuites: ${suitesGreen} green, ${suitesRed} red of ${results.length}`);
