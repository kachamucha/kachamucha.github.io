import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK, MOTION_REDUCED } from '../lib/reducedMotion';

/* The Ouija slide is the answer to "only one way to bring the dead back", so
   the board should arrive rather than simply be there: it surfaces out of the
   black, dim and slightly too close, and settles.

   One idea, closed cleanly. No scrub, no parallax — the slides either side of
   this one already breathe, and a second gesture here would compete. */

const SECTION_SELECTOR = '#ouija';
const IMG_SELECTOR = '.ouija-img';

const CONFIG = {
  riseDuration: 1.4,
  startScale: 1.08,
  startBrightness: 0.35
} as const;

export function initOuija(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  const img = document.querySelector<HTMLElement>(IMG_SELECTOR);
  if (!section || !img) return;

  const mm = gsap.matchMedia();

  mm.add(MOTION_REDUCED, () => {
    gsap.set(img, { opacity: 1, scale: 1, filter: 'none' });
  });

  mm.add(MOTION_OK, () => {
    gsap.set(img, {
      opacity: 0,
      scale: CONFIG.startScale,
      filter: `brightness(${CONFIG.startBrightness})`
    });

    const rise = gsap.timeline({ paused: true });
    rise.to(img, {
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
      duration: CONFIG.riseDuration,
      ease: 'power2.out'
    });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      once: true,
      onEnter: () => rise.play()
    });

    return () => {
      trigger.kill();
      rise.kill();
    };
  });
}
