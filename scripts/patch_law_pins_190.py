#!/usr/bin/env python3
"""1.9.0 — the law-pin pass after the sweep (version_sweep_190.py moved
every live 1.8.10 pin to 1.9.0; four families need their own word):

1. THE OVER-SWEPT BIRTH TOMBSTONES (gendex_191) — the engine suite was
   BORN in 1.8.10, and the pins that watch its birth-versioned SOURCE
   seats (the glue's own "1.8.10 — THE ENGINE'S OWN SEAT" note) and the
   worklog's 1.8.10 entry still speak 1.8.10 in the source — the birth
   version stays in the law's own prose forever — so the pins revert to
   the birth digits, exactly the way the 1.8.4 / 1.8.8 / 1.8.9 / 1.8.10
   passes taught.

2. 191's D1 TITLE — the sweep's title replace speaks the bare
   'the version is X everywhere' shape; 191's title carries its 'D1 — '
   prefix, so it was born saying 1.8.10 and the prefix shielded it. The
   body now pins 1.9.0 (the live truth) — the title follows it.

3. THE GHOST'S EXTENDED ORIGIN (gendex_179 F3) — 1.9.0 re-seated the
   ghost's measured seats (+6 against the box's 6px left extension), so
   the F3 pin follows the new arithmetic.

4. THE BADGE'S ACCENT CLOTH (gendex_190 E2) — 1.9.0 took the badge's
   cloth back to the accent's own color on the family's frame, so the E2
   law follows the new cloth: the CLOTH words (border-color / color /
   background + the badge's own hover/active seats) are the badge's own
   again, while every FRAME word (border shorthand, radius, shadow,
   transition, transform) stays the family's.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITES = ROOT / "scripts"


def sub(fname: str, old: str, new: str, count=None) -> None:
    p = SUITES / fname
    raw = p.read_text(encoding="utf8")
    n = raw.count(old)
    if n == 0:
        if new in raw:
            print(f"  {fname}: already seated")
            return
        raise AssertionError(f"{fname}: the pin never spoke:\n{old[:110]}")
    if count is not None:
        assert n == count, f"{fname}: expected {count} seats, found {n}"
    raw = raw.replace(old, new)
    p.write_text(raw, encoding="utf8")
    print(f"  {fname}: {n} pin(s) re-seated")


def main() -> None:
    print("the birth tombstones revert (the engine suite's own 1.8.10 seats):")
    sub(
        "gendex_191_batch_dom.test.mjs",
        r"""assertMatch(glueSrc, /1\.9\.0 — THE ENGINE'S OWN SEAT \(the boot report: "App threw an error\s*\n\/\/ during load — Error: Cannot find module 'sql\.js'"/, 'the seat note never spoke');""",
        r"""// 1.9.0 — the birth tombstone: the glue's own note keeps its 1.8.10 birth
  // version in the source forever (the sweep's word is for LIVE pins).
  assertMatch(glueSrc, /1\.8\.10 — THE ENGINE'S OWN SEAT \(the boot report: "App threw an error\s*\n\/\/ during load — Error: Cannot find module 'sql\.js'"/, 'the seat note never spoke');""",
    )
    sub(
        "gendex_191_batch_dom.test.mjs",
        r"""assertMatch(worklog, /1\.9\.0 — The Engine's Own Seat/, 'the worklog entry never arrived');""",
        r"""// 1.9.0 — the birth tombstone: the worklog keeps EVERY version's entry —
  // this one watches the 1.8.10 seat the suite was born under.
  assertMatch(worklog, /1\.8\.10 — The Engine's Own Seat/, 'the worklog entry never arrived');""",
    )
    print("191's D1 title follows its body (the prefix shielded it from the sweep):")
    sub(
        "gendex_191_batch_dom.test.mjs",
        "ok('D1 — the version is 1.8.10 everywhere', () => {",
        "ok('D1 — the version is 1.9.0 everywhere', () => {",
    )

    print("the ghost's extended origin (179's F3 follows the +6 law):")
    sub(
        "gendex_179_batch_dom.test.mjs",
        r"""  assertMatch(charview, /position: 'absolute',\s*\n\s*left: `\$\{seat\.left\}px`,\s*\n\s*top: `\$\{seat\.top\}px`,\s*\n\s*width: `\$\{seat\.width\}px`,\s*\n\s*height: `\$\{seat\.height\}px`,/, 'the measured seats never painted');""",
        r"""  // 1.9.0 — THE SEAT SPEAKS THE EXTENDED ORIGIN: the ghost's box reaches
  // 6px left of the seat (the wall's own headroom — .gd-tag-ghost-row.is-seated
  // left: -6px), so the measured seats shift +6 to keep painting at their
  // exact on-screen seats while the marks clear the clip.
  assertMatch(charview, /position: 'absolute',\s*\n\s*left: `\$\{seat\.left \+ 6\}px`,\s*\n\s*top: `\$\{seat\.top\}px`,\s*\n\s*width: `\$\{seat\.width\}px`,\s*\n\s*height: `\$\{seat\.height\}px`,/, 'the measured seats never painted');""",
    )

    print("the badge's accent cloth (190's E2 follows the new law):")
    sub(
        "gendex_190_batch_dom.test.mjs",
        r"""ok('E2 — the badge rule overrides NOTHING the family says (frame inherited)', () => {
  for (const banned of [/border\s*:/, /background\s*:/, /color\s*:/, /border-radius\s*:/, /box-shadow\s*:/, /transition\s*:/]) {
    assert.ok(!banned.test(badgeRule), `the badge still overrides the family's ${banned}`);
  }
  assert.ok(!/\.gd-about-credit-badge:not\(:disabled\):hover/.test(css), 'the badge kept its own hover seat');
  assert.ok(!/\.gd-about-credit-badge:not\(:disabled\):active/.test(css), 'the badge kept its own active seat');
  // the family's own words answer for it now
  assertMatch(css, /\.gd-about-link:not\(:disabled\):hover \{[\s\S]*?border-color: var\(--gd-accent\);/, 'the family hover never spoke');
});""",
        r"""ok('E2 — the badge rule overrides NOTHING the family\'s FRAME says (cloth is 1.9.0\'s)', () => {
  // 1.9.0 — BUT THE CLOTH TAKES THE ACCENT'S OWN COLOR: the badge keeps the
  // family's FRAME (geometry, radius, shadow, transition, lift) but its
  // CLOTH — border-color, ink, fill, and its own hover/active deepening —
  // is the accent's own again (see .gd-about-credit-badge in index.css).
  for (const banned of [/border\s*:/, /border-radius\s*:/, /box-shadow\s*:/, /transition\s*:/, /transform\s*:/]) {
    assert.ok(!banned.test(badgeRule), `the badge still steals the family's ${banned}`);
  }
  assertMatch(badgeRule, /border-color: color-mix\(in srgb, var\(--gd-accent\) 45%, transparent\);/, 'the accent border never spoke');
  assertMatch(badgeRule, /color: var\(--gd-accent\);/, 'the accent ink never spoke');
  assertMatch(badgeRule, /background: color-mix\(in srgb, var\(--gd-accent\) 12%, var\(--gd-panel\)\);/, 'the accent tint never spoke');
  assertMatch(css, /\.gd-about-credit-badge:not\(:disabled\):hover \{[\s\S]*?background: color-mix\(in srgb, var\(--gd-accent\) 22%, var\(--gd-panel\)\);/, 'the badge hover never deepened');
  // the family's own lift still answers underneath the badge's cloth
  assertMatch(css, /\.gd-about-link:not\(:disabled\):hover \{[\s\S]*?transform: translateY\(-1px\);/, 'the family hover never spoke');
});""",
    )

    print("the glue's cure tombstones revert (the vendored notes keep their 1.8.10 birth):")
    sub(
        "gendex_191_batch_dom.test.mjs",
        r"""assertMatch(glueSrc, /vendored cure 1 \(1\.9\.0\): `module` no longer exists in this ES module/, 'cure 1 (the undefine ritual) never spoke');
  assertMatch(glueSrc, /vendored cure 2 \(1\.9\.0\): the emcc node-export path is dead inside the app bundle/, 'cure 2 (the emcc export guard) never spoke');
  assertMatch(glueSrc, /1\.9\.0 — vendored cure 3: the UMD tail retired/, 'cure 3 (the UMD tail) never spoke');""",
        r"""// 1.9.0 — the birth tombstones: the vendored cures keep their 1.8.10 birth
  // versions in the glue's own prose forever (the sweep's word is for LIVE pins).
  assertMatch(glueSrc, /vendored cure 1 \(1\.8\.10\): `module` no longer exists in this ES module/, 'cure 1 (the undefine ritual) never spoke');
  assertMatch(glueSrc, /vendored cure 2 \(1\.8\.10\): the emcc node-export path is dead inside the app bundle/, 'cure 2 (the emcc export guard) never spoke');
  assertMatch(glueSrc, /1\.8\.10 — vendored cure 3: the UMD tail retired/, 'cure 3 (the UMD tail) never spoke');""",
    )
    print("the shim-rule retirement tombstones revert (both seats):")
    for fname in ("gendex_191_batch_dom.test.mjs", "gendex_190_batch_dom.test.mjs"):
        sub(
            fname,
            r"""assertMatch(mainConfigSrc, /1\.9\.0 — THE SQL\.JS COMPAT SHIM RULE, RETIRED/, 'the retirement note never spoke');""",
            r"""// 1.9.0 — the birth tombstone: the retirement note keeps its 1.8.10 birth
  // version in webpack.main.config.js's own prose forever.
  assertMatch(mainConfigSrc, /1\.8\.10 — THE SQL\.JS COMPAT SHIM RULE, RETIRED/, 'the retirement note never spoke');""",
        )

    print("161's newer-archive seed moves to a future major (the ceiling rose with the app):")
    sub(
        "gendex_161_compat_legal.test.mjs",
        r"""    const { host, root } = await bootGate({ savedDbs, closes, loadStatus: 'ok', fromAppVersion: '1.8.20' });
    const bodyText = (host.ownerDocument || document).body.textContent || '';
    assert.match(bodyText, /last saved by v1\.8\.20/i, 'the newer-archive warning never spoke');""",
        r"""    // 1.9.0 — the seed rides a FUTURE MAJOR now: the warning speaks only
    // for an archive saved by something NEWER than this app, and 1.8.20
    // stopped being newer the day the app reached 1.9.0 (the 1.8-era
    // far-patch seed aged out with the minor bump). 2.0.0 outlives the
    // whole 1.x line.
    const { host, root } = await bootGate({ savedDbs, closes, loadStatus: 'ok', fromAppVersion: '2.0.0' });
    const bodyText = (host.ownerDocument || document).body.textContent || '';
    assert.match(bodyText, /last saved by v2\.0\.0/i, 'the newer-archive warning never spoke');""",
    )

    print("\n1.9.0 law pins seated.")


if __name__ == "__main__":
    main()
