// 3D object kit for the footer pile: keycaps, gears, chips, boards, passives and
// other hardware. Everything is modelled in pixel units and viewed through an
// orthographic camera, so a Matter.js body at (x, y) maps onto a mesh at (x, -y).
import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  Group,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
  CylinderGeometry,
  CapsuleGeometry,
  TorusGeometry,
  BoxGeometry,
  LatheGeometry,
  ExtrudeGeometry,
  Shape,
  Path,
  Vector2,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShadowMaterial,
  DirectionalLight,
  HemisphereLight,
  PMREMGenerator,
  CanvasTexture,
  SRGBColorSpace,
  NeutralToneMapping,
  PCFSoftShadowMap,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const INK = '#edece7';
const DARK = '#0e0e11';
const VOLT = '#d2ff3a';

// ── Materials (shared) ──────────────────────────────────────────
const M = {
  ink: new MeshPhysicalMaterial({ color: '#121216', roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.4 }),
  inkTop: new MeshPhysicalMaterial({ color: '#1f1f25', roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.5 }),
  bone: new MeshPhysicalMaterial({ color: '#cfccc4', roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
  boneTop: new MeshPhysicalMaterial({ color: '#dddad3', roughness: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
  volt: new MeshPhysicalMaterial({ color: '#c4f21f', roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  voltTop: new MeshPhysicalMaterial({ color: '#cdf83a', roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.45 }),
  chrome: new MeshStandardMaterial({ color: '#dfe1e8', metalness: 1, roughness: 0.16 }),
  steel: new MeshStandardMaterial({ color: '#8d9099', metalness: 1, roughness: 0.36 }),
  brass: new MeshStandardMaterial({ color: '#c8a55e', metalness: 1, roughness: 0.28 }),
  rubber: new MeshStandardMaterial({ color: '#16161a', roughness: 0.92 }),
  pcb: new MeshStandardMaterial({ color: '#0b120f', roughness: 0.78 }),
  plastic: new MeshStandardMaterial({ color: '#1b1b20', roughness: 0.7 }),
  beige: new MeshPhysicalMaterial({ color: '#c9b48a', roughness: 0.55, clearcoat: 0.4 }),
  glow: new MeshPhysicalMaterial({ color: VOLT, emissive: VOLT, emissiveIntensity: 0.55, roughness: 0.2, clearcoat: 1 }),
};
const SHARED = new Set(Object.values(M));
const METALS = [M.chrome, M.steel, M.brass];
const SKIN = {
  ink: [M.ink, M.inkTop, INK],
  bone: [M.bone, M.boneTop, DARK],
  volt: [M.volt, M.voltTop, DARK],
};

// ── Studio: renderer, camera, lights, shadow catcher ─────────────
export function createStudio(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // plastics get a dim studio so the key light does the shaping; metals get
  // their own brighter copy so they still read as chrome
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  METALS.forEach((m) => {
    m.envMap = env;
    m.envMapIntensity = 1.15;
  });

  const camera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000);
  camera.position.z = 800;

  scene.add(new HemisphereLight('#ffffff', '#08080a', 0.18));

  // key: warm-white from the upper left, casting the shadows
  const key = new DirectionalLight('#fff8ef', 3.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 1024);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 1.2;
  // rim: cool light from behind-right that traces the silhouettes
  const rim = new DirectionalLight('#dfe8ff', 2.2);
  // bounce: a faint volt fill from below, picking out the undersides
  const bounce = new DirectionalLight('#d9ff6a', 0.5);
  scene.add(key, key.target, rim, rim.target, bounce, bounce.target);

  // Invisible plane behind the objects that only shows their shadows,
  // so they fall softly across the wordmark
  const catcher = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.42 }));
  catcher.receiveShadow = true;
  scene.add(catcher);

  function resize(W, H) {
    renderer.setSize(W, H, false);
    Object.assign(camera, { left: 0, right: W, top: 0, bottom: -H });
    camera.updateProjectionMatrix();
    const cx = W / 2;
    const cy = -H / 2;
    catcher.scale.set(W * 1.6, H * 1.6, 1);
    catcher.position.set(cx, cy, -45);
    key.target.position.set(cx, cy, 0);
    key.position.set(cx - 950, cy + 720, 560);
    rim.target.position.set(cx, cy, 0);
    rim.position.set(cx + 900, cy + 500, -700);
    bounce.target.position.set(cx, cy, 0);
    bounce.position.set(cx - 600, cy - 900, 400);
    const sc = key.shadow.camera;
    Object.assign(sc, { left: -W * 0.8, right: W * 0.8, top: H * 1.2, bottom: -H * 1.2, near: 10, far: 4000 });
    sc.updateProjectionMatrix();
  }

  return { renderer, scene, camera, resize, render: () => renderer.render(scene, camera) };
}

// ── Helpers ─────────────────────────────────────────────────────
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// A flat printed layer (legends, silkscreen) that sits just above a surface
function decal(w, h, draw, res = 2) {
  const map = canvasTex(Math.round(w * res), Math.round(h * res), draw);
  return new Mesh(new PlaneGeometry(w, h), new MeshStandardMaterial({ map, transparent: true, roughness: 0.6, depthWrite: false }));
}

function label(text, color, { size = 0.42, weight = 600, family = '"Geist Variable", sans-serif', track = -0.04 } = {}) {
  return (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let px = Math.round(h * size);
    const set = () => {
      ctx.font = `${weight} ${px}px ${family}`;
      ctx.letterSpacing = `${px * track}px`;
    };
    set();
    // shrink long labels to fit their face
    const fit = ctx.measureText(text).width;
    if (fit > w * 0.86) {
      px = Math.floor((px * w * 0.86) / fit);
      set();
    }
    ctx.fillText(text, w / 2, h / 2 + px * 0.04);
  };
}

const rect = (w, h, chamfer = 2) => ({ type: 'rect', w, h, chamfer });
const circle = (r) => ({ type: 'circle', r });

function extrudeRing(R, r, depth, mat, bevel = 0.08) {
  const s = new Shape();
  s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const h = new Path();
  h.absarc(0, 0, r, 0, Math.PI * 2, true);
  s.holes.push(h);
  const geo = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * bevel,
    bevelSize: depth * bevel,
    bevelSegments: 3,
    curveSegments: 48,
  });
  geo.center();
  return new Mesh(geo, mat);
}

// Wraps a group so its physics box is centred on the group's origin
function centred(g, dy) {
  g.position.y = dy;
  const outer = new Group();
  outer.add(g);
  return outer;
}

// ── Objects ─────────────────────────────────────────────────────
function keycap(u, skin, legend) {
  const [base, top, ink] = SKIN[skin];
  const s = 84 * u;
  const d = s * 0.46;
  const g = new Group();
  g.add(new Mesh(new RoundedBoxGeometry(s, s, d, 5, s * 0.15), base));
  const t = new Mesh(new RoundedBoxGeometry(s * 0.76, s * 0.72, d * 0.5, 5, s * 0.14), top);
  t.position.set(0, s * 0.05, d * 0.42);
  const l = decal(s * 0.66, s * 0.66, label(legend, ink, { size: legend.length > 2 ? 0.3 : 0.42 }), 3);
  l.position.set(0, s * 0.05, d * 0.68 + 0.8);
  g.add(t, l);
  return { group: g, shape: rect(s, s, s * 0.15) };
}

function gearShape(R, teeth, toothDepth) {
  const s = new Shape();
  const r = R - toothDepth;
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [
      [r, a],
      [R, a + step * 0.16],
      [R, a + step * 0.44],
      [r, a + step * 0.6],
    ].forEach(([rad, ang], j) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (i === 0 && j === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  const hub = new Path();
  hub.absarc(0, 0, R * 0.2, 0, Math.PI * 2, true);
  s.holes.push(hub);
  const n = teeth > 11 ? 5 : 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const h = new Path();
    h.absarc(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, R * 0.14, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  return s;
}

function gear(u, mat, R, teeth) {
  R *= u;
  const geo = new ExtrudeGeometry(gearShape(R, teeth, R * 0.17), {
    depth: R * 0.3,
    bevelEnabled: true,
    bevelThickness: R * 0.05,
    bevelSize: R * 0.035,
    bevelSegments: 3,
    curveSegments: 28,
  });
  geo.center();
  const g = new Group();
  g.add(new Mesh(geo, mat));
  return { group: g, shape: circle(R * 0.9) };
}

function hexNut(u, mat, R) {
  R *= u;
  const s = new Shape();
  for (let i = 0; i < 6; i++) {
    // matches Matter.Bodies.polygon's vertex order (first vertex at 30°)
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    if (i === 0) s.moveTo(Math.cos(a) * R, Math.sin(a) * R);
    else s.lineTo(Math.cos(a) * R, Math.sin(a) * R);
  }
  s.closePath();
  const hole = new Path();
  hole.absarc(0, 0, R * 0.48, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new ExtrudeGeometry(s, {
    depth: R * 0.7,
    bevelEnabled: true,
    bevelThickness: R * 0.12,
    bevelSize: R * 0.08,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geo.center();
  const g = new Group();
  g.add(new Mesh(geo, mat));
  return { group: g, shape: { type: 'poly', sides: 6, r: R } };
}

function chip(u) {
  const s = 100 * u;
  const g = new Group();
  g.add(new Mesh(new RoundedBoxGeometry(s, s, s * 0.16, 3, s * 0.05), M.ink));
  const pinGeo = new BoxGeometry(s * 0.05, s * 0.11, s * 0.045);
  const n = 6;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < n; i++) {
      const p = new Mesh(pinGeo, M.brass);
      const t = ((i + 0.5) / n - 0.5) * s * 0.78;
      const o = s / 2 + s * 0.045;
      if (side < 2) p.position.set(t, side ? -o : o, -s * 0.02);
      else {
        p.position.set(side === 2 ? o : -o, t, -s * 0.02);
        p.rotation.z = Math.PI / 2;
      }
      g.add(p);
    }
  }
  const face = decal(
    s * 0.94,
    s * 0.94,
    (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(237,236,231,0.16)';
      ctx.lineWidth = w * 0.012;
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84, w * 0.05);
      ctx.stroke();
      label('AI', INK, { size: 0.36 })(ctx, w, h * 0.86);
      ctx.font = `500 ${Math.round(h * 0.065)}px "Geist Mono Variable", monospace`;
      ctx.letterSpacing = `${h * 0.008}px`;
      ctx.fillStyle = 'rgba(237,236,231,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('NPU · 2026', w / 2, h * 0.76);
      ctx.fillStyle = VOLT;
      ctx.beginPath();
      ctx.arc(w * 0.19, h * 0.19, w * 0.03, 0, Math.PI * 2);
      ctx.fill();
    },
    4
  );
  face.position.z = s * 0.08 + 0.8;
  g.add(face);
  return { group: g, shape: rect(s * 1.2, s * 1.2, s * 0.08) };
}

// A small dev board: traces, a processor, header pins and a USB-C port
function board(u) {
  const w = 176 * u;
  const h = 108 * u;
  const d = 6 * u;
  const g = new Group();
  g.add(new Mesh(new RoundedBoxGeometry(w, h, d, 2, 3 * u), M.pcb));
  const art = decal(
    w,
    h,
    (ctx, W, H) => {
      ctx.strokeStyle = 'rgba(200,165,94,0.55)';
      ctx.lineWidth = W * 0.004;
      for (let i = 0; i < 9; i++) {
        const y = H * (0.3 + i * 0.05);
        ctx.beginPath();
        ctx.moveTo(W * 0.08, y);
        ctx.lineTo(W * 0.28, y);
        ctx.lineTo(W * 0.34, y - H * 0.06);
        ctx.lineTo(W * 0.42, y - H * 0.06);
        ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const x = W * (0.62 + i * 0.04);
        ctx.beginPath();
        ctx.moveTo(x, H * 0.72);
        ctx.lineTo(x, H * 0.58);
        ctx.lineTo(x - W * 0.04, H * 0.52);
        ctx.stroke();
      }
      [[0.05, 0.1], [0.95, 0.1], [0.05, 0.9], [0.95, 0.9]].forEach(([x, y]) => {
        ctx.fillStyle = 'rgba(200,165,94,0.85)';
        ctx.beginPath();
        ctx.arc(W * x, H * y, W * 0.022, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#050606';
        ctx.beginPath();
        ctx.arc(W * x, H * y, W * 0.012, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(237,236,231,0.7)';
      ctx.font = `600 ${Math.round(H * 0.075)}px "Geist Mono Variable", monospace`;
      ctx.letterSpacing = `${H * 0.01}px`;
      ctx.textAlign = 'left';
      ctx.fillText('ASM-EDGE v2', W * 0.6, H * 0.88);
    },
    3
  );
  art.position.z = d / 2 + 0.4;
  g.add(art);
  const cpu = new Mesh(new RoundedBoxGeometry(w * 0.26, w * 0.26, 5 * u, 2, 1.5 * u), M.ink);
  cpu.position.set(-w * 0.06, h * 0.02, d / 2 + 2.5 * u);
  const cpuMark = decal(w * 0.2, w * 0.2, label('M7', 'rgba(237,236,231,0.75)', { size: 0.34 }), 3);
  cpuMark.position.set(-w * 0.06, h * 0.02, d / 2 + 5.2 * u);
  const header = new Mesh(new BoxGeometry(w * 0.72, h * 0.1, 8 * u), M.plastic);
  header.position.set(w * 0.08, h * 0.38, d / 2 + 4 * u);
  g.add(cpu, cpuMark, header);
  const pinGeo = new BoxGeometry(2.4 * u, 2.4 * u, 6 * u);
  for (let i = 0; i < 12; i++) {
    const p = new Mesh(pinGeo, M.brass);
    p.position.set(w * 0.08 - w * 0.33 + i * w * 0.06, h * 0.38, d / 2 + 10 * u);
    g.add(p);
  }
  const usb = new Mesh(new RoundedBoxGeometry(18 * u, 9 * u, 7 * u, 2, 3 * u), M.chrome);
  usb.position.set(-w / 2 + 4 * u, -h * 0.22, d / 2 + 3 * u);
  const status = new Mesh(new BoxGeometry(5 * u, 3 * u, 2 * u), M.glow);
  status.position.set(w * 0.3, -h * 0.1, d / 2 + 1 * u);
  const smd = new BoxGeometry(6 * u, 3 * u, 2.5 * u);
  [[0.2, 0.05], [0.26, 0.05], [0.2, -0.05], [0.12, -0.25], [0.18, -0.25]].forEach(([x, y]) => {
    const c = new Mesh(smd, M.beige);
    c.position.set(w * x, h * y, d / 2 + 1.2 * u);
    g.add(c);
  });
  g.add(usb, status);
  return { group: g, shape: rect(w, h, 3 * u) };
}

function resistor(u) {
  const r = 8 * u;
  const len = 34 * u;
  const lead = 40 * u;
  const g = new Group();
  const body = new CapsuleGeometry(r, len, 8, 24);
  body.rotateZ(Math.PI / 2);
  g.add(new Mesh(body, M.beige));
  const band = new CylinderGeometry(r * 1.06, r * 1.06, r * 0.55, 24);
  band.rotateZ(Math.PI / 2);
  [
    ['#5a3421', -0.32, 0],
    ['#111114', -0.12, 0],
    ['#e2701f', 0.08, 0],
    ['#c8a55e', 0.34, 1],
  ].forEach(([c, x, metal]) => {
    const m = new Mesh(band, new MeshStandardMaterial({ color: c, roughness: 0.45, metalness: metal }));
    m.position.x = x * len;
    g.add(m);
  });
  const wire = new CylinderGeometry(1.4 * u, 1.4 * u, lead, 8);
  wire.rotateZ(Math.PI / 2);
  [-1, 1].forEach((sgn) => {
    const m = new Mesh(wire, M.chrome);
    m.position.x = sgn * (len / 2 + r * 0.6 + lead / 2);
    g.add(m);
  });
  return { group: g, shape: rect(len + r * 1.2 + lead * 2, r * 2.2, r) };
}

function led(u) {
  const r = 10 * u;
  const g = new Group();
  // lathe profile: flange, straight body, domed top
  const pts = [new Vector2(0, -r * 0.3), new Vector2(r * 1.2, -r * 0.3), new Vector2(r * 1.2, 0), new Vector2(r, 0), new Vector2(r, r * 1.3)];
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    pts.push(new Vector2(Math.cos(a) * r, r * 1.3 + Math.sin(a) * r));
  }
  g.add(new Mesh(new LatheGeometry(pts, 32), M.glow));
  const leg = (h) => new CylinderGeometry(1.3 * u, 1.3 * u, h, 8);
  const a = new Mesh(leg(r * 3.4), M.chrome);
  a.position.set(-r * 0.45, -r * 0.3 - r * 1.7, 0);
  const b = new Mesh(leg(r * 2.8), M.chrome);
  b.position.set(r * 0.45, -r * 0.3 - r * 1.4, 0);
  g.add(a, b);
  // content spans y ∈ [-3.7r, 2.3r]; centre it
  return { group: centred(g, r * 0.7), shape: rect(r * 2.4, r * 6, r * 0.6) };
}

function capacitor(u) {
  const r = 16 * u;
  const h = 44 * u;
  const g = new Group();
  g.add(new Mesh(new CylinderGeometry(r, r, h, 40), M.ink));
  const stripe = new Mesh(new BoxGeometry(r * 0.5, h * 0.96, 2 * u), M.steel);
  stripe.position.set(r * 0.35, 0, r * 0.9);
  const top = new Mesh(new CylinderGeometry(r * 0.96, r * 0.96, 2 * u, 40), M.chrome);
  top.position.y = h / 2 + 1 * u;
  const mark = decal(h * 0.62, r * 0.9, label('470µF', 'rgba(237,236,231,0.85)', { size: 0.5, weight: 500, family: '"Geist Mono Variable", monospace', track: 0 }), 4);
  mark.rotation.z = Math.PI / 2;
  mark.position.set(-r * 0.3, 0, r + 0.6);
  const leg = new CylinderGeometry(1.3 * u, 1.3 * u, 14 * u, 8);
  const l1 = new Mesh(leg, M.chrome);
  l1.position.set(-r * 0.4, -h / 2 - 7 * u, 0);
  const l2 = new Mesh(leg, M.chrome);
  l2.position.set(r * 0.4, -h / 2 - 7 * u, 0);
  g.add(stripe, top, mark, l1, l2);
  return { group: centred(g, 7 * u), shape: rect(r * 2, h + 16 * u, r * 0.4) };
}

function battery(u) {
  const r = 17 * u;
  const len = 84 * u;
  const g = new Group();
  const geo = new CylinderGeometry(r, r, len, 48);
  geo.rotateZ(Math.PI / 2);
  g.add(new Mesh(geo, M.volt));
  const band = new CylinderGeometry(r * 1.01, r * 1.01, len * 0.26, 48);
  band.rotateZ(Math.PI / 2);
  const b = new Mesh(band, M.ink);
  b.position.x = -len * 0.24;
  const capGeo = new CylinderGeometry(r * 0.98, r * 0.98, 3 * u, 48);
  capGeo.rotateZ(Math.PI / 2);
  const c1 = new Mesh(capGeo, M.chrome);
  c1.position.x = len / 2 + 1.5 * u;
  const c2 = new Mesh(capGeo, M.chrome);
  c2.position.x = -len / 2 - 1.5 * u;
  const nubGeo = new CylinderGeometry(r * 0.4, r * 0.4, 5 * u, 24);
  nubGeo.rotateZ(Math.PI / 2);
  const nub = new Mesh(nubGeo, M.chrome);
  nub.position.x = len / 2 + 5 * u;
  const txt = decal(len * 0.52, r * 1.1, label('3.7V 18650', DARK, { size: 0.36, weight: 600, family: '"Geist Mono Variable", monospace', track: 0.02 }), 4);
  txt.position.set(len * 0.14, 0, r + 0.6);
  g.add(b, c1, c2, nub, txt);
  return { group: g, shape: rect(len + 14 * u, r * 2, r * 0.8) };
}

function bolt(u, mat = M.chrome) {
  const g = new Group();
  const headR = 15 * u;
  const headW = 12 * u;
  const headGeo = new CylinderGeometry(headR, headR, headW, 6);
  headGeo.rotateZ(Math.PI / 2);
  const head = new Mesh(headGeo, mat);
  const shaftLen = 58 * u;
  const rr = 7.5 * u;
  // threaded shaft from a zig-zag lathe profile
  const pts = [new Vector2(0, 0)];
  const turns = 14;
  for (let i = 0; i <= turns * 2; i++) pts.push(new Vector2(i % 2 ? rr * 0.82 : rr, (i / (turns * 2)) * shaftLen));
  pts.push(new Vector2(0, shaftLen));
  const shaftGeo = new LatheGeometry(pts, 24);
  shaftGeo.rotateZ(-Math.PI / 2);
  const shaft = new Mesh(shaftGeo, mat);
  shaft.position.x = headW / 2;
  g.add(head, shaft);
  // content spans x ∈ [-headW/2, headW/2 + shaftLen]; centre it
  g.position.x = -shaftLen / 2;
  const outer = new Group();
  outer.add(g);
  return { group: outer, shape: rect(shaftLen + headW, headR * 2, 3 * u) };
}

function servo(u) {
  const g = new Group();
  const w = 58 * u;
  const h = 30 * u;
  g.add(new Mesh(new RoundedBoxGeometry(w, h, 24 * u, 3, 3 * u), M.ink));
  const ears = new Mesh(new RoundedBoxGeometry(w * 1.38, h * 0.2, 4 * u, 2, 1.5 * u), M.ink);
  ears.position.set(0, -h * 0.05, 0);
  const hubGeo = new CylinderGeometry(6 * u, 6 * u, 6 * u, 24);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new Mesh(hubGeo, M.chrome);
  hub.position.set(-w * 0.22, h * 0.02, 15 * u);
  const arm = new Mesh(new RoundedBoxGeometry(w * 0.62, 7 * u, 3 * u, 2, 3.2 * u), M.volt);
  arm.position.set(-w * 0.22, h * 0.02, 13 * u);
  arm.rotation.z = 0.35;
  const txt = decal(w * 0.42, h * 0.3, label('SG90', 'rgba(237,236,231,0.75)', { size: 0.6, weight: 600, family: '"Geist Mono Variable", monospace', track: 0.04 }), 4);
  txt.position.set(w * 0.2, -h * 0.18, 12 * u + 0.6);
  g.add(ears, hub, arm, txt);
  return { group: g, shape: rect(w * 1.38, h, 3 * u) };
}

function propeller(u, mat) {
  const L = 84 * u;
  const s = new Shape();
  s.moveTo(0, -5 * u);
  s.bezierCurveTo(L * 0.3, -12 * u, L * 0.8, -9 * u, L, -2 * u);
  s.bezierCurveTo(L * 1.02, 2 * u, L * 0.9, 5 * u, L * 0.7, 6 * u);
  s.bezierCurveTo(L * 0.4, 7 * u, L * 0.15, 6 * u, 0, 5 * u);
  s.bezierCurveTo(-L * 0.15, 6 * u, -L * 0.4, 7 * u, -L * 0.7, 6 * u);
  s.bezierCurveTo(-L * 0.9, 5 * u, -L * 1.02, 2 * u, -L, -2 * u);
  s.bezierCurveTo(-L * 0.8, -9 * u, -L * 0.3, -12 * u, 0, -5 * u);
  const geo = new ExtrudeGeometry(s, { depth: 3 * u, bevelEnabled: true, bevelThickness: 1.2 * u, bevelSize: 1 * u, bevelSegments: 2, curveSegments: 24 });
  geo.center();
  const g = new Group();
  g.add(new Mesh(geo, mat));
  const hubGeo = new CylinderGeometry(8 * u, 8 * u, 10 * u, 24);
  hubGeo.rotateX(Math.PI / 2);
  g.add(new Mesh(hubGeo, M.chrome));
  return { group: g, shape: rect(L * 2, 22 * u, 9 * u) };
}

function wheel(u) {
  const R = 40 * u;
  const g = new Group();
  g.add(new Mesh(new TorusGeometry(R * 0.78, R * 0.24, 20, 64), M.rubber));
  const tread = new BoxGeometry(R * 0.14, R * 0.12, R * 0.4);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const m = new Mesh(tread, M.rubber);
    m.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    m.rotation.z = a;
    g.add(m);
  }
  const disc = new Shape();
  disc.absarc(0, 0, R * 0.6, 0, Math.PI * 2, false);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const h = new Path();
    h.absarc(Math.cos(a) * R * 0.34, Math.sin(a) * R * 0.34, R * 0.13, 0, Math.PI * 2, true);
    disc.holes.push(h);
  }
  const rimGeo = new ExtrudeGeometry(disc, { depth: R * 0.3, bevelEnabled: true, bevelThickness: R * 0.04, bevelSize: R * 0.03, bevelSegments: 2, curveSegments: 40 });
  rimGeo.center();
  g.add(new Mesh(rimGeo, M.volt));
  const hubGeo = new CylinderGeometry(R * 0.12, R * 0.12, R * 0.4, 20);
  hubGeo.rotateX(Math.PI / 2);
  g.add(new Mesh(hubGeo, M.chrome));
  return { group: g, shape: circle(R * 1.06) };
}

function bearing(u) {
  const R = 36 * u;
  const d = 14 * u;
  const g = new Group();
  g.add(extrudeRing(R, R * 0.8, d, M.chrome, 0.1));
  g.add(extrudeRing(R * 0.5, R * 0.3, d, M.steel, 0.1));
  const seal = extrudeRing(R * 0.8, R * 0.5, d * 0.5, M.ink, 0.05);
  seal.position.z = -d * 0.1;
  g.add(seal);
  const ballGeo = new SphereGeometry(R * 0.12, 16, 12);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const b = new Mesh(ballGeo, M.chrome);
    b.position.set(Math.cos(a) * R * 0.65, Math.sin(a) * R * 0.65, d * 0.12);
    g.add(b);
  }
  return { group: g, shape: circle(R) };
}

function coin(u, text, skin) {
  const r = 42 * u;
  const t = r * 0.32;
  // satin face: a glossy flat face would mirror the key light straight back
  const faceMat =
    skin === 'ink'
      ? new MeshStandardMaterial({ color: '#131317', roughness: 0.7 })
      : new MeshPhysicalMaterial({ color: '#c4f21f', roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5 });
  const geo = new CylinderGeometry(r, r, t, 64);
  geo.rotateX(Math.PI / 2);
  const body = new Mesh(geo, [M.chrome, faceMat, faceMat]);
  const face = decal(
    r * 2,
    r * 2,
    (ctx, w, h) => {
      ctx.strokeStyle = skin === 'ink' ? 'rgba(237,236,231,0.2)' : 'rgba(0,0,0,0.22)';
      ctx.lineWidth = w * 0.02;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      label(text, skin === 'ink' ? VOLT : DARK, { size: text.length > 2 ? 0.3 : 0.4 })(ctx, w, h);
    },
    3
  );
  face.position.z = t / 2 + 0.6;
  const g = new Group();
  g.add(body, face);
  return { group: g, shape: circle(r) };
}

function ball(u, r) {
  r *= u;
  const g = new Group();
  g.add(new Mesh(new SphereGeometry(r, 48, 32), M.chrome));
  return { group: g, shape: circle(r) };
}

// ── The line-up ─────────────────────────────────────────────────
export function makeObjects(u, compact) {
  const all = [
    () => keycap(u, 'volt', 'AI'),
    () => board(u),
    () => gear(u, M.chrome, 62, 14),
    () => keycap(u, 'ink', '⌘'),
    () => resistor(u),
    () => chip(u),
    () => coin(u, 'Py', 'ink'),
    () => hexNut(u, M.chrome, 32),
    () => battery(u),
    () => keycap(u, 'ink', '</>'),
    () => led(u),
    () => wheel(u),
    () => gear(u, M.volt, 44, 10),
    () => bolt(u),
    () => servo(u),
    () => coin(u, 'ROS', 'volt'),
    () => keycap(u, 'ink', 'esc'),
    () => bearing(u),
    () => propeller(u, M.ink),
    () => capacitor(u),
    () => gear(u, M.ink, 52, 12),
    () => keycap(u, 'bone', '{ }'),
    () => led(u),
    () => hexNut(u, M.brass, 26),
    () => coin(u, 'C++', 'ink'),
    () => resistor(u),
    () => ball(u, 26),
    () => bolt(u, M.steel),
    () => gear(u, M.brass, 30, 9),
    () => keycap(u, 'ink', 'fn'),
  ];
  const pick = compact ? [0, 1, 2, 3, 5, 6, 8, 10, 11, 12, 13, 14, 17, 18] : all.map((_, i) => i);
  return pick.map((i) => all[i]());
}

export { Group };

export function disposeObject(group) {
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (SHARED.has(m)) return;
      m.map?.dispose();
      m.dispose();
    });
  });
}
