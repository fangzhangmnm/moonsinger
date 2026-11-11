export interface SongTrack {
    /** 谁在放（歌库 = 身份）；toggle / 状态按它认。 */
    key: string;
    /** mp3 字节（type 由调用方给，歌库 = audio/mpeg）。 */
    blob: Blob;
    title: string;
    artist?: string;
    album?: string;
    /** 封面图；没有 = 用 fallbackArtwork（app 图标）。 */
    cover?: Blob | null;
    /** 循环那一圈在这份声音里的起止秒（开着循环时放到 end 跳回 start）；没有 = 按整个文件循环。 */
    loopSpan?: {
        start: number;
        end: number;
    } | null;
}
export interface SongPlayerState {
    /** 装着哪首（null = 没有，播放条收起）。 */
    key: string | null;
    paused: boolean;
    time: number;
    duration: number;
    loop: boolean;
}
/** playing = 在放；blocked = 浏览器没让自己开始放（装好了、暂停着，点播放条上的 ▶ 就放）；replaced = 等的时候被下一首 / 停顶掉了。 */
export type PlayResult = "playing" | "blocked" | "replaced";
export interface SongPlayerDeps {
    /** 测试注入假的；不给 = new Audio()。 */
    audio?: HTMLAudioElement;
    /** 不给 = navigator.mediaSession（没有就只在 app 里放）；null = 不接系统控件。 */
    mediaSession?: MediaSession | null;
    makeMetadata?: (init: MediaMetadataInit) => MediaMetadata;
    /** 没封面时锁屏上的图（绝对地址）。 */
    fallbackArtwork?: MediaImage[];
    /** 放的途中坏了（文件坏 / 解不了）：已经停了，告诉人一声。 */
    onError?: (message: string) => void;
    /** 定时器（测试注入假的；不给 = setTimeout / clearTimeout）。 */
    timers?: {
        set: (fn: () => void, ms: number) => unknown;
        clear: (h: unknown) => void;
    };
}
export declare function createSongPlayer(deps?: SongPlayerDeps): {
    arm: () => void;
    play: (t: SongTrack) => Promise<PlayResult>;
    toggle: () => void;
    restart: () => void;
    stop: () => void;
    setLoop: (on: boolean) => void;
    state: () => SongPlayerState;
    /** 在放的那首（暂停 / 没装 = null）。 */
    playing: () => string | null;
    /** 元素建了没有（测试 / 诊断看：没点过 ▶ = false）。 */
    hasElement: () => boolean;
    onChange(fn: () => void): () => void;
};
export type SongPlayer = ReturnType<typeof createSongPlayer>;
/** 一小段静音 WAV（16-bit 单声道）：arm() 拿许可用。 */
export declare function silentWav(ms?: number, sampleRate?: number): Blob;
/** 封面 → 锁屏的图。用 data: 地址不用 blob:（锁屏那边不一定在这个页面里取图，字节带在地址里最稳）；PNG 读得出尺寸就写上。 */
export declare function artworkOf(cover: Blob): Promise<MediaImage[] | null>;
