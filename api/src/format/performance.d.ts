import type { Credit, Spec } from "./contract.ts";
/** 滚奏每秒几下能调到的范围（v0.16.64；乐器页 ±2 一档）。数的默认（鼓 12 / 有音高 14）在 template.ts。 */
export declare const ROLL_HZ_MIN = 4, ROLL_HZ_MAX = 40;
/** 小月相：谱上的记号 → 唱法核心认的字前记号（^ = 顿一下、不换气；v = 换气；O = 大口换气）、放在哪个字前（this = 这个字，next = 下一个字）。
 *  user「跳音就是顿一下」「嗯重音也顿」「月读在那儿换气」。同一个字前面有几个：换气优先（v / O 本来就带一个空当）。出厂的那一张在 template.ts。 */
export type SingMark = {
    mark: "^" | "v" | "O";
    at: "this" | "next";
};
/** 月读的署名块 + 条款（包内 LICENSE 要求显示；出处 = 模型仓 voices/tsukuyomi-chan-zhen.json，经 packs.gen.ts 内嵌）。 */
export declare const TSUKUYOMI_CREDIT: Credit;
/** 月读完整版 = 我们写的引擎（piper 时长接管 + WORLD 重建；唱法 src/singer/sing-core.mjs）；§10.6 vault：指向源码出处 + 文档章节。 */
export declare const TSUKUYOMI_SPEC: Spec;
export declare const VOWEL_SAMPLER_SPEC: Spec;
export declare const SOUNDFONT_SPEC: Spec;
/** 月读模型 = 家族模型包（packId = manifest 的 sha256；app 钉的信任根）。 */
export declare const TSUKUYOMI_MODEL: {
    pack: "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007";
    sha256: string;
};
