const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadDB: () => ipcRenderer.invoke('db:load'),
  saveDB: (db) => ipcRenderer.invoke('db:save', db),

  sendUnsavedState: (unsaved) => ipcRenderer.send('send-unsaved-state', unsaved),
  onPromptUnsaved: (callback) => ipcRenderer.on('prompt-unsaved', () => callback()),
  saveAndClose: (db) => ipcRenderer.invoke('save-and-close', db),
  forceClose: () => ipcRenderer.send('force-close'),

  windowControl: (action) => ipcRenderer.send('window-control', action),
  // 1.2.7 — THE STATUS STRIP'S MANUAL MOVE (see StatusText.jsx + main.js):
  // 'begin' hands the window to a cursor-follow move loop, 'end' stops it.
  manualWindowDrag: (state) => ipcRenderer.send('window-manual-drag', state),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', () => callback(true)),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', () => callback(false)),

  openExternal: (url) => ipcRenderer.send('open-external', url),
  clipboardReadText: () => ipcRenderer.invoke('clipboard-read-text'),
  clipboardWriteText: (text) => ipcRenderer.invoke('clipboard-write-text', text),
  // 0.30.0 — the manual PASTE keys read the clipboard's image through the
  // main process (Electron's clipboard.readImage): { base64, ext } or null.
  // 0.32.0 — the read is MULTI-STRATEGY there (copied files, the raw PNG
  // format, signature-typed buffers), so the keys accept every image type.
  clipboardReadImage: () => ipcRenderer.invoke('clipboard-read-image'),
  // 0.32.0 — paste into the FOCUSED field (the stylized text menu's Paste
  // item): the main process runs webContents.paste() — the browser's own
  // paste, exactly what the OS menu's role did.
  pasteToFocused: () => ipcRenderer.send('clipboard-paste'),
  // 0.32.0 — copy one stored image FILE to the clipboard (the stylized
  // menu's Copy image, inside windows).
  clipboardWriteImageFile: (filename) => ipcRenderer.invoke('clipboard-write-image-file', filename),
  // 0.30.0 — Data & System maintenance: open a data folder / clear cache.
  openDataFolder: (which) => ipcRenderer.send('open-data-folder', which),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  importImagesFromFiles: () => ipcRenderer.invoke('image:import-files'),
  // 0.33.0 — the optional THIRD argument is the renderer's own 480px
  // thumb (base64, no data-url prefix): Chromium's decoder covers what
  // nativeImage cannot (webp, avif, gif…), so the card grid never has to
  // decode a full-quality file for its outer thumbnail.
  // 0.40.0 — the FOURTH argument is the thumb's own extension ('.jpg' or
  // '.png'): a transparent source (webp / png cutouts…) keeps its
  // see-through pixels — the main process files the thumb under the right
  // name and image:delete cleans both.
  saveImageBuffer: (base64, ext, thumbBase64 = null, thumbExt = null) =>
    ipcRenderer.invoke('image:save-buffer', base64, ext, thumbBase64, thumbExt),
  // 0.31.0 — duplicate one stored image (the context menu's Duplicate):
  // returns a fresh { file, thumb } record or null.
  copyImageFile: (filename) => ipcRenderer.invoke('image:copy', filename),
  deleteImageFile: (filename) => ipcRenderer.invoke('image:delete', filename),
  // 1.3.2 — THE PREVIEW IPC IS RETIRED with the whole preview system: the
  // thumbnail + preview copies build automatically at import (main.js's
  // saveImage, always) — no GENERATE key, no erase key, no progress stream.
  // 1.1.2 — THE LIBRARY PORTABILITY TIER: export the db + every referenced
  // image into one zip (save dialog), and import one back (pick validates
  // and counts; commit writes the image files with collision-safe names and
  // returns the file remap — the renderer owns the db merge/replace).
  exportLibrary: (dbJson) => ipcRenderer.invoke('library:export', dbJson),
  importLibraryPick: () => ipcRenderer.invoke('library:import-pick'),
  importLibraryCommit: (payload) => ipcRenderer.invoke('library:import-commit', payload),
  // 1.1.3 — THE UPDATE CHANNEL ASK (Settings → Data → UPDATES): main fetches
  // the repo's latest GitHub release and compares versions — the renderer
  // owns every word the user reads.
  updatesCheck: () => ipcRenderer.invoke('updates:check'),
  // 1.1.3 — FACTORY RESET (Settings → Data → FACTORY RESET, double confirm
  // before it ever runs): wipes the db, every image, and every backup.
  factoryReset: () => ipcRenderer.invoke('data:factory-reset'),
});
