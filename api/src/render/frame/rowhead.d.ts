export interface HeadItem {
    id: string;
    w: number; /** 离前一样多远（第一样 = 离 x0 多远）。 */
    gap: number;
}
/** 每样的左边在哪（和 x0 同一个单位）；最后一样的右边记在 "end"。 */
export declare function layoutHead(x0: number, items: readonly HeadItem[]): Map<string, number>;
