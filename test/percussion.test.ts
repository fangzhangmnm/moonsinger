// 鼓谱（v0.10.27）：台上是鼓 / 音效 = 不分音高的「一下」——一线谱 / 五线鼓谱、符头按音乐仓鼠 v13 的表、着力点提前放。created 2026-10-10 by Claude Opus 5.5
// user「这个做好之后鼓谱做一下。团子只剩下鼓和音效了」「单乐器一线谱同意」；设计账 ai-docs/20261010-shared-staff-percussion-design.md §2–3。
import { describe, it, eq, assert } from "./runner.mjs";
import { percOf, percKindOf } from "../src/gm/percussion.ts";
import { engrave, type PartView } from "../src/render/engrave.ts";
import { PERC_CLEF, PERC_HEAD } from "../src/render/smufl.ts";
import { initState, addPart, addPaper, setPartHost, setFocus, headLen, TPQ, DEFAULT_BPM, type Token, type EditorState, type PartDef, type Song } from "../src/score/song.ts";
import { emptyExtras, activePerfSpec } from "../src/format/project.ts";
import { buildTimeline, LEAD_IN, type PerformerInfo } from "../src/engine/timeline.ts";

let nid = 9900;
const key = (midi: number, dur = TPQ): Token => { const oct = Math.floor(midi / 12) - 1, steps = ["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"], alt = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]; return { kind: "note", id: nid++, pitch: { step: steps[midi % 12], alter: alt[midi % 12], octave: oct }, dur, lyric: null } as Token; };
const KICK = percOf(128, 0, 36)!, HAT = percOf(128, 0, 42)!, REV = percOf(0, 119)!;
/** 一位（或几位）歌手、每位一串鼓键；perc = 台上那位怎么记谱。 */
function song(tracks: Token[][]): EditorState {
  let st = initState(); for (let k = 1; k < tracks.length; k++) st = addPart(st, { id: `P${k + 1}`, role: `r${k + 1}`, mic: `m${k + 1}` });
  const pp = st.song.papers[0], ids = st.song.parts.map((p) => p.id);
  return { ...st, song: { ...st.song, papers: [{ ...pp, tracks: Object.fromEntries(ids.map((id, k) => [id, [...pp.tracks[id].slice(0, headLen(pp.tracks[id])), ...tracks[k]]])) }] } };
}
const views = (st: EditorState, perc: (PartView["perc"] | undefined)[]): PartView[] => st.song.parts.map((p, k) => ({ id: p.id, name: `V${k}`, empty: false, first: k === 0, hidden: false, badges: [], mono: false, ...(perc[k] ? { perc: perc[k] } : {}) }));
const lay = (st: EditorState, perc: (PartView["perc"] | undefined)[]) => engrave(st.song, { width: 900, sp: 10, at: st.at, caret: 0, sel: null, parts: views(st, perc), measureLyric: (s: string) => s.length * 10, autoBars: true });
const staffLines = (L: ReturnType<typeof lay>, row: number) => L.prims.filter((p) => p.t === "line" && p.cls === "staff" && Math.abs(p.y1 - L.systems[row].staffTop) < 4.5 * L.sp && p.y1 >= L.systems[row].staffTop - 1).length;
const heads = (L: ReturnType<typeof lay>) => L.prims.filter((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.split(" ").includes("note")) as { ch: string; x: number; y: number }[];

describe("鼓谱：查表（音乐仓鼠 v13）", () => {
  it("鼓键 / 音效：哪一线、什么符头、符干、着力点", () => {
    eq(KICK.staff, 5); eq(KICK.line, 7); eq(KICK.stem, "down"); eq(HAT.head, "x"); eq(HAT.line, -1);
    eq(REV.staff, 1); assert(Math.abs((REV.hitSec ?? 0) - 1.389) < 1e-6, "反向镲着力点 1.389 s（快结尾）");
    eq(percOf(128, 25, 38)?.line, percOf(128, 0, 38)?.line, "别的鼓组（GS 808…）按 GM 标准键位");
    eq(percOf(0, 0), null, "钢琴不是鼓");
  });
  it("台上那位：整套鼓 = kit；固定敲一件（鼓件 / 音效固定原速）= 一线谱；音效关了固定原速 / 有音高 = 照五线谱", () => {
    eq(percKindOf({ bank: 128, program: 0 })?.kind, "kit");
    const one = percKindOf({ bank: 128, program: 0, note: 42 }); eq(one?.kind, "one"); eq(one?.kind === "one" ? one.info.head : null, "x");
    eq(percKindOf({ bank: 0, program: 119, note: 60 })?.kind, "one", "反向镲固定原速");
    eq(percKindOf({ bank: 0, program: 119 }), null, "关了固定原速（按写的音变调）= 有音高");
    eq(percKindOf({ bank: 0, program: 9 }), null, "钟琴 = 有音高");
    // GM 116 Woodblock / 117 Taiko：gm-map 那一行没写鼓谱，借本尊概念的（v0.10.31，user「这里没变成鼓谱…以及wood block和太鼓的分类你确定没问题？」）
    eq(percKindOf({ bank: 0, program: 115, note: 60 })?.kind, "one", "木鱼（固定原速）= 一线谱");
    eq(percKindOf({ bank: 0, program: 116, note: 60 })?.kind, "one", "太鼓（固定原速）= 一线谱");
    eq(percOf(0, 115)?.kitKey, 76); eq(percOf(0, 116)?.kitKey, 87);
  });
});

describe("鼓谱：排版", () => {
  it("固定敲一件 = 一线谱：一条线、打击乐谱号、没有调号 / 升降号、音都在那条线上、符头按表（踩镲 = ×）、符干朝上", () => {
    const st = song([[key(61), key(66), key(70)]]);   // 写的音高各不一样（还带升号）：都画在线上
    const L = lay(st, [{ kind: "one", info: HAT, key: 42 }]), row = L.systems[0], mid = row.staffTop + 2 * L.sp;
    eq(staffLines(L, 0), 1, "一条线");
    assert(L.prims.some((p) => p.t === "glyph" && p.ch === PERC_CLEF), "打击乐谱号");
    assert(!L.prims.some((p) => p.t === "glyph" && typeof p.cls === "string" && p.cls.startsWith("keysig")), "没有调号");
    const hs = heads(L); eq(hs.length, 3);
    assert(hs.every((h) => Math.abs(h.y - mid) < 0.01 && h.ch === PERC_HEAD.x.ch[0]), `都在那条线上、× 符头（${hs.map((h) => h.y - row.staffTop).join(",")}）`);
    assert(!L.prims.some((p) => p.t === "glyph" && ["\u{E262}", "\u{E260}", "\u{E261}"].includes(p.ch)), "不画升降号");
  });
  it("整套鼓 = 五线鼓谱：大鼓第一间下（line 7）、踩镲第五线上（× 符头）；只有脚 = 符干朝下", () => {
    const st = song([[key(36), key(42), key(36)]]);
    const L = lay(st, [{ kind: "kit" }]), row = L.systems[0];
    eq(staffLines(L, 0), 5, "五条线");
    const hs = heads(L), ys = hs.map((h) => Math.round(((h.y - row.staffTop) / L.sp) * 2) / 2);
    eq(ys.join(","), "3.5,-0.5,3.5", "大鼓 = 第五线往下 3.5 格；踩镲 = 第五线上半格");
    eq(hs[1].ch, PERC_HEAD.x.ch[0], "踩镲 ×");
    const stemDown = (h: { x: number; y: number }) => L.prims.some((p) => p.t === "line" && Math.abs(p.x1 - p.x2) < 0.01 && p.x1 >= h.x - 1 && p.x1 <= h.x + 2 * L.sp && Math.min(p.y1, p.y2) >= h.y - 3 && Math.max(p.y1, p.y2) > h.y + 2 * L.sp);
    assert(stemDown(hs[0]) && !stemDown(hs[1]), "大鼓（脚）符干朝下、踩镲（手）朝上");
  });
  it("一家合租全是鼓件 = 一行五线鼓谱，各在自己那一线（鼓组 = 一家合租）", () => {
    let st = song([[key(60), key(60)], [key(60), key(60)], [key(60)]]);   // 写的音高都一样：各人的线按台上那件
    const [a, b, c] = st.song.parts.map((p) => p.id);
    st = setPartHost(st, b, a); st = setFocus(st, st.song.papers[0].id, c);   // 光标在第三位那儿 = 鼓这一家叠着
    const L = lay(st, [{ kind: "one", info: KICK, key: 36 }, { kind: "one", info: HAT, key: 42 }, undefined]);
    const hi = L.systems.findIndex((r) => r.part === a), row = L.systems[hi];
    eq(staffLines(L, hi), 5, "叠起来的鼓 = 五线");
    const ys = new Set(heads(L).filter((h) => h.y > row.top && h.y < row.bottom).map((h) => Math.round(((h.y - row.staffTop) / L.sp) * 2) / 2));
    assert(ys.has(3.5) && ys.has(-0.5), `大鼓 3.5、踩镲 −0.5 都在（${[...ys]}）`);
  });
});

describe("鼓谱：木鱼 + 太鼓合租（v0.10.31）", () => {
  it("两件单件乐器叠成一行 = 五线鼓谱，各在自己那一线（概念的 mainKey）", () => {
    let st = song([[key(60), key(60)], [key(62), key(62)], [key(60)]]);
    const [a, b2, c] = st.song.parts.map((p) => p.id); st = setPartHost(st, b2, a); st = setFocus(st, st.song.papers[0].id, c);
    const L = lay(st, [{ kind: "one", info: percOf(0, 116)!, key: 60 }, { kind: "one", info: percOf(0, 115)!, key: 60 }, undefined]);
    const hi = L.systems.findIndex((r) => r.part === a), row = L.systems[hi];
    eq(staffLines(L, hi), 5, "五线鼓谱");
    const ys = new Set(heads(L).filter((h) => h.y > row.top && h.y < row.bottom).map((h) => Math.round(h.y)));
    eq(ys.size, 2, "两件各一线");
  });
});
describe("鼓谱：着力点", () => {
  it("反向镲：录音房提前 hitSec 开始放、砸在写的那一拍；时间线从提前的地方起；有音高的不挪", () => {
    let st = initState(); st = addPaper(st);
    const pid = st.song.parts[0].id, pp = st.song.papers[0];
    const songX: Song = { ...st.song, papers: [{ ...pp, tracks: { [pid]: [...pp.tracks[pid].slice(0, headLen(pp.tracks[pid])), key(60), key(60)] } }, ...st.song.papers.slice(1)] };
    const spec = activePerfSpec(emptyExtras(), "r"), Q = 60 / DEFAULT_BPM;
    const info = (hit?: (k: number) => number): PerformerInfo => ({ engine: "soundfont", spec, velocity: 0.8, transpose: 0, gm: { sha: "S", presetIndex: 3, note: 60 }, chunk: "phrase", follow: () => 0, ...(hit ? { hitSec: hit } : {}) });
    const b = (i: PerformerInfo) => buildTimeline({ song: songX, order: songX.papers.map((p) => p.id), parts: songX.parts as PartDef[], info: () => i, hum: "n", singOpt: { leadIn: LEAD_IN } });
    const plain = b(info()), rev = b(info(() => REV.hitSec!));
    const n0 = plain.tracks[0].kind === "sf" ? plain.tracks[0].notes : [], n1 = rev.tracks[0].kind === "sf" ? rev.tracks[0].notes : [];
    assert(Math.abs(n0[1].t0 - Q) < 1e-9, "不挪：第二拍");
    assert(Math.abs(n1[1].t0 - (Q - REV.hitSec!)) < 1e-9 && Math.abs(n1[0].t0 + REV.hitSec!) < 1e-9, `提前 ${REV.hitSec} s（${n1.map((x) => x.t0.toFixed(3))}）`);
    assert(Math.abs(rev.range.from + REV.hitSec!) < 1e-9, `时间线从 −${REV.hitSec} 起（${rev.range.from}）`);
  });
});
