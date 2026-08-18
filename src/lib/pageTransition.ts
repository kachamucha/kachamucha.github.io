import '../styles/page-transition.css';
import { prefersReducedMotion } from './reducedMotion';

/* Cross-page transition.

   The site is four documents (home, about, issue, cart). This lifts a veil on
   arrival and drops it before leaving, so moving between them reads as one
   continuous thing instead of four hard cuts.

   Only same-origin, plain left clicks are intercepted: modifier clicks, new
   tabs, downloads, hash jumps and outbound links (the checkout form) all
   behave exactly as the browser intends. */

const COVER_MS = 220;

export function initPageTransition() {
  if (prefersReducedMotion()) return;

  const veil = document.createElement('div');
  veil.className = 'page-veil is-covering';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);

  const uncover = () => veil.classList.remove('is-covering');
  // Keep the veil up until the full window.load event fires. This ensures
  // document.fonts.ready has already resolved and GSAP has initialised all
  // scroll triggers before the page is revealed. A requestAnimationFrame here
  // would uncover too early — fonts and JS init may not be done yet.
  window.addEventListener('load', uncover, { once: true });
  // Back/forward cache: if the browser restores a bfcached page, load won't
  // fire again, so we must uncover via pageshow too.
  window.addEventListener('pageshow', uncover);

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as HTMLElement)?.closest?.('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;              // in-page anchor
    if (link.target && link.target !== '_self') return;     // new tab
    if (link.hasAttribute('download')) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;             // outbound
    if (url.pathname === location.pathname) return;         // same document

    event.preventDefault();
    veil.classList.add('is-covering');
    window.setTimeout(() => {
      location.href = url.href;
    }, COVER_MS);
  });
}
