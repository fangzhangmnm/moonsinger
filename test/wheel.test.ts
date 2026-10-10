// 滚轮 → 几步（src/ui/wheel.ts；pad 旋钮和混音台滑块共用；v0.10.13）。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { wheelSteps } from "../src/ui/wheel.ts";

const px = (deltaY: number) => ({ deltaMode: 0, deltaY });
describe("滚轮一格 = 一步", () => {
  it("鼠标一格（Chrome 100 px / 按行 3 行 / 按页）都只走一步，零头清掉", () => {
    { const r = wheelSteps(px(100), 25); eq(r.steps, 1); eq(r.acc, 0); }
    { const r = wheelSteps(px(-100), 0); eq(r.steps, -1); eq(r.acc, 0); }
    { let a = 0; for (let k = 0; k < 10; k++) { const r = wheelSteps({ deltaMode: 1, deltaY: 3 }, a); a = r.acc; eq(r.steps, 1); } }   // Firefox 一格 3 行：滚十格也是十步（原来零头攒满会跳两步）
    { const r = wheelSteps({ deltaMode: 2, deltaY: -1 }, 0); eq(r.steps, -1); eq(r.acc, 0); }
  });
  it("触控板的小步子攒够 40 px 才走一步，反方向抵掉", () => {
    let a = 0, steps = 0;
    for (const d of [10, 10, 10]) { const r = wheelSteps(px(d), a); a = r.acc; steps += r.steps; }
    eq(steps, 0);
    const r = wheelSteps(px(15), a); eq(r.steps, 1); eq(r.acc, 5);
    eq(wheelSteps(px(-30), 20).steps, 0);
  });
});
