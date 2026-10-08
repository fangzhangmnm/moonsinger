// desk（视图态 ↔ 文件）。created 2026-10-08 by Claude Fable 5.1
// edited 2026-10-08 by Claude Opus 5.5：这个文件原来没登记进 test/run.mjs（一直没跑），且用 eq 比对象（eq 是 ===）——改成 deq 按 JSON 比；加导出音质那条。
import { describe, it, eq } from "./runner.mjs";
import { freshDesk, serializeDesk, unserializeDesk } from "../src/score/desk.ts";

const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);

describe("desk（视图态顺手捞进文件）", () => {
  it("全默认 = 不写字段", () => { eq(serializeDesk(freshDesk()), null); });
  it("只写非默认值；读回来等价", () => {
    const d = freshDesk(); d.scope = "all"; d.pageFlow = true; d.paper = "p2";
    d.parts.P1 = { hidden: false, only: true, muted: false, solo: false }; d.parts.P2 = { hidden: true, only: false, muted: true, solo: false }; d.parts.P3 = { hidden: false, only: false, muted: false, solo: false };
    const j = serializeDesk(d)!;
    deq(j, { scope: "all", pageFlow: true, paper: "p2", parts: { P1: { only: true }, P2: { hidden: true, muted: true } } }, "P3 全默认不写");
    const back = unserializeDesk(JSON.parse(JSON.stringify(j)));
    eq(back.scope, "all"); eq(back.pageFlow, true); eq(back.paper, "p2"); deq(back.parts.P2, { hidden: true, only: false, muted: true, solo: false }); eq(back.parts.P3, undefined);
  });
  it("导出音质跟歌走：默认标准不写；小文件写 mp3: small、读回来一样；怪值 = 标准（2026-10-08 Opus，user「音质配置就是应该也跟着吧」）", () => {
    const d = freshDesk(); eq(d.mp3, "standard");
    d.mp3 = "small"; deq(serializeDesk(d), { mp3: "small" });
    eq(unserializeDesk({ mp3: "small" }).mp3, "small"); eq(unserializeDesk({ mp3: "loud" }).mp3, "standard");
  });
  it("宽容读：不是对象 / 怪值 = 默认", () => {
    deq(unserializeDesk(null), freshDesk()); deq(unserializeDesk("x"), freshDesk());
    const d = unserializeDesk({ scope: "weird", pageFlow: "yes", paper: 3, parts: { P1: "nope", P2: { hidden: "true" } } });
    eq(d.scope, "segment"); eq(d.pageFlow, false); eq(d.paper, null); eq(d.parts.P1, undefined); deq(d.parts.P2, { hidden: false, only: false, muted: false, solo: false });
  });
});
