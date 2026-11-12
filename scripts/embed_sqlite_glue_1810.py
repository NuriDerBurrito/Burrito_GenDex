#!/usr/bin/env python3
"""1.8.10 — regenerate src/utils/sqlite_glue.js (the vendored sql.js engine
glue) from the official package dist. Run from the app root:

    npm install sql.js@1.13.0 --no-save        # or pass a dist dir:
    python3 scripts/embed_sqlite_glue_1810.py [path/to/sql.js/dist]

The engine's whole body rides the tree since 1.8.10 — the glue (this file's
output) beside the fuel it already carried (src/utils/sqlite_wasm.js, the
verbatim dist/sql-wasm.wasm, base64). The script refuses to write a pair
that disagrees: the installed dist's wasm must equal the embedded fuel
byte-for-byte, or the tree keeps the seat it already holds.

The four cures (each asserted to exactly one seat in the upstream glue —
a future sql.js that changes shape fails LOUD here instead of shipping a
half-vendored engine):

  1. `module = undefined;` — sql.js's manual-modularization ritual. A bare
     assignment to an undeclared binding: legal in the sloppy script the
     package ships as, a ReferenceError in the strict ES module this tree
     vendored it into. Retired — `module` does not exist here at all.
  2. the emcc node-export guard — `"undefined"!=typeof
     module&&(module.exports=f);` — dead inside any bundle (the engine is
     fed its wasm through `wasmBinary`, never a file on disk), and the
     exact statement terser used to constant-fold into the 1.8.9 production
     crash ("Cannot set properties of undefined (setting 'exports')"). The
     1.8.9 runtime loader (scripts/sqljs_compat_loader.cjs) patched this on
     the fly; the cure is spoken once, statically, where it can never ride
     a build unpatched.
  3. the UMD tail — `module.exports = initSqlJs` / `define(...)` /
     `exports["Module"]` — retired with the module's own ES export.
  4. the node-lamp test — the emcc node branch (`if(ca){...}`) speaks bare
     `require("fs")`, `require("path")`, `require("crypto")` and
     `__dirname`, lamps every CommonJS context provides. Inside the app's
     compiled bundle they resolve through the bundle's own CommonJS scope
     (the exact precedent of main.js's raw requires since 1.5.5); imported
     directly as a native ES module — the test batteries' seat — none of
     them exists, so the branch would die on its first lamp. The `ca` test
     learns the honest question: the node branch may only wake where a
     node lamp (`__dirname`) actually exists. Bundle: lamp lit, node branch
     as it always spoke. Native ES module: lamp dark, the branch stands
     down, the engine wakes on its embedded fuel alone (the crypto seat
     falls back to `crypto.getRandomValues`, which Node itself provides).
"""
import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DIST = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'node_modules' / 'sql.js' / 'dist'
GLUE_OUT = ROOT / 'src' / 'utils' / 'sqlite_glue.js'
WASM_EMBED = ROOT / 'src' / 'utils' / 'sqlite_wasm.js'

HEADER = """// 1.8.10 — THE ENGINE'S OWN SEAT (the boot report: "App threw an error
// during load — Error: Cannot find module 'sql.js'", on a machine whose
// node_modules never carried the package). The 1.8.9 house embedded the
// engine's FUEL but not its BODY: the wasm binary rode inside the bundle
// (the sibling sqlite_wasm.js) while the glue that speaks it — sql.js's
// dist/sql-wasm.js — still lived in node_modules, so `npm install` stayed
// a boot dependency the house's own law had already promised away ("no
// node_modules lookups inside the packaged asar"), and a machine without
// the package met webpack's missing-module shim, which throws the moment
// the main bundle wakes — before a single window is born.
//
// From this release the WHOLE engine rides the tree: this file is the
// verbatim dist/sql-wasm.js from sql.js@1.13.0 (MIT — the SQLite
// engine compiled to WebAssembly by the sql.js project), vendored as an
// ES module of the app's own src/utils with exactly four cures applied
// at the source (the diseases the 1.8.9 runtime loader used to patch on
// the fly — now spoken once, statically, where no build can ever ride
// them unpatched):
//   1. `module = undefined;` retired — the manual-modularization ritual
//      is a bare assignment to an undeclared binding, legal in the sloppy
//      script the package ships as, a ReferenceError in the strict ES
//      module this tree vendored it into.
//   2. the emcc node-export guard retired — `"undefined"!=typeof
//      module&&(module.exports=f);` is dead inside any bundle and was
//      the statement terser constant-folded into the 1.8.9 production
//      crash ("Cannot set properties of undefined (setting 'exports')").
//   3. the UMD tail retired — `module.exports` / `define` /
//      `exports["Module"]` — replaced by this module's own export.
//   4. the node-lamp test — the emcc node branch (`if(ca){...}`) speaks
//      bare `require("fs")` / `require("path")` / `require("crypto")` and
//      `__dirname`: lamps every CommonJS context provides. Inside the
//      app's compiled bundle they resolve through the bundle's own
//      CommonJS scope (main.js's raw requires have ridden that road since
//      1.5.5); imported directly as a native ES module — the test
//      batteries' seat — none of them exists. The `ca` test now asks the
//      honest question first ("string"==typeof __dirname): lamp lit, the
//      node branch wakes exactly as it always spoke; lamp dark, the
//      branch stands down and the engine wakes on its embedded fuel alone
//      (the crypto seat falling back to crypto.getRandomValues, which
//      Node itself provides).
// The fuel rides the sibling sqlite_wasm.js exactly as it has since
// 1.8.9 — the verbatim dist/sql-wasm.wasm of the SAME package, base64 —
// and the pair must never disagree.
//
// GENERATED FILE — do not edit by hand. Regenerate from the installed
// package with scripts/embed_sqlite_glue_1810.py (it verifies the pair
// before it writes). The cures are pinned by the gendex_191 engine
// battery, which boots the real compiled bundle (dev AND production)
// with no sql.js anywhere in node_modules.
"""


def main() -> None:
    glue_src = (DIST / 'sql-wasm.js').read_text(encoding='utf8')
    wasm_src = (DIST / 'sql-wasm.wasm').read_bytes()

    # the pair must never disagree: the embedded fuel vs this dist's wasm
    embed_text = WASM_EMBED.read_text(encoding='utf8')
    start = embed_text.index('export const SQLITE_WASM_B64 =')
    body = embed_text[start:]
    b64 = body[body.index('[') + 1: body.rindex(']')].replace("'", '').replace(',', '').replace('\n', '').replace(' ', '')
    embedded = base64.b64decode(b64)
    assert embedded == wasm_src, (
        f'the pair disagrees: src/utils/sqlite_wasm.js embeds {len(embedded)} bytes, '
        f'the dist speaks {len(wasm_src)} — vendor both from ONE sql.js package'
    )
    print(f'  the pair agrees: {len(wasm_src)} wasm bytes, byte-identical')

    # cure 1 — the undefine ritual
    needle = '        module = undefined;\n'
    seats = glue_src.count(needle)
    assert seats == 1, f'cure 1: expected 1 seat, found {seats}'
    glue_src = glue_src.replace(
        needle,
        '        /* vendored cure 1 (1.8.10): `module` no longer exists in this ES module — the ritual is retired. */\n',
        1,
    )
    print('  cure 1 seated — the undefine ritual retired')

    # cure 2 — the emcc node-export guard
    guard = re.compile(r'"undefined"\s*!=\s*typeof\s+module\s*&&\s*\(module\.exports\s*=\s*[A-Za-z_$][\w$]*\s*\)\s*;?')
    seats = guard.findall(glue_src)
    assert len(seats) == 1, f'cure 2: expected 1 seat, found {seats}'
    glue_src = guard.sub(
        '/* vendored cure 2 (1.8.10): the emcc node-export path is dead inside the app bundle */',
        glue_src,
        count=1,
    )
    print('  cure 2 seated — the emcc node-export guard retired')

    # cure 3 — the UMD tail
    marker = '// This bit below is copied almost exactly from what you get when you use the MODULARIZE=1 flag with emcc'
    idx = glue_src.index(marker)
    tail = glue_src[idx:]
    assert 'module.exports = initSqlJs' in tail and 'exports["Module"]' in tail, 'cure 3: the UMD tail changed shape'
    glue_src = glue_src[:idx] + (
        "// 1.8.10 — vendored cure 3: the UMD tail retired — the export below is the\n"
        "// module's own seat.\n"
        'export default initSqlJs;\n'
        'export { initSqlJs };\n'
    )
    print('  cure 3 seated — the UMD tail retired, the ES export took its seat')

    # cure 4 — the node-lamp test
    ca_old = '"renderer"!=process.type;"use strict";'
    seats = glue_src.count(ca_old)
    assert seats == 1, f'cure 4: expected 1 seat, found {seats}'
    glue_src = glue_src.replace(
        ca_old,
        '"renderer"!=process.type&&"string"==typeof __dirname;/* vendored cure 4 (1.8.10): the node branch may only wake where a node lamp actually exists */"use strict";',
        1,
    )
    print('  cure 4 seated — the node-lamp test learned the honest question')

    # the living word must never speak the dead bindings
    live = '\n'.join(l for l in glue_src.split('\n') if not l.lstrip().startswith('//') and not l.lstrip().startswith('/*') and not l.lstrip().startswith('*'))
    for banned in [r'(?<![_\w$.])module\s*=\s*undefined', r'module\.exports\s*=', r'exports\[', r'typeof\s+module\b']:
        assert not re.search(banned, live), f'the living word still speaks a dead binding: {banned}'

    GLUE_OUT.write_text(HEADER + '\n' + glue_src, encoding='utf8')
    print(f'  wrote {GLUE_OUT} ({len(HEADER) + len(glue_src)} chars)')


if __name__ == '__main__':
    main()
