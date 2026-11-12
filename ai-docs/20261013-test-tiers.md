# 测试分档（W-20 / 家族周账 F-9）：改了哪类东西跑哪一档

> created 20261013 by Claude Fable 5.1 · as-of v0.11.5（dev）/ 2026-10-14（节奏按 user 10-14 改：先推 dev 再验）
> user 2026-10-11：「wishlist，之后让fable设计一个测试计划，不然现在感觉全量测试每次改一点点都要30分钟，就不大好」「就是让fable整理一下测试，以及tier机制」「E2E是什么，这个蛮伤敏捷开发的，到时候fable需要做测试分级」。
> 家规硬线：全量测试 < 1 分钟（MEMORY「长跑纪律」）。

## 0. 一句话

账全在 E2E 上：单元 3 秒、类型 3.5 秒、构建 3.6 秒，E2E 串着跑 8 分钟。改法不是砍测试，是**三档 + 一张「源码路径 → 该跑哪些 E2E」的表 + 一个并行运行器**：每改一下只跑 `npm run check`（< 10 秒）；改完一块跑它那一区的 E2E（几秒到 45 秒）；推 dev 之前整套 E2E 并行（1 分 21 秒）。

## 1. 量过的数（2026-10-13，本机 WSL，16 核，空载；测的都是 main `3078eee` 的代码）

| 什么 | 命令 | 时长 | 备注 |
|---|---|---|---|
| 类型检查 | `npm run typecheck` | 3.5 s | |
| 单元 + 三份守卫 | `npm test` | 2.9 s（730 条） | 之前记的「十几秒」今天量不到 |
| 构建（含 tsc + 接缝 lint） | `npm run build` | 3.6 s | |
| 两份冒烟（真浏览器 + 真 SW） | `npm run smoke` | 39 s | 各自起服务 |
| itch 夹具 + 备用版烟测（2026-11-03 家族工单 A，Claude Opus 5.5） | `npm run fixture:itch` / `npm run smoke:local` | 打包 ≈ 30 s + 各 ≈ 10 s | 先打包（整站 zip / 双击文件夹，要兄弟仓 PWA Models / PWA Sounds 在本机）；无头；`test:full` 末尾串着跑 |
| 60 个 E2E 串着（旧 `npm run e2e`） | — | 484 s = 8 m 04 s | 全绿；最慢 follow 44 s · hscroll 38 s · singer-delete 36 s · store 32 s；`waitForTimeout` 共 796 处，store 一个文件就睡 29 s |
| 60 个 E2E 并行 8 条（新 `npm run e2e`） | `node test/e2e/run.mjs` | **1 m 21 s** | 下限 = 最慢那个文件（follow 44 s）；机器几乎在睡觉，不是在算 |

所以之前「每改一点都要 30 分钟」= E2E 8 分钟 × （跑一遍 + 反证一遍）+ 构建 + 看输出，并且 `&&` 串着第一个红了后面全不跑、修一个再来一轮。

## 2. 三档

| 档 | 命令 | 多久 | 什么时候 |
|---|---|---|---|
| **T0 快门** | `npm run check`（= typecheck + 单元 + 守卫） | < 10 s | **每改一下都跑**。纯函数（`src/score` / `src/format` / `src/engine` / `src/singer` 的算法）的正确性主要靠这一档，E2E 只是接线。 |
| **T1 这一区** | `node test/e2e/run.mjs @区名…` 或 `… 文件名子串…` 或 `… --changed` | 几秒 ～ 45 s | 一块改完、commit 之前。**反证（换回旧代码再跑一遍）只在这一档做**，不跑整套。 |
| **T2 整套** | `npm run e2e`（60 个 E2E 并行） | ≈ 1.5 min | **先推 dev、再跑整套**（user 2026-10-14「先推dev，我先看到，然后你开始验证。人类时间更宝贵」）：推完立刻跑，红了修了再推一次；人在的时候 user 有权打断 suite；整夜挂机 / 没人盯着的时候这一档的反馈就是你唯一的眼睛，必须跑完、按结果行动（user「如果是整夜挂机的话test suite的反馈对你也很重要吧」）。 |
| **T2 + 壳** | `npm run test:full`（check + 整套 E2E + 两份冒烟一起并行） | ≈ 2.5 min | push prod 之前；bump minor 之前；碰了离线壳 / 图标接线 / build.sh / index.html 之后。 |

`--changed` 自己看 git 改了什么（相对 HEAD + 未跟踪的）、按 §3 的表推出区，并把每条推理打出来。改了某个 E2E 文件本身 = 只跑它自己。

## 3. 源码路径 → 区（SSoT = `test/e2e/areas.mjs`，这里只是抄一份便于看）

| 改了什么 | 区 | 为什么 |
|---|---|---|
| `src/ui/score-view.ts`、`src/render/**` | @score | 谱面手势 / 排版 |
| `src/score/**`（perform / groove / repeats / lab-score / arrange 另加 @play） | @score @pad | 乐谱数据与命令，pad 写进去的就是它 |
| `src/keyboard/`（pad / keys / latch / wheel / drum；param-row 也归 @studio @play）+ `src/ui/` mark-editor / sel-bar | @pad | 键盘与锁 |
| `src/ui/lyric-editor.ts` / title-editor | @pad @score | |
| `src/ui/studio.ts` / plugins / scopes / spectrum / param-row / part-colors / metronome / render-progress；`src/engine/**` `src/gm/**` `src/singer/**` | @studio @play | 录音房、引擎、月读 |
| `src/app-store.ts` / identifiers / encryption / `src/app/doc-file.ts` / `src/ui/sheets.ts` / song-cover / `src/editor-session/**` | @store | 文件、云、歌库 |
| `src/format/**` | @store @export @score | 开 / 存 / 导出都过它；**守卫在单元里**（format-guard） |
| `src/core/**`（无头渲染核心，2026-10-16） | @play @studio @export @store | 播放的准备 / 导出 / 定稿都过它；node 整首渲在单元里（core-render） |
| `src/gallery-host.ts`、`src/editor-session/**` | @store | 歌库屏（封面 ▶ 放定稿的 mp3）、落盘前的门（canPersist） |
| `src/export/**` | @export | PDF |
| `src/app/reference-host.ts` / ref-transcode | @ref | |
| `src/app/workspace.ts` | @modes @pad @score | 模式表 |
| `src/ui/finder.ts` | @pad @studio | 乐器目录 |
| `assets/**` | @play @export | 元音表、字体 |
| **`src/app/main.ts`、`styles.css`、`index.html`、`package.json`、`scripts/build.sh`、`vendor/**`、report-error / diag-ui / resource-watch / icon.ts** | **整套** | 中枢，谁都可能动。main.ts 是现在的 god file（10-06 起 441 个 commit 里碰了 194 次）——F-13 / F-17 把唱歌胶水、状态机抽出去之后这一行会变短 |
| `service-worker.js` / `manifest.webmanifest` / `src/app/pwa-shell.ts` / 图标 png svg | 冒烟 | 运行器只提醒 `npm run smoke`；单元 icon-wiring 守接线 |
| `test/e2e/x.mjs` | 它自己 | |
| `ai-docs/` `weekly/` `CLAUDE.md` `README.md` `src/version.ts` `api/` `test/`（非 e2e） | 没有 E2E 管 | 只跑 T0 |
| 其余没登记的 `src/**` | 整套 | 宁多跑不漏跑；登记了再缩 |

规矩：**新加 E2E 文件必须登记进 `AREAS`**，否则 `test/e2e-areas.test.ts` 红（`npm test` 里）——分档靠这张表，漏登记 = 那一档静默漏跑。表里列了不存在的文件同样红。

## 4. 运行器 `test/e2e/run.mjs` 做了什么、没做什么

- 并行 N 条（默认 min(8, 核数 − 2)，`--jobs=N`），每个 E2E 文件照旧是独立进程、独立浏览器 / context，互不共享状态（两份冒烟各自起服务、不占 8710，`--smoke` 一起并行）。
- ~~8710 没人听 = 自己起 `scripts/serve.sh`、跑完关；有人听 = 借用~~ → **2026-11-12 起：整套跑的是开跑那一刻冻住的一份**（统筹定的规矩；同一类出过两次：跑到一半重新构建、跑的时候样式先改在工作区里）：`scripts/serve.sh` 的清单（`--list`）拷进一个新的临时目录（`SERVE_DIR`），服务只端它，跑完关掉、删掉；端口从 8720 往上找空的（`--port=N` 指定），不借 8710；开头和结尾印这一轮对应哪个提交、端出去的有没有没提交的改动（E2E 脚本本身每份开跑时从工作区读，也印出来）。`--base=` = 明着跑那边端的东西，不冻。反证（11-12）：开跑后往工作区样式加一条把混音台压成一列的规矩，冻住的这一轮 mixer-narrow 6/6 绿；同一条规矩用 `--base` 指工作区服务跑 = 5 条红。worktree 里照样直接跑（冻的是那个 worktree 自己的文件）。edited by Claude Opus 5.5 2026-11-12
- 慢的先跑（时长缓存 `.e2e-times.json`，gitignored），红了继续、最后一起列失败行；`--list` 看分区和没分区的。
- **没做**：砍那四个慢文件的睡眠（store 29 s、follow 13 s、lift 10 s、mixer-fx 10 s 的 `waitForTimeout` 字面量；并行之后它们只是下限，不是账）；CI（deploy.yml 只部署、不跑测试，和兄弟一样）；按失败重试（flaky 应该修测试，不该重试——见下）。
- 顺手修的一条 flaky：`playhead.mjs` 原来开播后固定睡 600 ms 就采第一个高亮，机器忙（并行）时还没画 → 红；改成等到画出来为止（≤ 3 s）再比两次。**写 E2E 的规矩**：等「状态到了」用轮询（`waitForFunction` / 自己 for 循环），不要用固定毫秒猜机器多快。
- `follow.mjs` 小屏那条（收工账说「老红一直跳过」）今天三轮都是绿的（9/9），没动它；之前为什么红没查。

## 5. 给下一个 session 的操作卡

```
改一下 → npm run check
改完一块 → node test/e2e/run.mjs --changed     （或 @pad / @score / 文件名）
          反证：换回旧代码，再跑同一条命令，看它红
推 dev → 立刻 npm run e2e                         （≈ 1.5 min；人在 = 先让他看到，红了修了再推；没人 = 跑完按结果行动）
推 prod / bump minor / 碰了壳 → npm run test:full （≈ 2.5 min）
加了 E2E → 登记进 test/e2e/areas.mjs（不登记 npm test 红）
```

## 补：E2E 跑的是 `dist/`，不是 `src/`（2026-10-14 踩坑，edited by Claude Fable 5.1）

`test/e2e/run.mjs` 起的 `scripts/serve.sh` 只端出 `dist/`（esbuild 的产物），**不构建**；deploy workflow 也只发 committed 的 dist。所以改了 src 不 build 就跑 E2E = 跑的是上一次 build 的 bundle（v0.12.1 的那轮 E2E 就是这么白跑的，当时 dist 还是 v0.12.0 的）。现在 `npm run e2e` / `npm run e2e:changed` 都先 `npm run build`（3–4 s）；直接 `node test/e2e/run.mjs …` 的话自己先 build。bump 之后同理：build 完的 dist 必须和源一起 commit，不然 dev 站还是旧的。

## 补：并行红的自动单跑一遍（2026-10-14，edited by Claude Fable 5.1）

8 条并行时 follow / routing / mixer-fx 这类「放着 = 表上有数」「翻谱提前量」的用例一再红、单跑绿（抢同一台机子，时间假设迟到）。`run.mjs` 现在把并行红的文件在最后**单跑一遍**：单跑绿 = 算过、但在总结里明说「并行红、单跑绿（负载 flake）」（不静默洗白）；单跑也红 = 真红。`--no-retry` 关掉（查 flake 本身时用）。真修法仍是把那些用例的固定等待改成「等到为止」（mixer-fx / routing / playhead / sung-preview 已改）。

## 补：脚本链里别让 `| tail` 吞掉 build 的退出码（2026-10-14 深夜踩，edited by Claude Fable 5.1）

`npm run build 2>&1 | tail -1 && git commit …` 这种链，管道的退出码是 tail 的（0），build 红了也照样 commit——v0.12.7 第一笔就这么带着一个类型错 + bump 前的 dist 推了上去。要么 `set -o pipefail`，要么把输出写进文件再看 `$?`。

> 2026-10-15 补（Claude Fable 5.1）：**已知 flake**（并行红、单跑绿 = 负载；`follow` 单跑也会随机红，一次红在不同的 check 上——放着翻谱那条测的是时序，v0.12.16 单跑 9/9、v0.12.17 两次单跑一红一绿；不是这一轮改出来的，刀 2 之前就记过「follow 单跑也随机红」）：follow / routing / seg-jump / sing-chunks。红了先单跑；follow 的时序判据值得专门修一次（候选：把「等一拍」改成等事件）。

## 补：单任务超时（2026-11-03，edited by Claude Opus 5.5；家族周账 F-144）

运行器给每个任务一个硬超时，默认 300 s（现在最慢的 `follow` 45 s），`--task-timeout=秒` 可调。到点杀掉整组进程、记成红、接着跑别的，并行红的照旧单跑一遍。起因：2026-11-03 `sync.mjs` 卡死过两次，运行器会一直等、一行都不印。

## 补：量时长用单调钟（2026-11-08，edited by Claude Fable 5.1）

上面两处记的「`follow` 单跑也会随机红」「时序 flake」，根因找到了，不是负载：**这台机器（WSL2）的墙上钟大约每 32 秒被系统对时往回拨 1.7–1.9 秒**（node 里每 100 ms 比一次 `Date.now()` 和 `performance.now()`，75 秒里拨了 3 次）。

- `follow` 给每次采样打 `Date.now()`，再找「换行之后 450 ms 的那一次」；回拨之后找到的是别的采样。新旧版本各跑三次都是红两次。
- `gate` 的「硬超时 8 s 左右」在 node 侧拿 `Date.now()` 量，撞上回拨量成 6.2–6.6 s；页面里实际等了 8001 ms。
- 规矩：**E2E 里量时长、给采样排先后，一律 `performance.now()`**（node 和页面里都有，不被对时拨）。守卫 = `test/e2e-areas.test.ts`「E2E 里不用墙上钟量时长」；真要墙上钟的行尾写 `// wall-clock-ok`。
- 还没改的同类隐患：`pad-follow` / `cast-back` 每次从外网下 32 MB 音源（本地 serve 的 `pwa-sounds/` 是 404），30 秒下不完就红——那是网络，不是钟。

## 补：专项——慢的、要外网的，平时的整套不跑（2026-11-08，edited by Claude Fable 5.1）

user 11-08：「话说我们的测试是不是花的时间太长了？之前我不是让 Fable 设计过测试分级制度吗？…如果有些比较复杂的功能，确实要测试那么长也可以，就只是说不应该每次测试的时候都测试，而说比如说我们专攻测试这些东西的时候可以全量测试，但是如果每次测试都要等那么久就不行。」

量出来的（同一天，91 份并行 8 条）：整套 7 分 53 秒，而这份文档写的时候是 60 份 1 分 21 秒。多出来的时间几乎全在三份上：

| 文件 | 一份多久 | 为什么慢 |
|---|---|---|
| gate | 单跑 2 分钟；并行时撞过 5 分钟的硬超时 | 172 条、三十来幕，每幕新开页面；好几幕要真等 8 秒的超时 |
| folder-home | 3 分 07 秒 | 搬家流程一首一首走 |
| i18n-en | 3 分钟 | 英文界面走四种屏幕的全部页面 |

另有三份（audition-banks、cast-back、pad-follow）点「上场」要从外网下 32 MB 的音源，网慢就红，和代码无关。

**分法**：这六份登记在 `test/e2e/areas.mjs` 的 `SLOW`（每条带 why = 为什么归专项、when = 改到哪些源码就该跑它）。

| 你在做什么 | 跑什么 | 大约多久 |
|---|---|---|
| 改一下 | `npm run check` | 10 秒以内 |
| 改完一块 | `node test/e2e/run.mjs --changed`（按改动推区；专项只在改到它 `when` 里的源码时带上） | 几十秒到一分半 |
| 平时的整套 | `npm run e2e`（85 份，不含专项） | 一分钟出头（下限 = 最慢的普通文件） |
| 专门查某一块 | 点名：`node test/e2e/run.mjs gate` | 那一份的时间 |
| 推正式版 / 专攻测试 | `npm run test:full`（`--all`：含专项 + 冒烟） | 八分钟上下 |

运行器每次都会印出没跑的专项是哪几份、为什么、怎么跑（不静默跳过）。按区跑（`@store`）同样不带专项。守卫：`test/e2e-areas.test.ts`「专项」那一条。

**没做**：把这三份慢的本身改快（gate 那几幕真等 8 秒的可以把超时注小；folder-home / i18n-en 可以拆）；三份要外网的改成不靠外网。都是单独的活。
