// 有选区时：音键 / 0 / ⌫ / − / 叠 = 替换模式（键盘只管打谱）；整组改时值 = 选区菜单（setSelDur / ÷2 / ×2）。
// created 2026-10-08 by Claude Fable 5.1（整组）；2026-10-08 改成替换模式 by Claude Opus 5.5——
//   user「加一个时长替换模式，类似override…吃掉后面的旋律线」「然后不能写出选区边界」「有选区 = 替换、无选区 = 插入」
//   「移调转调和长度以及其他的操作不要用keyboard，而是一个小的上下文菜单，键盘只做纯粹的打谱」
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, select, setSelDur, scaleSelDur, selUnit, writePitch, writeRest, backspace, extend, stackPitch, setUnit, shorter, tr, headLen, TPQ, songOf, type EditorState, type NoteTok, type Token } from "../src/score/song.ts";
import { pitchName } from "../src/score/pitch.ts";

const E = TPQ / 2, H = 3;
const P = (step: "C" | "D" | "E" | "F" | "G" | "A" | "B", octave = 4) => ({ step, alter: 0, octave });
const show = (st: EditorState) => tr(st).slice(headLen(tr(st))).map((t) => t.kind === "note"
  ? `${t.pitch ? pitchName(t.pitch) : "?"}${t.chord ? "+" + t.chord.map(pitchName).join("+") : ""}/${t.dur / E}${t.lyric ? `"${t.lyric}"` : ""}${t.tie ? "~" : ""}`
  : t.kind === "rest" ? `r/${t.dur / E}` : t.kind === "bar" ? "|" : t.kind).join(" ");
/** 谱：调 / 拍 / 速度 + 给定的音（[音名, 几个八分, 歌词?] / "|" = 人插的小节线）。 */
function song(items: (["C" | "D" | "E" | "F" | "G" | "A" | "B", number, string?] | "|")[]): EditorState {
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
  for (const it of items) toks.push((it === "|" ? { kind: "bar", id: id++ } : { kind: "note", pitch: P(it[0]), dur: it[1] * E, lyric: it[2] ?? null, id: id++ }) as Token);
  return initState(songOf(toks, { title: "" }));
}
const unit = (st: EditorState, u: number) => setUnit(st, u);   // 2 = 八分、3 = 四分、4 = 二分

describe("选区菜单：整组改时值", () => {
  it("setSelDur：选中的都改成那一档；选区留着；没选 = 原样", () => {
    let st = select(song([["C", 1], ["D", 1], ["E", 1], ["F", 1]]), H, H + 3);
    st = setSelDur(st, 3);
    eq(show(st), "C4/2 D4/2 E4/2 F4/1");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H, to: H + 3 }));
    const clear = { ...st, sel: null }; eq(setSelDur(clear, 1), clear);
  });
  it("selUnit：都一样才报；长短不一 / 没选 = null", () => {
    const st = song([["C", 1], ["D", 1]]);
    eq(selUnit(select(st, H, H + 2)), 2); eq(selUnit(st), null);
    let m = scaleSelDur(select(st, H, H + 1), 0.5); m = select(m, H, H + 2); eq(selUnit(m), null);
  });
});

describe("替换模式（选区 + 打音）", () => {
  it("按长短档吃掉窗口里的旧音，后面不挪；选区留着、写字头往后走", () => {
    let st = unit(select(song([["C", 1], ["D", 1], ["E", 1], ["F", 1]]), H, H + 4), 3);   // 窗口 = 4 个八分；写四分
    st = writePitch(st, P("G"));
    eq(show(st), "G4/2 E4/1 F4/1");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H, to: H + 3, head: H + 1 }));
    st = writePitch(st, P("A"));
    eq(show(st), "G4/2 A4/2");
    eq(writePitch(st, P("B")), st, "窗口满了 = 原样（写不出选区）");
  });
  it("最后一个截短到正好填满窗口", () => {
    let st = unit(select(song([["C", 1], ["D", 1], ["E", 1], ["F", 1]]), H, H + 3), 4);   // 窗口 = 3 个八分；写二分（4 个八分）
    st = writePitch(st, P("G"));
    eq(show(st), "G4/3 F4/1", "截成 3 个八分，窗口外的 F 不动");
  });
  it("吃一半的音留下剩的那截（不带歌词）", () => {
    let st = unit(select(song([["C", 2, "la"], ["D", 2, "li"]]), H, H + 2), 2);   // 窗口 = 两个四分；写八分
    st = writePitch(st, P("G"));
    eq(show(st), `G4/1"la" C4/1 D4/2"li"`, "新音接过 C 的歌词；C 剩的那截没有歌词");
  });
  it("新音落在旧音起点上 = 接过歌词（只改音高时歌词不丢）", () => {
    let st = unit(select(song([["C", 1, "ka"], ["D", 1, "ki"]]), H, H + 2), 2);
    st = writePitch(writePitch(st, P("E")), P("F"));
    eq(show(st), `E4/1"ka" F4/1"ki"`);
  });
  it("人插的小节线挡住：写到「|」前为止，下一个从「|」后面接着写", () => {
    let st = unit(select(song([["C", 2], "|", ["D", 2]]), H, H + 3), 4);   // 窗口里有「|」；写二分
    st = writePitch(st, P("G"));
    eq(show(st), "G4/2 | D4/2", "截在小节线前");
    st = writePitch(st, P("A"));
    eq(show(st), "G4/2 | A4/2");
  });
  it("0 = 写一个休止（同样吃、同样不出选区）", () => {
    let st = unit(select(song([["C", 1], ["D", 1]]), H, H + 2), 2);
    st = writeRest(st);
    eq(show(st), "r/1 D4/1");
  });
  it("⌫ = 刚写的变回休止（位置不动、后面不挪），写字头退回去，再写接着替换", () => {
    let st = unit(select(song([["C", 1], ["D", 1], ["E", 1]]), H, H + 3), 2);
    st = writePitch(writePitch(st, P("G")), P("A"));
    st = backspace(st);
    eq(show(st), "G4/1 r/1 E4/1");
    eq(st.sel?.head, H + 1);
    st = writePitch(st, P("B"));
    eq(show(st), "G4/1 B4/1 E4/1", "退回去的位置再写 = 把休止换掉");
  });
  it("没写过就按 ⌫ = 删掉选中的（照旧）", () => {
    const st = backspace(select(song([["C", 1], ["D", 1], ["E", 1]]), H, H + 2));
    eq(show(st), "E4/1");
  });
  it("「−」= 刚写的往后吃一份；不出选区；没写过 = 不动", () => {
    let st = unit(select(song([["C", 1], ["D", 1], ["E", 1], ["F", 1]]), H, H + 3), 2);
    eq(extend(st), st, "没写过 = 不动");
    st = extend(writePitch(st, P("G")));
    eq(show(st), "G4/2 E4/1 F4/1");
    st = extend(st);
    eq(show(st), "G4/3 F4/1", "吃到窗口尾为止");
    eq(extend(st), st, "窗口满了 = 不动");
  });
  it("叠：替换模式里叠到刚写的那个上（还可以输入叠音）；没写过 = 叠到选区第一个音", () => {
    let st = unit(select(song([["C", 1], ["D", 1]]), H, H + 2), 2);
    st = stackPitch(st, P("E"));
    assert(!!(tr(st)[H] as NoteTok).chord?.length, "没写过：叠到选区第一个音");
    st = stackPitch(writePitch(st, P("G")), P("B"));
    eq(show(st), "B4+G4/1 D4/1", "叠音按高低排：最高的当旋律线");
  });
  it("被吃掉的音后面那个原来连着它（连音线）：断开", () => {
    const base = song([["C", 1], ["C", 1], ["D", 1]]);
    const toks = tr(base).slice(); (toks[H + 1] as NoteTok).tie = true;
    let st = initState(songOf(toks, { title: "" }));
    st = unit(select(st, H, H + 1), 2);
    st = writePitch(st, P("G"));
    eq(show(st), "G4/1 C4/1 D4/1", "C 的连音线断开了");
  });
});

// 选区菜单「清掉记号」：曲级 / 音级 / 都清（2026-10-10 Opus 5.5；user「批量修改，删除曲级（你之前分了曲级vs音符级）力度记号的方法…场景是我把人声的notes给复制到其他的轨里面之后，想把之前调校的力度和articulation给删了」）
import { clearMarks, swellOf } from "../src/score/song.ts";
describe("选区菜单：清掉记号", () => {
  const build = () => {
    const st0 = initState(), head = tr(st0).slice(0, headLen(tr(st0)));
    let id = 500; const nt = (extra: Partial<NoteTok> = {}): Token => ({ kind: "note", id: id++, pitch: P("C"), dur: TPQ, lyric: "ら", ...extra }) as Token;
    const toks: Token[] = [...head, nt(), { kind: "dyn", id: id++, value: "f" } as Token, nt({ art: ["accent"], slur: true }), { kind: "hairpin", id: id++, dir: "cresc" } as Token, nt({ art: ["swellUp"], chord: [P("E")] }),
      { kind: "groove", id: id++, style: "pop" } as Token, { kind: "tempo", id: id++, bpm: 120 } as Token, nt({ art: ["breath", "whisper"], inhale: "soft" }), nt({ art: ["staccato"] })];
    const st: EditorState = { ...st0, song: { ...st0.song, papers: st0.song.papers.map((p) => ({ ...p, tracks: { ...p.tracks, [st0.at.part]: toks } })) } };
    const first = toks.findIndex((t, i) => i > headLen(toks) && t.kind === "note" && (t as NoteTok).art?.[0] === "accent");
    return select(st, first, toks.length - 1);   // 选中：重音那个音 … 倒数第二个音（最后那个跳音不在里面）；f 挂在第一个音前面
  };
  const kinds = (st: EditorState) => tr(st).slice(headLen(tr(st))).map((t) => t.kind === "note" ? `n${t.art?.some((a) => !a.startsWith("swell")) ? "[" + t.art.filter((a) => !a.startsWith("swell")).join(",") + "]" : ""}${t.slur ? "‿" : ""}${swellOf(t) ?? ""}${t.inhale ? "吸" : ""}${t.chord ? "+" : ""}` : t.kind).join(" ");
  it("曲级：力度字 / 渐强渐弱 / 风格去掉（第一个音前面挂着的 f 也算），速度记号、音身上的不动；选区跟着缩", () => {
    const st = build(), out = clearMarks(st, "phrase");
    eq(kinds(out), "n n[accent]‿ n<+ tempo n[breath,whisper]吸 n[staccato]");
    eq(out.sel!.to - out.sel!.from, st.sel!.to - st.sel!.from - 2, "选区少了里面那两个（渐强渐弱、风格）");
    assert(tr(out)[out.sel!.from].kind === "note", "选区还从那个音起");
  });
  it("音级：演奏法 / 连线 / 音内起伏 / 呼吸 / 出声的换气去掉；叠音、歌词、选区外的不动", () => {
    const out = clearMarks(build(), "note");
    eq(kinds(out), "n dyn n hairpin n+ groove tempo n n[staccato]");
    assert(tr(out).filter((t) => t.kind === "note").every((t) => (t as NoteTok).lyric === "ら"), "歌词都在");
  });
  it("都清 = 两样；没东西可清 = 原样（同一个对象）", () => {
    const out = clearMarks(build(), "all");
    eq(kinds(out), "n n n+ tempo n n[staccato]");
    eq(clearMarks(out, "all"), out);
    const noSel = { ...out, sel: null }; eq(clearMarks(noSel, "all"), noSel, "没有选区 = 原样");
  });
});

// 电脑键盘 Shift+1–7 = 叠（2026-10-10 Opus 5.5；user「shift旧的功能不要，shift用来叠音输入和弦，以及pc上面叠功能找不到了」）
import { stackDegree, writeDegree } from "../src/score/song.ts";
describe("Shift+级数 = 叠到光标前那个音上", () => {
  const top = (st: EditorState) => { const t = tr(st).filter((x) => x.kind === "note").at(-1) as NoteTok; return [t.pitch, ...(t.chord ?? [])].map((q) => pitchName(q!)).join(" "); };
  it("C → 叠 3 = E 在上面；再叠 5 = G；再叠 3 = 去掉 E（XOR）", () => {
    let st = writeDegree(initState(), 1, "near");
    st = stackDegree(st, 3); eq(top(st), "E4 C4");
    st = stackDegree(st, 5); eq(top(st), "G4 E4 C4");
    st = stackDegree(st, 3); eq(top(st), "G4 C4");
  });
  it("G → 叠 3 = E 在下面（离得近）；叠 1 = C 落在离现有的音最近处", () => {
    let st = writeDegree(initState(), 5, "near"); const g = top(st);
    st = stackDegree(st, 3); eq(top(st), `${g} E4`);
    st = stackDegree(st, 1); eq(top(st), `${g} E4 C4`);
  });
  it("光标前是休止 = 原样", () => { const st = writeRest(initState()); eq(stackDegree(st, 3), st); });
});
