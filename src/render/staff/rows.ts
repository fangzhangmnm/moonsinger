// rows.ts —— 五线谱这一种的「谱种的表」：这张纸排哪几行、每行吃哪几条轨（设计稿第 3.3 节第 2 步；施工单 1b-5）。
//   created 2026-11-11 by Claude Opus 5.5（代码原样从 engrave.ts 搬出）。
//   框架给：这张纸上看得见的声部、哪几家合租可以叠（这张纸上两位以上、没人在写 / 听模式）。
//   五线谱定：叠成一行（并成虚拟的多声部轨，merge.ts）、分左右手 / 分声部、挑谱号、一家全是鼓 = 并成一套鼓；声部 2 / 双手谱下面那张各是一条假的轨。
//   简谱合租各占一行（UX 稿），那是简谱自己的表。
import type { Song, PaperSeg, Token, NoteTok, ClefName, Focus, Staff } from "../../score/song.ts";
import { allPitches, staffOfTokens } from "../../score/song.ts";
import { type Pitch, midiOf, spellMidi } from "../../score/pitch.ts";
import { percOf } from "../../gm/percussion.ts";
import { displayStates, autoOttava, isFClef, startClef, wantsGrand, type ResolvedLook } from "../../score/clef.ts";
import { mergeTracks, planHands, type MergeOpts } from "../../score/merge.ts";
import type { TextMeasure } from "../text/index.ts";
import type { SongView } from "../../score/song-view.ts";
import type { PartView } from "../engrave.ts";
import { unitsOf } from "../frame/units.ts";
import { STAFF_WIDTHS } from "./units.ts";
import type { StaffTrack } from "./measure.ts";

/** 框架交来的一家：这张纸上看得见的两位以上（按歌里的顺序，主人在前）、这次可以叠。host = 这一家的主人 id（不一定在这张纸上）。 */
export interface FoldFamily { host: string; members: PartView[] }
type LookAt = (paperId: string, partId: string) => ResolvedLook | undefined;

export interface StaffRows {
  /** 要排的声部（叠起来的一家 = 一位虚拟的、声部 2 / 双手谱下面那张 = 假的一位）。 */
  parts: PartView[];
  /** 主人 id → 叠进来的房客 / 并好的虚拟 track / 双手谱下面那张的假 id / 一张谱表 → 它的声部 2 / 声部 2 → 画在哪一位那行 / 虚拟那几条的谱号。 */
  absorbed: Map<string, PartView[]>; virt: Map<string, Token[]>; lowOf: Map<string, string>;
  voice2Of: Map<string, string>; shareWith: Map<string, string>; startFor: Map<string, ClefName>;
  /** 一家全是鼓：谱前名字的顺序 = 各位的音在鼓谱上的高低（v0.16.4，user 11-07「鼓合租的时候应该是按照代理音符的高低排序前面的名字」）。 */
  drumNames: Map<string, PartView[]>;
  loIds: Set<string>;
  /** 叠起来的那几条虚拟 track（键 = "纸 id:id"；Layout.virtual）。 */
  virtualOut: Record<string, Token[]>;
}

/** 合租（v0.10.28 改；设计账 ai-docs/20261010-shared-staff-percussion-design.md §1）：一家（主人 + 这张纸上看得见的房客）叠起来 = 一条虚拟的多声部 track
 *  （src/score/merge.ts：各人的音按时间并成和弦），当成主人那一位交给普通的排谱流程——自己挑谱号、太宽 = 双手谱、自动八度线、全是鼓 = 五线鼓谱；房客不再自己画。
 *  user「i think it is wiser to just 聚合 all the notes and render them as they are a single polyphonic track」「…use the already-have rendering procedure for that virtual track」
 *  「for shared clef i dont know why there is data contract. it is just the proper way of showing multi teanants」（不存东西）。以前（v0.10.24–27）各画各的 = 符干打架（「蝌蚪的尾巴在打架」）。 */
export function staffRows(paper: PaperSeg, visible: readonly PartView[], fold: readonly FoldFamily[], lookAt: LookAt): StaffRows {
  const absorbed = new Map<string, PartView[]>(), virt = new Map<string, Token[]>(), lowOf = new Map<string, string>();
  const voice2Of = new Map<string, string>(), shareWith = new Map<string, string>(), startFor = new Map<string, ClefName>();
  const drumNames = new Map<string, PartView[]>(), virtualOut: Record<string, Token[]> = {};
  for (const { host: fid, members: ms } of fold) {
    const hp = ms[0]!, ten = ms.slice(1), drums = ms.every((m) => !!m.perc);
    // 一家全是鼓：固定敲一件的换成那一件的鼓键（五线鼓谱上它那一线）；音效（不是鼓键）= 一个表里没有的键（画在中间那条线）
    //   单件乐器（木鱼 / 太鼓…）= 它在一套鼓里的那个键（概念的 mainKey → kitKey）；鼓件 = 它自己的键；都没有（音效）= 一个表里没有的键（画在中间那条线）
    const kitKeyOf = (m: number): number | null => { const pk = ms[m]!.perc!; return pk.kind === "one" ? pk.info.kitKey ?? (pk.info.staff === 5 && !pk.info.from ? pk.key : 0) : null; };
    const keyOf = drums ? (m: number, p: Pitch): Pitch => { const k = kitKeyOf(m); return k !== null ? spellMidi(k, 0) : p; } : undefined;
    const tracksM = ms.map((m) => paper.tracks[m.id]!);
    if (drums) {   // 每位的「代表线」：固定敲一件 = 那一键在五线鼓谱上的线；整套鼓 = 这张纸上它的音的中位线；表里没有 = 中间那条线（4）。线小 = 画得高 = 名字在上；一样高按歌里的顺序
      const lineOfKey = (key: number) => percOf(128, 0, key)?.line ?? 4;
      const rep = ms.map((_, m) => {
        const k = kitKeyOf(m); if (k !== null) return lineOfKey(k);
        const ls = (tracksM[m] ?? []).flatMap((t) => (t.kind === "note" ? allPitches(t as NoteTok) : [])).map((p) => lineOfKey(midiOf(p))).sort((a, b) => a - b);
        return ls.length ? ls[ls.length >> 1]! : 4;
      });
      drumNames.set(hp.id, ms.map((_, m) => m).sort((a, b) => rep[a]! - rep[b]! || a - b).map((m) => ms[m]!));
    }
    absorbed.set(hp.id, ten);
    // 一张谱表的一条：谱号按这张谱上所有的音挑；声部 1 = 这一位（符干朝上）、声部 2 = 假的一位 `…~v2`，画在声部 1 那一行上（符干朝下、不画休止 / 小节线 / 名字）
    const staffOf = (sid: string, mo: (v: 1 | 2) => MergeOpts, all: MergeOpts) => {
      startFor.set(sid, startClef(mergeTracks(tracksM, all), undefined, null, true));
      const v1 = mergeTracks(tracksM, mo(1)), v2 = mergeTracks(tracksM, mo(2));
      virt.set(sid, v1); virtualOut[`${paper.id}:${sid}`] = v1;
      if (v2.some((t) => t.kind === "note")) { const vid = `${sid}~v2`; virt.set(vid, v2); virtualOut[`${paper.id}:${vid}`] = v2; voice2Of.set(sid, vid); shareWith.set(vid, sid); startFor.set(vid, startFor.get(sid)!); }
    };
    if (drums) {   // 一家全是鼓 = 并成一套鼓（五线鼓谱、每件在自己那一线；不分声部，符干按鼓谱表）
      const whole = mergeTracks(tracksM, { keyOf, hits: true }); virt.set(hp.id, whole); virtualOut[`${paper.id}:${hp.id}`] = whole; startFor.set(hp.id, "G");
    } else {
      // 分手 / 分声部按人（merge.ts planHands；user「我现在觉得合租的时候还是智能分左右手和声部的对应关系比较好」「以及你也可以选择合租的时候不用双手谱」）：
      //   每位一张家谱、按小节换、几个出格的音不乱认领；一张谱读得下 = 不用双手谱；同一张谱上两组人 = 两个声部（上面朝上、下面朝下）
      // 各位的家谱 = 它拆开来时的谱号（低音谱号 = 下谱；自己是大谱表 = 按音高）
      // 主人（fid，不管在不在这张纸上）设成大谱表 = 这一行一定双手谱（v0.10.42；user「就是我希望让合租是grand staff调piano1没用需要调2，很奇怪」）
      const homes = ms.map((m): 0 | 1 | null => { const l = lookAt(paper.id, m.id); if (!l || l.staves === 2) return null; return isFClef(l.first) ? 1 : 0; });   // 这一段它自己的谱号（纸头手选的算上，v0.16.88）
      const plan = planHands(tracksM, wantsGrand, homes, lookAt(paper.id, fid)?.grand === "explicit"), staffOpts = (S: 0 | 1, top: boolean) => (v: 1 | 2): MergeOpts => ({ pick: plan.pick(S, v), marks: top && v === 1 ? "all" : "bars" });
      const both = (S: 0 | 1): MergeOpts => ({ pick: (m, t) => plan.pick(S, 1)(m, t) || plan.pick(S, 2)(m, t), marks: "bars" });
      staffOf(hp.id, staffOpts(0, true), both(0));
      if (plan.grand) { const lid = `${hp.id}~lo`; lowOf.set(hp.id, lid); staffOf(lid, staffOpts(1, false), both(1)); }   // 下面那张 + 左边一个花括号
    }
  }
  const gone = new Set([...absorbed.values()].flat().map((p) => p.id));   // 叠进别人那一行的
  const parts: PartView[] = visible.filter((p) => !gone.has(p.id)).flatMap((p): PartView[] => {
    if (!virt.has(p.id)) return [p];
    const drums = [p, ...absorbed.get(p.id)!].every((m) => !!m.perc), lid = lowOf.get(p.id);   // 虚拟的那一位：谱号自动、不灰任何东西（叠着只是看）
    const v: PartView = { ...p, staves: undefined, perc: drums ? { kind: "kit" } : undefined, mono: false, xHead: false, ignores: [], lyricMute: undefined };
    const fake = (id: string): PartView => ({ id, name: "", empty: false, first: false, hidden: false, badges: [] }), v2 = (sid: string) => (voice2Of.has(sid) ? [fake(voice2Of.get(sid)!)] : []);
    return [v, ...v2(p.id), ...(lid ? [fake(lid), ...v2(lid)] : [])];
  });
  return { parts, absorbed, virt, lowOf, voice2Of, shareWith, startFor, drumNames, loIds: new Set(lowOf.values()), virtualOut };
}

export interface StaffTracksCtx {
  song: Song; look: SongView; paper: PaperSeg; lookAt: LookAt; at: Focus; tailOpen: boolean; autoBars: boolean; measure: TextMeasure; sp: number; ts: number;
  /** 框架算的：每条要排的轨的真长度、这张纸最长那条（后面补齐的空小节）。 */
  lens: number[]; paperLen: number;
  /** 复合拍子里的休止按拍切（简谱建轨时开，五线谱不开）。 */
  restBeats?: boolean;
}
/** 每条要排的轨 → 排版单元 + 谱号 + 八度线（设计稿第 3.3 节第 1 步的五线谱那一半）。rowHost = 声部 2 画在哪一位那行（下标；-1 = 自己一行）。 */
export function staffTracks(rows: StaffRows, c: StaffTracksCtx): { per: StaffTrack[]; rowHost: number[]; shortBars: number } {
  const { paper, lookAt } = c;
  const trackOf = (id: string): Token[] => rows.virt.get(id) ?? paper.tracks[id]!;
  const clefStart = (partId: string) => { const l = lookAt(paper.id, partId); return l && l.staves === 1 ? l.clef : undefined; };
  let shortBars = 0;
  // 补齐（v0.10.6；user「点小节写这里好」「这样的话要不要做新轨在显示的时候自动补齐小节号。然后自动补的休止也是自动的淡色」「小节号（用小字体）也做一下」）：这张纸上短的声部，后面空着的时值画成淡色休止（按小节切，小节线 / 折行 / 每行开头的小节号都跟着），只画不存；
  //   点那几个小节 = 光标在尾巴 + lead（写的那一刻才落成休止，song.ts materializeLead）。
  const per: StaffTrack[] = rows.parts.map((p, pi): StaffTrack => {
    const real = trackOf(p.id), vrt = rows.virt.has(p.id), focused = !vrt && c.at.paper === paper.id && c.at.part === p.id, staves: 1 | 2 = p.staves === 2 || (!vrt && lookAt(paper.id, p.id)?.staves === 2) ? 2 : 1;
    const gap = c.paperLen - c.lens[pi]!;
    const padT = (dur: number, id: number): Token => ({ kind: "rest", id, dur }) as Token;
    const tokens = gap > 1e-6 ? [...real, padT(gap, -2)] : real;   // 补齐的一段 = 一个长休止（按小节切开画；光标在里面的位置 = 落点 Slot.lead，不进排版）
    const u = unitsOf(tokens, { tail: focused && c.tailOpen, autoBars: c.autoBars, measure: c.measure, sp: c.sp, ts: c.ts, rhythm: c.look.lyricFit === "rhythm", padFrom: real.length, widths: STAFF_WIDTHS, ...(c.restBeats ? { restBeats: true } : {}) });
    shortBars += u.shortBars;
    if (staves === 2) {   // 大谱表：每个音在上还是下（按音高自动 / 手动指定）；光标跟着前一个音
      const stf = staffOfTokens(tokens, 2); let last: Staff = 1;
      for (const x of u.units) { if (x.kind === "chunk") { x.staff = stf[x.index]!; last = x.staff; } else if (x.kind === "head") x.staff = last; }
    }
    // 谱号（v0.9.28）：这张纸开头的（声部写了 = 它，没写 = 自动）+ 每个下标处生效的谱号 / 八度线；大谱表照旧上高音下低音
    const start: ClefName = staves === 2 ? "G" : vrt ? rows.startFor.get(p.id) ?? startClef(tokens, undefined, null, true) : clefStart(p.id) ?? "G";
    // 自动八度线（v0.9.37；user「自动加」）：在挑好的谱号下，一串很高 / 很低的音画 8va / 15ma / 8vb；手写的说了算；这位关了 / 大谱表 = 不自动。只管画，不存进谱
    const ds0 = displayStates(tokens, start), ao = staves === 2 || p.perc || rows.shareWith.has(p.id) || (!vrt && lookAt(paper.id, p.id)?.autoOtt === false) ? null : autoOttava(tokens, ds0);   // 声部 2 不另画八度线（和声部 1 同一张谱）
    const ds = ao ? { clef: ds0.clef, ott: ao.ott, auto: ao.auto as boolean[] | null, runs: ao.runs } : { ...ds0, auto: null as boolean[] | null, runs: [] as { from: number; to: number; shift: 1 | 2 | -1 }[] };
    const fFam = staves === 2 || isFClef(start) || tokens.some((t) => t.kind === "clef" && isFClef(t.clef));
    return { p, tokens, realLen: real.length, realTicks: c.lens[pi]!, focused, staves, start, ds, fFam, vrt, ...u, pmode: !p.perc ? null : p.perc.kind === "kit" ? "five" : "one", v2: false, hasV2: rows.voice2Of.has(p.id) };
  });
  /** 声部 2 画在哪一位那行（per 里的下标）；-1 = 自己一行。 */
  const rowHost = per.map((q) => { const h = rows.shareWith.get(q.p.id); return h ? per.findIndex((x) => x.p.id === h) : -1; });
  per.forEach((q, pi) => { q.v2 = rowHost[pi]! >= 0; });
  return { per, rowHost, shortBars };
}
