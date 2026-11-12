#!/usr/bin/env python3
"""1.2.7 -> 1.2.8 version sweep: moves every live version pin in the app
tree (package.json, package-lock, constants, README, START.bat, the
in-source website incl. its CURRENT array, the splash V-literals, the
last-run seats in test fixtures) and re-laws the version-pinning test
suites. Run from the app root."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.2.7"
NEW = "1.2.8"


def sub_file(path, pairs, must=True):
    p = ROOT / path
    if not p.exists():
        if must:
            raise SystemExit(f"missing: {path}")
        return 0
    src = p.read_text(encoding="utf-8")
    out = src
    n = 0
    for a, b in pairs:
        out, k = re.subn(a, b, out)
        n += k
    if out != src:
        p.write_text(out, encoding="utf-8")
    return n


def main():
    total = 0
    # package.json + package-lock (both root fields; preserve the
    # @electron/windows-sign true 1.2.2 — never blind-replace in the lock)
    pkg = ROOT / "package.json"
    data = json.loads(pkg.read_text(encoding="utf-8"))
    data["version"] = NEW
    pkg.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lock = ROOT / "package-lock.json"
    ldata = json.loads(lock.read_text(encoding="utf-8"))
    ldata["version"] = NEW
    if ldata.get("packages", {}).get(""):
        ldata["packages"][""]["version"] = NEW
    lock.write_text(json.dumps(ldata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total += 2

    # plain literal sweeps
    for f in ["src/constants/index.js", "README.md", "START.bat", "website/index.html"]:
        n = sub_file(f, [(r"1\.2\.7", NEW)])
        print(f"{f}: {n} pins")
        total += n

    # the splash's version literal follows the constants APP object but the
    # suites pin its rendered form; the in-source site's CURRENT array moved
    # with the literal sweep above ([1, 2, 7] -> [1, 2, 8] via 1\.2\.7? no —
    # the array speaks commas). Sweep the array forms everywhere:
    for f in ["website/index.html"]:
        n = sub_file(f, [(r"\[1, 2, 7\]", "[1, 2, 8]")])
        print(f"{f} CURRENT array: {n}")
        total += n

    # test suites: every gendex_* pin of the running version
    tests = sorted((ROOT / "scripts").glob("gendex_*.test.mjs"))
    for t in tests:
        src = t.read_text(encoding="utf-8")
        out = src
        n = 0
        for a, b in [
            (r"1\.2\.7", NEW),
            (r"\[1, 2, 7\]", "[1, 2, 8]"),
            (r"\[1,\s*2,\s*7\]", "[1, 2, 8]"),
            (r"1, 2, 7", "1, 2, 8"),
        ]:
            out, k = re.subn(a, b, out)
            n += k
        if out != src:
            t.write_text(out, encoding="utf-8")
            print(f"{t.name}: {n} pins")
            total += n
    print(f"TOTAL moved: {total}")


if __name__ == "__main__":
    main()
