const postcss = require('postcss');
const fs = require('fs');
const css = fs.readFileSync(process.argv[2], 'utf8');
try {
  postcss.parse(css, { from: process.argv[2] });
  console.log('CSS PARSE OK');
} catch (e) {
  console.error('CSS PARSE ERR:', e.message);
  process.exit(1);
}
