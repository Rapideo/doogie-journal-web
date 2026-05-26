// Headless smoke test for Doogie Journal Web.
// Drives the full UX flow: boot gate -> splash -> editor -> save/reload
// persistence -> entry browser -> Shift+F3 reset -> F10 shutdown.
// Audio playback cannot be asserted headlessly; we assert no page errors
// were thrown (which would include audio-unlock exceptions).
//
// Usage: node scripts/smoke.mjs [baseURL]   (default http://localhost:4173)

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4173';
const STORAGE_KEY = 'doogie-journal-entries';
const SAMPLE_ID = 'sample-doogie-001';
const TYPED = 'Playwright smoke test entry.';

let pass = 0;
let fail = 0;
const fails = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    fails.push(name + (detail ? ` — ${detail}` : ''));
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const pageErrors = [];

async function bootToEditor(page) {
  // Boot gate visible
  await page.waitForSelector('text=PRESS ANY KEY TO BEGIN', { timeout: 10000 });
  // Advance with a keypress
  await page.keyboard.press('Enter');
  // Splash
  await page.waitForSelector("text=loading today's entry", { timeout: 5000 });
  // Editor (splash is a hard 7s) — wait for the journal textarea to exist & enable
  await page.waitForSelector('textarea.journal-input', { timeout: 15000 });
  await page.waitForSelector('textarea.journal-input:not([disabled])', { timeout: 8000 });
}

async function readEntries(page) {
  const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw).entries || []; } catch { return null; }
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console.error: ' + m.text()); });

  console.log(`\n=== Doogie Journal Web smoke test @ ${BASE} ===\n`);

  // --- Test 1: fresh visit, boot gate, splash, seed, editor ---
  console.log('[1] Fresh visit -> boot gate -> splash -> editor');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('boot gate renders', await page.locator('text=PRESS ANY KEY TO BEGIN').count() > 0);
  await page.keyboard.press('Enter');
  check('splash appears after keypress', await page.waitForSelector("text=loading today's entry", { timeout: 5000 }).then(() => true).catch(() => false));
  await page.waitForSelector('textarea.journal-input', { timeout: 15000 });
  await page.waitForSelector('textarea.journal-input:not([disabled])', { timeout: 8000 });
  check('editor loads after splash', await page.locator('textarea.journal-input').count() > 0);

  const seeded = await readEntries(page);
  check('sample entry seeded on first visit', Array.isArray(seeded) && seeded.some(e => e.id === SAMPLE_ID), `entries=${seeded ? seeded.length : 'null'}`);

  // --- Test 2: type + save (F2) ---
  console.log('[2] Type + F2 save');
  await page.locator('textarea.journal-input').fill(TYPED);
  await page.keyboard.press('F2');
  await page.waitForTimeout(300);
  const afterSave = await readEntries(page);
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = afterSave?.find(e => e.date === today && e.content.includes(TYPED));
  check('typed entry saved to localStorage', !!todayEntry, `today=${today}`);

  // --- Test 3: reload -> persistence ---
  console.log('[3] Reload -> persistence across boot');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await bootToEditor(page);
  const restored = await page.locator('textarea.journal-input').inputValue();
  check('today\'s entry restored after reload', restored.includes(TYPED), `value="${restored.slice(0, 40)}"`);

  // --- Test 4: entry browser (F4) ---
  console.log('[4] F4 entry browser');
  await page.keyboard.press('F4');
  check('entry browser opens', await page.waitForSelector('text=Browse Journal Entries', { timeout: 4000 }).then(() => true).catch(() => false));
  check('sample entry listed', await page.locator("text=Saved a man's life today").count() > 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // --- Test 5: Shift+F3 reset ---
  console.log('[5] Shift+F3 reset');
  await page.keyboard.press('Shift+F3');
  check('reset confirm dialog appears', await page.waitForSelector('text=This will erase all journal entries', { timeout: 4000 }).then(() => true).catch(() => false));
  await page.keyboard.press('y');
  await page.waitForTimeout(400);
  const afterReset = await readEntries(page);
  check('reset clears entries and re-seeds sample only',
    Array.isArray(afterReset) && afterReset.length === 1 && afterReset[0].id === SAMPLE_ID,
    `entries=${afterReset ? afterReset.length : 'null'}`);

  // --- Test 6: F10 shutdown ---
  console.log('[6] F10 shutdown -> safe to turn off');
  await page.keyboard.press('F10');
  check('quit confirm dialog appears', await page.waitForSelector('text=Are you sure you want to quit', { timeout: 4000 }).then(() => true).catch(() => false));
  await page.keyboard.press('y');
  check('shutdown animation shows DOS lines', await page.waitForSelector('text=DOOGIE>', { timeout: 4000 }).then(() => true).catch(() => false));
  check('safe-to-turn-off screen appears', await page.waitForSelector('text=It is now safe to turn off your computer', { timeout: 6000 }).then(() => true).catch(() => false));

  // --- Test 7: no page errors ---
  console.log('[7] No uncaught page/console errors');
  check('no page errors during flow', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

} finally {
  await browser.close();
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
if (fail > 0) {
  console.log('Failures:\n - ' + fails.join('\n - '));
  process.exit(1);
}
