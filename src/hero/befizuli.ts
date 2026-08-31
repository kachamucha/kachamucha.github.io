import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK_DESKTOP, MOTION_STATIC } from '../lib/reducedMotion';

/* The flagship issue promo. It is the last thing before the footer and the
   only hard sell on the page, so it assembles itself as you arrive: the
   awning drops in, the cover swings onto it, then the title and the CTA. */

const SECTION_SELECTOR = '#befizuli';

const CONFIG = {
  awningDropPx: -60,
  coverSwingDeg: -14,
  coverRestDeg: -8, // matches the cover's resting tilt in CSS
  coverLiftPx: 70,
  stagger: 0.12,
  duration: 0.8
} as const;

export function initBefizuli(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  if (!section) return;

  const awning = section.querySelector<HTMLElement>('.befizuli-awning');
  const cover = section.querySelector<HTMLElement>('.befizuli-cover img');
  const title = section.querySelector<HTMLElement>('.befizuli-title');
  const cta = section.querySelector<HTMLElement>('.befizuli-cta');
  const parts = [awning, cover, title, cta].filter(Boolean) as HTMLElement[];
  if (!parts.length) return;

  const mm = gsap.matchMedia();

  // Phone (or reduced motion): the promo assembles with no entrance motion.
  // Only the starburst behind the cover keeps spinning (that is CSS).
  mm.add(MOTION_STATIC, () => {
    gsap.set(parts, { clearProps: 'all' });
    if (cover) gsap.set(cover, { rotate: CONFIG.coverRestDeg });
  });

  mm.add(MOTION_OK_DESKTOP, () => {
    if (awning) gsap.set(awning, { y: CONFIG.awningDropPx, opacity: 0 });
    if (cover) {
      gsap.set(cover, { y: CONFIG.coverLiftPx, rotate: CONFIG.coverSwingDeg, opacity: 0 });
    }
    if (title) gsap.set(title, { y: 26, opacity: 0 });
    if (cta) gsap.set(cta, { scale: 0.86, opacity: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { duration: CONFIG.duration, ease: 'power3.out' } });
    if (awning) tl.to(awning, { y: 0, opacity: 1 });
    if (cover) tl.to(cover, { y: 0, rotate: CONFIG.coverRestDeg, opacity: 1 }, `-=${CONFIG.duration - CONFIG.stagger}`);
    if (title) tl.to(title, { y: 0, opacity: 1 }, `-=${CONFIG.duration - CONFIG.stagger}`);
    if (cta) {
      tl.to(cta, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, `-=${CONFIG.duration - CONFIG.stagger}`);
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      once: true,
      onEnter: () => tl.play()
    });

    return () => {
      trigger.kill();
      tl.kill();
    };
  });
}
