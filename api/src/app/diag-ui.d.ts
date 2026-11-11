export declare function copyDiag(pre: HTMLElement | null, status: (text: string) => void): Promise<void>;
export declare const canShareDiag: () => boolean;
/** 下载 .txt（一直有：电脑上 Windows / Edge 也有系统分享，分享出去的 txt 不好找——v0.10.15，user「bug report的电脑上面分享txt应该是下载，或者加一个下载？」）。
 *  不靠猜「是不是电脑」（iPad 接了触控板也报细指针、Windows 也有分享），两个钮都摆出来。 */
export declare function downloadDiag(status: (text: string) => void): void;
export declare function shareDiag(status: (text: string) => void): Promise<void>;
export declare function clearDiag(pre: HTMLElement | null, status: (text: string) => void): void;
