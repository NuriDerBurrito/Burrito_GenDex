#!/usr/bin/env python3
"""1.8.10 version furniture — the app tree's own seats (the suites' pins are
swept separately by version_sweep_1810.py). The compression@1.8.2 dependency
lesson holds: only the app's OWN version seats move.

1.8.10 is THE ENGINE'S OWN SEAT: the sql.js glue is vendored into
src/utils/sqlite_glue.js beside its fuel (the 1.8.9-embedded wasm), sql.js
is struck from the dependencies (the boot can never again depend on a
package the app does not carry), the parse gate learns the
glue module, and the battery welcomes the 191 engine suite.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if old not in raw:
        if new in raw:
            print(f"  {path}: already seated")
            return
        raise AssertionError(f"{path}: missing seat:\n{old[:120]}")
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


CHANGELOG_ENTRY = """## 1.8.10 — The Engine's Own Seat

One answer — the engine that speaks the library finally rides the whole way inside the app, and the boot can never again depend on a package the app does not carry.

- **The engine takes its own seat** (the boot report: "App threw an error during load — Error: Cannot find module 'sql.js'", on a machine whose node_modules never carried the package): the 1.8.9 house embedded the engine's FUEL — the wasm binary, base64, inside the bundle — but its BODY still lived in node_modules (the sql.js glue, dist/sql-wasm.js), so `npm install` stayed a boot dependency the house's own law had already promised away, and a machine without the package met webpack's missing-module shim, which throws the moment the main bundle wakes — before a single window is born, exactly as reported. From this release the WHOLE engine rides the tree: the glue is vendored beside its fuel as src/utils/sqlite_glue.js — the verbatim sql.js@1.13.0 dist (MIT), an ES module of the app's own src/utils — and sql.js is struck from the dependencies, so the app compiles, boots and saves with no sql.js anywhere on the machine. The vendoring speaks four cures, each carved statically into the source where no build can ever ride it unpatched: the manual-modularization ritual (`module = undefined` — a bare assignment to an undeclared binding, legal in the sloppy script the package ships as, a ReferenceError in the strict ES module this tree vendored it into) retired; the emcc node-export guard (the exact statement terser constant-folded into 1.8.9's production crash — patched then by a runtime loader that could only cure a file that ARRIVES; a vendored file carries its cure forever) retired; the UMD tail retired for the module's own export; and the node-lamp test — the emcc node branch's bare require("fs") / require("path") / require("crypto") and __dirname resolve through the compiled bundle's own CommonJS scope (main.js's raw requires have ridden that road since 1.5.5), while the batteries' native ES-module seat has no such lamps, so the branch now asks the honest question first ("string"==typeof __dirname): lamp lit, the node branch wakes exactly as it always spoke; lamp dark, the branch stands down and the engine wakes on its embedded fuel alone (the crypto seat falling back to crypto.getRandomValues, which Node itself provides). The runtime loader rule retires with its patient (scripts/sqljs_compat_loader.cjs keeps its seat as the cure's own history; scripts/embed_sqlite_glue_1810.py regenerates the vendored pair and refuses a glue that disagrees with its fuel), and the battery grows its own 191 engine suite: the real entry compiled with NO sql.js in node_modules, booted dev AND production, the fresh seat saying 'missing', the legacy JSON door folding its data in once and never again, the cures pinned at their source seats, and the wasm pair proven byte-identical to the one package they both speak for.
- **The housekeeping that rides with it**: the CI's JSX parse gate learns the glue module (the gate now walks the whole engine trio: sqlite_engine.js, sqlite_wasm.js, sqlite_glue.js), and the battery welcomes its newest suite (gendex_191) with the engine's self-containment pinned as law — proven from inside the real compiled artifact, dev AND production, with no sql.js anywhere in node_modules.

"""


def main() -> None:
    print("the app tree's own seats:")

    sub("package.json", '"version": "1.8.9",', '"version": "1.8.10",')
    sub("src/constants/index.js", "version: '1.8.9',", "version: '1.8.10',")
    sub("CHANGELOG.md", "## 1.8.9 — The Library's Own House", CHANGELOG_ENTRY + "## 1.8.9 — The Library's Own House")

    print("\nthe README's own badges:")
    sub("README.md", "**v1.8.9**", "**v1.8.10**")
    sub("README.md", "version-1.8.9-purple", "version-1.8.10-purple")
    sub("README.md", "the regression battery (72 DOM/source test suites)", "the regression battery (73 DOM/source test suites)")

    print("\nthe CI's own seats:")
    sub(
        ".github/workflows/ci.yml",
        "src/utils/sqlite_engine.js src/utils/sqlite_wasm.js",
        "src/utils/sqlite_engine.js src/utils/sqlite_wasm.js src/utils/sqlite_glue.js",
    )

    print("\nthe battery welcomes the 191 suite:")
    sub(
        "scripts/run_battery_171.sh",
        "gendex_189_batch_dom gendex_190_batch_dom",
        "gendex_189_batch_dom gendex_190_batch_dom gendex_191_batch_dom",
    )

    print("\nseated.")


if __name__ == "__main__":
    main()
