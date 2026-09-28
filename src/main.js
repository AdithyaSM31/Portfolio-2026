import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { renderContent } from './render.js';
import { Particles } from './gl/particles.js';
import { initHero } from './fx/hero.js';
import { initReel } from './fx/reel.js';
import { makeWipe, initWipes, initManifesto, initPortrait, initCounters, initReveals } from './fx/reveal.js';
import { initStackCards, initArchive } from './fx/work.js';
import { initExperience } from './fx/experience.js';
import { initPile } from './fx/pile.js';
import { initClock, initNav, initCursor, initMarquees, runLoader } from './fx/ui.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = window.innerWidth < 900 || matchMedia('(hover: none)').matches;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

renderContent();
initClock();

// ── Smooth scroll ────────────────────────────────────────────────
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  if (import.meta.env.DEV) window.__lenis = lenis;
}

// ── Pointer (normalised −1..1, smoothed) ───────────────────────────
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
});
gsap.ticker.add(() => {
  pointer.sx += (pointer.x - pointer.sx) * 0.06;
  pointer.sy += (-pointer.y - pointer.sy) * 0.06;
});

// ── WebGL particle field ────────────────────────────────────────
let particles = null;
try {
  particles = new Particles(document.querySelector('.gl'), {
    count: compact ? 11000 : 26000,
    compact,
    reduced,
  });
} catch (err) {
  console.warn('WebGL unavailable — continuing without the particle field.', err);
  document.querySelector('.gl')?.remove();
}

if (particles) {
  window.addEventListener('pointermove', (e) => {
    particles.pointer((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  });
  document.addEventListener('pointerleave', () => particles.pointerLeave());
  window.addEventListener('resize', () => particles.resize());
  gsap.ticker.add((time, dt) => {
    if (lenis) particles.setVelocity(lenis.velocity);
    particles.update(time, dt / 1000);
  });
}

// ── Boot ──────────────────────────────────────────────────────────
const heroImages = [...document.querySelectorAll('.hero img')].map((img) =>
  img.complete
    ? Promise.resolve()
    : new Promise((r) => {
        img.addEventListener('load', r, { once: true });
        img.addEventListener('error', r, { once: true });
      })
);
const ready = Promise.race([
  Promise.all([document.fonts.ready, ...heroImages]),
  new Promise((r) => setTimeout(r, 4000)),
]);

document.fonts.ready.then(() => {
  const heroIntro = initHero({ pointer, reduced });
  initReel();
  initWipes(reduced);
  initManifesto(reduced);
  initPortrait(reduced);
  initCounters(reduced);
  initReveals(reduced);
  initStackCards(reduced);
  initArchive({ lenis });
  initExperience({ lenis, reduced });
  initMarquees({ lenis, reduced });
  initNav({ lenis });
  initCursor();
  initPile({ reduced });

  // Each section tells the particle field which shape to become
  if (particles) {
    document.querySelectorAll('[data-shape]').forEach((sec) => {
      const shape = +sec.dataset.shape;
      const dim = sec.dataset.dim ? +sec.dataset.dim : 1;
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && particles.setShape(shape, dim),
      });
    });
  }

  runLoader({ ready, reduced, makeWipe }).then(() => {
    lenis?.start();
    ScrollTrigger.refresh();
    heroIntro();
    if (particles) gsap.to(particles.uniforms.uIntro, { value: 1, duration: reduced ? 0.01 : 3.2, ease: 'power2.out' });
  });
});

// Refresh measurements once everything (images) has settled
window.addEventListener('load', () => ScrollTrigger.refresh());
