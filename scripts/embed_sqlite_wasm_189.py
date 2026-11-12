#!/usr/bin/env python3
"""1.8.9 — regenerate src/utils/sqlite_wasm.js (the embedded sql.js wasm
binary, base64) from the installed package. Run from the app root after
`npm install sql.js`."""
from pathlib import Path
import base64

wasm = Path('node_modules/sql.js/dist/sql-wasm.wasm').read_bytes()
b64 = base64.b64encode(wasm).decode('ascii')
src = Path('src/utils/sqlite_wasm.js').read_text(encoding='utf8')
start = src.index("export const SQLITE_WASM_B64 =")
header = src[:start]
lines = [b64[i:i+240] for i in range(0, len(b64), 240)]
body = ",\n".join("  '" + chunk + "'" for chunk in lines)
Path('src/utils/sqlite_wasm.js').write_text(header + body + ",\n].join('');\n", encoding='utf8')
print('embedded', len(b64), 'b64 chars')
