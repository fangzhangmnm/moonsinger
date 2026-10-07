# TinySoundFont（vendored，自己编的 WASM）

> vendored 2026-10-07 by Claude Fable 5.1（源码原样拷自家族检疫桶 `third-party/TinySoundFont/`：`tsf.h` v0.9）

- `tsf.mjs` + `tsf.wasm`：SoundFont 2 播放器（Bernhard Schelling，<https://github.com/schellingb/TinySoundFont>，单头文件 `tsf.h` v0.9，
  基于 Steve Folta 的 SFZero）+ 本目录 `tsf-glue.c`（我们写的薄 C 接口），用 `build-tsf.sh`（emscripten，`-O3`，ES module，web / worker / node 都能载）编出来。没改 tsf 源码。
- 许可证：MIT，原文 `LICENSE.txt`（随产物分发必须带着）。
- 为什么是它：93 KB 源码、MIT、确定性（同一串 note on / off 出同样的采样 → 「渲染 = 纯函数(文件)」）；认标准 SF2（压缩采样的 sf3 要另带 stb_vorbis，这版没编进去）。
- 谁用：`src/gm/tsf-wrap.mjs` 包一层 JS 接口；GM 候选在 worker 里按谱出声（契约草稿 §10：样本类音源 = 歌里嵌的 SF2 子集）。
- 引擎随 app 发（user 2026-10-07「引擎随 app 发」）：不走模型包。
- 重编：装好 emsdk、拿到 tsf.h 后 `TSF_SRC=<含 tsf.h 的目录> EMSDK_ENV=<emsdk_env.sh> bash vendor/tsf/build-tsf.sh`。
