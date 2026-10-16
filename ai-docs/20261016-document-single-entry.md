# doc 这一刀：文档的唯一入口（远景 §3 ②④「编辑模型 / 全指令式唯一入口」第一刀）

> created 20261016 by Claude Fable 5.1 · as-of v0.12.20（dev）/ 2026-10-16
> user 2026-10-16：「有一个写文件的窄接口吗？我们现在文件模型抽象出来了吗？」→ 答「字节出口有一个（saveMxl），状态入口有五个」→「这个做完之后开始切doc这一刀」「远景 §3 ②④…做」。
> 家规 API .h ritual：重构策划附两份 .h（现状 + 提案）。这份是**切完后补的**（user 当场点了「做」，刀先落、账后记）；提案 .h = 现在 `src/app/document.ts` 的签名。

## 1. 一句话

`src/app/document.ts createDocument()` = 一首歌在内存里的真相（谱的状态 `st` + 文件里的其余部分 `extras`）+ **改它的唯一入口 `commit()`** + 撤销栈 + 「改过没存」的基线 + 定稿的锁；不碰 DOM、不碰持久化（node 能跑、能测）。main.ts 里原来五个改状态的口子 + 三处直接写 `doc.extras =` 全部经它；界面的副作用收成三个 hook。指令式入口 `run(Command)` 也在它上面（E2E / 以后的 MCP 用 `__moonsinger.run`）。

## 2. 现状 .h（切之前，v0.12.19 的 main.ts）

```ts
let st: EditorState;                                   // 429 处裸读；3 处直接赋值（applyState / loadDoc / applyDesk）
const doc = { stem, named, handle, mtime, extras, identifier, pendingHome, saved };   // extras 141 处读、3 处直接写（loadDoc / restore / 定稿改稿）
let history: History;                                  // record 三处、undo / redo 各一处
let coverRev: number; const loungeKey: () => string; const dirty: () => boolean;   // 脏 = song 引用 + 休息室 JSON + coverRev + 参考窗 rev
function update(next, gesture?)        // 谱：锁判 + 规整 + record + applyState（视图副作用）
function updateExtras(next, locus, g?) // extras：锁判 + record + 一串副作用
function updateBoth(next, extras, l)   // 两个一起：锁判 + record
function applyState(next)              // 换 st + 视图副作用（update / updateBoth / restore 共用）
function restore(r, verb)              // undo / redo 落地：换 history / extras / st + 副作用 + toast
function undoNow() / redoNow()         // 锁判 + undo()/redo() + restore
function loadDoc(song, o)              // 直接写 st / doc.extras / history / doc.saved
function markSaved()                   // doc.saved = …
es.encode / es.onSaved                 // encodedSnap = { song, lounge, refs } / doc.saved = encodedSnap
finalizeNow / unfinalizeNow            // doc.extras = withFinal(...) / withoutFinal(...) + 手动叫一串副作用
```
症状：定稿的锁得在 update / updateExtras / updateBoth / undo / redo 五处各补一刀；谁改了状态而没走 update 就没有 undo、没有脏（v0.9.15 录音房「没有 mark dirty」就是这类）；想从外面（测试 / MCP）改状态只能 `__moonsinger.set` 绕过规则。

## 3. 提案 .h（= 现在的 `src/app/document.ts`）

```ts
export interface DocHooks {
  now(): number;
  onState(prev: EditorState, next: EditorState, moved: boolean): void;          // 谱换了之后（界面副作用）
  onExtras(prev: Extras, next: Extras, locus: Locus): void;                      // extras 换了之后
  onRefused(what: string): void;                                                 // 被锁拒了（人话）
  onRestored(r: Restored, verb: "撤销" | "重做", prev: { st; extras }): void;      // undo / redo 落地之后
  normalize?(next: EditorState): EditorState;                                    // 写之前的规整（纸头补力度；同一步、能一起撤销）
  extraDirty?(): number;                                                         // 文件之外也算脏的版本号（参考窗）
}
export interface CommitOpts { locus?: Locus; gesture?: string; undo?: boolean; silent?: boolean }
export type CommitResult = { ok: true; changed: boolean } | { ok: false; why: string };
export interface Document {
  readonly st: EditorState; readonly extras: Extras; readonly history: History; readonly final: FinalRecord | null;
  locked(): string | null;                                                       // 定稿着 = 为什么不能改
  commit(next: { st?: EditorState; extras?: Extras }, o?: CommitOpts): CommitResult;   // 唯一入口
  run(c: Command, o?: CommitOpts): CommitResult;                                 // 指令式：apply(st, c) → commit
  undo(): boolean; redo(): boolean;
  load(st: EditorState, extras: Extras): void;                                   // 换歌：栈清空、基线 = 现在、不叫 hooks
  dirty(): boolean; savedMark(): SavedMark; adoptSaved(m: SavedMark): void; markSaved(): void;
}
export function createDocument(init: { st; extras }, hooks: DocHooks): Document;
```
规则都在 commit 一处：锁（`isFinal(extras)` 且歌 / extras 变了且 locus 不是 `final` → 拒 + onRefused）→ 规整 → 进栈（`undo !== false`；gesture 1.5 s 内并步）→ 换真相 → hooks（`silent` = 不叫）。脏 = song 引用 ≠ 基线 ∨ 封面引用 ≠ ∨ 休息室 / 录音房 / 定稿 JSON ≠ ∨ 参考窗 rev ≠。

main.ts 这边：`update / updateExtras / updateBoth` 变成一行薄壳（九十多处调用不用改）；副作用 = `afterState`（原 applyState）/ `afterExtras`（原 updateExtras 后半）/ `afterRestore`（原 restore）/ `onLockRefused`；`loadDoc` → `D.load`；`markSaved` / es 的 encode / onSaved → `D.savedMark / adoptSaved / markSaved`；定稿 / 改稿 → `D.commit({ extras }, { locus: { kind: "final" }, undo: false })`（LocusKind 多了 `final`）；`applyDesk` 的输入态 → `silent` commit。`st` 的 429 处读 → `D.st`，`doc.extras` 141 处 → `D.extras`。E2E 钩子多了 `run / commit / locked`。

## 4. 量

| | 切之前 | 切之后 |
|---|---|---|
| 改状态的入口 | 5 个函数 + 3 处直接写 | 1 个（`D.commit`；main.ts 里 7 处调用 = 3 个薄壳 + load / desk × 2 / 定稿 × 2） |
| 定稿的锁在几处判 | 5 | 1 |
| main.ts 行数 | 3146 | 3131（+ document.ts 117；少的是 applyState / restore / loungeKey / coverRev 那些合并掉的） |
| 单元 | — | `test/document.test.ts` 7 条（commit / extras / gesture 并步 / 规整 / 脏 / 锁 / load） |

## 5. 没做（下一刀）

- **家（Home）**：`doc.identifier / handle / pendingHome / stem / named / mtime` 还是 main.ts 里的口袋对象，三种家（歌库 / 本机句柄 / 无地）的 if 链（`fileSave` / `homeNow` / `leaveCurrent` / `openStoreDoc` / `renameActive`…）没收。提案形状：`Home = { kind: "store"; identifier } | { kind: "file"; handle; mtime } | { kind: "none"; pendingFolder? }` + 一个 `save()` / `rename()` / `leave()` 接口，歌库那条已经有 editor-session 承重。
- **全指令式**：`run(Command)` 只盖键盘那几十种命令（`src/score/commands.ts`）；别的改动（`setTitle` / `addPart` / `withTrack` … 纯函数算 next 再 commit）还不是可序列化的指令。收编 = 逐个把 `update(f(D.st))` 变成 `D.run({ k: … })`，入口不用再动。多人 / MCP 要的「指令 = 可以传出去的数据」在那之后。
- 视图态（desk：范围 / 排法 / 静音独奏 / pad 的状态）仍在 main.ts 的几个 `let` 里，不在 Document（它们不进文件、不进 undo，按 WeebPaint 的 desk 分法本来就该分开；但「从外面读视图态」的口还没有）。
