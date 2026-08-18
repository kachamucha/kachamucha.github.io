import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK, MOTION_REDUCED } from '../lib/reducedMotion';

const SECTION_SELECTOR = '#reincarnation';
const GLOW_SELECTOR = '.reincarnation-glow';
const TEXT_SELECTOR = '.reincarnation-text';

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const CONFIG = {
  glowMinOpacity: 0.62,
  glowMaxOpacity: 1.0,
  glowPulseDuration: 2.6, // one direction of the breathe — the "glowing bulb"

  revealDuration: 0.9,
  revealLiftPx: 20
} as const;

export function initReincarnation(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  const glow = document.querySelector<HTMLElement>(GLOW_SELECTOR);
  const text = document.querySelector<HTMLElement>(TEXT_SELECTOR);
  if (!section || !glow || !text) return;

  const mm = gsap.matchMedia();

  mm.add(MOTION_REDUCED, () => {
    gsap.set(glow, { opacity: (CONFIG.glowMinOpacity + CONFIG.glowMaxOpacity) / 2 });
    gsap.set(text, { opacity: 1, y: 0 });
  });

  mm.add(MOTION_OK, () => {
    gsap.set(glow, { opacity: CONFIG.glowMinOpacity });
    const pulse = gsap.to(glow, {
      opacity: CONFIG.glowMaxOpacity,
      duration: CONFIG.glowPulseDuration,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    gsap.set(text, { opacity: 0, y: CONFIG.revealLiftPx });
    const tl = gsap.timeline({ paused: true });
    tl.to(text, { opacity: 1, y: 0, duration: CONFIG.revealDuration, ease: 'power2.out' });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => tl.play()
    });

    return () => {
      trigger.kill();
      tl.kill();
      pulse.kill();
    };
  });
}
