import '../styles/cart-popup.css';
import { CATALOG, cartCount } from './cart';

/* Confirmation shown after "Add to cart": the shopper stays on the product
   page and chooses whether to go to the cart or keep browsing. */

let dialog: HTMLDialogElement | null = null;

function build(): HTMLDialogElement {
  const el = document.createElement('dialog');
  el.className = 'added-pop';
  el.innerHTML = `
    <div class="added-pop-inner">
      <div class="added-pop-head">
        <h2 class="added-pop-title">Item added to your cart, yayyyy !</h2>
        <button type="button" class="added-pop-close" data-close aria-label="Close">X</button>
      </div>
      <div class="added-pop-item">
        <img class="added-pop-thumb" alt="" />
        <p class="added-pop-name"></p>
      </div>
      <a class="added-pop-view" href="/cart.html"></a>
      <button type="button" class="added-pop-continue" data-close>Continue Shopping</button>
    </div>`;

  el.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    // the close button, "Continue Shopping", or the backdrop around the card
    if (target.closest('[data-close]') || target === el) el.close();
  });

  document.body.appendChild(el);
  return el;
}

export function showAddedToCart(productId: string) {
  const product = CATALOG[productId];
  if (!product) return;

  dialog ??= build();

  const thumb = dialog.querySelector<HTMLImageElement>('.added-pop-thumb')!;
  thumb.src = product.cover;
  thumb.alt = product.coverAlt;
  dialog.querySelector<HTMLElement>('.added-pop-name')!.textContent = product.title;
  dialog.querySelector<HTMLElement>('.added-pop-view')!.textContent = `View Cart (${cartCount()})`;

  if (!dialog.open) dialog.showModal();
}
