import { type SingCoreKey } from "../format/project.ts";
/** 她的音域（A3–E5）：pad 键底部的提示；元音版同。 */
export declare const TSUKUYOMI_RANGE: {
    readonly lo: 57;
    readonly hi: 76;
    readonly who: string;
};
/** 乐器页「高级：唱法核心的旋钮」（存进候选的 defaults，by value、走 undo；2026-10-15 user「齐平和其他的也都放在高级设置里面可以持久化」）。why = 物理意义（探针 ai-docs/20261013-dango-c10-pop-probe.md §5 / §6）。 */
export declare const SING_CORE_ROWS: {
    key: SingCoreKey;
    label: string;
    values: number[];
    names?: Record<number, string>;
    why: string;
}[];
export declare const tsukuyomi: import("./registry.ts").PerformerPlugin;
