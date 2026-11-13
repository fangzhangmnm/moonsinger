// pedal.ts —— 踏板：「键按多久」（踏板 11-1，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；设计 = ai-docs/20261112-pedals-and-ring-design.md 第 4.3 节）。纯函数，放和导出共用同一张音符表。
//   user 2026-11-12：「尾音这个东西本来就是 MIDI 的规范」「那么几种踏板也做一下，钢琴也需要」。规范管不到、归我们定的只有一件：谱上的音多长，键按多久。
//   「键按多久」三个来源，先后是：谱上的踏板记号 → 乐手的默认（11-3）→ 照写的时值。11-1 接了延音；11-2（2026-11-13）接持音（规矩四）和弱音（规矩五：只改力度）。
//   引擎不用配合（11-0 侦察核过）：录音房同一时刻先松后按，TinySoundFont 的 note_off 松同一个键里最早按下的那个——只要在这里改每个音松开的时刻。
import { timeline, type Token, type TempoMap, type PedalKind } from "./song.ts";

/** 一种踏板踩着的一段（秒）：踩下那一刻、抬起那一刻（纸尾还踩着 = 纸尾）、中间换踏板的时刻（从小到大）。 */
export interface PedalSpan { down: number; up: number; changes: number[]; /** 靠默认留住的那一截到哪一刻（踏板 11-3 规矩六）：这一段开头就踩着（乐手的默认 = 留住）、到谱上第一次写的换踏板 / 抬起为止。谱上写的踩下开的 = 没有。 */ auto?: number }
/** 延音那一种（11-1 起的名字，留着）。 */
export type SustainSpan = PedalSpan;

/** 一段（压平后的整条声部，bounds = 每张纸从第几个 token 起）里这一种踏板踩着的几段。
 *  踏板记号挂在后面那个音 / 休止上（时刻 = 它的起点）；纸尾的（后面这张纸里没有音 / 休止了）= 纸尾那一刻。每张纸开头抬着（规矩一 / 七）。
 *  不起作用的（已经踩着又踩、没踩就抬）不改状态；没踩就「换踏板」= 踩下（换完本来就是踩着的）。三种踏板同一个读法（谱上的状态机和 song.ts pedalDownAt 一样）。 */
export function pedalSpans(tokens: readonly Token[], tempoMap: TempoMap | undefined, bounds: readonly number[] = [0], which: PedalKind = "sustain", startDown = false): PedalSpan[] {
  const tl = timeline(tokens as Token[], tempoMap), spans: PedalSpan[] = [];
  const starts = [...new Set([0, ...bounds])].sort((a, b) => a - b);
  for (let k = 0; k < starts.length; k++) {
    const a = starts[k]!, b = k + 1 < starts.length ? starts[k + 1]! : tokens.length;
    const timed = tl.filter((x) => x.index >= a && x.index < b);
    if (!timed.length) continue;
    const end = timed[timed.length - 1]!.t1;
    const at = (i: number): number => timed.find((x) => x.index > i)?.t0 ?? end;   // 挂在后面那个音 / 休止上；后面没有 = 纸尾
    // 这一段开头的状态（规矩一）：startDown = 乐手默认留住音（踏板 11-3）= 一开头就踩着，靠默认留住的那一截到谱上第一次写的换踏板 / 抬起
    let cur: PedalSpan | null = startDown ? { down: timed[0]!.t0, up: end, changes: [], auto: end } : null;
    for (let i = a; i < b; i++) {
      const t = tokens[i]!; if (t.kind !== "pedal" || t.which !== which) continue;
      const s = at(i);
      if (t.act === "down") { if (!cur) cur = { down: s, up: end, changes: [] }; }
      else if (t.act === "up") { if (cur) { cur.up = s; if (cur.auto !== undefined) cur.auto = Math.min(cur.auto, s); spans.push(cur); cur = null; } }
      else if (cur) { if (s > cur.down) cur.changes.push(s); if (cur.auto !== undefined) cur.auto = Math.min(cur.auto, s); } else cur = { down: s, up: end, changes: [] };
    }
    if (cur) spans.push(cur);   // 纸尾还踩着 = 纸尾抬起
  }
  return spans;
}
/** 延音踏板踩着的几段（= pedalSpans 的延音那一种）。 */
export function sustainSpans(tokens: readonly Token[], tempoMap: TempoMap | undefined, bounds: readonly number[] = [0]): SustainSpan[] { return pedalSpans(tokens, tempoMap, bounds, "sustain"); }

/** 一个音（秒）：t1 = 写的结尾（已经过跳音 / 缝 / 呼吸）。回来的多一个 w1 = 写的结尾（只有被踏板留长了的才有；追音用，规矩八）。 */
export type HeldNote<N extends { midi: number; t0: number; t1: number }> = N & { w1?: number };

/** 按延音踏板改每个音松开的时刻（= holdByPedals 不带持音）。 */
export function holdBySustain<N extends { midi: number; t0: number; t1: number }>(notes: readonly N[], spans: readonly SustainSpan[]): HeldNote<N>[] { return holdByPedals(notes, spans, []); }

/** 按延音 + 持音改每个音松开的时刻（规矩二、三、四）：
 *  四（持音）：持音踩下那一刻键正按着的音（写的起点不晚于那一刻、写的结尾晚于那一刻；那一刻落下的也算——记号挂在这个音上 = 抓住它）留到持音抬起才松；之后弹的音不归它管。
 *     持音的「换踏板」（只有别家谱可能写）= 那一刻先松、再抓那一刻按着的。
 *  二（延音）：从「写的结尾，或被持音留到的那一刻」算起，落在延音踩着的一段里（踩下之后、抬起之前）= 到下一个「换踏板 / 抬起」才松；那一刻键还按着的不受影响（接着被新的一脚兜住）。
 *  三：被踏板留着的音（写的结尾之后那一截），同一个音高又弹一次 = 旧的在那一刻松（照乐器自己的收尾收）。
 *  输入不改，回新的一串（先后不变）；被留长了的记下写的结尾 w1（追音用，规矩八）。 */
export function holdByPedals<N extends { midi: number; t0: number; t1: number; stacc?: true }>(notes: readonly N[], sustain: readonly PedalSpan[], sostenuto: readonly PedalSpan[]): HeldNote<N>[] {
  if (!sustain.length && !sostenuto.length) return notes.slice();
  const catches = sostenuto.flatMap((s) => { const pts = [s.down, ...s.changes, s.up]; return pts.slice(0, -1).map((d, k) => ({ down: d, up: pts[k + 1]! })); });
  const out: HeldNote<N>[] = notes.map((n) => {
    let e = n.t1;
    for (const c of catches) if (n.t0 <= c.down + 1e-9 && n.t1 > c.down + 1e-9 && c.up > e) e = c.up;   // 四：持音抓住了 = 留到它抬起
    const sp = sustain.find((s) => s.down < e - 1e-9 && e < s.up - 1e-9);
    // 六（踏板 11-3）：靠默认留住的那一截里，跳音照写的松（不写记号也有一个止音的办法）；谱上写了踩下之后照规范，跳音也被留住
    const staccFree = !!sp && !!n.stacc && sp.auto !== undefined && n.t1 < sp.auto - 1e-9;
    if (sp && !staccFree) e = Math.min(sp.up, ...sp.changes.filter((c) => c >= e - 1e-9));   // 二
    return e > n.t1 + 1e-9 ? { ...n, t1: e, w1: n.t1 } : n;
  });
  // 规矩三：同音高再弹 = 被留着的那个在那一刻松（只看被踏板留长的那一截：写的结尾之后）
  const byMidi = new Map<number, number[]>(); out.forEach((n, i) => { const l = byMidi.get(n.midi) ?? []; l.push(i); byMidi.set(n.midi, l); });
  for (const idx of byMidi.values()) for (const i of idx) {
    const n = out[i]!; if (n.w1 === undefined) continue;
    let cut = n.t1; for (const j of idx) { const m = out[j]!; if (j !== i && m.t0 >= n.w1 - 1e-9 && m.t0 < cut) cut = m.t0; }
    if (cut < n.t1) out[i] = cut > n.w1 + 1e-9 ? { ...n, t1: cut } : (({ w1: _w, ...rest }) => ({ ...rest, t1: n.w1! }) as HeldNote<N>)(n);
  }
  return out;
}

/** 弱音踏板（规矩五）：t 这一刻弱音踩着没有（踩下那一刻算、抬起那一刻不算；换踏板对弱音没有意思 = 一直踩着）。 */
export function softAt(spans: readonly PedalSpan[]): (t: number) => boolean {
  return (t) => spans.some((s) => t >= s.down - 1e-9 && t < s.up - 1e-9);
}
/** 弱音踩着期间起的音：力度（0–1）加上这位身上的 softVel（MIDI 力度格，负数 = 轻），夹在 1–127。只变轻 / 变响多少由这位身上写的数定；音色不另动（换到更轻的录音层是音色库自己的）。 */
export function softened(vel: number, softVel: number): number {
  return Math.max(1, Math.min(127, Math.round(vel * 127 + softVel))) / 127;
}
