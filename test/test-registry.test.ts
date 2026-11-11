// 每个 test/*.test.ts / *.test.mjs 都登记进 test/run.mjs（运行器逐个 import，没登记 = 整套静默不跑它）。
//   created 2026-11-11 by Claude Opus 5.5（MoonSinger小弟，谱面分家施工单 1b-9）：起因 = 1b 新加的守卫 3 / 守卫 8 没登记，几个提交里 npm test 根本没跑它们、照报全绿；
//   查的时候又发现 engrave-decor.test.ts（2026-10-15）一直没登记，其中一条断言在分家前就红了。
//   PENDING = 知道没登记、有原因、等人定的（写明为什么）；别的没登记 = 红。
const fs = (await import("node:fs" as string)) as { readFileSync(p: URL, e: string): string; readdirSync(p: URL): string[] };
import { describe, it, assert } from "./runner.mjs";

const PENDING: Record<string, string> = {
};
describe("测试登记", () => {
  it("test/ 下每个测试文件都在 test/run.mjs 里（PENDING 的写明了原因）", () => {
    const run = fs.readFileSync(new URL("./run.mjs", import.meta.url), "utf8");
    const files = fs.readdirSync(new URL("./", import.meta.url)).filter((f) => /\.test\.(ts|mjs)$/.test(f));
    const missing = files.filter((f) => !run.includes(`"./${f}"`) && !(f in PENDING));
    assert(missing.length === 0, `没登记进 test/run.mjs（整套测试不会跑它）：${missing.join("、")}`);
    for (const f of Object.keys(PENDING)) assert(!run.includes(`"./${f}"`), `${f} 已经登记了：从 PENDING 里拿掉`);
  });
});
