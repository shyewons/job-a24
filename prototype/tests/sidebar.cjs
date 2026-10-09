const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        assert.equal(await page.locator('.bottom-nav').count(), 0, 'Remove footer overlay');
        assert.equal(await page.locator('.intro #help-button').count(), 1);
        const aligned = await page.evaluate(() => document.querySelector('#help-button').getBoundingClientRect().left > document.querySelector('#remaining').getBoundingClientRect().right);
        assert.equal(aligned, true);
        for (const width of [320, 390, 1280]) {
            await page.setViewportSize({ width, height: 844 });
            await page.locator('#menu-button').click(); await page.waitForTimeout(300);
            const r = await page.locator('.side-panel').boundingBox();
            assert.ok(Math.abs(r.width - Math.min(width, 430) * 2 / 3) < 2);
            assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'), 'true');
            await page.mouse.click((width - Math.min(width, 430)) / 2 + 20, 200);
            await page.locator('#menu-dialog').waitFor({ state: 'hidden' });
            assert.equal(await page.locator('#menu-dialog').isVisible(), false);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('#menu-button').click(); await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(__dirname, '../../output/prototype-sidebar.png') });
        await page.keyboard.press('Escape'); await page.locator('#menu-dialog').waitFor({ state: 'hidden' });
        assert.equal(await page.locator('#menu-dialog').isVisible(), false);
        assert.equal(await page.locator('#menu-button').evaluate(el => el === document.activeElement), true);
        await page.locator('#menu-button').click(); await page.waitForTimeout(300);
        await page.locator('#nav-matches').click(); await page.waitForURL('**/matching.html');
        assert.equal(await page.locator('.header h1').innerText(), '나의 매칭');
        await page.locator('#menu-button').click();
        await page.locator('#nav-explore').click(); await page.waitForURL('**/index.html');
        await page.locator('#help-button').click();
        assert.equal(await page.locator('#info-dialog').isVisible(), true);
        console.log('PASS: no footer, help next to count, two-thirds sidebar, backdrop dismissal, Escape/focus restoration, preserved menu actions');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
