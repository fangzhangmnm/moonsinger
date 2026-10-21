# 家这一刀：三种家收成一个 Home 接口（F-49）

> created 20261021 by Claude Fable 5.1 · as-of v0.13.10（dev）/ 2026-10-21
> 起因：doc 这一刀（`20261016-document-single-entry.md` §5）留的「下一刀」；user 10-17「家：这个算本周的欠债，记账，下周fable弄」= 家族周账 F-49；10-21 周账 §6 道 4 第一件。
> 家规 API .h ritual：重构策划附现状 .h + 提案 .h。这份同 doc 那一刀一样是**切完后补的**（周账已排好、界面原定不改，刀先落、账后记）；提案 .h = 现在 `src/app/home.ts` 的签名。

## 1. 一句话

`src/app/home.ts createHome()` = 这首歌的家（歌库里的一首 / 本机文件 / 还没家，三种互斥的判别联合）+ **改家的唯一出口**（`setHome`，私有）+ 五个动词 `save / rename / leave / settle / intoGallery` + `release / noteChanged / load`；三种家 × 动词的分支全在这一个文件里（消费点 `switch + assertNever`，加第四种家 = tsc 逐点报错）。不碰 DOM、不碰持久化、不 import store / editor-session——全经 ports 注入，node 能跑（`test/home.test.ts` 19 条钉矩阵）。main.ts 只剩「把结果翻成人话」和 ports 的接线。同形 = WeebPaint `src/doc-home.ts`（gallery / file / transient + 持权动词）。

## 2. 现状 .h（切之前，v0.13.9 的 main.ts）

```ts
const doc = { stem, named, handle: FileHandle | null, mtime: number | null, identifier: string | null, pendingHome: { folder } | null };   // 口袋对象，6 个字段，谁都能写
const docName = () => …doc.named / doc.stem / 歌名…                        // 显示 / 存档用的名字
function syncKind(): SyncKind            // if (doc.identifier) … if (doc.handle) … 无地
function fileWhere(): string             // 三元链：identifier ? … : pendingHome ? … : handle ? … : 无地两种
function loadDoc(song, { stem, named, handle, mtime?, identifier?, … })   // 直接写 6 个字段 + setActiveIdentifier
function markSaved()                     // doc.stem = docName(); doc.named = true; D.markSaved()
async function fileSave()                // if identifier → smartSaveStore；if handle → mtime 对表 + 写回；canPickSave → 保存框；else 下载
async function smartSave()               // if pendingHome → blank / homeNow；identifier ? smartSaveStore : fileSave
function renameFile()                    // 无地：doc.stem = v; doc.named = true
async function renameActive()            // identifier ? es.rename + 写 identifier / stem / setActiveIdentifier / KV : renameFile
function changed()                       // identifier && dirty → es.markDirty；pendingHome && dirty → homeNow
const homeIfEdited = …; let homing; function homeNow()   // 首笔安家：铸身份 / 写 5 个字段 / es.adopted / flushLocal / KV
async function leaveCurrent(what)        // homeIfEdited → identifier ? flushAndPush : confirmDiscard
async function openStoreDoc(id)          // homeIfEdited → !identifier && dirty → confirmDiscard …
async function newStoreSong()            // es.release(); loadDoc(无地); doc.pendingHome = {folder}; KV null
async function saveIntoGallery()         // pendingHome → homeNow；铸身份 / 写 5 个字段 / es.adopted / flushLocal / KV；失败 = identifier 退回 null（es 却还举着新名字）
gallery 接线 setIdentifier / activeIdentifier / flushLocal / newSong   // 各自读写 doc.identifier
async function afterGalleryClosed() / openGallery() / signOutFlow()   // 各自 es.release() + doc.identifier = null + setActiveIdentifier(null) + KV null
```
症状：三种家的 if 链散在 19 处；换家的副作用（`setActiveIdentifier` / last-doc 指针 / `es.release()` / 重画顶栏）每处各写各的，**从歌库里的歌直接开本机文件（fileOpen / 拖进来 / 双击）那条路漏了 `es.release()`**——es 还举着上一首的身份，推要是没推上，下一次 pagehide 会把本机文件的字节 encode 进上一首。

## 3. 提案 .h（= 现在的 `src/app/home.ts`）

```ts
export type Home =
  | { kind: "gallery"; identifier: string }                      // 歌库里的一首：store 身份；自动存 + consent 推云（editor-session 承重）
  | { kind: "file"; handle: FileHandle; mtime: number | null }   // 本机文件：「存」= 写回；mtime = 写前对表的基准
  | { kind: "none"; pendingFolder: string | null };              // 还没家；pendingFolder ≠ null = 歌库里「新建」出来的空谱（首笔安家）
export function assertNever(x: never): never;

export interface HomePorts {
  gallery: { save(); flushLocal(); flushAndPush(); markDirty(); adopted(id, { create: true }); release(); rename(to): Promise<RenameResult>; occupied(id) };
  file: { canPickSave(); pickSave(name); writeTo(h, bytes); mtime(h); isStale(seen, now) };
  ids: { join(folder, stem): string; parse(id): { folder; stem } | null };
  suffix: string; bytes(): Uint8Array; dirty(): boolean; title(): string; freshStem(): string;
  ask: { discard(what): Promise<boolean>; overwriteStale(fileName): Promise<boolean> };
  offerDownload(bytes, name, onSaved): void; markSaved(): void; report(e, level): void;
  onHome(prev: Home, next: Home): void; onName(): void;
}
export type SaveOutcome = { k: "blank" } | { k: "gallery" } | { k: "written"; name } | { k: "declined" } | { k: "cancelled" } | { k: "offered"; name };
export type RenameOutcome = { k: "renamed"; stem; oldKept } | { k: "same" } | { k: "fileHome"; name } | { k: "taken"; where };
export type IntoGalleryOutcome = { k: "blank" } | { k: "settled"; identifier } | { k: "moved"; identifier; flushed: boolean };

export interface HomeKeeper {
  readonly home: Home; readonly stem: string; readonly named: boolean;
  identifier(): string | null; pending(): boolean; name(): string; fileName(): string;
  load(home: Home, o: { stem; named }): void;                        // 换歌（歌库 → 别处 = 放下 es 的身份）
  save(): Promise<SaveOutcome>;                                      // 存 = 回家：等着安家的有笔先安家；歌库 = gallery.save；文件 = 对表 + 写回；无地 = 保存框 / 下载
  rename(raw: string): Promise<RenameOutcome>;                       // 歌库 = tryMove；无地 = 改下次存的名字；文件 = 改不了
  leave(what: string, o?: { nextIsGallery?: boolean }): Promise<boolean>;   // 歌库 = 落盘 + 推不问；文件 / 无地 = 脏了先问
  settle(): Promise<void>; settleIfEdited(): Promise<void>;          // 首笔安家（单飞；途中换歌作罢）
  intoGallery(folder: string): Promise<IntoGalleryOutcome>;          // 无地 / 文件的稿放进歌库
  release(): void;                                                   // 放下歌库身份 → none
  noteChanged(): void;                                               // 1 s 心跳 + 每次 commit：歌库 → es.markDirty；等着安家 + 脏 → settle
}
export function createHome(init: { home: Home; stem: string; named: boolean }, ports: HomePorts): HomeKeeper;
```
规则都在一处：换家只经 `setHome`（同一个家 = 不叫 hooks；**歌库 → 非歌库 = `gallery.release()`**）；铸身份 = `mint`（歌名或默认名，撞名 `-hex4` 不加序号）→ `adopt`（家 = 歌库、名字定下来、`es.adopted(create)`、立刻 `flushLocal`；落盘失败 = 身份留着、报错、下一轮 autosave 再试）。

## 4. main.ts 这边

`const H = createHome(…)` 在 `D` 下面，ports 接 es / docFile / identifiers / D / confirmDiscard / askSheet / offerFile / reportError；`onHome` = `setActiveIdentifier` + last-doc 指针（歌库 = 它；放下身份 / 新建空谱 = 清掉；开本机文件不动——v0.6 起就这样，reload 回上一首歌库里的歌）+ 重画顶栏；`onName` = 重画顶栏。读家的地方（`syncKind` / `fileWhere` / 三条杠 / 顶栏 / 歌库接线 / 登录 / 快进 / beforeunload）全改成 `switch (H.home.kind)` 或 `H.identifier()`。`loadDoc` 的签名变成 `{ home: Home; stem; named; extras; view?; references? }`（6 处调用）。退场：`doc` 口袋对象、`markSaved` / `homeIfEdited` / `homing` / `homeNow` / `leaveCurrent` / `smartSave` / `stemOf`。E2E 钩子多 `home()`（家的种类）。

## 5. 量

| | 切之前 | 切之后 |
|---|---|---|
| 三种家的 if 链 | 19 处（main.ts） | 1 个文件（home.ts 的 switch）；main.ts 里只剩读 `H.home.kind` 的展示分支 |
| 改家的口子 | 6 个字段谁都能写（12 处赋值） | `setHome` 一处（私有） |
| 换家的副作用 | 每处各写（有漏） | `onHome` 一处 + 「离开歌库 = es.release()」一处 |
| main.ts 行数 | 3239 | 3233（+ home.ts 265） |
| 单元 | — | `test/home.test.ts` 19 条（名字 / 换家 / 存 × 三种家 / 安家 / 存进歌库 / 改名 × 三种家 / 离开 × 三种家） |
| E2E（没改期望） | — | store 55 / sync 38 / final 47 / undo 28 / save-keys 7 / speech-store / 两份冒烟 全绿 |

## 6. 行为上有变化的三处（都在错误路径 / 边角；界面没动）

1. **从歌库里的歌直接开本机文件（打开 / 拖进来 / 双击）= 放下 es 的身份**。以前不放（§2 末的漏洞）。现在 `load()` 任何歌库 → 非歌库的换家都 `es.release()`。
2. **「存进歌库」落盘失败 = 身份留着、下一轮 autosave 再试**（和首笔安家同一条政策；错照报）。以前把 `doc.identifier` 退回 null、`es` 却还举着新名字（下一轮 autosave 照样写进去、界面却说无地）= 半截回滚。
3. **last-doc 指针在换家那一刻写**（以前首笔安家 / 存进歌库是落盘成功后才写）。落盘失败时的差别：reload 会先试开那首（本机没字节 → 一条「打不开」+ 回歌库），以前直接回歌库。

没变的边角，记着：开本机文件不清 last-doc 指针（reload 回上一首歌库里的歌，不是回歌库）——v0.6 起如此，这次照旧，要改是产品决定。

## 7. 没做（下一刀）

- **全指令式**：`run(Command)` 只盖键盘那几十种命令；别的改动（setTitle / addPart / withTrack …）还是纯函数算 next 再 commit。家这边的动词同理还不是可序列化的指令（MCP / 多人要的那一层在它之后）。
- 视图态（desk）仍在 main.ts 的几个 `let` 里。
- `api/` 文件夹（家规 .h ritual 的生成物）本仓一直没建；这次照 doc 那一刀的先例把 .h 写在这份 doc 里。要不要补 `scripts/gen-api.sh` 等 user 说。

## 8. 同一个 v0.13.10 顺手做的两件（周账道 4 第二、三件）

- **F-67 挂机很久醒来先核云端再放行输入**（KudsRocket W-25 的 MoonSinger 那一半；user 10-15「就是防止一个挂机了一年的设备误覆盖新版本」）：`main.ts wakeCheck` + `config.ts WAKE_CHECK_AFTER_MS = 10 min`（AI 起的数）/ `WAKE_CHECK_TIMEOUT_MS = 20 s`。离开前台超过阈值回来 = 同步闸先锁住输入（没有按钮）→ `refreshOpenDoc`（干净的歌快进到云端；真有新版本那条路本来就锁到重载完）→ 放开。不锁的情形：短暂切走、没登录 / 离线 / 不在歌库、本机有没推上去的改动（库的快进本来就不动脏的，分叉留给下一次 consent 推的 412——推只在换歌 / 退出 / 按「存」，是人清醒着的动作）。超时先放开（正在换成云端新版本的那把锁归 refreshOpenDoc，不放）。E2E `sync.mjs` ⑧ 三条（干净醒来 = 锁 + 换成云端的；脏着醒来 = 不锁不动）。**周账 F-67 行写的「KudsRocket 有了（W-25）」对不上**：KudsRocket 仓里 W-25 还是 wishlist（src 里没有实现），这是家族第一份落地。
- **F-66 两条原有的红**（`scroll`「跟着滚时光标那行下面留一行」差 −148 px、`file-smoke`「填歌名」「又改了」时红时绿）：**同一个根因 = v0.13.0「画合并到下一帧」**——跟随滚动在 `view.render()` 里、顶栏在 `paintNow()` 里，都挪到了 rAF；两份测试紧跟着状态改动同步量，量到的是上一帧。不是产品 bug（晚一帧重画是那一刀要的）；测试等一帧 / `waitForFunction` 顶栏文字。scroll 10/10、file-smoke 24/24。
