// 每张纸（曲段）开头强制写明力度（song.ts ensureStartDyns，v0.10.39）。created 2026-10-10 by Claude Opus 5.5
// user wishlist「强制要求开头有力度标记」→ AI「每张纸开头没写 = 补这里本来生效的那个」→ user「每张纸（曲段）开头，对」
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, addPaper, ensureStartDyns, headLen, TPQ, writePitch, writeRest, setCaret, type Token, type Song, type EditorState } from "../src/score/song.ts";
import { dynLevels } from "../src/score/perform.ts";

let nid = 9800;
const n = (): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 5 }, dur: TPQ, lyric: null } as Token);
const r = (): Token => ({ kind: "rest", id: nid++, dur: TPQ } as Token);
const d = (v: string): Token => ({ kind: "dyn", id: nid++, value: v } as Token);
const hp = (dir: "cresc" | "dim" = "cresc"): Token => ({ kind: "hairpin", id: nid++, dir } as Token);
const gr = (): Token => ({ kind: "groove", id: nid++, style: "pop" } as Token);
const body = (t: Token[]) => t.slice(headLen(t)).map((x) => (x.kind === "dyn" ? (x as { value: string }).value : x.kind === "note" ? "n" : x.kind === "rest" ? "r" : x.kind)).join(" ");
function song(tracks: Token[][]): Song {
  let st = initState(); for (let k = 1; k < tracks.length; k++) st = addPaper(st);
  const pid = st.song.parts[0].id;
  return { ...st.song, papers: st.song.papers.map((pp, k) => ({ ...pp, tracks: { [pid]: [...pp.tracks[pid].slice(0, headLen(pp.tracks[pid])), ...tracks[k]] } })) };
}
describe("每张纸开头强制写明力度", () => {
  it("第一张没写 = mf；第二张没写 = 前一张最后那个（这里本来就生效的）；补在第一个音前面（前面的休止不动）", () => {
    const s = song([[n(), d("f"), n()], [r(), n(), n()]]), out = ensureStartDyns(s, 100), pid = s.parts[0].id;
    eq(body(out.song.papers[0].tracks[pid]), "mf n f n");
    eq(body(out.song.papers[1].tracks[pid]), "r f n n");
    eq(out.added.length, 2); eq(out.nextId, 102);
  });
  it("写了的不补；没有音的纸不补；再过一遍什么都不变", () => {
    const s = song([[d("p"), n()], [r(), r()]]), out = ensureStartDyns(s, 100);
    eq(out.added.length, 0); eq(out.song, s);
    const s2 = ensureStartDyns(song([[n()], [n()]]), 1).song;
    eq(ensureStartDyns(s2, 50).added.length, 0, "补完再过一遍 = 不动");
  });
});
describe("补在哪、理顺（第八刀 8-7，统筹 2026-11-12）：同一个音前面力度在渐强渐弱 / 风格前面", () => {
  const pidOf = (s: Song) => s.parts[0].id;
  it("第一个音前面有渐强渐弱 / 风格：补的力度插在这一串的最前面", () => {
    const s = song([[hp(), n(), n(), d("f"), n()], [gr(), hp("dim"), n()]]), out = ensureStartDyns(s, 100), pid = pidOf(s);
    eq(body(out.song.papers[0].tracks[pid]), "mf hairpin n n f n");
    eq(body(out.song.papers[1].tracks[pid]), "f groove hairpin n");
    eq(out.reordered.length, 0);
  });
  it("存成反顺序的（v0.10.39 起补出来的「渐强渐弱、力度、音」）：打开歌时理成「力度、渐强渐弱、音」，报出来；只理第一个音前面那一串，别处不碰；改谱时不理", () => {
    const s = song([[hp(), d("p"), n(), n(), hp(), d("f"), n()], [gr(), hp(), d("mp"), n()]]), out = ensureStartDyns(s, 100, { reorder: true }), pid = pidOf(s);
    eq(body(out.song.papers[0].tracks[pid]), "p hairpin n n hairpin f n", "后面那个「渐强渐弱、f」不动");
    eq(body(out.song.papers[1].tracks[pid]), "mp groove hairpin n", "风格和渐强渐弱的先后不变");
    eq(out.reordered.length, 2); eq(out.added.length, 0); eq(out.nextId, 100, "理顺不发新 id");
    eq(ensureStartDyns(out.song, 100, { reorder: true }).reordered.length, 0, "理过再过一遍 = 不动");
    eq(ensureStartDyns(s, 100).song, s, "改谱的时候（不带 reorder）不理顺：别的记号的先后原样");
    const ok = song([[d("p"), hp(), n()]]); eq(ensureStartDyns(ok, 1, { reorder: true }).song, ok, "顺序本来就对 = 原样（同一个对象）");
  });
  it("出声：反顺序时那个渐强渐弱不起作用（它和终点之间一个音都没有）；理顺之后从这个力度渐强到下一个", () => {
    const T = { ppp: 1, pp: 2, p: 3, mp: 4, mf: 5, f: 6, ff: 7, fff: 8 } as const;
    const lv = (ts: Token[]) => [...dynLevels(ts, undefined, T, 5, 1)].map(([, l]) => l.at0);
    const rev = [hp(), d("p"), n(), n(), n(), d("f"), n()], fixed = [rev[1]!, rev[0]!, ...rev.slice(2)];
    eq(lv(rev).join(" "), "3 3 3 6", "反顺序：三个音都是 p（渐强没起作用）");
    const f = lv(fixed); eq(f[0], 3); assert(f[1]! > 3 && f[2]! > f[1]!, `理顺：p 往 f 走（${f.join(" ")}）`); eq(f[3], 6);
  });
});
describe("纸上还没音时光标在开头那个力度前面：写的音 / 休止落在力度后面（v0.10.41）", () => {
  // user「为什么空文档打字的时候会有两个mf?」「删了一个还有一个」「然后一打字又duplicate了」：点谱头 = 光标在力度前面 → 音写在力度前面 → 第一个音没力度 → 又补一个
  const withTrack = (toks: Token[]): EditorState => { const st = initState(), pid = st.at.part, pp = st.song.papers[0]; const h = pp.tracks[pid].slice(0, headLen(pp.tracks[pid]));
    return setCaret({ ...st, song: { ...st.song, papers: [{ ...pp, tracks: { [pid]: [...h, ...toks] } }] } }, h.length); };
  const trk = (st: EditorState) => st.song.papers[0].tracks[st.at.part];
  it("只有一个力度、光标在它前面 → 写音 = 力度后面；不用再补", () => {
    const st = writePitch(withTrack([d("mf")]), { step: "C", alter: 0, octave: 4 });
    eq(body(trk(st)), "mf n"); eq(ensureStartDyns(st.song, 500).added.length, 0, "不会再补一个");
  });
  it("休止一样；纸上已经有音了 = 照旧写在光标处（力度前面，力度留给它后面那个音）", () => {
    eq(body(trk(writeRest(withTrack([d("mf")])))), "mf r");
    const st = writePitch(setCaret(withTrack([r(), d("f"), n()]), headLen(trk(withTrack([]))) + 1), { step: "D", alter: 0, octave: 4 });
    eq(body(trk(st)), "r n f n");
  });
});

