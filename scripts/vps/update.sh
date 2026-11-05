#!/usr/bin/env bash
# Runs as the unprivileged application account, never as root.
set -Eeuo pipefail
umask 022

log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }
usage() {
  cat <<'HELP'
Usage: update.sh [--force | --bootstrap | --rollback | --resume]
  (no flag)     Fetch/pull fast-forward only, then deploy if the live commit changed.
  --force       Retry/rebuild immediately, including a previously failed commit.
  --bootstrap   First deployment; wait for the lock and skip the HTTP health check.
  --rollback    Activate the previous release and pause automatic deployment.
  --resume      Resume automatic deployment and deploy the latest remote commit.
HELP
}

mode=update
if (($#)); then
  (($# == 1)) || die 'Gunakan satu opsi saja. Lihat --help.'
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --force) mode=force ;;
    --bootstrap) mode=bootstrap ;;
    --rollback) mode=rollback ;;
    --resume) mode=resume ;;
    *) die "Opsi tidak dikenal: $1" ;;
  esac
fi

config=${KOTA_KECIL_CONFIG:-/etc/kota-kecil.env}
[[ -r "$config" ]] || die "Konfigurasi tidak ditemukan: $config. Jalankan installer dahulu."
# This file is created by the administrator, not read from the Git checkout.
# shellcheck source=/dev/null
source "$config"
: "${APP_DIR:?}" "${APP_USER:?}" "${REPO_URL:?}" "${BRANCH:?}" "${PORT:?}" "${NODE_BIN:?}" "${NPM_BIN:?}"
KEEP_RELEASES=${KEEP_RELEASES:-5}
RETRY_SECONDS=${RETRY_SECONDS:-300}
[[ "$APP_DIR" == /* && "$APP_DIR" != / && "$APP_DIR" != */../* && "$APP_DIR" != */.. ]] || die 'APP_DIR tidak aman.'
[[ "$KEEP_RELEASES" =~ ^[0-9]+$ && "$KEEP_RELEASES" -ge 2 && "$KEEP_RELEASES" -le 50 ]] || die 'KEEP_RELEASES harus 2–50.'
[[ "$RETRY_SECONDS" =~ ^[0-9]+$ ]] || die 'RETRY_SECONDS harus angka.'
[[ "$(id -un)" == "$APP_USER" && "$EUID" -ne 0 ]] || die "Jalankan sebagai $APP_USER, bukan root. Gunakan systemctl start kota-kecil-update.service."

export HOME="$APP_DIR/home"
PATH="$(dirname "$NODE_BIN"):$(dirname "$NPM_BIN"):/usr/local/bin:/usr/bin:/bin"
export PATH
export NPM_CONFIG_CACHE="$APP_DIR/cache/npm"
export NPM_CONFIG_UPDATE_NOTIFIER=false
export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o BatchMode=yes -o ConnectTimeout=15}"
export CI=1
repo="$APP_DIR/repo"
releases="$APP_DIR/releases"
state="$APP_DIR/state"
mkdir -p "$state" "$APP_DIR/work" "$releases" "$APP_DIR/shared/assets"
exec 9>"$state/update.lock"
if [[ "$mode" == bootstrap ]]; then
  flock -w 300 9 || die 'Update lain belum selesai setelah 5 menit.'
else
  flock -n 9 || { log 'Update lain masih berjalan; pemeriksaan ini dilewati.'; exit 0; }
fi

work_dir=''
link_tmp=''
target=''
record_failure=0
pending_activation=0
rollback_to=''
cleanup() {
  local status=$?
  trap - EXIT
  if ((status != 0 && pending_activation)); then
    if [[ -n "$rollback_to" ]]; then activate "$rollback_to"; else rm -f -- "$APP_DIR/current"; fi
  fi
  if [[ -n "$link_tmp" && -L "$link_tmp" ]]; then rm -f -- "$link_tmp"; fi
  if [[ -n "$work_dir" && "$work_dir" == "$APP_DIR/work/"* && -d "$work_dir" ]]; then rm -rf -- "$work_dir"; fi
  if ((status != 0 && record_failure)) && [[ -n "$target" ]]; then
    printf '%s %s\n' "$target" "$(date +%s)" >"$state/failed"
    log "Deployment $target gagal. Release yang sedang tayang tidak diganti (atau sudah dipulihkan)." >&2
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

release_path() {
  local path
  path=$(readlink -f -- "$1" 2>/dev/null) || return 1
  [[ "$path" == "$releases/"* && -d "$path" && -s "$path/index.html" ]] || return 1
  printf '%s\n' "$path"
}
activate() {
  local destination=$1
  [[ ! -e "$APP_DIR/current" || -L "$APP_DIR/current" ]] || die 'current bukan symlink; tidak akan ditimpa.'
  link_tmp="$APP_DIR/.current.next.$$"
  ln -s -- "$destination" "$link_tmp"
  mv -Tf -- "$link_tmp" "$APP_DIR/current"
  link_tmp=''
}
set_previous() {
  local destination=$1
  [[ ! -e "$APP_DIR/previous" || -L "$APP_DIR/previous" ]] || die 'previous bukan symlink; tidak akan ditimpa.'
  link_tmp="$APP_DIR/.previous.next.$$"
  ln -s -- "$destination" "$link_tmp"
  mv -Tf -- "$link_tmp" "$APP_DIR/previous"
  link_tmp=''
}
healthy() {
  local expected=$1 body attempt
  for attempt in 1 2 3; do
    if body=$(curl --fail --silent --show-error --noproxy '*' --max-time 5 "http://127.0.0.1:$PORT/__version.json") && [[ "$body" == *"\"commit\":\"$expected\""* ]]; then
      return 0
    fi
    ((attempt == 3)) || sleep 1
  done
  return 1
}

if [[ "$mode" == rollback ]]; then
  old=$(release_path "$APP_DIR/current") || die 'Belum ada release aktif.'
  previous=$(release_path "$APP_DIR/previous") || die 'Belum ada release sebelumnya untuk rollback.'
  [[ -s "$previous/.deploy-revision" ]] || die 'Metadata release sebelumnya tidak ditemukan.'
  printf 'Rollback manual pada %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >"$state/paused"
  rollback_to=$old
  pending_activation=1
  activate "$previous"
  if ! healthy "$(cat "$previous/.deploy-revision")"; then
    activate "$old"
    pending_activation=0
    die 'Health check rollback gagal; release semula dipulihkan. Auto-update dijeda; gunakan --resume sesudah diperiksa.'
  fi
  set_previous "$old"
  pending_activation=0
  log "Rollback berhasil: $(cat "$previous/.deploy-revision"). Auto-update dijeda; gunakan --resume untuk melanjutkan."
  exit 0
fi
if [[ "$mode" == resume ]]; then rm -f -- "$state/paused"; fi
if [[ -f "$state/paused" ]]; then
  log 'Auto-update sedang dijeda setelah rollback. Gunakan --resume untuk melanjutkan.'
  exit 0
fi

[[ -x "$NODE_BIN" && -x "$NPM_BIN" ]] || die 'Node.js/npm tidak ditemukan; jalankan ulang installer.'
"$NODE_BIN" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)' || die 'Perlu Node.js >=22.12; jalankan ulang installer.'
[[ -d "$repo/.git" ]] || die "Checkout tidak ditemukan di $repo."
git check-ref-format --branch "$BRANCH" >/dev/null || die 'Nama branch tidak valid.'
[[ "$(git -C "$repo" symbolic-ref --quiet --short HEAD)" == "$BRANCH" ]] || die "Checkout VPS harus berada di branch $BRANCH."
[[ "$(git -C "$repo" remote get-url origin)" == "$REPO_URL" ]] || die 'Origin checkout berbeda dari konfigurasi; tidak akan diganti otomatis.'
[[ -z "$(git -C "$repo" status --porcelain)" ]] || die 'Checkout VPS memiliki perubahan lokal. Simpan/selesaikan perubahan itu dahulu; tidak ada reset --hard otomatis.'

log "Memeriksa origin/$BRANCH…"
git -C "$repo" fetch --quiet --no-tags origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
remote=$(git -C "$repo" rev-parse --verify "refs/remotes/origin/$BRANCH^{commit}")
local_head=$(git -C "$repo" rev-parse HEAD)
git -C "$repo" merge-base --is-ancestor "$local_head" "$remote" || die 'Branch berbeda arah/di-force-push atau memiliki commit lokal. Update ditolak; release aktif tetap berjalan.'
if [[ "$local_head" != "$remote" ]]; then
  # Explicitly disallow rebases, merge commits and destructive resets.
  git -C "$repo" pull --ff-only --no-rebase origin "$BRANCH"
fi
target=$(git -C "$repo" rev-parse HEAD)
[[ "$target" == "$(git -C "$repo" rev-parse "refs/remotes/origin/$BRANCH")" ]] || die 'HEAD tidak cocok dengan remote setelah pull.'
active=''
if [[ -r "$APP_DIR/current/.deploy-revision" ]]; then active=$(cat "$APP_DIR/current/.deploy-revision"); fi
if [[ "$active" == "$target" && "$mode" != force ]]; then
  log "Tidak ada perubahan. Release aktif: ${target:0:12}."
  exit 0
fi
if [[ -r "$state/failed" && "$mode" != force && "$mode" != bootstrap && "$mode" != resume ]]; then
  read -r failed_revision failed_at <"$state/failed" || true
  if [[ "${failed_at:-}" =~ ^[0-9]+$ && "${failed_revision:-}" == "$target" ]] && (( $(date +%s) - failed_at < RETRY_SECONDS )); then
    log "Build ${target:0:12} sebelumnya gagal; menunggu retry $RETRY_SECONDS detik atau commit baru."
    exit 0
  fi
fi

record_failure=1
work_dir=$(mktemp -d "$APP_DIR/work/build.XXXXXXXX")
chmod 700 "$work_dir"
git -C "$repo" archive --format=tar "$target" | tar -xf - -C "$work_dir"
log "Membangun ${target:0:12} dengan $("$NODE_BIN" --version)…"
(
  cd "$work_dir"
  "$NPM_BIN" ci --include=dev --no-audit --no-fund
  "$NPM_BIN" run build
)
[[ -s "$work_dir/dist/index.html" ]] || die 'Build tidak menghasilkan dist/index.html.'
# Never expose symlinks or unexpected special files from a build artifact.
[[ -z "$(find "$work_dir/dist" -type l -print -quit)" ]] || die 'Symlink di hasil build ditolak.'
[[ -z "$(find "$work_dir/dist" ! -type d ! -type f -print -quit)" ]] || die 'Hasil build harus berupa file dan direktori biasa.'
release="$releases/$(date -u '+%Y%m%dT%H%M%SZ')-${target:0:12}-$RANDOM"
mv -- "$work_dir/dist" "$release"
chmod -R u=rwX,go=rX "$release"
printf '%s\n' "$target" >"$release/.deploy-revision"
printf '{"app":"kota-kecil","commit":"%s","deployedAt":"%s"}\n' "$target" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >"$release/__version.json"

# Retain old content-hashed assets so an already-open browser can still load them.
# Each file is published atomically before switching the entry HTML.
if [[ -d "$release/assets" ]]; then
  while IFS= read -r -d '' asset; do
    relative=${asset#"$release/assets/"}
    destination="$APP_DIR/shared/assets/$relative"
    if [[ -f "$destination" ]] && cmp -s -- "$asset" "$destination"; then continue; fi
    mkdir -p -- "$(dirname -- "$destination")"
    install -m 644 -- "$asset" "$destination.tmp.$$"
    mv -Tf -- "$destination.tmp.$$" "$destination"
  done < <(find "$release/assets" -type f -print0)
fi
old=$(release_path "$APP_DIR/current" || true)
rollback_to=$old
pending_activation=1
activate "$release"
if [[ "$mode" != bootstrap ]] && ! healthy "$target"; then
  if [[ -n "$old" ]]; then
    activate "$old"
  else
    rm -f -- "$APP_DIR/current"
  fi
  pending_activation=0
  die 'Health check HTTP gagal. Periksa port dan log kota-kecil.service.'
fi
if [[ -n "$old" ]]; then set_previous "$old"; fi
pending_activation=0
rm -f -- "$state/failed"
record_failure=0
log "Deployment aktif: ${target:0:12}."

# Retain the newest N releases plus the active and rollback pointers.
previous=$(release_path "$APP_DIR/previous" || true)
count=0
while IFS= read -r name; do
  count=$((count + 1))
  path="$releases/$name"
  if ((count > KEEP_RELEASES)) && [[ "$path" != "$release" && "$path" != "$previous" ]]; then
    rm -rf -- "$path"
  fi
done < <(find "$releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | LC_ALL=C sort -r)
# Unreferenced assets get a 30-day grace period, not immediate deletion.
while IFS= read -r -d '' asset; do
  relative=${asset#"$APP_DIR/shared/assets/"}
  referenced=0
  for directory in "$releases"/*; do
    if [[ -f "$directory/assets/$relative" ]]; then referenced=1; break; fi
  done
  if ((referenced == 0)); then rm -f -- "$asset"; fi
done < <(find "$APP_DIR/shared/assets" -type f -mtime +30 -print0)
