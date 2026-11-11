// carets.ts —— 光标落点（Slot：点在哪个空隙）和写字头画在哪（CaretHead）：和谱种无关的那一套规矩，每种行的画法画完自己的轨调一次。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第四刀 4-2：原样从 staff/draw.ts 第 11 / 11½ 步搬出，推的先后不变 = 五线谱底本逐个相同）。
//   画法给：这条轨的单元（摆好了 x）、每个单元的光标往左让多少（ox：临时记号挂在对齐线左边，光标画在它左边）、第几个 token 处的「位移」（五线谱 = 谱号 / 八度线，鬼音符用；简谱 = 0）。
import { headLen, type Token } from "../../score/song.ts";
import type { Slot, CaretHead } from "../engrave.ts";

/** 画法交来的一条轨（只要时间那一半和摆好的位置）。 */
export interface CaretTrack {
  tokens: Token[]; realLen: number; realTicks: number; staves: number;
  units: readonly { kind: string; index: number; x: number; w: number; system: number; tick: number; pad?: true; inBar?: number }[];
}
/** 推这条轨的落点和写字头。cx(u) = 这个单元左边光标画在哪（px）；shiftAt(c) = 第 c 个光标位置每张谱表的位移；rowOf(行, 谱表) = 谱行号。cols = 这张纸摆好的列（行末落点用）。 */
export function caretStops(q: CaretTrack, o: {
  cx: (u: CaretTrack["units"][number]) => number; shiftAt: (c: number) => number[]; rowOf: (s: number, k: number) => number;
  P: (v: number) => number; sysStart0: number; cols: readonly { x: number; w: number; system: number }[]; slots: Slot[]; heads: CaretHead[];
}): void {
  const { tokens, units, realLen } = q, { cx, shiftAt, rowOf, P, cols, slots, heads } = o;
  // 11. 光标落点（点在哪个空隙）——每条 track 都有（点到别的声部 = 换到那条）
  const H = headLen(tokens);
  const firstUnitOf = new Map<number, CaretTrack["units"][number]>();
  for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
  for (let c = H; c <= realLen; c++) {   // 大谱表：两条谱表上都放落点（点哪条都是这个声部）；补齐的那段另放（下面）
    const u = c < tokens.length ? firstUnitOf.get(c) : undefined;
    const last = u ? null : [...units].reverse().find((v) => v.kind !== "head");
    const sys = u ? u.system : last ? last.system : 0, x = u ? cx(u) : last ? P(last.x + last.w) : P(o.sysStart0);
    for (let k = 0; k < q.staves; k++) slots.push({ caret: c, system: rowOf(sys, k), x });
  }
  // 11½. 写字头画在哪（W-17 第 1 刀，2026-10-15）：排版不认光标，只给每个 caret 位置该画的地方。老规矩（原来零宽 head 单元的 SLOT = 4）：
  //   同一 tick 上排在小节线 / 记号（句号 / 调号 / 拍号 / 速度 / 力度…）后面、音前面——光标停在行末的小节线前 = 画在下一行开头（2026-10-10 user「光标应该在每行的开头」）；
  //   那一 tick 上没有音 = 排在这一 tick 最后一个单元后面；尾巴 = 最后一个单元后面。shift = 前一个音处的位移（同原来的 head.shift）
  for (let c = H; c <= realLen; c++) {
    const u0 = c < tokens.length ? firstUnitOf.get(c) : undefined;
    let sys: number, x: number;
    if (!u0) { const last = [...units].reverse().find((v) => v.kind !== "head"); sys = last ? last.system : 0; x = last ? P(last.x + last.w) : P(o.sysStart0); }
    else if (u0.kind === "chunk") { sys = u0.system; x = cx(u0); }
    else {
      const T = u0.tick, ch = units.find((v) => v.kind === "chunk" && v.index >= c && Math.abs(v.tick - T) < 1e-6);
      if (ch) { sys = ch.system; x = cx(ch); }
      else { const same = units.filter((v) => v.kind !== "head" && v.index >= c && Math.abs(v.tick - T) < 1e-6), lastT = same[same.length - 1] ?? u0; sys = lastT.system; x = P(lastT.x + lastT.w); }
    }
    const sh = shiftAt(c);
    for (let k = 0; k < q.staves; k++) heads.push({ caret: c, system: rowOf(sys, k), x, shift: sh[k]! });
  }
  // 补齐的淡色小节：每个小节开头一个落点（caret = 尾巴、lead = 离尾巴多少 tick）
  for (const u of units) if (u.kind === "chunk" && u.pad && (u.inBar ?? 0) < 1e-6 && u.tick - q.realTicks > 1e-6) { const sh = shiftAt(realLen); for (let k = 0; k < q.staves; k++) { slots.push({ caret: realLen, system: rowOf(u.system, k), x: P(u.x), lead: u.tick - q.realTicks }); heads.push({ caret: realLen, system: rowOf(u.system, k), x: P(u.x), shift: sh[k]!, lead: u.tick - q.realTicks }); } }
  // 行末落点：这一行最后一个东西后面 = 下一行第一个光标位置，点在这里 = 光标画在这一行末尾（caretEnd）。原来这里没有落点，点行末空白会落到最后一个音前面。
  let lastSys = -1;
  for (let c = H; c < Math.min(tokens.length, realLen + 1); c++) {
    const u = firstUnitOf.get(c); if (!u) continue;
    const crossed = lastSys >= 0 && u.system > lastSys; lastSys = u.system;
    if (!crossed) continue;
    const prevRow = cols.filter((cc) => cc.system === u.system - 1);
    if (!prevRow.length) continue;
    const x = P(Math.max(...prevRow.map((cc) => cc.x + cc.w)));
    const sh = shiftAt(c);
    for (let k = 0; k < q.staves; k++) { slots.push({ caret: c, system: rowOf(u.system - 1, k), x, end: true }); heads.push({ caret: c, system: rowOf(u.system - 1, k), x, shift: sh[k]!, end: true }); }
  }
}
