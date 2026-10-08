// song-cover.ts —— 书架卡片的封面：唱片封面式（方图），歌名印大字、作者一行小字、日期更小；图只是背景。created 2026-10-08 by Claude Fable 5.1
//   user 2026-10-08：「用户选的封面图，不用第一页…没有的时候自己生成排版，看看wxhw的自动封面」「我们这个应该是唱片封面，是矩形的，你可以想想各个音乐app是怎么弄的，
//   不管日期小字，消歧码的逻辑都可以学」「都是 HTML 排版进 gallery 的两个槽 对」。
//   落在哪一层：印字是宿主的排版，不进图库包。包给两个槽——占位（ui.tilePlaceholderHtml，没有封面图时垫的那块底色）和覆盖层（ui.tileOverlayHtml，有没有图都盖在上面）。
//   本文件只出两段 HTML（纯函数，无 DOM）；颜色 / 字号全在 styles.css「书架封面」一节。
// 排版规则（学 WXHW book-cover.ts，形状换成唱片封面）：
//   · 名字先拆日期前缀（八位日期 + 分隔 + 其余，分隔哪边都不进）：歌名印大字；日期印小字（左上）。
//   · 没起名的歌（`yyyymmdd-hex4`）：大字的位置印那四位消歧码，等宽、淡色（一眼看出没起名）。
//   · 汉字为主 → 竖排（右上起一列一列）；拉丁为主 → 横排、按词折行、靠左下（专辑封面的惯例：大字在下，艺人一行在它下面）。
//   · 字号按字数分四档，单位是卡片宽度的百分比（cqw）。
//   · 底色：没有图时按歌名哈希从一小组哑色里选一块（扁平、不渐变）；有图时图铺满 + 底部一道淡渐变托住字。
//   · 作者行 = 作者栏第一行（宿主给）；没有就不印。

const CJK = /[぀-ヿ㐀-鿿가-힯豈-﫿]/;
const esc = (x: string): string => x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** `yyyymmdd[-_ ]其余` → { date, title }；不带日期的原样当 title。 */
export function splitDatedStem(stem: string): { date: string | null; title: string } {
  const m = /^(\d{8})(?:[\s_\-－—–]+)?(.*)$/.exec(stem.trim());
  if (!m) return { date: null, title: stem.trim() };
  return { date: m[1], title: m[2].trim() };
}
/** 四位消歧码（没起名的歌：`yyyymmdd-hex4`）。 */
export const isCodeTitle = (t: string): boolean => /^[0-9a-f]{4}$/i.test(t);

export interface CoverPlan { date: string | null; title: string; vertical: boolean; size: "xl" | "l" | "m" | "s"; coded: boolean; hue: number }
/** 歌名怎么排（纯函数，测试用它）：竖 / 横、字号档、底色色相（名字哈希）。 */
export function planCover(stem: string): CoverPlan {
  const { date, title } = splitDatedStem(stem);
  const chars = [...title].filter((c) => !/\s/.test(c));
  const cjk = chars.filter((c) => CJK.test(c)).length, other = chars.length - cjk;
  const vertical = cjk > 0 && cjk * 2 >= other;
  const n = chars.length;
  const size = vertical ? (n <= 4 ? "xl" : n <= 8 ? "l" : n <= 14 ? "m" : "s") : (n <= 7 ? "xl" : n <= 16 ? "l" : n <= 32 ? "m" : "s");
  let h = 0; for (const c of stem) h = (h * 31 + c.codePointAt(0)!) >>> 0;
  return { date, title, vertical, size, coded: date != null && isCodeTitle(title), hue: h % 8 };
}
/** 竖排正文：一两个字符的拉丁 / 数字小串包成纵中横。 */
function verticalRuns(title: string): string {
  return title.split(/([A-Za-z0-9]+)/).map((run, i) => (i % 2 === 1 && run.length <= 2 ? `<span class="tcy">${esc(run)}</span>` : esc(run))).join("");
}
/** 没有封面图时垫在下面的那块底色（图库包的占位槽）：只有颜色，不印字——字在上面那一层。 */
export function placeholderHtml(stem: string): string {
  return `<span class="ms-cover-bg hue-${planCover(stem).hue}"></span>`;
}
/** 印在封面上的那一层（图库包的覆盖层槽）：歌名 / 作者 / 日期。底下是封面图还是底色，印法都一样。 */
export interface CoverExtra { artist?: string | null; sizeText?: string; editedText?: string }
export function coverHtml(stem: string, extra: CoverExtra = {}): string {
  const p = planCover(stem);
  const cls = `ms-cover ${p.vertical ? "v" : "h"} sz-${p.size}${p.coded ? " coded" : ""}`;
  const title = p.vertical ? verticalRuns(p.title) : esc(p.title);
  const artist = extra.artist ? `<span class="ms-cover-artist">${esc(extra.artist)}</span>` : "";
  const bar = `<span class="ms-cover-bar">${p.date ? `<span class="ms-cover-date">${esc(p.date)}</span>` : "<span></span>"}${extra.sizeText ? `<span class="ms-cover-size">${esc(extra.sizeText)}</span>` : ""}</span>`;
  return `<span class="${cls}"${extra.editedText ? ` title="${esc(extra.editedText)}"` : ""}><span class="ms-cover-title"${p.vertical ? "" : ' lang="en"'}>${title}</span>${artist}${bar}</span>`;
}
