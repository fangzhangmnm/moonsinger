// mono-voice.test.ts —— 单声乐器试听：后按的顶掉前面的、松开回到前一个（src/app/mono-voice.ts）。created 2026-11-09 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { monoDown, monoUp, type MonoHeld } from "../src/app/mono-voice.ts";

const ids = (s: readonly MonoHeld<string>[]) => s.map((h) => h.id).join(",");
describe("单声试听：后按的顶掉前面的，松开回到前一个（user 11-09「可以」）", () => {
  it("按 A 再按 B：A 停、B 响；松 B：回到 A；松 A：没人响", () => {
    const a = monoDown<string>([], "A", "do"); eq(ids(a.stack), "A"); eq(a.silence.join(), "");
    const b = monoDown(a.stack, "B", "re"); eq(ids(b.stack), "A,B"); eq(b.silence.join(), "A");
    const ub = monoUp(b.stack, "B"); eq(ids(ub.stack), "A"); eq(ub.back?.p, "do");
    const ua = monoUp(ub.stack, "A"); eq(ids(ua.stack), ""); eq(ua.back, null);
  });
  it("按 A、按 B、先松 A（被顶掉的那个）：B 照响、不回任何人；再松 B：没人响", () => {
    const b = monoDown(monoDown<string>([], "A", "do").stack, "B", "re");
    const ua = monoUp(b.stack, "A"); eq(ids(ua.stack), "B"); eq(ua.back, null);
    const ub = monoUp(ua.stack, "B"); eq(ids(ub.stack), ""); eq(ub.back, null);
  });
  it("三个叠着按、从上往下松：一层一层回去", () => {
    let s = monoDown<string>([], "A", "do").stack; s = monoDown(s, "B", "re").stack; const c = monoDown(s, "C", "mi"); eq(c.silence.join(), "A,B"); s = c.stack;
    const uc = monoUp(s, "C"); eq(uc.back?.id, "B"); const ub = monoUp(uc.stack, "B"); eq(ub.back?.id, "A");
  });
  it("同一个键再按 = 挪到栈顶（滑音换音）；松一个不在栈里的 = 不动", () => {
    let s = monoDown<string>([], "A", "do").stack; s = monoDown(s, "B", "re").stack;
    const a2 = monoDown(s, "A", "do#"); eq(ids(a2.stack), "B,A"); eq(a2.silence.join(), "B");
    const x = monoUp(a2.stack, "Z"); eq(ids(x.stack), "B,A"); eq(x.back, null);
  });
});
