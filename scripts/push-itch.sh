#!/usr/bin/env bash
# push-itch.sh —— MoonSinger 推 itch（butler，「浏览器里玩」条目）。created 2026-11-03 by Claude Opus 5.5（抄 WeebPaint scripts/push-itch.sh；家族工单 A 第 3 步）
# 和 WeebPaint 不同：itch 版 = 整站 zip（index.html + dist/ + vendor/ + assets/ + 资源子集），不是单文件；组装在 scripts/pack-itch.mjs。
# butler 对同一 channel 重复 push = 原地更新同一条 upload（itch.io/docs/butler/pushing.html）。首推后 itch 后台一次性勾「This file will be played in the browser」。
# 认证（一次性，只有 user 能做）：tools/butler/butler login（浏览器授权，本机留凭据）。
# channel = html（浏览器里玩）。备用版（下载的文件夹双击能用）放哪 = 等 user 定（itch「可下载」条目 / GitHub release），这个脚本先不推它。
# 用法：bash scripts/push-itch.sh [vX.Y.Z]   # 不给版本则读 src/version.ts
set -euo pipefail
cd "$(dirname "$0")/.."

USERGAME="${MS_ITCH_TARGET:-fangzhangmnm/moonsinger}"   # itch 上的项目名（user 建项目时定；不一样就用环境变量改）
BUTLER="./tools/butler/butler"

# 【跟 prod 铁律】（WeebPaint 2026-08-30 user 拍板「itch ritual 跟 prod 不跟 main」）：itch 是生产渠道，dev 上的改动在 push prod 之前不许流进 itch。
git fetch origin prod --quiet 2>/dev/null || true
PROD_SHA=$(git rev-parse origin/prod 2>/dev/null || git rev-parse prod 2>/dev/null || true)
HEAD_SHA=$(git rev-parse HEAD)
[ -n "$PROD_SHA" ] || { echo "[push-itch] ✗ 找不到 prod 分支——itch 跟 prod，没 prod 不推" >&2; exit 1; }
if [ "$(git rev-parse "$HEAD_SHA^{tree}")" != "$(git rev-parse "$PROD_SHA^{tree}")" ]; then
  # 本仓推 prod 用「空合并 commit」（CLAUDE.md git 节）：prod 的 commit 和 main 的 sha 不同、tree 相同 → 比 tree
  echo "[push-itch] ✗ HEAD 的内容（$HEAD_SHA）≠ prod（$PROD_SHA）——itch 跟 prod 不跟 main（dev）。先推 prod（等 user 一句话），或 checkout prod 后再跑。" >&2
  exit 1
fi
[ -z "$(git status --porcelain -- index.html dist vendor assets styles.css)" ] || { echo "[push-itch] ✗ 站点文件有没提交的改动——itch 只推 prod 的原样字节" >&2; exit 1; }

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
