const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
        await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
        async function metrics() {
            return page.evaluate(() => {
                const card = document.querySelector('#card');
                const front = document.querySelector('#card-front');
                const body = document.querySelector('.job-body');
                const wrap = document.querySelector('.wrap');
                return {
                    height: card.offsetHeight,
                    gap: front.getBoundingClientRect().bottom - wrap.getBoundingClientRect().bottom,
                    padding: parseFloat(getComputedStyle(body).paddingBottom),
                    handleGap: document.querySelector('#handle').getBoundingClientRect().top - card.getBoundingClientRect().bottom,
                    stackHeight: document.querySelector('.stack-one').offsetHeight,
                    overflow: document.documentElement.scrollWidth > innerWidth,
                };
            });
        }
        for (const width of [390, 320, 430]) {
            await page.setViewportSize({ width, height: 844 });
            const before = await metrics();
            assert.ok(Math.abs(before.gap - before.padding) < 2, `Only normal padding should remain under footer at ${width}px: ${JSON.stringify(before)}`);
            assert.ok(Math.abs(before.handleGap) < 2);
            assert.ok(Math.abs(before.stackHeight - before.height) < 2);
            assert.equal(before.overflow, false);
            const original = await page.locator('#job-title').innerText();
            await page.locator('#job-title').evaluate(el => { el.textContent = '여러 줄로 길게 표시되는 공고 제목으로 내용이 늘어날 때 카드가 잘리지 않고 충분히 늘어나며 아래 버튼도 모두 보이는지 확인합니다'; });
            const longer = await metrics();
            assert.ok(longer.height > before.height + 20, 'Long content must grow the card');
            assert.ok(Math.abs(longer.gap - longer.padding) < 2);
            await page.locator('#job-title').evaluate((el, value) => { el.textContent = value; }, original);
            assert.equal((await metrics()).height, before.height, 'Short content must shrink the card again');
        }
        await page.setViewportSize({ width: 390, height: 844 });
        const frontHeight = (await metrics()).height;
        await page.locator('#push-button').click();
        const backHeight = await page.locator('#card').evaluate(el => el.offsetHeight);
        await page.getByRole('button', { name: '기타', exact: true }).click();
        const expanded = await page.locator('#card').evaluate(el => el.offsetHeight);
        assert.ok(expanded > backHeight + 40, 'Other field must grow feedback naturally');
        await page.getByRole('button', { name: '기타', exact: true }).click();
        assert.equal(await page.locator('#card').evaluate(el => el.offsetHeight), backHeight);
        await page.locator('#cancel-feedback').click();
        assert.equal((await metrics()).height, frontHeight, 'Back content must not reserve space on front');
        await page.screenshot({ path: path.join(__dirname, '../../output/prototype-preview.png'), fullPage: true });
        console.log('PASS: natural card height, long/short content, preserved footer, attached handle/stack, responsive widths, expanding and shrinking feedback');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
