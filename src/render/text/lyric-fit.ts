// text/lyric-fit.ts —— 歌词让路 + 连字符摆哪：纯函数，单位一律 sp（连字符那个函数单位随宿主）。2026-11-09 by Claude Opus 5.5 从 src/render/engrave.ts 原样搬来
//   （计划书 ai-docs/20261109-plan-text-engine.md 第 1 步：搬家不改行为；让路的算法 v0.16.47 起，作者和用户原话见下面各段注释）。
import { LYRIC_MIN_SX } from "./style.ts";

export interface LyricFit { dx: number; /** 宽度倍数（乘在这一档平常的宽度上；1 = 不收）。 */ sx: number; tight: boolean }
export interface LyricItem { cx: number; w: number; hy?: boolean; /** 方块字：宽度跟整段统一（不各收各的）。 */ block?: boolean }
/** 歌词之间的缝怎么算（v0.16.48；user 11-09「空格要不要用就是零点七五个字距。就是空格本来默认就挤一点」「先把这个空格的定义是什么搞清楚，每个字每个字形把它给理清楚」）：
 *  · 字宽 w = 这个音节按字形量出来的前进宽度（含字形自带的左右留白；宿主按这一档的字号 / 平常宽度量好传进来）；
 *  · 空格 space = 这款字里空格字符「 」的前进宽度 × 0.6（默认就比正常空格紧；user「连字符和空格都可以默认省一点…只要能勉强看出节奏就行了」），中英文同一个定义；
 *  · 连字符 hyphen = 连字符「-」画出来的宽度（压到 HYPHEN_SX）+ 一个上面那种空格（两边各半个）；方块字挨着的连字符不占地方（挂在两个方块字中间本来就有的那道小缝里，user「方块字的排版最好能忽视连字符」）；
 *  · 缝跟着左右两个字里**更窄的那个**一起收（× min(f)，user「空格和最窄的邻居宽度对齐」），挤的时候**先压缝、再压字**（缝最多压到 GAP_MIN）。单位都是 sp。 */
export interface LyricGaps { space: number; hyphen: number; /** 缝再挤也至少留这么宽（sp）；没给 = GAP_FLOOR。按档的数在样式表 LYRIC_LOOK.gapFloor。 */ floor?: number }
/** 没量的时候的默认（测试 / 没有量字的宿主）：歌词字号 1.6 sp 的系统无衬线体，空格约 0.27 字宽、连字符约 0.33 字宽。 */
export const LYRIC_SPACE = 0.6, HYPHEN_SX = 0.8, GAP_MIN = 0.5;
/** 缝再挤也至少留这么宽（sp）：能看出是两个词（user「只要能勉强看出节奏就行了」；v0.16.48 第一版没有底线 = 英文连成一片「bovetheworld」）。排版器按档传（LyricGaps.floor ← LYRIC_LOOK.gapFloor）；这个是没给时的默认。 */
export const GAP_FLOOR = 0.2;
export const DEFAULT_GAPS: LyricGaps = { space: 0.27 * 1.6 * LYRIC_SPACE, hyphen: 0.33 * 1.6 * HYPHEN_SX + 0.27 * 1.6 * LYRIC_SPACE };
/** 歌词让路 = 一个小优化问题（v0.16.47；user 11-09「你能不能把他formalize成一个数学问题…不用完美最优」「规则很简单。1.位置固定，不能反过来推音符。2. 空格和最窄的邻居宽度对齐 3. 帮我想一下怎么样算跑到外面没对齐」）：
 *  变量：每个字的中心 x_i、宽度倍数 f_i ∈ [minSx, 1]（方块字 = 整段统一的 blockSx，不单收）。已知：音的位置 c_i（不动）、原宽 w_i。
 *  ① 对齐（「跑到外面」的定义）：音还在字底下（|x_i − c_i| ≤ 半宽 − 0.15）且没越过和邻居音的中点（≤ 到邻居音的一半）；短字至少能挪 0.2。
 *  ② 不叠：x_{i+1} − x_i ≥ (w_i f_i + w_{i+1} f_{i+1}) / 2 + (空格 + 有连字符时连字符的地方) × min(f_i, f_{i+1})（定义见 LyricGaps）。
 *  ③ 目标：字尽量宽（少收），一样宽时离自己的音最近。
 *  解法（够用、不求完美）：从左往右推（一条链 = 能不能放得下推一遍就知道）；推到放不下的那一串，只把这一串里能收的字一起二分到刚好放得下；
 *  收到 minSx 还放不下 = 标 tight（照写，歌词框说「挤了」）。宽度定了以后，位置 = 在「不叠、不跑出去」的范围里离自己的音最近（保序回归）。纯函数。 */
function solveLyrics(items: readonly LyricItem[], blockSx: number, minSx: number, gaps: LyricGaps, widen = true): { pos: number[]; f: number[]; tight: Set<number> } {
  const n = items.length, f = items.map((it) => (it.block ? blockSx : 1)), tight = new Set<number>();
  if (!n) return { pos: [], f, tight };
  const c = items.map((it) => it.cx);
  // 不随宽度变的先算好（性能，v0.16.69；算式和原来逐项相同 = 结果逐位相同）：字宽、到左右邻居音的一半、每道缝的底宽（空格 + 有连字符时连字符的地方）
  const w = items.map((it) => it.w), halfL = c.map((x, i) => (i > 0 ? Math.abs(c[i - 1] - x) / 2 : Infinity)), halfR = c.map((x, i) => (i < n - 1 ? Math.abs(c[i + 1] - x) / 2 : Infinity));
  const gb = items.slice(0, -1).map((it, i) => gaps.space + (it.hy && !(it.block || items[i + 1].block) ? gaps.hyphen : 0));
  const lo = (i: number) => c[i] - Math.max(0.2, Math.min((w[i] * f[i]) / 2 - 0.15, halfL[i])), hi = (i: number) => c[i] + Math.max(0.2, Math.min((w[i] * f[i]) / 2 - 0.15, halfR[i]));
  const G = new Array<number>(Math.max(0, n - 1)).fill(1), floor = gaps.floor ?? GAP_FLOOR;   // 每道缝压到几成（挤了先压它）；缝的底线
  const d = (i: number) => (w[i] * f[i] + w[i + 1] * f[i + 1]) / 2 + Math.max(floor, gb[i] * Math.min(f[i], f[i + 1]) * G[i]);
  const L = new Array<number>(n), start = new Array<number>(n);   // L = 从左推过来最靠左能放哪；start = 这一串被推着走的从哪个字开始
  const step = (i: number) => { const a = i > 0 ? L[i - 1] + d(i - 1) : -Infinity, b = lo(i); if (a > b) { L[i] = a; start[i] = start[i - 1]; } else { L[i] = b; start[i] = i; } };
  const pushFrom = (s: number, to: number) => { L[s] = lo(s); start[s] = s; for (let i = s + 1; i <= to; i++) step(i); };   // 串头 s 不被前面推（收窄只会让它更不被推）
  step(0);
  for (let i = 1; i < n; i++) {
    step(i);
    if (L[i] <= hi(i) + 1e-9) continue;
    // 放不下：这一串 [s..i] 里能收的字一起收到刚好放得下（二分 t：f_j = min(原来, t)）
    const s = start[i], keep = f.slice(s, i + 1), can = (j: number) => !items[j].block;
    { // 先压缝（缝最没意义，可读性最先牺牲）：这一串里的缝一起压到刚好放得下，最多压到 GAP_MIN
      const keepG = G.slice(s, i), fitsG = (t: number) => { for (let j = s; j < i; j++) G[j] = Math.min(keepG[j - s], t); pushFrom(s, i); for (let j = s; j <= i; j++) if (L[j] > hi(j) + 1e-9) return false; return true; };
      if (fitsG(GAP_MIN)) { let a = GAP_MIN, b = 1; for (let k = 0; k < 16 && Math.floor(a * 100) !== Math.floor(b * 100); k++) { const m = (a + b) / 2; if (fitsG(m)) a = m; else b = m; } fitsG(Math.max(GAP_MIN, Math.floor(a * 100) / 100)); continue; }
    }
    const fits = (t: number) => { for (let j = s; j <= i; j++) if (can(j)) f[j] = Math.min(keep[j - s], t); pushFrom(s, i); for (let j = s; j <= i; j++) if (L[j] > hi(j) + 1e-9) return false; return true; };
    const top = Math.max(...keep);
    if (!items.slice(s, i + 1).some((_, k) => can(s + k)) || !fits(minSx)) {   // 收到最窄也放不下：照写，最后那一对标挤
      fits(minSx); tight.add(i - 1); tight.add(i);
      L[i] = Math.min(L[i], hi(i)); continue;
    }
    // 二分到上下界落在同一个百分位就停（性能，v0.16.69）：最后取的是 a 的百分位往下取整，a ≤ 最后的 a < b，两头同一个百分位 = 结果已经定了，和跑满 20 次逐位相同
    let a = minSx, b = top; for (let k = 0; k < 20 && Math.floor(a * 100) !== Math.floor(b * 100); k++) { const m = (a + b) / 2; if (fits(m)) a = m; else b = m; }
    fits(Math.max(minSx, Math.floor(a * 100) / 100));   // 取到百分位（字宽数稳定，快照不随浮点抖）
  }
  // 放宽（v0.16.48；user「这里明显有空间没有用上」）：上面是整串一起收的，瓶颈外面本来有空的字也被压窄了——每一轮每个压着的字试着放宽 0.05，不多出新的叠就留着，直到谁都放不宽
  const clashes = (mark?: Set<number>) => { let k = 0; for (let i = 0; i < n; i++) { step(i); if (L[i] > hi(i) + 1e-9) { k += L[i] - hi(i); mark?.add(i - 1); mark?.add(i); L[i] = hi(i); } } return k; };   // 叠了多少（不是几处：已经叠着的放宽了会叠得更多）
  if (widen) {   // 先放字（字比缝要紧），字都放不宽了再放缝
    const over = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) { step(i); over[i] = Math.max(0, L[i] - hi(i)); if (over[i] > 0) L[i] = hi(i); }
    // 试改一处：只从受影响的地方往后推，推到 L 和原来一样就停（后面不会变）；叠得更多 = 撤回（性能：每次试 = 这一串的长度，不是整行）
    const tryAt = (from: number, set: () => void, undo: () => void): boolean => {
      const sL: number[] = [], sO: number[] = [], sS: number[] = [];
      set();
      let delta = 0, j = Math.max(0, from);
      for (; j < n; j++) {
        const oldL = L[j]; sL.push(oldL); sO.push(over[j]); sS.push(start[j]);
        step(j); let o = 0; if (L[j] > hi(j) + 1e-9) { o = L[j] - hi(j); L[j] = hi(j); }
        delta += o - over[j]; over[j] = o;
        if (j > from + 1 && Math.abs(L[j] - oldL) < 1e-12) { j++; break; }
      }
      if (delta <= 1e-6) return true;
      undo(); for (let k = 0; k < sL.length; k++) { L[from + k] = sL[k]; over[from + k] = sO[k]; start[from + k] = sS[k]; }
      return false;
    };
    const relax = (arr: number[], skip: (i: number) => boolean, fromOf: (i: number) => number) => {
      for (let round = 0; round < 14; round++) {
        let moved = false;
        for (let i = 0; i < arr.length; i++) {
          if (skip(i) || arr[i] >= 1) continue;
          const was = arr[i], next = Math.min(1, Math.round((was + 0.05) * 100) / 100);
          if (tryAt(fromOf(i), () => { arr[i] = next; }, () => { arr[i] = was; })) moved = true;
        }
        if (!moved) break;
      }
    };
    if (f.some((v, i) => v < 1 && !items[i].block)) relax(f, (i) => !!items[i].block, (i) => Math.max(0, i - 1));   // 字 i 变宽：影响 d(i−1)、lo / hi(i) 起
    if (G.some((v) => v < 1)) relax(G, () => false, (i) => i + 1);   // 缝 i 变宽：影响 L(i+1) 起
  }
  tight.clear(); clashes(tight); tight.delete(-1);   // 定下来的宽度再推一遍：哪几对还叠着
  // 位置：x ∈ [L, R]（R = 从右推过来最靠右能放哪），在这个范围里离自己的音最近——换成 y = x − D（D = 前面所有最小间距之和）就是保序回归
  const R = new Array<number>(n); R[n - 1] = hi(n - 1);
  for (let i = n - 2; i >= 0; i--) R[i] = Math.min(hi(i), R[i + 1] - d(i));
  const D = new Array<number>(n); D[0] = 0; for (let i = 1; i < n; i++) D[i] = D[i - 1] + d(i - 1);
  const blocks: { sum: number; cnt: number }[] = [];   // pool adjacent violators
  for (let i = 0; i < n; i++) { blocks.push({ sum: c[i] - D[i], cnt: 1 }); while (blocks.length > 1 && blocks[blocks.length - 2].sum / blocks[blocks.length - 2].cnt > blocks[blocks.length - 1].sum / blocks[blocks.length - 1].cnt) { const t = blocks.pop()!; blocks[blocks.length - 1].sum += t.sum; blocks[blocks.length - 1].cnt += t.cnt; } }
  const y: number[] = []; for (const b of blocks) for (let k = 0; k < b.cnt; k++) y.push(b.sum / b.cnt);
  const pos = y.map((v, i) => { const l = L[i] - D[i], r = Math.max(L[i], R[i]) - D[i]; return Math.min(Math.max(v, l), r) + D[i]; });
  for (let i = 1; i < n; i++) if (!tight.has(i) && pos[i] < pos[i - 1] + d(i - 1) - 1e-6) pos[i] = pos[i - 1] + d(i - 1);   // 保险：夹完之后还叠的（挤的那几对除外）往右让
  return { pos, f, tight };
}
/** 这一行的方块字至少要压到多宽才不挤（1、0.95…minSx 里取最宽的那个；压到底也救不了 = 救得最多的那个）。整段取各行里最窄的 = 整段统一的宽度。 */
export function lyricBlockSx(items: readonly LyricItem[], minSx = LYRIC_MIN_SX, gaps: LyricGaps = DEFAULT_GAPS): number {
  if (!items.some((it) => it.block)) return 1;
  const badBlocks = (t: number) => { const r = solveLyrics(items, t, minSx, gaps, false); let k = 0; for (const i of r.tight) if (items[i].block) k++; return k; };
  let best = 1, bestN = badBlocks(1);
  for (let t = 0.95; bestN && t >= minSx - 1e-9; t = Math.round((t - 0.05) * 100) / 100) { const k = badBlocks(t); if (k < bestN) { best = t; bestN = k; } }
  return best;
}
/** 歌词按节奏排的让路（v0.9.40 立；v0.16.43 整行一起缩；v0.16.44 字高不动、只收宽度；v0.16.47 改成上面那个小优化问题——见 solveLyrics）。
 *  items 按 cx 排好；blockSx = 方块字整段统一的宽度（宿主按 lyricBlockSx 对整段取最窄）；gaps = 空格 / 连字符按字形量的宽度（LyricGaps）。纯函数。 */
export function fitLyrics(items: readonly LyricItem[], blockSx = 1, minSx = LYRIC_MIN_SX, gaps: LyricGaps = DEFAULT_GAPS): LyricFit[] {
  const r = solveLyrics(items, blockSx, minSx, gaps);
  return items.map((it, i) => ({ dx: r.pos[i] - it.cx, sx: r.f[i], tight: r.tight.has(i) }));
}
/** 连字符要摆的一个音节（按谱上的先后）。x = 字的中心；hw = 让路之后的半宽、sx = 让路之后的宽度倍数（没走让路 = 都不给）；
 *  cjk = 这个音节是方块字（中日韩：旁边的连字符挂在缝里、不占地方）；row = 在哪一行（跨行的连字符挂在左边那个字后面）。单位随宿主，全用同一个就行。 */
export interface HyphenSyl { x: number; hy?: boolean; hw?: number; sx?: number; /** 没走让路时的半宽（字照原样画多宽）：只拿来找缝的正中，不按它判放不放得下。 */ nw?: number; cjk: boolean; row: number }
/** 连字符摆哪（2026-11-09 从 engrave 抽出来，行为不变）：每个带连字符的音节 → 摆的 x + 跟着压几成（hf）；null = 不画。
 *  · 和下一个音节在同一行：摆在两个字之间那道缝的正中（原来是两个中心的正中 = 贴着长的那个，user 11-09 看着像虚线）；
 *    缝放不下一个连字符 = 不画（常见打谱软件的做法；挤了才会）；方块字旁边的连字符挂在缝里、不占地方，照画；hf = 左右更窄的那个字压到几成。
 *  · 没走让路（按节奏排以外的排法）：给了 nw = 照样摆在缝的正中、但照画（这一档的音距本来就按歌词留够了）；没给 = 两个中心的正中
 *    （v0.16.78 起宿主都给：两个中心的正中 = 贴着宽的那个字，user 11-09「un -der」「dar -ling」）；· 下一个在别的行 / 没有下一个：左边那个字后面 lonely 那么远。
 *  hyphenW = 一个连字符（没压）占的宽度。下标和 syls 对齐；不带连字符的 = null。 */
export function hyphens(syls: readonly HyphenSyl[], hyphenW: number, lonely: number): ({ x: number; hf: number } | null)[] {
  return syls.map((l, n) => {
    if (!l.hy) return null;
    const r = syls[n + 1], same = !!r && r.row === l.row;
    if (!same) return { x: l.x + lonely, hf: 1 };
    if (l.hw === undefined || r.hw === undefined) return { x: (l.x + (l.hw ?? l.nw ?? 0) + r.x - (r.hw ?? r.nw ?? 0)) / 2, hf: 1 };
    const hf = Math.min(l.sx ?? 1, r.sx ?? 1), a = l.x + l.hw, b = r.x - r.hw;
    if (!(l.cjk || r.cjk) && b - a < hyphenW * hf - 1e-6) return null;
    return { x: (a + b) / 2, hf };
  });
}
