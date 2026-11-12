// Standalone renderer-bundle verification (the forge plugin normally
// supplies entry/target/HTML — this mirrors it for a plain webpack run).
const path = require('path');
const base = require('../webpack.renderer.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  ...base,
  target: 'electron-renderer',
  entry: { renderer: './src/renderer.js' },
  output: { path: path.resolve(__dirname, '../.webpack/check-renderer'), filename: 'renderer.js' },
  plugins: [
    ...base.plugins,
    new HtmlWebpackPlugin({ template: './src/index.html', filename: 'index.html' }),
  ],
};
