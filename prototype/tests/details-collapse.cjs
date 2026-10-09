const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        const layout = await page.evaluate(() => {
            const button = document.querySelector('#detail-button'), tags = document.querySelector('#tags');
            return { below: button.getBoundingClientRect().top >= tags.getBoundingClientRect().bottom, width: button.offsetWidth, containerWidth: tags.offsetWidth };
        });
        assert.equal(layout.below, true, 'Detail button must appear below tags');
        assert.equal(layout.width, layout.containerWidth, 'Detail button must be full width');
        await page.locator('#detail-button').click(); await page.waitForTimeout(350);
        const same = await page.evaluate(() => {
            const a = getComputedStyle(document.querySelector('#detail-button')), b = getComputedStyle(document.querySelector('#cancel-feedback'));
            return ['backgroundColor','color','fontSize','fontWeight','borderRadius','padding'].every(key => a[key] === b[key]);
        });
        assert.equal(same, true, 'Detail toggle keeps the secondary button style');
        await page.locator('#detail-button').click();
        const collapse = await page.locator('#job-details').evaluate(el => {
            const animation = el.getAnimations()[0];
            if (!animation) return null;
            animation.pause(); animation.currentTime = 100;
            return { hidden: el.hidden, height: el.getBoundingClientRect().height, frames: animation.effect.getKeyframes().map(f => f.height) };
        });
        assert.ok(collapse && !collapse.hidden && collapse.height > 0, 'Closing keeps content present while it animates');
        assert.equal(collapse.frames.at(-1), '0px');
        await page.locator('#job-details').evaluate(el => el.getAnimations().forEach(a => a.finish()));
        await page.waitForTimeout(100);
        assert.equal(await page.locator('#job-details').isVisible(), false);
        assert.equal(await page.locator('#detail-button').getAttribute('aria-expanded'), 'false');
        // Rapidly reverse a close: a stale finish callback must not hide the reopened content.
        await page.locator('#detail-button').click(); await page.waitForTimeout(350);
        await page.locator('#detail-button').click();
        await page.locator('#detail-button').click(); await page.waitForTimeout(400);
        assert.equal(await page.locator('#job-details').isVisible(), true);
        assert.equal(await page.locator('#detail-button').getAttribute('aria-expanded'), 'true');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.locator('#detail-button').click();
        assert.equal(await page.locator('#job-details').isVisible(), false);
        console.log('PASS: full-width detail button below tags, matching style, animated close, interrupted close/reopen, reduced motion');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
