// test/e2e/fake-fsa.mjs —— 假的「选文件夹」：showDirectoryPicker 给 OPFS 的一个子目录（真句柄，IDB 存得下；folder provider 整条路都是真的）。created 2026-11-03 by Claude Opus 5.5（家族工单 H3）
//   权限：queryPermission 看 localStorage e2ePermLost（跨 reload）；requestPermission = 给（记次数 window.__fsaRequests）。
//   中途掉：window.__fsaLost = true → 目录句柄的取子项抛 NotAllowedError（真机上权限过期就是这样）。
export const FOLDER_NAME = "my-songs";
export const FAKE_FSA = () => {
  const lost = () => localStorage.getItem("e2ePermLost") === "1" || window.__fsaLost === true;
  window.showDirectoryPicker = async () => (await navigator.storage.getDirectory()).getDirectoryHandle("my-songs", { create: true });
  const P = globalThis.FileSystemHandle?.prototype, D = globalThis.FileSystemDirectoryHandle?.prototype;
  if (!P || !D) return;
  P.queryPermission = async () => (lost() ? "prompt" : "granted");
  P.requestPermission = async () => { window.__fsaRequests = (window.__fsaRequests ?? 0) + 1; localStorage.removeItem("e2ePermLost"); window.__fsaLost = false; return "granted"; };
  const deny = () => { const e = new Error("e2e: permission lost"); e.name = "NotAllowedError"; return e; };
  for (const m of ["getFileHandle", "getDirectoryHandle", "removeEntry"]) {
    const real = D[m];
    D[m] = function (...a) { if (window.__fsaLost === true && !window.__fsaProbe) return Promise.reject(deny()); return real.apply(this, a); };
  }
};
/** 夹里有哪些文件（相对路径 → 字节数）。 */
export const folderFiles = (p) => p.evaluate(async (name) => {
  window.__fsaProbe = true;
  try {
    const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(name, { create: true }), out = {};
    const walk = async (d, pre) => { for await (const [n, h] of d.entries()) { if (h.kind === "file") out[pre + n] = (await h.getFile()).size; else await walk(h, `${pre}${n}/`); } };
    await walk(root, "");
    return out;
  } finally { window.__fsaProbe = false; }
}, FOLDER_NAME);
/** 夹里一个文件的字节。 */
export const folderBytes = async (p, path) => Uint8Array.from(await p.evaluate(async ([name, pth]) => {
  window.__fsaProbe = true;
  try {
    let d = await (await navigator.storage.getDirectory()).getDirectoryHandle(name, { create: true });
    const parts = pth.split("/"), file = parts.pop();
    for (const s of parts) d = await d.getDirectoryHandle(s);
    return [...new Uint8Array(await (await (await d.getFileHandle(file)).getFile()).arrayBuffer())];
  } finally { window.__fsaProbe = false; }
}, [FOLDER_NAME, path]));
/** 往夹里直接放一个文件（模拟夹里本来就有）。 */
export const seedFolderFile = (p, path, bytes) => p.evaluate(async ([name, pth, data]) => {
  let d = await (await navigator.storage.getDirectory()).getDirectoryHandle(name, { create: true });
  const parts = pth.split("/"), file = parts.pop();
  for (const s of parts) d = await d.getDirectoryHandle(s, { create: true });
  const w = await (await d.getFileHandle(file, { create: true })).createWritable(); await w.write(new Uint8Array(data)); await w.close();
}, [FOLDER_NAME, path, bytes]);
/** 给一个 context 装假选夹；测试里第一次点「歌库」时选它（存量 E2E 从「不登录点歌库」改过来用）。 */
export async function pickFolderFromEntry(p) {
  await p.click("#libBtn");
  await p.waitForSelector(".offer:not(.gate-sheet) button:has-text('选一个文件夹')");
  await p.click(".offer:not(.gate-sheet) button:has-text('选一个文件夹')");
  await p.waitForFunction(() => { const g = document.getElementById("galleryFull"); return !!g && !g.hidden; }, null, { timeout: 8000 });
}
