// layout-local-diff.mjs —— 冻结的版面快照 vs 现在，音符层的图元「按谱行归一」逐个比（每个 y 减去它那一行的第五线；x 原样比）。created 2026-11-09 by Claude Opus 5.5
// 刀 4b 的守卫（施工单 ai-docs/20261109-work-order-display-cuts-2-4.md §2.3「局部不变」）：挂件、行距可以变，符头 / 符干 / 符杠 / 符尾 / 临时记号 / 休止 / 加线 / 附点 /
//   谱号调号拍号 / 小节线 / 连音括号 / 连线 / 跳音保持 / 琶音 / 换气相对自己那条五线谱一个都不许动。重冻（scripts/freeze-layout.mjs）之前跑：
//   node scripts/layout-local-diff.mjs   → 每首样张每种视图「配对 N，不一样 0」= 可以重冻；有不一样的 = 列前三个。
//   点击区（音 / 和弦里的符头 / 休止 / 歌词位）也按行归一比。按先后一一配对（音符层的图元画的先后不变）；跨两行的竖线（几条谱左边连着的那根）不比；认行按刀前那一行，认不准（离两行一样远）的换相邻行再试。
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { SONGS, VIEWS, caseLayout } from "../test/fixtures/layout/cases.ts";
import { fullSnapshot, fullPath } from "../test/fixtures/layout/full.ts";   // 2026-11-11 起快照 = 谱面分家守卫 3 那一套（N1 并进去了）

const NOTE_CLS = /^(note|rest|ledger|staff|clef|keysig|timesig|bar(?!-no)|beam|tuplet|tuplet-bracket|repeat-bar|note-paren|arpeggio|breath|slur|art)\b/;
const STRONG = ["\u{E4A0}", "\u{E4AC}", "\u{E4B6}", "\u{E4B8}"];   // 重音一组 = 挂件（贴天际线），不比
const keep = (p, sp) => {
  const c = String(p.cls ?? "");
  if (c.includes("ann")) return false;
  if (p.t === "glyph" && /^art\b/.test(c) && STRONG.includes(p.ch)) return false;
  if (p.t === "line" && /^bar\b/.test(c) && Math.abs(p.y2 - p.y1) > 5 * sp) return false;
  return !c || c === "ghost" || c === "pad-rest" || NOTE_CLS.test(c);
};
const yRef = (p) => (p.t === "line" ? (p.y1 + p.y2) / 2 : p.t === "path" ? Number(/-?\d*\.?\d+(?:e[-+]?\d+)?,(-?\d*\.?\d+(?:e[-+]?\d+)?)/.exec(p.d)[1]) : p.y);
const nums = (p) => (p.t === "path" ? [...String(p.d).matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)].map((m) => Number(m[0])) : p.t === "line" ? [p.x1, p.y1, p.x2, p.y2] : [p.x, p.y]);
const isY = (p, i) => (p.t === "path" || p.t === "line" ? i % 2 === 1 : i === 1);
let bad = 0;
for (const key of Object.keys(SONGS)) for (const v of VIEWS) {
  const A = JSON.parse(gunzipSync(readFileSync(fullPath(key, v.name))).toString("utf8"));
  const B = JSON.parse(JSON.stringify(fullSnapshot(caseLayout(key, v))));
  const sp = A.sp, a = A.prims.filter((p) => keep(p, sp)), b = B.prims.filter((p) => keep(p, sp));
  const rowA = (y) => { let best = 0, bd = Infinity; A.systems.forEach((s, i) => { const d = y < s.staffTop ? s.staffTop - y : y > s.staffTop + 4 * sp ? y - s.staffTop - 4 * sp : 0; if (d < bd) { bd = d; best = i; } }); return best; };
  const fits = (p, q, d) => p.t === q.t && String(p.cls) === String(q.cls) && (p.ch ?? p.s) === (q.ch ?? q.s) && nums(p).length === nums(q).length && nums(p).every((x, k) => Math.abs((isY(p, k) ? x + d : x) - nums(q)[k]) < 0.02);
  const dts = A.systems.map((s, i) => (B.systems[i] ? B.systems[i].staffTop - s.staffTop : NaN));
  let diff = a.length === b.length ? 0 : Math.abs(a.length - b.length); const ex = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const p = a[i], q = b[i];
    if (fits(p, q, dts[rowA(yRef(p))]) || dts.some((d) => fits(p, q, d))) continue;
    diff++; if (ex.length < 3) ex.push(`   [${i}] 前 ${JSON.stringify(p).slice(0, 140)}\n        后 ${JSON.stringify(q).slice(0, 140)}`);
  }
  if (a.length !== b.length) ex.unshift(`   个数 ${a.length} → ${b.length}`);
  // 点击区（音 / 和弦里的符头 / 休止 / 歌词位）：都带着行号，按那一行归一比（歌词位刀 4b 漏过一次：没写歌词的声部空着的歌词位全没了）
  for (const k of ["notes", "chordHeads", "rests", "lyrics"]) {
    const norm = (L, h) => `${h.index}|${h.system}|${h.part ?? ""}|${Math.round(h.x * 50) / 50}|${Math.round((h.y - L.systems[h.system].staffTop) * 50) / 50}`;
    const ha = A[k].map((h) => norm(A, h)).sort(), hb = B[k].map((h) => norm(B, h)).sort();
    if (ha.join() !== hb.join()) { diff++; ex.push(`   点击区 ${k}：${ha.length} → ${hb.length} 个，位置不一样`); }
  }
  console.log(`${key} · ${v.name}: 配对 ${a.length}，不一样 ${diff}`); for (const e of ex) console.log(e);
  bad += diff;
}
console.log(bad ? `一共 ${bad} 处不一样：先看是不是该变的，再重冻` : "音符层相对各自的五线谱逐个相同");
process.exitCode = bad ? 1 : 0;
