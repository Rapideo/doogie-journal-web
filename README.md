# Doogie Journal Web

> A retro browser journal that recreates the iconic blue DOS-style interface from *Doogie Howser, M.D.*

Boot up, hear the theme music, write the day's entry — just like Doogie did.

**Live demo:** _(deploy first to fill in)_

## Features

- DOS-style boot screen with "PRESS ANY KEY TO BEGIN" gate
- Animated splash with theme music, then auto-opens today's entry
- DOS menu bar with function-key navigation (F1-F4, F10)
- Authentic key click sounds and CRT effects
- Entry browser, auto-save detection, unsaved-changes warnings
- F10 → DOS-style shutdown animation → "safe to turn off" screen
- Shift+F3 → reset entries (re-seeds the sample journal entry)
- Local-only storage — entries live in your browser, nothing is sent to a server

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- No backend — entries are stored in browser localStorage

## Getting Started

```bash
npm install
npm run dev    # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serves the production build locally
```

## Deploy

Configured for Netlify. Push to a connected GitHub branch and Netlify builds automatically using `netlify.toml`.

## Keyboard Reference

| Key      | Action               |
|----------|----------------------|
| F1       | Show help            |
| F2       | Save current entry   |
| F3       | New entry            |
| F4       | Browse past entries  |
| F10      | Shut down            |
| Shift+F3 | Clear all entries    |

## How it works

- **Storage:** Entries are kept in `localStorage` under the key `doogie-journal-entries`. Each browser keeps its own journal. Clearing browser data erases everything.
- **Boot gate:** Browsers block audio autoplay until the user interacts with the page. The boot screen exists to capture that first user gesture, which unlocks the splash theme music.
- **Sample seed:** On first visit (when the storage key has never been set), one sample entry is pre-loaded so the entry browser has something to show.
- **Shutdown:** Browsers can't actually close their own tab, so F10 plays the DOS shutdown animation and lands on a static "safe to turn off" screen. Refreshing the page reboots the journal.

## Origin

Ported from the [Doogie Journal Electron app](../exp_doogie/) — same renderer code, Electron shell stripped. See the design spec at `../exp_doogie/docs/superpowers/specs/2026-05-21-doogie-webapp-port-design.md`.

## License

MIT
