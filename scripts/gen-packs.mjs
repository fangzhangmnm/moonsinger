// scripts/gen-packs.mjs —— 把月读要用的模型包清单内嵌进 app：src/singer/packs.gen.ts。created 2026-10-07 by Claude Opus 5.5
// 源 = 兄弟仓 `../20260903 PWA Models`（GitHub fangzhangmnm/pwa-models）的 packs/<slug>/manifest.json（原样）；packId = sha256(manifest.json 字节)
//   = app 钉死的信任根，分片从哪来都先对清单的 sha256 再用（@internal/model-packs）。署名 / 禁止用途原文取自 voices/tsukuyomi-chan-zhen.json（出货时界面要显示）。
// 抄 JustReadBooks tools/gen-read-aloud-packs.mjs 的形状；差别：唱歌用的权重是时长接管版（voices/*.json 还指着朗读版，等 JRB 一起切），所以包名在这里点名。
// user 2026-10-07「当然a」「然后最好jrb和moonsinger只用存一份」。
// 用法：node scripts/gen-packs.mjs（换包必须重跑；test/packs.test.ts 守着不漂移）。生成物勿手改。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MODELS_ROOT = join(ROOT, "..", "20260903 PWA Models");
export const OUT = join(ROOT, "src", "singer", "packs.gen.ts");
/** 唱歌要的包：权重（时长接管版）+ 运行时 + 每种语言一个文本前端。 */
export const SINGER = {
  voice: "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007",
  runtime: "runtime-onnxruntime-web-1.30.0-20261001",
  lang: { ja: "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", zh: "lang-zh-pinyin-20261001", en: "lang-en-cmudict-20261001" },
};

export function render() {
  if (!existsSync(MODELS_ROOT)) return null;
  const packs = {};
  for (const slug of [SINGER.voice, SINGER.runtime, ...Object.values(SINGER.lang)]) {
    const p = join(MODELS_ROOT, "packs", slug, "manifest.json");
    if (!existsSync(p)) throw new Error(`pack ${slug} is not in the models repo`);
    const bytes = readFileSync(p);
    packs[slug] = { packId: createHash("sha256").update(bytes).digest("hex"), manifest: JSON.parse(bytes.toString("utf8")) };
  }
  const v = JSON.parse(readFileSync(join(MODELS_ROOT, "voices", "tsukuyomi-chan-zhen.json"), "utf8"));
  const credit = { credit: v.credit, terms: v.terms, termsUrl: v.termsUrl, attribution: v.attribution };
  const lines = (o) => Object.entries(o).map(([k, val]) => `  ${JSON.stringify(k)}: ${JSON.stringify(val)},`).join("\n");
  return `// 生成物：node scripts/gen-packs.mjs（源 = ../20260903 PWA Models 的 packs/*/manifest.json + voices/tsukuyomi-chan-zhen.json 的署名）。勿手改。
// packId = sha256(manifest.json 原字节) = app 钉死的信任根。
import type { EmbeddedPack } from "@internal/model-packs";
export const SINGER = ${JSON.stringify(SINGER)} as const;
export const PACKS: Record<string, EmbeddedPack> = {
${lines(packs)}
};
/** 月读（つくよみちゃん）的署名块和禁止用途：出货时必须显示在界面上（包内 LICENSE.txt [1][2]）。 */
export const CREDIT = ${JSON.stringify(credit)};
`;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = render();
  if (out === null) { console.error("找不到模型仓 ../20260903 PWA Models"); process.exit(1); }
  writeFileSync(OUT, out);
  console.log(`[gen-packs] ${OUT}（${(out.length / 1024).toFixed(0)} KB）`);
}
