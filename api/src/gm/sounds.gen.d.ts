export interface SoundEntry {
    id: string;
    kind: string;
    name: string;
    description?: string;
    file: string;
    format: string;
    bytes: number;
    sha256: string;
    license: {
        name: string;
        summary?: string;
        file?: string;
        bytes?: number;
        sha256?: string;
    };
    attribution: string;
    homepage?: string;
    source?: string;
    date?: string;
    notes?: string;
}
/** 出厂预填的音源库地址（设置里能改；先找同源 pwa-sounds/）。 */
export declare const SOUNDS_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-sounds";
export declare const SOUNDS: Record<string, SoundEntry>;
