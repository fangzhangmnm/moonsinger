// commands.ts —— 键盘 / pad / 按钮条发来的命令 → 编辑器状态。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 键盘怎么变成命令 = src/input/keys.ts（一张表）；这里只管命令做什么。
import type { Dir } from "./pitch.ts";
import {
  type EditorState, writeDegree, writeRest, writeBar, shorter, longer, setTuplet, extend, tapAcc,
  octaveTarget, stepTarget, alterTarget, moveCaret, extendSelection, setCaret, escape, backspace, deleteForward,
  transposeSel, modulateSel, selectToEdge,
} from "./song.ts";

export type Command =
  | { k: "degree"; degree: number; dir: Dir }
  | { k: "rest" } | { k: "bar" }
  | { k: "shorter" } | { k: "longer" } | { k: "tuplet" } | { k: "extend" }
  | { k: "acc"; acc: 1 | -1 }
  | { k: "octave"; d: number } | { k: "step"; d: number } | { k: "alter"; d: number }
  | { k: "caret"; d: number } | { k: "selext"; d: number } | { k: "home" } | { k: "end" } | { k: "escape" }
  | { k: "backspace" } | { k: "delete" }
  | { k: "transpose"; semis: number } | { k: "modulate"; fifths: number } | { k: "seledge"; d: -1 | 1 };

/** 应用一条编辑命令。now = 判 Shift 连点用的时刻（ms）。 */
export function apply(st: EditorState, c: Command, now = Date.now()): EditorState {
  switch (c.k) {
    case "degree": return writeDegree(st, c.degree, c.dir);
    case "rest": return writeRest(st);
    case "bar": return writeBar(st);
    case "shorter": return shorter(st);
    case "longer": return longer(st);
    case "tuplet": return setTuplet(st, st.input.tuplet ? 0 : 3);
    case "extend": return extend(st);
    case "acc": return tapAcc(st, c.acc, now);
    case "octave": return octaveTarget(st, c.d);
    case "step": return stepTarget(st, c.d);
    case "alter": return alterTarget(st, c.d);
    case "caret": return moveCaret(st, c.d);
    case "selext": return extendSelection(st, c.d);
    case "home": return setCaret(st, 0);   // setCaret 自己夹到谱头后面
    case "end": return setCaret(st, st.song.tokens.length);
    case "escape": return escape(st);
    case "backspace": return backspace(st);
    case "delete": return deleteForward(st);
    case "transpose": return transposeSel(st, c.semis);
    case "modulate": return modulateSel(st, c.fifths);
    case "seledge": return selectToEdge(st, c.d);
  }
}
