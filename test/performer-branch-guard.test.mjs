// 演奏者注册表的结构守卫（ADR-0004 §2.4：胶水 / 时间线 / 录音房 / 界面里不许再出现按引擎名的分支，一律问注册表）。created 2026-10-14 by Claude Fable 5.1
//   .mjs 是因为 tsconfig 没有 node 的类型（同 redline-guard.test.mjs）；行为守卫（能力字段自洽）在 performers.test.ts。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, eq } from "./runner.mjs";

describe("演奏者注册表守卫（ADR-0004 §2.4）", () => {
  it("src 里不许再按引擎名分支——`=== \"tsukuyomi\"` 这类只许出现在 src/performers/（表本身）和 src/format/（格式层的判别联合）", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src"), bad = [];
    const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|mjs)$/.test(f)) check(p); } };
    const re = /(===|!==|case)\s*"(tsukuyomi|soundfont|vowel-sampler)"|"(tsukuyomi|soundfont|vowel-sampler)"\s*(===|!==)/;
    const check = (p) => { const rel = relative(join(root, ".."), p).replaceAll("\\", "/"); if (rel.startsWith("src/performers/") || rel.startsWith("src/format/")) return;
      readFileSync(p, "utf8").split("\n").forEach((line, i) => { if (re.test(line)) bad.push(`${rel}:${i + 1}`); }); };
    walk(root);
    eq(bad.join("\n"), "", "按引擎名的分支要改成问注册表（performerOf(...) 的能力字段 / 方法）");
  });
});
