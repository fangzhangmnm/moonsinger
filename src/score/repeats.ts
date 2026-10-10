// repeats.ts —— 谱内反复 / 跳转的展开（放的时候用；纯函数）。created 2026-10-09 by Claude Opus 5.5
// user「顺便一提谱内的循环和标准的dc这种是不是支持下也不难？这个可以参考窗好了加。不然遇到弱起什么其实AAABBB不是很方便」
//   「就是普通记谱软件支持的那种。这样，不超过sheet边界。等参考窗好了当小东西加」「你先把三个小件做了」。
// 规矩：
//   · 一张纸自己的事，不跨纸；结构看这张纸最上面那位在场的歌手那一行（同速度记号，song.ts tempoOwner），别的声部按 tick 跟着切；
//     别的行里写的反复 / 跳转不起作用（谱上画灰、点开说为什么——纪律「做不到的一律画灰 + 明说」）。
//   · 照普通记谱软件的读法：|: … :| 反复（:| 可以写一共放几遍）；房子（1. 2.）第几遍走哪个；D.C. / D.S. 跳回开头 / Segno，
//     al Fine = 跳回来之后在 Fine 停，al Coda = 跳回来之后在 To Coda 去 Coda；**跳回来之后反复不再反复**（MuseScore 等的默认）；D.C. / D.S. 只跳一次。
//   · 展开 = 按段（tick 区间）切每一条 track 再接起来：段里的音照抄（第二次起换负 id，同编排重复的纸）；跳过去的地方补上那一刻生效的调号 / 拍号 / 速度 / 力度 / 风格；
//     段尾截齐、段里短了补休止（所有声部一样长）；反复小节线变回普通小节线，房子 / 跳转记号拿掉（展开完就用掉了）。
import { type Token, type PaperSeg, type Song, type NavTok, type BarTok, type NavWhat, isTimed, tempoOwner, paperTicks } from "./song.ts";

export interface Seg { t0: number; t1: number }
type Ev = { i: number; tick: number; k: "start" | "end" | "nav"; times?: number; what?: NavWhat; nums?: number[] };

/** 每个 token 前面的 tick（音 / 休止 = 起点；记号 = 它所在的位置）。 */
export function tickOf(tokens: readonly Token[]): number[] {
  const out: number[] = []; let t = 0;
  for (const x of tokens) { out.push(t); if (isTimed(x)) t += x.dur; }
  return out;
}
/** 这条 track 上有没有反复 / 跳转。 */
export const hasRepeats = (tokens: readonly Token[]): boolean => tokens.some((t) => t.kind === "nav" || (t.kind === "bar" && !!t.repeat));

/** 一条 track 的反复结构 → 放的顺序（tick 段，[t0, t1)）。没有反复 / 跳转 = null（照原样放）。len = 这张纸的长度。 */
export function playSegments(tokens: readonly Token[], len: number): Seg[] | null {
  if (!hasRepeats(tokens)) return null;
  const ticks = tickOf(tokens), ev: Ev[] = [];
  tokens.forEach((t, i) => {
    if (t.kind === "bar" && t.repeat) {
      if (t.repeat === "end" || t.repeat === "both") ev.push({ i, tick: ticks[i], k: "end", times: Math.max(2, t.times ?? 2) });
      if (t.repeat === "start" || t.repeat === "both") ev.push({ i, tick: ticks[i], k: "start" });
    } else if (t.kind === "nav") ev.push({ i, tick: ticks[i], k: "nav", what: t.what, nums: t.nums ?? [1] });
  });
  const segs: Seg[] = [];
  const emit = (a: number, b: number) => { if (b > a) segs.push({ t0: a, t1: Math.min(b, len) }); };
  const find = (pred: (e: Ev) => boolean, from = 0) => { for (let k = from; k < ev.length; k++) if (pred(ev[k])) return k; return -1; };
  const segno = find((e) => e.k === "nav" && e.what === "segno");
  // secStart / secP = 这一段反复从哪儿起（tick / 跳回去从哪个事件接着读）：最近的 |:，没有 = 纸头或上一个放完了的 :| 后面；landed = 刚跳回到的那个 |:（遍数不重来）
  let p = 0, segStart = 0, secStart = 0, secP = 0, pass = 1, jumped = false, mode: "fine" | "coda" | null = null, landed = -1, guard = 0;
  const count = new Map<number, number>();   // 每个 :|（ev 下标）已经跳回去几次
  while (p < ev.length && guard++ < 512 && segs.length < 256) {
    const e = ev[p];
    if (e.k === "start") {
      if (p !== landed) { secStart = e.tick; secP = p; pass = 1; }   // 跳回到这儿 = 还是这一段，遍数不重来
      p++; continue;
    }
    if (e.k === "end") {
      const n = count.get(p) ?? 0;
      if (!jumped && n < (e.times ?? 2) - 1) {
        count.set(p, n + 1); emit(segStart, e.tick); segStart = secStart; pass++;
        p = secP; landed = ev[secP]?.k === "start" && ev[secP].tick === secStart ? secP : -1; continue;
      }
      secStart = e.tick; secP = p + 1; pass = 1; p++; continue;   // 放够了：往后走，后面是新的一段（再遇到没有 |: 的 :| = 从这儿重来）
    }
    const w = e.what!;
    if (w === "ending") {
      if ((e.nums ?? [1]).includes(pass)) { p++; continue; }
      // 这一遍不走这个房子：跳到它的尽头——下一个 :|（那条 :| 不算）/ 下一个房子 / 下一条小节线 / 纸尾
      const close = find((x) => x.k === "end" || x.k === "start" || (x.k === "nav" && x.what === "ending"), p + 1);   // 新的 |: = 这个房子到此为止
      let to: number, np: number;
      if (close >= 0) { to = ev[close].tick; np = ev[close].k === "end" ? close + 1 : close; }
      else { const bi = tokens.findIndex((t, i) => i > e.i && t.kind === "bar"); to = bi >= 0 ? ticks[bi] : len; np = find((x) => x.tick >= to, p + 1); if (np < 0) np = ev.length; }
      emit(segStart, e.tick); segStart = to; p = np; continue;
    }
    if ((w === "dc" || w === "dcFine" || w === "dcCoda" || w === "ds" || w === "dsFine" || w === "dsCoda") && !jumped) {
      const toSegno = w.startsWith("ds");
      if (toSegno && segno < 0) { p++; continue; }   // 没有 Segno 跳不了（谱上画灰说为什么）
      emit(segStart, e.tick); jumped = true; mode = w.endsWith("Fine") ? "fine" : w.endsWith("Coda") ? "coda" : null;
      p = toSegno ? segno : 0; segStart = toSegno ? ev[segno].tick : 0; secStart = segStart; secP = p; pass = 1; landed = -1; continue;
    }
    if (w === "fine" && jumped && mode === "fine") { emit(segStart, e.tick); return segs; }
    if (w === "toCoda" && jumped && mode === "coda") {
      let c = find((x) => x.k === "nav" && x.what === "coda", p + 1); if (c < 0) c = find((x) => x.k === "nav" && x.what === "coda");
      if (c >= 0) { emit(segStart, e.tick); segStart = ev[c].tick; p = c + 1; mode = null; continue; }
    }
    p++;
  }
  emit(segStart, len);
  return segs;
}

const STATE_KINDS = new Set(["key", "time", "tempo", "dyn", "groove", "clef", "ottava"]);   // 谱号 / 八度线（v0.9.28）：跳过去也要接上那一刻的画法
/** 一条 track 按段切开再接起来（见文件头）。newId = 抄出来的给负 id。 */
export function sliceBySegments(tokens: readonly Token[], segs: readonly Seg[], newId: () => number): Token[] {
  const ticks = tickOf(tokens), out: Token[] = [], used = new Set<number>();
  const copy = <T extends Token>(t: T): T => { if (used.has(t.id)) return { ...t, id: newId() }; used.add(t.id); return t; };
  const total = tokens.reduce((a, t) => a + (isTimed(t) ? t.dur : 0), 0);
  let prevEnd = 0;
  segs.forEach((s, k) => {
    let cur = s.t0, first = true;
    const jump = k > 0 && s.t0 !== prevEnd;
    if (jump) {   // 跳过来的：补上 t0 这一刻生效的调号 / 拍号 / 速度 / 力度 / 风格（各取 t0 之前最后一个）
      const last = new Map<string, Token>();
      tokens.forEach((t, i) => { if (STATE_KINDS.has(t.kind) && ticks[i] < s.t0) last.set(t.kind, t); });
      for (const kind of ["key", "time", "tempo", "groove", "dyn", "clef", "ottava"]) { const t = last.get(kind); if (t) out.push({ ...t, id: newId() }); }
    }
    tokens.forEach((t, i) => {
      const at = ticks[i];
      if (t.kind === "nav") return;   // 房子 / 跳转：展开完就用掉了
      if (t.kind === "bar") {   // 小节线：段尾那条留着（小节从那儿重新数）；段头的——跳过来的 / 原来是反复记号的——不要（上一段结尾已经有一条；纸头的 |: 不占小节）
        if (at < s.t0 || at > s.t1 || (at === s.t0 && (k > 0 || !!t.repeat))) return;
        const b = copy(t as BarTok); const { repeat: _r, times: _t, ...plain } = b; out.push(plain); return;
      }
      const inside = at >= s.t0 && (at < s.t1 || (k === segs.length - 1 && s.t1 >= total && at === s.t1 && !isTimed(t)));   // 纸尾那一刻的记号只归最后一段
      if (!inside) return;
      if (!isTimed(t)) { out.push(copy(t)); return; }
      if (at > cur) out.push({ kind: "rest", id: newId(), dur: at - cur });
      let x = copy(t); const room = s.t1 - at;
      if (x.dur > room) x = { ...x, dur: room };   // 段尾截齐（反复记在小节线上，正常不会截到）
      if (first && jump && x.kind === "note" && x.tie) { const { tie: _t, ...rest } = x; x = rest as typeof x; }   // 跳过来的第一个音不接前面的连音线
      out.push(x); cur = at + x.dur; first = false;
    });
    if (s.t1 > cur) out.push({ kind: "rest", id: newId(), dur: s.t1 - cur });
    prevEnd = s.t1;
  });
  return out;
}

/** 一张纸按反复结构展开（放 / 压平件用）：结构看最上面那位在场的歌手；没有反复 = 原样返回。 */
export function expandPaper(song: Song, paper: PaperSeg, newId: () => number): PaperSeg {
  const owner = tempoOwner(song, paper); if (!owner) return paper;
  const segs = playSegments(paper.tracks[owner], paperTicks(paper));
  if (!segs) {   // 主人那一行没有结构：别的行里的反复记号也不起作用，但要拿掉（压平件里别画成反复）
    if (!Object.values(paper.tracks).some(hasRepeats)) return paper;
    return { ...paper, tracks: Object.fromEntries(Object.entries(paper.tracks).map(([k, t]) => [k, t.filter((x) => x.kind !== "nav").map((x) => (x.kind === "bar" && x.repeat ? { kind: "bar" as const, id: x.id } : x))])) };
  }
  return { ...paper, tracks: Object.fromEntries(Object.entries(paper.tracks).map(([k, t]) => [k, sliceBySegments(t, segs, newId)])) };
}
/** 谱上画灰用：这一行的反复 / 跳转记号起不起作用；不起 = 为什么。 */
export function navWhy(song: Song, paper: PaperSeg, partId: string, t: Token): string | null {
  if (!(t.kind === "nav" || (t.kind === "bar" && t.repeat))) return null;
  const owner = tempoOwner(song, paper);
  if (owner && owner !== partId) return "反复 / 跳转只看这张纸最上面那位歌手那一行";
  if (t.kind === "nav" && (t.what === "ds" || t.what === "dsFine" || t.what === "dsCoda") && !paper.tracks[partId]?.some((x) => x.kind === "nav" && x.what === "segno")) return "这张纸上没有 Segno，D.S. 跳不了";
  if (t.kind === "nav" && (t.what === "dcCoda" || t.what === "dsCoda") && !paper.tracks[partId]?.some((x) => x.kind === "nav" && x.what === "toCoda")) return "没有 To Coda：跳回来之后一路放到纸尾";
  return null;
}
export type { NavTok };
