// rowhead.ts —— 行首 / 谱头那一行：印的东西从左到右依次排开（第八刀 8-4；施工单第 8 节「行首的」）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   谁不在（字母谱不印调号、这一位不写速度…）后面的顶上来；不印的提示不在这里排（它们最后贴、只躲不推：hints，8-5）。只管几何，不认字形。
export interface HeadItem { id: string; w: number; /** 离前一样多远（第一样 = 离 x0 多远）。 */ gap: number }
/** 每样的左边在哪（和 x0 同一个单位）；最后一样的右边记在 "end"。 */
export function layoutHead(x0: number, items: readonly HeadItem[]): Map<string, number> {
  const out = new Map<string, number>(); let x = x0;
  for (const it of items) { x += it.gap; out.set(it.id, x); x += it.w; }
  out.set("end", x);
  return out;
}
