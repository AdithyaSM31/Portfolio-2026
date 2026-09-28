import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── Local clock (Chennai) ──────────────────────────────────────
export function initClock() {
  const els = document.querySelectorAll('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => els.forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 15000);
}

// ── Nav: collapses to a menu button after the hero; overlay menu ─
export function initNav({ lenis }) {
  const nav = document.querySelector('.nav');
  const menu = document.querySelector('.menu');
  const btn = nav.querySelector('.nav__menu');
  let open = false;

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the section in view
  const links = [...nav.querySelectorAll('.nav__links a')];
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => a.classList.toggle('is-active', self.isActive),
    });
  });

  const menuLinks = menu.querySelectorAll('.menu__links a');
  const toggle = (state = !open) => {
    open = state;
    nav.classList.toggle('is-menu', open);
    btn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    if (open) {
      lenis?.stop();
      gsap.set(menu, { visibility: 'visible' });
      gsap.to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' });
      gsap.fromTo(menuLinks, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.35 });
    } else {
      lenis?.start();
      gsap.to(menu, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.8,
        ease: 'expo.inOut',
        onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
      });
    }
  };
  btn.addEventListener('click', () => toggle());
  window.addEventListener('keydown', (e) => e.key === 'Escape' && open && toggle(false));

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      const go = () => (lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target === 0 ? window.scrollTo(0, 0) : target.scrollIntoView());
      if (open) {
        toggle(false);
        setTimeout(go, 350);
      } else go();
    });
  });
}

// ── Cursor companion + magnetic buttons ───────────────────────
export function initCursor() {
  if (matchMedia('(hover: none)').matches) return;
  const c = document.querySelector('.cursor');
  const label = c.querySelector('.cursor__label');
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
    c.classList.add('is-on');
  });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));

  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    c.classList.toggle('is-label', !!lab);
    c.classList.toggle('is-link', !lab && !!link);
    if (lab) label.textContent = lab.dataset.cursor;
  });

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      mx(0);
      my(0);
    });
  });
}

// ── Big marquee rows that speed up with scroll velocity ──────────
export function initMarquees({ lenis, reduced }) {
  const rows = [...document.querySelectorAll('[data-bigmarquee]')];
  if (!rows.length || reduced) return;
  const st = rows.map((row) => ({ row, dir: +row.dataset.bigmarquee, x: 0, w: row.scrollWidth / 3 }));
  let visible = false;
  ScrollTrigger.create({
    trigger: '.bigmarquee',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (visible = self.isActive),
    onRefresh: () => st.forEach((s) => (s.w = s.row.scrollWidth / 3)),
  });
  let boost = 0;
  gsap.ticker.add((_, dt) => {
    if (!visible) return;
    const v = lenis ? lenis.velocity : 0;
    boost += (Math.abs(v) * 0.9 - boost) * 0.1;
    for (const s of st) {
      s.x -= s.dir * (0.045 * dt + boost * (dt / 16));
      if (s.x <= -s.w) s.x += s.w;
      if (s.x > 0) s.x -= s.w;
      s.row.style.transform = `translate3d(${s.x.toFixed(1)}px,0,0)`;
    }
  });
}

// ── Loader ─────────────────────────────────────────────────────
export function runLoader({ ready, reduced, makeWipe }) {
  const loader = document.querySelector('.loader');
  const count = loader.querySelector('.loader__count');
  const bar = loader.querySelector('.loader__bar i');
  const name = loader.querySelector('.loader__line');

  return new Promise((resolve) => {
    if (reduced) {
      ready.then(() =>
        gsap.to(loader, {
          autoAlpha: 0,
          duration: 0.4,
          onComplete: () => {
            loader.remove();
            resolve();
          },
        })
      );
      return;
    }
    const wipe = makeWipe(name, { duration: 0.55 });
    wipe.play(0.1);
    const prog = { v: 0 };
    let done = false;
    ready.then(() => (done = true));
    const minTime = 1.5;
    const t0 = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - t0) / 1000;
      const cap = done ? 1 : 0.86;
      const target = Math.min(cap, elapsed / minTime);
      prog.v += (target - prog.v) * 0.12;
      if (done && elapsed >= minTime && prog.v > 0.995) prog.v = 1;
      count.textContent = String(Math.round(prog.v * 100)).padStart(3, '0');
      bar.style.transform = `scaleX(${prog.v})`;
      if (prog.v >= 1) {
        gsap.ticker.remove(tick);
        gsap
          .timeline({ onComplete: () => loader.remove() })
          .to(loader.querySelectorAll('.loader__name, .loader__meta, .loader__bar'), { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' })
          .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, 0.3)
          .add(resolve, 0.75);
      }
    };
    gsap.ticker.add(tick);
  });
}
