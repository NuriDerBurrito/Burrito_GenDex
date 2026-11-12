module.exports = [
  {
    test: /\.jsx?$/,
    // 1.9.0 — THE GENERATED FUEL BYPASSES BABEL (the build's own red line:
    // "during npm install i did see an error in red that mentioned a
    // directory in node modules and said exceeded 500kbs"): every build
    // printed "BABEL note: styling deoptimised because the file size
    // (902 kB) exceeds 500 kB" — the note is benign (Babel only skips
    // code-formatting of one giant expression) but it reads as an ERROR
    // in red on every launch, and the pass itself was always pure waste:
    // src/utils/sqlite_wasm.js is a GENERATED module (see its own header)
    // whose entire body is `export const SQLITE_WASM_B64 = [<base64
    // strings>].join('')` — plain ES2020, no JSX, no syntax any target
    // could want rewritten, nothing to transform but ~900KB of string
    // literals Babel walks node by node. The file joins the babel
    // exclusion: webpack parses the ESM natively, the bundle keeps its
    // byte-identical payload, the build stops paying the walk, and the
    // red line never prints again. (The sql.js glue in node_modules keeps
    // its own compat-loader seat in webpack.main.config.js — untouched.)
    exclude: /node_modules|[\\/]utils[\\/]sqlite_wasm\.js$/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          ['@babel/preset-env', { targets: { electron: '42' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    },
  },
  {
    test: /\.(png|jpe?g|gif|svg|ico|webp|bmp)$/i,
    type: 'asset/resource',
  },
  {
    test: /\.(woff2?|ttf|otf|eot)$/i,
    type: 'asset/resource',
  },
];
