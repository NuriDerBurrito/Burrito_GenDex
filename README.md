# 🌯 Burrito GenDex

**v1.9.19** · a local card & prompt-version tracker · Windows · macOS · Linux (Electron)
<p align="center">
<img width="300" height="300" alt="Burrito_lorafy_logo(plus)" src="https://github.com/user-attachments/assets/2c6b6f14-9a44-4e38-83bd-d9aec0a9c059" />
  <img width="300" height="300" alt="Genstack" src="https://github.com/user-attachments/assets/399e2af3-40f0-4e76-b7c8-a3a0f26aae8a"/>
<p/>
  
![Version](https://img.shields.io/badge/version-1.9.19-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Database](https://img.shields.io/badge/database-NoSQL-informational)

Ever built a Prompt in your chat, closed it, and lost the exact prompt that made it? 

Burrito GenDex is a desktop app for prompt engineers who work with prompts: every look gets a **card**, every iteration gets a **prompt version**, and nothing is ever lost to a scroll again. Split a prompt into named parts (body / facial / outfit 1 / outfit 2 / …), check the parts you want, and GenDex composes the final prompt string — ready to copy into your generator of choice.

Everything stays on your machine. No accounts, no telemetry, no cloud. The only network the app can ever speak is an optional, read-only update check that you can switch off with one toggle.

---

## ✨ Features

### 🗂️ Cards & Classes
- **Card grid** — every card/look is a card: cover image, name, version chips, tag ribbons, stamp, and the notes you wrote when you made it.
- **Class tree** — organize cards in collapsible classes with colors and icons; drag a card between classes, right-click for the quick tools.
- **Prompt versions** — each card holds any number of versions; every version has its own image set, its own prompt parts, and a color + icon of its own. The top version is the one the card shows.
- **Sorting & zoom** — a ten-step zoom ladder for the grid, and sort modes that keep your wall in the order you think in.

<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/e1b82453-10a7-44f3-a23c-41a03cc442c9" />

### 🖼️ Image Management
- **Per-version galleries** — drag to reorder, star to set the cover, delete with a confirm, add from files or paste straight from the clipboard.
- **Live preview stage** — the stage follows every change; the big viewer opens any picture full-size with zoom and pan.
- **Thumbnails** — lightweight copies build automatically at import, so the grid never decodes a full-quality file.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/f9e081ec-2d59-40cb-b318-96bce4c4b268" />

### ✍️ Prompt Compose
- **Named parts** — split the prompt into named chunks, each with an include checkbox; the composed prompt updates as you check.
- **One-click copy** — copy the composed string for the version you're on, ready for your generator, notebook, or download manager.
- **Version switcher** — compare iterations side by side and bring the winner back to the top.
<img width="1108" height="572" alt="image" src="https://github.com/user-attachments/assets/2080d947-d13b-4770-bf85-175da61f6cd1" />

### 🏷️ Tags & Stamps
- **Tag system** — colorful, icon-supported tag ribbons with five trim shapes; filter your wall by tag, manage the palette in the tag manager.
- **Stamp library** — your watermark/logo collection; the top stamp rides the card, and the stamp gallery keeps every stamp you ever uploaded.
<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/6e205c75-4f9d-4c11-a29c-da60c131fef0" />

### 🎨 Customization
- **Theme presets** — 13 built-in themes (Zine Punk, Burrito, Archive, Carbon, Moss, Ember, Glacier, Ghost, Craft, Paper, Metal, and more) plus full custom color control.
- **Polished UI** — gradient trims, panel frames, ambient background glows and hover accents tied to your theme; a frameless titlebar of the app's own design.
- **Smooth animations** — pop in/out modals, sliding panels and menus (GPU-friendly, respects reduced-motion).
<img width="802" height="734" alt="image" src="https://github.com/user-attachments/assets/7848bf2c-b1c7-44fd-abdb-6c97e228a966" />

### ♿ Accessibility & Productivity
- **Right-click menus** — the app's own stylized menus for cut / copy / paste (plus paste-as-link when the clipboard holds a URL), everywhere a field or a picture lives.
- **Keyboard support** — Ctrl+S to save, Esc closes dialogs, visible focus rings, aria-labels on icon buttons.
- **Status ledger** — every boot tells its story (loaded, repaired, recovered, migrated) in verdicts you can act on, never in silent default libraries.

### 💾 Data Management
- **Local NoSQL document database** — the whole library lives in one `gendex_db.nosql` file: an append-only journal of JSON documents (no server, no cloud, nothing external). Every save appends only the sections that changed, so the file grows with your edits instead of being rewritten whole; a compaction pass keeps its history bounded, and a torn tail from a power cut costs exactly one line.
- **One-time imports** — if you arrive from an older release, its database is read **once** and everything it had is added into the current library (releases before 1.9.1 kept theirs in a `gendex_db.sqlite` SQLite file, and the oldest releases in a plain JSON file). The import is remembered inside the library so it never happens twice, and the old file is left untouched on your disk as your pre-migration backup.
- **Automatic backups** — every save first shelves the previous database to `gendex_backups/` (the last eight are kept).
- **Repair-at-load** — a salvage ladder reads around BOMs, trailing junk, truncated writes and damaged seats before ever showing you a default library; a file that cannot be read is set aside, never overwritten.
- **Export / Import** — Settings → Data packs your entire library (database + images) into a single `.zip` you can carry to another machine, and reads one back the same way.

### 🔎 Update Channel (optional)
- A read-only look at this repo's GitHub Releases that tells you when a newer version exists. It sends nothing about you or your library, and it can be turned fully **OFF** — after which the app never touches a network again.

---

## 📦 Data Seats

The app writes only inside its own user-data folder, wherever your platform keeps it:

| Platform | Seat |
| --- | --- |
| Windows | `%APPDATA%\Burrito GenDex` |
| macOS | `~/Library/Application Support/Burrito GenDex` |
| Linux | `~/.config/Burrito GenDex` |

Inside it:

- `gendex_db.nosql` — the whole library (cards, classes, tags, stamps, settings), as an append-only document journal.
- `gendex_db.sqlite` — the pre-1.9.1 database, kept untouched on your disk after the one-time translation (delete it whenever you are happy with the new library).
- `gendex_images/` — the image files you import, plus their thumbnails.
- `gendex_backups/` — the last eight saved databases as a safety net.

Nothing else is written anywhere, and nothing ever leaves the machine.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/NuriDerBurrito/Burrito_GenDex.git

# Navigate to directory
cd Burrito_GenDex

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run make
```

---

## 🔄 Updating to a New Version (keeps your database)

Your database is stored **outside** the app's install folder (see the seats above), so an update never touches your data:

1. (Optional but wise) Back up: copy the whole user-data folder somewhere safe.
2. Build (or download) the new version's installer and run it.
3. Launch the app — all your classes, cards, versions, images, tags and stamps are still there.

> The app id must stay the same across versions (it already does) so the
> installer updates the existing install instead of creating a duplicate.

If you are upgrading from an older release/pre-release beta, the first launch of the new version translates your existing database into the NoSQL document store **once** — you will see one verdict at boot telling you so — and the old file (`gendex_db.sqlite`, or `gendex_db.json` from beta) stays on your disk, untouched, until you choose to delete it.

---

## 🗑️ Uninstalling

- **App only (keeps your database):** Windows Settings → Apps → **Burrito GenDex** → Uninstall (or run the uninstaller the installer left in your local app programs folder).
- **Everything including your database:** after uninstalling the app, also delete the user-data folder named in the table above.

---

## 📝 Usage

### Creating a character
1. Click the **+** seat and name the character (or pick its class first from the tree).
2. Add images: from files, or paste straight from the clipboard; star the one that should be the cover.
3. Tag it, stamp it, and write the notes you'll want when you come back.

### Building the prompt
1. Open the character and add a **version** (or several — one per look).
2. Split the prompt into **named parts** (body, facial, outfit…) and fill each in.
3. Check the parts you want; the composed prompt updates live — one click copies it.

### Keeping what worked
- Reorder versions so the winner sits on top; every version keeps its own images and its own parts.
- Export the whole library as a `.zip` before any big machine move; import it back on the other side.

---

## 🖥️ Platform Support

Burrito GenDex is available for:
- **Windows** — built with a Squirrel installer
- **macOS** — (npm install)
- **Linux** — available as DEB and RPM packages

> **Note:** Building for each platform requires running the build process on that respective operating system.

---

## 🛠️ Built With

- **[Electron](https://www.electronjs.org/)** — desktop application framework
- **[React](https://react.dev/)** — UI library
- **[Tailwind CSS](https://tailwindcss.com/)** — styling
- **[Lucide Icons](https://lucide.dev/)** — icon set
- **[sql.js](https://github.com/sql-js/sql.js) / SQLite** — the one-time translation reader for pre-1.9.1 libraries (WebAssembly build, embedded in the app); the live store is the app's own document engine (`src/utils/nosql_engine.js`)

---

## 🧪 Development

The tree carries the regression battery (93 DOM/source test suites) — run it from the app root:

```bash
bash scripts/run_battery_171.sh
```

Syntax and CSS gates for the touched seats:

```bash
node scripts/parse_check.mjs src/App.jsx src/components/SettingsModal.jsx
node scripts/css_check.cjs src/index.css
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **[Duskfallcrew](https://github.com/Ktiseos-Nyx/)** — beta tester: installed and tested the product before release, pointed out vulnerabilities and bugs, and celebrated every fix. The About wall keeps a key for them.

---

## 📬 Contact
<img width="69" height="69" alt="main_logo" src="https://github.com/user-attachments/assets/6971eb2f-66f0-4c09-b111-b80f86fc6528" />

- **Discord:** nuriderburrito
- **GitHub:** [NuriDerBurrito](https://github.com/NuriDerBurrito)
- **HuggingFace:** [NuriDerBurrito](https://huggingface.co/NuriDerBurrito)
- **Website:** [Genesis Iterations](https://nuriderburrito.github.io/Genesis-Website/index.html)

---

Feel free to add suggestions and report issues!

*Made with 🌯 by NuriDerBurrito*

![GitHub stars](https://img.shields.io/github/stars/NuriDerBurrito/Burrito_GenDex?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/NuriDerBurrito/Burrito_GenDex?style=social)
