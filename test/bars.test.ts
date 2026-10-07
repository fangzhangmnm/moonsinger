// 自动小节线测试：按拍号数、人插的「|」从那里重新数（弱起）、跨小节线的音切成连着的两段、满了紧跟人插的「|」只画一条、关掉 = 只有人插的。
// created 2026-10-07 by Claude Opus 5.5（user「按拍号自动画小节线，手插「|」= 从这里重新数 可以啊，试试，然后自动加小节也是可以toggle的，默认开」）
import { describe, it, eq } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { TPQ, type Song, type Token } from "../src/score/song.ts";

const Q = TPQ, Hf = TPQ * 2;
const p = { step: "C" as const, alter: 0, octave: 5 };
/** 一首歌：数字 = 那么多拍的音（1 = 四分、2 = 二分），"|" = 人插的小节线。谱头 = 1=C、4/4、♩=90。 */
function song(seq: (number | "|")[]): Song {
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
  for (const s of seq) toks.push((s === "|" ? { kind: "bar", id: id++ } : { kind: "note", pitch: p, dur: s === 2 ? Hf : Q * s, lyric: null, id: id++ }) as Token);
  return { title: "", hum: "n", tokens: toks };
}
const L = (seq: (number | "|")[], autoBars = true) => engrave(song(seq), { width: 4000, sp: 10, caret: 3 + seq.length, sel: null, measureLyric: () => 10, autoBars });
const bars = (l: ReturnType<typeof L>) => l.prims.filter((x) => x.t === "line" && x.cls?.startsWith("bar")).map((x) => (x.cls!.includes("auto") ? "a" : "m")).join("");
const ties = (l: ReturnType<typeof L>) => l.prims.filter((x) => x.t === "path" && x.cls === "tie").length;

describe("自动小节线", () => {
  it("按拍号数：六个四分 = 一条自动小节线；八个 = 两条（曲尾正好写满也画）", () => {
    eq(bars(L([1, 1, 1, 1, 1, 1])), "a");
    eq(bars(L([1, 1, 1, 1, 1, 1, 1, 1])), "aa");
  });
  it("弱起：两个音 + 人插的「|」→ 后面从那里数，第一小节不标", () => {
    const l = L([1, 1, "|", 1, 1, 1, 1, 1]);
    eq(bars(l), "ma"); eq(l.shortBars, 0);
  });
  it("满了紧跟人插的「|」只画一条", () => { eq(bars(L([1, 1, 1, 1, "|", 1])), "m"); });
  it("跨小节线的音切成连着的两段（二分音符从第四拍起）", () => {
    const l = L([1, 1, 1, 2]);
    eq(bars(l), "a"); eq(ties(l), 1); eq(l.notes.length, 4);   // 点得到的还是四个音
  });
  it("中间人插的「|」不满 = 轻标一个（第一小节以外）", () => { eq(L([1, 1, 1, 1, 1, "|", 1]).shortBars, 1); });
  it("改前面的音时长：只挪到下一个人插的「|」为止", () => {
    eq(bars(L([1, 1, 1, 1, 1, 1, 1, 1, "|", 1, 1, 1, 1])), "ama");
    // 第一个音变长一拍：前两条自动小节线往前挪一拍，人插的那条不动 → 它前面只剩一拍的小节 = 轻标；人插的后面照旧
    const l = L([2, 1, 1, 1, 1, 1, 1, 1, "|", 1, 1, 1, 1]);
    eq(bars(l), "aama"); eq(l.shortBars, 1);
  });
  it("挤一挤：只超出一点的小节压进这一行，超出很多才折行", () => {
    const seq: (number | "|")[] = [1, 1, "|", 1, 1, 1, 1, 1, 1, 1, 1];
    const at = (width: number) => engrave(song(seq), { width, sp: 10, caret: 3 + seq.length, sel: null, measureLyric: () => 10 });
    const wide = at(4000), lastBar = Math.max(...wide.prims.filter((x) => x.t === "line" && x.cls?.startsWith("bar")).map((x) => (x as { x1: number }).x1));
    eq(wide.systems.length, 1);
    eq(at(lastBar * 0.97).systems.length, 1, "只差 3%：压进这一行");
    eq(at(lastBar * 0.7).systems.length, 2, "差 30%：折行");
  });
  it("关掉：只有人插的", () => { eq(bars(L([1, 1, 1, 1, 1, 1, 1, 1], false)), ""); eq(bars(L([1, 1, "|", 1, 1, 1, 1], false)), "m"); });
});
