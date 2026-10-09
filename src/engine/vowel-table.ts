// vowel-table.ts —— 试听元音表（assets/preview/vowels.json + vowels.pcm16，约 3 MB，随 app 出货）：下载一次，交给录音房的元音采样器。
// created 2026-10-09 by Claude Fable 5.1（原 src/singer/sampler.ts 的 fetchTable；采样器本身搬进了音频线程 src/engine/studio.ts）。
// user「选这个乐器就是意图，然后第一下就响」：表在画好谱之后的空闲时下载，选了月读（元音）就该马上响。
import type { VowelTableMsg } from "./studio-client.ts";

const base = new URL("../assets/preview/", import.meta.url);
let loading: Promise<VowelTableMsg> | null = null;
/** 下载元音表（只下载一次；失败了下次重试）。 */
export function loadVowelTable(): Promise<VowelTableMsg> {
  if (loading) return loading;
  loading = (async () => {
    const [idx, pcm] = await Promise.all([   // no-cache = 每次跟服务器核对（重新生成过的表不吃浏览器缓存）
      fetch(new URL("vowels.json", base), { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`试听元音表：HTTP ${r.status}（先跑 node scripts/gen-preview-vowels.mjs？）`); return r.json() as Promise<{ sr: number; entries: VowelTableMsg["entries"] }>; }),
      fetch(new URL("vowels.pcm16", base), { cache: "no-cache" }).then((r) => r.arrayBuffer()),
    ]);
    return { sr: idx.sr, entries: idx.entries, pcm: new Int16Array(pcm) };
  })().catch((e) => { loading = null; throw e; });
  return loading;
}
