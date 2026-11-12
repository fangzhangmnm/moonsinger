// 力度 → 响度全体演奏者只有一条（施工单第 9 节 / 9-2，2026-11-12；user「按照SoundFont对齐，然后小月相也应该对齐」「这个就是我绝对无法容忍的那个东西」）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。响度 = 40·log10(力度 ÷ 127)（score/perform.ts velocityDb）；力度记号查力度表（全体一张，没带 = 标准表）；
//   渐强渐弱 / 渐到在力度上按时间线性；按值存的 dynamicsDb / wedgeStepDb 退役（lounge 3：迁移 2→3 删掉、写时没有；统筹裁定走大版本）。
import { describe, it, eq, assert } from "./runner.mjs";
import { gainSegments, velocityDb, type PerfSpec } from "../src/score/perform.ts";
import { DYNAMICS_VEL, ARTICULATION, MARK_DEFAULTS } from "../src/format/performance.ts";
import { initState, tr, TPQ, DYNS, type Token, type Dyn } from "../src/score/song.ts";
import { openBytes, activePerfSpec } from "../src/format/project.ts";
import { FORMAT } from "../src/format/contract.ts";
import { MIGRATIONS } from "../src/format/migrate/index.ts";
const nodeMod = (m: string) => (globalThis as unknown as { process: { getBuiltinModule(m: string): any } }).process.getBuiltinModule(m);
const fs = nodeMod("node:fs");

/** 小月相 / 元音版这一路（按音量曲线）的规格：力度表 = 标准表。 */
const SING: PerfSpec = { ...MARK_DEFAULTS, dynamicsVel: { ...DYNAMICS_VEL }, staccatoGate: ARTICULATION.staccatoGate, accentDb: ARTICULATION.accentDb } as PerfSpec;
let id = 9900;
const note = (dur = TPQ): Token => ({ kind: "note", id: id++, pitch: { step: "C", alter: 0, octave: 4 }, dur, lyric: null }) as Token;
const dyn = (value: Dyn): Token => ({ kind: "dyn", id: id++, value }) as Token;
const line = (items: Token[]) => [...tr(initState()).slice(0, 3), ...items];
const map = [{ tick: 0, bpm: 60 }] as never;   // 一拍一秒

describe("力度 → 响度：全体一条（9-2）", () => {
  it("小月相 / 元音版：八档力度记号的音量曲线水平 = 40·log10(力度 ÷ 127)（和乐器同一个式子，不以 mf 为 0）", () => {
    for (const d of DYNS) {
      const g = gainSegments(line([dyn(d), note()]), map, SING)!, want = 40 * Math.log10(DYNAMICS_VEL[d] / 127);
      assert(g.every((s) => Math.abs(s.dB - want) < 0.05), `${d}：${g.map((s) => s.dB.toFixed(2)).join(" ")}，应该 ${want.toFixed(2)}`);
    }
    assert(Math.abs(velocityDb(DYNAMICS_VEL.mf) - 40 * Math.log10(80 / 127)) < 1e-12 && Math.abs(velocityDb(127)) < 1e-12, "满力度 = 0 dB");
  });
  it("p 渐强到 f：一个长音里每一小段 = 力度按时间线性、再换成 dB（不是在 dB 上线性）", () => {
    const toks = line([dyn("p"), { kind: "hairpin", id: id++, dir: "cresc" } as Token, note(4 * TPQ), dyn("f"), note()]);
    const g = gainSegments(toks, map, SING)!, inA = g.filter((s) => s.t1 <= 4 + 1e-9);
    assert(inA.length > 4, "切成了小段");
    for (const s of inA) { const fr = (s.t0 + s.t1) / 2 / 4, v = DYNAMICS_VEL.p + (DYNAMICS_VEL.f - DYNAMICS_VEL.p) * fr; assert(Math.abs(s.dB - velocityDb(v)) < 1e-6, `${s.t0.toFixed(2)} 秒：${s.dB.toFixed(3)} vs 力度线性 ${velocityDb(v).toFixed(3)}`); }
    const mid = velocityDb((DYNAMICS_VEL.p + DYNAMICS_VEL.f) / 2), dbMid = (velocityDb(DYNAMICS_VEL.p) + velocityDb(DYNAMICS_VEL.f)) / 2;
    assert(Math.abs(mid - dbMid) > 0.5, "两种走法在中点差得出来（不然这条测不出东西）");
  });
  it("结构：src 里不再有 dynamicsDb / wedgeStepDb / DYNAMICS_DB——只剩迁移（冻结的历史 + 2→3 删键那一步）和契约的历史注释", () => {
    const walk = (d: string): string[] => fs.readdirSync(new URL(`../src/${d}`, import.meta.url), { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? walk(`${d}${e.name}/`) : /\.(ts|mjs)$/.test(e.name) ? [`${d}${e.name}`] : []));
    const read = (f: string) => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8") as string;
    const bad: string[] = [];
    for (const f of walk("")) {
      if (f === "format/migrate/index.ts" || f === "i18n/strings.ts") continue;   // 迁移是冻结的纯函数（当年的表）；界面字表另有「不用的字」守卫
      const src = read(f), lines = src.split("\n");
      lines.forEach((l, k) => {
        if (!/dynamicsDb|wedgeStepDb|DYNAMICS_DB/.test(l)) return;
        const comment = /^\s*(\/\/|\*|\/\*\*)/.test(l) || /\/\/.*(dynamicsDb|wedgeStepDb|DYNAMICS_DB)/.test(l) || /\/\*[^*]*(dynamicsDb|wedgeStepDb)[^*]*\*\//.test(l);
        if (!comment) bad.push(`${f}:${k + 1}`);
      });
    }
    assert(!bad.length, `还在用：${bad.join("、")}`);
  });
  it(`迁移 2→3 只删候选的 dynamicsDb 和 articulation.wedgeStepDb，别的一个字不动；旧的四个大版本样本照样读得出来，读回来没有退役的字段；lounge ${FORMAT.lounge} 的冻结样本写出来就没有`, () => {
    const v2v3 = MIGRATIONS.lounge[1]!;
    const before = { id: "r1", name: "x", extra: [1, { y: 2 }], candidates: [{ id: "c1", z: 1, dynamicsDb: { mf: 0 }, dynamicsVel: { mf: 80 }, articulation: { accentDb: 4, wedgeStepDb: 6, wedgeStepVel: 16 } }, { id: "c2", articulation: { accentDb: 4 } }, "怪东西"] };
    const after = v2v3(JSON.parse(JSON.stringify(before)));
    eq(JSON.stringify(after), JSON.stringify({ id: "r1", name: "x", extra: [1, { y: 2 }], candidates: [{ id: "c1", z: 1, dynamicsVel: { mf: 80 }, articulation: { accentDb: 4, wedgeStepVel: 16 } }, { id: "c2", articulation: { accentDb: 4 } }, "怪东西"] }), "只删那两个键");
    eq(FORMAT.lounge, 3); eq(MIGRATIONS.lounge.length, FORMAT.lounge - 1);
    for (const dir of ["v1-1-1-1", "v1-1-2-1", "v2-2-2-1", "v2-2-2-2", "v2-2-3-2"]) {
      const o = openBytes("sample.mxl", new Uint8Array(fs.readFileSync(new URL(`fixtures/format/${dir}/sample.mxl`, import.meta.url))));
      for (const [role, r] of Object.entries(o.extras.lounge)) {
        for (const c of (r as { candidates: Record<string, unknown>[] }).candidates) {
          assert(!("dynamicsDb" in c) && !("wedgeStepDb" in ((c.articulation as object) ?? {})), `${dir} ${role}/${c.id} 读回来还带着退役的字段`);
        }
        const sp = activePerfSpec(o.extras, role);
        assert(DYNS.every((d) => sp.dynamicsVel[d] >= 1 && sp.dynamicsVel[d] <= 127), `${dir} ${role}：力度表`);
      }
    }
  });
});
