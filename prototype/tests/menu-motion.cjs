const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        await page.locator('#menu-button').click();
        const opening = await page.locator('.side-panel').evaluate(panel => {
            const animation = panel.getAnimations()[0]; animation.pause(); animation.currentTime = 55;
            return { scroll: panel.parentElement.scrollLeft, x: panel.getBoundingClientRect().left };
        });
        assert.equal(opening.scroll, 0, 'Autofocus must not scroll the dialog sideways');
        assert.ok(opening.x > 230, 'Menu must actually slide from the right, not stand still');
        await page.keyboard.press('Escape');
        await page.locator('#menu-dialog').waitFor({ state: 'hidden' });
        await page.locator('#menu-button').click(); await page.waitForTimeout(300);
        const final = await page.locator('#menu-dialog').evaluate(el => ({ scroll: el.scrollLeft, background: getComputedStyle(el, '::backdrop').backgroundColor }));
        assert.equal(final.scroll, 0);
        assert.equal(final.background, 'rgba(0, 0, 0, 0.45)');
        await page.screenshot({ path: path.join(__dirname, '../../output/prototype-sidebar.png') });
        console.log('PASS: opening slides without autofocus scroll, early dismissal, clean reopen, 45% black backdrop');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
