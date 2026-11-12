import { useEffect } from 'react';

// 0.27.0 — THE STYLIZED TOOLTIP LAYER. One mount, zero component churn: the
// app already speaks in `title` attributes on every key, so this layer
// replaces the OS's plain white boxes with GenDex pills.
//
// 0.29.0 — TWO REWORKS on request:
//   · "the old tooltip sometimes appears, fix that": the old lift-on-hover
//     model had holes — a title written onto an element that is ALREADY
//     under a stationary pointer (modals popping open under the cursor,
//     React swapping nodes mid-hover, focusout restoring a title while the
//     pointer never left) never fired pointerover, so the OS box painted.
//     THE FIX IS TOTAL: a document-wide MutationObserver moves EVERY title
//     attribute into data-gd-tip-src the moment it appears (initial sweep on
//     mount included). No element in this document carries a `title` for
//     more than a tick, so the native tooltip physically cannot show. There
//     is no restore dance anymore — the stash IS the storage.
//   · "add an option to disable tooltips in general": App dispatches a
//     `gd-tooltips-mode` CustomEvent on the document whenever the setting
//     flips; OFF paints nothing at all (titles stay stripped — off means
//     OFF, not "back to the OS boxes") and dismisses a visible pill.
//
// Kept from 0.28.0: the decluttered pill (ink + text + soft shadow, no
// arrow/rim). 1.2.4 — THE PILL PINS AT ITS HOVER POINT ("the tooltip
// should not follow my cursor, it should appear where i hovered and stay
// there until i stop hovering"): the 0.28.0–0.38.0 LIVE tracking (the pill
// re-centered on every pointermove/scroll frame) is RETIRED — the pill
// paints once at the point where the hover began (the entry cursor's x,
// the anchor's own seat) and NEVER MOVES for the whole hover. The pointer
// is still tracked — but only as GROUND TRUTH (a move that provably leaves
// the anchor ends the pill); a scroll that slides the anchor out from
// under the still pointer ends it the same way. A per-anchor observer
// still swaps the text when React writes a new label mid-hover (SAVE ->
// SAVED, undo counters…), re-painting in place at the same pin.
// Unmounted/offscreen anchors dismiss; focusin shows it too; window blur
// and Escape end it.
//
// 1.0.0 — THE REACTIVATION CLEANSLATE ("tooltips sometimes when i minimize
// or switch between apps and return back would always be stuck on screen"):
// the pill's state could go stale across a deactivate/reactivate cycle.
// Chromium REFIRES focusin on the window's saved element the moment focus
// returns — and focusin shows the pill even when the pointer is somewhere
// else entirely; pointerout for an anchor the pointer was never inside never
// fires, so that pill survived every later mouse move — stuck on screen
// forever. THREE LAWS close it:
//   · LEAVE CLEAN — blur already ended the pill; visibilitychange-hidden
//     now ends it too (minimize can skip blur in Electron) and the stale
//     cursor track is dropped so every post-return decision uses fresh data.
//   · RETURN CLEAN — the window's focus event ends the pill and arms a short
//     REACTIVATION WINDOW in which focusin alone may not paint: the refocus
//     of the saved element is the OS, not the user. A real hover — or a
//     click on a titled key after the window — still shows normally.
//   · GROUND TRUTH — any real pointer event that proves the pointer is NOT
//     over the current anchor ends the pill (a few px of slack for hover
//     motions and subpixel edges). No stale show survives the first twitch
//     of the mouse, whatever woke it.
//
// Renders null — it is a behavior, not a node.

const SHOW_DELAY = 300;
const HIDE_GRACE = 40;
// 1.0.0 — how long after a reactivation focusin alone stays muted (the OS
// refocus of the saved element is not a user act; a real hover outruns it).
const REACTIVATION_GUARD = 400;
// 1.0.0 — the ground-truth slack: hover lifts move an anchor a pixel or two
// while the pointer legitimately rests on it; only provably-off counts.
const EDGE_SLACK = 3;
// 0.38.0 — the app's top toolbar height: a pill may never float UNDER it
// (the stamp picker clipping fix's twin law — anything that must be visible
// stays below the bar).
const TOP_FLOOR = 44;
// 1.1.2 — THE BAR'S TRUE BOTTOM ("top feedback inside tooltips coming from
// top should be below the top bar so it doesnt cover the feedback that
// already exists in the toolbar"): the below-flip used the ANCHOR's own
// bottom (+7), so a pill flipped under a titlebar key or the status text
// landed with its top INSIDE the bar's lower band (measured: "Ready" at
// y=35 against a 40px bar + 1.5px border — the pill rode the toolbar's
// face, right over the live status). The flip now seats the pill below the
// BAR's real bottom edge whenever the anchor lives inside it — the anchor's
// own bottom only governs anchors that sit BELOW the bar (grid keys, tree
// rows: unchanged). Read live from the DOM (themes, zoom and the border all
// move the true edge); absent a bar (tests), the old floor stands.
const barBottom = () => {
  try {
    const bar = typeof document !== 'undefined' ? document.querySelector('.gd-titlebar') : null;
    if (!bar || typeof bar.getBoundingClientRect !== 'function') return 0;
    return Math.ceil(bar.getBoundingClientRect().bottom);
  } catch {
    return 0;
  }
};
// The title -> stash move. idempotent; returns true when it actually moved.
const liftTitle = (el) => {
  if (!el || el.getAttribute('title') == null) return false;
  const text = String(el.getAttribute('title') || '').trim();
  el.removeAttribute('title');
  if (text) el.dataset.gdTipSrc = text;
  else delete el.dataset.gdTipSrc;
  return true;
};

export default function GdTooltips() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    // The one pill, created once and reused.
    const tip = document.createElement('div');
    tip.className = 'gd-tip';
    tip.setAttribute('data-gd-tooltip', '1');
    tip.setAttribute('role', 'tooltip');
    tip.style.display = 'none';
    document.body.appendChild(tip);

    let current = null; // { el, text }
    let enabled = true;
    let showTimer = 0;
    let hideTimer = 0;
    // 1.6.2 — the exit flight's own clock (see hideNow): display:none lands
    // only after the fadeout transition has had its whole breath.
    let hideFlightTimer = 0;
    let cachedW = 0; // the pill's measured size (text changes
    let cachedH = 0; // only on a text swap, not on every follow frame)
    let lastX = -1;
    let lastY = -1;
    let lastBelow = false;
    // 1.2.4 — THE PIN: the x the pill centers on — frozen at the hover's
    // ENTRY (wherever the pointer rested when the hover began), never
    // re-read while the pill lives. Null while nothing shows; the first
    // paint sets it (the focusin path, which owns no cursor, pins the
    // anchor's own center-x).
    let pinX = null;
    // 0.38.0 — THE CURSOR'S LAST POSITION: the pointer is tracked as
    // GROUND TRUTH only (1.2.4 killed the follow) — it decides whether the
    // anchor is still under the pointer, never where the pill sits.
    let cursorX = null;
    let cursorY = null;
    // 1.0.0 — when this window last regained focus (see the header note).
    let reactivatedAt = 0;
    // 1.2.6 — the press guard (see onPress): focusin alone stays muted for
    // a beat after any press — the click's own refocus is not a hover.
    let suppressFocusUntil = 0;

    // ---------------------------------------------------------------------
    // THE STRIPPER — no element may keep a title attribute. The initial
    // sweep covers everything already committed; the observer catches every
    // later write (React renders, portals, dynamically-built nodes).
    // ---------------------------------------------------------------------
    const sweep = () => {
      if (typeof document.querySelectorAll !== 'function') return;
      document.querySelectorAll('[title]').forEach(liftTitle);
    };
    sweep();
    let stripper = null;
    if (typeof MutationObserver !== 'undefined') {
      stripper = new MutationObserver((records) => {
        for (const rec of records) {
          if (rec.type === 'attributes' && rec.attributeName === 'title') {
            // React re-rendered a NEW label onto a CONNECTED element.
            liftTitle(rec.target);
          } else if (rec.type === 'childList') {
            // A subtree MOUNTED. Titles set at node CREATION happen while
            // the node is still detached — attribute records never fire for
            // them, so every added subtree is scanned on arrival. This is
            // the hole the old lift-on-hover model died of.
            for (const node of rec.addedNodes) {
              if (!node || node.nodeType !== 1) continue; // elements only
              if (node.getAttribute && node.getAttribute('title') != null) liftTitle(node);
              if (typeof node.querySelectorAll === 'function') {
                node.querySelectorAll('[title]').forEach(liftTitle);
              }
            }
          }
        }
      });
      stripper.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['title'],
      });
    }

    // Watches the CURRENT anchor for mid-hover stash swaps (the global
    // stripper moved a new React label into data-gd-tip-src; the pill swaps
    // its text in place).
    let observer = null;
    const stopObserving = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
    const startObserving = (el) => {
      if (typeof MutationObserver === 'undefined') return;
      stopObserving();
      observer = new MutationObserver((records) => {
        if (!current || current.el !== el) return stopObserving();
        for (const rec of records) {
          if (rec.type !== 'attributes') continue;
          const next = String(el.dataset.gdTipSrc || '').trim();
          if (!next) continue; // cleared without a replacement: keep the old text
          if (next === current.text) continue;
          current.text = next;
          // mid-swap while still inside the show DELAY: the pending show
          // paints the new text on schedule; only a visible pill re-paints.
          if (tip.classList.contains('is-on')) paint();
          return;
        }
      });
      observer.observe(el, { attributes: true, attributeFilter: ['data-gd-tip-src'] });
    };

    // 1.0.0 — GROUND TRUTH: is the pointer provably OFF the current anchor?
    // The last known cursor position versus the anchor's live rect. Used by
    // every pointer-event path so no stale show can outlive a real mouse
    // move — the pill is for the element under the pointer, always.
    const pointerOffAnchor = () => {
      if (!current) return false;
      // 1.2.4 — an UNMOUNTED anchor is provably off the pointer (React can
      // pull the hovered node mid-hover; the old place() loop caught this
      // through its isConnected check, the ground truth must too — a pill
      // for a node that left the document can never dismiss otherwise).
      if (typeof current.el.isConnected === 'boolean' && !current.el.isConnected) return true;
      if (!Number.isFinite(cursorX) || !Number.isFinite(cursorY)) return false;
      let r = null;
      try {
        r = current.el.getBoundingClientRect();
      } catch {
        return false;
      }
      if (!r || (r.width === 0 && r.height === 0)) return false; // hidden — the viewport checks own it
      return (
        cursorX < r.left - EDGE_SLACK ||
        cursorX > r.right + EDGE_SLACK ||
        cursorY < r.top - EDGE_SLACK ||
        cursorY > r.bottom + EDGE_SLACK
      );
    };

    const clearTimers = () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
      showTimer = 0;
      hideTimer = 0;
    };

    const paint = () => {
      if (!current) return;
      // 1.6.2 — a fresh paint cancels any pending EXIT flight (the pill is
      // being reused for a new anchor — its display seat stays).
      if (hideFlightTimer) {
        clearTimeout(hideFlightTimer);
        hideFlightTimer = 0;
      }
      if (!enabled) return hideNow();
      const { el, text } = current;
      if (!el.isConnected) return hideNow(); // unmounted mid-hover
      tip.textContent = text;
      // 1.0.8 — the name mark decides the clamp BEFORE the measure: an
      // .is-name pill folds to two lines, so its measured height must be
      // the CLAMPED height (placed as such), while every other pill wraps
      // to whatever its sentence needs.
      tip.classList.toggle('is-name', current.isName === true);
      // Measure first (hidden), then place.
      tip.style.display = '';
      tip.classList.remove('is-on', 'is-below');
      tip.style.visibility = 'hidden';
      tip.style.left = '0px';
      tip.style.top = '0px';
      const rect = el.getBoundingClientRect();
      cachedW = tip.offsetWidth;
      cachedH = tip.offsetHeight;
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 800;
      // 1.2.4 — CENTER ON THE PIN, not the live cursor: the pill takes the
      // x it was pinned at (the hover's entry point — 0.38.0's "appears
      // where i hovered" law, now frozen for the whole hover); only the
      // screen-edge clamp may push it sideways (and never under the top
      // toolbar). The focusin path owns no cursor — it pins the anchor's
      // own center-x on its first paint.
      if (pinX == null) pinX = Number.isFinite(cursorX) ? cursorX : rect.left + rect.width / 2;
      const x = Math.max(8, Math.min(vw - cachedW - 8, pinX - cachedW / 2));
      let y = rect.top - cachedH - 7;
      let below = false;
      if (y < TOP_FLOOR) {
        // 1.1.2 — below the BAR for bar-dwelling anchors (see barBottom):
        // max of the anchor's own bottom and the bar's true edge.
        y = Math.max(rect.bottom, barBottom()) + 7;
        below = true;
      }
      // 1.6.9 — THE PILL NEVER CLIPS THE WINDOW'S BOTTOM ("some tooltips
      //   clip to the bottom such as the 'drag to resize the preview
      //   column' in full detail window, fix that"): the flip below used
      //   the anchor's own bottom (+7) with no view of the viewport's
      //   floor — a tall pill flipping under an anchor that already sits
      //   near the window's bottom edge (the full-window view's tall
      //   PREVIEW COLUMN SEPARATOR: its rect spans the whole body, so a
      //   small available-above band flips the pill below, and the below
      //   seat ran straight past the floor) painted with its tail cut off
      //   by the window edge. The below seat now clamps to the viewport:
      //   the pill's bottom edge may never pass 8px above the window's
      //   own floor; when even the clamped seat cannot fit the pill, the
      //   pill pins to the TOP floor instead (a tall pill beats a clipped
      //   one — the anchor's column keeps its pill, whatever the room).
      if (below) {
        const maxTop = Math.max(TOP_FLOOR, (window.innerHeight || 800) - cachedH - 8);
        if (y > maxTop) y = maxTop;
      }
      // The anchor left the viewport entirely — dismiss instead of floating.
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) return hideNow();
      lastX = Math.round(x);
      lastY = Math.round(y);
      lastBelow = below;
      tip.style.left = `${lastX}px`;
      tip.style.top = `${lastY}px`;
      tip.style.visibility = '';
      tip.classList.toggle('is-below', below);
      // 1.2.5 — THE PILL NEVER OWNS THE WINDOW'S DRAG ("when i try to drag
      // the top window and a tooltip is visible, the window can't be
      // dragged"): in Electron the -webkit-app-region walk is a paint-order
      // region computation that pointer-events does NOT exempt — a fixed
      // pill floating over the titlebar subtracted its box from the bar's
      // drag region (the OS-level press never dragged, pointer-events:
      // none notwithstanding), so every visible tooltip near the top edge
      // punched an un-grabbable hole in the window's handle. The pill
      // declares its region DYNAMICALLY at every paint: while its box
      // intersects a drag strip (.gd-titlebar / .drag-region — the bar and
      // the toolbar rows) it speaks DRAG, so a press where the pill covers
      // the bar drags the window exactly as the bar underneath would;
      // anywhere else it stays NO-DRAG and the press falls through to the
      // page as always (the pill itself is pointer-events: none — it never
      // had a click to lose).
      try {
        const pr = tip.getBoundingClientRect();
        let overStrip = false;
        if (pr.width > 1 && pr.height > 1) {
          const strips = document.querySelectorAll('.gd-titlebar, .drag-region');
          for (const s of strips) {
            const sr = s.getBoundingClientRect();
            if (sr.width > 1 && sr.height > 1 && pr.left < sr.right && pr.right > sr.left && pr.top < sr.bottom && pr.bottom > sr.top) {
              overStrip = true;
              break;
            }
          }
        }
        tip.style.webkitAppRegion = overStrip ? 'drag' : 'no-drag';
      } catch {
        /* region is a courtesy, never a crash */
      }
      // restart the transition from the base state
      // eslint-disable-next-line no-unused-expressions
      tip.offsetWidth; // reflow so the class flip animates
      tip.classList.add('is-on');
    };

    // 1.6.2 — THE PILL FADES OUT ("add fadeout animation for tooltips"): the
    // old hideNow flipped is-on off and set display:none in the same breath —
    // the transition never played, the pill BLINKED out. The class flip now
    // lets the 0.12s transition carry the exit (the pill sinks its 2px and
    // dissolves), and display:none lands only after the flight (180ms — the
    // transition's whole breath plus a frame of grace).
    // THE INSTANT EXCEPTION: `instant` keeps the old zero-breath law for the
    // cases the exit would betray — a PRESS (the 1.2.6 law: the pill must
    // read as never-appeared so a drag strip under it stays grabbable), a
    // hidden page, a tooltips-off flip, and the teardown (nobody is left to
    // see a goodbye). Every natural hide — the pointer leaving, Escape, a
    // target swap, a stale ground-truth dismissal — speaks the fade.
    const hideNow = (instant = false) => {
      clearTimers();
      stopObserving();
      tip.classList.remove('is-on');
      if (hideFlightTimer) {
        clearTimeout(hideFlightTimer);
        hideFlightTimer = 0;
      }
      if (instant) {
        tip.style.display = 'none';
      } else {
        hideFlightTimer = setTimeout(() => {
          hideFlightTimer = 0;
          tip.style.display = 'none';
        }, 180);
      }
      current = null;
      pinX = null; // 1.2.4 — the pin dies with the pill; the next hover pins fresh
    };

    // The anchor candidate under a pointer/focus event. Titles are stashed
    // the moment they appear, so this reads the stash; a raw title still on
    // the nearest hit is a race window (React committed between stripper
    // callbacks) — lift it on the spot.
    // 1.0.8 — THE NAME MARK ("only 2 lines are dedicated to the name of the
    // card or the versions and so on"): an anchor marked data-gd-tip-name is
    // a NAME-LABEL tooltip (card / class / version / tag names) — its pill
    // paints with .is-name and clamps at two lines. Every other tooltip
    // (pin, expand, instructions, help) wraps free, however many lines its
    // sentence needs. The marker rides the element itself or any ancestor
    // the title bubbles up from.
    const anchorFor = (target) => {
      if (!target || typeof target.closest !== 'function') return null;
      const el = target.closest('[title], [data-gd-tip-src]');
      if (!el) return null;
      liftTitle(el);
      const text = String(el.dataset.gdTipSrc || '').trim();
      if (!text) return null;
      let isName = false;
      try {
        isName = !!(el.closest && el.closest('[data-gd-tip-name]'));
      } catch {
        isName = false;
      }
      return { el, text, isName };
    };

    const scheduleShow = (el, text, isName) => {
      clearTimers();
      current = { el, text, isName };
      pinX = null; // a fresh hover pins fresh (the entry cursor's x)
      startObserving(el);
      showTimer = setTimeout(paint, SHOW_DELAY);
    };

    const onOver = (e) => {
      if (!enabled) return;
      // 0.38.0 — the over event seeds the cursor position so the very first
      // paint (before any move) still centers on the pointer, not the box.
      if (Number.isFinite(e?.clientX)) cursorX = e.clientX;
      if (Number.isFinite(e?.clientY)) cursorY = e.clientY;
      const hit = anchorFor(e.target);
      if (!hit) {
        // 1.0.0 — GROUND TRUTH: the pointer just arrived on an untitled
        // element; if it is provably OFF the current anchor, whatever we are
        // showing is stale (the reactivation refocus, a layout shift under a
        // resting pointer…). End it instead of waiting for a pointerout that
        // may never come.
        if (current && pointerOffAnchor()) hideNow();
        return;
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = 0;
      }
      if (current && current.el === hit.el) return; // already tracking
      if (current) hideNow(); // switched targets — swap cleanly
      scheduleShow(hit.el, hit.text, hit.isName);
    };

    const onOut = (e) => {
      if (!current) return;
      const el = current.el;
      if (e.relatedTarget && el.contains(e.relatedTarget)) return; // still inside
      clearTimers();
      hideTimer = setTimeout(hideNow, HIDE_GRACE);
    };

    const onFocusIn = (e) => {
      if (!enabled) return;
      // 1.0.0 — THE REACTIVATION WINDOW: Chromium refocuses the window's
      // saved element when the window returns — that focusin is the OS, not
      // the user, and its anchor is usually NOT under the pointer. A pill
      // painted from it could never dismiss (no pointerout fires for an
      // element the pointer was never inside) — the "stuck on screen after
      // minimizing / switching apps" report. Real hovers and real clicks
      // still show: their pointerover path paints on its own schedule.
      if (reactivatedAt && Date.now() - reactivatedAt < REACTIVATION_GUARD) return;
      // 1.2.6 — the press guard: a key's click focuses it the same tick the
      // press dismissed the pill — that focusin is the click, not a hover.
      if (suppressFocusUntil && Date.now() < suppressFocusUntil) return;
      const hit = anchorFor(e.target);
      if (!hit) return;
      clearTimers();
      if (current) hideNow();
      current = { el: hit.el, text: hit.text, isName: hit.isName };
      pinX = null; // pins the anchor's own center-x on its first paint
      startObserving(hit.el);
      paint();
    };

    // 1.2.6 — A PRESS ENDS THE PILL, INSTANTLY ("when i hover over the top
    // toolbar, then the tooltip shows, when i hold and drag it doesnt drag
    // the screen, but if the tooltip doesnt appear it moves normally"): the
    // pill is a hover aid — the moment the user PRESSES anything it has
    // done its job, and a pill floating over a drag strip can only be in
    // the way (in Electron the app-region walk subtracts its box from the
    // strip's drag region, pointer-events: none notwithstanding — so a
    // visible pill over the bar made that spot un-grabbable). The pill now
    // vanishes on ANY pointerdown, and a short guard keeps the click's own
    // focusin (Chromium refocuses the pressed key) from re-painting it —
    // the press reads exactly like a tooltip that never appeared, and the
    // drag proceeds on a clean bar.
    const onPress = () => {
      suppressFocusUntil = Date.now() + 350;
      // instant — the 1.2.6 law keeps its whole voice (see hideNow's note)
      if (current) hideNow(true);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') hideNow();
    };

    // 1.2.4 — SCROLL IS GROUND TRUTH, NOT A LEASH: the pill never chases
    // the anchor anymore — a scroll either proves the pointer is no longer
    // over the anchor (the anchor slid, the pointer stayed: END the pill)
    // or it doesn't touch the anchor at all (the pill stays exactly where
    // it pinned). The 0.30.0 follow setting rode this path; the follow is
    // gone and the setting with it.
    const onScroll = () => {
      if (!current) return;
      if (pointerOffAnchor()) hideNow();
    };

    // Focus LOST ends the pill immediately (the keyboard twin of
    // pointerout): if focus simply moved to another titled element, its
    // focusin swaps the pill over before this ever matters.
    const onFocusOut = () => {
      if (current) hideNow();
    };

    // Pointer motion over the anchor is GROUND TRUTH ONLY (1.2.4): the
    // track decides whether the pointer is still on the anchor — moving
    // within the anchor never moves the pill (it stays pinned at its hover
    // point until the hover ends), and any move that provably leaves the
    // anchor ends it. Nothing stale survives the first real mouse move.
    const onMove = (e) => {
      if (Number.isFinite(e?.clientX)) cursorX = e.clientX;
      if (Number.isFinite(e?.clientY)) cursorY = e.clientY;
      if (current && pointerOffAnchor()) hideNow();
    };

    // The window losing focus ends the hover — nothing tracks a pointer
    // that left the app. 1.0.0 — the cursor track goes with it: until a real
    // pointer event arrives we do not know where the pointer is, and no
    // post-return decision may lean on the stale coordinates.
    const onBlur = () => {
      if (current) hideNow();
      cursorX = null;
      cursorY = null;
    };

    // 1.0.0 — LEAVE CLEAN, even when Electron's minimize skips blur: the
    // page going hidden (minimize, occlusion) ends the pill all the same.
    const onVisibility = () => {
      if (document.hidden) {
        if (current) hideNow(true);
        cursorX = null;
        cursorY = null;
      }
    };

    // 1.0.0 — RETURN CLEAN: the window regained focus — end anything still
    // visible and arm the reactivation window (see onFocusIn). A genuine
    // hover after the return repaints through its own pointerover path.
    const onWinFocus = () => {
      reactivatedAt = Date.now();
      if (current) hideNow();
    };

    // 0.29.0 — the ON/OFF mode. App announces the setting; OFF means paint
    // nothing (and drop anything currently visible) while titles stay
    // stripped, so the native boxes never come back either.
    const onMode = (e) => {
      enabled = e?.detail?.on !== false;
      if (!enabled) hideNow(true);
      else if (current) paint();
    };
    document.addEventListener('gd-tooltips-mode', onMode);

    document.addEventListener('pointerover', onOver, true);
    document.addEventListener('pointerout', onOut, true);
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerdown', onPress, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onWinFocus);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKey, true);

    return () => {
      hideNow(true);
      if (stripper) stripper.disconnect();
      document.removeEventListener('gd-tooltips-mode', onMode);
      tip.remove();
      document.removeEventListener('pointerover', onOver, true);
      document.removeEventListener('pointerout', onOut, true);
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerdown', onPress, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onWinFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  return null;
}
