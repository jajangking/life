#!/usr/bin/env bash
# Isolated local Git remotes + fake npm/curl. Does not install services or touch /opt.
set -Eeuo pipefail
((EUID != 0)) || { printf 'Run deployment tests as a non-root user.\n' >&2; exit 1; }
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
updater="$root/scripts/vps/update.sh"
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
branch=arena/f9e7d68b-life
app="$fixture/app"
seed="$fixture/seed"
remote="$fixture/origin.git"
mkdir -p "$seed" "$app"/{home,bin,state,work,cache,releases,shared/assets}
export FIXTURE_APP_DIR="$app"
export KOTA_KECIL_CONFIG="$fixture/config"
cat >"$KOTA_KECIL_CONFIG" <<CONFIG
APP_DIR='$app'
APP_USER='$(id -un)'
REPO_URL='$remote'
BRANCH='$branch'
PORT=5173
NODE_BIN='$(command -v node)'
NPM_BIN='$app/bin/npm'
KEEP_RELEASES=2
RETRY_SECONDS=300
CONFIG
cat >"$app/bin/npm" <<'NPM'
#!/usr/bin/env bash
set -eu
if [[ "$1" == ci ]]; then
  [[ ! -f fail-ci ]] || exit 42
elif [[ "$1 $2" == 'run build' ]]; then
  printf 'build\n' >>"$FIXTURE_APP_DIR/build.log"
  [[ ! -f fail-build ]] || exit 43
  mkdir -p dist/assets/fonts
  cp page.txt dist/index.html
  id=$(cat asset-id.txt)
  printf 'asset %s' "$id" >"dist/assets/app-$id.js"
  printf 'font %s' "$id" >"dist/assets/fonts/font-$id.woff2"
else
  exit 44
fi
NPM
cat >"$app/bin/curl" <<'CURL'
#!/usr/bin/env bash
[[ ! -f "$FIXTURE_APP_DIR/state/fail-health" ]] || exit 22
cat "$FIXTURE_APP_DIR/current/__version.json"
CURL
chmod +x "$app/bin/"*
git init --quiet --bare --initial-branch="$branch" "$remote"
git init --quiet --initial-branch="$branch" "$seed"
git -C "$seed" config user.email test@example.invalid
git -C "$seed" config user.name 'Deployment test'
git -C "$seed" remote add origin "$remote"
commit() {
  git -C "$seed" add .
  git -C "$seed" commit --quiet -m "$1"
  git -C "$seed" push --quiet origin "$branch"
}
run_update() { bash "$updater" "$@" >>"$fixture/update.log" 2>&1; }
assert_live() { [[ "$(cat "$app/current/index.html")" == "$1" ]] || { cat "$fixture/update.log"; exit 1; }; }
expect_failure() { if run_update "$@"; then printf 'Expected update to fail\n' >&2; exit 1; fi; }
pass() { printf 'PASS: %s\n' "$*"; }

printf 'v1\n' >"$seed/page.txt"; printf 'one\n' >"$seed/asset-id.txt"; commit initial
git clone --quiet --single-branch --branch "$branch" "$remote" "$app/repo"
run_update --bootstrap
assert_live v1
[[ -s "$app/shared/assets/app-one.js" && -s "$app/shared/assets/fonts/font-one.woff2" ]]
[[ -z "$(find "$app/work" -mindepth 1 -print -quit)" ]]
pass 'initial build, assets and temporary-directory cleanup'

builds=$(wc -l <"$app/build.log")
run_update
[[ "$(wc -l <"$app/build.log")" == "$builds" ]]
pass 'no rebuild when the remote commit is unchanged'

printf 'v2\n' >"$seed/page.txt"; printf 'two\n' >"$seed/asset-id.txt"; commit update
run_update
assert_live v2
[[ "$(cat "$app/previous/index.html")" == v1 && -f "$app/shared/assets/app-one.js" ]]
pass 'fast-forward pull, atomic activation and old-asset retention'

printf 'v3\n' >"$seed/page.txt"; touch "$seed/fail-build"; commit failed-build
expect_failure
assert_live v2
[[ -f "$app/state/failed" && -z "$(find "$app/work" -mindepth 1 -print -quit)" ]]
builds=$(wc -l <"$app/build.log")
run_update
[[ "$(wc -l <"$app/build.log")" == "$builds" ]]
expect_failure --force
assert_live v2
pass 'failed builds preserve the live version, retry backs off and --force retries'

rm "$seed/fail-build"; printf 'v4\n' >"$seed/page.txt"; printf 'four\n' >"$seed/asset-id.txt"; commit repaired
# The fake HTTP endpoint fails after activation; the old symlink must be restored.
touch "$app/state/fail-health"
expect_failure
assert_live v2
rm "$app/state/fail-health"
run_update --force
assert_live v4
pass 'HTTP health-check failure rolls back; a forced retry can recover'

run_update --rollback
assert_live v2
[[ -f "$app/state/paused" ]]
run_update
assert_live v2
run_update --resume
assert_live v4
[[ ! -f "$app/state/paused" ]]
pass 'manual rollback pauses automatic deployment until --resume'

printf 'local edit\n' >>"$app/repo/page.txt"
expect_failure
assert_live v4
git -C "$app/repo" restore page.txt
pass 'local edits are rejected, not overwritten by reset --hard'

(
  exec 8>"$app/state/update.lock"
  flock 8
  run_update
)
assert_live v4
pass 'a concurrent updater is skipped without overlapping builds'

printf 'v5\n' >"$seed/page.txt"; touch "$seed/fail-ci"; commit failed-install
expect_failure
assert_live v4
pass 'npm ci failure also preserves the running version'

# An unexpected local commit must not be silently deployed or discarded.
git -C "$app/repo" config user.email test@example.invalid
git -C "$app/repo" config user.name 'Deployment test'
printf 'local commit\n' >"$app/repo/local.txt"
git -C "$app/repo" add local.txt
git -C "$app/repo" commit --quiet -m 'unexpected local commit'
expect_failure
assert_live v4
pass 'local-only/diverging commits are rejected'

bash -n "$root/scripts/vps/install.sh" "$updater"
bash "$root/scripts/vps/install.sh" --help >/dev/null
if bash "$root/scripts/vps/install.sh" --port 70000 >"$fixture/invalid.log" 2>&1; then exit 1; fi
if bash "$root/scripts/vps/install.sh" --interval 0 >"$fixture/invalid.log" 2>&1; then exit 1; fi
pass 'installer help, shell syntax and option validation'
printf '\nAll 11 deployment checks passed. No system services were changed.\n'
