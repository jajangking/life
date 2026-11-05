#!/usr/bin/env bash
# Ubuntu/Debian + systemd. No Nginx, Docker, PM2, or globally installed npm packages.
set -Eeuo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

APP_DIR=/opt/kota-kecil
APP_USER=kota-kecil
REPO_URL=https://github.com/jajangking/life.git
BRANCH=arena/f9e7d68b-life
PORT=5173
INTERVAL=60
MANAGED='# Managed by Kota Kecil VPS installer'
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
log() { printf '[kota-kecil] %s\n' "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }
usage() {
  cat <<'HELP'
Usage: sudo bash scripts/vps/install.sh [options]
  --port NUMBER       Port HTTP, default 5173 (1024–65535).
  --interval SECONDS  Cek Git setiap N detik, default 60 (15–86400).
  --branch NAME       Branch yang diikuti, default arena/f9e7d68b-life.
  --repo URL          Repository HTTPS/SSH GitHub, default jajangking/life.git.

Perlu Node.js >=22.12 + npm yang bisa dijalankan secara global, Git, curl,
util-linux (flock/runuser), dan VPS dengan systemd. Hasil build disajikan
langsung di 0.0.0.0:5173, tanpa Nginx dan tanpa Vite development server.
HELP
}
while (($#)); do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --port|--interval|--branch|--repo)
      (($# >= 2)) || die "Opsi $1 perlu nilai."
      case "$1" in
        --port) PORT=$2 ;; --interval) INTERVAL=$2 ;;
        --branch) BRANCH=$2 ;; --repo) REPO_URL=$2 ;;
      esac
      shift 2 ;;
    *) die "Opsi tidak dikenal: $1" ;;
  esac
done
[[ "$PORT" =~ ^[0-9]{1,5}$ ]] || die 'Port harus angka.'
PORT=$((10#$PORT))
((PORT >= 1024 && PORT <= 65535)) || die 'Port harus 1024–65535.'
[[ "$INTERVAL" =~ ^[0-9]{1,5}$ ]] || die 'Interval harus angka.'
INTERVAL=$((10#$INTERVAL))
((INTERVAL >= 15 && INTERVAL <= 86400)) || die 'Interval harus 15–86400 detik.'
[[ "$REPO_URL" =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ || "$REPO_URL" =~ ^git@github\.com:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die 'Gunakan URL GitHub HTTPS biasa atau SSH; jangan masukkan token ke URL.'
((EUID == 0)) || die 'Jalankan dengan sudo bash scripts/vps/install.sh.'
for command in git curl flock runuser systemctl useradd install tar node npm; do
  command -v "$command" >/dev/null || die "Perintah $command belum tersedia. Pasang prasyarat di docs/VPS.md."
done
[[ -d /run/systemd/system ]] || die 'Perlu VPS yang menjalankan systemd; bukan container/shell tanpa init.'
git check-ref-format --branch "$BRANCH" >/dev/null || die 'Nama branch tidak valid.'
NODE_BIN=$(command -v node)
NPM_BIN=$(command -v npm)
case "$(readlink -f "$NODE_BIN")" in /root/*|/home/*) die 'Pasang Node global di /usr/bin atau /usr/local/bin, bukan folder home/NVM; service memakai ProtectHome.' ;; esac
[[ "$NODE_BIN" =~ ^/[A-Za-z0-9_./-]+$ && "$NPM_BIN" =~ ^/[A-Za-z0-9_./-]+$ ]] || die 'Path Node/npm harus absolut tanpa spasi.'
"$NODE_BIN" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)' || die 'Perlu Node.js >=22.12. Node.js 24 LTS disarankan.'
[[ -f "$script_dir/update.sh" && -f "$script_dir/../serve.mjs" ]] || die 'File script pendamping tidak lengkap; clone seluruh repository.'
[[ ! -L "$APP_DIR" ]] || die "$APP_DIR tidak boleh berupa symlink."
if [[ -d "$APP_DIR" && ! -f /etc/kota-kecil.env ]] && [[ -n "$(ls -A "$APP_DIR")" ]]; then
  die "$APP_DIR sudah berisi file lain; tidak akan ditimpa."
fi
for file in /etc/kota-kecil.env /etc/systemd/system/kota-kecil.service /etc/systemd/system/kota-kecil-update.service /etc/systemd/system/kota-kecil-update.timer; do
  [[ ! -L "$file" ]] || die "Tidak akan menimpa symlink $file."
  if [[ -f "$file" ]] && ! grep -qF "$MANAGED" "$file"; then die "Konfigurasi bukan milik installer: $file"; fi
done

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --user-group --home-dir "$APP_DIR/home" --shell /usr/sbin/nologin "$APP_USER"
else
  [[ "$(getent passwd "$APP_USER" | cut -d: -f6)" == "$APP_DIR/home" ]] || die "Akun $APP_USER sudah dipakai untuk hal lain."
fi
for directory in "$APP_DIR" "$APP_DIR/home" "$APP_DIR/cache" "$APP_DIR/cache/npm" "$APP_DIR/state" "$APP_DIR/work" "$APP_DIR/releases" "$APP_DIR/shared" "$APP_DIR/shared/assets"; do
  [[ ! -L "$directory" ]] || die "Direktori tidak boleh berupa symlink: $directory"
  install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$directory"
done
chmod 700 "$APP_DIR/home" "$APP_DIR/cache" "$APP_DIR/state" "$APP_DIR/work"
as_app() {
  runuser -u "$APP_USER" -- env HOME="$APP_DIR/home" \
    PATH="$(dirname "$NODE_BIN"):$(dirname "$NPM_BIN"):/usr/local/bin:/usr/bin:/bin" \
    GIT_TERMINAL_PROMPT=0 'GIT_SSH_COMMAND=ssh -o BatchMode=yes -o ConnectTimeout=15' "$@"
}
as_app "$NODE_BIN" -e 'process.exit(0)' || die 'Node tidak bisa diakses user service. Pasang Node secara global, bukan di /root/.nvm.'
as_app "$NPM_BIN" --version >/dev/null || die 'npm tidak bisa diakses user service. Pasang Node/npm secara global.'

# Only clone an absent checkout. Never reset or overwrite an existing working tree.
if [[ ! -e "$APP_DIR/repo" ]]; then
  log "Clone $REPO_URL ($BRANCH)…"
  if ! as_app git clone --single-branch --branch "$BRANCH" -- "$REPO_URL" "$APP_DIR/repo"; then
    die "Clone gagal. Pastikan branch sudah di-push. Untuk repo privat, pasang read-only deploy key di $APP_DIR/home/.ssh lalu ulangi dengan --repo git@github.com:jajangking/life.git."
  fi
  chmod 700 "$APP_DIR/repo"
fi
[[ -d "$APP_DIR/repo/.git" && ! -L "$APP_DIR/repo" ]] || die 'Checkout VPS bukan repository Git biasa.'

backup=$(mktemp -d)
timer_was_active=0
systemctl is-active --quiet kota-kecil-update.timer && timer_was_active=1
if ((timer_was_active)); then systemctl stop kota-kecil-update.timer; fi
files=(/etc/kota-kecil.env /usr/local/lib/kota-kecil/update.sh /usr/local/lib/kota-kecil/serve.mjs)
for index in "${!files[@]}"; do
  if [[ -f "${files[$index]}" ]]; then cp -p -- "${files[$index]}" "$backup/$index"; fi
done
finished=0
cleanup() {
  local status=$?
  trap - EXIT
  if ((status != 0 && finished == 0)); then
    for index in "${!files[@]}"; do
      if [[ -f "$backup/$index" ]]; then cp -p -- "$backup/$index" "${files[$index]}"; else rm -f -- "${files[$index]}"; fi
    done
    if ((timer_was_active)); then systemctl start kota-kecil-update.timer || true; fi
    log 'Setup belum selesai. Release yang sudah tayang tidak dihapus; periksa pesan error di atas.' >&2
  fi
  rm -rf -- "$backup"
  exit "$status"
}
trap cleanup EXIT
install -d -m 755 /usr/local/lib/kota-kecil
install -m 755 "$script_dir/update.sh" /usr/local/lib/kota-kecil/update.sh
install -m 644 "$script_dir/../serve.mjs" /usr/local/lib/kota-kecil/serve.mjs
{
  printf '%s\n' "$MANAGED"
  for name in APP_DIR APP_USER REPO_URL BRANCH PORT NODE_BIN NPM_BIN; do printf '%s=%q\n' "$name" "${!name}"; done
  printf 'KEEP_RELEASES=5\nRETRY_SECONDS=300\n'
} >"$backup/config"
install -o root -g "$APP_USER" -m 640 "$backup/config" /etc/kota-kecil.env
as_app /usr/local/lib/kota-kecil/update.sh --bootstrap

cat >/etc/systemd/system/kota-kecil.service <<UNIT
$MANAGED
[Unit]
Description=Kota Kecil on port $PORT
After=network.target
[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$NODE_BIN /usr/local/lib/kota-kecil/serve.mjs --host 0.0.0.0 --port $PORT --dir $APP_DIR/current --assets $APP_DIR/shared/assets
Restart=always
RestartSec=3
TimeoutStopSec=15
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
[Install]
WantedBy=multi-user.target
UNIT
cat >/etc/systemd/system/kota-kecil-update.service <<UNIT
$MANAGED
[Unit]
Description=Pull and build Kota Kecil safely
Wants=network-online.target
After=network-online.target
[Service]
Type=oneshot
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/lib/kota-kecil/update.sh
TimeoutStartSec=15min
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=$APP_DIR
UMask=0022
UNIT
cat >/etc/systemd/system/kota-kecil-update.timer <<UNIT
$MANAGED
[Unit]
Description=Check Kota Kecil Git updates every $INTERVAL seconds
[Timer]
OnBootSec=60
OnUnitInactiveSec=$INTERVAL
AccuracySec=5
RandomizedDelaySec=5
Unit=kota-kecil-update.service
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable kota-kecil.service
systemctl restart kota-kecil.service
# A bounded readiness check; this is a fresh service start, not the update timer.
healthy=0
expected=$(cat "$APP_DIR/current/.deploy-revision")
for attempt in 1 2 3 4 5; do
  if body=$(curl --fail --silent --noproxy '*' --max-time 3 "http://127.0.0.1:$PORT/__version.json") && [[ "$body" == *"\"commit\":\"$expected\""* ]]; then healthy=1; break; fi
  ((attempt == 5)) || sleep 1
done
if ((healthy == 0)); then
  systemctl stop kota-kecil.service
  die "Server belum bisa diakses pada port $PORT. Cek journalctl -u kota-kecil -n 50 dan pastikan port tidak dipakai proses lain."
fi
systemctl enable --now kota-kecil-update.timer
finished=1
log "Selesai. Buka http://IP-VPS:$PORT (bukan localhost di browser laptop lo)."
log "Auto git pull: tiap sekitar $INTERVAL detik. Tetap hidup setelah SSH ditutup/reboot."
log "Jika ada firewall, izinkan TCP $PORT; installer tidak mengubah firewall atau layanan lain."
log 'Log aplikasi: sudo journalctl -u kota-kecil -f'
log 'Log auto-update: sudo journalctl -u kota-kecil-update -f'
