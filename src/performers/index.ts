// index.ts —— 装上所有演奏者插件（import 这个文件 = 注册表就齐了）。created 2026-10-14 by Claude Fable 5.1（ADR-0004）
//   加一种演奏者（人类录音 performer:recording、上传的 AI 歌手…）= 加一个文件 + 这里一行；别处不改。
import "./tsukuyomi.ts";
import "./vowel-sampler.ts";
import "./soundfont.ts";
export { performerOf, performerByGuid, performers, addressOf, type PerformerPlugin, type LyricsAbility, type PrepareCtx, type InfoCtx, type RoleCtx, type TrackCtx, type TrackResult, type LightNote, type FixedRange, type AuditionCtx, type AuditionTarget, type Notation } from "./registry.ts";
export { TSUKUYOMI_RANGE } from "./tsukuyomi.ts";
