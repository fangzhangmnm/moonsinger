import "../performers/index.ts";
import { type SaveArgs } from "./project.ts";
export type EncodeJob = {
    seq: number;
    args: SaveArgs;
};
export type EncodeReply = {
    seq: number;
    bytes: Uint8Array;
    fingerprint: string;
    ms: number;
} | {
    seq: number;
    error: string;
};
export declare function runEncodeJob(job: EncodeJob, now?: () => number): EncodeReply;
