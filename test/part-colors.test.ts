// 歌手的类别色 + 谱前简写（v0.9.31；user「我希望有非常克制的color coding， mpl的 tab20？ 然后不同颜色默认绑不同乐器类别」「乐手名和颜色同意」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { categoryOfSound, partColorIndices, partAbbr, shortName, TAB20, fitAbbr, dispWidth, ABBR_W } from "../src/ui/part-colors.ts";

describe("类别色", () => {
  it("sound id 的前缀 = 类别；同一类第一位深色、第二位浅色、再往后轮回", () => {
    eq(categoryOfSound("voice.vocals"), "voice"); eq(categoryOfSound("keyboard.piano"), "keys"); eq(categoryOfSound("pluck.guitar"), "pluck");
    eq(categoryOfSound("drum.group.set"), "perc"); eq(categoryOfSound("pitched-percussion.glockenspiel"), "mallet"); eq(categoryOfSound("whatever.x"), "fx");
    eq(partColorIndices(["voice.vocals", "keyboard.piano", "voice.vocals", "voice.alto"]).join(" "), "2 0 3 2");
    eq(TAB20.length, 20);
  });
});
describe("谱前简写", () => {
  it("名字就是乐器的名字 = 目录的简写（带号跟着）；人声预设 = 老规矩；自己起的名字 = 缩短", () => {
    eq(partAbbr("Violin", { conceptNames: ["Violin", "小提琴"], conceptAbbr: "Vln." }), "Vln.");
    eq(partAbbr("Violin 2", { conceptNames: ["Violin", "小提琴"], conceptAbbr: "Vln." }), "Vln. 2");
    eq(partAbbr("我的提琴", { conceptNames: ["Violin", "小提琴"], conceptAbbr: "Vln." }), "我的");
    eq(partAbbr("Vocals", { voice: true }), "Vo."); eq(partAbbr("Soprano", { voice: true }), "S."); eq(partAbbr("Backing Vocals 2", { voice: true }), "B.Vo. 2", "定宽 7：去掉句点后的空格");
    eq(shortName("Santoor"), "San."); eq(shortName("Bell"), "Bell"); eq(shortName("Lead Synth"), "LS."); eq(shortName("二胡"), "二胡");
  });
});
describe("谱前简写：大小写 + 定宽（v0.9.41；仓鼠查出的 bug + user「没简写的能不能想办法也按定宽裁一下…也要处理定宽」）", () => {
  it("名字比较不分大小写：谱上 Piano / 目录 piano = Pno.；Piano 2 = Pno. 2", () => {
    eq(partAbbr("Piano", { conceptNames: ["piano", "钢琴"], conceptAbbr: "Pno." }), "Pno.");
    eq(partAbbr("Piano 2", { conceptNames: ["piano", "钢琴"], conceptAbbr: "Pno." }), "Pno. 2");
    eq(partAbbr("Violin", { conceptNames: ["violin"], conceptAbbr: "Vln." }), "Vln.");
  });
  it("定宽 7（半角 1、汉字 2，号也算）：去掉句点后的空格，还宽就截（拉丁补点、汉字不补）", () => {
    eq(fitAbbr("El. Pno."), "El.Pno."); eq(fitAbbr("Bar. Sax."), "Bar.Sa."); eq(fitAbbr("Frtl. El. B."), "Frtl.E.");
    eq(fitAbbr("Met. Wn Ch."), "Met.Wn."); eq(fitAbbr("Pno.", " 2"), "Pno. 2"); eq(fitAbbr("El. Guit.", " 3"), "El.G. 3");
    eq(fitAbbr("八音盒子"), "八音盒"); eq(fitAbbr("つくよみ"), "つくよ");
    for (const x of ["Frtl. El. B.", "Met. Wn Ch.", "Hnk. Pno.", "C Tin Wh.", "唢呐唢呐唢呐"]) assert(dispWidth(fitAbbr(x)) <= ABBR_W, x);
  });
  it("没有目录简写 / 自己起的名字：先缩、再按定宽裁", () => {
    eq(partAbbr("Helicopter", {}), "Hel."); eq(partAbbr("My Lead Synth 2", {}), "MLS. 2"); eq(partAbbr("小提琴手", {}), "小提"); eq(partAbbr("つくよみちゃん", {}), "つく");
    assert(dispWidth(partAbbr("Supercalifragilistic Expialidocious Orchestra Hit 12", {})) <= ABBR_W);
  });
});
