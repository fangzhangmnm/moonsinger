export type MoveKind = "move" | "copy";
export interface SongToMove {
    identifier: string;
    kind: MoveKind;
}
/** 这首歌该怎么搬（syncState = 库的列举状态）。null = 不归搬家管。 */
export declare function moveKindOf(syncState: string | undefined): MoveKind | null;
export interface MovePorts {
    /** 旧库里这首的字节；拿不到 = null。 */
    read(identifier: string): Promise<Uint8Array | null>;
    /** 新家里这个身份现在的字节（**从新家真的读**，不走任何本机缓存）；没有 = null。 */
    readBack(identifier: string): Promise<Uint8Array | null>;
    /** 写进新家（撞名不覆盖：身份已被占就抛）。 */
    write(identifier: string, bytes: Uint8Array): Promise<void>;
    /** 从旧库移走（进旧库的回收站，可恢复）。只会对 kind = move 调。 */
    remove(identifier: string): Promise<void>;
    /** 撞名时换一个没人用的身份。 */
    altName(identifier: string): string;
    progress?(done: number, total: number, identifier: string): void;
}
export interface MoveResult {
    /** 字节核过、旧库已移走。 */
    moved: {
        from: string;
        to: string;
    }[];
    /** 字节核过、旧的留着（连着网盘的）。 */
    copied: {
        from: string;
        to: string;
    }[];
    /** 没搬成：旧库里那份一个字节没动。 */
    failed: {
        identifier: string;
        why: string;
    }[];
    /** 新家里已经有了（字节核过），但旧库没移走成：不算丢，但旧库还没空。 */
    stuck: {
        identifier: string;
        why: string;
    }[];
}
export declare const sameBytes: (a: Uint8Array, b: Uint8Array) => boolean;
export declare function moveSongs(songs: SongToMove[], p: MovePorts): Promise<MoveResult>;
/** 这趟搬完，旧库算不算空了（只有全部搬成才退役；连着网盘的留着不影响：它们的正本谱系在网盘）。 */
export declare const moveFinished: (r: MoveResult) => boolean;
/** 结果说一句人话（带名单：UX 误导 = 数据安全缺陷，家族 10-26）。 */
export declare function moveSay(r: MoveResult, home: string, stemOf: (id: string) => string): {
    text: string;
    bad: boolean;
};
