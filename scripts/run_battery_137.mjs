// 1.3.5 — run the full test battery for burrito_gendex_137
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const appRoot = '/home/z/my-project/burrito_gendex_137';
const scriptsDir = join(appRoot, 'scripts');
const files = readdirSync(scriptsDir)
  .filter((f) => f.endsWith('.test.mjs'))
  .sort();

const results = [];
for (const f of files) {
  const r = spawnSync(process.execPath, [join(scriptsDir, f)], {
    cwd: appRoot,
    encoding: 'utf8',
    timeout: 90000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const passMatch = out.match(/(\d+) passed/);
  const failMatch = out.match(/(\d+) failed/);
  const passed = passMatch ? Number(passMatch[1]) : 0;
  const failed = failMatch ? Number(failMatch[1]) : (r.status === 0 ? 0 : 1);
  results.push({ f, status: r.status, passed, failed, out });
}

let green = 0;
let flaky = [];
let red = [];
for (const r of results) {
  if (r.status === 0 && r.failed === 0) {
    green += 1;
    console.log(`GREEN  ${r.f}  (${r.passed} checks)`);
  } else {
    console.log(`FAIL   ${r.f}  (status=${r.status}, passed=${r.passed}, failed=${r.failed})`);
    (r.status === 0 ? flaky : red).push(r);
  }
}

// re-run failures in isolation once (jsdom load-timing flakes pass alone)
let recovered = [];
let hardFail = [];
for (const r of [...flaky, ...red]) {
  const rr = spawnSync(process.execPath, [join(scriptsDir, r.f)], {
    cwd: appRoot,
    encoding: 'utf8',
    timeout: 90000,
  });
  const out = (rr.stdout || '') + (rr.stderr || '');
  if (rr.status === 0) {
    recovered.push(r.f);
    console.log(`RECOVERED-IN-ISOLATION  ${r.f}`);
  } else {
    hardFail.push(r.f);
    console.log(`HARD-FAIL  ${r.f}\n${out.split('\n').slice(0, 12).join('\n')}`);
  }
}

console.log('\n================================');
console.log(`TOTAL SUITES: ${results.length}`);
console.log(`GREEN FIRST RUN: ${green}`);
console.log(`RECOVERED IN ISOLATION: ${recovered.length}${recovered.length ? ' -> ' + recovered.join(', ') : ''}`);
console.log(`HARD FAILURES: ${hardFail.length}${hardFail.length ? ' -> ' + hardFail.join(', ') : ''}`);
process.exit(hardFail.length ? 1 : 0);
