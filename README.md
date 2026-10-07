# MoonSinger

在五线谱上写旋律和歌词，让月读唱出来。
created 2026-10-07 by Claude Opus 5.5（公开工坊道首日）

- **开发版（随 main 更新）**：https://fangzhangmnm.github.io/moonsinger/dev/
- 正式版：尚未发布（编辑器第一版：还不能存档，刷新就清空；唱好的歌可以导出 mp3）

## 现状（as-of v0.1.1 / 2026-10-07）

- 真五线谱，旋律是一串 token（音符 / 休止 / 小节线 / 调号 / 拍号 / 速度）。三路输入写同一串：电脑键盘（键位表 `docs/keys.md`）、笔 / 鼠标、手指 pad。
- 月读（つくよみちゃん）唱日文 / 中文 / 英文歌词，没写歌词的音唱「哼的字」。第一次整首唱要下载约 65 MB 模型（家族模型仓，之后不再下）；轻量版是月读的元音采样，按下即响。
- 导出 mp3；装成 PWA 后离线可用。
- 这是一个**公开工坊**：`ai-docs/` 是 AI 时代的 source，与代码一起公开；`journals/` 是人类区，不进仓。

## 跑起来

```
npm install          # 只为 tsc 类型门和 vendored 的家族内部库
npm test             # node 24 直跑 test/
bash scripts/build.sh
npm run serve        # 开 http://localhost:8710/
npm run smoke        # 真浏览器 + 真 service worker 冒烟（借兄弟仓 WeebPaint 的 playwright）
```

## 读什么

1. `CLAUDE.md`（仓库纪律、出货状态、黄线区）
2. `ai-docs/20261005-moonsinger-upheaval.md`（为什么是月读）
3. `ai-docs/20261006-editor-v0-grill.md`（编辑器第一版的决定与原话）
4. `docs/keys.md`（键位，由 `src/input/keys.ts` 生成）

## 月读的声音

本ソフトウェアの音声合成には、フリー素材キャラクター「つくよみちゃん」（© Rei Yumesaki）が無料公開している音声データを使用しています。
■つくよみちゃんコーパス（CV.夢前黎）
https://tyc.rei-yumesaki.net/material/corpus/

つくよみちゃんの声質を使用する場合は、出力した音声を次の目的で使用することを禁止します。
【禁止事項】
■人を批判・攻撃すること。（「批判・攻撃」の定義は、つくよみちゃんキャラクターライセンスに準じます）
■特定の政治的立場・宗教・思想への賛同または反対を呼びかけること。
■刺激の強い表現をゾーニングなしで公開すること。
■他者に対して二次利用（素材としての利用）を許可する形で公開すること。

- ayousanz/piper-plus-tsukuyomi-chan — つくよみちゃんコーパス利用規約 (modified: zh / en language vectors)
- ayousanz/piper-plus-base — CC-BY-4.0 (zh / en language vectors)
- Open JTalk · MeCab · NAIST-jdic · pyopenjtalk-plus · CMUdict · g2p-en · pypinyin · ONNX Runtime

## 许可证

- 本仓自己写的代码与文档：MIT（`LICENSE`）。
- `vendor/` 下的第三方各按各的许可证：Bravura（SIL OFL 1.1）、lamejs（LGPL-3.0）、WORLD（modified BSD），原文都在各自目录里。
- `assets/preview/`（试听元音表）是月读唱出来的声音，按上面つくよみちゃん 的条款，不在 MIT 之内。
- 模型（家族模型仓 pwa-models 的包）的许可证随包附带。
