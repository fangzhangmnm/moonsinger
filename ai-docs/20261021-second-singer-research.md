# F-15 第二位歌手：调研稿（只出稿，没动码）

> created 20261021 by Claude Fable 5.1 · as-of v0.13.10（dev）/ 2026-10-21
> 起因：user 10-13「小月相就是需要找几个别的歌手。不用想太多」→ 家族周账 F-15「先找许可证可再分发、或走本机导入的音色，再核唱法核心要改多少」；10-21 周账 §6 道 4 第二表。
> 许可证那一栏全是**一手页面**当天抓的（出处在文末）；AI 不听（家族 memory「AI 不许听」），谁的声音合适归 user 耳朵。

## 0. 一句话

管线对「第二位歌手」只要一样东西：**一个 piper-plus 系的日语模型 + `dur_override` 输入**——后者不用重训（ONNX 图手术脚本家里就有），前者只能靠**在 piper-plus 底模上微调一个新语料**（公开的 piper-plus 现成单说话人音色只有 つくよみちゃん）。语料里许可证能进公仓（pwa-models）的：**JVNV（CC BY-SA 4.0，最干净）**、**あみたろ（商用 + 训模型 + 免费公开模型都允许，只差「模型库服务」一句要确认）**、**CSS10 日语（Apache-2.0 / LibriVox 公有领域，男声朗读）**；ずんだもん那一家（ITA 多模态库）**研究限定、嵌产品要 SSS 事先批准** = 只能走本机导入自用。app 侧改动小（注册表多一项 + 包表变成表 + worker 按音色载模型），**唱法核心零改动**；真正的成本在训练（要租 GPU）和 user 选人。

## 1. 管线对一位歌手的要求（读代码得出的硬条件）

| 条件 | 为什么 | 出处 |
|---|---|---|
| **piper-plus 系模型**（MB-iSTFT-VITS2，ayutaz/piper-plus 导出） | 文本前端是家里 vendor 的 pyopenjtalk-plus（ja）/ pinyin（zh）/ CMUdict（en）→ piper-plus 的音素表（PUA 映射）。原版 piper 用 espeak-ng 的 IPA 音素，**音素表不通**，ljspeech 那一类现成音色用不了 | `@internal/read-aloud/backend/piper-plus/`（ja-frontend / zh-g2p / en-g2p / pua-map） |
| **`dur_override` 输入**（每个音素的时长从外面给） | 唱法核心第 2 步「piper 的紧凑时间线」：先跑一遍拿模型自己的时长，再按谱算每个音素的帧数、**带 override 跑第二遍**；运行时只在模型有这个输入时才喂（没有 = 静默用模型自己的时长），核心随即在 `audio … samples, timeline …` 那一行抛。所以没有 dur_override 的 piper-plus 模型**不能唱** | `src/singer/sing-core.mjs` 第 2 步；`backend/piper-plus/vits.js` `if (names.has("dur_override"))` |
| dur_override 不用重训 | ONNX 图手术：在 `/Mul_3`（w = exp(logw)·mask·length_scale）和 `/Ceil → generate_path` 之间插一个 Where；全 0 = 原模型。任何 piper-plus 导出（有同样的 `/Mul_3` 节点）都能做；脚本带校验（`verify-dur-override.mjs`） | `~/jupyter/third-party/piper-plus/dur-override-exp/make_dur_override.py`（Opus 5.5 2026-10-05；**住在检疫桶，不在任何家族仓**——要当正式工具得搬进模型仓 `tools/`） |
| 包形状 | voice pack（model.onnx + config.json，fp16）+ 共用的 runtime / lang 包；`voices/<id>.json` 带 credit / terms / termsUrl → 设置页署名块 | `20260903 PWA Models/voices/tsukuyomi-chan-zhen.json`、`tools/pack.py`；打包脚本样板 `third-party/piper-plus/backend/build-zhen-pack.mjs` |
| 内存 | 一条工作道 ≈ 307 MB（ort 122 + OpenJTalk 168 + WORLD 17）+ 模型；**两位歌手同时上场 = 第二份模型**（约 +40 MB fp16，引擎不翻倍，但要在同一个 worker 里换 session）；iPad 单道预算那套要接 | `src/app/resource-watch.ts`、CLAUDE.md「月读内存」条 |

## 2. 候选（许可证 = 一手页面；风格描述只转述页面 / 数据说明，不是听感）

| 候选 | 数据 | 许可（一手） | 能进公仓？ | 署名 / 禁止 | 备注 |
|---|---|---|---|---|---|
| **つくよみちゃん**（现役） | つくよみちゃんコーパス | 利用規約（衍生模型 OK，署名 + 四条禁止用途） | 已在 | 已落地（设置页） | 基线 |
| **あみたろ**（あみたろの声素材工房；角色「小春音アミ」） | ITA 全 424 句「ノーマル」Ver.2.2（48 / 44.1 kHz）+ るんるん / よふかし / ぷんすか / ささやき 四种风格各一套；未剪的 3211 条只给研究者 | 商用 OK；**明写允许当音声合成模型的训练数据**；只用她声音的模型：**免费公开可以（条件：附规约链接或 Readme、注明「训练数据用了あみたろ的声、不是本人做的」），不许卖、不许「登录到模型库服务」** | **大概率可以**——卡在「モデルライブラリサービスへの登録禁止」这一句：我们的 pwa-models（GitHub Pages 静态分发、只给自家 app）算不算「服务登录」，要么按保守读去问本人，要么 user 判 | 署名固定文案「音声素材：あみたろの声素材工房（https://amitaro.net/）」必须在显眼处；禁止：成人 / 政治宗教 / 歧视 / 诈骗冒充 / NFT·赌博·毒品·武器 / 直链 / 当音声包转卖；和 つくよみ 的禁止用途同形，署名块那套 UI 直接复用 | 风格页面自述：ノーマル 是逐音清晰的朗读、「让角色说话会有点棒读」；るんるん 弹跳口语、ぷんすか 幼齿动漫声 |
| **JVNV**（東大 猿渡研 / NII，2023） | 4 人（F1 F2 M1 M2）3.94 h、1615 条、48 kHz 24-bit，情感语音 + 非语言声（笑 / 哭） | **CC BY-SA 4.0**（作者页面明写） | **可以**（许可最干净；SA = 衍生模型也按 CC BY-SA 发，公仓本来就开） | 署名 BY；无禁止用途 | 脚本是 ChatGPT 生成的情感句；每人不到 1 h；风格 = 情感朗读，不是角色声 |
| **CSS10 日语**（Kyubyong Park） | LibriVox《明暗》朗读，读者 ekzemplaro，14.9 h | 数据页 **Apache-2.0**；音频源 = LibriVox 公有领域 | **可以**；而且 piper-plus 作者已经用 CSS10 训过模型（npm 0.8.0 说明提到「CSS10 models」；vokra 仓里有标 MIT 的 GGUF 转换版，上游 = ayutaz/piper-plus MIT）——**现成 ONNX 在哪、是不是单说话人、带不带说话人向量要再核**（demo space 里的 `ja_JP-test-medium.onnx` 没写数据来源） | Apache 署名 | 男声、朗读腔 |
| ずんだもん / 四国めたん / 東北イタコ（ITA コーパス マルチモーダルデータベース，SSS） | ITA 424 句 + ROHAN4600（多模态） | **研究目的、非商用**（著作権法 30 条の 4 范围）；成果物商用 / **嵌进公开的软件或服务 = 事先联系 SSS 得到承认**；数据不可再分发；署名 ©SSS；Twitter 登录才能下 | **不行**（除非去问 SSS 并拿到书面同意） | — | 东北ずん子的角色规约本身没提 AI；两份规约都要守。VOICEVOX 那边「ずんだもん 音源」的商用条款是对 VOICEVOX 输出的，不覆盖拿语料训自己的模型 |
| 黄琴まひろ ITA | — | **一手规约没查到**（只看到 CoeFont 版「照 CoeFont 规约用」） | 待查 | — | 下轮再查 |
| piper-plus `zs-v1` 零样本底模（571 说话人，CAM++ 192 维说话人向量，2026-10-10 发） | 一段参考录音定音色 | README 自己标「不是质量认可」、**没写许可**；上一代 v8 要申请权限 | **不行**（没许可 = 不能分发） | — | 技术上是「本机导入：自己录 10 秒当歌手」最省事的形态；许可一天不写一天不能用 |
| `piper-plus-base`（CC-BY-4.0） | 142 个中文说话人 + 多语 | CC-BY-4.0 | 本身可分发 | — | **说话人表删掉了**（`emb_g` 去掉），选不出任何一个人——不是现成歌手，只是微调的起点（朗读库 2026-10-01 评估已核） |
| 原版 piper 音色（ljspeech / huayan / 小雅…） | 各异 | 各异（小雅非商用） | — | — | **音素表不通**（espeak）；要用得先 vendor 一套 espeak-ng 前端，不是这条路 |
| 歌声数据库（東北きりたん歌声 DB 等 NEUTRINO / ENUNU 系） | — | — | — | — | 不是本管线（另一个引擎 = 远景「专门的歌声合成模型」），这里不算 |

## 3. 两条路

**A. 公仓（pwa-models）**：选语料 → `uv sync --extra train`，在 piper-plus 底模上微调单说话人（上游训练指南 `docs/guides/training/training-guide.md`；默认 torch 2.11 + cu128、驱动 ≥ R570；**数据格式 / 最小显存 / 推荐时长 README 没写，要读指南**；4090 已坏 → 租云 GPU，家族 memory「训练租云 GPU」）→ 导出 ONNX → `make_dur_override.py` → fp16 → `tools/pack.py` 打包 + LICENSE 快照 → `voices/<id>.json`（credit / terms）→ app 注册表多一项。候选顺序按许可干净度：JVNV > CSS10 > あみたろ（问清那一句）。
**B. 本机导入**：设置页已有「从本机文件导入模型包」（按内容哈希认分片，要 manifest）；第二位歌手走这条 = 用户自己训（或拿到的）piper-plus 模型 + 自己跑 dur_override 手术 + 自己打包；署名由导入者自填。适合 SSS 系（研究自用）、以后的零样本。**app 侧要加的**：导入时核模型有 `dur_override` 输入（没有 = 拒、明说），voice json 由导入者给。

两条路 app 侧的改动是同一份（§4），差别只在包从哪来。

## 4. app 侧改动量估计（没动码）

- `src/singer/packs.gen.ts` `SINGER.voice` 单值 → 音色表（gen 脚本从模型仓 `voices/*.json` 生成多条）；候选 by value 带 `voiceId`（契约 `CandidateV2` tsukuyomi 分支加可选字段，没写 = つくよみ，**不升版本**）；`src/performers/tsukuyomi.ts` 注册表项按 voiceId 报 credit；worker `ensurePacks` / session 按 voiceId 载（同一个 worker 换 session；两位同时上场 = 两个 session 常驻或换载，走内存预算那套）；念缓存键已含 packId（自动分开）；歌手牌「找人」里人声类多一位；设置页署名块按上过场的音色逐个显示；E2E（假 worker 已有样板 `reading.mjs`）。**估 1–2 天**；唱法核心、WORLD、时间线零改动。
- 风险：中英增强（语言向量 preset）是 つくよみ 专属的手术（`langemb-exp/make_zhen.py`），新歌手要中英得再做一遍或只唱日语（能力字段 `lyrics` 按音色报，画灰那套现成）。

## 5. 要 user 定的（定了才动码）

1. **要谁**：情感朗读 2 女 2 男（JVNV，许可最干净）/ 动漫少女（あみたろ，要确认一句）/ 男声朗读（CSS10，可能有现成模型）/ 以后自己录（零样本，许可卡住）。
2. **先走 A 还是 B**（公仓 vs 本机导入）；A 要租 GPU 的预算。
3. あみたろ 的「模型库服务」那一句：去问本人，还是按保守读（不进公仓、只本机导入）。
4. dur_override 手术脚本要不要从检疫桶搬进模型仓 `tools/`（反弃坑：现在只在本机）。

## 出处（2026-10-21 抓）

- あみたろの声素材工房 利用規約 https://amitaro.net/voice/voice_rule/ ；ITA コーパス読み上げ音声 https://amitaro.net/voice/corpus-list/ita/
- ITA コーパス マルチモーダルデータベース（SSS）https://zunko.jp/multimodal_dev/login.php ；東北ずん子 ガイドライン https://zunko.jp/guideline.html
- JVNV corpus（高道慎之介 研究页）https://sites.google.com/site/shinnosuketakamichi/research-topics/jvnv_corpus ；论文 https://arxiv.org/abs/2310.06072
- CSS10 https://github.com/Kyubyong/css10 ；vokra/piper-plus-css10-ja-6lang https://huggingface.co/vokra/piper-plus-css10-ja-6lang
- piper-plus https://github.com/ayutaz/piper-plus （README：MIT、训练指南、zs-v1 底模）；releases https://github.com/ayutaz/piper-plus/releases ；demo space 模型目录 https://huggingface.co/spaces/ayousanz/piper-plus-demo/tree/main/models ；作者模型页 https://huggingface.co/ayousanz
- 家里：`@internal/read-aloud` `ai-docs/20261001-zh-frontend-and-merged-frontend-assessment.md`（底模 / 零样本 / 原版 piper 中文音色那一表）
