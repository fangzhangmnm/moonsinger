// history.ts —— 撤销 / 重做（纯函数）。created 2026-10-08 by Claude Fable 5.1
// 编辑器状态是纯数据、每条命令是纯函数（song.ts），所以 undo = 「每变一次，把变之前的 song / extras / 光标 / 选中存一份」——
//   和具体是什么操作无关：以后加跳音 / 力度 / 笔工具，只要照常走 update() / updateExtras()，自动在 undo 里（user 2026-10-08 两个选择里选了「先做 undo」；
//   「现在我们的操作应该是个群，只是麻烦一点」）。快照是引用（结构共享），不拷贝字节。
// 2026-10-08 上午扩到 extras（user「每一步快照带 locus 同意」「undo 同意啊」「undo 可以参考 weebpaint 的视图 vs 文件。视图会顺手捞进文件」）：
//   **判据只有「进不进文件」**——谱、休息室（选角 / 候选）、麦克风增益声像、封面都是文件内容 → 同一条栈；视图态（静音 / 独奏 / 只看、当前纸、排法）
//   是 desk（src/score/desk.ts）：存时顺手捞进文件、不标脏、不进 undo。每一步带 **locus**（在哪一块、改了什么）：undo 时视图跟着走 + toast 说明撤了什么，
//   防「多按几次静默变了没在看的纸 / 声部 / 模块」（user 2026-10-08 的顾虑）。纸 / 声部从快照的 at 里来，locus 只说模块 + 人话。
// 连续动作并成一步：拖音高 / 拖时值（gesture "drag"）、歌词框里连打（"lyric"）、推子（"mix:…"）——同一个 gesture 1.5 s 内连着来 = 同一步（留第一次之前的快照，locus 用最新的）。
// 输入状态（长短基线、升降 Shift）不进 undo；「本次输入记录」（退格撤回刚写的）在 undo 后清空（那些 token 可能已经不在了）。
import type { EditorState, Song, Focus } from "./song.ts";
import { trackOf } from "./song.ts";
import type { Extras } from "../format/project.ts";

/** 这一步改在哪一块：score = 谱（纸 / 声部看快照的 at）；lounge = 休息室（选角 / 候选 / 角色名）；studio = 录音室（麦克风）；cover = 封面；paper = 纸（加 / 删 / 隐藏）。 */
export type LocusKind = "score" | "lounge" | "studio" | "cover" | "paper";
export interface Locus { kind: LocusKind; label: string }
export interface Snap { song: Song; extras: Extras; at: Focus; caret: number; sel: { from: number; to: number } | null; locus: Locus }
export interface History { past: Snap[]; future: Snap[]; lastKey: string | null; lastAt: number }
export const LIMIT = 200, COALESCE_MS = 1500;

export const emptyHistory = (): History => ({ past: [], future: [], lastKey: null, lastAt: 0 });
export const snapOf = (st: EditorState, extras: Extras, locus: Locus): Snap => ({ song: st.song, extras, at: st.at, caret: st.caret, sel: st.sel, locus });
const applySnap = (st: EditorState, s: Snap): EditorState => ({ ...st, song: s.song, at: s.at, caret: s.caret, sel: s.sel, log: [] });

/** 记一步：prev / prevExtras = 改之前的状态；locus = 这一步改了什么。gesture 相同且 COALESCE_MS 内 = 同一个连续动作，不另记（future 照样清掉；locus 换成最新的那句话）。 */
export function record(h: History, prev: EditorState, prevExtras: Extras, gesture: string | null, now: number, locus: Locus): History {
  if (gesture && gesture === h.lastKey && now - h.lastAt < COALESCE_MS && h.past.length) {
    const last = h.past[h.past.length - 1];
    return { ...h, past: [...h.past.slice(0, -1), { ...last, locus }], future: [], lastAt: now };
  }
  const snap = snapOf(prev, prevExtras, locus);
  const past = h.past.length >= LIMIT ? [...h.past.slice(1), snap] : [...h.past, snap];
  return { past, future: [], lastKey: gesture, lastAt: now };
}
export interface Restored { h: History; st: EditorState; extras: Extras; locus: Locus }
/** 撤销：回到上一份快照；现在的状态进 future（带着同一个 locus——重做时还是这句话）。没有可撤的 = null。 */
export function undo(h: History, cur: EditorState, curExtras: Extras): Restored | null {
  if (!h.past.length) return null;
  const snap = h.past[h.past.length - 1];
  return { h: { past: h.past.slice(0, -1), future: [...h.future, snapOf(cur, curExtras, snap.locus)], lastKey: null, lastAt: 0 }, st: applySnap(cur, snap), extras: snap.extras, locus: snap.locus };
}
/** 重做。 */
export function redo(h: History, cur: EditorState, curExtras: Extras): Restored | null {
  if (!h.future.length) return null;
  const snap = h.future[h.future.length - 1];
  return { h: { past: [...h.past, snapOf(cur, curExtras, snap.locus)], future: h.future.slice(0, -1), lastKey: null, lastAt: 0 }, st: applySnap(cur, snap), extras: snap.extras, locus: snap.locus };
}

const body = (song: Song, at: Focus) => trackOf(song, at.paper, at.part).filter((t) => t.kind !== "key" && t.kind !== "time" && t.kind !== "tempo");
/** 谱的一步改了什么（人话，给 toast）：看光标所在 track 的 token 数变化；数没变再看歌名 / 作者栏 / 纸数 / 声部数；都没变 = 「改」。纯函数，便宜。 */
export function describeSongChange(prev: EditorState, next: EditorState): Locus {
  const a = prev.song, b = next.song;
  if (a.papers.length !== b.papers.length) return { kind: "paper", label: b.papers.length > a.papers.length ? "加了一张纸" : "删了一张纸" };
  if (a.parts.length !== b.parts.length) return { kind: "score", label: b.parts.length > a.parts.length ? "加了一个声部" : "删了一个声部" };
  const d = body(b, prev.at).length - body(a, prev.at).length;
  if (d > 0) return { kind: "score", label: `写了 ${d} 个` };
  if (d < 0) return { kind: "score", label: `删了 ${-d} 个` };
  if ((a.title ?? "") !== (b.title ?? "")) return { kind: "score", label: "改歌名" };
  if ((a.credits ?? "") !== (b.credits ?? "")) return { kind: "score", label: "改作者栏" };
  const pa = a.papers.find((p) => p.id === prev.at.paper), pb = b.papers.find((p) => p.id === prev.at.paper);
  if (pa && pb && !!pa.hidden !== !!pb.hidden) return { kind: "paper", label: pb.hidden ? "隐藏了这张纸" : "取消隐藏这张纸" };
  if (pa && pb && pa.name !== pb.name) return { kind: "paper", label: "改曲段名" };
  return { kind: "score", label: "改" };
}
