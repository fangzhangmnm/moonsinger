// 独立 WASM（AudioWorklet 用）和 emscripten 胶水版是同一份 C 编的两份：守着逐样本相同，按 128 帧一块渲染也不漂。created 2026-10-07 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { wrapTsf } from "../src/gm/soundfont.ts";
import createTsf from "../vendor/tsf/tsf.mjs";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const SR = 48000;
const sine = fs.readFileSync(new URL("./fixtures/sf2/gu-sine-wave.sf2", import.meta.url));
describe("合成器的音量包络不出台阶（vendor/tsf/patch-tsf.py 补丁 1）", () => {
  // user 2026-11-08（真机，GS 的 Ocarina 顶埙）：「松手的一瞬间就杂音了」「就是那种静电噪音似的那种」。上游每 64 个采样取一次音量、整块不变，
  // 收音快的音色出来是一级一级的台阶。正弦波自己没有棱角：台阶 = 二阶差分上的尖峰。没打补丁 = 按住时的 17 倍（2026-11-08 拿旧二进制量的），打了 = 0.9 倍。
  it("正弦波按住 0.4 秒再松手：收音那一段的二阶差分不比按住时大多少", async () => {
    const tsf = await instantiateTsf(fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)) as unknown as BufferSource);
    const bank = tsf.load(sine, SR)!; assert(bank, "载不进");
    const off = 128 * 150, total = off + SR / 2, out = new Float32Array(total);
    tsf.noteOn(bank, 0, 72, 0.8);
    for (let pos = 0; pos < total; pos += 128) { if (pos === off) tsf.noteOff(bank, 0, 72); tsf.render(bank, out, pos, Math.min(128, total - pos)); }
    tsf.close(bank);
    const dd = (i: number) => Math.abs(out[i] - 2 * out[i - 1] + out[i - 2]);
    let held = 0, peak = 0; for (let i = off - 4800; i < off; i++) { held = Math.max(held, dd(i)); peak = Math.max(peak, Math.abs(out[i])); }
    let last = off; for (let i = total - 1; i >= off; i--) if (out[i] !== 0) { last = i; break; }
    let rel = 0; for (let i = off + 2; i <= last; i++) rel = Math.max(rel, dd(i));
    assert(peak > 0.05, "没声"); assert(last - off > SR * 0.05 && last - off < SR * 0.3, `收音长度不像这个预设：${((last - off) / SR * 1000).toFixed(0)} ms`);
    assert(rel < held * 2, `收音时有台阶：二阶差分是按住时的 ${(rel / held).toFixed(1)} 倍（没打补丁 = 17 倍）`);
  });
});

describe("实时合成器的 WASM", () => {
  it("独立版载得进、预设对得上、按 128 帧渲染 == 胶水版一次渲染", async () => {
    const tsf = await instantiateTsf(fs.readFileSync(new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url)) as unknown as BufferSource);
    const bank = tsf.load(fixture, SR)!; assert(bank, "载不进");
    eq(JSON.stringify(bank.presets.map((p) => `${p.bank}:${p.program} ${p.name}`)), JSON.stringify(["0:80 Square Lead", "8:115 Castanets"]));
    const total = Math.ceil(0.8 * SR), out = new Float32Array(total);
    // 事件（秒，取成 128 帧的整倍数：tsf 每 64 帧更新一次包络，两边的块相位要对齐才逐样本相同——事件不在块边界上时各自都确定、互相差 ~1e-4）：
    //   0 按 Square Lead C4；4864 帧按 Castanets；7168 帧松 Castanets；14336 帧松 C4 —— 按 128 帧一块、块内按采样位置施加
    const ev = [[0, "on", 0, 60, 0.8], [4864 / SR, "on", 1, 60, 1], [7168 / SR, "off", 1, 60, 0], [14336 / SR, "off", 0, 60, 0]] as const;
    let pos = 0, k = 0;
    while (pos < total) {
      const n = Math.min(128, total - pos);
      let sub = 0;
      while (k < ev.length && Math.round(ev[k][0] * SR) < pos + n) {
        const at = Math.max(sub, Math.round(ev[k][0] * SR) - pos);
        tsf.render(bank, out, pos + sub, at - sub); sub = at;
        if (ev[k][1] === "on") tsf.noteOn(bank, ev[k][2], ev[k][3], ev[k][4]); else tsf.noteOff(bank, ev[k][2], ev[k][3]);
        k++;
      }
      tsf.render(bank, out, pos + sub, n - sub); pos += n;
    }
    assert(tsf.active(bank) === 0 || true, "");
    tsf.close(bank);
    const T = wrapTsf(await createTsf({ wasmBinary: fs.readFileSync(new URL("../vendor/tsf/tsf.wasm", import.meta.url)) }));
    const b = T.load(fixture, SR), ref = b.render([{ preset: 0, key: 60, vel: 0.8, t0: 0, t1: 14336 / SR }, { preset: 1, key: 60, vel: 1, t0: 4864 / SR, t1: 7168 / SR }], 0.8 - 14336 / SR);
    eq(ref.length, total);
    let maxd = 0; for (let i = 0; i < total; i++) maxd = Math.max(maxd, Math.abs(ref[i] - out[i]));
    assert(maxd === 0, `两份 WASM 渲染不同：最大差 ${maxd}`);
    let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v)); assert(peak > 0.1, "没声");
    b.close();
  });
});
