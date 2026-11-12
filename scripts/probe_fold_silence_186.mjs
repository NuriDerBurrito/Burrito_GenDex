#!/usr/bin/env node
// 1.8.6 FOLD-SILENCE PROBE (Playwright/Chromium) — settles THE SILENT
// ASCENT on a real engine BEFORE the version ships. The design under test
// (the cure for "currently when i scroll up it opens the tags/stamps, fix
// that so the scroll upwards wont affect so ... instead expanding should
// just be manual by the user like usual"):
//   · THE SILENCE — an up-tick answers NOTHING: the tray stays exactly as
//     folded as the last down-tick left it. No hem gate (a debt standing),
//     no flow-origin restore (the scroll rising back to the fold's seat),
//     no dead zone — all of it retired with the seat economy that bred it.
//   · THE ONE ROAD — every fold rides the FLOW road: the page shortens
//     WITH the tray's 0.24s tweened flight, the content rises into the
//     space the tray vacates, monotonic, never a snap-back.
//   · THE HAND — expanding is manual by the user alone: the chip below the
//     folded plate flips the tray open, the page growing back with the
//     same flight (the standard accordion breath).
//   · THE GATES KEPT — the journey's start decides (from the top it folds
//     wherever the first tick lands), the between-band stands down until
//     the scroll passes the tray's hem, and the listener never writes the
//     scroll offset at all (the 1.8.4 crown, kept verbatim).
// The probe replicates the app's own geometry verbatim — the sticky header
// carrying the tray, the version strip + wells under it, the tray/chipline
// padding transitions from index.css, the 1.4.0 overflow-anchor none, the
// down-only gate, the hover/pin holds, and a 0.24s eased tween standing in
// for framer's own body flight. NO SEAT ELEMENT EXISTS (1.8.6 retired it).
import { chromium } from 'playwright';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const html = `<!doctype html><html><head><style>
  body { margin: 0; font: 12px/1.4 sans-serif; }
  .scroller { height: 600px; overflow-y: auto; overflow-x: hidden;
              overflow-anchor: none; position: relative; background: #0f0f0f; }
  .head { position: sticky; top: 0; z-index: 20; background: #191919;
          border-bottom: 1.5px solid #3d3d3d; padding: 16px 0 12px; }
  .controls { height: 40px; background: #232323; }
  .name-fold { height: 70px; overflow: hidden; margin-top: 6px;
               background: #1d1d1d; }
  .tray { margin-top: 10px; border: 1px solid #2e2e2e; padding: 7px 9px;
          background: #161616;
          transition: padding-top 0.24s ease, padding-bottom 0.24s ease; }
  .tray.gd-rows-folded { padding-top: 5px; padding-bottom: 5px; }
  .body { overflow: hidden; height: 300px; background: #1a1a1a; }
  .chipline { display: flex; justify-content: center; align-items: center;
              min-height: 20px; margin-top: 3px;
              transition: min-height 0.24s ease, margin-top 0.24s ease; }
  .tray.gd-rows-folded .chipline { min-height: 14px; margin-top: 0; }
  .strip { height: 30px; background: #202020; }
  .wells { height: 1400px; background: #141414; color: #666; }
</style></head><body>
  <div class="scroller" id="scroller">
    <div class="head" id="head">
      <div class="controls">controls</div>
      <div class="name-fold" id="nameFold">the name</div>
      <div class="tray" id="tray">
        <div class="body" id="body">the tags + stamps rows</div>
        <div class="chipline" id="chipline">the traveling chip</div>
      </div>
    </div>
    <div class="strip" id="strip">the version strip</div>
    <div class="wells" id="wells">the wells</div>
  </div>
  <script>
    const scroller = document.getElementById('scroller');
    const tray = document.getElementById('tray');
    const body = document.getElementById('body');
    const nameFold = document.getElementById('nameFold');
    const strip = document.getElementById('strip');
    const BODY_NATURAL = 300;

    // ── the controller (CharacterView's own 1.8.6 seats, verbatim in shape) ──
    const S = {
      autoCollapsed: false, foldRestH: 0, journeyStart: null,
      lastScroll: null, hover: false, pinned: false,
      offsetWrites: 0, testWrites: 0,
    };
    // the instrumented offset (the listener must NEVER write it — the
    // 1.8.4 crown, kept): every set is counted, the test's own sets
    // counted separately.
    {
      const d = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
      Object.defineProperty(scroller, 'scrollTop', {
        get: () => d.get.call(scroller),
        set: (v) => { S.offsetWrites += 1; d.set.call(scroller, v); },
        configurable: true,
      });
    }
    window.__testScroll = (v) => { S.testWrites += 1; scroller.scrollTop = v; };
    window.__S = S;

    // ── the 0.24s eased tween (framer's own flight, stood in) ──
    let tweenRaf = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 3); // ~ cubic-bezier(.25,.9,.35,1)
    let flightFrames = 0;
    function startTween() {
      cancelAnimationFrame(tweenRaf);
      flightFrames = 0;
      const from = body.offsetHeight;
      const to = S.autoCollapsed ? 0 : BODY_NATURAL;
      const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / 240);
        body.style.height = (from + (to - from) * ease(t)).toFixed(2) + 'px';
        if (window.__flightWatch) flightFrames += 1;
        if (t < 1) tweenRaf = requestAnimationFrame(step);
        else tweenRaf = 0;
      };
      tweenRaf = requestAnimationFrame(step);
    }
    function setAutoCollapsed(v) {
      if (S.autoCollapsed === v) return;
      S.autoCollapsed = v;
      tray.classList.toggle('gd-rows-folded', v);
      startTween();
      if (v) {
        // 1.8.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT: the
        // settle clock (420ms after the flip), never mid-flight.
        setTimeout(() => {
          if (S.autoCollapsed) S.foldRestH = tray.offsetHeight;
        }, 420);
      }
    }
    window.__setAutoCollapsed = setAutoCollapsed;
    window.__watchFlight = () => { window.__flightWatch = true; };
    window.__flightFrames = () => { const f = flightFrames; flightFrames = 0; window.__flightWatch = false; return f; };

    // ── THE LISTENER (1.8.6 — the whole law) ──
    let wasDown = false;
    window.__resetListener = () => { S.lastScroll = scroller.scrollTop; wasDown = false; S.journeyStart = null; };
    S.lastScroll = scroller.scrollTop;
    const onScroll = () => {
      const prev = S.lastScroll;
      S.lastScroll = scroller.scrollTop;
      const down = scroller.scrollTop - (prev == null ? scroller.scrollTop : prev) > 2;
      if (down && !wasDown) S.journeyStart = prev == null ? scroller.scrollTop : prev;
      wasDown = down;
      // 1.8.6 — THE SILENT ASCENT: the scroll speaks ONE direction — DOWN.
      // An up-tick answers NOTHING (expanding is the hand's work alone).
      if (!down) return; // THE SILENCE
      // 1.4.7 — the hover hold
      if (S.hover) return;
      if (S.pinned) return;
      const willFold = !(S.autoCollapsed === true);
      if (!willFold) return;
      // 1.8.6 — THE ROAD CHOICE, AND THERE IS ONLY ONE ROAD:
      //   · THE FLOW ROAD — the page shortens WITH the flight.
      //   · THE BETWEEN-BAND (mid-page, short of the hem) stands down.
      const dEst = Math.max(0, tray.offsetHeight - (S.foldRestH || 26));
      if (dEst < 4) return;
      const fromTop = (S.journeyStart == null ? prev : S.journeyStart) <= 32;
      if (!fromTop && scroller.scrollTop < dEst) return; // the between-band
      setAutoCollapsed(true);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
  </script>
</body></html>`;

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 640 } });
  await page.setContent(html);
  await settle(80);

  const S = () => page.evaluate(() => window.__S);
  const state = () =>
    page.evaluate(() => ({
      folded: window.__S.autoCollapsed,
      bodyH: document.getElementById('body').offsetHeight,
      sh: document.getElementById('scroller').scrollHeight,
      st: document.getElementById('scroller').scrollTop,
      stripFlow: document.getElementById('strip').getBoundingClientRect().top
        + document.getElementById('scroller').scrollTop,
    }));

  // ── A. THE SILENCE (the report's own word) ────────────────────────────
  // fold from the top, let it land, then scroll ALL the way back up —
  // the tray must stay folded.
  const shOpen = (await state()).sh; // the baseline, measured at rest
  await page.evaluate(() => window.__resetListener());
  await page.evaluate(() => window.__watchFlight());
  await page.evaluate(() => window.__testScroll(180));
  await settle(120);
  const aFold = await state();
  check('A1 · the fold commits from the top (the flow road, kept whole)', aFold.folded === true, `folded=${aFold.folded}, body=${aFold.bodyH.toFixed(0)}px`);
  const aFrames = await page.evaluate(() => window.__flightFrames());
  check('A2 · the fold TWEENS (the 0.39.0 breath, kept)', aFrames >= 4, `${aFrames} intermediate frames`);
  await settle(260); // the flight's own rest (240ms clock + grace)
  const aRest = await state();
  const gave = shOpen - aRest.sh;
  check('A3 · the page shortens with the flight (the flow give)', gave > 200, `the flow gave ${gave.toFixed(0)}px`);
  // the ascent — THE WHOLE REPORT
  await page.evaluate(() => window.__resetListener());
  await page.evaluate(() => window.__testScroll(0));
  await settle(360);
  const aSilent = await state();
  check('A4 · THE SILENCE — scrolling back to the top opens NOTHING (the report own ask)', aSilent.folded === true && aSilent.bodyH < 4, `folded=${aSilent.folded}, body=${aSilent.bodyH.toFixed(1)}px`);
  // partial ascent too
  await page.evaluate(() => window.__resetListener());
  await page.evaluate(() => window.__testScroll(60));
  await settle(200);
  const aSilent2 = await state();
  check('A5 · a PARTIAL ascent opens nothing either', aSilent2.folded === true, `folded=${aSilent2.folded}`);
  // down again re-arms nothing weird (already folded — the gate holds;
  // the only offset writes are the probe's own)
  const sBefore = await S();
  await page.evaluate(() => window.__resetListener());
  await page.evaluate(() => window.__testScroll(120));
  await settle(120);
  const sAfter = await S();
  // the instrumented setter counts EVERY write (the probe's own included);
  // the app's writes are the difference.
  const probeWrites = sAfter.testWrites - sBefore.testWrites;
  const appWrites = (sAfter.offsetWrites - sBefore.offsetWrites) - probeWrites;
  check('A6 · a down-tick with the tray already folded is a no-op (no double fold, no app write)', appWrites === 0 && probeWrites === 1, `app writes=${appWrites}, probe writes=${probeWrites}`);

  // ── B. THE HAND (expanding is manual by the user) ─────────────────────
  // the chip's road — the state flips open, the page grows back with it.
  await page.evaluate(() => window.__watchFlight());
  await page.evaluate(() => window.__setAutoCollapsed(false));
  await settle(360);
  const bOpen = await state();
  const bFrames = await page.evaluate(() => window.__flightFrames());
  check('B1 · the HAND opens the tray (the chip road — the state flip)', bOpen.folded === false && bOpen.bodyH > 290, `body=${bOpen.bodyH.toFixed(0)}px`);
  check('B2 · the rows pour back in as a FLIGHT (the expand animation, kept)', bFrames >= 4, `${bFrames} intermediate frames`);
  const grew = bOpen.sh - aSilent.sh;
  check('B3 · the page grows back WITH the opening ("it effects the scroll when opening", the 1.8.5 word kept)', grew > 200, `the flow grew ${grew.toFixed(0)}px`);

  // ── C. THE BETWEEN-BAND (the gate the owner loves, kept verbatim) ─────
  await page.evaluate(() => window.__resetListener());
  await page.evaluate(() => window.__setAutoCollapsed(false));
  await settle(360);
  // a journey begun mid-page, short of the hem — stands down
  await page.evaluate(() => window.__testScroll(80));
  await settle(60);
  await page.evaluate(() => window.__resetListener()); // journey starts at 80 (mid-page)
  await page.evaluate(() => window.__testScroll(110));
  await settle(160);
  const cMid = await state();
  check('C1 · a mid-page journey short of the hem stands down (the 1.8.4 ground, kept)', cMid.folded === false, `folded=${cMid.folded}`);
  // past the hem it folds
  await page.evaluate(() => window.__testScroll(400));
  await settle(360);
  const cHem = await state();
  check('C2 · the next tick past the hem takes the road', cHem.folded === true, `folded=${cHem.folded}`);

  // ── D. THE MANUAL COLLAPSE keeps its own tween ────────────────────────
  await page.evaluate(() => window.__setAutoCollapsed(false));
  await settle(360);
  await page.evaluate(() => window.__watchFlight());
  await page.evaluate(() => window.__setAutoCollapsed(true));
  await settle(360);
  const dFrames = await page.evaluate(() => window.__flightFrames());
  check('D1 · the manual collapse keeps its tween (the watched move)', dFrames >= 4, `${dFrames} intermediate frames`);

  // ── E. THE CROWN (the listener never writes the offset) ───────────────
  const sFinal = await S();
  check('E1 · the listener never writes the scroll offset at all (the 1.8.4 crown, kept verbatim)', sFinal.offsetWrites === sFinal.testWrites, `app offset writes=${sFinal.offsetWrites}, test writes=${sFinal.testWrites}`);

  await browser.close();
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} checks green`);
  process.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('PROBE ERROR:', e.message);
  process.exit(1);
});
