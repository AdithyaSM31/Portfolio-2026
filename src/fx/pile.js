// Footer finale: 3D objects rain down and pile up on the giant wordmark.
// Matter.js runs the 2D physics; each body drives a Three.js mesh. The wordmark's
// silhouette is traced into static bodies so objects rest on the letters.
// Both libraries' extras load on demand, the first time the footer scrolls into view.
let Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events;
let kit;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function initPile({ reduced }) {
  const box = document.querySelector('[data-pile]');
  const mark = box?.querySelector('.pile__mark');
  if (!box || !mark) return;

  let engine;
  let studio;
  let raf = 0;
  let running = false;
  let started = false;
  let items = [];
  let timers = [];
  let W = 0;
  let H = 0;

  const touch = matchMedia('(hover: none)').matches;

  function traceMark() {
    // Rasterise the wordmark and build a skyline of static columns
    const br = box.getBoundingClientRect();
    const mr = mark.getBoundingClientRect();
    const cs = getComputedStyle(mark);
    const c = document.createElement('canvas');
    const scale = 0.25;
    c.width = Math.ceil(mr.width * scale);
    c.height = Math.ceil(mr.height * scale);
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.letterSpacing = cs.letterSpacing;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    const m = ctx.measureText(mark.textContent);
    const offX = (mr.width - m.width) / 2;
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
    const offY = (mr.height - lh) / 2 + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent || lh)) / 2;
    ctx.fillText(mark.textContent, offX, offY);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const colW = Math.max(6, Math.round(W / 110));
    const cols = Math.ceil(mr.width / colW);
    const bodies = [];
    for (let i = 0; i < cols; i++) {
      const x0 = Math.floor((i + 0.5) * colW * scale);
      let top = -1;
      for (let y = 0; y < c.height; y++) {
        if (data[(y * c.width + x0) * 4 + 3] > 80) {
          top = y / scale;
          break;
        }
      }
      if (top < 0) continue;
      const x = mr.left - br.left + i * colW + colW / 2;
      const y = mr.top - br.top + top;
      const h = H - y + 40;
      bodies.push(Bodies.rectangle(x, y + h / 2, colW, h, { isStatic: true, friction: 0.5, chamfer: { radius: 2 } }));
    }
    return bodies;
  }

  function bodyFor(shape, x, y) {
    const opts = { restitution: 0.28, friction: 0.12, frictionAir: 0.014, density: 0.0016 };
    if (shape.type === 'circle') return Bodies.circle(x, y, shape.r, opts);
    if (shape.type === 'poly') return Bodies.polygon(x, y, shape.sides, shape.r, opts);
    return Bodies.rectangle(x, y, shape.w, shape.h, { ...opts, chamfer: { radius: shape.chamfer } });
  }

  function build() {
    W = box.clientWidth;
    H = box.clientHeight;
    studio.resize(W, H);
    engine = Engine.create({ gravity: { y: 1.15 } });
    const t = 200;
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2 - 400, t, H * 3, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2 - 400, t, H * 3, { isStatic: true }),
      ...traceMark(),
    ]);

    if (!touch) {
      const mouse = Mouse.create(box);
      // let the page keep scrolling over the pile
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.16, damping: 0.1, render: { visible: false } } });
      Composite.add(engine.world, mc);
      Events.on(mc, 'startdrag', () => box.classList.add('is-grabbing'));
      Events.on(mc, 'enddrag', () => box.classList.remove('is-grabbing'));
      // nudge objects the cursor brushes past
      Events.on(engine, 'beforeUpdate', () => {
        const p = mouse.position;
        for (const it of items) {
          const dx = it.body.position.x - p.x;
          const dy = it.body.position.y - p.y;
          const d2 = dx * dx + dy * dy;
          const rr = (it.r + 40) * (it.r + 40);
          if (d2 < rr && d2 > 1) {
            const f = 0.0003 * it.body.mass * (1 - d2 / rr);
            const d = Math.sqrt(d2);
            Body.applyForce(it.body, it.body.position, { x: (dx / d) * f, y: (dy / d) * f - f * 0.6 });
          }
        }
      });
    } else if (!box.dataset.tapBound) {
      box.dataset.tapBound = '1';
      box.addEventListener('pointerdown', (e) => {
        const br = box.getBoundingClientRect();
        const px = e.clientX - br.left;
        const py = e.clientY - br.top;
        for (const it of items) {
          const dx = it.body.position.x - px;
          const dy = it.body.position.y - py;
          if (dx * dx + dy * dy < (it.r + 60) ** 2) {
            Body.setVelocity(it.body, { x: dx * 0.08, y: -14 });
            Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.3);
          }
        }
      });
    }
  }

  function spawn() {
    const u = (Math.min(Math.max(W, 720), 1600) / 1440) * (touch ? 1.2 : 1);
    const objects = kit.makeObjects(u, touch || W < 900);
    objects.forEach((obj, i) => {
      const id = setTimeout(() => {
        const s = obj.shape;
        const r = s.type === 'rect' ? Math.hypot(s.w, s.h) / 2 : s.r;
        const x = clamp(W * 0.06 + Math.random() * W * 0.88, r, W - r);
        const body = bodyFor(s, x, -r - Math.random() * 260);
        Body.setAngle(body, (Math.random() - 0.5) * 1.6);
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
        Composite.add(engine.world, body);

        const holder = new kit.Group();
        holder.add(obj.group);
        obj.group.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = !o.material.transparent; // objects shade each other
        });
        studio.scene.add(holder);
        items.push({
          body,
          holder,
          inner: obj.group,
          r,
          tx: (Math.random() - 0.5) * 0.5,
          ty: (Math.random() - 0.5) * 0.5,
        });
      }, i * (reduced ? 0 : 120));
      timers.push(id);
    });
  }

  // Fixed-step physics so the pile falls at the same speed on any frame rate
  const STEP = 1000 / 60;
  let last = 0;
  let acc = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    acc += Math.min(now - last, 250);
    last = now;
    let n = 0;
    while (acc >= STEP && n < 6) {
      Engine.update(engine, STEP);
      acc -= STEP;
      n++;
    }
    if (n === 6) acc = 0;
    for (const it of items) {
      const { x, y } = it.body.position;
      const v = it.body.velocity;
      it.holder.position.set(x, -y, 0);
      it.holder.rotation.z = -it.body.angle;
      // a little 3D wobble from motion, settling back to a resting tilt
      const rx = it.tx + clamp(v.y * 0.03, -0.5, 0.5);
      const ry = it.ty - clamp(v.x * 0.03, -0.5, 0.5);
      it.inner.rotation.x += (rx - it.inner.rotation.x) * 0.12;
      it.inner.rotation.y += (ry - it.inner.rotation.y) * 0.12;
    }
    studio.render();
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    items.forEach((it) => {
      studio.scene.remove(it.holder);
      kit.disposeObject(it.holder);
    });
    items = [];
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  }

  let visible = false;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) return stop();
      if (started) return engine && start();
      started = true;
      Promise.all([import('matter-js'), import('./pile-objects.js')]).then(([{ default: Matter }, objects]) => {
        ({ Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter);
        kit = objects;
        const canvas = document.createElement('canvas');
        canvas.className = 'pile__gl';
        box.appendChild(canvas);
        studio = kit.createStudio(canvas);
        build();
        spawn();
        if (visible) start();
      });
    },
    { threshold: 0.15 }
  );
  document.fonts.ready.then(() => io.observe(box));

  // Rebuild on width changes (not on mobile toolbar height jitter)
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (!engine || Math.abs(window.innerWidth - lastW) < 40) return;
    lastW = window.innerWidth;
    stop();
    clearAll();
    build();
    spawn();
    if (visible) start();
  });
}
