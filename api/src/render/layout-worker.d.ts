import { type EngraveOpts, type Layout } from "./engrave.ts";
import { type RawMeasure } from "./text/index.ts";
import type { Song } from "../score/song.ts";
export interface LayoutJob {
    seq: number;
    song: Song;
    opts: Omit<EngraveOpts, "measure">;
}
export type SvgParts = {
    open: string;
    groups: string[];
    close: string;
};
export type LayoutReply = {
    seq: number;
    parts: SvgParts;
    data: Layout;
    ms: number;
} | {
    seq: number;
    error: string;
};
export declare function runLayoutJob(job: LayoutJob, raw: RawMeasure, now?: () => number): LayoutReply;
