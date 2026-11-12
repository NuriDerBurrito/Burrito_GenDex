import { useEffect } from 'react';
import Modal from './Modal.jsx';
import { stripRichText } from '../utils/helpers.js';

export function ConfirmModal({ title, message, confirmLabel = 'CONFIRM', danger = false, overAll = false, onCancel, onConfirm }) {
  // 0.42.0 — ESCAPE ISOLATION: a confirm often sits ON TOP of another window
  // (the Edit Class editor's delete confirm, stacked over the editor). Both
  // listen for Escape on window (bubble), so one press used to close BOTH —
  // which quietly broke "cancel returns to the edit class window" for anyone
  // who pressed Escape instead of the CANCEL key. A capture-phase stop keeps
  // the confirm's Escape to the confirm: only it closes, the window
  // underneath stays exactly as it was (same law the stamp window follows).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel?.();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  return (
    <Modal
      title={title}
      onClose={onCancel}
      width="w-[410px]"
      /* 1.7.4 — THE ASK RIDES ABOVE EVERY WINDOW ("when deleting an image
         through the image manager window (and while also inside the huge
         image preview), the confirmation window should be above the windows
         not below it"): the flag threads App's confirm state into Modal's
         overAll lane (z 960 — above the viewer's 900 veil, the over-viewer
         manager's 920, the tooltips and the context menus). A classic-lane
         ask keeps the classic 200 seat exactly as it always spoke it. */
      overAll={overAll}
      footer={
        <div className="flex justify-end gap-2">
          <button className="gd-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button className={danger ? 'gd-btn gd-btn-danger' : 'gd-btn gd-btn-solid'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-[12px] leading-relaxed text-gd-chrome">{message}</p>
    </Modal>
  );
}

export function ClosePromptModal({ onSave, onDiscard, onCancel }) {
  return (
    <Modal
      title="UNSAVED CHANGES"
      onClose={onCancel}
      width="w-[410px]"
      footer={
        <div className="flex justify-end gap-2">
          <button className="gd-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button className="gd-btn gd-btn-danger" onClick={onDiscard}>
            DISCARD
          </button>
          <button className="gd-btn gd-btn-solid" onClick={onSave}>
            SAVE &amp; CLOSE
          </button>
        </div>
      }
    >
      <p className="text-[12px] leading-relaxed text-gd-chrome">
        You have unsaved changes. Save before closing, or discard them. Nothing is written to disk until you
        press Ctrl+S or save on close.
      </p>
    </Modal>
  );
}

// 1.1.2 — THE LIBRARY IMPORT VERDICT ("add library import/export … let it
// also read the zip file and extract it to import the data"): the archive
// has been picked and validated (nothing written yet); this window speaks
// the counts and asks the ONE question that governs the landing — MERGE
// the archive into the current library (every colliding id re-minted, every
// colliding image file renamed, nothing local lost) or REPLACE the library
// with it (the current cards/classes/tags/stamps step aside; the image
// FILES stay on disk, exactly like RESET DATABASE). The Escape-isolation
// law rides the ConfirmModal pattern above: a press here never cascades
// into the settings window underneath.
export function ImportLibraryModal({ counts = {}, path = '', onCancel, onMerge, onReplace }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel?.();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const line = `${counts.characters ?? 0} card${counts.characters === 1 ? '' : 's'} · ${counts.classes ?? 0} class${counts.classes === 1 ? '' : 'es'} · ${counts.tags ?? 0} tag${counts.tags === 1 ? '' : 's'} · ${counts.stamps ?? 0} stamp${counts.stamps === 1 ? '' : 's'} · ${counts.images ?? 0} image${counts.images === 1 ? '' : 's'}`;

  return (
    <Modal
      title="IMPORT LIBRARY"
      onClose={onCancel}
      width="w-[470px]"
      footer={
        <div className="flex justify-end gap-2">
          <button className="gd-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button className="gd-btn gd-btn-danger" onClick={onReplace}>
            REPLACE
          </button>
          <button className="gd-btn gd-btn-solid" onClick={onMerge}>
            MERGE
          </button>
        </div>
      }
    >
      <p className="text-[12px] leading-relaxed text-gd-chrome">
        The archive carries <b>{line}</b>.
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-gd-chrome">
        <b>MERGE</b> adds everything to this library: colliding ids are re-minted and colliding image files land
        under fresh names, so nothing you already have is touched. <b>REPLACE</b> steps the current library aside
        and loads the archive as the whole collection (your image files stay on disk, exactly like a database
        reset).
      </p>
      {path ? (
        <p className="mt-2 text-[10px] leading-relaxed truncate" style={{ color: 'var(--gd-mute)' }} title={path}>
          {path}
        </p>
      ) : null}
    </Modal>
  );
}

// 1.1.6 — RENAME MODAL IS RETIRED ("remove deprecated code"): the card's
// name is edited inside the EDIT CARD window since 0.41.0 and the class
// row speaks its own inline editor — this window had no callers left
// (only the smoke test rendered it, and that pin is retired with it).
