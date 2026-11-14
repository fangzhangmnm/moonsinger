// src/app/account-prefs.ts —— 跟着歌库（账号）走的几样设置（施工单第 20 条的 20-2 / 20-3）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   管哪几样：看谱的四样习惯（src/look/habits.ts HABIT_DEVICE_KEY）、「初始设置问过了」（HABITS_ASKED_KEY）、界面语言（device-kv `lang`）。
//   规矩（统筹 2026-11-13 的施工单）：
//   · 没有歌库 = 只存在这台设备上（设备键值，和以前一样）。
//   · 有歌库 = 歌库说了算，设备上留一份副本（读的地方照旧读设备键值：副本永远是现在生效的那个值）。
//   · 连上歌库那一下（规则甲）：歌库里没有这一项 = 把设备上的存进歌库，说一声；歌库里有、和设备上的不一样 = 照歌库的，说一声。
//   歌库那一份 = 库的收藏夹（store.collection，逐项按时间取新的、离线先落本机）；这里只认它的三个口，不 import 库（单元测试用假的）。
//   收藏夹里的值 = 设备键值里同一个字（不换算）；「没选」（跟着软件 / 跟系统）写成空字符串——那是人明着选的，和「歌库里还没有这一项」分开。
//   不是字符串的值 = 读不懂：不照它改设备、也不拿设备的盖掉它（不自愈），报给调用方。
import { HABIT_DEVICE_KEY, HABITS_ASKED_KEY } from "../look/habits.ts";

/** 收藏夹的名字（库存成 `.moonsinger/synced-user-preference.json`；同画画软件那一份的叫法）。 */
export const ACCOUNT_SHELF = "synced-user-preference";
/** 跟着歌库走的键（= 设备键值里的名字 = 收藏夹里的项名）。 */
export const ACCOUNT_KEYS: readonly string[] = [...Object.values(HABIT_DEVICE_KEY), HABITS_ASKED_KEY, "lang"];
/** 收藏夹里「没选」的写法。 */
const NONE = "";

/** 收藏夹要用到的三个口（库的 Collection 结构上满足）。 */
export interface Shelf {
  getEntry(id: string): { value: unknown } | undefined;
  setItem(id: string, value: unknown): void;
  onChange(cb: (changedIds: string[]) => void): () => void;
}
/** 设备键值（读 / 写；null = 删掉这一项）。 */
export interface DeviceSide { get(key: string): string | null; set(key: string, value: string | null): void }

/** 连上歌库那一下做了什么。pushed = 设备的存进了歌库；adopted = 照歌库改了设备；unreadable = 歌库里这一项读不懂（两边都没动）。 */
export interface ConnectReport { pushed: string[]; adopted: string[]; unreadable: string[] }

export interface AccountPrefs {
  /** 改一项（人点的那一下）：设备上写，连着歌库就也写进歌库。null = 没选。 */
  write(key: string, value: string | null): void;
  /** 接上歌库的收藏夹（库建好、收藏夹装好本机那份之后）：从这一刻起写都进歌库，还不比较。 */
  bind(shelf: Shelf): void;
  /** 规则甲（问过一次云端之后）：cloudKnown = 这一次确实问到了歌库那头（没问到 = 只照歌库里已有的，不往里存，免得拿设备的盖掉还没拉下来的）。 */
  connect(cloudKnown: boolean): ConnectReport;
  /** 拆掉歌库（退出登录 / 换库 / 离开文件夹）：之后只写设备；设备上留着最后的值。 */
  unbind(): void;
  /** 连着歌库时，别处（另一台设备）改了某几项、拉下来了：设备副本已经改好，回调拿到改了的键。 */
  onRemote(cb: (keys: string[]) => void): void;
  /** 现在连着歌库吗。 */
  bound(): boolean;
}

export function createAccountPrefs(device: DeviceSide, keys: readonly string[] = ACCOUNT_KEYS): AccountPrefs {
  let shelf: Shelf | null = null, unsub: () => void = () => {}, remoteCb: ((keys: string[]) => void) | null = null;
  const known = new Set(keys);
  /** 歌库里这一项：undefined = 没有；"bad" = 读不懂；否则 = 设备键值的写法（null = 没选）。 */
  const accountOf = (s: Shelf, k: string): string | null | undefined | { bad: true } => {
    const e = s.getEntry(k); if (e === undefined) return undefined;
    return typeof e.value === "string" ? (e.value === NONE ? null : e.value) : { bad: true };
  };
  /** 歌库那头改了：照它改设备副本（一样的 = 什么都不做；自己刚写的也会回到这里，一样，跳过）。 */
  const adopt = (s: Shelf, ids: readonly string[]): string[] => {
    const out: string[] = [];
    for (const k of ids) {
      if (!known.has(k)) continue;
      const a = accountOf(s, k);
      if (a === undefined || (typeof a === "object" && a !== null)) continue;
      if (a !== device.get(k)) { device.set(k, a); out.push(k); }
    }
    return out;
  };
  return {
    write(key, value) {
      device.set(key, value);
      if (shelf && known.has(key)) shelf.setItem(key, value ?? NONE);
    },
    bind(s) {
      unsub(); shelf = s;
      unsub = s.onChange((ids) => { if (shelf !== s) return; const ch = adopt(s, ids); if (ch.length) remoteCb?.(ch); });
    },
    connect(cloudKnown) {
      const r: ConnectReport = { pushed: [], adopted: [], unreadable: [] };
      const s = shelf; if (!s) return r;
      for (const k of keys) {
        const a = accountOf(s, k), d = device.get(k);
        if (a === undefined) { if (cloudKnown && d !== null) { s.setItem(k, d); r.pushed.push(k); } continue; }
        if (typeof a === "object" && a !== null) { r.unreadable.push(k); continue; }
        if (a !== d) { device.set(k, a); r.adopted.push(k); }
      }
      return r;
    },
    unbind() { unsub(); unsub = () => {}; shelf = null; },
    onRemote(cb) { remoteCb = cb; },
    bound: () => shelf != null,
  };
}
