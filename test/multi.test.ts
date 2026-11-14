// 选了好几行（src/score/multi.ts；设计稿第六节，user「跨行也精确到音」「贴不下时整块不贴」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：算不算在里面只看起点；复制带偏移、带歌词和挂在音上的记号；退格变一样长的休止、不合拢；
//     「把一行里一段时间换掉」等长不推、切开休止、切到音中间 = 贴不下；整块贴每一种贴不下都整块不贴；再来一遍跟着走。
import { describe, it, eq, assert } from "./runner.mjs";
import { songOf, TPQ, trackOf, headLen, type Song, type Token, type NoteTok } from "../src/score/song.ts";
import { rowRange, normalize, copyBlock, clearBlock, replaceSpan, pasteBlock, repeatBlock, caretTick, trackLen, type MultiSel, type RowKind } from "../src/score/multi.ts";
import { pitchName } from "../src/score/pitch.ts";

const E = TPQ / 2;   // 八分
type It = [string, number, string?] | "|" | "f" | "p";
let nid = 1;
/** 一行：调 / 拍 / 速度 + 音（["C4", 几个八分, 歌词?]；"r" = 休止；"|" = 人插的小节线；"f" / "p" = 力度记号）。 */
function row(items: It[]): Token[] {
  const toks: Token[] = [{ kind: "key", fifths: 0, id: nid++ }, { kind: "time", beats: 4, beatType: 4, id: nid++ }, { kind: "tempo", bpm: 90, id: nid++ }] as Token[];
  for (const it of items) {
    if (it === "|") toks.push({ kind: "bar", id: nid++ } as Token);
    else if (it === "f" || it === "p") toks.push({ kind: "dyn", value: it, id: nid++ } as Token);
    else if (it[0] === "r") toks.push({ kind: "rest", dur: it[1] * E, id: nid++ } as Token);
    else toks.push({ kind: "note", pitch: { step: it[0][0] as "C", alter: 0, octave: Number(it[0].slice(1)) }, dur: it[1] * E, lyric: it[2] ?? null, id: nid++ } as Token);
  }
  return toks;
}
/** 几行的歌：P1、P2、P3…，都在纸 p1 上。 */
function song(...rows: Token[][]): Song {
  const s = songOf(rows[0], { title: "" });
  const parts = rows.map((_, k) => ({ ...s.parts[0], id: `P${k + 1}` }));
  return { ...s, parts, papers: [{ ...s.papers[0], tracks: Object.fromEntries(rows.map((r, k) => [`P${k + 1}`, r])) }] };
}
const show = (s: Song, part: string) => { const tk = trackOf(s, "p1", part); return tk.slice(headLen(tk)).map((t) => t.kind === "note"
  ? `${t.pitch ? pitchName(t.pitch) : "?"}/${t.dur / E}${t.lyric ? `"${t.lyric}"` : ""}${t.tie ? "~" : ""}`
  : t.kind === "rest" ? `r/${t.dur / E}` : t.kind === "bar" ? "|" : t.kind === "dyn" ? t.value : t.kind).join(" "); };
const pitched = (): RowKind => "pitched";
/** 贴得下的那一种（类型收窄 + 断言）。 */
function ok<T extends object>(r: T): Exclude<T, { fail: unknown }> { assert(!("fail" in r), `贴不下：${JSON.stringify((r as { fail?: unknown }).fail)}`); return r as Exclude<T, { fail: unknown }>; }
const m = (parts: string[], a: number, b: number): MultiSel => ({ paper: "p1", parts, t0: a * E, t1: b * E });

describe("选了好几行：选区只看起点", () => {
  it("起点在前面、响进来的长音不算；起点在里面、尾巴伸出去的整个算；第一个音前面挂着的力度一起", () => {
    const tk = row([["C4", 4], "f", ["D4", 2], ["E4", 4]]);   // C 0–4，f D 4–6，E 6–10
    const r = rowRange(tk, 2 * E, 7 * E)!;
    eq(r.s0, 4 * E, "C 起点在 0，不算"); eq(r.s1, 10 * E, "E 起点在 6，尾巴到 10 整个算");
    eq(tk[r.a].kind, "dyn", "f 挂在 D 前面，一起"); eq(r.b, tk.length);
    eq(rowRange(tk, 1 * E, 3 * E), null, "这段时间里没有音起头 = 空");
  });
  it("normalize：时间 = 几行里起点在里面的音最早的起点到最晚的终点", () => {
    const s = song(row([["C4", 2], ["D4", 2]]), row([["E4", 1], ["F4", 4]]));
    const n = normalize(s, "p1", ["P1", "P2"], 1 * E, 3 * E)!;
    eq([n.t0 / E, n.t1 / E].join(","), "1,5", "P2 的 F 起点 1 到 5；P1 的 D 起点 2 到 4");
  });
});

describe("复制 / 退格 / 剪切", () => {
  it("复制：每行记偏移和自己那一截的长短；带歌词和力度；人插的「|」和调号这类骨架不带；第一个音连着前面的连音线断开", () => {
    const t2 = row([["C4", 2], ["C4", 2], "|", ["G4", 2, "啊"], ["A4", 2]]);
    (t2[4] as NoteTok).tie = true;   // 第二个 C 连着第一个
    const s = song(row([["E4", 2], "p", ["F4", 2, "嗯"], ["G4", 4]]), t2);
    const b = copyBlock(s, m(["P1", "P2"], 2, 6), pitched);
    eq(b.len, 4 * E);
    eq(b.rows[0].off, 0); eq(b.rows[0].len, 6 * E, "G 起点 4 在里面、尾巴到 8 = 整个带走"); eq(b.rows[0].toks.map((t) => t.kind).join(","), "dyn,note,note");
    eq((b.rows[0].toks[1] as NoteTok).lyric, "嗯");
    eq(b.rows[1].off, 0); eq(b.rows[1].toks.map((t) => t.kind).join(","), "note,note", "「|」不带");
    eq((b.rows[1].toks[0] as NoteTok).tie, undefined, "连着块外面的连音线断开");
  });
  it("退格：每行选中的变成一样长的休止，不合拢、各行一样长；挂着的力度去掉、「|」留着；后面连着的连音线断开", () => {
    const t1 = row([["C4", 2], "f", ["D4", 2], "|", ["E4", 2], ["E4", 2]]);
    (t1[t1.length - 1] as NoteTok).tie = true;
    const s = song(t1, row([["G4", 1], ["A4", 3], ["B4", 4]]));
    const before = [trackLen(trackOf(s, "p1", "P1")), trackLen(trackOf(s, "p1", "P2"))];
    const c = clearBlock(s, m(["P1", "P2"], 2, 6));
    eq(show(c, "P1"), "C4/2 r/2 | r/2 E4/2");
    eq(show(c, "P2"), "G4/1 A4/3 r/4", "A 起点 1 不算；B 起点 4 算");
    eq([trackLen(trackOf(c, "p1", "P1")), trackLen(trackOf(c, "p1", "P2"))].join(","), before.join(","), "不合拢");
  });
});

describe("把一行里一段时间换掉（replaceSpan）", () => {
  const src = (items: It[]) => row(items).slice(3);
  it("等长换掉、后面不挪；落点切到休止 = 把休止切开", () => {
    const tk = row([["C4", 2], ["r", 4], ["G4", 2]]);
    const r = ok(replaceSpan(tk, 3 * E, src([["E4", 2]]), 2 * E, 900));
    const s = song(r.tokens); eq(show(s, "P1"), "C4/2 r/1 E4/2 r/1 G4/2");
    eq(trackLen(r.tokens), trackLen(tk), "一样长");
  });
  it("落点的开头或结尾切到音的中间 = 贴不下（cut）", () => {
    const tk = row([["C4", 4], ["D4", 4]]);
    const a = replaceSpan(tk, 1 * E, src([["E4", 2]]), 2 * E, 900); eq("fail" in a && a.fail, "cut", "开头切进 C");
    const b = replaceSpan(tk, 0, src([["E4", 2]]), 2 * E, 900); eq("fail" in b && b.fail, "cut", "结尾切进 C");
    ok(replaceSpan(tk, 0, src([["E4", 4]]), 4 * E, 900));   // 正好对齐 = 能贴
  });
  it("这一行不够长 = 先在行尾补休止再贴；贴进来的比这段短 = 后面补休止", () => {
    const tk = row([["C4", 2]]);
    const r = ok(replaceSpan(tk, 4 * E, src([["E4", 1]]), 2 * E, 900));
    eq(show(song(r.tokens), "P1"), "C4/2 r/2 E4/1 r/1");
  });
  it("目标行在这段时间里有人插的「|」、落在贴进来的音中间 = 在那儿切开、连音线连上；歌词只留在前一截", () => {
    const tk = row([["C4", 2], "|", ["D4", 2]]);
    const r = ok(replaceSpan(tk, 0, src([["E4", 4, "哦"]]), 4 * E, 900));
    eq(show(song(r.tokens), "P1"), "E4/2\"哦\" | E4/2~");
  });
  it("贴进来的块自己带的「|」不进来（行的骨架是目标行的）", () => {
    const tk = row([["C4", 4]]);
    const r = ok(replaceSpan(tk, 0, src([["E4", 2], "|", ["F4", 2]]), 4 * E, 900));
    eq(show(song(r.tokens), "P1"), "E4/2 F4/2");
  });
});

describe("整块贴：贴不下 = 整块不贴，说是哪一行、为什么", () => {
  const two = () => song(row([["C4", 2], ["D4", 2], ["r", 4]]), row([["E4", 2], ["F4", 2], ["r", 4]]), row([["G4", 8]]));
  it("贴好了：块最上面那行对光标那一行，其余往下一行对一行；等长不推；贴完选中贴上去的那一块", () => {
    const s = two(), b = copyBlock(s, m(["P1", "P2"], 0, 4), pitched);
    const r = ok(pasteBlock(s, "p1", [{ part: "P1", kind: "pitched" }, { part: "P2", kind: "pitched" }], 4 * E, b, 900));
    eq(show(r.song, "P1"), "C4/2 D4/2 C4/2 D4/2"); eq(show(r.song, "P2"), "E4/2 F4/2 E4/2 F4/2");
    eq(JSON.stringify(r.sel), JSON.stringify(m(["P1", "P2"], 4, 8)));
  });
  it("下面的行不够 = rows；有音高的贴到打击乐的行上 = kind；落点切到音中间 = cut；目标行只读 = locked", () => {
    const s = two(), b = copyBlock(s, m(["P1", "P2"], 0, 4), pitched);
    const tg = (k2: RowKind, ro = false) => [{ part: "P2", kind: "pitched" as RowKind }, { part: "P3", kind: k2, readOnly: ro }];
    const r1 = pasteBlock(s, "p1", [{ part: "P1", kind: "pitched" }], 0, b, 900);
    eq("fail" in r1 && `${r1.fail.why}@${r1.fail.row}`, "rows@1");
    const r2 = pasteBlock(s, "p1", tg("perc"), 4 * E, b, 900);
    eq("fail" in r2 && `${r2.fail.why}@${r2.fail.part}`, "kind@P3");
    const r3 = pasteBlock(s, "p1", tg("pitched"), 2 * E, b, 900);
    eq("fail" in r3 && `${r3.fail.why}@${r3.fail.part}`, "cut@P3", "P3 的 G 长 8，从 2 切进去");
    const r4 = pasteBlock(s, "p1", tg("pitched", true), 4 * E, b, 900);
    eq("fail" in r4 && `${r4.fail.why}@${r4.fail.part}`, "locked@P3");
  });
  it("第一行贴得下、第二行贴不下 = 两行都不动（歌原样）", () => {
    const s = two(), b = copyBlock(s, m(["P1", "P2"], 0, 4), pitched);
    const r = pasteBlock(s, "p1", [{ part: "P1", kind: "pitched" }, { part: "P3", kind: "pitched" }], 2 * E, b, 900);
    assert("fail" in r); eq(show(s, "P1"), "C4/2 D4/2 r/4"); eq(show(s, "P3"), "G4/8");
  });
  it("打击乐复制到有音高的行 = kind", () => {
    const s = two(), b = copyBlock(s, m(["P1", "P2"], 0, 4), (p) => (p === "P2" ? "perc" : "pitched"));
    const r = pasteBlock(s, "p1", [{ part: "P1", kind: "pitched" }, { part: "P2", kind: "pitched" }], 4 * E, b, 900);
    eq("fail" in r && `${r.fail.why}@${r.fail.row}`, "kind@1");
  });
});

describe("再来一遍", () => {
  it("贴在这段时间的结尾、同样的几行；选区跟过去，连按 = 刷 pattern；贴不下整块不贴", () => {
    let s = song(row([["C4", 1], ["D4", 1], ["r", 6]]), row([["E4", 2], ["r", 6]]));
    let sel: MultiSel = m(["P1", "P2"], 0, 2), id = 900;
    for (let k = 0; k < 3; k++) { const r = ok(repeatBlock(s, sel, pitched, id)); s = r.song; sel = r.sel; id = r.id; }
    eq(show(s, "P1"), "C4/1 D4/1 C4/1 D4/1 C4/1 D4/1 C4/1 D4/1");
    eq(show(s, "P2"), "E4/2 E4/2 E4/2 E4/2");
    eq([sel.t0 / E, sel.t1 / E].join(","), "6,8");
    const s2 = song(row([["C4", 2], ["D4", 4]]), row([["E4", 2], ["F4", 4]]));
    const r = repeatBlock(s2, m(["P1", "P2"], 0, 2), pitched, 900);
    eq("fail" in r && r.fail.why, "cut", "结尾切进 D");
  });
  it("光标在哪个时刻（补齐的淡色小节里再加 lead）", () => {
    const tk = row([["C4", 2], "f", ["D4", 2]]);
    eq(caretTick(tk, 3, 0), 0); eq(caretTick(tk, 4, 0), 2 * E); eq(caretTick(tk, tk.length, 3 * E), 7 * E);
  });
});
