// test/input-gate-guard.test.mjs —— 结构守卫：键盘总闸（src/app/input-gate.ts）以外，没有别的路能从按键写谱。created 2026-11-09 by Claude Fable 5.1
//   修改锁那一轮的要求（交接清单 §3.1 ⑦）：「总闸以外不许再有直接听 keydown 改谱的路」。这里钉四样：
//   ① 听 keydown 的地方是一张白名单（新加一处 = 红，来这里登记它为什么不会写谱）；② main.ts 的全局监听只「问归谁 → 按归属做」，自己不写；
//   ③ run()（键表动作的执行）里每一次往谱上写前面都有总闸；④ 触屏键盘 / MIDI 的两条出口（update / writeAndLocate）和 pad-host 里会写的键都问总闸。
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, assert, eq } from "./runner.mjs";

const read = (p) => readFileSync(p, "utf8");
/** 去掉注释，只看代码（行注释 + 块注释）。 */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.ts$/.test(f) && !/\.d\.ts$/.test(f) ? [p] : []; });

describe("键盘总闸守卫", () => {
  it("① 听 keydown 的地方是白名单：每一处都写明它为什么不往谱上写", () => {
    const ALLOWED = {
      "src/app/main.ts": 3,              // 全局那一个（问 keyOwner → 按归属做）+ 声部管理改名框的回车 + 起名对话框的回车 / Esc（都是自己框里的键）
      "src/ui/platform-guards.ts": 1,    // Ctrl / ⌘ + = / − / 0 = 谱面缩放（看法，不写谱）
      "src/ui/sheets.ts": 1,             // 面板开着时的 Esc / 回车
      "src/ui/title-editor.ts": 1,       // 歌名 / 曲段名那一行自己的输入框（回车提交、Esc 取消；提交走文档写入口）
      "src/app/reference-host.ts": 1,    // 参考窗的 Esc = 焦点回谱
      "src/keyboard/pad.ts": 1,          // 键盘候选排开着时的 Esc = 收起
      "src/widgets/drum.ts": 1,          // 滚轮（drum = 竖直滚轮小控件，不是鼓）的 Esc = 收起
      "src/ui/dropdown.ts": 1,           // 只做记号：这一下按下时有下拉列表开着（捕获阶段、库的弹层监听之前），全局监听据此交给 keyOwner 的 list——自己不处理键、不写谱（7-T）
    };
    const found = {};
    // 这里不用 code()：有的文件里有 "image/*" 这样的字符串，会被当成块注释的开头。整行是注释的不算，别的原样数。
    const live = (src) => src.split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
    for (const p of walk("src")) { const t = live(read(p)), n = (t.match(/addEventListener\(\s*["'](keydown|keypress)["']/g) ?? []).length + (t.match(/\.onkey(down|press)\s*=/g) ?? []).length; if (n) found[p.replaceAll("\\", "/")] = n; }
    eq(JSON.stringify(Object.entries(found).sort()), JSON.stringify(Object.entries(ALLOWED).sort()), "听按键的地方变了：新加的要么走总闸（main.ts 的全局监听 → keyOwner），要么来这张表登记它为什么不写谱");
  });
  it("② main.ts 的全局监听：先问归谁（keyOwner），按归属去做；监听里自己不往文档写", () => {
    const s = read("src/app/main.ts");
    const a = s.indexOf('window.addEventListener("keydown", (e) => {\n  keyTs = e.timeStamp;'), b = s.indexOf('window.addEventListener("keyup"', a);
    assert(a > 0 && b > a, "找到全局 keydown 监听");
    const body = code(s.slice(a, b));
    assert(/const owner = keyOwner\(\{/.test(body) && /switch \(owner\)/.test(body) && /default: return assertNever\(owner\)/.test(body), "监听 = keyOwner + 穷举的 switch");
    assert(!/\b(update|updateExtras|updateBoth)\(|D\.commit\(|D\.run\(/.test(body), "监听里出现了直接写文档的调用：写谱只能经 run()（键表）→ 总闸");
  });
  it("③ run()：每一次往谱上写，前面四行之内都问过总闸（只动输入状态的那一处除外）", () => {
    const s = read("src/app/main.ts");
    const a = s.indexOf("function run(a: Action, repeat: boolean, code: string): boolean {"), b = s.indexOf("let keyTs = 0;", a);
    assert(a > 0 && b > a, "找到 run()");
    const lines = code(s.slice(a, b)).split("\n");
    const bad = [];
    lines.forEach((l, i) => {
      if (!/\bupdate\(/.test(l)) return;
      if (/update\(\{ \.\.\.D\.st, input: probe\.input \}\)/.test(l)) return;   // 弹：只把「只管下一个音」的 ♯ / ♭ 用掉（输入状态，不是谱）
      if (!lines.slice(Math.max(0, i - 4), i + 1).some((x) => /inputGate\.(may|mayWrite)\(/.test(x))) bad.push(l.trim().slice(0, 120));
    });
    eq(bad.join(" ‖ "), "", "run() 里有没问总闸就往谱上写的地方");
    const body = lines.join("\n");
    assert(!/updateExtras\(|updateBoth\(|D\.commit\(/.test(body), "run() 里不许绕过 update() 直接写文档");
    assert(/case "clip": if \(\(a\.a === "cut" \|\| a\.a === "paste"\) && !inputGate\.mayWrite\(\)\) return true;/.test(body), "剪切 / 粘贴是写，先问总闸");
    assert(/case "undo": if \(inputGate\.mayStep\(D\.history, "undo"\)\) undoNow\(\);/.test(body) && /case "redo": if \(inputGate\.mayStep\(D\.history, "redo"\)\) redoNow\(\);/.test(body), "键盘上的撤销 / 重做先问总闸");
    assert(/return inputGate\.why\(\) \? "impro" : D\.st\.sel \? "edit" : "write";/.test(code(s)), "键盘不往谱上写的时候按「弹」路由（音键只响）");
  });
  it("④ 触屏键盘 / MIDI：两条出口各带一道总闸；pad-host 里「只响不写」、会写的键、符号格的命令都问它", () => {
    const m = code(read("src/app/main.ts"));
    assert(/update: \(n, gesture\) => \{ if \(inputGate\.may\(D\.st, n\)\) update\(n, gesture\); \}/.test(m), "pad 的 update 出口");
    assert(/writeAndLocate: \(w, gesture\) => writeAndLocate\(\(s\) => \{ const n = w\(s\); return inputGate\.may\(s, n\) \? n : s; \}, gesture\)/.test(m), "pad 的 writeAndLocate 出口");
    assert(/gate: inputGate, finderOpen:/.test(m), "总闸交给 pad 宿主");
    const h = code(read("src/app/pad-host.ts"));
    assert(/const padImpro = \(\): boolean => g\.gate\.why\(\) !== null;/.test(h), "「音键只响不写」看总闸");
    assert(/const prev = st\(\), nx = apply\(prev, g\.half\.wrap\(c\), performance\.now\(\)\);\s*if \(!g\.gate\.may\(prev, nx\)\) return;/.test(h), "符号格 / 写音那一排的命令：算出结果先问总闸，再说话、再写");
    assert(/if \(a\.kind === "cmd"\) \{ runPadCommand\(a\.cmd\); return; \}\s*if \(!g\.gate\.mayWrite\(\)\) return;/.test(h), "开记号框 / 菜单的键先问总闸");
    assert(!/\bg\.(impro|finderShown|instShown)\(/.test(h), "pad-host 不再自己拼「弹 ∨ 乐器目录 ∨ 乐器页」");
  });
  it("⑤ 「能不能写」只有一个注入的回答；总闸模块是纯的（不碰 DOM、只引类型）", () => {
    const m = code(read("src/app/main.ts"));
    assert(/const inputGate = createInputGate\(\{\s*locked: \(\) => D\.locked\(\) !== null,\s*picking: \(\) => finderShown\(\) \|\| instShown\(\),\s*unplugged: \(\) => impro,/.test(m), "三个原因的来源（修改锁那一轮只换 locked 这一行）");
    eq((m.match(/createInputGate\(/g) ?? []).length, 1, "总闸只建一个");
    const g = code(read("src/app/input-gate.ts"));
    assert(!/\b(document|window|localStorage|navigator)\b/.test(g), "input-gate.ts 不碰 DOM / 环境");
    for (const l of g.split("\n").filter((x) => /^import /.test(x))) assert(/^import type /.test(l), "input-gate.ts 只引类型：" + l);
    assert(!/\blet\b/.test(g), "input-gate.ts 不存状态（没有 let）");
  });
});
