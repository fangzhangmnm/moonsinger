// src/app/panels/habits-card.ts —— 「初始设置」：这台设备看谱的习惯（施工单第 18 条第三版；卡第二版 = 统筹 b7a48b84 / d871aadf）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   user 2026-11-13：「我们不需要这个 heading，我们不需要我们的图标，就一个普通的屏幕」「简谱不等于新手谢谢五线谱也不一定是专家谢谢」
//     「你这些辅助功能，嗯，还是正交吧」「字母谱只能不完美兜住tracker呀，兜不住钢琴卷帘和录音」
//     （第二版）「谱子预览太大了，还是用一开始的卡片，其实可以放缩小一点，看个大概就行了」「然后只有铺子要预览，其他的就是小下拉框」
//     「不要说你是哪一种，我们的文案还是简单直接点，就是初始设置之类的…首先是三个谱子的卡片，你能把它做成一个可以左右滑动的选择吗？它是第一行，
//      然后第二行就是一个比较重要的。两个按钮是说我们要不要移掉，然后从第三行开始是相对不太重要的小下拉是别的设置…设置菜单里也放一个」
//     「你能不能保证，就是你这个谱子大小、卡片大小不变的情况下，给它加一些表情符号和歌词，挤一点没关系，本来就是看大纲」「这个预览只是当一个背景图片」
//   · 一张普通的卡（零件库的面板外壳），标题「初始设置」，不放横幅、图标、名字、版本号；问句都拿掉，每行的名字和设置「界面」页同一个叫法；格子不写水平。
//   · 第一行 习惯看的谱：一行小卡片横着滑（带吸附），点一格才算选；格子大小固定（预览 150 × 92）。预览 = 真排版（线距 8）；墨迹比 150 × 92 大 = 整张等比缩到刚好放下
//     （只缩不放大、不裁、不加高格子），左右上下按墨迹居中（统筹 a4c3d030；五线谱那格大约 0.84）。
//   · 第二行 移调辅助：两颗一样宽的钮 + 一句说明。第三行起 小下拉（现在只有「中央 C 叫」）：和设置「界面」页那几行是同一处出的行（宿主给 rows）。
//   · 每一样都可以不选（点亮着的那格 / 那颗 = 取消）。「好」= 交回选了的；「以后再说」/ Esc / 点外面怎么算由宿主定（第一次打开 vs 从设置里打开）。
import { openPanelShell } from "@internal/workbench-elements";
import { _t, lang } from "../../i18n/index.ts";
import { escapeHtml as esc } from "../../ui/md-lite.ts";
import { engrave } from "../../render/engrave.ts";
import { toSvg } from "../../render/svg.ts";
import { createTextMeasure, type RawMeasure } from "../../render/text/index.ts";
import { emptySong, withTrack, headTokens, TPQ, FIRST_PART, FIRST_PAPER, type Song, type Token } from "../../score/song.ts";
import { NOTATIONS, type NotationId } from "../../score/song-view.ts";
import { notationName, type Habits, type HabitKey } from "../../look/index.ts";
import { stripLayout } from "./strip-layout.ts";

/** 第三行起的小下拉（中央 C 叫…）：宿主出的行（和设置「界面」页同一个函数）+ 装好下拉 / 「?」+ 读回选了什么。 */
export interface HabitRows {
  html(current: Habits): string;
  mount(root: HTMLElement): void;
  /** 读这几行现在选着的（没选 = 不在里面）。 */
  read(root: HTMLElement): Habits;
  /** 哪几样走小下拉（「好」时卡上的格子 / 钮只管自己那两样，这几样照下拉读）。 */
  keys: readonly HabitKey[];
}
export interface HabitsCardDeps {
  /** 量字的尺子（和谱面同一把：score-view rawMeasure）。 */
  measure: RawMeasure;
  /** 打开时亮着的（设备上现在的习惯）。 */
  current: Habits;
  rows: HabitRows;
  /** 「好」：chosen = 选了的那几样（没选的不在里面）。 */
  done(chosen: Habits): void;
  /** 「以后再说」。 */
  later(): void;
  /** Esc / 点外面。 */
  dismissed(): void;
}
export interface HabitsCard { close(): void; readonly el: HTMLElement }

/** 预览图的基准大小（css px）：真排版按这么大放（统筹 d871aadf）；格子窄了（放不下时「整数格 + 半格」）整张跟着等比缩（统筹 1dda0433）。 */
export const PREVIEW_W = 150, PREVIEW_H = 92;
/** 一行小卡片：格子的基准宽、格子之间的间隔、格子里图两边留的（内边距 + 边框）。 */
const TILE_BASE = 150, TILE_GAP = 10, TILE_INSET = 14;
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

export function openHabitsCard(d: HabitsCardDeps): HabitsCard {
  const chosen: { notation?: NotationId; viewInC?: boolean } = { ...(d.current.notation !== undefined ? { notation: d.current.notation } : {}), ...(d.current.viewInC !== undefined ? { viewInC: d.current.viewInC } : {}) };
  const content = document.createElement("div"); content.className = "habits-card";
  content.innerHTML =
    `<div class="hab-lead">${esc(_t("记在这台设备上，都可以不选，以后在设置里改。"))}</div>` +
    `<section class="hab-q" data-q="notation"><div class="hab-title">${esc(_t("习惯看的谱"))}</div>` +
      `<div class="hab-strip">${NOTATIONS.map((id) => `<button type="button" class="hab-tile" data-h="notation" data-v="${id}" aria-pressed="false"><span class="hab-prev">${previewSvg(id, d.measure)}</span><span class="hab-name">${esc(notationName(id))}</span></button>`).join("")}</div>` +
      `<div class="hab-foot">${esc(_t("字母谱：玩 tracker 的可以先用这个，不完全一样。钢琴卷帘、录音还没做，做好了会加在这里。"))}</div></section>` +
    `<section class="hab-q" data-q="viewInC"><div class="hab-title">${esc(_t("移调辅助"))}</div>` +
      `<div class="hab-pair"><button type="button" class="btn hab-btn" data-h="viewInC" data-v="off" aria-pressed="false">${esc(_t("不用"))}</button><button type="button" class="btn hab-btn" data-h="viewInC" data-v="on" aria-pressed="false">${esc(_t("按 C 调看"))}</button></div>` +
      `<div class="hab-note">${esc(_t("调号多的时候把谱换到 C 调来画，只改显示、声音不变；看五线谱时起作用。"))}</div></section>` +
    `<section class="hab-small">${d.rows.html(d.current)}</section>`;
  const valueOf = (h: string, v: string): string | boolean => (h === "viewInC" ? v === "on" : v);
  const sync = (reveal: boolean) => {
    for (const b of content.querySelectorAll<HTMLButtonElement>("[data-h]")) {
      const on = (chosen as Record<string, unknown>)[b.dataset.h!] === valueOf(b.dataset.h!, b.dataset.v!);
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
      if (on && reveal && b.classList.contains("hab-tile")) b.scrollIntoView({ block: "nearest", inline: "nearest" });   // 选中的那格整格看得见
    }
  };
  content.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-h]"); if (!b) return;
    const h = b.dataset.h as keyof typeof chosen, v = valueOf(h, b.dataset.v!);
    if (chosen[h] === v) delete chosen[h]; else (chosen as Record<string, unknown>)[h] = v;   // 点亮着的 = 取消（都可以不选）
    sync(true);
  });
  let closed = false;
  const shell = openPanelShell({ title: _t("初始设置"), content, width: "wide",
    buttons: [{ id: "later", label: _t("以后再说") }, { id: "ok", label: _t("好"), primary: true }],
    onButton: (id) => {
      if (closed) return;
      const picked: Habits = { ...chosen, ...pick(d.rows.read(content), d.rows.keys) };
      closed = true; shell.close(); if (id === "ok") d.done(picked); else d.later();
    },
    onClose: () => { if (closed) return; closed = true; d.dismissed(); } });
  shell.el.classList.add("habits-panel");
  d.rows.mount(content);
  // 一行小卡片多宽（统筹 1dda0433）：都放得下 = 不滑、均分；放不下 = 露出来的永远是「整数格 + 半格」；被切的那一侧淡出；可见宽变了重算
  const strip = content.querySelector<HTMLElement>(".hab-strip")!, tiles = [...strip.querySelectorAll<HTMLElement>(".hab-tile")];
  const fades = () => { const max = strip.scrollWidth - strip.clientWidth; strip.classList.toggle("fade-l", strip.scrollLeft > 1); strip.classList.toggle("fade-r", strip.scrollLeft < max - 1); };
  let laidFor = -1;
  const layout = () => {
    const vis = strip.clientWidth; if (vis <= 0 || vis === laidFor) return; laidFor = vis;
    const { cell, scroll } = stripLayout(vis, tiles.length, TILE_GAP, TILE_BASE), pw = Math.min(PREVIEW_W, cell - TILE_INSET);
    strip.classList.toggle("scrolls", scroll);
    strip.style.setProperty("--hab-prev-w", `${pw.toFixed(1)}px`); strip.style.setProperty("--hab-prev-h", `${(PREVIEW_H * pw / PREVIEW_W).toFixed(1)}px`);
    for (const t of tiles) t.style.width = `${cell.toFixed(2)}px`;
    fades();
  };
  strip.addEventListener("scroll", fades, { passive: true });
  if (typeof ResizeObserver === "function") new ResizeObserver(() => { layout(); }).observe(strip);
  layout();
  sync(false);
  requestAnimationFrame(() => { layout(); sync(true); });   // 打开时：亮着的那格整格滚进来（进了版面才滚得动）
  return { el: shell.el, close: () => { if (!closed) { closed = true; shell.close(); } } };
}
/** 只要这几样（小下拉那几行读回来的里面挑）。 */
function pick(h: Habits, keys: readonly HabitKey[]): Habits {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (h[k] !== undefined) out[k] = h[k];
  return out as Habits;
}
