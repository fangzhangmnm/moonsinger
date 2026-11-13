// 拿乐手规格只有一个口（杂事版 v0.17.42，统筹「拿乐手规格的口收成一个」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
// 守：① 结构——src 里 activePerfSpec( / perfSpecProblems( 只许在 src/format/project.ts 的 perfSpecOf 里调（出声前那道查、按键试听、谱上的「不认」、乐器页都从它拿）；
//   ② 回来的要么是查过的规格、要么是问题清单：缺数的规格不交出来；没人上场 = null。
//   缺数之后出声那边（这位进「不出声」清单、原因写着键名）由 read-as-written.test.ts「更新版本的文件、乐手身上写着怪值」那条守；试听不响、乐器页标出来由 E2E issues.mjs 守。
import { describe, it, eq, assert } from "./runner.mjs";
import { openBytes, templateExtras, emptyExtras, perfSpecOf } from "../src/format/project.ts";
import { initState } from "../src/score/song.ts";
import { strToU8, strFromU8, unzipSync, zipSync } from "../vendor/fflate/fflate.esm.js";
import "../src/performers/index.ts";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc?: "utf8"): string & Uint8Array; readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };

/** src 底下每个 .ts 文件：[相对路径, 内容]。 */
function srcFiles(dir = new URL("../src/", import.meta.url), rel = "src/"): [string, string][] {
  const out: [string, string][] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...srcFiles(new URL(`${e.name}/`, dir), `${rel}${e.name}/`));
    else if (e.name.endsWith(".ts")) out.push([`${rel}${e.name}`, fs.readFileSync(new URL(e.name, dir), "utf8")]);
  }
  return out;
}

describe("拿乐手规格只有一个口（perfSpecOf）", () => {
  it("结构：src 里 activePerfSpec( / perfSpecProblems( 只在 project.ts 的 perfSpecOf 里调（定义那一行除外）", () => {
    const calls = /\b(activePerfSpec|perfSpecProblems)\(/g, bad: string[] = [];
    for (const [path, text] of srcFiles()) {
      let body = text;
      if (path === "src/format/project.ts") {
        const m = /export function perfSpecOf\([^]*?\n\}\n/.exec(text);
        assert(!!m, "project.ts 里有 perfSpecOf");
        const inEntry = m![0].match(calls) ?? [];
        eq(inEntry.sort().join(","), "activePerfSpec(,perfSpecProblems(", "入口里各调一次");
        body = text.replace(m![0], "").replace(/export function (activePerfSpec|perfSpecProblems)\(/g, "");
      }
      for (const line of body.split("\n")) if (calls.test(line) && !/^\s*(\/\/|\*|\/\*\*)/.test(line)) bad.push(`${path}: ${line.trim().slice(0, 120)}`);
      calls.lastIndex = 0;
    }
    eq(bad.join("\n"), "", "别处不许直接拿规格");
  });

  it("模板新建的乐手：查过的规格（ok）", () => {
    const song = initState().song, x = templateExtras(song), role = song.parts[0]!.role, r = perfSpecOf(x, role);
    assert(!!r && r.ok && !!r.spec, `ok：${JSON.stringify(r && !r.ok ? r.problems : null)}`);
  });

  it("没人上场：null", () => {
    eq(perfSpecOf(emptyExtras(), "r9"), null);
  });

  it("身上有怪值（更新版本写的 softVel = \"y\"）：只给问题清单，不交规格", () => {
    const src = unzipSync(new Uint8Array(fs.readFileSync(new URL("fixtures/format/minor/lounge-5/sample.mxl", import.meta.url))));
    const lounge = Object.keys(src).filter((k) => k.startsWith(".moonsinger/lounge/"));
    const sfFile = lounge.find((k) => strFromU8(src[k]!).includes('"soundfont"'))!, z = { ...src };
    for (const k of lounge) { const j = JSON.parse(strFromU8(src[k]!)); j.minor = 99; if (k === sfFile) for (const c of j.candidates) if (c.instrument.engine === "soundfont") c.articulation.softVel = "y"; z[k] = strToU8(JSON.stringify(j)); }
    const o = openBytes("newer.mxl", zipSync(z)), badRole = sfFile.split("/").pop()!.replace(/\.json$/, "");
    const r = perfSpecOf(o.extras, badRole);
    assert(!!r && !r.ok, "不是 ok");
    assert(!!r && !r.ok && r.problems.includes("softVel"), `问题清单里有 softVel：${JSON.stringify(r)}`);
    assert(!!r && !("spec" in r), "不交规格");
    for (const p of o.song.parts) if (p.role !== badRole) { const q = perfSpecOf(o.extras, p.role); assert(!q || q.ok || !q.problems.includes("softVel"), `别的乐手不报 softVel：${p.role} ${JSON.stringify(q && !q.ok ? q.problems : null)}`); }   // 别的乐手：样本是 lounge 5 写的、这里改成「更新版本」= 门口不补 lounge 6 才有的 pedal，它们会报 pedal——和这条无关
  });
});
