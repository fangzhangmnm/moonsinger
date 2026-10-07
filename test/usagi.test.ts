// 验收预演：用键盘把《うさぎ》整首打进去 + 贴歌词 → 转成 Lab 乐谱结构 → 与 Lab/20261005 月读第一首/score.mjs 逐音相同。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改成新打法：默认八分，四分 = 八分 + 「−」，十六分 = 「短」再「长」回来，二分 = 八分 + 三个「−」
import { describe, it, eq } from "./runner.mjs";
import { initState, setSongMeta } from "../src/score/song.ts";
import { commandFor } from "../src/score/keymap.ts";
import { apply } from "../src/score/commands.ts";
import { applyLyricLine } from "../src/score/lyrics.ts";
import { toLabScore } from "../src/score/lab-score.ts";

const CODE: Record<string, string> = { "|": "Enter", "-": "Minus" };
function press(st: ReturnType<typeof initState>, keys: string) {
  for (const ch of keys.replace(/\s+/g, "")) {
    const c = commandFor({ key: ch, code: CODE[ch] ?? `Digit${ch}`, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false });
    if (!c) throw new Error(`没有命令：${ch}`);
    st = apply(st, c);
  }
  return st;
}

describe("うさぎ（验收预演）", () => {
  it("键盘打完 + 贴歌词 == Lab score.mjs", async () => {
    let st = setSongMeta(initState(), { fifths: 0, beats: 2, beatType: 4, tempo: 72 });
    st = press(st, `
      4-46 | 7670 | 4446 | 7670 |
      6711 | 78669 43 | 643- | 432- | 3---`);
    st = applyLyricLine(st, "うさぎうさぎ、なにみてはねる、じゅうごやおつきさま、みてはーーねる");
    const ours = toLabScore(st.song, "ja");
    const lab = await import(new URL("../Lab/20261005 月读第一首/score.mjs", import.meta.url).href);
    eq(JSON.stringify(ours.SCORE), JSON.stringify(lab.SCORE), "SCORE");
    eq(ours.TEXT, lab.TEXT, "TEXT");
    eq(ours.TEMPO_QUARTER, lab.TEMPO_QUARTER, "TEMPO");
  });
});
