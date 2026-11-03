# MoonSinger 上 itch：zip 部署可行性 + 对照无地骑士安全标准

> created 20261103 · as-of v0.14.11 / 2026-11-03 · by Claude Opus 5.5
> 状态 = **调查结论，没动代码**。等 user 拍：下载条目要不要、资源进不进 zip、模型缓存那个洞怎么补、什么时候推 prod。
> 对照的标准 = WeebPaint「无地骑士」：`../20260524 WeebPaint/ai-docs/20260825-localfile-knight-grill-verdicts.md` §2.9 + `20260825-localfile-knight-survey.md` §3 / §5 + `src/remember-password.ts` 头注释（itch 所有游戏共用一个域名）。

## 0. user 原话（本会话）

- 「moonsinger it h宣发 看一下我们能不能打single html，对标一下无地骑士的安全标准」
- 「以及我们是不是资源得一起打包」
- 「我建议itch是zip部署」
- 「没必要单文件」「不过zip的话下载打开还能用吗」

## 1. 结论

1. **itch = zip 部署可行**：把整个站点（index.html + dist/ + vendor/ + assets/）打 zip 上传给 itch 的「浏览器里玩」条目。itch 从 https 域名逐个文件服务，和 /dev/ 是同一种运行环境：module worker、AudioWorklet、`fetch("./…")` 全部正常（实测见 §2）。
2. **zip 下载下来双击 index.html 不能用**：实测白屏 + 「脚本错误」，主程序被浏览器以 `origin 'null'` 拦下。能用的路：① 解压后起本地服务器开 localhost（全功能，门槛高）；② 想离线用的人去官网装 PWA（本来就离线全功能，现成正路）。③ 让双击能用 = 单文件那套改造（§2.2 证明在 Chromium 上做得到），user 说没必要。
3. **资源建议一起进 zip，代码零改**：模型和音源的查找顺序本来就是「先找同站点的 `pwa-models/`、`pwa-sounds/`，再找设置里的」（`src/sources/models.ts`、`src/sources/sounds.ts` 的 `bases()`）。zip 里按原站目录放一份子集即可。
4. **要补的安全洞（itch 才真成立）**：`@internal/model-packs` 读缓存时只认「已核过」印章 + 分片大小，不重新算哈希（§4.1）。itch 上同域的是所有 itch 游戏，邻居能塞假分片 + 假印章。

## 2. 实测（headless Chromium 149，本机，2026-11-03）

### 2.1 同一页面：file:// vs http://localhost

| 能力 | file:// | http |
|---|---|---|
| module 形式的 blob worker | ✗ 起不来 | ✓ |
| classic 形式的 blob worker | ✓ | ✓ |
| classic worker 里 `import(blob:)` | ✗ Failed to fetch dynamically imported module | ✓ |
| worker 里 wasm instantiate | ✓ | ✓ |
| AudioWorklet `addModule(blob:)` | ✗ Unable to load a worklet's module | ✓ |
| Cache Storage put | ✗ | ✓ |
| IndexedDB / localStorage | ✓ | ✓ |
| SharedArrayBuffer | 无 | 无 |

### 2.2 data: 地址绕路（file://）

AudioWorklet `addModule(data:)` ✓ 能出声；data: module worker ✓，里面 `import(data:)` / 静态 import data: / `import(blob:)` 都 ✓；但 **data: worker 的 origin = null**（http 下也是），worker 里的 IndexedDB / Cache 落在不透明分区 → 小月相的念缓存、模型缓存存不住。= 单文件「技术上做得到，但每次打开都要重下 / 重导入 69 MB」。Firefox 本机没装，没测；Safari file:// 存储直接 SecurityError（WeebPaint survey §5.1 文献）。

### 2.3 MoonSinger 真构建（仓里 dist/，v0.14.x）

- file:// 打开 index.html：`Access to script at 'file:///…/dist/moonsinger-<hash>.mjs' from origin 'null' has been blocked` → 白屏 + app 自己的「脚本错误」条。
- http://127.0.0.1 打开：编辑器正常起来（顶栏 / 谱面都在），没有报错。

## 3. 资源清单（进 zip 的话）

| 东西 | 体积 | 现在住哪 | 进 zip 放哪 |
|---|---|---|---|
| app 代码（5 个 worker + 主程序，不带 .map） | 3.0 MB | dist/ | 原样（**.map 8 MB 不带**） |
| 导出 PDF 的字体（拼音 12 MB + 黑体 6.1 MB，gzip 过） | 18 MB | vendor/fonts | 原样（本来就是站点的一部分） |
| 小月相的元音采样（兜底嗓子） | 3.2 MB | assets/preview | 原样 |
| 乐器表 / 图标 / wasm（TinySoundFont / WORLD / LAME）等 | ~3 MB | vendor/ | 原样 |
| 小月相的嗓子：音色 39.7 MB + 日语词典 24.5 MB + 推理引擎 3.7 MB + 中英前端 1.6 MB | ~69 MB | pwa-models（GitHub Pages） | `pwa-models/packs/<包名>/chunk-NNN`（只拷 `src/singer/packs.gen.ts` 里那 5 个包） |
| GM 乐器 GeneralUser GS 2.0.3 | 32.3 MB（单文件） | pwa-sounds（GitHub Pages） | `pwa-sounds/generaluser-gs-2.0.3/GeneralUser-GS.sf2` |

合计约 130 MB、一百来个文件。itch HTML5 上限 = 解压后 ≤ 500 MB、≤ 1000 个文件、单文件 ≤ 200 MB（https://itch.io/docs/creators/html5，2026-11-03 查）。注意：Windows 自带压缩 / 7-Zip 会把空文件夹也记成条目，用脚本打包。
itch 是按文件服务的，玩家只下载用到的：重资源照旧「第一次整首唱 / 点选乐器才下」，zip 胖不等于开页慢。butler 推补丁只传差异，资源不变时重推很便宜。
不进 zip 也能跑：itch 页会跨站去 fangzhangmnm.github.io 拉（GitHub Pages 带 `Access-Control-Allow-Origin: *`），代价 = GitHub 那边挂了 itch 版就唱不了（反弃坑）、itch 版和资源的版本不再绑在一起。
许可：小月相的包说明要求界面里显示署名块和四条禁止用途（MoonSinger 已有署名界面，上 itch 前顺手核一眼）；itch 页保持免费。

## 4. 对照无地骑士安全标准（itch 形态逐条）

itch 的前提（WeebPaint `src/remember-password.ts` 2026-10-17 已记）：**所有 itch 游戏共用 `html-classic.itch.zone` 一个域名**，嵌在 itch.io 页面里时存储分区也相同 → 同域的不只我们，邻居能读也能写我们的 IndexedDB / localStorage / Cache Storage。

| 无地骑士的条款 | MoonSinger 现状 | itch 形态要做的 |
|---|---|---|
| IDB 不当作品的家；无库不长图库 | ✓ 没进过歌库 = 不建 store、不开 IDB、不载 MSAL（v0.3.0 无地） | 歌库 / OneDrive 登录**画灰 + 明说**（「itch 网页里存不了歌库，去官网用」）：回跳地址没在 Azure 登记，登录必失败；就算能登，令牌放在所有 itch 游戏都能读的 localStorage 里 = 不许 |
| 承重层 = 脏标记 + 挽留 + 关页拦一下 | ✓ beforeunload 有；无地不偷偷写盘 | 真机看一眼 iframe 里关页挽留会不会弹 |
| 存 / 开文件同一个钮静默降级；跨域 iframe 禁系统文件框 | ✓ `doc-file.ts` 的 `topLevel()` 判断 → 存 = 下载 .mxl、开 = 选文件 | 无（WeebPaint 在 itch 上 user 实测过下载能弹） |
| 单文件 / itch 形态 SW 全家放弃 | 有 service-worker.js | itch 形态不注册 SW（itch 推新版时 SW 缓存会和它打架；壳缓存也落在共享域） |
| 同源的不只我们 → 不在共享存储放秘密（WeebPaint 关「记住密码」） | MoonSinger 不加密，没有口令 | **念缓存（`moonsinger-speech`）里是小月相唱你歌词的音频** → itch 形态只放内存；device-kv 里「上次开的歌名」、黑匣子日志（会带歌名）同理只放内存；缩放倍数这种无害的随意 |
| 所有库名带自家前缀、永不枚举别人的 | ✓ `moonsinger-` / `moonsinger-5b1e7c0a92d34f6e:`；还原出厂只删自家 | 无 |
| 字节到手先核哈希；信任根是 app 里钉的清单 | 音源 ✓ 存进去前核、**每次取出来再核**（`src/gm/sound-cache.ts`）；模型 下载时逐片核 ✓，**读缓存时不核** ✗（§4.1） | 补 §4.1 |
| 做不到的画灰 + 明说（本仓纪律） | — | itch 框里浏览器可能不给 MIDI、读剪贴板（WeebPaint survey §5.2：Chrome 系 clipboard 在 itch iframe 死）→ 真机看，不给就画灰说明 |

### 4.1 模型缓存的洞（`@internal/model-packs` `pack-store.js`）

- `chunks(slug)`：`status(slug).ready` = 每片**大小**对 + `verified.json` 印章里的 packId 对 → 直接把缓存里的 blob 交出去，不重新算哈希。
- packId 公开写在 app bundle 里（`packs.gen.ts`）。itch 上的邻居可以往 Cache Storage `pwa-models` 写同样大小的假分片 + 一个 packId 对的假印章 → MoonSinger 载入假模型。被换的可能是推理引擎包里的 wasm 二进制（`runtime-onnxruntime-web-…`），不只是嗓子。
- 在 fangzhangmnm.github.io 上不成立（同域都是自家 app）；在 itch 上成立。
- 两条补法（归 user 拍）：
  - **A 改库**：`chunks()` 每片读出来重新核 sha256 再交出（和音源同一个做法）。全家用这个库的 app 都多一层；代价 = 每次载模型多算 69 MB 的哈希（库里是 JS 流式 sha256，桌面估 0.5 s 上下、iPad 更慢，没量）。内部库改动，按家规要 user 批（行为改动算 patch 还是加选项算 minor，到时列清楚）。
  - **B 只改 itch 形态**：itch 形态不用共享缓存，每次从 zip 里现取现核（下载路径本来就逐片核）。代价 = 下载请求带 `cache: "no-store"`，每次打开后第一次唱都要重新从 itch 拉 69 MB。

## 5. 发版形状（提议，未拍）

- itch 跟 prod 不跟 main（WeebPaint 2026-08-30 user 拍板的先例）。MoonSinger 现在 prod = v0.12.25、dev = v0.14.11 → 上 itch 前先要 user 点头推 prod（家规 #5）。
- 打包脚本照 WeebPaint `scripts/push-itch.sh`（butler 同 channel 原地更新、HEAD 必须 == prod 守卫），只是 zip 里装的是整个站点 + 资源子集，不是单文件 html。
- 运行时怎么认出「我在 itch 里」：打包时往 zip 里的 index.html 烤一个标记（同 WeebPaint `__WEEBPAINT_EMBED__` 的思路：「同一个 bundle 两种壳」，不做阉割 build），§4 的几条按这个标记分叉。
- 真机批（攒一次）：iPad Edge 打开 itch 页能不能出声（AudioWorklet）、唱一首（模型从 zip 下）、存 = 下载 .mxl、关页挽留、MIDI 给不给。

## 6. 双击打开的正规绕法（2026-11-03 续，user「不是可以.files吗，比如最基本的图片。以及虽然我不是很喜欢伪装成图片然后偷渡但这个方向有没有正规的做法」）

浏览器分两件事：**让页面显示**旁边的文件（`<img>` / `<audio>` / `<video>` / 字体 / 老式 `<script src>` 都放行）和**让代码读出**它的字节（fetch / XHR / 读像素 / 读采样一律不放）。实测（headless Chromium 149，file://）：

| | 结果 |
|---|---|
| `<img src="./px.png">` 显示 | ✓ |
| 画进 canvas 再 `getImageData` | ✗ SecurityError（画布被「污染」）——图片偷渡在双击打开时本来就走不通；就算能走，家规「字节进出不走 canvas」（预乘 alpha / 色彩管理会改字节，透明像素的 RGB 直接丢） |
| 老式 `<script src="./pack-000.data.js">`（里面一行 `self.__msData[名] = "<base64>"`）装 32 MiB | ✓ 读进来 940 ms、`Uint8Array.fromBase64` 44 ms、sha256 39 ms，字节一致 |

**正规做法 A = 数据装在脚本文件里**：文件真的就是一段 JavaScript（名字老实叫 `.data.js`），不是伪装；老式 `<script src>` 是浏览器明确允许从任何地方载的东西。信任根不变 = app 里钉的 sha256（解码后核）。按 pwa-models 的 24 MiB 分片一片一个文件，用到才插 `<script>`（重资源等有意图），内存峰值 ≈ 一片的字符串 + 字节。磁盘上胖三分之一（zip 里再压回去大半）。
**正规做法 B = 让人选一次文件夹**（`<input type=file webkitdirectory>` 或把文件夹拖进来）：所有浏览器在双击打开时都给；app 已有「从本机文件导入模型包」（按内容哈希认分片）。代价 = 每次打开选一次（双击打开记不住授权）。

**这一节更正 §1-2 的一句**：此前说单文件版「每次打开都要重下 / 重导入 69 MB」——那是单文件的限制；按 A 做成「文件夹 + `.data.js`」，嗓子就住在文件夹里，第一次唱时从盘上读约 2 秒（桌面估计，按上面 32 MiB 的数推），不用下载也不用缓存。剩下存不住的只有念缓存（data: 起的线程没有自己的域；主线程的存储是所有双击打开的网页共用一份，按 §4 只放内存）→ 每次打开第一遍要重唱。

要让整个 app 双击能用还要动的：主程序改成老式脚本（esbuild iife）；5 个后台线程 + 出声线程的代码装进 `.data.js` 当字符串、从 data: 地址起（§2.2 实测能起、能在里面 `import(data:)`；classic blob worker 里 `import(blob:)` 不行）；约 8 处 `fetch("./…")` + 模型包下载改走一个读口（照 WeebPaint `src/standalone-html.ts`：两种壳一个接缝；模型包喂给现成的「从本机文件导入」口，库不用改）；歌库 / 登录在双击形态没有（MSAL 在 file:// 本来就死）。**只在 Chromium 验过**：Mac 双击默认开 Safari（存储一碰就报错 + data: 起线程不行，均为文献）；Firefox 没测。iPad / iPhone 没有「双击打开 html 并运行」这回事。

最强的理由 = 反弃坑：下载下来的文件夹不依赖任何网站活着，PWA 安装要装的那一刻网站在。

## 7. user 的选择 + Safari（2026-11-03 续）

- user「所以多线程还是有对吧」= 有（Chromium 双击打开：5 个后台线程 + 出声线程都能从 data: 地址起，§2.2）；限制两条：线程自己存不住东西；数据由主线程载好转交。
- user「我觉得可以用老实脚本」= 双击形态走 §6 做法 A（`.data.js`）。**还没排期**（家族周账 F-102 = 待拍板）。
- user「wishlist让weebpaint也这么学，记账」→ 家族周账 F-139（wishlist）+ WeebPaint 便条 `ai-docs/inbox/20261103-from-moonsinger-double-click-folder.md`。
- Safari 为什么不行（文献 = WeebPaint `ai-docs/20260825-localfile-knight-survey.md` §5.1，没实测；user 设备里没有 Mac）：同一个问题（双击打开的网页互相是陌生邻居），三家三种答法——Chromium 让所有双击打开的网页共用一份存储（能用、但互相看得见）；Firefox 按文件夹隔开；Safari 干脆不给，一碰存储就 SecurityError（除非开发者菜单里关掉本地文件限制）。另外 Safari 不让 data: 地址起 worker（blob 可），而 Chromium 双击时 blob 起不了出声线程——两家要的起法正好相反。老实脚本本身 Safari 照样能载。
- 如果做：Safari 双击打开时先不碰存储、认出来就整页说「请用 Chrome / Edge 打开，或去官网装」（做不到的明说），不白屏。真要支持 Safari = 存储处处兜 + 线程按浏览器挑起法 + 找一台 Mac 真机验。

## 8. 往后看家族推荐稿（2026-11-03 续）

user「全家对齐，包括weebpaint记账和未来的catsup」→ 三种形态（官网 / itch 内嵌 / 备用版）的存储行为 + 设备接口提到家族级：家族根 `ai-docs/20261103-three-shapes-storage-contract.md`（家族周账 F-140）。本文 §4 的 itch 逐条以那份为准；那份定稿前本仓不动代码。顺带：MoonSinger 的登录不认得自己被别的页面套着（官网没禁止被套），推荐稿 §4 记着。
- **11-03 稍后**：user 拍 itch 内嵌 = 整站 zip，并给了威胁模型（共用存储 = 命名空间混乱不是偷窥；只有加密的才防扫描）→ 本文 §4 里「念缓存 / 最近打开 / 日志在 itch 上只放内存」作废，改为照存（自家前缀）。以家族规范为准。
