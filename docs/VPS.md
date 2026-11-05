# Jalankan Kota Kecil di VPS — port 5173

Langsung jalan di **`0.0.0.0:5173`**, tanpa Nginx, Docker, PM2, atau domain tambahan. Bisa diakses melalui `http://IP-VPS:5173`, atau proxy/tunnel Instabox yang sudah mengarah ke port itu.

Server menyajikan hasil `npm run build` dengan Node.js, bukan mengekspos dev server Vite. Systemd menjaga proses tetap hidup setelah SSH ditutup, menghidupkannya lagi setelah reboot/crash, dan memeriksa Git secara berkala.

## 1. Prasyarat

- VPS Linux dengan **systemd** (contoh Ubuntu 22.04/24.04 atau Debian 12/13).
- Akses root / sudo untuk memasang service.
- **Node.js >=22.12 + npm**, terpasang global dan dapat diakses user service. Node.js 24 LTS disarankan. Node di `/root/.nvm` atau `/home/...` tidak dipakai oleh service yang dilindungi `ProtectHome`.
- Git, curl, util-linux (flock/runuser), tar, dan coreutils.

```bash
# Ubuntu/Debian, jika utilitas ini belum ada:
sudo apt-get update
sudo apt-get install -y git curl util-linux tar coreutils
node --version
npm --version
```

Installer tidak memasang/meng-upgrade Node secara otomatis agar tidak mengubah runtime aplikasi lain di VPS. Bila versi Node terlalu lama, pasang Node.js 24 LTS secara global dahulu.

> **Push kode dahulu.** Script dan aplikasi harus sudah di-commit dan di-push ke branch `arena/f9e7d68b-life` sebelum perintah clone berikut dapat mengambilnya. Branch `main` yang masih berisi README saja tidak cukup. Installer tidak melakukan push dari VPS dan tidak mengubah branch di workspace Arena.

## 2. Clone dan jalankan sekali

```bash
git clone --branch arena/f9e7d68b-life --single-branch https://github.com/jajangking/life.git kota-kecil
cd kota-kecil
sudo bash scripts/vps/install.sh --port 5173
```

Kalau login sebagai root, `sudo` boleh dihilangkan.

Installer membuat akun sistem `kota-kecil`, clone kerja terpisah di `/opt/kota-kecil/repo`, melakukan build pertama, lalu memasang:

- `kota-kecil.service` — HTTP server Node di port 5173.
- `kota-kecil-update.service` — satu pemeriksaan Git dan deployment.
- `kota-kecil-update.timer` — pemeriksaan sekitar **setiap 60 detik** (ditambah jeda penjadwalan beberapa detik).

Setelah berhasil, buka **`http://IP-VPS:5173`**. `localhost:5173` hanya bisa dipakai dari dalam VPS, bukan browser laptop. Tidak perlu mengubah allowlist Vite untuk server produksi ini.

**Jika port 5173 sudah dipakai Vite/proses lama, hentikan proses lama itu dahulu**, atau pilih port lain. Installer tidak membunuh proses asing dan tidak mengubah Nginx/firewall. Bila UFW aktif:

```bash
sudo ufw allow 5173/tcp
```

Izinkan juga TCP 5173 di firewall/security group penyedia VPS jika diperlukan. Untuk URL HTTPS Instabox, proxy/tunnel harus tetap berjalan dan meneruskan ke port 5173; script ini tidak membuat domain atau sertifikat HTTPS.

## 3. Auto git pull

Tidak perlu menjalankan apa-apa lagi. Setiap pemeriksaan:

1. Cek remote branch yang dipilih.
2. `git pull --ff-only --no-rebase` bila ada commit baru. Tidak ada `reset --hard`.
3. Build di folder sementara memakai `npm ci --include=dev` dan `npm run build`.
4. Jika sukses, pindahkan symlink `current` secara atomik. Server langsung membaca release baru, **tanpa restart proses pada setiap update**.
5. Periksa `http://127.0.0.1:5173/__version.json`. Jika health check gagal, kembalikan release lama.

Build gagal tidak mengganti versi yang sedang tayang. Commit gagal dicoba ulang setelah 5 menit, atau langsung saat ada commit berbeda. Lock mencegah dua build berjalan bersamaan. Perubahan lokal/commit divergen pada checkout VPS ditolak, bukan dihapus.

Aset ber-hash versi lama tetap tersedia untuk tab browser yang sudah terbuka. Lima release terbaru serta release aktif/rollback disimpan; aset tak terpakai memiliki masa tenggang 30 hari. Tab yang sedang terbuka **tidak otomatis reload**—refresh untuk melihat versi baru.

Contoh mengganti interval atau port:

```bash
sudo bash scripts/vps/install.sh --port 5173 --interval 60
```

`--branch NAMA` dan `--repo URL` juga tersedia. Jangan ganti branch pada checkout VPS secara manual; gunakan installer/config yang konsisten.

## 4. Cek status dan log

```bash
sudo systemctl status kota-kecil --no-pager
sudo systemctl list-timers kota-kecil-update.timer
sudo journalctl -u kota-kecil -f
sudo journalctl -u kota-kecil-update -f
curl http://127.0.0.1:5173/__version.json
```

Update manual / restart server:

```bash
sudo systemctl start kota-kecil-update.service
sudo systemctl restart kota-kecil.service
```

Retry build gagal segera:

```bash
sudo -u kota-kecil /usr/local/lib/kota-kecil/update.sh --force
```

## 5. Rollback dan pause

```bash
# Kembali ke release sebelumnya DAN jeda auto-deployment agar tidak langsung ditimpa:
sudo -u kota-kecil /usr/local/lib/kota-kecil/update.sh --rollback

# Lanjutkan dan deploy commit terbaru:
sudo -u kota-kecil /usr/local/lib/kota-kecil/update.sh --resume

# Atau matikan timer seluruhnya:
sudo systemctl disable --now kota-kecil-update.timer
# Aktifkan timer lagi:
sudo systemctl enable --now kota-kecil-update.timer
```

Service website tetap berjalan ketika timer dimatikan. Jika dijeda lewat `--rollback`, gunakan `--resume`; mengaktifkan timer saja tidak menghapus jeda tersebut.

## Repository privat

Default HTTPS bekerja untuk repo publik. Untuk repo privat, pasang **read-only SSH deploy key** milik akun `kota-kecil` di `/opt/kota-kecil/home/.ssh`, verifikasi host key GitHub, lalu gunakan:

```bash
sudo bash scripts/vps/install.sh --repo git@github.com:jajangking/life.git --port 5173
```

User service tidak memakai credential/root SSH agent. Jangan taruh token/password dalam URL, kode, atau chat. Kegagalan autentikasi/update dicatat di journal; website versi lama tetap berjalan.

## Menjalankan tanpa service (opsional)

Jika hanya mau proses biasa di terminal:

```bash
npm ci
npm run build
npm start                       # 0.0.0.0:5173
# npm start -- --port 8000       # port lain
```

Mode manual ini **tidak** memasang auto-pull atau autostart. Gunakan installer systemd untuk keduanya.

## File dan pemeliharaan

- `/etc/kota-kecil.env` — konfigurasi root-owned, tidak dibaca dari Git.
- `/usr/local/lib/kota-kecil/` — server dan updater terpasang.
- `/opt/kota-kecil/repo` — checkout bersih khusus deployment.
- `/opt/kota-kecil/current`, `previous`, `releases`, `shared/assets` — release dan aset publik.
- `/opt/kota-kecil/state`, `work`, `cache`, `home` — state dan cache service.

Frontend otomatis diperbarui dari Git. Perubahan **installer/server/updater system-level** sengaja tidak dijalankan sebagai root secara otomatis; review script terbaru dan jalankan installer lagi jika file infrastruktur berubah. Instalasi ulang bisa me-restart service sebentar.

## Pengujian lokal

```bash
npm run test:server    # HTTP server, MIME/cache, traversal, symlink, pergantian release
npm run test:deploy    # 11 skenario updater dengan remote Git lokal + npm/curl tiruan
```

Pengujian ini tidak memasang service atau menyentuh `/opt` pada mesin pengujian. Instalasi systemd sesungguhnya tetap perlu dijalankan oleh pemilik VPS; belum ada akses ke VPS yang diberikan dalam sesi ini.
