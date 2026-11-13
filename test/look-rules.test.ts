// 排版规则的数只在 src/look（施工单第 17 条 17-2，统筹 2026-11-13）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   守：① 规则的数（17-0 侦察表二 ①，加上 17-2 搬的时候补的几个）都在 src/look 里定义；src 里 src/look 之外没有人再定义同名的顶层常数（re-export 不算定义）。
//   ② src/render 顶层的大写常数（不含生成的 .gen.ts）每个都登记成「字形的数据」或「算法内部」；没登记 = 红，报错说清该搬进 src/look 还是来这里登记；登记了却没有了 = 也红（表不许过期）。
//   ③ 方向：src/score 不 import src/look；src/look 运行时不 import src/render（只许 import type）。
//   以后哪个数要按歌选：一次一个加进 LOOK_KEYS、由 lookOf 交出、排版从 Look 拿（见 src/look/index.ts 头上）。
//   分界线（统筹「v0.17.22 收」第 1 条）：一个音自己那一格里面 = 这种谱的字形设计，留在那种谱的目录（render/jianpu/glyphs.ts、place.ts…）；格子之间、行、纸 = 排版规则，在 src/look。
//   函数里的字面量这个守卫管不到、也不全量扫（同一条第 3 条）：新写规则的数起名字放 src/look；哪一轮要调某一块排版，先把那一块的数提出来（单独一个提交、版面底本不变）再调。
import { describe, it, eq } from "./runner.mjs";
const fs = (await import("node:fs" as string)) as { readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[]; readFileSync(u: URL, e: "utf8"): string };
const ROOT = new URL("../", import.meta.url);
const walk = (dir: string): string[] => fs.readdirSync(new URL(dir, ROOT), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : /\.ts$/.test(e.name) ? [`${dir}${e.name}`] : []));
const read = (f: string) => fs.readFileSync(new URL(f, ROOT), "utf8");

/** 一个文件顶层（行首、不缩进）const 声明的大写名字；`const A = 1, B = 2` 两个都算。注释和字符串先抹掉，括号里的逗号不算。 */
function topConsts(src: string): string[] {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/\/\/.*$/gm, "");
  const out: string[] = [], re = /^(?:export )?const /gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const parts: string[] = []; let part = "", depth = 0;
    for (let i = m.index + m[0].length; i < code.length; i++) {
      const c = code[i]!;
      if (c === "`" || c === '"' || c === "'") { part += c; for (i++; i < code.length && code[i] !== c; i++) { if (code[i] === "\\") part += code[i++]; part += code[i]; } part += c; continue; }
      if ("([{".includes(c)) depth++; else if (")]}".includes(c)) depth--;
      // 声明到「;」或者行尾（行尾那一句已经有 =、不是接着往下写的式子）为止
      if (depth === 0 && (c === ";" || (c === "\n" && /=/.test(part) && !/[=,(\[{]\s*$/.test(part) && !/^\s*[.?:|&+\-*/]/.test(code.slice(i + 1, i + 40))))) { parts.push(part); break; }
      if (depth === 0 && c === ",") { parts.push(part); part = ""; continue; }
      part += c;
    }
    for (const p of parts) { const n = /^\s*([A-Za-z_$][\w$]*)/.exec(p)?.[1]; if (n && /^[A-Z][A-Z0-9_]*$/.test(n)) out.push(n); }
  }
  return out;
}

/** ① 规则的数（人会想调、改了老歌跟着动）：只在 src/look。 */
const RULES = [
  // 纸（look/paper.ts）
  "SIZES", "STAFF_MM", "STAFF_MM_COMPACT",
  // 版式的大表（look/layout.ts）
  "PAPER_PARAMS", "ROW_PARAMS", "JIANPU_PAPER", "JIANPU_ROW_PARAMS", "JP_COZY", "JP_COMPACT", "LAST_MERGE",
  // 音距（look/spacing.ts）；NOTEHEAD_X = 17-0 表里没有、17-2 查出来补的
  "LOOSE", "DENSE", "TIGHT", "SP_DEFAULTS", "NOTEHEAD_X",
  // 纸面的骨架（look/frame.ts）；CONT_MARGIN / REFLOW_MARGIN = 原来在 src/ui/score-view.ts
  "MARGIN", "BAR_W", "TITLE_H", "PAPER_H", "PAPER_GAP", "NAME_MAX", "SCROLL_TAIL", "SYSTEM_LINE_W", "LYRIC_EDGE", "ROW_STEP", "ABBR_REF", "CTL_H", "CONT_MARGIN", "REFLOW_MARGIN",
  // 字号、歌词让路（look/text.ts）；STEM_REGULAR / BOLD_STROKE / SMALL_STEM_K 是小字补粗公式用的数，跟着样式表走
  "LYRIC_EM", "TEMPO_EM", "JP_MAIN_EM", "LYRIC_LOOK", "LYRIC_MIN_SX", "TEXT_STYLES", "GHOST_DIGIT_K", "STEM_REGULAR", "BOLD_STROKE", "SMALL_STEM_K",
  "LYRIC_SPACE", "HYPHEN_SX", "GAP_MIN", "GAP_FLOOR", "DEFAULT_GAPS",
  // 记号的摆法、单元留白（look/marks.ts）；STAFF_UNIT = 原来写在 STAFF_WIDTHS 式子里的留白
  "PIN_GAP", "PIN_MIN", "PIN_WORD", "DASH", "RAMP_DASH", "PEDAL", "KEY_LABEL_W", "CLEF_CUE", "CLEF_CUE_W", "STAFF_UNIT", "KEY_SIG", "LINE_START",
  // 先后和让路（look/order.ts）
  "SLOT", "STAFF_LANES", "JIANPU_LANES", "LEFT_CLEAR", "MAX_CLIMB",
] as const;

/** ② src/render 里留着的顶层大写常数：glyph = 字形的数据（字体给的 / 照样张量的 / 记谱的定规），algo = 算法内部（登记表、精度、没人想调）。键 = 文件 + 名字。 */
const GLYPH = "glyph", ALGO = "algo";
const KEPT: Record<string, typeof GLYPH | typeof ALGO> = {
  "chord-text.ts ACC_K": GLYPH, "chord-text.ts RISE_K": GLYPH,   // 和弦标里升降号字形的字号（× src/look 的 CHORD_ACC_SCALE，v0.17.36）、顶比大写字母高多少 = 谱头「1=♭B」那一套（jianpu/glyphs.ts ACC_GLYPH_EM / ACC_RISE ÷ DIGIT_EM），字形的数据（v0.17.34）
  "expressions.ts FOLDED_TOKEN_KINDS": ALGO,
  "frame/cell.ts ORIGIN": ALGO, "frame/furniture.ts NO_LINE_START": ALGO, "frame/lanes.ts INK_UP_TO": ALGO,
  "frame/units.ts MIN_PLAIN": ALGO, "frame/units.ts NOTATABLE": ALGO, "frame/units.ts RATIOS": ALGO,
  ...Object.fromEntries(("FS DIGIT_EM DIGIT_W BASE_Y DIGIT_TOP DIGIT_MID UL_Y0 UL_GAP UL_W DOT_R DOT_GAP DOT_STEP LOW_DOT_UNDER ACC_EM ACC_DX ACC_Y ACC_W DASH_L DASH_W DASH_Y DASH_PITCH " +
    "AUG_R AUG_DX AUG_Y COL_MIN COL_MIN_SHORT BAR_Y0 BAR_Y1 BAR_DX BAR_THIN BAR_THICK BAR_GAP BAR_W_J JP_BODY MID_TEXT_EM MID_TEXT_CH BREATH_W CHORD_GAP DIGIT_H ARP_W X_EM KIT_CHAR KIT_EM " +
    "CHORD_EM CHORD_SX CHORD_H CHORD_CH_EM CHORD_AMB_W TEN_DY MARK_GAP2 MARCATO_EM UNSTRESS_EM MARK_GAP STACC_W STACC_H STACC_STEP CHEV_W CHEV_H CHEV_STROKE CHEV_STROKE_THIN CHEV_STEP " +
    "TEN_L TEN_W TEN_STEP BREATH_EM BREATH_Y HEAD_EM GHOST_K CARET_Y0 CARET_Y1 ACC_GLYPH ACC_FAMILY_DOM FAMILY_LIGHT ACC_GLYPH_EM ACC_RISE ACC_SEP SUP_ACC_FIT HEAD_CH_EM GLYPH_INK LETTER_EM " +
    "SCRIPT_K SCRIPT_GAP SUP_DY SUB_DY SUB_DROP SUP_RISE").split(" ").map((n) => [`jianpu/glyphs.ts ${n}`, GLYPH])),   // 简谱字形照样张量的（17-0 表二 ②）
  "jianpu/measure.ts COLUMN_KIND": ALGO, "jianpu/note-cell.ts T0": ALGO, "jianpu/note-cell.ts UL_DROP": ALGO,
  "jianpu/place.ts PLACE": GLYPH, "jianpu/place.ts NOTE_SIGN_PLACE": ALGO,   // PLACE = 一个音自己那一格里记号怎么摆（统筹「v0.17.22 收」第 1 条：字形的数据）；NOTE_SIGN_PLACE = 记号 → 摆法的对照表
  "notations.ts DRAWERS": ALGO, "notations.ts GEOMETRY": ALGO, "notations.ts NOTATIONS": ALGO,
  "ornaments/index.ts PEDAL_GLYPH": GLYPH, "ornaments/index.ts PEDAL_UP_GLYPH": GLYPH,
  "signs.ts G": ALGO, "signs.ts D": ALGO, "signs.ts T": ALGO,   // 造「画成什么」的小帮手
  "signs.ts DYN_G": GLYPH, "signs.ts DYN_NAME": GLYPH, "signs.ts ART_SIGNS": GLYPH, "signs.ts DYN_SIGNS": GLYPH, "signs.ts SIGNS": GLYPH,
  "skyline.ts STEP": ALGO,
  ...Object.fromEntries("GLYPH DYN_GLYPH PERC_CLEF PERC_HEAD PERC_SMUFL W ENGRAVE STEM_UP_SE STEM_DOWN_NW FLAG_ANCHOR_UP FLAG_ANCHOR_DOWN FLAG_W".split(" ").map((n) => [`smufl.ts ${n}`, GLYPH])),
  "spacing.ts EPS": ALGO,
  ...Object.fromEntries("TOP_LINE MID_LINE BOTTOM_LINE ART_GLYPH GLYPH_BREATH DYN_GLYPH SHARP_POS FLAT_POS GLYPH_TUPLET".split(" ").map((n) => [`staff/glyphs.ts ${n}`, GLYPH])),
  "staff/measure.ts COLUMN_KIND": ALGO,
  "staff/units.ts CLEF_GLYPH": GLYPH, "staff/units.ts STAFF_WIDTHS": ALGO,   // STAFF_WIDTHS = 字形宽 + 留白（look/marks.ts STAFF_UNIT）的拼法
  "stems.ts TOP_LINE": GLYPH, "stems.ts MID_LINE": GLYPH, "stems.ts LOCAL": ALGO,   // 五线谱几条线的位置，和 staff/glyphs.ts 同一个数
  "svg.ts STANDALONE_CSS": ALGO,
  "text/baseline.ts INK_EST": GLYPH,
  "text/style.ts TEXT_FACES": GLYPH, "text/style.ts VARIANTS": ALGO, "text/style.ts DEFAULT": ALGO,
};

describe("排版规则的数只在 src/look（第 17 条 17-2）", () => {
  const src = walk("src/"), look = src.filter((f) => f.startsWith("src/look/")), outside = src.filter((f) => !f.startsWith("src/look/"));
  it("① 规则的数都在 src/look 里定义", () => {
    const defined = new Set(look.flatMap((f) => topConsts(read(f))));
    eq(RULES.filter((n) => !defined.has(n)).join("、"), "");
  });
  /** 同名不同物（不是排版的规则，只是撞了名字）：文件 + 名字 → 它是什么。 */
  const SAME_NAME: Record<string, string> = { "src/keyboard/pad.ts TIGHT": "音域旋钮窄到多少 px 不画 ⇅（键盘的界面）" };
  it("① src/look 之外没有人再定义这些名字（re-export 不算）", () => {
    const set = new Set<string>(RULES);
    eq(outside.flatMap((f) => topConsts(read(f)).filter((n) => set.has(n)).map((n) => `${f} ${n}`)).filter((k) => !(k in SAME_NAME)).join("、"), "");
  });
  it("② src/render 顶层的大写常数每个都登记了（字形的数据 / 算法内部）", () => {
    const found = walk("src/render/").filter((f) => !f.endsWith(".gen.ts")).flatMap((f) => topConsts(read(f)).map((n) => `${f.slice("src/render/".length)} ${n}`));
    const missing = found.filter((k) => !(k in KEPT));
    eq(missing.map((k) => `src/render/${k}：没登记。是排版规则的数（人会想调、改了老歌跟着动）= 搬进 src/look；是字形的数据（字体给的 / 量出来的 / 记谱定规）或算法内部（登记表、精度、没人想调）= 在 test/look-rules.test.ts 的 KEPT 里登记一行`).join("\n"), "");
    const stale = Object.keys(KEPT).filter((k) => !found.includes(k));
    eq(stale.map((k) => `src/render/${k}：登记了但已经没有了，从 KEPT 里删掉`).join("\n"), "");
  });
  it("③ src/score 不 import src/look；src/look 运行时不 import src/render（只许 import type）", () => {
    const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    eq(walk("src/score/").filter((f) => /from\s+["'][^"']*\/look\//.test(code(f))).join("、"), "");
    eq(look.filter((f) => /^\s*(import|export)\s+(?!type\b)[^;]*from\s+["'][^"']*\/render\//m.test(code(f))).join("、"), "");
  });
});
