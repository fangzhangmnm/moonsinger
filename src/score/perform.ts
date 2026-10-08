// perform.ts —— 谱上的「修」→ 出声的数（纯函数，Node 里可测）。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08 拍「挂在音上 + 选区条」「月读在那儿换气」。数从哪来：上场那位 by value 带着的力度表（dynamicsDb，mf = 0 dB）和演奏法（articulation：
//   staccatoGate 跳音吃掉时值的多少、accentDb 重音加多少）——契约 CandidateV2，app 改默认动不到旧歌。
// 怎么出声（各引擎一样的部分在这里，引擎特有的在调用方）：
//   力度 + 重音 = 一条按时间的音量曲线（谱的时钟，秒），渲染完乘上去（src/audio/mix.ts applyGain）；一个力度 / 重音都没有 = null = 不碰声音（和以前逐样本一样）。
//   跳音：SoundFont / 元音版把音截短（lightNotes，乐器自己的余音照常收）；月读截不短（唱法核心按谱唱满）→ 曲线在音的后半段收声（gateStaccato）。
//   呼吸：月读 = 下一个字前「v」（lab-score.ts）；元音版和乐器 = 前一个音收短一点（lightNotes；乐器上的逗号 = 稍微断开再进下一个音，管乐 / 人声就是换气；
//   2026-10-08 user「breath是否应该对大量GS乐器也生效。毕竟不断气一直拖着也不对，fl你还得手动调一下时长」）。
import { type Token, type TempoMap, type Dyn, timeline, dynAt, artOf } from "./song.ts";

export interface PerfSpec { dynamicsDb: Record<Dyn, number>; staccatoGate: number; accentDb: number }
/** 重音加在音头多长（秒；短于这个的音整个加）。 */
export const ACCENT_SEC = 0.12;
/** 月读的跳音收声：留给下一个字的辅音的余量（秒）——收声段太短（< 40 ms）就不收。 */
const CONS_ROOM = 0.06, MIN_GATE = 0.04;
/** 音量曲线的一段：t0–t1（秒，谱的时钟）这段多少 dB；-Infinity = 静音。 */
export interface GainSeg { t0: number; t1: number; dB: number }

/** 一个声部的音量曲线。gateStaccato = 跳音靠收声（月读）。全程 0 dB = null。 */
export function gainSegments(tokens: Token[], map: TempoMap | undefined, spec: PerfSpec, gateStaccato: boolean): GainSeg[] | null {
  const segs: GainSeg[] = [];
  let any = false;
  for (const { index, tok, t0, t1 } of timeline(tokens, map)) {
    const base = spec.dynamicsDb[dynAt(tokens, index)] ?? 0;
    if (base !== 0) any = true;
    if (tok.kind !== "note") { segs.push({ t0, t1, dB: base }); continue; }
    const art = artOf(tok);
    let cur = t0;
    if (art.includes("accent") && spec.accentDb) { const e = Math.min(t1, t0 + ACCENT_SEC); segs.push({ t0, t1: e, dB: base + spec.accentDb }); cur = e; any = true; }
    if (gateStaccato && art.includes("staccato")) {
      const g = Math.max(cur, t0 + (t1 - t0) * spec.staccatoGate), off1 = t1 - CONS_ROOM;
      if (off1 - g > MIN_GATE) {
        if (g > cur) segs.push({ t0: cur, t1: g, dB: base });
        segs.push({ t0: g, t1: off1, dB: -Infinity }, { t0: off1, t1, dB: base });
        any = true; continue;
      }
    }
    if (t1 > cur) segs.push({ t0: cur, t1, dB: base });
  }
  return any ? segs : null;
}

/** 轻量版 / SoundFont 一个音的结束时刻（秒）：跳音截到 staccatoGate；呼吸（只给元音版）= 收短一口气的空当（同唱法核心的 v：至多 0.16 s / 25%）。 */
export function noteEnd(t0: number, t1: number, art: readonly string[], o: { staccatoGate: number; breath: boolean }): number {
  let end = t1;
  if (art.includes("staccato")) end = t0 + (t1 - t0) * o.staccatoGate;
  if (o.breath && art.includes("breath")) end = Math.min(end, t1 - Math.min(0.16, 0.25 * (t1 - t0)));
  return end;
}

/** 谁认哪些记号（2026-10-08 Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。
 *  这张表必须和上面真做的事一致——跳音：月读 = gainSegments 后半段收声，元音版 / SoundFont = noteEnd 截短；重音、力度：所有引擎走 gainSegments；
 *  呼吸：月读 = 唱法核心换气（lab-score），元音版 / SoundFont = noteEnd 收短（lightMarks）；保持：谁都不管（普通音本来就满长）。test/honors.test.ts 守着。
 *  不在表里的引擎（没人上场 / 认不出的）= null：整个声部本来就不出声，不再逐个记号画灰。 */
const HONORS: Record<string, readonly string[]> = {
  tsukuyomi: ["staccato", "accent", "breath"],
  "vowel-sampler": ["staccato", "accent", "breath"],
  soundfont: ["staccato", "accent", "breath"],
};
const ALL_ARTS = ["staccato", "accent", "tenuto", "breath"] as const;
/** 这个引擎不认的演奏法（写在谱上照画、画灰，出声不受影响）。 */
export function ignoredArts(engine: string | null | undefined): (typeof ALL_ARTS)[number][] {
  const h = engine ? HONORS[engine] : undefined;
  return h ? ALL_ARTS.filter((a) => !h.includes(a)) : [];
}
/** 元音版 / SoundFont 这一路（lightNotes）怎么落修的记号：跳音截到 staccatoGate、呼吸收短一口气（两种引擎一样；月读不走这条，走唱谱 + 音量曲线）。
 *  main.ts 的出声和 test/honors.test.ts 都从这里取，不各写一份。 */
export function lightMarks(spec: { staccatoGate: number }): { staccatoGate: number; breath: boolean } { return { staccatoGate: spec.staccatoGate, breath: true }; }
