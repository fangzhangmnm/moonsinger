// song.ts —— 一首歌 = 一串 token（音符 / 休止 / 小节线 / 记号：调号 · 拍号 · 速度）。created 2026-10-06 by Claude Opus 5.5
// 2026-10-07 UX-2 重写（grill 账本 §9¾，user 原话见账本）：
//   · 数据只存时长 + tie（「连着前一个音」）+ hyph（「这个词接到下一个音」）——单位、份数不进数据（user「不要hidden landmine，所以你说的份数可能就是编辑的立即存的，而不是音的属性？」）；
//   · 时间精度 = 每四分 1680 格（2⁴·3·5·7：三十二分、三 / 五 / 七连音都是整数；user「所以你是想离散时间精度…那么可以啊」）；
//   · 调号变化是 token，和小节线一样（user「显示的调号边界能不能也是一个记谱的token，和小节线一样」）；
//   · 选中 = 改，光标 = 写（user「智能识别，选中音符就是改，光标就是写 对」）：有选中就作用在选中上，没选中就作用在下一个要写的音上；
//   · 写的时候：长短 = 输入状态（三十二分…全音符六档，默认八分），「−」把刚写的音加一份它写入时的单位、跨小节线就新开一个 tie 着的音，
//     退格撤回「本次输入记录」的最后一笔；记录在离开写（选中、挪光标）时清空——写字头在，记录就在。
// 2026-10-07：调号 / 拍号 / 速度全是 token，没有全局设置（user「谱子的调号应该也是一个按了可以下拉的文本框。不是全局的，bpm也是，都是token」「这么说拍号也是」）。
//   一首歌开头固定三个记号（谱头）：光标进不去、删不掉，只能就地改；中途可以插，插的地方旁边已有同类记号就改它而不是再插一个。
// 编辑器状态是纯数据，所有命令是纯函数：旧状态 → 新状态。
// 2026-10-08 多声部多纸（0.5.0；user「首先就是不同的声部视图和出声应该分别可以solo和hide」「总谱式上下叠」「我以为纸就是曲段」）：
//   · 一首歌 = 按顺序的几张纸（纸 = 曲段）× 歌级的声部并集；每张纸上每个声部一串 token（开头三个谱头记号照旧）；某张纸没某声部 = 没那串。
//   · 编辑器的光标 / 选中落在**一条 track**（哪张纸 × 哪个声部 = EditorState.at）；所有写 / 改命令只碰那一条（tr(st) 取、withTrack 写回）。
//   · 纸内各声部按 tick 对齐（从纸的开头数；不按小节线对齐——小节线只是各自的记谱）；纸界 = 硬对齐点（短的补休止到最长的那条，契约 §6¾）。
//   · 速度 = 第一个声部的状态机（其余声部的速度记号只是跟着抄、不出声不画）。

import { type Paper, type PaperKind, type Density, DEFAULT_PAPER, paperOf, densityOf } from "./paper.ts";
import { type Dir, type Pitch, HOME, placeDegree, stepBy, alterBy, octaveBy, transposeSemis, transposeInterval, keyInterval, midiOf, keySpell } from "./pitch.ts";

/** 一个四分音符的 tick 数。 */
export const TPQ = 1680;
/** 第一版拍子单位 = 四分音符（x/4 拍号）。 */
export const BEAT = TPQ;
export const WHOLE = TPQ * 4;
/** 长短六档（plain 值）：三十二分 · 十六分 · 八分 · 四分 · 二分 · 全音符（user「长的话最多全音符同意，再有需求用连音」）。 */
export const LADDER = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, WHOLE] as const;
export const DEFAULT_UNIT = 2;   // 八分（user「默认可以是八分音符吗」）
/** 连音：n 个占 m 个的位置 → 每个 × m/n（三连 ×⅔、五连 ×⅘、六连 ×⅔（4 拍分 6）、七连 ×4/7）。 */
export const TUPLET: Record<number, [number, number]> = { 3: [2, 3], 5: [4, 5], 6: [4, 6], 7: [4, 7] };
/** 数据上的时值下限 / 上限（下限 = 三十二分七连音；上限 = 四个全音符，再长用连音线）。 */
export const MIN_DUR = (TPQ / 8) * 4 / 7;
export const MAX_DUR = WHOLE * 4;

/** lang = 这个音节唱哪种语言，**只在和自动认的不一样时才有**（持久化第 6 题：存档时每个音节都写明，编辑时自动认、认错了才改；规则见 score/lang.ts）。 */
export interface NoteTok { kind: "note"; id: number; pitch: Pitch | null; dur: number; lyric: string | null; hyph?: boolean; tie?: boolean; lang?: string; staff?: Staff; chord?: Pitch[]; art?: Art[]; slur?: boolean; swell?: Swell }   // staff = 大谱表里手动指定的上 / 下（没有 = 按音高自动）
//   slur（2026-10-08 连断，Claude Opus 5.5）= 连线：这个音连到下一个音（不留缝）；一串连着的 = 一条连线。MusicXML <slur type="start/stop"> 原生。
//     user「连和断，嗯就是我想的，能做吗」「连断 预设 都同意」：底色归演奏者（articulation.gapSec），谱上的连线只改局部。
//   swell（2026-10-08，Claude Opus 5.5；user「一个音里面的发展…要要我都要」）= 音内的力度起伏：< 越来越强、> 越来越弱（锯齿）、<> 鼓起来再落（messa di voce）；
//     音自己的事（和段落级的渐强渐弱记号是两层，可以叠）。存在 .moonsinger/score.json（MusicXML 里表达不了音内的发夹）。
//   chord（2026-10-08 polyphony）= 叠音：pitch 之外的音高，都比 pitch 低、从高到低；pitch = 最高的那个 = 旋律线（唱的人只读它：user「一个 Polyphony 换月读…应该是只读上面的旋律线」）。MusicXML = <chord/>。
export interface RestTok { kind: "rest"; id: number; dur: number; staff?: Staff }
export interface BarTok { kind: "bar"; id: number }
/** 句号（2026-10-08，Claude Fable 5.1；user「现在 || 没有这个我碰到稍微长一点的曲子都快疯了」「歌词的句号可能需要这个」「呼吸就是呼吸，然后句号另外算，不自动呼吸，没有语义，或者只提示月读，不算打谱符号」）：
 *  这一句到这儿。**没有语义**：不换行（「不应该按照句换行，打谱软件没这么干的」）、不换气、不是小节线（不数拍、弱起照旧）；只给「合」挪字当边界，画成歌词行上一个小「。」。
 *  pad 符号层的「句号」键 / Shift+Enter / 歌词里打句读插入。**不进 MusicXML**（不算打谱符号），存 .moonsinger/score.json（papers[].phrases）。 */
export interface PhraseTok { kind: "phrase"; id: number }
export interface KeyTok { kind: "key"; id: number; fifths: number }
export interface TimeTok { kind: "time"; id: number; beats: number; beatType: number }
export interface TempoTok { kind: "tempo"; id: number; bpm: number }   // 每分钟几个四分音符
export type MarkTok = KeyTok | TimeTok | TempoTok;
/** 「修」的记号（2026-10-08 by Claude Opus 5.5；user「呼吸记号 跳音 / 力度这类修的记号进选区条」「flow 还是主旋律，修才管这些」→ 拍「挂在音上 + 选区条」「月读在那儿换气」）：
 *  演奏法 = 挂在音上（art，按 ARTS 的顺序、不重复）；MusicXML <notations><articulations> 原生——呼吸 = <breath-mark/>，挂在呼吸前的那个音上。
 *  出声：跳音 = 截短（候选的 articulation.staccatoGate）、重音 = 音头加 accentDb、保持 = 满长；呼吸 = 月读在下一个字前换一口气（唱法核心的「v」），乐器不受影响。 */
export type Swell = "<" | ">" | "<>";
export const SWELL_NAME: Record<Swell, string> = { "<": "音内渐强", ">": "音内渐弱", "<>": "音内鼓起" };
export type Art = "staccato" | "accent" | "marcato" | "sfz" | "fp" | "tenuto" | "breath";   // marcato = 强音（^，比重音更重；MusicXML <strong-accent/>；2026-10-08 加）
//   sfz = 突强、fp = 强后即弱（2026-10-08，user「音头先冲一下，再回落…要，要，我都要」）：音头的力度形状，MusicXML <notations><dynamics>；
//   音头那一组（重音 / 强音 / sfz / fp）互斥——开一个就关掉别的（ATTACKS）。
export const ARTS: readonly Art[] = ["staccato", "accent", "marcato", "sfz", "fp", "tenuto", "breath"];
export const ATTACKS: readonly Art[] = ["accent", "marcato", "sfz", "fp"];
export const ART_NAME: Record<Art, string> = { staccato: "跳音", accent: "重音", marcato: "强音", sfz: "突强", fp: "强后即弱", tenuto: "保持", breath: "呼吸" };
/** 力度 = 一个记号 token（不占时值，管到下一个力度为止；一首没写 = mf）。MusicXML <direction><dynamics>。出声 = 候选的 dynamicsDb（mf = 0 dB）。 */
export type Dyn = "pp" | "p" | "mp" | "mf" | "f" | "ff";
export const DYNS: readonly Dyn[] = ["pp", "p", "mp", "mf", "f", "ff"];
export const DEFAULT_DYN: Dyn = "mf";
export interface DynTok { kind: "dyn"; id: number; value: Dyn }
/** 渐强 / 渐弱（2026-10-08 改成记号，Claude Opus 5.5；user「所以<>是一个语义，就是从这一刻开始连续变到下一个强度/速度标记？」「大于小于号不用精确指定范围，而是读最近的pf」）：
 *  状态的过渡——从这儿起连续变到同一张纸里的下一个力度记号；中间又遇到一个渐强渐弱 = 这一段到那儿为止；都没有 = 走一档（演奏者的 wedgeStep），谱上灰字披露。 */
export interface HairpinTok { kind: "hairpin"; id: number; dir: "cresc" | "dim" }
export type Token = NoteTok | RestTok | BarTok | PhraseTok | MarkTok | DynTok | HairpinTok;
export type Timed = NoteTok | RestTok;
/** 一个记号的值（不带 id）。 */
export type MarkVal = Omit<KeyTok, "id"> | Omit<TimeTok, "id"> | Omit<TempoTok, "id">;

/** 「哼的字」：跟语言无关的五档，唱的时候按语言换字（lab-score.ts HUM_SYLLABLE）。o = 2026-10-07 加（user「GM不是还有一个ooo吗」「对，哦 / お」）。 */
export type Hum = "la" | "n" | "u" | "o" | "a";

/** 歌级的一个声部（谱上的一行；顺序 = 总谱从上到下）：role = 休息室角色 id（谁来演、叫什么），mic = 录音房麦克风 id。 */
export interface PartDef { id: string; role: string; mic: string; clef?: Clef; staves?: 2 }   // clef = 这个声部的谱号（没有 = 高音；存 MusicXML <clef>）；staves = 2 → 大谱表（上高音下低音，clef 不看；MusicXML <staves>）
export type Clef = "G" | "F";
export type Staff = 1 | 2;
/** 大谱表的分界：中央 C 以下自动落到下谱表（音可以手动指定 staff 覆盖；user 2026-10-08「钢琴这种左右手要两个谱号」「musicxml原生支持那就不纠结了直接上」）。 */
export const SPLIT_MIDI = 60;
/** 一张纸 = 一个曲段：name = 曲段名（纸顶那一条，可空）；tracks = 声部 id → 这张纸上这个声部的 token 串（开头三个谱头记号）。 */
export interface PaperSeg { id: string; name: string; tracks: Record<string, Token[]>; hidden?: boolean }   // hidden = 不放（压平 / 播放 / 导出的压平件都跳过）；全部视图里折叠着、翻页能进去（user 2026-10-08）
export interface Song {
  /** 歌名（可不填；纸面最上面那一行，存档 = MusicXML <work-title>；user 2026-10-07「纸张的最上面加一个可选的歌名吧，未来也是文件名」）。 */
  title?: string;
  /** 纸（A4 / A5 / A6 / 别的软件的别的纸）；没有 = 默认 A5（src/score/paper.ts；存档 = MusicXML <defaults>）。整首歌一个。 */
  paper?: Paper;
  /** 作者栏：一块纯文本、几行都行（作词作曲、演唱、月读的署名、声明…），纸上照写的显示（标题下面靠右）；可不填。
   *  不自动认「作词：」这类写法（user「你权衡一个plain multiline text vs自动识别（但是这样有hidden convention），你看一下怎么办」→ AI 选纯文本、所见即所得）。
   *  存档 = MusicXML <credit><credit-words>（印在页面上的字）。 */
  credits?: string;
  /** 这首歌自己（词 / 曲 / 编——用户写的那部分）的许可，一段文字，用户选或自己写；没有 = 没声明（不替用户选）。
   *  存档 = MusicXML <identification><rights>（标准位置，别的软件也认）；署名推演和 mp3 标签里排第一条（2026-10-08 by Claude Opus 5.5；user「你计算的时候别忘了用户自己写的那一部分，用户可以选」）。 */
  rights?: string;
  hum: Hum;              // 没写歌词的音唱什么（一首歌一个）
  parts: PartDef[];      // 声部并集（总谱从上到下的顺序）
  papers: PaperSeg[];    // 纸（曲段）的顺序表
}
/** 光标 / 选中落在哪条 track（哪张纸 × 哪个声部）。 */
export interface Focus { paper: string; part: string }
export const DEFAULT_KEY = 0, DEFAULT_TIME = { beats: 4, beatType: 4 }, DEFAULT_BPM = 90;

/** 输入状态（不进数据）：写的时候下一个音长什么样。 */
export type Acc = -2 | -1 | 0 | 1 | 2;
export interface InputState {
  unit: number;                       // LADDER 下标
  tuplet: 0 | 3 | 5 | 6 | 7;          // 0 = 不连音；锁定式
  acc: Acc;                           // ♯ / ♭ Shift（pad 的升降键还能 𝄪 / 𝄫 = ±2）
  accMode: "off" | "once" | "lock";   // 点一下只管下一个音，连点两下锁住（user「double tap shift is "capslock"」）
  accAt: number;                      // 上一次点 Shift 的时刻（ms，判连点）
  inputFifths: number;                // 「1=」= 输入设备（pad / 电脑键盘）自己的调，默认 C；不跟谱上的调号（2026-10-07 user「把pad想成一个独立的medo式的输入设备，假设没有谱」「如果一个谱有好几个调怎么算」）
  inputScale: string;                 // pad 的调式（src/score/scales.ts 的 id），默认大调；只管 pad 上排哪些音（user「1=F能不能也做成两个的滚轮，右边可以换调性」）
}

/** 本次输入记录：退格撤回最后一笔（写字头在，记录就在）。 */
export type LogEntry =
  | { k: "ins"; id: number; unit: number }          // 写了一个音 / 休止（unit = 写入时的时长）
  | { k: "fill"; id: number; unit: number }         // 填了一个空音高的音（詞先）
  | { k: "ext"; id: number; by: number }            // 「−」加长
  | { k: "tie"; id: number; unit: number };         // 「−」跨小节线新开的 tie 音

export interface EditorState {
  song: Song;
  at: Focus;                                        // 正在写 / 改的那条 track
  caret: number;                                    // 插入点 0..tokens.length（sel 为 null 时 = 写）
  sel: { from: number; to: number; head?: number } | null;   // 选中范围 [from, to)（= 改）；head = 替换模式的写字头（在选区里打过音之后才有；见 replaceWrite）
  nextId: number;
  log: LogEntry[];
  input: InputState;
}

/** 一条 track 开头的三个谱头记号（id 从 id0 起连着编）。 */
export function headTokens(m: { fifths?: number; beats?: number; beatType?: number; bpm?: number } = {}, id0 = 1): Token[] {
  return [
    { kind: "key", id: id0, fifths: m.fifths ?? DEFAULT_KEY },
    { kind: "time", id: id0 + 1, beats: m.beats ?? DEFAULT_TIME.beats, beatType: m.beatType ?? DEFAULT_TIME.beatType },
    { kind: "tempo", id: id0 + 2, bpm: m.bpm ?? DEFAULT_BPM },
  ];
}
export const FIRST_PART = "P1", FIRST_PAPER = "p1";
/** 新歌：一张纸、一个声部（P1 → 角色 r1 → 麦克风 m1），哼的字默认「嗯」（user 2026-10-07「月读不是有啦嗯哦吗，默认嗯」）。 */
export function emptySong(m: { fifths?: number; beats?: number; beatType?: number; bpm?: number } = {}): Song {
  return { hum: "n", parts: [{ id: FIRST_PART, role: "r1", mic: "m1" }], papers: [{ id: FIRST_PAPER, name: "", tracks: { [FIRST_PART]: headTokens(m) } }] };
}
/** 单 track 的歌（测试 / 读别家单声部谱时顺手用）。 */
export function songOf(tokens: Token[], rest: Partial<Omit<Song, "parts" | "papers">> = {}): Song {
  return { hum: "n", ...rest, parts: [{ id: FIRST_PART, role: "r1", mic: "m1" }], papers: [{ id: FIRST_PAPER, name: "", tracks: { [FIRST_PART]: tokens } }] };
}
export function initInput(): InputState { return { unit: DEFAULT_UNIT, tuplet: 0, acc: 0, accMode: "off", accAt: 0, inputFifths: 0, inputScale: "major" }; }
/** 整首歌最大的 token id（新 id 从它后面编；所有纸、所有声部一起算，id 全歌唯一）。 */
export function maxId(song: Song): number { let m = 0; for (const p of song.papers) for (const ts of Object.values(p.tracks)) for (const t of ts) m = Math.max(m, t.id); return m; }
/** 第一条有内容的 track（第一张纸上第一个在场的声部）。 */
export function firstFocus(song: Song): Focus {
  const p = song.papers[0], part = song.parts.find((x) => p && p.tracks[x.id]) ?? song.parts[0];
  return { paper: p?.id ?? FIRST_PAPER, part: part?.id ?? FIRST_PART };
}
export function initState(song: Song = emptySong(), at: Focus = firstFocus(song)): EditorState {
  return { song, at, caret: trackOf(song, at.paper, at.part).length, sel: null, nextId: maxId(song) + 1, log: [], input: initInput() };
}
/** 某张纸上某声部的 token 串（没有这条 = 空）。 */
export function trackOf(song: Song, paper: string, part: string): Token[] { return song.papers.find((p) => p.id === paper)?.tracks[part] ?? []; }
/** 第一张纸上第一个声部的那条（单 track 的歌就是「那串 token」；测试 / 读别家谱用）。 */
export const firstTrack = (song: Song): Token[] => { const f = firstFocus(song); return trackOf(song, f.paper, f.part); };
/** 光标所在的那条 track。 */
export const tr = (st: EditorState): Token[] => trackOf(st.song, st.at.paper, st.at.part);
/** 把一条 track 换掉（纯函数）。 */
export function withTrack(song: Song, paper: string, part: string, tokens: Token[]): Song {
  return { ...song, papers: song.papers.map((p) => (p.id === paper ? { ...p, tracks: { ...p.tracks, [part]: tokens } } : p)) };
}
/** 换到另一条 track（点了别的谱行 / 别的纸）：清选中、清本次输入记录；caret 默认放到那条的末尾。 */
export function setFocus(st: EditorState, paper: string, part: string, caret?: number): EditorState {
  if (st.at.paper === paper && st.at.part === part && caret === undefined) return st;
  const toks = trackOf(st.song, paper, part);
  return { ...leave(st), at: { paper, part }, sel: null, caret: Math.max(headLen(toks), Math.min(toks.length, caret ?? toks.length)) };
}

export const isTimed = (t: Token): t is Timed => t.kind === "note" || t.kind === "rest";
export const isMark = (t: Token): t is MarkTok => t.kind === "key" || t.kind === "time" || t.kind === "tempo";
/** 谱头 = 开头连着的记号；光标最左只能到它后面。 */
export function headLen(tokens: Token[]): number { let n = 0; while (n < tokens.length && isMark(tokens[n])) n++; return n; }
export const isWriting = (st: EditorState): boolean => st.sel === null;

// ── 查询 ────────────────────────────────────────────────────────────────

/** 光标前最近的音符 / 休止（跳过小节线、调号）。 */
export function currentIndex(st: EditorState): number {
  for (let i = st.caret - 1; i >= 0; i--) if (isTimed(tr(st)[i])) return i;
  return -1;
}
/** 下标 i 之前最近一个有音高的音（就近规则的参照）。 */
export function prevPitch(tokens: Token[], i: number): Pitch | null {
  for (let j = i - 1; j >= 0; j--) { const t = tokens[j]; if (t.kind === "note" && t.pitch) return t.pitch; }
  return null;
}
/** 空音高的音：显示和播放时沿用前一个有音高的音，什么都没有就是 HOME。 */
export function effectivePitch(tokens: Token[], i: number): Pitch {
  const t = tokens[i];
  if (t.kind === "note" && t.pitch) return t.pitch;
  return prevPitch(tokens, i) ?? HOME;
}
// ── 叠音（polyphony，2026-10-08；user「同时按同意」「叠 = 又一个 shift lock 键…开的时候就往前一个音上面叠，然后是 xor 的叠（但是不会删最后一个音）」） ──
/** 这个音上的全部音高（最高的在前 = pitch）；没音高 = []。 */
export const allPitches = (t: NoteTok): Pitch[] => (t.pitch ? [t.pitch, ...(t.chord ?? [])] : []);
/** 一组音高 → 规范形：按 midi 从高到低、同 midi 去重；最高的 = pitch，其余 = chord（只有一个 = 不带 chord）。 */
export function withPitches(t: NoteTok, ps: Pitch[]): NoteTok {
  const seen = new Set<number>(), sorted = [...ps].sort((a, b) => midiOf(b) - midiOf(a)).filter((p) => { const m = midiOf(p); if (seen.has(m)) return false; seen.add(m); return true; });
  const { chord: _chord, ...rest } = t; void _chord;
  if (!sorted.length) return { ...rest, pitch: null };
  return sorted.length > 1 ? { ...rest, pitch: sorted[0], chord: sorted.slice(1) } : { ...rest, pitch: sorted[0] };
}
/** 叠 / 拿掉一个音高（XOR；最后一个永远留着）。 */
export function toggleChordPitch(st: EditorState, i: number, p: Pitch): EditorState {
  const t = tr(st)[i]; if (!t || t.kind !== "note" || !t.pitch) return st;
  const ps = allPitches(t), m = midiOf(p), has = ps.some((q) => midiOf(q) === m);
  if (has && ps.length <= 1) return st;
  const nt = tr(st).slice(); nt[i] = withPitches(t, has ? ps.filter((q) => midiOf(q) !== m) : [...ps, p]);
  return next(st, nt);
}
/** pad 的「叠」：往前一个音（有选中 = 选中的第一个音）上叠（挂着的升降一样用掉）。 */
export function stackPitch(st: EditorState, pitch0: Pitch): EditorState {
  const input = consumeAcc(st.input);
  if (st.sel) {   // 有选中 = 叠到「当前那个音」上：替换模式里 = 刚写的那个（写字头前面）；还没写过 = 选区里第一个音（键盘只管打谱，整组的操作在选区菜单里）
    const i = st.sel.head != null ? lastTimedBefore(tr(st), st.sel.head, st.sel.from) : firstNoteIn(st);
    if (i < 0 || tr(st)[i].kind !== "note") return { ...st, input };
    return toggleChordPitch({ ...st, input }, i, keySpell(applyAcc(pitch0, st.input), keyAt(tr(st), i)));
  }
  const i = currentIndex(st);
  if (i < 0 || tr(st)[i].kind !== "note") return { ...st, input };
  const pitch = keySpell(applyAcc(pitch0, st.input), keyAt(tr(st), i));   // 按谱上的调号简化拼写（同 writePitch）
  return toggleChordPitch({ ...st, input }, i, pitch);
}
/** 只有这一张纸的歌（本段视图的播放范围；user 2026-10-08「为什么在本段视图下播放还是播放全部了？」）。 */
export const songOnlyPaper = (song: Song, paperId: string): Song => ({ ...song, papers: song.papers.filter((p) => p.id === paperId) });

/** 下标 i 处（i 之前最近的那个记号）生效的调号 / 拍号 / 速度（一条 track 内）。 */
export function keyAt(tokens: Token[], i: number): number {
  let f = DEFAULT_KEY;
  for (let j = 0; j < i && j < tokens.length; j++) { const t = tokens[j]; if (t.kind === "key") f = t.fifths; }
  return f;
}
export function timeAt(tokens: Token[], i: number): { beats: number; beatType: number } {
  let v = DEFAULT_TIME;
  for (let j = 0; j < i && j < tokens.length; j++) { const t = tokens[j]; if (t.kind === "time") v = t; }
  return { beats: v.beats, beatType: v.beatType };
}
export function tempoAt(tokens: Token[], i: number): number {
  let v = DEFAULT_BPM;
  for (let j = 0; j < i && j < tokens.length; j++) { const t = tokens[j]; if (t.kind === "tempo") v = t.bpm; }
  return v;
}
/** 速度的「语义」：数据只存 bpm（绝对的那个数），词按 bpm 落在哪一档推出来，谱上画「词 ♩ = 数」
 *  （user「速度记号可以用语义+数字吗。绝对零度。」）。typical = 候选里点这个词时给的 bpm；档的边界是常见范围取的整数。 */
export const TEMPO_WORDS: { from: number; it: string; zh: string; typical: number }[] = [
  { from: 0, it: "Largo", zh: "广板", typical: 50 },
  { from: 60, it: "Larghetto", zh: "小广板", typical: 63 },
  { from: 66, it: "Adagio", zh: "柔板", typical: 70 },
  { from: 76, it: "Andante", zh: "行板", typical: 88 },
  { from: 100, it: "Moderato", zh: "中板", typical: 108 },
  { from: 112, it: "Allegretto", zh: "小快板", typical: 116 },
  { from: 120, it: "Allegro", zh: "快板", typical: 132 },
  { from: 156, it: "Vivace", zh: "活板", typical: 160 },
  { from: 176, it: "Presto", zh: "急板", typical: 184 },
  { from: 200, it: "Prestissimo", zh: "最急板", typical: 208 },
];
/** 速度能写多少（♩ = 每分钟几个四分音符）：打字和速度框的滚轮同一个范围（user 2026-10-07「typing到400的话wheel也到400或者都300…反正对齐一点」）。
 *  上限 400：2/2 的快歌「二分音符 = 160」在这里是 ♩ = 320，bebop / 速核也过 300；唱歌本身用不到这么快，但没有技术理由卡。 */
export const TEMPO_MIN = 20, TEMPO_MAX = 400;
export function tempoWord(bpm: number): { it: string; zh: string } {
  let w = TEMPO_WORDS[0];
  for (const x of TEMPO_WORDS) if (bpm >= x.from) w = x;
  return w;
}
/** 一拍多少 tick（符杠按拍分组用）：x/2 x/4 x/8 = 那个音符；6/8 9/8 12/8 这类复拍子 = 附点四分。 */
export function beatTicks(beats: number, beatType: number): number {
  return beatType === 8 && beats > 3 && beats % 3 === 0 ? (WHOLE * 3) / 8 : WHOLE / beatType;
}
/** 写的时候「1=」= 手动设过的，否则跟光标处的调号。 */
export const inputKey = (st: EditorState): number => st.input.inputFifths;
/** 下一个要写的音的时长 = 当前档 ×（连音比例）。 */
export function unitDur(input: InputState): number {
  const plain = LADDER[input.unit];
  if (!input.tuplet) return plain;
  const [m, n] = TUPLET[input.tuplet];
  return (plain * m) / n;
}
const indexOfId = (tokens: Token[], id: number) => tokens.findIndex((t) => t.id === id);

// ── 小工具 ──────────────────────────────────────────────────────────────

function next(st: EditorState, tokens: Token[], patch: Partial<EditorState> = {}): EditorState {
  const caret = Math.max(headLen(tokens), Math.min(tokens.length, patch.caret ?? st.caret));
  return { ...st, ...patch, song: withTrack(st.song, st.at.paper, st.at.part, tokens), caret };
}
/** 挪光标 / 选中 = 离开「本次输入」，记录清空。 */
const leave = (st: EditorState): EditorState => (st.log.length ? { ...st, log: [] } : st);
const validDur = (d: number) => Number.isInteger(d) && d >= MIN_DUR && d <= MAX_DUR;

/** 只响不写（即兴）的那个音：带上挂着的 ♯ / ♭，「只管下一个音」的那一次照样用掉（user「升降号为什么对preview没用，也没有ui上面的反应」）。 */
export function soundingPitch(st: EditorState, p: Pitch): { pitch: Pitch; st: EditorState } {
  if (!st.input.acc) return { pitch: p, st };
  return { pitch: applyAcc(p, st.input), st: { ...st, input: consumeAcc(st.input) } };
}
/** 用掉一次 Shift：一次性的用完就关，锁定的留着。 */
function consumeAcc(input: InputState): InputState { return input.accMode === "once" ? { ...input, acc: 0, accMode: "off" } : input; }
function applyAcc(p: Pitch, input: InputState): Pitch { return input.acc ? alterBy(p, input.acc) : p; }

/** 写的时候：光标后（跳过小节线、记号）第一个是空音高的音符，就填它而不是插（詞先）。 */
function fillTarget(st: EditorState): number {
  for (let i = st.caret; i < tr(st).length; i++) {
    const t = tr(st)[i];
    if (t.kind === "bar" || t.kind === "phrase" || t.kind === "dyn" || t.kind === "hairpin" || isMark(t)) continue;
    return t.kind === "note" && t.pitch === null ? i : -1;
  }
  return -1;
}

// ── 写（光标） ──────────────────────────────────────────────────────────

/** 写一个音（给定音高：pad / 指针）。有选中 = 替换模式（replaceWrite：按长短档吃掉选区里写字头后面的旧东西，写不出选区）。
 *  raw = 音高已经带好了 ♯ / ♭（叠音判据「观望」后补写的那一下：按下时就算过一次 Shift 了），不再套、不再用掉 Shift。 */
export function writePitch(st: EditorState, pitch0: Pitch, raw = false): EditorState {
  const f = fillTarget(st), at = st.sel ? (st.sel.head ?? st.sel.from) : f >= 0 ? f : st.caret;
  // 按谱上的调号简化拼写：pad 的「1=」是它自己的（user「把pad想成一个独立的medo式的输入设备」），音落进谱时调内的音用谱上调号的写法——
  //   pad 1=C 按 ♭ 写的 A♭ 在五个升号的调里 = G♯（user 2026-10-08「升降号的歧义导致的没有自动简化怎么办」）；调外音照 pad 写的
  const pitch = keySpell(raw ? pitch0 : applyAcc(pitch0, st.input), keyAt(tr(st), at)), input = raw ? st.input : consumeAcc(st.input);
  if (st.sel) { const n = replaceWrite({ ...st, input }, { kind: "note", pitch }, unitDur(st.input)); return n.song === st.song ? st : n; }   // 没写成（窗口满了）= 原样，Shift 也不用掉
  if (f >= 0) {
    const t = tr(st)[f] as NoteTok, tokens = tr(st).slice(); tokens[f] = { ...t, pitch };
    return next(st, tokens, { caret: f + 1, input, log: [...st.log, { k: "fill", id: t.id, unit: t.dur }] });
  }
  const dur = unitDur(st.input), id = st.nextId, tokens = tr(st).slice();
  tokens.splice(st.caret, 0, { kind: "note", id, pitch, dur, lyric: null });
  return next(st, tokens, { caret: st.caret + 1, nextId: id + 1, input, log: [...st.log, { k: "ins", id, unit: dur }] });
}

/** 写一个音：调里第几级 + 方向（键盘数字 / QWERTYU / Shift；pad 也能走这里）。参照 = 落点前最近一个有音高的音。 */
export function writeDegree(st: EditorState, degree: number, dir: Dir): EditorState {
  let at: number;
  if (st.sel) at = st.sel.head ?? st.sel.from;   // 替换模式：参照 = 写字头前面那个音
  else { const f = fillTarget(st); at = f >= 0 ? f : st.caret; }
  if (at < 0) return st;
  return writePitch(st, placeDegree(degree, inputKey(st), prevPitch(tr(st), at), dir));
}

export function writeRest(st: EditorState): EditorState {
  if (st.sel) return replaceWrite(st, { kind: "rest" }, unitDur(st.input));   // 有选中 = 替换模式写一个休止
  const dur = unitDur(st.input), id = st.nextId, tokens = tr(st).slice();
  tokens.splice(st.caret, 0, { kind: "rest", id, dur });
  return next(st, tokens, { caret: st.caret + 1, nextId: id + 1, log: [...st.log, { k: "ins", id, unit: dur }] });
}

export function writeBar(st: EditorState): EditorState {
  const at = st.sel ? st.sel.to : st.caret, id = st.nextId, tokens = tr(st).slice();
  tokens.splice(at, 0, { kind: "bar", id });
  return next(st, tokens, { caret: at + 1, sel: null, nextId: id + 1, log: [] });
}
/** 句（pad 符号层 / Shift+Enter）：插在光标处（有选中 = 选中后面）；前面已经是句 = 原样。断句常在小节中间，所以不绑小节线（user 2026-10-08「断句可能在非小节线处，建议不要用小节线」）。 */
export function writePhrase(st: EditorState): EditorState {
  const at = st.sel ? st.sel.to : st.caret, tokens = tr(st).slice();
  if (tokens[at - 1]?.kind === "phrase" || at <= headLen(tokens)) return st;
  const id = st.nextId;
  tokens.splice(at, 0, { kind: "phrase", id });
  return next(st, tokens, { caret: at + 1, sel: null, nextId: id + 1, log: [] });
}
/** 在下标 i 的 token 后面插一个句（歌词里打了句号）；后面已经是句 = 原样。光标 / 选中在它后面的往后挪一格。 */
export function insertPhraseAfter(st: EditorState, i: number): EditorState {
  const tokens = tr(st).slice();
  if (!tokens[i] || tokens[i + 1]?.kind === "phrase") return st;
  const id = st.nextId;
  tokens.splice(i + 1, 0, { kind: "phrase", id });
  const sel = st.sel ? { from: st.sel.from > i ? st.sel.from + 1 : st.sel.from, to: st.sel.to > i ? st.sel.to + 1 : st.sel.to } : null;
  return next({ ...st, nextId: id + 1 }, tokens, { caret: st.caret > i ? st.caret + 1 : st.caret, sel });
}
// ── 修：演奏法 / 力度 / 呼吸（2026-10-08 by Claude Opus 5.5）────────────────────────────
/** 一个音的演奏法（按 ARTS 的顺序）。 */
export const artOf = (t: NoteTok): Art[] => t.art ?? [];
/** 开 / 关一种演奏法（空了 = 去掉 art 字段，存档不多出空数组）。 */
export function withArt(t: NoteTok, a: Art, on: boolean): NoteTok {
  const set = new Set(artOf(t)); if (on) { if (ATTACKS.includes(a)) for (const x of ATTACKS) set.delete(x); set.add(a); } else set.delete(a);   // 音头那一组互斥
  const art = ARTS.filter((x) => set.has(x));
  if (art.length) return { ...t, art };
  const { art: _a, ...rest } = t; return rest;
}
/** 选区里的音的下标。 */
const selNoteIdx = (st: EditorState): number[] => { if (!st.sel) return []; const out: number[] = []; for (let i = st.sel.from; i < st.sel.to; i++) if (tr(st)[i]?.kind === "note") out.push(i); return out; };
/** 选区里每种演奏法：都有 / 有的有 / 都没有（选区条的开关亮不亮）。 */
export function artStateSel(st: EditorState): Record<Art, "all" | "some" | "none"> {
  const idx = selNoteIdx(st), toks = tr(st), out = {} as Record<Art, "all" | "some" | "none">;
  for (const a of ARTS) { const n = idx.filter((i) => artOf(toks[i] as NoteTok).includes(a)).length; out[a] = !idx.length || n === 0 ? "none" : n === idx.length ? "all" : "some"; }
  return out;
}
/** 选区里的音切一种演奏法：都有 = 都去掉，否则都加上（选区留着，接着改别的）。 */
export function toggleArtSel(st: EditorState, a: Art): EditorState {
  const idx = selNoteIdx(st); if (!idx.length) return st;
  const on = artStateSel(st)[a] !== "all", nt = tr(st).slice();
  for (const i of idx) nt[i] = withArt(nt[i] as NoteTok, a, on);
  return next(st, nt);
}
/** 演奏法（pad 符号层：跳音 / 重音 / 保持 / 呼吸）：有选区 = 选中的音整组切（同选区条「修」）；没选区 = 光标前最近的那个音切
 *  （中间只隔着句号 / 力度 / 小节线这类不占时值的也算）；前面是休止或没有音 = 原样（返回 null 让界面说一声）。 */
export function toggleArtBefore(st: EditorState, a: Art): EditorState | null {
  if (st.sel) { const nx = toggleArtSel(st, a); return nx === st ? null : nx; }
  const toks = tr(st);
  for (let i = st.caret - 1; i >= headLen(toks); i--) {
    const t = toks[i];
    if (t.kind === "rest") return null;
    if (t.kind !== "note") continue;
    const nt = toks.slice(); nt[i] = withArt(t, a, !artOf(t).includes(a));
    return next(st, nt);
  }
  return null;
}
export const toggleBreath = (st: EditorState): EditorState | null => toggleArtBefore(st, "breath");
/** 连线（选区）：选中的音连起来——前 n−1 个标「连到下一个」；只选了一个 = 它连到下一个音。都连着 = 都去掉。没选音 = 原样。 */
export function toggleSlurSel(st: EditorState): EditorState {
  const idx = selNoteIdx(st); if (!idx.length) return st;
  const on = idx.length === 1 ? idx : idx.slice(0, -1), toks = tr(st), nt = toks.slice();
  const all = on.every((i) => (toks[i] as NoteTok).slur);
  for (const i of on) nt[i] = withSlur(nt[i] as NoteTok, !all);
  return next(st, nt);
}
/** 连线（pad 符号层）：有选区 = 选区那样；没有 = 光标前最近的那个音连到下一个音（再点 = 去掉）；前面是休止 / 没有音 = null。 */
export function toggleSlurBefore(st: EditorState): EditorState | null {
  if (st.sel) { const nx = toggleSlurSel(st); return nx === st ? null : nx; }
  const toks = tr(st);
  for (let i = st.caret - 1; i >= headLen(toks); i--) {
    const t = toks[i];
    if (t.kind === "rest") return null;
    if (t.kind !== "note") continue;
    const nt = toks.slice(); nt[i] = withSlur(t, !t.slur); return next(st, nt);
  }
  return null;
}
/** 选区里的连线状态（「修」那一排的开关）：都连着 / 有些 / 没有。目标 = 同 toggleSlurSel（前 n−1 个；只选一个 = 它自己）。 */
export function slurStateSel(st: EditorState): "all" | "some" | "none" {
  const idx = selNoteIdx(st); if (!idx.length) return "none";
  const on = idx.length === 1 ? idx : idx.slice(0, -1), n = on.filter((i) => (tr(st)[i] as NoteTok).slur).length;
  return n === 0 ? "none" : n === on.length ? "all" : "some";
}
/** 音内的力度起伏（pad 符号层）：有选区 = 选中的音都切成这个（都是 = 去掉）；没有 = 光标前最近的那个音切（再点 = 去掉，换一种 = 换）；前面是休止 / 没音 = null。 */
export function toggleSwell(st: EditorState, w: Swell): EditorState | null {
  const set = (t: NoteTok, on: boolean): NoteTok => { if (on) return { ...t, swell: w }; const { swell: _s, ...rest } = t; return rest; };
  if (st.sel) {
    const idx = selNoteIdx(st); if (!idx.length) return null;
    const toks = tr(st), all = idx.every((i) => (toks[i] as NoteTok).swell === w), nt = toks.slice();
    for (const i of idx) nt[i] = set(nt[i] as NoteTok, !all);
    return next(st, nt);
  }
  const toks = tr(st);
  for (let i = st.caret - 1; i >= headLen(toks); i--) {
    const t = toks[i];
    if (t.kind === "rest") return null;
    if (t.kind !== "note") continue;
    const nt = toks.slice(); nt[i] = set(t, t.swell !== w); return next(st, nt);
  }
  return null;
}
export function withSlur(t: NoteTok, on: boolean): NoteTok { if (on) return { ...t, slur: true }; const { slur: _s, ...rest } = t; return rest; }
/** 第 i 个 token 那儿生效的力度（往前找最近的力度记号；没有 = mf）。 */
/** 第 i 个 token 那儿生效的力度记号（往前找最近的）；前面一个力度记号都没有 = null（= 用演奏者的默认力度，不当 mf 算）。 */
export function dynMarkAt(tokens: Token[], i: number): Dyn | null {
  for (let j = Math.min(i, tokens.length) - 1; j >= 0; j--) { const t = tokens[j]; if (t.kind === "dyn") return t.value; }
  return null;
}
export function dynAt(tokens: Token[], i: number): Dyn {
  for (let j = Math.min(i, tokens.length) - 1; j >= 0; j--) { const t = tokens[j]; if (t.kind === "dyn") return t.value; }
  return DEFAULT_DYN;
}
/** 选区开头（没选区 = 光标处）那一串不占时值的 token 里的力度记号的下标；没有 = -1。 */
function dynRunAt(tokens: Token[], at: number): { a: number; b: number; k: number } {
  let a = at, b = at;
  const zero = (t: Token | undefined) => !!t && (t.kind === "dyn" || t.kind === "hairpin" || t.kind === "phrase" || isMark(t));
  while (a > headLen(tokens) && zero(tokens[a - 1])) a--;
  while (b < tokens.length && zero(tokens[b])) b++;
  let k = -1; for (let i = a; i < b; i++) if (tokens[i].kind === "dyn") k = i;
  return { a, b, k };
}
/** 选区开头（没选区 = 光标处）放力度：那儿已经有力度记号 = 改它；value null = 去掉。选区跟着挪，还盖着同样那几个音。 */
export function setDynSel(st: EditorState, value: Dyn | null): EditorState {
  const toks = tr(st), at = Math.max(headLen(toks), st.sel ? st.sel.from : st.caret), { k } = dynRunAt(toks, at), nt = toks.slice();
  const shift = (d: number, pos: number) => ({ sel: st.sel ? { from: st.sel.from + (st.sel.from >= pos ? d : 0), to: st.sel.to + (st.sel.to > pos || (st.sel.to === pos && d > 0) ? d : 0) } : null, caret: st.caret + (st.caret >= pos ? d : 0) });
  if (k >= 0) {
    if (value === null) { nt.splice(k, 1); return next(st, nt, shift(-1, k)); }
    nt[k] = { ...(nt[k] as DynTok), value }; return next(st, nt);
  }
  if (value === null) return st;
  const id = st.nextId; nt.splice(at, 0, { kind: "dyn", id, value });
  return next({ ...st, nextId: id + 1 }, nt, shift(1, at));
}
/** 渐强 / 渐弱记号：选区开头（没选区 = 光标处）放一个；那儿（紧挨着的不占时值的记号里）已经有同方向的 = 去掉，反方向的 = 换。光标挪到它后面（接着写的音在过渡里）。 */
export function toggleHairpin(st: EditorState, dir: "cresc" | "dim"): EditorState {
  const toks = tr(st), at = Math.max(headLen(toks), st.sel ? st.sel.from : st.caret);
  const zero = (t: Token | undefined) => !!t && (t.kind === "dyn" || t.kind === "hairpin" || t.kind === "phrase" || isMark(t));
  let k = -1;
  for (let i = at - 1; i >= headLen(toks) && zero(toks[i]); i--) if (toks[i].kind === "hairpin") { k = i; break; }
  if (k < 0) for (let i = at; i < toks.length && zero(toks[i]); i++) if (toks[i].kind === "hairpin") { k = i; break; }
  const nt = toks.slice(), shift = (d: number, pos: number) => ({ sel: st.sel ? { from: st.sel.from + (st.sel.from >= pos ? d : 0), to: st.sel.to + (st.sel.to > pos || (st.sel.to === pos && d > 0) ? d : 0) } : null, caret: st.caret + (st.caret >= pos ? d : 0) });
  if (k >= 0) {
    const h = toks[k] as HairpinTok;
    if (h.dir === dir) { nt.splice(k, 1); return next(st, nt, shift(-1, k)); }
    nt[k] = { ...h, dir }; return next(st, nt);
  }
  const id = st.nextId; nt.splice(at, 0, { kind: "hairpin", id, dir });
  return next({ ...st, nextId: id + 1 }, nt, shift(1, at));
}
/** 选区开头（没选区 = 光标处）现在写着的力度记号（没有 = null；选区条上亮哪一个）。 */
export function dynMarkSel(st: EditorState): Dyn | null {
  const toks = tr(st), { k } = dynRunAt(toks, Math.max(headLen(toks), st.sel ? st.sel.from : st.caret));
  return k >= 0 ? (toks[k] as DynTok).value : null;
}

/** 纸隐藏 / 显示（隐藏 = 不放；谱上还在、折叠着）。 */
export function setPaperHidden(st: EditorState, paperId: string, hidden: boolean): EditorState {
  const papers = st.song.papers.map((p) => (p.id !== paperId ? p : hidden ? { ...p, hidden: true } : (({ hidden: _h, ...rest }) => rest)(p)));
  return { ...st, song: { ...st.song, papers } };
}

/** 在光标处（有选中 = 选中开头）插一个记号。插的地方前后连着的记号里已有同类 → 改它，不再插一个（谱头就是这样被改的）。
 *  返回记号的下标，fresh = 新插的（界面打开它的编辑框；没改值就关 = 撤掉）。 */
export function writeMark(st: EditorState, v: MarkVal): { st: EditorState; index: number; fresh: boolean } {
  const at = st.sel ? st.sel.from : st.caret, tokens = tr(st);
  let a = at, b = at;
  while (a > 0 && isMark(tokens[a - 1])) a--;
  while (b < tokens.length && isMark(tokens[b])) b++;
  for (let i = a; i < b; i++) if (tokens[i].kind === v.kind) return { st: setMark({ ...leave(st), sel: null }, i, v), index: i, fresh: false };
  const id = st.nextId, nt = tokens.slice();
  nt.splice(at, 0, { ...v, id } as MarkTok);
  if (v.kind === "key") respellFrom(nt, at);   // 插调号：它管的音跟着按调号拼写
  return { st: next(st, nt, { caret: at + 1, sel: null, nextId: id + 1, log: [] }), index: at, fresh: true };
}
/** 调号 i 管的那一段音（到下一个调号为止）按它简化拼写（音高不动；调外音、𝄪 / 𝄫 照写）。原地改 nt。
 *  user 2026-10-08「刚才那个是我移调之后没有自动匹配…因为我移了好几个调找听的对的」：半音移调不动调号（音按旧调拼成一片 ♭），
 *  再把调号改成听着对的那个调——音还是旧拼法、满篇临时记号。现在改 / 插调号时它管的音顺手换成调号里的写法。 */
function respellFrom(nt: Token[], i: number): void {
  const k = nt[i]; if (k?.kind !== "key") return;
  for (let j = i + 1; j < nt.length && nt[j].kind !== "key"; j++) {
    const t = nt[j]; if (t.kind !== "note" || !t.pitch) continue;
    const ps = allPitches(t), qs = ps.map((q) => keySpell(q, k.fifths));
    if (qs.some((q, n) => q !== ps[n])) nt[j] = withPitches(t, qs);
  }
}
/** 换调号（插一个调号记号）。 */
export const writeKey = (st: EditorState, fifths: number): EditorState => writeMark(st, { kind: "key", fifths }).st;
/** 改一个记号的值（种类不变）。输入的「1=」不跟着变（输入设备自己的调）。 */
export function setMark(st: EditorState, i: number, v: MarkVal): EditorState {
  const t = tr(st)[i];
  if (!t || t.kind !== v.kind) return st;
  const nt = tr(st).slice(); nt[i] = { ...v, id: t.id } as MarkTok;
  if (v.kind === "key") respellFrom(nt, i);   // 改调号：它管的音跟着按调号拼写（同一步，能撤销）
  return next(st, nt, {});
}
/** 删一个中途的记号（谱头的删不掉）。 */
export function deleteMark(st: EditorState, i: number): EditorState {
  const t = tr(st)[i];
  if (!t || !isMark(t) || i < headLen(tr(st))) return st;
  const nt = tr(st).slice(); nt.splice(i, 1);
  return next(st, nt, { caret: i < st.caret ? st.caret - 1 : st.caret, sel: null });
}

/** 「−」：写的时候 = 刚写的那个音加一份它写入时的单位（下一个音不受影响）；中间隔着小节线 = 新开一个 tie 着的同音。
 *  half = pad 的「/2」开着：加**半份**（八分 + 半份 = 附点八分；接着再写一个减半的音 = 附点八分 + 十六分，凑满两份原来的）。
 *  有选中 = 每个选中的音加一份当前单位（「/2」已经把当前单位挪短了一档，不再折半）。 */
export function extend(st: EditorState, half = false): EditorState {
  if (st.sel) {   // 替换模式：刚写的那个往后吃一份（写不出选区、不越过「|」）；还没写过 = 不动（键盘只管打谱，整组改时值在选区菜单里）
    const sel = st.sel; if (sel.head == null) return st;
    const tk = tr(st), j = lastTimedBefore(tk, sel.head, sel.from); if (j < 0) return st;
    let i = sel.head; while (i < sel.to && !isTimed(tk[i]) && tk[i].kind !== "bar") i++;
    if (i >= sel.to || tk[i].kind === "bar") return st;
    const e = eat(tk, i, sel.to, unitDur(st.input)), t = tk[j] as Timed;
    if (!e.got || !validDur(t.dur + e.got)) return st;
    const nt = [...tk.slice(0, j), { ...t, dur: t.dur + e.got } as Token, ...tk.slice(j + 1, i), ...e.keep, ...tk.slice(e.end)];
    return next(st, nt, { sel: { ...sel, to: sel.to + (nt.length - tk.length), head: i }, caret: i });
  }
  const tokens = tr(st);
  // 目标 = 本次输入记录里最后一个音（还在的话），否则光标前最近的音 / 休止
  let target = -1, unit = unitDur(st.input), fromLog = false;
  for (let k = st.log.length - 1; k >= 0 && target < 0; k--) {
    const e = st.log[k], i = indexOfId(tokens, e.id);
    if (i < 0) continue;
    target = i;
    // 单位 = 这个音写入时的那一笔（ins / fill / tie）记下的；最后一笔是「−」就往回找它
    for (let q = k; q >= 0; q--) { const f = st.log[q]; if (f.id === e.id && f.k !== "ext") { unit = f.unit; fromLog = true; break; } }
  }
  if (target < 0) target = currentIndex(st);
  if (target < 0) return st;
  const t = tokens[target] as Timed;
  const by = half && fromLog ? unit / 2 : unit;   // 没有记录可查时 unit 已是当前单位（「/2」挪短过），不再折半
  // 目标和光标之间有小节线 → 新开 tie 音（休止跨小节就再写一个休止）
  const barBetween = tokens.slice(target + 1, st.caret).some((x) => x.kind === "bar");
  if (barBetween) {
    const id = st.nextId, nt = tokens.slice();
    const tok: Token = t.kind === "note" ? { kind: "note", id, pitch: t.pitch, dur: by, lyric: null, tie: true } : { kind: "rest", id, dur: by };
    nt.splice(st.caret, 0, tok);
    return next(st, nt, { caret: st.caret + 1, nextId: id + 1, log: [...st.log, { k: "tie", id, unit }] });
  }
  const d = t.dur + by;
  if (!validDur(d)) return st;
  const nt = tokens.slice(); nt[target] = { ...t, dur: d };
  return next(st, nt, { log: [...st.log, { k: "ext", id: t.id, by }] });
}

/** 退格：有选中 = 删选中；写的时候 = 撤回本次输入记录的最后一笔，记录空了就删光标前一个 token。 */
export function backspace(st: EditorState): EditorState {
  if (st.sel && st.sel.head != null) {   // 替换模式：刚写的那个变回休止（位置不动、后面不挪）；写字头退回去。要原来的东西 = 撤销
    const tk = tr(st), j = lastTimedBefore(tk, st.sel.head, st.sel.from);
    if (j < 0) return st;
    const t = tk[j], nt = tk.slice();
    if (t.kind === "note") nt[j] = { kind: "rest", id: t.id, dur: t.dur } as Token;
    return next(st, nt, { sel: { ...st.sel, head: j }, caret: j });
  }
  if (st.sel) return deleteSel(st);
  const tokens = tr(st);
  while (st.log.length) {
    const e = st.log[st.log.length - 1], log = st.log.slice(0, -1), i = indexOfId(tokens, e.id);
    if (i < 0) { st = { ...st, log }; continue; }   // 记录里的东西已经不在了（别处删过）：跳过这笔
    const nt = tokens.slice();
    if (e.k === "ext") { const t = nt[i] as Timed; nt[i] = { ...t, dur: t.dur - e.by }; return next(st, nt, { log }); }
    if (e.k === "fill") { const t = nt[i] as NoteTok; nt[i] = { ...t, pitch: null }; return next(st, nt, { log, caret: i }); }
    nt.splice(i, 1);                                // ins / tie：删掉那个 token
    return next(st, nt, { log, caret: i < st.caret ? st.caret - 1 : st.caret });
  }
  if (st.caret <= headLen(tokens)) return st;   // 谱头删不掉
  // 写音模式的退格只删音 / 休止 / 手动小节线；中间隔着的不占时值的记号留着（挂到下一个音上）。删完湮灭不再管任何音的力度记号
  let i = st.caret - 1; while (i >= headLen(tokens) && !stopTok(tokens[i])) i--;
  if (i < headLen(tokens)) return st;
  const nt = tokens.slice(); nt.splice(i, 1);
  return afterDelete(st, nt, { caret: st.caret - 1 });
}
export function deleteForward(st: EditorState): EditorState {
  if (st.sel) return deleteSel(st);
  if (st.caret >= tr(st).length) return st;
  const toks = tr(st); let i = st.caret; while (i < toks.length && !stopTok(toks[i])) i++;   // 同退格：只删音 / 休止 / 小节线
  if (i >= toks.length) return st;
  const nt = toks.slice(); nt.splice(i, 1);
  return afterDelete(leave(st), nt, { caret: st.caret });
}

// ── 输入状态（写的时候改的是下一个音） ────────────────────────────────

/** 长短基线直接设成第几档（pad 的长短旋钮点开选）。 */
export function setUnit(st: EditorState, unit: number): EditorState { return { ...st, input: { ...st.input, unit: Math.max(0, Math.min(LADDER.length - 1, unit)) } }; }
/** 长短 = 输入档位（接下来写的长短；到头不动）。有选区也一样——选区里写 = 替换模式按这一档吃（键盘只管打谱；
 *  整组改时值 = 选区菜单 scaleSelDur / setSelDur；2026-10-08 user「移调转调和长度以及其他的操作不要用keyboard，而是一个小的上下文菜单」）。 */
export function shorter(st: EditorState): EditorState {
  return st.input.unit > 0 ? { ...st, input: { ...st.input, unit: st.input.unit - 1 } } : st;
}
export function longer(st: EditorState): EditorState {
  return st.input.unit < LADDER.length - 1 ? { ...st, input: { ...st.input, unit: st.input.unit + 1 } } : st;
}
/** 选区菜单「÷2 / ×2」：选中的音 / 休止都乘这个数（超出全音符 / 三十二分的那个不动）。 */
export function scaleSelDur(st: EditorState, f: 0.5 | 2): EditorState { return mapSelDur(st, (d) => d * f); }
/** 连音：设成 0 / 3 / 5 / 6 / 7（锁定式；候选由界面弹）。 */
export function setTuplet(st: EditorState, n: InputState["tuplet"]): EditorState { return { ...st, input: { ...st.input, tuplet: n } }; }
/** ♯ / ♭ Shift：关 → 一次；一次且 350 ms 内再点 → 锁；其余 → 关。有选中 = 选中的音直接升降半音。 */
export function tapAcc(st: EditorState, acc: Exclude<Acc, 0>, now: number): EditorState {
  if (st.sel) return mapSelPitch(st, (p) => alterBy(p, acc));
  const i = st.input;
  if (i.acc !== acc || i.accMode === "off") return { ...st, input: { ...i, acc, accMode: "once", accAt: now } };
  if (i.accMode === "once" && now - i.accAt < 350) return { ...st, input: { ...i, accMode: "lock", accAt: now } };
  return { ...st, input: { ...i, acc: 0, accMode: "off", accAt: now } };
}
/** 直接设升降 Shift 的状态（pad 升降键按住 / 滑着换的时候用；accAt 不动，连点判定照旧）。 */
export function setAccState(st: EditorState, acc: Acc, mode: InputState["accMode"]): EditorState {
  const i = st.input;
  return i.acc === acc && i.accMode === mode ? st : { ...st, input: { ...i, acc: mode === "off" ? 0 : acc, accMode: mode === "off" || acc === 0 ? "off" : mode } };
}
/** 「1=」：只管输入（user「after you change the 1=???, the original inputted note should not be changed」）。 */
export function setInputKey(st: EditorState, fifths: number): EditorState { return { ...st, input: { ...st.input, inputFifths: Math.max(-7, Math.min(7, fifths)) } }; }
/** pad 的调式：只管 pad 上排哪些音。 */
export function setInputScale(st: EditorState, id: string): EditorState { return { ...st, input: { ...st.input, inputScale: id } }; }

// ── 改（选中） ──────────────────────────────────────────────────────────

function firstNoteIn(st: EditorState): number {
  if (!st.sel) return -1;
  for (let i = st.sel.from; i < st.sel.to; i++) if (tr(st)[i].kind === "note") return i;
  return -1;
}
/** 写字头前面最近的那个有时值的 token（不早于 from）；没有 = -1。 */
function lastTimedBefore(tk: Token[], head: number, from: number): number {
  for (let j = head - 1; j >= from; j--) if (isTimed(tk[j])) return j;
  return -1;
}
/** 从 i 起吃掉 need 那么长的旧东西（替换模式用）：不越过窗口尾 b，也不越过人插的小节线（「|」挡住）。
 *  吃一半的音 / 休止留下剩的那截（剩的那截不带歌词 / 连音线 / 演奏法）；太短（< 最短时值）的那截一起吃掉，算进 got。中间的力度 / 句号 / 记号原样留着（keep）。
 *  返回：实际吃了多少（got）、第一个被吃的（继承歌词）、吃到哪（end，不含）、要放回去的（keep）。 */
function eat(tk: Token[], i: number, b: number, need: number): { got: number; first: Timed | null; end: number; keep: Token[] } {
  let got = 0, first: Timed | null = null, j = i;
  const keep: Token[] = [];
  while (j < b && got < need) {
    const t = tk[j];
    if (t.kind === "bar") break;
    if (!isTimed(t)) { keep.push(t); j++; continue; }
    first ??= t;
    const rest = t.dur - (need - got);
    if (rest >= MIN_DUR) {
      const { lyric: _l, hyph: _h, tie: _t, art: _a, ...base } = t as NoteTok; void _l; void _h; void _t; void _a;
      keep.push((t.kind === "note" ? { ...base, dur: rest, lyric: null } : { ...t, dur: rest }) as Token);
      got = need;
    } else got += t.dur;
    j++;
  }
  return { got, first, end: j, keep };
}
/** 替换模式（有选区时打音 / 休止；2026-10-08 by Claude Opus 5.5；user「加一个时长替换模式，类似override，就像钢琴窗里面你一步一步改monophony线，
 *  吃掉后面的旋律线。不过还是可以输入polyohonic。然后也许编辑的时候保留选区」「然后不能写出选区边界」「有选区 = 替换、无选区 = 插入」）：
 *  选区 = 窗口；在写字头（sel.head，第一次 = 选区开头）写一个 dur 长的音，吃掉窗口里写字头后面 dur 那么长的旧东西——后面的东西不挪，永远对齐。
 *  · 写不出选区：最后一个截短到正好填满；窗口满了 = 原样（调用方提示）。人插的小节线也挡住（写到「|」前为止，下一个从「|」后面接着写）。
 *  · 新音正好落在旧音的起点上 = 接过那个旧音的歌词（只改音高时歌词不丢）。
 *  · 选区（窗口）一直留着，写字头挪到新音后面；退格 = 刚写的变回休止（backspace），「−」= 往后吃（extend）。 */
export function replaceWrite(st: EditorState, what: { kind: "note"; pitch: Pitch } | { kind: "rest" }, dur: number): EditorState {
  const sel = st.sel; if (!sel) return st;
  const tk = tr(st);
  let i = sel.head ?? sel.from;
  while (i < sel.to && !isTimed(tk[i])) i++;   // 写字头后面的小节线 / 记号留在前面
  if (i >= sel.to) return st;
  const e = eat(tk, i, sel.to, dur);
  if (!validDur(e.got)) return st;
  const id = st.nextId, inherit = e.first?.kind === "note" ? (e.first as NoteTok) : null;
  const tok: Token = what.kind === "note"
    ? ({ kind: "note", id, pitch: what.pitch, dur: e.got, lyric: inherit?.lyric ?? null, ...(inherit?.hyph ? { hyph: true } : {}) } as Token)
    : ({ kind: "rest", id, dur: e.got } as Token);
  const after = tk.slice(e.end), nx = after[0];
  if (nx?.kind === "note" && (nx as NoteTok).tie) { const { tie: _t, ...rest } = nx as NoteTok; void _t; after[0] = rest as Token; }   // 后面那个音原来连着被吃掉的：连音线断开
  const nt = [...tk.slice(0, i), tok, ...e.keep, ...after];
  const to = sel.to + (nt.length - tk.length);
  return next(st, nt, { sel: { from: sel.from, to, head: i + 1 }, caret: i + 1, nextId: id + 1 });
}
/** 选中的音 / 休止全部改成这一档（选区菜单「都改成 ♪」= pad 长短旋钮现在那一档；连音跟 pad 现在的连音设置）。 */
export function setSelDur(st: EditorState, unit: number): EditorState {
  const d = unitDur({ ...st.input, unit: Math.max(0, Math.min(LADDER.length - 1, unit)) });
  return mapSelDur(st, () => d);
}
/** 选中的音 / 休止现在是哪一档（都一样才有；长短不一 / 不是整档 / 没选 = null）：选区菜单显示用。 */
export function selUnit(st: EditorState): number | null {
  if (!st.sel) return null;
  let u: number | null = null;
  for (let i = st.sel.from; i < st.sel.to; i++) {
    const t = tr(st)[i]; if (!isTimed(t)) continue;
    const k = LADDER.indexOf(t.dur as (typeof LADDER)[number]); if (k < 0) return null;
    if (u === null) u = k; else if (u !== k) return null;
  }
  return u;
}
function mapSelDur(st: EditorState, f: (d: number) => number): EditorState {
  if (!st.sel) return st;
  const nt = tr(st).slice(); let changed = false;
  for (let i = st.sel.from; i < st.sel.to; i++) { const t = nt[i]; if (!isTimed(t)) continue; const d = f(t.dur); if (validDur(d)) { nt[i] = { ...t, dur: d }; changed = true; } }
  return changed ? next(st, nt) : st;
}
function mapSelPitch(st: EditorState, f: (p: Pitch) => Pitch): EditorState {
  if (!st.sel) return st;
  const nt = tr(st).slice();
  for (let i = st.sel.from; i < st.sel.to; i++) { const t = nt[i]; if (t.kind === "note") nt[i] = withPitches(t, (t.pitch ? allPitches(t) : [effectivePitch(nt, i)]).map(f)); }
  return next(st, nt);
}
function deleteSel(st: EditorState): EditorState {
  if (!st.sel) return st;
  const nt = tr(st).slice(); nt.splice(st.sel.from, st.sel.to - st.sel.from);
  return afterDelete(st, nt, { sel: null, caret: st.sel.from, log: [] });
}

/** 改音高（↑↓ 一级 / Shift 半音 / Alt 八度）：有选中 = 全部选中；写的时候 = 光标前那个音。 */
function mapTargetPitch(st: EditorState, f: (p: Pitch, fifths: number) => Pitch): EditorState {
  if (st.sel) { const from = st.sel.from; return mapSelPitch(st, (p) => f(p, keyAt(tr(st), from))); }
  const i = currentIndex(st);
  if (i < 0 || tr(st)[i].kind !== "note") return st;
  const nt = tr(st).slice(), t = nt[i] as NoteTok; nt[i] = withPitches(t, (t.pitch ? allPitches(t) : [effectivePitch(nt, i)]).map((p) => f(p, keyAt(tr(st), i))));
  return next(st, nt);
}
export const stepTarget = (st: EditorState, steps: number) => mapTargetPitch(st, (p, k) => stepBy(p, steps, k));
export const alterTarget = (st: EditorState, d: number) => mapTargetPitch(st, (p, k) => transposeSemis(p, d, k));   // 按调拼写（E 升半音 = F）
export const octaveTarget = (st: EditorState, d: number) => mapTargetPitch(st, (p) => octaveBy(p, d));

// ── 移调 / 转调（选中的一段） ──────────────────────────────────────────
// user「然后很快我需要框选和整体移调转调」「框选 + 整体移调 / 转调 也先做」。

/** 移调：选中的音整体移几个半音，按各自所在的调重新拼写；调号不动。 */
export function transposeSel(st: EditorState, semis: number): EditorState {
  if (!st.sel || !semis) return st;
  const nt = tr(st).slice();
  for (let i = st.sel.from; i < st.sel.to; i++) { const t = nt[i]; if (t.kind === "note" && t.pitch) nt[i] = withPitches(t, allPitches(t).map((p) => transposeSemis(p, semis, keyAt(tr(st), i)))); }
  return next(st, nt);
}
/** 按调号拼写（选中的一段）：调内的音换成调号里的写法，调外的不动；音高不变（已经写下的谱用它收拾，比如五个升号的调里全写成降号的）。 */
export function respellSel(st: EditorState): EditorState {
  if (!st.sel) return st;
  const nt = tr(st).slice(); let changed = false;
  for (let i = st.sel.from; i < st.sel.to; i++) {
    const t = nt[i]; if (t.kind !== "note" || !t.pitch) continue;
    const k = keyAt(tr(st), i), ps = allPitches(t), qs = ps.map((p) => keySpell(p, k));
    if (qs.some((q, j) => q !== ps[j])) { nt[i] = withPitches(t, qs); changed = true; }
  }
  return changed ? next(st, nt) : st;
}
/** 转调：选中的一段从开头生效的调转到 toFifths——音按两个主音之间的音程挪（就近方向，拼写关系不变），
 *  选中开头的调号改成新调（旁边已有调号 = 改它；从歌开头选 = 改谱头），选中后面插回原来的调（后面本来就有调号的不插）；
 *  选中里面的调号跟着一起挪。选中保持在挪过的那一段上。 */
export function modulateSel(st: EditorState, toFifths: number): EditorState {
  if (!st.sel) return st;
  const { from, to } = st.sel, old = tr(st), f0 = keyAt(old, from), df = toFifths - f0;
  if (!df) return st;
  const { steps, semis } = keyInterval(f0, toFifths);
  const wrap = (f: number) => (f > 7 ? f - 12 : f < -7 ? f + 12 : f);   // 超出 ±7 用等音调
  const nt = old.slice();
  for (let i = from; i < to; i++) {
    const t = nt[i];
    if (t.kind === "note" && t.pitch) nt[i] = withPitches(t, allPitches(t).map((p) => transposeInterval(p, steps, semis)));
    else if (t.kind === "key") nt[i] = { ...t, fifths: wrap(t.fifths + df) };
  }
  let nextId = st.nextId;
  // 后面：插回原来的调（后面连着的记号里已有调号 = 它自己说了算）
  if (to < nt.length) {
    let hasKey = false; for (let i = to; i < nt.length && isMark(nt[i]); i++) if (nt[i].kind === "key") hasKey = true;
    let after = toFifths; for (let i = from; i < to; i++) { const t = nt[i]; if (t.kind === "key") after = t.fifths; }   // 选中末尾生效的新调
    const back = keyAt(old, to);
    if (!hasKey && back !== after) nt.splice(to, 0, { kind: "key", id: nextId++, fifths: back });
  }
  // 开头：旁边连着的记号里有调号 = 改它，否则插一个
  let a = from; while (a > 0 && isMark(nt[a - 1])) a--;
  let b = from; while (b < nt.length && isMark(nt[b])) b++;
  let shift = 0, keyIdx = -1;
  for (let i = a; i < b; i++) if (nt[i].kind === "key") keyIdx = i;
  if (keyIdx >= 0 && keyIdx < from) nt[keyIdx] = { ...(nt[keyIdx] as KeyTok), fifths: toFifths };
  else if (keyIdx < 0) { nt.splice(from, 0, { kind: "key", id: nextId++, fifths: toFifths }); shift = 1; }
  const sel = { from: from + shift, to: to + shift };
  // 收尾：按挪完之后各自所在的调简化拼写（选中里的调号会被换成等音调，按音程挪的拼法可能和它对不上）
  for (let i = sel.from; i < sel.to; i++) {
    const t = nt[i]; if (t.kind !== "note" || !t.pitch) continue;
    const k = keyAt(nt, i), ps = allPitches(t), qs = ps.map((q) => keySpell(q, k));
    if (qs.some((q, n) => q !== ps[n])) nt[i] = withPitches(t, qs);
  }
  return next({ ...st, nextId }, nt, { sel, caret: sel.to });
}

// ── 光标与选中 ──────────────────────────────────────────────────────────

/** 放光标（= 写）：清选中、清本次输入记录。 */
export const setCaret = (st: EditorState, caret: number): EditorState =>
  ({ ...leave(st), sel: null, caret: Math.max(headLen(tr(st)), Math.min(tr(st).length, caret)) });
/** 选中一段（= 改）。 */
export function select(st: EditorState, from: number, to: number): EditorState {
  const n = tr(st).length, a = Math.max(headLen(tr(st)), Math.min(from, to)), b = Math.min(n, Math.max(from, to));
  if (b <= a) return setCaret(st, a);
  return { ...leave(st), sel: { from: a, to: b }, caret: b };
}
/** ←→：有选中 = 收成左 / 右边的光标；没有 = 挪光标。 */
/** 光标的落脚点（2026-10-08，user「多个非音记号会影响步进吗」「写音和符号：嗯简化的心智模型好」「手动的「|」：属于写音层…同意」）：
 *  ← → 只停在音 / 休止 / 手动小节线后面（和谱头后面）；不占时值的记号（力度、渐强渐弱、调号 / 拍号 / 速度、句号）挂在后面那个音上，不单独占一步。
 *  落下来的位置在那些记号前面（在那儿写的新音 = 前一个状态里的，记号还跟着原来那个音）；刚插完记号，光标在记号后面（接着写的音在记号里，flow 照旧）。 */
const stopTok = (t: Token) => isTimed(t) || t.kind === "bar";
export function moveCaret(st: EditorState, d: number): EditorState {
  if (st.sel) return setCaret(st, d < 0 ? st.sel.from : st.sel.to);
  const toks = tr(st), h = headLen(toks);
  let c = st.caret;
  for (let n = 0; n < Math.abs(d); n++) {
    if (d < 0) {
      let i = c - 1; while (i >= h && !stopTok(toks[i])) i--;   // 光标前最近的音 / 小节线
      if (i < h) { c = h; break; }
      let j = i - 1; while (j >= h && !stopTok(toks[j])) j--;   // 再往前一个落脚点
      c = j < h ? h : j + 1;
    } else {
      let i = c; while (i < toks.length && !stopTok(toks[i])) i++;
      c = i < toks.length ? i + 1 : toks.length;
    }
  }
  return setCaret(st, c);
}
/** 删音之后：不再管任何音的力度记号 / 渐强渐弱「湮灭」（2026-10-08，user「大批量删音的时候会不会堆一堆强度符号…p f删第二个音，会变成，你觉得是p还是f?」）：
 *  两个力度记号之间一个音都没有 = 前面那个不管任何音，去掉，留后面那个（p A f B C 删掉 A、B → 留 f，C 本来就在 f 下面）；
 *  渐强渐弱和它的终点（下一个力度记号 / 下一个渐强渐弱 / 谱尾）之间一个音都没有 = 去掉。返回去掉了几个、各在哪（下标，按原来的串）。 */
export function annihilate(tokens: Token[]): { tokens: Token[]; removed: number[] } {
  const drop = new Set<number>();
  let lastDyn = -1, timedSince = true;
  tokens.forEach((t, i) => {
    if (isTimed(t)) { timedSince = true; return; }
    if (t.kind === "dyn") { if (lastDyn >= 0 && !timedSince) drop.add(lastDyn); lastDyn = i; timedSince = false; }
  });
  tokens.forEach((t, i) => {
    if (t.kind !== "hairpin") return;
    for (let j = i + 1; j < tokens.length; j++) { const u = tokens[j]; if (isTimed(u)) return; if (u.kind === "dyn" || u.kind === "hairpin") break; }
    drop.add(i);
  });
  if (!drop.size) return { tokens, removed: [] };
  return { tokens: tokens.filter((_, i) => !drop.has(i)), removed: [...drop].sort((x, y) => x - y) };
}
/** 删了东西之后统一收尾：湮灭 + 光标跟着往回挪（被去掉的在光标前面的那些）。 */
function afterDelete(st: EditorState, nt: Token[], over: Partial<EditorState>): EditorState {
  const a = annihilate(nt), caret = (over.caret ?? st.caret) - a.removed.filter((k) => k < (over.caret ?? st.caret)).length;
  return next(st, a.tokens, { ...over, caret });
}
/** 长按拖力度记号 / 渐强渐弱（2026-10-08 Opus 5.5；user 批「力度和渐强渐弱能长按拖动」）：下标 from 的记号挪到下标 before 那个音（或休止）前面 = 从那个音起。
 *  力度放在那儿已有的渐强渐弱前面（「mp <」的顺序），渐强渐弱放最后；挪完湮灭——落到已经有力度记号的音上 = 挪过去的那个算数、原来那个去掉。
 *  removed = 湮灭掉了几个（调用方说一声）。没挪动（同一个音 / 不是这两种记号）= 原样。选区收掉，光标跟着同一个音。 */
export function moveMark(st: EditorState, from: number, before: number): { st: EditorState; removed: number } {
  const toks = tr(st), m = toks[from];
  if (!m || (m.kind !== "dyn" && m.kind !== "hairpin") || !toks[before] || !isTimed(toks[before])) return { st, removed: 0 };
  const nt = toks.slice(); nt.splice(from, 1);
  let at = before - (before > from ? 1 : 0);   // 那个音现在的下标
  if (m.kind === "dyn") { let a = at; while (a > headLen(nt) && !isTimed(nt[a - 1]) && nt[a - 1].kind !== "bar") a--; for (let k = a; k < at; k++) if (nt[k].kind === "hairpin") { at = k; break; } }
  nt.splice(at, 0, m);
  if (nt.every((t, k) => t === toks[k])) return { st, removed: 0 };
  const c1 = st.caret - (st.caret > from ? 1 : 0), c2 = c1 + (c1 > at ? 1 : 0), a = annihilate(nt);
  return { st: next(st, a.tokens, { caret: c2 - a.removed.filter((k) => k < c2).length, sel: null }), removed: a.removed.length };
}
/** 点力度记号 / 渐强渐弱的小菜单：改成别的力度 / 换方向；null = 删掉（光标跟着）。 */
export function editMarkAt(st: EditorState, i: number, change: { value: Dyn } | { dir: "cresc" | "dim" } | null): EditorState {
  const toks = tr(st), m = toks[i];
  if (!m || (m.kind !== "dyn" && m.kind !== "hairpin")) return st;
  const nt = toks.slice();
  if (change === null) { nt.splice(i, 1); return next(st, nt, { caret: st.caret - (i < st.caret ? 1 : 0), sel: null }); }
  if (m.kind === "dyn" && "value" in change) { if (m.value === change.value) return st; nt[i] = { ...m, value: change.value }; return next(st, nt); }
  if (m.kind === "hairpin" && "dir" in change) { if (m.dir === change.dir) return st; nt[i] = { ...m, dir: change.dir }; return next(st, nt); }
  return st;
}
/** 符号模式的退格（2026-10-08，user「退格只删符号或者没符号的时候退一步，不删音符」）：
 *  ① 光标前面紧挨着的不占时值的记号（力度 / 渐强渐弱 / 句号 / 中途的调号拍号速度）→ 删最后一个；
 *  ② 没有 = 光标前那个音身上的装饰，一次一个、从最外层开始：音内起伏 → 音头（强音 / 重音 / 突强 / 强后即弱）→ 保持 → 跳音 → 呼吸 → 连线；
 *  ③ 都没有 = 光标往回一步。永远不删音。 */
export function symBackspace(st: EditorState): EditorState {
  if (st.sel) return st;
  const toks = tr(st), h = headLen(toks), i = st.caret - 1;
  if (i >= h && !stopTok(toks[i])) { const nt = toks.slice(); nt.splice(i, 1); return next(st, nt, { caret: st.caret - 1 }); }
  const t = toks[i];
  if (i >= h && t?.kind === "note") {
    const nt = toks.slice(), art = artOf(t);
    const strip = (k: "swell" | "slur") => { const { [k]: _x, ...rest } = t; return rest as NoteTok; };
    if (t.swell) { nt[i] = strip("swell"); return next(st, nt); }
    for (const a of ["marcato", "accent", "sfz", "fp", "tenuto", "staccato", "breath"] as Art[]) if (art.includes(a)) { nt[i] = withArt(t, a, false); return next(st, nt); }
    if (t.slur) { nt[i] = strip("slur"); return next(st, nt); }
  }
  return moveCaret(st, -1);
}
/** Shift+←→：从光标（或已有选中）往一边扩一个 token。 */
export function extendSelection(st: EditorState, d: number): EditorState {
  if (!st.sel) return d < 0 ? select(st, st.caret - 1, st.caret) : select(st, st.caret, st.caret + 1);
  return d < 0 ? select(st, st.sel.from - 1, st.sel.to) : select(st, st.sel.from, st.sel.to + 1);
}
/** Shift+Home / Shift+End：从光标（或已有选中的另一头）选到开头 / 末尾（配 Home 就是全选）。 */
export function selectToEdge(st: EditorState, d: -1 | 1): EditorState {
  const n = tr(st).length;
  if (d < 0) return select(st, headLen(tr(st)), st.sel ? st.sel.to : st.caret);
  return select(st, st.sel ? st.sel.from : st.caret, n);
}
/** Esc：写 → 选中光标前那个 token（改）。 */
export function escape(st: EditorState): EditorState {
  if (st.sel) return st;
  return st.caret > headLen(tr(st)) ? select(st, st.caret - 1, st.caret) : st;
}

// ── 直接改（指针拖动 / 歌词） ─────────────────────────────────────────

export function setNote(st: EditorState, i: number, patch: Partial<Pick<NoteTok, "pitch" | "dur" | "lyric" | "hyph">>): EditorState {
  const t = tr(st)[i];
  if (!t || t.kind !== "note") return st;
  const nt = tr(st).slice(), merged: NoteTok = { ...t, ...patch };
  nt[i] = patch.pitch !== undefined && merged.pitch ? withPitches(merged, [merged.pitch, ...(t.chord ?? [])]) : merged;   // 拖旋律音越过叠音里的音：重新排高低
  return next(st, nt);
}
export function setDur(st: EditorState, i: number, dur: number): EditorState {
  const t = tr(st)[i];
  if (!t || !isTimed(t) || !validDur(dur)) return st;
  const nt = tr(st).slice(); nt[i] = { ...t, dur };
  return next(st, nt);
}
export function setHum(st: EditorState, hum: Hum): EditorState { return { ...st, song: { ...st.song, hum } }; }
/** 改歌名（空 = 不填）。 */
/** 换纸（整首歌一个）：A5 = 默认，存成「没有」。 */
export function setPaper(st: EditorState, kind: PaperKind): EditorState {
  const song = { ...st.song }, density = densityOf(st.song.paper ?? paperOf(DEFAULT_PAPER));
  if (kind === DEFAULT_PAPER && density === "cozy") delete song.paper; else song.paper = paperOf(kind, density);
  return (st.song.paper?.kind ?? DEFAULT_PAPER) === kind ? st : { ...st, song };
}
/** 版式：舒适 / 紧凑（整首歌一个；舒适 = 默认，存成「没有」；自家文件不另记 staffMm）。 */
export function setDensity(st: EditorState, d: Density): EditorState {
  const cur = st.song.paper ?? paperOf(DEFAULT_PAPER);
  if (densityOf(cur) === d) return st;
  const paper: Paper = { ...cur }; delete paper.staffMm; if (d === "cozy") delete paper.density; else paper.density = d;
  const song = { ...st.song };
  if (paper.kind === DEFAULT_PAPER && !paper.density) delete song.paper; else song.paper = paper;
  return { ...st, song };
}
/** 改作者栏（每行去掉行尾空白、去掉头尾空行；全空 = 不填）。 */
export function setCredits(st: EditorState, text: string): EditorState {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, ""));
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  const t = lines.join("\n");
  if ((st.song.credits ?? "") === t) return st;
  const song = { ...st.song };
  if (t) song.credits = t; else delete song.credits;
  return { ...st, song };
}
/** 这首歌自己的许可（空 = 不声明）。 */
export function setRights(st: EditorState, text: string): EditorState {
  const t = text.replace(/\r/g, "").trim();
  if ((st.song.rights ?? "") === t) return st;
  const song = { ...st.song };
  if (t) song.rights = t; else delete song.rights;
  return { ...st, song };
}
export function setTitle(st: EditorState, title: string): EditorState {
  const t = title.trim(), song = { ...st.song };
  if (t) song.title = t; else delete song.title;
  return (st.song.title ?? "") === t ? st : { ...st, song };
}

// ── 纸 / 声部（0.5.0）────────────────────────────────────────────────────

const nextKey = (ids: string[], prefix: string) => `${prefix}${Math.max(0, ...ids.map((x) => Number(new RegExp(`^${prefix}(\\d+)$`).exec(x)?.[1] ?? 0))) + 1}`;
/** 一条 track 末尾生效的调号 / 拍号 / 速度（新纸 / 新声部的谱头照抄它）。 */
const endMarks = (toks: Token[]) => ({ fifths: keyAt(toks, toks.length), ...timeAt(toks, toks.length), bpm: tempoAt(toks, toks.length) });
/** 加一个声部（歌级）：每张纸上给它一条只有谱头的 track（谱头抄那张纸第一个在场声部的开头）；光标跳到当前纸上它那条。
 *  role / mic 的 id 由调用方（休息室 / 录音房）配好。 */
export function addPart(st: EditorState, part: PartDef): EditorState {
  if (st.song.parts.some((p) => p.id === part.id)) return st;
  let id = st.nextId;
  const papers = st.song.papers.map((p) => {
    const src = st.song.parts.map((x) => p.tracks[x.id]).find((x) => x) ?? [];
    const h = src.slice(0, headLen(src));
    const toks = h.length ? h.map((t) => ({ ...t, id: id++ })) : headTokens({}, (id += 3) - 3);
    return { ...p, tracks: { ...p.tracks, [part.id]: toks } };
  });
  const song = { ...st.song, parts: [...st.song.parts, part], papers };
  return setFocus({ ...st, song, nextId: id }, st.at.paper, part.id);
}
/** 删一个声部（最后一个不能删）：所有纸上它那条一起没了。 */
export function removePart(st: EditorState, partId: string): EditorState {
  if (st.song.parts.length <= 1 || !st.song.parts.some((p) => p.id === partId)) return st;
  const papers = st.song.papers.map((p) => { const tracks = { ...p.tracks }; delete tracks[partId]; return { ...p, tracks }; });
  const song = { ...st.song, parts: st.song.parts.filter((p) => p.id !== partId), papers };
  const at = st.at.part === partId ? { paper: st.at.paper, part: song.parts[0].id } : st.at;
  return setFocus({ ...st, song }, at.paper, at.part, st.at.part === partId ? undefined : st.caret);
}
/** 声部上下挪一格（谱上从上到下 = Song.parts 的顺序；user 2026-10-08「声部顺序应该能重排」）。每张纸、每条 track 都不动，只换顺序。
 *  速度照旧跟最上面那个声部（tempoMapOf）：挪了谁在最上面，速度就看谁的。 */
export function movePart(st: EditorState, partId: string, d: -1 | 1): EditorState {
  const ps = st.song.parts, i = ps.findIndex((p) => p.id === partId), j = i + d;
  if (i < 0 || j < 0 || j >= ps.length) return st;
  const parts = ps.slice(); [parts[i], parts[j]] = [parts[j], parts[i]];
  return { ...st, song: { ...st.song, parts } };
}
/** 这张纸上加上某个（歌里已有的）声部：一条只有谱头的 track（谱头抄这张纸第一个在场声部的开头）。user 2026-10-08「每个sheet的track数量当然不同」。 */
export function addTrack(st: EditorState, paperId: string, partId: string): EditorState {
  const p = st.song.papers.find((x) => x.id === paperId);
  if (!p || p.tracks[partId] || !st.song.parts.some((x) => x.id === partId)) return st;
  const src = st.song.parts.map((x) => p.tracks[x.id]).find((x) => x) ?? [], h = src.slice(0, headLen(src));
  let id = st.nextId;
  const toks = h.length ? h.map((t) => ({ ...t, id: id++ })) : headTokens({}, (id += 3) - 3);
  return setFocus({ ...st, song: withTrack(st.song, paperId, partId, toks), nextId: id }, paperId, partId);
}
/** 这张纸上去掉某个声部的那条 track（纸上最后一条不能去）。声部本身还在歌里（别的纸照旧）。 */
export function removeTrack(st: EditorState, paperId: string, partId: string): EditorState {
  const p = st.song.papers.find((x) => x.id === paperId);
  if (!p || !p.tracks[partId] || Object.keys(p.tracks).length <= 1) return st;
  const tracks = { ...p.tracks }; delete tracks[partId];
  const song = { ...st.song, papers: st.song.papers.map((x) => (x.id === paperId ? { ...x, tracks } : x)) };
  if (st.at.paper !== paperId || st.at.part !== partId) return { ...st, song };
  return setFocus({ ...st, song }, paperId, st.song.parts.find((x) => tracks[x.id])!.id);
}
/** 新的一张纸（接在 after 后面；没给 = 最后）：每个声部一条只有谱头的 track，谱头照抄上一张纸那个声部结尾时的调号 / 拍号 / 速度
 *  （契约 §6¾：速度每张纸开头明确写一个，新建时照抄上一张纸结尾的）。光标跳到新纸上当前声部。 */
export function addPaper(st: EditorState, after?: string): EditorState {
  const papers = st.song.papers, k = after ? papers.findIndex((p) => p.id === after) : papers.length - 1;
  const prev = papers[k] ?? papers[papers.length - 1], id = nextKey(papers.map((p) => p.id), "p");
  let nid = st.nextId;
  const tracks: Record<string, Token[]> = {};
  for (const part of st.song.parts) {
    const src = prev?.tracks[part.id] ?? st.song.parts.map((x) => prev?.tracks[x.id]).find((x) => x) ?? [];
    tracks[part.id] = headTokens(endMarks(src), nid); nid += 3;
  }
  const paper: PaperSeg = { id, name: "", tracks };
  const list = papers.slice(); list.splice(k + 1, 0, paper);
  return setFocus({ ...st, song: { ...st.song, papers: list }, nextId: nid }, id, st.at.part);
}
/** 删一张纸（最后一张不能删）。 */
export function removePaper(st: EditorState, paperId: string): EditorState {
  const papers = st.song.papers; if (papers.length <= 1) return st;
  const k = papers.findIndex((p) => p.id === paperId); if (k < 0) return st;
  const list = papers.filter((p) => p.id !== paperId), song = { ...st.song, papers: list };
  if (st.at.paper !== paperId) return { ...st, song };
  const to = list[Math.min(k, list.length - 1)];
  return setFocus({ ...st, song }, to.id, st.at.part);
}
/** 纸挪一位（上 / 下）。 */
export function movePaper(st: EditorState, paperId: string, d: -1 | 1): EditorState {
  const list = st.song.papers.slice(), k = list.findIndex((p) => p.id === paperId), j = k + d;
  if (k < 0 || j < 0 || j >= list.length) return st;
  [list[k], list[j]] = [list[j], list[k]];
  return { ...st, song: { ...st.song, papers: list } };
}
/** 改一个声部的谱号（高音 = 默认，存成「没有」）。 */
export function setPartClef(st: EditorState, partId: string, clef: Clef): EditorState {
  const p = st.song.parts.find((x) => x.id === partId); if (!p || (p.clef ?? "G") === clef) return st;
  const np: PartDef = { ...p }; if (clef === "G") delete np.clef; else np.clef = clef;
  return { ...st, song: { ...st.song, parts: st.song.parts.map((x) => (x.id === partId ? np : x)) } };
}
/** 大谱表：每个 token 落在上（1）还是下（2）谱表——按音高自动（中央 C 以下 = 下），手动指定的优先；休止 / 记号跟前一个音。单谱表 = 全 1。 */
export function autoStaffs(tokens: Token[], staves: 1 | 2): Staff[] {
  let last: Staff = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    if (t.kind === "note") last = midiOf(effectivePitch(tokens, i)) < SPLIT_MIDI ? 2 : 1;
    return last;
  });
}
export function staffOfTokens(tokens: Token[], staves: 1 | 2): Staff[] {
  const auto = autoStaffs(tokens, staves);
  let last: Staff = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    const s = (t.kind === "note" || t.kind === "rest") && t.staff ? t.staff : t.kind === "note" ? auto[i] : last;
    last = s; return s;
  });
}
/** 单谱表 ↔ 大谱表。 */
export function setPartStaves(st: EditorState, partId: string, n: 1 | 2): EditorState {
  const p = st.song.parts.find((x) => x.id === partId); if (!p || (p.staves ?? 1) === n) return st;
  const np: PartDef = { ...p }; if (n === 1) delete np.staves; else np.staves = 2;
  return { ...st, song: { ...st.song, parts: st.song.parts.map((x) => (x.id === partId ? np : x)) } };
}
/** 「换谱表」：选中的音 / 刚写的音挪到另一张谱表（手动指定）；已经手动指定的 = 取消指定（回到按音高自动）。 */
export function toggleStaff(st: EditorState, staves: 1 | 2): EditorState {
  if (staves !== 2) return st;
  const toks = tr(st), targets: number[] = [];
  if (st.sel) { for (let i = st.sel.from; i < st.sel.to; i++) if (isTimed(toks[i])) targets.push(i); }
  else { const i = currentIndex(st); if (i >= 0) targets.push(i); }
  if (!targets.length) return st;
  const auto = autoStaffs(toks, 2), nt = toks.slice();
  for (const i of targets) {
    const t = nt[i] as Timed;
    if (t.staff) { const c = { ...t }; delete c.staff; nt[i] = c; }
    else nt[i] = { ...t, staff: auto[i] === 1 ? 2 : 1 };
  }
  return next(st, nt);
}
/** 改曲段名（纸顶那一条；空 = 不填）。 */
export function setPaperName(st: EditorState, paperId: string, name: string): EditorState {
  const t = name.trim(), p = st.song.papers.find((x) => x.id === paperId);
  if (!p || p.name === t) return st;
  return { ...st, song: { ...st.song, papers: st.song.papers.map((x) => (x.id === paperId ? { ...x, name: t } : x)) } };
}

// ── 时间轴（播放、画谱、小节对账都用） ─────────────────────────────────

export interface TimedAt {
  index: number; tok: Timed;
  start: number;            // tick，从头算
  inBar: number;            // tick，从上一条小节线算
  bpm: number;              // 这里生效的速度
  t0: number; t1: number;   // 秒（按速度记号一段一段算）
}

/** 速度表：tick → 从这里起的 bpm（第一个声部压平后的速度记号；其余声部按它算秒数，自己串里的速度记号不算数）。 */
export type TempoMap = { tick: number; bpm: number }[];
export function timeline(tokens: Token[], tempoMap?: TempoMap): TimedAt[] {
  const out: TimedAt[] = [];
  let t = 0, bar = 0, sec = 0, bpm = DEFAULT_BPM, k = 0;
  tokens.forEach((tok, index) => {
    if (tok.kind === "bar") { bar = t; return; }
    if (tok.kind === "tempo") { if (!tempoMap) bpm = tok.bpm; return; }
    if (!isTimed(tok)) return;
    if (tempoMap) { while (k < tempoMap.length && tempoMap[k].tick <= t) { bpm = tempoMap[k].bpm; k++; } }
    const len = (tok.dur / TPQ) * (60 / bpm);
    out.push({ index, tok, start: t, inBar: t - bar, bpm, t0: sec, t1: sec + len });
    t += tok.dur; sec += len;
  });
  return out;
}
/** 一条 track 的总长（tick）。 */
export const trackTicks = (tokens: Token[]): number => tokens.reduce((a, t) => a + (isTimed(t) ? t.dur : 0), 0);
/** 一张纸的长度 = 上面最长的那条 track（纸界 = 硬对齐点，短的补到这么长）。 */
export const paperTicks = (p: PaperSeg): number => Math.max(0, ...Object.values(p.tracks).map(trackTicks));
/** 一个声部压平成一串（播放 / 派生的 score.musicxml 用）：各纸按序接起来，后面纸的谱头记号变成中途的记号；
 *  某张纸没这个声部 = 只有谱头（抄这张纸第一个在场声部的）+ 整纸休止；短的补休止到纸的长度。starts = 每张纸在这串里从哪个下标起。 */
export function flattenPart(song: Song, partId: string): { tokens: Token[]; starts: { index: number; paper: PaperSeg }[] } {
  const out: Token[] = [], starts: { index: number; paper: PaperSeg }[] = [];
  let id = -1;   // 补的休止 / 抄的记号用负 id（不落地，只在这一串里；文件里的 id 由写的那边编）
  let k = -1;
  song.papers.forEach((p) => {
    if (p.hidden) return;   // 隐藏的纸不放、不进压平件
    k++;
    const have = p.tracks[partId], len = paperTicks(p);
    starts.push({ index: out.length, paper: p });
    let toks: Token[];
    if (have) toks = have;
    else {
      const src = song.parts.map((x) => p.tracks[x.id]).find((x) => x) ?? [];
      toks = src.slice(0, headLen(src)).map((t) => ({ ...t, id: id-- }));
    }
    if (k === 0) out.push(...toks);
    else { const h = headLen(toks); out.push(...toks.slice(0, h).map((t) => ({ ...t, id: id-- })), ...toks.slice(h)); }   // 后面纸的谱头：抄一份当中途记号（id 不撞）
    const pad = len - trackTicks(toks);
    if (pad > 0) out.push({ kind: "rest", id: id--, dur: pad });
  });
  return { tokens: out, starts };
}
/** 第一个声部的速度表（压平后的速度记号按 tick 列出来；别的声部按它算秒数）。 */
export function tempoMapOf(song: Song): TempoMap {
  const first = song.parts[0]; if (!first) return [];
  const { tokens } = flattenPart(song, first.id), map: TempoMap = [];
  let t = 0;
  for (const tok of tokens) { if (tok.kind === "tempo") map.push({ tick: t, bpm: tok.bpm }); else if (isTimed(tok)) t += tok.dur; }
  return map;
}

/** 每个小节（两条小节线之间）实际拍数和那里的拍号是否对得上——只用来轻标，不拦（家规：不许规训）。 */
export function barFill(tokens: Token[]): { from: number; to: number; ticks: number; full: boolean }[] {
  const wantOf = (b: number, bt: number) => (b * WHOLE) / bt;
  let want = wantOf(DEFAULT_TIME.beats, DEFAULT_TIME.beatType);
  const out: { from: number; to: number; ticks: number; full: boolean }[] = [];
  let from = 0, ticks = 0;
  tokens.forEach((tok, i) => {
    if (tok.kind === "bar") { out.push({ from, to: i, ticks, full: ticks === want }); from = i + 1; ticks = 0; }
    else if (tok.kind === "time") want = wantOf(tok.beats, tok.beatType);
    else if (isTimed(tok)) ticks += tok.dur;
  });
  return out;
}
