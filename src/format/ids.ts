// ids.ts —— 文件里的编号读进来先过这一关（读入边界，一处）。created 2026-11-10 by Claude Fable 5.2（总表第 5 条「读文件时的安全」的前一半；后一半 = index.html 的页面安全策略）。
//   起因（2026-11-08 审覆盖层那一刀时记下、另开一件；ai-docs/20261108-work-order-display-cut1-overlay.md §8.1）：曲段 / 声部 / 轨 / 效果格的编号从文件读进来不校验，
//   界面上十几处把它们直接拼进页面的 HTML 属性（混音台 data-c / data-p、曲段控件 data-paper…）。别人给的 .mxl 把编号写成带引号的串 = 能往页面上塞属性（含事件处理器）。
//   正解不是逐处补转义（补不完，新写的界面还会再犯），是读入时一处把关：过了这一关的编号拼到哪儿都安全。
//   规矩：编号只许字母、数字和 _ . -，第一个是字母或数字，最长 64。app 自己铸的（p1 / P1 / r1 / m1 / b1 / c1 / eq1…）都在里面，所以正常的歌一首都不受影响。
//   · 自家的文件（带 .moonsinger/）里有不合规矩的 = 这份文件被别的工具改过 / 坏了 → 拒开、明说（不猜、不修——修了再存 = 替人改了文件）。
//   · 别的软件存的 MusicXML：声部编号不合规矩 = 换成 P<n>（那只是谱里的内部代号，没人看得见，换了不丢东西）。
//   这里只管「当编号用的字段」。歌名、歌词、角色名这些给人看的字本来就什么都能写——它们靠画的地方转义 + 页面安全策略兜底。
export const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
export const isSafeId = (x: unknown): x is string => typeof x === "string" && SAFE_ID.test(x);

type Json = Record<string, unknown>;
const list = (x: unknown): Json[] => (Array.isArray(x) ? (x.filter((e) => e && typeof e === "object") as Json[]) : []);
export type IdKind = "paper" | "part" | "role" | "track" | "candidate" | "fx" | "fxKind";

/** 自家文件的几份 JSON（已经升到这一版的形状）里所有当编号用的字段：哪一类有几个不合规矩。空 = 都好。 */
export function badIds(scoreExt: Json | null | undefined, lounge: Record<string, Json>, studio: Json | null | undefined): Partial<Record<IdKind, number>> {
  const bad: Partial<Record<IdKind, number>> = {};
  const need = (what: IdKind, v: unknown) => { if (!isSafeId(v)) bad[what] = (bad[what] ?? 0) + 1; };
  const maybe = (what: IdKind, v: unknown) => { if (v !== undefined && v !== null && v !== "") need(what, v); };   // 可以没有的字段：没有 / 空 = 不算
  const keys = (what: IdKind, o: unknown) => { if (o && typeof o === "object" && !Array.isArray(o)) for (const k of Object.keys(o)) need(what, k); };
  const fxs = (chain: unknown) => { for (const f of list(chain)) { need("fx", f.id); need("fxKind", f.kind); maybe("track", f.key); } };
  for (const p of list(scoreExt?.papers)) { need("paper", p.id); keys("part", p.manualBars); keys("part", p.swells); keys("part", p.autoOttava); }
  for (const p of list(scoreExt?.parts)) { need("part", p.id); maybe("role", p.role); maybe("track", p.mic); maybe("part", p.host); }
  for (const [id, r] of Object.entries(lounge)) {
    need("role", id); maybe("role", r.id); maybe("candidate", r.active);
    for (const c of list(r.candidates)) { need("candidate", c.id); fxs(c.chain); }
  }
  for (const t of list(studio?.tracks)) { need("track", t.id); maybe("track", t.to); for (const s of list(t.sends)) need("track", s.to); fxs(t.chain); }
  fxs((studio?.master as Json | undefined)?.chain);
  return bad;
}

/** 别的软件存的谱：声部编号不合规矩的换成没用过的 P<n>（合规矩的原样留着）。 */
export function safePartIds<T extends { info: { id: string } }>(parts: readonly T[]): T[] {
  if (parts.every((p) => isSafeId(p.info.id))) return parts.slice();
  const used = new Set(parts.map((p) => p.info.id).filter(isSafeId)); let n = 0;
  return parts.map((p) => { if (isSafeId(p.info.id)) return p; let id: string; do { id = `P${++n}`; } while (used.has(id)); used.add(id); return { ...p, info: { ...p.info, id } }; });
}

/** 视图态（score.json 的 view）里按编号挂的两样：在哪张纸、每个声部的显示 / 出声开关。不合规矩的那几条丢掉（视图态本来就是「读的一方宽容」，丢了 = 回到默认）。 */
export function safeView(view: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!view) return view;
  const out = { ...view };
  if ("paper" in out && !isSafeId(out.paper)) delete out.paper;
  if (out.parts && typeof out.parts === "object" && !Array.isArray(out.parts)) out.parts = Object.fromEntries(Object.entries(out.parts as Json).filter(([k]) => isSafeId(k)));
  return out;
}
