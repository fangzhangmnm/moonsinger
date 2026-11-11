// furniture.ts —— 版面家具（歌名、作者栏、声部名…）用的小工具。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出，内容没改）

/** 歌名折行（v0.16.58，user 11-09「曲名应该能换行」）：放得下 = 一行；放不下 = 先在空格处断（「陽だまり道とれんちょん 简单笛子版」= 两行），
 *  一个词本身比一行还宽（中文 / 日文整串没有空格）= 按字断；行首不放标点和小写假名（把上一行最后一个字带下来）。w = 量宽（px），max = 一行最宽（px）。 */
export const NO_LINE_START = new Set([..."、。，．・：；？！）」』】〕〉》ー～ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ,.;:!?)]}"]);
export function wrapTitle(s: string, w: (t: string) => number, max: number): string[] {
  if (w(s) <= max) return [s];
  const lines: string[] = []; let cur = "";
  const push = () => { if (cur.trim()) lines.push(cur.trim()); cur = ""; };
  for (const word of s.match(/\S+\s*/g) ?? [s]) {
    if (w((cur + word).trimEnd()) <= max) { cur += word; continue; }
    if (cur.trim()) push();
    if (w(word.trimEnd()) <= max) { cur = word; continue; }
    for (const ch of word) {
      if (cur && w((cur + ch).trimEnd()) > max) {
        if (NO_LINE_START.has(ch) && [...cur].length > 1) { const cs = [...cur], last = cs.pop()!; cur = cs.join(""); push(); cur = last; }
        else push();
      }
      cur += ch;
    }
  }
  push();
  return lines.length ? lines : [s];
}
