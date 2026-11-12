// 1.5.5 batch — The Archive Keeps Its Promise.
// The reported items, each pinned at its root law:
//   A. the database load runs the salvage ladder (BOM / repair / tmp /
//      backup), sets corrupt files aside, and never silently defaults
//   B. every save carries the archive's own stamp (appVersion/savedAt/
//      schemaVersion) and the boot warns on a NEWER-stamped library
//   C. the renderer's silent "fresh start" catch is dead (bridge guard)
//   D. the TERMS & PRIVACY gate asks once per terms version, saves on
//      accept, closes on decline, and re-asks after a decline
//   E. the About tab gains CREDITS (Duskfallcrew, beta tester) + LEGAL
// Plus: past-version databases (0.23.0 / 1.4.6 / 1.4.9 / 1.5.4 shapes)
// load their whole world intact through createSafeDb.

import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};
assert.ok = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.match = (text, re, msg) => {
  if (!re.test(String(text))) throw new Error(msg || `expected ${re} in the text`);
};

const appSrc = src('src/App.jsx');
const mainSrc = src('src/main.js');
const setSrc = src('src/components/SettingsModal.jsx');
const modalSrc = src('src/components/Modal.jsx');
const legalSrc = src('src/constants/legal.js');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const dbioSrc = src('src/utils/dbio.js');
const css = src('src/index.css');

// ---------------------------------------------------------------------------
// A. THE ARCHIVE'S OWN DOOR — source laws + pure dbio passes
// ---------------------------------------------------------------------------
ok('A1 — main.js owns the ladder (dbio wired as a static import, tmp + backup seats passed)', () => {
  // 1.5.6 — the wiring is an ESM import now, not a require: src/main.js
  // lives under src/package.json {"type":"module"}, where webpack leaves
  // require() calls raw and un-bundled (the 1.5.5 packaged-app boot
  // crash). See the gendex_162 packaging battery for the full law.
  assert(/import\s*\{[^}]*readDatabaseFile[^}]*\}\s*from\s*'\.\/utils\/dbio\.js'/.test(mainSrc), 'main.js never imports dbio');
  assert(/readDatabaseFile\(DB_IO, \{/.test(mainSrc), 'db:load never runs the ladder');
  assert(/tmpFile: `\$\{DB_FILE\}\.tmp`/.test(mainSrc), 'the tmp rung is missing');
  assert(/backupDir: BACKUP_DIR/.test(mainSrc), 'the backup rung is missing');
  // the naked parse must be gone from db:load itself (peekThemeBg's own
  // guarded peek is a read-only color glance, never the renderer's db).
  const loadAt = mainSrc.indexOf("ipcMain.handle('db:load', () => {");
  const loadBlock = mainSrc.slice(loadAt, mainSrc.indexOf("ipcMain.handle('db:save'", loadAt));
  assert(!/JSON\.parse\(fs\.readFileSync\(DB_FILE/.test(loadBlock), 'the old naked parse survived inside db:load');
  assert(/readDatabaseFile\(DB_IO, \{/.test(loadBlock), 'the ladder never runs inside db:load');
});

// The pure layer, exercised against real staged folders.
const dbio = await import('../src/utils/dbio.js');
const join = path.join;
const IO = { fs: await import('node:fs'), join };

const stage = () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'gd-dbio-'));
  return {
    dir,
    dbFile: join(dir, 'gendex_db.json'),
    tmpFile: join(dir, 'gendex_db.json.tmp'),
    backupDir: join(dir, 'gendex_backups'),
  };
};
const GOOD = JSON.stringify({ characters: [{ id: 'c1', name: 'amy' }], settings: { theme: 'carbon' } });

ok('A2 — a clean file reads direct (status ok)', () => {
  const s = stage();
  writeFileSync(s.dbFile, GOOD, 'utf8');
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'ok');
  assert.equal(r.db.characters[0].name, 'amy');
});

ok('A3 — a UTF-8 BOM no longer reads as total damage (the Notepad case)', () => {
  const s = stage();
  writeFileSync(s.dbFile, '\uFEFF' + GOOD, 'utf8');
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'ok', `status was ${r.status}`);
  assert.equal(r.db.characters[0].name, 'amy');
});

ok('A4 — junk on an end reads repaired (editor notes, stray tails)', () => {
  const s = stage();
  writeFileSync(s.dbFile, 'hand edit, do not delete\n' + GOOD + '\n(saved 2026-10-18)', 'utf8');
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'repaired', `status was ${r.status}`);
  assert.equal(r.db.characters[0].name, 'amy');
});

ok('A5 — a truncated file falls through to the tmp rung', () => {
  const s = stage();
  const cut = GOOD.slice(0, GOOD.length - 12); // mid-string cut: nothing parses
  writeFileSync(s.dbFile, cut, 'utf8');
  writeFileSync(s.tmpFile, GOOD, 'utf8');
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'tmp', `status was ${r.status}`);
  assert.equal(r.db.characters[0].name, 'amy');
});

ok('A6 — the backup shelf answers newest-first, naming its rescuer', () => {
  const s = stage();
  writeFileSync(s.dbFile, '{broken beyond', 'utf8');
  mkdirSync(s.backupDir, { recursive: true });
  writeFileSync(join(s.backupDir, 'gendex_db-20260101-000000.json'), JSON.stringify({ characters: [{ id: 'old' }] }), 'utf8');
  writeFileSync(join(s.backupDir, 'gendex_db-20260102-120000.json'), JSON.stringify({ characters: [{ id: 'new' }] }), 'utf8');
  writeFileSync(join(s.backupDir, 'notes.txt'), 'not a backup');
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'backup', `status was ${r.status}`);
  assert.equal(r.db.characters[0].id, 'new', 'an older backup answered first');
  assert.equal(r.recoveredFrom, 'gendex_db-20260102-120000.json');
});

ok('A7 — a seat where nothing parses says corrupt (never a silent default)', () => {
  const s = stage();
  writeFileSync(s.dbFile, 'nonsense', 'utf8');
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'corrupt');
  assert.equal(r.db, null);
});

ok('A8 — the corrupt file is SET ASIDE, never overwritten', () => {
  const s = stage();
  writeFileSync(s.dbFile, 'nonsense', 'utf8');
  const name = dbio.setAsideCorruptDb(IO, s.dbFile, 'gendex_db.corrupt-20261018-120000.json');
  assert.equal(name, 'gendex_db.corrupt-20261018-120000.json');
  assert(!existsSync(s.dbFile), 'the corrupt file still sits at the main seat');
  assert.equal(readFileSync(join(s.dir, 'gendex_db.corrupt-20261018-120000.json'), 'utf8'), 'nonsense', 'the bytes did not survive the set-aside');
});

ok('A9 — an empty seat is a true missing (fresh start only when nothing exists)', () => {
  const s = stage();
  const r = dbio.readDatabaseFile(IO, s);
  assert.equal(r.status, 'missing');
});

ok('A10 — db:load tells the renderer the whole story + corrupt sets aside', () => {
  assert(/status === 'corrupt'/.test(mainSrc) && /setAsideCorruptDb\(DB_IO, DB_FILE, asideName\)/.test(mainSrc), 'the corrupt branch is missing');
  assert(/corruptSetAside/.test(mainSrc), 'the set-aside is never reported');
  for (const field of ['status', 'fromAppVersion', 'recoveredFrom']) {
    assert(new RegExp(`return \\{[\\s\\S]*?${field}`).test(mainSrc), `db:load never speaks ${field}`);
  }
  assert(/parseDbText\(dbEntry\.data\.toString\('utf8'\)\)/.test(mainSrc), 'the import door never joined the ladder');
});

// ---------------------------------------------------------------------------
// B. THE ARCHIVE'S OWN STAMP — every save carries its story
// ---------------------------------------------------------------------------
ok('B1 — writeDb stamps every save (main is the single writer)', () => {
  assert(/stampDatabaseForSave\(db, app\.getVersion\(\)\)/.test(mainSrc), 'the save stamp is missing');
  assert(/stampDatabaseForSave\(db, app\.getVersion\(\)\)/.test(mainSrc.replace(/\n/g, '\n')), 'the export stamp is missing (checked in B3)');
});

ok('B2 — the stamp speaks appVersion / savedAt / schemaVersion, non-destructively', () => {
  const base = { characters: [1], settings: { theme: 'carbon' } };
  const out = dbio.stampDatabaseForSave(base, '1.6.2', 12345);
  assert.equal(out.appVersion, '1.6.2');
  assert.equal(out.savedAt, 12345);
  assert.equal(out.schemaVersion, dbio.DB_SCHEMA_VERSION);
  assert.equal(out.characters.length, 1, 'the stamp touched the archive');
  assert.equal(base.appVersion, undefined, 'the source db was mutated');
});

ok('B3 — the export archive carries the stamp too', () => {
  assert(/JSON\.stringify\(stampDatabaseForSave\(db, app\.getVersion\(\)\), null, 2\)/.test(mainSrc), 'the export never stamps');
});

ok('B4 — readAppVersion tolerates the pre-stamp era and a leading v', () => {
  assert.equal(dbio.readAppVersion({}), '');
  assert.equal(dbio.readAppVersion(null), '');
  assert.equal(dbio.readAppVersion({ appVersion: 'v1.6.2' }), '1.6.2');
});

ok('B5 — cmpVersions compares numerically, never stringwise', () => {
  assert.equal(dbio.cmpVersions('1.7.10', '1.6.2'), 1);
  assert.equal(dbio.cmpVersions('1.6.2', '1.7.10'), -1);
  assert.equal(dbio.cmpVersions('v1.6.2', '1.6.2'), 0);
  assert.equal(dbio.cmpVersions('', '1.6.2'), -1);
});

ok('B6 — the boot warns when the archive is NEWER than the app', () => {
  assert(/cmpVersions\(info\.fromAppVersion, APP\.version\) > 0/.test(appSrc), 'the newer-archive check is missing');
  assert(/newer than this app/.test(appSrc), 'the warning never speaks');
});

ok('B7 — the renderer parks the load verdict and speaks it on the wake-up', () => {
  assert(/dbLoadInfoRef/.test(appSrc), 'the load ledger is missing');
  for (const verdict of ['repaired', 'tmp', 'backup', 'corrupt']) {
    assert(new RegExp(`info\\.status === '${verdict}'`).test(appSrc), `the ${verdict} verdict is never spoken`);
  }
  assert(/recovered from backup/.test(appSrc) && /set aside as/.test(appSrc), 'a verdict lost its story');
});

// ---------------------------------------------------------------------------
// C. THE BRIDGE GUARD — no silent fresh start when the preload died
// ---------------------------------------------------------------------------
ok('C1 — a missing window.api paints the hard screen, never a default library', () => {
  assert(/const bridgeDown = !api;/.test(appSrc), 'the bridge guard is missing');
  assert(/APP SUPPORT FAILED TO LOAD/.test(appSrc), 'the guard screen never speaks');
  assert(/if \(bridgeDown\) return undefined;/.test(appSrc), 'the boot still runs without a bridge');
  const guardAt = appSrc.indexOf('if (bridgeDown) {');
  const returnAt = appSrc.indexOf('return (\n    <MotionConfig', guardAt);
  assert(guardAt !== -1 && returnAt !== -1, 'the guard render went missing');
  // the guard must sit AFTER every hook (a conditional return between hooks
  // would be a violation) — the LAST hook (the render-time mirror is not a
  // hook; check the final useEffect cluster) must precede it.
  const lastHook = appSrc.lastIndexOf('useEffect(', guardAt);
  assert(lastHook !== -1 && lastHook < guardAt, 'the guard renders before a hook seat');
});

ok('C2 — the old silent catch is annotated, and the verdict fields are additive', () => {
  // 1.8.9 — THE IMPORT DOOR'S OWN VERDICT joins the ledger ('migrated', spoken once per session)
  assert(/\['ok', 'repaired', 'tmp', 'backup', 'corrupt', 'missing', 'migrated'\]\.includes\(res\.status\)/.test(appSrc), 'the status allow-list is missing');
});

// ---------------------------------------------------------------------------
// D. THE TERMS & PRIVACY GATE — asks once per terms version
// ---------------------------------------------------------------------------
ok('D1 — the terms version is its own number, unhooked from the app version', () => {
  // 1.9.1 — the terms moved to 1.0.6 (the paper house); the pin follows the live seat.
  assert(/export const TOS_VERSION = '1\.0\.6';/.test(legalSrc), 'TOS_VERSION is missing or moved');
  assert(!/TOS_VERSION = APP\.version/.test(legalSrc), 'the terms version is tied to the app version');
  assert(/version: '1\.9\.19',/.test(constSrc), 'the app version pin drifted');
});

ok('D2 — the gate mounts when the acceptance record does not match', () => {
  assert(/acc\.version !== TOS_VERSION/.test(appSrc) && /setLegalGate\(true\)/.test(appSrc), 'the mismatch law is missing');
});

ok('D3 — the acceptance record survives the sanitizer (or nulls, so the gate asks)', () => {
  assert(/tosAcceptance:/.test(helpersSrc), 'the sanitize law is missing');
  assert(/tosAcceptance: null,/.test(constSrc), 'the default seat is missing');
});

ok('D4 — ACCEPT writes through the settings machinery AND saves immediately', () => {
  const acceptAt = appSrc.indexOf("const acceptLegal = useCallback(");
  const block = appSrc.slice(acceptAt, appSrc.indexOf('}, [setSetting, saveDb, setStatusTransient]);', acceptAt));
  assert(/setSetting\('tosAcceptance', \{ version: TOS_VERSION, at: Date\.now\(\), appVersion: APP\.version \}\)/.test(block), 'the record write is missing');
  assert(/saveDb\(true\)/.test(block), 'the immediate save is missing');
});

ok('D5 — DECLINE closes the app without saving (the next launch asks again)', () => {
  const declineAt = appSrc.indexOf("const declineLegal = useCallback(");
  const block = appSrc.slice(declineAt, appSrc.indexOf('}, [api]);', declineAt));
  assert(/api\?\.forceClose\?\.\(\)/.test(block), 'the close is missing');
  assert(!/saveDb/.test(block), 'decline must never save');
});

ok('D6 — the gate owns the stage (update window waits, no accidental exits)', () => {
  assert(/if \(legalGate\) return;/.test(appSrc), 'the update window stopped waiting');
  const legalModalSrc = src('src/components/LegalModal.jsx');
  assert(/closeLocked\n\s+hideClose/.test(legalModalSrc), 'the gate window is not close-locked + headless');
  const modalGate = /hideClose = false/.test(modalSrc) && /\{!hideClose && \(/.test(modalSrc);
  assert(modalGate, 'Modal never learned to hide the close key');
});

ok('D7 — the gate renders ABOVE the update window (later sibling wins)', () => {
  const updateAt = appSrc.indexOf('<UpdateModal fromVersion={updateNotice.from}');
  const gateAt = appSrc.indexOf('<LegalModal variant="gate"');
  assert(updateAt !== -1 && gateAt !== -1 && gateAt > updateAt, 'the gate does not stack above the crossing');
});

ok('D8 — the gate speaks the report\'s own flow (view by clicking, acknowledge, decline-confirm)', () => {
  const legalModalSrc = src('src/components/LegalModal.jsx');
  assert(/variant="gate" — |variant === 'gate'/.test(legalModalSrc) || /isGate = variant === 'gate'/.test(legalModalSrc), 'the gate posture is missing');
  assert(/TERMS OF SERVICE/.test(legalModalSrc) && /DATA PRIVACY NOTICE/.test(legalModalSrc), 'the document cards are missing');
  assert(/onOpen=\{\(\) => setPage\('tos'\)\}/.test(legalModalSrc) && /onOpen=\{\(\) => setPage\('privacy'\)\}/.test(legalModalSrc), 'the cards are not clickable');
  assert(/ACKNOWLEDGE &amp; ACCEPT|ACKNOWLEDGE & ACCEPT/.test(legalModalSrc), 'the acknowledge key is missing');
  assert(/DECLINE &amp; CLOSE|DECLINE & CLOSE/.test(legalModalSrc), 'the decline confirm is missing');
  assert(/KEEP USING/.test(legalModalSrc), 'the decline confirm lost its way back');
});

ok('D9 — the legal texts say what they must (local-first, the two network exceptions)', () => {
  assert(/TERMS OF SERVICE/.test(legalSrc) && /DATA PRIVACY NOTICE/.test(legalSrc));
  const privacy = legalSrc.slice(legalSrc.indexOf('PRIVACY_DOC'));
  assert(/never leaves your computer/i.test(privacy), 'the local-first headline is missing');
  assert(/api\.github\.com/.test(privacy), 'the update-check exception is not disclosed');
  assert(/turned fully OFF|switched off|turned off/i.test(privacy), 'the off switch is not stated');
  assert(/no accounts, no telemetry|no telemetry, no analytics/i.test(privacy), 'the never-collects law is missing');
  const tos = legalSrc.slice(legalSrc.indexOf('TOS_DOC'), legalSrc.indexOf('PRIVACY_DOC'));
  assert(/MIT License/.test(tos), 'the license is not stated');
  assert(/as is|as-is/i.test(tos) && /without warranty of any kind/i.test(tos), 'the no-warranty clause is missing');
  assert(/not liable|not responsible/i.test(tos), 'the liability cap is missing');
  assert(/13/.test(tos), 'the age note is missing');
});

// ---------------------------------------------------------------------------
// E. THE ABOUT ADDITIONS — credits + legal shelf
// ---------------------------------------------------------------------------
ok('E1 — the thanks section sits below SUPPORT with Duskfallcrew as beta tester (1.5.8: below LEGAL, renamed SPECIAL THANKS)', () => {
  const supportAt = setSrc.indexOf('<div className="gd-about-sec">SUPPORT</div>');
  const creditsAt = setSrc.indexOf('<div className="gd-about-sec">SPECIAL THANKS</div>');
  assert(supportAt !== -1 && creditsAt !== -1 && creditsAt > supportAt, 'SPECIAL THANKS is not below SUPPORT');
  assert(/DUSKFALLCREW/.test(setSrc), 'the tester name is missing');
  assert(/BETA TESTER/.test(setSrc), 'the role is missing');
  assert(/duskAvatar/.test(setSrc) && /dusk_avatar\.jpg/.test(setSrc), 'the emblem is not wired');
});

ok('E2 — the LEGAL shelf keeps both documents one click away (1.5.8: LEGAL above the thanks)', () => {
  const creditsAt = setSrc.indexOf('<div className="gd-about-sec">SPECIAL THANKS</div>');
  const legalAt = setSrc.indexOf('<div className="gd-about-sec">LEGAL</div>');
  assert(legalAt !== -1 && creditsAt !== -1 && legalAt < creditsAt, 'LEGAL is not above SPECIAL THANKS');
  assert(/setLegalView\('tos'\)/.test(setSrc) && /setLegalView\('privacy'\)/.test(setSrc), 'a reader key is missing');
  assert(/variant="view"/.test(setSrc), 'the read-only reader is not wired');
});

ok('E3 — the credits + legal furniture speaks the house CSS', () => {
  for (const cls of ['.gd-about-credit', '.gd-about-credit-ava', '.gd-about-credit-badge', '.gd-legal-card', '.gd-legal-doc', '.gd-legal-h', '.gd-legal-li-dot']) {
    assert(css.includes(cls), `${cls} never landed in the CSS`);
  }
  assert(/border-radius: 50%;/.test(css.match(/\.gd-about-credit-ava \{[\s\S]*?\n\}/)?.[0] || ''), 'the emblem is not round');
});

// ---------------------------------------------------------------------------
// F. PAST-VERSION COMPATIBILITY — old databases keep their whole world
// ---------------------------------------------------------------------------
const { createSafeDb } = await import('../src/utils/helpers.js');
const { TOS_VERSION } = await import('../src/constants/legal.js');

const pastDb = (over = {}) => ({
  // a 0.23.0-era seat: single texture string, no tagPosition, kintsugi +
  // mumei + legacy trims, workspace texture, toolbarGradient
  settings: {
    theme: 'zine',
    texture: 'dots',
    workspace: 'grid',
    toolbarGradient: 'satin',
    zoom: 2,
    defaultSortMode: 'custom',
    tagScale: 1.2,
    cardRatio: { w: 3, h: 4 },
    ...over.settings,
  },
  classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
  tags: [{ id: 't1', name: 'wip', color: '#ffd400', trim: 'point' }],
  stamps: [{ id: 'tpl-a', image: 'guild.png', name: 'guild', createdAt: 1 }],
  characters: [
    {
      id: 'c1', name: 'amy', classId: 'cl1', tags: ['t1'],
      cardTrim: 'scales', cardFinish: 'kintsugi', cardFinishOnImage: true,
      stamps: [{ id: 's1', image: 'guild.png', name: 'guild' }],
      versions: [{ id: 'v1', label: 'V1', images: [{ file: 'a.png' }], parts: [{ id: 'p1', name: 'body', content: 'soft', include: true }] }],
    },
    {
      id: 'c2', name: 'ren', classId: 'cl1', cardFinish: 'mumei',
      versions: [{ id: 'v1', label: 'V1', images: [] }],
    },
  ],
  ...over,
});

ok('F1 — a 0.23.0-shaped database loads its whole world intact', () => {
  const safe = createSafeDb(pastDb());
  assert.equal(safe.characters.length, 2, 'a character was lost');
  assert.equal(safe.characters[0].name, 'amy');
  assert.equal(safe.classes.length, 1, 'a class was lost');
  assert.equal(safe.tags.length, 1, 'a tag was lost');
  assert.equal(safe.characters[0].tags.length, 1, 'the card lost its tag');
  assert.equal(safe.characters[0].versions.length, 1, 'a version was lost');
});

ok('F2 — the retired coats + trims walk their migration roads', () => {
  const safe = createSafeDb(pastDb());
  assert.equal(safe.characters[0].cardFinish, 'auric', 'kintsugi never walked to auric');
  // 1.6.4 — the road grew one more step: mumei -> mumeix -> numeix (the
  // second rename's own migration; the pinned END of the road is numeix).
  assert.equal(safe.characters[1].cardFinish, 'numeix', 'mumei never walked onto numeix (through mumeix)');
  assert.equal(safe.characters[0].cardTrim, 'beads', 'scales never walked to beads');
});

ok('F3 — legacy settings migrate (texture string spreads, dead keys drop)', () => {
  const safe = createSafeDb(pastDb());
  assert.equal(safe.settings.textures.sidebar, 'dots', 'the legacy string never spread');
  assert.equal(safe.settings.textures.titlebar, 'none', 'the toolbar never started clean');
  assert.equal(safe.settings.toolbarGradient, undefined, 'the dead gradient key survived');
});

ok('F4 — every old shape starts with tosAcceptance null (the gate asks)', () => {
  for (const over of [{}, { settings: { theme: 'mumei' } }]) {
    const safe = createSafeDb(pastDb(over));
    assert.equal(safe.settings.tosAcceptance, null, 'an old database was born accepted');
  }
});

ok('F5 — an accepted record round-trips, and a mismatched version does not count', () => {
  const accepted = createSafeDb(
    pastDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 12345, appVersion: '1.6.2' } } })
  );
  assert.equal(accepted.settings.tosAcceptance.version, TOS_VERSION);
  assert.equal(accepted.settings.tosAcceptance.at, 12345);
  const stale = createSafeDb(pastDb({ settings: { tosAcceptance: { version: '0.9.9', at: 1 } } }));
  assert.equal(stale.settings.tosAcceptance.version, '0.9.9', 'a stale acceptance must keep its own version (the mismatch does the asking)');
  const junk = createSafeDb(pastDb({ settings: { tosAcceptance: { version: 42, at: 'nope' } } }));
  assert.equal(junk.settings.tosAcceptance, null, 'junk read as accepted');
});

ok('F6 — a stamped save round-trips through the door + the sanitizer', () => {
  const raw = dbio.stampDatabaseForSave(pastDb(), '1.6.2', 1);
  const hit = dbio.parseDbText(JSON.stringify(raw));
  assert.equal(hit.via, 'direct');
  assert.equal(dbio.readAppVersion(hit.db), '1.6.2');
  const safe = createSafeDb(hit.db);
  assert.equal(safe.characters.length, 2, 'the stamped archive lost its world');
  assert.equal(safe.settings.tosAcceptance, null, 'the stamp must not leak into the live db');
});

// ---------------------------------------------------------------------------
// G. LIVE — the gate's whole story, in jsdom
// ---------------------------------------------------------------------------
let JSDOM;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  JSDOM = null;
}

if (JSDOM) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  const g = globalThis;
  g.window = dom.window;
  g.document = dom.window.document;
  g.Node = dom.window.Node;
  g.NodeFilter = dom.window.NodeFilter;
  Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
  g.getComputedStyle = dom.window.getComputedStyle;
  g.requestAnimationFrame = dom.window.requestAnimationFrame;
  g.cancelAnimationFrame = dom.window.cancelAnimationFrame;
  for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'HTMLAnchorElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'ImageBitmap', 'getSelection', 'URL', 'DOMParser']) {
    if (dom.window[k] !== undefined && g[k] === undefined) g[k] = dom.window[k];
  }
  g.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  // the app's localStorage seats are all try/catch-guarded (they degrade to
  // a silent boot in any broken storage) — but the live passes want them
  // REAL so the flows behave exactly as they do in the browser.
  try { g.localStorage = dom.window.localStorage; } catch { /* jsdom refused — the guarded seats degrade */ }
  g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.IS_REACT_ACT_ENVIRONMENT = false;

  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const React = require('react');
  const { createRoot } = require('react-dom/client');
  const babel = require('@babel/core');
  require.extensions['.jsx'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]],
    });
    module._compile(code, filename);
  };
  for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
    require.extensions[ext] = (module, filename) => { module.exports = filename; };
  }

  const errors = [];
  console.error = (...args) => {
    const s = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
    if (/Warning|act\(|deprecated|Not implemented: Window's scrollTo/i.test(s)) return;
    errors.push(s);
  };
  dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const App = require('../src/App.jsx').default;

  const oldDb = {
    settings: { theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom', textures: { sidebar: 'none', titlebar: 'none', viewer: 'dots', panel: 'none' } },
    classes: [{ id: 'cl1', name: 'heroes', parentId: 'root' }],
    tags: [{ id: 't1', name: 'wip', color: '#ffd400', trim: 'straight' }],
    stamps: [],
    characters: [
      { id: 'c1', name: 'amy', classId: 'cl1', tags: ['t1'], versions: [{ id: 'v1', label: 'V1', images: [], parts: [] }], stamps: [] },
    ],
  };

  const bootGate = async ({ savedDbs, closes, loadStatus = 'ok', fromAppVersion = '' }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = {
      loadDB: async () => ({ db: oldDb, imagesPath: '/mock/images', status: loadStatus, fromAppVersion, recoveredFrom: '', corruptSetAside: '' }),
      saveDB: async (db) => { savedDbs.push(db); return { ok: true }; },
      sendUnsavedState: () => {},
      onPromptUnsaved: () => () => {},
      saveAndClose: async () => ({ ok: true }),
      forceClose: () => { closes.push(1); },
      windowControl: () => {},
      onWindowMaximized: () => () => {},
      onWindowUnmaximized: () => () => {},
      openExternal: () => {},
      clipboardReadText: async () => '',
      clipboardWriteText: async () => {},
      importImagesFromFiles: async () => [],
      saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
      deleteImageFile: async () => ({ ok: true }),
    };
    window.api = api;
    localStorage.clear();
    const root2 = createRoot(host);
    root2.render(React.createElement(App));
    await sleep(3400);
    return { host, root: root2 };
  };

  const textOf = (host) => (host.textContent || '');

  await okAsync('G1 — an old database boots the gate (terms never accepted)', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await bootGate({ savedDbs, closes });
    const doc = host.ownerDocument || document;
    const gate = [...doc.querySelectorAll('.gd-modal-card')].find((m) => /TERMS & PRIVACY/i.test(m.textContent || ''));
    assert.ok(gate, 'the gate window never mounted');
    assert.match(textOf(gate), /added \/ updated/i, 'the crossing line is missing');
    assert.ok(gate.querySelector('.gd-legal-card'), 'the document cards are missing');
    root.unmount();
    host.remove();
  });

  await okAsync('G2 — a document card opens its reader, BACK returns', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await bootGate({ savedDbs, closes });
    const doc = host.ownerDocument || document;
    const gate = [...doc.querySelectorAll('.gd-modal-card')].find((m) => /TERMS & PRIVACY/i.test(m.textContent || ''));
    const tosCard = [...gate.querySelectorAll('.gd-legal-card')][0];
    tosCard.click();
    await sleep(120);
    assert.match(textOf(gate), /1\. Accepting these terms/, 'the ToS reader never opened');
    const back = [...gate.querySelectorAll('button')].find((b) => /BACK/i.test(b.textContent || ''));
    assert.ok(back, 'the BACK key is missing');
    back.click();
    await sleep(120);
    assert.match(textOf(gate), /added \/ updated/i, 'the cards never came back');
    root.unmount();
    host.remove();
  });

  await okAsync('G3 — ACKNOWLEDGE writes the record AND saves immediately', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await bootGate({ savedDbs, closes });
    const doc = host.ownerDocument || document;
    const gate = [...doc.querySelectorAll('.gd-modal-card')].find((m) => /TERMS & PRIVACY/i.test(m.textContent || ''));
    const accept = [...gate.querySelectorAll('button')].find((b) => /ACKNOWLEDGE/i.test(b.textContent || ''));
    assert.ok(accept, 'the acknowledge key is missing');
    accept.click();
    await sleep(400);
    assert.ok(savedDbs.length >= 1, 'the acceptance was never saved');
    const saved = savedDbs[savedDbs.length - 1];
    assert.equal(saved.settings.tosAcceptance.version, TOS_VERSION, 'the saved record lost its version');
    assert.ok(Number.isFinite(saved.settings.tosAcceptance.at), 'the saved record lost its timestamp');
    const gateAfter = [...doc.querySelectorAll('.gd-modal-card')].find((m) => /TERMS & PRIVACY/i.test(m.textContent || ''));
    assert.ok(!gateAfter, 'the gate never left');
    assert.equal(closes.length, 0, 'accepting closed the app?!');
    root.unmount();
    host.remove();
  });

  await okAsync('G4 — DECLINE confirms inline, then closes without saving', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await bootGate({ savedDbs, closes });
    const doc = host.ownerDocument || document;
    const gate = [...doc.querySelectorAll('.gd-modal-card')].find((m) => /TERMS & PRIVACY/i.test(m.textContent || ''));
    const decline = [...gate.querySelectorAll('button')].find((b) => /^DECLINE$/i.test((b.textContent || '').trim()));
    decline.click();
    await sleep(120);
    assert.match(textOf(gate), /closes Burrito GenDex/i, 'the decline confirm never speaks');
    const keep = [...gate.querySelectorAll('button')].find((b) => /KEEP USING/i.test(b.textContent || ''));
    keep.click();
    await sleep(120);
    assert.equal(closes.length, 0, 'KEEP USING closed the app');
    const decline2 = [...gate.querySelectorAll('button')].find((b) => /^DECLINE$/i.test((b.textContent || '').trim()));
    decline2.click();
    await sleep(120);
    const final = [...gate.querySelectorAll('button')].find((b) => /DECLINE & CLOSE/i.test(b.textContent || ''));
    assert.ok(final, 'the confirmed close key is missing');
    final.click();
    await sleep(200);
    assert.equal(closes.length, 1, 'the confirmed decline never closed the app');
    assert.equal(savedDbs.length, 0, 'declining SAVED something (it must never)');
    root.unmount();
    host.remove();
  });

  await okAsync('G5 — the recovery verdicts speak on a recovered boot', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await bootGate({ savedDbs, closes, loadStatus: 'backup', fromAppVersion: '1.4.9' });
    const doc = host.ownerDocument || document;
    // the toast pill rides document.body (ToastHub portals there)
    const bodyText = doc.body.textContent || '';
    assert.match(bodyText, /recovered from backup/i, 'the backup recovery verdict never spoke');
    root.unmount();
    host.remove();
  });

  await okAsync('G6 — the newer-archive warning speaks before any save', async () => {
    const savedDbs = [];
    const closes = [];
    // 1.9.0 — the seed rides a FUTURE MAJOR now: the warning speaks only
    // for an archive saved by something NEWER than this app, and 1.8.20
    // stopped being newer the day the app reached 1.9.0 (the 1.8-era
    // far-patch seed aged out with the minor bump). 2.0.0 outlives the
    // whole 1.x line.
    const { host, root } = await bootGate({ savedDbs, closes, loadStatus: 'ok', fromAppVersion: '2.0.0' });
    const bodyText = (host.ownerDocument || document).body.textContent || '';
    assert.match(bodyText, /last saved by v2\.0\.0/i, 'the newer-archive warning never spoke');
    root.unmount();
    host.remove();
  });

  assert.equal(errors.length, 0, `render errors: ${errors.slice(0, 2).join(' | ').slice(0, 400)}`);
} else {
  console.log('  (jsdom unavailable — live gate passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
