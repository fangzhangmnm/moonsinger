# 格式契约交接（Fable 格式 session → 编辑器 session）

> created 20261007 · by Claude Fable 5.1 · as-of v0.3.1 / main d7f551c（2026-10-07 深夜）
> user 原话（编辑器 session 转述）：「你让那个fable把东西都交给你，我现在把你升级成fable，两个agent反而打架」→ 从此格式契约和编辑器都归编辑器 session；本 session 交接后不再动仓。
> 仓里没有未提交的东西（git status 干净，main = github = origin）。

## 0. 现状一眼

- 契约 = `ai-docs/20261007-data-contract-draft.md`（§1–§10）+ `src/format/contract.ts`（v1 现役 / v2 推荐稿）。user 定：**推荐稿不是定稿**，对着 0.2.x 手感用。
- 守卫 = `test/format-guard.test.ts` + `test/fixtures/format/{shape.json, v1-1-1-1/}` + `scripts/freeze-format-sample.mjs`；`src/format/migrate/index.ts` 空链。
- 今天落的裁决都在契约里，标了「user 定 / 推断 / 推荐」。

## 1. 等 user 拍的清单（全部）

| 题 | 在哪 | 状态 |
|---|---|---|
| 歌名放哪：只归文件 / 封面（Fable 倾向，打印 / PDF 第一页页眉印）vs 第一张纸的名字兼当歌名 | §6¾ | 未拍 |
| 纸的存法 B（一张纸一份 MusicXML + 派生压平 score.musicxml） | §6¾（还按 ef92d40 的「一份 MusicXML」写着，**要按 B 重写**） | user 已拍 B（编辑器 session 转述），契约未改 |
| 样本类 / 引擎类两类划分 | §10.1 | 未拍 |
| 子集嵌入的体积阀（我填 24 MiB） | §10.2 | 未拍 |
| 许可证不许再分发的音源嵌不嵌（提示可取消 vs 改走引擎类只钉哈希） | §10.4 | 未拍 |
| 拖进来的 sf2 默认不留设备、只记「最近用过」 | §10.3 | 未拍 |
| `@internal/model-packs` 加 `listAll()` + 钉表 `/__pwa-models__/_pins/<appId>.json`（孤儿包可见可删） | §9.4 | 未拍（库的活，另开 session） |
| `@internal/model-packs` 加 `importLocal()`（本地包） | §9.1 | §10 之后降为可选便利；未拍 |
| JRB 改钉 dur 月读包去重 37.8 MB（前提：dur 不喂时逐字节同，朗读库 session 核） | §9.4 | 未拍 |
| 设置里显示 `storage.estimate()`；要不要 `persist()` | §9.4 | 未拍 |
| 曲线 → 记号的「提炼」一键命令要不要做 | §7.7 | 未拍（小） |
| GeneralUser GS v2.0.3 许可证结论过目后才能进公仓 | 编辑器 session 已查清 | user「32MB其实可以，先看看GS」「好，不拆」= 一个包；推公仓前再问一次 |
| 多声部在纸内怎么按人插「|」对齐 | §7.8 | user：做多轨时摸，不对再报 |

已拍、已落档：曲线是真相 / 记号派生（§7.7）；调号拍号 = 各声部画法（§7.8）；速度住第一声部 + 状态机（§7.8）；小节线 = 0.2.x 现状（§7.8）；休息室在歌里不做笔架、by value、钉哈希（§8）；纸 = 曲段、每张纸开头速度 by value（§6¾）；鼓最优先（§7.9）；俯视图作废；人录音频留位（§8）；用户音源一等公民（§9）；0.3.1 已上 prod；0.4.0 = 多轨 / GM 先、store 0.4.x 后（handoff §7）。

## 2. 和 user 的对话里、仓里没有的

- **§10 那轮 user 只说了那一段**（已抄在 §10 标题下）：「音源不是ml model，这是一个严重的屎山风险。各种盗版正版自制魔改音源是最容易屎山一块硬盘的，我受不了daw就是因为这个外链依赖。这个帮我好好想一下怎么办」。**没有**碰到你提的两条——① 引擎二进制随 app 发还是当包、② 引擎类「存一份到本机」的导出。user 今天没说。
  - 关于 ①：家族 CLAUDE.md「共享模型库」第 6 条有既存拍板（2026-10-01）：「引擎二进制也可以进包（user『放语音包、app 里钉哈希』『…写好hash就可以了』）：执行它的 JS 胶水仍 vendor 在仓里，包里只有哈希钉死的字节」。你那条和它相反，要改得先翻这条，带出处去问。
- §9 那轮 user 的话：「对，因为一般的daw对于音源是开的，而不是只有第一方的有指纹的」（已抄 §9 头）。
- 纸那轮 user 对我没直接说话，都是你转的。歌名归文件 / 封面是**你转述的 user 本意 + 我的推荐**，不是 user 逐字拍的，§6¾ 已按此标。
- 我手里没有 user 别的未落档原话。家族 memory（我这边的 `~/.claude/projects/…/memory/project_webrings.md`，你读不到）里记的都是仓里有的事，外加一条：user 2026-10-07「别让用户被踢下去 = 家族 zen」类的通用 feedback，不涉格式。

## 3. B 落地要动的具体点（按文件）

**contract.ts（v2 推荐稿改法）**
- `ScoreExtV2.papers` → `{ id: string; file: string; manualBars: Record<partId, number[]>; unwritten: string[] }[]`：顺序表；`file` = `papers/<id>.musicxml`（zip 根下、不进 `.moonsinger/`，别的工具能看到每张纸；或者放 `.moonsinger/papers/` 让别的软件只看压平件——二选一，我倾向后者，免得别的软件以为是多份谱）；`start` 删；`manualBars` 纸内序号；`unwritten` 按纸（note id 每张纸自己编号，跨纸会撞）。
- `ScoreExtV2.parts`：song 级并集（id / role / mic / kind），某张纸没有某声部 = 那张纸的 MusicXML 里没那个 part。
- `ManifestV1 → V2`：`files` 多列每张纸的 MusicXML（版本写 `"MusicXML 4.0"` 或 0 表示标准件）+ `derived: ["score.musicxml"]`（标派生件；读自家文件时无视它）。加字段可不升版本，但 `derived` 语义是「读时忽略」，我建议升 2 并 migrate（老文件 derived = []）。
- 谱架的纸：`.moonsinger/shelf/<id>.musicxml` 形状同顺序里的纸；或者干脆也放 papers 目录、只是不在顺序表里（manifest 另列 `shelf: [id]`）——同一种东西用同一个目录更符合 user「同一种东西」。
- 每张纸的 MusicXML 里 by value：`<work-title>` 歌名、`<movement-title>` 曲段名、`<defaults>` 纸张、`<credit>` 作者栏、每个声部第一小节 `<attributes>` + 第一声部 `<direction><metronome>` + `<sound tempo>`。
- 压平件：各纸声部并集、缺的补整小节休止、每纸起 `<print new-page="yes"/>` + `<rehearsal>`（曲段名）、测量号连续；确定性（同输入同字节，除 encoding-date）。

**project.ts**
- 写：`saveMxl` 改成写 N 份纸 + 1 份压平 + manifest.derived；mimetype 仍第一个不压缩；container.xml 的 rootfile 仍指 `score.musicxml`（别的软件开压平件）。
- 读：有 `papers` 顺序表 → 逐纸 `readMusicXml`；没有（v1）→ `score.musicxml` 整个当 p1（**文件级迁移在 openBytes 里做**，`migrate()` 只管 JSON）；别家文件 → 按 `<print new-page>` / `<rehearsal>` 切纸，切不出就一张。
- 硬写死的 `PART / ROLE / MIC / CAND` 常量 = 单声部痕迹，多轨第一刀。
- `Opened.song` 形状会变（`Song.papers[]`）：`app/main.ts` 的 `doc.saved.song` 比较、`bytesNow()`、`loadDoc` 跟着改。

**migrate/index.ts**
- `score: [v1→v2]`：`{ version: 2, papers: [{ id: "p1", file: "<p1 路径>", manualBars: { P1: s.manualBars?.P1 ?? [] }, unwritten: s.unwritten ?? [] }], parts: [{ ...s.parts[0], kind: "pitched" }] }`；`manifest: [v1→v2]`：`{ ...m, version: 2, derived: [] }`。lounge / studio 不动（仍 1）。
- 规矩：纯函数、不碰入参、`version` 由 `migrate()` 写。

**守卫 / freeze**
- 改 `FORMAT` 后：`node scripts/freeze-format-sample.mjs` → 生成 `test/fixtures/format/v2-2-1-1/`（按 manifest-score-lounge-studio 顺序拼名），**`v1-1-1-1/` 不删**；脚本默认不碰已有目录（只更新 `shape.json`），`--force` 才重生成（zip 里有时间戳，重生成 = diff 噪音）。
- `test/format-guard.test.ts` 第 5 条拿每个旧样本开出来和它的 `expected.json` 比：`expected.tokens` 是**单串**（v1 时的 `canonTokens`）。`Song` 变 `papers[]` 后，把 `test/fixtures/format/sample-song.ts` 的 `canonTokens` 定义成「各纸第一声部 token 按序拼成一串」，v1 样本就还能比；新样本的 expected.json 由 freeze 重新生成，可以加字段（guard 只读它认识的键）。
- `shape.json` 比的是写出来的键形状；FORMAT 升了它跟着重生成，审 diff 时看 `versions` 和每份的键。
- `test/format.test.ts` 里 bigSong / norm / 多条 it 都是单声部单纸假设，B 落地时一起改。
- 负向验证的做法（我做过一次）：往 `saveMxl` 偷加一个字段跑 `npm test` → 守卫第 1 条红；还原。

## 4. 其他指针

- 家规硬线：`src/format/` 改动跟 FORMAT / migrate / 冻结样本走；内部库（model-packs 等）只 bump patch，minor 先问 user；push prod 必问；每个新文件署名。
- WeebPaint 无地标尺（文件层）：`../20260524 WeebPaint/ai-docs/20260825-localfile-knight-grill-verdicts.md` §2.1；MoonSinger v0.3.0 已对齐（`src/app/main.ts` fileSave / openExportHub / doc-file.ts）。
- 0.4.0 开工前的 user 手动件（Entra 注册等）在 `20261007-persistence-handoff.md` §7。
