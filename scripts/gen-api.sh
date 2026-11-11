#!/usr/bin/env bash
# gen-api —— 全仓 API 头文件树（家族「API .h ritual」，user 2026-08-03 立，家族根 CLAUDE.md 有条目）。
#   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第二刀交付；施工单 ai-docs/20261111-score-surface-construction-plan.md 第三节「2」：这个仓一直没有 api/）。照 WeebPaint scripts/gen-api.sh。
# api/ = tsc 生成的 .d.ts 纯签名树（C 头文件等价物），**供人类参考**：发版 / 重构交付 / 大功能落地时重跑（同 commit 随源提交）；
#   重构策划须附「现状 .h + 提案 .h」。生成物勿手改。
# 字面量联合（"undo" | "redo" 这类 typed enum）会自动打印；裸 string 参数视为待进化（开放集除外）。
set -e
cd "$(dirname "$0")/.."
rm -rf api
npx tsc -p tsconfig.json --declaration --emitDeclarationOnly --noEmit false --outDir api
rm -rf api/test api/scripts api/vendor   # 测试 / 工具脚本 / 第三方的签名是噪音，只留 src
echo "[gen-api] → api/ ($(find api -name '*.d.ts' -o -name '*.d.mts' | wc -l) 个 .d.ts / .d.mts)"
