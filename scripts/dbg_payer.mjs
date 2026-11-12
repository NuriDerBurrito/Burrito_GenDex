import { chromium } from 'playwright';
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const html = `<!doctype html><html><head><style>
  body { margin: 0; font: 12px/1.4 sans-serif; }
  .scroller { height: 600px; overflow-y: auto; overflow-x: hidden; overflow-anchor: none; position: relative; background: #0f0f0f; }
  .head { position: sticky; top: 0; z-index: 20; background: #191919; border-bottom: 1.5px solid #3d3d3d; padding: 16px 0 12px; }
  .controls { height: 40px; background: #232323; }
  .name-fold { height: 70px; overflow: hidden; margin-top: 6px; background: #1d1d1d; }
  .tray { margin-top: 10px; border: 1px solid #2e2e2e; padding: 7px 9px; background: #161616; transition: padding-top 0.24s ease, padding-bottom 0.24s ease; }
  .tray.gd-rows-folded { padding-top: 5px; padding-bottom: 5px; }
  .body { overflow: hidden; height: 300px; background: #1a1a1a; }
  .chipline { display: flex; justify-content: center; align-items: center; min-height: 20px; margin-top: 3px; transition: min-height 0.24s ease, margin-top 0.24s ease; }
  .tray.gd-rows-folded .chipline { min-height: 14px; margin-top: 0; }
  .seat { height: 0; }
  .strip { height: 30px; background: #202020; }
  .wells { height: 1400px; background: #141414; }
</style></head><body>
  <div class="scroller" id="scroller">
    <div class="head" id="head">
      <div class="controls">controls</div>
      <div class="name-fold" id="nameFold">the name</div>
      <div class="tray" id="tray">
        <div class="body" id="body">rows</div>
        <div class="chipline" id="chipline">chip</div>
      </div>
    </div>
    <div class="seat" id="seat"></div>
    <div class="strip" id="strip">strip</div>
    <div class="wells">wells</div>
  </div>
  <script>
    const scroller = document.getElementById('scroller');
    const tray = document.getElementById('tray');
    const body = document.getElementById('body');
    const seat = document.getElementById('seat');
    const nameFold = document.getElementById('nameFold');
    const strip = document.getElementById('strip');
    const S = { autoCollapsed: false, debt: 0, payer: { ro: null, retireT: 0, d0: 0, h0: 0 } };
    let tweenRaf = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function startTween() {
      cancelAnimationFrame(tweenRaf);
      const from = body.offsetHeight; const to = S.autoCollapsed ? 0 : 300; const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / 240);
        body.style.height = (from + (to - from) * ease(t)).toFixed(2) + 'px';
        if (t < 1) tweenRaf = requestAnimationFrame(step); else tweenRaf = 0;
      };
      tweenRaf = requestAnimationFrame(step);
    }
    function setAutoCollapsed(v) {
      if (S.autoCollapsed === v) return;
      S.autoCollapsed = v;
      tray.classList.toggle('gd-rows-folded', v);
      startTween();
    }
    function launchPayer() {
      if (S.payer.ro) { S.payer.ro.disconnect(); clearTimeout(S.payer.retireT); }
      S.payer.d0 = seat.offsetHeight;
      S.payer.h0 = tray.offsetHeight + nameFold.offsetHeight;
      const apply = () => {
        const h = tray.offsetHeight + nameFold.offsetHeight;
        const next = Math.max(0, S.payer.d0 - (h - S.payer.h0));
        seat.style.height = next.toFixed(2) + 'px';
        S.debt = next;
        window.__log && window.__log.push(['apply', performance.now().toFixed(0), h.toFixed(1), next.toFixed(1)]);
      };
      apply();
      const ro = new ResizeObserver(() => {
        apply();
        window.__roStrip && window.__roStrip.push([performance.now().toFixed(0), strip.getBoundingClientRect().top, tray.offsetHeight, seat.offsetHeight]);
        clearTimeout(S.payer.retireT);
        S.payer.retireT = setTimeout(() => { ro.disconnect(); S.payer.ro = null; }, 420);
      });
      ro.observe(tray); ro.observe(nameFold);
      S.payer.ro = ro;
    }
    let wasDown = false; S.lastScroll = scroller.scrollTop; S.journeyStart = null;
    function onScroll() {
      const prev = S.lastScroll; S.lastScroll = scroller.scrollTop;
      const down = scroller.scrollTop - (prev == null ? scroller.scrollTop : prev) > 2;
      if (down && !wasDown) S.journeyStart = prev;
      wasDown = down;
      if (prev == null) return;
      if (!down) return;
      if (S.autoCollapsed) return;
      const dEst = Math.max(0, tray.offsetHeight - 26);
      if (dEst < 4) return;
      const fromTop = (S.journeyStart == null ? prev : S.journeyStart) <= 32;
      if (!fromTop && scroller.scrollTop < dEst) return;
      if (scroller.scrollTop >= dEst) { launchPayer(); }
      setAutoCollapsed(true);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.__log = []; window.__roStrip = [];
    window.__sample = (ms) => new Promise((resolve) => {
      const series = []; const t0 = performance.now();
      const tick = () => {
        series.push({ t: Math.round(performance.now() - t0), st: scroller.scrollTop, sh: scroller.scrollHeight,
          stripV: strip.getBoundingClientRect().top, bodyH: body.offsetHeight, seatH: seat.offsetHeight });
        if (performance.now() - t0 < ms) requestAnimationFrame(tick); else resolve(series);
      };
      requestAnimationFrame(tick);
    });
    window.__set = (v) => { scroller.scrollTop = v; };
  </script>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.evaluate(() => window.__set(600));
await settle(80);
const seriesP = page.evaluate(() => window.__sample(420));
await page.evaluate(() => window.__set(620));
const series = await seriesP;
console.log('== rAF-sampler series ==');
const roS = await page.evaluate(() => window.__roStrip); console.log('== RO post-sync series (what paint sees): t, stripV, trayH, seatH =='); roS.forEach((r) => console.log(r.join('	')));
await browser.close();
