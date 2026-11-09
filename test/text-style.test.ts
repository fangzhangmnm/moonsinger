// text-style.test.ts —— 谱上的字只有一张样式表（src/render/text-style.ts）。created 2026-11-09 by Claude Opus 5.5
//   user 11-09「这些字体也应该对齐吧，能不能深模块窄接口统一一下风格」。守三件：① 排版出来的每个字都认得出是哪一种（表里有）；
//   ② 字号就是表里那一行（歌词另有整行一起缩：八成到原大）——排版器里不再手写字号；③ styles.css 不给谱上的字定字体 / 粗细 / 斜体（只留颜色）。
import { describe, it, assert } from "./runner.mjs";
import { engrave } from "../src/render/engrave.ts";
import { TEXT_STYLES, LYRIC_LOOK, textPx, textStyleOf, textStyleCss, type TextRole } from "../src/render/text/index.ts";
import { SONGS, VIEWS, loadSong } from "./fixtures/layout/cases.ts";
const { readFileSync } = (await import("node:fs" as string)) as { readFileSync(p: URL, e: string): string };

const roleOf = (cls: string | undefined) => (cls ?? "").split(/\s+/).filter((w): w is TextRole => w in TEXT_STYLES).pop();
describe("谱上的字：一张样式表", () => {
  for (const key of Object.keys(SONGS)) for (const v of VIEWS) it(`${key} · ${v.name}：每个字都在表里、字号 = 表里那一行`, () => {
    const { song: s0, labels } = loadSong(key), sg = v.song ? v.song(s0) : s0, o = v.opts(sg, labels), L = engrave(sg, o), ts = o.textScale ?? 1;
    const bad: string[] = [];
    for (const p of L.prims) {
      if (p.t !== "text") continue;
      const role = roleOf(p.cls);
      if (!role) { bad.push(`没有样式：「${p.s}」cls=${p.cls}`); continue; }
      const want = textPx(role, L.sp, ts), got = p.size ?? want;
      const ok = Math.abs(got - (role === "lyric" ? want * (ts > 1 ? LYRIC_LOOK.compact.k : LYRIC_LOOK.cozy.k) : want)) < 1e-6;   // 歌词：字高 = 这一档固定的那个（v0.16.44 起挤了只收宽、字高不动）
      if (!ok) bad.push(`${role}「${p.s}」${got.toFixed(3)} ≠ ${want.toFixed(3)}`);
    }
    assert(bad.length === 0, `${bad.length} 处：${[...new Set(bad)].slice(0, 5).join("；")}`);
  });
  it("样式类里最后一个认得的词说了算（越往后越具体）", () => {
    assert(textStyleOf("nav-mark nav-word").italic, "nav-word 斜体");
    assert(textStyleOf("tempo tempo-word").weight === 600, "tempo-word 粗");
    assert(textStyleOf("part-name abbr empty").weight === 400, "没人上场的名字 = 细");
    assert(textStyleOf("lyric lyric-mute").face === "lyric", "歌词字体");
  });
  it("styles.css 不给谱上的字定字体 / 粗细 / 斜体（只查样式表生成的那份）", () => {
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8"), bad: string[] = [];
    for (const m of css.matchAll(/([^{}]*\.staff-svg[^{}]*)\{([^}]*)\}/g)) {
      const sel = m[1]!.trim(), body = m[2]!;
      const hitsText = Object.keys(TEXT_STYLES).some((k) => new RegExp(`\\.${k}(?![\\w-])`).test(sel)) || /\.staff-svg\s+text\s*$/.test(sel);
      if (hitsText && /font-(family|weight|style)/.test(body)) bad.push(sel);
    }
    assert(bad.length === 0, `这些规则还在定字体：${bad.join(" | ")}`);
    const gen = textStyleCss();
    assert(/text\.tempo-word:not\(\[font-family\]\)\{[^}]*font-weight:600/.test(gen), "生成的样式表里有速度字的粗细");
    assert(!/text(\.[\w-]+)?\{/.test(gen), "每条规则都带 :not([font-family])——不许盖掉乐谱字形（字形的 <text> 带 font-family 属性）");
  });
});
