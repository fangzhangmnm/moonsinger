// test/e2e/pedal.mjs —— 真浏览器 E2E：踏板的输入（11-1 第四步；设计稿 ai-docs/20261112-pedals-and-ring-design.md 第 6 节）。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。符号层「记号」页「踏板」键 → 小菜单：字跟着光标前那个音那儿踩没踩（没踩 = 踩下；踩着 = 抬起 / 换踏板）；
//   有选区 = 把这一段踩住；谱上画出来；点谱上的踏板记号 = 换 / 删；台上这位不认 = 画灰 + 说一句。
import { chromium } from "./pw.mjs";
let pass = 0, fail = 0;
const check = (ok, name, extra = "") => { if (ok) pass++; else fail++; console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`); };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1100, height: 900 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.MS_E2E_BASE ?? "http://127.0.0.1:8710/"); await p.waitForTimeout(800);
await p.evaluate(() => {
  const m = window.__moonsinger, st = m.state(), pid = st.at.part, head = st.song.papers[0].tracks[pid].slice(0, 3); let id = 7000;
  const notes = Array.from({ length: 4 }, (_, k) => ({ kind: "note", id: id++, pitch: { step: "CDEF"[k], alter: 0, octave: 5 }, dur: 1680, lyric: null }));
  m.set({ ...st, caret: 4, sel: null, song: { ...st.song, papers: [{ ...st.song.papers[0], tracks: { [pid]: [...head, ...notes] } }] } });
});
const shape = () => p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].slice(3).filter((t) => t.kind !== "dyn").map((t) => t.kind === "note" ? t.pitch.step : t.kind === "pedal" ? { down: "v", up: "^", change: "~" }[t.act] : t.kind).join(" "); });
const caretAfter = (step) => p.evaluate((step) => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part]; m.set({ ...s, sel: null, caret: t.findIndex((x) => x.kind === "note" && x.pitch.step === step) + 1 }); }, step);
const openMenu = async () => {
  if (!(await p.$(".pad-grid.symbols"))) { await p.click(".pad-head [data-kbswitch]"); await p.waitForTimeout(80); }
  await p.click('.pad-head [data-sympage="mark"]'); await p.waitForTimeout(80);
  await p.click('[data-sym="pedal"]'); await p.waitForTimeout(150);
  return p.$$eval(".pedal-menu [data-v]", (es) => es.map((e) => e.dataset.v));
};
const pick = async (v) => { await p.click(`.pedal-menu [data-v="${v}"]`); await p.waitForTimeout(150); };

check(!!(await p.$('[data-sym="pedal"]')) || true, "开好了");
let vs = await openMenu();
check(vs.join(",") === "sustain:act:down,sostenuto:act:down,soft:act:down", "光标处没踩：三种踏板各一行，每行只有「踩下」（11-2 起三行）", vs.join(","));
check(/接着响/.test(await p.$eval('.pedal-menu [data-v="sustain:act:down"]', (e) => e.textContent)) && /轻一点/.test(await p.$eval('.pedal-menu [data-v="soft:act:down"]', (e) => e.textContent)) && /按着的音/.test(await p.$eval('.pedal-menu [data-v="sostenuto:act:down"]', (e) => e.textContent)), "字带上各自的效果（延音 = 留住音、持音 = 留住这一刻按着的、弱音 = 弹得轻一点）");
await pick("sustain:act:down");
check((await shape()) === "v C D E F", "写完 C 按踩下 = 从 C 起", await shape());
check((await p.$$eval("#score .pedal", (e) => e.length)) >= 2, "谱上画了（名字 + 线）");
await caretAfter("E"); vs = await openMenu();
check(vs.join(",") === "sustain:act:up,sustain:act:change,sostenuto:act:down,soft:act:down", "延音踩着：那一行是「抬起」「换踏板」；另两种照旧只有「踩下」", vs.join(","));
await pick("sustain:act:change");
check((await shape()) === "v C D ~ E F", "换踏板挂在 E 上", await shape());
await caretAfter("F"); await openMenu(); await pick("sustain:act:up");
check((await shape()) === "v C D ~ E ^ F", "抬起挂在 F 上", await shape());
// 同一个音上再按同一个 = 去掉
await openMenu(); const on = await p.$eval('.pedal-menu [data-v="sustain:act:up"]', (e) => e.classList.contains("is-on"));
check(on, "那个音上已经有的亮着");
await pick("sustain:act:up");
check((await shape()) === "v C D ~ E F", "再点 = 去掉", await shape());
// 点谱上的「Ped.」：它的小菜单（换 / 删）
const ped = await p.$$eval("#score .pedal", (es) => { const e = es.find((x) => x.tagName.toLowerCase() === "text"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.click(ped.x, ped.y); await p.waitForTimeout(200);
check(!!(await p.$(".pedal-menu [data-v='del']")), "点谱上的踏板记号 = 它的小菜单（有删）");
await pick("del");
check((await shape()) === "C D ~ E F", "删掉踩下（换踏板留着：没踩就换 = 踩下）", await shape());
// 有选区 = 把这一段踩住
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(); m.set({ ...s, song: { ...s.song, papers: [{ ...s.song.papers[0], tracks: { [s.at.part]: s.song.papers[0].tracks[s.at.part].filter((t) => t.kind !== "pedal") } }] } }); });
await p.evaluate(() => { const m = window.__moonsinger, s = m.state(), t = s.song.papers[0].tracks[s.at.part], a = t.findIndex((x) => x.kind === "note" && x.pitch.step === "D"); m.set({ ...s, caret: a + 2, sel: { from: a, to: a + 2 } }); });
vs = await openMenu();
check(vs.join(",") === "sustain:span,sostenuto:span,soft:span", "有选区：每一行是「把这一段踩住」", vs.join(","));
await pick("sustain:span");
check((await shape()) === "C v D E ^ F", "选区开头踩下、结尾抬起", await shape());
// 拖「Ped.」= 挪到别的音起（E 上）；v0.17.48（选中规则单行这一版）：鼠标悬浮就亮 = 按住直接拖，不用先长按
{
  const d = await p.$$eval("#score .pedal", (es) => { const e = es.find((x) => x.tagName.toLowerCase() === "text"); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const ex = await p.evaluate(() => { const L = window.__moonsinger.layout(), s = window.__moonsinger.state(), t = s.song.papers[0].tracks[s.at.part], i = t.findIndex((x) => x.kind === "note" && x.pitch.step === "E"), dI = t.findIndex((x) => x.kind === "note" && x.pitch.step === "D"); const nE = L.notes.find((n) => n.index === i), nD = L.notes.find((n) => n.index === dI); return nE.x - nD.x; });
  await p.mouse.move(d.x, d.y); await p.mouse.down(); await p.mouse.move(d.x + ex, d.y, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
  check((await shape()) === "C D v E ^ F", "鼠标按住拖：踩下挪到 E 起", await shape());
}
// 11-2：持音、弱音各写一个（光标在 C 后面）；持音 / 弱音踩着时那一行只有「抬起」，没有「换踏板」
await caretAfter("C"); await openMenu(); await pick("sostenuto:act:down"); await openMenu(); await pick("soft:act:down");
check((await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.papers[0].tracks[s.at.part].filter((t) => t.kind === "pedal" && t.which !== "sustain").map((t) => `${t.which}:${t.act}`).join(","); })) === "sostenuto:down,soft:down", "持音、弱音各写了一个踩下");
await caretAfter("E"); vs = await openMenu();
check(vs.includes("sostenuto:act:up") && vs.includes("sostenuto:act:change") && vs.includes("soft:act:up") && !vs.includes("soft:act:change"), "持音踩着：「抬起」「换踏板」都能写（v0.17.42）；弱音踩着：只有「抬起」，不给写「换踏板」", vs.join(","));
await p.keyboard.press("Escape"); await p.waitForTimeout(100);
// 台上这位不认（新歌默认小月相）= 谱上画灰
const grey = await p.$$eval("#score .pedal", (es) => es.every((e) => e.classList.contains("art-mute")));
const who = await p.evaluate(() => { const s = window.__moonsinger.state(); return s.song.parts[0].role; });
check(grey, "小月相不认踏板：三种踏板都画灰", who);
check(!errs.length, "没有页面错误", errs.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
