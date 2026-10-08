// test/e2e/cloud-bridge.mjs —— 把 @internal/store/testing 的 mock 云搬到 node 侧，经 Playwright exposeFunction 桥进页面。
//   为什么：mock provider 是内存对象，住在页面里一 reload 就没了；住 node 侧 = 跨 reload、跨多个浏览器 context（= 多台设备）共用同一朵云，
//   还能在 node 这边 injectFault（lostResponse 等）/ hook 挂起某次上传来模拟「推到一半页面死掉」。
//   页面侧 = addInitScript 装一个薄代理 `globalThis.__moonsingerCloud`（CloudProvider 契约逐方法转 RPC；字节走 base64），
//   src/app-store.ts 的 attachStore 只在本机地址上认它（线上没有这条路）。created 2026-10-08 by Claude Fable 5.1
import { createMockProvider } from "@internal/store/testing";

const b64 = (u8) => Buffer.from(u8).toString("base64");
const toU8 = async (v) => v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(await v.arrayBuffer());

/** node 侧：一朵 mock 云 + 把它暴露给一个 browser context（context 里每个页面、每次 reload 都能用）。 */
export async function installCloud(context, cloud = createMockProvider()) {
  await context.exposeFunction("__moonsingerCloudRpc", async (op, args) => {
    try {
      let v;
      switch (op) {
        case "list": v = await cloud.list(args.folder); break;
        case "getItemByPath": v = await cloud.getItemByPath(args.path); break;
        case "getApprootRef": v = await cloud.getApprootRef(); break;
        case "download": v = { b64: b64(await toU8(await cloud.download(args.ref))) }; break;
        case "downloadRange": v = { b64: b64(await toU8(await cloud.downloadRange(args.ref, args.offset, args.length))) }; break;
        case "upload": v = await cloud.upload(args.path, Buffer.from(args.b64, "base64"), args.opts ?? {}); break;
        case "ensureFolder": v = await cloud.ensureFolder(args.path); break;
        case "delete": await cloud.delete(args.ref, args.eTag); v = null; break;
        case "deleteEmptyFolder": v = await cloud.deleteEmptyFolder(args.path); break;
        case "move": v = await cloud.move(args.ref, args.targetFolderRef, args.opts ?? {}); break;
        case "copy": v = await cloud.copy(args.ref, args.targetFolderRef, args.newName); break;
        case "rename": v = await cloud.rename(args.ref, args.newName, args.eTag ?? null); break;
        default: throw new Error("cloud-bridge: unknown op " + op);
      }
      return { ok: true, v };
    } catch (e) { return { ok: false, message: e?.message ?? String(e), status: e?.status, name: e?.name }; }
  });
  await context.addInitScript(() => {
    const rpc = async (op, args) => {
      const r = await globalThis.__moonsingerCloudRpc(op, args);
      if (r.ok) return r.v;
      const e = new Error(r.message); if (r.status != null) e.status = r.status; if (r.name && r.name !== "Error") e.name = r.name; throw e;
    };
    const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const toB64 = async (v) => { const u8 = v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : typeof v === "string" ? new TextEncoder().encode(v) : new Uint8Array(await v.arrayBuffer()); let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    globalThis.__moonsingerCloud = {
      list: (folder = "") => rpc("list", { folder }),
      getItemByPath: (path) => rpc("getItemByPath", { path }),
      getApprootRef: () => rpc("getApprootRef", {}),
      download: async (ref) => new Blob([fromB64((await rpc("download", { ref })).b64)]),
      downloadRange: async (ref, offset, length) => fromB64((await rpc("downloadRange", { ref, offset, length })).b64),
      upload: async (path, blob, opts = {}) => rpc("upload", { path, b64: await toB64(blob), opts }),
      ensureFolder: (path) => rpc("ensureFolder", { path }),
      delete: (ref, eTag) => rpc("delete", { ref, eTag }),
      deleteEmptyFolder: (path) => rpc("deleteEmptyFolder", { path }),
      move: (ref, targetFolderRef, opts = {}) => rpc("move", { ref, targetFolderRef, opts }),
      copy: (ref, targetFolderRef, newName) => rpc("copy", { ref, targetFolderRef, newName }),
      rename: (ref, newName, eTag = null) => rpc("rename", { ref, newName, eTag }),
    };
  });
  return cloud;
}
