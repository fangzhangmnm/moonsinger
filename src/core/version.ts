// version.ts —— 渲染核心自己的版本号 + 代码哈希（和 UI 壳的 APP_VERSION 分开）。created 2026-10-16 by Claude Fable 5.1（W-38）
//   user 2026-10-13：「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」「对以后核心有自己的版本号和hash」「还可以锁引擎的版本」。
//   · CORE_VERSION：人定。**出声可能变**（唱法核心 / 录音房数学 / 效果器 / 音符表换算 / 时间线 / 演奏者插件 / 元音表）就 bump patch；
//     只是搬家 / 改注释不 bump（哈希会变、版本不变 = 「代码动了但声音应该没变」，读的人能分辨）。
//   · CORE_HASH：构建时 scripts/core-hash.mjs 按核心源码算（scripts/build.sh --define 进来；node 直跑源码时 = "dev"，CLI 自己现算）。
//   记进每首歌的 manifest.core（每次保存）和定稿记录 final.core（定稿那一刻）：以后想复现一份 mp3，就拿这一版核心。
//   0.1.1（2026-11-08，Claude Fable 5.1）：TinySoundFont 的音量包络从每 64 个采样一级台阶改成块内线性过渡（vendor/tsf/patch-tsf.py）——所有 SoundFont 的音的采样值细微变化。
//   0.2.0（2026-11-12，Claude Opus 5.5（MoonSinger小弟）；施工单第 9 节，user「立刻最先修」）：SoundFont 照规范放，音量 = (力度 ÷ 127)²（tsf-standalone.ts sfNoteOnSquared）——
//     强弱的幅度在 dB 上是原来的两倍；fff 几乎不变（−0.07 dB），别的档变轻（mf −4 dB、p −8.3、ppp −18）。所有乐器的音都变；只有这一种放法、不留旧的。设备上记着的渲好的声音因此作废。
//   0.2.1（2026-11-12，Claude Opus 5.5（MoonSinger小弟）；施工单 9-2，user「按照SoundFont对齐，然后小月相也应该对齐」）：小月相 / 元音版的力度记号也按同一条曲线
//     （响度 = 40·log10(力度 ÷ 127)，渐强渐弱在力度上线性）——她们的音量曲线全变（mf 轻 8 dB）；10-08 以前没带力度表的旧 SoundFont 候选也按标准表的力度敲。
//   0.2.2（2026-11-12，Claude Opus 5.5（MoonSinger小弟）；施工单 9-4，user「真正该对齐的是：我们的引擎和标准播放器 对齐」）：SoundFont 的初始衰减和力度曲线照 FluidSynth
//     （vendor/tsf/patch-tsf.py 补丁 2：发生器每 cB 0.04 dB，原来 0.01；读库给每个区写的「力度 → 初始衰减」，GS 大多数乐器写 800 = 强弱的幅度是原来的八成多）——
//     所有 SoundFont 乐器再轻 1–8 dB、乐器之间相对的轻重最多挪 6 dB；第 9 节的「敲之前设总音量」退场。小月相 / 元音版的力度深度 = 800（插件报）。设备上记着的渲好的声音因此作废。
//   0.2.3（2026-11-12，Claude Opus 5.5（MoonSinger小弟）；施工单 7-N，user「这个滚奏完全没法用啊」）：按力度敲的乐器，滚奏的每一下按敲下去那一刻的力度（渐强渐弱 / 渐到 / 音内起伏 /
//     强后即弱都在每一下里，重音这一组只算第一下）；强后即弱「压到 p」按这件乐器在那个键上实际的 L（原来写死 960，深度 800 的乐器多压约 2 dB）。没写这些的滚奏、别的音不变。
export const CORE_VERSION = "0.2.3";
export const CORE_HASH: string = typeof __CORE_HASH__ === "string" ? __CORE_HASH__ : "dev";
export const coreInfo = (): { version: string; hash: string } => ({ version: CORE_VERSION, hash: CORE_HASH });
