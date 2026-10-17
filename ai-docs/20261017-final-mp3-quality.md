# 定稿 mp3「听起来差很多、有破音」查案

> created 20261017 by Claude Fable 5.1 · as-of v0.13.2 / 2026-10-17
> user 2026-10-17：「有个bug一起fable修，定稿的mp3听起来差很多，你可以看一下onedrive里面的团子，渲染的定稿有破音」。AI 不听（家族红线）：下面全是量出来的，好不好听归 user 耳朵。

## 0. 结论先行

1. **定稿的 mp3 文件本身没有削顶、没有空洞、没有周期性咔哒**：峰值 0.52 / 0.57、RMS −24.6 dBFS、没有一个样本到 0.98。「破音」不是数字削波。
2. **浏览器里的离线渲染（定稿走的路）和 node 同一个核心渲出来的一样**：没有人声的那些秒，两边对齐后 SNR 26 dB（= 只剩 mp3 编码的差异）。有人声的秒比不了——小月相（piper）每次唱都不一样（node 自己连渲两次也逐字节不同、相关只有 0.67）。所以**不是离线渲染的 bug**。
3. **差异全在 mp3 编码这一步**：vendored lamejs 的 `Mp3Encoder` 写死了两件事——`mode = STEREO`（左右各编各的：128k = 每边 64k，中间的人声两边各存一份）和 `disable_reservoir = true`（关掉比特池：帧之间不能借比特，鼓 / 木鱼这种瞬态帧饿着）。同一份团子 128k 对源的 SNR 只有 **16.8 dB**（最差的秒 14.5）。
4. **修了能修的那一半**：联合立体声（joint）——文件一样大，SNR 16.8 → **23.7 dB**。比特池那一半 lamejs 的实现是坏的（开了解出来和源不相关，corr 0.1），照旧关着——这多半就是上游为什么关它。
5. **还能再上去的只剩码率**（等 user 定默认）：joint 160k 25 dB / 192k 29 dB / 256k 42 dB / 320k 47 dB（§3 表）。

## 1. 输入 / 输出钉住

- 文件：OneDrive `apps/MoonSinger/20261008-団子大家族.mxl`（2026-10-16 19:39，4.3 MB），只读拷到 job tmp。`manifest.final`：rev 1、app v0.12.21、核心 0.1.0 / `bdd05c918f5931b4`（= 现在的核心哈希，核心没变过）、mp3 44100 Hz / 128 kbps / stereo / 218.49 s；ID3v2 47.9 KB（封面）。
- 录音房：总轨增益 0、限幅开；10 条歌手轨（增益 0 … −8 dB，EQ + 压缩 / 延迟）、两条混音轨（EQ + 混响）。
- 对照：`npm run render -- 団子.mxl --out=ref.wav`（node，OfflineStudio，小月相走检疫桶 piper）218.5 s 渲了 36 s。

## 2. 量了什么（脚本在 job tmp，没进仓；做法写在这里够重做）

| 量 | 结果 |
|---|---|
| mp3 解码（Chromium `decodeAudioData`）峰值 / RMS / ≥0.98 的样本 / 空洞 | L 0.516 / R 0.572；RMS 0.059；0 个；0 个 |
| 单样本最大跳变 | 0.22（都落在 0.2 s 的八分音符格上 = 打击乐音头，不是缺陷）；对 128 / 1152 / 2048 取模没有尖峰 = 没有块边界 / 帧边界的周期性咔哒 |
| 定稿 mp3 vs node ref.wav（对齐 lag 1105 = mp3 编码延迟）按秒 SNR | 最好的秒 26 dB（129–156 s，器乐段）；92 秒 < 0 dB（人声段） |
| node ref.wav vs ref2.wav（同一命令跑两次） | 逐字节不同；相关 0.67、差 / 信号 1.32 → piper 的随机性，人声段比不了 |
| 编码器 A/B（源 = ref.wav 前 60 s，同一把尺子：解码后对齐、SNR 整体 / 按秒 / 瞬态秒） | 见 §3 |

## 3. 编码器 A/B（lamejs，源 = node 渲的团子前 60 s）

| 设置 | 大小 | SNR 整体 | 瞬态秒均 | 最差的秒 |
|---|---|---|---|---|
| **现状**：stereo、无比特池、q3、128k | 938 KB | 16.8 dB | 16.9 | 14.5 |
| 只开 joint、128k | 938 KB | **23.7** | 22.6 | 17.2 |
| 只开比特池、128k | 938 KB | **−3.3（坏的）** | — | — |
| 现状 q5 / q0 | 938 KB | 19.6 / 16.4 | | （LAME 的 q 换的是噪声整形，SNR 不能直接比） |
| 现状 160k / 192k / 256k | 1172 / 1407 / 1876 KB | 19.0 / 28.1 / 37.2 | | |
| joint 160k | 1172 KB | 25.1 | 24.4 | 18.1 |
| joint 192k | 1407 KB | 29.5 | 28.9 | 25.9 |
| joint 256k | 1876 KB | 41.6 | 38.9 | 32.4 |
| joint 320k | 2345 KB | 46.7 | 44.0 | 36.1 |

SNR 不是听感（mp3 的相位 / 高频处理会压低样本级 SNR），只能比大小方向：同样大小 joint 比现状高 7 dB，码率每上一档再高 2–12 dB。

## 3½. 真 LAME（v0.13.2，user「lamejs一口气修」「标准192同意」）

lamejs 的比特池修不了（移植坏在哪没必要挖），就把编码器换成**真 LAME**：libmp3lame 3.100 原版源码 + 我们的 `vendor/lame/lame-glue.c`，emscripten 编成 `lame.mjs` + `lame.wasm`（211 KB，`vendor/lame/build-lame.sh`，源码在家族检疫桶 `third-party/lame-3.100/`）。联合立体声 + 比特池都正常，直接吃 float（`lame_encode_buffer_ieee_float`），编码快 3–6 倍。同一把尺子（源 = 团子前 60 s）：

| 设置 | 大小 | SNR 整体 | 瞬态秒均 | 最差的秒 | 编码 60 s 用时 |
|---|---|---|---|---|---|
| lamejs 现状（stereo、无比特池、q3）128k | 938 KB | 16.8 dB | 16.9 | 14.5 | 6.2 s |
| lamejs 只开 joint 128k（v0.13.1） | 938 KB | 23.7 | 22.6 | 17.2 | 5.9 s |
| **LAME joint + 比特池 q2 128k** | 938 KB | 24.2 | 23.5 | 19.1 | 1.9 s |
| LAME joint + 比特池 q2 160k | 1172 KB | 25.0 | 24.5 | 21.0 | 2.1 s |
| **LAME joint + 比特池 q2 192k（新的「标准」）** | 1407 KB | 29.4 | 28.9 | 25.8 | 1.6 s |
| LAME joint + 比特池 q2 256k | 1876 KB | 41.9 | 39.5 | 32.5 | 1.8 s |
| LAME stereo 无比特池 q3 128k（= lamejs 的设置，真 LAME 跑） | 938 KB | 23.1 | 22.2 | 19.9 | 1.0 s |

最后一行说明 lamejs 的差不只是设置：同样的设置真 LAME 高 6 dB——移植本身就糙。

## 4. 改了什么（v0.13.1 → v0.13.2）

- v0.13.1（过渡，一天就被 v0.13.2 取代）：vendored lamejs 打本地补丁开 joint。
- **v0.13.2：lamejs 整个删掉，换真 LAME**——`vendor/lame/`（`lame-glue.c` / `build-lame.sh` / `lame.mjs` / `lame.wasm` / `LICENSE.txt` LGPL v2 / `SOURCE.md`）；`src/export/lame.ts` = JS 接口（`createMp3Encoder` / `encodeAll`，联合立体声 + 比特池默认开、q2、CBR、不写 Xing 帧）；`src/export/mp3-worker.ts` 运行时从 `vendor/lame/lame.mjs` 载（同 WORLD 的做法，emscripten 产物不进打包），直接喂 float；`scripts/render-song.mjs` 的 mp3 输出同一份。守卫 `test/mp3-encoder.test.ts`（6 条：joint / stereo / mono 帧头、CBR 大小、确定性、分块 = 一口气、报错不静默）。
- **「标准」= 立体声 192k（约 1.4 MB/分）**，user 2026-10-17「标准192同意」；「小文件」仍单声道 64k；参考窗的音频压缩仍 128k。

## 5. 没查到 / 等 user

- 「破音」到底是哪一声我没法听。文件里没有削波；编码器这一步是唯一和实时不一样的地方，修了一半。**user 重新定稿一次（改稿 → 定稿）再听**：还破 = 下一个嫌疑是 F-16 那种小月相自己唱出来的爆音（实时里也有，只是 mp3 把它再糊一层）或者码率。
- ~~lamejs 的比特池为什么坏：没往下挖~~ → 同日换成真 LAME（§3½），lamejs 删了。
- 实时和定稿还剩一个物理差异：实时按设备采样率（多半 48 kHz）、定稿 44.1 kHz。两边都是同一个 Studio 类按 sr 算系数，没量过差别。
