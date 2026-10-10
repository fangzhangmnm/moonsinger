// 谁认哪些记号（perform.ts 的 ignoredArts）和真出声的路一致——表说「不认」的，出声的那条路确实不看它；说「认」的，确实改了出声。
// created 2026-10-08 by Claude Opus 5.5；user 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」——表一旦和出声对不上，披露就成了谎话。
// 2026-10-08 连断（Opus 5.5）：加连线；连线 / 保持只改「留不留缝」，底色不留缝（gapSec = 0）的人那里也算不认。
import { lightNotes } from "../src/engine/timeline.ts";
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, writeDegree, select, tr, toggleArtSel, toggleSlurSel, type EditorState, type NoteTok } from "../src/score/song.ts";
import { toLabScore } from "../src/score/lab-score.ts";
import { gainSegments, noteEnd, noteVelocity, ignoredArts, lightMarks, ALL_MARKS, type Mark } from "../src/score/perform.ts";
import { DYNAMICS_DB, DYNAMICS_VEL, ACCENT_VEL, MARCATO_VEL, MARCATO_DB, ARTICULATION } from "../src/format/performance.ts";

const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);
const spec = (gapSec: number) => ({ dynamicsDb: { ...DYNAMICS_DB }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb, marcatoDb: MARCATO_DB, gapSec });
/** 新建的 SoundFont 演奏者：带力度表（力度记号 / 重音 / 强音走 MIDI 力度）。 */
const sfSpec = (gapSec: number) => ({ ...spec(gapSec), dynamicsVel: { ...DYNAMICS_VEL }, accentVel: ACCENT_VEL, marcatoVel: MARCATO_VEL });
/** 两个四分音符；mark = 给第一个音加的记号（连线 = 第一个连到第二个）。chord = 第一个音叠成和弦（琶音要和弦才听得出来，v0.9.45）。 */
function two(mark?: Mark, chord = false): EditorState {
  let st = initState(); st = { ...st, input: { ...st.input, unit: 3 } };
  for (const d of [1, 2]) st = writeDegree(st, d, "near");
  const notesAt = tr(st).flatMap((t, k) => (t.kind === "note" ? [k] : []));
  const i = mark === "arpeggio" || (chord && !mark) ? notesAt[1] : notesAt[0];   // 琶音挂第二个音：v0.9.48 起低音往前提早，全曲第一个音前面没地方提早
  if (chord) { const toks = tr(st).slice(), t0 = toks[i] as NoteTok; toks[i] = { ...t0, chord: [{ ...t0.pitch!, octave: t0.pitch!.octave - 1 }] }; st = { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } }; }
  if (!mark) return st;
  if (mark === "swellGrow" || mark === "swellFade") { const toks = tr(st).slice(); toks[i] = { ...(toks[i] as NoteTok), art: [mark === "swellGrow" ? "swellUp" as const : "swellDown" as const] }; return { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } }; }
  if (mark === "inhale") { const toks = tr(st).slice(); toks[i] = { ...(toks[i] as NoteTok), art: ["breath"], inhale: "soft" }; return { ...st, song: { ...st.song, papers: st.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st.at.part]: toks } })) } }; }   // 出声的换气 = 呼吸 + inhale（比的是「只有呼吸」）
  return mark === "slur" ? toggleSlurSel(select(st, i, i + 1)) : toggleArtSel(select(st, i, i + 1), mark);
}
const first = (st: EditorState) => tr(st).find((t) => t.kind === "note") as NoteTok;
/** 每个引擎真走的那几条：月读 = 唱谱（lab-score，跳音 = 下一个字前「^」顿一下）+ 音量曲线（力度 / 重音 / 强音）；元音版 / SoundFont = noteEnd（lightMarks，和 main.ts 同一个）+ 音量曲线。 */
const heard = (eng: string, gap: number) => (st: EditorState) => {
  const sp = spec(gap);
  if (eng === "tsukuyomi") return JSON.stringify([toLabScore(tr(st), "n"), gainSegments(tr(st), undefined, sp)]);   // 和 main.ts 一样：跳音进唱谱
  const f = first(st);
  if (eng === "soundfont") { const sv = sfSpec(gap), i = tr(st).indexOf(f);
    return JSON.stringify([noteEnd(0, 1, f.art ?? [], lightMarks(sv), !!f.slur), gainSegments(tr(st), undefined, sv), noteVelocity(tr(st), i, f.art ?? [], sv, 80 / 127), lightNotes(tr(st), [], true, lightMarks(sv)).map((n) => [n.midi, n.t0])]); }   // 起点（琶音改的是它；v0.9.45）
  return JSON.stringify([noteEnd(0, 1, f.art ?? [], lightMarks(sp), !!f.slur), gainSegments(tr(st), undefined, sp)]);
};

describe("谁认哪些记号（不认 = 画灰 + 明说）", () => {
  it("表：月读不认保持 / 连线（唱法核心还没接）；元音版 / 乐器底色不留缝时连线 / 保持也算不认；没人上场 = 不逐个画灰", () => {
    deq(ignoredArts("tsukuyomi"), ["tenuto", "slur", "arpeggio"]); deq(ignoredArts("tsukuyomi", 0.04), ["tenuto", "slur", "arpeggio"]);   // 琶音：单声的唱不了和弦（v0.9.45）
    deq(ignoredArts("vowel-sampler"), ["tenuto", "slur", "whisper", "inhale", "arpeggio"]); deq(ignoredArts("vowel-sampler", 0.04), ["whisper", "inhale", "arpeggio"]);   // 气声 / 出声的换气只有月读做得到（2026-10-10）
    deq(ignoredArts("soundfont"), ["tenuto", "slur", "whisper", "inhale"]); deq(ignoredArts("soundfont", 0.02), ["whisper", "inhale"]);
    deq(ignoredArts("unknown"), []); deq(ignoredArts(null), []);
  });
  for (const eng of ["tsukuyomi", "vowel-sampler", "soundfont"] as const) {
    for (const gap of [0, 0.04]) {
      it(`${eng}（底色 ${gap * 1000} ms）：表说不认的 = 出声不变，表说认的 = 出声变了`, () => {
        const h = heard(eng, gap), plain = h(two()), ign = ignoredArts(eng, gap);
        for (const m of ALL_MARKS) {
          const changed = m === "arpeggio" ? h(two(m, true)) !== h(two(undefined, true)) : h(two(m)) !== (m === "inhale" ? h(two("breath")) : plain);   // 出声的换气：和只有呼吸比；琶音：和弦对和弦比
          if (ign.includes(m)) assert(!changed, `${eng} 表上不认 ${m}，可出声变了（表该改成认）`);
          else assert(changed, `${eng} 表上认 ${m}，可出声没变（不认就要画灰 + 明说）`);
        }
      });
    }
  }
});

describe("连断的底色（noteEnd）", () => {
  const o = (gapSec: number) => ({ staccatoGate: 0.5, breath: true, gapSec });
  it("不写记号的音留缝；缝最多吃掉这个音的 1/4；连线 / 保持不留；跳音照旧", () => {
    eq(noteEnd(0, 1, [], o(0.04)), 0.96);
    assert(Math.abs(noteEnd(0, 0.1, [], o(0.04)) - 0.075) < 1e-12, "短音：最多吃 1/4");
    eq(noteEnd(0, 1, [], o(0.04), true), 1, "连线 = 不留缝");
    eq(noteEnd(0, 1, ["tenuto"], o(0.04)), 1, "保持 = 不留缝");
    eq(noteEnd(0, 1, ["staccato"], o(0.04)), 0.5);
    eq(noteEnd(0, 1, [], o(0)), 1, "底色 0 = 和以前一样（旧歌逐样本不变）");
  });
});

describe("力度 = MIDI velocity（SoundFont；2026-10-08 user「应该send的就是velocity！」「力度就是velocity」）", () => {
  const dyn = (v: "pp" | "mp" | "ff") => ({ kind: "dyn", id: 99, value: v }) as never;
  it("有力度表：没写记号 = 旋钮；记号查表；重音 / 强音往上加；顶到 127 为止", () => {
    const st = two(), toks = tr(st), i = toks.indexOf(first(st)), sv = sfSpec(0);
    eq(noteVelocity(toks, i, [], sv, 100 / 127), 100 / 127, "没写记号 = 旋钮");
    const withMp = [...toks.slice(0, i), dyn("mp"), ...toks.slice(i)];
    eq(noteVelocity(withMp, i + 1, [], sv, 100 / 127), 64 / 127, "mp = 表里的 64");
    eq(noteVelocity(withMp, i + 1, ["accent"], sv, 1), 80 / 127, "重音 +16");
    eq(noteVelocity(withMp, i + 1, ["marcato"], sv, 1), 92 / 127, "强音 +28");
    const withFf = [...toks.slice(0, i), dyn("ff"), ...toks.slice(i)];
    eq(noteVelocity(withFf, i + 1, ["marcato"], sv, 1), 1, "112 + 28 顶到 127");
  });
  it("没有力度表（之前上场的演奏者）= 一律旋钮，力度记号照旧走 dB（旧歌不变）", () => {
    const st = two(), toks = tr(st), i = toks.indexOf(first(st));
    const withPp = [...toks.slice(0, i), dyn("pp"), ...toks.slice(i)];
    eq(noteVelocity(withPp, i + 1, ["accent"], spec(0), 0.8), 0.8);
    assert(gainSegments(withPp, undefined, spec(0)) !== null, "旧的：pp 走 dB");
    eq(gainSegments(withPp, undefined, sfSpec(0)), null, "有力度表：pp 不再走 dB（不双算）");
  });
});

describe("音内的起伏：按下去就自然衰减的乐器（canSwell = false）", () => {
  it("< / <> 不认（画灰、明说）、出声不变；> 照做", () => {
    deq(ignoredArts("soundfont", 0.02, false), ["swellGrow", "whisper", "inhale"]);   // 气声 / 出声的换气乐器本来就不认（2026-10-10）
    const piano = { ...sfSpec(0.02), canSwell: false }, h = (st: EditorState) => JSON.stringify(gainSegments(tr(st), undefined, piano));
    eq(h(two("swellGrow")), h(two()), "< 做不到 = 出声不变");
    assert(h(two("swellFade")) !== h(two()), "> 照做");
  });
});

describe("同一道缝上连线 + 呼吸 = 呼吸算数（2026-10-08，user「我觉得应该呼吸会override连线」，两个选项里 AI 选了 2：两个都留着，出声呼吸算数）", () => {
  const o = { staccatoGate: 0.5, breath: true, gapSec: 0.04, breathSec: 0.12, breathShare: 0.5 };
  it("SoundFont / 元音版（noteEnd）：连线 + 呼吸 = 和只有呼吸一样断开", () => {
    eq(noteEnd(0, 1, ["breath"], o, true), noteEnd(0, 1, ["breath"], o, false));
    assert(noteEnd(0, 1, ["breath"], o, true) < 1, "连线没把呼吸吃掉");
    eq(noteEnd(0, 1, [], o, true), 1, "只有连线 = 不断");
  });
  it("月读（唱谱）：连线 + 呼吸 = 照样换气（和只有呼吸一样）", () => {
    const st0 = two(), i0 = tr(st0).indexOf(first(st0)), br = toggleArtSel(select(st0, i0, i0 + 1), "breath");
    const i = tr(br).indexOf(first(br)), both = toggleSlurSel(select(br, i, i + 1));
    assert(!!first(both).slur && (first(both).art ?? []).includes("breath"), "两个都在谱上");
    deq(toLabScore(tr(both), "n"), toLabScore(tr(br), "n"));
  });
});
