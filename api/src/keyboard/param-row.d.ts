/** 一行：名字 + 问号（iPad 点了在这一行下面展开说明；桌面悬停也有）+ 读数 + 控件（滑块 / 开关 / 下拉…）。 */
export declare function paramRow(label: string, hint: string, out: string, control: string, cls?: string): string;
export interface SliderSpec {
    min: number;
    max: number;
    step: number;
    value: number;
    /** 宿主认这根滑块用的属性（`data-gain`、`data-p="hpHz"`…），原样写进去。 */
    attrs: string;
    /** 双击回到的值（滑块上的值）；不给 = 双击不管。 */
    def?: number;
    /** 「双击回 ___」那几个字。 */
    defText?: string;
    /** 灰着、动不了（滚轮 / 双击也不管）。 */
    disabled?: boolean;
}
export declare function slider(s: SliderSpec): string;
/** 在根上挂一次（委托，重画不用重挂）：滚轮、双击、问号。 */
export declare function wireParamRows(root: HTMLElement): void;
