// report-error.ts —— app 唯一的错误漏斗（store / 图库 / 编辑器都往这里报）。created 2026-10-08 by Claude Fable 5.1
//   error / warning → 顶上的 notice（用户看得见）；info → 一闪的 notice；log → 只进控制台。
//   **每一级都进黑匣子**（图库包的 diagLog，device 层环形日志；设置里能看能拷）：store 的 MSAL 报错 / 静默续期失败只有落了盘才有人能查
//   （CatsUp 2026-09-22「点登录没反应」教训；家规 pwa-cloud-store §2 Boot order）。
import { showNotice } from "@internal/workbench-elements";
import { diagLog } from "@internal/gallery";

export type ErrorLevel = "error" | "warning" | "info" | "log";
const msgOf = (e: unknown): string => (e instanceof Error ? e.message : typeof e === "string" ? e : String(e));

export function reportError(err: unknown, level: ErrorLevel = "error"): void {
  const m = msgOf(err);
  try { diagLog.record(level, m); } catch { /* 黑匣子坏了也不能把报错吞掉 */ }
  if (level === "error") { console.error(err); showNotice({ id: "err", level: "error", text: m }); }
  else if (level === "warning") { console.warn(err); showNotice({ id: "warn", level: "warning", text: m, autoHideMs: 6000 }); }
  else if (level === "info") { console.info(m); showNotice({ id: "info", level: "info", text: m, autoHideMs: 3000 }); }
  else console.log(m);
}
/** 面包屑（不是错误）：boot / auth / gallery / doc 的时间线，只进黑匣子。 */
export const diagNote = (tag: string, msg: string): void => { try { diagLog.note(tag, msg); } catch { /* ignore */ } };
export const diagText = (): string => { try { return diagLog.toText(); } catch { return ""; } };
export const diagClear = (): void => { try { diagLog.clear(); } catch { /* ignore */ } };
