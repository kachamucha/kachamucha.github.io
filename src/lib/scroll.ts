import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './reducedMotion';

export function initScroll(): Lenis | null {
  if (prefersReducedMotion()) return null;

  // On touch devices, lerp must be 1 (instant) so Lenis's scroll position is
  // always in sync with the real scroll. A lerp < 1 lags behind fast touch
  // swipes — iOS/Android momentum scroll races ahead of the lerped position
  // and ScrollTrigger never sees the pin start-point, so the hero scrolls
  // straight through without animating. lerp:1 keeps Lenis active (velocity,
  // events, class) while eliminating the position lag that breaks pins.
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const lenis = new Lenis({ lerp: isTouch ? 1 : 0.11 });

  /* Publish scroll velocity for the mosaic rows to lean into the scroll.
     Set on the mosaic itself, not :root: a custom property on the root
     restyles the whole document every scroll frame. Skipped on touch, where
     velocity comes from noisy touch deltas and the lean read as jitter. */
  const MAX_V = 40;
  const leanTarget = isTouch ? null : document.querySelector<HTMLElement>('.shop-mosaic');
  let lastV = '';
  lenis.on('scroll', ({ velocity }: { velocity: number }) => {
    ScrollTrigger.update();
    if (!leanTarget) return;
    const v = Math.max(-MAX_V, Math.min(MAX_V, velocity || 0)).toFixed(1);
    if (v === lastV) return;
    lastV = v;
    leanTarget.style.setProperty('--scroll-v', v);
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
