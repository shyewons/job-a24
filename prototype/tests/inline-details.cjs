const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        const shortHeight = await page.locator('#card').evaluate(el => el.offsetHeight);
        await page.locator('#detail-button').click();
        assert.equal(await page.locator('#info-dialog').isVisible(), false, 'Details must expand inside card, not modal');
        assert.equal(await page.locator('#detail-button').getAttribute('aria-expanded'), 'true');
        await page.waitForTimeout(400);
        assert.ok(await page.locator('#card').evaluate(el => el.offsetHeight) > shortHeight + 200);
        assert.equal(await page.locator('#job-details').isVisible(), true);
        assert.match(await page.locator('#job-details').innerText(), /React/);
        await page.mouse.wheel(0, 350); await page.waitForTimeout(400);
        assert.ok(await page.locator('.header').evaluate(el => el.getBoundingClientRect().bottom) <= 0, 'Scrolling down hides header');
        await page.mouse.wheel(0, -12); await page.waitForTimeout(400);
        assert.ok(Math.abs(await page.locator('.header').evaluate(el => el.getBoundingClientRect().top)) < 2, 'Small upward scroll reveals sticky header');
        await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(__dirname, '../../output/prototype-details.png'), fullPage: true });
        await page.locator('#handle').scrollIntoViewIfNeeded();
        assert.ok(await page.locator('#handle').evaluate(el => el.getBoundingClientRect().top) < 844, 'Handle follows the end of details');
        await page.locator('#detail-button').click(); await page.waitForTimeout(400);
        assert.equal(await page.locator('#job-details').isVisible(), false);
        assert.equal(await page.locator('#detail-button').getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('#card').evaluate(el => el.offsetHeight), shortHeight);
        await page.locator('#detail-button').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
        await page.locator('#grip').scrollIntoViewIfNeeded();
        await page.locator('#push-button').click(); await page.waitForTimeout(700);
        assert.equal(await page.locator('#card').getAttribute('data-face'), 'back');
        assert.equal(await page.locator('#job-details').isVisible(), false);
        assert.ok(await page.locator('#feedback-title').evaluate(el => el.getBoundingClientRect().top) >= 0, 'Feedback remains in view after shrinking expanded card');
        await page.locator('#cancel-feedback').click(); await page.waitForTimeout(700);
        await page.locator('#detail-button').click(); await page.waitForTimeout(400);
        await page.locator('#pull-button').click(); await page.waitForTimeout(700);
        assert.equal(await page.locator('#card').getAttribute('data-face'), 'applied');
        assert.ok(await page.locator('#applied-title').evaluate(el => el.getBoundingClientRect().top) >= 0);
        await page.locator('#next-job').click(); await page.waitForTimeout(700);
        assert.equal(await page.locator('#detail-button').getAttribute('aria-expanded'), 'false');
        await page.locator('#detail-button').click(); await page.waitForTimeout(400);
        assert.match(await page.locator('#job-details').innerText(), /사용자 리서치/);
        assert.equal(await page.locator('#remaining').innerText(), '남은 공고 5개');
        for (const width of [320, 430, 1280]) {
            await page.setViewportSize({ width, height: 844 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        }
        assert.deepEqual(errors, []);
        const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        const mobile = await touch.newPage(); await mobile.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        await mobile.locator('#detail-button').tap(); await mobile.waitForTimeout(400);
        const cdp = await touch.newCDPSession(mobile);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 650 }] });
        for (let step = 1; step <= 10; step++) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: 650 - step * 30 }] });
            await mobile.waitForTimeout(25);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await mobile.waitForTimeout(500);
        assert.ok(await mobile.evaluate(() => scrollY) > 80, 'Expanded card supports real touch scrolling');
        assert.equal(await mobile.locator('#card').getAttribute('data-face'), 'front');
        assert.equal(await mobile.locator('#remaining').innerText(), '남은 공고 6개');
        await touch.close();
        console.log('PASS: inline expansion, close/restore, new job details, handle actions, scroll-aware sticky header, keyboard, responsive layout, real touch scrolling without accidental decision');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
