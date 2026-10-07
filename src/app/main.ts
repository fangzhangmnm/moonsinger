// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 键盘。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 第一版（grill 账本 §8½）：不做撤销；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。
// 存档 = 无地逃生口（2026-10-07，user「先不急着store。可以先按照无地规范导入导出做逃生口」）：文件菜单 新建 / 打开 / 存 / 另存为 .mxl
//   （格式 = src/format/，数据契约草稿 ai-docs/20261007-data-contract-draft.md）；没存就关页面 = 浏览器挽留框（照 WeebPaint，不偷偷写盘）。
// UX-2（账本 §9¾）：选中 = 改、光标 = 写；歌词在谱下面点进去写（底部歌词栏拿掉了）；「弹」= 即兴只唱不写。
// 调号 / 拍号 / 速度是谱里的记号 token，点谱上的记号就地改，pad「＋」在光标处插——顶栏不再有全局的调号 / 拍号 / 速度。

import { APP_VERSION } from "../version.ts";
import { initPwaShell } from "./pwa-shell.ts";
import { type EditorState, type NoteTok, type Hum, type MarkVal, type Song, initState, writePitch, soundingPitch, writeMark, setHum, setTuplet, setInputKey, setInputScale, setUnit, setNote, currentIndex, effectivePitch, timeline, headLen, keyAt, timeAt, tempoAt, tempoWord, TPQ } from "../score/song.ts";
import { type Pitch, pitchName, midiOf, KEY_LABEL, alterBy } from "../score/pitch.ts";
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
import { PACKS, CREDIT } from "../singer/packs.gen.ts";
import { Sampler } from "../singer/sampler.ts";
import { saveMxl, openBytes, emptyExtras, type Extras, type Quality } from "../format/project.ts";
import * as docFile from "./doc-file.ts";
import { defaultStem, fileSafe } from "./names.ts";

let st: EditorState = initState();
/** 这首歌的家（无地逃生口）：文件名主干（新建 = 默认名；打开 = 那个文件的名字）、打开的那个文件（桌面 Chromium）、
 *  文件里这一版不改动的部分、上次存 / 打开时的样子（判断改过没存）。歌名在谱里（st.song.title，可不填），和文件名分开。 */
const doc = { stem: defaultStem(), handle: null as docFile.FileHandle | null, extras: emptyExtras() as Extras,
  saved: { song: st.song as Song, quality: "full" as Quality } };
/** 显示 / 存档用的名字：填了歌名用歌名，没填用文件名主干。 */
const docName = () => fileSafe(st.song.title ?? "") || doc.stem;

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


bar.innerHTML =
  `<button id="fileBtn" class="btn" title="文件：新建 / 打开 / 存 / 另存为（Ctrl / ⌘+S 存）"><svg class="ico"><use href="#file"/></svg></button>` +
  `<span id="docTitle" class="title">未命名</span><span class="ver">${APP_VERSION}</span>` +
  `<label class="field" title="完整 = 月读本人（第一次要加载约 65 MB）；轻量 = 元音采样，按下即响、任何设备都能跑">音质<select id="qualSel"><option value="full">完整</option><option value="light">轻量</option></select></label>` +
  `<label class="field" title="没写歌词的音唱什么">哼<select id="humSel"><option value="la">ら / 啦</option><option value="n">ん / 嗯</option><option value="u">う / 呜</option><option value="o">お / 哦</option><option value="a">あ / 啊</option></select></label>` +
  `<span class="spacer"></span><span id="singStatus" class="status sing"></span><span id="status" class="status"></span>` +
  `<button id="padBtn" class="btn is-on" title="手指 pad"><svg class="ico"><use href="#grid"/></svg></button>` +
  `<button id="setBtn" class="btn" title="设置：模型来源、导入模型包、月读的署名与使用条款"><svg class="ico"><use href="#wrench"/></svg></button>` +
  `<button id="shareBtn" class="btn" title="导出歌声（mp3），发给别人听"><svg class="ico"><use href="#export"/></svg></button>` +
  `<button id="improBtn" class="btn" title="弹：音符只唱不写（\`）">弹</button>` +
  `<button id="playBtn" class="btn" title="月读唱 / 停（空格）"><svg class="ico"><use href="#play"/></svg></button>`;

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
  focus: (where) => { if (stacked()) showPad(where === "staff"); },
  autoBars: () => autoBars,
});
let impro = false;
/** 按拍号自动画小节线（默认开；这次打开里有效）。user「自动加小节也是可以toggle的，默认开」 */
let autoBars = true;   // 「弹」（顶栏开关；2026-10-07 user「弹应该放在顶栏」）：音符只唱不写
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
  onAutoBars: (on) => { autoBars = on; view.render(); pad.render(); renderStatus(); },
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
function toggleImpro(): void { impro = !impro; $("improBtn").classList.toggle("is-on", impro); if (impro) showPad(true); renderStatus(); pad.render(); }
$("improBtn").addEventListener("click", () => toggleImpro());

function update(next: EditorState): void {
  if (next === st) return;
  st = next;
  view.render();
  pad.render();
  renderStatus();
  renderTitle();
}

const DUR_NAME: Record<number, string> = { [TPQ * 4]: "全音符", [TPQ * 3]: "附点二分", [TPQ * 2]: "二分", [TPQ * 1.5]: "附点四分", [TPQ]: "四分",
  [TPQ * 0.75]: "附点八分", [TPQ / 2]: "八分", [TPQ * 3 / 8]: "附点十六分", [TPQ / 4]: "十六分", [TPQ / 8]: "三十二分" };
const UNIT_NAME = ["三十二分", "十六分", "八分", "四分", "二分", "全音符"];   // = song.ts LADDER
const durName = (d: number) => DUR_NAME[d] ?? `${+(d / TPQ).toFixed(3)} 拍`;
function renderStatus(): void {
  const el = $("status"), off = view.layout?.shortBars ?? 0;   // 和谱面同一个数法（自动小节线开着时按拍号数）
  // 写的时候谱上不预览下一个音（user「插入不要在谱上显示音符预览」）→ 下一个音的样子写在这里
  const inp = st.input, next = `${UNIT_NAME[inp.unit]}${inp.tuplet ? ` ${inp.tuplet} 连` : ""}${inp.acc ? ` ${inp.acc > 0 ? "♯" : "♭"}${inp.accMode === "lock" ? "（锁）" : ""}` : ""}`;
  let s = impro ? "弹（只唱不写）" : st.sel ? `改 · 选中 ${st.sel.to - st.sel.from} 个` : `写（下一个：${next}）`;
  const i = st.sel ? st.sel.from : currentIndex(st);
  if (i >= 0 && (!st.sel || st.sel.to - st.sel.from === 1)) {
    const t = st.song.tokens[i];
    if (t.kind === "rest") s += ` · 休止 · ${durName(t.dur)}`;
    else if (t.kind === "note") s += ` · ${(t as NoteTok).pitch ? pitchName((t as NoteTok).pitch!) : "（音高空着）"} · ${durName(t.dur)}${t.tie ? " · 连着前一个" : ""}` +
      `${(t as NoteTok).lyric ? ` · ${(t as NoteTok).lyric === MELISMA_MARK ? "拖腔" : (t as NoteTok).lyric}` : ""}`;
    else if (t.kind === "key") s += ` · 调号 1=${KEY_LABEL[t.fifths]}`;
    else if (t.kind === "time") s += ` · 拍号 ${t.beats}/${t.beatType}`;
    else if (t.kind === "tempo") s += ` · 速度 ${tempoWord(t.bpm).it} ♩=${t.bpm}`;
  } else if (st.song.tokens.length <= headLen(st.song.tokens)) s += " · 打 1–7 写音，点谱下面写歌词，点谱头改调号 / 拍号 / 速度";
  if (off) s += ` · ${off} 个小节拍数和拍号对不上（只提示）`;
  el.textContent = s;
}

// ── 播放：月读唱（第一次要加载引擎，之后复用） ─────────────────────────
const singer = new Singer();
let singing = false;
const singStatus = (s: string) => { $("singStatus").textContent = s; };
/** 报错条（顶上，带完整原因、点「知道了」才收）。user 2026-10-07「替补不能静默替补，需要显示报错」→ 订正「不是显示自动上，而是就是不出声，报错，人类手动换」：
 *  成员上不了场就不出声、报错，换谁由人来（选角是窄接口；谱子不受影响）。
 *  状态栏太窄、原因会被省略号截掉，所以不放在那里。 */
function showError(text: string): void {
  document.getElementById("errNotice")?.remove();
  const el = document.createElement("div");
  el.id = "errNotice"; el.className = "update-bar notice-err";
  el.innerHTML = `<span class="notice-text"></span><button class="btn" data-v="ok">知道了</button>`;
  el.querySelector<HTMLElement>(".notice-text")!.textContent = text;
  el.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("[data-v]")) el.remove(); });
  document.body.append(el);
}
const playIcon = (stop: boolean) => { $("playBtn").innerHTML = `<svg class="ico"><use href="#${stop ? "stop" : "play"}"/></svg>`; };
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
  const r = await singer.sing(score, (stage) => singStatus(`${stage}…`), { opt, models: modelBases() });
  lastFull = { key, r };
  return r;
}
/** 轻量版：用元音采样器按乐谱唱（全唱「哼」那个字）。 */
function playLight(who = "轻量版"): void {
  const notes = lightNotes();
  if (!notes.length) { singStatus("还没有音"); return; }
  if (!sampler.ready) { singStatus("轻量版的元音表还在下载…"); void sampler.load().then(() => playLight(who)); return; }
  const total = sampler.playSong(notes, st.song.hum, () => playIcon(false));
  playIcon(true); singStatus(`${who}唱 ${total.toFixed(1)} 秒`);
}
async function togglePlay(): Promise<void> {
  if (singer.playing || sampler.songPlaying) { singer.stop(); sampler.stopSong(); playIcon(false); singStatus(""); return; }
  if (singing) return;
  singer.unlock();   // 在用户手势里先把声音打开（iPad）
  if (quality() === "none") { noCast("唱"); return; }
  if (quality() === "light") { playLight(); return; }
  singing = true; $("playBtn").classList.add("is-on");
  try {
    const cached = lastFull, r = await singFull();
    if (!r) { singStatus("还没有音"); return; }
    singStatus(r === cached?.r ? `唱 ${(r.samples.length / r.sr).toFixed(1)} 秒（谱没改，用上次唱好的）` : `唱 ${(r.samples.length / r.sr).toFixed(1)} 秒（准备 ${(r.ms.load / 1000).toFixed(1)} s，合成 ${(r.ms.sing / 1000).toFixed(1)} s）`);
    singer.play(r, () => { playIcon(false); });
    playIcon(true);
  } catch (e) {
    // 完整引擎带不起来（内存不够 / 加载失败）→ 不出声、报错，人手动换（user「不是显示自动上，而是就是不出声，报错，人类手动换」）
    showError(`完整版月读唱不出来：${(e as Error).message}。没有出声。要先用元音版，就在顶栏「音质」换成「轻量」再播。`);
    singStatus("没有出声（原因见上方）");
  } finally { singing = false; $("playBtn").classList.remove("is-on"); }
}
$("playBtn").addEventListener("click", () => { void togglePlay(); });

// ── 导出歌声（user「基于wxhw的经验分享是可以很早就做」）：照 WXHW 的形状——先生成，再弹「好了」面板，
//    点「分享」那一下才调系统分享（iOS Safari 只认用户手势里的 navigator.share）；没有分享的（桌面 / Quest）= 下载。
let exporting = false;
async function exportSong(): Promise<void> {
  if (exporting || singing) return;
  exporting = true; $("shareBtn").classList.add("is-on");
  try {
    let r: { samples: Float32Array; sr: number } | null = null, how = "";
    if (quality() === "none") { noCast("导出"); return; }
    if (quality() === "full") {
      try { r = await singFull(); how = "月读"; }
      catch (e) { showError(`完整版月读唱不出来：${(e as Error).message}。没有导出。要先用元音版导出，就在顶栏「音质」换成「轻量」再导出。`); singStatus("没有导出（原因见上方）"); return; }
    } else {
      const notes = lightNotes();
      if (notes.length) { r = await sampler.renderSong(notes, st.song.hum); how = "轻量版"; }
    }
    if (!r) { singStatus("还没有音"); return; }
    singStatus("编 mp3…");
    const secs = r.samples.length / r.sr, bytes = await encodeMp3(r.samples, r.sr);
    const file = new File([bytes], `${docName()}.mp3`, { type: "audio/mpeg" });
    singStatus("");
    offerFile(file, "歌声导出好了", `${how}唱 ${secs.toFixed(1)} 秒 · mp3 ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}`);
  } catch (e) {
    singStatus(`导出失败：${(e as Error).message}`);
  } finally { exporting = false; $("shareBtn").classList.remove("is-on"); }
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
    else if (v === "check") void shell.checkForUpdate().then((r) => { if (r === "found") { close(); showUpdateBar(); } else singStatus(r === "latest" ? "已经是最新版" : "这里没有离线壳（本机开发 / 浏览器不支持），不用更新"); });
    else if (v === "reset") void shell.forceReset();
  });
  box.querySelector<HTMLInputElement>("#impIn")!.addEventListener("change", async (e) => {
    const files = [...((e.target as HTMLInputElement).files ?? [])]; if (!files.length) return;
    packSt.textContent = "导入中…";
    try { await packStore.importFiles(Object.keys(PACKS), files, (p) => (packSt.textContent = `导入中… ${Math.floor((p.done / p.total) * 100)}%`)); }
    catch (err) { singStatus(`导入没成：${(err as Error).message === "no-matching-file" ? "这些文件不是月读要的模型包分片" : (err as Error).message}`); }
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
      singStatus(`已下载 ${file.name}`); onDone?.(); close();
    } else if (v === "share") {
      try { await navigator.share({ files: [file], title: file.name }); singStatus("已分享"); onDone?.(); close(); }
      catch (err) { if ((err as { name?: string }).name !== "AbortError") singStatus(`分享失败：${(err as Error).message}`); }
    }
  });
}
$("shareBtn").addEventListener("click", () => { void exportSong(); });
// 测试用口子（Playwright 逐样本比对浏览器 == Node 时用）
(window as unknown as Record<string, unknown>).__moonsinger = { singer, sampler, exportSong, labScore: () => toLabScore(st.song, songLang()), state: () => st, cssHash: __CSS_HASH__ };   // cssHash：样式表版本（见 scripts/build.sh）

// ── 顶栏 ────────────────────────────────────────────────────────────────
$<HTMLSelectElement>("humSel").value = st.song.hum;   // 下拉的初值跟这首歌的设置（默认嗯）
$<HTMLSelectElement>("humSel").addEventListener("change", (e) => { update(setHum(st, (e.target as HTMLSelectElement).value as Hum)); scoreEl.focus(); });
$("padBtn").addEventListener("click", () => showPad(padEl.hidden));
/** pad 像软键盘、五线谱像文本框（user「键盘输入歌词的时候音乐键盘应该hide」「可以想象五线谱是文本框，你touch点了会弹键盘。然后点别的地方会隐藏」）：
 *  点谱 = 弹出；打开歌词 / 歌名框（系统键盘要上来）= 收起；点顶栏空白处 = 收起。开局是弹出的（光标就在谱上）。
 *  只在 pad 贴底（竖屏）时自动：横屏 / 桌面 pad 在旁边，收起会让整页谱重新排、点的那个字跟着跑。顶栏的 pad 钮照旧手动开关；开「弹」= 弹出。 */
function stacked(): boolean { return matchMedia("(max-aspect-ratio: 1/1)").matches; }
function showPad(on: boolean): void {
  if (padEl.hidden === !on) return;
  padEl.hidden = !on; $("padBtn").classList.toggle("is-on", on);
  if (!on) pad.clearHeld();
  view.render();
}
bar.addEventListener("pointerdown", (e) => { if (stacked() && !(e.target as HTMLElement).closest("button, select, label, input, a")) showPad(false); });

// ── 文件（无地逃生口）：一首歌 = 一个 .mxl；家 = 打开的那个文件（桌面 Chromium 能存回去）或没有家（iPad：存 = 下载 / 分享） ──────
function quality(): Quality { return $<HTMLSelectElement>("qualSel").value as Quality; }
const dirty = () => st.song !== doc.saved.song || quality() !== doc.saved.quality;
function renderTitle(): void {
  const d = dirty(), name = docName();
  $("docTitle").textContent = `${name}${d ? " •" : ""}`;
  $("docTitle").title = d ? "改过还没存" : doc.handle ? `存在 ${doc.handle.name}` : "";
  document.title = `${d ? "• " : ""}${name} · MoonSinger`;
}
/** 主唱没人上场（别的软件存的谱，原来的乐器这一版没有）：不出声、报错，人来选（user「不出声，报错，人类手动换」）。 */
function noCast(what: string): void {
  showError(`主唱这个角色还没有人上场（原来的乐器这一版没有），所以没有${what}。要月读来唱，在顶栏「音质」选「完整」或「轻量」。`);
  singStatus(`没有${what}（原因见上方）`);
}
/** 音质下拉：别的软件存的谱打开时多一项「未选角」。 */
function setQuality(q: Quality): void {
  const sel = $<HTMLSelectElement>("qualSel");
  let none = sel.querySelector<HTMLOptionElement>('option[value="none"]');
  if (q === "none" && !none) { none = document.createElement("option"); none.value = "none"; none.textContent = "未选角"; sel.prepend(none); }
  if (q !== "none") none?.remove();
  sel.value = q;
}
function loadDoc(song: Song, o: { stem: string; quality: Quality; extras: Extras; handle: docFile.FileHandle | null }): void {
  if (impro) toggleImpro();
  setQuality(o.quality);
  $<HTMLSelectElement>("humSel").value = song.hum;
  doc.stem = o.stem; doc.handle = o.handle; doc.extras = o.extras;
  st = { ...initState(song), input: { ...initState(song).input, inputFifths: st.input.inputFifths, inputScale: st.input.inputScale } };   // pad 是独立设备：换歌不换它的「1=」和调式
  doc.saved = { song: st.song, quality: o.quality };
  lastFull = null;
  view.render(); pad.render(); renderStatus(); renderTitle();
}
function markSaved(): void { doc.saved = { song: st.song, quality: quality() }; renderTitle(); }
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
  loadDoc(initState().song, { stem: defaultStem(), quality: "full", extras: emptyExtras(), handle: null });
  singStatus("新的一首");
}
async function fileOpen(): Promise<void> {
  if (!(await confirmDiscard("打开别的歌"))) return;
  let picked: docFile.Picked | null;
  try { picked = await docFile.pickOpen(); } catch (e) { showError(`没打开：${(e as Error).message}`); return; }
  if (!picked) return;
  try {
    const o = openBytes(picked.name, picked.bytes);
    // 别的软件存的谱：不认它的家（存回去会把它没读进来的东西丢掉 → 第一次存走另存为）
    loadDoc(o.song, { stem: o.stem, quality: o.quality, extras: o.extras, handle: o.ours && !o.notices.length ? picked.handle : null });
    if (o.notices.length) showError(o.notices.join(" "));
    singStatus(`打开了 ${picked.name}`);
  } catch (e) { showError(`打不开 ${picked.name}：${(e as Error).message}`); }
}
const bytesNow = () => saveMxl({ song: st.song, hum: st.song.hum, quality: quality(), extras: doc.extras, app: APP_VERSION, date: new Date().toISOString() });
async function fileSave(asNew: boolean): Promise<void> {
  try {
    if (!asNew && doc.handle) { await docFile.writeTo(doc.handle, bytesNow()); markSaved(); singStatus(`存好了：${doc.handle.name}`); return; }
    if (docFile.canPickSave()) {
      const h = await docFile.pickSave(`${docName()}.mxl`);
      if (!h) return;
      doc.stem = h.name.replace(/\.(mxl|musicxml|xml)$/i, "") || doc.stem;
      await docFile.writeTo(h, bytesNow());
      doc.handle = h; markSaved(); singStatus(`存好了：${h.name}`);
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
    `<div class="offer-msg">文件名：<b>${esc(doc.handle ? doc.handle.name : `${docName()}.mxl`)}</b>（填了歌名就用歌名；歌名在纸面最上面点着填，可不填）</div>` +
    `<div class="set-row file-row">` +
    `<button class="btn" data-v="new"><svg class="ico"><use href="#new"/></svg>新建</button>` +
    `<button class="btn" data-v="open"><svg class="ico"><use href="#folder-open"/></svg>打开…</button>` +
    `<button class="btn" data-v="save"><svg class="ico"><use href="#floppy-disk"/></svg>存</button>` +
    `<button class="btn" data-v="saveAs"><svg class="ico"><use href="#save-as"/></svg>另存为…</button></div>` +
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
  });
}
$("fileBtn").addEventListener("click", () => openFileMenu());
$<HTMLSelectElement>("qualSel").addEventListener("change", () => { if (quality() !== "none") setQuality(quality()); renderTitle(); });
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
renderStatus();
renderTitle();
scoreEl.focus();
// 试听元音表（约 3 MB）在画好之后的空闲时下载：选了月读就是意图，第一下就该响（user「选这个乐器就是意图，然后第一下就响」）
setTimeout(() => { void sampler.load().catch((e) => singStatus(`试听元音表没下载下来：${(e as Error).message}`)); }, 300);
