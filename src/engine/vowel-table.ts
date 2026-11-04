// vowel-table.ts —— 试听元音表（assets/preview/vowels.json + vowels.pcm16，约 3 MB，随 app 出货）：下载一次，交给录音房的元音采样器。
// created 2026-10-09 by Claude Fable 5.1（原 src/singer/sampler.ts 的 fetchTable；采样器本身搬进了音频线程 src/engine/studio.ts）。
// user「选这个乐器就是意图，然后第一下就响」：表在画好谱之后的空闲时下载，选了月读（元音）就该马上响。
import { _t } from "../i18n/index.ts";
import type { VowelTableMsg } from "./studio-client.ts";
import { getBytes, getJson } from "../resources.ts";


let loading: Promise<VowelTableMsg> | null = null;
/** 下载元音表（只下载一次；失败了下次重试）。 */
export function loadVowelTable(): Promise<VowelTableMsg> {
  if (loading) return loading;
  loading = (async () => {
    // 同站点那一份（resources.ts：官网 / itch = fetch，备用版 = 老实脚本；2026-11-03）
    const [idx, pcm] = await Promise.all([
      getJson<{ sr: number; entries: VowelTableMsg["entries"] }>("assets/preview/vowels.json").catch((e) => { throw new Error(_t("试听元音表：{Error}（先跑 node scripts/gen-preview-vowels.mjs？）", { Error: (e as Error).message })); }),
      getBytes("assets/preview/vowels.pcm16"),
    ]);
    return { sr: idx.sr, entries: idx.entries, pcm: new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength >> 1) };
  })().catch((e) => { loading = null; throw e; });
  return loading;
}
