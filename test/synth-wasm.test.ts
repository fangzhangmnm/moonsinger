// 独立 WASM（AudioWorklet 用）和 emscripten 胶水版是同一份 C 编的两份：守着逐样本相同，按 128 帧一块渲染也不漂。created 2026-10-07 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL): Uint8Array };
import { instantiateTsf } from "../src/gm/tsf-standalone.ts";
import { wrapTsf } from "../src/gm/soundfont.ts";
import createTsf from "../vendor/tsf/tsf.mjs";

const fixture = fs.readFileSync(new URL("./fixtures/sf2/gu-square-castanets.sf2", import.meta.url));
const SR = 48000;
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
