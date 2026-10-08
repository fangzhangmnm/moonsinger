// history.ts —— 撤销 / 重做（纯函数）。created 2026-10-08 by Claude Fable 5.1
// 编辑器状态是纯数据、每条命令是纯函数（song.ts），所以 undo = 「song 每变一次，把变之前的 song / 光标 / 选中存一份」——
//   和具体是什么操作无关：以后加跳音 / 力度 / 笔工具，只要照常走 update()，自动在 undo 里（user 2026-10-08 两个选择里选了「先做 undo」；
//   「现在我们的操作应该是个群，只是麻烦一点」）。快照是引用（结构共享），不拷贝字节。
// 连续动作并成一步：拖音高 / 拖时值（gesture "drag"）、歌词框里连打（"lyric"）——同一个 gesture 1.5 s 内连着来 = 同一步（留第一次之前的快照）。
// 输入状态（长短基线、升降 Shift）不进 undo；「本次输入记录」（退格撤回刚写的）在 undo 后清空（那些 token 可能已经不在了）。
import type { EditorState, Song, Focus } from "./song.ts";

export interface Snap { song: Song; at: Focus; caret: number; sel: { from: number; to: number } | null }
export interface History { past: Snap[]; future: Snap[]; lastKey: string | null; lastAt: number }
export const LIMIT = 200, COALESCE_MS = 1500;

export const emptyHistory = (): History => ({ past: [], future: [], lastKey: null, lastAt: 0 });
export const snapOf = (st: EditorState): Snap => ({ song: st.song, at: st.at, caret: st.caret, sel: st.sel });
const applySnap = (st: EditorState, s: Snap): EditorState => ({ ...st, song: s.song, at: s.at, caret: s.caret, sel: s.sel, log: [] });

/** 记一步：prev = 改之前的状态。gesture 相同且 COALESCE_MS 内 = 同一个连续动作，不另记（future 照样清掉）。 */
export function record(h: History, prev: EditorState, gesture: string | null, now: number): History {
  if (gesture && gesture === h.lastKey && now - h.lastAt < COALESCE_MS) return { ...h, future: [], lastAt: now };
  const past = h.past.length >= LIMIT ? [...h.past.slice(1), snapOf(prev)] : [...h.past, snapOf(prev)];
  return { past, future: [], lastKey: gesture, lastAt: now };
}
/** 撤销：回到上一份快照；现在的状态进 future。没有可撤的 = null。 */
export function undo(h: History, cur: EditorState): { h: History; st: EditorState } | null {
  if (!h.past.length) return null;
  const snap = h.past[h.past.length - 1];
  return { h: { past: h.past.slice(0, -1), future: [...h.future, snapOf(cur)], lastKey: null, lastAt: 0 }, st: applySnap(cur, snap) };
}
/** 重做。 */
export function redo(h: History, cur: EditorState): { h: History; st: EditorState } | null {
  if (!h.future.length) return null;
  const snap = h.future[h.future.length - 1];
  return { h: { past: [...h.past, snapOf(cur)], future: h.future.slice(0, -1), lastKey: null, lastAt: 0 }, st: applySnap(cur, snap) };
}
