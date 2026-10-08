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
/** 这首歌自己那一条（用户写的那部分：词 / 曲 / 编；user「你计算的时候别忘了用户自己写的那一部分，用户可以选」）：谁 = 歌名、署名 = 作者栏、许可 = 用户选的。
 *  作者栏和许可都空着 = 不出这一条（作者栏的规矩：不提醒、不替用户写）。 */
export function songCreditLine(song: { title?: string; credits?: string; rights?: string }): CreditLine | null {
  if (!song.credits?.trim() && !song.rights?.trim()) return null;
  return { who: [song.title?.trim() ? `「${song.title.trim()}」` : "这首歌"], attribution: (song.credits ?? "").split("\n").map((s) => s.trim()).filter(Boolean), license: { name: song.rights?.trim() || "（没声明许可）" } };
}
/** 这首歌自己的许可的常用选项，从紧到松（文字照抄进 <rights>；选了还能改，也能自己写）。默认 = 未声明 = 法律默认的保留所有权利，不替用户选
 *  （user 2026-10-08「我建议是默认未知，不然用户想做商业闭园或者自定义的，你帮他静默导出了一个mit就比较恶性」「不要只提供开源的选项…有些人还是想要守的比较紧的吧」）。 */
export const RIGHTS_PRESETS: { label: string; note: string; text: (year: number) => string }[] = [
  { label: "保留所有权利", note: "什么都要先问你（法律默认就是这样，这里只是写明）", text: (y) => `© ${y} 保留所有权利` },
  { label: "仅供欣赏", note: "听可以；转载、改编、商用都要先问你", text: (y) => `© ${y} 保留所有权利。仅供个人欣赏，禁止转载、改编、商用。` },
  { label: "商用请联系", note: "保留所有权利，并告诉别人商用怎么找你", text: (y) => `© ${y} 保留所有权利。商用请联系作者。` },
  { label: "CC BY-NC-ND 4.0", note: "注明出处可以原样转发；不许改、不许商用（最紧的 CC）", text: () => "CC BY-NC-ND 4.0 https://creativecommons.org/licenses/by-nc-nd/4.0/" },
  { label: "CC BY-NC 4.0", note: "注明出处可以改；不许商用", text: () => "CC BY-NC 4.0 https://creativecommons.org/licenses/by-nc/4.0/" },
  { label: "CC BY-SA 4.0", note: "注明出处可以改、可以商用；改了的要用同样的许可", text: () => "CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/" },
  { label: "CC BY 4.0", note: "注明出处随便用", text: () => "CC BY 4.0 https://creativecommons.org/licenses/by/4.0/" },
  { label: "CC0", note: "放弃权利，谁都能随便用（发出去收不回）", text: () => "CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/" },
];
/** 推演出来的提醒（只提示，不拦）：这首歌选了允许别人改编 / 当素材再用的许可（CC BY / SA / NC、CC0、公有领域；不许改编的 ND 不算），可里面有月读出声——
 *  月读条款禁止「以允许他人二次利用（当作素材）的形式公开」。是 AI 对条款的理解，不是法律意见：提醒写「可能冲突」。 */
export function licenseHints(rights: string | undefined, performers: readonly CreditLine[]): string[] {
  const reusable = !!rights && (/CC0|public ?domain|公有领域|publicdomain\/zero/i.test(rights) || (/CC[ -]?BY/i.test(rights) && !/\bND\b|-nd\//i.test(rights)));
  const tsukuyomi = performers.some((l) => l.license.name.includes("つくよみちゃん"));
  return reusable && tsukuyomi ? ["这首歌的许可允许别人改编 / 当素材再用，可里面有月读的声音：月读的条款禁止「以允许他人二次利用（当作素材使用）的形式公开」（设置里有条款原文和译文）。这两样可能冲突，请看清楚再发（这是提示，不是法律意见）。"] : [];
}
/** 推成纯文字（可直接贴进作品说明）：每组首行「谁 — 许可证」，下面逐行署名（月读的署名块自带换行，原样保留），组间空一行。空 = ""。 */
export function creditsText(lines: readonly CreditLine[]): string {
  return lines.map((l) => {
    const lic = l.license.name === "unknown" ? "许可证不明" : `${l.license.name}${l.license.url ? ` ${l.license.url}` : ""}`;
    return [`${l.who.join("、")} — ${lic}`, ...(l.attribution.length ? l.attribution : ["（没有署名信息）"])].join("\n");
  }).join("\n\n");
}
