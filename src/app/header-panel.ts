// header-panel.ts —— 谱头面板：谱号 / 调号 / 拍号 / 速度在同一个面板里设（v0.16.8）。
// created 2026-11-07 by Claude Opus 5.5。user 11-07「调号就开头的调号、拍号和谱号，他们是同一个碰撞箱子你点进去之后，三个都可以设」「速度也要放进谱头面板。
//   这样的话，用户点进去就知道要设置，然后他们就是碰撞箱都是进同一个面板」「谱号那里你那一大堆很闪的按钮也可以搜一下，比如搜成一个下拉框」。
// 一处 = 谱号 / 调号 / 拍号 / 速度挨在一起的那一小串（song.ts headerSpot）：纸开头那一处 = 这张纸从头的设置（调号 / 拍号 / 速度去不掉，谱号多一档「跟声部」）；
//   中途的 = 从这里起的变化（每样多一档「不变」，整处能删）。点谱上的谱号 / 调号 / 拍号 / 速度、符号层「记号」页、空白处菜单都开它。
//   改一样 = 一步撤销、面板不收，接着改别的。数据操作全在 song.ts（setHeaderAt），这里只管界面。
import { _t } from "../i18n/index.ts";
import { type EditorState, type Token, type ClefName, CLEFS, TEMPO_WORDS, TEMPO_MIN, TEMPO_MAX, tempoWord, headerSpot, headerVals, setHeaderAt, keyAt, timeAt, tempoAt, type HeaderSpot, type HeaderPatch } from "../score/song.ts";
import { CLEF_LABEL } from "../score/clef.ts";
import { KEY_LABEL } from "../score/pitch.ts";
import { metroStart, metroStep, type MetroState } from "../ui/metronome.ts";

const KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
const TIMES: [number, number][] = [[2, 4], [3, 4], [4, 4], [5, 4], [3, 8], [6, 8], [9, 8], [12, 8], [7, 8], [2, 2]];
const BEAT_TYPES = new Set([1, 2, 4, 8, 16, 32]);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const accText = (f: number) => (f === 0 ? _t("没有升降号") : f > 0 ? _t("{n} 个升号", { n: f }) : _t("{n} 个降号", { n: -f }));
/** 「6/8」→ 拍号；不像拍号 = null。 */
export function parseTime(s: string): { beats: number; beatType: number } | null {
  const m = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/.exec(s); if (!m) return null;
  const beats = Number(m[1]), beatType = Number(m[2]);
  return beats >= 1 && beats <= 32 && BEAT_TYPES.has(beatType) ? { beats, beatType } : null;
}

export interface HeaderPanelGlue {
  state(): EditorState;
  update(st: EditorState): void;
  /** 宿主的小菜单（main.ts ctxMenu）：点 [data-v] 的钮 = pick；点外面 = 收。 */
  menu(cls: string, html: string, at: { x: number; y: number }, pick: (v: string) => boolean | void): void;
  /** 纸开头那一处谱号「跟声部」那一档写什么（自动：这张纸挑了 X / 指定的 X）。 */
  partClef(paperId: string, partId: string): string;
}

export function createHeaderPanel(g: HeaderPanelGlue): { open(paperId: string, partId: string, index: number, at: { x: number; y: number }): void } {
  const track = (paperId: string, partId: string): Token[] => g.state().song.papers.find((p) => p.id === paperId)?.tracks[partId] ?? [];
  return {
    open(paperId, partId, index, at) {
      let spot: HeaderSpot = headerSpot(track(paperId, partId), index), timeText = false;
      const html = (): string => {
        const toks = track(paperId, partId), v = headerVals(toks, spot), head = spot.head;
        const bk = keyAt(toks, spot.a), bt = timeAt(toks, spot.a), bb = tempoAt(toks, spot.a);
        const opt = (value: string, label: string, on: boolean) => `<option value="${esc(value)}"${on ? " selected" : ""}>${esc(label)}</option>`;
        const clefOpts = (head ? opt("", _t("跟声部（{p}）", { p: g.partClef(paperId, partId) }), v.clef === null) : opt("", _t("不变"), v.clef === null)) +
          CLEFS.map((c) => opt(c, CLEF_LABEL[c], v.clef === c)).join("");
        const keyOpts = (head ? "" : opt("", _t("不变（1={k}）", { k: KEY_LABEL[bk] }), v.key === null)) +
          KEY_ORDER.map((f) => opt(String(f), `1=${KEY_LABEL[f]}（${accText(f)}）`, v.key === f)).join("");
        const tv = v.time ? `${v.time.beats}/${v.time.beatType}` : "", inList = !v.time || TIMES.some(([b, t]) => `${b}/${t}` === tv);
        const timeOpts = (head ? "" : opt("", _t("不变（{t}）", { t: `${bt.beats}/${bt.beatType}` }), v.time === null)) +
          TIMES.map(([b, t]) => opt(`${b}/${t}`, `${b}/${t}`, tv === `${b}/${t}`)).join("") + (inList ? "" : opt(tv, tv, true)) + opt("other", _t("其他…（自己写）"), false);
        const word = v.tempo !== null ? tempoWord(v.tempo).it : null;
        const wordOpts = (head ? "" : opt("", _t("不变"), v.tempo === null)) + TEMPO_WORDS.map((w) => opt(String(w.typical), `${w.it}（${w.zh} ${w.typical}）`, w.it === word)).join("");
        const any = v.clef !== null || v.key !== null || v.time !== null || v.tempo !== null;
        return `<div class="ctx-hint ctx-what">${head ? _t("这张纸开头：从头开始的谱号 / 调号 / 拍号 / 速度。只管这一位歌手这一张纸（开头的速度整张纸一起）。") : _t("从这里起的变化（「不变」= 跟前面一样）。")}</div>` +
          `<div class="hp-grid">` +
          `<span class="hp-k">${_t("谱号")}</span><select class="hp-sel" data-hp="clef" title="${_t("只管画，音高不变")}">${clefOpts}</select>` +
          `<span class="hp-k">${_t("调号")}</span><select class="hp-sel" data-hp="key" title="${_t("改调号 = 它管的音按新调号拼写，音高不变")}">${keyOpts}</select>` +
          `<span class="hp-k">${_t("拍号")}</span><span class="hp-v"><select class="hp-sel" data-hp="time">${timeOpts}</select>` +
            (timeText ? `<input class="hp-in" data-hp="timeText" type="text" inputmode="numeric" placeholder="5/8" value="${esc(tv)}" spellcheck="false" autocomplete="off" />` : "") + `</span>` +
          `<span class="hp-k">${_t("速度")}</span><span class="hp-v"><input class="hp-in hp-bpm" data-hp="bpm" type="number" inputmode="numeric" min="${TEMPO_MIN}" max="${TEMPO_MAX}" value="${v.tempo ?? ""}" placeholder="${head ? "" : String(bb)}" />` +
            `<select class="hp-sel" data-hp="word">${wordOpts}</select><span class="metro" title="${_t("按这个速度摆：摆到一头 = 一拍")}"><span class="metro-arm"></span></span></span>` +
          `</div>` + (!head && any ? `<div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">${_t("删掉这里的变化")}</button>` : "");
      };
      const apply = (patch: HeaderPatch): void => {
        const st = g.state(), next = setHeaderAt(st, paperId, partId, spot, patch); if (next === st) return;
        g.update(next);
        spot = headerSpot(track(paperId, partId), spot.a);
        render();
      };
      g.menu("header-panel", html(), at, (v) => { if (v === "del") { apply({ clef: null, key: null, time: null, tempo: null }); return false; } return true; });
      const box = [...document.querySelectorAll<HTMLElement>(".ctx-menu.header-panel")].pop(); if (!box) return;
      const render = (): void => { if (box.isConnected) box.innerHTML = html(); };
      box.addEventListener("change", (e) => {
        const el = e.target as HTMLSelectElement | HTMLInputElement, k = el.dataset.hp; if (!k) return;
        if (k === "clef") apply({ clef: el.value ? (el.value as ClefName) : null });
        else if (k === "key") apply({ key: el.value === "" ? null : Number(el.value) });
        else if (k === "time") {
          if (el.value === "other") { timeText = true; render(); box.querySelector<HTMLInputElement>('[data-hp="timeText"]')?.focus(); return; }
          apply({ time: el.value === "" ? null : parseTime(el.value) });
        } else if (k === "timeText") { const t = parseTime(el.value); if (t) { timeText = false; apply({ time: t }); } else el.classList.add("bad"); }
        else if (k === "bpm") {
          if (el.value === "") { if (!spot.head) apply({ tempo: null }); return; }
          const n = Math.round(Number(el.value)); if (Number.isFinite(n) && n >= TEMPO_MIN && n <= TEMPO_MAX) apply({ tempo: n }); else el.classList.add("bad");
        } else if (k === "word") apply({ tempo: el.value === "" ? null : Number(el.value) });
      });
      // 节拍器：按这一处现在的速度（「不变」= 前面的）摆；面板收了就停（同原来速度框里那个，src/ui/metronome.ts）
      let ms: MetroState | null = null, last = 0;
      const tick = (now: number): void => {
        if (!box.isConnected) return;
        const toks = track(paperId, partId), bpm = headerVals(toks, spot).tempo ?? tempoAt(toks, spot.a);
        if (!ms) ms = metroStart(bpm);
        ms = metroStep(ms, bpm, last ? Math.min(0.05, (now - last) / 1000) : 0); last = now;
        const arm = box.querySelector<HTMLElement>(".metro-arm"); if (arm) arm.style.transform = `rotate(${ms.th.toFixed(2)}deg)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
  };
}
