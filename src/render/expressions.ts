// expressions.ts —— 「演奏法和表情：不显示」（施工单 7-G）的预处理：键盘「演奏法」「力度」两页上的东西不交给排版。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。user 11-11 深夜「显示里面再加一个不显示articulation和表情的选项。打印时也许会用，
//   相当于前面讨论的不overwhelm小孩和初学者。然后这样的话行高会自动降下来对吧」。
//   **不是排了之后藏起来**：在量和画之前就拿掉——音身上的演奏法 / 圆滑线 / 出声的换气在排版入口换算掉（foldExpressions，下标不变），
//   力度 / 渐强渐弱（含渐到）这两种 token 建排版单元时跳过（frame/units.ts 的 fold）。所以它们占的那几道不存在，行高自己降下来。
//   拿掉什么 = 记号表（signs.ts）里的全部：演奏法 art:*（含呼吸、气声、幽灵音、音内起伏、琶音、滚奏）、力度 dyn:*、渐强 / 渐弱、渐到；
//   再加记号表没收、在键盘「演奏法」页上的两样：圆滑线（音上的 slur）、出声的换气（音上的 inhale，跟着呼吸）。不另抄一份名单：
//   test/expressions.test.ts 核「键盘两页上的每个键都落在这里」。照旧画的：音、休止、时值、八度、升降号、歌词、小节线、连音线（时值）、反复 / 房子 / 跳转、调号、拍号、速度、风格、句号、小节号。
//   这是「显示 = 全量、不静默」（仓说明，user 11-11）的例外：不静默——第一行谱头那一行右端一行淡字「演奏法和表情：不显示」（排版的 Layout.foldHint，不印；11-12 起取代曲段控件上的「折叠 N」小标）、PDF 面板一句、改到 / 写上时轻轻说一句（宿主）。
//   只管画：播放照写的来，歌里的记号一个不动。
import type { Song, Token, NoteTok, Art } from "../score/song.ts";
import { SIGNS, type SignId } from "./signs.ts";

/** 这个演奏法在记号表里（= 不显示时拿掉）。记号表按 Art 全集建（漏一个编译不过），所以现在是全部演奏法。 */
const foldsArt = (a: Art): boolean => (`art:${a}` as SignId) in SIGNS;
/** 整个 token 不交给排版的种类（建排版单元时跳过）。 */
export const FOLDED_TOKEN_KINDS: ReadonlySet<Token["kind"]> = new Set<Token["kind"]>(["dyn", "hairpin", "pedal"]);   // 踏板也算表情（11-1，统筹 11-12）

/** 音身上去掉不显示的那些（演奏法、圆滑线、出声的换气）；没有可去的 = 原对象。 */
function stripNote(t: NoteTok): NoteTok {
  const art = t.art?.filter((a) => !foldsArt(a));
  const artChanged = !!t.art && art!.length !== t.art.length;
  if (!artChanged && !t.slur && !t.inhale) return t;
  const n: NoteTok = { ...t };
  if (artChanged) { if (art!.length) n.art = art; else delete n.art; }
  delete n.slur; delete n.inhale;
  return n;
}
/** 排版入口的换算：每条轨里音身上的演奏法 / 圆滑线 / 出声的换气去掉（token 个数、先后、下标都不变——点击框按下标对回谱）。没动的轨 / 纸原样共享。 */
export function foldExpressions(song: Song): Song {
  let changed = false;
  const papers = song.papers.map((p) => {
    let pc = false;
    const tracks: typeof p.tracks = {};
    for (const [id, toks] of Object.entries(p.tracks)) {
      let tc = false;
      const out = toks.map((t) => { if (t.kind !== "note") return t; const n = stripNote(t); if (n !== t) tc = true; return n; });
      tracks[id] = tc ? out : toks; if (tc) pc = true;
    }
    if (pc) changed = true;
    return pc ? { ...p, tracks } : p;
  });
  return changed ? { ...song, papers } : song;
}

/** 一处不显示的记号：挂在哪个 token 上 + 哪一种（说给人听用）。 */
export interface FoldedMark { tok: number; what: "dyn" | "hairpin" | "pedal" | "slur" | `art:${Art}` }
/** 一条轨里不显示的记号（每个力度字 / 渐强渐弱 / 踏板记号 / 演奏法各算一处；圆滑线一串算一处；出声的换气跟着呼吸、不另算）。 */
export function foldedMarks(tokens: readonly Token[]): FoldedMark[] {
  const out: FoldedMark[] = [];
  let inSlur = false;
  for (const t of tokens) {
    if (t.kind === "dyn" || t.kind === "hairpin" || t.kind === "pedal") { out.push({ tok: t.id, what: t.kind }); continue; }   // 踏板也算（11-1，统筹 11-12：它是表情）
    if (t.kind !== "note") continue;
    for (const a of t.art ?? []) if (foldsArt(a)) out.push({ tok: t.id, what: `art:${a}` });
    if (t.slur && !inSlur) out.push({ tok: t.id, what: "slur" });
    inSlur = !!t.slur;
  }
  return out;
}
/** 这几条轨一共折叠了几处（排版记在 PaperHit.folded：测试核数用；界面上不再写数字，user 11-12「折叠八十…又不好懂」）。 */
export const foldedCount = (tracks: readonly (readonly Token[] | undefined)[]): number => tracks.reduce((n, t) => n + (t ? foldedMarks(t).length : 0), 0);
