// 歌词旁显示引擎念成什么（v0.9.34）：读音走唱法核心同一份第 1 步（readingCore），显示整理（prettyReading）。created 2026-10-10 by Claude Opus 5.5
//   真前端核过（node + 检疫桶里的 piper 壳）：「としよりだんごはめを」= … go ha me o（助词注成 ha）、「あかちゃんだんごは」= … go wa；这里用假的前端钉住切法。
import { describe, it, eq } from "./runner.mjs";
import { readingCore } from "../src/singer/sing-core.mjs";
import { prettyReading } from "../src/score/lyric-check.ts";

/** 假前端：字 → 音素（够这几个测试用）。 */
const JA: Record<string, string[]> = { は: ["h", "a"], め: ["m", "e"], を: ["o"], き: ["k", "i"], っ: ["cl"], て: ["t", "e"], ん: ["N_ng"], ご: ["g", "o"], ちゃ: ["ch", "a"] };
const piper = {
  phonemize: (text: string) => { const out: string[] = []; for (let i = 0; i < text.length; i++) { const two = text.slice(i, i + 2); if (JA[two]) { out.push(...JA[two]); i++; } else out.push(...(JA[text[i]] ?? [])); } return { tokens: out, prosody: null, ids: [], pros: [] }; },
  phonemizeZh: () => ({ tokens: ["uo", "tone3", "m", "ən", "tone5"], prosody: null, ids: [], pros: [] }),
};
const e = (kana: string) => ({ kana, notes: [[60, 1]] as [number, number][] });
describe("读音（readingCore）", () => {
  it("一条一个音节；对上了 = labels", () => {
    const r = readingCore({ score: [e("は"), e("め"), e("を")], text: "はめを。", lang: "ja", piper });
    eq(JSON.stringify(r.labels), '["ha","me","o"]');
  });
  it("促音并进下一个音节（っ 自己不是唱的音节）；音节数对不上 = labels null + 念出来的那一串", () => {
    eq(JSON.stringify(readingCore({ score: [e("き"), e("って")], text: "きって", lang: "ja", piper }).labels), '["ki","clte"]');
    const bad = readingCore({ score: [e("き"), e("っ"), e("て")], text: "きって", lang: "ja", piper });
    eq(bad.labels, null); eq(bad.said.join(" "), "ki clte");
  });
  it("几拍的条目 = 几段「-」连；中文带声调；英文不给", () => {
    eq(JSON.stringify(readingCore({ score: [{ ...e("はめ"), moras: 2 }, e("を")], text: "はめを", lang: "ja", piper }).labels), '["ha-me","o"]');
    eq(JSON.stringify(readingCore({ score: [e("我"), e("们")], text: "我们", lang: "zh", piper }).labels), '["uo3","mən5"]');
    eq(readingCore({ score: [e("la")], text: "la", lang: "en", piper }).labels, null);
  });
  it("显示整理：ん = n、促音双写、中文原样", () => {
    eq(prettyReading("ja", "N_ng"), "n"); eq(prettyReading("ja", "clte"), "tte"); eq(prettyReading("ja", "clchi"), "tchi"); eq(prettyReading("ja", "da-N_n"), "da-n");
    eq(prettyReading("zh", "tʂʰaŋ4"), "tʂʰaŋ4");
  });
});
