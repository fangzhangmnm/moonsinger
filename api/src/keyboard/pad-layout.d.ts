/** 符号层三页（2026-10-08 Opus 5.5 提、user「可以」）：一页一般放得下（4 列 3 排 = 12），位置固定好记。演奏法 = 上一排音头、下一排长短 / 连断；力度 = 力度、渐强渐弱、音内起伏；记号 = 句号、调号 / 拍号 / 速度（大谱表多换谱表）。 */
export type SymPage = "art" | "dyn" | "mark";
export declare const SYM_PAGES: Record<SymPage, readonly string[]>;
export declare const SYM_PAGE_NAME: Record<SymPage, string>;
export declare const SYM_PAGE_TITLE: Record<SymPage, string>;
/** 写音那一排往外发的按键 id（← → 休止 小节线 呼吸 拉长 退格；符号层开着时退格 = symBackspace；「⋯」里的「换谱表」= staff）。 */
export declare const WRITE_KEY_IDS: readonly string[];
/** 全部按键 id（写字键 + 符号格三页）。「dyn:ramp」是键盘自己的修饰键（渐到的锁），不往外发。 */
export declare const PAD_KEY_IDS: readonly string[];
