import { chromium } from 'playwright-core';
const dir = '/private/tmp/claude-501/-Users-alex-Downloads-Kacha-Mucha-main/83b5d52f-0b4c-44fd-b539-2d0d16d57646/scratchpad';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2, reducedMotion:'reduce' });
const p = await ctx.newPage();
await p.goto('http://localhost:4173/', { waitUntil:'networkidle' });
await p.waitForTimeout(1000);
await p.screenshot({ path: `${dir}/moved-up.png` });
console.log(await p.evaluate(() => {
  const burst = document.querySelector('.hero-burst').getBoundingClientRect();
  const hand = document.querySelector('.hero-hand').getBoundingClientRect();
  return { burstClipped: burst.x < 0 || burst.right > innerWidth, burstY: Math.round(burst.y/innerHeight*100), handY: Math.round(hand.y/innerHeight*100) };
}));
await b.close();
