// part-show.ts —— 声部显示成什么（名字、谱前的简写）：**唯一出口**（施工单 12-4）。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。user「全部声部里面翻译没有跟，以及好好想一下声部到底要不要自动翻译」→ 统筹提「名字和乐器分开」→ user「同意」。
//   谱、下拉框、混音台、小卡、声部管理、提示、撤销的话、导出的文件名、MusicXML 的 <part-name> 都从这里拿（守卫：test/part-show.test.ts，别处不许自己拼声部名、不许读角色的 name）。
//   - 起了名字（角色的 name）= 原样，什么语言都不翻。
//   - 没起 = 这件乐器的叫法：概念里按值存的 score（谱上的叫法），按传进来的语言（= 「谱上的字」那一项，跟着界面时就是界面语言）。
//   - 缺那种语言时的次序写死在 conceptLabel 一处：谱上的叫法里那种语言的 → 百科名里那种语言的（首字母大写）→ 谱上的叫法里英文的。
//   - 重名的加号（Piano 1 / Piano 2）也在这里（src/score/roles.ts numberParts）。
//   - 简写：起了名字 = 名字自己缩；没起 = 概念里按值存的那种语言的简写（目录只有英文的）；没有 = 中文 / 日文叫法本身照定宽缩、英文从叫法缩。
//   运行时只认概念：不比名字、不查目录、不认老预设（老文件进门时已经补成概念，src/format/migrate/index.ts loungeRoleNames）。
import type { Song } from "../score/song.ts";
import type { Lang } from "../i18n/strings.ts";
import type { LoungeRoleV2 } from "./contract.ts";
import { numberParts } from "../score/roles.ts";
import { DEFAULT_CONCEPT } from "../gm/default-concept.gen.ts";
import { fitAbbr, shortName } from "../ui/part-colors.ts";

type Concept = NonNullable<LoungeRoleV2["concept"]>;
/** 休息室里一个角色（只看显示要的几个键；extras.lounge 的值是宽松的 JSON）。 */
type RoleLook = { name?: unknown; sound?: unknown; concept?: Concept };
/** 歌里还没有这个角色的快照 = 新建时会得到的那一位（src/format/project.ts defaultRole：没起名字、目录里的人声）。 */
const NEW_ROLE: RoleLook = { concept: DEFAULT_CONCEPT as Concept, sound: DEFAULT_CONCEPT.ids.musicxml ?? "voice.vocals" };
const roleLook = (lounge: Record<string, unknown>, role: string): RoleLook => (lounge[role] as RoleLook | undefined) ?? NEW_ROLE;
/** 百科名首字母大写、去掉括号里的（同 src/gm/catalog.ts roleNameOf 的做法）。 */
const cap = (s: string): string => s.replace(/\s*\([^)]*\)/g, "").trim().replace(/^./, (ch) => ch.toUpperCase());

/** 这件乐器在某种语言里写成什么（统筹定的次序，只此一处）：谱上的叫法里那种语言的 → 百科名里那种语言的（首字母大写）→ 谱上的叫法里英文的。 */
export function conceptLabel(c: Concept, l: Lang): string {
  const own = c.score?.[l], wiki = (c.name as Partial<Record<Lang, string>>)[l];
  return own || (wiki ? cap(wiki) : "") || c.score?.en || cap(c.name.en);
}
/** 用户给这个角色起的名字；没起 = null。 */
export function roleGivenName(lounge: Record<string, unknown>, role: string): string | null {
  const n = roleLook(lounge, role).name;
  return typeof n === "string" && n ? n : null;
}
/** 这个角色此刻显示成什么（不带重名的号；拿不到声部的地方用，比如还没建好的新声部）。 */
export function roleShowName(lounge: Record<string, unknown>, role: string, l: Lang): string {
  const r = roleLook(lounge, role);
  return roleGivenName(lounge, role) ?? (r.concept ? conceptLabel(r.concept, l) : "");
}
/** 名字没起时空着的那一栏里灰字写什么（= 这件乐器的叫法）。 */
export function roleInstrumentLabel(lounge: Record<string, unknown>, role: string, l: Lang): string {
  const r = roleLook(lounge, role);
  return r.concept ? conceptLabel(r.concept, l) : "";
}

export interface PartShow { name: string; abbr: string }
/** 每个声部（和 song.parts 一一对应）显示成什么：名字（重名的带号）+ 谱前的简写。l = 「谱上的字」那一项换成的语言（跟着界面 = 界面语言）。 */
export function partShow(song: Song, lounge: Record<string, unknown>, l: Lang): PartShow[] {
  const rs = song.parts.map((p) => roleLook(lounge, p.role)), given = song.parts.map((p) => roleGivenName(lounge, p.role));
  const names = numberParts(rs.map((r, k) => ({ name: given[k] ?? (r.concept ? conceptLabel(r.concept, l) : ""), sound: String(r.sound ?? "") })));
  return names.map((name, k) => ({ name, abbr: abbrOf(rs[k]!, given[k] !== null, name, l) }));
}
/** 只要名字（重名的带号）。 */
export const partNames = (song: Song, lounge: Record<string, unknown>, l: Lang): string[] => partShow(song, lounge, l).map((x) => x.name);
/** 某一个声部的名字（重名的带号）；不在这首歌里 = 按角色算（不带号）。 */
export function partNameOf(song: Song, lounge: Record<string, unknown>, l: Lang, partId: string): string {
  const k = song.parts.findIndex((p) => p.id === partId);
  return k < 0 ? partId : partNames(song, lounge, l)[k]!;
}
/** 某个角色在这首歌里的名字（第一个用它的声部，带号）；歌里没有用它的声部 = 不带号。 */
export function roleNameIn(song: Song, lounge: Record<string, unknown>, l: Lang, role: string): string {
  const k = song.parts.findIndex((p) => p.role === role);
  return k < 0 ? roleShowName(lounge, role, l) : partNames(song, lounge, l)[k]!;
}

/** 谱前的简写（定宽，src/ui/part-colors.ts fitAbbr）。名字后面的号（Piano 2）跟着。 */
function abbrOf(r: RoleLook, named: boolean, label: string, l: Lang): string {
  const m = / (\d+)$/.exec(label), base = m ? label.slice(0, -m[0].length) : label, num = m ? ` ${m[1]}` : "";
  if (named) return fitAbbr(shortName(base), num);   // 起了名字 = 名字自己缩（不套乐器的简写：名字是用户的）
  const own = r.concept?.abbr?.[l];
  if (own) return fitAbbr(own, num);
  return fitAbbr(l === "en" ? shortName(base) : base, num);   // 目录没有那种语言的简写：中文 / 日文叫法本身照定宽缩（不现编）；英文从叫法缩
}
