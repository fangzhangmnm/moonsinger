// 还原出厂（src/app/factory-reset.ts）的名字对账：它要删的自家库名 / 前缀必须和真正建库的那几处字面量一致（不然删漏了还报「没有残留」）。created 2026-10-21 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
import { OWN_DBS, CONSENT_PHRASE } from "../src/app/factory-reset.ts";
import { APP_DB_PREFIX, APP_ID } from "../src/config.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };
const src = (p: string) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("还原出厂：删的名字和建库的名字一致", () => {
  it("派生缓存库三个：gallery-host 的 thumbs / facts、singer/worker 的 speech", () => {
    const gh = src("src/gallery-host.ts"), wk = src("src/singer/worker.ts");
    const thumbs = /const THUMB_DB = "([^"]+)"/.exec(gh)?.[1], facts = /const FACTS_DB = "([^"]+)"/.exec(gh)?.[1], speech = /const SPEECH_DB = "([^"]+)"/.exec(wk)?.[1];
    for (const [what, name] of [["thumbs", thumbs], ["facts", facts], ["speech", speech]] as const) { assert(!!name, `${what} 的库名在源码里找得到`); assert((OWN_DBS as readonly string[]).includes(name!), `${what}：${name} 在 OWN_DBS 里`); }
    eq(OWN_DBS.length, 3, "白名单表里就这三个派生缓存库");
  });
  it("自家 GUID 前缀 = device-kv 的 localStorage 前缀同一个 GUID；都以 appId 开头（家族命名规矩 <app>-<guid>.）", () => {
    const kv = /const PREFIX = "([^"]+)"/.exec(src("src/device-kv.ts"))?.[1] ?? "";
    assert(kv.endsWith(":") && APP_DB_PREFIX.endsWith("."), "localStorage 用冒号、IDB 用点");
    eq(kv.slice(0, -1), APP_DB_PREFIX.slice(0, -1), "同一个 <app>-<guid>");
    assert(APP_DB_PREFIX.startsWith(`${APP_ID}-`), "前缀以 appId- 开头");
  });
  it("逐字确认那一句 = 全家同一句", () => { eq(CONSENT_PHRASE, "删除全部本地数据"); });
});
