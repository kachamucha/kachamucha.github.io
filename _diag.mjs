import { chromium } from 'playwright-core';
const dir = '/private/tmp/claude-501/-Users-alex-Downloads-Kacha-Mucha-main/83b5d52f-0b4c-44fd-b539-2d0d16d57646/scratchpad';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto('http://localhost:4173/', { waitUntil:'networkidle' });
// scroll through the pinned strike range with real motion enabled (not reduced)
for (const y of [100, 300, 500, 700, 900, 1100]) {
  await p.evaluate(v => scrollTo(0, v), y);
  await p.waitForTimeout(500);
  const clip = await p.evaluate(() => {
    const out = {};
    const hero = document.querySelector('.hero').getBoundingClientRect();
    ['hero-burst', ...[...document.querySelectorAll('.hero-trail-mark')].map((_, i) => null)].filter(Boolean);
    const burst = document.querySelector('.hero-burst').getBoundingClientRect();
    const marks = [...document.querySelectorAll('.hero-trail-mark')].map((el, i) => {
      const r = el.getBoundingClientRect();
      return { i, x: Math.round(r.x), right: Math.round(r.right), opacity: getComputedStyle(el).opacity };
    });
    return { burst: { x: Math.round(burst.x), right: Math.round(burst.right) }, marks, heroLeft: Math.round(hero.x), heroRight: Math.round(hero.right) };
  });
  console.log('scrollY', y, JSON.stringify(clip));
}
await p.screenshot({ path: `${dir}/scroll-900.png` });
await b.close();
