import { type Pitch } from "../score/pitch.ts";
import { type Command } from "../score/commands.ts";
import { type EditorState } from "../score/song.ts";
import type { Mark } from "../score/perform.ts";
import { Pad, type HintRange } from "../keyboard/pad.ts";
import { type PadMusicHost } from "./pad-music.ts";
import type { InputGate } from "./input-gate.ts";
/** main.ts 给的那一组访问器：谱的状态与写、出声、页 / 模式、鬼音符、锁、披露、符号格要看的、菜单。 */
export interface PadGlue {
    state(): EditorState;
    /** gesture = 撤销并步的名字（同一个名字、挨得近的几下并成一步撤销；单声乐器「后按的算数」用）。 */
    update(next: EditorState, gesture?: string): void;
    /** 写一个音并回刚写的下标（-1 = 没写成）。 */
    writeAndLocate(write: (s: EditorState) => EditorState, gesture?: string): number;
    /** 写了一个音 / 休止 / 拉长之后：锁的「只管下一个」用掉了。 */
    afterWrite(): void;
    /** 改了音高之后响一下。 */
    previewEdited(): void;
    info(msg: string): void;
    /** 单音护栏丢了一个几乎同时按下的键（v0.16.35；user 11-09 小月相两个键同时按有一个不认 → 规矩不改，丢的时候说一声）。宿主决定说不说、说几次。 */
    monoRejected?(): void;
    /** 光标所在声部的乐器能叠音吗。 */
    canStack(): boolean;
    sound: {
        down(p: Pitch, id: string): void;
        up(id: string): void;
    };
    /** pad 音键按下那一刻的事件时刻（手感探针，v0.16.23）；不给 = 不量。 */
    onTouch?(ts: number): void;
    /** 谱上第 i 个音出声（和弦整个响）。 */
    soundTok(s: EditorState, i: number, id: string): void;
    /** 先响后写的补课：按下时已按 sounded 响了，写完成了和弦 = 只补多出来的音；主音变了 = 重响。 */
    soundAfterWrite(s: EditorState, i: number, id: string, sounded: Pitch): void;
    /** 键盘总闸（src/app/input-gate.ts）：现在键盘能不能往谱上写（歌锁着 / 在选乐器 / 人拔着 = 不能，音键只响）。pad 上每个会写谱的键都先问它。 */
    gate: Pick<InputGate, "why" | "may" | "mayWrite">;
    /** 找人视图开着（真对象 finder.isOpen；pad 创建时 finder 还没建，所以是访问器）。 */
    finderOpen(): boolean;
    toggleImpro(): void;
    /** 小键盘顶上「符 / 音」：只换键盘。 */
    kbSwitch(): void;
    ghost: {
        on(): boolean;
        set(id: string, p: Pitch): void;
        delete(id: string): boolean;
        sync(): void;
    };
    /** /2 那把锁：挪光标 = 取消「凑满一份」；拨了长短旋钮 = 取消但不挪回一档；按下 / 松开；命令带上 half。 */
    half: {
        caretMoved(): void;
        knobTurned(): void;
        key(down: boolean): void;
        wrap(c: Command): Command;
    };
    accKey(phase: "down" | "slide" | "up", acc: -2 | -1 | 1 | 2): void;
    stackKey(down: boolean): void;
    discloseArt(prev: EditorState, a: Mark): void;
    discloseDynOverride(prev: EditorState): void;
    /** 光标所在声部台上那位不认的记号。 */
    ignoredHere(): Mark[];
    hintRange(): HintRange;
    staves(): number;
    autoBars: {
        get(): boolean;
        set(on: boolean): void;
    };
    insertMarkHere(kind: "key" | "time" | "tempo"): void;
    insertGrooveHere(): void;
    openRepeatMenu(): void;
    openInsertClefMenu(at: {
        x: number;
        y: number;
    }): void;
    openInsertOttavaMenu(at: {
        x: number;
        y: number;
    }): void;
    showPad(on: boolean): void;
}
export interface PadHostApi {
    pad: Pad;
    music: PadMusicHost;
    /** 电脑键盘的音键也走它：50 ms 护栏。null = 挡掉；否则 = 这一下从哪份谱写起（base）、撤销并步的名字（gesture）、被顶掉的键（replaced，单声乐器「后按的算数」）。
     *  写完叫 monoWrote 记下「写完是哪份谱」（下一下要顶掉它时对得上）。 */
    monoAccept(id: string): MonoTurn | null;
    monoWrote(id: string, turn: MonoTurn): void;
    /** 一个键（手指 / 电脑键）松开了：不再按着（叠音的 B / 根音由 pad 的 onNoteUp 自己定；电脑键只记簿）。 */
    release(id: string): void;
    /** 失焦 / 页面隐藏：抬手的事件可能收不到——观望中的都按「键都松了」定下来（写成单个的音）、根音清空、按着的清空。 */
    reset(): void;
    /** 外接键盘（MIDI）按下一个音：绝对音高，不吃 pad 的升降锁；其余同 pad 音键（写 / 改 / 叠音观望 / 单声护栏 / 弹）。false = 单声护栏没收。 */
    noteDown(p: Pitch, id: string): boolean;
    noteUp(id: string): void;
}
/** 单声护栏给的这一下的写法（见 PadHostApi.monoAccept）。 */
export interface MonoTurn {
    base: EditorState;
    gesture: string;
    replaced?: string;
}
export declare function createPadHost(padEl: HTMLElement, g: PadGlue): PadHostApi;
