// test/e2e/areas.mjs —— E2E 的分区表（W-20 测试分档；user 2026-10-11「就是让fable整理一下测试，以及tier机制」「E2E…到时候fable需要做测试分级」）。
//   回答的问题 = 「改了哪类东西必须跑哪一档」：源码路径 → 区（AREA_OF_PATH），区 → E2E 文件（AREAS）。
//   test/e2e/run.mjs 用它：`node test/e2e/run.mjs @pad` 跑一个区；`--changed` 按 git 里改了什么自动推。
//   test/e2e-areas.test.ts 守：每个 E2E 文件至少属一个区、表里列的文件都存在——新加 E2E 没分区 = 单元测试红，不许静默漏档。
//   一个文件可以属几个区（它守的事跨区）。区名小写英文，`all` 是保留字 = 整套。
// created 2026-10-13 by Claude Fable 5.1。细则 = ai-docs/20261013-test-tiers.md。

/** 区 → E2E 文件名（不带 .mjs）。 */
export const AREAS = {
  // 谱面：手势（点 / 长按 / 拖 / 框选 / 把手）、排版、显示、谱上记号
  score: ["select", "finger", "rest", "lift", "sel-tweak", "top-sels", "undo", "caret-end", "clef", "auto-ottava", "shared-staff", "hscroll", "only1",
    "zoom", "ctrl-zoom", "dock-zoom", "scroll", "swell-art", "phrase", "repeat", "transpose", "arrange", "pad-ghost", "listen-ghost", "start-dyn",
    "lyric-dash", "lyric-mute", "reading", "stack-caps", "measure-follow", "follow"],
  // 键盘（pad）：音键 / 符号格 / 几种锁 / 歌词框 / 记号菜单
  pad: ["stack-caps", "pad-toggle", "pad-ghost", "dyn-levels", "ramp", "groove", "clef", "repeat", "finder-keys", "modes", "landscape-widgets",
    "dock-zoom", "save-keys", "swell-art", "start-dyn", "lyric-dash", "phrase", "sel-tweak"],
  // 放：走带 / 循环 / 翻谱 / 播放头 / 节拍器 / 月读的块与预听
  play: ["transport", "loop", "follow", "measure-follow", "playhead", "seg-jump", "metronome", "progress", "sing-chunks", "sung-preview",
    "listen-ghost", "lyric-mute", "reading", "ramp", "groove", "repeat", "arrange"],
  // 录音房：混音台 / 插件 / 路由 / 总轨 / 歌手管理
  studio: ["mixer-fx", "mixer-height", "mixer-narrow", "routing", "master", "singer", "singer-delete", "landscape-widgets", "modes", "dyn-levels"],
  // 歌库 / 云 / 文件 / 念缓存
  store: ["store", "sync", "speech-store", "save-keys"],
  // 导出
  export: ["pdf", "pdf-wysiwyg"],
  // 参考窗
  ref: ["reference"],
  // 模式与底座（workspace.ts 那张表）
  modes: ["modes", "pad-toggle", "dock-zoom", "top-sels", "landscape-widgets", "listen-ghost", "finder-keys"],
};

/** 不是测试的 E2E 目录成员（运行器和分区守卫都跳过）。 */
export const HELPERS = ["pw", "cloud-bridge", "run", "areas"];

/** 源码路径 → 区。从上往下第一条匹配的算（正则按仓根相对路径匹配）。"all" = 整套；[] = 没有 E2E 管它（只跑单元 / 冒烟）。
 *  "smoke" 不是 E2E 区：命中 = 运行器提醒你跑 npm run smoke（壳 / 文件逃生口在那里守）。 */
export const AREA_OF_PATH = [
  // 改了某个 E2E 自己 = 跑它自己（运行器单独处理，这里只要不落到 all）
  [/^test\/e2e\//, []],
  [/^test\//, []],
  [/^(ai-docs|weekly|journals?|docs)\/|^(CLAUDE|README)\.md$|^src\/version\.ts$|^api\//, []],
  // 中枢：谁都可能动 → 整套（main.ts 是现在的 god file，拆出去之后这条会变短；F-13 / F-17）
  [/^src\/app\/main\.ts$|^styles\.css$|^index\.html$|^package\.json$|^scripts\/build\.sh$|^vendor\//, "all"],
  [/^src\/app\/(report-error|diag-ui|resource-watch)\.ts$|^src\/ui\/icon\.ts$/, "all"],
  // 壳：离线壳 / 图标接线 → 冒烟（shell-smoke）+ 单元 icon-wiring
  [/^service-worker\.js$|^manifest\.webmanifest$|^src\/app\/pwa-shell\.ts$|^icon.*\.(svg|png)$|^apple-touch-icon.*\.png$/, "smoke"],
  // 谱面 / 排版 / 乐谱数据
  [/^src\/ui\/score-view\.ts$|^src\/render\//, ["score"]],
  [/^src\/score\/(perform|groove|grooves\.gen|repeats|lab-score|arrange)\.ts$/, ["score", "play"]],
  [/^src\/score\//, ["score", "pad"]],
  // 键盘与小编辑器
  [/^src\/ui\/(pad|wheel|drum|mark-editor|sel-bar)\.ts$/, ["pad"]],
  [/^src\/ui\/(lyric-editor|title-editor)\.ts$/, ["pad", "score"]],
  // 录音房 / 引擎 / 音源 / 月读
  [/^src\/ui\/(studio|plugins|scopes|spectrum|param-row|part-colors|metronome|render-progress)\.ts$/, ["studio", "play"]],
  [/^src\/(engine|gm|singer)\//, ["studio", "play"]],
  [/^src\/app\/(names)\.ts$/, ["studio"]],
  // 文件 / 云 / 歌库 / 格式
  [/^src\/(app-store|identifiers|encryption)\.ts$|^src\/app\/doc-file\.ts$|^src\/ui\/(sheets|song-cover)\.ts$|^src\/editor-session\//, ["store"]],
  [/^src\/format\//, ["store", "export", "score"]],
  // 导出 / 参考窗 / 模式表
  [/^src\/export\//, ["export"]],
  [/^src\/app\/(reference-host|ref-transcode)\.ts$/, ["ref"]],
  [/^src\/app\/workspace\.ts$/, ["modes", "pad", "score"]],
  [/^src\/ui\/finder\.ts$/, ["pad", "studio"]],
  [/^assets\//, ["play", "export"]],
  // 其余 src 没登记 = 整套（宁多跑不漏跑；登记了再缩）
  [/^src\//, "all"],
];

/** 一个仓根相对路径属哪些区："all" / "smoke" / 区名数组。 */
export function areasOf(path) {
  for (const [re, areas] of AREA_OF_PATH) if (re.test(path)) return areas;
  return [];
}
