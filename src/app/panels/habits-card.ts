// src/app/panels/habits-card.ts —— 第一次打开问一次：这台设备看谱的习惯（施工单第 18 条第三版；统筹 f73b128a / b149a4d9 / eff00542）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   user 2026-11-13：「我们不需要这个 heading，我们不需要我们的图标，就一个普通的屏幕」「简谱不等于新手谢谢五线谱也不一定是专家谢谢」
//     「你这些辅助功能，嗯，还是正交吧」「所以说就是问两样，一个是你习惯看什么谱，一个是你要不要移调」「字母谱只能不完美兜住tracker呀，兜不住钢琴卷帘和录音」
//     「那三个大的说选什么谱，这个比较容易看，然后一调也容易看。后来一些比较小的辅助是，就是让人看一眼不知道也不用碰它」
//   · 一张普通的卡（零件库的面板外壳），不放横幅、图标、名字、版本号。格子不写水平（不出现「新手 / 刚开始 / 学过 / 专家」）。
//   · 大的在上：看什么谱（每格一个预览，一行一个、横着铺满）→ 移调辅助（也带预览）→ 小的辅助一组放最下面（中央 C 叫 C 几：一行、小钮、不带预览）。
//   · 预览 = 真的排版画同一句（带力度、渐强、重音、跳音、连线、呼吸和两个字的歌词），不手画；谱那一问的格子从谱种表（NOTATIONS）来。
//   · 每一问都可以不选（点亮着的那格 = 取消）。「好」= 选了的记下；「以后再说」= 什么都不记；两颗都 = 不再问。Esc / 点外面 = 这次收起，下次还问。
//   · 这里只管画和收选择；记进设备、记「问过了」、什么时候出由宿主（main.ts）管。
import { openPanelShell } from "@internal/workbench-elements";
import { _t, lang } from "../../i18n/index.ts";
import { escapeHtml as esc } from "../../ui/md-lite.ts";
import { engrave } from "../../render/engrave.ts";
import { toSvg } from "../../render/svg.ts";
import { createTextMeasure, type RawMeasure } from "../../render/text/index.ts";
import { emptySong, withTrack, headTokens, TPQ, FIRST_PART, FIRST_PAPER, type Song, type Token } from "../../score/song.ts";
import { NOTATIONS, MIDDLE_C_NAMES, type NotationId } from "../../score/song-view.ts";
import { notationName, middleCLabel, MIDDLE_C_NOTE, type Habits } from "../../look/index.ts";

export interface HabitsCardDeps {
  /** 量字的尺子（和谱面同一把：score-view rawMeasure）。 */
  measure: RawMeasure;
  /** 现在设备上记着的（设置里改过、卡又出来的时候亮着）。 */
  current: Habits;
  /** 「好」：chosen = 选了的那几样（没选的不在里面）。 */
  done(chosen: Habits): void;
  /** 「以后再说」。 */
  later(): void;
  /** Esc / 点外面：这次收起。 */
  dismissed(): void;
}
export interface HabitsCard { close(): void }

/** 谱那一问每格下面的一句（没有 = 只写名字）。字母谱照实写它兜不住的（统筹 f73b128a）。 */
const NOTATION_TILE_NOTE: Partial<Record<NotationId, () => string>> = { letters: () => _t("玩 tracker 的可以先用这个，不完全一样") };

/** 预览那一句：降 E 大调（三个降号：按 C 调看起作用）、4/4，两小节；力度 mp → 渐强 → f、重音、跳音、连线、呼吸、保持、两个字的歌词。 */
export function previewSong(): Song {
  let id = 10;
  const t = (x: Record<string, unknown>) => ({ ...x, id: id++ }) as unknown as Token;
  const Q = TPQ, E = Q / 2;
  const p = (step: string, octave: number, alter = 0) => ({ step, alter, octave });
  const n = (pitch: ReturnType<typeof p>, dur: number, more: Record<string, unknown> = {}) => t({ kind: "note", pitch, dur, lyric: null, ...more });
  const toks: Token[] = [...headTokens({ fifths: -3, beats: 4, beatType: 4, bpm: 96 }),
    t({ kind: "dyn", value: "mp" }), t({ kind: "hairpin", dir: "cresc" }),
    n(p("E", 4, -1), Q, { lyric: _t("啦"), art: ["accent"] }), n(p("F", 4), E, { art: ["staccato"] }), n(p("G", 4), E, { art: ["staccato"] }),
    n(p("A", 4, -1), Q, { slur: true }), n(p("B", 4, -1), Q, { art: ["breath"] }),
    t({ kind: "dyn", value: "f" }),
    n(p("C", 5), E, { slur: true }), n(p("B", 4, -1), E, { slur: true }), n(p("A", 4, -1), Q, { art: ["tenuto"] }), n(p("G", 4), Q * 2, { lyric: _t("啦") }),
  ];
  return withTrack(emptySong({ fifths: -3 }), FIRST_PAPER, FIRST_PART, toks);
}
/** 用这一种看法真排那一句（照这首歌写明的那几项排：notation / viewInC 都明写，不经过习惯）。 */
export function previewSvg(look: { notation: NotationId; viewInC: boolean }, measure: RawMeasure): string {
  const song: Song = { ...previewSong(), notation: look.notation, viewInC: look.viewInC };
  const L = engrave(song, { width: 520, sp: 8, locale: lang(), at: { paper: FIRST_PAPER, part: FIRST_PART }, parts: [{ id: FIRST_PART, name: "", first: true }], measure: createTextMeasure(measure), margins: { l: 1, r: 1, t: 0, b: 0 } });
  // 裁到这一行（排版给歌名 / 作者栏留的那一截不要）：上 = 这一行的上沿（速度记号在它下面），下 = 墨迹的下沿，右 = 这一行谱的右端；按宽铺满（不写死宽高）
  const s0 = L.systems[0]; if (!s0) return toSvg(L);
  const top = s0.top, bottom = Math.max(s0.bottom, s0.inkBottom ?? s0.bottom) + L.sp, right = (s0.x1 ?? L.width) + L.sp;
  return toSvg(L).replace(/ width="[^"]*" height="[^"]*" viewBox="[^"]*"/, ` viewBox="0 ${top.toFixed(1)} ${right.toFixed(1)} ${(bottom - top).toFixed(1)}" preserveAspectRatio="xMidYMid meet"`);
}

export function openHabitsCard(d: HabitsCardDeps): HabitsCard {
  const chosen: { notation?: NotationId; viewInC?: boolean; middleC?: number } = { ...d.current };
  const content = document.createElement("div"); content.className = "habits-card";
  const tile = (h: string, v: string, name: string, note: string, svg: string) =>
    `<button type="button" class="hab-tile" data-h="${h}" data-v="${v}" aria-pressed="false"><span class="hab-name">${esc(name)}</span>${note ? `<span class="hab-sub">${esc(note)}</span>` : ""}<span class="hab-prev">${svg}</span></button>`;
  content.innerHTML =
    `<div class="hab-lead">${esc(_t("选了的记在这台设备上：新歌和没单独选过的歌照它显示，每首歌随时能单独换；以后在「设置 › 界面」里改。都可以不选。"))}</div>` +
    `<section class="hab-q" data-q="notation"><div class="hab-title">${esc(_t("你习惯看哪种谱？"))}</div><div class="hab-tiles">` +
      NOTATIONS.map((id) => tile("notation", id, notationName(id), NOTATION_TILE_NOTE[id]?.() ?? "", previewSvg({ notation: id, viewInC: false }, d.measure))).join("") +
      `</div><div class="hab-foot">${esc(_t("钢琴卷帘、录音还没做，做好了会加在这里"))}</div></section>` +
    `<section class="hab-q" data-q="viewInC"><div class="hab-title">${esc(_t("要不要移调辅助？"))}</div>` +
      `<div class="hab-note">${esc(_t("调号多的时候把谱换到 C 调来画，只改显示、声音不变；看五线谱时起作用。"))}</div><div class="hab-tiles">` +
      tile("viewInC", "off", _t("不用（照写的调）"), "", previewSvg({ notation: "staff", viewInC: false }, d.measure)) +
      tile("viewInC", "on", _t("按 C 调看"), "", previewSvg({ notation: "staff", viewInC: true }, d.measure)) +
      `</div></section>` +
    `<section class="hab-small"><div class="hab-row"><span class="hab-k">${esc(_t("中央 C 叫"))}</span><span class="hab-btns">` +
      MIDDLE_C_NAMES.map((n) => `<button type="button" class="btn hab-mini" data-h="middleC" data-v="${n}" aria-pressed="false">${esc(middleCLabel(n))}</button>`).join("") +
      `</span></div><div class="hab-note">${esc(MIDDLE_C_NOTE())}</div></section>`;
  const valueOf = (h: string, v: string): string | number | boolean => (h === "viewInC" ? v === "on" : h === "middleC" ? Number(v) : v);
  const sync = () => {
    for (const b of content.querySelectorAll<HTMLButtonElement>("[data-h]")) {
      const on = (chosen as Record<string, unknown>)[b.dataset.h!] === valueOf(b.dataset.h!, b.dataset.v!);
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
    }
  };
  content.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-h]"); if (!b) return;
    const h = b.dataset.h as keyof typeof chosen, v = valueOf(h, b.dataset.v!);
    if (chosen[h] === v) delete chosen[h]; else (chosen as Record<string, unknown>)[h] = v;   // 点亮着的那格 = 取消（每一问都可以不选）
    sync();
  });
  sync();
  let closed = false;
  const shell = openPanelShell({ title: _t("看谱的习惯"), content, width: "wide",
    buttons: [{ id: "later", label: _t("以后再说") }, { id: "ok", label: _t("好"), primary: true }],
    onButton: (id) => { if (closed) return; closed = true; shell.close(); if (id === "ok") d.done({ ...chosen } as Habits); else d.later(); },
    onClose: () => { if (closed) return; closed = true; d.dismissed(); } });
  shell.el.classList.add("habits-panel");
  return { close: () => { if (!closed) { closed = true; shell.close(); } } };
}
