// 歌库必须有家（家族规则书 §1 第 13 条，library-needs-a-home §5 守卫；工单 H3）。created 2026-11-03 by Claude Opus 5.5
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, assert, eq } from "./runner.mjs";

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.ts$/.test(n) ? [p] : []; });
const src = walk("src"), read = (p) => readFileSync(p, "utf8");
const store = read("src/app-store.ts"), main = read("src/app/main.ts"), home = read("src/library-home.ts");

describe("歌库必须有家 · 结构守卫", () => {
  it("createStore 全 app 只在 app-store.ts 调一次，provider 非空", () => {
    const hits = src.flatMap((p) => (read(p).match(/\bcreateStore\(/g) ?? []).map(() => p));
    eq(hits.join(), "src/app-store.ts"); eq(hits.length, 1);
    assert(!/provider:\s*null/.test(store), "不许 provider: null");
    assert(/provider: CloudProvider;/.test(store), "buildStore 的 provider 类型非空");
  });
  it("attachStore 只有 ensureAttached 一个调用点；用户路径进不了「没选家就建库」", () => {
    eq((main.match(/\battachStore\(/g) ?? []).length, 1);
    assert(/function ensureAttached\(home: StoreHome/.test(main));
    assert(/function attachForUser\(\): void \{ if \(!hasStore\(\)\) throw/.test(main), "attachForUser 不再顺手建库");
    const open = /async function openGallery\(\)[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
    assert(open.indexOf("ensureHome()") >= 0 && open.indexOf("ensureHome()") < open.indexOf("attachForUser()"), "进歌库先问有没有家");
  });
  it("有没有家：hasHome 只定义在 app-store；入口判定不各自看 signedIn", () => {
    const defs = src.filter((p) => /export const hasHome\b/.test(read(p)));
    eq(defs.join(), "src/app-store.ts");
    const ensure = /async function ensureHome\(\)[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
    assert(/hasHome\(\)/.test(ensure) && !/isSignedIn|signedIn/.test(ensure), "ensureHome 只问 hasHome");
    assert(!/homeKnown/.test(main), "main.ts 不再自己记有没有账号");
  });
  it("选夹受三道管：部署开关、没被套着、浏览器有选夹框", () => {
    assert(/canPickFolder = \(\): boolean => currentPolicy\(\)\.folderGallery && !embedded\(\) && typeof picker\(\) === "function"/.test(home));
    assert(/const asked = pick\(\{ mode: "readwrite" \}\);/.test(home), "选夹框同步起跳（手势）");
  });
  it("开机只 query 权限、绝不弹框；再授权只在手势路径", () => {
    assert(/setFolderOnline\(await folderPermission\(bootFolder, \{ request: false \}\)\)/.test(main));
    const check = /async function checkFolderPermission\(\)[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
    assert(/request: false/.test(check) && !/request: true/.test(check), "回前台也只 query");
  });
  it("还不知道有没有账号 = 不说「只在浏览器里」", () => {
    const f = /async function legacySongs\(\)[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
    assert(/authSettled && !authUnknown \? songsToMoveIn\(requireStore\(\)\) : \[\]/.test(f));
  });
  it("folder provider 只从 app-store 进", () => {
    for (const p of src) if (p !== "src/app-store.ts") assert(!/createFolderProvider/.test(read(p)), `${p} 不许碰 folder provider`);
  });
});
describe("搬家 · 接线守卫（Fable 看 diff 这一步）", () => {
  const flow = /async function moveSongsFlow\(entry: GalleryEntry\)[\s\S]*?\n\}/.exec(main)?.[0] ?? "";
  it("读回来走文件夹本身，不走 store 的本机缓存", () => {
    assert(/readBack: \(id\) => readFromFolder\(entry, id\)/.test(flow));
    assert(/createFolderProvider\(entry\.handle/.test(/export async function readFromFolder[\s\S]*?\n\}/.exec(store)?.[0] ?? ""), "readFromFolder 另开 provider 直读");
  });
  it("旧库实例永远离线：不会把删除排上云", () => {
    assert(/signedIn: \(\) => false, isOnline: \(\) => false/.test(/export function openLegacyLibrary[\s\S]*?\n\}/.exec(store)?.[0] ?? ""));
  });
  it("写新家 = mode new（撞名不覆盖）+ 必须真写进去", () => {
    assert(/zip\(id, \{ mode: "new" \}\)\.save\(bytes, \{ tryPush: true \}\)/.test(flow) && /r\?\.pushed !== true\) throw/.test(flow));
  });
  it("只有全部搬成才退役", () => { assert(/if \(finished\) deviceKvSet\(KV_LEGACY_RETIRED, "1"\)/.test(flow)); });
});
