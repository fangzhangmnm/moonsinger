// groove.ts —— 拍子轻重：风格记号 → 每个音按它在小节里的位置轻一点 / 重一点（纯函数，Node 里可测）。created 2026-10-08 深夜 by Claude Opus 5.5
// user：「先讨论清楚再做，不同的流派会不一样」→ 风格 = 像速度一样的文字记号，「只对当前sheet有用」「中间换同意」「点开之后可以设置具体的细节」；
//   「预设可以，你给音乐仓鼠发一个工单，做成数据驱动的」→ 预设 = 仓鼠的 grooves-vN.json（src/score/grooves.gen.ts；强弱先后引维基原文、数值 AI 按层级取）。
// 怎么出声（perform.ts 用）：权重 w（−1…1）× 记号的幅度 × 这位演奏者跟多少（预设按乐器类别给，follow）= 这个音的「拍子轻重」；
//   w > 0 = 按次重音的量加（w = 1 就是一个次重音），w < 0 = 按弱化的量减（w = −1 就是一个弱化）——同一把尺子，演奏者配置里次重音 / 弱化调多少，这里跟着变。
//   谱上写了音头记号（幽灵音 / 弱化 / 次重音 / 重音 / 强音 / 突强 / 强后即弱）的音 = 写的说了算，拍子轻重不叠上去（「音的强度只能有一种」）。
//   连过来的音（tie）不是新的音头，不算。摇摆（时值）v0.9.36 起接了：timeMapOf（下面）把它做进放的时候的时间表，三种演奏者同一个扭曲（song.ts swingDelta）。
import { type Token, type NoteTok, type Song, type PaperSeg, type GrooveTok, type TempoMap, WHOLE, TPQ, ATTACKS, DEFAULT_TIME, DEFAULT_BPM, artOf, isTimed, paperTicks, tempoMapOf, tempoOwner } from "./song.ts";
import { expandPaper } from "./repeats.ts";
import { GROOVE_STYLES, type GrooveStyle } from "./grooves.gen.ts";

export { GROOVE_STYLES, type GrooveStyle };
export const grooveStyle = (id: string): GrooveStyle | null => GROOVE_STYLES.find((s) => s.id === id) ?? null;
/** 预设的名字（"none" = 「不加轻重」，比预设名「无」好懂）；不认识的预设（以后的版本写的）= 原样显示 id。 */
export const grooveName = (style: string): string => { const s = grooveStyle(style); return style === "none" ? "不加轻重" : s ? s.name.zh : style; };
/** 预设的英文名（谱面语言，同速度的 Andante；user「风格名用英文」）："none" = none；不认识的预设 = 原样 id。 */
export const grooveNameEn = (style: string): string => { const s = grooveStyle(style); return style === "none" ? "none" : s ? s.name.en : style; };
/** 谱上 / MusicXML 里写的字：「Style: Classical」（光写名字像谜语，user「光说一个古典比较谜语人，说风格：古典」；
 *  语言对齐记谱：拉丁不用于演奏指示，古典传统是意大利文、流行 / 爵士谱的风格写英文——user「风格名用英文」）。 */
export const grooveLabel = (t: Pick<GrooveTok, "style" | "amount" | "shift">): string =>
  `Style: ${grooveNameEn(t.style)}${t.shift && grooveHasPhase(grooveStyle(t.style)) ? " 2-3" : ""}${t.amount !== undefined && t.amount !== 1 && t.style !== "none" ? ` ×${t.amount}` : ""}`;
/** 这个风格有没有两小节一轮的拍号（克拉维）：有 = 菜单里给「3-2 / 2-3」（错开一小节）。 */
export const grooveHasPhase = (s: GrooveStyle | null): boolean => !!s && Object.values(s.meters).some((m) => (m.bars ?? 1) > 1);
/** 一拍拍分组（同 classicalWeights）：每拍几个十六分 + 拍里第一层细分的步长。 */
function beatGroups(beats: number, beatType: number): { groups: number[]; sub: number } | null {
  if (!Number.isInteger((beats * 16) / beatType)) return null;
  if (beatType === 8 && beats > 3 && beats % 3 === 0) return { groups: Array(beats / 3).fill(6), sub: 2 };
  if (beatType === 8 && beats > 3) { const n = Math.floor(beats / 2), g = Array(n).fill(4); if (beats % 2) g[n - 1] = 6; return { groups: g, sub: 2 }; }
  const L = 16 / beatType; return { groups: Array(beats).fill(L), sub: L / 2 };
}
const WORD = (w: number) => (w >= 0.95 ? "最重" : w >= 0.7 ? "很重" : w >= 0.45 ? "重" : w > 0.05 ? "稍重" : w > -0.05 ? "不变" : w > -0.35 ? "稍轻" : "轻");
const BEAT_NO = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
/** 人话说这个风格在这个拍号下怎么轻重（从数据现算，数据变了说明跟着变）：「一拍 最重 · 二拍 不变 · …；半拍 稍轻；更细的 轻」。 */
export function describeGroove(s: GrooveStyle, beats: number, beatType: number): string | null {
  const tb = grooveTable(s, beats, beatType), bg = beatGroups(beats, beatType);
  if (!tb || !bg) return null;
  const starts: number[] = []; let at = 0; for (const g of bg.groups) { starts.push(at); at += g; }
  if (tb.bars > 1) {   // 两小节一轮（克拉维）：两小节各说一句拍上的轻重，再说哪几个格子最重（克拉维的击点）
    const bar = (b: number) => starts.map((st, k) => `${BEAT_NO[k] ?? k + 1}拍 ${WORD(tb.weights[b * tb.grid + st])}`).join(" · ");
    const hits = tb.weights.map((w, k) => (w >= 0.7 ? k : -1)).filter((k) => k >= 0).map((k) => `${Math.floor(k / tb.grid) + 1}-${(k % tb.grid) + 1}`);
    return `两小节一轮：第一小节 ${bar(0)}；第二小节 ${bar(1)}；重的格子（小节-第几个十六分）${hits.join(" ")}`;
  }
  const beatsTxt = starts.map((st, k) => `${BEAT_NO[k] ?? k + 1}拍 ${WORD(tb.weights[st])}`).join(" · ");
  const subs: number[] = [], finer: number[] = [];
  starts.forEach((st, k) => { for (let q = 1; q < bg.groups[k]; q++) (bg.sub >= 1 && Number.isInteger(bg.sub) && q % bg.sub === 0 ? subs : finer).push(tb.weights[st + q]); });
  const one = (xs: number[]) => { const ws = [...new Set(xs.map(WORD))]; return ws.length === 1 ? ws[0] : ws.join(" / "); };
  const subName = bg.groups.some((g) => g === 6) ? "拍里的八分" : "半拍";
  return `${beatsTxt}${subs.length ? `；${subName} ${one(subs)}` : ""}${finer.length ? `；更细的 ${one(finer)}` : ""}`;
}

/** 没列的拍号按古典层级推（仓鼠 meterFallback.rule = "classical" 的说法）：小节第一拍 1；四拍的第三拍 0.5；其余拍 0；
 *  拍里第一层细分 −0.25、再往下 −0.5。复拍子（6/8 9/8 12/8）一拍 = 三个八分，每个八分是第一层细分；
 *  x/8 不是 3 的倍数（5/8 7/8）= 加法拍子：两个八分一组、单数的话最后一组三个（谱上没记分组，按这个推；面板里明说）。
 *  一小节不是整数个十六分（如 x/32）= null（不加）。 */
export function classicalWeights(beats: number, beatType: number): { grid: number; weights: number[] } | null {
  const grid = (beats * 16) / beatType;
  if (!Number.isInteger(grid) || grid <= 0) return null;
  let groups: number[];   // 每拍几个十六分
  let sub: (len: number) => number;   // 拍里第一层细分的步长（十六分数）
  if (beatType === 8 && beats > 3 && beats % 3 === 0) { groups = Array(beats / 3).fill(6); sub = () => 2; }
  else if (beatType === 8 && beats > 3) { const n = Math.floor(beats / 2); groups = Array(n).fill(4); if (beats % 2) groups[n - 1] = 6; sub = () => 2; }
  else { const L = 16 / beatType; groups = Array(beats).fill(L); sub = (len) => len / 2; }
  const weights: number[] = [];
  groups.forEach((len, b) => {
    const step = sub(len);
    for (let p = 0; p < len; p++) weights.push(p === 0 ? (b === 0 ? 1 : groups.length === 4 && b === 2 ? 0.5 : 0) : step >= 1 && Number.isInteger(step) && p % step === 0 ? -0.25 : -0.5);
  });
  return { grid, weights };
}
/** 这个风格在这个拍号下的表：列了的用列的；没列 = 按 fallback（古典层级推 / 不加）。 */
export function grooveTable(s: GrooveStyle, beats: number, beatType: number): { grid: number; weights: number[]; bars: number; derived: boolean } | null {
  const m = s.meters[`${beats}/${beatType}`];
  if (m) return { grid: m.grid, weights: m.weights, bars: m.bars ?? 1, derived: false };
  const c = s.fallback === "classical" ? classicalWeights(beats, beatType) : null;
  return c ? { ...c, bars: 1, derived: true } : null;
}

/** 每个音头（不含连过来的音）在小节里的位置（tick）+ 那里的拍号。bounds = 纸界（每张纸各自从头数，同画谱）。规则同 engrave unitsOf：
 *  人插的「|」/ 拍号变 = 新的一小节；写满一小节 = 自动小节线；每张纸的第一小节还没写满就碰到「|」= 弱起——位置按小节尾对齐（弱起的那一拍是最后一拍）。 */
export function meterPositions(tokens: readonly Token[], bounds: readonly number[] = [0]): Map<number, { pos: number; beats: number; beatType: number; bar: number; pickup?: true }> {
  // bar = 这张纸里第几小节（0 起；有弱起时弱起是第 0 小节、第一个整小节是第 1 小节）；pickup = 弱起的音。两小节一轮的风格按 bar 数单双
  const out = new Map<number, { pos: number; beats: number; beatType: number; bar: number; pickup?: true }>(), starts = new Set(bounds);
  let time = { ...DEFAULT_TIME }, len = (time.beats * WHOLE) / time.beatType, inBar = 0, measureNo = 0, first: number[] = [];
  tokens.forEach((t, i) => {
    if (starts.has(i)) { inBar = 0; measureNo = 0; first = []; }
    if (t.kind === "bar") {
      if (measureNo === 0 && inBar > 0 && inBar < len) for (const k of first) { const e = out.get(k)!; e.pos += len - inBar; e.pickup = true; }   // 弱起
      inBar = 0; measureNo++; first = []; return;
    }
    if (t.kind === "time") { if (inBar > 0) { inBar = 0; measureNo++; } time = { beats: t.beats, beatType: t.beatType }; len = (t.beats * WHOLE) / t.beatType; return; }
    if (!isTimed(t)) return;
    while (inBar >= len && inBar > 0) { inBar -= len; measureNo++; }
    if (t.kind === "note" && !t.tie) { out.set(i, { pos: inBar, ...time, bar: measureNo }); if (measureNo === 0) first.push(i); }
    inBar += t.dur;
  });
  return out;
}

/** 整首（照放的顺序）的风格记号：每张纸开头回到「不加」（风格只管它那张纸）；纸里任何一行写的都算（整张纸一起听），同一时刻两行都写了 = 上面那行。
 *  tick = 压平后从头数（flattenPart 把每张纸补到最长那条的长度，所以纸的起点 = 前面各张纸长度之和）。 */
export type GrooveMap = { tick: number; style: string | null; amount: number; shift?: boolean }[];   // shift = 错开一小节（2-3）
export function grooveMapOf(song: Song, order?: readonly string[]): GrooveMap {
  const seq: PaperSeg[] = order ? order.flatMap((id) => song.papers.filter((p) => p.id === id)) : song.papers.filter((p) => !p.hidden);
  const out: GrooveMap = [];
  let at = 0;
  for (const p0 of seq) {
    const p = expandPaper(song, p0, () => -1);   // 谱内反复：和压平（flattenPart）同一个展开，tick 才对得上
    out.push({ tick: at, style: null, amount: 1 });
    const here: { tick: number; style: string; amount: number; shift: boolean; row: number }[] = [];
    song.parts.forEach((part, row) => {
      let t = 0;
      for (const tok of p.tracks[part.id] ?? []) { if (tok.kind === "groove") here.push({ tick: at + t, style: tok.style, amount: tok.amount ?? 1, shift: !!tok.shift, row }); else if (isTimed(tok)) t += tok.dur; }
    });
    here.sort((a, b) => a.tick - b.tick || b.row - a.row);   // 同一时刻：下面的先、上面的后（后来的算数）
    for (const g of here) out.push({ tick: g.tick, style: g.style === "none" ? null : g.style, amount: g.amount, ...(g.shift ? { shift: true } : {}) });
    at += paperTicks(p);
  }
  return out;
}

/** 一个声部（压平、照同一个顺序）每个音的拍子轻重（index → 权重 × 幅度 × 跟多少；0 的不放）。follow = 这位演奏者对这个风格跟多少（0–1）。 */
export function grooveWeights(tokens: readonly Token[], bounds: readonly number[], map: GrooveMap, follow: (s: GrooveStyle) => number): Map<number, number> {
  const out = new Map<number, number>();
  if (!map.some((g) => g.style)) return out;
  const pos = meterPositions(tokens, bounds);
  let tick = 0, k = -1, bar0: number | null = null;   // bar0 = 这个风格记号从第几小节起（两小节一轮的风格按它数单双）
  tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    while (k + 1 < map.length && map[k + 1].tick <= tick) { k++; bar0 = null; }
    const g = k >= 0 ? map[k] : null; tick += t.dur;
    if (!g?.style || t.kind !== "note") return;
    const p = pos.get(i), s = grooveStyle(g.style); if (!p || !s) return;
    if (bar0 === null) bar0 = p.pickup ? p.bar + 1 : p.bar;   // 记号之后第一个音所在的小节 = 一轮的第一小节（是弱起 = 从下一个整小节起，弱起算前一轮的第二小节）
    if (artOf(t as NoteTok).some((a) => ATTACKS.includes(a))) return;   // 写了音头记号 = 写的说了算
    const tb = grooveTable(s, p.beats, p.beatType); if (!tb) return;
    const slot = (p.pos * tb.grid) / ((p.beats * WHOLE) / p.beatType), on = Math.abs(slot - Math.round(slot)) < 1e-6;
    const half = tb.bars > 1 ? ((((p.bar - bar0 + (g.shift ? 1 : 0)) % tb.bars) + tb.bars) % tb.bars) : 0;   // 两小节一轮：这是一轮里的第几小节（错开一小节 = 2-3）
    const w = on ? tb.weights[half * tb.grid + (Math.round(slot) % tb.grid)] : Math.min(...tb.weights);   // 不在十六分格子上（三连音里面的）= 最轻的那一档
    const v = w * g.amount * follow(s);
    if (v) out.set(i, v);
  });
  return out;
}

/** 演奏者属于哪一类（预设的 follow 键）：月读 / 元音版 = voice；SoundFont = GM 家族（bank 128 = 鼓件 percussion；其余按 GM 音色号每 8 个一族）。 */
const GM_FAMILIES = ["piano", "chromatic-percussion", "organ", "guitar", "bass", "strings", "ensemble", "brass", "reed", "pipe", "synth-lead", "synth-pad", "synth-effects", "ethnic", "percussive", "sound-effects"] as const;
export function grooveCategory(engine: string | null | undefined, gm?: { bank: number; program: number } | null): string | null {
  if (engine === "tsukuyomi" || engine === "vowel-sampler") return "voice";
  if (engine === "soundfont" && gm) return gm.bank === 128 ? "percussion" : GM_FAMILIES[Math.max(0, Math.min(127, gm.program)) >> 3];
  return null;
}
/** 类别里预设没写的 = 0（不跟）。 */
export const followOf = (s: GrooveStyle, category: string | null): number => (category ? s.follow[category] ?? 0 : 0);

// ── 摇摆（v0.9.36，2026-10-10 Opus 5.5；user「全量摇摆同意，放在一号轨？」→ 是：跟着风格记号走（风格记号写在每张纸最上面那位身上、管整张纸） ──
/** 摇多少：风格数据的 swing.ratio（一拍里前一个八分占多少；仓鼠 grooves，Swing = 0.667、范围 0.5–0.75），幅度放大 / 缩小「比直的多出来的那一截」，
 *  夹在数据给的范围里；这个风格不摇 = 0。 */
export function swingRatio(style: string | null, amount = 1): number {
  const w = style ? grooveStyle(style)?.swing : null; if (!w) return 0;
  return Math.min(w.range[1], Math.max(w.range[0], 0.5 + (w.ratio - 0.5) * amount));
}
/** 放的时候用的时间表 = 速度表（tempoMapOf）+ 摇摆：风格记号带摇摆的那一段，**整张纸所有歌手一起摇**（时间不分谁跟多少，不然对不上拍；跟多少只管轻重）。
 *  拍的网格从纸头起数；纸的第一小节是弱起（还没写满就碰到「|」）= 网格对齐到那条小节线（弱起的那个八分是后半拍）。
 *  整首没有哪一段摇 = 原样返回速度表（旧歌逐样本不变）。 */
export function timeMapOf(song: Song, order?: readonly string[]): TempoMap {
  const tempo = tempoMapOf(song, order), g = grooveMapOf(song, order);
  if (!g.some((e) => swingRatio(e.style, e.amount))) return tempo;
  const seq: PaperSeg[] = order ? order.flatMap((id) => song.papers.filter((p) => p.id === id)) : song.papers.filter((p) => !p.hidden);   // 同 grooveMapOf
  const spans: { at: number; end: number; origin: number }[] = []; let at = 0;
  for (const p0 of seq) {
    const p = expandPaper(song, p0, () => -1), len = paperTicks(p), owner = tempoOwner(song, p), toks = owner ? p.tracks[owner] ?? [] : [];
    let t = 0, b1 = -1, measure = (DEFAULT_TIME.beats * WHOLE) / DEFAULT_TIME.beatType;
    for (const tok of toks) {
      if (tok.kind === "time" && t === 0) measure = (tok.beats * WHOLE) / tok.beatType;
      if (tok.kind === "bar") { b1 = t; break; }
      if (isTimed(tok)) { t += tok.dur; if (t >= measure) break; }
    }
    spans.push({ at, end: at + len, origin: at + (b1 > 0 && b1 < measure ? b1 % TPQ : 0) }); at += len;
  }
  const originAt = (tick: number) => (spans.find((s) => tick >= s.at && tick < s.end) ?? spans[spans.length - 1])?.origin ?? 0;
  const bpmAt = (tick: number) => { let b = tempo[0]?.bpm ?? DEFAULT_BPM; for (const e of tempo) if (e.tick <= tick) b = e.bpm; return b; };
  const out: TempoMap = [...tempo, ...g.map((e) => ({ tick: e.tick, bpm: bpmAt(e.tick), swing: swingRatio(e.style, e.amount), origin: originAt(e.tick) }))];
  return out.sort((a, b) => a.tick - b.tick || (a.swing === undefined ? 0 : 1) - (b.swing === undefined ? 0 : 1));   // 同一时刻：速度先、摇摆后
}
