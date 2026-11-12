import { useEffect } from 'react';

// 1.7.0 — THE SCROLLBAR'S OWN BREATH ("add animations for scrollbars
// dissapearing and the content taking its place, like the versions
// scrollbar, or such"): the app's classic 10px webkit bars take their
// gutter in a single frame — the instant a strip starts overflowing the
// bar is simply THERE (the row's box grows by 10px and everything below
// it jumps), and the instant the content stops overflowing the bar is
// GONE (the box shrinks and the content SNAPS into the freed space).
// The pseudo-elements cannot carry transitions of their own, but their
// width/height read a custom property — and a REGISTERED property
// (@property --gd-sb in index.css) tweens on the element that owns it.
// This hook is the JS half: it reads whether the scroller ACTUALLY
// overflows on the given axis and writes the data-gd-sb-off attribute
// while it does not — the CSS pair (.gd-sb-breath + [data-gd-sb-off])
// turns that flip into a 0.18s tween of --gd-sb between 0px and 10px,
// so the bar GROWS out of the edge as the overflow begins and SHRINKS
// back into it as the content stops overflowing, the content box handing
// over and taking back the gutter frame by frame WITH it. A scroller
// that never overflows keeps --gd-sb at 0 — no bar is ever drawn and
// nothing of the classic law changes.
//
// The axis names which overflow the hook reads ('x' for the strip-style
// scrollers, 'y' for the list-style ones); the surfaces this serves
// never scroll on the other axis, so the shared var (which feeds both
// ::-webkit-scrollbar width and height) is safe to move as one voice.
// Re-reads: the element's own resizes ride the ResizeObserver (a panel
// resize, a column crossing); CONTENT-driven flips ride the caller's
// `deps` — the same render that adds or removes the last chip re-runs
// the effect and re-reads the truth (chips are React-rendered here, the
// list's growth is always a render on this side of the tree). jsdom and
// RO-less hosts keep the plain law: the hook simply never arms.
//
// 1.9.6 — THE CONTENT RIDES THE OBSERVER TOO ("when switching between
// cards , the scrollbars if transitioning (aka if the card they are
// switching to invalidates them , whether its low amount to alot of
// amount or high amount to low amount) it should not just snap the items
// in the side pannel , it should expand smoothly or retract smoothly
// simmilar to the fade and right and left buttons"): a fixed-height
// scroller never resizes when its CONTENT grows or shrinks — the RO on
// the element alone could only hear the deps the caller remembered to
// thread, and every forgotten driver (a notes field growing, an image
// landing, a tab swapping) flipped the bar in one frame exactly as
// before. The hook now observes the scroller's FIRST ELEMENT CHILD too
// (the content wrapper, whose box grows and shrinks with the truth),
// re-seated on every deps pass so a re-rendered wrapper is always the
// one watched. One observer family, every driver, the bar breathes
// through them all.
export default function useScrollbarBreath(ref, axis = 'x', deps = []) {
  useEffect(() => {
    const el = ref?.current;
    if (!el || !axis || typeof ResizeObserver === 'undefined') return undefined;
    const read = () => {
      let over = false;
      try {
        over =
          axis === 'y'
            ? el.scrollHeight - el.clientHeight > 1
            : el.scrollWidth - el.clientWidth > 1;
      } catch {
        over = false;
      }
      // The flip is idempotent on purpose — setAttribute never re-starts
      // a style invalidation storm on the RO's honest beats.
      if (over) {
        if (el.hasAttribute('data-gd-sb-off')) el.removeAttribute('data-gd-sb-off');
      } else {
        el.setAttribute('data-gd-sb-off', '');
      }
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    // 1.9.6 — the content's own box rides with the element's (see the
    // note above); guarded, and skipped where there is no child to read.
    let content = null;
    try {
      content = el.firstElementChild || null;
      if (content) ro.observe(content);
    } catch {
      content = null;
    }
    return () => {
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, axis, ...deps]);
}
