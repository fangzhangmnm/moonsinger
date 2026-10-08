// keys.ts —— 键盘映射：一张表 = 唯一真理源。按键分发（route）、文档 docs/keys.md（renderKeysDoc → scripts/gen-keys-doc.mjs）、
// pad 按钮提示里的键名（hint）都读它。加 / 改快捷键只改 BINDINGS 这一张表。created 2026-10-07 by Claude Opus 5.5
// user「键盘映射参考weebpaint做一下深模块以后readme可以自动生成，想一下如何对不同模式进行路由」
//   参考 = WeebPaint src/input.ts 的 KEYBOARD_SHORTCUTS（一张表 + when 守卫 + 菜单面板 / 文档从表生成）。
//   和它的差别：文档生成直接 import 这张表（不靠正则抽源码文本）；模式不写成 when 函数，而是表里的一列一列。
//
// 路由 = 「现在键盘归谁」（Where，宿主按谁在最上面算好传进来）：
//   导出面板 sheet > 记号框 mark > 歌词框 lyric > 谱面；谱面再分 写 write（光标）/ 改 edit（选中）/ 弹 impro（即兴开关开着）。
//   同一个键在不同模式下做不同的事 = 同一行里不同的列（does[where]）；没写的列 = 这个键在那里不管（文本框里就照常打字）。
//   「弹」只改变音符键（只唱不写，user「即兴做成 pad 上的一个开关（按住时只唱不写）」）：弹的那一列没写的键，照写 / 改走。
// 只认物理键位（KeyboardEvent.code），不认打出来的字（换输入法 / 键盘布局不乱）；Ctrl / Cmd 组合只接表里标了 mod 的（存 / 导出 / 打开，2026-10-07 无地逃生口），
//   其余一律不接（浏览器的，Ctrl+1–8 是切标签页）；
// 输入法正在拼（isComposing）的时候一律不接（拼音、假名输入法不被打断）。

import type { Command } from "../score/commands.ts";
import type { Dir } from "../score/pitch.ts";

export type Mode = "write" | "edit" | "impro";
export type Where = Mode | "lyric" | "mark" | "sheet";

/** 一个按键：物理键位 + Shift / Alt / mod（Windows·Linux 的 Ctrl 或 Mac 的 ⌘）（必须完全一致）。 */
export interface Chord { code: string; shift?: boolean; alt?: boolean; mod?: boolean }

/** 路由的结果：宿主照着做。 */
export type Action =
  | { k: "cmd"; cmd: Command }                      // 编辑命令（score/commands.ts apply）
  | { k: "audition"; degree: number; dir: Dir }     // 弹：只唱这一级，不写
  | { k: "play" } | { k: "impro" }
  | { k: "file"; a: "open" | "save" | "export" }   // 无地逃生口（打开 / 存 .mxl / 导出 hub；另存为住导出里，user 2026-08-20「另存为也变成导出」）
  | { k: "clip"; a: "copy" | "cut" | "paste" | "all" }   // 选区条的键盘入口（2026-10-08；user「快捷键其实现在我都没用过」，触屏优先）
  | { k: "lyric"; a: "commit" | "cancel" | "next" | "prev" | "hyphen" | "back" }
  | { k: "mark"; a: "commit" | "cancel" }
  | { k: "sheet"; a: "close" };

export interface Binding {
  id: string;
  keys: Chord[];
  show?: string;                                     // 文档里键位的写法（不写 = 由 keys 拼）
  group: string;                                     // 文档分组
  does: Partial<Record<Where, string>>;              // 每个场合 / 模式下做什么（文档的格子）；没写 = 不管
  act: (i: number, where: Where) => Action;          // i = 命中的是 keys 里第几个
  sound?: boolean;                                   // 按住响、松开停（keyup 要停声）
}

const range = (codes: string[], m: Omit<Chord, "code"> = {}) => codes.map((code) => ({ code, ...m }));
const DIGITS = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7"];
const NUMPAD = ["Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7"];
const DOWN_ROW = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU"];
const cmd = (c: Command) => (): Action => ({ k: "cmd", cmd: c });
/** 音符键：写 / 改 = 编辑命令；弹 = 只唱。 */
const degree = (dir: Dir) => (i: number, where: Where): Action =>
  where === "impro" ? { k: "audition", degree: (i % 7) + 1, dir } : { k: "cmd", cmd: { k: "degree", degree: (i % 7) + 1, dir } };

// grill 账本 Q/UX-1/UX-2 的键位；user 原话在账本里（1–7 就近、Shift 往上、QWERTYU 往下「赞」、0 休止、8 / 9 诺基亚短长、- 简谱横线……）
export const BINDINGS: Binding[] = [
  // ── 写音 ──
  { id: "degree.near", group: "写音", keys: [...range(DIGITS), ...range(NUMPAD)], show: "1–7（小键盘也行）", sound: true, act: degree("near"),
    does: { write: "写一个音：调里第几级，落在离上一个音最近处", edit: "把选中的第一个音改成这一级，选中跳到下一个音", impro: "只唱不写" } },
  { id: "degree.up", group: "写音", keys: range(DIGITS, { shift: true }), show: "Shift+1–7", sound: true, act: degree("up"),
    does: { write: "同上，往上找", edit: "同上，往上找", impro: "只唱不写（往上找）" } },
  { id: "degree.down", group: "写音", keys: range(DOWN_ROW), show: "Q W E R T Y U", sound: true, act: degree("down"),
    does: { write: "同上，往下找（数字正下方那一排）", edit: "同上，往下找", impro: "只唱不写（往下找）" } },
  { id: "rest", group: "写音", keys: [{ code: "Digit0" }, { code: "Numpad0" }], act: cmd({ k: "rest" }),
    does: { write: "休止" } },
  { id: "bar", group: "写音", keys: [{ code: "Enter" }, { code: "NumpadEnter" }, { code: "Backslash", shift: true }], show: "Enter / |", act: cmd({ k: "bar" }),
    does: { write: "小节线", edit: "在选中后面插小节线" } },
  // ── 时值 ──
  { id: "shorter", group: "时值", keys: [{ code: "Digit8" }, { code: "Numpad8" }], act: cmd({ k: "shorter" }),
    does: { write: "短：下一个音的时值减半（到三十二分为止）", edit: "选中的音减半" } },
  { id: "longer", group: "时值", keys: [{ code: "Digit9" }, { code: "Numpad9" }], act: cmd({ k: "longer" }),
    does: { write: "长：下一个音的时值加倍（到全音符为止）", edit: "选中的音加倍" } },
  { id: "tuplet", group: "时值", keys: [{ code: "Digit8", shift: true }], act: cmd({ k: "tuplet" }),
    does: { write: "三连音开 / 关（下一个音起）", edit: "三连音开 / 关（下一个音起）" } },
  { id: "extend", group: "时值", keys: [{ code: "Minus" }, { code: "NumpadSubtract" }], act: cmd({ k: "extend" }),
    does: { write: "刚写的音加一份（简谱的横线）；隔着小节线 = 新开一个连着的同音", edit: "选中的音各加一份" } },
  // ── 音高 ──
  { id: "sharp", group: "音高", keys: [{ code: "BracketRight" }], act: cmd({ k: "acc", acc: 1 }),
    does: { write: "♯：点一下管下一个音，连点两下锁住，再点解开", edit: "选中的音升半音" } },
  { id: "flat", group: "音高", keys: [{ code: "BracketLeft" }], act: cmd({ k: "acc", acc: -1 }),
    does: { write: "♭：同上", edit: "选中的音降半音" } },
  { id: "octave.up", group: "音高", keys: [{ code: "Quote" }, { code: "NumpadMultiply" }, { code: "ArrowUp", alt: true }], act: cmd({ k: "octave", d: 1 }),
    does: { write: "光标前那个音高八度", edit: "选中的音高八度" } },
  { id: "octave.down", group: "音高", keys: [{ code: "Comma" }, { code: "NumpadDivide" }, { code: "ArrowDown", alt: true }], act: cmd({ k: "octave", d: -1 }),
    does: { write: "光标前那个音低八度", edit: "选中的音低八度" } },
  { id: "step.up", group: "音高", keys: [{ code: "ArrowUp" }], act: cmd({ k: "step", d: 1 }), does: { write: "光标前那个音往上一级", edit: "选中的音往上一级" } },
  { id: "step.down", group: "音高", keys: [{ code: "ArrowDown" }], act: cmd({ k: "step", d: -1 }), does: { write: "光标前那个音往下一级", edit: "选中的音往下一级" } },
  { id: "alter.up", group: "音高", keys: [{ code: "ArrowUp", shift: true }], act: cmd({ k: "alter", d: 1 }), does: { write: "光标前那个音升半音（按调拼写：C 大调 E → F）", edit: "选中的音整体升半音（按调拼写）" } },
  { id: "alter.down", group: "音高", keys: [{ code: "ArrowDown", shift: true }], act: cmd({ k: "alter", d: -1 }), does: { write: "光标前那个音降半音（按调拼写）", edit: "选中的音整体降半音（按调拼写）" } },
  // ── 光标与选中 ──
  { id: "left", group: "光标与选中", keys: [{ code: "ArrowLeft" }], act: cmd({ k: "caret", d: -1 }), does: { write: "光标左移", edit: "收成选中左边的光标（回到写）" } },
  { id: "right", group: "光标与选中", keys: [{ code: "ArrowRight" }], act: cmd({ k: "caret", d: 1 }), does: { write: "光标右移", edit: "收成选中右边的光标（回到写）" } },
  { id: "sel.left", group: "光标与选中", keys: [{ code: "ArrowLeft", shift: true }], act: cmd({ k: "selext", d: -1 }), does: { write: "选中光标前那个（写 → 改）", edit: "选中往左扩一个" } },
  { id: "sel.right", group: "光标与选中", keys: [{ code: "ArrowRight", shift: true }], act: cmd({ k: "selext", d: 1 }), does: { write: "选中光标后那个（写 → 改）", edit: "选中往右扩一个" } },
  { id: "sel.home", group: "光标与选中", keys: [{ code: "Home", shift: true }], act: cmd({ k: "seledge", d: -1 }), does: { write: "从光标选到开头（写 → 改）", edit: "选到开头" } },
  { id: "sel.end", group: "光标与选中", keys: [{ code: "End", shift: true }], act: cmd({ k: "seledge", d: 1 }), does: { write: "从光标选到末尾（Home 再 Shift+End = 全选）", edit: "选到末尾" } },
  { id: "home", group: "光标与选中", keys: [{ code: "Home" }], act: cmd({ k: "home" }), does: { write: "光标到开头", edit: "光标到开头" } },
  { id: "end", group: "光标与选中", keys: [{ code: "End" }], act: cmd({ k: "end" }), does: { write: "光标到末尾", edit: "光标到末尾" } },
  { id: "escape", group: "光标与选中", keys: [{ code: "Escape" }], act: (_i, w) => (w === "lyric" ? { k: "lyric", a: "cancel" } : w === "mark" ? { k: "mark", a: "cancel" } : w === "sheet" ? { k: "sheet", a: "close" } : { k: "cmd", cmd: { k: "escape" } }),
    does: { write: "选中光标前那个（写 → 改）", lyric: "收起，不贴框里的字", mark: "收起，不改（刚插的记号 = 撤掉）", sheet: "关掉面板" } },
  { id: "backspace", group: "光标与选中", keys: [{ code: "Backspace" }], act: (_i, w) => (w === "lyric" ? { k: "lyric", a: "back" } : { k: "cmd", cmd: { k: "backspace" } }),
    does: { write: "撤回本次输入的最后一笔（「−」、音）；挪过光标后 = 删光标前一个", edit: "删掉选中", lyric: "框是空的：回到上一个音，把它的字拿出来接着删" } },
  { id: "delete", group: "光标与选中", keys: [{ code: "Delete" }], act: cmd({ k: "delete" }), does: { write: "删光标后一个", edit: "删掉选中" } },
  // ── 播放 ──
  { id: "play", group: "播放", keys: [{ code: "Space" }], act: () => ({ k: "play" }), does: { write: "月读唱 / 停", edit: "月读唱 / 停" } },
  { id: "impro", group: "播放", keys: [{ code: "Backquote" }], show: "`", act: () => ({ k: "impro" }), does: { write: "「弹」开 / 关（音符键只唱不写）", edit: "「弹」开 / 关", impro: "「弹」关" } },
  // ── 文件（无地逃生口：.mxl；user 2026-10-07「先按照无地规范导入导出做逃生口」）。新建只在菜单里（Ctrl+N 浏览器不让拦） ──
  { id: "file.save", group: "文件", keys: [{ code: "KeyS", mod: true }], show: "Ctrl / ⌘+S", act: () => ({ k: "file", a: "save" }),
    does: { write: "存（存回打开的那个文件；还没有家 = 问存到哪 / iPad 下载）", edit: "存", impro: "存", lyric: "存", mark: "存" } },
  { id: "file.export", group: "文件", keys: [{ code: "KeyS", mod: true, shift: true }], show: "Ctrl / ⌘+Shift+S", act: () => ({ k: "file", a: "export" }),
    does: { write: "导出…（歌声 mp3 / 存一份 .mxl 副本；原来的「另存为」住这里）", edit: "导出…", impro: "导出…", lyric: "导出…", mark: "导出…" } },
  { id: "file.open", group: "文件", keys: [{ code: "KeyO", mod: true }], show: "Ctrl / ⌘+O", act: () => ({ k: "file", a: "open" }),
    does: { write: "打开…（.mxl / .musicxml）", edit: "打开…", impro: "打开…", lyric: "打开…", mark: "打开…" } },
  // ── 选区（2026-10-08 改的手感：长按选、选区条上的动词；这里只是键盘入口） ──
  { id: "clip.copy", group: "选区", keys: [{ code: "KeyC", mod: true }], show: "Ctrl / ⌘+C", act: () => ({ k: "clip", a: "copy" }), does: { edit: "复制选中（app 内原样 + 系统剪贴板一行简谱）" } },
  { id: "clip.cut", group: "选区", keys: [{ code: "KeyX", mod: true }], show: "Ctrl / ⌘+X", act: () => ({ k: "clip", a: "cut" }), does: { edit: "剪切选中" } },
  { id: "clip.paste", group: "选区", keys: [{ code: "KeyV", mod: true }], show: "Ctrl / ⌘+V", act: () => ({ k: "clip", a: "paste" }), does: { write: "贴在光标处（app 内复制过的；没有就试着读系统剪贴板里的简谱文字）", edit: "贴 = 替换选中" } },
  { id: "clip.all", group: "选区", keys: [{ code: "KeyA", mod: true }], show: "Ctrl / ⌘+A", act: () => ({ k: "clip", a: "all" }), does: { write: "全选（这张纸上这个声部）", edit: "全选" } },
  // ── 歌词框（点谱下面打开；输入法照常用，中文 / 日文选定一段字就按字往后贴） ──
  { id: "lyric.next", group: "歌词框", keys: [{ code: "Space" }, { code: "Tab" }], show: "空格 / Tab", act: () => ({ k: "lyric", a: "next" }),
    does: { lyric: "这个词完了：贴上、跳下一个音（框是空的 = 只跳）" } },
  { id: "lyric.prev", group: "歌词框", keys: [{ code: "Tab", shift: true }], act: () => ({ k: "lyric", a: "prev" }), does: { lyric: "回上一个音" } },
  { id: "lyric.hyphen", group: "歌词框", keys: [{ code: "Minus" }], show: "-", act: () => ({ k: "lyric", a: "hyphen" }),
    does: { lyric: "跟在字母后面：音节完了、词没完（谱上画连字符），跳下一个音" } },
  { id: "lyric.commit", group: "歌词框", keys: [{ code: "Enter" }, { code: "NumpadEnter" }], act: () => ({ k: "lyric", a: "commit" }), does: { lyric: "贴上、收起" } },
  // ── 记号框（点谱上的调号 / 拍号 / 速度打开） ──
  { id: "mark.commit", group: "记号框", keys: [{ code: "Enter" }, { code: "NumpadEnter" }], act: () => ({ k: "mark", a: "commit" }), does: { mark: "按框里的字改（1=D / Bb / 2# · 3/4 · 90 或 Andante）、收起" } },
];

/** 键名（文档 / 提示用）。 */
const NAME: Record<string, string> = {
  Minus: "-", BracketRight: "]", BracketLeft: "[", Backslash: "\\", Quote: "'", Comma: ",", Backquote: "`", Space: "空格",
  Enter: "Enter", NumpadEnter: "小键盘 Enter", Escape: "Esc", Backspace: "退格", Delete: "Delete", Home: "Home", End: "End", Tab: "Tab",
  ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
  NumpadSubtract: "小键盘 -", NumpadMultiply: "小键盘 *", NumpadDivide: "小键盘 /",
};
export function chordName(c: Chord): string {
  const base = NAME[c.code] ?? c.code.replace(/^Digit/, "").replace(/^Key/, "").replace(/^Numpad(\d)$/, "小键盘 $1");
  return `${c.mod ? "Ctrl / ⌘+" : ""}${c.alt ? "Alt+" : ""}${c.shift ? "Shift+" : ""}${base}`;
}
/** pad 按钮提示用：某条映射的第一个键（没有 = ""）。 */
export function hint(id: string): string {
  const b = BINDINGS.find((x) => x.id === id);
  return b ? (b.show?.split(" / ")[0] ?? chordName(b.keys[0])) : "";
}

export interface KeyLike { code: string; key: string; shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean; isComposing?: boolean }

function matches(c: Chord, e: KeyLike): boolean {
  if (c.code !== e.code || !!c.shift !== e.shiftKey || !!c.alt !== e.altKey || !!c.mod !== (e.ctrlKey || e.metaKey)) return false;
  // 小键盘数字：NumLock 关着时它们是方向键（key 不是数字），不接
  if (/^Numpad\d$/.test(c.code) && !/^\d$/.test(e.key)) return false;
  return true;
}

/** 路由：这个按键在 where 该做什么（null = 不管，让浏览器 / 文本框照常）。弹没写的键照写 / 改走（base）。 */
export function route(e: KeyLike, where: Where, base: "write" | "edit" = "write"): Action | null {
  if (e.isComposing) return null;   // Ctrl / ⌘ 组合：只有表里标了 mod 的键能命中（matches 里比），其余照旧交给浏览器
  const tryWhere = (w: Where): Action | null => {
    for (const b of BINDINGS) {
      if (!b.does[w]) continue;
      const i = b.keys.findIndex((c) => matches(c, e));
      if (i >= 0) return b.act(i, w);
    }
    return null;
  };
  return tryWhere(where) ?? (where === "impro" ? tryWhere(base) : null);
}
/** 松开的这个键是不是「按住响」的键（谱面上：写 / 改 / 弹）。 */
export function isSoundKey(e: KeyLike): boolean {
  return BINDINGS.some((b) => b.sound && b.keys.some((c) => c.code === e.code));
}

// ── 文档（scripts/gen-keys-doc.mjs 写成 docs/keys.md；test/keys.test.ts 守着它不过期） ─────────────
const WHERE_TITLE: Record<"lyric" | "mark" | "sheet", string> = { lyric: "歌词框", mark: "记号框", sheet: "面板（导出好了）" };
const keysOf = (b: Binding) => b.show ?? b.keys.map(chordName).join(" / ");
/** 表格里的键：代码样式；反引号键用双反引号包；「|」在表格里即使在代码里也要转义（GFM）。 */
const code = (k: string) => (k.includes("`") ? `\`\` ${k} \`\`` : `\`${k}\``).replace(/\|/g, "\\|");
const cell = (s: string | undefined) => (s ?? "—").replace(/\|/g, "\\|");

export function renderKeysDoc(): string {
  let md = `<!-- 自动生成：node scripts/gen-keys-doc.mjs 从 src/input/keys.ts 的 BINDINGS 生成——别手改，改表再重跑（测试守着它不过期）。 -->\n\n`;
  md += `# 键盘\n\n> 生成自 \`src/input/keys.ts\`\n\n`;
  md += `谱面上有三种状态：**写**（光标，打的音插在光标处）、**改**（选中了一段，打的音覆盖选中）、**弹**（「弹」开着：音符键只唱不写，其余键照写 / 改）。\n`;
  md += `按物理键位认（换输入法 / 键盘布局不乱）；Ctrl / ⌘ 组合只接存 / 导出 / 打开，其余交给浏览器。\n\n`;
  const score = BINDINGS.filter((b) => b.does.write || b.does.edit || b.does.impro);
  const groups = [...new Set(score.map((b) => b.group))];
  for (const g of groups) {
    md += `## ${g}\n\n| 键 | 写 | 改 | 弹 |\n|---|---|---|---|\n`;
    for (const b of score.filter((x) => x.group === g)) md += `| ${code(keysOf(b))} | ${cell(b.does.write)} | ${cell(b.does.edit)} | ${b.does.impro ? cell(b.does.impro) : "照常"} |\n`;
    md += "\n";
  }
  for (const w of ["lyric", "mark", "sheet"] as const) {
    const rows = BINDINGS.filter((b) => b.does[w]);
    if (!rows.length) continue;
    md += `## ${WHERE_TITLE[w]}\n\n| 键 | 做什么 |\n|---|---|\n`;
    for (const b of rows) md += `| ${code(keysOf(b))} | ${cell(b.does[w])} |\n`;
    md += "\n";
  }
  return md;
}
