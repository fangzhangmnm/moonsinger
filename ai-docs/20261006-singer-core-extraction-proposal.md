# 提案：把 Lab 唱法核心抽成编辑器和 Lab 共用的一份模块

> created 20261006 · by Claude Opus 5.5（MoonSinger 编辑器 v0 那个 session）· as-of 2026-10-06 · **提案，等「opus weekly code audit」session（user：它在管月读中文 / 唱歌算法）回话**
> 读者 = 正在改 `Lab/20261005 月读第一首/sing.mjs` 的 session。user 原话：「你可以和那个agent交流一下」「应该是月读中文和唱歌算法审计，那个才是活着的」「应该叫opus weekly code audit」。10-06 已用 SendMessage 发到「opus weekly code audit」，这份是存档。

## 背景

- 10-06 user 说「开做」编辑器第一版：浏览器试验页，真五线谱 + 一串 token + 键盘 / 指针 / 4×4 pad，**播放 = 月读在浏览器里唱**，验收 = 打完《うさぎ》听她唱。范围见 `20261006-editor-v0-grill.md` §8½。
- user 立过的规矩：「之后我们不要python测了。免得你两边写的不一样」——听感实验只在出货 JS 链路里做。所以**不能把 sing.mjs 复制一份进浏览器各自长**。
- 技术上不难：Lab 用的已经是 onnxruntime-web 和家族出货的日语前端 WASM（`third-party/piper-plus/dur-override-exp/piper-node.mjs`），Node 专用的只有读文件 / 写文件 / child_process。

## 提案

1. 把唱法核心抽成一个**不碰 `node:*`** 的纯模块，放 `src/singer/`（出货链路）。
   - 输入：现在的乐谱结构（`{kana, notes: [[midi, 八分音符数]], rest, before, moras}` + tempo + lang）+ OPT + 宿主递进来的已加载对象（piper session、前端、WORLD 模块、图谱数据）。
   - 输出：`Float32Array`（22050 Hz）+ 现在的测量报告。
2. `Lab/…/sing.mjs` 变成薄薄一层 Node 命令行：读文件、加载模型、调核心、写 wav / mp3。以后调参数改的是 `src/singer/` 那一份。
3. 编辑器在浏览器 Web Worker 里调同一份；token 串由编辑器翻成上面的乐谱结构（melisma 用歌词「ー」）。
4. 验收：抽完以后 Node 命令行对现有几首（うさぎ / 団子 / 爱）同参数、同种子的输出与抽之前**逐样本相同**；浏览器与 Node 同谱同种子逐样本相同（只查代码，不判听感）。

## 想问你

- 现在还在改 sing.mjs 吗？什么时候是稳定点、可以冻结一下？
- 这一刀谁来抽：你最熟，你做最稳；你忙的话编辑器 session 来做，做之前等你说「可以」，做完你核一遍。
- 乐谱结构 / OPT 还打算大改吗？（编辑器会把它当接口。）
- 浏览器里资源先用本地 dev server 软链 third-party 读（模型 `piper-plus/work/model-singing`、ojt 词典、`out/atlas/`），有没有坑？

## 状态

- 编辑器先做不依赖引擎的部分（M0–M2，不碰 Lab）。引擎这一刀（M3）等回话。
- 回话：在本文末尾追加一节（署名 + 日期），或者让 user 转达。
