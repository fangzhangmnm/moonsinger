#!/usr/bin/env bash
# scripts/build.sh —— src/app/main.ts → dist/moonsinger-<hash>.mjs（+ 两个 worker），就地改 index.html。created 2026-10-06 by Claude Opus 5.5（抄 CatsUp scripts/build.sh）
# 2026-10-07 出生（user「毕业差的东西做」）：换家族 content-hash 形 + service worker（service-worker.js / src/app/pwa-shell.ts）。
# 用法：编辑 src/ → bash scripts/build.sh → bash scripts/serve.sh → 浏览器开 http://localhost:8710/
set -euo pipefail
cd "$(dirname "$0")/.."

ENTRY="./src/app/main.ts"
ESBUILD_VER="0.24.0"
ESBUILD="./tools/esbuild/esbuild"

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
# 家族 content-hash 形（2026-10-07 出生，抄 JRB / WXHW build.sh）：每个 bundle 文件名带内容哈希 → service worker 的缓存名跟着变，换版本自动失效。
# 两个 worker 先打（主 bundle 要知道它们的文件名：--define 进去，改 worker = 主 bundle 也变 = 新版本），主 bundle 最后打，index.html 就地改指新哈希。
hashed() {   # $1 = 入口, $2 = 名字前缀, 其余 = 额外 esbuild 参数 → stdout 打出最终文件名
  local entry="$1" name="$2"; shift 2
  local tmp="./dist/.$name.tmp.mjs"
  "$ESBUILD" "$entry" --bundle --format=esm --target=es2022 --outfile="$tmp" --sourcemap --log-level=warning "$@" >&2
  local h; h=$(sha256sum "$tmp" | cut -c1-12)
  local out="$name-$h.mjs"
  sed -i "s|sourceMappingURL=$(basename "$tmp").map|sourceMappingURL=$out.map|" "$tmp"
  mv "$tmp" "./dist/$out"; mv "$tmp.map" "./dist/$out.map"
  echo "$out"
}
rm -f ./dist/*.mjs ./dist/*.mjs.map   # 旧哈希的产物不留（dist 进 git：只留这一版）
# 月读的 worker（唱法核心 src/singer/sing-core.mjs + 朗读库底层出口的前端 / ort / ojt 胶水打进来；WORLD 运行时从 vendor/world/ 载，模型 / 运行时 wasm / 词典随模型包来）
SINGER=$(hashed ./src/singer/worker.ts singer-worker); echo "[build] ✓ dist/$SINGER"
# mp3 编码 worker（vendored lamejs，LGPL-3.0，单独一个文件；点导出才加载）
MP3=$(hashed ./src/export/mp3-worker.ts mp3-worker); echo "[build] ✓ dist/$MP3"
# 样式表也按内容版本化（2026-10-07，user「0 | - 的中文字在ipad上面没有自动换和别的一样的小灰字体」= iPad 拿到新 bundle 配旧 styles.css：
#   Pages 给 styles.css 的缓存头是 max-age=600，dev 的 network-first 走浏览器 HTTP 缓存）。index.html 写 styles.css?v=<哈希> → 新地址绕过 HTTP 缓存；
#   哈希 --define 进主 bundle → 样式一改主 bundle 的哈希也变 → service worker 换新缓存名、重新预缓存 styles.css。SW 本身不用改（取缓存时 ignoreSearch）。
CSS_HASH=$(cat styles.css vendor/internal-css/*.css | sha256sum | cut -c1-12)   # 自家样式 + vendored 的包样式一起算（包样式升级也要换地址）
MAIN=$(hashed "$ENTRY" moonsinger "--define:__SINGER_WORKER__=\"$SINGER\"" "--define:__MP3_WORKER__=\"$MP3\"" "--define:__CSS_HASH__=\"$CSS_HASH\""); echo "[build] ✓ dist/$MAIN"
sed -i -E "s|src=\"\./dist/moonsinger(-[a-z0-9]+)?\.mjs\"|src=\"./dist/$MAIN\"|" index.html
grep -q "$MAIN" index.html || { echo "[build] ✗ index.html 没改到主 bundle 的新文件名" >&2; exit 1; }
sed -i -E "s|href=\"\./styles\.css(\?v=[a-z0-9]+)?\"|href=\"./styles.css?v=$CSS_HASH\"|" index.html
sed -i -E "s|href=\"\./vendor/internal-css/workbench-elements\.css(\?v=[a-z0-9]+)?\"|href=\"./vendor/internal-css/workbench-elements.css?v=$CSS_HASH\"|" index.html
grep -q "styles.css?v=$CSS_HASH" index.html || { echo "[build] ✗ index.html 没改到样式表的新版本号" >&2; exit 1; }
echo "[build] index.html → ./dist/$MAIN"
