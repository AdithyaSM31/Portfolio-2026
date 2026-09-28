import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// "Built [ ] to ship." — the centre project sits whole inside the gap between the
// words. Scrolling grows it until it fills the screen (the words ride the
// window's edges out of frame), then pulls back so the grid appears around it.
//
// The grid is laid out at its full-screen size and only ever scaled *down*, so
// every image is rasterised large and stays sharp.
export function initReel() {
  const sec = document.querySelector('.reel');
  if (!sec) return;
  const stage = sec.querySelector('.reel__stage');
  const gap = sec.querySelector('.reel__gap');
  const media = sec.querySelector('.reel__media');
  const grid = sec.querySelector('.reel__grid');
  const center = sec.querySelector('.g-center');
  const left = sec.querySelector('.reel__word--l');
  const right = sec.querySelector('.reel__word--r');
  const caption = sec.querySelector('.reel__caption');
  const others = sec.querySelectorAll('.reel__grid figure:not(.g-center)');

  const m = { s0: 0.3, end: 0.55, x0: 0, y0: 0, t: 0, r: 0, b: 0, l: 0 };
  const layout = (W, H, k) => {
    grid.style.setProperty('--k', k);
    Object.assign(grid.style, {
      width: `${W * k}px`,
      height: `${H * k}px`,
      left: `${(W - W * k) / 2}px`,
      top: `${(H - H * k) / 2}px`,
    });
  };
  // Layout offsets ignore the transforms we animate, so this is safe mid-scroll
  const measure = () => {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    layout(W, H, 1);
    // scale at which the centre tile fits the screen whole
    const S = Math.min(W / center.offsetWidth, H / center.offsetHeight);
    layout(W, H, S);
    const cw = center.offsetWidth;
    const ch = center.offsetHeight;
    const ccx = grid.offsetLeft + center.offsetLeft + cw / 2;
    const ccy = grid.offsetTop + center.offsetTop + ch / 2;
    const gw = gap.offsetWidth;
    const gh = gap.offsetHeight;
    const gl = gap.offsetLeft;
    const gt = gap.offsetTop;
    m.s0 = Math.max(gw / cw, gh / ch);
    m.end = 1 / S;
    // the grid scales about the stage centre; shift it so the centre tile
    // starts exactly over the gap
    m.x0 = gl + gw / 2 - W / 2 - (ccx - W / 2) * m.s0;
    m.y0 = gt + gh / 2 - H / 2 - (ccy - H / 2) * m.s0;
    m.t = gt;
    m.l = gl;
    m.r = W - gl - gw;
    m.b = H - gt - gh;
  };
  measure();
  ScrollTrigger.addEventListener('refreshInit', measure);

  const grow = { duration: 0.44, ease: 'power2.inOut' };
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
    })
    .fromTo(
      media,
      { clipPath: () => `inset(${m.t}px ${m.r}px ${m.b}px ${m.l}px round 14px)` },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', ...grow },
      0.04
    )
    .fromTo(grid, { scale: () => m.s0, x: () => m.x0, y: () => m.y0 }, { scale: 1, x: 0, y: 0, ...grow }, 0.04)
    // the words ride the window's edges out of frame
    .fromTo(left, { x: 0 }, { x: () => -m.l, ...grow }, 0.04)
    .fromTo(right, { x: 0 }, { x: () => m.r, ...grow }, 0.04)
    .fromTo(others, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.52)
    .to(grid, { scale: () => m.end, duration: 0.36, ease: 'power2.inOut' }, 0.5)
    .fromTo(caption, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.84)
    .to({}, { duration: 0.06 });
}
