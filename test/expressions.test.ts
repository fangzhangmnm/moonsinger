// 「演奏法和表情：不显示」（施工单 7-G；score minor 8）：键盘「演奏法」「力度」两页上的东西不交给排版。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   守：① 名单从键盘那两页 / 记号表来，不另抄（两页上每个键都落在拿掉的那几类里）② 预处理不挪下标、没动的轨原样共享 ③ 三种谱上拿干净（没有一个这些记号的图元、点击框）
//   ④ 行高降：只含零宽记号的歌，行一一对应，每行不高于显示时、有力度的行严格变矮，音的横坐标不变 ⑤ 用全的测试歌（含占横向的呼吸 / 琶音 / 幽灵音 / 滚奏 / 气声）总高不变高
//   ⑥「折叠 N」= 这一段看得见的声部里折叠了几处；显示时没有。统筹裁定（施工单第五节末尾）：占横向的那五样也不交给量，「横坐标不变」只对零宽的成立。
import { describe, it, eq, assert } from "./runner.mjs";
import { engrave, type Layout } from "../src/render/engrave.ts";
import { foldExpressions, foldedMarks, foldedCount, FOLDED_TOKEN_KINDS } from "../src/render/expressions.ts";
import { SIGNS, type SignId } from "../src/render/signs.ts";
import { SYM_PAGES } from "../src/keyboard/pad-layout.ts";
import { ARTS, type Song, type Token, type NoteTok } from "../src/score/song.ts";
import { FULL_VIEWS } from "./fixtures/layout/full.ts";
import { fullSong } from "./fixtures/layout/full-song.ts";

const view = FULL_VIEWS.find((v) => v.name === "edit-all")!;
const hide = (s: Song): Song => ({ ...s, expressions: false });
const lay = (s: Song): Layout => engrave(s, view.opts(s));
const NOTATIONS = ["staff", "jianpu", "letters"] as const;
const withNotation = (s: Song, n: (typeof NOTATIONS)[number]): Song => (n === "staff" ? s : { ...s, notation: n });
/** 占横向地方的那几样（拿掉 = 后面的音往前收）：呼吸（连带「吸」字）、琶音线、幽灵音的括号、滚奏、简谱 / 字母谱的气声「×」。 */
const WIDE = new Set(["breath", "arpeggio", "ghost", "roll", "whisper"]);
const mapNotes = (s: Song, f: (t: NoteTok) => NoteTok): Song => ({ ...s, papers: s.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).map(([k, ts]) => [k, ts.map((t) => (t.kind === "note" ? f(t) : t))])) })) });
const zeroWidthOnly = (s: Song): Song => mapNotes(s, (t) => { const n = { ...t }; if (n.art) { n.art = n.art.filter((a) => !WIDE.has(a)); if (!n.art.length) delete n.art; } delete n.inhale; return n; });
/** 这些记号画出来用的样式类（三种谱合起来；显示时用全的测试歌里都碰得到——见下面「比较器不是空的」）。 */
const EXPR_CLASSES = ["art", "breath", "breath-label", "slur", "roll", "arpeggio", "note-paren", "dyn", "hairpin", "dyn-word", "dyn-dash", "dyn-implied", "ramp",
  "jp-stacc", "staccato", "jp-ten", "tenuto", "art-ghost", "whisper", "jp-slur", "jp-arp", "jp-roll", "jp-chev", "accent", "jp-dyn", "stress"];
const classesOf = (L: Layout): Set<string> => new Set(L.prims.flatMap((p) => (p.cls ?? "").split(/\s+/).filter(Boolean)));
/** 一个排版里每个音（按 token id）在哪一行、横坐标多少。 */
function notePos(L: Layout, s: Song): Map<number, string> {
  const m = new Map<number, string>();
  for (const n of L.notes) {
    const r = L.systems[n.system]!, part = (n as { part?: string }).part ?? r.part, toks = L.virtual[`${r.paper}:${part}`] ?? s.papers.find((p) => p.id === r.paper)!.tracks[part]!;
    m.set(toks[n.index]!.id, `${n.system}:${n.x.toFixed(4)}`);
  }
  return m;
}

describe("演奏法和表情不显示（7-G）· 名单", () => {
  it("键盘「演奏法」「力度」两页上的每个键都落在拿掉的那几类里（名单不另抄：键盘加了键、这里没跟上 = 红）", () => {
    const covered = (id: string): boolean => {
      if (id.startsWith("art:") || id.startsWith("dyn:")) return (id === "dyn:ramp" ? "ramp" : id) in SIGNS;   // 演奏法 / 力度 / 渐到 = 记号表里有的
      if (id === "swell:<" || id === "swell:>" || id === "swell:<>") return true;   // 音内起伏 = 演奏法 swellUp / swellDown / swellBoth（下面那条核它们在记号表里）
      if (id === "wedge:cresc" || id === "wedge:dim") return FOLDED_TOKEN_KINDS.has("hairpin");
      if (id === "slur" || id === "inhale:soft" || id === "inhale:big") return true;   // 音上的 slur / inhale：下面那条核真去掉了
      return false;
    };
    const ids = [...SYM_PAGES.art, ...SYM_PAGES.dyn];
    eq(ids.filter((id) => !covered(id)).join(" "), "", "落不进名单的键");
    for (const a of ["swellUp", "swellDown", "swellBoth"]) assert(`art:${a}` in SIGNS, a);
    assert(FOLDED_TOKEN_KINDS.has("dyn") && FOLDED_TOKEN_KINDS.has("hairpin"), "力度 / 渐强渐弱整个 token 不交给排版");
    eq(ARTS.filter((a) => !((`art:${a}` as SignId) in SIGNS)).join(","), "", "全部演奏法都在记号表里（= 都拿掉）");
  });
  it("预处理：token 个数、先后、id 都不变，只去掉音身上的演奏法 / 圆滑线 / 出声的换气；没动的轨 / 整首没东西可去 = 原对象", () => {
    const s = fullSong(), f = foldExpressions(s);
    for (const p of s.papers) for (const [k, ts] of Object.entries(p.tracks)) {
      const ft = f.papers.find((x) => x.id === p.id)!.tracks[k]!;
      eq(ft.map((t) => `${t.kind}#${t.id}`).join(" "), ts.map((t) => `${t.kind}#${t.id}`).join(" "), `${p.id}/${k} 下标不变`);
      for (const t of ft) if (t.kind === "note") assert(!t.art?.length && !t.slur && !t.inhale, `${p.id}/${k} #${t.id} 拿干净`);
      if (!ts.some((t) => t.kind === "note" && (t.art?.length || t.slur || t.inhale))) assert(ft === ts, `${p.id}/${k} 没东西可去 = 原样共享`);
    }
    eq(foldExpressions(f), f, "已经干净的歌 = 原对象");
    const note: NoteTok = { kind: "note", id: 1, pitch: { step: "C", alter: 0, octave: 4 }, dur: 1680, lyric: null, art: [...ARTS], slur: true, inhale: "big" };
    const one = foldExpressions({ ...s, papers: [{ ...s.papers[0]!, tracks: { X: [note] } }] }).papers[0]!.tracks.X![0] as NoteTok;
    assert(!("art" in one) && !("slur" in one) && !("inhale" in one) && one.pitch === note.pitch && one.dur === note.dur, "全部演奏法 + 圆滑线 + 换气一起去掉，音本身不动");
  });
  it("数「折叠几处」：力度字 / 渐强渐弱 / 每个演奏法各一处，圆滑线一串一处，出声的换气跟着呼吸不另算", () => {
    const n = (id: number, o: Partial<NoteTok> = {}): Token => ({ kind: "note", id, pitch: { step: "C", alter: 0, octave: 4 }, dur: 840, lyric: null, ...o });
    const toks: Token[] = [{ kind: "dyn", id: 9, value: "p" }, n(1, { slur: true }), n(2, { slur: true }), n(3, { art: ["staccato", "accent"] }), { kind: "hairpin", id: 8, dir: "cresc" }, n(4, { art: ["breath"], inhale: "soft" }), n(5, { slur: true }), n(6)];
    eq(foldedMarks(toks).map((m) => `${m.tok}:${m.what}`).join(" "), "9:dyn 1:slur 3:art:staccato 3:art:accent 8:hairpin 4:art:breath 5:slur");
    eq(foldedCount([toks, undefined, [n(7)]]), 7);
  });
});

describe("演奏法和表情不显示（7-G）· 淡提示什么时候有", () => {
  it("不显示、但整首没有一个能收起来的记号 = 不出提示（没收起来什么，就不打扰）", () => {
    const s = mapNotes(fullSong(), (t) => { const n = { ...t }; delete n.art; delete n.slur; delete n.inhale; return n; });
    const bare = { ...s, papers: s.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).map(([k, ts]) => [k, ts.filter((t) => t.kind !== "dyn" && t.kind !== "hairpin")])) })) };
    eq(lay(hide(bare)).statusHints.some((ln) => ln.items.some((it) => it.kind === "expr")), false);
  });
});

describe("演奏法和表情不显示（7-G）· 排版", () => {
  for (const nota of NOTATIONS) {
    it(`${nota}：一个这些记号的图元、点击框都没有（显示时都有 = 比较器不是空的）；「折叠 N」= 这一段看得见的声部折叠了几处，显示时没有`, () => {
      const s = withNotation(fullSong(), nota), A = lay(s), B = lay(hide(s));
      const ca = classesOf(A), cb = classesOf(B);
      const present = EXPR_CLASSES.filter((c) => ca.has(c));
      assert(present.length >= 10, `显示时这些类画得出来：${present.join(" ")}`);
      eq(EXPR_CLASSES.filter((c) => cb.has(c)).join(" "), "", "不显示时还画着的");
      eq(B.dyns.filter((d) => d.kind === "dyn" || d.kind === "hairpin").length, 0, "没有力度 / 渐强渐弱的点击框");
      assert(A.dyns.some((d) => d.kind === "dyn") && A.dyns.some((d) => d.kind === "hairpin"), "显示时有");
      for (const p of B.papers) {
        if (p.hidden) continue;
        const paper = s.papers.find((x) => x.id === p.id)!, vis = Object.keys(paper.tracks).filter((id) => !p.hiddenParts.includes(id) && (view.opts(s).parts ?? []).some((v) => v.id === id));
        eq(p.folded ?? 0, foldedCount(vis.map((id) => paper.tracks[id])), `${p.id} 的「折叠 N」`);
      }
      assert(B.papers.some((p) => (p.folded ?? 0) > 0), "测试歌里有折叠的");
      assert(A.papers.every((p) => p.folded === undefined), "显示时没有「折叠 N」");
      const ex = (L: typeof A) => L.statusHints.filter((ln) => ln.items.some((it) => it.kind === "expr"));
      assert(ex(B).length === 1 && ex(A).length === 0, "「演奏法和表情：不显示」的淡提示：不显示时有一个、显示时没有（7-G 重做；2026-11-12 起是状态提示里的一条）");
      eq(ex(B)[0]!.system, B.systems.findIndex((r) => r.paper === B.papers.find((p) => !p.hidden)!.id), "在第一张画出来的纸的第一行");
    });
    it(`${nota}：只含零宽记号的歌——行一一对应、每行不高于显示时、墨的上沿不更高，力度撑高了的行变矮；音的横坐标、在哪一行都不变`, () => {
      const s = zeroWidthOnly(withNotation(fullSong(), nota)), A = lay(s), B = lay(hide(s));
      eq(B.systems.length, A.systems.length, "行数");
      const dynRows = new Set(A.dyns.filter((d) => d.kind === "dyn" || d.kind === "hairpin").map((d) => d.system));
      assert(dynRows.size > 0, "有带力度的行（比较器不是空的）");
      const h = (L: Layout, i: number) => L.systems[i]!.bottom - L.systems[i]!.top;
      const taller = A.systems.map((_, i) => i).filter((i) => h(B, i) > h(A, i) + 1e-6), shorter = [...dynRows].filter((i) => h(B, i) < h(A, i) - 1e-6);
      eq(taller.join(","), "", "不显示时反而变高的行");
      const inkUp = A.systems.map((_, i) => i).filter((i) => (B.systems[i]!.inkTop ?? 0) - B.systems[i]!.staffTop < (A.systems[i]!.inkTop ?? 0) - A.systems[i]!.staffTop - 1e-6);
      eq(inkUp.join(","), "", "墨的上沿反而更高的行");
      // 「有力度的行严格变矮」只在力度超出这一行的最小留白时成立（力度在留白里面 / 同一行有更高的反复、风格记号 = 行高不变）：至少有这种行、而且真变矮了
      assert(shorter.length > 0, `力度撑高了的行变矮了（${shorter.length} / ${dynRows.size} 行）`);
      const pa = notePos(A, s), pb = notePos(B, s), moved = [...pa].filter(([id, v]) => pb.get(id) !== v);
      eq(moved.length, 0, `挪了的音：${moved.slice(0, 4).map(([id, v]) => `#${id} ${v}→${pb.get(id)}`).join(" ")}`);
    });
    it(`${nota}：用全的测试歌（含占横向的呼吸 / 琶音 / 幽灵音 / 滚奏 / 气声）：这几样也不交给量（统筹裁定），整首不变高、行不变多`, () => {
      const s = withNotation(fullSong(), nota), A = lay(s), B = lay(hide(s));
      assert(B.systems.length <= A.systems.length, `行数 ${A.systems.length} → ${B.systems.length}`);
      assert(B.height <= A.height + 1e-6, `总高 ${A.height} → ${B.height}`);
    });
  }
});
