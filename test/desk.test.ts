// desk（视图态 ↔ 文件）。created 2026-10-08 by Claude Fable 5.1
// edited 2026-10-08 by Claude Opus 5.5：这个文件原来没登记进 test/run.mjs（一直没跑），且用 eq 比对象（eq 是 ===）——改成 deq 按 JSON 比；加导出音质那条。
import { describe, it, eq } from "./runner.mjs";
import { freshDesk, serializeDesk, unserializeDesk, unserializeFinderMemo, freshFinderMemo } from "../src/score/desk.ts";

const deq = (a: unknown, b: unknown, msg?: string) => eq(JSON.stringify(a), JSON.stringify(b), msg);

describe("desk（视图态顺手捞进文件）", () => {
  const FULL = { scope: "segment", pageFlow: false, scroll: false, paper: null, parts: {}, mp3: "standard", pad: { auto: true, fifths: 0, scale: "major", unit: "eighth", tuplet: 0, low: null }, ref: null, mode: "notes", finder: { mode: "year", open: {}, scroll: 0, row: null, pick: "" } };
  it("全默认 = 每一项照样明写（第 16 条 16-3：不靠「只写非默认」省字）", () => { deq(serializeDesk(freshDesk()), FULL); });
  it("每一项明写；读回来等价", () => {
    const d = freshDesk(); d.scope = "all"; d.pageFlow = true; d.paper = "p2";
    d.parts.P1 = { hidden: false, only: true, muted: false, solo: false }; d.parts.P2 = { hidden: true, only: false, muted: true, solo: false }; d.parts.P3 = { hidden: false, only: false, muted: false, solo: false };
    const j = serializeDesk(d);
    deq(j.parts, { P1: { hidden: false, only: true, muted: false, solo: false }, P2: { hidden: true, only: false, muted: true, solo: false }, P3: { hidden: false, only: false, muted: false, solo: false } }, "P3 全默认也写");
    const back = unserializeDesk(JSON.parse(JSON.stringify(j)));
    deq(back, d);
  });
  it("拼音字体退役（7-J，score patch 1）：老文件视图态里的 pdf: \"pinyin\" 读到不理、再存不带；别的视图态照读", () => {
    const d = unserializeDesk({ pdf: "pinyin", scope: "all", mp3: "small" });
    eq(d.scope, "all"); eq(d.mp3, "small");
    eq("pdf" in serializeDesk(d), false, "再存：没有 pdf 这个键");
  });
  it("导出音质跟歌走：标准也写；小文件写 mp3: small、读回来一样；怪值 = 标准（2026-10-08 Opus，user「音质配置就是应该也跟着吧」）", () => {
    const d = freshDesk(); eq(d.mp3, "standard"); eq(serializeDesk(d).mp3, "standard");
    d.mp3 = "small"; eq(serializeDesk(d).mp3, "small");
    eq(unserializeDesk({ mp3: "small" }).mp3, "small"); eq(unserializeDesk({ mp3: "loud" }).mp3, "standard");
  });
  it("横卷（v0.9.35）：写 scroll: true、pageFlow 写 false；读回来横卷说了算；怪值 = 不是横卷", () => {
    const d = freshDesk(); d.scroll = true; d.pageFlow = true;
    const j = serializeDesk(d); eq(j.scroll, true); eq(j.pageFlow, false);
    const back = unserializeDesk({ scroll: true, pageFlow: true }); eq(back.scroll, true); eq(back.pageFlow, false);
    eq(unserializeDesk({ scroll: "yes" }).scroll, false); eq(unserializeDesk({ pageFlow: true }).scroll, false);
  });
  it("宽容读：不是对象 / 怪值 = 默认", () => {
    deq(unserializeDesk(null), freshDesk()); deq(unserializeDesk("x"), freshDesk());
    const d = unserializeDesk({ scope: "weird", pageFlow: "yes", paper: 3, parts: { P1: "nope", P2: { hidden: "true" } } });
    eq(d.scope, "segment"); eq(d.pageFlow, false); eq(d.paper, null); eq(d.parts.P1, undefined); deq(d.parts.P2, { hidden: false, only: false, muted: false, solo: false });
  });
});

// pad 的状态跟着歌走（2026-10-08 Opus 5.5；user「学一下weebpaint的editorstate，键盘的状态之类的也应该持久化，比如1=几，时值. shift可以不用持久化」）
import { freshPad, PAD_UNITS } from "../src/score/desk.ts";
import { LADDER, TPQ, DEFAULT_UNIT, initInput } from "../src/score/song.ts";
describe("desk：pad 的状态", () => {
  it("每一项都写：跟谱也写 auto: true、手动写 auto: false，1= 照写", () => {
    eq(JSON.stringify(serializeDesk(freshDesk()).pad), JSON.stringify(freshPad()));
    const d = freshDesk(); d.pad = { ...freshPad(), auto: false, fifths: -3, unit: "quarter" };
    eq(JSON.stringify(serializeDesk(d).pad), JSON.stringify({ auto: false, fifths: -3, scale: "major", unit: "quarter", tuplet: 0, low: null }));
  });
  it("「1=」跟谱 / 手动只看 auto（第 16 条 16-3：原来靠有没有写 fifths 来猜，一个键带两个意思；现在不猜）", () => {
    eq(unserializeDesk({ pad: { auto: false, fifths: 0 } }).pad.auto, false, "明写手动");
    eq(unserializeDesk({ pad: { fifths: 0 } }).pad.auto, true, "老写法只写了 fifths = 不再猜成手动（auto 没写 = 模板的跟谱）");
    const old = unserializeDesk({ pad: { scale: "dorian" } }).pad; eq(old.auto, true); eq(old.scale, "dorian");
    eq(unserializeDesk(null).pad.auto, true);
  });
  it("往返：1= / 调式 / 时值 / 连音 / 音域", () => {
    const d = freshDesk(); d.pad = { auto: false, fifths: 2, scale: "yu", unit: "16th", tuplet: 3, low: 55 };
    eq(JSON.stringify(unserializeDesk(JSON.parse(JSON.stringify(serializeDesk(d)))).pad), JSON.stringify(d.pad));
  });
  it("宽容：每一项不认识 / 越界 = 那一项默认，别的照读", () => {
    const p = unserializeDesk({ pad: { fifths: 9, scale: "klingon", unit: "eighth-ish", tuplet: 4, low: 200 } }).pad;
    eq(JSON.stringify(p), JSON.stringify(freshPad()));
    eq(unserializeDesk({ pad: { fifths: 9, unit: "half" } }).pad.unit, "half");
  });
  it("时值名和 LADDER 一一对上（存名字不存下标）；默认 = 八分 = initInput", () => {
    const want = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, TPQ * 4];
    eq(JSON.stringify([...LADDER]), JSON.stringify(want)); eq(PAD_UNITS.length, LADDER.length);
    eq(PAD_UNITS[DEFAULT_UNIT], freshPad().unit); eq(initInput().inputScale, freshPad().scale); eq(initInput().inputFifths, freshPad().fifths); eq(initInput().inputAuto, freshPad().auto);
  });
});

describe("打开时的模式（v0.10.21；user「打开时记住上次的模式，成品曲不应该老是跳到音符输入，容易误触」）", () => {
  it("存在「听」= 打开还是「听」；默认「音」也写；不认识的 = 当「音」", () => {
    eq(serializeDesk({ ...freshDesk(), mode: "listen" }).mode, "listen");
    eq(serializeDesk(freshDesk()).mode, "notes", "默认也明写");
    eq(unserializeDesk({ mode: "listen" }).mode, "listen");
    eq(unserializeDesk({ mode: "lyrics" }).mode, "lyrics");
    eq(unserializeDesk({ mode: "karaoke" }).mode, "notes");
  });
});

// 乐器目录翻到哪（v0.16.6，2026-11-07 by Claude Opus 5.5；user 11-07「乐器列表记录滚动位置的话，是每个文件自己记录，不是用户设置」「即兴的滚动归 App 记，然后文件内的滚动归文件记」）
describe("desk：乐器目录翻到哪", () => {
  it("默认（按年代、全收着、在顶上）也写；写了读回来一样", () => {
    deq(serializeDesk(freshDesk()).finder, freshFinderMemo(), "新歌没碰过目录 = 照样写默认那一份");
    const d = freshDesk(); d.finder = { mode: "style", open: { style: "jazz", year: "medieval" }, scroll: 320.4, row: "jazz::Q8355", pick: "Q8355|0:40" };
    const j = serializeDesk(d);
    deq(j.finder, { mode: "style", open: { style: "jazz", year: "medieval" }, scroll: 320, row: "jazz::Q8355", pick: "Q8355|0:40" }, "滚动取整");
    deq(unserializeDesk(JSON.parse(JSON.stringify(j))).finder, { mode: "style", open: { style: "jazz", year: "medieval" }, scroll: 320, row: "jazz::Q8355", pick: "Q8355|0:40" });
  });
  it("文件里乱写的 = 那一项当默认（不认识的排序、不是数的滚动、不认识的排序键）", () => {
    deq(unserializeFinderMemo({ mode: "alphabet", open: { year: 3, bogus: "x", hs: "4" }, scroll: "lots", row: 7, pick: null }), { mode: "year", open: { hs: "4" }, scroll: 0, row: null, pick: "" });
    deq(unserializeFinderMemo(null), freshFinderMemo());
  });
});
