import type { SingLang } from "../score/lab-score.ts";
export interface SingRequest {
    type: "sing";
    id: number;
    score: unknown[];
    text: string;
    tempo: number;
    lang: SingLang;
    opt?: Record<string, unknown>;
    breath?: boolean;
    /** true = 回 WORLD 的原样输出（不归一化、不补尾巴）：分段唱时宿主自己拼、整首最后归一化一次（2026-10-08 深夜）。 */
    raw?: boolean;
    /** 模型源，按顺序试（宿主给：同源 pwa-models/ → 设置里的来源）。不给 = 出厂默认。 */
    models?: string[];
    /** 「念」缓存的预算（字节；src/singer/speech-cache.ts）。不给 = 不动。 */
    cacheBytes?: number;
    /** 念缓存持久层（全局池，IndexedDB）的预算（字节）。不给 = 不动。 */
    diskBytes?: number;
    /** 只唱第 entry 个字（按键试听，刀 3）：按下的 midi、唱 secs 秒；回原样（raw）。 */
    only?: {
        entry: number;
        midi: number;
        secs: number;
    };
}
/** 只把引擎起起来（打开歌就起，不等第一句）/ 中途取消某一句（在段与段之间认：两遍 piper 之间、分析三段之间、合成前；正在跑的那一段跑完才停）。 */
export interface WarmRequest {
    type: "warm";
    id: number;
    models?: string[];
    diskBytes?: number;
}
export interface CancelRequest {
    type: "cancel";
    id: number;
}
/** 念缓存持久层：看大小 / 清空（设置页）。不用起引擎。 */
export interface CacheRequest {
    type: "cache";
    id: number;
    op: "info" | "clear";
    diskBytes?: number;
}
/** 读音（歌词旁显示引擎念成什么，v0.9.34）：只注音、分音节，不唱。引擎没起来 / 中文前端没载 / 英文 = ready false（不为了看读音去下模型：重资源要等有意图）。 */
export interface ReadRequest {
    type: "read";
    id: number;
    score: unknown[];
    text: string;
    lang: SingLang;
}
/** 备用版（file: 双击打开）：线程是 data: 起的，origin 为 null、联不了网——要的文件（WORLD、模型包分片）由主线程经 resources.ts 读好、核过交过来（2026-11-03 家族工单 A）。 */
export interface InitRequest {
    type: "init";
    hostFiles: boolean;
}
export interface FileReply {
    type: "file";
    nid: number;
    bytes?: ArrayBuffer;
    error?: string;
}
export type SingReply = {
    type: "need";
    nid: number;
    path: string;
    sha256?: string;
} | {
    type: "progress";
    id: number;
    stage: string;
} | {
    type: "done";
    id: number;
    samples: Float32Array;
    sr: number;
    ms: {
        load: number;
        sing: number;
        boot?: Record<string, number>;
    };
    /** 这条 worker 现在占多少（刀 6 内存监控）：wasm = 三块 WASM 堆（ort / OpenJTalk / WORLD，只涨不落）；cache = 念缓存的字节；
     *  base = 引擎刚加载完那一刻的堆（v0.10.3：worker 自己量——原来主线程拿「第一次回话」当基线，冷启动那次还没唱、唱过的道又已经涨了，两头都不准）。 */
    mem: {
        wasm: number;
        cache: number;
        base?: number;
    };
} | {
    type: "error";
    id: number;
    message: string;
} | {
    type: "cache";
    id: number;
    disk: {
        bytes: number;
        entries: number;
        budget: number;
    } | null;
} | {
    type: "read";
    id: number;
    ready: boolean;
    labels: string[] | null;
    said: string[];
};
