/**
 * 1.8.9 — THE SQL.JS BUNDLE COMPAT SHIM (the engine seat: sql.js's emcc
 * node-export path is dead code inside a webpack bundle, and leaving it
 * alive kills the PRODUCTION build).
 *
 * The disease, named exactly: sql.js's manual modularization assigns
 * `module = undefined;` inside initSqlJs's Promise executor (their own
 * comment: "we're handling the modularization efforts ourselves"), and the
 * emcc-generated node branch guards its export with
 * `"undefined" != typeof module && (module.exports = <emcc module>);`.
 * In vanilla Node the guard sees `undefined` and skips — the export is
 * already initSqlJs's job. But in the webpack PRODUCTION build terser
 * reads `module` as a declared binding, constant-folds the `typeof`
 * guard to TRUE, and deletes it — leaving a bare `module.exports = f`
 * that throws "Cannot set properties of undefined (setting 'exports')"
 * the moment the engine wakes (the whole house then falls back to JSON
 * mode, silently, because prime's belt-and-braces catch swallowed it).
 *
 * The cure: this loader removes that ONE statement from the sql.js glue
 * before webpack ever sees it. The emcc node-export path is genuinely
 * dead here — the bundle's module graph already carries initSqlJs's own
 * UMD export (`module.exports = initSqlJs; module.exports.default =
 * initSqlJs;`, which webpack folds and honors) — and the engine is fed
 * the wasm binary directly through `wasmBinary`, so the emcc node branch's
 * file-loading work is unused too. The `module = undefined;` assignment
 * itself stays (harmless: nothing reads that binding afterwards once the
 * export statement is gone).
 *
 * Match law: the emcc output is minified with per-build single-letter
 * names, so the statement is pinned by REGEX, not by literal. If a future
 * sql.js stops emitting the statement entirely, the loader passes the
 * source through untouched (no match, no patch, no error) — the engine
 * batteries (gendex_190) are the loud net if a future glue ever needs a
 * new cure.
 */
module.exports = function sqljsCompatLoader(source) {
  if (typeof source !== 'string') return source;
  // "undefined"!=typeof module&&(module.exports=<one identifier>);
  const patched = source.replace(
    /"undefined"\s*!=\s*typeof\s+module\s*&&\s*\(module\.exports\s*=\s*[A-Za-z_$][\w$]*\s*\)\s*;?/,
    '/* sqljs-compat: the emcc node-export path is dead inside the bundle (see scripts/sqljs_compat_loader.cjs) */'
  );
  if (patched === source) {
    // no match: either the glue changed shape or the statement is already
    // gone — pass through and let the batteries speak if anything broke.
    return source;
  }
  return patched;
};
