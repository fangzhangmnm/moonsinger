// report-error.ts —— app 唯一的错误漏斗（store / 图库 / 编辑器都往这里报）+ 黑匣子（设备诊断日志）。created 2026-10-08 by Claude Fable 5.1
//   error / warning → 顶上的 notice（用户看得见）；info → 一闪的 notice；log → 只进控制台。
//   **每一级都进黑匣子**（图库包的 diagLog：环 500 条、单条 ≤ 600 字、localStorage 持久（经 src/device-kv.ts，同步、不靠 IDB——IDB 正是常见嫌疑人）；
//   设置里「诊断日志」能看 / 复制 / 分享 .txt / 清空，src/app/diag-ui.ts）。三条数据源（照 WeebPaint / WXHW）：
//   ① reportError 全部级别 ② window error / unhandledrejection（含 bundle 加载前 index.html 内联脚本抓到的，排队在 window.__msEarlyErrors）
//   ③ 面包屑 diagNote(tag, msg)：boot / auth / doc / gallery / sync / sw / page / net。
//   不是 telemetry：永不上传；只有用户点「复制 / 分享」字节才离开设备。user 2026-10-08「debug consolelog…出错了可以发给你的东西，看 wxhw 是怎么做的」。
import { showNotice } from "@internal/workbench-elements";
import { diagLog, configureDeviceKv } from "@internal/gallery";
import { deviceKvGet, deviceKvSet } from "../device-kv.ts";

export type ErrorLevel = "error" | "warning" | "info" | "log";
const msgOf = (e: unknown): string => (e instanceof Error ? `${e.name === "Error" ? "" : e.name + ": "}${e.message}` : typeof e === "string" ? e : String(e));

export function reportError(err: unknown, level: ErrorLevel = "error"): void {
  const m = msgOf(err);
  try { diagLog.record(level, m); } catch { /* 黑匣子坏了也不能把报错吞掉 */ }
  if (level === "error") { console.error(err); showNotice({ id: "err", level: "error", text: m }); }
  else if (level === "warning") { console.warn(err); showNotice({ id: "warn", level: "warning", text: m, autoHideMs: 6000 }); }
  else if (level === "info") { console.info(m); showNotice({ id: "info", level: "info", text: m, autoHideMs: 3000 }); }
  else console.log(m);
}
/** 面包屑（不是错误）：boot / auth / doc / gallery / sync / sw 的时间线，只进黑匣子。 */
export const diagNote = (tag: string, msg: string): void => { try { diagLog.note(tag, msg); } catch { /* ignore */ } };
export const diagText = (): string => { try { return diagLog.toText(); } catch { return ""; } };
export const diagCount = (): number => { try { return diagLog.entries().length; } catch { return 0; } };
export const diagClear = (): void => { try { diagLog.clear(); } catch { /* ignore */ } };

interface EarlyErr { t: number; m: string }
/** boot 第一件事：黑匣子落到 device-kv 器官（同步、不靠 IDB）、收 index.html 内联脚本排队的早期错误、接 window error / unhandledrejection、页面生命周期面包屑。 */
export function initBlackBox(version: string): void {
  configureDeviceKv({ get: deviceKvGet, set: deviceKvSet });   // 图库包的 device-kv（diagLog 等）走本仓 src/device-kv.ts 那一个器官（带前缀）
  diagLog.initDiagLog({ app: "MoonSinger", version });
  const w = window as unknown as { __msEarlyErrors?: EarlyErr[] | { push: (e: EarlyErr) => void } };
  const early = w.__msEarlyErrors;
  if (Array.isArray(early)) for (const e of early.splice(0)) diagLog.record("error", `[early] ${e.m}`);
  w.__msEarlyErrors = { push: (e: EarlyErr) => { try { diagLog.record("error", `[early] ${e.m}`); } catch { /* ignore */ } } };   // 内联脚本之后还会 push：直接进黑匣子
  window.addEventListener("error", (e) => { try { diagLog.record("error", `[window] ${e.message} @${(e.filename ?? "").split("/").pop()}:${e.lineno}`); } catch { /* ignore */ } });
  window.addEventListener("unhandledrejection", (e) => { try { diagLog.record("error", `[unhandledrejection] ${msgOf(e.reason)}`); } catch { /* ignore */ } });
}
