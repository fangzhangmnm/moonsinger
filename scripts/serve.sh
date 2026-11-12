#!/usr/bin/env bash
# scripts/serve.sh —— 本机静态服务（试验页用）。created 2026-10-06 by Claude Opus 5.5
# 绑 0.0.0.0：同一局域网 / Tailscale 的 iPad 也能开 http://<这台机器>:8710/（http 下无 AudioWorklet，试验页不用它）。
# 只端出 app 要的几样（.serve/ 里放软链）：journals/（人类区）、ai-docs/、Lab/ 不对外。
# 端出去的清单只写在下面 SERVED 这一处（2026-11-12 Claude Opus 5.5，施工单「整套 E2E 跑的那一份要和工作区隔开」）：
#   bash scripts/serve.sh --list   = 只印清单（一行一个，有的才印），不起服务
#   SERVE_DIR=<一个已有的空目录>     = 不放软链，把清单上的东西**拷**一份进去、只端它（整套 E2E 用：开跑那一刻冻住，之后工作区怎么改、重新构建都不影响）
set -euo pipefail
cd "$(dirname "$0")/.."
SERVED="index.html styles.css boot-guard.js manifest.webmanifest service-worker.js icon.svg icon-192.png icon-512.png icon-32.png apple-touch-icon-180.png dist vendor assets"
if [ "${1:-}" = "--list" ]; then for f in $SERVED; do [ -e "$f" ] && echo "$f"; done; exit 0; fi
PORT="${PORT:-8710}"
BIND="${BIND:-0.0.0.0}"   # iPad 走 tailscale serve（它把 tailnet 的 :18123 转给本机 localhost:18123）时用 PORT=18123 BIND=127.0.0.1：只在本机回环上听，局域网碰不到
if [ -n "${SERVE_DIR:-}" ]; then
  # 冻一份：目录必须已经在、而且是空的（这个脚本不替人删任何目录）
  if [ ! -d "$SERVE_DIR" ] || [ -n "$(ls -A "$SERVE_DIR")" ]; then echo "[serve] SERVE_DIR 要是一个已有的空目录：$SERVE_DIR" >&2; exit 2; fi
  OUT="$SERVE_DIR"
  for f in $SERVED; do [ -e "$f" ] && cp -RL "$f" "$OUT/$f"; done
  echo "[serve] http://localhost:$PORT/ bind $BIND  （冻住的一份：$OUT）"
else
  rm -rf .serve && mkdir -p .serve
  OUT=.serve
  for f in $SERVED; do [ -e "$f" ] && ln -s "../$f" ".serve/$f"; done
  echo "[serve] http://localhost:$PORT/ bind $BIND  （只端出：$(ls .serve | tr '\n' ' ')）"
fi
exec python3 -m http.server "$PORT" --bind "$BIND" --directory "$OUT"
