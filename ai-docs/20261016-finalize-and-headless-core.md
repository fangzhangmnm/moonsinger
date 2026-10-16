# 定稿 / 改稿 + 无头渲染核心（W-38 落地）

> created 20261016 by Claude Fable 5.1 · as-of v0.12.18（dev）/ 2026-10-16
> 起因：user 2026-10-16「moonsinger: 加入之前我们讨论的锁模式（我记得你想了一个更好的名字），然后会渲染mp3预览，封面可以听。这个能优先做吗，顺便把相关的架构重构一起做好，我怕做架构之前做这个会把架构弄得更屎山了」；同轮追加「定稿的时候得从多个窄接口上护栏住写入，甚至store级别」。
> 名字 = 「定稿 / 改稿」（user 2026-10-13「定稿改稿同意」；候选留档在 wishlist W-38）。W-38 里「要先定的（都没问）」那几条，这次按下面 §4 的推荐稿落了，**都是推荐稿，不对立刻说**。

## 1. 一句话

写好的歌 ☰「定稿…」= 走**无头渲染核心**把整首渲成 mp3、裸字节存进 `.mxl`（`.moonsinger/final.mp3`，不压缩）+ 总目录一条记录；之后**四层护栏**把出声的内容锁住（只能听）；歌库封面右下角 ▶ 直接抓那份 mp3 放（不开歌）；「改稿」= 记录和 mp3 一起丢掉、回到写。核心从 `performance.ts` 抽成 `src/core/`，node 命令行 `scripts/render-song.mjs` 和浏览器调同一份。

## 2. 四层护栏（user「从多个窄接口上护栏住写入，甚至store级别」；瑞士奶酪：每层各自承重）

| 层 | 在哪 | 拦什么 | 拦不住时谁兜 |
|---|---|---|---|
| ① 界面 | `main.ts setMode`（只许「听」）、`applyWorkspace` 打 `body.doc-final`、styles.css（模式钮灰、乐器页卡 / 混音台条 `pointer-events: none` + 一行「定稿了：锁着」）、顶栏 `定稿 N` 角标 | 手指 / 鼠标点不到会改声音的东西 | ② |
| ② 状态入口 | `main.ts update()`（谱变了且不是只改元信息 → 拒 + `lockedSay`）、`updateExtras()`（除封面外全拒）、`updateBoth()`、`undoNow` / `redoNow` | 绕过界面直接 set（E2E 钩子、以后的指令式 API、漏接的回调） | ③ |
| ③ 格式 | `project.ts saveMxl()`：`extras.final` 在、算出来的出声内容指纹 ≠ 记录里的 → **抛** | ② 漏了的任何写 | ④ |
| ④ store 接缝 | `editor-session.ts persist()` 前问 `editor.canPersist()`（MoonSinger 答：指纹对不上 = 一句话）→ 这一轮不 encode 不 save、**脏留着**（顶栏「•」照亮）、同一代编辑只说一次 | ③ 抛了之后别乱（persist 的 catch 本来就还原脏）；也挡住 encode 之前就能看出的问题 | —（库本身 content-blind，再往下 = 改 @internal/store，没动） |

指纹 = `src/format/final.ts contentFingerprint`：每张纸的 MusicXML **整份**（只剥 `<encoding>` 的软件版本 + 日期）+ score.json（去 view）+ 休息室 + 录音房 + 嵌的音源路径 + 封面 PNG，sha256（同步实现 `sha256-sync.ts`，node:crypto 对照过）。**全冻**（user 10-16「都冻同意，封面当然进」）：定稿后能改的只有**文件名**和视图态；歌名 / 作者栏 / 许可 / 封面 / 纸都锁。（第一版推荐稿曾放开歌名 / 作者栏 / 许可 / 封面，user 当天否了：「作者许可应该也是跟着文件一起freeze的吧」——发行条款是定稿的一部分。）

读文件时也核一次（`openBytes`）：记录读不懂 / mp3 不在或大小不对 / 指纹对不上（旧版 app 或别的软件改过）= **定稿作废 + 说一声 + mp3 不带着走**（user「解锁之后mp3自动cache invalid」的另一半）。

## 3. 格式（红线区；不升版本，只加可选字段，shape.json 重冻）

- `manifest.core = { version, hash }` **每次保存都写**（user 10-13「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」）：version = `src/core/version.ts CORE_VERSION`（人定，出声可能变才 bump）；hash = `scripts/core-hash.mjs`（src/core src/engine src/singer src/performers src/score src/gm src/format + vendor/world vendor/tsf + assets/preview，sha256 前 16 位；build.sh `--define` 进 bundle，node 直跑 = "dev"，CLI 现算）。
- `manifest.finalRev`（定稿过几次；改稿不减）、`manifest.final`（`FinalRecord`：at / rev / app / core / fingerprint / mp3{path, bytes, sha256, secs, sr, kbps, stereo} / parts / issues?）。
- entry 顺序改了：`…sounds → references → final.mp3 → unknown → manifest.json → thumbnail.png`——总目录和封面都在 store 尾读的 128 KB 窗里，歌库一次尾读既拿封面也看得到定稿记录；mp3 另抓（本地 = Blob.slice，云端 = byte-range）。老版本 app 读到 = `final` 键和 entry 原样写回（它不认，也不锁；指纹会在下次新版 app 打开时抓到改动）。
- 守卫：`test/final.test.ts`（指纹稳定 / 往返 / 元信息不进 / 锁 / 作废三种）、`format-guard`（shape.json 多了 final / finalRev / core）、冻结样本带定稿。

## 4. 这次按推荐稿定下的（W-38「要先定的」）

| 问题 | 定的 | 为什么 |
|---|---|---|
| mp3 放哪 | 歌文件里一个 entry | user 原话「这样也不会上传覆盖mp3的体积不疼」= 跟歌走；改名 / 挪夹 / 回收站一起动 |
| 存的 mp3 带不带 ID3 | **带**：歌名 / 作者 / 许可 / 署名 / 软件 + 封面图（APIC）；导出 = 原字节 | 存的就是发行的那一份（user「都冻同意，封面当然进」；第一版「裸 mp3 导出时现贴」撤了） |
| 定稿锁着时歌名 / 封面 / 署名算不算改 | 算（锁） | user「作者许可应该也是跟着文件一起freeze的吧」 |
| 静音 / 独奏 | 按定稿那一刻的（同导出），记进 `final.parts` | 「听到什么就定稿什么」；视图态不是歌的内容、不进指纹 |
| 歌的自增版本号 | `rev`：每次定稿 +1，改稿不减；顶栏角标「定稿 N」、面板「第 N 版」 | user「我是说歌的自增版本号哈哈哈」；留到 grill 的只有「显示在哪」——先放顶栏 |
| 定稿 / 改稿进不进 undo | 不进（定稿 = 一次渲染；撤销 = 改稿） | 撤销定稿等于偷偷作废 mp3 |
| 定稿着在 app 里放 | 照旧走实时引擎（同一份数学） | mp3 回放要另做一套走带；核心同版 = 一样；没验「逐字节」 |
| 歌库怎么知道定稿了 | 尾读总目录（内存记，不另开持久缓存） | 家规「派生缓存逐案批」；总目录和封面同一个尾窗，几乎免费 |
| 歌库 ▶ 怎么接 | 覆盖槽里一颗钮，宿主 CSS 给它 `pointer-events: auto`，capture 阶段拦住卡片的「点 = 打开」 | 图库包只给了「不吃指针事件的覆盖槽」；改包 = 内部库 minor，要 user 批，先不动 |
| 背景播放 / 单曲循环 | `<audio>` + Media Session（play / pause / stop）+ 播放条上「循环」；v0.12.23 起播放器 = `src/app/song-player.ts`（点下先拿许可、开始放后登记锁屏、报状态和进度、锁屏封面；edited by Claude Opus 5.5 2026-10-16） | iPad 主屏 PWA 后台放不放得出来**没验** |

## 5. 无头渲染核心（`src/core/`；远景 §3 ③「无头渲染」第一刀）

```ts
// src/core/render.ts —— 平台无关；只 import score / engine / performers / format
export interface RenderEngine { hasBank; bank; presetIndex; vowels; hasChunk; chunk; channel; buses; master; renderOffline }   // 浏览器 StudioClient / node OfflineStudio 都满足
export interface RenderSounds { resolveGmBytes(g: GmCandidate): Promise<Uint8Array>; ensureVowels(): Promise<void> }
export interface RenderDeps { engine: RenderEngine; sounds: RenderSounds; sing(tl: Timeline, progress): Promise<void> }   // sing = 把缺的块唱出来喂进 engine
export interface RenderPlan { song; extras; hum; parts: PartDef[]; mixBypass?; busMuted? }
export const humOpt: () => Record<string, unknown>;          // 歌级哼的参数（从 performance.ts 搬来）
export function audibleParts(song, pv): PartDef[];           // 静音 / 独奏筛
export function performerInfoOf(extras, part, presetIndex): PerformerInfo;
export function prepareParts(parts, extras, deps): Promise<PrepareError[]>;
export function mixParamsOf(plan, pv): { channels; buses; master };   // 通道 / 总线 / 总轨（resolveChain 搬到 src/engine/chain.ts）
export function pushMix(engine, plan, pv): void;
export function timelineOf(plan, presetIndex): Timeline;
export function renderSong(plan, deps, { sr?, progress?, pv?, onPrepared? }): Promise<RenderResult>;   // 准备 → 时间线 → 块 → 混
// src/core/offline-studio.ts —— RenderEngine 的 node 实现：状态记着，renderOffline 时新开一个 Studio 灌进去跑到尾（同 StudioClient.renderOffline 的块网格）
export class OfflineStudio implements RenderEngine { constructor(wasm: WebAssembly.Module | BufferSource) }
// src/core/version.ts
export const CORE_VERSION: string; export const CORE_HASH: string; export const coreInfo(): { version; hash };
```

- 浏览器：`performance.ts` 的 `prepare()`（播放）用核心的 `prepareParts / timelineOf`，`pushChannels` = `pushMix`，`exportSong` / 定稿 = `renderMp3()` → `renderSong`（sing 注入 = 原来的泵 `awaitAllChunks`）。performance.ts 580 → 576 行（照搬的函数换成了调核心）；main.ts 3060 → 3146（定稿 / 改稿的面板 + 四层护栏 + 钩子）。
- node：`npm run render -- 歌.mxl [--out=x.wav|x.mp3] [--mono] [--kbps] [--sr] [--piper=…] [--sounds=…] [--check]`。音源 = 歌里嵌的 / 音源库下到临时目录按 sha256 留；小月相（完整版）= 检疫桶里的 piper 壳（同 bench-engine；没有 = 那些声部不出声、报出来）；英文还不会唱（朗读库的英文前端只打进了 worker）。`--check` 只报核心版本 / 定稿记录。冻结样本实测：16.5 s 两条轨（小月相一句 + 嵌的响板）2.7 s 渲完，wav / mp3 都出。
- 守卫：`test/core-render.test.ts`（node 整首渲、确定性、效果全关只管播放、准备报错不挡别人）。

## 6. 没做 / 要 user 定

- ~~定稿着在 app 里放 mp3 而不是实时引擎~~ → **user 2026-10-16 定：「编辑器里走实时」**。定稿的歌在编辑器里按 |▶ 照旧走时间线 + 录音房 + 小月相现唱（同一份数学）；只有歌库封面上放存的那份 mp3。不做。
- **图库包的接口** → **user 2026-10-16「图库包批了」**：gallery 0.8.0 加 `ui.tileAction`（卡片右下角一粒动作钮，点了不开卡）+ `policy.facts`（卡片的「事实」尾读：缓存 / 并发 / 字节变了重取 / 响应式重画，同缩略图那套）；宿主那三处绕路（CSS 放行 / capture 拦点击 / MutationObserver 扫）拆掉。
- **iPad 真机**：后台播放 / 锁屏控件、▶ 的手感、`CSS.escape` 在 Safari 都没验。
- **封面图进 mp3 只有 PNG（歌库卡片那张 ≤ 256²）**：要大图得另存一份原图，W-30 一起想。
- **歌库卡片上「定稿」字样**：现在只有 ▶ 亮不亮；要不要再印一枚「定稿 N」= 封面排版的事（song-cover.ts）。
- **W-30 自动预览图**没碰；定稿时顺手生成是个自然的入口（要光栅化，家规「字节进出不走 canvas」）。
- **定稿时记的 issues** 只存不显示（面板上定稿前显示一次）。
- **核心版本 bump 纪律**：CORE_VERSION 0.1.0 起；改唱法 / 录音房数学 / 效果器 / 元音表 = patch。AI 看着办；写进 version.ts 头注释。
- `api/` 的 .h ritual 本仓还没立（上一轮也是写进 ai-docs）；核心的 .h 在 §5。
