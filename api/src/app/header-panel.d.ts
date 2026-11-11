import { type EditorState } from "../score/song.ts";
/** 「6/8」→ 拍号；不像拍号 = null。 */
export declare function parseTime(s: string): {
    beats: number;
    beatType: number;
} | null;
export interface HeaderPanelGlue {
    state(): EditorState;
    update(st: EditorState): void;
    /** 改「这首歌怎么看」（这条轨的和弦选项）：宿主走 setSongLook（修改锁的看法，锁着也能切；谱面分家第三刀）。label = 撤销提示里的话。 */
    updateLook(st: EditorState, label: string): void;
    /** 宿主的小菜单（main.ts ctxMenu）：点 [data-v] 的钮 = pick；点外面 = 收。 */
    menu(cls: string, html: string, at: {
        x: number;
        y: number;
    }, pick: (v: string) => boolean | void): void;
    /** 「自动」这一档现在挑的是什么（「低音」「大谱表」…；v0.16.88 按段算）。 */
    autoNow(paperId: string, partId: string): string;
    /** 这一段这个声部最后画成几行（自动八度线那一行只在一行时出现）。 */
    look(paperId: string, partId: string): {
        staves: 1 | 2;
        autoOtt: boolean;
    } | undefined;
    /** 打开原来的速度框：那张纸那位歌手那条上第 index 个 token（速度记号）；fresh = 刚插进去的（速度框里不改就收起 = 撤掉）。 */
    openTempo(paperId: string, partId: string, index: number, fresh: boolean): void;
    /** 歌手的名字（合租那一行的选项用）。 */
    partName(partId: string): string;
}
export declare function createHeaderPanel(g: HeaderPanelGlue): {
    open(paperId: string, partId: string, index: number, at: {
        x: number;
        y: number;
    }): void;
};
