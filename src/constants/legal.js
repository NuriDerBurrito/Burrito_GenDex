// 1.5.5 — THE LEGAL SEAT ("i want you to also add terms of service, just
// to ensure that the app doesnt get sued, alongside data privacy etc").
// One home for the three things the app must say like a grown-up: the
// TERMS OF SERVICE, the DATA PRIVACY NOTICE, and their shared VERSION.
//
// THE VERSION IS ITS OWN NUMBER, deliberately unhooked from APP.version:
// the gate asks again ONLY when THIS constant moves (the app can update
// a hundred times without nagging — and a terms change re-asks everyone
// even on an app that didn't otherwise change). Bump it whenever either
// document below changes in a way a user should re-acknowledge.
// 1.5.7 — '1.0.0' -> '1.0.1' ("update terms of service to 1.0.1, no need
// to change it"): the TEXTS themselves are untouched — the bump exists so
// every library that acknowledged 1.0.0 meets the gate once more and sees
// the reworked consent window (the animated page switches and the growing
// reader posture), then acknowledges and never hears about it again. This
// is exactly the machinery the version was built for: a re-ask with no
// legal change, by owner's choice.
// 1.5.8 — '1.0.1' -> '1.0.2' ("make 1.0.2 tos/data privacy thing, ensure
// there is no M-dashes"): a TEXT PASS and a bump in one breath. Every em
// dash in both documents is retired (commas, colons and parentheses speak
// the same sentences without the long bar), the gate/reader window grows
// VERTICALLY when a document opens (Modal's tallPosture law), and the
// ACKNOWLEDGE key steps aside while a document is being read (the reader's
// foot speaks only BACK / DECLINE until the front face returns). A pure
// reading-manners release — nothing in the AGREEMENT itself changes, but
// every user meets the cleaner window once.
// 1.6.0 — '1.0.2' -> '1.0.3' ("update tos and such to 1.0.3, just so i can
// see how it is currently"): a VISIBILITY bump in the 1.0.1 tradition — the
// texts stay byte-identical, the number moves so every library meets the
// gate once more and the owner can eyeball the consent flow exactly as it
// stands today (the pop-law window, the growing reader, the reading foot).
// Acknowledge once and it never asks again until the number truly moves.
// 1.8.8 — '1.0.3' -> '1.0.4' ("update tos and data privacy, since i dont
// see mentions for other platforms like mac etc, and also no mention of
// sqlite, fix that"): a PLATFORM + FORMAT pass. The privacy notice told
// every reader where their data lives through Windows eyes alone
// (%APPDATA% and nothing else); macOS and Linux users now see their own
// seats beside it. And the storage story finally tells its whole history:
// today's library is ONE plain human-readable JSON file, while the older
// releases kept theirs in a SQLite database file in the same folder — the
// notice now says what that old file is, that the current app never reads
// or writes it, and that it stays on the user's disk until they choose to
// delete it. The terms speak the three platforms in their own local-data
// seat. A meaningful change: the version moves and every library meets
// the gate once more.
// 1.8.9 — '1.0.4' -> '1.0.5' (the storage report: "i thought our db was
// working on sqlite ... and that upgrading to newer versions just adds
// what the json database had to sqlite and it doesnt use it anymore"): the
// story flips to the truth of the new house. The library LIVES in ONE
// SQLite database file now (gendex_db.sqlite, transactional, openable with
// any SQLite tool), and the JSON file is the LEGACY seat: the notice says
// the app reads it exactly ONCE (the first start after such an upgrade,
// adding everything it had into the SQLite library, and never again — the
// library remembers the import), and that afterwards the file is never
// read or written and stays on the disk until the user chooses to delete
// it. The backup shelf speaks both kinds of copies now (the newest SQLite
// saves, and the older JSON saves from before the switch). A meaningful
// change: the version moves and every library meets the gate once more.
// 1.9.1 — '1.0.5' -> '1.0.6' (the experiment's own word: "experiment, i
// wanna try and see if we can make the database in nosql instead ... clarify
// that in the data privacy and so on, and dont delete the old sqlite
// database too, just translate it from sql to nosql"): a STORAGE pass in
// the 1.8.9 tradition — the story flips to the document house. The
// library LIVES in ONE NoSQL document store now (gendex_db.nosql: an
// append-only journal of JSON documents, still a single local file,
// still no server and no cloud), and the SQLite file is the LEGACY
// seat: the notice says the app reads it exactly ONCE (the first start
// after the upgrade, translating everything it had into the document
// library, and never again — the library remembers the translation),
// and that afterwards the file is never read and never written and
// stays on the disk until the user chooses to delete it. The JSON note
// folds into the same older-releases sentence (the whole chain: JSON
// -> SQLite -> NoSQL, each seat read once on its way out). The backup
// shelf speaks all three kinds of copies now. A meaningful change: the
// version moves and every library meets the gate once more.
export const TOS_VERSION = '1.0.6';

// Shared closing line for both documents (kept once so the two can never
// drift): where the user actually is, and how to reach the studio.
const CONTACT_LINE =
  'Burrito GenDex is made by Genesis Iterations (NuriDerBurrito). Questions about these terms or your data can be sent through the Discord username or the GitHub repository listed in Settings → About.';

// ---------------------------------------------------------------------------
// TERMS OF SERVICE
// ---------------------------------------------------------------------------
export const TOS_DOC = {
  key: 'tos',
  title: 'TERMS OF SERVICE',
  version: TOS_VERSION,
  intro:
    'These terms are a plain-language agreement between you and Genesis Iterations for your use of Burrito GenDex, a local card and prompt-version tracker. They exist so both sides know exactly what this app is, what it promises (and does not promise), and who owns what. Please read them; acknowledging them is required before the app can be used.',
  sections: [
    {
      h: '1. Accepting these terms',
      body: [
        'By pressing ACKNOWLEDGE & ACCEPT, or by continuing to use Burrito GenDex after the terms are shown, you agree to these Terms of Service and to the Data Privacy Notice that ships beside them. If you do not agree, choose DECLINE: the app closes, nothing is deleted, and nothing further of yours is touched.',
        'Every time these terms change in a meaningful way, their version number is raised and the app asks for your acknowledgment again; a silent change to this agreement is never possible.',
      ],
    },
    {
      h: '2. The app, and the licence to use it',
      body: [
        'Burrito GenDex is free, open-source software distributed under the MIT License. You may use it, copy it, modify it and share it within the permissions of that license, which is included with the source code.',
        'The app is provided as a tool for organizing your own reference material. It is not a hosted service, and there is no paid tier, subscription, or account system.',
      ],
    },
    {
      h: '3. Your content is yours',
      body: [
        'Everything you put into Burrito GenDex (characters, cards, prompts, tags, notes, images, stamps, and every exported file) belongs entirely to you. The app claims no ownership, no licence, and no interest in your content. It never transmits your content anywhere; it simply stores it in files on your own disk.',
        'You are responsible for making sure you have the rights to the material you add (artwork, photographs, text) and for anything you export, publish, or share from it.',
      ],
    },
    {
      h: '4. Local software, local data',
      body: [
        'Burrito GenDex runs entirely on your machine, on Windows, macOS, and Linux alike, and stores its library in your own user-data folder on whichever of them you use. The two narrow exceptions that touch a network (an optional update check and links you deliberately open) are described honestly in the Data Privacy Notice, which is part of this agreement.',
      ],
    },
    {
      h: '5. Who the app is for',
      body: [
        'Burrito GenDex is intended for a general audience and is not directed at children under 13. If you are under 13, or the relevant age of digital consent where you live, please use the app only with a parent or guardian\u2019s permission and supervision.',
      ],
    },
    {
      h: '6. Fair use of the app',
      body: [
        'You agree not to use Burrito GenDex to break the law, to infringe other people\u2019s rights, or to distribute material you are not allowed to distribute. You also agree not to hold the app or its author out as endorsing anything you create with it.',
      ],
    },
    {
      h: '7. Third-party names, marks and services',
      body: [
        'The app may display links to third-party sites and services (GitHub, Ko-fi, PayPal, Discord, Hugging Face). Those belong to their owners; opening one takes you to their terms and their privacy practices, which have nothing to do with this app.',
        'Any trademarks, logos, or artwork that appear in YOUR library belong to their respective owners and are stored only for your own reference use.',
      ],
    },
    {
      h: '8. No warranty',
      body: [
        'Burrito GenDex is provided \u201cas is\u201d and \u201cas available\u201d, without warranty of any kind, express or implied, including fitness for a particular purpose, uninterrupted or error-free operation, and non-infringement. Features that save, back up, and recover your library are earnest engineering, not a guarantee: keeping your own backups of anything you cannot afford to lose remains your responsibility.',
        'The app ships with an automatic backup shelf (the last eight saved databases) and repair-at-load machinery, but no software can promise absolute data safety on every disk, power cut, or mishap.',
      ],
    },
    {
      h: '9. Limitation of liability',
      body: [
        'To the maximum extent permitted by law, Genesis Iterations and the app\u2019s contributors are not liable for any damages, losses, or costs arising from your use of (or inability to use) Burrito GenDex, including lost or corrupted data, lost profits, or lost content. Because the app is provided free of charge, you use it entirely at your own risk.',
      ],
    },
    {
      h: '10. Changes to these terms',
      body: [
        'These terms may be updated as the app evolves. When they change, the terms version is raised and the app shows the updated terms for your acknowledgment on the next launch. Continuing to use the app after accepting the updated terms is your agreement to them. The current version is always available inside the app (Settings → About → LEGAL).',
      ],
    },
    {
      h: '11. Ending this agreement',
      body: [
        'You may stop using Burrito GenDex at any time, for any reason. The app keeps no account to close: your library stays in your user-data folder exactly as you left it. Deleting the app\u2019s folder (and, if you wish, its user-data folder) removes everything it ever wrote.',
      ],
    },
    {
      h: '12. General',
      body: [
        'If any part of these terms is held unenforceable, the rest still applies. These terms, together with the Data Privacy Notice, are the whole agreement between you and the app regarding Burrito GenDex.',
        CONTACT_LINE,
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// DATA PRIVACY NOTICE
// ---------------------------------------------------------------------------
export const PRIVACY_DOC = {
  key: 'privacy',
  title: 'DATA PRIVACY NOTICE',
  version: TOS_VERSION,
  intro:
    'This notice explains, in plain words, what data Burrito GenDex handles and where it goes. The honest headline: your library never leaves your computer. Below is the full story, including the two narrow cases where a network request happens, so nothing here is a surprise.',
  sections: [
    {
      h: '1. The short version',
      bullets: [
        'All your cards, images, prompts and settings are stored as files on your own machine.',
        'There are no accounts, no sign-ups, no telemetry, no analytics, no crash reporting, no advertising, and no tracking of any kind.',
        'Nothing you put in the app is ever uploaded, synced, or shared by the app itself.',
        'The only network requests the app can make are an optional update check (which can be switched off) and pages you deliberately open yourself.',
      ],
    },
    {
      h: '2. What is stored, and where',
      body: [
        'The app writes only inside its own user-data folder, wherever your platform keeps it (on Windows, %APPDATA%\\Burrito GenDex; on macOS, ~/Library/Application Support/Burrito GenDex; on Linux, ~/.config/Burrito GenDex):',
      ],
      bullets: [
        'gendex_db.nosql: the whole library (characters, classes, tags, stamps, settings, and the terms acceptance you gave, with its version and a timestamp), stored as ONE local NoSQL document-database file: an append-only journal of JSON documents. It is not a server and not a cloud: it is a plain file on your disk like any other, written whole-or-nothing at the moments it is rewritten, appended safely between them, and each save adds only the documents that changed. Nothing about this store ever leaves your machine.',
        'A note on older versions: earlier releases kept the same library in other seats in this same folder, and each upgrade reads the old seat exactly ONCE and ADDS everything it had (characters, tags, settings, and the rest) into the current library, then stamps its own memory of the import inside the database so it is never done twice. Releases before 1.9.1 used a SQLite database file (gendex_db.sqlite), and the oldest releases a plain JSON file (gendex_db.json). After its one-time import the old file is never read and never written again; it stays on your disk exactly as it was, and you are free to delete it once you are happy with your current library.',
        'gendex_images/: the image files you import, plus their lightweight thumbnail copies.',
        'gendex_backups/: the last eight saved databases as a safety net (the newest saves are copies of the current document database; older SQLite and JSON copies from before the switches keep their seats beside them).',
        'A local browser-storage entry (localStorage) holding small UI memories like the last-run version and the status-log tail; it never leaves the app.',
      ],
    },
    {
      h: '3. What the app never collects',
      body: [
        'No name, e-mail, address, or payment data is ever requested or recorded; the app has no account system at all. No usage statistics, no analytics events, no crash reports, no advertising identifiers, no fingerprints. If you never touch a link or the update check, the app behaves like a fully offline program.',
      ],
    },
    {
      h: '4. The only network requests (being specific)',
      body: [
        'Even though your data stays local, two things can still touch a network, and both are yours to control:',
      ],
      bullets: [
        'THE UPDATE CHECK: while the update channel is on (Settings → Data → UPDATES), the app asks GitHub\u2019s public API (api.github.com) for the latest published release number of its own repository, so it can tell you a newer version exists. The request sends no personal data and nothing about your library, and it can be turned fully OFF at any time, after which the app never touches a network again.',
        'LINKS YOU OPEN: pressing a link in the About page (GitHub, Ko-fi, PayPal, Discord, Hugging Face) opens it in your own browser. From that moment you are on those sites, under their own privacy policies.',
      ],
    },
    {
      h: '5. Your control',
      bullets: [
        'EXPORT: Settings → Data can export your entire library (database + images) into a single .zip you own and can take anywhere.',
        'BACKUPS: every save first archives the previous database to gendex_backups/ (last eight kept); you can browse or copy them at any time.',
        'DELETION: Settings → Data offers a factory reset; deleting the user-data folder removes every trace of the app\u2019s data for good (including any old SQLite or JSON file an earlier version left there).',
        'OFFLINE MODE: turning the update channel off makes the app fully offline.',
      ],
    },
    {
      h: '6. Children',
      body: [
        'The app collects nothing, but it is still not directed at children under 13; the terms ask for a parent or guardian\u2019s supervision for younger users.',
      ],
    },
    {
      h: '7. Changes to this notice',
      body: [
        'If this notice ever changes in a meaningful way, its version is raised with the terms and the app asks for your acknowledgment again on the next launch. You can always re-read the current notice inside the app (Settings → About → LEGAL).',
        CONTACT_LINE,
      ],
    },
  ],
};

export const LEGAL_DOCS = [TOS_DOC, PRIVACY_DOC];
