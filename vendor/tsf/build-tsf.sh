#!/bin/bash
# Build TinySoundFont + tsf-glue.c to an ES-module WASM that loads in node, browsers and workers. created 2026-10-07 by Claude Fable 5.1
# Source: github.com/schellingb/TinySoundFont（MIT，见 LICENSE.txt），默认在 $TSF_SRC（家族检疫桶 third-party/TinySoundFont）。Output: 本目录（vendor/tsf/）。
# 同 vendor/world/build-world.sh 的做法（emscripten、-O3、ES module、web / worker / node 都能载）。
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="${TSF_SRC:-$HOME/jupyter/third-party/TinySoundFont}"; OUT="$HERE"
source "${EMSDK_ENV:-$HOME/jupyter/third-party/piper-plus/emsdk/emsdk_env.sh}" >/dev/null 2>&1
emcc -O3 -I"$SRC" "$HERE/tsf-glue.c" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sEXPORT_NAME=createTsf \
  -sEXPORTED_FUNCTIONS=_malloc,_free,_sf_load,_sf_copy,_sf_close,_sf_reset,_sf_preset_count,_sf_preset_name,_sf_preset_bank,_sf_preset_num,_sf_preset_index,_sf_set_max_voices,_sf_set_volume,_sf_note_on,_sf_note_off,_sf_note_off_all,_sf_active,_sf_render \
  -sEXPORTED_RUNTIME_METHODS=HEAPF32,HEAPU8,UTF8ToString -o "$OUT/tsf.mjs"
ls -la "$OUT"
