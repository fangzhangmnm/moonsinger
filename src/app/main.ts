// main.ts —— 试验页接线：顶栏 / 谱面板 / pad / 歌词条 / 键盘。created 2026-10-06 by Claude Opus 5.5
// 第一版（grill 账本 §8½）：内存态，刷新就清空（不做存档、不做撤销）；播放 = 月读在浏览器里唱（src/singer/，和 Lab 命令行共用一份唱法核心）。

import { APP_VERSION } from "../version.ts";
import { type EditorState, type NoteTok, initState, writePitch, setSongMeta, currentIndex, barFill, TPQ } from "../score/song.ts";
import { pitchName } from "../score/pitch.ts";
import { commandFor } from "../score/keymap.ts";
import { apply } from "../score/commands.ts";
import { applyLyricLine, MELISMA_MARK } from "../score/lyrics.ts";
import { ScoreView } from "../ui/score-view.ts";
import { Pad } from "../ui/pad.ts";
import { toLabScore } from "../score/lab-score.ts";
import { Singer } from "../singer/client.ts";

let st: EditorState = setSongMeta(initState(), { fifths: 0, beats: 4, beatType: 4, tempo: 90 });

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const bar = $("bar"), scoreEl = $("score"), padEl = $("padPanel"), lyricBar = $("lyricBar");

const KEYS: [number, string][] = [[0, "1=C"], [1, "1=G（1♯）"], [2, "1=D（2♯）"], [3, "1=A（3♯）"], [4, "1=E（4♯）"], [5, "1=B（5♯）"], [6, "1=F♯（6♯）"],
  [-1, "1=F（1♭）"], [-2, "1=B♭（2♭）"], [-3, "1=E♭（3♭）"], [-4, "1=A♭（4♭）"], [-5, "1=D♭（5♭）"], [-6, "1=G♭（6♭）"]];

bar.innerHTML =
  `<span class="title">MoonSinger</span><span class="ver">${APP_VERSION}</span>` +
  `<label class="field">调<select id="keySel">${KEYS.map(([f, s]) => `<option value="${f}">${s}</option>`).join("")}</select></label>` +
  `<label class="field">拍号<select id="timeSel"><option value="2">2/4</option><option value="3">3/4</option><option value="4" selected>4/4</option></select></label>` +
  `<label class="field">速度<input id="tempoIn" type="number" min="30" max="240" value="90" /></label>` +
  `<span class="spacer"></span><span id="singStatus" class="status sing"></span><span id="status" class="status"></span>` +
  `<button id="padBtn" class="btn is-on" title="手指 pad"><svg class="ico"><use href="#grid"/></svg></button>` +
  `<button id="playBtn" class="btn" title="月读唱 / 停（空格）"><svg class="ico"><use href="#play"/></svg></button>`;

lyricBar.innerHTML =
  `<input id="lyricIn" type="text" autocomplete="off" spellcheck="false" placeholder="歌词：打一行，回车贴到谱上（从光标后的音开始；ー = 拖腔）" />` +
  `<button id="lyricBtn" class="btn">贴上</button>`;

const view = new ScoreView(scoreEl, { get: () => st, set: (n) => update(n) });
const pad = new Pad(padEl, {
  fifths: () => st.song.fifths,
  onPitch: (p) => update(writePitch(st, p)),
  onCommand: (c) => update(apply(st, c)),
});

function update(next: EditorState): void {
  if (next === st) return;
  st = next;
  view.render();
  renderStatus();
}

const DUR_NAME: Record<number, string> = { [TPQ * 4]: "全音符", [TPQ * 3]: "附点二分", [TPQ * 2]: "二分", [TPQ * 1.5]: "附点四分", [TPQ]: "四分",
  [TPQ * 0.75]: "附点八分", [TPQ / 2]: "八分", [TPQ * 3 / 8]: "附点十六分", [TPQ / 4]: "十六分", [TPQ / 8]: "三十二分" };
function renderStatus(): void {
  const i = currentIndex(st), el = $("status");
  const fills = barFill(st.song), off = fills.slice(1).filter((f) => !f.full).length;
  let s = "";
  if (i >= 0) {
    const t = st.song.tokens[i];
    const dn = t.kind !== "bar" ? (DUR_NAME[t.dur] ?? `${t.dur / TPQ} 拍`) : "";
    s = t.kind === "rest" ? `休止 · ${dn}` : t.kind === "note"
      ? `${(t as NoteTok).pitch ? pitchName((t as NoteTok).pitch!) : "（音高空着）"} · ${dn}${(t as NoteTok).lyric ? ` · ${(t as NoteTok).lyric === MELISMA_MARK ? "拖腔" : (t as NoteTok).lyric}` : ""}` : "";
  } else s = st.song.tokens.length ? "开头" : "打 1–7 写音，| 或回车插小节线";
  if (off) s += ` · ${off} 个小节拍数和拍号对不上（只提示）`;
  el.textContent = s;
}

// 播放：月读唱（第一次要加载引擎，之后复用）
const singer = new Singer();
let singing = false;
const singStatus = (s: string) => { $("singStatus").textContent = s; };
const playIcon = (stop: boolean) => { $("playBtn").innerHTML = `<svg class="ico"><use href="#${stop ? "stop" : "play"}"/></svg>`; };
/** 歌词里有汉字、没有假名 → 按中文唱；其余（含没有歌词）按日语唱。 */
function songLang(): "ja" | "zh" {
  const ls = st.song.tokens.flatMap((t) => (t.kind === "note" && t.lyric ? [t.lyric] : [])).join("");
  return /\p{Script=Han}/u.test(ls) && !/[\u3040-\u30ff]/.test(ls) ? "zh" : "ja";
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
(window as unknown as Record<string, unknown>).__moonsinger = { singer, labScore: () => toLabScore(st.song, songLang()) };

// 顶栏
$<HTMLSelectElement>("keySel").addEventListener("change", (e) => { update(setSongMeta(st, { fifths: Number((e.target as HTMLSelectElement).value) })); pad.render(); scoreEl.focus(); });
$<HTMLSelectElement>("timeSel").addEventListener("change", (e) => { update(setSongMeta(st, { beats: Number((e.target as HTMLSelectElement).value) })); scoreEl.focus(); });
$<HTMLInputElement>("tempoIn").addEventListener("change", (e) => { const v = Number((e.target as HTMLInputElement).value); if (v >= 30 && v <= 240) update(setSongMeta(st, { tempo: v })); });
$("padBtn").addEventListener("click", () => { padEl.hidden = !padEl.hidden; $("padBtn").classList.toggle("is-on", !padEl.hidden); view.render(); });

// 歌词条
const lyricIn = $<HTMLInputElement>("lyricIn");
const commitLyric = () => { const v = lyricIn.value; if (!v.trim()) return; update(applyLyricLine(st, v)); lyricIn.value = ""; scoreEl.focus(); };
lyricIn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); commitLyric(); }
  else if (e.key === "Escape") { e.preventDefault(); scoreEl.focus(); }
});
$("lyricBtn").addEventListener("click", commitLyric);

// 键盘（输入框里打字时不接）
window.addEventListener("keydown", (e) => {
  const t = e.target as HTMLElement;
  if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
  const c = commandFor(e);
  if (!c) return;
  e.preventDefault();
  if (c.k === "play") { void togglePlay(); return; }
  update(apply(st, c));
});

await document.fonts.load(`40px Bravura`).catch(() => undefined);
view.render();
renderStatus();
scoreEl.focus();
