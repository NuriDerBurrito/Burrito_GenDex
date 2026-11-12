#!/usr/bin/env node
// 1.8.5 PRE-FIX PROBES (Playwright/Chromium) — settles the two DOM-side
// reports on a real engine before the version's code is written:
//   A. THE SELECTED OUTLINE vs THE HOVER (report 4: "when hovering over the
//      prompt the highlighted selected outline dissapears from the
//      container"): the :has focus family (1.7.7/1.7.8) is pinned against
//      every hover family the row can wear — plain, colored LIGHT, and
//      colored DEEP — with the rules in the file's own source order. The
//      reads wait out the row's own 0.14s border transition so the computed
//      value is the SETTLED cascade verdict, never a mid-flight frame.
//   B. THE FLIP'S STALE ORIGIN (report 3: "when moving prompts up or down
//      for the first time they snap to the very top and then snap back"):
//      the 1.4.5 swap flight reads its ORIGIN from prevTopsRef — the tops
//      map recorded at the LAST parts-commit, which on the FIRST move is
//      the MOUNT breath. Any layout the panel settled between that breath
//      and the press (fonts, wraps, the content-visibility estimates, the
//      width flight) leaves the map stale — and where that drift is NOT
//      uniform (a row above the pressed one changing height, the estimate
//      pile-up), the FLIP paints the pressed row at the stale seat before
//      gliding it home: the row visibly snapping toward the very top of
//      the stack then snapping back. The probe mounts the editor verbatim,
//      grows a row ABOVE the pressed one after mount (the settled layout
//      gaining height the mount map never saw), presses MOVE, and reads
//      the transform the FLIP just wrote — then runs the same press under
//      the PRESS-TIME ORIGIN fix and reads it again.
import { chromium } from 'playwright';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Part A: the outline/hover cascade, the file's own rule family verbatim ──
const cssA = `
  :root {
    --gd-bg: #0f0f0f; --gd-chrome: #f2f2f2; --gd-panel: #191919;
    --gd-ink: #f2f2f2; --gd-line: #3d3d3d; --gd-accent: #ffd400;
    --gd-accent-2: #ffd400; --gd-mute: #9a9a9a; --gd-panel-text: #f2f2f2;
    --gd-radius: 10px; --gd-btn-radius: 8px; --gd-shape-radius: 10px;
  }
  .gd-part-row {
    display: flex; gap: 8px; align-items: stretch; position: relative;
    padding: 9px 10px 9px 12px; margin-bottom: 10px;
    border: 1.5px solid var(--gd-ink);
    border-radius: var(--gd-shape-radius, var(--gd-radius));
    background: color-mix(in srgb, var(--gd-panel) 92%, var(--gd-bg));
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-ink) 30%, transparent);
    transition: border-color 0.14s ease, box-shadow 0.14s ease;
  }
  .gd-part-row:hover {
    border-color: color-mix(in srgb, var(--gd-accent) 62%, var(--gd-ink));
    box-shadow: 2.5px 2.5px 0 color-mix(in srgb, var(--gd-ink) 38%, transparent);
  }
  .gd-part-row.gd-part-row:has(.gd-prompt-box:focus),
  .gd-part-row.gd-part-row:has(.gd-rt-edit:focus) {
    border-color: color-mix(in srgb, var(--gd-accent) 72%, var(--gd-ink));
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-accent) 45%, transparent);
  }
  .gd-part-row.gd-part-row.is-colored:has(.gd-prompt-box:focus),
  .gd-part-row.gd-part-row.is-colored:has(.gd-rt-edit:focus) {
    border-color: color-mix(in srgb, var(--gd-accent) 55%, var(--part-line, var(--gd-ink)));
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-accent) 40%, transparent);
  }
  .gd-part-row.is-colored {
    border-color: var(--part-line, color-mix(in srgb, var(--gd-accent) 72%, var(--gd-panel)));
    background: var(--part-face, #232323);
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-accent) 45%, #0e0e0e);
    color: var(--part-ink, var(--gd-panel-text));
  }
  .gd-part-row.is-colored:hover {
    border-color: var(--part-color, var(--gd-accent));
  }
  .gd-part-row.is-colored.is-shade-deep {
    border-color: var(--part-line, #5a6fd1);
    background: var(--part-face, #1a2b6d);
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-accent) 58%, #0e0e0e);
  }
  .gd-part-row.is-colored.is-shade-deep:hover {
    border-color: var(--part-color, var(--gd-accent));
  }
  .gd-rt-edit { width: 200px; height: 20px; background: #222; color: #eee; }
  .gd-prompt-box { width: 200px; height: 40px; background: #1a1a1a; color: #eee; display:block; }
`;

const htmlA = `<!doctype html><html><head><style>${cssA}</style></head><body>
  <div id="plain" class="gd-part-row"><div class="gd-rt-edit" tabindex="0" contenteditable>plain title</div></div>
  <div id="light" class="gd-part-row is-colored" style="--part-color:#7c9eff;--part-face:#c7d3ff;--part-ink:#10142c;--part-line:#5773d6">
    <div class="gd-rt-edit" tabindex="0" contenteditable>light title</div></div>
  <div id="deep" class="gd-part-row is-colored is-shade-deep" style="--part-color:#1a2b6d;--part-face:#1a2b6d;--part-ink:#ffffff;--part-line:#5a6fd1">
    <div class="gd-rt-edit" tabindex="0" contenteditable>deep title</div></div>
</body></html>`;

// ── Part B: the 1.4.5 FLIP machinery, verbatim ──
const htmlB = `<!doctype html><html><head><style>
  body { margin:0; font: 12px/1.4 sans-serif; }
  .scroller { height: 500px; overflow-y: auto; position: relative; }
  .above { height: 80px; background: #333; }
  .row { height: 60px; margin-bottom: 10px; background: #2a2a2a; color: #eee; padding: 6px; box-sizing: border-box; }
</style></head><body>
  <div class="scroller" id="scroller">
    <div class="above" id="above">the panel's settling ground</div>
    <div id="list"></div>
  </div>
  <script>
    // the 1.4.5 FLIP, verbatim in shape: prevTopsRef recorded at every
    // parts-commit; the pair's origins read from that map at swap time.
    // THE 1.8.5 CURE under test: origins measured at PRESS TIME.
    const rowRefs = new Map(); const prevTops = { current: null };
    const flipTargets = { current: null };
    const flipOrigins = { current: null }; // 1.8.5 — press-time origins
    const usePressOrigins = { current: false };
    const list = document.getElementById('list');
    const parts = [{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
    function render() {
      list.innerHTML = '';
      parts.forEach(p => {
        const el = document.createElement('div');
        el.className = 'row'; el.textContent = 'part ' + p.id;
        el.id = 'row-' + p.id;
        list.appendChild(el); rowRefs.set(p.id, el);
      });
    }
    function measureTops() {
      const tops = new Map();
      rowRefs.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        const scroller = el.closest('.scroller') || null;
        tops.set(id, r.top - (scroller ? scroller.scrollTop : 0));
      });
      return tops;
    }
    function layoutEffect() {
      const targets = flipTargets.current;
      const origins = flipOrigins.current;
      const tops = measureTops();
      const prev = prevTops.current;
      const written = [];
      const source = usePressOrigins.current ? origins : prev;
      if (source && targets) {
        targets.forEach(id => {
          const old = source.get(id); const top = tops.get(id);
          if (old == null || top == null || Math.abs(old - top) < 1) return;
          const el = rowRefs.get(id); if (!el) return;
          el.style.transition = 'none';
          el.style.transform = 'translateY(' + (old - top) + 'px)';
          written.push({ id, dy: old - top });
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.28s cubic-bezier(0.22, 1.2, 0.36, 1)';
            el.style.transform = '';
          });
        });
      }
      flipTargets.current = null; flipOrigins.current = null;
      prevTops.current = tops;
      return written;
    }
    render(); layoutEffect(); // the mount commit
    window.__settle = (px) => { document.getElementById('row-a').style.height = (60 + px) + 'px'; };
    window.__setPressOrigins = (v) => { usePressOrigins.current = v; };
    window.__move = (id, dir) => {
      const i = parts.findIndex(p => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= parts.length) return null;
      const peer = parts[j];
      const next = [...parts];
      const [moved] = next.splice(i, 1);
      next.splice(j, 0, moved);
      parts.length = 0; parts.push(...next);
      const list = document.getElementById('list');
      const movedEl = rowRefs.get(id); const peerEl = rowRefs.get(peer.id);
      if (usePressOrigins.current) {
        // 1.8.5 — the pair's seats measured in the PRESS breath itself,
        // PRE-COMMIT: nothing the panel settled since the last commit can
        // leak into the flight's origin (movePart measures before it ever
        // hands the new order to onSetParts — the DOM re-seat is the commit
        // that follows).
        flipOrigins.current = measureTops();
      }
      list.insertBefore(movedEl, dir > 0 ? peerEl.nextSibling : peerEl);
      flipTargets.current = new Set([id, peer.id]);
      return layoutEffect();
    };
    window.__reset = () => {
      parts.length = 0; parts.push({id:'a'},{id:'b'},{id:'c'},{id:'d'});
      render();
      document.getElementById('row-a').style.height = '';
      layoutEffect();
    };
  </script>
</body></html>`;

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // ── A ──
  await page.setContent(htmlA);
  const readCase = async (rowId, fieldSel) => {
    const row = page.locator(`#${rowId}`);
    const field = row.locator(fieldSel);
    await field.focus();
    await settle(260); // the row's own 0.14s border transition settles
    const focused = await row.evaluate((el) => getComputedStyle(el).borderColor);
    await row.hover();
    await settle(260);
    const hovered = await row.evaluate((el) => getComputedStyle(el).borderColor);
    const stillFocused = await row.evaluate(() => document.activeElement && document.activeElement.classList.contains('gd-rt-edit'));
    await page.mouse.move(2, 400);
    await settle(260);
    return { focused, hovered, stillFocused };
  };
  const plainA = await readCase('plain', '.gd-rt-edit');
  const lightA = await readCase('light', '.gd-rt-edit');
  const deepA = await readCase('deep', '.gd-rt-edit');

  check(
    'A0 · the probe focus holds through the hover (the arms own honesty)',
    plainA.stillFocused === true,
    `activeElement still the title: ${plainA.stillFocused}`
  );
  check(
    'A1 · plain row keeps its selected outline under the hover',
    plainA.focused === plainA.hovered,
    `focused ${plainA.focused} vs hovered ${plainA.hovered}`
  );
  check(
    'A2 · colored LIGHT row keeps its selected outline under the hover',
    lightA.focused === lightA.hovered,
    `focused ${lightA.focused} vs hovered ${lightA.hovered}`
  );
  check(
    'A3 · colored DEEP row keeps its selected outline under the hover (the reported disease)',
    deepA.focused === deepA.hovered,
    `focused ${deepA.focused} vs hovered ${deepA.hovered}`
  );

  // ── B ──
  await page.setContent(htmlB);
  // the panel settles AFTER the mount commit: a row ABOVE the pressed one
  // grows 140px (the font/wrap/estimate drift the mount map never saw).
  await page.evaluate(() => window.__settle(140));
  // THE OLD ORDER (the mount-memory origins) — the disease arm: moving the
  // pressed row DOWN seats it below the drifted row, so the stale origin
  // carries the whole drift PLUS the swap — the row teleporting toward the
  // very top of the stack then gliding back (the report's own words).
  const oldWritten = await page.evaluate(() => window.__move('b', 1));
  const oldW = oldWritten && oldWritten.find((x) => x.id === 'b');
  check(
    'B1 · the mount-memory origin carries the settled drift (the disease arm — expects to SEE it pre-fix)',
    !!oldW && Math.abs(oldW.dy + 210) < 1.5,
    oldW ? `the pressed row teleports ${oldW.dy}px — the 140px drift riding the 70px swap, not the swap alone` : 'no FLIP written'
  );
  // THE 1.8.5 ORDER (the press-time origins) — the cure arm:
  await page.evaluate(() => window.__reset());
  await page.evaluate(() => window.__settle(140));
  await page.evaluate(() => window.__setPressOrigins(true));
  const newWritten = await page.evaluate(() => window.__move('b', 1));
  const newW = newWritten && newWritten.find((x) => x.id === 'b');
  check(
    'B2 · the press-time origin speaks only the honest swap (the cure arm)',
    !!newW && Math.abs(newW.dy + 70) < 1.5,
    newW ? `the pressed row glides ${newW.dy}px — exactly the one-row swap, nothing else` : 'no FLIP written'
  );
  check(
    'B3 · the press-time origin is drift-free by construction (a second, different drift, same verdict)',
    (await page.evaluate(() => { window.__reset(); window.__settle(260); window.__setPressOrigins(true); return window.__move('c', 1); }))
      ?.find?.((x) => x.id === 'c')?.dy === -70,
    'a 260px drift above still glides exactly the 70px swap'
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
