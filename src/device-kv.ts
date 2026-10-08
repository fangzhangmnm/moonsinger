// device-kv —— device 层唯一 localStorage 入口（抄 WeebPaint / WebXiaoHeiWu src/device-kv.ts 的形状）。created 2026-10-08 by Claude Fable 5.1
//
// 纪律：**全 app 禁裸 localStorage**（红线守卫测试 test/redline-guard.test.mjs 守着）——device 层标量一律经本器官。
//   住这里的：storeAttached（这台设备挂过图库 = 开机先建 store 再 initAuth，CatsUp 2026-09-22 教训）、gallery-folder（上次在哪个夹）、
//   last-scene（在书架里离开 → 回来在书架）、diag-log（黑匣子环，经 @internal/gallery diagLog）。
// localStorage 不可用（隐私模式 / 配额）→ try/catch 降级纯内存（本 session 内一致，不跨刷新）。
// key 前缀带 GUID 命名空间（同 origin 兄弟 PWA 共桶防撞；永不碰非自己前缀的键）。

const PREFIX = "moonsinger-5b1e7c0a92d34f6e:";

const _mem = new Map<string, string>();
function _ls(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    ls.getItem(PREFIX + "__probe");
    return ls;
  } catch { return null; }
}

export function deviceKvGet(key: string): string | null {
  const k = PREFIX + key;
  const ls = _ls();
  if (ls) { try { return ls.getItem(k); } catch { /* fall through to memory */ } }
  return _mem.get(k) ?? null;
}

/** v=null 删键。写失败（配额 / 隐私模式中途翻脸）→ 落内存层，绝不 throw（device 层是便利不是红线）。 */
export function deviceKvSet(key: string, v: string | null): void {
  const k = PREFIX + key;
  const ls = _ls();
  if (ls) {
    try {
      if (v == null) ls.removeItem(k); else ls.setItem(k, v);
      _mem.delete(k);
      return;
    } catch { /* fall through to memory */ }
  }
  if (v == null) _mem.delete(k); else _mem.set(k, v);
}

export function deviceKvGetJson<T>(key: string, fallback: T): T {
  const raw = deviceKvGet(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
export function deviceKvSetJson(key: string, v: unknown): void {
  deviceKvSet(key, v == null ? null : JSON.stringify(v));
}

/** 还原出厂：清掉本 app 前缀下全部 localStorage 键（localStorage 只准本文件碰）。返回删掉的键数。 */
export function deviceKvWipeAll(): number {
  let n = 0;
  const ls = _ls();
  if (ls) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(PREFIX)) keys.push(k); }
      for (const k of keys) ls.removeItem(k);
      n = keys.length;
    } catch { /* 隐私模式等：无键可清 */ }
  }
  _mem.clear();
  return n;
}
