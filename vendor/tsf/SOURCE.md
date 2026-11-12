# TinySoundFont（vendored，自己编的 WASM）

> vendored 2026-10-07 by Claude Fable 5.1（源码原样拷自家族检疫桶 `third-party/TinySoundFont/`：`tsf.h` v0.9）

- `tsf.mjs` + `tsf.wasm`：SoundFont 2 播放器（Bernhard Schelling，<https://github.com/schellingb/TinySoundFont>，单头文件 `tsf.h` v0.9，
  基于 Steve Folta 的 SFZero）+ 本目录 `tsf-glue.c`（我们写的薄 C 接口），用 `build-tsf.sh`（emscripten，`-O3`，ES module，web / worker / node 都能载）编出来。
  **2026-11-08 起带一个补丁**（`patch-tsf.py`，编的时候打在 tsf.h 的临时副本上，检疫桶里的原件不动；edited by Claude Fable 5.1）：
  音量在一块（64 个采样）里从块头线性滑到块尾。上游整块用块头的值，包络走得快时出来是台阶 = 收音时的「静电噪音」
  （user 2026-11-08 真机，GS 的 Ocarina 顶埙：「松手的一瞬间就杂音了」「我换成笛子之后就没有，用埙就有」）。
  量（48 kHz，每个键 × 3 种力度 × 5 种按住时长 = 735 种，松手后的二阶差分尖峰 ÷ 按住时的）：Ocarina（收音 80 ms）最多 57 倍、603 种超标 → 1.0 倍、0 种；
  Flute（250 ms）5 种 → 0；Pan Flute / Shakuhachi 本来就没有。只改了单声道那条渲染路（我们只用 TSF_MONO）。
  **所有 SoundFont 的音的采样值都会有细微变化**（起音 / 衰减 / 收音都从台阶变成斜线）；核过：同一套工具链不打补丁重编 = 和 10-07 的二进制逐字节相同，所以变的只有这一处。
- **2026-11-12 起第二个补丁**（同一个 `patch-tsf.py`；施工单 `ai-docs/20261111-score-surface-construction-plan.md` 9-4，edited by Claude Opus 5.5（MoonSinger小弟））：
  初始衰减照标准播放器 FluidSynth 算——发生器每 cB 0.04 dB（上游 0.01）；读库给每个区写的「→ 初始衰减」调制器（规范默认 960 = 力度、负向单极凹；
  乐器一级同源的盖掉默认、预设一级的加上去；来源是力度 / 键号 / 无的才认），敲的时候衰减 = 量 ÷ 960 × 40·log10(127 ÷ 力度) dB，去掉上游按力度一次方乘的那一下。
  源码位置和对照结果（GS 28 件、仓里 4 件）见施工单第六节 9-4。核过：本机 gcc 编同一份补丁后的 tsf.h，287 个预设的合并结果和 JS 版 `src/gm/sf2-subset.ts sf2VelocityDepths` 逐个一样。
- 许可证：MIT，原文 `LICENSE.txt`（随产物分发必须带着）。
- 为什么是它：93 KB 源码、MIT、确定性（同一串 note on / off 出同样的采样 → 「渲染 = 纯函数(文件)」）；认标准 SF2（压缩采样的 sf3 要另带 stb_vorbis，这版没编进去）。
- 谁用：`src/gm/tsf-wrap.mjs` 包一层 JS 接口；GM 候选在 worker 里按谱出声（契约草稿 §10：样本类音源 = 歌里嵌的 SF2 子集）。
- 引擎随 app 发（user 2026-10-07「引擎随 app 发」）：不走模型包。
- 重编：装好 emsdk、拿到 tsf.h 后 `TSF_SRC=<含 tsf.h 的目录> EMSDK_ENV=<emsdk_env.sh> bash vendor/tsf/build-tsf.sh`。
