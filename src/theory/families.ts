// families.ts —— 一张纸上「哪几个音底下标什么和弦」：合租的一家合起来认、不在一家的各认各的。认和弦是预处理里的事，和谱种无关：五线谱和简谱读同一份结果。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家第五刀 5-4；施工单第五节「小弟问（5-4 一家合起来认和弦）」下面统筹的裁定）。
//   user 11-11（纪要 ai-docs/talks/20261111-two-display-modes-meta.md 第 70 节）：「我非常想合起来认，因为合租的语义就是，比如说你什么女高声、男低声还有中声，
//   他们一起唱，他们本来就是一个和弦，但他们确实是得写成三个轨」。和 11-09「每个声部单独做」不矛盾：合租是人亲手放在一起的，一家算一个单位（乐理模块文件头）。
//   裁定（统筹，2026-11-11）：
//   · 一家合起来认出来的和弦只标一次，标在这一家最下面那一位的那一行（at）；这一家里各位自己的不再标。
//   · 人挑的读法不加新字段，还是音上的 harm：读的先后 = 这一家从下往上，第一位在那一刻起音的那个音；挑法只在「它是眼前这个和弦的候选之一」时才算数，不在候选里 = 当没挑（不删）。
//     写回去（点开候选挑一个）= 写在 index 指的那个音上（owner：这一家从下往上第一位在那一刻起音的）。
//   · 「认不认拆开弹的」按打头那位（主人在这张纸上 = 主人，不在 = 在场的第一位）。
//   · 合起来 = 同五线谱叠成一行那一套（score/merge.ts mergeTracks），只拿来认、不画。
import { harmonyTags, type HarmonyRead, type HarmonyTheory } from "./index.ts";
import { mergeTracks } from "../score/merge.ts";
import { headLen, isTimed, DEFAULT_KEY, type Token, type NoteTok } from "../score/song.ts";

/** 一处标签：index = owner 那条 track 里那个音的下标（人挑的读法写在它身上）；at = 画在哪一位的那一行（一家 = 最下面那一位；不在一家 = 自己）。 */
export interface PlacedTag { index: number; read: HarmonyRead; at: string }
/** 一张纸上要认的：parts = 声部（按歌里的先后 = 排版上从上到下）：id + 这张纸上的 track（要显示的那一份，按 C 调看时已经换过）+ 认不认拆开弹的；
 *  families = 合租的一家（按歌里的先后，打头的在前），只列这张纸上在场、要认的；两位以上才算一家。 */
export interface PaperHarmonyInput {
  parts: readonly { id: string; tokens: readonly Token[]; broken: boolean }[];
  families: readonly (readonly string[])[];
}

/** 每个音起音的那一刻（tick，从这条 track 的谱头之后数）；连着前一个音的（tie）不算起音。 */
function onsets(tokens: readonly Token[]): Map<number, number> {
  const out = new Map<number, number>(); let t = 0;
  for (let i = headLen(tokens as Token[]); i < tokens.length; i++) {
    const k = tokens[i]!;
    if (!isTimed(k)) continue;
    if (k.kind === "note" && k.pitch && !k.tie && !out.has(t)) out.set(t, i);
    t += k.dur;
  }
  return out;
}

/** 一张纸：每一位（owner）→ 它身上要标的那几处。 */
export function paperHarmony(theory: HarmonyTheory, input: PaperHarmonyInput): Map<string, PlacedTag[]> {
  const out = new Map<string, PlacedTag[]>(), byId = new Map(input.parts.map((p) => [p.id, p] as const));
  const fams = input.families.map((f) => f.filter((id) => byId.has(id))).filter((f) => f.length >= 2), inFam = new Set(fams.flat());
  const push = (owner: string, tag: PlacedTag) => { const l = out.get(owner); if (l) l.push(tag); else out.set(owner, [tag]); };
  // 不在一家的：各认各的（和以前一样，人挑的读法照 harmonyTags 的规矩：对不上的画灰带「?」）
  for (const p of input.parts) if (!inFam.has(p.id)) for (const t of harmonyTags(theory, { tokens: p.tokens, broken: p.broken })) push(p.id, { ...t, at: p.id });
  // 一家：合起来认
  for (const fam of fams) {
    const members = fam.map((id) => byId.get(id)!), bottom = fam[fam.length - 1]!;
    const merged = mergeTracks(members.map((m) => [...m.tokens]));
    const tags = harmonyTags(theory, { tokens: merged, broken: members[0]!.broken });
    // 合起来那条 track 上每个记号的那一刻 + 那里的调（人挑的读法按这里的调现算）
    const tickAt: number[] = [], keyAt: { fifths: number; minor: boolean }[] = [];
    { let t = 0, key = { fifths: DEFAULT_KEY, minor: false };
      merged.forEach((k, i) => { if (k.kind === "key") key = { fifths: k.fifths, minor: k.mode === "minor" }; tickAt[i] = t; keyAt[i] = key; if (isTimed(k)) t += k.dur; }); }
    const starts = members.map((m) => onsets(m.tokens));
    for (const tag of tags) {
      const t = tickAt[tag.index]!;
      let owner = -1; for (let m = members.length - 1; m >= 0; m--) if (starts[m]!.has(t)) { owner = m; break; }   // 从下往上第一位在这一刻起音的
      if (owner < 0) continue;   // 这一刻没人起音（只是连着的）：标不到谁身上，不标
      let read = tag.read;
      for (let m = members.length - 1; m >= 0; m--) {   // 人挑的读法：从下往上，第一个「是这个和弦的候选」的算数；不是候选的当没挑（不删）
        const i = starts[m]!.get(t); if (i === undefined) continue;
        const pin = (members[m]!.tokens[i] as NoteTok).harm; if (!pin) continue;
        const rd = theory.pinRead(pin, keyAt[tag.index]!, tag.read);
        if (rd && tag.read.all.some((g) => g.name === rd.best.name)) { read = rd; break; }
      }
      push(members[owner]!.id, { index: starts[owner]!.get(t)!, read, at: bottom });
    }
  }
  for (const l of out.values()) l.sort((a, b) => a.index - b.index);
  return out;
}
