import { type Extras } from "./project.ts";
export interface CreditLine {
    who: string[];
    attribution: string[];
    license: {
        name: string;
        url?: string;
    };
}
/** 演出署名：roles = 真出了声的声部的角色 id（调用方给：导出 mp3 = 这次渲染出了声的；预览 = 现在会出声、有音的），各取上场那位；打包 / 弱引用一样算。 */
export declare function performerCredits(extras: Extras, roles: readonly string[]): CreditLine[];
/** 打包分发的许可：歌（.mxl）里带着字节的源文件（打包的 SoundFont 子集；台上 + 冷板凳都算——字节都在文件里）。 */
export declare function packedLicenses(extras: Extras): CreditLine[];
/** 这首歌自己那一条（用户写的那部分：词 / 曲 / 编；user「你计算的时候别忘了用户自己写的那一部分，用户可以选」）：谁 = 歌名、署名 = 作者栏、许可 = 用户选的。
 *  作者栏和许可都空着 = 不出这一条（作者栏的规矩：不提醒、不替用户写）。 */
export declare function songCreditLine(song: {
    title?: string;
    credits?: string;
    rights?: string;
}): CreditLine | null;
/** 这首歌自己的许可的常用选项，从紧到松（文字照抄进 <rights>；选了还能改，也能自己写）。默认 = 未声明 = 法律默认的保留所有权利，不替用户选
 *  （user 2026-10-08「我建议是默认未知，不然用户想做商业闭园或者自定义的，你帮他静默导出了一个mit就比较恶性」「不要只提供开源的选项…有些人还是想要守的比较紧的吧」）。 */
export declare const RIGHTS_PRESETS: {
    label: string;
    note: string;
    text: (year: number) => string;
}[];
/** 推演出来的提醒（只提示，不拦）：这首歌选了允许别人改编 / 当素材再用的许可（CC BY / SA / NC、CC0、公有领域；不许改编的 ND 不算），可里面有月读出声——
 *  月读条款禁止「以允许他人二次利用（当作素材）的形式公开」。是 AI 对条款的理解，不是法律意见：提醒写「可能冲突」。 */
export declare function licenseHints(rights: string | undefined, performers: readonly CreditLine[]): string[];
/** 推成纯文字（可直接贴进作品说明）：每组首行「谁 — 许可证」，下面逐行署名（月读的署名块自带换行，原样保留），组间空一行。空 = ""。 */
export declare function creditsText(lines: readonly CreditLine[]): string;
