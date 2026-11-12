#!/usr/bin/env python3
"""1.8.8 — THE WEBSITE RETIRES ("delete the website folder, the final
release ships without it").

The one-file landing page (website/index.html, carried since 1.2.5) left
the repo with the final release. Every suite that read it would crash on
the missing file (the reads are top-level readFileSync calls), and every
pin that watched the page's furniture would fail against the void — so
both retire together, in the codebase's own idiom: the read lines and
their pins are kept as comments that tell the retirement, and any ok()
left with nothing but retired lines becomes an honest console.log.

The app itself never imported the page (Settings -> About still opens
whatever site the link points at), so only the test fleet learns.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RETIRE_NOTE = "1.8.8 — RETIRED WITH THE WEBSITE"


def is_comment(line: str) -> bool:
    return line.lstrip().startswith("//")


def retire_inline(line: str) -> str:
    """Comment a single line out, keeping its content visible."""
    indent = line[: len(line) - len(line.lstrip())]
    return f"{indent}// {RETIRE_NOTE}: {line.lstrip()}"


DECL_RE = re.compile(r"^\s*const (\w+) = src\('website/index\.html'\);\s*$")
DERIVED_RE = re.compile(r"^\s*const (\w+) = (.*)$")
# both dialects speak here: assertMatch(x, ...) and assert.match(x, ...) —
# the first run's \w* missed the DOT forms entirely (assert.match /
# assert.ok), leaving webSrc references alive in a dozen suites
ASSERT_FIRST_ARG_RE = re.compile(r"^\s*assert(?:\.\w+|\w*)\(\s*(\w+)(?![\w$])")
EXISTS_RE = re.compile(r"existsSync\(join\(appRoot, 'website/index\.html'\)\)")
# the re-run bootstrap: the five names every fleet decl ever used, plus
# the derived names preserved inside the retired lines' own text
STANDARD_NAMES = ("website", "websiteSrc", "webSrc", "web", "page")
RETIRED_DERIVED_RE = re.compile(
    r"^\s*// 1\.8\.8 — RETIRED WITH THE WEBSITE: const (\w+) = "
)


def patch_file(p: Path) -> bool:
    raw = p.read_text(encoding="utf8")
    lines = raw.split("\n")
    tracked: set[str] = set()
    touched = False
    has_note = RETIRE_NOTE in raw

    # pass 0 — the re-run bootstrap: a retired file's decl comments no
    # longer speak their names, so the fleet's five standard names are
    # seeded directly (only files that read the page carry the note, and
    # the position-anchored assert match keeps foreign uses of a generic
    # name safe), and the derived names are recovered from the retired
    # lines' own preserved text
    if has_note:
        for line in lines:
            m = RETIRED_DERIVED_RE.match(line)
            if m:
                tracked.add(m.group(1))
        for name in STANDARD_NAMES:
            if re.search(rf"\b{name}\b", raw):
                tracked.add(name)

    # pass 1 — the reads themselves (top-level or in-body) + the existsSync
    for i, line in enumerate(lines):
        if is_comment(line):
            continue
        if "src('website/index.html')" in line:
            m = DECL_RE.match(line)
            if m:
                tracked.add(m.group(1))
                indent = line[: len(line) - len(line.lstrip())]
                lines[i] = (
                    f"{indent}// {RETIRE_NOTE} (\"delete the website folder, the final\n"
                    f"{indent}// release ships without it\"): the one-file page left the repo\n"
                    f"{indent}// with the final release; this suite's page-pins retired with it."
                )
            else:
                lines[i] = retire_inline(line)
            touched = True
        elif EXISTS_RE.search(line):
            lines[i] = retire_inline(line)
            touched = True

    # pass 2 — propagate: derived consts + first-argument asserts, to a
    # fixpoint (the derived chains in 131/132: website -> currentRow/rows
    # -> r121/r123/r120 -> their asserts). Deliberately NARROW forms only
    # (first-argument identifier position / const-derivation): a bare
    # word-anywhere match would eat names living inside string and regex
    # literals ('download page' in a tooltip pin, for one).
    changed = True
    while changed:
        changed = False
        for i, line in enumerate(lines):
            if is_comment(line):
                continue
            m = ASSERT_FIRST_ARG_RE.match(line)
            if m and m.group(1) in tracked:
                lines[i] = retire_inline(line)
                touched = True
                changed = True
                continue
            dm = DERIVED_RE.match(line)
            if dm and dm.group(1) not in tracked:
                rhs = dm.group(2)
                refs = {w for w in tracked if re.search(rf"\b{re.escape(w)}\b", rhs)}
                if refs and "src(" not in rhs:
                    tracked.add(dm.group(1))
                    lines[i] = retire_inline(line)
                    touched = True
                    changed = True
                    continue

    if not touched:
        return False

    out = "\n".join(lines)

    # pass 3 — an ok() whose body is now nothing but retired comments
    # becomes an honest console.log (the fleet's counts stay true)
    empty_ok = re.compile(
        r"ok\((['\"])((?:\\.|(?!\1).)*)\1, \(\) => \{\n"
        r"((?:[ \t]*//[^\n]*\n)+)"
        r"\}\);\n"
    )

    def repl(m: re.Match) -> str:
        q, title = m.group(1), m.group(2)
        return (
            f"console.log('  ok — retired with the website in 1.8.8 — ' + {q}{title}{q});\n"
        )

    out, n = empty_ok.subn(repl, out)
    if n:
        print(f"    ({n} empty ok() block(s) became retirement logs)")
    p.write_text(out, encoding="utf8")
    return True


def main() -> None:
    files = sorted(ROOT.glob("scripts/gendex_*.test.mjs"))
    touched = 0
    for p in files:
        try:
            raw = p.read_text(encoding="utf8")
        except Exception:
            continue
        if "website" not in raw and "webSrc" not in raw:
            continue
        if patch_file(p):
            touched += 1
            print(f"  retired: {p.name}")
    print(f"website pins retired in {touched} of {len(files)} suites")


if __name__ == "__main__":
    main()
