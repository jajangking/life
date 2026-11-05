import * as THREE from 'three';
import { palette as P, material } from './kit.js';

export function buildStreets(kit, props, state) {
  const { box, cyl, slab, ring, ball, sign, root } = kit;
  // The exposed layers make this feel like a tangible tabletop miniature.
  slab(35.9, 31.9, 0.3, 1.7, 0, -1.12, 0, '#9a9c7b');
  slab(36, 32, 1.0, 1.65, 0, -0.58, 0, '#b8b18e');
  slab(36.03, 32.03, 0.16, 1.65, 0, 0.0, 0, '#a8b584');
  slab(35.7, 31.7, 0.045, 1.6, 0, 0.09, 0, '#aebb8e');

  // Ring road and the two main streets.
  slab(33.6, 29.6, 0.035, 1.7, 0, 0.125, 0, P.road);
  slab(27.25, 23.25, 0.04, 0.6, 0, 0.155, 0, '#aab67f');
  box(32.2, 0.025, 3.6, 0, 0.185, 0, P.road);
  box(3.6, 0.025, 28.5, 0, 0.19, 0, P.road);

  for (const x of [-7.8, 7.8]) {
    for (const z of [-6.8, 6.8]) {
      slab(11.75, 9.9, 0.14, 0.34, x, 0.20, z, P.curb);
      slab(11.34, 9.49, 0.025, 0.2, x, 0.285, z, '#e5dcc4');
      // Subtle individual sidewalk joints.
      for (let i = 0; i < 12; i++) {
        const xx = x - 5.45 + i * 0.98;
        box(0.014, 0.006, 0.38, xx, 0.302, z - 4.7, '#cabea6');
        box(0.014, 0.006, 0.38, xx, 0.302, z + 4.7, '#cabea6');
      }
      for (let i = 0; i < 10; i++) {
        const zz = z - 4.4 + i * 0.98;
        box(0.38, 0.006, 0.014, x - 5.66, 0.302, zz, '#cabea6');
        box(0.38, 0.006, 0.014, x + 5.66, 0.302, zz, '#cabea6');
      }
    }
  }
  // Warm, slightly faded paint instead of stark white roads.
  for (let x = -15; x <= 15; x += 2.2) {
    if (Math.abs(x) > 4.6) box(0.85, 0.014, 0.055, x, 0.207, 0, '#e0cf96');
    for (const z of [-13.16, 13.16]) if (Math.abs(x) < 13.5) box(0.85, 0.014, 0.055, x, 0.157, z, '#d8d5bd');
  }
  for (let z = -12; z <= 12; z += 2.2) {
    if (Math.abs(z) > 4.6) box(0.055, 0.014, 0.85, 0, 0.212, z, '#e0cf96');
    for (const x of [-15.16, 15.16]) if (Math.abs(z) < 11.5) box(0.055, 0.014, 0.85, x, 0.157, z, '#d8d5bd');
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      box(0.18, 0.015, 2.88, side * 3.25 - 0.95 + i * 0.24, 0.21, 0, P.paint);
      box(2.88, 0.015, 0.18, 0, 0.217, side * 3.25 - 0.95 + i * 0.24, P.paint);
    }
    box(0.10, 0.015, 1.5, side * 4.48, 0.21, side * 0.84, P.paint);
    box(1.5, 0.015, 0.10, -side * 0.84, 0.215, side * 4.48, P.paint);
  }
  // Drains, manholes and curb inlets: the easy-to-miss little things.
  [[-2.4, -2.5], [2.4, 2.5], [-13.1, 11.55], [13.1, -11.55], [2.5, -11.5]].forEach(([x, z]) => {
    box(0.52, 0.025, 0.29, x, 0.31, z, '#59655b');
    for (let i = 0; i < 6; i++) box(0.035, 0.01, 0.26, x - 0.2 + i * 0.08, 0.33, z, '#96a18b');
  });
  [[9.5, 0.7], [0.7, -7.4], [-14.5, 5.0]].forEach(([x, z]) => {
    cyl(0.29, 0.29, 0.016, x, 0.215, z, '#596860', root, 24);
    ring(0.23, 0.01, x, 0.228, z, '#a0aa92');
    for (let i = 0; i < 3; i++) box(0.35, 0.01, 0.02, x, 0.23, z - 0.1 + i * 0.1, '#869580');
  });
  [[-2.15, -4.6, 0], [2.15, 4.6, Math.PI], [-11.7, -2.05, -Math.PI / 2], [11.7, 2.05, Math.PI / 2], [-12.7, 11.5, 0], [12.7, -11.5, Math.PI], [-13.1, -8, Math.PI], [13.1, 8, 0]].forEach(([x, z, angle]) => props.lamp(x, z, angle));

  // Two synchronized traffic-light phases.
  state.signals = [0, 1].map(() => ({
    red: material('#b96c54', { emissive: '#ed6f4d', emissiveIntensity: 0.1 }).clone(),
    amber: material('#b5a061', { emissive: '#efbc5d', emissiveIntensity: 0.1 }).clone(),
    green: material('#779e79', { emissive: '#98cf8d', emissiveIntensity: 0.1 }).clone(),
  }));
  [[-2.12, -2.12, 0, 0], [2.12, 2.12, Math.PI, 0], [2.12, -2.12, Math.PI / 2, 1], [-2.12, 2.12, -Math.PI / 2, 1]].forEach(([x, z, a, phase]) => {
    const g = new THREE.Group(); root.add(g); g.position.set(x, 0.29, z); g.rotation.y = a;
    cyl(0.038, 0.07, 2.05, 0, 1.025, 0, P.metal, g, 8);
    box(0.22, 0.67, 0.20, 0, 1.95, 0, '#3c5549', g);
    [['red', 2.15], ['amber', 1.96], ['green', 1.77]].forEach(([c, y]) => {
      const bulb = ball(0.065, 0, y, 0.11, state.signals[phase][c], g);
      bulb.scale.z = 0.4;
      box(0.17, 0.025, 0.14, 0, y + 0.08, 0.13, '#3c5549', g);
    });
  });
  // Tiny stones and grass on the model's edges.
  for (let i = 0; i < 37; i++) {
    const x = -15.7 + i * 0.86;
    if (Math.abs(x) < 1.7) continue;
    const rock = ball(0.09 + (i % 3) * 0.02, x, 0.18, 15.35, i % 2 ? '#bac29a' : '#d1ccb0', root, 0);
    rock.scale.set(1.3, 0.6, 0.8);
  }
  sign('K A M P U N G   M E N T A R I', 5.0, 0.32, 7.5, -0.51, 16.02, '#b8b18e', '#67775e', root, 67);
}
