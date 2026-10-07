// commands.ts —— 键盘 / pad / 按钮条发来的命令 → 编辑器状态。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
import type { Command } from "./keymap.ts";
import {
  type EditorState, writeDegree, writeRest, writeBar, shorter, longer, setTuplet, extend, tapAcc,
  octaveTarget, stepTarget, alterTarget, moveCaret, extendSelection, setCaret, escape, backspace, deleteForward,
} from "./song.ts";

/** 应用一条编辑命令；play 这类宿主命令原样返回状态。now = 判 Shift 连点用的时刻（ms）。 */
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
    case "home": return setCaret(st, 0);
    case "end": return setCaret(st, st.song.tokens.length);
    case "escape": return escape(st);
    case "backspace": return backspace(st);
    case "delete": return deleteForward(st);
    case "play": return st;
  }
}
