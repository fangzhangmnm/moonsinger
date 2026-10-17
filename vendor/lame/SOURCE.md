# LAME（vendored，自己编的 WASM）

> vendored 2026-10-17 by Claude Fable 5.1（源码 = LAME 3.100 原版 tar 包，sha256 `ddfe36cab873794038ae2c1210557ad34857a4b6bdc515785d1da9e175b1da1e`，解在家族检疫桶 `third-party/lame-3.100/`；只换了 `config.sub` / `config.guess` 两个 autotools 脚本（原包的太老不认 wasm32，从 gcc 镜像拿的新版），LAME 自己的源码没改一字）

- `lame.mjs` + `lame.wasm`：libmp3lame 3.100（<https://lame.sourceforge.io/>）+ 本目录 `lame-glue.c`（我们写的薄 C 接口：`mg_open / mg_encode / mg_flush / mg_close / mg_delay`），用 `build-lame.sh`（emscripten，`-O3`，ES module，web / worker / node 都能载）编出来。211 KB。
- 许可证：**LGPL（GNU Library General Public License v2，LAME 的 COPYING 原文）**，`LICENSE.txt`（随产物分发必须带着；源码 + 构建脚本在这里 = 满足 LGPL 的「能重编」）。
- 为什么换掉 lamejs（纯 JS 移植，2026-10-07 起用）：它的 `Mp3Encoder` 写死左右各编各的 + 关比特池，比特池那段移植是坏的（开了解出来和源不相关）；同一份团子 128k 对源 SNR 只有 16.8 dB。查案 = `ai-docs/20261017-final-mp3-quality.md`。真 LAME：联合立体声 + 比特池都正常，还直接吃 float（`lame_encode_buffer_ieee_float`，不用我们先转 16 位）。
- 谁用：`src/export/lame.ts`（JS 接口）→ `src/export/mp3-worker.ts`（点导出 / 定稿才加载这个 worker 和 wasm）。
- 重编：装好 emsdk、解好 LAME 源码后 `LAME_SRC=<源码目录> EMSDK_ENV=<emsdk_env.sh> bash vendor/lame/build-lame.sh`。
