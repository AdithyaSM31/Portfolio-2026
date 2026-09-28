import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const pad = (n) => String(n).padStart(2, '0');

// A pinned section where the organisations sit on a rotating 3D drum.
// Scrolling turns the drum; the active entry's details swap in on the right.
export function initExperience({ lenis, reduced }) {
  const sec = document.querySelector('.exp');
  if (!sec) return;
  const items = [...sec.querySelectorAll('.wheel__item')];
  const panels = [...sec.querySelectorAll('.xpanel')];
  const idxEl = sec.querySelector('[data-exp-idx]');
  const n = items.length;
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    sec.style.height = `${100 + (n - 1) * 62}vh`;
    ScrollTrigger.refresh();

    const st = { target: 0, cur: 0, active: -1 };
    const trigger = ScrollTrigger.create({
      trigger: sec,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => (st.target = self.progress * (n - 1)),
    });

    const setActive = (i) => {
      if (i === st.active) return;
      const prev = panels[st.active];
      const next = panels[i];
      items.forEach((el, k) => el.classList.toggle('is-active', k === i));
      if (prev) gsap.to(prev, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power3.in', overwrite: true });
      gsap.fromTo(
        next,
        { autoAlpha: 0, y: 36 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: prev ? 0.2 : 0, overwrite: true }
      );
      gsap.fromTo(
        next.querySelectorAll('li'),
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: prev ? 0.3 : 0.1 }
      );
      if (idxEl) idxEl.textContent = pad(i + 1);
      st.active = i;
    };
    setActive(0);

    const R = Math.min(window.innerHeight * 0.34, 320);
    const step = 26;
    const tick = (_, dt) => {
      st.cur += (st.target - st.cur) * (reduced ? 1 : 1 - Math.exp(-dt / 110));
      items.forEach((el, i) => {
        const d = i - st.cur;
        const a = (d * step * Math.PI) / 180;
        const y = Math.sin(a) * R;
        const z = (Math.cos(a) - 1) * R;
        const o = Math.max(0, 1 - Math.abs(d) * 0.3);
        el.style.transform = `translate3d(0, calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px) rotateX(${(-d * step).toFixed(2)}deg)`;
        el.style.opacity = o.toFixed(3);
        el.style.pointerEvents = o > 0.3 ? 'auto' : 'none';
      });
      setActive(Math.round(st.cur));
    };
    gsap.ticker.add(tick);

    const onClick = (e) => {
      const i = +e.currentTarget.dataset.i;
      const y = trigger.start + (i / (n - 1)) * (trigger.end - trigger.start) + 2;
      lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: 'smooth' });
    };
    items.forEach((el) => el.addEventListener('click', onClick));

    return () => {
      gsap.ticker.remove(tick);
      items.forEach((el) => el.removeEventListener('click', onClick));
      sec.style.height = '';
      panels.forEach((p) => gsap.set(p, { clearProps: 'all' }));
    };
  });

  // Small screens: plain stacked entries
  mm.add('(max-width: 899px)', () => {
    if (reduced) return;
    panels.forEach((p) =>
      gsap.from(p, { opacity: 0, y: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } })
    );
  });
}
