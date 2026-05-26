# Doogie Journal Web — URL-Slug Identity Design

**Date:** 2026-05-25
**Status:** Approved (brainstorming phase)
**Author:** Matt Smith (with Claude)
**App:** `exp_doogie_web/` (web port only — `exp_doogie/` is untouched)

## Context

The web journal hardcodes the owner as "MATTHEW DAVID SMITH" in `Editor.tsx`, and `useJournal` stores all entries under one localStorage key `doogie-journal-entries`. We want a URL parameter to drive *whose* journal it is (the banner name) and *who it saves as* (an isolated per-person store), so one deployment can serve many named journals.

## Goals

- A `?u=<lastname>_<firstname>` query parameter sets the journal owner.
- The owner name appears in the editor banner (`PERSONAL JOURNAL OF <NAME>`).
- Each owner gets a separate journal (isolated localStorage namespace).
- No slug → themed default owner **Doogie Howser**.
- Web version only; no router, no new dependencies, no backend.

## Non-goals

- Path-based routing (we use a query param).
- Authentication / real accounts (the slug is not a credential — anyone can use any slug).
- Per-entry author field (namespacing already ties a journal to its owner).
- Cross-device sync; multi-part/middle-name support.

## Design

### Identity resolution — `src/lib/identity.ts` (new, pure)

```ts
export interface Identity { slug: string; name: string; storageKey: string; }
export function resolveIdentity(search: string): Identity;
```

- Read `u` from the query string; sanitize to `[a-z0-9_]`, lowercase.
- Empty/missing → `{ slug: 'doogie', name: 'DOOGIE HOWSER', storageKey: 'doogie-journal-entries:doogie' }`.
- Split slug on `_`:
  - 1 token → name = `TOKEN` (uppercased).
  - ≥2 tokens → `tokens[0]` = last, `tokens[1]` = first → name = `"FIRST LAST"` (uppercased); extra tokens ignored.
- `storageKey = 'doogie-journal-entries:' + slug`.

Pure and independently testable: input string → identity object.

### Persistence — `useJournal(storageKey: string)`

`useJournal` currently closes over a module constant `STORAGE_KEY`. Change the storage helpers (`readEntries`, `writeEntries`, `isFirstVisit`, `seedSampleEntry`) to take the key as an argument, and have the hook accept `storageKey`. Each namespace seeds the sample entry independently on its first visit. Public hook surface is otherwise unchanged.

### Owner name — `Editor.tsx`

Add an `ownerName: string` prop; the banner renders `PERSONAL JOURNAL OF {ownerName}` instead of the hardcoded name.

### Wiring — `App.tsx`

`const identity = useMemo(() => resolveIdentity(window.location.search), [])`. Pass `identity.storageKey` to `useJournal` and `identity.name` to `Editor`.

## Error handling

- Malformed/empty slug after sanitize → default (Doogie). Slug is read once at load (query param doesn't change without reload), so identity is stable.
- The old un-namespaced key `doogie-journal-entries` becomes orphaned (harmless leftover from earlier deploys).

## Testing

Update `scripts/smoke.mjs`:
- Default visit: storage key `doogie-journal-entries:doogie`; banner reads `PERSONAL JOURNAL OF DOOGIE HOWSER`.
- New case `?u=smith_matthew`: banner reads `PERSONAL JOURNAL OF MATTHEW SMITH`; its entries are isolated from the default namespace.

Verification gates: `tsc` clean, `npm run build` passes, smoke passes locally and against the live deploy.

## Deployment

No config change (query param uses the same `index.html`). Rebuild + `netlify deploy --prod --dir=dist`.

## Open questions

None — resolved during brainstorming.
