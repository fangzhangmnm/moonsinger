// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 键盘。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 第一版（grill 账本 §8½）：不做撤销；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。
// 存档 = 无地逃生口（2026-10-07，user「先不急着store。可以先按照无地规范导入导出做逃生口」）：文件菜单 新建 / 打开 / 存 / 导出（.mxl）
//   （格式 = src/format/，数据契约草稿 ai-docs/20261007-data-contract-draft.md）；没存就关页面 = 浏览器挽留框（照 WeebPaint，不偷偷写盘）。
//   v0.3.0（2026-10-07，edited by Claude Fable 5.1；user「把无地做完美」）按 WeebPaint 无地标尺对齐：存 = 回家一个动作、另存为并进导出 hub、
//   写回前 mtime 对表、有家不给改文件名、拖进来 / 双击 .mxl 打开（manifest file_handlers）。
// UX-2（账本 §9¾）：选中 = 改、光标 = 写；歌词在谱下面点进去写（底部歌词栏拿掉了）；「弹」= 即兴只唱不写。
// 调号 / 拍号 / 速度是谱里的记号 token，点谱上的记号就地改，pad「＋」在光标处插——顶栏不再有全局的调号 / 拍号 / 速度。

import { dropdownHtml, mountDropdowns, setDropdown, inDropdownList, keyForList, isDropdown } from "../ui/dropdown.ts";
import { iconHtml } from "../ui/icon.ts";
import { installTouchTips } from "../ui/touch-tip.ts";
import { conceptName, zhOnly } from "../gm/catalog-i18n.ts";
import { _t, lang, langChosen, saveLang, applyDocumentLang, LANG_NAME, type Lang } from "../i18n/index.ts";
import { SIGNS } from "../render/signs.ts";
import { APP_VERSION } from "../version.ts";
import { initPwaShell } from "./pwa-shell.ts";
import { harmonyTheory, type HarmonyRead, type HarmonyGuess } from "../theory/index.ts";
import { PEDAL_KINDS, pedalHere, pedalDownAt, insertPedal, type PedalKind, type PedalTok, setHairpinTarget, singleSel, currentIndex, ensureStartDyns, duplicatePaper, swellOf, toggleSelDot, clearMarks, stackDegree, setBarStyle, transposePapers, scopeKey, setLyricFit, setBarNumbers, DYNS, CLEFS, headLen, type ClefName, insertClef, insertOttava, setDisplayMark, DEFAULT_TIME, WHOLE, type Art, ART_NAME, setGroove, setRepeatBar, insertNav, NAV_LABEL, endingLabel, type NavWhat, type Repeat, tempoOwner, markAnchor, isTimed, type Dyn, dynMarkAt, editMarkAt, moveMarkToEnd, markAtEnd, rampSource, toggleArtSel, toggleSlurSel, slurStateSel, artStateSel, setDynSel, dynMarkSel, type EditorState, type InputState, type Acc, type Hum, type MarkVal, type Song, type PartDef, type Token, type TempoMap, initState, writePitch, writeMark, setPaper, setCredits, setTitle, setRights, tapAcc, setAccState, setUnit, setNote, effectivePitch, timeline, keyAt, timeAt, tempoAt, TPQ, tr, setFocus, setCaret, setPaperHidden, toggleChordPitch, stackPitch, songOnlyPaper, allPitches, addPart, rebindTrack, removePart, setChordPin, setPaperLook, addPaper, removePaper, movePaper, addTrack, removeTrack, flattenPart, tempoMapOf, setDensity, movePart, setPartHost, type Clef, setSelDur, select } from "../score/song.ts";
import { textLangIn, setTextLang, TEXT_LANGS, type TextLang, setViewInC, setChordTags, setNotation, setMiddleC, setExpressions, MOVABLE_DO, IN_C_APPLIES, MIDDLE_C_NAMES, NOTATIONS, CHORD_TAG_STYLES, setChordTagStyle, type ChordTagStyle, type NotationId } from "../score/song-view.ts";   // 这首歌怎么看（谱面分家第三刀）：读 / 改只走这里
import { foldedMarks, type FoldedMark } from "../render/expressions.ts";   // 演奏法和表情不显示时改到 / 写上了它们：轻轻说一句（7-G）
import { songPlayOrder, parseArrangement } from "../score/arrange.ts";
import { grooveWeights, grooveMapOf, grooveCategory, followOf, grooveStyle, grooveDataIn, withGrooveData, grooveTable, grooveName, describeGroove, grooveHasPhase, swingRatio, timeMapOf, GROOVE_STYLES } from "../score/groove.ts";
import { type Pitch, midiOf, spellMidi, KEY_LABEL } from "../score/pitch.ts";
import { apply, type Command } from "../score/commands.ts";
import { type Action, type Where, route, isSoundKey } from "../keyboard/keys.ts";
import { createMidiKeyboard, type MidiStatus } from "../keyboard/midi.ts";
import { span, perfReport, perfReset } from "../ui/perf-trace.ts";   // 热路径秒表（按键 → 上屏分账）   // MIDI 键盘（Web MIDI）：琴键号进来，翻译归 pad-host
import { MELISMA_MARK } from "../score/lyrics.ts";
import { lyricIssues, lyricWhyText, prettyReading, type LyricIssue } from "../score/lyric-check.ts";
import { ScoreView } from "../ui/score-view.ts";
import { ScoreOverlay } from "../ui/score-overlay.ts";
import type { PartView } from "../render/engrave.ts";
import { installPlatformGuards } from "../ui/platform-guards.ts";
import { type HintRange } from "../keyboard/pad.ts";
import { createPadHost } from "./pad-host.ts";   // pad 的宿主 = 翻译层（音键 → 写 / 叠音观望 / 出声；按键 id → 命令 / 插记号 / 菜单；谁按着的簿记）
import { toLabScore } from "../score/lab-score.ts";
import { Singer, type Reading } from "../singer/client.ts";
import type { LyricReading } from "../ui/lyric-editor.ts";
import { RULES, lockedRules, MODE_BAR, barMode, MODE_LABEL, MODE_TITLE, MODE_ICON, dockOf, hasKeys, sideDock, sideDocked, type Mode, type WorkspaceState } from "./workspace.ts";
import { budgetFor, advise, trimOnSongSwitch, describe as describeResources, totalBytes, AUDIO_HOT, type DeviceInfo, type Snapshot } from "./resource-watch.ts";
import type { LoadInfo } from "../engine/studio-client.ts";
import { holdAudio, releaseAudio, audioCtxIfAny, warmAudio, onAudioNote, noteKeyAsleep, audioQueuedMs, flushAudio, idleFlushAudio, audioShown, reviveAudio, setPrimer, primerOn, audioStartBurst } from "../singer/audio.ts";
import { feelBanner } from "./feel-text.ts";
import { createFeelProbe } from "./feel-probe.ts";   // 手感探针（v0.16.23）：按下 → 接到 → 出声三段 + 主线程 / 音频时钟停顿，超标露数字
import { TEMPLATE } from "../format/template.ts";
import { encodeMp3, MP3_QUALITY, type Mp3Quality } from "../export/mp3.ts";
import { id3v2, firstUrl } from "../export/id3.ts";
import { createPackStore } from "@internal/model-packs";
import { showNotice, closeNotice, configureFloors, settingRowHtml, wireSettingRows, openPanelShell, type TabSpec, type PanelShell } from "@internal/workbench-elements";
import { PACKS, CREDIT } from "../singer/packs.gen.ts";
import { CREDIT_TRANSLATIONS } from "../singer/credit-translations.ts";
import { SOUNDS, SOUNDS_SOURCE_DEFAULT } from "../gm/sounds.gen.ts";
import { createSoundSources } from "../sources/sounds.ts";   // 音源来源 + 弱引用解析（刀 4 接缝）
import { linkParam, withoutLinkParam, planLink, fetchLink, sniff, fileNameFor } from "../sources/link.ts";   // 从链接打开（?file=；黄线区登记）
import { createModelSources, MODEL_SOURCE_DEFAULT } from "../sources/models.ts";
import { sha256Hex } from "../sources/sha256.ts";
import {percOf} from "../gm/percussion.ts";
import { withCastAs, candidateJson, activeCalibrationDb, templateExtras, activeHum, withHum, activePedalDefault } from "../format/project.ts";
import type { CandidateV2, Sf2Source } from "../format/contract.ts";
import { contentFingerprintOf, moveBus, saveMxl, openBytes, emptyExtras, roleSound, withRoleName, withRoleConcept, activeCandidateName, activeId, activeGm, activeInstrument, candidates, gmCandidates, withActive, withSwap, withCandidateCopy, songPresets, withSf2Candidate, withoutCandidate, newRoleId, newMicId, withNewRole, withoutRole, withMic, withThumbnail, soundUses, withPacked, withUnpacked, activeVelocity, activePerfSpec, activeSingChunk, withSingChunk, withMaster, activeMaster, withTrack, studioTrack, studioTracks, withoutBus, newBusId, activeChain, CANDIDATE_ID, type Extras, type Engine } from "../format/project.ts";
import { packedLicenses, performerCredits, songCreditLine, licenseHints, RIGHTS_PRESETS, creditsText, type CreditLine } from "../format/credits.ts";
import { ignoredArts, whyIgnored, dynOverridden, dynLevels, type Mark } from "../score/perform.ts";
import { navWhy } from "../score/repeats.ts";
import { cachedSound, rememberSound, listCachedSounds, forgetSound, releaseSoundMemory, soundMemoryBytes, siteStorageEstimate, isSoundPersisted, cachedSoundLabel } from "../gm/sound-cache.ts";
// ── 实时试听（2026-10-09 Claude Fable 5.1，刀 1；提案 ai-docs/20261009-realtime-preview-engine-proposal.md）：谱 → 时间线（秒）→ 录音房（音频线程）
import { StudioClient } from "../engine/studio-client.ts";
import { performerOf, TSUKUYOMI_RANGE } from "../performers/index.ts";
import type { Notation } from "../performers/registry.ts";
import { createPerformance, type Issue } from "./performance.ts";   // 唱歌 / 播放 / 导出的胶水（刀 1 之二）
import { createOverlayRegistry, padLocked } from "./overlay.ts";
import { LATCH_OFF, latchDown, latchUp, latchWrite, latchCancel, latchOn, type Latch } from "../keyboard/latch.ts";   // 三把锁一条规则（编辑状态机第 2 期）   // 盖层登记（刀 3 之一）：面板 / 小菜单 / 轨的小卡同一时刻只开一张；page（刀 3 之二）：谱 / 乐器页 / 目录   // 演奏者插件注册表（ADR-0004）：能什么 / 怎么准备 / 怎么出声都问它，不按引擎名分支
import type { AuditionInst, TrackSpec } from "../engine/studio.ts";
import { buildTimeline, lightNotes, songLangOf, sungPlan, sungLangsOf, LEAD_IN, PRE_ROLL, HUM_KANA, type Timeline, type PerformerInfo, type ChunkPlan } from "../engine/timeline.ts";
import { chunkOrder, readyToStart, prerollCount } from "../engine/scheduler.ts";
import { loadVowelTable } from "../engine/vowel-table.ts";
import { sfKey, canAlign, type SfxInfo } from "../gm/sf-key.ts";
import { Finder, type FinderPick, type FinderNobody, type OwnPick, DEFAULT_PINS, type PinTile } from "../ui/finder.ts";
import { createHeaderPanel } from "./header-panel.ts";
import { createInstSettings } from "./panels/inst-settings.ts";
import { defaultsReport } from "../performers/defaults.ts";   // 混音台「乐手 N 处不同」（16-6）
import { DYN_GLYPH } from "../render/smufl.ts";
import { Studio, MASTER as STUDIO_MASTER, STEREO_TABS } from "../ui/studio.ts";
import { resolveChain } from "../ui/plugins.ts";
import { coreInfo } from "../core/version.ts";
import { roleNameOf, roleSoundOf, loadCatalog, rangeOf, castArgsOf, sampleKeyOf, GS_LIBRARY_ID, gmKey, conceptOfIds, type Catalog, type Concept } from "../gm/catalog.ts";
import { creditsSections, sectionsHtml, VOICE_CREDIT_SECTION } from "./credits-doc.ts";
import { subsetSf2, listSf2Presets, sf2Info, type Sf2PresetInfo } from "../gm/sf2-subset.ts";
import { partShow, partNameOf, roleNameIn, roleGivenName, roleInstrumentLabel, type PartShow } from "../format/part-show.ts";   // 声部显示成什么：唯一出口（12-4）
import { type PaperKind, type Density, PAPER_KINDS, PAPER_NOTE, PAPER_LABEL, DENSITIES } from "../score/paper.ts";
import { paperSizeText } from "../look/paper.ts";
import { lookOf, stampLooks, notationName, NOTATION_NOTE, middleCLabel, MIDDLE_C_NOTE, TRANSPOSE_AID_NOTE, CHORD_TAG_STYLE_LABEL, CHORD_TAG_STYLE_NOTE, trackLookOf, followDefault, defaultText, customStaffMm, marginRow, followOptionText, followUndoLabel, LOOK_ROW_NAME, type LookKey, type LookContext, type LookDefaults, type HabitKey, type Habits, HABIT_KEYS } from "../look/index.ts";
import { habitsFrom, HABIT_CODEC, HABIT_DEVICE_KEY, HABITS_ASKED_KEY } from "../look/habits.ts";
import { openHabitsCard, CARD_HABITS, cardHabitKeys, type HabitsCard, type HabitRows } from "./panels/habits-card.ts";   // 这台设备的习惯（第 18 条）   // 「现在怎么画」和「跟着软件」只问这一处（第 17 条）
import * as docFile from "./doc-file.ts";
import { unzipSync } from "../../vendor/fflate/fflate.esm.js";
import { defaultStem, fileSafe, stampedCopy } from "./names.ts";
// ── 歌库（v0.6.0，2026-10-08 Claude Fable 5.1）：@internal/store（接缝 src/app-store.ts）+ @internal/gallery（src/gallery-host.ts）+ WeebPaint 的 editor-session 节律 ──
import { isCached, attachStore, hasStore, requireStore, storeWasAttached, auth, setActiveIdentifier, requestStoragePersistence, isSignedIn, detachStore, disposeStore, cloudAvailable, hasHome, hasCloudHome, folderHome, folderOnline, setFolderOnline, homeOnline, noteCloudAccount, cloudAccountKnown, forgetLegacyAttach, legacyLibraryExists, openLegacyLibrary, readFromFolder, withStemTail, cloudReachable, type Store, type StoreHome } from "../app-store.ts";
import { planReturn, neverUploadedIds, isOpenDocAutosaveOnly, stillLocalIds, type ReturnPlan } from "./cloud-return.ts";
import { canPickFolder, pickFolderHome, folderPermission, lastFolderHome, touchFolderHome, clearFolderHome, type GalleryEntry } from "../library-home.ts";
import { moveSongs, moveKindOf, moveFinished, moveSay, type SongToMove } from "./move-songs.ts";
import { showSiteHint, watchStorageHealth, showLibraryOff, SITE_TEXT, SITE_HOST, FOLDER_TEXT } from "./site-hint.ts";
import { dropLegacyCacheDbs } from "./factory-reset.ts";
import { availability } from "../persistence.ts";
import { currentPolicy } from "../deployment-policy.ts";
import { deployment } from "../deployment.ts";
import { addWorklet, threadUrls, onThreadFail } from "../threads.ts";
import { getBytes, resourcesInFolder, localBundle } from "../resources.ts";
import { identifiers } from "../identifiers.ts";
import { SONG_SUFFIX, LOCAL_SAVE_DEBOUNCE_MS, WAKE_CHECK_AFTER_MS, RELOAD_PUSH_TIMEOUT_MS } from "../config.ts";
import { cloudOnline, createCloudGate, isUserOffline, noteAuthFailure, onUserOfflineChange, rawOnline } from "../cloud-gate.ts";
import { createGateUi, GATE_TEXT } from "./cloud-gate-ui.ts";
import { attachGate, attachFolderLost } from "../store-ui.ts";
import { exportAll, exportAllSay } from "./export-all.ts";
import { zipSync } from "../../vendor/fflate/fflate.esm.js";
import { initGalleryHost, type GalleryHost } from "../gallery-host.ts";
import { createEditorSession } from "../editor-session/index.ts";
import { withBusy, setBusyText, openInputSheet, openChoiceSheet, type Choice, openConfirmSheet, isSheetOpen, closeSheet, isGateOpen, gateGeneration, whenGateClosed, lockSyncGate, unlockSyncGate } from "../ui/sheets.ts";
import { createReferenceHost, type RefImportQuestion, type RefImportChoice, RAM_ABOVE } from "./reference-host.ts";
import { RenderProgress } from "../ui/render-progress.ts";
import { scorePdf } from "../export/score-pdf.ts";
import { loadPdfFont, loadMusicOutlines, PDF_FONT_MB } from "../export/pdf-assets.ts";
import { reportError, diagNote, diagText, initBlackBox } from "./report-error.ts";
import { copyDiag, shareDiag, downloadDiag, clearDiag, canShareDiag } from "./diag-ui.ts";
import { deviceKvGet, deviceKvSet, deviceKvGetJson, deviceKvSetJson } from "../device-kv.ts";
import { makeCoverPng, coverWithBlurb } from "../image/cover.ts";
import { copyTokens, cutTokens, pasteTokens, selectAll, toJianpu, fromJianpu, fifthsAtSel } from "../score/clipboard.ts";
import { type Locus, type Restored } from "../score/history.ts";
import { createDocument, type SavedMark } from "./document.ts";
import { LOOK_KEY_OP } from "./edit-lock-table.ts";   // 页面设置「跟着软件」：每一样显示设置走哪一类看法（v0.17.33）
import { createHome, assertNever, type Home } from "./home.ts";
import { createEditLock, type LockStore } from "./edit-lock.ts";
import { initEditLockDoor } from "./edit-lock-door.ts";
import { createRenderCache, stampOf, MANIFEST_ENTRY, renderedByOldCore, type RenderMeta } from "./render-cache.ts";
import { idbRenderStore } from "./render-cache-idb.ts";
import { createInputGate, keyOwner, type NoWrite } from "./input-gate.ts";
import { monoDown, monoUp, type MonoHeld } from "./mono-voice.ts";
import { createEncoder } from "../format/encode-client.ts";
import { runFactoryReset } from "./factory-reset.ts";
import { freshDesk, freshPartView, serializeDesk, unserializeDesk, serializeFinderMemo, unserializeFinderMemo, PAD_UNITS, type Desk, type PartViewState } from "../score/desk.ts";
import { SelBar, type SelVerb } from "../ui/sel-bar.ts";
import { CLEF_LABEL, CLEF_TITLE, OTTAVA_LABEL, resolveSongLooks, type ResolvedLook } from "../score/clef.ts";
import type { ClefHit } from "../render/engrave.ts";
import { TAB20, partColorIndices } from "../ui/part-colors.ts";
import { fitWide } from "../ui/fit-wide.ts";
import { sizeText } from "../ui/size-text.ts";
import { libAction, libInstall, voiceColumnHtml, gsColumnHtml, ownColumnHtml, ownLabel, upkeepVoiceHtml, upkeepGsHtml, upkeepRendersHtml, upkeepRestHtml, type PackView, type OwnView, type LibId, type LibsHost } from "./panels/settings-libs.ts";   // 设置的音源 / 维护两页（13-2）
import type { BuiltinLib } from "../sources/removed.ts";

installTouchTips();
applyDocumentLang();   // <html lang> + CSS 里写死的几句：第一个做，后面画界面都已经是这个语言
document.getElementById("score")?.setAttribute("aria-label", _t("乐谱"));
const ranBefore = deviceKvGet("diag-log") !== null;   // 这台设备以前开过 app（黑匣子的环在）：「更新之后第一次打开说一次」只对用过旧版的设备说，全新的不说（第 9 节）
initBlackBox(APP_VERSION);   // 黑匣子第一个起：之后所有报错 / 面包屑都有地方落（设置里「诊断日志」能分享）
/** 文档 = 真相 + **改它的唯一入口**（src/app/document.ts，2026-10-16 doc 这一刀）：谱的状态 `D.st`、文件里的其余部分 `D.extras`、撤销栈、「改过没存」的基线、修改锁的第 ②③ 道。
 *  改状态一律 `D.commit()`（下面的 update / updateExtras / updateBoth 只是薄壳）；界面的副作用在 afterState / afterExtras / afterRestore 三个 hook 里（函数声明会提升，这里引用没问题）。 */
/** 这首歌打开的时候有几处纸开头没写力度（开歌不补；人第一次改谱时 normalize 补上那一下说一句，一首歌一次。第 16 条，统筹 2026-11-12）。在 D 之前声明：D 一建好就可能 normalize。 */
let startDynsMissing = 0, startDynsTold = true;
function noteStartDynsFilled(_n: number): void {
  if (startDynsTold || !startDynsMissing) return;
  startDynsTold = true;
  info(_t("这首歌有 {n} 处纸开头没写力度：这一下改谱时补上了那里本来生效的那个（听起来不变），存的时候一起写进文件", { n: startDynsMissing }));
}
// 第 21 条（v0.17.38）：新建的歌把「跟着」的那几项写成这一刻的值（src/look stampLooks born）；开 app 时这一份在习惯那几行之前建，直接从设备读习惯
const D = createDocument(((st) => ({ st, extras: templateExtras(st.song) }))(initState(stampLooks(initState().song, { habits: habitsFrom(deviceKvGet) }, lang(), "born"))), {
  now: () => performance.now(), normalize: (next) => { const n = withStartDyns(next), g = withGrooveData(n.song); return g === n.song ? n : { ...n, song: g }; },   // 风格记号用到的拍子表：插 / 换风格的那一刻抄进歌（16-4 D）
  onState: (prev, next, moved) => afterState(prev, next, moved, true), onExtras: (prev, next, locus) => afterExtras(prev, next, locus),
  onRefused: (what) => onLockRefused(what), onRestored: (r, verb, prev) => afterRestore(r, verb, prev), extraDirty: () => refHost.rev(),
  // 修改锁的第 ②③ 道（2026-11-10）：真要改的那一下带着类别去问 lock（被拒 = 门闪一下，在 lock.writeGate 里）；「现在锁着吗」只问不闪
  writeGate: (kind) => lock.writeGate(kind), lockedWhy: () => (lock.locked() ? _t("锁着") : null),
});
/** 这首歌的家（src/app/home.ts，2026-10-21 F-49「家」这一刀）：歌库里的一首 / 本机文件（桌面 Chromium 的句柄 + mtime 对表）/ 还没家（等着安家的空谱带 pendingFolder），三种互斥；
 *  存 / 改名 / 离开 / 安家 / 放下身份只经 H 的动词，三种家的分支都在那个模块里（switch + assertNever，漏一种 = tsc 红）。文件名主干 H.stem，歌名在谱里（D.st.song.title，可不填），和文件名分开。
 *  ports 里引用的 es / KV_LAST_DOC / smartSaveStore 等声明在后面（箭头函数里引用，开机那一串 loadDoc 之前都已就位；函数声明会提升）。 */
const H = createHome({ home: { kind: "none", pendingFolder: null }, stem: defaultStem(), named: false }, {
  gallery: { save: () => smartSaveStore(), flushLocal: () => es.flushLocal(), flushAndPush: () => es.flushAndPush(), markDirty: () => es.markDirty(), adopted: (id, o) => es.adopted(id, o), release: () => es.release(), rename: (to) => es.rename(to), occupied: (id) => requireStore().files.occupied(id) },
  file: { canPickSave: docFile.canPickSave, pickSave: docFile.pickSave, writeTo: docFile.writeTo, mtime: docFile.mtime, isStale: docFile.isStale },
  ids: { join: (folder, stem) => identifiers.join({ folder, stem, suffix: SONG_SUFFIX }), parse: (id) => identifiers.parse(id) },
  suffix: SONG_SUFFIX,
  bytes: () => bytesNow(), dirty: () => owesSave(), title: () => D.st.song.title ?? "", freshStem: () => defaultStem(),
  locked: () => lock.locked(), onFileBorn: (h) => lock.keepLocalFileUnlocked(h),   // 修改锁第 ④ 道（硬盘文件那条路不经 editor-session）；新歌存成的文件生来解着
  ask: { discard: (what) => confirmDiscard(what), overwriteStale: (name) => askSheet(_t("「{name}」在外面被改过", { name }), _t("打开或上次存之后，这个文件被别的程序改过。覆盖 = 外面改的那些会丢。"), _t("覆盖")) },
  offerDownload: (bytes, name, onSaved) => { const file = new File([bytes as unknown as BlobPart], name, { type: "application/vnd.recordare.musicxml" }); offerFile(file, _t("存成 .mxl"), _t("{name} · {size}。下载或分享到「文件」里；以后从文件菜单「打开」。", { name: esc(file.name), size: sizeText(file.size) }), onSaved); },
  markSaved: () => { D.markSaved(); renderTitle(); },
  report: (e, level) => reportError(e, level === "error" ? "error" : "warning"),
  // 家换了：告诉 store 谁开着（冲突面 / 歌库卡片要知道）、「上次开着哪首」的指针（歌库里 = 它；放下身份 / 新建空谱 = 清掉；开本机文件不动它——reload 回到上一首歌库里的歌，v0.6 起就这样）、重画顶栏
  onHome: (prev, next) => { setActiveIdentifier(next.kind === "gallery" ? next.identifier : null); if (next.kind === "gallery") deviceKvSet(KV_LAST_DOC, next.identifier); else if (next.kind === "none" && (prev.kind === "gallery" || next.pendingFolder != null)) deviceKvSet(KV_LAST_DOC, null); lock.refresh(); renderTitle(); },
  onName: () => renderTitle(),
});
/** 修改锁（家族「源文件原则上只读：手动解锁才能改」；2026-11-10，Claude Fable 5.2；设计稿 = 家族根 ai-docs/20261109-moonsinger-edit-lock-design.md）：
 *  「开着的这首锁着吗」只有这一处回答（src/app/edit-lock.ts，现算不记状态）；「这个操作锁着能做吗」只有一张表（src/app/edit-lock-table.ts）。
 *  五道各自拦、都来问它：① 界面 = 键盘总闸的 locked 口 + 谱面规则 + 面板淡一档（applyWorkspace）② 写入口 ③ 撤销重做 = D 的 writeGate
 *  ④ 保存 = 歌库走 es 的 editLocked、硬盘文件走 H 的 locked ⑤ 库（createStore 的 lockByDefault，这一版还没开：歌库里的歌暂时不锁，硬盘上的单个文件已经锁）。
 *  解锁只在人点门上的钮 / 歌库菜单时发生（test/edit-lock-guard.test.mjs）。 */
let loadingDoc = false;
const lock = createEditLock({
  store: () => (hasStore() ? (requireStore().files as unknown as LockStore) : null),
  home: () => (H.home.kind === "gallery" ? { kind: "gallery", identifier: H.home.identifier } : H.home.kind === "file" ? { kind: "file", handle: H.home.handle } : { kind: "none" }),
  createPending: () => es.createPending(),
  loading: () => loadingDoc,
});
/** 有没有要存的改动：锁着时「只动了看法」（隐藏了一段）不算——那时候一个字节都不写，离开也不问；解锁那一刻它自然又算（脏是比出来的）。顶栏的「•」照旧看 D.dirty()（老实）。 */
const owesSave = (): boolean => D.dirty() && !(lock.locked() && D.dirtyKind() === "looks");

// ── 这台设备上记着的渲好的声音（src/app/render-cache.ts；2026-11-10，Claude Fable 5.2）────────────────────────────────────────
//   定稿退役之后，「内容没变再导出不用等」「歌库封面上直接听 / 锁屏放」都靠它。user 11-09：「完全不应该保管理 MP 三」「软件在设备上记着不就行了？…相当于记着的是缓存同意」；
//   11-10：「对，以后统一不存mp3，旧的也删掉」「以及本地歌缓存？最好能有锁屏播放？这样我可以听歌」。清了能重来（三等：可再得），不同步，不进歌库的文件列表。
const RENDER_KEEP = 20;   // 最近用过的 20 首，超了丢最久没用的（user 11-09「同意」）
const renders = createRenderCache(idbRenderStore(), { max: RENDER_KEEP, now: () => Date.now(), report: (e) => reportError(e, "log") });
/** 歌库里的歌按家分开记（同名的歌在两个家里不是一回事）。和 src/gallery-host.ts 的 storeKey 是同一个算法（它那边的缩略图 / 事实也这么分）。 */
const homeKey = (): string => folderHome()?.id ?? "default";
/** 歌库里这首歌的文件此刻的「戳」（本机那份的总目录文本的哈希，每存一次都变）；拿不到 = null。歌库宿主列卡片时算的是同一个 stampOf。 */
async function fileStamp(id: string): Promise<string | null> {
  try { const b = await requireStore().zip(id, { mode: "existing" }).getPeek({ bytesLength: 128 * 1024, zipEntry: MANIFEST_ENTRY, source: "local" }); return b ? stampOf(await b.text()) : null; }
  catch { return null; }
}
const renderKeyNow = (quality: string, parts: readonly string[], title: string): string => renders.keyOf({ fingerprint: contentFingerprintOf(saveArgs()), quality, parts, title });
/** 现在这首、这个音质、整首：设备上记着同一份吗（而且是这一版渲染核心渲的）。只看索引，同步——导出面板上先说一句用。 */
function renderHit(quality: Mp3Quality): RenderMeta | null {
  try { const m = renders.find(renderKeyNow(quality, perfApi.audibleParts().map((p) => p.id), D.st.song.title || docName())); return m && m.core.hash === coreInfo().hash ? m : null; }
  catch { return null; }
}
/** 导出 / 分享要的那一份：内容、音质、声部、歌名都一样，而且是这一版渲染核心渲的（核心变过 = 重渲换掉；歌库里听不挑这个）。 */
async function takeRender(o: { quality: Mp3Quality; parts: readonly string[]; title: string }): Promise<{ bytes: Uint8Array; secs: number; kbps: number; stereo: boolean; roles: string[] } | null> {
  await renders.ready();
  const key = renderKeyNow(o.quality, o.parts, o.title), m = renders.find(key);
  if (!m || m.core.hash !== coreInfo().hash) return null;
  const got = await renders.take(key); if (!got) return null;
  void linkRenderNow(key);
  return { bytes: got.bytes, secs: m.secs, kbps: m.kbps, stereo: m.stereo, roles: m.roles };
}
/** 刚渲好的一份记下来。记不进去（配额 / 隐私模式）= 报进黑匣子、回 false，不拦导出。 */
async function keepRender(o: { quality: Mp3Quality; parts: readonly string[]; title: string; roles: string[]; secs: number; kbps: number; stereo: boolean; loop: { start: number; end: number } | null }, tagged: Uint8Array): Promise<boolean> {
  try {
    const m = await renders.put({ fingerprint: contentFingerprintOf(saveArgs()), quality: o.quality, parts: [...o.parts], roles: o.roles, secs: o.secs, kbps: o.kbps, stereo: o.stereo, ...(o.loop ? { loop: o.loop } : {}), title: o.title, app: APP_VERSION, core: coreInfo() }, tagged);
    void linkRenderNow(m.key);
    return true;
  } catch (e) { reportError(e, "log"); diagNote("render-cache", `not kept: ${(e as Error)?.message ?? e}`); return false; }
}
/** 歌库里的歌、手里没有没存的改动（文件 = 眼前的内容）：把这条记录挂到这首歌的名下，歌库封面上的 ▶ 才认得它。有没存的改动 = 等下一次存完（relinkAfterSave）。 */
async function linkRenderNow(key: string): Promise<void> {
  const h = H.home; if (h.kind !== "gallery" || D.dirty()) return;
  const stamp = await fileStamp(h.identifier); if (!stamp) return;
  if (await renders.link(homeKey(), h.identifier, key, stamp)) gallery?.invalidateFacts(h.identifier);
}
/** 歌库里的歌存完之后：这次存下去的内容有记着的声音 = 按新的文件戳重新挂名；没有 = 挂名留着、戳对不上 = 歌库里认作「旧」（v0.16.101 起；之前是摘名）。 */
async function relinkAfterSave(name: string, fingerprint: string | null): Promise<void> {
  if (!fingerprint) return;
  await renders.ready();
  const m = renders.latestFor(fingerprint), home = homeKey();
  if (!m) return;   // 内容变了、这份新内容没渲过：挂名留着（字节还是上次那遍）= 歌库里标「旧」、照样能听（v0.16.101；user 11-11 问「渲染如果dirty的话应该自动删还是报警？」→ 不删、不报警，标出来）
  const stamp = await fileStamp(name); if (!stamp) return;
  if (await renders.link(home, name, m.key, stamp)) gallery?.invalidateFacts(name);
}
/** 光标所在的声部 / 它的角色 id（歌手牌、找人、试听都对着它）。 */
const curPart = (): PartDef => D.st.song.parts.find((p) => p.id === D.st.at.part) ?? D.st.song.parts[0];
/** 光标所在声部台上那位不认的记号（谱上画灰；写的时候说一声；user 2026-10-08 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。 */
const ignoredFor = (role: string): Mark[] => { const sp = activePerfSpec(D.extras, role); return sp ? ignoredArts(performerOf(activeInstrument(D.extras, role)?.engine), sp.gapSec, sp.canSwell) : []; };   // 没人上场 = 整个声部本来就不出声，不逐个画灰
/** 台上这位不认的踏板（插件能力 pedals；11-1）：交给排版画灰，记成「pedal:<种类>」。没人上场 = 不逐个画灰（同演奏法）。 */
const pedalIgnoredFor = (role: string): string[] => { const pl = performerOf(activeInstrument(D.extras, role)?.engine); return pl ? PEDAL_KINDS.filter((k) => !pl.pedals?.includes(k)).map((k) => `pedal:${k}`) : []; };
const ignoredHere = (): Mark[] => ignoredFor(curPart().role);
const MARK_NAME: Record<Mark, string> = { ...ART_NAME, slur: _t("连线"), swellGrow: _t("音内渐强 / 鼓起"), swellFade: _t("音内渐弱"), inhale: _t("出声的换气") };
/** 刚写上了一个台上那位不认的记号 → 明说（照样写进谱、画灰，出声不受影响）。连线 / 保持在「本来就不留缝」的人那里也是这样（连断，2026-10-08）。 */
function discloseArt(prev: EditorState, a: Mark): void {
  if (!ignoredHere().includes(a)) return;
  const rollOk = (t: Token) => a === "swellGrow" && t.kind === "note" && (t.art ?? []).includes("roll") && !ignoredHere().includes("roll");   // 滚奏的音上音内起伏能演（7-N）：不算「不认」
  const has = (t: Token) => t.kind === "note" && !rollOk(t) && (a === "slur" ? !!t.slur : a === "inhale" ? !!t.inhale : a === "swellGrow" ? swellOf(t) === "<" || swellOf(t) === "<>" : a === "swellFade" ? swellOf(t) === ">" : (t.art ?? []).includes(a as Art));
  const n = (s: EditorState) => tr(s).filter(has).length;
  if (n(D.st) <= n(prev)) return;
  const role = curPart().role, who = activeCandidateName(D.extras, role) || _t("台上这位");
  const why = whyIgnored(performerOf(activeInstrument(D.extras, role)?.engine), a);
  info(why === "decay" ? _t("{who}的音按下去就自然衰减，{p}做不到：写在谱上了（画灰），出声不变；音内渐弱照做", { who, p: MARK_NAME[a] })
    : why === "sung" ? _t("{who}本来就连着唱：{p}写在谱上了（画灰），出声不变；要断句用呼吸", { who, p: MARK_NAME[a] })
    : why === "gap" ? _t("{who}本来就不留缝（乐器页「音和音之间」= 0）：{p}写在谱上了（画灰），出声不变", { who, p: MARK_NAME[a] })
    : _t("{who}不认{p}：写在谱上了（画灰），出声不受影响", { who, p: MARK_NAME[a] }));
}
/** 刚写的力度记号 / 强后即弱让一个力度记号不起作用了（紧跟着的音是 fp：音头按 f、随后落到 p）→ 明说（照写、画灰；2026-10-09 user「要不要按纪律把 mf 画灰、说一句？ 要」）。 */
function discloseDynOverride(prev: EditorState): void {
  const toks = tr(D.st), now = dynOverridden(toks);
  if (now.size <= dynOverridden(tr(prev)).size) return;
  const v = [...now].map((i) => toks[i]).find((t) => t.kind === "dyn");
  info(_t("这个 {p} 不起作用（画灰）：后面那个音是强后即弱（fp），音头按 f、随后落到 p", { p: v && v.kind === "dyn" ? v.value : _t("力度记号") }));
}
const curRole = (): string => curPart().role;
/** 声部的显示 / 出声状态：隐藏（不画）、静音、独奏——这次打开里有效，不进文件（user 2026-10-08「不同的声部视图和出声应该分别可以solo和hide」）。 */
//   两根轴同一套语法（user 2026-10-08「display有hide 和show only， play有mute和solo。这两个的逻辑关系你理一个好的」）：每根轴 = 一个「关掉」旗（隐藏 / 静音）+ 一个「只要这些」集合（只看它 / 独奏）；
//   有「只要」时旗子不看，关掉「只要」就回到旗子；两根轴互不影响（隐藏的声部照样出声）。隐藏不是消失：谱上缩成一条细行。
const partView = new Map<string, PartViewState>();
const pv = (id: string): PartViewState => partView.get(id) ?? { hidden: false, only: false, muted: false, solo: false };
const setPv = (id: string, patch: Partial<PartViewState>) => partView.set(id, { ...pv(id), ...patch });
/** 谱上缩成一条细线的（= 没在显示：自己隐藏着，或者别人在「只看」、它不在里面；isShown 的反面）。 */
const stubbed = (id: string): boolean => !isShown(id);
/** 点细线 = 放出来：有人在「只看」= 把它也加进「只看」；否则 = 取消隐藏（v0.16.17：小卡里不再有「显示」）。 */
function showPart(id: string): void {
  if (D.st.song.parts.some((p) => pv(p.id).only)) setPv(id, { only: true }); else setPv(id, { hidden: false });
  afterViewChange();
}
/** 显示：有「只看它」的只显示那些，否则显示没隐藏的。 */
const isShown = (id: string): boolean => { const only = D.st.song.parts.some((p) => pv(p.id).only); return only ? pv(id).only : !pv(id).hidden; };
/** 显示 / 存档用的名字：填了歌名用歌名，没填用文件名主干。 */
/** 文件名（user「用歌名可以，然后也要yyyymmdd规则。之后各管各的同意」）：没存过 = 年月日-歌名（没歌名 = 年月日-四位随机 = doc.stem）；
 *  存过 / 打开的 / 改过名的 = 定下来（named），和纸上的歌名各管各的；改文件名在文件菜单。 */
const docName = () => H.name();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const bar = $("bar"), scoreEl = $("score"), padEl = $("padPanel");
// 提示（toast）放在谱那一块的底边居中（v0.10.23；user「待会：info error的弹窗和控制条也撞车」：原来顶栏下面横着居中，长的报错压住左上的挂签 / 混音台的顶条）：
//   竖屏 = 键盘上面（不盖键）、横屏 = 谱那一块的下边；谱被盖着（歌库）= 照库的默认（屏幕底下居中）。开着对话框时库自己挪到顶上（docked-top），不管
{ const de = document.documentElement;
  const placeNotices = () => { const r = scoreEl.getBoundingClientRect(); if (r.height < 80) { de.style.removeProperty("--notice-bottom"); de.style.removeProperty("--notice-x"); return; }
    de.style.setProperty("--notice-bottom", `${Math.round(Math.max(12, innerHeight - r.bottom + 60))}px`); de.style.setProperty("--notice-x", `${Math.round(r.left + r.width / 2)}px`); };
  if (typeof ResizeObserver === "function") new ResizeObserver(placeNotices).observe(scoreEl);
  addEventListener("resize", placeNotices); placeNotices();
  // 提示条不挡点得到的东西（施工单第五节，统筹 2026-11-12；起因 = 小卡开着时「试听不了」的提示条压住小卡中间那排钮，测试里撞上两次）：
  //   非模态的小卡 / 小菜单（.track-card，点外面就收的那种）开着时，提示条摆的时候躲开它们：先挪到它们上面，放不下挪到下面；
  //   还躲不开 = 提示条上没有按钮的部分让点击穿过去（.notice-through）。模态面板（.offer）照旧（styles.css 那条：挪到顶上）。
  const dodgeNotices = () => {
    const stack = document.getElementById("noticeStack"); if (!stack) return;
    if (stack.dataset.dodged) { stack.style.removeProperty("top"); stack.style.removeProperty("bottom"); delete stack.dataset.dodged; }   // 只撤自己设的（库停靠到顶上时自己写 style.top，不碰它）
    stack.classList.remove("notice-through");
    if (!stack.childElementCount || stack.classList.contains("docked-top") || document.querySelector(".offer:not([hidden]), .wbe-panel")) return;   // 模态面板（.offer / 面板外壳 .wbe-panel）开着 = 照 styles.css 那条挪到顶上
    const cards = [...document.querySelectorAll<HTMLElement>("body > .track-card, .popup-menu:not(.hidden)")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);   // 小卡 / 小菜单 + 开着的下拉列表
    if (!cards.length) return;
    const hit = (s: DOMRect) => cards.some((c) => s.left < c.right && s.right > c.left && s.top < c.bottom && s.bottom > c.top);
    const s0 = stack.getBoundingClientRect(); if (!hit(s0)) return;
    const m = 8, h = s0.height, top = Math.min(...cards.map((c) => c.top)), bottom = Math.max(...cards.map((c) => c.bottom)), ceil = bar.getBoundingClientRect().bottom;
    if (top - m - h >= ceil) { stack.dataset.dodged = "1"; stack.style.top = "auto"; stack.style.bottom = `${Math.round(innerHeight - top + m)}px`; }
    else if (bottom + m + h <= innerHeight - m) { stack.dataset.dodged = "1"; stack.style.bottom = "auto"; stack.style.top = `${Math.round(bottom + m)}px`; }
    if (hit(stack.getBoundingClientRect())) stack.classList.add("notice-through");
  };
  // 什么时候重算：提示来了 / 走了（提示栈的子节点）、小卡 / 小菜单开了 / 关了（挂在 body 上的子节点）、窗口变了。不看整棵树（谱面一直在变）
  let watched: Element | null = null;
  const stackObs = new MutationObserver(() => dodgeNotices());
  new MutationObserver(() => { const st = document.getElementById("noticeStack"); if (st && st !== watched) { watched = st; stackObs.observe(st, { childList: true }); } dodgeNotices(); }).observe(document.body, { childList: true });
  addEventListener("resize", dodgeNotices);
  addEventListener("click", () => requestAnimationFrame(dodgeNotices), true); }   // 下拉列表是换 class 开的（不加子节点）：每次点完下一帧再看一眼
/** 参考窗（v0.8，2026-10-08 深夜 Opus 5.5；src/app/reference-host.ts 是唯一认识库的地方）：截图 / 文字放在旁边对着打谱。
 *  卡片进文件（加 / 删 / 挪 = 标脏，不进撤销）；窗的位置 = 视图态（desk.ref）。底边地板 = 竖屏时 pad 那一块（窗的把手不躲到 pad 底下）。 */
const refHost = createReferenceHost({
  info: (t) => info(t), error: (t) => showError(t),
  topFloor: () => Math.round(bar.getBoundingClientRect().bottom),
  bottomFloor: () => { const r = padEl.getBoundingClientRect(); return !padEl.hidden && r.width > innerWidth * 0.6 && r.top > innerHeight * 0.3 ? Math.max(0, Math.round(innerHeight - r.top)) : 0; },
  focusScore: () => scoreEl.focus({ preventScroll: true }),
  askImport: (q) => askRefImport(q),
  onCards: () => { renderTitle(); changed(); },
  canEdit: () => !lock.locked(), onEditRefused: () => lock.flash(),   // 修改锁：参考窗的卡跟着歌存、不进撤销，加 / 删 / 挪也要过同一处；翻页不问
});
new ResizeObserver(() => { refHost.relayout(); syncDock(); }).observe(padEl);   // 键盘换了排数 / 开合 = 重判底座贴底还是贴右边
/** 参考窗导入的问询（库 0.4.0：超过 1 MB 的图片 / 音频 / 视频）：存进歌里 / 压一下（约 X MB）/ 只放内存 / 算了。
 *  user「应用内小面板 如果支持压缩的话应该有压缩选项和估计」；q.suggestRam = 「只放内存」排第一、说为什么——超过 4 MB（user 选 B：「这里可能是全家族仓我们唯一一个真的需要nudge用户」），
 *  或者是音频 / 视频（库 0.5.0 起默认只放内存、当次有效；user 2026-10-21「音视频应该是当此有效」；MoonSinger 照默认不覆盖，要不要例外 = wishlist W-44）。 */
async function askRefImport(q: RefImportQuestion): Promise<RefImportChoice> {
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`, what = q.kind === "audio" ? "mp3 128k" : _t("PNG 256 色、长边最多 2048"), av = q.kind === "audio" || q.kind === "video";
  const big = q.bytes > RAM_ABOVE;
  const smaller = q.canCompress && (q.estimate === null || q.estimate < q.bytes * 0.9);
  const keep: Choice<RefImportChoice> = { label: _t("存进歌里（{bytes}）", { bytes: mb(q.bytes) }), value: "keep" };
  const zip: Choice<RefImportChoice> = { label: q.estimate === null ? _t("压一下再存（{what}）", { what }) : _t("压一下再存（约 {estimate}）", { estimate: mb(q.estimate) }), value: "compress" };
  const ram: Choice<RefImportChoice> = { label: q.suggestRam ? _t("只放内存（推荐）") : _t("只放内存（不存进歌里）"), value: "ram" };
  const msg = _t("「{name}」{bytes}。参考窗里的东西跟着歌一起存、一起同步。{smaller}只放内存 = 这次打开能{p}，不存进歌里；下次打开是个空位，把同一个文件拖进来就补上。{suggestRam}", { name: q.name, bytes: mb(q.bytes), smaller: (q.canCompress && !smaller ? _t("压了也不会更小，就不列了。") : smaller ? _t("压一下 = {what}。", { what }) : ""), p: q.kind === "audio" ? _t("听##动词") : _t("看##动词"), suggestRam: (q.suggestRam ? (big ? _t("超过 4 MB 的，存进去这首歌会大这么多、同步也慢，所以先推荐只放内存。") : _t("音频 / 视频默认只放内存（这次打开有效）；要跟着歌走就选「存进歌里」。")) : "") });
  const list = q.suggestRam ? [{ ...ram, primary: true }, ...(smaller ? [zip] : []), keep] : [{ ...keep, primary: true }, ...(smaller ? [zip] : []), ram];
  return (await openChoiceSheet(q.kind === "audio" ? _t("这段音频有点大") : q.kind === "video" ? _t("这段视频有点大") : _t("这张图有点大"), msg, list)) ?? "cancel";
}

new ResizeObserver(() => refHost.relayout()).observe(bar);
installPlatformGuards([scoreEl, padEl], { zoom: (d) => (d === 0 ? view.zoomReset() : d > 0 ? view.zoomIn() : view.zoomOut()) });   // iPad：长按放大镜 / 系统菜单 / 双击缩放（照 WeebPaint）；Ctrl / ⌘ + = / − / 0 = 谱面缩放（2026-10-21）

// ── PWA 壳（2026-10-07 出生）：service worker + 四路更新检测；有新版不强刷，顶上出一条「有新版本 · 刷新」（不用系统弹窗） ─────
const shell = initPwaShell({ onUpdateAvailable: () => { diagNote("sw", "update available"); showUpdateBar(); }, onBeforeReload: () => flushBeforeReload() });
/** 点「有新版本 · 刷新」：先把手里这首落盘 + 推（≤ 5 s；家族周账 F-147 B）。这是人点的时刻（consent），和切歌 / 退出同一类；自动存和页面隐藏 / pagehide 照旧只落本地（ADR-0016 / 0018，守卫 test/cloud-gate.test.mjs）。推不完也照样重载：字节已落本机，下次开再推。 */
async function flushBeforeReload(): Promise<void> {
  if (H.home.kind !== "gallery" || !hasStore()) return;   // 无地 / 本机文件没有云；改过没存的挽留框照旧
  const t0 = Date.now();
  const push = es.flushAndPush().catch((e) => reportError(e, "warning"));
  // 最多等 5 s（云端挂着也得刷得掉），但面开着这段不算：人正在被问，不许刷掉（工单 H2，Fable 2026-11-03 裁「面开着就不刷」）。
  //   面关了再给 5 s：选了 = 按选的推 / 拉完再刷；取消 = 推很快回来、刷新继续、脏留本地。面在这 5 s 里开过又关了同样重新算。
  let seen = gateGeneration();
  for (;;) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([push, new Promise<void>((r) => { timer = setTimeout(r, RELOAD_PUSH_TIMEOUT_MS); })]);
    clearTimeout(timer);
    if (isGateOpen()) { diagNote("sw", "reload waits: a face is open"); await whenGateClosed(); seen = gateGeneration(); continue; }
    if (gateGeneration() !== seen) { seen = gateGeneration(); continue; }
    break;
  }
  diagNote("sw", `flush before reload: ${Date.now() - t0}ms, push pending=${String(es.isPushPending())}`);
}
function showUpdateBar(): void {
  if (document.getElementById("updateBar")) return;
  const el = document.createElement("div");
  el.id = "updateBar"; el.className = "update-bar";
  el.innerHTML = `<span>${_t("有新版本")}</span><button class="btn primary" data-v="reload">${_t("刷新")}</button><button class="btn" data-v="later">${_t("待会儿")}</button>`;
  el.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (v === "reload") void shell.reload(); else if (v === "later") el.remove();
  });
  document.body.append(el);
}


// 顶栏只有一行（2026-10-07 立；2026-10-08 重理，user「看一下 weebpaint 和 wxhw，wxhw 就是左边一个库的图标，然后是文件名非按钮就是一个能按的字…最右边是加密，smart save 和三条杠」
//   「加密和 smart save button 的 status 必须永远可见」）：左 = 歌库图标 + 文件名（能按的字 = 文件菜单）；右 = 加密状态 / smart save（状态即按钮）/ 三条杠。
//   走带（唱 / 弹 / 录音室 / 进度）在顶栏中间（2026-10-08 试过挂胶囊，user「看着碍眼，还是收到顶栏里面吧」）。
//   键盘开关不在顶栏：pad 自己有「收起」，收起后屏幕最下面一粒「键盘」tab 再弹出来；点谱也弹（user「软键盘的 toggle 可以放在屏幕最下面」）。
/** |▶ 的说明（顶栏和底座边上那个一样）。⋯ 收进长按 / 右键（v0.10.20；user「play的...收到长按和右键play里面 / 然后顶栏只单放一个一样的play」）。 */
const PLAY_TITLE = _t("从起点放 / 停（空格）；连按两下 = 从头放。长按 / 右键 = 接着放 / 自动翻 / 循环 / 从头放 / 接缝。起点 = 长按 / 右键谱面「从这儿放」挪");
bar.innerHTML =
  `<div class="tb-left"><button id="libBtn" class="btn tb-lib" title="${cloudAvailable() ? _t("歌库：歌放在网盘（OneDrive）或你选的文件夹里") : _t("歌库：歌放在你选的文件夹里")}"><svg class="ico"><use href="#music-library"/></svg></button>` +
  `<button id="fileBtn" class="doc-name" title="${_t("文件名 · 点了改名")}"><span id="docTitle" class="title">${_t("未命名")}</span></button>` +
  `</div>` +
  `<div class="tb-mid" id="transport"><button id="playBtn" class="btn play-btn" title="${PLAY_TITLE}"><svg class="ico"><use href="#play-from-start"/></svg></button></div>` +
  `<div class="tb-right"><button id="midiBtn" class="btn tb-midi" hidden>MIDI<span class="midi-dot"></span></button>` +
  `<button id="lockBtn" class="btn tb-lock" title="${_t("这首歌没加密（MoonSinger 这一版还不加密）")}"><svg class="ico ico-sm"><use href="#unlock"/></svg></button>` +
  `<button id="saveBtn" class="btn save-btn" title="${_t("存")}"><svg class="ico"><use href="#floppy-disk"/></svg></button>` +
  `<button id="setBtn" class="btn" title="${_t("菜单：新建 / 打开 / 导出 / 封面 / 声音与署名 / 设置")}"><svg class="ico"><use href="#menu"/></svg></button></div>`;   // 三条杠 = 菜单（同 CatsUp 顶栏；扳手留给「配置这一样东西」，如纸右上角）
/** 渲染进度条（顶栏底边；播放的准备和 mp3 导出共用 renderMix 这一条路）。顶栏的 HTML 写好之后再挂（上面 bar.innerHTML = … 会冲掉先挂的）。 */
const renderBar = new RenderProgress(bar);
const stageEl = $("stage");
const busMuted = new Set<string>();   // 静音的混音轨（v0.10.35，视图态：不进文件、不进 undo；换歌清空）
let dockedSide = 0;
// ── 底座贴底还是贴右边（2026-10-21 下午 user「实在做不到再贴右边。比如只能看到一行谱子」）：贴底后谱面剩的高看不到两行谱 = 贴右边。判断 = workspace.ts sideDock（纯函数），这里只量数、写 #stage 的 data-side；
//    CSS 那一档全挂在 #stage[data-side="right"] 上。量：键盘贴底时的高（露着就量；在右边一栏时先按贴底摆一下再量，同一帧内不画）+ 贴底时谱面自动大小一格几 px（view.spaceAt，和缩放无关）。 ──
let padBottomCache = 0;
const PAD_BOTTOM_FALLBACK = 364;   // 默认排数时量到的（没量过时用）
function padBottomH(): number {
  if (padEl.hidden) return padBottomCache || PAD_BOTTOM_FALLBACK;
  const was = stageEl.dataset.side; if (was) delete stageEl.dataset.side;
  const h = padEl.offsetHeight; if (was) stageEl.dataset.side = was;
  if (h > 0) padBottomCache = h;
  return h || padBottomCache || PAD_BOTTOM_FALLBACK;
}
function syncDock(): void {
  const side = sideDock(stageEl.clientWidth, stageEl.clientHeight, padBottomH(), view.spaceAt(stageEl.clientWidth));
  if (side === sideDocked(stageEl)) return;
  if (side) stageEl.dataset.side = "right"; else delete stageEl.dataset.side;
  studio.relayout(); view.render(); refHost.relayout();
}
addEventListener("resize", () => syncDock());   // 横屏底座在的时候，舞台里谱面以外占的宽（px；排谱宽度不跟着底座开合跳，见 view 的 layoutWidth；v0.10.33）   // 走带（唱 / 弹 / 录音室）在顶栏中间（胶囊试过一轮，user 2026-10-08「播放器胶囊看着碍眼，还是收到顶栏里面吧」）
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const padTab = document.createElement("button"); padTab.id = "padTab"; padTab.className = "btn pad-tab"; padTab.hidden = true; padTab.title = _t("键盘（pad）");
padTab.innerHTML = `<svg class="ico"><use href="#piano-keys"/></svg>`; padTab.setAttribute("aria-label", _t("键盘"));   // 只留图标（v0.16.13，user「键盘旁边不要文字」）：平时钢琴、「听」里推子（= 混音台）；字在提示里
// 底座边上的小条（v0.10.20）：模式四个钮 + |▶ + 撤销 / 重做 + 收起后叫回键盘，贴在键盘边上（竖屏 = 键盘左上角往上挂；横屏 = 键盘左边竖着挂；键盘收起 = 贴屏幕边）——
//   按键盘的时候东西就在手边，鼠标不用上下跑（user「音符词听那个小面版变成靠着键盘 / 加一个按一下弹出键盘的钮…所以竖屏的时候就是左下角，拉着键盘的左上角 / 横屏的时候变成竖排可以吗 /
//   这样按键盘的时候东西就在手边 / 然后走带控制也放这个面版上面 / 就是 play/pause undo redo 音符词听」「尤其是模式条的位置（这个其实蛮重要的，不然鼠标上下跑）」）。位置全在 CSS（grid 区域定位）。
const dockTab = document.createElement("div"); dockTab.className = "dock-tab"; dockTab.setAttribute("role", "toolbar");
//   顺序（v0.16.13，user 11-07「这里顺序变成 play undo redo 选项 键盘，键盘旁边不要文字」）：|▶ · 撤销 · 重做 · 音 / 词 / 听 · 键盘（只图标）
dockTab.innerHTML = `<span class="dock-tr"><button id="dockPlay" class="btn play-btn" title="${PLAY_TITLE}"><svg class="ico"><use href="#play-from-start"/></svg></button>` +
  `<button id="undoBtn" class="btn" title="${_t("撤销（Ctrl / ⌘+Z）")}" disabled><svg class="ico"><use href="#arrow-undo"/></svg></button><button id="redoBtn" class="btn" title="${_t("重做（Ctrl / ⌘+Shift+Z）")}" disabled><svg class="ico"><use href="#arrow-redo"/></svg></button></span>` +
  `<span class="mode-seg" role="tablist" title="${_t("模式：这一下点的是哪一层")}">${MODE_BAR.map((m) => `<button class="btn" data-mode="${m}" role="tab" title="${attr(MODE_TITLE[m])}" aria-label="${attr(MODE_LABEL[m])}">${iconHtml(MODE_ICON[m])}</button>`).join("")}</span>`;
dockTab.append(padTab);
stageEl.append(dockTab);
padTab.addEventListener("click", () => showPad(ws.mode === "listen" ? !studio.isOpen : padEl.hidden));
// 挂签（v0.10.3）：模式四个钮 + 看哪一段 + 看哪位歌手，从顶栏底下往下挂、浮在谱上（可以挡住谱）。
//   user 2026-10-10「模式切换不是下拉，回到之前的四个排一起的按钮，然后模式切换，曲段和声部选择这三个不是在顶栏，而是顶栏下面创建一个类似tab的往下的东西，可以遮挡屏幕」
//   （v0.10.2 那版 = 三个下拉挤在顶栏左上角，user 原话「我希望有一个快速选择看全部或者哪个曲段，以及快速看全部或者哪个声部的下拉框」「模式收到下拉框里面」）。
const viewTab = document.createElement("div"); viewTab.className = "view-tab";
viewTab.innerHTML = dropdownHtml([], "all", { id: "paperSel", cls: "vt-sel", title: _t("看哪一段：全部 / 只看这一段") }) + dropdownHtml([], "all", { id: "partSel", cls: "vt-sel", title: _t("看哪个声部：全部 / 只看这一个") });   // 下拉 = 界面零件库的标准件（7-T）；选项跟着歌在 renderTopSels 里换
mountDropdowns(viewTab);
stageEl.append(viewTab);
// 选区条（2026-10-08 改的手感；src/ui/sel-bar.ts）：有选区时挂在胶囊下面；剪贴板两层 = app 内 token（clip）+ 系统剪贴板一行简谱文字（clipText）
const selBar = new SelBar(stageEl, { verb: (v) => { void selVerb(v); } });
let clip: Token[] | null = null, clipText = "", selSig = "";
let chromeReady = false;
/** 胶囊 / 键盘 tab / 选区条跟着谁在最上面走：歌库开着都藏；找人视图里键盘 tab 照样露（收起了能叫回来；user 2026-10-08「音色预览也应该能toggle键盘，免得没弹出来」）、
 *  选区条藏；录音室里胶囊留着（▶ / 空格都能播）、tab 藏。 */
/** 挂签上「看哪一段 / 看哪位歌手」两个下拉（v0.10.2 起；v0.10.3 搬进挂签）：选项跟着歌（纸 / 歌手的名字）重画，值跟着视图（本段 / 全部、只看它）。 */
let topSelsSig = "";
function renderTopSels(): void {
  const ps = $("paperSel") as HTMLButtonElement | null, qs = $("partSel") as HTMLButtonElement | null; if (!ps || !qs) return;
  const labels = labelsNow(), only = D.st.song.parts.filter((p) => pv(p.id).only);
  const paperOpts = [["all", _t("全部曲段")], ...D.st.song.papers.map((p, k) => [p.id, `${p.name || _t("第 {p} 段", { p: k + 1 })}${p.hidden ? _t("（隐藏）") : ""}`])] as const;
  const partOpts = [["all", _t("全部声部")], ...D.st.song.parts.map((p, k) => [p.id, labels[k] ?? p.id])] as const;
  const sig = JSON.stringify([paperOpts, partOpts]);
  if (sig !== topSelsSig) {
    topSelsSig = sig;
    setDropdown(ps, { items: paperOpts.map(([value, label]) => ({ value, label })) });
    setDropdown(qs, { items: partOpts.map(([value, label]) => ({ value, label })) });
  }
  setDropdown(ps, { value: viewScope === "all" ? "all" : D.st.at.paper });
  setDropdown(qs, { value: only.length === 1 ? only[0].id : "all" });
  ps.hidden = D.st.song.papers.length < 2; qs.hidden = D.st.song.parts.length < 2;   // 只有一段 / 一位 = 不用选
}
function updateChrome(): void {
  if (!chromeReady) return;
  const over = finder.isOpen || instShown() || (gallery?.isOpen() ?? false);   // 乐器页开着：选区条也收（不然盖住乐器页顶条的「← 谱」）
  dockTab.hidden = over;   // 底座边上的小条 / 挂签：乐器页 / 目录 / 歌库盖着谱时收起
  // 小条上的「键盘」= 一直在的开关（v0.10.21；user「小工具条也有键盘展开的功能」）：开着亮、点 = 收起；收着点 = 开（「听」= 混音台）。「词」没有键盘 = 不露
  const dockOpen = ws.mode === "listen" ? studio.isOpen : !padEl.hidden;
  padTab.hidden = ((gallery?.isOpen() ?? false) && !finderShown()) || (!hasKeys(ws.mode) && ws.mode !== "listen");
  padTab.classList.toggle("is-on", dockOpen);
  { const lab = ws.mode === "listen" ? _t("混音台") : _t("键盘"), ic = ws.mode === "listen" ? "#sliders" : "#piano-keys", u = padTab.querySelector("use"); if (u && u.getAttribute("href") !== ic) u.setAttribute("href", ic); padTab.setAttribute("aria-label", lab); padTab.title = `${ws.mode === "listen" ? _t("混音台") : _t("键盘（pad）")}：${dockOpen ? _t("点 = 收起") : _t("点 = 打开")}`; }
  renderTopSels();   // 「词 / 听」没有键盘：不露「键盘」tab
  viewTab.hidden = over || ($("paperSel").hidden && $("partSel").hidden);   // 挂签只剩看哪一段 / 哪位：都不用选 = 不挂
  finder.setPadShown(!padEl.hidden);
  document.querySelector(".ip-pad")?.classList.toggle("is-on", !padEl.hidden);
  const n = D.st.sel ? D.st.sel.to - D.st.sel.from : 0;
  const noKey = n > 0 && isPercPart(D.st.at.part) ? NO_KEY_WHY() : null;   // 打击乐的行：「调内一级」灰着（7-R）
  const sig = `${n}|${!!clip}|${over || studio.isOpen}|${!!noKey}`;
  if (sig !== selSig) { selSig = sig; selBar.update(n, !!clip, over || studio.isOpen, noKey); }
}
function setClip(t: Token[]): void {
  clip = t; clipText = toJianpu(t, fifthsAtSel(D.st));
  void navigator.clipboard?.writeText?.(clipText).catch(() => undefined);   // 系统剪贴板那一层：能贴进聊天；不给写就只有 app 内那层
  updateChrome();
}
/** 贴：系统剪贴板里有别处来的简谱文字就用它（和自己刚写的一样 = app 内那份原 token，连歌词 / 连音都在）；读不到 / 读不懂 = app 内的。 */
async function pasteNow(): Promise<void> {
  let sys = ""; try { sys = (await navigator.clipboard?.readText?.()) ?? ""; } catch { /* 浏览器不给读：用 app 内的 */ }
  let toks: Token[] | null = sys && sys.trim() !== clipText.trim() ? fromJianpu(sys, fifthsAtSel(D.st)) : null;
  if (!toks) toks = clip;
  if (!toks) { info(sys ? _t("剪贴板里的不是简谱（像 1 2 3 | 5 - - 这样的才认）") : _t("剪贴板里没有东西")); return; }
  update(pasteTokens(D.st, toks)); info(_t("贴了 {n} 个", { n: toks.length }));
}
async function selVerb(v: SelVerb): Promise<void> {
  switch (v) {
    case "all": update(selectAll(D.st)); break;
    case "copy": { const t = copyTokens(D.st); if (t) { setClip(t); info(_t("复制了 {n} 个", { n: t.length })); } break; }
    case "cut": { const r = cutTokens(D.st); if (r) { setClip(r.toks); update(r.st); info(_t("剪切了 {n} 个", { n: r.toks.length })); } break; }
    case "paste": await pasteNow(); break;
    case "transpose": if (D.st.sel) openSelMenu(selBarAnchor()); break;   // 选区菜单（移调 / 转调 / 时值…；user「不要用keyboard，而是一个小的上下文菜单」）
    case "delete": if (D.st.sel) update(apply(D.st, { k: "delete" })); break;
    case "clear": if (D.st.sel) update(setCaret(D.st, D.st.sel.to)); break;
    case "forget": clip = null; clipText = ""; updateChrome(); break;
    // 第二排 = 微调（v0.10.1；user「选区多微调同意」）：点了不收、选区留着；音高变了响一下（同选区菜单的移调）
    case "up": case "down": if (D.st.sel) { if (isPercPart(D.st.at.part)) { info(_t("{why}：「调内一级」用不了，用半音 / 八度", { why: NO_KEY_WHY() })); break; } update(apply(D.st, { k: "step", d: v === "up" ? 1 : -1 }, performance.now())); previewEdited(); } break;
    case "sharp": case "flat": if (D.st.sel) { update(apply(D.st, { k: "alter", d: v === "sharp" ? 1 : -1 }, performance.now())); previewEdited(); } break;
    case "octUp": case "octDown": if (D.st.sel) { update(apply(D.st, { k: "octave", d: v === "octUp" ? 1 : -1 }, performance.now())); previewEdited(); } break;
    case "half": case "double": if (D.st.sel) { const nx = apply(D.st, { k: "selscale", f: v === "half" ? 0.5 : 2 }, performance.now()); if (nx === D.st) info(v === "half" ? _t("再短就没有这种时值了") : _t("再长就没有这种时值了")); else update(nx); } break;
    case "dot": if (D.st.sel) { const nx = toggleSelDot(D.st); if (nx === D.st) info(_t("选中的里面没有能加附点的时值")); else update(nx); } break;
  }
  if (v !== "transpose") scoreEl.focus();
}
configureFloors({ toolbarBottom: () => bar.getBoundingClientRect().bottom });

// ── 录音房（src/engine/：音频线程里的走带 / 通道 / TinySoundFont / 元音采样器 / 块回放；按键试听也走它的通道）──────────────────
//   替代原来的元音采样器（主线程 WebAudio）和实时合成器（gm-synth worklet）——2026-10-09 Claude Fable 5.1，实时试听刀 1。
//   试听走通道的增益 / 声像、绕过静音 / 独奏和总轨限幅（user「按键不管solomute同意」「限幅嗯」）；光标处的力度归刀 3。
const engine = new StudioClient(() => singer.unlock(), (ctx) => addWorklet(ctx, "studio-worklet"), () => getBytes("vendor/tsf/tsf-standalone.wasm", { revalidate: true }));   // 起法 / 读口 = threads.ts / resources.ts（备用版 data: 起、老实脚本读；2026-11-03）
let vowelsReady = false, vowelLoading: Promise<void> | null = null;
/** 元音表进录音房（只下载一次；失败了下次重试）。user「选这个乐器就是意图，然后第一下就响」。 */
function ensureVowels(): Promise<void> { return (vowelLoading ??= loadVowelTable().then((t) => { engine.vowels(t); vowelsReady = true; }, (e) => { vowelLoading = null; throw e; })); }
/** 光标那一刻生效的力度（和放的时候同一个状态机 perform.ts dynLevels：力度记号 / 渐强渐弱 / 渐到插值；挂在音上的记号不管）——按键试听用（刀 3；
 *  user「软键盘输入和乐谱里瞎弹时能不能respect这一轨的表情记号…尤其是音量」）。vel = MIDI 力度 0–1（按力度敲的；没写力度记号 = 乐器页的旋钮）；dB = 响度（按音量曲线的小月相 / 元音版：
 *  直接查她的 dB 表、和放的时候同一条（在 dB 上线性、没终点走到表里的下一档；没写力度记号 = 表里的 mf；16-4）。
 *  光标在两个音之间 = 后面那个音的音头；在纸尾 = 前面那个音的尾。 */
function dynAtCursor(role: string): { vel: number; dB: number } {
  const tokens = tr(D.st), i = D.st.sel ? D.st.sel.from : D.st.caret, sp = activePerfSpec(D.extras, role);
  const pick = (m: Map<number, { at0: number; at1: number }>) => { for (let k = i; k < tokens.length; k++) { const l = m.get(k); if (l) return l.at0; } for (let k = Math.min(i, tokens.length) - 1; k >= 0; k--) { const l = m.get(k); if (l) return l.at1; } return null; };
  if (!sp) return { vel: 1, dB: 0 };   // 没人上场：试听台上的那一位自己定（不碰这一路）
  if (sp.path === "velocity") { const v0 = activeVelocity(D.extras, role) * 127, vel = pick(dynLevels(tokens, undefined, sp.dynamicsVel, v0, sp.wedgeStepVel)) ?? v0; return { vel: Math.max(1, Math.min(127, vel)) / 127, dB: 0 }; }
  const dbt = sp.dynamicsDb, dB = pick(dynLevels(tokens, undefined, dbt, dbt.mf, "table")) ?? dbt.mf;
  return { vel: 1, dB };   // 按音量走的：力度只在 dB 上
}
/** 按键试听现在该用谁出声：找人视图 = 试听台上的（GS 预设 / 月读元音）；谱上 = 光标所在那位（SoundFont 走库，别的走元音），走这条通道的增益 / 声像 + 光标处的力度。 */
function auditionTarget(): { inst: AuditionInst; key: (midi: number) => number; vel: number; gainDb: number; pan: number } | null {
  const kana = HUM_KANA[activeHum(D.extras, curRole())];   // 这一位的哼的字（第 16 条 16-3：只在乐手身上）
  if (finder.isOpen) {
    if (auditionMute) return null;   // 点开的那件没人能演 = 不出声（F-210）
    const a = audition;
    if (a) return { inst: { kind: "sf", sha: a.sha256, preset: engine.presetIndex(a.sha256, a.bank, a.program) }, key: (m) => sfKey(m, a), vel: TEMPLATE.lounge.soundfontDefaults.velocity, gainDb: 0, pan: 0 };   // 试听台上还没上场的乐器：按出厂的力度
    return { inst: { kind: "vowel", kana }, key: (m) => m, vel: 1, gainDb: 0, pan: 0 };
  }
  const part = D.st.song.parts.find((p) => p.id === D.st.at.part), ch = part ? channelOf(part) : { gainDb: 0, pan: 0 }, dyn = dynAtCursor(curRole());
  // 谁出声、怎么出 = 台上那位的插件（SoundFont 走库 + sfKey、人声走元音表；ADR-0004）；通道的增益 / 声像是轨的事，胶水加
  const t = performerOf(engineNow())?.audition?.({ extras: D.extras, role: curRole(), kana, dyn, engine, ensureBank: () => { void prepareBank(); } });
  return t ? { ...t, gainDb: ch.gainDb + t.gainDb, pan: ch.pan } : null;
}
/** 月读的按键试听（弹 / 写音 / 拖音高的预听）= 元音表（v0.10.43；user「月读的即兴keyboard还是卡…我发现它还是每次按键的时候算一下」「月读预览应该是每种哼法只有一个cache」
 *  「而不是一个音高一个长度cache一下」「预览时这样，不过播放的时候还是完全版的」）：完全版也走 auditionTarget 的元音那条路——表是月读自己离线预渲的
 *  （scripts/gen-preview-vowels.mjs：每种哼法 ら / ん / う / お / あ 各 7 个锚音 A3–D♯5、隔小三度，按住循环颤音整周期），按键不再去 worker 现唱。播放照旧完全版。
 *  原来（刀 3，v0.9.5–v0.10.42）：每按一下让 worker 只唱光标 / 刚写下那个字一秒——iPad 上一条工作道、和预唱抢，按键常常迟到。 */
/** 手感探针（v0.16.23，Claude Fable 5.1；来龙去脉在 src/app/feel-probe.ts 头注释）：超标 = 键盘上沿一行小字 + 黑匣子一条；点那行字 = 这次打开不再显示。
 *  「最慢一步」= 分账秒表（perf-trace）里上一次花得最久的那个 span：是键盘重画、谱重画还是顶栏，一眼看出主线程在忙什么。 */
const feelChip = document.createElement("div"); feelChip.className = "feel-chip"; feelChip.hidden = true; document.body.appendChild(feelChip);
// 横幅 = 一行字（点 = 收起 / 清掉）+ 起来时多算超过 30 ms 时后面一颗「重启声音」（和设置里那一颗同一个动作；施工单「手感横幅照实说」，2026-11-12）
const feelMsg = document.createElement("button"); feelMsg.type = "button"; feelMsg.className = "feel-msg"; feelChip.appendChild(feelMsg);
const feelRevive = document.createElement("button"); feelRevive.type = "button"; feelRevive.className = "btn feel-revive"; feelRevive.textContent = _t("重启声音"); feelRevive.hidden = true; feelChip.appendChild(feelRevive);
// 点一下 = 收起这一次（user 11-08「我把那个点掉之后，后面我按键它就不弹出了」「每次慢都能看到它…因为我们现在是 debug」）：原来是「这次打开都不再显示」。
//   下一次再晚（探针先收起过一回：数字回到门槛下 5 秒、或 20 秒没按键）照样露。
//   排着的声音多（听到的晚、别的数都正常）= 这行字变成「点这里清掉」：点 = flushAudio（要在点按里做），不收起，接着看排队的数掉没掉（v0.16.28）。
let feelMuted = false, feelText = "", feelFlush = false, feelRv = false;
feelMsg.addEventListener("click", () => { if (feelFlush) { flushAudio("tap"); feelText = ""; return; } feelMuted = true; feelChip.hidden = true; });
feelRevive.addEventListener("click", () => { feelRevive.disabled = true; void manualRevive("banner").then((ok) => { feelRevive.disabled = false; feelText = ""; info(ok ? _t("声音重启了") : _t("换过了，但声音设备还没起来：再按一次，或者把 app 关掉重开")); }); });
/** 人点「重启声音」（设置里那一颗 / 手感横幅上那一颗，同一个动作）：黑匣子记点之前这次起来时多算了多少、点之后新的那一次多算了多少（新的那一次起来后约 0.6 s 才量定，后台等最多 4 s）。 */
function manualRevive(from: "settings" | "banner"): Promise<boolean> {
  const before = audioStartBurst(); diagNote("audio", `revive by hand (${from}): start burst before ${before.ms ?? "?"} ms`);
  warmAudio();   // 还没出过声 = 先建、先叫醒（这一下在点按的手势里）
  const t0 = performance.now(), after = (): void => { const a = audioStartBurst(); if (a.seq !== before.seq) diagNote("audio", `revive by hand (${from}): start burst after ${a.ms ?? "?"} ms`); else if (performance.now() - t0 < 4000) setTimeout(after, 100); else diagNote("audio", `revive by hand (${from}): no new start measured within 4 s`); };
  setTimeout(after, 100);
  return reviveAudio("manual");
}
const KV_FEEL_ALWAYS = "feel-always";   // 设置 → 开发者：显示手感数字（默认关）。关 = 永不显示，晚了也不弹（user 11-08「关掉的时候就是一直不显示，而不是慢了会弹出来」）；黑匣子照记
let feelAlways = false;
// 垫脚（src/singer/audio.ts ⑥）：iPad 才用（冷启动多算声音只在那儿量到过；电脑上起得干净）；设置 → 开发者能关着对照。还没证实，证实了再把开关拿掉。
//   必须在第一次碰声音之前定下来（开机时别的代码一碰声音就会去叫醒它）；网址里 ?primer=1 / ?primer=0 = 强开 / 强关（测试用：电脑上平时不开）。
/** 自带的库「你删了」的记号（v0.17.25，统筹「v0.17.24：…删掉的库不许自己下回来」）：app 自己的设备键值，一个库一个；删成功才记、装成功才去掉；
 *  还原出厂跟着清掉（app 自己的命名空间）。有记号 = 用到时不自己下载（小月相 = worker 的 ensurePacks，乐器音色库 = 解析链拿整包那一步），用它的声部进不出声的清单。 */
const KV_LIB_REMOVED = (lib: BuiltinLib) => `lib-removed-${lib}`;
const libRemoved = (lib: BuiltinLib): boolean => deviceKvGet(KV_LIB_REMOVED(lib)) === "1";
function setLibRemoved(lib: BuiltinLib, on: boolean): void {
  if (libRemoved(lib) === on) return;
  deviceKvSet(KV_LIB_REMOVED(lib), on ? "1" : null); diagNote("libs", `${lib} ${on ? "removed by user" : "installed"}`); libsRowSync?.();
  perfApi.refreshIssues();   // 清单跟着变（用到她 / 它的声部挂上或摘掉「不出声」）
}
/** 编辑器的「循环」记在这台设备上（user 2026-11-13；统筹「两个循环记在这台设备上」）：不进歌、不进撤销、不标脏；启动时读回来走 setLoop。歌库播放条的另记一个（gallery-host.ts）。 */
const KV_LOOP_EDITOR = "loop-editor";
/** 「自动翻」开不开、「提前翻」多少秒，也记在这台设备上（统筹「和两个循环同一种做法」，v0.17.42）：点的那一下写、启动时读回来；没点过 = 现在的样子（开着、0.6 秒）。
 *  值：auto-follow = "1" / "0"；turn-lead = 秒数（只认菜单上那几档，别的值不理）。 */
const KV_AUTO_FOLLOW = "auto-follow", KV_TURN_LEAD = "turn-lead";
/** 这台设备的习惯（施工单第 18 条第三版；src/look/habits.ts）：看什么谱、要不要移调辅助、中央 C 叫 C 几，设备键值里各记各的（habit-notation / habit-transpose-aid / habit-middle-c），
 *  不同步、不进歌。歌里某一项是「跟着软件」时照它；没选 = 软件的默认。读一次记在这里，设置里 / 卡上改了换一份（lookOf 一帧调很多次，不每次读设备）。 */
let habitCtx: LookContext = { habits: habitsFrom(deviceKvGet) };
const lookCtx = (): LookContext => habitCtx;
/** 第 21 条（v0.17.38，统筹 74ea9a53）：一首歌生出来的那一刻（新建 / 别家的谱进门）把「跟着」的那几项写成这一刻的值——有习惯的照习惯、别的照软件当时的默认、谱上的字 = 界面语言；
 *  边距、谱高照旧 "default"。之后这首歌就一直是这个样（改了习惯不跟着变）；页面设置里选「跟着我的习惯」的才跟。 */
const bornSong = (s: Song): Song => stampLooks(s, habitCtx, lang(), "born");
/** 读进来的那一份 → 交给编辑器的歌：别家的谱（不是我们存的）进门照新建办（第 21 条）；我们存的照文件读、一个字不改。打开文件 / 歌库 / 测试的装入都走这一处。 */
const songOfOpened = (o: { song: Song; ours: boolean }): Song => (o.ours ? o.song : bornSong(o.song));
/** 改一样习惯（undefined = 没选）：记进设备 → 换一份 → 画的地方都跟着（谱面、键上的字、页面设置 / 设置开着的那页）。不写文件、不进撤销、不标脏。 */
function setHabit<K extends HabitKey>(k: K, v: LookDefaults[K] | undefined): void { writeHabit(k, v); habitsChanged(); }
/** 这首歌还没真正建出来 = 三样都成立（第 21 条补，统筹 28858491；判断只此一处）：
 *  ① 走新建那条路建出来的（D.newSong：开 app 那一首、loadNewSong）——v0.17.39 补（统筹审 v0.17.38）：没有家的不只是新歌，iPad 上选的文件、别家的谱、有读不进来的东西的打开了也没有家，原来改习惯会把它们换成空白新歌；
 *  ② 没有家（歌库里新建、等着安家的也算）；③ 一笔没动（装入之后没有过任何一次提交，D.touched）。 */
const untouchedNewSong = (): boolean => D.newSong() && H.home.kind === "none" && !D.touched();
/** 设备上的习惯写完之后的唯一出口（卡上的「好」、设置「界面」页那几行都走这里；以后从账号同步来的也走这里）：换一份习惯 → 开着的是还没真正建出来的空白歌 = 照新的习惯重建一遍
 *  （同新建那一条路；不进撤销、不标脏、不出提示）→ 画的地方都跟着。动过的、有家的歌不碰（第 21 条）。 */
function habitsChanged(): void {
  habitCtx = { habits: habitsFrom(deviceKvGet) };
  if (untouchedNewSong()) { const h = H.home; loadNewSong(h.kind === "none" ? h.pendingFolder : null, { stem: H.stem }); diagNote("habits", "rebuilt the untouched new song"); }
  afterHabits();
}
function writeHabit<K extends HabitKey>(k: K, v: LookDefaults[K] | undefined): void {
  deviceKvSet(HABIT_DEVICE_KEY[k], v === undefined ? null : HABIT_CODEC[k].write(v));
  diagNote("habits", `${k} → ${v === undefined ? "none" : String(v)}`);
}
/** 第一次打开问一次（第 18 条；卡 = src/app/panels/habits-card.ts）：这台设备没问过 = 等前面的东西走了再出——同步的冲突面 / 闸、有新版本的条、
 *  别的面板和弹层、还原出厂（它清完会重新载入，载入后照样没问过）。「好」/「以后再说」= 记「问过了」；Esc / 点外面 = 这次收起，下次打开 app 再问。 */
let habitsCard: HabitsCard | null = null;
const habitsAsked = (): boolean => deviceKvGet(HABITS_ASKED_KEY) !== null;
/** 卡上换了语言（v0.17.37，统筹 42d5f807）：语言写进设备、整页重载（界面上的字很多是载入时就定了的，换不了半页）；卡上点着的放在重载的网址里带过去（?card=，
 *  不另外存——不新开设备键），重载完照它把卡再开出来，网址里这一段读完马上抹掉。带的：从哪儿打开的（boot / settings）+ 点着的几样（设备键值的写法，读的时候照样核）。 */
const CARD_DRAFT_PARAM = "card";
const cardDraft: { from: "boot" | "settings"; habits: Habits } | null = (() => {
  const raw = new URLSearchParams(location.search).get(CARD_DRAFT_PARAM); if (raw === null) return null;
  const u = new URL(location.href); u.searchParams.delete(CARD_DRAFT_PARAM); history.replaceState(history.state, "", u.toString());
  let j: { f?: unknown; h?: Record<string, unknown> } = {}; try { j = JSON.parse(raw) ?? {}; } catch { /* 读不懂 = 照没点过开 */ }
  const habits: Record<string, unknown> = {};
  for (const k of HABIT_KEYS) { const s = j.h?.[k]; const v = typeof s === "string" ? HABIT_CODEC[k].parse(s) : undefined; if (v !== undefined) habits[k] = v; }
  return { from: j.f === "settings" ? "settings" : "boot", habits: habits as Habits };
})();
function offerHabitsCardWhenFree(): void {
  const draft = cardDraft;   // 卡上换了语言重载回来 = 不管问没问过，照点着的再开
  if (!draft && habitsAsked()) return;
  const t = setInterval(() => {
    if (!draft && habitsAsked()) { clearInterval(t); return; }
    if (habitsCard || document.hidden || ui.overlay || isGateOpen() || isSheetOpen() || document.getElementById("updateBar") || document.querySelector(".wbe-panel, .offer, .doc-layer")) return;
    clearInterval(t); if (draft) openHabitsCardNow(draft.from, draft.habits); else openHabitsCardNow();
  }, 1200);
}
/** 卡上第一行「语言」（v0.17.37）：和设置里那一行同样三项，各用自己的语言写（不跟着界面翻；「跟系统」两种语言并写）；行名用设置里那个双语的；行首 globe-speech。
 *  选了 = 语言写进设备 → 带着卡上点着的整页重载（见 cardDraft）。 */
const LANG_AUTO_BOTH = "跟系统 · System";   // i18n-keep
function cardLangRow(from: "boot" | "settings"): { html: string; mount(root: HTMLElement, draft: () => Habits): void } {
  return {
    html: setItem(`<svg class="ico hab-lang-ico" aria-hidden="true"><use href="#globe-speech"/></svg>${LANG_LABEL}`, setSel("cardlang", [["auto", LANG_AUTO_BOTH], ["zh", LANG_NAME.zh], ["en", LANG_NAME.en]], langChosen() ?? "auto"), "", "", { "data-i18n-skip": "" }),
    mount: (root, draft) => {
      root.querySelector<HTMLButtonElement>('[data-set="cardlang"]')?.addEventListener("change", (e) => {
        const v = (e.currentTarget as HTMLButtonElement).value, next = v === "auto" ? null : (v as Lang);
        if (next === langChosen()) return;
        saveLang(next); diagNote("habits", `lang → ${v} (card, ${from})`);
        const h: Record<string, string> = {}, d = draft();
        for (const k of HABIT_KEYS) { const x = d[k]; if (x !== undefined) h[k] = (HABIT_CODEC[k].write as (y: unknown) => string)(x); }
        const u = new URL(location.href); u.searchParams.set(CARD_DRAFT_PARAM, JSON.stringify({ f: from, h })); location.replace(u.toString());
      });
    },
  };
}
/** from = boot（第一次打开问一次）/ settings（设置「界面」页「初始设置」那一颗；卡第二版）。从设置里打开的：「以后再说」/ 关掉 = 什么都不改、不动「问过了」，收了回到设置。 */
function openHabitsCardNow(from: "boot" | "settings" = "boot", current?: Habits): void {   // current = 卡上换语言重载回来时点着的（cardDraft）
  const close = () => { habitsCard?.close(); habitsCard = null; ui.closed(close); };
  const gone = () => { habitsCard = null; ui.closed(close); };
  const back = () => { if (from === "settings") openSettings(); };
  ui.open({ k: "sheet", close });
  habitsCard = openHabitsCard({ measure: view.rawMeasure, current: current ?? habitCtx.habits ?? {}, rows: cardRows, lang: cardLangRow(from),
    // 「好」只写卡上摆着的那几样（cardHabitKeys；v0.17.30 收跟进第 1 条：不在卡上的那一样不被清成没选）
    done: (c) => { gone(); for (const k of cardHabitKeys()) writeHabit(k, c[k]); deviceKvSet(HABITS_ASKED_KEY, "1"); diagNote("habits", `ok (${from})`); habitsChanged(); back(); },
    later: () => { gone(); if (from === "boot") deviceKvSet(HABITS_ASKED_KEY, "1"); diagNote("habits", `later (${from})`); back(); },
    dismissed: () => { gone(); diagNote("habits", `dismissed (${from})`); back(); } });
}
const KV_PRIMER = "audio-primer", IS_IOS = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const PRIMER_URL = new URLSearchParams(location.search).get("primer");
setPrimer(PRIMER_URL === "1" || (PRIMER_URL !== "0" && IS_IOS));
const slowestStep = (): string => { const rows = Object.entries(perfReport()).filter(([, v]) => v.n > 0).sort((a, b) => b[1].last - a[1].last).slice(0, 2); return rows.length ? rows.map(([k, v]) => `${k} ${Math.round(v.last)} ms`).join(" / ") : "—"; };
const feel = createFeelProbe({
  audioNow: () => { const c = audioCtxIfAny();
    return c ? { t: c.currentTime, state: c.state, sr: c.sampleRate, queued: audioQueuedMs(), info: `baseLatency ${Math.round((c.baseLatency ?? 0) * 1000)} ms, outputLatency ${Math.round(((c as { outputLatency?: number }).outputLatency ?? 0) * 1000)} ms, ${(navigator as { standalone?: boolean }).standalone || matchMedia("(display-mode: standalone)").matches ? "standalone" : "tab"}, media elements ${document.querySelectorAll("audio, video").length}` } : null; },
  always: () => feelAlways,
  report: (text) => {
    if (!text || !feelAlways) { feelMuted = false; feelText = ""; feelChip.hidden = true; return; }   // 开关关着 = 永不显示（探针照量、黑匣子照记）
    if (feelMuted || (text === feelText && !feelChip.hidden)) return;   // 字没变 = 不碰 DOM（探针每帧都报；别让量手感的东西自己拖手）
    feelText = text; feelMsg.textContent = text; feelRevive.hidden = !feelRv; feelChip.hidden = false;
    const r = padEl.getBoundingClientRect();
    if (r.height > 0) { feelChip.style.left = `${Math.round(r.left + 8)}px`; feelChip.style.top = `${Math.max(0, Math.round(r.top - feelChip.offsetHeight - 4))}px`; feelChip.style.maxWidth = `${Math.max(160, Math.round(r.width - 16))}px`; }
    else { feelChip.style.left = "8px"; feelChip.style.top = ""; feelChip.style.bottom = "8px"; feelChip.style.maxWidth = "calc(100vw - 16px)"; }
  },
  note: (msg) => diagNote("feel", `${msg}; slowest ${slowestStep()}`),
  text: (r, late) => {
    if (!feelAlways) return "";   // 关着 = 不显示，也不白拼这行字（探针超标时每帧都来问）
    const b = feelBanner(r, late, audioStartBurst().ms, late ? slowestStep() : "");   // 字怎么拼 = src/app/feel-text.ts（「声音排队」那一项拿掉了，起来时多算了多少照实写）
    feelFlush = b.flush; feelRv = b.revive; return b.text;
  },
});
const soundsHeld = new Set<string>(); let soundAt = 0;   // 按键试听：哪些来源还按着、最后一次按 / 松是什么时候（空当里清排队要看）
// 单声乐器（小月相 / 元音版 = inst.kind "vowel"）的试听像单音合成器：后按的顶掉前面的，松开后按的、前面那个还按着就回到它（v0.16.53，src/app/mono-voice.ts；
//   user 11-09「两个键同时按有一个不认 即兴 小月相…很难受」→「可以」）。以前引擎多声：两个键一起按 = 两个元音叠着响。写谱那层的 50 ms 护栏（pad-host monoAccept）没动。
let monoStack: MonoHeld<Pitch>[] = [];
const isMonoInst = (t: { inst: AuditionInst }): boolean => t.inst.kind === "vowel";
const sound = {
  down: (p: Pitch, id = "main") => {
    const t = auditionTarget(); if (!t) return; if (t.inst.kind === "vowel" && !vowelsReady) { void ensureVowels(); return; }
    if (isMonoInst(t)) { const r = monoDown(monoStack, id, p); monoStack = r.stack; for (const sid of r.silence) engine.auditionOff(sid); }   // 前面在响的停（只停声，不算松手）
    noteKeyAsleep(performance.now()); singer.unlock(); engine.auditionOn(id, t.inst, t.key(midiOf(p)), t.vel, t.gainDb, t.pan); feel.sound();
    soundsHeld.add(id); soundAt = performance.now();
  },
  glide: (p: Pitch, id = "main") => { const t = auditionTarget(); if (t) engine.auditionGlide(id, t.key(midiOf(p))); },
  up: (id = "main") => {
    soundsHeld.delete(id); soundAt = performance.now(); engine.auditionOff(id); const n = chordVoices.get(id) ?? 0; for (let k = 1; k <= n; k++) engine.auditionOff(`${id}~${k}`); chordVoices.delete(id);
    const r = monoUp(monoStack, id); monoStack = r.stack;
    if (r.back) { const t = auditionTarget(); if (t && isMonoInst(t)) engine.auditionOn(r.back.id, t.inst, t.key(midiOf(r.back.p)), t.vel, t.gainDb, t.pan); }   // 松开的是正在响的、前面还有按着的 = 回到它
  },
  allOff: () => { soundsHeld.clear(); chordVoices.clear(); monoStack = []; engine.auditionAllOff(); },
};
/** 唱下标 i 的音；id = 声音的来源（哪根手指 / 哪个键 / 谱面），复音：不同来源同时响，同一来源新的顶掉旧的。 */
/** 响下标 i 的音：和弦 = 整个和弦一起响（v0.10.18；user「叠音的时候预览的是chord还是之前的旧音啊？」——原来只响 t.pitch 那一个）。
 *  每个和弦音一个来源 id（id、id~1、id~2…；录音房按来源一个声部），sound.up(id) 一起松开。 */
const chordVoices = new Map<string, number>();
const soundTok = (s: EditorState, i: number, id = "main") => {
  const t = tr(s)[i]; if (t?.kind !== "note" || !t.pitch) return;
  sound.up(id);   // 同一个来源上次的和弦先松干净（这次的音少了也不留尾巴）
  sound.down(t.pitch, id); const extra = t.chord ?? []; extra.forEach((q, k) => sound.down(q, `${id}~${k + 1}`)); if (extra.length) chordVoices.set(id, extra.length);
};
/** 先响后写之后的补课（2026-10-17 Fable）：按下那一刻已经按 sounded 响了；写完如果这个音成了和弦 = 只把和弦里多出来的音补响（不重启主音）；
 *  写完主音变了（只选了一个音时 XOR 把按的那个拿掉了）= 按谱上现在的样子重响。 */
const soundAfterWrite = (s: EditorState, i: number, id: string, sounded: Pitch) => {
  const t = tr(s)[i]; if (t?.kind !== "note" || !t.pitch) return;
  if (midiOf(t.pitch) !== midiOf(sounded)) { soundTok(s, i, id); return; }
  const extra = t.chord ?? []; extra.forEach((q, k) => sound.down(q, `${id}~${k + 1}`)); if (extra.length) chordVoices.set(id, extra.length);
};
/** 改了音高之后响一下（user 2026-10-10「按住音的时候应该能听到preview，拖动音高，或者改动yngk的时候也会，但是改时长不会」）：有选区 = 选区里第一个音，否则光标前那个音。 */
function previewEdited(): void {
  const toks = tr(D.st); let i = -1;
  if (D.st.sel) { for (let k = D.st.sel.from; k < D.st.sel.to; k++) if (toks[k]?.kind === "note") { i = k; break; } }
  else for (let k = D.st.caret - 1; k >= 0; k--) if (toks[k]?.kind === "note") { i = k; break; }
  if (i < 0) return;
  clearTimeout(upTimer); soundTok(D.st, i, "score"); upTimer = window.setTimeout(() => sound.up("score"), 350);
}
/** 电脑键盘按下一个音：响 + pad 上那个音高的键亮着（和手指按 pad 一样，松开键才灭）。 */
const keyTok = (s: EditorState, i: number, code: string) => { const t = tr(s)[i]; soundTok(s, i, `key${code}`); if (t?.kind === "note" && t.pitch) pad.showDown(midiOf(t.pitch), `key${code}`); };
/** 写一个音（写 = 光标前那个新音；改 = 被覆盖的那个音 = 旧选中里的第一个音），返回刚写的下标（试听用）。 */
function writeAndLocate(write: (s: EditorState) => EditorState, gesture?: string): number {
  const n = write(D.st); if (n === D.st) return -1;   // 没写成（没有能填的）
  update(n, gesture);
  return D.st.caret - 1;   // 插入 / 填 / 替换写完，光标（写字头）都在刚写的那个音后面
}

let upTimer = 0;   // 点一下响 350 ms 的那个停；新的一下先取消旧的（不然会掐掉新音）
/** 看谱方式「按 C 调看」（v0.16.10）：谱换到 C 调画、每个调号上方写「1=原来的调」；键上大字写谱上画成的名字（第 19 条，原来写级数）。user 11-07「我需要一个残疾人模式…显示的时候…帮我转到 C 大调上面，然后…写一个一等于 F」
 *  「设计里面专门开一个就是 Accessibility 辅助模式的框，这是第一个可选项」「键盘的键位不能动」。
 *  和弦标级数（v0.16.11）：叠音的和弦下面写级数（src/theory/；画在下面那一道，v0.17.34 把原来写的「上方」改对）。user 11-07「我根本看不懂我自己摸的和弦，摸出来是几级和弦，我脑袋根本转不过来」「和弦上标级数…写个深模块…就你自己写」。
 *  谱面分家第三刀（2026-11-11）起这两样是**这首歌的**设置（score.json；读 / 改只走 src/score/song-view.ts，改走 setSongLook = 修改锁的「看法」）。
 *  设备上原来那两个键（device-kv「view-in-c」「chord-tags」）不再读、也不删；不把旧值搬进歌（施工单第三节「3」，user 11-11 夜听过这个后果）。 */
const view = new ScoreView(scoreEl, {
  get: () => D.st,
  set: (n, o) => update(n, o?.gesture),
  // ② 怎么画、画什么（谱面分家第二刀：原来散在宿主上的十几个看法收进这一个对象；第三刀：这首歌自己的设置从歌里读、排版 worker 单拎出来，这里只剩这次打开 / 这台设备的）
  look: {
    parts: () => partViews(),   // 谱前写角色名（乐器的名字不上谱；同名同种带号）；隐藏的不画
    lookCtx: () => lookCtx(),   // 这台设备的习惯（第 18 条）
    autoBars: () => autoBars,
    scope: () => viewScope,
    reflow: () => reflow,
    pages: () => pageFlow && !scrollFlow,
    scroll: () => scrollFlow,
    // 贴右边那一档（底座在右边一栏）：记下底座在时谱面以外占了多宽；底座收起（「词」、键盘收着…）照样按那个宽度排 = 切键盘时谱不突然变大变小（user「切换键盘的时候比如从符号键盘变成文字输入的时候zoom不应该突变」）。贴底（默认）= 底座不占宽，谱宽就是谱宽
    layoutWidth: () => {
      const w = scoreEl.clientWidth, sw = stageEl.clientWidth;
      if (!sideDocked(stageEl)) return w;   // 贴底（默认）：底座在下面，不占宽
      if (stageEl.dataset.dock !== "none") { dockedSide = sw - w; return w; }
      return dockedSide > 0 ? Math.max(200, sw - dockedSide) : w;
    },
    actualSizeByDefault: () => matchMedia("(pointer: fine)").matches && window.innerWidth >= 1440,   // 电脑宽屏默认 100%（user 11-09「电脑屏幕宽屏上应该默认是100%而不是行宽占满」）；平板 / 窄窗口照旧自动   // 缩放按设备记住（物理倍数；null = 自动）；开机 boot 里 restoreZoom 读回来
    rememberZoom: (phys) => deviceKvSet(KV_ZOOM, phys === null ? null : phys.toFixed(3)),
    lyricHint: (i) => lyricHintAt(i),
    lyricReading: (i) => lyricReadingAt(i),
  },
  worker: { url: () => threadUrls("layout-worker")[0] ?? null, failed: (why) => diagNote("layout", why) },   // 在哪儿排：排版 worker（src/render/layout-worker.ts；2026-10-21 音游级延迟那一刀）
  sound: {
    audition: (i, hold) => { clearTimeout(upTimer); soundTok(D.st, i, "score"); if (!hold) upTimer = window.setTimeout(() => sound.up("score"), 350); },
    glide: (i) => { clearTimeout(upTimer); const t = tr(D.st)[i]; if (t?.kind === "note" && t.pitch) sound.glide(t.pitch, "score"); },
    release: () => { clearTimeout(upTimer); sound.up("score"); },
  },
  // ④ 按在什么上了（原来 9 个「点了开菜单」的回调 + focus 并成一个事件）
  press: (e) => {
    switch (e.kind) {
      case "staff": case "text": {   // 五线谱像文本框：点在谱上 / 打开了要打字的框
        const aside = touchLike && e.kind === "text"; if (ws.aside !== aside) { ws.aside = aside; applyWorkspace(); }   // 鼠标键盘范式：打字不让开（没有系统键盘要上来，也就不会「点回谱上又弹出来」，v0.16.89）   // 点谱不再弹键盘（v0.16.55，键盘只手动开合）；打字时让开、点回谱上回到手动设的样子
        return;
      }
      case "part": if (stubbed(e.part)) { showPart(e.part); return; } openTrackCard(e.box); return;   // 缩成细线的（隐藏 / 别人在「只看」）：点它 = 放出来（小卡里不再有「显示」，v0.16.17）
      case "blank": openScoreMenu(e.at, e.row); return;
      case "selection": openSelMenu(e.at); return;
      case "mark": openMarkMenu(e.index, e.at); return;
      case "clef": openClefMenu(e.hit, e.at); return;
      case "header": headerPanel.open(e.paper, e.part, e.index, e.at); return;
      case "chordTag": openChordInfo(e.read, e.at, e.where); return;
      case "credits": openSongPanel("credits"); return;
      case "listen": openListenMenu(e.at, e.target); return;   // 听模式：长按 / 右键 = 从这儿放 / 接着放 / 从头放
      default: { const missed: never = e; void missed; }   // 谱面多了一种「按在什么上」没人接 = 编译不过
    }
  },
  notice: (s) => info(s),
  onAnchors: (L) => overlay?.layout(L, overlayView()),   // 谱面上面那一层（编辑器的钮 / 框 / 提示；刀 1）照着这份排版摆
});
/** 谱面上面那一层（刀 1，2026-11-08；src/ui/score-overlay.ts）：两颗钮、虚线框、曲段控件、纸角钮、「1=C」、空着的提示、合租括号、「隐藏 N」。
 *  原来是排版器画、谱面手势里一条条判的；现在是 DOM，回调都在这一处（施工单 ai-docs/20261108-work-order-display-cut1-overlay.md §3.5：不新加面板）。 */
let overlay: ScoreOverlay | null = null;
function overlayView(): import("../ui/score-overlay.ts").OverlayView {
  const paper = lookOf(D.st.song, lookCtx()).paper;
  return { song: D.st.song, edit: view.rules.edit, marks: view.rules.symbols, onlyPaper: viewScope === "segment" ? D.st.at.paper : null, paperLabel: paper.kind === "other" ? _t("其他纸") : PAPER_LABEL[paper.kind] };
}
const overlayHost: import("../ui/score-overlay.ts").OverlayHost = {
  onPaperMenu: (id) => openPaperMenu(id),
  onPaperAdd: (paper, kind, at) => { if (kind === "paper") { update(addPaper(D.st, paper)); info(_t("新的一段")); } else openAddPartMenu(paper, at); },   // 纸底下的虚线框（v0.16.19 搬家 D）
  onNavFrom: (paper, dir) => navPaperFrom(paper, dir),
  onScopeOf: (paper) => { if (viewScope === "segment" && D.st.at.paper === paper) viewScope = "all"; else { viewScope = "segment"; if (D.st.at.paper !== paper) navPaperTo(paper); } view.render(); },
  onPaper: () => openPaperSheet(),
  onSong: () => openSongPanel(),
  onCredits: () => { showPad(false); openSongPanel("credits"); },   // 作者栏空着时的提示字（有字的作者栏照旧是谱面上点）
  onKeyHint: (paper, part, index, at) => headerPanel.open(paper, part, index, at),
  onLeaveFamily: (paper, host) => view.leaveFamily(paper, host),
  onHidden: (paper, ids, at) => {   // 「隐藏 N」（施工单 §4 第 5 条：隐藏的声部不留空，提醒换成这颗不占位的小标）：点开一列，点谁放出谁（= showPart：有人在「只看」就加进只看）
    const labels = labelsNow(), looks = partLooks();
    const rows = ids.map((id) => { const k = D.st.song.parts.findIndex((p) => p.id === id); return k < 0 ? "" : `<button class="btn ctx-item hid-row" data-v="${esc(id)}"><span class="pm-dot" style="background:${TAB20[looks.colors[k] ?? 0]}"></span>${esc(labels[k] ?? id)}</button>`; }).join("");
    void paper;
    ctxMenu("hidden-list", `<div class="tc-sec">${_t("隐藏着的（点 = 放出来）")}</div>${rows}`, at, (v) => { showPart(v); });
  },
  onFolded: () => openPaperSheet("expr"),
  onTallGroup: () => openPaperSheet("layout"),   // 「有一组比一页高，接到了下一页」（7-V）：开页面设置「版面」页   // 「演奏法和表情：不显示」的淡提示（7-G 重做）：开页面设置「看谱」页、落在那一项
  onHiddenPapers: (ids, at) => {   // 「隐藏 N 段」（v0.16.34）：每段一行 = 名字 + 「去看」（本段视图翻过去）+「放出来」（取消隐藏，能撤销）
    const rows = ids.map((id) => `<div class="hidp-row"><span class="hidp-name">${esc(paperLabel(id))}</span><button class="btn ctx-item" data-v="go:${esc(id)}">${_t("去看")}</button><button class="btn ctx-item" data-v="show:${esc(id)}">${_t("放出来")}</button></div>`).join("");
    ctxMenu("hidden-papers", `<div class="tc-sec">${_t("隐藏着的曲段（不放、不印）")}</div>${rows}`, at, (v) => {
      const id = v.slice(v.indexOf(":") + 1); if (!D.st.song.papers.some((p) => p.id === id)) return;
      if (v.startsWith("go:")) { viewScope = "segment"; navPaperTo(id); view.render(); }
      else { setHidden(id, false); info(_t("「{p}」放出来了（撤销能再藏起来）", { p: paperLabel(id) })); }
    });
  },
};
overlay = new ScoreOverlay(view.overlayRoot, overlayHost);

/** 视图范围（这次打开里有效）：本段 = 一次只看光标所在的纸，‹ › 翻（默认；user「不同曲段应该是不同页，而不是一起显示」）；全部 = 整首（隐藏的纸折叠着）。 */
let viewScope: "all" | "segment" = "segment";
let mp3Quality: Mp3Quality = "standard";   // 导出歌声的音质：跟这首歌走（desk：存时顺手带、不标脏、不进 undo；user「音质配置就是应该也跟着吧」）
let impro = false;
/** 按拍号自动画小节线（默认开；这次打开里有效）。user「自动加小节也是可以toggle的，默认开」 */
let autoBars = true;
/** /2 = 和 Shift 一个逻辑（user「或者/2是类似shift，因为accessibility的issue可能按住不方便，而是和键盘shift的逻辑一样」）：
 *  点一下 = 凑满一份原来的时值再回去（= 两个减半的音 / 休止 / 拉长；user 点头 AI 的答：只管一个会留半拍窟窿，节奏是成对凑整拍的）；
 *  中途挪了光标或拨了长短旋钮 = 取消；350 ms 内连点两下 = 锁住（再点一下解开）；按住写 = 按住期间写的都减半、松手回去。
 *  减半 = 临时把长短基线往短挪一档（旋钮上看得见）；已经最短（三十二分）就不挪；回去 = 挪回一档（中间拨过旋钮 = 照拨过的再挪回一档）。 */
//   锁的规则 = src/keyboard/latch.ts（和升降、渐到同一份，2026-10-15）；这里只剩它的副作用：开 = 长短基线往短挪一档，关 = 挪回来。
let half: Latch = LATCH_OFF, halfShifted = false;
function setHalf(next: Latch): void {
  const was = latchOn(half), on = latchOn(next);
  if (!was && on) { halfShifted = D.st.input.unit > 0; if (halfShifted) update(setUnit(D.st, D.st.input.unit - 1)); }
  else if (was && !on && halfShifted) { halfShifted = false; update(setUnit(D.st, D.st.input.unit + 1)); }
  half = next; pad.showHalf(next.mode);
}
function halfKey(down: boolean): void { setHalf(down ? latchDown(half, performance.now(), 2) : latchUp(half)); }   // uses = 2：两个减半的 = 一份原来的
/** 叠键（pad）= 锁定式（v0.10.5；user「叠音模式也应该只有capslock没有shift，每次都会弄错，所以不要shift模式」+ 键盘 × 选区那套「叠这个字就用来选中上个」→「同意」）：
 *  按一下 = 选中光标前那个音（= 改这个音：音键 XOR、— / ⌫ 长短一步、← → 换邻居）；再按一下 = 回到它后面的光标。没有单次档、没有按住期间。
 *  亮不亮跟着「是不是正在改一个音」（点一个音选中它也亮），pad 自己看 singleSel。 */
function stackKey(down: boolean): void {
  if (!down) return;
  if (!canStack()) { info(_t("「{extras}」是单声乐器，这个声部叠不了音", { extras: roleLabel(curRole()) })); return; }
  if (singleSel(D.st) >= 0) { update(setCaret(D.st, D.st.sel!.to)); return; }
  const tk = tr(D.st); let i = -1;
  if (D.st.sel) { for (let k = D.st.sel.to - 1; k >= D.st.sel.from; k--) if (isTimed(tk[k])) { i = k; break; } }   // 选了好几个 = 改最后那个
  else i = currentIndex(D.st);
  if (i < 0) { info(_t("光标前面还没有音")); return; }
  update(select(D.st, i, i + 1));
}
/** 升降键（pad）：和 Shift 一个逻辑（点一下 = 下一个、350 ms 内连点两下 = 锁、再点 = 关；按住写 = 按住期间、松手回去），
 *  按着上下滑 = 换一种（𝄪 / ♯ / ♭ / 𝄫；user「按是当作shift，滑动是toggle which shift」）。有选中 = 选中的音直接升降（同电脑键盘的 [ ]）。 */
//   锁的状态（once / lock / 350 ms）住在谱的输入态里（song.ts tapAcc / consumeAcc 调 latch.ts 的同一份规则）；这里只管「按住」那一段：按着的时候临时锁住、松手按 latchUp 的规则回去。
let accG: { prior: Pick<InputState, "acc" | "accMode" | "accAt">; latch: Latch; slid: boolean } | null = null;
function accKey(phase: "down" | "slide" | "up", acc: Exclude<Acc, 0>): void {
  if (phase === "down") {
    if (D.st.sel) { update(tapAcc(D.st, acc, performance.now())); accG = null; return; }
    accG = { prior: { acc: D.st.input.acc, accMode: D.st.input.accMode, accAt: D.st.input.accAt }, latch: { ...LATCH_OFF, held: true }, slid: false };
    update(setAccState(D.st, acc, "lock"));   // 按着的时候一直生效（写几个都算）
  } else if (phase === "slide") {
    if (!accG) return;
    accG.slid = true; update(setAccState(D.st, acc, "lock"));
  } else {
    const g = accG; accG = null;
    if (!g) return;
    const back = { ...D.st, input: { ...D.st.input, ...g.prior } };
    if (g.latch.wrote) update(setAccState(back, 0, "off"));                                  // 按住写过 = 松手回去（latchUp 的规则）
    else if (g.slid) update(g.prior.accMode === "off" ? back : setAccState(back, acc, g.prior.accMode));   // 只是滑着换了一种
    else update(tapAcc(back, acc, performance.now()));                                   // 点了一下 = Shift（tapAcc 里 latchDown）
  }
}
/** 写了一个音 / 休止 / 拉长：「只管下一个」的 /2 用掉了（按住的时候不算，松手再回去）；升降键按着的时候记一笔。 */
/** 「/2」开着时的拉长 = 加半份（附点；user 2026-10-08「除2的时候拉长可以出附点吗」——原来拉长不看 /2、照加一整份，却又算进「凑满一份」的两下里）。 */
const withHalf = (c: Command): Command => (c.k === "extend" && latchOn(half) ? { k: "extend", half: true } : c);
function afterWrite(): void { if (accG) accG.latch = latchWrite(accG.latch); setHalf(latchWrite(half)); }
/** 屏幕放不下纸的时候折不折行（默认不折行 = 整张纸按比例缩小；这次打开里有效，不进文件——怎么看，不是谱的内容）。 */
let reflow = false;   // 「弹」（顶栏开关；2026-10-07 user「弹应该放在顶栏」）：音符只唱不写
/** 排法（这次打开里有效；user 2026-10-08「显示法还加一个分页？可以预览打印，要求和之后生成的pdf wysiwyg」）：false = 连续（一张长纸）；true = 分页（按纸高分页、画页框，和以后导出的 PDF 所见即所得）。横卷 = 下面 scrollFlow。 */
let pageFlow = false;
/** 排法「横卷」（v0.9.35；user 2026-10-10「那个无限往右的总谱模式也做一下」）：每张纸一行、无限往右，谱面板横着滚，打字 / 放的时候横着跟，歌手名钉在屏幕左边。和 pageFlow 互斥（横卷说了算）。跟着歌走（desk view.scroll）。 */
let scrollFlow = false;
/** 光标所在声部的乐器能叠音吗（SoundFont = 能；月读 / 元音 / 没人 = 单声，护栏：pad 的叠键灰掉、同时按也只写第一个）。 */
const canStack = (): boolean => performerOf(engineNow())?.poly ?? false;
// pad 一创建就要提示音域（padHint）：它读的状态必须在 pad 之前声明（esbuild 打包后晚声明的 = undefined，开机就崩；2026-10-08 踩过）
let auditionHint: HintRange = null;   // 找人视图里 pad 提示的音域 = 试听台上那位的
let auditionMute = false, auditionGen = 0;   // 找人视图：点开的那件没人能演 = 试听键盘静音（F-210）；auditionGen = 后点的说了算（setAudition）
let catalogNow: Catalog | null = null;   // 目录（找人视图 / 乐器声部的音域要它；第一次用到时载，260 KB）
/** 混音台卡片「乐手 N 处不同」（16-6）：上场那位身上除了「响度」以外和现在的默认不一样的有几处（performers/defaults.ts 一处算）。要问目录、目录没载 = 去载，载好重画混音台。 */
function performerDiffsOf(role: string): number {
  const r = defaultsReport(D.extras, role, catalogNow);
  if (r.pending && !catalogNow) void loadCatalog().then((c) => { catalogNow = c; if (studio.isOpen) studio.render(); }).catch(() => undefined);
  return r.rows.filter((x) => x.id !== "cal").length;
}
const ui = createOverlayRegistry();   // 盖层登记（F-17 第 1 期，2026-10-14）：原来那个「现在开着的面板怎么关」的闭包协议收成一个对象；开新的 = 旧的先关，自己收了只在还是现在这层时清
// 整页在哪（谱 / 乐器页 / 乐器目录）= ui.page（刀 3 之二，2026-10-14）：原来五个各自维护的旗（乐器页开着 / 目录开着 / 只弹着玩 / 关了回乐器页 / 小卡的重画）从这儿推；
//   这里读 ui.page 不读 finder 对象——pad 一创建就画「弹」钮，那时 finder 还没建（同 padHint 的坑）
const instShown = (): boolean => ui.page.k === "inst";
const finderShown = (): boolean => ui.page.k === "finder";
const finderPlayOnly = (): boolean => ui.page.k === "finder" && ui.page.playOnly;
/** 在光标处（有选中 = 选区开头）设谱号 / 调号 / 拍号 / 速度 = 开谱头面板（v0.16.8：四样同一个面板，user 11-07「碰撞箱都是进同一个面板」）；
 *  光标挨着已有的一处 = 改那一处，两个音之间的空地 = 新的一处（选了才插）。pad 符号层「记号」页和空白处小菜单共用。 */
function insertMarkHere(_kind?: string, at?: { x: number; y: number }): void {
  const r = padEl.getBoundingClientRect();
  headerPanel.open(D.st.at.paper, D.st.at.part, D.st.sel ? D.st.sel.from : D.st.caret, at ?? { x: r.left + r.width / 2, y: r.top - 4 });
}
// pad 的宿主 = 翻译层（src/app/pad-host.ts，刀 2 之三）：音键 → 写 / 改 / 叠音观望 / 出声，按键 id → 命令（锁 × 光标 × 选区）/ 插记号 / 菜单，手指与电脑键盘共用的「谁按着」簿记。
//   这里只给它一组访问器；pad 一创建就画，所以它读的状态（padHint、ui.page、autoBars…）都已在上面声明。
let monoHinted = false;   // 单音护栏丢键的提示：这次打开说过没有
/** 键盘总闸（src/app/input-gate.ts；2026-11-09 Claude Fable 5.1）：键盘族的每一下（电脑键盘 run() / 触屏键盘 padHost / MIDI 走 padHost）往谱上写之前都问它。
 *  三个原因现算：歌锁着（修改锁，src/app/edit-lock.ts）/ 在选乐器（乐器目录、乐器页）/ 人自己拔着（「弹」）。这里不存状态。
 *  被挡下 = 「弹」钮晃一下（plugNudge），不弹字。 */
const inputGate = createInputGate({
  locked: () => D.locked() !== null,
  picking: () => finderShown() || instShown(),
  unplugged: () => impro,
  onBlocked: (why) => { if (why === "locked") lock.flash(); else plugNudge(why); },   // 修改锁锁着 = 门闪一下；别的原因 = 「弹」钮晃一下
});
let plugNudgeT = 0, plugNoted: NoWrite | null = null;
function plugNudge(why: NoWrite): void {
  if (plugNoted !== why) { plugNoted = why; diagNote("pad", `keys do not write: ${why}`); }   // 黑匣子里同一个原因只记一次
  const b = padEl.querySelector<HTMLElement>(".impro-pad"); if (!b) return;
  b.classList.remove("nudge"); void b.offsetWidth; b.classList.add("nudge");
  clearTimeout(plugNudgeT); plugNudgeT = window.setTimeout(() => padEl.querySelector(".impro-pad")?.classList.remove("nudge"), 450);
}
const padHost = createPadHost(padEl, {
  // update / writeAndLocate 这两条是 pad 往谱上写的全部出口：各带一道总闸（pad-host 里会写的键自己先问过一遍，这里是兜底——晚到的叠音定时器之类）
  state: () => D.st, middleC: () => lookOf(D.st.song, lookCtx()).middleC, inC: () => inCAtCursor(), update: (n, gesture) => { if (inputGate.may(D.st, n)) update(n, gesture); }, writeAndLocate: (w, gesture) => writeAndLocate((s) => { const n = w(s); return inputGate.may(s, n) ? n : s; }, gesture), afterWrite, previewEdited, info: (m) => info(m), canStack,
  monoRejected: () => { if (monoHinted) return; monoHinted = true; info(_t("「{who}」一次只出一个音：几乎同时按下的第二个键没写。要写和弦，给这个声部换钢琴这类乐器", { who: activeCandidateName(D.extras, curRole()) ?? roleLabel(curRole()) })); },   // 同一次打开只说一次（v0.16.35）   // info / ghostOn 是后面才声明的 const：包一层箭头，别在这儿取值
  sound: { down: (p, id) => sound.down(p, id), up: (id) => sound.up(id) }, soundTok, soundAfterWrite,
  onTouch: (ts) => feel.touch(ts),
  gate: inputGate, finderOpen: () => finder.isOpen,
  toggleImpro: () => toggleImpro(),
  kbSwitch: () => setMode(ws.mode === "symbols" ? "notes" : "symbols"),   // 小键盘顶上「符 / 音」：只换键盘（v0.10.37；模式条上只剩音 / 词 / 听）
  ghost: { on: () => ghostOn(), set: (id, p) => { ghostHeld.set(id, p); }, delete: (id) => ghostHeld.delete(id), sync: () => ghostSync() },
  half: {
    caretMoved: () => setHalf(latchCancel(half)),   // 挪光标 = 取消「凑满一份」（锁住的不动）
    knobTurned: () => { if (half.mode === "once") { half = latchCancel(half); halfShifted = false; pad.showHalf(half.mode); } },   // 拨了旋钮 = 照拨的，取消「凑满一份」（不挪回一档：旋钮说了算）
    key: (down) => halfKey(down), wrap: (c) => withHalf(c),
  },
  accKey, stackKey, discloseArt, discloseDynOverride, ignoredHere,
  hintRange: () => padHint(), staves: () => lookNow(D.st.at.paper, D.st.at.part)?.staves ?? 1,
  autoBars: { get: () => autoBars, set: (on) => { autoBars = on; view.render(); } },
  insertMarkHere, insertGrooveHere: () => insertGrooveHere(), openRepeatMenu: () => openRepeatMenu(), openPedalMenu: () => openPedalMenu(),
  openInsertClefMenu: (at) => openInsertClefMenu(at), openInsertOttavaMenu: (at) => openInsertOttavaMenu(at),
  showPad: (on) => showPad(on),
});
const pad = padHost.pad;
/** 移调辅助在光标这个声部上起不起作用（第 19 条）：这首歌按 C 调看（五线谱、开着）而且光标那个声部不是打击乐的行（打击乐的行排版不换，键上也不换）。 */
function inCAtCursor(): boolean { return lookOf(D.st.song, lookCtx()).inCActive && !notationOfRole(curRole()).perc; }
/** 键上的字跟着这首歌怎么看走（换歌 / 切 / 撤销 / 光标走过转调都在 paintNow 里对一次）：「这个键写什么」在 pad-music keyFaces，键盘的 sig 变了就重写；鬼音符跟着换。 */
let shownInC = inCAtCursor();
function syncSongLook(): void { const inC = inCAtCursor(); if (inC === shownInC) return; shownInC = inC; pad.render(); ghostSync(); }
/** 设备上的习惯变了（第 18 条）：画的地方都跟着——谱面（排版缓存的键里有习惯）、键上的大字 / 鬼音符、键上的音名、开着的面板（页面设置的「跟着软件（现在是：X）」）。 */
function afterHabits(): void { view.render(); syncSongLook(); pad.render(); ui.redraw(); }

/** 「弹」开 / 关（顶栏按钮、电脑键盘的 `）。 */
/** 弹（只响不写）：开关在 pad 第一排「收起」左边（user 2026-10-08「弹这个锁还是放键盘上吧放在第一row，收起键盘的左边」）；快捷键 ` 照旧。找人视图里一直是弹、拨不动。 */
function toggleImpro(): void { if (finder.isOpen || !inputGate.mayToggle()) return; setImpro(!impro); }   // 锁着 / 在选乐器 = 强制拔着，接不回去（钮晃一下）
/** 直接定（换歌时复位用；人拨的走 toggleImpro）。拔着 = 键盘上会写谱的那一排也灰掉（styles.css .pad-panel.is-unplugged）。 */
function setImpro(on: boolean): void { impro = on; syncPlug(); if (on) showPad(true); pad.render(); ghostHeld.clear(); ghostSync(); }
/** 插头现在是不是拔着的样子：人自己拔的，或者歌锁着（修改锁 = 强制拔着、接不回去；user 11-09「即使你被锁着，你键盘还是可以弹的，就可以跟着弹着玩」）。 */
const plugOut = (): boolean => impro || D.locked() !== null;
/** 键盘上会写谱的那一排灰不灰（styles.css .pad-panel.is-unplugged）跟着 plugOut 走。锁态变了也叫（applyWorkspace）。 */
function syncPlug(): void { padEl.classList.toggle("is-unplugged", plugOut()); }
/** 「弹」时正按着的音 → 谱上光标处（叠亮着 = 那个音上）画鬼音符（v0.10.6；user「弹模式下面能不能在谱子上面光标对应的那个地方显示鬼音符？」「鬼音符的时候千万不能动排版！」）：
 *  只是盖在谱上的一层（ScoreView.showGhost），不改谱、不重排。 */
const ghostHeld = new Map<string, Pitch>();
const ghostOn = (): boolean => plugOut() && !finder.isOpen && !instShown();
function ghostSync(): void { view.showGhost(ghostOn() ? [...ghostHeld.values()] : []); }

// ── 撤销 / 重做（src/score/history.ts）：song 每变一次记一份改之前的快照（引用，不拷贝）；gesture = 连续动作（拖 / 连打歌词）并成一步；换歌清栈 ──
// ── 改状态的唯一入口 = D.commit（src/app/document.ts）。下面三个名字只是薄壳（九十多处调用不用改）；锁 / 撤销栈 / 脏都在 D 里一处 ──
/** 这一段这个声部现在怎么画（谱号 / 大谱表 / 自动八度线，v0.16.88 按段算；按歌缓存——同一首歌的状态只算一次）。鼓 / 固定敲一个键的不自动变大谱表（和排版同一条规矩）。 */
let lookCache: { song: Song; map: Map<string, Map<string, ResolvedLook>> } | null = null;
function lookNow(paperId: string, partId: string): ResolvedLook | undefined {
  if (lookCache?.song !== D.st.song) lookCache = { song: D.st.song, map: resolveSongLooks(D.st.song, trackLookOf(D.st.song), new Set(partViews().filter((x) => x.perc || x.xHead).map((x) => x.id))) };
  return lookCache.map.get(paperId)?.get(partId);
}
/** 写入口 / 撤销被修改锁拒了：门已经闪过了（lock.writeGate 里），不弹字；这里把界面摆回真相（滑到一半的推子弹回去）。 */
function onLockRefused(_what: string): void { view.render(); pad.render(); drawInst(); ui.redraw(); if (studio.isOpen) studio.show(); }
/** 曲段的隐藏 / 放出来：修改锁分类表（src/app/edit-lock-table.ts）里的「看法」——锁着也能点（user 11-09「曲段的隐藏和显示锁着的时候当然能解。」），
 *  锁着期间文件一个字节都不写，解锁之后它算一处待保存的改动。**隐藏的调用点只许走这里**（带着 paperHidden 这个类别；test/edit-lock-guard.test.mjs 钉）。 */
function setHidden(paperId: string, hidden: boolean): void {
  D.commit({ st: setPaperHidden(D.st, paperId, hidden) }, { locus: { kind: "paperHidden", label: hidden ? _t("隐藏了这张纸") : _t("取消隐藏这张纸") } });
}
function update(next: EditorState, gesture?: string): void {
  // 自动变出来的大谱表上手动挪了上下行 = 这一段定成手选的大谱表（song.ts toggleStaff，手分的上下行只有手选的存得下）：说一声（v0.16.89）。
  //   谱头面板里直接选大谱表 = 音不动、不说
  const pp0 = D.st.song.papers.find((p) => p.id === next.at.paper), pp1 = next.song.papers.find((p) => p.id === next.at.paper), part = next.at.part;
  const staffs = (t: Token[] | undefined) => (t ?? []).map((x) => (x.kind === "note" || x.kind === "rest" ? x.staff ?? 0 : -1)).filter((x) => x >= 0).join("");
  const fixed = !!pp0 && !!pp1 && !trackLookOf(D.st.song)(pp0.id, part).grand && trackLookOf(next.song)(pp1.id, part).grand && staffs(pp0.tracks[part]) !== staffs(pp1.tracks[part]);
  const c = D.commit({ st: next }, { gesture });
  if (fixed && c.ok) info(_t("这一段定成了大谱表（手动分的上下行要存得下）；想回到自动，点行首谱号选「自动」"));
}
/** 每张纸（曲段）开头没写力度的补上（song.ts ensureStartDyns：补的是那里本来就生效的那个）；补在光标那条、光标前面 = 光标挪到它后面（接着写的音在力度后面）。 */
function withStartDyns(s: EditorState): EditorState {
  const r = ensureStartDyns(s.song, s.nextId); if (!r.added.length) return s;
  noteStartDynsFilled(r.added.length);   // 这首歌开的时候就缺的那几处，第一次补上时说一句（一首歌一次；第 16 条：开歌不补，人改谱时补）
  let caret = s.caret, sel = s.sel;
  for (const a of r.added) if (a.paper === s.at.paper && a.part === s.at.part) { if (a.index <= caret) caret++; if (sel) sel = { from: sel.from + (a.index <= sel.from ? 1 : 0), to: sel.to + (a.index < sel.to ? 1 : 0) }; }
  return { ...s, song: r.song, nextId: r.nextId, caret, sel };
}
/** 改歌以外、但进文件的东西（休息室 / 麦克风 / 封面）→ 同一条 undo（user 2026-10-08「undo 同意啊」「每一步快照带 locus 同意」）。locus = 这一步的人话；gesture = 连续动作（推子）并成一步。 */
function updateExtras(next: Extras, locus: Locus, gesture?: string): void { D.commit({ extras: next }, { locus, gesture }); }
/** 歌和 extras 一起改、算一步（加声部 / 删声部：谱和休息室同时动）。 */
function updateBoth(next: EditorState, nextExtras: Extras, locus: Locus): void { D.commit({ st: next, extras: nextExtras }, { locus }); }
/** 谱换了之后的副作用（原 applyState；D 换好真相再叫）。userEdit = 你在谱上动了（播放几秒内不拽视图，v0.10.12）；撤销 / 重做不算。 */
function afterState(prev: EditorState, next: EditorState, moved: boolean, userEdit: boolean): void {
  if (userEdit && next.song !== prev.song) tellFolded(prev.song, next.song);
  if (next.song.paper !== prev.song.paper || next.song.density !== prev.song.density || next.song.staffMm !== prev.song.staffMm || next.song.marginMm !== prev.song.marginMm) syncDock();   // 换纸 / 密度 = 一行谱的高变了，重判底座贴底还是贴右边
  if (next.song.textLang !== prev.song.textLang && studio.isOpen) studio.render();   // 谱上的字换了语言 = 声部名换了叫法（12-4）：混音台卡片跟着（它平时只在休息室变时重画）
  if (userEdit && (next.song !== prev.song || next.caret !== prev.caret || next.sel !== prev.sel)) view.noteUserEdit();
  if (moved) { sound.allOff(); void prepareBank(); }
  span("changed", () => changed());
  schedulePlaybackRefresh();   // 放着的时候改谱：时间线重算（正在响的不动）
  schedulePrewarm();            // 没在放：停下 700 ms 后先把光标附近唱好
  queuePaint();
}
/** 演奏法和表情不显示（7-G）时，改到了（删、覆盖、改时值连带、删音之后力度的湮灭）/ 新写上了没显示的记号：轻轻说一句是哪一种，同一种这次打开里只说一次（普通提示，不用警告色）。
 *  只在改之前、改之后都是「不显示」时看（切这个开关本身不算）；只比引用变了的轨。撤销 / 重做不走这里（afterRestore）。 */
const foldTold = { gone: new Set<string>(), added: new Set<string>() };
function tellFolded(a: Song, b: Song): void {
  if (lookOf(a, lookCtx()).expressions || lookOf(b, lookCtx()).expressions) return;
  const keys = (ms: FoldedMark[]) => new Map(ms.map((m) => [`${m.tok}|${m.what}`, m.what] as const));
  const gone = new Set<FoldedMark["what"]>(), added = new Set<FoldedMark["what"]>();
  for (const pb of b.papers) {
    const pa = a.papers.find((x) => x.id === pb.id);
    for (const [part, tb] of Object.entries(pb.tracks)) {
      const ta = pa?.tracks[part]; if (ta === tb) continue;
      const ka = keys(foldedMarks(ta ?? [])), kb = keys(foldedMarks(tb));
      for (const [k, w] of ka) if (!kb.has(k)) gone.add(w);
      for (const [k, w] of kb) if (!ka.has(k)) added.add(w);
    }
  }
  const name = (w: FoldedMark["what"]) => (w === "dyn" ? _t("力度记号") : w === "hairpin" ? _t("渐强 / 渐弱") : w === "pedal" ? _t("踏板记号") : w === "slur" ? _t("连线") : SIGNS[w].name(lang()));
  const fresh = (ws: Set<FoldedMark["what"]>, told: Set<string>) => [...new Set([...ws].map(name))].filter((n) => !told.has(n) && (told.add(n), true));
  const g = fresh(gone, foldTold.gone), n = fresh(added, foldTold.added);
  if (g.length) info(_t("改到了没显示的{what}（演奏法和表情现在不显示；撤销能找回）", { what: g.join(_t("、")) }));
  if (n.length) info(_t("写上了，但现在没显示：{what}（页面设置 →「看谱」里打开）", { what: n.join(_t("、")) }));
}
// 画合并到下一帧（2026-10-17 Claude Fable 5.1；量 + 方案 = ai-docs/20261017-input-latency-probe.md）：状态改了这里只排一帧，重排 / 重画 / 标题 / 挂签 / 清单在 rAF 里做一次。
//   出声不等它（pad-host / 电脑键盘先响后写）；快弹几个键落在同一帧 = 只重排一次。谁在这一帧之前就要最新的排版 = view.layoutNow()（歌词框 / 记号框 / head / E2E 钩子）。
//   中途有人显式 view.render() 过（视图开关 / 转屏…）= 这一帧不再画谱，别的照做。
let paintQueued = 0;
function queuePaint(): void { if (!paintQueued) paintQueued = requestAnimationFrame(() => { paintQueued = 0; paintNow(); }); }
function paintNow(): void {
  if (paintQueued) { cancelAnimationFrame(paintQueued); paintQueued = 0; }
  if (!view.paintedFor(D.st)) span("view.render", () => view.renderAsync());   // 排版进 worker（2026-10-21）：现成就画，不现成发出去、回来再画
  syncSongLook();   // 按 C 调看变了 = 键上的大字、鬼音符跟着换（谱面那边重排自己会看歌）
  span("pad.render", () => pad.render());
  span("title", () => renderTitle());
  span("chrome", () => updateChrome());
  span("issues", () => refreshIssues());   // 写了第一个音的声部要是没人上场 = 进清单（§2.2½）；删光了 = 出清单
  renderUndo();
}
/** extras 换了之后的副作用（原 updateExtras 的后半）。 */
function afterExtras(prev: Extras, next: Extras, locus: Locus): void {
  if (prev.thumbnail !== next.thumbnail) coverTouched = true;   // 落盘后让歌库丢掉旧缩略图
  renderTitle(); changed(); renderUndo();
  pushChannels(); schedulePlaybackRefresh(); schedulePrewarm();   // 推子 / 校准立刻进录音房（边放边调）；换人 = 时间线重算
  refreshIssues();   // 换人 = 清单重算（换对了角标自己消）
  pad.render();   // 乐器设置有任何变化都重画一次 pad（重画自己比对，没变 = 不动）：提示音域 / 原速键跟着；谁在弹换了 = 窗口跟过去（v0.16.23：原来只认 lounge 这一种改动，从目录换上、撤销走的不是它 = 提示停在旧乐器上）
  drawInst(); ui.redraw(); updateChrome();   // 歌手名在挂签的下拉里
  if (prev.lounge !== next.lounge) view.render();   // 谱上的声部名 / × 符头跟着休息室（同撤销那条路；2026-11-12 查到：只改休息室的提交原来不重排谱，清掉名字要等谱动一下才变）
}
// 锁着：交给 D（按要翻的那一格问锁：翻的是看法就翻，翻到内容那一格就停、门闪一下；栈空着也由它说）
function undoNow(): void { if (D.locked()) { D.undo(); return; } if (!D.history.past.length) { info(_t("没有可撤销的")); return; } ui.close(); view.lyrics.commitAndClose(); D.undo(); }
function redoNow(): void { if (D.locked()) { D.redo(); return; } if (!D.history.future.length) { info(_t("没有可重做的")); return; } ui.close(); view.lyrics.commitAndClose(); D.redo(); }
let lastUndoText = "";   // 测试钩子看的：最近一次撤销 / 重做的 toast
/** 撤销 / 重做落地（D 已换好 D.st / extras / 栈）：换 extras（选角变了合成器重备）→ 视图跟着 locus 走（那条声部要看得见；纸随快照的 at）→ 换谱 → toast 说明撤了什么
 *  （user 2026-10-08 的顾虑「多按几次会不会静默变你没有监视的页面、曲段」：不会静默——视图跟过去 + 每一下都说一句）。 */
function afterRestore(r: Restored, verb: string, prev: { st: EditorState; extras: Extras }): void {
  if (r.extras !== prev.extras) {
    if (r.extras.thumbnail !== prev.extras.thumbnail) coverTouched = true;
    if (r.locus.kind === "lounge") { sound.allOff(); void prepareBank(); view.render(); }   // 谱上的 × 符头跟着演奏者
    pad.render();   // 撤销 / 重做换回了别的乐器 = pad 的提示和窗口跟着（v0.16.23）
  }
  revealPart(r.st.at.part);
  if (r.st !== prev.st) afterState(prev.st, r.st, r.st.at.paper !== prev.st.at.paper || r.st.at.part !== prev.st.at.part, false);
  if (studio.isOpen) studio.render();
  drawInst(); ui.redraw();
  renderUndo();
  lastUndoText = `${verb} · ${locusText(r.st, r.locus)}`;
  showNotice({ id: "undo", level: "info", text: lastUndoText, autoHideMs: 2500 });
}
/** 撤的那条声部要是被「隐藏」/ 别人的「只看」遮着，先让它露出来（视图跟着 undo 走，不在看不见的地方改东西）。 */
function revealPart(id: string): void {
  if (isShown(id)) return;
  if (D.st.song.parts.some((p) => pv(p.id).only)) setPv(id, { only: true }); else setPv(id, { hidden: false });
}
/** toast 的人话：纸 · 声部 · 改了什么（谱）/ 休息室 · … / 录音室 · … / 封面 · …（只有一张纸 / 一个声部时不啰嗦）。 */
function locusText(at: EditorState, l: Locus): string {
  const k = at.song.papers.findIndex((p) => p.id === at.at.paper), paperName = at.song.papers[k]?.name || _t("第 {p} 段", { p: k + 1 });
  const part = at.song.parts.find((p) => p.id === at.at.part), partName = part ? roleLabel(part.role) : "";
  if (l.kind === "score") return `${at.song.papers.length > 1 ? paperName + " · " : ""}${at.song.parts.length > 1 ? partName + " · " : ""}${l.label}`;
  if (l.kind === "paper" || l.kind === "paperHidden") return `${paperName} · ${l.label}`;
  if (l.kind === "songLook") return `${_t("看谱")} · ${l.label}`;
  if (l.kind === "paperSize" || l.kind === "density" || l.kind === "barNumbers" || l.kind === "lyricFit") return `${_t("版面")} · ${l.label}`;
  return `${l.kind === "lounge" ? _t("休息室") : l.kind === "studio" ? _t("混音台") : _t("封面")} · ${l.label}`;
}
function renderUndo(): void { $<HTMLButtonElement>("undoBtn").disabled = !D.history.past.length; $<HTMLButtonElement>("redoBtn").disabled = !D.history.future.length; }

// ── 播放：月读唱（第一次要加载引擎，之后复用） ─────────────────────────
const singer = new Singer();
singer.noDownload = () => libRemoved("voice");   // 小月相被人删了 = worker 缺包时不自己下载（v0.17.25）
/** 唱 / 导出的进度 = 顶栏走带条旁边的小字（停了就清）。 */
// 顶栏的小状态行撤了（2026-10-10 user「小状态栏不要放在顶栏，这样会让顶栏的按钮重拍…或者就不显示？反正有log，用户也不care，有重要的事情有toast」）：
//   文字进黑匣子（同一句换数字不重复记）；带百分比的（下载）推顶栏底边那条细线（不占位置、不挤按钮）。
let statusLast = "", statusBar = false;
let renderBusyText: ((s: string) => void) | null = null;   // 渲染的进度框开着时，进度字也写进它（v0.16.101）
const progress = (s: string): void => {
  if (s) renderBusyText?.(s);
  const pc = /(\d+)%/.exec(s);
  if (pc) { if (!renderBar.running) { renderBar.start(1); statusBar = true; } renderBar.frac(Number(pc[1]) / 100); }
  else if (!s && statusBar) { renderBar.end(); statusBar = false; }
  const key = s.replace(/\d+(\.\d+)?/g, "#");
  if (s && key !== statusLast) diagNote("status", s);
  statusLast = key;
};
/** 一次性的消息（存好了、已分享…）= toast，3 秒（家族 @internal/workbench-elements 的 notice；错误另见 showError）。 */
const info = (s: string) => { showNotice({ id: "info", level: "info", text: s, autoHideMs: 3000 }); };
/** 报错：红色 toast，带完整原因，点了才收（家族四级 notice 的 error）。user 2026-10-07「替补不能静默替补，需要显示报错」→ 订正「不是显示自动上，而是就是不出声，报错，人类手动换」：
 *  成员上不了场就不出声、报错，换谁由人来（选角是窄接口；谱子不受影响）。 */
function showError(text: string): void { reportError(text, "error"); }   // 唯一漏斗（notice + 黑匣子）
// ── 播放 = 时间线 + 录音房（2026-10-09 Claude Fable 5.1，实时试听刀 1；提案 ai-docs/20261009-realtime-preview-engine-proposal.md）───────────────
//   谱 → 时间线（秒；src/engine/timeline.ts）→ 录音房（音频线程里走带 / 通道 / SoundFont / 元音 / 块回放；src/engine/studio.ts）。
//   月读按句出块（内容键缓存；这一刀仍在开播前把块唱齐，边算边放归刀 2）；从光标放、选一段、循环、边放边调混音、范围尾 / 循环点不切尾音。
//   旧路（整首离线渲染成一条 → AudioBufferSource；循环段渲染两遍；src/audio/mix.ts）已删（user「旧引擎不用留念念旧，只是placeholder，可以大刀阔斧改」）。
const playBtns = (): HTMLElement[] => [$("playBtn"), $("dockPlay")].filter((x): x is HTMLElement => !!x);
const playIcon = (playing: boolean) => { document.querySelector(".finder")?.classList.toggle("is-playing", playing);   // 放着歌的时候目录里的「▶ 听开头」藏起来（v0.16.35；user 11-09）
  for (const b of playBtns()) { b.innerHTML = `<svg class="ico"><use href="#${playing ? "stop" : "play-from-start"}"/></svg>`; b.classList.toggle("is-on", playing); } drawIssueBadges(); if (!playing) progress(""); };   // 一个主键：|▶ 从起点放 / ■ 停（user「先只有一个键」）
// ── 四个出口（ADR-0004 §2.2½；user 2026-10-14「一套机制、四个出口 同意」）：清单住胶水（performance.ts issues），这里画 ① 谱上「不出声」角标 ② |▶ 角上的数字（点它 = 开清单）③ toast 由胶水在清单变了时说 ④ 导出面板一行 ──
let issueParts = new Set<string>(), issueCount = 0;   // 胶水报的最新清单（画角标用；渲染时不去问胶水，免得初始化顺序）
function onIssuesChanged(list: readonly Issue[]): void { issueParts = new Set(list.map((i) => i.part)); issueCount = list.length; drawIssueBadges(); view.render(); }
function drawIssueBadges(): void {
  for (const b of playBtns()) {
    b.querySelector(".issues-badge")?.remove();
    if (issueCount) { const t = document.createElement("span"); t.className = "issues-badge"; t.textContent = String(issueCount); t.title = _t("{issueCount} 条轨不出声：点开看清单", { issueCount }); b.append(t); }
  }
}
// ── 唱歌 / 播放 / 导出的胶水 = src/app/performance.ts（刀 1 之二，2026-10-14）：这里只给访问器，拿回一组函数 + 走带态的 getter ──────────
const perfApi = createPerformance({
  libRemoved,
  labels: () => labelsNow(), roleLabel: (role) => roleLabel(role),
  state: () => D.st, extras: () => D.extras, viewScope: () => viewScope, pv: (id) => pv(id), busMuted: () => busMuted, curRole: () => curRole(), docName: () => docName(),
  engine, singer, view,
  ui: { progress, info, showError, renderBar, playBtns, playIcon, offerFile: (f, t, m) => offerFile(f, t, m), onIssues: (list) => onIssuesChanged(list) },
  sounds: { resolveGmBytes: (g) => sources.resolveGmBytes(g), ensureVowels, soundMemoryBytes, modelBases: () => models.bases() },
  credits: { creditsOf: (roles, rights) => creditsOf(roles, rights), creditsBlock: (lines, title) => creditsBlock(lines, title) },
  renders: { take: (o) => takeRender(o), keep: (o, bytes) => keepRender(o, bytes) },   // 这台设备上记着的渲好的声音（内容没变 = 不重渲）
});
const { humOpt, resetLatencyLog, refreshIssues, playSong, curFlat, songIn, audibleParts, micOf, channelOf, pushChannels, lowestMidiOf, songBpm, performerInfo, renderMixForTest, tickOfCaret, playPause, resumePlay, playFromHere, playFromHead, playSeam, stopPlay, setLoop, schedulePlaybackRefresh, schedulePrewarm, prepareBank, exportRights, exportSong, resourceSnapshot, onSongSwitch, jumpPlaybackToPaper, previewTrack } = perfApi;
if (deviceKvGet(KV_LOOP_EDITOR) === "1") setLoop(true);   // 编辑器的「循环」：上次在这台设备上开着 = 开着、|▶ 上的角标跟着亮（新设备、还原出厂 = 关着）
const BUDGET = perfApi.budget, TURN_LEADS = perfApi.TURN_LEADS;
{ const f = deviceKvGet(KV_AUTO_FOLLOW), l = deviceKvGet(KV_TURN_LEAD);   // 自动翻、提前翻：上次在这台设备上点的（新设备、还原出厂 = 开着、0.6 秒）
  if (f === "1" || f === "0") view.autoFollow = f === "1";
  if (l != null && (TURN_LEADS as readonly number[]).includes(Number(l))) perfApi.turnLead = Number(l); }
/** 焦点在能打字的框里（文字输入 / 多行）：空格归它。推子（range）、下拉、按钮不算。 */
function typingIn(t: EventTarget | null): boolean { const el = t as HTMLElement | null; if (!el) return false; if (el.tagName === "TEXTAREA" || el.isContentEditable) return true; return el.tagName === "INPUT" && !["range", "checkbox", "radio", "button"].includes((el as HTMLInputElement).type); }
/** 混音台上一条轨的 id → studio.json 里那条轨的 id（歌手 = 它的麦克风轨；路由轨 = 自己）。 */
function trackKey(track: string): string { return D.st.song.parts.find((x) => x.id === track)?.mic ?? track; }
function routeName(track: string): string { if (track === "master") return _t("总轨"); const k = D.st.song.parts.findIndex((x) => x.id === track); return k >= 0 ? labelsNow()[k] : studioTrack(D.extras, track)?.name ?? track; }
/** 听模式（2026-10-10 user「还有一个就是播放模式，锁写谱，但是可以调录音室」「我蛮需要播放欣赏的时候防误触的哈哈」）：谱锁住（轻点不跳播、长按 / 右键 = 从这儿放、拖 = 滚动），
 *  pad 收起、键盘只认空格（放 / 暂停）和 Esc（回到写）；录音室照样能开能调。 */
// ── 模式 + 底座（2026-10-10 Opus 5.5；规则表 = src/app/workspace.ts）：音 / 词 / 符 + 听；pad 那个位子 = 底座，放 音键 / 符号格 / 录音室（互斥）。
//   user「模式！音，歌词，强度和articulation！…还有一个就是播放模式，锁写谱，但是可以调录音室」「强度和演奏法能不能合并，就是符号编辑，和别的符号也合并」
//   「录音室的键盘位化，和键盘互相排斥…键盘的模式键是不是能摘下来。好好理一下架构」。applyWorkspace 是唯一把状态落到界面上的地方。
const ws: WorkspaceState = { mode: "notes", collapsed: false, tryout: false };
/** 操作范式（v0.16.89，user 11-10「我的建议是windows都不自动弹，不然难受。ipad的话应该就是有输入意图的时候弹，空歌弹。取决于操作范式」）：
 *  最近一次按下是手指 / 笔 = 触屏范式——有输入意图时键盘自己弹（换到「音 / 符」、打完字点回谱上、打开空歌）；是鼠标 = 鼠标键盘范式——键盘只手动开合，打字也不让开。
 *  还没按过 = 看主指针是不是粗的（iPad 是、电脑不是）。按设备判断不准（iPad 接触控板、触屏笔记本），所以按「这一下是怎么按的」。 */
let touchLike = (() => { try { return matchMedia("(pointer: coarse)").matches; } catch { return false; } })();
addEventListener("pointerdown", (e) => { touchLike = e.pointerType !== "mouse"; }, { capture: true, passive: true });
let lastEditMode: Mode = "notes";   // 从「听」回来回到哪
const listenOn = () => ws.mode === "listen";
function applyWorkspace(): void {
  const d = dockOf(ws), padOn = d === "keys" || d === "symbols", wasEdit = view.rules.edit;
  view.rules = lock.locked() ? lockedRules(RULES[ws.mode]) : RULES[ws.mode];   // 修改锁第 ① 道（谱面）：锁着 = 能放光标、能选（复制是逃生口），拖音 / 歌词框 / 记号菜单都不接——手势不许做到一半才被写入口拒
  document.body.classList.toggle("doc-locked", lock.locked()); syncPlug();
  document.body.dataset.wmode = ws.mode; document.body.classList.toggle("listen-mode", ws.mode === "listen"); scoreEl.dataset.mode = ws.mode;   // 不用 body[data-mode]：歌库自己用它（gallery）
  dockTab.querySelectorAll<HTMLElement>(".mode-seg [data-mode]").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === barMode(ws.mode)));   // 用符号格时「音」亮
  const changed = padEl.hidden === padOn || stageEl.dataset.dock !== d;
  stageEl.dataset.dock = d;
  padEl.hidden = !padOn; pad.setSymbols(d === "symbols"); if (!padOn) pad.clearHeld();
  if (d === "studio" && !studio.isOpen) { studio.show(); void engine.ensure().then(() => { engine.meter(true); syncSpectrum(); }).catch(() => undefined); }   // 峰值表 / 频谱：开着才要
  else if (d !== "studio" && studio.isOpen) { studio.hide(); engine.meter(false); syncSpectrum(); }
  updateChrome();
  if (changed || wasEdit !== view.rules.edit) view.render();   // 进出「听」：合租的每一家叠起来 / 回到跟着光标（v0.10.29）
}
/** 换模式：收起编辑框；进「音 / 符」= 键盘弹出来；进「听」= 谱锁住、键盘收起（录音室开着的话留着）。 */
function setMode(m: Mode): void {
  if (m === ws.mode) return;
  ui.close(); view.lyrics.commitAndClose(); view.marks.commitAndClose();
  if (m !== "listen") lastEditMode = m;
  ws.mode = m; ws.aside = false; if (hasKeys(m) && touchLike) ws.collapsed = false;   // 换模式：触屏范式 = 有输入意图、键盘弹出来；鼠标键盘范式 = 不动（v0.16.89）
  applyWorkspace();
  // 进出「听」不弹提示（v0.10.10，user「然后听的时候会弹一个nudge chip，我觉得那个info是废话，不用说」）：说明在「听」钮的悬停提示里
}
const setListen = (on: boolean) => setMode(on ? "listen" : lastEditMode);
/** 听模式的长按 / 右键小菜单（轻点不跳播，防误触）。 */
function openListenMenu(at: { x: number; y: number }, a: { paper: string; part: string; index: number | null; caret: number; tick?: number }): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card ctx-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title: string) => `<button class="btn ctx-item" data-v="${v}" title="${esc(title)}">${label}</button>`;
  box.innerHTML = item("here", _t("从这儿放"), _t("起点挪到这个小节的头，从这儿放")) + (perfApi.paused && !engine.playing ? item("resume", _t("接着放"), _t("从上次停下的地方接着放")) : "") + item("head", _t("从头放"), _t("起点回到开头，从头放（也可以连按两下 |▶ / 空格）"));
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8; let y = at.y + 10; if (y + h > innerHeight - m) y = at.y - h - 10;
  box.style.left = `${Math.max(m, Math.min(at.x + 6, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, y)}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "here") playFromHere(a.paper, a.part, a.tick ?? tickOfCaret(a.paper, a.part, a.index ?? a.caret));   // tick = 谱面点的那一刻（score-view 算好：补齐的空小节 / 合租叠起来的行都对）
    else if (v === "resume") resumePlay();
    else if (v === "head") playFromHead();
  });
}
/** 顶栏 ⋯：循环（开关）/ 从头放 / 接缝（开了循环才有）。 */
function openTransportMenu(btn: HTMLElement = $("playBtn")): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card ctx-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title: string) => `<button class="btn ctx-item" data-v="${v}" title="${esc(title)}">${label}</button>`;
  box.innerHTML = (perfApi.paused && !engine.playing ? item("resume", _t("接着放"), _t("从上次停下的地方接着放（起点不动）")) : "") +
    (engine.playing || perfApi.paused ? item("reveal", _t("跳到正在放的地方"), _t("谱滚到正在放（停着 = 停下）的那一行；刚才自己滚过也照样过去、接着跟")) : "") +
    `<div class="ctx-row" title="${_t("翻谱提前多少：快到行尾（或编排跳回去之前）这么久就先翻过去，最后一小截靠记——像钢琴家翻谱。0 = 换了行才翻")}"><span class="ctx-lab">${_t("提前翻")}</span>${TURN_LEADS.map((v) => `<button class="btn ctx-seg${v === perfApi.turnLead ? " is-on" : ""}" data-v="lead:${v}">${v ? `${v} s` : _t("不")}</button>`).join("")}</div>` +
    item("follow", _t("{autoFollow}自动翻", { autoFollow: view.autoFollow ? "✓ " : "" }), _t("放着的时候谱跟着正在放的那一行滚（出了屏幕舒服的那一段才滚；你自己滚过 4 秒内不跟）")) +
    item("loop", _t("{loopOn}循环", { loopOn: perfApi.loopOn ? "✓ " : "" }), _t("放到头接着从头放；编排写了 [循环段] = 前面放一遍、括住的一直循环")) +
    item("head", _t("从头放"), _t("起点回到开头，从头放（也可以连按两下 |▶ / 空格）")) + (perfApi.loopOn ? item("seam", _t("听接缝"), _t("从循环段结尾前几秒放起，跳回开头再放几秒就停")) : "");
  document.body.append(box);
  const b = btn.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, m = 8;
  box.style.left = `${Math.max(m, Math.min(b.left, innerWidth - w - m))}px`;
  box.style.top = `${b.bottom + 4 + h <= innerHeight - m ? b.bottom + 4 : Math.max(m, b.top - h - 4)}px`;   // 底座边上那个：下面放不下 = 往上开
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !btn.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "resume") resumePlay();
    else if (v.startsWith("lead:")) { perfApi.turnLead = Number(v.slice(5)); deviceKvSet(KV_TURN_LEAD, String(perfApi.turnLead)); info(perfApi.turnLead ? _t("翻谱提前 {turnLead} 秒", { turnLead: perfApi.turnLead }) : _t("翻谱不提前（换了行才翻）")); }
    else if (v === "reveal") { if (!view.revealPlayhead()) info(_t("现在没有在放的地方")); }
    else if (v === "follow") { view.autoFollow = !view.autoFollow; deviceKvSet(KV_AUTO_FOLLOW, view.autoFollow ? "1" : "0"); info(view.autoFollow ? _t("自动翻：开") : _t("自动翻：关")); }
    else if (v === "loop") { const on = !perfApi.loopOn; setLoop(on); deviceKvSet(KV_LOOP_EDITOR, on ? "1" : null); }   // 点的那一下就记在这台设备上（user 2026-11-13「每次我点了它都不循环就很烦」）；「听接缝」的临时循环不走这里、不记
    else if (v === "head") playFromHead();
    else if (v === "seam") playSeam();
  });
}
/** 点 = 放 / 停（连按两下 = 从头放）；长按 / 右键 = 走带菜单（长按松开不再算一下点）。 */
function wirePlayBtn(btn: HTMLElement): void {
  let timer = 0, held = false;
  const cancel = () => clearTimeout(timer);
  btn.addEventListener("pointerdown", (e) => { if (e.button !== 0 || (e.target as HTMLElement).closest(".issues-badge")) return; held = false; cancel(); timer = window.setTimeout(() => { held = true; openTransportMenu(btn); }, 500); });
  btn.addEventListener("pointerup", cancel); btn.addEventListener("pointerleave", cancel); btn.addEventListener("pointercancel", cancel);
  btn.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest(".issues-badge")) { openIssuesSheet(); return; } if (held) { held = false; return; } playPause(e.timeStamp); });   // 角上的数字 = 开不出声的清单，不是放
  btn.addEventListener("contextmenu", (e) => { e.preventDefault(); cancel(); openTransportMenu(btn); });
}
wirePlayBtn($("playBtn")); wirePlayBtn($("dockPlay"));
dockTab.querySelectorAll<HTMLElement>(".mode-seg [data-mode]").forEach((b) => b.addEventListener("click", () => {
  const m = b.dataset.mode as Mode;
  // 点亮着的那个 = 把它底下的东西弹出来（音 / 符 = 键盘，听 = 混音台）；只弹不收（幂等）。v0.10.42，user「idiempotent点听，音也应该跳出相应的软键盘」
  if (barMode(ws.mode) === m) { if (hasKeys(ws.mode) && ws.collapsed) showPad(true); return; }
  setMode(m);
}));   // 用符号格时点「音」= 已经在「音」里，不换键盘
// 看哪一段 / 看哪位歌手（v0.10.2）：全部 = 都看；选一段 = 本段视图跳到它；选一位 = 「只看它」（别的缩成细行），再选「全部」= 都看
$("paperSel").addEventListener("change", (e) => {
  const v = (e.target as HTMLButtonElement).value; (e.target as HTMLButtonElement).blur();
  if (v === "all") viewScope = "all"; else { viewScope = "segment"; if (v !== D.st.at.paper) navPaperTo(v); }
  view.render(); updateChrome();
});
$("partSel").addEventListener("change", (e) => {
  const v = (e.target as HTMLButtonElement).value; (e.target as HTMLButtonElement).blur();
  for (const p of D.st.song.parts) setPv(p.id, { only: v !== "all" && p.id === v });
  afterViewChange(); updateChrome();
});
/** 嵌进歌的软上限（user 2026-10-07「控制在10M左右的体积（不严格要求）」）：超了三选一——嵌 / 不嵌只记来源（弱引用）/ 算了。 */
let embedSoftLimit = 10e6;
// 音源来源 + 弱引用解析 = src/sources/sounds.ts（刀 4 音源来源接缝，2026-10-15）；这里只留一个实例
const sources = createSoundSources({ progress: (m) => progress(m), roleLabel: () => roleLabel(curRole()), removed: (id) => id === GS.id && libRemoved("gs") });   // 乐器音色库被人删了 = 解析链不自己去拿整包（v0.17.25）

// ── 导出歌声（user「基于wxhw的经验分享是可以很早就做」）：照 WXHW 的形状——先生成，再弹「好了」面板，
//    点「分享」那一下才调系统分享（iOS Safari 只认用户手势里的 navigator.share）；没有分享的（桌面 / Quest）= 下载。
/** 导出面板记住的选择（这次打开里有效）。 */
let mp3Scope: "all" | "segment" = "all";   // 范围只在这次打开里记着；音质跟歌走（desk，见 viewScope 旁边）
/** 导出歌声前的面板（user 2026-10-08「mp3导出可能本来就该有一个对话框？比如quality之类的？」→「好，同意」）：音质 / 范围，都预设好，点「导出」就走。
 *  许可那一行只在用户自己选过许可时才出现（user「只有用户自己关心协议的时候才提出这些」）。 */
/** §2.2½ 出口 ②：不出声的声部清单（非模态小面板，每行一个该按的钮）。入口 = |▶ 角上的数字。不替人换、不自愈（10-07 纪律）。 */
function openIssuesSheet(): void {
  ui.close();
  const list = perfApi.issues(); if (!list.length) { info(_t("现在的声部都能出声")); return; }
  const box = document.createElement("div"); box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${_t("不出声的声部")}</div>` +
    list.map((i) => `<div class="set-row issue-row"><div class="issue-text"><b>${esc(i.label)}</b><small>${esc(i.why)}</small></div>${i.kind === "removed" && i.lib ? `<button class="btn" data-v="libadd:${i.lib}">${_t("装回来")}</button>` : ""}<button class="btn primary" data-v="inst:${esc(i.part)}">${_t("换人 / 找声音…")}</button></div>`).join("") +
    `<div class="offer-msg">${_t("放和导出的 mp3 里都没有这{p}的声音，其余照放。换谁由你定，不替补。", { p: list.length > 1 ? _t("{n} 条轨", { n: list.length }) : _t("条轨") })}</div>` +
    `<div class="offer-btns"><button class="btn" data-v="close">${_t("知道了")}</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v?.startsWith("inst:")) { close(); goToPartInst(v.slice(5)); }
    else if (v === "libadd:voice" || v === "libadd:gs") { close(); void installBuiltin(v === "libadd:voice" ? "voice" : "gs"); }   // 和音源页的「装回来」同一个动作（settings-libs libInstall）
  });
}
/** 删了乐器音色库之后：这次打开里从它切出来、又没打包进歌的小块，从解析过的记忆和声音线程里一起放掉——不然删了照样响到重开（v0.17.25；
 *  打包着的照响；设备上另外留着子集的，下次解析照样从设备上拿）。 */
function forgetGsDerived(): void {
  for (const u of soundUses(D.extras)) if (!u.packed && u.origin?.library === GS.id) { sources.session.drop(u.subsetSha256); engine.unbank(u.subsetSha256); }
}
/** 「装回来」（不出声的清单里那一颗；音源页走同一个 libInstall）：下好了才去掉「你删了」的记号。 */
function installBuiltin(lib: BuiltinLib): Promise<boolean> {
  return libInstall({ info, error: showError, progress, refresh: () => libsRowSync?.(), removed: { set: setLibRemoved }, voice: { delete: () => packStore.delete(Object.keys(PACKS)), install: installVoicePacks },
    sounds: { gsSha: GS.sha256, delete: (sha) => forgetSound(sha), releaseMemory: () => releaseSoundMemory(), installGs: (onPct) => sources.fetchSound(GS, (done) => onPct(Math.round((done / GS.bytes) * 100))).then(() => undefined) } }, lib);
}
/** 下小月相的五个包（逐个来源试；设置里的「现在下载 / 装回来」和清单里的「装回来」共用）。 */
async function installVoicePacks(onPct: (p: number) => void): Promise<void> {
  let last: unknown = null;
  for (const base of models.bases()) { try { await packStore.download(Object.keys(PACKS), base, (p) => onPct(Math.floor((p.done / p.total) * 100))); return; } catch (e) { last = e; } }
  throw last ?? new Error("no source");
}
/** 光标挪到这位歌手（优先这张纸，没有就第一张有它的纸）再开乐器页。 */
function goToPartInst(partId: string): void {
  const paper = D.st.song.papers.find((pp) => pp.id === D.st.at.paper && pp.tracks[partId]) ?? D.st.song.papers.find((pp) => pp.tracks[partId]);
  if (paper && (paper.id !== D.st.at.paper || D.st.at.part !== partId)) update(setFocus(D.st, paper.id, partId));
  openInstPage();
}
/** 渲染时的进度框（v0.16.101）：盖在歌库 / 编辑器上面，进度字跟着走，「取消」= 停掉唱、扔掉这次的结果。 */
function renderBusy(label: string): { close(): void } {
  const box = document.createElement("div");
  box.className = "offer render-busy";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">${esc(label)}</div><div class="offer-msg rb-text">${_t("准备…")}</div><div class="offer-btns"><button class="btn" data-v="cancel">${_t("取消")}</button></div></div>`;
  document.body.append(box);
  const txt = box.querySelector<HTMLElement>(".rb-text")!;
  renderBusyText = (s) => { txt.textContent = s; };
  box.querySelector('[data-v="cancel"]')!.addEventListener("click", () => { txt.textContent = _t("正在取消…"); perfApi.cancelRender(); });
  return { close: () => { renderBusyText = null; box.remove(); } };
}
/** 渲一遍、记在这台设备上（三条杠「渲一遍」；user 11-11「目录里面应该有导出之外的另外一个语义」）：不弹文件、不下载。 */
async function renderHere(): Promise<void> {
  const busy = renderBusy(_t("正在渲染…"));
  try {
    const r = await perfApi.renderKeep({ quality: mp3Quality });
    info(r.cached ? _t("已经在渲染缓存里了（内容没变）") : !r.kept ? _t("渲好了，但没放进渲染缓存（存储满了或者是隐私模式）") : D.dirty() ? _t("渲好了，放进渲染缓存：存下去之后歌库封面上能听") : _t("渲好了，放进渲染缓存：歌库里这首的封面上能直接听"));
  } catch (e) { if ((e as { cancelled?: boolean }).cancelled) info(_t("渲染取消了")); else showError(_t("渲不了：{Error}", { Error: (e as Error).message })); }
  finally { busy.close(); }
}
/** 歌库卡片上点「渲染」（v0.16.101；user 11-09「在歌库里不打开歌直接渲」→ 11-11「我之前request的是在歌库里面渲染」「做」）：
 *  在后台把这首打开（歌库那一屏一直盖着，人还在歌库里；手里那首有没存的改动照常先问 / 先存）→ 渲一遍记在设备上 → 挂到这张卡上。
 *  这是简版：经过编辑器、一次一首；不经过编辑器、能排队的那种归「无头骑士」那一轮。 */
async function renderInLibrary(id: string): Promise<boolean> {
  const here = H.home.kind === "gallery" && H.home.identifier === id;
  if (!here && !(await openStoreDoc(id))) return false;
  const busy = renderBusy(_t("正在渲染「{stem}」…", { stem: stemOfId(id) }));
  try {
    const r = await perfApi.renderKeep({ quality: mp3Quality });
    if (!r.kept) { showError(_t("渲好了，但没放进渲染缓存（存储满了或者是隐私模式）")); return false; }
    return true;
  } catch (e) {
    if ((e as { cancelled?: boolean }).cancelled) info(_t("渲染取消了")); else showError(_t("渲不了：{Error}", { Error: (e as Error).message }));
    return false;
  } finally { busy.close(); }
}
const KV_SF_VELOCITY_SAID = "said-sf-velocity-square";   // 第 9 节那一句说过了（这台设备只说一次）
let mp3Keep = deviceKvGet("mp3-keep") !== "off";   // 导出时也记在这台设备上（设备设置；user 11-11「导出时明说，给开关 同意」）
function openMp3Panel(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper), k = D.st.song.papers.indexOf(paper!);
  const draw = () => {
    const chip = (v: string, label: string, note: string, on: boolean) => `<button class="btn cand${on ? " is-on" : ""}" data-v="${v}">${esc(label)}<small>${esc(note)}</small></button>`;
    const er = D.st.song.rights ? exportRights(soundingRoles()) : null;
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${_t("导出歌声（mp3）")}</div>` +
      `<div class="part-sec">${_t("音质")}</div><div class="set-row">${(Object.keys(MP3_QUALITY) as Mp3Quality[]).map((q) => chip(`q:${q}`, MP3_QUALITY[q].label, MP3_QUALITY[q].note, mp3Quality === q)).join("")}</div>` +
      (D.st.song.papers.length > 1 ? `<div class="part-sec">${_t("范围")}</div><div class="set-row">${chip("s:all", _t("整首"), _t("隐藏的纸不放"), mp3Scope === "all")}${chip("s:segment", _t("这一张纸"), paper?.name || _t("第 {p} 张", { p: k + 1 }), mp3Scope === "segment")}</div>` : "") +
      (mp3Scope === "all" ? `<div class="part-sec">${_t("放进渲染缓存")}</div><div class="set-row">${chip("k:on", _t("放进去"), _t("歌库里这首的封面上能直接听；设置里能删"), mp3Keep)}${chip("k:off", _t("不放"), _t("只导出这一份，不留"), !mp3Keep)}</div>` : "") +
      (mp3Scope === "all" && renderHit(mp3Quality) ? `<div class="offer-msg">${_t("这台设备上记着上次渲好的这一份，内容没变：直接拿，不用等。")}</div>` : "") +
      (er ? `<div class="offer-msg">${_t("许可：{fellBack}。和署名一起写进 mp3 的标签。", { fellBack: er.fellBack ? _t("这份按「未声明」写——你选的许可允许别人改编，和小月相的条款可能冲突（作者栏里的选择没动）") : esc(er.rights!) })}</div>` : "") +
      // 静着 / 被独奏挡住的声部不进这一份（第 17 条四问第 3 条：导出的就是听到的，要看得见）
      ((t) => (t ? `<div class="offer-msg issue-warn">${esc(t)}</div>` : ""))(perfApi.silencedText()) +
      ((is) => (is.length ? `<div class="offer-msg issue-warn">${_t("{n} 条轨不出声，mp3 里不会有它们：{is}。换人在谱前面的声部名里。", { n: is.length, is: esc(perfApi.issuesText(is)) })}</div>` : ""))(perfApi.issues()) +   // §2.2½ 出口 ④：护栏在面板里，不拦（user「不警察用户」）
      `<div class="offer-btns"><button class="btn primary" data-v="go">${perfApi.issues().length ? _t("照样导出") : _t("导出")}</button><button class="btn" data-v="close">${_t("算了")}</button></div></div>`;
  };
  draw();
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v?.startsWith("q:")) { mp3Quality = v.slice(2) as Mp3Quality; draw(); }
    else if (v?.startsWith("s:")) { mp3Scope = v.slice(2) as "all" | "segment"; draw(); }
    else if (v?.startsWith("k:")) { mp3Keep = v === "k:on"; deviceKvSet("mp3-keep", mp3Keep ? null : "off"); draw(); }
    else if (v === "go") { close(); void exportSong({ quality: mp3Quality, scope: mp3Scope, keep: mp3Keep }); }
  });
}

// 模型来源（pwa-models）= src/sources/models.ts：同源 pwa-models/ 先、再设置里的；只在这次打开里有效
const models = createModelSources();
const packStore = createPackStore({ packs: PACKS });   // 只用来导入 / 看状态；下载在 worker 里（同一个 Cache Storage pwa-models）
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** 语言这一行：两种语言的字都写，走错语言的人也认得出。切换 = 存 + 重载（语言锁死在这一页，不要半译状态；没存的改动由挽留框 / 退出落盘那一套管）。 */
const LANG_LABEL = "语言 · Language";   // i18n-keep
/** 点了谱上的和弦级数：全部候选 + 怎么排的（不是选择题，只是看）。说明的字归读它的那种理论（乐理模块 src/theory/）。 */
/** 点和弦级数 = 候选小表（v0.16.11）；v0.16.87 起每一行能点 = 用这个（写进那个音：人写明的和弦名，user 11-09「输入法候选」、11-10「一同意」）。
 *  挑过的：顶上说「这是你挑的」+「改回自动」；挑的对不上这几个音了：顶上明说，由人决定换一个还是改回自动（不替人删）。听模式 / 锁着只看不挑。 */
function openChordInfo(r: HarmonyRead, at: { x: number; y: number }, where: { paper: string; part: string; index: number } | null): void {
  const th = harmonyTheory(r.theory), canPick = !!where && view.rules.edit && !lock.locked();
  const row = (g: HarmonyGuess, i: number) => {
    const on = i === 0 && r.pinned, inner = `<b>${esc(g.label)}</b><span>${esc(g.name)}</span><small>${th.explain(g).map(esc).join(" · ")}</small>`;
    return canPick ? `<button class="chord-cand${i === 0 ? " is-best" : ""}${on ? " is-on" : ""}" data-v="pick:${i}">${inner}</button>` : `<div class="chord-cand${i === 0 ? " is-best" : ""}">${inner}</div>`;
  };
  const head = r.pinned
    ? `<div class="ctx-hint ctx-what">${esc(r.stale ? _t("你挑的「{name}」不在现在这几个音的读法里（音改过了）：换一个，或者改回自动", { name: r.best.name }) : _t("这是你挑的「{name}」", { name: r.best.name }))}</div>` +
      (canPick ? `<button class="btn ctx-item" data-v="auto">${esc(r.auto ? _t("改回自动（{label}）", { label: th.label(r.auto) }) : _t("改回自动（这几个音认不出和弦 = 不标）"))}</button>` : "")
    : `<div class="ctx-hint ctx-what">${esc(th.howTo(r))}${canPick ? esc(_t("点一个 = 用它（记进这个音，能撤销）")) : ""}</div>`;
  ctxMenu("chord-info", head + r.all.slice(0, 6).map(row).join(""), at, (v) => {
    if (!where || !canPick) return true;
    if (v === "auto") { update(setChordPin(D.st, where.paper, where.part, where.index, null)); return false; }
    if (v.startsWith("pick:")) { const g = r.all[Number(v.slice(5))]; if (g) update(setChordPin(D.st, where.paper, where.part, where.index, th.pinOf(g))); return false; }
    return true;
  });
}
/** 改「这首歌怎么看」（谱种 / 和弦标级数 / 按 C 调看 / 每条轨的和弦选项）选一个具体的值：走这里，带着 songLook 这个类别（修改锁的「看法」：锁着也能切，锁着期间不写文件；
 *  进撤销、会标脏；test/edit-lock-guard.test.mjs 钉）。next = src/score/song-view.ts 的 setter 算好的。
 *  页面设置里选「跟着软件」那一步不走这里：它在页面设置的 change 里直接走写入口，类别从 edit-lock-table.ts 的 LOOK_KEY_OP 拿（同一张表管每一项是哪一类看法；v0.17.33）。 */
function setSongLook(next: EditorState, label: string): void { if (next !== D.st) D.commit({ st: next }, { locus: { kind: "songLook", label } }); }
/** 改页面设置「版面」页里走写入口的四样（纸张 / 版式 / 小节号 / 歌词排法；7-C）选一个具体的值，和「套用我的习惯」：走这里，各带自己的类别（修改锁的「看法」：锁着能切、锁着期间不写文件；
 *  写入口按 src/app/edit-lock-table.ts 的核验核过才放行）。调用点把类别写成字面量（test/edit-lock-guard.test.mjs 按字面量找调用点）。
 *  选「跟着软件」那一步不走这里：它在页面设置的 change 里直接走写入口，类别从 edit-lock-table.ts 的 LOOK_KEY_OP 拿（v0.17.33）。 */
function setPageLook(next: EditorState, locus: { kind: "paperSize" | "density" | "barNumbers" | "lyricFit" | "allLooks"; label: string }): void { if (next !== D.st) D.commit({ st: next }, { locus }); }

/** 设置分五页（v0.16.80，总表第 10 条：界面 / 辅助功能 / 音源与缓存 / MIDI / 开发者）；记住这次运行里上次看的那页。 */
/** 设置分六页（施工单 13-1，user 2026-11-12「用单一职责的思想好好想一下，也许可以拆页面和分拣」→ 统筹的分法；规矩：每一页只回答一个问题，设置只管这台设备上的软件）。 */
type SetPage = "ui" | "sound" | "input" | "upkeep" | "about" | "dev";
let settingsPage: SetPage = "ui";
//   页签 = 界面零件库的页签条（13-0，user「设置的页签换成 WeebPaint 和 CatsUp 那种」）：一格 ≤ 3 个汉字 / 6 个字母，永远一排；超过 6 页先找统筹。
//   图标（统筹 2026-11-12 定）：一枚图标表示一类东西；「关于」和纸上的「这首歌」同一枚 info（页签带字）。
const SET_PAGES = (): TabSpec<SetPage>[] => [
  { id: "ui", label: _t("界面##页签"), icon: "theme", title: _t("界面：这个软件长什么样、说什么语言") },
  { id: "sound", label: _t("音源##页签"), icon: "volume", title: _t("音源：装在这台设备上的声音") },
  { id: "input", label: _t("输入##页签"), icon: "keyboard", title: _t("输入：接在这台设备上的键盘") },
  { id: "upkeep", label: _t("维护##页签"), icon: "wrench", title: _t("维护：清理空间、出毛病时修一下、把日志发给开发者") },
  { id: "about", label: _t("关于##页签"), icon: "info", title: _t("关于：版本、软件自己用到的别人的东西") },
  { id: "dev", label: _t("开发者##页签"), icon: "chip", title: _t("开发者：试验开关、还原出厂") },
];
// 设置那一套「一项一行」（v0.16.90，user 11-10「主要还是做一个问号机制…避免大段文字或者大段折叠文字放在settings里面」）：短名字 + 控件，长说明进「?」（点了这一行下面展开）。
//   设置面板和页面设置（7-C）共用这一套：页签 + 一页一页 + 一项一行。13-1 起一行 = 界面零件库的 settingRowHtml（.wbe-row；「?」= 它的一个小标记），点小标记由 wireSettingRows 接。
//   label / ctl / help / body 都是本仓自己拼的 HTML（照旧不转义）；attrs 的值由库转义。
const setItem = (label: string, ctl: string, help = "", body = "", attrs?: Readonly<Record<string, string>>) =>
  settingRowHtml({ labelHtml: label, ...(ctl ? { controlHtml: ctl } : {}), notes: help ? [{ mark: "?", label: _t("这是什么"), html: help }] : [], ...(body ? { belowHtml: body } : {}), ...(attrs ? { attrs } : {}) });
/** 面板外壳上的分页（设置、页面设置；2026-11-13 搬到壳上，原来的 setTabsHtml / wireSetPages 退场）：页签条是壳自己的（opts.tabs），这里只管露哪一页、亮哪一格、「?」点了在这一行下面展开说明（iPad 没有悬停）。回 showPage。 */
function wireShellPages<P extends string>(panel: PanelShell<P>, box: HTMLElement, onPage: (pg: P) => void): (pg: P) => void {
  const showPage = (pg: P): void => {
    box.querySelectorAll<HTMLElement>(".set-page").forEach((el) => { el.hidden = el.dataset.page !== pg; });
    fitWide(box);
    panel.tabs?.set(pg);
    onPage(pg);
  };
  wireSettingRows(box);
  return showPage;
}
/** 设置里的一个下拉框（原来一排小按钮，user 嫌难看 → 下拉框）：data-set = 哪一项，改了走 openSettings 的 change。 */
const setSel = (k: string, opts: [string, string][], cur: string): string =>
  dropdownHtml(opts.map(([value, label]) => ({ value, label })), cur, { cls: "hp-sel set-sel", attrs: `data-set="${k}"` });   // 界面零件库的下拉标准件（7-T）；openSettings 里 mountDropdowns 接上
/** 长文弹窗（v0.16.90）：盖在设置上面的一层，一个标题 + 能滚的正文 + 「好」；jump = 滚到正文里 id="doc-<jump>" 的那一节。收起 = 回到设置原样。 */
function openDocLayer(host: HTMLElement, title: string, html: string, jump?: string): void {
  const layer = document.createElement("div"); layer.className = "doc-layer";
  layer.innerHTML = `<div class="offer-card doc-card"><div class="offer-title">${esc(title)}</div><div class="doc-body">${html}</div><div class="offer-btns"><button class="btn primary" data-doc-close>${_t("好")}</button></div></div>`;
  host.append(layer);
  layer.addEventListener("click", (e) => { e.stopPropagation(); if (e.target === layer || (e.target as HTMLElement).closest("[data-doc-close]")) layer.remove(); });
  if (jump) requestAnimationFrame(() => layer.querySelector(`#doc-${jump}`)?.scrollIntoView({ block: "start" }));
}
/** 在一张面板上面再问一句（不关掉下面那张；设置里删库之前用，13-2）：点 ok = true；点背板 / 算了 = false。 */
function askOver(host: HTMLElement, title: string, msg: string, okLabel: string, danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    const layer = document.createElement("div"); layer.className = "doc-layer ask-layer";
    layer.innerHTML = `<div class="offer-card"><div class="offer-title">${esc(title)}</div><div class="offer-msg">${esc(msg)}</div><div class="offer-btns"><button class="btn${danger ? " danger" : ""}" data-ask="ok">${esc(okLabel)}</button><button class="btn primary" data-ask="no">${_t("算了")}</button></div></div>`;
    host.append(layer);
    const done = (ok: boolean) => { layer.remove(); resolve(ok); };
    layer.addEventListener("click", (e) => { e.stopPropagation(); const a = (e.target as HTMLElement).closest<HTMLElement>("[data-ask]")?.dataset.ask; if (e.target === layer || a === "no") done(false); else if (a === "ok") done(true); });
  });
}
/** 一样习惯的那一行（设置「界面」页、「初始设置」卡第三行起的小下拉同一处出；第 18 条 + 卡第二版）：第一格「没选（照软件的默认：X）」，后面是选项（名字照页面设置里的叫法）；
 *  「?」里只留这一样自己的那一句（统筹 b7a48b84）。下拉的 data-set = habit:<哪一样>：设置里改了马上写（openSettings 的 change），卡里的到「好」才读（readHabitRows）。 */
function habitRowHtml(k: HabitKey, h: Habits): string {
  const NONE = "none", none: [string, string] = [NONE, _t("没选（照软件的默认：{x}）", { x: defaultText(k, {}) })];
  if (k === "notation") return setItem(_t("习惯看的谱"), setSel("habit:notation", [none, ...NOTATIONS.map((id): [string, string] => [id, notationName(id)])], h.notation ?? NONE), _t("新建的歌照它写下来；页面设置里写着「跟着我的习惯」的歌跟着它变。每首歌在页面设置里能单独换。"));
  if (k === "viewInC") return setItem(_t("移调辅助"), setSel("habit:viewInC", [none, ["off", _t("不用（照写的调）")], ["on", _t("按 C 调看")]], h.viewInC === undefined ? NONE : h.viewInC ? "on" : "off"), TRANSPOSE_AID_NOTE().map((p) => `<p>${esc(p)}</p>`).join(""));
  if (k === "chordTagStyle") return setItem(_t("和弦写法"), setSel("habit:chordTagStyle", [none, ...CHORD_TAG_STYLES.map((v): [string, string] => [v, CHORD_TAG_STYLE_LABEL[v]()])], h.chordTagStyle ?? NONE), CHORD_TAG_STYLE_NOTE());
  return setItem(_t("中央 C 叫"), setSel("habit:middleC", [none, ...MIDDLE_C_NAMES.map((n): [string, string] => [String(n), middleCLabel(n)])], h.middleC === undefined ? NONE : String(h.middleC)), MIDDLE_C_NOTE());
}
/** 设置「界面」页：「初始设置」那一行（打开那张卡）+ 每样习惯一行。 */
function habitRowsHtml(): string {
  const h = habitCtx.habits ?? {};
  return setItem(_t("初始设置"), `<button class="btn" data-v="habits:card">${_t("打开…")}</button>`, _t("这台设备的习惯：新建的歌照它写下来（之后这首歌就一直是这个样）；页面设置里写着「跟着我的习惯」的歌跟着它变。习惯本身不进歌、不同步。")) +
    HABIT_KEYS.map((k) => habitRowHtml(k, h)).join("");
}
/** 读几行习惯下拉现在选着的（「没选」/ 认不出 = 不在里面）。 */
function readHabitRows(root: HTMLElement, keys: readonly HabitKey[]): Habits {
  const out: Record<string, unknown> = {};
  for (const k of keys) { const raw = root.querySelector<HTMLButtonElement>(`[data-set="habit:${k}"]`)?.value ?? "none"; const v = raw === "none" ? undefined : HABIT_CODEC[k].parse(raw); if (v !== undefined) out[k] = v; }
  return out as Habits;
}
/** 「初始设置」卡第三行起的小下拉：中央 C 叫、和弦写法（第 19 条）。卡上摆着的那几样 = CARD_HABITS（habits-card.ts），画卡和「好」写设备都从那一份来。 */
const CARD_ROW_KEYS: readonly HabitKey[] = CARD_HABITS.rows;
const cardRows: HabitRows = {
  keys: CARD_ROW_KEYS,
  html: (cur) => CARD_ROW_KEYS.map((k) => habitRowHtml(k, cur)).join(""),
  mount: (root) => { mountDropdowns(root); wireSettingRows(root); },
  read: (root) => readHabitRows(root, CARD_ROW_KEYS),
};
/** 设置里改了一行习惯：none = 没选；别的按设备键值的写法认（认不出 = 没选）。 */
function onHabitRow(k: HabitKey, raw: string): void {
  if (k === "notation") setHabit("notation", raw === "none" ? undefined : HABIT_CODEC.notation.parse(raw));
  else if (k === "viewInC") setHabit("viewInC", raw === "none" ? undefined : HABIT_CODEC.viewInC.parse(raw));
  else if (k === "middleC") setHabit("middleC", raw === "none" ? undefined : HABIT_CODEC.middleC.parse(raw));
  else if (k === "chordTagStyle") setHabit("chordTagStyle", raw === "none" ? undefined : HABIT_CODEC.chordTagStyle.parse(raw));
}
/** 设置面板（应用内，不用系统弹窗）：六页（13-1）；音源 / 维护两页的格局和按钮在 panels/settings-libs.ts（13-2）。 */
function openSettings(): void {
  ui.close();
  const inFolder = resourcesInFolder();   // 备用版：模型 / 音源都在文件夹里，浏览器缓存用不了——这几行画灰 + 说一句（规则书 §1 第 6 条）
  const box = document.createElement("div");   // 面板外壳里那一块（壳 = 界面零件库的 openPanelShell：标题、页签条、能滚的一层、底下的「好」都是壳的）
  box.className = "settings-body";
  // 一项一行（setItem，和页面设置共用）；版权署名不放这里，进「版权与署名」那一篇长文（src/app/credits-doc.ts，按需跳到那一节）
  const item = setItem;
  const look = (v: string, label: string) => `<button class="btn" data-v="${v}">${label}</button>`;
  box.innerHTML =
    `<div class="set-page" data-page="ui">` +
      item(LANG_LABEL, setSel("lang", [["auto", _t("跟系统")], ["zh", LANG_NAME.zh], ["en", LANG_NAME.en]], langChosen() ?? "auto"), "", "", { "data-i18n-skip": "" }) +
      habitRowsHtml() +
    `</div>` +
    // 音源（13-2）：每个库一栏——小月相 / 乐器音色库 / 你自己加的音色文件；格局和字在 panels/settings-libs.ts
    `<div class="set-page" data-page="sound"><div id="libVoice">…</div><div id="libGs">…</div><div id="libOwn">…</div></div>` +
    `<div class="set-page" data-page="input">` +
      item(_t("MIDI 键盘"), `<span id="midiSt">${midiStatusHtml(midi.status)}</span>${midi.status.k === "off" || midi.status.k === "denied" ? `<button class="btn" data-v="midi:connect">${_t("连接")}</button>` : ""}`) +
    `</div>` +
    // 维护（13-2）：按对象分组；这一页上的每颗钮按下去都不会让任何一首歌少东西（「13 补」，守卫 test/settings-libs.test.ts）
    `<div class="set-page" data-page="upkeep"><div id="upVoice">…</div><div id="upGs">…</div><div id="upRc">…</div>` +
      upkeepRestHtml({ canShare: canShareDiag(), diagText: diagText() }) +
    `</div>` +
    // 关于：版本、软件自己用到的别人的东西（13-1 拆开：小月相的署名与使用条款在「音源」页它那一栏的「©」）
    `<div class="set-page" data-page="about">` +
      item(_t("版本"), `<span class="set-ver">${APP_VERSION}</span>`) +
      item(_t("第三方的作者和许可"), look("doc:top", _t("看…")), _t("软件自己用到的别人的东西（乐器目录的图标…）；小月相的署名与使用条款在「音源」页它那一栏的 ©")) +
    `</div>` +
    // 开发者页（家族规矩 2½：「还原出厂设置…」住这里）
    `<div class="set-page" data-page="dev">` +
      item(_t("按键手感的数字"), setSel("feel", [["off", _t("关")], ["on", _t("开")]], feelAlways ? "on" : "off"), _t("查延迟用：打开 = 按键时在键盘上面露一行数字；关着 = 不显示（晚了也不弹，只记进诊断日志）")) +
      (IS_IOS ? item(_t("声音的起法（试验）"), setSel("primer", [["off", _t("关")], ["on", _t("开")]], primerOn() ? "on" : "off"), _t("开 = 第一次点屏幕先起一个不出声的垫脚把声音硬件叫醒，再起真正出声的那一个；关 = 以前的起法。改了要重开 app 才看得出")) : "") +
      // 给开发者看的数字（「13 再补」第 4 条：维护页和音源页只留「占多少、能不能清」）：站点配额、录音房几块、小月相几条道和设备预算、输出延迟、音频线程忙多少
      item(_t("引擎负载与内存"), "", _t("能算到的部分；超预算会先放块、再减并行、再趁空重开引擎，并在状态条明说"), `<div id="engRes" class="set-packs">…</div><div id="siteQuota" class="set-packs"></div>`) +
      item(_t("还原出厂设置"), `<button class="btn danger" data-v="factory">${_t("还原出厂设置…")}</button>`, _t("这台设备上 MoonSinger 的全部本地数据清成新装：歌库的本机副本、念缓存、封面缓存、设置、诊断日志、离线壳；云端的歌和本机文件不动；小月相和乐器音色库不动——要删在「音源」页各自那一栏删")) +
    `</div>` +
    `<div class="set-row set-app"><span class="set-ver">${APP_VERSION}</span>${currentPolicy().serviceWorker ? `<button class="btn" data-v="check">${_t("检查更新")}</button>` : `<button class="btn is-off" disabled title="${SITE_TEXT.noShell}">${_t("检查更新")}</button><span class="set-note">${SITE_TEXT.noShell}</span>`}</div>` +
    "";
  // 壳（「设置、页面设置搬到壳上」：看上去不变；关 = 底下「好」/ 点外面 / Esc，都回 onClose）
  let showPage: (pg: SetPage) => void = () => undefined;
  const panel = openPanelShell<SetPage>({ title: _t("设置"), content: box, width: "wide", tabs: { tabs: SET_PAGES(), current: settingsPage, onPick: (pg) => showPage(pg) },
    buttons: [{ id: "close", label: _t("好"), primary: true }], closeId: "close", onClose: () => cleanup() });
  panel.el.classList.add("set-panel", "settings-panel");   // set-panel = 搬到壳上的设置 / 页面设置（E2E 认它）
  // 六页：点页签换页（这次运行里记住）；下拉框改了马上生效（语言 = 存 + 重载）
  mountDropdowns(box);   // 设置里的下拉（setSel）
  showPage = wireShellPages(panel, box, (pg) => { settingsPage = pg; });
  showPage(settingsPage);
  box.addEventListener("change", (e) => {
    const el = e.target as HTMLButtonElement, k = el.dataset.set;
    if ((e.target as HTMLElement).id === "impIn") { void importPacks(e.target as HTMLInputElement); return; }
    if (!k) return;
    if (k === "lang") { saveLang(el.value === "auto" ? null : (el.value as Lang)); location.reload(); }
    else if (k.startsWith("habit:")) { onHabitRow(k.slice(6) as HabitKey, el.value); return; }
    else if (k === "feel") { feelAlways = el.value === "on"; deviceKvSet(KV_FEEL_ALWAYS, feelAlways ? "1" : null); diagNote("feel", `always-show ${feelAlways ? "on" : "off"}`); }
    else if (k === "primer") { const on = el.value === "on"; setPrimer(on); deviceKvSet(KV_PRIMER, on ? null : "0"); }
  });
  // 两个来源框住在各自那一栏里，栏会重画：重画前、关面板时把框里的字收进来（只在这次打开里有效）
  const keepSources = () => { const a = box.querySelector<HTMLInputElement>("#srcIn"), b = box.querySelector<HTMLInputElement>("#sndIn"); if (a && !a.disabled) models.source = a.value; if (b) sources.source = b.value; };
  // ── 音源页：量好交给 settings-libs 拼字 ──
  const libVoice = box.querySelector<HTMLElement>("#libVoice")!, libGs = box.querySelector<HTMLElement>("#libGs")!, libOwn = box.querySelector<HTMLElement>("#libOwn")!;
  const sizes = new Map<string, number>();   // 删之前面板上写「占多少」：最近一次量的
  const GS = SOUNDS["generaluser-gs-2.0.3"]!;
  const voicePacks = async (): Promise<PackView[]> => {
    if (inFolder) { const files = localBundle()?.files ?? {}; return Object.entries(PACKS).map(([slug, p]) => { const ready = p.manifest.chunks.every((c) => files[`pwa-models/packs/${slug}/${c.name}`]); return { slug, ready, bytesTotal: p.manifest.totalBytes, bytesCached: ready ? p.manifest.totalBytes : 0 }; }); }
    return (await packStore.status(Object.keys(PACKS))).map((s) => ({ slug: s.slug, ready: s.ready, bytesTotal: s.bytesTotal, bytesCached: s.bytesCached }));
  };
  const refreshSound = async (): Promise<void> => {
    keepSources();
    await reconcileLibMarks();   // 记号和实际对不上 = 以实际为准（v0.17.25 收第 2 条）
    const packs = await voicePacks(); sizes.set("voice", packs.reduce((n, p) => n + p.bytesCached, 0));
    libVoice.innerHTML = voiceColumnHtml({ packs, folder: inFolder ? FOLDER_TEXT.models : null, source: models.source, removed: libRemoved("voice") });
    const cached = inFolder ? [] : await listCachedSounds(), gsHere = cached.find((c) => c.sha256 === GS.sha256); sizes.set("gs", gsHere?.bytes ?? 0);
    libGs.innerHTML = gsColumnHtml({ name: GS.name, ...(GS.description ? { description: GS.description } : {}), bytes: GS.bytes, cached: !!gsHere, removed: libRemoved("gs"), license: GS.license, attribution: GS.attribution, ...(GS.homepage ? { homepage: GS.homepage } : {}), folder: inFolder ? FOLDER_TEXT.sounds : null, source: sources.source });
    // 自己加的：设备上留着、又不是目录里认得的整包（「五件的回话」第 2 条：名字从这一块字节里读，先出页面、名字后补）
    const known = new Set(Object.values(SOUNDS).map((e) => e.sha256)), uses = new Map(soundUses(D.extras).map((u) => [u.subsetSha256, u]));
    const own: OwnView[] = cached.filter((c) => !known.has(c.sha256)).map((c) => { sizes.set(c.sha256, c.bytes); const u = uses.get(c.sha256); return { sha256: c.sha256, bytes: c.bytes, label: undefined, users: u?.names ?? [], packed: !!u?.packed }; });
    libOwn.innerHTML = ownColumnHtml(own, inFolder ? FOLDER_TEXT.sounds : null);
    const t0 = performance.now();
    await Promise.all(own.map(async (o) => { o.label = await cachedSoundLabel(o.sha256); const el = libOwn.querySelector<HTMLElement>(`[data-sha="${o.sha256}"] .lib-own-name`); if (el) el.textContent = ownLabel(o); }));
    if (own.length) diagNote("settings", `own sound labels: ${own.length} in ${Math.round(performance.now() - t0)} ms`);
  };
  // ── 维护页 ──
  const upVoice = box.querySelector<HTMLElement>("#upVoice")!, upGs = box.querySelector<HTMLElement>("#upGs")!, upRc = box.querySelector<HTMLElement>("#upRc")!;
  let rcKeys: string[] = [];
  const refreshUpkeep = async (): Promise<void> => {
    const snap = resourceSnapshot(), engineBytes = snap.lanes.length ? snap.lanes.reduce((n, l) => n + l.wasm, 0) : null;
    upVoice.innerHTML = upkeepVoiceHtml({ speech: null, speechNote: null, engineBytes });
    upGs.innerHTML = upkeepGsHtml(soundMemoryBytes());
    void singer.cache("info", BUDGET.speechDisk).then((d) => { upVoice.innerHTML = upkeepVoiceHtml({ speech: d ?? null, speechNote: d ? null : inFolder ? FOLDER_TEXT.speech : _t("这个浏览器没有 IndexedDB：念过的句子只在内存里"), engineBytes }); });
    await renders.ready();
    const all = renders.list(), st = renders.stats(), old = renders.oldStats(coreInfo()); rcKeys = all.map((x) => x.meta.key);
    upRc.innerHTML = upkeepRendersHtml({ rows: all.map((x) => ({ key: x.meta.key, title: x.meta.title, secs: x.meta.secs, size: x.meta.size, at: x.meta.at, old: renderedByOldCore(x.meta, coreInfo()), coreVersion: x.meta.core?.version ?? "?", links: x.links.map((l) => stemOfId(l.identifier)) })), bytes: st.bytes, oldCount: old.count, oldBytes: old.bytes, coreNow: coreInfo().version }, RENDER_KEEP);
  };
  // ── 开发者页：给开发者看的数（每秒刷） ──
  const engRes = box.querySelector<HTMLElement>("#engRes")!, siteQuota = box.querySelector<HTMLElement>("#siteQuota")!;
  const refreshRes = () => { const lat = engine.latencyMs(); engRes.textContent = _t("{BUDGET} 小月相 {parallelism} 条道（设备预算 {lanes}）。{p}", { BUDGET: describeResources(resourceSnapshot(), BUDGET), parallelism: singer.parallelism, lanes: BUDGET.lanes, p: lat !== null ? _t("声音的输出延迟（浏览器报的）：{lat} ms", { lat: Math.round(lat) }) : "" }); };
  refreshRes(); const resTimer = window.setInterval(refreshRes, 1000);
  void siteStorageEstimate().then((est) => { if (est) siteQuota.textContent = _t("这个站点共用了 {usage} / 配额 {quota}", { usage: sizeText(est.usage), quota: sizeText(est.quota) }); });
  void refreshSound(); void refreshUpkeep();
  const importPacks = async (input: HTMLInputElement): Promise<void> => {
    const files = [...(input.files ?? [])]; if (!files.length) return;
    const packSt = box.querySelector<HTMLElement>("#packSt"); if (packSt) { packSt.hidden = false; packSt.textContent = _t("导入中…"); }
    try { await packStore.importFiles(Object.keys(PACKS), files, (p) => { if (packSt) packSt.textContent = _t("导入中… {total}%", { total: Math.floor((p.done / p.total) * 100) }); }); if ((await packStore.status(Object.keys(PACKS))).every((x) => x.ready)) setLibRemoved("voice", false); }   // 从本机文件导入 = 装回来（v0.17.25）
    catch (err) { showError(_t("导入没成：{Error}", { Error: (err as Error).message === "no-matching-file" ? _t("这些文件不是小月相要的模型包分片") : (err as Error).message })); }
    void refreshSound();
  };
  // 宿主交给 settings-libs 的那一套：碰存储的事都在这里，一样一行
  const silencedBy = (lib: LibId | { sha256: string }): string[] => {
    const names = labelsNow();
    return D.st.song.parts.flatMap((p, i) => {
      const ins = activeInstrument(D.extras, p.role); if (!ins) return [];
      // 小月相的库（模型包）= 按句出块的那种演奏者在 worker 里唱要用的（注册表的能力字段，不按引擎名分；ADR-0004 §2.4）
      if (lib === "voice") return performerOf(ins.engine)?.sound === "chunks" ? [names[i] ?? p.id] : [];
      const s = ("source" in ins ? ins.source : null) as Sf2Source | null; if (!s?.subsetSha256) return [];   // 带一块 SoundFont 字节的才有 source（格式层的形状 Sf2Source）
      const packed = !!(s.embedded && D.extras.sounds[s.embedded]); if (packed) return [];
      return (lib === "gs" ? s.origin.library === GS.id : s.subsetSha256 === lib.sha256) ? [names[i] ?? p.id] : [];
    });
  };
  const host: LibsHost = {
    ask: (title, msg, ok, danger) => askOver(panel.el, title, msg, ok, danger), info, removed: { set: setLibRemoved }, error: showError, silencedBy, sizeOf: (lib) => sizes.get(typeof lib === "string" ? lib : lib.sha256) ?? 0,
    voice: {
      delete: () => packStore.delete(Object.keys(PACKS)),
      install: async (onPct) => { keepSources(); await installVoicePacks(onPct); },
    },
    sounds: { gsSha: GS.sha256, delete: async (sha) => { await forgetSound(sha); if (sha === GS.sha256) forgetGsDerived(); }, releaseMemory: () => releaseSoundMemory(), installGs: async (onPct) => { keepSources(); await sources.fetchSound(GS, (done) => onPct(Math.round((done / GS.bytes) * 100))); } },
    speech: { clear: async () => { await singer.cache("clear", BUDGET.speechDisk); } },
    lanes: { restart: () => { singer.restart(); diagNote("resource", "manual restart of singer lanes"); } },
    renders: { clearAll: () => renders.clear(), clearOld: () => renders.removeOld(coreInfo()), clear: async (i) => { const k = rcKeys[i]; if (!k) return false; await renders.remove(k); return true; } },
    audio: { revive: () => manualRevive("settings") },
    shell: { check: () => shell.checkForUpdate().then((r) => { if (r === "found") { close(); showUpdateBar(); } else info(r === "latest" ? _t("已经是最新版") : _t("这里没有离线壳（本机开发 / 浏览器不支持），不用更新")); }), reset: () => shell.forceReset() },
    diag: {
      view: () => openDocLayer(panel.el, _t("诊断日志"), `<pre class="diag-log">${esc(diagText())}</pre>`),
      copy: () => void copyDiag(box.querySelector("#diagTxt"), info), download: () => downloadDiag(info), share: () => void shareDiag(info), clear: () => clearDiag(box.querySelector("#diagTxt"), info),
    },
    refresh: (what) => void (what === "sound" ? refreshSound() : refreshUpkeep()),
    goto: (page, lib) => {   // 两页之间跳到对应的那一栏 / 那一组，亮一下
      showPage(page);
      const el = box.querySelector<HTMLElement>(page === "sound" ? `.wbe-row[data-lib="${lib}"]` : `.wbe-row[data-group="${lib}"]`);
      if (el) { el.classList.add("is-target"); el.scrollIntoView({ block: "nearest" }); setTimeout(() => el.classList.remove("is-target"), 1600); }
    },
    doc: () => openDocLayer(panel.el, _t("小月相（つくよみちゃん）的署名与使用条款"), sectionsHtml(creditsSections(lang()).filter((s) => s.id === VOICE_CREDIT_SECTION))),
    progress,
  };
  midiRowSync = (s) => { const el = box.querySelector<HTMLElement>("#midiSt"); if (el) el.innerHTML = midiStatusHtml(s); if (s.k !== "off" && s.k !== "denied") box.querySelector('[data-v="midi:connect"]')?.remove(); };
  libsRowSync = () => { void refreshSound(); void refreshUpkeep(); };
  let gone = false;
  const cleanup = () => { if (gone) return; gone = true; clearInterval(resTimer); midiRowSync = null; libsRowSync = null; keepSources(); ui.closed(close); scoreEl.focus(); };
  const close = () => { panel.close(); cleanup(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest(".wbe-row-mark, [data-tab]")) return;   // 「?」「©」归 wireSettingRows，页签归壳
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (!v) return;
    if (v === "doc:top") openDocLayer(panel.el, _t("第三方的作者和许可"), sectionsHtml(creditsSections(lang()).filter((s) => s.id !== VOICE_CREDIT_SECTION)));
    else if (v === "src:default:voice") { const a = box.querySelector<HTMLInputElement>("#srcIn"); if (a) a.value = MODEL_SOURCE_DEFAULT; models.source = MODEL_SOURCE_DEFAULT; }
    else if (v === "src:default:gs") { const b = box.querySelector<HTMLInputElement>("#sndIn"); if (b) b.value = SOUNDS_SOURCE_DEFAULT; sources.source = SOUNDS_SOURCE_DEFAULT; }
    else if (v === "midi:connect") void midi.connect();
    else if (v === "habits:card") { close(); openHabitsCardNow("settings"); }   // 「初始设置」那一颗（卡第二版）：收了设置开卡，卡收了回到设置
    else if (v === "factory") { close(); void runFactoryReset({
      attached: () => hasStore(), dirtyCount: () => requireStore().files.dirty.count(), openUnsaved: () => dirty(),
      prepare: async () => { H.release(); singer.restart(); if (hasStore()) await detachStore(); },   // 放下身份（es 不再写）、关掉举着念缓存库的 worker、dispose store；不 drain、不造逃生副本（说明 sheet 已经说清）
      clearShell: () => shell.clearOwnShell(), info, report: (e, level) => reportError(e, level) }); }
    else void libAction(host, v);   // 音源页的删 / 装回来、维护页的清、跳转（settings-libs.ts；不认得的钮它回 false，什么都不做）
  });
}
$("setBtn").addEventListener("click", () => openMainMenu());
/** 「好了」面板（应用内，不用系统弹窗）：分享 / 下载 / 关。 */
function offerFile(file: File, title: string, msg: string, onDone?: () => void): void {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const canShare = typeof navigator.share === "function" && !!nav.canShare?.({ files: [file] });
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">${title}</div><div class="offer-msg">${msg}</div><div class="offer-btns">` +
    (canShare ? `<button class="btn primary" data-v="share">${_t("分享")}</button>` : "") +
    `<button class="btn${canShare ? "" : " primary"}" data-v="download">${_t("下载")}</button><button class="btn" data-v="close">${_t("关##关窗")}</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", async (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v === "download") {
      const a = document.createElement("a"), url = URL.createObjectURL(file);
      a.href = url; a.download = file.name; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      info(_t("已下载 {name}", { name: file.name })); onDone?.(); close();
    } else if (v === "share") {
      try { await navigator.share({ files: [file], title: file.name }); info(_t("已分享")); onDone?.(); close(); }
      catch (err) { if ((err as { name?: string }).name !== "AbortError") showError(_t("分享失败：{Error}", { Error: (err as Error).message })); }
    }
  });
}
// 测试用口子（Playwright 逐样本比对浏览器 == Node 时用）
(window as unknown as Record<string, unknown>).__moonsinger = { singer, engine, exportSong,
  // 修改锁的 E2E 口：按「硬盘上的单个文件」开一首（真 app 里 = 打开框 / 拖进来 / 双击拿到的句柄；无头浏览器点不了系统的文件框，这里递一个 OPFS 的真句柄进来）；读锁态
  openFileHandle: async (h: docFile.FileHandle) => { if (!(await H.leave(_t("打开别的歌")))) return false; openPicked(await docFile.readHandle(h)); return true; },
  editLock: () => ({ state: lock.state(), locked: lock.locked(), canLockNow: lock.canLockNow(), dirtyKind: D.dirtyKind(), dirty: D.dirty(), owes: owesSave() }),
  fileSave: () => fileSave(), lockEditNow: () => lockEditNow(), auditionSha: () => audition?.sha256 ?? null, renderMix: () => renderMixForTest(),
  playheadAt: (p: { paperId: string; tick: number } | null, ahead: { paperId: string; tick: number } | null = null) => view.setPlayhead(p, ahead),   // 播放线摆到这儿（不出声；scripts/render-video.mjs 逐格出带谱视频用）
  printLook: (on: boolean) => { document.body.classList.toggle("print-look", on); },   // 谱面切成「印出来的样子」（v0.16.74；styles.css body.print-look：藏覆盖层 / 缩放读数 / 注解 / 光标，不上强调色；带谱视频用，免得它靠一串界面类名）
  zoomTo: (phys: number | null) => view.restoreZoom(phys),   // 谱面缩放到几倍（物理倍数，null = 自动；不记进设备；scripts/render-video.mjs 让谱占满画面用）
  transport: () => ({ startMark: perfApi.startMark, paused: perfApi.paused, listen: listenOn(), loop: perfApi.loopOn, turnLead: perfApi.turnLead }),   // 走带的状态（E2E 用）
  navPaper: (d: -1 | 1) => navPaper(d), paperSpans: () => perfApi.playTl?.papers.map((x) => ({ id: x.paper.id, t0: x.t0 })) ?? null,   // 换段 / 现在放的时间线里每段从几秒起（E2E 用）
  workspace: () => ({ ...ws, dock: dockOf(ws) }), setMode: (m: Mode) => setMode(m),   // 模式 / 底座（E2E 用）
  renders: () => ({ stats: renders.stats(), link: H.home.kind === "gallery" ? renders.linkOf(homeKey(), H.home.identifier) : null, hit: renderHit(mp3Quality) }), rendersReady: () => renders.ready(), rendersClear: () => renders.clear(),   // 设备上记着的渲好的声音（E2E 用）
  run: (c: Command) => D.run(c), commit: (next: { st?: EditorState; extras?: Extras }, o?: Parameters<typeof D.commit>[1]) => D.commit(next, o), locked: () => D.locked(),   // 指令式唯一入口（E2E / 以后的 MCP 用）
  resource: () => ({ snapshot: resourceSnapshot(), text: describeResources(resourceSnapshot(), BUDGET), lanes: singer.parallelism, budgetLanes: BUDGET.lanes }),
  perf: () => perfReport(), perfReset: () => perfReset(), diag: () => diagText(),   // 热路径秒表（scripts/probe-input-latency.mjs 读）
  speechCache: (op: "info" | "clear") => singer.cache(op, BUDGET.speechDisk),
  // 录音房的接口（刀 4；界面归 Opus / user）：改一条轨（麦克风 id / 总线 id）的效果链 / 发送 / 去向、加删总线、总轨链——都走 undo、推进录音房
  setTrack: (id: string, patch: Record<string, unknown>) => { updateExtras(withTrack(D.extras, id, patch as never), { kind: "studio", label: _t("轨「{id}」", { id }) }); },
  addBus: (name = _t("总线")) => { const id = newBusId(D.extras); updateExtras(withTrack(D.extras, id, { kind: "bus", name }), { kind: "studio", label: _t("加总线「{name}」", { name }) }); return id; },
  removeBus: (id: string) => updateExtras(withoutBus(D.extras, id), { kind: "studio", label: _t("删总线「{id}」", { id }) }),
  setMaster: (patch: Record<string, unknown>) => updateExtras(withMaster(D.extras, patch as never), { kind: "studio", label: _t("总轨") }),
  studioTracks: () => studioTracks(D.extras), labScore: () => { const { tokens, map } = curFlat(); return toLabScore(tokens, activeHum(D.extras, curRole()), songLangOf(tokens, activeHum(D.extras, curRole())), map, activePerfSpec(D.extras, curRole())?.sing ?? {}); }, state: () => D.st, cssHash: __CSS_HASH__, extras: () => D.extras, setEmbedSoftLimit: (n: number) => { embedSoftLimit = n; }, layout: () => ({ ...view.layoutNow(), head: view.head() }) /* head = 光标画在哪（ink 层，W-17 第 1 刀；E2E 看它） */, zoomInfo: () => view.zoomInfo(), dockSide: () => stageEl.dataset.side ?? null, bytes: () => bytesNow(), open: (name: string, bytes: Uint8Array) => openBytes(name, bytes), view, zipList: (bytes: Uint8Array) => Object.keys(unzipSync(bytes)), zipText: (bytes: Uint8Array, path: string) => new TextDecoder().decode(unzipSync(bytes)[path]), load: (o: ReturnType<typeof openBytes>) => loadDoc(songOfOpened(o), { home: { kind: "none", pendingFolder: null }, stem: o.stem, named: true, extras: o.extras, view: o.view, references: o.references }), refHost, makePdf: async (pick?: PdfPick) => { const { r, file } = await makePdf(pick); progress(""); return { bytes: r.bytes, pages: r.pages, stats: r.stats, name: file.name }; },
  setChunk: (v: "phrase" | "sheet" | "whole") => { const role = D.st.song.parts.find((x) => x.id === D.st.at.part)?.role; if (role) updateExtras(withSingChunk(D.extras, role, v, activeHum(D.extras, role)), { kind: "lounge", label: _t("分段唱：{v}", { v }) }); },
  openHeader: (part: string) => headerPanel.open(D.st.at.paper, part, 0, { x: innerWidth / 2, y: 120 }),   // 谱头面板（E2E；v0.16.21 起小卡里没有「谱怎么画」，点谱号开）
  finderCastVoice: async () => { const c = conceptOfIds(await loadCatalog(), { wikidata: "Q7390" }); if (c) await castPick({ kind: "voice", concept: c }); },   // E2E：目录里选小月相（= 人声那一行「选这个」；新声部要先选乐器，v0.16.35）
  set: (n: EditorState) => update(n), tracksNow: async () => (await perfApi.prepare("all"))?.tracks ?? null, addPaper: () => update(addPaper(D.st)), toggleChord: (i: number, p: Pitch) => update(toggleChordPitch(D.st, i, p)), playSong: () => playSong(), afterSignIn: () => afterSignIn(), diagText: () => diagText(), refreshOpenDoc: () => refreshOpenDoc(), wake: async (awayMs: number) => { const lock = lockOnWake(awayMs); if (hasCloudHome()) await gate.wake(lock); return lock; }, gateOpen: () => isGateOpen(), undo: () => undoNow(), redo: () => redoNow(), history: () => ({ past: D.history.past.length, future: D.history.future.length }), undoText: () => lastUndoText, desk: () => deskNow(), setScope: (v: "all" | "segment") => { viewScope = v; view.render(); }, setPages: (v: boolean) => { pageFlow = v; view.render(); }, setScroll: (v: boolean) => { scrollFlow = v; view.render(); view.followNow(); }, partView: (id: string, patch: Partial<PartViewState>) => { setPv(id, patch); afterViewChange(); view.render(); }, flatten: () => flattenPart(D.st.song, D.st.at.part), setPaperHidden: (id: string, h: boolean) => setHidden(id, h), store: () => (hasStore() ? requireStore() : null), es: () => es, gallery: () => gallery, attach: () => ensureAttached(), hasHome: () => hasHome(), folderHome: () => folderHome()?.label ?? null, legacySongs: () => legacySongs(), offerMove: () => offerMove(), openGallery: () => openGallery(), newStoreSong: () => newStoreSong(), openStoreDoc: (id: string) => openStoreDoc(id), identifier: () => H.identifier(), home: () => H.home.kind, dirty: () => dirty(), auth };   // cssHash：样式表版本（见 scripts/build.sh）

// ── 顶栏 ────────────────────────────────────────────────────────────────
/** 键盘只手动开合（v0.16.55；user 11-09「选中音符的时候不应该自动弹键盘，键盘是不是应该只手动toggle比较好？」「鼠标点空白不应该出键盘，不然电脑上很难受」）：
 *  开 / 收 = 底下的「键盘」钮、pad 的「收起」、点亮着的模式钮（只弹）、进「音 / 符」、开「弹」；点谱 / 点空白 / 选中音符 / 点顶栏空白都不动它。
 *  打字（歌词 / 歌名框开着，系统键盘要上来）= 暂时让开（ws.aside，不改手动设的样子），点回谱上就回来（user 早先「键盘输入歌词的时候音乐键盘应该hide」）。
 *  以前（v0.10.x 起）是「五线谱像文本框、点了弹键盘、点别处收」（user 当时「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」），11-09 改成上面这样。 */
/** 键盘收起 / 弹出（pad 的「收起」、底下的「键盘」tab、点谱弹出、点顶栏空白收起）。底座里放什么最终由模式定（applyWorkspace）：「词 / 听」本来就没有键盘。 */
function showPad(on: boolean): void {
  ws.collapsed = !on; if (on) ws.aside = false;   // 手动弹出 = 打字让开的那一下也不算了
  applyWorkspace();
}

// ── 文件（无地逃生口）：一首歌 = 一个 .mxl；家 = 打开的那个文件（桌面 Chromium 能存回去）或没有家（iPad：存 = 下载 / 分享） ──────
/** 台上那位的引擎（= 谁来演、怎么出声）；unknown = 没人能出声（别家谱原来的乐器 / 这一版不认识）。SSoT = 休息室快照（D.extras），不另存状态。 */
function engineNow(): Engine { return activeInstrument(D.extras, curRole())?.engine ?? "unknown"; }
const dirty = () => D.dirty();   // 改过没存（谱 / 休息室 / 录音房 / 封面 / 参考窗的卡）
/** 顶栏的名字（「•」= 改过还没落盘：无地 = 没存；歌库 = 2 s 内会自动存）+ 右边 smart save 钮的状态（永远可见，user 2026-10-08「数据安全红线」）。 */
function renderTitle(): void {
  const d = dirty(), name = docName();
  $("docTitle").textContent = `${name}${d ? " •" : ""}`;
  $("fileBtn").title = _t("文件名（{p}）· {p2}", { p: fileWhere(), p2: H.home.kind === "file" ? _t("本机文件的名字在文件管理器里改") : _t("点了改名") });
  // 网页标题不跟歌名（W-22，user 2026-10-11「标题不要显示歌名，不然这样浏览器老是会记错」）：永远是 index.html 那一句（也是 SEO 的门面）；「•」只在顶栏
  renderSaveButton();
  renderUndo();
}
/** smart save 钮的状态（抄 WXHW / WeebPaint「状态即按钮」）：歌库 = saving（2 s 内自动存）/ local（存在设备上，没登录）/ offline / unsynced（没上云）/ clean（云端也最新）；
 *  本地文件 = fileDirty / fileClean；没家 = unsaved / fresh（新谱没改过）。 */
type SyncKind = "saving" | "unsynced" | "local" | "offline" | "clean" | "fileDirty" | "fileClean" | "unsaved" | "fresh";
function syncKind(): SyncKind {
  const h = H.home;
  switch (h.kind) {
    case "gallery":
      if (dirty()) return "saving";
      if (!isSignedIn()) return "local";
      if (!homeOnline()) return "offline";
      return es.isPushPending() ? "unsynced" : "clean";
    case "file": return dirty() ? "fileDirty" : "fileClean";
    case "none": return dirty() ? "unsaved" : "fresh";
    default: return assertNever(h);
  }
}
const SAVE_SPEC: Record<SyncKind, { icon: string; cls: string; title: string }> = {
  saving: { icon: "database", cls: "s-saving", title: _t("改了，马上自动存到这台设备（点 = 现在存 + 推）") },
  local: { icon: "database", cls: "s-local", title: cloudAvailable() ? _t("存在这台设备上（没登录 OneDrive，不上云；点 = 存 + 去登录）") : _t("存在这个浏览器里（{cloudOffTitle}）", { cloudOffTitle: SITE_TEXT.cloudOffTitle }) },
  offline: { icon: "cloud-unavailable", cls: "s-offline", title: _t("离线：存在这台设备上，回线再推上云") },
  unsynced: { icon: "cloud-upload", cls: "s-unsynced", title: _t("存在这台设备上了，还没推上云（点 = 现在推）") },
  clean: { icon: "cloud-synced", cls: "s-clean", title: _t("云端也是最新的（点 = 复查云端）") },
  fileDirty: { icon: "floppy-disk", cls: "s-unsynced", title: _t("改过还没存回文件（点 = 存）") },
  fileClean: { icon: "floppy-disk", cls: "s-fileClean", title: _t("存在本地文件里了") },
  unsaved: { icon: "floppy-disk", cls: "s-unsynced", title: _t("还没存（点 = 存）") },
  fresh: { icon: "floppy-disk", cls: "s-fresh", title: _t("新的一首，还没存") },
};
/** 歌库在文件夹时这几个状态的说法（图标照旧）。 */
const FOLDER_SAVE_TITLE: Partial<Record<SyncKind, string>> = {
  saving: _t("改了，马上自动存到这台设备（点 = 现在存 + 写进文件夹）"),
  offline: _t("文件夹的权限掉了：改动存在这台设备上（点 = 重新授权）"),
  unsynced: _t("存在这台设备上了，还没写进文件夹（点 = 现在写）"),
  clean: _t("文件夹里也是最新的（点 = 复查）"),
};
function renderSaveButton(): void {
  const k = syncKind(), spec = SAVE_SPEC[k], b = $("saveBtn");
  b.innerHTML = `<svg class="ico"><use href="#${spec.icon}"/></svg>`;
  b.className = `btn save-btn ${spec.cls}`; b.title = (folderHome() && FOLDER_SAVE_TITLE[k]) || spec.title; b.dataset.kind = k;
}
/** 主唱没人上场（别的软件存的谱，原来的乐器这一版没有）：不出声、报错，人来选（user「不出声，报错，人类手动换」）。 */
function noCast(what: string): void {
  showError(_t("「{extras}」这个角色还没有人上场（原来的乐器这一版没有），所以没有{what}。要小月相来唱，点谱前面的「{extras2}」，在「谁来演」选小月相。", { extras: roleLabel(curRole()), what, extras2: roleLabel(curRole()) }));
}
// ── 找人视图（src/ui/finder.ts）：全屏替掉谱区，pad 当试听键盘；试听台 = 临时的一个槽（不进休息室），「上场」才造演奏者 ──────────
let audition: { from: string; bank: number; program: number; note?: number; sfx?: SfxInfo; sha256: string; subset: Uint8Array; label: string } | null = null;
/** 试听台上的是不是这一件（from = 哪个货架的哪一件：GS 的 / 自己文件里的；同一个 bank:program 在两处是两件）。 */
const pickFrom = (p: FinderPick): string => (p.kind === "gs" ? `gs:${p.provider.bank}:${p.provider.program}` : p.kind === "sf2" ? `own:${p.bank}:${p.program}` : "voice");
/** 目录里打开的 .sf2（v0.16.37，施工单 §4.3）：字节留在这里，目录只拿清单；关目录 = 放掉。fileSha256 第一次要时才算。 */
let ownFile: { name: string; bytes: Uint8Array; presets: Sf2PresetInfo[]; fileSha256?: string } | null = null;
/** 试听过的音色库只留最近几件（v0.16.23，Claude Fable 5.1；查 11-08 iPad 按键延迟时发现的病：目录里每点一件 = 一份库解析进声音线程 + 一个专用合成器 + 主线程一份字节，
 *  整个 app 没人调过 unbank——逛一下午目录就是几十份、几百 MB，只涨不落）。规矩：最近 AUDITION_KEEP 件留着（user 11-08「快速来回比」）；歌里（休息室任何候选）用着的永不卸；
 *  关目录 = 试听的全卸；卸了再要 = prepareBank / setAudition 从缓存重载（几 MB、瞬时）。最近的排前面。 */
const AUDITION_KEEP = 3;
let auditionShas: string[] = [];
const shasInUse = (): Set<string> => { const s = new Set<string>(); for (const role of Object.keys(D.extras.lounge)) for (const g of gmCandidates(D.extras, role)) s.add(g.subsetSha256); return s; };
function trimAuditionBanks(keep: number): void {
  const used = shasInUse(), cur = audition?.sha256 ?? null, stay: string[] = [];
  for (const sha of auditionShas) {
    if (sha === cur || stay.length < keep) { stay.push(sha); continue; }
    if (!used.has(sha) && engine.hasBank(sha)) engine.unbank(sha);
  }
  auditionShas = stay;
}
function noteAuditionBank(sha: string): void { auditionShas = [sha, ...auditionShas.filter((x) => x !== sha)]; trimAuditionBanks(AUDITION_KEEP); }
/** pad 键底部的提示音域 = 现在谁在弹：找人视图里 = 试听的那位；写谱时 = 光标所在声部上场的那位（月读 / 元音版 = 她的；乐器 = 目录里角色那件乐器的音域；不知道 = 不画）。 */
function padHint(): HintRange {
  const h = padHintRaw(); if (!h) return null;
  return { ...h, key: finderShown() ? `try|${h.who}|${h.lo}-${h.hi}` : `${curRole()}|${activeId(D.extras, curRole()) ?? ""}` };   // 「谁在弹」：试听台 = 试的那件；写谱 = 光标那个声部台上那位（变了 = pad 的窗口跟过去一次，v0.16.23）
}
function padHintRaw(): HintRange {
  if (finderShown()) return auditionHint;
  const plug = performerOf(activeInstrument(D.extras, curRole())?.engine);
  if (!plug) return null;
  if (plug.hintRange) return plug.hintRange;   // 人声：固定音域（插件自报）；乐器 = 下面按目录查（音效 / 采样键只对 GS 成立，各自有守卫；概念音域和引擎无关）
  if (!catalogNow) { void loadCatalog().then((c) => { catalogNow = c; pad.render(); }).catch(() => { /* 目录载不了：不画提示 */ }); return null; }
  // GS 的音效预设（仓鼠 v8，TinySoundFont 实测；只对 GS 成立，别的 .sf2 不套）：固定原速 = 哪个键都一样、不提示（同鼓件）；
  //   关了固定 = 提示原速键；再开音高对齐 = 提示「原速时听到的那个音」（谱上写它 = 原来的样子）
  const g = activeGm(D.extras, curRole());
  if (g?.sfx) {
    if (g.note !== undefined) return null;
    const s = g.sfx, al = s.align && canAlign(s), k = al ? Math.round(s.midi!) : s.key;
    return { lo: k, hi: k, who: g.name, title: al ? _t("写这个音 = 原速（音高对齐：写的音 ≈ 听到的音）") : _t("原速键：按这个键，采样不拉伸不压缩") };
  }
  if (g && g.note === undefined && g.origin.library === GS_LIBRARY_ID) { const sk = sampleKeyOf(catalogNow, g.bank, g.program); if (sk) return { lo: sk.key, hi: sk.key, who: g.name, title: sk.title }; }   // 旧歌（上场时还没抄 sfx）
  const r = conceptRange(curRole());
  return r ? { ...r, who: roleLabel(curRole()) } : null;   // 谁的音域 = 这个声部（名字从唯一出口拿，12-4）
}
/** 这个角色那件乐器（目录里的概念）的音域（MIDI + 键上的提示字）；目录还没载 / 角色没有概念 / 目录里没写 = null。pad 的提示和简谱的八度基准共用（谱面分家第五刀 5-4）。 */
function conceptRange(role: string): { lo: number; hi: number; title: string } | null {
  const concept = D.extras.lounge[role]?.concept as { ids?: { wikidata?: string | null; local?: string | null } } | undefined;
  const id = concept?.ids?.wikidata ?? concept?.ids?.local; if (!id || !catalogNow) return null;
  return rangeOf(catalogNow.byId.get(id));
}   // 试听台上的（GS 预设；note = 鼓件，pad 任何键都敲它）；null = 月读 / 没选
const GS = SOUNDS["generaluser-gs-2.0.3"];
/** 「你删了」的记号和实际对不上时以实际为准（统筹「v0.17.25 收」第 2 条）：小月相的包都在 / 乐器音色库的整包在设备上 = 记号去掉。
 *  会对不上 = 同一个网址下的正式版（或开发版）把它下回来了：不然音源页写「装着」、清单写「被你删了」。启动时、音源页算状态时各核一次。乐器音色库同一个规矩（统筹只点了小月相，照着对齐）。 */
async function reconcileLibMarks(): Promise<void> {
  if (libRemoved("voice") && !resourcesInFolder() && (await packStore.status(Object.keys(PACKS))).every((x) => x.ready)) setLibRemoved("voice", false);
  if (libRemoved("gs") && (await isSoundPersisted(GS.sha256))) setLibRemoved("gs", false);
}
void reconcileLibMarks();
/** 试听台：从 GS 切出这个预设、载进实时合成器（22 ms + 几 MB）；换到月读 = 清掉。 */
async function setAudition(p: FinderPick | FinderNobody | null): Promise<void> {
  const gen = ++auditionGen;   // 后点的说了算：前一件还在下载 / 切子集时又点了别的（含「没人能演」），前一件回来不许再盖上去
  if (p?.kind === "none") { audition = null; auditionMute = true; auditionHint = null; pad.render(); sound.allOff(); return; }   // 这件没人能演 = 键盘静音（F-210）
  auditionMute = false;
  if (p?.kind === "sf2") {   // 自己文件里的一件：从打开的文件切出来（目录不认识它，键盘不画音域）
    auditionHint = null; pad.render();
    const f = ownFile; if (!f) { audition = null; sound.allOff(); return; }
    try {
      const subset = subsetSf2(f.bytes, [{ bank: p.bank, program: p.program }]), sha256 = await sha256Hex(subset);
      if (gen !== auditionGen) return;
      audition = { from: pickFrom(p), bank: p.bank, program: p.program, sha256, subset, label: p.name };
      sound.allOff(); await engine.bank(sha256, subset); noteAuditionBank(sha256);
    } catch (e) { audition = null; showError(_t("试听不了：{Error}", { Error: (e as Error).message })); }
    return;
  }
  // 键盘的音域跟着试听的那位走（user 2026-10-08「试弹的时候键盘上的音域没有跟进」）：月读 = 她的；乐器 = 目录里它的音域（没有 = 不画提示，窗口不动）
  //   GS 的音效预设试听 = 固定原速（仓鼠 v8；哪个键都一样，同鼓件，不提示）；其余 = 概念的常用音域
  const cat = p?.kind === "gs" ? (catalogNow ??= await loadCatalog()) : null;
  const sk = cat && p?.kind === "gs" && p.provider.note === undefined ? sampleKeyOf(cat, p.provider.bank, p.provider.program) : null;
  auditionHint = !p || sk ? null : p.kind === "voice" ? TSUKUYOMI_RANGE : ((r) => (r ? { ...r, who: conceptName(p.concept.names) } : null))(rangeOf(p.concept));
  if (auditionHint) pad.follow(auditionHint.lo, auditionHint.hi); else pad.render();
  if (!p || p.kind === "voice") { audition = null; sound.allOff(); return; }
  try {
    const bank = await sources.fetchSound(GS, (done) => progress(_t("下载 {name} {bytes}%", { name: GS.name, bytes: Math.round((done / GS.bytes) * 100) }))); progress("");
    setLibRemoved("gs", false);   // 在乐器目录里从这个库挑乐器 = 人自己去货架上拿 = 装回来（v0.17.25）
    const subset = subsetSf2(bank, [{ bank: p.provider.bank, program: p.provider.program }]), sha256 = await sha256Hex(subset);
    if (gen !== auditionGen) return;
    audition = { from: pickFrom(p), bank: p.provider.bank, program: p.provider.program, ...(cat ? castArgsOf(cat, p.provider.bank, p.provider.program, p.provider.note) : {}), sha256, subset, label: p.provider.gmName };   // 音效默认固定原速（上场后也是）
    sound.allOff(); await engine.bank(sha256, subset); noteAuditionBank(sha256);
  } catch (e) { progress(""); audition = null; showError(_t("试听不了：{Error}", { Error: (e as Error).message })); }
}
/** 用试听台上那位放本声部的开头（前 8 秒；走录音房，不写谱）。 */
async function playHeadWith(p: FinderPick): Promise<void> {
  if (engine.playing) stopPlay();
  const { tokens, map } = curFlat(), notes = lightNotes(tokens, map).filter((n) => n.t0 < 8);
  if (!notes.length) { info(_t("谱上还没有音")); return; }
  singer.unlock();
  let track: TrackSpec, label: string;
  if (p.kind === "voice") { await ensureVowels(); track = { id: "audition", kind: "vowel", kana: HUM_KANA[activeHum(D.extras, curRole())], notes: notes.map((n) => ({ t0: n.t0, t1: Math.min(n.t1, 8), key: n.midi, vel: 1, preset: 0 })), gain: null }; label = _t("小月相（哼）"); }
  else {
    if (audition?.from !== pickFrom(p)) await setAudition(p);
    if (audition?.from !== pickFrom(p)) return;
    const a = audition!;
    track = { id: "audition", kind: "sf", sha: a.sha256, notes: notes.map((n) => ({ t0: n.t0, t1: Math.min(n.t1, 8), key: sfKey(n.midi, a), vel: TEMPLATE.lounge.soundfontDefaults.velocity, preset: engine.presetIndex(a.sha256, a.bank, a.program) })), gain: null }; label = a.label;
  }
  const to = Math.min(8, Math.max(...notes.map((n) => n.t1)));
  await previewTrack(track, to, label);   // 临时轨进录音房、从 0 放到 to（src/app/performance.ts）
}
/** 上场：角色改成这个概念（谱上写它的英文名 + 官方 id + id 束 by value），再造演奏者。
 *  声音默认弱引用（2026-10-08 by Claude Opus 5.5；user「我后悔自动embed音源了，改成弱引用吧，app可以自己找吗」）：歌里只记来源 + 子集 sha256，
 *  GS 整包在设备缓存 / 家族音源库里找得到；要歌自己带着声音 = 文件菜单「全部打包进歌」，或导出「打包音源」的副本。 */
/** 「＋ 新声部」开的目录（v0.16.35；user 11-09「你必须得选一个乐器，如果不选的话。退出是不创建新声部，而不是出现一个默认的小月相」）：
 *  选了乐器才建声部（建 + 换上 = 一次提交、一步撤销）；不选关掉目录 = 什么都不建。 */
let newPartPending: { paper: string; giveFrom?: string; place?: { anchor: string; above: boolean } } | null = null;
function newPartState(np: NonNullable<typeof newPartPending>): { st: EditorState; extras: Extras; role: string } {
  const role = newRoleId(D.extras, D.st.song), mic = newMicId(D.extras, D.st.song);
  const id = `P${Math.max(0, ...D.st.song.parts.map((p) => Number(/^P(\d+)$/.exec(p.id)?.[1] ?? 0))) + 1}`;
  let st = addPart(D.st, { id, role, mic }, np.giveFrom ? null : np.paper, np.place?.anchor ?? D.st.at.part);
  if (np.place) st = placePart(st, id, np.place.anchor, np.place.above);
  if (np.giveFrom) st = rebindTrack(st, np.paper, np.giveFrom, id);
  if (st.at.part !== id) { const pp = st.song.papers.find((x) => x.id === np.paper && x.tracks[id]) ?? st.song.papers.find((x) => x.tracks[id]); if (pp) st = setFocus(st, pp.id, id); }   // 光标跟到新声部（后面再选 = 换它的乐器）
  return { st, extras: withTrack(withNewRole(D.extras, role, "n"), mic, {}), role };   // 新乐手的哼的字 = 模板的「嗯」；这个声部的混音轨按模板建（16-4 A2：建声部那一刻就有，存的时候不再补）
}
/** 从目录换上一件乐器（v0.16.35 起选完不关目录：user 11-09「你选乐器的时候不自动退出…在播放的时候，我可以快速切不同的乐器」；回谱 = 「← 谱」/ Esc）。
 *  换一件乐器 = 一次提交 = 一步撤销（v0.16.23；声音到手才一起改，没到 = 什么都不动）。新声部那一路见上面。 */
async function castPick(p: FinderPick): Promise<void> {
  if (finderPlayOnly()) return;   // 只弹着玩：没有要写进去的歌
  if (p.kind === "sf2") { await castOwn(p); return; }
  const cat = await loadCatalog(), c = p.concept, hum = activeHum(D.extras, curRole()); catNow = cat;
  if (p.kind === "gs") {
    if (audition?.from !== pickFrom(p)) await setAudition(p);
    if (audition?.from !== pickFrom(p)) { view.render(); renderTitle(); return; }   // 声音没到（setAudition 已经说了为什么）= 不改名字、不换人、不建声部
  }
  const np = newPartPending, base = np ? newPartState(np) : { st: D.st, extras: D.extras, role: curRole() }, role = base.role;
  const ca = castArgs(cat, c, p.kind === "gs" ? p.provider.sound : null);   // 角色改成这件乐器；候选里也记一份（castAs），点回它时套回去
  const prev = activeId(base.extras, role);   // 换之前台上的是谁：没调过就跟着这次换乐器一起删（施工单 §5 R2，v0.16.38）
  let next = withRoleConcept(base.extras, role, ca, hum), keep: [string, Uint8Array] | null = null;
  if (p.kind === "voice") { const vid = p.light ? CANDIDATE_ID.light : CANDIDATE_ID.full; next = withSwap(withCastAs(next, role, vid, ca, hum), role, vid, hum, { prev, before: base.extras }); }
  else {
    const { subset, sha256 } = audition!, inf = sf2Info(subset);
    next = withSf2Candidate(next, role, { name: p.provider.gmName, bank: p.provider.bank, program: p.provider.program, ...castArgsOf(cat, p.provider.bank, p.provider.program, p.provider.note), subset, sha256, embed: false, calibrationDb: performerOf("soundfont")!.defaultCalibrationDb(GS.id),   // 新上场的响度 = 库报的（9-3）
      origin: { name: GS.name, fileSha256: GS.sha256, bytes: GS.bytes, library: GS.id }, credit: { attribution: [GS.attribution], license: { name: GS.license.name, url: GS.homepage ?? GS.source, text: inf.comment } } }, hum);
    const id = activeId(next, role);
    next = withSwap(withCastAs(next, role, id, ca, hum), role, id, hum, { prev, fresh: true, before: base.extras });   // 新上场的这位记下「作为这件乐器」+ 换上台那一刻的设置指纹（R3），下台那位没调过 = 删（R2）
    keep = [sha256, subset];
  }
  const who = p.kind === "voice" ? activeCandidateName(next, role) ?? "" : p.provider.gmName, label = _t("「{c}」换成：{gmName}", { c: roleNameOf(c), gmName: who });
  if (np) { newPartPending = null; updateBoth(base.st, next, { kind: "score", label: np.giveFrom ? _t("这一行交给了新声部：{c}", { c: roleNameOf(c) }) : _t("加了一个声部：{c}", { c: roleNameOf(c) }) }); }
  else updateExtras(next, { kind: "lounge", label });
  if (keep) sources.session.keep(keep[0], keep[1]);
  sound.allOff(); void prepareBank(); view.render(); renderTitle(); finder.refresh();
  info(np ? _t("加了一个声部：{c}（目录还开着，可以接着换）", { c: roleNameOf(c) }) : label);
}
/** 换上自己 .sf2 里的一件（v0.16.37，施工单 §4.3；原来在乐器页里盲选、不能试听）：切出这一件，歌里只记来源（弱引用），子集留进这台设备的音源缓存。
 *  名字 = 预设名（不再有「叫」框）；谱上的名字不跟着换（目录不认识这件乐器）。新声部那一路同 castPick：选了才建，一步撤销。 */
async function castOwn(p: OwnPick): Promise<void> {
  const f = ownFile; if (!f) return;
  if (audition?.from !== pickFrom(p)) await setAudition(p);
  if (audition?.from !== pickFrom(p)) return;
  const { subset, sha256 } = audition!, inf = sf2Info(f.bytes), hum = activeHum(D.extras, curRole());
  const fileSha256 = (f.fileSha256 ??= await sha256Hex(f.bytes));
  const np = newPartPending, base = np ? newPartState(np) : { st: D.st, extras: D.extras, role: curRole() }, role = base.role, prev = activeId(base.extras, role);
  const made = withSf2Candidate(base.extras, role, { name: p.name, bank: p.bank, program: p.program, subset, sha256, embed: false, calibrationDb: performerOf("soundfont")!.defaultCalibrationDb(null),   // 自己的 .sf2 没有库（9-3）
    origin: { name: f.name, fileSha256, bytes: f.bytes.length },
    credit: { attribution: [inf.name, inf.engineer, inf.copyright].filter((x): x is string => !!x), license: { name: "unknown", text: inf.comment } } }, hum);   // 自己拖进来的只有 INFO 块里的字、许可证 unknown
  const next = withSwap(made, role, activeId(made, role), hum, { prev, fresh: true, before: base.extras });   // R2 / R3 同 castPick
  const label = _t("「{extras}」换成：{name}", { extras: roleLabel(role, base.extras), name: p.name });
  if (np) { newPartPending = null; updateBoth(base.st, next, { kind: "score", label: np.giveFrom ? _t("这一行交给了新声部：{c}", { c: p.name }) : _t("加了一个声部：{c}", { c: p.name }) }); }
  else updateExtras(next, { kind: "lounge", label });
  sources.session.keep(sha256, subset);   // 本次打开里直接能响
  sound.allOff(); void prepareBank(); view.render(); renderTitle(); finder.refresh();
  info(np ? _t("加了一个声部：{c}（目录还开着，可以接着换）", { c: p.name }) : label);
  await rememberSound(sha256, subset, true);
  if (!(await isSoundPersisted(sha256))) showError(_t("「{name}」的声音没能留在这台设备上（空间不够，或这个浏览器不让存）：这次打开里能响；下次要从「{name2}」文件找。想让歌自己带着它：文件菜单「全部打包进歌」。", { name: p.name, name2: f.name }));
}
/** 目录顶条「打开 .sf2…」：读文件、列预设，交给目录（不建声部、不换人——在目录里点了「选这个」才换）。 */
const openOwnSf2 = () => fileInput(".sf2,audio/x-soundfont", async (f) => {
  try {
    const bytes = new Uint8Array(await f.arrayBuffer()), presets = listSf2Presets(bytes);
    if (!presets.length) throw new Error(_t("里面没有乐器"));
    ownFile = { name: f.name, bytes, presets };
    finder.setOwnFile({ name: f.name, presets: presets.map((x) => ({ bank: x.bank, program: x.program, name: x.name })) });
  } catch (e) { showError(_t("读不了「{name}」：{Error}", { name: f.name, Error: (e as Error).message })); }
});
// 乐器目录翻到哪（v0.16.6，user 11-07「即兴的滚动归 App 记，然后文件内的滚动归文件记」）：歌里打开的 = 视图态跟着歌存（deskNow / applyDesk）；歌库「即兴」打开的 = 这台设备上的一个键
const KV_FINDER_IMPRO = "finder-impro", KV_FINDER_PINS = "finder-pins";
const finder = new Finder($("stage"), {
  // 目录顶上「这首歌里用过的」（v0.16.18 搬家 C：原来在乐器页「谁来演」；user 11-07「换乐器的时候…点了谱表的乐器名之后，按一个按钮就立刻能换，然后配置是另外一回事」）
  // 「这首歌的乐器预设」（v0.16.38，施工单 §5 R4）：本声部台上那位 + 调过的，别的声部调过的（同一套设置只一格）；图标 = 当初作为哪件乐器上场（castAs）的那件
  used: () => {
    if (newPartPending) return [];
    const labels = labelsNow(), parts = D.st.song.parts.map((p, k) => ({ role: p.role, label: labels[k] })), cat = catalogNow ?? catNow;
    return songPresets(D.extras, parts, curRole(), activeHum(D.extras, curRole())).map((e) => {
      const c = candidateJson(D.extras, e.role, e.id), eng = performerOf(String((c?.instrument as { engine?: string } | undefined)?.engine ?? "unknown"));
      const wd = (c?.castAs as { concept?: { ids?: { wikidata?: string | null } } } | undefined)?.concept?.ids?.wikidata, icon = wd && cat ? cat.byId.get(wd)?.icon?.id : undefined;
      return { ...e, name: !eng ? _t("{name}（没人能演）", { name: e.name }) : e.name, removable: e.removable && (eng?.removable ?? true), ...(icon ? { icon } : {}) };
    });
  },
  copyPreset: (role, id) => {
    const to = curRole(), next = withCandidateCopy(D.extras, role, id, to, activeHum(D.extras, to)); if (next === D.extras) return;
    const who = activeCandidateName(next, to) ?? id, from = labelsNow()[D.st.song.parts.findIndex((p) => p.role === role)] ?? "";
    const label = role === to ? _t("「{rn}」复制了一份：{who}", { rn: roleLabel(to, next), who }) : _t("「{rn}」拷来了「{from}」的：{who}", { rn: roleLabel(to, next), from, who });
    updateExtras(next, { kind: "lounge", label }); sound.allOff(); void prepareBank(); view.render(); renderTitle(); finder.refresh(); info(label);
  },
  useCandidate: (id) => { setActive(id); finder.refresh(); info(_t("换成「{who}」", { who: activeCandidateName(D.extras, curRole()) ?? id })); },   // 选完不关目录（v0.16.35）
  removeCandidate: (id) => { try { updateExtras(withoutCandidate(D.extras, curRole(), id), { kind: "lounge", label: _t("「{rn}」退掉一位候选", { rn: roleLabel(curRole()) }) }); } catch (err) { showError((err as Error).message); } },
  ownSf2: () => openOwnSf2(),   // v0.16.37：在目录里挑（施工单 §4.3），选文件不算选了乐器
  
  roleLabel: () => (newPartPending ? _t("新声部") : roleLabel(curRole())), audition: setAudition, playHead: playHeadWith, cast: castPick, close: () => closeFinder(),
  // 「＋ 声部」= 先不换，加成新声部试试（v0.16.63，总表第 16 条；user 11-09「加新声部都没必要…可能还是需要的，因为你想看着谱子弹着玩。不过不要占UI太多」）：
  //   走「＋ 新声部」同一条路（选了才建、建 + 换上一步撤销），新声部放在台上这位下面、只在这一段；成了 = 关目录、开「弹」。声音没到 = 什么都不建。
  //   注意（Fable 11-09）：以后删这个临时声部 = 它调过的预设跟着没；要「比一比再换」先把预设给台上那位再删
  canTryNew: () => !newPartPending && !finderPlayOnly(),
  tryNew: async (p: FinderPick) => {
    if (newPartPending || finderPlayOnly()) return;
    newPartPending = { paper: D.st.at.paper, place: { anchor: D.st.at.part, above: false } };
    await castPick(p);
    if (newPartPending) { newPartPending = null; return; }   // 没建成（声音没到）
    closeFinder(false); if (!impro) setImpro(true);
  }, togglePad: () => showPad(padEl.hidden),
  memoChanged: (ctx, m) => { if (ctx === "impro") deviceKvSetJson(KV_FINDER_IMPRO, serializeFinderMemo(m)); },
  // 常用一行（v0.16.36）：记在这台设备上（跟人走、不跟歌走；user 11-09「置顶…跟着用户设置走」）；读到的不像样 = 默认那七格
  pins: () => { const v = deviceKvGetJson<unknown>(KV_FINDER_PINS, null); return Array.isArray(v) ? v.filter((x): x is PinTile => !!x && typeof (x as PinTile).c === "string").map((x) => ({ c: x.c, ...(x.job ? { job: x.job } : {}) })) : [...DEFAULT_PINS]; },
  setPins: (p) => deviceKvSetJson(KV_FINDER_PINS, p) });
finder.restore("impro", unserializeFinderMemo(deviceKvGetJson<unknown>(KV_FINDER_IMPRO, null)));
// ── 录音室（src/ui/studio.ts）：全屏替掉谱区，一个声部一条推子条；增益 / 声像进录音房（studio.json），静音 / 独奏 = partView ──
const partLabel = (id: string): string => { const k = D.st.song.parts.findIndex((p) => p.id === id); return k < 0 ? id : labelsNow()[k]; };
const KV_MIXER_ROWS = "mixer-rows";   // 混音台贴底显示几排（v0.16.14；"auto" / 数字；这台设备）
const studio = new Studio($("stage"), {
  rowsPref: () => { const v = deviceKvGet(KV_MIXER_ROWS); return v && /^[1-9]\d?$/.test(v) ? Number(v) : "auto"; },
  setRowsPref: (v) => deviceKvSet(KV_MIXER_ROWS, String(v)),
  strips: () => { const labels = labelsNow(), cols = partColorIndices(D.st.song.parts.map((p) => roleSound(D.extras, p.role))); return D.st.song.parts.map((p, k) => ({ id: p.id, name: labels[k], color: TAB20[cols[k]], refs: D.st.song.papers.filter((pp) => pp.tracks[p.id]).length, performer: activeCandidateName(D.extras, p.role) ?? _t("（没人上场）"), performerDb: activeCalibrationDb(D.extras, p.role), performerDiffs: performerDiffsOf(p.role), ...micOf(p), muted: pv(p.id).muted, solo: pv(p.id).solo })); },
  setGain: (id, dB) => { const p = D.st.song.parts.find((x) => x.id === id); if (p) updateExtras(withMic(D.extras, p.mic, { gainDb: dB }), { kind: "studio", label: _t("{id} 增益 {p}{p2} dB", { id: partLabel(id), p: dB > 0 ? "+" : "", p2: dB.toFixed(1) }) }, `mix:gain:${id}`); },
  setPan: (id, pan) => { const p = D.st.song.parts.find((x) => x.id === id); if (p) updateExtras(withMic(D.extras, p.mic, { pan }), { kind: "studio", label: _t("{id} 声像 {pan}", { id: partLabel(id), pan: Math.abs(pan) < 0.025 ? _t("中") : pan < 0 ? _t("左 {p}", { p: Math.round(-pan * 100) }) : _t("右 {p}", { p: Math.round(pan * 100) }) }) }, `mix:pan:${id}`); },
  toggleMute: (id) => { setPv(id, { muted: !pv(id).muted }); afterViewChange(); },   // 放着的时候马上静（录音房推子到底、发送一起停）+ 时间线重算（v0.10.38；user「我mute了之后它的reverb为什么还是进了reverb轨？」）
  toggleSolo: (id) => { setPv(id, { solo: !pv(id).solo }); afterViewChange(); },
  play: () => playPause(),
  close: () => closeStudio(),
  master: () => activeMaster(D.extras),
  setMasterGain: (dB) => updateExtras(withMaster(D.extras, { gainDb: dB }), { kind: "studio", label: _t("总轨增益 {p}{p2} dB", { p: dB > 0 ? "+" : "", p2: dB.toFixed(1) }) }, "mix:master"),
  bypass: () => perfApi.mixBypass, setBypass: (on) => { perfApi.mixBypass = on; pushChannels(); diagNote("studio", `bypass ${on ? "on" : "off"}`); },
  toggleLimiter: () => { const on = !activeMaster(D.extras).limiter; updateExtras(withMaster(D.extras, { limiter: on }), { kind: "studio", label: _t("母线限幅{on}", { on: on ? _t("开") : _t("关") }) }); },
  // 插件格（v0.10.8）：总轨 = studio.json master.chain；歌手 = 它那条麦克风轨的 chain
  chain: (track) => (track === STUDIO_MASTER ? activeMaster(D.extras).chain : studioTrack(D.extras, trackKey(track))?.chain ?? []),
  resolve: (track, fx) => resolveChain([fx], { lowestMidi: D.st.song.parts.some((x) => x.id === track) ? lowestMidiOf(track) : null, bpm: songBpm() })[0],   // 和 pushChannels 同一份换算
  setChain: (track, chain, label, merge) => {
    if (track === STUDIO_MASTER) { updateExtras(withMaster(D.extras, { chain }), { kind: "studio", label }, merge); return; }
    updateExtras(withTrack(D.extras, trackKey(track), { chain }), { kind: "studio", label }, merge);
  },
  // 被谁压（侧链）：录音房只给歌手轨的压缩器接 key（总线 / 总轨上的压缩器听自己）
  tabChanged: () => syncSpectrum(),
  keyTracks: (track) => { if (!D.st.song.parts.some((p) => p.id === track)) return []; const labels = labelsNow(); return D.st.song.parts.flatMap((p, k) => (p.id === track ? [] : [{ id: p.id, name: labels[k] }])); },
  // 路由轨（v0.10.9；user「插件：可以随便插，比如混响也是，你可以做中间的路由轨。比如我可以放两个路由轨然后放混响」「有一个默认总线，就是歌手和输出都是builtin的，但是你可以加混音轨」）
  buses: () => studioTracks(D.extras).filter((t) => t.kind === "bus").map((b) => ({ id: b.id, name: b.name, gainDb: b.gainDb, pan: b.pan, bypass: b.bypass, muted: busMuted.has(b.id) })),
  toggleBusMute: (id) => { if (!busMuted.delete(id)) busMuted.add(id); pushChannels(); },   // 混音轨静音：视图态（不进文件、不进 undo），同歌手的静音
  setBusBypass: (id, on) => updateExtras(withTrack(D.extras, id, { bypass: on }), { kind: "studio", label: `${studioTrack(D.extras, id)?.name ?? id} ${on ? _t("旁通") : _t("取消旁通")}` }),
  addBus: () => { const id = newBusId(D.extras), n = studioTracks(D.extras).filter((t) => t.kind === "bus").length + 1, name = _t("混音轨 {n}", { n }); updateExtras(withTrack(D.extras, id, { kind: "bus", name }), { kind: "studio", label: _t("加{name}", { name }) }); return id; },
  removeBus: (id) => { const name = studioTrack(D.extras, id)?.name ?? id; updateExtras(withoutBus(D.extras, id), { kind: "studio", label: _t("删{name}", { name }) }); },
  renameBus: (id, name) => updateExtras(withTrack(D.extras, id, { name }), { kind: "studio", label: _t("改名「{name}」", { name }) }),
  movePart: (id, dir) => { update(movePart(D.st, id, dir)); renderTitle(); },   // 和谱上声部菜单的「上移 / 下移」同一个
  moveBus: (id, dir) => updateExtras(moveBus(D.extras, id, dir), { kind: "studio", label: _t("{extras} 往{p}挪", { extras: studioTrack(D.extras, id)?.name ?? id, p: dir < 0 ? _t("前") : _t("后") }) }),
  setBusGain: (id, dB) => updateExtras(withTrack(D.extras, id, { gainDb: dB }), { kind: "studio", label: _t("{extras} 增益 {p}{p2} dB", { extras: studioTrack(D.extras, id)?.name ?? id, p: dB > 0 ? "+" : "", p2: dB.toFixed(1) }) }, `mix:gain:${id}`),
  setBusPan: (id, pan) => updateExtras(withTrack(D.extras, id, { pan }), { kind: "studio", label: _t("{extras} 声像", { extras: studioTrack(D.extras, id)?.name ?? id }) }, `mix:pan:${id}`),
  outTo: (track) => studioTrack(D.extras, trackKey(track))?.to ?? "master",
  setOutTo: (track, to) => updateExtras(withTrack(D.extras, trackKey(track), { to }), { kind: "studio", label: _t("{track} 出到 {to}", { track: routeName(track), to: routeName(to) }) }),
  sends: (track) => studioTrack(D.extras, trackKey(track))?.sends ?? [],
  setSends: (track, sends, label, merge) => updateExtras(withTrack(D.extras, trackKey(track), { sends }), { kind: "studio", label: `${routeName(track)} ${label}` }, merge),
  /** 这条轨能出到 / 发给的路由轨：除了自己，以及会接成环的（从那条走得回这条的）。 */
  targets: (track) => { const all = studioTracks(D.extras).filter((t) => t.kind === "bus"), key = trackKey(track), next = (id: string) => { const t = all.find((x) => x.id === id); return t ? [t.to, ...t.sends.map((x) => x.to)].filter((x) => x && x !== "master") : []; };
    const reaches = (from: string, to: string) => { const seen = new Set<string>(), stk = [from]; while (stk.length) { const x = stk.pop()!; if (x === to) return true; if (seen.has(x)) continue; seen.add(x); stk.push(...next(x)); } return false; };
    return all.filter((b) => b.id !== key && !reaches(b.id, key)).map((b) => ({ id: b.id, name: b.name })); },
  /** 删一位歌手：只删一张纸都不在的（没引用 = 没有音会丢）；休息室里它的角色一起删；能撤销。 */
  deletePart: (id) => deleteSinger(id),
  openPerformer: (id, at) => { goToPartInst(id); (at === "sum" ? instEl.querySelector<HTMLElement>(".ip-diff-sum") : instEl.querySelector<HTMLElement>('[data-v="cal:-1"]')?.closest(".ip-v"))?.scrollIntoView({ block: "center" }); },   // 推子旁边「乐手 −6 dB」：去乐器页「响度」那一行（第 14 条）
});
/** 录音室 = 底座里（键盘那个位子；和键盘互斥），谱留着能看（2026-10-10 user「录音室的键盘位化，和键盘互相排斥」；之前是全屏页）。 */
/** 混音台 = 「听」的键盘（v0.10.2；user「能不能混音台就是听的键盘，不用单独一个键，就是不同功能有不同键盘」）：打开 = 切到听（底座 = 混音台）；收起 = 收起底座（底下那粒 tab 叫回来）。 */
function openStudio(): void { ui.close(); closeFinder(false); closeInstPage(); ws.collapsed = false; if (ws.mode !== "listen") setMode("listen"); else applyWorkspace(); }   // 峰值表：页开着才要
function closeStudio(): void { if (!studio.isOpen) return; ws.collapsed = true; applyWorkspace(); scoreEl.focus(); }
engine.on("meter", (peak, _active, tracks, ms, gr, cl) => { if (studio.isOpen) studio.meter(peak, tracks, ms, gr, cl); });
engine.on("stereo", (tracks) => { if (studio.isOpen) studio.stereo(tracks); });   // 李萨如图（v0.10.16）   // 每张卡片顶上的峰值细线（v0.10.10）
engine.on("spectrum", (sr, tracks) => studio.spectrum(sr, tracks));   // EQ 页卡片背景的频谱（v0.10.11）
/** 录音房的频谱只在「混音台开着 + EQ 页 + 页面看得见」时算（user「记得我说的省cpu，只有看见的时候才进行统计和绘制」）。 */
/** 背景的统计只在看得见的那一页开（user「记得我说的省cpu，只有看见的时候才进行统计和绘制」）：EQ 页 = 频谱，基础页 = 李萨如图。 */
function syncSpectrum(): void { const on = studio.isOpen && document.visibilityState === "visible"; engine.spectrum(on && studio.currentTab === "eq"); engine.stereo(on && STEREO_TABS.has(studio.currentTab)); }
function openFinder(): void {
  const back = instShown(); if (back) instEl.hidden = true;   // 从乐器页开的：关了回乐器页
  ui.setPage({ k: "finder", playOnly: gallery?.isOpen() ?? false, backToInst: back });
  document.body.classList.toggle("finder-over-gallery", finderPlayOnly());   // 舞台整层盖到歌库上面（styles.css）
  ui.close(); scoreEl.hidden = true; ws.tryout = padLocked(ui.page); showPad(true); padEl.classList.add("is-locked"); pad.clearHeld(); pad.render(); void finder.show({ playOnly: finderPlayOnly() }); updateChrome(); }   // 「弹」亮着 = pad 只弹不写
/** back = 关了回乐器页（默认 = 它是从乐器页开的）；开混音台 / 开乐器页 / 进歌库时传 false = 不回。 */
function closeFinder(back: boolean = ui.page.k === "finder" && ui.page.backToInst): void { newPartPending = null; if (!finder.isOpen) return; const wasPlayOnly = finderPlayOnly(); ui.setPage({ k: "score" }); if (wasPlayOnly) document.body.classList.remove("finder-over-gallery"); finder.hide(); ownFile = null; audition = null; trimAuditionBanks(0); auditionMute = false; ++auditionGen; auditionHint = null; sound.allOff(); padEl.classList.remove("is-locked"); ws.tryout = back; applyWorkspace(); pad.render(); scoreEl.hidden = false; void prepareBank(); view.render(); renderTitle(); updateChrome(); scoreEl.focus(); if (back) openInstPage(); }
/** 换台上的演奏者（人选的，不自动）：改休息室快照里的 active，重画谱前的歌手牌。 */
/** 上场时角色跟着改成的那一份（谱上名 / MusicXML sound / 概念 by value）= withRoleConcept 的参数，也记进候选的 castAs（v0.16.15）。 */
function castArgs(cat: Catalog, c: Concept, providerSound?: string | null): NonNullable<CandidateV2["castAs"]> {
  return { name: roleNameOf(c), sound: providerSound ?? roleSoundOf(cat, c), concept: { ids: { wikidata: c.ids.wikidata, local: c.ids.local, musicxml: c.ids.musicxml, gm: c.ids.gm.map((g) => ({ program: g.program, bank: g.bank })), hs: c.ids.hs }, name: { zh: c.names.zh, en: c.names.en, ...(c.names.ja ? { ja: c.names.ja } : {}) },
    score: { zh: c.names.zh, en: roleNameOf(c) }, ...(c.abbr?.en ? { abbr: { en: c.abbr.en } } : {}) } };   // 谱上的叫法 + 简写按值抄进歌（12-4：显示时不查目录；目录只有英文简写）
}
let catNow: Catalog | null = null;   // 乐器目录（同步拿：点回旧候选时反查用；还没载 = 这一下先不反查、顺手载上）
const catSync = (): Catalog | null => { if (!catNow) void loadCatalog().then((c) => { catNow = c; }).catch(() => {}); return catNow; };
/** 点回这位候选时角色该变成哪件乐器：记着的（castAs）；没记的旧候选 = GS 音色按目录反查本尊、小月相 / 元音版 = 人声；自己的 .sf2（音色号不一定按 GM 排）= 不猜。 */
function castAsOf(extras: typeof D.extras, role: string, id: string): NonNullable<CandidateV2["castAs"]> | null {
  const c = candidateJson(extras, role, id) as { castAs?: CandidateV2["castAs"]; instrument?: { engine?: string; bank?: number; program?: number; note?: number; source?: { origin?: { library?: string } } } } | null;
  if (!c) return null; if (c.castAs) return c.castAs;
  const cat = catSync(), ins = c.instrument; if (!cat || !ins) return null;
  let concept: Concept | undefined;
  // 不按引擎名分支（演奏者注册表守卫，ADR-0004 §2.4）：带 GS 音色号的 = 目录反查本尊；会唱 / 会哼的演奏者 = 人声；别的不猜
  if (ins.source?.origin?.library === GS_LIBRARY_ID && ins.bank !== undefined && ins.program !== undefined) { const row = cat.gmSelf.get(gmKey({ bank: ins.bank, program: ins.program, ...(ins.note !== undefined ? { note: ins.note } : {}) })); concept = row ? cat.byId.get(row.concept) : undefined; }
  else if (ins.engine && (performerOf(ins.engine as Engine)?.lyrics ?? "none") !== "none") concept = conceptOfIds(cat, { wikidata: "Q7390" });
  return concept ? castArgs(cat, concept) : null;
}
function setActive(id: string): void {
  let next = withSwap(D.extras, curRole(), id, activeHum(D.extras, curRole()));   // 下台那位没调过 = 删（施工单 §5 R2）
  const ca = castAsOf(next, curRole(), id); if (ca) next = withRoleConcept(next, curRole(), ca, activeHum(D.extras, curRole()));   // 点回旧候选 = 角色名 / 乐器跟着换回（user 11-07：先选长笛再选人声，点回长笛谱上还写 Voice）
  updateExtras(next, { kind: "lounge", label: _t("「{next}」换人：{next2}", { next: roleLabel(curRole(), next), next2: activeCandidateName(next, curRole()) ?? id }) }); sound.allOff(); void prepareBank(); view.render(); renderTitle(); }
/** 作者栏（标题下面靠右那一块点开）：一块纯文本，纸上照写的显示（不认「作词：」这类格式，所见即所得）。
 *  不提醒、不帮用户写任何东西（user「只是举例子，然后这个你也不应该强迫或者提醒用户写这个，因为谱子也不绑定乐器的」「…一键插入按钮 不要」）。 */
/** 「这首歌」（施工单 13-3；user 2026-11-12「这首歌 要不要放在页面设置旁边…这样的话纸=歌的mental model会非常牢固」）：纸右上角页面设置左边那颗钮、谱上点作者栏也到这里。
 *  分块：名字（歌名、文件名）· 作者和许可 · 封面 · 声音（用到了哪些库、缺哪些、打包 / 解包）· 署名。内容照原来的「封面图」「声音与署名」两张面板和作者栏卡搬，行为不变；
 *  壳 = 界面零件库的 openPanelShell。改动照旧走写入口（修改锁那张表照旧管，不另开口子）。歌名、作者栏、许可在关面板、或者面板里换别的块之前一起写进去（一步撤销）。
 *  改文件名：图库库（@internal/gallery）没有能直接用的改名出口（13-3 核过），照原来的 renameActive。 */
function openSongPanel(focus?: "name" | "credits" | "cover" | "sounds"): void {
  ui.close();
  const content = document.createElement("div"); content.className = "song-panel";
  let coverUrl: string | null = null;
  const libsUsed = (): string => {   // 这首歌里上场的各位用的是哪个库（小月相 = 按句出块的那种演奏者；SoundFont = 它那一块从哪个整包切的）
    const names = labelsNow(), used = new Map<string, string[]>();
    D.st.song.parts.forEach((p, i) => {
      const ins = activeInstrument(D.extras, p.role); if (!ins) return;
      const s = ("source" in ins ? ins.source : null) as Sf2Source | null;
      const lib = performerOf(ins.engine)?.sound === "chunks" ? _t("小月相") : s?.subsetSha256 ? ((s.origin.library && SOUNDS[s.origin.library]?.name) || _t("你自己的 {name}", { name: s.origin.name })) : null;
      if (lib) used.set(lib, [...(used.get(lib) ?? []), names[i] ?? p.id]);
    });
    return [...used].map(([k, v]) => _t("{lib}（{parts}）", { lib: k, parts: v.join("、") })).join(" · ");
  };
  /** 画的时候锁着没有（修改锁两层：界面灰、不收输入 + 写入口拒；统筹「v0.17.26 收」第 1 条）。锁着：歌名 / 作者栏 / 许可（含预设）/ 封面的选图和去掉 / 打包解包灰着；
   *  文件名「改…」（改名不归锁管）、「看清单…」、署名的展开和复制照常。顶上一行 + 「解锁」= 谱上面那扇门的「接着改」。 */
  let drawnLocked = lock.locked();
  const draw = () => {
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    const locked = drawnLocked = lock.locked();
    const song = D.st.song, thumb = D.extras.thumbnail; coverUrl = thumb ? URL.createObjectURL(new Blob([thumb as unknown as BlobPart], { type: "image/png" })) : null;
    const file = H.home.kind === "file" ? `<div class="set-row"><span class="set-note">${esc(_t("本机文件的名字在文件管理器里改（现在是 {name}）", { name: H.home.handle.name }))}</span></div>`
      : `<div class="set-row lib-line"><span>${_t("文件名")}：${esc(docName())}${SONG_SUFFIX}</span><button class="btn" data-v="rename">${_t("改…")}</button></div>`;
    const sounds = soundsSection(), used = libsUsed(), missing = perfApi.issues();
    content.innerHTML =
      (locked ? `<div class="set-row lock-line"><span class="lock-line-what">${iconHtml("lock")}<span>${_t("这首歌锁着，只能看")}</span></span><button class="btn primary" data-v="unlock">${_t("解锁")}</button></div>` : "") +
      settingRowHtml({ labelHtml: esc(_t("名字")), attrs: { "data-sec": "name" },
        belowHtml: `<label class="set-field">${_t("歌名")}<input id="songTitleIn" type="text" spellcheck="false" autocomplete="off" value="${esc(song.title ?? "")}" /></label>` + file }) +
      settingRowHtml({ labelHtml: esc(_t("作者和许可")), attrs: { "data-sec": "credits" },
        belowHtml: `<textarea id="crIn" class="credits-in" rows="4" spellcheck="false" placeholder="${_t("几行都行，照写的显示在纸上（标题下面靠右）")}">${esc(song.credits ?? "")}</textarea>` +
          `<div class="offer-msg">${_t("可不填。存进 MusicXML「印在页面上的字」，别的乐谱软件打开也在纸上。")}</div>` +
          // 这首歌自己的许可（user 2026-10-08「你计算的时候别忘了用户自己写的那一部分，用户可以选」）：默认不写、不替用户选；折叠着（「只有用户自己关心协议的时候才提出这些」）
          `<details class="rights-sec"${song.rights ? " open" : ""}><summary class="part-sec">${_t("许可（可选；你写的这部分：词 / 曲 / 编）")}</summary><div class="set-row">` +
          `<button class="btn cand" data-r="-1" title="${_t("不写：法律默认 = 保留所有权利（别人用要先问你）")}">${_t("未声明（默认）")}</button>` + RIGHTS_PRESETS.map((p, k) => `<button class="btn cand" data-r="${k}" title="${esc(p.note)}">${esc(p.label)}</button>`).join("") + `</div>` +
          `<input id="rtIn" class="credits-in rights-in" type="text" spellcheck="false" autocomplete="off" placeholder="${_t("空着 = 未声明（法律默认就是保留所有权利）；也可以自己写")}" value="${esc(song.rights ?? "")}" />` +
          `<div class="offer-msg">${_t("从紧到松排；CC 那几个发出去以后对已经发出去的收不回。存进 MusicXML 的 &lt;rights&gt;；导出 mp3 时连同署名写进文件的标签里。")}</div></details>` }) +
      settingRowHtml({ labelHtml: esc(_t("封面")), attrs: { "data-sec": "cover" },
        belowHtml: `<div class="set-row cover-row"><span class="cover-thumb">${coverUrl ? `<img src="${coverUrl}" alt="${_t("封面")}" />` : `<span class="cover-none">${_t("没有封面图")}</span>`}</span>` +
          `<label class="btn" title="${_t("选一张图当封面（缩成 256² 存进歌里；歌库卡片上歌名印在图上面）")}"><svg class="ico"><use href="#image"/></svg>${thumb ? _t("换一张…") : _t("选一张图…")}<input id="coverIn" type="file" accept="image/*" hidden /></label>` +
          (thumb ? `<button class="btn" data-v="coverOff">${_t("去掉封面图")}</button>` : "") + `</div>` +
          `<div class="offer-msg">${_t("歌库卡片上的图；歌名和日期照样印在上面。缩成 256² 存进歌里。")}</div>` }) +
      settingRowHtml({ labelHtml: esc(_t("声音")), attrs: { "data-sec": "sounds" },
        belowHtml: (used ? `<div class="offer-msg">${esc(_t("用到的：{libs}", { libs: used }))}</div>` : "") +
          (missing.length ? `<div class="set-row lib-line"><span class="set-note">${esc(_t("缺：{list}", { list: missing.map((i) => `${i.label}（${i.why}）`).join("；") }))}</span><button class="btn" data-v="issues">${_t("看清单…")}</button></div>` : "") +
          (sounds || `<div class="offer-msg">${_t("这首歌没用乐器的声音文件（小月相 / 元音版的声音随 app 走，不进歌）。")}</div>`) }) +
      settingRowHtml({ labelHtml: esc(_t("署名")), attrs: { "data-sec": "credit-lines" }, belowHtml: performersBlock(soundingRoles(), _t("这首歌用了谁的声音")) || `<div class="offer-msg">${_t("还没有可署的名")}</div>` });
    content.querySelector<HTMLInputElement>("#coverIn")!.addEventListener("change", (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { commitText(); void setCover(f).then(draw); } });
    if (locked) {
      for (const el of content.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>('#songTitleIn, #crIn, #rtIn, #coverIn, [data-r], [data-v="coverOff"], [data-v="pack"], [data-v="unpack"]')) el.disabled = true;
      content.querySelector("#coverIn")?.closest("label")?.classList.add("is-disabled");
    }
  };
  /** 歌名、作者栏、许可：一起写进去（改了才写；一步撤销）。 */
  const commitText = () => {
    if (drawnLocked) return;   // 锁着画的：框是灰的、没收过字，不去敲写入口（不然门白闪一下）
    const ti = content.querySelector<HTMLInputElement>("#songTitleIn"), ta = content.querySelector<HTMLTextAreaElement>("#crIn"), rt = content.querySelector<HTMLInputElement>("#rtIn"); if (!ti || !ta || !rt) return;
    let st = D.st;
    if (ti.value !== (st.song.title ?? "")) st = setTitle(st, ti.value);
    if (ta.value !== (st.song.credits ?? "")) st = setCredits(st, ta.value);
    if (rt.value !== (st.song.rights ?? "")) st = setRights(st, rt.value);
    if (st !== D.st) update(st);
  };
  const cleanup = () => { if (coverUrl) URL.revokeObjectURL(coverUrl); coverUrl = null; };
  draw();
  const closeByHost = () => { commitText(); shell.close(); cleanup(); ui.closed(closeByHost); scoreEl.focus(); };
  const shell = openPanelShell({ title: _t("这首歌"), content, width: "wide", buttons: [{ id: "ok", label: _t("好"), primary: true }], closeId: "ok",
    onClose: () => { commitText(); cleanup(); ui.closed(closeByHost); scoreEl.focus(); } });
  ui.open({ k: "sheet", close: closeByHost, redraw: () => { if (lock.locked() !== drawnLocked) draw(); } });   // 锁态变了才重画（解了锁 = 都能改；锁上时 lock.onChange 先把面板关了）；别的重画不碰正在打的字
  content.addEventListener("click", (e) => {
    const t = e.target as HTMLElement, r = t.closest<HTMLElement>("[data-r]")?.dataset.r;
    if (drawnLocked && (r !== undefined || t.closest('[data-v="coverOff"], [data-v="pack"], [data-v="unpack"]'))) return;   // 灰着的那几颗（disabled 本来就不派 click，这里再拦一层）
    if (r !== undefined) { const rt = content.querySelector<HTMLInputElement>("#rtIn")!; const k = Number(r); rt.value = k < 0 ? "" : RIGHTS_PRESETS[k]!.text(new Date().getFullYear()); rt.focus(); return; }
    const v = t.closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    if (v === "unlock") { lockDoor.continueEdit(); return; }   // 和谱上面那扇门的「接着改」同一个动作；解了 → lock.onChange → ui.redraw() → 上面那个 redraw 重画
    if (v === "coverOff") { commitText(); updateExtras(withThumbnail(D.extras, null), { kind: "cover", label: _t("去掉封面图") }); info(_t("去掉了封面图")); draw(); }
    else if (v === "rename") { closeByHost(); void renameActive().then(() => openSongPanel("name")); }
    else if (v === "issues") { closeByHost(); openIssuesSheet(); }
    else if (v === "pack" || v === "unpack") { closeByHost(); void (v === "pack" ? packAll() : unpackAll()).then(() => openSongPanel("sounds")); }   // 做完回到这里：看得见新状态和署名
  });
  if (focus) {
    const sec = content.querySelector<HTMLElement>(`[data-sec="${focus}"]`); sec?.scrollIntoView({ block: "start" });
    if (focus === "credits") content.querySelector<HTMLTextAreaElement>("#crIn")?.focus();
  }
}
/** 页面设置（谱右上角那颗「1 / ♪」钮；7-C 起：页面设置 = 视图——怎么看、怎么印；user 2026-11-12「这个不应该在页面设置里面页面设置是视图」「整理成和设置一样的一页页的那个…都弄成下拉框」）。
 *  两页：看谱（谱种、按 C 调看、和弦标级数、演奏法和表情、只看一号轨）/ 版面（纸张、版式、排法、屏幕放不下纸的时候、小节号、歌词排法）；样子同设置面板（setTabsHtml / setItem / wireSetPages：
 *  页签 + 一项一行 + 长说明进「?」），选项一律是下拉（界面零件库的下拉标准件，7-T）。曲段的列表拿掉了：增删、改名、隐藏、挪、移调是改这首歌，
 *  谱上每一段名字右边的「⋯」、「隐藏 N 段」小标、本段视图翻进隐藏的段都做得到（7-C 核过，没有只在列表里才能做的）。
 *  每一项的「?」里写清它存在哪：跟着这首歌（进歌、能撤销、PDF 照着印）/ 跟着这首歌的视图（存时顺手带，不算改动）/ 只在这次打开里。 */
function openPaperSheet(focus?: "expr" | "layout"): void {   // focus：expr = 「看谱」页落在「演奏法和表情」那一项；layout = 开在「版面」页（7-V 的提示点进来）
  ui.close();
  const box = document.createElement("div");   // 面板外壳里那一块（壳 = 界面零件库的 openPanelShell；「设置、页面设置搬到壳上」，看上去不变）
  box.className = "paper-body";
  let page: "look" | "layout" = focus === "layout" ? "layout" : "look";   // 打开默认「看谱」这一页
  const sel = (k: string, items: readonly (readonly [string, string])[], cur: string, disabled = false) =>
    dropdownHtml(items.map(([value, label]) => ({ value, label })), cur, { cls: "hp-sel set-sel", attrs: `data-pg="${k}"`, ...(disabled ? { disabled: true } : {}) });
  /** 歌里写着这一版认不出来的值（只有比这一版新的文件会带来；16-4 A3）：下拉里多一项「这一版不认识（值）」、亮着它；选别的 = 换成认得的那一项。 */
  const ODD = "?odd";
  /** 下拉里「跟着软件」那一项的值（自己的记号，不是歌里写的那个字；第 17 条 17-1）。 */
  const FOLLOW = "?follow";
  const known = (raw: string, items: readonly (readonly [string, string])[], cur: string): [readonly (readonly [string, string])[], string] =>
    items.some(([v]) => v === raw) || raw === cur ? [items, cur] : [[...items, [ODD, _t("这一版不认识（{v}）", { v: raw })] as const], ODD];
  /** 「?」里的一张小对照：每个选项一行「名字 — 说明」。 */
  const defs = (rows: readonly (readonly [string, string])[]) => rows.map(([a, b]) => `<b>${a}</b> — ${b}`).join("<br>");
  const where = (s: string) => `<br><span class="set-where">${s}</span>`;
  const IN_SONG = where(_t("跟着这首歌存：进歌、能撤销，导出的 PDF 照这里印。")), IN_VIEW = where(_t("跟着这首歌的视图存：存的时候顺手带上，不算改动、不进撤销。")), IN_SESSION = where(_t("只在这次打开里有效，不进歌。"));
  const draw = () => {
    const look = lookOf(D.st.song, lookCtx()), p = look.paper, movable = !IN_C_APPLIES[look.notation];   // 选中哪一项 = 这首歌现在怎么画（src/look，只此一处读）
    const fileMm = customStaffMm(look);   // 谱高是别家文件里写的、不是两档之一
    const mrow = marginRow(look);   // 边距按值带着（别家的谱、老文件）才有「边距」那一行（第 17 条 17-2 顺手）
    // 第一格「跟着软件（现在是：X）」（第 17 条 17-1）：选它 = 这一项写回跟着软件；亮着 = 这首歌没选过这一项。下拉的值用自己的记号 FOLLOW，不拿歌里的字比
    // 第 21 条（v0.17.38）：「跟着」挪到最后一格、叫「跟着我的习惯（现在是：X）」（新建的歌写具体的值，跟着只是一个不显眼的选项；user「跟default只是一个技术上的选项，用户不太会用」）
    //   v0.17.39（统筹审 v0.17.38）：只有习惯那几行叫「跟着我的习惯」，别的行叫「跟着软件的默认」（src/look followOptionText；边距那一行另有自己的「跟着软件」，见下）
    const fol = (key: LookKey) => [FOLLOW, followOptionText(key, lookCtx())] as const;
    const cur = (key: LookKey, v: string) => (look.follows[key] ? FOLLOW : v);
    const one = D.st.song.parts[0], only1 = !!one && pv(one.id).only && D.st.song.parts.every((q) => q === one || !pv(q.id).only);
    // 看谱：谱种第一行（谱面分家第四刀，user 11-11「面板第一行放谱种」）；按 C 调看 / 中央 C / 和弦标级数 / 演奏法和表情 = 这首歌的，走修改锁的「看法」（锁着也能切、锁着期间不写文件）
    const lookPage =
      // 视图（施工单第 12 条 12-3；原来叫「排法」、在「版面」页。user「页面设置的排法不太好懂。页面预览的语义？…类似老word的page vs web视图」）：
      //   只改屏幕上怎么看，打印 / 导出永远按纸分页；挪到「看谱」页最上面
      setItem(_t("视图"), sel("flow", [["pages", _t("页面（分页，和印出来一样）")], ["cont", _t("连续（不分页）")], ["scroll", _t("横卷（不折行，往右滚）")]], scrollFlow ? "scroll" : pageFlow ? "pages" : "cont"),
        _t("只影响屏幕上怎么看：打印和导出永远按纸分页。") + "<br>" +
        defs([[_t("页面"), _t("按纸（A4 / A5）的真实高度断页，和印出来的一样")], [_t("连续"), _t("不断页，每一行和页面视图一样，只是不分页")], [_t("横卷"), _t("每张纸一行、一直往右，横着滚；声部名钉在左边")]]) + IN_VIEW) +
      setItem(_t("谱种"), sel("nota", ...known(cur("notation", D.st.song.notation), [...NOTATIONS.map((id) => [id, notationName(id)] as const), fol("notation")], cur("notation", look.notation))),
        defs(NOTATIONS.map((id) => [notationName(id), NOTATION_NOTE[id](look.middleC)] as const)) + IN_SONG) +
      // 名字写这件事本身、默认那一项也说出它是什么（user 11-12 看截图：「这个看谱方式比较让人难以理解它是干什么的」；统筹：不用「方式」「专业」这类要猜的词）；
      //   叫「移调辅助」（user 11-12「我记得我们一开始定的语义是辅助功能啊…这几个看谱里面…主要就都是一些辅助功能」，统筹定名）
      setItem(_t("移调辅助"), sel("inc", [["off", _t("不用（照写的调）")], ["on", _t("按 C 调看")], fol("viewInC")], cur("viewInC", look.viewInC ? "on" : "off"), movable),
        (movable ? (MOVABLE_DO[look.notation] ? _t("简谱本来就是首调（1 = 这个调的主音），用不上「移调辅助」；存着的选择不动，切回五线谱照旧。") : _t("字母谱写的是实际的音名，用不上「移调辅助」；存着的选择不动，切回五线谱照旧。"))
          : defs([[_t("不用（照写的调）"), _t("按实际的调画谱，键上大字写音名")], [_t("按 C 调看"), _t("谱换到 C 调画、每个调号上方写「1=原来的调」；键上的大字也按 C 调写（谱上画成的名字），小字是实际的音；键的位置不动")]])) + IN_SONG) +
      // 中央 C 叫 C 几（7-B，user「我们的中央 C 叫 C4 老规矩，页面设置里面可以调」；第 18 条起一直在——它管所有写成「字母 + 八度数字」的地方，统筹 b149a4d9 第 4 点）
      setItem(_t("中央 C 叫"), sel("mc", [...MIDDLE_C_NAMES.map((n) => [String(n), middleCLabel(n)] as const), fol("middleC")], cur("middleC", String(look.middleC))), MIDDLE_C_NOTE() + IN_SONG) +
      // 和弦辅助 = 标不标（chordTags）、和弦写法 = 标成什么样（chordTagStyle）：一行一个键（第 19 条，统筹 0d97f07a）
      setItem(_t("和弦辅助"), sel("ct", [["on", _t("标")], ["off", _t("不标")], fol("chordTags")], cur("chordTags", look.chordTags ? "on" : "off")), _t("叠在一起的和弦下面标出它是什么和弦（写法在下一行）；点它看全部候选") + IN_SONG) +
      setItem(_t("和弦写法"), sel("cts", ...known(cur("chordTagStyle", D.st.song.chordTagStyle), [...CHORD_TAG_STYLES.map((v) => [v, CHORD_TAG_STYLE_LABEL[v]()] as const), fol("chordTagStyle")], cur("chordTagStyle", look.chordTagStyle))), CHORD_TAG_STYLE_NOTE() + IN_SONG) +
      // 演奏法和表情（7-G；user 11-11 深夜「显示里面再加一个不显示articulation和表情的选项。打印时也许会用，相当于前面讨论的不overwhelm小孩和初学者」）
      setItem(_t("演奏法和表情"), sel("expr", [["on", _t("显示")], ["off", _t("不显示")], fol("expressions")], cur("expressions", look.expressions ? "on" : "off")),
        _t("不显示 = 键盘「演奏法」「力度」两页上的东西都不画、不占地方（跳音、重音、连线、呼吸、力度、渐强渐弱…），行跟着变矮；第一行谱头那一行的右端有一行淡字「演奏法和表情：不显示」（不印），点它回到这里。只管画：播放照写的来，歌里的记号一个不动；PDF 照眼前的样子印。") + IN_SONG) +
      // 只看一号轨（v0.9.29；user 2026-10-10「然后视图加一个只看一号轨的功能」）：= 全曲第一位歌手的「只看它」；和歌手牌那个是同一个开关
      (one ? setItem(_t("只看一号轨"), sel("only1", [["off", _t("都看")], ["on", _t("只看「{song}」", { song: labelsNow()[0] ?? "" })]], only1 ? "on" : "off"), _t("速度、风格、反复写在最上面那位身上；别的声部缩成细行。") + IN_VIEW) : "");
    const layoutPage =
      setItem(_t("纸张"), sel("paper", [...PAPER_KINDS.map((k) => [k, _t("{paper}（{note}）", { paper: PAPER_LABEL[k], note: PAPER_NOTE[k] })] as const), ...(p.kind === "other" ? [["other", _t("{paper}（{note}）", { paper: _t("其他"), note: paperSizeText(p) })] as const] : []), fol("paper")], cur("paper", p.kind)),
        _t("整首歌一张纸。纸越大一行放的小节越多；屏幕放得下就照纸排。不打印的时候不分页。") + IN_SONG) +
      // 边距（17-2 顺手，统筹 2026-11-13）：这首歌带着自己的边距时才出这一行；第一格跟着软件 = 用这张纸自己的边距，另一格 = 照实写这首歌带着的四边、选它 = 不动
      (mrow ? setItem(_t("边距"), sel("margin", [[FOLLOW, _t("跟着软件（现在是：{x}）", { x: mrow.follow })], ["file", _t("自定义（{x}）", { x: mrow.custom })]], "file"),
        _t("纸边留多宽。这首歌带着自己的边距（别的软件存的谱、老文件里写着的）；选「跟着软件」= 用这张纸自己的边距，换纸时跟着换。") + IN_SONG) : "") +
      // 音符密度（user 11-12「嗯，那么叫音符密度」；原来叫「版式」）。别家文件写的谱高不是我们两档里的任何一档：如实叫「自定义（N 毫米）」（user「应该有一个选项是相当于自定义，得如实那么说」），选它 = 不动。
      //   每个选项得到什么写进问号（下拉的项只有一行字，不把选项撑长）；问号里只说「常用」，不说「应该」（统筹 2026-11-12）
      setItem(_t("音符密度"), sel("density", [...DENSITIES.map((z) => [z.id, z.label] as const), ...(fileMm !== null ? [["file", _t("自定义（{mm} 毫米）", { mm: +fileMm.toFixed(2) })] as const] : []), fol("density")], fileMm !== null ? "file" : cur("density", look.density)),
        _t("同一张纸上排得松还是密：音符多大、行距、音和音之间的距离一起变。") + "<br>" +
        defs([...DENSITIES.map((z) => [z.label, z.note] as const), ...(fileMm !== null ? [[_t("自定义"), _t("别的软件存的谱带着自己的谱高，照它排")] as const] : [])]) + "<br>" +
        _t("单行的谱、给新手看的常用舒适；声部多的总谱常用紧凑。存进 MusicXML 的 scaling 和行距，别的软件打开也一样。") + IN_SONG) +
      setItem(_t("屏幕放不下纸的时候"), sel("reflow", [["fit", _t("不折行")], ["reflow", _t("折行")]], reflow ? "reflow" : "fit"),
        defs([[_t("不折行"), _t("整张纸缩小，行和纸上一样")], [_t("折行"), _t("按屏幕宽排，谱大一点")]]) + IN_SESSION) +
      setItem(_t("小节号"), sel("bn", ...known(cur("barNumbers", D.st.song.barNumbers === "line" ? "on" : D.st.song.barNumbers), [["on", _t("每行开头")], ["off", _t("不印")], fol("barNumbers")], cur("barNumbers", look.barNumbers ? "on" : "off"))), _t("每行最上面那条谱的左上角，小字；每张纸从 1 数，弱起算 0") + IN_SONG) +
      setItem(_t("歌词排法"), sel("lyr", ...known(cur("lyricFit", D.st.song.lyricFit), [["rhythm", _t("按节奏")], ["lyrics", _t("按歌词")], fol("lyricFit")], cur("lyricFit", look.lyricFit))),
        defs([[_t("按节奏"), _t("音的位置只看时值，打字时音符不动；歌词让路：借旁边的空 → 这一行一起缩一点 → 还放不下画灰")], [_t("按歌词"), _t("长的字把音推开（出版谱的老规矩）")]]) + IN_SONG) +
      // 谱上的字用哪种语言（施工单 12-4；user「页面设置是不是也应该有一个语言，影响打印？」）：这首歌的，走修改锁的「看法」（同小节号、音符密度）
      setItem(_t("谱上的字"), sel("tl", ...known(D.st.song.textLang, textLangItems(), look.textLang)), TEXT_LANG_HELP() + IN_SONG);
    box.innerHTML = `<div class="set-page" data-page="look">${lookPage}</div><div class="set-page" data-page="layout">${layoutPage}</div>`;
    mountDropdowns(box);
    // 「套用我的习惯」（第 21 条，v0.17.38；原来是第 17 条的「全部跟着软件」）= 壳底下那一颗：把这首歌的显示设置都写成现在的值（同新建的歌那一套），一步撤销；
    //   写了也一个都不变 = 灰着（原来「选过几项」那个判断拿掉了：新建的歌本来就都写着值）
    const all = panel.el.querySelector<HTMLButtonElement>('[data-panel-btn="alldef"]');
    //   v0.17.39：只写习惯那几样 + 谱上的字，别的不动（stampLooks apply）；提示里的名字从 LOOK_ROW_NAME 拿，习惯多一样提示跟着多一样
    if (all) { all.disabled = stampLooks(D.st.song, lookCtx(), lang(), "apply") === D.st.song; all.title = _t("把这首歌的{list}写成我的习惯现在的样子（没设习惯的照软件的默认），谱上的字写成界面的语言；别的不动。能撤销", { list: HABIT_KEYS.map((k) => LOOK_ROW_NAME[k]()).join(_t("、")) }); }
    showPage(page);
  };
  // 壳：标题、页签条、能滚的一层、底下两颗（全部跟着软件 / 好）；关 = 「好」/ 点外面 / Esc，都回 onClose
  let showPage: (pg: "look" | "layout") => void = () => undefined;
  const panel = openPanelShell<"look" | "layout">({ title: _t("页面设置"), content: box, width: "wide",
    tabs: { tabs: [{ id: "look", label: _t("看谱"), icon: "visibility-show", title: _t("看谱：这张纸在屏幕上怎么看") }, { id: "layout", label: _t("版面"), icon: "file", title: _t("版面：纸张和音符密度") }], current: page, onPick: (pg) => showPage(pg) },
    buttons: [{ id: "alldef", label: _t("套用我的习惯") }, { id: "close", label: _t("好"), primary: true }], closeId: "close",
    onButton: (id) => { if (id === "alldef") { setPageLook({ ...D.st, song: stampLooks(D.st.song, lookCtx(), lang(), "apply") }, { kind: "allLooks", label: _t("套用我的习惯") }); draw(); } },
    onClose: () => cleanup() });
  panel.el.classList.add("set-panel", "paper-panel");
  showPage = wireShellPages(panel, box, (pg) => { page = pg; });
  draw();
  if (focus === "expr") {   // 落在那一项：高亮一下、滚到它、焦点放在它的下拉上（「演奏法和表情：不显示」的淡提示点进来的）
    const dd = box.querySelector<HTMLButtonElement>(`[data-pg="${focus}"]`), it = dd?.closest<HTMLElement>(".wbe-row");
    if (it) { it.classList.add("is-target"); it.scrollIntoView({ block: "nearest" }); dd!.focus(); setTimeout(() => it.classList.remove("is-target"), 1600); }
  }
  let gone = false;
  const cleanup = () => { if (gone) return; gone = true; ui.closed(close); scoreEl.focus(); };
  const close = () => { panel.close(); cleanup(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("change", (e) => {
    const el = e.target as HTMLButtonElement, k = el.dataset.pg, v = el.value; if (!k || v === ODD) return;   // 「这一版不认识」那一项不是一个可选的值
    // 选「跟着软件」：这一项写回跟着软件（src/look followDefault）；按这一项原来那一类走写入口（修改锁的「看法」按类别核）
    const FOLLOW_KEY: Record<string, Exclude<LookKey, "staffMm">> = { nota: "notation", inc: "viewInC", mc: "middleC", ct: "chordTags", cts: "chordTagStyle", expr: "expressions", paper: "paper", density: "density", bn: "barNumbers", lyr: "lyricFit", margin: "marginMm" };
    if (v === FOLLOW && FOLLOW_KEY[k]) {
      // 撤销那一句跟着这一格的名字分（v0.17.39；src/look followUndoLabel）
      const key = FOLLOW_KEY[k]!, next = { ...D.st, song: followDefault(D.st.song, key) }, label = followUndoLabel(key);
      if (next !== D.st) D.commit({ st: next }, { locus: { kind: LOOK_KEY_OP[key], label } });   // 这一项走哪一类看法 = 锁那一边的表（v0.17.33）
      draw(); return;
    }
    if (k === "nota") setSongLook(setNotation(D.st, v as NotationId), v === "jianpu" ? _t("简谱") : v === "letters" ? _t("字母谱") : _t("五线谱"));
    else if (k === "inc") setSongLook(setViewInC(D.st, v === "on"), `${_t("移调辅助")} ${v === "on" ? _t("按 C 调看") : _t("不用（照写的调）")}`);
    else if (k === "mc") { const n = Number(v); setSongLook(setMiddleC(D.st, n), _t("中央 C 叫 C{n}", { n })); }
    else if (k === "ct") setSongLook(setChordTags(D.st, v === "on"), `${_t("和弦辅助")} ${v === "on" ? _t("标") : _t("不标")}`);
    else if (k === "cts" && (CHORD_TAG_STYLES as readonly string[]).includes(v)) setSongLook(setChordTagStyle(D.st, v as ChordTagStyle), `${_t("和弦写法")} ${CHORD_TAG_STYLE_LABEL[v as ChordTagStyle]()}`);
    else if (k === "expr") setSongLook(setExpressions(D.st, v === "on"), v === "on" ? _t("显示演奏法和表情") : _t("不显示演奏法和表情"));
    else if (k === "only1") { const one = D.st.song.parts[0]; if (one) { for (const q of D.st.song.parts) setPv(q.id, { only: v === "on" && q === one }); afterViewChange(); } }
    else if (k === "paper") { if ((PAPER_KINDS as string[]).includes(v)) setPageLook(setPaper(D.st, v as PaperKind), { kind: "paperSize", label: `${_t("纸张")} ${PAPER_LABEL[v as PaperKind]}` }); }
    else if (k === "density" && v !== "file") setPageLook(setDensity(D.st, v as Density), { kind: "density", label: `${_t("音符密度")} ${DENSITIES.find((z) => z.id === v)?.label ?? v}` });
    else if (k === "flow") { pageFlow = v === "pages"; scrollFlow = v === "scroll"; view.render(); view.followNow(); }
    else if (k === "reflow") { reflow = v === "reflow"; view.render(); }
    else if (k === "bn") setPageLook(setBarNumbers(D.st, v === "on"), { kind: "barNumbers", label: `${_t("小节号")} ${v === "on" ? _t("每行开头") : _t("不印")}` });
    else if (k === "tl") setSongLook(setTextLang(D.st, v as TextLang), _t("谱上的字：{l}", { l: textLangItems().find(([x]) => x === v)?.[1] ?? v }));
    else if (k === "lyr") setPageLook(setLyricFit(D.st, v === "rhythm" ? "rhythm" : "lyrics"), { kind: "lyricFit", label: `${_t("歌词排法")} ${v === "rhythm" ? _t("按节奏") : _t("按歌词")}` });   // 歌词怎么排（v0.9.40）：进歌里、能撤销；PDF 跟着
    draw();
  });
}
/** 角色卡（第一行谱号左边的角色名）点开（user「歌手牌同意，和打谱软件对齐」→「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西…
 *  所以是你可以写或者选role的名字，帮我多想几个preset。然后名字之外再选乐器」）：
 *  上 = 角色名（谱上写的、MusicXML <part-name>；写或者点预设），中 = 谁来演（乐器 = 候选，名字不上谱——窄接口），下 = 就地改它的设置。改了立刻生效。
 *  现在一个声部、乐器只有月读（完整 / 轻量）= 多乐器的占位（数据契约「每个声部在谱号前面选角色和麦克风」）。 */
/** 要画的声部：谱上写角色名（同名同种带号）、没人上场的画淡色、第一个声部上面画速度；隐藏的缩成细行；名字下面打出声 / 显示的角标。 */
/** 每个声部唱不出来的歌词（token id → 为什么；纪律「做不到的一律画灰 + 明说」）。按歌 + 休息室缓存（每次重画都要，别每次重算）。 */
let lyricMuteKey: unknown[] = [], lyricMuteVal = new Map<string, Map<number, LyricIssue>>();
function lyricMutes(): Map<string, Map<number, LyricIssue>> {
  if (lyricMuteKey[0] === D.st.song && lyricMuteKey[1] === D.extras) return lyricMuteVal;
  const out = new Map<string, Map<number, LyricIssue>>();
  const order = songPlayOrder(D.st.song);
  for (const p of D.st.song.parts) {
    const eng = activeInstrument(D.extras, p.role)?.engine ?? null, mode = activeSingChunk(D.extras, p.role), m = new Map<number, LyricIssue>();
    // 语言 = 小月相唱的那一段的语言，和唱的时候同一份（timeline.ts sungLangsOf；写文件的 xml:lang 也问它）
    const byId = sungLangsOf(D.st.song, order, p.id, mode, activeHum(D.extras, p.role));
    for (const paper of D.st.song.papers) {
      const toks = paper.tracks[p.id]; if (!toks) continue;
      for (const [i, x] of lyricIssues(toks, performerOf(eng)?.lyrics ?? null, (i) => byId.get(toks[i].id)!)) m.set(toks[i].id, x);
    }
    out.set(p.id, m);
  }
  lyricMuteKey = [D.st.song, D.extras]; lyricMuteVal = out;
  return out;
}
/** 光标所在声部、下标 i 那个音的歌词唱不出来的那句话（歌词框底下的提示）；唱得出来 = null。 */
function lyricHintAt(i: number): string | null {
  const t = tr(D.st)[i], p = D.st.song.parts.find((x) => x.id === D.st.at.part); if (!t || !p) return null;
  const x = lyricMutes().get(p.id)?.get(t.id); if (!x) return null;
  return lyricWhyText(x, roleLabel(p.role));
}
// ── 歌词旁显示引擎念成什么（v0.9.34，2026-10-10 Opus 5.5；user「小件做」，AI 提的「歌词框 / 歌手牌里显示引擎念成什么」）：
//    全假名时日语前端会把助词 は 注成 ha（团子 B「としよりだんごはめを」= ha-me），user 不懂日语看不出来，看得见才能自己改成 わ。
//    读音 = 唱的时候同一份第 1 步（sing-core readingCore），按这一句的唱谱内容缓存；只在月读上场、引擎已经起来时有（不为看读音起引擎、下模型）。
let readPlans: { song: Song; part: string; view?: ChunkPlan[]; segment?: ChunkPlan[] } | null = null;
const readings = new Map<string, Reading>(), readAsked = new Set<string>(); let readRetryAt = 0;
function readPlanOf(tokId: number, part: PartDef): ChunkPlan | null {
  if (!readPlans || readPlans.song !== D.st.song || readPlans.part !== part.id) readPlans = { song: D.st.song, part: part.id };
  for (const scope of ["view", "segment"] as const) {   // 放的时候那一句（视图 / 编排）；不在里面（编排没点到这张纸）= 这张纸单独
    const chunks = (readPlans[scope] ??= ((song) => buildTimeline({ song, order: songPlayOrder(song), parts: [part], info: performerInfo, singOpt: humOpt() }).chunks)(songIn(scope)));
    const plan = chunks.find((c) => c.entryOf.has(tokId)); if (plan) return plan;
  }
  return null;
}
function lyricReadingAt(i: number): LyricReading | null {
  const t = tr(D.st)[i], part = D.st.song.parts.find((x) => x.id === D.st.at.part);
  if (!t || t.kind !== "note" || !part || performerOf(engineNow())?.lyrics !== "words") return null;   // 只有唱字的那位才有「念成什么」
  const plan = readPlanOf(t.id, part); if (!plan) return null;
  const s = plan.score, key = `${s.LANG}|${s.TEXT}|${s.SCORE.map((e) => e.kana).join(" ")}`, r = readings.get(key);
  if (!r) {
    if (!readAsked.has(key) && performance.now() >= readRetryAt) {
      readAsked.add(key);
      void singer.read(s).then((x) => { if (x.ready) { readings.set(key, x); if (readings.size > 200) readings.delete(readings.keys().next().value!); } else readRetryAt = performance.now() + 3000; })
        .catch(() => undefined).finally(() => { readAsked.delete(key); view.lyrics.reposition(); });
    }
    return null;
  }
  const parts = (r.labels ?? r.said).map((x) => prettyReading(s.LANG, x));
  if (!r.labels) return { parts, at: -1, note: _t("小月相念出来 {n} 个音节、谱上 {n2} 个，对不上（唱的时候会报错）：", { n: r.said.length, n2: s.SCORE.length }) };
  return { parts, at: plan.entryOf.get(t.id) ?? -1, note: s.LANG === "zh" ? _t("小月相念成（音素 + 声调）：") : _t("小月相念成：") };
}
/** 印出来的字用哪种语言（12-4）：歌里「谱上的字」那一项，跟着界面 = 界面语言。谱上的声部名 / 简写、简谱鼓的图例按它（排版自己按同一项翻「编排」「吸 / 深吸」）。 */
function scoreTextLang(): Lang { return textLangIn(lookOf(D.st.song, lookCtx()), lang()); }
/** 声部显示成什么（12-4：唯一出口 src/format/part-show.ts；语言 = 这首歌「谱上的字」那一项，跟着界面 = 界面语言）。song / extras 不给 = 现在的。 */
const showsNow = (song: Song = D.st.song, extras: Extras = D.extras): PartShow[] => partShow(song, extras.lounge, textLangIn(lookOf(song, lookCtx()), lang()));
const labelsNow = (song: Song = D.st.song, extras: Extras = D.extras): string[] => showsNow(song, extras).map((x) => x.name);
/** 某个角色显示成什么（这首歌里第一个用它的声部，重名带号；还没建好的新声部 = 不带号）。 */
const roleLabel = (role: string, extras: Extras = D.extras, song: Song = D.st.song): string => roleNameIn(song, extras.lounge, textLangIn(lookOf(song, lookCtx()), lang()), role);
/** 某个声部显示成什么。 */
const partNameNow = (partId: string): string => partNameOf(D.st.song, D.extras.lounge, scoreTextLang(), partId);
/** 「谱上的字」的选项（页面设置「版面」页、导出乐谱的面板同一份）：跟着界面那一项写出现在界面是哪种语言；别的语言用它自己的写法（中文 / English）。 */
const textLangItems = (): [TextLang, string][] => [...TEXT_LANGS.filter((v) => v !== "ui"), "ui" as const].map((v) => [v, v === "ui" ? _t("跟着界面（{lang}）", { lang: LANG_NAME[lang()] }) : LANG_NAME[v]]);   // 「跟着界面」在最后一格（第 21 条）
const TEXT_LANG_HELP = (): string => _t("软件自己写在谱上的字用哪种语言：没起名字的声部写乐器的叫法、简谱鼓的图例、「编排」、出声的换气「吸 / 深吸」。歌词、歌名、作者栏、你起的声部名照写的印，不翻。跟着界面 = 这台设备是什么语言就印什么语言。");
/** 每位歌手的类别色（tab20 下标）+ 名字 + 谱前简写（v0.9.31；user「乐手名和颜色同意」）。名字和简写只从唯一出口拿（src/format/part-show.ts，12-4）：
 *  按值存在歌里（概念的谱上叫法 / 简写），不比名字、不查目录、不等目录加载。 */
function partLooks(): { colors: number[]; abbrs: string[]; names: string[] } {
  const shows = showsNow();
  return { colors: partColorIndices(D.st.song.parts.map((p) => roleSound(D.extras, p.role))), abbrs: shows.map((x) => x.abbr), names: shows.map((x) => x.name) };
}
/** 整套鼓这位在整首里用到的鼓件（GM 鼓键）→ 名字（鼓谱表里烤好的中 / 英名，按谱上的字用的语言挑（12-4）；查不到的不写）。简谱整套鼓的图例用（谱面分家 5-6）。 */
function kitNamesOf(partId: string, l: Lang): Record<number, string> {
  const zh = l === "zh", out: Record<number, string> = {};
  for (const paper of D.st.song.papers) for (const t of paper.tracks[partId] ?? []) {
    if (t.kind !== "note" || !t.pitch) continue;
    for (const pp of [t.pitch, ...(t.chord ?? [])]) { const m = midiOf(pp); if (out[m] !== undefined) continue; const nm = percOf(128, 0, m)?.name; if (nm) out[m] = zh ? nm.zh : nm.en; }
  }
  return out;
}
/** 台上那位怎么画这一行（× 符头 / 鼓谱 / 一线谱）= 插件说了算。「是不是打击乐的行」全 app 只在这里判断（7-R，2026-11-12；统筹定的规矩「打击乐的行没有调」）：
 *  谱面的声部视图（PartView.perc）、选区条、选区菜单、谱头面板都问它，不各自看引擎 / 音色。 */
function notationOfRole(role: string): Notation { return performerOf(activeInstrument(D.extras, role)?.engine)?.notation?.({ extras: D.extras, role }) ?? {}; }
function isPercPart(partId: string): boolean { const p = D.st.song.parts.find((x) => x.id === partId); return !!p && !!notationOfRole(p.role).perc; }
/** 打击乐的行上，从调号推出来的东西不起作用——说为什么（选区条 / 选区菜单 / 谱头面板同一句）。 */
const NO_KEY_WHY = (): string => _t("打击乐的行没有调：写的音高 = 敲哪个鼓，和调号无关（调号留在谱里，不起作用）");
function partViews(): PartView[] {
  const labels = labelsNow(), mutes = lyricMutes(), tl = scoreTextLang(), looks = partLooks();   // 谱上的字用的语言（12-4）：名字 / 简写 / 鼓图例
  return D.st.song.parts.map((p, k) => {
    // 踏板 11-3：这位没写踏板记号时留住音 = 名字下面一个「留住音」角标（统筹「默认留住音的那一截怎么画」：这一截谱上不画，披露放在这里；只在屏幕上、不印）
    const held = activePedalDefault(D.extras, p.role) === "down" && !!performerOf(activeInstrument(D.extras, p.role)?.engine)?.pedals?.includes("sustain");
    const v = pv(p.id), badges = [v.muted ? _t("静音") : "", v.solo ? _t("独奏") : "", v.only ? _t("只看它") : "", issueParts.has(p.id) ? _t("不出声") : "", held ? _t("留住音") : ""].filter(Boolean);   // 12-2（2026-11-12）：眼睛 / 喇叭搬进小卡以后，谱上靠名字下面的角标看得见这些状态（不印）   // 静 / 独 / 只 / 隐 现在是名字下面的四颗小钮（toggles，亮着 = 开），角标只剩「不出声」   // 不出声 = 清单里有它（§2.2½ 出口 ①）
    const eng = activeInstrument(D.extras, p.role)?.engine ?? "unknown", plug = performerOf(eng);
    const lm = mutes.get(p.id);
    // 台上这位不唱字（乐器 / 元音版）：谱下空着的歌词位点了不开框（user 2026-10-10「wishlist 不支持唱歌的track可以删歌词，但是不会误点创建歌词文本框」）；没人上场的照旧能写（多半等着请月读）
    const ly = plug?.lyrics, noLyrics = ly === "hum" || ly === "none" ? _t("{p}{p2}：空着的歌词位不开框；已经写了的字点开能改、能删", { p: labels[k], p2: ly === "hum" ? _t("（元音版）只哼") : _t("不唱歌词") }) : "";
    // 台上那位的音域（简谱的八度基准按它定；人声 = 插件自报，乐器 = 目录里角色那件乐器的；鼓 / 固定敲一个键的不要；目录没载 = 先没有，partLooks 载好了会重画）
    const nota = notationOfRole(p.role), rg = !plug || nota.perc || nota.xHead ? null : plug.hintRange ?? conceptRange(p.role);
    const kitNames = nota.perc?.kind === "kit" ? kitNamesOf(p.id, tl) : undefined;   // 整套鼓：用到的鼓件 → 名字（按谱上的字用的语言；简谱的图例印）
    return { ...(held ? { pedalHeld: true } : {}), ...(noLyrics ? { noLyrics } : {}), ...(lm && lm.size ? { lyricMute: new Set(lm.keys()) } : {}), ...(rg ? { range: { lo: rg.lo, hi: rg.hi } } : {}), ...(kitNames ? { kitNames } : {}), id: p.id, name: looks.names[k], abbr: looks.abbrs[k], colorIdx: looks.colors[k], empty: !plug, first: k === 0, hidden: !isShown(p.id), badges, mono: !plug?.poly, ...nota, ignores: [...ignoredFor(p.role), ...pedalIgnoredFor(p.role)] };   // xHead = 台上那位固定敲一个键（鼓件 / 音效固定原速）→ 谱上画 ×；perc = 鼓 / 音效 → 鼓谱（一线谱 / 五线鼓谱，v0.10.27，有 perc 时符头按仓鼠的表、不画 ×）
  });
}
/** 显示状态变了：光标所在的声部要是看不见了，挪到这张纸上第一个看得见的声部。 */
function afterViewChange(): void {
  pushChannels();              // 静音 / 独奏马上进录音房（推子到底、发送一起停；v0.10.38，user「我mute了之后它的reverb为什么还是进了reverb轨？」）
  schedulePlaybackRefresh();   // 静音 / 独奏 / 隐藏变了：放着的时候时间线重算（解除静音的那位也回来）
  if (!isShown(D.st.at.part)) {
    const paper = D.st.song.papers.find((pp) => pp.id === D.st.at.paper), to = D.st.song.parts.find((p) => isShown(p.id) && paper?.tracks[p.id]);
    if (to) update(setFocus(D.st, D.st.at.paper, to.id));
  }
  view.render();
}
/** 歌名左边「‹ ›」：跳到上一张 / 下一张纸（光标跟着过去，视图滚到它）。 */
function navPaper(dir: -1 | 1): void { navPaperFrom(D.st.at.paper, dir); }
/** 从某张纸往前 / 往后跳（每张纸自己的曲段控件；光标跟着过去）。 */
function navPaperFrom(from: string, dir: -1 | 1): void {
  const k = D.st.song.papers.findIndex((p) => p.id === from), to = D.st.song.papers[k + dir]; if (to) navPaperTo(to.id);
}
function navPaperTo(id: string): void {
  const to = D.st.song.papers.find((p) => p.id === id); if (!to) return;
  const part = to.tracks[D.st.at.part] ? D.st.at.part : D.st.song.parts.find((p) => to.tracks[p.id])?.id ?? D.st.at.part;
  update(setFocus(D.st, to.id, part));
  jumpPlaybackToPaper(id);
}
/** 新歌手（声部就是歌手；2026-10-08 user「嗯声部就是歌手」）：休息室里建一份默认角色（月读两个候选）+ 录音房一个麦克风（歌手认领麦克风）。
 *  只在 paper 这张纸上给它一行（user「新歌手只出现在当前这张纸嗯」）；giveFrom = 「交给新歌手」：这张纸上 giveFrom 那一行直接交给它（不另起空行）。
 *  v0.16.35 起：先开乐器目录、选了乐器才真的建（castPick 里一次提交，光标跟过去）；不选关掉 = 什么都不建。 */
function addNewPart(paper = D.st.at.paper, giveFrom?: string, place?: { anchor: string; above: boolean }): void {
  newPartPending = { paper, ...(giveFrom ? { giveFrom } : {}), ...(place ? { place } : {}) };   // v0.16.35：先选乐器，选了才建（castPick）；不选关掉 = 什么都不建
  openFinder();
}
/** 删掉一整个声部（v0.16.84 声部管理重做；user 11-09「这里应该加delete的选项，记得护栏」，11-10 选乙）：
 *  它是某一段唯一的声部 = 不删，说清是哪几段、怎么办（每段至少一行是全代码的前提；user 11-10「二选乙」）；歌里最后一个声部删不了。
 *  写了东西 = 红色确认框，写明在哪几段、各几个音；什么都没写 = 直接删并说一句。连同歌词、记号、它的乐器设置（休息室里的角色）一起删，一步撤销全回来。
 *  混音台 / 声部管理 / 名字小卡共用。done = 删完（或问完、没删）之后接着干什么。 */
function deleteSinger(id: string, done: () => void = () => {}): void {
  const song = D.st.song, p = song.parts.find((x) => x.id === id); if (!p) { done(); return; }
  const name = partLabel(id);
  if (song.parts.length <= 1) { info(_t("歌里只剩这一个声部，删不了")); done(); return; }
  const alone = song.papers.filter((pp) => pp.tracks[id] && Object.keys(pp.tracks).length === 1);
  if (alone.length) { info(_t("「{name}」是{secs}里唯一的声部，删不了：先给这几段放进别的声部，或者把这几段整段删掉", { name, secs: alone.map((pp) => `「${paperLabel(pp.id)}」`).join("") })); done(); return; }
  const go = () => { updateBoth(removePart(D.st, id), withoutRole(D.extras, p.role), { kind: "studio", label: _t("删掉声部「{name}」", { name }) }); studio.render(); renderTitle(); };
  const wrote = song.papers.filter((pp) => { const t = pp.tracks[id]; return t && t.length > headLen(t); });
  if (!wrote.length) { go(); info(_t("删掉了「{name}」（它没写东西；撤销能找回来）", { name })); done(); return; }
  const list = wrote.map((pp) => { const n = pp.tracks[id]!.filter((x) => x.kind === "note").length; return n ? _t("「{p}」{n} 个音", { p: paperLabel(pp.id), n }) : _t("「{p}」（没有音，只有休止 / 记号）", { p: paperLabel(pp.id) }); }).join(_t("、"));
  void askSheet(_t("删掉声部「{name}」？", { name }), _t("它写过的：{list}。连同歌词、记号、它的乐器设置一起删掉（能撤销，一步全找回）。", { list }), _t("删掉"), true)
    .then((ok) => { if (ok) { go(); info(_t("删掉了「{name}」（撤销能找回来）", { name })); } done(); });
}
/** 把歌手 id 挪到 anchor 紧挨着的上面 / 下面（全曲顺序；一步一步 movePart，合租的一家照它的规矩跟着走，挪不动就停）。 */
function placePart(st: EditorState, id: string, anchor: string, above: boolean): EditorState {
  for (let n = 0; n < 64; n++) {
    const ps = st.song.parts, i = ps.findIndex((p) => p.id === id), a = ps.findIndex((p) => p.id === anchor);
    if (i < 0 || a < 0 || id === anchor || i === (above ? a - 1 : a + 1)) return st;
    const next = movePart(st, id, i > a ? -1 : 1); if (next === st) return st; st = next;
  }
  return st;
}
/** 曲段的叫法：起过名 = 名字，没起 = 「第 n 段」。 */
function paperLabel(id: string): string { const k = D.st.song.papers.findIndex((p) => p.id === id); return D.st.song.papers[k]?.name || _t("第 {n} 段", { n: k + 1 }); }
/** 从一段里删掉一个声部那一行（v0.16.21；user 11-08「这一段不要它…非常误导，我不知道它是删除，你能用明显的 delete 吗？而且是红色，而且要确认要有护栏」；
 *  11-10「拿掉应该也是删除吧？…你必须得讲明白它是删除」）：那一行谱头之外写了任何东西 = 先问（写几个音、再放回来是空的、能撤销）；只有谱头 = 直接删并说一句；
 *  那一段只剩它 = 删不了、说清出路。done = 删完（或问完）之后接着干什么。 */
function dropFromSection(paperId: string, partId: string, done: () => void): void {
  const paper = D.st.song.papers.find((p) => p.id === paperId), t = paper?.tracks[partId]; if (!paper || !t) return;
  const name = labelsNow()[D.st.song.parts.findIndex((p) => p.id === partId)] ?? "", p = paperLabel(paperId);
  if (Object.keys(paper.tracks).length <= 1) { info(_t("「{p}」只有「{name}」这一个声部，删不了：这一段整段不要 = 纸顶「⋯」里删这一段", { p, name })); done(); return; }
  const go = () => { update(removeTrack(D.st, paperId, partId)); renderTitle(); };
  const notes = t.filter((x) => x.kind === "note").length;
  if (t.length <= headLen(t)) { go(); info(_t("已从「{p}」删掉「{name}」（它在这一段没写东西）", { p, name })); done(); return; }
  void askSheet(_t("从「{p}」删掉「{name}」？", { p, name }), (notes ? _t("它在这一段写的 {n} 个音，连同歌词、记号一起删掉。", { n: notes }) : _t("它在这一段写的东西一起删掉。")) + _t("再把它放进这一段是一行空的；要找回只能撤销。"), _t("删掉"), true)
    .then((ok) => { if (ok) go(); done(); });
}
/** 声部管理（v0.16.19 搬家 D；v0.16.84 重做，user 11-09「parts应该比现状要compact很多，这样有十几个乐器一屏就能管理看完」「parts也很乱，没法选其他的，然后delete也不对」）：
 *  一个声部一行 = 色点 · 名字（点了就能改）· 乐器（点 = 换乐器）· 每一段一个小格（亮 = 这一段有它；点暗的 = 放进、点亮的 = 从那一段删掉，先问）· ⋯。
 *  ⋯ = 这一行下面展开一排：上移 / 下移 / 在上面加… / 在下面加… / 「B」段交给… / 乐器设置… / 从「B」段删掉 / 删掉声部…（「B」= 光标在的那一段）。
 *  挂在别人谱线上的（合租）缩进排在主人下面。ctx = 从哪一段的哪个声部进来的：那一行亮着、滚到看得见。设计稿 ai-docs/20261110-wave2-four-designs.md 第三节。 */
function openPartsManager(ctx?: { paper: string; part: string }): void {
  ui.close();
  const box = document.createElement("div"); box.className = "offer parts-mgr";
  let page: "main" | "give" | "add" = "main", above = false, subject = ctx?.part ?? "", openRow: string | null = ctx?.part ?? null, scrolled = false;   // 从某个声部进来 = 它那一行的 ⋯ 先展开
  const secId = (): string => { const want = ctx?.paper ?? D.st.at.paper; return D.st.song.papers.some((p) => p.id === want) ? want : D.st.song.papers[0].id; };
  const chipLabel = (id: string, k: number): string => D.st.song.papers[k]?.name || String(k + 1);
  const draw = () => {
    const song = D.st.song, labels = labelsNow(song), cols = partColorIndices(song.parts.map((p) => roleSound(D.extras, p.role)));
    const sec = secId(), secName = esc(paperLabel(sec)), here = song.papers.find((pp) => pp.id === sec)!.tracks;
    const lab = (id: string) => esc(labels[song.parts.findIndex((p) => p.id === id)] ?? id);
    if (page !== "main") {
      const me = song.parts.find((p) => p.id === subject); if (!me || !here[me.id]) page = "main";
    }
    if (page !== "main") {
      const label = lab(subject), list = page === "give" ? song.parts.filter((p) => p.id !== subject) : song.parts.filter((p) => !here[p.id]);
      box.innerHTML = `<div class="offer-card pm-card"><div class="pm-here"><button class="btn pm-back" data-v="back">‹ ${page === "give" ? _t("「{p}」段的「{label}」交给…", { p: secName, label }) : above ? _t("在「{label}」上面加", { label }) : _t("在「{label}」下面加", { label })}</button>` +
        `<div class="tc-list">${list.map((p) => `<button class="btn cand" data-v="${page}:${esc(p.id)}">${lab(p.id)}${page === "give" && here[p.id] ? `<small>${_t("（对调）")}</small>` : ""}</button>`).join("")}` +
        `<button class="btn cand" data-v="${page}new">${_t("＋ 新声部…")}</button></div>` +
        `<div class="tc-hint">${page === "give" ? _t("只改这一段：音、歌词、记号都不动，换一个声部唱；跨段按声部接起来。对方在这一段已经有一行 = 两行对调。") : _t("只加在这一段（别的段照旧）。")}</div></div></div>`;
      return;
    }
    const row = (p: (typeof song.parts)[number], k: number): string => {
      const who = activeCandidateName(D.extras, p.role), isOpen = openRow === p.id, inSec = !!here[p.id];
      const chips = song.papers.map((pp, j) => { const on = !!pp.tracks[p.id], full = esc(paperLabel(pp.id));
        return `<button class="btn chip${on ? " is-on" : ""}${pp.id === sec ? " is-cur" : ""}" data-v="pp:${esc(pp.id)}:${esc(p.id)}" title="${on ? _t("从「{p}」删掉（它在这一段写的一起删，先问）", { p: full }) : _t("放进「{p}」（一行空的）", { p: full })}">${esc(chipLabel(pp.id, j))}</button>`; }).join("");
      const main = `<div class="pm-row${(ctx?.part ?? D.st.at.part) === p.id ? " is-here" : ""}${p.host ? " is-tenant" : ""}${isOpen ? " is-open" : ""}" data-pid="${esc(p.id)}">` +
        `<span class="pm-dot" style="background:${TAB20[cols[k]]}"></span>` +
        // 名字那一栏（12-4，user「同意」= 小卡 / 声部管理里名字那一栏空着时灰字、清空 = 回到跟着乐器）：框里 = 起了的名字；没起 = 空着，灰字写这件乐器的叫法
        `<input class="pm-name" data-pid="${esc(p.id)}" value="${esc(roleGivenName(D.extras.lounge, p.role) ?? "")}" placeholder="${esc(roleInstrumentLabel(D.extras.lounge, p.role, scoreTextLang()))}" spellcheck="false" autocomplete="off" title="${_t("起个名字（谱上原样写、不翻译）；空着 = 写这件乐器的叫法")}" />` +
        `<button class="btn pm-inst" data-v="swap:${esc(p.id)}" title="${_t("换乐器（进乐器目录）")}"><span>${esc(who ?? _t("没人上场"))}</span></button>` +
        `<div class="pm-chips">${chips}</div>` +
        `<button class="btn pm-more${isOpen ? " is-on" : ""}" data-v="more:${esc(p.id)}" title="${_t("这一行的更多：上下挪、加、交给、乐器设置、删除")}" aria-label="${_t("更多")}">⋯</button></div>`;
      if (!isOpen) return main;
      const id = esc(p.id);
      const acts = `<button class="btn" data-v="up:${id}"${k === 0 ? " disabled" : ""}>${_t("上移")}</button><button class="btn" data-v="down:${id}"${k === song.parts.length - 1 ? " disabled" : ""}>${_t("下移")}</button>` +
        (inSec ? `<button class="btn" data-v="addabove:${id}" title="${_t("在这一行上面加一个声部（已有的或新的；只加在这一段）")}">${_t("在上面加…")}</button><button class="btn" data-v="addbelow:${id}" title="${_t("在这一行下面加一个声部（已有的或新的；只加在这一段）")}">${_t("在下面加…")}</button>` +
          `<button class="btn" data-v="giveof:${id}" title="${_t("只有这一段：这一行的音、歌词、记号原样交给另一个声部演（用它的乐器和混音台那一条）")}">${_t("「{p}」段交给…", { p: secName })}</button>`
          : `<button class="btn" data-v="pp:${esc(sec)}:${id}">${_t("放进「{p}」", { p: secName })}</button>`) +
        `<button class="btn" data-v="inst:${id}">${_t("乐器设置…")}</button>` +
        (inSec ? `<button class="btn danger" data-v="pp:${esc(sec)}:${id}" title="${_t("它在这一段写的一起删掉（先问；能撤销）。别的段照旧")}">${_t("从「{p}」删掉", { p: secName })}</button>` : "") +
        `<button class="btn danger" data-v="delpart:${id}" title="${_t("整个声部删掉：每一段里它写的、它的乐器设置一起删（先问；能撤销）")}">${_t("删掉声部…")}</button>`;
      return main + `<div class="pm-acts">${acts}</div>`;
    };
    // 合租的房客排在主人下面（只是显示顺序；真正的顺序还是 Song.parts）
    const order: number[] = []; song.parts.forEach((p, k) => { if (!p.host || !song.parts.some((h) => h.id === p.host)) { order.push(k); song.parts.forEach((q, j) => { if (q.host === p.id) order.push(j); }); } });
    box.innerHTML = `<div class="offer-card pm-card"><div class="offer-title">${_t("声部管理")}<small>${_t("小格 = 在哪几段（亮 = 有；圈着的 = 光标这一段）；⋯ = 上下挪、加、交给、删除")}</small></div>` +
      `<div class="pm-list">${order.map((k) => row(song.parts[k], k)).join("")}</div>` +
      `<div class="offer-btns"><button class="btn" data-v="new" title="${_t("新声部只加在光标这一段（别的段照旧），加完挑乐器")}">${_t("＋ 新声部")}</button><button class="btn primary" data-v="close">${_t("好")}</button></div></div>`;
    if (box.isConnected) fitWide(box);   // 展开「⋯」那一排：英文字放不下的钮跟着字变宽
    if (!scrolled) { scrolled = true; requestAnimationFrame(() => box.querySelector(".pm-row.is-here")?.scrollIntoView({ block: "nearest" })); }
  };
  draw(); document.body.append(box); fitWide(box);
  const close = () => { box.remove(); ui.closed(close); };
  ui.open({ k: "sheet", close, redraw: draw });
  const reopen = () => openPartsManager({ paper: secId(), part: subject || D.st.at.part });   // 问完（askSheet 会先收起这一页）回来接着管
  const focusOn = (id: string): boolean => { const pp = D.st.song.papers.find((x) => x.id === secId() && x.tracks[id]) ?? D.st.song.papers.find((x) => x.tracks[id]); if (!pp) return false; update(setFocus(D.st, pp.id, id)); return true; };
  box.addEventListener("change", (e) => {   // 改名 = 角色名（谱上写的）
    const t = e.target as HTMLInputElement, pid = t.dataset.pid; if (!pid || !t.classList.contains("pm-name")) return;
    const p = D.st.song.parts.find((x) => x.id === pid), n = t.value.trim();
    if (!p || n === (roleGivenName(D.extras.lounge, p.role) ?? "")) { draw(); return; }   // 没变
    const label = n ? _t("角色改名：{n}", { n }) : _t("名字清掉了：跟着乐器写「{inst}」", { inst: roleInstrumentLabel(D.extras.lounge, p.role, scoreTextLang()) });
    updateExtras(withRoleName(D.extras, p.role, n, activeHum(D.extras, p.role)), { kind: "lounge", label }); renderTitle(); view.render(); draw();
  });
  box.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.target as HTMLElement).classList.contains("pm-name")) (e.target as HTMLInputElement).blur(); });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    if (v === "new") { close(); addNewPart(D.st.at.paper); return; }
    const sec = secId();
    // 子页：交给 / 加（对象 = subject，这一段 = sec）
    if (v === "back") { page = "main"; draw(); return; }
    if (v.startsWith("give:") && page === "give") { const to = v.slice(5), name = labelsNow()[D.st.song.parts.findIndex((p) => p.id === to)] ?? ""; update(rebindTrack(D.st, sec, subject, to)); renderTitle(); info(_t("这一段的这一行交给了「{name}」", { name })); subject = to; openRow = to; page = "main"; draw(); return; }
    if (v === "givenew") { close(); addNewPart(sec, subject); return; }
    if (v.startsWith("add:") && page === "add") { const id = v.slice(4); update(placePart(addTrack(D.st, sec, id), id, subject, above)); renderTitle(); page = "main"; draw(); return; }   // 已有的声部放进这一段，挨着这一行的上 / 下（全曲顺序跟着挪）
    if (v === "addnew") { close(); addNewPart(sec, undefined, { anchor: subject, above }); return; }
    const [k, a, b] = v.split(":");
    if (k === "more") { openRow = openRow === a ? null : a; subject = a; draw(); return; }
    if (k === "giveof" || k === "addabove" || k === "addbelow") { subject = a; page = k === "giveof" ? "give" : "add"; above = k === "addabove"; draw(); return; }
    if (k === "up" || k === "down") { update(movePart(D.st, a, k === "up" ? -1 : 1)); renderTitle(); draw(); return; }
    if (k === "pp") {
      const paper = D.st.song.papers.find((pp) => pp.id === a); if (!paper) return;
      subject = b;
      if (paper.tracks[b]) { close(); dropFromSection(a, b, reopen); return; }
      update(addTrack(D.st, a, b)); renderTitle(); draw(); return;
    }
    if (k === "swap") { if (!focusOn(a)) return; close(); openFinder(); return; }
    if (k === "inst") { if (!focusOn(a)) return; close(); openInstPage(); return; }
    if (k === "delpart") { subject = ""; close(); deleteSinger(a, reopen); return; }
  });
}
/** 纸的菜单（纸顶「⋯」）：改曲段名、挪、在后面加一张、这张纸上加 / 不加某个声部、删这张纸。 */
function openPaperMenu(id: string): void {
  ui.close();
  const paper = D.st.song.papers.find((p) => p.id === id); if (!paper) return;
  const k = D.st.song.papers.indexOf(paper), n = D.st.song.papers.length;
  // 三块（v0.16.19 搬家 D；user 11-07 拍的搬家清单第五条）：这一段（改名 / 隐藏 / 删）· 插入（在上面 / 下面插一段）· 编辑（挪 / 移调）。
  //   加歌手不在这里了：每段底下的虚线框「＋ 歌手」、歌手名小卡、声部管理。
  const box = document.createElement("div");
  box.className = "offer paper-menu";   // paper-menu：锁着时只留「隐藏 / 显示」（styles.css body.doc-locked）
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${esc(paperLabel(id))}</div>` +
    `<div class="part-sec">${_t("这一段")}</div><div class="set-row"><button class="btn" data-v="name">${_t("改曲段名…")}</button>` +
    `<button class="btn${paper.hidden ? " is-on" : ""}" data-v="hide" title="${_t("隐藏 = 不放、不进压平件；谱上折叠着，翻页能进去")}">${paper.hidden ? _t("显示（现在隐藏着）") : _t("隐藏（不放）")}</button>` +
    (n > 1 ? `<button class="btn cand danger" data-v="del">${_t("删这一段…")}</button>` : "") + `</div>` +
    `<div class="part-sec">${_t("插入")}</div><div class="set-row"><button class="btn" data-v="above" title="${_t("新的一段插在它前面（谱头照抄前一段结尾的调号 / 拍号 / 速度）")}">${_t("在上面插一段")}</button><button class="btn" data-v="below" title="${_t("新的一段接在它后面")}">${_t("在下面插一段")}</button><button class="btn" data-v="dup" title="${_t("整段（所有声部的音、记号、歌词）照抄一份，接在它后面")}">${_t("复制这一段")}</button></div>` +
    `<div class="part-sec">${_t("编辑")}</div><div class="set-row"><button class="btn" data-v="up"${k === 0 ? " disabled" : ""}>${_t("上移")}</button><button class="btn" data-v="down"${k === n - 1 ? " disabled" : ""}>${_t("下移")}</button>` +
    `<button class="btn" data-v="transpose" title="${_t("这张纸 / 整首所有声部一起移调、转调（调号跟着挪）")}">${_t("移调 / 转调…")}</button></div>` +
    `<div class="offer-msg">${_t("曲段 = 一张纸：每一段是一个新的开始，各声部在这里重新对齐；一段里要哪些声部随它（每段底下「＋ 声部」）。")}</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">${_t("好")}</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    if (v === "name") { close(); view.title.openNow(id); return; }
    if (v === "up" || v === "down") { update(movePaper(D.st, id, v === "up" ? -1 : 1)); close(); return; }
    if (v === "above" || v === "below") { update(v === "above" ? addPaper(D.st, undefined, id) : addPaper(D.st, id)); close(); info(_t("新的一段")); return; }
    if (v === "dup") { update(duplicatePaper(D.st, id, _t("{name} 副本", { name: paper.name || _t("曲段") }))); close(); info(_t("复制了一段（接在后面）")); return; }   // v0.16.61，user 11-09「需要加一个duplicate曲段的功能」
    if (v === "transpose") { close(); const r = scoreEl.getBoundingClientRect(); openTransposeMenu(id, { x: r.left + r.width / 2, y: r.top + 60 }); return; }
    if (v === "hide") { setHidden(id, !paper.hidden); close(); info(paper.hidden ? _t("这张纸显示了（会放）") : _t("这张纸隐藏了（不放）")); return; }
    if (v === "del") {
      close();
      void askSheet(_t("删掉「{p}」？", { p: paperLabel(id) }), _t("这张纸上所有声部写的东西一起删掉（能撤销：撤销 / Ctrl+Z）。"), _t("删")).then((ok) => { if (ok) update(removePaper(D.st, id)); });
    }
  });
}
/** 纸底下「＋ 歌手」（v0.16.19 搬家 D）：小菜单开在框上——不在这一段的歌手（点 = 放进这一段）/ ＋ 新歌手（排在这一段最下面那位后面）/ 声部管理…。 */
function openAddPartMenu(paperId: string, at: { x: number; y: number }): void {
  ui.close();
  const paper = D.st.song.papers.find((p) => p.id === paperId); if (!paper) return;
  const labels = labelsNow(), absent = D.st.song.parts.filter((p) => !paper.tracks[p.id]);
  const box = document.createElement("div");
  box.className = "track-card ctx-menu add-part-menu"; box.setAttribute("role", "menu");   // add-part-menu：锁着时只留「声部管理…」
  const item = (v: string, label: string, title = "") => `<button class="btn ctx-item" data-v="${esc(v)}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  box.innerHTML = `<div class="tc-sec">${_t("加进「{p}」", { p: esc(paperLabel(paperId)) })}</div>` +
    absent.map((p) => item(`add:${p.id}`, esc(labels[D.st.song.parts.indexOf(p)] ?? p.id), _t("已有的声部，只加进这一段（别的段照旧）"))).join("") +
    item("new", _t("＋ 新声部…"), _t("新的一个声部，只出现在这一段；加完挑乐器")) + `<div class="ctx-sep"></div>` + item("parts", _t("声部管理…"));
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  box.style.left = `${Math.max(m, Math.min(at.x - w / 2, innerWidth - w - m))}px`;
  box.style.top = `${Math.max(m, at.y - h - 6 >= m ? at.y - h - 6 : Math.min(at.y + 6, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v.startsWith("add:")) { update(addTrack(D.st, paperId, v.slice(4))); renderTitle(); return; }
    if (v === "new") { const last = D.st.song.parts.filter((p) => paper.tracks[p.id]).at(-1); addNewPart(paperId, undefined, last ? { anchor: last.id, above: false } : undefined); return; }
    if (v === "parts") openPartsManager({ paper: paperId, part: D.st.at.part });
  });
}
// ── 声部的设置分两处（2026-10-08 by Claude Opus 5.5；user「我建议你把乐器设置给ux分开来，乐器设置和轨设置视觉上分开来，然后这个弹窗其实还是placeholder，
//    好好重新设计一下，以及是否是弹窗的模态。还是别的更好？你判断一下」）。判断：
//   · 轨（这条谱怎么显示、出不出声、几张谱表）要看着谱变 → 歌手牌旁边的**非模态小卡**，没有遮罩，谱照常看得见、点外面就收；
//   · 乐器（这个声部是什么、谁来演、这位怎么演）要边改边弹着听 → **全屏一页**，和乐器目录 / 录音室一家，右边的 pad 留着只弹不写（模态会挡住 pad）。
const chip = (v: string, label: string, on: boolean, title = "") => `<button class="btn cand${on ? " is-on" : ""}" data-v="${esc(v)}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
/** 轨的小卡：挨着歌手牌开（at = 歌手牌在屏幕上的框；没有 = 屏幕中间）。 */
function openTrackCard(at?: { left: number; top: number; right: number; bottom: number }): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card part-card"; box.setAttribute("role", "dialog");   // part-card：锁着时「换乐器」「删掉声部」点不动
  // 只剩三颗（user 11-08「点名字之后就只有选择歌手、歌手设置和声部管理」→ 同日「点进去之后，人们第一反应还是选乐器，而不是选歌手」）：换乐器 = 乐器目录；乐器设置 = 乐器页（原「配置」）；声部管理 = 顺序 / 在哪几段 / 这一段加人·交给·删（原来的下半截都搬进去了）。
  //   谱怎么画归谱号（user 同句「谱怎么换？应该归谱号」）：点这一行开头的谱号 = 谱头面板。
  /** 字放不下 = 整颗换行（7-R：不是字被截掉）。两颗大钮（英文的「Change instrument」在 iPad mini 上）= 一颗一行；
   *  四颗开关（12-2 补）= 先一排四颗 → 放不下按「显示」「出声」两组分两排（整组一起换、不拆开一组）→ 还放不下一颗一行。 */
  const fitTiles = () => {
    const over = (el: Element) => [...el.querySelectorAll<HTMLElement>(".tc-l b, .tc-l small, .tc-tg span")].some((e) => e.scrollWidth > e.clientWidth + 1);
    for (const row of box.querySelectorAll<HTMLElement>(".tc-big")) { row.classList.remove("one-col"); if (over(row)) row.classList.add("one-col"); }
    for (const tgs of box.querySelectorAll<HTMLElement>(".tc-tgs")) { tgs.classList.remove("two-rows", "one-col"); if (over(tgs)) { tgs.classList.add("two-rows"); if (over(tgs)) tgs.classList.add("one-col"); } }
  };
  // 卡跟着开它的那一位，不跟着光标：隐藏了光标所在的那一位，光标会挪到看得见的一位（afterViewChange）——卡不能跟着变成别人的卡（不然再点「隐藏」藏的是别人）
  const myId = curPart().id, mine = (): PartDef | undefined => D.st.song.parts.find((p) => p.id === myId);
  const draw = () => {
    const me = mine(); if (!me) { close(); return; }   // 这一位被删了（撤销 / 别处）= 卡收掉
    const k = D.st.song.parts.indexOf(me), label = labelsNow()[k] ?? "";
    const v = pv(me.id), who = activeCandidateName(D.extras, me.role);
    const tg = (kind: "hidden" | "only" | "muted" | "solo", ic: string, label: string, title: string) => `<button class="btn tc-tg${v[kind] ? " on" : ""}" data-v="tg:${kind}" aria-pressed="${v[kind] ? "true" : "false"}" title="${esc(title)}"><svg class="ico" aria-hidden="true"><use href="#${ic}"/></svg><span>${esc(label)}</span></button>`;
    // 12-2 补（user 11-12「换乐器和乐器设置加图标」「声部管理和删除也加」）：换乐器 = instrument-swap（图标库待过目层，这次新画）、乐器设置 = sliders、声部管理 = layers-stack、删掉 = trash-can
    const ico = (id: string) => `<svg class="ico tc-ico" aria-hidden="true"><use href="#${id}"/></svg>`;
    const tile = (val: string, icon: string, head: string, sub: string, title: string) => `<button class="tc-inst" data-v="${val}" title="${esc(title)}">${ico(icon)}<span class="tc-l"><b>${esc(head)}</b><small>${esc(sub)}</small></span><span class="tc-go">›</span></button>`;
    box.innerHTML =
      // 12-2（2026-11-12，user「声部上面的两个钮还是难看…这些钮找个聪明的地方放」）：原来在谱上名字上面的眼睛 / 喇叭搬到这张卡最上面。
      // 12-2 补（同日，user 看了图「如果收进去的话，那么可以变回四个按钮的情况，这样好懂」）：四颗明摆着的开关，开着的亮着；没有长按 / 右键（同一件事只留一种做法）。
      //   两组 = 显示（隐藏、只看它）/ 出声（静音、独奏）：放不下时整组换行（fitTiles）。意思照旧：每根轴一个「关掉」一个「只要」，有「只要」时「关掉」不看。
      `<div class="tc-head"><b>${esc(label)}</b><small>${who ? _t("{who} 在演", { who: esc(who) }) : _t("没人上场")}</small></div>` +
      `<div class="tc-tgs"><div class="tc-grp" role="group" aria-label="${esc(_t("显示"))}">${tg("hidden", "visibility-hide", _t("隐藏"), _t("隐藏：这一位缩成细行、不占地方，照样出声；再点 = 显示"))}${tg("only", "visibility-only", _t("只看它"), _t("只看它：别的声部都缩成细行（可以几位一起只看）；再点 = 都看"))}</div>` +
        `<div class="tc-grp" role="group" aria-label="${esc(_t("出声"))}">${tg("muted", "volume-mute", _t("静音##开关"), _t("静音：这一位不出声，谱上照样画；再点 = 出声"))}${tg("solo", "volume-solo", _t("独奏"), _t("独奏：只听它（可以几位一起独奏）；再点 = 关掉"))}</div></div>` +
      // 12-1：换乐器、乐器设置两颗大钮同一行、一样宽（放不下 = 整颗换到下一排，.btn-row）
      `<div class="btn-row tc-big">${tile("swap", "instrument-swap", _t("换乐器"), _t("进乐器目录"), _t("换乐器：进乐器目录（右边的键盘能试；顶上是这首歌的乐器预设），选好就换上、目录还开着可以接着换，「← 谱」回来"))}` +
        `${tile("inst", "sliders", _t("乐器设置"), _t("怎么演、响度"), _t("这位怎么演（响度、力度、唱法…）和谱上写什么名字：全屏一页，右边的键盘能试"))}</div>` +
      `<div class="tc-row"><button class="btn" data-v="parts" title="${_t("所有声部排一列：改名、上下挪、在哪几段；这一段上面 / 下面加、交给别的声部、从这一段删掉")}">${ico("layers-stack")}<span>${_t("声部管理…")}</span></button>` +
      `<button class="btn danger" data-v="delpart" title="${_t("整个声部删掉：每一段里它写的、它的乐器设置一起删（先问；能撤销）")}">${ico("trash-can")}<span>${_t("删掉声部…")}</span></button></div>` +
      ((m) => { if (!m || !m.size) return ""; const xs = [...m.values()], first = xs[0];   // 唱不出来的歌词：几个、为什么（纪律：画灰 + 明说）
        return `<div class="tc-warn">${first.why === "notSung" ? esc(lyricWhyText(first, roleLabel(me.role))) : _t("有 {n} 个字唱不出来（谱上画灰）：{first}{x}", { n: xs.length, first: esc(lyricWhyText(first, roleLabel(me.role))), x: xs.some((x) => x.why !== first.why) ? _t(" 等") : "" })}</div>`; })(lyricMutes().get(me.id));
    if (box.isConnected) fitTiles();
  };
  draw(); document.body.append(box); fitTiles();
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  // 开在这条谱的下面（右边就是这条谱本身）；下面放不下 = 上面
  let x = (innerWidth - w) / 2, y = (innerHeight - h) / 2;
  if (at) {
    const below = at.bottom + 30, above = at.top - h - 10;
    if (below + h <= innerHeight - m) { x = at.left - 8; y = below; }
    else if (above >= m) { x = at.left - 8; y = above; }
    else { x = at.right + 10; y = (at.top + at.bottom) / 2 - h / 2; }   // 上下都放不下（矮窗口）：放名字右边，别把名字本身盖住
  }
  box.style.left = `${Math.max(m, Math.min(x, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };   // 非模态：点外面就收，那一下照常落到谱上
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "card", close, redraw: draw });
  // 四颗开关：点 = 切这一样；切了卡留着、重画
  const flip = (kind: "hidden" | "muted" | "only" | "solo") => { setPv(myId, { [kind]: !pv(myId)[kind] }); afterViewChange(); draw(); };
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    const me = mine(); if (!me) return;
    if (v.startsWith("tg:")) { flip(v.slice(3) as "hidden" | "muted" | "only" | "solo"); return; }
    if ((v === "inst" || v === "swap") && D.st.at.part !== me.id) update(setFocus(D.st, D.st.at.paper, me.id));   // 乐器页 / 乐器目录跟着光标那一位：先回到这张卡的那一位（它可能刚被藏了、光标挪走了）
    if (v === "inst") { close(); openInstPage(); return; }
    if (v === "swap") { close(); openFinder(); return; }   // 从谱上开的：选好 = 换上、目录不关（v0.16.35），「← 谱」/ Esc 回谱
    if (v === "parts") { close(); openPartsManager({ paper: D.st.at.paper, part: me.id }); return; }
    if (v === "delpart") { close(); deleteSinger(me.id); return; }
  });
}

/** 空白处的小菜单（长按 / 电脑右键；user 2026-10-08「空白长按可以黏贴或者类似的右键上下文菜单」「小菜单同意」）：非模态，开在按的地方，点外面就收。
 *  光标已经由 score-view 放到按的位置：粘贴 = 贴在那里；插记号 = 插在那里。 */
const DYN_MENU = DYN_GLYPH;   // Bravura 力度字形（src/render/smufl.ts）
function openScoreMenu(at: { x: number; y: number }, _row: { from: number; to: number } | null): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card ctx-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title = "", disabled = false) => `<button class="btn ctx-item" data-v="${v}"${disabled ? " disabled" : ""}${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  box.innerHTML =
    item("play", _t("从这儿放"), _t("起点挪到这个小节的头，从这儿放（之后 |▶ 回到这儿重放；编辑、挪光标都不动起点）")) + `<div class="ctx-sep"></div>` +
    item("paste", _t("粘贴"), _t("贴在这里：app 里复制的，或系统剪贴板里的简谱文字（1 2 3 | 5 - -）")) +
    `<div class="ctx-sep"></div>` +
    item("bar", _t("小节线 |"), _t("从这里重新数小节（弱起）")) +
    item("header", _t("谱号 · 调号 · 拍号 · 速度…"), _t("从这儿起换（同一个面板）")) + item("ottava", _t("八度线…"), _t("8va / 15ma / 8vb（只管画）")) + item("transpose", _t("移调 / 转调…"), _t("这张纸 / 整首所有声部一起挪（调号跟着挪）；只挪一段 = 选中它，用选区菜单")) +
    // 力度（状态：从这儿起管到下一个；user 2026-10-08「长按的小菜单也能输入力度符号」）：亮着的 = 这儿现在生效的
    `<div class="ctx-row ctx-dyn">${(["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const).map((d) => `<button class="btn ctx-chip${dynMarkAt(tr(D.st), D.st.caret) === d ? " is-on" : ""}" data-v="dyn:${d}" title="${_t("力度 {d}：从这儿前面那个音起", { d })}"><span class="smufl">${DYN_MENU[d]}</span></button>`).join("")}</div>` +
    `<div class="ctx-sep"></div>` +
    item("all", _t("全选"));   // 「全选这一行」去掉了（2026-10-10 user「wishlist 全选这一行没啥用，去掉」）
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let x = at.x + 6, y = at.y + 10;
  if (y + h > innerHeight - m) y = at.y - h - 10;
  box.style.left = `${Math.max(m, Math.min(x, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "play") { playFromHere(D.st.at.paper, D.st.at.part, tickOfCaret(D.st.at.paper, D.st.at.part, D.st.caret) + (D.st.lead ?? 0)); return; }   // 光标在后面补齐的空小节里：加上 lead
    if (v === "paste") void pasteNow();
    else if (v === "bar") update(apply(D.st, { k: "bar" }, performance.now()));
    else if (v === "header") { insertMarkHere(undefined, at); return; }
    else if (v === "ottava") { openInsertOttavaMenu(at); return; }
    else if (v === "transpose") { openTransposeMenu(D.st.at.paper, at); return; }
    else if (v.startsWith("dyn:")) update(apply(D.st, { k: "dyn", v: v.slice(4) as Dyn }, performance.now()));
    else if (v === "all") { update(selectAll(D.st)); updateChrome(); }
    scoreEl.focus();
  });
}
/** 点力度记号 / 渐强渐弱（或长按原地松手 / 右键）的小菜单（2026-10-08 Opus 5.5，长按拖那一轮）：力度 = 换成别的力度，渐强渐弱 = 换方向；都能删。拖 = 挪，在 score-view 里。 */
const WEDGE_MENU = { cresc: `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M20,2 L3,6 L20,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dim: `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,2 L19,6 L2,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` } as const;
/** 风格记号（拍子轻重）：放在光标前那个音上（先放「古典」= 拍号自带的强弱，最不挑人），马上开它的小菜单换风格 / 幅度。 */
function insertGrooveHere(): void {
  const nx = setGroove(D.st, "classical");
  if (nx === D.st) { info(_t("风格记号要放在一个音上（这张纸里还没有音）")); return; }
  update(nx);
  const toks = tr(D.st), an = markAnchor(D.st);
  let k = -1; for (let j = an - 1; j >= 0 && !isTimed(toks[j]) && toks[j].kind !== "bar"; j--) if (toks[j].kind === "groove") { k = j; break; }
  if (k >= 0) view.menuFor(k);
}
/** 风格记号的小菜单：换风格 / 幅度 / 删；下面明说——这张纸的拍号预设里没列（按古典层级推）、摇摆还没接、这张纸上的歌手各跟多少（纪律：做不到的明说）。 */
// ── 谱内反复 / 跳转（2026-10-09 Opus 5.5；user「…谱内的循环和标准的dc这种是不是支持下也不难？…就是普通记谱软件支持的那种。这样，不超过sheet边界」「你先把三个小件做了」）──
const JUMPS: Exclude<NavWhat, "ending">[] = ["segno", "coda", "fine", "toCoda", "dc", "dcFine", "dcCoda", "ds", "dsFine", "dsCoda"];
const ENDINGS: number[][] = [[1], [2], [3], [1, 2], [2, 3]];
/** 小菜单的壳（同风格 / 力度记号的小菜单）：at = 屏幕坐标；pick(v) 返回 true = 点了不收。 */
function ctxMenu(cls: string, html: string, at: { x: number; y: number }, pick: (v: string) => boolean | void): void {
  ui.close();
  const box = document.createElement("div");
  box.className = `track-card ctx-menu ${cls}`; box.setAttribute("role", "menu"); box.innerHTML = html;
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let y = at.y + 6; if (y + h > innerHeight - m) y = at.y - h - 30;
  box.style.left = `${Math.max(m, Math.min(at.x - w / 2, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return; if (!pick(v)) close(); scoreEl.focus({ preventScroll: true }); });
}
/** 写了反复 / 跳转之后：光标所在这一行不是这张纸最上面那位 = 明说（谱上画灰；纪律「做不到的一律画灰 + 明说」）。 */
function discloseNav(): void {
  const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper), owner = paper ? tempoOwner(D.st.song, paper) : null;
  if (owner && owner !== D.st.at.part) info(_t("反复 / 跳转只看这张纸最上面那位（{extras}）那一行：这一行写的画灰、不起作用", { extras: partNameNow(owner) }));
}
/** 整段 / 整首移调转调（v0.9.33；user 2026-10-09「杂事记账：段级别和工程级别的整体移调转调」→ 10-10「小件做」）：
 *  纸的「⋯」/ 空白处小菜单 →「移调 / 转调…」。这张纸（或整首）上所有声部一起挪、调号跟着挪；点了不收、可以连着点，每一下一步撤销。
 *  台上固定敲一个键的声部（鼓件 / 音效固定原速，谱上画 ×）不动——谱上的音高不拿来出声。选一段 = 选区菜单那个（只挪选中的、调号不动）。 */
function openTransposeMenu(paperId: string, at: { x: number; y: number }): void {
  let whole = false, told = false;
  const many = D.st.song.papers.length > 1;
  const nameOf = (id: string) => { const k = D.st.song.papers.findIndex((p) => p.id === id); return D.st.song.papers[k]?.name || _t("第 {p} 张纸", { p: k + 1 }); };
  const ids = () => (whole ? D.st.song.papers.map((p) => p.id) : [paperId]);
  const chip = (v: string, label: string, on = false, title = "") => `<button class="btn ctx-chip${on ? " is-on" : ""}" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const html = () => {
    const now = scopeKey(D.st.song, ids());
    return (many ? `<div class="ctx-row"><span class="ctx-k">${_t("范围")}</span>${chip("scope:paper", _t("这一段「{paperId}」", { paperId: esc(nameOf(paperId)) }), !whole)}${chip("scope:song", _t("整首"), whole)}</div>` : "") +
      `<div class="ctx-row"><span class="ctx-k">${_t("移调")}</span>${chip("tr:1", _t("↑ 半音"))}${chip("tr:-1", _t("↓ 半音"))}${chip("tr:2", _t("↑ 全音"))}${chip("tr:-2", _t("↓ 全音"))}</div>` +
      `<div class="ctx-row"><span class="ctx-k">${_t("八度")}</span>${chip("tr:12", _t("↑ 八度"))}${chip("tr:-12", _t("↓ 八度"))}</div>` +
      `<div class="ctx-hint ctx-what">${_t("转调到（现在 1={now}）：音按两个主音之间的音程挪", { now: KEY_LABEL[now] ?? now })}</div><div class="ctx-grid">${KEY_CIRCLE_MENU.map((k) => chip(`mod:${k}`, `1=${KEY_LABEL[k]}`, k === now)).join("")}</div>` +
      `<div class="ctx-hint">${_t("{whole}所有声部一起挪，调号跟着挪（取升降号少的写法；挪八度调号不变）。歌词、记号、谱号不动；鼓 / 固定敲一个键的声部（写的音高 = 敲哪个）不动；pad 的「1=」不跟。", { whole: whole ? _t("整首") : _t("这张纸上") })}</div>`;
  };
  ctxMenu("transpose-menu", html(), at, (v) => {
    if (v.startsWith("scope:")) whole = v === "scope:song";
    else {
      const skip = new Set(partViews().filter((x) => x.xHead || x.perc).map((x) => x.id));   // 固定敲一个键 / 鼓（整套鼓：写的音高 = 敲哪个鼓，挪了就换了鼓，v0.10.27）不挪
      const nx = v.startsWith("tr:") ? transposePapers(D.st, ids(), { semis: Number(v.slice(3)) }, skip) : v.startsWith("mod:") ? transposePapers(D.st, ids(), { toFifths: Number(v.slice(4)) }, skip) : D.st;
      if (nx === D.st) info(v.startsWith("mod:") ? _t("已经是这个调") : _t("没有可以挪的音"));
      else {
        update(nx);
        const held = ids().flatMap((id) => Object.keys(D.st.song.papers.find((p) => p.id === id)?.tracks ?? {})).filter((pid) => skip.has(pid));
        if (held.length && !told) { told = true; const labels = labelsNow(); info(_t("{held} 是鼓 / 固定敲一个键（写的音高 = 敲哪个），没挪", { held: [...new Set(held)].map((pid) => labels[D.st.song.parts.findIndex((p) => p.id === pid)]).join("、") })); }
      }
    }
    const box = document.querySelector<HTMLElement>(".ctx-menu.transpose-menu"); if (box) box.innerHTML = html();
    return true;   // 不收：可以连着点
  });
}
/** pad 符号层「反复」：插在光标处（挨着小节线 = 把那条改成反复的）。 */
function openRepeatMenu(): void {
  const r = padEl.getBoundingClientRect();
  const chip = (v: string, label: string, title: string) => `<button class="btn ctx-chip" data-v="${v}" title="${esc(title)}">${esc(label)}</button>`;
  ctxMenu("repeat-menu",
    `<div class="ctx-hint ctx-what">${_t("谱内反复：插在光标处；光标挨着小节线 = 把那条改成反复的。放的时候按这张纸最上面那个声部那一行展开，别的声部跟着；不跨纸。跳回来（D.C. / D.S.）之后反复不再反复。")}</div>` +
    `<div class="ctx-row">${chip("bar:start", "|:", _t("反复开始"))}${chip("bar:end", ":|", _t("反复结束：回到 |:（没有 = 这张纸开头）再放一遍"))}${chip("bar:both", ":|:", _t("前一段反复结束、后一段反复开始"))}${chip("bar:end:3", ":| ×3", _t("一共放三遍"))}${chip("bar:end:4", ":| ×4", _t("一共放四遍"))}${chip("bar:plain", "|", _t("改回普通小节线"))}</div>` +
    `<div class="ctx-row">${chip("bs:double", _t("‖ 段落线"), _t("段落线（两根细线）：分段的记号，不是两根小节线；挨着小节线 = 把那条改成段落线"))}${chip("bs:final", _t("终止线"), _t("终止线（细 + 粗）：曲子 / 这一段到这儿结束"))}</div>` +
    `<div class="ctx-row">${ENDINGS.map((n) => chip(`end:${n.join(",")}`, endingLabel(n), _t("房子：第 {p} 遍走这里", { p: n.join("、") }))).join("")}</div>` +
    `<div class="ctx-row">${JUMPS.slice(0, 4).map((w) => chip(`nav:${w}`, NAV_LABEL[w], NAV_HELP[w])).join("")}</div>` +
    `<div class="ctx-row">${JUMPS.slice(4).map((w) => chip(`nav:${w}`, NAV_LABEL[w], NAV_HELP[w])).join("")}</div>`,
    { x: r.left + r.width / 2, y: r.top - 4 },
    (v) => {
      if (v.startsWith("bar:")) { const [, k, tm] = v.split(":"); update(setRepeatBar(D.st, k === "plain" ? null : (k as Repeat), tm ? Number(tm) : undefined)); }
      else if (v.startsWith("bs:")) update(setBarStyle(D.st, v.slice(3) as "double" | "final"));   // 段落线 / 终止线（v0.9.32；user「嗯双小节线的语义不是两个小节线，同意你的归类」）
      else if (v.startsWith("end:")) update(insertNav(D.st, "ending", v.slice(4).split(",").map(Number)));
      else if (v.startsWith("nav:")) update(insertNav(D.st, v.slice(4) as NavWhat));
      discloseNav();
    });
}
// ── 踏板（11-1，设计稿 ai-docs/20261112-pedals-and-ring-design.md 第 6 节；user 11-12「那么几种踏板也做一下，钢琴也需要」）──
//   菜单里的字带上效果、不让人去想踏板的机械（user「我觉得有些乐器反而是你踩下去才是让它停吧」——存的、说的都是「留不留住音」）。
/** 每种踏板的动作说成它的效果（设计第 6 节：说效果，不说踏板往哪边踩）。持音 / 弱音的字（11-2）是施工起的，统筹审。 */
const PEDAL_ACT_LABEL: Record<PedalKind, Record<PedalTok["act"], string>> = {
  sustain: { down: _t("踩下（留住音）"), up: _t("抬起（止音）"), change: _t("换踏板（先止音、接着留）") },
  sostenuto: { down: _t("踩下（留住这一刻按着的音）"), up: _t("抬起（放开留住的音）"), change: _t("换踏板（先放开，再留住这一刻按着的音）") },   // 持音只放开它留住的那几个（统筹审 11-2：「止音」说大了）
  soft: { down: _t("踩下（弹得轻一点）"), up: _t("抬起（回到原来的轻重）"), change: _t("换踏板（对弱音没有意思：照旧踩着）") },
};
/** 菜单里给写的动作：只有延音有「换踏板」；持音 / 弱音的换踏板只会从别家谱读进来（照读、照画；点它的小菜单里亮着、能改能删，不给新写）。 */
const PEDAL_ACTS: Record<PedalKind, readonly PedalTok["act"][]> = { sustain: ["down", "up", "change"], sostenuto: ["down", "up"], soft: ["down", "up"] };
const PEDAL_NAME: Record<PedalKind, string> = { sustain: _t("延音踏板"), sostenuto: _t("持音踏板"), soft: _t("弱音踏板") };
/** 台上这位不认这种踏板 → 一句话；没人上场 = 不说（同演奏法）。 */
function pedalIgnoredWhy(which: PedalKind): string | null {
  const role = curPart().role, pl = performerOf(activeInstrument(D.extras, role)?.engine);
  return pl && !pl.pedals?.includes(which) ? _t("{who}不认{p}：写在谱上了（画灰），出声不受影响", { who: activeCandidateName(D.extras, role) || _t("台上这位"), p: PEDAL_NAME[which] }) : null;
}
/** 这一种踏板每一段开头是不是靠默认踩着（踏板 11-3）：只有延音那一种，看光标所在声部台上这位的「没写踏板记号时留不留」。菜单的字、不起作用的判断都算上它。 */
const pedalStart = (which: PedalKind): boolean => which === "sustain" && activePedalDefault(D.extras, curPart().role) === "down";
/** 写了一个踏板记号之后：不起作用的说为什么、台上这位不认的明说（照写、画灰）。 */
function disclosePedal(which: PedalKind, idle: "already" | "notDown" | undefined): void {
  const why = pedalIgnoredWhy(which);
  if (why) { info(why); return; }
  if (idle === "already") info(pedalStart(which) ? _t("这位没写踏板记号时留住音，这里本来就踩着：这个踩下不起作用（画灰）") : _t("这里本来就踩着：这个踩下不起作用（画灰）"));
  else if (idle === "notDown") info(_t("这里本来没踩着：这个抬起不起作用（画灰）"));
}
/** 符号层「踏板」：三种踏板各一行（设计第 6 节；11-2 加了持音、弱音两行）。每一行的字跟着光标前那个音那儿这一种现在踩没踩（没踩 = 踩下；踩着 = 抬起 / 换踏板）；
 *  那个音上已经有的亮着、再点 = 去掉；有选区 = 把这一段踩住。台上这位不认的那一种：照写、画灰，那一行下面说一句。 */
function openPedalMenu(): void {
  const r = padEl.getBoundingClientRect(), KINDS: PedalKind[] = ["sustain", "sostenuto", "soft"];
  if (!pedalHere(D.st, "sustain")) { info(_t("踏板记号挂在音上：这张纸上光标附近还没有音")); return; }
  const item = (v: string, label: string, on = false, title = "") => `<button class="btn ctx-item${on ? " is-on" : ""}" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${esc(label)}</button>`;
  const rows = KINDS.map((which) => {
    const here = pedalHere(D.st, which, pedalStart(which))!, why = pedalIgnoredWhy(which);   // 字跟着光标处的状态（算上默认，设计第 6 节）
    // 这位没写踏板记号时留住音（踏板 11-3）：踩着的时候延音那一行「换踏板」排在「抬起」前面（竖琴这类常用它；按乐手身上的值排，不按这一截是怎么踩下的；统筹审 11-3）
    const acts: PedalTok["act"][] = here.down ? PEDAL_ACTS[which].filter((a) => a !== "down") : ["down"];
    if (here.down && pedalStart(which)) acts.reverse();
    if (here.mark && !acts.includes(here.mark.act)) acts.unshift(here.mark.act);   // 那个音上已经挂着的（哪怕不起作用）也列出来、亮着，点了 = 去掉
    const body = D.st.sel
      ? item(`${which}:span`, _t("把这一段踩住（选区开头踩下、结尾抬起）"))
      : acts.map((a) => item(`${which}:act:${a}`, PEDAL_ACT_LABEL[which][a], here.mark?.act === a, here.mark?.act === a ? _t("这个音上已经有了：再点 = 去掉") : "")).join("");
    return `<div class="ctx-hint ctx-what">${esc(PEDAL_NAME[which])}：${esc(SIGNS[`pedal:${which}`].says(lang()))}</div>` + (why ? `<div class="ctx-hint">${esc(why)}</div>` : "") + body;
  });
  ctxMenu("pedal-menu",
    (D.st.sel ? "" : `<div class="ctx-hint">${esc(_t("（从光标前那个音起）"))}</div>`) + rows.join(`<div class="ctx-sep"></div>`),
    { x: r.left + r.width / 2, y: r.top - 4 },
    (v) => {
      const [which, kind, act] = v.split(":") as [PedalKind, string, PedalTok["act"] | undefined];
      const res = insertPedal(D.st, which, kind === "span" ? "down" : act!, pedalStart(which));
      if (res.did === "none") return;
      update(res.st);
      if (res.did !== "removed") disclosePedal(which, res.idle);
    });
}
/** 点谱上的踏板记号：换成踩下 / 抬起 / 换踏板，或删掉；顶上说这是什么、不起作用的说为什么。 */
function openPedalMarkMenu(i: number, at: { x: number; y: number }): void {
  const toks = tr(D.st), t = toks[i]; if (!t || t.kind !== "pedal") return;
  const before = pedalDownAt(toks, i, t.which, pedalStart(t.which)), why = pedalIgnoredWhy(t.which);
  const idle = t.act === "down" && before ? (pedalStart(t.which) && !toks.slice(0, i).some((x) => x.kind === "pedal" && x.which === t.which) ? _t("不起作用（画灰）：这位没写踏板记号时留住音，这里本来就踩着") : _t("不起作用（画灰）：这里本来就踩着")) : t.act === "up" && !before ? _t("不起作用（画灰）：这里本来没踩着") : t.act === "change" && !before ? _t("这里之前没踩着，换踏板 = 踩下") : "";
  ctxMenu("pedal-menu",
    `<div class="ctx-hint ctx-what">${esc(PEDAL_NAME[t.which])}：${esc(SIGNS[`pedal:${t.which}`].says(lang()))}</div>` +
    (idle ? `<div class="ctx-hint">${esc(idle)}</div>` : "") + (why ? `<div class="ctx-hint">${esc(why)}</div>` : "") +
    [...PEDAL_ACTS[t.which], ...(PEDAL_ACTS[t.which].includes(t.act) ? [] : [t.act])].map((a) => `<button class="btn ctx-item${t.act === a ? " is-on" : ""}" data-v="act:${a}">${esc(PEDAL_ACT_LABEL[t.which][a])}</button>`).join("") +
    `<div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">${_t("删掉这个踏板记号")}</button>`, at,
    (v) => {
      if (v === "del") { update(editMarkAt(D.st, i, null)); return; }
      const act = v.slice(4) as PedalTok["act"], nx = editMarkAt(D.st, i, { act }); if (nx === D.st) return;
      update(nx);
      const now = pedalDownAt(tr(D.st), i, t.which, pedalStart(t.which));
      disclosePedal(t.which, act === "down" && now ? "already" : act === "up" && !now ? "notDown" : undefined);
    });
}
// ── 谱号 / 八度线（v0.9.28；user「谱号的显示模式跟着谱号而不是乐器」「默认自动同意」「加格式同意」「8va可以做了吗」）：只管画，音高数据不动 ──
const OTTAVAS: readonly (1 | 2 | -1)[] = [1, 2, -1];
const OTT_HELP: Record<number, string> = { 1: _t("8va：谱上画低一个八度（实际照写的高八度响）"), 2: _t("15ma：谱上画低两个八度"), [-1]: _t("8vb：谱上画高一个八度（实际照写的低八度响）"), 0: _t("到这儿结束八度线") };
const clefChips = (on: ClefName | null, prefix: string) => CLEFS.map((c) => `<button class="btn ctx-chip${on === c ? " is-on" : ""}" data-v="${prefix}${c}" title="${esc(CLEF_TITLE[c])}">${esc(CLEF_LABEL[c])}</button>`).join("");
/** 插谱号（pad 符号层 / 空白处菜单）：从光标处起换。 */
function openInsertClefMenu(at: { x: number; y: number }): void { insertMarkHere(undefined, at); }   // 谱号也在谱头面板里（v0.16.8）
/** 插八度线：从光标处起（有选区 = 这一段）。 */
function openInsertOttavaMenu(at: { x: number; y: number }): void {
  ctxMenu("ottava-menu", `<div class="ctx-hint ctx-what">${_t("八度线：从光标处起{sel}。只管画，音高不变。", { sel: D.st.sel ? _t("（有选区 = 只画这一段）") : _t("，到下一个八度线记号为止") })}</div>` +
    `<div class="ctx-row">${[...OTTAVAS, 0].map((v) => `<button class="btn ctx-chip" data-v="o:${v}" title="${esc(OTT_HELP[v])}">${esc(OTTAVA_LABEL[v])}</button>`).join("")}</div>`, at,
    (v) => { if (v.startsWith("o:")) update(insertOttava(D.st, Number(v.slice(2)) as -1 | 0 | 1 | 2)); });
}
/** 点谱上的谱号 / 八度线。行首的谱号：管着它的是声部自己的谱号 = 改声部的（全曲，自动也在这）+「只改这张纸」；是谱号记号 = 改 / 删那个记号。 */
/** 谱头面板（v0.16.8，src/app/header-panel.ts）：谱号 / 调号 / 拍号 / 速度同一个面板。 */
const headerPanel = createHeaderPanel({
  state: () => D.st, lookCtx: () => lookCtx(), update: (n) => update(n), updateLook: (n, label) => setSongLook(n, label), menu: (cls, html, at, pick) => ctxMenu(cls, html, at, pick),
  openTempo: (paperId, partId, index, fresh) => view.openMarkEditor(paperId, partId, index, fresh),
  partName: (id) => labelsNow()[D.st.song.parts.findIndex((p) => p.id === id)] ?? id,
  noKey: (partId) => (isPercPart(partId) ? NO_KEY_WHY() : null),   // 打击乐的行：调号那一格灰着、说为什么（7-R）
  autoNow: (paperId, partId) => { const l = lookNow(paperId, partId); return l?.staves === 2 ? _t("大谱表") : CLEF_LABEL[l?.clef ?? "G"]; },
  look: (paperId, partId) => lookNow(paperId, partId),
});
function openClefMenu(hit: ClefHit, at: { x: number; y: number }): void {
  if (hit.kind !== "ottava") { headerPanel.open(hit.paper, hit.part, hit.index >= 0 ? hit.index : 0, at); return; }   // 谱号（行首的 / 中途的）= 谱头面板；八度线照旧小菜单
  const paper = D.st.song.papers.find((p) => p.id === hit.paper), toks = paper?.tracks[hit.part]; if (!toks) return;
  const part = D.st.song.parts.find((p) => p.id === hit.part); if (!part) return;
  if (hit.kind === "ottava" && hit.run) {   // 自动画的八度线（v0.9.37；user「自动加」）：不存进谱；可以固定成手写的，或者这位不要自动
    const r = hit.run, lab = OTTAVA_LABEL[r.shift];
    ctxMenu("ottava-menu", `<div class="ctx-hint ctx-what">${_t("自动八度线：这一串音要三条以上加线，自动画了 {lab}。只管画、不存进谱，音高不变；改了音会跟着重算。手写的八度线说了算。", { lab: esc(lab) })}</div>` +
      `<button class="btn ctx-item" data-v="pin">${_t("固定成手写的 {lab}（之后自己改）", { lab: esc(lab) })}</button><button class="btn ctx-item" data-v="off">${_t("这一段不要自动八度线")}</button>`, at,
      (v) => {
        if (v === "pin") update(insertOttava({ ...setFocus(D.st, hit.paper, hit.part, r.from), sel: { from: r.from, to: r.to + 1 } }, r.shift));
        else if (v === "off") { update(setPaperLook(D.st, hit.paper, hit.part, { autoOttava: false })); info(_t("这一段这个声部的自动八度线关了（点谱号、谱头面板里能再开）")); }
      });
    return;
  }
  if (hit.kind === "ottava") {
    const t = toks[hit.index]; if (!t || t.kind !== "ottava") return;
    const off = lookNow(hit.paper, hit.part)?.staves === 2;   // 大谱表上手写的八度线现在不起作用：谱上画灰，这里明说（谱面分家第五刀 5-3；真做 = 愿望单 W-73）
    ctxMenu("ottava-menu", (off ? `<div class="ctx-hint">${_t("不起作用（画灰）：{why}", { why: esc(_t("大谱表上八度线现在不起作用（音不挪，也不印）")) })}</div>` : "") + `<div class="ctx-hint ctx-what">${_t("八度线：{p}。只管画，音高不变。", { p: esc(OTT_HELP[t.shift]) })}</div>` +
      `<div class="ctx-row">${OTTAVAS.map((v) => `<button class="btn ctx-chip${t.shift === v ? " is-on" : ""}" data-v="o:${v}" title="${esc(OTT_HELP[v])}">${esc(OTTAVA_LABEL[v])}</button>`).join("")}</div><div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">${_t("删掉这条八度线")}</button>`, at,
      (v) => { if (v === "del") update(setDisplayMark(D.st, hit.paper, hit.part, hit.index, null)); else if (v.startsWith("o:")) update(setDisplayMark(D.st, hit.paper, hit.part, hit.index, Number(v.slice(2)) as -1 | 1 | 2)); });
    return;
  }
  // 谱号记号 / 声部的谱号：v0.16.8 起走谱头面板（上面第一行）；声部默认谱号、自动八度线在轨的小卡里（点歌手名）
}
const NAV_HELP: Record<Exclude<NavWhat, "ending">, string> = {
  segno: _t("Segno：D.S. 跳回到这儿"), coda: _t("Coda：To Coda 跳到这儿"), fine: _t("Fine：跳回来（al Fine）之后在这儿停"), toCoda: _t("To Coda：跳回来（al Coda）之后从这儿去 Coda"),
  dc: _t("D.C.：跳回这张纸开头，放到纸尾"), dcFine: _t("D.C. al Fine：跳回开头，放到 Fine"), dcCoda: _t("D.C. al Coda：跳回开头，到 To Coda 去 Coda"),
  ds: _t("D.S.：跳回 Segno，放到纸尾"), dsFine: _t("D.S. al Fine：跳回 Segno，放到 Fine"), dsCoda: _t("D.S. al Coda：跳回 Segno，到 To Coda 去 Coda"),
};
/** 点谱上的房子 / 跳转记号：换成别的 / 删；不起作用的说为什么。 */
function openNavMenu(i: number, at: { x: number; y: number }): void {
  const t = tr(D.st)[i]; if (!t || t.kind !== "nav") return;
  const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper), why = paper ? navWhy(D.st.song, paper, D.st.at.part, t) : null;
  const chips = t.what === "ending"
    ? ENDINGS.map((n) => `<button class="btn ctx-chip${n.join() === (t.nums ?? [1]).join() ? " is-on" : ""}" data-v="nums:${n.join(",")}">${esc(endingLabel(n))}</button>`).join("")
    : JUMPS.map((w) => `<button class="btn ctx-chip${t.what === w ? " is-on" : ""}" data-v="nav:${w}" title="${esc(NAV_HELP[w])}">${esc(NAV_LABEL[w])}</button>`).join("");
  ctxMenu("nav-menu",
    (why ? `<div class="ctx-hint">${_t("不起作用（画灰）：{why}", { why: esc(why) })}</div>` : "") +
    `<div class="ctx-hint ctx-what">${esc(t.what === "ending" ? _t("房子：第 {nums} 遍走这个括号，别的遍跳过", { nums: (t.nums ?? [1]).join("、") }) : NAV_HELP[t.what])}</div>` +
    `<div class="ctx-row">${chips}</div><div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">${_t("删除")}</button>`,
    at,
    (v) => {
      if (v === "del") { update(editMarkAt(D.st, i, null)); return; }
      if (v.startsWith("nums:")) { update(editMarkAt(D.st, i, { nums: v.slice(5).split(",").map(Number) })); return true; }
      if (v.startsWith("nav:")) { update(editMarkAt(D.st, i, { nav: v.slice(4) as Exclude<NavWhat, "ending"> })); return true; }
    });
}
function openGrooveMenu(i: number, at: { x: number; y: number }): void {
  const toks = tr(D.st), t = toks[i]; if (!t || t.kind !== "groove") return;
  ui.close();
  let end = toks.length; for (let j = i + 1; j < toks.length; j++) if (toks[j].kind === "groove") { end = j; break; }
  view.setSpan({ from: i + 1, to: end });   // 它管的音染色（到下一个风格记号 / 这张纸结尾）
  const style = grooveDataIn(D.st.song, t.style), amount = t.amount ?? 1;   // 16-4 D：说明、摇摆、跟多少都按歌里这一份现算
  const meters = new Set([`${timeAt(toks, i).beats}/${timeAt(toks, i).beatType}`]);
  for (let j = i + 1; j < end; j++) { const u = toks[j]; if (u.kind === "time") meters.add(`${u.beats}/${u.beatType}`); }
  const hints: string[] = [];
  if (!style && t.style !== "none") hints.push(_t("这首歌里没有「{style}」这种风格的拍子表，现行的预设里也没有：这个记号不起作用（不加轻重、不摇，不拿别的风格顶上）。换一个风格就好", { style: t.style }));
  if (style && t.style !== "none") for (const m of meters) { const [b, bt] = m.split("/").map(Number), d = describeGroove(style, b, bt); if (d) hints.push(`${grooveName(t.style)} ${m}：${d}`); }   // 这个风格在这儿怎么轻重（从数据现算）
  if (style && t.style !== "none") {
    const derived = [...meters].filter((m) => { const [b, bt] = m.split("/").map(Number); return grooveTable(style, b, bt)?.derived; });
    const none = [...meters].filter((m) => { const [b, bt] = m.split("/").map(Number); return !grooveTable(style, b, bt); });
    if (derived.length) hints.push(_t("{p} 这个预设没列：按古典的强弱推{m}", { p: derived.join("、"), m: derived.some((m) => m.endsWith("/8") && Number(m.split("/")[0]) % 3 !== 0 && Number(m.split("/")[0]) > 3) ? _t("（几个八分一组谱上没记，按 2 + 2 + … + 3 推）") : "" }));
    if (none.length) hints.push(_t("{p}：这个预设不加轻重", { p: none.join("、") }));
    if (style.swing) { const r = swingRatio(style, amount), [lo, hi] = style.swing.range;   // 摇摆（v0.9.36）：按数据现算（纪律：做到什么程度明说）
      hints.push(_t("摇摆：一拍里前一个八分占 {p}%（直 = 50%，三连音感 ≈ 67%；幅度只放大 / 缩小比直的多出来的那一截，夹在 {p2}–{p3}%）。这张纸上所有声部一起摇（小月相也是，不分跟多少）；写成连音的音、6/8 这类拍号不摇", { p: Math.round(r * 100), p2: Math.round(lo * 100), p3: Math.round(hi * 100) })); }
    const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper);
    const who = D.st.song.parts.filter((p) => paper?.tracks[p.id]).map((p) => {
      const f = followOf(style, grooveCategory(performerOf(activeInstrument(D.extras, p.role)?.engine)?.grooveCategory ?? null, activeGm(D.extras, p.role)));
      return `${roleLabel(p.role)} ${f > 0 ? _t("跟 {p}%", { p: Math.round(f * 100) }) : _t("不跟")}`;
    });
    if (who.length) hints.push(_t("这张纸上：{p}（按乐器类别，预设给的）", { p: who.join(" · ") }));
  }
  const chips = GROOVE_STYLES.filter((x) => x.id !== "none").map((x) => `<button class="btn ctx-chip${t.style === x.id ? " is-on" : ""}" data-v="style:${x.id}" title="${esc(x.aliases.length ? _t("也叫 {p}", { p: x.aliases.join(" / ") }) : grooveName(x.id))}">${esc(x.name.en)}${lang() === "zh" ? `<small> · ${esc(x.name.zh)}</small>` : ""}</button>`).join("") +   // 谱上写英文（user「风格名用英文」），按钮带中文
    `<button class="btn ctx-chip${t.style === "none" ? " is-on" : ""}" data-v="style:none" title="${_t("从这儿起不加拍子轻重")}">${_t("不加轻重")}</button>`;
  const amounts = [0.5, 1, 1.5, 2].map((a) => `<button class="btn ctx-chip${Math.abs(amount - a) < 1e-9 ? " is-on" : ""}" data-v="amount:${a}" title="${_t("幅度：预设的 {a} 倍", { a })}">×${a}</button>`).join("");
  const box = document.createElement("div");
  box.className = "track-card ctx-menu groove-menu"; box.setAttribute("role", "menu");
  box.innerHTML = `<div class="ctx-hint ctx-what">${_t("风格 = 拍子轻重：从这个音起到这张纸结尾，每个音按它落在小节里的哪一拍轻一点或重一点（像鼓手的律动）；写了重音 / 弱化的音照写的来。")}</div>` +
    `<div class="ctx-row ctx-groove">${chips}</div>` + (t.style !== "none" ? `<div class="ctx-row ctx-amount">${amounts}</div>` : "") +
    (grooveHasPhase(style) ? `<div class="ctx-row ctx-phase"><button class="btn ctx-chip${t.shift ? "" : " is-on"}" data-v="shift:0" title="${_t("一轮的第一小节是三击那边（前句），从这个记号那一小节起数")}">3-2</button><button class="btn ctx-chip${t.shift ? " is-on" : ""}" data-v="shift:1" title="${_t("错开一小节：两小节对调，第一小节是两击那边")}">${_t("2-3（错开一小节）")}</button></div>` : "") +
    hints.map((h) => `<div class="ctx-hint">${esc(h)}</div>`).join("") + `<div class="ctx-sep"></div>` +
    `<button class="btn ctx-item danger" data-v="del" title="${_t("去掉这个风格记号（这儿起回到前一个风格；这张纸开头 = 不加）")}">${_t("删除")}</button>` +
    `<div class="ctx-hint">${_t("只管这张纸：从这个音到这张纸结尾（或下一个风格记号）。长按拖 = 挪到别的音上")}</div>`;
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let y = at.y + 6; if (y + h > innerHeight - m) y = at.y - h - 30;
  box.style.left = `${Math.max(m, Math.min(at.x - w / 2, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); view.setSpan(null); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "del") update(editMarkAt(D.st, i, null));
    else if (v.startsWith("style:")) {   // 换了接着看（说明会跟着变）；换成没有两小节一轮的风格 = 错开一小节顺手去掉
      let n = editMarkAt(D.st, i, { style: v.slice(6) }); if (!grooveHasPhase(grooveStyle(v.slice(6)))) n = editMarkAt(n, i, { shift: false });
      update(n); view.menuFor(i); return;
    }
    else if (v.startsWith("amount:")) { update(editMarkAt(D.st, i, { amount: Number(v.slice(7)) })); view.menuFor(i); return; }
    else if (v.startsWith("shift:")) { update(editMarkAt(D.st, i, { shift: v === "shift:1" })); view.menuFor(i); return; }   // 两小节一轮：3-2 / 2-3（错开一小节）
    scoreEl.focus();
  });
}
function openMarkMenu(i: number, at: { x: number; y: number }): void {
  if (tr(D.st)[i]?.kind === "groove") { openGrooveMenu(i, at); return; }
  if (tr(D.st)[i]?.kind === "nav") { openNavMenu(i, at); return; }
  if (tr(D.st)[i]?.kind === "pedal") { openPedalMarkMenu(i, at); return; }
  const t = tr(D.st)[i]; if (!t || (t.kind !== "dyn" && t.kind !== "hairpin")) return;
  ui.close();
  // 它管哪几个音（染强调色，菜单收起就清；user「如何不混淆的搞清楚<到底是哪里开始的？」）：渐强渐弱 = 到终点为止；渐到 = 从上一个力度记号后面到这儿；
  //   别的力度记号 = 从这儿管到下一个力度记号 / 渐强渐弱
  const toks = tr(D.st), src = t.kind === "dyn" ? rampSource(toks, i) : "none";
  const nextMark = (k: number) => { for (let j = k + 1; j < toks.length; j++) if (toks[j].kind === "dyn" || toks[j].kind === "hairpin") return j; return toks.length; };
  view.setSpan(t.kind === "hairpin" ? { from: i + 1, to: nextMark(i) } : t.ramp && typeof src === "number" ? { from: src + 1, to: i } : { from: i + 1, to: nextMark(i) });
  const box = document.createElement("div");
  box.className = "track-card ctx-menu"; box.setAttribute("role", "menu");
  const row = t.kind === "dyn"
    ? (["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const).map((d) => `<button class="btn ctx-chip${t.value === d ? " is-on" : ""}" data-v="dyn:${d}" title="${_t("改成 {d}", { d })}"><span class="smufl">${DYN_MENU[d]}</span></button>`).join("")
    : (["cresc", "dim"] as const).map((d) => `<button class="btn ctx-chip${t.dir === d ? " is-on" : ""}" data-v="dir:${d}" title="${d === "cresc" ? _t("渐强") : _t("渐弱")}">${WEDGE_MENU[d]}</button>`).join("");
  // 渐到（只给力度记号）：开关 + 做不到时说为什么（纪律：画灰 + 明说）
  const rampWhy = src === "none" ? _t("这张纸里前面没有力度记号，没有地方渐过来") : src === "hairpin" ? _t("中间有手写的渐强渐弱，按手写的走") : "";
  const offWhy = t.kind === "dyn" && dynOverridden(toks).has(i) ? `<div class="ctx-hint">${_t("不起作用（画灰）：后面那个音是强后即弱（fp）——音头按 f、随后落到 p，之后也是 p，这个 {value} 管不到", { value: t.value })}</div>` : "";
  const rampRow = t.kind !== "dyn" ? "" : `<div class="ctx-sep"></div><button class="btn ctx-item${t.ramp ? " is-on" : ""}" data-v="ramp"${rampWhy && !t.ramp ? " disabled" : ""} title="${_t("渐到：从这张纸里上一个力度记号那儿一路渐变到这里（谱上虚线发夹）；关 = 到这儿突变")}">${_t("{ramp}渐到（从上一个力度渐变过来）", { ramp: t.ramp ? "✓ " : "" })}</button>` +
    (rampWhy ? `<div class="ctx-hint">${t.ramp ? _t("不起作用：") : ""}${esc(rampWhy)}</div>` : "");
  // 顶上一行「这是什么」（谱面分家第五刀 5-4 ⑧，UX 稿：点一下就说明）：字从记号表来（src/render/signs.ts，和谱上画什么同一张表）；渐到开着 = 再说一句渐到
  const what = t.kind === "dyn" ? SIGNS[`dyn:${t.value}`].says(lang()) + (t.ramp ? (lang() === "zh" ? "；" : "; ") + SIGNS.ramp.says(lang()) : "") : SIGNS[`hairpin:${t.dir}`].says(lang());
  // 「变到」（只给手写的发夹；7-N 补，user「怎么样在后面加一个符号？」「括号的小字…可以手动设置成别的」）：终点写到这条发夹现在结束的地方。
  //   亮着的 = 现在的终点（后面那个力度记号；没有 = 走一档）；和方向反着的那几档标出来、不拦（照旧方向说了算、谱上灰字）。点末端的推定灰字开的也是这个菜单（同一条发夹）
  const toRow = t.kind !== "hairpin" ? "" : ((): string => {
    let j = i + 1; while (j < toks.length && toks[j].kind !== "dyn" && toks[j].kind !== "hairpin") j++;
    const endDyn = j < toks.length && toks[j].kind === "dyn" ? (toks[j] as Extract<Token, { kind: "dyn" }>) : null;
    let cur: Dyn = "mf"; for (let k = i - 1; k >= 0; k--) { const x = toks[k]; if (x.kind === "dyn") { cur = x.value; break; } }
    const LV = ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const, ci = LV.indexOf(cur);
    const against = (d: Dyn) => (t.dir === "cresc" ? LV.indexOf(d) <= ci : LV.indexOf(d) >= ci);
    const blocked = !!endDyn && !markAtEnd(toks, j);
    const chips = LV.map((d) => `<button class="btn ctx-chip${endDyn?.value === d ? " is-on" : ""}${against(d) ? " is-against" : ""}" data-v="to:${d}" title="${against(d) ? esc(_t("和方向反着：照方向先走一档，到这儿突变成 {d}（谱上灰字说明）", { d })) : esc(_t("终点 = {d}", { d }))}"><span class="smufl">${DYN_MENU[d]}</span></button>`).join("");
    return `<div class="ctx-sep"></div><div class="ctx-k ctx-to">${_t("变到")}</div><div class="ctx-row ctx-dyn"><button class="btn ctx-chip${endDyn ? "" : " is-on"}" data-v="to:step"${blocked ? " disabled" : ""} title="${esc(_t("没写终点：照方向走一档（谱上灰字）"))}">${_t("走一档")}</button>${chips}</div>` +
      (blocked ? `<div class="ctx-hint">${_t("终点那个力度记号还管着后面的音：这里不去掉它（要改它就点它）")}</div>` : "");
  })();
  box.innerHTML = `<div class="ctx-hint ctx-what">${esc(what)}</div>${offWhy}<div class="ctx-row ctx-dyn">${row}</div>${rampRow}${toRow}<div class="ctx-sep"></div>` +
    // 挪到这一段结尾（7-N）：「到这里为止变到这个力度」——一直滚 / 渐强到这张纸结束、后面没有音可以挂的时候用；已经在结尾 = 不给
    (t.kind === "dyn" && !markAtEnd(toks, i) ? `<button class="btn ctx-item" data-v="toEnd" title="${_t("挪到这一段最后一个音后面：渐强渐弱 / 渐到一直走到这一段结束")}">${_t("挪到这一段结尾")}</button>` : "") +
    `<button class="btn ctx-item danger" data-v="del" title="${t.kind === "dyn" ? _t("去掉这个力度记号（后面的音回到前一个力度记号）") : _t("去掉这个渐强 / 渐弱")}">${_t("删除")}</button>` +
    `<div class="ctx-hint">${t.kind === "dyn" ? _t("长按拖 = 挪到别的音上（最后一个音的右边 = 这一段结尾）") : _t("长按拖 = 挪到别的音上")}</div>`;
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let y = at.y + 6; if (y + h > innerHeight - m) y = at.y - h - 30;
  box.style.left = `${Math.max(m, Math.min(at.x - w / 2, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); view.setSpan(null); };   // 收起 = 不再染
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "ramp" && t.kind === "dyn") update(editMarkAt(D.st, i, { ramp: !t.ramp }));
    else if (v === "del") update(editMarkAt(D.st, i, null));
    else if (v === "toEnd") { const r = moveMarkToEnd(D.st, i); update(r.st); if (r.removed) info(_t("顺手去掉了 {n} 个不再管任何音的记号（力度 / 渐强渐弱 / 踏板；撤销能找回来）", { n: r.removed })); }
    else if (v.startsWith("dyn:")) update(editMarkAt(D.st, i, { value: v.slice(4) as Dyn }));
    else if (v.startsWith("dir:")) update(editMarkAt(D.st, i, { dir: v.slice(4) as "cresc" | "dim" }));
    else if (v.startsWith("to:")) {   // 「变到」：一步撤销；说一句放在了哪
      const d = v === "to:step" ? null : (v.slice(3) as Dyn), r = setHairpinTarget(D.st, i, d);
      if (r.st !== D.st) update(r.st);
      const msg = { changed: _t("终点改成了 {d}（发夹后面那个力度记号）", { d: d ?? "" }), beforeHairpin: _t("在下一条渐强渐弱前面放了 {d}", { d: d ?? "" }), end: _t("在这一段最后一个音后面放了 {d}", { d: d ?? "" }),
        removed: _t("去掉了这一段结尾那个力度记号：回到走一档"), blocked: _t("终点那个力度记号还管着后面的音：这里不去掉它（要改它就点它）"), none: "" }[r.did];
      if (msg) info(msg);
    }
    scoreEl.focus();
  });
}
/** 选区菜单（2026-10-08 by Claude Opus 5.5；user「移调转调和长度以及其他的操作不要用keyboard，而是一个小的上下文菜单，键盘只做纯粹的打谱」）：
 *  选区条「操作…」/ 长按选区里的音 / 右键选中的音 → 开在那里。移调、时值点了不收（可以连着点）；转调先换成调的列表；其余点了就收。 */
const UNIT_SMUFL = ["\uE1DB", "\uE1D9", "\uE1D7", "\uE1D5", "\uE1D3", "\uE1D2"];   // 同 pad 的长短旋钮
const KEY_CIRCLE_MENU = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
function selBarAnchor(): { x: number; y: number } {
  const r = document.querySelector<HTMLElement>('.sel-bar [data-v="transpose"]')?.getBoundingClientRect();
  return r ? { x: r.left, y: r.bottom } : { x: innerWidth / 2 - 100, y: 120 };
}
function openSelMenu(at: { x: number; y: number }): void {
  const perc = isPercPart(D.st.at.part);   // 打击乐的行没有调（7-R）：转调 / 按调号拼写灰着
  if (!D.st.sel) return;
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card ctx-menu sel-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title = "", cls = "") => `<button class="btn ctx-item ${cls}" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const chip = (v: string, label: string, title = "") => `<button class="btn ctx-chip" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const draw = (page: "main" | "keys") => {
    if (page === "keys") {
      const now = keyAt(tr(D.st), D.st.sel?.from ?? 0);
      box.innerHTML = item("back", _t("‹ 转调到…")) + `<div class="ctx-grid">` + KEY_CIRCLE_MENU.map((k) => chip(`mod:${k}`, `1=${KEY_LABEL[k]}`, k === now ? _t("现在的调") : "")).join("") + `</div>`;
      return;
    }
    box.innerHTML =
      `<div class="ctx-row"><span class="ctx-k">${_t("移调")}</span>${chip("tr:1", _t("↑ 半音"))}${chip("tr:-1", _t("↓ 半音"))}${chip("tr:2", _t("↑ 全音"))}${chip("tr:-2", _t("↓ 全音"))}${chip("oct:1", _t("↑ 八度"))}${chip("oct:-1", _t("↓ 八度"))}</div>` +
      // 打击乐的行（7-R）：转调 / 按调号拼写都是从调号推出来的，灰着、点了说为什么；移调的半音 / 全音 / 八度留着
      (perc ? item("keys", _t("转调…"), NO_KEY_WHY(), "is-off") + item("respell", _t("按调号拼写"), NO_KEY_WHY(), "is-off")
        : item("keys", _t("转调…"), _t("整段转到另一个调：音按两个主音之间的音程挪，调号跟着换")) +
          item("respell", _t("按调号拼写"), _t("音高不变：调内的音换成调号里的写法（A♭ 在五个升号的调里 = G♯），调外的不动"))) +
      `<div class="ctx-row"><span class="ctx-k">${_t("时值")}</span>${chip("short", "÷2")}${chip("long", "×2")}${chip("seldur", `${_t("都改成")} <span class="smufl">${UNIT_SMUFL[D.st.input.unit]}</span>`, _t("都改成长短旋钮现在那一档"))}</div>` +
      `<div class="ctx-row"><span class="ctx-k">${_t("清掉记号")}</span>${chip("clr:phrase", _t("曲级"), _t("力度字、渐强渐弱、渐到、风格（选区第一个音前面挂着的也算）"))}${chip("clr:note", _t("音级"), _t("演奏法、音头（重音 / 突强…）、音内起伏、连线、呼吸、气声"))}${chip("clr:all", _t("都清"), _t("曲级 + 音级；音、歌词、调号拍号速度、反复不动"))}</div>` +
      `<div class="ctx-sep"></div>` + item("copy", _t("复制")) + item("cut", _t("剪切")) + (clip ? item("paste", _t("粘贴（替换选中的）")) : "") + item("delete", _t("删掉"), "", "danger");
  };
  draw("main");
  document.body.append(box);
  const place = () => {
    const w = box.offsetWidth, h = box.offsetHeight, m = 8;
    let y = at.y + 8; if (y + h > innerHeight - m) y = at.y - h - 8;
    box.style.left = `${Math.max(m, Math.min(at.x, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  };
  place();
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v || !D.st.sel) return;
    const cmd = (c: Command) => update(apply(D.st, c, performance.now()));
    if (v.startsWith("tr:")) { cmd({ k: "transpose", semis: Number(v.slice(3)) }); previewEdited(); return; }   // 不收：可以连着点
    if (v.startsWith("oct:")) { cmd({ k: "octave", d: Number(v.slice(4)) }); previewEdited(); return; }
    if (v === "short") { cmd({ k: "selscale", f: 0.5 }); return; }
    if (v === "long") { cmd({ k: "selscale", f: 2 }); return; }
    if (v === "seldur") { cmd({ k: "seldur" }); return; }
    if (v.startsWith("clr:")) { const n = clearMarks(D.st, v.slice(4) as "phrase" | "note" | "all"); if (n === D.st) info(_t("选中的这一段没有这类记号")); else update(n); close(); scoreEl.focus(); return; }
    if ((v === "keys" || v === "respell") && perc) { info(_t("{why}：「{what}」用不了", { why: NO_KEY_WHY(), what: v === "keys" ? _t("转调…") : _t("按调号拼写") })); return; }   // 打击乐的行（7-R）
    if (v === "keys") { draw("keys"); place(); return; }
    if (v === "back") { draw("main"); place(); return; }
    close();
    if (v.startsWith("mod:")) cmd({ k: "modulate", fifths: Number(v.slice(4)) });
    else if (v === "respell") cmd({ k: "respell" });
    else void selVerb(v as SelVerb);
    updateChrome();
  });
}
// 乐器页：占 #stage 的 main 区（和乐器目录 / 录音室同一个位置），pad 留在旁边只弹不写——弹的就是台上这位，改了马上能试。
const instEl = document.createElement("div");
instEl.className = "inst-page"; instEl.hidden = true;
$("stage").append(instEl);
// 找人：从货架（家族音源库）或自己的 .sf2 文件挑一把琴 → 只把那一件切出来（契约 §10.2）
const UNKNOWN_TITLE = _t("这一版出不了声（别的软件原来的乐器）");   // 认得出的候选：说明由插件自报（description）
/** 小月相唱法核心的旋钮 = 乐器页「高级」（存进候选 defaults，by value、走 undo、换人跟人走；出厂值 = template.ts）。
 *  2026-10-15 user 拍板：齐平默认关（「应该leverage就是齐平，我觉得不开没什么影响吧，默认不开」），旋钮进高级设置持久化；「连续」也放着试。物理意义 = ai-docs/20261013-dango-c10-pop-probe.md §6。
 *  2026-10-17 改回齐平 0.8 + 连续（user「那个破音是因为默认关了齐平导致的…加上连续过渡然后用那个默认」「齐平还是默认开吧。爆音至少比响度不可控好」；format/performance.ts TSUKUYOMI_DEFAULTS）。 */
function openInstPage(): void {
  catSync();   // 乐器目录先载上：点回旧候选时要同步反查（castAsOf）
  ui.close();
  if (finder.isOpen) closeFinder(false);
  ui.setPage({ k: "inst" }); scoreEl.hidden = true; instEl.hidden = false;
  ws.tryout = padLocked(ui.page); showPad(true); padEl.classList.add("is-locked"); pad.clearHeld(); pad.render();
  drawInst(); updateChrome();
  instEl.querySelector<HTMLElement>(".ip-body")?.scrollTo({ top: 0 });
}
function closeInstPage(): void {
  if (!instShown()) return;
  ui.setPage({ k: "score" }); instEl.hidden = true; ws.tryout = false; applyWorkspace();   // 乐器页和目录互斥：关乐器页时目录一定没开
  padEl.classList.remove("is-locked"); pad.clearHeld(); pad.render(); scoreEl.hidden = false; view.render(); renderTitle(); updateChrome(); scoreEl.focus();
}
const fileInput = (accept: string, onFile: (f: File) => Promise<void>) => {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; inp.hidden = true; document.body.append(inp);
  inp.addEventListener("change", async () => { const f = inp.files?.[0]; inp.remove(); if (f) await onFile(f); });
  inp.click();
};
// 弱引用找不到整包时：人把文件给它（核整包 sha256；对了就留在设备上）
const findBankFile = (id: string) => {
  const g = gmCandidates(D.extras, curRole()).find((c) => c.id === id); if (!g) return;
  fileInput(".sf2,audio/x-soundfont", async (f) => {
    try {
      const bytes = new Uint8Array(await f.arrayBuffer()), sha = await sha256Hex(bytes);
      if (sha !== g.origin.fileSha256) throw new Error(_t("「{name}」不是歌里记的那个「{name2}」（sha256 {p}… ≠ {p2}…）", { name: f.name, name2: g.origin.name, p: sha.slice(0, 12), p2: g.origin.fileSha256.slice(0, 12) }));
      await rememberSound(sha, bytes, true); sources.session.drop(g.subsetSha256);
      await sources.resolveGmBytes(g); info(_t("找到了：「{name}」能响了", { name: g.name })); drawInst();
    } catch (e) { showError((e as Error).message); }
  });
};
/** 乐器设置页（v0.16.39 搬出 main.ts = src/app/panels/inst-settings.ts；施工单 §6）：这里只接线。 */
const instPage = createInstSettings(instEl, {
  labels: () => labelsNow(), roleLabel: (role) => roleLabel(role),
  shown: () => instShown(), extras: () => D.extras, song: () => D.st.song, at: () => D.st.at, role: () => curRole(), engine: () => engineNow(),
  catalog: () => catalogNow, needCatalog: () => { void loadCatalog().then((c) => { catalogNow = c; drawInst(); }).catch(() => undefined); },
  padHidden: () => padEl.hidden, abbr: (k) => partLooks().abbrs[k] ?? "", sessionHas: (sha) => sources.session.has(sha), bankBytes: (sha) => sources.session.get(sha),
  commit: (next, label, gesture) => updateExtras(next, { kind: "lounge", label }, gesture),
  setHum: (hm) => { const role = curRole(); updateExtras(withHum(D.extras, role, hm), { kind: "lounge", label: _t("哼的字") }); },   /* 这一位的（第 16 条 16-3：只在乐手身上） */ setPart: (id) => { update(setFocus(D.st, D.st.at.paper, id)); sound.allOff(); void prepareBank(); pad.render(); }, silence: () => sound.allOff(),
  back: () => closeInstPage(), togglePad: () => showPad(padEl.hidden), openFinder: () => openFinder(), findBankFile: (id) => findBankFile(id),
});
function drawInst(): void { instPage.draw(); }
/** 视图态（desk，src/score/desk.ts）：存时聚一下（bytesNow）、开歌时散回去（loadDoc）。变量本身仍住这里（viewScope / pageFlow / partView）。 */
const deskNow = (): Desk => ({ scope: viewScope, pageFlow, scroll: scrollFlow, paper: D.st.at.paper, parts: Object.fromEntries(partView), mp3: mp3Quality, mode: ws.mode,
  pad: { auto: D.st.input.inputAuto, fifths: D.st.input.inputFifths, scale: D.st.input.inputScale, unit: PAD_UNITS[D.st.input.unit], tuplet: D.st.input.tuplet, low: pad.rangeLow() }, ref: refHost.panel(), finder: finder.memo("song") });   // pad 的状态跟着歌走（同 WeebPaint editor-state）
function applyDesk(d: Desk): void {
  viewScope = d.scope; pageFlow = d.pageFlow; scrollFlow = d.scroll; mp3Quality = d.mp3;
  finder.restore("song", d.finder);   // 乐器目录在这首歌里翻到哪（新歌 = 按年代、全收着、在顶上）
  D.commit({ st: { ...D.st, input: { ...D.st.input, inputAuto: d.pad.auto, inputFifths: d.pad.fifths, inputScale: d.pad.scale, unit: Math.max(0, PAD_UNITS.indexOf(d.pad.unit)), tuplet: d.pad.tuplet } } }, { silent: true, undo: false });   // 视图态 / 输入态：只换真相，不重画（调用方自己画）
  partView.clear(); for (const [id, p] of Object.entries(d.parts)) partView.set(id, { ...freshPartView(), ...p });
  if (d.paper && d.paper !== D.st.at.paper) {
    const paper = D.st.song.papers.find((p) => p.id === d.paper), part = paper?.tracks[D.st.at.part] ? D.st.at.part : D.st.song.parts.find((p) => paper?.tracks[p.id])?.id;
    if (paper && part) D.commit({ st: setFocus(D.st, paper.id, part) }, { silent: true, undo: false });
  }
}
/** 放下手里的歌——**只有这一个收尾点**：进歌库（歌库宿主的 onOpened）、打开另一首、新建（都走 loadDoc）都经过这里。
 *  规矩（施工单第五节 2026-11-12，user「首先是你退回图库的时候，播放应该停掉吧」）：以后编辑器里加任何会自己继续的东西（出声的、后台算的），都在这里登记怎么收，不在别处各写各的。
 *  现在登记的：走带（在放 / 在准备 = 停，同按停、尾巴自然收；小月相正在唱的那句取消、不留预唱）；按着没松的试听音（松开）。 */
function putDownSong(): void { stopPlay({ prewarm: false }); sound.allOff(); }
/** 新建一首（三处「新歌」+ 一笔没动的空白歌跟着习惯重建，同一个构造、同一个载入口；第 21 条）：按模板把乐手写进去（第 16 条）、「跟着」的那几项写成这一刻的值。
 *  pendingFolder = 歌库里新建（首笔安家）；rebuild = 重建开着的那首空白歌：文件名不换、开着的面板不关（设置里改习惯时设置面板还开着）。 */
function loadNewSong(pendingFolder: string | null, rebuild?: { stem: string }): void {
  const song = bornSong(initState().song);
  loadDoc(song, { home: { kind: "none", pendingFolder }, stem: rebuild?.stem ?? defaultStem(), named: false, extras: templateExtras(song), isNew: true, ...(rebuild ? { keepPanels: true } : {}) });
}
function loadDoc(song: Song, o: { home: Home; stem: string; named: boolean; extras: Extras; view?: unknown; references?: Record<string, Uint8Array>; keepPanels?: boolean; isNew?: boolean }): void {
  perfApi.mixBypass = false; busMuted.clear();   // 效果全关 / 混音轨静音是这次听的，换歌复位
  putDownSong();   // 打开另一首 / 新建 = 先放下手里的这一首（只有这一个收尾点）
  loadingDoc = true;   // 整份装入不归修改锁管；装入期间锁态的变化先不动界面（下面 applyWorkspace 一次摆好）
  try { loadDocInner(song, o); } finally { loadingDoc = false; }
  lock.refresh(); lockDoor.sync(); applyWorkspace();   // 这首歌的锁态（歌库里的 = 库说了算；硬盘文件 = 这一次打开默认锁着）
}
function loadDocInner(song: Song, o: { home: Home; stem: string; named: boolean; extras: Extras; view?: unknown; references?: Record<string, Uint8Array>; keepPanels?: boolean; isNew?: boolean }): void {
  if (impro) setImpro(false);
  foldTold.gone.clear(); foldTold.added.clear();   // 「改到 / 写上了没显示的记号」每次打开各说一次（7-G）
  if (!o.keepPanels) { ui.close(); closeInstPage(); }   // 重建空白歌（第 21 条）不关：人正在设置里改习惯
  H.load(o.home, { stem: o.stem, named: o.named }); coverTouched = false;   // 换家（歌库 → 别处 = 放下 es 的身份；指针 / store 的「谁开着」在 onHome 里）
  const st0 = initState(song);   // 开歌不补、不理顺（第 16 条：开文件时不顺手改；人改谱时每张纸开头补力度照旧，见 update()）
  startDynsMissing = ensureStartDyns(st0.song, st0.nextId).added.length; startDynsTold = false;   // 只数，不改
  encodedSnap = null;   // 换了一份文档：还在路上的那一轮保存取的快照是上一份的，不许落到这份头上（见 es 的 onSaved）
  D.load(st0, o.extras, o.isNew ? "new" : undefined);   // 换歌 / 云端覆盖重载 = 另一首的历史；基线 = 打开的样子；isNew 只有 loadNewSong 给（别的装入 = 打开的，改习惯不碰）
  const d = o.view ? unserializeDesk(o.view) : freshDesk();
  applyDesk(d);
  // 打开 = 上次存时的模式；谱里已经有音 = 键盘先收着，点一下才开（v0.10.21；user「打开时记住上次的模式，成品曲不应该老是跳到音符输入，容易误触」「或者默认键盘是关的，点一下才会开。」）。空的新歌照旧开着键盘
  ws.mode = d.mode; if (d.mode !== "listen") lastEditMode = d.mode;
  if (touchLike) ws.collapsed = D.st.song.papers.some((pp) => Object.values(pp.tracks).some((t) => t.some((x) => x.kind === "note")));  ws.aside = false;   // 鼠标键盘范式：开歌不动键盘（v0.16.89）
  applyWorkspace();
  void refHost.apply(o.references ?? {}, d.ref);   // 参考窗：歌里的卡 + 窗记在哪（新歌 = 空、收着）   // 视图态 + pad 的状态（1= / 调式 / 时值 / 连音 / 音域）随歌回来（没有 = 默认，同 WeebPaint）；改它们不标脏、不进 undo
  pad.setRangeLow(d.pad.low);
  onSongSwitch(); sound.allOff(); void prepareBank(); refreshIssues();   // 开歌那一刻清单重算：有事 = 一条 toast + 角标（§2.2½ 出口 ③）   // 换歌 = 录音房里的块全放掉、排着的不唱了、正在唱的也取消、上一首的计划清空（W-37：旧请求回来才不会被当成这首的报出来）、上一首撑大的堆还回去
  view.forgetPin(); view.render(); pad.render(); renderTitle(); updateChrome();   // 换歌不钉正在写的那一行（防抖只管同一首歌里写）；挂签的两个下拉跟着这首歌（v0.10.10 修：开机直接恢复上次那首时下拉没刷，要切一下模式才出来——user「ctrl shift r的时候模式栏只能看到模式切换，看不到下拉框」）
  if (D.st.song.parts.some((p) => performerOf(activeInstrument(D.extras, p.role)?.engine)?.sound === "chunks")) void singer.warm(models.bases(), BUDGET.speechDisk);   // 歌里有月读 = 意图：引擎立刻起（PC 热启动 ≈ 1.5 s，藏在看谱的那几秒里）
  schedulePrewarm();   // 打开歌就预热（引擎起来 + 光标附近先唱）：第一次点播放不用等十秒（user 2026-10-10「为什么第三刀之后第一次点播放还是要等月读一段时间，pc上大概有十秒」）
}
/** 改过没存时先问一句（应用内面板，不用系统弹窗）。 */
function confirmDiscard(what: string): Promise<boolean> {
  if (!dirty()) return Promise.resolve(true);
  return new Promise((resolve) => {
    ui.close();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">${_t("「{p}」改过还没存", { p: esc(docName()) })}</div><div class="offer-msg">${_t("{what}会丢掉这些改动。", { what })}</div>` +
      `<div class="offer-btns"><button class="btn" data-v="save">${_t("先存")}</button><button class="btn" data-v="go">${_t("丢掉，继续")}</button><button class="btn primary" data-v="no">${_t("算了")}</button></div></div>`;
    document.body.append(box);
    const dismiss = () => close(false), close = (ok: boolean) => { box.remove(); ui.closed(dismiss); resolve(ok); };
    ui.open({ k: "sheet", close: dismiss });
    box.addEventListener("click", (e) => {
      const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
      if (e.target === box || v === "no") close(false);
      else if (v === "go") close(true);
      else if (v === "save") { close(false); void fileSave(); }
    });
  });
}
async function fileNew(): Promise<void> {
  if (hasStore()) { await newStoreSong(); return; }   // 进过歌库 = 新歌生在歌库里
  if (!(await H.leave(_t("新建")))) return;
  loadNewSong(null);   // 新歌 = 按模板把乐手写进去（第 16 条）
  info(_t("新的一首"));
}
async function fileOpen(): Promise<void> {
  if (!(await H.leave(_t("打开别的歌")))) return;
  let picked: docFile.Picked | null;
  try { picked = await docFile.pickOpen(); } catch (e) { showError(_t("没打开：{Error}", { Error: (e as Error).message })); return; }
  if (picked) openPicked(picked);
}
/** 拿到的文件（选的 / 拖进来的 / 双击打开的）→ 读进来。别的软件存的谱、或有读不进来的东西：不认它的家（存回去会把没读进来的丢掉 → 第一次「存」= 问存到哪）。 */
function openPicked(picked: docFile.Picked, from?: string): boolean {
  try {
    const o = openBytes(picked.name, picked.bytes), own = o.ours && !o.notices.length;
    loadDoc(songOfOpened(o), { home: own && picked.handle ? { kind: "file", handle: picked.handle, mtime: picked.mtime } : { kind: "none", pendingFolder: null }, stem: o.stem, named: true, extras: o.extras, view: o.view, references: o.references });
    if (o.notices.length) showError(o.notices.join(" ")); if (o.advice.length) info(o.advice.join(" "));
    else info(from ? _t("从 {host} 打开了 {name}：这是一份拷贝，想留下来就按「存」。", { host: from, name: picked.name }) : _t("打开了 {name}", { name: picked.name }));
    return true;
  } catch (e) { showError(_t("打不开 {name}：{Error}", { name: picked.name, Error: (e as Error).message })); return false; }
}
/** 从链接打开（`?file=<链接>`；src/sources/link.ts；user 11-11「先支持裸链接。能支持几家就几家」，愿望单 W-56）。
 *  先问一句、人点了「打开」才发请求（读的是别人放在网上的文件）；拿回来的走和「打开别人发来的文件」同一条路（openPicked → openBytes 那几道检查），
 *  没有家 = 一份拷贝（改了碰不到链接那头的原件；想留 = 按「存」进歌库 / 存到本机）。 */
async function openFromLink(raw: string): Promise<void> {
  const plan = planLink(raw);
  if ("error" in plan) { showError(plan.error); return; }
  const ok = await askSheet(_t("从链接打开这首歌？"),
    _t("会从 {host} 下载这个文件：{url}。这是别人放在网上的文件；打开的是一份拷贝，想留下来就按「存」。", { host: plan.host, url: plan.shown }), _t("打开"));
  if (!ok) return;
  if (!(await H.leave(_t("打开链接里的歌")))) return;
  diagNote("link", `open ${plan.via} ${plan.host}`);
  let bytes: Uint8Array;
  try {
    progress(_t("正在从 {host} 下载…", { host: plan.host }));
    bytes = await fetchLink(plan, { onProgress: (got, total) => { if (total) progress(_t("正在从 {host} 下载… {pc}%", { host: plan.host, pc: String(Math.round((got / total) * 100)) })); } });
  } catch (e) { showError((e as Error).message); return; }
  finally { progress(""); }
  const kind = sniff(bytes);
  if (kind === "html") { showError(_t("{host} 给的是一个网页，不是歌文件：要用能直接下载的链接（网盘的分享页多半要换成「下载」那个链接）。", { host: plan.host })); return; }
  if (kind === "other") { showError(_t("从 {host} 拿到的不是歌文件（.mxl / .musicxml）。", { host: plan.host })); return; }
  if (openPicked({ name: fileNameFor(plan, kind), bytes, handle: null, mtime: null }, plan.host)) gallery?.close();
}
/** 封面的腰封 = 作者栏第一行（每次存重写，withPngText 先删旧块）；没有封面图就没有封面 entry。 */
const extrasForSave = (base: Extras = D.extras): Extras => (base.thumbnail ? withThumbnail(base, coverWithBlurb(base.thumbnail, (D.st.song.credits ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? null)) : base);
/** 自动存 / 存的编码口：worker 里 saveMxl（大歌 20–60 ms 不再占主线程；2026-10-21 音游级延迟那一刀）。导出 / PDF 那些同步要字节的照旧 bytesNow()。 */
const encoder = createEncoder(() => threadUrls("encode-worker")[0] ?? null, (why) => diagNote("encode", why));
/** 这首歌的 .mxl 字节；extras = 换一份休息室 / 音源来存（导出「打包音源」的副本：只改那一份，不改正本）。 */
const bytesNow = (extras?: Extras, song: Song = D.st.song) => saveMxl({ ...saveArgs(extras, song), references: refHost.files() });
/** saveMxl 要的那一份（指纹也按它算，不带参考窗——参考窗不进指纹）。core = 渲染核心的版本 + 哈希（每次保存都记）。 */
const saveArgs = (extras?: Extras, song: Song = D.st.song) => ({ view: serializeDesk(deskNow()) as unknown as Record<string, unknown>, song, extras: extrasForSave(extras), app: APP_VERSION, date: new Date().toISOString(), core: coreInfo() });
const mp3SizeText = (n: number) => (n < 1e6 ? `${Math.round(n / 1e3)} KB` : `${(n / 1e6).toFixed(1)} MB`);   // song = 换一份歌来存（导出副本：许可冲突时按未声明写）
const mxlFile = (name: string, extras?: Extras, song?: Song) => new File([bytesNow(extras, song) as unknown as BlobPart], name, { type: "application/vnd.recordare.musicxml" });
/** 存 = 回家，一个动作（WeebPaint 一画一家；user 2026-08-25 grill「保存按钮=回家（单一动作），导出 hub=寄明信片」）：
 *  · 有家（打开的那个文件）= 存回去。写之前对一次 mtime，文件在外面被改过就先问（0819 spec §7「原位写回前查 lastModified」）。
 *  · 还没有家 = 安家：桌面 Chromium 先开系统保存框（在手势里；取消 = 到此为止，不降级弹下载——「AbortError ≠ 环境不支持」），再编码、写、认领句柄。
 *  · iPad / Safari 没有句柄这回事 = 下载或分享一个 .mxl 到「文件」里，点了才算存了。这台设备上下载就是存（没有别的家可回；
 *    WeebPaint 的「下载不清 dirty」是因为它 iPad 的家在图库——这里没有，「•」留着只会狼来了，0819 §7.2「有真正会丢的字节才拦」）。
 *  三种家 × 存 的分支在 src/app/home.ts `H.save()`（2026-10-21 起），这里只把结果翻成人话；歌库那条 = smartSaveStore（H 的 gallery.save 口）。等着安家的空谱：有笔先安家再走歌库的存，没笔诚实回话。 */
/** 锁着却有内容改动要存（不该发生：前面几层都没拦住，或者别的标签页把它锁上了）：响亮说，并且说清改动还在。 */
const LOCKED_DIRTY = (): string => _t("这首歌锁着，有改动没存、也不会推上云：改动还在，点谱上面的「接着改」之后再存。");
async function fileSave(): Promise<void> {
  try {
    const r = await H.save();
    switch (r.k) {
      case "blank": info(_t("还是空的，没什么可存")); return;   // WeebPaint blankNothingToSave
      case "gallery": case "offered": return;
      case "written": info(_t("存好了：{name}", { name: r.name })); return;
      case "locked": if (D.dirtyKind() === "content") showError(LOCKED_DIRTY()); else lock.flash(); return;
      case "declined": info(_t("没存")); return;
      case "cancelled": info(_t("没存（取消了）")); return;
      default: return assertNever(r);
    }
  } catch (e) { showError(_t("没存上：{Error}", { Error: (e as Error).message })); }
}
/** 导出 hub 的「存一份 .mxl 副本」= 原来的另存为（user 2026-08-20「另存为也变成导出」「复制一份就是导出的语义…放在导出的选项里面」）：
 *  一份带时刻戳的拷贝，家不变、「•」不变（导出永不清 dirty）。桌面 = 系统保存框；iPad = 下载 / 分享。
 *  packed = 打包音源的副本（user 2026-10-08「导出的时候可以选导出packed版本的」）：只这一份把弱引用的声音装进去，正本照旧（导出 = 寄明信片）。
 *  好了的面板里带署名（折叠）。许可和月读条款可能冲突 = 这一份副本的 <rights> 按未声明写（user「不block导出mp3和工程文件。而只是回到未声明」），正本不动。 */
async function exportCopyMxl(packed = false): Promise<void> {
  const name = `${stampedCopy(docName())}${packed ? "-packed" : ""}.mxl`;
  try {
    let extras = D.extras;
    if (packed) {
      const { got, missing } = await gatherSubsets(extras);
      extras = withPacked(extras, (sha) => got.get(sha)).extras;
      if (missing.length) showError(_t("这几件找不到声音，副本里没带：{p}。点谱前面的声部名，在「谁来演」里「找文件…」，再导出一次。", { p: missing.join("、") }));
    }
    const roles = soundingRoles(), { rights, fellBack } = exportRights(roles);
    const song: Song = fellBack ? (({ rights: _r, ...rest }) => rest)(D.st.song) : D.st.song;
    const credits = (fellBack ? `<div class="offer-msg">${_t("许可这一份按「未声明」写了（你选的许可和小月相的条款可能冲突；作者栏里的选择没动）。")}</div>` : "") +
      creditsBlock(creditsOf(roles, rights).lines, _t("署名")) + creditsBlock(packedLicenses(extras), _t("打包分发的许可（这份副本里带着这些源文件）"));
    if (docFile.canPickSave()) {
      const h = await docFile.pickSave(name); if (!h) return;
      await docFile.writeTo(h, bytesNow(extras, song)); info(_t("存了一份：{name}{fellBack}", { name: h.name, fellBack: fellBack ? _t("（许可按未声明写）") : "" })); return;
    }
    const file = mxlFile(name, extras, song);
    offerFile(file, packed ? _t("存一份 .mxl 副本（打包音源）") : _t("存一份 .mxl 副本"), _t("{name} · {size}。现在这首歌的一份拷贝；这里再改，它不会跟着变。{credits}", { name: esc(file.name), size: sizeText(file.size), credits }));
  } catch (e) { showError(_t("没存上：{Error}", { Error: (e as Error).message })); }
}
// ── 音源打包 / 解包（Blender 式；2026-10-08 by Claude Opus 5.5；user「类似blender，可以pack all packable resources或者unpack all…不过月读不能pack吧，pack了也很难跑起来」）──
//   只动字节（embedded），sha256 / origin 不碰（project.ts withPacked / withUnpacked）；月读 / 元音版不在其列（家族模型包 / app 随带的表，歌里只钉哈希）。
/** 把歌里还没打包的 SoundFont 子集找齐：解析链同出声（本次 → 设备缓存 → 音源库下载 → 都没有 = 列进 missing）。 */
async function gatherSubsets(extras: Extras): Promise<{ got: Map<string, Uint8Array>; missing: string[] }> {
  const got = new Map<string, Uint8Array>(), missing: string[] = [], seen = new Set<string>();
  for (const role of Object.keys(extras.lounge)) for (const g of gmCandidates(extras, role)) {
    if (g.bytes || seen.has(g.subsetSha256)) continue;
    seen.add(g.subsetSha256);
    try { got.set(g.subsetSha256, await sources.resolveGmBytes({ ...g, path: null })); } catch { missing.push(g.name); }   // path: null = 强引用但文件里少了那块的，也去找一次
  }
  return { got, missing };
}
async function packAll(): Promise<void> {
  const { got, missing } = await gatherSubsets(D.extras);
  const r = withPacked(D.extras, (sha) => got.get(sha));
  if (r.packed.length) {
    updateExtras(r.extras, { kind: "lounge", label: _t("打包了 {n} 件声音", { n: r.packed.length }) });
    const size = Object.values(D.extras.sounds).reduce((n, b) => n + b.length, 0);
    info(_t("打包了 {n} 件声音进歌：现在歌里带着 {size}{embedSoftLimit}，发给别人也能响", { n: r.packed.length, size: sizeText(size), embedSoftLimit: size > embedSoftLimit ? _t("（超过 {embedSoftLimit}：存 / 同步会慢一点）", { embedSoftLimit: sizeText(embedSoftLimit) }) : "" }));
  }
  if (missing.length) showError(_t("这几件找不到声音，没打包：{p}。点谱前面的声部名，在「谁来演」里「找文件…」。", { p: missing.join("、") }));
  if (!r.packed.length && !missing.length) info(_t("没有要打包的（小月相 / 元音版不打包：它们是模型包，歌里只钉哈希）"));
}
async function unpackAll(): Promise<void> {
  // 先把字节留到设备上；留不住、家族音源库里又没有的不解（解了就找不回来——数据安全优先，明说）
  const bytesBySha = new Map<string, Uint8Array>();
  for (const role of Object.keys(D.extras.lounge)) for (const g of gmCandidates(D.extras, role)) if (g.bytes) bytesBySha.set(g.subsetSha256, g.bytes);
  const uses = soundUses(D.extras).filter((u) => u.packed && bytesBySha.has(u.subsetSha256));
  if (!uses.length) { info(_t("歌里没有打包着的声音")); return; }
  const ok = new Set<string>(), stuck: string[] = [];
  for (const u of uses) {
    const b = bytesBySha.get(u.subsetSha256)!;
    sources.session.keep(u.subsetSha256, b);
    await rememberSound(u.subsetSha256, b, true);
    if (u.origin.library || (await isSoundPersisted(u.subsetSha256))) ok.add(u.subsetSha256); else stuck.push(u.names.join("、"));
  }
  const r = withUnpacked(D.extras, (sha) => ok.has(sha));
  if (r.removed.size) {
    updateExtras(r.extras, { kind: "lounge", label: _t("解包了 {size} 件声音", { size: r.removed.size }) });
    info(_t("解包了 {size} 件：歌里只记来源（小了 {n}）；这台设备上留着，照样能响。别的设备上从家族音源库或原文件找", { size: r.removed.size, n: sizeText([...r.removed.values()].reduce((n, b) => n + b.length, 0)) }));
  }
  if (stuck.length) showError(_t("这几件没解包：{p}——这台设备留不住它的声音（空间不够，或浏览器不让存），家族音源库里也没有，解了就找不回来。", { p: stuck.join("；") }));
}
/** 署名推演的一块（文件菜单 / 导出好了的面板里；src/format/credits.ts）：空 = 不画。「复制署名」由下面那个全局监听接。 */
/** 署名一块：**折叠着**，点开才看（user 2026-10-08「只有用户自己关心协议的时候才提出这些」——不推到眼前）。 */
function creditsBlock(lines: CreditLine[], title: string): string {
  if (!lines.length) return "";
  return `<details class="credits-box"><summary class="part-sec">${esc(title)}</summary><pre class="credits-pre">${esc(creditsText(lines))}</pre>` +
    `<button class="btn" data-copy-credits title="${_t("复制下来贴进作品说明")}">${_t("复制署名")}</button></details>`;
}
document.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-copy-credits]"); if (!b) return;
  e.stopPropagation();
  const text = b.parentElement?.querySelector(".credits-pre")?.textContent ?? "";
  void navigator.clipboard?.writeText(text).then(() => info(_t("署名复制好了")), () => showError(_t("复制不了（浏览器不让）：长按上面的字自己选")));
}, true);
/** 导出 hub（照 WeebPaint「导出与另存」hub：导出 = 寄明信片，和「存 = 回家」分开住）：歌声 mp3 / .mxl 副本；乐谱 PDF 以后也进这里。 */
function openExportHub(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${_t("导出")}</div>` +
    `<div class="set-row file-row">` +
    `<button class="btn" data-v="mp3" title="${_t("渲一遍，编成 mp3，分享或下载；渲好的那份记在这台设备上，歌库里这首歌的封面上能直接听")}"><svg class="ico"><use href="#export"/></svg>${_t("歌声（mp3）…")}</button>` +
    `<button class="btn" data-v="pdf" title="${_t("印出来的谱（按这首歌的纸张分页；歌词用嵌进去的字体，能选中复制）")}"><svg class="ico"><use href="#export"/></svg>${_t("乐谱（PDF）…")}</button>` +
    `<button class="btn" data-v="mxl" title="${_t("现在这首歌的一份拷贝（文件名带时刻）；这里的歌还住原来的家")}"><svg class="ico"><use href="#save-as"/></svg>${_t("存一份 .mxl 副本…")}</button>` +
    (soundUses(D.extras).some((u) => !u.packed) ? `<button class="btn" data-v="mxlPacked" title="${_t("副本里把乐器的声音也装进去（发给别人也能响）；这里的歌照旧只记来源")}"><svg class="ico"><use href="#save-as"/></svg>${_t("存一份 .mxl 副本（打包音源）…")}</button>` : "") + `</div>` +
    `<div class="offer-msg">${_t("导出 = 寄一份出去，这里的歌还是原来那个家，「存」才是存回去。")}</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">${_t("好")}</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    close();
    if (v === "mp3") openMp3Panel(); else if (v === "pdf") openPdfPanel(); else if (v === "mxl") void exportCopyMxl(); else if (v === "mxlPacked") void exportCopyMxl(true);
  });
}
/** 乐谱 PDF 的面板（2026-10-09 Opus 5.5）：印哪些 → 生成 → 分享 / 下载（同 mp3）。字体一律思源黑体（拼音字体 2026-11-12 退役，7-J；
 *  user「现在有没有人真的在用带拼音的导出。 no, 我也建议先sunset，以后需要卡通字形另外想办法」）；字体点了才下（约 6 MB，第一次），用完就放掉。 */
function openPdfPanel(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  // 印哪些（2026-10-09，user「只印一段或一个声部 这个也到时候需要做，和wxhw差不多，在只显示一个声部的时候你可以选」；照 WXHW 导出面板的「范围」段选，用不上的不露）：
  //   纸 = 整首 / 这一段（默认跟现在的视图：本段 = 这一段）；声部（有隐藏的才露）= 照分页预览（隐藏的空着位置）/ 只排看得见的（重排、不留空位 = 分谱）
  const curPaper = D.st.song.papers.find((p) => p.id === D.st.at.paper) ?? D.st.song.papers[0]!;
  let paperPick: "all" | "one" = viewScope === "segment" && D.st.song.papers.length > 1 ? "one" : "all", partPick: "view" | "shown" = "view";
  const someHidden = D.st.song.parts.some((p) => !isShown(p.id)), shownNames = labelsNow().filter((_, k) => isShown(D.st.song.parts[k].id));
  const draw = () => {
    const pick = (v: string, on: boolean, label: string, note: string) => `<button class="btn cand${on ? " is-on" : ""}" data-v="${v}" title="${esc(note)}">${esc(label)}</button>`;
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${_t("乐谱（PDF）")}</div>` +
      (D.st.song.papers.length > 1 ? `<div class="part-sec">${_t("印哪些")}</div><div class="set-row">${pick("paper:all", paperPick === "all", _t("整首"), _t("每张纸按顺序接着排（= 分页 + 「全部」）"))}${pick("paper:one", paperPick === "one", _t("这一段「{p}」", { p: curPaper.name || _t("这张纸") }), _t("只印光标所在的这张纸（= 分页 + 「本段」）"))}</div>` : "") +
      (someHidden ? `<div class="part-sec">${_t("声部")}</div><div class="set-row">${pick("parts:view", partPick === "view", _t("照分页预览"), _t("隐藏的声部不印，预览里那条细行的位置空着（和预览一样）"))}${pick("parts:shown", partPick === "shown", _t("只排看得见的：{p}", { p: shownNames.join("、") }), _t("隐藏的声部整个拿掉、重新排，不留空位（像抽出来的分谱；和分页预览不一样）"))}</div>` : "") +
      // 用哪种语言印（12-4：「导出乐谱的面板写明会用哪种语言印，旁边能直接改」；改的是歌里「谱上的字」那一项，和页面设置「版面」页同一个）
      `<div class="set-row pdf-lang"><span>${_t("谱上的字用")}</span>${dropdownHtml(textLangItems().map(([value, label]) => ({ value, label })), lookOf(D.st.song, lookCtx()).textLang, { cls: "hp-sel set-sel", attrs: `data-pd="tl" title="${esc(TEXT_LANG_HELP())}"` })}</div>` +
      `<div class="offer-msg">${_t("第一次要下载字体（思源黑体，约 {p} MB），之后离线也能用。纸张 = 这首歌的纸（页面设置里改）。", { p: PDF_FONT_MB })}</div>` +
      `<div class="offer-msg">${partPick === "shown" ? _t("只排看得见的声部（{p}）：重新排、不留空位——和分页预览不一样。", { p: esc(shownNames.join("、")) }) : _t("印出来的 = 页面设置里「分页」+ 曲段控件「{p}」看到的样子，去掉按钮和提示；隐藏的{p2}声部不印（预览里那条细行的位置空着）。", { p: paperPick === "one" ? _t("本段") : _t("全部"), p2: paperPick === "one" ? "" : _t("纸 / ") })}</div>` +
      ((lk) => (lk.viewInC || lk.chordTags || !lk.expressions) ? `<div class="offer-msg">${_t("照这首歌页面设置「看谱」页的设置印：{w}（在那儿改）。", { w: [lk.viewInC ? _t("按 C 调看（每个调号上方印「1=原来的调」）") : "", lk.chordTags ? _t("和弦级数") : "", !lk.expressions ? _t("不印演奏法和表情") : ""].filter(Boolean).join(_t("、")) })}</div>` : "")(lookOf(D.st.song, lookCtx())) +   // 预览什么样印出来就什么样（v0.16.13）：说一声，免得以为是实际的调
      `<div class="offer-btns"><button class="btn" data-v="close">${_t("算了")}</button><button class="btn primary" data-v="go">${_t("生成 PDF")}</button></div></div>`;
    mountDropdowns(box);
  };
  draw(); document.body.append(box);
  box.addEventListener("change", (e) => {   // 谱上的字（进歌、能撤销；锁着也能切 = 修改锁的「看法」，同页面设置那一项）
    const el = e.target as HTMLButtonElement; if (el.dataset.pd !== "tl") return;
    setSongLook(setTextLang(D.st, el.value as TextLang), _t("谱上的字：{l}", { l: textLangItems().find(([x]) => x === el.value)?.[1] ?? el.value })); draw();
  });
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v === "paper:all" || v === "paper:one") { paperPick = v === "paper:all" ? "all" : "one"; draw(); return; }
    if (v === "parts:view" || v === "parts:shown") { partPick = v === "parts:view" ? "view" : "shown"; draw(); return; }
    if (v === "go") { close(); void exportPdf({ ...(paperPick === "one" ? { paper: curPaper.id } : {}), ...(partPick === "shown" ? { onlyShown: true } : {}) }); }
  });
}
/** PDF 印哪些：paper = 只印这一张纸；onlyShown = 只排看得见的声部（隐藏的整个拿掉、重排）。 */
interface PdfPick { paper?: string; onlyShown?: boolean }
let pdfBusy = false;
/** 生成乐谱 PDF = 「全部 + 分页」预览除了控件和提示的样子（2026-10-09 user「…做到除了控件和提示外的wysiwyg」）：整首；隐藏的纸 / 声部不印（预览里那条细行的位置空着），
 *  同一份声部视图、同一把量字的尺子（view.measureAt）、同一个小节线开关。 */
async function makePdf(pick: PdfPick = {}): Promise<{ file: File; r: ReturnType<typeof scorePdf> }> {
    progress(_t("下载字体（第一次约 {p} MB）…", { p: PDF_FONT_MB }));
    const [font, music] = await Promise.all([loadPdfFont(), loadMusicOutlines()]);
    // 声部名和简写按值存在歌里（12-4：概念的谱上叫法 / 简写），不等目录加载
    progress(_t("排版…"));
    const title = D.st.song.title || docName();
    let song = D.st.song, parts = partViews();
    if (pick.onlyShown) {   // 只排看得见的：隐藏的声部（连它在各张纸上的轨）整个拿掉；一个看得见的声部都没有的纸也拿掉
      const keep = new Set(D.st.song.parts.filter((p) => isShown(p.id)).map((p) => p.id));
      song = { ...song, parts: song.parts.filter((p) => keep.has(p.id)), papers: song.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).filter(([k]) => keep.has(k))) })).filter((p) => Object.keys(p.tracks).length || p.id === pick.paper) };
      parts = parts.filter((v) => keep.has(v.id)).map((v, k) => ({ ...v, hidden: false, first: k === 0 }));
    }
    const r = scorePdf({ song, parts, font, music, title, created: new Date(), measure: view.rawMeasure, autoBars, look: lookCtx(), ...(pick.paper ? { onlyPaper: pick.paper } : {}) });
    const paperName = pick.paper ? (D.st.song.papers.find((p) => p.id === pick.paper)?.name || _t("这一段")) : "";
    const stored = labelsNow(), storedOf = new Map(D.st.song.parts.map((p, k) => [p.id, stored[k]!]));   // 文件名用歌里存的名字（谱上按界面语言换的是显示，5½）
    const suffix = [paperName, pick.onlyShown ? parts.map((v) => storedOf.get(v.id) ?? v.name).join("+") : ""].filter(Boolean).map((x) => fileSafe(x)).join("-");
    return { file: new File([r.bytes as unknown as BlobPart], `${stampedCopy(`${docName()}${suffix ? `-${suffix}` : ""}`)}.pdf`, { type: "application/pdf" }), r };   // 名[-曲段 / 声部]-YYYYMMDD-HHMM（v0.9.47）
}
async function exportPdf(pick: PdfPick = {}): Promise<void> {
  if (pdfBusy) return;
  pdfBusy = true;
  try {
    const { file, r } = await makePdf(pick);
    progress("");
    const miss = r.stats.missing.length ? `<div class="offer-msg">${_t("这些字这款字体里没有，PDF 里是空白：{p}{p2}", { p: esc(r.stats.missing.slice(0, 20).join(" ")), p2: r.stats.missing.length > 20 ? " …" : "" })}</div>` : "";
    const missM = r.stats.missingMusic.length ? `<div class="offer-msg">${_t("有 {n} 种记谱符号没画出来（{p}）——这是 app 的毛病，请告诉我们。", { n: r.stats.missingMusic.length, p: esc(r.stats.missingMusic.join(" ")) })}</div>` : "";
    offerFile(file, _t("乐谱 PDF 好了"), _t("{pages} 页 · {p} · {e6}{miss}{missM}", { pages: r.pages, p: _t("黑体"), e6: file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`, miss, missM }));
  } catch (e) {
    progress(""); showError(_t("PDF 生成失败：{Error}", { Error: (e as Error).message }));
  } finally { pdfBusy = false; }
}
/** 现在会出声的声部的角色（预览演出署名用）：出声的（静音 / 独奏照现在的）、整首里有音的；导出 mp3 时按真渲染出了声的算（renderMix 的 roles）。 */
function soundingRoles(): string[] {
  return audibleParts().filter((p) => flattenPart(D.st.song, p.id).tokens.some((t) => t.kind === "note")).map((p) => p.role);
}
/** 文件菜单里「乐器的声音」一节：打包 / 只记来源各几件 + 全部打包 / 全部解包 + 打包分发的许可（文件里带着谁的源文件）。歌里没有 SoundFont 乐器 = 不画。 */
function soundsSection(): string {
  const uses = soundUses(D.extras); if (!uses.length) return "";
  const packed = uses.filter((u) => u.packed), size = packed.reduce((n, u) => n + u.bytes, 0);
  return `<div class="part-sec">${_t("乐器的声音")}</div>` +
    `<div class="offer-msg">${_t("{n} 件：打包在歌里 {n2} 件{length}，只记来源 {n3} 件。打包 = 声音跟着歌走（发给别人也能响，文件变大）；只记来源 = 歌小，声音从这台设备 / 家族音源库 / 你的文件里找。小月相不打包（她是模型包，歌里只钉哈希）。", { n: uses.length, n2: packed.length, length: packed.length ? `（${sizeText(size)}）` : "", n3: uses.length - packed.length })}</div>` +
    `<div class="set-row">${packed.length < uses.length ? `<button class="btn" data-v="pack">${_t("全部打包进歌")}</button>` : ""}${packed.length ? `<button class="btn" data-v="unpack">${_t("全部解包（只记来源）")}</button>` : ""}</div>` +
    creditsBlock(packedLicenses(D.extras), _t("打包分发的许可（文件里带着这些源文件）"));
}
/** 演出署名（文件菜单 / 导出）：用了谁的声音——出了声的声部上场那位，打包 / 弱引用都算；冷板凳、没出声的声部不算（user 2026-10-08 口径）。 */
/** 署名 = 这首歌自己那一条（作者栏 + 用户选的许可；都空 = 没有这条）+ 演出署名；外加只提示不拦的提醒（licenseHints）。导出 mp3 写进 ID3 也用这一份。 */
/** rights = 这一份写的许可（导出时可能回退成未声明：exportRights）；不给 = 歌里选的。 */
function creditsOf(roles: readonly string[], rights: string | undefined = D.st.song.rights): { lines: CreditLine[]; hints: string[] } {
  const perf = performerCredits(D.extras, roles), own = songCreditLine({ ...D.st.song, rights });
  return { lines: own ? [own, ...perf] : perf, hints: licenseHints(rights, perf) };
}
/** 文件菜单里的署名（折叠）；提醒只在用户自己选了许可时才可能出现（licenseHints 要 rights）。 */
const performersBlock = (roles: readonly string[], title = _t("署名")) => {
  const { lines, hints } = creditsOf(roles);
  return creditsBlock(lines, title) + hints.map((h) => `<div class="offer-msg credits-hint">${esc(h)}</div>`).join("");
};
/** 顶栏的菜单（2026-10-08 晚重理，Claude Opus 5.5；user「点了文件名之后弹出的那个菜单也严重obsolete了，三条杠菜单也有obsolete的东西」
 *  「三条杠里面不应该有乐器目录，云端，歌库 录音室，他们的入口在别的地方，文件菜单也不对，和三条杠混淆了，参考下weebpaint和wxhw的菜单设计」）：
 *  - 文件名 = 管理用的把手，点了 = 改名（同 WXHW ADR-0007）；本机文件（有句柄）的名字在文件管理器里改，这里只说一声。
 *  - 三条杠 = 这首歌的低频事务（同 WeebPaint ☰「文件」页）：新建 / 打开本机文件 / 导出 / 存进歌库 / 改文件名 / 封面 / 声音与署名，最后是设置。
 *    存 = 顶栏的 smart save（状态即按钮）；歌库 = 左上角图标；云端 = 歌库里的云朵；录音室 = 走带里的推子；乐器目录 = 乐器页 / 歌库——都不在这里重复。
 *  没有「另存为」（它住导出里，user 2026-08-20「open local file 和 save as 一加多了很多会混淆用户的东西」）。 */
function fileWhere(): string {
  const h = H.home;
  switch (h.kind) {
    case "gallery": if (folderHome()) return _t("在歌库里（文件夹「{label}」），自动存；换歌 / 退出 / 按「存」时写进文件夹", { label: folderHome()!.label }); return _t("在歌库里，自动存{p}", { p: isSignedIn() ? _t("；换歌 / 退出 / 按「存」时推上 OneDrive") : cloudAvailable() ? _t("（没登录，只在这台设备上）") : _t("（只在这个浏览器里；网盘在官网版）") });
    case "file": return _t("存在本机文件 {name}，「存」= 存回去", { name: h.handle.name });
    case "none": return h.pendingFolder != null ? _t("新的一首：第一笔写下去就进歌库") : docFile.canPickSave() ? _t("还没存过：「存」会问存到哪") : _t("这台设备上「存」= 下载或分享一个 .mxl");
    default: return assertNever(h);
  }
}
function clickFileName(): void {
  if (H.home.kind === "file") { info(_t("本机文件的名字在文件管理器里改（现在是 {name}）", { name: H.home.handle.name })); return; }
  void renameActive();
}
$("fileBtn").addEventListener("click", () => clickFileName());
function openMainMenu(): void {
  if (ui.overlay) { ui.close(); return; }   // 再点一下三条杠 = 收起
  const box = document.createElement("div");
  box.className = "track-card ctx-menu main-menu"; box.setAttribute("role", "menu");
  const inStore = H.home.kind === "gallery";
  const item = (v: string, icon: string, label: string, title = "") => `<button class="btn ctx-item" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${icon ? `<svg class="ico"><use href="#${icon}"/></svg>` : `<span class="ico"></span>`}${label}</button>`;
  box.innerHTML =
    `<div class="ctx-head"><b>${esc(H.fileName())}</b><span>${esc(fileWhere())}</span></div>` +
    item("new", "new", _t("新建")) + item("open", "folder-open", _t("打开本机文件…"), _t("打开 .mxl / .musicxml（拖进来也行；Ctrl / ⌘+O）")) +
    item("export", "export", _t("导出…"), _t("mp3、.mxl 副本（打包音源）…（Ctrl / ⌘+Shift+S）")) +
    (inStore ? item("renderHere", "play", _t("渲染到缓存"), _t("渲一遍放进渲染缓存（只在这台设备上）：歌库里这首的封面上能直接听；不导出文件")) : "") +
    (hasStore() && !inStore && !H.pending() ? item("intoLib", "import", _t("存进歌库"), cloudAvailable() ? _t("把这首歌放进歌库（这台设备上留一份；登录后同步到 OneDrive）") : _t("把这首歌放进歌库（只在这个浏览器里留一份；网盘在官网版）")) : "") +
    `<div class="ctx-sep"></div>` +
    (lock.canLockNow() ? item("lockEdit", "lock", _t("锁上（先不改了）"), _t("先把改动存好，再把这首歌锁上：之后打开是只能看、能听的，点「接着改」随时解开")) : "") +   // 修改锁：解着才有；解锁在谱上面那一条
    item("ref", "picture-in-picture", refHost.isOpen() ? _t("收起参考窗") : _t("参考窗{p}", { p: refHost.count() ? _t("（{p} 张）", { p: refHost.count() }) : "" }), _t("截图 / 文字放在旁边对着看：点开后粘贴（Ctrl / ⌘+V）、拖进来，或者「＋」导入；跟着歌一起存")) +
    `<div class="ctx-sep"></div>` +
    `<div class="ctx-ver">${esc(APP_VERSION)}</div>` +   // 版本号小灰字（user 2026-10-08「版本号小灰字放在设置menuitem上面」）
    item("settings", "settings", _t("设置…"), _t("模型 / 音源库来源、缓存、署名与条款、诊断日志、版本"));
  document.body.append(box);
  const r = $("setBtn").getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, m = 8;
  box.style.left = `${Math.max(m, Math.min(r.right - w, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(r.bottom + 6, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !$("setBtn").contains(e.target as Node) && !inDropdownList(e.target)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "new") void fileNew(); else if (v === "open") void fileOpen(); else if (v === "export") openExportHub(); else if (v === "renderHere") void renderHere();
    else if (v === "intoLib") void saveIntoGallery();
    else if (v === "settings") openSettings(); else if (v === "ref") refHost.toggle();   // 改文件名 / 封面 / 声音与署名 13-3 起在纸右上角「这首歌」里
    else if (v === "lockEdit") void lockEditNow();
  });
}
/** 「锁上（先不改了）」（家族修改锁标准：锁上之前先存好，存成了才锁；没存成不锁并说清）。歌库里的歌 = 落盘 + 推（推不上不拦：字节已经在本机，回来再传）→ 图库库的 lockEdit（它自己说「已锁上」）；
 *  硬盘上的单个文件 = 写回去 → 这一次打开的解锁作废。 */
async function lockEditNow(): Promise<void> {
  if (!lock.canLockNow()) return;
  ui.close(); view.lyrics.commitAndClose(); view.marks.commitAndClose();
  try {
    const h = H.home;
    if (h.kind === "gallery") {
      await es.forceSaveAndPush(); renderTitle();
      if (es.isDirty()) { showError(_t("没锁上：改动还没存好（再试一次）。")); return; }
      if (H.identifier() !== h.identifier || !gallery) return;   // 存的时候歌被换走了
      await gallery.lockEdit(h.identifier);
    } else if (h.kind === "file") {
      if (D.dirty()) { const r = await H.save(); if (r.k !== "written") { showError(_t("没锁上：改动没有写回文件。")); return; } }
      if (H.home.kind !== "file" || H.home.handle !== h.handle) return;
      lock.lockLocalFile(); info(_t("锁上了。要改，点谱上面的「接着改」。"));
    }
  } catch (e) { showError(_t("没锁上：{Error}", { Error: (e as Error).message })); }
}
/** 改文件名（只给还没有家的：下次存 / 下载用这个名字；纸上的歌名不变；user「之后各管各的同意，但是要有改文件名的规则？」）。
 *  有家的不进这里（菜单不露）：浏览器改不了磁盘上的名字，在文件管理器里改。 */
function renameFile(): void {
  if (H.home.kind === "file") return;
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">${_t("改文件名")}</div>` +
    `<label class="set-field">${_t("文件名")}<input id="fnIn" type="text" spellcheck="false" autocomplete="off" value="${esc(docName())}" /></label>` +
    `<div class="offer-msg">${_t("只改文件名，纸上的歌名不变。下次存的时候用这个名字。")}</div>` +
    `<div class="offer-btns"><button class="btn" data-v="cancel">${_t("算了")}</button><button class="btn primary" data-v="ok">${_t("改")}</button></div></div>`;
  document.body.append(box);
  const inp = box.querySelector<HTMLInputElement>("#fnIn")!;
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  const ok = () => { const v = inp.value; close(); void H.rename(v).then((r) => { if (r.k === "renamed") info(_t("文件名改成 {stem}{SONG_SUFFIX}", { stem: r.stem, SONG_SUFFIX })); }); };
  ui.open({ k: "sheet", close });
  inp.addEventListener("keydown", (e) => { if (e.isComposing) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ok(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "cancel") close(); else if (v === "ok") ok();
  });
  inp.focus(); inp.select();
}
/** 问一句（应用内面板，不用系统弹窗）：点了 okLabel = true；点背板 / 算了 / Esc = false。 */
function askSheet(title: string, msg: string, okLabel: string, danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    ui.close();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">${esc(title)}</div><div class="offer-msg">${esc(msg)}</div>` +
      `<div class="offer-btns"><button class="btn${danger ? " danger" : ""}" data-v="ok">${esc(okLabel)}</button><button class="btn primary" data-v="no">${_t("算了")}</button></div></div>`;
    document.body.append(box);
    const dismiss = () => close(false), close = (ok: boolean) => { box.remove(); ui.closed(dismiss); scoreEl.focus(); resolve(ok); };
    ui.open({ k: "sheet", close: dismiss });
    box.addEventListener("click", (e) => {
      const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
      if (e.target === box || v === "no") close(false); else if (v === "ok") close(true);
    });
  });
}
// 改过没存就关页面 / 刷新：浏览器自己的挽留框（照 WeebPaint；无地不偷偷写盘——静默写用户文件违背文件语义）
// 退出：挽留框（同 WeebPaint；user 2026-10-08「2 和weebpaint对齐」）——内存里有没落盘的改动就拦一下（对话框内容浏览器自管），歌库里的歌顺手偷存本机
//   （不 await，让对话框立刻起；无地的没地方可以偷偷写）。pagehide / 页面隐藏那两下 editor-session 照样 flush。登录跳转期间不拦。
window.addEventListener("beforeunload", (e) => {
  if (navigatingForAuth || !dirty()) return;
  e.preventDefault(); e.returnValue = "";
  if (H.home.kind === "gallery") void es.flushLocal().catch(() => undefined);
});
// 拖进来打开（.mxl / .musicxml / .xml；桌面 Chromium 还能拿到句柄 = 有家）。⚠ 句柄要在 drop 事件里同步抓（docFile.grabDrop），await 之后 items 就空了。
window.addEventListener("dragover", (e) => { if (e.dataTransfer?.types.includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } });
window.addEventListener("drop", (e) => {
  const gr = e.dataTransfer ? docFile.grabDrop(e.dataTransfer) : null;
  if (!gr) return;   // 不是我们认的文件 = 不拦这次 drop
  e.preventDefault();
  void (async () => {
    if (!(await H.leave(_t("打开「{name}」", { name: gr.file.name })))) return;
    try { openPicked(await docFile.fromGrab(gr)); } catch (err) { showError(_t("没打开：{Error}", { Error: (err as Error).message })); }
  })();
});
// 安装成 PWA 后双击 .mxl 用 MoonSinger 打开（manifest file_handlers → launchQueue；照 WeebPaint consumeLaunchFiles）。
docFile.consumeLaunchFiles((h) => { void (async () => {
  if (!(await H.leave(_t("打开「{name}」", { name: h.name })))) return;
  try { openPicked(await docFile.readHandle(h)); } catch (err) { showError(_t("没打开：{Error}", { Error: (err as Error).message })); }
})(); });

// ── 歌库（v0.6.0，2026-10-08 Claude Fable 5.1）：store（接缝 src/app-store.ts）+ 歌库屏（src/gallery-host.ts）+ WeebPaint 的 editor-session 节律 ───────────
//   家有三种（互斥；src/app/home.ts `H.home`）：歌库里的一首（gallery；自动存 + 推云）/ 本地文件（file；v0.3.0 无地）/ 还没家（none）。
//   歌库是懒的：没进过歌库的设备 = 无地（不开 IDB、不载 MSAL）；点「歌库」= attach（在手势里顺便 requestStoragePersistence）；进过一次以后开局就建。
//   节律（2026-10-08 晚起 = WeebPaint 的 consent 制，user「用weebpaint方案，对付大歌，这不是txt」；常量在 src/config.ts）：改了 2 s 自动落本地（「•」= 还没落）；推云只在换歌 / 退出 / 进歌库 / 按「存」/ 登录后 pushAll；
//   「存」= 立刻落盘 + 推（不脏也动）。冲突 / 报错 / busy 在建 store 时就接好线（src/store-ui.ts；test/store-wiring.test.mjs 守着）。
const KV_LAST_DOC = "last-doc";
const KV_ZOOM = "zoom";   // 谱面缩放（物理倍数；没有 = 自动）——按设备记、不跟账号（2026-10-21 user「缩放跨会话记住，按设备存」「每台屏幕不同」）
let gallery: GalleryHost | null = null;
let encodedFp: string | null = null;   // 最近一轮保存编出来的那份字节里出声内容的指纹（编码 worker 顺手带回）
let encodedSnap: SavedMark | null = null;   // encode 那一刻的快照：落盘成功才把它记成「已存」（快照之后的改动继续算脏）
let coverTouched = false;   // 这次打开里换过封面 → 落盘后让歌库丢掉旧缩略图
const es = createEditorSession({
  // store 0.16.1：zip 种类走 store.zip（有 getPeek）；isZip 由种类表说了算。save 的结果进黑匣子：推没推上、为什么（离线 / 冲突面选了什么）——诊断日志里能看到每一次推。
  store: { file: (name, o) => { const f = requireStore().zip(name, { mode: o.mode }); return { open: () => f.open(), tryMove: (to) => f.tryMove(to), trash: () => f.trash(),
    save: async (bytes, opts0) => { const opts = opts0?.tryPush && !homeOnline() ? { ...opts0, tryPush: false } : opts0;   /* 选了离线 = 一条网都不打：库的 save 只看 tryPush、不看 isOnline（2026-11-04 H4 查出来的，按「存」原来照样走网）；这一笔记成欠一推，回来续传 */ const r = await f.save(bytes, opts); if (opts?.tryPush) diagNote("sync", `push ${name}: ${r.pushed ? "pushed" : "not pushed"}${r.reason ? " " + r.reason : ""}${r.resolution ? " → " + r.resolution : ""}`); return r; } }; } },
  editor: {
    // 这些字节是谁的 = editor-session 说了算（第二个参数）。以前这里读「正在开的那首 ?? 现在开着的那首」两个全局：排队之后 open(B) 可能正等在 A 的保存后面，
    //   那一轮保存里选了「云端覆盖本地」→ 重载装的是 A 的字节，全局却已经指着 B（2026-11-09，Claude Fable 5.1）。
    adopt: async (blob, name) => { adoptStoreBytes(name, new Uint8Array(await blob.arrayBuffer())); },
    onChange: () => { /* 内容变化走 changed()（update() + 1 s 心跳）→ es.markDirty() */ },
    // 编码在 worker 里（src/format/encode-client.ts；2026-10-21）：主线程只克隆一份歌 + 休息室 + 参考窗的文件；worker 没了就在主线程算（同以前）
    //   ⚠ 快照 = 这个函数的同步前缀（editor-session 的钉身份靠它）：encoder.encode() 调用的那一下就把歌 + 休息室 + 参考窗的文件克隆走了；它前面不许有 await。
    //   参考窗里刚加的卡还在编字节 = prepare 里等（editor-session 在记下「存给谁」之前等它）——以前这句 await 在 encode 开头：等的时候换了歌，取到的就是新歌的内容。
    prepare: () => refHost.settled(),
    encode: async () => { encodedSnap = D.savedMark(); const r = await encoder.encode({ ...saveArgs(), references: refHost.files() }); encodedFp = r.fingerprint; return { bytes: new Blob([r.bytes as unknown as BlobPart], { type: "application/vnd.recordare.musicxml" }) }; },
    onRefused: (why) => { showError(why); diagNote("doc", `persist refused: ${why}`); },
    // 修改锁第 ④ 道（歌库这条路）：要存的那个身份锁着 = 一个字节都不写。有改动 / 人按了存才经 onRefused 说一次（改动还在内存里）；只欠一推 = 不走保存（补推归库）
    editLocked: (name) => (lock.identifierLocked(name) ? LOCKED_DIRTY() : null),
    // 「已存」的基线和封面的账只记给还开着的那一首：写盘的那一下歌被放下 / 换走了（name 不是现在这首）= 这份快照是上一首的，不许记到现在这首头上（会把一张没动过的空谱标成改过 → 自己安家进歌库）。
    onSaved: (name) => { const cur = H.identifier() === name; if (cur && encodedSnap) D.adoptSaved(encodedSnap); encodedSnap = null; if (cur && coverTouched) { coverTouched = false; gallery?.invalidateThumb(name); } renderTitle();
      void relinkAfterSave(name, encodedFp);   // 设备上记着的渲好的声音：这次存下去的内容还是那一份 = 按新的文件戳重新挂名；变了 = 摘名
      },
  },
  isZip: true,
  policy: { autosaveMs: LOCAL_SAVE_DEBOUNCE_MS, pushOn: ["exit"] },   // consent 制（同 WeebPaint）：推云只在换歌 / 退出 / 按「存」/ 进歌库；失焦只落本机
});
/** 内容变了（谱 / 休息室 / 麦克风 / 封面）→ 歌库里的歌告诉 editor-session（autosave 节律）；等着安家的空谱有了第一笔 = 首笔安家（H.settle：铸身份 → es 接管 → 落本地）。
 *  幂等；1 s 心跳兜底没经过 update() 的改动（休息室 / 录音室直接改 D.extras 的那些）。 */
function changed(): void { H.noteChanged(); }
// ── 修改锁的门 + 锁态变了之后界面跟着（解锁 / 锁上 / 过期 / 别的标签页改的）──
const lockDoor = initEditLockDoor({
  lock, before: stageEl,
  activeIdentifier: () => H.identifier(),
  unlock: (id) => (gallery ? gallery.unlockEdit(id) : Promise.resolve(false)),
  saveVersionThenUnlock: (id) => (gallery ? gallery.saveVersionThenUnlock(id) : Promise.resolve(false)),
});
lock.onChange((locked) => {
  if (loadingDoc) return;   // 装入中：loadDoc 收尾时一次摆好
  if (locked) { ui.close(); view.lyrics.commitAndClose(); view.marks.commitAndClose(); }   // 锁上了（多半是别的标签页锁的；自己点「锁上」之前菜单已经把框收了）：开着的框收掉——里面还没提交的字这时已经提交不进去（写入口会拒、门闪一下）
  applyWorkspace(); view.render(); pad.render(); drawInst(); ui.redraw(); if (studio.isOpen) studio.show();
  changed(); renderTitle();   // 解锁那一刻：锁着时动过的看法（隐藏了一段）本来就算脏，现在可以存了
  diagNote("doc", `edit lock → ${lock.state()}`);
});
es.start();   // autosave 定时器 + 页面隐藏 / pagehide 落盘 + 失焦推云（editor-session 的通用触发点；不调就没有自动存）
setInterval(() => { changed(); if (H.home.kind === "gallery") renderTitle(); }, 1000);
// （30 s 心跳补推撤了：consent 制，user 2026-10-08「用weebpaint方案」；没上云的在换歌 / 退出 / 按「存」/ 登录后 pushAll 时推）
/** store 字节 → 编辑器（es.open 与 takeCloud 重载共用的装入段）。 */
function adoptStoreBytes(id: string, bytes: Uint8Array): void {
  const o = openBytes(id, bytes);
  loadDoc(songOfOpened(o), { home: { kind: "gallery", identifier: id }, stem: identifiers.parse(id)?.stem ?? o.stem, named: true, extras: o.extras, view: o.view, references: o.references });
  if (o.notices.length) showError(o.notices.join(" ")); if (o.advice.length) info(o.advice.join(" "));
}
const stemOfId = (id: string) => identifiers.parse(id)?.stem ?? id;
/** 打开歌库里的一首。false = 没切过去（本地没字节 / 读不了 / 用户不走）。
 *  2026-10-26 起不再「先推再开」：以前这里无条件 `pushDirtyAll()` 一遍，为的是借推路径的字节比对自愈躲开 open 的假面（上传落了云、回执没回来 → open 只比版本号、
 *  直接弹「打开本地 / 云端覆盖本地」；10-08 user「一直会遇到云端冲突的提示」；e2e sync ③b）。store 2.2.2 把同一条自愈补到了 open 路（大小一样才拉来比、可被「跳过到离线」打断），
 *  批量推这个没问过人的动作就撤了（user 10-26「修」；库 pushAll 的 JSDoc 本来就说别接到这种地方）。真分叉照旧由 open 的冲突面问人。 */
async function openStoreDoc(id: string): Promise<boolean> {
  if (!(await H.leave(_t("打开「{id}」", { id: stemOfId(id) }), { nextIsGallery: true }))) return false;   // 等着安家的有笔先安家；无地 / 本机文件改过没存先问；歌库里的不在这儿推（es.open 切歌前自己先存旧的）
  try {
    const ok = await es.open(id);   // 排在在飞的保存后面；切歌前 es 自己先存旧的（退出语义）；open 里含新鲜度检查 / 冲突面 / 崩溃恢复（store 的 ui）
    if (!ok) { showError(_t("打不开「{id}」：这台设备上没有它的字节（离线、或还没从云端拉下来）", { id: stemOfId(id) })); return false; }
    diagNote("doc", `open ${id}`);
    return true;
  } catch (e) { reportError(e); return false; }
}
/** 在歌库里新建一首：一张空谱、**不落盘**（首笔安家，照 WeebPaint lazyblank；user 2026-10-08「首笔安家做」）——第一笔编辑才铸身份进歌库（H.settle；首存 mode:"new" 撞名不覆盖）。
 *  空着离开 = 零损失、歌库里不留空壳；空谱不算「上次开着的歌」（reload 回歌库）。 */
async function newStoreSong(): Promise<void> {
  attachForUser();
  if (!(await H.leave(_t("新建")))) return;
  const folder = gallery?.currentFolder() ?? "";
  loadNewSong(folder);   // 换家 = 放下旧身份（autosave 绝不能把空谱写进上一首）+ last-doc 清空（reload 回歌库）
  info(_t("新的一首（第一笔写下去就进歌库）"));
}
/** 把手里这首无地的歌放进歌库（文件名沿用；撞名加 -hex4，不加序号——user 2026-10-08「3 weebpaint写handoff和我们对齐」）。 */
async function saveIntoGallery(): Promise<void> {
  attachForUser();
  const r = await H.intoGallery(gallery?.currentFolder() ?? "");   // 等着安家的空谱：有笔就安家，没笔不塞空壳（WeebPaint「未动过的空白不塞进新库」）；落盘报了错 = 身份留着、下一轮 autosave 再试（错已报）
  if (r.k === "blank") info(_t("还是空的：写下第一笔就自动进歌库"));
  else if (r.k === "moved" && r.flushed) info(_t("进歌库了：{stem}{SONG_SUFFIX}", { stem: H.stem, SONG_SUFFIX }));
}
/** 改当前这首的文件名：歌库里的走 store（tryMove：撞名不覆盖、旧名进回收站）；无地的只改下次存的名字。返回新身份（歌库 VerbDoc.renameActive 的契约）。 */
async function renameActive(): Promise<string | null> {
  if (H.home.kind !== "gallery") { renameFile(); return null; }
  const p = identifiers.parse(H.home.identifier); if (!p) return null;
  const v = await openInputSheet(_t("改文件名"), { defaultValue: p.stem, message: _t("只改文件名，纸上的歌名不变。"), okLabel: _t("改") });
  if (v == null) return null;
  try {
    const r = await H.rename(v);
    if (r.k === "taken") { showError(_t("「{v}」已经有了（{p}），没改", { v: fileSafe(v), p: r.where === "cloud" ? _t("云端") : _t("这台设备上") })); return null; }
    if (r.k === "renameCancelled") { info(_t("这次没动")); return null; }   // store 2.2.2：「搬不搬云端旧的」面里选了取消
    if (r.k !== "renamed") return null;
    // store 2.2.2 起谱系不明会先弹面问；oldKept 还为真只剩两种：人选了「留着」（说清是你选的）、或宿主没接回调时的默认（如实说旧的还在）
    info(r.oldKept ? (r.oldKeptByUser ? _t("文件名改成 {stem}{SONG_SUFFIX}；照你的意思，云端旧名那份留着没动", { stem: r.stem, SONG_SUFFIX }) : _t("文件名改成 {stem}{SONG_SUFFIX}（旧名的那份谱系不明，云端原地留着了——歌库里还看得见）", { stem: r.stem, SONG_SUFFIX })) : _t("文件名改成 {stem}{SONG_SUFFIX}", { stem: r.stem, SONG_SUFFIX }));
    return H.identifier();
  } catch (e) { reportError(e); return null; }
}
let authStarted = false, authSettled = false, authUnknown = false, afterSignInInFlight: Promise<void> | null = null;
// ── 闸门：网盘掉登录 / 没网（家族设计稿 ai-docs/20261103-cloud-gate-design.md；状态机 src/cloud-gate.ts，界面 src/app/cloud-gate-ui.ts）──
//   闸门只管网盘这个家：挂了库 ∧ 这台设备的 MSAL 有账号（不新增存储，app-store.ts hasCloudHome）；手里是本机文件 / 家是文件夹 = 和网盘无关、永不闸。itch / 备用版不 startAuth，走不到这里。
const gate = createCloudGate({
  ui: createGateUi({
    dirtyCount: () => requireStore().files.dirty.count(),
    openList: () => { void openGallery().then(() => gallery?.setAttentionOnly(true)); },
    afterRelease: () => { if (!gate.locked() && !isSheetOpen()) scoreEl.focus(); },
  }),
  hasHome: () => hasCloudHome() && H.home.kind !== "file",
  signedIn: () => isSignedIn(),
  renew: async () => {
    if (document.readyState !== "complete") await new Promise((r) => window.addEventListener("load", r, { once: true }));   // 库自己的探测也等 load：load 之前开续签的隐藏 iframe 会吊住 load（库 auth.js 注释）
    return auth.retrySilentSignIn();
  },
  check: async () => {
    const s = await refreshOpenDoc({ gate: true });
    if (s && s !== "dirty-skip" && s !== "offline") return s;
    // 这一下库没真去问云端（在歌库里 / 没开歌 / 手里有没落盘的改动）：另问一次，不然云端挂了也会放行（库的探针，「不知道」绝不当没有；只读）
    return (await requireStore().collectionPeek("gate-probe")) === "unknown" ? "cloud-error" : "asked";
  },
  catchUp: () => afterSignIn(),   // 补排队的、快进、回来怎么办（规则书第 15 条：cloud-return.ts）；手里这首照旧等 consent 时刻推（ADR-0016 / 0018）
  reachable: () => cloudReachable(),   // 离线期间再试：续签成功之后还要问云端一次才算回来（设计稿 §3）
  afterPass: () => { void offerReturn(); },   // 一路顺利放行：开局罩着时没问成的这里问
  pageVisible: () => document.visibilityState === "visible",
  signIn: () => signInFlow(),
  note: (line) => diagNote("gate", line),
});
attachGate(gate);
onUserOfflineChange(() => { renderTitle(); gallery?.renderCloud(); });
/** 建 store + 歌库屏（幂等；不碰登录）。第一次要在用户手势里（persist 申请）。 */
function ensureAttached(home: StoreHome = { kind: "cloud" }): void {
  if (!currentPolicy().library) throw new Error(_t("这个部署方式没有歌库（itch：歌只用文件存）"));   // 第二道：入口已经灰了，万一有别的路走到这里也不建库
  if (home.kind === "cloud" && !currentPolicy().cloud) throw new Error(_t("这个部署方式没有网盘（备用版：歌库的家只能是文件夹）"));
  const fresh = !hasStore();
  attachStore(home);
  if (fresh) {
    void requestStoragePersistence(); diagNote("boot", "store attached");
    // 按身份记的东西跟着改名走（store 0.14.0 onRenamed：谁发起的改名 / 挪夹都报）——这里只有「上次开着哪首」
    requireStore().files.onRenamed((from, to) => { if (deviceKvGet(KV_LAST_DOC) === from) deviceKvSet(KV_LAST_DOC, to); void renders.renamed(homeKey(), from, to); });   // 设备上记着的声音的挂名也跟着改名走
  }
  ensureGallery();
}
/** 登录探测（一次）：先建 store（库的报错器在 createStore 时才接上，CatsUp 2026-09-22）、本地恢复完了再调（boot 顺序 = 建 store → 本地恢复 → initAuth）。 */
function startAuth(): void {
  if (authStarted || !currentPolicy().cloud || folderHome()) return;   // 家是文件夹 = 不碰微软；itch / 备用版没有网盘：不 initAuth、不载 MSAL（家族规则书 §2 / §4 第 5 项；app-store 的 auth 也包了一层）
  authStarted = true;
  auth.onAuthChanged((s) => {
    diagNote("auth", `changed signedIn=${String(s.signedIn)} reason=${String((s as { reason?: string }).reason ?? "?")}`);
    const why = (s as { reason?: string }).reason;
    if (s.signedIn) noteCloudAccount(true); else if (why === "signOut") noteCloudAccount(false);
    gate.authChanged(s.signedIn, why);
    gallery?.renderCloud(); renderTitle(); if (s.signedIn) void afterSignIn();
  });
  void auth.initAuth().then((s) => {
    noteCloudAccount(s.signedIn || !!(s as { probing?: boolean }).probing); authSettled = true;
    diagNote("auth", `initAuth signedIn=${s.signedIn} probing=${String(!!(s as { probing?: boolean }).probing)} home=${String(cloudAccountKnown())}`);
    gallery?.renderCloud(); renderTitle();
    void gate.boot();   // 没有家 = 什么都不发生（设计稿 §2）；本机那份已经摆好（boot 顺序 = 建 store → 本地恢复 → 这里）
    if (s.signedIn) void afterSignIn(); else void settleNoHome();
  }).catch((e) => { authSettled = true; authUnknown = true; gallery?.renderCloud(); reportError(e, "warning"); });
}
/** 用户动作进歌库（点「歌库」/ 新建 / 存进歌库）：建 store + 起登录探测。 */
function attachForUser(): void { if (!hasStore()) throw new Error("no library home yet (ensureHome first)"); startAuth(); }
function ensureGallery(): GalleryHost {
  if (gallery) return gallery;
  let padWas = true;
  gallery = initGalleryHost({
    activeIdentifier: () => H.identifier(),
    openAny: (id) => openStoreDoc(id),
    renderInLibrary: (id) => renderInLibrary(id),
    // 打开中的那首被歌库挪了夹：字节已在新身份下 → 先放下旧身份（不然 es.open 的「切歌前先存旧的」会把旧名字写回去复活），再按新身份重开
    setIdentifier: (id) => { H.release(); void openStoreDoc(id); },
    renameActive,
    pushNow: () => es.forceSaveAndPush().then(renderTitle),
    flushLocal: () => (H.home.kind === "gallery" ? es.flushLocal() : Promise.resolve()),
    newSong: async () => { await newStoreSong(); if (H.home.kind === "gallery" || H.pending()) gallery!.close(); },   // 首笔安家：新建出来的空谱还没身份（pendingFolder）也回到谱
    openSettings: () => openSettings(),
    openInstruments: () => openFinder(),   // 歌库开着 = 只弹着玩的目录，盖在歌库上面
    openCloudMenu: () => { void openCloudMenu(); },
    homeBar: () => homeBarNow(),
    homeAction: (v) => homeAction(v),
    homeLabel: () => folderHome()?.label ?? null,
    renders,   // 设备上记着的渲好的声音：封面上的 ▶ 认它的挂名
    openHomeMenu: () => { void openHomeMenu(); },
    onOpened: () => { putDownSong(); ui.close(); closeFinder(false); if (ws.mode === "listen") { ws.mode = lastEditMode; applyWorkspace(); } closeInstPage(); padWas = !padEl.hidden; showPad(false); updateChrome(); },   // 进歌库 = 放下手里的歌：出声的停（putDownSong）、混音台（听）也收
    onClosed: () => { void afterGalleryClosed(); showPad(padWas); updateChrome(); scoreEl.focus(); },
  });
  return gallery;
}
/** 从歌库回来：手里这首要是在歌库里被扔进了回收站（gallery 的删除动词允许删「打开中」的那首，先问过），就不再认那个家——留在内存里当无地稿，绝不自动存回去把它复活。 */
async function afterGalleryClosed(): Promise<void> {
  if (H.home.kind !== "gallery") return;
  try {
    if (await requireStore().files.occupied(H.home.identifier)) return;
    const stem = H.stem; H.release();
    showError(_t("「{stem}」已经进了回收站；手里这份现在没有家了（「存」会问存到哪，或「存进歌库」）。", { stem }));
  } catch (e) { reportError(e, "log"); }
}
/** 进歌库 = 放下手里的歌（gallery-first，同 WeebPaint「进图库 = 关闭当前画作」；user 2026-10-08「7 和weebpaint对齐」）：
 *  歌库里的先落盘 + 推（退出语义）再放下身份；等着安家的空谱有笔先安家；无地的改过没存先问（同「新建」）。歌库没有「回到谱」——出口 = 打开一首 / 新建。 */
async function openGallery(): Promise<void> {
  if (!(await ensureHome())) return;
  attachForUser();
  if (!(await H.leave(_t("进歌库")))) return;
  H.release();
  deviceKvSet(KV_LAST_DOC, null);   // 本机文件 / 无地的稿也一样：进了歌库 = 没有「上次开着的那首」
  renderTitle();
  await gallery!.open();
  void offerMove();
}
// ── 歌库的家（家族规则书 §1 第 13 条「库必须有家：网盘或本地文件夹；没有家 = 文件模式」；工单 H3）──
/** 进歌库之前：有家 = 走；登录探测还没落地 / 旧库里还有歌（「稍后」= 入口不收）= 走；否则先选家。 */
async function ensureHome(): Promise<boolean> {
  if (hasHome()) return true;
  if (hasStore() && (!authSettled || (await legacySongs()).length > 0)) return true;
  return chooseHome();
}
/** 入口：说明一句 + 两个去处（这里用不了的画灰 + 说为什么）。没选 = 还是文件模式，什么都不建。 */
async function chooseHome(): Promise<boolean> {
  const cloud = currentPolicy().cloud, folder = canPickFolder();
  let picking: Promise<GalleryEntry | null> | null = null;
  const v = await openChoiceSheet<"cloud" | "folder">(_t("歌库要先有个家"),
    _t("歌放在浏览器外面、你自己够得着的地方，才不怕浏览器清缓存。{cloud}{folder}不想选也行：「存」= 存成文件，「打开」= 选文件。", { cloud: cloud ? "" : _t("网盘在官网版里（{SITE_HOST}）。", { SITE_HOST }), folder: folder ? "" : _t("这个浏览器选不了文件夹（桌面版 Chrome / Edge 可以）。") }),
    [{ label: _t("连接网盘（OneDrive）"), value: "cloud", primary: cloud, off: !cloud, onPick: redirectToSignIn },
      { label: _t("选一个文件夹"), value: "folder", primary: !cloud && folder, off: !folder, onPick: () => { picking = pickFolderHome(); } }]);
  if (v !== "folder" || !picking) return false;   // 网盘 = 页面已经跳去微软了，回来开局接上
  const entry = await (picking as Promise<GalleryEntry | null>).catch((e) => { reportError(e, "warning"); return null; });
  return entry ? useFolderHome(entry) : false;
}
/** 把这个文件夹挂成家。手里要是旧库的歌，先落盘放下（旧库不动，走搬家）。 */
async function useFolderHome(entry: GalleryEntry): Promise<boolean> {
  if (hasStore()) {
    if (!(await H.leave(_t("换到文件夹")))) return false;
    H.release();
    await disposeStore();
  }
  setFolderOnline(await folderPermission(entry, { request: true }));
  ensureAttached({ kind: "folder", entry });
  forgetLegacyAttach();
  gallery?.noteStoreChanged();
  await touchFolderHome(entry.id).catch((e) => reportError(e, "log"));
  diagNote("home", `folder "${entry.label}" db=${entry.dbId} online=${String(folderOnline())}`);
  gallery?.renderCloud(); renderTitle();
  return true;
}
/** 再授权（**手势里调**）：成了 = 回到在线，把攒着的写进去。 */
async function regrantFolder(): Promise<boolean> {
  const f = folderHome(); if (!f) return false;
  const ok = await folderPermission(f, { request: true });
  setFolderOnline(ok);
  diagNote("home", `regrant "${f.label}" → ${String(ok)}`);
  gallery?.renderCloud(); renderTitle();
  if (!ok) { showError(_t("没拿到「{label}」的权限：改动还存在这台设备上，歌一首没丢。", { label: f.label })); return false; }
  gallery?.refresh();
  void afterSignIn();
  return true;
}
/** 回前台 / 开局：权限还在吗（只 query，绝不弹框）。 */
async function checkFolderPermission(): Promise<void> {
  const f = folderHome(); if (!f) return;
  const ok = await folderPermission(f, { request: false });
  if (ok === folderOnline()) return;
  setFolderOnline(ok);
  gallery?.renderCloud(); renderTitle();
  if (ok) { gallery?.refresh(); void afterSignIn(); }
}
attachFolderLost(() => { if (folderHome() && folderOnline()) { setFolderOnline(false); diagNote("home", "folder permission lost"); gallery?.renderCloud(); renderTitle(); } }, () => folderHome() != null);
/** 顶上那条（一处判定）：文件夹权限掉了 > 还有旧歌没搬 > 没有家的披露（登录探测落地之前不说，不然有账号的人开局闪一下这句假话；有账号但登录过期 = 歌在网盘上有，归闸门和常驻条说）。 */
function homeBarNow(): { text: string; buttons: { v: string; label: string }[] } | null {
  const f = folderHome();
  if (f && !folderOnline()) return { text: _t("文件夹「{label}」的权限掉了：改动先存在这台设备上，歌一首没丢", { label: f.label }), buttons: [{ v: "regrant", label: _t("重新授权") }] };
  if (f && legacyLeft > 0) return { text: _t("这个浏览器里还有 {legacyLeft} 首旧歌，没搬进「{label}」", { legacyLeft, label: f.label }), buttons: [{ v: "move", label: _t("搬进来") }, { v: "export-legacy", label: _t("全部导出") }] };
  if (!f && currentPolicy().cloud && authSettled && !authUnknown && !cloudAccountKnown() && !isSignedIn()) return { text: _t("这些歌只在这台设备的浏览器里，没有备份"), buttons: [...(canPickFolder() ? [{ v: "move", label: _t("搬进一个文件夹") }] : []), { v: "export-all", label: _t("全部导出") }, { v: "connect", label: _t("连接网盘") }] };
  return null;
}
function homeAction(v: string): void {
  if (v === "regrant") void regrantFolder();
  else if (v === "export-all") void exportAllSongs();
  else if (v === "export-legacy") void exportAllSongs({ legacy: true });
  else if (v === "connect") void signInFlow();
  else if (v === "move") {
    if (folderHome()) void moveSongsFlow(folderHome()!);
    else void pickFolderHome().then((e) => (e ? moveSongsFlow(e) : undefined)).catch((e) => reportError(e, "warning"));   // 选夹必须在这一下点击的同步栈里起跳
  }
}
/** 文件夹按钮（家是文件夹时顶替云按钮）。 */
async function openHomeMenu(): Promise<void> {
  const f = folderHome(); if (!f) return;
  const lost = !folderOnline();
  const v = await openChoiceSheet<"regrant" | "refresh" | "leave">(_t("歌库在文件夹「{label}」", { label: f.label }),
    _t("歌就是这个文件夹里的 .mxl，资源管理器里也看得到；回收站 / 备份箱是里面的 .trash / .backup。{lost}", { lost: lost ? _t("\n现在权限掉了：改动先存在这台设备上。") : "" }),
    [...(lost ? [{ label: _t("重新授权"), value: "regrant" as const, primary: true }] : [{ label: _t("刷新"), value: "refresh" as const }]), { label: _t("不用这个文件夹了…"), value: "leave" as const, hint: _t("夹里的歌一首不动；之后可以再选一个家") }]);
  if (v === "regrant") await regrantFolder();
  else if (v === "refresh") { await checkFolderPermission(); gallery?.refresh(); }
  else if (v === "leave") await signOutFlow();
}
// ── 搬家（library-needs-a-home §4 第 3 步；铁律在 move-songs.ts 头注释）──
const KV_MOVE_ASKED = "moveAsked", KV_LEGACY_RETIRED = "legacyRetired";
/** 旧库里还剩几首要搬（顶上那条用；算过一次记着，搬完更新）。 */
let legacyLeft = 0;
/** 一个夹的第一帧（= 本地帧；没登录就只有它）。 */
const firstFrame = (store: Store, folder: string) => new Promise<{ items: { identifier: string; syncState?: string }[]; folders: string[] }>((resolve, reject) => {
  let done = false, off: (() => void) | null = null;
  off = store.files.watchFolder(folder, (snap) => { if (done) return; done = true; off?.(); resolve(snap as never); }, { onError: (e) => { if (!done) { done = true; off?.(); reject(e); } } });
  if (done) off();   // 帧在 watchFolder 返回前就同步来了
});
/** 这个库本地帧里所有的歌（走遍文件夹）。 */
async function localItems(store: Store): Promise<{ identifier: string; syncState?: string }[]> {
  const out: { identifier: string; syncState?: string }[] = [], q = [""];
  while (q.length) { const f = await firstFrame(store, q.shift()!); out.push(...f.items); q.push(...f.folders); }
  return out;
}
async function songsToMoveIn(store: Store): Promise<SongToMove[]> {
  return (await localItems(store)).flatMap((it) => { const kind = moveKindOf(it.syncState); return kind ? [{ identifier: it.identifier, kind }] : []; });
}
/** 只在浏览器里的旧歌。网盘是家 = 同一个库，不用搬；文件夹是家 = 另开一个只读本机的旧库实例看；旧库现在就挂着（没有家）= 看它自己。 */
async function legacySongs(): Promise<SongToMove[]> {
  if (hasCloudHome()) return [];
  if (hasStore() && !folderHome()) return authSettled && !authUnknown ? songsToMoveIn(requireStore()) : [];   // 还不知道有没有账号 = 不说「只在浏览器里」（有账号的人会被假话吓到）
  if (!folderHome() || deviceKvGet(KV_LEGACY_RETIRED) === "1" || !(await legacyLibraryExists())) return [];
  const legacy = openLegacyLibrary();
  try { return await songsToMoveIn(legacy); } finally { await legacy.dispose(); }
}
/** 这一页是开局就挂着旧库起来的（storeAttached / 登录回跳）。只有这条路要在登录探测落地后收拾。 */
let bootedOnStore = false;
/** 登录探测落地、没有账号：没歌 = 不留一个没有家的空库（「没有家不建 store」）；有歌 = 披露条 + 问一次。 */
async function settleNoHome(): Promise<void> {
  if (!bootedOnStore || hasHome() || !hasStore()) return;
  const songs = await legacySongs().catch((e) => { reportError(e, "log"); return null; });
  if (!songs) return;
  legacyLeft = songs.length;
  gallery?.renderCloud();
  if (songs.length) { void offerMove(); return; }
  if (H.home.kind === "gallery" || H.pending()) return;   // 手里正有一首要进这个库（旧路径）：不拆
  gallery?.close();
  await detachStore();
  gallery?.noteStoreChanged();
  renderTitle();
  diagNote("home", "no account, no songs → no library");
}
/** 开机 / 进歌库时问一次（一台设备一次；之后走顶上那条）。 */
let moveOffering = false;
async function offerMove(): Promise<void> {
  if (moveOffering || deviceKvGet(KV_MOVE_ASKED) === "1" && legacyLeft === 0 && !folderHome()) return;
  moveOffering = true;
  try {
    const songs = await legacySongs();
    legacyLeft = songs.length;
    gallery?.renderCloud();
    if (!songs.length) { if (folderHome()) deviceKvSet(KV_LEGACY_RETIRED, "1"); return; }
    if (deviceKvGet(KV_MOVE_ASKED) === "1" || isSheetOpen() || isGateOpen()) return;
    deviceKvSet(KV_MOVE_ASKED, "1");
    const f = folderHome(), n = songs.length;
    let picking: Promise<GalleryEntry | null> | null = null;
    const v = await openChoiceSheet<"move" | "cloud" | "export" | "later">(_t("这个浏览器里有 {n} 首歌", { n }),
      _t("它们只在这个浏览器里，清缓存就没了。{f}稍后也行：歌库顶上那条还在。", { f: f ? _t("搬进「{label}」：逐首核对字节，一模一样才从浏览器移走。", { label: f.label }) : _t("选一个家搬过去；或者先全部导出成文件。") }),
      [f ? { label: _t("搬进「{label}」", { label: f.label }), value: "move", primary: true } : { label: _t("选一个文件夹，搬进去"), value: "move", primary: true, off: !canPickFolder(), onPick: () => { picking = pickFolderHome(); } },
        ...(!f && currentPolicy().cloud ? [{ label: _t("连接网盘"), value: "cloud" as const, onPick: redirectToSignIn }] : []),
        { label: _t("全部导出"), value: "export" }, { label: _t("稍后"), value: "later" }]);
    if (v === "move") {
      const entry = f ?? (picking ? await (picking as Promise<GalleryEntry | null>) : null);
      if (entry) await moveSongsFlow(entry);
    } else if (v === "export") await exportAllSongs({ legacy: !!f });
  } catch (e) { reportError(e, "warning"); }
  finally { moveOffering = false; }
}
/** 搬。这一步 Fable 看 diff：顺序和「两类歌」都在 move-songs.ts，这里只接线：读旧库 / 写新家 / **从夹里真的读回来** / 移进旧库回收站。 */
async function moveSongsFlow(entry: GalleryEntry): Promise<void> {
  if (!folderHome() && !(await useFolderHome(entry))) return;
  if (!folderOnline() && !(await regrantFolder())) return;
  const legacy = openLegacyLibrary();
  let result: Awaited<ReturnType<typeof moveSongs>>;
  try {
    const songs = await songsToMoveIn(legacy);
    result = await withBusy(_t("正在把歌搬进「{label}」…", { label: entry.label }), () => moveSongs(songs, {
      read: async (id) => { const b = await legacy.zip(id, { mode: "existing" }).open(); return b ? new Uint8Array(await b.arrayBuffer()) : null; },
      readBack: (id) => readFromFolder(entry, id),
      write: async (id, bytes) => { const r = await requireStore().zip(id, { mode: "new" }).save(bytes, { tryPush: true, bornLocked: true }); if (r?.pushed !== true) throw new Error(_t("没写进文件夹")); },   // bornLocked：搬进新家的是已有的作品，生来锁着（修改锁标准：导入进库的文件生来锁着），不是在这里新建的
      remove: async (id) => { const t = await legacy.zip(id, { mode: "existing" }).trash(); if (t.status !== "trashed") throw new Error(_t("旧库没移走（{status}）", { status: t.status })); },
      altName: (id) => withStemTail(id, defaultStem().slice(-5), identifiers),   // defaultStem = yyyymmdd-hex4：取「-hex4」
      progress: (done, total) => setBusyText(_t("正在搬歌 {done} / {total}…", { done, total })),
    }));
  } catch (e) { reportError(e); showError(_t("搬家没成：{Error}。浏览器里的歌一首没动。", { Error: (e as Error)?.message ?? e })); return; }
  finally { await legacy.dispose(); }
  const finished = moveFinished(result);
  legacyLeft = finished ? 0 : result.failed.length + result.stuck.length;
  if (finished) deviceKvSet(KV_LEGACY_RETIRED, "1");   // 旧库退役：不再问、不再挂条；移走的在旧库的回收站里（还原出厂才清），连着网盘的还在原处
  diagNote("home", `move: moved=${result.moved.length} copied=${result.copied.length} failed=${result.failed.length} stuck=${result.stuck.length}`);
  const said = moveSay(result, entry.label, stemOfId);
  if (said.bad) showError(said.text); else info(said.text);
  gallery?.refresh(); gallery?.renderCloud();
}
// 歌库画灰的两种情形（家族规则书 §1 第 1 / 6 / 12 条；入口露着、点了说为什么，不白屏、不假装能用）。2026-11-03
//   ① 这个部署方式没有歌库（itch / 备用版：歌没有浏览器外的家；policy.library，Fable 裁定 A2 ④）→ 说「歌库在官网」+「去官网」；
//   ② 存储开局就不可用（Safari 双击打开）= 歌库存不住 → 说一句为什么。
//   ③ 备用版的家只能是文件夹，这个浏览器又选不了（工单 H3）→ 说一句为什么。
const libOff: "site" | "storage" | "nofolder" | null = !currentPolicy().library ? "site" : availability() === "unavailable" ? "storage" : !currentPolicy().cloud && !canPickFolder() ? "nofolder" : null;
if (libOff) { $("libBtn").classList.add("is-off"); $("libBtn").title = libOff === "site" ? SITE_TEXT.libSiteTitle : libOff === "nofolder" ? SITE_TEXT.libNoFolderTitle : SITE_TEXT.libOffTitle; }
$("libBtn").addEventListener("click", () => { if (libOff === "site") { showLibraryOff(); return; } if (libOff) { showError(libOff === "nofolder" ? SITE_TEXT.libNoFolderTitle : SITE_TEXT.libOffTitle); return; } void openGallery(); });
async function openCloudMenu(): Promise<void> {
  const signed = isSignedIn();
  let who = ""; try { const a = auth.getActiveAccount() as { username?: string; name?: string } | null; who = a?.name || a?.username || ""; } catch { /* 没登录 */ }
  // 2026-10-26 user「修」：「把没上云的都推上去」撤——app 侧的方向动词（库 dirty.pushAll 的 JSDoc 明说别接到这种钮上；10-16「冲突只在库的面里三选一」）。没同步好的在歌库「要处理的」里逐首处理。
  const v = await openChoiceSheet<"in" | "out" | "refresh" | "reconnect">(_t("云端（OneDrive）"),
    signed ? _t("已登录{who}。歌库同步到 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹，看不到你别的文件）。", { who: who ? ` ${who}` : "" }) : _t("登录微软个人账号后，歌库同步到 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹，看不到你别的文件）。不登录也能用，歌只在这台设备上。"),
    signed ? [...(isUserOffline() && rawOnline() ? [{ label: GATE_TEXT.reconnect, value: "reconnect" as const, primary: true }] : [{ label: _t("刷新云端"), value: "refresh" as const }]), { label: _t("退出登录"), value: "out" as const, danger: true, hint: _t("歌还留在这台设备上") }] : [{ label: _t("登录微软账号"), value: "in", primary: true }]);
  if (v === "in") await signInFlow();
  else if (v === "out") await signOutFlow();
  else if (v === "refresh") gallery?.refresh();
  else if (v === "reconnect") void gate.reconnect();
}
/** 歌库「全部导出」（家族 library-needs-a-home §4 第 1 步）：整个歌库打一个 zip，文件夹结构跟着走。.mxl 本身就是压缩包，这层不再压。 */
async function exportAllSongs(o: { legacy?: boolean } = {}): Promise<void> {
  const legacy = o.legacy ? openLegacyLibrary() : null;   // 家是文件夹时导出的是还留在浏览器里的旧歌
  try {
    const store = legacy ?? requireStore();
    const now = new Date(), p2 = (n: number) => String(n).padStart(2, "0");
    const name = _t("MoonSinger-歌库-{p}{p2}{p3}-{p4}{p5}.zip", { p: now.getFullYear(), p2: p2(now.getMonth() + 1), p3: p2(now.getDate()), p4: p2(now.getHours()), p5: p2(now.getMinutes()) });
    const r = await withBusy(_t("正在打包歌库…"), () => exportAll({
      listFolder: async (folder) => { const f = await firstFrame(store, folder); return { identifiers: f.items.filter((i) => isCached(i.syncState as never)).map((i) => i.identifier), folders: f.folders }; },   // 第一帧 = 本地帧（没登录就只有它）；这台没字节的不收（不是「只在浏览器里」的）
      bytes: async (id) => { if (!legacy && H.identifier() === id) await es.flushLocal(); return store.zip(id, { mode: "existing" }).open(); },
      pack: async (entries) => new Blob([zipSync(Object.fromEntries(entries.map((e) => [e.path, [e.data, { level: 0 }]])) as never) as Uint8Array<ArrayBuffer>], { type: "application/zip" }),
    }));
    diagNote("gallery", `export-all count=${r.count} failed=${r.failed.length}`);
    const said = exportAllSay(r, name);
    if (r.zip) offerFile(new File([r.zip], name, { type: "application/zip" }), _t("歌库打包好了"), said.text);
    else if (said.bad) showError(said.text); else info(said.text);
    if (r.zip && said.bad) showError(said.text);
  } catch (e) { reportError(e); showError(_t("导出没成：{Error}", { Error: (e as Error)?.message ?? e })); }
  finally { await legacy?.dispose(); }
}
/** 退出登录 = 脏门 + 备份 + 拆库 + 退出（同 WeebPaint disconnectFlow：先绿灯门卸库，后 signOut；user 2026-10-08「4 和weebpaint对齐」）：
 *  还有没上云的 → 问：「先推上去 / 推不上的逐首下载备份」（推完重扫再问，数字会变小）或「照样退出」或算了；
 *  然后放掉 store（这台设备上的歌都还在 IDB 里——再进歌库就接上）、退出微软账号、回到无地的空谱。 */
async function signOutFlow(): Promise<void> {
  const store = requireStore(), f = folderHome();
  for (;;) {
    let n = 0; try { n = await store.files.dirty.count(); } catch (e) { reportError(e, "warning"); }
    if (n === 0) break;
    const v = await openChoiceSheet<"backup" | "force">(f ? _t("还有 {n} 首没写进文件夹", { n }) : _t("还有 {n} 首没上云", { n }), _t("退出后这些改动只在这台设备上。可以先推上去（推不上去的逐首下载备份），或者照样退出。"),
      [{ label: _t("先推上去 / 下载备份"), value: "backup", primary: true }, { label: _t("照样退出"), value: "force", danger: true }]);
    if (v == null) return;
    if (v === "force") break;
    await backupDirty();
  }
  gallery?.close();
  H.release();
  try { await detachStore(); } catch (e) { reportError(e, "warning"); }
  gallery?.noteStoreChanged();
  if (f) await clearFolderHome().catch((e) => reportError(e, "log"));
  else { try { await auth.signOut(); } catch (e) { reportError(e); } }
  loadNewSong(null);   // 新歌 = 按模板把乐手写进去（第 16 条）
  renderTitle(); info(f ? _t("不用「{label}」了：夹里的歌一首没动，再进歌库可以选家", { label: f.label }) : _t("退出了：歌都还在这台设备上，再连上网盘就能接着用"));
}
/** 下载备份：先 pushAll 尽力推（在线时最好的备份就是云）；推不上去的（failed = 错误报告面）逐首下载 .mxl。 */
async function backupDirty(): Promise<void> {
  const store = requireStore();
  let failed: string[] = [];
  try { failed = (await store.files.dirty.pushAll()).failed; } catch (e) { reportError(e, "warning"); }
  for (const id of failed) {
    try { const bl = await store.zip(id, { mode: "existing" }).open(); if (bl) downloadFile(new File([bl], `${stemOfId(id)}${SONG_SUFFIX}`, { type: "application/vnd.recordare.musicxml" })); }
    catch (e) { reportError(e, "warning"); }
  }
  info(failed.length ? _t("推不上去的 {n} 首已下载备份", { n: failed.length }) : _t("都推上去了"));
}
function downloadFile(file: File): void {
  const a = document.createElement("a"), url = URL.createObjectURL(file);
  a.href = url; a.download = file.name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
/** 登录 = 页面跳去微软再跳回来（redirect；iPad PWA 弹窗不可靠）：先把手里的歌落盘，再在一个点击里**同步**起跳（WeebPaint / WXHW 的两步法；onPick 站在用户手势里）。 */
let navigatingForAuth = false;
/** 回 true = 点了「去登录」（已起跳，页面要走了）。 */
async function signInFlow(): Promise<boolean> {
  const inGallery = H.home.kind === "gallery";
  if (inGallery) { try { await es.flushLocal(); } catch (e) { reportError(e, "warning"); } }
  const v = await openChoiceSheet(_t("去微软登录"), _t("页面会跳到微软的登录页（只认个人账号），登录完自动回到这里。{inGallery}", { inGallery: inGallery ? _t("手里的歌已经存在这台设备上了。") : dirty() ? _t("手里这首无地的歌改过还没存——跳走会丢，先存一下再来。") : "" }),
    [{ label: _t("去登录"), value: "go", primary: true, onPick: redirectToSignIn }]);
  return v === "go";
}
/** 在点击里同步起跳（redirect）；跳走期间不拦 beforeunload。 */
function redirectToSignIn(): void { navigatingForAuth = true; void requestStoragePersistence(); diagNote("auth", "signIn redirect"); auth.signIn({ prompt: "select_account" }).catch((e) => { navigatingForAuth = false; reportError(e); }); }
/** 回前台 / 回线：干净的歌快进到云端的新版本（另一台设备改过的）；本地脏 / 没上云 = 不动（之后 push 的 412 会 surface 真分叉）。 */
let refreshing = false;
async function refreshOpenDoc(o: { gate?: boolean } = {}): Promise<string | undefined> {
  const id = H.identifier();
  if (!id || refreshing || !hasStore() || !isSignedIn() || !cloudOnline() || dirty() || es.isPushPending()) return undefined;
  refreshing = true; let froze = false;
  try {
    // 库决定替换（onReplaceStart，同步回调）→ 锁同步闸直到新版载入：下载途中打进去的音会被整篇覆盖且不进备份箱（WXHW 2026-09-29 端到端复现；
    //   user 2026-10-08「我们也要拿新版本时锁输入，感觉wxhw更理想一点」）。闸 = 遮罩 + 没有按钮；重载完（或失败）解锁
    // store 0.18.1 trustHints:false：这里的刷新都发生在回前台 / 回线 / 登录后——怀疑自己过期的时刻，不采信 30 s 内的旧清单，一定问云端（WXHW e2e 10-16 翻红那条）
    const r = await requireStore().zip(id, { mode: "existing" }).pullIfClean({ trustHints: false, localDirty: () => dirty() || es.isPushPending(),
      onReplaceStart: () => { froze = true; diagNote("sync", `replace-start ${stemOfId(id)}: input frozen`); void lockSyncGate({ title: _t("云端有新版本"), message: _t("「{id}」在别的设备上改过了，正在换成最新的……先别打字。", { id: stemOfId(id) }), showSpinner: true, actions: [] }); } });
    if (r?.status === "fast-forwarded" && H.identifier() === id) {
      // 本地字节已换成云端版本（刚 markSynced）→ 内存里的是旧世界线，必须整体重载（同名 es.open = openInto 管线；不重载 = 下次自动存把旧版写回云端，WeebPaint 2026-08-25 案卷）
      const ok = await es.open(id);
      if (ok) info(_t("换成云端的新版本了")); else showError(_t("「{id}」云端的新版本拉下来了，但重开失败——请从歌库再打开一次", { id: stemOfId(id) }));
    } else if (r?.status === "ff-failed" || r?.status === "cloud-error") reportError(r.error ?? new Error(`refresh ${r.status}: ${r.reason ?? ""}`), o.gate && r.status === "cloud-error" ? "log" : "warning");   // 闸门问的：没问成归闸门说，不再上一条横幅
    return r?.status;
  } catch (e) { reportError(e, o.gate ? "log" : "warning"); return "cloud-error"; }
  finally { if (froze) { unlockSyncGate(); } refreshing = false; }
}
/** 登录过期 / 回线：没登录着就静默再试一次（不弹任何东西）。 */
function retrySilent(): void { if (hasStore() && authStarted && !isSignedIn() && auth.isAuthConfigured()) void auth.retrySilentSignIn().catch((e) => reportError(e, "log")); }
/** 登录成功后（boot 时 onAuthChanged 与 initAuth.then 会双触发 → 同一时刻只跑一份）：先推开着的、再回放离线队列、再推所有没上云的、刷新歌库。 */
function afterSignIn(): Promise<void> {
  if (afterSignInInFlight) return afterSignInInFlight;
  afterSignInInFlight = (async () => {
    diagNote("auth", "afterSignIn");
    try { await requireStore().files.drainOfflineQueue(); } catch (e) { reportError(e, "log"); }   // 排着的离线操作本来就同意过
    const ask = await settleReturn();   // (b) 在这里续传
    await refreshOpenDoc();
    gallery?.refresh(); gallery?.renderCloud(); renderTitle();
    ask?.();   // 最后才问、不等人答：这条路是闸门的「正在同步」，等人 = 条一直亮着（D3 核小黑屋时查出来的同一个坑）
  })().finally(() => { afterSignInInFlight = null; });
  return afterSignInInFlight;
}
// ── 回来（开机登录好 / 网回来）时没传的东西（规则书 §1 第 15 条，2026-11-03 夜改写；工单 H4；分法见 cloud-return.ts，同 WeebPaint）──
//   (b) 开着那首按过存没传成 → 续传不问，每次回来都看。(a) 从没传过 → 问一次，点了才传。(c) 只是自动保存 → 不自动传，进「要处理」列表；别的歌有 (c) = 说一声 +「传上去」，开着的这首不算。一页只问一次。
//   MoonSinger 传的时机（按「存」或退出）不变。**pushAll 这条路只有 pushAllNow 一处，只由人点的钮调**（守卫 test/cloud-return.test.mjs）；a、c 同时有时面上两样都说，人点了一起传（Fable 11-03 拍）。
//   吸取 10-26 的两条（user「弹了一个需要处理然后就什么交互都没了」）：话说真的；传完没传成的带名单、带「去处理」钮。11-05（F-200）：切 app 回来不再把开着的这首算成「没传上去」。
let askedReturn = false;
let returnRun: Promise<(() => void) | null> | null = null;
function settleReturn(): Promise<(() => void) | null> { return (returnRun ??= settleReturnOnce().finally(() => { returnRun = null; })); }
function offerReturn(): Promise<void> { return settleReturn().then((ask) => { ask?.(); }); }
/** 算清楚 + 做 (b)；要问人的留给调用方最后做（回一个闭包）。 */
async function settleReturnOnce(): Promise<(() => void) | null> {
  if (!hasStore() || !isSignedIn() || !homeOnline() || gate.locked()) return null;   // 闸门罩着：放行时再看（afterPass）
  if (askedReturn && !es.isPushOwed()) return null;
  const store = requireStore();
  const dirtyNow = await store.files.dirty.count().catch((e) => { reportError(e, "log"); return 0; });
  if (dirtyNow <= 0) return null;
  let items: { identifier: string; syncState?: string }[];
  try { items = await localItems(store); }
  catch (e) { reportError(e, "log"); return null; }
  const never = neverUploadedIds(items);
  const openId = H.identifier(), owed = es.isPushOwed();
  const openAutosaveOnly = isOpenDocAutosaveOnly(items, openId, es.isPushPending() && !owed);   // 续传之前算（见函数注释）
  await resumeOwedPush(never);
  if (askedReturn) return null;
  const plan = planReturn(await store.files.dirty.count().catch(() => dirtyNow), never.size, openAutosaveOnly);
  diagNote("sync", `back with unsynced: ${JSON.stringify(plan)}${openAutosaveOnly ? " (open doc is autosave-only, not counted)" : ""}`);
  if (plan.kind === "none") return null;
  const names = plan.kind === "list" ? stillLocalIds(owed ? await localItems(store).catch(() => items) : items, openAutosaveOnly ? openId : null) : [];
  return () => { void askReturn(plan, names, openAutosaveOnly); };
}
/** (b)：开着这首人按过存、当时没传成、之后没再改 → 续传，不问。从没传过的（(a)）不在这里：它要问。 */
async function resumeOwedPush(never: ReadonlySet<string>): Promise<void> {
  const id = H.identifier();
  if (!id || !es.isPushOwed() || never.has(id)) return;
  try { await es.flushAndPush(); diagNote("sync", `resumed owed push ${id}: pending=${String(es.isPushPending())}`); }
  catch (e) { reportError(e, "log"); }
  gallery?.refresh(); renderTitle();
}
/** (c)：别的歌改过、还只在这台设备上（开着这首不算）。人点「传上去」才传，**不离开当前这首**；「以后再说」= 歌库「要处理」里照旧看得见。
 *  以前这里是「去处理」→ 进歌库 = 离开这首才传，人被弹回歌库、列表已空（user 11-05「点了之后虽然处理好了但是弹回图库了」）。openToo = 开着这首也会一起传，说在前面，回执的数才对得上。 */
function showStillLocal(n: number, names: readonly string[], openToo: boolean): void {
  if (gallery?.isOpen()) gallery.setAttentionOnly(true);   // 已经在歌库里：直接切到「要处理的」
  const named = names.length ? `（${names.slice(0, 3).map(stemOfId).join("、")}${n > 3 ? " …" : ""}）` : "";
  const f = folderHome();
  showNotice({ id: "unsynced", level: "info", text: _t("{n} 首改过的还只在这台设备上{named}", { n, named }) + (openToo ? _t("；传的话连正在写的这首一起") : ""),
    actions: [
      { label: f ? _t("写进「{label}」", { label: f.label }) : _t("传上去"), primary: true, onClick: () => { closeNotice("unsynced"); void pushAllNow(n + (openToo ? 1 : 0)); } },
      { label: _t("以后再说"), onClick: () => closeNotice("unsynced") },
    ] });
}
/** 人点了传（「现在传」/「传上去」共用这一条）。有没落盘的先落：说了连这首一起，就得是最新的那份。 */
async function pushAllNow(total: number): Promise<void> {
  if (!hasStore()) return;
  if (H.identifier()) await es.flushLocal().catch((e) => { reportError(e, "log"); });
  const store = requireStore();
  const r = await store.files.dirty.pushAll().catch((e) => { reportError(e, "warning"); return null; });
  const left = await store.files.dirty.count().catch(() => total);
  diagNote("sync", `push: pushed=${String(r?.pushed ?? "-")} failed=${String(r?.failed.length ?? "-")} left=${left}`);
  const id = H.identifier();
  if (r && id && !r.failed.includes(id)) es.noteExternallyPushed();
  if (left === 0) showNotice({ id: "unsynced", level: "info", text: _t("{r} 首都传上去了", { r: r?.pushed ?? total }), autoHideMs: 4000 });
  else {
    const named = (r?.failed ?? []).slice(0, 3).map(stemOfId).join("、");
    if (gallery?.isOpen()) gallery.setAttentionOnly(true);
    showNotice({ id: "unsynced", level: "warning", text: _t("传上去 {r} 首，还有 {left} 首没传成{named}：别的设备改过的要你选，网络问题的之后再试。", { r: r?.pushed ?? 0, left, named: named ? `（${named}${left > 3 ? " …" : ""}）` : "" }), actions: [{ label: _t("去处理"), primary: true, onClick: () => { closeNotice("unsynced"); void openGallery().then(() => gallery?.setAttentionOnly(true)); } }] });   // 这条的「去处理」留着：真要人选（冲突 / 网络），去歌库是对的
  }
  gallery?.refresh(); renderTitle();
}
async function askReturn(plan: Exclude<ReturnPlan, { kind: "none" }>, names: readonly string[], openToo: boolean): Promise<void> {
  if (askedReturn || !hasStore()) return;
  if (plan.kind === "list") { askedReturn = true; showStillLocal(plan.total, names, openToo); return; }   // 没有从没传过的：不问不推，说一声；人点了才传
  if (isSheetOpen() || isGateOpen()) { diagNote("sync", "ask later: a sheet is open"); return; }   // 别盖住冲突面；下次回来再问
  askedReturn = true;
  const f = folderHome();
  let go = false;
  try {
    go = await openConfirmSheet(
      plan.others > 0 ? _t("有 {neverUploaded} 首只在这台设备，还有 {others} 首改过没传。现在全传？", { neverUploaded: plan.neverUploaded, others: plan.others }) : _t("有 {neverUploaded} 首只在这台设备，现在{f}？", { neverUploaded: plan.neverUploaded, f: f ? _t("写进「{label}」", { label: f.label }) : _t("传上去") }),
      _t("别的设备改过的不会被盖掉，会留给你选。稍后 = 它们进歌库「要处理」的列表，什么都不传。"),
      { okLabel: _t("现在传"), cancelLabel: _t("稍后") });
  } catch (e) { askedReturn = false; reportError(e, "log"); return; }   // 和别的面撞了：这次没问成，下次再问
  const total = plan.neverUploaded + plan.others;
  diagNote("sync", `push ask → ${go ? "now" : "later"}`);
  if (!go) {   // 稍后 = 进列表，什么都不推；回执一句就够（人刚说了稍后，不再追一个钮）
    if (gallery?.isOpen()) gallery.setAttentionOnly(true);
    showNotice({ id: "unsynced", level: "info", text: _t("{n} 首留在这台设备上，歌库「要处理」里看得见", { n: total }), autoHideMs: 4000 });
    return;
  }
  await pushAllNow(total);
}
/** 选一张图当封面：缩成 ≤ 256²、≤ 70 KB 的 PNG 存进歌（Thumbnails/thumbnail.png，zip 最后一个 entry，歌库尾读）；原图不留。 */
async function setCover(f: File): Promise<void> {
  try {
    const png = await makeCoverPng(new Uint8Array(await f.arrayBuffer()));
    updateExtras(withThumbnail(D.extras, png), { kind: "cover", label: _t("换封面图") });
    info(_t("封面图换好了（{n}）", { n: sizeText(png.length) }));
  } catch (e) { showError(_t("这张图用不了：{Error}", { Error: (e as Error).message })); }
}
/** smart save（歌库里的歌；顶栏钮 / Ctrl+S / 文件菜单「存」同一入口）：脏 → 立刻落盘 + 推；干净且登录着 → 复查云端再 force 推一次（时间戳走字）；
 *  没登录 → 落本地 + 问一次「去登录？」（同一 session 点过「暂不」就不再弹，只提示）。 */
let signInDeclined = false;
async function smartSaveStore(): Promise<void> {
  const b = $("saveBtn"); b.classList.add("flash"); setTimeout(() => b.classList.remove("flash"), 500);
  void requestStoragePersistence();
  if (folderHome() && !folderOnline()) await regrantFolder();   // 手势里：点「存」顺手把权限要回来
  const before = syncKind();
  if (before === "clean") { await refreshOpenDoc(); }
  await es.forceSaveAndPush(); renderTitle();
  if (!isSignedIn()) {
    if (signInDeclined || !cloudOnline() || !auth.isAuthConfigured()) { info(_t("存在这台设备上了")); return; }
    const v = await openChoiceSheet(_t("存在这台设备上了"), _t("要同步到 OneDrive 吗？登录微软个人账号后，歌库同步到你 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹）。"),
      [{ label: _t("去登录"), value: "go", primary: true, onPick: redirectToSignIn }, { label: _t("暂不"), value: "later" }]);
    if (v === "later") signInDeclined = true;
    return;
  }
  // 符合预期的不进通知栈，存钮旁一闪；不符合预期的（只落了本机）才开口。冲突 / 失败走库的面和报错，不到这里（家族周账 F-201，user 11-05「上传成功的toast是不是太多了」「2可以」）。
  if (es.isPushPending()) { info(folderHome() ? _t("存在这台设备上了，还没写进文件夹") : _t("存在这台设备上了，云端稍后再推")); return; }
  flashSaved();
}
/** 按「存」成了：存钮下面一闪「已存」，1.2 s。不占顶栏的位置（顶栏不许被挤动），不进通知栈，点得穿。状态的正本照旧是存钮自己（SAVE_SPEC）。 */
function flashSaved(): void {
  document.querySelector(".save-flash")?.remove();
  const r = $("saveBtn").getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "save-flash"; el.setAttribute("role", "status");
  el.textContent = _t("已存 ✓");
  el.style.top = `${Math.round(r.bottom + 4)}px`;
  el.style.right = `${Math.max(4, Math.round(innerWidth - r.right))}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), SAVE_FLASH_MS);
}
const SAVE_FLASH_MS = 1200;
$("saveBtn").addEventListener("click", () => { void fileSave(); });   // smart save = 存 = 回家（三种家的分支在 H.save）
$("undoBtn").addEventListener("click", () => undoNow());
$("redoBtn").addEventListener("click", () => redoNow());
$("lockBtn").addEventListener("click", () => info(_t("这首歌没加密。MoonSinger 这一版还不加密（要的话告诉开发者：照 WXHW 接 zip.js + 7z 就能开）。")));
// iOS 软键盘（user 2026-10-08「弹软键盘的时候最下面滚动不上去」）：visualViewport 矮了多少 = --kb-offset，整个 app 缩到键盘上面（styles #app），谱的最底下才滚得到；
//   iOS 把视口顶上去时拉回 0（固定的顶栏别被推出屏）；键盘露 / 收之后光标那行滚进视野。照 WXHW app.ts 的做法。
if (window.visualViewport) {
  const vv = window.visualViewport;
  const upd = () => {
    const textFocused = document.activeElement instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (vv.offsetTop > 0 && textFocused) window.scrollTo(0, 0);
    const next = `${Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))}px`;
    if (document.documentElement.style.getPropertyValue("--kb-offset") === next) return;
    document.documentElement.style.setProperty("--kb-offset", next);
    diagNote("viewport", `kb-offset=${next} inner=${window.innerHeight} vv=${Math.round(vv.height)}+${Math.round(vv.offsetTop)}`);
    requestAnimationFrame(() => view.followNow());
  };
  vv.addEventListener("resize", upd); vv.addEventListener("scroll", upd);
  document.addEventListener("focusin", () => setTimeout(upd, 60)); document.addEventListener("focusout", () => setTimeout(upd, 60));
}
window.addEventListener("online", () => { renderTitle(); if (!hasStore() || folderHome()) return; if (gate.netBack()) return; if (isSignedIn()) void afterSignIn(); else retrySilent(); });   // 选了离线 / 闸着：闸门接手（续签 → 补 → 条收掉）
window.addEventListener("offline", () => { renderTitle(); gate.netLost(); });
// ── 醒来：先核云端、再放行输入（家族周账 F-67 = KudsRocket W-25 的 MoonSinger 那一半；user 2026-10-15「unlock之后不应该是判断立刻推autosave。你
//   如果一段时间不用会锁屏，然后怀疑云端有更新。想一下这个防的是什么。顺便moonsinger也没做这个功能。就是防止一个挂机了一年的设备误覆盖新版本」）。
//   防的是：一台带着陈旧状态睡了很久的设备醒来，云端的新版本还没拉下来、用户已经接着写了 = 分叉。If-Match 挡得住静默覆盖（推会 412 → 冲突面），
//   但那张面会弹在半梦半醒那一刻、容易点错。2026-11-03 起走闸门（家族设计稿 cloud-gate）：离开超过 WAKE_CHECK_AFTER_MS 回来 = 先罩住（有「先离线用」，不再是没按钮的锁）核一遍；
//   短暂切走不罩（写谱切个标签回来不吃键），悄悄核，核不上才弹闸；手里有没推上去的改动不罩（分叉照旧由下一次 consent 推的 412 兜底——推只在换歌 / 退出 / 按「存」，那是人清醒着的动作）。
let hiddenAt = 0;
/** 这次醒来要不要先罩：离开得久 ∧ 手里是歌库里的歌 ∧ 没有没推上去的改动。 */
function lockOnWake(awayMs: number): boolean { return awayMs >= WAKE_CHECK_AFTER_MS && H.home.kind === "gallery" && !dirty() && !es.isPushPending(); }
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") { hiddenAt ||= Date.now(); return; }
  const away = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0;
  if (!hasStore()) return;
  if (folderHome()) { void checkFolderPermission(); return; }
  if (!hasCloudHome()) { retrySilent(); return; }
  void gate.wake(lockOnWake(away));
});
window.addEventListener("pageshow", (e: PageTransitionEvent) => { if (e.persisted && !folderHome()) { hiddenAt = 0; void gate.wake(lockOnWake(WAKE_CHECK_AFTER_MS)); } });   // 从往返缓存恢复 = 醒来（设计稿 §2）

// ── 键盘：映射是一张表（src/keyboard/keys.ts）；这里只算「键盘现在归谁」，再照路由的结果做 ─────────────
/** 谁在最上面归谁：导出面板 > 记号框 > 歌词框 > 谱面（弹 / 改 / 写）。 */
function whereNow(): Where {
  if (ui.overlay || isSheetOpen() || isGateOpen()) return "sheet";
  if (view.marks.open) return "mark";
  if (view.lyrics.open) return "lyric";
  return inputGate.why() ? "impro" : D.st.sel ? "edit" : "write";   // 键盘现在不往谱上写（拔着 / 在选乐器 / 锁着）= 按「弹」路由：音键只响
}
/** 照做；返回 false = 这一下其实不归我们管（例如歌词框里「-」不跟在字母后面），让浏览器照常打字。 */
/** 写音的那些命令：只在「音」里（「词 / 符」里键盘不写音——这一层不是音；user「模式！音，歌词，强度和articulation！」）。 */
const NOTE_EDIT = new Set(["degree", "rest", "bar", "shorter", "longer", "tuplet", "extend", "acc", "octave", "step", "alter", "delete", "transpose", "respell", "seldur", "selscale", "modulate", "staff"]);
let modeHintShown: Mode | null = null;
/** 「词」里的退格：光标前那个音有字 = 删掉它的字；光标都往回退过这个音（像删文字）。 */
function lyricBackspace(): void {
  const toks = tr(D.st);
  for (let i = D.st.caret - 1; i >= 0; i--) {
    const t = toks[i]; if (t.kind !== "note") continue;
    const n = setCaret(t.lyric ? setNote(D.st, i, { lyric: null }) : D.st, i);
    if (inputGate.may(D.st, n)) update(n);
    return;
  }
}
function run(a: Action, repeat: boolean, code: string): boolean {
  switch (a.k) {
    case "cmd":
      if (ws.mode === "lyrics" && NOTE_EDIT.has(a.cmd.k)) { if (modeHintShown !== ws.mode) { modeHintShown = ws.mode; info(_t("「{p}」里键盘不写音（切到「音」再写）", { p: MODE_LABEL[ws.mode] })); } return true; }   // 「符」里电脑键盘照样写音（v0.10.36 音符一起编辑）；只有「词」不写
      if (a.cmd.k === "backspace" && ws.mode === "symbols") { const n = apply(D.st, { k: "symBackspace" }, performance.now()); if (inputGate.may(D.st, n)) update(n); return true; }   // 符：退格删记号（user「我早就想用退格删强度曲线了」）
      if (a.cmd.k === "backspace" && ws.mode === "lyrics") { lyricBackspace(); return true; }
      if (a.cmd.k === "degree") {
        const turn = repeat ? null : padHost.monoAccept(`key${code}`);
        if (turn) {   // 先响后写（2026-10-17 Fable）：响的就是要写进去的那个音（算在没提交的 n 里）；写完按 D.st 定位（normalize 可能在前面补力度，下标会挪）
          if (turn.replaced) { sound.up(turn.replaced); pad.showUp(turn.replaced); }   // 单声乐器几乎同时按下 = 后按的算数（v0.16.77）：从上一下之前那份谱写起（turn.base），两下并成一步撤销
          const c = { ...a.cmd, mono: !canStack() }, n = apply(turn.base, c, performance.now());
          if (n !== turn.base && inputGate.may(D.st, n)) {
            const t0 = tr(n)[n.caret - 1];
            if (t0?.kind === "note" && t0.pitch) { sound.down(t0.pitch, `key${code}`); pad.showDown(midiOf(t0.pitch), `key${code}`); }
            update(n, turn.gesture);
            if (t0?.kind === "note" && t0.pitch) soundAfterWrite(D.st, D.st.caret - 1, `key${code}`, t0.pitch);   // 成了和弦（叠亮着）= 补响多出来的音；主音变了 = 重响
          }
          afterWrite();
          padHost.monoWrote(`key${code}`, turn);
        }
        return true;
      }
      { const n = apply(D.st, withHalf(a.cmd), performance.now()); if (!inputGate.may(D.st, n)) return true; update(n); }   // 总闸：会改谱而键盘拔着 = 安静不做（键照样吃掉，不落到浏览器）；只动光标 / 选中 / 输入状态的照常
      if (a.cmd.k === "rest" || a.cmd.k === "extend") afterWrite();
      if (a.cmd.k === "step" || a.cmd.k === "alter" || a.cmd.k === "octave") previewEdited();   // 改音高 = 响一下（改时长不响；user 2026-10-10）
      return true;
    case "audition": {   // 弹：在草稿状态上写一下，拿到那个音高就扔
      if (repeat) return true;
      const probe = apply({ ...D.st, sel: null, log: [] }, { k: "degree", degree: a.degree, dir: a.dir }, performance.now());
      keyTok(probe, probe.caret - 1, code);
      { const t = tr(probe)[probe.caret - 1]; if (ghostOn() && t?.kind === "note" && t.pitch) { ghostHeld.set(`key${code}`, t.pitch); ghostSync(); } }   // 弹：鬼音符
      if (probe.input !== D.st.input) update({ ...D.st, input: probe.input });   // 「只管下一个音」的 ♯ / ♭ 用掉了
      return true;
    }
    case "stack":   // Shift+1–7 = 叠（同 pad「叠」：XOR；单声乐器的声部叠不了）
      if (repeat) return true;
      if (ws.mode !== "notes") { if (modeHintShown !== ws.mode) { modeHintShown = ws.mode; info(_t("「{p}」里键盘不写音（切到「音」再写）", { p: MODE_LABEL[ws.mode] })); } return true; }
      if (!inputGate.mayWrite()) return true;
      if (!canStack()) { info(_t("这条声部台上是单声的（小月相 / 元音版 / 没人）：叠不了。换成能叠音的乐器再叠")); return true; }
      { const n = stackDegree(D.st, a.degree); if (n === D.st) return true; update(n); previewEdited(); }
      return true;
    case "play": playPause(keyTs); return true;
    case "impro": toggleImpro(); return true;
    case "lyric": return view.lyrics.act(a.a);
    case "mark": view.marks.act(a.a); return true;
    case "sheet": ui.close(); closeSheet(); return true;
    case "file": if (a.a === "open") void fileOpen(); else if (a.a === "save") void fileSave(); else openExportHub(); return true;
    case "clip": if ((a.a === "cut" || a.a === "paste") && !inputGate.mayWrite()) return true; void selVerb(a.a); return true;   // 复制 / 全选是读，不问
    case "undo": if (inputGate.mayStep(D.history, "undo")) undoNow(); return true;   // 拔着时键盘上的撤销：轮到谱上的那一步就停（乐器 / 混音那几块照常）
    case "redo": if (inputGate.mayStep(D.history, "redo")) redoNow(); return true;
  }
}
let keyTs = 0;   // 这一下按键的时刻（事件的 timeStamp）：空格连按两下 = 从头放，按真的间隔算
/** 找乐器（歌里的找人视图 / 歌库上面的乐器目录）：电脑键盘的音键 = 弹（只出声、不碰谱；同「弹」的推音高），别的键不接（v0.10.31；user「弹着玩/找乐器的时候应该也能键盘弹」）。 */
function finderKey(e: KeyboardEvent): void {
  if (!isSoundKey(e) || e.ctrlKey || e.metaKey || e.altKey || typingIn(e.target)) return;
  const a = route(e, "impro", "write"); if (!a || a.k !== "audition") return;
  e.preventDefault(); if (e.repeat) return;
  const probe = apply({ ...D.st, sel: null, log: [] }, { k: "degree", degree: a.degree, dir: a.dir }, performance.now());
  keyTok(probe, probe.caret - 1, e.code);
}
window.addEventListener("keydown", (e) => {
  keyTs = e.timeStamp;
  // 这一下归谁 = src/app/input-gate.ts keyOwner（先后顺序就是规矩本身，在那边一条一条测；2026-11-09 从这里的一长串 if 收过去）。这里只按归属去做。
  //   · 存 / 导出 / 打开（Ctrl / ⌘+S、+Shift+S、+O）排在歌库之后、别的之前：不管哪一页开着、焦点在谁身上（录音室 / 乐器页 / 乐器目录 / 参考窗）都是这首歌的事，
  //     不能落到浏览器的「保存网页」（2026-10-10 user「很多地方save没有拦截」）。
  //   · 打字的框拿着焦点 = 键一律归框（v0.16.14，user 11-07「改名的时候没法输入空格，被播放按钮劫持了。帮我系统性的查一下这反映了什么系统问题」）：
  //     不论哪一页、哪个模式都不接——只留上面的存 / 打开，和 Esc（各页自己的「收起」）。谱自己的歌词框 / 记号框除外（它们走键表）。输入法正在拼字（空格是选字）同样不接。
  //   · 别的表单控件（下拉框、滑块）拿着焦点：不接，它们自己吃方向键 / 空格。打字的框里 Ctrl / ⌘ 组合（贴 / 全选 / 撤销）归浏览器（W-36；user 2026-10-13「复制进文本框的时候ctrl v误拦截了」）。
  const t = e.target as HTMLElement | null, mod = e.ctrlKey || e.metaKey, esc = e.key === "Escape";
  const galleryOpen = !!gallery?.isOpen(), ownField = !!t?.closest?.(".lyric-input, .mark-ed"), typing = typingIn(t);
  const fileAct = !galleryOpen && mod && !e.altKey && /^[so]$/i.test(e.key) ? route(e, whereNow(), "write") : null;
  const owner = keyOwner({
    galleryOpen, finderShown: finderShown(), finderOpen: finder.isOpen, fileCombo: fileAct?.k === "file",
    composing: e.isComposing || e.keyCode === 229, listOpen: keyForList(e), escape: esc, mod, typing, ownField,
    formControl: !!t && (isDropdown(t) || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !ownField)),   // 下拉 = 界面零件库的标准件（一颗按钮，7-T）
    instShown: instShown(), inRef: !!t?.closest?.("wp-reference-window"),
    studioOpen: studio.isOpen, inStudio: !!t?.closest?.(".studio"),
    escFree: !D.st.sel && !view.lyrics.open && !view.marks.open && !ui.overlay, listen: listenOn(),
  });
  switch (owner) {
    case "galleryFinder": case "finder": if (esc) { e.preventDefault(); closeFinder(); } else finderKey(e); return;   // 乐器目录（歌库上面的 / 歌里的）：Esc 收起；音键只弹不写（pad 的触屏键照常）
    case "gallery": case "ime": case "field": case "ref": case "control": case "list": return;   // list = 下拉列表开着，键归它（7-T）   // 歌库没有「回到谱」（gallery-first）：出口 = 打开一首 / 新建；参考窗 Ctrl / ⌘+V 进窗、Esc 它自己交回谱
    case "file": e.preventDefault(); run(fileAct!, e.repeat, e.code); return;
    case "inst": {   // 乐器页：只认 Esc（回谱）和撤销 / 重做；输入框里的照常打字
      const inField = t?.closest("input, textarea, .dd");
      if (esc) { e.preventDefault(); closeInstPage(); }
      else if (!inField && mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redoNow(); else undoNow(); }
      else if (!inField && mod && e.key.toLowerCase() === "y") { e.preventDefault(); redoNow(); }
      return;
    }
    case "studioEsc": e.preventDefault(); setMode(lastEditMode); return;   // 混音台 = 听：谱上没别的可退 = Esc 回到写
    case "studio":   // 混音台在底座里：焦点在它里面才归它，谱照样能写；Esc 回谱、空格播放——焦点在推子 / 下拉 / 按钮上也是（v0.10.10）
      if (esc) { e.preventDefault(); setMode(lastEditMode); } else if (e.key === " " && !typing) { e.preventDefault(); playPause(e.timeStamp); }
      return;
    case "listen":   // 听模式：只认 空格（放 / 暂停）、Esc（回到写）和 Ctrl / ⌘+S（存）；别的键不写谱
      if (e.key === " ") { e.preventDefault(); playPause(e.timeStamp); }
      else if (esc) { e.preventDefault(); setListen(false); }
      else if (mod && e.key.toLowerCase() === "s") { const a = route(e, whereNow(), "write"); if (a && run(a, e.repeat, e.code)) e.preventDefault(); }
      return;
    case "score": { const a = route(e, whereNow(), D.st.sel ? "edit" : "write"); if (a && run(a, e.repeat, e.code)) e.preventDefault(); return; }   // 谱：照键表路由；会写谱的在 run() 里问总闸
    default: return assertNever(owner);
  }
});
window.addEventListener("keyup", (e) => { padHost.release(`key${e.code}`); if (ghostHeld.delete(`key${e.code}`)) ghostSync(); if (isSoundKey(e)) { sound.up(`key${e.code}`); pad.showUp(`key${e.code}`); } });   // 复音：只停这个键的
// 切走 app / 失焦：抬手的事件可能收不到，全部停掉（同 WeebPaint 的 pointer 自愈）
window.addEventListener("blur", () => { padHost.reset(); sound.allOff(); pad.clearHeld(); if (ghostHeld.size) { ghostHeld.clear(); ghostSync(); } });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { feel.flush(); padHost.reset(); sound.allOff(); pad.clearHeld(); if (ghostHeld.size) { ghostHeld.clear(); ghostSync(); } } });
// MIDI 键盘（src/keyboard/midi.ts；2026-10-16 by Claude Opus 5.5，user「今天把midi键盘做一下吧…可以插电子琴上弄」）：琴键 = 绝对音高，
//   能写谱的时候走 pad 的同一个翻译层（写 / 改 / 叠音观望 / 单声护栏 / 弹 = 只响）；别的场合（词 / 听 / 歌词框 / 面板开着 / 歌库上的乐器目录）只出声；歌库 = 不接。
//   拼写 = 光标处的调号（调内用调号的写法，调外按调的方向；落进谱时 writePitch 照样按调号简化）。力度这一版不管（同 pad：响多大听光标处的力度）。
const midiHeld = new Map<string, "pad" | "sound">();   // 按着的琴键走了哪条路（松开走同一条）
function midiRoute(): "pad" | "sound" | null {
  if (gallery?.isOpen()) return finderShown() ? "sound" : null;
  if (finder.isOpen || instShown()) return "pad";   // 找人视图 / 乐器页：pad 宿主自己当「弹」（只响、不碰谱）
  if (listenOn() || ws.mode === "lyrics") return "sound";
  const w = whereNow(); return w === "write" || w === "edit" || w === "impro" ? "pad" : "sound";
}
let midiRowSync: ((s: MidiStatus) => void) | null = null;   // 设置面板开着时那一行跟着变
/** 设置开着时重画音源 / 维护两页（v0.17.25）：别处改了「你删了」的记号、或者清单里的「装回来」下完了，开着的设置跟着变（不然状态停在打开那一刻）。 */
let libsRowSync: (() => void) | null = null;
const midi = createMidiKeyboard({
  down: (note, _vel, id) => {
    const r = midiRoute(); if (!r) { midiBlink(); return; }
    const p = spellMidi(note, keyAt(tr(D.st), D.st.sel ? D.st.sel.from : D.st.caret));
    if (r === "pad") { if (padHost.noteDown(p, id)) midiHeld.set(id, r); }
    else { sound.down(p, id); midiHeld.set(id, r); }
    midiBlink();
  },
  up: (id) => { const r = midiHeld.get(id); midiHeld.delete(id); if (r === "pad") padHost.noteUp(id); else if (r === "sound") sound.up(id); },
  plug: (name, on) => info(on ? _t("MIDI 键盘接上了：{name}", { name }) : _t("MIDI 键盘拔掉了：{name}", { name })),
  status: (s) => { diagNote("midi", s.k === "on" ? `on: ${s.inputs.join(", ") || "(no input)"}` : s.k === "denied" ? `denied: ${s.why}` : s.k); midiRowSync?.(s); syncMidiChip(s); },
});
// 顶栏「MIDI」（W-42；user 2026-10-17「midi是ux的问题：我不知道需要进设置连」→「同意顶栏显示midi状态。不一开始弹」）：状态即按钮，点开 = 现在怎样 + 能做的（连接 / 我没有）。
//   没有 Web MIDI（iPad / iPhone）= 不露；没连 = 灰字（窄屏不露，设置里照样能连）；连着没插琴 = 空心点；插着 = 实心点，来一个音闪一下（一眼知道琴到了 app）；没给 = 警告色。
//   开 app 不弹浏览器的许可框（浏览器记住了允许 = 静默接上，同 v0.12.26）。
const midiBtn = $("midiBtn"), KV_MIDI_CHIP_HIDDEN = "midi-chip-hidden";   // 「我没有 MIDI 键盘」= 这台浏览器没连的时候顶栏不露（连上了照样露）
const MIDI_CHIP_TITLE: Record<string, string> = { off: _t("MIDI 键盘：还没连（点一下看怎么连）"), asking: _t("MIDI 键盘：等浏览器的许可…"), denied: _t("MIDI 键盘：浏览器没给（点一下看怎么办）"), idle: _t("MIDI 键盘：开着，还没插琴（插上就认）") };
function syncMidiChip(s: MidiStatus): void {
  const k = s.k === "on" ? (s.inputs.length ? "on" : "idle") : s.k;
  midiBtn.hidden = s.k === "unsupported" || (s.k === "off" && deviceKvGet(KV_MIDI_CHIP_HIDDEN) === "1");
  midiBtn.classList.remove("m-off", "m-asking", "m-denied", "m-idle", "m-on"); midiBtn.classList.add(`m-${k}`);
  midiBtn.title = s.k === "on" && s.inputs.length ? _t("MIDI 键盘：接着 {p}（弹一下这个点会闪）", { p: s.inputs.join("、") }) : MIDI_CHIP_TITLE[k] ?? _t("MIDI 键盘");
}
let midiBlinkT = 0;
function midiBlink(): void { midiBtn.classList.add("hit"); clearTimeout(midiBlinkT); midiBlinkT = window.setTimeout(() => midiBtn.classList.remove("hit"), 120); }
let midiMenuClose: (() => void) | null = null;
function openMidiMenu(): void {
  if (midiMenuClose) { midiMenuClose(); return; }   // 再点一下钮 = 收
  ui.close();
  const s = midi.status, box = document.createElement("div");
  box.className = "track-card ctx-menu midi-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title: string) => `<button class="btn ctx-item" data-v="${v}" title="${esc(title)}">${label}</button>`;
  box.innerHTML = `<div class="ctx-msg">${midiStatusHtml(s)}</div>` +
    (s.k === "off" || s.k === "denied" ? item("connect", _t("连接"), _t("问浏览器要 MIDI 的许可（浏览器会弹它自己的框）；给过一次以后开 app 自己接上")) : "") +
    (s.k === "off" ? item("hide", _t("我没有 MIDI 键盘"), _t("顶栏不再露「MIDI」；以后要连：菜单 → 设置 → MIDI 键盘")) : "");
  document.body.append(box);
  const b = midiBtn.getBoundingClientRect(), w = box.offsetWidth, m = 8;
  box.style.left = `${Math.max(m, Math.min(b.right - w, innerWidth - w - m))}px`; box.style.top = `${b.bottom + 4}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !midiBtn.contains(e.target as Node)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); midiMenuClose = null; ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  midiMenuClose = close; ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "connect") void midi.connect();
    else if (v === "hide") { deviceKvSet(KV_MIDI_CHIP_HIDDEN, "1"); syncMidiChip(midi.status); info(_t("顶栏不露「MIDI」了；以后要连：菜单 → 设置 → MIDI 键盘")); }
  });
}
midiBtn.addEventListener("click", openMidiMenu);
syncMidiChip(midi.status);
/** 设置里「MIDI 键盘」那一行的字。 */
function midiStatusHtml(s: MidiStatus): string {
  if (s.k === "unsupported") return _t("这个浏览器读不了 MIDI 键盘（iPad / iPhone 上的浏览器都没有 Web MIDI）；电脑上的 Chrome / Edge / Firefox 可以");
  if (s.k === "asking") return _t("等浏览器的许可…");
  if (s.k === "denied") return _t("浏览器没给（{why}）。在地址栏左边的站点设置里允许 MIDI，再点连接", { why: esc(s.why) });
  if (s.k === "off") return _t("琴用 USB 插上电脑，点「连接」（浏览器会问一次，以后开 app 自己接上）");
  return s.inputs.length ? _t("接着：{p}。弹的音按光标处的长短写进谱；「弹」开着 / 词 / 听里只出声", { p: esc(s.inputs.join("、")) }) : _t("开着，还没插琴（插上就认）");
}
// 切后台回来：声音被系统收起来了（iPad = interrupted）就叫醒；记一笔延迟（回来后系统可能换了缓冲大小——播放头按扬声器的时钟走，会自己跟上）
// 2026-11-08 Fable：只在已经有上下文时叫醒（原来这里会顺手新建一个）
onAudioNote((m) => diagNote("audio", m));
// 第一次点屏幕 / 按键盘 = 把声音设备提前起好（iPad 主屏独立窗里设备要起 ~1 s；原来等到第一个键才起 = 第一个音晚一秒）。只一次。
//   挂在好几种事件上：iPad 上哪一种算「用户手势」各版本不一样（按下不一定算，抬手 / click 一定算）。
//   常驻（v0.16.27）：之后每一次点屏幕 / 按键盘也顺手叫一下——声音被系统停了（interrupted / suspended），不等到按琴键才叫（那一个键要晚一秒）。上下文在跑 = 只是一次状态比较，不花钱。
{ const warm = () => {
    const c = audioCtxIfAny(); if (c && c.state === "running") return;
    warmAudio();
  };
  for (const e of ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const) window.addEventListener(e, warm, true); }
feelAlways = deviceKvGet(KV_FEEL_ALWAYS) === "1";
if (IS_IOS && PRIMER_URL === null && deviceKvGet(KV_PRIMER) === "0") setPrimer(false);
// 排着的声音在空当里清（src/singer/audio.ts ②；user 11-08「空闲的时候自动清理，我觉得就可以了」）。清 = suspend + resume，会把正在响的音硬掐一下，
//   所以「空当」= **确认没有音在响**：没有键按着、离上一次按 / 松 1.5 秒以上、没在放也没在准备（放完之后再等 5 秒：效果器的尾巴）、页面看得见、
//   录音房最近一次报的在响的声音数 = 0 而且这份报告比最后一次按键晚（它每秒报一次：SoundFont 的收音、元音的收尾都算在里面）。v0.16.30 只看 0.6 秒，尾音长的乐器会被掐到。
//   每秒看一次，真动手最多 10 秒一次（audio.ts）。
{ let voices = -1, loadAt = 0, busyAt = 0;
  engine.on("load", (i) => { voices = i.voices; loadAt = performance.now(); });
  window.setInterval(() => {
    const now = performance.now();
    if (engine.playing || perfApi.preparing) { busyAt = now; return; }
    if (document.visibilityState !== "visible" || soundsHeld.size || now - soundAt < 1500 || now - busyAt < 5000) return;
    if (voices !== 0 || loadAt <= soundAt) return;
    idleFlushAudio();
  }, 1000); }
document.addEventListener("visibilitychange", () => {
  if (studio.isOpen) { engine.meter(document.visibilityState === "visible"); syncSpectrum(); }   // 看不见就不统计（user「记得我说的省cpu，只有看见的时候才进行统计和绘制」）
  if (document.visibilityState !== "visible") return;
  if (!audioCtxIfAny()) return;
  const c = singer.unlock(); audioShown(); resetLatencyLog();
  const ts = typeof c.getOutputTimestamp === "function" ? c.getOutputTimestamp() : null;   // 原始的一对时钟也记下来：错位再报时能看出是哪个时钟跳了
  diagNote("audio", `visible again: ctx ${c.state}, playing ${engine.playing}, currentTime ${c.currentTime.toFixed(3)}, ts ${ts ? `${ts.contextTime?.toFixed(3)} @ ${ts.performanceTime?.toFixed(0)}` : "none"}, now ${performance.now().toFixed(0)}`);
});

await document.fonts.load(`40px Bravura`).catch(() => undefined);
{ const z = deviceKvGet(KV_ZOOM); view.restoreZoom(z === null ? null : Number(z)); }   // 这台设备记住的缩放（物理倍数；2026-10-21 user「缩放跨会话记住，按设备存」）——第一帧就按它排
view.render();
pad.render();
renderTitle();
chromeReady = true; applyWorkspace();   // 模式 / 底座的初始状态（音、键盘在）落到界面上
scoreEl.focus();
// itch / 备用版：开局一行「完整版在官网」（不弹窗、一页只说一次）；存储半路写不进也说一次（家族规则书 §1 第 6 / 12 条）。2026-11-03
showSiteHint(); watchStorageHealth();
onThreadFail((_name, why) => { diagNote("thread", why); showError(why); });   // 线程试过所有起法都起不来（备用版 data: / blob:）：说一声，不静默
// 测试口子（tools/itch-fixture.mjs / tools/local-smoke.mjs）：资源读口读一个站点文件（核哈希）、线程用的起法、mp3 线程编一小段
Object.assign((window as unknown as { __moonsinger: Record<string, unknown> }).__moonsinger, {
  overlayHost,   // 谱面上面那一层的回调（刀 1）：测试不点钮直达「这一段的菜单 / 纸的设置」
  reviveAudio: () => reviveAudio("manual"), audioCtx: () => audioCtxIfAny(),   // test/e2e/audio-revive.mjs
  gate, cloudOnline, noteAuthFailure, updateReload: () => shell.reload(),
  readSite: (path: string, sha256?: string) => getBytes(path, sha256 ? { sha256 } : {}).then((b) => b.length),
  threadKinds: () => Object.fromEntries((["singer-worker", "mp3-worker", "studio-worklet", "layout-worker", "encode-worker"] as const).map((n) => [n, threadUrls(n).map((u) => u.slice(0, u.indexOf(":")))])),
  mp3Test: (samples = 44100) => encodeMp3(new Float32Array(samples).map((_, i) => Math.sin(i / 10) * 0.3), null, 44100, 64).then((b) => b.length),
  availability: () => availability(),
  notice: (t: string) => info(t),   // E2E：来一条提示（提示条不挡小卡那条守卫用）
  saveBytes: () => Array.from(bytesNow()),   // 这首歌现在存下去的 .mxl 字节（谱面分家 5½：切界面语言前后文件字节不变）
});
diagNote("boot", `deployment ${deployment()} · storage ${availability()}`);
// 派生缓存库改了名（带 GUID，家族工单 A2 ⑤）：老的 moonsinger-thumbs / facts / speech 不搬，空闲片里探到就删（一页一次；被别的标签页占着 = 下次再来）
{ const idle = (cb: () => void) => { const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback; if (ric) ric(cb, { timeout: 10_000 }); else setTimeout(cb, 3000); };
  idle(() => { void dropLegacyCacheDbs().then((gone) => { if (!gone.length) return; diagNote("storage", `dropped legacy cache DBs: ${gone.join(", ")}`); info(_t("念缓存和封面缓存换了新名字，会重新生成一次（歌不受影响）")); }).catch((e) => reportError(e, "log")); }); }
// 歌库 boot：进过歌库的设备（或带着 OAuth 回跳）开局就建 store（先建再 initAuth），回到上次的地方——上次在歌库里就开歌库，上次开着哪首就开哪首，开不了就进歌库。没进过的 = 无地，照旧。
const bootFolder = currentPolicy().library ? await lastFolderHome().catch((e) => { reportError(e, "warning"); return null; }) : null;
if (bootFolder) {
  // 家是文件夹（工单 H3）：只 query 权限、绝不弹框；掉了 = 离线态（本机缓存照看，歌库顶上一颗「重新授权」）
  setFolderOnline(await folderPermission(bootFolder, { request: false }));
  ensureAttached({ kind: "folder", entry: bootFolder });
  diagNote("home", `boot folder "${bootFolder.label}" online=${String(folderOnline())}`);
  const last = deviceKvGet(KV_LAST_DOC);
  if (gallery!.wasInGallery() || !last) await gallery!.open();
  else if (!(await openStoreDoc(last))) await gallery!.open();
  if (folderOnline()) void afterSignIn();
  void offerMove();
} else if (currentPolicy().library && currentPolicy().cloud && (storeWasAttached() || /[#&](code|error|state)=/.test(location.hash))) {
  ensureAttached();
  bootedOnStore = true;
  const last = deviceKvGet(KV_LAST_DOC);
  if (gallery!.wasInGallery() || !last) await gallery!.open();
  else if (!(await openStoreDoc(last))) await gallery!.open();
  startAuth();   // 本地恢复完了再 initAuth（CatsUp 2026-09-22 顺序：建 store → 本地恢复 → 登录探测）
}
// 试听元音表（约 3 MB）在画好之后的空闲时下载：选了月读就是意图，第一下就该响（user「选这个乐器就是意图，然后第一下就响」）
setTimeout(() => { void ensureVowels().catch((e) => showError(_t("试听元音表没下载下来：{Error}", { Error: (e as Error).message }))); void engine.ensure().catch(() => undefined); }, 300);
setTimeout(() => schedulePrewarm(), 1200);
// 从链接打开（`?file=<链接>`）：开机恢复完再问；先把这一段从地址栏拿掉（刷新不再问，问了「算了」也不留着）
{ const raw = linkParam(location.href);
  if (raw) { history.replaceState(history.state, "", withoutLinkParam(location.href)); void openFromLink(raw); } }
// 乐器和小月相的强弱改成 SoundFont 的放法、和标准播放器对齐（施工单第 9 节 / 9-2 / 9-4，2026-11-12；user「立刻最先修」「按照SoundFont对齐，然后小月相也应该对齐」
//   「真正该对齐的是：我们的引擎和标准播放器 对齐」）：更新之后第一次打开说一次（这台设备只说一次；不问、不留旧模式）。
//   "1" = 第 9 节那一句；"2" = 9-2 两样一起说；"3" = 9-4（看过 "2" 的只说这次又变了什么，没看过的说合起来的现状）。数 = 施工记录 9-4 那张对照（GS 28 件，mf 上中位数轻 2.6 dB）。
//   "4" = 7-S 加的一句（施工单「9-4 更新后的那一次提示加一句」）：歌库里记着的声音是旧放法渲的、设置里能一键删；看过 "3" 的设备只补这一句。
{ const said = deviceKvGet(KV_SF_VELOCITY_SAID), cacheLine = _t("歌库里这台设备记着的声音是之前的引擎渲的：封面上标「旧」、照样能听，播放条上「重新渲染」用现在的引擎重渲；设置「渲染缓存」里可以一键删掉旧的。");
  if (said !== "4") {
    deviceKvSet(KV_SF_VELOCITY_SAID, "4");
    if (ranBefore) showNotice({ id: "sf-velocity", level: "info", text: said === "3" ? cacheLine : (said === "2"
      ? _t("SoundFont 乐器又和标准播放器（FluidSynth）对了一次齐：每件乐器按库里给它写的力度曲线走——多数乐器 ppp 到 fff 的差别从 36 dB 收到 30 dB，风琴这类库里定成不随力度的就按多重都一样响；库里写的初始衰减也照标准算。在 mf 上多数乐器又轻了 0–9 dB（中位数约 3 dB），乐器之间的轻重会挪。小月相和元音版的强弱也收到同样的幅度（她的 mf 比上一版响 1.3 dB）。旧歌的平衡要重新调。")
      : _t("乐器和小月相的强弱改成了 SoundFont 的放法，和标准播放器（FluidSynth）一样：每件乐器按库里给它写的力度曲线走（多数乐器 ppp 到 fff 差 30 dB；风琴这类库里定成不随力度的，按多重都一样响），库里写的初始衰减也照标准算。整首会变轻、乐器之间的轻重会挪；小月相和元音版的强弱也按同一条曲线。旧歌的平衡要重新调。")) + " " + cacheLine,
      actions: [{ label: _t("知道了"), primary: true, onClick: () => closeNotice("sf-velocity") }] });
  } }
offerHabitsCardWhenFree();   // 这台设备没问过看谱的习惯 = 等前面的东西走了问一次（第 18 条）
void midi.resume();   // 浏览器记住了「允许」= 静默接上 MIDI 键盘（没记住不弹框，等顶栏「MIDI」或设置里点「连接」；W-42）   // 启动时打开的那首歌（歌库 / 上次的）也预热   // 录音房的 worklet 模块也顺手装好（几十 KB），第一下按键就响
