// header-panel.ts —— 谱头面板：谱号 / 调号 / 拍号 / 速度在同一个面板里设（v0.16.8）。
// created 2026-11-07 by Claude Opus 5.5。user 11-07「调号就开头的调号、拍号和谱号，他们是同一个碰撞箱子你点进去之后，三个都可以设」「速度也要放进谱头面板。
//   这样的话，用户点进去就知道要设置，然后他们就是碰撞箱都是进同一个面板」「谱号那里你那一大堆很闪的按钮也可以搜一下，比如搜成一个下拉框」。
// 一处 = 谱号 / 调号 / 拍号 / 速度挨在一起的那一小串（song.ts headerSpot）：纸开头那一处 = 这张纸从头的设置（调号 / 拍号 / 速度去不掉，谱号多一档「跟声部」）；
//   中途的 = 从这里起的变化（每样多一档「不变」，整处能删）。点谱上的谱号 / 调号 / 拍号 / 速度、符号层「记号」页、空白处菜单都开它。
//   改一样 = 一步撤销、面板不收，接着改别的。数据操作全在 song.ts（setHeaderAt），这里只管界面。
//   速度（v0.16.12）：这一行只是一颗钮，写着现在的速度，点了 = 原来那个速度框（拨速度的滚轮 + 速度词 + 小节拍器 + 「确定」才写进谱；src/ui/mark-editor.ts）。
//   v0.16.8 曾把速度做成这里的数字框 + 下拉、改了马上写，原来的速度框就打不开了——user 11-07「speed没叫你丢之前的窗口啊」（10-07 要的「有一个确认按钮才commit，这样你可以试哪个对」也跟着丢了）。
import { _t } from "../i18n/index.ts";
import { type EditorState, type Token, type ClefName, CLEFS, tempoWord, headerSpot, headerVals, setHeaderAt, keyAt, timeAt, tempoAt, setPartStaves, setPartClef, setPartAutoOttava, setPartHost, type HeaderSpot, type HeaderPatch } from "../score/song.ts";
import { CLEF_LABEL } from "../score/clef.ts";
import { KEY_LABEL } from "../score/pitch.ts";

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
  /** 打开原来的速度框：那张纸那位歌手那条上第 index 个 token（速度记号）；fresh = 刚插进去的（速度框里不改就收起 = 撤掉）。 */
  openTempo(paperId: string, partId: string, index: number, fresh: boolean): void;
  /** 歌手的名字（合租那一行的选项用）。 */
  partName(partId: string): string;
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
        const any = v.clef !== null || v.key !== null || v.time !== null || v.tempo !== null;
        return `<div class="ctx-hint ctx-what">${head ? _t("这张纸开头：从头开始的谱号 / 调号 / 拍号 / 速度。只管这一位歌手这一张纸（开头的速度整张纸一起）。") : _t("从这里起的变化（「不变」= 跟前面一样）。")}</div>` +
          `<div class="hp-grid">` +
          `<span class="hp-k">${_t("谱号")}</span><select class="hp-sel" data-hp="clef" title="${_t("只管画，音高不变")}">${clefOpts}</select>` +
          `<span class="hp-k">${_t("调号")}</span><select class="hp-sel" data-hp="key" title="${_t("改调号 = 它管的音按新调号拼写，音高不变")}">${keyOpts}</select>` +
          `<span class="hp-k">${_t("拍号")}</span><span class="hp-v"><select class="hp-sel" data-hp="time">${timeOpts}</select>` +
            (timeText ? `<input class="hp-in" data-hp="timeText" type="text" inputmode="numeric" placeholder="5/8" value="${esc(tv)}" spellcheck="false" autocomplete="off" />` : "") + `</span>` +
          `<span class="hp-k">${_t("速度")}</span><span class="hp-v"><button class="btn hp-tempo" data-v="tempo" title="${_t("打开速度框：拨速度、选速度词、看小节拍器，按「确定」才写进谱")}">` +
            (v.tempo !== null ? `♩=${v.tempo} ${esc(tempoWord(v.tempo).it)}` : esc(_t("不变（♩={n}）· 在这里换…", { n: bb }))) + `</button></span>` +
          `</div>` + (head ? partHtml() : "") + (!head && any ? `<div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">${_t("删掉这里的变化")}</button>` : "");
      };
      // 这位歌手的谱（整首都算；v0.16.16 搬家 A：从歌手名小卡搬来——user 11-07「谱号谱表自动八度线合租…这些和歌手没关系…这些显示相关的，是不是全都可以收到这里面？」）
      //   一张谱 / 大谱表、默认谱号（「跟声部」那一档指的就是它）、自动八度线、合租（画在谁的谱线上）。只在纸开头那一处出现。
      const partHtml = (): string => {
        const song = g.state().song, me = song.parts.find((p) => p.id === partId); if (!me) return "";
        const opt = (value: string, label: string, on: boolean) => `<option value="${esc(value)}"${on ? " selected" : ""}>${esc(label)}</option>`;
        const one = (me.staves ?? 1) === 1, tenants = song.parts.some((p) => p.host === me.id), hosts = song.parts.filter((p) => p.id !== me.id && !p.host);
        return `<div class="ctx-sep"></div><div class="ctx-hint hp-sec">${_t("「{name}」的谱（整首都算）", { name: esc(g.partName(partId)) })}</div><div class="hp-grid">` +
          `<span class="hp-k">${_t("谱表")}</span><select class="hp-sel" data-hp="staves">${opt("1", _t("一张"), one)}${opt("2", _t("大谱表（上高音下低音）"), !one)}</select>` +
          (one ? `<span class="hp-k">${_t("默认谱号")}</span><select class="hp-sel" data-hp="pclef" title="${_t("每张纸开头「跟声部」用的就是它；自动 = 按每张纸的音挑加线最省的")}">${opt("", _t("自动"), !me.clef)}${CLEFS.map((c) => opt(c, CLEF_LABEL[c], me.clef === c)).join("")}</select>` : "") +
          `<span class="hp-k">${_t("自动八度线")}</span><select class="hp-sel" data-hp="ao" title="${_t("一串很高 / 很低的音（每个都要三条以上加线）自动画 8va / 15ma / 8vb；手写的说了算，不存进谱")}">${opt("on", _t("开"), me.autoOttava !== false)}${opt("off", _t("关"), me.autoOttava === false)}</select>` +
          (song.parts.length > 1 ? `<span class="hp-k">${_t("合租")}</span>` + (tenants ? `<span class="hp-v hp-note">${_t("有别的歌手挂在这一行上（它是主人），不能再去挂别人")}</span>`
            : `<select class="hp-sel" data-hp="host" title="${_t("挂在别人的谱线上画（合租：只看个大概，音撞在一起就撞；只画音，不画休止 / 歌词 / 力度；点名字 = 拆开来写）")}">${opt("", _t("自己一行"), !me.host)}${hosts.map((p) => opt(p.id, _t("挂在「{name}」上", { name: g.partName(p.id) }), me.host === p.id)).join("")}</select>`) : "") +
          `</div>`;
      };
      const commit = (next: EditorState): void => { if (next === g.state()) return; g.update(next); spot = headerSpot(track(paperId, partId), spot.a); render(); };
      const apply = (patch: HeaderPatch): void => {
        const st = g.state(), next = setHeaderAt(st, paperId, partId, spot, patch); if (next === st) return;
        g.update(next);
        spot = headerSpot(track(paperId, partId), spot.a);
        render();
      };
      g.menu("header-panel", html(), at, (v) => {
        if (v === "del") { apply({ clef: null, key: null, time: null, tempo: null }); return false; }
        if (v === "tempo") {   // 速度 = 原来的速度框（面板先收，下一刻开）；这一处还没有速度 = 先插一个当时的速度，速度框里不改就收起 = 撤掉
          const at0 = (): number => { const t = track(paperId, partId); spot = headerSpot(t, spot.a); const k = t.slice(spot.a, spot.b).findIndex((x) => x.kind === "tempo"); return k < 0 ? -1 : spot.a + k; };
          let i = at0(), fresh = false;
          if (i < 0) { const st = g.state(), next = setHeaderAt(st, paperId, partId, spot, { tempo: tempoAt(track(paperId, partId), spot.a) }); if (next !== st) g.update(next); i = at0(); fresh = true; }
          if (i >= 0) setTimeout(() => g.openTempo(paperId, partId, i, fresh), 0);
          return false;
        }
        return true;
      });
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
        else if (k === "staves") commit(setPartStaves(g.state(), partId, el.value === "2" ? 2 : 1));
        else if (k === "pclef") commit(setPartClef(g.state(), partId, el.value ? (el.value as ClefName) : null));
        else if (k === "ao") commit(setPartAutoOttava(g.state(), partId, el.value === "on"));
        else if (k === "host") commit(setPartHost(g.state(), partId, el.value || null));
      });
    },
  };
}
