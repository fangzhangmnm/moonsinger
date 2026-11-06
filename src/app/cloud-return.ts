// cloud-return.ts —— 回来（开机登录好 / 网回来）时没传的东西怎么办（家族规则书 §1 第 15 条，2026-11-03 夜改写；工单 H4）。created 2026-11-04 by Claude Opus 5.5
//   同 WeebPaint src/cloud-return.ts：
//   (a) 从没传过（syncState float）→ 问一次；第一次把东西放进某个家是人的决定。
//   (b) 传过、人按过存、当时没传成 → 自动续传不问；app 只对开着那首知道（EditorSession.isPushOwed）。
//   (c) 传过、只是自动保存落了本机 → 不自动传，进「要处理」列表；别的歌有 (c) 时说一声、给「传上去」（人点了 = 同意）；开着的这首不算（见 planReturn）。
//   库的 pushAll 不分这三种（不加筛选，user 11-03）：a、c 同时有时，面上两样都说、人点了才一起传（Fable 11-03 拍）。
//   纯函数：node 直测。

export type ReturnPlan =
  | { kind: "none" }
  | { kind: "list"; total: number }
  | { kind: "ask"; neverUploaded: number; others: number };

/** dirty = 库 dirty.count()；neverUploaded = 列举里 float 的份数。
 *  openDocAutosaveOnly = 开着的这份就是 (c)（isOpenDocAutosaveOnly）：它不是「回来发现的事」——人正在写它，按存或离开才传；每次切 app 回来都说「没传上去」= 假警报，
 *  人学会了无视，真分叉时也点掉（家族周账 F-200，user 11-05「切换前后台之后说需要处理」）。所以只有它一首 = 不说；它还在歌库「要处理」列表里，字节在设备上，什么都不丢。
 *  要问 (a) 时不减：「现在全传」确实会连它一起传，「还有 N 首」要算上它，面上的话才是真的。 */
export function planReturn(dirty: number, neverUploaded: number, openDocAutosaveOnly = false): ReturnPlan {
  if (dirty <= 0) return { kind: "none" };
  if (neverUploaded > 0) return { kind: "ask", neverUploaded, others: Math.max(0, dirty - neverUploaded) };
  const total = dirty - (openDocAutosaveOnly ? 1 : 0);
  return total > 0 ? { kind: "list", total } : { kind: "none" };
}

/** 开着的这份是不是「只是自动保存」：库的列表说它改过没传（unpushed），人没按过存（owed）。
 *  要问库、不能只问 EditorSession：isPushPending 第一次改动就为真，那时字节可能还没落盘、不在 dirty.count 里——再减 1 就把别的歌藏掉了（Opus 11-05 核代码改的，Fable 施工单原写法）。
 *  conflict / ghost 是真要人选的，float 是 (a)，都不算。在续传（resumeOwedPush）之前算：owed 的那份续传之后状态变了，不该再减。 */
export function isOpenDocAutosaveOnly(files: readonly { identifier: string; syncState?: string | null }[], openId: string | null, owed: boolean): boolean {
  if (!openId || owed) return false;
  return files.some((f) => f.identifier === openId && f.syncState === "unpushed");
}

/** (c) 那条通知要点名的身份：传过、还有东西要传的（不含从没传过的，那是 (a)）。except = 开着的那份（只是自动保存时不点它的名）。 */
export function stillLocalIds(files: readonly { identifier: string; syncState?: string | null }[], except: string | null): string[] {
  return files.filter((f) => f.identifier !== except && (f.syncState === "unpushed" || f.syncState === "conflict" || f.syncState === "ghost")).map((f) => f.identifier);
}

/** 列举里「从没传过且有字节要传」的身份。local-only 是干净的（人选了只留本机，pushAll 也不推它），不算。 */
export function neverUploadedIds(files: readonly { identifier: string; syncState?: string | null }[]): Set<string> {
  return new Set(files.filter((f) => f.syncState === "float").map((f) => f.identifier));
}
