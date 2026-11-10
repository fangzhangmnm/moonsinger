// song-cover.test.ts —— 歌库封面那一层（src/ui/song-cover.ts）：底栏。created 2026-10-16 by Claude Opus 5.5
//   2026-11-10 Claude Fable 5.2：底栏的「定稿 N」随定稿退役去掉；这里钉住它真的不印了、日期和大小照旧。
import { describe, it, assert } from "./runner.mjs";
import { coverHtml } from "../src/ui/song-cover.ts";

describe("歌库封面", () => {
  it("底栏：名字里的日期在左、大小在右；不再印「定稿」", () => {
    const h = coverHtml("20261016-団子", { sizeText: "1.2 MB" });
    assert(/ms-cover-date">20261016<\/span>/.test(h) && /ms-cover-size">1\.2 MB</.test(h), h);
    assert(!/ms-cover-final|定稿/.test(h), "没有定稿的字样");
    assert(!/ms-cover-date/.test(coverHtml("Greensleeves", { sizeText: "9 KB" })), "名字里没有日期 = 不印日期");
  });
});
