// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 键盘。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 第一版（grill 账本 §8½）：不做撤销；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。
// 存档 = 无地逃生口（2026-10-07，user「先不急着store。可以先按照无地规范导入导出做逃生口」）：文件菜单 新建 / 打开 / 存 / 另存为 .mxl
//   （格式 = src/format/，数据契约草稿 ai-docs/20261007-data-contract-draft.md）；没存就关页面 = 浏览器挽留框（照 WeebPaint，不偷偷写盘）。
// UX-2（账本 §9¾）：选中 = 改、光标 = 写；歌词在谱下面点进去写（底部歌词栏拿掉了）；「弹」= 即兴只唱不写。
// 调号 / 拍号 / 速度是谱里的记号 token，点谱上的记号就地改，pad「＋」在光标处插——顶栏不再有全局的调号 / 拍号 / 速度。

import { APP_VERSION } from "../version.ts";
import { initPwaShell } from "./pwa-shell.ts";
import { type EditorState, type Hum, type MarkVal, type Song, initState, writePitch, soundingPitch, writeMark, setHum, setPaper, setTuplet, setInputKey, setInputScale, setUnit, setNote, effectivePitch, timeline, keyAt, timeAt, tempoAt, TPQ } from "../score/song.ts";
import { type Pitch, midiOf, alterBy } from "../score/pitch.ts";
import { apply } from "../score/commands.ts";
import { type Action, type Where, route, isSoundKey } from "../input/keys.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { ScoreView } from "../ui/score-view.ts";
import { installPlatformGuards } from "../ui/platform-guards.ts";
import { Pad } from "../ui/pad.ts";
import { toLabScore, type SingLang } from "../score/lab-score.ts";
import { Singer, type SingResult } from "../singer/client.ts";
import { encodeMp3 } from "../export/mp3.ts";
import { createPackStore } from "@internal/model-packs";
import { showNotice, configureFloors } from "@internal/workbench-elements";
import { PACKS, CREDIT } from "../singer/packs.gen.ts";
import { Sampler } from "../singer/sampler.ts";
import { saveMxl, openBytes, emptyExtras, type Extras, type Quality } from "../format/project.ts";
import { type PaperKind, PAPER_KINDS, PAPER_NOTE, DEFAULT_PAPER, paperOf, paperSizeText } from "../score/paper.ts";
import * as docFile from "./doc-file.ts";
import { defaultStem, fileSafe } from "./names.ts";

let st: EditorState = initState();
/** 这首歌的家（无地逃生口）：文件名主干（新建 = 默认名；打开 = 那个文件的名字）、打开的那个文件（桌面 Chromium）、
 *  文件里这一版不改动的部分、上次存 / 打开时的样子（判断改过没存）。歌名在谱里（st.song.title，可不填），和文件名分开。 */
const doc = { stem: defaultStem(), named: false, handle: null as docFile.FileHandle | null, extras: emptyExtras() as Extras,
  saved: { song: st.song as Song, quality: "full" as Quality } };
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
  `<div class="tb-left"><button id="fileBtn" class="btn tb-file" title="文件：新建 / 打开 / 存 / 另存为 / 改文件名 / 导出歌声（Ctrl / ⌘+S 存）"><svg class="ico"><use href="#file"/></svg><span id="docTitle" class="title">未命名</span></button></div>` +
  `<div class="tb-mid"><button id="playBtn" class="btn" title="月读唱 / 停（空格）"><svg class="ico"><use href="#play"/></svg></button>` +
  `<button id="improBtn" class="btn" title="弹：音符只唱不写（\`）">弹</button><span id="singStatus" class="sing-st"></span></div>` +
  `<div class="tb-right"><button id="padBtn" class="btn is-on" title="键盘（pad）"><svg class="ico"><use href="#grid"/></svg></button>` +
  `<button id="setBtn" class="btn" title="设置：模型来源、导入模型包、月读的署名与使用条款、版本"><svg class="ico"><use href="#wrench"/></svg></button></div>`;
configureFloors({ toolbarBottom: () => bar.getBoundingClientRect().bottom });

// ── 试听：月读的元音采样器（出一个音就响；只唱「哼」那一个字，不看歌词——user「还是单一元音更适合当blueprint」） ─────
const sampler = new Sampler();
const sound = {
  down: (p: Pitch, id = "main") => sampler.down(midiOf(p), st.song.hum, id),
  up: (id = "main") => sampler.up(id),
};
/** 唱下标 i 的音；id = 声音的来源（哪根手指 / 哪个键 / 谱面），复音：不同来源同时响，同一来源新的顶掉旧的。 */
const soundTok = (s: EditorState, i: number, id = "main") => { const t = s.song.tokens[i]; if (t?.kind === "note" && t.pitch) sound.down(t.pitch, id); };
/** 电脑键盘按下一个音：响 + pad 上那个音高的键亮着（和手指按 pad 一样，松开键才灭）。 */
const keyTok = (s: EditorState, i: number, code: string) => { const t = s.song.tokens[i]; soundTok(s, i, `key${code}`); if (t?.kind === "note" && t.pitch) pad.showDown(t.pitch, `key${code}`); };
/** 写一个音（写 = 光标前那个新音；改 = 被覆盖的那个音 = 旧选中里的第一个音），返回刚写的下标（试听用）。 */
function writeAndLocate(write: (s: EditorState) => EditorState): number {
  let target = -1;
  if (st.sel) for (let k = st.sel.from; k < st.sel.to; k++) if (st.song.tokens[k].kind === "note") { target = k; break; }
  update(write(st));
  return target >= 0 ? target : st.caret - 1;
}

let upTimer = 0;   // 点一下响 350 ms 的那个停；新的一下先取消旧的（不然会掐掉新音）
const view = new ScoreView(scoreEl, {
  get: () => st,
  set: (n) => update(n),
  audition: (i, hold) => { clearTimeout(upTimer); soundTok(st, i, "score"); if (!hold) upTimer = window.setTimeout(() => sound.up("score"), 350); },
  glide: (i) => { clearTimeout(upTimer); const t = st.song.tokens[i]; if (t?.kind === "note" && t.pitch) sampler.glide(midiOf(t.pitch), st.song.hum, "score"); },
  release: () => { clearTimeout(upTimer); sound.up("score"); },
  focus: (where) => showPad(where === "staff"),   // 纸宽固定以后，横屏收起旁边的 pad 也不会让谱重排（user「固定行宽之后横屏的键盘也可以开关了吧」）
  autoBars: () => autoBars,
  part: () => ({ name: quality() === "none" ? "未选角" : "月读", empty: quality() === "none" }),
  onPart: () => openPartSheet(),
  onPaper: () => openPaperSheet(),
  reflow: () => reflow,
});
let impro = false;
/** 按拍号自动画小节线（默认开；这次打开里有效）。user「自动加小节也是可以toggle的，默认开」 */
let autoBars = true;
/** 屏幕放不下纸的时候折不折行（默认不折行 = 整张纸按比例缩小；这次打开里有效，不进文件——怎么看，不是谱的内容）。 */
let reflow = false;   // 「弹」（顶栏开关；2026-10-07 user「弹应该放在顶栏」）：音符只唱不写
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
  isImpro: () => impro,
  accept: (id) => monoAccept(id),
  onPitch: (p, id) => {
    const i = writeAndLocate((s) => writePitch(s, p)), t = st.song.tokens[i];
    padNotes.set(id, { index: i, base: t?.kind === "note" && t.pitch ? t.pitch : p });
  },
  onAlter: (id, alt) => {   // 临时离调：只管这一个音（滑回中间 = 还原）；重新唱一下让人听见
    const n = padNotes.get(id); if (!n) return;
    const np = alt ? alterBy(n.base, alt) : n.base;
    if (n.index >= 0) update(setNote(st, n.index, { pitch: np }));
    sound.down(np, id);
  },
  onCommand: (c) => update(apply(st, c, performance.now())),
  onUnit: (u) => update(setUnit(st, u)),
  onTuplet: (n) => update(setTuplet(st, n)),
  onInputKey: (f) => update(setInputKey(st, f)),
  onInputScale: (id) => update(setInputScale(st, id)),
  autoBars: () => autoBars,
  onAutoBars: (on) => { autoBars = on; view.render(); pad.render(); },
  onHide: () => showPad(false),
  onInsertMark: (kind) => {   // 默认值 = 光标处正生效的那个（没改就收起 = 撤掉这次插入）
    const at = st.sel ? st.sel.from : st.caret;
    const v: MarkVal = kind === "key" ? { kind, fifths: keyAt(st.song, at) } : kind === "time" ? { kind, ...timeAt(st.song, at) } : { kind, bpm: tempoAt(st.song, at) };
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
  st = next;
  view.render();
  pad.render();
  renderTitle();
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
/** 歌词里有汉字、没有假名 → 按中文唱；其余（含没有歌词）按日语唱。 */
function songLang(): SingLang {
  const ls = st.song.tokens.flatMap((t) => (t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : [])).join("");
  // 英文：歌词里有拉丁字母、没有假名也没有汉字（user「好吧英文先做完」）；中英日混着的歌第一版按日 / 中唱
  if (/[A-Za-z]/.test(ls) && !/[\p{Script=Han}぀-ヿ]/u.test(ls)) return "en";
  // 整首没写歌词时，哼「啦」「呜」用中文唱（日语 ら 是轻弹舌、う 不圆唇；user「呜还是啊，拉也不行」）
  if (!ls && (st.song.hum === "la" || st.song.hum === "u")) return "zh";
  return /\p{Script=Han}/u.test(ls) && !/[぀-ヿ]/.test(ls) ? "zh" : "ja";
}
/** 整首唱时给核心的哼的参数：ん 闭嘴（N_m）、哼的字辅音至少 70 ms（核心默认关，Lab 命令行不受影响）。 */
const humOpt = (): Record<string, unknown> => ({ humNasal: "N_m", humConsMin: 0.07 });
/** 轻量版的音符表（秒）：tie 并成一个长音。 */
function lightNotes(): { midi: number; t0: number; t1: number }[] {
  const notes: { midi: number; t0: number; t1: number }[] = [];
  for (const { index, tok, t0, t1 } of timeline(st.song)) {   // 秒数按速度记号一段一段算好了
    if (tok.kind !== "note") continue;
    const midi = midiOf(effectivePitch(st.song.tokens, index)), last = notes[notes.length - 1];
    if (tok.tie && last && last.midi === midi) { last.t1 = t1; continue; }
    notes.push({ midi, t0, t1 });
  }
  return notes;
}
/** 完整版：同一份谱只算一次（再播 / 导出直接用上次的）。 */
let lastFull: { key: string; r: SingResult } | null = null;
async function singFull(): Promise<SingResult | null> {
  const score = toLabScore(st.song, songLang());
  if (!score.SCORE.length) return null;
  const opt = humOpt(), key = JSON.stringify([score, opt]);
  if (lastFull?.key === key) return lastFull.r;
  const r = await singer.sing(score, (stage) => progress(`${stage}…`), { opt, models: modelBases() });
  lastFull = { key, r };
  return r;
}
/** 轻量版：用元音采样器按乐谱唱（全唱「哼」那个字）。 */
function playLight(who = "轻量版"): void {
  const notes = lightNotes();
  if (!notes.length) { info("还没有音"); return; }
  if (!sampler.ready) { progress("元音表下载中…"); void sampler.load().then(() => playLight(who)); return; }
  const total = sampler.playSong(notes, st.song.hum, () => playIcon(false));
  playIcon(true); progress(`${who} ${total.toFixed(1)} 秒`);
}
async function togglePlay(): Promise<void> {
  if (singer.playing || sampler.songPlaying) { singer.stop(); sampler.stopSong(); playIcon(false); return; }
  if (singing) return;
  singer.unlock();   // 在用户手势里先把声音打开（iPad）
  if (quality() === "none") { noCast("唱"); return; }
  if (quality() === "light") { playLight(); return; }
  singing = true; $("playBtn").classList.add("is-on");
  try {
    const cached = lastFull, r = await singFull();
    if (!r) { info("还没有音"); return; }
    progress(r === cached?.r ? `${(r.samples.length / r.sr).toFixed(1)} 秒` : `${(r.samples.length / r.sr).toFixed(1)} 秒（准备 ${(r.ms.load / 1000).toFixed(1)} s，合成 ${(r.ms.sing / 1000).toFixed(1)} s）`);
    singer.play(r, () => { playIcon(false); });
    playIcon(true);
  } catch (e) {
    // 完整引擎带不起来（内存不够 / 加载失败）→ 不出声、报错，人手动换（user「不是显示自动上，而是就是不出声，报错，人类手动换」）
    showError(`完整版月读唱不出来：${(e as Error).message}。没有出声。要先用元音版，点谱前面的「月读」把音质换成「轻量」再播。`);
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
    let r: { samples: Float32Array; sr: number } | null = null, how = "";
    if (quality() === "none") { noCast("导出"); return; }
    if (quality() === "full") {
      try { r = await singFull(); how = "月读"; }
      catch (e) { showError(`完整版月读唱不出来：${(e as Error).message}。没有导出。要先用元音版导出，点谱前面的「月读」把音质换成「轻量」再导出。`); progress(""); return; }
    } else {
      const notes = lightNotes();
      if (notes.length) { r = await sampler.renderSong(notes, st.song.hum); how = "轻量版"; }
    }
    if (!r) { info("还没有音"); return; }
    progress("编 mp3…");
    const secs = r.samples.length / r.sr, bytes = await encodeMp3(r.samples, r.sr);
    const file = new File([bytes], `${docName()}.mp3`, { type: "audio/mpeg" });
    progress("");
    offerFile(file, "歌声导出好了", `${how}唱 ${secs.toFixed(1)} 秒 · mp3 ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}`);
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
    `<div class="offer-msg">先找这个网站下的 <code>pwa-models/</code>（自己搭服务器的话，把模型仓拷过去就能用），找不到再用这里填的。只在这次打开里有效。</div>` +
    `<div class="set-row"><button class="btn" data-v="default">恢复默认</button>` +
    `<label class="btn" title="选模型包的分片文件（chunk-000 …，名字不重要），或整个包拼成的一个文件"><svg class="ico"><use href="#import"/></svg>从本机文件导入模型包<input id="impIn" type="file" multiple hidden /></label></div>` +
    `<pre id="packSt" class="set-packs">…</pre>` +
    `<details class="set-credit"><summary>月读（つくよみちゃん）的署名与使用条款</summary><pre>${esc(CREDIT.credit)}\n\n${esc(CREDIT.terms)}\n${esc(CREDIT.termsUrl)}\n\n${esc(CREDIT.attribution.join("\n"))}</pre></details>` +
    `<div class="set-row set-app"><span class="set-ver">${APP_VERSION}</span><button class="btn" data-v="check">检查更新</button><button class="btn" data-v="reset" title="卡在旧版本时用：注销本 app 的离线缓存再重开。下好的月读模型包不删">清缓存重启</button></div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const srcIn = box.querySelector<HTMLInputElement>("#srcIn")!, packSt = box.querySelector<HTMLElement>("#packSt")!;
  const refresh = () => { void packStatusText().then((t) => (packSt.textContent = t)); };
  refresh();
  const close = () => { modelSource = srcIn.value.trim() || MODEL_SOURCE_DEFAULT; box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") close();
    else if (v === "default") srcIn.value = MODEL_SOURCE_DEFAULT;
    else if (v === "check") void shell.checkForUpdate().then((r) => { if (r === "found") { close(); showUpdateBar(); } else info(r === "latest" ? "已经是最新版" : "这里没有离线壳（本机开发 / 浏览器不支持），不用更新"); });
    else if (v === "reset") void shell.forceReset();
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
(window as unknown as Record<string, unknown>).__moonsinger = { singer, sampler, exportSong, labScore: () => toLabScore(st.song, songLang()), state: () => st, cssHash: __CSS_HASH__ };   // cssHash：样式表版本（见 scripts/build.sh）

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
let curQuality: Quality = "full";
function quality(): Quality { return curQuality; }
const dirty = () => st.song !== doc.saved.song || quality() !== doc.saved.quality;
function renderTitle(): void {
  const d = dirty(), name = docName();
  $("docTitle").textContent = `${name}${d ? " •" : ""}`;
  $("docTitle").title = d ? "改过还没存" : doc.handle ? `存在 ${doc.handle.name}` : "";
  document.title = `${d ? "• " : ""}${name} · MoonSinger`;
}
/** 主唱没人上场（别的软件存的谱，原来的乐器这一版没有）：不出声、报错，人来选（user「不出声，报错，人类手动换」）。 */
function noCast(what: string): void {
  showError(`主唱这个角色还没有人上场（原来的乐器这一版没有），所以没有${what}。要月读来唱，点谱前面的「未选角」选月读。`);
}
/** 音质（= 主唱这个角色上场的是谁、用哪一版）：完整 / 轻量 / 未选角（别的软件存的谱）。改了重画歌手牌。 */
function setQuality(q: Quality): void { curQuality = q; view.render(); renderTitle(); }
/** 纸的设置（纸右上角的小钮点开）：A4 / A5 / A6，整首歌一个；以后插图片也从这里进（user「加图片的入口以后也可以放那里」）。改了立刻生效。 */
function openPaperSheet(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  const draw = () => {
    const p = st.song.paper ?? paperOf(DEFAULT_PAPER);
    box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">纸</div><div class="set-row">` +
      PAPER_KINDS.map((k) => `<button class="btn cand${p.kind === k ? " is-on" : ""}" data-v="${k}">${k}<small>${PAPER_NOTE[k]}</small></button>`).join("") +
      (p.kind === "other" ? `<button class="btn cand is-on" data-v="other">其他<small>${paperSizeText(p)}</small></button>` : "") + `</div>` +
      `<div class="offer-msg">整首歌一张纸。纸越大一行放的小节越多，五线谱的大小不变；屏幕放得下就照纸排。不打印的时候不分页。</div>` +
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
    else if (v === "fit" || v === "reflow") { reflow = v === "reflow"; view.render(); draw(); }
  });
}
/** 歌手牌（第一行谱号左边的声部名）点开：上面选谁来唱（乐器），下面就地改它的设置，改了立刻生效
 *  （user「歌手牌同意，和打谱软件对齐」「应该就是乐器名可以选择一大堆乐器，然后下面可以in place改，大概这样？」）。
 *  现在只有一个声部、乐器只有月读 = 多乐器的占位（以后每个声部一张牌；数据契约「每个声部在谱号前面选角色和麦克风」）。 */
const HUMS: [Hum, string][] = [["n", "ん / 嗯"], ["a", "あ / 啊"], ["o", "お / 哦"], ["u", "う / 呜"], ["la", "ら / 啦"]];
function openPartSheet(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  const chip = (v: string, label: string, on: boolean, title = "") => `<button class="btn cand${on ? " is-on" : ""}" data-v="${v}"${title ? ` title="${title}"` : ""}>${label}</button>`;
  const draw = () => {
    const q = quality(), h = st.song.hum;
    box.innerHTML = `<div class="offer-card settings-card part-card"><div class="offer-title">主唱</div>` +
      `<div class="part-sec">谁来唱</div><div class="set-row">${chip("who:yomi", "月读（つくよみちゃん）", q !== "none")}` +
      `${q === "none" ? chip("who:none", "未选角", true, "别的软件存的谱：原来的乐器这一版没有") : ""}</div>` +
      `<div class="offer-msg">以后这里能选一大堆乐器；现在只有月读。</div>` +
      (q === "none" ? "" :
        `<div class="part-sec">音质</div><div class="set-row">${chip("q:full", "完整", q === "full", "月读本人（第一次要加载约 65 MB）")}${chip("q:light", "轻量", q === "light", "元音采样，按下即响、任何设备都能跑")}</div>` +
        `<div class="part-sec">没写歌词的音唱什么</div><div class="set-row">${HUMS.map(([v, l]) => chip(`hum:${v}`, l, h === v)).join("")}</div>`) +
      `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  };
  draw();
  document.body.append(box);
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    if (v === "who:yomi" && quality() === "none") setQuality("full");
    else if (v.startsWith("q:")) setQuality(v.slice(2) as Quality);
    else if (v.startsWith("hum:")) update(setHum(st, v.slice(4) as Hum));
    draw();
  });
}
function loadDoc(song: Song, o: { stem: string; named: boolean; quality: Quality; extras: Extras; handle: docFile.FileHandle | null }): void {
  if (impro) toggleImpro();
  curQuality = o.quality;
  doc.stem = o.stem; doc.named = o.named; doc.handle = o.handle; doc.extras = o.extras;
  st = { ...initState(song), input: { ...initState(song).input, inputFifths: st.input.inputFifths, inputScale: st.input.inputScale } };   // pad 是独立设备：换歌不换它的「1=」和调式
  doc.saved = { song: st.song, quality: o.quality };
  lastFull = null;
  view.render(); pad.render(); renderTitle();
}
/** 存好了：文件名从此定下来（之后和歌名各管各的；user「之后各管各的同意」）。 */
function markSaved(): void { doc.stem = docName(); doc.named = true; doc.saved = { song: st.song, quality: quality() }; renderTitle(); }
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
      else if (v === "save") { close(false); void fileSave(false); }
    });
  });
}
async function fileNew(): Promise<void> {
  if (!(await confirmDiscard("新建"))) return;
  loadDoc(initState().song, { stem: defaultStem(), named: false, quality: "full", extras: emptyExtras(), handle: null });
  info("新的一首");
}
async function fileOpen(): Promise<void> {
  if (!(await confirmDiscard("打开别的歌"))) return;
  let picked: docFile.Picked | null;
  try { picked = await docFile.pickOpen(); } catch (e) { showError(`没打开：${(e as Error).message}`); return; }
  if (!picked) return;
  try {
    const o = openBytes(picked.name, picked.bytes);
    // 别的软件存的谱：不认它的家（存回去会把它没读进来的东西丢掉 → 第一次存走另存为）
    loadDoc(o.song, { stem: o.stem, named: true, quality: o.quality, extras: o.extras, handle: o.ours && !o.notices.length ? picked.handle : null });
    if (o.notices.length) showError(o.notices.join(" "));
    else info(`打开了 ${picked.name}`);
  } catch (e) { showError(`打不开 ${picked.name}：${(e as Error).message}`); }
}
const bytesNow = () => saveMxl({ song: st.song, hum: st.song.hum, quality: quality(), extras: doc.extras, app: APP_VERSION, date: new Date().toISOString() });
async function fileSave(asNew: boolean): Promise<void> {
  try {
    if (!asNew && doc.handle) { await docFile.writeTo(doc.handle, bytesNow()); markSaved(); info(`存好了：${doc.handle.name}`); return; }
    if (docFile.canPickSave()) {
      const h = await docFile.pickSave(`${docName()}.mxl`);
      if (!h) return;
      await docFile.writeTo(h, bytesNow());
      doc.stem = h.name.replace(/\.(mxl|musicxml|xml)$/i, "") || doc.stem; doc.named = true;
      doc.handle = h; markSaved(); info(`存好了：${h.name}`);
      return;
    }
    // iPad / Safari：没有「存回原文件」——给一个 .mxl，下载或分享到「文件」（点了才算存了）
    const file = new File([bytesNow() as unknown as BlobPart], `${docName()}.mxl`, { type: "application/vnd.recordare.musicxml" });
    offerFile(file, "存成 .mxl", `${esc(file.name)} · ${file.size < 1e6 ? `${Math.max(1, Math.round(file.size / 1e3))} KB` : `${(file.size / 1e6).toFixed(1)} MB`}。下载或分享到「文件」里；以后从文件菜单「打开」。`, markSaved);
  } catch (e) { showError(`没存上：${(e as Error).message}`); }
}
/** 文件菜单（应用内面板）：新建、打开、存、另存为（歌名在纸面最上面填）。 */
function openFileMenu(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">文件</div>` +
    `<div class="offer-msg">文件名：<b>${esc(doc.handle ? doc.handle.name : `${docName()}.mxl`)}</b>（没存过 = 年月日-歌名；存过之后和纸上的歌名各管各的）</div>` +
    `<div class="set-row file-row">` +
    `<button class="btn" data-v="new"><svg class="ico"><use href="#new"/></svg>新建</button>` +
    `<button class="btn" data-v="open"><svg class="ico"><use href="#folder-open"/></svg>打开…</button>` +
    `<button class="btn" data-v="save"><svg class="ico"><use href="#floppy-disk"/></svg>存</button>` +
    `<button class="btn" data-v="saveAs"><svg class="ico"><use href="#save-as"/></svg>另存为…</button>` +
    `<button class="btn" data-v="rename">改文件名…</button>` +
    `<button class="btn" data-v="export" title="月读唱一遍，编成 mp3，分享或下载"><svg class="ico"><use href="#export"/></svg>导出歌声（mp3）…</button></div>` +
    `<div class="offer-msg">存成 <code>.mxl</code>（MusicXML 乐谱的压缩包：别的乐谱软件也能打开；MoonSinger 自己的东西放在里面的 <code>.moonsinger/</code>）。` +
    `${doc.handle ? `现在存在 ${esc(doc.handle.name)}，「存」= 存回去。` : docFile.canPickSave() ? "" : "这台设备上「存」= 下载或分享一个 .mxl 到「文件」里。"}</div>` +
    `<div class="offer-btns"><button class="btn primary" data-v="close">好</button></div></div>`;
  document.body.append(box);
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") { close(); return; }
    if (!v) return;
    close();
    if (v === "new") void fileNew(); else if (v === "open") void fileOpen(); else if (v === "save") void fileSave(false); else if (v === "saveAs") void fileSave(true);
    else if (v === "rename") renameFile(); else if (v === "export") void exportSong();
  });
}
$("fileBtn").addEventListener("click", () => openFileMenu());
/** 改文件名（只改文件名，纸上的歌名不变；user「之后各管各的同意，但是要有改文件名的规则？」）。
 *  这台设备上已经存回原文件的：浏览器没法给那个文件改名 → 下次「存」按新名字另存（会问存到哪）。 */
function renameFile(): void {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">改文件名</div>` +
    `<label class="set-field">文件名<input id="fnIn" type="text" spellcheck="false" autocomplete="off" value="${esc(docName())}" /></label>` +
    `<div class="offer-msg">只改文件名，纸上的歌名不变。${doc.handle ? `原来的「${esc(doc.handle.name)}」不会被改名：下次「存」用新名字另存。` : "下次存的时候用新名字。"}</div>` +
    `<div class="offer-btns"><button class="btn" data-v="cancel">算了</button><button class="btn primary" data-v="ok">改</button></div></div>`;
  document.body.append(box);
  const inp = box.querySelector<HTMLInputElement>("#fnIn")!;
  const close = () => { box.remove(); closeOffer = null; scoreEl.focus(); };
  const ok = () => { const v = fileSafe(inp.value); if (v && v !== docName()) { doc.stem = v; doc.named = true; doc.handle = null; renderTitle(); info(`文件名改成 ${v}.mxl`); } close(); };
  closeOffer = close;
  inp.addEventListener("keydown", (e) => { if (e.isComposing) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ok(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } });
  box.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v;
    if (e.target === box || v === "cancel") close(); else if (v === "ok") ok();
  });
  inp.focus(); inp.select();
}
// 改过没存就关页面 / 刷新：浏览器自己的挽留框（照 WeebPaint；无地不偷偷写盘——静默写用户文件违背文件语义）
window.addEventListener("beforeunload", (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });

// ── 键盘：映射是一张表（src/input/keys.ts）；这里只算「键盘现在归谁」，再照路由的结果做 ─────────────
/** 谁在最上面归谁：导出面板 > 记号框 > 歌词框 > 谱面（弹 / 改 / 写）。 */
function whereNow(): Where {
  if (closeOffer) return "sheet";
  if (view.marks.open) return "mark";
  if (view.lyrics.open) return "lyric";
  return impro ? "impro" : st.sel ? "edit" : "write";
}
/** 照做；返回 false = 这一下其实不归我们管（例如歌词框里「-」不跟在字母后面），让浏览器照常打字。 */
function run(a: Action, repeat: boolean, code: string): boolean {
  switch (a.k) {
    case "cmd":
      if (a.cmd.k === "degree") {
        if (!repeat && monoAccept(`key${code}`)) { const c = a.cmd, i = writeAndLocate((s) => apply(s, c, performance.now())); keyTok(st, i, code); }   // 先写再取 st（写完才有这个音）
        return true;
      }
      update(apply(st, a.cmd, performance.now())); return true;
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
    case "sheet": closeOffer?.(); return true;
    case "file": if (a.a === "open") void fileOpen(); else void fileSave(a.a === "saveAs"); return true;
  }
}
window.addEventListener("keydown", (e) => {
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
// 试听元音表（约 3 MB）在画好之后的空闲时下载：选了月读就是意图，第一下就该响（user「选这个乐器就是意图，然后第一下就响」）
setTimeout(() => { void sampler.load().catch((e) => showError(`试听元音表没下载下来：${(e as Error).message}`)); }, 300);
