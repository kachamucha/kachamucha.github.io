/* Cart state, shared by the product page and the cart page.
   Persisted in localStorage so the cart survives navigation between the two.
   There is no checkout backend yet, so this is the whole store. */

export type Product = {
  id: string;
  title: string;
  cover: string;
  coverAlt: string;
  price: number;
  compareAt: number;
};

export const CATALOG: Record<string, Product> = {
  'issue-01': {
    id: 'issue-01',
    title: 'Issue 01  Befizuli Sawaal',
    cover: `${import.meta.env.BASE_URL}img/cover-3.webp`,
    coverAlt: 'Befizuli Sawaal magazine cover',
    price: 900,
    compareAt: 1500
  }
};

export type CartLine = { id: string; qty: number };

const KEY = 'kmk-cart';
export const MAX_QTY = 20;

/* localStorage throws in private mode and when storage is full; a broken
   cart should never take the page down with it. */
function safeRead(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine =>
        !!l && typeof (l as CartLine).id === 'string' && typeof (l as CartLine).qty === 'number')
      .filter((l) => l.id in CATALOG && l.qty > 0)
      .map((l) => ({ id: l.id, qty: Math.min(MAX_QTY, Math.max(1, Math.round(l.qty))) }));
  } catch {
    return [];
  }
}

function safeWrite(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* nothing useful to do; the page still works for this session */
  }
}

export function readCart(): CartLine[] {
  return safeRead();
}

export function addToCart(id: string, qty: number) {
  if (!(id in CATALOG)) return;
  const lines = safeRead();
  const line = lines.find((l) => l.id === id);
  if (line) {
    line.qty = Math.min(MAX_QTY, line.qty + qty);
  } else {
    lines.push({ id, qty: Math.min(MAX_QTY, Math.max(1, qty)) });
  }
  safeWrite(lines);
}

export function setQty(id: string, qty: number) {
  const lines = safeRead();
  const line = lines.find((l) => l.id === id);
  if (!line) return;
  if (qty <= 0) {
    safeWrite(lines.filter((l) => l.id !== id));
    return;
  }
  line.qty = Math.min(MAX_QTY, qty);
  safeWrite(lines);
}

export function removeFromCart(id: string) {
  safeWrite(safeRead().filter((l) => l.id !== id));
}

export function cartCount(): number {
  return safeRead().reduce((n, l) => n + l.qty, 0);
}

export function subtotal(): number {
  return safeRead().reduce((sum, l) => sum + CATALOG[l.id].price * l.qty, 0);
}

export function formatPrice(amount: number): string {
  return `₹ ${amount.toFixed(1)}`;
}

/* keeps the header badge in sync on whatever page it lives on, and kicks it
   whenever the number actually changes so an add is impossible to miss */
let lastBadgeCount: number | null = null;

export function renderCartBadge() {
  const badge = document.querySelector<HTMLElement>('[data-cart-count]');
  if (!badge) return;
  const n = cartCount();
  const changed = lastBadgeCount !== null && lastBadgeCount !== n;
  lastBadgeCount = n;

  badge.textContent = String(n);
  badge.hidden = n === 0;

  if (changed && n > 0) bump(badge);
}

/* restarting a CSS animation needs the class off, a reflow, then back on */
export function bump(el: HTMLElement) {
  el.classList.remove('is-bumped');
  void el.offsetWidth;
  el.classList.add('is-bumped');
}
