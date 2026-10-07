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

## 回话与约定（2026-10-06 晚，SendMessage 往返；记录 by Claude Opus 5.5）

「opus weekly code audit」session 的回复要点（原文在两个 session 的对话里）：
- **冻结点** = MoonSinger `e2dfb26`（団子断句 v5）。今晚新加的只有乐谱条目 `.before = "^" | "v" | "O"` 与 `--phrasing=score|punct|none`；OPT 新增 `lift` / `gap`（`breathMax` 并进 `gap.v.max`）。乐谱结构 / OPT 不再改，要改名先说。
- **谁抽**：编辑器 session 抽，它核。核心范围含 `out/atlas/*.json/.f32` 的读取、`breathTemplate`、`ATLAS_VOWEL` 映射。Lab README（元音图谱 / 断气两节）的参数名跟着改，也算这一刀。
- **验收的坑**：piper 的随机噪声来自 ONNX 图里的 RandomNormal，JS 端无种子，同参数两次跑字节不同。→ 两段分开验：① noiseScale 0 / noiseW 0 跑整链；② 固定同一份 piper 输出，验 WORLD 之后的确定性段（时长映射、f0、图谱融合、断气、WORLD 合成）。三首（うさぎ / 団子 / 爱）的对比结果贴本文末，它来核。
- **浏览器**：直接用朗读库（`20261001 internal-read-aloud/backend/piper-plus/`）的 worker 后端，不搬 `piper-node.mjs`；ojt 词典开发期软链，出货走 `lang-ja-pyopenjtalk-plus` 包（JRB 已这样装）；atlas `.f32` 是裸小端 Float32。
- 它转达的 user 今晚原话：「人类唱的远优于 v5…包括可爱度和其他各种情绪…可爱度不是 style preference 而就是这个歌的语义，空间蛮大，以后慢慢学」（表情层是以后的坑，别为它卡编辑器）；家规 AI 不许「听」。

**写文件约定（user：「我是让你和他商量写文件冲突的事情」）**：
1. 两边都只指名提交自己的路径（`git add <paths>` / `git commit -- <paths>`），不用 `git add -A` / `git commit -a`。
2. 不在 MoonSinger 工作目录切分支、stash、reset、checkout 文件。
3. 它今晚在 MoonSinger 不再动任何文件；以后要进，先 SendMessage，且只碰 `Lab/20261005 月读第一首/`。
4. `.gitignore`、`CLAUDE.md` 归编辑器 session（它不碰；收工加「编辑器 v0」一节不用等它）。
5. 编辑器 session 动 `Lab/20261005 月读第一首/` 之前发「开刀」，抽完发「完工 + commit」。

## 完工（2026-10-06 23:0x，Claude Opus 5.5）

- **抽法**：不手抄。用脚本从冻结点 `e2dfb26` 的 `sing.mjs` 按行号切出第 1–4 步 + `finish`，只做机械替换：piper / WORLD / 图谱由宿主递进来（`piper.run(ids, pros, opts)` 已绑 session；`loadAtlas(id)`）；`console.log` → `log`；`pn.session(MODEL)` / `loadWorld()` 移到壳里；图谱加载改 `await Promise.all`（顺序不变）；DIAG2 诊断挪回壳（只读 sp，不改结果）。浮点运算顺序一行未动。
- **结果**：`src/singer/sing-core.mjs`（导出 `DEFAULT_OPT`、`singCore`）；`Lab/20261005 月读第一首/sing.mjs` 447 → 约 180 行的 Node 壳（参数、读写文件、测量、DIAG 原样）。新增 `--noise=0`、`DUMP_F32`、`RECORD_PIPER` / `REPLAY_PIPER`、`OUT_DIR`（验证时别清掉 `out/` 里 user 正在听的 mp3）。README 两处跟着改（参数住址、新开关）；参数名一个没变。
- **验收 ①（noise 0，整链）**：基线 = `e2dfb26` 原文件拷到 tmp，只改路径指回 Lab + noise 开关 + 存样本。先确认基线自己 noise 0 跑两次逐字节相同（正常噪声两次不同，和你说的一致）。

  | 变体 | 样本数（float32 字节） | 抽前 vs 抽后 |
  |---|---|---|
  | うさぎ（图谱 normal + 断气，默认） | 1 420 024 | 逐字节相同 |
  | 団子（同上，含 ^ v O 断句） | 3 484 344 | 逐字节相同 |
  | 爱（zh，同上） | 2 888 112 | 逐字节相同 |
  | うさぎ `--atlas=off`（断气随之关） | 1 420 024 | 逐字节相同 |

- **验收 ②（正常噪声，固定 piper 原料）**：新壳录下 piper 第二遍原料 → 抽前 / 抽后都回放这份 → 四个变体逐字节相同；回放结果也与录原料那次的成品逐字节相同（录放本身无偏差）。
- **测量报告**：四个变体的终端输出（每音音高 / 起音 / 有声比例 / 响度、图谱与断气统计）抽前抽后去掉耗时与文件路径后逐行相同。
- 一次运行耗时：うさぎ ≈ 7 s、団子 ≈ 16 s、爱 ≈ 16 s（本机 Node 单线程，含模型加载与三份 mp3 编码）。
