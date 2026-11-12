import { useEffect, useState } from 'react';
import { dominantColorOf, resolveStampHue } from '../utils/helpers.js';

// 0.22.0 — resolve the AUTO hue (the dominant color of a stamp image) for a
// live preview surface. dominantColorOf memoizes per url, so the creation
// dialog, the character panel and the app's library-priming effect all share
// one derivation per image — the first viewer pays the decode, everyone else
// reads the cache. Returns null while unknown (callers paint no hue rather
// than a wrong one).
export default function useAutoStampColor(url) {
  const [color, setColor] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!url) {
      setColor(null);
      return undefined;
    }
    dominantColorOf(url).then((hex) => {
      if (alive) setColor(hex || null);
    });
    return () => {
      alive = false;
    };
  }, [url]);
  return color;
}

// 0.23.0 — THE ONE HUE RESOLUTION EVERY SURFACE SHARES. The 0.22.0 bug this
// kills: the grid card resolved its hue ONLY through the library record's
// cached autoColor — when that was missing (a fresh upload, or a lost race
// in the priming effect) the card painted NO hue at all, while the color
// window happily showed a live-derived (or fallback) hue and a transparency
// slider that had nothing to act on. The values in the window were FAKE
// relative to the card.
// 0.41.0 — WHITE IS THE DEFAULT ("default color for the hue of the stamp
// should be white bruh"): the shared chain is now CUSTOM → WHITE — the
// stamp's dominant AUTO color no longer washes the card. Every surface
// walks the same resolveStampHue, so the swatch, the slider and the paint
// can never disagree (the autoColor DERIVATION still runs and stays cached
// on the library records — it just doesn't drive the paint anymore).
export function useStampHue(settings) {
  return resolveStampHue(settings);
}
