// version.ts —— 渲染核心自己的版本号 + 代码哈希（和 UI 壳的 APP_VERSION 分开）。created 2026-10-16 by Claude Fable 5.1（W-38）
//   user 2026-10-13：「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」「对以后核心有自己的版本号和hash」「还可以锁引擎的版本」。
//   · CORE_VERSION：人定。**出声可能变**（唱法核心 / 录音房数学 / 效果器 / 音符表换算 / 时间线 / 演奏者插件 / 元音表）就 bump patch；
//     只是搬家 / 改注释不 bump（哈希会变、版本不变 = 「代码动了但声音应该没变」，读的人能分辨）。
//   · CORE_HASH：构建时 scripts/core-hash.mjs 按核心源码算（scripts/build.sh --define 进来；node 直跑源码时 = "dev"，CLI 自己现算）。
//   记进每首歌的 manifest.core（每次保存）和定稿记录 final.core（定稿那一刻）：以后想复现一份 mp3，就拿这一版核心。
export const CORE_VERSION = "0.1.0";
export const CORE_HASH: string = typeof __CORE_HASH__ === "string" ? __CORE_HASH__ : "dev";
export const coreInfo = (): { version: string; hash: string } => ({ version: CORE_VERSION, hash: CORE_HASH });
