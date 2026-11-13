// src/app/panels/habits-preview.ts —— 「初始设置」卡第一行每格的预览图（从 habits-card.ts 拆出来：只排版、不碰 DOM，node 里能测；test/habits-preview.test.ts）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。规矩（统筹 d871aadf / a4c3d030）：真排版（线距 8）画同一句；墨迹比 150 × 92 大 = 整张等比缩到刚好放下
//   （只缩不放大、不裁），左右上下按墨迹居中；格子窄了（strip-layout 的「整数格 + 半格」）SVG 跟着框等比缩。
import { _t, lang } from "../../i18n/index.ts";
import { engrave } from "../../render/engrave.ts";
import { toSvg } from "../../render/svg.ts";
import { createTextMeasure, type RawMeasure } from "../../render/text/index.ts";
import { emptySong, withTrack, headTokens, TPQ, FIRST_PART, FIRST_PAPER, type Song, type Token } from "../../score/song.ts";
import type { NotationId } from "../../score/song-view.ts";

/** 预览图的基准大小（css px）：真排版按这么大放（统筹 d871aadf）；格子窄了（放不下时「整数格 + 半格」）整张跟着等比缩（统筹 1dda0433）。 */
export const PREVIEW_W = 150, PREVIEW_H = 92;
/** 五线谱线距（px）：照假截图的小卡（统筹 d871aadf：8 上下）。 */
const PREVIEW_SP = 8;

/** 预览那一句：C 大调四个四分音符 1 2 3 5，带重音、两个跳音、一条连线、一个换气、mp 渐强到 f，每个音一个字的歌词；不要速度的字（统筹 d871aadf）。
 *  排得紧一点（音符密度「紧凑」= 这一句自己的设置，不是把谱缩小：线距照旧 8）。 */
export function previewSong(): Song {
  let id = 10;
  const t = (x: Record<string, unknown>) => ({ ...x, id: id++ }) as unknown as Token;
  const n = (step: string, more: Record<string, unknown> = {}) => t({ kind: "note", pitch: { step, alter: 0, octave: 4 }, dur: TPQ, lyric: _t("啦"), ...more });
  const toks: Token[] = [...headTokens({ fifths: 0, beats: 4, beatType: 4 }).filter((x) => x.kind !== "tempo"),
    t({ kind: "dyn", value: "mp" }), t({ kind: "hairpin", dir: "cresc" }),
    n("C", { art: ["accent"] }), n("D", { art: ["staccato"] }), n("E", { art: ["staccato"], slur: true }),
    t({ kind: "dyn", value: "f" }),
    n("G", { art: ["breath"] }),
  ];
  return { ...withTrack(emptySong({ fifths: 0 }), FIRST_PAPER, FIRST_PART, toks), density: "compact" };
}
/** 用这种谱真排那一句，放进 PREVIEW_W × PREVIEW_H：一个排版 px = 一个 css px，墨迹大了就整张等比缩到刚好放下（只缩不放大），左右上下按墨迹居中。 */
export function previewSvg(notation: NotationId, measure: RawMeasure): string {
  const song: Song = { ...previewSong(), notation, viewInC: false };
  const L = engrave(song, { width: 480, sp: PREVIEW_SP, locale: lang(), at: { paper: FIRST_PAPER, part: FIRST_PART }, parts: [{ id: FIRST_PART, name: "", first: true }], measure: createTextMeasure(measure), margins: { l: 0, r: 0.5, t: 0, b: 0 } });
  const s0 = L.systems[0]; if (!s0) return toSvg(L);
  // 左边：五线谱 = 第一根谱线的起点；简谱 / 字母谱没有谱线 = 最左边那个字（不算给声部名留的那一截）
  const staffX = L.prims.filter((q) => q.t === "line" && /(^|\s)staff(\s|$)/.test(q.cls ?? "")).map((q) => (q.t === "line" ? Math.min(q.x1, q.x2) : 0));
  const inkX = L.prims.filter((q) => (q.t === "glyph" || q.t === "text") && !/part-name/.test(q.cls ?? "") && (q.t !== "text" || q.s)).map((q) => (q.t === "glyph" || q.t === "text" ? q.x : 0));
  const pad = 2, x0 = (staffX.length ? Math.min(...staffX) : Math.min(...inkX) - PREVIEW_SP * 0.6) - pad, x1 = (s0.x1 ?? L.width) + pad;   // 右边 = 这一行谱的右端（换气记号在它里面）
  const y0 = (s0.inkTop ?? s0.top) - pad, y1 = (s0.inkBottom ?? s0.bottom) + pad;
  const k = Math.min(1, PREVIEW_W / (x1 - x0), PREVIEW_H / (y1 - y0)), vw = PREVIEW_W / k, vh = PREVIEW_H / k;
  const vx = (x0 + x1) / 2 - vw / 2, vy = (y0 + y1) / 2 - vh / 2;
  return toSvg(L).replace(/ width="[^"]*" height="[^"]*" viewBox="[^"]*"/, ` width="${PREVIEW_W}" height="${PREVIEW_H}" viewBox="${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" data-k="${k.toFixed(3)}"`);
}

