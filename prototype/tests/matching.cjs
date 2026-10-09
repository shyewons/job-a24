const { chromium } = require('C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const b=await chromium.launch({channel:'msedge',headless:true});
 try {
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/html/matching.html');
 assert.equal(await p.locator('.match-card').count(),8);
 for(const [filter,count] of [['progress',4],['success',1],['closed',2],['passed',1],['all',8]]) {await p.locator(`[data-filter="${filter}"]`).click();assert.equal(await p.locator('.match-card').count(),count);}
 await p.locator('#match-notice').click();assert.equal(await p.locator('.match-card').count(),2);
 await p.getByRole('button',{name:'요청 확인하기',exact:true}).click();assert.equal(await p.locator('#dialog-title').innerText(),'추가 서류 요청');await p.locator('#dialog-done').click();
 await p.locator('#match-notice').click();await p.locator('#match-sort').selectOption('deadline');
 for(const width of [320,390,430,1280]) {await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'output/prototype-matching.png',fullPage:true});
 await p.locator('#menu-button').click();await p.locator('#nav-explore').click();await p.waitForURL('**/index.html');
 await p.locator('#pull-button').click();await p.locator('#next-job').click();
 await p.locator('#menu-button').click();await p.locator('#nav-matches').click();await p.waitForURL('**/matching.html');assert.equal(await p.locator('.match-card').count(),9);
 await p.locator('#menu-button').click();await p.locator('#nav-explore').click();await p.waitForURL('**/index.html');assert.equal(await p.locator('#remaining').innerText(),'남은 공고 5개');
 assert.deepEqual(errors,[]);console.log('PASS: tabs, notice, sort, requests, responsive layout, menu navigation and retained application history');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
