import * as THREE from 'three';
import { batchStatic, palette as P } from './kit.js';

function route(points) {
  const p = points.map(([x, z]) => new THREE.Vector3(x, 0.31, z));
  const lengths = p.map((v, i) => v.distanceTo(p[(i + 1) % p.length]));
  const total = lengths.reduce((a, b) => a + b, 0);
  return {
    total,
    at(distance, out) {
      let d = ((distance % total) + total) % total;
      for (let i = 0; i < lengths.length; i++) {
        if (d <= lengths[i]) {
          const a = p[i], b = p[(i + 1) % p.length];
          out.lerpVectors(a, b, d / lengths[i]);
          return Math.atan2(b.x - a.x, b.z - a.z);
        }
        d -= lengths[i];
      }
      return 0;
    },
  };
}

const residents = [
  ['Sari', 'Pemilik Kopi Pagi', 'Membawa cerita dan secangkir kopi ke meja teras.', '#c88d70'],
  ['Pak Budi', 'Penjaga Toko Mentari', 'Mengecek sayur segar untuk tetangga yang mampir.', '#7a9c89'],
  ['Naya', 'Ilustrator', 'Mencari inspirasi dari hal-hal kecil di kampung.', '#b89b67'],
  ['Raka', 'Mahasiswa', 'Jalan memutar sedikit. Udara sore terlalu sayang dilewatkan.', '#7698aa'],
  ['Bu Ratna', 'Pencinta tanaman', 'Menyapa tetangga sambil melihat bunga di sepanjang jalan.', '#b28b97'],
  ['Pak Darto', 'Pensiunan guru', 'Menikmati waktu tanpa perlu melihat jam.', '#b9a575'],
  ['Adi', 'Arsitek', 'Pulang lewat taman, seperti biasanya.', '#8ca197'],
  ['Laras', 'Pembuat keramik', 'Membawa ide baru untuk sebuah cangkir kecil.', '#d5ae80'],
  ['Pak Joko', 'Juru masak', 'Istirahat sebentar sebelum wajan kembali ramai.', '#b08063'],
  ['Dina', 'Penulis', 'Mengumpulkan potongan percakapan untuk cerita berikutnya.', '#a99fba'],
  ['Fajar', 'Fotografer', 'Menunggu cahaya yang jatuh tepat di antara atap.', '#e2c28b'],
  ['Mira', 'Perawat', 'Menghirup udara segar setelah hari yang panjang.', '#89aaa5'],
  ['Bayu', 'Musisi', 'Ada irama kecil dari suara roda dan langkah kaki.', '#b58d75'],
  ['Intan', 'Pembuat roti', 'Menyusuri kampung sambil mencari kopi kesukaan.', '#d2ac8d'],
  ['Rizki', 'Pesepeda', 'Hari ini memilih jalan kaki dan menikmati suasana.', '#8a9d77'],
  ['Tari', 'Guru', 'Memperhatikan anak-anak yang bermain di taman.', '#bc9c8c'],
  ['Dimas', 'Desainer', 'Sedang mencari tempat paling teduh untuk duduk.', '#7c9da8'],
  ['Ayu', 'Pustakawan', 'Pulang membawa buku dan banyak cerita.', '#b7a46c'],
  ['Bu Wati', 'Tetangga ramah', 'Selalu ada waktu untuk bertukar kabar.', '#c28d7c'],
  ['Pak Hasan', 'Tukang kebun', 'Memastikan tanaman taman tidak kehausan.', '#849c72'],
  ['Luna', 'Pelajar', 'Menghitung kupu-kupu di dekat air mancur.', '#d4b08d'],
  ['Arga', 'Pelajar', 'Ingin mencoba ayunan sekali lagi sebelum pulang.', '#8ca5b2'],
  ['Rani', 'Pekerja lepas', 'Pindah meja kerja ke teras kafe untuk hari ini.', '#bc929d'],
  ['Bima', 'Pengrajin kayu', 'Mengamati bangku yang ia buat untuk taman.', '#a5a077'],
  ['Putri', 'Pemilik toko bunga', 'Bunga paling cantik selalu tumbuh di halaman tetangga.', '#d2aa88'],
  ['Pak Yanto', 'Penjaga kampung', 'Berjalan pelan, memastikan semua baik-baik saja.', '#869b91'],
  ['Eka', 'Jurnalis', 'Kabar baik hari ini: kampung terasa seperti rumah.', '#bbad8b'],
  ['Sinta', 'Koki rumahan', 'Mencari bahan segar untuk makan malam keluarga.', '#a296b1'],
];

export function createPeople(dynamic) {
  const group = new THREE.Group(); group.name = 'Warga Kampung Mentari'; dynamic.add(group);
  const count = residents.length;
  const skin = ['#c38e68', '#d6a37c', '#e1b58a', '#b58260', '#cc9772'];
  const hair = ['#443c32', '#504634', '#65513c', '#393d34'];
  const pants = ['#52615d', '#6a7168', '#7a796b', '#687784'];
  const shapes = {
    body: [new THREE.BoxGeometry(0.24, 0.28, 0.17), count],
    head: [new THREE.SphereGeometry(0.109, 9, 7), count],
    hair: [new THREE.SphereGeometry(0.113, 9, 6), count],
    upperArm: [new THREE.BoxGeometry(0.071, 0.16, 0.083), count * 2],
    hand: [new THREE.BoxGeometry(0.061, 0.12, 0.068), count * 2],
    leg: [new THREE.BoxGeometry(0.087, 0.23, 0.095), count * 2],
    shoe: [new THREE.BoxGeometry(0.098, 0.065, 0.15), count * 2],
    bag: [new THREE.BoxGeometry(0.095, 0.16, 0.16), count],
    shadow: [new THREE.CircleGeometry(0.19, 12), count],
  };
  const meshes = {};
  for (const [name, [geometry, n]] of Object.entries(shapes)) {
    const mat = name === 'shadow'
      ? new THREE.MeshBasicMaterial({ color: '#344f3e', transparent: true, opacity: 0.16, depthWrite: false })
      : new THREE.MeshStandardMaterial({ roughness: 0.95 });
    const m = new THREE.InstancedMesh(geometry, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.castShadow = true; m.receiveShadow = true;
    m.frustumCulled = false;
    group.add(m); meshes[name] = m;
  }
  const routes = [
    route([[-12.9, -10.8], [-2.65, -10.8], [-2.65, -2.65], [-12.9, -2.65]]),
    route([[2.7, -11.15], [12.75, -11.15], [12.75, -2.65], [2.7, -2.65]]),
    route([[-12.9, 2.7], [-2.65, 2.7], [-2.65, 11.35], [-12.9, 11.35]]),
    route([[2.7, 2.7], [13.15, 2.7], [13.15, 11.45], [2.7, 11.45]]),
    route([[7.3, -10.4], [7.3, -8.7], [5.25, -6.3], [7.3, -4.2], [9.55, -6.3], [7.3, -8.7]]),
    route([[-12.7, -2.7], [-3.3, -2.7], [-3.3, 2.7], [3.3, 2.7], [3.3, 11.45], [13.1, 11.45], [13.1, 2.7], [3.3, 2.7], [3.3, -2.7], [-3.3, -2.7]]),
  ];
  const agents = residents.map(([name, job, story, color], i) => {
    const r = routes[i % routes.length];
    const rig = new THREE.Object3D();
    const parts = [];
    const addPart = (key, index, parent, x, y, z, scale = null) => {
      const object = new THREE.Object3D(); parent.add(object); object.position.set(x, y, z);
      if (scale) object.scale.set(...scale);
      parts.push({ object, key, index }); return object;
    };
    const shadow = addPart('shadow', i, rig, 0, 0.004, 0);
    shadow.rotation.x = -Math.PI / 2;
    addPart('body', i, rig, 0, 0.46, 0);
    addPart('head', i, rig, 0, 0.68, 0.006);
    addPart('hair', i, rig, 0, 0.733, -0.01, [1, 0.63, 1]);
    addPart('bag', i, rig, 0.17, 0.38, -0.01, i % 3 === 0 ? [1, 1, 1] : [0, 0, 0]);
    const arms = [], legs = [];
    for (let j = 0; j < 2; j++) {
      const side = j ? 1 : -1;
      const arm = new THREE.Object3D(); rig.add(arm); arm.position.set(side * 0.164, 0.56, 0); arms.push(arm);
      addPart('upperArm', i * 2 + j, arm, 0, -0.06, 0);
      addPart('hand', i * 2 + j, arm, 0, -0.19, 0);
      const leg = new THREE.Object3D(); rig.add(leg); leg.position.set(side * 0.065, 0.33, 0); legs.push(leg);
      addPart('leg', i * 2 + j, leg, 0, -0.11, 0);
      addPart('shoe', i * 2 + j, leg, 0, -0.24, 0.027);
      meshes.upperArm.setColorAt(i * 2 + j, new THREE.Color(color));
      meshes.hand.setColorAt(i * 2 + j, new THREE.Color(skin[i % skin.length]));
      meshes.leg.setColorAt(i * 2 + j, new THREE.Color(pants[i % pants.length]));
      meshes.shoe.setColorAt(i * 2 + j, new THREE.Color('#4c5145'));
    }
    meshes.body.setColorAt(i, new THREE.Color(color));
    meshes.head.setColorAt(i, new THREE.Color(skin[i % skin.length]));
    meshes.hair.setColorAt(i, new THREE.Color(hair[i % hair.length]));
    meshes.bag.setColorAt(i, new THREE.Color('#a98059'));
    return {
      id: `warga-${i}`, name, job, story, color, rig, parts, arms, legs, route: r,
      distance: i / count * r.total * 3.1, speed: 0.38 + (i % 5) * 0.055,
      position: rig.position, heading: 0, seated: false, stationary: false,
      activity: ['Menikmati jalan sore', 'Berkeliling kampung', 'Menyapa tetangga', 'Menuju taman', 'Mencari tempat singgah'][i % 5],
    };
  });
  // A few residents linger. A living city also needs people doing nothing.
  const sitting = [
    [0, -7.6, 10.8, Math.PI, 'Menikmati kopi di teras'],
    [5, 4.7, -6.4, -Math.PI / 2, 'Duduk di bawah pohon'],
    [15, 10.0, -4.45, Math.PI, 'Menunggu teman di taman'],
    [22, -4.45, 8.7, Math.PI, 'Bekerja dari teras kafe'],
    [23, 6.0, -9.55, 0, 'Mendengarkan air mancur'],
  ];
  sitting.forEach(([i, x, z, a, activity]) => {
    const p = agents[i]; p.stationary = true; p.seated = true;
    p.position.set(x, 0.34, z); p.heading = a; p.activity = activity;
  });
  const standing = [[1, -4.4, -3.55, Math.PI], [8, -9.1, -3.8, 0], [18, 2.8, 9.0, Math.PI / 2]];
  standing.forEach(([i, x, z, a]) => {
    const p = agents[i]; p.stationary = true; p.position.set(x, 0.31, z); p.heading = a;
    p.activity = i === 1 ? 'Menata buah di depan toko' : i === 8 ? 'Menyiapkan nasi goreng' : 'Bertukar kabar dengan tetangga';
  });

  function update(time, delta) {
    agents.forEach((agent, i) => {
      if (!agent.stationary) {
        agent.distance += delta * agent.speed;
        const angle = agent.route.at(agent.distance, agent.position);
        let diff = angle - agent.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        agent.heading += diff * Math.min(1, delta * 10 + 0.15);
      }
      agent.rig.rotation.y = agent.heading;
      const phase = time * 6 * agent.speed + i * 1.7;
      const stride = agent.stationary ? 0 : Math.sin(phase) * 0.48;
      agent.rig.position.y = agent.seated ? 0.34 : 0.31 + (agent.stationary ? 0 : Math.abs(Math.sin(phase)) * 0.015);
      agent.arms[0].rotation.x = stride * 0.8;
      agent.arms[1].rotation.x = -stride * 0.8;
      agent.legs[0].rotation.x = agent.seated ? -1.25 : -stride;
      agent.legs[1].rotation.x = agent.seated ? -1.25 : stride;
      if (agent.stationary) agent.arms[1].rotation.z = Math.sin(time * 0.7 + i) * 0.07 - 0.06;
      agent.rig.updateMatrixWorld(true);
      agent.parts.forEach(({ object, key, index }) => meshes[key].setMatrixAt(index, object.matrixWorld));
    });
    Object.values(meshes).forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  }
  update(0, 0);
  return { agents, update, pickable: meshes.body, pickables: [meshes.body, meshes.head] };
}

export function createTraffic(kit, dynamic) {
  const { box, cyl, ball, sign } = kit;
  const contactMaterial = new THREE.MeshBasicMaterial({ color: '#2f493d', transparent: true, opacity: 0.14, depthWrite: false });
  function contactShadow(g, w, d) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), contactMaterial);
    m.rotation.x = -Math.PI / 2; m.position.y = 0.025; g.add(m);
  }
  function car(color, type = 'car') {
    const g = new THREE.Group(); dynamic.add(g);
    const van = type === 'angkot';
    box(van ? 0.92 : 0.88, 0.30, van ? 1.9 : 1.68, 0, 0.43, 0, color, g);
    box(0.83, van ? 0.65 : 0.35, van ? 1.43 : 0.92, 0, van ? 0.84 : 0.75, van ? -0.12 : -0.08, color, g);
    box(0.72, van ? 0.32 : 0.25, 0.035, 0, van ? 0.96 : 0.8, van ? 0.61 : 0.4, '#759694', g);
    box(0.72, van ? 0.30 : 0.22, 0.035, 0, van ? 0.95 : 0.8, van ? -0.85 : -0.55, '#678784', g);
    [-1, 1].forEach((s) => {
      const x = s * (van ? 0.47 : 0.45);
      [-0.56, 0.56].forEach((z) => {
        const wheel = cyl(0.195, 0.195, 0.12, x, 0.28, z, '#3c4a43', g, 12); wheel.rotation.z = Math.PI / 2;
        const hub = cyl(0.10, 0.10, 0.125, x + s * 0.007, 0.28, z, '#b4b8a4', g, 10); hub.rotation.z = Math.PI / 2;
      });
      box(0.025, van ? 0.31 : 0.23, van ? 1.21 : 0.72, s * 0.43, van ? 0.96 : 0.81, -0.14, '#7d9e98', g);
      if (van) for (let i = 0; i < 3; i++) box(0.03, 0.34, 0.04, s * 0.45, 0.95, -0.67 + i * 0.41, color, g);
      box(0.1, 0.07, 0.17, s * 0.49, 0.77, 0.36, color, g);
      box(0.16, 0.10, 0.035, s * 0.28, 0.50, van ? 0.965 : 0.85, '#f3e6b9', g);
      box(0.14, 0.08, 0.035, s * 0.28, 0.47, van ? -0.965 : -0.85, '#b66c56', g);
    });
    box(0.8, 0.07, 0.07, 0, 0.29, van ? 0.98 : 0.87, '#a7afa0', g);
    box(0.23, 0.07, 0.025, 0, 0.42, van ? 0.987 : 0.88, '#e8d9ad', g);
    if (van) {
      box(0.93, 0.09, 1.95, 0, 0.56, 0, '#dfc68c', g);
      sign('03', 0.23, 0.15, 0.21, 0.98, 0.637, '#638d77', '#fff2ca', g, 300);
      box(0.88, 0.10, 1.45, 0, 1.2, -0.12, '#d3d2ac', g);
    }
    batchStatic(g); contactShadow(g, 1.05, van ? 2.0 : 1.8);
    return g;
  }
  function scooter(color, parked = false) {
    const g = new THREE.Group(); dynamic.add(g);
    box(0.3, 0.24, 0.85, 0, 0.4, 0, color, g);
    box(0.34, 0.11, 0.48, 0, 0.57, -0.13, '#5d6152', g);
    const shield = box(0.34, 0.48, 0.15, 0, 0.58, 0.34, color, g); shield.rotation.x = -0.13;
    [-0.38, 0.38].forEach((z) => {
      const w = cyl(0.19, 0.19, 0.12, 0, 0.25, z, '#414e44', g, 12); w.rotation.z = Math.PI / 2;
    });
    box(0.53, 0.035, 0.055, 0, 0.85, 0.39, P.metal, g);
    ball(0.08, 0, 0.72, 0.43, '#e8d9aa', g);
    if (!parked) {
      box(0.24, 0.3, 0.2, 0, 0.86, -0.05, '#aa976c', g);
      ball(0.13, 0, 1.12, -0.03, '#617e77', g);
      [-1, 1].forEach((s) => {
        box(0.07, 0.23, 0.08, s * 0.16, 0.8, 0.1, '#a68f6b', g).rotation.x = -0.8;
        box(0.08, 0.23, 0.09, s * 0.16, 0.56, -0.02, '#657265', g);
      });
    }
    batchStatic(g); contactShadow(g, 0.48, 1.0); return g;
  }
  function loop(x0, x1, z0, z1, reverse = false) {
    const r = 1.6;
    let points = [[x0 + r, z0], [x1 - r, z0], [x1, z0 + r], [x1, z1 - r], [x1 - r, z1], [x0 + r, z1], [x0, z1 - r], [x0, z0 + r]];
    if (reverse) points = points.reverse();
    return new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.19, z)), true, 'centripetal', 0.15);
  }
  const paths = [loop(-15.78, 15.78, -13.78, 13.78), loop(-14.55, 14.55, -12.55, 12.55, true), loop(-14.7, -0.83, -12.6, -0.83), loop(0.83, 14.6, 0.83, 12.6, true)];
  const configs = [
    ['#739980', 'angkot', 0, 0.04, 1.8], ['#d8bc7a', 'car', 0, 0.37, 2.05],
    ['#b77d60', 'car', 0, 0.72, 1.95], ['#d8d7c0', 'car', 1, 0.16, 1.9],
    ['#809fa4', 'car', 1, 0.63, 2.0], ['#ba9d69', 'scooter', 2, 0.2, 1.65],
    ['#a97c65', 'scooter', 3, 0.58, 1.7], ['#879b79', 'car', 2, 0.74, 1.6],
  ];
  const vehicles = configs.map(([color, type, path, t, speed]) => ({
    mesh: type === 'scooter' ? scooter(color) : car(color, type), path: paths[path], t, speed,
    length: paths[path].getLength(), crossStreet: path > 1,
  }));
  [[-3.0, -4.8, Math.PI / 2, '#7d9c8c'], [6.35, 8.8, 0.25, '#d2b178'], [-12.3, -6.1, 0, '#b58675']].forEach(([x, z, a, color]) => {
    const m = scooter(color, true); m.position.set(x, 0.29, z); m.rotation.set(0, a, -0.12);
  });
  const tangent = new THREE.Vector3();
  function update(time, delta) {
    vehicles.forEach((v) => {
      const previous = v.mesh.position;
      // Give way at the central crossing; vehicles on the ring road keep moving.
      const atSignal = v.crossStreet && Math.abs(previous.x) < 1.3 && Math.abs(previous.z) < 5.2 && Math.abs(previous.z) > 4.0;
      const green = Math.floor(time / 13) % 2 === 0;
      if (!(atSignal && !green)) v.t = (v.t + delta * v.speed / v.length) % 1;
      v.path.getPointAt(v.t, v.mesh.position);
      v.path.getTangentAt(v.t, tangent);
      v.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
  }
  update(0, 0);
  return { vehicles, update };
}

export function createBirds(kit, dynamic) {
  const birds = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); dynamic.add(g);
    const body = kit.ball(0.065, 0, 0, 0, '#62715e', g); body.scale.set(0.7, 0.8, 1.8);
    const left = kit.box(0.27, 0.018, 0.08, -0.13, 0, 0, '#62715e', g);
    const right = kit.box(0.27, 0.018, 0.08, 0.13, 0, 0, '#62715e', g);
    birds.push({ group: g, left, right, offset: i * 1.4 });
  }
  function update(time) {
    birds.forEach(({ group, left, right, offset }, i) => {
      const t = time * 0.12 + offset;
      group.position.set(7 + Math.cos(t) * (5 + i * 0.4), 7.8 + Math.sin(t * 2) * 0.4 + i * 0.22, -5 + Math.sin(t) * 3.8);
      group.rotation.y = -t;
      left.rotation.z = Math.sin(time * 8 + offset) * 0.5;
      right.rotation.z = -left.rotation.z;
    });
  }
  return { update };
}
