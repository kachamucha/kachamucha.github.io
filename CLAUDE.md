# CLAUDE.md — Post-Mortem of Curiosity

Build plan for an image-first, scroll-driven editorial site. Read this before writing code. Follow the section specs and the house rules.

## The concept

A single long-scroll page written as a forensic case file. The narrative is the murder of curiosity in the education system, documented as a post-mortem.

Case No. EDU/PM/0001/2026. Department of Forensics. Signed by Dr. Common Sense, Chief Educational Pathologist.

The tone is clinical, morbid, restrained. The animation job is to make that tone physical. It is not decoration. When in doubt, do less.

## Tech stack

- Vite + TypeScript. No framework.
- GSAP core, plus ScrollTrigger, SplitText, DrawSVG, ScrambleText, MorphSVG. All free from the public `gsap` npm package since April 2025.
- Lenis for smooth scroll, synced to ScrollTrigger.
- Plain modern CSS with custom properties. No Tailwind. The design is bespoke and art-directed, so utility classes get in the way here.
- Deploy on Vercel. Static build, zero config.

Why no React: this is one narrative page with no app state and heavy scroll choreography. React re-renders fight ScrollTrigger and buy us nothing here.

## House rules

- Two deliberate dimensional moments only. Do not make everything move.
- Respect `prefers-reduced-motion`. Every scroll animation needs a static fallback. Wrap timelines in a matchMedia check.
- Images are the content. Optimize hard. See the performance section.
- No em dashes in any copy. Plain, direct English. Short sentences.
- Never change the case-file copy. It is written. Preserve it verbatim.
- One strong idea per section, closed cleanly. Kill anything that competes.

## Design tokens

Draft. Sample the real values off the SVG when assets are exported.

```
--bg:        #0a0708   near black
--bg-blood:  #2b0505   deep red for gradients
--accent:    #b21414   blood red
--paper:     #efe9e0   document off white
--ink:       #14100f   document text
--text:      #f4f1ee   clinical white on dark
--muted:     #8a807c   secondary text
```

Type direction:

- Display: a clean humanist or grotesk sans for the loud lines.
- Case file: a monospace or typewriter face for all forensic document text. The mono is what sells the "official report" feel. Use it everywhere the content is a form field, finding, or signature caption.

## Sections, in scroll order

The motif is a heart monitor. One ECG line carries the whole page and pays off at the end. Keep it consistent.

1. HERO
   - ECG line draws across with DrawSVG, beats a few times under the headline, then flatlines as the line locks.
   - SplitText reveals "There's been a cold blooded murder of curiosity in the education system" as the flatline settles.
   - Dimensional moment one: layered parallax on the arm and blood-splatter imagery using CSS perspective and translateZ. Subtle. Depth, not spin.
2. CASE FILE HEADER
   - "Case No. EDU/PM/0001/2026" stamps in. Slight rotation in, hard settle, grain overlay. ScrambleText resolves the case number from noise.
3. DECEASED INFORMATION
   - Name: Curiosity. Aliases: Wonder, Inquiry, Questioning.
   - Fields reveal as black redaction bars slide off them. Declassify feel.
4. CIRCUMSTANCES OF RECOVERY
   - Quiet paragraph reveal. Let the copy breathe. Minimal motion.
5. EXTERNAL EXAMINATION
   - Findings pin to the viewport and reveal one at a time on scroll.
   - Each finding draws a thin line pointing to a mark on the evidence image.
   - Findings: suppression marks, wounds from "this won't come in the exam," bruising from peer comparison.
6. INTERNAL EXAMINATION
   - Dimensional moment two. Organ inspection as a scroll-scrubbed image sequence. Pre-render a rotation of each organ to frames, then scrub the frame index with ScrollTrigger. Looks 3D, ships as images.
   - Brain: label pins "Inquiry Cortex, severely underdeveloped."
   - Heart: label pins "Passion Chamber, compressed."
   - Digestive tract: "Acute Academic Bulimia."
   - Organ desaturates or cracks as its copy lands.
7. WITNESS STATEMENT, SAME CHILD TWO AGES
   - Scrub-controlled split. As the user scrolls, age 5 "I asked why the moon follows us" is overwritten by age 15 "How many marks is this for?"
   - The scroll is the reveal. The contrast is the whole point.
8. CAUSE OF DEATH
   - Asphyxiation, so the type constricts. Tighten letter-spacing and line-height as the section pins. The text chokes. ECG flatlines in margin.
9. FINAL OPINION AND SIGNATURE
   - No tricks. Signature draws in like ink using DrawSVG on a handwritten path.
   - Restraint reads as gravity here. Do not animate the paragraph.
10. CLOSING CTA, "Only one way to bring the dead back"
    - Payoff. The flatline jumps back into a heartbeat. Color returns. This becomes the CTA. Close it cleanly and stop.

## File structure

```
/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  /public
    /img            optimized exports, webp or avif
    /sequences      organ rotation frames, numbered
  /src
    main.ts         boot: Lenis, gsap, ScrollTrigger.defaults, plugin register
    /styles
      base.css      reset, tokens, type
      layout.css
    /sections       one module per section, each exports init(el)
      hero.ts
      caseFile.ts
      deceased.ts
      external.ts
      internal.ts
      witness.ts
      causeOfDeath.ts
      finalOpinion.ts
      cta.ts
    /lib
      scroll.ts     Lenis + ScrollTrigger sync
      ecg.ts        the heart-monitor motif, reused across sections
      sequence.ts   image-sequence scrubber for the organs
      reducedMotion.ts
```

Each section module gets its own ScrollTrigger context so we can clean up and refresh without leaks. Register all GSAP plugins once in `main.ts`.

## Performance

- Export images as AVIF with WebP fallback. Compress aggressively.
- The organ sequences are the heaviest asset. Keep frame count modest, around 30 to 48 frames each. Preload the active section's frames, lazy load the rest.
- Draw the image sequence to a single canvas. Do not mount dozens of img tags.
- Lazy load below-the-fold imagery. Set width and height to avoid layout shift.
- Target a clean run at 60fps on a mid-range laptop before adding polish.

## Accessibility

- `prefers-reduced-motion`: disable scrub and reveal timelines, show final states. The page must read fully with zero animation.
- Real semantic headings. The case file is content, not just visuals.
- Sufficient contrast on all text over dark and over red.

## Setup

```
npm create vite@latest . -- --template vanilla-ts
npm i gsap lenis
```

Vercel: import the repo, framework preset Vite, build `npm run build`, output `dist`. Done.

## Build order

1. Scaffold, boot Lenis + GSAP + ScrollTrigger, get smooth scroll working.
2. Static layout of all sections with real copy and placeholder images.
3. Build the ECG motif in `ecg.ts`. Wire it into hero and cause of death.
4. Hero timeline, then work top to bottom section by section.
5. Organ image sequence last, since it needs exported frame assets.
6. Reduced-motion pass. Performance pass. Deploy.

Do not move to the next section until the current one feels right on scroll.
