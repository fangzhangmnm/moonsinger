#!/usr/bin/env bash
# scripts/build.sh —— src/app/main.ts → dist/moonsinger.mjs。created 2026-10-06 by Claude Opus 5.5（抄 CatsUp scripts/build.sh）
# 孵化期：固定文件名、无 content-hash、无 service worker（正式出生那天走 create-pwa-project 换家族 content-hash 形）。
# 用法：编辑 src/ → bash scripts/build.sh → bash scripts/serve.sh → 浏览器开 http://localhost:8710/
set -euo pipefail
cd "$(dirname "$0")/.."

ENTRY="./src/app/main.ts"
OUT="./dist/moonsinger.mjs"
ESBUILD_VER="0.24.0"
ESBUILD="./tools/esbuild/esbuild"
# 开发期直连共享库源码（@internal/model-packs 还没发版；发 0.1.0 后改成 vendor-pkgs 收货、删掉这个 alias 和 tsconfig 的 paths）
MP_ALIAS="--alias:@internal/model-packs=../20261007 internal-model-packs/src/index.ts"

# 没 esbuild 自动 curl 一份（tools/ gitignored；tools/ = 构建工具，区别于运行时 vendor）
if [ ! -x "$ESBUILD" ]; then
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)   plat="linux-x64" ;;
    Linux-aarch64)  plat="linux-arm64" ;;
    Darwin-arm64)   plat="darwin-arm64" ;;
    Darwin-x86_64)  plat="darwin-x64" ;;
    *) echo "[build] 未知平台 $(uname -s)-$(uname -m)，手动放 esbuild 进 $ESBUILD" >&2; exit 1 ;;
  esac
  echo "[build] 拉 esbuild $plat-$ESBUILD_VER..."
  mkdir -p tools/esbuild
  TMP=$(mktemp -d)
  curl -sL "https://registry.npmjs.org/@esbuild/${plat}/-/${plat}-${ESBUILD_VER}.tgz" | tar -xz -C "$TMP"
  mv "$TMP/package/bin/esbuild" "$ESBUILD"; chmod +x "$ESBUILD"; rm -rf "$TMP"
fi

# 类型检查门（esbuild 只 strip 不检查；tsc 才是真护栏）
TSC="./node_modules/.bin/tsc"
if [ -x "$TSC" ]; then
  echo "[build] 类型检查 tsc --noEmit…"
  "$TSC" --noEmit -p tsconfig.json || { echo "[build] ✗ 类型检查失败，已挡下构建。" >&2; exit 1; }
  echo "[build] ✓ 类型通过"
else
  echo "[build] ⚠ 未装 tsc（node_modules 缺）——跳过类型检查。装一下：npm install" >&2
fi

mkdir -p dist
"$ESBUILD" "$ENTRY" --bundle --format=esm --target=es2022 --outfile="$OUT" --sourcemap --log-level=warning
echo "[build] ✓ $OUT"
# 月读的 worker（唱法核心 src/singer/sing-core.mjs 打进来；第三方引擎 / 模型运行时从 dev-assets/ 动态加载，不进包）
"$ESBUILD" ./src/singer/worker.ts --bundle "$MP_ALIAS" --format=esm --target=es2022 --outfile=./dist/singer-worker.mjs --sourcemap --log-level=warning
echo "[build] ✓ ./dist/singer-worker.mjs"
# mp3 编码 worker（vendored lamejs，LGPL-3.0，单独一个文件；点导出才加载）
"$ESBUILD" ./src/export/mp3-worker.ts --bundle --format=esm --target=es2022 --outfile=./dist/mp3-worker.mjs --sourcemap --log-level=warning
echo "[build] ✓ ./dist/mp3-worker.mjs"
