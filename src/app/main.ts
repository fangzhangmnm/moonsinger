// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 键盘。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 第一版（grill 账本 §8½）：不做撤销；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。
// 存档 = 无地逃生口（2026-10-07，user「先不急着store。可以先按照无地规范导入导出做逃生口」）：文件菜单 新建 / 打开 / 存 / 导出（.mxl）
//   （格式 = src/format/，数据契约草稿 ai-docs/20261007-data-contract-draft.md）；没存就关页面 = 浏览器挽留框（照 WeebPaint，不偷偷写盘）。
//   v0.3.0（2026-10-07，edited by Claude Fable 5.1；user「把无地做完美」）按 WeebPaint 无地标尺对齐：存 = 回家一个动作、另存为并进导出 hub、
//   写回前 mtime 对表、有家不给改文件名、拖进来 / 双击 .mxl 打开（manifest file_handlers）。
// UX-2（账本 §9¾）：选中 = 改、光标 = 写；歌词在谱下面点进去写（底部歌词栏拿掉了）；「弹」= 即兴只唱不写。
// 调号 / 拍号 / 速度是谱里的记号 token，点谱上的记号就地改，pad「＋」在光标处插——顶栏不再有全局的调号 / 拍号 / 速度。

import { APP_VERSION } from "../version.ts";
import { initPwaShell } from "./pwa-shell.ts";
import { singleSel, currentIndex, ensureStartDyns, swellOf, toggleSelDot, clearMarks, stackDegree, setBarStyle, transposePapers, scopeKey, setPartAutoOttava, setLyricFit, setBarNumbers, DYNS, CLEFS, headLen, type ClefName, insertClef, insertOttava, setDisplayMark, DEFAULT_TIME, WHOLE, type Art, ART_NAME, setGroove, setRepeatBar, insertNav, NAV_LABEL, endingLabel, type NavWhat, type Repeat, tempoOwner, markAnchor, isTimed, type Dyn, dynMarkAt, editMarkAt, rampSource, toggleArtSel, toggleSlurSel, slurStateSel, artStateSel, setDynSel, dynMarkSel, type EditorState, type InputState, type Acc, type Hum, type MarkVal, type Song, type PartDef, type Token, type TempoMap, initState, writePitch, writeMark, setHum, setPaper, setCredits, setRights, tapAcc, setAccState, setUnit, setNote, effectivePitch, timeline, keyAt, timeAt, tempoAt, TPQ, tr, setFocus, setCaret, setPaperHidden, toggleChordPitch, stackPitch, songOnlyPaper, allPitches, addPart, rebindTrack, removePart, addPaper, removePaper, movePaper, addTrack, removeTrack, flattenPart, tempoMapOf, setDensity, setPartClef, movePart, setPartHost, setPartStaves, type Clef, setSelDur, select } from "../score/song.ts";
import { songPlayOrder, parseArrangement } from "../score/arrange.ts";
import { grooveWeights, grooveMapOf, grooveCategory, followOf, grooveStyle, grooveTable, grooveName, describeGroove, grooveHasPhase, swingRatio, timeMapOf, GROOVE_STYLES } from "../score/groove.ts";
import { type Pitch, midiOf, KEY_LABEL } from "../score/pitch.ts";
import { apply, type Command } from "../score/commands.ts";
import { type Action, type Where, route, isSoundKey } from "../keyboard/keys.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { lyricIssues, lyricWhyText, prettyReading, type LyricIssue } from "../score/lyric-check.ts";
import { ScoreView } from "../ui/score-view.ts";
import type { PartView } from "../render/engrave.ts";
import { installPlatformGuards } from "../ui/platform-guards.ts";
import { type HintRange } from "../keyboard/pad.ts";
import type { InspectorCtx } from "../performers/registry.ts";
import { createPadHost } from "./pad-host.ts";   // pad 的宿主 = 翻译层（音键 → 写 / 叠音观望 / 出声；按键 id → 命令 / 插记号 / 菜单；谁按着的簿记）
import { toLabScore } from "../score/lab-score.ts";
import { Singer, type Reading } from "../singer/client.ts";
import type { LyricReading } from "../ui/lyric-editor.ts";
import { RULES, MODE_BAR, barMode, MODE_LABEL, MODE_TITLE, dockOf, hasKeys, type Mode, type WorkspaceState } from "./workspace.ts";
import { budgetFor, advise, trimOnSongSwitch, describe as describeResources, totalBytes, AUDIO_HOT, type DeviceInfo, type Snapshot } from "./resource-watch.ts";
import type { LoadInfo } from "../engine/studio-client.ts";
import { holdAudio, releaseAudio } from "../singer/audio.ts";
import { DEFAULT_CALIBRATION_DB, SOUNDFONT_DEFAULTS, TSUKUYOMI_DEFAULTS } from "../format/performance.ts";
import { encodeMp3, MP3_QUALITY, type Mp3Quality } from "../export/mp3.ts";
import { id3v2, firstUrl } from "../export/id3.ts";
import { createPackStore } from "@internal/model-packs";
import { showNotice, configureFloors } from "@internal/workbench-elements";
import { PACKS, CREDIT } from "../singer/packs.gen.ts";
import { CREDIT_TRANSLATIONS } from "../singer/credit-translations.ts";
import { SOUNDS, SOUNDS_SOURCE_DEFAULT, type SoundEntry } from "../gm/sounds.gen.ts";
import { createSoundSources } from "../sources/sounds.ts";   // 音源来源 + 弱引用解析（刀 4 接缝）
import { createModelSources, MODEL_SOURCE_DEFAULT } from "../sources/models.ts";
import { sha256Hex } from "../sources/sha256.ts";
import {percOf} from "../gm/percussion.ts";
import { withFinal, withoutFinal, contentFingerprintOf, type FinalRecord, moveBus, saveMxl, openBytes, emptyExtras, roleName, roleSound, partLabels, withRoleName, withRoleConcept, activeCandidateName, activeId, activeGm, activeInstrument, candidates, gmCandidates, withActive, withSf2Candidate, withoutCandidate, newRoleId, newMicId, withNewRole, withoutRole, withMic, withThumbnail, soundUses, withPacked, withUnpacked, activeCalibrationDb, withCalibration, withGapSec, GAP_MAX_SEC, activeVelocity, activePerfSpec, activeTranspose, activeSingChunk, withSingChunk, withMaster, activeMaster, withTrack, studioTrack, studioTracks, withoutBus, newBusId, activeChain, CANDIDATE_ID, type Extras, type Engine, type GmCandidate } from "../format/project.ts";
import { packedLicenses, performerCredits, songCreditLine, licenseHints, RIGHTS_PRESETS, creditsText, type CreditLine } from "../format/credits.ts";
import { ignoredArts, whyIgnored, dynOverridden, dynLevels, type Mark } from "../score/perform.ts";
import { MARK_DEFAULTS } from "../format/performance.ts";
import { navWhy } from "../score/repeats.ts";
import { cachedSound, rememberSound, listCachedSounds, forgetSound, releaseSoundMemory, soundMemoryBytes, siteStorageEstimate, isSoundPersisted } from "../gm/sound-cache.ts";
// ── 实时试听（2026-10-09 Claude Fable 5.1，刀 1；提案 ai-docs/20261009-realtime-preview-engine-proposal.md）：谱 → 时间线（秒）→ 录音房（音频线程）
import { StudioClient } from "../engine/studio-client.ts";
import { performerOf, TSUKUYOMI_RANGE } from "../performers/index.ts";
import { createPerformance, type Issue } from "./performance.ts";   // 唱歌 / 播放 / 导出的胶水（刀 1 之二）
import { createOverlayRegistry, padLocked } from "./overlay.ts";
import { LATCH_OFF, latchDown, latchUp, latchWrite, latchCancel, latchOn, type Latch } from "../keyboard/latch.ts";   // 三把锁一条规则（编辑状态机第 2 期）   // 盖层登记（刀 3 之一）：面板 / 小菜单 / 轨的小卡同一时刻只开一张；page（刀 3 之二）：谱 / 乐器页 / 目录   // 演奏者插件注册表（ADR-0004）：能什么 / 怎么准备 / 怎么出声都问它，不按引擎名分支
import type { AuditionInst, TrackSpec } from "../engine/studio.ts";
import { buildTimeline, lightNotes, songLangOf, sungPlan, LEAD_IN, PRE_ROLL, HUM_KANA, type Timeline, type PerformerInfo, type ChunkPlan } from "../engine/timeline.ts";
import { chunkOrder, readyToStart, prerollCount } from "../engine/scheduler.ts";
import { loadVowelTable } from "../engine/vowel-table.ts";
import { sfKey, canAlign, type SfxInfo } from "../gm/sf-key.ts";
import { Finder, type FinderPick } from "../ui/finder.ts";
import { Studio, MASTER as STUDIO_MASTER } from "../ui/studio.ts";
import { resolveChain } from "../ui/plugins.ts";
import { FINAL_MP3_ENTRY } from "../format/final.ts";
import { coreInfo } from "../core/version.ts";
import { roleNameOf, roleSoundOf, loadCatalog, rangeOf, sampleKeyOf, jointOf, sustainOf, GS_LIBRARY_ID, type Catalog } from "../gm/catalog.ts";
import { ICON_CREDITS } from "../gm/instruments.gen.ts";
import { subsetSf2, listSf2Presets, sf2Info, type Sf2PresetInfo } from "../gm/sf2-subset.ts";
import { ROLE_GROUPS, ROLE_PRESETS, DEFAULT_ROLE } from "../score/roles.ts";
import { type PaperKind, type Density, PAPER_KINDS, PAPER_NOTE, PAPER_LABEL, DENSITIES, densityOf, DEFAULT_PAPER, paperOf, paperSizeText } from "../score/paper.ts";
import * as docFile from "./doc-file.ts";
import { unzipSync } from "../../vendor/fflate/fflate.esm.js";
import { defaultStem, fileSafe, stampedCopy } from "./names.ts";
// ── 歌库（v0.6.0，2026-10-08 Claude Fable 5.1）：@internal/store（接缝 src/app-store.ts）+ @internal/gallery（src/gallery-host.ts）+ WeebPaint 的 editor-session 节律 ──
import { attachStore, hasStore, requireStore, storeWasAttached, auth, setActiveIdentifier, requestStoragePersistence, isSignedIn, detachStore } from "../app-store.ts";
import { identifiers } from "../identifiers.ts";
import { SONG_SUFFIX, LOCAL_SAVE_DEBOUNCE_MS } from "../config.ts";
import { initGalleryHost, type GalleryHost } from "../gallery-host.ts";
import { createEditorSession } from "../editor-session/index.ts";
import { openInputSheet, openChoiceSheet, type Choice, openConfirmSheet, isSheetOpen, closeSheet, isGateOpen, lockSyncGate, unlockSyncGate } from "../ui/sheets.ts";
import { createReferenceHost, type RefImportQuestion, type RefImportChoice } from "./reference-host.ts";
import { RenderProgress } from "../ui/render-progress.ts";
import { scorePdf, LYRIC_RAISE, type PdfFontId } from "../export/score-pdf.ts";
import { loadPdfFont, loadMusicOutlines, PDF_FONT_MB } from "../export/pdf-assets.ts";
import { reportError, diagNote, diagText, initBlackBox } from "./report-error.ts";
import { copyDiag, shareDiag, downloadDiag, clearDiag, canShareDiag } from "./diag-ui.ts";
import { deviceKvGet, deviceKvSet } from "../device-kv.ts";
import { makeCoverPng, coverWithBlurb } from "../image/cover.ts";
import { copyTokens, cutTokens, pasteTokens, selectAll, toJianpu, fromJianpu, fifthsAtSel } from "../score/clipboard.ts";
import { type Locus, type Restored } from "../score/history.ts";
import { createDocument, type SavedMark } from "./document.ts";
import { freshDesk, freshPartView, serializeDesk, unserializeDesk, PAD_UNITS, type Desk, type PartViewState } from "../score/desk.ts";
import { SelBar, type SelVerb } from "../ui/sel-bar.ts";
import { CLEF_LABEL, CLEF_TITLE, OTTAVA_LABEL, resolveSongClefs } from "../score/clef.ts";
import type { ClefHit } from "../render/engrave.ts";
import { TAB20, partColorIndices, partAbbr } from "../ui/part-colors.ts";

initBlackBox(APP_VERSION);   // 黑匣子第一个起：之后所有报错 / 面包屑都有地方落（设置里「诊断日志」能分享）
/** 文档 = 真相 + **改它的唯一入口**（src/app/document.ts，2026-10-16 doc 这一刀）：谱的状态 `D.st`、文件里的其余部分 `D.extras`、撤销栈、「改过没存」的基线、定稿的锁。
 *  改状态一律 `D.commit()`（下面的 update / updateExtras / updateBoth 只是薄壳）；界面的副作用在 afterState / afterExtras / afterRestore 三个 hook 里（函数声明会提升，这里引用没问题）。 */
const D = createDocument({ st: initState(), extras: emptyExtras() }, {
  now: () => performance.now(), normalize: (next) => withStartDyns(next),
  onState: (prev, next, moved) => afterState(prev, next, moved, true), onExtras: (prev, next, locus) => afterExtras(prev, next, locus),
  onRefused: (what) => onLockRefused(what), onRestored: (r, verb, prev) => afterRestore(r, verb, prev), extraDirty: () => refHost.rev(),
});
/** 这首歌的家（无地逃生口）：文件名主干（新建 = 默认名；打开 = 那个文件的名字）、打开的那个文件（桌面 Chromium）+ 打开 / 上次写回时它的 mtime（写前对表）。歌名在谱里（D.st.song.title，可不填），和文件名分开。
 *  （真相 D.st / extras / 已存基线 2026-10-16 起归 D；这里只剩「家」——下一刀收成一个 Home 接口。） */
const doc = { stem: defaultStem(), named: false, handle: null as docFile.FileHandle | null, mtime: null as number | null,
  /** 歌库里的家（v0.6.0）：store 身份（`夹/主干.mxl`）；null = 无地（本地文件句柄 / 还没家）。三种家互斥：identifier 优先于 handle。 */
  identifier: null as string | null,
  /** 首笔安家（v0.6.9，user 2026-10-08「首笔安家做」，照 WeebPaint lazyblank）：歌库里「新建」出来的空谱**没有家、不落盘**，记着要进哪个夹；第一笔编辑才铸身份（homeNow）。空着离开 = 零损失、歌库里不留空壳。 */
  pendingHome: null as { folder: string } | null };
/** 光标所在的声部 / 它的角色 id（歌手牌、找人、试听都对着它）。 */
const curPart = (): PartDef => D.st.song.parts.find((p) => p.id === D.st.at.part) ?? D.st.song.parts[0];
/** 光标所在声部台上那位不认的记号（谱上画灰；写的时候说一声；user 2026-10-08 拍「演奏者不认的记号也变灰，不静默失效，而是向用户披露」）。 */
const ignoredFor = (role: string): Mark[] => { const sp = activePerfSpec(D.extras, role); return ignoredArts(performerOf(activeInstrument(D.extras, role)?.engine), sp.gapSec, sp.canSwell); };
const ignoredHere = (): Mark[] => ignoredFor(curPart().role);
const MARK_NAME: Record<Mark, string> = { ...ART_NAME, slur: "连线", swellGrow: "音内渐强 / 鼓起", swellFade: "音内渐弱", inhale: "出声的换气" };
/** 刚写上了一个台上那位不认的记号 → 明说（照样写进谱、画灰，出声不受影响）。连线 / 保持在「本来就不留缝」的人那里也是这样（连断，2026-10-08）。 */
function discloseArt(prev: EditorState, a: Mark): void {
  if (!ignoredHere().includes(a)) return;
  const has = (t: Token) => t.kind === "note" && (a === "slur" ? !!t.slur : a === "inhale" ? !!t.inhale : a === "swellGrow" ? swellOf(t) === "<" || swellOf(t) === "<>" : a === "swellFade" ? swellOf(t) === ">" : (t.art ?? []).includes(a as Art));
  const n = (s: EditorState) => tr(s).filter(has).length;
  if (n(D.st) <= n(prev)) return;
  const role = curPart().role, who = activeCandidateName(D.extras, role) || "台上这位";
  const why = whyIgnored(performerOf(activeInstrument(D.extras, role)?.engine), a);
  info(why === "decay" ? `${who}的音按下去就自然衰减，${MARK_NAME[a]}做不到：写在谱上了（画灰），出声不变；音内渐弱照做`
    : why === "sung" ? `${who}本来就连着唱：${MARK_NAME[a]}写在谱上了（画灰），出声不变；要断句用呼吸`
    : why === "gap" ? `${who}本来就不留缝（乐器页「音和音之间」= 0）：${MARK_NAME[a]}写在谱上了（画灰），出声不变`
    : `${who}不认${MARK_NAME[a]}：写在谱上了（画灰），出声不受影响`);
}
/** 刚写的力度记号 / 强后即弱让一个力度记号不起作用了（紧跟着的音是 fp：音头按 f、随后落到 p）→ 明说（照写、画灰；2026-10-09 user「要不要按纪律把 mf 画灰、说一句？ 要」）。 */
function discloseDynOverride(prev: EditorState): void {
  const toks = tr(D.st), now = dynOverridden(toks);
  if (now.size <= dynOverridden(tr(prev)).size) return;
  const v = [...now].map((i) => toks[i]).find((t) => t.kind === "dyn");
  info(`这个 ${v && v.kind === "dyn" ? v.value : "力度记号"} 不起作用（画灰）：后面那个音是强后即弱（fp），音头按 f、随后落到 p`);
}
const curRole = (): string => curPart().role;
/** 声部的显示 / 出声状态：隐藏（不画）、静音、独奏——这次打开里有效，不进文件（user 2026-10-08「不同的声部视图和出声应该分别可以solo和hide」）。 */
//   两根轴同一套语法（user 2026-10-08「display有hide 和show only， play有mute和solo。这两个的逻辑关系你理一个好的」）：每根轴 = 一个「关掉」旗（隐藏 / 静音）+ 一个「只要这些」集合（只看它 / 独奏）；
//   有「只要」时旗子不看，关掉「只要」就回到旗子；两根轴互不影响（隐藏的声部照样出声）。隐藏不是消失：谱上缩成一条细行。
const partView = new Map<string, PartViewState>();
const pv = (id: string): PartViewState => partView.get(id) ?? { hidden: false, only: false, muted: false, solo: false };
const setPv = (id: string, patch: Partial<PartViewState>) => partView.set(id, { ...pv(id), ...patch });
/** 显示：有「只看它」的只显示那些，否则显示没隐藏的。 */
const isShown = (id: string): boolean => { const only = D.st.song.parts.some((p) => pv(p.id).only); return only ? pv(id).only : !pv(id).hidden; };
/** 显示 / 存档用的名字：填了歌名用歌名，没填用文件名主干。 */
/** 文件名（user「用歌名可以，然后也要yyyymmdd规则。之后各管各的同意」）：没存过 = 年月日-歌名（没歌名 = 年月日-四位随机 = doc.stem）；
 *  存过 / 打开的 / 改过名的 = 定下来（named），和纸上的歌名各管各的；改文件名在文件菜单。 */
const docName = () => { const t = fileSafe(D.st.song.title ?? ""); return doc.named || !t ? doc.stem : `${doc.stem.slice(0, 8)}-${t}`; };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const bar = $("bar"), scoreEl = $("score"), padEl = $("padPanel");
// 提示（toast）放在谱那一块的底边居中（v0.10.23；user「待会：info error的弹窗和控制条也撞车」：原来顶栏下面横着居中，长的报错压住左上的挂签 / 混音台的顶条）：
//   竖屏 = 键盘上面（不盖键）、横屏 = 谱那一块的下边；谱被盖着（歌库）= 照库的默认（屏幕底下居中）。开着对话框时库自己挪到顶上（docked-top），不管
{ const de = document.documentElement;
  const placeNotices = () => { const r = scoreEl.getBoundingClientRect(); if (r.height < 80) { de.style.removeProperty("--notice-bottom"); de.style.removeProperty("--notice-x"); return; }
    de.style.setProperty("--notice-bottom", `${Math.round(Math.max(12, innerHeight - r.bottom + 60))}px`); de.style.setProperty("--notice-x", `${Math.round(r.left + r.width / 2)}px`); };
  if (typeof ResizeObserver === "function") new ResizeObserver(placeNotices).observe(scoreEl);
  addEventListener("resize", placeNotices); placeNotices(); }
/** 参考窗（v0.8，2026-10-08 深夜 Opus 5.5；src/app/reference-host.ts 是唯一认识库的地方）：截图 / 文字放在旁边对着打谱。
 *  卡片进文件（加 / 删 / 挪 = 标脏，不进撤销）；窗的位置 = 视图态（desk.ref）。底边地板 = 竖屏时 pad 那一块（窗的把手不躲到 pad 底下）。 */
const refHost = createReferenceHost({
  info: (t) => info(t), error: (t) => showError(t),
  topFloor: () => Math.round(bar.getBoundingClientRect().bottom),
  bottomFloor: () => { const r = padEl.getBoundingClientRect(); return !padEl.hidden && r.width > innerWidth * 0.6 && r.top > innerHeight * 0.3 ? Math.max(0, Math.round(innerHeight - r.top)) : 0; },
  focusScore: () => scoreEl.focus({ preventScroll: true }),
  askImport: (q) => askRefImport(q),
  onCards: () => { renderTitle(); changed(); },
});
new ResizeObserver(() => refHost.relayout()).observe(padEl);
/** 参考窗导入的问询（库 0.4.0：超过 1 MB 的图片 / 音频）：存进歌里 / 压一下（约 X MB）/ 只放内存 / 算了。
 *  user「应用内小面板 如果支持压缩的话应该有压缩选项和估计」；超过 4 MB（q.suggestRam）「只放内存」排第一、说为什么（user 选 B：「这里可能是全家族仓我们唯一一个真的需要nudge用户」）。 */
async function askRefImport(q: RefImportQuestion): Promise<RefImportChoice> {
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`, what = q.kind === "audio" ? "mp3 128k" : "PNG 256 色、长边最多 2048";
  const smaller = q.canCompress && (q.estimate === null || q.estimate < q.bytes * 0.9);
  const keep: Choice<RefImportChoice> = { label: `存进歌里（${mb(q.bytes)}）`, value: "keep" };
  const zip: Choice<RefImportChoice> = { label: q.estimate === null ? `压一下再存（${what}）` : `压一下再存（约 ${mb(q.estimate)}）`, value: "compress" };
  const ram: Choice<RefImportChoice> = { label: q.suggestRam ? "只放内存（推荐）" : "只放内存（不存进歌里）", value: "ram" };
  const msg = `「${q.name}」${mb(q.bytes)}。参考窗里的东西跟着歌一起存、一起同步。` +
    (q.canCompress && !smaller ? `压了也不会更小，就不列了。` : smaller ? `压一下 = ${what}。` : "") +
    `只放内存 = 这次打开能${q.kind === "audio" ? "听" : "看"}，不存进歌里；下次打开是个空位，把同一个文件拖进来就补上。` +
    (q.suggestRam ? `超过 4 MB 的，存进去这首歌会大这么多、同步也慢，所以先推荐只放内存。` : "");
  const list = q.suggestRam ? [{ ...ram, primary: true }, ...(smaller ? [zip] : []), keep] : [{ ...keep, primary: true }, ...(smaller ? [zip] : []), ram];
  return (await openChoiceSheet(q.kind === "audio" ? "这段音频有点大" : "这张图有点大", msg, list)) ?? "cancel";
}

new ResizeObserver(() => refHost.relayout()).observe(bar);
installPlatformGuards([scoreEl, padEl]);   // iPad：长按放大镜 / 系统菜单 / 双击缩放（照 WeebPaint）

// ── PWA 壳（2026-10-07 出生）：service worker + 四路更新检测；有新版不强刷，顶上出一条「有新版本 · 刷新」（不用系统弹窗） ─────
const shell = initPwaShell({ onUpdateAvailable: () => { diagNote("sw", "update available"); showUpdateBar(); } });
function showUpdateBar(): void {
  if (document.getElementById("updateBar")) return;
  const el = document.createElement("div");
  el.id = "updateBar"; el.className = "update-bar";
  el.innerHTML = `<span>有新版本</span><button class="btn primary" data-v="reload">刷新</button><button class="btn" data-v="later">待会儿</button>`;
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
const PLAY_TITLE = "从起点放 / 停（空格）；连按两下 = 从头放。长按 / 右键 = 接着放 / 自动翻 / 循环 / 从头放 / 接缝。起点 = 长按 / 右键谱面「从这儿放」挪";
bar.innerHTML =
  `<div class="tb-left"><button id="libBtn" class="btn tb-lib" title="歌库：这台设备上的歌，登录微软账号后同步到 OneDrive（应用文件夹）"><svg class="ico"><use href="#album"/></svg></button>` +
  `<button id="fileBtn" class="doc-name" title="文件名 · 点了改名"><span id="docTitle" class="title">未命名</span></button>` +
  `</div>` +
  `<div class="tb-mid" id="transport"><button id="playBtn" class="btn play-btn" title="${PLAY_TITLE}"><svg class="ico"><use href="#play-from-start"/></svg></button></div>` +
  `<div class="tb-right"><button id="lockBtn" class="btn tb-lock" title="这首歌没加密（MoonSinger 这一版还不加密）"><svg class="ico ico-sm"><use href="#unlock"/></svg></button>` +
  `<button id="saveBtn" class="btn save-btn" title="存"><svg class="ico"><use href="#floppy-disk"/></svg></button>` +
  `<button id="setBtn" class="btn" title="菜单：新建 / 打开 / 导出 / 封面 / 声音与署名 / 设置"><svg class="ico"><use href="#menu"/></svg></button></div>`;   // 三条杠 = 菜单（同 CatsUp 顶栏；扳手留给「配置这一样东西」，如纸右上角）
/** 渲染进度条（顶栏底边；播放的准备和 mp3 导出共用 renderMix 这一条路）。顶栏的 HTML 写好之后再挂（上面 bar.innerHTML = … 会冲掉先挂的）。 */
const renderBar = new RenderProgress(bar);
const stageEl = $("stage");
const busMuted = new Set<string>();   // 静音的混音轨（v0.10.35，视图态：不进文件、不进 undo；换歌清空）
let dockedSide = 0;   // 横屏底座在的时候，舞台里谱面以外占的宽（px；排谱宽度不跟着底座开合跳，见 view 的 layoutWidth；v0.10.33）   // 走带（唱 / 弹 / 录音室）在顶栏中间（胶囊试过一轮，user 2026-10-08「播放器胶囊看着碍眼，还是收到顶栏里面吧」）
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const padTab = document.createElement("button"); padTab.id = "padTab"; padTab.className = "btn pad-tab"; padTab.hidden = true; padTab.title = "键盘（pad）";
padTab.innerHTML = `<svg class="ico"><use href="#grid"/></svg><span>键盘</span>`;
// 底座边上的小条（v0.10.20）：模式四个钮 + |▶ + 撤销 / 重做 + 收起后叫回键盘，贴在键盘边上（竖屏 = 键盘左上角往上挂；横屏 = 键盘左边竖着挂；键盘收起 = 贴屏幕边）——
//   按键盘的时候东西就在手边，鼠标不用上下跑（user「音符词听那个小面版变成靠着键盘 / 加一个按一下弹出键盘的钮…所以竖屏的时候就是左下角，拉着键盘的左上角 / 横屏的时候变成竖排可以吗 /
//   这样按键盘的时候东西就在手边 / 然后走带控制也放这个面版上面 / 就是 play/pause undo redo 音符词听」「尤其是模式条的位置（这个其实蛮重要的，不然鼠标上下跑）」）。位置全在 CSS（grid 区域定位）。
const dockTab = document.createElement("div"); dockTab.className = "dock-tab"; dockTab.setAttribute("role", "toolbar");
dockTab.innerHTML = `<span class="mode-seg" role="tablist" title="模式：这一下点的是哪一层">${MODE_BAR.map((m) => `<button class="btn" data-mode="${m}" role="tab" title="${attr(MODE_TITLE[m])}">${MODE_LABEL[m]}</button>`).join("")}</span>` +
  `<span class="dock-tr"><button id="dockPlay" class="btn play-btn" title="${PLAY_TITLE}"><svg class="ico"><use href="#play-from-start"/></svg></button>` +
  `<button id="undoBtn" class="btn" title="撤销（Ctrl / ⌘+Z）" disabled><svg class="ico"><use href="#arrow-undo"/></svg></button><button id="redoBtn" class="btn" title="重做（Ctrl / ⌘+Shift+Z）" disabled><svg class="ico"><use href="#arrow-redo"/></svg></button></span>`;
dockTab.append(padTab);
stageEl.append(dockTab);
padTab.addEventListener("click", () => showPad(ws.mode === "listen" ? !studio.isOpen : padEl.hidden));
// 挂签（v0.10.3）：模式四个钮 + 看哪一段 + 看哪位歌手，从顶栏底下往下挂、浮在谱上（可以挡住谱）。
//   user 2026-10-10「模式切换不是下拉，回到之前的四个排一起的按钮，然后模式切换，曲段和声部选择这三个不是在顶栏，而是顶栏下面创建一个类似tab的往下的东西，可以遮挡屏幕」
//   （v0.10.2 那版 = 三个下拉挤在顶栏左上角，user 原话「我希望有一个快速选择看全部或者哪个曲段，以及快速看全部或者哪个声部的下拉框」「模式收到下拉框里面」）。
const viewTab = document.createElement("div"); viewTab.className = "view-tab";
viewTab.innerHTML = `<select id="paperSel" class="vt-sel" title="看哪一段：全部 / 只看这一段"></select><select id="partSel" class="vt-sel" title="看哪位歌手：全部 / 只看这一位"></select>`;
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
  const ps = $("paperSel") as HTMLSelectElement | null, qs = $("partSel") as HTMLSelectElement | null; if (!ps || !qs) return;
  const labels = partLabels(D.st.song, D.extras), only = D.st.song.parts.filter((p) => pv(p.id).only);
  const paperOpts = [["all", "全部曲段"], ...D.st.song.papers.map((p, k) => [p.id, `${p.name || `第 ${k + 1} 段`}${p.hidden ? "（隐藏）" : ""}`])] as const;
  const partOpts = [["all", "全部歌手"], ...D.st.song.parts.map((p, k) => [p.id, labels[k] ?? p.id])] as const;
  const sig = JSON.stringify([paperOpts, partOpts]);
  if (sig !== topSelsSig) {
    topSelsSig = sig;
    ps.innerHTML = paperOpts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
    qs.innerHTML = partOpts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
  }
  ps.value = viewScope === "all" ? "all" : D.st.at.paper;
  qs.value = only.length === 1 ? only[0].id : "all";
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
  { const lab = ws.mode === "listen" ? "混音台" : "键盘", sp = padTab.querySelector("span"); if (sp && sp.textContent !== lab) sp.textContent = lab; padTab.title = `${ws.mode === "listen" ? "混音台" : "键盘（pad）"}：${dockOpen ? "点 = 收起" : "点 = 打开"}`; }
  renderTopSels();   // 「词 / 听」没有键盘：不露「键盘」tab
  viewTab.hidden = over || (($("paperSel") as HTMLSelectElement).hidden && ($("partSel") as HTMLSelectElement).hidden);   // 挂签只剩看哪一段 / 哪位：都不用选 = 不挂
  finder.setPadShown(!padEl.hidden);
  document.querySelector(".ip-pad")?.classList.toggle("is-on", !padEl.hidden);
  const n = D.st.sel ? D.st.sel.to - D.st.sel.from : 0;
  const sig = `${n}|${!!clip}|${over || studio.isOpen}`;
  if (sig !== selSig) { selSig = sig; selBar.update(n, !!clip, over || studio.isOpen); }
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
  if (!toks) { info(sys ? "剪贴板里的不是简谱（像 1 2 3 | 5 - - 这样的才认）" : "剪贴板里没有东西"); return; }
  update(pasteTokens(D.st, toks)); info(`贴了 ${toks.length} 个`);
}
async function selVerb(v: SelVerb): Promise<void> {
  switch (v) {
    case "all": update(selectAll(D.st)); break;
    case "copy": { const t = copyTokens(D.st); if (t) { setClip(t); info(`复制了 ${t.length} 个`); } break; }
    case "cut": { const r = cutTokens(D.st); if (r) { setClip(r.toks); update(r.st); info(`剪切了 ${r.toks.length} 个`); } break; }
    case "paste": await pasteNow(); break;
    case "transpose": if (D.st.sel) openSelMenu(selBarAnchor()); break;   // 选区菜单（移调 / 转调 / 时值…；user「不要用keyboard，而是一个小的上下文菜单」）
    case "delete": if (D.st.sel) update(apply(D.st, { k: "delete" })); break;
    case "clear": if (D.st.sel) update(setCaret(D.st, D.st.sel.to)); break;
    case "forget": clip = null; clipText = ""; updateChrome(); break;
    // 第二排 = 微调（v0.10.1；user「选区多微调同意」）：点了不收、选区留着；音高变了响一下（同选区菜单的移调）
    case "up": case "down": if (D.st.sel) { update(apply(D.st, { k: "step", d: v === "up" ? 1 : -1 }, performance.now())); previewEdited(); } break;
    case "sharp": case "flat": if (D.st.sel) { update(apply(D.st, { k: "alter", d: v === "sharp" ? 1 : -1 }, performance.now())); previewEdited(); } break;
    case "octUp": case "octDown": if (D.st.sel) { update(apply(D.st, { k: "octave", d: v === "octUp" ? 1 : -1 }, performance.now())); previewEdited(); } break;
    case "half": case "double": if (D.st.sel) { const nx = apply(D.st, { k: "selscale", f: v === "half" ? 0.5 : 2 }, performance.now()); if (nx === D.st) info(v === "half" ? "再短就没有这种时值了" : "再长就没有这种时值了"); else update(nx); } break;
    case "dot": if (D.st.sel) { const nx = toggleSelDot(D.st); if (nx === D.st) info("选中的里面没有能加附点的时值"); else update(nx); } break;
  }
  if (v !== "transpose") scoreEl.focus();
}
configureFloors({ toolbarBottom: () => bar.getBoundingClientRect().bottom });

// ── 录音房（src/engine/：音频线程里的走带 / 通道 / TinySoundFont / 元音采样器 / 块回放；按键试听也走它的通道）──────────────────
//   替代原来的元音采样器（主线程 WebAudio）和实时合成器（gm-synth worklet）——2026-10-09 Claude Fable 5.1，实时试听刀 1。
//   试听走通道的增益 / 声像、绕过静音 / 独奏和总轨限幅（user「按键不管solomute同意」「限幅嗯」）；光标处的力度归刀 3。
const engine = new StudioClient(() => singer.unlock(), new URL(`./${__STUDIO_WORKLET__}`, import.meta.url), new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url));
let vowelsReady = false, vowelLoading: Promise<void> | null = null;
/** 元音表进录音房（只下载一次；失败了下次重试）。user「选这个乐器就是意图，然后第一下就响」。 */
function ensureVowels(): Promise<void> { return (vowelLoading ??= loadVowelTable().then((t) => { engine.vowels(t); vowelsReady = true; }, (e) => { vowelLoading = null; throw e; })); }
/** 光标那一刻生效的力度（和放的时候同一个状态机 perform.ts dynLevels：力度记号 / 渐强渐弱 / 渐到插值；挂在音上的记号不管）——按键试听用（刀 3；
 *  user「软键盘输入和乐谱里瞎弹时能不能respect这一轨的表情记号…尤其是音量」）。vel = MIDI 力度 0–1（有力度表的 SoundFont）；dB = 音量（月读 / 元音版 / 旧候选）。
 *  光标在两个音之间 = 后面那个音的音头；在纸尾 = 前面那个音的尾。 */
function dynAtCursor(role: string): { vel: number | null; dB: number } {
  const tokens = tr(D.st), i = D.st.sel ? D.st.sel.from : D.st.caret, sp = activePerfSpec(D.extras, role);
  const pick = (m: Map<number, { at0: number; at1: number }>) => { for (let k = i; k < tokens.length; k++) { const l = m.get(k); if (l) return l.at0; } for (let k = Math.min(i, tokens.length) - 1; k >= 0; k--) { const l = m.get(k); if (l) return l.at1; } return null; };
  const dB = pick(dynLevels(tokens, undefined, sp.dynamicsDb, sp.dynamicsDb.mf ?? 0, sp.wedgeStepDb ?? MARK_DEFAULTS.wedgeStepDb)) ?? 0;
  const vel = sp.dynamicsVel ? pick(dynLevels(tokens, undefined, sp.dynamicsVel, activeVelocity(D.extras, role) * 127, sp.wedgeStepVel ?? MARK_DEFAULTS.wedgeStepVel)) : null;
  return { vel: vel === null ? null : Math.max(1, Math.min(127, vel)) / 127, dB };
}
/** 按键试听现在该用谁出声：找人视图 = 试听台上的（GS 预设 / 月读元音）；谱上 = 光标所在那位（SoundFont 走库，别的走元音），走这条通道的增益 / 声像 + 光标处的力度。 */
function auditionTarget(): { inst: AuditionInst; key: (midi: number) => number; vel: number; gainDb: number; pan: number } | null {
  const kana = HUM_KANA[D.st.song.hum ?? "n"];
  if (finder.isOpen) {
    const a = audition;
    if (a) return { inst: { kind: "sf", sha: a.sha256, preset: engine.presetIndex(a.sha256, a.bank, a.program) }, key: (m) => sfKey(m, a), vel: SOUNDFONT_DEFAULTS.velocity, gainDb: 0, pan: 0 };
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
const sound = {
  down: (p: Pitch, id = "main") => {
    const t = auditionTarget(); if (!t) return; if (t.inst.kind === "vowel" && !vowelsReady) { void ensureVowels(); return; }
    singer.unlock(); engine.auditionOn(id, t.inst, t.key(midiOf(p)), t.vel, t.gainDb, t.pan);
  },
  glide: (p: Pitch, id = "main") => { const t = auditionTarget(); if (t) engine.auditionGlide(id, t.key(midiOf(p))); },
  up: (id = "main") => { engine.auditionOff(id); const n = chordVoices.get(id) ?? 0; for (let k = 1; k <= n; k++) engine.auditionOff(`${id}~${k}`); chordVoices.delete(id); },
  allOff: () => { chordVoices.clear(); engine.auditionAllOff(); },
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
function writeAndLocate(write: (s: EditorState) => EditorState): number {
  const n = write(D.st); if (n === D.st) return -1;   // 没写成（没有能填的）
  update(n);
  return D.st.caret - 1;   // 插入 / 填 / 替换写完，光标（写字头）都在刚写的那个音后面
}

let upTimer = 0;   // 点一下响 350 ms 的那个停；新的一下先取消旧的（不然会掐掉新音）
const view = new ScoreView(scoreEl, {
  get: () => D.st,
  set: (n, o) => update(n, o?.gesture),
  audition: (i, hold) => { clearTimeout(upTimer); soundTok(D.st, i, "score"); if (!hold) upTimer = window.setTimeout(() => sound.up("score"), 350); },
  glide: (i) => { clearTimeout(upTimer); const t = tr(D.st)[i]; if (t?.kind === "note" && t.pitch) sound.glide(t.pitch, "score"); },
  release: () => { clearTimeout(upTimer); sound.up("score"); },
  focus: (where) => showPad(where === "staff"),   // 纸宽固定以后，横屏收起旁边的 pad 也不会让谱重排（user「固定行宽之后横屏的键盘也可以开关了吧」）
  autoBars: () => autoBars,
  parts: () => partViews(),   // 谱前写角色名（乐器的名字不上谱；同名同种带号）；隐藏的不画
  onPart: (_paper, _part, at) => openTrackCard(at),
  onBlankPress: (at, row) => openScoreMenu(at, row),
  onListenMenu: (at, a) => openListenMenu(at, a),   // 听模式：长按 / 右键 = 从这儿放 / 接着放 / 从头放
  onSelPress: (at) => openSelMenu(at),
  onMarkPress: (i, at) => openMarkMenu(i, at),
  lyricHint: (i) => lyricHintAt(i),
  lyricReading: (i) => lyricReadingAt(i),
  notice: (s) => info(s),
  onClef: (hit, at) => openClefMenu(hit, at),
  onPaperMenu: (id) => openPaperMenu(id),
  onAddPaper: () => { update(addPaper(D.st)); info("新的一张纸"); },
  onNav: (dir) => navPaper(dir),
  onNavFrom: (paper, dir) => navPaperFrom(paper, dir),
  onScopeOf: (paper) => { if (viewScope === "segment" && D.st.at.paper === paper) viewScope = "all"; else { viewScope = "segment"; if (D.st.at.paper !== paper) navPaperTo(paper); } view.render(); },
  onScopeToggle: () => { viewScope = viewScope === "segment" ? "all" : "segment"; view.render(); },   // 「本段」开关在曲段导航旁边（user「…放在和曲段导航在一起」「就一个按钮toggle」「类似solo toggle」）
  onPaper: () => openPaperSheet(),
  onCredits: () => openCreditsSheet(),
  reflow: () => reflow,
  pages: () => pageFlow && !scrollFlow,
  scroll: () => scrollFlow,
  // 横屏（底座在右边一栏）：记下底座在时谱面以外占了多宽；底座收起（「词」、键盘收着…）照样按那个宽度排 = 切键盘时谱不突然变大变小（user「切换键盘的时候比如从符号键盘变成文字输入的时候zoom不应该突变」）
  layoutWidth: () => {
    const w = scoreEl.clientWidth, sw = stageEl.clientWidth;
    if (!matchMedia("(min-aspect-ratio: 1/1)").matches) return w;   // 竖屏：底座在下面，不占宽
    if (stageEl.dataset.dock !== "none") { dockedSide = sw - w; return w; }
    return dockedSide > 0 ? Math.max(200, sw - dockedSide) : w;
  },
  lyricRaise: () => LYRIC_RAISE[pdfFont],   // 分页 = 打印预览：选了拼音字体印 PDF，歌词行也让出拼音那一截（和 PDF 排出来一样）
  scope: () => viewScope,
});
/** 视图范围（这次打开里有效）：本段 = 一次只看光标所在的纸，‹ › 翻（默认；user「不同曲段应该是不同页，而不是一起显示」）；全部 = 整首（隐藏的纸折叠着）。 */
let viewScope: "all" | "segment" = "segment";
let pdfFont: PdfFontId = "sans";   // 乐谱 PDF 的字体（desk；同 mp3 音质：跟这首歌走、不标脏）
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
  if (!canStack()) { info(`「${roleName(D.extras, curRole())}」是单声乐器，这个声部叠不了音`); return; }
  if (singleSel(D.st) >= 0) { update(setCaret(D.st, D.st.sel!.to)); return; }
  const tk = tr(D.st); let i = -1;
  if (D.st.sel) { for (let k = D.st.sel.to - 1; k >= D.st.sel.from; k--) if (isTimed(tk[k])) { i = k; break; } }   // 选了好几个 = 改最后那个
  else i = currentIndex(D.st);
  if (i < 0) { info("光标前面还没有音"); return; }
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
let catalogNow: Catalog | null = null;   // 目录（找人视图 / 乐器声部的音域要它；第一次用到时载，260 KB）
const ui = createOverlayRegistry();   // 盖层登记（F-17 第 1 期，2026-10-14）：原来那个「现在开着的面板怎么关」的闭包协议收成一个对象；开新的 = 旧的先关，自己收了只在还是现在这层时清
// 整页在哪（谱 / 乐器页 / 乐器目录）= ui.page（刀 3 之二，2026-10-14）：原来五个各自维护的旗（乐器页开着 / 目录开着 / 只弹着玩 / 关了回乐器页 / 小卡的重画）从这儿推；
//   这里读 ui.page 不读 finder 对象——pad 一创建就画「弹」钮，那时 finder 还没建（同 padHint 的坑）
const instShown = (): boolean => ui.page.k === "inst";
const finderShown = (): boolean => ui.page.k === "finder";
const finderPlayOnly = (): boolean => ui.page.k === "finder" && ui.page.playOnly;
/** 在光标（有选中 = 选区开头）插一个调号 / 拍号 / 速度，开记号框就地改：默认值 = 那里正生效的那个（没改就收起 = 撤掉这次插入）。pad 符号层和空白处小菜单共用。 */
function insertMarkHere(kind: MarkVal["kind"]): void {
  const at = D.st.sel ? D.st.sel.from : D.st.caret;
  const v: MarkVal = kind === "key" ? { kind, fifths: keyAt(tr(D.st), at) } : kind === "time" ? { kind, ...timeAt(tr(D.st), at) } : { kind, bpm: tempoAt(tr(D.st), at) };
  const r = writeMark(D.st, v);
  update(r.st);
  view.marks.openAt(r.index, r.fresh);
}
// pad 的宿主 = 翻译层（src/app/pad-host.ts，刀 2 之三）：音键 → 写 / 改 / 叠音观望 / 出声，按键 id → 命令（锁 × 光标 × 选区）/ 插记号 / 菜单，手指与电脑键盘共用的「谁按着」簿记。
//   这里只给它一组访问器；pad 一创建就画，所以它读的状态（padHint、ui.page、autoBars…）都已在上面声明。
const padHost = createPadHost(padEl, {
  state: () => D.st, update: (n) => update(n), writeAndLocate, afterWrite, previewEdited, info: (m) => info(m), canStack,   // info / ghostOn 是后面才声明的 const：包一层箭头，别在这儿取值
  sound: { down: (p, id) => sound.down(p, id), up: (id) => sound.up(id) }, soundTok,
  impro: () => impro, finderOpen: () => finder.isOpen, finderShown, instShown,
  toggleImpro: () => toggleImpro(),
  kbSwitch: () => setMode(ws.mode === "symbols" ? "notes" : "symbols"),   // 小键盘顶上「符 / 音」：只换键盘（v0.10.37；模式条上只剩音 / 词 / 听）
  ghost: { on: () => ghostOn(), set: (id, p) => { ghostHeld.set(id, p); }, delete: (id) => ghostHeld.delete(id), sync: () => ghostSync() },
  half: {
    caretMoved: () => setHalf(latchCancel(half)),   // 挪光标 = 取消「凑满一份」（锁住的不动）
    knobTurned: () => { if (half.mode === "once") { half = latchCancel(half); halfShifted = false; pad.showHalf(half.mode); } },   // 拨了旋钮 = 照拨的，取消「凑满一份」（不挪回一档：旋钮说了算）
    key: (down) => halfKey(down), wrap: (c) => withHalf(c),
  },
  accKey, stackKey, discloseArt, discloseDynOverride, ignoredHere,
  hintRange: () => padHint(), staves: () => curPart().staves ?? 1,
  autoBars: { get: () => autoBars, set: (on) => { autoBars = on; view.render(); } },
  insertMarkHere, insertGrooveHere: () => insertGrooveHere(), openRepeatMenu: () => openRepeatMenu(),
  openInsertClefMenu: (at) => openInsertClefMenu(at), openInsertOttavaMenu: (at) => openInsertOttavaMenu(at),
  showPad: (on) => showPad(on),
});
const pad = padHost.pad;

/** 「弹」开 / 关（顶栏按钮、电脑键盘的 `）。 */
/** 弹（只响不写）：开关在 pad 第一排「收起」左边（user 2026-10-08「弹这个锁还是放键盘上吧放在第一row，收起键盘的左边」）；快捷键 ` 照旧。找人视图里一直是弹、拨不动。 */
function toggleImpro(): void { if (finder.isOpen) return; impro = !impro; if (impro) showPad(true); pad.render(); ghostHeld.clear(); ghostSync(); }
/** 「弹」时正按着的音 → 谱上光标处（叠亮着 = 那个音上）画鬼音符（v0.10.6；user「弹模式下面能不能在谱子上面光标对应的那个地方显示鬼音符？」「鬼音符的时候千万不能动排版！」）：
 *  只是盖在谱上的一层（ScoreView.showGhost），不改谱、不重排。 */
const ghostHeld = new Map<string, Pitch>();
const ghostOn = (): boolean => impro && !finder.isOpen && !instShown();
function ghostSync(): void { view.showGhost(ghostOn() ? [...ghostHeld.values()] : []); }

// ── 撤销 / 重做（src/score/history.ts）：song 每变一次记一份改之前的快照（引用，不拷贝）；gesture = 连续动作（拖 / 连打歌词）并成一步；换歌清栈 ──
// ── 改状态的唯一入口 = D.commit（src/app/document.ts）。下面三个名字只是薄壳（九十多处调用不用改）；锁 / 撤销栈 / 脏都在 D 里一处 ──
// ── 定稿（W-38；src/format/final.ts 头注释 = 四层护栏）：第 ② 层 = D.commit 里那一判（整首锁住：谱 / 歌名 / 作者栏 / 许可 / 封面 / 歌手 / 混音，user 10-16「都冻同意，封面当然进」）。
const finalOn = (): boolean => D.locked() !== null;
let lockSaidAt = 0;
/** 定稿着被拒的那一下：说一句（同一句 3 s 内不重复）。 */
function lockedSay(what: string): void { const t = performance.now(); if (t - lockSaidAt < 3000) return; lockSaidAt = t; showError(`这首歌定稿了，${what}改不了：先在三条杠里「改稿」（定稿的 mp3 会作废），再改。`); }
function onLockRefused(what: string): void { lockedSay(what); view.render(); pad.render(); drawInst(); ui.redraw(); if (studio.isOpen) studio.show(); }
function update(next: EditorState, gesture?: string): void { D.commit({ st: next }, { gesture }); }
/** 每张纸（曲段）开头没写力度的补上（song.ts ensureStartDyns：补的是那里本来就生效的那个）；补在光标那条、光标前面 = 光标挪到它后面（接着写的音在力度后面）。 */
function withStartDyns(s: EditorState): EditorState {
  const r = ensureStartDyns(s.song, s.nextId); if (!r.added.length) return s;
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
  if (userEdit && (next.song !== prev.song || next.caret !== prev.caret || next.sel !== prev.sel)) view.noteUserEdit();
  if (moved) { sound.allOff(); void prepareBank(); }
  view.render();
  pad.render();
  renderTitle();
  changed();
  updateChrome();
  schedulePlaybackRefresh();   // 放着的时候改谱：时间线重算（正在响的不动）
  schedulePrewarm();            // 没在放：停下 700 ms 后先把光标附近唱好
  refreshIssues();              // 写了第一个音的声部要是没人上场 = 进清单（§2.2½）；删光了 = 出清单
  renderUndo();
}
/** extras 换了之后的副作用（原 updateExtras 的后半）。 */
function afterExtras(prev: Extras, next: Extras, locus: Locus): void {
  if (prev.thumbnail !== next.thumbnail) coverTouched = true;   // 落盘后让歌库丢掉旧缩略图
  renderTitle(); changed(); renderUndo();
  pushChannels(); schedulePlaybackRefresh(); schedulePrewarm();   // 推子 / 校准立刻进录音房（边放边调）；换人 = 时间线重算
  refreshIssues();   // 换人 = 清单重算（换对了角标自己消）
  if (locus.kind === "lounge") pad.render();   // 演奏者变了 = pad 的提示跟着（音域 / 原速键；固定原速 = 不提示）
  if (locus.kind === "final") { applyWorkspace(); view.render(); }   // 定稿 / 改稿：锁的样子（body.doc-final / 模式钮）跟着
  drawInst(); ui.redraw(); updateChrome();   // 歌手名在挂签的下拉里
}
function undoNow(): void { if (D.locked()) { D.undo(); return; } if (!D.history.past.length) { info("没有可撤销的"); return; } ui.close(); view.lyrics.commitAndClose(); D.undo(); }
function redoNow(): void { if (D.locked()) { D.redo(); return; } if (!D.history.future.length) { info("没有可重做的"); return; } ui.close(); view.lyrics.commitAndClose(); D.redo(); }
let lastUndoText = "";   // 测试钩子看的：最近一次撤销 / 重做的 toast
/** 撤销 / 重做落地（D 已换好 D.st / extras / 栈）：换 extras（选角变了合成器重备）→ 视图跟着 locus 走（那条声部要看得见；纸随快照的 at）→ 换谱 → toast 说明撤了什么
 *  （user 2026-10-08 的顾虑「多按几次会不会静默变你没有监视的页面、曲段」：不会静默——视图跟过去 + 每一下都说一句）。 */
function afterRestore(r: Restored, verb: "撤销" | "重做", prev: { st: EditorState; extras: Extras }): void {
  if (r.extras !== prev.extras) {
    if (r.extras.thumbnail !== prev.extras.thumbnail) coverTouched = true;
    if (r.locus.kind === "lounge") { sound.allOff(); void prepareBank(); pad.render(); view.render(); }   // 谱上的 × 符头跟着演奏者
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
  const k = at.song.papers.findIndex((p) => p.id === at.at.paper), paperName = at.song.papers[k]?.name || `第 ${k + 1} 段`;
  const part = at.song.parts.find((p) => p.id === at.at.part), partName = part ? roleName(D.extras, part.role) : "";
  if (l.kind === "score") return `${at.song.papers.length > 1 ? paperName + " · " : ""}${at.song.parts.length > 1 ? partName + " · " : ""}${l.label}`;
  if (l.kind === "paper") return `${paperName} · ${l.label}`;
  return `${l.kind === "lounge" ? "休息室" : l.kind === "studio" ? "混音台" : "封面"} · ${l.label}`;
}
function renderUndo(): void { $<HTMLButtonElement>("undoBtn").disabled = !D.history.past.length; $<HTMLButtonElement>("redoBtn").disabled = !D.history.future.length; }

// ── 播放：月读唱（第一次要加载引擎，之后复用） ─────────────────────────
const singer = new Singer();
/** 唱 / 导出的进度 = 顶栏走带条旁边的小字（停了就清）。 */
// 顶栏的小状态行撤了（2026-10-10 user「小状态栏不要放在顶栏，这样会让顶栏的按钮重拍…或者就不显示？反正有log，用户也不care，有重要的事情有toast」）：
//   文字进黑匣子（同一句换数字不重复记）；带百分比的（下载）推顶栏底边那条细线（不占位置、不挤按钮）。
let statusLast = "", statusBar = false;
const progress = (s: string): void => {
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
const playIcon = (playing: boolean) => { for (const b of playBtns()) { b.innerHTML = `<svg class="ico"><use href="#${playing ? "stop" : "play-from-start"}"/></svg>`; b.classList.toggle("is-on", playing); } drawIssueBadges(); if (!playing) progress(""); };   // 一个主键：|▶ 从起点放 / ■ 停（user「先只有一个键」）
// ── 四个出口（ADR-0004 §2.2½；user 2026-10-14「一套机制、四个出口 同意」）：清单住胶水（performance.ts issues），这里画 ① 谱上「不出声」角标 ② |▶ 角上的数字（点它 = 开清单）③ toast 由胶水在清单变了时说 ④ 导出面板一行 ──
let issueParts = new Set<string>(), issueCount = 0;   // 胶水报的最新清单（画角标用；渲染时不去问胶水，免得初始化顺序）
function onIssuesChanged(list: readonly Issue[]): void { issueParts = new Set(list.map((i) => i.part)); issueCount = list.length; drawIssueBadges(); view.render(); }
function drawIssueBadges(): void {
  for (const b of playBtns()) {
    b.querySelector(".issues-badge")?.remove();
    if (issueCount) { const t = document.createElement("span"); t.className = "issues-badge"; t.textContent = String(issueCount); t.title = `${issueCount} 条轨不出声：点开看清单`; b.append(t); }
  }
}
// ── 唱歌 / 播放 / 导出的胶水 = src/app/performance.ts（刀 1 之二，2026-10-14）：这里只给访问器，拿回一组函数 + 走带态的 getter ──────────
const perfApi = createPerformance({
  state: () => D.st, extras: () => D.extras, viewScope: () => viewScope, pv: (id) => pv(id), busMuted: () => busMuted, curRole: () => curRole(), docName: () => docName(),
  engine, singer, view,
  ui: { progress, info, showError, renderBar, playBtns, playIcon, offerFile: (f, t, m) => offerFile(f, t, m), onIssues: (list) => onIssuesChanged(list) },
  sounds: { resolveGmBytes: (g) => sources.resolveGmBytes(g), ensureVowels, soundMemoryBytes, modelBases: () => models.bases() },
  credits: { creditsOf: (roles, rights) => creditsOf(roles, rights), creditsBlock: (lines, title) => creditsBlock(lines, title) },
  final: () => { const f = D.extras.final, b = D.extras.finalMp3; if (!f || !b) return null; const roles = D.st.song.parts.filter((p) => f.parts.includes(p.id)).map((p) => p.role); return { mp3: b, secs: f.mp3.secs, kbps: f.mp3.kbps, stereo: f.mp3.stereo, roles }; },
});
const { humOpt, resetLatencyLog, refreshIssues, playSong, curFlat, songIn, audibleParts, micOf, channelOf, pushChannels, lowestMidiOf, songBpm, performerInfo, renderMixForTest, tickOfCaret, playPause, resumePlay, playFromHere, playFromHead, playSeam, stopPlay, setLoop, schedulePlaybackRefresh, schedulePrewarm, prepareBank, exportRights, exportSong, resourceSnapshot, onSongSwitch, jumpPlaybackToPaper, previewTrack } = perfApi;
const BUDGET = perfApi.budget, TURN_LEADS = perfApi.TURN_LEADS;
/** 焦点在能打字的框里（文字输入 / 多行）：空格归它。推子（range）、下拉、按钮不算。 */
function typingIn(t: EventTarget | null): boolean { const el = t as HTMLElement | null; if (!el) return false; if (el.tagName === "TEXTAREA" || el.isContentEditable) return true; return el.tagName === "INPUT" && !["range", "checkbox", "radio", "button"].includes((el as HTMLInputElement).type); }
/** 混音台上一条轨的 id → studio.json 里那条轨的 id（歌手 = 它的麦克风轨；路由轨 = 自己）。 */
function trackKey(track: string): string { return D.st.song.parts.find((x) => x.id === track)?.mic ?? track; }
function routeName(track: string): string { if (track === "master") return "总轨"; const k = D.st.song.parts.findIndex((x) => x.id === track); return k >= 0 ? partLabels(D.st.song, D.extras)[k] : studioTrack(D.extras, track)?.name ?? track; }
/** 听模式（2026-10-10 user「还有一个就是播放模式，锁写谱，但是可以调录音室」「我蛮需要播放欣赏的时候防误触的哈哈」）：谱锁住（轻点不跳播、长按 / 右键 = 从这儿放、拖 = 滚动），
 *  pad 收起、键盘只认空格（放 / 暂停）和 Esc（回到写）；录音室照样能开能调。 */
// ── 模式 + 底座（2026-10-10 Opus 5.5；规则表 = src/app/workspace.ts）：音 / 词 / 符 + 听；pad 那个位子 = 底座，放 音键 / 符号格 / 录音室（互斥）。
//   user「模式！音，歌词，强度和articulation！…还有一个就是播放模式，锁写谱，但是可以调录音室」「强度和演奏法能不能合并，就是符号编辑，和别的符号也合并」
//   「录音室的键盘位化，和键盘互相排斥…键盘的模式键是不是能摘下来。好好理一下架构」。applyWorkspace 是唯一把状态落到界面上的地方。
const ws: WorkspaceState = { mode: "notes", collapsed: false, tryout: false };
let lastEditMode: Mode = "notes";   // 从「听」回来回到哪
const listenOn = () => ws.mode === "listen";
function applyWorkspace(): void {
  const d = dockOf(ws), padOn = d === "keys" || d === "symbols", wasEdit = view.rules.edit;
  view.rules = RULES[ws.mode];
  document.body.dataset.wmode = ws.mode; document.body.classList.toggle("listen-mode", ws.mode === "listen"); document.body.classList.toggle("doc-final", finalOn()); scoreEl.dataset.mode = ws.mode;   // 不用 body[data-mode]：歌库自己用它（gallery）
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
  if (finalOn() && m !== "listen") { lockedSay("模式"); return; }   // 第 ① 层：定稿着只有「听」
  ui.close(); view.lyrics.commitAndClose(); view.marks.commitAndClose();
  if (m !== "listen") lastEditMode = m;
  ws.mode = m; if (hasKeys(m)) ws.collapsed = false;
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
  box.innerHTML = item("here", "从这儿放", "起点挪到这个小节的头，从这儿放") + (perfApi.paused && !engine.playing ? item("resume", "接着放", "从上次停下的地方接着放") : "") + item("head", "从头放", "起点回到开头，从头放（也可以连按两下 |▶ / 空格）");
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8; let y = at.y + 10; if (y + h > innerHeight - m) y = at.y - h - 10;
  box.style.left = `${Math.max(m, Math.min(at.x + 6, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, y)}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };
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
  box.innerHTML = (perfApi.paused && !engine.playing ? item("resume", "接着放", "从上次停下的地方接着放（起点不动）") : "") +
    (engine.playing || perfApi.paused ? item("reveal", "跳到正在放的地方", "谱滚到正在放（停着 = 停下）的那一行；刚才自己滚过也照样过去、接着跟") : "") +
    `<div class="ctx-row" title="翻谱提前多少：快到行尾（或编排跳回去之前）这么久就先翻过去，最后一小截靠记——像钢琴家翻谱。0 = 换了行才翻"><span class="ctx-lab">提前翻</span>${TURN_LEADS.map((v) => `<button class="btn ctx-seg${v === perfApi.turnLead ? " is-on" : ""}" data-v="lead:${v}">${v ? `${v} s` : "不"}</button>`).join("")}</div>` +
    item("follow", `${view.autoFollow ? "✓ " : ""}自动翻`, "放着的时候谱跟着正在放的那一行滚（出了屏幕舒服的那一段才滚；你自己滚过 4 秒内不跟）") +
    item("loop", `${perfApi.loopOn ? "✓ " : ""}循环`, "放到头接着从头放；编排写了 [循环段] = 前面放一遍、括住的一直循环") +
    item("head", "从头放", "起点回到开头，从头放（也可以连按两下 |▶ / 空格）") + (perfApi.loopOn ? item("seam", "听接缝", "从循环段结尾前几秒放起，跳回开头再放几秒就停") : "");
  document.body.append(box);
  const b = btn.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, m = 8;
  box.style.left = `${Math.max(m, Math.min(b.left, innerWidth - w - m))}px`;
  box.style.top = `${b.bottom + 4 + h <= innerHeight - m ? b.bottom + 4 : Math.max(m, b.top - h - 4)}px`;   // 底座边上那个：下面放不下 = 往上开
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !btn.contains(e.target as Node)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "resume") resumePlay();
    else if (v.startsWith("lead:")) { perfApi.turnLead = Number(v.slice(5)); info(perfApi.turnLead ? `翻谱提前 ${perfApi.turnLead} 秒` : "翻谱不提前（换了行才翻）"); }
    else if (v === "reveal") { if (!view.revealPlayhead()) info("现在没有在放的地方"); }
    else if (v === "follow") { view.autoFollow = !view.autoFollow; info(view.autoFollow ? "自动翻：开" : "自动翻：关"); }
    else if (v === "loop") setLoop(!perfApi.loopOn);
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
  const v = (e.target as HTMLSelectElement).value; (e.target as HTMLSelectElement).blur();
  if (v === "all") viewScope = "all"; else { viewScope = "segment"; if (v !== D.st.at.paper) navPaperTo(v); }
  view.render(); updateChrome();
});
$("partSel").addEventListener("change", (e) => {
  const v = (e.target as HTMLSelectElement).value; (e.target as HTMLSelectElement).blur();
  for (const p of D.st.song.parts) setPv(p.id, { only: v !== "all" && p.id === v });
  afterViewChange(); updateChrome();
});
/** 嵌进歌的软上限（user 2026-10-07「控制在10M左右的体积（不严格要求）」）：超了三选一——嵌 / 不嵌只记来源（弱引用）/ 算了。 */
let embedSoftLimit = 10e6;
// 音源来源 + 弱引用解析 = src/sources/sounds.ts（刀 4 音源来源接缝，2026-10-15）；这里只留一个实例
const sources = createSoundSources({ progress: (m) => progress(m), roleLabel: () => roleName(D.extras, curRole()) });

// ── 导出歌声（user「基于wxhw的经验分享是可以很早就做」）：照 WXHW 的形状——先生成，再弹「好了」面板，
//    点「分享」那一下才调系统分享（iOS Safari 只认用户手势里的 navigator.share）；没有分享的（桌面 / Quest）= 下载。
/** 导出面板记住的选择（这次打开里有效）。 */
let mp3Scope: "all" | "segment" = "all";   // 范围只在这次打开里记着；音质跟歌走（desk，见 viewScope 旁边）
/** 导出歌声前的面板（user 2026-10-08「mp3导出可能本来就该有一个对话框？比如quality之类的？」→「好，同意」）：音质 / 范围，都预设好，点「导出」就走。
 *  许可那一行只在用户自己选过许可时才出现（user「只有用户自己关心协议的时候才提出这些」）。 */
/** §2.2½ 出口 ②：不出声的声部清单（非模态小面板，每行一个该按的钮）。入口 = |▶ 角上的数字。不替人换、不自愈（10-07 纪律）。 */
function openIssuesSheet(): void {
  ui.close();
  const list = perfApi.issues(); if (!list.length) { info("现在的声部都能出声"); return; }
  const box = document.createElement("div"); box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">不出声的声部</div>` +
    list.map((i) => `<div class="set-row issue-row"><div class="issue-text"><b>${esc(i.label)}</b><small>${esc(i.why)}</small></div><button class="btn primary" data-v="inst:${esc(i.part)}">换人 / 找声音…</button></div>`).join("") +
    `<div class="offer-msg">放和导出的 mp3 里都没有这${list.length > 1 ? `${list.length} 条轨` : "条轨"}的声音，其余照放。换谁由你定，不替补。</div>` +
    `<div class="offer-btns"><button class="btn" data-v="close">知道了</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v?.startsWith("inst:")) { close(); goToPartInst(v.slice(5)); }
  });
}
/** 光标挪到这位歌手（优先这张纸，没有就第一张有它的纸）再开乐器页。 */
function goToPartInst(partId: string): void {
  const paper = D.st.song.papers.find((pp) => pp.id === D.st.at.paper && pp.tracks[partId]) ?? D.st.song.papers.find((pp) => pp.tracks[partId]);
  if (paper && (paper.id !== D.st.at.paper || D.st.at.part !== partId)) update(setFocus(D.st, paper.id, partId));
  openInstPage();
}
function openMp3Panel(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper), k = D.st.song.papers.indexOf(paper!);
  const draw = () => {
    const chip = (v: string, label: string, note: string, on: boolean) => `<button class="btn cand${on ? " is-on" : ""}" data-v="${v}">${esc(label)}<small>${esc(note)}</small></button>`;
    const er = D.st.song.rights ? exportRights(soundingRoles()) : null;
    const fin = D.extras.final;
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">导出歌声（mp3）</div>` +
      (fin ? `<div class="offer-msg">定稿的那一份（第 ${fin.rev} 版 · ${fin.mp3.stereo ? "立体声" : "单声道"} ${fin.mp3.kbps}k · ${mp3SizeText(fin.mp3.bytes)}）直接导出，不重渲；要别的音质先「改稿」。</div>` :
      `<div class="part-sec">音质</div><div class="set-row">${(Object.keys(MP3_QUALITY) as Mp3Quality[]).map((q) => chip(`q:${q}`, MP3_QUALITY[q].label, MP3_QUALITY[q].note, mp3Quality === q)).join("")}</div>`) +
      (D.st.song.papers.length > 1 && !fin ? `<div class="part-sec">范围</div><div class="set-row">${chip("s:all", "整首", "隐藏的纸不放", mp3Scope === "all")}${chip("s:segment", "这一张纸", paper?.name || `第 ${k + 1} 张`, mp3Scope === "segment")}</div>` : "") +
      (er ? `<div class="offer-msg">许可：${er.fellBack ? `这份按「未声明」写——你选的许可允许别人改编，和小月相的条款可能冲突（作者栏里的选择没动）` : esc(er.rights!)}。和署名一起写进 mp3 的标签。</div>` : "") +
      ((is) => (is.length ? `<div class="offer-msg issue-warn">${is.length} 条轨不出声，mp3 里不会有它们：${esc(perfApi.issuesText(is))}。换人在谱前面的声部名里。</div>` : ""))(perfApi.issues()) +   // §2.2½ 出口 ④：护栏在面板里，不拦（user「不警察用户」）
      `<div class="offer-btns"><button class="btn primary" data-v="go">${perfApi.issues().length ? "照样导出" : "导出"}</button><button class="btn" data-v="close">算了</button></div></div>`;
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
    else if (v === "go") { close(); void exportSong({ quality: mp3Quality, scope: mp3Scope }); }
  });
}

// 模型来源（pwa-models）= src/sources/models.ts：同源 pwa-models/ 先、再设置里的；只在这次打开里有效
const models = createModelSources();
const packStore = createPackStore({ packs: PACKS });   // 只用来导入 / 看状态；下载在 worker 里（同一个 Cache Storage pwa-models）
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
async function packStatusText(): Promise<string> {
  const packs = await packStore.status(Object.keys(PACKS));
  return packs.map((s) => `${s.ready ? "✓" : "·"} ${s.slug}（${(s.bytesTotal / 1e6).toFixed(1)} MB）`).join("\n");
}
/** 设置面板（应用内，不用系统弹窗）：模型来源、从本机文件导入模型包、月读的署名与使用条款（包内 LICENSE [1][2] 要求显示）。 */
function openSettings(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">设置</div>` +
    `<label class="set-field">模型来源<input id="srcIn" type="url" spellcheck="false" autocomplete="off" value="${esc(models.source)}" /></label>` +
    `<label class="set-field">音源库来源（乐器音色库、鼓组、音效素材；不是 AI 模型）<input id="sndIn" type="url" spellcheck="false" autocomplete="off" value="${esc(sources.source)}" /></label>` +
    `<div class="set-field">音源库缓存（留在设备上，没网也能用；歌自己带声音，这里只是货架）<div id="sndCache" class="set-packs">…</div></div>` +
    `<div class="offer-msg">先找这个网站下的 <code>pwa-models/</code>（自己搭服务器的话，把模型仓拷过去就能用），找不到再用这里填的。只在这次打开里有效。</div>` +
    `<div class="set-row"><button class="btn" data-v="default">恢复默认</button>` +
    `<label class="btn" title="选模型包的分片文件（chunk-000 …，名字不重要），或整个包拼成的一个文件"><svg class="ico"><use href="#import"/></svg>从本机文件导入模型包<input id="impIn" type="file" multiple hidden /></label></div>` +
    `<pre id="packSt" class="set-packs">…</pre>` +
    `<details class="set-credit"><summary>乐器目录的图标（第三方，${ICON_CREDITS.length} 个）</summary><pre>${esc(ICON_CREDITS.map((c) => `${c.id} — ${c.author} (${c.set}, ${c.license}) ${c.url}${c.modified ? `\n    改动：${c.modified}` : ""}`).join("\n"))}</pre></details>` +
    // 原文在上（条款要求的是原文）；中 / 英译文在下、只给人读（user 2026-10-08「月读的license的展示你守的很紧，但是没做翻译」「还有英文，中国人还能读白字」）
    `<details class="set-credit"><summary>小月相（つくよみちゃん）的署名与使用条款</summary><div class="part-sec">原文（以此为准）</div><pre>${esc(CREDIT.credit)}\n\n${esc(CREDIT.terms)}\n${esc(CREDIT.termsUrl)}\n\n${esc(CREDIT.attribution.join("\n"))}</pre>` +
      `<div class="part-sec">中文译文（仅供阅读，以日文原文为准）</div><pre>${esc(CREDIT_TRANSLATIONS.zh.credit)}\n\n${esc(CREDIT_TRANSLATIONS.zh.terms)}</pre>` +
      `<div class="part-sec">English translation (for reading only; the Japanese original is authoritative)</div><pre>${esc(CREDIT_TRANSLATIONS.en.credit)}\n\n${esc(CREDIT_TRANSLATIONS.en.terms)}</pre></details>` +
    `<div class="set-field">小月相的念缓存（设备上的全局池：念过的句子跨歌共用，重开 app 也在；可再生，清了只是要重念）<div id="spCache" class="set-packs">…</div><div class="set-row"><button class="btn" data-v="sp:clear">清空念缓存</button></div></div>` +
    `<div class="set-field">引擎负载与内存（能算到的部分；超预算会先放块、再减并行、再趁空重开引擎，并在这里 / 状态条明说）<div id="engRes" class="set-packs">…</div><div class="set-row"><button class="btn" data-v="eng:restart" title="小月相引擎的 WASM 内存只涨不落，只有重开才还回去；念过的句子要重念">重开小月相引擎</button></div></div>` +
    `<details class="set-credit"><summary>诊断日志（黑匣子：出错了把这个发给开发者；不上传，只有点「复制 / 分享」才离开设备）</summary><pre id="diagTxt" class="set-packs diag-log">${esc(diagText())}</pre><div class="set-row"><button class="btn" data-v="diag:copy">复制</button><button class="btn" data-v="diag:download">下载 .txt</button>${canShareDiag() ? `<button class="btn" data-v="diag:share">分享…</button>` : ""}<button class="btn" data-v="diag:clear">清空</button></div></details>` +
    `<div class="set-row set-app"><span class="set-ver">${APP_VERSION}</span><button class="btn" data-v="check">检查更新</button><button class="btn" data-v="reset" title="卡在旧版本时用：注销本 app 的离线缓存再重开。下好的小月相模型包不删">清缓存重启</button></div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const srcIn = box.querySelector<HTMLInputElement>("#srcIn")!, packSt = box.querySelector<HTMLElement>("#packSt")!;
  const refresh = () => { void packStatusText().then((t) => (packSt.textContent = t)); };
  refresh();
  const engRes = box.querySelector<HTMLElement>("#engRes")!;
  const refreshRes = () => { const lat = engine.latencyMs(); engRes.textContent = `${describeResources(resourceSnapshot(), BUDGET)} 小月相 ${singer.parallelism} 条道（设备预算 ${BUDGET.lanes}）。${lat !== null ? `声音的输出延迟（浏览器报的）${Math.round(lat)} ms。` : ""}`; };
  refreshRes(); const resTimer = window.setInterval(refreshRes, 1000);
  const spCache = box.querySelector<HTMLElement>("#spCache")!;
  const refreshSpeech = () => { void singer.cache("info", BUDGET.speechDisk).then((d) => { spCache.textContent = d ? `${sizeText(d.bytes)} / 预算 ${sizeText(d.budget)}，${d.entries} 条` : "这个浏览器没有 IndexedDB：只用内存"; }).catch((e) => { spCache.textContent = `读不到：${(e as Error).message}`; }); };
  refreshSpeech();
  const sndIn = box.querySelector<HTMLInputElement>("#sndIn")!, sndCache = box.querySelector<HTMLElement>("#sndCache")!;
  const refreshSounds = async () => {
    const cached = await listCachedSounds(), bySha = new Map(cached.map((c) => [c.sha256, c])), known = new Set(Object.values(SOUNDS).map((e) => e.sha256)), uses = new Map(soundUses(D.extras).map((u) => [u.subsetSha256, u]));
    const total = cached.reduce((n, c) => n + c.bytes, 0), mem = soundMemoryBytes();
    let quota = ""; const est = await siteStorageEstimate(); if (est) quota = `；这个站点共用了 ${sizeText(est.usage)} / 配额 ${sizeText(est.quota)}`;
    sndCache.innerHTML = `<div class="set-row"><span>设备上留着 ${sizeText(total)}${quota}；内存里现在 ${sizeText(mem)}</span>${mem ? `<button class="btn" data-v="snd:mem" title="放掉内存里的整包（设备上留着的不动，下次用再从设备读）">放掉内存</button>` : ""}</div>` +
      Object.values(SOUNDS).map((e) => { const c = bySha.get(e.sha256); return `<div class="set-row"><span>${esc(e.name)} · ${sizeText(e.bytes)} · ${c ? "已留在设备上" : "没下载"}</span>${c ? `<button class="btn" data-v="snd:del:${esc(e.id)}">删掉</button>` : `<button class="btn" data-v="snd:get:${esc(e.id)}">下载留着</button>`}</div>`; }).join("") +
      // 子集（自己的 .sf2 加进来时 / 解包时留的，按子集 sha256 存）：这首歌弱引用着的写出名字——删了它，没有原文件就找不回来
      cached.filter((c) => !known.has(c.sha256)).map((c) => { const u = uses.get(c.sha256); return `<div class="set-row"><span>${u ? `「${esc(u.names.join("、"))}」的声音（这首歌${u.packed ? "也打包着" : "引用着；删了要从「" + esc(u.origin.name) + "」找"}）` : `别的歌 / 别的版本 / 别的 app 留的（${c.sha256.slice(0, 8)}…）`} · ${sizeText(c.bytes)}</span><button class="btn" data-v="snd:delsha:${c.sha256}">删掉</button></div>`; }).join("") || "（没有）";
  };
  void refreshSounds();
  const close = () => { clearInterval(resTimer); models.source = srcIn.value; sources.source = sndIn.value; box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") close();
    else if (v === "default") { srcIn.value = MODEL_SOURCE_DEFAULT; sndIn.value = SOUNDS_SOURCE_DEFAULT; }
    else if (v === "diag:copy") void copyDiag(box.querySelector("#diagTxt"), info);
    else if (v === "diag:download") downloadDiag(info);
    else if (v === "diag:share") void shareDiag(info);
    else if (v === "diag:clear") clearDiag(box.querySelector("#diagTxt"), info);
    else if (v?.startsWith("snd:get:")) { const e = SOUNDS[v.slice(8)]; sources.source = sndIn.value; void sources.fetchSound(e, (done) => progress(`下载 ${e.name} ${Math.round((done / e.bytes) * 100)}%`)).then(() => { progress(""); info(`${e.name} 留在设备上了`); }).catch((err) => { progress(""); showError((err as Error).message); }).finally(() => void refreshSounds()); }
    else if (v?.startsWith("snd:del:")) { const e = SOUNDS[v.slice(8)]; void forgetSound(e.sha256).then(refreshSounds); }
    else if (v?.startsWith("snd:delsha:")) void forgetSound(v.slice(11)).then(refreshSounds);
    else if (v === "snd:mem") { releaseSoundMemory(); void refreshSounds(); }
    else if (v === "check") void shell.checkForUpdate().then((r) => { if (r === "found") { close(); showUpdateBar(); } else info(r === "latest" ? "已经是最新版" : "这里没有离线壳（本机开发 / 浏览器不支持），不用更新"); });
    else if (v === "reset") void shell.forceReset();
    else if (v === "sp:clear") void singer.cache("clear", BUDGET.speechDisk).then(() => { refreshSpeech(); info("念缓存清空了（念过的句子要重念）"); });
    else if (v === "eng:restart") { singer.restart(); diagNote("resource", "manual restart of singer lanes"); refreshRes(); info("小月相引擎重开了，内存还回去了（念过的句子存在这台设备上，不用重念）"); }
  });
  box.querySelector<HTMLInputElement>("#impIn")!.addEventListener("change", async (e) => {
    const files = [...((e.target as HTMLInputElement).files ?? [])]; if (!files.length) return;
    packSt.textContent = "导入中…";
    try { await packStore.importFiles(Object.keys(PACKS), files, (p) => (packSt.textContent = `导入中… ${Math.floor((p.done / p.total) * 100)}%`)); }
    catch (err) { showError(`导入没成：${(err as Error).message === "no-matching-file" ? "这些文件不是小月相要的模型包分片" : (err as Error).message}`); }
    refresh();
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
    (canShare ? `<button class="btn primary" data-v="share">分享</button>` : "") +
    `<button class="btn${canShare ? "" : " primary"}" data-v="download">下载</button><button class="btn" data-v="close">关</button></div></div>`;
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
      info(`已下载 ${file.name}`); onDone?.(); close();
    } else if (v === "share") {
      try { await navigator.share({ files: [file], title: file.name }); info("已分享"); onDone?.(); close(); }
      catch (err) { if ((err as { name?: string }).name !== "AbortError") showError(`分享失败：${(err as Error).message}`); }
    }
  });
}
// 测试用口子（Playwright 逐样本比对浏览器 == Node 时用）
(window as unknown as Record<string, unknown>).__moonsinger = { singer, engine, exportSong, renderMix: () => renderMixForTest(),
  transport: () => ({ startMark: perfApi.startMark, paused: perfApi.paused, listen: listenOn(), loop: perfApi.loopOn, turnLead: perfApi.turnLead }),   // 走带的状态（E2E 用）
  navPaper: (d: -1 | 1) => navPaper(d), paperSpans: () => perfApi.playTl?.papers.map((x) => ({ id: x.paper.id, t0: x.t0 })) ?? null,   // 换段 / 现在放的时间线里每段从几秒起（E2E 用）
  workspace: () => ({ ...ws, dock: dockOf(ws) }), setMode: (m: Mode) => setMode(m),   // 模式 / 底座（E2E 用）
  final: () => D.extras.final, finalize: (q?: Mp3Quality) => finalizeNow(q), unfinalize: () => unfinalizeNow(false), finalMp3: () => D.extras.finalMp3,   // 定稿 / 改稿（E2E 用）
  run: (c: Command) => D.run(c), commit: (next: { st?: EditorState; extras?: Extras }, o?: Parameters<typeof D.commit>[1]) => D.commit(next, o), locked: () => D.locked(),   // 指令式唯一入口（E2E / 以后的 MCP 用）
  resource: () => ({ snapshot: resourceSnapshot(), text: describeResources(resourceSnapshot(), BUDGET), lanes: singer.parallelism, budgetLanes: BUDGET.lanes }),
  speechCache: (op: "info" | "clear") => singer.cache(op, BUDGET.speechDisk),
  // 录音房的接口（刀 4；界面归 Opus / user）：改一条轨（麦克风 id / 总线 id）的效果链 / 发送 / 去向、加删总线、总轨链——都走 undo、推进录音房
  setTrack: (id: string, patch: Record<string, unknown>) => { updateExtras(withTrack(D.extras, id, patch as never), { kind: "studio", label: `轨「${id}」` }); },
  addBus: (name = "总线") => { const id = newBusId(D.extras); updateExtras(withTrack(D.extras, id, { kind: "bus", name }), { kind: "studio", label: `加总线「${name}」` }); return id; },
  removeBus: (id: string) => updateExtras(withoutBus(D.extras, id), { kind: "studio", label: `删总线「${id}」` }),
  setMaster: (patch: Record<string, unknown>) => updateExtras(withMaster(D.extras, patch as never), { kind: "studio", label: "总轨" }),
  studioTracks: () => studioTracks(D.extras), labScore: () => { const { tokens, map } = curFlat(); return toLabScore(tokens, D.st.song.hum, songLangOf(tokens, D.st.song.hum), map); }, state: () => D.st, cssHash: __CSS_HASH__, extras: () => D.extras, setEmbedSoftLimit: (n: number) => { embedSoftLimit = n; }, layout: () => (view.layout ? { ...view.layout, head: view.head() } : null) /* head = 光标画在哪（ink 层，W-17 第 1 刀；E2E 看它） */, bytes: () => bytesNow(), open: (name: string, bytes: Uint8Array) => openBytes(name, bytes), view, zipList: (bytes: Uint8Array) => Object.keys(unzipSync(bytes)), zipText: (bytes: Uint8Array, path: string) => new TextDecoder().decode(unzipSync(bytes)[path]), load: (o: ReturnType<typeof openBytes>) => loadDoc(o.song, { stem: o.stem, named: true, extras: o.extras, handle: null, view: o.view, references: o.references }), refHost, makePdf: async (id: PdfFontId, pick?: PdfPick) => { const { r, file } = await makePdf(id, pick); progress(""); return { bytes: r.bytes, pages: r.pages, stats: r.stats, name: file.name }; },
  setChunk: (v: "phrase" | "sheet" | "whole") => { const role = D.st.song.parts.find((x) => x.id === D.st.at.part)?.role; if (role) updateExtras(withSingChunk(D.extras, role, v, D.st.song.hum), { kind: "lounge", label: `分段唱：${v}` }); },
  set: (n: EditorState) => update(n), addPaper: () => update(addPaper(D.st)), toggleChord: (i: number, p: Pitch) => update(toggleChordPitch(D.st, i, p)), playSong: () => playSong(), afterSignIn: () => afterSignIn(), diagText: () => diagText(), refreshOpenDoc: () => refreshOpenDoc(), pushDirtyAll: () => pushDirtyAll(), gateOpen: () => isGateOpen(), undo: () => undoNow(), redo: () => redoNow(), history: () => ({ past: D.history.past.length, future: D.history.future.length }), undoText: () => lastUndoText, desk: () => deskNow(), setScope: (v: "all" | "segment") => { viewScope = v; view.render(); }, setPages: (v: boolean) => { pageFlow = v; view.render(); }, setScroll: (v: boolean) => { scrollFlow = v; view.render(); view.followNow(); }, partView: (id: string, patch: Partial<PartViewState>) => { setPv(id, patch); afterViewChange(); view.render(); }, flatten: () => flattenPart(D.st.song, D.st.at.part), setPaperHidden: (id: string, h: boolean) => update(setPaperHidden(D.st, id, h)), store: () => (hasStore() ? requireStore() : null), es: () => es, gallery: () => gallery, attach: () => ensureAttached(), openGallery: () => openGallery(), newStoreSong: () => newStoreSong(), openStoreDoc: (id: string) => openStoreDoc(id), identifier: () => doc.identifier, dirty: () => dirty(), auth };   // cssHash：样式表版本（见 scripts/build.sh）

// ── 顶栏 ────────────────────────────────────────────────────────────────
/** pad 像软键盘、五线谱像文本框（user「键盘输入歌词的时候音乐键盘应该hide」「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：
 *  点谱 = 弹出；打开歌词 / 歌名框（系统键盘要上来）= 收起；点顶栏空白处 = 收起。开局是弹出的（光标就在谱上）。
 *  横屏 / 桌面也一样（纸宽固定了，收起旁边的 pad 不会让谱重排）。顶栏的 pad 钮照旧手动开关；开「弹」= 弹出。 */
/** 键盘收起 / 弹出（pad 的「收起」、底下的「键盘」tab、点谱弹出、点顶栏空白收起）。底座里放什么最终由模式定（applyWorkspace）：「词 / 听」本来就没有键盘。 */
function showPad(on: boolean): void {
  ws.collapsed = !on;
  applyWorkspace();
}
bar.addEventListener("pointerdown", (e) => { if (!(e.target as HTMLElement).closest("button, select, label, input, a")) showPad(false); });

// ── 文件（无地逃生口）：一首歌 = 一个 .mxl；家 = 打开的那个文件（桌面 Chromium 能存回去）或没有家（iPad：存 = 下载 / 分享） ──────
/** 台上那位的引擎（= 谁来演、怎么出声）；unknown = 没人能出声（别家谱原来的乐器 / 这一版不认识）。SSoT = 休息室快照（D.extras），不另存状态。 */
function engineNow(): Engine { return activeInstrument(D.extras, curRole())?.engine ?? "unknown"; }
const dirty = () => D.dirty();   // 改过没存（谱 / 休息室 / 录音房 / 封面 / 定稿 / 参考窗的卡）
/** 顶栏的名字（「•」= 改过还没落盘：无地 = 没存；歌库 = 2 s 内会自动存）+ 右边 smart save 钮的状态（永远可见，user 2026-10-08「数据安全红线」）。 */
function renderTitle(): void {
  const d = dirty(), name = docName(), fin = D.extras.final;
  $("docTitle").textContent = `${name}${d ? " •" : ""}`;
  { const b = $("fileBtn"); b.classList.toggle("is-final", !!fin); b.querySelector(".final-badge")?.remove(); if (fin) { const t = document.createElement("span"); t.className = "final-badge"; t.textContent = `定稿 ${fin.rev}`; t.title = `定稿了（第 ${fin.rev} 版，${fin.at.slice(0, 10)}）：只能听，改不了；三条杠里「改稿」解锁`; b.append(t); } }
  $("fileBtn").title = `文件名（${fileWhere()}）· ${doc.handle ? "本机文件的名字在文件管理器里改" : "点了改名"}`;
  // 网页标题不跟歌名（W-22，user 2026-10-11「标题不要显示歌名，不然这样浏览器老是会记错」）：永远是 index.html 那一句（也是 SEO 的门面）；「•」只在顶栏
  renderSaveButton();
  renderUndo();
}
/** smart save 钮的状态（抄 WXHW / WeebPaint「状态即按钮」）：歌库 = saving（2 s 内自动存）/ local（存在设备上，没登录）/ offline / unsynced（没上云）/ clean（云端也最新）；
 *  本地文件 = fileDirty / fileClean；没家 = unsaved / fresh（新谱没改过）。 */
type SyncKind = "saving" | "unsynced" | "local" | "offline" | "clean" | "fileDirty" | "fileClean" | "unsaved" | "fresh";
function syncKind(): SyncKind {
  if (doc.identifier) {
    if (dirty()) return "saving";
    if (!isSignedIn()) return "local";
    if (!navigator.onLine) return "offline";
    return es.isPushPending() ? "unsynced" : "clean";
  }
  if (doc.handle) return dirty() ? "fileDirty" : "fileClean";
  return dirty() ? "unsaved" : "fresh";
}
const SAVE_SPEC: Record<SyncKind, { icon: string; cls: string; title: string }> = {
  saving: { icon: "database", cls: "s-saving", title: "改了，马上自动存到这台设备（点 = 现在存 + 推）" },
  local: { icon: "database", cls: "s-local", title: "存在这台设备上（没登录 OneDrive，不上云；点 = 存 + 去登录）" },
  offline: { icon: "cloud-unavailable", cls: "s-offline", title: "离线：存在这台设备上，回线再推上云" },
  unsynced: { icon: "cloud-upload", cls: "s-unsynced", title: "存在这台设备上了，还没推上云（点 = 现在推）" },
  clean: { icon: "cloud-synced", cls: "s-clean", title: "云端也是最新的（点 = 复查云端）" },
  fileDirty: { icon: "floppy-disk", cls: "s-unsynced", title: "改过还没存回文件（点 = 存）" },
  fileClean: { icon: "floppy-disk", cls: "s-fileClean", title: "存在本地文件里了" },
  unsaved: { icon: "floppy-disk", cls: "s-unsynced", title: "还没存（点 = 存）" },
  fresh: { icon: "floppy-disk", cls: "s-fresh", title: "新的一首，还没存" },
};
function renderSaveButton(): void {
  const k = syncKind(), spec = SAVE_SPEC[k], b = $("saveBtn");
  b.innerHTML = `<svg class="ico"><use href="#${spec.icon}"/></svg>`;
  b.className = `btn save-btn ${spec.cls}`; b.title = spec.title; b.dataset.kind = k;
}
const fmtDb = (dB: number) => `${dB > 0 ? "+" : dB < 0 ? "−" : ""}${Math.abs(dB)} dB`;
/** 主唱没人上场（别的软件存的谱，原来的乐器这一版没有）：不出声、报错，人来选（user「不出声，报错，人类手动换」）。 */
function noCast(what: string): void {
  showError(`「${roleName(D.extras, curRole())}」这个角色还没有人上场（原来的乐器这一版没有），所以没有${what}。要小月相来唱，点谱前面的「${roleName(D.extras, curRole())}」，在「谁来演」选小月相。`);
}
// ── 找人视图（src/ui/finder.ts）：全屏替掉谱区，pad 当试听键盘；试听台 = 临时的一个槽（不进休息室），「上场」才造演奏者 ──────────
let audition: { bank: number; program: number; note?: number; sfx?: SfxInfo; sha256: string; subset: Uint8Array; label: string } | null = null;
/** pad 键底部的提示音域 = 现在谁在弹：找人视图里 = 试听的那位；写谱时 = 光标所在声部上场的那位（月读 / 元音版 = 她的；乐器 = 目录里角色那件乐器的音域；不知道 = 不画）。 */
function padHint(): HintRange {
  if (finderShown()) return auditionHint;
  const plug = performerOf(activeInstrument(D.extras, curRole())?.engine);
  if (!plug) return null;
  if (plug.hintRange) return plug.hintRange;   // 人声：固定音域（插件自报）；乐器 = 下面按目录查（音效 / 采样键只对 GS 成立，各自有守卫；概念音域和引擎无关）
  if (!catalogNow) { void loadCatalog(new URL(import.meta.url)).then((c) => { catalogNow = c; pad.render(); }).catch(() => { /* 目录载不了：不画提示 */ }); return null; }
  // GS 的音效预设（仓鼠 v8，TinySoundFont 实测；只对 GS 成立，别的 .sf2 不套）：固定原速 = 哪个键都一样、不提示（同鼓件）；
  //   关了固定 = 提示原速键；再开音高对齐 = 提示「原速时听到的那个音」（谱上写它 = 原来的样子）
  const g = activeGm(D.extras, curRole());
  if (g?.sfx) {
    if (g.note !== undefined) return null;
    const s = g.sfx, al = s.align && canAlign(s), k = al ? Math.round(s.midi!) : s.key;
    return { lo: k, hi: k, who: g.name, title: al ? "写这个音 = 原速（音高对齐：写的音 ≈ 听到的音）" : "原速键：按这个键，采样不拉伸不压缩" };
  }
  if (g && g.note === undefined && g.origin.library === GS_LIBRARY_ID) { const sk = sampleKeyOf(catalogNow, g.bank, g.program); if (sk) return { lo: sk.key, hi: sk.key, who: g.name, title: sk.title }; }   // 旧歌（上场时还没抄 sfx）
  const concept = D.extras.lounge[curRole()]?.concept as { ids?: { wikidata?: string | null; local?: string | null }; name?: { zh?: string } } | undefined;
  const id = concept?.ids?.wikidata ?? concept?.ids?.local; if (!id) return null;
  const r = rangeOf(catalogNow.byId.get(id));
  return r ? { ...r, who: concept?.name?.zh ?? roleName(D.extras, curRole()) } : null;
}   // 试听台上的（GS 预设；note = 鼓件，pad 任何键都敲它）；null = 月读 / 没选
const GS = SOUNDS["generaluser-gs-2.0.3"];
/** 试听台：从 GS 切出这个预设、载进实时合成器（22 ms + 几 MB）；换到月读 = 清掉。 */
async function setAudition(p: FinderPick | null): Promise<void> {
  // 键盘的音域跟着试听的那位走（user 2026-10-08「试弹的时候键盘上的音域没有跟进」）：月读 = 她的；乐器 = 目录里它的音域（没有 = 不画提示，窗口不动）
  //   GS 的音效预设试听 = 固定原速（仓鼠 v8；哪个键都一样，同鼓件，不提示）；其余 = 概念的常用音域
  const cat = p?.kind === "gs" ? (catalogNow ??= await loadCatalog(new URL(import.meta.url))) : null;
  const sk = cat && p?.kind === "gs" && p.provider.note === undefined ? sampleKeyOf(cat, p.provider.bank, p.provider.program) : null;
  auditionHint = !p || sk ? null : p.kind === "voice" ? TSUKUYOMI_RANGE : ((r) => (r ? { ...r, who: p.concept.names.zh } : null))(rangeOf(p.concept));
  if (auditionHint) pad.follow(auditionHint.lo, auditionHint.hi); else pad.render();
  if (!p || p.kind === "voice") { audition = null; sound.allOff(); return; }
  try {
    const bank = await sources.fetchSound(GS, (done) => progress(`下载 ${GS.name} ${Math.round((done / GS.bytes) * 100)}%`)); progress("");
    const subset = subsetSf2(bank, [{ bank: p.provider.bank, program: p.provider.program }]), sha256 = await sha256Hex(subset);
    audition = { bank: p.provider.bank, program: p.provider.program, ...(cat ? gsKeyArgs(cat, p.provider.bank, p.provider.program, p.provider.note) : {}), sha256, subset, label: p.provider.gmName };   // 音效默认固定原速（上场后也是）
    sound.allOff(); await engine.bank(sha256, subset);
  } catch (e) { progress(""); audition = null; showError(`试听不了：${(e as Error).message}`); }
}
/** GS 预设上场 / 试听时带的键设置：鼓件 = 固定那个键；音效（GM 116–128，仓鼠 v8 的 sampleKey）= **默认固定原速**（note = 原速键）+ 按值抄原速键和音高锚点（sfx）；
 *  其余不带（user 2026-10-08「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」）。 */
function gsKeyArgs(cat: Catalog, bank: number, program: number, drumNote?: number): { note?: number; sfx?: { key: number; midi?: number; centsPerKey?: number }; gapSec?: number; canSwell?: boolean } {
  // 连断的底色也是目录（仓鼠 v11 的 joint，按 GM 号逐个）按值给的；没有 = 不写 = 0（user「你不能按乐器一刀切」「让音乐仓鼠准备一下分类用的元数据」）
  const gap = jointOf(cat, bank, program, drumNote)?.gapSec, sus = sustainOf(cat, bank, program, drumNote);
  const g = { ...(gap ? { gapSec: gap } : {}), ...(sus && sus !== "sustained" ? { canSwell: false } : {}) };   // 仓鼠 v11 实测：不是一直能持续的 = 音内变强做不到
  if (drumNote !== undefined) return { note: drumNote, ...g };
  const sk = sampleKeyOf(cat, bank, program); if (!sk) return g;
  return { note: sk.key, sfx: { key: sk.key, ...(sk.midi !== undefined ? { midi: sk.midi } : {}), ...(sk.centsPerKey ? { centsPerKey: sk.centsPerKey } : {}) }, ...g };
}
/** 「记号怎么演」：这位演奏者 by value 带着的解读表，原样摊开（user 2026-10-08「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」）。现在只读；改数以后做。 */
function marksTableHtml(role: string, eng: string): string {
  const sp = activePerfSpec(D.extras, role), ms = (x: number) => `${Math.round(x * 1000)} ms`, pct = (x: number) => `${Math.round(x * 100)}%`, db = (x: number) => `${x > 0 ? "+" : ""}${x} dB`;
  const ign = ignoredArts(performerOf(eng), sp.gapSec), sung = performerOf(eng)?.sound === "chunks", gray = (m: string) => (ign.includes(m as Mark) ? ` class="ign"` : "");
  const singTxt = (k: string) => { const m = sp.sing[k]; return m ? `${m.at === "next" ? "下一个字" : "这个字"}前「${m.mark}」${m.mark === "^" ? "（顿一下，不换气）" : m.mark === "v" ? "（换气）" : "（大口换气）"}` : "不变成唱法记号"; };
  const vel = !!sp.dynamicsVel;
  // 这一类怎么变响 / 变轻（2026-10-08 深夜 Opus 5.5；user「月读吃音内减弱吗，普通减弱可以有一样的效果吗还是只影响输入的…月读又是弦又是管所以应该是实时调制的」
  //   「我觉得其实可以不同的类别乐器卡可以说一下」）：按这位实际走的那条路说（perform.ts：有力度表 = MIDI 力度，否则 = 音量曲线乘在出来的声音上）
  const how = vel
    ? `按下那一下的轻重（MIDI 力度）：渐强渐弱 = 每个新音一个台阶，按住的音中间不变；一个音里面要变，用音内起伏${sp.canSwell ? "" : "（这件乐器按下去就自然衰减：音内只能变弱）"}`
    : `一条连续的音量曲线（乘在${sung ? "唱" : "弹"}出来的声音上）：渐强渐弱在一个长音中间也一直在变，和音内起伏是同一种变法；只变响度、不变音色${sung ? "（真人渐弱会变虚、变暗，这个还没有）" : ""}`;
  const rows: [string, string, string][] = [
    ["力度怎么变", "", how],
    ["力度记号", "", vel ? `力度表：${(Object.entries(sp.dynamicsVel!) as [string, number][]).map(([d, x]) => `${d} ${x}`).join(" · ")}` : `音量：${(Object.entries(sp.dynamicsDb) as [string, number][]).map(([d, x]) => `${d} ${db(x)}`).join(" · ")}`],
    ["渐强渐弱没写终点", "", vel ? `走一档 = 力度 ${sp.wedgeStepVel}` : `走一档 = ${db(sp.wedgeStepDb)}`],
    ["幽灵音", "ghost", vel ? `力度 ${sp.ghostVel}` : `整个音 ${db(sp.ghostDb)}`],
    ["弱化", "unstress", vel ? `力度 ${sp.unstressVel}` : `整个音 ${db(sp.unstressDb)}`],
    ["次重音", "stress", vel ? `力度 +${sp.stressVel}` : `音头 ${ms(sp.accentSec)} ${db(sp.stressDb)}`],
    ["重音", "accent", vel ? `力度 +${sp.accentVel}` : `音头 ${ms(sp.accentSec)} ${db(sp.accentDb)}${sung ? `；${singTxt("accent")}` : ""}`],
    ["强音", "marcato", vel ? `力度 +${sp.marcatoVel}` : `音头 ${ms(sp.accentSec)} ${db(sp.marcatoDb)}${sung ? `；${singTxt("marcato")}` : ""}`],
    ["突强 sfz", "sfz", vel ? `力度 +${sp.sfzVel}` : `音头 ${db(sp.sfzDb)}，${ms(sp.sfzSec)} 里落回来${sung ? `；${singTxt("sfz")}` : ""}`],
    ["强后即弱 fp", "fp", `音头按 f，${ms(sp.fpSec)} 里落到 p，之后都是 p${sung ? `；${singTxt("fp")}` : ""}`],
    ["音内渐强 / 鼓起", "swellGrow", sp.canSwell ? `写的力度是最高点：< 从 −${sp.swellDb} dB 长到写的力度；<> 两头 −${sp.swellDb} dB、中间回到写的力度（强后即弱之后的 < 长回音头的 f）` : "做不到：这件乐器按下去就自然衰减"],
    ["音内渐弱", "swellFade", `一路往下到 −${sp.swellDb} dB`],
    ["跳音", "staccato", sung ? singTxt("staccato") : `唱 / 弹 ${pct(sp.staccatoGate)} 的长度`],
    ["保持", "tenuto", "这个音不留缝"],
    ["连线", "slur", "连到下一个音、不留缝"],
    ["呼吸", "breath", sung ? singTxt("breath") : `前一个音收短 ${ms(sp.breathSec)}（最多 ${pct(sp.breathShare)}）`],
    ["出声的换气（轻吸 / 深吸）", "inhale", sung ? "换气的空当里一声吸气（按下一个字的元音塑形，比它轻约 28 dB；深吸 = 空当长一点、响 4 dB）" : "做不到：这位只断开，不出吸气声"],
    ["气声（× 符头）", "whisper", sung ? "这个字不唱音高：用念的时候的气声（谱包络照旧、声带不振），再轻 6 dB" : "做不到：这位只按音高出声"],
    ["音和音之间", "", sung ? "连着唱" : `${ms(sp.gapSec)}（最多 ${pct(sp.gapShare)}）`],
  ];
  return `<details class="ip-marks"><summary>记号怎么演（这位自己的配置，跟着演奏者存进歌）</summary><table>${rows.map(([k, m, v]) => `<tr${gray(m)}><th>${k}</th><td>${esc(v)}${m && ign.includes(m as Mark) ? `<span class="ign-tag">不认</span>` : ""}</td></tr>`).join("")}</table></details>`;
}
/** 乐器页「音和音之间」的默认 + 说明：GS 货架上的 = 目录的 joint；自己的 .sf2 = 0（目录不认识）；元音版 = 0（人声连着唱）。目录还没载 = null（先载，载好重画）。 */
function gapDefaultOf(role: string): { gapSec: number; label: string } | null {
  const g = activeGm(D.extras, role);
  if (!g) return { gapSec: 0, label: "人声（连着唱）" };
  if (g.origin.library !== GS_LIBRARY_ID) return { gapSec: 0, label: "自己的 .sf2（目录里没有这个音色的连断数据）" };
  if (!catalogNow) { void loadCatalog(new URL(import.meta.url)).then((c) => { catalogNow = c; if (instShown()) drawInst(); }).catch(() => undefined); return null; }
  const j = jointOf(catalogNow, g.bank, g.program, g.note);
  return j ? { gapSec: j.gapSec, label: j.zh } : { gapSec: 0, label: "一下就完 / 音效（不留缝）" };
}
/** 用试听台上那位放本声部的开头（前 8 秒；走录音房，不写谱）。 */
async function playHeadWith(p: FinderPick): Promise<void> {
  if (engine.playing) stopPlay();
  const { tokens, map } = curFlat(), notes = lightNotes(tokens, map).filter((n) => n.t0 < 8);
  if (!notes.length) { info("谱上还没有音"); return; }
  singer.unlock();
  let track: TrackSpec, label: string;
  if (p.kind === "voice") { await ensureVowels(); track = { id: "audition", kind: "vowel", kana: HUM_KANA[D.st.song.hum ?? "n"], notes: notes.map((n) => ({ t0: n.t0, t1: Math.min(n.t1, 8), key: n.midi, vel: 1, preset: 0 })), gain: null }; label = "小月相（哼）"; }
  else {
    if (!audition || audition.bank !== p.provider.bank || audition.program !== p.provider.program) await setAudition(p);
    if (!audition) return;
    const a = audition;
    track = { id: "audition", kind: "sf", sha: a.sha256, notes: notes.map((n) => ({ t0: n.t0, t1: Math.min(n.t1, 8), key: sfKey(n.midi, a), vel: SOUNDFONT_DEFAULTS.velocity, preset: engine.presetIndex(a.sha256, a.bank, a.program) })), gain: null }; label = a.label;
  }
  const to = Math.min(8, Math.max(...notes.map((n) => n.t1)));
  await previewTrack(track, to, label);   // 临时轨进录音房、从 0 放到 to（src/app/performance.ts）
}
/** 上场：角色改成这个概念（谱上写它的英文名 + 官方 id + id 束 by value），再造演奏者。
 *  声音默认弱引用（2026-10-08 by Claude Opus 5.5；user「我后悔自动embed音源了，改成弱引用吧，app可以自己找吗」）：歌里只记来源 + 子集 sha256，
 *  GS 整包在设备缓存 / 家族音源库里找得到；要歌自己带着声音 = 文件菜单「全部打包进歌」，或导出「打包音源」的副本。 */
async function castPick(p: FinderPick): Promise<void> {
  if (finderPlayOnly()) return;   // 只弹着玩：没有要写进去的歌
  const cat = await loadCatalog(new URL(import.meta.url)), c = p.concept;
  const sound = p.kind === "gs" ? (p.provider.sound ?? roleSoundOf(cat, c)) : roleSoundOf(cat, c);
  updateExtras(withRoleConcept(D.extras, curRole(), { name: roleNameOf(c), sound, concept: { ids: { wikidata: c.ids.wikidata, local: c.ids.local, musicxml: c.ids.musicxml, gm: c.ids.gm.map((g) => ({ program: g.program, bank: g.bank })), hs: c.ids.hs }, name: { zh: c.names.zh, en: c.names.en, ...(c.names.ja ? { ja: c.names.ja } : {}) } } }, D.st.song.hum), { kind: "lounge", label: `「${roleNameOf(c)}」改成这个乐器` }, "cast");
  if (p.kind === "voice") { setActive(CANDIDATE_ID.full); closeFinder(); return; }
  if (!audition || audition.bank !== p.provider.bank || audition.program !== p.provider.program) await setAudition(p);
  if (!audition) { view.render(); renderTitle(); return; }
  const { subset, sha256 } = audition, inf = sf2Info(subset);
  const fileSha256 = GS.sha256;   // 试听台的整包 = 货架上的那份（哈希就是目录钉的）
  updateExtras(withSf2Candidate(D.extras, curRole(), { name: p.provider.gmName, bank: p.provider.bank, program: p.provider.program, ...gsKeyArgs(cat, p.provider.bank, p.provider.program, p.provider.note), subset, sha256, embed: false,
    origin: { name: GS.name, fileSha256, bytes: GS.bytes, library: GS.id }, credit: { attribution: [GS.attribution], license: { name: GS.license.name, url: GS.homepage ?? GS.source, text: inf.comment } } }, D.st.song.hum), { kind: "lounge", label: `「${roleNameOf(c)}」上场：${p.provider.gmName}` }, "cast");
  sources.session.keep(sha256, subset);
  closeFinder(); setActive(activeId(D.extras, curRole())); info(`「${roleNameOf(c)}」换成：${p.provider.gmName}`);
}
const finder = new Finder($("stage"), { base: new URL(import.meta.url), roleName: () => roleName(D.extras, curRole()), audition: setAudition, playHead: playHeadWith, cast: castPick, close: () => closeFinder(), togglePad: () => showPad(padEl.hidden) });
// ── 录音室（src/ui/studio.ts）：全屏替掉谱区，一个声部一条推子条；增益 / 声像进录音房（studio.json），静音 / 独奏 = partView ──
const partLabel = (id: string): string => { const k = D.st.song.parts.findIndex((p) => p.id === id); return k < 0 ? id : partLabels(D.st.song, D.extras)[k]; };
const studio = new Studio($("stage"), {
  strips: () => { const labels = partLabels(D.st.song, D.extras), cols = partColorIndices(D.st.song.parts.map((p) => roleSound(D.extras, p.role))); return D.st.song.parts.map((p, k) => ({ id: p.id, name: labels[k], color: TAB20[cols[k]], refs: D.st.song.papers.filter((pp) => pp.tracks[p.id]).length, performer: activeCandidateName(D.extras, p.role) ?? "（没人上场）", ...micOf(p), muted: pv(p.id).muted, solo: pv(p.id).solo })); },
  setGain: (id, dB) => { const p = D.st.song.parts.find((x) => x.id === id); if (p) updateExtras(withMic(D.extras, p.mic, { gainDb: dB }), { kind: "studio", label: `${partLabel(id)} 增益 ${dB > 0 ? "+" : ""}${dB.toFixed(1)} dB` }, `mix:gain:${id}`); },
  setPan: (id, pan) => { const p = D.st.song.parts.find((x) => x.id === id); if (p) updateExtras(withMic(D.extras, p.mic, { pan }), { kind: "studio", label: `${partLabel(id)} 声像 ${Math.abs(pan) < 0.025 ? "中" : pan < 0 ? `左 ${Math.round(-pan * 100)}` : `右 ${Math.round(pan * 100)}`}` }, `mix:pan:${id}`); },
  toggleMute: (id) => { setPv(id, { muted: !pv(id).muted }); afterViewChange(); },   // 放着的时候马上静（录音房推子到底、发送一起停）+ 时间线重算（v0.10.38；user「我mute了之后它的reverb为什么还是进了reverb轨？」）
  toggleSolo: (id) => { setPv(id, { solo: !pv(id).solo }); afterViewChange(); },
  play: () => playPause(),
  close: () => closeStudio(),
  master: () => activeMaster(D.extras),
  setMasterGain: (dB) => updateExtras(withMaster(D.extras, { gainDb: dB }), { kind: "studio", label: `总轨增益 ${dB > 0 ? "+" : ""}${dB.toFixed(1)} dB` }, "mix:master"),
  bypass: () => perfApi.mixBypass, setBypass: (on) => { perfApi.mixBypass = on; pushChannels(); diagNote("studio", `bypass ${on ? "on" : "off"}`); },
  toggleLimiter: () => { const on = !activeMaster(D.extras).limiter; updateExtras(withMaster(D.extras, { limiter: on }), { kind: "studio", label: `母线限幅${on ? "开" : "关"}` }); },
  // 插件格（v0.10.8）：总轨 = studio.json master.chain；歌手 = 它那条麦克风轨的 chain
  chain: (track) => (track === STUDIO_MASTER ? activeMaster(D.extras).chain : studioTrack(D.extras, trackKey(track))?.chain ?? []),
  resolve: (track, fx) => resolveChain([fx], { lowestMidi: D.st.song.parts.some((x) => x.id === track) ? lowestMidiOf(track) : null, bpm: songBpm() })[0],   // 和 pushChannels 同一份换算
  setChain: (track, chain, label, merge) => {
    if (track === STUDIO_MASTER) { updateExtras(withMaster(D.extras, { chain }), { kind: "studio", label }, merge); return; }
    updateExtras(withTrack(D.extras, trackKey(track), { chain }), { kind: "studio", label }, merge);
  },
  // 被谁压（侧链）：录音房只给歌手轨的压缩器接 key（总线 / 总轨上的压缩器听自己）
  tabChanged: () => syncSpectrum(),
  keyTracks: (track) => { if (!D.st.song.parts.some((p) => p.id === track)) return []; const labels = partLabels(D.st.song, D.extras); return D.st.song.parts.flatMap((p, k) => (p.id === track ? [] : [{ id: p.id, name: labels[k] }])); },
  // 路由轨（v0.10.9；user「插件：可以随便插，比如混响也是，你可以做中间的路由轨。比如我可以放两个路由轨然后放混响」「有一个默认总线，就是歌手和输出都是builtin的，但是你可以加混音轨」）
  buses: () => studioTracks(D.extras).filter((t) => t.kind === "bus").map((b) => ({ id: b.id, name: b.name, gainDb: b.gainDb, pan: b.pan, bypass: b.bypass, muted: busMuted.has(b.id) })),
  toggleBusMute: (id) => { if (!busMuted.delete(id)) busMuted.add(id); pushChannels(); },   // 混音轨静音：视图态（不进文件、不进 undo），同歌手的静音
  setBusBypass: (id, on) => updateExtras(withTrack(D.extras, id, { bypass: on }), { kind: "studio", label: `${studioTrack(D.extras, id)?.name ?? id} ${on ? "旁通" : "取消旁通"}` }),
  addBus: () => { const id = newBusId(D.extras), n = studioTracks(D.extras).filter((t) => t.kind === "bus").length + 1, name = `混音轨 ${n}`; updateExtras(withTrack(D.extras, id, { kind: "bus", name }), { kind: "studio", label: `加${name}` }); return id; },
  removeBus: (id) => { const name = studioTrack(D.extras, id)?.name ?? id; updateExtras(withoutBus(D.extras, id), { kind: "studio", label: `删${name}` }); },
  renameBus: (id, name) => updateExtras(withTrack(D.extras, id, { name }), { kind: "studio", label: `改名「${name}」` }),
  movePart: (id, dir) => { update(movePart(D.st, id, dir)); renderTitle(); },   // 和谱上声部菜单的「上移 / 下移」同一个
  moveBus: (id, dir) => updateExtras(moveBus(D.extras, id, dir), { kind: "studio", label: `${studioTrack(D.extras, id)?.name ?? id} 往${dir < 0 ? "前" : "后"}挪` }),
  setBusGain: (id, dB) => updateExtras(withTrack(D.extras, id, { gainDb: dB }), { kind: "studio", label: `${studioTrack(D.extras, id)?.name ?? id} 增益 ${dB > 0 ? "+" : ""}${dB.toFixed(1)} dB` }, `mix:gain:${id}`),
  setBusPan: (id, pan) => updateExtras(withTrack(D.extras, id, { pan }), { kind: "studio", label: `${studioTrack(D.extras, id)?.name ?? id} 声像` }, `mix:pan:${id}`),
  outTo: (track) => studioTrack(D.extras, trackKey(track))?.to ?? "master",
  setOutTo: (track, to) => updateExtras(withTrack(D.extras, trackKey(track), { to }), { kind: "studio", label: `${routeName(track)} 出到 ${routeName(to)}` }),
  sends: (track) => studioTrack(D.extras, trackKey(track))?.sends ?? [],
  setSends: (track, sends, label, merge) => updateExtras(withTrack(D.extras, trackKey(track), { sends }), { kind: "studio", label: `${routeName(track)} ${label}` }, merge),
  /** 这条轨能出到 / 发给的路由轨：除了自己，以及会接成环的（从那条走得回这条的）。 */
  targets: (track) => { const all = studioTracks(D.extras).filter((t) => t.kind === "bus"), key = trackKey(track), next = (id: string) => { const t = all.find((x) => x.id === id); return t ? [t.to, ...t.sends.map((x) => x.to)].filter((x) => x && x !== "master") : []; };
    const reaches = (from: string, to: string) => { const seen = new Set<string>(), stk = [from]; while (stk.length) { const x = stk.pop()!; if (x === to) return true; if (seen.has(x)) continue; seen.add(x); stk.push(...next(x)); } return false; };
    return all.filter((b) => b.id !== key && !reaches(b.id, key)).map((b) => ({ id: b.id, name: b.name })); },
  /** 删一位歌手：只删一张纸都不在的（没引用 = 没有音会丢）；休息室里它的角色一起删；能撤销。 */
  deletePart: (id) => {
    const p = D.st.song.parts.find((x) => x.id === id); if (!p || D.st.song.papers.some((pp) => pp.tracks[id])) return;
    const name = partLabel(id);
    updateBoth(removePart(D.st, id), withoutRole(D.extras, p.role), { kind: "studio", label: `删掉歌手「${name}」` });
    studio.render(); renderTitle(); info(`删掉了「${name}」（撤销能找回来）`);
  },
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
function syncSpectrum(): void { const on = studio.isOpen && document.visibilityState === "visible"; engine.spectrum(on && studio.currentTab === "eq"); engine.stereo(on && studio.currentTab === "basic"); }
function openFinder(): void {
  const back = instShown(); if (back) instEl.hidden = true;   // 从乐器页开的：关了回乐器页
  ui.setPage({ k: "finder", playOnly: gallery?.isOpen() ?? false, backToInst: back });
  document.body.classList.toggle("finder-over-gallery", finderPlayOnly());   // 舞台整层盖到歌库上面（styles.css）
  ui.close(); scoreEl.hidden = true; ws.tryout = padLocked(ui.page); showPad(true); padEl.classList.add("is-locked"); pad.clearHeld(); pad.render(); void finder.show({ playOnly: finderPlayOnly() }); updateChrome(); }   // 「弹」亮着 = pad 只弹不写
/** back = 关了回乐器页（默认 = 它是从乐器页开的）；开混音台 / 开乐器页 / 进歌库时传 false = 不回。 */
function closeFinder(back: boolean = ui.page.k === "finder" && ui.page.backToInst): void { if (!finder.isOpen) return; const wasPlayOnly = finderPlayOnly(); ui.setPage({ k: "score" }); if (wasPlayOnly) document.body.classList.remove("finder-over-gallery"); finder.hide(); audition = null; auditionHint = null; sound.allOff(); padEl.classList.remove("is-locked"); ws.tryout = back; applyWorkspace(); pad.render(); scoreEl.hidden = false; void prepareBank(); view.render(); renderTitle(); updateChrome(); scoreEl.focus(); if (back) openInstPage(); }
/** 换台上的演奏者（人选的，不自动）：改休息室快照里的 active，重画谱前的歌手牌。 */
function setActive(id: string): void { const next = withActive(D.extras, curRole(), id, D.st.song.hum); updateExtras(next, { kind: "lounge", label: `「${roleName(next, curRole())}」换人：${activeCandidateName(next, curRole()) ?? id}` }); sound.allOff(); void prepareBank(); view.render(); renderTitle(); }
/** 作者栏（标题下面靠右那一块点开）：一块纯文本，纸上照写的显示（不认「作词：」这类格式，所见即所得）。
 *  不提醒、不帮用户写任何东西（user「只是举例子，然后这个你也不应该强迫或者提醒用户写这个，因为谱子也不绑定乐器的」「…一键插入按钮 不要」）。 */
function openCreditsSheet(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card credits-card"><div class="offer-title">作者栏</div>` +
    `<textarea id="crIn" class="credits-in" rows="5" spellcheck="false" placeholder="几行都行，照写的显示在纸上（标题下面靠右）">${esc(D.st.song.credits ?? "")}</textarea>` +
    `<div class="offer-msg">可不填。存进 MusicXML「印在页面上的字」，别的乐谱软件打开也在纸上。</div>` +
    // 这首歌自己的许可（user 2026-10-08「你计算的时候别忘了用户自己写的那一部分，用户可以选」）：默认不写、不替用户选；选了照抄进 <rights>，还能改
    // 折叠着（user「只有用户自己关心协议的时候才提出这些」）：选过许可才默认展开
    `<details class="rights-sec"${D.st.song.rights ? " open" : ""}><summary class="part-sec">许可（可选；你写的这部分：词 / 曲 / 编）</summary><div class="set-row">` +
    `<button class="btn cand" data-r="-1" title="不写：法律默认 = 保留所有权利（别人用要先问你）">未声明（默认）</button>` + RIGHTS_PRESETS.map((p, k) => `<button class="btn cand" data-r="${k}" title="${esc(p.note)}">${esc(p.label)}</button>`).join("") + `</div>` +
    `<input id="rtIn" class="credits-in rights-in" type="text" spellcheck="false" autocomplete="off" placeholder="空着 = 未声明（法律默认就是保留所有权利）；也可以自己写" value="${esc(D.st.song.rights ?? "")}" />` +
    `<div class="offer-msg">从紧到松排；CC 那几个发出去以后对已经发出去的收不回。存进 MusicXML 的 &lt;rights&gt;；导出 mp3 时连同署名写进文件的标签里。</div></details>` +
    `<div class="offer-btns"><button class="btn primary" data-v="ok">好</button></div></div>`;
  document.body.append(box);
  const ta = box.querySelector<HTMLTextAreaElement>("#crIn")!, rt = box.querySelector<HTMLInputElement>("#rtIn")!;
  const close = () => { update(setRights(setCredits(D.st, ta.value), rt.value)); box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const t = e.target as HTMLElement, r = t.closest<HTMLElement>("[data-r]")?.dataset.r;
    if (r !== undefined) { const k = Number(r); rt.value = k < 0 ? "" : RIGHTS_PRESETS[k].text(new Date().getFullYear()); rt.focus(); return; }
    const v = t.closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "ok") close();
  });
  ta.focus();
}
/** 纸的设置（纸右上角的小钮点开）：A4 / A5 / A6，整首歌一个；以后插图片也从这里进（user「加图片的入口以后也可以放那里」）。改了立刻生效。 */
function openPaperSheet(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  const draw = () => {
    const p = D.st.song.paper ?? paperOf(DEFAULT_PAPER);
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">纸</div><div class="set-row">` +
      PAPER_KINDS.map((k) => `<button class="btn cand${p.kind === k ? " is-on" : ""}" data-v="${k}">${PAPER_LABEL[k]}<small>${PAPER_NOTE[k]}</small></button>`).join("") +
      (p.kind === "other" ? `<button class="btn cand is-on" data-v="other">其他<small>${paperSizeText(p)}</small></button>` : "") + `</div>` +
      `<div class="offer-msg">整首歌一张纸。纸越大一行放的小节越多；屏幕放得下就照纸排。不打印的时候不分页。</div>` +
      `<div class="part-sec">版式</div><div class="set-row">` +
      DENSITIES.map((z) => `<button class="btn cand${densityOf(p) === z.id ? " is-on" : ""}" data-v="density:${z.id}">${z.label}<small>${z.note}</small></button>`).join("") + `</div>` +
      `<div class="offer-msg">紧凑 = 谱小一号、行距和谱距收紧、没写歌词的声部不留歌词位。存进 MusicXML 的 scaling 和行距，别的软件打开也一样。</div>` +
      `<div class="part-sec">纸（曲段）</div>` + D.st.song.papers.map((pp, k) => `<div class="set-row paper-row"><span class="paper-row-name">${k + 1}. ${esc(pp.name || "（没名字）")}${pp.hidden ? "（隐藏 · 不放）" : ""}${pp.id === D.st.at.paper ? " ←" : ""}</span>` +
        `<button class="btn" data-v="pm:${esc(pp.id)}" title="这张纸的菜单：改名 / 挪 / 加声部 / 删">⋯</button></div>`).join("") +
      `<div class="set-row"><button class="btn" data-v="addpaper">＋ 新的纸（接在最后）</button></div>` +
      // 只看一号轨（v0.9.29；user 2026-10-10「然后视图加一个只看一号轨的功能」）：= 全曲第一位歌手的「只看它」（速度 / 风格 / 反复写在每张纸最上面那位身上）；和歌手牌那个是同一个开关
      ((one) => `<div class="part-sec">显示</div><div class="set-row"><button class="btn cand${one && pv(one.id).only && D.st.song.parts.every((q) => q === one || !pv(q.id).only) ? " is-on" : ""}" data-v="only1">只看一号轨<small>只看「${esc(partLabels(D.st.song, D.extras)[0] ?? "")}」（速度、风格、反复写在最上面那位身上）；再点 = 都看</small></button></div>`)(D.st.song.parts[0]) +
      `<div class="part-sec">排法</div><div class="set-row">` +
      `<button class="btn cand${pageFlow || scrollFlow ? "" : " is-on"}" data-v="flow:cont">连续<small>不断页，每一行和分页一样</small></button>` +
      `<button class="btn cand${pageFlow && !scrollFlow ? " is-on" : ""}" data-v="flow:pages">分页<small>按纸（A4 / A5）的真实高度断页，预览打印</small></button>` +
      `<button class="btn cand${scrollFlow ? " is-on" : ""}" data-v="flow:scroll">横卷<small>每张纸一行、一直往右，横着滚；歌手名钉在左边</small></button></div>` +
      `<div class="part-sec">小节号</div><div class="set-row">` +
      `<button class="btn cand${D.st.song.barNumbers === "off" ? "" : " is-on"}" data-v="bn:on">每行开头<small>每行最上面那条谱的左上角，小字；每张纸从 1 数，弱起算 0</small></button>` +
      `<button class="btn cand${D.st.song.barNumbers === "off" ? " is-on" : ""}" data-v="bn:off">不印</button></div>` +
      `<div class="part-sec">歌词</div><div class="set-row">` +
      `<button class="btn cand${D.st.song.lyricFit === "lyrics" ? "" : " is-on"}" data-v="lyr:rhythm">按节奏<small>音的位置只看时值，打字时音符不动；歌词让路：借旁边的空 → 小一号 → 上下错开 → 还放不下画灰</small></button>` +
      `<button class="btn cand${D.st.song.lyricFit === "lyrics" ? " is-on" : ""}" data-v="lyr:lyrics">按歌词<small>长的字把音推开（出版谱的老规矩）</small></button></div>` +
      `<div class="part-sec">屏幕放不下纸的时候</div><div class="set-row">` +
      `<button class="btn cand${reflow ? "" : " is-on"}" data-v="fit">不折行<small>整张纸缩小，行和纸上一样</small></button>` +
      `<button class="btn cand${reflow ? " is-on" : ""}" data-v="reflow">折行<small>按屏幕宽排，谱大一点</small></button></div>` +
      `<div class="offer-msg">以后插图片也在这里。</div>` +
      `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  };
  draw();
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v && (PAPER_KINDS as string[]).includes(v)) { update(setPaper(D.st, v as PaperKind)); draw(); }
    else if (v?.startsWith("density:")) { update(setDensity(D.st, v.slice(8) as Density)); draw(); }
    else if (v === "addpaper") { close(); update(addPaper(D.st)); info("新的一张纸"); }
    else if (v?.startsWith("pm:")) { close(); openPaperMenu(v.slice(3)); }
    else if (v === "fit" || v === "reflow") { reflow = v === "reflow"; view.render(); draw(); }
    else if (v === "bn:on" || v === "bn:off") { update(setBarNumbers(D.st, v === "bn:on")); draw(); }   // 小节号（v0.9.42）：进歌里、能撤销；PDF 跟着
    else if (v === "lyr:lyrics" || v === "lyr:rhythm") { update(setLyricFit(D.st, v === "lyr:rhythm" ? "rhythm" : "lyrics")); draw(); }   // 歌词怎么排（v0.9.40）：进歌里、能撤销；PDF 跟着
    else if (v === "flow:cont" || v === "flow:pages" || v === "flow:scroll") { pageFlow = v === "flow:pages"; scrollFlow = v === "flow:scroll"; view.render(); view.followNow(); draw(); }
    else if (v === "scope:all" || v === "scope:segment") { viewScope = v === "scope:all" ? "all" : "segment"; view.render(); draw(); }
    else if (v === "only1") {
      const one = D.st.song.parts[0]; if (!one) return;
      const on = pv(one.id).only && D.st.song.parts.every((q) => q === one || !pv(q.id).only);
      for (const q of D.st.song.parts) setPv(q.id, { only: !on && q === one });
      afterViewChange(); draw();
    }
  });
}
/** 角色卡（第一行谱号左边的角色名）点开（user「歌手牌同意，和打谱软件对齐」→「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西…
 *  所以是你可以写或者选role的名字，帮我多想几个preset。然后名字之外再选乐器」）：
 *  上 = 角色名（谱上写的、MusicXML <part-name>；写或者点预设），中 = 谁来演（乐器 = 候选，名字不上谱——窄接口），下 = 就地改它的设置。改了立刻生效。
 *  现在一个声部、乐器只有月读（完整 / 轻量）= 多乐器的占位（数据契约「每个声部在谱号前面选角色和麦克风」）。 */
const HUMS: [Hum, string][] = [["n", "ん / 嗯"], ["a", "あ / 啊"], ["o", "お / 哦"], ["u", "う / 呜"], ["la", "ら / 啦"]];
/** 要画的声部：谱上写角色名（同名同种带号）、没人上场的画淡色、第一个声部上面画速度；隐藏的缩成细行；名字下面打出声 / 显示的角标。 */
/** 每个声部唱不出来的歌词（token id → 为什么；纪律「做不到的一律画灰 + 明说」）。按歌 + 休息室缓存（每次重画都要，别每次重算）。 */
let lyricMuteKey: unknown[] = [], lyricMuteVal = new Map<string, Map<number, LyricIssue>>();
function lyricMutes(): Map<string, Map<number, LyricIssue>> {
  if (lyricMuteKey[0] === D.st.song && lyricMuteKey[1] === D.extras) return lyricMuteVal;
  const out = new Map<string, Map<number, LyricIssue>>();
  const order = songPlayOrder(D.st.song), map = timeMapOf(D.st.song, order);
  for (const p of D.st.song.parts) {
    const eng = activeInstrument(D.extras, p.role)?.engine ?? null, mode = activeSingChunk(D.extras, p.role), m = new Map<number, LyricIssue>();
    // 语言 = 小月相唱的那一段的语言，和唱的时候同一份（sungPlan：按编排压平 + 速度表 + 这位的分段唱设置）；编排没点到 / 隐藏的纸压不进来 = 那张纸自己算（没速度表，段界只差在卡着 0.25 s 的休止上）
    const flat = flattenPart(D.st.song, p.id, { order }), fl = sungPlan(flat.tokens, map, flat.starts.map((s) => s.index), mode, D.st.song.hum).at, byId = new Map(flat.tokens.map((t, i) => [t.id, fl[i]]));
    for (const paper of D.st.song.papers) {
      const toks = paper.tracks[p.id]; if (!toks) continue;
      const own = toks.some((t) => !byId.has(t.id)) ? sungPlan(toks, undefined, [], mode, D.st.song.hum).at : null;
      for (const [i, x] of lyricIssues(toks, performerOf(eng)?.lyrics ?? null, (i) => byId.get(toks[i].id) ?? own![i])) m.set(toks[i].id, x);
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
  return lyricWhyText(x, roleName(D.extras, p.role));
}
// ── 歌词旁显示引擎念成什么（v0.9.34，2026-10-10 Opus 5.5；user「小件做」，AI 提的「歌词框 / 歌手牌里显示引擎念成什么」）：
//    全假名时日语前端会把助词 は 注成 ha（团子 B「としよりだんごはめを」= ha-me），user 不懂日语看不出来，看得见才能自己改成 わ。
//    读音 = 唱的时候同一份第 1 步（sing-core readingCore），按这一句的唱谱内容缓存；只在月读上场、引擎已经起来时有（不为看读音起引擎、下模型）。
let readPlans: { song: Song; part: string; view?: ChunkPlan[]; segment?: ChunkPlan[] } | null = null;
const readings = new Map<string, Reading>(), readAsked = new Set<string>(); let readRetryAt = 0;
function readPlanOf(tokId: number, part: PartDef): ChunkPlan | null {
  if (!readPlans || readPlans.song !== D.st.song || readPlans.part !== part.id) readPlans = { song: D.st.song, part: part.id };
  for (const scope of ["view", "segment"] as const) {   // 放的时候那一句（视图 / 编排）；不在里面（编排没点到这张纸）= 这张纸单独
    const chunks = (readPlans[scope] ??= ((song) => buildTimeline({ song, order: songPlayOrder(song), parts: [part], info: performerInfo, hum: D.st.song.hum, singOpt: humOpt() }).chunks)(songIn(scope)));
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
  if (!r.labels) return { parts, at: -1, note: `小月相念出来 ${r.said.length} 个音节、谱上 ${s.SCORE.length} 个，对不上（唱的时候会报错）：` };
  return { parts, at: plan.entryOf.get(t.id) ?? -1, note: s.LANG === "zh" ? "小月相念成（音素 + 声调）：" : "小月相念成：" };
}
/** 每位歌手的类别色（tab20 下标）和谱前简写（v0.9.31；user「乐手名和颜色同意」）。简写要目录（仓鼠 v12 的 abbr）：没载就先缩名字，载好了重画。 */
function partLooks(): { colors: number[]; abbrs: string[] } {
  const labels = partLabels(D.st.song, D.extras), sounds = D.st.song.parts.map((p) => roleSound(D.extras, p.role));
  const colors = partColorIndices(sounds);
  const needCat = !catalogNow && D.st.song.parts.some((p) => !!(D.extras.lounge[p.role] as { concept?: unknown } | undefined)?.concept);
  if (needCat) void loadCatalog(new URL(import.meta.url)).then((c) => { catalogNow = c; view.render(); }).catch(() => undefined);
  const abbrs = D.st.song.parts.map((p, k) => {
    const ids = (D.extras.lounge[p.role] as { concept?: { ids?: { wikidata?: string | null; local?: string | null } } } | undefined)?.concept?.ids;
    const c = catalogNow && ids ? (ids.wikidata ? catalogNow.byId.get(ids.wikidata) : undefined) ?? (ids.local ? catalogNow.byId.get(ids.local) ?? catalogNow.byId.get(`x:${ids.local}`) : undefined) : undefined;
    return partAbbr(labels[k], { ...(c ? { conceptNames: [c.names.en, c.names.zh], ...(c.abbr?.en ? { conceptAbbr: c.abbr.en } : {}) } : {}), voice: sounds[k].startsWith("voice.") });
  });
  return { colors, abbrs };
}
function partViews(): PartView[] {
  const labels = partLabels(D.st.song, D.extras), mutes = lyricMutes(), looks = partLooks();
  return D.st.song.parts.map((p, k) => {
    const v = pv(p.id), badges = [v.muted ? "静音" : "", v.solo ? "独奏" : "", v.only ? "只看它" : "", issueParts.has(p.id) ? "不出声" : ""].filter(Boolean);   // 不出声 = 清单里有它（§2.2½ 出口 ①）
    const eng = activeInstrument(D.extras, p.role)?.engine ?? "unknown", plug = performerOf(eng);
    const lm = mutes.get(p.id);
    // 台上这位不唱字（乐器 / 元音版）：谱下空着的歌词位点了不开框（user 2026-10-10「wishlist 不支持唱歌的track可以删歌词，但是不会误点创建歌词文本框」）；没人上场的照旧能写（多半等着请月读）
    const ly = plug?.lyrics, noLyrics = ly === "hum" || ly === "none" ? `${labels[k]}${ly === "hum" ? "（元音版）只哼" : "不唱歌词"}：空着的歌词位不开框；已经写了的字点开能改、能删` : "";
    return { ...(noLyrics ? { noLyrics } : {}), ...(lm && lm.size ? { lyricMute: new Set(lm.keys()) } : {}), id: p.id, name: labels[k], abbr: looks.abbrs[k], colorIdx: looks.colors[k], empty: !plug, first: k === 0, ...(p.clef ? { clef: p.clef } : {}), ...(p.staves === 2 ? { staves: 2 as const } : {}), hidden: !isShown(p.id), badges, mono: !plug?.poly, ...(plug?.notation?.({ extras: D.extras, role: p.role }) ?? {}), ignores: ignoredFor(p.role) };   // xHead = 台上那位固定敲一个键（鼓件 / 音效固定原速）→ 谱上画 ×；perc = 鼓 / 音效 → 鼓谱（一线谱 / 五线鼓谱，v0.10.27，有 perc 时符头按仓鼠的表、不画 ×）
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
 *  光标跳过去、开它的乐器页挑乐器。 */
function addNewPart(paper = D.st.at.paper, giveFrom?: string): void {
  const role = newRoleId(D.extras, D.st.song), mic = newMicId(D.extras, D.st.song);
  const id = `P${Math.max(0, ...D.st.song.parts.map((p) => Number(/^P(\d+)$/.exec(p.id)?.[1] ?? 0))) + 1}`;
  let next = addPart(D.st, { id, role, mic }, giveFrom ? null : paper);
  if (giveFrom) next = rebindTrack(next, paper, giveFrom, id);
  updateBoth(next, withNewRole(D.extras, role, D.st.song.hum), { kind: "score", label: giveFrom ? "这一行交给了新歌手" : "加了一位歌手" });
  renderTitle();
  openInstPage();   // 新歌手：先给它挑乐器
}
/** 纸的菜单（纸顶「⋯」）：改曲段名、挪、在后面加一张、这张纸上加 / 不加某个声部、删这张纸。 */
function openPaperMenu(id: string): void {
  ui.close();
  const paper = D.st.song.papers.find((p) => p.id === id); if (!paper) return;
  const k = D.st.song.papers.indexOf(paper), labels = partLabels(D.st.song, D.extras);
  const absent = D.st.song.parts.flatMap((p, i) => (paper.tracks[p.id] ? [] : [{ id: p.id, name: labels[i] }]));
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${esc(paper.name || `第 ${k + 1} 张纸`)}</div>` +
    `<div class="set-row"><button class="btn" data-v="name">改曲段名…</button><button class="btn" data-v="up"${k === 0 ? " disabled" : ""}>上移</button><button class="btn" data-v="down"${k === D.st.song.papers.length - 1 ? " disabled" : ""}>下移</button><button class="btn" data-v="add">在它后面加一张纸</button><button class="btn" data-v="transpose" title="这张纸 / 整首所有声部一起移调、转调（调号跟着挪）">移调 / 转调…</button>` +
    `<button class="btn${paper.hidden ? " is-on" : ""}" data-v="hide" title="隐藏 = 不放、不进压平件；谱上折叠着，翻页能进去">${paper.hidden ? "显示（现在隐藏着）" : "隐藏（不放）"}</button></div>` +
    (absent.length ? `<div class="part-sec">这张纸上加歌手</div><div class="set-row">${absent.map((a) => `<button class="btn cand" data-v="track:${esc(a.id)}">${esc(a.name)}</button>`).join("")}</div>` : "") +
    `<div class="set-row"><button class="btn" data-v="newpart" title="新的一位歌手，只出现在这张纸上">＋ 新歌手…</button>${D.st.song.papers.length > 1 ? `<button class="btn cand danger" data-v="del">删这张纸…</button>` : ""}</div>` +
    `<div class="offer-msg">纸 = 曲段：每张纸是一个新的开始，各声部在这里重新对齐；一张纸上要哪些声部随它。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    if (v === "name") { close(); view.title.openNow(id); return; }
    if (v === "up" || v === "down") { update(movePaper(D.st, id, v === "up" ? -1 : 1)); close(); return; }
    if (v === "add") { update(addPaper(D.st, id)); close(); info("新的一张纸"); return; }
    if (v === "transpose") { close(); const r = scoreEl.getBoundingClientRect(); openTransposeMenu(id, { x: r.left + r.width / 2, y: r.top + 60 }); return; }
    if (v === "hide") { update(setPaperHidden(D.st, id, !paper.hidden)); close(); info(paper.hidden ? "这张纸显示了（会放）" : "这张纸隐藏了（不放）"); return; }
    if (v.startsWith("track:")) { update(addTrack(D.st, id, v.slice(6))); close(); return; }
    if (v === "newpart") { close(); addNewPart(id); return; }
    if (v === "del") {
      close();
      void askSheet(`删掉「${paper.name || `第 ${k + 1} 张纸`}」？`, "这张纸上所有声部写的东西一起删掉（能撤销：撤销 / Ctrl+Z）。", "删").then((ok) => { if (ok) update(removePaper(D.st, id)); });
    }
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
  box.className = "track-card"; box.setAttribute("role", "dialog");
  let page: "main" | "give" | "add" = "main";   // give = 这一行交给…（换绑）；add = 这张纸上加歌手
  const draw = () => {
    const me = curPart(), v = pv(me.id), k = D.st.song.parts.indexOf(me), labels = partLabels(D.st.song, D.extras), label = labels[k] ?? "";
    const here = D.st.song.papers.find((p) => p.id === D.st.at.paper)?.tracks ?? {};
    // 换绑 / 加歌手（2026-10-08，user「已有的track绑换不同的声部」「这一段交给别的歌手 就是我刚才说的换绑」「新歌手只出现在当前这张纸嗯」）：只改这一张纸
    if (page !== "main") {
      const list = page === "give" ? D.st.song.parts.filter((p) => p.id !== me.id) : D.st.song.parts.filter((p) => !here[p.id]);
      box.innerHTML = `<div class="tc-sub"><button class="btn" data-v="back">‹ ${page === "give" ? `「${esc(label)}」这一行交给…` : "这张纸上加歌手"}</button></div>` +
        `<div class="tc-list">${list.map((p) => `<button class="btn cand" data-v="${page}:${esc(p.id)}">${esc(labels[D.st.song.parts.indexOf(p)] ?? p.id)}${page === "give" && here[p.id] ? "<small>（对调）</small>" : ""}</button>`).join("")}` +
        `<button class="btn cand" data-v="${page}new">＋ 新歌手…</button></div>` +
        `<div class="tc-hint">${page === "give" ? "只改这张纸：音、歌词、记号都不动，换一位歌手唱；跨纸按歌手接起来。对方在这张纸上已经有一行 = 两行对调。" : "只加在这张纸上（别的纸照旧）。"}</div>`;
      return;
    }
    const onPaper = Object.keys(D.st.song.papers.find((p) => p.id === D.st.at.paper)?.tracks ?? {}).length, one = (me.staves ?? 1) === 1;
    box.innerHTML =
      `<button class="tc-inst" data-v="inst" title="这个声部是什么、谁来演、怎么演（全屏一页，右边的键盘能试）"><span class="tc-l"><b>${esc(label)}</b><small>${((who) => (who ? `${esc(who)} 在演` : "没人上场"))(activeCandidateName(D.extras, me.role))}</small></span><span class="tc-go">乐器 ›</span></button>` +
      ((m) => { if (!m || !m.size) return ""; const xs = [...m.values()], first = xs[0];   // 唱不出来的歌词：几个、为什么（纪律：画灰 + 明说）
        return `<div class="tc-warn">${first.why === "notSung" ? esc(lyricWhyText(first, roleName(D.extras, me.role))) : `有 ${xs.length} 个字唱不出来（谱上画灰）：${esc(lyricWhyText(first, roleName(D.extras, me.role)))}${xs.some((x) => x.why !== first.why) ? " 等" : ""}`}</div>`; })(lyricMutes().get(me.id)) +
      `<div class="tc-grid">` +
      `<span class="tc-k">显示</span><div class="tc-v">${chip("hide", "隐藏", v.hidden, "谱上缩成一条细行（点细行再放出来）；照样出声")}${chip("only", "只看它", v.only, "其余声部都缩成细行（可以几个一起「只看」）")}</div>` +
      `<span class="tc-k">出声</span><div class="tc-v">${chip("mute", "静音", v.muted, "播放时不出声；谱上照画")}${chip("solo", "独奏", v.solo, "播放时只出有独奏的声部")}</div>` +
      `<span class="tc-k">谱表</span><div class="tc-v">${chip("staves:1", "一张", one)}${chip("staves:2", "大谱表", !one, "上高音下低音（钢琴）：中央 C 以下自动落下面，pad「⋯ → 换谱表」能手动挪")}</div>` +
      (one ? `<span class="tc-k">谱号</span><div class="tc-v">${chip("clef:auto", "自动", !me.clef, "按每张纸的音挑加线最省的谱号（很高的会挑 15ma / 8va，很低的挑低音 / 低音 8vb）；只管画，音高不变。还不看乐器的习惯（比如吉他写 8vb），要的话手动选")}${CLEFS.map((c) => chip(`clef:${c}`, CLEF_LABEL[c], me.clef === c, CLEF_TITLE[c])).join("")}</div>` : "") +
      // 合租（v0.10.24；user「合租还是有主人吧，这样钢琴小花可以挂钢琴上」）：画在谁的谱线上；只管画，出声 / 混音台照旧各是各的
      ((cands, hasTenants) => D.st.song.parts.length > 1 ? `<span class="tc-k">合租</span><div class="tc-v">${hasTenants ? `<span class="tc-hint">有别的歌手挂在这一行上（它是主人），不能再去挂别人</span>`
        : `<select class="tc-sel" data-hostsel title="挂在别人的谱线上画（合租：只看个大概，音撞在一起就撞；只画音，不画休止 / 歌词 / 力度；点名字 = 拆开来写）"><option value="">自己一行</option>${cands.map((p) => `<option value="${esc(p.id)}"${me.host === p.id ? " selected" : ""}>挂在「${esc(labels[D.st.song.parts.indexOf(p)] ?? p.id)}」上</option>`).join("")}</select>`}</div>` : "")(
        D.st.song.parts.filter((p) => p.id !== me.id && !p.host), D.st.song.parts.some((p) => p.host === me.id)) +
      (D.st.song.parts.length > 1 ? `<span class="tc-k">顺序</span><div class="tc-v"><button class="btn" data-v="moveup"${k === 0 ? " disabled" : ""} title="往上挪一格（最上面那个声部的速度记号说了算）">↑ 往上</button><button class="btn" data-v="movedown"${k === D.st.song.parts.length - 1 ? " disabled" : ""} title="往下挪一格">↓ 往下</button></div>` : "") +
      `</div><div class="tc-foot"><button class="btn" data-v="give" title="这张纸上这一行换一位歌手唱（只改这张纸；音和歌词不动）">交给…</button><button class="btn" data-v="add" title="这张纸上再加一位歌手（已有的或新的；只加在这张纸上）">＋ 加歌手…</button>` +
      (onPaper > 1 ? `<button class="btn" data-v="droptrack" title="这张纸上不要这个声部（别的纸照旧）">这张纸上去掉</button>` : "") +
      `<button class="btn" data-v="studio" title="混音台（= 听的底座）：每位歌手一条（增益 / 声像 / 静音 / 独奏）；一张纸都不在的歌手在那里删">歌手管理（混音台）…</button></div>`;   // 纸上不删歌手（2026-10-08 深夜 user「在纸上不应该可以直接删歌手，这个功能去掉，只有没引用的时候才可以在歌手管理里面删」）：删 = 录音室里、一张纸都不在的那位；三条杠里不放录音室（user「三条杠里面不应该有乐器目录，云端，歌库 录音室」），手机上从这里进
  };
  draw(); document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  // 开在这条谱的下面（右边就是这条谱本身——隐藏 / 谱号一点就要看得见它变）；下面放不下 = 上面
  let x = (innerWidth - w) / 2, y = (innerHeight - h) / 2;
  if (at) {
    const below = at.bottom + 30, above = at.top - h - 10;
    if (below + h <= innerHeight - m) { x = at.left - 8; y = below; }
    else if (above >= m) { x = at.left - 8; y = above; }
    else { x = at.right + 10; y = (at.top + at.bottom) / 2 - h / 2; }   // 上下都放不下（矮窗口）：放名字右边，别把名字本身盖住
  }
  box.style.left = `${Math.max(m, Math.min(x, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };   // 非模态：点外面就收，那一下照常落到谱上
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "card", close, redraw: draw });
  box.addEventListener("change", (e) => {   // 合租：挂到谁上 / 自己一行
    const t = e.target as HTMLSelectElement; if (t.dataset.hostsel === undefined) return;
    const next = setPartHost(D.st, curPart().id, t.value || null);
    update(next); renderTitle(); draw();
    // 一家（主人 + 房客）里有谁在写 = 整家拆开（user「host也应该只读，只有展开时才能编辑」）：挂上之后去别的歌手那儿写，这一家才叠成一行
    if (t.value && next !== D.st) info("挂上了：在别的歌手那儿写的时候，这一家叠在一行上看（只读）；点名字 = 拆开来写");
  });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    const me = curPart();
    if (v === "inst") { close(); openInstPage(); return; }
    if (v === "studio") { close(); openStudio(); return; }
    if (v === "give" || v === "add") { page = v; draw(); return; }
    if (v === "back") { page = "main"; draw(); return; }
    if (v.startsWith("give:")) { const to = v.slice(5), name = partLabels(D.st.song, D.extras)[D.st.song.parts.findIndex((p) => p.id === to)] ?? ""; close(); update(rebindTrack(D.st, D.st.at.paper, me.id, to)); renderTitle(); info(`这张纸上这一行交给了「${name}」`); return; }
    if (v === "givenew") { close(); addNewPart(D.st.at.paper, me.id); return; }
    if (v.startsWith("add:")) { close(); update(addTrack(D.st, D.st.at.paper, v.slice(4))); return; }
    if (v === "addnew") { close(); addNewPart(D.st.at.paper); return; }
    if (v === "hide") { setPv(me.id, { hidden: !pv(me.id).hidden }); afterViewChange(); }
    else if (v === "only") { setPv(me.id, { only: !pv(me.id).only }); afterViewChange(); }
    else if (v === "mute") { setPv(me.id, { muted: !pv(me.id).muted }); afterViewChange(); }
    else if (v === "solo") { setPv(me.id, { solo: !pv(me.id).solo }); afterViewChange(); }
    else if (v.startsWith("clef:")) update(setPartClef(D.st, me.id, v.slice(5) === "auto" ? null : (v.slice(5) as ClefName)));
    else if (v === "moveup" || v === "movedown") { update(movePart(D.st, me.id, v === "moveup" ? -1 : 1)); renderTitle(); }
    else if (v.startsWith("staves:")) { update(setPartStaves(D.st, me.id, v.slice(7) === "2" ? 2 : 1)); pad.render(); }
    else if (v === "droptrack") { close(); update(removeTrack(D.st, D.st.at.paper, me.id)); return; }
    else return;
    draw();
  });
}

/** 空白处的小菜单（长按 / 电脑右键；user 2026-10-08「空白长按可以黏贴或者类似的右键上下文菜单」「小菜单同意」）：非模态，开在按的地方，点外面就收。
 *  光标已经由 score-view 放到按的位置：粘贴 = 贴在那里；插记号 = 插在那里。 */
const DYN_MENU = { ppp: "\u{E52A}", pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}", fff: "\u{E530}" } as const;   // Bravura 力度字形
/** 力度换算表（v0.9.23；user 2026-10-10「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」「揭露表的位置建议是乐器页「力度」那一行 同意」）：
 *  每个力度记号 → 这位的 MIDI 力度（有力度表的乐器）或音量 dB（月读 / 元音版 / 旧候选），有 GS 力度层数据的再加一行「第几层」（跨层 = 换一份录音）。数都是这位 by value 的配置。 */
function dynTable(sp: { dynamicsDb: Record<Dyn, number>; dynamicsVel: Record<Dyn, number> | null }, layers: { count: number; ranges: [number, number][] } | null): string {
  const db = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x)}`;
  const cells = (f: (d: Dyn) => string) => DYNS.map((d) => `<td>${f(d)}</td>`).join("");
  const vel = sp.dynamicsVel;
  return `<table class="dyn-tab"><tr><th></th>${DYNS.map((d) => `<th title="${d}"><span class="smufl">${DYN_MENU[d]}</span></th>`).join("")}</tr>` +
    (vel ? `<tr><th>MIDI 力度</th>${cells((d) => String(vel[d]))}</tr>` : `<tr><th>音量 dB</th>${cells((d) => db(sp.dynamicsDb[d]))}</tr>`) +
    (vel && layers && layers.count > 1 ? `<tr><th>GS 力度层</th>${cells((d) => { const k = layers.ranges.findIndex(([lo, hi]) => vel[d] >= lo && vel[d] <= hi); return k >= 0 ? String(k + 1) : "–"; })}</tr>` : "") + `</table>`;
}
function openScoreMenu(at: { x: number; y: number }, _row: { from: number; to: number } | null): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card ctx-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title = "", disabled = false) => `<button class="btn ctx-item" data-v="${v}"${disabled ? " disabled" : ""}${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  box.innerHTML =
    item("play", "从这儿放", "起点挪到这个小节的头，从这儿放（之后 |▶ 回到这儿重放；编辑、挪光标都不动起点）") + `<div class="ctx-sep"></div>` +
    item("paste", "粘贴", "贴在这里：app 里复制的，或系统剪贴板里的简谱文字（1 2 3 | 5 - -）") +
    `<div class="ctx-sep"></div>` +
    item("bar", "小节线 |", "从这里重新数小节（弱起）") + item("phrase", "句号", "这一句到这儿（「合」挪字的边界；不换行不换气）") +
    item("mark:key", "调号…") + item("mark:time", "拍号…") + item("mark:tempo", "速度…") + item("clef", "谱号…", "从这儿起换谱号（只管画）") + item("ottava", "八度线…", "8va / 15ma / 8vb（只管画）") + item("transpose", "移调 / 转调…", "这张纸 / 整首所有声部一起挪（调号跟着挪）；只挪一段 = 选中它，用选区菜单") +
    // 力度（状态：从这儿起管到下一个；user 2026-10-08「长按的小菜单也能输入力度符号」）：亮着的 = 这儿现在生效的
    `<div class="ctx-row ctx-dyn">${(["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const).map((d) => `<button class="btn ctx-chip${dynMarkAt(tr(D.st), D.st.caret) === d ? " is-on" : ""}" data-v="dyn:${d}" title="力度 ${d}：从这儿前面那个音起"><span class="smufl">${DYN_MENU[d]}</span></button>`).join("")}</div>` +
    `<div class="ctx-sep"></div>` +
    item("all", "全选");   // 「全选这一行」去掉了（2026-10-10 user「wishlist 全选这一行没啥用，去掉」）
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let x = at.x + 6, y = at.y + 10;
  if (y + h > innerHeight - m) y = at.y - h - 10;
  box.style.left = `${Math.max(m, Math.min(x, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "play") { playFromHere(D.st.at.paper, D.st.at.part, tickOfCaret(D.st.at.paper, D.st.at.part, D.st.caret) + (D.st.lead ?? 0)); return; }   // 光标在后面补齐的空小节里：加上 lead
    if (v === "paste") void pasteNow();
    else if (v === "bar") update(apply(D.st, { k: "bar" }, performance.now()));
    else if (v === "phrase") update(apply(D.st, { k: "phrase" }, performance.now()));
    else if (v.startsWith("mark:")) insertMarkHere(v.slice(5) as MarkVal["kind"]);
    else if (v === "clef") { openInsertClefMenu(at); return; }
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
  if (nx === D.st) { info("风格记号要放在一个音上（这张纸里还没有音）"); return; }
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
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return; if (!pick(v)) close(); scoreEl.focus({ preventScroll: true }); });
}
/** 写了反复 / 跳转之后：光标所在这一行不是这张纸最上面那位 = 明说（谱上画灰；纪律「做不到的一律画灰 + 明说」）。 */
function discloseNav(): void {
  const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper), owner = paper ? tempoOwner(D.st.song, paper) : null;
  if (owner && owner !== D.st.at.part) info(`反复 / 跳转只看这张纸最上面那位（${roleName(D.extras, D.st.song.parts.find((p) => p.id === owner)?.role ?? "")}）那一行：这一行写的画灰、不起作用`);
}
/** 整段 / 整首移调转调（v0.9.33；user 2026-10-09「杂事记账：段级别和工程级别的整体移调转调」→ 10-10「小件做」）：
 *  纸的「⋯」/ 空白处小菜单 →「移调 / 转调…」。这张纸（或整首）上所有声部一起挪、调号跟着挪；点了不收、可以连着点，每一下一步撤销。
 *  台上固定敲一个键的声部（鼓件 / 音效固定原速，谱上画 ×）不动——谱上的音高不拿来出声。选一段 = 选区菜单那个（只挪选中的、调号不动）。 */
function openTransposeMenu(paperId: string, at: { x: number; y: number }): void {
  let whole = false, told = false;
  const many = D.st.song.papers.length > 1;
  const nameOf = (id: string) => { const k = D.st.song.papers.findIndex((p) => p.id === id); return D.st.song.papers[k]?.name || `第 ${k + 1} 张纸`; };
  const ids = () => (whole ? D.st.song.papers.map((p) => p.id) : [paperId]);
  const chip = (v: string, label: string, on = false, title = "") => `<button class="btn ctx-chip${on ? " is-on" : ""}" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const html = () => {
    const now = scopeKey(D.st.song, ids());
    return (many ? `<div class="ctx-row"><span class="ctx-k">范围</span>${chip("scope:paper", `这一段「${esc(nameOf(paperId))}」`, !whole)}${chip("scope:song", "整首", whole)}</div>` : "") +
      `<div class="ctx-row"><span class="ctx-k">移调</span>${chip("tr:1", "↑ 半音")}${chip("tr:-1", "↓ 半音")}${chip("tr:2", "↑ 全音")}${chip("tr:-2", "↓ 全音")}</div>` +
      `<div class="ctx-row"><span class="ctx-k">八度</span>${chip("tr:12", "↑ 八度")}${chip("tr:-12", "↓ 八度")}</div>` +
      `<div class="ctx-hint ctx-what">转调到（现在 1=${KEY_LABEL[now] ?? now}）：音按两个主音之间的音程挪</div><div class="ctx-grid">${KEY_CIRCLE_MENU.map((k) => chip(`mod:${k}`, `1=${KEY_LABEL[k]}`, k === now)).join("")}</div>` +
      `<div class="ctx-hint">${whole ? "整首" : "这张纸上"}所有声部一起挪，调号跟着挪（取升降号少的写法；挪八度调号不变）。歌词、记号、谱号不动；鼓 / 固定敲一个键的声部（写的音高 = 敲哪个）不动；pad 的「1=」不跟。</div>`;
  };
  ctxMenu("transpose-menu", html(), at, (v) => {
    if (v.startsWith("scope:")) whole = v === "scope:song";
    else {
      const skip = new Set(partViews().filter((x) => x.xHead || x.perc).map((x) => x.id));   // 固定敲一个键 / 鼓（整套鼓：写的音高 = 敲哪个鼓，挪了就换了鼓，v0.10.27）不挪
      const nx = v.startsWith("tr:") ? transposePapers(D.st, ids(), { semis: Number(v.slice(3)) }, skip) : v.startsWith("mod:") ? transposePapers(D.st, ids(), { toFifths: Number(v.slice(4)) }, skip) : D.st;
      if (nx === D.st) info(v.startsWith("mod:") ? "已经是这个调" : "没有可以挪的音");
      else {
        update(nx);
        const held = ids().flatMap((id) => Object.keys(D.st.song.papers.find((p) => p.id === id)?.tracks ?? {})).filter((pid) => skip.has(pid));
        if (held.length && !told) { told = true; const labels = partLabels(D.st.song, D.extras); info(`${[...new Set(held)].map((pid) => labels[D.st.song.parts.findIndex((p) => p.id === pid)]).join("、")} 是鼓 / 固定敲一个键（写的音高 = 敲哪个），没挪`); }
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
    `<div class="ctx-hint ctx-what">谱内反复：插在光标处；光标挨着小节线 = 把那条改成反复的。放的时候按这张纸最上面那位歌手那一行展开，别的声部跟着；不跨纸。跳回来（D.C. / D.S.）之后反复不再反复。</div>` +
    `<div class="ctx-row">${chip("bar:start", "|:", "反复开始")}${chip("bar:end", ":|", "反复结束：回到 |:（没有 = 这张纸开头）再放一遍")}${chip("bar:both", ":|:", "前一段反复结束、后一段反复开始")}${chip("bar:end:3", ":| ×3", "一共放三遍")}${chip("bar:end:4", ":| ×4", "一共放四遍")}${chip("bar:plain", "|", "改回普通小节线")}</div>` +
    `<div class="ctx-row">${chip("bs:double", "‖ 段落线", "段落线（两根细线）：分段的记号，不是两根小节线；挨着小节线 = 把那条改成段落线")}${chip("bs:final", "终止线", "终止线（细 + 粗）：曲子 / 这一段到这儿结束")}</div>` +
    `<div class="ctx-row">${ENDINGS.map((n) => chip(`end:${n.join(",")}`, endingLabel(n), `房子：第 ${n.join("、")} 遍走这里`)).join("")}</div>` +
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
// ── 谱号 / 八度线（v0.9.28；user「谱号的显示模式跟着谱号而不是乐器」「默认自动同意」「加格式同意」「8va可以做了吗」）：只管画，音高数据不动 ──
const OTTAVAS: readonly (1 | 2 | -1)[] = [1, 2, -1];
const OTT_HELP: Record<number, string> = { 1: "8va：谱上画低一个八度（实际照写的高八度响）", 2: "15ma：谱上画低两个八度", [-1]: "8vb：谱上画高一个八度（实际照写的低八度响）", 0: "到这儿结束八度线" };
const clefChips = (on: ClefName | null, prefix: string) => CLEFS.map((c) => `<button class="btn ctx-chip${on === c ? " is-on" : ""}" data-v="${prefix}${c}" title="${esc(CLEF_TITLE[c])}">${esc(CLEF_LABEL[c])}</button>`).join("");
/** 插谱号（pad 符号层 / 空白处菜单）：从光标处起换。 */
function openInsertClefMenu(at: { x: number; y: number }): void {
  ctxMenu("clef-menu", `<div class="ctx-hint ctx-what">谱号：从光标处起换（只管画，音高不变）。每行开头的谱号也能直接点。</div><div class="ctx-row">${clefChips(null, "c:")}</div>`, at,
    (v) => { if (v.startsWith("c:")) update(insertClef(D.st, v.slice(2) as ClefName)); });
}
/** 插八度线：从光标处起（有选区 = 这一段）。 */
function openInsertOttavaMenu(at: { x: number; y: number }): void {
  ctxMenu("ottava-menu", `<div class="ctx-hint ctx-what">八度线：从光标处起${D.st.sel ? "（有选区 = 只画这一段）" : "，到下一个八度线记号为止"}。只管画，音高不变。</div>` +
    `<div class="ctx-row">${[...OTTAVAS, 0].map((v) => `<button class="btn ctx-chip" data-v="o:${v}" title="${esc(OTT_HELP[v])}">${esc(OTTAVA_LABEL[v])}</button>`).join("")}</div>`, at,
    (v) => { if (v.startsWith("o:")) update(insertOttava(D.st, Number(v.slice(2)) as -1 | 0 | 1 | 2)); });
}
/** 点谱上的谱号 / 八度线。行首的谱号：管着它的是声部自己的谱号 = 改声部的（全曲，自动也在这）+「只改这张纸」；是谱号记号 = 改 / 删那个记号。 */
function openClefMenu(hit: ClefHit, at: { x: number; y: number }): void {
  const paper = D.st.song.papers.find((p) => p.id === hit.paper), toks = paper?.tracks[hit.part]; if (!toks) return;
  const part = D.st.song.parts.find((p) => p.id === hit.part); if (!part) return;
  if (hit.kind === "ottava" && hit.run) {   // 自动画的八度线（v0.9.37；user「自动加」）：不存进谱；可以固定成手写的，或者这位不要自动
    const r = hit.run, lab = OTTAVA_LABEL[r.shift];
    ctxMenu("ottava-menu", `<div class="ctx-hint ctx-what">自动八度线：这一串音要三条以上加线，自动画了 ${esc(lab)}。只管画、不存进谱，音高不变；改了音会跟着重算。手写的八度线说了算。</div>` +
      `<button class="btn ctx-item" data-v="pin">固定成手写的 ${esc(lab)}（之后自己改）</button><button class="btn ctx-item" data-v="off">这位歌手不要自动八度线</button>`, at,
      (v) => {
        if (v === "pin") update(insertOttava({ ...setFocus(D.st, hit.paper, hit.part, r.from), sel: { from: r.from, to: r.to + 1 } }, r.shift));
        else if (v === "off") { update(setPartAutoOttava(D.st, hit.part, false)); info("这位歌手的自动八度线关了（谱号小菜单里能再开）"); }
      });
    return;
  }
  if (hit.kind === "ottava") {
    const t = toks[hit.index]; if (!t || t.kind !== "ottava") return;
    ctxMenu("ottava-menu", `<div class="ctx-hint ctx-what">八度线：${esc(OTT_HELP[t.shift])}。只管画，音高不变。</div>` +
      `<div class="ctx-row">${OTTAVAS.map((v) => `<button class="btn ctx-chip${t.shift === v ? " is-on" : ""}" data-v="o:${v}" title="${esc(OTT_HELP[v])}">${esc(OTTAVA_LABEL[v])}</button>`).join("")}</div><div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">删掉这条八度线</button>`, at,
      (v) => { if (v === "del") update(setDisplayMark(D.st, hit.paper, hit.part, hit.index, null)); else if (v.startsWith("o:")) update(setDisplayMark(D.st, hit.paper, hit.part, hit.index, Number(v.slice(2)) as -1 | 1 | 2)); });
    return;
  }
  if (hit.index >= 0) {   // 谱号记号（行中间的，或管着这一行开头的）
    const t = toks[hit.index]; if (!t || t.kind !== "clef") return;
    ctxMenu("clef-menu", `<div class="ctx-hint ctx-what">这个谱号记号：从这儿起换成别的谱号（只管画，音高不变）。</div><div class="ctx-row">${clefChips(t.clef, "c:")}</div><div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">删掉这个谱号记号</button>`, at,
      (v) => { if (v === "del") update(setDisplayMark(D.st, hit.paper, hit.part, hit.index, null)); else if (v.startsWith("c:")) update(setDisplayMark(D.st, hit.paper, hit.part, hit.index, v.slice(2) as ClefName)); });
    return;
  }
  const auto = !part.clef, now = auto ? (resolveSongClefs(D.st.song).get(hit.paper)?.get(hit.part) ?? "G") : part.clef!;
  ctxMenu("clef-menu",
    `<div class="ctx-hint ctx-what">这个声部的谱号（每张纸开头都用它）：${auto ? `自动（这张纸挑了「${esc(CLEF_LABEL[now])}」）` : esc(CLEF_LABEL[now])}。只管画，音高不变。</div>` +
    `<div class="ctx-row"><button class="btn ctx-chip${auto ? " is-on" : ""}" data-v="p:auto" title="按每张纸的音挑加线最少的谱号">自动</button>${clefChips(auto ? null : now, "p:")}</div>` +
    `<div class="ctx-hint">只改这张纸（在这张纸开头放一个谱号记号）：</div><div class="ctx-row">${clefChips(null, "here:")}</div>` +
    `<div class="ctx-hint">自动八度线：一串很高 / 很低的音（每个都要三条以上加线）自动画 8va / 15ma / 8vb；手写的说了算，不存进谱。</div>` +
    `<div class="ctx-row"><button class="btn ctx-chip${part.autoOttava !== false ? " is-on" : ""}" data-v="ao:on">开</button><button class="btn ctx-chip${part.autoOttava === false ? " is-on" : ""}" data-v="ao:off">关</button></div>`, at,
    (v) => {
      if (v.startsWith("ao:")) { update(setPartAutoOttava(D.st, hit.part, v === "ao:on")); return; }
      if (v.startsWith("p:")) update(setPartClef(D.st, hit.part, v === "p:auto" ? null : (v.slice(2) as ClefName)));
      else if (v.startsWith("here:")) update(insertClef(setFocus(D.st, hit.paper, hit.part, headLen(toks)), v.slice(5) as ClefName));
    });
}
const NAV_HELP: Record<Exclude<NavWhat, "ending">, string> = {
  segno: "Segno：D.S. 跳回到这儿", coda: "Coda：To Coda 跳到这儿", fine: "Fine：跳回来（al Fine）之后在这儿停", toCoda: "To Coda：跳回来（al Coda）之后从这儿去 Coda",
  dc: "D.C.：跳回这张纸开头，放到纸尾", dcFine: "D.C. al Fine：跳回开头，放到 Fine", dcCoda: "D.C. al Coda：跳回开头，到 To Coda 去 Coda",
  ds: "D.S.：跳回 Segno，放到纸尾", dsFine: "D.S. al Fine：跳回 Segno，放到 Fine", dsCoda: "D.S. al Coda：跳回 Segno，到 To Coda 去 Coda",
};
/** 点谱上的房子 / 跳转记号：换成别的 / 删；不起作用的说为什么。 */
function openNavMenu(i: number, at: { x: number; y: number }): void {
  const t = tr(D.st)[i]; if (!t || t.kind !== "nav") return;
  const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper), why = paper ? navWhy(D.st.song, paper, D.st.at.part, t) : null;
  const chips = t.what === "ending"
    ? ENDINGS.map((n) => `<button class="btn ctx-chip${n.join() === (t.nums ?? [1]).join() ? " is-on" : ""}" data-v="nums:${n.join(",")}">${esc(endingLabel(n))}</button>`).join("")
    : JUMPS.map((w) => `<button class="btn ctx-chip${t.what === w ? " is-on" : ""}" data-v="nav:${w}" title="${esc(NAV_HELP[w])}">${esc(NAV_LABEL[w])}</button>`).join("");
  ctxMenu("nav-menu",
    (why ? `<div class="ctx-hint">不起作用（画灰）：${esc(why)}</div>` : "") +
    `<div class="ctx-hint ctx-what">${esc(t.what === "ending" ? `房子：第 ${(t.nums ?? [1]).join("、")} 遍走这个括号，别的遍跳过` : NAV_HELP[t.what])}</div>` +
    `<div class="ctx-row">${chips}</div><div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">删除</button>`,
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
  const style = grooveStyle(t.style), amount = t.amount ?? 1;
  const meters = new Set([`${timeAt(toks, i).beats}/${timeAt(toks, i).beatType}`]);
  for (let j = i + 1; j < end; j++) { const u = toks[j]; if (u.kind === "time") meters.add(`${u.beats}/${u.beatType}`); }
  const hints: string[] = [];
  if (!style && t.style !== "none") hints.push(`这一版不认识「${t.style}」：不加轻重（换一个风格就好）`);
  if (style && t.style !== "none") for (const m of meters) { const [b, bt] = m.split("/").map(Number), d = describeGroove(style, b, bt); if (d) hints.push(`${grooveName(t.style)} ${m}：${d}`); }   // 这个风格在这儿怎么轻重（从数据现算）
  if (style && t.style !== "none") {
    const derived = [...meters].filter((m) => { const [b, bt] = m.split("/").map(Number); return grooveTable(style, b, bt)?.derived; });
    const none = [...meters].filter((m) => { const [b, bt] = m.split("/").map(Number); return !grooveTable(style, b, bt); });
    if (derived.length) hints.push(`${derived.join("、")} 这个预设没列：按古典的强弱推${derived.some((m) => m.endsWith("/8") && Number(m.split("/")[0]) % 3 !== 0 && Number(m.split("/")[0]) > 3) ? "（几个八分一组谱上没记，按 2 + 2 + … + 3 推）" : ""}`);
    if (none.length) hints.push(`${none.join("、")}：这个预设不加轻重`);
    if (style.swing) { const r = swingRatio(t.style, amount), [lo, hi] = style.swing.range;   // 摇摆（v0.9.36）：按数据现算（纪律：做到什么程度明说）
      hints.push(`摇摆：一拍里前一个八分占 ${Math.round(r * 100)}%（直 = 50%，三连音感 ≈ 67%；幅度只放大 / 缩小比直的多出来的那一截，夹在 ${Math.round(lo * 100)}–${Math.round(hi * 100)}%）。这张纸上所有歌手一起摇（小月相也是，不分跟多少）；写成连音的音、6/8 这类拍号不摇`); }
    const paper = D.st.song.papers.find((p) => p.id === D.st.at.paper);
    const who = D.st.song.parts.filter((p) => paper?.tracks[p.id]).map((p) => {
      const f = followOf(style, grooveCategory(performerOf(activeInstrument(D.extras, p.role)?.engine)?.grooveCategory ?? null, activeGm(D.extras, p.role)));
      return `${roleName(D.extras, p.role)} ${f > 0 ? `跟 ${Math.round(f * 100)}%` : "不跟"}`;
    });
    if (who.length) hints.push(`这张纸上：${who.join(" · ")}（按乐器类别，预设给的）`);
  }
  const chips = GROOVE_STYLES.filter((x) => x.id !== "none").map((x) => `<button class="btn ctx-chip${t.style === x.id ? " is-on" : ""}" data-v="style:${x.id}" title="${esc(x.aliases.length ? `也叫 ${x.aliases.join(" / ")}` : x.name.zh)}">${esc(x.name.en)}<small> · ${esc(x.name.zh)}</small></button>`).join("") +   // 谱上写英文（user「风格名用英文」），按钮带中文
    `<button class="btn ctx-chip${t.style === "none" ? " is-on" : ""}" data-v="style:none" title="从这儿起不加拍子轻重">不加轻重</button>`;
  const amounts = [0.5, 1, 1.5, 2].map((a) => `<button class="btn ctx-chip${Math.abs(amount - a) < 1e-9 ? " is-on" : ""}" data-v="amount:${a}" title="幅度：预设的 ${a} 倍">×${a}</button>`).join("");
  const box = document.createElement("div");
  box.className = "track-card ctx-menu groove-menu"; box.setAttribute("role", "menu");
  box.innerHTML = `<div class="ctx-hint ctx-what">风格 = 拍子轻重：从这个音起到这张纸结尾，每个音按它落在小节里的哪一拍轻一点或重一点（像鼓手的律动）；写了重音 / 弱化的音照写的来。</div>` +
    `<div class="ctx-row ctx-groove">${chips}</div>` + (t.style !== "none" ? `<div class="ctx-row ctx-amount">${amounts}</div>` : "") +
    (grooveHasPhase(style) ? `<div class="ctx-row ctx-phase"><button class="btn ctx-chip${t.shift ? "" : " is-on"}" data-v="shift:0" title="一轮的第一小节是三击那边（前句），从这个记号那一小节起数">3-2</button><button class="btn ctx-chip${t.shift ? " is-on" : ""}" data-v="shift:1" title="错开一小节：两小节对调，第一小节是两击那边">2-3（错开一小节）</button></div>` : "") +
    hints.map((h) => `<div class="ctx-hint">${esc(h)}</div>`).join("") + `<div class="ctx-sep"></div>` +
    `<button class="btn ctx-item danger" data-v="del" title="去掉这个风格记号（这儿起回到前一个风格；这张纸开头 = 不加）">删除</button>` +
    `<div class="ctx-hint">只管这张纸：从这个音到这张纸结尾（或下一个风格记号）。长按拖 = 挪到别的音上</div>`;
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let y = at.y + 6; if (y + h > innerHeight - m) y = at.y - h - 30;
  box.style.left = `${Math.max(m, Math.min(at.x - w / 2, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };
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
    ? (["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"] as const).map((d) => `<button class="btn ctx-chip${t.value === d ? " is-on" : ""}" data-v="dyn:${d}" title="改成 ${d}"><span class="smufl">${DYN_MENU[d]}</span></button>`).join("")
    : (["cresc", "dim"] as const).map((d) => `<button class="btn ctx-chip${t.dir === d ? " is-on" : ""}" data-v="dir:${d}" title="${d === "cresc" ? "渐强" : "渐弱"}">${WEDGE_MENU[d]}</button>`).join("");
  // 渐到（只给力度记号）：开关 + 做不到时说为什么（纪律：画灰 + 明说）
  const rampWhy = src === "none" ? "这张纸里前面没有力度记号，没有地方渐过来" : src === "hairpin" ? "中间有手写的渐强渐弱，按手写的走" : "";
  const offWhy = t.kind === "dyn" && dynOverridden(toks).has(i) ? `<div class="ctx-hint">不起作用（画灰）：后面那个音是强后即弱（fp）——音头按 f、随后落到 p，之后也是 p，这个 ${t.value} 管不到</div>` : "";
  const rampRow = t.kind !== "dyn" ? "" : `<div class="ctx-sep"></div><button class="btn ctx-item${t.ramp ? " is-on" : ""}" data-v="ramp"${rampWhy && !t.ramp ? " disabled" : ""} title="渐到：从这张纸里上一个力度记号那儿一路渐变到这里（谱上虚线发夹）；关 = 到这儿突变">${t.ramp ? "✓ " : ""}渐到（从上一个力度渐变过来）</button>` +
    (rampWhy ? `<div class="ctx-hint">${t.ramp ? "不起作用：" : ""}${esc(rampWhy)}</div>` : "");
  box.innerHTML = `${offWhy}<div class="ctx-row ctx-dyn">${row}</div>${rampRow}<div class="ctx-sep"></div>` +
    `<button class="btn ctx-item danger" data-v="del" title="${t.kind === "dyn" ? "去掉这个力度记号（后面的音回到前一个力度记号）" : "去掉这个渐强 / 渐弱"}">删除</button>` +
    `<div class="ctx-hint">长按拖 = 挪到别的音上</div>`;
  document.body.append(box);
  const w = box.offsetWidth, h = box.offsetHeight, m = 8;
  let y = at.y + 6; if (y + h > innerHeight - m) y = at.y - h - 30;
  box.style.left = `${Math.max(m, Math.min(at.x - w / 2, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); view.setSpan(null); };   // 收起 = 不再染
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "ramp" && t.kind === "dyn") update(editMarkAt(D.st, i, { ramp: !t.ramp }));
    else if (v === "del") update(editMarkAt(D.st, i, null));
    else if (v.startsWith("dyn:")) update(editMarkAt(D.st, i, { value: v.slice(4) as Dyn }));
    else if (v.startsWith("dir:")) update(editMarkAt(D.st, i, { dir: v.slice(4) as "cresc" | "dim" }));
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
  if (!D.st.sel) return;
  ui.close();
  const box = document.createElement("div");
  box.className = "track-card ctx-menu sel-menu"; box.setAttribute("role", "menu");
  const item = (v: string, label: string, title = "", cls = "") => `<button class="btn ctx-item ${cls}" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const chip = (v: string, label: string, title = "") => `<button class="btn ctx-chip" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const draw = (page: "main" | "keys") => {
    if (page === "keys") {
      const now = keyAt(tr(D.st), D.st.sel?.from ?? 0);
      box.innerHTML = item("back", "‹ 转调到…") + `<div class="ctx-grid">` + KEY_CIRCLE_MENU.map((k) => chip(`mod:${k}`, `1=${KEY_LABEL[k]}`, k === now ? "现在的调" : "")).join("") + `</div>`;
      return;
    }
    box.innerHTML =
      `<div class="ctx-row"><span class="ctx-k">移调</span>${chip("tr:1", "↑ 半音")}${chip("tr:-1", "↓ 半音")}${chip("tr:2", "↑ 全音")}${chip("tr:-2", "↓ 全音")}${chip("oct:1", "↑ 八度")}${chip("oct:-1", "↓ 八度")}</div>` +
      item("keys", "转调…", "整段转到另一个调：音按两个主音之间的音程挪，调号跟着换") +
      item("respell", "按调号拼写", "音高不变：调内的音换成调号里的写法（A♭ 在五个升号的调里 = G♯），调外的不动") +
      `<div class="ctx-row"><span class="ctx-k">时值</span>${chip("short", "÷2")}${chip("long", "×2")}${chip("seldur", `都改成 <span class="smufl">${UNIT_SMUFL[D.st.input.unit]}</span>`, "都改成长短旋钮现在那一档")}</div>` +
      `<div class="ctx-row"><span class="ctx-k">清掉记号</span>${chip("clr:phrase", "曲级", "力度字、渐强渐弱、渐到、风格（选区第一个音前面挂着的也算）")}${chip("clr:note", "音级", "演奏法、音头（重音 / 突强…）、音内起伏、连线、呼吸、气声")}${chip("clr:all", "都清", "曲级 + 音级；音、歌词、调号拍号速度、反复不动")}</div>` +
      `<div class="ctx-sep"></div>` + item("copy", "复制") + item("cut", "剪切") + (clip ? item("paste", "粘贴（替换选中的）") : "") + item("delete", "删掉", "", "danger");
  };
  draw("main");
  document.body.append(box);
  const place = () => {
    const w = box.offsetWidth, h = box.offsetHeight, m = 8;
    let y = at.y + 8; if (y + h > innerHeight - m) y = at.y - h - 8;
    box.style.left = `${Math.max(m, Math.min(at.x, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(y, innerHeight - h - m))}px`;
  };
  place();
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node)) close(); };
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
    if (v.startsWith("clr:")) { const n = clearMarks(D.st, v.slice(4) as "phrase" | "note" | "all"); if (n === D.st) info("选中的这一段没有这类记号"); else update(n); close(); scoreEl.focus(); return; }
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
let instPicked: { name: string; bytes: Uint8Array; presets: Sf2PresetInfo[]; sel: string; library?: SoundEntry } | null = null;
type Chosen = { name: string; bank: number; program: number; note?: number; sfx?: SfxInfo; subset: Uint8Array; sha256: string; origin: GmCandidate["origin"]; credit: { attribution: string[]; license: { name: string; url?: string; text?: string } } };
const UNKNOWN_TITLE = "这一版出不了声（别的软件原来的乐器）";   // 认得出的候选：说明由插件自报（description）
/** 小月相唱法核心的旋钮 = 乐器页「高级」（存进候选 defaults，by value、走 undo、换人跟人走；默认 = TSUKUYOMI_DEFAULTS）。
 *  2026-10-15 user 拍板：齐平默认关（「应该leverage就是齐平，我觉得不开没什么影响吧，默认不开」），旋钮进高级设置持久化；「连续」也放着试。物理意义 = ai-docs/20261013-dango-c10-pop-probe.md §6。 */
let instAdvOpen = false;   // 乐器页「高级」折叠开着没（重画保持）
function openInstPage(): void {
  ui.close();
  if (finder.isOpen) closeFinder(false);
  ui.setPage({ k: "inst" }); instPicked = null; scoreEl.hidden = true; instEl.hidden = false;
  ws.tryout = padLocked(ui.page); showPad(true); padEl.classList.add("is-locked"); pad.clearHeld(); pad.render();
  drawInst(); updateChrome();
  instEl.querySelector<HTMLElement>(".ip-body")?.scrollTo({ top: 0 });
}
function closeInstPage(): void {
  if (!instShown()) return;
  commitRoleName();
  ui.setPage({ k: "score" }); instPicked = null; instEl.hidden = true; ws.tryout = false; applyWorkspace();   // 乐器页和目录互斥：关乐器页时目录一定没开
  padEl.classList.remove("is-locked"); pad.clearHeld(); pad.render(); scoreEl.hidden = false; view.render(); renderTitle(); updateChrome(); scoreEl.focus();
}
const setRole = (name: string, sound?: string) => {
  const n = name.trim(); if (!n || (n === roleName(D.extras, curRole()) && (!sound || sound === roleSound(D.extras, curRole())))) return;
  updateExtras(withRoleName(D.extras, curRole(), n, D.st.song.hum, sound), { kind: "lounge", label: `角色改名：${n}` }); view.render();
};
const commitRoleName = () => { const inp = instEl.querySelector<HTMLInputElement>("#roleIn"); if (inp && !instEl.hidden) setRole(inp.value); };
const fileInput = (accept: string, onFile: (f: File) => Promise<void>) => {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; inp.hidden = true; document.body.append(inp);
  inp.addEventListener("change", async () => { const f = inp.files?.[0]; inp.remove(); if (f) await onFile(f); });
  inp.click();
};
async function pickOfficial(id: string): Promise<void> {
  const e = SOUNDS[id];
  try {
    const bytes = await sources.fetchSound(e, (done) => progress(`下载 ${e.name} ${Math.round((done / e.bytes) * 100)}%`));
    progress("");
    const presets = listSf2Presets(bytes), first = presets.find((p) => p.bank === 0) ?? presets[0];
    instPicked = { name: e.name, bytes, presets, sel: `${first.bank}:${first.program}`, library: e }; drawInst();
  } catch (err) { progress(""); showError((err as Error).message); }
}
const pickFile = () => fileInput(".sf2,audio/x-soundfont", async (f) => {
  try {
    const bytes = new Uint8Array(await f.arrayBuffer()), presets = listSf2Presets(bytes);
    if (!presets.length) throw new Error("里面没有乐器");
    const first = presets.find((p) => p.bank === 0) ?? presets[0];
    instPicked = { name: f.name, bytes, presets, sel: `${first.bank}:${first.program}` }; drawInst();
  } catch (e) { showError(`读不了「${f.name}」：${(e as Error).message}`); }
});
// 弱引用找不到整包时：人把文件给它（核整包 sha256；对了就留在设备上）
const findBankFile = (id: string) => {
  const g = gmCandidates(D.extras, curRole()).find((c) => c.id === id); if (!g) return;
  fileInput(".sf2,audio/x-soundfont", async (f) => {
    try {
      const bytes = new Uint8Array(await f.arrayBuffer()), sha = await sha256Hex(bytes);
      if (sha !== g.origin.fileSha256) throw new Error(`「${f.name}」不是歌里记的那个「${g.origin.name}」（sha256 ${sha.slice(0, 12)}… ≠ ${g.origin.fileSha256.slice(0, 12)}…）`);
      await rememberSound(sha, bytes, true); sources.session.drop(g.subsetSha256);
      await sources.resolveGmBytes(g); info(`找到了：「${g.name}」能响了`); drawInst();
    } catch (e) { showError((e as Error).message); }
  });
};
// 默认弱引用（2026-10-08 by Claude Opus 5.5；user「我后悔自动embed音源了，改成弱引用吧，app可以自己找吗」）：歌里只记来源 + 子集 sha256。
//   货架上的（音源库）= 整包在设备缓存 / 音源库里找得到；自己的 .sf2 = 把切出来的子集留进设备的音源缓存（几 MB），下次打开 app 自己找得到。
//   要歌自己带着声音（发给别人）= 文件菜单「全部打包进歌」或导出「打包音源」的副本。
async function finishAdd(c: Chosen): Promise<void> {
  updateExtras(withSf2Candidate(D.extras, curRole(), { ...c, embed: false }, D.st.song.hum), { kind: "lounge", label: `「${roleName(D.extras, curRole())}」换成：${c.name}` });
  sources.session.keep(c.sha256, c.subset);   // 本次打开里直接能响
  instPicked = null; sound.allOff(); void prepareBank(); view.render(); renderTitle(); drawInst();
  if (!c.origin.library) {
    await rememberSound(c.sha256, c.subset, true);
    if (!(await isSoundPersisted(c.sha256))) showError(`「${c.name}」的声音没能留在这台设备上（空间不够，或这个浏览器不让存）：这次打开里能响；下次要从「${c.origin.name}」文件找。想让歌自己带着它：文件菜单「全部打包进歌」。`);
  }
}
async function addPicked(): Promise<void> {
  const picked = instPicked; if (!picked) return;
  const [bank, program] = picked.sel.split(":").map(Number), preset = picked.presets.find((p) => p.bank === bank && p.program === program);
  if (!preset) return;
  const name = instEl.querySelector<HTMLInputElement>("#sfName")?.value.trim() || preset.name;
  try {
    const subset = subsetSf2(picked.bytes, [{ bank, program }]), inf = sf2Info(picked.bytes);
    const [sha256, fileSha256] = await Promise.all([sha256Hex(subset), sha256Hex(picked.bytes)]);
    // 署名 / 许可证快照 by value：货架上的从目录条目抄（名字 + 出处 + 许可证名），自己拖进来的只有 INFO 块里的字、许可证 unknown
    const lib = picked.library;
    const credit = lib
      ? { attribution: [lib.attribution], license: { name: lib.license.name, url: lib.homepage ?? lib.source, text: inf.comment } }
      : { attribution: [inf.name, inf.engineer, inf.copyright].filter((x): x is string => !!x), license: { name: "unknown", text: inf.comment } };
    // GS 的音效：和找人视图上场一样默认固定原速（sampleKey 只对 GS 成立；鼓组 bank 128 的预设在 GS 里是整套鼓，不是单件，不带 note）
    const keys = lib?.id === GS_LIBRARY_ID ? gsKeyArgs(catalogNow ??= await loadCatalog(new URL(import.meta.url)), bank, program) : {};
    await finishAdd({ name, bank, program, ...keys, subset, sha256, origin: { name: picked.name, fileSha256, bytes: picked.bytes.length, ...(lib ? { library: lib.id } : {}) }, credit });
  } catch (e) { showError(`加不进来：${(e as Error).message}`); }
}
function pickerHtml(): string {
  const picked = instPicked; if (!picked) return "";
  const banks = [...new Set(picked.presets.map((p) => p.bank))].sort((a, b) => a - b);
  const label = (b: number) => (b === 128 ? "鼓组" : b === 0 ? "乐器" : `变体（bank ${b}）`);
  const cur = picked.presets.find((p) => `${p.bank}:${p.program}` === picked.sel);
  return `<div class="ip-picker"><div class="ip-sub">${esc(picked.name)}（${picked.presets.length} 件）</div><select id="sfSel" class="role-sel">` +
    banks.map((b) => `<optgroup label="${label(b)}">${picked.presets.filter((p) => p.bank === b).map((p) => `<option value="${p.bank}:${p.program}"${`${p.bank}:${p.program}` === picked.sel ? " selected" : ""}>${String(p.program).padStart(3, "0")} ${esc(p.name)}</option>`).join("")}</optgroup>`).join("") +
    `</select><label class="role-name">叫<input id="sfName" class="role-in" type="text" spellcheck="false" autocomplete="off" value="${esc(cur?.name ?? "")}" /></label>` +
    `<div class="ip-btns"><button class="btn primary" data-v="sf2:add">加进来、选它</button><button class="btn" data-v="sf2:cancel">算了</button></div></div>`;
}
/** 乐器页的内容（每次改完整页重画；输入框里正在打的字不受影响——只有提交时才改 extras）。 */
/** 插件自报参数行要的上下文（ADR-0004 §2.5）：休息室 / 角色 / 哼的字 / 音乐目录（没载 = null）/ 排版小工具。 */
function inspectorCtx(role: string): InspectorCtx {
  return { extras: D.extras, role, hum: D.st.song.hum, catalog: catalogNow, esc, chip, dynTable: (L) => dynTable(activePerfSpec(D.extras, role), L) };
}
function drawInst(): void {
  if (!instShown()) return;
  const eng = engineNow(), h = D.st.song.hum, role = curRole(), rn = roleName(D.extras, role), rs = roleSound(D.extras, role), aid = activeId(D.extras, role);
  const gms = new Map(gmCandidates(D.extras, role).map((g) => [g.id, g])), active = gms.get(aid), who = activeCandidateName(D.extras, role) ?? "（没人上场）";
  const chipTitle = (c: { id: string; engine: Engine }) => { const g = gms.get(c.id); if (!g) return performerOf(c.engine)?.description ?? UNKNOWN_TITLE; return g.bytes ? `SoundFont ${g.bank}:${g.program}，声音嵌在歌里（${sizeText(g.bytes.length)}）` : g.path ? "声音没随这首歌带来" : `弱引用：声音不在歌里，用时从「${g.origin.name}」找`; };
  const status = !active ? "" : active.bytes ? `<div class="cand-status">声音嵌在歌里（${sizeText(active.bytes.length)}）${active.origin.library ? `，来自家族音源库的 ${esc(active.origin.name)}` : `，来自 ${esc(active.origin.name)}`}</div>`
    : active.path ? `<div class="cand-status">声音没随这首歌带来，所以没人上场——换一个「谁来演」</div>`
    : ((found) => `<div class="cand-status">弱引用：歌里不带声音，用时从「${esc(active.origin.name)}」找（${found ? "本次已找到" : "家族音源库 / 设备缓存 / 你的文件"}）${found ? "" : `<button class="btn" data-v="find:${esc(active.id)}">找文件…</button>`}</div>`)(sources.session.has(active.subsetSha256));
  const labels = partLabels(D.st.song, D.extras), onPaper = new Set(Object.keys(D.st.song.papers.find((p) => p.id === D.st.at.paper)?.tracks ?? {}));
  const parts = D.st.song.parts.map((p, k) => ({ p, label: labels[k] })).filter((x) => onPaper.has(x.p.id));
  const cal = activeCalibrationDb(D.extras, role), tr = activeTranspose(D.extras, role);
  const row = (k: string, v: string, note = "") => `<span class="ip-k">${k}</span><div class="ip-v"><div class="ip-ctl">${v}</div>${note ? `<div class="ip-note">${note}</div>` : ""}</div>`;
  // 这位怎么演：通用的行（响度 / 音和音之间 / 力度记号 dB 表 / 哼的字）按能力字段摆；这位自己的行（力度 / 音效 / 修八度 / 八度 / 唱法旋钮 / 分段唱…）由插件自报
  //   （ADR-0004 §2.5「槽旁的参数行由插件自报，不是 main.ts 写死」；2026-10-15 刀 5 之一）。
  const plug = performerOf(eng), ictx = inspectorCtx(role);
  const own = plug?.inspector?.(ictx) ?? [], ownMain = own.filter((x) => !x.place), ownAdv = own.filter((x) => x.place === "adv"), ownTail = own.filter((x) => x.place === "tail");
  const rowOf = (x: { label: string; control: string; note?: string }) => row(x.label, x.control, x.note ?? "");
  const how =
    (plug ? row("响度", `<b class="ip-val">${fmtDb(cal)}</b><button class="btn" data-v="cal:-1" title="这位演奏者小声 1 dB">−1 dB</button><button class="btn" data-v="cal:1" title="大声 1 dB">+1 dB</button>${cal !== DEFAULT_CALIBRATION_DB ? `<button class="btn" data-v="cal:def" title="回到默认 ${fmtDb(DEFAULT_CALIBRATION_DB)}">默认</button>` : ""}`,
      `这位演奏者自己的音量：默认都是 ${fmtDb(DEFAULT_CALIBRATION_DB)}（小月相也是），几个声部叠在一起才不顶到天花板、不把声音压变样；混音台的推子另算`) : "") +
    // 连断的底色（2026-10-08，user「连断 预设 都同意」）：不写记号的音之间留多大缝（毫秒）；按 GM 音色家族给的默认只是起点，好不好听归耳朵。
    //   月读还不认（唱法核心的连 / 断是第 3 步）：不给这一行，谱上的连线 / 保持照规矩画灰
    (plug?.sound === "notes" ? ((gap, d) => row("音和音之间", `<b class="ip-val">${Math.round(gap * 1000)} ms</b>` +
      `<button class="btn" data-v="gap:-0.01" title="缝小 10 ms（更连）">−10</button><button class="btn" data-v="gap:0.01" title="缝大 10 ms（更断）">+10</button>` +
      (d && Math.abs(gap - d.gapSec) > 1e-9 ? `<button class="btn" data-v="gap:def" title="回到默认 ${Math.round(d.gapSec * 1000)} ms">默认</button>` : ""),
      `不写记号的音和下一个音之间留的缝：0 = 连着。${d ? `${esc(d.label)}：默认 ${Math.round(d.gapSec * 1000)} ms（音乐目录给的，按音色逐个）。` : ""}连线（连奏）、保持的音不留缝；呼吸 = 这里断开；跳音另算`))(activePerfSpec(D.extras, role).gapSec, gapDefaultOf(role)) : "") +
    ownMain.map(rowOf).join("") +
    // 月读 / 元音版：没有「按下去的力度」，力度记号 = 音量曲线；同一个位置摆同一张表（v0.9.23，方便和乐器的那张对比）
    (plug?.dynamics === "gain" ? row("力度记号", "", `力度记号 = 音量（相对 mf，dB）；一档 6 dB ≈ 振幅翻倍 / 减半。力度记号没有标准的 dB，是相对的：每位演奏者自己带一张表，这是这位的：${dynTable(activePerfSpec(D.extras, role), null)}`) : "") +
    ((plug?.lyrics ?? "none") !== "none" ? row("哼的字", HUMS.map(([v, l]) => chip(`hum:${v}`, l, h === v)).join(""), "没写歌词的音唱什么（整首歌一个）") : "") +
    (ownAdv.length ? `<details class="ip-adv"${instAdvOpen ? " open" : ""}><summary>高级：唱法核心的旋钮</summary>${ownAdv.map(rowOf).join("")}</details>` : "") +
    ownTail.map(rowOf).join("") +
    (!plug ? row("", "", "这一版出不了声（别的软件原来的乐器）：换一个「谁来演」") : "");
  instEl.innerHTML =
    `<div class="ip-bar"><button class="btn" data-v="back" title="回到谱（Esc）">← 谱</button><span class="ip-title">乐器</span>` +
    (parts.length > 1 ? `<select class="ip-part" title="换一个声部">${parts.map((x) => `<option value="${esc(x.p.id)}"${x.p.id === D.st.at.part ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select>` : `<span class="ip-part-one">${esc(parts[0]?.label ?? rn)}</span>`) +
    `<span class="ip-gap"></span><button class="btn finder-pad ip-pad${padEl.hidden ? "" : " is-on"}" data-v="pad" title="试听键盘：开 / 关"><svg class="ico"><use href="#grid"/></svg><span>键盘</span></button></div>` +
    `<div class="ip-body"><div class="ip-cols">` +
    `<section class="ip-card"><h3>这个声部是什么<small>谱上写它的名字</small></h3><select id="roleSel" class="role-sel">` +
      (ROLE_PRESETS.some((r) => r.name === rn && r.sound === rs) ? "" : `<option value="" selected>${esc(rn)}（自己写的）</option>`) +
      ROLE_GROUPS.map((g) => `<optgroup label="${g.group}">${g.items.map((r) => `<option value="${esc(`${r.sound}|${r.name}`)}"${r.name === rn && r.sound === rs ? " selected" : ""}>${esc(r.name)} — ${r.zh}</option>`).join("")}</optgroup>`).join("") +
      `</select><label class="role-name">谱上写<input id="roleIn" class="role-in" type="text" spellcheck="false" autocomplete="off" value="${esc(rn)}" /></label><div class="role-sound">MusicXML：<code>${esc(rs)}</code></div></section>` +
    `<section class="ip-card"><h3>谁来演<small>演奏者和他手里的琴；名字不上谱</small></h3><div class="ip-cands">` +
      candidates(D.extras, role).map((c) => chip(`cand:${c.id}`, !performerOf(c.engine) ? `${esc(c.name)}（没人能演）` : esc(c.name), aid === c.id, chipTitle(c)) +
        (aid !== c.id && (performerOf(c.engine)?.removable ?? true) ? `<button class="btn cand-del" data-v="del:${esc(c.id)}" title="从休息室删掉（它嵌在歌里的声音一起丢）">×</button>` : "")).join("") + `</div>` + status +
      `<div class="ip-sub">换人</div><div class="ip-btns"><button class="btn primary" data-v="finder" title="全屏的乐器目录：按曲风 / 年代 / 族 / 发声方式浏览，右边的键盘试听，上场">打开乐器目录…</button>` +
      Object.values(SOUNDS).map((e) => `<button class="btn" data-v="sound:${esc(e.id)}" title="${esc(`${e.description ?? e.name}（${sizeText(e.bytes)}；家族音源库，第一次点才下载、之后留在设备上；${e.license.name}）`)}">从 ${esc(e.name)} 选…</button>`).join("") +
      `<button class="btn" data-v="sf2:pick" title="自己的 .sf2 文件：选中的那一件切出来留在这台设备上（几 MB），歌里只记来源；整个文件不留">从 .sf2 文件选…</button></div>` + pickerHtml() +
      `<div class="ip-note">选的琴歌里只记来源（歌小）：声音从这台设备 / 家族音源库 / 你的文件里找。要歌自己带着声音 = 文件菜单「全部打包进歌」，或导出「打包音源」的副本。</div></section>` +
    `<section class="ip-card ip-how"><h3>${esc(who)} 怎么演<small>右边的键盘弹的就是台上这位，改了马上能试</small></h3><div class="ip-grid">${how}</div>${eng !== "unknown" ? marksTableHtml(role, eng) : ""}</section>` +
    `</div></div>`;
  const inp = instEl.querySelector<HTMLInputElement>("#roleIn")!, sel = instEl.querySelector<HTMLSelectElement>("#roleSel")!;
  sel.addEventListener("change", () => { const [snd, ...nm] = sel.value.split("|"); if (snd) { setRole(nm.join("|"), snd); drawInst(); } });
  inp.addEventListener("change", () => setRole(inp.value));
  inp.addEventListener("keydown", (e) => { if (e.isComposing) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); setRole(inp.value); drawInst(); } });
  instEl.querySelector<HTMLSelectElement>("#sfSel")?.addEventListener("change", (e) => { const picked = instPicked; if (!picked) return; picked.sel = (e.target as HTMLSelectElement).value; const p = picked.presets.find((x) => `${x.bank}:${x.program}` === picked.sel); const n = instEl.querySelector<HTMLInputElement>("#sfName"); if (n && p) n.value = p.name; });
  instEl.querySelector<HTMLDetailsElement>("details.ip-adv")?.addEventListener("toggle", (e) => { instAdvOpen = (e.target as HTMLDetailsElement).open; });
  instEl.querySelector<HTMLSelectElement>(".ip-part")?.addEventListener("change", (e) => { commitRoleName(); instPicked = null; update(setFocus(D.st, D.st.at.paper, (e.target as HTMLSelectElement).value)); sound.allOff(); void prepareBank(); pad.render(); drawInst(); });
}
instEl.addEventListener("click", (e) => {
  const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
  const role = curRole(), rn = roleName(D.extras, role);
  if (v === "back") { closeInstPage(); return; }
  if (v === "pad") { showPad(padEl.hidden); drawInst(); return; }
  if (v === "finder") { commitRoleName(); openFinder(); return; }
  if (v.startsWith("cand:")) setActive(v.slice(5));
  else if (v.startsWith("del:")) { try { updateExtras(withoutCandidate(D.extras, role, v.slice(4)), { kind: "lounge", label: `「${rn}」退掉一位候选` }); } catch (err) { showError((err as Error).message); } }
  else if (v.startsWith("find:")) { findBankFile(v.slice(5)); return; }
  else if (v === "sf2:pick") { pickFile(); return; }
  else if (v.startsWith("sound:")) { void pickOfficial(v.slice(6)); return; }
  else if (v === "sf2:add") { void addPicked(); return; }
  else if (v === "sf2:cancel") instPicked = null;
  else if (v.startsWith("gap:")) { const def = gapDefaultOf(role)?.gapSec ?? 0, next = v === "gap:def" ? def : Math.max(0, Math.min(GAP_MAX_SEC, activePerfSpec(D.extras, role).gapSec + Number(v.slice(4)))); updateExtras(withGapSec(D.extras, role, next, D.st.song.hum), { kind: "lounge", label: `「${rn}」音和音之间 ${Math.round(next * 1000)} ms` }, "gap"); }
  else if (v.startsWith("cal:")) { const d = v === "cal:def" ? NaN : Number(v.slice(4)), next = Math.max(-30, Math.min(12, Number.isNaN(d) ? DEFAULT_CALIBRATION_DB : activeCalibrationDb(D.extras, role) + d)); updateExtras(withCalibration(D.extras, role, next, D.st.song.hum), { kind: "lounge", label: `「${rn}」响度校准 ${next} dB` }, "cal"); }
  else if (v.startsWith("hum:")) update(setHum(D.st, v.slice(4) as Hum));
  else { const ch = performerOf(engineNow())?.onInspector?.(v, inspectorCtx(role)); if (!ch) return; updateExtras(ch.extras, { kind: "lounge", label: ch.label }, ch.gesture); if (ch.silence) sound.allOff(); }   // 这位自己的行（力度 / 音效 / 修八度 / 唱法旋钮 / 分段唱…）：插件自己管（ADR-0004 §2.5）
  drawInst();
});
/** 视图态（desk，src/score/desk.ts）：存时聚一下（bytesNow）、开歌时散回去（loadDoc）。变量本身仍住这里（viewScope / pageFlow / partView）。 */
const deskNow = (): Desk => ({ scope: viewScope, pageFlow, scroll: scrollFlow, paper: D.st.at.paper, parts: Object.fromEntries(partView), mp3: mp3Quality, mode: ws.mode,
  pad: { fifths: D.st.input.inputFifths, scale: D.st.input.inputScale, unit: PAD_UNITS[D.st.input.unit], tuplet: D.st.input.tuplet, low: pad.rangeLow() }, ref: refHost.panel(), pdf: pdfFont });   // pad 的状态跟着歌走（同 WeebPaint editor-state）
function applyDesk(d: Desk): void {
  viewScope = d.scope; pageFlow = d.pageFlow; scrollFlow = d.scroll; mp3Quality = d.mp3; pdfFont = d.pdf;
  D.commit({ st: { ...D.st, input: { ...D.st.input, inputFifths: d.pad.fifths, inputScale: d.pad.scale, unit: Math.max(0, PAD_UNITS.indexOf(d.pad.unit)), tuplet: d.pad.tuplet } } }, { silent: true, undo: false });   // 视图态 / 输入态：只换真相，不重画（调用方自己画）
  partView.clear(); for (const [id, p] of Object.entries(d.parts)) partView.set(id, { ...freshPartView(), ...p });
  if (d.paper && d.paper !== D.st.at.paper) {
    const paper = D.st.song.papers.find((p) => p.id === d.paper), part = paper?.tracks[D.st.at.part] ? D.st.at.part : D.st.song.parts.find((p) => paper?.tracks[p.id])?.id;
    if (paper && part) D.commit({ st: setFocus(D.st, paper.id, part) }, { silent: true, undo: false });
  }
}
function loadDoc(song: Song, o: { stem: string; named: boolean; extras: Extras; handle: docFile.FileHandle | null; mtime?: number | null; identifier?: string | null; view?: unknown; references?: Record<string, Uint8Array> }): void {
  perfApi.mixBypass = false; busMuted.clear();   // 效果全关 / 混音轨静音是这次听的，换歌复位
  if (impro) toggleImpro();
  ui.close(); closeInstPage();
  doc.stem = o.stem; doc.named = o.named; doc.handle = o.handle; doc.mtime = o.handle ? (o.mtime ?? null) : null;
  doc.identifier = o.identifier ?? null; setActiveIdentifier(doc.identifier); coverTouched = false;
  const st0 = initState(song), startDyns = ensureStartDyns(st0.song, st0.nextId).added.length;
  D.load(withStartDyns(st0), o.extras);   // 换歌 / 云端覆盖重载 = 另一首的历史；基线 = 打开的样子（v0.10.39：老歌每张纸开头没写力度 = 补上，不标脏、不进 undo，下次存时一起写进去）
  const d = o.view ? unserializeDesk(o.view) : freshDesk();
  applyDesk(d);
  // 打开 = 上次存时的模式；谱里已经有音 = 键盘先收着，点一下才开（v0.10.21；user「打开时记住上次的模式，成品曲不应该老是跳到音符输入，容易误触」「或者默认键盘是关的，点一下才会开。」）。空的新歌照旧开着键盘
  ws.mode = finalOn() ? "listen" : d.mode; if (d.mode !== "listen") lastEditMode = d.mode;   // 定稿着 = 只能听（存的模式不看）
  ws.collapsed = D.st.song.papers.some((pp) => Object.values(pp.tracks).some((t) => t.some((x) => x.kind === "note")));
  applyWorkspace();
  void refHost.apply(o.references ?? {}, d.ref);   // 参考窗：歌里的卡 + 窗记在哪（新歌 = 空、收着）   // 视图态 + pad 的状态（1= / 调式 / 时值 / 连音 / 音域）随歌回来（没有 = 默认，同 WeebPaint）；改它们不标脏、不进 undo
  pad.setRangeLow(d.pad.low);
  onSongSwitch(); sound.allOff(); void prepareBank(); refreshIssues();   // 开歌那一刻清单重算：有事 = 一条 toast + 角标（§2.2½ 出口 ③）   // 换歌 = 录音房里的块全放掉、排着的不唱了、正在唱的也取消、上一首的计划清空（W-37：旧请求回来才不会被当成这首的报出来）、上一首撑大的堆还回去
  view.render(); pad.render(); renderTitle(); updateChrome();   // 挂签的两个下拉跟着这首歌（v0.10.10 修：开机直接恢复上次那首时下拉没刷，要切一下模式才出来——user「ctrl shift r的时候模式栏只能看到模式切换，看不到下拉框」）
  if (D.st.song.parts.some((p) => performerOf(activeInstrument(D.extras, p.role)?.engine)?.sound === "chunks")) void singer.warm(models.bases(), BUDGET.speechDisk);   // 歌里有月读 = 意图：引擎立刻起（PC 热启动 ≈ 1.5 s，藏在看谱的那几秒里）
  if (D.extras.final) info(`这首歌定稿了（第 ${D.extras.final.rev} 版，mp3 ${mp3SizeText(D.extras.final.mp3.bytes)}）：只能听。要改，三条杠里「改稿」。`);
  if (startDyns) info(`每张纸开头补了 ${startDyns} 个力度记号（就是那里本来生效的，听起来不变；下次存时一起写进文件）`);   // v0.10.39（user「每张纸（曲段）开头，对」）
  schedulePrewarm();   // 打开歌就预热（引擎起来 + 光标附近先唱）：第一次点播放不用等十秒（user 2026-10-10「为什么第三刀之后第一次点播放还是要等月读一段时间，pc上大概有十秒」）
}
/** 存好了：文件名从此定下来（之后和歌名各管各的；user「之后各管各的同意」）。 */
function markSaved(): void { doc.stem = docName(); doc.named = true; D.markSaved(); renderTitle(); }
/** 改过没存时先问一句（应用内面板，不用系统弹窗）。 */
function confirmDiscard(what: string): Promise<boolean> {
  if (!dirty()) return Promise.resolve(true);
  return new Promise((resolve) => {
    ui.close();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">「${esc(docName())}」改过还没存</div><div class="offer-msg">${what}会丢掉这些改动。</div>` +
      `<div class="offer-btns"><button class="btn" data-v="save">先存</button><button class="btn" data-v="go">丢掉，继续</button><button class="btn primary" data-v="no">算了</button></div></div>`;
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
  if (!(await confirmDiscard("新建"))) return;
  loadDoc(initState().song, { stem: defaultStem(), named: false, extras: emptyExtras(), handle: null });
  info("新的一首");
}
async function fileOpen(): Promise<void> {
  if (!(await leaveCurrent("打开别的歌"))) return;
  let picked: docFile.Picked | null;
  try { picked = await docFile.pickOpen(); } catch (e) { showError(`没打开：${(e as Error).message}`); return; }
  if (picked) openPicked(picked);
}
/** 拿到的文件（选的 / 拖进来的 / 双击打开的）→ 读进来。别的软件存的谱、或有读不进来的东西：不认它的家（存回去会把没读进来的丢掉 → 第一次「存」= 问存到哪）。 */
function openPicked(picked: docFile.Picked): void {
  try {
    const o = openBytes(picked.name, picked.bytes), own = o.ours && !o.notices.length;
    loadDoc(o.song, { stem: o.stem, named: true, extras: o.extras, handle: own ? picked.handle : null, mtime: own ? picked.mtime : null, view: o.view, references: o.references });
    if (o.notices.length) showError(o.notices.join(" "));
    else info(`打开了 ${picked.name}`);
  } catch (e) { showError(`打不开 ${picked.name}：${(e as Error).message}`); }
}
/** 封面的腰封 = 作者栏第一行（每次存重写，withPngText 先删旧块）；没有封面图就没有封面 entry。 */
const extrasForSave = (base: Extras = D.extras): Extras => (base.thumbnail ? withThumbnail(base, coverWithBlurb(base.thumbnail, (D.st.song.credits ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? null)) : base);
/** 这首歌的 .mxl 字节；extras = 换一份休息室 / 音源来存（导出「打包音源」的副本：只改那一份，不改正本）。 */
const bytesNow = (extras?: Extras, song: Song = D.st.song) => saveMxl({ ...saveArgs(extras, song), references: refHost.files() });
/** saveMxl 要的那一份（指纹也按它算，不带参考窗——参考窗不进指纹）。core = 渲染核心的版本 + 哈希（每次保存都记）。 */
const saveArgs = (extras?: Extras, song: Song = D.st.song) => ({ view: serializeDesk(deskNow()) as Record<string, unknown> | null, song, hum: song.hum, extras: extrasForSave(extras), app: APP_VERSION, date: new Date().toISOString(), core: coreInfo() });
const mp3SizeText = (n: number) => (n < 1e6 ? `${Math.round(n / 1e3)} KB` : `${(n / 1e6).toFixed(1)} MB`);   // song = 换一份歌来存（导出副本：许可冲突时按未声明写）
const mxlFile = (name: string, extras?: Extras, song?: Song) => new File([bytesNow(extras, song) as unknown as BlobPart], name, { type: "application/vnd.recordare.musicxml" });
const stemOf = (name: string) => name.replace(/\.(mxl|musicxml|xml)$/i, "");
const sizeText = (n: number) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(1)} MB`);
/** 存 = 回家，一个动作（WeebPaint 一画一家；user 2026-08-25 grill「保存按钮=回家（单一动作），导出 hub=寄明信片」）：
 *  · 有家（打开的那个文件）= 存回去。写之前对一次 mtime，文件在外面被改过就先问（0819 spec §7「原位写回前查 lastModified」）。
 *  · 还没有家 = 安家：桌面 Chromium 先开系统保存框（在手势里；取消 = 到此为止，不降级弹下载——「AbortError ≠ 环境不支持」），再编码、写、认领句柄。
 *  · iPad / Safari 没有句柄这回事 = 下载或分享一个 .mxl 到「文件」里，点了才算存了。这台设备上下载就是存（没有别的家可回；
 *    WeebPaint 的「下载不清 dirty」是因为它 iPad 的家在图库——这里没有，「•」留着只会狼来了，0819 §7.2「有真正会丢的字节才拦」）。 */
async function fileSave(): Promise<void> {
  try {
    if (doc.identifier) { await smartSaveStore(); return; }   // 歌库里的歌：smart save
    if (doc.handle) {
      const h = doc.handle, now = await docFile.mtime(h);
      if (docFile.isStale(doc.mtime, now) && !(await askSheet(`「${h.name}」在外面被改过`, "打开或上次存之后，这个文件被别的程序改过。覆盖 = 外面改的那些会丢。", "覆盖"))) { info("没存"); return; }
      await docFile.writeTo(h, bytesNow());
      if (doc.handle === h) { doc.mtime = await docFile.mtime(h); markSaved(); }   // 写的间隙没换家才记（换了家 = 别把别人的名字标成存好了）
      info(`存好了：${h.name}`); return;
    }
    if (docFile.canPickSave()) {
      const h = await docFile.pickSave(`${docName()}.mxl`);
      if (!h) { info("没存（取消了）"); return; }
      await docFile.writeTo(h, bytesNow());
      doc.stem = stemOf(h.name) || doc.stem; doc.named = true; doc.handle = h; doc.mtime = await docFile.mtime(h);
      markSaved(); info(`存好了：${h.name}`); return;
    }
    const file = mxlFile(`${docName()}.mxl`);
    offerFile(file, "存成 .mxl", `${esc(file.name)} · ${sizeText(file.size)}。下载或分享到「文件」里；以后从文件菜单「打开」。`, markSaved);
  } catch (e) { showError(`没存上：${(e as Error).message}`); }
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
      if (missing.length) showError(`这几件找不到声音，副本里没带：${missing.join("、")}。点谱前面的声部名，在「谁来演」里「找文件…」，再导出一次。`);
    }
    const roles = soundingRoles(), { rights, fellBack } = exportRights(roles);
    const song: Song = fellBack ? (({ rights: _r, ...rest }) => rest)(D.st.song) : D.st.song;
    const credits = (fellBack ? `<div class="offer-msg">许可这一份按「未声明」写了（你选的许可和小月相的条款可能冲突；作者栏里的选择没动）。</div>` : "") +
      creditsBlock(creditsOf(roles, rights).lines, "署名") + creditsBlock(packedLicenses(extras), "打包分发的许可（这份副本里带着这些源文件）");
    if (docFile.canPickSave()) {
      const h = await docFile.pickSave(name); if (!h) return;
      await docFile.writeTo(h, bytesNow(extras, song)); info(`存了一份：${h.name}${fellBack ? "（许可按未声明写）" : ""}`); return;
    }
    const file = mxlFile(name, extras, song);
    offerFile(file, packed ? "存一份 .mxl 副本（打包音源）" : "存一份 .mxl 副本", `${esc(file.name)} · ${sizeText(file.size)}。现在这首歌的一份拷贝；这里再改，它不会跟着变。${credits}`);
  } catch (e) { showError(`没存上：${(e as Error).message}`); }
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
    updateExtras(r.extras, { kind: "lounge", label: `打包了 ${r.packed.length} 件声音` });
    const size = Object.values(D.extras.sounds).reduce((n, b) => n + b.length, 0);
    info(`打包了 ${r.packed.length} 件声音进歌：现在歌里带着 ${sizeText(size)}${size > embedSoftLimit ? `（超过 ${sizeText(embedSoftLimit)}：存 / 同步会慢一点）` : ""}，发给别人也能响`);
  }
  if (missing.length) showError(`这几件找不到声音，没打包：${missing.join("、")}。点谱前面的声部名，在「谁来演」里「找文件…」。`);
  if (!r.packed.length && !missing.length) info("没有要打包的（小月相 / 元音版不打包：它们是模型包，歌里只钉哈希）");
}
async function unpackAll(): Promise<void> {
  // 先把字节留到设备上；留不住、家族音源库里又没有的不解（解了就找不回来——数据安全优先，明说）
  const bytesBySha = new Map<string, Uint8Array>();
  for (const role of Object.keys(D.extras.lounge)) for (const g of gmCandidates(D.extras, role)) if (g.bytes) bytesBySha.set(g.subsetSha256, g.bytes);
  const uses = soundUses(D.extras).filter((u) => u.packed && bytesBySha.has(u.subsetSha256));
  if (!uses.length) { info("歌里没有打包着的声音"); return; }
  const ok = new Set<string>(), stuck: string[] = [];
  for (const u of uses) {
    const b = bytesBySha.get(u.subsetSha256)!;
    sources.session.keep(u.subsetSha256, b);
    await rememberSound(u.subsetSha256, b, true);
    if (u.origin.library || (await isSoundPersisted(u.subsetSha256))) ok.add(u.subsetSha256); else stuck.push(u.names.join("、"));
  }
  const r = withUnpacked(D.extras, (sha) => ok.has(sha));
  if (r.removed.size) {
    updateExtras(r.extras, { kind: "lounge", label: `解包了 ${r.removed.size} 件声音` });
    info(`解包了 ${r.removed.size} 件：歌里只记来源（小了 ${sizeText([...r.removed.values()].reduce((n, b) => n + b.length, 0))}）；这台设备上留着，照样能响。别的设备上从家族音源库或原文件找`);
  }
  if (stuck.length) showError(`这几件没解包：${stuck.join("；")}——这台设备留不住它的声音（空间不够，或浏览器不让存），家族音源库里也没有，解了就找不回来。`);
}
/** 署名推演的一块（文件菜单 / 导出好了的面板里；src/format/credits.ts）：空 = 不画。「复制署名」由下面那个全局监听接。 */
/** 署名一块：**折叠着**，点开才看（user 2026-10-08「只有用户自己关心协议的时候才提出这些」——不推到眼前）。 */
function creditsBlock(lines: CreditLine[], title: string): string {
  if (!lines.length) return "";
  return `<details class="credits-box"><summary class="part-sec">${esc(title)}</summary><pre class="credits-pre">${esc(creditsText(lines))}</pre>` +
    `<button class="btn" data-copy-credits title="复制下来贴进作品说明">复制署名</button></details>`;
}
document.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-copy-credits]"); if (!b) return;
  e.stopPropagation();
  const text = b.parentElement?.querySelector(".credits-pre")?.textContent ?? "";
  void navigator.clipboard?.writeText(text).then(() => info("署名复制好了"), () => showError("复制不了（浏览器不让）：长按上面的字自己选"));
}, true);
/** 导出 hub（照 WeebPaint「导出与另存」hub：导出 = 寄明信片，和「存 = 回家」分开住）：歌声 mp3 / .mxl 副本；乐谱 PDF 以后也进这里。 */
function openExportHub(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">导出</div>` +
    `<div class="set-row file-row">` +
    `<button class="btn" data-v="mp3" title="${finalOn() ? "定稿的那一份 mp3，直接分享或下载（不重渲）" : "小月相唱一遍，编成 mp3，分享或下载"}"><svg class="ico"><use href="#export"/></svg>歌声（mp3${finalOn() ? "，定稿的那份" : ""}）…</button>` +
    `<button class="btn" data-v="pdf" title="印出来的谱（按这首歌的纸张分页；歌词用嵌进去的字体，能选中复制）"><svg class="ico"><use href="#export"/></svg>乐谱（PDF）…</button>` +
    `<button class="btn" data-v="mxl" title="现在这首歌的一份拷贝（文件名带时刻）；这里的歌还住原来的家"><svg class="ico"><use href="#save-as"/></svg>存一份 .mxl 副本…</button>` +
    (soundUses(D.extras).some((u) => !u.packed) ? `<button class="btn" data-v="mxlPacked" title="副本里把乐器的声音也装进去（发给别人也能响）；这里的歌照旧只记来源"><svg class="ico"><use href="#save-as"/></svg>存一份 .mxl 副本（打包音源）…</button>` : "") + `</div>` +
    `<div class="offer-msg">导出 = 寄一份出去，这里的歌还是原来那个家，「存」才是存回去。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
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
/** 乐谱 PDF 的面板（2026-10-09 Opus 5.5；user「自己写pdf，然后字体可以选普通的和那个拼音可爱的…歌词用字体」）：选字体 → 生成 → 分享 / 下载（同 mp3）。
 *  字体点了才下（黑体约 6 MB / 拼音约 12 MB，第一次），用完就放掉。萌神拼音 = 汉字头上标普通话拼音（日文歌的汉字也会被标上）。 */
function openPdfPanel(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  // 印哪些（2026-10-09，user「只印一段或一个声部 这个也到时候需要做，和wxhw差不多，在只显示一个声部的时候你可以选」；照 WXHW 导出面板的「范围」段选，用不上的不露）：
  //   纸 = 整首 / 这一段（默认跟现在的视图：本段 = 这一段）；声部（有隐藏的才露）= 照分页预览（隐藏的空着位置）/ 只排看得见的（重排、不留空位 = 分谱）
  const curPaper = D.st.song.papers.find((p) => p.id === D.st.at.paper) ?? D.st.song.papers[0]!;
  let paperPick: "all" | "one" = viewScope === "segment" && D.st.song.papers.length > 1 ? "one" : "all", partPick: "view" | "shown" = "view";
  const someHidden = D.st.song.parts.some((p) => !isShown(p.id)), shownNames = partLabels(D.st.song, D.extras).filter((_, k) => isShown(D.st.song.parts[k].id));
  const draw = () => {
    const chip = (id: PdfFontId, label: string, note: string) => `<button class="btn cand${pdfFont === id ? " is-on" : ""}" data-v="font:${id}" title="${esc(note)}">${label}</button>`;
    const pick = (v: string, on: boolean, label: string, note: string) => `<button class="btn cand${on ? " is-on" : ""}" data-v="${v}" title="${esc(note)}">${esc(label)}</button>`;
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">乐谱（PDF）</div>` +
      (D.st.song.papers.length > 1 ? `<div class="part-sec">印哪些</div><div class="set-row">${pick("paper:all", paperPick === "all", "整首", "每张纸按顺序接着排（= 分页 + 「全部」）")}${pick("paper:one", paperPick === "one", `这一段「${curPaper.name || "这张纸"}」`, "只印光标所在的这张纸（= 分页 + 「本段」）")}</div>` : "") +
      (someHidden ? `<div class="part-sec">声部</div><div class="set-row">${pick("parts:view", partPick === "view", "照分页预览", "隐藏的声部不印，预览里那条细行的位置空着（和预览一样）")}${pick("parts:shown", partPick === "shown", `只排看得见的：${shownNames.join("、")}`, "隐藏的声部整个拿掉、重新排，不留空位（像抽出来的分谱；和分页预览不一样）")}</div>` : "") +
      `<div class="part-sec">歌词的字体</div><div class="set-row">${chip("sans", "黑体", "思源黑体：中文 / 日文 / 英文都有")}${chip("pinyin", "拼音", "萌神手写体：汉字头上标普通话拼音（可爱）；日文歌的汉字也会被标上普通话拼音")}</div>` +
      `<div class="offer-msg">${pdfFont === "pinyin" ? "萌神手写体：汉字头上标普通话拼音，歌词那一行会往下让出拼音的地方。日文歌的汉字也会被标上普通话拼音。" : "思源黑体：中文、日文、英文都有。"}第一次要下载字体（约 ${PDF_FONT_MB[pdfFont]} MB），之后离线也能用。纸张 = 这首歌的纸（纸的扳手里改）。</div>` +
      `<div class="offer-msg">${partPick === "shown" ? `只排看得见的声部（${esc(shownNames.join("、"))}）：重新排、不留空位——和分页预览不一样。` : `印出来的 = 扳手里「分页」+ 曲段控件「${paperPick === "one" ? "本段" : "全部"}」看到的样子，去掉按钮和提示；隐藏的${paperPick === "one" ? "" : "纸 / "}声部不印（预览里那条细行的位置空着）。`}</div>` +
      `<div class="offer-btns"><button class="btn" data-v="close">算了</button><button class="btn primary" data-v="go">生成 PDF</button></div></div>`;
  };
  draw(); document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v?.startsWith("font:")) { pdfFont = v.slice(5) as PdfFontId; draw(); view.render(); return; }   // 视图态（desk）：存时顺手带、不标脏；分页预览跟着让出拼音那一截
    if (v === "paper:all" || v === "paper:one") { paperPick = v === "paper:all" ? "all" : "one"; draw(); return; }
    if (v === "parts:view" || v === "parts:shown") { partPick = v === "parts:view" ? "view" : "shown"; draw(); return; }
    if (v === "go") { close(); void exportPdf(pdfFont, { ...(paperPick === "one" ? { paper: curPaper.id } : {}), ...(partPick === "shown" ? { onlyShown: true } : {}) }); }
  });
}
/** PDF 印哪些：paper = 只印这一张纸；onlyShown = 只排看得见的声部（隐藏的整个拿掉、重排）。 */
interface PdfPick { paper?: string; onlyShown?: boolean }
let pdfBusy = false;
/** 生成乐谱 PDF = 「全部 + 分页」预览除了控件和提示的样子（2026-10-09 user「…做到除了控件和提示外的wysiwyg」）：整首；隐藏的纸 / 声部不印（预览里那条细行的位置空着），
 *  同一份声部视图、同一把量字的尺子（view.measureAt）、同一个小节线开关、同样的拼音让位。 */
async function makePdf(fontId: PdfFontId, pick: PdfPick = {}): Promise<{ file: File; r: ReturnType<typeof scorePdf> }> {
    progress(`下载字体（第一次约 ${PDF_FONT_MB[fontId]} MB）…`);
    const [font, music] = await Promise.all([loadPdfFont(fontId), loadMusicOutlines()]);
    progress("排版…");
    const title = D.st.song.title || docName();
    let song = D.st.song, parts = partViews();
    if (pick.onlyShown) {   // 只排看得见的：隐藏的声部（连它在各张纸上的轨）整个拿掉；一个看得见的声部都没有的纸也拿掉
      const keep = new Set(D.st.song.parts.filter((p) => isShown(p.id)).map((p) => p.id));
      song = { ...song, parts: song.parts.filter((p) => keep.has(p.id)), papers: song.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).filter(([k]) => keep.has(k))) })).filter((p) => Object.keys(p.tracks).length || p.id === pick.paper) };
      parts = parts.filter((v) => keep.has(v.id)).map((v, k) => ({ ...v, hidden: false, first: k === 0 }));
    }
    const r = scorePdf({ song, parts, font, fontId, music, title, created: new Date(), measureAt: (px) => view.measureAt(px), autoBars, ...(pick.paper ? { onlyPaper: pick.paper } : {}) });
    const paperName = pick.paper ? (D.st.song.papers.find((p) => p.id === pick.paper)?.name || "这一段") : "";
    const suffix = [paperName, pick.onlyShown ? parts.map((v) => v.name).join("+") : ""].filter(Boolean).map((x) => fileSafe(x)).join("-");
    return { file: new File([r.bytes as unknown as BlobPart], `${stampedCopy(`${docName()}${suffix ? `-${suffix}` : ""}`)}.pdf`, { type: "application/pdf" }), r };   // 名[-曲段 / 声部]-YYYYMMDD-HHMM（v0.9.47）
}
async function exportPdf(fontId: PdfFontId, pick: PdfPick = {}): Promise<void> {
  if (pdfBusy) return;
  pdfBusy = true;
  try {
    const { file, r } = await makePdf(fontId, pick);
    progress("");
    const miss = r.stats.missing.length ? `<div class="offer-msg">这些字这款字体里没有，PDF 里是空白：${esc(r.stats.missing.slice(0, 20).join(" "))}${r.stats.missing.length > 20 ? " …" : ""}</div>` : "";
    const missM = r.stats.missingMusic.length ? `<div class="offer-msg">有 ${r.stats.missingMusic.length} 种记谱符号没画出来（${esc(r.stats.missingMusic.join(" "))}）——这是 app 的毛病，请告诉我们。</div>` : "";
    offerFile(file, "乐谱 PDF 好了", `${r.pages} 页 · ${fontId === "pinyin" ? "拼音字体" : "黑体"} · ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}` + miss + missM);
  } catch (e) {
    progress(""); showError(`PDF 生成失败：${(e as Error).message}`);
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
  return `<div class="part-sec">乐器的声音</div>` +
    `<div class="offer-msg">${uses.length} 件：打包在歌里 ${packed.length} 件${packed.length ? `（${sizeText(size)}）` : ""}，只记来源 ${uses.length - packed.length} 件。打包 = 声音跟着歌走（发给别人也能响，文件变大）；只记来源 = 歌小，声音从这台设备 / 家族音源库 / 你的文件里找。小月相不打包（她是模型包，歌里只钉哈希）。</div>` +
    `<div class="set-row">${packed.length < uses.length ? `<button class="btn" data-v="pack">全部打包进歌</button>` : ""}${packed.length ? `<button class="btn" data-v="unpack">全部解包（只记来源）</button>` : ""}</div>` +
    creditsBlock(packedLicenses(D.extras), "打包分发的许可（文件里带着这些源文件）");
}
/** 演出署名（文件菜单 / 导出）：用了谁的声音——出了声的声部上场那位，打包 / 弱引用都算；冷板凳、没出声的声部不算（user 2026-10-08 口径）。 */
/** 署名 = 这首歌自己那一条（作者栏 + 用户选的许可；都空 = 没有这条）+ 演出署名；外加只提示不拦的提醒（licenseHints）。导出 mp3 写进 ID3 也用这一份。 */
/** rights = 这一份写的许可（导出时可能回退成未声明：exportRights）；不给 = 歌里选的。 */
function creditsOf(roles: readonly string[], rights: string | undefined = D.st.song.rights): { lines: CreditLine[]; hints: string[] } {
  const perf = performerCredits(D.extras, roles), own = songCreditLine({ ...D.st.song, rights });
  return { lines: own ? [own, ...perf] : perf, hints: licenseHints(rights, perf) };
}
/** 文件菜单里的署名（折叠）；提醒只在用户自己选了许可时才可能出现（licenseHints 要 rights）。 */
const performersBlock = (roles: readonly string[], title = "署名") => {
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
  return doc.identifier ? `在歌库里，自动存${isSignedIn() ? "；换歌 / 退出 / 按「存」时推上 OneDrive" : "（没登录，只在这台设备上）"}`
    : doc.pendingHome ? "新的一首：第一笔写下去就进歌库"
    : doc.handle ? `存在本机文件 ${doc.handle.name}，「存」= 存回去`
    : docFile.canPickSave() ? "还没存过：「存」会问存到哪" : "这台设备上「存」= 下载或分享一个 .mxl";
}
function clickFileName(): void {
  if (doc.handle) { info(`本机文件的名字在文件管理器里改（现在是 ${doc.handle.name}）`); return; }
  void renameActive();
}
$("fileBtn").addEventListener("click", () => clickFileName());
function openMainMenu(): void {
  if (ui.overlay) { ui.close(); return; }   // 再点一下三条杠 = 收起
  const box = document.createElement("div");
  box.className = "track-card ctx-menu main-menu"; box.setAttribute("role", "menu");
  const inStore = doc.identifier != null;
  const item = (v: string, icon: string, label: string, title = "") => `<button class="btn ctx-item" data-v="${v}"${title ? ` title="${esc(title)}"` : ""}>${icon ? `<svg class="ico"><use href="#${icon}"/></svg>` : `<span class="ico"></span>`}${label}</button>`;
  box.innerHTML =
    `<div class="ctx-head"><b>${esc(doc.handle ? doc.handle.name : `${docName()}${SONG_SUFFIX}`)}</b><span>${esc(fileWhere())}</span></div>` +
    item("new", "new", "新建") + item("open", "folder-open", "打开本机文件…", "打开 .mxl / .musicxml（拖进来也行；Ctrl / ⌘+O）") +
    item("export", "export", "导出…", "mp3、.mxl 副本（打包音源）…（Ctrl / ⌘+Shift+S）") +
    (hasStore() && !inStore && !doc.pendingHome ? item("intoLib", "import", "存进歌库", "把这首歌放进歌库（这台设备上留一份；登录后同步到 OneDrive）") : "") +
    `<div class="ctx-sep"></div>` +
    (doc.handle ? "" : item("rename", "rename", "改文件名…", "只改文件名，纸上的歌名不变（点顶栏的文件名也一样）")) +
    item("cover", "image", "封面图…", "歌库卡片上的图") +
    item("sounds", "volume", "声音与署名…", "乐器的声音打包 / 解包；这首歌用了谁的声音") +
    (finalOn() ? item("unfinal", "unlock", `改稿…（第 ${D.extras.final!.rev} 版定稿作废）`, "解锁：谱 / 歌手 / 混音又能改；定稿那份 mp3 作废（下次存就没了）") : item("final", "lock", "定稿…", "写好了：整首渲染成 mp3 存进歌里，之后只能听、不能改；歌库封面上能直接听。改稿随时解锁")) +
    item("ref", "picture-in-picture", refHost.isOpen() ? "收起参考窗" : `参考窗${refHost.count() ? `（${refHost.count()} 张）` : ""}`, "截图 / 文字放在旁边对着看：点开后粘贴（Ctrl / ⌘+V）、拖进来，或者「＋」导入；跟着歌一起存") +
    `<div class="ctx-sep"></div>` +
    `<div class="ctx-ver">${esc(APP_VERSION)}</div>` +   // 版本号小灰字（user 2026-10-08「版本号小灰字放在设置menuitem上面」）
    item("settings", "settings", "设置…", "模型 / 音源库来源、缓存、署名与条款、诊断日志、版本");
  document.body.append(box);
  const r = $("setBtn").getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, m = 8;
  box.style.left = `${Math.max(m, Math.min(r.right - w, innerWidth - w - m))}px`; box.style.top = `${Math.max(m, Math.min(r.bottom + 6, innerHeight - h - m))}px`;
  const outside = (e: PointerEvent) => { if (!box.contains(e.target as Node) && !$("setBtn").contains(e.target as Node)) close(); };
  const close = () => { document.removeEventListener("pointerdown", outside, true); box.remove(); ui.closed(close); };
  setTimeout(() => { if (box.isConnected) document.addEventListener("pointerdown", outside, true); }, 0);
  ui.open({ k: "menu", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    close();
    if (v === "new") void fileNew(); else if (v === "open") void fileOpen(); else if (v === "export") openExportHub();
    else if (v === "intoLib") void saveIntoGallery(); else if (v === "rename") void renameActive();
    else if (v === "cover") openCoverSheet(); else if (v === "sounds") openSoundsSheet(); else if (v === "settings") openSettings(); else if (v === "ref") refHost.toggle();
    else if (v === "final") openFinalPanel(); else if (v === "unfinal") void unfinalizeNow();
  });
}
// ── 定稿 / 改稿（W-38；user 2026-10-13「写好了之后加锁，会渲染mp3，之后只能听，不能修改…gallery可以试听mp3不用开app」「定稿改稿同意」）──────────
//   定稿 = 走无头渲染核心把整首渲成 mp3（静音 / 独奏按现在；效果照常）→ 记录（时刻 / 第几版 / 核心版本 + 哈希 / 出声内容的指纹 / mp3 参数 / 哪些声部）+ 裸 mp3 进 extras →
//   自动存（歌库）/「•」（本机）。之后四层护栏（final.ts 头注释）。改稿 = 记录和 mp3 一起丢掉。两件都不进 undo（定稿是一次渲染，撤销 = 改稿）。
function openFinalPanel(): void {
  ui.close();
  if (finalOn()) { info("已经定稿了。要改先「改稿」。"); return; }
  const box = document.createElement("div");
  box.className = "offer";
  const draw = () => {
    const chip = (v: string, label: string, note: string, on: boolean) => `<button class="btn cand${on ? " is-on" : ""}" data-v="${v}">${esc(label)}<small>${esc(note)}</small></button>`;
    const parts = audibleParts(), labels = partLabels(D.st.song, D.extras), names = D.st.song.parts.map((p, k) => (parts.includes(p) ? labels[k] : null)).filter((x): x is string => !!x);
    const is = perfApi.issues().filter((i) => parts.some((p) => p.id === i.part));
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">定稿${D.extras.finalRev ? `（第 ${D.extras.finalRev + 1} 版）` : ""}</div>` +
      `<div class="offer-msg">写好了：整首渲染成 mp3（带歌名 / 作者栏 / 许可的标签和封面图）存进歌里；之后<b>只能听</b>——谱、歌名、作者栏、许可、封面、歌手、混音全锁住，能改的只有文件名。随时「改稿」解锁（那份 mp3 作废）。歌库的封面上能直接听。</div>` +
      `<div class="part-sec">音质</div><div class="set-row">${(Object.keys(MP3_QUALITY) as Mp3Quality[]).map((q) => chip(`q:${q}`, MP3_QUALITY[q].label, MP3_QUALITY[q].note, mp3Quality === q)).join("")}</div>` +
      `<div class="offer-msg">进 mp3 的：${names.length ? esc(names.join("、")) : "（没有出声的声部）"}${D.st.song.parts.length !== parts.length ? "（静音 / 独奏按现在的；要都进来先取消静音）" : ""}。</div>` +
      (is.length ? `<div class="offer-msg issue-warn">${is.length} 条轨不出声，mp3 里不会有它们：${esc(perfApi.issuesText(is))}。换人在谱前面的声部名里。</div>` : "") +
      `<div class="offer-btns"><button class="btn primary" data-v="go"${names.length ? "" : " disabled"}>${is.length ? "照样定稿" : "定稿"}</button><button class="btn" data-v="close">算了</button></div></div>`;
  };
  draw();
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v?.startsWith("q:")) { mp3Quality = v.slice(2) as Mp3Quality; draw(); }
    else if (v === "go") { close(); void finalizeNow(mp3Quality); }
  });
}
let finalizing = false;
/** 定稿：渲 → 记录 + mp3 进 extras → 听模式 → 自动存 / 「•」。失败 = 什么都不变（报出来）。返回记录（E2E 用）。 */
async function finalizeNow(quality: Mp3Quality = mp3Quality): Promise<FinalRecord | null> {
  if (finalizing || finalOn()) return null;
  finalizing = true;
  try {
    await homeIfEdited();
    const r = await perfApi.renderMp3({ quality, scope: "all" });
    const is = perfApi.issues();   // 定稿那一刻的清单（mp3 里没有它们）
    // 存的就是发行的那一份：ID3（歌名 / 作者 / 许可 / 署名 / 软件）+ 封面图（APIC）+ 音频帧，之后原字节导出（user「都冻同意，封面当然进」）
    const tagged = new Uint8Array(perfApi.mp3Tag(r.roles).tag.length + r.bytes.length); tagged.set(perfApi.mp3Tag(r.roles).tag, 0); tagged.set(r.bytes, tagged.length - r.bytes.length);
    const rec: FinalRecord = { at: new Date().toISOString(), rev: D.extras.finalRev + 1, app: APP_VERSION, core: coreInfo(), fingerprint: contentFingerprintOf(saveArgs()),
      mp3: { path: FINAL_MP3_ENTRY, bytes: tagged.length, sha256: await sha256Hex(tagged), secs: r.secs, sr: r.sr, kbps: r.kbps, stereo: r.stereo }, parts: r.parts, ...(is.length ? { issues: is.map((i) => ({ part: i.part, why: i.why })) } : {}) };
    if (ws.mode !== "listen") { lastEditMode = ws.mode; ws.mode = "listen"; }
    const c = D.commit({ extras: withFinal(D.extras, rec, tagged) }, { locus: { kind: "final", label: "定稿" }, undo: false });   // 同一个入口（不进 undo：撤销 = 改稿）；基线带着 final.at → 标脏 → 歌库自动存 / 本机「•」
    if (!c.ok) throw new Error(c.why);
    info(`定稿了（第 ${rec.rev} 版）：mp3 ${mp3SizeText(r.bytes.length)}、${r.secs.toFixed(1)} 秒，存进了歌里；${doc.identifier ? "歌库封面上能直接听。" : "按「存」写进文件。"}只能听了——要改，三条杠里「改稿」。`);
    diagNote("doc", `finalized rev ${rec.rev} core ${rec.core.version}@${rec.core.hash} mp3 ${r.bytes.length}B`);
    return rec;
  } catch (e) { showError(`没定稿：${(e as Error).message}`); return null; }
  finally { finalizing = false; }
}
/** 改稿：问一句 → 记录和 mp3 一起丢掉 → 回到写。 */
async function unfinalizeNow(ask = true): Promise<boolean> {
  const f = D.extras.final; if (!f) return false;
  if (ask && !(await askSheet("改稿", `解锁后谱、歌名、作者栏、封面、歌手、混音又能改；第 ${f.rev} 版定稿的 mp3 作废（下次存就从歌里去掉；歌库封面上也听不了，要再定稿一次）。`, "改稿"))) return false;
  D.commit({ extras: withoutFinal(D.extras) }, { locus: { kind: "final", label: "改稿" }, undo: false });
  setMode(lastEditMode === "listen" ? "notes" : lastEditMode);
  info(`改稿了：第 ${f.rev} 版定稿作废，能改了。`);
  diagNote("doc", `unfinalized rev ${f.rev}`);
  return true;
}
/** 封面图（歌库卡片上的图；缩成 256² 存进歌里）。 */
function openCoverSheet(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  const thumb = D.extras.thumbnail;
  const coverUrl = thumb ? URL.createObjectURL(new Blob([thumb as unknown as BlobPart], { type: "image/png" })) : null;
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">封面图</div>` +
    `<div class="set-row cover-row"><span class="cover-thumb">${coverUrl ? `<img src="${coverUrl}" alt="封面" />` : `<span class="cover-none">没有封面图</span>`}</span>` +
    `<label class="btn" title="选一张图当封面（缩成 256² 存进歌里；歌库卡片上歌名印在图上面）"><svg class="ico"><use href="#image"/></svg>${thumb ? "换一张…" : "选一张图…"}<input id="coverIn" type="file" accept="image/*" hidden /></label>` +
    (thumb ? `<button class="btn" data-v="coverOff">去掉封面图</button>` : "") + `</div>` +
    `<div class="offer-msg">歌库卡片上的图；歌名和日期照样印在上面。缩成 256² 存进歌里。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); if (coverUrl) URL.revokeObjectURL(coverUrl); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.querySelector<HTMLInputElement>("#coverIn")!.addEventListener("change", (e) => { const f = (e.target as HTMLInputElement).files?.[0]; close(); if (f) void setCover(f); });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v === "coverOff") { close(); updateExtras(withThumbnail(D.extras, null), { kind: "cover", label: "去掉封面图" }); info("去掉了封面图"); }
  });
}
/** 声音与署名：乐器的声音打包 / 解包（Blender 式）+ 这首歌用了谁的声音（演出署名，折叠）。 */
function openSoundsSheet(): void {
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  const sounds = soundsSection();
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">声音与署名</div>` +
    (sounds || `<div class="offer-msg">这首歌没用乐器的声音文件（小月相 / 元音版的声音随 app 走，不进歌）。</div>`) + performersBlock(soundingRoles()) +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  ui.open({ k: "sheet", close });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v === "pack" || v === "unpack") { close(); void (v === "pack" ? packAll() : unpackAll()).then(() => openSoundsSheet()); }   // 做完回到这里：看得见新状态和署名
  });
}
/** 改文件名（只给还没有家的：下次存 / 下载用这个名字；纸上的歌名不变；user「之后各管各的同意，但是要有改文件名的规则？」）。
 *  有家的不进这里（菜单不露）：浏览器改不了磁盘上的名字，在文件管理器里改。 */
function renameFile(): void {
  if (doc.handle) return;
  ui.close();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">改文件名</div>` +
    `<label class="set-field">文件名<input id="fnIn" type="text" spellcheck="false" autocomplete="off" value="${esc(docName())}" /></label>` +
    `<div class="offer-msg">只改文件名，纸上的歌名不变。下次存的时候用这个名字。</div>` +
    `<div class="offer-btns"><button class="btn" data-v="cancel">算了</button><button class="btn primary" data-v="ok">改</button></div></div>`;
  document.body.append(box);
  const inp = box.querySelector<HTMLInputElement>("#fnIn")!;
  const close = () => { box.remove(); ui.closed(close); scoreEl.focus(); };
  const ok = () => { const v = fileSafe(inp.value); if (v && v !== docName()) { doc.stem = v; doc.named = true; renderTitle(); info(`文件名改成 ${v}.mxl`); } close(); };
  ui.open({ k: "sheet", close });
  inp.addEventListener("keydown", (e) => { if (e.isComposing) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ok(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "cancel") close(); else if (v === "ok") ok();
  });
  inp.focus(); inp.select();
}
/** 问一句（应用内面板，不用系统弹窗）：点了 okLabel = true；点背板 / 算了 / Esc = false。 */
function askSheet(title: string, msg: string, okLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    ui.close();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">${esc(title)}</div><div class="offer-msg">${esc(msg)}</div>` +
      `<div class="offer-btns"><button class="btn" data-v="ok">${esc(okLabel)}</button><button class="btn primary" data-v="no">算了</button></div></div>`;
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
  if (doc.identifier) void es.flushLocal().catch(() => undefined);
});
// 拖进来打开（.mxl / .musicxml / .xml；桌面 Chromium 还能拿到句柄 = 有家）。⚠ 句柄要在 drop 事件里同步抓（docFile.grabDrop），await 之后 items 就空了。
window.addEventListener("dragover", (e) => { if (e.dataTransfer?.types.includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } });
window.addEventListener("drop", (e) => {
  const gr = e.dataTransfer ? docFile.grabDrop(e.dataTransfer) : null;
  if (!gr) return;   // 不是我们认的文件 = 不拦这次 drop
  e.preventDefault();
  void (async () => {
    if (!(await leaveCurrent(`打开「${gr.file.name}」`))) return;
    try { openPicked(await docFile.fromGrab(gr)); } catch (err) { showError(`没打开：${(err as Error).message}`); }
  })();
});
// 安装成 PWA 后双击 .mxl 用 MoonSinger 打开（manifest file_handlers → launchQueue；照 WeebPaint consumeLaunchFiles）。
docFile.consumeLaunchFiles((h) => { void (async () => {
  if (!(await leaveCurrent(`打开「${h.name}」`))) return;
  try { openPicked(await docFile.readHandle(h)); } catch (err) { showError(`没打开：${(err as Error).message}`); }
})(); });

// ── 歌库（v0.6.0，2026-10-08 Claude Fable 5.1）：store（接缝 src/app-store.ts）+ 歌库屏（src/gallery-host.ts）+ WeebPaint 的 editor-session 节律 ───────────
//   家有三种（互斥）：歌库里的一首（doc.identifier；自动存 + 推云）/ 本地文件（doc.handle；v0.3.0 无地）/ 还没家。
//   歌库是懒的：没进过歌库的设备 = 无地（不开 IDB、不载 MSAL）；点「歌库」= attach（在手势里顺便 requestStoragePersistence）；进过一次以后开局就建。
//   节律（2026-10-08 晚起 = WeebPaint 的 consent 制，user「用weebpaint方案，对付大歌，这不是txt」；常量在 src/config.ts）：改了 2 s 自动落本地（「•」= 还没落）；推云只在换歌 / 退出 / 进歌库 / 按「存」/ 登录后 pushAll；
//   「存」= 立刻落盘 + 推（不脏也动）。冲突 / 报错 / busy 在建 store 时就接好线（src/store-ui.ts；test/store-wiring.test.mjs 守着）。
const KV_LAST_DOC = "last-doc";
let gallery: GalleryHost | null = null;
let pendingOpenId: string | null = null;   // es.open(id) 进行中的那个身份（adapter.adopt 收字节时要知道是谁的）
let encodedSnap: SavedMark | null = null;   // encode 那一刻的快照：落盘成功才把它记成「已存」（快照之后的改动继续算脏）
let coverTouched = false;   // 这次打开里换过封面 → 落盘后让歌库丢掉旧缩略图
const es = createEditorSession({
  // store 0.16.1：zip 种类走 store.zip（有 getPeek）；isZip 由种类表说了算。save 的结果进黑匣子：推没推上、为什么（离线 / 冲突面选了什么）——诊断日志里能看到每一次推。
  store: { file: (name, o) => { const f = requireStore().zip(name, { mode: o.mode }); return { open: () => f.open(), tryMove: (to) => f.tryMove(to), delete: () => f.delete(),
    save: async (bytes, opts) => { const r = await f.save(bytes, opts); if (opts?.tryPush) diagNote("sync", `push ${name}: ${r.pushed ? "pushed" : "not pushed"}${r.reason ? " " + r.reason : ""}${r.resolution ? " → " + r.resolution : ""}`); return r; } }; } },
  editor: {
    adopt: async (blob) => { const id = pendingOpenId ?? doc.identifier; if (!id) throw new Error("adopt without an identifier"); adoptStoreBytes(id, new Uint8Array(await blob.arrayBuffer())); },
    onChange: () => { /* 内容变化走 changed()（update() + 1 s 心跳）→ es.markDirty() */ },
    encode: async () => { await refHost.settled(); encodedSnap = D.savedMark(); return { bytes: new Blob([bytesNow() as unknown as BlobPart], { type: "application/vnd.recordare.musicxml" }) }; },
    // 第 ④ 层护栏（store 接缝）：定稿着、出声内容的指纹却变了 = 不落盘、不推，脏留着（顶栏「•」照亮 = 诚实），说一句。前面三层都没拦住才会走到这儿。
    canPersist: () => { const f = D.extras.final; if (!f) return null; try { return contentFingerprintOf(saveArgs()) === f.fingerprint ? null : "这首歌定稿了，内容却变了：没有存、也不会推上云。先「改稿」（定稿的 mp3 作废）再存，或者撤销刚才的改动。"; } catch (e) { return `存不了：${(e as Error).message}`; } },
    onRefused: (why) => { showError(why); diagNote("doc", `persist refused: ${why}`); },
    onSaved: (name) => { if (encodedSnap) { D.adoptSaved(encodedSnap); encodedSnap = null; } if (coverTouched) { coverTouched = false; gallery?.invalidateThumb(name); } renderTitle(); },
  },
  isZip: true,
  policy: { autosaveMs: LOCAL_SAVE_DEBOUNCE_MS, pushOn: ["exit"] },   // consent 制（同 WeebPaint）：推云只在换歌 / 退出 / 按「存」/ 进歌库；失焦只落本机
});
/** 内容变了（谱 / 休息室 / 麦克风 / 封面）→ 歌库里的歌告诉 editor-session（autosave 节律）。幂等；1 s 心跳兜底没经过 update() 的改动（休息室 / 录音室直接改 D.extras 的那些）。 */
function changed(): void { if (doc.identifier && dirty()) es.markDirty(); else if (doc.pendingHome && dirty()) void homeNow(); }
/** 等着安家的空谱已经有了第一笔 → 先安家再做别的（切歌 / 存 / 新建之前；不然那几笔会当无地稿被问「丢掉？」）。 */
const homeIfEdited = (): Promise<void> => (doc.pendingHome && dirty() ? homeNow() : Promise.resolve());
let homing: Promise<void> | null = null;
/** 首笔安家：铸身份（文件名 = 歌名或默认名，撞名加 -hex4）→ es 接管（首存 mode:"new"）→ 立刻落本地（歌库里马上看得见）。单飞；途中换了歌就作罢。 */
function homeNow(): Promise<void> {
  if (homing) return homing;
  const home = doc.pendingHome; if (!home) return Promise.resolve();
  homing = (async () => {
    const store = requireStore(), base = docName();
    let id = identifiers.join({ folder: home.folder, stem: base, suffix: SONG_SUFFIX });
    for (let n = 0; n < 50 && (await store.files.occupied(id)); n++) id = identifiers.join({ folder: home.folder, stem: `${base}-${defaultStem().slice(9)}`, suffix: SONG_SUFFIX });
    if (doc.pendingHome !== home) return;
    doc.identifier = id; doc.handle = null; doc.mtime = null; doc.stem = stemOfId(id); doc.named = true; doc.pendingHome = null; setActiveIdentifier(id);
    es.adopted(id, { create: true });
    try { await es.flushLocal(); deviceKvSet(KV_LAST_DOC, id); diagNote("doc", `home ${id}`); }
    catch (e) { reportError(e); }   // 身份留着，es 还脏：下一轮 autosave 再试
    renderTitle();
  })().finally(() => { homing = null; });
  return homing;
}
es.start();   // autosave 定时器 + 页面隐藏 / pagehide 落盘 + 失焦推云（editor-session 的通用触发点；不调就没有自动存）
setInterval(() => { changed(); if (doc.identifier) renderTitle(); }, 1000);
// （30 s 心跳补推撤了：consent 制，user 2026-10-08「用weebpaint方案」；没上云的在换歌 / 退出 / 按「存」/ 登录后 pushAll 时推）
/** store 字节 → 编辑器（es.open 与 takeCloud 重载共用的装入段）。 */
function adoptStoreBytes(id: string, bytes: Uint8Array): void {
  const o = openBytes(id, bytes);
  loadDoc(o.song, { stem: identifiers.parse(id)?.stem ?? o.stem, named: true, extras: o.extras, handle: null, identifier: id, view: o.view, references: o.references });
  deviceKvSet(KV_LAST_DOC, id);
  if (o.notices.length) showError(o.notices.join(" "));
}
const stemOfId = (id: string) => identifiers.parse(id)?.stem ?? id;
/** 离开现在这首：歌库里的 = 先落盘 + 推（不问，自动存的东西没什么可丢）；无地的 = 改过没存先问。 */
async function leaveCurrent(what: string): Promise<boolean> {
  await homeIfEdited();
  if (doc.identifier) { try { await es.flushAndPush(); } catch (e) { reportError(e, "warning"); } return true; }
  return confirmDiscard(what);
}
/** 打开歌库里的一首。false = 没切过去（本地没字节 / 读不了 / 用户不走）。
 *  登录着且设备上有没推上去的字节 → **先推再开**：上一次推要是「上传落了云、回执没回来」（切后台 / reload 把页面杀了），本地就带着旧 base 和脏标；
 *  库的推路径会拿云端字节和本地字节比对、相同就自愈（lost-response heal），而 open 的新鲜度检查不比字节、直接弹「打开本地 / 云端覆盖本地」——
 *  两边其实一样，白问一次（2026-10-08 user「一直会遇到云端冲突的提示」；test/e2e/sync.mjs ③b 复现）。真分叉 pushAll 不弹面、留脏，照旧由 open 的冲突面问人。 */
async function openStoreDoc(id: string): Promise<boolean> {
  await homeIfEdited();
  if (doc.identifier !== id && !doc.identifier && !(await confirmDiscard(`打开「${stemOfId(id)}」`))) return false;
  if (isSignedIn() && navigator.onLine) { try { if ((await requireStore().files.dirty.count()) > 0) await pushDirtyAll(); } catch (e) { reportError(e, "log"); } }
  pendingOpenId = id;
  try {
    const ok = await es.open(id);   // 切歌前 es 自己先存旧的（退出语义）；open 里含新鲜度检查 / 冲突面 / 崩溃恢复（store 的 ui）
    if (!ok) { showError(`打不开「${stemOfId(id)}」：这台设备上没有它的字节（离线、或还没从云端拉下来）`); return false; }
    diagNote("doc", `open ${id}`);
    return true;
  } catch (e) { reportError(e); return false; }
  finally { pendingOpenId = null; }
}
/** 在歌库里新建一首：一张空谱、**不落盘**（首笔安家，照 WeebPaint lazyblank；user 2026-10-08「首笔安家做」）——第一笔编辑才铸身份进歌库（homeNow；首存 mode:"new" 撞名不覆盖）。
 *  空着离开 = 零损失、歌库里不留空壳；空谱不算「上次开着的歌」（reload 回歌库）。 */
async function newStoreSong(): Promise<void> {
  attachForUser();
  if (!(await leaveCurrent("新建"))) return;
  const folder = gallery?.currentFolder() ?? "";
  es.release();   // 放下旧身份：空谱没有家，autosave 绝不能把它写进上一首
  loadDoc(initState().song, { stem: defaultStem(), named: false, extras: emptyExtras(), handle: null, identifier: null });
  doc.pendingHome = { folder };
  deviceKvSet(KV_LAST_DOC, null);
  renderTitle(); info("新的一首（第一笔写下去就进歌库）");
}
/** 把手里这首无地的歌放进歌库（文件名沿用；撞名加 -hex4，不加序号——user 2026-10-08「3 weebpaint写handoff和我们对齐」）。 */
async function saveIntoGallery(): Promise<void> {
  if (doc.pendingHome) { if (!dirty()) { info("还是空的：写下第一笔就自动进歌库"); return; } await homeNow(); return; }   // 等着安家的空谱：有笔就安家，没笔不塞空壳（WeebPaint「未动过的空白不塞进新库」）
  attachForUser();
  const store = requireStore(), folder = gallery?.currentFolder() ?? "", base = docName();
  let id = identifiers.join({ folder, stem: base, suffix: SONG_SUFFIX });
  for (let n = 0; n < 50 && (await store.files.occupied(id)); n++) id = identifiers.join({ folder, stem: `${base}-${defaultStem().slice(9)}`, suffix: SONG_SUFFIX });   // 撞名加 -hex4，不加序号（WXHW user 2026-09-10「我最讨厌 123 这种的序号焦虑」）
  doc.identifier = id; doc.handle = null; doc.mtime = null; doc.stem = stemOfId(id); doc.named = true; setActiveIdentifier(id);
  es.adopted(id, { create: true });
  try { await es.flushLocal(); deviceKvSet(KV_LAST_DOC, id); renderTitle(); info(`进歌库了：${doc.stem}${SONG_SUFFIX}`); }
  catch (e) { doc.identifier = null; setActiveIdentifier(null); renderTitle(); reportError(e); }
}
/** 改当前这首的文件名：歌库里的走 store（tryMove：撞名不覆盖、旧名进回收站）；无地的只改下次存的名字。返回新身份（歌库 VerbDoc.renameActive 的契约）。 */
async function renameActive(): Promise<string | null> {
  if (!doc.identifier) { renameFile(); return null; }
  const p = identifiers.parse(doc.identifier); if (!p) return null;
  const v = await openInputSheet("改文件名", { defaultValue: p.stem, message: "只改文件名，纸上的歌名不变。", okLabel: "改" });
  if (v == null) return null;
  const stem = fileSafe(v); if (!stem || stem === p.stem) return null;
  const to = identifiers.join({ folder: p.folder, stem, suffix: p.suffix });
  try {
    const r = await es.rename(to);
    if (!r.ok) { showError(`「${stem}」已经有了（${r.where === "cloud" ? "云端" : "这台设备上"}），没改`); return null; }
    doc.identifier = to; doc.stem = stem; setActiveIdentifier(to); deviceKvSet(KV_LAST_DOC, to); renderTitle();
    info(r.oldKept ? `文件名改成 ${stem}${SONG_SUFFIX}（旧名的那份谱系不明，原地留着了）` : `文件名改成 ${stem}${SONG_SUFFIX}`);
    return to;
  } catch (e) { reportError(e); return null; }
}
let authStarted = false, afterSignInInFlight: Promise<void> | null = null;
/** 建 store + 歌库屏（幂等；不碰登录）。第一次要在用户手势里（persist 申请）。 */
function ensureAttached(): void {
  const fresh = !hasStore();
  attachStore();
  if (fresh) {
    void requestStoragePersistence(); diagNote("boot", "store attached");
    // 按身份记的东西跟着改名走（store 0.14.0 onRenamed：谁发起的改名 / 挪夹都报）——这里只有「上次开着哪首」
    requireStore().files.onRenamed((from, to) => { if (deviceKvGet(KV_LAST_DOC) === from) deviceKvSet(KV_LAST_DOC, to); });
  }
  ensureGallery();
}
/** 登录探测（一次）：先建 store（库的报错器在 createStore 时才接上，CatsUp 2026-09-22）、本地恢复完了再调（boot 顺序 = 建 store → 本地恢复 → initAuth）。 */
function startAuth(): void {
  if (authStarted) return;
  authStarted = true;
  auth.onAuthChanged((s) => { diagNote("auth", `changed signedIn=${String(s.signedIn)}`); gallery?.renderCloud(); renderTitle(); if (s.signedIn) void afterSignIn(); });
  void auth.initAuth().then((s) => { diagNote("auth", `initAuth signedIn=${s.signedIn}`); gallery?.renderCloud(); renderTitle(); if (s.signedIn) void afterSignIn(); }).catch((e) => reportError(e, "warning"));
}
/** 用户动作进歌库（点「歌库」/ 新建 / 存进歌库）：建 store + 起登录探测。 */
function attachForUser(): void { ensureAttached(); startAuth(); }
function ensureGallery(): GalleryHost {
  if (gallery) return gallery;
  let padWas = true;
  gallery = initGalleryHost({
    activeIdentifier: () => doc.identifier,
    openAny: (id) => openStoreDoc(id),
    // 打开中的那首被歌库挪了夹：字节已在新身份下 → 先放下旧身份（不然 es.open 的「切歌前先存旧的」会把旧名字写回去复活），再按新身份重开
    setIdentifier: (id) => { es.release(); doc.identifier = null; setActiveIdentifier(null); void openStoreDoc(id); },
    renameActive,
    pushNow: () => es.forceSaveAndPush().then(renderTitle),
    flushLocal: () => (doc.identifier ? es.flushLocal() : Promise.resolve()),
    newSong: async () => { await newStoreSong(); if (doc.identifier || doc.pendingHome) gallery!.close(); },   // 首笔安家：新建出来的空谱还没身份（pendingHome）也回到谱
    openSettings: () => openSettings(),
    openInstruments: () => openFinder(),   // 歌库开着 = 只弹着玩的目录，盖在歌库上面
    openCloudMenu: () => { void openCloudMenu(); },
    onOpened: () => { ui.close(); closeFinder(false); if (ws.mode === "listen") { ws.mode = lastEditMode; applyWorkspace(); } closeInstPage(); padWas = !padEl.hidden; showPad(false); updateChrome(); },   // 进歌库 = 放下手里的歌：混音台（听）也收
    onClosed: () => { void afterGalleryClosed(); showPad(padWas); updateChrome(); scoreEl.focus(); },
  });
  return gallery;
}
/** 从歌库回来：手里这首要是在歌库里被扔进了回收站（gallery 的删除动词允许删「打开中」的那首，先问过），就不再认那个家——留在内存里当无地稿，绝不自动存回去把它复活。 */
async function afterGalleryClosed(): Promise<void> {
  if (!doc.identifier) return;
  try {
    if (await requireStore().files.occupied(doc.identifier)) return;
    const stem = doc.stem; es.release(); doc.identifier = null; setActiveIdentifier(null); deviceKvSet(KV_LAST_DOC, null); renderTitle();
    showError(`「${stem}」已经进了回收站；手里这份现在没有家了（「存」会问存到哪，或「存进歌库」）。`);
  } catch (e) { reportError(e, "log"); }
}
/** 进歌库 = 放下手里的歌（gallery-first，同 WeebPaint「进图库 = 关闭当前画作」；user 2026-10-08「7 和weebpaint对齐」）：
 *  歌库里的先落盘 + 推（退出语义）再放下身份；等着安家的空谱有笔先安家；无地的改过没存先问（同「新建」）。歌库没有「回到谱」——出口 = 打开一首 / 新建。 */
async function openGallery(): Promise<void> {
  attachForUser();
  if (!(await leaveCurrent("进歌库"))) return;
  if (doc.identifier) { es.release(); doc.identifier = null; setActiveIdentifier(null); }
  deviceKvSet(KV_LAST_DOC, null);
  renderTitle();
  await gallery!.open();
}
$("libBtn").addEventListener("click", () => { void openGallery(); });
async function openCloudMenu(): Promise<void> {
  const signed = isSignedIn();
  let who = ""; try { const a = auth.getActiveAccount() as { username?: string; name?: string } | null; who = a?.name || a?.username || ""; } catch { /* 没登录 */ }
  const v = await openChoiceSheet<"in" | "out" | "refresh" | "pushAll">("云端（OneDrive）",
    signed ? `已登录${who ? ` ${who}` : ""}。歌库同步到 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹，看不到你别的文件）。` : "登录微软个人账号后，歌库同步到 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹，看不到你别的文件）。不登录也能用，歌只在这台设备上。",
    signed ? [{ label: "刷新云端", value: "refresh" }, { label: "把没上云的都推上去", value: "pushAll" }, { label: "退出登录", value: "out", danger: true, hint: "歌还留在这台设备上" }] : [{ label: "登录微软账号", value: "in", primary: true }]);
  if (v === "in") await signInFlow();
  else if (v === "out") await signOutFlow();
  else if (v === "refresh") gallery?.refresh();
  else if (v === "pushAll") await pushDirtyAll({ verbose: true });
}
/** 退出登录 = 脏门 + 备份 + 拆库 + 退出（同 WeebPaint disconnectFlow：先绿灯门卸库，后 signOut；user 2026-10-08「4 和weebpaint对齐」）：
 *  还有没上云的 → 问：「先推上去 / 推不上的逐首下载备份」（推完重扫再问，数字会变小）或「照样退出」或算了；
 *  然后放掉 store（这台设备上的歌都还在 IDB 里——再进歌库就接上）、退出微软账号、回到无地的空谱。 */
async function signOutFlow(): Promise<void> {
  const store = requireStore();
  for (;;) {
    let n = 0; try { n = await store.files.dirty.count(); } catch (e) { reportError(e, "warning"); }
    if (n === 0) break;
    const v = await openChoiceSheet<"backup" | "force">(`还有 ${n} 首没上云`, "退出后这些改动只在这台设备上。可以先推上去（推不上去的逐首下载备份），或者照样退出。",
      [{ label: "先推上去 / 下载备份", value: "backup", primary: true }, { label: "照样退出", value: "force", danger: true }]);
    if (v == null) return;
    if (v === "force") break;
    await backupDirty();
  }
  gallery?.close();
  es.release(); doc.identifier = null; setActiveIdentifier(null); doc.pendingHome = null; deviceKvSet(KV_LAST_DOC, null);
  try { await detachStore(); } catch (e) { reportError(e, "warning"); }
  try { await auth.signOut(); } catch (e) { reportError(e); }
  loadDoc(initState().song, { stem: defaultStem(), named: false, extras: emptyExtras(), handle: null, identifier: null });
  renderTitle(); info("退出了：歌都还在这台设备上，再进歌库就能接着用");
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
  info(failed.length ? `推不上去的 ${failed.length} 首已下载备份` : "都推上去了");
}
function downloadFile(file: File): void {
  const a = document.createElement("a"), url = URL.createObjectURL(file);
  a.href = url; a.download = file.name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
/** 登录 = 页面跳去微软再跳回来（redirect；iPad PWA 弹窗不可靠）：先把手里的歌落盘，再在一个点击里**同步**起跳（WeebPaint / WXHW 的两步法；onPick 站在用户手势里）。 */
let navigatingForAuth = false;
async function signInFlow(): Promise<void> {
  if (doc.identifier) { try { await es.flushLocal(); } catch (e) { reportError(e, "warning"); } }
  await openChoiceSheet("去微软登录", `页面会跳到微软的登录页（只认个人账号），登录完自动回到这里。${doc.identifier ? "手里的歌已经存在这台设备上了。" : dirty() ? "手里这首无地的歌改过还没存——跳走会丢，先存一下再来。" : ""}`,
    [{ label: "去登录", value: "go", primary: true, onPick: redirectToSignIn }]);
}
/** 在点击里同步起跳（redirect）；跳走期间不拦 beforeunload。 */
function redirectToSignIn(): void { navigatingForAuth = true; void requestStoragePersistence(); diagNote("auth", "signIn redirect"); auth.signIn({ prompt: "select_account" }).catch((e) => { navigatingForAuth = false; reportError(e); }); }
/** 回前台 / 回线：干净的歌快进到云端的新版本（另一台设备改过的）；本地脏 / 没上云 = 不动（之后 push 的 412 会 surface 真分叉）。 */
let refreshing = false;
async function refreshOpenDoc(): Promise<void> {
  const id = doc.identifier;
  if (!id || refreshing || !hasStore() || !isSignedIn() || !navigator.onLine || dirty() || es.isPushPending()) return;
  refreshing = true; let froze = false;
  try {
    // 库决定替换（onReplaceStart，同步回调）→ 锁同步闸直到新版载入：下载途中打进去的音会被整篇覆盖且不进备份箱（WXHW 2026-09-29 端到端复现；
    //   user 2026-10-08「我们也要拿新版本时锁输入，感觉wxhw更理想一点」）。闸 = 遮罩 + 没有按钮；重载完（或失败）解锁
    const r = await requireStore().zip(id, { mode: "existing" }).pullIfClean({ localDirty: () => dirty() || es.isPushPending(),
      onReplaceStart: () => { froze = true; diagNote("sync", `replace-start ${stemOfId(id)}: input frozen`); void lockSyncGate({ title: "云端有新版本", message: `「${stemOfId(id)}」在别的设备上改过了，正在换成最新的……先别打字。`, showSpinner: true, actions: [] }); } });
    if (r?.status === "fast-forwarded" && doc.identifier === id) {
      // 本地字节已换成云端版本（刚 markSynced）→ 内存里的是旧世界线，必须整体重载（同名 es.open = openInto 管线；不重载 = 下次自动存把旧版写回云端，WeebPaint 2026-08-25 案卷）
      pendingOpenId = id;
      const ok = await es.open(id).finally(() => { pendingOpenId = null; });
      if (ok) info("换成云端的新版本了"); else showError(`「${stemOfId(id)}」云端的新版本拉下来了，但重开失败——请从歌库再打开一次`);
    } else if (r?.status === "ff-failed" || r?.status === "cloud-error") reportError(r.error ?? new Error(`refresh ${r.status}: ${r.reason ?? ""}`), "warning");
  } catch (e) { reportError(e, "warning"); }
  finally { if (froze) unlockSyncGate(); refreshing = false; }
}
/** 登录过期 / 回线：没登录着就静默再试一次（不弹任何东西）。 */
function retrySilent(): void { if (hasStore() && authStarted && !isSignedIn() && auth.isAuthConfigured()) void auth.retrySilentSignIn().catch((e) => reportError(e, "log")); }
/** 登录成功后（boot 时 onAuthChanged 与 initAuth.then 会双触发 → 同一时刻只跑一份）：先推开着的、再回放离线队列、再推所有没上云的、刷新歌库。 */
function afterSignIn(): Promise<void> {
  if (afterSignInInFlight) return afterSignInInFlight;
  afterSignInInFlight = (async () => {
    diagNote("auth", "afterSignIn");
    if (doc.identifier) { try { await es.flushAndPush(); } catch (e) { reportError(e, "warning"); } }
    try { await requireStore().files.drainOfflineQueue(); } catch (e) { reportError(e, "log"); }
    await pushDirtyAll();
    await refreshOpenDoc();
    gallery?.refresh(); gallery?.renderCloud(); renderTitle();
  })().finally(() => { afterSignInInFlight = null; });
  return afterSignInInFlight;
}
let pushAllInFlight: Promise<void> | null = null;
function pushDirtyAll(opts: { verbose?: boolean } = {}): Promise<void> {
  if (pushAllInFlight) return pushAllInFlight;
  pushAllInFlight = (async () => {
    try {
      const r = await requireStore().files.dirty.pushAll();
      if (r.pushed || r.failed.length) diagNote("sync", `dirty.pushAll: pushed=${r.pushed} failed=${r.failed.length}${r.failed.length ? " [" + r.failed.join(", ") + "]" : ""}`);
      if (r.failed.length) showError(`有 ${r.failed.length} 首没推上云：${r.failed.map(stemOfId).join("、")}`);
      else if (opts.verbose) info(r.pushed ? `推上去了 ${r.pushed} 首` : "没有要推的");
    } catch (e) { reportError(e, "warning"); }
  })().finally(() => { pushAllInFlight = null; });
  return pushAllInFlight;
}
/** 选一张图当封面：缩成 ≤ 256²、≤ 70 KB 的 PNG 存进歌（Thumbnails/thumbnail.png，zip 最后一个 entry，歌库尾读）；原图不留。 */
async function setCover(f: File): Promise<void> {
  try {
    const png = await makeCoverPng(new Uint8Array(await f.arrayBuffer()));
    updateExtras(withThumbnail(D.extras, png), { kind: "cover", label: "换封面图" });
    info(`封面图换好了（${sizeText(png.length)}）`);
  } catch (e) { showError(`这张图用不了：${(e as Error).message}`); }
}
/** smart save（歌库里的歌；顶栏钮 / Ctrl+S / 文件菜单「存」同一入口）：脏 → 立刻落盘 + 推；干净且登录着 → 复查云端再 force 推一次（时间戳走字）；
 *  没登录 → 落本地 + 问一次「去登录？」（同一 session 点过「暂不」就不再弹，只提示）。 */
let signInDeclined = false;
async function smartSaveStore(): Promise<void> {
  const b = $("saveBtn"); b.classList.add("flash"); setTimeout(() => b.classList.remove("flash"), 500);
  void requestStoragePersistence();
  const before = syncKind();
  if (before === "clean") { await refreshOpenDoc(); }
  await es.forceSaveAndPush(); renderTitle();
  if (!isSignedIn()) {
    if (signInDeclined || navigator.onLine === false || !auth.isAuthConfigured()) { info("存在这台设备上了"); return; }
    const v = await openChoiceSheet("存在这台设备上了", "要同步到 OneDrive 吗？登录微软个人账号后，歌库同步到你 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹）。",
      [{ label: "去登录", value: "go", primary: true, onPick: redirectToSignIn }, { label: "暂不", value: "later" }]);
    if (v === "later") signInDeclined = true;
    return;
  }
  info(es.isPushPending() ? "存在这台设备上了，云端稍后再推" : before === "clean" ? "云端也是最新的" : "存好了，云端也更新了");
}
async function smartSave(): Promise<void> {
  if (doc.pendingHome) { if (!dirty()) { info("还是空的，没什么可存"); return; } await homeNow(); }   // 空谱诚实回话（WeebPaint blankNothingToSave）；有笔先安家再走歌库的存
  if (doc.identifier) await smartSaveStore(); else await fileSave();
}
$("saveBtn").addEventListener("click", () => { void smartSave(); });
$("undoBtn").addEventListener("click", () => undoNow());
$("redoBtn").addEventListener("click", () => redoNow());
$("lockBtn").addEventListener("click", () => info("这首歌没加密。MoonSinger 这一版还不加密（要的话告诉开发者：照 WXHW 接 zip.js + 7z 就能开）。"));
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
window.addEventListener("online", () => { renderTitle(); if (!hasStore()) return; if (isSignedIn()) void afterSignIn(); else retrySilent(); });
window.addEventListener("offline", () => renderTitle());
document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible" || !hasStore()) return; if (isSignedIn()) void refreshOpenDoc(); else retrySilent(); });

// ── 键盘：映射是一张表（src/keyboard/keys.ts）；这里只算「键盘现在归谁」，再照路由的结果做 ─────────────
/** 谁在最上面归谁：导出面板 > 记号框 > 歌词框 > 谱面（弹 / 改 / 写）。 */
function whereNow(): Where {
  if (ui.overlay || isSheetOpen() || isGateOpen()) return "sheet";
  if (view.marks.open) return "mark";
  if (view.lyrics.open) return "lyric";
  return impro ? "impro" : D.st.sel ? "edit" : "write";
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
    update(setCaret(t.lyric ? setNote(D.st, i, { lyric: null }) : D.st, i));
    return;
  }
}
function run(a: Action, repeat: boolean, code: string): boolean {
  switch (a.k) {
    case "cmd":
      if (ws.mode === "lyrics" && NOTE_EDIT.has(a.cmd.k)) { if (modeHintShown !== ws.mode) { modeHintShown = ws.mode; info(`「${MODE_LABEL[ws.mode]}」里键盘不写音（切到「音」再写）`); } return true; }   // 「符」里电脑键盘照样写音（v0.10.36 音符一起编辑）；只有「词」不写
      if (a.cmd.k === "backspace" && ws.mode === "symbols") { update(apply(D.st, { k: "symBackspace" }, performance.now())); return true; }   // 符：退格删记号（user「我早就想用退格删强度曲线了」）
      if (a.cmd.k === "backspace" && ws.mode === "lyrics") { lyricBackspace(); return true; }
      if (a.cmd.k === "degree") {
        if (!repeat && padHost.monoAccept(`key${code}`)) { const c = { ...a.cmd, mono: !canStack() }, i = writeAndLocate((s) => apply(s, c, performance.now())); keyTok(D.st, i, code); afterWrite(); }   // 先写再取 D.st（写完才有这个音）
        return true;
      }
      update(apply(D.st, withHalf(a.cmd), performance.now()));
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
      if (ws.mode !== "notes") { if (modeHintShown !== ws.mode) { modeHintShown = ws.mode; info(`「${MODE_LABEL[ws.mode]}」里键盘不写音（切到「音」再写）`); } return true; }
      if (!canStack()) { info("这条声部台上是单声的（小月相 / 元音版 / 没人）：叠不了。换成能叠音的乐器再叠"); return true; }
      { const n = stackDegree(D.st, a.degree); if (n === D.st) return true; update(n); previewEdited(); }
      return true;
    case "play": playPause(keyTs); return true;
    case "impro": toggleImpro(); return true;
    case "lyric": return view.lyrics.act(a.a);
    case "mark": view.marks.act(a.a); return true;
    case "sheet": ui.close(); closeSheet(); return true;
    case "file": if (a.a === "open") void fileOpen(); else if (a.a === "save") void fileSave(); else openExportHub(); return true;
    case "clip": void selVerb(a.a); return true;
    case "undo": undoNow(); return true;
    case "redo": redoNow(); return true;
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
  if (finderShown() && gallery?.isOpen()) { if (e.key === "Escape") { e.preventDefault(); closeFinder(); } else finderKey(e); return; }   // 歌库上面的乐器目录（只弹着玩）：Esc 回歌库；音键 = 弹
  if (gallery?.isOpen()) return;   // 歌库开着：键盘归它。没有「回到谱」（gallery-first）：出口 = 打开一首 / 新建
  // 存 / 导出 / 打开（Ctrl / ⌘+S、+Shift+S、+O）挂在最外层：不管哪一页开着、焦点在谁身上（录音室 / 乐器页 / 乐器目录 / 参考窗）都是这首歌的事，
  //   不能落到浏览器的「保存网页」（2026-10-10 user「很多地方save没有拦截」）。各页只决定别的键。
  if ((e.ctrlKey || e.metaKey) && !e.altKey && /^[so]$/i.test(e.key)) { const a = route(e, whereNow(), "write"); if (a && a.k === "file") { e.preventDefault(); run(a, e.repeat, e.code); return; } }
  if (finder.isOpen) { if (e.key === "Escape") { e.preventDefault(); closeFinder(); } else finderKey(e); return; }   // 找人视图开着：Esc + 音键只弹不写（pad 的触屏键照常）
  if (instShown()) {   // 乐器页：只认 Esc（回谱）和撤销 / 重做；输入框里的照常打字
    const inField = (e.target as HTMLElement | null)?.closest("input, select, textarea");
    if (e.key === "Escape") { e.preventDefault(); closeInstPage(); }
    else if (!inField && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redoNow(); else undoNow(); }
    else if (!inField && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redoNow(); }
    return;
  }
  if ((e.target as HTMLElement | null)?.closest?.("wp-reference-window")) return;   // 参考窗拿着焦点：键盘归它（Ctrl / ⌘+V 进窗；Esc 它自己交回谱）
  if (studio.isOpen && e.key === "Escape" && !D.st.sel && !view.lyrics.open && !view.marks.open && !ui.overlay) { e.preventDefault(); setMode(lastEditMode); return; }   // 混音台 = 听：Esc = 回到写   // 谱上没别的可退 = Esc 收起录音室
  if (studio.isOpen && (e.target as HTMLElement | null)?.closest?.(".studio")) { if (e.key === "Escape") { e.preventDefault(); setMode(lastEditMode); } else if (e.key === " " && !typingIn(e.target)) { e.preventDefault(); playPause(e.timeStamp); } return; }   // 混音台在底座里：焦点在它里面才归它，谱照样能写；Esc 回谱、空格播放——焦点在推子 / 下拉 / 按钮上也是（v0.10.10 修：原来焦点在任何 input（推子也是）上都放过 = user「混音台的空格没有捕捉」），只有打字的框（混音轨的名字）不抢
  if (listenOn()) {   // 听模式：只认 空格（放 / 暂停）、Esc（回到写）和 Ctrl / ⌘+S（存）；别的键不写谱
    if (e.key === " ") { e.preventDefault(); playPause(e.timeStamp); }
    else if (e.key === "Escape") { e.preventDefault(); setListen(false); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { const a = route(e, whereNow(), "write"); if (a && run(a, e.repeat, e.code)) e.preventDefault(); }
    return;
  }
  // 别的表单控件（顶栏的下拉框）拿着焦点：不接，它们自己吃方向键 / 空格。歌词框、记号框的输入框照常路由。
  const t = e.target as HTMLElement | null;
  const ownField = !!t?.closest?.(".lyric-input, .mark-ed");
  if (!(e.ctrlKey || e.metaKey) && t && (t.tagName === "SELECT" || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !ownField))) return;
  // 打字的框（歌名 / 曲段名 / 编排那一行、面板里的框）拿着焦点：Ctrl / ⌘ 组合（贴 / 全选 / 撤销 / 复制剪切）归浏览器，不落到谱上（W-36；user 2026-10-13「复制进文本框的时候ctrl v误拦截了」）。存 / 另存 / 打开上面已经接住了
  if ((e.ctrlKey || e.metaKey) && !ownField && typingIn(t)) return;
  const a = route(e, whereNow(), D.st.sel ? "edit" : "write");
  if (a && run(a, e.repeat, e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { padHost.release(`key${e.code}`); if (ghostHeld.delete(`key${e.code}`)) ghostSync(); if (isSoundKey(e)) { sound.up(`key${e.code}`); pad.showUp(`key${e.code}`); } });   // 复音：只停这个键的
// 切走 app / 失焦：抬手的事件可能收不到，全部停掉（同 WeebPaint 的 pointer 自愈）
window.addEventListener("blur", () => { padHost.reset(); sound.allOff(); pad.clearHeld(); if (ghostHeld.size) { ghostHeld.clear(); ghostSync(); } });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { padHost.reset(); sound.allOff(); pad.clearHeld(); if (ghostHeld.size) { ghostHeld.clear(); ghostSync(); } } });
// 切后台回来：声音被系统收起来了（iPad = interrupted）就叫醒；记一笔延迟（回来后系统可能换了缓冲大小——播放头按扬声器的时钟走，会自己跟上）
document.addEventListener("visibilitychange", () => {
  if (studio.isOpen) { engine.meter(document.visibilityState === "visible"); syncSpectrum(); }   // 看不见就不统计（user「记得我说的省cpu，只有看见的时候才进行统计和绘制」）
  if (document.visibilityState !== "visible") return;
  const c = singer.unlock(); resetLatencyLog();
  const ts = typeof c.getOutputTimestamp === "function" ? c.getOutputTimestamp() : null;   // 原始的一对时钟也记下来：错位再报时能看出是哪个时钟跳了
  diagNote("audio", `visible again: ctx ${c.state}, playing ${engine.playing}, currentTime ${c.currentTime.toFixed(3)}, ts ${ts ? `${ts.contextTime?.toFixed(3)} @ ${ts.performanceTime?.toFixed(0)}` : "none"}, now ${performance.now().toFixed(0)}`);
});

await document.fonts.load(`40px Bravura`).catch(() => undefined);
view.render();
pad.render();
renderTitle();
chromeReady = true; applyWorkspace();   // 模式 / 底座的初始状态（音、键盘在）落到界面上
scoreEl.focus();
// 歌库 boot：进过歌库的设备（或带着 OAuth 回跳）开局就建 store（先建再 initAuth），回到上次的地方——上次在歌库里就开歌库，上次开着哪首就开哪首，开不了就进歌库。没进过的 = 无地，照旧。
if (storeWasAttached() || /[#&](code|error|state)=/.test(location.hash)) {
  ensureAttached();
  const last = deviceKvGet(KV_LAST_DOC);
  if (gallery!.wasInGallery() || !last) await gallery!.open();
  else if (!(await openStoreDoc(last))) await gallery!.open();
  startAuth();   // 本地恢复完了再 initAuth（CatsUp 2026-09-22 顺序：建 store → 本地恢复 → 登录探测）
}
// 试听元音表（约 3 MB）在画好之后的空闲时下载：选了月读就是意图，第一下就该响（user「选这个乐器就是意图，然后第一下就响」）
setTimeout(() => { void ensureVowels().catch((e) => showError(`试听元音表没下载下来：${(e as Error).message}`)); void engine.ensure().catch(() => undefined); }, 300);
setTimeout(() => schedulePrewarm(), 1200);   // 启动时打开的那首歌（歌库 / 上次的）也预热   // 录音房的 worklet 模块也顺手装好（几十 KB），第一下按键就响
