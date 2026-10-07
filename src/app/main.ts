// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 键盘。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 第一版（grill 账本 §8½）：内存态，刷新就清空（不做存档、不做撤销）；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。
// UX-2（账本 §9¾）：选中 = 改、光标 = 写；歌词在谱下面点进去写（底部歌词栏拿掉了）；「弹」= 即兴只唱不写。
// 调号 / 拍号 / 速度是谱里的记号 token，点谱上的记号就地改，pad「＋」在光标处插——顶栏不再有全局的调号 / 拍号 / 速度。

import { APP_VERSION } from "../version.ts";
import { type EditorState, type NoteTok, type Hum, type MarkVal, initState, writePitch, writeMark, setHum, setTuplet, setInputKey, currentIndex, barFill, effectivePitch, timeline, headLen, keyAt, timeAt, tempoAt, tempoWord, TPQ } from "../score/song.ts";
import { type Pitch, pitchName, midiOf, KEY_LABEL } from "../score/pitch.ts";
import { apply } from "../score/commands.ts";
import { type Action, type Where, route, isSoundKey } from "../input/keys.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { ScoreView } from "../ui/score-view.ts";
import { Pad } from "../ui/pad.ts";
import { toLabScore } from "../score/lab-score.ts";
import { Singer, type SingResult } from "../singer/client.ts";
import { encodeMp3 } from "../export/mp3.ts";
import { Sampler, type PreviewVariant } from "../singer/sampler.ts";

let st: EditorState = initState();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const bar = $("bar"), scoreEl = $("score"), padEl = $("padPanel");


bar.innerHTML =
  `<span class="title">MoonSinger</span><span class="ver">${APP_VERSION}</span>` +
  `<label class="field" title="完整 = 月读本人（第一次要加载约 65 MB）；轻量 = 元音采样，按下即响、任何设备都能跑">音质<select id="qualSel"><option value="full">完整</option><option value="light">轻量</option></select></label>` +
  `<label class="field" title="实验开关（选定后删）：新 = 试听样本从安静里起唱（嗯 闭嘴、呜 / 啦 用中文唱）、抢占快淡出、拖音高滑过去；整首的哼：嗯 闭嘴、啦 的辅音拉开、没歌词时 呜 / 啦 用中文唱。旧 = 之前那套">实验<select id="prevSel"><option value="v2">新</option><option value="v1">旧</option></select></label>` +
  `<label class="field" title="没写歌词的音唱什么">哼<select id="humSel"><option value="la">ら / 啦</option><option value="n">ん / 嗯</option><option value="u">う / 呜</option><option value="a">あ / 啊</option></select></label>` +
  `<span class="spacer"></span><span id="singStatus" class="status sing"></span><span id="status" class="status"></span>` +
  `<button id="padBtn" class="btn is-on" title="手指 pad"><svg class="ico"><use href="#grid"/></svg></button>` +
  `<button id="shareBtn" class="btn" title="导出歌声（mp3），发给别人听"><svg class="ico"><use href="#export"/></svg></button>` +
  `<button id="playBtn" class="btn" title="月读唱 / 停（空格）"><svg class="ico"><use href="#play"/></svg></button>`;

// ── 试听：月读的元音采样器（出一个音就响；只唱「哼」那一个字，不看歌词——user「还是单一元音更适合当blueprint」） ─────
const sampler = new Sampler();
const sound = {
  down: (p: Pitch) => sampler.down(midiOf(p), st.song.hum),
  up: () => sampler.up(),
};
const soundTok = (s: EditorState, i: number) => { const t = s.song.tokens[i]; if (t?.kind === "note" && t.pitch) sound.down(t.pitch); };
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
  audition: (i, hold) => { clearTimeout(upTimer); soundTok(st, i); if (!hold) upTimer = window.setTimeout(() => sound.up(), 350); },
  glide: (i) => { clearTimeout(upTimer); const t = st.song.tokens[i]; if (t?.kind === "note" && t.pitch) sampler.glide(midiOf(t.pitch), st.song.hum); },
  release: () => { clearTimeout(upTimer); sound.up(); },
});
let impro = false;
let padWrote = -1;   // pad 按下：先写（onPitch）再响（onSoundDown）——响的时候唱刚写的那个音的字
const pad = new Pad(padEl, {
  state: () => st,
  onPitch: (p) => { padWrote = writeAndLocate((s) => writePitch(s, p)); },
  onCommand: (c) => update(apply(st, c, performance.now())),
  onTuplet: (n) => update(setTuplet(st, n)),
  onInputKey: (f) => update(setInputKey(st, f)),
  onImpro: (on) => { impro = on; renderStatus(); },
  onInsertMark: (kind) => {   // 默认值 = 光标处正生效的那个（没改就收起 = 撤掉这次插入）
    const at = st.sel ? st.sel.from : st.caret;
    const v: MarkVal = kind === "key" ? { kind, fifths: keyAt(st.song, at) } : kind === "time" ? { kind, ...timeAt(st.song, at) } : { kind, bpm: tempoAt(st.song, at) };
    const r = writeMark(st, v);
    update(r.st);
    view.marks.openAt(r.index, r.fresh);
  },
  onSoundDown: (p) => { if (padWrote >= 0) soundTok(st, padWrote); else sound.down(p); padWrote = -1; },
  onSoundUp: () => sound.up(),
});

function update(next: EditorState): void {
  if (next === st) return;
  st = next;
  view.render();
  pad.render();
  renderStatus();
}

const DUR_NAME: Record<number, string> = { [TPQ * 4]: "全音符", [TPQ * 3]: "附点二分", [TPQ * 2]: "二分", [TPQ * 1.5]: "附点四分", [TPQ]: "四分",
  [TPQ * 0.75]: "附点八分", [TPQ / 2]: "八分", [TPQ * 3 / 8]: "附点十六分", [TPQ / 4]: "十六分", [TPQ / 8]: "三十二分" };
const UNIT_NAME = ["三十二分", "十六分", "八分", "四分", "二分", "全音符"];   // = song.ts LADDER
const durName = (d: number) => DUR_NAME[d] ?? `${+(d / TPQ).toFixed(3)} 拍`;
function renderStatus(): void {
  const el = $("status"), fills = barFill(st.song), off = fills.slice(1).filter((f) => !f.full).length;
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
const playIcon = (stop: boolean) => { $("playBtn").innerHTML = `<svg class="ico"><use href="#${stop ? "stop" : "play"}"/></svg>`; };
/** 歌词里有汉字、没有假名 → 按中文唱；其余（含没有歌词）按日语唱。 */
function songLang(): "ja" | "zh" {
  const ls = st.song.tokens.flatMap((t) => (t.kind === "note" && t.lyric ? [t.lyric] : [])).join("");
  // 实验开关「新」：整首没写歌词时，哼「啦」「呜」用中文唱（日语 ら 是轻弹舌、う 不圆唇；user「呜还是啊，拉也不行」）
  if (!ls && experimentNew() && (st.song.hum === "la" || st.song.hum === "u")) return "zh";
  return /\p{Script=Han}/u.test(ls) && !/[぀-ヿ]/.test(ls) ? "zh" : "ja";
}
/** 实验开关（顶栏「实验 新 / 旧」）：新 = 新的试听元音表 + 包络 + 滑音，整首的哼也按新办法唱。选定后删。 */
const experimentNew = () => sampler.variant === "v2";
/** 整首唱时给核心的哼的参数（新：ん 闭嘴 N_m、哼的字辅音至少 70 ms；旧：不给 = 原样）。 */
const humOpt = (): Record<string, unknown> => (experimentNew() ? { humNasal: "N_m", humConsMin: 0.07 } : {});
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
  const r = await singer.sing(score, (stage) => singStatus(`${stage}…`), { opt });
  lastFull = { key, r };
  return r;
}
/** 轻量版：用元音采样器按乐谱唱（全唱「哼」那个字）。 */
function playLight(note = ""): void {
  const notes = lightNotes();
  if (!notes.length) { singStatus("还没有音"); return; }
  if (!sampler.ready) { singStatus("轻量版的元音表还在下载…"); void sampler.load().then(() => playLight(note)); return; }
  const total = sampler.playSong(notes, st.song.hum, () => playIcon(false));
  playIcon(true); singStatus(`${note}轻量版唱 ${total.toFixed(1)} 秒`);
}
async function togglePlay(): Promise<void> {
  if (singer.playing || sampler.songPlaying) { singer.stop(); sampler.stopSong(); playIcon(false); singStatus(""); return; }
  if (singing) return;
  singer.unlock();   // 在用户手势里先把声音打开（iPad）
  if ($<HTMLSelectElement>("qualSel").value === "light") { playLight(); return; }
  singing = true; $("playBtn").classList.add("is-on");
  try {
    const cached = lastFull, r = await singFull();
    if (!r) { singStatus("还没有音"); return; }
    singStatus(r === cached?.r ? `唱 ${(r.samples.length / r.sr).toFixed(1)} 秒（谱没改，用上次唱好的）` : `唱 ${(r.samples.length / r.sr).toFixed(1)} 秒（准备 ${(r.ms.load / 1000).toFixed(1)} s，合成 ${(r.ms.sing / 1000).toFixed(1)} s）`);
    singer.play(r, () => { playIcon(false); });
    playIcon(true);
  } catch (e) {
    // 完整引擎带不起来（内存不够 / 加载失败）→ 退到轻量版接着唱，并明说（user「带不起piper的就用我们的元音sampler来兜底」）
    playLight(`完整版唱不出来（${(e as Error).message}），先用`);
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
    if ($<HTMLSelectElement>("qualSel").value === "full") {
      try { r = await singFull(); how = "月读"; }
      catch (e) { singStatus(`完整版唱不出来（${(e as Error).message}），改用轻量版导出…`); }
    }
    if (!r) {
      const notes = lightNotes();
      if (notes.length) { r = await sampler.renderSong(notes, st.song.hum); how = "轻量版"; }
    }
    if (!r) { singStatus("还没有音"); return; }
    singStatus("编 mp3…");
    const secs = r.samples.length / r.sr, bytes = await encodeMp3(r.samples, r.sr);
    const file = new File([bytes], `${songTitle()}.mp3`, { type: "audio/mpeg" });
    singStatus("");
    offerFile(file, "歌声导出好了", `${how}唱 ${secs.toFixed(1)} 秒 · mp3 ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}`);
  } catch (e) {
    singStatus(`导出失败：${(e as Error).message}`);
  } finally { exporting = false; $("shareBtn").classList.remove("is-on"); }
}
/** 文件名：歌词开头几个字（没有歌词 = 「旋律」）+ 时间。 */
function songTitle(): string {
  const ly = st.song.tokens.flatMap((t) => (t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : [])).join("").replace(/[\\/:*?"<>|\s]/g, "").slice(0, 12);
  const d = new Date(), z = (n: number) => String(n).padStart(2, "0");
  return `${ly || "旋律"}-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
}
let closeOffer: (() => void) | null = null;
/** 「好了」面板（应用内，不用系统弹窗）：分享 / 下载 / 关。 */
function offerFile(file: File, title: string, msg: string): void {
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
      singStatus(`已下载 ${file.name}`); close();
    } else if (v === "share") {
      try { await navigator.share({ files: [file], title: file.name }); singStatus("已分享"); close(); }
      catch (err) { if ((err as { name?: string }).name !== "AbortError") singStatus(`分享失败：${(err as Error).message}`); }
    }
  });
}
$("shareBtn").addEventListener("click", () => { void exportSong(); });
// 测试用口子（Playwright 逐样本比对浏览器 == Node 时用）
(window as unknown as Record<string, unknown>).__moonsinger = { singer, sampler, exportSong, labScore: () => toLabScore(st.song, songLang()), state: () => st };

// ── 顶栏 ────────────────────────────────────────────────────────────────
$<HTMLSelectElement>("prevSel").addEventListener("change", (e) => {
  const v = (e.target as HTMLSelectElement).value as PreviewVariant;
  void sampler.setVariant(v).catch((err) => singStatus(`试听元音表没下载下来：${(err as Error).message}`));
  scoreEl.focus();
});
$<HTMLSelectElement>("humSel").addEventListener("change", (e) => { update(setHum(st, (e.target as HTMLSelectElement).value as Hum)); scoreEl.focus(); });
$("padBtn").addEventListener("click", () => { padEl.hidden = !padEl.hidden; $("padBtn").classList.toggle("is-on", !padEl.hidden); view.render(); });

// ── 键盘：映射是一张表（src/input/keys.ts）；这里只算「键盘现在归谁」，再照路由的结果做 ─────────────
/** 谁在最上面归谁：导出面板 > 记号框 > 歌词框 > 谱面（弹 / 改 / 写）。 */
function whereNow(): Where {
  if (closeOffer) return "sheet";
  if (view.marks.open) return "mark";
  if (view.lyrics.open) return "lyric";
  return impro ? "impro" : st.sel ? "edit" : "write";
}
/** 照做；返回 false = 这一下其实不归我们管（例如歌词框里「-」不跟在字母后面），让浏览器照常打字。 */
function run(a: Action, repeat: boolean): boolean {
  switch (a.k) {
    case "cmd":
      if (a.cmd.k === "degree") {
        if (!repeat) { const c = a.cmd, i = writeAndLocate((s) => apply(s, c, performance.now())); soundTok(st, i); }   // 先写再取 st（写完才有这个音）
        return true;
      }
      update(apply(st, a.cmd, performance.now())); return true;
    case "audition": {   // 弹：在草稿状态上写一下，拿到那个音高就扔
      if (repeat) return true;
      const probe = apply({ ...st, sel: null, log: [] }, { k: "degree", degree: a.degree, dir: a.dir }, performance.now());
      soundTok(probe, probe.caret - 1); return true;
    }
    case "play": void togglePlay(); return true;
    case "impro": pad.toggleImpro(); return true;
    case "lyric": return view.lyrics.act(a.a);
    case "mark": view.marks.act(a.a); return true;
    case "sheet": closeOffer?.(); return true;
  }
}
window.addEventListener("keydown", (e) => {
  // 别的表单控件（顶栏的下拉框）拿着焦点：不接，它们自己吃方向键 / 空格。歌词框、记号框的输入框照常路由。
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === "SELECT" || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !t.closest(".lyric-input, .mark-ed")))) return;
  const a = route(e, whereNow(), st.sel ? "edit" : "write");
  if (a && run(a, e.repeat)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { if (isSoundKey(e)) sound.up(); });

await document.fonts.load(`40px Bravura`).catch(() => undefined);
view.render();
pad.render();
renderStatus();
scoreEl.focus();
// 试听元音表（约 3 MB）在画好之后的空闲时下载：选了月读就是意图，第一下就该响（user「选这个乐器就是意图，然后第一下就响」）
setTimeout(() => { void sampler.load().catch((e) => singStatus(`试听元音表没下载下来：${(e as Error).message}`)); }, 300);
