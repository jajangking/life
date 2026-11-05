import * as THREE from 'three';
import { seededRandom } from './kit.js';

export function createWeather(dynamic, { onChange } = {}) {
  const count = 420, random = seededRandom(561);
  const seeds = Array.from({ length: count }, () => ({ x: random() * 60, z: random() * 54, y: random() * 15 }));
  const positions = new Float32Array(count * 6);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: '#a7c2bf', transparent: true, opacity: 0, depthWrite: false });
  const rain = new THREE.LineSegments(geometry, material); rain.frustumCulled = false; rain.visible = false; dynamic.add(rain);
  let mode = 'auto', active = false, amount = 0, visibleDrops = 260, previous = false;
  function update(time, realDelta) {
    active = mode === 'rain' || (mode === 'auto' && time % 170 >= 65 && time % 170 < 95);
    amount += ((active ? 1 : 0) - amount) * (1 - Math.exp(-realDelta * 2));
    if (active !== previous) { previous = active; onChange?.(active); }
    rain.visible = amount > 0.01; material.opacity = amount * 0.46;
    if (rain.visible) {
      for (let i = 0; i < visibleDrops; i++) {
        const s = seeds[i], k = i * 6;
        const x = -16 + (s.x + time * 0.85) % 60, z = -40 + s.z, y = 15 - (s.y + time * 13) % 15;
        positions[k] = x; positions[k + 1] = y; positions[k + 2] = z;
        positions[k + 3] = x - 0.075; positions[k + 4] = y + 0.72; positions[k + 5] = z + 0.025;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  }
  return {
    update,
    setMode(value) { if (!['auto', 'clear', 'rain'].includes(value)) return false; mode = value; return true; },
    setDropCount(value) { visibleDrops = Math.min(count, Math.max(0, value)); geometry.setDrawRange(0, visibleDrops * 2); },
    getState() { return { mode, active, amount, drops: rain.visible ? visibleDrops : 0 }; },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
