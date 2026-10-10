// pad.ts —— 手指面板 = 一台独立的 MEDO 式输入设备（假设没有谱）：4 个旋钮 + 6 个写字键 + 占满整宽的音键网格（自上而下）。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改；2026-10-07 晚 改成独立设备（下面）
// 来历（grill 账本 Q10 / Q11 / UX-1 / UX-2 与「pad 简化讨论」）：user「Donner MEDO 是golden ui example…我只是当ocarina来按」；
//   「把pad想成一个独立的medo式的输入设备，假设没有谱」「数字键盘左右左右空间要占满」「退格必须最右边。然后小节线和零和dash也蛮有必要的」
//   「我还需要左右键导航」「弹应该放在顶栏」「写完再改坚决不行…就是设置好duration基线然后用dash」「退格长按可以多删」。
// · 设备只往外发事件（音 / 休止 / — / 小节线 / 退格 / ← →），自己带旋钮：调（1=）、长短基线（含连音）、音域窗口。
//   pad 的「1=」是它自己的，不跟谱上的调号（user「如果一个谱有好几个调怎么算」）；写进谱时按 pad 的调拼写，谱上该加临时记号就加。
// · 旋钮 = 最上面一排（试过放 pad 最下面，user「别扭，还是放在上面吧」）：1= / 长短 / 音域三个分宽度，「⋯」是右边一个小方块；
//   写字键里的 ← → 也是同样大小的方块（user「应该是方形的不应该那么宽。步进也做成固定宽度的，方便肌肉记忆，也许也是同样大小的小方形？」
//   「步进我说的是左右」「...和左右应该宽度和高度差不多，其他的也许adaptive一些」），0 | — ⌫ 分剩下的宽，⌫ 最右。
//   音域写「F3–G5」；旋钮太窄就两行，下面是低的那头（user「G5F3应该是F3-G5吧」「也许上下两个吧，下面是lower bound」）。
//   按住上下滑 = 就在旋钮那一格里滚，像汽车里程表——旋钮变成一扇窗、滚轮藏在后面（user「in place滚的时候应该是原来的钮变成一个窗，
//   滚轮藏在下面，就像汽车里程表一样」）；内容跟着手指走，大的在上——音域就是一张纸：往上推 = 看下面更低的
//   （user「如果键盘是一个可以滑动的纸，那么你往上滑应该是往下看」）；一次最多一格、滑几下就是几格（user「in place的时候一次最多一格，
//   这样方便快速swipe几次就是几格」）；松手立刻停（user「手指松了立刻停，不要顿一下，这是快速输入」）。
//   只是点一下 = 从那一格展开一根同样宽的竖直滚轮（src/ui/drum.ts，原生滚动），点格子或滚到哪就是哪
//   （user「那些上下可以滑或者点开选对吧」「我想的是点了之后变成一个overlay的同样宽度的竖直滚动桶」；长短那根旁边并一根窄的连音滚轮「2好主意」，
//   连音画成真的一组小蝌蚪、跟着长短变：user「三联我是说画具体的小蝌蚪」「三联五联的小蝌蚪应该跟着base时值adaptive的变」）。没有「本调」。
//   移调（有选中时）和「⋯」是一次性的动作、不是选一个值：点了整排换成候选。
// · 音键：按下即写（手感不变）；按着往上 / 往下滑过门槛 = 这一个音升 / 降半音（临时离调，只管这一个音），
//   松手前键上先显示结果、滑回中间 = 还原（user「touchscreen滑动天天做的…上下…滑动会非常适合临时离调」「滑过一定距离才算 + 松手前先显示结果 同意」）。
// · 音键排法：列 × 行（默认 4 × 4），中央 C 那一行在中线下面一行；首调 / 绝对两档（默认绝对，大字永远是简谱数字）；
//   键高 / 键缝照 WXHW 量的 iOS 键盘（平板 55.5 / 9，手机 46 / 6，左右 5）。
// · 「1」不特别标（user「键盘上面的1不用专门强调，这样容易和灰色混淆」）；音域提示改成正面的：月读音域里的键底部一道细条，
//   音域外的键就是普通的键，不变灰（user「灰色也换一个representation，不然容易以为是unavailable，而不是not hinted」）。
// · 「弹」不在 pad 上（顶栏）；弹的时候音键外面不画框（user「弹时候的那圈奇怪的框不要」）。
// · 有选中（改）的时候「1=」旋钮变成「移调」：点了 = 半音 / 全音 / 八度 / 转调…

import { type Pitch, HOME, diatonicIndex, tonicStepIndex, pitchName, alterBy, midiOf, KEY_LABEL } from "../score/pitch.ts";
import { type Scale, SCALES, scaleById, ladderAt, ladderFirstAtOrAbove, ladderHome, degLabel } from "../score/scales.ts";
import type { Command } from "../score/commands.ts";
import { hint } from "../input/keys.ts";
import { type EditorState, type Acc, type Art, inputKey, keyAt, timeAt, tempoAt, tr, singleSel } from "../score/song.ts";
import { openDrum, type DrumHandle } from "./drum.ts";

/** 月读的音域 A3–E5（MIDI）：键底部画细条提示，音域外不拦、不变灰。宿主不给提示音域时（hintRange 没接）用它。 */
export const HER_RANGE = { lo: 57, hi: 76, who: "月读" } as const;
/** 提示音域：谁在弹（宿主说）+ 她 / 它的音域（MIDI，含两端）。null = 不画提示。 */
export type HintRange = { lo: number; hi: number; who: string; title?: string } | null;   // title = 键上的提示字（没有 = 「谁的音域里」）
/** 设备形态（同 WXHW src/input/dock.ts）：短边 ≥ 600 且宽 ≥ 700 = 平板。 */
const padForm = (): "tablet" | "phone" => (Math.min(innerWidth, innerHeight) >= 600 && innerWidth >= 700 ? "tablet" : "phone");
/** 布局里行 / 列能调的范围（加减号到头就灰）。 */
/** 符号层「连线」格子：一道弧（SMuFL 没有单个连线字形）。 */
const SLUR_CELL = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,9 Q11,1 20,9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
/** 符号层三页（2026-10-08 Opus 5.5 提、user「可以」）：一页一般放得下（4 列 3 排 = 12），位置固定好记。演奏法 = 上一排音头、下一排长短 / 连断；力度 = 力度、渐强渐弱、音内起伏；记号 = 句号、调号 / 拍号 / 速度（大谱表多换谱表）。 */
type SymPage = "art" | "dyn" | "mark";
const SYM_PAGES: Record<SymPage, readonly string[]> = {
  art: ["art:ghost", "art:unstress", "art:stress", "art:accent", "art:marcato", "art:sfz", "art:fp", "art:tenuto", "art:staccato", "slur", "art:breath", "inhale:soft", "inhale:big", "art:whisper", "swell:<", "swell:>", "swell:<>", "art:arpeggio"],   // 2026-10-10：出声的换气（轻吸 / 深吸）、气声（× 符头）   // 从轻到重一路排下来（强度的阶梯），再是长短 / 连断
  dyn: ["dyn:ppp", "dyn:pp", "dyn:p", "dyn:mp", "dyn:mf", "dyn:f", "dyn:ff", "dyn:fff", "wedge:cresc", "wedge:dim", "dyn:ramp"],   // 音内渐强 / 渐弱 / 鼓起搬到「演奏法」（v0.9.44；user「…应该属于演奏法…因为是跟着音符的」）   // ppp…fff 两整排（v0.9.23）
  mark: ["phrase", "key", "time", "tempo", "clef", "ottava", "groove", "repeat", "staff"],   // 谱号 / 八度线（v0.9.28）
};
const SYM_PAGE_NAME: Record<SymPage, string> = { art: "演奏法", dyn: "力度", mark: "记号" };
const SYM_PAGE_TITLE: Record<SymPage, string> = { art: "强度（幽灵音 / 弱化 / 次重音 / 重音 / 强音 / 突强 / 强后即弱）、保持 / 跳音 / 连线 / 呼吸（静默 / 轻吸 / 深吸）、气声", dyn: "ppp…fff、渐强 / 渐弱、渐到、音内起伏", mark: "句号、调号 / 拍号 / 谱号 / 八度线 / 速度、风格（拍子轻重）" };
const RAMP_CELL = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M20,2 L3,6 L20,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;   // 渐到 = 虚线发夹
const CRESC_CELL = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M20,2 L3,6 L20,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DIM_CELL = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,2 L19,6 L2,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** 力度记号的 Bravura 字形（同选区条「修」）。 */
const DYN_CELL = { ppp: "\u{E52A}", pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}", fff: "\u{E530}" } as const;
/** 音内起伏的格子：一个符头上面一个小发夹。 */
const swellSvg = (d: string) => `<svg class="slur-ico" viewBox="0 0 22 16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="11" cy="13" rx="3.2" ry="2.3" fill="currentColor"/></svg>`;
const SWELL_CELL = { "<": swellSvg("M19,2 L4,5.5 L19,9"), ">": swellSvg("M3,2 L18,5.5 L3,9"), "<>": swellSvg("M2,5.5 L11,2 L20,5.5 M2,5.5 L11,9 L20,5.5") } as const;
const ROWS_MIN = 3, ROWS_MAX = 8, COLS_MIN = 3, COLS_MAX = 7;
/** 键高 + 上下缝（px）= styles.css 的 --key-h / --kgv（照 WXHW 量的 iOS 键盘）。 */
const KEY_METRIC = { tablet: { h: 55.5, gap: 9 }, phone: { h: 46, gap: 6 } } as const;
const SWIPE = 20;       // px：音键上下滑过这么远才算升 / 降
/** 升降键的四种，上面的更升（滑着换：往上 = 更升）；键上的字（Bravura：𝄫 ♭ · ♯ 𝄪）；音键上的小字。 */
const ACC_ORDER: Exclude<Acc, 0>[] = [2, 1, -1, -2];
const ACC_GLYPH = ["\uE264", "\uE260", "", "\uE262", "\uE263"];
const ACC_TEXT = ["♭♭", "♭", "", "♯", "♯♯"];
const STEP = 28;        // px：旋钮上滑这么远 = 窗里滚一整格（一次最多一格，过半格就算）
const MOVE = 6;         // px：按下旋钮挪过这么远才算「滑」；没挪就松手 = 点（展开滚轮）
const STACK = 150;      // px：「1=」旋钮比这窄 = 调和调式名分两行写
const NARROW = 96;      // px：音域旋钮比这窄 = 一行写不下「F♯3–G♯5」，改两行
const TIGHT = 130;      // px：音域旋钮比这窄 = 一行字和 ⇅ 挤在一起，这一个不画 ⇅（另外两个旋钮上有，手势一样）
const UNITS = [0, 1, 2, 3, 4, 5];          // 长短，短的在上：三十二分 … 全音符——往上推 = 变长 = 变慢（user 2026-10-07「音符时长的滚动方向翻一下，往上推是变慢」）
const TUP = [0, 3, 5, 6, 7] as const;      // 连音：不连 / 3 / 5 / 6 / 7
const SHIFTS = [4, 3, 2, 1, 0, -1, -2, -3, -4];   // 音域窗口，高的在上
/** 简谱的八度点：真的小圆点（数字上方 = 高八度、下方 = 低八度，多个横排）。 */
const octDots = (n: number) => (n > 0 ? `<span class="jp-dots">${"<i></i>".repeat(n)}</span>` : `<span class="jp-dots"></span>`);
/** Bravura 的整个音符字形（SMuFL 预组合音符，符干朝上）：三十二分 … 全音符。 */
const UNIT_GLYPH = ["\uE1DB", "\uE1D9", "\uE1D7", "\uE1D5", "\uE1D3", "\uE1D2"];   // SMuFL note32ndUp / 16thUp / 8thUp / QuarterUp / HalfUp / Whole（写成转义，免得编辑器吞掉私用区字符）
/** 插记号按钮上的音乐符号（Bravura；SMuFL timeSig0–9 = U+E080–E089、metNoteQuarterUp）。写成转义，免得编辑器吞掉私用区字符。 */
const QUARTER = "\uECA5", TS = (n: number) => String.fromCodePoint(0xe080 + n);   // QUARTER = metNoteQuarterUp（速度记号里用的小号音符）
const UNIT_NAME = ["三十二分", "十六分", "八分", "四分", "二分", "全音符"];
const KEY_NAMES = KEY_LABEL;
const KEY_CIRCLE = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];   // 五度圈，♭ 多 → C → ♯ 多
/** 连音的样子 = 真画一组 n 个小蝌蚪，跟着长短基线变：三十二分 3 道横梁、十六分 2 道、八分 1 道、四分只有符干、二分空心、全音符空心没符干；
 *  上面一道括号，中间是连音数字（Bravura tuplet0–9 = U+E880–E889）。user「三联我是说画具体的小蝌蚪」「三联五联的小蝌蚪应该跟着base时值adaptive的变」。 */
function tupletMark(n: number, unit: number): string {
  const S = 7, M = 1.5, HY = 25, TOP = 11.5, hx = (i: number) => M + 3 + i * S, sx = (i: number) => hx(i) + 2.35;
  const W = hx(n - 1) + 3 + M, hollow = unit >= 4, beams = Math.max(0, 3 - unit), cx = W / 2, by = 4.5;
  const heads = Array.from({ length: n }, (_, i) =>
    `<ellipse class="${hollow ? "ho" : "fi"}" cx="${hx(i)}" cy="${HY}" rx="${unit === 5 ? 3 : 2.6}" ry="1.85" transform="rotate(-20 ${hx(i)} ${HY})"/>`).join("");
  const stems = unit <= 4 ? Array.from({ length: n }, (_, i) => `<line x1="${sx(i)}" y1="${HY - 0.5}" x2="${sx(i)}" y2="${TOP}"/>`).join("") : "";
  const beam = Array.from({ length: beams }, (_, k) => `<rect x="${sx(0) - 0.45}" y="${TOP + k * 3}" width="${sx(n - 1) - sx(0) + 0.9}" height="1.8"/>`).join("");
  return `<svg class="tupsvg" viewBox="0 0 ${W} 28.5" width="${((W * 32) / 28.5).toFixed(1)}" height="32" aria-label="${n} 连音">` +
    `<path class="br" d="M${M} ${by + 2.5}V${by}H${cx - 3.6}M${cx + 3.6} ${by}H${W - M}V${by + 2.5}"/>` +
    `<text x="${cx}" y="${by + 3}" text-anchor="middle">${String.fromCodePoint(0xe880 + n)}</text>${stems}${beam}${heads}</svg>`;
}
/** 「1=」旋钮上的字：调 + 调式名（小字）。 */
const keyLabel = (f: number, sc: Scale) => `<span class="kk">1=${KEY_LABEL[f] ?? "?"}</span><small>${sc.name}</small>`;
const pretty = (p: Pitch) => pitchName(p).replace(/#/g, "♯").replace(/b(?=\d)|b(?=b)/g, "♭");

/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
/** 调式在滚轮里的样子：名字 + 从主音起的音级（羽调式 = 6 1 2 3 5）。 */
const scaleItem = (sc: Scale) => `<span class="sc"><b>${sc.name}</b><small>${[...sc.degs.slice(sc.home), ...sc.degs.slice(0, sc.home)].map(degLabel).join(" ")}</small></span>`;

export interface PadHost {
  state(): EditorState;
  isImpro(): boolean;                      // 「弹」（顶栏）开着 = 音键只唱不写
  accept(id: string): boolean;             // 写之前问一声：单音乐器和别的手指几乎同时按下 = false（这一下不写、不响、不亮）
  onPitch(p: Pitch, id: string): void;     // 写（或改：覆盖选中）；弹的时候不调。id = 哪根手指
  onAlter(id: string, alt: -1 | 0 | 1): void;   // 按着的这根手指滑过门槛：刚写的音（弹 = 正在响的音）升 / 降 / 还原
  onCommand(c: Command): void;
  onUnit(unit: number): void;
  onTuplet(n: 0 | 3 | 5 | 6 | 7): void;
  onInputKey(f: number): void;
  onInputScale(id: string): void;
  autoBars(): boolean;                     // 谱面按拍号自动画小节线开着没有
  staves(): number;                        // 光标所在声部几张谱表（2 = 大谱表：「⋯」里多一个「换谱表」）
  ignoredArts?(): readonly string[];
  dynHere?(): string | null;               // 光标处正生效的力度记号（符号层里亮着它；没有 = 都不亮）          // 光标所在声部台上那位不认的记号（符号层的格子标「不认」，照样能写）
  onAutoBars(on: boolean): void;
  onHide(): void;                          // 收起键盘（pad）
  onHalf(down: boolean): void;             // /2 按下 / 松开：写的音临时减半
  onStack(down: boolean): void;            // 叠 按下（锁定式，v0.10.5）：选中光标前那个音（= 改这个音）/ 再按 = 回到光标；松开不管
  canStack(): boolean;                     // 光标所在声部的乐器能叠音吗（单声乐器 = 不能，键灰掉）
  onAccShift(phase: "down" | "slide" | "up", acc: Exclude<Acc, 0>): void;   // 升降键：按下 / 滑着换 / 松开
  onInsertMark(kind: "key" | "time" | "tempo"): void;
  /** 风格记号（拍子轻重）：放在光标前那个音上、开它的小菜单。 */
  onGroove?(): void;
  /** 符号层「反复」：开谱内反复 / 跳转的小菜单（2026-10-09）。 */
  onRepeat?(): void;
  /** 符号层「谱号」/「8va」：开小菜单，插在光标处（v0.9.28）。 */
  onClefKey?(): void;
  onOttavaKey?(): void;
  onSoundDown(p: Pitch, id: string): void;   // 试听 / 弹：按下响（复音：每根手指一个声音）
  onSoundUp(id: string): void;
  onImpro(): void;                         // 「弹」开关（第一排「收起」左边）：只响不写
  /** 键底部细条提示的音域 = 现在谁在弹（2026-10-08 by Claude Opus 5.5；user「试弹的时候键盘上的音域没有跟进」）：月读 / 元音版 = 她的；乐器 = 目录里它的音域；不知道 = null 不画。不接 = 月读。 */
  hintRange?(): HintRange;
}

type Mode = "normal" | "more";   // 有选区时的移调 / 转调 / 时值不在 pad 上（2026-10-08 user「移调转调和长度以及其他的操作不要用keyboard，而是一个小的上下文菜单，键盘只做纯粹的打谱」→ 选区菜单）   // 选调 / 长短 / 音域 = 旋钮（原地滚 / 点开滚轮），不在这里

export class Pad {
  private rowShift = 0;       // 音域窗口挪过几行
  private cols = 4;           // 每行几个音（MEDO = 4）
  private rowsSetting: number | "auto" = 4;   // 默认 4 行（user「默认还是四行」）；「自动」= 按设备和屏幕剩下的高度算
  private layoutMode: "movable" | "absolute" = "absolute";   // 首调 / 绝对；默认绝对（user「键盘默认绝对布局」）
  private swipeMode: "glide" | "alter" = "glide";          // 音键上滑 = 滑到下一个键就响下一个（默认；user 2026-10-08「滚键盘的意思是手指在键盘上滑动到下一个音，不说拖动键盘」）/ 上下滑 = 这一个音升降（黏着）
  /** 符号层开着（像 iOS 键盘翻到 .?123 那一页：表情记号）。只有 caps：点「符」进来就一直留着，再点（键上写「音」）回音键
   *  （2026-10-09 user「符号键盘应该只有caps模式没有shift模式」；10-08 起是 Shift 逻辑——点一下写一个就回音键、连点两下锁住，user 那时说「符号输入也应该有capslock」）。 */
  /** 符号层开没开 = 底座在不在「符」（2026-10-10 起由宿主的模式定，src/app/workspace.ts；pad 上的「符」键摘掉了——user「键盘的模式键是不是能摘下来」）。「弹」开着 = 照样是音键。 */
  private symWanted = false;
  private get symbols(): "off" | "lock" { return this.symWanted && !this.host.isImpro() ? "lock" : "off"; }
  /** 宿主（模式）开 / 关符号层。 */
  setSymbols(on: boolean): void { if (this.symWanted === on) return; this.symWanted = on; this.render(); }
  /** 符号层现在在哪一页（pad 头那一排换成三个标签；user 2026-10-08「pad 头那一排在符号层里换成分页标签 可以」）：收起再开 / 点了记号重画都还在这一页（以前格子一重画就滚回顶上，user「切换符号键盘的时候翻页会乱」）。 */
  private symPage: SymPage = "art"; private symBuilt: SymPage | null = null;
  /** 「渐到」先点它、再点一个力度 = 这个力度从上一个力度记号渐变过来（2026-10-08 深夜，user「渐到 做」）。Shift 逻辑（2026-10-09，user「然后软键盘到时候加一个toggle渐进到的标签，这样可以快速键盘输入」）：
   *  点一下 = 下一个力度是渐到；连点两下 = 锁住（之后写的力度都是渐到，「力度」标签上挂着「渐到」）；再点 = 关。 */
  private ramp: "off" | "once" | "lock" = "off"; private rampAt = 0;
  private mode: Mode = "normal";
  private gridFor = "";
  private toolsFor = "";
  /** 正按着的音（来源 id → 五线谱位置）：手指和电脑键盘共用，pad 上对应的键按住期间一直亮。 */
  private held = new Map<string, number>();
  /** 正在音键上滑的手指（pointerId → 起点 y、当前升降、哪个键）。 */
  private swipes = new Map<number, { y0: number; alt: -1 | 0 | 1; key: HTMLElement }>();
  /** 网格上每个键（调式梯子上的第 k 级）的音高。 */
  private keys = new Map<number, Pitch>();
  /** 升降键选的是哪一种（滑着换；记住，下次按还是它）。 */
  private accSel: Exclude<Acc, 0> = 1;

  constructor(private el: HTMLElement, private host: PadHost) { this.render(); addEventListener("resize", () => this.render()); }

  private rows(): number {
    if (this.rowsSetting !== "auto") return this.rowsSetting;
    const m = KEY_METRIC[padForm()], avail = innerHeight >= innerWidth ? innerHeight * 0.45 - 110 : innerHeight - 160;
    return Math.max(4, Math.min(6, Math.floor((avail + m.gap) / (m.h + m.gap))));   // 封顶 6：再多就大半在她的音域外了
  }
  /** 音域窗口第 shift 档的范围文字「最低–最高」（user「G4也谜语人，应该是xx-xx」）。 */
  private spanText(shift: number, f: number, rows: number): string {
    const lo = this.baseAt(shift, f, rows), hi = lo + rows * this.cols - 1;
    return `${pretty(this.pitchAt(lo, f))}–${pretty(this.pitchAt(hi, f))}`;
  }
  /** 同上，画在旋钮 / 滚轮里：放得下就一行「F3–G5」；太窄就两行，下面那行是低的那头（user「也许上下两个吧，下面是lower bound」）。 */
  private spanHtml(shift: number, f: number, rows: number, narrow: boolean): string {
    if (!narrow) return this.spanText(shift, f, rows);
    const lo = this.baseAt(shift, f, rows), hi = lo + rows * this.cols - 1;
    return `<span class="rg"><span>${pretty(this.pitchAt(hi, f))}</span><span>${pretty(this.pitchAt(lo, f))}</span></span>`;
  }
  /** 音域旋钮窄到一行写不下（手机 / 桌面的窄 pad）。 */
  private rangeNarrow(): boolean { const b = this.el.querySelector<HTMLElement>(".k-range"); return !!b && b.clientWidth < NARROW; }
  private scale(): Scale { return scaleById(this.host.state().input.inputScale); }
  /** 调式梯子上第 k 级的音高（k = 0 是 do；pad 的「1=」+ 调式定）。 */
  private pitchAt(k: number, f: number): Pitch { return ladderAt(this.scale(), k, homeTonic(f), f).pitch; }
  /** 音域窗口第 shift 档时，左下那个键在调式梯子上是第几级：绝对 = 那一行从 C4（或它上面第一个调式音）起；
   *  首调 = 从主音起（小调 / 羽调式从 6 起）；中央那一行默认在中线下面一行。 */
  private baseAt(shift: number, f: number, rows: number): number {
    const sc = this.scale(), t = homeTonic(f);
    const anchor = this.layoutMode === "absolute" ? ladderFirstAtOrAbove(sc, 60, t, f) : ladderHome(sc, t, f);
    return anchor + this.cols * (shift - Math.floor((rows - 1) / 2));
  }

  /** 状态变了：结构没变就只改文字和样式（按住的键不会被重建打断）。
   *  三块各管各的：最上面一排旋钮或候选（模式 / 有没有选中变了才重建）、写字键一排（只建一次）、音键网格（调 / 音域 / 布局变了才重建）——
   *  旋钮上滑着的时候值一直在变、网格跟着重建，旋钮那个元素不动，手指不会丢。 */
  render(): void {
    const st = this.host.state(), f = inputKey(st), rows = this.rows(), form = padForm();
    const base = this.baseAt(this.rowShift, f, rows);
    const selKey = st.sel ? keyAt(tr(st), st.sel.from) : null;
    this.el.dataset.form = form; this.el.style.setProperty("--cols", String(this.cols)); this.el.style.setProperty("--rows", String(rows));   // --rows：符号层的高 = 音键那几排（几何不变，多了滚）
    if (!this.el.querySelector(".pad-grid")) {
      this.el.innerHTML = `<div class="pad-head"></div><div class="pad-tools writes">` +
        `<button class="btn" data-caret="-1" title="光标左移（${hint("left")}）">←</button>` +
        `<button class="btn" data-caret="1" title="光标右移（${hint("right")}）">→</button>` +
        `<button class="btn wk" data-cmd="rest" title="休止（${hint("rest")}）"><span>0</span><small>休止</small></button>` +
        `<button class="btn wk" data-cmd="bar" title="小节线（${hint("bar")}）"><span>|</span><small>小节线</small></button>` +
        // 呼吸放在写音那一排（user 2026-10-08「呼吸应该是我在first pass 旋律flow的时候非常高频会用到的符号」）：和符号层「演奏法」页那一格同一件事——光标前那个音后面换气，再点去掉；符号层开着也能按
        `<button class="btn wk breath" data-breath="1" title="呼吸：光标前那个音后面换一口气（月读唱到这儿换气；乐器在这儿稍微断开；连线连着也照样断开；再点一次去掉）"><span class="smufl">\uE4CE</span><small>呼吸</small></button>` +
        `<button class="btn wk accshift" data-accshift="1" title="升降（和 Shift 一样）：点一下 = 下一个音；连点两下 = 锁住，再点解开；按住写 = 按住期间。在键上上下滑换 𝄪 / ♯ / ♭ / 𝄫"><span class="ag"></span><small>升降</small></button>` +
        `<button class="btn wk stack" data-stack="1" title="叠（像 Caps Lock）：按一下 = 选中光标前那个音来改——按音键叠上 / 拿掉（最后一个拿掉 = 一样长的休止，休止上按 = 变回音）、— 长一步、⌫ 短一步、← → 换前后的音；再按一下 = 回到它后面接着写。单声乐器的声部叠不了"><span>叠</span><small>叠音</small></button>` +
        `<button class="btn wk half" data-half="1" title="减半（长短基线短一档）：点一下 = 下一个音；连点两下 = 锁住，再点解开；也可以按住写"><span>/2</span><small>减半</small></button>` +
        `<button class="btn wk" data-cmd="extend" title="拉长一份（${hint("extend")}）"><span>—</span><small>拉长</small></button>` +
        `<button class="btn" data-cmd="backspace" title="退格（${hint("backspace")}）"><svg class="ico"><use href="#backspace"/></svg></button></div>` +
        `<div class="pad-grid"></div>`;
      const w = this.el.querySelector<HTMLElement>(".writes")!;
      this.on(w, "[data-caret]", (b) => this.host.onCommand({ k: "caret", d: Number(b.dataset.caret) }));
      this.on(w, "[data-cmd]:not([data-cmd=backspace])", (b) => this.host.onCommand({ k: b.dataset.cmd } as Command));
      this.on(w, "[data-breath]", () => { this.host.onCommand({ k: "art", a: "breath" }); this.render(); });
      // 退格：按下删一个，按住 420 ms 后每 70 ms 再删一个，松手停（user「退格长按可以多删」；节奏同 WXHW src/input/soft-keyboard.ts）
      const bs = w.querySelector<HTMLElement>('[data-cmd="backspace"]')!;
      let timer = 0;
      // 符号层开着 = 符号模式的退格：只删记号，没有就往回退一步，不删音（user 2026-10-08「退格只删符号或者没符号的时候退一步，不删音符」）
      const stop = () => clearTimeout(timer), del = () => this.host.onCommand({ k: this.symbols !== "off" ? "symBackspace" : "backspace" });
      bs.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { bs.setPointerCapture(e.pointerId); } catch { /* 合成事件：没有捕获也能用 */ }
        stop(); del();
        const tick = () => { del(); timer = window.setTimeout(tick, 70); };
        timer = window.setTimeout(tick, 420);
      });
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) bs.addEventListener(t, stop);
      addEventListener("blur", stop);
      // /2：写的音减半（user「0左边加一个/2效果是按住的时候临时输入的是/2duration的音符。之前那个糊涂的想法现在看来应该这么做」
      //   →「嗯或者放在拉长左边吧，0 | /2 -」→「或者/2是类似shift，因为accessibility的issue可能按住不方便，而是和键盘shift的逻辑一样」）：
      //   点一下 = 下一个、连点两下 = 锁住、按住写 = 按住期间（逻辑在宿主 main.ts halfKey）。另一根手指按音键照常写（单音护栏不管它：它不写音）
      const half = w.querySelector<HTMLElement>("[data-half]")!, holding = new Set<number>();
      const halfUp = (e: { pointerId: number }) => { if (!holding.delete(e.pointerId)) return; if (!holding.size) this.host.onHalf(false); };
      half.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { half.setPointerCapture(e.pointerId); } catch { /* 合成事件：没有捕获也能用 */ }
        if (!holding.size) this.host.onHalf(true);
        holding.add(e.pointerId);
      });
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) half.addEventListener(t, (e) => halfUp(e as PointerEvent));
      addEventListener("blur", () => { for (const id of [...holding]) halfUp({ pointerId: id }); });
      // 叠：锁定式，按一下切一下（v0.10.5；user「叠音模式也应该只有capslock没有shift，每次都会弄错，所以不要shift模式」；逻辑在宿主 main.ts stackKey）
      const stk = w.querySelector<HTMLElement>("[data-stack]")!;
      stk.addEventListener("pointerdown", (e) => { e.preventDefault(); this.host.onStack(true); });
      // 升降键（user「以及临时升降号的shift好像你也忘了哈哈，要不就是按住是shift，然后也可以上下滑动切换## # b bb，然后按是当作shift，滑动是toggle which shift」）：
      //   按 = Shift（点一下 / 连点两下 / 按住写，逻辑在宿主 main.ts accKey）；按着上下滑过 SWIPE = 换一种（往上 = 更升），键上跟着显示
      const ak = w.querySelector<HTMLElement>("[data-accshift]")!;
      let akDrag: { pid: number; y0: number; i0: number } | null = null;
      ak.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { ak.setPointerCapture(e.pointerId); } catch { /* 合成事件 */ }
        if (akDrag) return;
        akDrag = { pid: e.pointerId, y0: e.clientY, i0: ACC_ORDER.indexOf(this.accSel) };
        this.host.onAccShift("down", this.accSel);
      });
      ak.addEventListener("pointermove", (e) => {
        if (!akDrag || e.pointerId !== akDrag.pid) return;
        const i = Math.max(0, Math.min(ACC_ORDER.length - 1, akDrag.i0 - Math.trunc((akDrag.y0 - e.clientY) / SWIPE)));   // 往上滑 = 下标变小 = 更升
        if (ACC_ORDER[i] !== this.accSel) { this.accSel = ACC_ORDER[i]; this.host.onAccShift("slide", this.accSel); this.refresh(this.host.state()); }
      });
      const akUp = (e: PointerEvent) => { if (!akDrag || e.pointerId !== akDrag.pid) return; akDrag = null; this.host.onAccShift("up", this.accSel); };
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) ak.addEventListener(t, (e) => akUp(e as PointerEvent));
    }
    const hr = this.hint(), gridSig = this.symbols !== "off" ? `symbols|${this.symPage}|${this.ramp}|${this.host.staves()}|${(this.host.ignoredArts?.() ?? []).join(",")}|${this.host.dynHere?.() ?? ""}` : `${f}|${st.input.inputScale}|${base}|${rows}x${this.cols}|${this.layoutMode}|${hr ? `${hr.lo}-${hr.hi}-${hr.who}` : "-"}`;
    if (gridSig !== this.gridFor) { if (this.symbols !== "off") this.buildSymbols(); else this.buildGrid(f, base, rows); this.gridFor = gridSig; }
    const toolSig = this.mode === "normal" ? `normal|${selKey !== null}|${this.symbols !== "off" ? `${this.symPage}|${this.ramp}` : ""}` : `${this.mode}|${selKey}|${rows}|${this.cols}|${this.rowsSetting}|${this.layoutMode}|${this.mode === "more" ? JSON.stringify(this.marksHere(st)) : ""}`;
    if (toolSig !== this.toolsFor) { this.buildHead(selKey, rows); this.toolsFor = toolSig; }
    this.refresh(st);
  }

  /** 光标处正生效的调号 / 拍号 / 速度（插记号按钮上写的就是它：插进去的默认值）。 */
  private marksHere(st: EditorState): { key: number; time: { beats: number; beatType: number }; bpm: number } {
    const at = st.sel ? st.sel.from : st.caret;
    return { key: keyAt(tr(st), at), time: timeAt(tr(st), at), bpm: tempoAt(tr(st), at) };
  }
  private cands(selKey: number | null, rows: number): string {
    const back = `<button class="btn cand" data-back="1">返回</button>`;
    const c = (attrs: string, label: string, on = false, title = "") => `<button class="btn cand${on ? " is-on" : ""}" ${attrs}${title ? ` title="${title}"` : ""}>${label}</button>`;
    switch (this.mode) {
      // 「⋯」里可以多行：插记号直接展开（user「...里面可以多行，放很多东西。所以插记号可以展开，然后应该也是用音乐符号？也许用一个加号？」）；
      // 按钮上写光标处正生效的那个（插进去的默认值），调号写「1=G」不写 ♯♭（user「+1=G才比较好懂吧，+#b只会让人觉得是加升降号」）；
      // 「+」在符号左边、小一号浅一色（user「不过加号和后面的东西也许需要分开来」→ 试过左上角角标 →「太不显眼了，能不能放在符号左边，只是字号和颜色拉开差距」）
      case "more": {
        const m = this.marksHere(this.host.state()), plus = `<span class="plus">+</span>`;
        const digits = (n: number) => [...String(n)].map((ch) => TS(Number(ch))).join("");
        return c(`data-mark="key"`, `${plus}1=${KEY_NAMES[m.key] ?? "?"}`, false, "插调号（在光标处；先填现在的，插了再改）") +
          c(`data-mark="time"`, `${plus}<span class="mg ts"><span>${digits(m.time.beats)}</span><span>${digits(m.time.beatType)}</span></span>`, false, "插拍号（在光标处；先填现在的，插了再改）") +
          c(`data-mark="tempo"`, `${plus}<span class="mg met">${QUARTER}</span><span class="eq">=${m.bpm}</span>`, false, "插速度（在光标处；先填现在的，插了再改）") +
          c(`data-autobars="1"`, "自动小节线", this.host.autoBars(), "按拍号自动画小节线（只画、不进数据）；手插的「|」= 从那里重新数，弱起 = 写完弱起的音按一下「|」") +
          (this.host.staves() === 2 ? c(`data-staff="1"`, "换谱表", false, "大谱表：刚写的音（或选中的）挪到另一张谱表；再按一次回到按音高自动分") : "") +
          c(`data-open="layout"`, "布局…", false, "几行几列、首调 / 绝对") + back;
      }
      default: return "";
    }
  }

  /** 最上面一排：1= / 长短 / 音域三个分宽度，「⋯」是右边一个小方块（user「...和左右应该宽度和高度差不多，其他的也许adaptive一些」）；
   *  「⋯」/ 移调点开后整排换成候选。（试过放 pad 最下面，user「别扭，还是放在上面吧」） */
  private buildHead(selKey: number | null, rows: number): void {
    const box = this.el.querySelector<HTMLElement>(".pad-head")!;
    box.className = `pad-head pad-tools ${this.mode === "normal" ? "knobs" : `cands m-${this.mode}`}`;
    const tabs = this.symbols !== "off" && this.mode === "normal";   // 符号层：1= / 长短 / 音域（只管音键）换成三页的标签，位置 / 大小不变
    box.innerHTML = this.mode !== "normal" ? this.cands(selKey, rows) : tabs ?
      (Object.keys(SYM_PAGES) as SymPage[]).map((pg) => `<button class="btn sym-tab${pg === this.symPage ? " is-on" : ""}" data-sympage="${pg}" title="${SYM_PAGE_TITLE[pg]}">${SYM_PAGE_NAME[pg]}${pg === "dyn" && this.ramp !== "off" ? `<small class="ramp-tag${this.ramp === "lock" ? " lock" : ""}">渐到</small>` : ""}</button>`).join("") +
      `<button class="btn impro-pad${this.host.isImpro() ? " is-on" : ""}" data-impro="1" title="弹：音键只响不写（快捷键 \`）；再点回到写">弹</button>` +
      `<button class="btn hide-pad" data-hide="1" title="收起键盘（点五线谱再弹出来）">收起</button>` +
      `<button class="btn knob k-more" data-knob="more" title="更多：布局、插记号"><span class="kl">⋯</span></button>` :
      `<button class="btn knob k-key" data-knob="key" title="1=（pad 自己的调）：按住上下滑 / 点开选（五度圈）"><span class="kl"></span><span class="kh">⇅</span></button>` +
      `<button class="btn knob k-unit" data-knob="unit" title="长短基线：按住上下滑 / 点开选（含连音）"><span class="kl"></span><span class="kh">⇅</span></button>` +
      `<button class="btn knob k-range" data-knob="range" title="音域（这块 pad 从哪个音到哪个音）：按住上下滑 / 点开选——像推一张纸，往上推 = 看下面更低的"><span class="kl"></span><span class="kh">⇅</span></button>` +
      `<button class="btn impro-pad${this.host.isImpro() ? " is-on" : ""}" data-impro="1" title="弹：音键只响不写（快捷键 \`）；再点回到写">弹</button>` +
      `<button class="btn hide-pad" data-hide="1" title="收起键盘（点五线谱再弹出来）">收起</button>` +
      `<button class="btn knob k-more" data-knob="more" title="更多：布局、插记号"><span class="kl">⋯</span></button>`;
    box.querySelectorAll<HTMLElement>("[data-knob]").forEach((b) => { b.addEventListener("pointerdown", (e) => { e.preventDefault(); this.knobDown(b, e); }); b.addEventListener("wheel", (e) => this.knobWheel(b, e), { passive: false }); });
    // 候选
    this.on(box, "[data-open]", () => { this.back(); this.openLayout(); });   // 「布局…」= 对话框（不再占 pad 头那一排：换成几排会把键盘挤变形；user 2026-10-08「要不键盘layout还是一个模态对话框，不会破坏键盘的尺寸」）
    this.on(box, "[data-mark]", (b) => { this.back(); this.host.onInsertMark(b.dataset.mark as "key" | "time" | "tempo"); });
    this.on(box, "[data-staff]", () => { this.host.onCommand({ k: "staff" }); });
    this.on(box, "[data-back]", () => this.back());
    this.on(box, "[data-impro]", () => this.host.onImpro());
    this.on(box, "[data-sympage]", (b) => { this.symPage = b.dataset.sympage as SymPage; this.render(); });
    this.on(box, "[data-hide]", () => this.host.onHide());   // 「⋯」左边的收起键盘（user「...左边加一个hide keyboard的方形小按钮」）
    this.on(box, "[data-autobars]", () => { this.host.onAutoBars(!this.host.autoBars()); this.toolsFor = ""; this.render(); });   // 开关：点了不收，钮上亮 / 灭
  }

  /** 键盘布局对话框（「⋯ → 布局…」）：行 / 列 = 加减号步进（user 2026-10-08「…优化一下，比如变成加减号」），二选一 = 分段钮。
   *  点了马上生效（对话框靠上、键盘在下面看得见），好 / 点外面 / Esc 收起。 */
  private openLayout(): void {
    document.querySelector(".offer.pad-layout")?.remove();
    const box = document.createElement("div");
    box.className = "offer pad-layout";
    const c = (attrs: string, label: string, on = false, title = "") => `<button type="button" class="btn cand${on ? " is-on" : ""}" ${attrs}${title ? ` title="${title}"` : ""}>${label}</button>`;
    const step = (k: "r" | "c", name: string, v: number, lo: number, hi: number) =>
      `<button type="button" class="btn cand lay-step" data-${k}step="-1"${v <= lo ? " disabled" : ""} title="少一${name}">−</button><span class="lay-v">${v}</span>` +
      `<button type="button" class="btn cand lay-step" data-${k}step="1"${v >= hi ? " disabled" : ""} title="多一${name}">+</button>`;
    const grp = (label: string, inner: string, title = "") => `<div class="lay-line"><span class="lay-k">${label}</span><span class="lay-grp"${title ? ` title="${title}"` : ""}>${inner}</span></div>`;
    const body = () => grp("行", step("r", "行", this.rows(), ROWS_MIN, ROWS_MAX) + c(`data-rows="auto"`, "自动", this.rowsSetting === "auto", "按屏幕高度自动定几行"), "键盘几行（高度）") +
      grp("列", step("c", "列", this.cols, COLS_MIN, COLS_MAX), "键盘几列") +
      grp("键位", c(`data-pl="movable"`, "首调", this.layoutMode === "movable", "每行从 1 起，跟着「1=」走") + c(`data-pl="absolute"`, "绝对", this.layoutMode === "absolute", "每行从 C 起（不跟着「1=」挪）")) +
      grp("滑", c(`data-swipe="glide"`, "滚键盘", this.swipeMode === "glide", "手指按着滑到下一个键 = 响下一个（写的时候一路写）") + c(`data-swipe="alter"`, "升降", this.swipeMode === "alter", "在音键上上下滑 = 这一个音升 / 降（黏着）"));
    box.innerHTML = `<div class="offer-card pad-layout-card"><div class="offer-title">键盘布局</div><div class="lay-body">${body()}</div>` +
      `<div class="offer-btns"><button type="button" class="btn primary" data-v="close">好</button></div></div>`;
    document.body.append(box);
    const lay = box.querySelector<HTMLElement>(".lay-body")!;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
    const close = () => { window.removeEventListener("keydown", esc, true); box.remove(); };
    window.addEventListener("keydown", esc, true);
    box.addEventListener("pointerdown", (e) => { if (e.target === box) { e.preventDefault(); close(); } });
    box.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button"); if (!b || b.disabled) return;
      const d = b.dataset;
      if (d.v === "close") { close(); return; }
      if (d.rstep) this.rowsSetting = Math.max(ROWS_MIN, Math.min(ROWS_MAX, this.rows() + Number(d.rstep)));
      else if (d.cstep) this.cols = Math.max(COLS_MIN, Math.min(COLS_MAX, this.cols + Number(d.cstep)));
      else if (d.rows) this.rowsSetting = "auto";
      else if (d.pl) this.layoutMode = d.pl === "absolute" ? "absolute" : "movable";
      else if (d.swipe) this.swipeMode = d.swipe === "alter" ? "alter" : "glide";
      else return;
      this.render(); lay.innerHTML = body();
    });
  }
  /** 符号层（user 2026-10-08「呼吸的话我建议就是特殊符号吧，专门的特殊符号，软键盘里面后面有一个符号模式」「速度符号调号符号也都在里面…row col 超了可以拖动滚」）：
   *  和音键一样大的格子，多了往下滚；点一个 = 做那件事，符号层留着（只有 caps，2026-10-09）。 */
  private buildSymbols(): void {
    const grid = this.el.querySelector<HTMLElement>(".pad-grid")!;
    const ign = new Set(this.host.ignoredArts?.() ?? []), dynNow = this.host.dynHere?.() ?? null;
    const cell = (id: string, big: string, label: string, title: string, state = "") => {
      const mk = id.startsWith("art:") ? id.slice(4) : id === "slur" ? "slur" : id === "swell:>" ? "swellFade" : id.startsWith("swell:") ? "swellGrow" : id.startsWith("inhale:") ? "inhale" : null, off = !!mk && ign.has(mk);   // 台上这位不认：照样能写，格子标出来（不静默失效）
      const on = id.endsWith(":on"); id = on ? id.slice(0, -3) : id;   // 力度：现在生效的那个亮着
      return `<button class="pad-key sym${mk ? " art" : ""}${off ? " ignored" : ""}${on ? " is-on" : ""}${state ? ` ${state}` : ""}" data-sym="${id}" title="${title}${off ? "（台上这位不认：写在谱上画灰，出声不受影响）" : ""}">${big}<small>${label}${off ? `<span class="ign-tag">不认</span>` : ""}</small></button>`;
    };
    const items = [
      cell("phrase", `<span class="big">。</span>`, "句号", "句号：这一句到这儿（只给「合」挪字当边界；不换气、不换行、不是小节线、不进 MusicXML）"),
      cell("art:arpeggio", `<span class="smufl">\uEAA9\uEAA9</span>`, "琶音", "琶音：光标前那个和弦（有选区 = 选中的）从低到高依次奏出（和弦左边一条波浪线）；再点一次去掉"),
      cell("art:staccato", `<span class="smufl">\uE4A2</span>`, "跳音", "跳音：光标前那个音（有选区 = 选中的）唱 / 弹得短促；再点一次去掉"),
      cell("art:ghost", `<span class="smufl">\uE0F5\uE0A4\uE0F6</span>`, "幽灵音", "幽灵音（括号符头）：光标前那个音（有选区 = 选中的）很轻、几乎听不见；音的强度只有一种：和弱化 / 次重音 / 重音 / 强音 / 突强 / 强后即弱互斥"),
      cell("art:unstress", `<span class="smufl">\uE4B8</span>`, "弱化", "弱化：光标前那个音（有选区 = 选中的）轻一点；和别的强度互斥"),
      cell("art:stress", `<span class="smufl">\uE4B6</span>`, "次重音", "次重音：比重音轻的重音（四拍子「强弱次强弱」的次强）；和别的强度互斥"),
      cell("art:accent", `<span class="smufl">\uE4A0</span>`, "重音", "重音：光标前那个音（有选区 = 选中的）加重；再点一次去掉"),
      cell("art:marcato", `<span class="smufl">\uE4AC</span>`, "强音", "强音：光标前那个音（有选区 = 选中的）比重音更重；再点一次去掉"),
      cell("art:sfz", `<span class="smufl">\uE539</span>`, "突强", "突强 sfz：光标前那个音（有选区 = 选中的）音头猛地冲一下再落回来；和重音 / 强音 / fp 互斥"),
      cell("art:fp", `<span class="smufl">\uE534</span>`, "强后即弱", "强后即弱 fp：音头 f，马上落到 p，之后的音都是 p；和重音 / 强音 / sfz 互斥"),
      cell("art:tenuto", `<span class="smufl">\uE4A4</span>`, "保持", "保持：光标前那个音（有选区 = 选中的）唱 / 弹满；再点一次去掉"),
      cell("wedge:cresc", CRESC_CELL, "渐强", "渐强 <：从光标前那个音（有选区 = 选区第一个音）起，一路渐强到这张纸里下一个力度记号；没写 = 走一档（谱上灰字标出推定的终点）；再点一次去掉"),
      cell("wedge:dim", DIM_CELL, "渐弱", "渐弱 >：从光标前那个音（有选区 = 选区第一个音）起，一路渐弱到这张纸里下一个力度记号；没写 = 走一档（谱上灰字标出推定的终点）；再点一次去掉"),
      ...(["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const).map((d) => cell(`dyn:${d}${d === dynNow ? ":on" : ""}`, `<span class="smufl">${DYN_CELL[d]}</span>`, "力度", `力度 ${d}：从光标前那个音起（有选区 = 选区开头），管到下一个力度记号；那儿已经是它 = 去掉（user 2026-10-08「mp mf 在哪里加啊」）`)),
      cell("dyn:ramp", RAMP_CELL, "渐到", "渐到：点一下 = 下一个力度从这张纸里上一个力度记号那儿一路渐变过来（谱上画虚线发夹；手写的渐强渐弱是实线）；连点两下 = 锁住，之后写的力度都是渐到；再点 = 关。不开 = 到那儿突变", this.ramp === "off" ? "" : this.ramp),
      ...(["<", ">", "<>"] as const).map((w) => cell(`swell:${w}`, SWELL_CELL[w], w === "<" ? "音内渐强" : w === ">" ? "音内渐弱" : "音内鼓起", `${w === "<" ? "音内渐强" : w === ">" ? "音内渐弱（锯齿）" : "音内鼓起（messa di voce）"}：光标前那个音（有选区 = 选中的）自己里面的起伏；和段落的渐强渐弱是两层，可以叠；再点 = 去掉`)),
      cell("slur", SLUR_CELL, "连线", "连线：光标前那个音连到下一个音（连奏、不留缝；有选区 = 选中的连起来；再点一次去掉）。同一个音上又有呼吸 = 呼吸算数：那里照样断开换气，连线照画"),
      cell("art:breath", `<span class="smufl">\uE4CE</span>`, "呼吸", "呼吸：光标前那个音后面换一口气（月读唱到这儿换气；乐器在这儿稍微断开；连线连着也照样断开；再点一次去掉）"),
      cell("inhale:soft", `<span class="glyphs"><span class="smufl">\uE4CE</span><span class="big">吸</span></span>`, "轻吸", "出声的换气（轻吸）：光标前那个音后面换气、听得见吸气声（没有呼吸记号就连逗号一起加上；再点一次 = 整个去掉）。只有点了的地方才出声，普通的呼吸记号照旧静默"),
      cell("inhale:big", `<span class="glyphs"><span class="smufl">\uE4CE</span><span class="big">深吸</span></span>`, "深吸", "出声的换气（深吸）：大口吸气、换气的空当也长一点（从前一个音末尾借时间）；再点一次 = 整个去掉"),
      cell("art:whisper", `<span class="smufl">\uE0A9</span>`, "气声", "气声（× 符头）：光标前那个音（有选区 = 选中的）不唱音高、用气声唱这个字（念白 / 耳语）；再点一次去掉。只有月读做得到，乐器上画灰"),
      cell("key", `<span class="big">1=</span>`, "调号", "插调号（在光标处；先填现在的，插了再改）"),
      cell("time", `<span class="big">4/4</span>`, "拍号", "插拍号（在光标处）"),
      cell("tempo", `<span class="glyphs"><span class="smufl">\uE1D5</span><span class="big">=</span></span>`, "速度", "插速度（在光标处）"),
      cell("clef", `<span class="smufl">\uE050</span>`, "谱号", "谱号：从光标处起换谱号（高音 / 低音 / 下加 8 / 上加 8 / 上加 15）；只管画，音高不变。每行开头的谱号也能直接点"),
      cell("ottava", `<span class="smufl">\uE511</span>`, "八度线", "八度线：从光标处起谱上画低（8va / 15ma）或画高（8vb）；有选区 = 这一段；「结束」= 到这儿收。只管画，音高不变"),
      cell("groove", `<span class="big it">风格</span>`, "拍子轻重", "风格记号：从光标前那个音起到这张纸结尾，每个音按它在小节里的位置轻一点 / 重一点（古典 / 流行 / 华尔兹 / 进行曲…点开选）；整张纸的歌手一起听，各人跟多少按乐器"),
      cell("repeat", `<span class="big">:|</span>`, "反复", "谱内反复 / 跳转：|: :|、房子 1. 2.、Segno / Coda / D.C. / D.S. / Fine…（点开选；插在光标处，挨着小节线 = 把那条改成反复的）。不跨纸；放的时候只看这张纸最上面那位歌手那一行"),
      ...(this.host.staves() === 2 ? [cell("staff", `<span class="big">⇅</span>`, "换谱表", "大谱表：这个音换到另一张谱表")] : []),
    ];
    const byId = new Map(items.map((h) => [/data-sym="([^"]+)"/.exec(h)![1], h]));
    grid.innerHTML = SYM_PAGES[this.symPage].flatMap((id) => byId.get(id) ?? []).join("");
    grid.classList.add("symbols");
    // 符号层高度钉在音键那几排（user 2026-10-08「键盘高度能不能和设置的row一样，就是几何形状不改。然后这里多出来的溢出的可以滚键盘」）：
    //   格子多了在格子里上下滚 → 按下不算数，抬手时没滚过（浏览器开始滚 = pointercancel）才做；按下照旧 preventDefault（焦点不离开谱）。
    //   分页以后一页一般放得下；放不下（行列调得很少）照旧在这一页里滚，同一页重画不滚回顶上
    const keep = this.symBuilt === this.symPage ? grid.scrollTop : 0;
    grid.scrollTop = keep; this.symBuilt = this.symPage;
    let down: { id: number; b: HTMLElement; y: number; top: number } | null = null;
    grid.querySelectorAll<HTMLElement>("[data-sym]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); down = { id: e.pointerId, b, y: e.clientY, top: grid.scrollTop }; });
      b.addEventListener("pointercancel", () => { down = null; });
      b.addEventListener("pointerup", (e) => {
        const d = down; down = null;
        if (!d || d.id !== e.pointerId || d.b !== b || Math.abs(e.clientY - d.y) > 10 || Math.abs(grid.scrollTop - d.top) > 4) return;
        act(b);
      });
    });
    const act = (b: HTMLElement) => {
      const id = b.dataset.sym!;
      if (id === "dyn:ramp") {   // 修饰键（只改下一个 / 之后的力度）：点一下 = 下一个，连点两下 = 锁，再点 = 关（同 /2、升降）
        const t = performance.now();
        this.ramp = this.ramp === "off" ? "once" : this.ramp === "once" && t - this.rampAt < 350 ? "lock" : "off"; this.rampAt = t; this.render(); return;
      }
      if (id === "key" || id === "time" || id === "tempo") this.host.onInsertMark(id);
      else if (id === "groove") this.host.onGroove?.();
      else if (id === "repeat") this.host.onRepeat?.();
      else if (id === "clef") this.host.onClefKey?.();
      else if (id === "ottava") this.host.onOttavaKey?.();
      else if (id === "staff") this.host.onCommand({ k: "staff" });
      else if (id.startsWith("art:")) this.host.onCommand({ k: "art", a: id.slice(4) as Art });
      else if (id.startsWith("inhale:")) this.host.onCommand({ k: "inhale", v: id.slice(7) as "soft" | "big" });
      else if (id === "slur") this.host.onCommand({ k: "slur" });
      else if (id.startsWith("swell:")) this.host.onCommand({ k: "swell", w: id.slice(6) as "<" | ">" | "<>" });
      else if (id.startsWith("dyn:")) { this.host.onCommand({ k: "dyn", v: id.slice(4) as "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff", ...(this.ramp !== "off" ? { ramp: true } : {}) }); if (this.ramp === "once") this.ramp = "off"; }
      else if (id === "wedge:cresc" || id === "wedge:dim") this.host.onCommand({ k: "wedge", w: id === "wedge:cresc" ? "cresc" : "dim" });
      else this.host.onCommand({ k: "phrase" });
      this.render();
    };
  }
  private hint(): HintRange { return this.host.hintRange ? this.host.hintRange() : HER_RANGE; }
  /** 音域窗口最低那个键的 MIDI（存进歌的 desk）；默认那一档 = null。 */
  rangeLow(): number | null {
    if (this.rowShift === 0) return null;
    const f = inputKey(this.host.state());
    return midiOf(this.pitchAt(this.baseAt(this.rowShift, f, this.rows()), f));
  }
  /** 开歌：按存的最低键挑最近的那一档（null = 默认那一档）。不重画（宿主接着 render）。 */
  setRangeLow(low: number | null): void {
    if (low === null) { this.rowShift = 0; return; }
    const f = inputKey(this.host.state()), rows = this.rows();
    this.rowShift = SHIFTS.reduce((best, sh) => (Math.abs(midiOf(this.pitchAt(this.baseAt(sh, f, rows), f)) - low) < Math.abs(midiOf(this.pitchAt(this.baseAt(best, f, rows), f)) - low) ? sh : best), 0);
  }
  /** 音域窗口挪到最能盖住 [lo, hi] 的那一档（重叠最多；一样多取中心最近的）。试听换了乐器时宿主调（「跟进」）；人自己拨旋钮照旧。 */
  follow(lo: number, hi: number): void {
    const f = inputKey(this.host.state()), rows = this.rows(), mid = (lo + hi) / 2;
    let best = this.rowShift, bestOv = -Infinity, bestD = Infinity;
    for (const sh of SHIFTS) {
      const k0 = this.baseAt(sh, f, rows), wlo = midiOf(this.pitchAt(k0, f)), whi = midiOf(this.pitchAt(k0 + rows * this.cols - 1, f));
      const ov = Math.min(hi, whi) - Math.max(lo, wlo), d = Math.abs((wlo + whi) / 2 - mid);
      if (ov > bestOv || (ov === bestOv && d < bestD)) { best = sh; bestOv = ov; bestD = d; }
    }
    if (best !== this.rowShift) { this.rowShift = best; this.render(); }
  }
  private buildGrid(f: number, base: number, rows: number): void {
    const cells: string[] = [], sc = this.scale(), ht = homeTonic(f), hr = this.hint();
    this.keys.clear();
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const k = base + row * this.cols + col, { pitch: p, deg, oct } = ladderAt(sc, k, ht, f), m = midiOf(p);
        const inRange = !!hr && m >= hr.lo && m <= hr.hi;
        this.keys.set(k, p);
        cells.push(`<button class="pad-key${inRange ? " hint" : ""}" data-k="${k}" title="${inRange ? hr.title ?? `${hr.who}的音域里` : ""}">` +
          `<span class="deg">${octDots(Math.max(0, oct))}<span class="num"><span class="acc"></span>${degLabel(deg)}</span>${octDots(Math.max(0, -oct))}</span><span class="abs">${pretty(p)}</span></button>`);
      }
    }
    const grid = this.el.querySelector<HTMLElement>(".pad-grid")!;
    grid.innerHTML = cells.join("");
    grid.classList.remove("symbols");
    this.swipes.clear();   // 键换了：旧键上的滑动作废（声音照常由 pointerup 停）
    // 音键：按下 = 写（或改）+ 响；弹 = 只响；松开 = 停。按着上下滑：滑 = 滚键盘（默认）走 panStart；滑 = 升降 = 过门槛这个音升 / 降（键上先显示）
    grid.querySelectorAll<HTMLElement>(".pad-key[data-k]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* 指针已经没了：照样响 */ }
        const p = this.keys.get(Number(b.dataset.k))!, id = `pad${e.pointerId}`;
        if (!this.host.isImpro() && !this.host.accept(id)) return;   // 单音乐器：同时多按只写第一个（模糊护栏在宿主）
        this.swipes.set(e.pointerId, { y0: e.clientY, alt: 0, key: b });
        this.showDown(p, id);
        if (!this.host.isImpro()) this.host.onPitch(p, id);
        this.host.onSoundDown(p, id);
        if (this.swipeMode === "glide") this.glideStart(e);
      });
      b.addEventListener("pointermove", (e) => {
        if (this.swipeMode === "glide") return;   // 滑到下一个键：在 glideStart 里
        const s = this.swipes.get(e.pointerId); if (!s) return;
        const dy = s.y0 - e.clientY, alt: -1 | 0 | 1 = dy > SWIPE ? 1 : dy < -SWIPE ? -1 : 0;
        if (alt === s.alt) return;
        s.alt = alt;
        this.host.onAlter(`pad${e.pointerId}`, alt);
        this.refresh(this.host.state());
      });
      const up = (e: PointerEvent) => { this.swipes.delete(e.pointerId); this.showUp(`pad${e.pointerId}`); this.host.onSoundUp(`pad${e.pointerId}`); };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
    });
  }

  /** 滑 = 滚键盘：手指按着不抬、滑进另一个音键 = 前一个键抬起、新键按下（钢琴上刮过去那种；写的时候一路写、弹的时候一路响）。
   *  键上有指针捕获，所以用 elementFromPoint 找手指下面的键；监听挂在 window 上。 */
  private glideStart(e: PointerEvent): void {
    const pid = e.pointerId, id = `pad${pid}`;
    let cur: HTMLElement | null = (e.target as HTMLElement).closest(".pad-key[data-k]");
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      const el = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>(".pad-key[data-k]") ?? null;
      if (!el || el === cur || !this.el.contains(el)) return;
      cur = el;
      this.swipes.delete(pid); this.showUp(id); this.host.onSoundUp(id);   // 前一个键抬起
      const p = this.keys.get(Number(el.dataset.k))!;
      if (!this.host.isImpro() && !this.host.accept(id)) return;
      this.swipes.set(pid, { y0: ev.clientY, alt: 0, key: el });
      this.showDown(p, id);
      if (!this.host.isImpro()) this.host.onPitch(p, id);
      this.host.onSoundDown(p, id);
    };
    const up = (ev: PointerEvent) => { if (ev.pointerId !== pid) return; removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }

  private refresh(st: EditorState): void {
    const q = <T extends HTMLElement>(s: string) => this.el.querySelector<T>(s);
    { // 改一个音（只选了一个 / 叠亮着；v0.10.5）：叠亮着、⌫ = 短一步、— = 长一步（user「不，我说的就是退格，不过在这个context下面可以改图标」）
      const one = singleSel(st) >= 0, stk = q("[data-stack]"), bs = q('[data-cmd="backspace"]'), ex = q('[data-cmd="extend"] small');
      stk?.classList.toggle("lock", one);
      if (bs && bs.dataset.one !== String(one)) { bs.dataset.one = String(one); bs.innerHTML = one ? `<span>−</span><small>短一步</small>` : `<svg class="ico"><use href="#backspace"/></svg>`; bs.classList.toggle("wk", one); bs.title = one ? "短一步（退格）：选中的这个音短一档，空出来的变成休止" : "退格"; }
      if (ex && ex.textContent !== (one ? "长一步" : "拉长")) ex.textContent = one ? "长一步" : "拉长";
    }
    const i = st.input, f = inputKey(st);
    const k = q(".k-key .kl");
    if (k) { const sc = this.scale(); k.innerHTML = keyLabel(f, sc); k.parentElement!.classList.toggle("stack", k.parentElement!.clientWidth < STACK); k.parentElement!.title = `1=${KEY_NAMES[f]} ${sc.name}（pad 自己的调和调式）：按住上下滑换调 / 点开选调和调式`; }
    const u = q(".k-unit .kl");
    if (u) { u.innerHTML = `<span class="smufl">${UNIT_GLYPH[i.unit]}</span>${i.tuplet ? `<sup>${i.tuplet}</sup>` : ""}`; u.parentElement!.title = `长短基线：${UNIT_NAME[i.unit]}${i.tuplet ? `（${i.tuplet} 连音）` : ""}——按住上下滑 / 点开选`; }   // 长短旋钮 = 接下来写的长短（有选区也一样：替换模式按它吃；整组改时值在选区菜单里）
    q(".impro-pad")?.classList.toggle("is-on", this.host.isImpro());   // 「弹」亮不亮（键盘快捷键 / 找人视图也会改它）
    const r = q(".k-range .kl");
    if (r) { const nr = this.rangeNarrow(); r.parentElement!.classList.toggle("narrow", nr); r.parentElement!.classList.toggle("tight", r.parentElement!.clientWidth < TIGHT); r.innerHTML = this.spanHtml(this.rowShift, f, this.rows(), nr); r.parentElement!.title = `音域 ${this.spanText(this.rowShift, f, this.rows())}：按住上下滑 / 点开选——像推一张纸，往上推 = 看下面更低的`; }
    // 电脑键盘挂着 ♯ / ♭（Shift）：音键显示升 / 降之后的样子；手指正在滑的那个键显示它自己的
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-k]").forEach((b) => {
      const sw = [...this.swipes.values()].find((s) => s.key === b), a = sw ? sw.alt : i.acc;
      const p0 = this.keys.get(Number(b.dataset.k))!, p = a ? alterBy(p0, a) : p0;
      b.querySelector(".acc")!.textContent = ACC_TEXT[a + 2];
      b.querySelector(".abs")!.textContent = pretty(p);
      b.classList.toggle("swiping", !!sw && sw.alt !== 0);
    });
    this.el.querySelector(".pad-grid")?.classList.toggle("acc-armed", !!i.acc);
    // 升降键：亮着的时候显示正在用的那个（电脑键盘 [ ] 开的也算），关着显示选好的那个；浅亮 = 下一个、深亮 = 锁住
    const ak = this.el.querySelector<HTMLElement>("[data-accshift]");
    if (ak) {
      const on = i.accMode !== "off" && i.acc !== 0;
      ak.querySelector(".ag")!.innerHTML = `<span class="smufl">${ACC_GLYPH[(on ? i.acc : this.accSel) + 2]}</span>`;
      ak.classList.toggle("once", on && i.accMode === "once"); ak.classList.toggle("lock", on && i.accMode === "lock");
    }
    const down = new Set(this.held.values());
    this.el.querySelectorAll<HTMLElement>(".pad-key[data-k]").forEach((b) => b.classList.toggle("down", down.has(midiOf(this.keys.get(Number(b.dataset.k))!))));
    const stk = this.el.querySelector<HTMLElement>("[data-stack]"); if (stk) stk.classList.toggle("off", !this.host.canStack());   // 单声乐器的声部：叠不了
    // 符号层开着 = 只写记号（user 2026-10-08「符号键盘的时候该禁用的东西都禁用」）：写音那一层的键（休止 / 小节线 / 升降 / 叠 / 减半 / 拉长）灰掉、按不动（管音键的旋钮 1= / 长短 / 音域 换成了分页标签）；
    //   ← → / 退格（符号模式的退格）/ 弹 / 收起 / ⋯ 照旧。「弹」的时候「符」灰掉（弹 = 只弹不写）
    const symOn = this.symbols !== "off";
    this.el.querySelectorAll<HTMLButtonElement>('.writes [data-cmd="rest"], .writes [data-cmd="bar"], .writes [data-cmd="extend"], .writes [data-accshift], .writes [data-stack], .writes [data-half]').forEach((b) => { b.disabled = symOn; });
  }

  private on(root: HTMLElement, sel: string, fn: (b: HTMLElement) => void): void {
    root.querySelectorAll<HTMLElement>(sel).forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); fn(b); }));
  }
  private back(): void { this.mode = "normal"; this.render(); }
  /** 选区条上的「移调」：打开和「1=」旋钮同一个候选面板（有选中时那个旋钮本来就是它）。 */

  /** 值旋钮的一串值，大的在上（升号多 / 长的 / 音域高的在上）+ 现在是第几个 + 选第 i 个（立刻生效）。 */
  private knobList(knob: string, narrow = this.rangeNarrow()): { items: string[]; index: number; title: string; set(i: number): void; loop?: boolean } {
    const st = this.host.state(), f = inputKey(st);
    if (knob === "key") {
      const K = [...KEY_CIRCLE].reverse();   // 1=F♯ … 1=C … 1=G♭
      const sc = this.scale();
      return { items: K.map((k) => keyLabel(k, sc)), index: Math.max(0, K.indexOf(f)), title: "pad 的调（五度圈）", set: (i) => this.host.onInputKey(K[i]), loop: true };
    }
    if (knob === "unit") return { items: UNITS.map((u) => `<span class="smufl">${UNIT_GLYPH[u]}</span>`), index: Math.max(0, UNITS.indexOf(st.input.unit)), title: "长短基线", set: (i) => this.host.onUnit(UNITS[i]) };
    const rows = this.rows();   // 音域：高的在上（一张纸：往上推 = 看下面更低的）
    return { items: SHIFTS.map((sh) => this.spanHtml(sh, f, rows, narrow)), index: Math.max(0, SHIFTS.indexOf(Math.max(-4, Math.min(4, this.rowShift)))), title: "音域窗口",
      set: (i) => { this.rowShift = SHIFTS[i]; this.render(); } };
  }

  /** 按下一个旋钮。「⋯」/ 移调（有选中）= 整排换成候选。值旋钮：
   *  · 按住上下滑 = 就在这一格里滚，像汽车里程表——旋钮变成一扇窗，滚轮藏在后面，窗里只露一格，滚的时候上下格从窗边滑进来；
   *    内容跟着手指走（往下拉 = 上面大的进窗）；**一次最多一格**，滑过半格值就生效；松手立刻停，不吸附、不放动画
   *    （user「in place的时候一次最多一格，这样方便快速swipe几次就是几格」）
   *    （user「我希望手指松了立刻停，不要顿一下，这是快速输入。要不还是做成in place 滑动只在窗格里面预览？」
   *     「in place滚的时候应该是原来的钮变成一个窗，滚轮藏在下面，就像汽车里程表一样」）。
   *  · 只是点一下（没滑）= 松手时展开滚轮（drum.ts）点选 / 原生滚动。 */
  /** 鼠标滚轮拨旋钮（2026-10-10 user「键盘上面那些可以滚的东西的鼠标滚轮操作也做一下」）：往下滚 = 同手指往上推一格；触控板的小 delta 攒够一格才动。 */
  private wheelAcc = new Map<string, number>();
  private knobWheel(b: HTMLElement, e: WheelEvent): void {
    const knob = b.dataset.knob!; if (knob === "more") return;
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY, acc = (this.wheelAcc.get(knob) ?? 0) + px, STEP_PX = 40;
    const steps = Math.trunc(acc / STEP_PX); this.wheelAcc.set(knob, acc - steps * STEP_PX);
    if (!steps) return;
    const v = this.knobList(knob), n = v.items.length;
    const i = v.loop ? (((v.index + steps) % n) + n) % n : Math.max(0, Math.min(n - 1, v.index + steps));
    if (i !== v.index) v.set(i);
  }
  private knobDown(b: HTMLElement, e: PointerEvent): void {
    const knob = b.dataset.knob!;
    if (knob === "more") { this.mode = "more"; this.render(); return; }
    try { b.setPointerCapture(e.pointerId); } catch { /* 指针已经没了 */ }
    const v = this.knobList(knob), n = v.items.length, pid = e.pointerId, y0 = e.clientY;
    // 环（五度圈）：滚轮两头各多摆一格（接着另一头），一格就能绕过去
    const rollItems = v.loop ? [v.items[n - 1], ...v.items, v.items[0]] : v.items, at0 = v.loop ? v.index + 1 : v.index;
    let moved = false, cur = v.index, roll: HTMLElement | null = null, H = 0;
    // 一次最多一格：窗里最多滚到下一格；滑过半格 = 下一格在窗里占了多半 = 就是它（到头了只让它稍微晃一下）
    const room = (dir: number) => (v.loop || (v.index + dir >= 0 && v.index + dir < n) ? STEP : STEP * 0.3);   // dir = -1：往下拉（上面大的进窗）；+1：往上推
    const paint = (dy: number) => {
      const off = Math.max(-room(1), Math.min(room(-1), dy));
      roll!.style.transform = `translateY(${(-at0 * STEP + off) * (H / STEP)}px)`;   // 窗里一格 = 方块那么高；手指走 STEP = 窗里滚一整格
      return Math.abs(off) >= STEP / 2 ? (v.index - Math.sign(off) + n) % n : v.index;
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      const dy = ev.clientY - y0;
      if (!moved) {
        if (Math.abs(dy) < MOVE) return;
        moved = true; H = b.clientHeight;
        roll = document.createElement("div"); roll.className = "kroll";
        roll.innerHTML = rollItems.map((h) => `<div class="kroll-i" style="height:${H}px">${h}</div>`).join("");
        b.appendChild(roll); b.classList.add("rolling");
      }
      const i = paint(dy);
      if (i !== cur) { cur = i; v.set(i); }
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      roll?.remove(); b.classList.remove("rolling");   // 松手立刻停：窗关上，旋钮上已经是新值
      if (!moved && ev.type === "pointerup") this.openDrumFor(knob, b);
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }

  /** 点一下值旋钮：在它上面展开滚轮。旋钮够宽（iPad）= 几列分旋钮的宽；太窄（iPhone）= 每列按放得下的宽来，比旋钮宽
   *  （user「如果是iphone等太窄的时候弹出来的窗可以宽一点」）。长短那根旁边并一根连音的，连音画成真的一组小蝌蚪、跟着长短变。 */
  private openDrumFor(knob: string, anchor: HTMLElement): void {
    const w = anchor.getBoundingClientRect().width;
    if (knob === "unit") {
      const st = this.host.state();
      // 宽的旋钮：两列分它的宽度（user「能不能共用原来的宽度」），连音那列占一半多一点；窄的：长短 56 + 连音 84
      const [wu, wt] = w >= 142 ? [w - Math.round(w * 0.55) - 2, Math.round(w * 0.55)] : [56, 84];   // 2 = 两列之间的缝
      const tups = (u: number) => TUP.map((n) => (n ? tupletMark(n, u) : `<span class="plain">不连</span>`));
      const h: DrumHandle = openDrum(anchor, [
        { items: UNITS.map((u) => `<span class="smufl">${UNIT_GLYPH[u]}</span>${wu >= 100 ? `<small>${UNIT_NAME[u]}</small>` : ""}`), index: Math.max(0, UNITS.indexOf(st.input.unit)), width: wu, title: "长短基线" },
        { items: tups(st.input.unit), index: Math.max(0, TUP.indexOf(st.input.tuplet)), width: wt, title: "连音" },
      ], { onChange: (c, i) => { if (c === 0) { this.host.onUnit(UNITS[i]); h.setItems(1, tups(UNITS[i])); } else this.host.onTuplet(TUP[i]); } });
      return;
    }
    if (knob === "key") {   // 两列：调（五度圈）+ 调式（user「1=F能不能也做成两个的滚轮，右边可以换调性」）
      const st = this.host.state(), K = [...KEY_CIRCLE].reverse();
      const [wk, ws] = w >= 210 ? [Math.round(w * 0.36), w - Math.round(w * 0.36) - 2] : [72, 136];
      openDrum(anchor, [
        { items: K.map((k) => `1=${KEY_NAMES[k]}`), index: Math.max(0, K.indexOf(inputKey(st))), width: wk, title: "pad 的调（五度圈）", loop: true },
        { items: SCALES.map(scaleItem), index: Math.max(0, SCALES.findIndex((x) => x.id === st.input.inputScale)), width: ws, title: "调式：pad 上排哪些音" },
      ], { onChange: (c, i) => { if (c === 0) this.host.onInputKey(K[i]); else this.host.onInputScale(SCALES[i].id); } });
      return;
    }
    const v = this.knobList(knob, false), wr = Math.max(w, 120);   // 音域：滚轮至少 120 宽，一行写得下「F♯3–G♯5」
    openDrum(anchor, [{ items: v.items, index: v.index, width: wr, title: v.title }], { onChange: (_c, i) => v.set(i) });
  }
  /** /2 的样子：once = 浅亮（下一个音减半）、lock = 深亮（锁住）。 */
  showHalf(m: "off" | "once" | "lock"): void {
    const b = this.el.querySelector<HTMLElement>("[data-half]"); if (!b) return;
    b.classList.toggle("once", m === "once"); b.classList.toggle("lock", m === "lock");
  }

  /** 某个来源（手指 / 电脑键盘的键）按下了音高 p：pad 上同音高的键亮着，直到 showUp（调式里没有这个音 = 不亮）。 */
  showDown(p: Pitch, id: string): void { this.held.set(id, midiOf(p)); this.refresh(this.host.state()); }
  showUp(id: string): void { if (this.held.delete(id)) this.refresh(this.host.state()); }
  clearHeld(): void { if (this.held.size || this.swipes.size) { this.held.clear(); this.swipes.clear(); this.refresh(this.host.state()); } }
}
