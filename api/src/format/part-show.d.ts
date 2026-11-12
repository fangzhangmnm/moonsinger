import type { Song } from "../score/song.ts";
import type { Lang } from "../i18n/strings.ts";
import type { LoungeRoleV2 } from "./contract.ts";
type Concept = NonNullable<LoungeRoleV2["concept"]>;
/** 这件乐器在某种语言里写成什么（统筹定的次序，只此一处）：谱上的叫法里那种语言的 → 百科名里那种语言的（首字母大写）→ 谱上的叫法里英文的。 */
export declare function conceptLabel(c: Concept, l: Lang): string;
/** 用户给这个角色起的名字；没起 = null。 */
export declare function roleGivenName(lounge: Record<string, unknown>, role: string): string | null;
/** 这个角色此刻显示成什么（不带重名的号；拿不到声部的地方用，比如还没建好的新声部）。 */
export declare function roleShowName(lounge: Record<string, unknown>, role: string, l: Lang): string;
/** 名字没起时空着的那一栏里灰字写什么（= 这件乐器的叫法）。 */
export declare function roleInstrumentLabel(lounge: Record<string, unknown>, role: string, l: Lang): string;
export interface PartShow {
    name: string;
    abbr: string;
}
/** 每个声部（和 song.parts 一一对应）显示成什么：名字（重名的带号）+ 谱前的简写。l = 「谱上的字」那一项换成的语言（跟着界面 = 界面语言）。 */
export declare function partShow(song: Song, lounge: Record<string, unknown>, l: Lang): PartShow[];
/** 只要名字（重名的带号）。 */
export declare const partNames: (song: Song, lounge: Record<string, unknown>, l: Lang) => string[];
/** 某一个声部的名字（重名的带号）；不在这首歌里 = 按角色算（不带号）。 */
export declare function partNameOf(song: Song, lounge: Record<string, unknown>, l: Lang, partId: string): string;
/** 某个角色在这首歌里的名字（第一个用它的声部，带号）；歌里没有用它的声部 = 不带号。 */
export declare function roleNameIn(song: Song, lounge: Record<string, unknown>, l: Lang, role: string): string;
export {};
