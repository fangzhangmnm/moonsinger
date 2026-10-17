#!/bin/bash
# Build libmp3lame 3.100 + lame-glue.c to an ES-module WASM that loads in browsers, workers and node. created 2026-10-17 by Claude Fable 5.1
# Source: LAME 3.100 (lame.sourceforge.io, LGPL v2, see LICENSE.txt), default in $LAME_SRC (家族检疫桶 third-party/lame-3.100，tar 包 sha256
#   ddfe36cab873794038ae2c1210557ad34857a4b6bdc515785d1da9e175b1da1e). Output: 本目录（vendor/lame/lame.mjs + lame.wasm）。同 vendor/tsf/build-tsf.sh 的做法。
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="${LAME_SRC:-$HOME/jupyter/third-party/lame-3.100}"; OUT="$HERE"
source "${EMSDK_ENV:-$HOME/jupyter/third-party/emsdk/emsdk_env.sh}" >/dev/null 2>&1
if [ ! -f "$SRC/libmp3lame/.libs/libmp3lame.a" ]; then
  ( cd "$SRC" && emconfigure ./configure --disable-shared --enable-static --disable-frontend --disable-decoder --disable-analyzer-hooks --disable-gtktest --disable-nasm --host=wasm32-unknown-emscripten CFLAGS="-O3" >/dev/null && emmake make -C libmp3lame -j"$(nproc)" >/dev/null )
fi
emcc -O3 -I"$SRC/include" "$HERE/lame-glue.c" "$SRC/libmp3lame/.libs/libmp3lame.a" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sEXPORT_NAME=createLame \
  -sEXPORTED_FUNCTIONS=_malloc,_free,_mg_open,_mg_encode,_mg_flush,_mg_close,_mg_delay \
  -sEXPORTED_RUNTIME_METHODS=HEAPF32,HEAPU8 -o "$OUT/lame.mjs"
ls -la "$OUT"
