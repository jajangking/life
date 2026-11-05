import * as THREE from 'three';
import { palette as P, material, seededRandom } from './kit.js';

export function createProps(kit, dynamic, state) {
  const { box, cyl, ball, rod, ring, slab, sign, mesh, root } = kit;
  const random = seededRandom(137);
  const leaves = ['#7c9657', '#91a56a', '#698953', '#a4b774', '#839e60'];
  const glow = state.glowMaterial;

  function plant(x, y, z, scale = 1, parent = root) {
    cyl(0.17 * scale, 0.12 * scale, 0.25 * scale, x, y + 0.125 * scale, z, P.terracotta, parent, 10);
    cyl(0.19 * scale, 0.18 * scale, 0.06 * scale, x, y + 0.25 * scale, z, '#cc8e68', parent, 10);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const b = ball(0.17 * scale, x + Math.cos(a) * 0.10 * scale, y + 0.41 * scale, z + Math.sin(a) * 0.10 * scale, leaves[i], parent);
      b.scale.set(0.7, 1.35, 0.7);
      b.rotation.z = Math.cos(a) * 0.5;
    }
  }

  function tree(x, z, scale = 1, kind = 'round') {
    const g = new THREE.Group(); root.add(g); g.position.set(x, 0.15, z); g.scale.setScalar(scale);
    cyl(0.12, 0.22, 1.9, 0, 0.95, 0, '#8c7552', g, 9);
    rod([0, 1.2, 0], [-0.55, 2.1, 0], 0.07, '#8c7552', g);
    rod([0, 1.3, 0], [0.45, 2.25, 0.3], 0.08, '#8c7552', g);
    if (kind === 'tall') {
      for (let i = 0; i < 4; i++) {
        const b = ball(0.7 - i * 0.08, 0, 1.5 + i * 0.55, 0, leaves[i], g, 1);
        b.scale.set(0.8, 1.2, 0.8);
      }
    } else {
      const crowns = [[-0.55, 2.45, 0.1, 0.95], [0.5, 2.65, 0.2, 1.06], [0, 3.12, -0.2, 1.08], [0.1, 2.4, -0.65, 0.85], [-0.55, 2.95, -0.25, 0.7]];
      crowns.forEach(([a, b, c, r], i) => {
        const crown = ball(r, a, b, c, leaves[i], g, 1);
        crown.rotation.set(random(), random(), random());
      });
    }
    // Little soil bed and a protective tree grate.
    cyl(0.52, 0.52, 0.035, 0, 0.02, 0, '#8c9566', g, 14);
    for (let i = 0; i < 3; i++) ball(0.18, Math.cos(i * 2) * 0.38, 0.14, Math.sin(i * 2) * 0.38, leaves[i], g);
    return g;
  }

  function flowers(x, z, length = 1.5, direction = 'x') {
    const w = direction === 'x' ? length : 0.5;
    const d = direction === 'x' ? 0.5 : length;
    slab(w + 0.14, d + 0.14, 0.16, 0.1, x, 0.25, z, '#c0a780');
    box(w, 0.06, d, x, 0.34, z, '#7e8b5b');
    const colors = ['#e7b75c', '#d9866d', '#e5c8a1', '#d7a0a1'];
    for (let i = 0; i < Math.round(length * 7); i++) {
      const px = x + (random() - 0.5) * w * 0.88, pz = z + (random() - 0.5) * d * 0.85;
      cyl(0.015, 0.015, 0.14, px, 0.4, pz, P.green, root, 5);
      ball(0.085, px, 0.51 + random() * 0.06, pz, colors[i % colors.length], root, 0);
    }
  }

  function bench(x, z, angle = 0, parent = root) {
    const g = new THREE.Group(); parent.add(g); g.position.set(x, 0.18, z); g.rotation.y = angle;
    for (let i = 0; i < 4; i++) box(1.55, 0.065, 0.105, 0, 0.43, -0.17 + i * 0.12, P.woodLight, g);
    for (let i = 0; i < 3; i++) box(1.55, 0.10, 0.065, 0, 0.68 + i * 0.13, -0.25, P.woodLight, g);
    [-0.55, 0.55].forEach((a) => {
      box(0.07, 0.48, 0.5, a, 0.22, 0, P.metal, g);
      box(0.06, 0.72, 0.055, a, 0.55, -0.28, P.metal, g);
      box(0.06, 0.05, 0.5, a, 0.65, 0, P.metal, g);
    });
    return g;
  }

  function fence(x, z, length, angle = 0, color = '#e7dfc6', height = 0.65) {
    const g = new THREE.Group(); root.add(g); g.position.set(x, 0.18, z); g.rotation.y = angle;
    const n = Math.ceil(length / 0.3);
    for (let i = 0; i <= n; i++) {
      box(0.09, height, 0.09, -length / 2 + i / n * length, height / 2, 0, color, g);
      const tip = cyl(0, 0.075, 0.08, -length / 2 + i / n * length, height + 0.04, 0, color, g, 4);
      tip.rotation.y = Math.PI / 4;
    }
    [0.2, height * 0.75].forEach((h) => box(length, 0.075, 0.065, 0, h, 0.015, color, g));
  }

  function lamp(x, z, angle = 0) {
    const g = new THREE.Group(); root.add(g); g.position.set(x, 0.15, z); g.rotation.y = angle;
    cyl(0.12, 0.18, 0.16, 0, 0.08, 0, P.metal, g);
    cyl(0.055, 0.09, 2.9, 0, 1.5, 0, P.metal, g, 10);
    rod([0, 2.9, 0], [0.55, 3.06, 0], 0.05, P.metal, g);
    box(0.42, 0.08, 0.22, 0.55, 3.04, 0, P.metal, g);
    box(0.33, 0.045, 0.16, 0.55, 2.99, 0, glow, g);
    // A handful of real lights give night scenes pools of warm light.
    if (state.lights.length < 8) {
      const light = new THREE.PointLight('#ffcd80', 0, 6, 2);
      light.position.set(x + Math.cos(angle) * 0.55, 2.8, z - Math.sin(angle) * 0.55);
      dynamic.add(light); state.lights.push(light);
    }
  }

  function umbrella(x, z, color = '#d8aa61') {
    cyl(0.032, 0.045, 2.35, x, 1.36, z, P.wood);
    const canopy = cyl(0.04, 0.96, 0.48, x, 2.48, z, color, root, 8);
    canopy.rotation.y = Math.PI / 8;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + Math.PI / 8;
      rod([x, 2.72, z], [x + Math.cos(a) * 0.96, 2.24, z + Math.sin(a) * 0.96], 0.014, '#ead5ab');
    }
    ball(0.055, x, 2.75, z, P.wood);
  }

  function table(x, z, withUmbrella = false, color) {
    cyl(0.48, 0.48, 0.08, x, 0.92, z, P.woodLight);
    cyl(0.055, 0.07, 0.72, x, 0.52, z, P.metal);
    cyl(0.25, 0.25, 0.04, x, 0.19, z, P.metal);
    for (const a of [0.4, 2.7, 4.6]) {
      const cx = x + Math.cos(a) * 0.76, cz = z + Math.sin(a) * 0.76;
      const g = new THREE.Group(); root.add(g); g.position.set(cx, 0.18, cz); g.rotation.y = -a - Math.PI / 2;
      box(0.38, 0.055, 0.38, 0, 0.45, 0, P.woodLight, g);
      [-0.14, 0.14].forEach((v) => {
        box(0.035, 0.45, 0.035, v, 0.23, 0.13, P.metal, g);
        box(0.035, 0.78, 0.035, v, 0.4, -0.14, P.metal, g);
      });
      box(0.37, 0.22, 0.05, 0, 0.72, -0.14, P.woodLight, g);
    }
    // Cups, saucers, and a tiny succulent are visible when zoomed in.
    [-0.23, 0.23].forEach((offset) => {
      cyl(0.10, 0.10, 0.015, x + offset, 0.975, z, P.white);
      cyl(0.06, 0.045, 0.10, x + offset, 1.03, z, P.white);
      cyl(0.047, 0.047, 0.007, x + offset, 1.085, z, '#645340');
    });
    if (withUmbrella) umbrella(x, z, color);
  }

  function bicycle(x, z, angle = 0) {
    const g = new THREE.Group(); root.add(g); g.position.set(x, 0.2, z); g.rotation.y = angle;
    [-0.48, 0.48].forEach((v) => {
      const wheel = mesh(new THREE.TorusGeometry(0.29, 0.035, 5, 16), P.dark, g);
      wheel.position.set(v, 0.3, 0);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI;
        rod([v + Math.cos(a) * 0.27, 0.3 + Math.sin(a) * 0.27, 0], [v - Math.cos(a) * 0.27, 0.3 - Math.sin(a) * 0.27, 0], 0.007, '#bbc5b5', g);
      }
    });
    [[[-0.48, 0.3, 0], [-0.17, 0.73, 0]], [[-0.17, 0.73, 0], [0.1, 0.3, 0]], [[0.1, 0.3, 0], [-0.48, 0.3, 0]], [[-0.17, 0.73, 0], [0.3, 0.73, 0]], [[0.3, 0.73, 0], [0.1, 0.3, 0]], [[0.3, 0.73, 0], [0.48, 0.3, 0]]].forEach(([a, b]) => rod(a, b, 0.028, '#d6a15a', g));
    rod([0.3, 0.73, 0], [0.34, 0.93, 0], 0.023, P.metal, g);
    rod([0.34, 0.93, -0.17], [0.34, 0.93, 0.17], 0.024, P.metal, g);
    box(0.25, 0.06, 0.15, -0.18, 0.82, 0, P.dark, g);
  }

  function bin(x, z) {
    cyl(0.22, 0.2, 0.65, x, 0.5, z, P.green, root, 10);
    cyl(0.25, 0.25, 0.08, x, 0.86, z, '#638167', root, 10);
    box(0.13, 0.16, 0.03, x, 0.6, z + 0.22, '#e7dfbd');
  }

  function laundry(x, y, z, length = 2.2, parent = root) {
    rod([x - length / 2, y - 0.9, z], [x - length / 2, y + 0.25, z], 0.025, P.metal, parent);
    rod([x + length / 2, y - 0.9, z], [x + length / 2, y + 0.25, z], 0.025, P.metal, parent);
    rod([x - length / 2, y + 0.15, z], [x + length / 2, y + 0.15, z], 0.01, '#766b54', parent);
    ['#f1debc', '#d39b77', '#789c9f', '#e8c477'].forEach((color, i) => {
      const px = x - length * 0.35 + i * length * 0.23;
      box(0.30, 0.40, 0.025, px, y - 0.08, z, color, parent);
      if (i % 2 === 0) box(0.49, 0.12, 0.03, px, y + 0.04, z, color, parent);
      box(0.025, 0.07, 0.045, px - 0.08, y + 0.13, z, P.wood, parent);
      box(0.025, 0.07, 0.045, px + 0.08, y + 0.13, z, P.wood, parent);
    });
  }

  function flag(x, z, height = 3.8) {
    cyl(0.026, 0.045, height, x, height / 2 + 0.2, z, '#d0d4bf');
    cyl(0.14, 0.20, 0.22, x, 0.27, z, P.curb);
    ball(0.055, x, height + 0.24, z, '#d3b66c');
    ['#cf6959', '#fff1d6'].forEach((color, i) => {
      const geometry = new THREE.PlaneGeometry(0.85, 0.27, 12, 2);
      geometry.translate(0.425, 0, 0);
      const m = new THREE.Mesh(geometry, material(color, { side: THREE.DoubleSide }));
      m.position.set(x, height + 0.05 - i * 0.27, z);
      m.castShadow = true; dynamic.add(m);
      state.flags.push({ mesh: m, original: geometry.attributes.position.array.slice() });
    });
  }

  function stringLights(a, b, count = 12) {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const f = i / 20;
      points.push(new THREE.Vector3().lerpVectors(new THREE.Vector3(...a), new THREE.Vector3(...b), f).add(new THREE.Vector3(0, -Math.sin(f * Math.PI) * 0.4, 0)));
    }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.012, 4, false), P.dark);
    for (let i = 1; i < count; i++) {
      const f = i / count;
      const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(...a), new THREE.Vector3(...b), f);
      p.y -= Math.sin(f * Math.PI) * 0.4 + 0.08;
      ball(0.065, p.x, p.y, p.z, glow, root, 1);
      box(0.035, 0.08, 0.035, p.x, p.y + 0.07, p.z, P.metal);
    }
  }

  function crate(x, z, color = '#dd9a57') {
    box(0.65, 0.05, 0.5, x, 0.24, z, P.woodLight);
    [-1, 1].forEach((s) => {
      for (let i = 0; i < 3; i++) {
        box(0.65, 0.065, 0.035, x, 0.3 + i * 0.095, z + s * 0.24, P.woodLight);
        box(0.035, 0.065, 0.5, x + s * 0.31, 0.3 + i * 0.095, z, P.woodLight);
      }
    });
    for (let i = 0; i < 10; i++) ball(0.09, x + (random() - 0.5) * 0.45, 0.49 + random() * 0.08, z + (random() - 0.5) * 0.32, color, root, 0);
  }

  return { plant, tree, flowers, bench, fence, lamp, table, bicycle, bin, laundry, flag, stringLights, crate };
}
