// store-ui.ts —— 给 @internal/store 的 ui bundle（busy / 冲突面 / 报错 / 补推进度 / 跳过到离线）。created 2026-10-08 by Claude Fable 5.1
//   接线器 = 图库包的 storeUIFor（WeebPaint / WXHW 同形的 sheet 契约）：冲突必 surface（真 gate sheet、按 occasion 分两套按钮，绝不静默 cancel）；
//   错误必 surface（走 src/app/report-error.ts 这一个漏斗，每级都进黑匣子）；busy 按 key 路由（推云 / 改名是后台节律，不上全屏遮罩）。
//   user 2026-10-08「冲突面照家规 必须做的非常严格…不要发生没有接线的情况」——test/store-wiring.test.mjs 守着这三个 handler 都在。
import { storeUIFor } from "@internal/gallery";
import type { StoreUI } from "@internal/store";
import { showNotice } from "@internal/workbench-elements";
import { withBusy, lockSyncGate, settleSyncGate } from "./ui/sheets.ts";
import { reportError } from "./app/report-error.ts";
import { identifiers } from "./identifiers.ts";

const stemOf = (id: string) => identifiers.parse(id)?.stem ?? id;
const base = storeUIFor({
  busy: (label, fn) => withBusy(label, fn),
  showNotice,
  sheets: { lockSyncGate, settleSyncGate },
  reportError,
  stemOf,
});
export const storeUI: StoreUI = {
  ...base,
  // 未登录时库的后台云动作会撞 auth 的 "Not signed in"——那是正常态不是故障，只进黑匣子不上横幅（WXHW 2026-09-03 截图：橙条常驻）。其余照包的分级（CloudNetworkError 换人话）。
  reportError: (err, level) => { if ((err as { message?: string } | null)?.message === "Not signed in") { reportError(err, "log"); return; } base.reportError(err, level); },
  // ADR-0018：offlineUploadReplay:"auto"（离线新建的歌回线自动补推）的进度 / 撞名 surface——库在 createStore 时强制要有这条线（没有就当场抛）。
  onReplayStatus: ({ phase, name, done, total }) => {
    const n = name ? stemOf(name) : "";
    if (phase === "collision") reportError(new Error(`「${n}」云端已经有同名的了，离线时存的这份没推上去（在歌库里改个名再推）`), "warning");
    else if (phase === "done") reportError(`离线时存的歌推上云了（${done} / ${total}）`, "info");
    else if (phase === "pushed") reportError(`正在把离线时存的歌推上云… ${done} / ${total}`, "info");
  },
};
