# Kota Kecil

Miniatur kampung 3D interaktif untuk dinikmati, bukan dikelola. Dibangun dengan **Three.js, JavaScript, dan Vite**. Seluruh kota adalah geometri 3D prosedural, bukan gambar latar. Font dan aset disajikan secara lokal; tidak memerlukan API, akun, atau backend.

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

- Satu diorama Kampung Mentari: rumah susun, toko kelontong, kafe, gerobak nasi goreng, studio, tiga rumah, dan taman.
- **28 warga** bernama: berjalan pada rute lingkungan, beristirahat, bekerja, atau duduk di taman dan teras.
- Lalu lintas kecil, angkot, motor, zebra cross, dan dua fase lampu lalu lintas.
- Detail geometris: genteng, balkon, jemuran, antena, tangki air, AC, cangkir kopi, peti buah, kebun sayur, pagar, sepeda, drainase, dan kabel listrik.
- Empat suasana **pagi, siang, sore, malam**, dengan pencahayaan, bayangan, jendela, dan lampu jalan yang berubah.
- Bendera bergoyang, ayunan, burung terbang, air mancur, dan lampu gantung teras.
- Kamera orbit, zoom, pan, empat sudut pandang, putaran otomatis, jeda, dan kecepatan 1× / 2× / 4×.
- Klik warga / bangunan untuk membaca cerita; cari dan ikuti warga; ikuti tur empat sudut kampung.
- Unduh foto PNG kota, sembunyikan label, atau nyalakan ambience angin dan burung yang dibuat dengan Web Audio.
- Tata letak responsif, kontrol sentuh, dialog bantuan, navigasi keyboard, dan fallback jika WebGL tidak tersedia.

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
| Tutup cerita | `Esc` | Tombol tutup |

Audio tidak diputar otomatis; diperlukan interaksi pengguna. Foto mengunduh render kota tanpa lapisan antarmuka.

## Pengujian

```sh
npx playwright install --with-deps chromium
npm test
npm run test:server
npm run test:deploy
```

Enam pengujian browser memeriksa render WebGL, kontrol simulasi, pencarian / mengikuti warga, tur, bantuan, unduh foto, tata letak mobile, dan fallback WebGL. Untuk browser Chromium yang sudah tersedia, set `CHROMIUM_PATH` ke executable tersebut. Pengujian memakai SwiftShader agar WebGL juga bisa berjalan tanpa GPU fisik.

## Struktur

- `src/main.js` — antarmuka, pilihan suasana, cerita, tur, dan interaksi.
- `src/city.js` — renderer, kamera, pencahayaan, pemilihan objek, dan loop simulasi.
- `src/world/kit.js` — primitif, material cache, tekstur papan nama, dan static geometry batching.
- `src/world/buildings.js` — bangunan dan taman dengan detail individual.
- `src/world/props.js` — tanaman, bangku, lampu, pagar, jemuran, dan objek lingkungan.
- `src/world/streets.js` — lapisan diorama, jalan, trotoar, dan lampu lalu lintas.
- `src/world/life.js` — warga dengan instanced meshes, kendaraan, dan burung.
- `src/ambience.js` — ambience sintetis lokal.

Geometri statis digabung berdasarkan material, warga menggunakan instancing, shadow map statis di-cache, dan rasio piksel dibatasi untuk menjaga biaya render tetap wajar. Semua perubahan sesi dikerjakan pada branch Arena yang aktif.
