// 歌手的类别色 + 谱前简写（v0.9.31；user「我希望有非常克制的color coding， mpl的 tab20？ 然后不同颜色默认绑不同乐器类别」「乐手名和颜色同意」）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { categoryOfSound, partColorIndices, partAbbr, shortName, TAB20 } from "../src/ui/part-colors.ts";

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
    eq(partAbbr("Vocals", { voice: true }), "Vo."); eq(partAbbr("Soprano", { voice: true }), "S."); eq(partAbbr("Backing Vocals 2", { voice: true }), "B. Vo. 2");
    eq(shortName("Santoor"), "San."); eq(shortName("Bell"), "Bell"); eq(shortName("Lead Synth"), "LS."); eq(shortName("二胡"), "二胡");
  });
});
