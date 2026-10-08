// desk（视图态 ↔ 文件）。created 2026-10-08 by Claude Fable 5.1
import { describe, it, eq } from "./runner.mjs";
import { freshDesk, serializeDesk, unserializeDesk } from "../src/score/desk.ts";

describe("desk（视图态顺手捞进文件）", () => {
  it("全默认 = 不写字段", () => { eq(serializeDesk(freshDesk()), null); });
  it("只写非默认值；读回来等价", () => {
    const d = freshDesk(); d.scope = "all"; d.pageFlow = true; d.paper = "p2";
    d.parts.P1 = { hidden: false, only: true, muted: false, solo: false }; d.parts.P2 = { hidden: true, only: false, muted: true, solo: false }; d.parts.P3 = { hidden: false, only: false, muted: false, solo: false };
    const j = serializeDesk(d)!;
    eq(j, { scope: "all", pageFlow: true, paper: "p2", parts: { P1: { only: true }, P2: { hidden: true, muted: true } } }, "P3 全默认不写");
    const back = unserializeDesk(JSON.parse(JSON.stringify(j)));
    eq(back.scope, "all"); eq(back.pageFlow, true); eq(back.paper, "p2"); eq(back.parts.P2, { hidden: true, only: false, muted: true, solo: false }); eq(back.parts.P3, undefined);
  });
  it("宽容读：不是对象 / 怪值 = 默认", () => {
    eq(unserializeDesk(null), freshDesk()); eq(unserializeDesk("x"), freshDesk());
    const d = unserializeDesk({ scope: "weird", pageFlow: "yes", paper: 3, parts: { P1: "nope", P2: { hidden: "true" } } });
    eq(d.scope, "segment"); eq(d.pageFlow, false); eq(d.paper, null); eq(d.parts.P1, undefined); eq(d.parts.P2, { hidden: false, only: false, muted: false, solo: false });
  });
});
