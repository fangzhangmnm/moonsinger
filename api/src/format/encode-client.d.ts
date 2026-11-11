import { type SaveArgs } from "./project.ts";
/** 编好的一份：.mxl 的字节 + 这份字节里出声内容的指纹（同一趟算出来的；2026-11-10）。 */
export interface Encoded {
    bytes: Uint8Array;
    fingerprint: string;
}
export interface Encoder {
    /** 一份 .mxl 的字节（带内容指纹）。主线程上花的只有结构化克隆（歌 + 休息室 + 参考窗的文件）。 */
    encode(args: SaveArgs): Promise<Encoded>;
    /** 现在是在 worker 里编码吗（设置页 / 诊断用）。 */
    offMain(): boolean;
}
export declare function createEncoder(workerUrl: () => string | URL | null, onFallback: (why: string) => void): Encoder;
