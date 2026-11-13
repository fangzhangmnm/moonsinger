// document.ts —— 文档 = 一首歌在内存里的真相（谱的状态 st + 文件里的其余部分 extras）+ **改它的唯一入口**（commit）+ 撤销栈 + 「改过没存」基线 + 锁的第 ②③ 道。
//   created 2026-10-16 by Claude Fable 5.1（远景 `ai-docs/20261013-vision-epochs-and-refactor.md` §3 ②④「编辑模型 / 全指令式唯一入口」第一刀；
//   user 2026-10-16「这个做完之后开始切doc这一刀」「远景 §3 ②④…做」；策划 = `ai-docs/20261016-document-single-entry.md`）。
//   以前（v0.12.19 及之前）main.ts 里改状态的口子有五个（update / updateExtras / updateBoth / restore / loadDoc）+ 三处直接写 `doc.extras =`，定稿的锁得在四处各补一刀；
//   现在**全部经 commit()**：锁一处判、undo 一处记、脏一处算；界面的副作用（重画 / 推进录音房 / 清单 / 标题）由宿主用 hooks 接，这里不碰 DOM、不碰持久化（node 能跑）。
//   指令式：run(Command) = apply(st, c) → commit（`src/score/commands.ts` 的那些键盘命令）；别的改动（纯函数算出 next 再 commit）以后逐个收编成 Command，入口不用再动。
//
// 修改锁（2026-11-10，Claude Fable 5.2；家族标准 ai-docs/20261108-edit-lock-standard.md 的第 ②③ 道；设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md 第八节 + 14.2）：
//   · 「锁着吗」不在这里答：宿主注入 `writeGate(kind)`（= src/app/edit-lock.ts）。这里只管「每一下真要改的时候带着类别去问」。
//   · 类别 = 这一步的 `locus.kind`；没带的按内容（score）问。自己报「我是看法」的，先用分类表核一遍这一步真的只动了那类看法（src/app/edit-lock-table.ts effectiveKind），核不过 = 当内容问。
//   · 看法那一步不并格（gesture 作废）：撤销栈每一格只有一种类别；撤销 / 重做按要翻的那一格的类别问同一个口，翻的是看法就能翻，翻到内容那一格就停。
//   · 脏分两种（dirtyKind）：和上次存的样子只差看法 = looks（锁着时也会有：隐藏了一段），别的 = content。存盘那几层靠它分「静静不写」和「响亮地拒」。
//   · 定稿（W-38）的锁 2026-11-10 退役（v0.16.97）：这里不再认识定稿，锁只有宿主注入的那一把。
import { _t } from "../i18n/index.ts";
import { type EditorState, type Song } from "../score/song.ts";
import { apply, type Command } from "../score/commands.ts";
import { emptyHistory, record, undo as undoH, redo as redoH, describeSongChange, type History, type Locus, type LocusKind, type Restored, type Snap } from "../score/history.ts";
import type { Extras } from "../format/project.ts";
import { effectiveKind, isLookOp, sameModuloLooks } from "./edit-lock-table.ts";

/** 宿主接的副作用（全是「之后」；这里先把真相换好再叫）。 */
export interface DocHooks {
  now(): number;
  /** 谱变了之后（commit 换了 st）：moved = 光标换了纸 / 声部。 */
  onState(prev: EditorState, next: EditorState, moved: boolean): void;
  /** extras 变了之后（休息室 / 录音房 / 封面）。 */
  onExtras(prev: Extras, next: Extras, locus: Locus): void;
  /** 被锁拒了：what = 改的是什么（人话）；kind = 按哪个类别问的锁。 */
  onRefused(what: string, kind: LocusKind): void;
  /** 撤销 / 重做落地之后（st / extras 已换、栈已换）：宿主让视图跟过去、说一句。 */
  onRestored(r: Restored, verb: string, prev: { st: EditorState; extras: Extras }): void;
  /** commit 之前对 song 变了的 next 做规整（纸头补力度那类；同一步、能一起撤销）。 */
  normalize?(next: EditorState): EditorState;
  /** 文件之外、但也算「改过没存」的东西的版本号（参考窗的卡）。 */
  extraDirty?(): number;
  /** 修改锁的写入口那一头：这一类操作此刻让不让做。null = 让；一句话 = 不让（宿主那头顺便让门闪一下）。不给 = 都让。
   *  **只在真要改的那一下问**（commit / undo / redo）；只想知道「现在锁着吗」问 lockedWhy。 */
  writeGate?(kind: LocusKind): string | null;
  /** 现在内容为什么不能改（只问、没有副作用）；null = 能。不给 = 能。 */
  lockedWhy?(): string | null;
}
export interface CommitOpts {
  /** 这一步改了什么（人话；undo 时 toast）。不给 = 按谱的变化推（describeSongChange）。 */
  locus?: Locus;
  /** 连续动作并成一步（拖 / 连打 / 推子）。类别是看法的那一步不并（见头注释）。 */
  gesture?: string;
  /** false = 不进撤销栈（开歌时的规整）。 */
  undo?: boolean;
  /** true = 不叫宿主的 hooks（只换真相；开歌装视图态用）。 */
  silent?: boolean;
}
export type CommitResult = { ok: true; changed: boolean } | { ok: false; why: string };
/** 「上次存 / 打开时的样子」：判脏用（引用比较 + 休息室 / 录音房的 JSON）。 */
export interface SavedMark { song: Song; thumbnail: Uint8Array | null; key: string; refs: number }
/** 和上次存的样子比：一样 / 只差看法（曲段隐藏）/ 内容变了。 */
export type DirtyKind = "clean" | "looks" | "content";

export interface Document {
  readonly st: EditorState;
  readonly extras: Extras;
  readonly history: History;
  /** 现在内容为什么不能改（修改锁锁着）；null = 能。只问，没有副作用。 */
  locked(): string | null;
  /** **唯一入口**：换谱 / 换 extras / 两个一起。拒了（锁着）= ok:false + onRefused；没变 = changed:false。 */
  commit(next: { st?: EditorState; extras?: Extras }, o?: CommitOpts): CommitResult;
  /** 指令式：一条键盘命令（src/score/commands.ts）→ commit。 */
  run(c: Command, o?: CommitOpts): CommitResult;
  undo(): boolean;
  redo(): boolean;
  /** 换歌：真相整个换掉、栈清空、脏的基线 = 现在（不叫 onState / onExtras：宿主自己按开歌的顺序重画）。整份装入不归锁管。 */
  load(st: EditorState, extras: Extras): void;
  /** 装入（或出生）之后有没有动过：任何一次真改了歌 / extras 的提交都算（内容、看法、歌名、作者栏、混音台…；光标、选区不算），撤销 / 重做也算。
   *  第 21 条补（v0.17.38，统筹 28858491）：「一笔没动、没有家」= 还没真正建出来——宿主拿它判断改了习惯要不要照新习惯重建（main.ts untouchedBlank，只此一处）。 */
  touched(): boolean;
  /** 改过没存？ */
  dirty(): boolean;
  /** 脏的是哪一种（见 DirtyKind）。 */
  dirtyKind(): DirtyKind;
  /** 现在这一刻的「已存」基线（encode 那一刻记下来，落盘成功再 adoptSaved）。 */
  savedMark(): SavedMark;
  adoptSaved(m: SavedMark): void;
  /** 刚存好 = 基线换成现在。 */
  markSaved(): void;
}

const LOCK_WHAT: Record<string, string> = { score: _t("谱 / 歌名 / 作者栏"), paper: _t("纸"), paperHidden: _t("纸"), lounge: _t("声部 / 乐器"), studio: _t("混音"), cover: _t("封面") };
/** 休息室 + 录音房的 JSON 键（脏比较用；字节在 extras.sounds 不在这里，每秒一次 stringify 无所谓）。 */
const extrasKey = (e: Extras): string => JSON.stringify([Object.entries(e.lounge).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)), e.studio ?? null]);

export function createDocument(init: { st: EditorState; extras: Extras }, hooks: DocHooks): Document {
  let st = init.st, extras = init.extras, history = emptyHistory();
  const mark = (): SavedMark => ({ song: st.song, thumbnail: extras.thumbnail, key: extrasKey(extras), refs: hooks.extraDirty?.() ?? 0 });
  let saved: SavedMark = { song: st.song, thumbnail: extras.thumbnail, key: extrasKey(extras), refs: 0 };   // 出生那一刻不问 extraDirty（宿主的参考窗可能还没建）
  const locked = (): string | null => hooks.lockedWhy?.() ?? null;
  let touched = false;   // 装入之后动过没有（见 Document.touched）
  /** 真要改的那一下问宿主的修改锁。 */
  const gate = (kind: LocusKind): string | null => hooks.writeGate?.(kind) ?? null;
  function commit(next: { st?: EditorState; extras?: Extras }, o: CommitOpts = {}): CommitResult {
    const nextSt0 = next.st ?? st, nextEx = next.extras ?? extras;
    const songChanged = nextSt0.song !== st.song, exChanged = nextEx !== extras, stChanged = nextSt0 !== st;
    if (!stChanged && !exChanged) return { ok: true, changed: false };
    const asked = nextSt0;   // 撤销提示按你做的那一下说（规整补的不算「写了几个」）
    const nextSt = songChanged && hooks.normalize ? hooks.normalize(nextSt0) : nextSt0;
    // 第 ② 道：歌 / 休息室 / 录音房 / 封面变了才问；光标 / 选区 / 输入态照常。按规整之后真要落下去的样子核「看法」（规整多补了东西 = 不只是看法）
    const claimed: LocusKind = o.locus?.kind ?? "score";
    const kind = effectiveKind<LocusKind>(claimed, "score", st.song, nextSt.song, exChanged);
    if (songChanged || exChanged) {
      const why = gate(kind);
      if (why) {
        const what = o.locus ? LOCK_WHAT[kind] ?? o.locus.label : LOCK_WHAT.score;
        hooks.onRefused(what, kind);
        return { ok: false, why: _t("{p}：{what}改不了", { p: why, what }) };
      }
    }
    if (o.undo !== false && (songChanged || exChanged)) {
      const locus0 = o.locus ?? describeSongChange(st, asked.song !== st.song ? asked : nextSt);
      const locus = locus0.kind === kind ? locus0 : { ...locus0, kind };   // 栈里记的类别 = 核过的那个（自称看法、其实是内容的，按内容记）
      history = record(history, st, extras, isLookOp(kind) ? null : o.gesture ?? null, hooks.now(), locus);   // 看法不并格
    }
    const prevSt = st, prevEx = extras;
    st = nextSt; extras = nextEx;
    if (songChanged || exChanged) touched = true;
    if (!o.silent) {
      if (exChanged) hooks.onExtras(prevEx, nextEx, o.locus ?? { kind: "lounge", label: "" });
      if (nextSt !== prevSt) hooks.onState(prevSt, nextSt, nextSt.at.paper !== prevSt.at.paper || nextSt.at.part !== prevSt.at.part);
    }
    return { ok: true, changed: true };
  }
  function restore(r: Restored | null, verb: string): boolean {
    if (!r) return false;
    const prev = { st, extras };
    history = r.h; st = r.st; extras = r.extras; touched = true;
    hooks.onRestored(r, verb, prev);
    return true;
  }
  /** 第 ③ 道：翻一格 = 再做一次那一步的反面，按要翻的那一格的类别问（看法要核：翻回去真的只动了那类看法）。没有可翻的 = 不问。 */
  function step(snap: Snap | undefined, verb: string, go: () => Restored | null): boolean {
    if (!snap) { if (locked()) hooks.onRefused(verb, "score"); return false; }   // 栈空着：锁着 = 让宿主闪一下门（告诉人为什么没动）
    const kind = effectiveKind<LocusKind>(snap.locus.kind, "score", st.song, snap.song, snap.extras !== extras);
    if (gate(kind)) { hooks.onRefused(verb, kind); return false; }
    return restore(go(), verb);
  }
  return {
    get st() { return st; }, get extras() { return extras; }, get history() { return history; },
    locked, commit,
    run: (c, o) => commit({ st: apply(st, c, hooks.now()) }, o),
    undo: () => step(history.past[history.past.length - 1], _t("撤销"), () => undoH(history, st, extras)),
    redo: () => step(history.future[history.future.length - 1], _t("重做"), () => redoH(history, st, extras)),
    load: (s, e) => { st = s; extras = e; history = emptyHistory(); saved = mark(); touched = false; },
    touched: () => touched,
    dirty: () => st.song !== saved.song || extras.thumbnail !== saved.thumbnail || extrasKey(extras) !== saved.key || (hooks.extraDirty?.() ?? 0) !== saved.refs,
    dirtyKind: () => {
      if (extras.thumbnail !== saved.thumbnail || extrasKey(extras) !== saved.key || (hooks.extraDirty?.() ?? 0) !== saved.refs) return "content";
      if (st.song === saved.song) return "clean";
      return sameModuloLooks(saved.song, st.song) ? "looks" : "content";
    },
    savedMark: mark, adoptSaved: (m) => { saved = m; }, markSaved: () => { saved = mark(); },
  };
}
