import type { VowelTableMsg } from "./studio-client.ts";
/** 下载元音表（只下载一次；失败了下次重试）。 */
export declare function loadVowelTable(): Promise<VowelTableMsg>;
