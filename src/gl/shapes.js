// Procedural point clouds. Every generator returns a Float32Array of `n` xyz triples,
// so any two shapes can be morphed point-for-point in the vertex shader.

const TAU = Math.PI * 2;

function gauss() {
  // Box–Muller, clamped so tubes stay tight
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.max(-2.5, Math.min(2.5, Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v)));
}

function rotX(out, i, a) {
  const y = out[i + 1];
  const z = out[i + 2];
  out[i + 1] = y * Math.cos(a) - z * Math.sin(a);
  out[i + 2] = y * Math.sin(a) + z * Math.cos(a);
}

function rotZ(out, i, a) {
  const x = out[i];
  const y = out[i + 1];
  out[i] = x * Math.cos(a) - y * Math.sin(a);
  out[i + 1] = x * Math.sin(a) + y * Math.cos(a);
}

// 0 — Planet: fibonacci shell + tilted orbital ring
export function planet(n) {
  const out = new Float32Array(n * 3);
  const shell = Math.floor(n * 0.8);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const R = 2.05;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    if (i < shell) {
      const y = 1 - (i / (shell - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const rr = R * (1 + gauss() * 0.018);
      out[k] = Math.cos(th) * r * rr;
      out[k + 1] = y * rr;
      out[k + 2] = Math.sin(th) * r * rr;
    } else {
      const a = Math.random() * TAU;
      const r = 2.85 + Math.pow(Math.random(), 1.6) * 1.1;
      out[k] = Math.cos(a) * r;
      out[k + 1] = gauss() * 0.025;
      out[k + 2] = Math.sin(a) * r;
      rotX(out, k, 1.2);
      rotZ(out, k, 0.35);
    }
  }
  return out;
}

// 1 — Galaxy: three-armed spiral, tilted and pushed right
export function galaxy(n) {
  const out = new Float32Array(n * 3);
  const arms = 3;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    const r = Math.pow(Math.random(), 1.35) * 6.8 + 0.15;
    const branch = ((i % arms) / arms) * TAU;
    const spin = r * 0.85;
    const s = 0.28 * r;
    out[k] = Math.cos(branch + spin) * r + Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? -1 : 1) * s;
    out[k + 1] = gauss() * 0.12 * (1.4 - r / 7);
    out[k + 2] = Math.sin(branch + spin) * r + Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? -1 : 1) * s;
    rotX(out, k, 1.05);
    rotZ(out, k, -0.25);
  }
  return out;
}

// 2 — Terrain: rolling data landscape below the horizon
export function terrain(n) {
  const out = new Float32Array(n * 3);
  const cols = Math.ceil(Math.sqrt(n * 1.8));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    const cx = i % cols;
    const cz = Math.floor(i / cols);
    const x = (cx / (cols - 1) - 0.5) * 20 + (Math.random() - 0.5) * 0.05;
    const z = (cz / (rows - 1)) * -14 + 3.5;
    const y =
      -2.3 +
      Math.sin(x * 0.55 + z * 0.3) * 0.45 +
      Math.cos(z * 0.62 - x * 0.18) * 0.35 +
      Math.sin(x * 1.4) * 0.08;
    out[k] = x;
    out[k + 1] = y;
    out[k + 2] = z;
  }
  return out;
}

// 3 — Helix: double strand with rungs, running across the screen
export function helix(n) {
  const out = new Float32Array(n * 3);
  const len = 17;
  const turns = 3.2;
  const R = 1.15;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    const t = Math.random();
    const a = t * turns * TAU;
    const x = (t - 0.5) * len;
    const kind = Math.random();
    if (kind < 0.8) {
      const phase = i % 2 ? 0 : Math.PI;
      const j = 0.06;
      out[k] = x + gauss() * j;
      out[k + 1] = Math.cos(a + phase) * R + gauss() * j;
      out[k + 2] = Math.sin(a + phase) * R + gauss() * j;
    } else {
      // rung: snap to discrete positions along the helix
      const tt = Math.round(t * 46) / 46;
      const aa = tt * turns * TAU;
      const u = Math.random() * 2 - 1;
      out[k] = (tt - 0.5) * len;
      out[k + 1] = Math.cos(aa) * R * u;
      out[k + 2] = Math.sin(aa) * R * u;
    }
    rotZ(out, k, 0.12);
  }
  return out;
}

// 4 — Lattice: cube grid structure (the "toolkit")
export function lattice(n) {
  const out = new Float32Array(n * 3);
  const div = 4;
  const size = 3.3;
  const h = size / 2;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    const axis = i % 3;
    const a = (Math.floor(Math.random() * (div + 1)) / div) * size - h;
    const b = (Math.floor(Math.random() * (div + 1)) / div) * size - h;
    const c = Math.random() * size - h;
    const j = 0.012;
    const p = axis === 0 ? [c, a, b] : axis === 1 ? [a, c, b] : [a, b, c];
    out[k] = p[0] + gauss() * j;
    out[k + 1] = p[1] + gauss() * j;
    out[k + 2] = p[2] + gauss() * j;
    rotX(out, k, 0.55);
    rotZ(out, k, 0.5);
  }
  return out;
}

// 5 — Torus knot: the finale behind "Let's build"
export function knot(n) {
  const out = new Float32Array(n * 3);
  const p = 2;
  const q = 3;
  const s = 0.92;
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    const t = Math.random() * TAU;
    const r = Math.cos(q * t) + 2;
    const tube = 0.1;
    out[k] = (r * Math.cos(p * t) + gauss() * tube) * s;
    out[k + 1] = (r * Math.sin(p * t) + gauss() * tube) * s;
    out[k + 2] = (-Math.sin(q * t) + gauss() * tube) * s;
  }
  return out;
}

// `offset` shifts a shape sideways on wide screens so it sits beside the copy.
export const SHAPES = [
  { build: planet, offset: [0, 0, 0] },
  { build: galaxy, offset: [2.2, -0.2, -2.5] },
  { build: terrain, offset: [0, 0, 0] },
  { build: helix, offset: [0, 0, 0] },
  { build: lattice, offset: [2.5, 0, 0] },
  { build: knot, offset: [2.7, 0, 0] },
];
