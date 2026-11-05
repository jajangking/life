import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materialCache = new Map();
const geometryCache = new Map();
const UP = new THREE.Vector3(0, 1, 0);

export const palette = {
  road: '#64706d', roadEdge: '#586460', paint: '#e9e5cf',
  grass: '#a7b778', grassDark: '#819d68', path: '#e4d7ba', curb: '#efe7d5',
  cream: '#f3e5c9', yellow: '#dfbf77', peach: '#dcad88', sage: '#a4b6a0',
  blue: '#9db9bd', wood: '#966f4d', woodLight: '#be9665',
  roof: '#bc7154', roofLight: '#d38c63', roofDark: '#a45c46',
  green: '#496e53', leaf: '#7e9b58', dark: '#344e45', glass: '#4e7173',
  metal: '#465c55', terracotta: '#bd7655', white: '#fff4dc',
};

export function material(color, options = {}) {
  const key = `${color}:${JSON.stringify(options)}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...options }));
  }
  return materialCache.get(key);
}

function cached(key, make) {
  if (!geometryCache.has(key)) geometryCache.set(key, make());
  return geometryCache.get(key);
}

export function createKit(root) {
  const mesh = (geometry, color, parent = root, options = {}) => {
    const m = new THREE.Mesh(geometry, color?.isMaterial ? color : material(color, options));
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const box = (w, h, d, x, y, z, color, parent = root) => {
    const m = mesh(cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), color, parent);
    m.position.set(x, y, z);
    return m;
  };
  const cyl = (rt, rb, h, x, y, z, color, parent = root, sides = 16) => {
    const m = mesh(cached(`c${rt},${rb},${h},${sides}`, () => new THREE.CylinderGeometry(rt, rb, h, sides)), color, parent);
    m.position.set(x, y, z);
    return m;
  };
  const ball = (r, x, y, z, color, parent = root, detail = 1) => {
    const m = mesh(cached(`s${r},${detail}`, () => new THREE.IcosahedronGeometry(r, detail)), color, parent);
    m.position.set(x, y, z);
    return m;
  };
  const rod = (a, b, r, color, parent = root) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const m = cyl(r, r, delta.length(), 0, 0, 0, color, parent, 8);
    m.position.copy(start.add(end).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(UP, delta.normalize());
    return m;
  };
  const slab = (w, d, h, radius, x, y, z, color, parent = root) => {
    const key = `slab${w},${d},${h},${radius}`;
    const geometry = cached(key, () => {
      const shape = new THREE.Shape();
      const l = -w / 2, r = w / 2, t = -d / 2, b = d / 2, c = radius;
      shape.moveTo(l + c, t);
      shape.lineTo(r - c, t); shape.quadraticCurveTo(r, t, r, t + c);
      shape.lineTo(r, b - c); shape.quadraticCurveTo(r, b, r - c, b);
      shape.lineTo(l + c, b); shape.quadraticCurveTo(l, b, l, b - c);
      shape.lineTo(l, t + c); shape.quadraticCurveTo(l, t, l + c, t);
      const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 5, steps: 1 });
      g.rotateX(-Math.PI / 2);
      g.translate(0, -h / 2, 0);
      return g;
    });
    const m = mesh(geometry, color, parent);
    m.position.set(x, y, z);
    return m;
  };
  const ring = (radius, tube, x, y, z, color, parent = root) => {
    const m = mesh(cached(`r${radius},${tube}`, () => new THREE.TorusGeometry(radius, tube, 6, 48)), color, parent);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  };
  const sign = (text, w, h, x, y, z, background = '#315745', foreground = '#faf1da', parent = root, fontSize = 88) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.round(1024 * h / w);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = foreground;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px "DM Sans", sans-serif`;
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.23;
    lines.forEach((line, index) => ctx.fillText(line, 512, canvas.height / 2 + (index - (lines.length - 1) / 2) * lineHeight, 930));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
    const m = mesh(new THREE.PlaneGeometry(w, h), mat, parent);
    m.position.set(x, y, z);
    return m;
  };
  return { root, mesh, box, cyl, ball, rod, slab, ring, sign };
}

/** Thousands of little details, but only one draw call per static material. */
export function batchStatic(root) {
  root.updateMatrixWorld(true);
  const batches = new Map();
  root.traverse((object) => {
    if (!object.isMesh) return;
    const mat = object.material;
    if (!batches.has(mat)) batches.set(mat, []);
    const geo = object.geometry.clone();
    geo.applyMatrix4(object.matrixWorld);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    // Non-indexed geometry allows primitives and custom roofs to share a batch.
    batches.get(mat).push(geo.index ? geo.toNonIndexed() : geo);
  });
  root.clear();
  let triangles = 0;
  for (const [mat, geometries] of batches) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) continue;
    const object = new THREE.Mesh(merged, mat);
    object.castShadow = true; object.receiveShadow = true;
    triangles += merged.attributes.position.count / 3;
    root.add(object);
  }
  return { batches: batches.size, triangles };
}

export function seededRandom(seed = 42) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
