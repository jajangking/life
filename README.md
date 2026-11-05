# Kota Kecil

Kota miniatur 3D interaktif untuk dinikmati, bukan dikelola. Dibangun dengan **Three.js, JavaScript, dan Vite**. Seluruh kota adalah geometri 3D prosedural, bukan gambar latar. Font dan aset disajikan secara lokal; tidak memerlukan API, akun, atau backend.

## Jalankan

Memerlukan Node.js **22.12+** (atau Node.js 24+).

```sh
npm ci
npm run dev
```

Buka alamat yang diberikan Vite. Dev server mendengarkan pada `0.0.0.0:5173` dan menerima host preview `*.e2b.app` serta hostname Instabox yang didaftarkan di `vite.config.js`. Host lain tetap ditolak; tambahkan hostname spesifik jika alamat preview berubah.

```sh
npm run build       # hasil produksi di dist/
npm run preview     # tinjau hasil produksi
npm start           # server HTTP hasil build di 0.0.0.0:5173
```

## VPS: port 5173 + auto git pull

Tanpa Nginx/PM2/Docker. Setelah kode branch `arena/f9e7d68b-life` di-push:

```bash
git clone --branch arena/f9e7d68b-life --single-branch https://github.com/jajangking/life.git kota-kecil
cd kota-kecil
sudo bash scripts/vps/install.sh --port 5173
```

Perlu Linux dengan systemd, Node.js >=22.12 + npm global, Git, curl, dan util-linux. Buka `http://IP-VPS:5173`. Service bertahan setelah SSH ditutup/reboot; timer memeriksa Git sekitar tiap 60 detik. Build gagal tidak mengganti release yang sedang tayang. **Branch harus sudah dipublikasikan sebelum clone.**

Panduan prasyarat, firewall, log, update manual, dan rollback: **[docs/VPS.md](docs/VPS.md)**.

## Yang bisa ditemukan

- **Tiga kawasan terhubung** dalam satu peta 64×58 unit (sekitar 3,2× luas diorama awal): Kampung Mentari, Pasar Kenanga, dan Tepi Sungai.
- **40 warga bernama, 18 tempat singgah**: kafe, rumah, rusun, pasar enam kios, ruko, klinik, perpustakaan, sekolah, dermaga, dan tiga jembatan.
- **16 kendaraan bergerak**: mobil, motor, kurir, dan angkot 03. Kendaraan mengerem, antre dengan jarak aman, menaati dua persimpangan berlampu, dan bergantian di simpang tanpa lampu.
- Angkot singgah di dua halte; dua pelajar terlihat naik dan turun. Kurir turun dari motor, mengantar paket ke pasar, lalu kembali berkendara.
- Warga mengikuti perjalanan dengan tujuan dan waktu singgah: belanja, membaca, menata dagangan, mengantar kopi, atau duduk di teras.
- Empat suasana **pagi, siang, sore, malam**, lampu dan jendela berubah; beberapa toko menurunkan rolling door saat malam.
- **Gerimis** otomatis atau pilihan manual; tetes hujan, payung warga, warga berteduh di teras, perahu bergoyang, air sungai, air mancur, ayunan, burung, dan jemuran.
- **Nonton otomatis enam adegan**, termasuk kamera mengikuti perjalanan angkot. Geser kamera, zoom, atau pilih warga untuk mengambil alih.
- Kamera orbit, pan, zoom, pintasan pindah kawasan, jeda, dan kecepatan 1× / 2× / 4×. Tur cerita empat tempat tetap tersedia.
- Foto PNG tanpa UI, label tempat yang menghindari tumpang tindih, pencarian / mengikuti warga, dan ambience lokal Web Audio.
- Kualitas **Otomatis / Hemat / Detail**: spatial batching, vertex colours, culling, detail kecil berdasarkan zoom, bayangan di-cache, dan rasio piksel adaptif. Render berhenti ketika tab tidak terlihat.
- Grid HP portrait/landscape memisahkan judul, kanvas, dan kontrol; safe area serta panel cerita tetap terjangkau.

Ini adalah simulasi visual santai. Rute warga dan kendaraan bersifat lokal dan deterministik, bukan simulasi ekonomi atau AI berbasis model bahasa. Waktu dan cuaca di antarmuka adalah bagian dari dunia miniatur, bukan data cuaca nyata.

## Kontrol

| Aksi | Mouse / keyboard | Sentuh |
| --- | --- | --- |
| Putar | Klik kiri & geser | Geser satu jari |
| Zoom | Gulir atau `+` / `−` | Cubit atau tombol + / − |
| Pan | Klik kanan & geser | Geser dua jari |
| Cerita warga / tempat | Klik | Ketuk |
| Jeda / lanjut | `Spasi` atau tombol jeda | Tombol jeda |
| Sudut awal | `R` | Tombol reset |
| Pindah kawasan | Tombol lapisan | Tombol lapisan |
| Nonton otomatis | Tombol film | Tombol film |
| Cuaca / kualitas | Buka bantuan atau kartu kota | Buka bantuan atau kartu kota |
| Tutup cerita / hentikan kamera otomatis | `Esc` | Tombol tutup / film |

Audio tidak diputar otomatis; diperlukan interaksi pengguna. Foto mengunduh render kota tanpa lapisan antarmuka.

## Pengujian

```sh
npx playwright install --with-deps chromium
npm test
npm run test:simulation
npm run test:server
npm run test:deploy
```

Pengujian browser memeriksa render WebGL, kontrol simulasi, pencarian / mengikuti warga, tur, bantuan, unduh foto, tata letak mobile, dan fallback WebGL. Suite mobile memakai emulasi sentuh pada layar 320×568 sampai 430×932, landscape 568×320 sampai 932×430, perubahan tinggi browser, safe area, dan teks yang diperbesar. Batas judul, kanvas, dan kontrol diperiksa agar tidak bertumpuk; panel cerita/tur serta pencarian dengan simulasi penyempitan viewport keyboard juga diuji. Untuk browser Chromium yang sudah tersedia, set `CHROMIUM_PATH` ke executable tersebut. Pengujian memakai SwiftShader agar WebGL juga bisa berjalan tanpa GPU fisik.

Suite simulasi Node menguji fase lampu, antrean, jarak kendaraan, halte, penumpang, kurir, rutinitas warga, kamera, dan kualitas. Skenario lalu lintas sepuluh menit memeriksa benturan badan kendaraan serta kelanjutan perjalanan, bukan sekadar membaca label UI. Browser juga menguji pindah kawasan, hujan yang dirender, rolling door malam, dan pengambilalihan kamera sinematik.

Detail perilaku dan batas simulasi: **[docs/CITY_LIFE.md](docs/CITY_LIFE.md)**.

## Struktur

- `src/main.js` — antarmuka, pilihan suasana, cerita, tur, dan interaksi.
- `src/mobile.css` — grid HP portrait/landscape, safe area, kontrol sentuh, dan panel cerita.
- `src/city.js` — renderer, kamera, pencahayaan, pemilihan objek, dan loop simulasi.
- `src/world/kit.js` — primitif, material cache, tekstur papan nama, dan static geometry batching.
- `src/world/buildings.js` — bangunan dan taman dengan detail individual.
- `src/world/props.js` — tanaman, bangku, lampu, pagar, jemuran, dan objek lingkungan.
- `src/world/streets.js` — lapisan diorama, jalan, trotoar, dan lampu lalu lintas.
- `src/world/districts.js` — kawasan pasar dan sungai, sekolah, jembatan, serta bangunan tambahan.
- `src/world/simulation.js` — model deterministik lalu lintas, perjalanan warga, director kamera, dan adaptasi kualitas; dapat dites tanpa WebGL.
- `src/world/weather.js` — gerimis yang dibatasi jumlahnya menurut kualitas render.
- `src/world/life.js` — warga dengan instanced meshes, kendaraan, dan burung.
- `src/ambience.js` — ambience sintetis lokal.

Geometri statis digabung per wilayah dan keluarga material dengan vertex colours; warga memakai instancing. Detail kecil disembunyikan saat jauh, shadow map statis di-cache, dan rasio piksel dibatasi. Kinerja sesungguhnya bergantung pada perangkat; tes software WebGL bukan jaminan FPS untuk semua HP. Semua perubahan sesi dikerjakan pada branch Arena yang aktif.
