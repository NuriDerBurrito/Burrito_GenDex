// Phase-2: does the ESTIMATE phase (heights not yet measured) pick a different
// seat than the measured phase — and does the measured phase ever correct it?
import { layoutMasonry } from '../src/utils/helpers.js';

const CW = 185, G = 20, FOOT = 46;
const hNorm = Math.round(CW * 4 / 3 + FOOT);      // 293 (3:4 normal)
const hE1 = Math.round((2 * CW + G) * 10 / 16 + FOOT); // 290 (16:10 enlarged)
const hE2 = Math.round((2 * CW + G) * 4 / 3 + FOOT);  // 566 (3:4 enlarged)

// MasonryGrid's fallback estimate when NOTHING is measured yet:
const estFallback = CW * 1.33 + 46;               // 292
// ...and the span-2 estimate rides 1.9x:
const estWide = estFallback * 1.9;                // 555

const cols = 6;
console.log(`cols=${cols}`);
console.log(`normal real=${hNorm} est=${estFallback}; E1 real=${hE1} est=${estWide}; E2 real=${hE2} est=${estWide}`);

const packEst = layoutMasonry([estFallback, estFallback, estFallback, estFallback, estWide, estWide], cols, CW, G, [1, 1, 1, 1, 2, 2]);
console.log('\nESTIMATE-phase pack (what renders at class switch):');
packEst.positions.forEach((p, i) => console.log(`  card${i + 1} span${[1,1,1,1,2,2][i]}: x=${p.x} y=${Math.round(p.y)} h=${[estFallback,estFallback,estFallback,estFallback,estWide,estWide][i]}`));

const packReal = layoutMasonry([hNorm, hNorm, hNorm, hNorm, hE1, hE2], cols, CW, G, [1, 1, 1, 1, 2, 2]);
console.log('\nMEASURED-phase pack (after ResizeObserver):');
packReal.positions.forEach((p, i) => console.log(`  card${i + 1} span${[1,1,1,1,2,2][i]}: x=${p.x} y=${Math.round(p.y)} h=${[hNorm,hNorm,hNorm,hNorm,hE1,hE2][i]}`));

// And the intermediate: only the VISIBLE cards measured (E1 measured early,
// E2 still riding the estimate because it sits below the fold):
const packMid = layoutMasonry([hNorm, hNorm, hNorm, hNorm, hE1, estWide], cols, CW, G, [1, 1, 1, 1, 2, 2]);
console.log('\nMID pack (E1 measured, E2 still estimated):');
packMid.positions.forEach((p, i) => console.log(`  card${i + 1}: x=${p.x} y=${Math.round(p.y)}`));

// Seat agreement: the estimate phase and the measured phase must pick the
// same columns and rows (the re-flow flip is the disease).
for (const c of [4, 5, 6]) {
  const seat = (p) => `${Math.round(p.x / 205)}:${Math.round(p.y / 50)}`;
  const pe = layoutMasonry([estFallback, estFallback, estFallback, estFallback, estWide, estWide], c, CW, G, [1, 1, 1, 1, 2, 2]);
  const pr = layoutMasonry([hNorm, hNorm, hNorm, hNorm, hE1, hE2], c, CW, G, [1, 1, 1, 1, 2, 2]);
  const ePos = pe.positions.map((p) => `(${p.x},${Math.round(p.y)})`).join(' ');
  const rPos = pr.positions.map((p) => `(${p.x},${Math.round(p.y)})`).join(' ');
  const seats = pe.positions.map(seat).join(' ') === pr.positions.map(seat).join(' ');
  console.log(`\ncols=${c}: est=${ePos}  ->  real=${rPos}  ${seats ? 'SAME SEATS' : '<< SEAT FLIPS'}`);
}
