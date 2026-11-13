# vendor/fonts —— 字体

> created 2026-10-08 深夜 · by Claude Opus 5.5（v0.8 PDF 导出；user「自己写pdf，然后字体可以选普通的和那个拼音可爱的…歌词用字体」）
> edited 2026-11-12 by Claude Opus 5.5（MoonSinger小弟，施工单 7-J）：拼音字体（萌神手写体）退役，`pinyin.ttf.gz` / `OFL-pinyin.txt` 删了（user「现在有没有人真的在用带拼音的导出。 no, 我也建议先sunset，以后需要卡通字形另外想办法」）。以后的拼音 = 歌词上面一行能改的小字注音，不靠字体（愿望单 W-77）。

| 路径 | 是什么 | 谁用 |
|---|---|---|
| `bravura/` | Bravura（SMuFL 记谱字体，OFL；见该目录 README） | 屏幕上的谱（WOFF2）；PDF 用 `bravura/outlines.json`（构建时提出来的矢量轮廓，`scripts/gen-bravura-outlines.py`） |
| `sans.ttf.gz` | 思源黑体 / Noto Sans SC Regular 的 gzip（静态 TrueType） | PDF 里的歌词 / 歌名 / 文字（嵌子集）。点导出 PDF 时才取 |
| `serif/chord-outlines.json` | Noto Serif SemiBold 里和弦标用得到的那几十个字的矢量轮廓（`scripts/gen-chord-outlines.py`） | PDF 里的和弦标（画成路径） |
| `serif/chord-serif.ttf` | 同一款字、同一组字的子集（TrueType，约 7 KB；同一个脚本生成，去掉了排版表 GPOS / GSUB / kern、不带 hinting） | 屏幕上的和弦标（styles.css `@font-face`「MoonSinger Chord」；离线壳预缓存）。v0.17.36 起——原来屏幕用设备自己的衬线字，iPad / Windows 上没有 Noto Serif 会落到 Times |
| `OFL.txt` | 许可证全文（SIL OFL 1.1） | — |

**出处**：`sans.ttf.gz` / `OFL.txt` = 从兄弟仓 WebXiaoHeiWu 的 `vendor/fonts/` **原样拷来**（同一份字节；上游、制作命令、覆盖范围、许可证核查都记在那边的 README——Claude Fable 5.1 2026-09-30 / 10-01 做的）。
- `sans.ttf.gz` sha256 `e29b80bf17ad17bbd07b59642a817b04075b5a9001c53f4783e42c82188d575a`（`test/pdf.test.ts` 核着）

**许可**：SIL OFL 1.1——可随软件再分发、不得单独售卖字体文件、随附版权行与许可证全文；保留字体名不用于改过的版本（这里没改字体，PDF 里只嵌用到的字形 = 子集，OFL 允许）。

**和弦标那款字（`serif/`，edited 2026-11-13 by Claude Opus 5.5，v0.17.36）**：Noto Serif SemiBold（Google，SIL OFL 1.1，没有保留字体名）。本机 `/usr/share/fonts/truetype/noto/NotoSerif-SemiBold.ttf` 切出来的子集——只留和弦标用得到的字；
子集里的 name 表原样留着（版权行、许可证说明都在字体文件里）；网页里用的名字是「MoonSinger Chord」（只是 `@font-face` 的名字，字体文件没改名）。许可证全文 = 本目录 `OFL.txt`。
三处同一组字、同样的字宽：`serif/chord-serif.ttf`（屏幕）= `src/render/chord-text.gen.ts`（排版的字宽表）= `serif/chord-outlines.json`（PDF），`test/pdf.test.ts` 核着；重新生成跑 `python3 scripts/gen-chord-outlines.py`。
