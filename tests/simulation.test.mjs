import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WORLD, DISTRICTS, signalAt, makeCityLanes, createTrafficSimulation, createJourney, createDirector, createQualityController } from '../src/world/simulation.js';
import { createKit, batchStatic, material } from '../src/world/kit.js';

const advance = (model, seconds, step = 1 / 30) => { for (let t = 0; t < seconds - 1e-7; t += step) model.update(Math.min(step, seconds - t)); };

test('three distinct districts fit in a continuous world over three times the original footprint', () => {
  assert.equal(DISTRICTS.length, 3);
  assert.ok(WORLD.width * WORLD.depth > 36 * 32 * 3);
  for (const d of DISTRICTS) {
    assert.ok(Math.abs(d.x - WORLD.x) < WORLD.width / 2);
    assert.ok(Math.abs(d.z - WORLD.z) < WORLD.depth / 2);
  }
});

test('traffic lights never give both axes green; all-red pedestrian clearance is real', () => {
  let clearance = 0;
  for (let t = 0; t < 96; t += 0.1) {
    const light = signalAt(t);
    assert.ok(!(light.vertical === 'green' && light.horizontal === 'green'));
    if (light.pedestrian) { assert.equal(light.vertical, 'red'); assert.equal(light.horizontal, 'red'); clearance++; }
  }
  assert.ok(clearance > 100);
  assert.equal(signalAt(11).vertical, 'amber');
  assert.equal(signalAt(27).horizontal, 'amber');
  assert.deepEqual(signalAt(5, 8), signalAt(13));
});

test('rounded lanes have finite arc lengths, stable headings and stay on the board', () => {
  for (const lane of makeCityLanes()) {
    assert.ok(lane.length > 100);
    for (let d = 0; d < lane.length; d += 0.25) {
      const p = lane.sample(d);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z));
      assert.ok(p.x >= -16.1 && p.x <= 45.3 && p.z >= -40.2 && p.z <= 14);
      assert.ok(Math.abs(Math.hypot(p.dx, p.dz) - 1) < 1e-6);
    }
    assert.deepEqual(lane.sample(0), lane.sample(lane.length));
  }
});

test('a car brakes BEFORE the stop line, holds at red, then leaves on green', () => {
  const lanes = makeCityLanes();
  const model = createTrafficSimulation({ lanes, configs: [{ lane: 2, speed: 3, distance: lanes[2].nearestDistance(-8, -0.82) }] });
  advance(model, 8);
  const car = model.vehicles[0];
  assert.ok(car.x < -5.4, `front bumper crossed the line: ${car.x}`);
  assert.ok(car.speed < 0.1);
  const stopped = car.x;
  advance(model, 5);
  assert.ok(Math.abs(car.x - stopped) < 0.03);
  advance(model, 8);
  assert.ok(car.x > 0, 'green must release the queue');
});

test('a faster following car queues with a bumper gap instead of driving through its leader', () => {
  const lanes = makeCityLanes();
  const model = createTrafficSimulation({ lanes, configs: [
    { lane: 2, speed: 1.2, distance: lanes[2].nearestDistance(-7, -0.82) },
    { lane: 2, speed: 3, distance: lanes[2].nearestDistance(-13, -0.82) },
  ] });
  const [leader, follower] = model.vehicles;
  let queued = false;
  for (let i = 0; i < 70 * 30; i++) {
    model.update(1 / 30);
    assert.ok(leader.distance - follower.distance >= 2.34 - 1e-6, 'follower overtook / overlapped');
    queued ||= follower.reason === 'queue';
  }
  assert.ok(queued);
});

test('the angkot really dwells, boards passengers and drops them at the other stop', () => {
  const model = createTrafficSimulation(), bus = model.vehicles.find(v => v.type === 'angkot');
  advance(model, 7);
  assert.equal(bus.stop.id, 'kenanga');
  assert.equal(bus.speed, 0);
  assert.equal(bus.passengers, 2);
  const position = { x: bus.x, z: bus.z };
  advance(model, 2);
  assert.deepEqual({ x: bus.x, z: bus.z }, position);
  advance(model, 60);
  assert.equal(model.getState().boarded, 2);
  assert.equal(bus.passengers, 0);
  assert.equal(model.waiting.sekolah, 2);
});

test('courier deliveries happen only after arriving and waiting; simulation pause freezes all vehicles', () => {
  const model = createTrafficSimulation();
  advance(model, 5);
  assert.equal(model.getState().delivered, 0);
  advance(model, 8);
  assert.equal(model.getState().delivered, 1);
  const before = model.vehicles.map(v => [v.distance, v.speed, v.dwell]);
  for (let i = 0; i < 100; i++) model.update(0);
  assert.deepEqual(model.vehicles.map(v => [v.distance, v.speed, v.dwell]), before);
});

test('large simulation steps are substepped and produce the same traffic as ordinary frames', () => {
  const small = createTrafficSimulation(), fast = createTrafficSimulation();
  advance(small, 30); advance(fast, 30, 0.5);
  small.vehicles.forEach((v, i) => assert.ok(Math.abs(v.distance - fast.vehicles[i].distance) < 0.04));
  assert.equal(small.getState().delivered, fast.getState().delivered);
});

test('residents walk to a destination, dwell there, sit and then continue their journey', () => {
  const journey = createJourney([[0, 0, 1, 'Menunggu'], [2, 0, 3, 'Membaca di bangku', true], [2, 2, 1, 'Menyapa']], { speed: 1 });
  journey.update(0.5); assert.equal(journey.state.moving, false);
  journey.update(2.6); assert.equal(journey.state.x, 2); assert.equal(journey.state.seated, true); assert.equal(journey.state.activity, 'Membaca di bangku');
  journey.update(2); assert.equal(journey.state.x, 2); assert.equal(journey.state.z, 0);
  journey.update(2); assert.ok(journey.state.z > 0); assert.equal(journey.state.seated, false); assert.ok(journey.state.arrivals > 0);
  const frozen = { ...journey.state }; journey.update(0); assert.deepEqual(journey.state, frozen);
});

test('rain keeps a resident physically under a covered stop until it clears', () => {
  const journey = createJourney([[0,0,1,'Membaca',true,false,'teras kafe',true],[4,0,0,'Berjalan']], { speed: 1 });
  journey.update(20, { rain: true });
  assert.equal(journey.state.x,0); assert.equal(journey.state.moving,false);
  assert.equal(journey.state.sheltered,true); assert.match(journey.state.activity,/Berteduh/);
  journey.update(2, { rain: false });
  assert.ok(journey.state.x>0); assert.equal(journey.state.sheltered,false);
});

test('cinematic direction loops through all six shots and explicit stop prevents automatic takeover', () => {
  const director = createDirector(), visited = new Set();
  assert.equal(director.start().id, 'kota');
  for (let i = 0; i < 80; i++) { director.update(1); visited.add(director.getState().shot); }
  assert.equal(visited.size, 6); assert.ok(visited.has('angkot'));
  director.stop(); const before = director.getState(); assert.equal(director.update(500), null); assert.deepEqual(director.getState(), before);
});

test('automatic quality degrades under sustained slow frames, not on one hitch; manual settings remain respected', () => {
  const quality = createQualityController(true);
  assert.equal(quality.getState().tier, 'seimbang');
  quality.sample(0.2, 0.2); assert.equal(quality.getState().tier, 'seimbang');
  for (let i = 0; i < 40; i++) quality.sample(0.1, 0.1);
  assert.equal(quality.getState().tier, 'hemat');
  quality.setMode('detail');
  for (let i = 0; i < 100; i++) quality.sample(0.1, 0.1);
  assert.equal(quality.getState().tier, 'detail');
  assert.equal(quality.setMode('invalid'), false);
  assert.equal(quality.getState().mode, 'detail');
});

test('spatial vertex-colour batches reduce calls, keep editable night materials and expose real fine-detail LOD', () => {
  const root = new THREE.Group(), kit = createKit(root);
  const night = material('#567974', { emissive: '#ffbf69', emissiveIntensity: 0 });
  kit.box(3, 3, 3, 0, 1.5, 0, '#dcad88');
  kit.box(3, 3, 3, 4, 1.5, 0, '#a4b6a0');
  kit.box(0.1, 0.5, 0.1, 1, 0.5, 0, '#966f4d');
  kit.box(1, 1, 0.04, 0, 1.5, 1.55, night);
  kit.box(3, 3, 3, 25, 1.5, 0, '#dfbf77');
  const stats = batchStatic(root, { chunkSize: 14 });
  assert.equal(stats.originalMeshes, 5); assert.equal(stats.chunks, 2); assert.equal(stats.detailBatches, 1);
  assert.ok(root.children.some(m => m.material.vertexColors));
  assert.ok(root.children.some(m => m.material === night));
  for (const m of root.children) { assert.ok(m.geometry.boundingSphere); assert.equal(m.frustumCulled, true); }
});


// Separating-axis test against oriented vehicle bodies, not just centres.
function bodiesOverlap(a,b) {
  const dx=b.x-a.x,dz=b.z-a.z;
  if(Math.hypot(dx,dz)>2.6) return false;
  const width=v=>['scooter','courier'].includes(v.type)?0.53:1.02;
  for(const [x,z] of [[a.dx,a.dz],[-a.dz,a.dx],[b.dx,b.dz],[-b.dz,b.dx]]) {
    const ra=Math.abs(a.dx*x+a.dz*z)*a.length/2+Math.abs(-a.dz*x+a.dx*z)*width(a)/2;
    const rb=Math.abs(b.dx*x+b.dz*z)*b.length/2+Math.abs(-b.dz*x+b.dx*z)*width(b)/2;
    if(Math.abs(dx*x+dz*z)>=ra+rb-0.025) return false;
  }
  return true;
}

test('ten minutes of mixed traffic avoid crossing overlaps and keep making trips without junction deadlock', () => {
  const model = createTrafficSimulation();
  const starting = model.vehicles.map(v=>v.distance);
  for (let frame=0;frame<600*30;frame++) {
    model.update(1/30);
    for(let i=0;i<model.vehicles.length;i++) for(let j=i+1;j<model.vehicles.length;j++) {
      const a=model.vehicles[i],b=model.vehicles[j];
      assert.ok(!bodiesOverlap(a,b), `${a.id} crossed through ${b.id}`);
    }
  }
  assert.ok(model.getState().completedStops>10, 'traffic must keep serving stops, not just freeze safely');
  assert.ok(model.getState().delivered>=4);
  assert.ok(model.getState().boarded>=6);
  model.vehicles.forEach((v,i)=>assert.ok(v.distance-starting[i]>v.lane.length, `${v.id} stalled for an entire observation`));
});
