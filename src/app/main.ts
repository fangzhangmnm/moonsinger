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
import { type EditorState, type InputState, type Acc, type Hum, type MarkVal, type Song, type PartDef, type Token, type TempoMap, initState, writePitch, soundingPitch, writeMark, setHum, setPaper, setCredits, tapAcc, setAccState, setTuplet, setInputKey, setInputScale, setUnit, setNote, effectivePitch, timeline, keyAt, timeAt, tempoAt, TPQ, tr, setFocus, addPart, removePart, addPaper, removePaper, movePaper, addTrack, removeTrack, flattenPart, tempoMapOf, setDensity, setPartClef, setPartStaves, type Clef } from "../score/song.ts";
import { type Pitch, midiOf, alterBy } from "../score/pitch.ts";
import { apply } from "../score/commands.ts";
import { type Action, type Where, route, isSoundKey } from "../input/keys.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { ScoreView } from "../ui/score-view.ts";
import type { PartView } from "../render/engrave.ts";
import { installPlatformGuards } from "../ui/platform-guards.ts";
import { Pad } from "../ui/pad.ts";
import { toLabScore, type SingLang } from "../score/lab-score.ts";
import { Singer, type SingResult } from "../singer/client.ts";
import { encodeMp3 } from "../export/mp3.ts";
import { createPackStore } from "@internal/model-packs";
import { showNotice, configureFloors } from "@internal/workbench-elements";
import { PACKS, CREDIT } from "../singer/packs.gen.ts";
import { SOUNDS, SOUNDS_SOURCE_DEFAULT, type SoundEntry } from "../gm/sounds.gen.ts";
import { Sampler } from "../singer/sampler.ts";
import { saveMxl, openBytes, emptyExtras, roleName, roleSound, partLabels, withRoleName, withRoleConcept, activeCandidateName, activeId, activeGm, activeInstrument, candidates, gmCandidates, withActive, withSf2Candidate, withoutCandidate, newRoleId, newMicId, withNewRole, withoutRole, withMic, withThumbnail, CANDIDATE_ID, type Extras, type Engine, type GmCandidate } from "../format/project.ts";
import { cachedSound, rememberSound, listCachedSounds, forgetSound, releaseSoundMemory, soundMemoryBytes, siteStorageEstimate } from "../gm/sound-cache.ts";
import { GmSynth } from "../gm/synth.ts";
import { Finder, type FinderPick } from "../ui/finder.ts";
import { Studio } from "../ui/studio.ts";
import { roleNameOf, roleSoundOf, loadCatalog } from "../gm/catalog.ts";
import { ICON_CREDITS } from "../gm/instruments.gen.ts";
import { subsetSf2, listSf2Presets, sf2Info, type Sf2PresetInfo } from "../gm/sf2-subset.ts";
import { ROLE_GROUPS, ROLE_PRESETS, DEFAULT_ROLE } from "../score/roles.ts";
import { type PaperKind, type Density, PAPER_KINDS, PAPER_NOTE, PAPER_LABEL, DENSITIES, densityOf, DEFAULT_PAPER, paperOf, paperSizeText } from "../score/paper.ts";
import * as docFile from "./doc-file.ts";
import { unzipSync } from "../../vendor/fflate/fflate.esm.js";
import { defaultStem, fileSafe, stampedCopy } from "./names.ts";
// ── 歌库（v0.6.0，2026-10-08 Claude Fable 5.1）：@internal/store（接缝 src/app-store.ts）+ @internal/gallery（src/gallery-host.ts）+ WeebPaint 的 editor-session 节律 ──
import { attachStore, hasStore, requireStore, storeWasAttached, auth, setActiveIdentifier, requestStoragePersistence } from "../app-store.ts";
import { identifiers } from "../identifiers.ts";
import { SONG_SUFFIX, LOCAL_SAVE_DEBOUNCE_MS, PUSH_DEBOUNCE_MS, PUSH_HEARTBEAT_MS } from "../config.ts";
import { initGalleryHost, type GalleryHost } from "../gallery-host.ts";
import { createEditorSession } from "../editor-session/index.ts";
import { openInputSheet, openChoiceSheet, isSheetOpen, closeSheet, isGateOpen } from "../ui/sheets.ts";
import { reportError, diagNote, diagText, diagClear } from "./report-error.ts";
import { deviceKvGet, deviceKvSet } from "../device-kv.ts";
import { makeCoverPng, coverWithBlurb } from "../image/cover.ts";

let st: EditorState = initState();
/** 这首歌的家（无地逃生口）：文件名主干（新建 = 默认名；打开 = 那个文件的名字）、打开的那个文件（桌面 Chromium）+ 打开 / 上次写回时它的 mtime（写前对表）、
 *  文件里这一版不改动的部分、上次存 / 打开时的样子（判断改过没存）。歌名在谱里（st.song.title，可不填），和文件名分开。 */
const doc = { stem: defaultStem(), named: false, handle: null as docFile.FileHandle | null, mtime: null as number | null, extras: emptyExtras() as Extras,
  /** 歌库里的家（v0.6.0）：store 身份（`夹/主干.mxl`）；null = 无地（本地文件句柄 / 还没家）。三种家互斥：identifier 优先于 handle。 */
  identifier: null as string | null,
  saved: { song: st.song as Song, lounge: "" } };
/** 歌以外、和「改过没存」有关的部分：各角色的名字、谁上场、候选有哪些（候选增删也算改过）+ 录音房的麦克风（增益 / 声像）。 */
let coverRev = 0;   // 封面图换过几次（封面不在 lounge 里，但也算「改过没存」）
const loungeKey = () => JSON.stringify([coverRev, Object.entries(doc.extras.lounge).map(([id, r]) => [id, r.name, r.active, ((r.candidates as { id: string }[] | undefined) ?? []).map((c) => c.id)]).sort(), (doc.extras.studio?.mics as unknown[] | undefined) ?? []]);
doc.saved.lounge = loungeKey();
/** 光标所在的声部 / 它的角色 id（歌手牌、找人、试听都对着它）。 */
const curPart = (): PartDef => st.song.parts.find((p) => p.id === st.at.part) ?? st.song.parts[0];
const curRole = (): string => curPart().role;
/** 声部的显示 / 出声状态：隐藏（不画）、静音、独奏——这次打开里有效，不进文件（user 2026-10-08「不同的声部视图和出声应该分别可以solo和hide」）。 */
//   两根轴同一套语法（user 2026-10-08「display有hide 和show only， play有mute和solo。这两个的逻辑关系你理一个好的」）：每根轴 = 一个「关掉」旗（隐藏 / 静音）+ 一个「只要这些」集合（只看它 / 独奏）；
//   有「只要」时旗子不看，关掉「只要」就回到旗子；两根轴互不影响（隐藏的声部照样出声）。隐藏不是消失：谱上缩成一条细行。
type PartViewState = { hidden: boolean; only: boolean; muted: boolean; solo: boolean };
const partView = new Map<string, PartViewState>();
const pv = (id: string): PartViewState => partView.get(id) ?? { hidden: false, only: false, muted: false, solo: false };
const setPv = (id: string, patch: Partial<PartViewState>) => partView.set(id, { ...pv(id), ...patch });
/** 显示：有「只看它」的只显示那些，否则显示没隐藏的。 */
const isShown = (id: string): boolean => { const only = st.song.parts.some((p) => pv(p.id).only); return only ? pv(id).only : !pv(id).hidden; };
/** 显示 / 存档用的名字：填了歌名用歌名，没填用文件名主干。 */
/** 文件名（user「用歌名可以，然后也要yyyymmdd规则。之后各管各的同意」）：没存过 = 年月日-歌名（没歌名 = 年月日-四位随机 = doc.stem）；
 *  存过 / 打开的 / 改过名的 = 定下来（named），和纸上的歌名各管各的；改文件名在文件菜单。 */
const docName = () => { const t = fileSafe(st.song.title ?? ""); return doc.named || !t ? doc.stem : `${doc.stem.slice(0, 8)}-${t}`; };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const bar = $("bar"), scoreEl = $("score"), padEl = $("padPanel");
installPlatformGuards([scoreEl, padEl]);   // iPad：长按放大镜 / 系统菜单 / 双击缩放（照 WeebPaint）

// ── PWA 壳（2026-10-07 出生）：service worker + 四路更新检测；有新版不强刷，顶上出一条「有新版本 · 刷新」（不用系统弹窗） ─────
const shell = initPwaShell({ onUpdateAvailable: () => showUpdateBar() });
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


// 顶栏只有一行（user 2026-10-07「顶栏应该只有一行」「顶栏同意」「浮动走带条 感觉要不放在顶端居中？」）：
//   左 = 文件钮 + 文件名（点 = 文件菜单）；中 = 走带条（唱 / 停、弹、唱的进度）；右 = 键盘开关 + 扳手。
//   音质 / 哼的字 → 谱前面的歌手牌；导出歌声 → 文件菜单；版本号 → 设置；状态细字不要了（user「状态细字可以精简，或者不要也行」）。
bar.innerHTML =
  `<div class="tb-left"><button id="fileBtn" class="btn tb-file" title="文件：新建 / 打开 / 存 / 导出（Ctrl / ⌘+S 存、+O 打开；.mxl 拖进来也能打开）"><svg class="ico"><use href="#file"/></svg><span id="docTitle" class="title">未命名</span><span id="cloudSt" class="cloud-st"></span></button>` +
  `<button id="libBtn" class="btn tb-lib" title="歌库：这台设备上的歌，登录微软账号后同步到 OneDrive（应用文件夹）">歌库</button></div>` +
  `<div class="tb-mid"><button id="playBtn" class="btn" title="月读唱 / 停（空格）"><svg class="ico"><use href="#play"/></svg></button>` +
  `<button id="improBtn" class="btn" title="弹：音符只唱不写（\`）">弹</button><button id="studioBtn" class="btn" title="录音室：每个声部的增益 / 声像 / 静音 / 独奏"><svg class="ico"><use href="#sliders"/></svg></button><span id="singStatus" class="sing-st"></span></div>` +
  `<div class="tb-right"><button id="padBtn" class="btn is-on" title="键盘（pad）"><svg class="ico"><use href="#grid"/></svg></button>` +
  `<button id="setBtn" class="btn" title="设置：模型来源、导入模型包、月读的署名与使用条款、版本"><svg class="ico"><use href="#menu"/></svg></button></div>`;   // 三条杠 = 菜单（同 CatsUp 顶栏；扳手留给「配置这一样东西」，如纸右上角）
configureFloors({ toolbarBottom: () => bar.getBoundingClientRect().bottom });

// ── 试听：月读的元音采样器（出一个音就响；只唱「哼」那一个字，不看歌词——user「还是单一元音更适合当blueprint」） ─────
const sampler = new Sampler();
// 实时合成器（AudioWorklet 里的 TinySoundFont，src/gm/synth.ts）：SoundFont 候选的试听走它——按下 note-on、松开 note-off，长音乐器按着就一直响，
//   松开由乐器自己的包络收尾（user「钢琴按了之后一会声音就没了」「preview的时候那些可以长时间的乐器 包络是不是没做」「做，这个以后我们要做实时播放的」）。
const synth = new GmSynth(() => singer.unlock(), new URL(`./${__SYNTH_WORKLET__}`, import.meta.url), new URL("../vendor/tsf/tsf-standalone.wasm", import.meta.url));
const sound = {
  down: (p: Pitch, id = "main") => {
    if (finder.isOpen) { if (audition) gmDown(midiOf(p), id); else sampler.down(midiOf(p), st.song.hum, id); return; }   // 试听台：GS 走合成器、月读走元音采样
    if (engineNow() === "soundfont") { gmDown(midiOf(p), id); return; }
    sampler.down(midiOf(p), st.song.hum, id);
  },
  up: (id = "main") => { if (gmHeld.has(id)) gmUp(id); else sampler.up(id); },
};
/** 唱下标 i 的音；id = 声音的来源（哪根手指 / 哪个键 / 谱面），复音：不同来源同时响，同一来源新的顶掉旧的。 */
const soundTok = (s: EditorState, i: number, id = "main") => { const t = tr(s)[i]; if (t?.kind === "note" && t.pitch) sound.down(t.pitch, id); };
/** 电脑键盘按下一个音：响 + pad 上那个音高的键亮着（和手指按 pad 一样，松开键才灭）。 */
const keyTok = (s: EditorState, i: number, code: string) => { const t = tr(s)[i]; soundTok(s, i, `key${code}`); if (t?.kind === "note" && t.pitch) pad.showDown(t.pitch, `key${code}`); };
/** 写一个音（写 = 光标前那个新音；改 = 被覆盖的那个音 = 旧选中里的第一个音），返回刚写的下标（试听用）。 */
function writeAndLocate(write: (s: EditorState) => EditorState): number {
  let target = -1;
  if (st.sel) for (let k = st.sel.from; k < st.sel.to; k++) if (tr(st)[k].kind === "note") { target = k; break; }
  update(write(st));
  return target >= 0 ? target : st.caret - 1;
}

let upTimer = 0;   // 点一下响 350 ms 的那个停；新的一下先取消旧的（不然会掐掉新音）
const view = new ScoreView(scoreEl, {
  get: () => st,
  set: (n) => update(n),
  audition: (i, hold) => { clearTimeout(upTimer); soundTok(st, i, "score"); if (!hold) upTimer = window.setTimeout(() => sound.up("score"), 350); },
  glide: (i) => { clearTimeout(upTimer); const t = tr(st)[i]; if (t?.kind === "note" && t.pitch) sampler.glide(midiOf(t.pitch), st.song.hum, "score"); },
  release: () => { clearTimeout(upTimer); sound.up("score"); },
  focus: (where) => showPad(where === "staff"),   // 纸宽固定以后，横屏收起旁边的 pad 也不会让谱重排（user「固定行宽之后横屏的键盘也可以开关了吧」）
  autoBars: () => autoBars,
  parts: () => partViews(),   // 谱前写角色名（乐器的名字不上谱；同名同种带号）；隐藏的不画
  onPart: () => openPartSheet(),
  onPaperMenu: (id) => openPaperMenu(id),
  onAddPaper: () => { update(addPaper(st)); info("新的一张纸"); },
  onNav: (dir) => navPaper(dir),
  onPaper: () => openPaperSheet(),
  onCredits: () => openCreditsSheet(),
  reflow: () => reflow,
  pages: () => pageFlow,
});
let impro = false;
/** 按拍号自动画小节线（默认开；这次打开里有效）。user「自动加小节也是可以toggle的，默认开」 */
let autoBars = true;
/** /2 = 和 Shift 一个逻辑（user「或者/2是类似shift，因为accessibility的issue可能按住不方便，而是和键盘shift的逻辑一样」）：
 *  点一下 = 凑满一份原来的时值再回去（= 两个减半的音 / 休止 / 拉长；user 点头 AI 的答：只管一个会留半拍窟窿，节奏是成对凑整拍的）；
 *  中途挪了光标或拨了长短旋钮 = 取消；350 ms 内连点两下 = 锁住（再点一下解开）；按住写 = 按住期间写的都减半、松手回去。
 *  减半 = 临时把长短基线往短挪一档（旋钮上看得见）；已经最短（三十二分）就不挪；回去 = 挪回一档（中间拨过旋钮 = 照拨过的再挪回一档）。 */
let half: "off" | "once" | "lock" = "off", halfShifted = false, halfAt = 0, halfHeld = false, halfWrote = false, halfLeft = 0;
function setHalf(m: "off" | "once" | "lock"): void {
  if (half === "off" && m !== "off") { halfShifted = st.input.unit > 0; if (halfShifted) update(setUnit(st, st.input.unit - 1)); }
  else if (half !== "off" && m === "off" && halfShifted) { halfShifted = false; update(setUnit(st, st.input.unit + 1)); }
  half = m; pad.showHalf(m);
  halfLeft = m === "once" ? 2 : 0;   // 两个减半的 = 一份原来的
}
function halfKey(down: boolean): void {
  if (down) {
    const t = performance.now();
    halfHeld = true; halfWrote = false;
    setHalf(half === "off" ? "once" : half === "once" && t - halfAt < 350 ? "lock" : "off");
    halfAt = t;
  } else {
    halfHeld = false;
    if (halfWrote && half !== "lock") setHalf("off");   // 按住写过 = 松手回去（同 iOS 按住 Shift 打字）
  }
}
/** 升降键（pad）：和 Shift 一个逻辑（点一下 = 下一个、350 ms 内连点两下 = 锁、再点 = 关；按住写 = 按住期间、松手回去），
 *  按着上下滑 = 换一种（𝄪 / ♯ / ♭ / 𝄫；user「按是当作shift，滑动是toggle which shift」）。有选中 = 选中的音直接升降（同电脑键盘的 [ ]）。 */
let accPrior: Pick<InputState, "acc" | "accMode" | "accAt"> | null = null, accWrote = false, accSlid = false;
function accKey(phase: "down" | "slide" | "up", acc: Exclude<Acc, 0>): void {
  if (phase === "down") {
    if (st.sel) { update(tapAcc(st, acc, performance.now())); accPrior = null; return; }
    accPrior = { acc: st.input.acc, accMode: st.input.accMode, accAt: st.input.accAt }; accWrote = false; accSlid = false;
    update(setAccState(st, acc, "lock"));   // 按着的时候一直生效（写几个都算）
  } else if (phase === "slide") {
    if (!accPrior) return;
    accSlid = true; update(setAccState(st, acc, "lock"));
  } else {
    const prior = accPrior; accPrior = null;
    if (!prior) return;
    const back = { ...st, input: { ...st.input, ...prior } };
    if (accWrote) update(setAccState(back, 0, "off"));                                  // 按住写过 = 松手回去
    else if (accSlid) update(prior.accMode === "off" ? back : setAccState(back, acc, prior.accMode));   // 只是滑着换了一种
    else update(tapAcc(back, acc, performance.now()));                                   // 点了一下 = Shift
  }
}
/** 写了一个音 / 休止 / 拉长：「只管下一个」的 /2 用掉了（按住的时候不算，松手再回去）；升降键按着的时候记一笔。 */
function afterWrite(): void { if (accPrior) accWrote = true; if (halfHeld) { halfWrote = true; return; } if (half === "once" && --halfLeft <= 0) setHalf("off"); }
/** 屏幕放不下纸的时候折不折行（默认不折行 = 整张纸按比例缩小；这次打开里有效，不进文件——怎么看，不是谱的内容）。 */
let reflow = false;   // 「弹」（顶栏开关；2026-10-07 user「弹应该放在顶栏」）：音符只唱不写
/** 排法（这次打开里有效；user 2026-10-08「显示法还加一个分页？可以预览打印，要求和之后生成的pdf wysiwyg」）：false = 连续（一张长纸）；true = 分页（按纸高分页、画页框，和以后导出的 PDF 所见即所得）。横卷以后。 */
let pageFlow = false;
/** pad 上每根按着的手指：刚写的是第几个音（弹 = -1）、它原本的音高——上下滑过门槛时在它上面升 / 降。 */
const padNotes = new Map<string, { index: number; base: Pitch }>();
/** 单音乐器（现在的主唱月读）写音：同时多按只写第一个（user「monophonic乐器输入的时候如果你多按只会输第一个。但是做好模糊护栏免得快速输入的时候第二个音被吃掉」）。
 *  模糊护栏：只有「上一个写进去的音还按着，而且才过了不到 CHORD_MS」才算同时按、不写不响不亮；
 *  快速连按（前一根手指还没抬，但已经隔开了）照写，抬过手的更不管。手指和电脑键盘共用一份；弹（只唱不写）不管，几个音一起响。 */
const CHORD_MS = 50;
const monoHeld = new Set<string>();
let monoAt = -Infinity;
function monoAccept(id: string): boolean {
  const now = performance.now();
  if (monoHeld.size && now - monoAt < CHORD_MS) return false;
  monoHeld.add(id); monoAt = now; return true;
}
const pad = new Pad(padEl, {
  state: () => st,
  isImpro: () => impro || finder.isOpen,   // 找人视图开着：pad 只弹不写（弹的是试听台上那位）
  accept: (id) => monoAccept(id),
  // 找人视图开着（试听台）：只许音键出声，任何会碰谱的回调一律不接（user「试听的时候写入的东西不会不小心输入到乐谱吧…包括其他的键，是不是应该disable」）
  onPitch: (p, id) => {
    if (finder.isOpen) return;
    const i = writeAndLocate((s) => writePitch(s, p)), t = tr(st)[i];
    padNotes.set(id, { index: i, base: t?.kind === "note" && t.pitch ? t.pitch : p });
    afterWrite();
  },
  onAlter: (id, alt) => {
    if (finder.isOpen) return;   // 临时离调：只管这一个音（滑回中间 = 还原）；重新唱一下让人听见
    const n = padNotes.get(id); if (!n) return;
    const np = alt ? alterBy(n.base, alt) : n.base;
    if (n.index >= 0) update(setNote(st, n.index, { pitch: np }));
    sound.down(np, id);
  },
  onCommand: (c) => {
    if (finder.isOpen) return;
    if (c.k === "caret" && half === "once") setHalf("off");   // 挪光标 = 取消「凑满一份」
    update(apply(st, c, performance.now())); if (c.k === "rest" || c.k === "extend") afterWrite();
  },
  onUnit: (u) => { if (half === "once") { half = "off"; halfShifted = false; halfLeft = 0; pad.showHalf("off"); } update(setUnit(st, u)); },   // 拨了旋钮 = 照拨的，取消「凑满一份」
  onTuplet: (n) => update(setTuplet(st, n)),
  onInputKey: (f) => update(setInputKey(st, f)),
  onInputScale: (id) => update(setInputScale(st, id)),
  autoBars: () => autoBars,
  staves: () => curPart().staves ?? 1,
  onAutoBars: (on) => { autoBars = on; view.render(); pad.render(); },
  onHide: () => showPad(false),
  onHalf: (down) => { if (finder.isOpen) return; halfKey(down); },
  onAccShift: (phase, acc) => accKey(phase, acc),   // 找人视图里也要能用：升降只改弹出来的音高，不碰谱
  onInsertMark: (kind) => {
    if (finder.isOpen) return;   // 默认值 = 光标处正生效的那个（没改就收起 = 撤掉这次插入）
    const at = st.sel ? st.sel.from : st.caret;
    const v: MarkVal = kind === "key" ? { kind, fifths: keyAt(tr(st), at) } : kind === "time" ? { kind, ...timeAt(tr(st), at) } : { kind, bpm: tempoAt(tr(st), at) };
    const r = writeMark(st, v);
    update(r.st);
    view.marks.openAt(r.index, r.fresh);
  },
  onSoundDown: (p, id) => {
    const n = padNotes.get(id);
    if (n && n.index >= 0) soundTok(st, n.index, id);
    else { const r = soundingPitch(st, p); update(r.st); padNotes.set(id, { index: -1, base: r.pitch }); sound.down(r.pitch, id); }   // 弹：带上挂着的 ♯ / ♭
  },
  onSoundUp: (id) => { padNotes.delete(id); monoHeld.delete(id); sound.up(id); },
});

/** 「弹」开 / 关（顶栏按钮、电脑键盘的 `）。 */
function toggleImpro(): void { impro = !impro; $("improBtn").classList.toggle("is-on", impro); if (impro) showPad(true); pad.render(); }
$("improBtn").addEventListener("click", () => toggleImpro());

function update(next: EditorState): void {
  if (next === st) return;
  const moved = next.at.paper !== st.at.paper || next.at.part !== st.at.part;
  st = next;
  if (moved) { synth.allOff(); gmHeld.clear(); void prepareSynth(); }
  view.render();
  pad.render();
  renderTitle();
  changed();
}

// ── 播放：月读唱（第一次要加载引擎，之后复用） ─────────────────────────
const singer = new Singer();
let singing = false;
/** 唱 / 导出的进度 = 顶栏走带条旁边的小字（停了就清）。 */
const progress = (s: string) => { $("singStatus").textContent = s; };
/** 一次性的消息（存好了、已分享…）= toast，3 秒（家族 @internal/workbench-elements 的 notice；错误另见 showError）。 */
const info = (s: string) => { showNotice({ id: "info", level: "info", text: s, autoHideMs: 3000 }); };
/** 报错：红色 toast，带完整原因，点了才收（家族四级 notice 的 error）。user 2026-10-07「替补不能静默替补，需要显示报错」→ 订正「不是显示自动上，而是就是不出声，报错，人类手动换」：
 *  成员上不了场就不出声、报错，换谁由人来（选角是窄接口；谱子不受影响）。 */
function showError(text: string): void { showNotice({ id: "err", level: "error", text }); }
const playIcon = (stop: boolean) => { $("playBtn").innerHTML = `<svg class="ico"><use href="#${stop ? "stop" : "play"}"/></svg>`; if (!stop) progress(""); };
/** 歌词里有汉字、没有假名 → 按中文唱；其余（含没有歌词）按日语唱。按一个声部（压平后的一串）判。 */
function songLangOf(tokens: Token[]): SingLang {
  const ls = tokens.flatMap((t) => (t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : [])).join("");
  // 英文：歌词里有拉丁字母、没有假名也没有汉字（user「好吧英文先做完」）；中英日混着的歌第一版按日 / 中唱
  if (/[A-Za-z]/.test(ls) && !/[\p{Script=Han}぀-ヿ]/u.test(ls)) return "en";
  // 整首没写歌词时，哼「啦」「呜」用中文唱（日语 ら 是轻弹舌、う 不圆唇；user「呜还是啊，拉也不行」）
  if (!ls && (st.song.hum === "la" || st.song.hum === "u")) return "zh";
  return /\p{Script=Han}/u.test(ls) && !/[぀-ヿ]/.test(ls) ? "zh" : "ja";
}
/** 整首唱时给核心的哼的参数：ん 闭嘴（N_m）、哼的字辅音至少 70 ms（核心默认关，Lab 命令行不受影响）；leadIn 明说（混音对齐要扣掉它）。 */
const LEAD_IN = 0.5;   // 月读核心 OPT.leadIn（sing-core.mjs）：第一个元音前留的秒数
const humOpt = (): Record<string, unknown> => ({ humNasal: "N_m", humConsMin: 0.07, leadIn: LEAD_IN });
/** 轻量版 / SoundFont 的音符表（秒）：tie 并成一个长音。tempoMap = 第一个声部的速度表（别的声部按它算秒数）。 */
function lightNotes(tokens: Token[], tempoMap: TempoMap): { midi: number; t0: number; t1: number }[] {
  const notes: { midi: number; t0: number; t1: number }[] = [];
  for (const { index, tok, t0, t1 } of timeline(tokens, tempoMap)) {   // 秒数按速度记号一段一段算好了
    if (tok.kind !== "note") continue;
    const midi = midiOf(effectivePitch(tokens, index)), last = notes[notes.length - 1];
    if (tok.tie && last && last.midi === midi) { last.t1 = t1; continue; }
    notes.push({ midi, t0, t1 });
  }
  return notes;
}
/** 光标所在声部压平后的一串 + 速度表（试听「听开头」、月读哼用）。 */
const curFlat = () => ({ tokens: flattenPart(st.song, st.at.part).tokens, map: tempoMapOf(st.song) });
/** 一个声部渲染出来的声音：samples 的 0 秒对应谱上的第 at 秒（月读的前面有 leadIn、采样器前面有 0.1 s，混音时扣掉）。 */
interface Rendered { samples: Float32Array; sr: number; at: number }
/** 同一份谱 + 同一个演奏者只算一次（再播 / 导出直接用上次的）；按声部各存一份。 */
const lastRender = new Map<string, { key: string; r: Rendered }>();
const GM_SR = 44100;
/** 一个声部按它上场的演奏者出声（离线渲染）：月读 = worker 里唱；元音版 = 采样器；SoundFont = TinySoundFont。没人上场 / 响不了 = 抛错（不出声、报错、人换）。 */
async function renderPart(part: PartDef): Promise<Rendered | null> {
  const role = part.role, eng = activeInstrument(doc.extras, role)?.engine ?? "unknown";
  if (eng === "unknown") throw new Error(`「${roleName(doc.extras, role)}」还没有人上场`);
  const { tokens } = flattenPart(st.song, part.id), map = tempoMapOf(st.song);
  if (eng === "tsukuyomi") {
    const lang = songLangOf(tokens), score = toLabScore(tokens, st.song.hum, lang, map);
    if (!score.SCORE.length) return null;
    const opt = humOpt(), key = JSON.stringify(["tsukuyomi", score, opt]), had = lastRender.get(part.id);
    if (had?.key === key) return had.r;
    const first = timeline(tokens, map).find((x) => x.tok.kind === "note")?.t0 ?? 0;   // 开头的休止 Lab 格式表达不了（lab-score.ts）：按第一个音的时刻摆
    const r = await singer.sing(score, (stage) => progress(`${roleName(doc.extras, role)}：${stage}…`), { opt, models: modelBases() });
    const out = { samples: r.samples, sr: r.sr, at: first - LEAD_IN };
    lastRender.set(part.id, { key, r: out }); return out;
  }
  const notes = lightNotes(tokens, map);
  if (!notes.length) return null;
  if (eng === "vowel-sampler") {
    const key = JSON.stringify(["vowel", notes, st.song.hum]), had = lastRender.get(part.id);
    if (had?.key === key) return had.r;
    const r = await sampler.renderSong(notes, st.song.hum), out = { ...r, at: -0.1 };   // 采样器前面留了 0.1 s
    lastRender.set(part.id, { key, r: out }); return out;
  }
  const g = activeGm(doc.extras, role);
  if (!g) throw new Error("台上的不是 SoundFont 乐器");
  const gmNotes = notes.map((n) => ({ preset: [g.bank, g.program] as [number, number], key: g.note ?? n.midi, vel: 0.8, t0: n.t0, t1: n.t1 }));   // 鼓件：每个音都敲那个键（只剩节奏）
  const key = JSON.stringify(["gm", g.subsetSha256, gmNotes]), had = lastRender.get(part.id);
  if (had?.key === key) return had.r;
  const bytes = await resolveGmBytes(g);
  const r = await singer.gm(bytes, g.subsetSha256, gmNotes, GM_SR, 2), out = { samples: r.samples, sr: r.sr, at: 0 };
  lastRender.set(part.id, { key, r: out }); return out;
}
/** 出声的声部：有独奏的只出独奏的，否则出没静音的（user「不同的声部视图和出声应该分别可以solo和hide」）。 */
const audibleParts = (): PartDef[] => { const solo = st.song.parts.some((p) => pv(p.id).solo); return st.song.parts.filter((p) => (solo ? pv(p.id).solo : !pv(p.id).muted)); };
/** 录音房里这个声部的麦克风（增益 dB、声像 −1…1）；没有 = 0 / 0。 */
function micOf(part: PartDef): { gainDb: number; pan: number } {
  const m = ((doc.extras.studio?.mics as { id: string; gainDb?: number; pan?: number }[] | undefined) ?? []).find((x) => x.id === part.mic);
  return { gainDb: Number(m?.gainDb ?? 0), pan: Math.max(-1, Math.min(1, Number(m?.pan ?? 0))) };
}
/** 整首 = 各声部各自渲染再混成立体声（线性重采样到 44.1k；麦克风增益 / 等功率声像；超过 0 dB 整体压回来）。
 *  哪个声部响不了 = 那个声部不出声、报错，其余照出（user「不是显示自动上，而是就是不出声，报错，人类手动换」）。 */
async function renderMix(): Promise<{ left: Float32Array; right: Float32Array; sr: number } | null> {
  const parts = audibleParts(), got: { part: PartDef; r: Rendered }[] = [], errs: string[] = [];
  for (const part of parts) {
    try { const r = await renderPart(part); if (r) got.push({ part, r }); }
    catch (e) { errs.push(`「${roleName(doc.extras, part.role)}」：${(e as Error).message}`); }
  }
  if (errs.length) showError(`${errs.join("；")}。${got.length ? "这些声部没有出声，其余照放。" : "没有出声。"}点谱前面的声部名换一个「谁来演」。`);
  if (!got.length) return null;
  const SR = GM_SR, pad = 0.3;
  const start = Math.min(0, ...got.map((x) => x.r.at)), end = Math.max(...got.map((x) => x.r.at + x.r.samples.length / x.r.sr)) + pad;
  const n = Math.ceil((end - start) * SR), left = new Float32Array(n), right = new Float32Array(n);
  for (const { part, r } of got) {
    const { gainDb, pan } = micOf(part), g = 10 ** (gainDb / 20), gl = g * Math.cos(((pan + 1) * Math.PI) / 4), gr = g * Math.sin(((pan + 1) * Math.PI) / 4);
    const off = Math.round((r.at - start) * SR), ratio = r.sr / SR, len = Math.floor(r.samples.length / ratio);
    for (let i = 0; i < len; i++) {
      const p = i * ratio, k = Math.floor(p), f = p - k, v = r.samples[k] * (1 - f) + (r.samples[k + 1] ?? 0) * f;
      left[off + i] += v * gl; right[off + i] += v * gr;
    }
  }
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  if (peak > 0.98) { const k = 0.98 / peak; for (let i = 0; i < n; i++) { left[i] *= k; right[i] *= k; } }
  return { left, right, sr: SR };
}
/** 嵌进歌的软上限（user 2026-10-07「控制在10M左右的体积（不严格要求）」）：超了三选一——嵌 / 不嵌只记来源（弱引用）/ 算了。 */
let embedSoftLimit = 10e6;
/** 弱引用解析到的子集（本次打开；subsetSha256 → 字节）。 */
const sessionSubsets = new Map<string, Uint8Array>();
/** 拿到一个 SoundFont 候选的子集字节（契约 Sf2Source）：歌里嵌的 → 本次已解析的 → 弱引用去找整包（本次内存 / 持久缓存 / 家族音源库按整包 sha256 对条目）→ 切子集、核 sha256。
 *  都找不到 = 抛错（没人上场、报出来、人换 = 换人的窄接口）；人也可以在歌手牌里「找文件…」把整包给它。 */
async function resolveGmBytes(g: GmCandidate): Promise<Uint8Array> {
  if (g.bytes) return g.bytes;
  if (g.path) throw new Error(`「${g.name}」的声音（${g.path}）没随这首歌带来`);
  const have = sessionSubsets.get(g.subsetSha256); if (have) return have;
  let bank = await cachedSound(g.origin.fileSha256);
  if (!bank) {
    const e = Object.values(SOUNDS).find((x) => x.sha256 === g.origin.fileSha256);
    if (e) { try { bank = await fetchSound(e, (done) => progress(`找「${g.name}」的声音：下载 ${e.name} ${Math.round((done / e.bytes) * 100)}%`)); } finally { progress(""); } }
  }
  if (!bank) throw new Error(`「${g.name}」的声音没随歌带（弱引用），这台设备和家族音源库里也没有它来自的「${g.origin.name}」（sha256 ${g.origin.fileSha256.slice(0, 12)}…）。点谱前面的「${roleName(doc.extras, curRole())}」，给它「找文件…」，或换一个「谁来演」`);
  const subset = subsetSf2(bank, [{ bank: g.bank, program: g.program }]), sha = await sha256Hex(subset);
  if (sha !== g.subsetSha256) throw new Error(`从「${g.origin.name}」切出来的「${g.name}」和歌里记的不一样（sha256 ${sha.slice(0, 12)}… ≠ ${g.subsetSha256.slice(0, 12)}…），没有用它`);
  sessionSubsets.set(g.subsetSha256, subset);
  return subset;
}
/** SoundFont 候选的试听走实时合成器。载子集是异步的（几 MB，瞬时）：没载好时这一下丢掉、顺手去载（试听要即时，迟到的音更烦）。 */
const gmHeld = new Map<string, { bank: number; program: number; key: number }>();   // 哪根手指 / 哪个键按着哪个音
let gmPreparing: Promise<void> | null = null;
function prepareSynth(): Promise<void> {
  const g = activeGm(doc.extras, curRole()); if (!g || synth.loaded === g.subsetSha256) return Promise.resolve();
  if (gmPreparing) return gmPreparing;
  gmPreparing = (async () => { const bytes = await resolveGmBytes(g); await synth.load(g.subsetSha256, bytes); })()
    .catch((e) => { showError(`「${g.name}」响不了：${(e as Error).message}`); })
    .finally(() => { gmPreparing = null; });
  return gmPreparing;
}
function gmDown(midi: number, id: string): void {
  const a = finder.isOpen && audition ? audition : null;
  const g = a ? { bank: a.bank, program: a.program, note: a.note, subsetSha256: a.sha256 } : activeGm(doc.extras, curRole()); if (!g) return;
  if (synth.loaded !== g.subsetSha256) { if (!a) void prepareSynth(); return; }
  singer.unlock();
  const key = g.note ?? midi;   // 鼓件：任何键都敲它
  gmUp(id); synth.noteOn(g.bank, g.program, key, 0.8); gmHeld.set(id, { bank: g.bank, program: g.program, key });
}
function gmUp(id: string): void { const h = gmHeld.get(id); if (h) { gmHeld.delete(id); synth.noteOff(h.bank, h.program, h.key); } }
/** 月读哼整首（找人视图里给人声概念「听开头」）：元音采样器按光标所在的声部唱。 */
function playLight(who = "月读（哼）"): void {
  const { tokens, map } = curFlat(), notes = lightNotes(tokens, map);
  if (!notes.length) { info("还没有音"); return; }
  if (!sampler.ready) { progress("元音表下载中…"); void sampler.load().then(() => playLight(who)); return; }
  const total = sampler.playSong(notes, st.song.hum, () => playIcon(false));
  playIcon(true); progress(`${who} ${total.toFixed(1)} 秒`);
}
async function togglePlay(): Promise<void> {
  if (singer.playing || sampler.songPlaying) { singer.stop(); sampler.stopSong(); playIcon(false); return; }
  if (singing) return;
  singer.unlock();   // 在用户手势里先把声音打开（iPad）
  singing = true; $("playBtn").classList.add("is-on");
  try {
    const t0 = performance.now(), m = await renderMix();
    if (!m) { progress(""); return; }
    const secs = m.left.length / m.sr, took = (performance.now() - t0) / 1000;
    progress(took > 0.3 ? `${secs.toFixed(1)} 秒（准备 ${took.toFixed(1)} s）` : `${secs.toFixed(1)} 秒`);
    singer.play({ samples: m.left, right: m.right, sr: m.sr }, () => { playIcon(false); });
    playIcon(true);
  } catch (e) {
    showError(`放不了：${(e as Error).message}`);
    progress("");
  } finally { singing = false; $("playBtn").classList.remove("is-on"); }
}
$("playBtn").addEventListener("click", () => { void togglePlay(); });

// ── 导出歌声（user「基于wxhw的经验分享是可以很早就做」）：照 WXHW 的形状——先生成，再弹「好了」面板，
//    点「分享」那一下才调系统分享（iOS Safari 只认用户手势里的 navigator.share）；没有分享的（桌面 / Quest）= 下载。
let exporting = false;
async function exportSong(): Promise<void> {
  if (exporting || singing) return;
  exporting = true;
  try {
    const m = await renderMix();
    if (!m) { progress(""); return; }
    progress("编 mp3…");
    const mono = new Float32Array(m.left.length);   // mp3 这一版单声道（左右平均；声像以后随立体声导出一起做）
    for (let i = 0; i < mono.length; i++) mono[i] = (m.left[i] + m.right[i]) / 2;
    const secs = mono.length / m.sr, bytes = await encodeMp3(mono, m.sr);
    const file = new File([bytes], `${docName()}.mp3`, { type: "audio/mpeg" });
    progress("");
    offerFile(file, "歌声导出好了", `${secs.toFixed(1)} 秒 · mp3 ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}`);
  } catch (e) {
    progress(""); showError(`导出失败：${(e as Error).message}`);
  } finally { exporting = false; }
}
let closeOffer: (() => void) | null = null;

// ── 模型来源（ADR-0006 ③ re-pointable endpoints：界面上能改、出厂预填；user 2026-10-07「i might worry about hardcode my gh link so if
//    i closed my gh account all app are not able to run in private server which violates the anti abandonware rule」）：
//    先找同一个网站下的 pwa-models/（自己搭服务器的人把模型仓拷过来就能用、不用配置），找不到再用这里设的；还能从本机文件导入。
//    设的值只在这次打开里有效（持久化还没定）。
const MODEL_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-models";
// 音源库（pwa-sounds）同样一套：先找同源 pwa-sounds/，再用设置里的；只在这次打开里有效
let soundsSource = SOUNDS_SOURCE_DEFAULT;
const soundsBases = () => [...new Set([new URL("pwa-sounds", location.href).href, soundsSource.trim().replace(/\/+$/, "") || SOUNDS_SOURCE_DEFAULT])];
/** 从音源库拿一个文件：逐个地址试，流式读（报进度），到手对目录里钉的 sha256（不对 = 不用、报出来）。 */
async function fetchSound(e: SoundEntry, onProgress: (done: number) => void): Promise<Uint8Array> {
  const hit = await cachedSound(e.sha256); if (hit) return hit;   // 本次内存 / 持久缓存 `pwa-sounds`（user「可以缓存指定的包，不然没网的时候很麻烦」）
  let last = "";
  for (const base of soundsBases()) {
    try {
      const res = await fetch(`${base}/${e.file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const out = new Uint8Array(e.bytes); let o = 0;
      const rd = res.body?.getReader();
      if (!rd) { const b = new Uint8Array(await res.arrayBuffer()); if (b.length !== e.bytes) throw new Error(`大小不对（${b.length} ≠ ${e.bytes}）`); out.set(b); o = b.length; }
      else for (;;) { const { done, value } = await rd.read(); if (done) break; if (o + value.length > e.bytes) throw new Error("比目录里说的大"); out.set(value, o); o += value.length; onProgress(o); }
      if (o !== e.bytes) throw new Error(`大小不对（${o} ≠ ${e.bytes}）`);
      const got = await sha256Hex(out);
      if (got !== e.sha256) throw new Error(`内容和目录里钉的不一样（sha256 ${got.slice(0, 12)}… ≠ ${e.sha256.slice(0, 12)}…），没有用它`);
      await rememberSound(e.sha256, out, true);   // 核过了才留；第一次下载就留在设备上（user「每次加乐器都会重新下一下GS」）
      return out;
    } catch (err) { last = `${base}：${(err as Error).message}`; }
  }
  throw new Error(`「${e.name}」拿不到（试过 ${soundsBases().join("、")}）。最后一次：${last}。可以在设置里换音源库来源，或从本机 .sf2 文件选。`);
}
let modelSource = MODEL_SOURCE_DEFAULT;
const modelBases = () => [...new Set([new URL("pwa-models", location.href).href, modelSource.trim().replace(/\/+$/, "") || MODEL_SOURCE_DEFAULT])];
const packStore = createPackStore({ packs: PACKS });   // 只用来导入 / 看状态；下载在 worker 里（同一个 Cache Storage pwa-models）
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
async function packStatusText(): Promise<string> {
  const st = await packStore.status(Object.keys(PACKS));
  return st.map((s) => `${s.ready ? "✓" : "·"} ${s.slug}（${(s.bytesTotal / 1e6).toFixed(1)} MB）`).join("\n");
}
/** 设置面板（应用内，不用系统弹窗）：模型来源、从本机文件导入模型包、月读的署名与使用条款（包内 LICENSE [1][2] 要求显示）。 */
function openSettings(): void {
  if (closeOffer) closeOffer();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">设置</div>` +
    `<label class="set-field">模型来源<input id="srcIn" type="url" spellcheck="false" autocomplete="off" value="${esc(modelSource)}" /></label>` +
    `<label class="set-field">音源库来源（乐器音色库、鼓组、音效素材；不是 AI 模型）<input id="sndIn" type="url" spellcheck="false" autocomplete="off" value="${esc(soundsSource)}" /></label>` +
    `<div class="set-field">音源库缓存（留在设备上，没网也能用；歌自己带声音，这里只是货架）<div id="sndCache" class="set-packs">…</div></div>` +
    `<div class="offer-msg">先找这个网站下的 <code>pwa-models/</code>（自己搭服务器的话，把模型仓拷过去就能用），找不到再用这里填的。只在这次打开里有效。</div>` +
    `<div class="set-row"><button class="btn" data-v="default">恢复默认</button>` +
    `<label class="btn" title="选模型包的分片文件（chunk-000 …，名字不重要），或整个包拼成的一个文件"><svg class="ico"><use href="#import"/></svg>从本机文件导入模型包<input id="impIn" type="file" multiple hidden /></label></div>` +
    `<pre id="packSt" class="set-packs">…</pre>` +
    `<details class="set-credit"><summary>乐器目录的图标（第三方，${ICON_CREDITS.length} 个）</summary><pre>${esc(ICON_CREDITS.map((c) => `${c.id} — ${c.author} (${c.set}, ${c.license}) ${c.url}`).join("\n"))}</pre></details>` +
    `<details class="set-credit"><summary>月读（つくよみちゃん）的署名与使用条款</summary><pre>${esc(CREDIT.credit)}\n\n${esc(CREDIT.terms)}\n${esc(CREDIT.termsUrl)}\n\n${esc(CREDIT.attribution.join("\n"))}</pre></details>` +
    `<div class="set-row"><button class="btn" data-v="finder" title="全屏的乐器目录：按年代浏览、用 pad 弹着玩；「上场」给当前声部">乐器目录…</button>` +
    `<button class="btn" data-v="lib">歌库…</button><button class="btn" data-v="cloud">云端（OneDrive）…</button></div>` +
    `<details class="set-credit"><summary>诊断日志（黑匣子：登录 / 同步的报错都在这里，出问题拷给开发者）</summary><pre id="diagTxt" class="set-packs">${esc(diagText())}</pre><div class="set-row"><button class="btn" data-v="diag:copy">复制</button><button class="btn" data-v="diag:clear">清空</button></div></details>` +
    `<div class="set-row set-app"><span class="set-ver">${APP_VERSION}</span><button class="btn" data-v="check">检查更新</button><button class="btn" data-v="reset" title="卡在旧版本时用：注销本 app 的离线缓存再重开。下好的月读模型包不删">清缓存重启</button></div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const srcIn = box.querySelector<HTMLInputElement>("#srcIn")!, packSt = box.querySelector<HTMLElement>("#packSt")!;
  const refresh = () => { void packStatusText().then((t) => (packSt.textContent = t)); };
  refresh();
  const sndIn = box.querySelector<HTMLInputElement>("#sndIn")!, sndCache = box.querySelector<HTMLElement>("#sndCache")!;
  const refreshSounds = async () => {
    const cached = await listCachedSounds(), bySha = new Map(cached.map((c) => [c.sha256, c])), known = new Set(Object.values(SOUNDS).map((e) => e.sha256));
    const total = cached.reduce((n, c) => n + c.bytes, 0), mem = soundMemoryBytes();
    let quota = ""; const est = await siteStorageEstimate(); if (est) quota = `；这个站点共用了 ${sizeText(est.usage)} / 配额 ${sizeText(est.quota)}`;
    sndCache.innerHTML = `<div class="set-row"><span>设备上留着 ${sizeText(total)}${quota}；内存里现在 ${sizeText(mem)}</span>${mem ? `<button class="btn" data-v="snd:mem" title="放掉内存里的整包（设备上留着的不动，下次用再从设备读）">放掉内存</button>` : ""}</div>` +
      Object.values(SOUNDS).map((e) => { const c = bySha.get(e.sha256); return `<div class="set-row"><span>${esc(e.name)} · ${sizeText(e.bytes)} · ${c ? "已留在设备上" : "没下载"}</span>${c ? `<button class="btn" data-v="snd:del:${esc(e.id)}">删掉</button>` : `<button class="btn" data-v="snd:get:${esc(e.id)}">下载留着</button>`}</div>`; }).join("") +
      cached.filter((c) => !known.has(c.sha256)).map((c) => `<div class="set-row"><span>别的版本 / 别的 app 留的（${c.sha256.slice(0, 8)}…）· ${sizeText(c.bytes)}</span><button class="btn" data-v="snd:delsha:${c.sha256}">删掉</button></div>`).join("") || "（没有）";
  };
  void refreshSounds();
  const close = () => { modelSource = srcIn.value.trim() || MODEL_SOURCE_DEFAULT; soundsSource = sndIn.value.trim() || SOUNDS_SOURCE_DEFAULT; box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") close();
    else if (v === "default") { srcIn.value = MODEL_SOURCE_DEFAULT; sndIn.value = SOUNDS_SOURCE_DEFAULT; }
    else if (v === "lib") { close(); void openGallery(); }
    else if (v === "cloud") { close(); ensureAttached(); void openCloudMenu(); }
    else if (v === "diag:copy") { void navigator.clipboard?.writeText(diagText()).then(() => info("复制了"), () => showError("复制不了（浏览器不给剪贴板）")); }
    else if (v === "diag:clear") { diagClear(); box.querySelector("#diagTxt")!.textContent = ""; }
    else if (v?.startsWith("snd:get:")) { const e = SOUNDS[v.slice(8)]; soundsSource = sndIn.value.trim() || SOUNDS_SOURCE_DEFAULT; void fetchSound(e, (done) => progress(`下载 ${e.name} ${Math.round((done / e.bytes) * 100)}%`)).then(() => { progress(""); info(`${e.name} 留在设备上了`); }).catch((err) => { progress(""); showError((err as Error).message); }).finally(() => void refreshSounds()); }
    else if (v?.startsWith("snd:del:")) { const e = SOUNDS[v.slice(8)]; void forgetSound(e.sha256).then(refreshSounds); }
    else if (v?.startsWith("snd:delsha:")) void forgetSound(v.slice(11)).then(refreshSounds);
    else if (v === "snd:mem") { releaseSoundMemory(); void refreshSounds(); }
    else if (v === "check") void shell.checkForUpdate().then((r) => { if (r === "found") { close(); showUpdateBar(); } else info(r === "latest" ? "已经是最新版" : "这里没有离线壳（本机开发 / 浏览器不支持），不用更新"); });
    else if (v === "reset") void shell.forceReset();
    else if (v === "finder") { close(); openFinder(); }
  });
  box.querySelector<HTMLInputElement>("#impIn")!.addEventListener("change", async (e) => {
    const files = [...((e.target as HTMLInputElement).files ?? [])]; if (!files.length) return;
    packSt.textContent = "导入中…";
    try { await packStore.importFiles(Object.keys(PACKS), files, (p) => (packSt.textContent = `导入中… ${Math.floor((p.done / p.total) * 100)}%`)); }
    catch (err) { showError(`导入没成：${(err as Error).message === "no-matching-file" ? "这些文件不是月读要的模型包分片" : (err as Error).message}`); }
    refresh();
  });
}
$("setBtn").addEventListener("click", () => openSettings());
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
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
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
(window as unknown as Record<string, unknown>).__moonsinger = { singer, sampler, exportSong, labScore: () => { const { tokens, map } = curFlat(); return toLabScore(tokens, st.song.hum, songLangOf(tokens), map); }, state: () => st, cssHash: __CSS_HASH__, extras: () => doc.extras, setEmbedSoftLimit: (n: number) => { embedSoftLimit = n; }, synth, layout: () => view.layout, bytes: () => bytesNow(), open: (name: string, bytes: Uint8Array) => openBytes(name, bytes), view, zipList: (bytes: Uint8Array) => Object.keys(unzipSync(bytes)), zipText: (bytes: Uint8Array, path: string) => new TextDecoder().decode(unzipSync(bytes)[path]), load: (o: ReturnType<typeof openBytes>) => loadDoc(o.song, { stem: o.stem, named: true, extras: o.extras, handle: null }),
  store: () => (hasStore() ? requireStore() : null), es: () => es, gallery: () => gallery, attach: () => ensureAttached(), openGallery: () => openGallery(), newStoreSong: () => newStoreSong(), openStoreDoc: (id: string) => openStoreDoc(id), identifier: () => doc.identifier, dirty: () => dirty(), auth };   // cssHash：样式表版本（见 scripts/build.sh）

// ── 顶栏 ────────────────────────────────────────────────────────────────
$("padBtn").addEventListener("click", () => showPad(padEl.hidden));
/** pad 像软键盘、五线谱像文本框（user「键盘输入歌词的时候音乐键盘应该hide」「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：
 *  点谱 = 弹出；打开歌词 / 歌名框（系统键盘要上来）= 收起；点顶栏空白处 = 收起。开局是弹出的（光标就在谱上）。
 *  横屏 / 桌面也一样（纸宽固定了，收起旁边的 pad 不会让谱重排）。顶栏的 pad 钮照旧手动开关；开「弹」= 弹出。 */
function showPad(on: boolean): void {
  if (padEl.hidden === !on) return;
  padEl.hidden = !on; $("padBtn").classList.toggle("is-on", on);
  if (!on) pad.clearHeld();
  view.render();
}
bar.addEventListener("pointerdown", (e) => { if (!(e.target as HTMLElement).closest("button, select, label, input, a")) showPad(false); });

// ── 文件（无地逃生口）：一首歌 = 一个 .mxl；家 = 打开的那个文件（桌面 Chromium 能存回去）或没有家（iPad：存 = 下载 / 分享） ──────
/** 台上那位的引擎（= 谁来演、怎么出声）；unknown = 没人能出声（别家谱原来的乐器 / 这一版不认识）。SSoT = 休息室快照（doc.extras），不另存状态。 */
function engineNow(): Engine { return activeInstrument(doc.extras, curRole())?.engine ?? "unknown"; }
const dirty = () => st.song !== doc.saved.song || loungeKey() !== doc.saved.lounge;
/** 顶栏的名字 + 两个状态：「•」= 改过还没落盘（无地 = 没存；歌库 = 2 s 内会自动存）；云朵 = 歌库里的歌在不在云端最新（没上云 / 已同步 / 没登录不画）。 */
function renderTitle(): void {
  const d = dirty(), name = docName(), inStore = doc.identifier != null;
  const pending = inStore && es.isPushPending(), signed = inStore && auth.isSignedIn();
  $("docTitle").textContent = `${name}${d ? " •" : ""}`;
  $("docTitle").title = d ? (inStore ? "改过，马上自动存" : "改过还没存") : inStore ? (pending ? (signed ? "存在这台设备上了，还没推上云（稍后自动推）" : "存在这台设备上了（没登录，不上云）") : signed ? "在歌库里，云端也是最新的" : "在歌库里（这台设备上）") : doc.handle ? `存在 ${doc.handle.name}` : "";
  $("cloudSt").innerHTML = !inStore || !signed ? "" : `<svg class="ico ico-sm"><use href="#${pending || d ? "cloud-upload" : "cloud-synced"}"/></svg>`;
  document.title = `${d ? "• " : ""}${name} · MoonSinger`;
}
/** 主唱没人上场（别的软件存的谱，原来的乐器这一版没有）：不出声、报错，人来选（user「不出声，报错，人类手动换」）。 */
function noCast(what: string): void {
  showError(`「${roleName(doc.extras, curRole())}」这个角色还没有人上场（原来的乐器这一版没有），所以没有${what}。要月读来唱，点谱前面的「${roleName(doc.extras, curRole())}」，在「谁来演」选月读。`);
}
// ── 找人视图（src/ui/finder.ts）：全屏替掉谱区，pad 当试听键盘；试听台 = 临时的一个槽（不进休息室），「上场」才造演奏者 ──────────
let audition: { bank: number; program: number; note?: number; sha256: string; subset: Uint8Array; label: string } | null = null;   // 试听台上的（GS 预设；note = 鼓件，pad 任何键都敲它）；null = 月读 / 没选
const GS = SOUNDS["generaluser-gs-2.0.3"];
/** 试听台：从 GS 切出这个预设、载进实时合成器（22 ms + 几 MB）；换到月读 = 清掉。 */
async function setAudition(p: FinderPick | null): Promise<void> {
  if (!p || p.kind === "voice") { audition = null; synth.allOff(); gmHeld.clear(); return; }
  try {
    const bank = await fetchSound(GS, (done) => progress(`下载 ${GS.name} ${Math.round((done / GS.bytes) * 100)}%`)); progress("");
    const subset = subsetSf2(bank, [{ bank: p.provider.bank, program: p.provider.program }]), sha256 = await sha256Hex(subset);
    audition = { bank: p.provider.bank, program: p.provider.program, ...(p.provider.note !== undefined ? { note: p.provider.note } : {}), sha256, subset, label: p.provider.gmName };
    synth.allOff(); gmHeld.clear(); await synth.load(sha256, subset);
  } catch (e) { progress(""); audition = null; showError(`试听不了：${(e as Error).message}`); }
}
/** 用试听台上那位放本声部的开头（前 8 秒；离线渲染）。 */
async function playHeadWith(p: FinderPick): Promise<void> {
  if (p.kind === "voice") { playLight("月读（哼）"); return; }
  if (!audition || audition.bank !== p.provider.bank || audition.program !== p.provider.program) await setAudition(p);
  if (!audition) return;
  const { tokens, map } = curFlat();
  const notes = lightNotes(tokens, map).filter((n) => n.t0 < 8).map((n) => ({ preset: [audition!.bank, audition!.program] as [number, number], key: audition!.note ?? n.midi, vel: 0.8, t0: n.t0, t1: Math.min(n.t1, 8) }));
  if (!notes.length) { info("谱上还没有音"); return; }
  singer.unlock();
  try { const r = await singer.gm(audition.subset, audition.sha256, notes, GM_SR, 1.5); singer.play(r, () => playIcon(false)); playIcon(true); progress(`${audition.label} · 开头 ${(r.samples.length / r.sr).toFixed(1)} 秒`); }
  catch (e) { showError(`放不了：${(e as Error).message}`); }
}
/** 上场：角色改成这个概念（谱上写它的英文名 + 官方 id + id 束 by value），再造演奏者。mode auto = 不超软上限就嵌、超了回 "over" 让视图问。 */
async function castPick(p: FinderPick, mode: "auto" | "embed" | "weak"): Promise<"done" | "over"> {
  const cat = await loadCatalog(new URL(import.meta.url)), c = p.concept;
  const sound = p.kind === "gs" ? (p.provider.sound ?? roleSoundOf(cat, c)) : roleSoundOf(cat, c);
  doc.extras = withRoleConcept(doc.extras, curRole(), { name: roleNameOf(c), sound, concept: { ids: { wikidata: c.ids.wikidata, local: c.ids.local, musicxml: c.ids.musicxml, gm: c.ids.gm.map((g) => ({ program: g.program, bank: g.bank })), hs: c.ids.hs }, name: { zh: c.names.zh, en: c.names.en, ...(c.names.ja ? { ja: c.names.ja } : {}) } } }, st.song.hum);
  if (p.kind === "voice") { setActive(CANDIDATE_ID.full); closeFinder(); return "done"; }
  if (!audition || audition.bank !== p.provider.bank || audition.program !== p.provider.program) await setAudition(p);
  if (!audition) { view.render(); renderTitle(); return "done"; }
  const { subset, sha256 } = audition, inf = sf2Info(subset);
  if (mode === "auto" && subset.length > embedSoftLimit) return "over";
  const fileSha256 = GS.sha256;   // 试听台的整包 = 货架上的那份（哈希就是目录钉的）
  doc.extras = withSf2Candidate(doc.extras, curRole(), { name: p.provider.gmName, bank: p.provider.bank, program: p.provider.program, ...(p.provider.note !== undefined ? { note: p.provider.note } : {}), subset, sha256, embed: mode !== "weak",
    origin: { name: GS.name, fileSha256, bytes: GS.bytes, library: GS.id }, credit: { attribution: [GS.attribution], license: { name: GS.license.name, url: GS.homepage ?? GS.source, text: inf.comment } } }, st.song.hum);
  if (mode === "weak") sessionSubsets.set(sha256, subset);
  closeFinder(); setActive(activeId(doc.extras, curRole())); info(`「${roleNameOf(c)}」上场：${p.provider.gmName}`);
  return "done";
}
const finder = new Finder($("stage"), { base: new URL(import.meta.url), roleName: () => roleName(doc.extras, curRole()), audition: setAudition, playHead: playHeadWith, cast: castPick, close: () => closeFinder() });
// ── 录音室（src/ui/studio.ts）：全屏替掉谱区，一个声部一条推子条；增益 / 声像进录音房（studio.json），静音 / 独奏 = partView ──
const studio = new Studio($("stage"), {
  strips: () => { const labels = partLabels(st.song, doc.extras); return st.song.parts.map((p, k) => ({ id: p.id, name: labels[k], performer: activeCandidateName(doc.extras, p.role) ?? "（没人上场）", ...micOf(p), muted: pv(p.id).muted, solo: pv(p.id).solo })); },
  setGain: (id, dB) => { const p = st.song.parts.find((x) => x.id === id); if (p) { doc.extras = withMic(doc.extras, p.mic, { gainDb: dB }); renderTitle(); } },
  setPan: (id, pan) => { const p = st.song.parts.find((x) => x.id === id); if (p) { doc.extras = withMic(doc.extras, p.mic, { pan }); renderTitle(); } },
  toggleMute: (id) => { setPv(id, { muted: !pv(id).muted }); view.render(); },
  toggleSolo: (id) => { setPv(id, { solo: !pv(id).solo }); view.render(); },
  play: () => { void togglePlay(); },
  close: () => closeStudio(),
});
function openStudio(): void { closeOffer?.(); closeFinder(); scoreEl.hidden = true; showPad(false); studio.show(); }
function closeStudio(): void { if (!studio.isOpen) return; studio.hide(); scoreEl.hidden = false; scoreEl.focus(); }
$("studioBtn").addEventListener("click", () => { if (studio.isOpen) closeStudio(); else openStudio(); });
function openFinder(): void { closeOffer?.(); scoreEl.hidden = true; showPad(true); padEl.classList.add("is-locked"); pad.clearHeld(); $("improBtn").classList.add("is-on"); void finder.show(); }   // 「弹」亮着 = pad 只弹不写
function closeFinder(): void { if (!finder.isOpen) return; finder.hide(); audition = null; synth.allOff(); gmHeld.clear(); padEl.classList.remove("is-locked"); $("improBtn").classList.toggle("is-on", impro); scoreEl.hidden = false; void prepareSynth(); view.render(); renderTitle(); scoreEl.focus(); }
/** 换台上的演奏者（人选的，不自动）：改休息室快照里的 active，重画谱前的歌手牌。 */
function setActive(id: string): void { doc.extras = withActive(doc.extras, curRole(), id, st.song.hum); synth.allOff(); gmHeld.clear(); void prepareSynth(); view.render(); renderTitle(); }
const sha256Hex = async (b: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as unknown as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");
/** 作者栏（标题下面靠右那一块点开）：一块纯文本，纸上照写的显示（不认「作词：」这类格式，所见即所得）。
 *  不提醒、不帮用户写任何东西（user「只是举例子，然后这个你也不应该强迫或者提醒用户写这个，因为谱子也不绑定乐器的」「…一键插入按钮 不要」）。 */
function openCreditsSheet(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card credits-card"><div class="offer-title">作者栏</div>` +
    `<textarea id="crIn" class="credits-in" rows="5" spellcheck="false" placeholder="几行都行，照写的显示在纸上（标题下面靠右）">${esc(st.song.credits ?? "")}</textarea>` +
    `<div class="offer-msg">可不填。存进 MusicXML「印在页面上的字」，别的乐谱软件打开也在纸上。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="ok">好</button></div></div>`;
  document.body.append(box);
  const ta = box.querySelector<HTMLTextAreaElement>("#crIn")!;
  const close = () => { update(setCredits(st, ta.value)); box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "ok") close();
  });
  ta.focus();
}
/** 纸的设置（纸右上角的小钮点开）：A4 / A5 / A6，整首歌一个；以后插图片也从这里进（user「加图片的入口以后也可以放那里」）。改了立刻生效。 */
function openPaperSheet(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  const draw = () => {
    const p = st.song.paper ?? paperOf(DEFAULT_PAPER);
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">纸</div><div class="set-row">` +
      PAPER_KINDS.map((k) => `<button class="btn cand${p.kind === k ? " is-on" : ""}" data-v="${k}">${PAPER_LABEL[k]}<small>${PAPER_NOTE[k]}</small></button>`).join("") +
      (p.kind === "other" ? `<button class="btn cand is-on" data-v="other">其他<small>${paperSizeText(p)}</small></button>` : "") + `</div>` +
      `<div class="offer-msg">整首歌一张纸。纸越大一行放的小节越多；屏幕放得下就照纸排。不打印的时候不分页。</div>` +
      `<div class="part-sec">版式</div><div class="set-row">` +
      DENSITIES.map((z) => `<button class="btn cand${densityOf(p) === z.id ? " is-on" : ""}" data-v="density:${z.id}">${z.label}<small>${z.note}</small></button>`).join("") + `</div>` +
      `<div class="offer-msg">紧凑 = 谱小一号、行距和谱距收紧、没写歌词的声部不留歌词位。存进 MusicXML 的 scaling 和行距，别的软件打开也一样。</div>` +
      `<div class="part-sec">纸（曲段）</div>` + st.song.papers.map((pp, k) => `<div class="set-row paper-row"><span class="paper-row-name">${k + 1}. ${esc(pp.name || "（没名字）")}${pp.id === st.at.paper ? " ←" : ""}</span>` +
        `<button class="btn" data-v="pm:${esc(pp.id)}" title="这张纸的菜单：改名 / 挪 / 加声部 / 删">⋯</button></div>`).join("") +
      `<div class="set-row"><button class="btn" data-v="addpaper">＋ 新的纸（接在最后）</button></div>` +
      `<div class="part-sec">排法</div><div class="set-row">` +
      `<button class="btn cand${pageFlow ? "" : " is-on"}" data-v="flow:cont">连续<small>一张长纸往下滚</small></button>` +
      `<button class="btn cand${pageFlow ? " is-on" : ""}" data-v="flow:pages">分页<small>按纸高分页，预览打印（= 以后的 PDF）</small></button></div>` +
      `<div class="part-sec">屏幕放不下纸的时候</div><div class="set-row">` +
      `<button class="btn cand${reflow ? "" : " is-on"}" data-v="fit">不折行<small>整张纸缩小，行和纸上一样</small></button>` +
      `<button class="btn cand${reflow ? " is-on" : ""}" data-v="reflow">折行<small>按屏幕宽排，谱大一点</small></button></div>` +
      `<div class="offer-msg">以后插图片也在这里。</div>` +
      `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  };
  draw();
  document.body.append(box);
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (v && (PAPER_KINDS as string[]).includes(v)) { update(setPaper(st, v as PaperKind)); draw(); }
    else if (v?.startsWith("density:")) { update(setDensity(st, v.slice(8) as Density)); draw(); }
    else if (v === "addpaper") { close(); update(addPaper(st)); info("新的一张纸"); }
    else if (v?.startsWith("pm:")) { close(); openPaperMenu(v.slice(3)); }
    else if (v === "fit" || v === "reflow") { reflow = v === "reflow"; view.render(); draw(); }
    else if (v === "flow:cont" || v === "flow:pages") { pageFlow = v === "flow:pages"; view.render(); draw(); }
  });
}
/** 角色卡（第一行谱号左边的角色名）点开（user「歌手牌同意，和打谱软件对齐」→「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西…
 *  所以是你可以写或者选role的名字，帮我多想几个preset。然后名字之外再选乐器」）：
 *  上 = 角色名（谱上写的、MusicXML <part-name>；写或者点预设），中 = 谁来演（乐器 = 候选，名字不上谱——窄接口），下 = 就地改它的设置。改了立刻生效。
 *  现在一个声部、乐器只有月读（完整 / 轻量）= 多乐器的占位（数据契约「每个声部在谱号前面选角色和麦克风」）。 */
const HUMS: [Hum, string][] = [["n", "ん / 嗯"], ["a", "あ / 啊"], ["o", "お / 哦"], ["u", "う / 呜"], ["la", "ら / 啦"]];
/** 要画的声部：谱上写角色名（同名同种带号）、没人上场的画淡色、第一个声部上面画速度；隐藏的缩成细行；名字下面打出声 / 显示的角标。 */
function partViews(): PartView[] {
  const labels = partLabels(st.song, doc.extras);
  return st.song.parts.map((p, k) => {
    const v = pv(p.id), badges = [v.muted ? "静音" : "", v.solo ? "独奏" : "", v.only ? "只看它" : ""].filter(Boolean);
    return { id: p.id, name: labels[k], empty: (activeInstrument(doc.extras, p.role)?.engine ?? "unknown") === "unknown", first: k === 0, clef: p.clef ?? "G", ...(p.staves === 2 ? { staves: 2 as const } : {}), hidden: !isShown(p.id), badges };
  });
}
/** 显示状态变了：光标所在的声部要是看不见了，挪到这张纸上第一个看得见的声部。 */
function afterViewChange(): void {
  if (!isShown(st.at.part)) {
    const paper = st.song.papers.find((pp) => pp.id === st.at.paper), to = st.song.parts.find((p) => isShown(p.id) && paper?.tracks[p.id]);
    if (to) update(setFocus(st, st.at.paper, to.id));
  }
  view.render();
}
/** 歌名左边「‹ ›」：跳到上一张 / 下一张纸（光标跟着过去，视图滚到它）。 */
function navPaper(dir: -1 | 1): void {
  const k = st.song.papers.findIndex((p) => p.id === st.at.paper), to = st.song.papers[k + dir]; if (!to) return;
  const part = to.tracks[st.at.part] ? st.at.part : st.song.parts.find((p) => to.tracks[p.id])?.id ?? st.at.part;
  update(setFocus(st, to.id, part));
}
/** 新声部：休息室里建一份默认角色（月读两个候选）+ 录音房一个麦克风，每张纸上给它一条只有谱头的 track；光标跳过去、开它的歌手牌。 */
function addNewPart(): void {
  const role = newRoleId(doc.extras, st.song), mic = newMicId(doc.extras, st.song);
  const id = `P${Math.max(0, ...st.song.parts.map((p) => Number(/^P(\d+)$/.exec(p.id)?.[1] ?? 0))) + 1}`;
  doc.extras = withNewRole(doc.extras, role, st.song.hum);
  update(addPart(st, { id, role, mic }));
  renderTitle();
  openPartSheet();
}
/** 纸的菜单（纸顶「⋯」）：改曲段名、挪、在后面加一张、这张纸上加 / 不加某个声部、删这张纸。 */
function openPaperMenu(id: string): void {
  closeOffer?.();
  const paper = st.song.papers.find((p) => p.id === id); if (!paper) return;
  const k = st.song.papers.indexOf(paper), labels = partLabels(st.song, doc.extras);
  const absent = st.song.parts.flatMap((p, i) => (paper.tracks[p.id] ? [] : [{ id: p.id, name: labels[i] }]));
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">${esc(paper.name || `第 ${k + 1} 张纸`)}</div>` +
    `<div class="set-row"><button class="btn" data-v="name">改曲段名…</button><button class="btn" data-v="up"${k === 0 ? " disabled" : ""}>上移</button><button class="btn" data-v="down"${k === st.song.papers.length - 1 ? " disabled" : ""}>下移</button><button class="btn" data-v="add">在它后面加一张纸</button></div>` +
    (absent.length ? `<div class="part-sec">这张纸上加上声部</div><div class="set-row">${absent.map((a) => `<button class="btn cand" data-v="track:${esc(a.id)}">${esc(a.name)}</button>`).join("")}</div>` : "") +
    `<div class="set-row"><button class="btn" data-v="newpart">＋ 新声部…</button>${st.song.papers.length > 1 ? `<button class="btn cand danger" data-v="del">删这张纸…</button>` : ""}</div>` +
    `<div class="offer-msg">纸 = 曲段：每张纸是一个新的开始，各声部在这里重新对齐；一张纸上要哪些声部随它。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    if (v === "name") { close(); view.title.openNow(id); return; }
    if (v === "up" || v === "down") { update(movePaper(st, id, v === "up" ? -1 : 1)); close(); return; }
    if (v === "add") { update(addPaper(st, id)); close(); info("新的一张纸"); return; }
    if (v.startsWith("track:")) { update(addTrack(st, id, v.slice(6))); close(); return; }
    if (v === "newpart") { close(); addNewPart(); return; }
    if (v === "del") {
      close();
      void askSheet(`删掉「${paper.name || `第 ${k + 1} 张纸`}」？`, "这张纸上所有声部写的东西都没了（没有撤销）。", "删").then((ok) => { if (ok) update(removePaper(st, id)); });
    }
  });
}
function openPartSheet(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  const chip = (v: string, label: string, on: boolean, title = "") => `<button class="btn cand${on ? " is-on" : ""}" data-v="${esc(v)}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
  const setRole = (name: string, sound?: string) => {
    const n = name.trim(); if (!n || (n === roleName(doc.extras, curRole()) && (!sound || sound === roleSound(doc.extras, curRole())))) return;
    doc.extras = withRoleName(doc.extras, curRole(), n, st.song.hum, sound); view.render(); renderTitle();
  };
  // 找人：从货架（家族音源库）或自己的 .sf2 文件挑一把琴 → 只把那一件子集化嵌进歌（契约 §10.2）；超软上限三选一（嵌 / 弱引用 / 算了）
  let picked: { name: string; bytes: Uint8Array; presets: Sf2PresetInfo[]; sel: string; library?: SoundEntry } | null = null;
  type Chosen = { name: string; bank: number; program: number; subset: Uint8Array; sha256: string; origin: GmCandidate["origin"]; credit: { attribution: string[]; license: { name: string; url?: string; text?: string } } };
  let over: Chosen | null = null;   // 超软上限、等人三选一
  const pickOfficial = async (id: string) => {
    const e = SOUNDS[id];
    try {
      const bytes = await fetchSound(e, (done) => progress(`下载 ${e.name} ${Math.round((done / e.bytes) * 100)}%`));
      progress("");
      const presets = listSf2Presets(bytes), first = presets.find((p) => p.bank === 0) ?? presets[0];
      picked = { name: e.name, bytes, presets, sel: `${first.bank}:${first.program}`, library: e }; over = null; draw();
    } catch (err) { progress(""); showError((err as Error).message); }
  };
  const fileInput = (accept: string, onFile: (f: File) => Promise<void>) => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; inp.hidden = true; document.body.append(inp);
    inp.addEventListener("change", async () => { const f = inp.files?.[0]; inp.remove(); if (f) await onFile(f); });
    inp.click();
  };
  const pickFile = () => fileInput(".sf2,audio/x-soundfont", async (f) => {
    try {
      const bytes = new Uint8Array(await f.arrayBuffer()), presets = listSf2Presets(bytes);
      if (!presets.length) throw new Error("里面没有乐器");
      const first = presets.find((p) => p.bank === 0) ?? presets[0];
      picked = { name: f.name, bytes, presets, sel: `${first.bank}:${first.program}` }; over = null; draw();
    } catch (e) { showError(`读不了「${f.name}」：${(e as Error).message}`); }
  });
  // 弱引用找不到整包时：人把文件给它（核整包 sha256；对了就留在设备上）
  const findBankFile = (id: string) => {
    const g = gmCandidates(doc.extras, curRole()).find((c) => c.id === id); if (!g) return;
    fileInput(".sf2,audio/x-soundfont", async (f) => {
      try {
        const bytes = new Uint8Array(await f.arrayBuffer()), sha = await sha256Hex(bytes);
        if (sha !== g.origin.fileSha256) throw new Error(`「${f.name}」不是歌里记的那个「${g.origin.name}」（sha256 ${sha.slice(0, 12)}… ≠ ${g.origin.fileSha256.slice(0, 12)}…）`);
        await rememberSound(sha, bytes, true); sessionSubsets.delete(g.subsetSha256); lastRender.clear();
        await resolveGmBytes(g); info(`找到了：「${g.name}」能响了`); draw();
      } catch (e) { showError((e as Error).message); }
    });
  };
  const finishAdd = (c: Chosen, embed: boolean) => {
    doc.extras = withSf2Candidate(doc.extras, curRole(), { ...c, embed }, st.song.hum);
    if (!embed) sessionSubsets.set(c.sha256, c.subset);   // 弱引用：本次打开里直接能响
    picked = null; over = null; synth.allOff(); gmHeld.clear(); void prepareSynth(); view.render(); renderTitle(); draw();
  };
  const addPicked = async () => {
    if (!picked) return;
    const [bank, program] = picked.sel.split(":").map(Number), preset = picked.presets.find((p) => p.bank === bank && p.program === program);
    if (!preset) return;
    const name = box.querySelector<HTMLInputElement>("#sfName")?.value.trim() || preset.name;
    try {
      const subset = subsetSf2(picked.bytes, [{ bank, program }]), inf = sf2Info(picked.bytes);
      const [sha256, fileSha256] = await Promise.all([sha256Hex(subset), sha256Hex(picked.bytes)]);
      // 署名 / 许可证快照 by value：货架上的从目录条目抄（名字 + 出处 + 许可证名），自己拖进来的只有 INFO 块里的字、许可证 unknown（角色卡可填）
      const lib = picked.library;
      const credit = lib
        ? { attribution: [lib.attribution], license: { name: lib.license.name, url: lib.homepage ?? lib.source, text: inf.comment } }
        : { attribution: [inf.name, inf.engineer, inf.copyright].filter((x): x is string => !!x), license: { name: "unknown", text: inf.comment } };
      const c: Chosen = { name, bank, program, subset, sha256, origin: { name: picked.name, fileSha256, bytes: picked.bytes.length, ...(lib ? { library: lib.id } : {}) }, credit };
      if (subset.length > embedSoftLimit) { over = c; draw(); return; }   // 提示后仍可嵌（user）：三选一
      finishAdd(c, true);
    } catch (e) { showError(`加不进来：${(e as Error).message}`); }
  };
  const pickerHtml = () => {
    if (over) return `<div class="part-sec">「${esc(over.name)}」的声音有 ${sizeText(over.subset.length)}（超过 ${sizeText(embedSoftLimit)}）</div>` +
      `<div class="set-row"><button class="btn primary" data-v="sf2:embed" title="字节进歌：歌到哪都响；存档会变大、变慢">嵌进歌</button>` +
      `<button class="btn" data-v="sf2:weak" title="歌里只记来源和哈希（弱引用）：用时从家族音源库或你的文件里找；找不到 = 不出声、报错、人换">不嵌，只记来源</button><button class="btn" data-v="sf2:cancel">算了</button></div>`;
    if (!picked) return "";
    const banks = [...new Set(picked.presets.map((p) => p.bank))].sort((a, b) => a - b);
    const label = (b: number) => (b === 128 ? "鼓组" : b === 0 ? "乐器" : `变体（bank ${b}）`);
    const cur = picked.presets.find((p) => `${p.bank}:${p.program}` === picked!.sel);
    return `<div class="part-sec">${esc(picked.name)}（${picked.presets.length} 件）</div><select id="sfSel" class="role-sel">` +
      banks.map((b) => `<optgroup label="${label(b)}">${picked!.presets.filter((p) => p.bank === b).map((p) => `<option value="${p.bank}:${p.program}"${`${p.bank}:${p.program}` === picked!.sel ? " selected" : ""}>${String(p.program).padStart(3, "0")} ${esc(p.name)}</option>`).join("")}</optgroup>`).join("") +
      `</select><label class="role-name">叫<input id="sfName" class="role-in" type="text" spellcheck="false" autocomplete="off" value="${esc(cur?.name ?? "")}" /></label>` +
      `<div class="set-row"><button class="btn primary" data-v="sf2:add">加进来、上场</button><button class="btn" data-v="sf2:cancel">算了</button></div>`;
  };
  const ENGINE_TITLE: Record<Engine, string> = { tsukuyomi: "月读本人（つくよみちゃん；第一次要加载约 65 MB）", "vowel-sampler": "月读的元音采样：按下即响、任何设备都能跑", soundfont: "SoundFont 乐器（TinySoundFont 出声）", unknown: "这一版出不了声（别的软件原来的乐器）" };
  const draw = () => {
    const eng = engineNow(), h = st.song.hum, rn = roleName(doc.extras, curRole()), rs = roleSound(doc.extras, curRole()), aid = activeId(doc.extras, curRole());
    const gms = new Map(gmCandidates(doc.extras, curRole()).map((g) => [g.id, g])), active = gms.get(aid);
    const chipTitle = (c: { id: string; engine: Engine }) => { const g = gms.get(c.id); if (!g) return ENGINE_TITLE[c.engine]; return g.bytes ? `SoundFont ${g.bank}:${g.program}，声音嵌在歌里（${sizeText(g.bytes.length)}）` : g.path ? "声音没随这首歌带来" : `弱引用：声音不在歌里，用时从「${g.origin.name}」找`; };
    const status = !active ? "" : active.bytes ? `<div class="cand-status">声音嵌在歌里（${sizeText(active.bytes.length)}）${active.origin.library ? `，来自家族音源库的 ${esc(active.origin.name)}` : `，来自 ${esc(active.origin.name)}`}</div>`
      : active.path ? `<div class="cand-status">声音没随这首歌带来，所以没人上场——换一个「谁来演」</div>`
      : `<div class="cand-status">弱引用：歌里不带声音，用时从「${esc(active.origin.name)}」找（${sessionSubsets.has(active.subsetSha256) ? "本次已找到" : "家族音源库 / 设备缓存 / 你的文件"}）<button class="btn" data-v="find:${esc(active.id)}">找文件…</button></div>`;
    const me = curPart(), me_v = pv(me.id), onPaper = Object.keys(st.song.papers.find((p) => p.id === st.at.paper)?.tracks ?? {}).length;
    box.innerHTML = `<div class="offer-card settings-card part-card"><div class="offer-title">声部 ${esc(partLabels(st.song, doc.extras)[st.song.parts.indexOf(me)] ?? "")}</div>` +
      `<div class="part-sec">角色（这个声部是什么；谱上写它的名字）</div><select id="roleSel" class="role-sel">` +
      (ROLE_PRESETS.some((r) => r.name === rn && r.sound === rs) ? "" : `<option value="" selected>${esc(rn)}（自己写的）</option>`) +
      ROLE_GROUPS.map((g) => `<optgroup label="${g.group}">${g.items.map((r) => `<option value="${esc(`${r.sound}|${r.name}`)}"${r.name === rn && r.sound === rs ? " selected" : ""}>${esc(r.name)} — ${r.zh}</option>`).join("")}</optgroup>`).join("") +
      `</select><label class="role-name">谱上写<input id="roleIn" class="role-in" type="text" spellcheck="false" autocomplete="off" value="${esc(rn)}" /></label>` +
      `<div class="role-sound">MusicXML：<code>${esc(rs)}</code></div>` +
      `<div class="part-sec">谁来演（演奏者和他手里的琴；名字不上谱）</div><div class="set-row">` +
      candidates(doc.extras, curRole()).map((c) => chip(`cand:${c.id}`, c.engine === "unknown" ? `${esc(c.name)}（没人能演）` : esc(c.name), aid === c.id, chipTitle(c)) +
        (aid !== c.id && (c.engine === "soundfont" || c.engine === "unknown") ? `<button class="btn cand-del" data-v="del:${esc(c.id)}" title="从休息室删掉（它嵌在歌里的声音一起丢）">×</button>` : "")).join("") + `</div>` + status +
      `<div class="part-sec">找人</div><div class="set-row"><button class="btn primary" data-v="finder" title="全屏的乐器目录：按年代 / 族 / 发声方式 / 风浏览，右边的键盘试听，上场">打开乐器目录…</button></div><div class="set-row">` +
      Object.values(SOUNDS).map((e) => `<button class="btn" data-v="sound:${esc(e.id)}" title="${esc(`${e.description ?? e.name}（${sizeText(e.bytes)}；家族音源库，第一次点才下载、之后留在设备上；${e.license.name}）`)}">从 ${esc(e.name)} 选…</button>`).join("") +
      `<button class="btn" data-v="sf2:pick" title="自己的 .sf2 文件：只把选中的那一件嵌进歌，文件本身不留">从 .sf2 文件选…</button></div>` + pickerHtml() +
      `<div class="offer-msg">选了的琴只把用到的那一件（通常几 MB）嵌进歌里，歌到哪都响。</div>` +
      (eng === "tsukuyomi" || eng === "vowel-sampler" ? `<div class="part-sec">月读：没写歌词的音唱什么</div><div class="set-row">${HUMS.map(([v, l]) => chip(`hum:${v}`, l, h === v)).join("")}</div>` : "") +
      // 多声部（user「display有hide 和show only， play有mute和solo」）：显示一轴、出声一轴，各自「关掉」+「只要」；谱号
      `<div class="part-sec">显示（谱上）</div><div class="set-row">${chip("hide", "隐藏", me_v.hidden, "谱上缩成一条细行（点细行再放出来）；照样出声")}${chip("only", "只看它", me_v.only, "其余声部都缩成细行（可以几个一起「只看」）")}</div>` +
      `<div class="part-sec">出声（播放）</div><div class="set-row">${chip("mute", "静音", me_v.muted, "播放时不出声；谱上照画")}${chip("solo", "独奏", me_v.solo, "播放时只出有独奏的声部")}</div>` +
      `<div class="part-sec">谱表</div><div class="set-row">${chip("staves:1", "一张", (me.staves ?? 1) === 1)}${chip("staves:2", "大谱表", me.staves === 2, "上高音下低音（钢琴）：中央 C 以下自动落下面，pad「⋯ → 换谱表」能手动挪")}` +
      ((me.staves ?? 1) === 1 ? `<span class="set-gap"></span>${chip("clef:G", "高音谱号", (me.clef ?? "G") === "G")}${chip("clef:F", "低音谱号", me.clef === "F", "低的声部（贝斯 / 大提琴）")}` : "") + `</div>` +
      `<div class="set-row"><button class="btn" data-v="addpart" title="再加一个声部：每张纸上都给它一行，谱头照抄">＋ 加一个声部</button>` +
      (onPaper > 1 ? `<button class="btn" data-v="droptrack" title="这张纸上不要这个声部（别的纸照旧）">这张纸上去掉它</button>` : "") +
      (st.song.parts.length > 1 ? `<button class="btn cand danger" data-v="delpart" title="整首歌里删掉这个声部（休息室里它的角色一起删）">删掉这个声部…</button>` : "") + `</div>` +
      `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
    const inp = box.querySelector<HTMLInputElement>("#roleIn")!, sel = box.querySelector<HTMLSelectElement>("#roleSel")!;
    sel.addEventListener("change", () => { const [snd, ...nm] = sel.value.split("|"); if (snd) { setRole(nm.join("|"), snd); draw(); } });
    inp.addEventListener("change", () => setRole(inp.value));
    inp.addEventListener("keydown", (e) => { if (e.isComposing) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); setRole(inp.value); draw(); } });
    box.querySelector<HTMLSelectElement>("#sfSel")?.addEventListener("change", (e) => { if (!picked) return; picked.sel = (e.target as HTMLSelectElement).value; const p = picked.presets.find((x) => `${x.bank}:${x.program}` === picked!.sel); const n = box.querySelector<HTMLInputElement>("#sfName"); if (n && p) n.value = p.name; });
  };
  draw();
  document.body.append(box);
  const close = () => { const inp = box.querySelector<HTMLInputElement>("#roleIn"); if (inp) setRole(inp.value); box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    if (v === "finder") { close(); openFinder(); return; }
    if (v.startsWith("cand:")) setActive(v.slice(5));
    else if (v.startsWith("del:")) { try { doc.extras = withoutCandidate(doc.extras, curRole(), v.slice(4)); renderTitle(); } catch (err) { showError((err as Error).message); } }
    else if (v.startsWith("find:")) { findBankFile(v.slice(5)); return; }
    else if (v === "sf2:pick") { pickFile(); return; }
    else if (v.startsWith("sound:")) { void pickOfficial(v.slice(6)); return; }
    else if (v === "sf2:add") { void addPicked(); return; }
    else if (v === "sf2:embed") { if (over) finishAdd(over, true); return; }
    else if (v === "sf2:weak") { if (over) finishAdd(over, false); return; }
    else if (v === "sf2:cancel") { picked = null; over = null; }
    else if (v.startsWith("hum:")) update(setHum(st, v.slice(4) as Hum));
    else if (v === "hide") { const id = curPart().id; setPv(id, { hidden: !pv(id).hidden }); afterViewChange(); }
    else if (v === "only") { const id = curPart().id; setPv(id, { only: !pv(id).only }); afterViewChange(); }
    else if (v === "mute") { setPv(curPart().id, { muted: !pv(curPart().id).muted }); view.render(); }
    else if (v === "solo") { setPv(curPart().id, { solo: !pv(curPart().id).solo }); view.render(); }
    else if (v.startsWith("clef:")) { update(setPartClef(st, curPart().id, v.slice(5) as Clef)); }
    else if (v.startsWith("staves:")) { update(setPartStaves(st, curPart().id, v.slice(7) === "2" ? 2 : 1)); pad.render(); }
    else if (v === "addpart") { close(); addNewPart(); return; }
    else if (v === "droptrack") { close(); update(removeTrack(st, st.at.paper, curPart().id)); return; }
    else if (v === "delpart") {
      close();
      const me = curPart();
      void askSheet(`删掉声部「${roleName(doc.extras, me.role)}」？`, "整首歌里它写的东西都没了（没有撤销），休息室里它的角色也一起删。", "删").then((ok) => { if (!ok) return; update(removePart(st, me.id)); doc.extras = withoutRole(doc.extras, me.role); renderTitle(); view.render(); });
      return;
    }
    else return;
    draw();
  });
}
function loadDoc(song: Song, o: { stem: string; named: boolean; extras: Extras; handle: docFile.FileHandle | null; mtime?: number | null; identifier?: string | null }): void {
  if (impro) toggleImpro();
  doc.stem = o.stem; doc.named = o.named; doc.handle = o.handle; doc.mtime = o.handle ? (o.mtime ?? null) : null; doc.extras = o.extras;
  doc.identifier = o.identifier ?? null; setActiveIdentifier(doc.identifier); coverTouched = false;
  st = { ...initState(song), input: { ...initState(song).input, inputFifths: st.input.inputFifths, inputScale: st.input.inputScale } };   // pad 是独立设备：换歌不换它的「1=」和调式
  doc.saved = { song: st.song, lounge: loungeKey() };
  partView.clear();
  lastRender.clear(); synth.allOff(); gmHeld.clear(); void prepareSynth();
  view.render(); pad.render(); renderTitle();
}
/** 存好了：文件名从此定下来（之后和歌名各管各的；user「之后各管各的同意」）。 */
function markSaved(): void { doc.stem = docName(); doc.named = true; doc.saved = { song: st.song, lounge: loungeKey() }; renderTitle(); }
/** 改过没存时先问一句（应用内面板，不用系统弹窗）。 */
function confirmDiscard(what: string): Promise<boolean> {
  if (!dirty()) return Promise.resolve(true);
  return new Promise((resolve) => {
    closeOffer?.();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">「${esc(docName())}」改过还没存</div><div class="offer-msg">${what}会丢掉这些改动。</div>` +
      `<div class="offer-btns"><button class="btn" data-v="save">先存</button><button class="btn" data-v="go">丢掉，继续</button><button class="btn primary" data-v="no">算了</button></div></div>`;
    document.body.append(box);
    const close = (ok: boolean) => { box.remove(); closeOffer = null; resolve(ok); };
    closeOffer = () => close(false);
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
    loadDoc(o.song, { stem: o.stem, named: true, extras: o.extras, handle: own ? picked.handle : null, mtime: own ? picked.mtime : null });
    if (o.notices.length) showError(o.notices.join(" "));
    else info(`打开了 ${picked.name}`);
  } catch (e) { showError(`打不开 ${picked.name}：${(e as Error).message}`); }
}
/** 封面的腰封 = 作者栏第一行（每次存重写，withPngText 先删旧块）；没有封面图就没有封面 entry。 */
const extrasForSave = (): Extras => (doc.extras.thumbnail ? withThumbnail(doc.extras, coverWithBlurb(doc.extras.thumbnail, (st.song.credits ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? null)) : doc.extras);
const bytesNow = () => saveMxl({ song: st.song, hum: st.song.hum, extras: extrasForSave(), app: APP_VERSION, date: new Date().toISOString() });
const mxlFile = (name: string) => new File([bytesNow() as unknown as BlobPart], name, { type: "application/vnd.recordare.musicxml" });
const stemOf = (name: string) => name.replace(/\.(mxl|musicxml|xml)$/i, "");
const sizeText = (n: number) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(1)} MB`);
/** 存 = 回家，一个动作（WeebPaint 一画一家；user 2026-08-25 grill「保存按钮=回家（单一动作），导出 hub=寄明信片」）：
 *  · 有家（打开的那个文件）= 存回去。写之前对一次 mtime，文件在外面被改过就先问（0819 spec §7「原位写回前查 lastModified」）。
 *  · 还没有家 = 安家：桌面 Chromium 先开系统保存框（在手势里；取消 = 到此为止，不降级弹下载——「AbortError ≠ 环境不支持」），再编码、写、认领句柄。
 *  · iPad / Safari 没有句柄这回事 = 下载或分享一个 .mxl 到「文件」里，点了才算存了。这台设备上下载就是存（没有别的家可回；
 *    WeebPaint 的「下载不清 dirty」是因为它 iPad 的家在图库——这里没有，「•」留着只会狼来了，0819 §7.2「有真正会丢的字节才拦」）。 */
async function fileSave(): Promise<void> {
  try {
    if (doc.identifier) {   // 歌库里的歌：存 = 立刻落盘 + 推云（用户显式按的 save 不脏也动，时间戳要走字）
      await es.forceSaveAndPush(); renderTitle();
      info(es.isPushPending() ? (auth.isSignedIn() ? "存好了（这台设备上；云端稍后再推）" : "存好了（这台设备上；没登录，不上云）") : "存好了，云端也更新了");
      return;
    }
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
 *  一份带时刻戳的拷贝，家不变、「•」不变（导出永不清 dirty）。桌面 = 系统保存框；iPad = 下载 / 分享。 */
async function exportCopyMxl(): Promise<void> {
  const name = `${stampedCopy(docName())}.mxl`;
  try {
    if (docFile.canPickSave()) {
      const h = await docFile.pickSave(name); if (!h) return;
      await docFile.writeTo(h, bytesNow()); info(`存了一份：${h.name}`); return;
    }
    const file = mxlFile(name);
    offerFile(file, "存一份 .mxl 副本", `${esc(file.name)} · ${sizeText(file.size)}。现在这首歌的一份拷贝；这里再改，它不会跟着变。`);
  } catch (e) { showError(`没存上：${(e as Error).message}`); }
}
/** 导出 hub（照 WeebPaint「导出与另存」hub：导出 = 寄明信片，和「存 = 回家」分开住）：歌声 mp3 / .mxl 副本；乐谱 PDF 以后也进这里。 */
function openExportHub(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">导出</div>` +
    `<div class="set-row file-row">` +
    `<button class="btn" data-v="mp3" title="月读唱一遍，编成 mp3，分享或下载"><svg class="ico"><use href="#export"/></svg>歌声（mp3）…</button>` +
    `<button class="btn" data-v="mxl" title="现在这首歌的一份拷贝（文件名带时刻）；这里的歌还住原来的家"><svg class="ico"><use href="#save-as"/></svg>存一份 .mxl 副本…</button></div>` +
    `<div class="offer-msg">导出 = 寄一份出去，这里的歌还是原来那个家，「存」才是存回去。乐谱 PDF 以后也在这里。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    close();
    if (v === "mp3") void exportSong(); else if (v === "mxl") void exportCopyMxl();
  });
}
/** 文件菜单（应用内面板）：新建 / 歌库 / 打开本机文件 / 存 / 导出 / 封面；还没有家的（没存过、或 iPad 无地）多一个「改文件名」。
 *  没有「另存为」（它住导出里，user 2026-08-20「open local file 和 save as 一加多了很多会混淆用户的东西」）；
 *  本地文件的不给改文件名——浏览器改不了磁盘上的名字（v0.3.0 撤）；歌库里的改名走 store（tryMove，撞名不覆盖）。 */
function openFileMenu(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  const inStore = doc.identifier != null;
  const where = inStore ? `在歌库里，自动存（改了 2 秒内落到这台设备；${auth.isSignedIn() ? "登录着，稍后推上 OneDrive" : "没登录，不上云"}）。「存」= 立刻存 + 推。`
    : doc.handle ? `现在存在 <b>${esc(doc.handle.name)}</b>，「存」= 存回去（文件在外面被改过会先问）。要换名字，在文件管理器里改。`
    : docFile.canPickSave() ? "还没存过：「存」会问存到哪。" : "这台设备上「存」= 下载或分享一个 .mxl 到「文件」里（下载了就算存了）。";
  const thumb = doc.extras.thumbnail;
  const coverUrl = thumb ? URL.createObjectURL(new Blob([thumb as unknown as BlobPart], { type: "image/png" })) : null;
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">文件</div>` +
    `<div class="offer-msg">文件名：<b>${esc(doc.handle ? doc.handle.name : `${docName()}${SONG_SUFFIX}`)}</b>（没存过 = 年月日-歌名；存过之后和纸上的歌名各管各的）</div>` +
    `<div class="set-row file-row">` +
    `<button class="btn" data-v="new"><svg class="ico"><use href="#new"/></svg>新建</button>` +
    `<button class="btn" data-v="lib"><svg class="ico"><use href="#folder"/></svg>歌库…</button>` +
    `<button class="btn" data-v="open"><svg class="ico"><use href="#folder-open"/></svg>打开本机文件…</button>` +
    `<button class="btn" data-v="save"><svg class="ico"><use href="#floppy-disk"/></svg>存</button>` +
    `<button class="btn" data-v="export"><svg class="ico"><use href="#export"/></svg>导出…</button>` +
    (hasStore() && !inStore ? `<button class="btn" data-v="intoLib" title="把这首歌放进歌库（这台设备上留一份；登录后同步到 OneDrive）"><svg class="ico"><use href="#import"/></svg>存进歌库</button>` : "") +
    (doc.handle ? "" : `<button class="btn" data-v="rename">改文件名…</button>`) + `</div>` +
    `<div class="set-row cover-row"><span class="cover-thumb">${coverUrl ? `<img src="${coverUrl}" alt="封面" />` : `<span class="cover-none">没有封面图</span>`}</span>` +
    `<label class="btn" title="选一张图当封面（缩成 256² 存进歌里；歌库卡片上歌名印在图上面）"><svg class="ico"><use href="#image"/></svg>封面图…<input id="coverIn" type="file" accept="image/*" hidden /></label>` +
    (thumb ? `<button class="btn" data-v="coverOff">去掉封面图</button>` : "") + `</div>` +
    `<div class="offer-msg">存成 <code>.mxl</code>（MusicXML 乐谱的压缩包：别的乐谱软件也能打开；MoonSinger 自己的东西放在里面的 <code>.moonsinger/</code>）。${where} 把 .mxl 拖进来也能打开。</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); closeOffer = null; if (coverUrl) URL.revokeObjectURL(coverUrl); scoreEl.focus(); };
  closeOffer = close;
  box.querySelector<HTMLInputElement>("#coverIn")!.addEventListener("change", (e) => { const f = (e.target as HTMLInputElement).files?.[0]; close(); if (f) void setCover(f); });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    close();
    if (v === "new") void fileNew(); else if (v === "lib") void openGallery(); else if (v === "open") void fileOpen(); else if (v === "save") void fileSave(); else if (v === "export") openExportHub();
    else if (v === "rename") void renameActive(); else if (v === "intoLib") void saveIntoGallery(); else if (v === "coverOff") { doc.extras = withThumbnail(doc.extras, null); coverTouched = true; coverRev++; renderTitle(); changed(); info("去掉了封面图"); }
  });
}
$("fileBtn").addEventListener("click", () => openFileMenu());
/** 改文件名（只给还没有家的：下次存 / 下载用这个名字；纸上的歌名不变；user「之后各管各的同意，但是要有改文件名的规则？」）。
 *  有家的不进这里（菜单不露）：浏览器改不了磁盘上的名字，在文件管理器里改。 */
function renameFile(): void {
  if (doc.handle) return;
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">改文件名</div>` +
    `<label class="set-field">文件名<input id="fnIn" type="text" spellcheck="false" autocomplete="off" value="${esc(docName())}" /></label>` +
    `<div class="offer-msg">只改文件名，纸上的歌名不变。下次存的时候用这个名字。</div>` +
    `<div class="offer-btns"><button class="btn" data-v="cancel">算了</button><button class="btn primary" data-v="ok">改</button></div></div>`;
  document.body.append(box);
  const inp = box.querySelector<HTMLInputElement>("#fnIn")!;
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  const ok = () => { const v = fileSafe(inp.value); if (v && v !== docName()) { doc.stem = v; doc.named = true; renderTitle(); info(`文件名改成 ${v}.mxl`); } close(); };
  closeOffer = close;
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
    closeOffer?.();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">${esc(title)}</div><div class="offer-msg">${esc(msg)}</div>` +
      `<div class="offer-btns"><button class="btn" data-v="ok">${esc(okLabel)}</button><button class="btn primary" data-v="no">算了</button></div></div>`;
    document.body.append(box);
    const close = (ok: boolean) => { box.remove(); closeOffer = null; scoreEl.focus(); resolve(ok); };
    closeOffer = () => close(false);
    box.addEventListener("click", (e) => {
      const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
      if (e.target === box || v === "no") close(false); else if (v === "ok") close(true);
    });
  });
}
// 改过没存就关页面 / 刷新：浏览器自己的挽留框（照 WeebPaint；无地不偷偷写盘——静默写用户文件违背文件语义）
window.addEventListener("beforeunload", (e) => { if (dirty() && !navigatingForAuth) { e.preventDefault(); e.returnValue = ""; } });
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
//   节律（user 2026-10-08「「•」和「存」对齐 WXHW」；常量在 src/config.ts）：改了 2 s 自动落本地（「•」= 还没落）；15 s 没再改 / 失焦 / 换歌 / 退出 → 推云；30 s 心跳补推没上云的；
//   「存」= 立刻落盘 + 推（不脏也动）。冲突 / 报错 / busy 在建 store 时就接好线（src/store-ui.ts；test/store-wiring.test.mjs 守着）。
const KV_LAST_DOC = "last-doc";
let gallery: GalleryHost | null = null;
let pendingOpenId: string | null = null;   // es.open(id) 进行中的那个身份（adapter.adopt 收字节时要知道是谁的）
let encodedSnap: { song: Song; lounge: string } | null = null;   // encode 那一刻的快照：落盘成功才把它记成「已存」（快照之后的改动继续算脏）
let coverTouched = false;   // 这次打开里换过封面 → 落盘后让歌库丢掉旧缩略图
const es = createEditorSession({
  store: { file: (name, o) => requireStore().zip(name, { mode: o.mode }) },   // store 0.16.1：zip 种类走 store.zip（有 getPeek）；isZip 由种类表说了算
  editor: {
    adopt: async (blob) => { const id = pendingOpenId ?? doc.identifier; if (!id) throw new Error("adopt without an identifier"); adoptStoreBytes(id, new Uint8Array(await blob.arrayBuffer())); },
    onChange: () => { /* 内容变化走 changed()（update() + 1 s 心跳）→ es.markDirty() */ },
    encode: async () => { encodedSnap = { song: st.song, lounge: loungeKey() }; return { bytes: new Blob([bytesNow() as unknown as BlobPart], { type: "application/vnd.recordare.musicxml" }) }; },
    onSaved: (name) => { if (encodedSnap) { doc.saved = encodedSnap; encodedSnap = null; } if (coverTouched) { coverTouched = false; gallery?.invalidateThumb(name); } renderTitle(); },
  },
  isZip: true,
  policy: { autosaveMs: LOCAL_SAVE_DEBOUNCE_MS, pushOn: ["exit", "blur", "idle"], idleMs: PUSH_DEBOUNCE_MS },
});
/** 内容变了（谱 / 休息室 / 麦克风 / 封面）→ 歌库里的歌告诉 editor-session（autosave 节律）。幂等；1 s 心跳兜底没经过 update() 的改动（休息室 / 录音室直接改 doc.extras 的那些）。 */
function changed(): void { if (doc.identifier && dirty()) es.markDirty(); }
es.start();   // autosave 定时器 + 页面隐藏 / pagehide 落盘 + 失焦推云（editor-session 的通用触发点；不调就没有自动存）
setInterval(() => { changed(); if (doc.identifier) renderTitle(); }, 1000);
setInterval(() => { if (doc.identifier && es.isPushPending() && auth.isSignedIn() && navigator.onLine) void es.flushAndPush().catch((e) => reportError(e, "warning")); }, PUSH_HEARTBEAT_MS);
/** store 字节 → 编辑器（es.open 与 takeCloud 重载共用的装入段）。 */
function adoptStoreBytes(id: string, bytes: Uint8Array): void {
  const o = openBytes(id, bytes);
  loadDoc(o.song, { stem: identifiers.parse(id)?.stem ?? o.stem, named: true, extras: o.extras, handle: null, identifier: id });
  deviceKvSet(KV_LAST_DOC, id);
  if (o.notices.length) showError(o.notices.join(" "));
}
const stemOfId = (id: string) => identifiers.parse(id)?.stem ?? id;
/** 离开现在这首：歌库里的 = 先落盘 + 推（不问，自动存的东西没什么可丢）；无地的 = 改过没存先问。 */
async function leaveCurrent(what: string): Promise<boolean> {
  if (doc.identifier) { try { await es.flushAndPush(); } catch (e) { reportError(e, "warning"); } return true; }
  return confirmDiscard(what);
}
/** 打开歌库里的一首。false = 没切过去（本地没字节 / 读不了 / 用户不走）。 */
async function openStoreDoc(id: string): Promise<boolean> {
  if (doc.identifier !== id && !doc.identifier && !(await confirmDiscard(`打开「${stemOfId(id)}」`))) return false;
  pendingOpenId = id;
  try {
    const ok = await es.open(id);   // 切歌前 es 自己先存旧的（退出语义）；open 里含新鲜度检查 / 冲突面 / 崩溃恢复（store 的 ui）
    if (!ok) { showError(`打不开「${stemOfId(id)}」：这台设备上没有它的字节（离线、或还没从云端拉下来）`); return false; }
    diagNote("doc", `open ${id}`);
    return true;
  } catch (e) { reportError(e); return false; }
  finally { pendingOpenId = null; }
}
/** 在歌库里新建一首（空谱）并切过去；首存 mode:"new"（撞名不覆盖）→ 身份从此存在、歌库里能看见。 */
async function newStoreSong(): Promise<void> {
  attachForUser();
  if (!(await leaveCurrent("新建"))) return;
  const store = requireStore(), folder = gallery?.currentFolder() ?? "";
  let id = identifiers.join({ folder, stem: defaultStem(), suffix: SONG_SUFFIX });
  for (let n = 0; n < 50 && (await store.files.occupied(id)); n++) id = identifiers.join({ folder, stem: defaultStem(), suffix: SONG_SUFFIX });
  loadDoc(initState().song, { stem: stemOfId(id), named: true, extras: emptyExtras(), handle: null, identifier: id });
  es.adopted(id, { create: true });
  try { await es.flushLocal(); deviceKvSet(KV_LAST_DOC, id); info("新的一首（在歌库里）"); }
  catch (e) { reportError(e); }
}
/** 把手里这首无地的歌放进歌库（文件名沿用；撞名加序号）。 */
async function saveIntoGallery(): Promise<void> {
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
  auth.onAuthChanged((s) => { gallery?.renderCloud(); renderTitle(); if (s.signedIn) void afterSignIn(); });
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
    newSong: async () => { await newStoreSong(); if (doc.identifier) gallery!.close(); },
    openSettings: () => openSettings(),
    openCloudMenu: () => { void openCloudMenu(); },
    onOpened: () => { closeOffer?.(); closeFinder(); closeStudio(); padWas = !padEl.hidden; showPad(false); },
    onClosed: () => { void afterGalleryClosed(); showPad(padWas); scoreEl.focus(); },
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
async function openGallery(): Promise<void> {
  attachForUser();
  await gallery!.open();
}
$("libBtn").addEventListener("click", () => { void openGallery(); });
async function openCloudMenu(): Promise<void> {
  const signed = auth.isSignedIn();
  let who = ""; try { const a = auth.getActiveAccount() as { username?: string; name?: string } | null; who = a?.name || a?.username || ""; } catch { /* 没登录 */ }
  const v = await openChoiceSheet<"in" | "out" | "refresh" | "pushAll">("云端（OneDrive）",
    signed ? `已登录${who ? ` ${who}` : ""}。歌库同步到 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹，看不到你别的文件）。` : "登录微软个人账号后，歌库同步到 OneDrive 的「应用」文件夹（这个 app 只能看自己的那个夹，看不到你别的文件）。不登录也能用，歌只在这台设备上。",
    signed ? [{ label: "刷新云端", value: "refresh" }, { label: "把没上云的都推上去", value: "pushAll" }, { label: "退出登录", value: "out", danger: true, hint: "歌还留在这台设备上" }] : [{ label: "登录微软账号", value: "in", primary: true }]);
  if (v === "in") await signInFlow();
  else if (v === "out") { try { await auth.signOut(); info("退出了（歌还在这台设备上）"); } catch (e) { reportError(e); } gallery?.renderCloud(); renderTitle(); }
  else if (v === "refresh") gallery?.refresh();
  else if (v === "pushAll") await pushDirtyAll({ verbose: true });
}
/** 登录 = 页面跳去微软再跳回来（redirect；iPad PWA 弹窗不可靠）：先把手里的歌落盘，再在一个点击里**同步**起跳（WeebPaint / WXHW 的两步法；onPick 站在用户手势里）。 */
let navigatingForAuth = false;
async function signInFlow(): Promise<void> {
  if (doc.identifier) { try { await es.flushLocal(); } catch (e) { reportError(e, "warning"); } }
  await openChoiceSheet("去微软登录", `页面会跳到微软的登录页（只认个人账号），登录完自动回到这里。${doc.identifier ? "手里的歌已经存在这台设备上了。" : dirty() ? "手里这首无地的歌改过还没存——跳走会丢，先存一下再来。" : ""}`,
    [{ label: "去登录", value: "go", primary: true, onPick: () => { navigatingForAuth = true; void requestStoragePersistence(); diagNote("auth", "signIn redirect"); auth.signIn({ prompt: "select_account" }).catch((e) => { navigatingForAuth = false; reportError(e); }); } }]);
}
/** 回前台 / 回线：干净的歌快进到云端的新版本（另一台设备改过的）；本地脏 / 没上云 = 不动（之后 push 的 412 会 surface 真分叉）。 */
let refreshing = false;
async function refreshOpenDoc(): Promise<void> {
  const id = doc.identifier;
  if (!id || refreshing || !hasStore() || !auth.isSignedIn() || !navigator.onLine || dirty() || es.isPushPending()) return;
  refreshing = true;
  try {
    const r = await requireStore().zip(id, { mode: "existing" }).pullIfClean({ localDirty: () => dirty() || es.isPushPending(), onReplaceStart: () => info("云端有新版本，正在拉…") });
    if (r?.status === "fast-forwarded" && doc.identifier === id) {
      // 本地字节已换成云端版本（刚 markSynced）→ 内存里的是旧世界线，必须整体重载（同名 es.open = openInto 管线；不重载 = 下次自动存把旧版写回云端，WeebPaint 2026-08-25 案卷）
      pendingOpenId = id;
      const ok = await es.open(id).finally(() => { pendingOpenId = null; });
      if (ok) info("换成云端的新版本了"); else showError(`「${stemOfId(id)}」云端的新版本拉下来了，但重开失败——请从歌库再打开一次`);
    } else if (r?.status === "ff-failed" || r?.status === "cloud-error") reportError(r.error ?? new Error(`refresh ${r.status}: ${r.reason ?? ""}`), "warning");
  } catch (e) { reportError(e, "warning"); }
  finally { refreshing = false; }
}
/** 登录过期 / 回线：没登录着就静默再试一次（不弹任何东西）。 */
function retrySilent(): void { if (hasStore() && authStarted && !auth.isSignedIn() && auth.isAuthConfigured()) void auth.retrySilentSignIn().catch((e) => reportError(e, "log")); }
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
    doc.extras = withThumbnail(doc.extras, png); coverTouched = true; coverRev++; renderTitle(); changed();
    info(`封面图换好了（${sizeText(png.length)}）`);
  } catch (e) { showError(`这张图用不了：${(e as Error).message}`); }
}
window.addEventListener("online", () => { if (!hasStore()) return; if (auth.isSignedIn()) void afterSignIn(); else retrySilent(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible" || !hasStore()) return; if (auth.isSignedIn()) void refreshOpenDoc(); else retrySilent(); });

// ── 键盘：映射是一张表（src/input/keys.ts）；这里只算「键盘现在归谁」，再照路由的结果做 ─────────────
/** 谁在最上面归谁：导出面板 > 记号框 > 歌词框 > 谱面（弹 / 改 / 写）。 */
function whereNow(): Where {
  if (closeOffer || isSheetOpen() || isGateOpen()) return "sheet";
  if (view.marks.open) return "mark";
  if (view.lyrics.open) return "lyric";
  return impro ? "impro" : st.sel ? "edit" : "write";
}
/** 照做；返回 false = 这一下其实不归我们管（例如歌词框里「-」不跟在字母后面），让浏览器照常打字。 */
function run(a: Action, repeat: boolean, code: string): boolean {
  switch (a.k) {
    case "cmd":
      if (a.cmd.k === "degree") {
        if (!repeat && monoAccept(`key${code}`)) { const c = a.cmd, i = writeAndLocate((s) => apply(s, c, performance.now())); keyTok(st, i, code); afterWrite(); }   // 先写再取 st（写完才有这个音）
        return true;
      }
      update(apply(st, a.cmd, performance.now()));
      if (a.cmd.k === "rest" || a.cmd.k === "extend") afterWrite();
      return true;
    case "audition": {   // 弹：在草稿状态上写一下，拿到那个音高就扔
      if (repeat) return true;
      const probe = apply({ ...st, sel: null, log: [] }, { k: "degree", degree: a.degree, dir: a.dir }, performance.now());
      keyTok(probe, probe.caret - 1, code);
      if (probe.input !== st.input) update({ ...st, input: probe.input });   // 「只管下一个音」的 ♯ / ♭ 用掉了
      return true;
    }
    case "play": void togglePlay(); return true;
    case "impro": toggleImpro(); return true;
    case "lyric": return view.lyrics.act(a.a);
    case "mark": view.marks.act(a.a); return true;
    case "sheet": closeOffer?.(); closeSheet(); return true;
    case "file": if (a.a === "open") void fileOpen(); else if (a.a === "save") void fileSave(); else openExportHub(); return true;
  }
}
window.addEventListener("keydown", (e) => {
  if (gallery?.isOpen()) { if (e.key === "Escape" && !isSheetOpen() && !isGateOpen()) { e.preventDefault(); gallery.close(); } return; }   // 歌库开着：键盘归它（Esc 回谱）
  if (finder.isOpen) { if (e.key === "Escape") { e.preventDefault(); closeFinder(); } return; }   // 找人视图开着：只认 Esc（pad 的触屏键照常）
  if (studio.isOpen) { if (e.key === "Escape") { e.preventDefault(); closeStudio(); } else if (e.key === " " && !(e.target as HTMLElement)?.closest("input")) { e.preventDefault(); void togglePlay(); } return; }   // 录音室：Esc 回谱、空格播放
  // 别的表单控件（顶栏的下拉框）拿着焦点：不接，它们自己吃方向键 / 空格。歌词框、记号框的输入框照常路由。
  const t = e.target as HTMLElement | null;
  if (!(e.ctrlKey || e.metaKey) && t && (t.tagName === "SELECT" || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !t.closest(".lyric-input, .mark-ed")))) return;
  const a = route(e, whereNow(), st.sel ? "edit" : "write");
  if (a && run(a, e.repeat, e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { monoHeld.delete(`key${e.code}`); if (isSoundKey(e)) { sound.up(`key${e.code}`); pad.showUp(`key${e.code}`); } });   // 复音：只停这个键的
// 切走 app / 失焦：抬手的事件可能收不到，全部停掉（同 WeebPaint 的 pointer 自愈）
window.addEventListener("blur", () => { sampler.upAll(); pad.clearHeld(); monoHeld.clear(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { sampler.upAll(); pad.clearHeld(); monoHeld.clear(); } });

await document.fonts.load(`40px Bravura`).catch(() => undefined);
view.render();
pad.render();
renderTitle();
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
setTimeout(() => { void sampler.load().catch((e) => showError(`试听元音表没下载下来：${(e as Error).message}`)); }, 300);
