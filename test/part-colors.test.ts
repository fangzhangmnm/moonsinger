// 歌手的类别色 + 谱前简写（v0.9.31；user「我希望有非常克制的color coding， mpl的 tab20？ 然后不同颜色默认绑不同乐器类别」「乐手名和颜色同意」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { categoryOfSound, partColorIndices, shortName, TAB20, fitAbbr, dispWidth, ABBR_W } from "../src/ui/part-colors.ts";

describe("类别色", () => {
  it("sound id 的前缀 = 类别；同一类都用深的那个（v0.10.43；原来第二位用浅的——user「二号同样乐器不要用弱颜色，宁愿用和一号一样的」）", () => {
    eq(categoryOfSound("voice.vocals"), "voice"); eq(categoryOfSound("keyboard.piano"), "keys"); eq(categoryOfSound("pluck.guitar"), "pluck");
    eq(categoryOfSound("drum.group.set"), "perc"); eq(categoryOfSound("pitched-percussion.glockenspiel"), "mallet"); eq(categoryOfSound("whatever.x"), "fx");
    eq(partColorIndices(["voice.vocals", "keyboard.piano", "voice.vocals", "voice.alto"]).join(" "), "2 0 2 2");
    eq(TAB20.length, 20);
  });
});
describe("缩名字（谱前简写的工具；名字 → 简写的规矩在 src/format/part-show.ts，测试 test/part-show.test.ts）", () => {
  it("英文一个词 ≤ 5 个字母原样、长的前三个加点、几个词首字母；中文 / 日文前两个字", () => {
    eq(shortName("Santoor"), "San."); eq(shortName("Bell"), "Bell"); eq(shortName("Lead Synth"), "LS."); eq(shortName("二胡"), "二胡");
  });
});
describe("谱前简写：定宽（v0.9.41；user「没简写的能不能想办法也按定宽裁一下…也要处理定宽」）", () => {
  it("定宽 7（半角 1、汉字 2，号也算）：去掉句点后的空格，还宽就截（拉丁补点、汉字不补）", () => {
    eq(fitAbbr("El. Pno."), "El.Pno."); eq(fitAbbr("Bar. Sax."), "Bar.Sa."); eq(fitAbbr("Frtl. El. B."), "Frtl.E.");
    eq(fitAbbr("Met. Wn Ch."), "Met.Wn."); eq(fitAbbr("Pno.", " 2"), "Pno. 2"); eq(fitAbbr("El. Guit.", " 3"), "El.G. 3");
    eq(fitAbbr("八音盒子"), "八音盒"); eq(fitAbbr("つくよみ"), "つくよ");
    for (const x of ["Frtl. El. B.", "Met. Wn Ch.", "Hnk. Pno.", "C Tin Wh.", "唢呐唢呐唢呐"]) assert(dispWidth(fitAbbr(x)) <= ABBR_W, x);
  });
});
