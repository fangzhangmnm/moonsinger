// keymap.ts —— 电脑键盘 → 编辑命令。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// grill 账本：1–7 = 调里第几级（就近）；Shift+1–7 = 往上找；数字正下方 Q W E R T Y U = 往下找（user「赞」）；
//   0 休止；8 / 9 = 短 / 长（诺基亚的两个键；写的时候改下一个音的档位，有选中改选中的音）；Shift+8 = 三连音开关；
//   - = 刚写的音加一份（简谱横线）；| 或 Enter = 小节线；] / [ = ♯ / ♭ 的 Shift（点一下只管下一个音，连点两下锁住）；
//   ' / , = 上 / 下八度（小键盘 * /）；↑↓ 一级、Shift+↑↓ 半音、Alt+↑↓ 八度（有选中改选中，写的时候改刚写的那个音）；
//   ←→ 光标（有选中 = 收成光标）、Shift+←→ 扩选中、Esc = 选中光标前那个（写 → 改）、Home / End、Backspace / Delete；空格 = 播放 / 停。
// 数字和字母按物理键位（KeyboardEvent.code）认，不按打出来的字符。Ctrl / Cmd 组合一律不接（浏览器的 Ctrl+1–8 是切标签页）。

import type { Dir } from "./pitch.ts";

export type Command =
  | { k: "degree"; degree: number; dir: Dir }
  | { k: "rest" } | { k: "bar" }
  | { k: "shorter" } | { k: "longer" } | { k: "tuplet" } | { k: "extend" }
  | { k: "acc"; acc: 1 | -1 }
  | { k: "octave"; d: number } | { k: "step"; d: number } | { k: "alter"; d: number }
  | { k: "caret"; d: number } | { k: "selext"; d: number } | { k: "home" } | { k: "end" } | { k: "escape" }
  | { k: "backspace" } | { k: "delete" }
  | { k: "play" };

export interface KeyLike { key: string; code: string; shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }

const DOWN_ROW = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU"];

export function commandFor(e: KeyLike): Command | null {
  if (e.ctrlKey || e.metaKey) return null;
  const c = e.code;
  const dm = /^Digit([0-9])$/.exec(c);
  if (dm && !e.altKey) {
    const n = Number(dm[1]);
    if (n >= 1 && n <= 7) return { k: "degree", degree: n, dir: e.shiftKey ? "up" : "near" };
    if (n === 0) return e.shiftKey ? null : { k: "rest" };
    if (n === 8) return e.shiftKey ? { k: "tuplet" } : { k: "shorter" };
    if (n === 9) return e.shiftKey ? null : { k: "longer" };
  }
  // 小键盘（NumLock 开着时 key 是数字；Windows 上 Shift+小键盘会变成方向键，不接）
  const nm = /^Numpad([0-9])$/.exec(c);
  if (nm && /^[0-9]$/.test(e.key)) {
    const n = Number(nm[1]);
    if (n >= 1 && n <= 7) return { k: "degree", degree: n, dir: "near" };
    return n === 0 ? { k: "rest" } : n === 8 ? { k: "shorter" } : { k: "longer" };
  }
  if (!e.altKey && !e.shiftKey) {
    const di = DOWN_ROW.indexOf(c);
    if (di >= 0) return { k: "degree", degree: di + 1, dir: "down" };
  }
  switch (c) {
    case "Minus": case "NumpadSubtract": return e.shiftKey ? null : { k: "extend" };
    case "BracketRight": return { k: "acc", acc: 1 };
    case "BracketLeft": return { k: "acc", acc: -1 };
    case "Backslash": return e.shiftKey ? { k: "bar" } : null;
    case "Enter": case "NumpadEnter": return { k: "bar" };
    case "Quote": case "NumpadMultiply": return { k: "octave", d: 1 };
    case "Comma": case "NumpadDivide": return { k: "octave", d: -1 };
    case "ArrowUp": return e.altKey ? { k: "octave", d: 1 } : e.shiftKey ? { k: "alter", d: 1 } : { k: "step", d: 1 };
    case "ArrowDown": return e.altKey ? { k: "octave", d: -1 } : e.shiftKey ? { k: "alter", d: -1 } : { k: "step", d: -1 };
    case "ArrowLeft": return e.shiftKey ? { k: "selext", d: -1 } : { k: "caret", d: -1 };
    case "ArrowRight": return e.shiftKey ? { k: "selext", d: 1 } : { k: "caret", d: 1 };
    case "Home": return { k: "home" };
    case "End": return { k: "end" };
    case "Escape": return { k: "escape" };
    case "Backspace": return { k: "backspace" };
    case "Delete": return { k: "delete" };
    case "Space": return { k: "play" };
  }
  return null;
}
