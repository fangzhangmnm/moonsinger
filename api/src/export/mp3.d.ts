export type Mp3Quality = "standard" | "small";
export declare const MP3_QUALITY: Record<Mp3Quality, {
    label: string;
    note: string;
    stereo: boolean;
    kbps: number;
}>;
/** 立体声（right 给了）或单声道。样本拷一份再转移给 worker，原样本（缓存里的）不动。 */
export declare function encodeMp3(left: Float32Array, right: Float32Array | null, sr: number, kbps?: number): Promise<Uint8Array<ArrayBuffer>>;
