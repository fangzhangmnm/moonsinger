// 测试入口：node test/run.mjs（node 24 strip-types 直跑导入的 .ts）。created 2026-10-06 by Claude Opus 5.5（抄 CatsUp）
// 加新测试文件：在下面 import 一行即可。
import "../src/performers/index.ts";   // 演奏者注册表先装上（app 和 encode worker 也是；存档按插件报的力度路分写哪张表，16-4）
import "./smoke.test.ts";
import "./feel-probe.test.ts";
import "./audio-queue.test.ts";
import "./feel-text.test.ts";
import "./engrave-printable.test.ts";
import "./score-surface.test.ts";
import "./song-view.test.ts";
import "./expressions.test.ts";   // 演奏法和表情不显示（7-G）
import "./jianpu.test.ts";
import "./name-column.test.ts";
import "./text-lang.test.ts";
import "./part-show.test.ts";
import "./no-collide.test.ts";
import "./tall-group.test.ts";   // 2026-11-12 7-V 一组比一页高 = 在行和行之间断开、接到下一页
import "./layout-params.test.ts";
import "./last-merge.test.ts";
import "./read-directions.test.ts";
import "./pedal.test.ts";
import "./engrave-decor.test.ts";   // 排版不认光标（W-17 第 1 刀，10-15 写的，一直没登记；2026-11-11 收）   // 谱面排版的长期测试（谱面分家 1b 收尾：守卫 1 / 2 / 3 / 8）
import "./test-registry.test.ts";   // 每个测试文件都登记了（1b-9）
import "./spacing.test.ts";
import "./stems.test.ts";
import "./glyph-box.test.ts";
import "./engrave-spacing.test.ts";
import "./engrave-skyline.test.ts";
import "./engrave-textscale.test.ts";
import "./text-style.test.ts";
import "./catalog-i18n.test.mjs";
import "./i18n-guard.test.mjs";
import "./pitch.test.ts";
import "./song.test.ts";
import "./lyrics.test.ts";
import "./usagi.test.ts";
import "./keys.test.ts";
import "./en.test.ts";
import "./packs.test.ts";
import "./format.test.ts";
import "./scales.test.ts";
import "./bars.test.ts";
import "./paper.test.ts";
import "./roles.test.ts";
import "./doc-file.test.ts";
import "./format-guard.test.ts";
import "./sf2.test.ts";
import "./sf-velocity.test.ts";
import "./sf-loudness.test.ts";
import "./sf-velcurve.test.ts";
import "./library-calibration.test.ts";
import "./calibration-default.test.ts";
import "./read-as-written.test.ts";
import "./perf-spec-entry.test.ts";
import "./loudness-convention.test.ts";
import "./chain-numbers.test.ts";   // 自动低切 / 跟速度：存的时候写算出来的数（16-5）
import "./hit-sec-by-key.test.ts";   // 鼓的着力点按值进乐手（16-4 E）
import "./studio-door.test.ts";   // 录音房的门口 + 缺数在送进录音房之前查（16-4 A2 / C）
import "./template.test.ts";   // 模板只在门口（16-4 A）：出声那一层不 import 模板；出厂乐手的数写全
import "./art-keys-by-path.test.ts";   // 乐手身上的键按力度路分；力度路是契约（统筹 2026-11-12 夜）
import "./performer-defaults.test.ts";   // 乐手和现在的默认比：按「这位的声音变不变」核每个键恰好落在一行上（16-6，统筹 2026-11-13）
import "./look.test.ts";   // 「现在怎么画」只在 src/look：边界 + 跟着软件 + 纸张存选择（第 17 条 17-1）
import "./look-rules.test.ts";   // 排版规则的数只在 src/look；src/render 留着的数每个都登记了类别（第 17 条 17-2）
import "./look-habits.test.ts";   // 这台设备的习惯：三层各管各的、不从一样推另一样、存文件碰不到（第 18 条）
import "./panel-shell.test.ts";   // 面板外壳是唯一的面板外壳：.settings-card 只剩名单上的五处；设置、页面设置在壳上
import "./strip-layout.test.ts";   // 「初始设置」卡第一行：放不下时露出来的永远是整数格 + 半格
import "./habits-preview.test.ts";   // 「初始设置」卡的预览图：开标签换上了（data-k、k ≤ 1、150 : 92）
import "./note-name-outlets.test.ts";   // 给人看的音名的出口两类：照眼前的谱写 / 永远写实际的（第 19 条）
import "./chord-text.test.ts";   // 和弦标里的升降号贴着所属的字（v0.17.34）
import "./acc-color.test.ts";   // 音头是什么颜色，它自己的升降号就是什么颜色（v0.17.36）
import "./settings-libs.test.ts";   // 设置的音源 / 维护两页：钮碰的存储对白名单、维护页不删库、不 import 歌库 / 同步（13-2）
import "./gm-format.test.ts";
import "./sounds.test.ts";
import "./synth-wasm.test.ts";
import "./instruments.test.ts";
import "./beams.test.ts";
import "./header-spot.test.ts";
import "./view-in-c.test.ts";
import "./chord-name.test.ts";
import "./minor-key.test.ts";
import "./chord-pin.test.ts";
import "./chord-families.test.ts";
import "./clef-per-section.test.ts";
import "./clipboard.test.ts";
import "./chord.test.ts";
import "./history.test.ts";
import "./desk.test.ts";
import "./studio.test.ts";
import "./resource-watch.test.ts";
import "./whisper-inhale.test.ts";
import "./workspace.test.ts";
import "./overlay.test.ts";
import "./latch.test.ts";
import "./chords.test.ts";
import "./midi.test.ts";
import "./mp3-encoder.test.ts";
import "./pad-keys.test.ts";
import "./pad-music.test.ts";
import "./svg-groups.test.ts";
import "./duplicate-paper.test.ts";
import "./roll.test.ts";
import "./sing-core-defaults.test.ts";
import "./timeline.test.ts";
import "./scheduler.test.ts";
import "./speech-cache.test.ts";
import "./final.test.ts";
import "./core-render.test.ts";
import "./document.test.ts";
import "./home.test.ts";
import "./layout-worker.test.ts";
import "./encode-worker.test.ts";
import "./dock-layout.test.ts";
import "./factory-reset.test.ts";
import "./master.test.ts";
import "./fx.test.ts";
import "./pack.test.ts";
import "./credits.test.ts";
import "./credit-translations.test.ts";
import "./articulation.test.ts";
import "./honors.test.ts";
import "./performers.test.ts";
import "./slur.test.ts";
import "./wedge.test.ts";
import "./attack.test.ts";
import "./caret.test.ts";
import "./drag.test.ts";
import "./singer.test.ts";
import "./presets.test.ts";
import "./sokuon.test.ts";
import "./sheet-tempo.test.ts";
import "./crossline.test.ts";
import "./dyn-above.test.ts";
import "./dyn-override.test.ts";
import "./pdf-wysiwyg.test.ts";
import "./repeats.test.ts";
import "./lyric-check.test.ts";
import "./sing-langs.test.ts";
import "./ramp.test.ts";
import "./arrange.test.ts";
import "./groove.test.ts";
import "./reference.test.ts";
import "./sing-chunks.test.ts";
import "./pdf.test.ts";
import "./part-name.test.ts";
import "./id3.test.ts";
import "./sf-key.test.ts";
import "./sfx-fixed.test.ts";
import "./xhead.test.ts";
import "./staff-end.test.ts";
import "./move-part.test.ts";
import "./sel-ops.test.ts";
import "./redline-guard.test.mjs";
import "./performer-branch-guard.test.mjs";
import "./storage-whitelist.test.mjs";
import "./store-wiring.test.mjs";
import "./dyn-levels.test.ts";
import "./metronome.test.ts";
import "./clef.test.ts";
import "./part-colors.test.ts";
import "./octave-disclosure.test.ts";
import "./barstyle.test.ts";
import "./transpose-scope.test.ts";
import "./reading.test.ts";
import "./swing.test.ts";
import "./auto-ottava.test.ts";
import "./lyric-fit.test.ts";
import "./lyric-punct.test.ts";
import "./bar-numbers.test.ts";
import "./z-layers.test.ts";
import "./btn-nowrap.test.ts";
import "./cell.test.ts";
import "./hints.test.ts";
import "./jianpu-cells.test.ts";
import "./no-native-select.test.ts";
import "./arpeggio.test.ts";
import "./pad-rests.test.ts";
import "./plugins.test.ts";
import "./spectrum.test.ts";
import "./wheel.test.ts";
import "./scopes.test.ts";
import "./header-layout.test.ts";
import "./ghost-acc.test.ts";
import "./shared-staff.test.ts";
import "./percussion.test.ts";
import "./merge.test.ts";
import "./start-dyns.test.ts";
import "./icon-wiring.test.ts";
import "./e2e-areas.test.ts";
import "./sw-redirect.test.ts";
import "./song-player.test.ts";
import "./song-cover.test.ts";
import "./deployment.test.mjs";
import "./namespace.test.mjs";
import "./cloud-gate.test.mjs";   // 2026-11-03 网盘闸门：状态机 + 结构守卫（家族设计稿 cloud-gate §7 §8）
import "./cloud-return.test.mjs";   // 2026-11-04 H4 回来时没传的分三种
import "./editor-session-serialize.test.mjs";   // 2026-11-09 保存排队 + 记住存给谁 + 快照和名字同一刻取（Fable）
import "./csp-guard.test.mjs";   // 2026-11-10 页面安全策略逐条钉死（Fable）
import "./ids-guard.test.ts";   // 2026-11-10 读入边界：文件里的编号先校验再用（Fable）
import "./input-gate.test.ts";   // 2026-11-09 键盘总闸：能不能写 / 键表明文表 / 这一下归谁（Fable）
import "./input-gate-guard.test.mjs";   // 总闸以外没有别的路从按键写谱
import "./mono-voice.test.ts";   // 2026-11-09 单声试听：后按的顶掉前面的、松开回到前一个
import "./move-songs.test.mjs";   // 2026-11-03 H3 搬家：字节核过才动旧库
import "./library-home.test.mjs";   // 2026-11-03 H3 歌库必须有家：守卫
import "./export-all.test.mjs";   // 2026-11-03 歌库全部导出
import "./sw-cache-scope.test.mjs";   // 2026-11-03 正式版 / 开发版的壳缓存互不相删（F-145）
import "./local-files.test.mjs";
import "./dist-fresh.test.mjs";
import "./package-icons.test.mjs";   // 2026-11-10 内部库点名的图标页面里都有（歌库卡片的「⋯」空了一个月没人发现）
import "./edit-lock.test.ts";   // 2026-11-10 修改锁的纯逻辑：分类表 / 锁着吗 / 写入口 / 撤销 / 脏分两种 / 家 / 编辑会话
import "./render-cache.test.ts";   // 2026-11-10 这台设备上记着的渲好的声音：两层钥匙、上限、挂名、字节没了就作废
import "./edit-lock-guard.test.mjs";   // 2026-11-10 修改锁的结构守卫：解锁的调用点名单 / 表和写入口对得上 / 各道接着线
import "./link.test.ts";   // 2026-11-11 从链接打开（?file=）：认链接、几家网盘换直链、认字节、下载的失败说人话
import { run } from "./runner.mjs";

await run();
