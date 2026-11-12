const rules = require('./webpack.rules.config.js');
const plugins = require('./webpack.plugins.config.js');

module.exports = {
  /**
   * Renderer entry (window + preload). The forge webpack plugin supplies
   * target, entry, output paths and HTML plugin.
   *
   * devtool is set explicitly to a non-eval flavor: dev mode would otherwise
   * default to eval-source-map, which our CSP (script-src 'self') blocks.
   */
  devtool: 'source-map',
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins,
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  performance: {
    hints: false,
  },
};
