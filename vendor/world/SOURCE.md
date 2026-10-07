# WORLD（vendored，自己编的 WASM）

> vendored 2026-10-07 by Claude Opus 5.5（从写歌实验室仓 `Lab/20261005 月读第一首/tools/` 搬来构建脚本；产物原样拷自家族检疫桶 `third-party/world/build/`）

- `world.mjs` + `world.wasm`：WORLD 声码器（M. Morise，<https://github.com/mmorise/World>，commit `d625e7608ca23a870018f01e7c562ac683d9847f`，2025-02-21）
  + 本目录 `world-glue.cpp`（我们写的薄 C 接口），用 `build-world.sh`（emscripten，`-O3`，ES module，web / worker / node 都能载）编出来。没改 WORLD 源码。
- 许可证：modified BSD，原文 `LICENSE.txt`（随产物分发必须带着）。
- 谁用：`src/singer/worker.ts`（浏览器后台线程里唱：分析 piper 的原料、按乐谱时钟重建）。`src/singer/world-wrap.mjs` 包一层 JS 接口。
- 重编：装好 emsdk、拿到 WORLD 源码后 `WORLD_SRC=<World 仓> EMSDK_ENV=<emsdk_env.sh> bash vendor/world/build-world.sh`。
