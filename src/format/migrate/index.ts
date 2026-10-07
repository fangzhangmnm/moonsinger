// migrate/index.ts —— `.moonsinger/` 各份 JSON 的版本迁移：第 n 版 → 第 n+1 版，每步一个纯函数，读时链式升级到 FORMAT。
// created 2026-10-07 by Claude Fable 5.1。规矩见 src/format/contract.ts 头注释（CatsUp 立宪）。
// 加一步 = 在 MIGRATIONS[kind] 末尾 push 一个函数（下标 n-1 = 从第 n 版升到第 n+1 版）；守卫测试查 MIGRATIONS[kind].length === FORMAT[kind] - 1。
// 写文件永远只写当前版（project.ts）；这里只管读。
import { FORMAT, type FormatFile } from "../contract.ts";

export type Json = Record<string, unknown>;
/** 第 n 版 → 第 n+1 版的纯函数（不碰入参；version 字段由 migrate() 写）。 */
export type Migration = (json: Json) => Json;

export const MIGRATIONS: Record<FormatFile, Migration[]> = {
  manifest: [],
  score: [],
  lounge: [],
  studio: [],
};

/** 读进来的一份 json 升到这一版。比这一版新的不归这里（调用方先拒开）；没有 version 当第 1 版。 */
export function migrate(kind: FormatFile, json: Json): Json {
  let v = Number(json.version ?? 1), out = json;
  while (v < FORMAT[kind]) {
    const step = MIGRATIONS[kind][v - 1];
    if (!step) throw new Error(`[format] no migration for ${kind} v${v} -> v${v + 1}`);
    out = { ...step(out), version: v + 1 };
    v++;
  }
  return out;
}
