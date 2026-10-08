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
export const VERSION = 7;   // v7 = 2026-10-08（仓鼠：user「我觉得应该按照gs的作者可能拆样的那台电话来推理」→ 北美老式话机 20 Hz：电话 naturalKey 100 → 96、GS 推荐键 86 → 79）。v6 = 2026-10-08（仓鼠：user 澄清电话铃 = 老式机械铃 → 电话 naturalKey 102 → 100、GS 推荐键 90 → 86；GM 行 sampleKey 加 recommendedBasis）。v5 = 概念 range / naturalKey、GM 行 sampleKey。v4 = 161 个概念、--tile 派生图标、AI 估算年份
export const FILES = {
  concepts: `instruments-v${VERSION}.json`,
  gmMap: `gm-map-v${VERSION}.json`,
  icons: `instrument-icons-20261008-v${VERSION}.svg`,   // sprite 文件名里的日期 = 那一版出图的日子（v2 / v3 = 20261007）
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

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(SRC)) { console.error(`找不到源 ${SRC}`); process.exit(1); }
  mkdirSync(DST, { recursive: true });
  for (const name of Object.values(FILES)) copyFileSync(join(SRC, name), join(DST, name));
  copyFileSync(join(SRC, "README.md"), join(DST, "SOURCE.md"));
  writeFileSync(OUT, render());
  console.log(`[gen-instruments] v${VERSION} → vendor/instruments/ + ${OUT}`);
}
