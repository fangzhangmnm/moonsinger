// test/e2e/areas.mjs —— E2E 的分区表（W-20 测试分档；user 2026-10-11「就是让fable整理一下测试，以及tier机制」「E2E…到时候fable需要做测试分级」）。
//   回答的问题 = 「改了哪类东西必须跑哪一档」：源码路径 → 区（AREA_OF_PATH），区 → E2E 文件（AREAS）。
//   test/e2e/run.mjs 用它：`node test/e2e/run.mjs @pad` 跑一个区；`--changed` 按 git 里改了什么自动推。
//   test/e2e-areas.test.ts 守：每个 E2E 文件至少属一个区、表里列的文件都存在——新加 E2E 没分区 = 单元测试红，不许静默漏档。
//   一个文件可以属几个区（它守的事跨区）。区名小写英文，`all` 是保留字 = 整套。
// created 2026-10-13 by Claude Fable 5.1。细则 = ai-docs/20261013-test-tiers.md。

/** 区 → E2E 文件名（不带 .mjs）。 */
export const AREAS = {
  // 谱面：手势（点 / 长按 / 拖 / 框选 / 把手）、排版、显示、谱上记号
  score: ["layout-count", "header-hit", "header-panel", "dropdown", "expressions", "hairpin-to", "minor-key", "credits-listen", "chord-pick", "clef-section", "pad-paradigm", "select", "finger", "rest", "row-pin", "lift", "lit-box", "sel-tweak", "top-sels", "undo", "caret-end", "clef", "auto-ottava", "shared-staff", "hscroll", "only1", "text-lang", "notice-dodge",
    "zoom", "ctrl-zoom", "dock-zoom", "scroll", "swell-art", "phrase", "repeat", "transpose", "arrange", "pad-ghost", "listen-ghost", "start-dyn",
    "lyric-dash", "lyric-mute", "reading", "stack-caps", "measure-follow", "follow", "title-keys", "overlay-touch", "status-hit", "jianpu", "part-names", "pedal", "pedal-default", "tall-group", "habits-card", "born-looks"],
  // 键盘（pad）：音键 / 符号格 / 几种锁 / 歌词框 / 记号菜单
  pad: ["unplug", "mono-later-wins", "stack-caps", "pad-key-auto", "view-in-c", "chord-tags", "pad-toggle", "pad-ghost", "dyn-levels", "ramp", "groove", "clef", "repeat", "finder-keys", "modes", "landscape-widgets",
    "dock-zoom", "save-keys", "swell-art", "start-dyn", "lyric-dash", "phrase", "sel-tweak", "title-keys", "midi", "pedal", "pedal-default", "dock-side", "finder-width", "finder-memory", "finder-names", "cast-back", "audition-banks", "part-toggles", "finder-accordion", "finder-hide", "finder-trynew", "header-panel", "pad-follow"],
  // 放：走带 / 循环 / 翻谱 / 播放头 / 节拍器 / 月读的块与预听
  play: ["transport", "put-down", "loop", "loop-memory", "follow", "measure-follow", "playhead", "seg-jump", "metronome", "progress", "sing-chunks", "sing-stale", "sung-preview",
    "listen-ghost", "lyric-mute", "reading", "ramp", "groove", "repeat", "arrange", "issues", "sing-experiments", "audio-revive", "perf-spec"],
  // 录音房：混音台 / 插件 / 路由 / 总轨 / 歌手管理
  studio: ["mixer-fx", "mixer-height", "mixer-narrow", "routing", "master", "singer", "singer-delete", "parts-manager", "paper-adds", "inst-split", "finder-pins", "finder-sf2", "finder-presets", "landscape-widgets", "modes", "dyn-levels", "sing-experiments", "performer-db", "performer-defaults"],
  // 歌库 / 云 / 文件 / 念缓存
  store: ["csp", "store", "sync", "gate", "folder-home", "speech-store", "save-keys", "render-cache", "factory-reset", "legacy-dbs", "gallery-marks", "edit-lock", "edit-lock-gallery", "link-open", "settings-libs", "lib-removed", "song-panel", "loop-memory"],
  // 导出
  export: ["pdf", "pdf-wysiwyg", "issues", "render-cache"],
  // 参考窗
  ref: ["reference"],
  // 界面语言：英文巡检（剩下的中文、撑爆的控件）
  i18n: ["i18n-en", "finder-width"],
  // 模式与底座（workspace.ts 那张表）
  modes: ["unplug", "modes", "typing-keys", "title-modes", "mixer-rows", "pad-toggle", "dock-zoom", "top-sels", "landscape-widgets", "listen-ghost", "finder-keys", "midi", "dock-side"],
};

/** 专项（2026-11-08 Fable；user「如果有些比较复杂的功能，确实要测试那么长也可以，就只是说不应该每次测试的时候都测试…专攻测试这些东西的时候可以全量测试」）：
 *  单个文件就要一分钟以上、或者要连外网的 E2E。**平时的整套不跑它们**——只在这三种时候跑：改到了它管的源码（下面每条的 when）、点名（`node test/e2e/run.mjs gate`）、`--all`（推正式版那一档，`npm run test:full`）。
 *  量过（2026-11-08，91 份并行）：gate 2–5 分钟、folder-home 3 分钟、i18n-en 3 分钟——整套 7 分 53 秒里它们三个占了大头；去掉之后整套的下限 = 最慢的普通文件（一分钟出头）。
 *  audition-banks / cast-back / pad-follow 点「上场」要从外网下 32 MB 的音源（本地 serve 的 pwa-sounds/ 是 404），网慢就红，和代码无关。
 *  why = 说给人看的（运行器跳过时印出来）；when = 改到这些路径就该跑它。 */
export const SLOW = {
  "gate":           { why: "2–5 分钟", when: /^src\/cloud-gate\.ts$|^src\/store-ui\.ts$|^src\/app-store\.ts$|^src\/config\.ts$|^vendor-pkgs\/|^test\/e2e\/cloud-bridge\.mjs$/ },
  "folder-home":    { why: "3 分钟",   when: /^src\/library-home\.ts$|^src\/app\/move-songs\.ts$|^src\/app-store\.ts$|^vendor-pkgs\/|^test\/e2e\/fake-fsa\.mjs$/ },
  "i18n-en":        { why: "3 分钟",   when: /^src\/i18n\// },
  "audition-banks": { why: "要外网下 32 MB 音源", when: /^src\/sources\/|^src\/ui\/finder\.ts$|^src\/gm\/(catalog|sound-cache|sounds\.gen)\.ts$/ },
  "cast-back":      { why: "要外网下 32 MB 音源", when: /^src\/sources\/|^src\/ui\/finder\.ts$|^src\/gm\/(catalog|sound-cache|sounds\.gen)\.ts$/ },
  "pad-follow":     { why: "要外网下 32 MB 音源", when: /^src\/keyboard\/pad\.ts$|^src\/app\/pad-host\.ts$|^src\/sources\// },
};
/** 改了这些路径，该跑哪些专项。 */
export function slowFor(paths) { return Object.entries(SLOW).filter(([, v]) => paths.some((p) => v.when.test(p))).map(([k]) => k); }

/** 不是测试的 E2E 目录成员（运行器和分区守卫都跳过）。 */
export const HELPERS = ["fake-fsa", "pw", "cloud-bridge", "run", "areas", "dd"];

/** 源码路径 → 区。从上往下第一条匹配的算（正则按仓根相对路径匹配）。"all" = 整套；[] = 没有 E2E 管它（只跑单元 / 冒烟）。
 *  "smoke" 不是 E2E 区：命中 = 运行器提醒你跑 npm run smoke（壳 / 文件逃生口在那里守）。 */
export const AREA_OF_PATH = [
  // 改了某个 E2E 自己 = 跑它自己（运行器单独处理，这里只要不落到 all）
  [/^test\/e2e\//, []],
  [/^test\//, []],
  [/^(ai-docs|weekly|journals?|docs)\/|^(CLAUDE|README)\.md$|^src\/version\.ts$|^api\//, []],
  // 中枢：谁都可能动 → 整套（main.ts 是现在的 god file，拆出去之后这条会变短；F-13 / F-17）
  [/^src\/app\/main\.ts$|^styles\.css$|^index\.html$|^package\.json$|^scripts\/build\.sh$|^vendor\//, "all"],
  [/^src\/app\/(report-error|diag-ui|resource-watch|document|home)\.ts$|^src\/ui\/icon\.ts$/, "all"],   // document.ts = 改状态的唯一入口（2026-10-16）、home.ts = 家 / 存 / 离开的唯一入口（2026-10-21）：谁都经它们
  // 壳：离线壳 / 图标接线 → 冒烟（shell-smoke）+ 单元 icon-wiring
  [/^service-worker\.js$|^manifest\.webmanifest$|^src\/app\/pwa-shell\.ts$|^icon.*\.(svg|png)$|^apple-touch-icon.*\.png$/, "smoke"],
  // 谱面 / 排版 / 乐谱数据
  [/^src\/ui\/score-view\.ts$|^src\/render\//, ["score"]],
  // 谱面上面那一层（覆盖层，刀 1 = 2026-11-08）：两颗钮 / 虚线框 / 曲段控件 / 「隐藏 N」/ 提示——它的 E2E 散在谱面、键盘、录音房三个区
  [/^src\/ui\/score-overlay\.ts$/, ["score", "pad", "studio"]],
  [/^src\/score\/(perform|groove|grooves\.gen|repeats|lab-score|arrange)\.ts$/, ["score", "play"]],
  [/^src\/score\//, ["score", "pad"]],
  // 键盘模块（src/keyboard/，刀 2 = 2026-10-15）：pad / 键位表 / 锁；滚轮 / 参数行是 W-5 原语，混音台也用
  [/^src\/keyboard\/(wheel|param-row)\.ts$/, ["pad", "studio", "play"]],
  [/^src\/keyboard\//, ["pad"]],
  // 谁都能用的小控件（src/widgets/，2026-11-11 起：滚轮 = pad 的旋钮 + 谱面的记号框）
  [/^src\/widgets\//, ["pad", "score"]],
  [/^src\/ui\/(mark-editor|sel-bar)\.ts$/, ["pad"]],
  [/^src\/ui\/(lyric-editor|title-editor)\.ts$/, ["pad", "score"]],
  // 录音房 / 引擎 / 音源 / 月读
  [/^src\/ui\/(studio|plugins|scopes|spectrum|part-colors|metronome|render-progress)\.ts$/, ["studio", "play"]],
  // 演奏者插件（ADR-0004）：能什么 / 怎么出声 / 谱上怎么画 / 怎么试听 → 放 + 录音房 + 键盘（提示音域 / 叠音灰）
  [/^src\/performers\//, ["play", "studio", "pad"]],
  // 唱歌 / 播放胶水（刀 1 从 main.ts 抽出）；音源 / 模型来源接缝（刀 4）：找声音 / 下载 / 弱引用解析 → 放 + 乐器页
  [/^src\/app\/performance\.ts$|^src\/sources\//, ["play", "studio"]],
  // 无头渲染核心（2026-10-16）：播放的准备 / 导出 / 定稿都过它；歌库的封面试听在 gallery-host
  [/^src\/core\//, ["play", "studio", "export", "store"]],
  [/^src\/gallery-host\.ts$|^src\/app\/song-player\.ts$|^src\/editor-session\//, ["store"]],
  // 修改锁（2026-11-10）：那一处回答 / 分类表 / 门——碰了它们 = 歌库那一区（edit-lock / gallery-marks 在里面）+ 谱面和键盘（规则、插头）
  [/^src\/app\/edit-lock[a-z-]*\.ts$/, ["store", "score", "pad"]],
  // 这台设备上记着的渲好的声音（2026-11-10，定稿退役之后）：导出直接拿 / 歌库封面上的 ▶ 都靠它 → 歌库 + 导出（render-cache 在这两区）
  [/^src\/app\/render-cache[a-z-]*\.ts$/, ["store", "export"]],
  [/^src\/(engine|gm|singer)\//, ["studio", "play"]],
  [/^src\/app\/(names)\.ts$/, ["studio"]],
  // 文件 / 云 / 歌库 / 格式
  [/^src\/(app-store|library-home|identifiers|encryption)\.ts$|^src\/app\/move-songs\.ts$|^src\/app\/doc-file\.ts$|^src\/sources\/link\.ts$|^src\/ui\/(sheets|song-cover)\.ts$|^src\/editor-session\//, ["store"]],
  [/^src\/format\//, ["store", "export", "score"]],
  // 导出 / 参考窗 / 模式表
  [/^src\/export\//, ["export"]],
  [/^src\/app\/(reference-host|ref-transcode)\.ts$/, ["ref"]],
  [/^src\/app\/workspace\.ts$/, ["modes", "pad", "score"]],
  [/^src\/ui\/finder\.ts$/, ["pad", "studio"]],
  // 搬出 main.ts 的面板（src/app/panels/，2026-11-09 起：乐器设置页）：调的东西在放 / 录音房 / 键盘（试听）三处听得见
  // 设置的音源 / 维护两页（13-2）：删库、清缓存 = 声音的库和它们的缓存 → 歌库那一区（念缓存、渲好的声音都在那里测）
  [/^src\/app\/panels\/settings-libs\.ts$/, ["store"]],
  // 删掉的库不自己下回来（v0.17.25）：记号在 sources/removed.ts，拦在 worker 和解析链 → 歌库那一区（lib-removed、settings-libs）+ 放
  [/^src\/sources\/removed\.ts$/, ["store", "play"]],
  // 第一次打开问一次的卡（第 18 条：这台设备看谱的习惯）：卡本身 + 习惯管到谱面 / 键上的字 → 谱面、键盘
  [/^src\/app\/panels\/habits-card\.ts$/, ["score", "pad"]],
  [/^src\/app\/panels\//, ["pad", "studio", "play"]],
  [/^assets\//, ["play", "export"]],
  // 其余 src 没登记 = 整套（宁多跑不漏跑；登记了再缩）
  [/^src\//, "all"],
];

/** 一个仓根相对路径属哪些区："all" / "smoke" / 区名数组。 */
export function areasOf(path) {
  for (const [re, areas] of AREA_OF_PATH) if (re.test(path)) return areas;
  return [];
}
