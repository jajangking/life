import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import './styles.css';
import './mobile.css';
import './city-ui.css';
import { icon, logo } from './icons.js';
import { createCity, periods, DISTRICTS, COMPACT_QUERY } from './city.js';
import { createAmbience } from './ambience.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const tool = (id, name, label, extra = '') => `<button class="icon-button" id="${id}" aria-label="${label}" data-tooltip="${label}" ${extra}>${icon(name)}</button>`;

$('#app').innerHTML = `
<div class="app-shell is-loading" data-period="sore" data-panel="none">
  <main id="world" class="world">
    <div class="annotation-layer" id="annotations" aria-label="Tempat di Kota Mentari">
      <button class="place-label" data-place="kopi"><span class="label-icon coffee-label">${icon('coffee', 13)}</span>Kopi Pagi<span class="label-dot"></span></button>
      <button class="place-label" data-place="taman"><span class="label-icon park-label">${icon('leaf', 13)}</span>Taman Sore<span class="label-dot"></span></button>
      <button class="place-label" data-place="pasar"><span class="label-icon coffee-label">${icon('shop', 13)}</span>Pasar Kenanga<span class="label-dot"></span></button>
      <button class="place-label" data-place="sungai"><span class="label-icon park-label">${icon('leaf', 13)}</span>Tepi Sungai<span class="label-dot"></span></button>
    </div>
    <div class="world-loading" id="loading" role="status">${logo}<span>Menyiapkan cerita kecil…</span><div class="loading-line"><i></i></div></div>
  </main>

  <header class="header">
    <a class="brand" href="#" aria-label="Kota Kecil — kembali ke tampilan awal">${logo}<span>kota kecil<span class="brand-dot">.</span></span><span class="brand-divider"></span><span class="brand-caption">a little world,<br>always alive.</span></a>
    <nav class="top-nav" aria-label="Navigasi utama">
      <button class="nav-button is-active" id="nav-explore" aria-current="page">${icon('explore', 16)}<span>Jelajahi</span></button>
      <button class="nav-button" id="nav-people" aria-expanded="false" aria-controls="residents">${icon('people', 16)}<span>Cerita warga</span></button>
      <button class="nav-button" id="nav-about">${icon('info', 16)}<span>Tentang</span></button>
    </nav>
    <div class="header-right"><div class="weather">${icon('sun', 20)}<span id="temperature">27°</span><span class="weather-text">Cerah</span></div><span class="header-separator"></span>${tool('sound', 'mute', 'Nyalakan suara kota', 'aria-pressed="false"')}${tool('help', 'help', 'Panduan menjelajahi kota')}</div>
  </header>

  <aside class="sidebar" aria-label="Kota Mentari">
    <div class="intro">
      <div class="eyebrow"><span></span> BERHENTI SEBENTAR DI SINI</div>
      <h1>Dunia kecil.<br> Cerita <em>besar.</em></h1>
      <p>Di antara atap dan pepohonan,<br>selalu ada kehidupan yang menarik<br>untuk dilihat lebih dekat.</p>
    </div>
    <button class="neighborhood-card" id="neighborhood" aria-label="Jelajahi tiga kawasan Kota Mentari">
      <div class="card-overline"><span>TIGA KAWASAN TERHUBUNG</span>${icon('arrow', 16)}</div>
      <div class="neighborhood-main"><div class="neighborhood-illustration"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m6 42 26-14 26 14-26 14Z" fill="#b9c59b"/><path d="M16 28h22v19H16z" fill="#eddbb0"/><path d="m12 29 15-13 15 13Z" fill="#bd805b"/><path d="M27 16v13h15Z" fill="#d49a6c"/><path d="M24 36h7v11h-7z" fill="#769080"/><path d="M34 33h6v7h-6z" fill="#71958c"/><path d="M48 34v13" stroke="#8b7758" stroke-width="3"/><circle cx="48" cy="29" r="9" fill="#8ea271"/><circle cx="52" cy="25" r="6" fill="#aab987"/><path d="m8 47 23 12 25-13" stroke="#8ca37e" stroke-width="2"/></svg></div><div><h2>Kota Mentari</h2><span>${icon('pin', 12)} Jawa, Indonesia</span></div></div>
      <div class="neighborhood-stats"><span>${icon('people', 14)} <b id="resident-count">40</b> warga</span><span class="stat-divider"></span><span>${icon('house', 14)} <b id="place-count">18</b> tempat</span><span class="mini-live"><i></i> Hidup</span></div>
    </button>

    <section class="activity-block" aria-labelledby="activity-title">
      <div class="section-heading"><h2 id="activity-title">Kehidupan, sekarang</h2><span class="live-text"><i></i> LIVE</span></div>
      <div class="activity-list">
        <button class="activity-item" data-agent="warga-0"><span class="activity-icon terracotta">${icon('coffee', 16)}</span><span><strong>Sari menikmati kopi</strong><small>Di teras Kopi Pagi</small></span><span class="activity-arrow">${icon('chevron', 13)}</span></button>
        <button class="activity-item" data-agent="warga-1"><span class="activity-icon sage">${icon('shop', 16)}</span><span><strong>Pak Budi menata buah</strong><small>Di depan Toko Mentari</small></span><span class="activity-arrow">${icon('chevron', 13)}</span></button>
        <button class="activity-item" data-agent="warga-3"><span class="activity-icon sand">${icon('person', 16)}</span><span><strong>Raka berjalan santai</strong><small>Menyusuri sudut kampung</small></span><span class="activity-arrow">${icon('chevron', 13)}</span></button>
      </div>
    </section>
    <button class="tour-button" id="tour-start">${icon('explore', 17)}<span>Jalan-jalan sebentar</span>${icon('arrow', 17)}</button>
  </aside>

  <section class="time-panel" aria-label="Pilih suasana kota">
    <span class="time-panel-label">SETIAP WAKTU, CERITA BERBEDA</span>
    <div class="time-options" role="group" aria-label="Waktu dalam sehari">
      ${Object.entries(periods).map(([id, p]) => `<button class="time-button ${id === 'sore' ? 'is-active' : ''}" data-period="${id}" aria-pressed="${id === 'sore'}">${icon({ pagi: 'sunrise', siang: 'sun', sore: 'sunset', malam: 'moon' }[id], 17)}<span>${p.label}</span></button>`).join('')}
    </div>
  </section>
  <div class="local-time"><div class="local-time-label"><i></i><span>WAKTU MENTARI</span></div><div class="clock"><span id="clock">16<span class="clock-colon">:</span>24</span><small>WIB</small></div><p id="time-greeting">Tidak ada yang perlu<br>diburu sore ini.</p></div>

  <div class="scene-tools" role="toolbar" aria-label="Kontrol kamera">
    <div class="tool-stack">${tool('reset', 'reset', 'Kembali ke sudut awal (R)')}${tool('view', 'view', 'Pindah ke kawasan berikutnya')}${tool('fullscreen', 'full', 'Layar penuh')}</div>
    <div class="tool-stack zoom-stack">${tool('zoom-in', 'plus', 'Perbesar (+)')}<span></span>${tool('zoom-out', 'minus', 'Perkecil (−)')}</div>
  </div>
  <div class="compass" aria-hidden="true"><span>U</span><svg id="compass-arrow" width="26" height="26" viewBox="0 0 30 30"><path d="m15 3 6 23-6-6-6 6Z" fill="#496c59"/><path d="m15 3 6 23-6-6Z" fill="#9baa8e"/></svg></div>

  <div class="scene-hint">${icon('mouse', 14)}<span>Geser untuk memutar<span class="hint-dot">·</span>Gulir untuk mendekat<span class="hint-dot">·</span>Klik untuk mengenal</span></div>
  <div class="playback-dock" role="toolbar" aria-label="Kontrol kehidupan kota">
    <button class="pause-button" id="pause" aria-label="Jeda kehidupan kota (Spasi)" aria-pressed="false">${icon('pause', 19)}</button>
    <div class="speed-control"><span>RITME KOTA</span><div class="speed-options" role="group" aria-label="Kecepatan simulasi"><button class="speed-button is-active" data-speed="1" aria-pressed="true">1×</button><button class="speed-button" data-speed="2" aria-pressed="false">2×</button><button class="speed-button" data-speed="4" aria-pressed="false">4×</button></div></div>
    <span class="dock-divider"></span>
    ${tool('auto-rotate', 'film', 'Nonton otomatis (sinematik)', 'aria-pressed="false"')}
    ${tool('screenshot', 'camera', 'Simpan foto kota')}
  </div>
  <footer class="footer-note">${icon('leaf', 14)}<span>Tak perlu buru-buru. Nikmati saja.</span></footer>
  <button class="labels-toggle" id="labels" aria-pressed="true">${icon('pin', 15)}<span>Label tempat</span><i></i></button>

  <section class="selection-card" id="selection" aria-label="Cerita dari kota" hidden></section>
  <aside class="residents-drawer" id="residents" aria-label="Kenali warga Kampung Mentari" hidden>
    <div class="drawer-heading"><div class="eyebrow">ORANG-ORANG DI BALIK CERITA</div><h2>Halo, tetangga.</h2><button class="icon-button drawer-close" id="residents-close" aria-label="Tutup daftar warga">${icon('close', 18)}</button></div>
    <p class="drawer-description">40 kehidupan kecil. Masing-masing<br>punya ceritanya sendiri.</p>
    <label class="resident-search">${icon('search', 16)}<input id="resident-search" type="search" placeholder="Cari tetangga…" aria-label="Cari nama atau pekerjaan warga" autocomplete="off"></label>
    <div class="residents-list" id="residents-list"></div>
    <div class="drawer-footer">${icon('leaf', 13)} Klik warga untuk melihat lebih dekat.</div>
  </aside>
  <section class="tour-card" id="tour-card" aria-label="Tur Kampung Mentari" hidden></section>
  <dialog id="info-dialog" class="info-dialog"><button class="icon-button dialog-close" aria-label="Tutup informasi">${icon('close', 20)}</button><div id="dialog-content"></div></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
</div>`;

let city;
let running = true, speed = 1, period = 'sore', labels = true, following = false, selectedItem = null;
let tourIndex = -1, toastTimer, clockText = '', sceneCaption = '', cinemaTitle = '';
const shell = $('.app-shell');
const ambience = createAmbience();
const markerButtons = $$('.place-label');
const compactLayout = window.matchMedia(COMPACT_QUERY);

function updatePanelLayout() {
  const residentsOpen = !$('#residents').hidden;
  const panel = residentsOpen ? 'residents' : !$('#tour-card').hidden ? 'tour' : !$('#selection').hidden ? 'selection' : 'none';
  shell.dataset.panel = panel;
  $('#nav-people').setAttribute('aria-expanded', String(residentsOpen));
  // The full-width phone drawer must not leave hidden controls in the tab order.
  $$('.time-panel, #world, .scene-tools, #labels, #neighborhood, #tour-start, .playback-dock').forEach((element) => {
    element.inert = residentsOpen && compactLayout.matches;
  });
  let occluded = 0;
  if (compactLayout.matches && (panel === 'tour' || panel === 'selection')) {
    const world = $('#world').getBoundingClientRect();
    const sheet = $(panel === 'tour' ? '#tour-card' : '#selection').getBoundingClientRect();
    if (sheet.left < world.right && sheet.right > world.left) {
      occluded = Math.max(0, Math.min(world.height, world.bottom - sheet.top));
    }
  }
  city?.setBottomOcclusion(occluded);
}
const panelObserver = new ResizeObserver(updatePanelLayout);
['#world', '#selection', '#tour-card', '#residents'].forEach((selector) => panelObserver.observe($(selector)));
compactLayout.addEventListener('change', updatePanelLayout);
const tours = [
  { id: 'kopi', title: 'Kopi hangat. Waktu yang lapang.', text: 'Intip teras Kopi Pagi. Ada cangkir di meja, tanaman di balkon, dan cerita yang belum selesai.', icon: 'coffee' },
  { id: 'taman', title: 'Ruang kecil untuk bernapas.', text: 'Air mengalir, ayunan bergerak pelan. Kadang, hal terbaik yang bisa dilakukan adalah duduk sebentar.', icon: 'leaf' },
  { id: 'gerobak', title: 'Resep lama, obrolan baru.', text: 'Gerobak Pak Joko sudah jadi bagian dari kampung. Coba lihat panci dan bangku kecil di depannya.', icon: 'shop' },
  { id: 'rumah-1', title: 'Yang membuat sebuah rumah.', text: 'Bukan hanya atap dan dinding. Ada jemuran, kebun kecil, dan tetangga yang saling mengenal.', icon: 'house' },
];

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').innerHTML = `${icon('check', 16)}<span>${message}</span>`;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3300);
}

function setNav(active) {
  $$('.nav-button').forEach((b) => {
    b.classList.toggle('is-active', b.id === active);
    if (b.id === active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
function closeResidents() { $('#residents').hidden = true; setNav('nav-explore'); updatePanelLayout(); }
function openDialog(content) {
  $('#dialog-content').innerHTML = content;
  $('#info-dialog').showModal();
  $('#info-dialog').scrollTop = 0;
}
function citySettings() {
  if (!city) return '';
  const { weather, quality } = city.getState();
  return `<section class="city-settings" aria-label="Suasana dan kualitas kota"><h3>Langit di atas kota</h3><div class="setting-options" role="group" aria-label="Cuaca">${[['auto','Mengalir alami'],['clear','Cerah'],['rain','Gerimis']].map(([id,label])=>`<button data-weather="${id}" aria-pressed="${weather.mode===id}">${label}</button>`).join('')}</div><h3>Nyaman untuk perangkatmu</h3><div class="setting-options" role="group" aria-label="Kualitas grafis">${[['auto','Otomatis'],['hemat','Hemat'],['detail','Detail']].map(([id,label])=>`<button data-quality="${id}" aria-pressed="${quality.mode===id}">${label}</button>`).join('')}</div><p class="settings-note" id="quality-status">${quality.mode==='auto'?'Otomatis · ':''}${quality.label}. Detail jauh disederhanakan; waktu kota tetap berjalan sama.</p></section>`;
}
function about() {
  openDialog(`<div class="dialog-illustration">${logo}<span class="tiny-spark">${icon('spark',22)}</span></div><div class="eyebrow">SATU KOTA, BANYAK KEHIDUPAN</div><h2>Lebih jauh.<br>Lebih banyak <em>cerita.</em></h2><p>Kampung Mentari kini tersambung dengan Pasar Kenanga dan Tepi Sungai. Tidak ada target atau uang yang perlu dikejar. Cukup singgah, mendekat, dan lihat kehidupan berjalan.</p><div class="about-stats"><span><b>${city?.agents.length || 40}</b>warga dengan cerita</span><span><b>${city?.places.length || 18}</b>tempat singgah</span><span><b>3</b>kawasan terhubung</span></div><div class="district-list" aria-label="Pilih kawasan">${DISTRICTS.map(d=>`<button data-district="${d.id}"><span class="district-icon">${icon(d.icon,22)}</span><span><strong>${d.name}</strong><small>${d.subtitle}</small></span>${icon('arrow',17)}</button>`).join('')}</div><button class="cinema-start" data-cinema>${icon('film',19)} Duduk & nonton otomatis ${icon('arrow',17)}</button>${citySettings()}`);
}
function help() {
  openDialog(`<div class="dialog-icon">${icon('explore',30)}</div><div class="eyebrow">SEDIKIT PETUNJUK, BANYAK PENEMUAN</div><h2>Lihat lebih <em>dekat.</em></h2><p>Tiga kawasan punya ritmenya sendiri. Jelajahi, atau biarkan kamera bercerita.</p><div class="help-rows"><div>${icon('mouse')}<span><b>Putar kota</b>Geser dengan mouse atau satu jari.</span></div><div>${icon('plus')}<span><b>Mendekat & menjauh</b>Gulir, cubit layar, atau gunakan tombol + / −.</span></div><div>${icon('view')}<span><b>Pindah kawasan</b>Tombol lapisan bergantian mengunjungi kampung, pasar, dan sungai.</span></div><div>${icon('film')}<span><b>Nonton otomatis</b>Tombol film di bawah mengikuti enam adegan, termasuk perjalanan angkot. Geser kamera untuk mengambil alih.</span></div><div>${icon('person')}<span><b>Kenali tetangga</b>Klik warga atau bangunan untuk membaca cerita.</span></div></div><div class="keyboard-help"><span><kbd>Spasi</kbd> Jeda</span><span><kbd>R</kbd> Sudut awal</span><span><kbd>Esc</kbd> Tutup / berhenti</span></div>${citySettings()}`);
}
function refreshWeatherUI(weather) {
  $('.weather-text').textContent = weather.active ? 'Gerimis' : period === 'malam' ? 'Tenang' : 'Cerah';
  $('.weather > svg').outerHTML = icon(weather.active ? 'rain' : period === 'malam' ? 'moon' : 'sun',20);
}
function toggleCinema() {
  if (!city) return;
  const enabled = !city.getState().cinematic.active;
  endTour(false); closeResidents(); closeSelection(); city.setCinematic(enabled);
  toast(enabled ? 'Kamera bercerita sendiri. Geser atau tekan film untuk berhenti.' : 'Nonton otomatis dihentikan.');
}
$('#dialog-content').addEventListener('click', (event) => {
  const button = event.target.closest('button'); if (!button || !city) return;
  if (button.dataset.district) {
    $('#info-dialog').close(); endTour(false); closeResidents(); closeSelection(); city.focusDistrict(button.dataset.district);
    toast(`Singgah di ${DISTRICTS.find(d=>d.id===button.dataset.district).name}.`);
  }
  if (button.hasAttribute('data-cinema')) { $('#info-dialog').close(); toggleCinema(); }
  if (button.dataset.weather) {
    city.setWeather(button.dataset.weather);
    $$('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }
  if (button.dataset.quality) {
    city.setQuality(button.dataset.quality);
    $$('[data-quality]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }
});

function renderResidents(query = '') {
  const filtered = city.agents.filter((a) => `${a.name} ${a.job}`.toLocaleLowerCase('id').includes(query.toLocaleLowerCase('id')));
  $('#residents-list').innerHTML = filtered.length ? filtered.map((a) => `<button class="resident-row" data-id="${a.id}"><span class="resident-avatar" style="--avatar-color:${a.color}">${icon('person', 20)}</span><span><strong>${a.name}</strong><small>${a.job}</small></span>${icon('chevron', 15)}</button>`).join('') : '<p class="empty-state">Belum ketemu. Coba nama lain, ya.</p>';
  $$('.resident-row').forEach((b) => b.addEventListener('click', () => { closeResidents(); endTour(false); city.selectAgent(b.dataset.id); }));
}

function showSelection(type, item) {
  selectedItem = { type, item };
  if (tourIndex >= 0) return;
  closeResidents();
  const isPerson = type === 'person';
  const card = $('#selection');
  card.innerHTML = `<button class="selection-close icon-button" aria-label="Tutup cerita">${icon('close', 17)}</button><div class="selection-content"><div class="selection-overline">${isPerson ? 'KENALI TETANGGAMU' : 'CERITA DARI SUDUT KOTA'}</div><div class="selection-title"><span class="resident-avatar" style="--avatar-color:${item.color}">${icon(isPerson ? 'person' : item.id === 'kopi' ? 'coffee' : item.id === 'taman' ? 'leaf' : 'house', 25)}</span><div><h2>${item.name}</h2><span>${isPerson ? item.job : item.kind}</span></div></div><p>${isPerson ? item.story : item.description}</p>${isPerson ? `<div class="person-activity"><i></i><span id="selected-activity">${item.activity}</span></div>` : `<div class="place-facts">${item.facts.map((f) => `<span>${f}</span>`).join('')}</div>`}</div><button class="selection-action" id="selection-action">${icon(isPerson ? 'person' : 'explore', 16)}<span>${isPerson ? `Ikuti ${item.name}` : 'Lihat lebih dekat'}</span>${icon('arrow', 16)}</button>`;
  card.hidden = false;
  updatePanelLayout();
  $('#selection-action').focus({ preventScroll: true });
  $('.selection-close').addEventListener('click', closeSelection);
  $('#selection-action').addEventListener('click', () => {
    if (isPerson) city.follow(item.id); else { city.selectPlace(item.id); toast(`Sekarang lebih dekat dengan ${item.name}.`); }
  });
}
function closeSelection() { $('#selection').hidden = true; selectedItem = null; city?.deselect(); updatePanelLayout(); }
function updateFollow(value) {
  following = value;
  if (selectedItem?.type !== 'person' || !$('#selection-action')) return;
  const button = $('#selection-action');
  button.classList.toggle('is-following', value);
  button.querySelector('span').textContent = value ? `Berhenti mengikuti ${selectedItem.item.name}` : `Ikuti ${selectedItem.item.name}`;
}

function renderTour() {
  const t = tours[tourIndex];
  $('#tour-card').innerHTML = `<div class="tour-progress">${tours.map((_, i) => `<span class="${i <= tourIndex ? 'is-complete' : ''}"></span>`).join('')}</div><button id="tour-close" class="icon-button" aria-label="Akhiri jalan-jalan">${icon('close', 16)}</button><div class="tour-body"><div class="tour-step">${icon(t.icon, 15)} JALAN-JALAN DI MENTARI <span>0${tourIndex + 1} / 04</span></div><h2>${t.title}</h2><p>${t.text}</p></div><button class="tour-next" id="tour-next">${tourIndex === tours.length - 1 ? 'Kembali menikmati kota' : 'Ke sudut berikutnya'}${icon('arrow', 17)}</button>`;
  $('#tour-card').hidden = false;
  $('#tour-close').addEventListener('click', () => endTour());
  $('#tour-next').addEventListener('click', () => {
    if (tourIndex === tours.length - 1) endTour(); else { tourIndex++; renderTour(); }
  });
  city.selectPlace(t.id, true);
  $('#selection').hidden = true;
  updatePanelLayout();
  $('#tour-next').focus({ preventScroll: true });
}
function startTour() { closeResidents(); closeSelection(); tourIndex = 0; renderTour(); }
function endTour(reset = true) {
  if (tourIndex < 0) return;
  tourIndex = -1; $('#tour-card').hidden = true; closeSelection();
  if (reset) city.reset();
}
function togglePause() {
  if (!city) return;
  running = !running; city.setRunning(running);
  $('#pause').innerHTML = icon(running ? 'pause' : 'play', 19);
  $('#pause').setAttribute('aria-pressed', String(!running));
  $('#pause').setAttribute('aria-label', running ? 'Jeda kehidupan kota (Spasi)' : 'Lanjutkan kehidupan kota (Spasi)');
  $$('.live-text, .mini-live, .local-time-label').forEach((el) => el.classList.toggle('is-paused', !running));
  $('.mini-live').innerHTML = `<i></i> ${running ? 'Hidup' : 'Jeda'}`;
  $('.live-text').innerHTML = `<i></i> ${running ? 'LIVE' : 'JEDA'}`;
  toast(running ? 'Kehidupan kembali berjalan.' : 'Waktu berhenti sebentar. Kamu masih bisa menjelajah.');
}
function setPeriod(value) {
  period = value; city.setPeriod(value); ambience.setPeriod(value);
  shell.dataset.period = value;
  document.querySelector('meta[name="theme-color"]').content = periods[value].background;
  $$('.time-button').forEach((b) => { b.classList.toggle('is-active', b.dataset.period === value); b.setAttribute('aria-pressed', String(b.dataset.period === value)); });
  $('#temperature').textContent = periods[value].temperature;
  $('#time-greeting').textContent = periods[value].greeting;
  refreshWeatherUI(city.getState().weather);
  clockText = '';
}

$('.brand').addEventListener('click', (e) => { e.preventDefault(); if (city) { endTour(false); closeSelection(); closeResidents(); city.reset(); } });
$('#nav-explore').addEventListener('click', () => { closeResidents(); endTour(false); closeSelection(); });
$('#nav-people').addEventListener('click', () => {
  if (!city) return;
  if (!$('#residents').hidden) return closeResidents();
  city.setCinematic(false); endTour(false); closeSelection(); $('#residents').hidden = false; setNav('nav-people'); $('#resident-search').value = ''; renderResidents(); updatePanelLayout(); $('#residents-close').focus({ preventScroll: true });
});
$('#nav-about').addEventListener('click', about);
$('#neighborhood').addEventListener('click', about);
$('#help').addEventListener('click', help);
$('#residents-close').addEventListener('click', () => { closeResidents(); $('#nav-people').focus({ preventScroll: true }); });
$('#resident-search').addEventListener('input', (e) => { if (city) renderResidents(e.target.value); });
$('.dialog-close').addEventListener('click', () => $('#info-dialog').close());
$('#info-dialog').addEventListener('click', (e) => { if (e.target === $('#info-dialog')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
$('#sound').addEventListener('click', async () => {
  try {
    const enabled = await ambience.toggle();
    $('#sound').innerHTML = icon(enabled ? 'volume' : 'mute');
    $('#sound').setAttribute('aria-pressed', String(enabled));
    $('#sound').setAttribute('aria-label', enabled ? 'Matikan suara kota' : 'Nyalakan suara kota');
    $('#sound').dataset.tooltip = enabled ? 'Matikan suara kota' : 'Nyalakan suara kota';
    toast(enabled ? 'Suara angin dan burung dinyalakan. Nikmati pelan-pelan.' : 'Suara kota dimatikan.');
  } catch (error) { toast(error.message); }
});
$('#pause').addEventListener('click', togglePause);
$$('.speed-button').forEach((b) => b.addEventListener('click', () => {
  if (!city) return;
  speed = Number(b.dataset.speed); city.setSpeed(speed);
  $$('.speed-button').forEach((button) => { button.classList.toggle('is-active', button === b); button.setAttribute('aria-pressed', String(button === b)); });
  toast(speed === 1 ? 'Kembali ke ritme santai.' : `Kota bergerak ${speed}× lebih cepat.`);
}));
$$('.time-button').forEach((b) => b.addEventListener('click', () => { if (city) setPeriod(b.dataset.period); }));
$('#reset').addEventListener('click', () => { if (city) { endTour(false); city.reset(); toast('Kembali melihat gambaran besarnya.'); } });
$('#view').addEventListener('click', () => { if (city) { endTour(false); closeSelection(); const d = city.nextView(); toast(`Singgah di ${d.name}.`); } });
$('#zoom-in').addEventListener('click', () => city?.zoom(1));
$('#zoom-out').addEventListener('click', () => city?.zoom(-1));
$('#auto-rotate').addEventListener('click', toggleCinema);
$('#screenshot').addEventListener('click', () => { if (city) { city.screenshot(); toast('Sepotong Kampung Mentari tersimpan sebagai foto.'); } });
$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen();
  } catch { toast('Mode layar penuh tidak tersedia di tampilan ini.'); }
});
$('#labels').addEventListener('click', () => { labels = !labels; $('#annotations').hidden = !labels; $('#labels').setAttribute('aria-pressed', String(labels)); });
$('#tour-start').addEventListener('click', () => { if (city) startTour(); });
$$('.activity-item').forEach((b) => b.addEventListener('click', () => { if (city) { endTour(false); city.selectAgent(b.dataset.agent); } }));
markerButtons.forEach((b) => b.addEventListener('click', () => { if (city) { endTour(false); city.selectPlace(b.dataset.place); } }));
window.addEventListener('keydown', (e) => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || !city || $('#info-dialog').open) return;
  if (e.code === 'Space' && !/BUTTON|A/.test(document.activeElement?.tagName)) { e.preventDefault(); togglePause(); }
  if (e.key.toLowerCase() === 'r') city.reset();
  if (e.key === '+' || e.key === '=') { e.preventDefault(); city.zoom(1); }
  if (e.key === '-' || e.key === '_') { e.preventDefault(); city.zoom(-1); }
  if (e.key === 'Escape') { city.setCinematic(false); endTour(); closeResidents(); closeSelection(); }
});

async function init() {
  try {
    await document.fonts.ready;
    city = await createCity($('#world'), {
      onSelect: showSelection,
      onFollowChange: updateFollow,
      onCinematicChange(value) {
        cinemaTitle = value.active ? value.title : '';
        $('#auto-rotate').setAttribute('aria-pressed',String(value.active));
        $('#auto-rotate').setAttribute('aria-label',value.active ? 'Hentikan nonton otomatis' : 'Nonton otomatis (sinematik)');
        $('#auto-rotate').dataset.tooltip = value.active ? 'Hentikan nonton otomatis' : 'Nonton otomatis (sinematik)';
        $('.speed-control > span').textContent = value.active ? 'NONTON OTOMATIS' : 'RITME KOTA';
      },
      onWeatherChange: refreshWeatherUI,
      onQualityChange(value) { if ($('#quality-status')) $('#quality-status').textContent = `${value.mode==='auto'?'Otomatis · ':''}${value.label}. Detail jauh disederhanakan; waktu kota tetap berjalan sama.`; },
      onFrame({ periodTime, screenPosition, compassAngle, background, moment }) {
        shell.style.backgroundColor = `#${background}`;
        const p = periods[period];
        const minutes = p.hour * 60 + p.minute + Math.floor(periodTime / 9);
        const text = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
        if (text !== clockText) { clockText = text; $('#clock').innerHTML = text.replace(':', '<span class="clock-colon">:</span>'); }
        $('#compass-arrow').style.transform = `rotate(${compassAngle}deg)`;
        const caption = cinemaTitle ? `Nonton otomatis · ${cinemaTitle}` : moment.id === 'welcome' ? 'Geser untuk memutar · Cubit / gulir untuk mendekat' : moment.title;
        if (caption !== sceneCaption) { sceneCaption = caption; $('.scene-hint > span').textContent = caption; }
        const activity = $('#selected-activity');
        if (selectedItem?.type === 'person' && activity && activity.textContent !== selectedItem.item.activity) activity.textContent = selectedItem.item.activity;
        if (city) $$('.activity-item').forEach(b=> {
          const agent = city.agents.find(a=>a.id===b.dataset.agent);
          if (agent && b.querySelector('small').textContent !== agent.activity) { b.querySelector('strong').textContent = agent.name; b.querySelector('small').textContent = agent.activity; }
        });
        if (labels && city) {
          const rect = $('#world').getBoundingClientRect(), occupied = [];
          markerButtons.forEach((b) => {
            const place = city.places.find(a=>a.id===b.dataset.place); if (!place) return;
            const point = screenPosition(place.position), width = b.offsetWidth || 100;
            const x = point.x - rect.left, y = point.y - rect.top - 12;
            const area = {left:x-width/2-5,right:x+width/2+5,top:y-35,bottom:y+8};
            const visible = point.visible && area.left>0 && area.right<rect.width && area.top>0 && area.bottom<rect.height && !occupied.some(a=>a.left<area.right&&a.right>area.left&&a.top<area.bottom&&a.bottom>area.top);
            b.style.left = `${x}px`; b.style.top = `${y}px`; b.style.visibility = visible ? 'visible' : 'hidden';
            if (visible) occupied.push(area);
          });
        }
      },
    });
    $('#resident-count').textContent = city.agents.length;
    $('#place-count').textContent = city.places.length;
    updatePanelLayout();
    shell.classList.remove('is-loading');
    $('#loading').hidden = true;
    // A small read-only inspection hook is useful for smoke tests and diagnostics.
    window.__KOTA_KECIL__ = { getState: () => city.getState(), getStats: () => ({ ...city.stats }) };
  } catch (error) {
    console.error('Kota Kecil could not start:', error);
    $('#loading').innerHTML = `<div class="error-icon">${icon('house', 32)}</div><h2>Kotanya belum bisa dibuka.</h2><p>Pastikan akselerasi grafis / WebGL aktif di browser kamu, lalu coba lagi.</p><button id="retry" class="selection-action">Coba lagi ${icon('reset', 16)}</button>`;
    $('#loading').classList.add('has-error');
    $('#retry').addEventListener('click', () => location.reload());
  }
}
init();

if (import.meta.hot) import.meta.hot.dispose(() => { panelObserver.disconnect(); compactLayout.removeEventListener('change', updatePanelLayout); city?.dispose(); ambience.dispose(); });
