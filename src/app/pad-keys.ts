// pad-keys.ts —— pad 发出来的「按键 id」→ 编辑命令 / 插记号 / 开小菜单（翻译层的一半：键盘只发按键，它不懂谱；锁 × 光标 × 选区的那一半在 main.ts 的 pad 宿主里）。
// created 2026-10-15 by Claude Fable 5.1（键盘模块刀 2；原来是 pad.ts act() 和写字键那几行里的分支，逐条搬来）。
//   user 2026-10-14「然后出来的也是按键而不是和弦，翻译成音符输入别的人管。键盘只管交互状态机，它不懂音乐」。
import type { Command } from "../score/commands.ts";
import type { Art, Dyn } from "../score/song.ts";
import type { Mark } from "../score/perform.ts";

export type PadKeyAction =
  | { kind: "cmd"; cmd: Command }
  | { kind: "mark"; mark: "key" | "time" | "tempo" }                   // 插调号 / 拍号 / 速度（在光标处，开记号框）
  | { kind: "menu"; menu: "groove" | "repeat" | "clef" | "ottava" };    // 开小菜单（风格 / 反复 / 谱号 / 八度线）

const cmd = (c: Command): PadKeyAction => ({ kind: "cmd", cmd: c });
/** 一个按键 id 该做什么；不认识的 = null（键盘加了格子、这里没接 = test/pad-keys.test.ts 红）。mods.ramp = 「渐到」亮着（只对力度有意义）。 */
export function padKeyAction(id: string, mods: { ramp: boolean } = { ramp: false }): PadKeyAction | null {
  const m = /^caret:(-?1)$/.exec(id); if (m) return cmd({ k: "caret", d: Number(m[1]) });
  switch (id) {
    case "rest": case "bar": case "extend": case "backspace": case "symBackspace": case "staff": case "phrase": case "slur": return cmd({ k: id } as Command);
    case "key": case "time": case "tempo": return { kind: "mark", mark: id };
    case "groove": case "repeat": case "clef": case "ottava": return { kind: "menu", menu: id };
    case "wedge:cresc": return cmd({ k: "wedge", w: "cresc" });
    case "wedge:dim": return cmd({ k: "wedge", w: "dim" });
    case "dyn:ramp": return null;   // 修饰键，键盘自己管（latch）
  }
  if (id.startsWith("art:")) return cmd({ k: "art", a: id.slice(4) as Art });
  if (id.startsWith("inhale:")) return cmd({ k: "inhale", v: id.slice(7) as "soft" | "big" });
  if (id.startsWith("swell:")) return cmd({ k: "swell", w: id.slice(6) as "<" | ">" | "<>" });
  if (id.startsWith("dyn:")) return cmd({ k: "dyn", v: id.slice(4) as Dyn, ...(mods.ramp ? { ramp: true } : {}) });
  return null;
}
/** 这个按键写的是台上那位要「认」的哪种记号（perform.ts 的 Mark；符号格画灰 + 「不认」提示按它查）；不是记号 = null。 */
export function markOfKey(id: string): Mark | null {
  if (id.startsWith("art:")) return id.slice(4) as Mark;
  if (id === "slur") return "slur";
  if (id === "swell:>") return "swellFade";
  if (id.startsWith("swell:")) return "swellGrow";
  if (id.startsWith("inhale:")) return "inhale";
  return null;
}
