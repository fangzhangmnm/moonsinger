import { type EditorState } from "../score/song.ts";
import type { Layout } from "../render/engrave.ts";
interface Host {
    get(): EditorState;
    set(next: EditorState): void;
}
export declare class MarkEditor {
    private host;
    private layout;
    private rerender;
    private box;
    private input;
    private list;
    private id;
    private fresh;
    private initial;
    private kind;
    private pending;
    private metro;
    private ok;
    private wheelBox;
    private wheel;
    /** 节拍器摆杆：一个自激的摆，频率追着试听的速度走（W-12；src/ui/metronome.ts）。raf = 0 = 没在摆。 */
    private metroRaf;
    private metroS;
    private metroBpm;
    private metroLast;
    system: number;
    constructor(parent: HTMLElement, host: Host, layout: () => Layout | null, rerender: () => void);
    get open(): boolean;
    /** 键盘路由来的动作（src/keyboard/keys.ts 的「记号框」那几行）。 */
    act(a: "commit" | "cancel"): void;
    private indexNow;
    /** 打开下标 i 的记号。fresh = 刚插进去的（没改就收起 = 撤掉）。 */
    openAt(i: number, fresh?: boolean): void;
    private fill;
    /** 速度：换试听值——节拍器按它摆（重新起摆，和数字对得上），候选高亮它那一档；框里的数字、滚轮跟上（改的那一边不动）。 */
    private setPending;
    /** 速度：「确定」= 把试听值写进谱、收起。 */
    private confirmTempo;
    /** 重画之后把框挪回那个记号下面（记号没了 = 收起）。 */
    reposition(): void;
    private apply;
    private remove;
    /** 收起：框里打了合法的新值就先改（速度例外：没按「确定」= 不改）。 */
    commitAndClose(): void;
    private metroGo;
    private metroStop;
    /** 收起不改；新插的记号没改过 = 撤掉。 */
    close(): void;
}
export {};
