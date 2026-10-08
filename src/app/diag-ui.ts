// diag-ui.ts —— 设置里「诊断日志」的三个动作：复制 / 分享 .txt（没有 share 的环境 = 下载）/ 清空。数据源 = src/app/report-error.ts 的黑匣子。
// created 2026-10-08 by Claude Fable 5.1（照抄 WebXiaoHeiWu src/diag-log-ui.ts；user「debug consolelog…就是出错了可以发给你的东西，看 wxhw 是怎么做的」）。
// 复制：navigator.clipboard.writeText（点击手势内）→ 失败回退 textarea + execCommand → 再失败选中 <pre> 让用户长按复制。
// 分享：canShare files → .txt 文件（微信 / QQ 吃不下 60 KB 长文本——WeebPaint 2026-09-06 教训）；没有 share（桌面）→ 下载 .txt。无系统弹窗（家规）：结果走 notice。
import { diagText, diagClear, diagCount, reportError } from "./report-error.ts";

function copyViaTextarea(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.top = "0";
  document.body.appendChild(ta);
  ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove();
  return ok;
}
export async function copyDiag(pre: HTMLElement | null, status: (text: string) => void): Promise<void> {
  const text = diagText(), n = diagCount();
  try {
    if (!navigator.clipboard?.writeText) throw new Error("navigator.clipboard.writeText unavailable");
    await navigator.clipboard.writeText(text);
    status(`复制了 ${n} 条`); return;
  } catch (e) { reportError(new Error("[diag-log] clipboard.writeText failed: " + String(e)), "log"); }
  if (copyViaTextarea(text)) { status(`复制了 ${n} 条`); return; }
  try { if (pre) { const range = document.createRange(); range.selectNodeContents(pre); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); } } catch { /* 选区都做不了 */ }
  reportError(new Error("[diag-log] execCommand copy failed too"), "log");
  status("复制不了（浏览器不给剪贴板）：已选中，长按复制");
}
const logFile = () => new File([diagText()], `moonsinger-diag-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`, { type: "text/plain" });
export const canShareDiag = (): boolean => typeof navigator.share === "function";
export async function shareDiag(status: (text: string) => void): Promise<void> {
  const f = logFile();
  if (!canShareDiag()) {   // 桌面：下载
    const url = URL.createObjectURL(f);
    const a = document.createElement("a"); a.href = url; a.download = f.name; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    status(`下载了 ${f.name}`); return;
  }
  try {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [f] })) await navigator.share({ title: "MoonSinger 诊断日志", files: [f] });
    else await navigator.share({ title: "MoonSinger 诊断日志", text: diagText() });
  } catch (e) { if ((e as { name?: string })?.name !== "AbortError") { reportError(new Error("[diag-log] share failed: " + String(e)), "log"); status("分享没成"); } }
}
export function clearDiag(pre: HTMLElement | null, status: (text: string) => void): void { diagClear(); if (pre) pre.textContent = "（空）"; status("清空了"); }
