// factory-reset.ts —— 「还原出厂设置…」：本 app 在这台设备上的全部本地足迹清成新装（家族规矩 2½，家族根 CLAUDE.md；user 2026-10-21「全家swipe的语义统一，然后full swipe应该有二次确定护栏，而且是开发者菜单里面」）。
//   created 2026-10-21 by Claude Fable 5.1。形状抄 WeebPaint src/factory-reset.ts。
//   范围 = ① store 的命名空间 `moonsinger.*`（库口子 wipeAppNamespace：IDB 各分区 + 同前缀 localStorage；逐字确认在库内比对）
//        ② 自家派生缓存库 moonsinger-thumbs / moonsinger-facts / moonsinger-speech（CLAUDE.md 持久层白名单表里那三个，全删可再生）
//        ③ 自家 GUID 前缀库 `moonsinger-5b1e7c0a92d34f6e.*`（gallery-registry 等）+ device-kv 的 localStorage 键（deviceKvWipeAll）
//        ④ 自己的离线壳（只注销管着本页的 SW、只删 `moonsinger-` 前缀的 Cache；pwa-shell.clearOwnShell）→ reload。
//   不碰：家族共享的 `pwa-models`（小月相模型包）/ `pwa-sounds`（音源）；云端（OneDrive）上的歌；本机文件。
//   护栏 = 两步、不硬拦：① 说明 sheet（有 N 首还没传上去会一起删掉、不造逃生副本；手里的歌没存也丢；可取消）② 逐字确认（输入那一句，库内比对，不对不执行）。
//   删不掉的库（别的标签页开着）= 报出来、不 reload（关掉再来一次，幂等）。
import { _t } from "../i18n/index.ts";
import { wipeAppNamespace, scanAppNamespace } from "../app-store.ts";
import { APP_ID, APP_DB_PREFIX, CACHE_DBS, LEGACY_CACHE_DBS } from "../config.ts";
import { deviceKvWipeAll } from "../device-kv.ts";
import { openConfirmSheet, openInputSheet } from "../ui/sheets.ts";

/** 逐字确认那一句（和 WeebPaint 同一句，全家一个口令）。 */
export const CONSENT_PHRASE = _t("删除全部本地数据");
/** 自家派生缓存库（白名单表登记的三个；名字唯一来源 = config.ts CACHE_DBS，gallery-host.ts / singer/worker.ts 引的就是它——test/factory-reset.test.ts 守）。 */
export const OWN_DBS = [CACHE_DBS.thumbs, CACHE_DBS.facts, CACHE_DBS.speech] as const;
const BLOCKED_TIMEOUT_MS = 2000;

export interface FactoryResetDeps {
  /** 进过歌库（store 建着）？ */
  attached(): boolean;
  /** 还没传上去的歌有几首（dirty.count()：从没传过的 + 传过改了没推的合计）。没建 store = 0。 */
  dirtyCount(): Promise<number>;
  /** 手里这首改过还没存？ */
  openUnsaved(): boolean;
  /** 动手之前：放下手里的歌的身份、停掉举着 IDB 连接的东西（小月相 worker 的念缓存）、dispose store（不 drain、不造逃生副本）。 */
  prepare(): Promise<void>;
  /** 只清自己的离线壳（pwa-shell.clearOwnShell）。 */
  clearShell(): Promise<void>;
  info(s: string): void;
  report(e: unknown, level: "warning" | "error" | "log"): void;
}
export type FactoryResetOutcome = "cancelled" | "mismatch" | "blocked" | "done";

const isOurDb = (name: string): boolean => (OWN_DBS as readonly string[]).includes(name) || name.startsWith(APP_DB_PREFIX);

function deleteDbOrBlocked(name: string): Promise<"deleted" | "blocked"> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: "deleted" | "blocked") => { if (!settled) { settled = true; resolve(r); } };
    const timer = setTimeout(() => done("blocked"), BLOCKED_TIMEOUT_MS);
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => { clearTimeout(timer); done("deleted"); };
      req.onerror = () => { clearTimeout(timer); done("blocked"); };
    } catch { clearTimeout(timer); done("blocked"); }
  });
}
async function listOurDbs(): Promise<string[]> {
  try {
    if (typeof indexedDB === "undefined" || typeof indexedDB.databases !== "function") return [...OWN_DBS];   // 老平台枚举不了：按已知的三个删（前缀库漏掉 = 诚实缺口，报告里不谎报）
    return (await indexedDB.databases()).map((d) => d.name ?? "").filter(isOurDb);
  } catch { return [...OWN_DBS]; }
}
/** 老库在不在：无版本号 open——不在会触发 oldVersion 0 的升级，当场 abort（什么都不建）；在 = 打开了（马上关）。照 WeebPaint src/storage.ts _openLegacyIfExists。 */
function legacyExists(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    let absent = false;
    try {
      const req = indexedDB.open(name);
      req.onupgradeneeded = (ev) => { if ((ev as IDBVersionChangeEvent).oldVersion === 0) { absent = true; req.transaction?.abort(); } };
      req.onsuccess = () => { try { req.result.close(); } catch { /* 已关 */ } resolve(!absent); };
      req.onerror = (ev) => { (ev as Event).preventDefault?.(); resolve(false); };   // 我们自己 abort 的那次 = 没有；别的错 = 当没有（下次再探）
      req.onblocked = () => resolve(true);
    } catch { resolve(false); }
  });
}
/** 有才删（不盲删：防和同源老 bundle 赛跑——那边还开着就算这次没删成，下次再来）。 */
async function dropIfExists(name: string): Promise<"deleted" | "blocked" | "absent"> {
  if (typeof indexedDB === "undefined" || !(await legacyExists(name))) return "absent";
  return deleteDbOrBlocked(name);
}
/** 派生缓存库改名后的老库（moonsinger-thumbs / facts / speech）：不搬，探到就删。空闲片里一页一次（main.ts）；返回这次删掉的。2026-11-03 家族工单 A2 ⑤ */
export async function dropLegacyCacheDbs(): Promise<string[]> {
  const out: string[] = [];
  for (const name of LEGACY_CACHE_DBS) { try { if ((await dropIfExists(name)) === "deleted") out.push(name); } catch { /* 下次再来 */ } }
  return out;
}
/** 自家足迹深清（store 的命名空间由库口子负责）。 */
async function wipeOwnFootprint(): Promise<{ deleted: string[]; blocked: string[]; lsRemoved: number }> {
  const r = { deleted: [] as string[], blocked: [] as string[], lsRemoved: 0 };
  for (const name of new Set([...(await listOurDbs()), ...OWN_DBS])) ((await deleteDbOrBlocked(name)) === "deleted" ? r.deleted : r.blocked).push(name);
  for (const name of LEGACY_CACHE_DBS) { const g = await dropIfExists(name); if (g === "deleted") r.deleted.push(name); else if (g === "blocked") r.blocked.push(name); }   // 改名前的老名字（有才删）
  r.lsRemoved = deviceKvWipeAll();
  return r;
}

/** 还原出厂主流程（设置 → 开发者 → 「还原出厂设置…」）。全程应用内 sheet。 */
export async function runFactoryReset(d: FactoryResetDeps): Promise<FactoryResetOutcome> {
  // ① 说明（不硬拦：有什么会丢就说什么，人看完能取消）
  let dirtyN = 0;
  if (d.attached()) { try { dirtyN = await d.dirtyCount(); } catch (e) { d.report(e, "log"); } }
  const lines = [_t("删除这台设备上 MoonSinger 的全部本地数据：歌库里的歌（本机副本）、念缓存、封面缓存、设置、诊断日志；离线壳也重装。云端（OneDrive）上的歌和本机文件不受影响。"),
    d.attached() ? (dirtyN > 0 ? _t("有 {dirtyN} 首还没传上去，会一起删掉（不造逃生副本）。", { dirtyN }) : _t("歌库里的歌都传上去了。")) : _t("这台设备没进过歌库。")];
  if (d.openUnsaved()) lines.push(_t("手里这首改过还没存，也会丢。"));
  if (!(await openConfirmSheet(_t("还原出厂设置"), lines.join("\n"), { okLabel: _t("继续"), danger: true }))) return "cancelled";
  // ② 逐字确认（库内比对；不对不执行）
  const typed = await openInputSheet(_t("还原出厂设置"), { placeholder: CONSENT_PHRASE, message: _t("逐字输入「{CONSENT_PHRASE}」确认。这一步做完 app 会重开成新装的样子。", { CONSENT_PHRASE }), okLabel: _t("删除") });
  if (typed == null) return "cancelled";
  if (typed.trim() !== CONSENT_PHRASE) { d.info(_t("输入的不一样，什么都没动。")); return "mismatch"; }   // 先在这儿挡一次（库内还会再比一次）
  try {
    await d.prepare();
    const storeReport = await wipeAppNamespace({ appId: APP_ID, consent: { expected: CONSENT_PHRASE, typed: typed.trim() } });
    const own = await wipeOwnFootprint();
    const scan = await scanAppNamespace(APP_ID);
    const residueOwn = (await listOurDbs()).length;
    const blocked = storeReport.blockedDatabases.length + own.blocked.length;
    if (blocked > 0) {
      await openConfirmSheet(_t("还没删干净"), _t("有 {blocked} 个库被别的标签页占着，删不掉。关掉其他 MoonSinger 标签页（或别的窗口）再来一次——再做一遍是安全的。", { blocked }), { okLabel: _t("好"), cancelLabel: _t("关闭") });
      return "blocked";
    }
    const db = storeReport.deletedDatabases.length + own.deleted.length, ls = storeReport.localStorageKeysRemoved + own.lsRemoved;
    const residue = scan.databases.length + scan.localStorageKeys + residueOwn;
    await openConfirmSheet(_t("还原出厂设置"), residue === 0 ? _t("删了 {db} 个库、{ls} 个键，这台设备上没有残留。点「好」重开。", { db, ls }) : _t("删了 {db} 个库、{ls} 个键；还剩 {residue} 处残留（枚举不到的平台 / 刚被重建），重开后再做一遍就没了。点「好」重开。", { db, ls, residue }), { okLabel: _t("好"), cancelLabel: _t("好") });
    try { await d.clearShell(); } catch (e) { d.report(e, "log"); }   // 壳清失败不挡 reload：数据已归零
    location.replace(`${location.pathname}?reset=${Date.now()}`);
    return "done";
  } catch (e) {
    if ((e as { name?: string })?.name === "WipeConsentError") { d.info(_t("输入的不一样，什么都没动。")); return "mismatch"; }
    d.report(e, "error");
    return "blocked";
  }
}
