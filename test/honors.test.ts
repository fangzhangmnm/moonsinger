// 谁认哪些记号（perform.ts 的 ignoredArts）和真出声的路一致——表说「不认」的，出声的那条路确实不看它；说「认」的，确实改了出声。
// created 2026-10-08 by Claude Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」——表一旦和出声对不上，披露就成了谎话。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, select, tr, toggleArtSel, type EditorState } from "../src/score/song.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { gainSegments, noteEnd, ignoredArts, lightMarks } from "../src/score/perform.ts";
import { DYNAMICS_DB, ARTICULATION } from "../src/format/performance.ts";

const SPEC = { dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb };
const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
function two(art?: "staccato" | "accent" | "tenuto" | "breath"): EditorState {
  let st = initState(); st = { ...st, input: { ...st.input, unit: 3 } };
  for (const d of [1, 2]) st = writeDegree(st, d, "near");
  if (!art) return st;
  const i = tr(st).findIndex((t) => t.kind === "note");
  return toggleArtSel(select(st, i, i + 1), art);
}
/** 每个引擎真走的那几条：月读 = 唱谱（lab-score）+ 音量曲线（跳音收声）；元音版 / SoundFont = noteEnd（lightMarks，和 main.ts 同一个）+ 音量曲线。 */
const heard = {
  tsukuyomi: (st: EditorState) => JSON.stringify([toLabScore(tr(st), "n"), gainSegments(tr(st), undefined, SPEC, true)]),
  "vowel-sampler": (st: EditorState) => JSON.stringify([noteEnd(0, 1, (tr(st).find((t) => t.kind === "note") as { art?: string[] }).art ?? [], lightMarks(SPEC)), gainSegments(tr(st), undefined, SPEC, false)]),
  soundfont: (st: EditorState) => JSON.stringify([noteEnd(0, 1, (tr(st).find((t) => t.kind === "note") as { art?: string[] }).art ?? [], lightMarks(SPEC)), gainSegments(tr(st), undefined, SPEC, false)]),
};

describe("谁认哪些记号（不认 = 画灰 + 明说）", () => {
  it("表：都不认保持（呼吸 2026-10-08 起乐器也认：稍微断开）；没人上场 = 不逐个画灰", () => {
    deq(ignoredArts("tsukuyomi"), ["tenuto"]);
    deq(ignoredArts("vowel-sampler"), ["tenuto"]);
    deq(ignoredArts("soundfont"), ["tenuto"]);
    deq(ignoredArts("unknown"), []); deq(ignoredArts(null), []);
  });
  for (const eng of ["tsukuyomi", "vowel-sampler", "soundfont"] as const) {
    it(`${eng}：表说不认的 = 出声不变，表说认的 = 出声变了`, () => {
      const plain = heard[eng](two()), ign = ignoredArts(eng);
      for (const a of ["staccato", "accent", "tenuto", "breath"] as const) {
        const changed = heard[eng](two(a)) !== plain;
        if (ign.includes(a)) assert(!changed, `${eng} 表上不认 ${a}，可出声变了（表该改成认）`);
        else assert(changed, `${eng} 表上认 ${a}，可出声没变（不认就要画灰 + 明说）`);
      }
    });
  }
});
