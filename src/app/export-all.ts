// export-all.ts —— 歌库「全部导出」（家族 ai-docs/20261103-library-needs-a-home.md §4 第 1 步；created 2026-11-03 by Claude Opus 5.5，工单 H；形状同 CatsUp src/app/export-all.ts）。
//   没登录时歌库里的歌只在这台设备的浏览器里：先给一个把它们全部拿走的出口，再谈以后收入口（「先保住已有的作品，再收入口」）。
//   打成一个 zip：一次下几十个单文件会被浏览器拦 / iPad 上弹几十次分享。文件夹结构跟歌库走。歌本身就是 .mxl，别的乐谱软件能直接开；MoonSinger 不加密，没有密文这一路。
//   一首拿不到不算全部成功：结果带名单，宿主如实说（UX 误导 = 数据安全缺陷）。
// 纯函数 + 注入：node 直测。

export interface ExportAllPorts {
  /** 一个文件夹的一帧本地列举（直属的歌 + 子夹全路径；这台没字节的不算）。 */
  listFolder(folder: string): Promise<{ identifiers: string[]; folders: string[] }>;
  /** 这首歌的字节；拿不到 = null。 */
  bytes(identifier: string): Promise<Blob | null>;
  pack(entries: { path: string; data: Uint8Array }[]): Promise<Blob>;
}
export interface ExportAllResult { zip: Blob | null; count: number; failed: string[] }

export async function exportAll(p: ExportAllPorts): Promise<ExportAllResult> {
  const ids: string[] = [], failed: string[] = [];
  const queue = [""];
  while (queue.length) {
    const dir = queue.shift()!;
    try { const f = await p.listFolder(dir); ids.push(...f.identifiers); queue.push(...f.folders); }
    catch { failed.push(dir ? `${dir}/（整个文件夹）` : "（根文件夹）"); }
  }
  const entries: { path: string; data: Uint8Array }[] = [];
  for (const id of ids) {
    try {
      const blob = await p.bytes(id);
      if (!blob) { failed.push(id); continue; }
      entries.push({ path: id, data: new Uint8Array(await blob.arrayBuffer()) });
    } catch { failed.push(id); }
  }
  return { zip: entries.length ? await p.pack(entries) : null, count: entries.length, failed };
}

/** 导出结果说一句人话。 */
export function exportAllSay(r: ExportAllResult, fileName: string): { text: string; bad: boolean } {
  if (!r.count && !r.failed.length) return { text: "歌库里还没有歌", bad: false };
  if (!r.failed.length) return { text: `已导出 ${r.count} 首到 ${fileName}`, bad: false };
  const names = r.failed.slice(0, 5).join("、") + (r.failed.length > 5 ? ` 等 ${r.failed.length} 项` : "");
  return { text: r.count ? `只导出了 ${r.count} 首到 ${fileName}。这些没拿到：${names}` : `没能导出：${names}`, bad: true };
}
