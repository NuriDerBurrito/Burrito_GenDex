#!/usr/bin/env node
// 1.8.3 BREATH-PROBE (Playwright/Chromium) — settles the fold's law on a
// real engine before the version ships:
//   A. Does the SAME-BREATH fold (the listener painting the whole fold on
//      the DOM — the tray's classes, the body's height, the name's
//      retract — then paying the give-back from the MEASURED scrollHeight
//      delta, all in one task) hold the wells' content stone-still under
//      the cursor, with the sticky preview column re-seating in the same
//      stroke?
//   B. Does the OLD order (the scrollTop write at listener time, the
//      height a breath later at commit time) visibly SNAP the content
//      downwards mid-flight — the reported disease — and rest off by the
//      tray's own unpaid 13px?
//   C. The edges: at the very top the fold simply shortens the page (no
//      give-back owed); at the bottom the give IS the clamp (the offset
//      lands at the new max exactly, nothing snaps back).
// The probe replicates the app's own geometry: the panel scroller with
// overflow-anchor none (the 1.4.0 law), the sticky header, the tray +
// chipline + is-snap laws verbatim from index.css, the sticky preview
// column seated at headH + 10.
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 0; background: #ffffff; font: 12px/1.4 sans-serif; }
  #scroller {
    height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    overflow-anchor: none; /* the 1.4.0 law — no native anchoring fights the give-back */
    position: relative;
  }
  #head {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #e8e8e8;
    padding-top: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #999999;
  }
  #name { height: 40px; background: #d8d8d8; margin: 0 10px; }
  /* the tray + chipline + is-snap laws, verbatim from index.css */
  .gd-rows-tray {
    background: #e2e2e2;
    border: 1px solid #bbbbbb;
    border-radius: 12px;
    padding: 7px 9px;
    margin-top: 10px;
    margin-left: 10px;
    margin-right: 10px;
  }
  .gd-rows-tray.gd-rows-folded { padding-top: 5px; padding-bottom: 5px; transition: padding-top 0.24s ease, padding-bottom 0.24s ease; }
  .gd-rows-chipline {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    margin-top: 3px;
    min-height: 20px;
    transition: min-height 0.24s ease, margin-top 0.24s ease;
  }
  .gd-rows-tray.gd-rows-folded .gd-rows-chipline { min-height: 14px; margin-top: 0; }
  .gd-rows-tray.is-snap,
  .gd-rows-tray.is-snap .gd-rows-chipline,
  .gd-rows-tray.is-snap .gd-rows-chipline::before { transition: none !important; }
  .gd-rows-body { overflow: hidden; background: #d0d0d0; }
  .gd-rows-expand { position: relative; display: inline-flex; height: 20px; padding: 0 8px; background: #cccccc; }
  #strip { height: 30px; margin: 8px 10px; background: #dedede; }
  #cvbody { display: flex; align-items: flex-start; }
  #cardcol { position: sticky; width: 180px; height: 260px; background: #c4c4c4; z-index: 10; }
  #details { flex: 1; min-width: 0; padding: 10px; }
  .row { height: 60px; background: #d6d6d6; margin-bottom: 8px; border: 1px solid #aaaaaa; }
</style></head><body>
  <div id="scroller">
    <div id="head">
      <div id="name">THE NAME</div>
      <div id="tray" class="gd-rows-tray">
        <div id="rowsBody" class="gd-rows-body" style="height: 150px;">tags row + stamps row</div>
        <div class="gd-rows-chipline"><button class="gd-rows-expand">COLLAPSE ⇄ TAGS &amp; STAMPS</button></div>
      </div>
    </div>
    <div id="strip">version strip</div>
    <div id="cvbody">
      <div id="cardcol">preview column</div>
      <div id="details">
        <div class="row" style="height: 400px; margin-bottom: 0;">prompts filler (the wells' head)</div>
        <div class="row" id="anchor">THE ANCHOR — a prompt row the eye is reading</div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
      </div>
    </div>
  </div>
<script>
  window.sameBreathFold = (scroller, tray, rowsBody, col, head) => {
    // the 1.8.3 law, verbatim in shape: the seat is read BEFORE the fold
    // paints (Chromium's eager clamp would else be paid twice at the
    // bottom), then the fold lands, then the give-back pays from the
    // MEASURED scrollHeight delta — all in one task
    const seatBefore = scroller.scrollTop;
    const before = scroller.scrollHeight;
    tray.classList.add('gd-rows-folded', 'is-snap');
    rowsBody.style.height = '0px';
    rowsBody.style.opacity = '0';
    const left = before - scroller.scrollHeight;
    if (left > 0) {
      const give = Math.min(left, Math.max(0, seatBefore));
      if (give > 0) scroller.scrollTop = Math.max(0, seatBefore - give);
    }
    if (col && head) {
      const liveHead = Math.round(head.offsetHeight);
      col.style.top = (liveHead + 10) + 'px';
    }
    return left;
  };
  window.oldOrderFold = (scroller, tray, rowsBody) => {
    // the 1.8.2 order: the give-back at LISTENER time (the body's own rect
    // guess), the height a breath later at COMMIT time
    const give = Math.min(rowsBody.getBoundingClientRect().height, Math.max(0, scroller.scrollTop));
    if (give > 0) scroller.scrollTop = Math.max(0, scroller.scrollTop - give);
    return give;
  };
  window.oldOrderLand = (tray, rowsBody) => {
    tray.classList.add('gd-rows-folded', 'is-snap');
    rowsBody.style.height = '0px';
    rowsBody.style.opacity = '0';
  };
  window.unfold = (tray, rowsBody) => {
    tray.classList.remove('gd-rows-folded', 'is-snap');
    rowsBody.style.height = '150px';
    rowsBody.style.opacity = '1';
  };
</script>
</body></html>`;

const raf = async (n) => {
  for (let i = 0; i < n; i += 1) {
    await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(null))));
  }
};

let passed = 0;
let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ok — ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL — ${name}${detail ? ` (${detail})` : ''}`);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
await page.setContent(html);
const sc = page.locator('#scroller');
const tray = page.locator('#tray');
const body = page.locator('#rowsBody');
const col = page.locator('#cardcol');
const head = page.locator('#head');
const anchor = page.locator('#anchor');

// seat the column the way the app does (headH + 10 from the live header)
await page.evaluate(() => {
  const head = document.getElementById('head');
  document.getElementById('cardcol').style.top = head.offsetHeight + 10 + 'px';
});

console.log('\nA. THE SAME-BREATH FOLD (one task, one paint, one fold)');
let delta = 0;
let a1Before = 0;
let a1After = 0;
{
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 400;
  });
  a1Before = await anchor.boundingBox();
  const bodyH = await body.evaluate((el) => el.getBoundingClientRect().height);
  delta = await page.evaluate(() =>
    window.sameBreathFold(
      document.getElementById('scroller'),
      document.getElementById('tray'),
      document.getElementById('rowsBody'),
      document.getElementById('cardcol'),
      document.getElementById('head')
    )
  );
  await raf(3);
  a1After = await anchor.boundingBox();
  ok('A1 — the wells hold stone-still through the fold (≤ 1px)', Math.abs(a1After.y - a1Before.y) <= 1, `Δ=${(a1After.y - a1Before.y).toFixed(2)}`);
  ok(
    'A2 — the measured delta covers the WHOLE tray (the padding rides with the body)',
    delta >= bodyH + 4,
    `delta=${delta}, bodyH=${bodyH}`
  );
  const topAfter = await col.boundingBox();
  const liveHead = await head.evaluate((el) => el.offsetHeight);
  ok(
    'A3 — the sticky preview column re-seats in the same stroke (top = headH + 10)',
    Math.abs(topAfter.y - (liveHead + 10)) <= 1,
    `colY=${topAfter.y.toFixed(2)}, headH+10=${liveHead + 10}`
  );
  const scrollPaid = await page.evaluate((d) => {
    const sc = document.getElementById('scroller');
    return { paid: 400 - sc.scrollTop, owed: d, now: sc.scrollTop };
  }, delta);
  ok('A4 — the give-back pays exactly what left (bounded by the seat)', scrollPaid.paid === scrollPaid.owed, `paid=${scrollPaid.paid}, owed=${scrollPaid.owed}`);
  const classes = await tray.evaluate((el) => el.classList.contains('gd-rows-folded') && el.classList.contains('is-snap'));
  const bodyH2 = await body.evaluate((el) => el.offsetHeight);
  ok('A5 — the fold landed on the nodes themselves (classes + height 0)', classes && bodyH2 === 0, `classes=${classes}, bodyH=${bodyH2}`);
  const dur = await tray.evaluate((el) => getComputedStyle(el).transitionDuration);
  ok('A6 — the is-snap law stills the tray (no tween under the wheel)', dur === '0s', `duration=${dur}`);
}

console.log('\nB. THE OLD ORDER SEES ITS OWN DISEASE (the contrast arm)');
{
  await page.evaluate(() => window.unfold(document.getElementById('tray'), document.getElementById('rowsBody')));
  await page.evaluate(() => {
    const head = document.getElementById('head');
    const col = document.getElementById('cardcol');
    col.style.top = head.offsetHeight + 10 + 'px';
    document.getElementById('scroller').scrollTop = 400;
  });
  const before = await anchor.boundingBox();
  const give = await page.evaluate(() =>
    window.oldOrderFold(document.getElementById('scroller'), document.getElementById('tray'), document.getElementById('rowsBody'))
  );
  // a breath passes — React's commit + framer's frameloop have not landed yet
  await raf(1);
  const mid = await anchor.boundingBox();
  ok(
    'B1 — the old order SNAPS the content DOWNWARDS mid-flight (the reported disease)',
    mid.y - before.y >= give * 0.5,
    `midΔ=${(mid.y - before.y).toFixed(2)}, give=${give}`
  );
  await page.evaluate(() => window.oldOrderLand(document.getElementById('tray'), document.getElementById('rowsBody')));
  await raf(3);
  const final = await anchor.boundingBox();
  ok(
    'B2 — the old order rests off by the tray\'s own unpaid shrink (the 1.8.2 guess under-paid)',
    Math.abs(final.y - before.y) >= 3,
    `restΔ=${(final.y - before.y).toFixed(2)}`
  );
}

console.log('\nC. THE EDGES (the give-back\'s own bounds)');
{
  await page.evaluate(() => window.unfold(document.getElementById('tray'), document.getElementById('rowsBody')));
  await page.evaluate(() => {
    const head = document.getElementById('head');
    document.getElementById('cardcol').style.top = head.offsetHeight + 10 + 'px';
  });
  // C1 — the very top: nothing is owed, the fold simply shortens the page
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 0;
  });
  const topBefore = await anchor.boundingBox();
  await page.evaluate(() =>
    window.sameBreathFold(
      document.getElementById('scroller'),
      document.getElementById('tray'),
      document.getElementById('rowsBody'),
      document.getElementById('cardcol'),
      document.getElementById('head')
    )
  );
  await raf(2);
  const topAfter = await anchor.boundingBox();
  ok(
    'C1 — at the very top nothing is owed (the page simply shortens — the anchor rises by the fold)',
    topBefore.y - topAfter.y >= 150,
    `rise=${(topBefore.y - topAfter.y).toFixed(2)}`
  );
}
{
  await page.evaluate(() => window.unfold(document.getElementById('tray'), document.getElementById('rowsBody')));
  await page.evaluate(() => {
    const head = document.getElementById('head');
    document.getElementById('cardcol').style.top = head.offsetHeight + 10 + 'px';
    const sc = document.getElementById('scroller');
    sc.scrollTop = sc.scrollHeight; // the very bottom
  });
  const botBefore = await anchor.boundingBox();
  const d2 = await page.evaluate(() =>
    window.sameBreathFold(
      document.getElementById('scroller'),
      document.getElementById('tray'),
      document.getElementById('rowsBody'),
      document.getElementById('cardcol'),
      document.getElementById('head')
    )
  );
  await raf(2);
  const clamp = await page.evaluate(() => {
    const sc = document.getElementById('scroller');
    return { top: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight };
  });
  const botAfter = await anchor.boundingBox();
  ok(
    'C2 — at the bottom the give IS the clamp (the offset lands at the new max, exactly)',
    Math.abs(clamp.top - clamp.max) <= 0.5,
    `top=${clamp.top}, max=${clamp.max}, delta=${d2}`
  );
  ok(
    'C3 — and nothing ever snaps back (the anchor holds its seat at the bottom too)',
    Math.abs(botAfter.y - botBefore.y) <= 1,
    `Δ=${(botAfter.y - botBefore.y).toFixed(2)}`
  );
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
