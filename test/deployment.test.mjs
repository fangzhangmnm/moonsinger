// 部署方式只认一次 + 规则书 §2 表的机械版（家族规则书 `../ai-docs/20261103-three-shapes-rulebook.md` §1 第 9 条 / §2 / §4 第 3、4、13 项）。
// created 2026-11-03 by Claude Opus 5.5
//   ① 除 src/deployment.ts 外，源码不许看 location.protocol / window.top / self === top / self !== top / 烤进来的部署标记 / "file:" 字面量；
//   ② policy 逐格 = §2 表（本 app 用得上的列；rememberPassword 不进来 = 没有消费者，见 deployment-policy.ts 头注释）；
//   ③ policy 每个键在 deployment-policy.ts 以外至少被一个源码文件读到（`currentPolicy().键` 或 `policy(…).键`）——没人读的开关 = 假开关。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, eq, assert } from "./runner.mjs";
import { detectDeployment } from "../src/deployment.ts";
import { policy } from "../src/deployment-policy.ts";

function* walk(dir) {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* walk(p); else if (/\.(ts|mjs|js)$/.test(f) && !f.endsWith(".d.ts")) yield p.replace(/\\/g, "/"); }
}
/** 去掉整行注释和行尾注释（守卫看代码，不看注释里讲的来历）。 */
const codeLines = (p) => readFileSync(p, "utf8").split("\n").map((l) => (/^\s*(\/\/|\*|\/\*)/.test(l) ? "" : l.replace(/\s\/\/\s.*$/, "")));
const SOURCES = [...walk("src"), "service-worker.js"];

describe("部署方式只在 deployment.ts 认（规则书 §1 第 9 条）", () => {
  const FORBIDDEN = [
    [/\blocation\.protocol\b/, "location.protocol"],
    [/\bwindow\.top\b|\bself\.top\b|\bglobalThis\.top\b/, "window.top"],
    [/\bself\s*[!=]==?\s*(window\.)?top\b|\btop\s*[!=]==?\s*(window\.)?self\b/, "self === / !== top"],
    [/name\s*=\s*\\?["']?deployment\b/, "部署标记 <meta name=deployment>"],
    [/["'`]file:["'`]/, "\"file:\" 字面量"],
  ];
  it("别处一行都没有", () => {
    const bad = [];
    for (const p of SOURCES) {
      if (p === "src/deployment.ts") continue;
      codeLines(p).forEach((line, i) => { for (const [re, what] of FORBIDDEN) if (re.test(line)) bad.push(`${p}:${i + 1} ${what}`); });
    }
    assert(bad.length === 0, "部署方式只许在 src/deployment.ts 认：\n" + bad.join("\n"));
  });
  it("认法（纯函数）：file: 优先于标记；标记 itch / local；否则官网", () => {
    eq(detectDeployment("file:", null), "local");
    eq(detectDeployment("file:", "itch"), "local");          // 存储现实按协议走
    eq(detectDeployment("https:", "itch"), "itch");
    eq(detectDeployment("http:", "local"), "local");         // 备用版文件夹被人用本机小服务器打开
    eq(detectDeployment("https:", null), "site");
    eq(detectDeployment("https:", "something-else"), "site");
    eq(detectDeployment(undefined, undefined), "site");      // node 测试
  });
});

describe("deployment-policy = 规则书 §2 表（逐格）", () => {
  // §2 行：网盘 / 离线壳（SW）/ 「去官网」一句 / 文件夹图库 + 本 app 自己的歌库（A2 ④ Fable 裁定 itch 画灰；H3：备用版有文件夹这个家）
  const TABLE = {
    site:  { cloud: true,  serviceWorker: true,  siteHint: false, folderGallery: true,  library: true },
    itch:  { cloud: false, serviceWorker: false, siteHint: true,  folderGallery: false, library: false },
    local: { cloud: false, serviceWorker: false, siteHint: true,  folderGallery: true,  library: true },
  };
  for (const d of ["site", "itch", "local"]) {
    it(`${d}：每一格都对、没有多的键`, () => {
      const got = policy(d);
      eq(Object.keys(got).sort().join(","), Object.keys(TABLE[d]).sort().join(","), "键");
      for (const [k, v] of Object.entries(TABLE[d])) eq(got[k], v, `${d}.${k}`);
    });
  }
});

describe("每个开关都有真消费者（规则书 §4 第 13 项）", () => {
  const src = readFileSync("src/deployment-policy.ts", "utf8");
  const keys = [...src.matchAll(/^\s*readonly (\w+): boolean;/gm)].map((m) => m[1]);
  it("接口里的键 = 表里的键", () => { eq(keys.sort().join(","), Object.keys(policy("site")).sort().join(",")); });
  for (const k of keys) {
    it(`${k} 在 deployment-policy.ts 以外被读到`, () => {
      const re = new RegExp(`(currentPolicy\\(\\)|\\bpolicy\\([^()]*\\))\\.${k}\\b`);
      const readers = SOURCES.filter((p) => p !== "src/deployment-policy.ts" && codeLines(p).some((l) => re.test(l)));
      assert(readers.length > 0, `开关 ${k} 没有消费者（= 假开关）`);
    });
  }
});
