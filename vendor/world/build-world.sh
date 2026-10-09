#!/bin/bash
# Build WORLD + world-glue.cpp to an ES-module WASM that loads in node, browsers and workers. created 2026-10-05 by Claude Opus 5.5
# Source: github.com/mmorise/World（modified BSD，见 LICENSE.txt），默认在 $WORLD_SRC（家族检疫桶 third-party/world/src-git）。Output: 本目录（vendor/world/）。
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="${WORLD_SRC:-$HOME/jupyter/third-party/world/src-git}/src"; OUT="$HERE"
source "${EMSDK_ENV:-$HOME/jupyter/third-party/piper-plus/emsdk/emsdk_env.sh}" >/dev/null 2>&1
mkdir -p "$OUT"
em++ -O3 -I"$SRC" "$SRC"/{cheaptrick,common,d4c,fft,harvest,matlabfunctions,stonemask,synthesis}.cpp "$HERE/world-glue.cpp" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sEXPORT_NAME=createWorld \
  -sEXPORTED_FUNCTIONS=_malloc,_free,_w_analyze,_w_f0,_w_sp,_w_ap,_w_frames,_w_fft,_w_f0_ptr,_w_sp_ptr,_w_ap_ptr,_w_free,_w_synth_len,_w_synth \
  -sEXPORTED_RUNTIME_METHODS=HEAPF64 -o "$OUT/world.mjs"
ls -la "$OUT"
