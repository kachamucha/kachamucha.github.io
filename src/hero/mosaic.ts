import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK_DESKTOP, MOTION_STATIC } from '../lib/reducedMotion';

/* The mosaic's books already loop on their diagonals in CSS. The stickers are
   the only static things on the slide, so they slap on as it arrives —
   oversized and crooked for a beat, then flat. */

const SECTION_SELECTOR = '.shop-mosaic';
const STICKER_SELECTOR = '.mosaic-tile[class*="mosaic-sticker"]';

const CONFIG = {
  startScale: 1.45,
  startTiltDeg: 9,
  duration: 0.55,
  stagger: 0.11
} as const;

export function initMosaic(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  if (!section) return;

  const stickers = Array.from(section.querySelectorAll<HTMLElement>(STICKER_SELECTOR));
  if (!stickers.length) return;

  const mm = gsap.matchMedia();

  // Phone (or reduced motion): no slap-on entrance. clearProps drops any inline
  // styles a previous desktop run left behind so the CSS mobile tilts show.
  mm.add(MOTION_STATIC, () => {
    gsap.set(stickers, { clearProps: 'all' });
  });

  mm.add(MOTION_OK_DESKTOP, () => {
    // Read each sticker's CSS-intended final rotation so mobile overrides
    // (e.g. the parental advisory tilt) survive the entrance animation.
    const finalRotations = stickers.map((el) => {
      const mat = new DOMMatrix(getComputedStyle(el).transform);
      return Math.round(Math.atan2(mat.b, mat.a) * (180 / Math.PI));
    });

    // alternate the tilt so they do not all land the same way
    stickers.forEach((el, i) => {
      gsap.set(el, {
        opacity: 0,
        scale: CONFIG.startScale,
        rotate: i % 2 ? CONFIG.startTiltDeg : -CONFIG.startTiltDeg
      });
    });

    const tl = gsap.timeline({ paused: true });
    stickers.forEach((el, i) => {
      tl.to(el, {
        opacity: 1,
        scale: 1,
        rotate: finalRotations[i],
        duration: CONFIG.duration,
        ease: 'back.out(1.7)'
      }, i * CONFIG.stagger);
    });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 65%',
      once: true,
      onEnter: () => tl.play()
    });

    return () => {
      trigger.kill();
      tl.kill();
    };
  });
}
