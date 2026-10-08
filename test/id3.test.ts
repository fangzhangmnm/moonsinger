// mp3 的 ID3v2.3 标签（纯函数）。created 2026-10-08 by Claude Opus 5.5（user「mp3能自动生成license吗」）。
// 按规格自己读回来核：头、同步安全长度、帧 id / 长度、UTF-16 文字、COMM 结构、WCOP 只收网址。
import { describe, it, eq, assert } from "./runner.mjs";
import { id3v2, firstUrl } from "../src/export/id3.ts";

function parse(b: Uint8Array): { size: number; frames: Record<string, Uint8Array> } {
  assert(String.fromCharCode(b[0], b[1], b[2]) === "ID3" && b[3] === 3 && b[4] === 0, "头不对");
  const size = (b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9];
  const frames: Record<string, Uint8Array> = {};
  for (let o = 10; o < 10 + size;) {
    const id = String.fromCharCode(...b.slice(o, o + 4)), n = (b[o + 4] << 24) | (b[o + 5] << 16) | (b[o + 6] << 8) | b[o + 7];
    frames[id] = b.slice(o + 10, o + 10 + n); o += 10 + n;
  }
  return { size, frames };
}
const utf16 = (b: Uint8Array) => { assert(b[0] === 0xff && b[1] === 0xfe, "没有 BOM"); let s = ""; for (let i = 2; i + 1 < b.length; i += 2) s += String.fromCharCode(b[i] | (b[i + 1] << 8)); return s; };

describe("mp3 标签（id3.ts）", () => {
  it("中文的歌名 / 作者 / 许可 / 署名都能原样读回来", () => {
    const t = id3v2({ title: "うさぎ（兔子）", artist: "某某 词曲", copyright: "CC BY 4.0 https://creativecommons.org/licenses/by/4.0/", copyrightUrl: "https://creativecommons.org/licenses/by/4.0/", comment: "月读 — 条款\n本ソフトウェア…", software: "MoonSinger v0.6.11" });
    const { size, frames } = parse(t);
    eq(size, t.length - 10, "同步安全长度 = 帧的总长");
    eq(frames.TIT2[0], 1); eq(utf16(frames.TIT2.slice(1)), "うさぎ（兔子）");
    eq(utf16(frames.TPE1.slice(1)), "某某 词曲");
    eq(utf16(frames.TCOP.slice(1)), "CC BY 4.0 https://creativecommons.org/licenses/by/4.0/");
    eq(String.fromCharCode(...frames.WCOP), "https://creativecommons.org/licenses/by/4.0/");
    const c = frames.COMM; eq(c[0], 1); eq(String.fromCharCode(c[1], c[2], c[3]), "chi");
    eq(c[4], 0xff); eq(c[5], 0xfe); eq(c[6], 0); eq(c[7], 0, "空的短描述以两个 0 结尾");
    eq(utf16(c.slice(8)), "月读 — 条款\n本ソフトウェア…");
    eq(utf16(frames.TSSE.slice(1)), "MoonSinger v0.6.11");
  });
  it("空字段不写；全空 = 空数组（mp3 原样）；不是网址的不进 WCOP", () => {
    eq(id3v2({}).length, 0);
    const { frames } = parse(id3v2({ title: "x", copyrightUrl: "保留所有权利" }));
    eq(Object.keys(frames).join(","), "TIT2");
  });
  it("长署名：长度过 127 字节照样对（同步安全编码）", () => {
    const long = "署名".repeat(500), t = id3v2({ comment: long });
    eq(parse(t).size, t.length - 10); eq(utf16(parse(t).frames.COMM.slice(8)), long);
  });
  it("firstUrl：许可文字里第一个网址", () => {
    eq(firstUrl("CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/"), "https://creativecommons.org/publicdomain/zero/1.0/");
    eq(firstUrl("© 2026 保留所有权利"), undefined);
  });
});
