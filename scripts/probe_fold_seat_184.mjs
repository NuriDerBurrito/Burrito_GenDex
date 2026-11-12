#!/usr/bin/env node
// 1.8.4 SEAT-PROBE (Playwright/Chromium) — settles the cover's law on a
// real engine before the version ships:
//   A. Does the SEAT fold (the debt paid into a borrowed flow seat below
//      the sticky header, never out of the scroll offset) keep the
//      scroller's content length EXACTLY the same through the fold, hold
//      the wells' content stone-still under the cursor, never write the
//      scroll offset, and keep the scrollbar's thumb on its own map?
//   B. Does the SCROLLBAR DRAG (the report's own disease — "it snaps to
//      the top then back down") stay clean under the seat law, while the
//      old give-back order (the scrollTop write mid-drag) visibly snaps
//      the view toward the top and throws it back down?
//   C. The hem guard (an attempt before the content has scrolled past the
//      plate's hem reverts in the same task — nothing lands), the restore
//      (the cover re-extends when the scroll rises back above the loan),
//      and the bottom edge (no clamp ever fires — the page never changed
//      size).
// The probe replicates the app's own geometry and the listener's own
// gates verbatim: the panel scroller with overflow-anchor none (the 1.4.0
// law), the seed-at-attach (1.4.5), the down-only gate, the hover/pin
// holds (elided — a drag over the sideways scrollers never fires this
// vertical listener), the WILL-FOLD auto gate (1.4.7's autoCollapsed —
// once the fold lands no re-attempt fires), the cheap hem, the sticky
// header, the tray + chipline + is-snap laws from index.css, the
// zero-height seat below the header, the name's retract riding into the
// debt, and the preview column's RO reading the header PLUS the debt.
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 0; background: #ffffff; font: 12px/1.4 sans-serif; }
  #scroller {
    height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    overflow-anchor: none; /* the 1.4.0 law — no native anchoring fights the seat */
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
  #name { height: 40px; background: #d8d8d8; margin: 0 10px; overflow: hidden; }
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
  /* the chip's own stature is deterministic (the app's chip rides an
     explicit height) so every vertical value in the probe's geometry is
     an integer — a fractional default button would round differently
     across the attempt/revert cycle and leak sub-pixels into the flow */
  .gd-rows-expand { height: 14px; line-height: 14px; padding: 0 8px; font: inherit; box-sizing: content-box; }
  /* the rows body rides the stylesheet's own height (the way the app's
     body rides its content at rest) so the revert's height = '' restores
     the seat it was born on */
  .gd-rows-body { overflow: hidden; background: #d0d0d0; }
  #rowsBody { height: 150px; }
  /* 1.8.4 — THE SEAT THE COVER BORROWS: a zero-height flow spacer directly
     below the sticky header; while a scroll-fold holds the tray shut it
     carries exactly the height the fold removed (the debt) */
  #seat { height: 0; }
  #strip { height: 30px; margin: 8px 10px; background: #dedede; }
  #cvbody { display: flex; align-items: flex-start; }
  #cardcol { position: sticky; width: 180px; height: 260px; background: #c4c4c4; z-index: 10; }
  #details { flex: 1; min-width: 0; padding: 10px; }
  .row { height: 60px; background: #d6d6d6; margin-bottom: 8px; border: 1px solid #aaaaaa; }
</style></head><body>
  <div id="scroller">
    <div id="head">
      <div id="name">THE NAME (expanded)</div>
      <div id="tray" class="gd-rows-tray">
        <div id="rowsBody" class="gd-rows-body">tags row + stamps row</div>
        <div class="gd-rows-chipline"><button class="gd-rows-expand">COLLAPSE ⇄ TAGS &amp; STAMPS</button></div>
      </div>
    </div>
    <div id="seat"></div>
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
  // the 1.8.4 seat law, verbatim in shape (the listener's own roads and
  // gates; the hover/pin holds elided — the app's own word: a drag over
  // the sideways scrollers never fires this vertical listener): the fold
  // paints itself on the DOM in one task, the guard reverts an attempt
  // below the hem, the debt is paid INTO THE SEAT, and the scroll offset
  // is never written — the restore re-extends the cover when the scroll
  // rises back above the loan
  window.mountSeatLaw = (scroller, tray, rowsBody, seat, nameFold) => {
    let seatDebt = 0;
    let foldHem = 0;
    let autoCollapsed = false;
    let lastScroll = scroller.scrollTop; // the 1.4.5 seed-at-attach
    scroller.addEventListener('scroll', () => {
      const prev = lastScroll;
      lastScroll = scroller.scrollTop;
      // THE COVER'S HEM — the restore rides FIRST and answers to no gate
      if (seatDebt > 0 && scroller.scrollTop < seatDebt) {
        seatDebt = 0;
        seat.style.height = '0px';
        rowsBody.style.height = '';
        rowsBody.style.opacity = '';
        nameFold.style.height = '';
        // 1.8.4 — THE RESTORE LANDS THE REST VALUES BEFORE THE SNAP LEAVES
        // (the freeze the probe itself caught): the folded class leaves
        // FIRST, with is-snap still seating transition: none; a forced
        // recalc lands every rest value with no flight at all; THEN
        // is-snap leaves onto values that no longer change — no
        // transition ever arms, no pixel of the flow ever leaks
        tray.classList.remove('gd-rows-folded');
        void tray.offsetHeight; // the forced recalc that lands the rest
        tray.classList.remove('is-snap');
        autoCollapsed = false;
        return;
      }
      const down = scroller.scrollTop - prev > 2;
      if (!down) return;
      // the WILL-FOLD gate: once the auto-fold has landed, no re-attempt
      const willFold = !(autoCollapsed === true);
      if (!willFold) return;
      // the cheap hem (the cached measure answers the early ticks)
      if (scroller.scrollTop < foldHem * 0.85) return;
      // the fold attempt
      const seatNow = scroller.scrollTop;
      const before = scroller.scrollHeight;
      const nameWasOpen = nameFold.style.height !== '20px';
      tray.classList.add('gd-rows-folded', 'is-snap');
      rowsBody.style.height = '0px';
      rowsBody.style.opacity = '0';
      if (nameWasOpen) nameFold.style.height = '20px'; // the measured two-line target
      const left = before - scroller.scrollHeight;
      const owed = seatDebt + Math.max(0, left);
      // the hem guard: revert the whole paint in this same task
      if (left <= 0 || seatNow < owed) {
        // 1.8.4 — THE REVERT LANDS THE REST VALUES BEFORE THE SNAP LEAVES
        // (the same freeze): the folded class leaves FIRST with is-snap
        // still seating transition: none; the forced recalc lands every
        // rest value with no flight at all; THEN is-snap leaves onto
        // values that no longer change — the attempt truly never was
        tray.classList.remove('gd-rows-folded');
        rowsBody.style.height = '';
        rowsBody.style.opacity = '';
        if (nameWasOpen) nameFold.style.height = '';
        void tray.offsetHeight; // the forced recalc that lands the rest
        tray.classList.remove('is-snap');
        foldHem = Math.max(foldHem, owed);
        // 1.8.4 — THE UN-CLAMP (the guard's own twin): the eager clamp may
        // have stolen the seat mid-attempt; the reverts returned the page's
        // length, and the stolen offset returns with it
        if (scroller.scrollTop < seatNow) scroller.scrollTop = seatNow;
        return;
      }
      foldHem = owed;
      seatDebt = owed;
      seat.style.height = owed + 'px';
      // 1.8.4 — THE UN-CLAMP (the bottom edge of the report): a fold that
      // lands within a debt of the bottom clamps the offset down the
      // moment the height leaves; the seat has returned the page's length
      // in this same task, and what the clamp took returns with it — back
      // to the PRE-paint seat the hand still owns (never a re-map, never
      // a pay — the drag's own offset, whole)
      if (scroller.scrollTop < seatNow) scroller.scrollTop = seatNow;
      autoCollapsed = true;
    });
    return { read: () => ({ debt: seatDebt, hem: foldHem, auto: autoCollapsed }) };
  };
  // the 1.8.2/1.8.3 give-back order (the contrast arm — the same gates,
  // the same one-task paint; ONLY the pay differs): the fold pays its
  // height debt OUT OF THE SCROLL OFFSET — the write mid-drag re-maps the
  // thumb and the view snaps toward the top, then the next drag step
  // throws it back down
  window.mountOldLaw = (scroller, tray, rowsBody, nameFold) => {
    let autoCollapsed = false;
    let lastScroll = scroller.scrollTop;
    scroller.addEventListener('scroll', () => {
      const prev = lastScroll;
      lastScroll = scroller.scrollTop;
      const down = scroller.scrollTop - prev > 2;
      if (!down) return;
      const willFold = !(autoCollapsed === true);
      if (!willFold) return;
      const seatBefore = scroller.scrollTop;
      const before = scroller.scrollHeight;
      tray.classList.add('gd-rows-folded', 'is-snap');
      rowsBody.style.height = '0px';
      rowsBody.style.opacity = '0';
      if (nameFold.style.height !== '20px') nameFold.style.height = '20px';
      const left = before - scroller.scrollHeight;
      if (left > 0) {
        const give = Math.min(left, Math.max(0, seatBefore));
        if (give > 0) scroller.scrollTop = Math.max(0, seatBefore - give);
      }
      autoCollapsed = true;
    });
  };
  window.unfold = (tray, rowsBody, nameFold, seat) => {
    // the manual road's own shape (the two-step restore): the folded class
    // leaves first, the forced recalc lands the rest, is-snap leaves last
    tray.classList.remove('gd-rows-folded');
    rowsBody.style.height = '';
    rowsBody.style.opacity = '';
    nameFold.style.height = '';
    seat.style.height = '0px';
    void tray.offsetHeight;
    tray.classList.remove('is-snap');
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
const seat = page.locator('#seat');
const nameEl = page.locator('#name');
const col = page.locator('#cardcol');
const head = page.locator('#head');
const anchor = page.locator('#anchor');

// the RO law: the column's pinned seat tracks the header's RENDERED height
// PLUS whatever the seat holds (the debt rides the measure)
await page.evaluate(() => {
  const head = document.getElementById('head');
  const seat = document.getElementById('seat');
  const col = document.getElementById('cardcol');
  const place = () => {
    col.style.top = Math.round(head.offsetHeight + seat.offsetHeight) + 10 + 'px';
  };
  place();
  new ResizeObserver(place).observe(head);
  new ResizeObserver(place).observe(seat);
});

console.log('\nA. THE SEAT FOLD (one task, one paint, one cover)');
let a1 = {};
{
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 400;
  });
  await raf(1);
  await page.evaluate(() => {
    window.__law = window.mountSeatLaw(
      document.getElementById('scroller'),
      document.getElementById('tray'),
      document.getElementById('rowsBody'),
      document.getElementById('seat'),
      document.getElementById('name')
    );
  });
  const beforeH = await sc.evaluate((el) => el.scrollHeight);
  const beforeMax = await sc.evaluate((el) => el.scrollHeight - el.clientHeight);
  const beforeAnchor = await anchor.boundingBox();
  const beforeCol = await col.boundingBox();
  // the fold: one jump down past the hem fires the listener once
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 420;
  });
  await raf(3);
  a1 = await page.evaluate(() => window.__law.read());
  const afterH = await sc.evaluate((el) => el.scrollHeight);
  const afterMax = await sc.evaluate((el) => el.scrollHeight - el.clientHeight);
  const afterTop = await sc.evaluate((el) => el.scrollTop);
  const afterAnchor = await anchor.boundingBox();
  const afterCol = await col.boundingBox();
  ok(
    'A1 — the scroller\'s content length NEVER changes through the fold (the seat holds the debt)',
    afterH === beforeH,
    `before=${beforeH}, after=${afterH}`
  );
  ok(
    'A2 — the wells hold stone-still (the content acts independently of the tray — the drag\'s own 20 is all that moves)',
    Math.abs(afterAnchor.y - beforeAnchor.y + 20) <= 1,
    `Δ=${(afterAnchor.y - beforeAnchor.y).toFixed(2)} (pure scroll would be exactly -20)`
  );
  ok(
    'A3 — the listener never writes the scroll offset (the drag is never fought)',
    afterTop === 420,
    `scrollTop=${afterTop}`
  );
  const classes = await tray.evaluate((el) => el.classList.contains('gd-rows-folded') && el.classList.contains('is-snap'));
  const bodyH = await body.evaluate((el) => el.offsetHeight);
  const seatH = await seat.evaluate((el) => el.offsetHeight);
  ok(
    'A4 — the fold landed on the nodes + the seat holds exactly the debt',
    classes && bodyH === 0 && Math.abs(seatH - a1.debt) <= 1,
    `classes=${classes}, bodyH=${bodyH}, seatH=${seatH}, debt=${a1.debt}`
  );
  ok(
    'A5 — the scrollbar\'s thumb keeps its own map (the page\'s scrollable length never moved)',
    afterMax === beforeMax,
    `max before=${beforeMax}, after=${afterMax}`
  );
  ok(
    'A6 — the preview column never learns the tray left (the RO lands on a number that never changed)',
    Math.abs(afterCol.y - beforeCol.y) <= 1,
    `Δ=${(afterCol.y - beforeCol.y).toFixed(2)}`
  );
  const dur = await tray.evaluate((el) => getComputedStyle(el).transitionDuration);
  ok('A7 — the is-snap law stills the tray (no tween under the wheel)', dur === '0s', `duration=${dur}`);
  const nameH = await nameEl.evaluate((el) => el.offsetHeight);
  ok(
    'A8 — the name the fold swallowed retracted (its height rode into the debt)',
    nameH === 20 && a1.debt >= 160,
    `nameH=${nameH}, debt=${a1.debt}`
  );
}

console.log('\nB. THE SCROLLBAR DRAG ("it snaps to the top then back down, fix that")');
const STEPS = [60, 120, 180, 240, 300, 360, 420];
{
  // the seat arm: a drag stepped down through the hem on a fresh page —
  // every observed offset must be exactly the step the hand set, and the
  // anchor must be the scroll's own shadow (content independent of the tray)
  const page1 = await browser.newPage({ viewport: { width: 900, height: 500 } });
  await page1.setContent(html);
  await page1.evaluate(() => {
    window.mountSeatLaw(
      document.getElementById('scroller'),
      document.getElementById('tray'),
      document.getElementById('rowsBody'),
      document.getElementById('seat'),
      document.getElementById('name')
    );
    document.getElementById('scroller').scrollTop = 0;
  });
  await page1.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(null))));
  const anchorY0 = await page1.locator('#anchor').boundingBox();
  const flowBase = anchorY0.y; // scrollTop 0 — the anchor's own flow seat
  const seen = [];
  for (const s of STEPS) {
    await page1.evaluate((v) => {
      document.getElementById('scroller').scrollTop = v;
    }, s);
    await page1.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(null))));
    const top = await page1.evaluate(() => document.getElementById('scroller').scrollTop);
    const y = await page1.locator('#anchor').boundingBox();
    seen.push({ set: s, top, y: y.y });
  }
  const neverWritten = seen.every((o) => o.top === o.set);
  ok(
    'B1 — the drag owns the offset whole (the fold never writes it — every observed offset is the hand\'s own step)',
    neverWritten,
    seen.map((o) => `${o.set}->${o.top}`).join(' ')
  );
  const shadow = seen.every((o) => Math.abs(o.y - (flowBase - o.top)) <= 1);
  ok(
    'B2 — the anchor is the scroll\'s own shadow (the content sits independently through the fold step)',
    shadow,
    seen.map((o) => `Δ${(o.y - (flowBase - o.top)).toFixed(1)}`).join(' ')
  );
  // the FAST drag — the report's literal face ("it snaps to the top then
  // back down"): one jump straight to the bottom folds within a debt of
  // the max, where the eager clamp would steal the seat; the un-clamp
  // gives it back in the same task
  {
    const page3 = await browser.newPage({ viewport: { width: 900, height: 500 } });
    await page3.setContent(html);
    await page3.evaluate(() => {
      window.mountSeatLaw(
        document.getElementById('scroller'),
        document.getElementById('tray'),
        document.getElementById('rowsBody'),
        document.getElementById('seat'),
        document.getElementById('name')
      );
    });
    const base3 = await page3.locator('#anchor').boundingBox();
    await page3.evaluate(() => {
      const scroller = document.getElementById('scroller');
      scroller.scrollTop = scroller.scrollHeight; // one fast drag straight to the bottom
    });
    await page3.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(null))));
    const fastTop = await page3.evaluate(() => document.getElementById('scroller').scrollTop);
    const fastMax = await page3.evaluate(() => {
      const sc = document.getElementById('scroller');
      return sc.scrollHeight - sc.clientHeight;
    });
    const fastAnchor = await page3.locator('#anchor').boundingBox();
    const fastFolded = await page3.evaluate(() => document.getElementById('tray').classList.contains('gd-rows-folded'));
    ok(
      'B3 — the fast drag keeps the hand\'s own seat at the bottom (the un-clamp gives back what the eager clamp took)',
      fastFolded && fastTop === fastMax,
      `top=${fastTop}, max=${fastMax}, folded=${fastFolded}`
    );
    ok(
      'B4 — and nothing snapped on the way there (the anchor sits exactly where the fast scroll put it)',
      Math.abs(fastAnchor.y - (base3.y - fastTop)) <= 1,
      `Δ=${(fastAnchor.y - (base3.y - fastTop)).toFixed(2)}`
    );
    await page3.close();
  }
  await page1.close();
}
{
  // the contrast arm: the old give-back order writes the offset mid-drag —
  // the view snaps toward the top, the next step throws it back down
  const page2 = await browser.newPage({ viewport: { width: 900, height: 500 } });
  await page2.setContent(html);
  await page2.evaluate(() => {
    window.mountOldLaw(
      document.getElementById('scroller'),
      document.getElementById('tray'),
      document.getElementById('rowsBody'),
      document.getElementById('name')
    );
  });
  const seenOld = [];
  let oldGive = 0;
  for (const s of STEPS) {
    await page2.evaluate((v) => {
      document.getElementById('scroller').scrollTop = v;
    }, s);
    await page2.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(null))));
    const top = await page2.evaluate(() => document.getElementById('scroller').scrollTop);
    if (top !== s) oldGive = Math.abs(s - top);
    seenOld.push({ set: s, top });
  }
  const dipped = seenOld.some((o) => o.top < o.set - 50);
  ok(
    'B5 — the old order SNAPS the view toward the top mid-drag (the offset written under the hand)',
    dipped,
    seenOld.map((o) => `${o.set}->${o.top}`).join(' ')
  );
  const jumpedBack = seenOld.some((o, i) => i > 0 && o.top - seenOld[i - 1].top > 50);
  ok(
    'B6 — and the next drag step throws it back down (the top-then-back the report names)',
    jumpedBack,
    `give=${oldGive}`
  );
  // the old order's fast-drag face: the fold at the bottom writes the
  // offset down by the whole give — the view lands a debt above the
  // bottom the hand jumped to
  {
    const page4 = await browser.newPage({ viewport: { width: 900, height: 500 } });
    await page4.setContent(html);
    await page4.evaluate(() => {
      window.mountOldLaw(
        document.getElementById('scroller'),
        document.getElementById('tray'),
        document.getElementById('rowsBody'),
        document.getElementById('name')
      );
    });
    const oldMaxBefore = await page4.evaluate(() => {
      const sc = document.getElementById('scroller');
      return sc.scrollHeight - sc.clientHeight;
    });
    await page4.evaluate(() => {
      const scroller = document.getElementById('scroller');
      scroller.scrollTop = scroller.scrollHeight;
    });
    await page4.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(null))));
    const oldFastTop = await page4.evaluate(() => document.getElementById('scroller').scrollTop);
    ok(
      'B7 — the old order leaves the fast drag a whole debt above the bottom (the literal snap the report retired)',
      oldFastTop < oldMaxBefore - 100,
      `top=${oldFastTop}, the bottom the hand jumped to=${oldMaxBefore}`
    );
    await page4.close();
  }
  await page2.close();
}

console.log('\nC. THE HEM GUARD, THE RESTORE, AND THE BOTTOM EDGE');
{
  // C1 — the hem guard: an attempt below the hem reverts in the same task
  // (nothing lands — no class, no height, the page never changed). The
  // probe first rides the restore (arm A left the fold standing at 420;
  // scrolling back above the loan re-extends the cover), then steps into
  // the hem window — past the cheap hem's cache, below the debt itself.
  await page.evaluate(() => window.unfold(
    document.getElementById('tray'),
    document.getElementById('rowsBody'),
    document.getElementById('name'),
    document.getElementById('seat')
  ));
  await raf(2);
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 100; // the restore (the loan returns)
  });
  await raf(2);
  const beforeH = await sc.evaluate((el) => el.scrollHeight);
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 170; // inside the hem window: the attempt + revert
  });
  await raf(2);
  const classes = await tray.evaluate((el) => el.classList.contains('gd-rows-folded') || el.classList.contains('is-snap'));
  const bodyH = await body.evaluate((el) => el.offsetHeight);
  const seatH = await seat.evaluate((el) => el.offsetHeight);
  const afterH = await sc.evaluate((el) => el.scrollHeight);
  const topNow = await sc.evaluate((el) => el.scrollTop);
  ok(
    'C1 — an attempt below the hem reverts whole (no class, no height, the page never changed)',
    !classes && bodyH === 150 && seatH === 0 && afterH === beforeH,
    `classes=${classes}, bodyH=${bodyH}, seatH=${seatH}, H ${beforeH}->${afterH}`
  );
  ok(
    'C1b — and the revert never touched the offset either (the attempt never existed)',
    topNow === 170,
    `scrollTop=${topNow}`
  );
}
{
  // C2 — the whole cycle: fold past the hem, scroll back above the loan —
  // the cover re-extends, and through the whole cycle the flow's total
  // never changes and the anchor never leaves its flow seat
  const startTop = await sc.evaluate((el) => el.scrollTop);
  const cycleAnchorY = await anchor.boundingBox();
  const cycleBeforeH = await sc.evaluate((el) => el.scrollHeight);
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 420; // past the hem — the fold lands
  });
  await raf(2);
  const foldedH = await sc.evaluate((el) => el.scrollHeight);
  const foldedClasses = await tray.evaluate((el) => el.classList.contains('gd-rows-folded'));
  ok(
    'C2a — the fold lands past the hem (and the flow\'s total is still the same number)',
    foldedClasses && foldedH === cycleBeforeH,
    `classes=${foldedClasses}, H ${cycleBeforeH}->${foldedH}`
  );
  await page.evaluate(() => {
    document.getElementById('scroller').scrollTop = 100; // back above the loan — the cover re-extends
  });
  await raf(2);
  const restoredClasses = await tray.evaluate((el) => !el.classList.contains('gd-rows-folded') && !el.classList.contains('is-snap'));
  const restoredBody = await body.evaluate((el) => el.offsetHeight);
  const restoredSeat = await seat.evaluate((el) => el.offsetHeight);
  const restoredH = await sc.evaluate((el) => el.scrollHeight);
  const restoredName = await nameEl.evaluate((el) => el.offsetHeight);
  ok(
    'C2b — the cover re-extends whole (the tray, the body, the name — the seat pays itself to zero)',
    restoredClasses && restoredBody === 150 && restoredSeat === 0 && restoredName === 40,
    `classes=${restoredClasses}, body=${restoredBody}, seat=${restoredSeat}, name=${restoredName}`
  );
  ok(
    'C2c — and the flow\'s total was the same number the whole way down and the whole way back',
    restoredH === cycleBeforeH,
    `H ${cycleBeforeH}->${restoredH}`
  );
  const anchorNow = await anchor.boundingBox();
  const endTop = await sc.evaluate((el) => el.scrollTop);
  ok(
    'C2d — the anchor never leaves its flow seat (no snap, no bounce, through the whole cycle)',
    Math.abs((anchorNow.y + endTop) - (cycleAnchorY.y + startTop)) <= 1,
    `flow ${cycleAnchorY.y + startTop}->${anchorNow.y + endTop}`
  );
}
{
  // C3 — the very bottom: the fold lands at the max and the page never
  // changed size, so no clamp ever fires — the offset keeps its seat
  // exactly and the anchor keeps its flow seat
  const flowBefore = (await anchor.boundingBox()).y + (await sc.evaluate((el) => el.scrollTop));
  await page.evaluate(() => {
    const scroller = document.getElementById('scroller');
    scroller.scrollTop = scroller.scrollHeight; // the very bottom (past the hem — the fold lands)
  });
  await raf(2);
  const bottomTop = await sc.evaluate((el) => el.scrollTop);
  const bottomMax = await sc.evaluate((el) => el.scrollHeight - el.clientHeight);
  const folded = await tray.evaluate((el) => el.classList.contains('gd-rows-folded'));
  ok(
    'C3 — at the bottom nothing clamps (the offset sits at the max exactly — the max itself never moved)',
    folded && bottomTop === bottomMax,
    `top=${bottomTop}, max=${bottomMax}, folded=${folded}`
  );
  const flowAfter = (await anchor.boundingBox()).y + bottomTop;
  ok(
    'C4 — and the anchor keeps its flow seat at the bottom (the give-back lineage\'s birth disease, retired)',
    Math.abs(flowAfter - flowBefore) <= 1,
    `flow ${flowBefore}->${flowAfter}`
  );
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
