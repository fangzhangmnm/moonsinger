// scripts/gen-grooves.mjs —— 把音乐仓鼠出的「拍子轻重」预设（grooves-vN.json）拷进 vendor/grooves/，并把算轻重要用的那部分内嵌进 src/score/grooves.gen.ts。
// created 2026-10-08 by Claude Opus 5.5。源 = ../../20260813 MyLlamaReborn/20261007 音乐史/export/moonsinger/（同 gen-instruments.mjs）。
// user：「预设可以，你给音乐仓鼠发一个工单，做成数据驱动的」。仓鼠 d960331 交 grooves-v1.json（sha256 d199499b…）。
// 用法：node scripts/gen-grooves.mjs = 取货（源仓出了新版本改 VERSION 再跑）。vendor 是拷来的快照（引文 / 依据 / 许可证都在里面），gen 只内嵌：
//   每个风格的 id / 名字 / 别名 / 拍号 → {grid, weights} / 没列的拍号怎么办 / 各类乐器跟多少 / 摇摆。test/groove.test.ts 守 gen = vendor 现在的字节。生成物勿手改。
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SRC = process.env.INSTRUMENTS_SRC ?? join(ROOT, "..", "..", "20260813 MyLlamaReborn", "20261007 音乐史", "export", "moonsinger");
export const DST = join(ROOT, "vendor", "grooves");
export const OUT = join(ROOT, "src", "score", "grooves.gen.ts");
export const VERSION = 1;   // v1 = 2026-10-08（仓鼠 d960331：7 个风格，强弱先后引维基原文、数值 AI 按层级取）
export const FILE = `grooves-v${VERSION}.json`;
const sha = (b) => createHash("sha256").update(b).digest("hex");

/** 从 vendor/ 里现在的字节算 gen 文件内容（测试用同一个函数核）。 */
export function render() {
  const p = join(DST, FILE); if (!existsSync(p)) return null;
  const b = readFileSync(p), d = JSON.parse(b.toString("utf8"));
  const styles = d.styles.map((s) => ({
    id: s.id, name: s.name, aliases: s.aliases ?? [],
    meters: Object.fromEntries(Object.entries(s.meters).map(([m, v]) => [m, { grid: v.grid, weights: v.weights }])),
    fallback: s.meterFallback?.rule === "classical" ? "classical" : "none",
    follow: s.follow, swing: s.swing ? { unit: s.swing.unit, ratio: s.swing.ratio, range: s.swing.range } : null,
  }));
  return `// 生成物：node scripts/gen-grooves.mjs（源 = ../20260813 MyLlamaReborn/20261007 音乐史/export/moonsinger/${FILE}，拷在 vendor/grooves/）。勿手改。
// 拍子轻重的预设（音乐仓鼠出；强弱先后引维基原文、具体数值 AI 按层级取；引文 / 依据 / 许可证见 vendor/grooves/${FILE}）。
export const GROOVES_VERSION = ${VERSION};
export const GROOVES_FILE = ${JSON.stringify({ file: `vendor/grooves/${FILE}`, bytes: b.length, sha256: sha(b) })} as const;
export interface GrooveStyle {
  id: string; name: { zh: string; en: string; ja: string }; aliases: string[];
  /** 拍号（"4/4"）→ 一小节几个十六分格子 + 每格上开始的音的相对轻重（−1…1）。 */
  meters: Record<string, { grid: number; weights: number[] }>;
  /** 没列的拍号：classical = 按古典层级推；none = 不加。 */
  fallback: "classical" | "none";
  /** 各类乐器跟多少（0–1）：键 = GM 家族（gm-map defs.families）+ voice（人声类，优先）。 */
  follow: Record<string, number>;
  /** 摇摆（时值，不是轻重）：一对音里前一个占的比例。 */
  swing: { unit: string; ratio: number; range: [number, number] } | null;
}
export const GROOVE_STYLES: GrooveStyle[] = ${JSON.stringify(styles, null, 1)};
`;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(SRC)) { console.error(`找不到源 ${SRC}`); process.exit(1); }
  mkdirSync(DST, { recursive: true });
  copyFileSync(join(SRC, FILE), join(DST, FILE));
  writeFileSync(OUT, render());
  console.log(`[gen-grooves] v${VERSION} → vendor/grooves/ + ${OUT}`);
}
