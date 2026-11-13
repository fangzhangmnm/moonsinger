// song-view.ts —— 「这首歌怎么看」：歌文件里的显示设置读成一个对象——只此一处。第三刀收的四样（谱种 / 和弦标级数 / 按 C 调看 / 每条轨的和弦选项）读、改都走这里；
//   第四刀 4-5 又收了原来就有的三样（版式 / 歌词排法 / 小节号）的读（它们的改照旧在 song.ts 的 setDensity / setLyricFit / setBarNumbers；7-C 起和纸张一起归修改锁的「看法」，
//   类别 density / lyricFit / barNumbers / paperSize，见 src/app/edit-lock-table.ts）。音距不单收：v0.16.43 起音距跟着版式走（排版参数表按版式挑），歌里的 spacing 键没人读、只原样存回。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第三刀；设计稿 ai-docs/20261111-score-surface-architecture.md 第 3.7 节、施工单第三节「3」）。
//   user 11-11 夜拍了这四样存进歌文件（「可以」）。它们决定这首歌怎么印：进撤销、会标脏；归修改锁的「看法」那一类（src/app/edit-lock-table.ts songLook：锁着能切，锁着期间不写文件）。
//   以前「和弦标级数」「按 C 调看」存在设备上（device-kv chord-tags / view-in-c）：这一刀起不再读那两个键，也不删；不把设备上的旧值搬进歌（user 同一条消息听过这个后果）。
//
//   17-1（2026-11-13）：读的那一半（songViewOf）搬进 src/look/index.ts lookOf——每一项多一个值 "default"（跟着软件），它现在等于什么只在那里定。
//   **照写着的读**（16-4 A3，2026-11-13，统筹「A3 的三问」做法 2）：歌里这几样永远明写——新建的歌按 song.ts NEW_SONG_LOOK 写、读文件的门口补老歌缺的
//     （src/format/project.ts songLookOf）、改设置的函数永远写值。原来「文件里没写 = UNWRITTEN 里的值」那张冻住的表删了（值一个没改，搬进了 NEW_SONG_LOOK）。
//   读到不认识的值（只有比这一版新的文件会带来：键认识、值不认识，原样留在歌里、存的时候照写）：画的时候按最基本的那一档（谱种 = 五线谱、歌词 = 按节奏、小节号 = 印、
//     中央 C = C4、谱上的字 = 跟着界面），页面设置那一项写「这一版不认识」，打开时说一句（门口）。这几个「按哪一档画」只管认不出来的值，不是没写的意思。
//   每条轨的和弦选项（PartDef.chords）这一版还是「没写 = 也认拆开弹的（auto）」，下一版跟每张纸 / 每个声部的那几样一起改成明写。
import type { EditorState, Song, PartDef } from "./song.ts";
import type { Lang } from "../i18n/strings.ts";
import type { Density } from "./paper.ts";

/** 谱种：五线谱 / 简谱（第四刀）/ 字母谱（7-B：简谱的变体，数字换成实际音名的字母，同一种数字行）。以后 "figures"（设计稿第 7 节）。封闭的联合，不走注册表（ADR-0004：显示 = 库）。 */
export type NotationId = "staff" | "jianpu" | "letters";
export const NOTATIONS: readonly NotationId[] = ["staff", "jianpu", "letters"];
/** 每条轨的和弦选项三档（设计稿第 3.7 节）：只认叠在一起的和弦 / 也认拆开弹的和弦 / 折叠成和弦名（折叠 = 第五刀，现在画法同 auto）。 */
export type ChordsMode = "stacked" | "auto" | "fold";
export const CHORDS_MODES: readonly ChordsMode[] = ["stacked", "auto", "fold"];

/** 谱上的字用哪种语言（12-4）：跟着界面 / 界面语言里的一种。歌里存的不认识的值（更新的版本写的）读成「跟着界面」，原样留在歌里。 */
export type TextLang = "ui" | Lang;
/** 界面上能选的（页面设置「版面」页、导出乐谱的面板）。界面多一种语言 = 这里多一项。 */
export const TEXT_LANGS: readonly TextLang[] = ["ui", "zh", "en"];
export const isTextLang = (v: unknown): v is TextLang => (TEXT_LANGS as readonly unknown[]).includes(v);
/** 印出来的字用哪种语言：歌里写了一种 = 那一种；跟着界面 = 交进来的界面语言（排版明着吃语言，不读这一页的当前语言）。 */
export function textLangIn(look: Pick<SongView, "textLang">, ui: Lang): Lang { return look.textLang === "ui" ? ui : look.textLang; }
/** 歌词怎么排：按节奏（音的位置只看时值，歌词让路）/ 按歌词（长字把音推开）。 */
export type LyricFit = "rhythm" | "lyrics";

/** 这首歌怎么看。排版、PDF、键盘上的大字、鬼音符、谱面的拖音高都读它，不各读各的歌字段。 */
export interface SongView {
  readonly notation: NotationId;
  /** 叠音的和弦上方写级数（乐理模块 src/theory/）。 */
  readonly chordTags: boolean;
  /** 按 C 调看（辅助）：谱换到 C 调画、每个调号上方写「1=原来的调」、键上大字写谱上画成的名字（第 19 条；原来写级数）；拖音高 / 鬼音符按显示的换回实际的。= 存着的值（设置面板亮哪个钮）。 */
  readonly viewInC: boolean;
  /** 按 C 调看此刻起不起作用 = 存着开 ∧ 这种谱上起作用（IN_C_APPLIES：简谱本来就是首调、字母谱写的是实际的音名：开关变灰、存着的值不动；施工单第三节「4」、7-B）。排版、谱面、键上的大字都看这个。 */
  readonly inCActive: boolean;
  /** 这条轨的和弦选项。 */
  chordsOf(part: string): ChordsMode;
  /** 版式（舒适 / 紧凑）：谱多大、音距、行距（排版参数表按它挑一行）。存在纸里（Song.paper.density）。 */
  readonly density: Density;
  /** 歌词怎么排。 */
  readonly lyricFit: LyricFit;
  /** 每行开头印不印小节号。 */
  readonly barNumbers: boolean;
  /** 字母谱里中央 C 叫 C 几（C-4 那个数字；默认 4，可以 3 / 5；7-B）。别的谱种用不上。 */
  readonly middleC: number;
  /** 演奏法和表情显示不显示（7-G；score minor 8）。false = 键盘「演奏法」「力度」两页上的东西都不交给排版（不画、不占地方；src/render/expressions.ts），播放照写的来。 */
  readonly expressions: boolean;
  /** 谱上的字用哪种语言（12-4；score minor 10）。换成具体的语言用 textLangIn。 */
  readonly textLang: TextLang;
}

export const isNotation = (v: unknown): v is NotationId => (NOTATIONS as readonly unknown[]).includes(v);
/** 这种谱是不是首调（「1」= 这个调的主音）：首调的谱上「按 C 调看」没有意义。 */
export const MOVABLE_DO: Readonly<Record<NotationId, boolean>> = { staff: false, jianpu: true, letters: false };
/** 这种谱上「按 C 调看」起不起作用：五线谱 = 起；简谱本来就是首调；字母谱写的是实际的音名（7-B：「按 C 调看」在字母谱下变灰）。 */
export const IN_C_APPLIES: Readonly<Record<NotationId, boolean>> = { staff: true, jianpu: false, letters: false };
/** 中央 C 叫 C 几：一位整数 0–9 才认（界面上只给 3 / 4 / 5）。 */
export const isMiddleC = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 9;
/** 界面上能选的中央 C 叫法。 */
export const MIDDLE_C_NAMES: readonly number[] = [3, 4, 5];

// 歌 → 这首歌怎么看：第 17 条 17-1 起搬进 src/look（lookOf；"default" 现在等于什么、和弦选项没写的意思都在那里）。这里只留类型、谱种的表和改的函数。

// ── 改（核心的词：算好整份编辑状态交回；宿主走文档写入口，类别 = songLook）──

/** 换谱种（每一种都明写，16-4 A3）。 */
export function setNotation(st: EditorState, id: NotationId): EditorState {
  if (st.song.notation === id) return st;
  return { ...st, song: { ...st.song, notation: id } };
}
/** 字母谱里中央 C 叫 C 几。 */
export function setMiddleC(st: EditorState, n: number): EditorState {
  if (!isMiddleC(n) || st.song.middleC === n) return st;
  return { ...st, song: { ...st.song, middleC: n } };
}
/** 演奏法和表情显示 / 不显示（7-G）。 */
export function setExpressions(st: EditorState, on: boolean): EditorState {
  if (st.song.expressions === on) return st;
  return { ...st, song: { ...st.song, expressions: on } };
}
/** 谱上的字用哪种语言（12-4）。必填的键：跟着界面也明着写 "ui"（存文件时不写进 score.json，进门时补回来）。 */
export function setTextLang(st: EditorState, v: TextLang): EditorState {
  if (!isTextLang(v) || st.song.textLang === v) return st;
  return { ...st, song: { ...st.song, textLang: v } };
}
/** 和弦标级数开 / 关。 */
export function setChordTags(st: EditorState, on: boolean): EditorState {
  if (st.song.chordTags === on) return st;
  return { ...st, song: { ...st.song, chordTags: on } };
}
/** 按 C 调看开 / 关。 */
export function setViewInC(st: EditorState, on: boolean): EditorState {
  if (st.song.viewInC === on) return st;
  return { ...st, song: { ...st.song, viewInC: on } };
}
/** 这条轨的和弦选项。内存里 auto = 不存（写法不动，第 17 条四问第 2 条；读的那一侧「没写 = auto」在 src/look）。 */
export function setPartChords(st: EditorState, partId: string, mode: ChordsMode): EditorState {
  const p = st.song.parts.find((x) => x.id === partId), want = mode === "auto" ? undefined : mode;
  if (!p || p.chords === want) return st;
  const np: PartDef = { ...p }; if (want === undefined) delete np.chords; else np.chords = want;
  return { ...st, song: { ...st.song, parts: st.song.parts.map((x) => (x.id === partId ? np : x)) } };
}

/** 这四样在歌里住在哪几个键（歌的顶层三个 + 每个声部一个）。修改锁拿它核「这一步真的只动了这首歌怎么看」（src/app/edit-lock-table.ts）。 */
export const SONG_VIEW_KEYS = ["notation", "chordTags", "viewInC", "middleC", "expressions", "textLang"] as const;   // textLang = 谱上的字用哪种语言（12-4）   // middleC = 字母谱里中央 C 叫 C 几（7-B）；expressions = 演奏法和表情显示不显示（7-G）
export const PART_VIEW_KEYS = ["chords"] as const;
