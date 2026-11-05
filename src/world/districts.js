import * as THREE from 'three';
import { palette as P, material, batchStatic } from './kit.js';
import { createArchitecture } from './buildings.js';

export function buildDistricts(kit, props, dynamic, state) {
  const { box, cyl, ball, rod, slab, ring, sign, root } = kit;
  const { windowAt, door, pitchedRoof, balcony, awning, ac } = createArchitecture(kit, state);
  const places = [];
  const place = (id, name, kind, x, y, z, color, description, facts) => places.push({ id, name, kind, position: new THREE.Vector3(x, y, z), color, description, facts });
  const groupAt = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0.23, z); root.add(g); return g; };

  // Continuous streets, not three disconnected miniature islands.
  for (const z of [-13.2, 0, 13.2]) box(29.6, 0.035, 3.6, 30.8, 0.185, z, P.road);
  box(3.6, 0.035, 54.5, 44.5, 0.185, -13.1, P.road);
  box(3.6, 0.035, 26.3, -15.2, 0.185, -26.2, P.road);
  box(61.5, 0.035, 3.6, 14.9, 0.185, -39.4, P.road);
  box(3.6, 0.035, 26.2, 0, 0.185, -26.1, P.road);
  box(3.6, 0.035, 52.6, 30, 0.185, -13.1, P.road);
  for (const x of [23.4, 37.2]) for (const z of [-6.7, 6.7]) {
    slab(9.5, 9.9, 0.14, 0.3, x, 0.2, z, P.curb);
    slab(9.18, 9.56, 0.025, 0.2, x, 0.285, z, '#e5dcc4');
    for (let j = 0; j < 10; j++) box(0.014, 0.006, 0.38, x - 4.3 + j * 0.94, 0.304, z + 4.7, '#cabea6');
  }
  for (const [x, width] of [[-7.5, 11.3], [15, 26.3], [37.2, 10.7]]) {
    slab(width, 9.2, 0.13, 0.16, x, 0.2, -20, P.curb);
    slab(width - 0.25, 8.95, 0.025, 0.12, x, 0.28, -20, '#d9d8b7');
    slab(width, 6.4, 0.13, 0.16, x, 0.2, -35.1, P.curb);
  }
  for (let x = -14; x < 45; x += 2.2) {
    if (Math.abs(x) > 3 && Math.abs(x - 30) > 3) {
      box(0.85, 0.012, 0.055, x, 0.211, -39.4, '#d8d5bd');
      if (x > 17) for (const z of [-13.2, 0, 13.2]) box(0.85, 0.012, 0.055, x, 0.211, z, '#d8d5bd');
    }
  }
  for (let z = -38; z < 13; z += 2.2) {
    if (Math.abs(z) > 4.6) box(0.055, 0.012, 0.85, 30, 0.211, z, '#e0cf96');
    box(0.055, 0.012, 0.85, 44.5, 0.211, z, '#d8d5bd');
    if (z < -14) for (const x of [0, -15.2]) box(0.055, 0.012, 0.85, x, 0.211, z, '#d8d5bd');
  }
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    box(0.18, 0.015, 2.88, 30 + side * 3.25 - 0.95 + i * 0.24, 0.213, 0, P.paint);
    box(2.88, 0.015, 0.18, 30, 0.213, side * 3.25 - 0.95 + i * 0.24, P.paint);
  }
  const signalPair = [0, 1].map((axis) => ({
    axis: axis ? 'horizontal' : 'vertical', offset: 8,
    red: material('#b96c54', { emissive: '#ed6f4d', emissiveIntensity: 0.1 }).clone(),
    amber: material('#b5a061', { emissive: '#efbc5d', emissiveIntensity: 0.1 }).clone(),
    green: material('#779e79', { emissive: '#98cf8d', emissiveIntensity: 0.1 }).clone(),
  }));
  state.signals.push(...signalPair);
  [[-2.12, -2.12, 0, 0], [2.12, 2.12, Math.PI, 0], [2.12, -2.12, Math.PI / 2, 1], [-2.12, 2.12, -Math.PI / 2, 1]].forEach(([x, z, a, phase]) => {
    const g = groupAt(30 + x, z); g.rotation.y = a;
    cyl(0.04, 0.07, 2.05, 0, 1.025, 0, P.metal, g, 8);
    box(0.22, 0.67, 0.20, 0, 1.95, 0, P.dark, g);
    [['red', 2.15], ['amber', 1.96], ['green', 1.77]].forEach(([name, y]) => ball(0.065, 0, y, 0.11, signalPair[phase][name], g).scale.z = 0.4);
  });

  // PASAR KENANGA · six individual produce stalls, not repeated house blocks.
  {
    const g = groupAt(23.4, -7.2);
    box(8.1, 2.3, 2.2, 0, 1.15, -2.3, '#dec590', g);
    pitchedRoof(8.5, 2.7, 0.85, 0, 2.35, -2.3, '#a97455', g);
    sign('PASAR KENANGA', 5.7, 0.48, 0, 2.18, -1.12, '#47705b', '#fff1cc', g, 113);
    for (let row = 0; row < 2; row++) for (let column = 0; column < 3; column++) {
      const x = -2.65 + column * 2.65, z = -0.2 + row * 2.8;
      const color = ['#7b9c80', '#d3aa67', '#bd886d'][(column + row) % 3];
      box(2.28, 0.8, 1.4, x, 0.48, z, '#b29871', g);
      box(2.33, 0.08, 1.5, x, 0.91, z, '#e0c699', g);
      awning(x, 2.05, z, 2.5, 2.05, color, g);
      [-1, 1].forEach((side) => cyl(0.03, 0.04, 1.95, x + side * 1.08, 1.05, z - 0.55, P.wood, g, 6));
      for (let bin = 0; bin < 3; bin++) {
        box(0.65, 0.14, 0.85, x - 0.73 + bin * 0.72, 1.0, z, '#a58257', g);
        for (let fruit = 0; fruit < 6; fruit++) ball(0.10, x - 0.92 + bin * 0.72 + (fruit % 3) * 0.18, 1.13, z - 0.19 + Math.floor(fruit / 3) * 0.32, ['#c1b458', '#be7853', '#7c9e65'][(bin + column) % 3], g, 0);
      }
    }
    props.crate(19.7, -3.2, '#aeae58'); props.crate(20.4, -3.2, '#ce9b54');
    props.bin(27.6, -10.8);
    place('pasar', 'Pasar Kenanga', 'Pasar lingkungan', 23.4, 3.7, -7.2, '#c1a268', 'Enam kios kecil, keranjang sayur, dan obrolan yang selalu lebih ramai dari tawar-menawarnya. Kurir mengantar persediaan lewat jalan depan.', ['6 kios', 'Sayur & buah', 'Kiriman setiap putaran']);
  }

  // Three differently proportioned shophouses, balconies and roof gardens.
  for (const [i, x] of [20.6, 23.4, 26.2].entries()) {
    const g = groupAt(x, 5.6), height = [4.3, 6.3, 5.1][i];
    const color = ['#d8b581', '#a2b8a5', '#e0c5a4'][i];
    box(2.56, height, 4.6, 0, height / 2, 0, color, g);
    box(2.67, 0.16, 4.75, 0, height, 0, '#eee0be', g);
    for (let level = 0; level < Math.floor(height / 1.8); level++) {
      box(2.61, 0.1, 4.65, 0, 1.85 + level * 1.8, 0, '#eee0be', g);
      if (level) for (const wx of [-0.62, 0.62]) windowAt(wx, 0.94 + level * 1.8, 2.34, 0.65, 1.05, g);
    }
    door(0.55, 0.05, 2.34, g, '#688475');
    box(1.18, 1.25, 0.05, -0.6, 0.85, 2.35, state.windowMaterial, g);
    sign(['ROTI SENJA', 'BUNGA KITA', 'SEPEDA & KOPI'][i], 2.45, 0.35, 0, 1.84, 2.4, ['#ab7e59', '#477560', '#697f78'][i], '#fff0cf', g, 100);
    awning(0, 1.65, 2.75, 2.7, 0.9, ['#c69b63', '#87a17b', '#be8c69'][i], g);
    balcony(0, 2.05, 2.5, 2.35, g);
    box(2.5, 0.35, 0.1, 0, height + 0.22, -2.22, color, g);
    for (const wx of [-1.18, 1.18]) box(0.1, 0.35, 4.6, wx, height + 0.22, 0, color, g);
    props.plant(-0.7, height + 0.1, 1.4, 0.85, g);
    if (i === 1) { props.laundry(0, height + 0.8, -0.2, 1.7, g); cyl(0.35, 0.35, 0.65, 0.6, height + 0.42, -1.4, '#7b9e9a', g); }
    else ac(1.31, 3, -0.8, g, Math.PI / 2);
  }
  props.bicycle(19.3, 10.5, 0.8); props.flowers(25.5, 10.8, 2.8);
  place('ruko', 'Ruko Kenanga', 'Toko & ruang berkarya', 23.4, 6.8, 5.6, '#98aa8c', 'Roti baru matang di lantai bawah. Di atasnya, jemuran, pot bunga, dan kehidupan rumah tetap berjalan.', ['3 ruko berbeda', 'Toko roti & bunga', 'Kebun atap']);

  {
    const g = groupAt(37.4, 6.8);
    box(6.7, 3.25, 5, 0, 1.62, 0, '#e8e2cb', g);
    box(6.8, 0.2, 5.15, 0, 3.3, 0, '#a2b6ab', g);
    box(6.8, 0.22, 5.15, 0, 0.28, 0, '#7b9d92', g);
    for (const x of [-2.3, -0.85, 2.1]) windowAt(x, 1.65, 2.55, 1.05, 1.3, g);
    door(0.7, 0.06, 2.54, g, '#8aa299');
    sign('KLINIK SEHAT', 4.8, 0.45, 0, 2.9, 2.61, '#678c7d', '#fff4d7', g, 126);
    awning(0.7, 2.4, 3.1, 2.8, 1.15, '#839e91', g);
    box(0.15, 0.83, 0.06, -2.35, 2.1, 2.65, '#5e9175', g); box(0.65, 0.16, 0.07, -2.35, 2.1, 2.65, '#5e9175', g);
    for (let j = 0; j < 3; j++) box(1.0, 0.05, 0.38, 0.7, 0.03 + j * 0.065, 3.75 - j * 0.35, P.curb, g);
    props.bench(34.3, 10.4); props.tree(41.3, 10.5, 0.68); props.plant(40.6, 0.3, 9.7, 1.25);
    place('klinik', 'Klinik Sehat', 'Klinik keluarga', 37.4, 4.1, 6.8, '#8aa89a', 'Bangku di teras selalu teduh. Bu Rini menyapa warga yang datang dengan sepeda atau berjalan kaki.', ['Klinik lingkungan', 'Teras teduh', 'Perawat: Bu Rini']);
  }
  {
    const g = groupAt(37.1, -7.3);
    box(6.1, 3.35, 4.8, 0, 1.67, 0, '#d6c49d', g);
    pitchedRoof(6.7, 5.3, 1.2, 0, 3.4, 0, '#8b9a7f', g, true);
    door(0, 0.05, 2.45, g); for (const x of [-1.95, 1.95]) windowAt(x, 1.7, 2.45, 1.25, 1.2, g);
    sign('BALAI KENANGA', 3.6, 0.35, 0, 2.9, 2.53, '#8c9a79', '#fff0cf', g, 120);
    props.bench(36.1, -3.1); props.tree(33.8, -10.7, 0.65); props.flag(40.9, -3.5, 3.1);
    // Bus shelter is on the sidewalk beside the actual angkot lane.
    box(0.9, 0.12, 3.2, 42.1, 2.25, -6.4, '#7b9784');
    for (const z of [-7.7, -5.1]) cyl(0.04, 0.05, 2, 41.85, 1.2, z, P.metal, root, 8);
    props.bench(42.05, -6.4, Math.PI / 2);
    sign('03', 0.55, 0.45, 42.5, 2.3, -4.85, '#4e745e', '#fff1ce', root, 450);
    place('halte', 'Halte Kenanga', 'Angkot & balai warga', 42.1, 2.8, -6.4, '#8ca58b', 'Angkot 03 benar-benar berhenti di sini. Penumpang naik, turun, lalu melanjutkan perjalanan di antara tiga kawasan.', ['Angkot 03', 'Terhubung ke sekolah', 'Dekat balai warga']);
  }

  // TEPI SUNGAI · a lower water surface, stone embankments and three bridges.
  const riverMaterial = material('#74a9a4', { roughness: 0.45, metalness: 0.08 });
  riverMaterial.userData.keepColor = true; state.riverMaterial = riverMaterial;
  slab(54, 5.5, 0.035, 0.55, 14, 0.175, -27.5, riverMaterial);
  for (const z of [-30.4, -24.6]) box(54.4, 0.22, 0.32, 14, 0.22, z, '#bcb99a');
  for (const x of [0, 30]) {
    box(3.6, 0.08, 7.4, x, 0.195, -27.5, P.road);
    for (const side of [-1, 1]) {
      box(0.2, 0.22, 7.4, x + side * 1.84, 0.26, -27.5, '#d2c9aa');
      for (let j = 0; j < 8; j++) box(0.08, 0.8, 0.08, x + side * 1.84, 0.77, -30.7 + j * 0.92, '#849b8d');
      box(0.08, 0.07, 7.3, x + side * 1.84, 1.17, -27.5, '#728a7e');
    }
  }
  box(1.8, 0.13, 6.6, 16, 0.34, -27.5, '#bca071');
  for (let j = 0; j < 23; j++) box(1.84, 0.015, 0.04, 16, 0.415, -30.65 + j * 0.29, '#8d805d');
  for (const side of [-1, 1]) {
    for (let j = 0; j < 7; j++) box(0.07, 0.8, 0.07, 16 + side * 0.86, 0.79, -30.3 + j * 0.94, '#8f9272');
    rod([16 + side * 0.86, 1.2, -30.4], [16 + side * 0.86, 1.2, -24.6], 0.04, '#8f9272');
  }
  place('sungai', 'Titian Sungai', 'Jembatan pejalan kaki', 16, 1.6, -27.5, '#87aaa0', 'Air bergerak pelan di bawah titian kayu. Dari sini terlihat rusun, sekolah, dan perahu yang ditambatkan di dermaga.', ['Aliran air miniatur', '3 jembatan', 'Jalur jalan kaki']);
  const ripples = new THREE.Group(); dynamic.add(ripples);
  for (let i = 0; i < 24; i++) box(0.7 + (i % 4) * 0.4, 0.008, 0.035, -11 + (i * 2.14) % 51, 0.205, -29.5 + (i % 4) * 1.16, '#abd0c0', ripples);
  batchStatic(ripples); state.riverRipples = ripples;
  for (const x of [-11.7, -3.2, 5, 11.5, 22.5, 26.8, 35.2, 40.4]) {
    props.tree(x, -23.5, 0.55 + (Math.abs(x) % 3) * 0.05, Math.abs(x) % 2 > 1 ? 'tall' : 'round');
  }
  props.bench(10.2, -23.6); props.bench(22.5, -23.6); props.bin(26.8, -23.6);
  props.flowers(6, -23.5, 2.4); props.flowers(38, -23.5, 2.4);

  // Two unequal apartment wings with external stairs and lived-in rooftops.
  for (const [i, x] of [-9.5, -4.2].entries()) {
    const g = groupAt(x, -19.9), w = i ? 3.5 : 4.8, floors = i ? 3 : 4, h = floors * 1.9;
    box(w, h, 4.2, 0, h / 2, 0, i ? '#d4af8f' : '#d8cfab', g);
    for (let floor = 0; floor < floors; floor++) {
      box(w + 0.14, 0.12, 4.3, 0, floor * 1.9 + 0.15, 0, '#e8ddbf', g);
      for (const wx of [-w * 0.3, 0, w * 0.3]) windowAt(wx, floor * 1.9 + 1.06, 2.14, 0.65, 1.02, g);
      if (floor > 0) { balcony(0, floor * 1.9 + 0.18, 2.4, w - 0.2, g); props.plant(w * 0.32, floor * 1.9 + 0.28, 2.5, 0.75, g); }
      windowAt(w / 2 + 0.04, floor * 1.9 + 1.06, 0, 0.95, 1, g, Math.PI / 2);
    }
    door(0, 0.08, 2.16, g);
    box(w + 0.2, 0.17, 4.4, 0, h + 0.03, 0, '#d6cdb0', g);
    box(w, 0.35, 0.12, 0, h + 0.28, -2.07, '#bdbb99', g);
    props.laundry(0, h + 0.85, 0.4, w * 0.65, g);
    cyl(0.4, 0.4, 0.75, -w * 0.25, h + 0.49, -1.2, '#7d9d9c', g);
    const solar = box(1.65, 0.05, 0.9, w * 0.18, h + 0.3, -0.8, '#6b8d90', g); solar.rotation.x = -0.2;
    for (let k = 0; k < 4; k++) box(0.012, 0.025, 0.92, w * 0.18 - 0.65 + k * 0.43, h + 0.34, -0.8, '#aebdb0', g).rotation.x = -0.2;
    ac(w / 2 + 0.05, 2.8, -1.2, g, Math.PI / 2);
  }
  for (let j = 0; j < 14; j++) box(0.8, 0.1, 0.22, -6.55, 0.4 + j * 0.13, -17.6 - j * 0.22, '#a9af95');
  place('susun', 'Rusun Tepi Air', 'Rumah susun & kebun atap', -8, 9.1, -20, '#bca67f', 'Dua bangunan, banyak kebiasaan kecil. Panel surya, tangki air, dan jemuran berbagi tempat di atap yang sama.', ['3–4 lantai', 'Jemuran & kebun atap', 'Menghadap sungai']);

  {
    const g = groupAt(8, -19.4);
    box(7.3, 2.7, 4.6, 0, 1.35, 0, '#ddc59f', g);
    pitchedRoof(7.8, 5.1, 1.2, 0, 2.75, 0, '#7c9483', g, true);
    door(0, 0.06, 2.36, g);
    for (const x of [-2.3, 2.3]) windowAt(x, 1.6, 2.36, 1.65, 1.3, g);
    sign('PUSTAKA SENJA', 4.4, 0.35, 0, 2.5, 2.43, '#668877', '#fff0d1', g, 112);
    awning(0, 2.25, 2.8, 7.5, 0.95, '#b7a378', g);
    // An outdoor book-exchange shelf, with separate coloured spines.
    box(1.25, 1.5, 0.32, 2.4, 0.85, 2.65, '#947b57', g);
    for (let shelf = 0; shelf < 3; shelf++) {
      box(1.3, 0.06, 0.37, 2.4, 0.4 + shelf * 0.45, 2.67, '#c4a37b', g);
      for (let book = 0; book < 8; book++) box(0.1, 0.26 + (book % 3) * 0.04, 0.23, 1.89 + book * 0.14, 0.58 + shelf * 0.45, 2.74, ['#8aa396', '#c28e6b', '#d4ba7d', '#8ba5b0'][book % 4], g);
    }
    props.bench(17.6, -19.4); props.table(23.2, -19.5, true, '#9db394');
    place('pustaka', 'Pustaka Senja', 'Perpustakaan lingkungan', 8, 4.4, -19.4, '#9baa85', 'Buku boleh dipinjam, kursi boleh dipakai lama. Rak kecil di teras menerima buku yang ingin dibagikan kepada tetangga.', ['Rak tukar buku', 'Teras membaca', 'Dekat titian sungai']);
  }

  // The second stop matches the angkot's actual north-bank stopping point.
  box(3,0.12,1.1,6.2,2.25,-37.2,'#7b9784');
  for(const x of [4.85,7.55]) cyl(0.04,0.05,2,x,1.2,-37.55,P.metal,root,8);
  props.bench(6.2,-37.15,Math.PI);
  sign('03 · SEKOLAH',2.15,0.3,6.2,2.22,-36.62,'#7b9784','#fff1ce',root,116);

  // School courtyard and two small north-bank homes.
  {
    const g = groupAt(18, -35.7);
    box(14.8, 2.75, 3.65, 0, 1.38, 0, '#e1c89b', g);
    pitchedRoof(15.4, 4.1, 1.1, 0, 2.8, 0, '#b17857', g);
    for (const x of [-5.9, -3.9, -1.9, 1.9, 3.9, 5.9]) windowAt(x, 1.4, 1.88, 1.2, 1.1, g);
    door(0, 0.06, 1.88, g, '#7b9482');
    sign('SEKOLAH PELANGI', 5.8, 0.4, 0, 2.5, 1.96, '#9c7f57', '#fff1cd', g, 117);
    box(12.7, 0.04, 2.4, 0, 0.08, 3.18, '#cfc5a1', g);
    props.flag(14.3, -32.6, 3.5); props.bench(23.5, -32.2); props.tree(27.1, -32.5, 0.64);
    // Leave a gate aligned with the pedestrian bridge.
    props.fence(12.9, -31.2, 4.6, 0, '#c2b798', 0.65);
    props.fence(21.1, -31.2, 8.6, 0, '#c2b798', 0.65);
    place('sekolah', 'Sekolah Pelangi', 'Sekolah & lapangan kecil', 18, 4.4, -35.7, '#c4aa79', 'Jendela kelas terbuka menghadap halaman. Angkot menurunkan penumpang di halte utara, sementara gerbang halaman terhubung ke titian sungai.', ['Halte sekolah', 'Halaman bermain', 'Bendera merah putih']);
  }
  for (const [i, x] of [-10.3, -5.3].entries()) {
    const g = groupAt(x, -35.1), color = i ? '#b1bda6' : '#e2c8a1';
    box(3.8, 2.7 + i * 0.6, 3.9, 0, 1.35 + i * 0.3, 0, color, g);
    pitchedRoof(4.2, 4.3, 1.05, 0, 2.75 + i * 0.6, 0, i ? '#788e7c' : '#bf8664', g, !!i);
    door(-0.8, 0.04, 2.02, g); windowAt(0.75, 1.5, 2.02, 0.9, 1.1, g);
    props.plant(-1.5, 0.1, 2.4, 1.05, g); props.laundry(0.3, 1.7, 2.5, 1.8, g);
  }
  slab(8.2, 6.1, 0.03, 0.2, 37.1, 0.31, -35, '#859e8e');
  for (const z of [-37.7, -32.3]) box(7.8, 0.01, 0.05, 37.1, 0.33, z, '#dfddbe');
  for (const x of [33.3, 40.9]) box(0.05, 0.01, 5.45, x, 0.33, -35, '#dfddbe');
  ring(1.12, 0.025, 37.1, 0.34, -35, '#dfddbe'); box(7.7, 0.01, 0.04, 37.1, 0.34, -35, '#dfddbe');
  cyl(0.05, 0.07, 2.5, 40.5, 1.56, -37.3, P.metal, root, 8);
  box(0.9, 0.6, 0.08, 40.5, 2.6, -37.1, '#e4ddbf');
  ring(0.23, 0.02, 40.5, 2.35, -36.8, '#bd8a61');

  // A small moored boat rocks at the pier.
  box(2.2, 0.14, 3, -8, 0.28, -29.3, '#b69b70');
  for (let j = 0; j < 10; j++) box(2.2, 0.015, 0.04, -8, 0.36, -30.65 + j * 0.3, '#8c805c');
  for (const x of [-9.1, -6.9]) for (const z of [-30.6, -28]) cyl(0.07, 0.08, 0.7, x, 0.35, z, P.wood, root, 8);
  const boat = new THREE.Group(); dynamic.add(boat);
  const hull = cyl(0.8, 0.55, 0.27, 0, 0, 0, '#a78b61', boat, 4); hull.rotation.y = Math.PI / 4; hull.scale.set(0.9, 1, 2.8);
  box(0.65, 0.15, 2.4, 0, 0.13, 0, '#d5bc89', boat);
  box(0.72, 0.42, 0.8, 0, 0.35, 0.4, '#91a794', boat);
  box(0.86, 0.08, 1.05, 0, 0.59, 0.4, '#d5cba6', boat);
  batchStatic(boat); boat.position.set(-10.6, 0.3, -27.9); state.boat = boat;
  place('dermaga', 'Dermaga Bambu', 'Perahu & rumah tepi air', -8, 2, -28.5, '#b79f72', 'Perahu kecil ditambatkan sebelum sore. Papan dermaga hangat, air tenang, dan rumah-rumah di seberang mulai menyalakan lampu.', ['Perahu ditambatkan', 'Rumah tepi air', 'Jalan santai']);

  // Animated shutters are separate from the spatially batched architecture.
  for (const [x, z, width, top] of [[-4.25, -5.22, 1.75, 1.92], [20.6, 7.99, 1.2, 1.58], [26.2, 7.99, 1.2, 1.58]]) {
    const shutter = box(width, 1.45, 0.035, x, top, z, '#9dada0', dynamic);
    state.shutters.push({ mesh: shutter, height: 1.45, top, closed: 0 });
  }
  for (const [x, z, a] of [[19.2, -11.3, 0], [41.8, 3.2, Math.PI], [27.9, 10.7, 0], [32.2, -17.2, 0], [-12.9, -17, 0], [4.2, -23.8, 0], [26.7, -31.5, Math.PI], [40.8, -31.6, 0]]) props.lamp(x, z, a);
  for (const [x, z] of [[19.1, 3.1], [42, -10.9], [20, 10.8], [34, 10.8], [-11.7, -32.1], [6.1, -32.2], [35, -31.7]]) props.tree(x, z, 0.62, 'tall');
  return places;
}
