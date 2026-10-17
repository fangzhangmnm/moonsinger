// song-cover.test.ts —— 歌库封面那一层（src/ui/song-cover.ts）：底栏的「定稿 N」。created 2026-10-16 by Claude Opus 5.5
import { describe, it, assert } from "./runner.mjs";
import { coverHtml } from "../src/ui/song-cover.ts";

describe("歌库封面", () => {
  it("定稿了 = 底栏日期后面印「定稿 N」；没定稿 = 不印；没日期也印", () => {
    const fin = coverHtml("20261016-団子", { sizeText: "1.2 MB", finalRev: 3 });
    assert(/ms-cover-date">20261016<\/span><span class="ms-cover-final">定稿 3</.test(fin), fin);
    assert(!/ms-cover-final/.test(coverHtml("20261016-団子", { sizeText: "1.2 MB" })), "没定稿不印");
    assert(/ms-cover-final">定稿 1</.test(coverHtml("Greensleeves", { finalRev: 1 })), "没日期也印");
  });
});
