import './styles/base.css';
import './styles/shop-nav.css';
import './styles/issue.css';
import { MAX_QTY, addToCart, bump, renderCartBadge } from './lib/cart';
import { armEmailPrompt } from './lib/emailModal';
import { showAddedToCart } from './lib/cartPopup';
import { initPageTransition } from './lib/pageTransition';

/* Issue product page: quantity stepper, then hand off to the cart page. */

const PRODUCT_ID = 'issue-01';

const qtyValue = document.querySelector<HTMLElement>('[data-qty-value]');
const decBtn = document.querySelector<HTMLButtonElement>('[data-qty-dec]');
const incBtn = document.querySelector<HTMLButtonElement>('[data-qty-inc]');
const addBtn = document.querySelector<HTMLButtonElement>('[data-add-to-cart]');

let qty = 1;

function renderQty(changed = false) {
  if (qtyValue) {
    qtyValue.textContent = String(qty);
    if (changed) bump(qtyValue);
  }
  if (decBtn) decBtn.disabled = qty <= 1;
  if (incBtn) incBtn.disabled = qty >= MAX_QTY;
}

decBtn?.addEventListener('click', () => {
  qty = Math.max(1, qty - 1);
  renderQty(true);
});

incBtn?.addEventListener('click', () => {
  qty = Math.min(MAX_QTY, qty + 1);
  renderQty(true);
});

/* adding no longer jumps to the cart: the confirmation offers both paths */
addBtn?.addEventListener('click', () => {
  addToCart(PRODUCT_ID, qty);
  renderCartBadge();
  showAddedToCart(PRODUCT_ID);
});

initPageTransition();
renderQty();
renderCartBadge();

/* Email popup: parked for now. To switch it back on, uncomment the call.
   It is deliberately never armed on the cart page: nagging someone
   mid-purchase costs a sale. */
void armEmailPrompt;
// armEmailPrompt({ afterMs: 4000 });
