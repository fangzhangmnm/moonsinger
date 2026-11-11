/** `yyyymmdd[-_ ]其余` → { date, title }；不带日期的原样当 title。 */
export declare function splitDatedStem(stem: string): {
    date: string | null;
    title: string;
};
/** 四位消歧码（没起名的歌：`yyyymmdd-hex4`）。 */
export declare const isCodeTitle: (t: string) => boolean;
export interface CoverPlan {
    date: string | null;
    title: string;
    vertical: boolean;
    size: "xl" | "l" | "m" | "s";
    coded: boolean;
    hue: number;
}
/** 歌名怎么排（纯函数，测试用它）：竖 / 横、字号档、底色色相（名字哈希）。 */
export declare function planCover(stem: string): CoverPlan;
/** 没有封面图时垫在下面的那块底色（图库包的占位槽）：只有颜色，不印字——字在上面那一层。 */
export declare function placeholderHtml(stem: string): string;
/** 印在封面上的那一层（图库包的覆盖层槽）：歌名 / 作者 / 日期。底下是封面图还是底色，印法都一样。（底栏的「定稿 N」随定稿 2026-11-10 退役去掉了。） */
export interface CoverExtra {
    artist?: string | null;
    sizeText?: string;
    editedText?: string; /** 日期后面的小标（v0.16.101：「旧」= 这台设备记着的声音是改之前的）。 */
    tag?: string;
    tagTitle?: string;
}
export declare function coverHtml(stem: string, extra?: CoverExtra): string;
