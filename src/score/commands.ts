// commands.ts —— 键盘 / pad / 按钮条发来的命令 → 编辑器状态。created 2026-10-06 by Claude Opus 5.5
import type { Command } from "./keymap.ts";
import {
  type EditorState, writeDegree, writeRest, writeBar, halve, double, extendBeat, toggleDot,
  octaveCurrent, stepCurrent, alterCurrent, moveCaret, setCaret, backspace, deleteForward,
} from "./song.ts";

/** 应用一条编辑命令；play 这类宿主命令原样返回状态。 */
export function apply(st: EditorState, c: Command): EditorState {
  switch (c.k) {
    case "degree": return writeDegree(st, c.degree, c.dir);
    case "rest": return writeRest(st);
    case "bar": return writeBar(st);
    case "halve": return halve(st);
    case "double": return double(st);
    case "extend": return extendBeat(st);
    case "dot": return toggleDot(st);
    case "octave": return octaveCurrent(st, c.d);
    case "step": return stepCurrent(st, c.d);
    case "alter": return alterCurrent(st, c.d);
    case "caret": return moveCaret(st, c.d);
    case "home": return setCaret(st, 0);
    case "end": return setCaret(st, st.song.tokens.length);
    case "backspace": return backspace(st);
    case "delete": return deleteForward(st);
    case "play": return st;
  }
}
