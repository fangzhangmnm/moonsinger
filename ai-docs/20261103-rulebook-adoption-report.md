# 工单 A 验收报告：MoonSinger 上 itch + 备用版 + 模型包读出重核

> created 20261103 by Claude Opus 5.5 · as-of v0.14.12 / 2026-11-03
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
- **备用版的念缓存存不住**：线程是 data: 起的（origin 为 null），每次打开第一遍要重念（设置页那一行如实说了）。
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
