---
name: verify
description: Build, serve, and drive the post-mortem scroll page to verify changes at the rendered surface.
---

# Verifying this site

Static Vite site, no tests. Verification means rendering it in a browser
and scrolling through the whole narrative.

## Build and serve

```bash
npm run build                      # tsc && vite build
npm run preview -- --port 4173 --strictPort &   # serves dist/
```

## Drive it

Use the preinstalled Chromium with playwright-core (install it
temporarily, do not commit it):

```bash
npm i -D playwright-core --no-audit --no-fund
# executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome (check /opt/pw-browsers)
# launch args: ['--no-sandbox']
npm uninstall playwright-core      # when done
```

Flows worth driving every time:

1. Load at 1440x900, wait ~4s for the hero ECG timeline, screenshot.
2. Scroll the full document in 10 to 14 steps with ~900ms waits so the
   pinned sections (external, internal organs, witness, cause) scrub
   through. Screenshot the stops.
3. At the bottom, wait for the CTA revival, then check
   `document.body.classList.contains('revived')` is true and the ECG is
   green.
4. Re-run with `page.emulateMedia({ reducedMotion: 'reduce' })`: the
   whole page must read statically (redactions off, witness quote
   struck through, heartbeat present) with no scrubbing.
5. Check horizontal overflow at 390 / 768 / 1440:
   `document.documentElement.scrollWidth - clientWidth` must be 0.
   Pre-animation states that scale elements up (the stamp) can widen
   the page invisibly.
6. Collect console errors and pageerrors; expect none.

## Gotchas

- window.scrollTo works fine with Lenis (it animates native scroll).
- The hero timeline takes ~4s; screenshots before that catch a
  half-drawn ECG.
- The organ canvases render procedural placeholder art from
  src/lib/organArt.ts until real frames land in /public/sequences.
