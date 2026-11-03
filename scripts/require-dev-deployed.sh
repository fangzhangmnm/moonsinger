#!/usr/bin/env bash
# require-dev-deployed.sh —— itch 版 / 备用版「跟线上开发版」的守卫（被 push-itch.sh / push-local.sh source）。created 2026-11-03 by Claude Opus 5.5（家族工单 A3）
#   user 2026-11-03（Fable 会话转述）：「2 开发版，和itch一起」「3 同意」= itch 直接跟开发版这一版、不等正式版；备用版两处都放。
#   理由（Fable 记）：itch = 试用版语义；user 自己平时用的就是开发版（家族根 CLAUDE.md「user 自己永远用开发版」）。WeebPaint 的「itch 跟 prod」先例不变（那是 WeebPaint 的事）。
#   守的是：① HEAD 已经推上 github 的 main（= 开发版的来源）② 线上 /dev/ 实际发着的就是 HEAD 这一版（主 bundle 名 + dist/build-stamp.json 的源码指纹都对上）
#            ③ 站点文件没有未提交的改动。任一不满足 = 不推（不推半成品、不推线上还没部署好的版本）。
DEV_URL="${MS_DEV_URL:-https://sing.weebpaint.com/dev/}"
require_dev_deployed() {
  local tag="$1"
  git fetch github main --quiet 2>/dev/null || true
  local dev_sha; dev_sha=$(git rev-parse github/main 2>/dev/null || true)
  [ -n "$dev_sha" ] || { echo "[$tag] ✗ 找不到 github/main（开发版的来源）" >&2; exit 1; }
  if [ "$(git rev-parse "HEAD^{tree}")" != "$(git rev-parse "$dev_sha^{tree}")" ]; then
    echo "[$tag] ✗ HEAD 的内容 ≠ github/main——先按本仓 CLAUDE.md 推开发版（push main），部署完再来。" >&2; exit 1
  fi
  [ -z "$(git status --porcelain -- index.html dist vendor assets styles.css)" ] || { echo "[$tag] ✗ 站点文件有没提交的改动" >&2; exit 1; }
  local want_main; want_main=$(grep -o 'dist/moonsinger-[a-z0-9]*\.mjs' index.html | head -1)
  local live_main; live_main=$(curl -fsSL --max-time 20 "${DEV_URL}?nocache=$(date +%s)" | grep -o 'dist/moonsinger-[a-z0-9]*\.mjs' | head -1 || true)
  [ "$live_main" = "$want_main" ] || { echo "[$tag] ✗ 线上 ${DEV_URL} 发的是「${live_main:-拿不到}」，HEAD 是「$want_main」——部署还没到（Pages 有约 10 分钟缓存）或没推上去" >&2; exit 1; }
  local want_src live_src
  want_src=$(node -p 'JSON.parse(require("fs").readFileSync("dist/build-stamp.json","utf8")).source')
  live_src=$(curl -fsSL --max-time 20 "${DEV_URL}dist/build-stamp.json?nocache=$(date +%s)" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).source)}catch{console.log("")}})' || true)
  [ "$live_src" = "$want_src" ] || { echo "[$tag] ✗ 线上开发版的源码指纹（${live_src:0:12}）≠ HEAD（${want_src:0:12}）" >&2; exit 1; }
  echo "[$tag] ✓ 跟开发版：HEAD = github/main = 线上 ${DEV_URL}（$want_main · 指纹 ${want_src:0:12}）"
}
