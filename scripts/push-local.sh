#!/usr/bin/env bash
# push-local.sh —— 备用版（下载的文件夹双击就能用）推到两个地方：itch「可下载」条目 + GitHub release。created 2026-11-03 by Claude Opus 5.5（家族工单 A2 ②）
#   放哪：两处都放（照 WeebPaint 先例：GH release 挂单文件 + itch standalone channel）；user 11-03（Fable 会话转述）「3 同意」。
#   **这个脚本准备好、没执行过**（推 = 对外发东西，等 user 说）。
#   步骤：① 跟开发版守卫（HEAD = github/main = 线上 /dev/ 发着的那一版；scripts/require-dev-deployed.sh）② 打备用版 + 无头烟测（红了就停）
#        ③ 按版本号命名的 zip ④ butler 推 itch channel `local`（首推后 itch 后台一次性：这一条**不勾**「played in the browser」，它是给人下载的）
#        ⑤ GitHub release `<版本>`（--target = HEAD 那一提交）挂 zip；已经有这个 release = 补传（--clobber）。
#   认证（一次性，只有 user 能做）：tools/butler/butler login；gh auth login。
#   用法：bash scripts/push-local.sh [vX.Y.Z] [--only=itch|github]
set -euo pipefail
cd "$(dirname "$0")/.."

USERGAME="${MS_ITCH_TARGET:-fangzhangmnm/moonsinger}"
REPO="${MS_GH_REPO:-fangzhangmnm/moonsinger}"
BUTLER="./tools/butler/butler"
VER=""; ONLY=""
for a in "$@"; do case "$a" in --only=*) ONLY="${a#--only=}" ;; v*) VER="$a" ;; *) echo "[push-local] 不认识的参数 $a" >&2; exit 1 ;; esac; done

# ① 跟开发版（2026-11-03 起，同 push-itch.sh：user 11-03 经 Fable 转述「2 开发版，和itch一起」「3 同意」）
source scripts/require-dev-deployed.sh
require_dev_deployed push-local
if [ -z "$VER" ]; then FULLVER=$(grep -o '"v[0-9][^"]*"' src/version.ts | head -1 | tr -d '"'); VER=${FULLVER%%-*}; fi
[ -n "$VER" ] || { echo "[push-local] 解析不到版本号" >&2; exit 1; }

# ② 打包 + 烟测
node scripts/pack-local.mjs .local-build/MoonSinger
node tools/local-smoke.mjs --dir=.local-build/MoonSinger
# ③ 版本号命名的 zip（解开 = 一个 MoonSinger 文件夹）
ZIP=".local-build/MoonSinger-$VER.zip"
cp .local-build/MoonSinger.zip "$ZIP"
echo "[push-local] ✓ $ZIP（$(du -h "$ZIP" | cut -f1)）"

# ④ itch「可下载」条目
if [ "$ONLY" != "github" ]; then
  if [ ! -x "$BUTLER" ]; then
    case "$(uname -s)-$(uname -m)" in Linux-x86_64) plat="linux-amd64" ;; *) echo "[push-local] 未知平台——去 https://itchio.itch.io/butler 手动装进 tools/butler/" >&2; exit 1 ;; esac
    mkdir -p tools/butler; TMPZ=$(mktemp); curl -fsSL "https://broth.itch.zone/butler/$plat/LATEST/archive/default" -o "$TMPZ"; unzip -oq "$TMPZ" -d tools/butler; rm -f "$TMPZ"; chmod +x "$BUTLER"
  fi
  if "$BUTLER" push .local-build/MoonSinger "$USERGAME:local" --userversion "$VER"; then echo "[push-local] ✓ 已推 $USERGAME:local（下载版，$VER）"
  else echo "[push-local] ✗ butler push 失败。没登录：$BUTLER login（只能 user 做）后重跑：bash scripts/push-local.sh $VER --only=itch" >&2; exit 1; fi
fi

# ⑤ GitHub release
if [ "$ONLY" != "itch" ]; then
  if ! command -v gh >/dev/null 2>&1; then echo "[push-local] ⚠ 没有 gh——手动补：gh release create $VER --repo $REPO --target $(git rev-parse HEAD) \"$ZIP\" --title \"MoonSinger $VER\"" >&2; exit 1; fi
  if gh release view "$VER" --repo "$REPO" >/dev/null 2>&1; then
    gh release upload "$VER" "$ZIP" --repo "$REPO" --clobber && echo "[push-local] ✓ GH release $VER 已补传备用版"
  else
    gh release create "$VER" "$ZIP" --repo "$REPO" --target "$(git rev-parse HEAD)" --title "MoonSinger $VER" \
      --notes "备用版：下载解开，双击 MoonSinger/index.html 就能用（桌面 Chrome / Edge 验过；Safari 没测过）。完整版（网盘同步、离线安装）在 https://sing.weebpaint.com" \
      && echo "[push-local] ✓ GH release $VER 已挂备用版"
  fi
fi
