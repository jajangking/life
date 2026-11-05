# Kota yang lebih luas, tetap untuk dinikmati

Upgrade ini memperluas diorama menjadi **tiga kawasan terhubung**, bukan mengubahnya menjadi permainan ekonomi. Seluruh bangunan, jalan, kendaraan, hujan, dan warga adalah geometri / simulasi lokal. Tidak ada layanan AI, peta eksternal, atau API cuaca.

## Kawasan

- **Kampung Mentari**: lingkungan awal dengan Kopi Pagi, toko, gerobak, studio, rumah, dan taman.
- **Pasar Kenanga**: enam kios sayur/buah, tiga ruko dengan tinggi berbeda, klinik, balai warga, serta halte angkot.
- **Tepi Sungai**: dua sayap rusun, perpustakaan, sekolah, rumah tepi air, lapangan, dermaga/perahu, dua jembatan kendaraan, dan satu titian pejalan kaki.

Papan 64×58 unit memiliki sekitar 3,2 kali luas papan awal 36×32. Ada **18 tempat yang bisa dipilih** dan **40 warga bernama**. Ini peta rancangan tetap, bukan generator kota tak terbatas atau editor bangunan.

Tekan **tombol lapisan** untuk berpindah kawasan. Kartu **Kota Mentari** membuka pilihan kawasan, mode nonton, cuaca, dan kualitas. Reset kembali ke gambaran seluruh kota.

## Kehidupan dan lalu lintas

- Enam belas kendaraan mengikuti jalur berjarak terukur dengan tikungan membulat. Mobil/motor mengubah kecepatan, mengerem sebelum garis henti, dan menjaga jarak terhadap kendaraan di depannya, termasuk di tikungan.
- Dua simpang berlampu menggunakan fase hijau, kuning, dan jeda semua-merah. Simpang pasar bergeser delapan detik dari simpang kampung.
- Simpang tanpa lampu memakai reservasi area konflik. Kendaraan lain menunggu sampai kendaraan sebelumnya keluar; ini juga menangani belokan yang memotong arus berlawanan.
- **Angkot 03** berhenti sekitar 11 detik simulasi di Halte Kenanga dan 9 detik di Halte Sekolah. Dua pelajar berjalan naik/turun. Selama naik kendaraan, posisi warga mengikuti angkot dan figur penumpang di jendela terlihat.
- **Adit** berhenti dengan motor sekitar 13 detik simulasi, membawa paket ke pasar, menyerahkannya, lalu kembali berkendara. Paket dan pengemudi di motor bukan sekadar pesan di UI.
- Warga mengikuti perjalanan dengan tujuan, waktu singgah, serta pose duduk/berjalan. Beberapa rutinitas khusus meliputi Sari mengantar kopi, Naya singgah di studio, Pak Budi menata stok, dan warga membaca atau duduk di taman.

Semua angka waktu di atas mengikuti **1× / 2× / 4×**. Jeda menghentikan waktu, kendaraan, perjalanan, penumpang, dan pengiriman. Kamera tetap dapat dipakai. Saat tab tidak terlihat, loop render berhenti dan kota tidak mengejar waktu yang terlewat.

Ini simulasi lalu lintas lokal dan rutinitas terarah, bukan mesin fisika penuh, navigasi pejalan kaki tanpa batas, atau perilaku AI generatif. Kepadatan dan jalurnya sengaja dibatasi agar tetap tenang dan dapat dites.

## Nonton otomatis

Tombol **film** menjalankan director enam adegan berulang: gambaran kota, teras kopi, pasar, perjalanan angkot, sungai, dan sekolah. Pergantian berlangsung sekitar 10–12 detik per adegan, dengan transisi kamera halus.

Geser kamera, gunakan zoom/reset/pindah kawasan, pilih warga/tempat, buka daftar warga, atau tekan Escape untuk mengambil alih. Kamera tidak boleh kembali mengambil alih setelah dihentikan. Tur cerita empat tempat yang lama tetap tersedia secara terpisah.

## Langit dan malam

Di dialog bantuan / kartu kota, pilih **Mengalir alami, Cerah, atau Gerimis**.

- Mode alami memberi gerimis pada detik simulasi 65–95 dari putaran 170 detik.
- Tetes hujan benar-benar dirender; beberapa warga membuka payung. Warga yang tiba di titik teras beratap / berpayung menetap di sana sampai hujan reda, bukan hanya mengganti teks aktivitas. Cahaya matahari meredup, tetapi pilihan pagi/siang/sore/malam tidak diubah paksa.
- Malam menghangatkan lampu/jendela dan menurunkan tiga rolling door toko. Pilihan suasana siang membukanya kembali.
- Perahu, garis air sungai, air mancur, bendera, ayunan, dan burung terus bergerak sesuai waktu simulasi.

Cuaca dan jam tersebut adalah bagian dunia miniatur, **bukan kondisi nyata** di lokasi pengunjung. Pergantian periode hari masih dipilih lewat empat tombol suasana; tidak diklaim sebagai siklus harian otomatis.

## Performa HP

Tiga profil dapat dipilih tanpa reload:

| Profil | Batas rasio piksel | Bayangan | Hujan maksimum |
| --- | --- | --- | --- |
| Hemat | 1 | Mati | 160 garis |
| Seimbang (otomatis di HP) | 1,25 | 1024², di-cache | 260 garis |
| Detail | 1,8 | 2048², di-cache | 420 garis |

Rasio sebenarnya tidak melebihi rasio layar. Mode otomatis menurunkan profil setelah frame lambat berkelanjutan dan menaikkannya kembali hanya setelah periode stabil yang lebih lama; satu hitch tidak langsung mengganti kualitas. Pilihan manual dihormati.

Bangunan memakai **spatial batching 14×14 unit**, vertex colours untuk berbagi material, frustum culling per batch, dan penghilangan detail kecil pada skala jauh. Lampu/jendela yang berubah dan papan bertekstur mempertahankan material masing-masing. Warga dan payung memakai instancing. Tidak ada penambahan menu permanen yang menutupi judul atau mempersempit kanvas HP.

Batas render profil adalah target penjadwalan, bukan janji FPS. Kecepatan aktual bergantung GPU, browser, suhu, dan perangkat. Pengujian emulasi / software WebGL tidak menggantikan pengujian Android atau iPhone fisik.

## Pengujian

```sh
npm run test:simulation
npm test
npm run test:server
npm run test:deploy
npm run build
```

Model Node mencakup lampu merah, antrean, penumpang, pengiriman, jeda, langkah waktu besar, perjalanan warga, director, adaptasi kualitas, serta spatial batching. Skenario sepuluh menit memeriksa pemisahan badan kendaraan dengan separating-axis test dan memastikan setiap kendaraan tetap menyelesaikan perjalanan, sehingga model tidak sekadar membekukan kendaraan untuk menghindari benturan.

Browser memeriksa integrasi WebGL, semua kontrol lama, pindah kawasan, hujan yang dirender, rolling door, nonton otomatis dan pengambilalihan manual, serta kejadian simulasi. Suite HP tetap memeriksa batas judul/kanvas/kontrol, hit-testing sentuh, portrait/landscape, safe area, teks besar, cerita/tur, dan simulasi viewport keyboard.
