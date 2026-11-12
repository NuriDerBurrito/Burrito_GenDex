#!/usr/bin/env node
// 1.8.5 FOLD-PAYER PROBE (Playwright/Chromium) — settles the whole tray
// architecture on a real engine BEFORE the version's code is written. The
// design under test (the cure for "the expand animation isnt playing
// anymore" + "its still buggy and only occurs when i do the collapse
// animation" + "when scrolling down from top of the detail panel, the
// stamps/tags doesnt collapse / i want it to effect it when opening and
// closing but not look buggy like before"):
//   · THE PAYER — one law for the seat: seat = clamp(D0 - (H(t) - H0))
//     where H is the live measured height of the header's own folding
//     ground (the tray zone + the name's fold wrapper). Launched at a fold
//     (D0 = 0), the seat charges UP by exactly what the header loses, per
//     frame — the flow's total never changes, the content below the header
//     never moves, and the tray TWEENS closed (0.24s, the 0.39.0 breath
//     restored) instead of snapping. Launched at a restore/dismissal
//     (D0 = the current debt), the seat pays DOWN by exactly what the
//     header regains — the tray TWEENS open over the space the seat
//     vacates — THE EXPAND ANIMATION PLAYS with nothing below the header
//     ever moving a pixel.
//   · THE TWO ROADS — the scroll-fold's commit road is chosen BEFORE any
//     paint: scrolled past the tray's hem (scrollTop >= dEst) the fold
//     rides the payer (the cover law — the content in the back acts
//     independently, exactly the 1.8.4 word); from the top (the downward
//     journey began at/near the top) the fold rides the FLOW (no seat, no
//     pay — the page shortens with the flight, the content rises into the
//     tray's vacated space — "it effects the scroll when opening and
//     closing" without ever snapping back); between the two (a journey
//     begun mid-page, short of the hem) the attempt stands down — the
//     1.8.4 guard's own ground, where neither road reads right.
// The probe replicates the app's own geometry verbatim: the sticky header
// carrying the tray, the seat below it, the version strip + wells under
// that, the tray/chipline/padding transitions from index.css, the
// 1.4.0 overflow-anchor none, the 1.4.5 seed-at-attach, the down-only
// gate, the hover/pin holds, the dead zone, the journey-start law, and a
// 0.24s eased tween standing in for framer's own body flight.
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
  .seat { height: 0; }
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
    <div class="seat" id="seat"></div>
    <div class="strip" id="strip">the version strip</div>
    <div class="wells" id="wells">the wells</div>
  </div>
  <script>
    const scroller = document.getElementById('scroller');
    const tray = document.getElementById('tray');
    const body = document.getElementById('body');
    const seat = document.getElementById('seat');
    const nameFold = document.getElementById('nameFold');
    const strip = document.getElementById('strip');
    const BODY_NATURAL = 300;

    // ── the controller (CharacterView's own seats, verbatim in shape) ──
    const S = {
      autoCollapsed: false, debt: 0, hem: 0, flowFolded: false,
      flowOrigin: 0, dead: 0, journeyStart: null, lastScroll: null,
      hover: false, pinned: false, offsetWrites: 0, testWrites: 0,
      payer: { ro: null, retireT: 0, d0: 0, h0: 0 },
    };
    // the instrumented offset (the listener must NEVER write it — the
    // 1.8.4 crown jewel kept): every set is counted, the test's own sets
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

    // ── the 0.24s eased tween (framer's own flight, stood in) ──
    let tweenRaf = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 3); // ~ cubic-bezier(.25,.9,.35,1)
    function startTween() {
      cancelAnimationFrame(tweenRaf);
      const from = body.offsetHeight;
      const to = S.autoCollapsed ? 0 : BODY_NATURAL;
      const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / 240);
        body.style.height = (from + (to - from) * ease(t)).toFixed(2) + 'px';
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
    }
    window.__setAutoCollapsed = setAutoCollapsed;

    // ── THE PAYER (the 1.8.5 law — one formula, both directions) ──
    // A ResizeObserver is the engine, NOT a rAF loop: the observer's
    // callback fires AFTER the frame's layout (the browser's own post-
    // layout seat), so the tray's measured height always includes the
    // tween's per-frame write — a rAF reader registered before the tween's
    // own rAF would read the LAST frame's height and the seat would lag a
    // frame behind (the probe's own first run caught exactly that wobble:
    // the strip drifting ~26px through the flight).
    function launchPayer() {
      if (S.payer.ro) { S.payer.ro.disconnect(); clearTimeout(S.payer.retireT); }
      S.payer.d0 = seat.offsetHeight;
      S.payer.h0 = tray.offsetHeight + nameFold.offsetHeight;
      const apply = () => {
        const h = tray.offsetHeight + nameFold.offsetHeight;
        const next = Math.max(0, S.payer.d0 - (h - S.payer.h0));
        seat.style.height = next.toFixed(2) + 'px';
        S.debt = next;
      };
      apply(); // the launch write: seat = D0 (nothing has moved yet)
      const ro = new ResizeObserver(() => {
        apply();
        if (window.__roSeries) {
          window.__roSeries.push({
            stripFlow: strip.getBoundingClientRect().top + scroller.scrollTop,
            sh: scroller.scrollHeight,
            seatH: seat.offsetHeight,
            trayH: tray.offsetHeight,
            st: scroller.scrollTop,
          });
        }
        clearTimeout(S.payer.retireT);
        S.payer.retireT = setTimeout(() => {
          ro.disconnect();
          if (S.autoCollapsed) S.hem = tray.offsetHeight; // the folded rest, cached
          S.payer.ro = null;
        }, 420);
      });
      ro.observe(tray);
      ro.observe(nameFold);
      S.payer.ro = ro;
    }
    window.__launchPayer = launchPayer;
    window.__payerLive = () => !!S.payer.ro;

    // ── the listener (the new law: the road choice + the restores) ──
    let wasDown = false;
    function onScroll() {
      const prev = S.lastScroll;
      S.lastScroll = scroller.scrollTop;
      const down = scroller.scrollTop - (prev == null ? scroller.scrollTop : prev) > 2;
      if (down && !wasDown) S.journeyStart = prev == null ? scroller.scrollTop : prev;
      wasDown = down;
      // THE SEAT-ROAD RESTORE: the strip emerges from under the header's
      // apron — the cover re-extends, the payer paying the loan down as
      // the header regains its height.
      if (S.debt > 0 && scroller.scrollTop < S.debt) {
        S.flowFolded = false;
        S.dead = scroller.scrollTop + 48;
        launchPayer();
        setAutoCollapsed(false);
        return;
      }
      if (prev == null) return;
      // THE FLOW-ROAD RESTORE: the scroll rose back to the fold own origin.
      if (!down && S.flowFolded && prev - scroller.scrollTop > 2 && scroller.scrollTop <= S.flowOrigin + 8) {
        S.flowFolded = false;
        S.dead = scroller.scrollTop + 48;
        setAutoCollapsed(false);
        return;
      }
      if (!down) return;
      if (S.hover || S.pinned) return;
      if (S.autoCollapsed) return; // willFold (the name rides closed here)
      if (scroller.scrollTop < S.dead) return;
      // THE ROAD CHOICE — pre-paint, measured, never guessed:
      const dEst = Math.max(0, tray.offsetHeight - (S.hem || 26));
      if (dEst < 4) return;
      const fromTop = (S.journeyStart == null ? prev : S.journeyStart) <= 32;
      if (!fromTop && scroller.scrollTop < dEst) return; // the between-band
      if (scroller.scrollTop >= dEst) {
        launchPayer();     // the seat charges up as the header thins
        S.flowFolded = false;
      } else {
        S.flowFolded = true; // the flow shortens with the flight
        S.flowOrigin = scroller.scrollTop;
      }
      setAutoCollapsed(true);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    S.lastScroll = scroller.scrollTop; // 1.4.5 — the seed at attach

    window.__roSeries = [];
    window.__roClear = () => { window.__roSeries = []; };
    // ── the sampler: every frame, the whole story ──
    window.__sample = (ms) => new Promise((resolve) => {
      const series = [];
      const t0 = performance.now();
      const tick = () => {
        series.push({
          t: Math.round(performance.now() - t0),
          st: scroller.scrollTop,
          sh: scroller.scrollHeight,
          stripV: strip.getBoundingClientRect().top,
          bodyH: body.offsetHeight,
          seatH: seat.offsetHeight,
          headH: document.getElementById('head').offsetHeight,
        });
        if (performance.now() - t0 < ms) requestAnimationFrame(tick);
        else resolve(series);
      };
      requestAnimationFrame(tick);
    });
    window.__state = () => ({
      autoCollapsed: S.autoCollapsed, debt: S.debt, hem: S.hem,
      flowFolded: S.flowFolded, flowOrigin: S.flowOrigin,
      offsetWrites: S.offsetWrites - S.testWrites,
      bodyH: body.offsetHeight, seatH: seat.offsetHeight,
      trayFolded: tray.classList.contains('gd-rows-folded'),
      stripV: strip.getBoundingClientRect().top,
      stripFlow: strip.getBoundingClientRect().top + scroller.scrollTop,
      sh: scroller.scrollHeight,
    });
    window.__reset = async () => {
      if (S.payer.ro) { S.payer.ro.disconnect(); S.payer.ro = null; clearTimeout(S.payer.retireT); }
      setAutoCollapsed(false);
      seat.style.height = '0px'; S.debt = 0; S.flowFolded = false;
      S.dead = 0; S.journeyStart = null; wasDown = false;
      await new Promise((r) => setTimeout(r, 320));
      body.style.height = BODY_NATURAL + 'px';
      tray.classList.remove('gd-rows-folded');
      S.autoCollapsed = false;
    };
  </script>
</body></html>`;

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const st = () => page.evaluate(() => window.__state());

  // ── A · THE SEAT-ROAD FOLD (scrolled past the hem): the payer's flight ──
  await page.evaluate(() => window.__testScroll(600));
  await settle(80);
  const a0 = await st();
  const aSeriesP = page.evaluate(() => window.__sample(420));
  await page.evaluate(() => window.__testScroll(620)); // the down-tick
  const aSeries = await aSeriesP;
  const a1 = await st();
  const aRO = await page.evaluate(() => window.__roSeries);
  const stripStill = aRO.length
    ? Math.max(...aRO.map((s) => Math.abs(s.stripFlow - aRO[0].stripFlow)))
    : 999;
  const shStill = aRO.length ? Math.max(...aRO.map((s) => Math.abs(s.sh - aRO[0].sh))) : 999;
  const midBody = aSeries.filter((s) => s.bodyH > 5 && s.bodyH < 295).length;
  check(
    'A1 · the seat-road fold holds the strip stone-still through the whole flight',
    stripStill <= 1.5 && a1.autoCollapsed === true,
    `strip moved ${stripStill.toFixed(1)}px across ${aSeries.length} frames`
  );
  check(
    'A2 · the flow never changes length through the seat-road fold',
    shStill <= 1.5,
    `scrollHeight moved ${shStill.toFixed(1)}px`
  );
  check(
    'A3 · the tray TWEENS closed (the 0.39.0 breath — no one-frame snap)',
    midBody >= 3 && a1.bodyH === 0,
    `${midBody} intermediate frames of the body's flight`
  );
  check(
    'A4 · the listener never writes the scroll offset (the 1.8.4 crown kept)',
    a1.offsetWrites === 0,
    `offset writes by the app: ${a1.offsetWrites}`
  );
  check(
    'A5 · the seat holds exactly what the header lost (the debt discovered live)',
    a1.seatH > 250 && a1.seatH < 360,
    `the seat ended at ${a1.seatH.toFixed(1)}px`
  );

  // ── C · THE SEAT-ROAD RESTORE (scroll up past the debt) ──
  await page.evaluate(() => window.__roClear());
  const cSeriesP = page.evaluate(() => window.__sample(420));
  await page.evaluate(() => window.__testScroll(100)); // up past the debt
  const cSeries = await cSeriesP;
  const c1 = await st();
  const cRO = await page.evaluate(() => window.__roSeries);
  const cStrip = cRO.length
    ? Math.max(...cRO.map((s) => Math.abs(s.stripFlow - cRO[0].stripFlow)))
    : 999;
  const cSH = cRO.length ? Math.max(...cRO.map((s) => Math.abs(s.sh - cRO[0].sh))) : 999;
  const cMid = cSeries.filter((s) => s.bodyH > 5 && s.bodyH < 295).length;
  check(
    'C1 · the seat-road restore re-extends the cover with the content never moving',
    cStrip <= 1.5 && c1.autoCollapsed === false && c1.seatH === 0,
    `strip moved ${cStrip.toFixed(1)}px, the seat ended ${c1.seatH}px`
  );
  check(
    'C2 · the flow never changes length through the restore either',
    cSH <= 1.5,
    `scrollHeight moved ${cSH.toFixed(1)}px`
  );
  check(
    'C3 · THE EXPAND ANIMATION PLAYS on the restore road (the report own ask)',
    cMid >= 3 && c1.bodyH === 300,
    `${cMid} intermediate frames of the body's return`
  );

  // ── G · THE FLAP GUARDS ──
  // after the restore at 100, a down-tick inside the 48px dead zone:
  await page.evaluate(() => window.__testScroll(120));
  await settle(120);
  const g1 = await st();
  check(
    'G1 · a down-tick inside the dead zone folds nothing (no flap at the restore edge)',
    g1.autoCollapsed === false && g1.bodyH === 300,
    `folded=${g1.autoCollapsed}, body=${g1.bodyH}`
  );
  // the between-band: a journey begun mid-page, short of the hem:
  await page.evaluate(() => window.__testScroll(200));
  await settle(80);
  await page.evaluate(() => window.__testScroll(240)); // journeyStart=200 > 32, S=240 < hem
  await settle(160);
  const g2 = await st();
  check(
    'G2 · the between-band stands down (mid-page, short of the hem — the 1.8.4 ground)',
    g2.autoCollapsed === false && g2.bodyH === 300,
    `folded=${g2.autoCollapsed}`
  );

  // ── B · THE FLOW-ROAD FOLD (from the top — the report's own case) ──
  await page.evaluate(() => window.__reset());
  await page.evaluate(() => window.__testScroll(0));
  await settle(80);
  const b0 = await st();
  const bSeriesP = page.evaluate(() => window.__sample(420));
  await page.evaluate(() => window.__testScroll(12)); // the first down motion
  const bSeries = await bSeriesP;
  const b1 = await st();
  const bMonotonic = bSeries.every((s, i) => i === 0 || s.sh <= bSeries[i - 1].sh + 0.5);
  const bDrop = b0.sh - b1.sh;
  const bStripFlowDrop = b0.stripFlow - b1.stripFlow;
  const bMid = bSeries.filter((s) => s.bodyH > 5 && s.bodyH < 295).length;
  check(
    'B1 · the flow-road fold COMMITS from the top (the report: "it doesnt collapse")',
    b1.autoCollapsed === true && b1.bodyH === 0,
    `folded=${b1.autoCollapsed}, body=${b1.bodyH}`
  );
  check(
    'B2 · the page shortens smoothly — monotonic, never a snap-back ("not buggy like before")',
    bMonotonic && bDrop > 250,
    `the flow gave ${bDrop.toFixed(1)}px, monotonic=${bMonotonic}`
  );
  check(
    'B3 · the content rises into the tray vacated space ("it effects the scroll")',
    Math.abs(bStripFlowDrop - bDrop) < 2 && b1.seatH === 0,
    `the strip rose ${bStripFlowDrop.toFixed(1)}px of the ${bDrop.toFixed(1)}px given`
  );
  check(
    'B4 · the tray TWEENS closed on this road too',
    bMid >= 3,
    `${bMid} intermediate frames`
  );

  // ── D · THE FLOW-ROAD RESTORE (scroll back up to the origin) ──
  const dSeriesP = page.evaluate(() => window.__sample(420));
  await page.evaluate(() => window.__testScroll(2)); // up past origin+8
  const dSeries = await dSeriesP;
  const d1 = await st();
  const dMid = dSeries.filter((s) => s.bodyH > 5 && s.bodyH < 295).length;
  check(
    'D1 · scrolling back up to the fold origin re-opens the tray (the flow restore)',
    d1.autoCollapsed === false && d1.bodyH === 300 && dMid >= 3,
    `folded=${d1.autoCollapsed}, ${dMid} intermediate frames`
  );
  check(
    'D2 · the page grows back whole ("it effects the scroll when opening")',
    Math.abs(d1.sh - b0.sh) < 3,
    `scrollHeight ${b0.sh} -> ${b1.sh} -> ${d1.sh}`
  );

  // ── E · THE EXPAND CHIP (the dismissal road — the payer at D0 > 0) ──
  await page.evaluate(() => window.__testScroll(600));
  await settle(80);
  await page.evaluate(() => window.__testScroll(620)); // the seat-road fold again
  await settle(420);
  const e0 = await st();
  await page.evaluate(() => window.__roClear());
  const eSeriesP = page.evaluate(() => window.__sample(420));
  // the chip road: dismissSeatDebt + setAutoCollapsed(false)
  await page.evaluate(() => { window.__launchPayer(); window.__setAutoCollapsed(false); });
  const eSeries = await eSeriesP;
  const e1 = await st();
  const eRO = await page.evaluate(() => window.__roSeries);
  const eStrip = eRO.length
    ? Math.max(...eRO.map((s) => Math.abs(s.stripFlow - eRO[0].stripFlow)))
    : 999;
  const eMid = eSeries.filter((s) => s.bodyH > 5 && s.bodyH < 295).length;
  check(
    'E1 · the EXPAND chip tweens the tray open (the report: the expand animation isnt playing anymore)',
    eMid >= 3 && e1.bodyH === 300 && e1.autoCollapsed === false,
    `${eMid} intermediate frames of the chip flight`
  );
  check(
    'E2 · through the chip expansion nothing below the header moves a pixel',
    eStrip <= 1.5 && e1.seatH === 0 && e0.seatH > 250,
    `strip moved ${eStrip.toFixed(1)}px, the seat ${e0.seatH.toFixed(0)} -> ${e1.seatH}`
  );

  // ── F · THE MANUAL COLLAPSE (the chip's plain flip — the 1.1.2 law kept;
  // run from a CLEAN open state — a payer still mid-flight from a prior road
  // would keep mirroring (its own coherent law), which is not this arm) ──
  await page.evaluate(() => window.__reset());
  await settle(120);
  const fSeriesP = page.evaluate(() => window.__sample(420));
  await page.evaluate(() => window.__setAutoCollapsed(true));
  const fSeries = await fSeriesP;
  const f1 = await st();
  const fMid = fSeries.filter((s) => s.bodyH > 5 && s.bodyH < 295).length;
  check(
    'F1 · the manual collapse keeps its own tween (the watched move)',
    fMid >= 3 && f1.bodyH === 0 && f1.seatH === 0,
    `${fMid} intermediate frames, seat=${f1.seatH}`
  );

  // ── H · THE DRAG (the 1.8.4 report's own edge, held by the payer) ──
  await page.evaluate(() => window.__reset());
  await page.evaluate(() => window.__testScroll(600));
  await settle(80);
  await page.evaluate(() => window.__roClear());
  const hSeriesP = page.evaluate(() => window.__sample(700));
  // a drag's own steps: 600 -> 620 (the fold commits mid-drag) -> 660 -> 700
  await page.evaluate(() => window.__testScroll(620));
  await settle(200);
  await page.evaluate(() => window.__testScroll(660));
  await settle(150);
  await page.evaluate(() => window.__testScroll(700));
  const hSeries = await hSeriesP;
  const h1 = await st();
  const hRO = await page.evaluate(() => window.__roSeries);
  const hStrip = hRO.length
    ? Math.max(...hRO.map((s) => Math.abs(s.stripFlow - hRO[0].stripFlow)))
    : 999;
  check(
    'H1 · a drag through the fold keeps the content stone-still and never fights the offset',
    hStrip <= 1.5 && h1.offsetWrites === 0 && h1.autoCollapsed === true,
    `strip moved ${hStrip.toFixed(1)}px through the drag, app offset writes=${h1.offsetWrites}`
  );

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks green`);
  process.exit(failed ? 1 : 0);
};

run().catch((e) => {
  console.error('PROBE ERROR', e);
  process.exit(1);
});
