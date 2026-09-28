import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initWidgets } from './widgets.js';

const smooth = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

// Keep floaters well in front of the CSS perspective plane (1100px). Past it the
// browser draws them behind the viewer, huge and half-rasterised.
const MAX_Z = 700;

// Cycles the last word of the headline: think. → move. → see. → scale. → ship.
function initRotator(el, reduced) {
  if (!el) return () => {};
  const words = [...el.querySelectorAll('em')];
  let i = 0;
  let widths = [];
  const measure = () => {
    widths = words.map((w) => w.offsetWidth);
    gsap.set(el, { width: widths[i] });
  };
  gsap.set(words.slice(1), { yPercent: 110, opacity: 0 });
  measure();
  window.addEventListener('resize', measure);
  if (reduced) return () => {};

  let timer = 0;
  let paused = false;
  const next = () => {
    if (paused) return;
    const cur = words[i];
    i = (i + 1) % words.length;
    const nx = words[i];
    gsap.to(cur, { yPercent: -110, opacity: 0, duration: 0.6, ease: 'power3.in' });
    gsap.fromTo(nx, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: 0.3 });
    gsap.to(el, { width: widths[i], duration: 1, ease: 'expo.inOut', delay: 0.05 });
  };
  return {
    start: () => (timer = timer || setInterval(next, 2600)),
    pause: (v) => (paused = v),
  };
}

// Hero: a few objects float at different depths, drift with the cursor and
// sweep outward past the camera as you scroll into the page.
export function initHero({ pointer, reduced }) {
  const hero = document.querySelector('.hero');
  const stage = hero.querySelector('.hero__stage');
  const content = hero.querySelector('.hero__content');
  const extras = hero.querySelectorAll('.hero__scroll');
  const rotator = initRotator(hero.querySelector('[data-rotator]'), reduced);
  const widgets = initWidgets(hero, { reduced });

  const floaters = [...hero.querySelectorAll('.fl')].map((el, i) => {
    const cs = getComputedStyle(el);
    return {
      el,
      depth: parseFloat(cs.getPropertyValue('--z')) || 0,
      rot: parseFloat(cs.getPropertyValue('--r')) || 0,
      phase: i * 1.7,
      appear: 0,
      cx: 0,
      cy: 0,
      shown: true,
    };
  });

  // Phones: the camera widget sits under the nav, the telemetry card at the
  // bottom, and the copy is centred in the space between them. If the screen
  // is too short for all three, the bottom widgets step aside.
  const cam = hero.querySelector('.wg--cv');
  const bottomFloaters = [...hero.querySelectorAll('.wg--tm, .fl--volt')];
  const copy = [...content.children];
  const fitMobile = (h) => {
    bottomFloaters.forEach((el) => (el.style.display = ''));
    content.style.paddingTop = content.style.paddingBottom = '';
    if (window.innerWidth >= 900 || !cam) return;
    const gap = 12;
    // rotated widgets poke out ~4% of their width beyond their layout box
    const top = cam.offsetTop + cam.offsetHeight + cam.offsetWidth * 0.05 + gap;
    const need = copy.at(-1).offsetTop + copy.at(-1).offsetHeight - copy[0].offsetTop;
    const reserve = (els) => (els.length ? h - Math.min(...els.map((el) => el.offsetTop - el.offsetWidth * 0.04)) + gap : gap * 2);
    // keep as many bottom widgets as fit: all of them, then just the orb, then none
    const options = [bottomFloaters, bottomFloaters.filter((el) => el.classList.contains('fl--volt')), []];
    const keep = options.find((els) => need <= h - top - reserve(els)) || [];
    bottomFloaters.forEach((el) => (el.style.display = keep.includes(el) ? '' : 'none'));
    content.style.paddingTop = `${top}px`;
    content.style.paddingBottom = `${reserve(keep)}px`;
  };

  // Offset from the stage centre (layout values, unaffected by transforms)
  const measure = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    fitMobile(h);
    for (const f of floaters) {
      f.cx = f.el.offsetLeft + f.el.offsetWidth / 2 - w / 2;
      f.cy = f.el.offsetTop + f.el.offsetHeight / 2 - h / 2;
    }
  };
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  const state = { p: 0, active: true };
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (state.p = self.progress),
    onToggle: (self) => {
      state.active = self.isActive || self.progress < 1;
      if (rotator.pause) rotator.pause(!state.active);
      widgets.setActive(state.active);
    },
  });

  // Copy recedes while the objects sweep past
  gsap
    .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true } })
    .to(content, { scale: 0.88, yPercent: -6, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0)
    .to(extras, { opacity: 0, duration: 0.15 }, 0)
    .to({}, { duration: 0.4 });

  let t = 0;
  const tick = (_, dt) => {
    if (!state.active) {
      // parked: make sure nothing lingers once the hero is behind us
      for (const f of floaters) {
        if (f.shown) {
          f.el.style.visibility = 'hidden';
          f.shown = false;
        }
      }
      return;
    }
    t += dt / 1000;
    widgets.update(t);
    const p = state.p;
    const e = reduced ? 0 : smooth(0, 0.75, p);
    const fade = 1 - smooth(0.12, 0.5, p);
    for (const f of floaters) {
      const k = 0.4 + (f.depth + 100) / 300; // nearer objects move more
      const bob = reduced ? 0 : 1;
      const x = pointer.sx * 24 * k + Math.sin(t * 0.55 + f.phase) * 7 * bob + f.cx * e * 0.9;
      const y = pointer.sy * 18 * k + Math.cos(t * 0.45 + f.phase) * 10 * bob + f.cy * e * 0.9;
      const z = Math.min(f.depth + e * 520, MAX_Z);
      const s = 0.6 + 0.4 * f.appear;
      const o = f.appear * fade;
      const visible = o > 0.005;
      if (visible !== f.shown) {
        f.el.style.visibility = visible ? 'visible' : 'hidden';
        f.shown = visible;
      }
      if (!visible) continue;
      const r = f.rot + Math.sin(t * 0.3 + f.phase) * 1.8 * bob + pointer.sx * 2 * k;
      f.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      f.el.style.opacity = o.toFixed(3);
    }
  };
  gsap.ticker.add(tick);

  // Called once the loader clears
  return function intro() {
    const tl = gsap.timeline({ onComplete: () => rotator.start?.() });
    tl.to('.hero__title .ln > span', { y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1 }, 0)
      .fromTo(
        '[data-hero-in]',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 },
        0.35
      )
      .to(floaters, { appear: 1, duration: 1.8, ease: 'expo.out', stagger: { each: 0.1, from: 'random' } }, 0.2);
    return tl;
  };
}
