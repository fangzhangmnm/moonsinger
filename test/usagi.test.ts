// 验收预演：用键盘把《うさぎ》整首打进去 + 贴歌词 → 转成 Lab 乐谱结构 → 与冻结的 Lab 乐谱（test/fixtures/usagi-lab-score.json）逐音相同。
// created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改成新打法：默认八分，四分 = 八分 + 「−」，十六分 = 「短」再「长」回来，二分 = 八分 + 三个「−」
import { describe, it, eq } from "./runner.mjs";
import { initState, emptySong, tr } from "../src/score/song.ts";
import { route } from "../src/keyboard/keys.ts";
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

// 对照 = 冻在本仓的 Lab 乐谱 test/fixtures/usagi-lab-score.json（2026-10-14 从兄弟私有仓的 score.mjs 冻的）：公开仓的测试不依赖私有仓、不静默跳过（反弃坑红线；原来私有仓不在旁边就 todo）。
const fs = await import("node:fs" as string);
const lab = JSON.parse(fs.readFileSync(new URL("./fixtures/usagi-lab-score.json", import.meta.url), "utf8")) as { SCORE: unknown[]; TEXT: string; TEMPO_QUARTER: number };

describe("うさぎ（验收预演）", () => {
  it("键盘打完 + 贴歌词 == 冻结的 Lab score（fixture）", () => {
    let st = initState(emptySong({ fifths: 0, beats: 2, beatType: 4, bpm: 72 }));
    st = press(st, `
      4-46 | 7670 | 4446 | 7670 |
      6711 | 78669 43 | 643- | 432- | 3---`);
    st = applyLyricLine(st, "うさぎうさぎ、なにみてはねる、じゅうごやおつきさま、みてはーーねる");
    const ours = toLabScore(tr(st), st.song.hum, "ja");
    eq(JSON.stringify(ours.SCORE), JSON.stringify(lab.SCORE), "SCORE");
    eq(ours.TEXT, lab.TEXT, "TEXT");
    eq(ours.TEMPO_QUARTER, lab.TEMPO_QUARTER, "TEMPO");
  });
});
