// src/app/panels/habits-card.ts —— 「初始设置」：这台设备看谱的习惯（施工单第 18 条第三版；卡第二版 = 统筹 b7a48b84 / d871aadf）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   user 2026-11-13：「我们不需要这个 heading，我们不需要我们的图标，就一个普通的屏幕」「简谱不等于新手谢谢五线谱也不一定是专家谢谢」
//     「你这些辅助功能，嗯，还是正交吧」「字母谱只能不完美兜住tracker呀，兜不住钢琴卷帘和录音」
//     （第二版）「谱子预览太大了，还是用一开始的卡片，其实可以放缩小一点，看个大概就行了」「然后只有铺子要预览，其他的就是小下拉框」
//     「不要说你是哪一种，我们的文案还是简单直接点，就是初始设置之类的…首先是三个谱子的卡片，你能把它做成一个可以左右滑动的选择吗？它是第一行，
//      然后第二行就是一个比较重要的。两个按钮是说我们要不要移掉，然后从第三行开始是相对不太重要的小下拉是别的设置…设置菜单里也放一个」
//     「你能不能保证，就是你这个谱子大小、卡片大小不变的情况下，给它加一些表情符号和歌词，挤一点没关系，本来就是看大纲」「这个预览只是当一个背景图片」
//   · 一张普通的卡（零件库的面板外壳），标题「初始设置」，不放横幅、图标、名字、版本号；问句都拿掉，每行的名字和设置「界面」页同一个叫法；格子不写水平。
//   · 第一行 习惯看的谱：一行小卡片横着滑（带吸附），点一格才算选；三格一样大，格宽由可见宽算（strip-layout.ts：放得下均分不滑、放不下 = 整数格 + 半格，被切的一侧淡出）。
//     预览图在 habits-preview.ts（真排版、墨迹大了整张等比缩到刚好放下、按墨迹居中），格子窄了跟着框等比缩。
//   · 第二行 移调辅助：两颗一样宽的钮 + 一句说明。第三行起 小下拉（现在只有「中央 C 叫」）：和设置「界面」页那几行是同一处出的行（宿主给 rows）。
//   · 每一样都可以不选（点亮着的那格 / 那颗 = 取消）。「好」= 交回选了的；「以后再说」/ Esc / 点外面怎么算由宿主定（第一次打开 vs 从设置里打开）。
import { openPanelShell, settingRowHtml } from "@internal/workbench-elements";
import { _t } from "../../i18n/index.ts";
import { escapeHtml as esc } from "../../ui/md-lite.ts";
import { type RawMeasure } from "../../render/text/index.ts";
import { NOTATIONS, type NotationId } from "../../score/song-view.ts";
import { previewSvg, PREVIEW_W, PREVIEW_H } from "./habits-preview.ts";
import { notationName, TRANSPOSE_AID_NOTE, type Habits, type HabitKey } from "../../look/index.ts";
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
  /** 第一行「语言」（v0.17.37，统筹 42d5f807；user「初始设置第一个是语言，放在看谱前面…加一个图标方便人识别」）：宿主出的那一行 + 装好它。
   *  它不是看谱的习惯（不进 HABIT_KEYS、「好」不写它）；选了 = 宿主马上换界面语言。draft = 卡上现在点着的（换语言要整页重载，宿主带过去、重载完照这个再开）。 */
  lang: { html: string; mount(root: HTMLElement, draft: () => Habits): void };
  /** 连着歌库吗（施工单 20-4）：连着 = 「存在你的歌库里」；没连 = 「记在这台设备上，登录后跟着你」。 */
  synced?: boolean;
}
export interface HabitsCard { close(): void; readonly el: HTMLElement }

/** 卡上摆着哪几样习惯（只有这一份：画卡、「好」写设备都从它来；v0.17.30 收跟进第 1 条）：第一行谱的小卡片、第二行两颗钮、第三行起小下拉。
 *  不在这里的习惯（以后加了、还没上卡的）从卡上点「好」不动它。 */
//   lead = 第一行「语言」（v0.17.37）：单独一格，不是习惯（不在 cardHabitKeys 里，「好」不写它）。
export const CARD_HABITS = { lead: "lang", tiles: "notation", pair: "viewInC", rows: ["middleC", "chordTagStyle"] } as const satisfies { lead: "lang"; tiles: HabitKey; pair: HabitKey; rows: readonly HabitKey[] };
export const cardHabitKeys = (): readonly HabitKey[] => [CARD_HABITS.tiles, CARD_HABITS.pair, ...CARD_HABITS.rows];
/** 一行小卡片：格子的基准宽、格子之间的间隔、格子里图两边留的（内边距 + 边框）。 */
// 格子的基准宽 122（v0.17.35，统筹 dc2b1b44；user 11-13「手机可以，甚至电脑上也用这个宽度的小图…我只是要看个大概就行」）：= 390 宽手机上原来的格宽，
//   所有设备一个尺寸；宽屏放得下就按这个宽靠左排、不拉宽（strip-layout.ts），以后谱种多了宽屏上自然多摆几格。
const TILE_BASE = 122, TILE_GAP = 10, TILE_INSET = 14;

export function openHabitsCard(d: HabitsCardDeps): HabitsCard {
  const chosen: { notation?: NotationId; viewInC?: boolean } = { ...(d.current.notation !== undefined ? { notation: d.current.notation } : {}), ...(d.current.viewInC !== undefined ? { viewInC: d.current.viewInC } : {}) };
  const content = document.createElement("div"); content.className = "habits-card";
  content.innerHTML =
    `<div class="hab-lead">${esc(d.synced ? _t("存在你的歌库里，都可以不选，以后在设置里改。") : _t("记在这台设备上，登录后跟着你；都可以不选，以后在设置里改。"))}</div>` +
    `<section class="hab-small hab-lang" data-q="${CARD_HABITS.lead}">${d.lang.html}</section>` +
    `<section class="hab-q" data-q="notation"><div class="hab-title">${esc(_t("习惯看的谱"))}</div>` +
      `<div class="hab-strip">${NOTATIONS.map((id) => `<button type="button" class="hab-tile" data-h="${CARD_HABITS.tiles}" data-v="${id}" aria-pressed="false"><span class="hab-prev">${previewSvg(id, d.measure)}</span><span class="hab-name">${esc(notationName(id))}</span></button>`).join("")}</div>` +
      `</section>` +   // 底下那一行字（「字母谱：玩 tracker 的…」）拿掉了：图已经够说明（v0.17.38，user「下面那行文字说明不要，图片已经够解释」）
    // 移调辅助（v0.17.38，统筹 28858491）：说明收进标题旁的小问号——和下面小下拉那几行同一个零件（settingRowHtml + 宿主装好的 wireSettingRows），默认收着；
    //   零件把展开的那段排在行头后面，这里用 CSS 把它挪到两颗钮下面（styles.css .hab-aid），零件和它的展开不另写
    `<section class="hab-q hab-aid" data-q="viewInC">` + settingRowHtml({
      labelHtml: `<span class="hab-title">${esc(_t("移调辅助"))}</span>`,
      notes: [{ mark: "?", label: _t("这是什么"), html: TRANSPOSE_AID_NOTE().map((p) => `<p>${esc(p)}</p>`).join("") }],
      belowHtml: `<div class="hab-pair"><button type="button" class="btn hab-btn" data-h="${CARD_HABITS.pair}" data-v="off" aria-pressed="false">${esc(_t("不用"))}</button><button type="button" class="btn hab-btn" data-h="${CARD_HABITS.pair}" data-v="on" aria-pressed="false">${esc(_t("按 C 调看"))}</button></div>`,
    }) + `</section>` +
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
  d.lang.mount(content, () => ({ ...chosen, ...pick(d.rows.read(content), d.rows.keys) }));   // 换语言前卡上点着的（宿主带过整页重载）
  // 一行小卡片多宽（统筹 1dda0433；v0.17.35 dc2b1b44）：都放得下 = 不滑、按基准宽靠左排；放不下 = 露出来的永远是「整数格 + 半格」；被切的那一侧淡出；可见宽变了重算
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
