// 验收预演：用键盘把《うさぎ》整首打进去 + 贴歌词 → 转成 Lab 乐谱结构 → 与 Lab/20261005 月读第一首/score.mjs 逐音相同。
// created 2026-10-06 by Claude Opus 5.5（Lab 的旋律取自日文维基 LilyPond 源码，AI 没改过一个音）
import { describe, it, eq } from "./runner.mjs";
import { initState, setSongMeta } from "../src/score/song.ts";
import { commandFor } from "../src/score/keymap.ts";
import { apply } from "../src/score/commands.ts";
import { applyLyricLine } from "../src/score/lyrics.ts";
import { toLabScore } from "../src/score/lab-score.ts";

/** 字符 → 物理键位；| 用 Enter（小节线）。 */
function press(st: ReturnType<typeof initState>, keys: string) {
  for (const ch of keys.replace(/\s+/g, "")) {
    const code = ch === "|" ? "Enter" : `Digit${ch}`;
    const c = commandFor({ key: ch, code, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false });
    if (!c) throw new Error(`没有命令：${ch}`);
    st = apply(st, c);
  }
  return st;
}

describe("うさぎ（验收预演）", () => {
  it("键盘打完 + 贴歌词 == Lab score.mjs", async () => {
    let st = setSongMeta(initState(), { fifths: 0, beats: 2, beatType: 4, tempo: 72 });
    st = press(st, `
      448 6 |   7 6 7 0 |   4 4 4 6 |   7 6 7 0 |
      6 7 1 1 | 7 68 6 49 3 | 6 4 39 | 48 3 29 | 39`);
    st = applyLyricLine(st, "うさぎうさぎ、なにみてはねる、じゅうごやおつきさま、みてはーーねる");
    const ours = toLabScore(st.song, "ja");
    const lab = await import(new URL("../Lab/20261005 月读第一首/score.mjs", import.meta.url).href);
    eq(JSON.stringify(ours.SCORE), JSON.stringify(lab.SCORE), "SCORE");
    eq(ours.TEXT, lab.TEXT, "TEXT");
    eq(ours.TEMPO_QUARTER, lab.TEMPO_QUARTER, "TEMPO");
  });
});
