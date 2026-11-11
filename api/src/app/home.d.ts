import type { FileHandle } from "./doc-file.ts";
/** 一首歌任一时刻恰好有一个家。 */
export type Home = {
    kind: "gallery";
    identifier: string;
} | {
    kind: "file";
    handle: FileHandle;
    mtime: number | null;
} | {
    kind: "none";
    pendingFolder: string | null;
};
/** 消费点 exhaustive 守卫：switch 落到这儿 = 联合类型加了新成员而这个消费点没跟上。 */
export declare function assertNever(x: never): never;
export type RenameResult = {
    ok: true;
    oldKept?: boolean;
    oldKeptByUser?: boolean;
} | {
    ok: false;
    reason?: "name-collision" | "cancelled";
    where?: "cloud" | "local";
};
/** 宿主注入的四条路：歌库（editor-session + store）/ 本机文件（doc-file）/ 身份拼法 / 问人与副作用。这里零 DOM、零持久化。 */
export interface HomePorts {
    gallery: {
        /** 「存」在歌库里 = 宿主的 smart save（forceSaveAndPush + 登录提示 + 回话都归宿主）。 */
        save(): Promise<void>;
        flushLocal(): Promise<void>;
        flushAndPush(): Promise<void>;
        markDirty(): void;
        adopted(id: string, o: {
            create: true;
        }): void;
        release(): void;
        rename(to: string): Promise<RenameResult>;
        occupied(id: string): Promise<boolean>;
    };
    file: {
        canPickSave(): boolean;
        pickSave(suggestedName: string): Promise<FileHandle | null>;
        writeTo(h: FileHandle, bytes: Uint8Array): Promise<void>;
        mtime(h: FileHandle): Promise<number | null>;
        isStale(seen: number | null, now: number | null): boolean;
    };
    ids: {
        join(folder: string, stem: string): string;
        parse(id: string): {
            folder: string;
            stem: string;
        } | null;
    };
    /** 文件名后缀（.mxl）：给人看的名字用。 */
    suffix: string;
    /** 这首歌现在的 .mxl 字节。 */
    bytes(): Uint8Array;
    /** 有没有要存的改动（文档的脏；修改锁锁着时「只动了看法」的那种脏不算——那时候一个字节都不写，离开也不问）。 */
    dirty(): boolean;
    /** 修改锁（第 ④ 道，2026-11-10 Claude Fable 5.2）：开着的这首此刻锁着吗（src/app/edit-lock.ts；这里不 import 它，照旧全注入）。
     *  锁着 = `save()` 一个字节都不写、回 `{ k: "locked" }`（歌库那条路 editor-session 自己还有一道）。还没有家的不归锁管。不给 = 不锁。 */
    locked?(): boolean;
    /** 新歌刚存成了一个硬盘文件（人自己那一下保存建出来的）：这个句柄生来解着。在把家换成它之前、同一个同步段里叫。 */
    onFileBorn?(handle: FileHandle): void;
    /** 纸上的歌名（可空；没存过时文件名跟着它）。 */
    title(): string;
    /** 新的默认名 `yyyymmdd-hex4`（撞名时拿它的 hex4）。 */
    freshStem(): string;
    ask: {
        /** 「改过还没存，<what>会丢掉」：true = 丢掉继续（宿主的面板自带「先存」，那条路由宿主自己走）。 */
        discard(what: string): Promise<boolean>;
        /** 本机文件在外面被改过：true = 照样覆盖。 */
        overwriteStale(fileName: string): Promise<boolean>;
    };
    /** 没有句柄这回事的设备（iPad / Safari）：递出下载 / 分享面板；点了才算存了（onSaved）。 */
    offerDownload(bytes: Uint8Array, name: string, onSaved: () => void): void;
    /** 落盘成功 = 基线换成现在（D.markSaved）。 */
    markSaved(): void;
    /** 离开时推不上 / 安家落盘失败：报出去（不吞）。 */
    report(e: unknown, level: "warning" | "error"): void;
    /** 家换了（宿主：告诉 store 谁开着、上次开着哪首的指针、重画顶栏）。 */
    onHome(prev: Home, next: Home): void;
    /** 文件名换了（宿主：重画顶栏）。 */
    onName(): void;
}
export type SaveOutcome = {
    k: "blank";
} | {
    k: "gallery";
} | {
    k: "written";
    name: string;
} | {
    k: "locked";
} | {
    k: "declined";
} | {
    k: "cancelled";
} | {
    k: "offered";
    name: string;
};
export type RenameOutcome = {
    k: "renamed";
    stem: string;
    oldKept: boolean;
    oldKeptByUser?: boolean;
} | {
    k: "renameCancelled";
} | {
    k: "same";
} | {
    k: "fileHome";
    name: string;
} | {
    k: "taken";
    where: "cloud" | "local";
};
export type IntoGalleryOutcome = {
    k: "blank";
} | {
    k: "settled";
    identifier: string;
} | {
    k: "moved";
    identifier: string;
    flushed: boolean;
};
export interface HomeKeeper {
    readonly home: Home;
    /** 文件名主干（歌名在谱里，和文件名分开；user「之后各管各的同意」）。 */
    readonly stem: string;
    /** 文件名定下来了没（存过 / 打开的 / 改过名的 = true；没存过 = 跟着歌名走）。 */
    readonly named: boolean;
    /** 歌库里的身份；不在歌库 = null。 */
    identifier(): string | null;
    /** 等着安家的空谱？ */
    pending(): boolean;
    /** 显示 / 存档用的名字：没存过 = 年月日-歌名（没歌名 = 默认名）；定下来的 = stem。 */
    name(): string;
    /** 带后缀的文件名（本机文件 = 句柄的名字）。 */
    fileName(): string;
    /** 换歌：整个家换掉（歌库 → 别处 = 放下 es 的身份）。 */
    load(home: Home, o: {
        stem: string;
        named: boolean;
    }): void;
    /** 存 = 回家，一个动作：歌库 = smart save；本机文件 = 写回（写前 mtime 对表）；还没家 = 安家（保存框 / 下载）；等着安家的空谱 = 有笔先安家再走歌库的存。 */
    save(): Promise<SaveOutcome>;
    /** 改文件名：歌库 = store tryMove（撞名不覆盖）；还没家 = 只改下次存的名字；本机文件 = 改不了。 */
    rename(raw: string): Promise<RenameOutcome>;
    /** 离开现在这首（切歌 / 新建 / 打开别的 / 进歌库）：等着安家的有笔先安家；歌库 = 先落盘 + 推（不问）；本机文件 / 无地 = 改过没存先问。
     *  nextIsGallery = 要切到歌库里另一首：es.open 自己会先存旧的（退出语义），这里不重复推。 */
    leave(what: string, o?: {
        nextIsGallery?: boolean;
    }): Promise<boolean>;
    /** 首笔安家：等着安家的空谱铸身份（文件名 = 歌名或默认名，撞名加 -hex4）→ es 接管（首存 mode:"new"）→ 立刻落本地。单飞；途中换了歌就作罢。 */
    settle(): Promise<void>;
    /** 等着安家的空谱已经有了第一笔 → 先安家（切歌 / 存 / 新建之前；不然那几笔会当无地稿被问「丢掉？」）。 */
    settleIfEdited(): Promise<void>;
    /** 把手里这首（无地 / 本机文件）放进歌库（文件名沿用；撞名加 -hex4）。等着安家的空谱 = 有笔就安家，没笔不塞空壳。 */
    intoGallery(folder: string): Promise<IntoGalleryOutcome>;
    /** 放下歌库里的身份（进歌库 / 被挪夹 / 进了回收站 / 退出登录）→ 还没家。不在歌库 = no-op。 */
    release(): void;
    /** 内容变了（1 s 心跳 + 每次 commit）：歌库 = 告诉 es（autosave 节律）；等着安家的空谱 = 安家。 */
    noteChanged(): void;
}
export declare function createHome(init: {
    home: Home;
    stem: string;
    named: boolean;
}, ports: HomePorts): HomeKeeper;
