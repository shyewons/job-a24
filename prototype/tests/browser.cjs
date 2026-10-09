const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const appPath = path.join(__dirname, '../index.html');

(async () => {
  assert.ok(fs.existsSync(appPath), 'Explorer UI has not been implemented');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const wait = () => page.waitForTimeout(700);
  const count = async n => assert.equal(await page.locator('#remaining').innerText(), `남은 공고 ${n}개`);
  async function drag(dy, dx = 0) {
    const b = await page.locator('#grip').boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 12 }); await page.mouse.up();
    await wait();
  }
  try {
    await page.goto(pathToFileURL(appPath).href);
    await count(6);
    await drag(25); await count(6);
    await drag(10, 90); await count(6);
    await drag(-85);
    assert.equal(await page.locator('#card').getAttribute('data-face'), 'back');
    await count(6);
    assert.equal(await page.locator('#confirm-reject').isDisabled(), true);
    await page.getByRole('button', { name: '급여', exact: true }).click();
    assert.equal(await page.locator('#confirm-reject').isEnabled(), true);
    await page.locator('#cancel-feedback').click(); await wait(); await count(6);
    await page.locator('#push-button').click(); await wait();
    assert.equal(await page.locator('#confirm-reject').isDisabled(), true);
    await page.getByRole('button', { name: '기타', exact: true }).click();
    assert.equal(await page.locator('#confirm-reject').isDisabled(), true);
    await page.locator('#other-detail').fill('   ');
    assert.equal(await page.locator('#confirm-reject').isDisabled(), true);
    await page.locator('#other-detail').fill('주말 근무가 어려워요');
    await page.locator('#confirm-reject').click(); await wait(); await count(5);
    await drag(90); await count(4);
    assert.equal(await page.locator('#card').getAttribute('data-face'), 'applied');
    assert.equal(await page.locator('#applied-title').innerText(), '플러팅을 날렸습니다');
    await page.locator('#next-job').click(); await wait();
    // Two overlapping application intents still consume only the current job.
    await page.locator('#pull-button').focus(); await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown'); await wait(); await count(3);
    await page.locator('#next-job').click(); await wait();
    await page.locator('#detail-button').click();
    await page.locator('#job-details').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#job-details').isVisible(), true);
    assert.equal(await page.locator('#info-dialog').isVisible(), false);
    await page.locator('#detail-button').click(); await wait();
    for (let i = 0; i < 3; i++) { await page.locator('#pull-button').click(); await wait(); await page.locator('#next-job').click(); await wait(); }
    await count(0);
    assert.equal(await page.locator('#complete').isVisible(), true);
    await page.locator('#restart').click(); await wait(); await count(6);
    await page.locator('#push-button').focus(); await page.keyboard.press('Enter'); await wait();
    assert.equal(await page.locator('#card').getAttribute('data-face'), 'back');
    assert.equal(await page.locator('#card-front').getAttribute('inert'), '');
    await page.locator('#cancel-feedback').click(); await wait();
    for (const width of [320, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `horizontal overflow at ${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(__dirname, '../../output/prototype-preview.png'), fullPage: true });
    await page.locator('#push-button').click(); await wait();
    await page.getByRole('button', { name: '급여', exact: true }).click();
    await page.screenshot({ path: path.join(__dirname, '../../output/prototype-feedback.png'), fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#cancel-feedback').click(); await wait();
    await page.locator('#pull-button').click(); await wait(); await count(5);
    assert.deepEqual(errors, []);
    console.log('PASS: mouse gestures, mandatory feedback, other details, cancellation, application back face, double input, details, completion, restart, keyboard, responsive layout, reduced motion; no page errors');
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const tp = await touch.newPage(); await tp.goto(pathToFileURL(appPath).href);
    const cdp = await touch.newCDPSession(tp);
    const box = await tp.locator('#grip').boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x,y}] });
    await tp.waitForTimeout(50);
    for (let step = 1; step <= 6; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x,y:y-step*15}] });
      await tp.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await tp.waitForTimeout(900);
    assert.equal(await tp.locator('#card').getAttribute('data-face'), 'back');
    await tp.getByRole('button', { name: '거리', exact: true }).tap();
    await tp.waitForTimeout(400);
    assert.equal(await tp.getByRole('button', { name: '거리', exact: true }).getAttribute('aria-pressed'), 'true');
    await tp.locator('#confirm-reject').tap(); await tp.waitForTimeout(700);
    assert.equal(await tp.locator('#remaining').innerText(), '남은 공고 5개');
    // Test cancellation last: Edge's CDP touchCancel suppresses a later native button
    // click even in plain HTML with no app handlers (see verification notes).
    const nextBox = await tp.locator('#grip').boundingBox();
    const nx = nextBox.x + nextBox.width / 2, ny = nextBox.y + nextBox.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x:nx,y:ny}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x:nx,y:ny-90}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await tp.waitForTimeout(700);
    assert.equal(await tp.locator('#card').getAttribute('data-face'), 'front');
    assert.equal(await tp.locator('#remaining').innerText(), '남은 공고 5개');
    console.log('PASS: mobile touch swipe, cancelled touch, feedback selection and submission');
    await touch.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
