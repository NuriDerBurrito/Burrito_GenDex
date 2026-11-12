// 1.7.5 — THE IMAGE DEATH ROW ("when undoing when i delete an image or
// something, the image comes back broken"): every delete door used to
// unlink the file from disk in the same breath it left the db — while the
// undo stack still held the record that pointed at it, so Ctrl+Z restored
// a card whose picture 404'd (the URL rebuilt perfectly; the FILE was
// gone). The row holds the filename instead: the sweep after every
// mutation / undo / redo asks ONE question — can ANY history still
// resurrect this file? (the live db, the whole undo stack, the whole redo
// stack) — and only a file no snapshot references ever reaches the unlink
// IPC. A file the row still holds when the app closes stays on disk (the
// same class of harmless orphan an undone ADD always left behind — see
// the db-wipe law's own words: "the image FILES stay on disk"): never a
// broken card, only ever a lazy sweep.
//
// The aliveness probe is registered ONCE by App (a closure over the
// history refs — stable for the app's whole life); the sweep asks it
// per-file so a pending file's walk exits at the FIRST snapshot that
// still references it (the top of the undo stack usually holds the
// just-deleted record — the common sweep is a handful of steps).

const deathRow = new Set();
// ONE probe slot, REPLACED on every registration: the newest App instance
// owns the question (a stale closure over dead history refs must never
// answer "alive" for a file the live stacks forgot).
let alivenessProbe = null;

// The delete doors call this instead of api.deleteImageFile: the file's
// fate is parked on the row until no history can resurrect it.
export function markImageDead(filename) {
  const file = String(filename || '');
  if (file) deathRow.add(file);
}

// App registers its probe: (filename) => boolean — "does any db the
// stacks hold still reference this file?". Early exit is the probe's
// own business; the row asks per-file.
export function probeImageAliveness(probe) {
  if (typeof probe === 'function') alivenessProbe = probe;
}

// Runs after every mutateDb / undo / redo — cheap when the row is empty
// (the common case), and per-file early-exit cheap while a deletion is
// still undoable.
export function sweepImageDeaths(api) {
  if (deathRow.size === 0) return;
  for (const file of [...deathRow]) {
    let alive = false;
    try {
      alive = alivenessProbe ? alivenessProbe(file) === true : false;
    } catch {
      // a dead probe never blocks a sweep — the file answers "not alive"
      // and the unlink proceeds (the probe re-registers on the next mount)
    }
    if (alive) continue;
    deathRow.delete(file);
    try {
      Promise.resolve(api?.deleteImageFile(file)).catch(() => {
        /* quiet — an unlink that failed leaves a harmless orphan */
      });
    } catch {
      /* quiet — same */
    }
  }
}
