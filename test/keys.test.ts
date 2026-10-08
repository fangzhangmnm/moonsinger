// 键盘映射（src/input/keys.ts）：路由矩阵 + 表的结构守卫 + 文档不过期。created 2026-10-07 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
// 仓里不装 @types/node：node:fs 走动态 import（类型当 any）
const { readFileSync } = (await import("node:fs" as string)) as { readFileSync(u: URL, enc: "utf8"): string };
import { BINDINGS, route, isSoundKey, chordName, renderKeysDoc, type Where, type KeyLike } from "../src/input/keys.ts";

const K = (code: string, m: Partial<KeyLike> = {}): KeyLike => ({ code, key: m.key ?? "x", shiftKey: false, altKey: false, ctrlKey: false, metaKey: false, ...m });
const r = (k: KeyLike, w: Where, base: "write" | "edit" = "write") => JSON.stringify(route(k, w, base));

describe("键盘路由", () => {
  it("同一个键，写 / 改 / 弹各做各的", () => {
    eq(r(K("Digit3"), "write"), '{"k":"cmd","cmd":{"k":"degree","degree":3,"dir":"near"}}');
    eq(r(K("Digit3"), "edit"), '{"k":"cmd","cmd":{"k":"degree","degree":3,"dir":"near"}}');
    eq(r(K("Digit3"), "impro"), '{"k":"audition","degree":3,"dir":"near"}');
    eq(r(K("KeyE"), "impro"), '{"k":"audition","degree":3,"dir":"down"}');
    eq(r(K("Digit3", { shiftKey: true }), "write"), '{"k":"cmd","cmd":{"k":"degree","degree":3,"dir":"up"}}');
  });
  it("弹没写的键照写 / 改走；改没写的键不管；0 在改模式 = 整组休止（2026-10-08 user「其他键用C」）", () => {
    eq(r(K("Digit0"), "impro"), '{"k":"cmd","cmd":{"k":"rest"}}');
    eq(r(K("Digit0"), "edit"), '{"k":"cmd","cmd":{"k":"rest"}}');
    const noEdit = BINDINGS.find((b) => b.does.write && !b.does.edit && !b.keys[0].shift && !b.keys[0].mod)!;   // 表里没写改模式的键：改模式不管
    eq(r(K(noEdit.keys[0].code), "edit"), "null");
    eq(r(K("ArrowLeft"), "impro", "edit"), '{"k":"cmd","cmd":{"k":"caret","d":-1}}');
  });
  it("文本框里：表里写了的键归框，没写的照常打字", () => {
    eq(r(K("Space"), "lyric"), '{"k":"lyric","a":"next"}'); eq(r(K("Space"), "write"), '{"k":"play"}');
    eq(r(K("Digit3"), "lyric"), "null"); eq(r(K("Digit3"), "mark"), "null");
    eq(r(K("Escape"), "mark"), '{"k":"mark","a":"cancel"}'); eq(r(K("Escape"), "sheet"), '{"k":"sheet","a":"close"}');
    eq(r(K("Enter"), "lyric"), '{"k":"lyric","a":"commit"}'); eq(r(K("Enter"), "write"), '{"k":"cmd","cmd":{"k":"bar"}}');
  });
  it("Ctrl / Cmd 组合、输入法正在拼、NumLock 关着的小键盘：一律不接", () => {
    eq(r(K("Digit1", { ctrlKey: true }), "write"), "null"); eq(r(K("Space", { isComposing: true }), "lyric"), "null");
    eq(r(K("KeyS", { ctrlKey: true }), "write"), '{"k":"file","a":"save"}'); eq(r(K("KeyS", { metaKey: true }), "lyric"), '{"k":"file","a":"save"}');
    eq(r(K("KeyS", { ctrlKey: true, shiftKey: true }), "edit"), '{"k":"file","a":"export"}'); eq(r(K("KeyO", { ctrlKey: true }), "mark"), '{"k":"file","a":"open"}');
    eq(r(K("KeyS"), "write"), "null"); eq(r(K("KeyT", { ctrlKey: true }), "write"), "null");   // 不带 Ctrl 的 S、别的 Ctrl 组合都不接
    eq(r(K("Numpad1", { key: "End" }), "write"), "null"); eq(r(K("Numpad1", { key: "1" }), "write"), '{"k":"cmd","cmd":{"k":"degree","degree":1,"dir":"near"}}');
  });
  it("按住响的键：松开要停声", () => { eq(isSoundKey(K("KeyQ")), true); eq(isSoundKey(K("Digit8")), false); });
});

describe("键盘表的结构", () => {
  it("id 不重复", () => { eq(new Set(BINDINGS.map((b) => b.id)).size, BINDINGS.length); });
  it("同一个场合 / 模式里，一个键只归一行（不然路由取决于表的顺序）", () => {
    for (const w of ["write", "edit", "impro", "lyric", "mark", "sheet"] as const) {
      const seen = new Map<string, string>();
      for (const b of BINDINGS) {
        if (!b.does[w]) continue;
        for (const c of b.keys) { const n = chordName(c); eq(seen.get(n) ?? b.id, b.id, `${w} 里 ${n} 被 ${seen.get(n)} 和 ${b.id} 抢`); seen.set(n, b.id); }
      }
    }
  });
  it("docs/keys.md 是最新的（不是就跑 node scripts/gen-keys-doc.mjs）", () => {
    eq(readFileSync(new URL("../docs/keys.md", import.meta.url), "utf8") === renderKeysDoc(), true);
  });
});
