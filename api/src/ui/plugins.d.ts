import { type ParamDef } from "../engine/fx.ts";
import type { FxV2 } from "../format/contract.ts";
export type Params = Record<string, number>;
/** 「+」里能插的（任何轨、任何位置）。 */
export declare const PLUGIN_KINDS: readonly ["eq", "comp", "reverb", "delay", "chorus", "gain"];
/** 每条轨默认那一格 EQ 的 id：没碰过 = 不在文件里（引擎没有 = 平）；碰了才写进链的最前面。能关、能换面板，不能删（user「默认会帮你开一个，你可以换但不能删」）。 */
export declare const DEFAULT_EQ_ID = "eq";
export declare const pluginName: (kind: string) => string;
/** 全量面板：原语参数表的每一个 + 主线程换算的那几个。 */
export declare function fullParams(kind: string): ParamDef[];
export declare function defaults(kind: string): Params;
/** 一格的参数（缺的补参数表的默认；第 16 条起「原声」没写也是参数表的默认，和录音房同一个意思——原来按 1 − 湿 算）。 */
export declare const paramsOf: (fx: FxV2) => Params;
/** 这一格是不是「全湿」（原声 0、湿 100%：当发送的返回轨用；出到它 = 原声没了）。 */
export declare const fullyWet: (fx: FxV2) => boolean;
export interface SimpleControl {
    id: string;
    label: string;
    hint: string;
    kind: "knob" | "toggle" | "choice";
    min?: number;
    max?: number;
    step?: number;
    choices?: {
        v: number;
        label: string;
    }[];
    fmt?: (v: number) => string;
}
export interface SimpleView {
    controls: SimpleControl[];
    /** 全量参数正好落在一键的公式上 = 一键面板的读数；不是（在全量里调过）= null。 */
    read(p: Params): Record<string, number> | null;
    /** 一键面板的值 → 全量参数（只改公式管的那几个，别的照留）。 */
    write(v: Record<string, number>, p: Params): Params;
    /** 全量参数（落不到公式上）→ 最接近的一键值（v0.10.14；user「basic模式下应该有一个project to basic模式的功能，不然的话basic模式会是被锁住，免得不小心override」）。 */
    project(p: Params): Record<string, number>;
}
/** 房间大小 → 混响时间 RT60（秒；低频那一截衰减 60 dB 要多久）：反馈 = 0.7 + 0.28·room，每过一遍梳状衰减 20·log10(反馈) dB。 */
export declare const rt60OfRoom: (room: number) => number;
export declare const roomOfRt60: (t: number) => number;
/** 高频吸收 → 从多少 kHz 开始衰减（梳状里那个一阶低通的截止；按 48 kHz 算，约数）。 */
export declare const dampKHz: (damp: number) => number;
export declare const dampOfKHz: (k: number) => number;
/** 线性倍数 ↔ dB（−60 dB 及以下 = 关）。 */
export declare const linDb: (x: number) => number;
export declare const dbLin: (d: number) => number;
/** 每个参数干什么用（面板上的 tooltip + iPad 能点的小问号；user「每个参数能不能加一个tooltip解释一下是干什么用的」「然后参数后面加一个小的方块问号这样ipad也可以点」）。 */
export declare const PARAM_HINT: Record<string, string>;
/** 全量面板里一个参数的旋钮：滑块用的物理量纲 ↔ 存的值。 */
export interface ParamView {
    hint: string;
    label: string;
    min: number;
    max: number;
    step: number;
    toV: (s: number) => number;
    toS: (v: number) => number;
    fmt: (v: number) => string;
}
export declare function paramView(kind: string, d: ParamDef): ParamView;
export declare const SIMPLE: Record<string, SimpleView>;
export declare const SIMPLE_BUS: Record<string, SimpleView>;
/** 这一格用哪套一键面板（onBus = 在路由轨上）。 */
export declare const simpleView: (kind: string, onBus?: boolean, keyed?: boolean) => SimpleView | undefined;
/** 这一格用哪套一键面板（看插件种类、在不在路由轨上、有没有「被谁压」）。 */
export declare const viewOfFx: (fx: Pick<FxV2, "kind" | "key">, onBus?: boolean) => SimpleView | undefined;
/** 「改成最接近的一键」：全量参数 → 最接近的一键值 → 按一键公式写回（公式不管的参数照留）。结果一定读得回一键（plugins.test 钉着）。 */
export declare function projectToSimple(kind: string, onBus: boolean, p: Params, keyed?: boolean): Params;
/** 新插一格的初始参数：一键面板的「中间值」（插上就有一点效果，一眼能听出它在干什么）。 */
export declare function freshParams(kind: string, onBus?: boolean): Params;
/** 一格在卡片上的一句话（插件格小钮上的字）。 */
export declare function fxSummary(fx: FxV2, onBus?: boolean): string;
export { autoLowCutHz, resolveChain } from "../engine/chain.ts";
