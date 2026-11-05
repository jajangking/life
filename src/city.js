import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createKit, batchStatic, material } from './world/kit.js';
import { createProps } from './world/props.js';
import { buildStreets } from './world/streets.js';
import { buildNeighborhood } from './world/buildings.js';
import { createPeople, createTraffic, createBirds } from './world/life.js';

export const periods = {
  pagi: { label: 'Pagi', hour: 7, minute: 42, background: '#e9eee3', sun: '#ffe9c1', intensity: 3.5, ambient: 2.5, night: 0, position: [-25, 30, -10], temperature: '24°', greeting: 'Pagi yang penuh kemungkinan.' },
  siang: { label: 'Siang', hour: 12, minute: 12, background: '#e9eee6', sun: '#fff1d3', intensity: 3.8, ambient: 2.6, night: 0, position: [-10, 40, 15], temperature: '29°', greeting: 'Kehidupan di bawah hangat mentari.' },
  sore: { label: 'Sore', hour: 16, minute: 24, background: '#e9ece4', sun: '#ffe0af', intensity: 3.4, ambient: 2.3, night: 0.04, position: [-26, 30, 22], temperature: '27°', greeting: 'Tidak ada yang perlu diburu sore ini.' },
  malam: { label: 'Malam', hour: 20, minute: 8, background: '#1c3036', sun: '#aec9e1', intensity: 0.5, ambient: 0.5, night: 1, position: [-15, 25, 15], temperature: '23°', greeting: 'Lampu menyala, cerita belum selesai.' },
};

export async function createCity(container, callbacks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(periods.sore.background);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', 'Miniatur Kampung Mentari 3D. Geser untuk memutar, gulir untuk memperbesar, dan klik warga atau bangunan untuk melihat ceritanya.');
  renderer.domElement.setAttribute('role', 'img');
  container.prepend(renderer.domElement);

  const camera = new THREE.OrthographicCamera(-30, 30, 22, -22, 0.1, 180);
  camera.position.set(38, 43, 48);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.065;
  controls.minPolarAngle = 0.28; controls.maxPolarAngle = 1.25;
  controls.minZoom = 0.68; controls.maxZoom = 3.6;
  controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.85; controls.panSpeed = 0.65;
  controls.autoRotateSpeed = 0.5;
  controls.update();

  const hemi = new THREE.HemisphereLight('#fff8e9', '#9da78b', periods.sore.ambient); scene.add(hemi);
  const sun = new THREE.DirectionalLight(periods.sore.sun, periods.sore.intensity);
  sun.position.set(...periods.sore.position); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -28; sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 100;
  sun.shadow.normalBias = 0.035; sun.shadow.bias = -0.00015;
  sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#dee8d9', 0.7); fill.position.set(20, 15, -30); scene.add(fill);

  const groundMat = new THREE.MeshBasicMaterial({ color: periods.sore.background, toneMapped: false });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.285; scene.add(ground);
  const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), new THREE.ShadowMaterial({ opacity: 0.16 }));
  groundShadow.rotation.x = -Math.PI / 2; groundShadow.position.y = -1.283; groundShadow.receiveShadow = true; scene.add(groundShadow);
  const guideMat = new THREE.LineBasicMaterial({ color: '#c3cebc', transparent: true, opacity: 0.22 });
  for (const radius of [24.5, 30.5, 36.5]) {
    const points = Array.from({ length: 161 }, (_, i) => new THREE.Vector3(Math.cos(i / 160 * Math.PI * 2) * radius, -1.276, Math.sin(i / 160 * Math.PI * 2) * radius));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), guideMat));
  }

  const staticRoot = new THREE.Group(); staticRoot.name = 'Miniatur Kampung Mentari'; scene.add(staticRoot);
  const dynamic = new THREE.Group(); scene.add(dynamic);
  const state = {
    flags: [], swings: [], lights: [], water: [], signals: [],
    glowMaterial: material('#f7e2a9', { emissive: '#ffd082', emissiveIntensity: 0.15 }),
    windowMaterial: material('#567974', { emissive: '#ffbf69', emissiveIntensity: 0 }),
  };
  const kit = createKit(staticRoot);
  const props = createProps(kit, dynamic, state);
  buildStreets(kit, props, state);
  const places = buildNeighborhood(kit, props, dynamic, state);
  const stats = batchStatic(staticRoot);
  const people = createPeople(dynamic);
  const traffic = createTraffic(kit, dynamic);
  const birds = createBirds(kit, dynamic);
  // Cache the detailed static shadow map. Moving objects use soft contact shadows.
  dynamic.traverse((object) => { if (object.isMesh) object.castShadow = false; });

  const pickMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const pickables = places.map((place) => {
    const park = place.id === 'taman';
    const m = new THREE.Mesh(new THREE.BoxGeometry(park ? 7 : 2.8, park ? 0.4 : place.position.y * 0.8, park ? 7 : 3.8), pickMaterial);
    m.position.set(place.position.x, park ? 0.5 : place.position.y * 0.4 + 0.2, place.position.z);
    m.userData.place = place; scene.add(m); return m;
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 40), new THREE.MeshBasicMaterial({ color: '#fff2b8', transparent: true, opacity: 0.9, depthTest: true }));
  halo.rotation.x = -Math.PI / 2; halo.visible = false; dynamic.add(halo);

  let time = 0, running = true, speed = 1, period = 'sore', selected = null, following = null;
  let lastTime = 0, tween = null, viewIndex = 0, disposed = false;
  let periodTime = 0;
  const startTime = performance.now();
  const targetColor = new THREE.Color(), dayWindow = new THREE.Color('#567974'), nightWindow = new THREE.Color('#efca86');
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const proj = new THREE.Vector3();
  const v = new THREE.Vector3();

  let bottomOcclusion = 0;
  const updateViewFrame = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    // Move the focus into the visible part above a bottom sheet, without panning
    // the target (which would break following a resident and picking objects).
    const offset = Math.min(bottomOcclusion, h * 0.85) / 2;
    if (offset > 0) camera.setViewOffset(w, h, 0, offset, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    const aspect = w / h;
    const compact = window.matchMedia('(max-width: 760px), (max-width: 1000px) and (max-height: 500px)').matches;
    const size = Math.max(compact ? 34 : 43, 51 / aspect);
    camera.left = -size * aspect / 2; camera.right = size * aspect / 2;
    camera.top = size / 2; camera.bottom = -size / 2;
    updateViewFrame(); renderer.setSize(w, h);
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();

  function screenPosition(position) {
    const rect = renderer.domElement.getBoundingClientRect();
    proj.copy(position).project(camera);
    return { x: rect.left + (proj.x + 1) * rect.width / 2, y: rect.top + (-proj.y + 1) * rect.height / 2, visible: proj.z > -1 && proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1 };
  }
  const onControlsStart = () => {
    tween = null;
    if (following) { following = null; callbacks.onFollowChange?.(false); }
  };
  controls.addEventListener('start', onControlsStart);

  function flyTo(target, zoom = 1.8, direction = null) {
    const offset = direction ? new THREE.Vector3(...direction) : camera.position.clone().sub(controls.target);
    tween = {
      start: performance.now(), duration: 1100,
      fromPosition: camera.position.clone(), toPosition: target.clone().add(offset),
      fromTarget: controls.target.clone(), toTarget: target.clone(), fromZoom: camera.zoom, toZoom: zoom,
    };
  }
  function select(type, item, focus = false) {
    selected = { type, item }; following = null; callbacks.onFollowChange?.(false);
    halo.visible = true; halo.scale.setScalar(type === 'person' ? 1 : 3.8);
    if (focus) flyTo(new THREE.Vector3(item.position.x, type === 'person' ? 0.8 : 1.4, item.position.z), type === 'person' ? 2.5 : 1.8);
    callbacks.onSelect?.(type, item);
  }
  const down = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', (event) => { down.x = event.clientX; down.y = event.clientY; });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5 || event.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    // A generous screen-space hit area makes even a tiny resident easy to meet.
    let nearest = null, distance = 15;
    for (const agent of people.agents) {
      v.copy(agent.position); v.y += 0.45;
      const p = screenPosition(v);
      const d = Math.hypot(p.x - event.clientX, p.y - event.clientY);
      if (p.visible && d < distance) { nearest = agent; distance = d; }
    }
    if (nearest) return select('person', nearest);
    const hits = raycaster.intersectObjects(pickables, false);
    if (hits.length) select('place', hits[0].object.userData.place);
  });

  function updateAtmosphere(delta) {
    const settings = periods[period];
    const a = 1 - Math.exp(-delta * 2.5);
    targetColor.set(settings.background); scene.background.lerp(targetColor, a); groundMat.color.lerp(targetColor, a);
    targetColor.set(settings.sun); sun.color.lerp(targetColor, a);
    sun.intensity = THREE.MathUtils.lerp(sun.intensity, settings.intensity, a);
    hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, settings.ambient, a);
    fill.intensity = THREE.MathUtils.lerp(fill.intensity, 0.7 - settings.night * 0.45, a);
    targetColor.set(settings.night > 0.5 ? '#b5cbd3' : '#fff8e9'); hemi.color.lerp(targetColor, a);
    // The sun moves on period selection; static shadows only rebuild then.
    state.windowMaterial.color.lerp(dayWindow.clone().lerp(nightWindow, settings.night), a);
    state.windowMaterial.emissiveIntensity = THREE.MathUtils.lerp(state.windowMaterial.emissiveIntensity, settings.night * 1.4, a);
    state.glowMaterial.emissiveIntensity = THREE.MathUtils.lerp(state.glowMaterial.emissiveIntensity, settings.night * 2.3 + 0.15, a);
    state.lights.forEach((light) => { light.intensity = THREE.MathUtils.lerp(light.intensity, settings.night * 8, a); });
    guideMat.opacity = THREE.MathUtils.lerp(guideMat.opacity, settings.night > 0.5 ? 0.045 : 0.22, a);
  }
  function animate() {
    if (disposed) return;
    const realTime = (performance.now() - startTime) / 1000;
    if (realTime - lastTime < 1 / 40) return;
    const realDelta = realTime - lastTime;
    const delta = Math.min(realDelta, 0.1); lastTime = realTime;
    const simDelta = running ? delta * speed : 0;
    time += simDelta; periodTime += simDelta;
    people.update(time, simDelta); traffic.update(time, simDelta); birds.update(time);
    state.flags.forEach(({ mesh, original }) => {
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = original[i * 3];
        p.setZ(i, Math.sin(time * 2.2 - x * 7) * x * 0.11 + Math.sin(time * 3.4 - x * 3) * x * 0.035);
      }
      p.needsUpdate = true;
    });
    state.swings.forEach((s, i) => { s.rotation.x = Math.sin(time * 1.4 + i) * 0.12; });
    state.water.forEach(({ mesh, angle, offset }) => {
      const f = (time * 0.9 + offset) % 1;
      mesh.position.set(7.3 + Math.cos(angle) * f * 0.84, 1.48 + Math.sin(f * Math.PI) * 0.45 - f * 0.85, -6.3 + Math.sin(angle) * f * 0.84);
    });
    state.signals.forEach((s, i) => {
      const active = Math.floor(time / 13) % 2 === i;
      const amber = time % 13 > 11.5;
      s.red.emissiveIntensity = !active ? 0.8 : 0.03;
      s.green.emissiveIntensity = active && !amber ? 0.9 : 0.03;
      s.amber.emissiveIntensity = active && amber ? 0.9 : 0.03;
    });
    if (tween) {
      const p = Math.min(1, (performance.now() - tween.start) / tween.duration);
      const e = p * p * (3 - 2 * p);
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, e);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
      camera.zoom = THREE.MathUtils.lerp(tween.fromZoom, tween.toZoom, e); camera.updateProjectionMatrix();
      if (p === 1) tween = null;
    } else if (following) {
      v.copy(following.position); v.y = 0.9; v.sub(controls.target).multiplyScalar(0.045);
      camera.position.add(v); controls.target.add(v);
    }
    if (selected) {
      halo.position.copy(selected.item.position); halo.position.y = selected.type === 'person' ? selected.item.position.y + 0.025 : 0.32;
      halo.material.opacity = 0.65 + Math.sin(realTime * 2) * 0.18;
    }
    controls.update();
    updateAtmosphere(Math.min(realDelta, 2));
    renderer.render(scene, camera);
    callbacks.onFrame?.({ time, periodTime, running, speed, camera, screenPosition, zoom: camera.zoom, compassAngle: Math.atan2(Math.sin(controls.getAzimuthalAngle()), Math.cos(controls.getAzimuthalAngle()) * Math.cos(controls.getPolarAngle())) * 180 / Math.PI, background: scene.background.getHexString() });
  }
  renderer.setAnimationLoop(animate);

  return {
    places, agents: people.agents, stats,
    setBottomOcclusion(pixels) {
      if (Math.abs(bottomOcclusion - pixels) < 0.5) return;
      bottomOcclusion = Math.max(0, pixels); updateViewFrame();
    },
    setPeriod(value) {
      if (!periods[value]) return;
      period = value; periodTime = 0;
      sun.position.set(...periods[value].position);
      renderer.shadowMap.needsUpdate = true;
    },
    setRunning(value) { running = value; },
    setSpeed(value) { speed = value; },
    setAutoRotate(value) { controls.autoRotate = value; },
    zoom(direction) {
      tween = null; camera.zoom = THREE.MathUtils.clamp(camera.zoom * (direction > 0 ? 1.2 : 1 / 1.2), 0.68, 3.6); camera.updateProjectionMatrix();
    },
    reset() { following = null; callbacks.onFollowChange?.(false); flyTo(new THREE.Vector3(0, 0.8, 0), 1, [38, 42.2, 48]); },
    nextView() {
      const views = [[38, 42.2, 48], [-45, 37, 40], [-40, 40, -45], [43, 39, -43]];
      viewIndex = (viewIndex + 1) % views.length;
      flyTo(new THREE.Vector3(0, 0.8, 0), 1, views[viewIndex]);
    },
    selectAgent(id, focus = true) { const agent = people.agents.find((a) => a.id === id); if (agent) select('person', agent, focus); },
    selectPlace(id, focus = true) { const place = places.find((p) => p.id === id); if (place) select('place', place, focus); },
    follow(id) {
      const agent = people.agents.find((a) => a.id === id);
      if (!agent) return;
      following = following === agent ? null : agent;
      if (following) flyTo(new THREE.Vector3(agent.position.x, 0.9, agent.position.z), 2.6);
      callbacks.onFollowChange?.(!!following);
    },
    deselect() { selected = null; following = null; halo.visible = false; callbacks.onFollowChange?.(false); },
    screenshot() {
      renderer.render(scene, camera);
      const link = document.createElement('a'); link.download = `kota-kecil-${period}.png`;
      link.href = renderer.domElement.toDataURL('image/png'); link.click();
    },
    getState() { return { time, running, speed, period, following: following?.id ?? null, bottomOcclusion, selectedScreen: selected ? screenPosition(selected.item.position) : null, zoom: camera.zoom, residents: people.agents.length, places: places.length, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; },
    dispose() { disposed = true; observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null); renderer.dispose(); },
    screenPosition,
  };
}
