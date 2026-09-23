import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK_DESKTOP, MOTION_STATIC } from '../lib/reducedMotion';

/* The flagship issue promo. It is the last thing before the footer and the
   only hard sell on the page, so it assembles itself as you arrive: the
   awning drops in, the cover swings onto it, then the title and the CTA. */

const SECTION_SELECTOR = '#shop';

const CONFIG = {
  awningDropPx: -60,
  groupLiftPx: 40,
  stagger: 0.12,
  duration: 0.8
} as const;

export function initBefizuli(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  if (!section) return;

  const awning = section.querySelector<HTMLElement>('.befizuli-awning');
  const groups = Array.from(section.querySelectorAll<HTMLElement>('.befizuli-group'));
  const aboutCta = section.querySelector<HTMLElement>('.befizuli-about-cta');
  const parts = [awning, ...groups, aboutCta].filter(Boolean) as HTMLElement[];
  if (!parts.length) return;

  const mm = gsap.matchMedia();

  // Phone (or reduced motion): the promo assembles with no entrance motion.
  mm.add(MOTION_STATIC, () => {
    gsap.set(parts, { clearProps: 'all' });
  });

  mm.add(MOTION_OK_DESKTOP, () => {
    if (awning) gsap.set(awning, { y: CONFIG.awningDropPx, opacity: 0 });
    if (groups.length) gsap.set(groups, { y: CONFIG.groupLiftPx, opacity: 0 });
    if (aboutCta) gsap.set(aboutCta, { scale: 0.86, opacity: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { duration: CONFIG.duration, ease: 'power3.out' } });
    if (awning) tl.to(awning, { y: 0, opacity: 1 });
    if (groups.length) {
      tl.to(groups, { y: 0, opacity: 1, stagger: CONFIG.stagger }, `-=${CONFIG.duration - CONFIG.stagger}`);
    }
    if (aboutCta) {
      tl.to(aboutCta, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, `-=${CONFIG.duration - CONFIG.stagger}`);
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
