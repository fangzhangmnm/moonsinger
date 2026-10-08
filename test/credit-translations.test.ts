// 月读条款译文没过期：译文钉的原文哈希 = 现在出货的原文。created 2026-10-08 by Claude Opus 5.5
// 红了 = 模型仓的音色清单改了署名 / 条款原文 → 重译 src/singer/credit-translations.ts（中 / 英两份），再把 of 里的哈希换成新的。
import { describe, it, eq } from "./runner.mjs";
const { createHash } = (await import("node:crypto" as string)) as { createHash(a: string): { update(s: string): { digest(e: string): string } } };
import { CREDIT } from "../src/singer/packs.gen.ts";
import { CREDIT_TRANSLATIONS as T } from "../src/singer/credit-translations.ts";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
describe("月读条款译文（credit-translations.ts）", () => {
  it("署名块的译文对着现在的原文", () => { eq(sha(CREDIT.credit), T.of.credit, "署名原文变了：重译中 / 英"); });
  it("使用条款的译文对着现在的原文", () => { eq(sha(CREDIT.terms), T.of.terms, "条款原文变了：重译中 / 英"); });
  it("禁止事项条数一致（原文几条 ■，中 / 英就几条）", () => {
    const n = CREDIT.terms.split("■").length;
    eq(T.zh.terms.split("■").length, n, "中文"); eq(T.en.terms.split("■").length, n, "英文");
  });
});
