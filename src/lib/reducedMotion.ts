export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const MOTION_REDUCED = '(prefers-reduced-motion: reduce)';

/* Phone slides (shop, befuzuli) hold still on purpose: only the CSS star
   spins are allowed to move there. These pair a desktop-only "animate" query
   with a "static" query that also catches every phone, so a section's
   entrance timeline never runs at <=720px regardless of motion preference. */
export const MOTION_OK_DESKTOP = '(prefers-reduced-motion: no-preference) and (min-width: 721px)';
export const MOTION_STATIC = '(prefers-reduced-motion: reduce), (max-width: 720px)';

export function prefersReducedMotion(): boolean {
  return window.matchMedia(MOTION_REDUCED).matches;
}
