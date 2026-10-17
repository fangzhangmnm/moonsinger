// pad-keys.test.ts —— pad 按键 id → 动作（src/app/pad-keys.ts）：键盘上每一个格子都有去处；几个代表逐个核。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq, assert } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };   // 仓里不装 @types/node（同 test/keys.test.ts）
import { padKeyAction, markOfKey } from "../src/app/pad-keys.ts";
import { PAD_KEY_IDS } from "../src/keyboard/pad-layout.ts";

const J = (x: unknown) => JSON.stringify(x);

describe("pad 按键 → 动作（翻译层）", () => {
  it("键盘上每一个按键 id 都有去处（pad.ts 加了格子、这里没接 = 红）", () => {
    assert(PAD_KEY_IDS.length > 40, `ids: ${PAD_KEY_IDS.length}`);
    for (const id of PAD_KEY_IDS) assert(padKeyAction(id) !== null, `没接：${id}`);
    assert(!PAD_KEY_IDS.includes("dyn:ramp"), "渐到是键盘自己的修饰键，不往外发");
  });
  it("写字键 / 符号格的几个代表", () => {
    eq(J(padKeyAction("caret:-1")), J({ kind: "cmd", cmd: { k: "caret", d: -1 } }));
    eq(J(padKeyAction("caret:1")), J({ kind: "cmd", cmd: { k: "caret", d: 1 } }));
    eq(J(padKeyAction("rest")), J({ kind: "cmd", cmd: { k: "rest" } }));
    eq(J(padKeyAction("symBackspace")), J({ kind: "cmd", cmd: { k: "symBackspace" } }));
    eq(J(padKeyAction("staff")), J({ kind: "cmd", cmd: { k: "staff" } }));
    eq(J(padKeyAction("phrase")), J({ kind: "cmd", cmd: { k: "phrase" } }));
    eq(J(padKeyAction("art:breath")), J({ kind: "cmd", cmd: { k: "art", a: "breath" } }));
    eq(J(padKeyAction("inhale:big")), J({ kind: "cmd", cmd: { k: "inhale", v: "big" } }));
    eq(J(padKeyAction("swell:<>")), J({ kind: "cmd", cmd: { k: "swell", w: "<>" } }));
    eq(J(padKeyAction("wedge:dim")), J({ kind: "cmd", cmd: { k: "wedge", w: "dim" } }));
    eq(J(padKeyAction("dyn:mf")), J({ kind: "cmd", cmd: { k: "dyn", v: "mf" } }));
    eq(J(padKeyAction("dyn:mf", { ramp: true })), J({ kind: "cmd", cmd: { k: "dyn", v: "mf", ramp: true } }));
    eq(J(padKeyAction("key")), J({ kind: "mark", mark: "key" })); eq(J(padKeyAction("tempo")), J({ kind: "mark", mark: "tempo" }));
    eq(J(padKeyAction("repeat")), J({ kind: "menu", menu: "repeat" })); eq(J(padKeyAction("ottava")), J({ kind: "menu", menu: "ottava" }));
    eq(padKeyAction("nope"), null); eq(padKeyAction("dyn:ramp"), null); eq(padKeyAction("caret:2"), null);
  });
  it("键盘模块是纯前端：pad / drum / wheel / param-row / latch / chords / pad-layout / midi 不 import 谱 / 音乐 / 宿主（keys.ts 是电脑键盘的键位表，带着命令，例外）", () => {
    for (const f of ["pad", "drum", "wheel", "param-row", "latch", "chords", "pad-layout", "midi"]) {
      const src = fs.readFileSync(new URL(`../src/keyboard/${f}.ts`, import.meta.url), "utf8");
      assert(!/from "\.\.\/(score|app|engine|singer|gm|format|performers)\//.test(src), `src/keyboard/${f}.ts import 了 src/score|app|engine|…（键盘不懂音乐，音乐知识走 PadMusic 注入）`);
    }
  });
  it("按键写的是哪种记号（画灰 / 「不认」按它查）", () => {
    eq(markOfKey("art:staccato"), "staccato"); eq(markOfKey("art:breath"), "breath"); eq(markOfKey("slur"), "slur");
    eq(markOfKey("swell:>"), "swellFade"); eq(markOfKey("swell:<"), "swellGrow"); eq(markOfKey("swell:<>"), "swellGrow"); eq(markOfKey("inhale:soft"), "inhale");
    eq(markOfKey("dyn:mf"), null); eq(markOfKey("rest"), null); eq(markOfKey("key"), null);
  });
});
