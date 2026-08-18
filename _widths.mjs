import { chromium } from 'playwright-core';
const dir = '/private/tmp/claude-501/-Users-alex-Downloads-Kacha-Mucha-main/83b5d52f-0b4c-44fd-b539-2d0d16d57646/scratchpad';
const b = await chromium.launch({ channel: 'chrome' });
for (const w of [430, 500, 600, 700, 720]) {
  const ctx = await b.newContext({ viewport:{width:w,height:1000}, reducedMotion:'reduce' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/', { waitUntil:'networkidle' });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${dir}/w-${w}.png` });
  const marks = await p.evaluate(() => [...document.querySelectorAll('.hero-trail-mark')].map(el => {
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), right: Math.round(b.right) };
  }));
  console.log(w, marks);
  await ctx.close();
}
await b.close();
