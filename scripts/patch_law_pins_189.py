#!/usr/bin/env python3
"""1.8.9 — the law-pin pass after the sweep (version_sweep_189.py moved
every live 1.8.8 pin to 1.8.9; five families need their own word):

1. THE OVER-SWEPT BIRTH TOMBSTONE — the pin that watches the 1.8.8 census
   law's own note (THE LAYOUT CENSUS in SideFlow) still speaks 1.8.8 in
   the SOURCE — the birth version stays in the law's own prose forever —
   so the pin reverts to the birth digits, exactly the way the 1.8.4 and
   1.8.8 passes taught.

2. THE README IS THE PUBLIC FACE — 1.8.9 rewrote the README whole (the
   first public release speaks features, not history; the changelog keeps
   the story), so every paragraph pin that watched the retired version
   roll — the swept 1.8.9 taglines AND the older 1.6.5 / 1.7.4 / 1.7.7 /
   1.8.3 / 1.8.4 / 1.8.5 / 1.8.6 seats — retires to the one absence law:
   no version-history paragraph may ever open a line of the README.

3. THE TERMS MOVE TO 1.0.5 — legal.js bumped TOS_VERSION 1.0.4 -> 1.0.5
   with the storage report (the library lives in SQLite now; the JSON file
   is the legacy seat, read once, added, remembered), so every pin on the
   live constant follows the live seat, and 166's P2 learns the new asking
   arithmetic: a 1.0.4 record now RE-ASKS, and the resting seat belongs to
   1.0.5.

4. THE LOAD LEDGER LEARNS 'migrated' — 161's status allow-list pin follows
   the new verdict (the one-time import door speaks at the boot).

5. THE PACKAGING BATTERY'S SEEDED READ — 162's C2 law follows the house:
   a seeded legacy JSON archive is folded in at the priming door, so the
   load speaks 'migrated' and the stamps ride the meta table, never the
   sections.

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


ABSENCE = (
    "  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it\n"
    "  // (the first public release speaks features, not history; the changelog\n"
    "  // keeps the story). The paragraph's old seat is gone by law.\n"
    "  assert.ok(!/^1\\.\\d+\\.\\d+ — /m.test(%s), 'the version roll retired with the public README');"
)


def readme_absence(var: str) -> str:
    return ABSENCE % var


def main() -> None:
    print("the birth tombstone reverts:")

    # 1. the census law's own note speaks its 1.8.8 birth in the source
    sub(
        "gendex_189_batch_dom.test.mjs",
        r"/1\.8\.9 — THE LAYOUT CENSUS \(",
        r"/1\.8\.8 — THE LAYOUT CENSUS \(",
    )

    print("\nthe README is the public face (the version roll retires):")

    # the swept tagline pins (10 suites, one seat each)
    for fname in [
        "gendex_179_batch_dom.test.mjs",
        "gendex_180_batch_dom.test.mjs",
        "gendex_181_batch_dom.test.mjs",
        "gendex_182_batch_dom.test.mjs",
        "gendex_183_batch_dom.test.mjs",
        "gendex_184_batch_dom.test.mjs",
        "gendex_185_batch_dom.test.mjs",
        "gendex_186_batch_dom.test.mjs",
        "gendex_187_batch_dom.test.mjs",
        "gendex_189_batch_dom.test.mjs",
    ]:
        sub(
            fname,
            "  assertMatch(readme, /^1\\.8\\.9 — the library's own house\\./m, 'the README paragraph never spoke');",
            readme_absence("readme"),
        )

    # the older roll seats (their own births, retired by the same law)
    sub(
        "gendex_166_batch_dom.test.mjs",
        "  assert.match(readmeSrc, /1\\.7\\.4 — the trim's own shape/, 'the README note never arrived (the 1.6.0 history note stays)');",
        readme_absence("readmeSrc"),
    )
    sub(
        "gendex_167_batch_dom.test.mjs",
        "  assert.match(readmeSrc, /1\\.6\\.5 — the prompt comes home/, 'the README note never arrived (1.6.4: the sweep moved the current-note pin)');",
        readme_absence("readmeSrc"),
    )
    sub(
        "gendex_168_batch_dom.test.mjs",
        "  assert.match(readmeSrc, /1\\.6\\.5 — the prompt comes home/, 'the README note never landed');",
        readme_absence("readmeSrc"),
    )
    sub(
        "gendex_169_batch_dom.test.mjs",
        "  assert.match(readmeSrc, /1\\.6\\.5 — the prompt comes home/, 'the README note never landed');",
        readme_absence("readmeSrc"),
    )
    sub(
        "gendex_176_batch_dom.test.mjs",
        "  assertMatch(src('README.md'), /1\\.7\\.7 — the trim's own voice, and the settings breathe\\./, 'the README 1.7.7 paragraph never landed');",
        "  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it\n"
        "  // (the first public release speaks features, not history; the changelog\n"
        "  // keeps the story). The paragraph's old seat is gone by law.\n"
        "  assert.ok(!/^1\\.\\d+\\.\\d+ — /m.test(src('README.md')), 'the version roll retired with the public README');",
    )
    sub(
        "gendex_177_batch_dom.test.mjs",
        "  assertMatch(readme, /1\\.7\\.7 — the trim's own voice, and the settings breathe\\./, 'the README paragraph never landed');",
        readme_absence("readme"),
    )
    sub(
        "gendex_185_batch_dom.test.mjs",
        "  assertMatch(readme, /^1\\.8\\.3 — the same breath\\./m, 'the 1.8.3 README paragraph lost its seat');",
        readme_absence("readme"),
    )
    sub(
        "gendex_186_batch_dom.test.mjs",
        "  assertMatch(readme, /^1\\.8\\.4 — the cover\\./m, 'the 1.8.4 README paragraph lost its seat');",
        readme_absence("readme"),
    )
    sub(
        "gendex_187_batch_dom.test.mjs",
        "  assertMatch(readme, /^1\\.8\\.5 — the cover breathes\\./m, 'the 1.8.5 README paragraph lost its seat');",
        readme_absence("readme"),
    )
    sub(
        "gendex_189_batch_dom.test.mjs",
        "  assertMatch(readme, /^1\\.8\\.6 — the patient wheel\\./m, 'the 1.8.6 README paragraph lost its seat');",
        readme_absence("readme"),
    )

    print("\nthe terms move to 1.0.5 (the storage report):")

    # 161 D1 — the pin on the live constant
    sub(
        "gendex_161_compat_legal.test.mjs",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.4';/.test(legalSrc), 'TOS_VERSION is missing or moved');",
        "  // 1.8.9 — the terms moved to 1.0.5 (the storage report); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.5';/.test(legalSrc), 'TOS_VERSION is missing or moved');",
    )

    # 163 A4 + B2
    sub(
        "gendex_163_batch_dom.test.mjs",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.4';/.test(legalConstSrc), 'the terms version never moved to 1.0.4');",
        "  // 1.8.9 — the terms moved to 1.0.5 (the storage report); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.5';/.test(legalConstSrc), 'the terms version never moved to 1.0.5');",
    )
    sub(
        "gendex_163_batch_dom.test.mjs",
        "  assert.equal(TOS_VERSION, '1.0.4'); // 1.8.8 — the platform + SQLite pass moved the seat",
        "  assert.equal(TOS_VERSION, '1.0.5'); // 1.8.9 — the storage report moved the seat",
    )

    # 164 A1 + P1
    sub(
        "gendex_164_batch_dom.test.mjs",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.4';/.test(legalConstSrc), 'the terms version never moved to 1.0.4');",
        "  // 1.8.9 — the terms moved to 1.0.5 (the storage report); the pin follows the live seat.\n"
        "  assert(/export const TOS_VERSION = '1\\.0\\.5';/.test(legalConstSrc), 'the terms version never moved to 1.0.5');",
    )
    sub(
        "gendex_164_batch_dom.test.mjs",
        "  assert.equal(TOS_VERSION, '1.0.4'); // 1.8.8 — the platform + SQLite pass moved the seat",
        "  assert.equal(TOS_VERSION, '1.0.5'); // 1.8.9 — the storage report moved the seat",
    )

    # 166 I1 + P2
    sub(
        "gendex_166_batch_dom.test.mjs",
        "  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass); the pin follows the live seat.\n"
        "  assert.match(legalSrc, /export const TOS_VERSION = '1\\.0\\.4';/, 'the terms version never moved to 1.0.4');",
        "  // 1.8.9 — the terms moved to 1.0.5 (the storage report); the pin follows the live seat.\n"
        "  assert.match(legalSrc, /export const TOS_VERSION = '1\\.0\\.5';/, 'the terms version never moved to 1.0.5');",
    )
    sub(
        "gendex_166_batch_dom.test.mjs",
        """ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  // 1.8.8 — the terms moved to 1.0.4 (the platform + SQLite pass): the
  // 1.0.3 record now re-asks too, and the resting seat belongs to 1.0.4.
  assert.equal(TOS_VERSION, '1.0.4');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const prior = createSafeDb({ settings: { tosAcceptance: { version: '1.0.3', at: 12345 } } });
  assert.notEqual(prior.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.3 record must not count as current either (the 1.8.8 bump)');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.4', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.4 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.4');
  assert.equal(PRIVACY_DOC.version, '1.0.4');
});""",
        """ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  // 1.8.9 — the terms moved to 1.0.5 (the storage report): the 1.0.4
  // record now re-asks too, and the resting seat belongs to 1.0.5.
  assert.equal(TOS_VERSION, '1.0.5');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const prior = createSafeDb({ settings: { tosAcceptance: { version: '1.0.4', at: 12345 } } });
  assert.notEqual(prior.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.4 record must not count as current either (the 1.8.9 bump)');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.5', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.5 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.5');
  assert.equal(PRIVACY_DOC.version, '1.0.5');
});""",
    )

    print("\n189's own B-section follows the new storage story:")

    sub(
        "gendex_189_batch_dom.test.mjs",
        """ok('B1 — the terms moved to 1.0.4 (a meaningful change, the gate re-asks)', () => {
  assertMatch(legal, /export const TOS_VERSION = '1\\.0\\.4';/, 'the terms version never moved');
  assertMatch(legal, /1\\.8\\.9 — '1\\.0\\.3' -> '1\\.0\\.4' \\("update tos and data privacy/, 'the bump note never spoke');
  assertMatch(legal, /A meaningful change: the version moves and every library meets/, 'the re-ask word never spoke');
});""",
        """ok('B1 — the terms moved to 1.0.5 (a meaningful change, the gate re-asks)', () => {
  assertMatch(legal, /export const TOS_VERSION = '1\\.0\\.5';/, 'the terms version never moved');
  assertMatch(legal, /1\\.8\\.9 — '1\\.0\\.4' -> '1\\.0\\.5' \\(the storage report/, 'the bump note never spoke');
  assertMatch(legal, /A meaningful change: the version moves and every library meets/, 'the re-ask word never spoke');
});""",
    )
    sub(
        "gendex_189_batch_dom.test.mjs",
        """ok('B3 — the JSON library tells what it is (one plain human-readable file)', () => {
  assert.ok(legal.includes('stored as one plain, human-readable JSON file you can open, inspect, and copy with any text editor'), 'the JSON word never spoke');
});""",
        """ok('B3 — the SQLite library tells what it is (one transactional database file)', () => {
  assert.ok(legal.includes('stored as ONE SQLite database file'), 'the SQLite word never spoke');
  assert.ok(legal.includes('the file is transactional (a save is either written whole or not at all)'), 'the transactional word never spoke');
  assert.ok(legal.includes('you can open and inspect it with any common SQLite tool'), 'the tool word never spoke');
});""",
    )
    sub(
        "gendex_189_batch_dom.test.mjs",
        """ok('B4 — the SQLite history is told whole (the old file, and its rights)', () => {
  assert.ok(legal.includes('releases before the JSON library kept their data in a SQLite database file (a binary .db file) in this same folder'), 'the old database never spoke its name');
  assert.ok(legal.includes('The current app never reads it, never writes it, and never sends it anywhere'), 'the old file never spoke its rights');
  assert.ok(legal.includes('you are free to delete it once you are happy with your JSON library'), 'the deletion word never spoke');
});""",
        """ok('B4 — the one-time import is told whole (read once, added, remembered)', () => {
  assert.ok(legal.includes('releases before the SQLite library kept their data in a plain JSON file (gendex_db.json) in this same folder'), 'the legacy seat never spoke its name');
  assert.ok(legal.includes('reads that file once and ADDS everything it had'), 'the add word never spoke');
  assert.ok(legal.includes('stamps its own memory of the import inside the database so it is never done twice'), 'the never-twice word never spoke');
  assert.ok(legal.includes('the JSON file is never read and never written again'), 'the retired word never spoke');
  assert.ok(legal.includes('you are free to delete it once you are happy with your SQLite library'), 'the deletion word never spoke');
});""",
    )
    sub(
        "gendex_189_batch_dom.test.mjs",
        """ok('B5 — the factory reset names the old file too', () => {
  assert.ok(legal.includes('(including any old SQLite file an earlier version left there)'), 'the deletion note never named the SQLite file');
});""",
        """ok('B5 — the factory reset names the old file too', () => {
  assert.ok(legal.includes('(including any old JSON file an earlier version left there)'), 'the deletion note never named the JSON file');
});""",
    )

    print("\nthe load ledger learns 'migrated':")

    sub(
        "gendex_161_compat_legal.test.mjs",
        "  assert(/\\['ok', 'repaired', 'tmp', 'backup', 'corrupt', 'missing'\\]\\.includes\\(res\\.status\\)/.test(appSrc), 'the status allow-list is missing');",
        "  // 1.8.9 — THE IMPORT DOOR'S OWN VERDICT joins the ledger ('migrated', spoken once per session)\n"
        "  assert(/\\['ok', 'repaired', 'tmp', 'backup', 'corrupt', 'missing', 'migrated'\\]\\.includes\\(res\\.status\\)/.test(appSrc), 'the status allow-list is missing');",
    )

    print("\nthe packaging battery's seeded read follows the house:")

    sub(
        "gendex_162_pack_main.test.mjs",
        """  const { handlers } = await bootMain(path.join(workDir, 'production', 'index.js'), { seed: seeded });
  const r = await handlers['db:load']();
  assert.equal(r.status, 'ok', `seeded seat said "${r.status}"`);
  assert.equal(r.fromAppVersion, '1.5.5', 'the stamp did not ride the read');
  assert.ok(r.db && Array.isArray(r.db.characters) && r.db.characters[0].name === 'Probe Burrito', 'the archive did not read whole');
  assert.equal(r.db.appVersion, '1.5.5', 'the raw stamp fields did not survive the door');
});""",
        """  const { handlers } = await bootMain(path.join(workDir, 'production', 'index.js'), { seed: seeded });
  const r = await handlers['db:load']();
  // 1.8.9 — THE HOUSE ANSWERS FIRST: a seeded legacy JSON archive is FOLDED
  // IN at the boot's priming door (the one-time import), so the load speaks
  // 'migrated' — and the stamps ride the database's own meta table now,
  // never the sections the renderer reads.
  assert.equal(r.status, 'migrated', `seeded seat said "${r.status}"`);
  assert.equal(r.fromAppVersion, '1.5.5', 'the stamp did not ride the read');
  assert.ok(r.db && Array.isArray(r.db.characters) && r.db.characters[0].name === 'Probe Burrito', 'the archive did not read whole');
  assert.equal(r.db.appVersion, undefined, 'the raw stamp fields retired to the house meta table');
});""",
    )

    print("\nthe second-pass finds (178's anchored paragraph, 164's badge seat):")

    # 178 V1 — the anchored 1.7.7 paragraph pin (a /m form the first pass
    # never met) retires to the public-face absence law
    sub(
        "gendex_178_batch_dom.test.mjs",
        "  assertMatch(readme, /^1\\.7\\.7 — the trim's own voice, and the settings breathe\\./m, 'the README 1.7.7 paragraph never spoke');",
        readme_absence("readme"),
    )

    # 164 B1 — the badge's seat in the JSX wears the family beside its own
    # class now (1.8.9: THE BADGE WEARS THE WALL'S OWN CLOTH)
    sub(
        "gendex_164_batch_dom.test.mjs",
        "  const badgeBlock = setSrc.match(/className=\"gd-about-credit-badge\"[\\s\\S]{0,500}?<\\/button>/)?.[0] || '';",
        "  // 1.8.9 — the badge rides the link family beside its own class\n"
        "  const badgeBlock = setSrc.match(/className=\"gd-about-link gd-about-credit-badge\"[\\s\\S]{0,500}?<\\/button>/)?.[0] || '';",
    )

    print("\nthe third-pass find (the sweep's apostrophe met three single-quoted pins):")

    # the new tag ("The Library's Own House") carries an APOSTROPHE, and the
    # sweep wrote it into three suites' single-quoted changelog-head pins —
    # a string literal ended mid-word. The pin keeps its voice with the
    # escaped apostrophe (regex-literal seats never needed the cure).
    for fname in [
        "gendex_159_batch_dom.test.mjs",
        "gendex_160_batch_dom.test.mjs",
        "gendex_165_batch_dom.test.mjs",
    ]:
        sub(
            fname,
            "'## 1.8.9 — The Library's Own House'",
            "'## 1.8.9 — The Library\\'s Own House'",
        )

    # 165 C1 — the badge's JSX seat wears the family beside its own class
    # too (the same find as 164 B1, one suite over)
    sub(
        "gendex_165_batch_dom.test.mjs",
        "  const badgeBlock = setSrc.match(/className=\"gd-about-credit-badge\"[\\s\\S]{0,500}?<\\/button>/)?.[0] || '';",
        "  // 1.8.9 — the badge rides the link family beside its own class\n"
        "  const badgeBlock = setSrc.match(/className=\"gd-about-link gd-about-credit-badge\"[\\s\\S]{0,500}?<\\/button>/)?.[0] || '';",
    )

    print("\nlaw pins re-seated for 1.8.9.")


if __name__ == "__main__":
    main()
