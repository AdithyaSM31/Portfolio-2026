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
  // set by a long-press so the tap that ends it doesn't also toggle the row
  const press = { suppressClick: false };
  if (!canHover) initLongPress(rows, press, lenis);

  rows.forEach((row) => {
    const head = row.querySelector('.arow__row');
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(row);
      }
    });
    head.addEventListener('click', () => {
      if (press.suppressClick) return (press.suppressClick = false);
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

// Touch: long-press an archive row to open its details in a bottom sheet.
// A normal tap still expands the row in place; scrolling cancels the press.
function initLongPress(rows, press, lenis) {
  const sheet = document.querySelector('.asheet');
  if (!sheet) return;
  const panel = sheet.querySelector('.asheet__panel');
  const backdrop = sheet.querySelector('.asheet__backdrop');
  const closeBtn = sheet.querySelector('.asheet__close');
  const HOLD = 450;
  let timer = 0;
  let pressed = null;
  let start = { x: 0, y: 0 };
  let open = false;
  let returnFocus = null;

  const cancel = () => {
    clearTimeout(timer);
    pressed?.classList.remove('is-pressing');
    pressed = null;
  };

  const openSheet = (row) => {
    sheet.querySelector('[data-sheet-i]').textContent = row.querySelector('.arow__i').textContent;
    sheet.querySelector('[data-sheet-tags]').textContent = row.querySelector('.arow__g').textContent;
    sheet.querySelector('[data-sheet-title]').textContent = row.querySelector('.arow__t').textContent;
    sheet.querySelector('.asheet__img img').src = row.querySelector('.arow__thumb').src;
    sheet.querySelector('[data-sheet-details]').innerHTML = row.querySelector('.arow__inner').innerHTML;
    panel.scrollTop = 0;
    open = true;
    returnFocus = row.querySelector('.arow__row');
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    lenis?.stop();
    gsap.to(backdrop, { opacity: 1, duration: 0.35, overwrite: true });
    gsap.fromTo(panel, { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
    closeBtn.focus({ preventScroll: true });
  };

  const closeSheet = () => {
    if (!open) return;
    open = false;
    sheet.setAttribute('aria-hidden', 'true');
    gsap.to(backdrop, { opacity: 0, duration: 0.3, overwrite: true });
    gsap.to(panel, {
      yPercent: 110,
      duration: 0.45,
      ease: 'power3.in',
      overwrite: true,
      onComplete: () => {
        sheet.classList.remove('is-open');
        gsap.set(panel, { y: 0 });
        lenis?.start();
        returnFocus?.focus({ preventScroll: true });
      },
    });
  };

  rows.forEach((row) => {
    const head = row.querySelector('.arow__row');
    head.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      cancel();
      pressed = row;
      start = { x: e.clientX, y: e.clientY };
      row.classList.add('is-pressing');
      timer = setTimeout(() => {
        row.classList.remove('is-pressing');
        pressed = null;
        press.suppressClick = true;
        // if the browser doesn't follow the long-press with a click, don't
        // let the flag swallow the next genuine tap
        setTimeout(() => (press.suppressClick = false), 700);
        navigator.vibrate?.(12);
        openSheet(row);
      }, HOLD);
    });
    head.addEventListener('pointermove', (e) => {
      if (pressed && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) cancel();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => head.addEventListener(t, cancel));
    // no native "save image / copy" menu on long-press
    head.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  window.addEventListener('scroll', cancel, { passive: true });

  sheet.querySelectorAll('[data-sheet-close]').forEach((el) => el.addEventListener('click', closeSheet));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && closeSheet());

  // swipe the sheet down (by its handle or image) to dismiss
  let drag = null;
  sheet.querySelectorAll('[data-sheet-drag]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => {
      drag = { y0: e.clientY, dy: 0 };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.dy = Math.max(0, e.clientY - drag.y0);
      gsap.set(panel, { y: drag.dy });
    });
    const end = () => {
      if (!drag) return;
      const { dy } = drag;
      drag = null;
      if (dy > 90) closeSheet();
      else gsap.to(panel, { y: 0, duration: 0.4, ease: 'expo.out' });
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });
}
