import type { Command } from "../score/commands.ts";
import type { Mark } from "../score/perform.ts";
export type PadKeyAction = {
    kind: "cmd";
    cmd: Command;
} | {
    kind: "mark";
    mark: "key" | "time" | "tempo";
} | {
    kind: "menu";
    menu: "groove" | "repeat" | "clef" | "ottava" | "pedal";
};
/** 一个按键 id 该做什么；不认识的 = null（键盘加了格子、这里没接 = test/pad-keys.test.ts 红）。mods.ramp = 「渐到」亮着（只对力度有意义）。 */
export declare function padKeyAction(id: string, mods?: {
    ramp: boolean;
}): PadKeyAction | null;
/** 这个按键写的是台上那位要「认」的哪种记号（perform.ts 的 Mark；符号格画灰 + 「不认」提示按它查）；不是记号 = null。 */
export declare function markOfKey(id: string): Mark | null;
