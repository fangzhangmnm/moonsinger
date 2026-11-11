# MoonSinger 哲学账

> created 20261111 by Claude Opus 5.5 · as-of v0.16.107 / 2026-11-11
> 记「为什么」：user 想通的根因、设计取向背后的道理。一条一节：user 原话照抄在前，AI 的补充标明是补充、哪些没核实。不是规矩（规矩在 CLAUDE.md），是规矩的来历。

## 1. 时长是对数的——为什么受不了钢琴格、坚持五线谱（2026-11-11）

**user 原话**（MoonSinger 简谱 meta 讨论，`ai-docs/talks/20261111-two-display-modes-meta.md` 第 37–38 节）：

> aha i know why i prefers sheet music. perhaps humans perception of time is log. so it means in piano roll, inexperienced players (like me) cannot properly judge the time interval. however, using sheet music and token based time notation, it is easier to climb the log ladder. also the visual fat-thin also follows a log law instead of linear law. 帮我哲学记账，这是为什么我受不了钢琴格的根因。就是一个8拍可能感觉只比4拍长一点，除非你会数拍子

同一轮前一句：「三岁也不一定等距，比如不同胖瘦大小是不同的时长，但是不是一比一，我一开始就是因为觉得一比一反而会反直觉才一直坚持sheet music」

**要点（按 user 的话）**
- 人对时长的感觉是对数的；钢琴格把时长画成线性的长度，没经验的人（user 自己）判断不准长短。
- 五线谱和「一串 token」的时值是一架对数的梯子：每往上一级 = 翻一倍，人一级一级爬就行。
- 字形上的胖瘦也照对数走，不照线性走。
- 一个 8 拍的音可能感觉只比 4 拍长一点——除非你会数拍子（数拍子 = 把线性的长度换成离散的计数，是有经验的人的办法）。

**AI 的补充（不是 user 说的）**
- 记谱法本身就是对数的：全、二分、四分、八分、十六分，每个字形之间是 ×2；附点 = 再加半级。一个音的时值是从几个离散的档里挑，不是一个连续的长度。
- 排版的老规矩里，音符占的横向距离随时值增长得比时值慢（远小于一比一），我们的排版器也是按「一列多宽」的弹簧算（`src/render/spacing.ts`），不按时间一比一。
- 心理学里「感觉随刺激按比例变」（韦伯定律）在时间长度上也大体成立（凭印象，没查原文）。
- 和 MoonSinger 别的决定是一回事：输入一步一步写、长短从几档里挑，不靠按的时机（10-06 起，SEQTRAK 那件事）；10-10 否掉「每个音存绝对位置」；三岁档的时长画在角色胖瘦上、间距不一比一（11-11）。

**推论（AI，没拍）**：以后任何要表示时长的画法（简谱、三岁档、重新发明的钢琴格、鼓格子），时长都走离散的对数档 + 字形，间距只松松地跟；需要线性时间的地方（录音、对齐延迟）是另一件事。
