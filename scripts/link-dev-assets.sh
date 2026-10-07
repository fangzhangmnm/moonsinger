#!/usr/bin/env bash
# scripts/link-dev-assets.sh —— 开发期把实验用的字节软链进 dev-assets/（gitignored，不进仓、不出货）。created 2026-10-06 by Claude Opus 5.5
# 2026-10-07 起出货不再需要 dev-assets/：JS 胶水走朗读库底层出口（@internal/read-aloud/backend/piper-plus/*），WORLD vendored 在 vendor/world/，
# 试听元音表进仓在 assets/preview/，模型 / 运行时 / 词典走家族模型包。这里只剩元音图谱实验（默认关；写歌实验室仓 Lab 的 atlas-build.mjs 产物）。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dev-assets
rm -f dev-assets/piper-plus dev-assets/world   # 旧版留下的软链（现在用不到）
ln -sfn "$PWD/../20260810 写歌实验室/Lab/20261005 月读第一首/out/atlas" dev-assets/atlas   # 元音图谱（没有就是图谱关）
ls -la dev-assets
