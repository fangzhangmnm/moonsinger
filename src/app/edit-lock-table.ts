// edit-lock-table.ts —— 修改锁的分类表：「锁着的时候什么能动」只此一处。created 2026-11-10 by Claude Fable 5.2
//   家族标准（家族根 ai-docs/20261108-edit-lock-standard.md 第三½节）：东西分三类——
//     内容：锁着不能动；
//     看法：锁着能动，但锁着期间对文件一个字节都不写，导出 / 复制 / 另存为跟着眼前的样子；
//     视口：不经过文档的写入口（声部的静音 / 独奏 / 隐藏、翻页、缩放、「按 C 调看」这类设备上的设置…），照常，不归这张表管。
//   user 2026-11-08：「每个 app 要给自己分类，同意，就逼出窄接口」「这些看法…你可以修，但只是说…没法保存到文件里」。
//   写歌的设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md（第八节 + 第十四节补遗）；样板 = WeebPaint src/edit-lock-table.ts。
//
// **键 = 操作的类别 = 文档写入口（src/app/document.ts D.commit）上每一步自带的 `locus.kind`**（src/score/history.ts LocusKind）。
//   没列进来的一律算内容（往拦的方向默认）。写入口、撤销重做、键盘总闸都拿类别来查这一张表，不各写各的名单。
//   保存（editor-session / home.ts 的写回）和库（@internal/store）那两层不看这张表：锁着就是一个字节都不写，没有例外。
//
// **标签不能当证据**：一个操作自己报「我是看法」，写入口放行之前还要用这里的 `verify` 核一遍——这一步除了它该动的那个地方，别的一个引用都没变。
//   说是看法、实际动了别的 = 当内容拒（设计稿 14.2 第 1 条）。
// 零依赖（只 import 类型）、纯数据 + 纯函数：node 直测（test/edit-lock.test.ts）。
import type { Song } from "../score/song.ts";
import { SONG_VIEW_KEYS, PART_VIEW_KEYS } from "../score/song-view.ts";   // 只 import 两张常量表（「这首歌怎么看」住在哪几个键），song-view.ts 本身零依赖

/** 一类「看法」。 */
export interface LookOp {
  /** 这类看法进不进文件。进 = 锁着时动过，文档就算「脏了」（脏是和上次存的样子比出来的），只是锁着期间不写；解锁之后照常存
   *  （user 11-08：「切换可见性在编辑模式里面当然是需要保存的…只是说在锁定模式的时候，你 dirty 的时候也没法写」）。 */
  readonly inFile: boolean;
  /** 这一步真的只动了这类看法吗（改之前的歌、改之后的歌）。写入口和撤销重做放行之前都问。 */
  readonly verify: (prev: Song, next: Song) => boolean;
}

/** 两首歌除了「哪几段隐藏着」之外一模一样（按引用比：歌是结构共享的，没动过的东西还是同一个对象）。完全没变也算。 */
export function sameExceptPaperHidden(a: Song, b: Song): boolean {
  if (a === b) return true;
  const ka = Object.keys(a) as (keyof Song)[], kb = Object.keys(b) as (keyof Song)[];
  if (ka.length !== kb.length) return false;
  for (const k of ka) { if (k === "papers") continue; if (!(k in b) || a[k] !== b[k]) return false; }
  if (a.papers === b.papers) return true;
  if (a.papers.length !== b.papers.length) return false;
  for (let i = 0; i < a.papers.length; i++) {
    const p = a.papers[i]! as unknown as Record<string, unknown>, q = b.papers[i]! as unknown as Record<string, unknown>;
    if (p === q) continue;
    const keys = new Set([...Object.keys(p), ...Object.keys(q)]); keys.delete("hidden");
    for (const k of keys) if (p[k] !== q[k]) return false;
  }
  return true;
}

/** 两首歌除了「这首歌怎么看」的四样（歌顶层的 notation / chordTags / viewInC + 每个声部的 chords；src/score/song-view.ts）之外一模一样。按引用比；完全没变也算。 */
export function sameExceptSongView(a: Song, b: Song): boolean { return sameModulo(a, b, { song: SONG_VIEW_KEYS, part: PART_VIEW_KEYS }); }

/** 按引用比两首歌，跳过给定的键：歌顶层的 song、每张纸的 paper、每个声部的 part。别的键（含纸 / 声部的个数、先后、id）一个都不许变。 */
function sameModulo(a: Song, b: Song, skip: { song?: readonly string[]; paper?: readonly string[]; part?: readonly string[] }): boolean {
  if (a === b) return true;
  const A = a as unknown as Record<string, unknown>, B = b as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  for (const k of skip.song ?? []) keys.delete(k);
  for (const k of keys) {
    if (A[k] === B[k]) continue;
    if (k === "papers" && skip.paper) { if (!sameList(a.papers, b.papers, skip.paper)) return false; continue; }
    if (k === "parts" && skip.part) { if (!sameList(a.parts, b.parts, skip.part)) return false; continue; }
    return false;
  }
  return true;
}
function sameList(xs: readonly object[], ys: readonly object[], skip: readonly string[]): boolean {
  if (xs.length !== ys.length) return false;
  for (let i = 0; i < xs.length; i++) {
    const p = xs[i] as Record<string, unknown>, q = ys[i] as Record<string, unknown>;
    if (p === q) continue;
    const keys = new Set([...Object.keys(p), ...Object.keys(q)]); for (const k of skip) keys.delete(k);
    for (const k of keys) if (p[k] !== q[k]) return false;
  }
  return true;
}

/** 看法的明文名单。加一类 = 这里加一行 + src/score/history.ts 的 LocusKind 加这个词 + 它的调用点带上这个类别
 *  （test/edit-lock-guard.test.mjs 钉：名单里的词必须真有写入口的调用点在用；带这个类别的调用点不许带 gesture）。 */
export const LOOK_OPS: Readonly<Record<string, LookOp>> = Object.freeze({
  // 曲段的隐藏 / 放出来（user 11-09：「曲段的隐藏和显示锁着的时候当然能解。」）：影响放哪几段、印哪几段，存在歌文件里
  paperHidden: { inFile: true, verify: sameExceptPaperHidden },
  // 这首歌怎么看（谱面分家第三刀，2026-11-11；设计稿第 3.7 节「这些设置归『看法』那一类」）：谱种 / 和弦标级数 / 按 C 调看 / 每条轨的和弦选项。存在歌文件里；
  //   锁着能切、锁着期间一个字节都不写，导出和打印跟着眼前的样子（别人的歌锁着打开、切着看、关掉，文件没动）
  songLook: { inFile: true, verify: sameExceptSongView },
});

const has = (kind: string | null | undefined): kind is string => kind != null && Object.prototype.hasOwnProperty.call(LOOK_OPS, kind);

/** 这个类别是不是看法（锁着也能做）。没给 / 没列 = 不是。 */
export function isLookOp(kind: string | null | undefined): boolean { return has(kind); }
/** 这个看法进不进文件（不是看法 → false）。 */
export function lookOpInFile(kind: string | null | undefined): boolean { return has(kind) && LOOK_OPS[kind]!.inFile; }
/** 这一步自己报的类别 → 实际按哪个类别问锁：是看法、并且核过真的只动了那类看法 = 原样；否则一律 `fallback`（内容）。 */
export function effectiveKind<K extends string>(claimed: K, fallback: K, prev: Song, next: Song, extrasChanged: boolean): K {
  if (!has(claimed)) return claimed;
  return !extrasChanged && LOOK_OPS[claimed]!.verify(prev, next) ? claimed : fallback;
}
/** 两首歌只差「看法」（表里所有进文件的看法合起来）吗。脏分成两种时用：只差看法 = looks，别的 = content。 */
export function sameModuloLooks(a: Song, b: Song): boolean { return sameModulo(a, b, { song: SONG_VIEW_KEYS, paper: ["hidden"], part: PART_VIEW_KEYS }); }   // 表里的看法合起来：曲段隐藏 + 这首歌怎么看；加了别的看法这里要跟着合
