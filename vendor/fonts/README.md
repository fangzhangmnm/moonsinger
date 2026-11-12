# vendor/fonts —— 字体

> created 2026-10-08 深夜 · by Claude Opus 5.5（v0.8 PDF 导出；user「自己写pdf，然后字体可以选普通的和那个拼音可爱的…歌词用字体」）
> edited 2026-11-12 by Claude Opus 5.5（MoonSinger小弟，施工单 7-J）：拼音字体（萌神手写体）退役，`pinyin.ttf.gz` / `OFL-pinyin.txt` 删了（user「现在有没有人真的在用带拼音的导出。 no, 我也建议先sunset，以后需要卡通字形另外想办法」）。以后的拼音 = 歌词上面一行能改的小字注音，不靠字体（愿望单 W-77）。

| 路径 | 是什么 | 谁用 |
|---|---|---|
| `bravura/` | Bravura（SMuFL 记谱字体，OFL；见该目录 README） | 屏幕上的谱（WOFF2）；PDF 用 `bravura/outlines.json`（构建时提出来的矢量轮廓，`scripts/gen-bravura-outlines.py`） |
| `sans.ttf.gz` | 思源黑体 / Noto Sans SC Regular 的 gzip（静态 TrueType） | PDF 里的歌词 / 歌名 / 文字（嵌子集）。点导出 PDF 时才取 |
| `OFL.txt` | 许可证全文（SIL OFL 1.1） | — |

**出处**：`sans.ttf.gz` / `OFL.txt` = 从兄弟仓 WebXiaoHeiWu 的 `vendor/fonts/` **原样拷来**（同一份字节；上游、制作命令、覆盖范围、许可证核查都记在那边的 README——Claude Fable 5.1 2026-09-30 / 10-01 做的）。
- `sans.ttf.gz` sha256 `e29b80bf17ad17bbd07b59642a817b04075b5a9001c53f4783e42c82188d575a`（`test/pdf.test.ts` 核着）

**许可**：SIL OFL 1.1——可随软件再分发、不得单独售卖字体文件、随附版权行与许可证全文；保留字体名不用于改过的版本（这里没改字体，PDF 里只嵌用到的字形 = 子集，OFL 允许）。
