import '../styles/email-modal.css';
import { prefersReducedMotion } from './reducedMotion';

/* Email capture popup.

   It is not a modal: it drifts around the viewport like a screensaver logo,
   bouncing off the edges, and stays until a valid address is typed. The page
   underneath stays scrollable and clickable, so it distracts without
   trapping. Hovering, tapping or focusing it parks it in place so it can
   actually be filled in. Once captured, it never shows again on any page. */

const CAPTURED_KEY = 'kmk-email-captured';
const EMAIL_KEY = 'kmk-email';

const SPEED = 105;          // px per second
const RESUME_DELAY = 1600;  // ms of no interaction before it drifts again

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // private mode; the popup just shows every visit
  }
}

export function emailCaptured(): boolean {
  return storage()?.getItem(CAPTURED_KEY) === 'yes';
}

function markCaptured(email: string) {
  const store = storage();
  try {
    store?.setItem(CAPTURED_KEY, 'yes');
    store?.setItem(EMAIL_KEY, email);
  } catch {
    /* nothing useful to do */
  }
}

/* Deliberately loose: the point is to reject obvious typos, not to police
   valid-but-unusual addresses. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

let open = false;

export function openEmailPrompt() {
  if (open || emailCaptured()) return;
  open = true;

  const pop = document.createElement('div');
  pop.className = 'email-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Enter your e-mail');
  pop.innerHTML = `
    <div class="email-pop-card">
    <form class="email-pop-body" novalidate>
      <div class="email-pop-fields">
        <h2 class="email-pop-title">Enter E-mail</h2>
        <p class="email-pop-sub">We promise, we won't spam you :)</p>
        <input class="email-pop-input" type="email" inputmode="email" autocomplete="email"
               placeholder="Type email here..." aria-label="Email address" />
        <p class="email-pop-error" hidden>Email not found !&nbsp; Try again !</p>
      </div>
      <button class="email-pop-cta" type="submit">Download Sample</button>
    </form>
    </div>`;
  document.body.appendChild(pop);

  const card = pop.querySelector<HTMLElement>('.email-pop-card')!;
  const form = pop.querySelector('form') as HTMLFormElement;
  const input = pop.querySelector<HTMLInputElement>('.email-pop-input')!;
  const error = pop.querySelector<HTMLElement>('.email-pop-error')!;

  /* ---------- drift ---------- */
  const still = prefersReducedMotion();
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let paused = still;
  let resumeTimer: number | undefined;
  let raf = 0;
  let last = 0;

  function bounds() {
    return {
      maxX: Math.max(0, window.innerWidth - pop.offsetWidth),
      maxY: Math.max(0, window.innerHeight - pop.offsetHeight)
    };
  }

  /* Only the position lives here. The rocking, the entrance and the bounce
     squash are CSS animations on `rotate` / `scale`, which are independent
     properties: they compose with this transform instead of fighting it, and
     they keep running even if this loop is parked. */
  function place() {
    pop.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }

  function bounced() {
    card.classList.remove('is-bounced');
    void card.offsetWidth; // restart the squash
    card.classList.add('is-bounced');
  }

  function step(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!paused) {
      const { maxX, maxY } = bounds();
      x += vx * dt;
      y += vy * dt;

      if (x <= 0 || x >= maxX) {
        vx = -vx;
        x = Math.min(Math.max(x, 0), maxX);
        bounced();
      }
      if (y <= 0 || y >= maxY) {
        vy = -vy;
        y = Math.min(Math.max(y, 0), maxY);
        bounced();
      }
      place();
    }

    raf = window.requestAnimationFrame(step);
  }

  /* Parks it, but always schedules a resume. It drifts *into* a stationary
     cursor, so a pause that only lifted on pointerleave would leave it stuck
     under the mouse forever. Only a focused input holds it still. */
  function parkFor(ms: number) {
    if (still) return;
    paused = true;
    pop.classList.add('is-settled');   // stops the rocking too, so it can be aimed at
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      if (document.activeElement === input) return;
      paused = false;
      pop.classList.remove('is-settled');
    }, ms);
  }

  /* Full stop, rocking included: typing on a swaying card is horrible. */
  function holdStill() {
    paused = true;
    pop.classList.add('is-settled');
    window.clearTimeout(resumeTimer);
  }

  // start centred, then head off at a lazy diagonal
  const start = bounds();
  x = start.maxX / 2;
  y = start.maxY / 2;
  const angle = (Math.random() * 0.6 + 0.4) * (Math.PI / 2);
  vx = Math.cos(angle) * SPEED * (Math.random() < 0.5 ? -1 : 1);
  vy = Math.sin(angle) * SPEED * (Math.random() < 0.5 ? -1 : 1);
  place();

  if (!still) {
    last = performance.now();
    raf = window.requestAnimationFrame(step);
  }

  const onResize = () => {
    const { maxX, maxY } = bounds();
    x = Math.min(x, maxX);
    y = Math.min(y, maxY);
    place();
  };
  window.addEventListener('resize', onResize);

  // hovering or aiming at it parks it long enough to click into the field
  pop.addEventListener('pointerenter', () => parkFor(RESUME_DELAY));
  pop.addEventListener('pointermove', () => parkFor(RESUME_DELAY));
  pop.addEventListener('pointerdown', () => parkFor(4000));
  pop.addEventListener('pointerleave', () => parkFor(400));
  input.addEventListener('focus', holdStill);
  input.addEventListener('blur', () => parkFor(1200));

  /* ---------- submit ---------- */
  input.addEventListener('input', () => {
    error.hidden = true;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    holdStill();

    const value = input.value.trim();
    if (!looksLikeEmail(value)) {
      error.hidden = false;
      input.focus();
      return;
    }

    markCaptured(value);
    card.innerHTML = `
      <div class="email-pop-thanks">
        <h2>Thank you !</h2>
        <p>We'll be in touch :)</p>
      </div>`;

    window.setTimeout(() => {
      pop.classList.add('is-leaving');
      window.setTimeout(close, 420);
    }, 1300);
  });

  function close() {
    window.cancelAnimationFrame(raf);
    window.clearTimeout(resumeTimer);
    window.removeEventListener('resize', onResize);
    pop.remove();
    open = false;
  }
}

type ArmOptions = {
  /** open this many ms after the page settles */
  afterMs?: number;
  /** or wait until this element scrolls into view */
  whenVisible?: string;
};

/** Arms the popup for this page. No-op once an address has been captured. */
export function armEmailPrompt({ afterMs = 4000, whenVisible }: ArmOptions = {}) {
  if (emailCaptured()) return;

  if (whenVisible) {
    const target = document.querySelector(whenVisible);
    if (target) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          window.setTimeout(openEmailPrompt, afterMs);
        },
        { threshold: 0.25 }
      );
      io.observe(target);
      return;
    }
  }

  window.setTimeout(openEmailPrompt, afterMs);
}
