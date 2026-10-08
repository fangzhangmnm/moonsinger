// credits.ts —— 署名 / 许可证推演（纯函数）：这一份东西里用到了谁的声音，推成一段最小的署名文字。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08「wishlist：导出和保存（包括pack, unpack）的时候加一个license和credit推演工具，只用最minimal的。reference里面的东西不算」。
// 两个范围（按「这份东西里实际带着谁的字节」算）：
//   file  = 歌（.mxl）里带着字节的音源 = 打包进来的 SoundFont 子集（台上 + 候补都算：字节都在文件里）。
//           弱引用的音源、月读 / 元音版（家族模型包 / app 随带的表，歌里只钉哈希）= 引用，不算（「reference里面的东西不算」）。
//   audio = 一段混好的声音（mp3）：这次真出了声的声部，上场那位是谁就算谁（月读也算：她的声音在里面）。
// 来源只看歌里 by value 的署名快照（候选的 credit：音源库条目 / sf2 INFO / 月读 CREDIT 块），**不联网查**；推演是提示，不拦存 / 不拦导出（家规「不许规训用户」）。
import type { Credit } from "./contract.ts";
import type { Extras } from "./project.ts";

export interface CreditLine { who: string[]; attribution: string[]; license: { name: string; url?: string } }
type Json = Record<string, unknown>;
const cands = (r: Json | undefined): Json[] => ((r?.candidates as Json[] | undefined) ?? []);
const creditOf = (c: Json): Credit | null => { const k = c.credit as Credit | undefined; return k && Array.isArray(k.attribution) ? k : null; };

function group(items: { name: string; credit: Credit }[]): CreditLine[] {
  const out = new Map<string, CreditLine>();
  for (const { name, credit } of items) {
    const attribution = credit.attribution.map((s) => String(s).trim()).filter(Boolean);
    const license = { name: String(credit.license?.name ?? "unknown"), ...(credit.license?.url ? { url: String(credit.license.url) } : {}) };
    if (!attribution.length && license.name === "unknown") { const k = `?${name}`; out.set(k, { who: [name], attribution: [], license }); continue; }   // 什么都没写的：照样列出来（让人知道它没署名信息）
    const k = JSON.stringify([attribution, license]), had = out.get(k);
    if (had) { if (!had.who.includes(name)) had.who.push(name); } else out.set(k, { who: [name], attribution, license });
  }
  return [...out.values()];
}
/** 歌（.mxl）里带着字节的音源的署名。 */
export function fileCredits(extras: Extras): CreditLine[] {
  const items: { name: string; credit: Credit }[] = [];
  for (const r of Object.values(extras.lounge)) for (const c of cands(r)) {
    const i = c.instrument as { engine?: string; source?: { embedded?: string | null } } | undefined;
    if (i?.engine !== "soundfont" || !i.source?.embedded || !extras.sounds[i.source.embedded]) continue;
    const credit = creditOf(c); if (credit) items.push({ name: String(c.name ?? ""), credit });
  }
  return group(items);
}
/** 一段混好的声音里的署名：roles = 这次真出了声的声部的角色 id（各取上场那位）。 */
export function audioCredits(extras: Extras, roles: readonly string[]): CreditLine[] {
  const items: { name: string; credit: Credit }[] = [];
  for (const role of new Set(roles)) {
    const r = extras.lounge[role], c = cands(r).find((x) => x.id === r?.active); if (!c) continue;
    if ((c.instrument as { engine?: string } | undefined)?.engine === "unknown") continue;
    const credit = creditOf(c); if (credit) items.push({ name: String(c.name ?? ""), credit });
  }
  return group(items);
}
/** 推成纯文字（可直接贴进作品说明）：每组首行「谁 — 许可证」，下面逐行署名（月读的署名块自带换行，原样保留），组间空一行。空 = ""。 */
export function creditsText(lines: readonly CreditLine[]): string {
  return lines.map((l) => {
    const lic = l.license.name === "unknown" ? "许可证不明" : `${l.license.name}${l.license.url ? ` ${l.license.url}` : ""}`;
    return [`${l.who.join("、")} — ${lic}`, ...(l.attribution.length ? l.attribution : ["（没有署名信息）"])].join("\n");
  }).join("\n\n");
}
