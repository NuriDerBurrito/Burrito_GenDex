import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
// Modal card. HOUSE RULE (0.7.0): action footers (CANCEL / DONE …) are PINNED —
// they live in their own flex row under the scroll area, so they are ALWAYS
// visible no matter how deep the content scrolls. The card is a flex column:
// header (fixed) -> scrollable body -> footer (fixed). Height is measured
// (body natural height + header + footer) and tweened via CSS, so window
// resizes never squish text; when the viewport is too short the BODY alone
// scrolls — the buttons never disappear.
// 0.26.0 — `measureRef`: when a caller builds its OWN scrolling layout inside
// the body (the settings window: the rail stays put and only the content
// column scrolls), the natural-height measurement must read the INNER
// flowing content, not the height-pinned shell — otherwise the card's height
// would freeze at its first value and never shrink again. Callers pass a ref
// to the natural-flow node; Modal measures (and observes) that instead of
// its own padded wrapper.
// 0.34.0 — RENDERED THROUGH A PORTAL AT document.body. The window used to
// mount wherever its caller sat in the React tree, and a `position: fixed`
// child is only fixed RELATIVE TO THE VIEWPORT while no ancestor paints a
// transform / filter / containment — the character view's composited sticky
// header (gd-char-head, translateZ(0)) is exactly such an ancestor, so the
// stamp rename window opened from the stamp row inside it anchored to the
// HEADER's box instead of the screen and hung off the top-right corner
// ("the window to rename and edit the stamp is broken and shows at the top
// right corner instead of middle as if its occupying the right panel top
// header"). Portaling every window to the body makes the centering
// ancestor-proof — no caller can ever sit under a transforming parent again.
// 0.34.0 — the card also never outgrew a narrow window (fixed w-[Nnn] widths
// simply clipped offscreen); .gd-modal-card now caps itself at the viewport
// minus the modal's own padding (index.css), so every window fits whatever
// it's shown in.
// 0.36.0 — RISE, DON'T SCROLL ("if its gonna clip at the bottom to move the
// window up until it wont actually clip"): a window whose content is taller
// than the CENTERED budget stops centering and TOP-ALIGNS instead, growing to
// its natural height under the titlebar — the body scrollbar only appears
// when the content is taller than even the top-aligned budget. Centering
// stays the look whenever the content fits it (the vast majority of windows).
export default function Modal({
  title,
  onClose,
  children,
  width = 'w-[470px]',
  subheader = null,
  footer = null,
  bodyClassName,
  measureRef = null,
  // 1.0.6 — THE UNSAVED-CHANGES GUARD ("when closing the tag manager tab
  // while a creation isnt saved, ask for confirmation … it seems to be a
  // problem in general where closing a window with unsaved changes should
  // warn about it and when its confirmed to close it shouldnt apply said
  // changes"): pass `confirmClose` (true, or {title, message, confirmLabel})
  // while the window holds a DRAFT that has not been committed. The three
  // ACCIDENTAL close gestures — the header ✕, Escape, the backdrop tap —
  // then ask first; confirming CLOSES WITHOUT APPLYING (the draft dies in
  // local state, nothing is written), cancelling keeps the window open.
  // The footer's own explicit keys (CANCEL / DONE / CREATE) stay direct:
  // a labeled button is intent, not an accident. Windows whose edits apply
  // instantly (settings, stamp add/remove on a card) pass nothing — there
  // is never a pending draft to defend.
  confirmClose = null,
  // 1.1.2 — THE CLOSE LOCK ("dont allow me to close the card creation
  // window if i have tag manager open"): while true, every accidental
  // close gesture (the header ✕, Escape, the backdrop tap) is INERT — not
  // guarded, not asked, simply ignored. For windows that sit UNDER another
  // window (the creation window under the tag manager): the top window owns
  // the Escape, and closing the one beneath it mid-work would lose the
  // draft through a side door. The footer's explicit keys stay direct — a
  // labeled button is intent, and the lock is lifted by the parent the
  // moment the window above closes.
  closeLocked = false,
  // 0.42.0 — POSITION PIN (the creation window's image-area resize): while
  // true the card FREEZES exactly where it sits (top edge captured at pin
  // start, height transition off) and the content keeps flowing LIVE
  // underneath — the grid's cap drag shrinks/grows the images area and
  // everything below it (the stamps, the gallery) rides along in real time,
  // while the window itself stays stone-still under the cursor. The old
  // 0.41 reserve held a fake four-row height instead, which parked the
  // stamp section at a fixed distance through the whole drag and snapped it
  // home only on release ("its not following the resizing dynamically …
  // only when i let go is when it snaps back"). Unpinning re-centers.
  pinned = false,
  // 1.5.4 — THE PREWARM SEAT ("the new card window is still quite delayed,
  // fix that"): while true the window is a GHOST — fully built (the whole
  // tree mounted, measured and warm) but never seen: the layer paints
  // visibility:hidden with no pointer, the entrance is skipped outright
  // (initial={false} — the card stands at its final seat), the coats-freeze
  // counter and the Escape listener never arm, and every close gesture is
  // inert. The creation window mounts one of these a beat after the app
  // settles (App's prewarm seat) so the FIRST real open of a session skips
  // the tree's cold-build cost — the click lands on a warm path.
  parked = false,
  // 1.5.4 — THE RETAINED FLIGHT ("the new card window is still quite
  // delayed, fix that"): a seat that never unmounts opens and closes
  // through CSS, not through mount — framer's initial/animate/exit never
  // arm (the layer and card render as PLAIN divs), and .gd-modal-flight /
  // .is-open own the fade + rise both directions (the 1.4.9 entrance law,
  // restated in CSS: a pure fade + a 10px rise, never a scale). Paired with
  // `parked` (= NOT live): while parked the whole window is inert — no
  // Escape, no freeze count, no pointer — and the CSS holds it hidden after
  // the close's fade lands. The creation window rides this seat (App's
  // retained NewCharacterModal): one tree, built once, warm forever.
  flight = false,
  // 1.5.5 — THE HEADLESS WINDOW: while true the header's ✕ is not rendered
  // at all. The legal GATE (LegalModal) is close-locked — every accidental
  // gesture is inert — but an inert ✕ sitting in the corner reads as a
  // broken door, not a locked one: the gate removes the key entirely so the
  // only roads out are its two labeled feet. No other window passes this.
  hideClose = false,
  // 1.5.7 — THE BODY FOLLOWS THE PAGE (the legal window's reader): when a
  // caller swaps the content it shows (the gate's cards -> a document ->
  // back), the body scroller must not keep the LAST page's scroll seat —
  // opening the privacy document from the middle of the terms would land
  // the reader already scrolled. Pass any value that changes exactly when
  // the page changes (LegalModal passes `page`); the scroller seats itself
  // back at the top in a pre-paint layout effect. Null (the default) never
  // resets — windows with one flowing page keep their scroll through
  // re-renders, exactly as before.
  scrollResetKey = null,
  // 1.5.8 — THE TALL POSTURE ("expand the window vertically when opening
  // them (it works in about section, but not on startup)"): while a number,
  // the card's HEIGHT answers THIS seat instead of its measured content —
  // clamped to the top-aligned budget, kept CENTERED whenever it fits the
  // centered budget — and the body alone scrolls whatever the content
  // pours past it. The legal gate's document pages speak it (72vh): the
  // gate mounts compact (the two cards face), and opening a document now
  // grows the window DOWNWARD AND UPWARD from its centered seat while the
  // width tween runs beside it — the same growth the About reader was
  // already born with, finally spoken at startup too. The measured-height
  // law stays untouched for every window that passes nothing (the default):
  // natural height, centered while it fits, top-aligned when tall.
  tallPosture = null,
  // 1.7.2 — THE WINDOW WEARS THE CONTAINER'S COLOR ("prompt/note editor
  // window entirely should fit into the color picked, not just the
  // container, that includes the window, the title, and so on"): pass the
  // part's face vars (--part-color + partContainerFace's --part-face /
  // --part-ink / --part-well) and the whole card takes the tint — the
  // window's ground becomes the FACE, the header's band follows it, the
  // title + subheader speak the face's ink, and the stage inside reads
  // the WELL (one depth deeper, the same neumorphic ladder the row
  // speaks). Null (every other window) keeps the theme's own chrome,
  // byte-for-byte.
  tint = null,
  // 1.7.3 — THE OVER-VIEWER LANE ("image manager should open on it, dont
  // close the big image preview then open image manager"): while true the
  // layer carries .is-over-viewer — the z 920 lane above the huge image
  // viewer's z 900 veil (see .gd-modal-layer.is-over-viewer in index.css),
  // so the manager mounts ON TOP of a still-open big preview instead of
  // replacing it. The Escape seat below reads the same flag: a modal on
  // the lane keeps its own answer while the viewer yields; a modal UNDER
  // the viewer (the 0.41.0 slot-click flow) lets the viewer answer alone.
  // False (every other window) keeps the classic 200 lane and the classic
  // Escape law, byte-for-byte.
  overViewer = false,
  // 1.7.4 — THE OVER-ALL LANE ("when deleting an image through the image
  // manager window (and while also inside the huge image preview), the
  // confirmation window should be above the windows not below it"): while
  // true the layer carries .is-over-all — the z 960 lane above EVERY
  // window (the viewer's 900 veil, the over-viewer manager's 920, the
  // tooltips' 940 and the context menus' 950 — see
  // .gd-modal-layer.is-over-all in index.css). The delete ask born under
  // the manager-on-the-viewer stack rides here: a blocking question sits
  // above every window it was born from. Its Escape keeps its own answer
  // the over-viewer lane's own way (a confirm's capture-phase listener
  // already isolates it; this flag only keeps Modal's own listener from
  // yielding to a viewer mounted beneath).
  overAll = false,
}) {
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const innerRef = useRef(null);
  const cardRef = useRef(null);
  const [chromeH, setChromeH] = useState(null); // header + footer natural height
  const [contentH, setContentH] = useState(null); // body natural height
  // 0.42.0 — the frozen top offset while pinned (viewport px, captured once
  // at pin start so the card never re-centers mid-drag).
  const [pinTop, setPinTop] = useState(null);
  // 1.0.7 — THE ENTRANCE SETTLE ("when opening settings, sometimes the
  // window would vanish and reappear or would bug/glitch as it pops in"):
  // the card's height is MEASURED, and measurements keep arriving after
  // the pop-in (fonts finishing their load, the ResizeObserver's first
  // callback, images decoding) — each late correction used to TWEEN the
  // 0.2s height transition while the entrance scale was still playing,
  // and the two clocks fighting read as a glitch. For the first 300ms of
  // the window's life the height transition is OFF: corrections land
  // instantly, under the entrance's own opacity ramp, invisible. Once the
  // window has settled, later height changes (tab swaps, resizes) keep
  // their tween, exactly as before. (1.4.8 — 300 -> 240ms: the entrance
  // itself quickened, and the settle window shortens with it.)
  const [settling, setSettling] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSettling(false), 240);
    return () => clearTimeout(t);
  }, []);
  // 1.5.7 — EVERY OPEN OF A RETAINED-FLIGHT WINDOW RE-ARMS THE SETTLE
  // ("the new card creation window still pops up after a delay, fix that"):
  // the seat never unmounts, so its body keeps the LAST draft's layout
  // while it sits parked — and the 0.2s height transition that is a virtue
  // on a live window (tab swaps, resizes) was a VISIBLE RESIZE on every
  // open: the fresh draft's RESET re-seeds the fields, the measurements
  // land a frame later, and the card tweened from the old draft's height to
  // the new one right through the entrance — the window read as arriving
  // late AND resizing under the fade (the exact "starts from small size
  // then resize" the 1.4.9 entrance law retired for fresh mounts). Each
  // open now re-arms the same 240ms settle window a cold mount speaks: the
  // re-measure lands instantly, under the entrance's own opacity ramp, and
  // the card stands at its TRUE size on the first frame of the flight.
  // Later height changes (typing, the grid cap grip) keep their tween.
  const flightOpened = flight && !parked;
  // 1.5.8 — THE RE-ARM MOVED PRE-PAINT (the same report: "the new card
  // window still pops up after a delay, fix that"): the 1.5.7 re-arm rode
  // a passive effect, which lands AFTER the open's first paint — the
  // ResizeObserver's fresh measurement could beat it to the commit and
  // TWEEN the height change right through the entrance's first frames
  // (a quarter-second of visible resize the eye reads as the window
  // ARRIVING LATE). The layout-effect seat re-arms settling BEFORE the
  // open ever paints: the re-measure lands instantly, under the fade,
  // on every open — the exact law the cold mount's own settle speaks.
  useLayoutEffect(() => {
    if (!flightOpened) return undefined;
    setSettling(true);
    const t = setTimeout(() => setSettling(false), 240);
    return () => clearTimeout(t);
  }, [flightOpened]);

  useLayoutEffect(() => {
    if (!pinned) {
      setPinTop(null);
      return undefined;
    }
    const card = cardRef.current;
    if (card && typeof card.getBoundingClientRect === 'function') {
      setPinTop(Math.max(0, Math.round(card.getBoundingClientRect().top)));
    }
    return undefined;
  }, [pinned]);

  // ---- 1.0.6 — the unsaved-changes ask -------------------------------
  // (Declared ABOVE the Escape listener: the listener's dependency array
  // reads `requestClose` during render, so the guarded close must exist
  // before that effect is declared — a const read one line too early is a
  // dead-zone crash, not a warning.)
  const guarded = confirmClose != null && confirmClose !== false;
  const askCfg = confirmClose === true || confirmClose == null ? {} : confirmClose;
  const [askOpen, setAskOpen] = useState(false);
  // 1.6.2 — THE LOCKOUT LEAVES WITH THE FAREWELL'S FIRST FRAME ("when
  // closing settings, the top toolbar gets activated later, fix that so
  // its activated as the settings menu closes"): the any-window watcher
  // asks the DOM one question — does [data-gd-modal] exist? — and a
  // FRAMER seat kept answering YES through its whole ~130ms exit flight
  // (the element only unmounts when the animation completes), so the
  // toolbar stayed grey and inert for a visible beat AFTER the window
  // was already gone from the eye (and every click on the settings key
  // in that window landed on a locked bar — the "opens after a bit of
  // clicking" feel). The layer now strips its own marker the moment ANY
  // close begins: the accidental gestures (✕ / Escape / backdrop / the
  // ask's discard) strip it in the same breath they call onClose, and
  // the framer seats strip it on the exit animation's own FIRST frame
  // (an opacity-toward-0 start on the layer can only be a farewell —
  // every entrance animates to 1) — so the toolbar wakes as the window
  // begins its goodbye, never a breath after it ends. Stacked seats stay
  // honest: only the closing window's own marker leaves; any window
  // still live beneath keeps its own, and the watcher keeps its word.
  const layerElRef = useRef(null);
  const beginFarewell = () => {
    const el = layerElRef.current;
    if (el && typeof el.removeAttribute === 'function') el.removeAttribute('data-gd-modal');
  };
  // the ask layer's own marker seat (its farewell strips it — see the
  // onAnimationStart law on the ask's motion.div below).
  const askLayerElRef = useRef(null);
  // Every accidental close gesture routes through here. While the guard is
  // armed and a draft is pending, the first ✕ / Escape / backdrop tap opens
  // the ask INSTEAD of closing; confirming is the only road to onClose, and
  // it carries no commit — whatever the window was building dies unapplied.
  // 1.1.2 — and while closeLocked the door simply does not exist: the
  // gesture swallows (the window above stays the only thing that moves).
  const requestClose = () => {
    if (parked || closeLocked) return;
    if (guarded && !askOpen) {
      setAskOpen(true);
      return;
    }
    beginFarewell();
    onClose?.();
  };
  const confirmDiscard = () => {
    setAskOpen(false);
    beginFarewell();
    onClose?.();
  };

  useEffect(() => {
    // 1.5.4 — a parked window never hears the keys: a live window's Escape
    // must stay the ONLY voice (a parked listener would close whatever the
    // user actually has open).
    // 1.7.3 — ESCAPE ANSWERS THE TOPMOST LAYER (the over-viewer lane's own
    // law): the manager can now ride ABOVE the huge image viewer while it
    // stays mounted beneath — and the 0.41.0 flow seats the viewer ABOVE a
    // manager that was already open. Two window-level Escape listeners
    // used to fire together and BOTH windows folded on one press. The
    // rule is spoken per layer now: while the viewer is mounted, a modal
    // NOT riding the over-viewer lane lets the VIEWER answer alone (it is
    // the topmost voice — the manager underneath keeps its seat); a modal
    // ON the lane keeps its own answer (ImageViewer's listener yields the
    // other way, asking the DOM for .gd-modal-layer.is-over-viewer).
    if (parked) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (!overViewer && !overAll && typeof document !== 'undefined' && document.querySelector('.gd-imgview')) return;
        requestClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestClose, askOpen, guarded, parked, overViewer, overAll]);

  // First measurement synchronously, before paint; then keep it live. With a
  // measureRef the BODY's natural height reads from the caller's inner
  // natural-flow node (the shell may be height-pinned — see the 0.26.0 note
  // above).
  // 0.27.0 — TRANSITION-GAP GUARD: callers that swap tabs under
  // AnimatePresence hit a frame where the measured node is EMPTY (the old
  // tab left, the new one hasn't mounted) — offsetHeight reads ~0 and the
  // card would collapse to its chrome for one frame before the real panel
  // lands. Sub-floor measurements are simply skipped: the card keeps the
  // previous tab's height through the gap and snaps to the new one when the
  // content is real.
  const measure = () => {
    setChromeH((headerRef.current?.offsetHeight || 0) + (footerRef.current?.offsetHeight || 0));
    const target = measureRef || innerRef;
    const h = target.current?.offsetHeight ?? null;
    setContentH((prev) => (h != null && h < 60 ? prev : h));
  };
  useLayoutEffect(measure, []);
  // 1.5.7 — the page-follow scroll reset (see the scrollResetKey prop): the
  // BODY's own scroller is the only scroll container in the card, so the
  // reset seats it directly — pre-paint, so the new page never paints at
  // the old page's offset.
  const scrollRef = useRef(null);
  useLayoutEffect(() => {
    if (scrollResetKey == null) return;
    if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
      scrollRef.current.scrollTo({ top: 0 });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [scrollResetKey]);
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    if (measureRef?.current) ro.observe(measureRef.current);
    else if (innerRef.current) ro.observe(innerRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);

  // 0.36.0 — TWO BUDGETS: the centered one (content + chrome + the outer
  // padding the centered card needs below it) and the top-aligned one
  // (the card rides the top of the viewport). Fits the centered budget →
  // centered, natural height. Taller → top-align and keep growing to
  // natural height. Taller than even that → the body alone scrolls (the
  // footer stays pinned, per the house rule above).
  // 1.4.7 — the top-aligned budget gains its "slightly" (the edit-card
  // window's aspect container + the pt-6 seat above): vh-76 → vh-56.
  // 1.5.8 — AND THE SEAT ITSELF MOVES BELOW THE BAR ("the top bar … clips
  // above the windows cutting them from top, fix that so it doesnt clip
  // above the windows"): the top-aligned card used to ride pt-6 — 24px,
  // which is 16px INSIDE the 40px titlebar band, and the bar (z 400 over
  // the modal layer's 200) painted its ground straight across the card's
  // header: every tall window (settings, card creation, the readers) read
  // as shorn from the top. The seat speaks pt-12 now (48px, clear of the
  // bar) and the budget pays for it honestly (vh-56 → vh-72), so a tall
  // window STARTS below the bar instead of under it. The bar keeps its
  // own law untouched: it still rides above the scrim (the min / max /
  // close keys stay lit through any blackout — "its still fine to still
  // negate the blackout"), and a centered window still centers (it never
  // touched the band to begin with).
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
  const centeredBudget = Math.max(220, vh - 108);
  const topBudget = Math.max(240, vh - 72);
  const naturalH = contentH != null && chromeH != null ? contentH + chromeH : null;
  // 1.5.8 — the tall posture's own arithmetic: the height ANSWERS the
  // posture (clamped to the top budget), and the seat stays CENTERED
  // whenever that height fits the centered budget — the growth plays from
  // the card's own middle, no seat flip mid-tween (see the tallPosture
  // prop's note above).
  const tallH = tallPosture != null ? Math.max(240, Math.min(Math.round(tallPosture), topBudget)) : null;
  const fitsCentered = tallH != null ? tallH <= centeredBudget : naturalH == null || naturalH <= centeredBudget;
  const targetH = tallH != null ? tallH : naturalH != null ? Math.min(naturalH, topBudget) : null;

  // 0.34.0 — THE LAZY PORTAL TARGET (kept, 1.0.7): the portal mounts in a
  // LAYOUT EFFECT (client-only), so a server-render pass (the test
  // harness's renderToString snapshots — createPortal throws under the
  // server renderer, jsdom or not) renders the window INLINE, while every
  // real client render (Electron, jsdom's createRoot) promotes the card to
  // document.body BEFORE PAINT — the layout-effect update re-renders
  // synchronously, so only the promoted card ever reaches the screen: one
  // visible mount, one entrance, ancestor-proof either way.
  // 1.3.0 — the flicker the windows sometimes showed at the entrance's end
  // is NOT this promotion (it lands before paint): it was framer dropping
  // the card's composited layer when the entrance completes — the stable
  // compositing now rides .gd-modal-card / .gd-modal-layer in index.css
  // (one layer at open, the same layer at close, nothing to rebuild when
  // the animation ends).
  const [portalTo, setPortalTo] = useState(null);
  useLayoutEffect(() => {
    setPortalTo((prev) => prev || (typeof document !== 'undefined' && document.body ? document.body : prev));
  }, []);

  // 1.4.1 — THE COATS HOLD THEIR BREATH WHILE A WINDOW COVERS THE APP (the
  // settings lag report: "the settings right now is very slow/laggy for
  // some reason, fix that also"): every modal mounts a full-screen layer
  // over the whole app, and the shader coats behind it kept animating
  // (conic turns, hue filters, drifting tiles — constant raster work for
  // every mounted card) while the window's own interactions fought them
  // for the frame budget. The root carries .gd-coats-frozen while ANY
  // modal layer is live: the coats inside the covered regions pause (see
  // the freeze law in index.css), the modal's OWN previews keep
  // breathing. Reference-counted through the root's own dataset counter,
  // so stacked windows (an ask over a modal) never strip it early.
  useEffect(() => {
    // 1.5.4 — a parked window counts as NO window: the counter is the thing
    // that freezes every finish clock in the app, and a ghost warming in the
    // background must never still the coats the user is actually watching.
    if (parked || typeof document === 'undefined' || !document.documentElement) return undefined;
    const root = document.documentElement;
    const n = Number(root.dataset.gdModals || '0') + 1;
    root.dataset.gdModals = String(n);
    if (n === 1) root.classList.add('gd-coats-frozen');
    return () => {
      const m = Number(root.dataset.gdModals || '1') - 1;
      if (m > 0) root.dataset.gdModals = String(m);
      else {
        delete root.dataset.gdModals;
        root.classList.remove('gd-coats-frozen');
      }
    };
  }, [parked]);

  // ESCAPE ISOLATION while the ask is up (the ConfirmModal law, Dialogs.jsx):
  // a capture-phase stop keeps this Escape to the ask alone — the window
  // underneath must not ALSO hear it and close beneath the question.
  useEffect(() => {
    if (!askOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setAskOpen(false);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [askOpen]);

  // 1.6.0 — THE SETTLE SNAPS ITS SIZE, NEVER ITS FLIGHT (the close report:
  // "when i close a window with unsaved progress, it doesnt play its closing
  // animation"): the settle/pin override used to speak a blanket
  // transition:none — but the flight card's opacity/scale clocks LIVE in the
  // same transition shorthand (CSS-owned on the retained seat), so the
  // override silently killed the card's fade-pop on every open inside the
  // settle window and the fade-out on any close that landed inside one —
  // the guarded close (ask -> discard) after a quick open was exactly such a
  // close, and the window blinked out under the scrim's own subtle 0.1s.
  // The override now retires ONLY the size tween it was born for: height and
  // width snap to their corrections instantly while opacity/transform keep
  // speaking the house clocks. (Framer seats are untouched — their
  // opacity/scale are JS-animated and never rode the CSS transition.)
  const settleSnap = pinned || settling ? { transition: 'height 0s ease, width 0s ease' } : null;
  const askLayer = (
    /* 1.6.0 — THE ASK SPEAKS THE HOUSE LANGUAGE (the same report): the
       unsaved-changes card was the one floating surface in the app that
       popped in and out in a single frame — no entrance, no farewell — and
       the confirm-discard close read as the whole sequence snapping away.
       It rides the same pop law the windows learned in 1.5.9 (fade + a tiny
       centered scale pulse in) and the same settle they always spoke on the
       way out (fade + 6px settle), so dismissing it — KEEP EDITING, its
       backdrop, Escape, or the discard that closes the window beneath it —
       is one continuous breath with everything else on screen. */
    <AnimatePresence>
      {askOpen && (
        <motion.div
          ref={askLayerElRef}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          data-gd-modal="1"
          role="dialog"
          aria-modal="true"
          aria-label={askCfg.title || 'UNSAVED CHANGES'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          /* 1.6.2 — the ask's own farewell strips ITS lockout marker on the
             exit's first frame (beginFarewell's ask twin — see its note):
             while a question floats the window beneath keeps its own marker
             and the bar stays honestly locked; the discard closes BOTH and
             each marker leaves with its own goodbye's first frame. */
          onAnimationStart={(def) => {
            if (def && def.opacity === 0) {
              const el = askLayerElRef.current;
              if (el && typeof el.removeAttribute === 'function') el.removeAttribute('data-gd-modal');
            }
          }}
        >
          <div
            className="absolute inset-0 bg-black/70"
            onMouseDown={(e) => {
              e.stopPropagation();
              setAskOpen(false);
            }}
          />
          <motion.div
            className="gd-card gd-modal-ask relative flex flex-col w-[410px]"
            initial={{ opacity: 0, scale: 0.965 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
          >
            <div className="gd-hairline-b px-4 pt-3 pb-3" style={{ background: 'var(--gd-panel)' }}>
              <div className="gd-rule">{askCfg.title || 'UNSAVED CHANGES'}</div>
            </div>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[12px] leading-relaxed text-gd-chrome">
                {askCfg.message ||
                  'This window has changes that have not been applied yet. Close it and discard them?'}
              </p>
            </div>
            <div className="px-4 pt-3 pb-3 flex justify-end gap-2" style={{ background: 'var(--gd-panel)' }}>
              <button className="gd-btn" onClick={() => setAskOpen(false)} title="Keep the window open: nothing is lost">
                KEEP EDITING
              </button>
              <button className="gd-btn gd-btn-danger" onClick={confirmDiscard} title="Close the window: the pending changes are NOT applied">
                {askCfg.confirmLabel || 'CLOSE: DISCARD'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 1.5.4 — under the retained flight the layer + card are PLAIN divs:
  // framer would write inline opacity/transform for its own flights and
  // those inline styles would out-rank the CSS classes that own the
  // retained seat's open/close fade.
  const LayerTag = flight ? 'div' : motion.div;
  const CardTag = flight ? 'div' : motion.div;
  const card = (
    <LayerTag
      ref={layerElRef}
      className={clsx(
        'fixed inset-0 z-[200] flex justify-center p-6 gd-modal-layer',
        // 1.7.3 — the over-viewer lane (see the prop's note): the layer
        // rises to z 920 (above the big image viewer's 900 veil, under the
        // context menus / tooltips / toasts) — the CSS law owns the rung,
        // the class only marks the seat.
        overViewer && 'is-over-viewer',
        // 1.7.4 — the over-all lane (see the prop's note): the ask above
        // every window — the CSS law owns the rung, the class only marks
        // the seat.
        overAll && 'is-over-all',
        // 1.5.4 — the parked seat: built, measured, invisible (see the prop).
        parked && !flight && 'gd-modal-parked',
        // 1.5.4 — the retained flight: CSS owns the fade both ways.
        flight && 'gd-modal-flight',
        flight && !parked && 'is-open',
        // 0.42.0 — pinned: top-aligned at the captured offset (the card's
        // absolute seat on screen), never re-centered while the drag runs —
        // the pinned seat keeps the classic pt-10 breathing room so a pin
        // captured under it never shifts mid-drag.
        // 1.4.7 — THE TOP-ALIGNED SEAT RIDES HIGHER AND GROWS TALLER
        // ("expand card edit window vertically slightly so the aspect
        // ratio container doesnt cause a scrollwheel"): a window taller
        // than the centered budget used to top-align at pt-10 and cap at
        // vh-76 — the edit-card window's tall aspect-ratio preview paid
        // for those 40+36px of ceremony with a body scrollbar. The
        // top-aligned seat speaks pt-6 and caps at vh-56 now: the window
        // rides 16px higher and grows 20px taller before its body ever
        // scrolls (the centered look and every pinned seat keep their own
        // classic air — only the already-top-aligned tall windows gained
        // the ground).
        pinned ? 'pt-10' : fitsCentered ? 'items-center pt-10' : 'items-start pt-12'
      )}
      /* 1.5.7 — A PARKED SEAT IS NOT A WINDOW ("the top bar after i got in
         is stuck, i cant click on it and its greyed out"): the any-window
         watcher (App's MutationObserver), the image stage's auto-walk pause
         and the right-click surface logic all ask the DOM one question —
         "does [data-gd-modal] exist?" — and the retained creation seat
         answered YES from the moment it was born hidden, ~900ms after the
         database landed: the top bar locked itself grey and inert with NO
         window on screen, dropdowns swept themselves closed, and the
         auto-swipe stage never walked again for the whole session. The
         attribute now rides the layer only while the window is LIVE — a
         ghost warming in the background is furniture, not a window. (The
         ask layer keeps its own attribute: while a question floats, a
         window truly is open.) */
      data-gd-modal={parked ? undefined : '1'}
      style={pinned && pinTop != null ? { paddingTop: pinTop } : undefined}
      initial={flight || parked ? undefined : { opacity: 0 }}
      animate={flight ? undefined : { opacity: 1 }}
      exit={flight ? undefined : { opacity: 0 }}
      /* 1.6.2 — the framer seats strip the lockout marker on the exit's
         own first frame (see beginFarewell's note — the footer CANCEL/DONE
         keys close through the app's own handler, and this is the one
         breath where the farewell itself can speak): an opacity-toward-0
         start is a farewell by construction, and the marker leaves with
         it. */
      onAnimationStart={
        flight
          ? undefined
          : (def) => {
              if (def && def.opacity === 0) beginFarewell();
            }
      }
      /* 1.4.8 — THE WINDOWS QUICKEN ("windows take a while to open, such as
         edit card, or card creation window, or right panel, fix that"):
         the scrim spoke 0.14s and the card 0.16s — deliberate, heavy-door
         beats that read as WAITING once the eye learned the app. The scrim
         speaks 0.1s and the card 0.12s: still a real entrance (never a
         frame-swap), a quarter faster to the eye, the settle window
         shortened to match. */
      transition={{ duration: 0.1 }}
    >
      <div className="absolute inset-0 bg-black/60" onMouseDown={requestClose} />
      <CardTag
        ref={cardRef}
        className={clsx('gd-card gd-modal-card relative flex flex-col', width, tint && 'is-part-tinted')}
        // 0.42.0 — while pinned the measured height follows the live content
        // with NO tween (the 0.2s height transition would lag the footer a
        // fifth of a second behind the stamps riding up — a rubber-band feel).
        style={{
          ...(targetH != null ? { height: targetH } : null),
          ...settleSnap,
          // 1.7.2 — the tint vars ride the card itself (the CSS laws + the
          // header's var-reading background speak them); an untinted window
          // never carries the keys, so nothing below ever changes for it.
          ...(tint || null),
        }}
        /* 1.4.9 — THE ENTRANCE IS LIGHT, NEVER A RESIZE ("im not sure, but
           i feel like windows such as new card or edit card info start from
           small size then resize, the fade in (or pulse in, wont judge)
           should just be visually and not actually effect the elements
           inside, fix that"). 1.5.9 — AND THE RISE IS GONE TOO ("settings
           window opening animation should be a popin/fade in/ pulse in,
           not a swipe up, match the closing animation properly"): the
           entrance used to fade + RISE 10px, and on a TALL top-aligned
           window (settings, card creation) that translate read as the
           whole pane SWIPING UP into place — a directional slide the
           close never speaks (it settles DOWN a hair under its fade).
           The entrance is a POP now: a pure fade + a tiny scale pulse
           (0.965 to 1, centered — the "pulse in" the 1.4.9 report itself
           offered), no translation at all. The card still lands at its
           TRUE size on the first frame — the pulse is a transform, the
           content inside never reflows, the exit keeps its own small
           settle, and open and close finally speak the same gentle
           language. */
        initial={flight || parked ? undefined : { opacity: 0, scale: 0.965 }}
        animate={flight ? undefined : { opacity: 1, scale: 1 }}
        exit={flight ? undefined : { opacity: 0, y: 6 }}
        transition={flight ? undefined : { duration: 0.13, ease: 'easeOut' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header — its own fixed row above the scroll area. 1.7.2 — the
            band reads the FACE var with the theme's panel as its fallback:
            a tinted window's header follows the color, every other window
            keeps exactly the ground it always painted. 1.7.4 — THE BAND
            SPEAKS THE LADDER'S TITLE RUNG first (see partContainerFace):
            the header separates from the window's body by the same
            measured step the row's title field speaks — the color SHIFTS
            from the title band to the container instead of blending with
            it — and every untinted window keeps the theme's panel ground,
            byte-for-byte (the title rung only ever exists on a tinted
            card). */}
        <div ref={headerRef} className="flex-shrink-0 gd-hairline-b px-4 pt-3 pb-3" style={{ background: 'var(--part-title, var(--part-face, var(--gd-panel)))' }}>
          <div className="flex items-center gap-3">
            <div className="gd-rule flex-1">{title}</div>
            {!hideClose && (
              <button className="gd-icon-btn" title="Close" onClick={requestClose}>
                <X size={14} />
              </button>
            )}
          </div>
          {subheader && <div className="mt-3">{subheader}</div>}
        </div>

        {/* Body — the ONLY part that scrolls. overflow-x hidden: tab-swipe
            transforms must never grow a horizontal scrollbar. 1.5.7 — the
            scroller carries a ref for the page-follow reset (scrollResetKey). */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div ref={innerRef} className={clsx('p-4', bodyClassName)}>
            {children}
          </div>
        </div>

        {/* Pinned footer — always visible, even mid-scroll. 1.7.2 — the
            same face law as the header (the footer band follows a tinted
            window's color; the fallback keeps every other window's own
            ground, byte-for-byte). */}
        {footer && (
          <div
            ref={footerRef}
            className={clsx('flex-shrink-0 px-4 pt-3 pb-3 gd-hairline-t gd-modal-foot')}
            style={{ background: 'var(--part-face, var(--gd-panel))' }}
          >
            {footer}
          </div>
        )}
      </CardTag>
      {askLayer}
    </LayerTag>
  );

  return portalTo ? createPortal(card, portalTo) : card;
}
