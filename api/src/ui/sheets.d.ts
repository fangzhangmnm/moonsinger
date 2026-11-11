export declare function isBusyActive(): boolean;
export declare function withBusy<T>(label: string, fn: () => Promise<T> | T): Promise<T>;
export declare function setBusyText(label: string): void;
interface GateAction<T> {
    label: string;
    value: T;
    primary?: boolean;
}
export interface GateOpts<T> {
    title: string;
    message: string;
    note?: string;
    showSpinner?: boolean;
    actions: GateAction<T>[];
}
export declare const gateGeneration: () => number;
export declare function lockSyncGate<T = string>({ title, message, note, showSpinner, actions }: GateOpts<T>): Promise<T>;
export declare function unlockSyncGate(): void;
export declare function settleSyncGate(value: unknown): void;
export declare const isGateOpen: () => boolean;
/** 锁屏位空了才回（已经空着 = 马上回）。更新重载等人答完冲突面用（2026-11-03，工单 H2）。 */
export declare const whenGateClosed: () => Promise<void>;
export declare const isSheetOpen: () => boolean;
/** 关掉当前开着的交互 sheet（= 取消）。 */
export declare function closeSheet(): void;
export interface ConfirmOpts {
    okLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}
/** 问一句：true = 点了 okLabel；取消 / 背板 / Esc = false。 */
export declare function openConfirmSheet(title: string, message: string, opts?: ConfirmOpts): Promise<boolean>;
export interface InputOpts {
    defaultValue?: string;
    placeholder?: string;
    okLabel?: string;
    message?: string;
}
/** 输入一行：字符串 = 确定；null = 取消。 */
export declare function openInputSheet(title: string, opts?: InputOpts): Promise<string | null>;
/** onPick：在点击事件里**同步**调（sheet 关掉之前）——登录跳转这种必须站在用户手势里起跳的动作用它（WeebPaint / WXHW 同款）。 */
export interface Choice<T> {
    label: string;
    value: T;
    primary?: boolean;
    danger?: boolean;
    hint?: string;
    onPick?: () => void; /** 这里用不了：画灰、点不动（说明写在 hint 或正文里，家族规则书 §1 第 6 条）。 */
    off?: boolean;
}
/** 选一个：value = 点了那个；null = 取消。 */
export declare function openChoiceSheet<T>(title: string, message: string, choices: Choice<T>[]): Promise<T | null>;
export {};
