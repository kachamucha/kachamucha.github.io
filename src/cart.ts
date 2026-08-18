import './styles/base.css';
import './styles/shop-nav.css';
import './styles/cart.css';
import {
  CATALOG,
  MAX_QTY,
  bump,
  formatPrice,
  readCart,
  removeFromCart,
  renderCartBadge,
  setQty,
  subtotal
} from './lib/cart';
import { prefersReducedMotion } from './lib/reducedMotion';
import { initPageTransition } from './lib/pageTransition';

const linesEl = document.querySelector<HTMLElement>('[data-cart-lines]');
const emptyEl = document.querySelector<HTMLElement>('[data-cart-empty]');
const summaryEl = document.querySelector<HTMLElement>('[data-cart-summary]');
const subtotalEl = document.querySelector<HTMLElement>('[data-cart-subtotal]');

const TRASH_SVG = `<svg viewBox="0 0 24 26" aria-hidden="true" focusable="false">
  <path d="M2 5.5h20M9 5.5V2.5h6v3M4.5 5.5 6 24h12l1.5-18.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

function render() {
  if (!linesEl) return;
  const lines = readCart();

  linesEl.replaceChildren(
    ...lines.map((line) => {
      const product = CATALOG[line.id];
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.dataset.id = line.id;
      row.innerHTML = `
        <div class="cart-product">
          <img class="cart-thumb" src="${product.cover}" alt="${product.coverAlt}" />
          <p class="cart-name">${product.title}</p>
        </div>
        <div class="cart-qty-cell">
          <div class="cart-qty">
            <button type="button" class="cart-qty-btn" data-dec aria-label="Decrease quantity">-</button>
            <output class="cart-qty-value" aria-live="polite">${line.qty}</output>
            <button type="button" class="cart-qty-btn" data-inc aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="cart-remove" data-remove aria-label="Remove ${product.title} from cart">${TRASH_SVG}</button>
        </div>
        <p class="cart-line-total">
          <span class="cart-line-was">${formatPrice(product.compareAt * line.qty)}</span>
          <span>${formatPrice(product.price * line.qty)}</span>
        </p>`;

      const dec = row.querySelector<HTMLButtonElement>('[data-dec]');
      const inc = row.querySelector<HTMLButtonElement>('[data-inc]');
      if (dec) dec.disabled = line.qty <= 1;
      if (inc) inc.disabled = line.qty >= MAX_QTY;

      dec?.addEventListener('click', () => {
        setQty(line.id, line.qty - 1);
        render();
      });
      inc?.addEventListener('click', () => {
        setQty(line.id, line.qty + 1);
        render();
      });
      /* let the row collapse out before the list re-renders under it */
      row.querySelector('[data-remove]')?.addEventListener('click', () => {
        const drop = () => {
          removeFromCart(line.id);
          render();
        };
        if (prefersReducedMotion()) return drop();
        row.classList.add('is-leaving');
        window.setTimeout(drop, 260);
      });

      return row;
    })
  );

  const empty = lines.length === 0;
  if (emptyEl) emptyEl.hidden = !empty;
  if (summaryEl) summaryEl.hidden = empty;

  if (subtotalEl) {
    const next = formatPrice(subtotal());
    const changed = lastSubtotal !== null && lastSubtotal !== next;
    subtotalEl.textContent = next;
    lastSubtotal = next;
    const line = subtotalEl.closest<HTMLElement>('.cart-subtotal');
    if (changed && line) bump(line);
  }

  renderCartBadge();
}

let lastSubtotal: string | null = null;

initPageTransition();
render();
