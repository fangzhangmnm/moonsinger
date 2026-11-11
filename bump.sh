#!/usr/bin/env bash
# 唯一版本号在 src/version.ts（esbuild inline 进 bundle）。用法: ./bump.sh v0.1.1-2026-10-07（抄 JustReadBooks bump.sh，2026-10-07 by Claude Opus 5.5）
set -e
NEW="${1:?usage: ./bump.sh vM.m.p-YYYY-MM-DD}"
cd "$(dirname "$0")"
sed -i "s/APP_VERSION = \"[^\"]*\"/APP_VERSION = \"$NEW\"/" src/version.ts
echo "bumped to $NEW:"; grep -H "APP_VERSION" src/version.ts
# 接口头文件 api/ 跟着发版重打（家族 API .h ritual；2026-11-11 Claude Opus 5.5 加，谱面分家第二刀）：随源同一个 commit 提交
bash scripts/gen-api.sh
