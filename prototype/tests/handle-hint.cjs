const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.clock.install({ time: new Date('2026-10-08T00:00:00Z') });
        await page.clock.pauseAt(new Date('2026-10-08T00:00:01Z'));
        await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        const running = () => page.locator('#handle').evaluate(el => el.classList.contains('handle-hint'));
        await page.clock.runFor(2999);
        assert.equal(await running(), false, 'No hint before 3 seconds');
        await page.clock.runFor(1);
        assert.equal(await running(), true, 'Hint starts at 3 seconds');
        const animation = await page.locator('#handle').evaluate(el => {
            const css = getComputedStyle(el);
            const frames = el.getAnimations()[0]?.effect.getKeyframes() || [];
            return { iterations: css.animationIterationCount, downward: frames.some(f => f.transform && new DOMMatrixReadOnly(f.transform).m42 > 0) };
        });
        assert.equal(animation.iterations, '2');
        assert.equal(animation.downward, true);
        assert.equal(await page.locator('#remaining').innerText(), '남은 공고 6개');
        await page.locator('#grip').dispatchEvent('keydown', { key: 'Tab' });
        assert.equal(await running(), false, 'Interaction cancels an active hint');
        await page.locator('#push-button').click();
        await page.clock.runFor(700);
        await page.locator('#cancel-feedback').click();
        await page.clock.runFor(4000);
        assert.equal(await running(), false, 'Same card does not replay after feedback cancellation');
        await page.locator('#pull-button').click();
        await page.clock.runFor(2600);
        await page.clock.runFor(2999 - 40);
        assert.equal(await running(), false, 'Next job gets a fresh delay');
        await page.clock.runFor(1);
        assert.equal(await running(), true, 'New job gets its own hint');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.clock.runFor(32);
        await page.waitForFunction(() => !document.querySelector('#handle').classList.contains('handle-hint'));
        assert.equal(await running(), false, 'Changing reduced motion stops hint');
        await page.reload();
        await page.clock.runFor(4000);
        assert.equal(await running(), false, 'Reduced motion disables hints');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.reload();
        await page.locator('#help-button').click();
        await page.clock.runFor(4000);
        assert.equal(await running(), false, 'Opening a dialog cancels pending hint');
        console.log('PASS: 3-second delay, two downward motions, no application side effect, input cancellation, per-card scheduling, reduced motion, dialog cancellation');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
