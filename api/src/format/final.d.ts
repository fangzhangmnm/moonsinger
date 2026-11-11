/** 定稿 mp3 在 zip 里的位置（不压缩；歌库靠 store getPeek 按 entry 名抓）。 */
export declare const FINAL_MP3_ENTRY = ".moonsinger/final.mp3";
/** 总目录 `manifest.final`：这首歌定稿的那一刻记了什么。 */
export interface FinalRecord {
    /** ISO 时刻。 */
    at: string;
    /** 这首歌自己的定稿版本号：每次定稿 +1（改稿不减；user 10-13「我是说歌的自增版本号」）。 */
    rev: number;
    /** 定稿时的 app 版本（壳；只是记一笔）。 */
    app: string;
    /** 定稿时的渲染核心（src/core/version.ts）：version 人定、hash 构建时按核心源码算。想复现这份 mp3 = 用这一版核心（user「还可以锁引擎的版本」）。 */
    core: {
        version: string;
        hash: string;
    };
    /** 定稿那一刻出声内容的指纹（contentFingerprint）：对不上 = 定稿后被改过（旧版 app / 别的软件）→ 这份 mp3 不算数、打开时作废。 */
    fingerprint: string;
    /** 存进歌里的 mp3：路径、字节数、sha256、秒数、参数。 */
    mp3: {
        path: string;
        bytes: number;
        sha256: string;
        secs: number;
        sr: number;
        kbps: number;
        stereo: boolean;
    };
    /** 进了 mp3 的声部（静音 / 独奏按定稿那一刻的视图；user 听到什么就定稿什么）。 */
    parts: string[];
    /** 定稿那一刻不出声的声部（§2.2½ 清单；mp3 里没有它们）。 */
    issues?: {
        part: string;
        why: string;
    }[];
}
/** 定稿内容的指纹的原料：saveMxl 写出来的 / openBytes 读进来的那几份**字符串 + 封面字节**（同一份文件两边算出来一样）。
 *  **全冻**（user 2026-10-16「都冻同意，封面当然进」）：每张纸的 MusicXML 整份（音 + 记号 + 歌词 + 歌名 + 曲段名 + 作者栏 + 许可 + 纸的大小；只剥掉 <encoding>——软件版本和日期每次存都变）、
 *  谱的扩展（编排 / 句号 / 起伏 / 隐藏 / 声部表 / 歌词排法 / 小节号）、休息室（谁上场、怎么演、哼的字）、录音房（推子 / 效果 / 总轨）、嵌的音源（路径里有 sha256）、封面 PNG。
 *  不进指纹的只有：视图态（score.json 的 view）、文件名、参考窗。 */
export interface FingerprintParts {
    /** 纸 id → 这张纸的 MusicXML 全文（按纸 id 排序后算）。 */
    papers: Record<string, string>;
    /** score.json 的 JSON 文本（含 view 也行，这里会去掉）。 */
    scoreExt: string;
    /** 角色 id → 休息室 JSON 文本。 */
    lounge: Record<string, string>;
    /** studio.json 的 JSON 文本。 */
    studio: string;
    /** 嵌的音源的路径（路径里有 sha256）。 */
    sounds: string[];
    /** 封面 PNG 的字节（没有 = null）。 */
    thumbnail: Uint8Array | null;
}
/** MusicXML 只去掉 <encoding>（软件版本 + 日期，每次存都变）：别的全算定稿的内容。 */
export declare function strippedXml(xml: string): string;
/** 出声内容的指纹（sha256）。纯函数：同样的原料同样的指纹。 */
export declare function contentFingerprint(p: FingerprintParts): string;
/** 读进来的 manifest.final 像不像一条记录（旧版 / 别的软件写坏的 = 不认）。 */
export declare function parseFinalRecord(v: unknown): FinalRecord | null;
