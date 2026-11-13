// 新文件的模板只住在门口（16-4 A，统筹 2026-11-12 夜「v0.17.13 收」第 3 条）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
//   守：出声的代码（src/score、src/engine、src/core）不 import 模板——它们拿到的永远是读文件的门口补全过的（或新建时按值抄的）；
//   模板里每一位出厂乐手的数都过出声那一层的缺数检查（模板自己不缺数）。
import { describe, it, eq, assert } from "./runner.mjs";
import { templateCandidate, TEMPLATE } from "../src/format/template.ts";
import { perfSpecProblems } from "../src/format/project.ts";
import { FX_KINDS } from "../src/engine/fx.ts";
import { HOST_PARAMS } from "../src/engine/chain.ts";
import { NEW_SONG_LOOK } from "../src/score/song.ts";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[]; readFileSync(u: URL, e: "utf8"): string };
const ROOT = new URL("../", import.meta.url);
const walk = (dir: string): string[] => fs.readdirSync(new URL(dir, ROOT), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : /\.(ts|mjs|js)$/.test(e.name) ? [`${dir}${e.name}`] : []));

describe("模板只在门口", () => {
  it("src/score、src/engine、src/core 里没有一处 import 模板（format/template）", () => {
    const bad = ["src/score/", "src/engine/", "src/core/"].flatMap(walk).filter((f) => /from\s+["'][^"']*format\/template(\.ts)?["']|import\(\s*["'][^"']*format\/template/.test(fs.readFileSync(new URL(f, ROOT), "utf8")));
    eq(bad.join("、"), "", "出声那一层不许问模板要数");
  });
  it("三种出厂乐手的数写全了：按力度路拼成出声规格，一个都不缺", () => {
    for (const e of ["tsukuyomi", "vowel-sampler", "soundfont"] as const) {
      const c = templateCandidate(e) as Record<string, any>, vel = e === "soundfont";
      const spec = vel ? { path: "velocity", ...c.articulation, dynamicsVel: c.dynamicsVel, sing: {} } : { path: "gain", ...c.articulation, dynamicsDb: c.dynamicsDb, sing: c.sing ?? {} };
      const bad = perfSpecProblems(spec as never, vel ? c.defaults.velocity : 1);
      eq(bad.join(","), "", e);
    }
    assert(TEMPLATE.lounge.rollHz.drum > 0 && TEMPLATE.lounge.rollHz.pitched > 0);
  });
});
describe("模板的录音房那一块（16-4 A2 / C）", () => {
  it("每种效果的模板写全参数表里的每一个参数（先后同参数表）；混音轨上那一份只有混响 / 延迟 / 合唱、键一样", () => {
    for (const k of Object.keys(FX_KINDS)) eq(JSON.stringify(Object.keys(TEMPLATE.studio.fx[k] ?? {})), JSON.stringify([...(HOST_PARAMS[k] ?? []), ...FX_KINDS[k]!.params].map((d) => d.id)), k);
    eq(Object.keys(TEMPLATE.studio.fxOnBus).sort().join(), "chorus,delay,reverb");
    for (const [k, p] of Object.entries(TEMPLATE.studio.fxOnBus)) { eq(JSON.stringify(Object.keys(p)), JSON.stringify(Object.keys(TEMPLATE.studio.fx[k]!)), `混音轨 ${k}`); eq(`${p.mix},${p.dry}`, "1,0", `混音轨 ${k} 全湿`); }
    eq(JSON.stringify(TEMPLATE.studio.master.limiterParams), JSON.stringify({ ceiling: 0.98, attackMs: 3, releaseMs: 150, lookaheadMs: 9 }));
  });
  it("结构：效果参数表里没有默认值；录音房里没有限幅器的常数（天花板 / 起 / 放 / 前瞻都从总轨设置来）", () => {
    const code = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert(!/\bdefault\s*:/.test(code("src/engine/fx.ts")) && !/\bdefault\s*:/.test(code("src/engine/chain.ts")), "fx.ts / chain.ts 的参数表不带 default");
    assert(!/\b(CEILING|LIM_ATTACK|LIM_RELEASE|LIM_LOOK_TAUS)\b/.test(code("src/engine/studio.ts")), "studio.ts 没有限幅常数");
  });
});
describe("谱的扩展那一块（16-4 A3 / G）", () => {
  const code = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  it("模板第三块就是 song.ts NEW_SONG_LOOK 这一个对象（不另抄）；原来那张「没写 = 什么」的表（UNWRITTEN）哪儿都没有了", () => {
    assert(TEMPLATE.score === NEW_SONG_LOOK, "同一个引用");
    const bad = ["src/"].flatMap(walk).filter((f) => /\bUNWRITTEN\b/.test(code(f)));
    eq(bad.join("、"), "");
  });
  it("NEW_SONG_LOOK 在 src/score 里只出现在声明和新建歌的两个函数（emptySong / songOf）里；排版、出声、核心不碰它", () => {
    const where: string[] = [];
    for (const f of ["src/score/", "src/render/", "src/engine/", "src/core/"].flatMap(walk)) {
      const c = code(f); if (!/\bNEW_SONG_LOOK\b/.test(c)) continue;
      if (f !== "src/score/song.ts") { where.push(f); continue; }
      const fns = [...c.matchAll(/export (?:function (\w+)|const (\w+))[^\n]*\n?(?:(?!\nexport )[\s\S])*?\bNEW_SONG_LOOK\b/g)].map((m) => m[1] ?? m[2]);
      for (const n of fns) if (!["NEW_SONG_LOOK", "emptySong", "songOf"].includes(n!)) where.push(`song.ts ${n}`);
    }
    eq(where.join("、"), "");
  });
  it("G：总目录里「哪一版程序存的」（app / saved / core）是给人看的——src 里没有一处读它们", () => {
    const bad = ["src/"].flatMap(walk).filter((f) => /manifest\??\.(app|saved|core)\b|manifest\??\[["'](app|saved|core)["']\]/.test(code(f)));
    eq(bad.join("、"), "");
  });
});

