// input-gate.ts —— 键盘总闸：键盘族的每一下（电脑键盘 / 触屏键盘 / MIDI 琴键）先在这里回答两件事——「这一下归谁」「现在能不能往谱上写」。
//   created 2026-11-09 by Claude Fable 5.1（交接清单 ai-docs/20261109-handoff-016-leftovers.md §3.1；总表 ai-docs/20261109-plan-016-all-in-one.md 第 1 条）。
//   user 11-09：总闸和「拔插头」（v0.16.13「弹 = 拔开的线」）是同一个功能——「我发现插头断掉的时候，你其他的一些像零啊、横杠啊这些东西还是有。所以说，其实那个拔插头的功能…没有做好」
//   「在选乐器的时候，这些拔都是得做好」「键盘还是可以即兴的…即使你被锁着，你键盘还是可以弹的，就可以跟着弹着玩」。
//   以前：「弹」只把**音键**换成只响不写（键表里 degree → audition、pad 的 noteDown），休止 / 延长 / 小节线 / 退格 / 符号格里的键照常写谱。
//
//   「能不能写」= 三个原因现算出来的一个答案，这里**不存状态**：
//     · locked    歌锁着（接 D.locked() = 修改锁锁着；文档的 lockedWhy 接的是 src/app/edit-lock.ts。定稿 2026-11-10 退役）
//     · picking   正在选乐器（乐器目录 / 乐器页开着：按键只试音）
//     · unplugged 人自己拔的（「弹」）
//   「写」的判据和文档写入口（src/app/document.ts commit）是同一条：**谱（song）变了才算写**；光标、选中、输入状态（时值旋钮、升降锁、1=、调式）不算，
//     所以「读的动作永远不问」不用列名单——挪光标 / 选中 / 复制 / 放歌 / 导出 / 试音本来就不改谱。
//   被挡下 = 安静不做 + onBlocked（宿主让「弹」钮晃一下；不弹错误、不做一半）。
//   纯模块：不碰 DOM、不 import 宿主；test/input-gate.test.ts 钉判断，test/input-gate-guard.test.mjs 守「总闸以外没有别的路从按键写谱」。
import type { EditorState } from "../score/song.ts";
import type { History, LocusKind } from "../score/history.ts";

/** 现在键盘为什么不往谱上写。 */
export type NoWrite = "locked" | "picking" | "unplugged";
export interface GateFacts { locked: boolean; picking: boolean; unplugged: boolean }
/** 三个原因合成一个答案（先后 = 说给人听时先说哪个：锁最重，其次是正在选乐器，最后才是自己拔的）。null = 能写。 */
export function noWrite(f: GateFacts): NoWrite | null { return f.locked ? "locked" : f.picking ? "picking" : f.unplugged ? "unplugged" : null; }
/** 这一下会不会改谱（和 document.ts commit 的 songChanged 同一条判据）。 */
export const writesScore = (prev: EditorState, next: EditorState): boolean => next.song !== prev.song;
/** 插头管的块 = 谱和纸（都住在 song 里）。乐器 / 混音 / 封面不归插头：键盘上的撤销撤到这几块照常（锁另算，在文档写入口）。操作类别和 D.commit 的 locus.kind 同一套词。 */
export const PLUG_LOCI: ReadonlySet<LocusKind> = new Set<LocusKind>(["score", "paper", "paperHidden"]);   // paperHidden = 2026-11-10 从 paper 里拆出来的（修改锁的「看法」），对插头来说还是纸
/** 键盘上的撤销 / 重做要动的那一步改的是哪一块（没有可撤的 = null）。 */
export function stepLocus(h: History, dir: "undo" | "redo"): LocusKind | null { const a = dir === "undo" ? h.past : h.future; return a.length ? a[a.length - 1]!.locus.kind : null; }

export interface InputGatePorts {
  /** 歌锁着吗（注入：修改锁的回答）。 */
  locked(): boolean;
  /** 正在选乐器吗（乐器目录 / 乐器页开着）。 */
  picking(): boolean;
  /** 人自己拔着吗（「弹」）。 */
  unplugged(): boolean;
  /** 被挡下了：why = 哪个原因，kind = 想改的是哪一块（以后「门闪一下」用）。不许在这里弹错误。 */
  onBlocked(why: NoWrite, kind: LocusKind): void;
}
export interface InputGate {
  /** 现在键盘为什么不往谱上写；null = 能写。「音键只响不写」也看它。 */
  why(): NoWrite | null;
  /** 键盘族的一下要把状态从 prev 换成 next：会改谱而现在不能写 = false（已经叫过 onBlocked；调用方这一下什么都别做，后面的「响一下 / 披露」也别做）。
   *  只动光标 / 选中 / 输入状态 = true。 */
  may(prev: EditorState, next: EditorState): boolean;
  /** 明知道会写的一下（叠、剪切、粘贴、符号格里开记号框 / 菜单的键）：能不能做。 */
  mayWrite(kind?: LocusKind): boolean;
  /** 键盘上的撤销 / 重做：人自己拔着、而那一步改的是谱 / 纸 = false。
   *  锁着不在这里拦（文档自己拒、自己说）；在选乐器也不拦——那时键盘上唯一的撤销是乐器页自己的快捷键，撤的是在那一页上做的事
   *  （其中动到声部的那些按「谱」登记，按块分不出来）。 */
  mayStep(h: History, dir: "undo" | "redo"): boolean;
  /** 「弹」这颗钮现在拨得动吗：锁着 / 在选乐器 = 强制拔着，接不回去。拨不动 = false（已经叫过 onBlocked）。 */
  mayToggle(): boolean;
}
export function createInputGate(p: InputGatePorts): InputGate {
  const why = (): NoWrite | null => noWrite({ locked: p.locked(), picking: p.picking(), unplugged: p.unplugged() });
  const refuse = (w: NoWrite, kind: LocusKind): false => { p.onBlocked(w, kind); return false; };
  const mayWrite = (kind: LocusKind = "score"): boolean => { const w = why(); return w ? refuse(w, kind) : true; };
  return {
    why,
    may: (prev, next) => (writesScore(prev, next) ? mayWrite("score") : true),
    mayWrite,
    mayStep: (h, dir) => {
      const w = why(), kind = stepLocus(h, dir);
      if (w !== "unplugged" || !kind || !PLUG_LOCI.has(kind)) return true;
      return refuse(w, kind);
    },
    mayToggle: () => { const f = noWrite({ locked: p.locked(), picking: p.picking(), unplugged: false }); return f ? refuse(f, "score") : true; },
  };
}

// ── 这一下按键归谁 ──────────────────────────────────────────────────────────────────────────
//   以前是 main.ts 的 keydown 监听里一长串 if（v0.16.14 才把「打字的框拿着焦点 = 键归框」提到所有分段之前；user 11-07「改名的时候没法输入空格，被播放按钮劫持了。
//   帮我系统性的查一下这反映了什么系统问题」）。先后顺序就是规矩本身，所以收成一个纯函数、一条一条能测；监听里只剩「按归属去做」。
export type KeyOwner =
  | "galleryFinder"   // 歌库上面的乐器目录（只弹着玩）：Esc 回歌库，音键 = 弹
  | "gallery"         // 歌库开着：键盘归它
  | "file"            // 存 / 另存（导出）/ 打开：不管哪一页开着、焦点在谁身上，都是这首歌的事
  | "ime"             // 输入法正在拼字（空格是选字）：不接
  | "field"           // 打字的框拿着焦点：键归框（谱自己的歌词框 / 记号框除外，它们走键表）
  | "finder"          // 乐器目录开着：Esc + 音键只弹不写
  | "inst"            // 乐器页：Esc 回谱、撤销 / 重做
  | "ref"             // 参考窗拿着焦点
  | "studioEsc"       // 混音台开着、谱上没别的可退：Esc = 回到写
  | "studio"          // 焦点在混音台里：Esc 回谱、空格放 / 停
  | "listen"          // 听：空格、Esc、存
  | "control"         // 别的表单控件（下拉框、滑块）拿着焦点：它们自己吃方向键 / 空格
  | "score";          // 谱：照键表（src/keyboard/keys.ts）路由
export interface KeyFacts {
  galleryOpen: boolean;
  /** 乐器目录那一页开着（歌库上面的 / 歌里的都算）。 */
  finderShown: boolean;
  /** 歌里的找人视图开着（finder.isOpen）。 */
  finderOpen: boolean;
  /** Ctrl / ⌘ + S / Shift+S / O，且键表认它是文件动作。 */
  fileCombo: boolean;
  composing: boolean;
  escape: boolean;
  /** Ctrl / ⌘ 按着。 */
  mod: boolean;
  /** 焦点在能打字的框里。 */
  typing: boolean;
  /** 那个框是谱自己的歌词框 / 记号框。 */
  ownField: boolean;
  /** 焦点在 SELECT / TEXTAREA / 不是 ownField 的 INPUT 上。 */
  formControl: boolean;
  instShown: boolean;
  /** 焦点在参考窗里。 */
  inRef: boolean;
  studioOpen: boolean;
  /** 焦点在混音台里。 */
  inStudio: boolean;
  /** 谱上没有别的可以用 Esc 退的（没选中、歌词框 / 记号框 / 面板都没开）。 */
  escFree: boolean;
  listen: boolean;
}
export function keyOwner(f: KeyFacts): KeyOwner {
  if (f.finderShown && f.galleryOpen) return "galleryFinder";
  if (f.galleryOpen) return "gallery";
  if (f.fileCombo) return "file";
  if (f.composing) return "ime";
  if (!f.escape && f.typing && !f.ownField) return "field";
  if (f.finderOpen) return "finder";
  if (f.instShown) return "inst";
  if (f.inRef) return "ref";
  if (f.studioOpen && f.escape && f.escFree) return "studioEsc";
  if (f.studioOpen && f.inStudio) return "studio";
  if (f.listen) return "listen";
  if (!f.mod && f.formControl) return "control";
  if (f.mod && !f.ownField && f.typing) return "field";
  return "score";
}
