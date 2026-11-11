// full.ts —— 排版分家（施工单 1b）的守卫 3：分家前后版面逐个相同。created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟）。
//   比刀 1 的 N1（cases.ts snapshot：只比会印的图元 + 一串点击表）严：所有图元（带 ann 的注解、带 tok）、Layout 的全部平字段、
//   三个闭包（yOf / dOf / lyricY）每一行按几个点采样。盖住：三首真歌 × cases.ts 的七种视图 + 用全的测试歌（full-song.ts）× 下面十种视图
//   （声部旗：鼓 / 一线谱 / × 符头 / 单声 / 不认 / 简写 / 唱不出 / 不唱字；选项：按 C 调看 + 和弦级数、横卷、写字头在尾巴 + 拼音让位 + 按歌词排、隐藏 + 不自动小节线、紧凑档）。
//   1b 收尾（同日）：脚手架收成长期的几条（surfaceCases：用全的测试歌 × 十种视图、真实密度的大歌 × 三种、边界情形），底本 = 分家之后的代码存的（scripts/freeze-layout-surface.mjs）；test/score-surface.test.ts 比。
import { SONGS, VIEWS, caseLayout, views, editorBase, measureFor, r3, SP } from "./cases.ts";
import { fullSong, fullFlags, edgeSongs } from "./full-song.ts";
import { engrave, type EngraveOpts, type Layout, type PartView } from "../../../src/render/engrave.ts";
import { printOpts } from "../../../src/export/score-pdf.ts";
import { createTextMeasure } from "../../../src/render/text/index.ts";
import { pageGeoOf, paperOf, DEFAULT_PAPER } from "../../../src/score/paper.ts";
import type { Song } from "../../../src/score/song.ts";

const ROOT = new URL("../../../", import.meta.url);
/** 全量快照：除了三个闭包，Layout 原样；闭包按行采样（第几级 → y、y 附近 → 第几级、歌词基线）。 */
export function fullSnapshot(L: Layout): unknown { return r3(fullSnapshotRaw(L)); }
/** 同上、数字不取整（比较用：tolDiffs 拿没取整的新值和冻的值按容差比）。 */
export function fullSnapshotRaw(L: Layout): unknown {
  const { lyricY, yOf, dOf, ...flat } = L;
  const DS = [26, 30, 34, 38, 42];
  const geo = L.systems.map((_, r) => ({ ly: lyricY(r), y: DS.map((d) => yOf(r, d)), d: DS.map((d) => dOf(r, yOf(r, d) + L.sp * 0.2)) }));
  return { ...flat, geo };
}

const LABELS = ["Vocal", "Piano", "Bass", "Glockenspiel", "Pf 1", "Pf 2", "Drums", "Woodblock", "Cowbell", "Mono X"];
const flagged = (song: Song, editor: boolean, hide?: ReadonlySet<string>): PartView[] => { const f = fullFlags(song); return views(song, LABELS, editor, hide).map((v) => ({ ...v, ...f[v.id] })); };
const ed = (s: Song, hide?: ReadonlySet<string>) => ({ ...editorBase(s, LABELS, hide), parts: flagged(s, true, hide) }) as EngraveOpts;
type FView = { name: string; song?: (s: Song) => Song; opts: (s: Song) => EngraveOpts };
export const FULL_VIEWS: FView[] = [
  { name: "print", opts: (s) => printOpts(s, SP, flagged(s, false), createTextMeasure(measureFor(s)), true, 0) },
  { name: "edit-all", opts: (s) => ed(s) },
  { name: "edit-seg", opts: (s) => ({ ...ed(s), onlyPaper: "pb" }) },
  { name: "edit-pages", opts: (s) => { const { margins: _m, ...rest } = ed(s); return { ...rest, chrome: { tail: 2.6, famGap: 0.8, navRoom: 16 }, page: pageGeoOf(s.paper ?? paperOf(DEFAULT_PAPER)) } as EngraveOpts; } },
  { name: "listen-all", opts: (s) => ({ ...ed(s), chrome: { famGap: 0.8, navRoom: 16 }, foldAll: true }) },
  { name: "inC-chords", opts: (s) => ({ ...ed(s), inC: true, chordTags: true }) },
  { name: "scroll", opts: (s) => ({ ...ed(s), scroll: true }) },
  { name: "tail-raise-lyrics", song: (s) => ({ ...s, lyricFit: "lyrics" }), opts: (s) => ({ ...ed(s), at: { paper: "pa", part: "Y" }, tailOpen: true, lyricRaise: 0.62 }) },
  { name: "hidden-nobars", opts: (s) => ({ ...ed(s, new Set(["V"])), autoBars: false }) },
  { name: "compact", song: (s) => ({ ...s, paper: { ...(s.paper ?? paperOf(DEFAULT_PAPER)), density: "compact" as const } }), opts: (s) => ed(s) },
];

// ── 长期留的那一套（1b 收尾：脚手架收成几条综合的对抗性测试；底本 = 分家之后的代码存的，scripts/freeze-layout-surface.mjs）──
/** 一组 = 一条综合测试：full = 用全的测试歌 × 十种视图；dense = 真实密度的大歌 × 三种视图；edge = 边界情形。 */
export type SurfaceGroup = "full" | "dense" | "edge";
export function* surfaceCases(): Generator<{ group: SurfaceGroup; song: string; view: string; layout: () => Layout }> {
  for (const v of FULL_VIEWS) yield { group: "full", song: "full", view: v.name, layout: () => { const s0 = fullSong(), s = v.song ? v.song(s0) : s0; return engrave(s, v.opts(s)); } };
  for (const v of VIEWS.filter((x) => ["print", "edit-all", "listen-all"].includes(x.name))) yield { group: "dense", song: "once", view: v.name, layout: () => caseLayout("once", v) };
  for (const e of edgeSongs()) {
    const labels = e.song.parts.map((x) => x.id), hide = new Set(e.hide ?? []);
    const ed = () => { const o = { ...editorBase(e.song, labels, hide), ...(e.width ? { width: e.width } : {}) } as EngraveOpts; return o; };
    yield { group: "edge", song: e.name, view: "edit-all", layout: () => engrave(e.song, ed()) };
    yield { group: "edge", song: e.name, view: "print", layout: () => engrave(e.song, { ...printOpts(e.song, SP, views(e.song, labels, false, hide), createTextMeasure(measureFor(e.song)), true, 0), ...(e.width ? { width: e.width } : {}) }) };
  }
}
export const surfacePath = (song: string, view: string) => new URL(`test/fixtures/layout/surface/${song}.${view}.json.gz`, ROOT);

/** 冻的（取整过）和现在的（没取整）按容差比（1b-6c 统筹裁定，施工单第五节「小弟问（1b-6c 守卫 3 的取整）」下面）：
 *  路径（图元的 d）里的数字 = 冻的时候没取整 → 差 ≤ 1e-6 px 算相同；别的数字 = 冻的时候取整到 0.001 → 差 ≤ 0.0005 + 1e-6 算相同（取整后一样，或本来就压在取整边界上）；
 *  别的（个数、种类、class、先后、字形、字、tok、注解）逐个相同。报两类数字各自的最大差：路径那一类超过 1e-8 = 不是浮点尾数，停下来查、不调容差。 */
export const PATH_TOL = 1e-6, NUM_TOL = 0.0005 + 1e-6, PATH_NOISE_MAX = 1e-8;
export function tolDiffs(want: unknown, got: unknown, n = 6): { out: string[]; maxNum: number; maxPath: number } {
  const out: string[] = []; let maxNum = 0, maxPath = 0;
  const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi, skel = (s: string) => s.replace(NUM, "#"), nums = (s: string) => [...s.matchAll(NUM)].map((m) => Number(m[0]));
  const say = (path: string, a: unknown, b: unknown) => { if (out.length < n) out.push(`${path || "(根)"}: 冻结 ${JSON.stringify(a)?.slice(0, 140)} ≠ 现在 ${JSON.stringify(b)?.slice(0, 140)}`); };
  const walk = (a: unknown, b: unknown, path: string, key: string) => {
    if (typeof a === "number" && typeof b === "number") { const d = Math.abs(a - b); maxNum = Math.max(maxNum, d); if (!(d <= NUM_TOL)) say(path, a, b); return; }
    if (key === "d" && typeof a === "string" && typeof b === "string") {
      if (a === b) return;
      const na = nums(a), nb = nums(b);
      if (skel(a) !== skel(b) || na.length !== nb.length) { say(path, a, b); return; }
      let m = 0; na.forEach((x, i) => { m = Math.max(m, Math.abs(x - nb[i]!)); }); maxPath = Math.max(maxPath, m);
      if (!(m <= PATH_TOL)) say(path, a, b);
      return;
    }
    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || a === null || b === null || typeof a !== "object") { if (JSON.stringify(a) !== JSON.stringify(b)) say(path, a, b); return; }
    if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) say(path, `${a.length} 个`, `${b.length} 个`);
    for (const k of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, k);
  };
  walk(want, got, "", "");
  return { out, maxNum, maxPath };
}
