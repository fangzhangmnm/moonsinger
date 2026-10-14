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
- 8710 没人听 = 自己起 `scripts/serve.sh`、跑完关；有人听 = 借用。**worktree 里别借主目录的 8710**（那是别人的构建）：`--port=8713` 自己起一口，或 `--base=`。
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

