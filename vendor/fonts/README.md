# vendor/fonts —— 字体

> created 2026-10-08 深夜 · by Claude Opus 5.5（v0.8 PDF 导出；user「自己写pdf，然后字体可以选普通的和那个拼音可爱的…歌词用字体」）

| 路径 | 是什么 | 谁用 |
|---|---|---|
| `bravura/` | Bravura（SMuFL 记谱字体，OFL；见该目录 README） | 屏幕上的谱（WOFF2）；PDF 用 `bravura/outlines.json`（构建时提出来的矢量轮廓，`scripts/gen-bravura-outlines.py`） |
| `sans.ttf.gz` | 思源黑体 / Noto Sans SC Regular 的 gzip（静态 TrueType） | PDF 里的歌词 / 歌名 / 文字（嵌子集）。点导出 PDF 时才取 |
| `pinyin.ttf.gz` | 萌神手写体 Mengshen-Handwritten 2.0（汉字头上带拼音）的 gzip | 同上，选「拼音」时才取 |
| `OFL.txt` / `OFL-pinyin.txt` | 两款的许可证全文（SIL OFL 1.1） | — |

**出处**：`sans.ttf.gz` / `pinyin.ttf.gz` / 两份许可证 = 从兄弟仓 WebXiaoHeiWu 的 `vendor/fonts/` **原样拷来**（同一份字节；上游、制作命令、覆盖范围、许可证核查都记在那边的 README——Claude Fable 5.1 2026-09-30 / 10-01 做的）。
- `sans.ttf.gz` sha256 `e29b80bf17ad17bbd07b59642a817b04075b5a9001c53f4783e42c82188d575a`
- `pinyin.ttf.gz` sha256 见 `test/pdf.test.ts`（拷来时核过和 WXHW 那份逐字节相同）

**许可**：SIL OFL 1.1——可随软件再分发、不得单独售卖字体文件、随附版权行与许可证全文；保留字体名不用于改过的版本（这里没改字体，PDF 里只嵌用到的字形 = 子集，OFL 允许）。
**萌神拼音的字高**（排版要知道）：字体自报的上伸（hhea 1300）把拼音带算进去了，不能拿来定汉字位置——按字形墨迹（`ttf.ts inkOf`）算：拼音画在汉字上方，歌词行在谱下面，选了它歌词行要往下让出拼音那一截（`src/export/score-pdf.ts`）。同 WXHW v2.3.13 的结论。
