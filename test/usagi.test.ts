// 验收预演：用键盘把《うさぎ》整首打进去 + 贴歌词 → 转成 Lab 乐谱结构 → 与 Lab/20261005 月读第一首/score.mjs 逐音相同。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改成新打法：默认八分，四分 = 八分 + 「−」，十六分 = 「短」再「长」回来，二分 = 八分 + 三个「−」
import { describe, it, eq, todo } from "./runner.mjs";
import { initState, emptySong, tr } from "../src/score/song.ts";
import { route } from "../src/input/keys.ts";
import { apply } from "../src/score/commands.ts";
import { applyLyricLine } from "../src/score/lyrics.ts";
import { toLabScore } from "../src/score/lab-score.ts";

const CODE: Record<string, string> = { "|": "Enter", "-": "Minus" };
function press(st: ReturnType<typeof initState>, keys: string) {
  for (const ch of keys.replace(/\s+/g, "")) {
    const a = route({ key: ch, code: CODE[ch] ?? `Digit${ch}`, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }, st.sel ? "edit" : "write");
    if (a?.k !== "cmd") throw new Error(`没有命令：${ch}`);
    st = apply(st, a.cmd);
  }
  return st;
}

// Lab 乐谱在兄弟仓「写歌实验室」里（2026-10-07 分家）；单独 clone 本仓时没有它，这条记成 todo。
const LAB_SCORE = new URL("../../20260810 写歌实验室/Lab/20261005 月读第一首/score.mjs", import.meta.url);
const fs = await import("node:fs" as string);
const haveLab: boolean = fs.existsSync(LAB_SCORE);

describe("うさぎ（验收预演）", () => {
  if (!haveLab) { todo("键盘打完 + 贴歌词 == Lab score.mjs（写歌实验室仓不在旁边，跳过）"); return; }
  it("键盘打完 + 贴歌词 == Lab score.mjs", async () => {
    let st = initState(emptySong({ fifths: 0, beats: 2, beatType: 4, bpm: 72 }));
    st = press(st, `
      4-46 | 7670 | 4446 | 7670 |
      6711 | 78669 43 | 643- | 432- | 3---`);
    st = applyLyricLine(st, "うさぎうさぎ、なにみてはねる、じゅうごやおつきさま、みてはーーねる");
    const ours = toLabScore(tr(st), st.song.hum, "ja");
    const lab = await import(LAB_SCORE.href);
    eq(JSON.stringify(ours.SCORE), JSON.stringify(lab.SCORE), "SCORE");
    eq(ours.TEXT, lab.TEXT, "TEXT");
    eq(ours.TEMPO_QUARTER, lab.TEMPO_QUARTER, "TEMPO");
  });
});
