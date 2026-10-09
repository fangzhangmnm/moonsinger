# 参考窗接进 MoonSinger：对齐稿

> as-of v0.8.0 / 2026-10-08 深夜 · created by Claude Opus 5.5
> 依据：家族根仓 `ai-docs/20260929-reference-window-tech-plan.md`（新宿主清单 §4 / §9–12）、库仓 `20260929 internal-reference-window/CLAUDE.md`、WXHW 的接法（`src/reference-host.ts` + `src/project/format.ts` + ADR-0016）。

## 用例（user 原话）

- 「现在最卫生的是reference window然后还有实时预览」
- 「mp3可以暂缓。现在主要就是对着截图打谱哈哈哈」「不过如果mp3是free lunch的话也可以」「mp3有希望做也行」
- 「文字也支持，反正就是无脑一包直接用。文字比如一些和声之类的东西都蛮有用的」

## 做什么

1. **装库**：`pull-package.sh 0.3.2` → `vendor-pkgs/`，同别的 `@internal/*`。库一行不改、不升版本。
2. **卡片种类**：库现有的整包收，就是图片卡和文字卡（截图、和声笔记）。
   - 不接 live 卡：MoonSinger 没有要实时推给它看的画面。
   - 链接卡先不做。以后可以加「把这一段谱发到参考窗」：链接到某张纸，现场把那张纸画成图。
   - **音频卡（mp3）不是 free lunch**：库还没做（技术方案第 5、6 步，要动库、库要升 minor，得你批），这一轮不做。
3. **存法**：
   - 存在 `.moonsinger/references/`，目录是库定的：`manifest.json` + 每张有字节的卡一个文件 `r<i>.<ext>`。数据契约草稿里「参考图放 `attachments/`」那一项改成这个。
   - **不升 FORMAT**：只是多一个目录，库的 manifest 自带版本号和迁移。老版本 app 本来就把不认识的文件原样带着、存档时写回（`project.ts` 的 unknown 直通），老 app 打开再存也不会丢参考图。
   - 我们自己的 manifest / score.json 不为它加字段。只有一处例外：窗开着没有、在哪个位置，存进视图态 `view`，存时顺手捞进 score.json；改了不标脏、不进撤销。这个可选字段走冻结样本、审形状。
   - 加、删、挪卡 = 歌标脏、会存；开关窗、挪窗 = 不标脏。
   - 参考窗**不进撤销**（同 WXHW）。
4. **大小**：
   - 图片原样存，不重新压缩：家规「字节进出不走 canvas」，库也说没有编码器就留原字节。
   - 单张超过 4 MB：弹一个应用内小面板「存进歌里 / 取消」。这个家族批过，WeebPaint 和 WXHW 都还没做，MoonSinger 先做。
5. **入口**：
   - ☰ 菜单里「参考窗」开 / 关。顶栏不加钮，手机上放不下。
   - 空窗里有库自带的「＋ 导入参考」。图片可以从文件导入、粘贴、拖进来。
   - **粘贴看焦点**：窗有焦点 = 贴进窗；没有 = 照旧贴进谱（简谱文字）。
   - 窗浮在谱上，下边不压 pad（库的 `bottomFloor` + `reclamp()`）。
6. **署名推演**：参考窗里的素材不算（已有规矩）。
7. **图标**：库要的 13 个从图标库取，都在库里。
8. **护栏**：
   - 只有一个接缝文件 `src/app/reference-host.ts` 能 import 库的运行时，配一条守卫测试。
   - 单元测试：歌存 / 开往返、老版本留着、太新的 manifest 原样留着并明说。
   - E2E `test/e2e/reference.mjs`：开窗、粘贴看焦点、存了再开。

## 拍了（2026-10-08 深夜）

user「.moonsinger/references/ 拍，无脑一模一样」：存法和 WXHW 一模一样（目录 `.moonsinger/references/`、不升 FORMAT、窗的位置进视图态）。

## 要你拍的一件事（已拍，见上）

存法（第 3 条）：`.moonsinger/references/` 取代 `attachments/`、不升 FORMAT、窗的位置进 `view`。家族清单写的是「每个宿主改文件格式都要 user 点头」。其余的照上面直接做。
