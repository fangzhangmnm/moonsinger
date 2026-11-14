// pad-music.ts —— pad 的音乐知识（注入给 src/keyboard/pad.ts 的 PadMusic）：调式梯子 → 每个音键是哪个音、怎么标；「1=」/ 调式的候选；「⋯」里插记号的现值。
// created 2026-10-15 by Claude Fable 5.1（键盘模块刀 2；原来长在 pad.ts 里的 scales / pitch / song 调用原样搬来，算法不变）。
//   user 2026-10-14「键盘确实是前端，音乐知识比如和弦有几个是外部注入的，所以一个键盘的前端库，一个是负责生成音乐知识的深模块。以后我们马上要做和弦键盘，也是一样的」
//   键盘只认「第 k 级」；k 是什么音、叫什么、MIDI 几号，都从这里拿。以后的和弦键盘 = 另一个 PadMusic（cell(k) = 第 k 个和弦）。
import { HOME, diatonicIndex, tonicStepIndex, noteName, alterBy, midiOf, KEY_LABEL, keySpell, type Pitch } from "../score/pitch.ts";
import { toDegree } from "../score/degree.ts";
import { drawnPitch } from "../score/view-in-c.ts";
import { type Scale, SCALES, scaleById, ladderAt, ladderFirstAtOrAbove, ladderHome, degLabel } from "../score/scales.ts";
import { type EditorState, inputKey, inputScaleOf, keyAt, timeAt, tempoAt, tr } from "../score/song.ts";
import { _t } from "../i18n/index.ts";
import type { PadMusic, PadCell, KeyFaces } from "../keyboard/pad.ts";

/** 五度圈，♭ 多 → C → ♯ 多；旋钮 / 滚轮里反过来放（大的在上：1=F♯ … 1=C … 1=G♭）。 */
export const KEY_CIRCLE = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
const KNOB_KEYS = [...KEY_CIRCLE].reverse();
/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
export function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
/** 「这个键写什么」只有这一处（第 19 条；统筹 a6be57e4）：键上的大字 = 这个键的音在光标这里、这个声部上，排版会把它画成的那个名字。
 *  · 移调辅助起作用（五线谱、不是打击乐的行）：大字 = 音按光标这里的调号拼写（落进谱时的写法 keySpell）再换到 C（toC，和排版、鬼音符同一个换法），
 *    小字 = 实际的音名。和键盘自己的「1=」无关（谱降 E、键盘手动 1=G：G4 那个键大字 E4、小字 G4）。
 *  · 别的时候（排版不换的地方）：大字 = 实际的音名，小字 = 级数（照旧）。
 *  · 简谱（v0.17.43，统筹「简谱下键上的大字写纸上的数字、小字写实际的音名」）：大字 = 这个音落进谱时按光标这里的调号拼写、排版会画成的那个数字
 *    （同 src/score/degree.ts toDegree：1 = 调号的大调主音；八度点 = 光标那一行的八度基准 jianpu），小字 = 实际的音名。键的位置不动。
 *  名字一律走音名那一个出口（noteName，八度照「中央 C 叫 C 几」）。升降滑出来的那个音（altered）同一条规矩，两行一起变。 */
export function keyFaces(p: Pitch, degree: { deg: string; oct: number; acc?: string }, o: { inC: boolean; fifths: number; middleC: number; jianpu?: number | null }): KeyFaces {
  if (o.jianpu !== undefined && o.jianpu !== null) { const d = toDegree(keySpell(p, o.fifths), o.fifths); return { big: { deg: String(d.degree), oct: d.shift - o.jianpu, ...(d.acc ? { acc: ACC_TEXT[d.acc + 2] } : {}) }, small: { name: noteName(p, o.middleC) } }; }
  if (o.inC) return { big: { name: noteName(drawnPitch(p, o.fifths), o.middleC) }, small: { name: noteName(p, o.middleC) } };
  return { big: { name: noteName(p, o.middleC) }, small: { deg: degree.deg, oct: degree.oct, ...(degree.acc ? { acc: degree.acc } : {}) } };
}
const ACC_TEXT = ["♭♭", "♭", "", "♯", "♯♯"];
/** 移调辅助起作用时「1=」旁边的小标（第 19 条第 7 点的披露之一；「1=」照旧写实际的调）。 */
const IN_C_TAG = () => ({ text: _t("键上按 C 调写"), title: _t("移调辅助开着：键上的大字是这个音在谱上（换到 C 调）画成的名字，小字是实际的音；「1=」写的是实际的调") });
/** 「1=」旋钮上的字：调 + 调式名（小字）。 */
const keyLabel = (f: number, sc: Scale) => `<span class="kk">1=${KEY_LABEL[f] ?? "?"}</span><small>${sc.name}</small>`;
/** 调式在滚轮里的样子：名字 + 从主音起的音级（羽调式 = 6 1 2 3 5）。 */
const scaleItem = (sc: Scale) => `<span class="sc"><b>${sc.name}</b><small>${[...sc.degs.slice(sc.home), ...sc.degs.slice(0, sc.home)].map(degLabel).join(" ")}</small></span>`;
/** 调式那一列最上面一档 = 跟谱（v0.16.9，user 11-07「键盘就有个自动模式。然后也有个手动覆盖模式」）：「1=」跟着光标处的调号、按大调排。 */
const AUTO_ITEM = () => `<span class="sc"><b>${_t("跟谱")}</b><small>${_t("跟着谱上这里的调号")}</small></span>`;
/** 这个调 + 调式在 pad 上有哪些音（12 个音级里的哪几个）。 */
const pcsOf = (sc: Scale, f: number): Set<number> => new Set(sc.degs.map((_, k) => midiOf(ladderAt(sc, k, homeTonic(f), f).pitch) % 12));
/** pad 上有调号以外的音：手动拨的调 / 调式有音不在谱上这里的调号里（1=C 多利亚 / 小调 / 羽调式在 C 大调里 = 没有：同一个 1=、换个主音；1=G 在 C 大调里 = F♯ 不在；布鲁斯带 ♭3 ♭7 = 有）。 */
export function outsideKey(sc: Scale, f: number, keySig: number): boolean {
  const inKey = pcsOf(scaleById("major"), keySig);
  return [...pcsOf(sc, f)].some((pc) => !inKey.has(pc));
}

/** 宿主这边多知道的几样（写谱 / 出声要音高；旋钮第 i 档是哪个调）；键盘拿到的只是 PadMusic 那部分。 */
export interface PadMusicHost extends PadMusic {
  /** 第 k 级是哪个音（宿主写谱 / 出声用；键盘不碰）。 */
  pitchAt(k: number): Pitch;
  /** 旋钮 / 滚轮第 i 档 = 哪个调 / 哪个调式（调式第 0 档 = "auto" = 跟谱）。 */
  fifthsAt(i: number): number;
  scaleIdAt(i: number): string;
}

/** middleC = 中央 C 叫 C 几（这首歌的，跟着设备的习惯；第 18 条）：键上的字、音域旋钮照它写。
 *  inC = 移调辅助在光标这个声部上起不起作用（五线谱、开着、不是打击乐的行；宿主判，第 19 条）：起作用 = 键上大字照谱上换到 C 调画成的名字写。 */
export function createPadMusic(get: () => EditorState, middleC: () => number, inC: () => boolean = () => false, jianpuBase: () => number | null = () => null): PadMusicHost {
  const f = (): number => inputKey(get()), sc = (): Scale => scaleById(inputScaleOf(get()));
  const keySig = (st: EditorState): number => keyAt(tr(st), st.sel ? st.sel.from : st.caret);
  const at = (k: number) => ladderAt(sc(), k, homeTonic(f()), f());
  const pitchAt = (k: number): Pitch => at(k).pitch;
  const faceCtx = () => ({ inC: inC(), fifths: keySig(get()), middleC: middleC(), jianpu: jianpuBase() });
  return {
    sig: () => { const jb = jianpuBase(); return `${f()}|${inputScaleOf(get())}|${middleC()}|${inC() ? `C${keySig(get())}` : ""}${jb === null ? "" : `|J${keySig(get())}:${jb}`}`; },   // 简谱：光标走过转调 / 换了八度基准的行 = 重写   // 中央 C 的叫法变了 / 移调辅助开关 / 开着时光标走过转调 = 键上的字重写
    cell: (k): PadCell => { const r = at(k); return { ...keyFaces(r.pitch, { deg: degLabel(r.deg), oct: r.oct }, faceCtx()), midi: midiOf(r.pitch), ...(r.deg.deg === 1 && r.deg.alt === 0 ? { tonic: true } : {}) }; },
    altered: (k, a) => { const r = at(k); return keyFaces(alterBy(r.pitch, a), { deg: degLabel(r.deg), oct: r.oct, acc: ACC_TEXT[a + 2] }, faceCtx()); },
    anchor: (layout) => (layout === "absolute" ? ladderFirstAtOrAbove(sc(), 60, homeTonic(f()), f()) : ladderHome(sc(), homeTonic(f()), f())),
    keyChoices: () => {
      const st = get(), name = `1=${KEY_LABEL[f()] ?? "?"} ${sc().name}`, ks = keySig(st);
      // 手动、而且 pad 上有谱上这里的调号以外的音 = 挂「手动」（同一个 1= 换个调式 = 同一套音 = 不挂）
      const tag = !st.input.inputAuto && outsideKey(sc(), f(), ks)
        ? { text: _t("手动"), title: _t("手动：键盘按 {pad} 排，和谱上这里的调号（1={k}）不一样。点开「1=」，调式那一列最上面的「跟谱」= 回到跟着谱走", { pad: name, k: KEY_LABEL[ks] ?? "?" }) }
        : undefined;
      return { items: KNOB_KEYS.map((k) => keyLabel(k, sc())), index: Math.max(0, KNOB_KEYS.indexOf(f())),
        name: st.input.inputAuto ? _t("{name}（跟着谱上这里的调号）", { name }) : _t("{name}（手动）", { name }), tags: [...(tag ? [tag] : []), ...(inC() ? [IN_C_TAG()] : [])] };
    },
    keyDrum: () => {
      const st = get();
      return {
        keys: { items: KNOB_KEYS.map((k) => `1=${KEY_LABEL[k]}`), index: Math.max(0, KNOB_KEYS.indexOf(inputKey(st))) },
        scales: { items: [AUTO_ITEM(), ...SCALES.map(scaleItem)], index: st.input.inputAuto ? 0 : 1 + Math.max(0, SCALES.findIndex((x) => x.id === st.input.inputScale)) },
      };
    },
    marksHere: () => {
      const st = get(), toks = tr(st), i = st.sel ? st.sel.from : st.caret, t = timeAt(toks, i);
      return { key: KEY_LABEL[keyAt(toks, i)] ?? "?", beats: t.beats, beatType: t.beatType, bpm: tempoAt(toks, i) };
    },
    pitchAt,
    fifthsAt: (i) => KNOB_KEYS[i],
    scaleIdAt: (i) => (i === 0 ? "auto" : SCALES[i - 1].id),   // 第 0 档 = 跟谱（song.ts setInputScale 认 "auto"）
  };
}
