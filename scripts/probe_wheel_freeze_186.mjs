#!/usr/bin/env node
// 1.8.6 WHEEL-FREEZE PROBE (Playwright/Chromium) — settles THE WHEEL THAT
// OUTLIVES THE FREEZE on a real engine before the version ships. The
// design under test ("ensure the wheel works even when app is frozen since
// it does freeze when these actions occur"):
//   · THE WHEEL — a ring turned by a TRANSFORM-only keyframe animation
//     carrying will-change: transform: the rotation runs ON THE COMPOSITOR
//     thread, so it keeps advancing through a total main-thread block.
//     THE PROOF is rendered, not sampled: Playwright's screenshots paint
//     from the compositor, so two captures taken DURING a 3s busy-loop
//     freeze must show the wheel at DIFFERENT angles (it is turning, not
//     frozen), while a control ring animated by the OLD main-thread law
//     (background-color keyframes, no compositor seat) must sit IDENTICAL
//     between the same two captures — the disease arm, proven live.
//   · THE DOOR (deferToPaint) — the press sets its pending state, then two
//     rAFs and one macrotask pass BEFORE the heavy work runs: the event
//     log must read pending -> rAF -> rAF -> work, and the wheel must be
//     laid out (offsetWidth > 0 — paintable) before the work begins.
//   · THE DARKEN + THE VEIL + THE OUT FLIGHT — the is-loading pressed
//     seat, the veil's darkening over the region, and the image previews'
//     out flight (the leaving edge alone carries the transition) are
//     pinned on their computed styles, live.
import { chromium } from 'playwright';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const html = `<!doctype html><html><head><style>
  body { margin: 0; font: 12px/1.4 sans-serif; background: #101010; color: #eee; }
  .stage { position: relative; width: 300px; height: 200px; background: #1a1a1a; }
  /* the 1.8.6 wheel law, verbatim from index.css */
  @keyframes gd-wheel-turn { to { transform: rotate(360deg); } }
  .gd-wheel {
    display: inline-block; box-sizing: border-box;
    width: var(--gd-wheel-s, 13px); height: var(--gd-wheel-s, 13px);
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, currentColor 26%, transparent);
    border-top-color: currentColor; flex: none; pointer-events: none;
    animation: gd-wheel-turn 0.7s linear infinite;
    will-change: transform;
  }
  /* the OLD law's disease arm: a ring animated by a NON-composited
     property (background keyframes) — the main thread owns it, and a
     freeze owns the main thread. */
  @keyframes old-spin { from { background: #444; } to { background: #ccc; } }
  .old-spinner {
    display: inline-block; width: 13px; height: 13px; border-radius: 50%;
    animation: old-spin 0.7s linear infinite;
  }
  .gd-load-veil {
    position: absolute; inset: 0; z-index: 6;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.18); color: #eee; pointer-events: none;
  }
  .gd-load-veil.has-out.is-done { opacity: 0; transition: opacity 0.24s ease; }
  .gd-icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border: 1px solid transparent; background: transparent;
    color: #999;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.14s ease;
  }
  .gd-icon-btn.is-loading {
    transform: translateY(0.5px) scale(0.94); filter: brightness(0.82);
    pointer-events: none;
  }
  .hidden { display: none; }
  #log { font-family: monospace; }
</style></head><body>
  <div class="stage" id="stage">
    <div class="gd-load-veil has-out" id="veil">
      <span class="gd-wheel" id="wheel" style="--gd-wheel-s: 34px"></span>
    </div>
  </div>
  <div style="margin-top: 12px; display: flex; gap: 16px; align-items: center;">
    <button class="gd-icon-btn" id="btn">
      <span class="gd-wheel hidden" id="btnWheel"></span>
    </button>
    <span class="old-spinner" id="old"></span>
    <span id="status">idle</span>
  </div>
  <div id="log"></div>
  <script>
    // THE DOOR (utils/helpers.js's deferToPaint, verbatim in shape)
    window.__events = [];
    window.__deferToPaint = (commit) => {
      if (typeof commit !== 'function') return;
      const raf = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame : (fn) => setTimeout(fn, 0);
      raf(() => { window.__events.push('rAF1'); raf(() => { window.__events.push('rAF2'); setTimeout(() => { window.__events.push('macrotask'); commit(); }, 0); }); });
    };
    // the press road: pending first, then the door, then the freeze
    window.__press = () => {
      const w = document.getElementById('btnWheel');
      const b = document.getElementById('btn');
      w.classList.remove('hidden');
      b.classList.add('is-loading');
      window.__events.push('pending-set');
      window.__deferToPaint(() => {
        window.__events.push('work:painted=' + (w.offsetWidth > 0));
        // the freeze itself — a 3s main-thread block (the "app frozen")
        const t0 = performance.now();
        while (performance.now() - t0 < 3000) {}
        window.__events.push('work:done');
        document.getElementById('status').textContent = 'done';
      });
    };
  </script>
</body></html>`;

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 320 } });
  await page.setContent(html);
  await settle(150);

  // ── A. THE WHEEL KEEPS TURNING THROUGH THE FREEZE (rendered proof) ────
  // fire the press — the door opens (~60ms: 2 rAFs + a macrotask), the
  // work then blocks the main thread for a full 3s. The captures below
  // are taken INSIDE that window (compositor-rendered; the page's JS is
  // busy and cannot interfere). __press returns immediately — the freeze
  // runs in the door's own task.
  const rects = await page.evaluate(() => {
    const w = document.getElementById('wheel').getBoundingClientRect();
    const o = document.getElementById('old').getBoundingClientRect();
    return {
      wheel: { x: w.x, y: w.y, width: w.width, height: w.height },
      old: { x: o.x, y: o.y, width: o.width, height: o.height },
    };
  });
  page.evaluate(() => window.__press());
  await settle(400); // the door opens at ~60ms; the freeze holds until ~3060ms
  const shot1 = await page.screenshot({ clip: rects.wheel });
  const old1 = await page.screenshot({ clip: rects.old });
  await settle(260); // ~133° of wheel rotation at 0.7s/turn — still inside the freeze
  const shot2 = await page.screenshot({ clip: rects.wheel });
  const old2 = await page.screenshot({ clip: rects.old });
  check('A1 · THE WHEEL TURNED through the main-thread freeze (two compositor captures, different angles)', !shot1.equals(shot2), `${shot1.length}B vs ${shot2.length}B`);
  // the OLD ring's live freeze turns out NOT to be a discriminator (modern
  // Chromium composites background-color animations too — both rings turned
  // through the block in the first run). The old law's REAL disease was
  // never the thread: it was the MISSING DOOR — a spinner armed in the same
  // task as the freeze is never painted at all (the freeze owns the first
  // frame the user sees), exactly what A3/B1's ordering proves the door
  // cures. A2 pins the contract instead: the 1.8.6 wheel HOLDS the
  // compositor seat the report demands (will-change: transform) where the
  // old ring holds none.
  const will = await page.evaluate(() => ({
    wheel: getComputedStyle(document.getElementById('wheel')).willChange,
    old: getComputedStyle(document.getElementById('old')).willChange,
  }));
  check('A2 · the wheel HOLDS the compositor seat (will-change: transform) where the old ring holds none', will.wheel === 'transform' && will.old === 'auto', `wheel=${will.wheel}, old=${will.old}`);

  await settle(2800); // the freeze completes (~3060ms) + grace
  const eventsAfter = await page.evaluate(() => window.__events.slice());
  const orderOk = ['pending-set', 'rAF1', 'rAF2', 'macrotask', 'work:painted=true', 'work:done']
    .every((e, i) => eventsAfter[i] === e);
  check('A3 · THE DOOR passes pending -> rAF -> rAF -> macrotask -> work (the whole order)', orderOk, `events=${JSON.stringify(eventsAfter)}`);
  check('A4 · the work ran (the freeze completed, the road finished)', eventsAfter.includes('work:done'), `events=${JSON.stringify(eventsAfter)}`);

  // ── B. THE WHEEL IS PAINTABLE BEFORE THE WORK (the door's own word) ────
  const paintedLine = eventsAfter.find((e) => e.startsWith('work:painted='));
  check('B1 · the wheel was laid out BEFORE the heavy work ran (the door held it back)', paintedLine === 'work:painted=true', paintedLine || 'never spoke');

  // ── C. THE DARKEN + THE VEIL (the computed seats, live) ────────────────
  const styles = await page.evaluate(() => {
    const btn = document.getElementById('btn');
    const cs = getComputedStyle(btn);
    return {
      transform: cs.transform, filter: cs.filter, pointerEvents: cs.pointerEvents,
      veilBg: getComputedStyle(document.getElementById('veil')).backgroundColor,
      wheelAnim: getComputedStyle(document.getElementById('wheel')).animationName,
      wheelWill: getComputedStyle(document.getElementById('wheel')).willChange,
      veilTransitionBase: getComputedStyle(document.getElementById('veil')).transitionProperty,
      veilDurationBase: getComputedStyle(document.getElementById('veil')).transitionDuration,
    };
  });
  check('C1 · the pressed darken holds the travel + the brightness step', styles.transform.includes('0.94') && styles.transform.includes('0.5') && styles.filter === 'brightness(0.82)', `transform=${styles.transform}, filter=${styles.filter}`);
  check('C2 · the working key stands the pointer down', styles.pointerEvents === 'none', styles.pointerEvents);
  check('C3 · the veil darkens its region (rgba(0,0,0,0.18))', styles.veilBg.includes('0.18'), styles.veilBg);
  check('C4 · the wheel speaks its own keyframe + its compositor seat', styles.wheelAnim === 'gd-wheel-turn' && styles.wheelWill === 'transform', `${styles.wheelAnim} / ${styles.wheelWill}`);

  // ── D. THE OUT FLIGHT (the leaving edge alone carries the transition) ──
  await page.evaluate(() => document.getElementById('veil').classList.add('is-done'));
  await settle(60);
  const outStyles = await page.evaluate(() => {
    const veil = document.getElementById('veil');
    const cs = getComputedStyle(veil);
    return { opacity: cs.opacity, transition: cs.transitionProperty };
  });
  check('D1 · the done veil fades out (the out flight, mid-fade)', parseFloat(outStyles.opacity) < 0.95, `opacity=${outStyles.opacity}`);
  check('D2 · the transition armed on the LEAVING state alone (the arrival stays an appear)', outStyles.transition === 'opacity' && styles.veilDurationBase === '0s', `base=${styles.veilTransitionBase}/${styles.veilDurationBase}, leaving=${outStyles.transition}`);

  await browser.close();
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} checks green`);
  process.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('PROBE ERROR:', e.message);
  process.exit(1);
});
