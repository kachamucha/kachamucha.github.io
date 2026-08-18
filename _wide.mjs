import { chromium } from 'playwright-core';
const dir = '/private/tmp/claude-501/-Users-alex-Downloads-Kacha-Mucha-main/83b5d52f-0b4c-44fd-b539-2d0d16d57646/scratchpad';
const b = await chromium.launch({ channel: 'chrome' });
for (const w of [500, 600, 700, 720]) {
  const ctx = await b.newContext({ viewport:{width:w,height:1140}, reducedMotion:'reduce' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/', { waitUntil:'networkidle' });
  await p.waitForTimeout(700);
  const clip = await p.evaluate(() => {
    const burst = document.querySelector('.hero-burst').getBoundingClientRect();
    return { x: Math.round(burst.x), right: Math.round(burst.right), clippedLeft: burst.x < 0 };
  });
  console.log(w, clip);
  await p.screenshot({ path: `${dir}/wide-${w}.png` });
  await ctx.close();
}
await b.close();
