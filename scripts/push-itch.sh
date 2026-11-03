#!/usr/bin/env bash
# push-itch.sh —— MoonSinger 推 itch（butler，「浏览器里玩」条目）。created 2026-11-03 by Claude Opus 5.5（抄 WeebPaint scripts/push-itch.sh；家族工单 A 第 3 步）
# 和 WeebPaint 不同：itch 版 = 整站 zip（index.html + dist/ + vendor/ + assets/ + 资源子集），不是单文件；组装在 scripts/pack-itch.mjs。
# butler 对同一 channel 重复 push = 原地更新同一条 upload（itch.io/docs/butler/pushing.html）。首推后 itch 后台一次性勾「This file will be played in the browser」。
# 认证（一次性，只有 user 能做）：tools/butler/butler login（浏览器授权，本机留凭据）。
# channel = html（浏览器里玩）。备用版（下载的文件夹双击能用）= scripts/push-local.sh（itch `local` 下载条目 + GitHub release；user 11-03「3 同意」）。
# 用法：bash scripts/push-itch.sh [vX.Y.Z]   # 不给版本则读 src/version.ts。先推开发版、等部署完（守卫核线上 /dev/）再跑
set -euo pipefail
cd "$(dirname "$0")/.."

USERGAME="${MS_ITCH_TARGET:-fangzhangmnm/moonsinger}"   # itch 上的项目名（user 建项目时定；不一样就用环境变量改）
BUTLER="./tools/butler/butler"

# 【跟开发版】（2026-11-03 起，取代「跟 prod」）：user 11-03（Fable 会话转述）「2 开发版，和itch一起」= itch 直接跟开发版这一版、不等正式版。
#   理由：itch = 试用版语义；user 自己平时用的就是开发版。WeebPaint 的「itch 跟 prod」（user 2026-08-30）是 WeebPaint 的规矩，不变。守卫细节 = scripts/require-dev-deployed.sh。
source scripts/require-dev-deployed.sh
require_dev_deployed push-itch

VER="${1:-}"
if [ -z "$VER" ]; then FULLVER=$(grep -o '"v[0-9][^"]*"' src/version.ts | head -1 | tr -d '"'); VER=${FULLVER%%-*}; fi
[ -n "$VER" ] || { echo "[push-itch] 解析不到版本号" >&2; exit 1; }

node scripts/pack-itch.mjs .itch-build/site

if [ ! -x "$BUTLER" ]; then
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) plat="linux-amd64" ;;
    *) echo "[push-itch] 未知平台 $(uname -s)-$(uname -m)——去 https://itchio.itch.io/butler 手动装进 tools/butler/" >&2; exit 1 ;;
  esac
  echo "[push-itch] 拉 butler ($plat LATEST)..."
  mkdir -p tools/butler; TMPZ=$(mktemp)
  curl -fsSL "https://broth.itch.zone/butler/$plat/LATEST/archive/default" -o "$TMPZ"
  unzip -oq "$TMPZ" -d tools/butler; rm -f "$TMPZ"; chmod +x "$BUTLER"; "$BUTLER" -V
fi

if "$BUTLER" push .itch-build/site "$USERGAME:html" --userversion "$VER"; then
  echo "[push-itch] ✓ 已推 $USERGAME:html（浏览器里玩，$VER）"
else
  echo "[push-itch] ✗ butler push 失败。若是没登录：$BUTLER login（浏览器授权，只能 user 做）后重跑：bash scripts/push-itch.sh $VER" >&2
  exit 1
fi
