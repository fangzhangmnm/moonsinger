# lamejs（vendored）

> created 2026-10-07 by Claude Opus 5.5

- 是什么：LAME mp3 编码器的纯 JS 移植（lamejs），这里用的是维护中的 ESM 分支 `@breezystack/lamejs` **1.2.7**（源码仓 github.com/shijinyu/lamejs）。
- 文件：`lamejs.js` = 该包 `dist/lamejs.js` 拷贝 + **一处本地补丁**（2026-10-17 by Claude Fable 5.1，函数 `cr` = Mp3Encoder：加第 4 个参数 `opts { joint, reservoir, quality }`；不给 = 和上游逐字节一样）。为什么：上游的 Mp3Encoder 写死 `mode = STEREO`（左右各编各的，128k = 每边 64k，中间的人声两边各存一份）和 `disable_reservoir = true`（关掉比特池，帧之间不能借比特，鼓 / 木鱼这种瞬态帧饿着）——user 10-17「定稿的mp3听起来差很多…有破音」查到这里；量化对比见 `ai-docs/20261017-final-mp3-quality.md`。升级上游时这一处要重打。`lamejs.d.ts` = 按该包 `type.d.ts` 改写成本地模块声明；`LICENSE` = 原包许可证。
- 许可证：**LGPL-3.0**。只在 mp3 编码 worker（`dist/mp3-worker.mjs`）里用，单独一个文件、可整体替换——出货时在致谢 / 许可页列出并附本 LICENSE。
- 为什么：user 2026-10-07「mp3不行吗，嫌弃胖子」（导出歌声给别人听，WAV 太大）。
