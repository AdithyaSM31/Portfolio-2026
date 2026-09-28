// Live UI widgets that float in the hero: a camera tracker, flight telemetry, a
// neural net and a terminal. Each exposes update(t) for per-frame motion; the
// hero pauses them when it is off screen.

const SVG = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ns) => {
  const n = ns ? document.createElementNS(SVG, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Vision: a lime box tracks an ArUco marker drifting through the frame ──
function vision(root) {
  const view = root.querySelector('.cv');
  const marker = root.querySelector('.cv__marker');
  const box = root.querySelector('.cv__box');
  const conf = root.querySelector('[data-cv-conf]');
  const xy = root.querySelector('[data-cv-xy]');
  // 6×6 ArUco-style pattern: black border, 4×4 data bits
  const bits = '1011010011100101';
  let html = '';
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++) {
      const edge = r === 0 || c === 0 || r === 5 || c === 5;
      html += `<i class="${edge || bits[(r - 1) * 4 + (c - 1)] === '0' ? '' : 'on'}"></i>`;
    }
  marker.innerHTML = html;
  const s = { x: 0.5, y: 0.5, bx: 0.5, by: 0.5, last: 0 };
  return (t) => {
    s.x = 0.5 + Math.sin(t * 0.62) * 0.28 + Math.sin(t * 1.7) * 0.04;
    s.y = 0.5 + Math.sin(t * 0.93 + 1.2) * 0.2;
    const rot = Math.sin(t * 0.5) * 18;
    // the detector lags a touch behind, like a real tracker
    s.bx += (s.x - s.bx) * 0.12;
    s.by += (s.y - s.by) * 0.12;
    const w = view.clientWidth;
    const h = view.clientHeight;
    marker.style.transform = `translate(${s.x * w}px, ${s.y * h}px) translate(-50%, -50%) rotate(${rot}deg)`;
    box.style.transform = `translate(${s.bx * w}px, ${s.by * h}px) translate(-50%, -50%)`;
    if (t - s.last > 0.12) {
      s.last = t;
      conf.textContent = (0.95 + Math.random() * 0.04).toFixed(2);
      xy.textContent = `x ${(s.bx - 0.5).toFixed(2)} · y ${(0.5 - s.by).toFixed(2)}`;
    }
  };
}

// ── Telemetry: rolling altitude trace and live readouts ──
function telemetry(root) {
  const line = root.querySelector('.tm__line');
  const area = root.querySelector('.tm__area');
  const dot = root.querySelector('.tm__dot');
  const alt = root.querySelector('[data-tm="alt"]');
  const vel = root.querySelector('[data-tm="vel"]');
  const bat = root.querySelector('[data-tm="bat"]');
  const batBar = root.querySelector('.tm__bat i');
  const N = 48;
  const data = Array.from({ length: N }, (_, i) => 1.2 + Math.sin(i * 0.3) * 0.2);
  const s = { last: 0, stat: 0, battery: 87 };
  const sample = (t) => 1.2 + Math.sin(t * 0.8) * 0.26 + Math.sin(t * 2.7) * 0.07 + (Math.random() - 0.5) * 0.05;
  return (t) => {
    if (t - s.last < 0.08) return;
    s.last = t;
    data.shift();
    data.push(sample(t));
    const pts = data.map((v, i) => `${((i / (N - 1)) * 200).toFixed(1)},${(56 - ((v - 0.8) / 0.8) * 48).toFixed(1)}`);
    line.setAttribute('points', pts.join(' '));
    area.setAttribute('d', `M0,60 L${pts.join(' L')} L200,60 Z`);
    const [lx, ly] = pts[N - 1].split(',');
    dot.setAttribute('cx', lx);
    dot.setAttribute('cy', ly);
    if (t - s.stat > 0.3) {
      s.stat = t;
      const v = data[N - 1];
      alt.textContent = v.toFixed(2);
      vel.textContent = Math.abs((data[N - 1] - data[N - 4]) * 4).toFixed(2);
      s.battery = s.battery <= 62 ? 87 : s.battery - 0.05;
      bat.textContent = Math.round(s.battery);
      batBar.style.transform = `scaleX(${s.battery / 100})`;
    }
  };
}

// ── Neural net: signals pulse layer to layer; the output distribution shifts ──
function neural(root) {
  const svg = root.querySelector('.nn');
  const layers = [3, 5, 5, 3];
  const W = 200;
  const H = 104;
  const nodes = layers.map((n, li) =>
    Array.from({ length: n }, (_, i) => ({ x: 14 + (li * (W - 28)) / (layers.length - 1), y: H / 2 + (i - (n - 1) / 2) * 20 }))
  );
  const gEdges = el('g', { class: 'nn__edges' }, true);
  const gNodes = el('g', {}, true);
  const gPulses = el('g', {}, true);
  const edges = [];
  nodes.forEach((layer, li) => {
    if (li === nodes.length - 1) return;
    layer.forEach((a, ai) =>
      nodes[li + 1].forEach((b, bi) => {
        gEdges.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, true));
        edges.push({ li, ai, bi, a, b });
      })
    );
  });
  const nodeEls = nodes.map((layer) =>
    layer.map((n) => {
      const c = el('circle', { cx: n.x, cy: n.y, r: 4.2, class: 'nn__node' }, true);
      gNodes.appendChild(c);
      return c;
    })
  );
  svg.append(gEdges, gNodes, gPulses);
  const pulses = Array.from({ length: 9 }, () => {
    const c = el('circle', { r: 2.2, class: 'nn__pulse' }, true);
    gPulses.appendChild(c);
    return { c, e: edges[(Math.random() * edges.length) | 0], p: Math.random(), v: 0.9 + Math.random() * 0.8 };
  });
  const flash = new Map();
  const bars = [...root.querySelectorAll('.nn__row')].map((r) => ({ r, fill: r.querySelector('i'), val: r.querySelector('b') }));
  const out = { cur: [0.9, 0.07, 0.03], target: [0.9, 0.07, 0.03], next: 0 };
  let lastT = 0;
  return (t) => {
    const dt = Math.min(t - lastT, 0.05);
    lastT = t;
    for (const pu of pulses) {
      pu.p += dt * pu.v;
      if (pu.p >= 1) {
        const key = `${pu.e.li + 1}:${pu.e.bi}`;
        flash.set(key, t);
        // hop onward from the node we arrived at, or restart at the input
        const onward = edges.filter((e) => e.li === pu.e.li + 1 && e.ai === pu.e.bi);
        pu.e = onward.length ? onward[(Math.random() * onward.length) | 0] : edges.filter((e) => e.li === 0)[(Math.random() * 15) | 0];
        pu.p = 0;
      }
      pu.c.setAttribute('cx', pu.e.a.x + (pu.e.b.x - pu.e.a.x) * pu.p);
      pu.c.setAttribute('cy', pu.e.a.y + (pu.e.b.y - pu.e.a.y) * pu.p);
    }
    nodeEls.forEach((layer, li) =>
      layer.forEach((c, i) => {
        const f = flash.get(`${li}:${i}`);
        c.classList.toggle('is-hot', f !== undefined && t - f < 0.25);
      })
    );
    if (t > out.next) {
      out.next = t + 2.4;
      const win = (Math.random() * 3) | 0;
      const raw = [0, 1, 2].map((i) => (i === win ? 3 + Math.random() * 2 : Math.random()));
      const sum = raw.reduce((a, b) => a + Math.exp(b), 0);
      out.target = raw.map((v) => Math.exp(v) / sum);
    }
    const top = out.target.indexOf(Math.max(...out.target));
    bars.forEach((b, i) => {
      out.cur[i] += (out.target[i] - out.cur[i]) * 0.08;
      b.fill.style.transform = `scaleX(${out.cur[i].toFixed(3)})`;
      b.val.textContent = out.cur[i].toFixed(2);
      b.r.classList.toggle('is-top', i === top);
    });
  };
}

// ── Terminal: types commands and prints their output, on a loop ──
const SCRIPT = [
  { cmd: 'python land.py --marker 42', out: ['<s>›</s> marker locked · alt 1.20 m', '<s>›</s> descending … <b>✓ landed</b>'] },
  { cmd: 'npm run build', out: ['<s>›</s> vite · 32 modules transformed', '<b>✓</b> built in 284ms'] },
  { cmd: 'docker compose up -d', out: ['<b>✓</b> api  <b>✓</b> worker  <b>✓</b> redis'] },
  { cmd: 'git push origin main', out: ['<b>✓</b> deployed → vercel.app'] },
];

function terminal(root, reduced) {
  const box = root.querySelector('[data-term]');
  const MAX = 5;
  let active = true;
  const push = (html) => {
    const line = el('span', { class: 'term__line' });
    line.innerHTML = html;
    box.appendChild(line);
    while (box.children.length > MAX) box.firstChild.remove();
    return line;
  };
  const waitActive = async () => {
    while (!active) await sleep(300);
  };
  (async () => {
    if (reduced) {
      push('<b>$</b> python land.py --marker 42');
      SCRIPT[0].out.forEach(push);
      return;
    }
    for (let i = 0; ; i = (i + 1) % SCRIPT.length) {
      const { cmd, out } = SCRIPT[i];
      const line = push('<b>$</b> <span class="t"></span><em class="caret">▍</em>');
      const t = line.querySelector('.t');
      for (const ch of cmd) {
        await waitActive();
        t.textContent += ch;
        await sleep(38 + Math.random() * 60);
      }
      await sleep(260);
      line.querySelector('.caret').remove();
      for (const o of out) {
        await sleep(360 + Math.random() * 380);
        push(o);
      }
      await sleep(1500);
    }
  })();
  return (on) => (active = on);
}

export function initWidgets(hero, { reduced }) {
  const updates = [];
  const cv = hero.querySelector('.wg--cv');
  const tm = hero.querySelector('.wg--tm');
  const nn = hero.querySelector('.wg--nn');
  const term = hero.querySelector('.wg--term');
  if (cv) updates.push(vision(cv));
  if (tm) updates.push(telemetry(tm));
  if (nn) updates.push(neural(nn));
  const setTerm = term ? terminal(term, reduced) : () => {};
  // with reduced motion, draw one still frame of each widget
  if (reduced) updates.forEach((u) => u(1));
  return {
    update: (t) => {
      if (reduced) return;
      for (const u of updates) u(t);
    },
    setActive: (on) => setTerm(on),
  };
}
