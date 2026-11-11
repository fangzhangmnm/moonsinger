export interface FileHandle {
    name: string;
    getFile(): Promise<File>;
    createWritable(): Promise<{
        write(data: BlobPart): Promise<void>;
        close(): Promise<void>;
    }>;
}
/** 拿到手的一个文件：字节 + （桌面 Chromium）句柄 + 打开那一刻的 lastModified（没有句柄的 = 只是参考，不会再写回）。 */
export interface Picked {
    name: string;
    bytes: Uint8Array;
    handle: FileHandle | null;
    mtime: number | null;
}
/** 认不认这个文件名（打开 / 拖进来 / 双击都看它）。 */
export declare const accepts: (name: string) => boolean;
export declare const canPickOpen: () => boolean;
export declare const canPickSave: () => boolean;
/** 选一个文件打开。null = 用户取消了（AbortError ≠ 环境不支持——取消就到此为止，不降级再弹 input）。 */
export declare function pickOpen(): Promise<Picked | null>;
/** 读一个句柄（选的 / 拖的 / 双击的都走这）：字节 + 打开那一刻的 mtime。 */
export declare function readHandle(h: FileHandle): Promise<Picked>;
/** 问用户存到哪（桌面 Chromium）。null = 用户取消了；没有这个能力时不要调（canPickSave() 先判）。必须在用户手势里调（先开框再编码）。 */
export declare function pickSave(suggestedName: string): Promise<FileHandle | null>;
/** 把字节写进这个文件（整份覆盖；createWritable = 浏览器先写临时文件、close 时原子替换）。 */
export declare function writeTo(h: FileHandle, bytes: Uint8Array): Promise<void>;
/** 句柄现在的 lastModified（写前对表用）。读不到（句柄失效等）→ null，调用方自己决定敢不敢写。 */
export declare function mtime(h: FileHandle): Promise<number | null>;
/** 陈旧对表：上次看到的和现在的都在、而且不一样 = 文件在外面被改过。任一边不知道（null）= 不算陈旧（不拿「不知道」吓人）。 */
export declare const isStale: (seen: number | null, now: number | null) => boolean;
/** 拖进来的文件：⚠ 必须在 drop 事件里**同步**调（事件返回 / 第一个 await 之后 dataTransfer.items 就空了）——
 *  这里只同步抓住 File 和句柄的 promise，真正读字节在 fromGrab 里 await。只认第一个认得的文件；没有 = null（不拦这次 drop）。 */
export interface Grab {
    file: File;
    handle: Promise<FileHandle | null>;
}
export declare function grabDrop(dt: DataTransfer): Grab | null;
export declare function fromGrab(gr: Grab): Promise<Picked>;
/** 安装态 PWA 的「双击 .mxl 用 MoonSinger 打开」（manifest file_handlers）。浏览器缓存 launch 事件，boot 后再 setConsumer 也收得到。
 *  非安装态 / 不支持 → 静默 no-op。 */
export declare function consumeLaunchFiles(cb: (h: FileHandle) => void): void;
