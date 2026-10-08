// scripts/gen-sounds.mjs —— 把家族音源库（../20261007 PWA Sounds，GitHub fangzhangmnm/pwa-sounds）的目录条目内嵌进 app：src/gm/sounds.gen.ts。
// created 2026-10-07 by Claude Fable 5.1。音源不是 AI 模型（user 2026-10-07「音源不是ai」）：不走模型包；app 钉的是目录条目里每个文件的 sha256，字节从哪来都先验再用。
// 用法：node scripts/gen-sounds.mjs（库里加了东西要重跑；test/sounds.test.ts 守着不漂移）。生成物勿手改。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SOUNDS_ROOT = join(ROOT, "..", "20261007 PWA Sounds");
export const OUT = join(ROOT, "src", "gm", "sounds.gen.ts");
/** MoonSinger 现在用到的条目（货架上摆哪些）。 */
export const WANTED = ["generaluser-gs-2.0.3"];

export function render() {
  const p = join(SOUNDS_ROOT, "index.json");
  if (!existsSync(p)) return null;
  const idx = JSON.parse(readFileSync(p, "utf8"));
  const entries = {};
  for (const id of WANTED) {
    const e = idx.sounds.find((x) => x.id === id);
    if (!e) throw new Error(`sound ${id} is not in the sounds library index`);
    entries[id] = e;
  }
  return `// 生成物：node scripts/gen-sounds.mjs（源 = ../20261007 PWA Sounds 的 index.json）。勿手改。
// 音源库（pwa-sounds）= 跟人走的声音素材，不是 AI 模型；app 只当货架，选中的那一件子集化嵌进歌（契约 §10.2）。文件到手先对这里钉的 sha256。
export interface SoundEntry { id: string; kind: string; name: string; description?: string; file: string; format: string; bytes: number; sha256: string;
  license: { name: string; summary?: string; file?: string; bytes?: number; sha256?: string }; attribution: string; homepage?: string; source?: string; date?: string; notes?: string }
/** 出厂预填的音源库地址（设置里能改；先找同源 pwa-sounds/）。 */
export const SOUNDS_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-sounds";
export const SOUNDS: Record<string, SoundEntry> = ${JSON.stringify(entries, null, 1)};
`;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = render();
  if (out === null) { console.error("找不到音源库 ../20261007 PWA Sounds"); process.exit(1); }
  writeFileSync(OUT, out);
  console.log(`[gen-sounds] ${OUT}（${(out.length / 1024).toFixed(0)} KB）`);
}
