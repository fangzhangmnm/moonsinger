import type { GateReason, GateUi } from "../cloud-gate.ts";
export declare const GATE_TEXT: {
    checking: string;
    skip: string;
    title: string;
    reason: Record<GateReason, string>;
    signIn: string;
    offline: string;
    bar: (n: number) => string;
    barSyncing: string;
    barList: string;
    reconnect: string;
};
export interface GateUiDeps {
    dirtyCount: () => Promise<number>;
    /** 条上「看列表」= 歌库「要处理的」（gallery 0.8.8）。 */
    openList: () => void;
    /** 罩 / 闸收掉之后（把焦点还给谱）。 */
    afterRelease: () => void;
}
export declare function createGateUi(o: GateUiDeps): GateUi;
