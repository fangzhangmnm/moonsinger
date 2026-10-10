// 有选区时：音键 / 0 / ⌫ / − / 叠（v0.10.5 起：选好几个 = 替换整段、只选一个 = 改这个音；光标 = 写音覆盖休止）；整组改时值 = 选区菜单（setSelDur / ÷2 / ×2）。
// created 2026-10-08 by Claude Fable 5.1（整组）；2026-10-08 改成替换模式 by Claude Opus 5.5——
//   user「加一个时长替换模式，类似override…吃掉后面的旋律线」「然后不能写出选区边界」「有选区 = 替换、无选区 = 插入」
//   「移调转调和长度以及其他的操作不要用keyboard，而是一个小的上下文菜单，键盘只做纯粹的打谱」
import { describe, it, eq, assert } from "./runner.mjs";
import { initState, select, setCaret, moveCaret, deleteForward, setSelDur, scaleSelDur, selUnit, writePitch, writeRest, backspace, extend, stackPitch, setUnit, shorter, tr, headLen, TPQ, songOf, type EditorState, type NoteTok, type Token } from "../src/score/song.ts";
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

// v0.10.5（ai-docs/20261010-keyboard-selection-rules.md；user「要不要输入会默认覆盖休止空间？…只有没有休止空间时才会推后面的。然后只在选区里面改的功能不要了，选择的时候输入音符变成替换旧的，剩下的空间变成休止。选区变成光标」
//   「选中单音的时候…可以xor到保留时长的休止符…叠这个字就用来选中上个，然后你也可以调时长」→「同意」）。原来的替换模式（选区当窗口、写字头）去掉了。
function rests(items: (["C" | "D" | "E" | "F" | "G" | "A" | "B", number, string?] | ["r", number] | "|" | "dyn")[]): EditorState {
  let id = 1;
  const toks: Token[] = [{ kind: "key", fifths: 0, id: id++ }, { kind: "time", beats: 4, beatType: 4, id: id++ }, { kind: "tempo", bpm: 90, id: id++ }] as Token[];
  for (const it of items) toks.push((it === "|" ? { kind: "bar", id: id++ } : it === "dyn" ? { kind: "dyn", id: id++, value: "p" } : it[0] === "r" ? { kind: "rest", dur: it[1] * E, id: id++ } : { kind: "note", pitch: P(it[0]), dur: it[1] * E, lyric: it[2] ?? null, id: id++ }) as Token);
  return initState(songOf(toks, { title: "" }));
}
const at = (st: EditorState, c: number) => setCaret(st, c);
describe("写音默认覆盖休止（光标）", () => {
  it("后面是休止 = 吃掉一样长的，后面不挪；吃一半的留下剩的那截", () => {
    const st = writePitch(unit(at(rests([["r", 4], ["D", 1]]), H), 2), P("C"));
    eq(show(st), "C4/1 r/3 D4/1"); eq(st.caret, H + 1, "光标在新音后面：接着写接着覆盖");
    eq(show(writePitch(st, P("E"))), "C4/1 E4/1 r/2 D4/1");
  });
  it("休止不够 = 够的那截吃掉，差的那截才推后面的", () => {
    eq(show(writePitch(unit(at(rests([["r", 1], ["D", 1]]), H), 3), P("C"))), "C4/2 D4/1", "四分吃掉一个八分休止，D 往后推一个八分");
  });
  it("后面是音 = 照旧插（全推）；碰到人插的「|」就停", () => {
    eq(show(writePitch(unit(at(rests([["D", 1], ["r", 2]]), H), 2), P("C"))), "C4/1 D4/1 r/2");
    eq(show(writePitch(unit(at(rests([["r", 1], "|", ["r", 2]]), H), 3), P("C"))), "C4/2 | r/2", "吃到「|」前为止，不越过小节线");
  });
  it("光标和休止之间的记号留在新音前面（力度跟着这个时刻）", () => {
    eq(show(writePitch(unit(at(rests(["dyn", ["r", 2]]), H), 2), P("C"))), "dyn C4/1 r/1");
  });
  it("休止键也一样覆盖", () => { eq(show(writeRest(unit(at(rests([["r", 2], ["D", 1]]), H), 2))), "r/1 r/1 D4/1"); });
  it("⌫ 撤回刚写的 = 吃掉的休止放回去，后面不挪", () => {
    const st = backspace(writePitch(unit(at(rests([["r", 4], ["D", 1]]), H), 2), P("C")));
    eq(show(st), "r/1 r/3 D4/1"); eq(st.caret, H);
  });
  it("「−」拉长刚写的 = 先吃后面的休止；⌫ 撤回 = 放回去", () => {
    let st = extend(writePitch(unit(at(rests([["r", 4], ["D", 1]]), H), 2), P("C")));
    eq(show(st), "C4/2 r/2 D4/1");
    st = backspace(st); eq(show(st), "C4/1 r/1 r/2 D4/1");
  });
});
describe("选了好几个：音键 = 一个一样长的音、⌫ / 休止键 = 一样长的休止，然后选中它（v0.10.7）", () => {
  // user「我知道多选怎么办了：如果是退格就替换成等长的休止，不然的话就是替换成等长的单音。然后接下来就变成单音选择模式了」
  it("音键 = 整段换成一个一样长的音、选中它；后面不挪；接着按音键 = 叠上去", () => {
    let st = writePitch(unit(select(song([["C", 1], ["D", 1], ["E", 1], ["F", 1]]), H, H + 3), 3), P("G"));
    eq(show(st), "G4/3 F4/1", "三个八分 → 一个附点四分，F 不挪"); eq(JSON.stringify(st.sel), JSON.stringify({ from: H, to: H + 1 }));
    st = writePitch(st, P("B")); eq(show(st), "B4+G4/3 F4/1", "接着按 = 叠（改这个音）");
  });
  it("新音接过原来第一个音的歌词", () => {
    eq(show(writePitch(unit(select(song([["C", 2, "la"], ["D", 2, "li"]]), H, H + 2), 2), P("G"))), `G4/4"la"`);
  });
  it("跨了人插的「|」= 每段一个，连音线连起来", () => {
    eq(show(writePitch(unit(select(song([["C", 2], "|", ["D", 2]]), H, H + 3), 2), P("G"))), "G4/2 | G4/2~");
  });
  it("⌫ / 休止键 = 一样长的休止（每段一个）、选中它；Delete 才合拢", () => {
    const base = unit(select(song([["C", 1], ["D", 1], ["E", 1]]), H, H + 2), 2);
    eq(show(backspace(base)), "r/2 E4/1"); eq(show(writeRest(base)), "r/2 E4/1");
    eq(JSON.stringify(backspace(base).sel), JSON.stringify({ from: H, to: H + 1 }));
    eq(show(deleteForward(base)), "E4/1", "Delete = 删掉合拢（照旧）");
  });
  it("「−」= 不动", () => { const base = select(song([["C", 1], ["D", 1], ["E", 1]]), H, H + 2); eq(extend(base), base); });
});
describe("只选了一个音 = 改这个音", () => {
  const one = (items: Parameters<typeof rests>[0], i: number) => unit(select(rests(items), H + i, H + i + 1), 2);
  it("音键 XOR：叠上 / 拿掉；最后一个拿掉 = 一样长的休止；休止上按 = 变回音；选区一直在它身上", () => {
    let st = writePitch(one([["C", 2]], 0), P("E")); eq(show(st), "E4+C4/2");
    st = writePitch(st, P("E")); eq(show(st), "C4/2");
    st = writePitch(st, P("C")); eq(show(st), "r/2", "最后一个拿掉 = 休止（时值不动）");
    st = writePitch(st, P("D")); eq(show(st), "D4/2", "休止上按 = 变回音");
    eq(JSON.stringify(st.sel), JSON.stringify({ from: H, to: H + 1 }));
  });
  it("单声乐器的声部（mono）= 换音高、不叠", () => {
    const st = one([["C", 2]], 0);
    eq(show(writePitch(st, P("E"), false, true)), "E4/2"); eq(writePitch(st, P("C"), false, true).song, st.song, "按它自己的音 = 不动");
  });
  it("拿掉之后后面那个原来连着它的音：连音线断开", () => {
    const base = rests([["C", 1], ["C", 1], ["D", 1]]); const toks = tr(base).slice(); (toks[H + 1] as NoteTok).tie = true;
    const st = writePitch(unit(select(initState(songOf(toks, { title: "" })), H, H + 1), 2), P("C"));
    eq(show(st), "r/1 C4/1 D4/1");
  });
  it("休止键 = 变成一样长的休止", () => { eq(show(writeRest(one([["C", 2], ["D", 1]], 0))), "r/2 D4/1"); });
  it("「−」= 长一步：先吃后面的休止，不够才推", () => {
    let st = extend(one([["C", 1], ["r", 2], ["D", 1]], 0)); eq(show(st), "C4/2 r/1 D4/1");
    st = extend(st); eq(show(st), "C4/3 D4/1");
    st = extend(st); eq(show(st), "C4/4 D4/1", "没休止了 = 推");
  });
  it("⌫ = 短一步：空出来的变休止，后面不挪；短到不能再短 = 不动", () => {
    let st = backspace(one([["C", 2], ["D", 1]], 0)); eq(show(st), "C4/1 r/1 D4/1");
    eq(backspace(st).song, st.song);
  });
  it("← → = 换到前一个 / 后一个（还在改）；到头不动", () => {
    let st = moveCaret(one([["C", 1], "|", ["D", 1], ["E", 1]], 2), 1); eq(st.sel?.from, H + 3);
    st = moveCaret(moveCaret(st, -1), -1); eq(st.sel?.from, H, "跳过「|」");
    eq(moveCaret(st, -1), st, "到头");
  });
  it("Shift+叠 / pad 叠音（stackPitch）= 同样 XOR", () => { eq(show(stackPitch(one([["C", 2]], 0), P("G"))), "G4+C4/2"); });
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
