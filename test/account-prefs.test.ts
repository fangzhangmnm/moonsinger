// 跟着歌库走的几样设置（src/app/account-prefs.ts；施工单 20-2 / 20-3，v0.17.46）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：没库只写设备 / 规则甲五种情形 / 没问到歌库那头不往里存 / 读不懂两边不动 / 换库 / 登出 / 别处改了跟着变、自己写的不回声。
import { describe, it, eq, assert } from "./runner.mjs";
import { createAccountPrefs, ACCOUNT_KEYS, type Shelf } from "../src/app/account-prefs.ts";
import { HABIT_DEVICE_KEY, HABITS_ASKED_KEY } from "../src/look/habits.ts";

const NOTATION = HABIT_DEVICE_KEY.notation, MIDDLE_C = HABIT_DEVICE_KEY.middleC, AID = HABIT_DEVICE_KEY.viewInC;

/** 假设备键值。 */
function fakeDevice(init: Record<string, string> = {}) {
  const m = new Map<string, string>(Object.entries(init));
  return { get: (k: string) => m.get(k) ?? null, set: (k: string, v: string | null) => { if (v === null) m.delete(k); else m.set(k, v); }, m };
}
/** 假收藏夹：setItem 同步通知（同库的本地写），remote = 别处的改动拉下来了。 */
function fakeShelf(init: Record<string, unknown> = {}) {
  const m = new Map<string, unknown>(Object.entries(init)); const cbs: ((ids: string[]) => void)[] = []; let writes = 0;
  const shelf: Shelf = {
    getEntry: (id) => (m.has(id) && m.get(id) !== null ? { value: m.get(id) } : undefined),
    setItem: (id, v) => { writes++; m.set(id, v); for (const c of cbs) c([id]); },
    onChange: (cb) => { cbs.push(cb); return () => { const i = cbs.indexOf(cb); if (i >= 0) cbs.splice(i, 1); }; },
  };
  return { shelf, m, writes: () => writes, remote: (id: string, v: unknown) => { m.set(id, v); for (const c of [...cbs]) c([id]); } };
}

describe("跟着歌库走的设置（account-prefs）", () => {
  it("管的键：四样习惯 + 问过了 + 界面语言", () => {
    eq([...ACCOUNT_KEYS].sort().join(","), [...Object.values(HABIT_DEVICE_KEY), HABITS_ASKED_KEY, "lang"].sort().join(","));
  });

  it("没库：只写设备", () => {
    const d = fakeDevice(), a = createAccountPrefs(d);
    a.write(NOTATION, "jianpu"); a.write("lang", "en");
    eq(d.get(NOTATION), "jianpu"); eq(d.get("lang"), "en"); eq(a.bound(), false);
    a.write(NOTATION, null); eq(d.get(NOTATION), null);
  });

  it("规则甲：歌库没有 + 设备选了 = 存进歌库；设备没选 = 不写", () => {
    const d = fakeDevice({ [NOTATION]: "jianpu", [HABITS_ASKED_KEY]: "1" }), s = fakeShelf(), a = createAccountPrefs(d);
    a.bind(s.shelf); const r = a.connect(true);
    eq(r.pushed.sort().join(","), [NOTATION, HABITS_ASKED_KEY].sort().join(","));
    eq(s.m.get(NOTATION), "jianpu"); eq(s.m.get(HABITS_ASKED_KEY), "1");
    assert(!s.m.has(MIDDLE_C) && !s.m.has("lang"), "设备没选的不往歌库写");
    eq(r.adopted.length, 0);
  });

  it("规则甲：歌库有、不一样 = 照歌库改设备；一样 = 不动；歌库写着「没选」= 设备清掉", () => {
    const d = fakeDevice({ [NOTATION]: "staff", [MIDDLE_C]: "4", [AID]: "on" });
    const s = fakeShelf({ [NOTATION]: "jianpu", [MIDDLE_C]: "4", [AID]: "" }), a = createAccountPrefs(d);
    a.bind(s.shelf); const r = a.connect(true);
    eq(r.adopted.sort().join(","), [NOTATION, AID].sort().join(","));
    eq(d.get(NOTATION), "jianpu"); eq(d.get(MIDDLE_C), "4"); eq(d.get(AID), null);
    eq(r.pushed.length, 0); eq(s.m.get(NOTATION), "jianpu", "歌库那份没被设备盖掉");
  });

  it("没问到歌库那头（离线）：只照歌库已有的，不往里存", () => {
    const d = fakeDevice({ [NOTATION]: "jianpu", "lang": "en" }), s = fakeShelf({ lang: "zh" }), a = createAccountPrefs(d);
    a.bind(s.shelf); const r = a.connect(false);
    eq(r.pushed.length, 0); assert(!s.m.has(NOTATION), "设备的没写进歌库");
    eq(r.adopted.join(","), "lang"); eq(d.get("lang"), "zh");
  });

  it("歌库里读不懂（不是字）：两边都不动，报出来", () => {
    const d = fakeDevice({ [NOTATION]: "jianpu" }), s = fakeShelf({ [NOTATION]: 7 }), a = createAccountPrefs(d);
    a.bind(s.shelf); const r = a.connect(true);
    eq(r.unreadable.join(","), NOTATION); eq(d.get(NOTATION), "jianpu"); eq(s.m.get(NOTATION), 7);
  });

  it("接上之后人改的：设备和歌库都写；没选写成空字", () => {
    const d = fakeDevice(), s = fakeShelf(), a = createAccountPrefs(d);
    a.bind(s.shelf); a.connect(true);
    a.write(NOTATION, "jianpu"); eq(s.m.get(NOTATION), "jianpu"); eq(d.get(NOTATION), "jianpu");
    a.write(NOTATION, null); eq(s.m.get(NOTATION), ""); eq(d.get(NOTATION), null);
    a.write("not-ours", "x"); assert(!s.m.has("not-ours"), "不管的键不进歌库");
  });

  it("别处改了：照着改设备、回调拿到键；自己写的不回调", () => {
    const d = fakeDevice(), s = fakeShelf(), a = createAccountPrefs(d), got: string[][] = [];
    a.onRemote((k) => got.push(k)); a.bind(s.shelf); a.connect(true);
    a.write(MIDDLE_C, "3"); eq(got.length, 0, "自己写的不回声");
    s.remote(NOTATION, "jianpu"); eq(d.get(NOTATION), "jianpu"); eq(got.map((g) => g.join(",")).join("|"), NOTATION);
    s.remote("not-ours", "x"); eq(got.length, 1, "不管的键不跟");
  });

  it("换库：A 断开，B（空的）接上 = 设备上从 A 来的值存进 B；之后改的不再写 A", () => {
    const d = fakeDevice(), A = fakeShelf({ [NOTATION]: "jianpu" }), B = fakeShelf(), a = createAccountPrefs(d);
    a.bind(A.shelf); a.connect(true); eq(d.get(NOTATION), "jianpu");
    a.unbind(); a.bind(B.shelf); const r = a.connect(true);
    eq(r.pushed.join(","), NOTATION); eq(B.m.get(NOTATION), "jianpu");
    const before = A.writes(); a.write(NOTATION, "staff"); eq(A.writes(), before, "A 没被写"); eq(B.m.get(NOTATION), "staff");
    A.remote(NOTATION, "jianpu"); eq(d.get(NOTATION), "staff", "A 那头的改动不再跟");
  });

  it("登出（拆库）：之后只写设备，设备留着最后的值", () => {
    const d = fakeDevice(), s = fakeShelf({ lang: "en", [NOTATION]: "jianpu" }), a = createAccountPrefs(d);
    a.bind(s.shelf); a.connect(true); a.unbind();
    eq(a.bound(), false); eq(d.get("lang"), "en"); eq(d.get(NOTATION), "jianpu");
    const before = s.writes(); a.write(NOTATION, "staff"); eq(s.writes(), before); eq(d.get(NOTATION), "staff");
  });
});
