import type { Side } from "../frame/cell.ts";
export interface Placement {
    side: Side;
    gap: number; /** 同一组里不是第一个的时候的间隔（没写 = gap）：只在同一组接着贴时用，前面是别的东西（如八度点）照旧用 gap。 */
    next?: number; /** 哪一组（没写 = 自己一组）。 */
    group?: string;
}
/** 贴身的东西（一个音一份）。同一边的先后 = 下面的先后。 */
export declare const PLACE: {
    /** 升降号 / 还原号：数字左边；和弦里每个贴它自己那个数字的墨（8-7，note-cell.ts 用 attach 的 from）。 */
    readonly acc: {
        readonly side: "left";
        readonly gap: 0.22;
    };
    /** 琶音的竖波浪：升降号再左边。 */
    readonly arpeggio: {
        readonly side: "left";
        readonly gap: 0.2;
    };
    /** 高八度点：最上面那个数字的顶上（和弦里中间那几个数字的点在叠的时候已经让开了：glyphs.ts stackBases）。 */
    readonly dotHigh: {
        readonly side: "above";
        readonly gap: number;
    };
    /** 跳音（实心窄楔形）：高八度点再上面；第一个离墨 MARK_GAP（样张）。 */
    readonly staccato: {
        readonly side: "above";
        readonly gap: number;
        readonly next: number;
        readonly group: "mark";
    };
    /** 保持（短横）：同上；横本身有粗细，第一个按样张「横离上一条墨 TEN_DY」折算。 */
    readonly tenuto: {
        readonly side: "above";
        readonly gap: number;
        readonly next: number;
        readonly group: "mark";
    };
    /** 气声 / 固定敲一个键的 ×：字形右上（高度按字形表）。 */
    readonly xmark: {
        readonly side: "right";
        readonly gap: 0.0775;
    };
    /** 低八度点：最下面那个数字底下；有下划线 = 下划线底下（8-3 前下划线还不在盒子里：先 reserve 到下划线的底）。 */
    readonly dotLow: {
        readonly side: "below";
        readonly gap: number;
    };
    /** 滚奏三道短斜线：最下面。 */
    readonly roll: {
        readonly side: "below";
        readonly gap: 0.17;
    };
    /** 附点：最后一个字形（数字 / 横线 / 0）右边，高度按字形表（样张：在基线上 0.3 字号）。 */
    readonly augDot: {
        readonly side: "right";
        readonly gap: number;
    };
    /** 换气 V（+「吸 / 深吸」）：最右边。 */
    readonly breath: {
        readonly side: "right";
        readonly gap: 0.35;
    };
};
export type PlaceId = keyof typeof PLACE;
/** 这一组里第 n 个贴（0 起）用多大的间隔。 */
export declare const gapOf: (id: PlaceId, n: number) => number;
/** 数「第几个」按哪一组数。 */
export declare const groupOf: (id: PlaceId) => string;
/** 记号表（render/signs.ts）里贴在「音」上的记号（lane = "note"）在盒子里归哪一行（画在核本身上的 = core：幽灵音 = 数字小一号）。
 *  新加这样的记号没在这里写一行 = 编译不过；test/jianpu-cells.test.ts 核着这张单子和记号表一致（第八刀守卫 3）。 */
export type NoteSignId = "art:staccato" | "art:ghost" | "art:tenuto" | "art:breath" | "art:whisper" | "art:arpeggio" | "art:roll";
export declare const NOTE_SIGN_PLACE: {
    readonly "art:staccato": "staccato";
    readonly "art:tenuto": "tenuto";
    readonly "art:breath": "breath";
    readonly "art:whisper": "xmark";
    readonly "art:arpeggio": "arpeggio";
    readonly "art:roll": "roll";
    readonly "art:ghost": "core";
};
