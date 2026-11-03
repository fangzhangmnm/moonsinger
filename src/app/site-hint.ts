// site-hint.ts —— itch / 备用版上「做不到的画灰 + 一句话指路」的文案和开局那一行。created 2026-11-03 by Claude Opus 5.5
//   家族规则书 §1 第 6 / 12 条、§4 第 10 项：官网网址只有 config.ts SITE_URL 一处，文案插它；位置 = 开局一行 + 灰入口的副标题；不弹窗、不重复。
//   MoonSinger 界面只有中文、没有 i18n 层：这一组字住这一张表（不散在各处）。
//   开关来自 deployment-policy（siteHint）；存储靠不靠得住来自 persistence（availability / onHealth）——本文件只读、不自己判形态。
import { SITE_URL, REPORT_URL } from "../config.ts";
import { currentPolicy } from "../deployment-policy.ts";
import { deployment } from "../deployment.ts";
import { availability, onHealth } from "../persistence.ts";
import { showNotice } from "@internal/workbench-elements";

const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/+$/, "");
export const SITE_HOST = host(SITE_URL);

/** 文案表（人话；网址都从 SITE_URL / REPORT_URL 插）。 */
export const SITE_TEXT = {
  itchLine: `这是 itch 上的试玩版：除了网盘同步，别的都有。完整版在 ${SITE_HOST}`,
  localLine: `这是下载下来的备用版：除了网盘同步，别的都有。完整版在 ${SITE_HOST}`,
  untested: `这个浏览器打开备用版没测过：设置和缓存存不住（关了就忘），歌请记得「存」下来。遇到问题请到 ${host(REPORT_URL)} 告诉我们`,
  degraded: "这个浏览器写不进存储了：这次打开之后改的设置只留在内存里，关了就忘",
  cloudOff: "网盘在官网",
  cloudOffTitle: `网盘（OneDrive）同步只在官网版里有：${SITE_HOST}`,
  libOffTitle: `这个浏览器存不住歌库（关了就忘）：歌请用「存」下载成文件；歌库在官网版里：${SITE_HOST}`,
  noShell: deployment() === "itch" ? "itch 版跟着 itch 上的版本走：作者推了新版，刷新这一页就是新的" : deployment() === "local" ? `备用版不会自己更新：要新版就重新下载这个文件夹，或去官网 ${SITE_HOST}` : "这里没有离线壳，不用更新",
  goSite: "去官网",
  report: "报告问题",
};

const open = (url: string) => { try { window.open(url, "_blank", "noopener"); } catch { /* 被拦就算了：网址就写在那一行里 */ } };

/** 备用版设置页里画灰的那几行的说明（模型 / 音源就在文件夹里；后台线程存不住念缓存）。 */
export const FOLDER_TEXT = {
  models: "备用版：小月相的模型包就在这个文件夹的 pwa-models/ 里，用到才读、读的时候核哈希；不用下载、也不用导入",
  sounds: "备用版：音源就在这个文件夹的 pwa-sounds/ 里，用到才读；浏览器缓存在双击打开的网页里用不了，这里没有「留在设备上」这回事",
  speech: "备用版：后台线程存不住东西，念缓存只在内存里（每次打开第一遍要重念）",
};

let shown = false;
/** 开局那一行（只在 siteHint 开着时；一页只说一次）。存储开局就不可用（Safari 双击）= 换成「没测过」那一句 + 报告入口。 */
export function showSiteHint(): void {
  if (shown || !currentPolicy().siteHint) return;
  shown = true;
  const lost = availability() === "unavailable";
  const line = deployment() === "itch" ? SITE_TEXT.itchLine : SITE_TEXT.localLine;
  showNotice({
    id: "site-hint", level: lost ? "warning" : "neutral", dismissible: true,
    text: lost ? `${line}。${SITE_TEXT.untested}` : line,
    actions: lost ? [{ label: SITE_TEXT.report, onClick: () => open(REPORT_URL) }, { label: SITE_TEXT.goSite, onClick: () => open(SITE_URL) }]
                  : [{ label: SITE_TEXT.goSite, onClick: () => open(SITE_URL) }],
  });
}
/** 半路写不进存储：说一次（任何部署方式都可能）。 */
export function watchStorageHealth(): void {
  onHealth((h) => { if (h.level === "degraded") showNotice({ id: "storage-degraded", level: "warning", dismissible: true, text: SITE_TEXT.degraded }); });
}
/** 灰掉的网盘入口旁边的副标题（链接到官网）。 */
export function cloudOffHtml(): string {
  return `<a class="site-hint-link" href="${SITE_URL}" target="_blank" rel="noopener" title="${SITE_TEXT.cloudOffTitle}">${SITE_TEXT.cloudOff}</a>`;
}
