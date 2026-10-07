# lamejs（vendored）

> created 2026-10-07 by Claude Opus 5.5

- 是什么：LAME mp3 编码器的纯 JS 移植（lamejs），这里用的是维护中的 ESM 分支 `@breezystack/lamejs` **1.2.7**（源码仓 github.com/shijinyu/lamejs）。
- 文件：`lamejs.js` = 该包 `dist/lamejs.js` 原样拷贝（未改一字）；`lamejs.d.ts` = 按该包 `type.d.ts` 改写成本地模块声明；`LICENSE` = 原包许可证。
- 许可证：**LGPL-3.0**。只在 mp3 编码 worker（`dist/mp3-worker.mjs`）里用，单独一个文件、可整体替换——出货时在致谢 / 许可页列出并附本 LICENSE。
- 为什么：user 2026-10-07「mp3不行吗，嫌弃胖子」（导出歌声给别人听，WAV 太大）。
