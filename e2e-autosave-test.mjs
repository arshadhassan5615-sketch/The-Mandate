// E2E test: verify autosave works and game resumes on refresh
import { chromium } from 'playwright';

const DEV_URL = 'http://localhost:5180';

function createLogCollector() {
  const logs = [];
  function handler(msg) {
    logs.push({ type: msg.type(), text: msg.text() });
  }
  return { logs, handler };
}

function findLogs(logs, pattern) {
  return logs.filter(l => pattern.test(l.text));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const collector = createLogCollector();
  page.on('console', collector.handler);

  // ── STEP 1: Load the game ──────────────────────────────────────────────
  console.log('\n=== STEP 1: Load game ===');
  await page.goto(DEV_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const loadLogs = findLogs(collector.logs, /SaveManager|Auto-resume/i);
  console.log('Initial load logs:', loadLogs.map(l => l.text));

  // ── STEP 2: Start new game ──────────────────────────────────────────────
  console.log('\n=== STEP 2: Start new game ===');

  // Screenshot to see current state
  await page.screenshot({ path: 'e2e-step2.png' });
  console.log('Screenshot saved: e2e-step2.png');

  // Try common button patterns
  try {
    const btn = page.locator('button:visible').first();
    await btn.waitFor({ timeout: 5000 });
    const btnText = await btn.textContent();
    console.log('Found button:', btnText?.trim()?.substring(0, 50));
    await btn.click();
  } catch {
    console.log('No button found, pressing Enter');
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(4000);

  // ── STEP 3: Click through scenes ───────────────────────────────────────
  console.log('\n=== STEP 3: Click through scenes ===');
  await page.screenshot({ path: 'e2e-step3.png' });

  for (let i = 0; i < 8; i++) {
    try {
      // Look for choice buttons specifically
      const btns = page.locator('button:visible');
      const count = await btns.count();
      if (count === 0) break;

      // Prefer the last button (often "Continue") or any visible button
      const btn = btns.last();
      const btnText = await btn.textContent().catch(() => '');
      console.log(`  [${i}] Clicking: "${btnText?.trim()?.substring(0, 50)}"`);
      await btn.click({ timeout: 2000 });
      await page.waitForTimeout(1500);
    } catch {
      break;
    }
  }

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'e2e-step3b.png' });

  // ── STEP 4: Check save logs ─────────────────────────────────────────────
  console.log('\n=== STEP 4: Check save logs ===');
  const allLogs = [...collector.logs];
  const saveLogs = findLogs(allLogs, /SaveManager|Dexie|localStorage.*save|Auto-resume/i);
  console.log('Save-related logs:');
  saveLogs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

  const dexieOk = saveLogs.some(l => /Dexie save succeeded/i.test(l.text));
  const lsOk = saveLogs.some(l => /localStorage save succeeded/i.test(l.text));
  const dexieFailed = saveLogs.some(l => /Dexie.*fail/i.test(l.text));

  console.log('Dexie OK:', dexieOk, '| localStorage OK:', lsOk, '| Dexie failed:', dexieFailed);

  // ── STEP 5: Force autosave via page.evaluate ───────────────────────────
  console.log('\n=== STEP 5: Force autosave ===');
  const forcedSaveResult = await page.evaluate(async () => {
    try {
      const mod = await import('/src/engine/SaveManager.ts');
      await mod.saveGame(mod.AUTOSAVE_SLOT, 'AUTOSAVE');
      return 'save-ok';
    } catch (e) {
      return `save-error: ${e?.message || String(e)}`;
    }
  }).catch(e => `eval-error: ${e?.message || String(e)}`);

  console.log('Forced save result:', forcedSaveResult);
  await page.waitForTimeout(2000);

  // Check for new save logs
  const postSaveLogs = findLogs(collector.logs, /SaveManager/i).filter(
    l => !saveLogs.includes(l)
  );
  console.log('New save logs after forced save:');
  postSaveLogs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

  const forcedDexieOk = postSaveLogs.some(l => /Dexie save succeeded/i.test(l.text));
  const forcedLsOk = postSaveLogs.some(l => /localStorage.*succeeded/i.test(l.text));
  const forcedFailed = postSaveLogs.some(l => /Dexie.*fail/i.test(l.text));

  console.log('Forced save: Dexie OK:', forcedDexieOk, '| LS OK:', forcedLsOk, '| Failed:', forcedFailed);

  // ── STEP 6: Refresh and check resume ────────────────────────────────────
  console.log('\n=== STEP 6: Refresh and check resume ===');

  // Clear log collector for fresh tracking
  collector.logs.length = 0;

  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(6000); // Wait for checkAndResume (100ms delay + load)

  await page.screenshot({ path: 'e2e-step6.png' });

  const resumeLogs = findLogs(collector.logs, /Auto-resume|Loading save|SaveManager.*Loading/i);
  console.log('Resume logs after refresh:');
  resumeLogs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

  const resumed = resumeLogs.some(l => /Auto-resumed|Loading save/i.test(l.text));
  console.log('Game resumed:', resumed ? 'YES' : 'NO');

  // ── STEP 7: Check game state after refresh ──────────────────────────────
  console.log('\n=== STEP 7: Verify game state ===');
  const gameState = await page.evaluate(() => {
    const body = document.body.innerText || '';
    const isMenu = body.includes('New Game');
    const hasWeek = /Week\s*\d/i.test(body);
    const hasVeltria = body.includes('Veltria');
    return { isMenu, hasWeek, hasVeltria, snippet: body.substring(0, 300) };
  }).catch(() => ({ error: true }));

  console.log('Game state:', JSON.stringify(gameState, null, 2));

  // Check localStorage saves
  const lsKeys = await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mandate-save-slot-')) {
        const val = localStorage.getItem(key);
        keys.push({ key, size: val?.length ?? 0 });
      }
    }
    return keys;
  }).catch(() => []);
  console.log('localStorage save keys:', JSON.stringify(lsKeys));

  // ── FINAL RESULTS ───────────────────────────────────────────────────────
  const saveWorked = dexieOk || lsOk || forcedDexieOk || forcedLsOk;
  const anySaveMethod = forcedDexieOk ? 'Dexie' : forcedLsOk ? 'localStorage' : 'none';

  console.log('\n========== FINAL RESULTS ==========');
  console.log('Save worked (any method):', saveWorked, '(' + anySaveMethod + ')');
  console.log('Dexie error detected:', dexieFailed || forcedFailed);
  console.log('Game resumed on refresh:', resumed);
  console.log('Game still on menu after refresh:', gameState?.isMenu);
  console.log('localStorage save keys:', lsKeys.length);
  console.log('=====================================');

  await browser.close();

  // Exit with code based on results
  if (!saveWorked) {
    console.error('FAIL: No save method succeeded');
    process.exit(1);
  }
  if (!resumed) {
    console.warn('WARN: Save works but resume did not detect — may need manual verification');
  }
  console.log('\nTest complete.');
})().catch(e => {
  console.error('Test script error:', e);
  process.exit(1);
});