// pad-music.ts —— pad 的音乐知识（注入给 src/keyboard/pad.ts 的 PadMusic）：调式梯子 → 每个音键是哪个音、怎么标；「1=」/ 调式的候选；「⋯」里插记号的现值。
// created 2026-10-15 by Claude Fable 5.1（键盘模块刀 2；原来长在 pad.ts 里的 scales / pitch / song 调用原样搬来，算法不变）。
//   user 2026-10-14「键盘确实是前端，音乐知识比如和弦有几个是外部注入的，所以一个键盘的前端库，一个是负责生成音乐知识的深模块。以后我们马上要做和弦键盘，也是一样的」
//   键盘只认「第 k 级」；k 是什么音、叫什么、MIDI 几号，都从这里拿。以后的和弦键盘 = 另一个 PadMusic（cell(k) = 第 k 个和弦）。
import { type Pitch, HOME, diatonicIndex, tonicStepIndex, pitchName, alterBy, midiOf, KEY_LABEL } from "../score/pitch.ts";
import { type Scale, SCALES, scaleById, ladderAt, ladderFirstAtOrAbove, ladderHome, degLabel } from "../score/scales.ts";
import { type EditorState, inputKey, keyAt, timeAt, tempoAt, tr } from "../score/song.ts";
import type { PadMusic, PadCell } from "../keyboard/pad.ts";

/** 五度圈，♭ 多 → C → ♯ 多；旋钮 / 滚轮里反过来放（大的在上：1=F♯ … 1=C … 1=G♭）。 */
export const KEY_CIRCLE = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
const KNOB_KEYS = [...KEY_CIRCLE].reverse();
/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
export function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
/** 音名的人话写法：C♯4 / B♭3。 */
export const pretty = (p: Pitch): string => pitchName(p).replace(/#/g, "♯").replace(/b(?=\d)|b(?=b)/g, "♭");
/** 「1=」旋钮上的字：调 + 调式名（小字）。 */
const keyLabel = (f: number, sc: Scale) => `<span class="kk">1=${KEY_LABEL[f] ?? "?"}</span><small>${sc.name}</small>`;
/** 调式在滚轮里的样子：名字 + 从主音起的音级（羽调式 = 6 1 2 3 5）。 */
const scaleItem = (sc: Scale) => `<span class="sc"><b>${sc.name}</b><small>${[...sc.degs.slice(sc.home), ...sc.degs.slice(0, sc.home)].map(degLabel).join(" ")}</small></span>`;

/** 宿主这边多知道的几样（写谱 / 出声要音高；旋钮第 i 档是哪个调）；键盘拿到的只是 PadMusic 那部分。 */
export interface PadMusicHost extends PadMusic {
  /** 第 k 级是哪个音（宿主写谱 / 出声用；键盘不碰）。 */
  pitchAt(k: number): Pitch;
  /** 旋钮 / 滚轮第 i 档 = 哪个调 / 哪个调式。 */
  fifthsAt(i: number): number;
  scaleIdAt(i: number): string;
}

export function createPadMusic(get: () => EditorState): PadMusicHost {
  const f = (): number => inputKey(get()), sc = (): Scale => scaleById(get().input.inputScale);
  const at = (k: number) => ladderAt(sc(), k, homeTonic(f()), f());
  const pitchAt = (k: number): Pitch => at(k).pitch;
  return {
    sig: () => `${f()}|${get().input.inputScale}`,
    cell: (k): PadCell => { const r = at(k); return { deg: degLabel(r.deg), oct: r.oct, abs: pretty(r.pitch), midi: midiOf(r.pitch) }; },
    altered: (k, a) => pretty(alterBy(pitchAt(k), a)),
    anchor: (layout) => (layout === "absolute" ? ladderFirstAtOrAbove(sc(), 60, homeTonic(f()), f()) : ladderHome(sc(), homeTonic(f()), f())),
    keyChoices: () => ({ items: KNOB_KEYS.map((k) => keyLabel(k, sc())), index: Math.max(0, KNOB_KEYS.indexOf(f())), name: `1=${KEY_LABEL[f()] ?? "?"} ${sc().name}` }),
    keyDrum: () => {
      const st = get();
      return {
        keys: { items: KNOB_KEYS.map((k) => `1=${KEY_LABEL[k]}`), index: Math.max(0, KNOB_KEYS.indexOf(inputKey(st))) },
        scales: { items: SCALES.map(scaleItem), index: Math.max(0, SCALES.findIndex((x) => x.id === st.input.inputScale)) },
      };
    },
    marksHere: () => {
      const st = get(), toks = tr(st), i = st.sel ? st.sel.from : st.caret, t = timeAt(toks, i);
      return { key: KEY_LABEL[keyAt(toks, i)] ?? "?", beats: t.beats, beatType: t.beatType, bpm: tempoAt(toks, i) };
    },
    pitchAt,
    fifthsAt: (i) => KNOB_KEYS[i],
    scaleIdAt: (i) => SCALES[i].id,
  };
}
