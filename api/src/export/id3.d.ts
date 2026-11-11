export interface Id3Fields {
    title?: string;
    artist?: string;
    copyright?: string;
    copyrightUrl?: string;
    comment?: string;
    software?: string;
    /** APIC 封面图（类型 3 = 正面封面）；mp3 播放器 / 文件管理器显示的那张。2026-10-16 加（定稿的 mp3 连封面一起发行，user「封面当然进」）。 */
    picture?: {
        mime: string;
        bytes: Uint8Array;
    };
}
/** 一整个 ID3v2.3 标签（空字段不写；全空 = 空数组）。拼在 mp3 字节最前面。 */
export declare function id3v2(f: Id3Fields): Uint8Array;
/** 许可文字里第一个网址（给 WCOP）。 */
export declare const firstUrl: (s: string | undefined) => string | undefined;
