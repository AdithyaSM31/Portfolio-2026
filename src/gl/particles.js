import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  AdditiveBlending,
  Vector3,
  Color,
} from 'three';
import { SHAPES } from './shapes.js';

const noise = /* glsl */ `
// Simplex 3D noise — Ashima Arts (MIT)
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uFrom;
uniform float uTo;
uniform float uMorph;
uniform float uIntro;
uniform float uSize;
uniform float uPixelRatio;
uniform float uMouseStrength;
uniform float uTurbulence;
uniform float uSpin;
uniform vec3 uMouse;
uniform vec3 uOffsets[6];

attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec3 aP4;
attribute vec3 aP5;
attribute vec4 aRand;

varying float vAccent;
varying float vAlpha;

${noise}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Each shape moves in its own way, then gets pushed to its slot on screen
vec3 shapeAt(float i) {
  vec3 p;
  if (i < 0.5) {
    p = position;
    p.xz = rot(uSpin) * p.xz;
    return p + uOffsets[0];
  }
  if (i < 1.5) {
    p = aP1;
    p.xz = rot(uSpin * 0.35) * p.xz;
    return p + uOffsets[1];
  }
  if (i < 2.5) {
    p = aP2;
    p.y += sin(p.x * 0.45 + uTime * 0.7) * 0.22 + cos(p.z * 0.5 + uTime * 0.5) * 0.18;
    return p + uOffsets[2];
  }
  if (i < 3.5) {
    p = aP3;
    p.yz = rot(uSpin * 2.2) * p.yz;
    return p + uOffsets[3];
  }
  if (i < 4.5) {
    p = aP4;
    p.xz = rot(uSpin * 0.8) * p.xz;
    p.yz = rot(uSpin * 0.3) * p.yz;
    return p + uOffsets[4];
  }
  p = aP5;
  p.xz = rot(uSpin * 0.6) * p.xz;
  p.xy = rot(uSpin * 0.25) * p.xy;
  return p + uOffsets[5];
}

void main() {
  // Morph straight from one shape to the next. Each particle runs on its own
  // offset clock so shapes dissolve organically, and all land once uMorph = 1.
  float lag = aRand.y * 0.45;
  float f = smoothstep(lag, lag + 0.55, uMorph);
  vec3 p = mix(shapeAt(uFrom), shapeAt(uTo), f);

  // Mid-morph: particles bloom outward, then settle
  float mid = sin(f * 3.14159265);
  p += normalize(p + 1e-4) * mid * (0.4 + aRand.z * 1.6);

  // Living drift
  float t = uTime * 0.11;
  vec3 q = p * 0.32;
  vec3 n = vec3(
    snoise(q + vec3(t, 0.0, 0.0)),
    snoise(q + vec3(0.0, t, 17.0)),
    snoise(q + vec3(31.0, 0.0, t))
  );
  p += n * (0.09 + mid * 0.55 + uTurbulence * 0.35);

  // Intro: gather in from deep space
  float intro = smoothstep(aRand.y * 0.55, aRand.y * 0.55 + 0.45, uIntro);
  vec3 scatter = normalize(position + 1e-4) * (7.0 + aRand.x * 16.0);
  scatter.z -= 6.0 + aRand.z * 12.0;
  p = mix(scatter, p, intro);

  vec4 world = modelMatrix * vec4(p, 1.0);

  // Cursor repulsion (world space)
  vec3 d = world.xyz - uMouse;
  float dist = length(d.xy);
  float force = smoothstep(1.7, 0.0, dist) * uMouseStrength;
  world.xyz += normalize(vec3(d.xy, d.z * 0.3) + 1e-4) * force * (0.55 + aRand.x * 0.6);

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.35 + pow(aRand.x, 3.0) * 1.9);
  gl_PointSize = size * uPixelRatio * (10.0 / -mv.z);

  vAccent = step(0.9, aRand.w);
  float twinkle = 0.72 + 0.28 * sin(uTime * (1.2 + aRand.w * 2.0) + aRand.w * 60.0);
  vAlpha = smoothstep(28.0, 5.0, -mv.z) * (0.35 + 0.65 * aRand.z) * twinkle * (0.25 + 0.75 * intro);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uDim;

varying float vAccent;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  a *= a;
  vec3 col = mix(uColor, uAccent, vAccent);
  float boost = mix(0.7, 1.25, vAccent);
  gl_FragColor = vec4(col, a * vAlpha * uDim * boost);
}
`;

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

export class Particles {
  constructor(canvas, { count = 24000, compact = false, reduced = false } = {}) {
    this.canvas = canvas;
    this.compact = compact;
    this.reduced = reduced;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(new Color('#060608'), 1);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    const geo = new BufferGeometry();
    const names = ['position', 'aP1', 'aP2', 'aP3', 'aP4', 'aP5'];
    SHAPES.forEach(({ build }, i) => {
      geo.setAttribute(names[i], new BufferAttribute(build(count), 3));
    });
    const offsets = SHAPES.map(({ offset }) =>
      compact ? new Vector3(0, offset[1], offset[2]) : new Vector3(...offset)
    );
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    geo.setAttribute('aRand', new BufferAttribute(rand, 4));

    this.uniforms = {
      uTime: { value: 0 },
      uFrom: { value: 0 },
      uTo: { value: 0 },
      uMorph: { value: 1 },
      uIntro: { value: 0 },
      uSize: { value: compact ? 3.4 : 3.1 },
      uPixelRatio: { value: 1 },
      uMouse: { value: new Vector3(99, 99, 0) },
      uMouseStrength: { value: 0 },
      uTurbulence: { value: 0 },
      uSpin: { value: 0 },
      uOffsets: { value: offsets },
      uColor: { value: new Color('#e9e8f0') },
      uAccent: { value: new Color('#d2ff3a') },
      uDim: { value: 1 },
    };

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });

    this.points = new Points(geo, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.state = {
      shape: 0,
      from: 0,
      to: 0,
      morph: 1,
      dim: 1,
      dimTarget: 1,
      mouseX: 0,
      mouseY: 0,
      mx: 0,
      my: 0,
      mouseActive: 0,
      velocity: 0,
      spin: 0,
      scrollRot: 0,
    };
    this._tmp = new Vector3();
    this._dir = new Vector3();

    this.resize();
  }

  setShape(i, dim = 1) {
    const st = this.state;
    if (i === st.to) {
      st.dimTarget = dim;
      return;
    }
    // Mid-morph retargets continue from whichever shape the cloud is closer to
    if (st.morph >= 0.5) {
      st.from = st.to;
      st.morph = 0;
    }
    st.to = i;
    this.state.dimTarget = dim;
  }

  pointer(nx, ny) {
    this.state.mouseX = nx;
    this.state.mouseY = ny;
    this.state.mouseActive = 1;
  }

  pointerLeave() {
    this.state.mouseActive = 0;
  }

  setVelocity(v) {
    this.state.velocity = v;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.compact ? 1.5 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.uniforms.uPixelRatio.value = dpr;
    // keep shapes framed on portrait screens
    const s = w / h < 1 ? 0.58 + (w / h) * 0.2 : 1;
    this.points.scale.setScalar(s);
  }

  update(time, dt) {
    const st = this.state;
    const u = this.uniforms;
    dt = Math.min(dt, 0.05);

    st.morph = Math.min(1, st.morph + dt / 1.7);
    st.dim = damp(st.dim, st.dimTarget, 2.5, dt);
    st.mx = damp(st.mx, st.mouseX, 3, dt);
    st.my = damp(st.my, st.mouseY, 3, dt);

    const vel = Math.min(Math.abs(st.velocity) / 60, 1);
    u.uTurbulence.value = damp(u.uTurbulence.value, vel, 4, dt);
    u.uTime.value = time;
    u.uFrom.value = st.from;
    u.uTo.value = st.to;
    u.uMorph.value = st.morph * st.morph * (3 - 2 * st.morph);
    u.uDim.value = st.dim * (this.compact ? 0.72 : 1);
    u.uMouseStrength.value = damp(u.uMouseStrength.value, st.mouseActive * (this.reduced ? 0 : 1), 3, dt);

    // Pointer → world position on the z=0 plane
    this._tmp.set(st.mouseX, st.mouseY, 0.5).unproject(this.camera);
    this._dir.copy(this._tmp).sub(this.camera.position).normalize();
    const dist = -this.camera.position.z / this._dir.z;
    u.uMouse.value.copy(this.camera.position).addScaledVector(this._dir, dist);

    // Slow spin plus a nudge from scroll velocity; the cursor tilts the whole field
    st.spin += dt * (this.reduced ? 0.01 : 0.05) + st.velocity * 0.00005;
    u.uSpin.value = st.spin;
    this.points.rotation.x = st.my * 0.1;
    this.points.rotation.y = st.mx * 0.14;

    this.camera.position.x = st.mx * 0.45;
    this.camera.position.y = st.my * 0.3;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}
