// threads.ts —— 后台线程 / 出声线程的起法自己挑。created 2026-11-03 by Claude Opus 5.5（家族工单 A 第 7 步；规则书 §3 / §3.5）
//   官网 / itch = dist/ 里带内容哈希的文件网址（scripts/build.sh 打的，文件名 --define 进主 bundle）；
//   备用版（file:）= 打包时把每个线程打成一个自给自足的单文件、当字符串烤进 index.html（resources.ts localBundle().threads）→ data: 先（Chromium 实测 ✓），
//     起不来换 blob:（Safari 文献）；都不行 = 报健康（onThreadFail）+ 抛错（调用者已有的报错路走）。
//   data: 起的线程 origin 是 null、自己联不了网也存不住：要的文件由主线程经 resources.ts 读好、核过再交过去（workersFetchSiteFiles() = false 时）。
import { deployment } from "./deployment.ts";
import { siteUrl, localBundle } from "./resources.ts";

export type ThreadName = "singer-worker" | "mp3-worker" | "studio-worklet" | "layout-worker" | "encode-worker";

/** 官网 / itch 的线程文件名（build.sh --define；node 测试里没有 = 空）。 */
function siteFile(name: ThreadName): string {
  const pick = (v: () => string): string => { try { return v(); } catch { return ""; } };
  switch (name) {
    case "singer-worker": return pick(() => __SINGER_WORKER__);
    case "mp3-worker": return pick(() => __MP3_WORKER__);
    case "studio-worklet": return pick(() => __STUDIO_WORKLET__);
    case "layout-worker": return pick(() => __LAYOUT_WORKER__);
    case "encode-worker": return pick(() => __ENCODE_WORKER__);
  }
}
const inFolder = (): boolean => deployment() === "local";
/** 后台线程能不能自己按网址去拿站点里的文件（WORLD / LAME / 模型包）。备用版不能：主线程读好了交过去。 */
export function workersFetchSiteFiles(): boolean { return !inFolder(); }

function utf8Base64(s: string): string {
  const b = new TextEncoder().encode(s);
  const native = (b as unknown as { toBase64?: () => string }).toBase64;
  if (native) return native.call(b);
  let bin = ""; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(bin);
}
const fromBag = new Map<ThreadName, string[]>();
/** 这个线程按顺序试的地址。 */
export function threadUrls(name: ThreadName): string[] {
  if (!inFolder()) { const f = siteFile(name); return f ? [siteUrl(`dist/${f}`).href] : []; }
  let urls = fromBag.get(name);
  if (!urls) {
    const src = localBundle()?.threads[name];
    urls = src ? [`data:text/javascript;base64,${utf8Base64(src)}`, URL.createObjectURL(new Blob([src], { type: "text/javascript" }))] : [];
    fromBag.set(name, urls);
  }
  return urls;
}

const failSubs = new Set<(name: ThreadName, why: string) => void>();
/** 线程起不来（试过所有起法）时通知（宿主说一声 + 进黑匣子）。 */
export function onThreadFail(cb: (name: ThreadName, why: string) => void): () => void { failSubs.add(cb); return () => failSubs.delete(cb); }
export function reportThreadFail(name: ThreadName, why: string): void { for (const cb of failSubs) { try { cb(name, why); } catch { /* 听众出错不影响 */ } } }

/** 起一个 module worker：按顺序试（data: → blob:），同步抛的换下一种；都不行 = 报健康 + 抛。 */
export function startWorker(name: ThreadName): Worker {
  const urls = threadUrls(name); let last: unknown = new Error("没有可用的起法（打包时没带这个线程）");
  for (const u of urls) { try { return new Worker(u, { type: "module" }); } catch (e) { last = e; } }
  const why = `后台线程「${name}」起不来：${(last as Error)?.message ?? last}`;
  reportThreadFail(name, why);
  throw new Error(why);
}
/** 出声线程（AudioWorklet）：按顺序 addModule，起不来换下一种。 */
export async function addWorklet(ctx: BaseAudioContext, name: ThreadName): Promise<void> {
  const urls = threadUrls(name); let last: unknown = new Error("没有可用的起法（打包时没带这个线程）");
  for (const u of urls) { try { await ctx.audioWorklet.addModule(u); return; } catch (e) { last = e; } }
  const why = `出声线程「${name}」起不来：${(last as Error)?.message ?? last}`;
  reportThreadFail(name, why);
  throw new Error(why);
}
