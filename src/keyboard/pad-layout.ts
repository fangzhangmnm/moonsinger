// pad-layout.ts —— pad 符号格的布局（三页各放哪些按键 id）+ 往外发的按键 id 全集。纯数据，不碰 DOM，node 测试直接 import。
// created 2026-10-15 by Claude Fable 5.1（键盘模块刀 2，从 pad.ts 里抽出来；内容 = 2026-10-08 Opus 5.5 的三页，位置没动）。
//   按键 id 是键盘和宿主之间的词：键盘只发 id（pad.ts → PadHost.onKey），翻译成命令 / 插记号 / 开菜单归 src/app/pad-keys.ts；test/pad-keys.test.ts 守着一个都不漏。

/** 符号层三页（2026-10-08 Opus 5.5 提、user「可以」）：一页一般放得下（4 列 3 排 = 12），位置固定好记。演奏法 = 上一排音头、下一排长短 / 连断；力度 = 力度、渐强渐弱、音内起伏；记号 = 句号、调号 / 拍号 / 速度（大谱表多换谱表）。 */
export type SymPage = "art" | "dyn" | "mark";
export const SYM_PAGES: Record<SymPage, readonly string[]> = {
  art: ["art:ghost", "art:unstress", "art:stress", "art:accent", "art:marcato", "art:sfz", "art:fp", "art:tenuto", "art:staccato", "slur", "art:breath", "inhale:soft", "inhale:big", "art:whisper", "swell:<", "swell:>", "swell:<>", "art:arpeggio"],   // 2026-10-10：出声的换气（轻吸 / 深吸）、气声（× 符头）   // 从轻到重一路排下来（强度的阶梯），再是长短 / 连断
  dyn: ["dyn:ppp", "dyn:pp", "dyn:p", "dyn:mp", "dyn:mf", "dyn:f", "dyn:ff", "dyn:fff", "wedge:cresc", "wedge:dim", "dyn:ramp"],   // 音内渐强 / 渐弱 / 鼓起搬到「演奏法」（v0.9.44；user「…应该属于演奏法…因为是跟着音符的」）   // ppp…fff 两整排（v0.9.23）
  mark: ["phrase", "key", "time", "tempo", "clef", "ottava", "groove", "repeat", "staff"],   // 谱号 / 八度线（v0.9.28）
};
export const SYM_PAGE_NAME: Record<SymPage, string> = { art: "演奏法", dyn: "力度", mark: "记号" };
export const SYM_PAGE_TITLE: Record<SymPage, string> = { art: "强度（幽灵音 / 弱化 / 次重音 / 重音 / 强音 / 突强 / 强后即弱）、保持 / 跳音 / 连线 / 呼吸（静默 / 轻吸 / 深吸）、气声", dyn: "ppp…fff、渐强 / 渐弱、渐到、音内起伏", mark: "句号、调号 / 拍号 / 谱号 / 八度线 / 速度、风格（拍子轻重）" };

/** 写音那一排往外发的按键 id（← → 休止 小节线 呼吸 拉长 退格；符号层开着时退格 = symBackspace；「⋯」里的「换谱表」= staff）。 */
export const WRITE_KEY_IDS: readonly string[] = ["caret:-1", "caret:1", "rest", "bar", "art:breath", "extend", "backspace", "symBackspace", "staff"];
/** 全部按键 id（写字键 + 符号格三页）。「dyn:ramp」是键盘自己的修饰键（渐到的锁），不往外发。 */
export const PAD_KEY_IDS: readonly string[] = [...WRITE_KEY_IDS, ...Object.values(SYM_PAGES).flat().filter((id) => id !== "dyn:ramp" && !WRITE_KEY_IDS.includes(id))];
