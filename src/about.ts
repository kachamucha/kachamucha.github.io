import './styles/base.css';
import './styles/layout.css';
import './styles/about.css';
import { initPageTransition } from './lib/pageTransition';
import { prefersReducedMotion } from './lib/reducedMotion';

initPageTransition();

/* Blocks lift in as they scroll into view. Deliberately IntersectionObserver
   rather than GSAP: this page has no scroll choreography and no Lenis, so
   pulling in the animation stack for four fades would be all cost. */
if (!prefersReducedMotion()) {
  const blocks = document.querySelectorAll<HTMLElement>(
    '.about-block, .about-founder-copy, .about-founder-photo'
  );

  blocks.forEach((el, i) => {
    el.classList.add('about-reveal');
    el.style.transitionDelay = `${Math.min(i, 4) * 90}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  blocks.forEach((el) => io.observe(el));
}
