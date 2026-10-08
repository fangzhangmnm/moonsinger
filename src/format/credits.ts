// credits.ts —— 署名 / 许可证推演（纯函数）：用到了谁的声音，推成一段最小的署名文字。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08「wishlist：导出和保存（包括pack, unpack）的时候加一个license和credit推演工具，只用最minimal的。reference里面的东西不算」；
//   口径（user 当天澄清）：「reference 里面的东西不 我说的是未来的参考窗」「我觉得算出来的是你渲染的mp3用了谁的。所以冷板凳的不算。但是参加了演出的不管是打包的还是弱引用都算。
//   然后打包的关于这个源文件分发的license是另外一回事。可以分开算」「以及有track没出声的不算」。所以两块、分开算：
//   演出署名（performerCredits）= 渲染出来的声音里用了谁：真出了声的声部，上场那位（打包 / 弱引用一样算；月读也算）；冷板凳（没上场的候选）不算；有声部没出声的不算。
//   打包分发的许可（packedLicenses）= 文件（.mxl）里带着谁的源文件字节（打包的 SoundFont 子集；冷板凳的打包字节也在文件里，也算）——分发这份文件要守的，和演出署名是两回事。
//   以后的参考窗里的素材都不算。
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
/** 演出署名：roles = 真出了声的声部的角色 id（调用方给：导出 mp3 = 这次渲染出了声的；预览 = 现在会出声、有音的），各取上场那位；打包 / 弱引用一样算。 */
export function performerCredits(extras: Extras, roles: readonly string[]): CreditLine[] {
  const items: { name: string; credit: Credit }[] = [];
  for (const role of new Set(roles)) {
    const r = extras.lounge[role], c = cands(r).find((x) => x.id === r?.active); if (!c) continue;
    if ((c.instrument as { engine?: string } | undefined)?.engine === "unknown") continue;   // 没人能演 = 没出声
    const credit = creditOf(c); if (credit) items.push({ name: String(c.name ?? ""), credit });
  }
  return group(items);
}
/** 打包分发的许可：歌（.mxl）里带着字节的源文件（打包的 SoundFont 子集；台上 + 冷板凳都算——字节都在文件里）。 */
export function packedLicenses(extras: Extras): CreditLine[] {
  const items: { name: string; credit: Credit }[] = [];
  for (const r of Object.values(extras.lounge)) for (const c of cands(r)) {
    const i = c.instrument as { engine?: string; source?: { embedded?: string | null } } | undefined;
    if (i?.engine !== "soundfont" || !i.source?.embedded || !extras.sounds[i.source.embedded]) continue;
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
