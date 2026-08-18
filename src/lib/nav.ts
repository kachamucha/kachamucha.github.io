import type Lenis from 'lenis';

/* Smooth in-page navigation.

   The primary nav uses hash links (#brand, #shop, #collaborations). With Lenis
   driving the scroll and the hero section pinned by ScrollTrigger, a native
   browser hash jump lands in the wrong place and fights Lenis. Route every
   in-page hash click through lenis.scrollTo so it settles at the right spot,
   just below the sticky nav bar.

   Cross-page links (index.html#shop from the about page) are left to the
   browser; the arriving page reads location.hash on load and corrects the
   scroll once the layout has settled. */

function targetFromHash(hash: string): HTMLElement | null {
  if (!hash || hash === '#') return null;
  try {
    return document.querySelector<HTMLElement>(hash);
  } catch {
    return null; // malformed selector, e.g. href="#"
  }
}

// The sticky nav overlaps the top of the target slide, so offset the scroll by
// its measured height. Measured live so it stays correct across breakpoints.
function navHeight(): number {
  const nav = document.querySelector<HTMLElement>('.brand-nav');
  return nav ? nav.getBoundingClientRect().height : 0;
}

export function initNav(lenis: Lenis | null) {
  const goto = (hash: string, updateUrl: boolean, immediate = false): boolean => {
    const target = targetFromHash(hash);
    if (!target) return false;

    // Resolve to an absolute Y ourselves. Passing an element straight to
    // lenis.scrollTo did not move the page here (the pinned hero throws off
    // its element-offset math), whereas a numeric target is unambiguous.
    const y = target.getBoundingClientRect().top + window.scrollY - navHeight();

    if (lenis) {
      lenis.scrollTo(y, { immediate });
    } else {
      // reduced motion / no Lenis: native scroll to the same spot.
      window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
    }

    if (updateUrl && location.hash !== hash) {
      history.pushState(null, '', hash);
    }
    return true;
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as HTMLElement)?.closest?.('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return; // only same-page hash links

    if (goto(href, true)) event.preventDefault();
  });

  return {
    // Correct the landing spot when arriving with a hash from another page.
    // Called after ScrollTrigger.refresh so pinned offsets are final.
    scrollToInitialHash() {
      if (location.hash) goto(location.hash, false, true);
    }
  };
}
