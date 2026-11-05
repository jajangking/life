import * as THREE from 'three';
import { palette as P, material } from './kit.js';

export function createArchitecture(kit, state) {
  const { box, cyl, ball, rod, mesh, root } = kit;
  const glass = state.windowMaterial;
  function windowAt(x, y, z, w = 0.8, h = 0.95, parent = root, angle = 0) {
    const g = new THREE.Group(); parent.add(g); g.position.set(x, y, z); g.rotation.y = angle;
    box(w + 0.13, h + 0.13, 0.10, 0, 0, 0, '#e7dcc1', g);
    box(w, h, 0.055, 0, 0, 0.07, glass, g);
    box(0.045, h, 0.04, 0, 0, 0.11, '#e2d6b8', g);
    box(w, 0.04, 0.04, 0, -h * 0.07, 0.11, '#e2d6b8', g);
    box(w + 0.22, 0.07, 0.22, 0, -h / 2 - 0.08, 0.04, '#ded1b3', g);
    box(w * 0.16, h * 0.86, 0.015, -w * 0.35, 0.01, 0.102, '#c1ccc0', g);
    box(w * 0.55, 0.025, 0.02, w * 0.08, h * 0.30, 0.103, '#94b0ad', g).rotation.z = 0.12;
  }

  function door(x, y, z, parent = root, color = P.green) {
    box(0.86, 1.67, 0.12, x, y + 0.83, z, '#e8dcc0', parent);
    box(0.72, 1.55, 0.14, x, y + 0.78, z + 0.015, color, parent);
    box(0.5, 0.7, 0.035, x, y + 1.1, z + 0.1, glass, parent);
    box(0.48, 0.4, 0.045, x, y + 0.35, z + 0.1, color, parent);
    ball(0.035, x + 0.23, y + 0.75, z + 0.13, '#dbc18d', parent, 1);
    box(1.0, 0.12, 0.45, x, y, z + 0.1, P.curb, parent);
  }

  function pitchedRoof(w, d, rise, x, y, z, color = P.roof, parent = root, metal = false) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(0, rise); shape.lineTo(w / 2, 0); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, steps: 1 });
    geometry.translate(0, 0, -d / 2);
    const roof = mesh(geometry, color, parent); roof.position.set(x, y, z);
    // Real geometric roof tiles, rather than a flat colored prism.
    for (const s of [-1, 1]) {
      const rows = Math.ceil(w / 0.58);
      for (let i = 1; i < rows; i++) {
        const f = i / rows;
        rod([x + s * w / 2 * f, y + rise * (1 - f) + 0.025, z - d / 2], [x + s * w / 2 * f, y + rise * (1 - f) + 0.025, z + d / 2], metal ? 0.018 : 0.027, metal ? '#718c85' : P.roofLight, parent);
      }
      for (let i = 0; i <= Math.floor(d / 0.32); i++) {
        const zz = z - d / 2 + i * 0.32;
        rod([x, y + rise + 0.025, zz], [x + s * w / 2, y + 0.025, zz], 0.012, metal ? '#577970' : P.roofDark, parent);
      }
      rod([x + s * w / 2, y, z - d / 2], [x + s * w / 2, y, z + d / 2], 0.055, color, parent);
    }
    rod([x, y + rise + 0.035, z - d / 2 - 0.03], [x, y + rise + 0.035, z + d / 2 + 0.03], 0.07, metal ? '#668d83' : P.roofLight, parent);
  }

  function balcony(x, y, z, width, parent = root) {
    box(width + 0.18, 0.13, 0.66, x, y, z, '#dbcbb1', parent);
    [-1, 1].forEach((s) => {
      box(0.04, 0.63, 0.04, x + s * width / 2, y + 0.32, z + 0.26, P.metal, parent);
      box(0.045, 0.045, 0.62, x + s * width / 2, y + 0.62, z, P.metal, parent);
    });
    box(width, 0.045, 0.045, x, y + 0.63, z + 0.27, P.metal, parent);
    const n = Math.ceil(width / 0.22);
    for (let i = 1; i < n; i++) box(0.025, 0.55, 0.025, x - width / 2 + i / n * width, y + 0.3, z + 0.27, P.metal, parent);
  }

  function awning(x, y, z, width, depth, color, parent = root) {
    const g = new THREE.Group(); parent.add(g); g.position.set(x, y, z); g.rotation.x = 0.13;
    const n = Math.round(width / 0.32);
    for (let i = 0; i < n; i++) {
      const c = i % 2 ? '#f4e9d0' : color;
      box(width / n, 0.055, depth, -width / 2 + (i + 0.5) * width / n, 0, 0, c, g);
      box(width / n, 0.2, 0.055, -width / 2 + (i + 0.5) * width / n, -0.09, depth / 2, c, g);
    }
    rod([-width / 2, -0.06, depth / 2], [width / 2, -0.06, depth / 2], 0.025, '#d5c3a4', g);
  }

  function ac(x, y, z, parent, angle = 0) {
    const g = new THREE.Group(); parent.add(g); g.position.set(x, y, z); g.rotation.y = angle;
    box(0.65, 0.42, 0.3, 0, 0, 0, '#cbd0bd', g);
    const fan = mesh(new THREE.TorusGeometry(0.135, 0.018, 5, 12), '#819184', g);
    fan.position.set(0.12, 0, 0.16);
    for (let i = 0; i < 4; i++) box(0.19, 0.014, 0.02, -0.17, -0.12 + i * 0.07, 0.16, '#85988a', g);
    box(0.72, 0.04, 0.38, 0, -0.24, 0, P.metal, g);
  }

  return { windowAt, door, pitchedRoof, balcony, awning, ac };
}

export function buildNeighborhood(kit, props, dynamic, state) {
  const { box, cyl, ball, rod, slab, ring, sign, mesh, root } = kit;
  const places = [];
  const glass = state.windowMaterial;

  const { windowAt, door, pitchedRoof, balcony, awning, ac } = createArchitecture(kit, state);

  function addPlace(id, name, kind, description, x, y, z, color, facts) {
    places.push({ id, name, kind, description, position: new THREE.Vector3(x, y, z), color, facts });
  }

  // NORTH-WEST · the little apartment and a neighborhood grocery.
  {
    const g = new THREE.Group(); root.add(g); g.position.set(-8.9, 0.23, -7.4);
    box(5.8, 5.65, 4.2, 0, 2.82, 0, '#e3cc98', g);
    box(5.96, 0.2, 4.35, 0, 5.69, 0, '#eee0ba', g);
    box(5.86, 0.18, 4.27, 0, 1.82, 0, '#eee1c1', g);
    box(5.86, 0.14, 4.27, 0, 3.65, 0, '#eee1c1', g);
    [-2.75, 2.75].forEach((x) => box(0.19, 5.6, 0.14, x, 2.8, 2.12, '#be9e6a', g));
    for (let level = 0; level < 3; level++) {
      [-1.82, 0, 1.82].forEach((x) => windowAt(x, 1.0 + level * 1.8, 2.13, 1.03, 1.10, g));
      [-1.2, 0.7].forEach((z) => windowAt(2.93, 1.0 + level * 1.8, z, 0.9, 1.05, g, Math.PI / 2));
      if (level > 0) balcony(0, level * 1.8 + 0.18, 2.40, 5.3, g);
    }
    door(0, 0.06, 2.16, g, '#6e8371');
    sign('RUMAH MENTARI', 2.45, 0.25, 0, 1.77, 2.23, '#ddc596', '#5c6850', g, 76);
    for (const x of [-2, 1.9]) {
      props.plant(x, 2.03, 2.52, 0.85, g);
      props.plant(x + 0.2, 3.83, 2.52, 0.8, g);
    }
    props.laundry(0, 4.68, 2.55, 1.7, g);
    ac(2.98, 2.8, 0.2, g, Math.PI / 2);
    ac(2.98, 4.7, -1.3, g, Math.PI / 2);
    // Rooftop parapet, water tank, solar heater and television antenna.
    box(5.8, 0.42, 0.12, 0, 5.99, -2.03, '#dac697', g);
    box(0.12, 0.42, 4.2, -2.83, 5.99, 0, '#dac697', g);
    box(0.12, 0.42, 4.2, 2.83, 5.99, 0, '#dac697', g);
    box(5.8, 0.2, 0.12, 0, 5.88, 2.03, '#dac697', g);
    box(1.15, 0.3, 1.15, -1.65, 5.98, -0.8, '#a5aa92', g);
    cyl(0.47, 0.47, 0.85, -1.65, 6.55, -0.8, '#73999a', g, 20);
    cyl(0.49, 0.49, 0.07, -1.65, 7.01, -0.8, '#5f8385', g, 20);
    [6.27, 6.49, 6.72].forEach((y) => ring(0.475, 0.015, -1.65, y, -0.8, '#92b1ab', g));
    rod([1.8, 5.8, -1.2], [1.8, 7.9, -1.2], 0.02, P.metal, g);
    [7.3, 7.7].forEach((y) => rod([1.1, y, -1.2], [2.5, y, -1.2], 0.018, P.metal, g));
    props.laundry(0.5, 6.5, 0.65, 2.0, g);
    props.plant(2.1, 5.83, 1.2, 1.2, g);
    // External stairway visible from the lane.
    for (let i = 0; i < 13; i++) box(0.8, 0.09, 0.22, -3.35, 0.18 + i * 0.13, 1.8 - i * 0.22, '#9ba895', g);
    rod([-3.7, 0.8, 1.8], [-3.7, 2.4, -0.86], 0.025, P.metal, g);
    addPlace('rumah-mentari', 'Rumah Mentari', 'Rumah susun', 'Jemuran bergoyang di balkon. Dari lantai tiga, Bu Ratna bisa melihat seluruh kampung.', -8.9, 6.3, -7.4, '#d5b46e', ['3 lantai', '6 keluarga', 'Sejak 1987']);
  }
  {
    const g = new THREE.Group(); root.add(g); g.position.set(-4.25, 0.23, -7.35);
    box(2.55, 3.6, 3.9, 0, 1.8, 0, '#d7b976', g);
    box(2.65, 0.14, 4.0, 0, 2.05, 0, '#ead8ad', g);
    windowAt(-0.64, 2.85, 1.99, 0.67, 0.85, g);
    windowAt(0.64, 2.85, 1.99, 0.67, 0.85, g);
    box(1.8, 1.5, 0.07, 0, 0.82, 1.99, '#596e54', g);
    box(0.78, 1.35, 0.06, -0.45, 0.78, 2.04, glass, g);
    for (let i = 0; i < 7; i++) box(0.033, 1.4, 0.03, 0.12 + i * 0.12, 0.78, 2.08, '#819078', g);
    sign('TOKO MENTARI', 2.28, 0.4, 0, 1.84, 2.06, '#416c57', '#fff1cd', g, 91);
    awning(0, 1.62, 2.45, 2.8, 1.08, '#6e9475', g);
    pitchedRoof(2.92, 4.3, 0.65, 0, 3.63, 0, '#64877b', g, true);
    props.crate(-4.95, -4.25, '#c88d4a');
    props.crate(-4.12, -4.25, '#a3b85c');
    props.crate(-3.30, -4.25, '#d5aa54');
    props.plant(-5.5, 0.22, -3.8, 1.2);
    addPlace('toko', 'Toko Mentari', 'Toko kelontong', 'Dari telur sampai kabar terbaru, semuanya ada di sini. Pak Budi selalu menyapa duluan.', -4.25, 4.5, -7.35, '#78a38b', ['Buka setiap hari', 'Sayur segar', 'Pemilik: Pak Budi']);
  }

  // A tiny street-food cart, complete with stove, glass case and stools.
  {
    const g = new THREE.Group(); root.add(g); g.position.set(-10.2, 0.22, -3.45);
    box(1.85, 0.65, 0.9, 0, 0.57, 0, '#bd8260', g);
    box(0.85, 0.55, 0.83, -0.45, 1.17, 0, '#92b2a8', g);
    box(1.85, 0.09, 1.03, 0, 0.94, 0, '#d7c6a4', g);
    [-0.82, 0.82].forEach((x) => {
      rod([x, 0.9, -0.37], [x, 1.72, -0.37], 0.035, P.wood, g);
      const wheel = cyl(0.20, 0.20, 0.10, x, 0.25, 0.4, P.dark, g, 12); wheel.rotation.x = Math.PI / 2;
    });
    awning(0, 1.77, 0, 2.18, 1.34, '#c78a58', g);
    sign('NASI GORENG', 1.35, 0.28, 0, 0.62, 0.46, '#bd8260', '#fff0cd', g, 87);
    cyl(0.23, 0.17, 0.21, 0.51, 1.1, 0, '#a5b2a5', g, 16);
    cyl(0.25, 0.23, 0.04, 0.51, 1.23, 0, '#bdc7b6', g, 16);
    ball(0.05, 0.51, 1.28, 0, P.wood, g);
    [-0.6, 0.6].forEach((x) => {
      cyl(0.19, 0.19, 0.06, x, 0.43, 0.95, '#d7a067', g, 12);
      cyl(0.045, 0.075, 0.4, x, 0.21, 0.95, P.wood, g, 8);
    });
    addPlace('gerobak', 'Gerobak Pak Joko', 'Kaki lima', 'Suara spatula, wangi bawang, dan obrolan yang selalu lebih lama dari waktu makannya.', -10.2, 2.3, -3.45, '#d09567', ['Nasi goreng', 'Resep keluarga', 'Sejak 2003']);
  }

  // SOUTH-WEST · a corner café, with a proper little terrace.
  {
    const g = new THREE.Group(); root.add(g); g.position.set(-9.0, 0.23, 5.8);
    box(5.6, 4.35, 4.4, 0, 2.17, 0, '#efddbd', g);
    box(5.62, 2.02, 4.42, 0, 1.01, 0, '#ddad8e', g);
    box(5.76, 0.16, 4.55, 0, 2.12, 0, '#eedcba', g);
    [-2.58, -0.84, 0.84, 2.58].forEach((x) => box(0.14, 1.94, 0.14, x, 1.01, 2.23, '#ead6b1', g));
    [-1.75, 0].forEach((x) => {
      box(1.52, 1.42, 0.07, x, 1.03, 2.24, glass, g);
      box(1.48, 0.045, 0.04, x, 0.89, 2.3, '#ad8f6b', g);
      box(0.045, 1.42, 0.04, x, 1.03, 2.3, '#ad8f6b', g);
    });
    door(1.75, 0.04, 2.23, g, '#6a8372');
    [-1.6, 0, 1.6].forEach((x) => windowAt(x, 3.27, 2.24, 0.85, 1.18, g));
    [-1.25, 0.55].forEach((z) => {
      windowAt(2.83, 3.25, z, 0.85, 1.1, g, Math.PI / 2);
      windowAt(2.83, 1.08, z, 1.1, 1.35, g, Math.PI / 2);
    });
    sign('K O P I   P A G I', 3.7, 0.48, -0.3, 2.0, 2.35, '#456551', '#f9ebcc', g, 82);
    awning(0, 1.78, 2.83, 5.8, 1.15, '#c88c64', g);
    balcony(0, 2.61, 2.47, 3.9, g);
    props.plant(-1.55, 2.72, 2.66, 0.8, g);
    props.plant(1.55, 2.72, 2.66, 0.8, g);
    pitchedRoof(6.05, 4.86, 1.38, 0, 4.4, 0, P.roof, g);
    box(0.5, 0.65, 0.55, -1.8, 5.23, -1.1, '#c1a583', g);
    box(0.64, 0.08, 0.68, -1.8, 5.58, -1.1, '#e2cdac', g);
    ac(2.91, 2.6, -1.2, g, Math.PI / 2);
    props.plant(-11.95, 0.23, 8.45, 1.5);
    props.plant(-6.0, 0.23, 8.45, 1.2);
    props.table(-10.75, 10.2, true, '#d9b873');
    props.table(-7.55, 10.15, false);
    props.table(-4.45, 8.0, true, '#b78f68');
    // Freestanding handwritten menu board.
    const board = box(0.67, 0.95, 0.08, -5.82, 0.77, 9.35, '#5a6a52'); board.rotation.x = -0.12;
    box(0.78, 0.07, 0.10, -5.82, 1.27, 9.35, P.wood);
    sign('SLOW\nMORNINGS\n——\nkopi & cerita', 0.57, 0.76, -5.82, 0.78, 9.41, '#5a6a52', '#eee4bf', root, 105);
    rod([-5.5, 0.2, 9.3], [-5.5, 1.25, 9.55], 0.035, P.wood);
    [-12.5, -3.0].forEach((x) => cyl(0.035, 0.045, 3.2, x, 1.82, 10.7, P.wood));
    props.stringLights([-12.5, 3.4, 10.7], [-3.0, 3.4, 10.7], 17);
    props.bicycle(-12.35, 6.1, Math.PI / 2);
    addPlace('kopi', 'Kopi Pagi', 'Kafe & tempat singgah', 'Meja kayu, kopi hangat, dan tidak ada yang terburu-buru. Sari sedang menikmati jeda di terasnya.', -9, 5.9, 5.8, '#cb9271', ['Kopi lokal', '3 meja teras', 'Pemilik: Sari']);
  }

  // A small artist's studio behind the café terrace.
  {
    const g = new THREE.Group(); root.add(g); g.position.set(-3.9, 0.23, 4.5);
    box(2.38, 2.95, 3.1, 0, 1.47, 0, '#b9c3ab', g);
    windowAt(0, 2.22, 1.59, 1.25, 0.75, g);
    door(-0.45, 0.04, 1.59, g, '#9c795a');
    windowAt(1.22, 1.8, 0, 0.9, 1.1, g, Math.PI / 2);
    pitchedRoof(2.72, 3.46, 0.92, 0, 3.0, 0, '#6a8a7b', g, true);
    sign('STUDIO KECIL', 1.8, 0.25, 0, 1.65, 1.68, '#b9c3ab', '#4d6552', g, 77);
    props.plant(-2.8, 0.23, 6.45, 0.9);
    props.plant(-5, 0.23, 6.45, 1.1);
    addPlace('studio', 'Studio Kecil', 'Ruang berkarya', 'Naya menggambar kehidupan kampung dari jendela ini. Kadang, inspirasi terbaik hanya perlu dilihat lebih dekat.', -3.9, 4.2, 4.5, '#91a68c', ['Seni & kerajinan', 'Pemilik: Naya', 'Pintu selalu terbuka']);
  }

  // SOUTH-EAST · three individual homes, gardens, gates, laundry and mailboxes.
  const houses = [
    { x: 4.15, z: 5.8, w: 2.95, d: 3.8, h: 2.48, color: '#e4c991', roof: P.roof, name: 'Rumah Bu Ratna' },
    { x: 7.9, z: 5.55, w: 3.08, d: 3.9, h: 3.82, color: '#b3c0a4', roof: '#b47758', name: 'Rumah Keluarga Adi' },
    { x: 11.55, z: 5.8, w: 2.78, d: 3.8, h: 2.68, color: '#e8dfc4', roof: '#64897f', name: 'Rumah Pak Darto' },
  ];
  houses.forEach((h, i) => {
    const g = new THREE.Group(); root.add(g); g.position.set(h.x, 0.23, h.z);
    slab(h.w + 0.4, h.d + 0.4, 0.13, 0.06, 0, 0.04, 0, '#d7ceb2', g);
    box(h.w, h.h, h.d, 0, h.h / 2 + 0.08, 0, h.color, g);
    box(h.w + 0.08, 0.14, h.d + 0.08, 0, 0.25, 0, '#ccba95', g);
    door(-0.65, 0.1, h.d / 2 + 0.05, g, ['#849279', '#a48663', '#7e9690'][i]);
    windowAt(0.69, 1.2, h.d / 2 + 0.05, 0.74, 0.92, g);
    windowAt(h.w / 2 + 0.04, 1.3, 0.2, 0.83, 0.9, g, Math.PI / 2);
    if (i === 1) {
      box(h.w + 0.05, 0.12, h.d + 0.05, 0, 2.27, 0, '#e0d9bb', g);
      [-0.68, 0.68].forEach((x) => windowAt(x, 3.08, h.d / 2 + 0.05, 0.72, 0.9, g));
      balcony(0, 2.35, h.d / 2 + 0.25, 2.8, g);
      props.laundry(0, 3.12, h.d / 2 + 0.5, 1.95, g);
      ac(h.w / 2 + 0.08, 2.98, -0.9, g, Math.PI / 2);
    } else {
      awning(-0.35, 1.98, h.d / 2 + 0.43, 2.38, 0.8, i === 0 ? '#c19969' : '#7c9e8c', g);
      [-1.4, 0.72].forEach((x) => cyl(0.034, 0.034, 1.85, x, 1.02, h.d / 2 + 0.75, '#b69b78', g, 8));
    }
    pitchedRoof(h.w + 0.42, h.d + 0.42, i === 1 ? 1.05 : 1.1, 0, h.h + 0.14, 0, h.roof, g, i === 2);
    // Number plate and a door light.
    sign(String(12 + i * 2), 0.22, 0.18, -1.13, 1.5, h.d / 2 + 0.12, '#e9dfc2', '#536951', g, 110);
    box(0.16, 0.09, 0.15, -0.67, 1.94, h.d / 2 + 0.15, state.glowMaterial, g);
    const yardZ = 9.55;
    slab(3.25, 2.75, 0.06, 0.10, h.x, 0.24, yardZ, i === 0 ? '#b9bd89' : '#a5b47c');
    box(0.62, 0.035, 2.5, h.x - 0.6, 0.29, yardZ, '#d9cfb4');
    for (let j = 0; j < 6; j++) box(0.53, 0.025, 0.25, h.x - 0.6, 0.32, 8.6 + j * 0.39, '#e7dbc0');
    props.fence(h.x + 0.82, 10.94, 1.65);
    props.fence(h.x - 1.30, 10.94, 0.62);
    props.fence(h.x + 1.66, 9.65, 2.55, Math.PI / 2);
    props.plant(h.x + 1.0, 0.28, 8.1, 1.0);
    props.plant(h.x - 1.3, 0.28, 8.3, 0.9);
    // Mailbox on a slender post.
    cyl(0.025, 0.03, 0.8, h.x - 1.12, 0.62, 10.65, P.metal, root, 7);
    box(0.33, 0.26, 0.22, h.x - 1.12, 1.04, 10.65, ['#bb7a5b', '#63897a', '#b7a064'][i]);
    box(0.22, 0.025, 0.025, h.x - 1.12, 1.08, 10.78, P.dark);
    props.flowers(h.x + 0.8, 10.35, 1.35);
    addPlace(`rumah-${i}`, h.name, 'Rumah & halaman', ['Bu Ratna menyiram bunga setiap sore. Halamannya kecil, tapi selalu punya ruang untuk tanaman baru.', 'Seprai di balkon baru saja dijemur. Dari dapur, aroma masakan rumah mulai tercium.', 'Sepeda tua di teras masih menemani Pak Darto berkeliling setiap pagi.'][i], h.x, h.h + 1.7, h.z, h.color, ['Taman kecil', 'Tetangga ramah', `Nomor ${12 + i * 2}`]);
  });
  props.tree(12.3, 9.5, 0.62);
  props.bicycle(10.55, 8.6, Math.PI / 2);
  props.flag(2.6, 10.35, 3.6);
  // Vegetable patch, with individual cabbages.
  slab(1.65, 1.7, 0.12, 0.1, 4.85, 0.3, 9.7, '#b59c73');
  for (let row = 0; row < 3; row++) {
    box(1.4, 0.06, 0.03, 4.85, 0.39, 9.1 + row * 0.5, '#807b52');
    for (let j = 0; j < 4; j++) ball(0.13, 4.3 + j * 0.35, 0.48, 9.1 + row * 0.5, row % 2 ? '#8fa15b' : '#a5b572');
  }

  // NORTH-EAST · the village's green heart.
  {
    slab(10.7, 8.8, 0.06, 0.45, 7.9, 0.25, -6.8, '#b2bd86');
    box(1.25, 0.025, 8.7, 7.3, 0.3, -6.8, P.path);
    box(10.3, 0.025, 1.15, 7.9, 0.31, -6.3, P.path);
    cyl(2.13, 2.13, 0.04, 7.3, 0.33, -6.3, P.path, root, 64);
    ring(2.02, 0.04, 7.3, 0.36, -6.3, '#cbbb98');
    // Fountain: stone rim, animated water and four little arcing jets.
    cyl(1.12, 1.23, 0.25, 7.3, 0.47, -6.3, '#c6c3a6', root, 48);
    cyl(1.01, 1.01, 0.04, 7.3, 0.59, -6.3, '#72b2ab', root, 48);
    ring(1.12, 0.065, 7.3, 0.61, -6.3, '#e2dbc0');
    cyl(0.13, 0.2, 0.8, 7.3, 0.95, -6.3, '#e0d9bd');
    cyl(0.42, 0.12, 0.18, 7.3, 1.32, -6.3, '#d3ccb0', root, 24);
    cyl(0.35, 0.35, 0.02, 7.3, 1.42, -6.3, '#8bc4bc', root, 24);
    for (let i = 0; i < 4; i++) {
      const angle = i / 4 * Math.PI * 2;
      const points = [];
      for (let j = 0; j <= 15; j++) {
        const f = j / 15;
        points.push(new THREE.Vector3(7.3 + Math.cos(angle) * f * 0.84, 1.48 + Math.sin(f * Math.PI) * 0.45 - f * 0.85, -6.3 + Math.sin(angle) * f * 0.84));
      }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.018, 5, false), '#a4d3c5');
      const drop = ball(0.045, 0, 0, 0, '#dbede0', dynamic);
      state.water.push({ mesh: drop, angle, offset: i / 4 });
    }
    state.fountain = { x: 7.3, z: -6.3 };
    props.bench(4.7, -6.4, -Math.PI / 2);
    props.bench(9.95, -4.45, Math.PI);
    props.bench(6.0, -9.55, 0);
    props.tree(3.7, -10.15, 0.85);
    props.tree(11.7, -3.65, 0.92);
    props.tree(3.9, -3.6, 0.65);
    props.tree(12.0, -10.3, 0.65, 'tall');
    props.flowers(7.9, -10.8, 3.35);
    props.flowers(12.25, -6.8, 3.1, 'z');
    props.bin(10.3, -3.0);
    // Open pavilion, four wooden posts, tiled pyramidal roof.
    slab(2.45, 2.45, 0.18, 0.15, 10.6, 0.35, -9.1, '#d5c49f');
    [-0.9, 0.9].forEach((x) => [-0.9, 0.9].forEach((z) => cyl(0.06, 0.07, 1.8, 10.6 + x, 1.32, -9.1 + z, P.wood, root, 8)));
    const roof = cyl(0, 1.85, 0.82, 10.6, 2.65, -9.1, '#c58b61', root, 4); roof.rotation.y = Math.PI / 4;
    ball(0.08, 10.6, 3.11, -9.1, '#c58b61');
    props.bench(10.6, -9.8, 0);
    // Swing frame and two hanging seats, animated with a gentle sway.
    const sx = 4.3, sz = -8.35;
    [-0.76, 0.76].forEach((x) => {
      rod([sx + x, 0.35, sz - 0.5], [sx + x, 2.13, sz], 0.045, '#7b8c65');
      rod([sx + x, 0.35, sz + 0.5], [sx + x, 2.13, sz], 0.045, '#7b8c65');
    });
    rod([sx - 0.9, 2.15, sz], [sx + 0.9, 2.15, sz], 0.055, '#b18d5a');
    const swing = new THREE.Group(); swing.position.set(sx, 2.1, sz); dynamic.add(swing);
    [-0.28, 0.28].forEach((x) => rod([x, 0, 0], [x, -1.3, 0], 0.012, '#afb5a0', swing));
    box(0.66, 0.06, 0.3, 0, -1.3, 0, '#bb8e61', swing);
    state.swings.push(swing);
    props.fence(7.9, -11.4, 10.2, 0, '#879b75', 0.48);
    props.fence(13.1, -8.8, 4.9, Math.PI / 2, '#879b75', 0.48);
    sign('TAMAN SORE', 1.55, 0.28, 10.65, 0.73, -2.53, '#748a63', '#f5eac9', root, 93);
    [-0.65, 0.65].forEach((x) => box(0.04, 0.54, 0.06, 10.65 + x, 0.45, -2.57, P.wood));
    addPlace('taman', 'Taman Sore', 'Ruang untuk bernapas', 'Air mancur, bangku teduh, dan burung yang tak pernah kehabisan lagu. Tempat favorit warga untuk tidak melakukan apa-apa.', 7.3, 3.0, -6.3, '#88a46d', ['Air mancur', 'Taman bermain', 'Terbuka untuk semua']);
  }

  // Bus shelter facing the eastern ring road.
  {
    const g = new THREE.Group(); root.add(g); g.position.set(13.0, 0.22, -6.4); g.rotation.y = -Math.PI / 2;
    box(2.9, 0.12, 1.15, 0, 2.16, 0, '#738e7a', g);
    [-1.25, 1.25].forEach((x) => box(0.055, 2.1, 0.055, x, 1.05, -0.35, '#687b69', g));
    box(2.55, 1.65, 0.035, 0, 1.18, -0.36, '#aec6b6', g);
    box(1.75, 0.08, 0.38, 0.2, 0.65, -0.05, P.woodLight, g);
    [-0.4, 0.8].forEach((x) => box(0.05, 0.5, 0.08, x, 0.4, -0.05, P.metal, g));
    sign('MARI\nJALAN\nKAKI.', 0.63, 1.35, -0.87, 1.27, -0.33, '#d5b776', '#435c43', g, 145);
    box(0.06, 2.6, 0.06, 1.65, 1.3, 0, P.metal, g);
    sign('B', 0.45, 0.45, 1.65, 2.65, 0.01, '#486d58', '#faf0cf', g, 560);
  }

  // Small lived-in details in the remaining corners.
  props.tree(-12.6, -10.65, 0.65, 'tall');
  props.tree(-12.65, 2.9, 0.69, 'tall');
  props.tree(-3.0, -10.6, 0.52, 'tall');
  props.flowers(-9.5, -10.82, 2.4);
  props.flowers(-7.2, 3.0, 2.3);
  props.bin(-2.6, -3.0);
  props.bin(-12.75, 10.8);
  props.flag(-12.6, -3.2, 3.3);
  props.bicycle(-2.7, -8.6, 0);
  // Utility poles with gracefully sagging wires.
  const poles = [[-13.18, -10.5], [-13.18, -2.8], [-13.18, 10.7]];
  poles.forEach(([x, z]) => {
    cyl(0.055, 0.095, 4.7, x, 2.53, z, '#947b57', root, 9);
    box(0.9, 0.08, 0.09, x, 4.67, z, P.wood);
    [-0.34, 0.34].forEach((s) => cyl(0.055, 0.045, 0.12, x + s, 4.78, z, '#d2d5bf', root, 7));
  });
  for (let i = 1; i < poles.length; i++) {
    for (const offset of [-0.32, 0.32]) {
      const a = poles[i - 1], b = poles[i];
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0] + offset, 4.83, a[1]), new THREE.Vector3(a[0] + offset, 4.0, (a[1] + b[1]) / 2), new THREE.Vector3(b[0] + offset, 4.83, b[1]));
      mesh(new THREE.TubeGeometry(curve, 24, 0.012, 4, false), '#616c53');
    }
  }

  return places;
}
