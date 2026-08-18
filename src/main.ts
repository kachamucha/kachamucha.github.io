import './styles/base.css';
import './styles/layout.css';
import './styles/collaborations.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

import { initScroll } from './lib/scroll';
import { initPageTransition } from './lib/pageTransition';
import { armEmailPrompt } from './lib/emailModal';
import { init as hero } from './sections/hero';
import { initSection3 } from './hero/section3';
import { initClosing } from './hero/closing';
import { initReincarnation } from './hero/reincarnation';
import { initShop } from './hero/shop';
import { initOuija } from './hero/ouija';
import { initMosaic } from './hero/mosaic';
import { initBefuzuli } from './hero/befuzuli';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, ScrambleTextPlugin, MorphSVGPlugin);
ScrollTrigger.defaults({ anticipatePin: 1 });
// Prevent iOS URL-bar appearing/hiding from triggering a full ScrollTrigger
// refresh mid-animation, which breaks pin positions.
ScrollTrigger.config({ ignoreMobileResize: true });

initScroll();
initPageTransition();

/* #brand is intentionally static and has no entry here: the slide is the
   payoff of the narrative and holds still on purpose. */
const sections: Record<string, (el: HTMLElement) => void> = {
  hero,
  section3: () => initSection3(),
  closing: () => initClosing(),
  reincarnation: () => initReincarnation(),
  shop: () => initShop(),
  ouija: () => initOuija(),
  mosaic: () => initMosaic(),
  befuzuli: () => initBefuzuli()
};

// Wait for custom fonts before initialising scroll animations.
// SplitText must measure character widths with the real typeface applied —
// running it on a fallback font produces wrong splits that become visible
// once Bricolage Grotesque swaps in and causes a jarring layout jump.
document.fonts.ready.then(() => {
  document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
    const name = el.dataset.section;
    if (!name) return;
    const initSection = sections[name];
    if (!initSection) return;
    // each section owns its context; one broken section must not kill the page
    try {
      initSection(el);
    } catch (error) {
      console.error(`[postmortem] section "${name}" failed to init`, error);
    }
  });

  // Refresh again once images have loaded so ScrollTrigger trigger points
  // reflect the final laid-out page height (images can shift element offsets).
  if (document.readyState === 'complete') {
    ScrollTrigger.refresh();
  } else {
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
});

/* Email popup: parked for now. To switch it back on, uncomment the call.
   It waits for the brand slide so it never lands on the murder narrative,
   which sets the tone for everything after it. */
void armEmailPrompt;
// armEmailPrompt({ whenVisible: '#brand', afterMs: 2500 });
