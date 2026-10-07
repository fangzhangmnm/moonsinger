# 持久化交接（给接手做 store / gallery 的 agent）

> created 20261007 by Claude Opus 5.5 · as-of v0.2.25 / 2026-10-07（dev 已上线 https://fangzhangmnm.github.io/moonsinger/dev/ ，commit 46f6a88；prod 分支还不存在、没推）
> user 2026-10-07：「我待会要compact一下然后换fable做持久化，你还有什么要记录的都记录一下。」
> 这份只写事实和指针；「我看到的、要想的」那一节全部**未经 user 定**。

## 0. 起手先读（家规）
- 家规硬规则 #1：动 storage / sync / service-worker / gallery 之前必读 `../20260601 MyPWAPatterns/docs/MASTER.md`（§A 红线）。云同步只准走 `@internal/store` 的 `createStore()`；用了 store 就不许直接碰 localStorage / IndexedDB / 云端。
- 文件管理界面归 `@internal/gallery`，app 不手写；gallery 是前端，数据事实（夹里有什么、身份变更、云端可达）归 store（家族 memory：feedback_gallery_owns_file_management_ui、feedback_frontend_vs_store_split）。
- store 持久化结构（localStorage / IDB 任何结构、新字段）改动要 user 显式同意；内部库只 bump patch，minor 先问。
- 持久化向后兼容照 CatsUp 立宪：每个子结构独立版本号、迁移全住 `src/format/migrate/`、冻结旧样本、老文件永远能开、只拒开比 app 新的（CatsUp `ai-docs/20260919-persistence-data-contract.md` §7）。
- 本仓：`CLAUDE.md`「编辑器 v0」节；数据契约草稿 `ai-docs/20261007-data-contract-draft.md`（§1 三层「谱 / 休息室 / 录音房」、§3 .mxl 目录表、§6⅓ 角色 = 官方乐器语义、§6½ 贴纸 + 封面、§6¾ 纸、§7 未定）；每个版本的 user 原话在 `ai-docs/20261006-editor-v0-grill.md`。

## 1. 现状：无地逃生口（一首歌 = 一个 .mxl）
- user 2026-10-07「先不急着store。可以先按照无地规范导入导出做逃生口」→ 现在没有 store、没有 gallery、app 不碰 localStorage / IndexedDB（只有模型包走 `@internal/model-packs` 的 Cache Storage `pwa-models`）。
- 代码：
  - `src/format/xml.ts` 零依赖 XML；`src/format/musicxml.ts` token ↔ MusicXML 4.0；`src/format/project.ts` .mxl 打包（vendored `fflate`）。
  - `src/app/doc-file.ts`：桌面 Chromium 有文件句柄 = 存回原文件；iPad / Safari = 存是下载 / 分享、开是选文件。`src/app/names.ts`：`defaultStem()` = `yyyymmdd-hex4`、`fileSafe()`（注释写了接 gallery 时换 `@internal/gallery` 的 `galleryDefaultName`）。
  - `src/app/main.ts` 的 `doc` = `{ stem, named, handle, extras, saved: { song, quality, role } }`；`dirty()` = 谱 / 音质（上场的候选）/ 角色名变了；`docName()` = 没存过「年月日-歌名」（没歌名 = stem），存过 / 打开的 / 改过名的（`named`）= stem；`markSaved()` 把名字定下来；换歌先问（`confirmDiscard`）；关页面 = 浏览器挽留框；文件菜单「改文件名…」（有句柄的：浏览器没法改名，下次「存」按新名字另存）。
- 写进 MusicXML 的（别的软件也认）：调号 / 拍号 / 速度、音符（`id`）、休止、歌词（每音节 `xml:lang`；一个音几个字 = `<elision/>`，数据里 U+203F「‿」）、`<work-title>` 歌名、`<creator type="composer" / "lyricist">` 作词作曲、`<defaults>` 纸（A4 / A5 / A6，五线谱高 7 mm）、`<part-name>` 角色名（同名同种带号）、`<instrument-sound>` 角色的官方乐器语义（`src/score/roles.ts`）、`<virtual-instrument>` 上场的候选（MoonSinger / tsukuyomi）。小节按拍号自动切，人插的小节线记在 score.json。样本过了 W3C MusicXML 4.0 XSD（手动跑的，见 §5）。
- `.moonsinger/` 里已经有的（都是第 1 版，`FORMAT = { manifest: 1, score: 1, lounge: 1, studio: 1 }`）：`manifest.json`、`score.json`（声部 → 角色 / 麦克风、人插的小节线、还没写音高的音）、`lounge/r1.json`（角色快照：名字、sound、候选 c1 月读完整 / c2 月读元音、上场的是谁、哼的字）、`studio.json`（麦克风 m1）。比 app 新的版本 = 拒开、报出来；不认识的文件 / 多出来的 rootfile 原样写回。
- 还没做的（数据契约里留了位置）：`curves.json`（曲线）、`shelf/`（谱架上的曲段草稿）、`attachments/`（贴纸 / 封面）。还没有 `src/format/migrate/`（都还是第 1 版）。
- 单声部：P1 → 角色 r1 → 麦克风 m1。别的软件的谱只读第一个声部、第二段歌词起不读（报出来，存回去会丢 → 第一次存走另存为）；原来的乐器这一版没有 = 没人上场（Quality none，不自动替补）。
- 测试：`test/format.test.ts`（往返、mimetype、不认识的原样写回、新版本拒开、别家文件）、`test/paper.test.ts`（纸 + 作词作曲）、`test/lyrics.test.ts`（elision 往返）、`test/roles.test.ts`；`npm run smoke` 的 file-smoke 14 条（真浏览器：默认名、•、填歌名、存 = 年月日-歌名、打开先问、逐 token 往返、别家谱报错 + 不出声 + 选角）。

## 2. 只在这次打开里有效的（还没持久化；是设备 / 视图状态，不进歌）
- pad：「1=」inputFifths、调式 inputScale、长短基线 unit / 连音、行数 / 列数 / 首调·绝对、音域窗口（换歌时「1=」和调式保留——`main.ts loadDoc`，user「把pad想成一个独立的medo式的输入设备」）。
- 自动小节线开关 `autoBars`、纸放不下时折不折行 `reflow`、pad 收起 / 弹出、模型来源 `modelSource`（反弃坑 ADR-0006：界面上能改、恢复默认）。
- 这些跟设备走还是跟人走、要不要存，user 没定；动之前问（store 持久化改动要显式同意）。

## 3. user 关于存档 / 名字已经说过的（原话）
- 「先不急着store。可以先按照无地规范导入导出做逃生口」；「毕业差的东西做，不毕业没法接gallery做存档哦」（已毕业公开）。
- 数据契约：「好，不过还是可以有多个曲段方便写长曲子」「先这样？之后遇到问题累在吃书吧？」。
- 文件名：「纸张的最上面加一个可选的歌名吧，未来也是文件名，用同样的yyyymmdd hash的默认规范」→「用歌名可以，然后也要yyyymmdd规则。之后各管各的同意，但是要有改文件名的规则？但是纸的歌名是章节名啊，我还是在纠结」→ 用三层模型讲清后确认（§6¾）：纸只属于谱层；主纸 = 整首歌（曲段靠段落记号分界）；谱架上每个曲段 = 单独小纸；文件名 / 歌名 / 曲段名各归文件 / 主纸 / 谱架小纸；歌本 = 文件夹（不是一个文件放几首）。
- 纸：「嗯A4 A5 A6三种，可以定」「默认A5同意」「非打印的时候不用断页」；贴纸 + 封面：「贴纸同意…可以类似webxiaoheiwu一样可以设置成封面的引用。但是我们也可以单独设置封面，不一定要上乐谱纸」。
- 角色：「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西…这个就是我那个窄接口要拦的」「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的」「不应跟是乐器name salad，而是功能选…而且应该是下拉选」。

## 4. 接 store / gallery 时我看到要想的（未经 user 定）
- 身份与名字：store 的用词是 identifier / folder / stem / suffix / kind（`docKinds` 表要登记 .mxl）；现在 `doc.stem / named / handle` 的语义在 main.ts，接上后改名应走 gallery / store 的 rename，`names.ts` 换 `galleryDefaultName`。
- OneDrive：新站点 `https://fangzhangmnm.github.io/moonsinger/`（和 `/dev/`）的 redirect URI 要在 Azure 注册里加——user 操作；家规 #6 AppFolder scope、#7 personal only（authority = consumers，翻注册和改 authority 成对做）。
- 图库卡片的缩略图 / 封面：WXHW ADR-0012（`Thumbnails/thumbnail.png` + 出处字段）是先例；.mxl 容器能放额外文件；没有图片的歌卡片上画什么（第一行谱？歌名？）要问。
- 撤销还没有（CatsUp A1 正规 undo 是先例）；和持久化谁先、怎么配合归 user。
- 第一次改 `.moonsinger/` 结构时：照 CatsUp 立宪开 `src/format/migrate/` + 冻结第 1 版样本（现在仓里只有 `test/fixtures/twinkle.musicxml` 一个别家样本，没有冻结的自家样本）。
- 多声部（数据契约第 3 题已定：小节线做对齐点）还没做；同名编号 `numberParts` 已经在 `<part-name>` 上生效。

## 5. 本轮踩过的坑 / 工具
- iPad 拿到新 bundle 配旧样式表（Pages 给 `max-age=600`）→ `scripts/build.sh` 给 `styles.css` 和 `vendor/internal-css/*.css` 按内容加 `?v=<哈希>`，哈希也 `--define` 进主 bundle（样式一改离线壳换缓存）；`service-worker.js` 取缓存 ignoreSearch，不用改。
- 收 `@internal/workbench-elements`（notice / toast）用它的 `scripts/pull-package.sh`；包的 CSS 要手动拷进 `vendor/internal-css/`（同 CatsUp）。
- MusicXML schema 校验：没进仓。做法 = 从 github.com/w3c/musicxml 取 `schema/musicxml.xsd`（+ xlink.xsd、xml.xsd），用 Python lxml `XMLSchema` 验存出来的 `score.musicxml`；注意 `<encoding-date>` 要是真日期。建议接手时做成测试或脚本（xsd 按家规 vendor / 检疫桶）。
- Playwright 合成指针事件下 score-view 的 `setPointerCapture` 会报错（真手指不会）——测试里的噪音，不是 bug。

## 6. 开着的（不是持久化，别丢）
- 真机零：v0.2.x 的手感（旋钮原地滚、/2 和升降键的 Shift 逻辑、五线谱像文本框、纸、窄屏让位、iPad 布局）都没上过真机。
- 愿望单 `ai-docs/20261007-wishlist.md`：简谱模式（纸张设置里切、首调；A6 童书 / 卡片要）、贴纸、谱架、PDF 分享。
- pad「收起」是文字，图标库没有收起键盘图标，没登记（user 没要）。
- prod 没推（user 被问时答「1」= 先不推）。
- JRB 换共享音色包（任务 #15）是 JRB session 的活。
