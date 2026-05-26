// Resolves the journal owner from the URL query string.
//
// `?u=<lastname>_<firstname>` selects whose journal it is:
//   - drives the editor banner name, and
//   - namespaces localStorage so each owner has a separate journal.
// No `u` param falls back to the themed default, Doogie Howser.

export interface Identity {
  /** Sanitized slug, e.g. "smith_matthew" or "doogie". */
  slug: string;
  /** Display name for the banner, uppercased, e.g. "MATTHEW SMITH". */
  name: string;
  /** Namespaced localStorage key, e.g. "doogie-journal-entries:smith_matthew". */
  storageKey: string;
}

const BASE_KEY = 'doogie-journal-entries';
const DEFAULT_SLUG = 'doogie';
const DEFAULT_NAME = 'DOOGIE HOWSER';

function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

// "smith_matthew" -> "MATTHEW SMITH". One token -> that token, uppercased.
// Extra tokens beyond last_first are ignored (no middle-name support).
function nameFromSlug(slug: string): string {
  const parts = slug.split('_').filter(Boolean);
  if (parts.length === 0) return DEFAULT_NAME;
  if (parts.length === 1) return parts[0].toUpperCase();
  const [last, first] = parts;
  return `${first.toUpperCase()} ${last.toUpperCase()}`;
}

export function resolveIdentity(search: string): Identity {
  const raw = new URLSearchParams(search).get('u') || '';
  const slug = sanitizeSlug(raw);
  if (!slug) {
    return { slug: DEFAULT_SLUG, name: DEFAULT_NAME, storageKey: `${BASE_KEY}:${DEFAULT_SLUG}` };
  }
  return { slug, name: nameFromSlug(slug), storageKey: `${BASE_KEY}:${slug}` };
}
