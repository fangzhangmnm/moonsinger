// 谱内反复 / 跳转的展开（src/score/repeats.ts）。created 2026-10-09 by Claude Opus 5.5
// user「顺便一提谱内的循环和标准的dc这种是不是支持下也不难？…就是普通记谱软件支持的那种。这样，不超过sheet边界」。
// 每小节四个四分音符，歌词 = 小节名（A1 A2 A3 A4 …）；展开后按歌词读出放的顺序（每小节报一次）。
import { describe, it, eq, assert } from "./runner.mjs";
import { TPQ, type Token, type Song, type PaperSeg, type NavWhat } from "../src/score/song.ts";
import { playSegments, sliceBySegments, expandPaper, tickOf } from "../src/score/repeats.ts";

let id = 100;
const head = (): Token[] => [{ kind: "key", id: id++, fifths: 0 }, { kind: "time", id: id++, beats: 4, beatType: 4 }, { kind: "tempo", id: id++, bpm: 120 }] as Token[];
const M = (name: string): Token[] => Array.from({ length: 4 }, (_, k) => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 4 }, dur: TPQ, lyric: k === 0 ? name : null }) as Token);
const bar = (repeat?: "start" | "end" | "both", times?: number): Token => ({ kind: "bar", id: id++, ...(repeat ? { repeat } : {}), ...(times ? { times } : {}) }) as Token;
const nav = (what: NavWhat, nums?: number[]): Token => ({ kind: "nav", id: id++, what, ...(nums ? { nums } : {}) }) as Token;
/** 小节序列语法："A |: B :| C" —— 大写字母 = 一小节；|: :| :|: :|x3 = 反复；[1.] [2.] = 房子；[D.C.] 等 = 跳转；| = 普通小节线（每小节之间自动补 |） */
function track(src: string): Token[] {
  const out = head(); const words = src.split(/\s+/).filter(Boolean);
  const NAV: Record<string, NavWhat> = { "[Segno]": "segno", "[Coda]": "coda", "[Fine]": "fine", "[To_Coda]": "toCoda", "[D.C.]": "dc", "[D.C._al_Fine]": "dcFine", "[D.C._al_Coda]": "dcCoda", "[D.S.]": "ds", "[D.S._al_Fine]": "dsFine", "[D.S._al_Coda]": "dsCoda" };
  let needBar = false;
  for (const w of words) {
    if (/^[A-Z]$/.test(w)) { if (needBar) out.push(bar()); out.push(...M(w)); needBar = true; continue; }
    if (w === "|:") { out.push(bar("start")); needBar = false; continue; }
    const r = /^(:\|:?)(?:x(\d+))?$/.exec(w);
    if (r) { out.push(bar(r[1] === ":|" ? "end" : "both", r[2] ? Number(r[2]) : undefined)); needBar = false; continue; }
    const e = /^\[([\d.]+)\]$/.exec(w);
    if (e) { if (needBar) { out.push(bar()); needBar = false; } out.push(nav("ending", e[1].split(".").filter(Boolean).map(Number))); continue; }
    if (NAV[w]) { const pos = NAV[w] === "segno" || NAV[w] === "coda"; if (pos && needBar) { out.push(bar()); needBar = false; } out.push(nav(NAV[w])); continue; }
    throw new Error(`?? ${w}`);
  }
  return out;
}
const len = (t: Token[]) => t.reduce((a, x) => a + (x.kind === "note" || x.kind === "rest" ? x.dur : 0), 0);
const play = (src: string) => { const t = track(src), segs = playSegments(t, len(t)); let n = -1; const x = segs ? sliceBySegments(t, segs, () => n--) : t; return x.filter((u) => u.kind === "note" && u.lyric).map((u) => (u as { lyric: string }).lyric).join(" "); };

describe("谱内反复：放的顺序（普通记谱软件的读法）", () => {
  it("没有反复 = 原样（null）", () => { const t = track("A B"); eq(playSegments(t, len(t)), null); });
  it("|: A :| B → A A B", () => eq(play("|: A :| B"), "A A B"));
  it("A |: B :| C → A B B C", () => eq(play("A |: B :| C"), "A B B C"));
  it(":|x3 → 一共三遍", () => eq(play("|: A :|x3 B"), "A A A B"));
  it("没有 |: 的 :| = 从开头；第二个 :| = 从上一个 :| 后面", () => eq(play("A :| B :| C"), "A A B B C"));
  it(":|: → 前一段反复、后一段从这儿起", () => eq(play("|: A :|: B :| C"), "A A B B C"));
  it("房子：|: A [1.] B :| [2.] C D → A B A C D", () => eq(play("|: A [1.] B :| [2.] C D"), "A B A C D"));
  it("三个房子 + :|x3：1. 2. 走前两遍、3. 第三遍", () => eq(play("|: A [1.2.] B :|x3 [3.] C"), "A B A B A C"));
  it("最后一个房子后面紧跟新一段反复：|: A [1.] B :| [2.] C |: D :|x3 E → A B A C D D D E", () => eq(play("|: A [1.] B :| [2.] C |: D :|x3 E"), "A B A C D D D E"));
  it("D.C. al Fine：A [Fine] B [D.C._al_Fine] → A B A", () => eq(play("A [Fine] B [D.C._al_Fine]"), "A B A"));
  it("D.C.（没 al）= 跳回开头放到纸尾；Fine 在第一遍不停", () => eq(play("A [Fine] B [D.C.] "), "A B A B"));
  it("D.S. al Coda：A [Segno] B [To_Coda] C [D.S._al_Coda] [Coda] D → A B C B D", () => eq(play("A [Segno] B [To_Coda] C [D.S._al_Coda] [Coda] D"), "A B C B D"));
  it("跳回来之后反复不再反复：|: A :| B [D.C.] → A A B A B", () => eq(play("|: A :| B [D.C.]"), "A A B A B"));
  it("D.S. 没有 Segno = 不跳", () => eq(play("A B [D.S.]"), "A B"));
  it("D.C. 只跳一次（不会死循环）", () => eq(play("A [D.C.] B [D.C.]"), "A A B"));
});

describe("谱内反复：每条 track 一起展开", () => {
  const paperOf = (tracks: Record<string, Token[]>): { song: Song; paper: PaperSeg } => {
    const paper: PaperSeg = { id: "p1", name: "", tracks };
    return { song: { papers: [paper], parts: Object.keys(tracks).map((k) => ({ id: k, role: "r" + k, mic: "m" + k })) } as unknown as Song, paper };
  };
  it("结构看最上面那位；第二位短了 = 每段补休止，两条一样长", () => {
    const a = track("|: A :| B"), b = [...head(), ...M("x").slice(0, 2)];   // 第二位只有半小节
    const { song, paper } = paperOf({ P1: a, P2: b });
    let n = -1; const x = expandPaper(song, paper, () => n--);
    eq(len(x.tracks.P1), TPQ * 12); eq(len(x.tracks.P2), TPQ * 12, "第二位也是三小节长");
    eq(x.tracks.P2.filter((t) => t.kind === "note").length, 4, "它的两个音跟着反复放了两遍");
  });
  it("第二位里写的反复不起作用（只看最上面那位），而且展开后拿掉", () => {
    const a = track("A B"), b = track("|: A :| B");
    const { song, paper } = paperOf({ P1: a, P2: b });
    let n = -1; const x = expandPaper(song, paper, () => n--);
    eq(len(x.tracks.P1), TPQ * 8); assert(!x.tracks.P2.some((t) => (t.kind === "bar" && t.repeat) || t.kind === "nav"), "反复记号拿掉了");
  });
  it("抄出来的第二遍换负 id；反复小节线变普通的；房子 / 跳转拿掉", () => {
    const t = track("|: A [1.] B :| [2.] C"); let n = -1; const segs = playSegments(t, len(t))!, x = sliceBySegments(t, segs, () => n--);
    const ids = x.map((u) => u.id); eq(new Set(ids).size, ids.length, "id 不重复");
    assert(x.every((u) => u.kind !== "nav" && !(u.kind === "bar" && u.repeat)), "没有反复 / 跳转记号了");
  });
  it("跳过去补那一刻的状态：Segno 前面的速度 / 力度在跳回来的时候补上", () => {
    const t = track("A [Segno] B [D.S.]"), bi = t.findIndex((u) => u.kind === "nav");
    t.splice(bi + 1, 0, { kind: "dyn", id: id++, value: "p" } as Token);   // Segno 处 p
    t.splice(3, 0, { kind: "dyn", id: id++, value: "f" } as Token);        // 开头 f
    const end = t.findIndex((u) => u.kind === "nav" && u.what === "ds"); t.splice(end, 0, { kind: "tempo", id: id++, bpm: 60 } as Token);   // 跳之前变慢
    let n = -1; const x = sliceBySegments(t, playSegments(t, len(t))!, () => n--), ticks = tickOf(x);
    const at = TPQ * 8;   // 第二段（Segno 那儿）在展开后的第 8 拍
    const before = x.filter((u, k) => ticks[k] === at && (u.kind === "tempo" || u.kind === "dyn")).map((u) => (u.kind === "tempo" ? `T${u.bpm}` : (u as { value: string }).value));
    eq(before.join(" "), "T120 f p", "跳回 Segno：速度回到那一刻的 120、力度先补 f 再是 Segno 处写的 p");
  });
});

describe("谱内反复：存档（MusicXML 原生）/ 简谱文字 / 压平", () => {
  const meta = { software: "test", date: "2026-10-09" }, info = { id: "P1", name: "Vocals", instrumentName: "月读", sound: "voice.vocals", program: 55 };
  const shape = (ts: Token[]) => ts.filter((t) => t.kind !== "key" && t.kind !== "time" && t.kind !== "tempo").map((t) => t.kind === "note" ? ((t as { lyric: string | null }).lyric ?? "n") : t.kind === "bar" ? (t.repeat ? `${t.repeat}${t.times ? "x" + t.times : ""}` : "|") : t.kind === "nav" ? (t.what === "ending" ? `[${(t.nums ?? []).join(".")}]` : t.what) : t.kind).join(" ");
  const SRC = "|: A [1.] B :| [2.] C |: D :|x3 [Segno] E [To_Coda] F [D.S._al_Coda] [Coda] G [Fine]";
  it("写出去再读回来：反复小节线（含遍数、纸头的 |:）、房子、Segno / Coda / To Coda / D.S. al Coda / Fine 一个不丢、位置不变", async () => {
    const { writeMusicXml, readMusicXml } = await import("../src/format/musicxml.ts");
    const toks = track(SRC), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    assert(/<barline location="left"><bar-style>heavy-light<\/bar-style><repeat direction="forward"\/><\/barline>/.test(w.xml), "|: = forward repeat");
    assert(/<repeat direction="backward" times="3"\/>/.test(w.xml), ":|x3 = times=3");
    assert(/<ending number="1" type="start">1\.<\/ending>/.test(w.xml) && /<ending number="1" type="stop"\/><repeat direction="backward"\/>/.test(w.xml), "房子 1 收在 :| 上");
    assert(/<ending number="2" type="discontinue"\/>/.test(w.xml), "最后一个房子 = discontinue");
    assert(/<segno id="nav\.segno\.\d+"\/>/.test(w.xml) && /<sound dalsegno="segno"\/>/.test(w.xml) && /<sound tocoda="coda"\/>/.test(w.xml) && /<sound fine="yes"\/>/.test(w.xml), "跳转 = segno / sound");
    assert(!/<measure number="1"><attributes>[\s\S]*?<\/attributes><barline[^>]*><bar-style>heavy-light<\/bar-style><repeat direction="forward"\/><\/barline><\/measure>/.test(w.xml), "纸头的 |: 不开空小节");
    const back = readMusicXml(w.xml, { manualBars: w.manualBars, unwritten: w.unwritten }).parts[0].tokens;
    eq(shape(back), shape(toks));
  });
  it("别家谱（没有我们的 id）：靠 <sound> / <segno/> / 字认出来", async () => {
    const { writeMusicXml, readMusicXml } = await import("../src/format/musicxml.ts");
    const toks = track("A [Segno] B [D.S._al_Fine] [Fine]"), w = writeMusicXml({ parts: [{ info, tokens: toks }] }, meta);
    const plain = w.xml.replace(/ id="nav\.[^"]*"/g, "");
    const back = readMusicXml(plain).parts[0].tokens.filter((t) => t.kind === "nav").map((t) => (t as { what: string }).what);
    eq(back.join(" "), "segno dsFine fine");
  });
  it("整首存 / 开（.mxl）：在纸的正本里；派生的压平件（score.musicxml）已经展开、没有反复记号", async () => {
    const { saveMxl, openBytes, emptyExtras } = await import("../src/format/project.ts");
    const { unzipSync, strFromU8 } = await import("../vendor/fflate/fflate.esm.js");
    const { initState, withTrack, tr } = await import("../src/score/song.ts");
    const st = initState(), toks = [...tr(st).slice(0, 3), ...track("|: A :| B").slice(3)];
    const song = withTrack(st.song, st.at.paper, st.at.part, toks);
    const bytes = saveMxl({ song, hum: "n", extras: emptyExtras(), app: "test", date: "2026-10-09" }), files = unzipSync(bytes);
    const o = openBytes("x.mxl", bytes);
    eq(shape(o.song.papers[0].tracks[o.song.parts[0].id]), shape(toks), "正本读回来一样");
    const flat = strFromU8(files["score.musicxml"]);
    assert(!/<repeat /.test(flat) && (flat.match(/<lyric/g) ?? []).length === 3, "压平件展开了（A A B 三个字）、没有 <repeat>");
  });
  it("简谱文字：|: :|x3 :|: [1.2.] [D.S._al_Coda] 往返", async () => {
    const { toJianpu, fromJianpu } = await import("../src/score/clipboard.ts");
    const toks = track("|: A [1.2.] B :|x3 [3.] C |: D :|: E :| [Segno] F [D.S._al_Coda] [Coda]").slice(3);
    const txt = toJianpu(toks, 0);
    assert(txt.includes("|:") && txt.includes(":|x3") && txt.includes(":|:") && txt.includes("[1.2.]") && txt.includes("[D.S._al_Coda]"), txt);
    eq(shape(fromJianpu(txt, 0)!), shape(toks));
  });
});
