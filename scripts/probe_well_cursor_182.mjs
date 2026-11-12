#!/usr/bin/env node
// 1.8.2 HIT-PROBE (Playwright/Chromium) — settles the border strip's law on
// a real engine before the version ships:
//   A. Does the shell's ::after strip INTERCEPT the hover over the field's
//      right border zone — the reported sliver — so the hit lands on the
//      SHELL (whose pseudo speaks the chrome arrow) instead of the textarea
//      (whose UA cursor is the I-beam)?
//   B. Does the strip's own computed cursor read DEFAULT (the lane's arrow,
//      seated on the pseudo)?
//   C. Does the FIELD keep its UA cursor (auto — the I-beam over the text)
//      with no cursor declaration of its own anywhere in the well?
//   D. Does the strip leave the LANE alone (a few px inside the border, the
//      hit still lands on the textarea — the 1.8.1 arrows law untouched)?
//   E. Does the strip sit ONLY at the right edge (the left/center hovers
//      still land on the field)?
// The probe replicates the app's own well geometry: the borderless shell
// (position: relative + overflow: hidden + the radius), the field with its
// 1.5px border + the 10px lane + scrollbar-gutter: stable, and the 1.8.2
// strip rule verbatim.
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><style>
  body { margin: 0; padding: 20px; background: #ffffff; }
  .gd-well-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: min(8px, 10px);
    overflow: hidden;
    width: 260px;
  }
  .gd-well-shell::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    pointer-events: auto;
    cursor: default;
  }
  .gd-well-shell .gd-prompt-box {
    flex: 1 0 auto;
    resize: vertical;
    min-height: 4.6em;
    overflow-y: auto;
    scrollbar-gutter: stable;
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid #333333;
    border-radius: min(8px, 10px);
    background: #d8d8d8;
    padding: 8px 10px;
    font: 12px/1.4 monospace;
  }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.38); border-radius: 6px; }
  ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner, ::-webkit-resizer { background: transparent; }
  .gd-prompt-box::-webkit-scrollbar,
  .gd-prompt-box::-webkit-scrollbar-thumb,
  .gd-prompt-box::-webkit-scrollbar-track,
  .gd-prompt-box::-webkit-scrollbar-corner,
  .gd-prompt-box::-webkit-resizer { cursor: default; }
  .gd-prompt-box::-webkit-resizer { cursor: nwse-resize; }
</style></head><body>
  <div class="gd-well-shell" id="shell">
    <textarea id="field" class="gd-input gd-prompt-box" spellcheck="false">line1
line2
line3
line4
line5
line6
line7
line8
line9
line10
line11
line12
line13
line14
line15</textarea>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
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

const geom = await page.evaluate(() => {
  const shell = document.getElementById('shell');
  const field = document.getElementById('field');
  const sr = shell.getBoundingClientRect();
  const fr = field.getBoundingClientRect();
  const hit = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? el.id || el.tagName : 'none';
  };
  const midY = fr.top + fr.height / 2;
  return {
    shellRight: sr.right,
    shellTop: sr.top,
    shellH: sr.height,
    fieldRight: fr.right,
    fieldLeft: fr.left,
    fieldTop: fr.top,
    fieldH: fr.height,
    fieldCursor: getComputedStyle(field).cursor,
    stripCursor: getComputedStyle(shell, '::after').cursor,
    stripPointerEvents: getComputedStyle(shell, '::after').pointerEvents,
    laneWidth: field.offsetWidth - field.clientWidth, // scrollbar + borders gutter measure
    hits: {
      borderIn1: hit(fr.right - 1, midY),
      borderIn18: hit(fr.right - 1.8, midY),
      laneIn6: hit(fr.right - 6, midY),
      center: hit(fr.left + (fr.right - fr.left) / 2, midY),
      leftBorder: hit(fr.left + 1, midY),
      shellRightmost: hit(sr.right - 0.5, midY),
    },
  };
});

console.log('A. THE STRIP INTERCEPTS THE SLIVER (the border zone lands on the shell)');
ok('A1 — the right border zone hits the SHELL, not the textarea', geom.hits.borderIn1 === 'shell', `got ${geom.hits.borderIn1}`);
ok('A2 — the border zone\'s outermost pixel also hits the shell', geom.hits.borderIn18 === 'shell', `got ${geom.hits.borderIn18}`);

console.log('B. THE STRIP SPEAKS THE CHROME ARROW (default, hit-testable)');
ok('B1 — the ::after computed cursor is DEFAULT', geom.stripCursor === 'default', `got ${geom.stripCursor}`);
ok('B2 — the ::after is hit-testable (pointer-events auto)', geom.stripPointerEvents === 'auto', `got ${geom.stripPointerEvents}`);

console.log('C. THE FIELD KEEPS ITS UA CURSOR (the I-beam\'s own promise)');
// Chromium resolves the textarea's UA `auto` to the computed value `text`
// — the caret's own I-beam, the promise the 1.8.1 law returned to the text.
ok('C1 — the field\'s computed cursor is the UA text (no declaration anywhere)', geom.fieldCursor === 'text', `got ${geom.fieldCursor}`);

console.log('D. THE LANE KEEPS ITS OWN SEAT (the 1.8.1 arrows law untouched)');
ok('D1 — a few px inside the border, the hit still lands on the field', geom.hits.laneIn6 === 'field', `got ${geom.hits.laneIn6}`);
ok('D2 — the lane reserves its width (the scrollbar gutter speaks)', geom.laneWidth > 8, `measured ${geom.laneWidth}px`);

console.log('E. THE STRIP SITS ONLY AT THE RIGHT EDGE');
ok('E1 — the field\'s center still hits the field (the text surface)', geom.hits.center === 'field', `got ${geom.hits.center}`);
ok('E2 — the field\'s left border still hits the field (the strip is right-only)', geom.hits.leftBorder === 'field', `got ${geom.hits.leftBorder}`);
ok('E3 — the shell\'s own rightmost pixel hits the shell (the strip swallows it)', geom.hits.shellRightmost === 'shell', `got ${geom.hits.shellRightmost}`);

console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
