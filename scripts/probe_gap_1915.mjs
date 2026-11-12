// Reproduce the 1.9.15 report: "4 normal cards (3:4 small), then a 16:10
// enlarged card and a 3:4 enlarged card — the enlarged cards won't stay next
// to the 4 normal cards, leaving exactly a 1-card gap inbetween."
// Drive the REAL layoutMasonry with realistic card boxes and render ASCII
// walls so the seat the packer actually chooses can be seen.
import { layoutMasonry, masonryColumns } from '../src/utils/helpers.js';

const CW = 185; // card width (a mid-zoom step)
const G = 20; // gap
const FOOT = 46; // footer height (approx, same for all)

function hNorm(ratio) { return Math.round(CW * ratio + FOOT); } // single-span
function hWide(ratio) { return Math.round((2 * CW + G) * ratio + FOOT); } // span-2

const cases = [
  { name: 'reported: 4x 3:4 normal + 16:10 wide + 3:4 wide', hs: [hNorm(4 / 3), hNorm(4 / 3), hNorm(4 / 3), hNorm(4 / 3), hWide(10 / 16), hWide(4 / 3)], spans: [1, 1, 1, 1, 2, 2] },
];

function asciiWall(laid, hs, spans, cols, rowsStep = 100) {
  const H = Math.max(...laid.positions.map((p, i) => p.y + hs[i])) + 40;
  const lines = [];
  const cell = (x, y) => {
    // which card covers grid cell (col x, band y)?
    for (let i = 0; i < laid.positions.length; i += 1) {
      const p = laid.positions[i];
      const w = spans[i] === 2 ? 2 : 1;
      if (x >= p.x / (CW + G) && x < p.x / (CW + G) + w && y >= p.y && y < p.y + hs[i]) {
        return spans[i] === 2 ? (i === 4 ? 'E' : 'F') : String(i + 1);
      }
    }
    return '·';
  };
  for (let y = 0; y < H; y += rowsStep) {
    let row = '';
    for (let c = 0; c < cols; c += 1) row += cell(c, y) + ' ';
    lines.push(`y=${String(y).padStart(4)}  ${row}`);
  }
  return lines.join('\n');
}

for (const cols of [4, 5, 6, 7]) {
  for (const c of cases) {
    const laid = layoutMasonry(c.hs, cols, CW, G, c.spans);
    console.log(`\n=== ${c.name} — cols=${cols} (container ${cols * CW + (cols - 1) * G}px) ===`);
    console.log(laid.positions.map((p, i) => `card${i + 1}(span${c.spans[i]}): x=${p.x} y=${Math.round(p.y)} h=${c.hs[i]}`).join('\n'));
    console.log(asciiWall(laid, c.hs, c.spans, cols));
  }
}

// Also: what column count does a typical wall width produce?
for (const w of [800, 900, 1000, 1100, 1200, 1300, 1400]) {
  console.log(`width ${w} -> ${masonryColumns(w, CW, G)} columns`);
}
