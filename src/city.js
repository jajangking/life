import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createKit, batchStatic, material } from './world/kit.js';
import { createProps } from './world/props.js';
import { buildStreets } from './world/streets.js';
import { buildNeighborhood } from './world/buildings.js';
import { buildDistricts } from './world/districts.js';
import { createPeople, createTraffic, createBirds } from './world/life.js';
import { WORLD, DISTRICTS, signalAt, createDirector, createQualityController } from './world/simulation.js';
import { createWeather } from './world/weather.js';

export { DISTRICTS } from './world/simulation.js';
export const COMPACT_QUERY = '(max-width: 760px), (max-width: 1000px) and (max-height: 500px)';
export const periods = {
  pagi: { label: 'Pagi', hour: 7, minute: 42, background: '#e9eee3', sun: '#ffe9c1', intensity: 3.5, ambient: 2.5, night: 0, position: [-25, 30, -10], temperature: '24°', greeting: 'Pagi yang penuh kemungkinan.' },
  siang: { label: 'Siang', hour: 12, minute: 12, background: '#e9eee6', sun: '#fff1d3', intensity: 3.8, ambient: 2.6, night: 0, position: [-10, 40, 15], temperature: '29°', greeting: 'Kehidupan di bawah hangat mentari.' },
  sore: { label: 'Sore', hour: 16, minute: 24, background: '#e9ece4', sun: '#ffe0af', intensity: 3.4, ambient: 2.3, night: 0.04, position: [-26, 30, 22], temperature: '27°', greeting: 'Tidak ada yang perlu diburu sore ini.' },
  malam: { label: 'Malam', hour: 20, minute: 8, background: '#1c3036', sun: '#aec9e1', intensity: 0.5, ambient: 0.5, night: 1, position: [-15, 25, 15], temperature: '23°', greeting: 'Lampu menyala, cerita belum selesai.' },
};

export async function createCity(container, callbacks = {}) {
  const compact = () => window.matchMedia(COMPACT_QUERY).matches;
  const quality = createQualityController(compact());
  let profile = quality.getState();
  const scene = new THREE.Scene(); scene.background = new THREE.Color(periods.sore.background);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatio));
  renderer.shadowMap.enabled = profile.shadows; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', 'Kota Mentari 3D: kampung, pasar dan tepi sungai. Geser untuk memutar, cubit untuk memperbesar, dan ketuk warga atau bangunan untuk melihat cerita.');
  renderer.domElement.setAttribute('role', 'img'); container.prepend(renderer.domElement);
  const center = new THREE.Vector3(WORLD.x, 0.8, WORLD.z), homeDirection = new THREE.Vector3(78, 85.2, 98);
  const camera = new THREE.OrthographicCamera(-51, 51, 40, -40, 0.1, 400); camera.position.copy(center).add(homeDirection);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center); controls.enableDamping = true; controls.dampingFactor = 0.065;
  controls.minPolarAngle = 0.28; controls.maxPolarAngle = 1.25; controls.minZoom = 0.68; controls.maxZoom = 6.5;
  controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.85; controls.panSpeed = 0.65; controls.update();

  const hemi = new THREE.HemisphereLight('#fff8e9', '#9da78b', periods.sore.ambient); scene.add(hemi);
  const sun = new THREE.DirectionalLight(periods.sore.sun, periods.sore.intensity);
  const positionSun = (settings) => { sun.target.position.copy(center); sun.position.set(center.x + settings.position[0] * 1.6, settings.position[1] * 1.6, center.z + settings.position[2] * 1.6); };
  positionSun(periods.sore); sun.castShadow = true; sun.shadow.mapSize.set(profile.shadowSize, profile.shadowSize);
  sun.shadow.camera.left = -57; sun.shadow.camera.right = 57; sun.shadow.camera.top = 57; sun.shadow.camera.bottom = -57;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 220; sun.shadow.normalBias = 0.04; sun.shadow.bias = -0.00015; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#dee8d9', 0.7); fill.position.set(40, 30, -50); scene.add(fill);
  const groundMat = new THREE.MeshBasicMaterial({ color: periods.sore.background, toneMapped: false });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set(WORLD.x, -1.285, WORLD.z); scene.add(ground);
  const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.ShadowMaterial({ opacity: 0.16 }));
  groundShadow.rotation.x = -Math.PI / 2; groundShadow.position.set(WORLD.x, -1.283, WORLD.z); groundShadow.receiveShadow = true; scene.add(groundShadow);
  const guideMat = new THREE.LineBasicMaterial({ color: '#c3cebc', transparent: true, opacity: 0.18 });
  for (const radius of [48, 59, 70]) {
    const points = Array.from({ length: 161 }, (_, i) => new THREE.Vector3(WORLD.x + Math.cos(i / 160 * Math.PI * 2) * radius, -1.276, WORLD.z + Math.sin(i / 160 * Math.PI * 2) * radius));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), guideMat));
  }
  const staticRoot = new THREE.Group(); staticRoot.name = 'Tiga kawasan Kota Mentari'; scene.add(staticRoot);
  const dynamic = new THREE.Group(); scene.add(dynamic);
  const state = { flags: [], swings: [], lights: [], water: [], signals: [], shutters: [],
    glowMaterial: material('#f7e2a9', { emissive: '#ffd082', emissiveIntensity: 0.15 }),
    windowMaterial: material('#567974', { emissive: '#ffbf69', emissiveIntensity: 0 }),
  };
  const kit = createKit(staticRoot), props = createProps(kit, dynamic, state);
  buildStreets(kit, props, state);
  const places = [...buildNeighborhood(kit, props, dynamic, state), ...buildDistricts(kit, props, dynamic, state)];
  const stats = batchStatic(staticRoot, { chunkSize: 14 });
  const traffic = createTraffic(kit, dynamic), people = createPeople(dynamic, traffic), birds = createBirds(kit, dynamic);
  const packageMesh = kit.box(0.38, 0.32, 0.4, 0, 0, 0, '#c9aa78', dynamic); packageMesh.visible = false;
  // Moving objects use contact shadows. The detailed architectural shadow is cached.
  dynamic.traverse((object) => { if (object.isMesh) object.castShadow = false; });
  let moment = { id: 'welcome', title: 'Tiga kawasan, satu kota yang hidup', icon: 'leaf' }, momentNumber = 0;
  const announce = (title, icon = 'leaf') => { moment = { id: `moment-${++momentNumber}`, title, icon }; callbacks.onMoment?.(moment); };
  const weather = createWeather(dynamic, { onChange(raining) { announce(raining ? 'Gerimis singgah. Payung mulai terbuka.' : 'Gerimis reda, kota kembali hangat.', raining ? 'rain' : 'sun'); callbacks.onWeatherChange?.(weather.getState()); } });
  const director = createDirector();
  const pickMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const pickables = places.map((place) => {
    const park = ['taman', 'sungai', 'pasar'].includes(place.id);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(park ? 7 : 3.3, park ? 0.5 : place.position.y * 0.8, park ? 6 : 4.0), pickMaterial);
    mesh.position.set(place.position.x, park ? 0.5 : place.position.y * 0.4 + 0.2, place.position.z); mesh.userData.place = place; scene.add(mesh); return mesh;
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 40), new THREE.MeshBasicMaterial({ color: '#fff2b8', transparent: true, opacity: 0.9, depthTest: true }));
  halo.rotation.x = -Math.PI / 2; halo.visible = false; dynamic.add(halo);
  let time = 0, running = true, speed = 1, period = 'sore', selected = null, following = null, activeDistrict = 'semua';
  let lastTime = 0, tween = null, viewIndex = -1, disposed = false, periodTime = 0, bottomOcclusion = 0, lodScale = -1;
  const startTime = performance.now(), targetColor = new THREE.Color(), windowTarget = new THREE.Color();
  const dayWindow = new THREE.Color('#567974'), nightWindow = new THREE.Color('#efca86'), raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), proj = new THREE.Vector3(), v = new THREE.Vector3();

  const updateViewFrame = () => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    // Reframe above the phone sheet, not by panning the follow target.
    const offset = Math.min(bottomOcclusion, h * 0.85) / 2;
    if (offset > 0) camera.setViewOffset(w, h, 0, offset, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    const aspect = w / h, size = Math.max(compact() ? 58 : 70, 102 / aspect);
    camera.left = -size * aspect / 2; camera.right = size * aspect / 2; camera.top = size / 2; camera.bottom = -size / 2;
    updateViewFrame(); renderer.setSize(w, h); lodScale = -1;
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  function applyQuality() {
    const next = quality.getState(), shadowChanged = next.shadowSize !== profile.shadowSize;
    profile = next; renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatio)); renderer.shadowMap.enabled = profile.shadows;
    if (shadowChanged) { sun.shadow.map?.dispose(); sun.shadow.map = null; sun.shadow.mapSize.set(profile.shadowSize, profile.shadowSize); }
    renderer.shadowMap.needsUpdate = true; weather.setDropCount(profile.rain); resize(); callbacks.onQualityChange?.(quality.getState());
  }
  weather.setDropCount(profile.rain);
  function updateDetail() {
    const scale = container.clientHeight * camera.zoom / (camera.top - camera.bottom);
    if (Math.abs(scale - lodScale) < 0.15) return;
    lodScale = scale;
    staticRoot.children.forEach((mesh) => { if (mesh.userData.fineDetail) mesh.visible = profile.fineDetail && scale >= 8.5; });
  }
  function screenPosition(position) {
    const rect = renderer.domElement.getBoundingClientRect(); proj.copy(position).project(camera);
    return { x: rect.left + (proj.x + 1) * rect.width / 2, y: rect.top + (-proj.y + 1) * rect.height / 2, visible: proj.z > -1 && proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05 };
  }
  function stopCinematic() {
    if (!director.getState().active) return;
    director.stop(); tween = null; callbacks.onCinematicChange?.(director.getState());
  }
  const onControlsStart = () => { stopCinematic(); tween = null; if (following) { following = null; callbacks.onFollowChange?.(false); } };
  controls.addEventListener('start', onControlsStart);
  function flyTo(target, zoom = 3.4, direction = null, duration = 1300) {
    const offset = direction ? new THREE.Vector3(...direction) : camera.position.clone().sub(controls.target);
    tween = { start: performance.now(), duration, fromPosition: camera.position.clone(), toPosition: target.clone().add(offset), fromTarget: controls.target.clone(), toTarget: target.clone(), fromZoom: camera.zoom, toZoom: zoom };
  }
  function playShot(shot) {
    const vehicle = shot.vehicle ? traffic.vehicles.find((item) => item.type === shot.vehicle) : null;
    flyTo(new THREE.Vector3(vehicle?.x ?? shot.x, 1, vehicle?.z ?? shot.z), shot.zoom, [78, 85.2, 98], 2400);
    callbacks.onCinematicChange?.(director.getState());
  }
  function setCinematic(value) {
    if (!value) return stopCinematic();
    following = null; selected = null; halo.visible = false; callbacks.onFollowChange?.(false); playShot(director.start());
  }
  function select(type, item, focus = false) {
    stopCinematic(); selected = { type, item }; following = null; callbacks.onFollowChange?.(false);
    halo.visible = true; halo.scale.setScalar(type === 'person' ? 1 : 3.8);
    if (focus) flyTo(new THREE.Vector3(item.position.x, type === 'person' ? 0.8 : 1.4, item.position.z), type === 'person' ? 5 : 3.6);
    callbacks.onSelect?.(type, item);
  }
  const down = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', (event) => { down.x = event.clientX; down.y = event.clientY; });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5 || event.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    let nearest = null, distance = 15;
    for (const agent of people.agents) {
      if (agent.hidden) continue;
      v.copy(agent.position); v.y += 0.45; const p = screenPosition(v), d = Math.hypot(p.x - event.clientX, p.y - event.clientY);
      if (p.visible && d < distance) { nearest = agent; distance = d; }
    }
    if (nearest) return select('person', nearest);
    const hits = raycaster.intersectObjects(pickables, false); if (hits.length) select('place', hits[0].object.userData.place);
  });

  function updateAtmosphere(delta) {
    const settings = periods[period], a = 1 - Math.exp(-delta * 2.5), rain = weather.getState().amount;
    targetColor.set(settings.background); scene.background.lerp(targetColor, a); groundMat.color.lerp(targetColor, a);
    targetColor.set(settings.sun); sun.color.lerp(targetColor, a); sun.intensity = THREE.MathUtils.lerp(sun.intensity, settings.intensity * (1 - rain * 0.38), a);
    hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, settings.ambient * (1 - rain * 0.13), a);
    fill.intensity = THREE.MathUtils.lerp(fill.intensity, 0.7 - settings.night * 0.45, a);
    targetColor.set(settings.night > 0.5 ? '#b5cbd3' : '#fff8e9'); hemi.color.lerp(targetColor, a);
    windowTarget.copy(dayWindow).lerp(nightWindow, settings.night); state.windowMaterial.color.lerp(windowTarget, a);
    state.windowMaterial.emissiveIntensity = THREE.MathUtils.lerp(state.windowMaterial.emissiveIntensity, settings.night * 1.4, a);
    state.glowMaterial.emissiveIntensity = THREE.MathUtils.lerp(state.glowMaterial.emissiveIntensity, settings.night * 2.3 + 0.15, a);
    state.lights.forEach((light) => { light.intensity = THREE.MathUtils.lerp(light.intensity, profile.tier === 'hemat' ? 0 : settings.night * 8, a); });
    guideMat.opacity = THREE.MathUtils.lerp(guideMat.opacity, settings.night > 0.5 ? 0.045 : 0.18, a);
    state.shutters.forEach((shutter) => {
      shutter.closed += ((period === 'malam' ? 1 : 0) - shutter.closed) * a;
      shutter.mesh.visible = shutter.closed > 0.02; shutter.mesh.scale.y = Math.max(0.01, shutter.closed); shutter.mesh.position.y = shutter.top - shutter.height * shutter.closed / 2;
    });
  }
  function animate() {
    if (disposed) return;
    const realTime = (performance.now() - startTime) / 1000; if (realTime - lastTime < 1 / profile.fps) return;
    const realDelta = realTime - lastTime, delta = Math.min(realDelta, 0.15); lastTime = realTime;
    if (quality.sample(realDelta, Math.min(realDelta, 0.25))) applyQuality();
    const simDelta = running ? delta * speed : 0; time += simDelta; periodTime += simDelta;
    traffic.update(time, simDelta); weather.update(time, Math.min(realDelta, 0.25));
    people.update(time, simDelta, { rain: weather.getState().active, period }); birds.update(time);
    for (const event of traffic.consumeEvents()) {
      if (event.title) announce(event.title, event.stop === 'delivery' ? 'shop' : 'bus');
      else if (event.kind === 'passengers') announce(event.passengers ? 'Penumpang naik. Angkot 03 segera berangkat.' : 'Penumpang turun di halte tujuan.', 'bus');
    }
    const courier = people.agents[30], delivered = traffic.getState().delivered;
    packageMesh.visible = (!courier.hidden && courier.carrying) || delivered > 0;
    if (!courier.hidden && courier.carrying) packageMesh.position.set(courier.position.x + 0.17, 0.86, courier.position.z + 0.15);
    else packageMesh.position.set(23.5, 0.48, -3.8);
    state.flags.forEach(({ mesh, original }) => {
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = original[i * 3]; p.setZ(i, Math.sin(time * 2.2 - x * 7) * x * 0.11 + Math.sin(time * 3.4 - x * 3) * x * 0.035); } p.needsUpdate = true;
    });
    state.swings.forEach((s, i) => { s.rotation.x = Math.sin(time * 1.4 + i) * 0.12; });
    state.water.forEach(({ mesh, angle, offset }) => { const f = (time * 0.9 + offset) % 1; mesh.position.set(7.3 + Math.cos(angle) * f * 0.84, 1.48 + Math.sin(f * Math.PI) * 0.45 - f * 0.85, -6.3 + Math.sin(angle) * f * 0.84); });
    state.riverRipples.position.x = Math.sin(time * 0.4) * 0.25; state.boat.position.y = 0.3 + Math.sin(time * 0.8) * 0.035; state.boat.rotation.z = Math.sin(time * 0.6) * 0.025;
    state.signals.forEach((s) => { const signal = signalAt(time, s.offset)[s.axis]; ['red', 'amber', 'green'].forEach((color) => { s[color].emissiveIntensity = signal === color ? 0.9 : 0.025; }); });
    const shot = director.update(Math.min(realDelta, 0.25)); if (shot) playShot(shot);
    if (tween) {
      const p = Math.min(1, (performance.now() - tween.start) / tween.duration), e = p * p * (3 - 2 * p);
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, e); controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
      camera.zoom = THREE.MathUtils.lerp(tween.fromZoom, tween.toZoom, e); camera.updateProjectionMatrix(); if (p === 1) tween = null;
    } else if (following) {
      v.copy(following.position); v.y = 0.9; v.sub(controls.target).multiplyScalar(0.045); camera.position.add(v); controls.target.add(v);
    } else if (director.getState().active) {
      const vehicle = director.shot.vehicle ? traffic.vehicles.find((item) => item.type === director.shot.vehicle) : null;
      if (vehicle) { v.set(vehicle.x, 1, vehicle.z).sub(controls.target).multiplyScalar(0.06); camera.position.add(v); controls.target.add(v); }
      v.copy(camera.position).sub(controls.target).applyAxisAngle(THREE.Object3D.DEFAULT_UP, delta * 0.009); camera.position.copy(controls.target).add(v);
    }
    if (selected) { halo.visible = !selected.item.hidden; halo.position.copy(selected.item.position); halo.position.y = selected.type === 'person' ? selected.item.position.y + 0.025 : 0.32; halo.material.opacity = 0.65 + Math.sin(realTime * 2) * 0.18; }
    controls.update(); updateDetail(); updateAtmosphere(Math.min(realDelta, 2)); renderer.render(scene, camera);
    callbacks.onFrame?.({ time, periodTime, running, speed, camera, screenPosition, zoom: camera.zoom, moment,
      compassAngle: Math.atan2(Math.sin(controls.getAzimuthalAngle()), Math.cos(controls.getAzimuthalAngle()) * Math.cos(controls.getPolarAngle())) * 180 / Math.PI, background: scene.background.getHexString() });
  }
  const visibility = () => { if (disposed) return; if (document.hidden) renderer.setAnimationLoop(null); else { lastTime = (performance.now() - startTime) / 1000; renderer.setAnimationLoop(animate); } };
  document.addEventListener('visibilitychange', visibility); renderer.setAnimationLoop(animate);
  function deselect() { selected = null; following = null; halo.visible = false; callbacks.onFollowChange?.(false); }
  return {
    places, agents: people.agents, districts: DISTRICTS, stats,
    setBottomOcclusion(pixels) { if (Math.abs(bottomOcclusion - pixels) < 0.5) return; bottomOcclusion = Math.max(0, pixels); updateViewFrame(); },
    setPeriod(value) { if (!periods[value]) return; period = value; periodTime = 0; positionSun(periods[value]); renderer.shadowMap.needsUpdate = true; if (value === 'malam') announce('Toko beristirahat, jendela rumah mulai hangat.', 'moon'); },
    setWeather(value) { return weather.setMode(value); },
    setQuality(value) { if (!quality.setMode(value)) return false; applyQuality(); return true; },
    setCinematic, setAutoRotate: setCinematic,
    setRunning(value) { running = value; }, setSpeed(value) { speed = value; },
    zoom(direction) { stopCinematic(); tween = null; camera.zoom = THREE.MathUtils.clamp(camera.zoom * (direction > 0 ? 1.2 : 1 / 1.2), 0.68, 6.5); camera.updateProjectionMatrix(); },
    reset() { stopCinematic(); deselect(); activeDistrict = 'semua'; flyTo(center, 1, homeDirection.toArray()); },
    focusDistrict(id) { const district = DISTRICTS.find((item) => item.id === id); if (!district) return; stopCinematic(); deselect(); activeDistrict = id; viewIndex = DISTRICTS.indexOf(district); flyTo(new THREE.Vector3(district.x, 1, district.z), district.zoom, homeDirection.toArray()); },
    nextView() { viewIndex = (viewIndex + 1) % DISTRICTS.length; this.focusDistrict(DISTRICTS[viewIndex].id); return DISTRICTS[viewIndex]; },
    selectAgent(id, focus = true) { const agent = people.agents.find((a) => a.id === id); if (agent) select('person', agent, focus); },
    selectPlace(id, focus = true) { const place = places.find((p) => p.id === id); if (place) select('place', place, focus); },
    follow(id) { stopCinematic(); const agent = people.agents.find((a) => a.id === id); if (!agent) return; following = following === agent ? null : agent; if (following) flyTo(new THREE.Vector3(agent.position.x, 0.9, agent.position.z), 5.2); callbacks.onFollowChange?.(!!following); },
    deselect,
    screenshot() { renderer.render(scene, camera); const link = document.createElement('a'); link.download = `kota-kecil-${period}.png`; link.href = renderer.domElement.toDataURL('image/png'); link.click(); },
    getState() { return { time, running, speed, period, following: following?.id ?? null, bottomOcclusion, selectedScreen: selected ? screenPosition(selected.item.position) : null,
      zoom: camera.zoom, residents: people.agents.length, places: places.length, districts: DISTRICTS.length, activeDistrict, target: { x: controls.target.x, z: controls.target.z },
      drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, visibleDetailBatches: staticRoot.children.filter(m => m.userData.fineDetail && m.visible).length,
      cinematic: director.getState(), traffic: traffic.getState(), life: people.getState(), weather: weather.getState(), quality: { ...quality.getState(), pixelRatio: renderer.getPixelRatio() }, moment,
      shuttersClosed: state.shutters.filter(s => s.closed > 0.8).length }; },
    dispose() {
      disposed = true; observer.disconnect(); document.removeEventListener('visibilitychange', visibility); controls.dispose(); renderer.setAnimationLoop(null);
      const geometries = new Set(), materials = new Set(), textures = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); });
      materials.forEach(m => { if (m.map) textures.add(m.map); m.dispose(); }); geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
      sun.shadow.map?.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
    screenPosition,
  };
}
