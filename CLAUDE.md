# MoonSinger — 写歌 PWA（孵化期）

> created 20261007 by Claude Opus 5.5（2026-10-07 从写歌实验室仓 `../20260810 写歌实验室/`（原名 `20260810 MoonSinger`）抽出 app，`git filter-repo` 只留 app 的路径和跟 app 走的 ai-docs，真历史原样保留）。家规全继承（`../CLAUDE.md`），本文件只写本仓专属。

**分家（user 2026-10-07）**：「moonsinger能毕业上gh吗？隐私怎么办？」→「可以吧讨论写歌的单独开一个家族项目，包括早期实验…ai docs也得分家」→ AI 提的切法 →「写歌实验室这个名字同意」；「毕业就是MoonSinger」。
- **本仓 = app，按公开标准写**（毕业名就是 MoonSinger，到时整仓连真历史和 ai-docs 公开，走家规公开工坊道）：不写私人的事、机器名、带用户名的绝对路径；私人的身份 / 音乐史 / 早期实验、journals 都在写歌实验室仓（私有）。
- **毕业 ≠ 升版本号**（user「我没有说过毕业升major」「weebpaint0.x了那么久」）：major 只由 user 提。
- 毕业前还差的（user「毕业差的东西做，不毕业没法接gallery做存档哦」）：见下「出货前要换的路」。

> 「起名哲学就是nokia的彩铃编辑器，我觉得这个比daw要干净许多。可以先用这个做mental model」（user 2026-08-18 原话，本仓 init session）
Nokia 彩铃编辑器，不是 DAW。

## 月读与方向（2026-10-05 颠覆，全文 `ai-docs/20261005-moonsinger-upheaval.md`；user「今天的和之前的所有规矩都是提案，都可以随时吃书」）

- **月读（つくよみちゃん）= 第一公民，内置，不是插件**；~~破手机带不动 WASM 就退回 GM 的人声音色（Ahh / Ooh）~~ → 2026-10-07 改为退回月读自己的元音采样器（user「带不起piper的就用我们的元音sampler来兜底，类似gm的ahh ohh」；账本 §9¾）。「整个数据契约，交互，UX样式，必须是为了服务月读的。是被她逼出来的。」
- **核心是嗓子**：「肌肉的松紧，气息。而不只是离散的音高节奏和velocity。」
- **最小可交付 = 儿歌**，60 秒能出 mp3。界面在考虑极端的「简谱儿歌本」（未定）；核心设备 iPad mini。
- **版本纪律（user 提的 major）**：第一个大版本 = 歌（图片 / stamp 也可进）；第二个 = 配器，且「配器必须是为了给月读伴奏」；第三个 = 电音。
- **乐谱里可放一张贴纸级别的图**（user：WXHW 里 body double 靠参考窗就够，PDF 导出尝到甜头）。

## 编辑器 v0（2026-10-06 落地，READ FIRST；edited by Claude Opus 5.5）

user 2026-10-06「开始做第一版吧。和catsup一样一开始先不蛋疼store和undo,先把编辑器摸出来」→ grill 后「可以，以后随时吃书，先这样，开做」。
决定与原话全在 `ai-docs/20261006-editor-v0-grill.md`（§8½ = 第一版范围）；同行调研 `ai-docs/20261006-peer-survey-melody-input.md`。
**下一步 = 持久化（接 store / gallery）**：起手读 `ai-docs/20261007-persistence-handoff.md`（as-of v0.2.27：现状、哪些只在这次打开里有效、user 原话、要想的、坑）。产品愿望单 `ai-docs/20261007-wishlist.md`。

- **跑**：`npm install` →（可选）`bash scripts/link-dev-assets.sh`（只有元音图谱实验要它，默认关）→ `npm run build` → `npm run serve` → 开 `http://localhost:8710/`（绑 0.0.0.0，iPad 走局域网 / Tailscale 也能开）。测试 `npm test`。
- **iPad 上测（不留洞的做法，2026-10-06）**：WSL 里 `PORT=8710 BIND=127.0.0.1 npm run serve`（只听本机、只端出 app 要的文件）；Windows「以管理员身份运行」PowerShell 跑 `& "C:\Program Files\Tailscale\tailscale.exe" serve --http 18124 http://127.0.0.1:8710`（**不带 --bg**：窗口开着才通，Ctrl+C / 关窗即消失，不进常驻配置）；iPad 开 `http://<这台 Windows 的 Tailscale 机器名>:18124/`。坑：WSL mirrored 模式下 Windows 占着的端口号 WSL 用不了（18123 被 Tailscale 自己占着）；Tailscale serve 配置里有 path 条目，所以改 serve 要管理员；Windows 上 `localhost` 先走 ::1，目标写 `127.0.0.1`。
- **形状**：真五线谱（自画 SVG + Bravura）；旋律 = 一串 token（音符 / 休止 / 小节线 / 记号；user「一串token，拍」「bar是你人工插的token」）；调号 / 拍号 / 速度也是 token（开头三个 = 谱头，点了就地改；user「都是token」）；数据存带拼写的绝对音高；输入三路写同一串：键盘（**键位唯一真理源 = `src/input/keys.ts` 的 BINDINGS 表**：路由 + `docs/keys.md`（`node scripts/gen-keys-doc.mjs` 生成，测试守着不过期）+ pad 按钮提示都读它；加 / 改快捷键只改这张表）、笔 / 鼠标（点选、拖改音高 / 时值；点谱面写音 10-07 拿掉，user「以后用专门的toolstate做」）、手指 pad（2026-10-07 晚起 = 一台独立的 MEDO 式输入设备，假设没有谱：自上而下 = 4 个旋钮「1= / ♪长短基线含连音 / 音域 / ⋯」（前三个分宽度、「⋯」是 44 px 方块；「1=」点开 = 调 + 调式两列滚轮，调式表 `src/score/scales.ts`，pad 音键按调式排；按住上下滑 = 旋钮变成里程表的窗原地滚、一次最多一格；点一下 = 弹出滚轮；音域写「F3–G5」，太窄两行、下面是低的）/ 写字键「← → 0 | 升降 /2 — ⌫」（← → 同样大小的方块；升降、/2 = 和 Shift 一个逻辑：点一下 = 下一个（/2 = 凑满一份原来的时值，平常两个音）、连点两下 = 锁、按住写 = 按住期间；升降键上下滑换 𝄪 ♯ ♭ 𝄫；pad 窄了先藏升降、再藏 /2；⌫ 按住连删；「⋯」里直接是插调号 / 拍号 / 速度，钮上写光标处现在的值、左上角「+」）/ 音键；**pad 像软键盘、五线谱像文本框**（竖屏：点谱弹出，写歌词 / 改歌名收起，点顶栏空白收起）；单音乐器同时多按只写第一个（隔不到 50 ms 且前一个还按着才算同时，快速连按照写）；音键占满整宽、按下即写、按着上下滑过门槛 = 这一个音升 / 降（松手前键上先显示，滑回中间还原）；pad 的调是它自己的、不跟谱上的调号；「弹」在顶栏；音域提示 = 音域里的键底部细条，「1」不特别标；`src/ui/pad.ts` 头注释有 user 原话）；**小节线 = 按拍号自动画（只画、不进数据，「⋯」里可关）+ 人插的「|」从那里重新数**（弱起 = 写完弱起的音按一下「|」；跨小节线的音画成连着的两段；`test/bars.test.ts`）；窄屏五线谱小一点、排满的行右端对齐；歌词在谱下面就地写（照常连打一个字一个音；要几个字放同一个音 = 打完回头点那个字、框下面的「合」（这一句后面的字往前挪，到下一个休止为止），外接键盘 / 粘贴也可以字中间打「+」（elision，数据里「‿」，唱的时候平分这个音）；詞先 / 曲先都行，空歌词唱「哼的字」，默认「嗯」）。撤销还没有。
- **顶栏一行（2026-10-07 v0.2.17）**：左 = 文件钮 + 文件名（点 = 文件菜单）、中 = 走带条（▶ / 弹 + 进度）、右 = 键盘 + 扳手；消息走 `@internal/workbench-elements` 的 notice（包的 CSS 拷在 `vendor/internal-css/`，收货后手动拷）；音质 / 哼的字在歌手牌（第一行谱号左边的「月读」，点开就地改）。**存档 = 无地逃生口（2026-10-07，user「先不急着store。可以先按照无地规范导入导出做逃生口」）**：文件菜单 = 新建 / 打开 / 存 / 另存为 / 改文件名 / 导出歌声（Ctrl / ⌘+S 存、+Shift+S 另存为、+O 打开）。文件名 = 没存过「年月日-歌名」、存过之后和歌名各管各的。**纸 = A4 / A5 / A6（默认 A5，`src/score/paper.ts`；纸右上角小钮改；存 MusicXML `<defaults>`）**：屏幕放得下就严格按纸排、纸居中在桌面上；放不下（手机）默认不折行 = 整张纸按比例缩小（纸的设置里可改成按屏宽折行）；不打印不分页。纸 / 曲段 / 谱架的关系见数据契约草稿 §6¾。一首歌 = 一个 `.mxl`（格式 = 数据契约草稿 `ai-docs/20261007-data-contract-draft.md`：`score.musicxml` 是正本、`.moonsinger/` 放谱的扩展 / 休息室快照 / 录音房，各带版本号；不认识的东西原样写回；比 app 新的拒开）。代码：`src/format/`（`xml.ts` 零依赖 XML、`musicxml.ts` token ↔ MusicXML、`project.ts` .mxl 打包，用 vendored `fflate`）+ `src/app/doc-file.ts`（桌面 Chromium 文件句柄存回原文件；iPad / Safari 存 = 下载 / 分享、打开 = 选文件）。改过没存：标题带「•」、换歌先问、关页面 = 浏览器挽留框（照 WeebPaint，不偷偷写盘）。**作者栏**（一块纯文本、几行都行，标题下面靠右照写的显示，点了改；不解析格式、不提醒写什么；存 MusicXML `<credit><credit-words>`）。**歌名（2026-10-07，user「纸张的最上面加一个可选的歌名吧，未来也是文件名，用同样的yyyymmdd hash的默认规范」）**：纸面最上面一条，可不填（空着画一个空的虚线框、不写字，作者栏空着同样；点了就地改，`src/ui/title-editor.ts`）；存在谱里（`Song.title` = MusicXML `<work-title>`）；文件名 = 歌名，没填 = 家族默认名 `yyyymmdd-hex4`（`src/app/names.ts`，照 WeebPaint / WXHW / CatsUp；接 gallery 时换成 `@internal/gallery` 的 `galleryDefaultName`）。别的软件存的谱：只读第一个声部，读不了的报出来，**不自动选角**（「音质」= 未选角，人选月读才唱）。写出来的 MusicXML 过了 W3C 4.0 schema 校验；`npm run smoke` = 离线壳 + 文件流程两份真浏览器冒烟（桌面 Chromium 的系统文件框没法自动测）。
- **试听元音表**：`node scripts/gen-preview-vowels.mjs`（离线跑共用核心，出 `assets/preview/vowels.{pcm16,json}`（进仓随 app 出货，3.3 MB），约 14 s；五个哼的字：嗯 / 啊 / 哦 用日语，呜 / 啦 用中文；做法与 user 原话在脚本头注释）；整首唱时哼的字走核心 opt humNasal / humConsMin（核心默认关，app 打开）；浏览器的元音采样器（`src/singer/sampler.ts`）管试听 / 即兴 / 轻量兜底，只唱「哼」那一个字，不看歌词（user「还是单一元音更适合当blueprint」）。
- **英文歌词（2026-10-07）**：歌词有拉丁字母、没有假名汉字 → 按英文唱（中英增强模型 preset 9）。记谱层只存音节 + 「词没完」（hyph，MusicXML syllabic），引擎这边拼回单词、查读音、分元音核心（`src/singer/en-front.mjs` + 朗读库同一份 `backend/en-g2p.js` / CMUdict）；词尾辅音只在后面是休止 / 全曲结尾时留在这个音的末尾（核心 `m.coda`，只在英文分支）。拼回的词要是真实单词（「ev-ry」拼成 evry 查不到，写「ev-er-y」或「ev-ery」）；英文歌里哼「嗯」只能用 hum（mm 没有元音）。
- **唱法只有一份**：`src/singer/sing-core.mjs`（浏览器 worker 与写歌实验室仓的 `Lab/20261005 月读第一首/sing.mjs` 命令行壳共用（它按兄弟路径 import 本仓这一份）；user「免得你两边写的不一样」）。改唱法改它；Lab 命令行 `--noise=0` + `DUMP_F32` 做逐样本对比。抽取验收与浏览器 == Node 验收记在 `ai-docs/20261006-singer-core-extraction-proposal.md`。
- **模型包（2026-10-07 起）**：月读本体 / 运行时 / 日中英词典走家族模型包（`@internal/model-packs` 下载、逐片验、存 Cache Storage `pwa-models`，下一次和升版本都不重下；user「当然a」「最好jrb和moonsinger只用存一份」）。清单 = `src/singer/packs.gen.ts`（`node scripts/gen-packs.mjs` 从 `../20260903 PWA Models` 生成，测试守着不过期）。模型源 = `https://fangzhangmnm.github.io/pwa-models`（同 JRB）。共享库 `@internal/model-packs` 0.1.0 = `vendor-pkgs/` 的 tgz（收货：`bash "../20261007 internal-model-packs/scripts/pull-package.sh"`）。
- **出货前要换的路**：①② 已做（2026-10-07：模型包推上 GitHub Pages、共享库 0.1.0 收货）；③ 已做（2026-10-07，user「毕业差的东西做」）：JS 胶水走朗读库 0.1.22 的底层出口 `@internal/read-aloud/backend/piper-plus/*`（打进 worker；类型 `src/singer/read-aloud-backend.d.ts`）、WORLD vendored `vendor/world/`（含许可证与构建脚本）、试听元音表进仓 `assets/preview/`——日 / 中 / 英三首逐样本与改前相同，且拿掉 `dev-assets/` 照样唱；④ 已做（设置里显示月读的署名块和四条禁止用途）。⑤ PWA 壳已做（2026-10-07，抄 JustReadBooks）：content-hash 三个 bundle（`scripts/build.sh`，worker 文件名 `--define` 进主 bundle），styles.css 按内容哈希写成 `styles.css?v=<哈希>`、哈希也 `--define` 进主 bundle（不然 iPad 会拿新 bundle 配旧样式表）、`service-worker.js`（缓存前缀 `moonsinger-`，不碰 `pwa-models` / 兄弟 app）、`src/app/pwa-shell.ts`（四路更新检测，顶上「有新版本 · 刷新」，设置里「检查更新」「清缓存重启」）、`manifest.webmanifest`、`icon.svg`（占位，待 user 过目）+ png；`npm run smoke` = 真浏览器 + 真 SW 冒烟（装上 / 断网 / 新部署出提示 / 清缓存只清自己的）；部署 `.github/workflows/deploy.yml`（main → /dev/、prod → /，dist 进 git）；版本 `./bump.sh vX.Y.Z-YYYY-MM-DD`。⑥ 公开前隐私分拣已做、已公开（2026-10-07，见下「git」节）。
- **唱法核心有两个用户**：本仓的浏览器 worker + 写歌实验室的 Lab 命令行（`../20260810 写歌实验室/Lab/20261005 月读第一首/sing.mjs`）。改 `sing-core.mjs` 的接口要顾到那边；动实验室的 `Lab/20261005 月读第一首/` 之前先 SendMessage 打招呼（约定原文在抽取提案文末）。源码注释里写的「Lab/…」都指写歌实验室仓。

## 黄线区（外接服务白名单）
**模型源** = 家族级白名单 ②（出厂预填 `https://fangzhangmnm.github.io/pwa-models`，同 JustReadBooks）：只读 GET 包的分片，到手先对 app 内嵌清单的 sha256（`@internal/model-packs`）；第一次整首唱才下（重资源等有意图）。user 2026-10-07「当然a」（月读照家规进 pwa-models）。
**反弃坑（ADR-0006 ③；user 2026-10-07「i might worry about hardcode my gh link…」）**：查找顺序 = 同源 `pwa-models/`（自建服务器把模型仓拷过去就能用）→ 设置里的「模型来源」（界面上能改、恢复默认）；设置里还能「从本机文件导入模型包」（按内容哈希认分片）。来源只在这次打开里有效（持久化未定）。全家族检查交接 = 家族根 `ai-docs/20261007-anti-abandonware-audit-handoff.md`。
除此之外 MoonSinger 不接任何第三方网络服务（试听元音表、JS 胶水、WORLD 都随 app 同源出货）。

## 红线（本仓重申）

- **扒谱/听感类判断 AI 会伪自信**（mp32sheet 战例）：音色像不像、谱对不对，一律人类耳朵裁决，AI 不许报确信。
- **AI 不许拿测量下听感结论**（家族 memory「AI 不许听」）：测量只查代码对不对，好不好听归 user 耳朵。
- `ai-docs/` = AI 笔记本：how-doc 文件名 `yyyymmdd-name.md` + 正文 `> as-of` 戳（家规）。

## git

- **2026-10-07 公开（公开工坊道，同 CatsUp）**：user「建，readme里面记得留链接。」→ `github` = https://github.com/fangzhangmnm/moonsinger （公开；开发版 https://fangzhangmnm.github.io/moonsinger/dev/ ），`origin` = OneDrive 私有远端（另有 `pre-scrub-20261007` 分支 = 隐私洗前的历史，**永不推 github**）。公开前隐私分拣与 user 裁决原话记在写歌实验室仓（私有）。
- push main（→ /dev/）照常；**push prod 必问 user**（家规 #5）。prod 分支还没有时，部署把根目录放一页「正式版还没上线，去开发版」。
- 许可证：本仓代码与文档 MIT（同 WeebPaint / CatsUp）；`vendor/` 各自许可证；`assets/preview/` 是月读的声音，按つくよみちゃん 条款（README「许可证」节）。
