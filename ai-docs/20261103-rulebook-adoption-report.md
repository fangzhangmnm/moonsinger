# 工单 A 验收报告：MoonSinger 上 itch + 备用版 + 模型包读出重核

> created 20261103 by Claude Opus 5.5 · as-of v0.14.15 / 2026-11-03（A2、A3、H 三节在文末）
> 工单 = 家族根 `ai-docs/20261103-work-orders.md`「工单 A」；规则书 = 家族根 `ai-docs/20261103-three-shapes-rulebook.md`。
> **prod / itch 都没推，dev 也没推**（原因见 §4 第 ③ 条）。所有 commit 都在本仓 main 本地 + 库仓本地。

## 1. 做了什么（commit 一行一个）

本仓（`20261006 MoonSinger`，main 本地）：

| commit | 内容 |
|---|---|
| `c0690c4` | 第 1–2 步：`src/deployment.ts` + `src/deployment-policy.ts` + `config.ts SITE_URL / REPORT_URL` + `src/persistence.ts`（availability / health）+ `src/app/site-hint.ts`（开局一行、灰入口副标题）；itch / 备用版不载 MSAL、不注册离线壳、云入口画灰；守卫 `test/deployment.test.mjs` |
| `fb60991` | 第 4 步收货：`@internal/model-packs` 0.1.1；小月相 worker 碰到 `pack-corrupt` 说人话 |
| `a9f65c3` | 第 5 步：命名空间守卫 `test/namespace.test.mjs`（核查表在下面 §2 第 2 项，现有名字全带前缀，没有要改的） |
| `d6b7c20` | 第 3、6 步：`scripts/pack-itch.mjs` + `scripts/push-itch.sh` + `scripts/pack-site.mjs` + `tools/itch-fixture.mjs` |
| `8fd990a` | 第 7 步 + v0.14.12：`src/resources.ts` + `src/threads.ts` + `scripts/pack-local.mjs` + `tools/local-smoke.mjs` + 守卫 `test/local-files.test.mjs`；读口 / 线程收编；dist 重打 |
| （本报告那一笔） | 删掉没人用的 `resources.cacheable()`（第 13 项）+ 本报告 |

库仓（`20261007 internal-model-packs`，main 本地 + 本地 tag `v0.1.1`，**没推远端、没建 gh release**）：

| commit | 内容 |
|---|---|
| `dac1a5a` | `@internal/model-packs` 0.1.1（patch）：`chunks()` 交出去前逐片重核 sha256；测试 +4（0.1.0 上 3 条红） |

## 2. 规则书 §4 检查表逐项

| # | 项 | 结果 | 证据 |
|---|---|---|---|
| 1 | 自家前缀 token | ✓ | `src/config.ts:20` `APP_DB_PREFIX = "moonsinger-5b1e7c0a92d34f6e."`、`src/device-kv.ts:9` 同一个 GUID（`test/factory-reset.test.ts` 守两处一致） |
| 2 | 所有存储名带前缀 | ✓（有一个问题留给 Fable，见 §4 ⑤） | 守卫 `test/namespace.test.mjs`（反证：塞进 `"speech"` / `caches.open("shell-v1")` → 红）。核查表见下 |
| 3 ★ | `deployment.ts` 叶子 + 别处不许看 | ✓ | `src/deployment.ts:17/26/34`；守卫 `test/deployment.test.mjs`「别处一行都没有」（反证：把旧的 `window.self === window.top` 和 `location.protocol === "file:"` 塞回去 → 4 条红）；`doc-file.ts:30-31` 改用 `embedded()` |
| 4 ★ | `deployment-policy.ts` = §2 表、单测钉死、每个开关有消费者 | ✓ | `src/deployment-policy.ts:22-25`；单测逐格 + 键集合（`test/deployment.test.mjs`）；消费者守卫（接线前 3 条红、接线后绿）。§2 里本 app 用不上的两列（文件夹图库、记住口令）不进来——进来就是没人读的假开关，理由写在文件头 |
| 5 | 网盘入口灰 +「去官网」；itch / 备用版不载 MSAL、不 initAuth | ✓ | `src/app-store.ts:21`（网盘关着时 `initAuth / signIn / retrySilentSignIn` 不碰 MSAL）、`main.ts:2843`（不起登录探测）、`main.ts:3301`（不认 OAuth 回跳）、`gallery-host.ts:76`（云钮 disabled + 「网盘在官网」链接）；另外七处「登录后同步到 OneDrive」的字按开关换了说法。itch 夹具：「网络里没有 MSAL」✓、「网盘按钮灰着」✓、「链到 SITE_URL」✓。**反证**：把 itch 的网盘开关翻开重打 → 3 条红（抓到请求 `vendor/msal/msal-browser.min.js`） |
| 6 ★ | 记住口令按 §2 | 不适用 | MoonSinger 不加密、没有口令 |
| 7 ★ | 崩溃影子 at-rest 字节 = 保存字节 | 不适用（这轮没动） | 没图库时没有影子（规则书现状栏原样） |
| 8 | 资源读出重核哈希 | ✓ | 库：`20261007 internal-model-packs/src/pack-store.ts:208-228`（读出逐片重核、对不上作废那一片和章、报 `pack-corrupt`；同一个实例核一次就记住 Blob）；测试 `test/pack-store.test.ts`「读出来重核（0.1.1）」4 条，0.1.0 上 3 条红。**开销**：小月相 5 包 69.4 MB 核一遍 383–464 ms（node 同款 V8，桌面），每个 worker 只核一次；iPad 没量。备用版：`src/resources.ts:62-73`（解码后核哈希才交出），烟测「给错的哈希 = 不交」✓ |
| 9 | itch 夹具 | ✓ 17 过 0 红 | `tools/itch-fixture.mjs`（外页 `localhost` 跨站套 `127.0.0.1`）：资源从 zip 那份同站点读（小月相真唱一句：4 个分片 200、没去 GitHub）、后台线程起、出声线程起、GM 音源同站点读哈希对、存 = 下载 `.mxl`、网盘灰 + 去官网、没有 MSAL、没联外网、没有页面错误。**脏文档关页 beforeunload：跨站 iframe 里弹了**（对照：同一个包顶层打开也弹）。⚠ 「没注册离线壳」那一条在本机地址上判别不出来（`pwa-shell` 本来就跳过 localhost），真正挡住它的是 `pwa-shell.ts:94` + 消费者守卫 |
| 10 | 「去官网」/「没测过 + 报告入口」文案 | ✓ | `src/app/site-hint.ts:16-18`（一张表、`SITE_URL` / `REPORT_URL` 插值；本 app 没有 i18n 层，界面只有中文，这组字住这一张表）；位置 = 开局一行（家族 notice，非模态、一页一次，带「去官网」钮）+ 歌库云钮旁的副标题；夹具 / 烟测里都核了文字和链接 |
| 11 | zip 双击能开（备用版） | ✓ 21 过 0 红 | `tools/local-smoke.mjs`（file://、无头、默认启动参数）：不白屏、认成备用版、开局一行、五个线程都按 data: → blob: 起、出声线程 data: 起、mp3 线程 data: 起且编出来了、经 `.data.js` 读文件核哈希、错哈希不交、读完键立刻 delete、小月相真唱（录音房里有块 + worker 有 WASM 堆）、排版线程没掉回主线程、存 = 下载、缩放跨刷新还在、歌库网盘灰 + 去官网、整场没联网；**模拟不给存储**（Chromium 里让 localStorage 抛 SecurityError 演 Safari）：不白屏、availability = unavailable、「没测过 + 存不住 + 报告入口」+「报告问题」钮、歌库画灰 |
| 12 | zip 上限 + 推 itch 守卫 | ✓ | itch 版 87 个文件 · 129.3 MB · 最大 32.3 MB；备用版 97 个文件 · 194.3 MB · 最大 33.6 MB（`scripts/pack-site.mjs selfCheck`）。`scripts/push-itch.sh`：HEAD 的 tree 必须 = prod 的 tree（本仓推 prod 用空合并 commit，sha 不同、tree 相同，所以比 tree）+ 站点文件没有未提交改动 |
| 13 ★ | 一次做全 | ✓ | 三个开关都有消费者（守卫）；availability 是真探出来的（device-kv 开局探一次、写不进降级）；`threads.ts` 起不来有真听众（`main.ts` 说一声 + 黑匣子）；新深模块每个导出都核过有人用（`resources.cacheable()` 没人用，已删）。备用版清单守卫 `test/local-files.test.mjs`：源码里按站点根读的路径都得在清单里（反证：删掉 `lame.wasm` → 红） |

**第 2 项核查表**（名字 · 文件:行 · 前缀）：

| 名字 | 是什么 | 文件:行 | 前缀 |
|---|---|---|---|
| `moonsinger-5b1e7c0a92d34f6e:<键>`（storeAttached / gallery-folder / last-scene / last-doc / zoom / midi-chip-hidden / 黑匣子） | localStorage | `src/device-kv.ts:9` | ✓ 完整 token |
| `moonsinger-5b1e7c0a92d34f6e.gallery-registry` | IDB（图库包的注册表，本 app 不用） | `src/gallery-host.ts:11` | ✓ 完整 token |
| `moonsinger.defaultStore` / `.staging` + localStorage `moonsinger.defaultStore.*` | store 自己的库 | `config.ts:5` APP_ID → store `create-store.js:89` | ✓（store 命名空间，工单写明算 ✓） |
| `moonsinger-thumbs` / `moonsinger-facts` | IDB（图库包派生缓存） | `src/gallery-host.ts:58 / 54` | ✓ app 前缀，**不带 GUID** |
| `moonsinger-speech` | IDB（念缓存，住在 worker 里） | `src/singer/worker.ts:143` | ✓ app 前缀，**不带 GUID** |
| `moonsinger-<hash>` / `moonsinger-boot` | Cache Storage（离线壳） | `service-worker.js:24 / 53` | ✓ app 前缀；itch / 备用版不注册 |
| `pwa-models` | Cache Storage（家族共用，库里） | 库 `pack-store.ts:49` | ✓ 家族批过的共用仓 |
| `pwa-sounds` | Cache Storage（家族共用） | `src/gm/sound-cache.ts:7` | ✓ 家族批过的共用仓 |
| service worker scope `./` | 离线壳 | `src/app/pwa-shell.ts:98` | 官网自家域名；itch / 备用版不注册 |
| MSAL 的 token 缓存（`msal.*` 等） | localStorage（MSAL 自己起名） | `vendor/msal/` | ✗ 不带前缀 → **只在官网载**；itch / 备用版不载（本工单第 2 步），共用存储里不会出现 |
| `navigator.locks` / `BroadcastChannel` | — | 本仓源码和家族库里都没有 | — |

## 3. 没做、做不了的 + 为什么

- **Safari 不实测**（工单写明不做）：「存不住」那一句是在 Chromium 里模拟出来测的；data: 起不来换 blob: 的那条路在 Chromium 上走不到（data: 本来就起得来），也没测。
- **备用版在真浏览器里双击时「存」是系统保存框**（桌面 Chromium 在 file:// 下有，存了就是一个文件、以后 Ctrl+S 写回）；无头点不了那个框，烟测把它拿掉、测的是「存 = 下载」那条路。
- ~~**备用版的念缓存存不住**：线程是 data: 起的（origin 为 null），每次打开第一遍要重念（设置页那一行如实说了）。~~ **A2 更正**：Chromium 双击打开实测存得住——data: 起的线程的 IndexedDB 落在 file:// 那个共用桶里，唱一句、刷新，念缓存还在（3 条 / 300 KB 原样）。设置页那句改成只在真存不住时显示。
- **itch 上的 MIDI / 剪贴板给不给**：没测（要真 itch 页 + 真浏览器）。
- **库仓没推远端、没建 gh release**：MoonSinger 走的是库仓本地产物（收货脚本的离线后备路，tag 在）。JRB（工单 E）在同一台机器上收货也能用这条路；要不要推库仓 + 建 release，等一句话。
- **`test/e2e/sync.mjs` 没改**：它对着现在的源码会卡住（见 §4 ③），那是同步那一块的期望要改，归 Fable。

## 4. 卡门的（等 user / Fable，人话）

① **推正式版（等 user 一句话）**：开发版现在的代码要先上正式版，itch 才能跟着推（itch 只跟正式版走）。推了 = 正式版从 v0.12.25 一下子跳到 v0.14.12（中间两个多礼拜的改动全上）；不推 = itch 版也上不去。

② **备用版的压缩包放哪（等 user）**：两个地方可选——itch 页上的「可下载」条目（和「浏览器里玩」放在同一个页面，下载的人一眼看到），或者 GitHub 的 release 页（开源的人习惯去那儿找）。不定的话备用版就只在这台电脑上，别人拿不到。

③ **开发版其实一直停在 v0.14.8（发现的，等 Fable / user）**：10-26 那三版（收同步库 2.2.1 / 2.2.2、图库 0.8.8 / 0.8.10、登录后「去处理」）当时只提交了源码，没重新打包，所以网上的开发版一直是 10-21 的 v0.14.8——那几个同步方面的修补从没上过线，user 平时用的开发版里也没有。当时记的「同步测试 43/43 绿」是对着旧包跑的；对着现在的源码，那个测试会卡在登录后的「去处理」面上（它还只认旧的「传上去」按钮）。这一版（v0.14.12）重新打包了，所以**一推开发版，这三版同步改动就是第一次上线**，而同步测试现在过不了（不是这次改坏的：工单开始前的源码一样会卡）。所以我**没推开发版**。要拍的：先让 Fable 把同步测试按「去处理」流程改好、跑绿再推开发版，还是现在就推（user 自己先在开发版上用）。

④ **itch 版和备用版里的「歌库」只存在浏览器里（规则书第 1 条，等 Fable）**：工单让网盘入口画灰，歌库本身照常能用——可是在这两种形态里歌库的歌只有浏览器里那一份（itch 上还是和所有 itch 游戏共用的那个存储），这和规则书第 1 条「作品的正本永远在浏览器外」对不上（官网没登录时其实也是这样，不是新问题）。选一：照现在（能用，靠「存」下载成文件兜底）；或者这两种形态把歌库也画灰、只留「存 = 下载 / 开 = 选文件」。

⑤ **三个派生缓存库的名字只带了 app 名、没带那串 GUID（等 Fable）**：`moonsinger-speech` / `moonsinger-thumbs` / `moonsinger-facts`。家族规矩里 `<app>-…` 就算自家的，所以我判 ✓、没改；要是要统一成 `moonsinger-5b1e7c0a92d34f6e.speech` 这种，改名会让大家的念缓存（最多 512 MB）和封面缓存重来一遍（都能重新生成，不丢东西）。

## 5. Fable 要看的 diff

1. **信任根两段**：
   - 库 `dac1a5a`：`20261007 internal-model-packs/src/pack-store.ts` 的 `chunks()`（第 208–228 行）+ `verifiedBlobs` / `forget`（第 64–66 行、`putChunk` / `dropIfStale` / `deletePack` 里各一行）。
   - 本仓 `8fd990a`：`src/resources.ts` 第 46–73 行（插老实脚本 → 取字符串立刻 delete → 解码 → 大小 + sha256 对上才交出；哈希优先用调用者给的 app 钉死的那个）；`src/singer/worker.ts` 第 81–88、96–106、116–117 行（备用版里模型包分片向主线程要、带上清单里的 sha256）+ `src/singer/client.ts` 第 70–76 行 `need` 那一段（主线程按那个 sha256 核）。
2. **policy 单测 + 消费者守卫**：`test/deployment.test.mjs` 全文；`src/deployment-policy.ts` 全文。
3. **新守卫**：`test/deployment.test.mjs`、`test/namespace.test.mjs`、`test/local-files.test.mjs`；`tools/itch-fixture.mjs`、`tools/local-smoke.mjs`（「唱起来了」= 录音房有块 + worker 有 WASM 堆：之前只看走带位置会假过，备用版上真抓到过一次）。
4. **网盘关着不碰 MSAL**：`src/app-store.ts` 第 17–27 行。
5. **验收**：本报告 §2。

## 6. 真机项（攒批，不催 user）

- iPad Edge 打开 itch 页：能不能出声、小月相唱一首（模型从 zip 下）、存 = 下载 `.mxl`、关页挽留弹不弹、MIDI 给不给。
- Windows 上双击备用版的 `index.html`（Chrome / Edge）：唱一首、存（系统保存框）、重开后缩放还在。
- 模型包读出重核在 iPad 上多花多久（桌面约 0.4 s）。

## 7. 新图标需求

无（灰入口用现有的云图标 + 文字；「检查更新」「导入模型包」画灰用现有图标）。

---

## A2：Fable 裁定之后续做（2026-11-03，v0.14.13）

Fable 审过 A（信任根两段、policy 单测、两条守卫都过），对五道门裁定：① 推 prod 等 user（Fable 会建议先推 dev 用几天）；② 备用版放哪等 user，脚本准备到一条命令；③ sync.mjs 我来改、断言不许动、加「dist 没重打」守卫，跑绿后推 dev；④ itch / 备用版歌库画灰；⑤ 三个缓存库改名、不搬、老库探删。

### A2.1 做了什么

| commit | 内容 |
|---|---|
| `ab75508` | v0.14.13：④ ⑤ ③ ②（下面逐条） |
| （本节那一笔） | 报告 A2 节 |

### A2.2 ③ `test/e2e/sync.mjs`：动过的地方（断言一行没动）

核对办法：把改前 / 改后两份里所有 `check(` / `gap(` 行抽出来 diff = 一字不差。

| 位置 | 改了什么 | 断言动没动 |
|---|---|---|
| 登录助手 `signIn` | 原来等「传上去」钮、点了 = 批量推。现在：问句一出现（认「去处理」钮）就记 `asked`，点场景指定的那个钮（默认「暂不」）；没问句 = 什么都不点 | 没动 |
| 场景③「推到一半页面死掉 → 回来登录」 | `signIn(A)` → `signIn(A, "去处理")` + 点这首卡片上的「处理…」（新流程设计的那条路） | 没动。**结果：「登录后补推：自愈（云端字节 = 本地字节），不弹冲突面、脏标清了」红**（见 A2.3） |
| 场景③ 之后 | 新增两步让后面的场景接着跑：面开着就选「本地覆盖云端」（两边本来一样），再点卡片回到这首 | 没动 |
| 场景⑥「离线改了、对面推了、回来登录」 | `reloadAndSignIn(B)` → `reloadAndSignIn(B, "暂不")` | 没动；但要说清：它原来测的是「登录后批量推撞真分叉、不弹面、留脏」，v0.14.10 起登录后不再批量推，这条路已经不存在；现在同一组断言测的是「答暂不 = 不推、不弹、留脏」 |
| 两条断言的说明文字 | 还是旧说法（「现在传吗？」「pushAll」）——按「断言不动」没改，要改字 Fable 说一声 | 没动 |

结果：43 条里过 42 条（单跑、并行都一样）。整套 E2E：68 过 · 1 红（就是这条）· `playhead` 并行红单跑绿（负载）。

### A2.3 那一条红：库那一层的问题（交 Fable）

场景③：上传落了地、回执没回来、页面重开、再登录。核过 **云端字节 = 本机字节**（sha256 都是 `40c8770c5f439f89…`）。新流程下三条界面路都不能悄悄自愈：

- **去处理 → 卡片上「处理…」**：弹库的面「云端有新版本——在云端和本机各有一版新改动」（云端覆盖本地 / 本地覆盖云端 / 取消）。两边一模一样，这句是假话（UX 误导 = 数据安全缺陷那一类）。
- **去处理之后什么都不点**：进歌库并不会替这首推（编辑器里这首是干净的，脏的是同步库那一层），它就挂在「要处理的」里。
- **暂不 → 按「存」**：「存」会先重存一次（时间戳走字）再推，字节已经和云端那份不一样了 → 也弹同一个面。

10-26 以前（v0.14.8 那份包）登录后是批量推：批量推不重存，按字节一比、自己就好了，所以当时这条是绿的。v0.14.10 把批量推撤了，这条自愈也一起没了。改法要动库（「处理…」这一步先比字节）或者 app 的登录流程，两样都是同步 / 数据安全那块，我没动。**所以 dev 没推**（Fable 的条件是跑绿再推）。

### A2.4 ③ 防再犯：dist 新鲜度守卫

- `scripts/build.sh` 末尾调 `scripts/source-stamp.mjs --write`：把进 bundle 的输入（`src/`、`vendor-pkgs/`、`package-lock.json`、`styles.css`、`vendor/internal-css`、`vendor/fflate|vue|upng`、`scripts/build.sh`、`scripts/core-hash.mjs`）的 git blob 哈希合成指纹，连同版本号、主 bundle 名写进 `dist/build-stamp.json`。
- `test/dist-fresh.test.mjs`（在 `npm test` 里）只看 HEAD：HEAD 的戳 = HEAD 那些输入的指纹；HEAD 的 index.html 指着的主 bundle 在 HEAD 里、里面的版本号 = HEAD 的 `src/version.ts`。改着没提交、打了包没提交都不红；**源码提交了、dist 没重打 = 红**。
- 反证：临时分支上只改 `src/score/scales.ts` 一行就提交 → 红（「源码指纹对不上」），分支已删。

### A2.5 ④ itch / 备用版的歌库画灰

- `src/deployment-policy.ts` 加本 app 自己的键 `library`（site true / itch false / local false），`test/deployment.test.mjs` 逐格 + 消费者守卫自然盖住。
- 消费者：`main.ts` 歌库钮（灰 + 点了一行「歌库只在官网版里有（sing.weebpaint.com）：这里的歌没有浏览器外的家——『存』= 下载成 .mxl 文件，『打开』= 选文件」+「去官网」钮）、开局不进歌库、`ensureAttached` 再挡一道（万一别的路走到也不建库）。文案在 `site-hint.ts`（`libSiteTitle`，`SITE_URL` 插值）。
- 夹具：itch 18/0、备用版 23/0，新加三条：歌库钮灰、点了那一行 +「去官网」且不进歌库、**没建 store 的 IndexedDB**（只看得到 `…speech` 念缓存库）。
- 官网没登录时歌库只在浏览器里：按 Fable 说的这轮没动。

### A2.6 ⑤ 三个派生缓存库改名

- 名字唯一来源 = `src/config.ts`：`APP_NS = "moonsinger-5b1e7c0a92d34f6e"`、`CACHE_DBS = { thumbs, facts, speech } = "<APP_NS>.<用途>"`、`LEGACY_CACHE_DBS` = 三个老名字。建库处（`gallery-host.ts`、`singer/worker.ts`）都引它。
- 老库：`factory-reset.ts dropLegacyCacheDbs()`——照 WeebPaint `_openLegacyIfExists`：无版本号 open，不在就触发 oldVersion 0 的升级、当场 abort（不建）；在 = 关掉再删，被别的标签页占着 = 这次算没删成、下次再来。`main.ts` 在空闲片里一页一次调；删了就进黑匣子 + 提示一次「念缓存和封面缓存换了新名字，会重新生成一次（歌不受影响）」。还原出厂也清老名字（有才删）。不搬。
- E2E `test/e2e/legacy-dbs.mjs`（登记在 store 区）6/6：没有老库时一个老名字都不会被建出来；造三个老库 + 一个别人的库 → 重开、空闲 → 三个老库没了、别人的还在、黑匣子记着；再开不会重新长出来。
- 跟着改的守卫（强度不变，都是「钉住名字」从老名字钉到新名字）：`store-wiring.test.mjs`（钉 `THUMB_DB = CACHE_DBS.thumbs` + `CACHE_DBS.thumbs` 就是 `moonsinger-5b1e7c0a92d34f6e.thumbs`）、`factory-reset.test.ts`（钉建库处引 `CACHE_DBS`、`OWN_DBS` = 它、都在 GUID 前缀下、老名字就是那三个）、`namespace.test.mjs`（模板里的 `${APP_NS}` 代回去再认 + `CACHE_DBS` 逐个认）、`storage-whitelist.test.mjs`（只改了说明文字）。
- 披露：commit 说明 + 本仓 CLAUDE.md + 上面那句提示。

### A2.7 ② 备用版推送脚本（写好、没执行）

`bash scripts/push-local.sh [vX.Y.Z] [--only=itch|github]`：跟 prod 守卫（比 tree）→ 打备用版 + 跑烟测（红就停）→ `.local-build/MoonSinger-<版本>.zip` → butler 推 itch `local` 下载条目（首推后 itch 后台这一条**不勾**「在浏览器里玩」）→ GitHub release `<版本>`（--target prod）挂 zip，已有就补传。要 user 先做一次：`tools/butler/butler login`、`gh auth login`（应该都登过）。

### A2.8 还卡着的（人话）

1. **同步测试那一条红（等 store 2.2.3）**：Fable 认定是库层缺口——store `file.resolve()` 算出「两边都改了」就直接弹面，没先走 push 路上那条「拉云端比字节、相等就认领」的自愈。修法 = resolve() 先比字节、一样就认领（2.2.3 patch，要 user 点头，Fable 做）；出包后收包、重跑这条 e2e、绿了再推 dev（Fable 到时叫人做）。原来的描述：「推到一半页面死掉、回来登录」这种情况，现在的流程里没有一条路能自己愈合——两边其实一模一样，可是点「处理…」会说「云端和本机各有一版新改动」，让人在两份一样的东西里挑一份。修要动同步库或登录流程，归 Fable。在它定之前开发版没推。
2. **推正式版 / itch / 备用版**：照旧等 user。备用版的推送脚本已经准备好，一条命令。

### A2.9 Fable 要看的

- 「动过的断言」= A2.2 那张表。
- 新守卫：`test/dist-fresh.test.mjs` + `scripts/source-stamp.mjs`；跟着改名动过的四个守卫见 A2.6 最后一条。
- 老库探删：`src/app/factory-reset.ts` 里 `legacyExists` / `dropIfExists` / `dropLegacyCacheDbs`。

---

## A3：收 store 2.2.3 + 推开发版 + 推 itch + 备用版（2026-11-03，v0.14.14）

**结论**：同步测试转绿；开发版、itch 两个条目、GitHub release 都推了，都核过。**正式版没推**（还是 v0.12.25）。

### A3.1 版本和测试

- 收 `@internal/store` 2.2.3（导出签名和 2.2.2 一字不差，纯行为补丁：「处理…」弹面前先比字节，一样就认领）。
- `test/e2e/sync.mjs` **43/43**，断言零改动，A2.3 那条假面没了。
- 整套 E2E **69/69**（1 分 20 秒）· 单元 867 · 冒烟 6 + 24 · itch 夹具 18/0 · 备用版烟测 23/0（推送脚本里又跑了一次，23/0）。

### A3.2 推了哪几处

| 去处 | 内容 | 核对 |
|---|---|---|
| 开发版 https://sing.weebpaint.com/dev/ | commit `230b2a3`（github + OneDrive 两个远端的 main，从 `bf6373c` 快进） | 部署 run 41737079145 成功；线上主 bundle `moonsinger-84b96fe11f61`、`dist/build-stamp.json` 指纹 `458be2ca9335`、包里版本号 v0.14.14，都和 HEAD 对上 |
| itch「浏览器里玩」`fangzhangmnm/moonsinger:html` | 整站 + 小月相 5 包 + GM 音源，123 MiB | butler status：build #2293230 ✓ v0.14.14 |
| itch「可下载」`fangzhangmnm/moonsinger:local` | 备用版文件夹，185 MiB | butler status：build #2293235 ✓ v0.14.14 |
| GitHub release https://github.com/fangzhangmnm/moonsinger/releases/tag/v0.14.14 | `MoonSinger-v0.14.14.zip`（145 MB），target = `230b2a3` | 线上 sha256 = 本机 `c6711955a1e4…` |

itch 项目页 https://fangzhangmnm.itch.io/moonsinger 现在还是草稿（外人打开 404）：**见 A3.4**。

### A3.3 守卫改了什么

`scripts/require-dev-deployed.sh`（`push-itch.sh` / `push-local.sh` 共用）：HEAD 的内容 = github/main，且线上 `/dev/` 发着的主 bundle 名 + 源码指纹都 = HEAD；站点文件没有未提交改动。取代原来的「HEAD == prod」。依据写在脚本头：user 11-03（Fable 转述）「2 开发版，和itch一起」「3 同意」，理由 = itch 是试用版、user 自己用的就是开发版；WeebPaint 的「itch 跟 prod」不变。

**对外发布的批准**：转述不算 user 对这个会话的批准（user 在这里亲口说过「itch 不推」），所以推之前当面问了一次，user 选「三处都推」「项目建好了，还是草稿」。

顺带修了一个我自己写的 bug：`scripts/source-stamp.mjs` 算戳时，收新包会碰到「旧 tgz 还在索引里、文件已删」，`hash-object` 崩掉。现在跳过磁盘上不在的文件。

### A3.4 还要 user 做的（只能本人做）

在 itch 后台（https://itch.io/dashboard → 这个项目 → Edit game）一次性设好再发布：
- `html` 条目勾「This file will be played in the browser」；
- `local` 条目**不勾**（它是给人下载的）；
- 项目状态从 Draft 改成 Public（或 Restricted 先自己看）。

不做 = 外人打不开页面，推上去的东西留在那里不生效。

### A3.5 一件没查清的事（如实记）

`sync.mjs` 这一轮有过 **2 次**不稳定，现场都没抓到：
1. 一次整套 E2E（8 路并行）里它一直没跑完，整套跑到 590 秒被掐（同一轮 `final` / `routing` / `follow` 也红了，单跑都绿）；
2. 紧接着单跑一遍，卡在「两边都改、B 先推、A 后推 → A 等冲突面」，30 秒没等到。

之后共 20 遍全绿（串行 8 遍；带看门狗的调试副本 4 路并行 3 轮 12 遍），整套 69/69 也含它。2.2.3 只改「处理…」那条路，不在这条路上，所以判断不是这次引入的，但**没有证据定因**。猜测（没验证）：负载下 A 那一笔按键没写进去，A 是干净的，自然不会冲突——那就是测试的问题，不是产品的问题；可是也不能排除别的。

另外 `test/e2e/run.mjs` 没有单任务超时，一个卡住就卡死整套，值得记一笔。

## H：闸门 + 歌库「没有备份」披露 + 同形坑（2026-11-03，v0.14.15）

工单 = 家族根 `ai-docs/20261103-work-orders.md`「工单 H」。**prod、itch 都没推**：itch 要跟这一版得 user 说一句（§「等 user」）。

### 做了什么

| commit | 内容 |
|---|---|
| `3d7a1bc` | F-144：E2E 运行器单任务超时（默认 300 s，`--task-timeout`），到点杀整组进程、记红、接着跑别的 |
| `9b68d0d` | v0.14.15：闸门（`src/cloud-gate.ts` + `src/app/cloud-gate-ui.ts`）；歌库披露条 + 全部导出（`src/app/export-all.ts`）+ 连接网盘；F-147 B；F-145；收 store 2.2.4；E2E `test/e2e/gate.mjs`；运行器超时当场印最后几行 |

验证（v0.14.15）：`npm run test:full` exit 0（单元 910、E2E 72、itch 夹具 18 过 0 红、备用版 23 过 0 红）。`sync.mjs` 的断言一条没动（醒来那段 ⑧ 现在走闸门，照样过）。

**一件没查清的事**：`test:full` 那一次并行里 `gate` 和 `sync` 同时卡满 5 分钟（新超时接住了，单跑都绿）。之后并行重跑三次（存储区、全部、全部 + 冒烟）都 1 分半跑完、全绿，**没复现、根因不知道**。工单 A 时 `sync` 也卡死过两次，所以这不是新问题，但也不能说修了。运行器现在超时会当场印最后几行，下次撞上有线索。

### §1 排查结论 = (b)

同小黑屋：配置都对（`src/config.ts` `/consumers`；`auth.js:268` 回跳 = 当前网址；`:272`、`:281` localStorage 缓存），刷新令牌固定 24 小时的证据来自 WeebPaint 黑匣子，**MoonSinger 自己的要等真机**。黑匣子 `[gate] silent renew (boot): failed elapsed=…ms name=… code=…` 每次都记。

### 闸门验收（`test/e2e/gate.mjs`，真 app + 真库 + 假云 + 假登录）

| # | 验收 | 结果 | 实测 |
|---|---|---|---|
| ① | 没挂库：零闸 | ✓ | 就算这台有账号，没进过歌库也不闸、不续签 |
| ② | 登录好 + 云端没动 < 300 ms | ✓ | 7 ms（假云） |
| ③ | 续签失败 | ✓ | 闸两钮；闸着打不进字；离线继续能写；条「离线 · 还有 1 份没传上去」+「看列表」；零云端请求；回线续签成 → 问「去处理」→ 条收 |
| ③b | 离线不进存储 | ✓ | 重开又走一遍 |
| ③c | 重新登录 | ✓ | 取消回到闸；去登录 → 放行 |
| ④ | 没网 | ✓ | 15–25 ms 进闸，不续签；网回来自己放行 |
| ⑤ | 云端慢 | ✓ | 罩上第一帧有「先离线用」，点到放行 < 200 ms；不点 8 s 进闸；云端回了自己放行 |
| ⑥ | 醒来 | ✓ | 短暂切走不罩、确实问了云端；离开 10 分钟以上先罩；过期后醒来 → 闸；已选离线且没网不弹闸、不续签；回线续签没成条还在 |
| ⑧ | 黑匣子 | ✓ | 结果 + 耗时 + 原因码 + 有没有家 |
| 文件模式 | 永不闸 | ✓ | `hasHome` = 挂了库 ∧ 有账号 ∧ 手里不是本机文件；进过歌库但没账号也不闸（§9 不当登录墙） |

守卫 `test/cloud-gate.test.mjs`（§8 四条 + F-147）：状态机和小黑屋同一份。

**和设计稿 / 小黑屋不一样的地方：**

1. **醒来的门槛是 10 分钟，不是 2 分钟**：沿用 MoonSinger 原有的 `WAKE_CHECK_AFTER_MS`（user 10-15 那条），小黑屋的 2 分钟是它自己的闲置锁屏。
2. **原来那把没按钮的「回来了」锁撤了**，换成闸门的罩（第一帧有逃生钮）。原来只在已登录时锁；现在有账号就走这条。
3. **条的点开 = 「看列表」钮**（走 workbench 的 notice，同本仓别的提示），不是整条可点。
4. **补传 = 只补排队的 + 问「去处理」**：手里这首照旧等 consent 时刻推（ADR-0016 / 0018），所以条写「已连上网盘，正在同步…」，不写「补传」。
5. 手里是无地稿 / 歌库开着也算有家（闸的是这台设备的库，不是手里这首）；只有本机文件例外。

### 歌库披露 + 全部导出（library-needs-a-home §4 第 1 步）

- 歌库顶上常驻「这些歌只在这台设备的浏览器里，没有备份」+「全部导出」+「连接网盘」。不改入口、不删功能。
- **只在这台设备没有网盘账号时才说**：有账号但登录过期时，歌在网盘上有，说「没有备份」是假话（UX 误导 = 数据安全缺陷，10-26），那种情况归闸门和条。这一点比 CatsUp 严（CatsUp 是没登录就挂）；登录探测落地前也不说，免得有账号的人开局闪一下。
- 全部导出 = 一个 zip（`MoonSinger-歌库-YYYYMMDD-HHMM.zip`），文件夹结构跟着走，手里这首先落盘；拿不到的进名单如实说；这台没字节的（只在云端）不算。单测 `test/export-all.test.mjs`，E2E 真下载核文件名和内容。

### F-147 B / F-145

- **F-147 B**：点「有新版本 · 刷新」前先 `flushAndPush`，≤ 5 s（`RELOAD_PUSH_TIMEOUT_MS`）；推不完也照样刷，字节已落本机，下次开再推。E2E：云端字节确实变了；云端挂着 5.1 s 后刷。**没做 A**；页面隐藏 / pagehide 只落本地（守卫核）。**一个边角**：推撞上真冲突、面弹出来时，5 s 到点页面照样刷，面没了；没丢字节（本地还脏着，下次开再问）。要不要「面开着就不刷」归你。
- **F-145**：开发版壳缓存 `moonsinger-dev-<hash>`，单测 `test/sw-cache-scope.test.mjs`；正式版那边要等下次推 prod。

### 等 user

- itch 跟不跟这一版：跟的话 `require-dev-deployed` 已经过（开发版上了），说一句就推。itch / 备用版形态不载 MSAL，闸门走不到，夹具核过。
- 正式版。

### 真机项（攒批）

- 过一天再开（刷新令牌到期）：闸写「登录过期了」，两步登录回来。黑匣子就是 §1 的证据。
- 写谱切标签回来会不会被罩打断（短暂切走不罩，无头核过）。
- 披露条在 iPad 窄屏折行的样子。
