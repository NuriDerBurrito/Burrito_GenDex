// 0.35.0 — THE GLOBAL FEEDBACK LAYER, part one: the EMITTER.
// "make the feedback noticifications like the clipboard paste one visible
// even when in other windows, and make it so its feedback on others like
// creating a class or characters or deleting or saving or auto saving
// etc". The app's action feedback used to live in ONE place — the
// titlebar's status text — which is tiny, easy to miss, and (since the
// 0.34.0 lockout) DIMMED AND INERT whenever any window is open: create a
// class from inside a flow, save while the settings window is up, paste
// from the image manager — the verdict printed into a bar the app itself
// had darkened. The fix is a window-event bus: any code anywhere (App,
// the stage, the manager, a future modal) fires gdToast(text, kind), and
// the ToastHub (components/ToastHub.jsx) catches it and paints the pill
// stack at the very top of the screen, ABOVE every window.
//
// The event rides window's OWN CustomEvent constructor (the house law
// from 0.34.0's popover sweep: a bare global Event is a different realm's
// class in non-browser harnesses and dispatch rejects outright). Under a
// server render (renderToString snapshots in the test harness) there is
// no window at all — the call is simply a no-op.

export const TOAST_EVENT = 'gd-toast';

// Toast kinds: 'ok' (the accent tone — the default verdict), 'fail' (the
// red tone — something didn't land), 'info' (the ink tone — neutral
// chatter). 'quiet' never reaches this layer (setStatusTransient uses it
// to mean "titlebar only, no pill").
export function gdToast(text, kind = 'ok') {
  if (typeof window === 'undefined' || !window.CustomEvent) return; // server render — nothing to paint
  window.dispatchEvent(
    new window.CustomEvent(TOAST_EVENT, {
      detail: { id: Date.now() + Math.random(), text: String(text ?? ''), kind: kind || 'ok' },
    })
  );
}
