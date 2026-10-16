// document.ts —— 文档 = 一首歌在内存里的真相（谱的状态 st + 文件里的其余部分 extras）+ **改它的唯一入口**（commit）+ 撤销栈 + 「改过没存」基线 + 定稿的锁。
//   created 2026-10-16 by Claude Fable 5.1（远景 `ai-docs/20261013-vision-epochs-and-refactor.md` §3 ②④「编辑模型 / 全指令式唯一入口」第一刀；
//   user 2026-10-16「这个做完之后开始切doc这一刀」「远景 §3 ②④…做」；策划 = `ai-docs/20261016-document-single-entry.md`）。
//   以前（v0.12.19 及之前）main.ts 里改状态的口子有五个（update / updateExtras / updateBoth / restore / loadDoc）+ 三处直接写 `doc.extras =`，定稿的锁得在四处各补一刀；
//   现在**全部经 commit()**：锁一处判、undo 一处记、脏一处算；界面的副作用（重画 / 推进录音房 / 清单 / 标题）由宿主用 hooks 接，这里不碰 DOM、不碰持久化（node 能跑）。
//   指令式：run(Command) = apply(st, c) → commit（`src/score/commands.ts` 的那些键盘命令）；别的改动（纯函数算出 next 再 commit）以后逐个收编成 Command，入口不用再动。
import { type EditorState, type Song } from "../score/song.ts";
import { apply, type Command } from "../score/commands.ts";
import { emptyHistory, record, undo as undoH, redo as redoH, describeSongChange, type History, type Locus, type Restored } from "../score/history.ts";
import { isFinal, type Extras, type FinalRecord } from "../format/project.ts";

/** 宿主接的副作用（全是「之后」；这里先把真相换好再叫）。 */
export interface DocHooks {
  now(): number;
  /** 谱变了之后（commit 换了 st）：moved = 光标换了纸 / 声部。 */
  onState(prev: EditorState, next: EditorState, moved: boolean): void;
  /** extras 变了之后（休息室 / 录音房 / 封面 / 定稿）。 */
  onExtras(prev: Extras, next: Extras, locus: Locus): void;
  /** 被锁拒了（定稿着）：what = 改的是什么（人话）。 */
  onRefused(what: string): void;
  /** 撤销 / 重做落地之后（st / extras 已换、栈已换）：宿主让视图跟过去、说一句。 */
  onRestored(r: Restored, verb: "撤销" | "重做", prev: { st: EditorState; extras: Extras }): void;
  /** commit 之前对 song 变了的 next 做规整（纸头补力度那类；同一步、能一起撤销）。 */
  normalize?(next: EditorState): EditorState;
  /** 文件之外、但也算「改过没存」的东西的版本号（参考窗的卡）。 */
  extraDirty?(): number;
}
export interface CommitOpts {
  /** 这一步改了什么（人话；undo 时 toast）。不给 = 按谱的变化推（describeSongChange）。 */
  locus?: Locus;
  /** 连续动作并成一步（拖 / 连打 / 推子）。 */
  gesture?: string;
  /** false = 不进撤销栈（定稿 / 改稿 / 开歌时的规整）。 */
  undo?: boolean;
  /** true = 不叫宿主的 hooks（只换真相；开歌装视图态用）。 */
  silent?: boolean;
}
export type CommitResult = { ok: true; changed: boolean } | { ok: false; why: string };
/** 「上次存 / 打开时的样子」：判脏用（引用比较 + 休息室 / 录音房的 JSON）。 */
export interface SavedMark { song: Song; thumbnail: Uint8Array | null; key: string; refs: number }

export interface Document {
  readonly st: EditorState;
  readonly extras: Extras;
  readonly history: History;
  /** 定稿记录（没定稿 = null）；锁 = 它在。 */
  readonly final: FinalRecord | null;
  /** 现在为什么不能改（定稿着）；null = 能。 */
  locked(): string | null;
  /** **唯一入口**：换谱 / 换 extras / 两个一起。拒了（定稿着）= ok:false + onRefused；没变 = changed:false。 */
  commit(next: { st?: EditorState; extras?: Extras }, o?: CommitOpts): CommitResult;
  /** 指令式：一条键盘命令（src/score/commands.ts）→ commit。 */
  run(c: Command, o?: CommitOpts): CommitResult;
  undo(): boolean;
  redo(): boolean;
  /** 换歌：真相整个换掉、栈清空、脏的基线 = 现在（不叫 onState / onExtras：宿主自己按开歌的顺序重画）。 */
  load(st: EditorState, extras: Extras): void;
  /** 改过没存？ */
  dirty(): boolean;
  /** 现在这一刻的「已存」基线（encode 那一刻记下来，落盘成功再 adoptSaved）。 */
  savedMark(): SavedMark;
  adoptSaved(m: SavedMark): void;
  /** 刚存好 = 基线换成现在。 */
  markSaved(): void;
}

const LOCK_WHAT: Record<string, string> = { score: "谱 / 歌名 / 作者栏", paper: "纸", lounge: "歌手 / 乐器", studio: "混音", cover: "封面" };
/** 休息室 + 录音房 + 定稿的 JSON 键（脏比较用；字节在 extras.sounds 不在这里，每秒一次 stringify 无所谓）。 */
const extrasKey = (e: Extras): string => JSON.stringify([e.final?.at ?? null, Object.entries(e.lounge).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)), e.studio ?? null]);

export function createDocument(init: { st: EditorState; extras: Extras }, hooks: DocHooks): Document {
  let st = init.st, extras = init.extras, history = emptyHistory();
  const mark = (): SavedMark => ({ song: st.song, thumbnail: extras.thumbnail, key: extrasKey(extras), refs: hooks.extraDirty?.() ?? 0 });
  let saved: SavedMark = { song: st.song, thumbnail: extras.thumbnail, key: extrasKey(extras), refs: 0 };   // 出生那一刻不问 extraDirty（宿主的参考窗可能还没建）
  const locked = (): string | null => (isFinal(extras) ? `定稿了（第 ${extras.final!.rev} 版）` : null);
  function commit(next: { st?: EditorState; extras?: Extras }, o: CommitOpts = {}): CommitResult {
    const nextSt0 = next.st ?? st, nextEx = next.extras ?? extras;
    const songChanged = nextSt0.song !== st.song, exChanged = nextEx !== extras, stChanged = nextSt0 !== st;
    if (!stChanged && !exChanged) return { ok: true, changed: false };
    // 第 ② 层护栏（定稿）：歌 / 休息室 / 录音房 / 封面都不动；光标 / 选区 / 输入态照常；定稿 / 改稿自己（locus final）放行
    if (locked() && (songChanged || exChanged) && o.locus?.kind !== "final") {
      const what = o.locus ? LOCK_WHAT[o.locus.kind] ?? o.locus.label : LOCK_WHAT.score;
      hooks.onRefused(what);
      return { ok: false, why: `${locked()}：${what}改不了` };
    }
    const asked = nextSt0;   // 撤销提示按你做的那一下说（规整补的不算「写了几个」）
    const nextSt = songChanged && hooks.normalize ? hooks.normalize(nextSt0) : nextSt0;
    if (o.undo !== false && (songChanged || exChanged)) {
      const locus = o.locus ?? describeSongChange(st, asked.song !== st.song ? asked : nextSt);
      history = record(history, st, extras, o.gesture ?? null, hooks.now(), locus);
    }
    const prevSt = st, prevEx = extras;
    st = nextSt; extras = nextEx;
    if (!o.silent) {
      if (exChanged) hooks.onExtras(prevEx, nextEx, o.locus ?? { kind: "lounge", label: "" });
      if (nextSt !== prevSt) hooks.onState(prevSt, nextSt, nextSt.at.paper !== prevSt.at.paper || nextSt.at.part !== prevSt.at.part);
    }
    return { ok: true, changed: true };
  }
  function restore(r: Restored | null, verb: "撤销" | "重做"): boolean {
    if (!r) return false;
    const prev = { st, extras };
    history = r.h; st = r.st; extras = r.extras;
    hooks.onRestored(r, verb, prev);
    return true;
  }
  return {
    get st() { return st; }, get extras() { return extras; }, get history() { return history; }, get final() { return extras.final; },
    locked, commit,
    run: (c, o) => commit({ st: apply(st, c, hooks.now()) }, o),
    undo: () => { if (locked()) { hooks.onRefused("撤销"); return false; } return restore(undoH(history, st, extras), "撤销"); },
    redo: () => { if (locked()) { hooks.onRefused("重做"); return false; } return restore(redoH(history, st, extras), "重做"); },
    load: (s, e) => { st = s; extras = e; history = emptyHistory(); saved = mark(); },
    dirty: () => st.song !== saved.song || extras.thumbnail !== saved.thumbnail || extrasKey(extras) !== saved.key || (hooks.extraDirty?.() ?? 0) !== saved.refs,
    savedMark: mark, adoptSaved: (m) => { saved = m; }, markSaved: () => { saved = mark(); },
  };
}
