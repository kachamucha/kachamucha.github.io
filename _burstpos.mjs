import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2, reducedMotion:'reduce' });
const p = await ctx.newPage();
await p.goto('http://localhost:4173/', { waitUntil:'networkidle' });
await p.waitForTimeout(800);
console.log(await p.evaluate(() => {
  const b = document.querySelector('.hero-burst').getBoundingClientRect();
  const hero = document.querySelector('.hero').getBoundingClientRect();
  return { burst: { x: Math.round(b.x), right: Math.round(b.right), y: Math.round(b.y), bottom: Math.round(b.bottom) },
           hero: { x: Math.round(hero.x), right: Math.round(hero.right), y: Math.round(hero.y), bottom: Math.round(hero.bottom) },
           clippedLeft: b.x < hero.x, clippedRight: b.right > hero.right,
           clippedTop: b.y < hero.y, clippedBottom: b.bottom > hero.bottom };
}));
await b.close();
