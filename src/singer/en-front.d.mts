// en-front.mjs 的类型。created 2026-10-07 by Claude Opus 5.5
export function nucleusStarts(tokens: string[]): number[];
export interface EnglishPhonemes { tokens: string[]; ids: number[]; pros: number[][]; sung: boolean[]; wordOf: number[]; nuclei: number[] }
export function makeEnglishFront(o: { g2p: { phonemize(text: string): { tokens: string[]; prosody: number[][] } }; encodeTokens: (t: string[], p: number[][], m: Record<string, number[]>) => { ids: number[]; pros: number[][] }; idMap: Record<string, number[]> }): { phonemizeWords(words: string[]): EnglishPhonemes };
export interface EnEntry { kana: string; notes: [number, number][]; rest?: number; hyph?: boolean; hum?: boolean }
export function wordsOf(entries: EnEntry[]): string[];
export function alignEnglish(entries: EnEntry[], nucleiPerWord: number[]): { entries: EnEntry[]; leadRest: number };
