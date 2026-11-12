const rules = require('./webpack.rules.config.js');

module.exports = {
  /**
   * Main process entry. The forge webpack plugin supplies target, output
   * (.webpack/main/index.js), devtool and the renderer-entry Defines.
   */
  entry: './src/main.js',
  module: {
    rules: [
      ...rules,
      // 1.8.10 — THE SQL.JS COMPAT SHIM RULE, RETIRED (the engine's own
      // seat): the rule matched the sql.js glue where it used to live
      // (the node_modules dist seat) and stripped its dead emcc export
      // statement before webpack ever saw it (the terser-folded
      // "Cannot set properties of undefined" production crash — the
      // whole disease is written at the compat loader's own file in
      // scripts/, which keeps its seat as the cure's own history). The
      // engine's glue no longer lives in node_modules at all: since
      // 1.8.10 it rides the tree as src/utils/sqlite_glue.js — the
      // verbatim sql.js@1.13.0 dist, vendored as an ES module with that
      // same statement (and three more diseases) cured STATICALLY at the
      // source, because the node_modules leg was the one that broke the
      // boot on machines whose install never carried the package
      // ("Cannot find module 'sql.js'", the webpack missing-module shim,
      // thrown before a single window is born). A runtime loader can
      // only cure a file that arrives; a vendored file carries its cure
      // forever. The gendex_191 engine battery boots the real compiled
      // bundle (dev AND production, no sql.js in node_modules) to keep
      // the promise.
      //
      // 1.5.6 — THE PACKAGED-MAIN GUARD (the 1.5.5 build crash:
      // "Cannot find module '../src/utils/dbio.js'" from
      // app.asar/.webpack/main/index.js — the app died before a single
      // window opened). src/package.json declares {"type":"module"} (the
      // test batteries import src modules as real ESM), so webpack parses
      // src/main.js as an ES module — and in ESM webpack does NOT bundle
      // require() calls: it leaves them as raw runtime Node requires,
      // with no warning at build time. That quietly worked for the app's
      // whole history because every require the file ever made was
      // 'electron' or a node builtin (resolvable at runtime inside the
      // asar) — the 1.1.7 squirrel-startup boot crash was the same
      // disease, one victim earlier. 1.5.5 added the FIRST RELATIVE
      // require (../src/utils/dbio.js); a path like that does not exist
      // next to .webpack/main/, so the packaged app could not boot. Forcing
      // javascript/auto for the main entry makes webpack treat main.js the
      // classic way — import AND require both resolve and BUNDLE — so a
      // future stray require can never again ride raw into the asar.
      // (main.js itself now speaks ESM imports too; this rule is the net
      // underneath it. Verified by scripts/probe_main_bundle.cjs and the
      // gendex_162 packaging battery, which build the real entry and boot
      // the emitted bundle.)
      { test: /src[\\/]main\.js$/, exclude: /node_modules/, type: 'javascript/auto' },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  performance: {
    hints: false,
  },
};
