import { chromium } from 'playwright-core';
const dir = '/private/tmp/claude-501/-Users-alex-Downloads-Kacha-Mucha-main/83b5d52f-0b4c-44fd-b539-2d0d16d57646/scratchpad';
const b = await chromium.launch({ channel: 'chrome' });
const errs = [];
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2, reducedMotion:'reduce' });
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4173/', { waitUntil:'load' });
await p.waitForTimeout(1200);
await p.screenshot({ path: `${dir}/resized.png` });
const geom = await p.evaluate(() => {
  const hand = document.querySelector('.hero-hand').getBoundingClientRect();
  const burst = document.querySelector('.hero-burst').getBoundingClientRect();
  return {
    hand: { w: Math.round(hand.width), h: Math.round(hand.height) },
    burst: { x: Math.round(burst.x), right: Math.round(burst.right), clippedLeft: burst.x < 0, clippedRight: burst.right > innerWidth }
  };
});
console.log(JSON.stringify(geom, null, 2));
console.log('xOverflow:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
await b.close();
console.log('errors:', errs.length ? errs : 'none');
