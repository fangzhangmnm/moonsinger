# 歌库接线交接：@internal/store 0.16.1 + @internal/gallery 0.7.0 + OneDrive（MSAL）

> created 20261008 by Claude Fable 5.1 · as-of v0.6.0 / 2026-10-08（v0.5.2 commit 4f198c2 接线落地，user 当晚「应该bump」→ 0.6.0 歌库纪元）
> 读者 = 下一个要碰存档 / 同步 / 歌库的 session。家规 `../../CLAUDE.md`「云同步 store 库」、skill `pwa-cloud-store`、`20260601 MyPWAPatterns/docs/MASTER.md` §A 红线全在前面；本文只写 MoonSinger 自己的接法、取舍、还没验的。

## 0. user 这轮的原话（出处 = 2026-10-08 本 session）

- 「还有什么没做的…真的需要做store了…要不要硬着头皮进store」→ 进。
- 「身份走库的……反正严格按照库的护栏干」。
- 「音源子集照旧嵌在 blob 里太慢以后可以吃书」（一首歌 = 一个 .mxl blob，原子）。
- 封面：「存在歌里 attachments/cover.* 不同意，看一下weebpaint和wxhw的convention以及peek的逻辑」→ 照 WXHW ADR-0012：封面 = `Thumbnails/thumbnail.png` 这个 entry 本身（zip 最后一个、不压缩、尾读）。「我们这个应该是唱片封面，是矩形的…不管日期小字，消歧码的逻辑都可以学。都是 HTML 排版进 gallery 的两个槽 对」。
- 「「•」和「存」对齐 WXHW 也做好无地模式」。
- 「冲突面照家规 必须做的非常严格。配得上fable的严格和信息安全。谢谢。不要发生没有接线的情况」。
- undo：「这个没有store急。而且现在我们的操作应该是个群，只是麻烦一点」（没做）。
- 派生 IDB `moonsinger-thumbs`：「没问题」。封面缩图那一次 canvas：「如果wxhw也放行了，可以，老规矩，抽象封装一下只暴露这个压缩功能」。
- 「wxhw接线也许也有坑，weebpaint是我盯的最多的（不过也可能weebpaint有历史错wxhw修正了）」→ 派了只读 agent 比对两家（§4）。
- Azure 注册：「好，那么我注册MoonSinger了」→ client id `ce612efe-…`（`src/config.ts`）。

## 1. 接了什么（文件地图）

| 文件 | 角色 |
|---|---|
| `src/config.ts` | APP_ID `moonsinger`、CLIENT_ID、AUTHORITY `/consumers`、SCOPES `AppFolder + offline_access`、MSAL_URL、SONG_SUFFIX `.mxl`、节律常量 2 s / 15 s / 30 s |
| `src/app-store.ts` | **唯一** `@internal/store` 值级 import。`createOneDriveProvider`；`attachStore()` 懒建（`storeAttached` 旗在 device-kv）；`createStore` 每个表态：persistence app-managed、encryption 零 codec、reconcilePolicy app-driven、validateAdopt = zip 魔数、docKinds、autoCacheOpenedFile、offlineUploadReplay auto、signedIn、activeIdentifier |
| `src/store-ui.ts` | 图库包 `storeUIFor({busy, showNotice, sheets, reportError, stemOf})` + 本仓两条：`"Not signed in"` 降 log、`onReplayStatus`（库在 auto 模式下**强制**要这条，没有当场抛——第一次 E2E 就是这么红的） |
| `src/identifiers.ts` | `DOC_KINDS = [{kind:"song", suffix:".mxl", container:"zip"}]`；`identifiers = createIdentifiers(...)`（守卫只放行这一个名字） |
| `src/encryption.ts` | `createEncryption()` 零 codec（不加密；要加密再 vendor zip.js / 7z 照 WXHW） |
| `src/device-kv.ts` | localStorage 唯一器官（storeAttached / gallery-folder / last-scene / last-doc；diagLog 也走它） |
| `src/ui/sheets.ts` | busy 遮罩（ref-count）/ 同步闸 `lockSyncGate`（不可 dismiss、先夺焦点）/ 问一句 / 输入一行 / 选一个（`onPick` 同步钩子给 redirect 登录） |
| `src/app/report-error.ts` | 唯一报错漏斗：error / warning / info → notice，log → console；**每级进 diagLog 黑匣子**（设置里「诊断日志」能看能拷能清） |
| `src/gallery-host.ts` | 歌库屏（容器与 chrome 动态造，不进 index.html）：Vue 注入、DocHost、policy.thumbs（`moonsinger-thumbs`，尾窗 128 KB）、tile.aspect 1、文案四条换歌库口吻 |
| `src/ui/song-cover.ts` + `styles.css`「歌库封面」 | 两个槽：占位 = 按歌名哈希的哑色；覆盖层 = 歌名（汉字竖排 / 拉丁横排左下）+ 日期 / 大小底栏；底下有图时歌名垫半透明纸 |
| `src/image/codec.ts` / `src/image/cover.ts` | 唯一 canvas 点（解码一次读出 RGBA）；居中裁方 → `makeThumbAdaptive`（≤ 256²、≤ 70 KB）→ 腰封 iTXt |
| `src/editor-session/` | WeebPaint 的拷贝（逐字节同）+ `release()`（§3） |
| `src/app/main.ts`「歌库」节 | 家三种、`es` 装配、`changed()` 1 s 心跳、`openStoreDoc` / `newStoreSong` / `saveIntoGallery` / `renameActive` / `ensureAttached` / `startAuth` / `signInFlow` / `afterSignIn` / `pushDirtyAll` / `refreshOpenDoc` / `retrySilent` / `setCover` / boot |

守卫：`test/redline-guard.test.mjs`、`test/storage-whitelist.test.mjs`、`test/store-wiring.test.mjs`、`scripts/build.sh` 接缝 lint。E2E（不在仓里，在 job tmp `filee2e/store.mjs`，41 条）：attach → 新建 → 自动存 → 刷新回同一首 → 改名 → 封面尾读 → 卡片两层 → 两首切换 → 删掉打开中的那首回来不复活。

## 2. 节律与家

- **家三种互斥**：`doc.identifier`（歌库）> `doc.handle`（本地文件，v0.3.0）> 没家。
- **歌库里**：`createEditorSession({ store: zip(name,{mode}), policy: { autosaveMs 2000, pushOn ["exit","blur","idle"], idleMs 15000 } })` + `es.start()`（**不调 start 就没有自动存**——第一轮 E2E 的第二个红）。内容变化不走 `onChange`：`changed()`（`update()` 里 + 1 s 心跳；休息室 / 录音室 / 封面直接改 `doc.extras` 的那些靠心跳兜）→ `es.markDirty()`。`dirty()` = 谱 / 休息室 key / 封面 rev 和上次落盘快照比；落盘快照在 `encode()` 取、`onSaved` 才记成已存（快照之后的改动继续算脏）。30 s 心跳：`isPushPending ∧ signedIn ∧ online` → `flushAndPush`。「存」= `forceSaveAndPush`。
- **顶栏**：「•」= 内存脏（还没落本地）；云朵 `cloud-upload` = 没上云 / `cloud-synced` = 同步了；没登录 / 无地不画。`beforeunload` 挽留框：脏就拦（登录跳转期间不拦）。
- **进歌库**：`flushLocal` → 歌**还开着**（见 §3 取舍）→ 回来 `afterGalleryClosed` 查 `files.occupied`，不在了 = 被扔进回收站 → `es.release()` + 变无地稿 + 报错说明。
- **boot**：`storeWasAttached() || /[#&](code|error|state)=/.test(hash)` → `ensureAttached()`（store + 歌库屏 + `onRenamed` 跟 last-doc）→ 本地恢复（last-scene gallery → 开歌库；last-doc → `openStoreDoc`，失败进歌库、指针留着）→ `startAuth()`。
- **登录后** `afterSignIn`（单飞）：推开着的 → `drainOfflineQueue` → `pushAll` → `refreshOpenDoc`（`pullIfClean` 干净快进；`fast-forwarded` = 同名 `es.open` 整体重载）→ 刷新歌库。`online` / `visibilitychange visible`：登录着 → 快进；没登录 → `retrySilentSignIn`。
- **登录** = 两步：`flushLocal` → 「去登录」sheet，`onPick` 同步 `auth.signIn({prompt:"select_account"})`（redirect）。退出 = `signOut` 只清本 app 缓存，歌留在设备上。

## 3. 取舍（和两家不同的地方，明说）

1. **进歌库歌不关**（WeebPaint「进图库 = 关闭当前画作」、WXHW v2.1.34 `releaseForLibrary` 都关）。理由：歌库有「返回」钮、30 s 心跳不被打断、不用 WXHW v2.3.30 那种「返回重开上一本」状态机。代价：歌库动词碰到打开中的那首时要自己处理——挪夹 `setIdentifier` → `es.release()` 再按新身份重开；删掉 → 回来 `release()` 变无地稿。**不 release 就会复活旧名字**（editor-session `open(新)` 的「切 doc 前先存旧的」在 push-pending 时会把当前内容写回旧名——WXHW 审计 L7 同类；没登录时 push-pending 永远是 true，所以这不是边角）。`release()` 是本仓加进 editor-session 的一个方法（上游 WeebPaint 没有；要回流就回流）。
2. **撞名加 `-hex4`**（WXHW user 2026-09-10「我最讨厌 123 这种的序号焦虑」），不用图库包 `uniqueIdentifier` 的 ` 1`。只在「存进歌库」用；新建用随机 hex 本来就不撞。
3. `pullIfClean` 两家都没接（WeebPaint 有 `refreshOpenDoc` 接的是旧版 refresh）；本仓接了，逃生 probe 没接（没 sheet 就没有「跳过」，用户即超时那条线在 open 有、refresh 没有）。
4. 冲突面期间的编辑：gate 盖住一切（pad 的触摸也被遮罩吃掉），所以「takeCloud 期间打的字」在本仓不会发生，不需要 WXHW 的「冲突留底」。

## 4. 两家比对里要 user 拍的（agent 2026-10-08 比对 WeebPaint 0.13 / WXHW 0.16.1 接线；本仓现状在括号里）

1. 推云节律：consent 制（WeebPaint：只在退出 / 显式存 / 换歌推；30 s 空闲只落本地）vs 心跳制（WXHW 15 s / 30 s）。**（现状 = 心跳制，照「「•」和「存」对齐 WXHW」。）**
2. 「•」语义：内存脏 + 单独「未上云」徽章（WeebPaint）vs 一个合并的「未同步」钮态（WXHW）；要不要 `beforeunload` 挽留框（WeebPaint 要、WXHW 不要）。**（现状 = 分开两个 + 要挽留框。）**
3. 撞名后缀 ` 1`（WeebPaint / 包）vs `-hex4`（WXHW）。**（现状 = -hex4。）**
4. 退出登录：拆库 + 脏门 + 备份下载（WeebPaint）vs 只退出、本地留着（WXHW）。**（现状 = WXHW。）**
5. 冷启动跟远端 lastActive（WXHW）vs 只认本机（WeebPaint）。**（现状 = 本机。）**
6. 恢复失败：指针留着下次再试（WeebPaint）vs 清掉（WXHW）。**（现状 = 留着。）**
7. 歌库「返回」钮：没有（WeebPaint）vs 重开上一本（WXHW）vs 歌不关（本仓）。
8. 新建：立刻落盘（WeebPaint）vs 写第一个字才落（WXHW / CatsUp）。**（现状 = 立刻。）**
9. 登录：桌面弹窗 / 移动 redirect（WeebPaint）vs 全 redirect（WXHW）。**（现状 = 全 redirect。）**
10. 快进：逃生分叉（WeebPaint）vs 输入冻结（WXHW）。**（现状 = 都没有，gate 兜。）**
11. 前台每 60 s 轮询开着的歌（WXHW）vs 只靠事件（WeebPaint）。**（现状 = 事件。）**
12. 两家都没用 `files.onRenamed` / `hidden`。**（本仓接了 onRenamed 跟 last-doc；hidden 没东西可藏。）**

比对里查出的两家各自的坑（给以后对账用）：WXHW `setStoreQuietStatus` 从来没被调（安静路径的状态行其实没接）；WXHW 进书库会取消待推的心跳；WeebPaint `initAuth` 不和建 store 排序、首次 redirect 回跳的报错会被吞；两家 `open` 都把 push-pending 清成 false（重开一个没推上去的歌会显示干净——本仓靠 `pushAll` 兜）。

## 5. 还没验 / 还没做

- **真云零验证**：没登录过微软；Azure 注册的 SPA 重定向 URI 要加 `https://fangzhangmnm.github.io/moonsinger/`、`https://fangzhangmnm.github.io/moonsinger/dev/`、`http://localhost:8710/`（库的 redirectUri = `origin + pathname`）。两台设备的冲突面 / 快进 / 补推只有接线守卫，没有两 context 的 E2E（WXHW `npm run e2e:sync` 那种要真 token）。
- 真机零（iPad 歌库屏 / 捏合 / 键盘与歌库的焦点）。
- 歌库里还没有「从本机文件导入 .mxl 到歌库」的入口（拖进来 / 打开本机文件 = 无地稿，再「存进歌库」两步；可以合成一步）。
- 设置的「音源库来源 / 模型来源」仍只在这次打开里有效（本来就没持久化；要持久化走 store collection 或 device-kv，逐案问）。
- undo（user「这个没有store急」）。
- `names.ts` 留着（没换成包的 `galleryDefaultName`，同格式）。
