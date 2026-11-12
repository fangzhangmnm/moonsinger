// arrange.ts —— 排版框架的「排」：各条轨报上来的列条目按时刻合成列 → 弹簧顶杆（spacing.ts）→ 整张纸一起挑折点 → 每行摆。
//   created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-4；设计稿 ai-docs/20261111-score-surface-architecture.md 第 3.3 节第 4 步；代码原样从 engrave.ts 搬出）。
//   纯函数：只认时刻、列的种类先后（SLOT）、每个条目往左 / 往右占多宽、管多长时值；不认字形、不认纵向。
//   「行首多宽」由调用方给（各种行的画法自己算行首要画什么，框架取大）；结果单独一张表，不改条目。
import { idealGaps, rodsOf, indexRods, placeLine, fitLine, type SpCol, type SpItem, type SpOpts } from "../spacing.ts";

/** 一条轨报上来的一个条目（= 现在五线谱的一个排版单元）。items 里的 row 是这条轨自己的道号，框架加上这条轨的道基数。 */
export interface ColEntry<R = unknown> {
  tick: number; slot: number;
  /** 固定宽的一列（小节线、调号…）占多宽；音那一列不看它。 */
  w: number;
  bar?: boolean;
  /** 音 / 休止那一种（弹簧列）：items = 往左 / 往右占多宽、管多长；span = 这一段从 tick 起占多长（判断哪里能折行）。 */
  chunk?: { items: SpItem[]; span: number };
  ref: R;
}
export interface ArrangeTrack<R = unknown> { entries: ColEntry<R>[]; laneBase: number }
/** 合成出来的一列：同一时刻、同一种东西、这条轨里同一种的第 n 个。members = 哪条轨的哪个条目（轨序 × 条目序）。 */
export interface MergedCol<R = unknown> { tick: number; slot: number; n: number; w: number; bar: boolean; chunk: boolean; members: { track: number; entry: ColEntry<R> }[] }

/** 合成列：一条轨里同一时刻同一种的第 n 个 = 第 n 列；按（时刻、先后、n）排。 */
export function mergeColumns<R>(tracks: readonly ArrangeTrack<R>[]): MergedCol<R>[] {
  const map = new Map<string, MergedCol<R>>();
  tracks.forEach((tr, t) => {
    const seen = new Map<string, number>();
    for (const e of tr.entries) {
      const base = `${e.tick}:${e.slot}`, n = seen.get(base) ?? 0; seen.set(base, n + 1);
      const key = `${base}:${n}`;
      let c = map.get(key);
      if (!c) { c = { tick: e.tick, slot: e.slot, n, w: 0, bar: false, chunk: false, members: [] }; map.set(key, c); }
      c.members.push({ track: t, entry: e }); c.w = Math.max(c.w, e.w); if (e.bar) c.bar = true; if (e.chunk) c.chunk = true;
    }
  });
  return [...map.values()].sort((a, b) => a.tick - b.tick || a.slot - b.slot || a.n - b.n);
}

export interface ArrangeOpts {
  paperLen: number; spacing: SpOpts;
  /** 一行最宽（sp）；Infinity = 横卷，不折行。 */
  width: number;
  /** 一行最多压紧多少（弹簧的比例）。 */
  squeeze: number;
  /** 一行最多拉宽到自然宽的几倍（排版参数表纸一级；Infinity = 不设上限、拉满 = 五线谱现在的样子）。到了上限就不再拉，右边空着（UX 稿第 8 节）。 */
  maxStretch: number;
  /** 一小节里一样长的音等距（顶杆顶开时整小节的弹簧一起放大，不只放大挨着的那一段；简谱 = 是，五线谱 = 否；排版参数表纸一级）。 */
  evenBars?: boolean;
  /** 最后一行很短时并进上一行（7-F；排版参数表 lastMerge）：没给 = 不并。 */
  lastMerge?: { short: number; squeeze: number };
  /** 一行最后一列不是小节线时，行尾多留多少（sp）。 */
  endPad: number;
  /** 从第 k 列开一行，行首（名字一栏 + 各种行自己的行首）多宽（sp）；first = 这张纸第一行。 */
  lineStart: (k: number, first: boolean) => number;
}
/** 排好的：每行从第几列起、行首多宽；每一列的横坐标 / 宽 / 第几行（sp，下标同 cols）。 */
export interface Arranged { lineFrom: number[]; sysStarts: number[]; xs: number[]; ws: number[]; system: number[]; /** 最后一行很短、并进了上一行（7-F）。 */ mergedLast?: true }

export function arrangeColumns<R>(cols: readonly MergedCol<R>[], tracks: readonly ArrangeTrack<R>[], o: ArrangeOpts): Arranged {
  const spCols: SpCol[] = cols.map((c) => (c.chunk ? { tick: c.tick, items: c.members.flatMap(({ track, entry }) => (entry.chunk ? entry.chunk.items.map((it) => ({ ...it, row: tracks[track]!.laneBase + it.row })) : [])) } : { tick: c.tick, fixed: c.w, items: [] }));
  // 哪些小节线列后面能折行：没有哪条轨的音跨过这一拍
  const spans = cols.flatMap((c) => c.members.flatMap(({ entry }) => (entry.chunk ? [[entry.tick, entry.tick + entry.chunk.span] as const] : [])));
  const breakableAt = (tick: number) => !spans.some(([a, b]) => a < tick - 1e-6 && b > tick + 1e-6);
  const gaps = idealGaps(spCols, o.paperLen, o.spacing), rodIx = indexRods(rodsOf(spCols, o.spacing), spCols.length), even = !!o.evenBars;
  // 折行：只在没有音跨过的小节线后折（一个小节自己一行都放不下 = 那个小节里逐列切开）；整张纸一起挑折点（像排书的 Knuth–Plass）：
  //   每行的代价 = 拉松多少（比例的平方）/ 挤紧多少（同上，挤比拉贵 4 倍；挤一挤 = 弹簧最多压 squeeze，user「「稍微超出一点的小节」压进当前行 这个就是我想要的」）+ 每行 2；
  //   最后一行不算拉松。原来是从前往后一行行塞满：小节窄了以后会出现「前面挤满、最后一行孤零零一个小节」（刀 3 样张歌第二、三段就是这样）。
  const brk = o.width, n = cols.length, lineFrom: number[] = [], sysStarts: number[] = [];
  // 这张纸最后一个音后面不占宽的列（段尾的力度、渐强渐弱：v0.7.29「不占横向」）不算这一行的宽：算宽、拉宽、压紧都当它们不在，摆完按同样的松紧接在后面。
  //   不然加一个段尾的力度（7-N「变到」放的 fff）这一行就变了：后面跟着最后那条小节线时多算一截行尾留白（fff 被单独折到下一行）；跟着音时这一行的终点按 fff 那一列算、
  //   最后一个音伸出去的那一截被藏掉（反而少折一行）。统筹 2026-11-12 裁定：力度不开占横向的口子。只管最后一个音后面的：音前面的记号属于后面那个音，照旧
  let lastChunkCol = -1; cols.forEach((c, k) => { if (c.chunk) lastChunkCol = k; });
  const effTo = (from: number, to: number) => { let t = to; while (t - 1 > from && t - 1 > lastChunkCol && !cols[t - 1]!.bar && cols[t - 1]!.w === 0) t--; return t; };
  const tail = (to: number) => (cols[to - 1]!.bar ? 0 : o.endPad);
  const lineW = (from: number, to: number, s: number) => { const t = effTo(from, to); return placeLine(spCols, gaps, rodIx, from, t, s, even).end + tail(t); };
  // 段 = 能折的地方之间的一串列
  const segs: number[] = [];   // 每一段的结尾（不含）
  for (let k = 0; k < n; k++) if (k === n - 1 || (cols[k]!.bar && breakableAt(cols[k]!.tick))) segs.push(k + 1);
  if (brk !== Infinity) {   // 一段自己一行都放不下（按非首行的宽量）：逐列切开（原来的规矩）
    const fine: number[] = []; let from = 0;
    for (const end of segs) {
      let a = from;
      while (a < end && lineW(a, end, -o.squeeze) > brk - o.lineStart(a, a === 0)) { let k = a; while (k + 1 < end && lineW(a, k + 2, -o.squeeze) <= brk - o.lineStart(a, a === 0)) k++; fine.push(k + 1); a = k + 1; }
      if (a < end) fine.push(end);
      from = end;
    }
    segs.splice(0, segs.length, ...fine);
  }
  const segStart = (i: number) => (i === 0 ? 0 : segs[i - 1]!);
  if (brk === Infinity || segs.length <= 1) lineFrom.push(0);
  else {
    const S = segs.length, best = new Array<number>(S + 1).fill(Infinity), prev = new Array<number>(S + 1).fill(-1);
    best[0] = 0;
    for (let i = 0; i < S; i++) {
      if (best[i] === Infinity) continue;
      const from = segStart(i), avail = brk - o.lineStart(from, i === 0);
      for (let j = i + 1; j <= S; j++) {
        const to = segs[j - 1]!, tight = lineW(from, to, -o.squeeze);
        if (tight > avail + 1e-6 && j > i + 1) break;   // 放不下了（只有一段时照放：上面已经切到放得下）
        const nat = lineW(from, to, 0), last = j === S;
        const cost = nat > avail ? 400 * ((nat - avail) / avail) ** 2 : last ? 0 : 100 * ((avail - nat) / avail) ** 2;
        if (best[i]! + cost + 2 < best[j]!) { best[j] = best[i]! + cost + 2; prev[j] = i; }
      }
    }
    const starts: number[] = []; for (let j = S; j > 0; j = prev[j]!) starts.push(segStart(prev[j]!));
    lineFrom.push(...starts.reverse());
  }
  // 最后一行很短（只有一小节，或者自然宽度不到行宽的 short）= 试着并进上一行（7-F）：两行的内容按更紧的 squeeze 一起均匀地压（整行的弹簧，硬下限 = 顶杆），
  //   放得下 = 并、放不下 = 照旧。只动最后两行，前面的折行不重挑（user「嗯动前两行合理，赞」）
  let mergedLast = false;
  if (brk !== Infinity && o.lastMerge && lineFrom.length >= 2) {
    const k = lineFrom.length - 1, from = lineFrom[k - 1]!, last = lineFrom[k]!, M = o.lastMerge;
    const oneBar = segs.filter((e) => e > last).length <= 1, short = oneBar || lineW(last, n, 0) < M.short * (brk - o.lineStart(last, false));
    if (short && lineW(from, n, -M.squeeze) <= brk - o.lineStart(from, from === 0) + 1e-6) { lineFrom.pop(); mergedLast = true; }
  }
  for (const k of lineFrom) sysStarts.push(o.lineStart(k, k === 0));
  const nSys = lineFrom.length, xs = new Array<number>(n).fill(0), ws = new Array<number>(n).fill(0), system = new Array<number>(n).fill(0);
  // 摆：不是最后一行、用了六成以上 = 拉满；超了（挤一挤进来的）= 压回来；别的照自然宽
  //   最后一行（v0.16.44 紧凑档试，v0.16.45 舒适档也用——user「舒适档应该也会挤」）：音距跟上一行一样松（不再挤在左边、右边空一大片——user 11-09「为什么第二行抽风了」= 最后一行十六分音符挤成一团、歌词被压）；
  //   铺过了整行宽 = 拉满。只看上一行的松紧、不看歌词，打字时前面的音照样不动（上一行折行变了才会变）。两档一样。
  let prevStretch = 0;
  for (let s = 0; s < nSys; s++) {
    const from = lineFrom[s]!, to = s + 1 < nSys ? lineFrom[s + 1]! : n; if (from >= to) continue;
    const te = effTo(from, to);   // 行尾不占宽的那几列不参加排这一行（见上）
    const avail = brk - sysStarts[s]!, nat = placeLine(spCols, gaps, rodIx, from, te, 0, even);
    const reach = nat.end > avail + 1e-6 ? avail : Math.min(avail, nat.end * o.maxStretch);   // 要拉满的行拉到哪：可用宽，但最多自然宽的 maxStretch 倍
    const sq = mergedLast && s === nSys - 1 ? o.lastMerge!.squeeze : o.squeeze;   // 并进来的那一行：允许压到更紧（7-F）
    let f: { xs: number[]; end: number; stretch?: number } = brk !== Infinity && (nat.end > avail + 1e-6 || (s !== nSys - 1 && nat.end >= avail * 0.6)) ? fitLine(spCols, gaps, rodIx, from, te, reach, { squeeze: sq, justify: true, even }) : nat;
    if (s === nSys - 1 && s > 0 && f === nat && prevStretch > 0 && brk !== Infinity) {
      const g = placeLine(spCols, gaps, rodIx, from, te, prevStretch, even);
      f = g.end <= avail + 1e-6 ? { ...g, stretch: prevStretch } : fitLine(spCols, gaps, rodIx, from, te, avail, { squeeze: o.squeeze, justify: true, even });
    }
    prevStretch = f.stretch ?? 0;
    if (te < to) f = placeLine(spCols, gaps, rodIx, from, to, f.stretch ?? 0, even);   // 同样的松紧把行尾那几列接上（前面的列位置不变：摆是从左往右一列列推的）
    for (let k = from; k < to; k++) {
      const x0 = sysStarts[s]! + f.xs[k - from]!, x1 = sysStarts[s]! + (k + 1 < to ? f.xs[k + 1 - from]! : f.end);
      xs[k] = x0; system[k] = s; ws[k] = Math.max(0, x1 - x0);
    }
  }
  return { lineFrom, sysStarts, xs, ws, system, ...(mergedLast ? { mergedLast: true as const } : {}) };
}
