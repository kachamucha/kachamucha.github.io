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

  /* Publish scroll velocity as a plain number on :root. The mosaic rows use
     it to lean into the scroll, which costs nothing and makes the slide feel
     attached to the page rather than playing beside it. */
  const MAX_V = 40;
  lenis.on('scroll', ({ velocity }: { velocity: number }) => {
    ScrollTrigger.update();
    const v = Math.max(-MAX_V, Math.min(MAX_V, velocity || 0));
    document.documentElement.style.setProperty('--scroll-v', v.toFixed(2));
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
