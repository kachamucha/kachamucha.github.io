/* Shop slide: the two upcoming issues reveal their "Coming soon" label on
   hover. Touch has no hover, so a tap toggles the same label; the third star
   is a plain link and needs no script. */

export function initShop() {
  const soon = Array.from(document.querySelectorAll<HTMLElement>('[data-shop-soon]'));
  if (!soon.length) return;

  soon.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      soon.forEach((other) => {
        if (other !== item) other.classList.remove('is-revealed');
      });
      item.classList.toggle('is-revealed');
    });
  });

  // tapping anywhere else puts the labels away again
  document.addEventListener('click', () => {
    soon.forEach((item) => item.classList.remove('is-revealed'));
  });
}
