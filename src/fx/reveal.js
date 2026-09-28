import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Block wipe: an accent bar sweeps across each line, the text appears behind it,
// then the bar retracts. Returns a paused timeline.
export function makeWipe(el, { stagger = 0.1, duration = 0.5 } = {}) {
  const split = SplitText.create(el, { type: 'lines', linesClass: 'wipe-line' });
  el.classList.add('is-split');
  const tl = gsap.timeline({ paused: true, onComplete: () => split.revert() });
  split.lines.forEach((line, i) => {
    const text = document.createElement('span');
    text.className = 'wipe-text';
    while (line.firstChild) text.appendChild(line.firstChild);
    const block = document.createElement('span');
    block.className = 'wipe-block';
    line.append(text, block);
    gsap.set(text, { opacity: 0 });
    const t = i * stagger;
    tl.to(block, { scaleX: 1, transformOrigin: 'left center', duration, ease: 'expo.inOut' }, t)
      .set(text, { opacity: 1 }, t + duration)
      .to(block, { scaleX: 0, transformOrigin: 'right center', duration, ease: 'expo.inOut' }, t + duration);
  });
  return tl;
}

export function initWipes(reduced) {
  document.querySelectorAll('[data-wipe]').forEach((el) => {
    if (reduced) {
      el.classList.add('is-split');
      return;
    }
    const tl = makeWipe(el);
    ScrollTrigger.create({ trigger: el, start: 'top 84%', once: true, onEnter: () => tl.play() });
  });
}

// Manifesto: words brighten as they scroll through the viewport
export function initManifesto(reduced) {
  const el = document.querySelector('[data-manifesto]');
  if (!el || reduced) return;
  const split = SplitText.create(el, { type: 'words', wordsClass: 'mw' });
  gsap.fromTo(
    split.words,
    { opacity: 0.13 },
    {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
    }
  );
}

// Portrait: opens upward like a shutter, then drifts slightly as you scroll past
export function initPortrait(reduced) {
  const fig = document.querySelector('[data-portrait]');
  if (!fig || reduced) return;
  const frame = fig.querySelector('.about__frame');
  const img = frame.querySelector('img');
  gsap.fromTo(
    frame,
    { clipPath: 'inset(100% 0% 0% 0% round 28px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 28px)',
      ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top 92%', end: 'top 40%', scrub: true },
    }
  );
  gsap.fromTo(
    img,
    { scale: 1.35, yPercent: -4 },
    { scale: 1.05, yPercent: 4, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } }
  );
}

export function initCounters(reduced) {
  document.querySelectorAll('[data-count]').forEach((el) => {
    if (reduced) return;
    const end = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const suf = el.dataset.suffix || '';
    const o = { v: 0 };
    el.textContent = (0).toFixed(dec) + suf;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(o, {
          v: end,
          duration: 2,
          ease: 'expo.out',
          onUpdate: () => (el.textContent = o.v.toFixed(dec) + suf),
        }),
    });
  });
}

// Everything else: a quiet rise-in, batched so rows cascade
export function initReveals(reduced) {
  const sel = [
    '.stat',
    '.sec-head .eyebrow',
    '.sec-head__aside',
    '.about .eyebrow',
    '.archive__head .mono',
    '.arow',
    '.skills__col',
    '.edu__row',
    '.certs__head',
    '.cert',
    '.contact .eyebrow',
    '.contact__sub',
    '.contact__mail',
    '.contact__grid > div',
  ].join(',');
  const items = gsap.utils.toArray(sel);
  if (reduced) return;
  gsap.set(items, { opacity: 0, y: 28 });
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, overwrite: true }),
  });
}
