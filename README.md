# Adithya Sankar Menon — Portfolio 2026

A dark, motion-led portfolio built around a WebGL particle field that changes shape as you scroll.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

Deploy `dist/` anywhere static. On Vercel, import the repo and it will detect Vite automatically.

## Edit content

All copy, projects, experience, skills, education and certifications live in **`src/data.js`**.
Project images live in `public/img/` (`name.webp` at 1600px, `name-sm.webp` at 640px).
The hero headline, manifesto and section titles are in `index.html`.

## How it's built

| Piece | File | What it does |
| --- | --- | --- |
| Particle field | `src/gl/particles.js`, `src/gl/shapes.js` | 26k GPU particles morph between six shapes (planet → galaxy → terrain → helix → lattice → torus knot). Each `<section data-shape="n">` picks the shape; `data-dim` dims it behind dense copy. |
| Hero | `src/fx/hero.js` | Objects float at different depths, follow the cursor and fly past the camera on scroll. |
| Reel | `src/fx/reel.js` | "Built [ ] to ship." The gap between the words opens into a full-screen project grid. |
| Work | `src/fx/work.js` | Sticky stacking project cards, plus an archive list with a cursor-following preview. |
| Experience | `src/fx/experience.js` | Pinned section with organisations on a rotating 3D drum. |
| Reveals | `src/fx/reveal.js` | Accent block-wipe headings, word-by-word manifesto, counters. |
| Footer | `src/fx/pile.js` | Matter.js bubbles pile onto the traced silhouette of the wordmark. Loaded lazily. |
| UI | `src/fx/ui.js` | Loader, nav/menu, cursor, magnetic buttons, velocity marquees, local clock. |

Stack: Vite · Three.js · GSAP (ScrollTrigger, SplitText) · Lenis · Matter.js · Geist, Geist Mono and Instrument Serif fonts.

Respects `prefers-reduced-motion`: smooth scrolling, the loader and autonomous motion are disabled, and all content stays visible.
