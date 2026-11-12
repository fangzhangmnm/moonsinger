// pedal.ts —— 踏板：「键按多久」（踏板 11-1，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；设计 = ai-docs/20261112-pedals-and-ring-design.md 第 4.3 节）。纯函数，放和导出共用同一张音符表。
//   user 2026-11-12：「尾音这个东西本来就是 MIDI 的规范」「那么几种踏板也做一下，钢琴也需要」。规范管不到、归我们定的只有一件：谱上的音多长，键按多久。
//   「键按多久」三个来源，先后是：谱上的踏板记号 → 乐手的默认（11-3）→ 照写的时值。这一刀接第一个（延音踏板）。
//   引擎不用配合（11-0 侦察核过）：录音房同一时刻先松后按，TinySoundFont 的 note_off 松同一个键里最早按下的那个——只要在这里改每个音松开的时刻。
import { timeline, type Token, type TempoMap } from "./song.ts";

/** 延音踏板踩着的一段（秒）：踩下那一刻、抬起那一刻（纸尾还踩着 = 纸尾）、中间换踏板的时刻（从小到大）。 */
export interface SustainSpan { down: number; up: number; changes: number[] }

/** 一段（压平后的整条声部，bounds = 每张纸从第几个 token 起）里延音踏板踩着的几段。
 *  踏板记号挂在后面那个音 / 休止上（时刻 = 它的起点）；纸尾的（后面这张纸里没有音 / 休止了）= 纸尾那一刻。每张纸开头抬着（规矩一 / 七）。
 *  不起作用的（已经踩着又踩、没踩就抬）不改状态；没踩就「换踏板」= 踩下（换完本来就是踩着的）。 */
export function sustainSpans(tokens: readonly Token[], tempoMap: TempoMap | undefined, bounds: readonly number[] = [0]): SustainSpan[] {
  const tl = timeline(tokens as Token[], tempoMap), spans: SustainSpan[] = [];
  const starts = [...new Set([0, ...bounds])].sort((a, b) => a - b);
  for (let k = 0; k < starts.length; k++) {
    const a = starts[k]!, b = k + 1 < starts.length ? starts[k + 1]! : tokens.length;
    const timed = tl.filter((x) => x.index >= a && x.index < b);
    if (!timed.length) continue;
    const end = timed[timed.length - 1]!.t1;
    const at = (i: number): number => timed.find((x) => x.index > i)?.t0 ?? end;   // 挂在后面那个音 / 休止上；后面没有 = 纸尾
    let cur: SustainSpan | null = null;
    for (let i = a; i < b; i++) {
      const t = tokens[i]!; if (t.kind !== "pedal" || t.which !== "sustain") continue;
      const s = at(i);
      if (t.act === "down") { if (!cur) cur = { down: s, up: end, changes: [] }; }
      else if (t.act === "up") { if (cur) { cur.up = s; spans.push(cur); cur = null; } }
      else if (cur) { if (s > cur.down) cur.changes.push(s); } else cur = { down: s, up: end, changes: [] };
    }
    if (cur) spans.push(cur);   // 纸尾还踩着 = 纸尾抬起
  }
  return spans;
}

/** 一个音（秒）：t1 = 写的结尾（已经过跳音 / 缝 / 呼吸）。回来的多一个 w1 = 写的结尾（只有被踏板留长了的才有；追音用，规矩八）。 */
export type HeldNote<N extends { midi: number; t0: number; t1: number }> = N & { w1?: number };

/** 按延音踏板改每个音松开的时刻（规矩二、三）：
 *  二：写的结尾落在踩着的一段里（踩下之后、抬起之前）= 到下一个「换踏板 / 抬起」才松；那一刻键还按着的音不受影响（接着被新的一脚兜住）。
 *  三：被踏板留着的音，同一个音高又弹一次 = 旧的在那一刻松（照乐器自己的收尾收）。
 *  输入不改，回新的一串（先后不变）。 */
export function holdBySustain<N extends { midi: number; t0: number; t1: number }>(notes: readonly N[], spans: readonly SustainSpan[]): HeldNote<N>[] {
  if (!spans.length) return notes.slice();
  const out: HeldNote<N>[] = notes.map((n) => {
    const sp = spans.find((s) => s.down < n.t1 - 1e-9 && n.t1 < s.up - 1e-9);
    if (!sp) return n;
    const rel = Math.min(sp.up, ...sp.changes.filter((c) => c >= n.t1 - 1e-9));
    return rel > n.t1 + 1e-9 ? { ...n, t1: rel, w1: n.t1 } : n;
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
