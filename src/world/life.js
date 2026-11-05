import * as THREE from 'three';
import { batchStatic, palette as P } from './kit.js';
import { createJourney, createTrafficSimulation } from './simulation.js';

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
  ['Dewi', 'Penjual bunga', 'Membawa warna dari Pasar Kenanga ke halaman tetangga.', '#bf9783'],
  ['Pak Udin', 'Pedagang sayur', 'Memilih sayur paling segar sebelum kios dibuka.', '#8b9d79'],
  ['Adit', 'Kurir pasar', 'Titipannya kecil. Perjalanannya melintasi seluruh kota.', '#bc9a66'],
  ['Bu Sulastri', 'Pedagang buah', 'Tahu mangga mana yang sudah manis tanpa perlu dibelah.', '#bd8c77'],
  ['Rio', 'Mekanik sepeda', 'Selalu punya waktu untuk ban kempis milik tetangga.', '#789d97'],
  ['Citra', 'Relawan pustaka', 'Merapikan buku dan menyimpan halaman favoritnya.', '#b49b79'],
  ['Pak Arif', 'Guru sekolah', 'Bel pulang bukan akhir dari percakapan di halaman.', '#a4ad8f'],
  ['Nino', 'Pelajar', 'Naik angkot 03 bersama Salsa, melewati sungai dan pasar.', '#c5b27e'],
  ['Salsa', 'Pelajar', 'Selalu memilih kursi dekat jendela angkot.', '#ab97aa'],
  ['Bu Rini', 'Perawat klinik', 'Menyempatkan jalan kaki di sela waktu istirahat.', '#83a69d'],
  ['Reno', 'Pembuat roti', 'Aroma roti hangat sudah lebih dulu sampai ke ujung jalan.', '#c4a27e'],
  ['Maya', 'Warga tepi air', 'Membawa buku kecil untuk dibaca di bawah pohon.', '#91a6ad'],
];

export function createPeople(dynamic, traffic) {
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
  // Routes follow sidewalks and the pedestrian bridge. Named stops have
  // dwell times; residents arrive, linger and leave instead of orbiting forever.
  const plans = [
    [[-12.9,-10.8,3,'Menyapa tetangga'],[-2.65,-10.8],[-2.65,-2.65],[-4.4,-2.65,10,'Berbelanja di depan Toko Mentari',false,false,'Toko Mentari'],[-12.9,-2.65]],
    [[2.7,-11.15],[12.75,-11.15],[12.75,-2.65,4,'Melihat taman'],[2.7,-2.65],[2.7,-6.3],[4.7,-6.4,15,'Duduk di bawah pohon',true,false,'bangku taman'],[2.7,-6.3]],
    [[-12.75,2.7],[-2.65,2.7],[-2.65,6.35],[-4.35,6.35,9,'Singgah di Studio Kecil',false,false,'Studio Kecil'],[-2.65,6.35],[-2.65,10.9],[-12.75,10.9]],
    [[2.7,2.7],[13.15,2.7],[13.15,11.45],[4.15,11.45,9,'Menyapa tetangga di pagar rumah',false,false,'rumah'],[2.7,11.45]],
    [[19.2,-11.2],[27.5,-11.2],[27.5,-2.65],[23.5,-2.65,10,'Memilih sayur di Pasar Kenanga',false,false,'Pasar Kenanga'],[19.2,-2.65]],
    [[19.2,2.65],[27.5,2.65],[27.5,10.9],[23.4,10.9,11,'Membeli roti hangat',false,false,'Ruko Kenanga'],[19.2,10.9]],
    [[2.7,-16],[13.5,-16],[13.5,-23.5],[16,-23.5],[16,-31.4,5,'Melihat halaman sekolah',false,false,'titian sungai'],[16,-23.5],[8,-23.5,14,'Membaca di tepi sungai',true,false,'bangku sungai'],[2.7,-23.5]],
    [[-12.75,-16],[-2.65,-16],[-2.65,-23.5],[-12.75,-23.5,8,'Beristirahat di dekat rusun',false,false,'Rusun Tepi Air']],
    [[33,-37.8],[41.6,-37.8],[41.6,-31.4],[33,-31.4,8,'Melihat permainan di lapangan',false,false,'lapangan sekolah']],
  ];
  const planFor = (i) => i < 28 ? plans[i % 4] : plans[[4,4,4,4,5,6,6,8,8,5,5,7][i-28]];
  const agents = residents.map(([name, job, story, color], i) => {
    const plan = planFor(i);
    const journey = createJourney(plan, { speed: 0.48 + (i % 5) * 0.065, start: i % plan.length, initialWait: i % 4 });
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
      id: `warga-${i}`, name, job, story, color, rig, parts, arms, legs, journey,
      speed: 0.48 + (i % 5) * 0.065,
      position: rig.position, heading: 0, seated: false, stationary: false,
      activity: ['Menikmati jalan sore', 'Berkeliling kampung', 'Menyapa tetangga', 'Menuju taman', 'Mencari tempat singgah'][i % 5],
    };
  });
  const setPlan = (index, points, speed = agents[index].speed) => { agents[index].journey = createJourney(points, { speed }); };
  setPlan(0, [[-7.6,10.8,20,'Menikmati kopi di teras',true],[-6.3,10.8],[-6.3,8.85],[-7.3,8.85,2,'Merapikan cangkir di pintu kafe',false,false,'teras Kopi Pagi',true],[-6.3,8.85],[-6.3,10.8],[-2.65,10.8],[-2.65,6.35],[-4.35,6.35,12,'Mengantar kopi ke studio',false,false,'Studio Kecil'],[-2.65,6.35],[-2.65,10.8]]);
  setPlan(1, [[-4.4,-3.55,25,'Menata buah di depan toko'],[-3.3,-3.55,9,'Memeriksa persediaan sayur'],[-4.4,-3.55,18,'Menyapa pelanggan toko']]);
  setPlan(2, [[-4.35,6.35,10,'Menggambar di teras studio'],[-2.65,6.35],[-2.65,2.7],[-12.75,2.7],[-12.75,10.8],[-2.65,10.8],[-2.65,6.35]]);
  setPlan(5, [[4.7,-6.4,26,'Duduk di bawah pohon',true],[2.7,-6.3],[2.7,-2.65],[7.3,-2.65],[7.3,-4.2,8,'Mendengarkan air mancur'],[2.7,-4.2],[2.7,-6.3]]);
  setPlan(8, [[-9.1,-3.8,34,'Menyiapkan nasi goreng'],[-10.6,-3.0,8,'Melayani pelanggan gerobak'],[-9.1,-3.8,18,'Merapikan panci dan bumbu']]);
  setPlan(18, [[2.8,9,19,'Bertukar kabar dengan tetangga'],[2.7,11.45],[7.9,11.45,10,'Singgah di halaman tetangga'],[2.7,11.45]]);
  setPlan(22, [[-4.45,8.7,34,'Bekerja dari teras kafe',true,false,'payung teras kafe',true],[-2.65,8.7],[-2.65,6.35],[-4.35,6.35,12,'Bertukar ide di Studio Kecil'],[-2.65,6.35],[-2.65,8.7]]);
  setPlan(23, [[6,-9.55,24,'Mendengarkan air mancur',true],[7.3,-9.55],[7.3,-8.7],[9.55,-6.3],[7.3,-4.2],[7.3,-8.7],[7.3,-9.55]]);

  const umbrellaAgents = [3,6,10,14,17,28,33,39];
  const canopies = new THREE.InstancedMesh(new THREE.ConeGeometry(0.38, 0.15, 8), new THREE.MeshStandardMaterial({ color: '#c1b07b', roughness: 0.9 }), umbrellaAgents.length);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012,0.012,0.65,5), new THREE.MeshStandardMaterial({color:'#7d7961'}), umbrellaAgents.length);
  canopies.frustumCulled = stems.frustumCulled = false; dynamic.add(canopies, stems);
  const pose = new THREE.Object3D();
  let commuterStop = 'kenanga', onBus = false, dropAt = -100;
  function update(time, delta, { rain = false, period = 'sore' } = {}) {
    const bus = traffic?.vehicles.find(v => v.type === 'angkot');
    const courier = traffic?.vehicles.find(v => v.type === 'courier');
    if (bus?.passengers) onBus = true;
    else if (onBus && bus?.stop) { onBus = false; commuterStop = bus.stop.id; dropAt = time; }
    agents.forEach((agent, i) => {
      const journey = agent.journey.update(delta, { rain });
      agent.position.set(journey.x, 0.31, journey.z); agent.heading = journey.heading;
      agent.sheltered = journey.sheltered; agent.stationary = !journey.moving; agent.seated = journey.seated; agent.hidden = journey.hidden;
      agent.activity = journey.activity;
      if (i === 1 && period === 'malam') agent.activity = 'Merapikan toko sebelum pulang';
      if (i === 30 && courier) {
        const age = courier.stopAge;
        agent.hidden = !courier.stop || courier.stop.id !== 'delivery'; agent.seated = false;
        const t = age < 6 ? Math.min(1, age / 6) : age < 8 ? 1 : Math.max(0, 1 - (age - 8) / 5);
        agent.position.set(courier.x + (23.5 - courier.x) * t, 0.31, courier.z + (-3.8 - courier.z) * t);
        agent.heading = age < 8 ? 2.5 : -0.6; agent.stationary = age >= 6 && age < 8;
        agent.carrying = age < 6; agent.activity = agent.hidden ? 'Mengantar persediaan dengan motor' : agent.stationary ? 'Menyerahkan kiriman ke pedagang' : 'Membawa kiriman untuk pasar';
        if (agent.hidden) agent.position.set(courier.x,0.31,courier.z);
      }
      if ((i === 35 || i === 36) && bus) {
        const curb = commuterStop === 'kenanga' ? {x:42.45,z:-7.4+(i-35)*2} : {x:5.15+(i-35)*2.1,z:-37.0};
        agent.hidden = onBus; agent.seated = false; agent.stationary = true;
        if (onBus) agent.position.set(bus.x,0.31,bus.z);
        else {
          const boarding = bus.stop?.id === commuterStop && bus.stopAge < 3 && (traffic.waiting[commuterStop] || 0) > 0;
          const approach = boarding ? Math.min(1,bus.stopAge/3) : Math.max(0,1-(time-dropAt)/3);
          agent.position.set(curb.x+(bus.x-curb.x)*approach,0.31,curb.z+(bus.z-curb.z)*approach);
          agent.stationary = approach === 0; agent.heading = Math.atan2(bus.x-curb.x,bus.z-curb.z);
        }
        agent.activity = onBus ? 'Naik angkot 03 keliling kota' : agent.stationary ? `Menunggu angkot di ${commuterStop === 'kenanga' ? 'Halte Kenanga' : 'Halte Sekolah'}` : 'Berjalan naik / turun angkot';
      }
      agent.rig.rotation.y = agent.heading; agent.rig.scale.setScalar(agent.hidden ? 0 : 1);
      const phase = time * 6 * agent.speed + i * 1.7;
      const stride = agent.stationary ? 0 : Math.sin(phase) * 0.48;
      const floor = Math.abs(agent.position.x-16) < 0.8 && agent.position.z < -24.2 && agent.position.z > -30.8 ? 0.43 : 0.31;
      agent.position.y = agent.seated ? 0.34 : floor + (agent.stationary ? 0 : Math.abs(Math.sin(phase)) * 0.015);
      agent.arms[0].rotation.x = stride * 0.8; agent.arms[1].rotation.x = -stride * 0.8;
      agent.legs[0].rotation.x = agent.seated ? -1.25 : -stride; agent.legs[1].rotation.x = agent.seated ? -1.25 : stride;
      if (agent.stationary) agent.arms[1].rotation.z = Math.sin(time * 0.7 + i) * 0.07 - 0.06;
      agent.rig.updateMatrixWorld(true);
      agent.parts.forEach(({ object, key, index }) => meshes[key].setMatrixAt(index, object.matrixWorld));
    });
    umbrellaAgents.forEach((index,i) => {
      const a = agents[index]; pose.position.copy(a.position); pose.position.y += 1.16;
      pose.scale.setScalar(!a.hidden && !a.seated ? 1 : 0); pose.updateMatrix(); canopies.setMatrixAt(i,pose.matrix);
      pose.position.y -= 0.33; pose.updateMatrix(); stems.setMatrixAt(i,pose.matrix);
    });
    canopies.visible = stems.visible = rain;
    canopies.instanceMatrix.needsUpdate = stems.instanceMatrix.needsUpdate = true;
    Object.values(meshes).forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  }
  update(0, 0);
  return { agents, update, getState: () => ({ walking: agents.filter(a=>!a.stationary&&!a.hidden).length, resting: agents.filter(a=>a.stationary&&!a.hidden).length, onTransport: agents.filter(a=>a.hidden).length, sheltering: agents.filter(a=>a.sheltered&&!a.hidden).length, arrivals: agents.reduce((n,a)=>n+a.journey.state.arrivals,0) }) };
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
    const rider = new THREE.Group();
    if (!parked) {
      box(0.24, 0.3, 0.2, 0, 0.86, -0.05, '#aa976c', rider);
      ball(0.13, 0, 1.12, -0.03, '#617e77', rider);
      [-1, 1].forEach((s) => {
        box(0.07, 0.23, 0.08, s * 0.16, 0.8, 0.1, '#a68f6b', rider).rotation.x = -0.8;
        box(0.08, 0.23, 0.09, s * 0.16, 0.56, -0.02, '#657265', rider);
      });
    }
    batchStatic(g);
    if (!parked) { batchStatic(rider); g.add(rider); g.userData.rider = rider; }
    contactShadow(g, 0.48, 1.0); return g;
  }
  const simulation = createTrafficSimulation();
  const vehicles = simulation.vehicles;
  vehicles.forEach(v => {
    v.mesh = ['scooter','courier'].includes(v.type) ? scooter(v.color) : car(v.color,v.type);
    if (v.type === 'angkot') {
      const passengers = new THREE.Group(); v.mesh.add(passengers);
      [-1,1].forEach(side=>ball(0.075,side*0.43,0.99,-0.3,'#d0a581',passengers));
      batchStatic(passengers); v.passengerMesh = passengers;
    }
    if (v.type === 'courier') {
      box(0.48,0.4,0.42,0,0.72,-0.37,'#c6aa79',v.mesh);
    }
    const brakeMaterial = new THREE.MeshStandardMaterial({color:'#a66b53',emissive:'#ef6a44',emissiveIntensity:0.05});
    const brakes = new THREE.Group(); v.mesh.add(brakes);
    [-1,1].forEach(side => box(0.12,0.08,0.035,side*(['scooter','courier'].includes(v.type)?0.1:0.27),0.46,-v.length/2-0.01,brakeMaterial,brakes));
    batchStatic(brakes); v.brakeMaterial = brakeMaterial;
  });
  [[-3,-4.8,Math.PI/2,'#7d9c8c'],[6.35,8.8,0.25,'#d2b178'],[33.2,9.5,0,'#b58675'],[19.5,-2.8,Math.PI/2,'#7d9c8c']].forEach(([x,z,a,color])=>{
    const m=scooter(color,true);m.position.set(x,0.29,z);m.rotation.set(0,a,-0.12);
  });
  function update(time, delta) {
    simulation.update(delta);
    vehicles.forEach(v=>{
      v.mesh.position.set(v.x,0.19,v.z); v.mesh.rotation.y=Math.atan2(v.dx,v.dz);
      v.brakeMaterial.emissiveIntensity = v.speed < 0.4 ? 1.5 : 0.06;
      if (v.passengerMesh) v.passengerMesh.visible = v.passengers > 0;
      if (v.mesh.userData.rider) v.mesh.userData.rider.visible = !(v.type === 'courier' && v.stop);
    });
  }
  update(0,0);
  return { ...simulation, vehicles, update };
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
