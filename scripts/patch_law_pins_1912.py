#!/usr/bin/env python3
"""1.9.12 patch_law_pins — heals the sweep's misses and re-seats the one
law the release itself moved, the standing ritual of every release (the
198/1810/190/1911 lineage):

1. THE 1911 SUITE'S C6 RE-SEATED ONTO THE NEW DIAL LAW: the 1.9.11 suite
   pinned the ledger dial's LIVE-COMMIT road (commitLogLimit on every
   keystroke) — the exact road the 1.9.12 report retired ("it activates
   instantly, it shouldnt do that it should only update after i press on
   okay"). The check now pins the 1.9.12 law at its own seats: the
   keystroke road types the DRAFT alone, the ONE commit rides DONE's own
   close road, the parse keeps its clamp, and the footer keeps speaking
   the committed cap — the cell's seat below the logs container unchanged.

2. THE DISPLAY SEATS the sweep's title shapes never reached (the E1
   ok-title carries a prefix; the E2/E5 failure messages speak the old
   digits) — moved to 1.9.12 to match their own swept assertions.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=None) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if old not in raw:
        if new in raw:
            print(f"  {path}: already seated")
            return
        raise SystemExit(f"{path}: missing seat:\n{old[:200]}")
    raw = raw.replace(old, new) if count is None else raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


def main() -> None:
    s1911 = "scripts/gendex_1911_batch_dom.test.mjs"

    # 1 — C6 re-seated onto the 1.9.12 dial law (the draft waits for DONE)
    sub(
        s1911,
        """ok('C6 — the settings cell sits right below the logs container and commits live', () => {
  const containerAt = setm.indexOf('gd-logs-list');
  const dialAt = setm.indexOf('id="gd-log-limit"');
  assert.ok(containerAt >= 0 && dialAt > containerAt, 'the dial must come after the logs container');
  assertMatch(setm, /className="gd-input gd-logs-limit-cell"/, 'the cell lost its frame');
  assertMatch(setm, /LOGS KEPT/, 'the label lost its seat');
  assertMatch(setm, /onChange=\\{\\(e\\) => commitLogLimit\\(e\\.target\\.value\\)\\}/, 'the live commit road is missing');
  assertMatch(setm, /const clamped = clampLogLimit\\(n\\);/, 'the dial commit lost its clamp');
  assertMatch(setm, /LAST \\$\\{liveLogCap\\} KEPT/, 'the footer still speaks a flat 50');
});""",
        """ok('C6 — the settings cell sits right below the logs container; 1.9.12 — the dial waits for DONE', () => {
  const containerAt = setm.indexOf('gd-logs-list');
  const dialAt = setm.indexOf('id="gd-log-limit"');
  assert.ok(containerAt >= 0 && dialAt > containerAt, 'the dial must come after the logs container');
  assertMatch(setm, /className="gd-input gd-logs-limit-cell"/, 'the cell lost its frame');
  assertMatch(setm, /LOGS KEPT/, 'the label lost its seat');
  // 1.9.12 — THE DIAL SPEAKS ONLY WHEN DONE ANSWERS: the keystroke road
  // types the DRAFT alone (no set, no trim, no line lost mid-type); the
  // ONE commit rides DONE's own close road; the parse keeps its clamp.
  assertMatch(setm, /onChange=\\{\\(e\\) => typeLogLimit\\(e\\.target\\.value\\)\\}/, 'the keystroke road writes the setting (the instant-apply disease is back)');
  assertMatch(setm, /const doneClose = \\(\\) => \\{\\s*finishLogLimit\\(\\);\\s*onClose\\(\\);\\s*\\};/, 'the DONE commit road is missing');
  assertMatch(setm, /return clampLogLimit\\(n\\);/, 'the dial commit lost its clamp');
  assertMatch(setm, /LAST \\$\\{liveLogCap\\} KEPT/, 'the footer still speaks a flat 50');
});""",
    )

    # 2 — the display seats
    sub(s1911, "ok('E1 — the version is 1.9.11 everywhere (pkg + constants)', () => {", "ok('E1 — the version is 1.9.12 everywhere (pkg + constants)', () => {")
    sub(s1911, "'the changelog head is not the 1.9.11 entry'", "'the changelog head is not the 1.9.12 entry'")
    sub(s1911, "ok('E5 — the worklog keeps the 1.9.11 seat', () => {", "ok('E5 — the worklog keeps the 1.9.12 seat', () => {")
    sub(s1911, "'the worklog never speaks 1.9.11'", "'the worklog never speaks 1.9.12'")

    # 3 — THE 159 SUITE'S PULSE SEAT re-seated onto the dial law (the
    # class-alone law holds — the flights still speak .gd-card-pulse with
    # no .gd-card demand, the tile included — but the flight now keys on
    # the root dial the 1.9.12 report asked for)
    sub(
        "scripts/gendex_159_batch_dom.test.mjs",
        """ok('15 — the pulse seat is the class alone (the tile included)', () => {
  assert(/\\.gd-card-pulse \\{\\n  transform-origin: 50% 50%;\\n\\}\\n\\.gd-card-pulse\\[data-pressed\\] \\{\\n  animation: gd-press-pulse 620ms ease-in-out both;\\n\\}/.test(css), 'the flight still demands .gd-card');
});""",
        """ok('15 — the pulse seat is the class alone (the tile included); 1.9.12 — the flight speaks the dial', () => {
  assert(/\\.gd-card-pulse \\{\\n  transform-origin: 50% 50%;\\n\\}/.test(css), 'the base seat drifted');
  // 1.9.12 — THE PRESS DIAL: the flights key on the root attribute App
  // arms; the class alone still owns the seat (no .gd-card demand, the
  // add tile included), and the unattributed rule is RETIRED so the
  // default 'none' never flies.
  assert(/html\\[data-gd-press-mode='squish'\\] \\.gd-card-pulse\\[data-pressed\\] \\{\\n  animation: gd-press-pulse 620ms ease-in-out both;\\n\\}/.test(css), 'the jelly flight lost its class-alone seat');
  assert(/html\\[data-gd-press-mode='pulse'\\] \\.gd-card-pulse\\[data-pressed\\] \\{\\n  animation: gd-press-bloom 380ms ease-out both;\\n\\}/.test(css), 'the bloom flight lost its class-alone seat');
  assert(!/^\\.gd-card-pulse\\[data-pressed\\] \\{/m.test(css), 'an unattributed flight rule still speaks');
});""",
    )

    # 4 — THE LIVE-DRAG FIXTURES speak the ON road explicitly (the default
    # rests OFF since 1.9.12; these suites pin the FEATURE, not the default)
    for suite, at in [
        ("scripts/gendex_168_batch_dom.test.mjs", "LIVE2 — a drag previews the reorder"),
        ("scripts/gendex_170_batch_dom.test.mjs", "LIVE2 — a drop on the dragged card itself"),
        ("scripts/gendex_171_batch_dom.test.mjs", "LIVE3 — a layout-shift echo never re-arms"),
    ]:
        p = ROOT / suite
        raw = p.read_text(encoding="utf8")
        anchor = raw.index(at)
        seat = raw.index("db.settings.tosAcceptance", anchor)
        line_end = raw.index("\n", seat)
        insert = "\n      // 1.9.12 — the default rests OFF now; the fixture speaks the ON road\n      // (these suites pin the live-preview feature, not the default)\n      db.settings.liveDragPreview = true;"
        if insert.strip() in raw:
            print(f"  {suite}: already seated")
        else:
            raw = raw[:line_end] + insert + raw[line_end:]
            p.write_text(raw, encoding="utf8")
            print(f"  {suite}: the ON-road fixture seated")

    # 5 — THE 172 SUITE'S STILL-BOARD SECTION re-seated onto the flipped
    # default (fresh dbs OFF; a stored boolean survives; App threads the
    # === true polarity)
    sub(
        "scripts/gendex_172_batch_dom.test.mjs",
        """ok('the setting exists (default ON) and survives the load lane', () => {
  assert.equal(DEFAULT_SETTINGS.liveDragPreview, true, 'the default is not ON');
  assertMatch(constants, /liveDragPreview: true,/, 'the default seat is missing');
  assertMatch(helpers, /liveDragPreview:\\s*\\n?\\s*typeof rawSettings\\.liveDragPreview === 'boolean'/, 'the sanitize lane is missing');
  const db = createSafeDb({});
  assert.equal(db.settings.liveDragPreview, true, 'a fresh db lost the default');
  const dbOff = createSafeDb({ settings: { liveDragPreview: false } });
  assert.equal(dbOff.settings.liveDragPreview, false, 'a stored OFF did not survive');
});""",
        """ok('the setting exists (default OFF since 1.9.12 — "the live drag previews option default should be off") and survives the load lane', () => {
  assert.equal(DEFAULT_SETTINGS.liveDragPreview, false, 'the default is not OFF');
  assertMatch(constants, /liveDragPreview: false,/, 'the default seat is missing');
  assertMatch(helpers, /liveDragPreview:\\s*\\n?\\s*typeof rawSettings\\.liveDragPreview === 'boolean'/, 'the sanitize lane is missing');
  const db = createSafeDb({});
  assert.equal(db.settings.liveDragPreview, false, 'a fresh db previews (the 1.9.12 default rests OFF)');
  const dbOn = createSafeDb({ settings: { liveDragPreview: true } });
  assert.equal(dbOn.settings.liveDragPreview, true, 'a stored ON did not survive');
});""",
    )
    sub(
        "scripts/gendex_172_batch_dom.test.mjs",
        "assertMatch(app, /liveDragPreview=\\{db\\?\\.settings\\?\\.liveDragPreview !== false\\}/, 'App does not thread the setting');",
        "assertMatch(app, /liveDragPreview=\\{db\\?\\.settings\\?\\.liveDragPreview === true\\}/, 'App does not thread the setting');",
    )

    # 6 — THE BADGE SHAPE the sweep never reaches (the same five suites the
    # 1.9.11 patch healed; the embedded 'version-X-purple' pin falls through
    # the sweep's quoted-digit shapes every release)
    for suite in [
        "scripts/gendex_192_batch_dom.test.mjs",
        "scripts/gendex_193_batch_dom.test.mjs",
        "scripts/gendex_194_batch_dom.test.mjs",
        "scripts/gendex_195_batch_dom.test.mjs",
        "scripts/gendex_196_batch_dom.test.mjs",
    ]:
        sub(suite, "version-1.9.11-purple", "version-1.9.12-purple")

    print("patch_law_pins_1912: the suites re-seated onto the 1.9.12 laws")


if __name__ == "__main__":
    main()
