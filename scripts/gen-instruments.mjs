// scripts/gen-instruments.mjs —— 把仓鼠会话出的「挑乐器」数据拷进 vendor/instruments/，并把版本 + 每个文件的 sha256 内嵌进 src/gm/instruments.gen.ts。
// created 2026-10-07 by Claude Fable 5.1。源 = ../../20260813 MyLlamaReborn/20261007 音乐史/export/moonsinger/（表 ① 乐器史 instruments-vN.json、表 ② GM 映射 gm-map-vN.json、
//   图标 sprite、图标署名、许可证原文）。user 2026-10-07：乐器概念 = 百科全书（id = Wikidata QID 等多重编号束）；两张表（乐器史 / GM 映射）；表常改没关系——
//   它是找人视图的目录，不进歌；歌里钉的是角色的 id 束 + 名字。
// 用法：node scripts/gen-instruments.mjs = **取货**（源仓改了、这边想要时跑；源仓出了新版本改 VERSION 再跑）。vendor 是拷来的快照，不跨项目引用（user「和svg一样是拷贝snapshot过来…以后我改那边就是这边取货就行」）。
//   test/instruments.test.ts 只守 gen 文件 = vendor 现在的字节，不守 vendor = 源仓。生成物勿手改。
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// INSTRUMENTS_SRC = 源目录（在 worktree 里跑时仓的位置不同，往上数两级找不到；2026-10-08 by Claude Opus 5.5）
export const SRC = process.env.INSTRUMENTS_SRC ?? join(ROOT, "..", "..", "20260813 MyLlamaReborn", "20261007 音乐史", "export", "moonsinger");   // ~/jupyter/20260813 MyLlamaReborn（不在 PWAProjects 里）
export const DST = join(ROOT, "vendor", "instruments");
export const OUT = join(ROOT, "src", "gm", "instruments.gen.ts");
export const PERC_OUT = join(ROOT, "src", "gm", "percussion.gen.ts");
export const DEFAULT_OUT = join(ROOT, "src", "gm", "default-concept.gen.ts");   // 新歌默认那一位的概念（12-4）
export const VERSION = 15;   // v15 = 2026-11-07（仓鼠 adc0249：概念加 scoreName = 谱上名（Western concert flute → Flute、型号 → 功能名），13 个简写改正；user 11-07「为什么我从era里面选的flute在sheet上面显示western concept flute」「不只是长笛，而是系统的看一下」）
//   v14 = 2026-11-07（仓鼠 eec835f：GM 122 Breath Noise 改挂长笛、奏法 = 气声、年份 ≈前 51,000，「呼吸」不再有 GM 号；user 11-07「midi breath不是呼吸是演奏技巧」，家族周账 F-212）
//   v13 = 2026-10-10（仓鼠 7447213：不分音高的鼓谱写法 percussion / pitched:false / 着力点 hitSec / GS 扩展鼓键 extraDrumKeys；纯增量。工单 ai-docs/20261010-hamster-workorder-percussion-notation.md）
//   v12 = 2026-10-10（仓鼠 ffd9a23：概念加 abbr（出版谱简写，MuseScore instruments.xml）/ notation（记谱谱号、按实际音高的谱号、sounds / octave），gm-map 铃类加 octaveCheck；纯增量。工单 ai-docs/20261010-hamster-workorder-abbr-octave.md）
export const FILES = {
  concepts: `instruments-v${VERSION}.json`,
  gmMap: `gm-map-v${VERSION}.json`,
  icons: `instrument-icons-20261107-v${VERSION}.svg`,   // sprite 文件名里的日期 = 那一版出图的日子（v2 / v3 = 20261007，…v13 = 20261010，v14 = 20261107；图形和 v13 一样，只差头注释里的日期和版本号）
  iconCredits: `icon-credits-v${VERSION}.json`,
  licenses: `LICENSES-chosen-v${VERSION}.md`,
};
const sha = (b) => createHash("sha256").update(b).digest("hex");

/** 从 vendor/ 里现在的字节算 gen 文件内容（测试用同一个函数核）。 */
export function render() {
  const entries = {};
  for (const [k, name] of Object.entries(FILES)) {
    const p = join(DST, name); if (!existsSync(p)) return null;
    const b = readFileSync(p); entries[k] = { file: `vendor/instruments/${name}`, bytes: b.length, sha256: sha(b) };
  }
  const credits = JSON.parse(readFileSync(join(DST, FILES.iconCredits), "utf8"));
  return `// 生成物：node scripts/gen-instruments.mjs（源 = ../20260813 MyLlamaReborn/20261007 音乐史/export/moonsinger/，拷在 vendor/instruments/）。勿手改。
// 找人视图的目录：乐器概念（百科，id 束）+ GM 映射 + 图标。打开视图时才 fetch，到手先对这里钉的 sha256。
export const INSTRUMENTS_VERSION = ${VERSION};
export const INSTRUMENT_FILES = ${JSON.stringify(entries, null, 1)} as const;
/** 图标署名（第三方图标，随 app vendor；设置里显示）。modified = 派生图标（--tile）改了什么（CC-BY 要求注明改动；v4 起）。 */
export const ICON_CREDITS: { id: string; set: string; author: string; license: string; url: string; modified?: string }[] = ${JSON.stringify((credits.icons ?? credits).map((c) => ({ id: c.id, set: c.set, author: c.author, license: c.license, url: c.url, ...(c.modified ? { modified: c.modified } : {}) })))};
`;
}

/** 鼓谱表（v13 起；Claude Opus 5.5 2026-10-10）：gm-map 里有 percussion（不分音高的写法）的行 + 顶层 extraDrumKeys → 键「bank:program[:note]」→ 几线谱 / 哪一线 / 符头 / 符干 / 着力点。
 *  排谱时就要（不能等找人视图 fetch 目录），所以按值烤进源码；line 的约定 = MuseScore <Drum><line>（0 = 最上面那条线，往下 +1 走半格）。 */
export function renderPerc() {
  const p = join(DST, FILES.gmMap); if (!existsSync(p)) return null;
  const gm = JSON.parse(readFileSync(p, "utf8")), out = {};
  const conceptsById = new Map(JSON.parse(readFileSync(join(DST, FILES.concepts), "utf8")).concepts.map((c) => [c.id, c]));
  // 鼓件的名字（谱面分家 5-6，统筹裁定：简谱整套鼓的图例要印是哪件；和符头同一个出处）：中文 = 这一行本尊概念的中文名（奏法不是普通的加括号：「脚踏钹（闭镲）」），
  //   英文 = GM 的名字（Closed Hi Hat）；GS 扩展鼓键没有概念 = 两种都写它的英文名。只给带键的（鼓组里的一件）
  const nameOf = (r) => {
    const en = r.gmName ?? r.name; if (!en) return undefined;
    const c = r.concept ? conceptsById.get(r.concept) : undefined, zh0 = c?.names?.zh, tech = r.technique && r.technique.id !== "ordinario" ? r.technique.zh : undefined;
    return { zh: zh0 ? (tech ? `${zh0}（${tech}）` : zh0) : en, en };
  };
  for (const r of [...gm.rows, ...(gm.extraDrumKeys ?? [])]) {
    const pc = r.percussion; if (!pc) continue;
    const hasNote = r.note !== undefined && r.note !== null, key = `${r.bank}:${r.program}${hasNote ? `:${r.note}` : ""}`; if (out[key]) continue;   // 一个预设好几行（本尊 / 平替）：写法一样，取第一行
    const nm = hasNote ? nameOf(r) : undefined;
    out[key] = { staff: pc.staff, line: pc.line, head: pc.head, stem: pc.stem, ...(pc.smufl ? { smufl: pc.smufl } : {}), ...(typeof r.hitSec === "number" ? { hitSec: r.hitSec } : {}), ...(nm ? { name: nm } : {}) };
  }
  // 补洞（v0.10.31；user「这里没变成鼓谱…以及wood block和太鼓的分类你确定没问题？」）：仓鼠只给 GM 120–128 的行写了 percussion，GM 116 Woodblock / 117 Taiko /
  //   118 Melodic Tom / 119 Synth Drum 这几行没写，但它们的本尊概念是 pitched:false、有 MuseScore 的写法 → 这几行用本尊概念的写法；mainKey = 并成一套鼓时它在哪个鼓键那一线
  const concepts = [...conceptsById.values()];
  for (const c of concepts) {
    const pc = c.percussion; if (c.pitched !== false || !pc) continue;
    for (const g of c.ids?.gm ?? []) {
      if (g.bank === 128) continue;   // 鼓件的行本来就有
      const key = `${g.bank}:${g.program}`; if (out[key]) { if (pc.mainKey !== undefined && out[key].kitKey === undefined) out[key].kitKey = pc.mainKey; continue; }
      const row = gm.rows.find((r) => r.bank === g.bank && r.program === g.program && r.relation === "self" && r.concept === c.id);
      if (!row) continue;   // 只给本尊（平替不算）
      out[key] = { staff: pc.staff === 5 ? 5 : 1, line: pc.line ?? 0, head: pc.head ?? "normal", stem: pc.stem ?? "up", ...(pc.smufl ? { smufl: pc.smufl } : {}), ...(typeof row.hitSec === "number" ? { hitSec: row.hitSec } : {}), ...(pc.mainKey !== undefined ? { kitKey: pc.mainKey } : {}), from: c.id };
    }
  }
  const heads = (gm.defs?.heads ?? []).map((h) => h.id);
  return `// 生成物：node scripts/gen-instruments.mjs（源 = vendor/instruments/${FILES.gmMap} 的 percussion / hitSec + extraDrumKeys）。勿手改。
// 鼓谱表：键 = "bank:program[:note]"（鼓件 = 128:0:键；音效 = 0:119… 不带键）。line = MuseScore <Drum><line> 的约定（0 = 最上面那条线，往下 +1 走半格；五线谱最下面一线 = 8，一线谱那条线 = 0）。
// hitSec = 采样开头到「砸下去那一下」几秒（TinySoundFont + GeneralUser GS 实测；反向镲 = 快结尾）。
export type PercHead = ${heads.map((h) => JSON.stringify(h)).join(" | ")};
export interface PercInfo { staff: 1 | 5; line: number; head: PercHead; stem: "up" | "down"; smufl?: string; hitSec?: number; /** 并成一套鼓时画在哪个鼓键那一线（概念的 mainKey）。 */ kitKey?: number; /** 这一行的写法借的是哪个概念（gm-map 那一行没写）。 */ from?: string; /** 鼓组里的一件叫什么（简谱整套鼓的图例印；中文 = 本尊概念名 + 非普通奏法，英文 = GM 名）。 */ name?: { zh: string; en: string } }
export const PERC_VERSION = ${VERSION};
export const PERC: Record<string, PercInfo> = ${JSON.stringify(out)};
`;
}

/** 新歌默认那一位（主唱）的乐器概念 = 目录里的「人声」（Q7390），按值烤进源码（施工单 12-4，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；统筹：「新歌默认的那一位用乐器目录里『人声』那个概念（按值，
 *  生成目录快照的脚本顺手烤出来，不等目录加载），不带预设号」）。和上场时一样抄：编号束、百科名、谱上的叫法（zh = 中文名，en = scoreName）、英文简写。 */
export const DEFAULT_CONCEPT_ID = "Q7390";
export function renderDefaultConcept() {
  const p = join(DST, FILES.concepts); if (!existsSync(p)) return null;
  const c = JSON.parse(readFileSync(p, "utf8")).concepts.find((x) => x.id === DEFAULT_CONCEPT_ID);
  if (!c) throw new Error(`[gen-instruments] 目录里没有 ${DEFAULT_CONCEPT_ID}（人声）`);
  const cap = (s) => s.replace(/\s*\([^)]*\)/g, "").trim().replace(/^./, (ch) => ch.toUpperCase());
  const concept = {
    ids: { wikidata: c.ids.wikidata, local: c.ids.local, musicxml: c.ids.musicxml, gm: c.ids.gm.map((g) => ({ program: g.program, bank: g.bank })), hs: c.ids.hs },
    name: { zh: c.names.zh, en: c.names.en, ...(c.names.ja ? { ja: c.names.ja } : {}) },
    score: { zh: c.names.zh, en: c.scoreName?.en || cap(c.names.en) },
    ...(c.abbr?.en ? { abbr: { en: c.abbr.en } } : {}),
  };
  return `// 生成物：node scripts/gen-instruments.mjs（目录 v${VERSION} 的 ${DEFAULT_CONCEPT_ID}）。勿手改。
// 新歌默认那一位（主唱）的乐器概念，按值（施工单 12-4）：排谱 / 新建声部时就要，不等目录加载。
import type { LoungeRoleV2 } from "../format/contract.ts";
export const DEFAULT_CONCEPT: Readonly<NonNullable<LoungeRoleV2["concept"]>> = ${JSON.stringify(concept, null, 1)};
`;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(SRC)) { console.error(`找不到源 ${SRC}`); process.exit(1); }
  mkdirSync(DST, { recursive: true });
  for (const name of Object.values(FILES)) copyFileSync(join(SRC, name), join(DST, name));
  copyFileSync(join(SRC, "README.md"), join(DST, "SOURCE.md"));
  writeFileSync(OUT, render());
  writeFileSync(PERC_OUT, renderPerc());
  writeFileSync(DEFAULT_OUT, renderDefaultConcept());
  console.log(`[gen-instruments] v${VERSION} → vendor/instruments/ + ${OUT}`);
}
