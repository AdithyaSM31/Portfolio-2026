import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Sticky cards: as each new card slides over, the one beneath recedes and dims.
export function initStackCards(reduced) {
  const cards = gsap.utils.toArray('.scard');
  if (reduced) return;
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    const inner = card.querySelector('.scard__inner');
    const shade = card.querySelector('.scard__shade');
    gsap
      .timeline({
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: 'top top+=' + Math.round(window.innerHeight * 0.12),
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .to(inner, { scale: 0.9, yPercent: -2, ease: 'none' }, 0)
      .to(shade, { opacity: 0.65, ease: 'none' }, 0);
  });

  // Images drift inside their frames for depth
  cards.forEach((card) => {
    const img = card.querySelector('.scard__frame img');
    gsap.fromTo(
      img,
      { yPercent: 4 },
      { yPercent: -4, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
  });
}

// Archive: rows expand in place on tap/keyboard. On desktop, hovering a row
// opens a card beside it with the full details and links; the card follows the
// hovered row and stays open while the cursor moves into it.
export function initArchive({ lenis }) {
  const wrap = document.querySelector('.archive');
  const list = document.querySelector('[data-archive]');
  const card = document.querySelector('.acard');
  if (!list) return;
  const rows = [...list.querySelectorAll('.arow')];

  const toggle = (row, open = !row.classList.contains('is-open')) => {
    row.classList.toggle('is-open', open);
    row.querySelector('.arow__row').setAttribute('aria-expanded', open);
    // the list changes height; keep later triggers in sync once it settles
    setTimeout(() => ScrollTrigger.refresh(), 600);
  };

  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches && card;

  rows.forEach((row) => {
    const head = row.querySelector('.arow__row');
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(row);
      }
    });
    head.addEventListener('click', () => {
      if (!canHover) return toggle(row);
      // desktop: the row opens the project's main link
      const first = row.querySelector('.adet__links a');
      if (first) window.open(first.href, '_blank', 'noopener');
      else toggle(row);
    });
  });

  if (!canHover) return;

  const img = card.querySelector('.acard__img img');
  const idx = card.querySelector('.acard__i');
  const tags = card.querySelector('.acard__tags');
  const title = card.querySelector('.acard__t');
  const details = card.querySelector('.acard__details');
  let current = null;
  let hideTimer = 0;
  let visible = false;
  const pointer = { x: -1, y: -1 };

  const show = (row) => {
    clearTimeout(hideTimer);
    if (row !== current) {
      current?.classList.remove('is-hot');
      row.classList.add('is-hot');
      current = row;
      idx.textContent = row.querySelector('.arow__i').textContent;
      tags.textContent = row.querySelector('.arow__g').textContent;
      title.textContent = row.querySelector('.arow__t').textContent;
      img.src = row.querySelector('.arow__thumb').src;
      details.innerHTML = row.querySelector('.arow__inner').innerHTML;
    }
    // centre the card on the row, but keep it on screen and inside the archive
    const ch = card.offsetHeight;
    const wr = wrap.getBoundingClientRect();
    const top = row.offsetTop + list.offsetTop + row.offsetHeight / 2 - ch / 2;
    const min = Math.max(list.offsetTop - 40, 90 - wr.top);
    const max = Math.min(wrap.offsetHeight - ch + 40, window.innerHeight - 20 - ch - wr.top);
    const y = Math.max(min, Math.min(max, top));
    if (!visible) {
      visible = true;
      card.classList.add('is-on');
      gsap.set(card, { y });
      gsap.fromTo(card, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: true });
    } else {
      gsap.to(card, { y, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    }
  };

  const hide = () => {
    clearTimeout(hideTimer);
    if (!visible) return;
    visible = false;
    card.classList.remove('is-on');
    current?.classList.remove('is-hot');
    current = null;
    gsap.to(card, { autoAlpha: 0, scale: 0.96, duration: 0.25, ease: 'power2.out', overwrite: true });
  };
  const hideSoon = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 140);
  };

  rows.forEach((row) => row.querySelector('.arow__row').addEventListener('pointerenter', () => show(row)));
  list.addEventListener('pointerleave', (e) => !card.contains(e.relatedTarget) && hideSoon());
  card.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  card.addEventListener('pointerleave', (e) => !list.contains(e.relatedTarget) && hideSoon());

  // Content scrolls under a still cursor without firing pointer events, so
  // re-check what the cursor is over whenever the page moves
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });
  const recheck = () => {
    if (!visible) return;
    const el = document.elementFromPoint(pointer.x, pointer.y);
    if (el && card.contains(el)) return;
    const row = el?.closest?.('.arow');
    if (row && list.contains(row)) show(row);
    else hide();
  };
  if (lenis) lenis.on('scroll', recheck);
  else window.addEventListener('scroll', recheck, { passive: true });
}
