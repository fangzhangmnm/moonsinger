import { type EditorState, type Song, type PartDef } from "../score/song.ts";
import { ScoreView } from "../ui/score-view.ts";
import { Singer } from "../singer/client.ts";
import { type Snapshot } from "./resource-watch.ts";
import { type Mp3Quality } from "../export/mp3.ts";
import { type Extras, type GmCandidate } from "../format/project.ts";
import { type CreditLine } from "../format/credits.ts";
import { StudioClient } from "../engine/studio-client.ts";
import type { TrackSpec } from "../engine/studio.ts";
import { type Timeline, type PerformerInfo } from "../engine/timeline.ts";
import { RenderProgress } from "../ui/render-progress.ts";
/** 胶水向宿主要的东西（main.ts 给）：状态只读访问器 + 几个界面 / 音源 / 署名的口；胶水不碰 DOM、不碰文件、不碰 undo。 */
export interface PerfHost {
    state(): EditorState;
    extras(): Extras;
    viewScope(): "all" | "segment";
    pv(id: string): {
        muted: boolean;
        solo: boolean;
    };
    busMuted(): ReadonlySet<string>;
    curRole(): string;
    docName(): string;
    engine: StudioClient;
    singer: Singer;
    view: Pick<ScoreView, "setPlayhead" | "setStartMark">;
    ui: {
        progress(s: string): void;
        info(s: string): void;
        showError(s: string): void;
        renderBar: RenderProgress;
        playBtns(): HTMLElement[];
        playIcon(playing: boolean): void;
        offerFile(file: File, title: string, msg: string): void;
        onIssues(list: readonly Issue[]): void;
    };
    sounds: {
        resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
        ensureVowels(): Promise<void>;
        soundMemoryBytes(): number;
        modelBases(): string[];
    };
    credits: {
        creditsOf(roles: readonly string[], rights: string | undefined): {
            lines: CreditLine[];
        };
        creditsBlock(lines: CreditLine[], title: string): string;
    };
    /** 这台设备上记着的渲好的声音（src/app/render-cache.ts；2026-11-10 定稿退役，取代原来的 final 口）。只管「整首」。
     *  take = 同一份内容、同一个音质、同样的声部、渲染核心也没变的那一份（带标签的 mp3）；没有 = null → 现渲。keep = 刚渲好的记下来，回记没记成（记不进去宿主自己报进黑匣子，不拦导出）。 */
    renders?: {
        take(o: {
            quality: Mp3Quality;
            parts: readonly string[];
            title: string;
        }): Promise<{
            bytes: Uint8Array;
            secs: number;
            kbps: number;
            stereo: boolean;
            roles: string[];
        } | null>;
        keep(o: {
            quality: Mp3Quality;
            parts: readonly string[];
            title: string;
            roles: string[];
            secs: number;
            kbps: number;
            stereo: boolean;
            loop: {
                start: number;
                end: number;
            } | null;
        }, tagged: Uint8Array): Promise<boolean>;
    };
}
/** 渲染哪一段：view = 跟视图（本段 / 全部，播放用）；all = 整首；segment = 光标所在的这一张纸（导出面板里选）。 */
export type RenderScope = "view" | "all" | "segment";
/** 「这位有事」（ADR-0004 §2.2½ 一套机制、四个出口；user 2026-10-14「一套机制、四个出口 同意」）：现在歌里有音的声部里出不了声的那几位。
 *  kind：unknown = 认不出 / 还没有人上场；sound = 找不到声音（弱引用解析失败）；unplayable = 别的出声失败；upgrade / substitute = 留给格式那一刀（版本比对，§2.2）。 */
export type IssueKind = "unknown" | "sound" | "unplayable" | "upgrade" | "substitute";
export interface Issue {
    part: string;
    role: string;
    label: string;
    kind: IssueKind;
    why: string;
}
export type Performance = ReturnType<typeof createPerformance>;
export declare function createPerformance(host: PerfHost): {
    humOpt: () => Record<string, unknown>;
    resetLatencyLog: () => void;
    playSong: () => Song;
    renderKeep: (o: {
        quality: Mp3Quality;
    }) => Promise<{
        cached: boolean;
        kept: boolean;
        secs: number;
    }>;
    cancelRender: () => void;
    curFlat: () => {
        tokens: import("../score/song.ts").Token[];
        map: import("../score/song.ts").TempoMap;
    };
    songIn: (s: RenderScope) => Song;
    audibleParts: () => PartDef[];
    micOf: (part: PartDef) => {
        gainDb: number;
        pan: number;
    };
    channelOf: (part: PartDef) => {
        gainDb: number;
        pan: number;
    };
    pushChannels: (raw?: boolean) => void;
    lowestMidiOf: (partId: string) => number | null;
    songBpm: () => number;
    performerInfo: (part: PartDef) => PerformerInfo;
    prepare: (scope: RenderScope, o?: {
        chunks?: boolean;
        raw?: boolean;
    }) => Promise<Timeline | null>;
    renderMixForTest: () => Promise<{
        samples: Float32Array;
        right: Float32Array;
        sr: number;
        start: number;
    } | null>;
    playRange: (tl: Timeline) => {
        from: number;
        to: number;
        loopFrom: number;
        loopTo: number;
    };
    tickOfCaret: (paperId: string, part: string, caret: number) => number;
    barHeadTick: (paperId: string, part: string, tick: number) => number;
    startPlayback: (how: "start" | "head" | "resume" | "seam") => Promise<void>;
    playPause: (at?: number) => void;
    resumePlay: () => void;
    pausePlay: () => void;
    replay: () => void;
    playFromHere: (paperId: string, part: string, tick: number) => void;
    playFromHead: () => void;
    playSeam: () => void;
    stopPlay: () => void;
    setLoop: (on: boolean) => void;
    schedulePlaybackRefresh: () => void;
    schedulePrewarm: () => void;
    prepareBank: () => Promise<void>;
    exportRights: (roles: readonly string[]) => {
        rights: string | undefined;
        fellBack: boolean;
    };
    exportSong: (o?: {
        quality: Mp3Quality;
        scope: "all" | "segment";
        keep?: boolean;
    }) => Promise<void>;
    renderMp3: (o: {
        quality: Mp3Quality;
        scope: "all" | "segment";
    }) => Promise<{
        bytes: Uint8Array;
        secs: number;
        sr: number;
        kbps: number;
        stereo: boolean;
        roles: string[];
        parts: string[];
        loop: {
            start: number;
            end: number;
        } | null;
    }>;
    mp3Tag: (roles: readonly string[]) => {
        tag: Uint8Array;
        lines: CreditLine[];
        fellBack: boolean;
    };
    resourceSnapshot: () => Snapshot;
    trimLanesForNewSong: () => void;
    onSongSwitch: () => void;
    jumpPlaybackToPaper: (id: string) => void;
    previewTrack: (track: TrackSpec, to: number, label: string) => Promise<void>;
    budget: import("./resource-watch.ts").Budget;
    TURN_LEADS: readonly [0, 0.3, 0.6, 1, 1.5];
    issues: () => readonly Issue[];
    issueOf: (part: string) => Issue | null;
    issuesText: (list: readonly Issue[]) => string;
    refreshIssues: () => void;
    readonly loopOn: boolean;
    readonly playTl: Timeline | null;
    readonly preparing: boolean;
    readonly paused: {
        sec: number;
        at: {
            paperId: string;
            tick: number;
        } | null;
    } | null;
    readonly startMark: {
        paperId: string;
        tick: number;
    } | null;
    readonly exporting: boolean;
    mixBypass: boolean;
    turnLead: number;
};
