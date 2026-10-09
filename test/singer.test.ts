// 声部就是歌手（2026-10-08 Opus 5.5）：新歌手只在当前纸、换绑（这一行交给别的歌手 / 对调）、跨纸按歌手接、速度在最上面那位不在的纸上也不丢、读到共用角色 = 拆开。
// user「嗯声部就是歌手」「一张纸上，同一位歌手最多一行。对」「每张纸上各行的上下顺序跟着全曲的歌手顺序走可以」「新歌手只出现在当前这张纸嗯」「麦克风由歌手认领嗯」
//   「这一段交给别的歌手 就是我刚才说的换绑」（「已有的track绑换不同的声部」）；起因「每一个sheet有独立的歌手组合…然后跨sheet的连接按歌手认领」。
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, addPart, addPaper, rebindTrack, flattenPart, tempoMapOf, tr, TPQ, type EditorState, type Token, type Song, type PaperSeg } from "../src/score/song.ts";
import { saveMxl, openBytes, emptyExtras, withNewRole } from "../src/format/project.ts";
import { unzipSync, strFromU8 } from "../vendor/fflate/fflate.esm.js";

let nid = 9000;
const n = (dur = TPQ): Token => ({ kind: "note", id: nid++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric: null });
const tempo = (bpm: number): Token => ({ kind: "tempo", id: nid++, bpm }) as Token;
/** 两张纸、P1 一位歌手；第二张纸加好。 */
function twoPapers(): EditorState { let st = initState(); st = addPaper(st); return st; }
const has = (st: EditorState, paper: string, part: string) => !!st.song.papers.find((p) => p.id === paper)?.tracks[part];

describe("新歌手只出现在当前这张纸", () => {
  it("addPart：只在当前纸给一行，排在全曲最后，光标过去", () => {
    let st = twoPapers(); const [p1, p2] = st.song.papers.map((p) => p.id);
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" });   // 当前 = 第二张（addPaper 跳过去了）
    eq(has(st, p2, "P2"), true); eq(has(st, p1, "P2"), false, "第一张没有它");
    eq(st.song.parts.map((p) => p.id).join(","), "P1,P2"); eq(st.at.part, "P2");
  });
  it("onPaper = null = 哪张纸都还没有（交给新歌手用）", () => {
    const st = addPart(twoPapers(), { id: "P2", role: "r2", mic: "m2" }, null);
    eq(st.song.papers.some((p) => p.tracks.P2), false); eq(st.at.part, "P1");
  });
});

describe("换绑：这一行交给别的歌手（只改这张纸）", () => {
  it("对方不在这张纸上 = 整行挪给它，音原样；光标跟过去；别的纸不动", () => {
    let st = twoPapers(); const [p1, p2] = st.song.papers.map((p) => p.id);
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, null);
    st = { ...st, at: { paper: p2, part: "P1" } };
    const line = st.song.papers[1].tracks.P1;
    const r = rebindTrack(st, p2, "P1", "P2");
    eq(r.song.papers[1].tracks.P2, line, "同一串（音、歌词、记号都在）"); eq(has(r, p2, "P1"), false);
    eq(has(r, p1, "P1"), true, "第一张照旧是 P1"); eq(r.at.part, "P2");
  });
  it("对方在这张纸上已经有一行 = 对调", () => {
    let st = initState(); st = addPart(st, { id: "P2", role: "r2", mic: "m2" });
    const p = st.song.papers[0], a = p.tracks.P1, b = p.tracks.P2;
    const r = rebindTrack(st, p.id, "P1", "P2");
    eq(r.song.papers[0].tracks.P1, b); eq(r.song.papers[0].tracks.P2, a);
  });
  it("交给自己 / 这张纸上没有这一行 = 原样", () => {
    const st = twoPapers(); eq(rebindTrack(st, st.song.papers[0].id, "P1", "P1"), st); eq(rebindTrack(st, st.song.papers[0].id, "P9", "P1"), st);
  });
});

describe("跨纸按歌手接 + 速度不丢", () => {
  /** p1：P1 两拍；p2：只有 P2（两拍，中间变速 60）；p3：P1 一拍。 */
  function song3(): Song {
    let st = initState(); st = addPaper(st); st = addPaper(st);
    st = addPart(st, { id: "P2", role: "r2", mic: "m2" }, null);
    const [a, b, c] = st.song.papers, head = (t: Token[]) => t.slice(0, 3);
    const papers: PaperSeg[] = [
      { ...a, tracks: { P1: [...head(a.tracks.P1), n(), n()] } },
      { ...b, tracks: { P2: [...head(b.tracks.P1), n(), tempo(60), n()] } },
      { ...c, tracks: { P1: [...head(c.tracks.P1), n()] } },
    ];
    return { ...st.song, papers };
  }
  it("P1 = 第一张两拍 + 第二张整张休止 + 第三张一拍（不接 P2 的音）", () => {
    const f = flattenPart(song3(), "P1"), timed = f.tokens.filter((t) => t.kind === "note" || t.kind === "rest");
    eq(timed.map((t) => `${t.kind[0]}${t.dur / TPQ}`).join(" "), "n1 n1 r2 n1");
  });
  it("速度表：最上面那位（P1）不在第二张纸上，第二张中途的变速照样在（第三拍）", () => {
    const m = tempoMapOf(song3());
    assert(m.some((x) => x.tick === 3 * TPQ && x.bpm === 60), JSON.stringify(m));
  });
  it("压平件（score.musicxml）：第一个声部带着第二张纸中途的变速", () => {
    const song = song3(), files = unzipSync(saveMxl({ song, hum: song.hum, extras: emptyExtras(), app: "t", date: "2026-10-08T00:00:00.000Z" }));
    const flat = strFromU8(files["score.musicxml"]), p1 = flat.slice(flat.indexOf('<part id="P1"'), flat.indexOf('<part id="P2"'));
    assert(/<sound tempo="60"/.test(p1), "P1 里有 tempo 60");
  });
});

describe("读到两个声部共用一位歌手 = 拆成两位", () => {
  it("后面那个拿到一份照抄的角色；什么都不丢；说一声", () => {
    let st = initState(); st = addPart(st, { id: "P2", role: "r1", mic: "m1" });
    const song = st.song, extras = withNewRole(emptyExtras(), "r1", song.hum, "月读");
    const o = openBytes("x.mxl", saveMxl({ song, hum: song.hum, extras, app: "t", date: "2026-10-08T00:00:00.000Z" }));
    const roles = o.song.parts.map((p) => p.role);
    eq(new Set(roles).size, 2, roles.join(",")); eq(o.song.parts[0].role, "r1");
    eq(JSON.stringify(o.extras.lounge[roles[1]]), JSON.stringify(o.extras.lounge.r1), "谁来演、怎么演照抄");
    eq(o.song.parts[1].mic, "m1", "麦克风照旧共用");
    assert(o.notices.some((x) => /拆成了两位/.test(x)), o.notices.join(" | "));
    eq(tr({ ...st, song: o.song }).length > 0, true);
  });
});

describe("隐藏的纸：点名放这一张（本段）照样放", () => {
  it("songOnlyPaper 去掉隐藏；整首照旧跳过它", async () => {
    const { songOnlyPaper, setPaperHidden } = await import("../src/score/song.ts");
    let st = twoPapers(); const p2 = st.song.papers[1].id;
    st = { ...st, song: { ...st.song, papers: st.song.papers.map((p, k) => (k === 1 ? { ...p, tracks: { P1: [...p.tracks.P1, n()] } } : p)) } };
    st = setPaperHidden(st, p2, true);
    const notesIn = (song: Song) => flattenPart(song, "P1").tokens.filter((t) => t.kind === "note").length;
    eq(notesIn(st.song), 0, "整首：隐藏的纸跳过");
    eq(notesIn(songOnlyPaper(st.song, p2)), 1, "本段：点名放它 = 照样放");
  });
});

describe("曲段名自动 A B C D（2026-10-08 深夜，user「曲段名自动命名ABCD」）", () => {
  it("第二张纸：前面没名字的补 A、新的 B；再加 C；起过名的不动、用过的字母跳过", async () => {
    const { initState, addPaper, setPaperName } = await import("../src/score/song.ts");
    let st = initState(); st = addPaper(st);
    if (st.song.papers.map((p) => p.name).join(",") !== "A,B") throw new Error(st.song.papers.map((p) => p.name).join(","));
    st = setPaperName(st, st.song.papers[1].id, "副歌"); st = addPaper(st);
    const names = st.song.papers.map((p) => p.name).join(",");
    if (names !== "A,副歌,B") throw new Error(names);
    st = addPaper(st, st.song.papers[0].id);   // 插在 A 后面
    const n2 = st.song.papers.map((p) => p.name).join(",");
    if (n2 !== "A,C,副歌,B") throw new Error(n2);
  });
});
