/** 一条 MIDI 消息（只解析用得到的）。vel 0–127。 */
export type MidiMsg = {
    k: "on";
    ch: number;
    note: number;
    vel: number;
} | {
    k: "off";
    ch: number;
    note: number;
} | {
    k: "cc";
    ch: number;
    cc: number;
    value: number;
};
/** 解析一条消息：按下力度 0 = 松开（很多琴这样发松开）；别的（弯音 / 触后 / 系统消息 / 不完整的）= null。 */
export declare function parseMidi(data: ArrayLike<number>): MidiMsg | null;
export type MidiStatus = {
    k: "unsupported";
} | {
    k: "off";
} | {
    k: "asking";
} | {
    k: "denied";
    why: string;
} | {
    k: "on";
    inputs: string[];
};
export interface MidiHandlers {
    /** 一个琴键按下：note = 琴键号（60 = 中央 C），vel = 力度 0–1，id = 这个键的来源 id（松开时同一个）。 */
    down(note: number, vel: number, id: string): void;
    up(id: string): void;
    /** 插上 / 拔掉一台（连上以后才报；连上那一刻已经插着的不报）。 */
    plug?(name: string, on: boolean): void;
    status?(s: MidiStatus): void;
}
export interface MidiKeyboard {
    readonly status: MidiStatus;
    /** 人点了「连接」：问浏览器要许可（第一次会弹浏览器自己的框）。 */
    connect(): Promise<MidiStatus>;
    /** 开 app 时：浏览器已经记住「允许」就静默接上，没记住什么也不做（不弹框）。 */
    resume(): Promise<void>;
}
interface PortLike {
    id: string;
    name?: string | null;
    manufacturer?: string | null;
    state?: string;
    type?: string;
    onmidimessage: ((e: {
        data: Uint8Array | null;
    }) => void) | null;
}
interface AccessLike {
    inputs: {
        forEach(cb: (p: PortLike) => void): void;
    };
    onstatechange: ((e: {
        port: PortLike | null;
    }) => void) | null;
}
export interface MidiNavigator {
    requestMIDIAccess?: (o?: {
        sysex?: boolean;
    }) => Promise<AccessLike>;
    permissions?: {
        query(d: {
            name: string;
        }): Promise<{
            state: string;
        }>;
    };
}
export declare function createMidiKeyboard(h: MidiHandlers, nav?: MidiNavigator): MidiKeyboard;
export {};
