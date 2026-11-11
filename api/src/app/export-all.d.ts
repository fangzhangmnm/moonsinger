export interface ExportAllPorts {
    /** 一个文件夹的一帧本地列举（直属的歌 + 子夹全路径；这台没字节的不算）。 */
    listFolder(folder: string): Promise<{
        identifiers: string[];
        folders: string[];
    }>;
    /** 这首歌的字节；拿不到 = null。 */
    bytes(identifier: string): Promise<Blob | null>;
    pack(entries: {
        path: string;
        data: Uint8Array;
    }[]): Promise<Blob>;
}
export interface ExportAllResult {
    zip: Blob | null;
    count: number;
    failed: string[];
}
export declare function exportAll(p: ExportAllPorts): Promise<ExportAllResult>;
/** 导出结果说一句人话。 */
export declare function exportAllSay(r: ExportAllResult, fileName: string): {
    text: string;
    bad: boolean;
};
