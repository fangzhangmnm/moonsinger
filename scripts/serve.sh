#!/usr/bin/env bash
# scripts/serve.sh —— 本机静态服务（试验页用）。created 2026-10-06 by Claude Opus 5.5
# 绑 0.0.0.0：同一局域网 / Tailscale 的 iPad 也能开 http://<这台机器>:8710/（http 下无 AudioWorklet，试验页不用它）。
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8710}"
echo "[serve] http://localhost:$PORT/"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
