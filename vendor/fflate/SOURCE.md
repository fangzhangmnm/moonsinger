# fflate（vendored）

> vendored 2026-10-07 by Claude Opus 5.5 —— 原样拷自兄弟仓 WeebPaint `vendor/fflate/`（npm `fflate@0.8.2`，MIT，见 `LICENSE`）。

- 用处：`src/format/project.ts` 读写 `.mxl`（MusicXML 的 zip 形）——`zipSync` 能指定每个文件压不压缩（`mimetype` 必须第一个、不压缩），`unzipSync` 解包。
- 打进主 bundle（ES 模块）；没改过任何一行。
