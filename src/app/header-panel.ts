// header-panel.ts —— 谱头面板：谱号 / 调号 / 拍号 / 速度在同一个面板里设（v0.16.8）。
// created 2026-11-07 by Claude Opus 5.5。user 11-07「调号就开头的调号、拍号和谱号，他们是同一个碰撞箱子你点进去之后，三个都可以设」「速度也要放进谱头面板。
//   这样的话，用户点进去就知道要设置，然后他们就是碰撞箱都是进同一个面板」「谱号那里你那一大堆很闪的按钮也可以搜一下，比如搜成一个下拉框」。
// 一处 = 谱号 / 调号 / 拍号 / 速度挨在一起的那一小串（song.ts headerSpot）：纸开头那一处 = 这张纸从头的设置（调号 / 拍号 / 速度去不掉，谱号多一档「跟声部」）；
//   中途的 = 从这里起的变化（每样多一档「不变」，整处能删）。点谱上的谱号 / 调号 / 拍号 / 速度、符号层「记号」页、空白处菜单都开它。
//   改一样 = 一步撤销、面板不收，接着改别的。数据操作全在 song.ts（setHeaderAt），这里只管界面。
//   速度（v0.16.12）：这一行只是一颗钮，写着现在的速度，点了 = 原来那个速度框（拨速度的滚轮 + 速度词 + 小节拍器 + 「确定」才写进谱；src/ui/mark-editor.ts）。
//   v0.16.8 曾把速度做成这里的数字框 + 下拉、改了马上写，原来的速度框就打不开了——user 11-07「speed没叫你丢之前的窗口啊」（10-07 要的「有一个确认按钮才commit，这样你可以试哪个对」也跟着丢了）。
import { _t } from "../i18n/index.ts";
import { dropdownHtml, mountDropdowns } from "../ui/dropdown.ts";
import { type EditorState, type Token, type ClefName, CLEFS, tempoWord, headerSpot, headerVals, setHeaderAt, setPaperHeadMinor, keyAt, keyMinorAt, timeAt, tempoAt, setClefChoice, setPaperLook, type ClefChoice, setPartHost, type HeaderSpot, type HeaderPatch } from "../score/song.ts";
import { setPartChords } from "../score/song-view.ts";
import { lookOf, clefChoiceOf, type LookContext } from "../look/index.ts";
import { CLEF_LABEL } from "../score/clef.ts";
import { KEY_LABEL, MINOR_LABEL, keyText } from "../score/pitch.ts";

const KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
const TIMES: [number, number][] = [[2, 4], [3, 4], [4, 4], [5, 4], [3, 8], [6, 8], [9, 8], [12, 8], [7, 8], [2, 2]];
const BEAT_TYPES = new Set([1, 2, 4, 8, 16, 32]);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** 下拉的一项（7-T：原来是原生下拉框的一项，现在交给界面零件库的下拉标准件）。on = 现在选着的。 */
type Opt = { value: string; label: string; on: boolean };
const opt = (value: string, label: string, on: boolean): Opt => ({ value, label, on });
/** 一个下拉：选项 + 现在选着的那个；attrs = data-hp（下面的 change 靠它认是哪一个）。 */
const sel = (list: readonly Opt[], attrs: string, title?: string, disabled?: boolean): string =>
  dropdownHtml(list.map(({ value, label }) => ({ value, label })), (list.find((o) => o.on) ?? list[0]!).value, { cls: "hp-sel", attrs, ...(title ? { title } : {}), ...(disabled ? { disabled } : {}) });
/** 「a 小调」的 a（小写 = 小调的写法）。 */
const minorName = (f: number) => { const s = MINOR_LABEL[f] ?? "?"; return s.charAt(0).toLowerCase() + s.slice(1); };
const accText = (f: number) => (f === 0 ? _t("没有升降号") : f > 0 ? _t("{n} 个升号", { n: f }) : _t("{n} 个降号", { n: -f }));
/** 「6/8」→ 拍号；不像拍号 = null。 */
export function parseTime(s: string): { beats: number; beatType: number } | null {
  const m = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/.exec(s); if (!m) return null;
  const beats = Number(m[1]), beatType = Number(m[2]);
  return beats >= 1 && beats <= 32 && BEAT_TYPES.has(beatType) ? { beats, beatType } : null;
}

export interface HeaderPanelGlue {
  state(): EditorState;
  /** 这台设备的习惯（第 18 条；lookOf 的「当时的情况」，和谱面同一份）。 */
  lookCtx(): LookContext;
  update(st: EditorState): void;
  /** 改「这首歌怎么看」（这条轨的和弦选项）：宿主走 setSongLook（修改锁的看法，锁着也能切；谱面分家第三刀）。label = 撤销提示里的话。 */
  updateLook(st: EditorState, label: string): void;
  /** 宿主的小菜单（main.ts ctxMenu）：点 [data-v] 的钮 = pick；点外面 = 收。 */
  menu(cls: string, html: string, at: { x: number; y: number }, pick: (v: string) => boolean | void): void;
  /** 「自动」这一档现在挑的是什么（「低音」「大谱表」…；v0.16.88 按段算）。 */
  autoNow(paperId: string, partId: string): string;
  /** 这一段这个声部最后画成几行（自动八度线那一行只在一行时出现）。 */
  look(paperId: string, partId: string): { staves: 1 | 2; autoOtt: boolean } | undefined;
  /** 打开原来的速度框：那张纸那位歌手那条上第 index 个 token（速度记号）；fresh = 刚插进去的（速度框里不改就收起 = 撤掉）。 */
  openTempo(paperId: string, partId: string, index: number, fresh: boolean): void;
  /** 歌手的名字（合租那一行的选项用）。 */
  partName(partId: string): string;
  /** 这一行没有调（打击乐的行，7-R）：回为什么；有调 = null。调号那一格灰着、写这一句；拍号 / 速度照旧；调号 token 在数据里留着。 */
  noKey(partId: string): string | null;
}

export function createHeaderPanel(g: HeaderPanelGlue): { open(paperId: string, partId: string, index: number, at: { x: number; y: number }): void } {
  const track = (paperId: string, partId: string): Token[] => g.state().song.papers.find((p) => p.id === paperId)?.tracks[partId] ?? [];
  return {
    open(paperId, partId, index, at) {
      let spot: HeaderSpot = headerSpot(track(paperId, partId), index), timeText = false, modeNote = "";
      const html = (): string => {
        const toks = track(paperId, partId), v = headerVals(toks, spot), head = spot.head, noKey = g.noKey(partId);
        const bk = keyAt(toks, spot.a), bm = keyMinorAt(toks, spot.a), bt = timeAt(toks, spot.a), bb = tempoAt(toks, spot.a);
        // 开头那一处（v0.16.88，user 11-09「可以高音低音grand用户每个sheet选」「一开始是auto」）：自动 / 六个谱号 / 大谱表，管「这个声部在这一段」；中途的只有六个谱号
        const paper = g.state().song.papers.find((p) => p.id === paperId), choice: ClefChoice = paper ? clefChoiceOf(paper, partId) : "auto", lk = g.look(paperId, partId);
        const clefOpts = head ? [opt("auto", _t("自动（现在：{p}）", { p: g.autoNow(paperId, partId) }), choice === "auto"), ...CLEFS.map((c) => opt(c, CLEF_LABEL[c], choice === c)), opt("grand", _t("大谱表（上高音下低音）"), choice === "grand")]
          : [opt("", _t("不变"), v.clef === null), ...CLEFS.map((c) => opt(c, CLEF_LABEL[c], v.clef === c))];
        const aoRow = head && lk?.staves !== 2 ? `<span class="hp-k">${_t("自动八度线")}</span>${sel([opt("on", _t("开"), lk?.autoOtt !== false), opt("off", _t("关"), lk?.autoOtt === false)], 'data-hp="ao"', _t("一串很高 / 很低的音（每个都要三条以上加线）自动画 8va / 15ma / 8vb；手写的说了算，不存进谱。只管这一段"))}` : "";
        // 调号一项 = 一对关系大小调（v0.16.83，user 11-09「关系大小调对齐，免得没有乐理常识选错了，然后切换大小调会很方便」）；下面一行两格选大调 / 小调
        const keyOpts = [...(head ? [] : [opt("", _t("不变（{k}）", { k: keyText(bk, bm) }), v.key === null)]),
          ...KEY_ORDER.map((f) => opt(String(f), `1=${KEY_LABEL[f]} · 6=${MINOR_LABEL[f]}（${accText(f)}）`, v.key === f))];
        const kf = v.key ?? bk, minor = v.minor ?? bm;
        const modeRow = `<span class="hp-k"></span><span class="hp-v hp-seg">` +
          `<button class="btn${minor ? "" : " is-on"}" data-v="major" title="${_t("和弦级数从 do 数（1 = do）")}">${_t("{k} 大调", { k: KEY_LABEL[kf] ?? "?" })}</button>` +
          `<button class="btn${minor ? " is-on" : ""}" data-v="minor" title="${_t("和弦级数从 la 数（a 小调里 Am = i）；音和升降号不变")}">${_t("{k} 小调", { k: minorName(kf) })}</button></span>` +
          (modeNote ? `<span class="hp-k"></span><span class="hp-v hp-note">${esc(modeNote)}</span>` : "");
        const tv = v.time ? `${v.time.beats}/${v.time.beatType}` : "", inList = !v.time || TIMES.some(([b, t]) => `${b}/${t}` === tv);
        const timeOpts = [...(head ? [] : [opt("", _t("不变（{t}）", { t: `${bt.beats}/${bt.beatType}` }), v.time === null)]),
          ...TIMES.map(([b, t]) => opt(`${b}/${t}`, `${b}/${t}`, tv === `${b}/${t}`)), ...(inList ? [] : [opt(tv, tv, true)]), opt("other", _t("其他…（自己写）"), false)];
        const any = v.clef !== null || v.key !== null || v.time !== null || v.tempo !== null;
        return `<div class="ctx-hint ctx-what">${head ? _t("这张纸开头：从头开始的谱号 / 调号 / 拍号 / 速度。只管这一个声部这一段（开头的速度整张纸一起）。") : _t("从这里起的变化（「不变」= 跟前面一样）。")}</div>` +
          `<div class="hp-grid">` +
          `<span class="hp-k">${_t("谱号")}</span>${sel(clefOpts, 'data-hp="clef"', _t("只管画，音高不变"))}` + aoRow +
          (noKey ? `<span class="hp-k">${_t("调号")}</span>${sel(keyOpts, 'data-hp="key"', noKey, true)}<span class="hp-k"></span><span class="hp-v hp-note">${esc(noKey)}</span>`
            : `<span class="hp-k">${_t("调号")}</span>${sel(keyOpts, 'data-hp="key"', _t("改调号 = 它管的音按新调号拼写，音高不变"))}` + modeRow) +
          `<span class="hp-k">${_t("拍号")}</span><span class="hp-v">${sel(timeOpts, 'data-hp="time"')}` +
            (timeText ? `<input class="hp-in" data-hp="timeText" type="text" inputmode="numeric" placeholder="5/8" value="${esc(tv)}" spellcheck="false" autocomplete="off" />` : "") + `</span>` +
          `<span class="hp-k">${_t("速度")}</span><span class="hp-v"><button class="btn hp-tempo" data-v="tempo" title="${_t("打开速度框：拨速度、选速度词、看小节拍器，按「确定」才写进谱")}">` +
            (v.tempo !== null ? `♩=${v.tempo} ${esc(tempoWord(v.tempo).it)}` : esc(_t("不变（♩={n}）· 在这里换…", { n: bb }))) + `</button></span>` +
          `</div>` + (head ? partHtml() : "") + (!head && any ? `<div class="ctx-sep"></div><button class="btn ctx-item danger" data-v="del">${_t("删掉这里的变化")}</button>` : "");
      };
      // 这位歌手整首都算的（v0.16.16 搬家 A；v0.16.88 谱表 / 默认谱号 / 自动八度线搬到上面按段选，user 11-09「后面四个选项应该没有，收到前面的per sheet而不是跟着歌手。只有shared staves有」）：
      //   只剩分解和弦认不认、合租（画在谁的谱线上）。只在纸开头那一处出现。
      const partHtml = (): string => {
        const song = g.state().song, me = song.parts.find((p) => p.id === partId); if (!me) return "";
        const tenants = song.parts.some((p) => p.host === me.id), hosts = song.parts.filter((p) => p.id !== me.id && !p.host);
        return `<div class="ctx-sep"></div><div class="ctx-hint hp-sec">${_t("「{name}」的谱（整首都算）", { name: esc(g.partName(partId)) })}</div><div class="hp-grid">` +
          `<span class="hp-k">${_t("分解和弦")}</span>${sel([opt("on", _t("认"), lookOf(song, g.lookCtx()).chordsOf(partId) === "auto"), opt("off", _t("不认"), lookOf(song, g.lookCtx()).chordsOf(partId) === "stacked"), opt("fold", _t("认，叠着的折叠成和弦名"), lookOf(song, g.lookCtx()).chordsOf(partId) === "fold")], 'data-hp="broken"', _t("拆开弹的和弦（一拍 / 半小节 / 一小节里的音凑成一个和弦）要不要标级数；叠在一起的和弦照旧标。「折叠」= 简谱里叠着的和弦写成和弦名（照名字的标准排法还原得回才折，不然照写数字）"))}` +
          // 文件里写着、但不成立的合租（第 16 条「断了要看得见」，统筹 11-12：在人会去修它的地方写清）：照没有合租来画，这里写原来挂在谁上、那位不在
          (song.parts.length > 1 ? `<span class="hp-k">${_t("合租")}</span>` + (tenants ? `<span class="hp-v hp-note">${_t("有别的声部挂在这一行上（它是主人），不能再去挂别人")}</span>`
            : sel([opt("", _t("自己一行"), !me.host && !me.hostBroken), ...(me.hostBroken ? [opt(me.hostBroken, _t("{key}（断了）", { key: me.hostBroken }), true)] : []), ...hosts.map((p) => opt(p.id, _t("挂在「{name}」上", { name: g.partName(p.id) }), me.host === p.id))], 'data-hp="host"', _t("挂在别人的谱线上画（合租：只看个大概，音撞在一起就撞；只画音，不画休止 / 歌词 / 力度；点名字 = 拆开来写）"))) : "") +
          (me.hostBroken ? `<span class="hp-k"></span><span class="hp-v hp-note hp-broken">${esc(_t("断了：文件里写着挂在「{id}」上，这一首里没有这位（或那位自己也挂在别人上）。现在照自己一行画；上面选一个就改掉", { id: me.hostBroken }))}</span>` : "") +
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
        if (v === "major" || v === "minor") {   // 纸开头 = 这一段调号一样的声部一起切（照实说碰了几行）；中途的那一处 = 只这一行（没写调号 = 补一个同样的调号）
          const want = v === "minor", st = g.state(), toks = track(paperId, partId);
          if (spot.head) {
            const r = setPaperHeadMinor(st, paperId, partId, want); if (r.n === 0) return true;
            g.update(r.st); modeNote = r.n > 1 ? _t("这一段调号一样的 {n} 个声部一起改了", { n: r.n }) : "";
            spot = headerSpot(track(paperId, partId), spot.a); render(); return true;
          }
          const cur = headerVals(toks, spot); modeNote = "";
          apply(cur.key === null ? { key: keyAt(toks, spot.a), minor: want } : { minor: want });
          return true;
        }
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
      mountDropdowns(box);
      const render = (): void => { if (box.isConnected) { box.innerHTML = html(); mountDropdowns(box); } };
      box.addEventListener("change", (e) => {
        const el = e.target as HTMLButtonElement | HTMLInputElement, k = el.dataset.hp; if (!k) return;   // 下拉（一颗按钮，7-T）或拍号的输入框
        if (k === "clef" && spot.head) commit(setClefChoice(g.state(), paperId, partId, el.value as ClefChoice));
        else if (k === "clef") apply({ clef: el.value ? (el.value as ClefName) : null });
        else if (k === "key") apply({ key: el.value === "" ? null : Number(el.value) });
        else if (k === "time") {
          if (el.value === "other") { timeText = true; render(); box.querySelector<HTMLInputElement>('[data-hp="timeText"]')?.focus(); return; }
          apply({ time: el.value === "" ? null : parseTime(el.value) });
        } else if (k === "timeText") { const t = parseTime(el.value); if (t) { timeText = false; apply({ time: t }); } else el.classList.add("bad"); }
        else if (k === "ao") commit(setPaperLook(g.state(), paperId, partId, { autoOttava: el.value === "on" }));
        else if (k === "broken") { const mode = el.value === "fold" ? "fold" : el.value === "on" ? "auto" : "stacked", next = setPartChords(g.state(), partId, mode); if (next !== g.state()) { g.updateLook(next, mode === "fold" ? _t("分解和弦：认，叠着的折叠成和弦名") : mode === "auto" ? _t("分解和弦：认") : _t("分解和弦：不认")); spot = headerSpot(track(paperId, partId), spot.a); render(); } }   // 这条轨的和弦选项 = 这首歌怎么看（修改锁的看法；第三刀）
        else if (k === "host") commit(setPartHost(g.state(), partId, el.value || null));
      });
    },
  };
}
