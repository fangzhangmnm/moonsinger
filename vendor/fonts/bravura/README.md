# Bravura（SMuFL 记谱字体）

> vendored 2026-10-06 by Claude Opus 5.5

- 来源：https://github.com/steinbergmedia/bravura `redist/woff/Bravura.woff2`（字体版本见文件内；2026-10-06 下载）。
- 许可：SIL Open Font License 1.1，全文 = 同目录 `LICENSE.txt`。**「Bravura」是保留字体名**：原样使用可以；若裁剪 / 改动字体文件，必须改名。
- 用途：五线谱上的谱号、符头、符尾、休止符、升降号、拍号数字（SMuFL 码位，见 `src/render/smufl.ts`）。
- 用到的几个度量（符头宽、符干接点、边界框）抄自官方元数据 `redist/Bravura.json`，写死在 `src/render/smufl.ts`，元数据文件本身不进仓。
