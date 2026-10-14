// chords.ts —— 两键同按 = 叠音的「头 / 尾」判据 + 单音乐器的「几乎同时按」护栏：纯函数，不碰 DOM、不懂音乐（叠什么、写什么归宿主）。
// created 2026-10-15 by Claude Fable 5.1（键盘模块 src/keyboard/ 刀 2；原来长在 src/app/main.ts 的 chord 状态机里，2026-10-08 Opus 5.5 按 user 的话写的判据原样搬来，数字不变）。
//   user 2026-10-08「之前的判定是ab落的时候相近。现在的判定是b落的时候不在a的尾巴上」「如果ab，b按下去之后a马上松，那么就不应该是和弦」
//   「尾巴时间规则也需要考虑相对比例，比如如果我快速跳音轻按ab多次的时候」「和弦输入的时候应该支持有长间隔的连按…慢慢按，xor toggle，手指数量不够的时候也能好」
//   A（根音：写进谱、还按着的那个）按着时按下 B：
//   · 头：B 在 A 落下 CHORD_WIN 内 = 同时按 → 叠；
//   · 否则观望（B 先响、进不进谱等分得出来）：B 先松（A 还按着）= 套在 A 里 → 叠；
//     A 先松：A 和 B 一起按着的时间比 A 单独按着的时间长 → 叠，短 = A 的尾巴压在 B 头上（快速连按 / 跳音 / 连奏）→ 两个音；
//     两个都还按着、一起按着已经比 A 单独的长 → 叠（不用等松手）；又按了下一个键 / 失焦 = 按当下定。比例不是固定毫秒：轻快的跳音和慢慢的连奏都按「尾巴」算。
//   单音乐器（小月相 / 元音 / 没人）：前一个写进去的音还按着、又隔不到 CHORD_MS = 算同时按 → 第二根手指不写不响不亮（模糊护栏；快速连按照写）。

export const CHORD_WIN = 80;   // ms：「头」——和根音几乎同时落下
export const CHORD_MS = 50;    // ms：单音乐器的「同时按」

export interface Press { readonly t: number }
export type ChordWhy = "keyUp" | "rootUp" | "both" | "force";

/** B 落下那一刻：和根音几乎同时（头）= 马上叠；否则观望。 */
export const chordHead = (root: Press, b: Press, win = CHORD_WIN): boolean => b.t - root.t < win;
/** 观望要等多久（从 B 落下起，ms）：一起按着一超过「根音单独按着的时长」就该定了（+5 ms 余量）。 */
export const chordBothAfterMs = (root: Press, b: Press): number => b.t - root.t + 5;
/** 观望中的 B 怎么定。why = 谁先发生：B 松 / 根音松 / 到时候了（两个都还按着才算，不然 null = 等别的事件）/ 又按了下一个键或失焦。 */
export function chordVerdict(root: Press, b: Press, now: number, why: ChordWhy, rootHeld: boolean, keyHeld: boolean): "chord" | "two" | null {
  if (why === "rootUp") return now - b.t > b.t - root.t ? "chord" : "two";   // 一起按着的 > 根音单独按着的 = 叠；短 = 尾巴
  if (why === "keyUp") return rootHeld ? "chord" : "two";                     // B 先松、根音还按着 = 套在里面
  if (why === "both") return rootHeld && keyHeld ? "chord" : null;
  return rootHeld ? "chord" : "two";
}
/** 单音乐器：还有键按着、离上一次按下不到 ms = 这一下算同时按（挡掉）。 */
export const monoClash = (heldCount: number, lastAt: number, now: number, ms = CHORD_MS): boolean => heldCount > 0 && now - lastAt < ms;
