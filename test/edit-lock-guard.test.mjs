// edit-lock-guard.test.mjs —— 修改锁的结构守卫（grep 级，不跑 app）。created 2026-11-10 by Claude Fable 5.2
//   家族修改锁标准（家族根 ai-docs/20261108-edit-lock-standard.md）第六节：「解锁只在人的手势里。代码里能调到解锁的地方要用守卫测试钉死成一个名单」
//   「用机器钉住表和各层对得上：表里的词必须真有写入口在用」。样板 = WeebPaint test/edit-lock-guard.test.mjs。
import { describe, it, assert, eq } from "./runner.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOOK_OPS } from "../src/app/edit-lock-table.ts";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
function* walk(dir) { for (const f of fs.readdirSync(path.join(ROOT, dir))) { const p = `${dir}/${f}`; if (fs.statSync(path.join(ROOT, p)).isDirectory()) yield* walk(p); else if (/\.(ts|mjs)$/.test(f)) yield p; } }
const SRC = [...walk("src")];
/** 去掉注释再找（注释里讲道理时会提到这些名字）。 */
const code = (f) => read(f).replace(/(^|\s)\/\*[\s\S]*?\*\//g, "$1").split("\n").map((l) => l.replace(/(^|\s)\/\/.*$/, "")).join("\n");   // 块注释只认行首 / 空白后面的「/*」（字符串里的 "image/*,audio/*" 不是注释）
/** 哪些文件的代码里出现了这个写法。 */
const users = (re) => SRC.filter((f) => re.test(code(f))).sort();

describe("修改锁 · 解锁只在人的手势里（调用点名单）", () => {
  it("解锁硬盘文件的口 unlockLocalFile：定义在 edit-lock.ts，调的只有门", () => {
    eq(users(/\bunlockLocalFile\s*\(/).join(","), "src/app/edit-lock-door.ts,src/app/edit-lock.ts");
  });
  it("解锁歌库里的歌（图库库的 unlockEdit / saveVersionThenUnlock）：只有歌库宿主的转手 + main.ts 里递给门的那两行", () => {
    eq(users(/\b(unlockEdit|saveVersionThenUnlock)\s*\(/).join(","), "src/app/edit-lock-door.ts,src/app/main.ts,src/gallery-host.ts");
    const main = code("src/app/main.ts"), i = main.indexOf("initEditLockDoor({"), j = main.indexOf("});", i);
    assert(i > 0 && j > i, "main.ts 里要有 initEditLockDoor({ … })");
    const outside = main.slice(0, i) + main.slice(j);
    assert(!/\b(unlockEdit|saveVersionThenUnlock)\s*\(/.test(outside), "main.ts 里 initEditLockDoor({…}) 之外不许调解锁");
    const door = code("src/app/edit-lock-door.ts");
    assert(/addEventListener\("click"/.test(door) && !/setTimeout|setInterval|requestAnimationFrame/.test(door), "门里的解锁只挂在点击上，没有定时器");
  });
  it("门的「接着改」continueEdit（别处的「解锁」钮用）：只有 main.ts「这首歌」面板里点「解锁」那一处（v0.17.27）", () => {
    eq(users(/\bcontinueEdit\s*\(/).join(","), "src/app/edit-lock-door.ts,src/app/main.ts");
    const hits = code("src/app/main.ts").split("\n").filter((l) => /\bcontinueEdit\s*\(/.test(l));
    assert(hits.length === 1 && /v === "unlock"/.test(hits[0]), hits.join("\n"));
    const main = code("src/app/main.ts"), at = main.indexOf(hits[0]), fn = main.lastIndexOf("function openSongPanel", at), click = main.lastIndexOf('content.addEventListener("click"', at);
    assert(fn > 0 && click > fn, "只挂在「这首歌」面板的点击上");
  });
  it("「这个句柄生来解着」keepLocalFileUnlocked：只有 main.ts 接到 home 的 onFileBorn 那一处", () => {
    eq(users(/\bkeepLocalFileUnlocked\s*\(/).join(","), "src/app/edit-lock.ts,src/app/main.ts");
    const hits = code("src/app/main.ts").split("\n").filter((l) => /keepLocalFileUnlocked\s*\(/.test(l));
    assert(hits.length === 1 && /onFileBorn/.test(hits[0]), hits.join("\n"));
    const home = code("src/app/home.ts").split("\n").filter((l) => /onFileBorn\?\.\(/.test(l));
    eq(home.length, 1, "home.ts 里只有「还没有家的新歌存成文件」那一处报生来解着");
  });
  it("「这首锁着吗」只有一处回答：别的文件不许自己去问库有没有解锁", () => {
    eq(users(/\bunlockOf\s*\(/).join(","), "src/app/edit-lock.ts");
    eq(users(/\bwatchUnlocks\s*\(/).join(","), "src/app/edit-lock.ts");
  });
});

describe("修改锁 · 分类表和写入口对得上", () => {
  const kinds = /export type LocusKind = ([^;]+);/.exec(read("src/score/history.ts"))?.[1].match(/"[A-Za-z]+"/g)?.map((x) => x.slice(1, -1)) ?? [];
  it("表里的每个词都是写入口上的一个类别，而且真有调用点在用", () => {
    assert(kinds.length >= 6, kinds.join(","));
    for (const k of Object.keys(LOOK_OPS)) {
      assert(kinds.includes(k), `${k} 不在 LocusKind 里`);
      assert(users(new RegExp(`kind:\\s*"${k}"`)).some((f) => f.startsWith("src/app/")), `没有调用点带着 kind: "${k}"`);
    }
  });
  it("带着看法类别的那一步不带 gesture（看法不并格；document.ts 里也会强制）", () => {
    for (const f of SRC) for (const l of code(f).split("\n")) for (const k of Object.keys(LOOK_OPS)) {
      if (new RegExp(`kind:\\s*"${k}"`).test(l)) assert(!/gesture/.test(l), `${f}: ${l.trim().slice(0, 120)}`);
    }
  });
  it("曲段隐藏只有一个调用点（main.ts 的 setHidden，带着 paperHidden）", () => {
    eq(users(/\bsetPaperHidden\s*\(/).join(","), "src/app/main.ts,src/score/song.ts");
    const hits = code("src/app/main.ts").split("\n").filter((l) => /\bsetPaperHidden\s*\(/.test(l));
    assert(hits.length === 1 && /kind:\s*"paperHidden"/.test(hits[0]), hits.map((l) => l.trim().slice(0, 140)).join("\n"));
  });
  it("写入口：document.ts 的 commit / 撤销重做都过 gate；保存那两层不看表", () => {
    const doc = code("src/app/document.ts");
    assert(/const why = gate\(kind\)/.test(doc) && /if \(gate\(kind\)\)/.test(doc), "commit 和 step 都要问 gate");
    assert(/effectiveKind<LocusKind>\(claimed/.test(doc) && /effectiveKind<LocusKind>\(snap\.locus\.kind/.test(doc), "自己报的类别和要翻的那一格都要核");
    for (const f of ["src/app/home.ts", "src/editor-session/editor-session.ts"]) assert(!/edit-lock-table|isLookOp|LOOK_OPS/.test(code(f)), `${f} 不许看分类表（锁着一个字节都不写）`);
  });
});

describe("修改锁 · 各道都接着线", () => {
  const main = code("src/app/main.ts");
  it("① 界面：键盘总闸的 locked 口问文档（定稿 ∨ 修改锁）；谱面规则、面板的样式跟着锁态", () => {
    assert(/locked: \(\) => D\.locked\(\) !== null/.test(main), "inputGate.locked");
    assert(/lockedWhy: \(\) => \(lock\.locked\(\)/.test(main), "D 的 lockedWhy 接 lock");
    assert(/lock\.locked\(\) \? lockedRules\(RULES\[ws\.mode\]\)/.test(main), "谱面规则");
    assert(/classList\.toggle\("doc-locked", lock\.locked\(\)\)/.test(main), "body.doc-locked");
    const css = read("styles.css");
    assert(/body\.doc-locked \.studio .*pointer-events: none/.test(css) && /body\.doc-locked \.studio \.strip-ms button \{ pointer-events: auto/.test(css), "混音台：控件不接，「静 / 独」留着");
  });
  it("②③ 写入口 / 撤销：D 的 writeGate 接 lock", () => { assert(/writeGate: \(kind\) => lock\.writeGate\(kind\)/.test(main)); });
  it("④ 保存：歌库 = es 的 editLocked；硬盘文件 = H 的 locked；「要不要存」不把锁着时只动了看法算进去", () => {
    assert(/editLocked: \(name\) => \(lock\.identifierLocked\(name\)/.test(main));
    assert(/locked: \(\) => lock\.locked\(\), onFileBorn/.test(main));
    assert(/dirty: \(\) => owesSave\(\)/.test(main) && /const owesSave = \(\): boolean => D\.dirty\(\) && !\(lock\.locked\(\) && D\.dirtyKind\(\) === "looks"\)/.test(main));
    const es = code("src/editor-session/editor-session.ts"), a = es.indexOf("editor.editLocked?.(name)"), b = es.indexOf("await editor.encode()");
    assert(a > 0 && b > a && !/\bawait\b/.test(es.slice(a, b)), "锁的判断和取快照之间不许有 await（钉身份靠同步前缀）");
  });
  it("参考窗：加 / 删 / 挪卡先问同一个地方", () => {
    assert(/canEdit: \(\) => !lock\.locked\(\)/.test(main));
    const ref = code("src/app/reference-host.ts");
    assert(/el\.canEdit = /.test(ref) && /addEventListener\("editrefused"/.test(ref));
  });
  it("锁上之前先存：三条杠的「锁上」先落盘、没存成不锁", () => {
    const i = main.indexOf("async function lockEditNow"), body = main.slice(i, main.indexOf("\n}\n", i));
    assert(i > 0 && body.indexOf("forceSaveAndPush") < body.indexOf("gallery.lockEdit") && body.indexOf("H.save()") < body.indexOf("lock.lockLocalFile()"), "先存后锁");
    assert(/if \(es\.isDirty\(\)\)/.test(body), "没存成不锁");
  });
});
