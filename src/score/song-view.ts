// song-view.ts —— 「这首歌怎么看」：歌文件里的显示设置读成一个对象——只此一处。第三刀收的四样（谱种 / 和弦标级数 / 按 C 调看 / 每条轨的和弦选项）读、改都走这里；
//   第四刀 4-5 又收了原来就有的三样（版式 / 歌词排法 / 小节号）的读（它们的改照旧在 song.ts 的 setDensity / setLyricFit / setBarNumbers：那三样是内容，不归修改锁的「看法」，
//   算不算看法要 user 定 = 愿望单 W-68）。音距不单收：v0.16.43 起音距跟着版式走（排版参数表按版式挑），歌里的 spacing 键没人读、只原样存回。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第三刀；设计稿 ai-docs/20261111-score-surface-architecture.md 第 3.7 节、施工单第三节「3」）。
//   user 11-11 夜拍了这四样存进歌文件（「可以」）。它们决定这首歌怎么印：进撤销、会标脏；归修改锁的「看法」那一类（src/app/edit-lock-table.ts songLook：锁着能切，锁着期间不写文件）。
//   以前「和弦标级数」「按 C 调看」存在设备上（device-kv chord-tags / view-in-c）：这一刀起不再读那两个键，也不删；不把设备上的旧值搬进歌（user 同一条消息听过这个后果）。
//
//   **没写的意思冻住**（施工单第三节「3」，统筹定）：文件里没写某一样 = UNWRITTEN 里的值，这个值永远不变——
//     谱种没写 = 五线谱；和弦标级数没写 = 标；按 C 调看没写 = 不按；每条轨的和弦选项没写 = 也认拆开弹的（auto）。
//   「新文档默认是什么」是另一回事：那是 app 建文档时明着写进歌里的值，以后可以改；这一刀新建的歌四样都不写。所以读写两头都不许出现「没写就取 app 现在的默认」。
//   只写不是 UNWRITTEN 的值（照 lyricFit / barNumbers 的习惯）；读到不认识的值（更新的版本写的）原样留在歌里、写回去，画的时候按 UNWRITTEN。
import type { EditorState, Song, PartDef } from "./song.ts";
import { type Density, densityOf, paperOf, DEFAULT_PAPER } from "./paper.ts";

/** 谱种。现在只画得出五线谱；简谱 = 第四刀。以后 "letters" | "figures"（设计稿第 7 节）。封闭的联合，不走注册表（ADR-0004：显示 = 库）。 */
export type NotationId = "staff" | "jianpu";
export const NOTATIONS: readonly NotationId[] = ["staff", "jianpu"];
/** 每条轨的和弦选项三档（设计稿第 3.7 节）：只认叠在一起的和弦 / 也认拆开弹的和弦 / 折叠成和弦名（折叠 = 第五刀，现在画法同 auto）。 */
export type ChordsMode = "stacked" | "auto" | "fold";
export const CHORDS_MODES: readonly ChordsMode[] = ["stacked", "auto", "fold"];

/** 文件里没写 = 这些值。写死，永远不变（改它 = 改了所有旧歌的样子）。chordTags / viewInC 在文件里永远是布尔（src/format/contract.ts score minor 5 那段）。
 *  后三样是原来就有的意思（4-5 收进来时照抄，不是新定的）：版式没写 = 舒适（paper.ts densityOf）；歌词排法没写 = 按节奏（v0.9.40 user「默认用修歌词的那个排版方式吧」，
 *  旧歌打开也是按节奏）；小节号没写 = 每行开头印（v0.9.42「默认是每行开头有」）。 */
export const UNWRITTEN: Readonly<{ notation: NotationId; chordTags: boolean; viewInC: boolean; chords: ChordsMode; density: Density; lyricFit: LyricFit; barNumbers: boolean }> =
  Object.freeze({ notation: "staff", chordTags: true, viewInC: false, chords: "auto", density: "cozy", lyricFit: "rhythm", barNumbers: true });
/** 歌词怎么排：按节奏（音的位置只看时值，歌词让路）/ 按歌词（长字把音推开）。 */
export type LyricFit = "rhythm" | "lyrics";

/** 这首歌怎么看。排版、PDF、键盘上的大字、鬼音符、谱面的拖音高都读它，不各读各的歌字段。 */
export interface SongView {
  readonly notation: NotationId;
  /** 叠音的和弦上方写级数（乐理模块 src/theory/）。 */
  readonly chordTags: boolean;
  /** 按 C 调看（辅助）：谱换到 C 调画、每个调号上方写「1=原来的调」、键上大字写级数；拖音高 / 鬼音符按显示的换回实际的。 */
  readonly viewInC: boolean;
  /** 这条轨的和弦选项。 */
  chordsOf(part: string): ChordsMode;
  /** 版式（舒适 / 紧凑）：谱多大、音距、行距（排版参数表按它挑一行）。存在纸里（Song.paper.density）。 */
  readonly density: Density;
  /** 歌词怎么排。 */
  readonly lyricFit: LyricFit;
  /** 每行开头印不印小节号。 */
  readonly barNumbers: boolean;
}

const isNotation = (v: unknown): v is NotationId => (NOTATIONS as readonly unknown[]).includes(v);
const isChords = (v: unknown): v is ChordsMode => (CHORDS_MODES as readonly unknown[]).includes(v);

/** 歌 → 这首歌怎么看（纯函数；不读设备、不读界面语言、不读时钟）。 */
export function songViewOf(song: Song): SongView {
  const chords = new Map<string, ChordsMode>();
  for (const p of song.parts) if (isChords(p.chords)) chords.set(p.id, p.chords);
  return {
    notation: isNotation(song.notation) ? song.notation : UNWRITTEN.notation,
    chordTags: song.chordTags === false ? false : UNWRITTEN.chordTags,
    viewInC: song.viewInC === true ? true : UNWRITTEN.viewInC,
    chordsOf: (part) => chords.get(part) ?? UNWRITTEN.chords,
    density: densityOf(song.paper ?? paperOf(DEFAULT_PAPER)),
    lyricFit: song.lyricFit === "lyrics" ? "lyrics" : UNWRITTEN.lyricFit,
    barNumbers: song.barNumbers === "off" ? false : UNWRITTEN.barNumbers,
  };
}

// ── 改（核心的词：算好整份编辑状态交回；宿主走文档写入口，类别 = songLook）──

/** 换谱种。五线谱 = 不写。 */
export function setNotation(st: EditorState, id: NotationId): EditorState {
  const want = id === UNWRITTEN.notation ? undefined : id; if (st.song.notation === want) return st;
  const song = { ...st.song }; if (want === undefined) delete song.notation; else song.notation = want;
  return { ...st, song };
}
/** 和弦标级数开 / 关。开 = 不写。 */
export function setChordTags(st: EditorState, on: boolean): EditorState {
  const want = on === UNWRITTEN.chordTags ? undefined : false; if (st.song.chordTags === want) return st;
  const song = { ...st.song }; if (want === undefined) delete song.chordTags; else song.chordTags = want;
  return { ...st, song };
}
/** 按 C 调看开 / 关。关 = 不写。 */
export function setViewInC(st: EditorState, on: boolean): EditorState {
  const want = on === UNWRITTEN.viewInC ? undefined : true; if (st.song.viewInC === want) return st;
  const song = { ...st.song }; if (want === undefined) delete song.viewInC; else song.viewInC = want;
  return { ...st, song };
}
/** 这条轨的和弦选项。auto = 不写。 */
export function setPartChords(st: EditorState, partId: string, mode: ChordsMode): EditorState {
  const p = st.song.parts.find((x) => x.id === partId), want = mode === UNWRITTEN.chords ? undefined : mode;
  if (!p || p.chords === want) return st;
  const np: PartDef = { ...p }; if (want === undefined) delete np.chords; else np.chords = want;
  return { ...st, song: { ...st.song, parts: st.song.parts.map((x) => (x.id === partId ? np : x)) } };
}

/** 这四样在歌里住在哪几个键（歌的顶层三个 + 每个声部一个）。修改锁拿它核「这一步真的只动了这首歌怎么看」（src/app/edit-lock-table.ts）。 */
export const SONG_VIEW_KEYS = ["notation", "chordTags", "viewInC"] as const;
export const PART_VIEW_KEYS = ["chords"] as const;
