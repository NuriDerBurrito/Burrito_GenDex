#!/usr/bin/env node
// 1.8.2 ANIMATION-PROBE (Playwright/Chromium) — settles the snapshot's law
// on a real engine before the version ships:
//   A. Does the freeze rule PAUSE every animation inside a .gd-drag-ghost
//      subtree — elements AND pseudo-elements alike — as the live WAAPI
//      objects themselves report (playState 'paused', the phase held)?
//   B. Without the rule (the control twin), do the same animations run at
//      'running' — proving the rule is what stills the pull?
//   C. Does the wrapper's own opacity breath survive (a TRANSITION, not an
//      animation — the 1.8.1 soft birth keeps its voice)?
//   D. Do the paused coats keep their names (paused mid-flight, never
//      canceled — a photograph, not an empty seat)?
// The probe replicates the app's ghost law verbatim: the fixed wrapper with
// its 0.12s opacity transition, the freeze rule on * + pseudos, and a cloned
// card-ish subtree carrying an infinite hue cycle, a delayed drift (the
// --gd-fin-ph negative-delay phase family), and a ::before shimmer.
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 20px; background: #ffffff; }
  @keyframes probe-hue { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }
  @keyframes probe-drift { from { transform: translateY(0); } to { transform: translateY(30px); } }
  @keyframes probe-shimmer { from { opacity: 0.1; } to { opacity: 0.9; } }
  .coat { width: 120px; height: 80px; background: #c08040; }
  .coat.hue { animation: probe-hue 6s linear infinite; }
  .coat.drift { animation: probe-drift 9s linear infinite; animation-delay: calc(var(--gd-fin-ph, 0) * -9s); }
  .shimmer::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #ffffff;
    animation: probe-shimmer 2s ease-in-out infinite;
  }
  .gd-drag-ghost {
    position: fixed;
    left: 0;
    top: 0;
    margin: 0;
    overflow: hidden;
    transform-origin: 0 0;
    pointer-events: none;
    z-index: 900;
    opacity: 0.55;
    transition: opacity 0.12s ease;
    border-radius: 8px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  }
  /* 1.8.2 — THE PULL IS A SNAPSHOT: the freeze law, verbatim */
  .gd-drag-ghost *,
  .gd-drag-ghost *::before,
  .gd-drag-ghost *::after {
    animation-play-state: paused !important;
  }
  /* the control twin: the same subtree WITHOUT the freeze (a bare wrapper) */
  .control-ghost {
    position: fixed;
    left: 0;
    top: 200px;
    margin: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: 0.55;
    transition: opacity 0.12s ease;
  }
</style></head><body>
  <div class="gd-drag-ghost" id="frozen">
    <div class="coat hue"></div>
    <div class="coat drift" style="--gd-fin-ph: 0.42"></div>
    <div class="shimmer" style="position: relative; width: 120px; height: 40px;"></div>
  </div>
  <div class="control-ghost" id="control">
    <div class="coat hue"></div>
    <div class="coat drift" style="--gd-fin-ph: 0.42"></div>
    <div class="shimmer" style="position: relative; width: 120px; height: 40px;"></div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 500 } });
await page.setContent(html);

let passed = 0;
let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ok — ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL — ${name}${detail ? ' — ' + detail : ''}`);
  }
};

const read = await page.evaluate(() => {
  const collect = (rootId) => {
    const root = document.getElementById(rootId);
    const anims = root.getAnimations({ subtree: true });
    return {
      count: anims.length,
      allPaused: anims.every((a) => a.playState === 'paused'),
      anyRunning: anims.some((a) => a.playState === 'running'),
      names: anims.map((a) => (a.animationName ? a.animationName : a.constructor.name)),
      wrapperTransition: getComputedStyle(root).transitionProperty,
      wrapperOpacity: getComputedStyle(root).opacity,
    };
  };
  return { frozen: collect('frozen'), control: collect('control') };
});

console.log('A. THE FREEZE STILLS THE WHOLE SUBTREE (elements + pseudos)');
ok('A1 — the frozen subtree carries its animations (3 coats + a pseudo)', read.frozen.count >= 3, `counted ${read.frozen.count}`);
ok('A2 — every animation in the ghost reports playState PAUSED', read.frozen.allPaused, JSON.stringify(read.frozen.names));
ok('A3 — none still runs', !read.frozen.anyRunning);

console.log('B. THE CONTROL TWIN KEEPS RUNNING (the rule is what stills it)');
ok('B1 — the control subtree carries the same animations', read.control.count >= 3, `counted ${read.control.count}`);
ok('B2 — the control animations RUN (the twin proves the freeze rule\'s reach)', read.control.anyRunning);

console.log('C. THE WRAPPER\'S OWN BREATH SURVIVES (transition, not animation)');
ok('C1 — the wrapper keeps its opacity transition', read.frozen.wrapperTransition.includes('opacity'), `got ${read.frozen.wrapperTransition}`);
ok('C2 — the wrapper keeps the 1.8.1 faded weight', read.frozen.wrapperOpacity === '0.55', `got ${read.frozen.wrapperOpacity}`);

console.log('D. THE COATS KEEP THEIR NAMES (paused, never canceled)');
ok('D1 — the hue coat holds its name', read.frozen.names.includes('probe-hue'), JSON.stringify(read.frozen.names));
ok('D2 — the drift coat holds its name', read.frozen.names.includes('probe-drift'));
ok('D3 — the pseudo shimmer holds its name', read.frozen.names.includes('probe-shimmer'));

console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
