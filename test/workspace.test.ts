// 模式 + 底座的规则表（src/app/workspace.ts）：谱面、退格、底座都只看这一张。created 2026-10-10 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { RULES, MODES, dockOf, hasKeys, type WorkspaceState } from "../src/app/workspace.ts";

const ws = (o: Partial<WorkspaceState>): WorkspaceState => ({ mode: "notes", studio: false, collapsed: false, tryout: false, ...o });
describe("模式规则表", () => {
  it("每一层只在自己的模式里点得到：音 = 拖音，词 = 歌词，符 = 记号；听 = 都不（不改谱）", () => {
    eq(MODES.join(","), "notes,lyrics,symbols,listen");
    assert(RULES.notes.noteDrag && !RULES.notes.lyrics && !RULES.notes.symbols, "音");
    assert(!RULES.lyrics.noteDrag && RULES.lyrics.lyrics && !RULES.lyrics.symbols, "词");
    assert(!RULES.symbols.noteDrag && !RULES.symbols.lyrics && RULES.symbols.symbols, "符");
    assert(!RULES.listen.edit && !RULES.listen.noteDrag && !RULES.listen.lyrics && !RULES.listen.symbols && RULES.listen.backspace === null, "听");
    eq([RULES.notes.backspace, RULES.lyrics.backspace, RULES.symbols.backspace].join(","), "notes,lyrics,symbols");
  });
  it("底座：录音室 > 试音 > 收起 > 按模式（音 = 音键、符 = 符号格、词 / 听 = 空）", () => {
    eq(dockOf(ws({})), "keys"); eq(dockOf(ws({ mode: "symbols" })), "symbols"); eq(dockOf(ws({ mode: "lyrics" })), "none"); eq(dockOf(ws({ mode: "listen" })), "none");
    eq(dockOf(ws({ collapsed: true })), "none"); eq(dockOf(ws({ mode: "lyrics", tryout: true })), "keys", "试音（乐器目录 / 乐器页）照样给音键");
    eq(dockOf(ws({ studio: true, tryout: true })), "studio", "录音室和键盘互斥、录音室优先"); eq(dockOf(ws({ mode: "listen", studio: true })), "studio", "听着也能调录音室");
    assert(hasKeys("notes") && hasKeys("symbols") && !hasKeys("lyrics") && !hasKeys("listen"));
  });
});
