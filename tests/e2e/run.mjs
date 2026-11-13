/**
 * Production browser acceptance runner. Run AFTER npm run build.
 * No production debug answers or private React state are used. The independent
 * oracle reads the existing slider input only in this test process and combines
 * it with the configured plate/error using integer lattice arithmetic.
 *
 * This script must be executed in CI or on a machine with a supported browser.
 * A missing/blocked browser is reported as BLOCKED with exit code 1, never PASS.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = process.cwd();
const evidence = path.resolve('docs/evidence/e2e');
await fs.mkdir(evidence, { recursive: true });
const started = new Date().toISOString();
const base = (process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4173/vernier-caliper/').replace(/\/?$/, '/');
assert.equal(new URL(base).pathname, '/vernier-caliper/', 'Run acceptance at the actual /vernier-caliper/ deployment subpath.');
const appOrigin = new URL(base).origin;
const report = { started, base, status: 'running', browser: null, runtime: { node: process.version, platform: process.platform, arch: process.arch }, softwareRendering: process.env.TEST_HARDWARE_RENDERING !== '1', checks: [], limitations: ['Software-rendered or CI screenshots do not establish real-device frame-rate, thermal behavior, screen-reader usability, classroom viewing distance, or student learning effectiveness.'], console: [], externalRequests: [], metrics: {} };
let server, browser;
const launchOptions = { headless: process.env.HEADFUL !== '1', executablePath: process.env.CHROMIUM_PATH || undefined, args: process.env.TEST_HARDWARE_RENDERING === '1' ? [] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };

async function waitUntil(fn, timeout = 15000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) { try { const value = await fn(); if (value) return value; } catch (error) { last = error; } await new Promise(resolve => setTimeout(resolve, 100)); }
  throw last ?? new Error(`Condition not reached in ${timeout} ms`);
}
async function writeReport() { await fs.writeFile(path.join(evidence, 'browser-report.json'), JSON.stringify(report, null, 2)); }
async function screenshot(page, filename, locator) {
  await (locator ?? page).screenshot({ path: path.join(evidence, filename), animations: 'disabled', ...(locator ? {} : { fullPage: false }) });
}
async function instrument(context) {
  await context.addInitScript(() => {
    // Test-owned instrumentation contains resource/performance metadata only.
    window.__precisionTest = { diagnostics: [], errors: [], audioContexts: 0, audioNodesCreated: 0, audioNodesDisconnected: 0 };
    document.addEventListener('precision-lab-diagnostics', event => {
      window.__precisionTest.diagnostics.push({ ...event.detail, sampledAt: performance.now() });
      if (window.__precisionTest.diagnostics.length > 300) window.__precisionTest.diagnostics.shift();
    });
    window.addEventListener('error', event => window.__precisionTest.errors.push(event.message));
    if (window.AudioContext) {
      const Original = window.AudioContext;
      window.AudioContext = class extends Original { constructor(...args) { super(...args); window.__precisionTest.audioContexts++; } };
      for (const name of ['createGain', 'createOscillator']) {
        const original = Original.prototype[name];
        Original.prototype[name] = function (...args) { window.__precisionTest.audioNodesCreated++; const node = original.apply(this, args); let disconnected = false; const disconnect = node.disconnect; node.disconnect = function (...values) { if (!disconnected) { disconnected = true; window.__precisionTest.audioNodesDisconnected++; } return disconnect.apply(this, values); }; return node; };
      }
    }
  });
  context.on('request', request => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== appOrigin) report.externalRequests.push(request.url());
  });
}
async function freshPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true, ...options });
  await instrument(context); const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) report.console.push({ type: message.type(), text: message.text().slice(0, 1000) }); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Try your first measurement', exact: true }).waitFor();
  return { page, context };
}
async function check(name, fn, options = {}) {
  const at = Date.now(); let fixture;
  try {
    fixture = await freshPage(options);
    const detail = await fn(fixture.page, fixture.context);
    const errors = await fixture.page.evaluate(() => window.__precisionTest.errors);
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    report.checks.push({ name, status: 'passed', durationMs: Date.now() - at, detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    const image = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-failure.png`;
    if (fixture) await screenshot(fixture.page, image).catch(() => {});
    report.checks.push({ name, status: 'failed', durationMs: Date.now() - at, error: String(error.stack ?? error), screenshot: fixture ? image : null });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally { await fixture?.context.close(); await writeReport(); }
}
const nav = (page, name) => page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true }).click();
const range = page => page.locator('#jaw-travel');
const opening = page => range(page).inputValue().then(Number);
async function setupMode(page, mode = 'external', N = 50, e = 0) {
  await nav(page, 'Measure'); await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByLabel('Vernier plate', { exact: true }).selectOption(String(N));
  await page.getByLabel('Signed zero error', { exact: true }).fill(String(e));
  const labels = { external: 'Outside', internal: 'Inside', depth: 'Depth', step: 'Step' };
  await page.locator('.mode-tabs').getByRole('button', { name: labels[mode], exact: true }).click();
  await page.getByRole('button', { name: '1. Place', exact: true }).click();
  await page.getByRole('button', { name: '2. Align & seat', exact: true }).click();
  await range(page).focus(); await page.keyboard.press(mode === 'external' ? 'Home' : 'End');
  await page.locator('.contact-status.valid').waitFor();
}
async function oracle(page) {
  const d = await opening(page);
  const N = await page.getByLabel('Vernier plate', { exact: true }).inputValue().then(Number);
  const e = await page.getByLabel('Signed zero error', { exact: true }).inputValue().then(Number);
  const q = Math.round((d + e) * N);
  assert.ok(Math.abs(d + e - q / N) <= 1e-9, 'The selected introductory fixture must be exactly representable.');
  const msr = Math.floor(q / N), index = q - msr * N;
  return { d, N, e, msr, index, result: q / N - e };
}
async function answer(page, expected, wrong = false) {
  await page.locator('input[name="msr"]').fill(String(expected.msr + (wrong ? 1 : 0)));
  await page.locator('input[name="index"]').fill(String(expected.index));
  await page.locator('input[name="result"]').fill((expected.result + (wrong ? 1 : 0)).toFixed(2));
  await page.getByRole('button', { name: 'Verify my measurement', exact: true }).click();
  await page.locator(wrong ? '#reading-feedback.retry' : '#reading-feedback.success').waitFor();
}
async function workspace(page) { await page.getByRole('button', { name: 'Workspace', exact: true }).click(); await page.getByRole('dialog', { name: 'Workspace', exact: true }).waitFor(); }
async function closeWorkspace(page) { await page.getByRole('button', { name: 'Close workspace', exact: true }).click(); }
async function tabTo(page, locator) {
  for (let i = 0; i < 220; i++) {
    if (await locator.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Keyboard route could not reach the requested enabled control.');
}
async function keyboardFill(page, locator, value) { await tabTo(page, locator); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type(value); }

try {
  await fs.access(path.join(root, 'dist', 'sw.js'));
  if (!process.env.TEST_BASE_URL) {
    server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '4173' }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stderr.on('data', data => report.console.push({ type: 'server', text: String(data).slice(0, 1000) }));
  }
  await waitUntil(async () => (await fetch(base)).ok);
  browser = await chromium.launch(launchOptions);
  report.browser = browser.version();

  await check('gallery and mechanical reference views', async page => {
    await page.waitForFunction(() => performance.getEntriesByName('precision-lab-instrument-ready').length > 0, undefined, { timeout: 30000 });
    assert.equal(await page.locator('canvas').count(), 1, 'One primary WebGL canvas');
    await screenshot(page, 'desktop-three-quarter.png');
    for (const preset of ['Front', 'Rear', 'Side', 'Top']) {
      await page.locator('.camera-presets').getByRole('button', { name: preset, exact: true }).click();
      await page.waitForTimeout(700);
      await screenshot(page, `desktop-${preset.toLowerCase()}.png`, page.locator('#instrument-stage'));
    }
    return await page.evaluate(() => ({ readyMarks: performance.getEntriesByName('precision-lab-instrument-ready').map(entry => entry.startTime), diagnostics: window.__precisionTest.diagnostics.at(-1) ?? null }));
  });

  await check('first guided prediction contact wrong answer and corrected answer', async page => {
    await page.getByRole('button', { name: 'Try your first measurement', exact: true }).click();
    assert.equal(await page.locator('.reading-form').count(), 0);
    await page.getByLabel('Your prediction in millimetres', { exact: true }).fill('20');
    await page.getByRole('button', { name: 'Let’s measure', exact: true }).click();
    await page.getByRole('button', { name: '1. Place', exact: true }).click();
    await page.getByRole('button', { name: '2. Align & seat', exact: true }).click();
    await range(page).focus(); await page.keyboard.press('Home');
    await page.locator('.contact-status.valid').waitFor();
    const d = await opening(page), q = Math.round(d * 10), expected = { d, N: 10, e: 0, msr: Math.floor(q / 10), index: q % 10, result: q / 10 };
    await screenshot(page, 'guided-jaw-contact.png', page.locator('#instrument-stage'));
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    assert.equal(await page.locator('.reasoning-strip').count(), 0, 'No answer before the first attempt');
    await answer(page, expected, true); assert.equal(await page.locator('input[name="msr"]').getAttribute('aria-invalid'), 'true');
    await answer(page, expected); await page.getByRole('heading', { name: 'You have made your first observation.', exact: true }).waitFor();
    await screenshot(page, 'guided-microscope.png', page.locator('#reading-workspace'));
    return { independentReading: expected };
  });

  for (const mode of ['external', 'internal', 'depth', 'step']) {
    await check(`full ${mode} measurement`, async page => {
      await setupMode(page, mode); const expected = await oracle(page);
      if (mode === 'step') await page.locator('.camera-presets').getByRole('button', { name: 'Rear', exact: true }).click();
      await page.getByRole('button', { name: 'Show contact inspector', exact: true }).click();
      await screenshot(page, `${mode}-contact.png`, page.locator('.lab-stage-layout'));
      await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
      await answer(page, expected); return { independentReading: expected };
    });
  }
  for (const e of [.04, -.02]) {
    await check(`signed zero correction ${e}`, async page => {
      await setupMode(page, 'external', 50, e); const expected = await oracle(page);
      await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click(); await answer(page, expected);
      assert.ok(Math.abs(expected.result - expected.d) < 1e-9);
      return { independentReading: expected };
    });
  }

  await check('independent locks reset view and exact reset contracts', async page => {
    await setupMode(page, 'external', 50, -.02);
    const before = await opening(page);
    await page.getByRole('button', { name: 'Camera rotation lock', exact: true }).click();
    await page.getByRole('button', { name: 'Open 5 millimetres', exact: true }).click(); assert.ok(await opening(page) > before);
    await range(page).focus(); await page.keyboard.press('Home');
    await page.getByRole('button', { name: 'Lock slider', exact: true }).click();
    assert.equal(await range(page).isDisabled(), true); assert.equal(await page.getByRole('button', { name: 'Open fine step', exact: true }).isDisabled(), true);
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    await page.locator('input[name="msr"]').fill('123');
    await page.getByRole('button', { name: 'Reset view', exact: true }).click();
    assert.equal(await opening(page), before); assert.equal(await page.locator('input[name="msr"]').inputValue(), '123');
    assert.equal(await range(page).isDisabled(), true);
    await page.getByRole('button', { name: 'Check closed-jaw zero', exact: true }).click();
    assert.equal(await opening(page), before); await page.locator('.contact-status.valid').waitFor();
    await page.getByRole('button', { name: 'Reset measurement', exact: true }).click();
    assert.equal(await range(page).isDisabled(), false); assert.equal(await page.getByLabel('Vernier plate', { exact: true }).inputValue(), '50');
    assert.equal(await page.getByLabel('Signed zero error', { exact: true }).inputValue(), '-0.02');
    assert.equal(await page.getByRole('button', { name: 'Camera rotation lock', exact: true }).getAttribute('aria-pressed'), 'true');
  });

  await check('frozen microscope live resume and deterministic projected ticks', async page => {
    await setupMode(page, 'external', 50); await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    const before = await page.locator('[data-testid="scale-closeup"] [data-vernier-index]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-mm')));
    await page.getByRole('button', { name: 'Freeze', exact: true }).click();
    await page.getByRole('button', { name: 'Open 5 millimetres', exact: true }).click();
    assert.deepEqual(await page.locator('[data-testid="scale-closeup"] [data-vernier-index]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-mm'))), before);
    assert.equal(await page.getByRole('button', { name: 'Verify my measurement', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Resume Live', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Verify my measurement', exact: true }).isDisabled(), false);
    await page.getByLabel('Reading magnification', { exact: true }).focus(); await page.keyboard.press('End');
    const pxPerMM = Number(await page.getByLabel('Reading magnification', { exact: true }).inputValue()); assert.ok(pxPerMM / 50 >= 4);
    await page.getByRole('button', { name: 'Focus on zero', exact: true }).click();
    const projected = await page.locator('[data-testid="scale-closeup"] [data-main-index]').evaluateAll(nodes => nodes.map(node => ({ mm: Number(node.getAttribute('data-mm')), px: Number(node.getAttribute('data-px')), renderedX: Number(node.querySelector('line')?.getAttribute('x1')) })));
    assert.ok(projected.length > 1);
    for (const tick of projected) assert.ok(Math.abs(tick.renderedX - tick.px) <= .25);
    for (let i = 1; i < projected.length; i++) assert.ok(Math.abs((projected[i].px - projected[i-1].px) - (projected[i].mm - projected[i-1].mm) * pxPerMM) <= .25);
    await screenshot(page, 'maximum-precision-microscope.png', page.getByTestId('microscope'));
  });

  await check('direct carriage drag has no grab jump and cancellation releases ownership', async page => {
    await page.waitForFunction(() => performance.getEntriesByName('precision-lab-instrument-ready').length > 0);
    await setupMode(page, 'external', 50); await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await page.locator('.camera-presets').getByRole('button', { name: 'Front', exact: true }).click();
    await page.getByRole('button', { name: 'Camera rotation lock', exact: true }).click();
    await page.waitForTimeout(1000);
    const d = await opening(page), box = await page.locator('canvas').boundingBox();
    assert.ok(box);
    // Independently project a documented point on the upper carriage frame in
    // the fixed front preset. This does not inspect renderer internals.
    const visibleHeight = Math.max(110, (250 + d) / (box.width / box.height));
    const distance = visibleHeight / (2 * Math.tan(16 * Math.PI / 180)) * 1.08;
    const factor = box.height / (2 * Math.tan(16 * Math.PI / 180) * (distance - 3.5));
    const x = box.x + box.width / 2 + (d + 20 - (100 + d / 2)) * factor;
    const y = box.y + box.height / 2 - (10 + 6) * factor;
    await page.mouse.move(x, y); await page.mouse.down();
    assert.equal(await opening(page), d, 'Grabbing preserves the opening and drag offset');
    await page.mouse.move(x + 32, y, { steps: 6 }); const moved = await opening(page);
    assert.ok(moved > d + 1, 'The carriage follows a real pointer drag while the camera is locked');
    await page.locator('canvas').dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', bubbles: true });
    await page.mouse.move(x + 70, y, { steps: 5 }); assert.equal(await opening(page), moved, 'Cancelled gesture cannot keep moving the slider');
    await page.mouse.up(); await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await page.getByRole('button', { name: 'Camera rotation lock', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.locator('.camera-presets').getByRole('button', { name: 'Side', exact: true }).click();
    await page.getByRole('button', { name: 'Open fine step', exact: true }).click();
    assert.ok(Math.abs(await opening(page) - moved - .02) < 1e-8, 'Side view retains the precise non-drag route');
  });

  await check('challenge hidden answers teacher reveal and configuration semantics', async page => {
    await workspace(page); await page.getByLabel('Teacher controls', { exact: true }).check();
    await page.getByLabel('Learning objective', { exact: true }).selectOption('external');
    await page.getByLabel('Difficulty', { exact: true }).selectOption('standard');
    await page.getByLabel('Scenario seed', { exact: true }).fill('1631');
    await page.getByRole('button', { name: 'Generate challenge', exact: true }).click();
    await page.getByRole('button', { name: '1. Place', exact: true }).click(); await page.getByRole('button', { name: '2. Align & seat', exact: true }).click();
    await range(page).focus(); await page.keyboard.press('Home'); await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    assert.equal(await page.locator('.reasoning-strip').count(), 0); assert.equal(await page.locator('.movement-control output').count(), 0);
    assert.match(await range(page).getAttribute('aria-valuetext'), /Read the main and Vernier scales/);
    assert.equal(await page.getByLabel('Inspect Vernier division', { exact: true }).inputValue(), '0');
    assert.equal(await page.locator('input[name="result"]').inputValue(), '');
    await workspace(page); await page.getByRole('button', { name: 'Reveal answers', exact: true }).click(); await page.locator('.reasoning-strip').waitFor();
    await workspace(page); await page.getByRole('button', { name: 'Hide answers', exact: true }).click(); assert.equal(await page.locator('.reasoning-strip').count(), 0);
    const oldBanner = await page.locator('.challenge-banner').innerText();
    await page.getByLabel('Vernier plate', { exact: true }).selectOption('50');
    assert.notEqual(await page.locator('.challenge-banner').innerText(), oldBanner);
    assert.equal(await page.locator('input[name="result"]').count(), 0, 'New task clears previous reading workspace');
  });

  await check('anatomy explosion and reassembly preserve physical state and draft', async page => {
    await setupMode(page, 'depth', 20); const before = await opening(page);
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click(); await page.locator('input[name="msr"]').fill('12');
    await nav(page, 'Anatomy'); await page.getByRole('button', { name: 'Explode instrument', exact: true }).click();
    await page.locator('.stage-exploded-label').waitFor(); await screenshot(page, 'anatomy-exploded.png');
    await page.getByRole('button', { name: 'Reassemble instrument', exact: true }).first().click();
    await page.getByRole('button', { name: 'Rear illustration', exact: true }).click();
    await page.getByRole('button', { name: 'Fixed rear step face', exact: true }).last().click();
    await nav(page, 'Measure'); assert.equal(await opening(page), before); assert.equal(await page.locator('input[name="msr"]').inputValue(), '12');
  });

  await check('active challenge reload route transitions and save opt-out preserve their contracts', async page => {
    // Establish earlier saved work so opting out cannot silently resurrect a
    // prior record or a prior assessment on the next startup.
    await setupMode(page, 'external', 50);
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    await answer(page, await oracle(page));
    assert.equal(await page.locator('.session-strip b').first().innerText(), '1');
    await workspace(page);
    await page.getByLabel('Learning objective', { exact: true }).selectOption('external');
    await page.getByLabel('Difficulty', { exact: true }).selectOption('standard');
    await page.getByLabel('Scenario seed', { exact: true }).fill('271828');
    await page.getByLabel('Optional challenge timer', { exact: true }).check();
    await page.getByRole('button', { name: 'Generate challenge', exact: true }).click();
    await page.getByRole('button', { name: '1. Place', exact: true }).click();
    await page.getByRole('button', { name: '2. Align & seat', exact: true }).click();
    await range(page).focus(); await page.keyboard.press('Home');
    await page.getByRole('button', { name: 'Lock slider', exact: true }).click();
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    for (const [name, value] of [['msr', '321'], ['index', '17'], ['result', '9.876']]) await page.locator(`input[name="${name}"]`).fill(value);
    const capture = async () => ({
      banner: await page.locator('.challenge-banner .eyebrow').innerText(),
      title: await page.locator('.route-heading h1').innerText(),
      N: await page.getByLabel('Vernier plate', { exact: true }).inputValue(),
      e: await page.getByLabel('Signed zero error', { exact: true }).inputValue(),
      d: await opening(page), locked: await range(page).isDisabled(),
      draft: await page.locator('.answer-grid input').evaluateAll(inputs => Object.fromEntries(inputs.map(input => [input.name, input.value]))),
      records: await page.locator('.session-strip b').first().innerText(),
    });
    const before = await capture(); assert.match(before.banner, /271828/); assert.equal(before.N, '50');
    await nav(page, 'Measure');
    assert.equal(await page.getByRole('button', { name: 'Practice', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByLabel('Signed zero error', { exact: true }).isDisabled(), false);
    await nav(page, 'Challenges');
    assert.equal(await page.getByLabel('Signed zero error', { exact: true }).isDisabled(), true);
    assert.deepEqual(await capture(), before, 'Viewing the bench must not generate a replacement challenge');
    await page.waitForTimeout(1100); // allow the documented debounced save to complete
    const timerBefore = await page.getByLabel('Optional elapsed time', { exact: true }).innerText();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.challenge-banner').waitFor();
    if (!(await page.locator('.reading-form').count())) await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#/challenges');
    assert.deepEqual(await capture(), before, 'Reload must restore the task, physical state, draft and completed observations together');
    const seconds = value => value.split(':').reduce((sum, component) => sum * 60 + Number(component), 0);
    assert.ok(seconds(await page.getByLabel('Optional elapsed time', { exact: true }).innerText()) >= seconds(timerBefore));
    await workspace(page); assert.equal(await page.getByLabel('Optional challenge timer', { exact: true }).isChecked(), true); await closeWorkspace(page);
    let updatePreservation = 'Not exercised: no waiting service-worker update was available.';
    const update = page.getByRole('button', { name: 'Save work & apply update', exact: true });
    if (await update.count()) {
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }), update.click()]);
      await page.locator('.challenge-banner').waitFor();
      if (!(await page.locator('.reading-form').count())) await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
      assert.deepEqual(await capture(), before);
      updatePreservation = 'Waiting update applied; active work survived its reload.';
    }
    await workspace(page); await page.getByLabel('Remember progress on this browser', { exact: true }).uncheck(); await closeWorkspace(page);
    let updateOptOutGuard = 'Not exercised: no waiting service-worker update was available.';
    if (await update.count()) {
      if (await update.isDisabled()) updateOptOutGuard = 'Pending update action was disabled while saving was off.';
      else {
        const currentURL = page.url(); await update.click();
        await waitUntil(async () => /remember/i.test(await page.locator('.toast').innerText()));
        assert.equal(page.url(), currentURL, 'The update guard must preserve the active route');
        assert.deepEqual(await capture(), before, 'The update guard must preserve opted-out active work');
        updateOptOutGuard = 'Update action displayed a Remember progress notice and preserved the active route, draft and measurement.';
      }
    }
    await page.waitForTimeout(1100); await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.challenge-banner').waitFor();
    assert.doesNotMatch(await page.locator('.challenge-banner .eyebrow').innerText(), /271828/);
    assert.equal(await range(page).isDisabled(), false);
    assert.equal(await page.locator('.session-strip b').first().innerText(), '0');
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    for (const name of ['msr', 'index', 'result']) assert.equal(await page.locator(`input[name="${name}"]`).inputValue(), '');
    await workspace(page); assert.equal(await page.getByLabel('Remember progress on this browser', { exact: true }).isChecked(), false); await closeWorkspace(page);
    return { restored: before, updatePreservation, updateOptOutGuard, optOutIgnoredEarlierWork: true };
  });

  await check('keyboard-only complete measuring and reading route', async page => {
    const first = page.getByRole('button', { name: 'Try your first measurement', exact: true }); await tabTo(page, first); await page.keyboard.press('Enter');
    await keyboardFill(page, page.getByLabel('Your prediction in millimetres', { exact: true }), '18');
    await tabTo(page, page.getByRole('button', { name: 'Let’s measure', exact: true })); await page.keyboard.press('Enter');
    for (const label of ['1. Place', '2. Align & seat']) { await tabTo(page, page.getByRole('button', { name: label, exact: true })); await page.keyboard.press('Enter'); }
    await tabTo(page, range(page)); await page.keyboard.press('Home');
    const d = await opening(page), q = Math.round(d * 10);
    await tabTo(page, page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true })); await page.keyboard.press('Enter');
    for (const [name, value] of [['msr', Math.floor(q / 10)], ['index', q % 10], ['result', q / 10]]) await keyboardFill(page, page.locator(`input[name="${name}"]`), String(value));
    await tabTo(page, page.getByRole('button', { name: 'Verify my measurement', exact: true })); await page.keyboard.press('Enter');
    await page.locator('#reading-feedback.success').waitFor();
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
    await check(`responsive viewport ${viewport.width}x${viewport.height}`, async page => {
      await setupMode(page, 'external', 50); await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
      await page.getByLabel('Reading magnification', { exact: true }).focus(); await page.keyboard.press('End');
      const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, microscope: document.querySelector('.scope-surface').getBoundingClientRect().width }));
      assert.ok(layout.document <= layout.viewport + 2, 'No whole-page horizontal overflow'); assert.ok(layout.microscope >= 240);
      await screenshot(page, `viewport-${viewport.width}x${viewport.height}.png`, page.getByTestId('microscope'));
      return layout;
    }, { viewport, isMobile: viewport.width <= 768, hasTouch: viewport.width <= 768, deviceScaleFactor: 1 });
  }

  await check('200 percent reflow reduced motion and dialog focus restoration', async page => {
    await page.setViewportSize({ width: 640, height: 900 }); // CSS-width equivalent of 1280px at 200% browser zoom
    await workspace(page); assert.equal(await page.getByLabel('Ambient motion', { exact: true }).isChecked(), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Workspace', exact: true }).evaluate(element => element === document.activeElement), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    return { method: '640 CSS-pixel viewport represents 1280 device pixels at 200%; this does not substitute a manual browser-zoom review.' };
  });

  await check('3D context loss keeps state and offers functional 2D measurement', async page => {
    await page.waitForFunction(() => performance.getEntriesByName('precision-lab-instrument-ready').length > 0);
    await setupMode(page, 'external', 50); const before = await opening(page);
    const lost = await page.locator('canvas').evaluate(canvas => { const gl = canvas.getContext('webgl2'); const extension = gl?.getExtension('WEBGL_lose_context'); if (!extension) return false; extension.loseContext(); return true; });
    assert.equal(lost, true, 'Browser supports test context-loss extension');
    await page.getByText('3D inspection unavailable.', { exact: false }).first().waitFor(); assert.equal(await opening(page), before);
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click(); await answer(page, await oracle(page));
    await screenshot(page, 'context-loss-2d-recovery.png');
  });

  await check('unavailable WebGL initializes the complete 2D learning route', async (page, context) => {
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return ['webgl', 'webgl2', 'experimental-webgl'].includes(kind) ? null : original.call(this, kind, ...args);
      };
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.flat-instrument').waitFor();
    await setupMode(page, 'internal', 20);
    await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click();
    await answer(page, await oracle(page));
    assert.equal(await page.locator('canvas').count(), 0);
  });

  await check('storage failure retains usable session and local CSV export', async (page, context) => {
    await context.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Storage blocked for test', 'QuotaExceededError'); }; Storage.prototype.getItem = function () { throw new DOMException('Storage blocked for test', 'SecurityError'); }; });
    await page.reload({ waitUntil: 'networkidle' }); await setupMode(page, 'external', 20); await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click(); await answer(page, await oracle(page));
    await page.getByRole('button', { name: 'Open notebook', exact: true }).click();
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
    const file = await download; await file.saveAs(path.join(evidence, 'storage-blocked-observations.csv'));
    assert.match(await fs.readFile(path.join(evidence, 'storage-blocked-observations.csv'), 'utf8'), /reference_corrected_mm/);
  });

  await check('50 replacements and 20 navigation explosion cycles resource stability', async page => {
    await setupMode(page, 'external', 50); const samples = [];
    for (let i = 0; i < 50; i++) {
      await page.getByRole('button', { name: 'Generate random object', exact: true }).click();
      if (i % 5 === 4) { await page.waitForTimeout(1200); samples.push(await page.evaluate(() => window.__precisionTest.diagnostics.at(-1) ?? null)); }
    }
    for (let i = 0; i < 20; i++) {
      await nav(page, 'Anatomy'); await page.getByRole('button', { name: 'Explode instrument', exact: true }).click();
      await page.getByRole('button', { name: 'Reassemble instrument', exact: true }).first().click(); await nav(page, 'Measure');
      if (i % 5 === 4) { await page.waitForTimeout(1200); samples.push(await page.evaluate(() => window.__precisionTest.diagnostics.at(-1) ?? null)); }
    }
    assert.ok(samples.every(Boolean), 'The local diagnostic event is available for actual counters');
    for (const key of ['geometries', 'textures', 'materials', 'meshes']) {
      const values = samples.slice(2).map(sample => sample[key]);
      const monotonic = values.every((value, i) => i === 0 || value >= values[i - 1]);
      assert.ok(!monotonic || values.at(-1) - values[0] <= 2, `${key} grows monotonically after settling: ${values}`);
    }
    assert.equal(await page.locator('canvas').count(), 1); return { samples, caveat: 'Renderer counters and DOM canvas count; no claim about universal process memory or actual-device frame targets.' };
  });

  // A persistent profile is required: a second page in the same live context is
  // insufficient evidence for a cold browser restart with networking disabled.
  const offlineStarted = Date.now(); const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'precision-lab-offline-'));
  let persistent;
  try {
    persistent = await chromium.launchPersistentContext(profile, { ...launchOptions, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true }); await instrument(persistent);
    let page = persistent.pages()[0] ?? await persistent.newPage(); await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Make available offline', exact: true }).click(); await page.getByRole('button', { name: 'Offline ready', exact: true }).waitFor({ timeout: 60000 });
    await page.evaluate(() => navigator.serviceWorker.ready); await persistent.close(); persistent = undefined;
    persistent = await chromium.launchPersistentContext(profile, { ...launchOptions, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true, offline: true }); await instrument(persistent);
    page = persistent.pages()[0] ?? await persistent.newPage(); await page.goto(base + '#/discover', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /How Small Can We Measure/i }).waitFor();
    for (const route of ['Explore', 'Anatomy', 'Discover', 'Challenges', 'Measure']) { await nav(page, route); await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: route, exact: true }).waitFor(); }
    for (const mode of ['external', 'internal', 'depth', 'step']) { await setupMode(page, mode, 50); await page.locator('.bench-sidebar').getByRole('button', { name: 'Read the scales', exact: true }).click(); await answer(page, await oracle(page)); }
    const enable = page.getByRole('button', { name: 'Enable sound', exact: true }); if (await enable.count()) await enable.click(); else { await page.getByRole('button', { name: 'Mute sound', exact: true }).click(); await enable.click(); }
    await page.getByRole('button', { name: 'Close fine step', exact: true }).click();
    const sound = await page.evaluate(() => ({ contexts: window.__precisionTest.audioContexts, created: window.__precisionTest.audioNodesCreated })); assert.equal(sound.contexts, 1); assert.ok(sound.created >= 2);
    await page.getByRole('button', { name: 'Open notebook', exact: true }).click(); const downloaded = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export CSV', exact: true }).click(); await (await downloaded).saveAs(path.join(evidence, 'offline-observations.csv'));
    await screenshot(page, 'offline-cold-restart-notebook.png');
    report.checks.push({ name: 'offline complete package cold browser restart all routes modes sound and CSV', status: 'passed', durationMs: Date.now() - offlineStarted, detail: { networkOffline: true, persistentProfileRestart: true, sound } });
  } catch (error) {
    report.checks.push({ name: 'offline complete package cold browser restart all routes modes sound and CSV', status: 'failed', durationMs: Date.now() - offlineStarted, error: String(error.stack ?? error) });
  } finally { await persistent?.close(); await fs.rm(profile, { recursive: true, force: true }); }

  report.checks.push({ name: 'runtime requests remain local', status: report.externalRequests.length ? 'failed' : 'passed', detail: { unexpectedRequests: report.externalRequests } });
  report.status = report.checks.some(check => check.status === 'failed') ? 'failed' : 'passed';
  report.finished = new Date().toISOString(); await writeReport();
  console.log(`${report.checks.filter(check => check.status === 'passed').length}/${report.checks.length} browser checks passed. Report: docs/evidence/e2e/browser-report.json`);
  process.exitCode = report.status === 'passed' ? 0 : 1;
} catch (error) {
  report.status = browser ? 'failed' : 'blocked'; report.finished = new Date().toISOString(); report.blocker = String(error.stack ?? error);
  await writeReport(); console.error(`Browser acceptance ${report.status.toUpperCase()}: ${error.message}`); process.exitCode = 1;
} finally {
  await browser?.close(); if (server && !server.killed) server.kill('SIGTERM');
}
