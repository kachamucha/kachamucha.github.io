import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_OK, MOTION_REDUCED } from '../lib/reducedMotion';

const MOBILE_MQ = '(max-width: 720px)';
const DESKTOP_MQ = '(min-width: 721px)';

const HERO_SELECTOR = '#hero';
const SCENE_SELECTOR = '.hero-scene';
const HAND_ANCHOR_SELECTOR = '.hero-hand-anchor';
const HAND_SELECTOR = '.hero-hand';
const BURST_SELECTOR = '.hero-burst';
const SPATTER_SELECTOR = '.hero-trail-mark';
const STATEMENT_SELECTOR = '.hero-statement';

// ---------------------------------------------------------------------------
// CONFIG — the strike is SCRUBBED BY SCROLL: wind-up -> strike -> impact ->
// blood bloom -> spatter, all mapped to the first stretch of scrolling. The
// scene pins while it plays so the blood is on screen when it lands, then
// releases and the whole hero scrolls away with the verdict below it.
// ---------------------------------------------------------------------------
const BASE = {
  // --- hand + knife composition (relative to the .hero-scene box) ---
  handHeightVh: 62,
  handLeftVh: -28,
  handTopPct: 52, // vertical center of the hand anchor (% of the scene height)
  handRestRotateDeg: 6, // resting clockwise tilt so the blade reads down-right

  windupDuration: 0.4,
  windupRotateDeg: -12,
  windupLiftPx: 9,

  strikeDuration: 0.26,
  strikeRotateDeg: 16,
  maxDropPx: 40,
  impactYFraction: 0.6, // knife tip lands ~mid-scene

  impactDuration: 0.12,
  recoilRotateDeg: -6,
  recoilLiftPx: 10,
  shakeIntensity: 8,
  shakeCycles: 5,

  // --- blood bloom (thrown to the upper-right of the scene) ---
  bloodLeftPct: 60,
  bloodTopPct: 43, // pulled down 10% of the scene height
  bloodHeightVh: 81, // +30% over the previous 62vh
  bloomRadiusPct: 72,
  bloomDuration: 0.5,
  bloodOvershootScale: 1.06,

  spatter: {
    startAfter: 0.08,
    spreadXVw: 10,
    spreadYVh: -7,
    sizeNearVh: 11,
    sizeFarVh: 4,
    opacityNear: 0.55,
    opacityFar: 0.15,
    blurMaxPx: 2,
    durationNear: 0.3,
    durationFar: 0.14,
    staggerStep: 0.045
  },

  // how much scrolling the whole strike is mapped across, in vh. Longer feels
  // heavier and gives finer control; shorter lands the hit sooner.
  scrubDistanceVh: 100,
  // how much the motion lags the scroll wheel, in seconds. A little lag keeps
  // it from feeling glued to a trackpad.
  scrubSmoothing: 0.6,

  // --- verdict reveal (scroll) ---
  statementLiftPx: 24,
  statementDuration: 0.9,

  // --- device-dependent staging ---
  mirrored: false,   // mobile flips the arm so it enters from the right
  handRightVh: 0     // used instead of handLeftVh when mirrored
};

/* Phone staging, from the mobile reference: the verdict sits at the top of a
   single screen and the arm swings in from the right beneath it, blood
   landing to the lower-left of the tip. Only what differs is listed. */
const MOBILE: Partial<typeof BASE> = {
  handHeightVh: 27.2,
  handRightVh: -19,
  handTopPct: 54,
  handRestRotateDeg: 4,
  mirrored: true,

  maxDropPx: 26,
  impactYFraction: 0.68,

  bloodLeftPct: 38,
  bloodTopPct: 63,
  bloodHeightVh: 20,

  scrubDistanceVh: 140,
  statementLiftPx: 16
};

type Cfg = typeof BASE;

/* The active config. matchMedia swaps it before building, so every geometry
   helper below reads whichever staging the current viewport is on. */
let CONFIG: Cfg = BASE;

// pivot fraction on the hand image — matches .hero-hand's transform-origin (15% 85%)
const PIVOT_X_FRAC = 0.15;
const PIVOT_Y_FRAC = 0.85;

// approximate knife-tip location within the hand image, read off the source art
const TIP_X_FRAC = 0.83;
const TIP_Y_FRAC = 0.95;

// dense core of the blood splatter art within blood.png (matches .hero-burst's transform-origin)
const HOTSPOT_X_FRAC = 0.47;
const HOTSPOT_Y_FRAC = 0.45;
const HOTSPOT = `${HOTSPOT_X_FRAC * 100}% ${HOTSPOT_Y_FRAC * 100}%`;

interface SpatterSpec {
  t: number;
  yJitterVh: number;
  rotateDeg: number;
}

const SPATTER_MARKS: SpatterSpec[] = [
  { t: 0.2, yJitterVh: -2.2, rotateDeg: -26 },
  { t: 0.42, yJitterVh: 2.4, rotateDeg: 44 },
  { t: 0.6, yJitterVh: -3.4, rotateDeg: -58 },
  { t: 0.74, yJitterVh: 1.8, rotateDeg: 22 },
  { t: 0.86, yJitterVh: -2.6, rotateDeg: 50 }
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Fixed landing point of the blood splatter's dense core, relative to the scene
// box (upper-right). Decoupled from the knife tip so the splatter reads as spray
// thrown into the distance, per the reference composition.
function bloodCore(scene: HTMLElement): { x: number; y: number } {
  const r = scene.getBoundingClientRect();
  return {
    x: (r.width * CONFIG.bloodLeftPct) / 100,
    y: (r.height * CONFIG.bloodTopPct) / 100
  };
}

// Where the knife tip lands after the full rotation — used only for the hand's
// small drop assist. Measured off the anchor (never GSAP-transformed) + the
// hand's offset size, so it stays correct on every call.
function handDropPx(scene: HTMLElement, handAnchor: HTMLElement, hand: HTMLElement): number {
  const sceneRect = scene.getBoundingClientRect();
  const anchorRect = handAnchor.getBoundingClientRect();
  const handLeft = anchorRect.left;
  const handTop = anchorRect.top;
  const handWidth = hand.offsetWidth;
  const handHeight = hand.offsetHeight;

  const originX = handLeft + handWidth * PIVOT_X_FRAC;
  const originY = handTop + handHeight * PIVOT_Y_FRAC;
  const tipRestX = handLeft + handWidth * TIP_X_FRAC;
  const tipRestY = handTop + handHeight * TIP_Y_FRAC;

  const vx = (tipRestX - originX) * (CONFIG.mirrored ? -1 : 1);
  const vy = tipRestY - originY;
  const totalDeg = CONFIG.handRestRotateDeg + CONFIG.strikeRotateDeg;
  const theta = (totalDeg * Math.PI) / 180;
  const rvy = vx * Math.sin(theta) + vy * Math.cos(theta);
  const tipRotatedPageY = originY + rvy;

  const targetTipPageY = sceneRect.top + sceneRect.height * CONFIG.impactYFraction;
  return gsap.utils.clamp(-CONFIG.maxDropPx, CONFIG.maxDropPx, targetTipPageY - tipRotatedPageY);
}

export function initHeroStrike(): void {
  const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
  const scene = document.querySelector<HTMLElement>(SCENE_SELECTOR);
  const handAnchor = document.querySelector<HTMLElement>(HAND_ANCHOR_SELECTOR);
  const hand = document.querySelector<HTMLImageElement>(HAND_SELECTOR);
  const burst = document.querySelector<HTMLImageElement>(BURST_SELECTOR);
  const statement = document.querySelector<HTMLElement>(STATEMENT_SELECTOR);
  const spatter = Array.from(document.querySelectorAll<HTMLImageElement>(SPATTER_SELECTOR));
  if (!hero || !scene || !handAnchor || !hand || !burst) return;

  /* Sizing and resting angle are staging, not motion, so they apply whatever
     the motion preference — but they differ per breakpoint, so they are
     re-applied every time matchMedia swaps CONFIG. */
  const stage = () => {
    if (CONFIG.mirrored) {
      handAnchor.style.left = 'auto';
      handAnchor.style.right = `${CONFIG.handRightVh}vh`;
      handAnchor.classList.add('is-mirrored');
    } else {
      handAnchor.style.right = 'auto';
      handAnchor.style.left = `${CONFIG.handLeftVh}vh`;
      handAnchor.classList.remove('is-mirrored');
    }
    handAnchor.style.top = `${CONFIG.handTopPct}%`;
    hand.style.height = `${CONFIG.handHeightVh}vh`;
    hand.style.width = 'auto';
    gsap.set(hand, { rotate: CONFIG.handRestRotateDeg });
    burst.style.height = `${CONFIG.bloodHeightVh}vh`;
    burst.style.width = 'auto';
    spatter.forEach((mark, i) => {
      const spec = SPATTER_MARKS[i];
      if (!spec) return;
      mark.style.height = `${lerp(CONFIG.spatter.sizeNearVh, CONFIG.spatter.sizeFarVh, spec.t)}vh`;
      mark.style.width = 'auto';
    });
  };

  const mm = gsap.matchMedia();

  mm.add(MOTION_REDUCED, () => {
    CONFIG = window.matchMedia(MOBILE_MQ).matches ? { ...BASE, ...MOBILE } : BASE;
    stage();
    // no bloom/shake: blood shown fully, verdict visible
    gsap.set(burst, {
      left: () => bloodCore(scene).x - burst.offsetWidth * HOTSPOT_X_FRAC,
      top: () => bloodCore(scene).y - burst.offsetHeight * HOTSPOT_Y_FRAC,
      opacity: 1,
      scale: 1,
      clipPath: `circle(${CONFIG.bloomRadiusPct}% at ${HOTSPOT})`
    });
    if (statement) gsap.set(statement, { opacity: 1, y: 0 });

    spatter.forEach((mark, i) => {
      const spec = SPATTER_MARKS[i];
      if (!spec) return;
      gsap.set(mark, {
        left: () => {
          const c = bloodCore(scene);
          const dx = (CONFIG.spatter.spreadXVw / 100) * scene.getBoundingClientRect().width * spec.t;
          return c.x + dx - mark.offsetWidth * HOTSPOT_X_FRAC;
        },
        top: () => {
          const c = bloodCore(scene);
          const dy = (CONFIG.spatter.spreadYVh / 100) * scene.getBoundingClientRect().height * spec.t;
          return c.y + dy - mark.offsetHeight * HOTSPOT_Y_FRAC;
        },
        rotate: spec.rotateDeg,
        opacity: lerp(CONFIG.spatter.opacityNear, CONFIG.spatter.opacityFar, spec.t),
        filter: `blur(${lerp(0, CONFIG.spatter.blurMaxPx, spec.t).toFixed(2)}px)`
      });
    });
  });

  const build = () => {
    stage();
    // Keep statement hidden until it is revealed by the scrubbed timeline (mobile)
    // or by its own scroll trigger (desktop).
    if (statement) gsap.set(statement, { opacity: 0, y: CONFIG.statementLiftPx });
    // --- the strike: driven by the scroll wheel, not the clock ---
    const tl = gsap.timeline({ paused: true, defaults: { force3D: true } });

    // 1. wind-up
    tl.to(hand, {
      y: -CONFIG.windupLiftPx,
      rotate: CONFIG.handRestRotateDeg + CONFIG.windupRotateDeg,
      duration: CONFIG.windupDuration,
      ease: 'power2.out'
    });

    // 2. strike / smash down
    tl.to(hand, {
      y: () => handDropPx(scene, handAnchor, hand),
      rotate: CONFIG.handRestRotateDeg + CONFIG.strikeRotateDeg,
      duration: CONFIG.strikeDuration,
      ease: 'power4.in'
    });

    // 3. impact: recoil bounce + scene shake
    tl.to(
      hand,
      {
        y: () => handDropPx(scene, handAnchor, hand) - CONFIG.recoilLiftPx,
        rotate: CONFIG.handRestRotateDeg + CONFIG.strikeRotateDeg + CONFIG.recoilRotateDeg,
        duration: CONFIG.impactDuration,
        ease: 'back.out(3)'
      },
      'impact'
    );
    tl.to(
      scene,
      {
        x: () => gsap.utils.random(-CONFIG.shakeIntensity, CONFIG.shakeIntensity),
        y: () => gsap.utils.random(-CONFIG.shakeIntensity, CONFIG.shakeIntensity),
        duration: CONFIG.impactDuration / CONFIG.shakeCycles,
        repeat: CONFIG.shakeCycles,
        yoyo: true,
        ease: 'none'
      },
      'impact'
    );
    tl.set(scene, { x: 0, y: 0 });

    // 4. blood BLOOM — expanding clip-path from the splatter core (upper-right)
    tl.set(
      burst,
      {
        left: () => bloodCore(scene).x - burst.offsetWidth * HOTSPOT_X_FRAC,
        top: () => bloodCore(scene).y - burst.offsetHeight * HOTSPOT_Y_FRAC,
        opacity: 0,
        scale: 0.9,
        clipPath: `circle(0% at ${HOTSPOT})`
      },
      'impact'
    );
    tl.to(burst, { opacity: 1, duration: 0.06, ease: 'none' }, 'impact');
    tl.to(burst, { clipPath: `circle(${CONFIG.bloomRadiusPct}% at ${HOTSPOT})`, duration: CONFIG.bloomDuration, ease: 'power3.out' }, 'impact');
    tl.to(burst, { scale: CONFIG.bloodOvershootScale, duration: 0.16, ease: 'power2.out' }, 'impact');
    tl.to(burst, { scale: 1, duration: 0.24, ease: 'power1.inOut' }, 'impact+=0.16');

    // 5. outer spatter — flecks bloom a beat after the pool, clustered near it
    spatter.forEach((mark, i) => {
      const spec = SPATTER_MARKS[i];
      if (!spec) return;

      tl.set(
        mark,
        {
          left: () => {
            const c = bloodCore(scene);
            const dx = (CONFIG.spatter.spreadXVw / 100) * scene.getBoundingClientRect().width * spec.t;
            return c.x + dx - mark.offsetWidth * HOTSPOT_X_FRAC;
          },
          top: () => {
            const c = bloodCore(scene);
            const sceneRect = scene.getBoundingClientRect();
            const dy = (CONFIG.spatter.spreadYVh / 100) * sceneRect.height * spec.t;
            const jitter = (spec.yJitterVh / 100) * sceneRect.height;
            return c.y + dy + jitter - mark.offsetHeight * HOTSPOT_Y_FRAC;
          },
          rotate: spec.rotateDeg,
          filter: `blur(${lerp(0, CONFIG.spatter.blurMaxPx, spec.t).toFixed(2)}px)`
        },
        `impact+=${CONFIG.spatter.startAfter}`
      );

      tl.fromTo(
        mark,
        { scale: 0.3, opacity: 0 },
        {
          scale: 1,
          opacity: lerp(CONFIG.spatter.opacityNear, CONFIG.spatter.opacityFar, spec.t),
          duration: lerp(CONFIG.spatter.durationNear, CONFIG.spatter.durationFar, spec.t),
          ease: 'power2.out'
        },
        `impact+=${(CONFIG.spatter.startAfter + i * CONFIG.spatter.staggerStep).toFixed(3)}`
      );
    });

    // 6. text image — mobile only: final beat of the scrubbed sequence so the
    //    full story (hand → hit → blood → text) plays while pinned, then the
    //    page releases. Desktop uses its own scroll trigger instead.
    if (CONFIG.mirrored && statement) {
      tl.to(
        statement,
        { opacity: 1, y: 0, duration: CONFIG.statementDuration, ease: 'power2.out' },
        '>0.08'
      );
    }

    /* Pin the hero for the length of the strike and map the whole timeline to
       scroll. On mobile the sequence — wind-up → hit → blood → text image —
       all play while pinned; the pin releases once the last frame is reached
       and the page continues scrolling from there. */
    const strikeTrigger = ScrollTrigger.create({
      trigger: CONFIG.mirrored ? hero : scene,
      start: 'top top',
      end: `+=${CONFIG.scrubDistanceVh}%`,
      pin: CONFIG.mirrored ? hero : scene,
      pinSpacing: true,
      scrub: CONFIG.scrubSmoothing,
      animation: tl,
      invalidateOnRefresh: true
    });

    // Desktop: the verdict reveals on its own scroll position as the
    // second screen enters view.
    let revealTl: gsap.core.Timeline | undefined;
    let statementTrigger: ScrollTrigger | undefined;
    if (statement && !CONFIG.mirrored) {
      revealTl = gsap.timeline({ paused: true });
      revealTl.to(statement, { opacity: 1, y: 0, duration: CONFIG.statementDuration, ease: 'power2.out' });
      statementTrigger = ScrollTrigger.create({
        trigger: statement,
        start: 'top 72%',
        once: true,
        onEnter: () => revealTl!.play()
      });
    }

    return () => {
      strikeTrigger.kill();
      tl.kill();
      statementTrigger?.kill();
    };
  };

  mm.add(`${DESKTOP_MQ} and ${MOTION_OK}`, () => {
    CONFIG = BASE;
    return build();
  });

  mm.add(`${MOBILE_MQ} and ${MOTION_OK}`, () => {
    CONFIG = { ...BASE, ...MOBILE };
    return build();
  });
}
