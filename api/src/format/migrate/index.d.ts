import { type FormatFile } from "../contract.ts";
export type Json = Record<string, unknown>;
/** 第 n 版 → 第 n+1 版的纯函数（不碰入参；version 字段由 migrate() 写）。 */
export type Migration = (json: Json) => Json;
export declare const MIGRATIONS: Record<FormatFile, Migration[]>;
/** 读进来的一份 json 升到这一版。比这一版新的不归这里（调用方先拒开）；没有 version 当第 1 版。 */
export declare function migrate(kind: FormatFile, json: Json): Json;
