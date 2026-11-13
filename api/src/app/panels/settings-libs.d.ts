export type LibId = "voice" | "gs";
export interface PackView {
    slug: string;
    ready: boolean;
    bytesTotal: number;
    bytesCached: number;
}
export interface VoiceView {
    packs: readonly PackView[];
    /** 文件夹版（双击打开的那一份）：不下载、不导入、不删，这一栏画灰 + 这一句；不是 = null。 */
    folder: string | null;
    source: string;
}
export interface GsView {
    name: string;
    description?: string;
    bytes: number;
    cached: boolean;
    license: {
        name: string;
        summary?: string;
    };
    attribution: string;
    homepage?: string;
    folder: string | null;
    source: string;
}
export interface OwnView {
    sha256: string;
    bytes: number;
    /** 从这块字节里读出来的名字；undefined = 还在读（先出页面、名字后补）；null = 读不出（写 sha256 前 8 位）。 */
    label: {
        preset?: string;
        library?: string;
        presets: number;
    } | null | undefined;
    /** 现在打开的这首歌里谁用着它、打包着没有（附带的一句，不当名字的来源）。 */
    users: readonly string[];
    packed: boolean;
}
/** 模型包的人话名字（「13 再补」第 1 条）：按包的种类（slug 开头）来，不逐个包写死；原名进「?」。 */
export declare function packLabel(slug: string): string;
/** 小月相那一栏。 */
export declare function voiceColumnHtml(v: VoiceView): string;
/** 乐器音色库那一栏（GeneralUser GS）。 */
export declare function gsColumnHtml(v: GsView): string;
/** 一块自己加的音色文件叫什么（「预设名 · 音色库名」；读不出 = sha256 前 8 位；还在读 = 「…」）。 */
export declare function ownLabel(o: Pick<OwnView, "sha256" | "label">): string;
/** 「你自己加的音色文件」那一栏：每个文件一行、单独能删（删了就没了）。 */
export declare function ownColumnHtml(rows: readonly OwnView[], folder: string | null): string;
export interface RenderRow {
    key: string;
    title: string;
    secs: number;
    size: number;
    at: number;
    old: boolean;
    coreVersion: string;
    links: readonly string[];
}
export interface UpkeepView {
    speech: {
        bytes: number;
        budget: number;
        entries: number;
    } | null;
    speechNote: string | null;
    /** 小月相引擎现在占的内存（每条道的 WASM 堆加起来；还没起来 = null）。 */
    engineBytes: number | null;
    gsMemBytes: number;
    renders: {
        rows: readonly RenderRow[];
        bytes: number;
        oldCount: number;
        oldBytes: number;
        coreNow: string;
    } | null;
}
/** 小月相那一组：念过的句子、引擎。 */
export declare function upkeepVoiceHtml(v: Pick<UpkeepView, "speech" | "speechNote" | "engineBytes">): string;
/** 乐器音色库那一组：清内存（文件不动）。 */
export declare function upkeepGsHtml(memBytes: number): string;
/** 渲染好的声音那一组：一首一行、「清」在行尾；日期跟界面语言；正文只写「旧版本渲的」，版本号进「?」。 */
export declare function upkeepRendersHtml(r: UpkeepView["renders"], keep: number): string;
/** 声音设备、软件、诊断日志三组（钮的 data-v 和原来一样）。「检查更新」不在这里：它和版本号一起在每一页底下（「13 再补」第 6 条）。 */
export declare function upkeepRestHtml(o: {
    canShare: boolean;
    diagText: string;
}): string;
export interface LibsHost {
    ask(title: string, msg: string, ok: string, danger?: boolean): Promise<boolean>;
    info(msg: string): void;
    error(msg: string): void;
    /** 现在打开的这首歌里，删了这个库会不出声的声部名（只引用、没打包的）。 */
    silencedBy(lib: LibId | {
        sha256: string;
    }): string[];
    /** 这个库现在在设备上占多大（问之前写进面板）。 */
    sizeOf(lib: LibId | {
        sha256: string;
    }): number;
    voice: {
        delete(): Promise<void>;
        install(onPct: (p: number) => void): Promise<void>;
    };
    sounds: {
        delete(sha256: string): Promise<void>;
        installGs(onPct: (p: number) => void): Promise<void>;
        releaseMemory(): void;
        gsSha: string;
    };
    speech: {
        clear(): Promise<void>;
    };
    lanes: {
        restart(): void;
    };
    renders: {
        clearAll(): Promise<void>;
        clearOld(): Promise<{
            count: number;
            bytes: number;
        }>;
        clear(index: number): Promise<boolean>;
    };
    audio: {
        revive(): Promise<boolean>;
    };
    shell: {
        check(): Promise<void>;
        reset(): Promise<void>;
    };
    diag: {
        view(): void;
        copy(): void;
        download(): void;
        share(): void;
        clear(): void;
    };
    /** 改完了：重量重画（哪一块）。 */
    refresh(what: "sound" | "upkeep"): void;
    /** 「它的缓存在维护里」/ 维护里的组名：跳到另一页的那一栏 / 那一组。 */
    goto(page: "sound" | "upkeep", lib: LibId): void;
    /** 「全文…」：小月相的署名与使用条款全文（原文 + 译文）。 */
    doc(lib: "voice"): void;
    progress(text: string): void;
}
/** 按下一颗钮（data-v）。认得 = true（宿主就不用再管）；不认得 = false。 */
export declare function libAction(h: LibsHost, v: string): Promise<boolean>;
/** 维护页上的钮（守卫：按下去都不许让任何一首歌少东西）。 */
export declare const UPKEEP_ACTIONS: readonly ["goto:sound:", "sp:clear", "eng:restart", "snd:mem", "rc:clear", "rc:old", "rc:del:", "audio:revive", "check", "reset", "diag:view", "diag:copy", "diag:download", "diag:share", "diag:clear"];
