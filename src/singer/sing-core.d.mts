// sing-core.mjs 的类型（手写，随 sing-core.mjs 一起改）。created 2026-10-06 by Claude Opus 5.5
export interface ScoreEntry { kana: string; notes: [number, number][]; rest?: number; before?: "^" | "v" | "O"; moras?: number }
export interface PiperLike {
  SR: number; HOP: number;
  phonemize(text: string): { tokens: string[]; prosody: unknown; ids: number[]; pros: number[][] };
  phonemizeZh(text: string): { tokens: string[]; prosody: unknown; ids: number[]; pros: number[][] };
  encode(tokens: string[], prosody: unknown): { ids: number[]; pros: number[][] };
  run(ids: number[], pros: number[][], o: { noiseScale?: number; lengthScale?: number; noiseW?: number; override?: number[] | null; lang?: string; preset?: number }): Promise<{ audio: Float32Array; durations?: Float32Array }>;
}
export interface WorldLike {
  analyze(x: ArrayLike<number>, fs: number, o?: { framePeriod?: number; f0Floor?: number; f0Ceil?: number }): { frames: number; fft: number; bins: number; f0: Float64Array; sp: Float64Array; ap: Float64Array };
  synth(a: { f0: Float64Array; sp: Float64Array; ap: Float64Array; fft: number; fs: number; framePeriod: number }): Float64Array;
}
export interface AtlasSet { set: string; midi: number; framePeriodMs: number; entries: unknown[]; data: Float32Array; [k: string]: unknown }
export declare const DEFAULT_OPT: Record<string, unknown>;
export declare function singCore(a: {
  score: ScoreEntry[] | unknown[]; text: string; tempo: number; lang?: "ja" | "zh"; transpose?: number; phrasing?: "score" | "punct" | "none";
  atlas?: string; mix?: number; breath?: boolean; preset?: number; piper: PiperLike; world: WorldLike;
  loadAtlas?: ((id: string) => Promise<AtlasSet>) | null; opt?: Record<string, unknown>; log?: (s: string) => void;
}): Promise<{ sung: Float32Array; y: Float64Array; x: Float32Array; SR: number; finish: (sig: ArrayLike<number>) => Float32Array; internals: Record<string, unknown> }>;
