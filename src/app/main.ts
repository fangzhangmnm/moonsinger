// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 键盘。created 2026-10-06 by Claude Opus 5.5；2026-10-07 UX-2 改
// 第一版（grill 账本 §8½）：内存态，刷新就清空（不做存档、不做撤销）；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。
// UX-2（账本 §9¾）：选中 = 改、光标 = 写；歌词在谱下面点进去写（底部歌词栏拿掉了）；「弹」= 即兴只唱不写。

import { APP_VERSION } from "../version.ts";
import { type EditorState, type NoteTok, type Hum, initState, writePitch, writeKey, setSongMeta, setTuplet, setInputKey, currentIndex, barFill, TPQ } from "../score/song.ts";
import { type Pitch, pitchName } from "../score/pitch.ts";
import { commandFor } from "../score/keymap.ts";
import { apply } from "../score/commands.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { ScoreView } from "../ui/score-view.ts";
import { Pad, KEY_NAMES } from "../ui/pad.ts";
import { toLabScore } from "../score/lab-score.ts";
import { Singer } from "../singer/client.ts";

let st: EditorState = setSongMeta(initState(), { fifths: 0, beats: 4, beatType: 4, tempo: 90 });

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const bar = $("bar"), scoreEl = $("score"), padEl = $("padPanel");

const KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -5, -6];
const keyOpts = (sel: number | null) => KEY_ORDER.map((f) => `<option value="${f}"${f === sel ? " selected" : ""}>1=${KEY_NAMES[f]}（${f > 0 ? `${f}♯` : f < 0 ? `${-f}♭` : "无升降"}）</option>`).join("");

bar.innerHTML =
  `<span class="title">MoonSinger</span><span class="ver">${APP_VERSION}</span>` +
  `<label class="field" title="歌曲开头的调号（只管显示，不改音）">调号<select id="keySel">${keyOpts(0)}</select></label>` +
  `<select id="keyIns" class="mini" title="在光标处换调号（插一个调号记号）"><option value="">在此换调…</option>${keyOpts(null)}</select>` +
  `<label class="field">拍号<select id="timeSel"><option value="2">2/4</option><option value="3">3/4</option><option value="4" selected>4/4</option></select></label>` +
  `<label class="field">速度<input id="tempoIn" type="number" min="30" max="240" value="90" /></label>` +
  `<label class="field" title="没写歌词的音唱什么">哼<select id="humSel"><option value="la">ら / 啦</option><option value="n">ん / 嗯</option><option value="u">う / 呜</option><option value="a">あ / 啊</option></select></label>` +
  `<span class="spacer"></span><span id="singStatus" class="status sing"></span><span id="status" class="status"></span>` +
  `<button id="padBtn" class="btn is-on" title="手指 pad"><svg class="ico"><use href="#grid"/></svg></button>` +
  `<button id="playBtn" class="btn" title="月读唱 / 停（空格）"><svg class="ico"><use href="#play"/></svg></button>`;

// ── 试听（第 5 步接采样器；先留口子） ─────────────────────────────────
const sound = { down: (_p: Pitch) => {}, up: () => {} };
const soundTok = (s: EditorState, i: number) => { const t = s.song.tokens[i]; if (t?.kind === "note" && t.pitch) sound.down(t.pitch); };

const view = new ScoreView(scoreEl, {
  get: () => st,
  set: (n) => update(n),
  audition: (i) => { soundTok(st, i); setTimeout(() => sound.up(), 350); },
});
let impro = false;
const pad = new Pad(padEl, {
  state: () => st,
  onPitch: (p) => update(writePitch(st, p)),
  onCommand: (c) => update(apply(st, c, performance.now())),
  onTuplet: (n) => update(setTuplet(st, n)),
  onInputKey: (f) => update(setInputKey(st, f)),
  onImpro: (on) => { impro = on; renderStatus(); },
  onSoundDown: (p) => sound.down(p),
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
const durName = (d: number) => DUR_NAME[d] ?? `${+(d / TPQ).toFixed(3)} 拍`;
function renderStatus(): void {
  const el = $("status"), fills = barFill(st.song), off = fills.slice(1).filter((f) => !f.full).length;
  let s = impro ? "弹（只唱不写）" : st.sel ? `改 · 选中 ${st.sel.to - st.sel.from} 个` : "写";
  const i = st.sel ? st.sel.from : currentIndex(st);
  if (i >= 0 && (!st.sel || st.sel.to - st.sel.from === 1)) {
    const t = st.song.tokens[i];
    if (t.kind === "rest") s += ` · 休止 · ${durName(t.dur)}`;
    else if (t.kind === "note") s += ` · ${(t as NoteTok).pitch ? pitchName((t as NoteTok).pitch!) : "（音高空着）"} · ${durName(t.dur)}${t.tie ? " · 连着前一个" : ""}` +
      `${(t as NoteTok).lyric ? ` · ${(t as NoteTok).lyric === MELISMA_MARK ? "拖腔" : (t as NoteTok).lyric}` : ""}`;
    else if (t.kind === "key") s += ` · 调号 1=${KEY_NAMES[t.fifths]}`;
  } else if (!st.song.tokens.length) s += " · 打 1–7 写音，点谱下面写歌词";
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
  return /\p{Script=Han}/u.test(ls) && !/[぀-ヿ]/.test(ls) ? "zh" : "ja";
}
async function togglePlay(): Promise<void> {
  if (singer.playing) { singer.stop(); playIcon(false); singStatus(""); return; }
  if (singing) return;
  const score = toLabScore(st.song, songLang());
  if (!score.SCORE.length) { singStatus("还没有音"); return; }
  singer.unlock();   // 在用户手势里先把声音打开（iPad）
  singing = true; $("playBtn").classList.add("is-on");
  try {
    const r = await singer.sing(score, (stage) => singStatus(`${stage}…`));
    singStatus(`唱 ${(r.samples.length / r.sr).toFixed(1)} 秒（准备 ${(r.ms.load / 1000).toFixed(1)} s，合成 ${(r.ms.sing / 1000).toFixed(1)} s）`);
    singer.play(r, () => { playIcon(false); });
    playIcon(true);
  } catch (e) {
    singStatus(`月读唱不出来：${(e as Error).message}`);
  } finally { singing = false; $("playBtn").classList.remove("is-on"); }
}
$("playBtn").addEventListener("click", () => { void togglePlay(); });
// 测试用口子（Playwright 逐样本比对浏览器 == Node 时用）
(window as unknown as Record<string, unknown>).__moonsinger = { singer, labScore: () => toLabScore(st.song, songLang()), state: () => st };

// ── 顶栏 ────────────────────────────────────────────────────────────────
$<HTMLSelectElement>("keySel").addEventListener("change", (e) => { update(setSongMeta(st, { fifths: Number((e.target as HTMLSelectElement).value) })); scoreEl.focus(); });
$<HTMLSelectElement>("keyIns").addEventListener("change", (e) => { const v = (e.target as HTMLSelectElement).value; (e.target as HTMLSelectElement).value = ""; if (v !== "") update(writeKey(st, Number(v))); scoreEl.focus(); });
$<HTMLSelectElement>("timeSel").addEventListener("change", (e) => { update(setSongMeta(st, { beats: Number((e.target as HTMLSelectElement).value) })); scoreEl.focus(); });
$<HTMLInputElement>("tempoIn").addEventListener("change", (e) => { const v = Number((e.target as HTMLInputElement).value); if (v >= 30 && v <= 240) update(setSongMeta(st, { tempo: v })); });
$<HTMLSelectElement>("humSel").addEventListener("change", (e) => { update(setSongMeta(st, { hum: (e.target as HTMLSelectElement).value as Hum })); scoreEl.focus(); });
$("padBtn").addEventListener("click", () => { padEl.hidden = !padEl.hidden; $("padBtn").classList.toggle("is-on", !padEl.hidden); view.render(); });

// ── 键盘（输入框里打字时不接） ─────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  const t = e.target as HTMLElement;
  if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
  if (e.code === "Backquote" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); pad.toggleImpro(); return; }
  const c = commandFor(e);
  if (!c) return;
  e.preventDefault();
  if (c.k === "play") { void togglePlay(); return; }
  if (e.repeat && c.k === "degree") return;
  if (impro && c.k === "degree") {   // 即兴：只唱不写（在草稿状态上写一下，拿到那个音高就扔）
    const probe = apply({ ...st, sel: null, log: [] }, c, performance.now());
    soundTok(probe, probe.caret - 1);
    return;
  }
  // 写 = 光标前那个新音；改 = 被覆盖的那个音（旧选中里的第一个音）
  let target = -1;
  if (c.k === "degree" && st.sel) for (let k = st.sel.from; k < st.sel.to; k++) if (st.song.tokens[k].kind === "note") { target = k; break; }
  const next = apply(st, c, performance.now());
  update(next);
  if (c.k === "degree") soundTok(next, target >= 0 ? target : next.caret - 1);
});
window.addEventListener("keyup", (e) => { if (/^(Digit[1-7]|Key[QWERTYU]|Numpad[1-7])$/.test(e.code)) sound.up(); });

await document.fonts.load(`40px Bravura`).catch(() => undefined);
view.render();
pad.render();
renderStatus();
scoreEl.focus();
