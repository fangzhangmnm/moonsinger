export interface SfxInfo {
    key: number;
    midi?: number;
    centsPerKey?: number;
    align?: boolean;
}
export interface SfKeyInst {
    note?: number;
    sfx?: SfxInfo;
}
/** 写的音（MIDI）→ 敲的键（0–127）。 */
export declare function sfKey(written: number, inst: SfKeyInst, transpose?: number): number;
/** 这个音效能不能「音高对齐」：原速时有听得出的音高（宽带噪声没有）。 */
export declare const canAlign: (s: SfxInfo | undefined) => boolean;
