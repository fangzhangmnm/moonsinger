#!/usr/bin/env bash
# scripts/link-dev-assets.sh —— 开发期把检疫桶里的第三方字节软链进 dev-assets/（gitignored，不进仓）。created 2026-10-06 by Claude Opus 5.5
# 家规：不是我们写的字节（模型、词典、他人的引擎代码）住 ~/jupyter/third-party/，项目里 symlink 引用。
# 浏览器 worker 运行时从 /dev-assets/… 动态加载这些（和 Lab 的 Node 命令行用的是同一批文件，所以浏览器 == Node 可以逐样本比对）。
# 出货时这条路要换：模型 / 词典走家族模型仓（pwa-models），前端代码走 @internal/read-aloud（需要给库加一个底层出口 → 先问 user）。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dev-assets
ln -sfn "$HOME/jupyter/third-party/piper-plus" dev-assets/piper-plus          # piper-plus 前端 / ojt / onnxruntime-web / 唱歌用的时长接管模型
ln -sfn "$HOME/jupyter/third-party/world/build" dev-assets/world              # 自编 WORLD WASM（Lab tools/build-world.sh 产物）
ln -sfn "$PWD/Lab/20261005 月读第一首/out/atlas" dev-assets/atlas           # 元音图谱（Lab atlas-build.mjs 产物；没有就是图谱关）
ls -la dev-assets
