const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(pathToFileURL(path.join(__dirname, '../index.html')).href);
    async function rotationAtHalf() {
      return page.locator('#card').evaluate(card => {
        const animation = card.getAnimations().find(a => a.transitionProperty === 'transform');
        if (!animation) return null;
        animation.pause(); animation.currentTime = 170;
        const m = new DOMMatrixReadOnly(getComputedStyle(card).transform);
        return { x: m.m23, y: m.m13 };
      });
    }
    await page.locator('#push-button').click();
    const push = await rotationAtHalf();
    assert.ok(push && push.x < -.1 && Math.abs(push.y) < .001, 'Push must rotate on X with top edge moving toward viewer and downward');
    await page.locator('#card').evaluate(el => el.getAnimations().forEach(a => a.finish()));
    assert.equal(await page.locator('#card-back').getAttribute('aria-hidden'), 'false');
    assert.equal(await page.locator('#confirm-reject').isDisabled(), true);
    await page.locator('#cancel-feedback').click(); await page.waitForTimeout(650);
    await page.locator('#pull-button').click();
    const pull = await rotationAtHalf();
    assert.ok(pull && pull.x > .1 && Math.abs(pull.y) < .001, 'Pull must rotate on X in opposite direction, bottom edge moving up');
    await page.locator('#card').evaluate(el => el.getAnimations().forEach(a => a.finish()));
    assert.equal(await page.locator('#applied-title').innerText(), '플러팅을 날렸습니다');
    assert.equal(await page.locator('#card-success').getAttribute('aria-hidden'), 'false');
    assert.equal(await page.locator('#card-back').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#remaining').innerText(), '남은 공고 5개');
    await page.screenshot({ path: path.join(__dirname, '../../output/prototype-applied.png'), fullPage: true });
    await page.waitForTimeout(650);
    assert.equal(await page.locator('#card').getAttribute('data-face'), 'applied', 'Keep confirmation readable instead of immediately advancing');
    await page.waitForFunction(() => document.querySelector('#card').dataset.face === 'front');
    assert.match(await page.locator('#company-name').innerText(), /스튜디오 온도/);
    assert.equal(await page.locator('#remaining').innerText(), '남은 공고 5개');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#pull-button').click();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#card').getAttribute('data-face'), 'applied', 'Reduced motion must still show confirmation');
    await page.locator('#next-job').click(); await page.waitForTimeout(100);
    assert.equal(await page.locator('#remaining').innerText(), '남은 공고 4개');
    console.log('PASS: opposite vertical flip directions, mandatory rejection, readable application back, automatic next card, reduced motion confirmation');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
