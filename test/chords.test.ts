// chords.test.ts —— 两键同按的头 / 尾判据 + 单音护栏（src/keyboard/chords.ts）：user 2026-10-08 说的几种情形逐条钉住。created 2026-10-15 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { chordHead, chordBothAfterMs, chordVerdict, monoClash, CHORD_WIN, CHORD_MS } from "../src/keyboard/chords.ts";

describe("叠音判据（键盘模块）", () => {
  it("头：B 在根音落下 80 ms 内 = 叠；到 80 = 观望", () => {
    eq(chordHead({ t: 1000 }, { t: 1079 }), true); eq(chordHead({ t: 1000 }, { t: 1080 }), false); eq(CHORD_WIN, 80);
  });
  it("B 先松、根音还按着 = 套在里面 → 叠；根音已经松了 = 两个音", () => {
    const r = { t: 0 }, b = { t: 300 };
    eq(chordVerdict(r, b, 500, "keyUp", true, false), "chord"); eq(chordVerdict(r, b, 500, "keyUp", false, false), "two");
  });
  it("根音先松：一起按着的比根音单独按着的长 = 叠；短 = 尾巴压头 = 两个音（按比例，不是固定毫秒）", () => {
    const r = { t: 0 }, b = { t: 300 };   // 根音单独按了 300 ms
    eq(chordVerdict(r, b, 601, "rootUp", false, true), "chord");   // 一起 301 > 300
    eq(chordVerdict(r, b, 599, "rootUp", false, true), "two");
    const r2 = { t: 0 }, b2 = { t: 40 };   // 快速跳音：根音单独 40 ms、一起只 30 ms = 两个音
    eq(chordVerdict(r2, b2, 70, "rootUp", false, true), "two");
    eq(chordVerdict(r2, b2, 81, "rootUp", false, true), "chord");
  });
  it("到时候了（一起按着 > 根音单独的）：两个都还按着 = 叠；有人松了 = null（等别的事件）", () => {
    const r = { t: 0 }, b = { t: 300 }; eq(chordBothAfterMs(r, b), 305);
    eq(chordVerdict(r, b, 605, "both", true, true), "chord"); eq(chordVerdict(r, b, 605, "both", false, true), null); eq(chordVerdict(r, b, 605, "both", true, false), null);
  });
  it("又按了下一个键 / 失焦（force）：根音还按着 = 叠，不然两个音", () => {
    const r = { t: 0 }, b = { t: 300 };
    eq(chordVerdict(r, b, 400, "force", true, true), "chord"); eq(chordVerdict(r, b, 400, "force", false, true), "two");
  });
  it("单音乐器的护栏：有键按着且离上一次不到 50 ms = 挡；隔开了 / 没键按着 = 照写", () => {
    eq(monoClash(1, 1000, 1049), true); eq(monoClash(1, 1000, 1050), false); eq(monoClash(0, 1000, 1001), false); eq(CHORD_MS, 50);
  });
});
