import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK, MOTION_REDUCED } from '../lib/reducedMotion';

const SECTION_SELECTOR = '#section3';
const CARD_SELECTOR = '.s3-card';
const LIGHTBOX_SELECTOR = '.s3-lightbox';
const LIGHTBOX_IMG_SELECTOR = '.s3-lightbox-img';

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const CONFIG = {
  baseRotateDeg: [0, 0], // cards sit straight (no tilt)
  maxTiltDeg: 7, // pointer-follow 3D tilt ceiling — kept subtle so text stays readable
  perspectivePx: 1000, // set in CSS on .s3-stage; documented here for reference

  hoverScale: 1.03,
  hoverLiftPx: 24, // translateZ

  dropDistancePx: 40,
  dropRotateExtraDeg: 6, // added to baseRotate at the drop's start, settles out
  staggerSec: 0.15,
  settleDuration: 0.65,

  reducedFadeDuration: 0.8
} as const;

// Lift + dim applies on hover regardless of motion preference ("lift gently
// on hover" is required even under reduced-motion) — only the continuous
// rotateX/rotateY pointer-tilt is gated behind MOTION_OK.
function attachHoverLift(card: HTMLElement, others: HTMLElement[]): () => void {
  const onEnter = () => {
    card.classList.add('is-active');
    others.forEach((other) => other.classList.add('is-dimmed'));
    gsap.to(card, { scale: CONFIG.hoverScale, z: CONFIG.hoverLiftPx, duration: 0.3, ease: 'power2.out', force3D: true });
  };

  const onLeave = () => {
    card.classList.remove('is-active');
    others.forEach((other) => other.classList.remove('is-dimmed'));
    gsap.to(card, { scale: 1, z: 0, duration: 0.4, ease: 'power2.out', force3D: true });
  };

  card.addEventListener('pointerenter', onEnter);
  card.addEventListener('pointerleave', onLeave);

  return () => {
    card.removeEventListener('pointerenter', onEnter);
    card.removeEventListener('pointerleave', onLeave);
  };
}

function attachPointerTilt(card: HTMLElement): () => void {
  let rafId = 0;
  let pendingEvent: PointerEvent | null = null;

  const applyTilt = () => {
    rafId = 0;
    if (!pendingEvent) return;
    const rect = card.getBoundingClientRect();
    const px = (pendingEvent.clientX - rect.left) / rect.width;
    const py = (pendingEvent.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 2 * CONFIG.maxTiltDeg;
    const rotateX = -(py - 0.5) * 2 * CONFIG.maxTiltDeg;

    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
      force3D: true
    });
    card.style.setProperty('--sheen-x', `${px * 100}%`);
    card.style.setProperty('--sheen-y', `${py * 100}%`);
  };

  const onMove = (e: PointerEvent) => {
    pendingEvent = e;
    if (rafId) return;
    rafId = requestAnimationFrame(applyTilt);
  };

  const onLeave = () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out', force3D: true });
  };

  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerleave', onLeave);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    card.removeEventListener('pointermove', onMove);
    card.removeEventListener('pointerleave', onLeave);
  };
}

function setupLightbox(section: HTMLElement, cards: HTMLElement[]): () => void {
  const lightbox = section.querySelector<HTMLElement>(LIGHTBOX_SELECTOR);
  const img = section.querySelector<HTMLImageElement>(LIGHTBOX_IMG_SELECTOR);
  if (!lightbox || !img) return () => undefined;

  let lastFocused: HTMLElement | null = null;

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  function open(src: string, alt: string, trigger: HTMLElement) {
    lastFocused = trigger;
    img!.src = src;
    img!.alt = alt;
    lightbox!.classList.add('is-open');
    lightbox!.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', onKeydown);
    lightbox!.querySelector<HTMLElement>('.s3-lightbox-close')?.focus();
  }

  function close() {
    lightbox!.classList.remove('is-open');
    lightbox!.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus();
  }

  const closers = Array.from(lightbox.querySelectorAll<HTMLElement>('[data-close]'));
  closers.forEach((el) => el.addEventListener('click', close));

  const cardHandlers = cards.map((card) => {
    const handler = () => {
      const full = card.dataset.full;
      const cardImg = card.querySelector('img');
      if (!full || !cardImg) return;
      open(full, cardImg.alt, card);
    };
    card.addEventListener('click', handler);
    return { card, handler };
  });

  return () => {
    closers.forEach((el) => el.removeEventListener('click', close));
    cardHandlers.forEach(({ card, handler }) => card.removeEventListener('click', handler));
    document.removeEventListener('keydown', onKeydown);
  };
}

export function initSection3(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  const cards = Array.from(document.querySelectorAll<HTMLElement>(CARD_SELECTOR));
  if (!section || cards.length !== 2) return;

  // click-to-expand works regardless of motion preference or hover capability
  setupLightbox(section, cards);

  const canHover = window.matchMedia('(hover: hover)').matches;
  if (canHover) {
    cards.forEach((card, i) => {
      const others = cards.filter((_, j) => j !== i);
      attachHoverLift(card, others);
    });
  }

  const mm = gsap.matchMedia();

  mm.add(MOTION_REDUCED, () => {
    gsap.set(cards, { opacity: 0, rotate: (i: number) => CONFIG.baseRotateDeg[i] });
    gsap.to(cards, {
      opacity: 1,
      duration: CONFIG.reducedFadeDuration,
      ease: 'power1.out',
      stagger: CONFIG.staggerSec,
      // inline opacity from this tween would otherwise permanently outrank
      // the .is-dimmed CSS rule (inline styles always beat stylesheet rules)
      onComplete: () => gsap.set(cards, { clearProps: 'opacity' })
    });
  });

  mm.add(MOTION_OK, () => {
    cards.forEach((card, i) => {
      const base = CONFIG.baseRotateDeg[i];
      const extra = i === 0 ? -CONFIG.dropRotateExtraDeg : CONFIG.dropRotateExtraDeg;
      gsap.set(card, { opacity: 0, y: CONFIG.dropDistancePx, rotate: base + extra });
    });

    const tl = gsap.timeline({ paused: true });
    cards.forEach((card, i) => {
      tl.to(
        card,
        {
          opacity: 1,
          y: 0,
          rotate: CONFIG.baseRotateDeg[i],
          duration: CONFIG.settleDuration,
          ease: 'back.out(1.4)',
          force3D: true
        },
        i * CONFIG.staggerSec
      );
    });
    // same reason as the reduced-motion branch: free opacity for .is-dimmed to control
    tl.set(cards, { clearProps: 'opacity' });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      once: true,
      onEnter: () => tl.play()
    });

    const tiltCleanups = canHover ? cards.map((card) => attachPointerTilt(card)) : [];

    return () => {
      trigger.kill();
      tl.kill();
      tiltCleanups.forEach((fn) => fn());
    };
  });
}
