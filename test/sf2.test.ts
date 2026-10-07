// SoundFont：TinySoundFont WASM（vendor/tsf/）+ 子集化（src/gm/sf2-subset.ts）。created 2026-10-07 by Claude Fable 5.1
// hermetic 部分用 test/fixtures/sf2/ 的 24 KB 样本；检疫桶里有 GeneralUser GS 整包时再跑「子集 ≡ 整包」（没有 = 记一条 todo，不红）。
import { describe, it, eq, assert, todo } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL | string): Uint8Array; existsSync(p: string): boolean };
const os = (await import("node:os" as string)) as { homedir(): string };
import { subsetSf2, listSf2Presets } from "../src/gm/sf2-subset.ts";
import { wrapTsf, type SfBank } from "../src/gm/soundfont.ts";
import createTsf from "../vendor/tsf/tsf.mjs";

const T = wrapTsf(await createTsf({ wasmBinary: fs.readFileSync(new URL("../vendor/tsf/tsf.wasm", import.meta.url)) }));
const FIX = new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url);
const fixture = fs.readFileSync(FIX);
const SR = 22050;
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
const same = (actual: unknown, expected: unknown) => eq(JSON.stringify(actual), JSON.stringify(expected));   // runner 的 eq 是 ===
const maxDiff = (a: Float32Array, b: Float32Array) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };

describe("SoundFont 样本", () => {
  it("列预设", () => {
    same(listSf2Presets(fixture), [{ name: "Square Lead", program: 80, bank: 0 }, { name: "Castanets", program: 115, bank: 8 }]);
  });
  it("TinySoundFont 载得进、预设对得上", () => {
    const b = T.load(fixture, SR);
    same(b.presets.map((p) => `${p.bank}:${p.program} ${p.name}`), ["0:80 Square Lead", "8:115 Castanets"]);
    eq(b.presetIndex(0, 80), 0); eq(b.presetIndex(8, 115), 1); eq(b.presetIndex(0, 0), -1);
    b.close();
  });
  it("渲染 = 纯函数：同样的事件两次逐样本相同、有声、松键后收尾", () => {
    const b = T.load(fixture, SR);
    const notes = [{ preset: 0, key: 60, vel: 0.8, t0: 0, t1: 0.3 }, { preset: 1, key: 60, vel: 1, t0: 0.1, t1: 0.15 }];
    const a = b.render(notes, 0.5), c = b.render(notes, 0.5);
    eq(a.length, Math.ceil(0.8 * SR));
    assert(sameBytes(new Uint8Array(a.buffer), new Uint8Array(c.buffer)), "两次渲染不同");
    let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v));
    assert(peak > 0.1, `太小 ${peak}`);
    const tail = a.subarray(a.length - 100); assert(tail.every((v) => Math.abs(v) < 1e-3), "0.5 s 后还没收尾");
    b.close();
  });
  it("子集化幂等 + 确定性：subset(样本, 同样两个预设) 字节相同；输入不被改动", () => {
    const before = Uint8Array.from(fixture);
    assert(sameBytes(subsetSf2(fixture, [{ bank: 0, program: 80 }, { bank: 8, program: 115 }]), fixture), "字节变了");
    assert(sameBytes(subsetSf2(fixture, [{ bank: 8, program: 115 }, { bank: 0, program: 80 }]), fixture), "预设顺序影响了输出");
    assert(sameBytes(fixture, before), "输入被改了（Buffer.slice 是视图）");
  });
  it("只留一个预设：另一个不在了、还能载能响", () => {
    const one = subsetSf2(fixture, [{ bank: 8, program: 115 }]);
    assert(one.length < fixture.length, "没变小");
    same(listSf2Presets(one), [{ name: "Castanets", program: 115, bank: 8 }]);
    const b = T.load(one, SR), y = b.render([{ preset: 0, key: 60, vel: 1, t0: 0, t1: 0.1 }], 0.3);
    let peak = 0; for (const v of y) peak = Math.max(peak, Math.abs(v)); assert(peak > 0.05, `太小 ${peak}`);
    b.close();
  });
  it("要的预设不在 = 抛错、报出来", () => {
    let msg = ""; try { subsetSf2(fixture, [{ bank: 0, program: 0 }]); } catch (e) { msg = (e as Error).message; }
    assert(msg.includes("0:0"), `错误没报缺的预设：${msg}`);
  });
  it("不是 sf2 = 抛错", () => {
    let msg = ""; try { subsetSf2(new Uint8Array(64), []); } catch (e) { msg = (e as Error).message; }
    assert(msg.includes("SoundFont"), msg);
  });

  // 整包比对（只在这台机子的检疫桶有整包时跑）
  const FULL = `${os.homedir()}/jupyter/third-party/GeneralUser-GS/GeneralUser-GS.sf2`;
  if (!fs.existsSync(FULL)) todo("子集 ≡ 整包（检疫桶里没有 GeneralUser GS 整包，跳过）");
  else {
    const full = fs.readFileSync(FULL);
    it("整包 → 样本：重生成字节和仓里的一样", () => {
      assert(sameBytes(subsetSf2(full, [{ bank: 0, program: 80 }, { bank: 8, program: 115 }]), fixture), "子集化的输出变了：要么改坏了，要么该重生成样本（看 test/fixtures/sf2/README.md）");
    });
    it("子集 ≡ 整包：钢琴 + 鼓同样的事件，差 ≤ 1e-5（只剩采样位置的浮点舍入）", () => {
      const bank = T.load(full, SR), small = T.load(subsetSf2(full, [{ bank: 0, program: 0 }, { bank: 128, program: 0 }]), SR);
      const notes = (b: SfBank) => [{ preset: b.presetIndex(0, 0), key: 60, vel: 0.8, t0: 0, t1: 0.5 }, { preset: b.presetIndex(0, 0), key: 67, vel: 0.6, t0: 0.25, t1: 1 }, { preset: b.presetIndex(128, 0), key: 36, vel: 1, t0: 0, t1: 0.1 }, { preset: b.presetIndex(128, 0), key: 38, vel: 0.9, t0: 0.5, t1: 0.6 }];
      const d = maxDiff(bank.render(notes(bank), 1), small.render(notes(small), 1));
      assert(d <= 1e-5, `差 ${d}`);
      bank.close(); small.close();
    });
  }
});
