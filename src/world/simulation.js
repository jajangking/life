// Deterministic, renderer-independent city life. Seconds below are simulation
// seconds, so pause/speed affect cars, passengers, deliveries and residents alike.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const mod = (n, d) => ((n % d) + d) % d;

export const WORLD = { x: 14, z: -13, width: 64, depth: 58 };
export const DISTRICTS = [
  { id: 'mentari', name: 'Kampung Mentari', subtitle: 'Teras kopi & rumah tetangga', x: -1, z: 0, zoom: 1.9, icon: 'house' },
  { id: 'kenanga', name: 'Pasar Kenanga', subtitle: 'Kios, ruko & angkot 03', x: 31, z: -1, zoom: 2.35, icon: 'shop' },
  { id: 'sungai', name: 'Tepi Sungai', subtitle: 'Rusun, sekolah & titian air', x: 13, z: -28, zoom: 1.95, icon: 'leaf' },
];
export const INTERSECTIONS = [{ x: 0, z: 0, offset: 0 }, { x: 30, z: 0, offset: 8 }];
const GIVE_WAY = [[-15.2,-39.4],[44.5,-39.4],[-15.2,13.2],[44.5,13.2],[-15.2,0],[44.5,0],[0,-39.4],[30,-39.4],[0,-13.2],[30,-13.2],[0,13.2],[30,13.2]];

export function signalAt(time, offset = 0) {
  const t = mod(time + offset, 32);
  return {
    vertical: t < 10 ? 'green' : t < 12 ? 'amber' : 'red',
    horizontal: t >= 16 && t < 26 ? 'green' : t >= 26 && t < 28 ? 'amber' : 'red',
    pedestrian: (t >= 12 && t < 16) || t >= 28,
  };
}

// Rounded, arc-length sampled lanes. Unlike a Catmull-Rom loop, these fillets
// cannot bulge across a sidewalk at a rectangular street corner.
export function makeLane(corners, radius = 1.35) {
  const points = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[(i + corners.length - 1) % corners.length], b = corners[i], c = corners[(i + 1) % corners.length];
    const ab = Math.hypot(a[0] - b[0], a[1] - b[1]), cb = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(radius, ab / 3, cb / 3);
    const entry = [b[0] + (a[0] - b[0]) / ab * r, b[1] + (a[1] - b[1]) / ab * r];
    const exit = [b[0] + (c[0] - b[0]) / cb * r, b[1] + (c[1] - b[1]) / cb * r];
    for (let j = 0; j <= 10; j++) {
      const t = j / 10, u = 1 - t;
      points.push([u * u * entry[0] + 2 * u * t * b[0] + t * t * exit[0], u * u * entry[1] + 2 * u * t * b[1] + t * t * exit[1]]);
    }
  }
  const segments = [];
  let length = 0;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length], size = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (size < 1e-6) return;
    segments.push({ a, b, start: length, size }); length += size;
  });
  const sample = (distance) => {
    const d = mod(distance, length);
    const s = segments.find((part) => d <= part.start + part.size) || segments[segments.length - 1];
    const t = clamp((d - s.start) / s.size, 0, 1);
    return { x: s.a[0] + (s.b[0] - s.a[0]) * t, z: s.a[1] + (s.b[1] - s.a[1]) * t, dx: (s.b[0] - s.a[0]) / s.size, dz: (s.b[1] - s.a[1]) / s.size };
  };
  const nearestDistance = (x, z) => {
    let best = Infinity, result = 0;
    for (const s of segments) {
      const t = clamp(((x - s.a[0]) * (s.b[0] - s.a[0]) + (z - s.a[1]) * (s.b[1] - s.a[1])) / (s.size * s.size), 0, 1);
      const distance = Math.hypot(x - s.a[0] - (s.b[0] - s.a[0]) * t, z - s.a[1] - (s.b[1] - s.a[1]) * t);
      if (distance < best) { best = distance; result = s.start + s.size * t; }
    }
    return result;
  };
  return { length, sample, nearestDistance };
}

export function makeCityLanes() {
  return [
    makeLane([[-14.4, 12.5], [43.7, 12.5], [43.7, -38.6], [-14.4, -38.6]]),
    makeLane([[-15.9, 13.9], [-15.9, -40.1], [45.2, -40.1], [45.2, 13.9]]),
    makeLane([[-15.9, -0.82], [45.2, -0.82], [45.2, 13.9], [-15.9, 13.9]]),
    makeLane([[0.82, -40.1], [0.82, 13.9], [-15.9, 13.9], [-15.9, -40.1]]),
    makeLane([[-0.82, -40.1], [30.82, -40.1], [30.82, 13.9], [-0.82, 13.9]]),
  ];
}

export function createTrafficSimulation({ lanes = makeCityLanes(), intersections = INTERSECTIONS, configs } = {}) {
  const busStops = [
    { id: 'kenanga', name: 'Halte Kenanga', x: 43.7, z: -6.4, wait: 11 },
    { id: 'sekolah', name: 'Halte Sekolah', x: 6.2, z: -38.6, wait: 9 },
  ];
  const defaults = [
    { type: 'angkot', color: '#739980', lane: 0, speed: 2.25, stops: busStops, nearStop: true },
    { type: 'courier', color: '#bb8c55', lane: 2, speed: 2.5, stops: [{ id: 'delivery', name: 'Kiriman untuk Pasar Kenanga', x: 21.5, z: -0.82, wait: 13 }], nearStop: true },
    ...Array.from({ length: 14 }, (_, i) => ({ type: i % 4 === 0 ? 'scooter' : 'car', color: ['#d8bc7a', '#b77d60', '#d8d7c0', '#809fa4', '#879b79'][i % 5], lane: i % 5, fraction: 0.13 + i * 0.157, speed: 2.1 + (i % 4) * 0.19 })),
  ];
  const vehicles = [];
  for (const [i, config] of (configs || defaults).entries()) {
    const lane = lanes[config.lane || 0];
    const stops = (config.stops || []).map((stop) => ({ ...stop, distance: lane.nearestDistance(stop.x, stop.z), lastLap: -1 }));
    let distance = config.distance ?? (config.nearStop ? stops[0].distance - 3.5 : mod(config.fraction || 0, 1) * lane.length);
    for (let attempts = 0; attempts < 100; attempts++) {
      const p = lane.sample(distance);
      if (!vehicles.some((v) => Math.hypot(v.x - p.x, v.z - p.z) < 3.1 || GIVE_WAY.some(([x,z])=>Math.hypot(v.x-x,v.z-z)<5.5 && Math.hypot(p.x-x,p.z-z)<5.5))) break;
      distance += 3.2;
    }
    vehicles.push({ id: `vehicle-${i}`, type: config.type || 'car', color: config.color || '#879b79', lane, distance, maxSpeed: config.speed || 2.3, speed: 0,
      length: config.type === 'angkot' ? 2 : ['scooter', 'courier'].includes(config.type) ? 1.05 : 1.8,
      stops, priority: (config.lane || 0) < 2 ? 3 : config.lane === 2 ? 2 : 1, signalBlocked: false, dwell: 0, stop: null, stopAge: 0, serviced: false, reason: 'moving', passengers: 0, ...lane.sample(distance) });
  }
  let time = 0, delivered = 0, boarded = 0, completedStops = 0;
  const waiting = { kenanga: 2, sekolah: 0 }, history = [], pending = [];
  const junctions = GIVE_WAY.map(([x,z])=>({x,z,owner:null,entered:false,reservedAt:0}));
  const emit = (event) => { const e = { ...event, time }; history.push(e); pending.push(e); if (history.length > 24) history.shift(); };
  function update(delta) {
    // Fixed upper substep, including when the user selects 4×. All cars use the
    // same snapshot so iteration order cannot let a follower pass its leader.
    let remaining = Math.max(0, delta);
    while (remaining > 1e-8) {
      const dt = Math.min(1 / 30, remaining); remaining -= dt; time += dt;
      const snapshots = vehicles.map((v) => ({ x: v.x, z: v.z, dx: v.dx, dz: v.dz, length: v.length, speed: v.speed, lane: v.lane, distance: v.distance, blocked: v.signalBlocked || v.dwell > 0, priority: v.priority }));
      const forecasts = vehicles.map(v => Array.from({length: 21}, (_,i) => v.lane.sample(v.distance + i*0.5)));
      // Reserve the whole unsignalled conflict area, including a turning arc.
      // A claim is released only after the rear of the vehicle clears it.
      for (const junction of junctions) {
        if (junction.owner !== null) {
          const owner = snapshots[junction.owner], distance = Math.hypot(owner.x-junction.x,owner.z-junction.z);
          if (distance<4.3) junction.entered=true;
          if ((junction.entered && distance>4.35) || (!junction.entered && time-junction.reservedAt>12)) junction.owner=null;
        }
        if (junction.owner===null) {
          let score=Infinity;
          snapshots.forEach((v,i)=>{
            const entry=forecasts[i].findIndex(p=>Math.hypot(p.x-junction.x,p.z-junction.z)<4.3);
            if(entry<0) return;
            const rank=entry*0.5/Math.max(v.speed,0.8)-v.priority*0.2;
            if(rank<score){score=rank;junction.owner=i;}
          });
          junction.entered=false;junction.reservedAt=time;
        }
      }
      vehicles.forEach((v, index) => {
        if (v.dwell > 0) {
          v.dwell = Math.max(0, v.dwell - dt); v.stopAge += dt; v.speed = 0; v.reason = 'stop';
          if (!v.serviced && v.stopAge >= (v.type === 'angkot' ? 3 : 7)) {
            v.serviced = true;
            if (v.type === 'angkot') {
              if (v.passengers) { waiting[v.stop.id] += v.passengers; v.passengers = 0; }
              else { v.passengers = waiting[v.stop.id] || 0; waiting[v.stop.id] = 0; boarded += v.passengers; }
              emit({ kind: 'passengers', stop: v.stop.id, passengers: v.passengers, vehicle: v.id, x: v.x, z: v.z });
            } else { delivered++; emit({ kind: 'delivery', vehicle: v.id, x: 23.5, z: -4, title: 'Kiriman baru tiba di pasar' }); }
          }
          if (!v.dwell) { v.stop = null; v.reason = 'moving'; }
          return;
        }
        let desired = v.maxSpeed, clearance = Infinity, reason = 'moving';
        v.signalBlocked = false;
        const p = snapshots[index];
        snapshots.forEach((other, j) => {
          if (j === index) return;
          const dx = other.x - p.x, dz = other.z - p.z;
          // Arc-length headway survives a corner, where two cars on the same
          // lane can temporarily have perpendicular headings.
          const sameLane = other.lane === p.lane;
          const ahead = sameLane ? mod(other.distance - p.distance, v.lane.length) : dx * p.dx + dz * p.dz;
          const lateral = sameLane ? 0 : Math.abs(dx * p.dz - dz * p.dx);
          if (!sameLane && other.dx * p.dx + other.dz * p.dz < 0.55) return;
          if (ahead > 0 && ahead < 11 && lateral < 0.68) {
            const space = Math.max(0, ahead - (v.length + other.length) / 2 - 0.55);
            clearance = Math.min(clearance, space);
            const limit = Math.min(Math.sqrt(5 * space), other.speed + space * 0.72);
            if (limit < desired) { desired = limit; reason = 'queue'; }
          }
        });
        for (const cross of intersections) {
          const vertical = Math.abs(p.dz) > 0.95, horizontal = Math.abs(p.dx) > 0.95;
          if (!vertical && !horizontal) continue;
          const side = vertical ? Math.abs(p.x - cross.x) : Math.abs(p.z - cross.z);
          const ahead = vertical ? (cross.z - p.z) * p.dz : (cross.x - p.x) * p.dx;
          const toLine = ahead - 4.55 - v.length / 2;
          if (side < 1.5 && toLine >= -0.025 && toLine < 10 && signalAt(time, cross.offset)[vertical ? 'vertical' : 'horizontal'] !== 'green') {
            v.signalBlocked = true;
            clearance = Math.min(clearance, Math.max(0, toLine));
            const limit = Math.sqrt(5 * Math.max(0, toLine));
            if (limit < desired) { desired = limit; reason = 'signal'; }
          }
        }
        for (const junction of junctions) {
          if (junction.owner===index || junction.owner===null) continue;
          const entry=forecasts[index].findIndex(point=>Math.hypot(point.x-junction.x,point.z-junction.z)<4.3);
          if(entry<0) continue;
          const gap=Math.max(0,entry*0.5-v.length/2-0.7);
          clearance=Math.min(clearance,gap);
          const limit=Math.sqrt(5*gap);if(limit<desired){desired=limit;reason='yield';}
        }
        for (const stop of v.stops) {
          const lap = Math.floor(v.distance / v.lane.length);
          if (stop.lastLap === lap) continue;
          const ahead = mod(stop.distance - mod(v.distance, v.lane.length), v.lane.length);
          if (ahead < 0.025) {
            stop.lastLap = lap; v.dwell = stop.wait; v.stop = stop; v.stopAge = 0; v.serviced = false; completedStops++;
            v.speed = 0; v.reason = 'stop';
            emit({ kind: 'stop', vehicle: v.id, stop: stop.id, x: v.x, z: v.z, title: v.type === 'angkot' ? `Angkot 03 singgah di ${stop.name}` : 'Kurir singgah di Pasar Kenanga' });
            return;
          }
          if (ahead < 9) { clearance = Math.min(clearance, ahead); desired = Math.min(desired, Math.sqrt(5 * ahead)); }
        }
        const acceleration = desired > v.speed ? 1.15 : 3.4;
        v.speed += clamp(desired - v.speed, -acceleration * dt, acceleration * dt);
        v.distance += Math.min(v.speed * dt, clearance);
        Object.assign(v, v.lane.sample(v.distance)); v.reason = reason;
      });
    }
  }
  return {
    vehicles, waiting, update,
    inspectJunctions() { return junctions.map(j=>({...j})); },
    consumeEvents() { return pending.splice(0); },
    getState() { return { vehicles: vehicles.length, waitingAtLights: vehicles.filter((v) => v.reason === 'signal' && v.speed < 0.2).length,
      queued: vehicles.filter((v) => ['queue','yield'].includes(v.reason) && v.speed < 0.4).length, boarded, delivered, completedStops, passengers: vehicles.find((v) => v.type === 'angkot')?.passengers || 0, history: history.slice(-5) }; },
  };
}

export function createJourney(points, { speed = 0.55, start = 0, initialWait = null } = {}) {
  let index = mod(start, points.length), next = (index + 1) % points.length;
  const first = points[index], hasShelter = points.some(p => p[7]);
  const state = { x: first[0], z: first[1], heading: 0, wait: initialWait ?? first[2] ?? 0, moving: false, sheltered: false, arrivals: 0, activity: first[3] || 'Menikmati suasana', seated: !!first[4], hidden: !!first[5] };
  function update(delta, { rain = false } = {}) {
    let left = Math.max(0, delta), guard = 0;
    while (left > 1e-8 && guard++ < 100) {
      const current = points[index];
      // A real covered stop: stay under its roof, not just change the caption.
      if (rain && current[7] && Math.hypot(state.x-current[0],state.z-current[1]) < 1e-5) {
        state.moving = false; state.sheltered = true;
        state.activity = `Berteduh di ${current[6] || 'teras'}`;
        break;
      }
      if (state.sheltered) state.activity = current[3] || 'Menikmati suasana';
      state.sheltered = false;
      if (state.wait > 0) {
        const step = Math.min(left, state.wait); state.wait -= step; left -= step; state.moving = false;
        if (state.wait > 0) break;
      }
      const target = points[next], dx = target[0] - state.x, dz = target[1] - state.z, distance = Math.hypot(dx, dz);
      if (distance < 1e-5) {
        index = next; next = (next + 1) % points.length; state.arrivals++;
        state.wait = target[2] || 0;
        state.activity = target[3] || 'Singgah sebentar'; state.seated = !!target[4]; state.hidden = !!target[5];
        continue;
      }
      state.seated = false; state.hidden = false; state.moving = true;
      state.activity = rain ? hasShelter ? 'Menuju tempat teduh' : 'Berjalan melewati gerimis' : `Menuju ${target[6] || 'sudut kampung berikutnya'}`;
      const velocity = speed * (rain ? 1.12 : 1), duration = distance / velocity, used = Math.min(left, duration);
      state.x += dx / distance * velocity * used; state.z += dz / distance * velocity * used;
      state.heading = Math.atan2(dx, dz); left -= used;
      if (used < duration) break;
    }
    return state;
  }
  return { state, update };
}

export const CINEMA_SHOTS = [
  { id: 'kota', title: 'Tiga kawasan, satu cerita', x: 14, z: -13, zoom: 1, duration: 10 },
  { id: 'kopi', title: 'Pagi yang panjang di teras kopi', x: -8, z: 7, zoom: 3.5, duration: 10 },
  { id: 'pasar', title: 'Obrolan di Pasar Kenanga', x: 24, z: -6, zoom: 3.5, duration: 11 },
  { id: 'angkot', title: 'Keliling kota bersama angkot 03', vehicle: 'angkot', zoom: 3.1, duration: 12 },
  { id: 'sungai', title: 'Pelan-pelan di tepi sungai', x: 14, z: -27, zoom: 2.8, duration: 11 },
  { id: 'sekolah', title: 'Pulang sekolah, mampir sebentar', x: 18, z: -35, zoom: 3.1, duration: 10 },
];
export function createDirector(shots = CINEMA_SHOTS) {
  let active = false, index = 0, elapsed = 0;
  return {
    start() { active = true; index = 0; elapsed = 0; return shots[index]; },
    stop() { active = false; elapsed = 0; },
    update(delta) {
      if (!active) return null;
      elapsed += Math.max(0, delta);
      let changed = false;
      while (elapsed >= shots[index].duration) { elapsed -= shots[index].duration; index = (index + 1) % shots.length; changed = true; }
      return changed ? shots[index] : null;
    },
    getState() { return { active, index, elapsed, shot: shots[index].id, title: shots[index].title }; },
    get shot() { return shots[index]; },
  };
}

export const QUALITY = {
  hemat: { label: 'Hemat', pixelRatio: 1, shadows: false, shadowSize: 1024, fineDetail: false, fps: 30, rain: 160 },
  seimbang: { label: 'Seimbang', pixelRatio: 1.25, shadows: true, shadowSize: 1024, fineDetail: true, fps: 40, rain: 260 },
  detail: { label: 'Detail', pixelRatio: 1.8, shadows: true, shadowSize: 2048, fineDetail: true, fps: 40, rain: 420 },
};
export function createQualityController(compact = false) {
  let mode = 'auto', tier = compact ? 'seimbang' : 'detail', slow = 0, fast = 0, cooldown = 0;
  return {
    setMode(value) { if (value !== 'auto' && !QUALITY[value]) return false; mode = value; tier = value === 'auto' ? compact ? 'seimbang' : 'detail' : value; slow = fast = 0; cooldown = 5; return true; },
    sample(frameSeconds, delta) {
      if (mode !== 'auto') return false;
      cooldown = Math.max(0, cooldown - delta);
      slow = frameSeconds > 0.055 ? slow + delta : Math.max(0, slow - delta);
      fast = frameSeconds < 0.034 ? fast + delta : 0;
      const tiers = ['hemat', 'seimbang', 'detail'], i = tiers.indexOf(tier);
      if (!cooldown && slow > 2.5 && i > 0) { tier = tiers[i - 1]; slow = fast = 0; cooldown = 8; return true; }
      if (!cooldown && fast > 20 && i < (compact ? 1 : 2)) { tier = tiers[i + 1]; slow = fast = 0; cooldown = 15; return true; }
      return false;
    },
    getState() { return { mode, tier, ...QUALITY[tier] }; },
  };
}
