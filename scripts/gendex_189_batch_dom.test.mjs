// 1.8.8 batch — The Layout Census.
// (Named 189 in the sequence: 187 pins the 1.8.6 laws; this suite pins
//  the 1.8.8 laws at their roots. Built from the 1.8.6 tree — the 1.8.7
//  line was discarded by the owner, so no 188 suite ever shipped.)
// The reported items, each pinned at its root law:
//   A.  THE LAYOUT CENSUS ("when opening a card that has alot of versions
//       that it has the left and right buttons for versions to scroll
//       sideways, then switching to a version with small amount of
//       versions, for some reason the arrows remain still even if there
//       is nothing to scroll, fix the logic for that") — the arrows' law
//       reads the chips' own LAYOUT seats (transform-blind, the same law
//       the 1.6.9 FLIP itself measured with) instead of the paint
//       (scrollWidth — which counts the trailing key's FLIP poke as
//       scrollable ground while the flight lives): the truth no longer
//       depends on WHEN it is read, the arrows retire in the same breath
//       the short card arrives. A WORTH threshold, a stale-seat pin with
//       two guards, and the content speaking for itself (a
//       MutationObserver + one settling re-read) complete the law.
//   B.  THE NOTICE TELLS EVERY PLATFORM ("update the tos and data privacy
//       like you did") — the terms move to 1.0.4: all three platforms'
//       user-data seats named, the JSON library described as the plain
//       file it is, and the SQLite history told whole (never read, never
//       written, never sent, free to delete).
//   C.  THE BEZEL DISCARDED ("dont add the outline around the logo, just
//       keep it as it is") — the 1.8.7 line's .about-morph::before bezel
//       never enters this tree: the logos' own glow law stands exactly
//       as 1.8.6 shipped it.
//   D.  THE VERSION FURNITURE (1.8.8 everywhere) + THE FINAL RELEASE
//       (the website folder retired; the README carries no private
//       material; the CI's one unparseable step name is quoted).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message.split('\n')[0]}`);
  }
};
const assertMatch = (hay, re, msg) => {
  if (!re.test(hay)) throw new Error(msg || `pattern never spoke: ${re}`);
};

const sf = src('src/components/SideFlow.jsx');
const cv = src('src/components/CharacterView.jsx');
const legal = src('src/constants/legal.js');
const css = src('src/index.css');
const pkg = src('package.json');
const lock = src('package-lock.json');
const constants = src('src/constants/index.js');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const release = src('RELEASE.md');
const ci = src('.github/workflows/ci.yml');

// the hook's own body — the census law lives here
const hookAt = sf.indexOf('export function useFlowEdges');
const hook = sf.slice(hookAt, sf.indexOf('export function FlowEdges'));

console.log('\nA. THE LAYOUT CENSUS ("the arrows remain still even if there is nothing to scroll")');

ok('A1 — the law note speaks its name (with the report own words)', () => {
  assertMatch(hook, /1\.8\.8 — THE LAYOUT CENSUS \("when opening a card that has a lot of\s*\n\s*\/\/ versions \.\.\. then switching to a version with a small amount of\s*\n\s*\/\/ versions, for some reason the arrows remain still even if there is\s*\n\s*\/\/ nothing to scroll, fix the logic for that/, 'the census note never spoke');
});
ok('A2 — the census reads the LAYOUT, not the paint (the chips own seats, transform-blind)', () => {
  assertMatch(hook, /const r = \(c\.offsetLeft \|\| 0\) \+ \(c\.offsetWidth \|\| 0\);/, 'the layout seat never spoke');
  assertMatch(hook, /max = Math\.max\(0, right - \(el\.offsetLeft \|\| 0\) - \(el\.clientLeft \|\| 0\) - el\.clientWidth\);/, 'the layout extent never spoke its arithmetic');
  assertMatch(hook, /transform-blind by construction, the same law the/, 'the transform-blind word never spoke');
});
ok('A3 — the paint census retired from the live path (scrollWidth speaks only the fallback)', () => {
  // the old law's own read — scrollWidth as the census — is gone; the
  // engine's word survives only inside the same-origin guard's fallback
  const reads = [...hook.matchAll(/el\.scrollWidth - el\.clientWidth/g)].length;
  assert.equal(reads, 1, 'the paint census still speaks outside the fallback');
  assertMatch(hook, /max = Math\.max\(0, el\.scrollWidth - el\.clientWidth\);/, 'the fallback never spoke the engine word');
});
ok('A4 — the same-origin guard names its kinship before it trusts the arithmetic', () => {
  assertMatch(hook, /const sameOrigin = kids\.length > 0 && kids\[0\]\.offsetParent === el\.offsetParent;/, 'the guard never spoke');
  assertMatch(hook, /falls back to the engine's own word \(the paint/, 'the fallback story never spoke');
});
ok('A5 — a rim\'s shave is not a scroll (the WORTH threshold gates every edge)', () => {
  assertMatch(hook, /const WORTH = 24;/, 'the WORTH seat never spoke');
  assertMatch(hook, /const live = max > WORTH;/, 'the census never spoke its worth gate');
  assertMatch(hook, /setCanL\(live && el\.scrollLeft > 1\);/, 'the left edge never spoke the live gate');
  assertMatch(hook, /setCanR\(live && el\.scrollLeft < max - 1\);/, 'the right edge never spoke the live gate');
});
ok('A6 — the stale seat retires with its content (the pin, idempotent)', () => {
  assertMatch(hook, /if \(pin && !dragging && el\.scrollLeft > max\) el\.scrollLeft = max;/, 'the pin never spoke');
  assertMatch(hook, /an idempotent write: once pinned, the pin/, 'the idempotent word never spoke');
});
ok('A7 — the pin\'s TWO guards (never on a scroll beat, never inside a drag)', () => {
  // the scroll listener speaks read(false) — the auto-pan must never
  // fight the census mid-drag
  assertMatch(hook, /const onScroll = \(\) => read\(false\);/, 'the scroll beat never stood the pin down');
  assertMatch(hook, /el\.addEventListener\('scroll', onScroll, \{ passive: true \}\);/, 'the scroll listener never took its seat');
  // the body's own drag word holds the pin off while a sort lives
  assertMatch(hook, /document\.body\.classList\.contains\('gd-sort-live'\);/, 'the drag word never spoke');
  assertMatch(hook, /the dragged chip's poke is/, 'the flight-not-seat word never spoke');
});
ok('A8 — the content speaks for itself (the MutationObserver net, attributes unwatched)', () => {
  assertMatch(hook, /if \(mo\) mo\.observe\(el, \{ childList: true, subtree: true, characterData: true \}\);/, 'the observer never took its seat');
  assertMatch(hook, /Attributes stay deliberately unwatched/, 'the unwatched word never spoke');
  assertMatch(hook, /const mo = typeof MutationObserver !== 'undefined' \? new MutationObserver\(\(\) => read\(true\)\) : null;/, 'the observer never spoke its read');
});
ok('A9 — the settling re-read keeps its seat (insurance now, not load-bearing truth)', () => {
  assertMatch(hook, /const settle = setTimeout\(\(\) => read\(true\), 200\);/, 'the settle clock never spoke');
  assertMatch(hook, /this is insurance,\s*\n\s*\/\/ not load-bearing truth/, 'the insurance word never spoke');
  assertMatch(hook, /clearTimeout\(settle\);/, 'the settle never cleared on unmount');
  assertMatch(hook, /if \(ro\) ro\.observe\(el\);/, 'the box RO never took its seat');
});
ok('A10 — the caller\'s deps unchanged (the census still hears every content road the caller names)', () => {
  assertMatch(cv, /const verEdges = useFlowEdges\(verStripRef, true, \[versions\.length, activeVerId, character\.id\]\);/, 'the caller lost its deps');
});
ok('A11 — the FLIP keeps its own seat untouched (the law the census learned to see through)', () => {
  // the 1.6.9 glide is exactly the flight whose poke the old census
  // mistook for a scroll — it stays, and the census sees through it
  assertMatch(cv, /1\.6\.9 — THE NEW VERSION KEY GLIDES BETWEEN ITS SEATS/, "the FLIP note never spoke");
  assertMatch(cv, /key\.style\.transform = `translateX\(\$\{Math\.round\(prev - x\)\}px\)`;/, 'the FLIP transform never spoke');
  assertMatch(cv, /const x = key\.offsetLeft;/, 'the FLIP never measured its layout seat');
});

console.log('\nB. THE NOTICE TELLS EVERY PLATFORM ("update the tos and data privacy like you did")');

ok('B1 — the terms moved to 1.0.6 (a meaningful change, the gate re-asks)', () => {
  // 1.9.1 — the paper house moved the seat again; the re-ask word keeps its law.
  assertMatch(legal, /export const TOS_VERSION = '1\.0\.6';/, 'the terms version never moved');
  assertMatch(legal, /A meaningful change: the version moves and every library meets/, 'the re-ask word never spoke');
});
ok('B2 — the terms speak the three platforms in their own seat', () => {
  assert.ok(legal.includes('on Windows, macOS, and Linux alike'), 'the terms never spoke the three platforms');
  assert.ok(legal.includes('wherever your platform keeps it (on Windows, %APPDATA%\\\\Burrito GenDex; on macOS, ~/Library/Application Support/Burrito GenDex; on Linux, ~/.config/Burrito GenDex)'), 'the privacy notice never named the three seats');
});
ok('B3 — the document library tells what it is', () => {
  // 1.9.1 — THE PAPER HOUSE: the notice speaks the journal now.
  assert.ok(legal.includes('gendex_db.nosql: the whole library'), 'the house never spoke its name');
  assert.ok(legal.includes('append-only journal of JSON documents'), 'the format word never spoke');
  assert.ok(legal.includes('It is not a server and not a cloud'), 'the local word never spoke');
});
ok('B4 — the one-time imports are told whole (read once, added, remembered)', () => {
  // 1.9.1 — the whole chain speaks: JSON -> SQLite -> NoSQL.
  assert.ok(legal.includes('each upgrade reads the old seat exactly ONCE and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('Releases before 1.9.1 used a SQLite database file (gendex_db.sqlite)'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('the old file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your current library'), 'the deletion word never spoke');
});
ok('B5 — the factory reset names the old files too', () => {
  // 1.9.1 — the whole chain's seats speak.
  assert.ok(legal.includes('(including any old SQLite or JSON file an earlier version left there)'), 'the deletion note never named the old files');
});
ok('B6 — the 1.0.2 em-dash law holds through the pass', () => {
  const codeOnly = legal
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  assert.ok(!codeOnly.includes('\u2014'), 'an em dash survived in the legal code');
});

console.log("\nC. THE BEZEL DISCARDED (\"dont add the outline around the logo, just keep it as it is\")");

ok('C1 — the 1.8.7 bezel never entered this tree (the outline stays retired)', () => {
  assert.ok(!css.includes('.about-morph::before'), 'the bezel law spoke in this tree');
  assert.ok(!css.includes("THE MARK'S OWN BEZEL"), 'the bezel note spoke in this tree');
});
ok('C2 — the logos\' own glow law stands exactly as 1.8.6 shipped it', () => {
  // the glow family keeps its seats: the halos, their hover steps, and
  // the spinning faces' own law — nothing gathered a rim around them
  assertMatch(css, /\.about-morph \.morph-halo \{/, 'the halo seat never spoke');
  assertMatch(css, /\.about-morph:hover \.morph-halo-a \{/, 'the halo-a hover step never spoke');
  assertMatch(css, /\.about-morph:hover \.morph-halo-b \{/, 'the halo-b hover step never spoke');
  assertMatch(css, /\.about-morph \.halo-glow \{/, 'the halo-glow seat never spoke');
});

console.log('\nD. THE VERSION FURNITURE + THE FINAL RELEASE');

ok('D1 — the version is 1.8.8 everywhere', () => {
  assert.equal(JSON.parse(pkg).version, '1.9.19', 'package.json');
  assert.ok((lock.match(/"version": "1\.9\.19"/g) || []).length >= 2, 'the lock root pins never moved');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
});
ok('D2 — the previous entry keeps its own seat (each version keeps its release)', () => {
  assertMatch(changelog, /^## 1\.8\.6 — The Patient Wheel/m, 'the 1.8.6 entry lost its seat');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  // the discarded 1.8.7 line never spoke its name in this tree's history
  assert.ok(!/^## 1\.8\.7/m.test(changelog), 'the discarded line spoke in the changelog');
});
ok('D3 — THE FINAL RELEASE: the website folder retired with the app', () => {
  assert.ok(!existsSync(path.join(root, '..', 'website')), 'the website folder still ships');
  assertMatch(changelog, /the one-file website \(the landing page the repo carried since 1\.2\.5\) retires with the final version/, 'the changelog never told the retirement');
});
ok('D4 — the README carries no private material (the recipe speaks placeholders only)', () => {
  const low = readme.toLowerCase();
  assert.ok(!low.includes('password'), 'a password spoke in the README');
  assert.ok(!low.includes('ilovemumei'), 'the private word spoke in the README');
  assert.ok(!readme.includes('signtool'), 'a signing command spoke in the README');
  assert.ok(!readme.includes('.pfx'), 'a certificate path spoke in the README');
  assert.ok(release.includes('<YOUR-PFX-PASSWORD>'), 'the release recipe lost its placeholder');
});
ok('D5 — the CI workflow parses strict (the colon step name is quoted)', () => {
  assertMatch(ci, /- name: "Package the app \(forge: main \+ renderer webpack \+ electron\)"/, 'the step name never took its quotes');
  assert.ok(!/^      - name: Package the app \(forge:/m.test(ci), 'the unquoted colon step spoke');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
