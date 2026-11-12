// version.ts —— 渲染核心自己的版本号 + 代码哈希（和 UI 壳的 APP_VERSION 分开）。created 2026-10-16 by Claude Fable 5.1（W-38）
//   user 2026-10-13：「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」「对以后核心有自己的版本号和hash」「还可以锁引擎的版本」。
//   · CORE_VERSION：人定。**出声可能变**（唱法核心 / 录音房数学 / 效果器 / 音符表换算 / 时间线 / 演奏者插件 / 元音表）就 bump patch；
//     只是搬家 / 改注释不 bump（哈希会变、版本不变 = 「代码动了但声音应该没变」，读的人能分辨）。
//   · CORE_HASH：构建时 scripts/core-hash.mjs 按核心源码算（scripts/build.sh --define 进来；node 直跑源码时 = "dev"，CLI 自己现算）。
//   记进每首歌的 manifest.core（每次保存）和定稿记录 final.core（定稿那一刻）：以后想复现一份 mp3，就拿这一版核心。
//   0.1.1（2026-11-08，Claude Fable 5.1）：TinySoundFont 的音量包络从每 64 个采样一级台阶改成块内线性过渡（vendor/tsf/patch-tsf.py）——所有 SoundFont 的音的采样值细微变化。
//   0.2.0（2026-11-12，Claude Opus 5.5（MoonSinger小弟）；施工单第 9 节，user「立刻最先修」）：SoundFont 照规范放，音量 = (力度 ÷ 127)²（tsf-standalone.ts sfNoteOnSquared）——
//     强弱的幅度在 dB 上是原来的两倍；fff 几乎不变（−0.07 dB），别的档变轻（mf −4 dB、p −8.3、ppp −18）。所有乐器的音都变；只有这一种放法、不留旧的。设备上记着的渲好的声音因此作废。
export const CORE_VERSION = "0.2.0";
export const CORE_HASH: string = typeof __CORE_HASH__ === "string" ? __CORE_HASH__ : "dev";
export const coreInfo = (): { version: string; hash: string } => ({ version: CORE_VERSION, hash: CORE_HASH });
