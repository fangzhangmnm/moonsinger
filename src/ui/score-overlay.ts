// score-overlay.ts —— 谱面上面那一层：编辑器的钮、框、提示（印出来没有的东西）。created 2026-11-08 by Claude Opus 5.5
// 五线谱显示刀 1（施工单 ai-docs/20261108-work-order-display-cut1-overlay.md；设计稿 ai-docs/20261108-staff-display-design.md §2 ③ / §3）：
//   「印出来没有的东西，一样都不许留在排版器里。」排版器（src/render/engrave.ts）只排可印的谱，吐图元 + 锚点；这里按锚点在谱上面摆 DOM。
//   PDF 不再「减掉名单」——这一层本来就不进 PDF。
// 位置：容器是谱面 .sheet 里的一个 div（score-view 给的 overlayRoot，和 ink 层一样挪到版心），坐标就是排版的 px——缩放（CSS zoom / transform）、分页、横卷都跟着 .sheet 走，不用另算屏幕坐标。
// 每帧一次 layout(L, view)：先把所有元素的位置和样子算成一张表，再一次性写 DOM（按 key 复用元素，不重建；不读布局）。
// 手势：谱面上有一条「单指 touchstart 一律拦」的守卫（platform-guards，防 iPad 放大镜）→ click 不可靠，这里一律走 pointer 事件自己判（同歌词框的「合」）：
//   笔 / 鼠标：按下 = 拿住（谱面不接：score-view 的 down 跳过 .ov-i）；松手还在钮上 = 点；两颗钮长按 420 ms / 右键 = 只看 / 独奏。
//   手指：**不拦**——拖 = 滚动、第二根手指 = 捏合照旧归谱面（score-view 的 down 对 .ov-i 上的手指只管滚 / 捏、不算它自己的轻点；刀 1 之前钮画在谱里就是这个手感）。
//     这里只判：没动（≤ 10 px，同谱面的「手指抖一点也算轻点」）就松手 = 点；按住不动到点 = 长按；动了 / 又落下一根手指 = 不算。谱面把这根手指捕获走了（滚动要用），
//     所以手指的 move / up 在 window 上听（捕获阶段）。edited by Claude Fable 5.1 2026-11-08（审刀 1：v0.16.25 手指落在钮 / 虚线框上滚不动、捏不了；E2E overlay-touch 守）
import { _t } from "../i18n/index.ts";
import { TEXT_FACES, textStyleOf, faceMetrics, boxTopFor, type TextStyle } from "../render/text/index.ts";
import type { Layout, PartToggle, PartToggles } from "../render/engrave.ts";
import type { Song } from "../score/song.ts";

/** 两颗钮（眼睛 / 喇叭）多大（sp）：比纸角的小控件（3.0）大（user 11-08「至少要比那些小扳手、本段这些东西大」「要粗的手指也能点」；E2E part-toggles 守 ≥ 3.1）。 */
export const TG_BTN = 3.0;   // v0.16.33：3.2 → 3.0（user 11-09「眼睛和喇叭稍微再小一点」）；框和纸角钮（CTL_H 3.0）一样大，图标 2.16 仍比纸角钮的 2.0 大（user 11-08「至少要比那些小扳手大」）
const TG_GAP = 0.4, CTL_H = 3.0, CTL_GLYPH = 2.0, CTL_TEXT = 1.4, LONG_MS = 420, TOUCH_SLOP = 10;
const TG_LONG: Record<"hidden" | "muted", PartToggle> = { hidden: "only", muted: "solo" };

export interface OverlayHost {
  toggles(part: string): PartToggles;
  onPartToggle(part: string, kind: PartToggle): void;
  onPaperAdd(paper: string, kind: "part" | "paper", at: { x: number; y: number }): void;
  onPaperMenu(paper: string): void;
  onNavFrom(paper: string, dir: -1 | 1): void;
  onScopeOf(paper: string): void;
  onPaper(): void;
  onCredits(): void;
  onKeyHint(paper: string, part: string, index: number, at: { x: number; y: number }): void;
  onLeaveFamily(paper: string, host: string): void;
  onHidden(paper: string, parts: string[], at: { x: number; y: number }): void;
  /** 「隐藏 N 段」（v0.16.34）：全部视图里隐藏的整张纸不排、不占地方，提醒 = 歌名那一条上一颗不占位的小标；点开一列（去看 / 放出来）。 */
  onHiddenPapers(papers: string[], at: { x: number; y: number }): void;
  /** 「演奏法和表情：不显示」的淡提示（7-G 重做）：点了 = 开页面设置的「看谱」页、落在那一项上。 */
  onFolded(): void;
}
/** 这一帧要知道的谱面状态（排版器不知道的那些）。 */
export interface OverlayView {
  song: Song;
  edit: boolean;          // 能写（不是听 / 定稿）：虚线框、「⋯」、作者栏的提示能点
  marks: boolean;         // 谱上的记号能点（「1=C」= 谱头面板）
  onlyPaper: string | null;   // 本段视图看的那张
  paperLabel: string;     // 纸角小钮的悬停提示「纸：A5」
}

type Item = { key: string; tag: "div" | "button"; cls: string; style: string; html: string; attrs: Record<string, string> };

export class ScoreOverlay {
  private els = new Map<string, HTMLElement>();
  private hiddenPapers: string[] = [];   // 全部视图里隐藏着的整张纸（「隐藏 N 段」点开时用；同上，不走 DOM 属性）
  private hiddenOf = new Map<string, string[]>();   // 纸 → 这张纸上隐藏着的声部（「隐藏 N」点开时用；不走 DOM 属性——编号是文件里读进来的，不保证没有空格 / 引号）
  private press: { el: HTMLElement; pid: number; timer: number; fired: boolean; touch: boolean; x: number; y: number } | null = null;
  constructor(private root: HTMLElement, private host: OverlayHost) {
    root.addEventListener("pointerdown", (e) => this.down(e));
    root.addEventListener("pointerup", (e) => this.up(e));
    root.addEventListener("pointercancel", () => this.cancel());
    // 手指的后半程在 window 上听（谱面为了滚动把这根手指捕获走了，事件不再经过这里）；笔 / 鼠标照旧走上面两条
    const touching = (e: PointerEvent) => (this.press?.touch ? this.press : null);
    window.addEventListener("pointerdown", (e) => { const p = touching(e); if (p && e.pointerId !== p.pid) this.cancel(); }, true);   // 又落下一根手指 = 捏合，不算点
    window.addEventListener("pointermove", (e) => { const p = touching(e); if (p && e.pointerId === p.pid && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TOUCH_SLOP) this.cancel(); }, true);   // 动了 = 滚动，不算点 / 长按
    window.addEventListener("pointerup", (e) => { if (touching(e)) this.up(e); }, true);
    window.addEventListener("pointercancel", (e) => { const p = touching(e); if (p && e.pointerId === p.pid) this.cancel(); }, true);
    root.addEventListener("contextmenu", (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".ov-i"); if (!el) return;
      const fired = !!this.press?.fired;   // 安卓：长按到点已经算过一次，系统随后又发 contextmenu——不算第二次（不然「只看」开了又关）
      e.preventDefault(); e.stopPropagation(); this.cancel();
      if (!fired && el.dataset.ov === "tg") this.host.onPartToggle(el.dataset.part!, TG_LONG[el.dataset.kind as "hidden" | "muted"]);   // 右键 = 长按（只看 / 独奏）
    });
  }

  layout(L: Layout, v: OverlayView): void {
    const items: Item[] = [], sp = L.tp ?? L.sp, px = (n: number) => `${Math.round(n * 100) / 100}px`;   // 钮 / 提示字 / 虚线框的字 = 字的尺子（刀 2：紧凑档不跟着谱缩；位置照排版给的锚点）
    const box = (x: number, y: number, w: number, h: number) => `left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)}`;
    // 把 svg 的「起点 + 基线」换成 div：行高 = 字号，盒顶按这款字真实的上下沿算（文字模块 boxTopFor / faceMetrics，src/render/text/baseline.ts）；字体 / 粗细 / 斜体查样式表（2026-11-09，user「这些字体也应该对齐吧」）
    const text = (x: number, base: number, size: number, anchor: "start" | "middle" | "end" = "start", st: TextStyle = textStyleOf(undefined)) => {
      return `left:${px(x)};top:${px(boxTopFor(base, size, faceMetrics(st)))};font-size:${px(size)};line-height:${px(size)};font-family:${TEXT_FACES[st.face].replace(/"/g, "'")};font-weight:${st.weight};font-style:${st.italic ? "italic" : "normal"};${anchor === "middle" ? "transform:translateX(-50%);" : anchor === "end" ? "transform:translateX(-100%);" : ""}`;
    };
    const add = (key: string, tag: Item["tag"], cls: string, style: string, html = "", attrs: Record<string, string> = {}) => items.push({ key, tag, cls, style, html, attrs });
    const icon = (id: string, size: number) => `<svg class="ov-icon" style="width:${px(size)};height:${px(size)}" aria-hidden="true"><use href="#${id}"/></svg>`;
    const song = v.song, papers = song.papers, multi = papers.length > 1, nameOf = (id: string) => papers.find((p) => p.id === id);
    this.hiddenOf = new Map(L.papers.map((pp) => [pp.id, pp.hiddenParts]));

    // ① 两颗钮：名字块上面，可以超出谱上沿（user 11-08）；一张纸上各位的钮对同一条中线 = 整个名字栏的中间（v0.16.49，user 11-09「眼睛应该对齐」：原来各自对自己的名字居中，名字长短不一就一个比一个偏）
    const colRight = new Map<string, number>();
    for (const n of L.names) { const c = colRight.get(n.paper); colRight.set(n.paper, c === undefined ? n.x1 : Math.max(c, n.x1)); }
    const colLeft = new Map<string, number>();
    for (const n of L.names) { const c = colLeft.get(n.paper); colLeft.set(n.paper, c === undefined ? n.x0 : Math.min(c, n.x0)); }
    for (const n of L.names) {
      const gs = L.sp;   // 两颗钮跟谱的尺子（刀 2 试：user 11-09「紧凑档里两颗钮跟着谱一起缩小三成。试一下」——紧凑档行距小，跟字放大会和上一位的两行名字挤在一起）
      const t = this.host.toggles(n.part), s = TG_BTN * gs, total = (TG_BTN * 2 + TG_GAP) * gs, cx = ((colLeft.get(n.paper) ?? n.x0) + (colRight.get(n.paper) ?? n.x1)) / 2, x0 = Math.max(0.2 * gs, cx - total / 2), y = n.top - 0.35 * gs - s;
      const eye = t.only ? "visibility-only" : t.hidden ? "visibility-hide" : "visibility-show", ear = t.solo ? "volume-solo" : t.muted ? "volume-mute" : "volume";
      const btn = (kind: "hidden" | "muted", k: number, ic: string, st: string, title: string) =>
        add(`tg:${n.paper}:${n.part}:${kind}`, "button", `ov-i ov-tg${st ? ` on ${st}` : ""}`, box(x0 + k * (TG_BTN + TG_GAP) * gs, y, s, s), icon(ic, s * 0.72),
          { "data-ov": "tg", "data-part": n.part, "data-kind": kind, title, "aria-label": title });
      btn("hidden", 0, eye, t.only ? "tg-only" : t.hidden ? "tg-hidden" : "", _t("点 = 隐藏 / 显示；长按（电脑右键）= 只看它"));
      btn("muted", 1, ear, t.solo ? "tg-solo" : t.muted ? "tg-muted" : "", _t("点 = 静音 / 出声；长按（电脑右键）= 独奏"));
    }
    // ② 纸角的小钮（纸的设置）+ 只有一张纸时歌名左边的「⋯」
    { const s = CTL_H * sp, x = L.content.right - s, y = L.title.y + 0.5 * sp;
      add("chip", "button", "ov-i ov-chip ov-paper-chip", box(x, y, s, s), icon("jianpu-staff", CTL_GLYPH * sp), { "data-ov": "chip", title: _t("谱种和纸：{paperLabel}", { paperLabel: v.paperLabel }) }); }   // 「1 / ♪」（user 11-11：一看就知道是切换五线谱和简谱的地方）
    if (!multi && v.edit) add(`menu:${papers[0]!.id}`, "button", "ov-i ov-chip ov-menu", `${box(L.content.left, L.title.y + 0.5 * sp, (CTL_H + 0.6) * sp, CTL_H * sp)};font-size:${px(CTL_GLYPH * sp)}`, "⋯", { "data-ov": "menu", "data-paper": papers[0]!.id, title: _t("这一段的菜单") });
    // ③ 每张纸曲段名那一条：曲段控件组「（隐藏 N）‹ k/n › 只看本段 ⋯」靠右；单纸 = 「隐藏 N」挂在曲段名 / 歌名那一条
    const hiddenChip = (paperId: string, ids: string[], style: string) => {
      add(`hid:${paperId}`, "button", "ov-i ov-chip ov-hidden", style, esc(_t("隐藏 {n}", { n: ids.length })), { "data-ov": "hidden", "data-paper": paperId, title: _t("这一段有 {n} 位隐藏着（不排、不占地方）：点开看是谁、放出来", { n: ids.length }) });
    };
    for (const pp of L.papers) {
      const paper = nameOf(pp.id); if (!paper) continue;
      const k = papers.indexOf(paper), h = CTL_H * sp, y = pp.title.y + (pp.title.h - h) / 2, pid = esc(pp.id);   // 下面拼成 HTML 的地方一律用 pid：纸的编号是文件里读进来的（别家 / 手改过的文件不保证干净）
      if (pp.title.shown && multi) {
        const segOn = v.onlyPaper === pp.id;
        const kids = [
          ...(pp.hiddenParts.length ? [`<button class="ov-i ov-chip ov-hidden" data-ov="hidden" data-paper="${pid}" title="${esc(_t("这一段有 {n} 位隐藏着（不排、不占地方）：点开看是谁、放出来", { n: pp.hiddenParts.length }))}">${esc(_t("隐藏 {n}", { n: pp.hiddenParts.length }))}</button>`] : []),
          `<button class="ov-i ov-chip ov-nav-prev${k > 0 ? "" : " off"}" data-ov="prev" data-paper="${pid}" title="${esc(_t("上一段"))}">‹</button>`,
          `<span class="ov-nav-text">${k + 1}/${papers.length}</span>`,
          `<button class="ov-i ov-chip ov-nav-next${k < papers.length - 1 ? "" : " off"}" data-ov="next" data-paper="${pid}" title="${esc(_t("下一段"))}">›</button>`,
          `<button class="ov-i ov-chip ov-scope${segOn ? " on" : ""}" data-ov="scope" data-paper="${pid}" title="${esc(segOn ? _t("只看本段（再点 = 看全部曲段）") : _t("只看本段"))}">${icon("visibility-only", CTL_GLYPH * sp)}</button>`,
          ...(v.edit ? [`<button class="ov-i ov-chip ov-menu" data-ov="menu" data-paper="${pid}" title="${esc(_t("这一段的菜单"))}">⋯</button>`] : []),
        ];
        add(`nav:${pp.id}:${k}:${papers.length}:${segOn}:${v.edit}:${pp.hiddenParts.join(",")}`, "div", "ov-nav", `right:${px(-L.content.right)};top:${px(y)};height:${px(h)};--ctl:${px(h)};--ctl-glyph:${px(CTL_GLYPH * sp)};--ctl-text:${px(CTL_TEXT * sp)}`, kids.join(""));
      } else if (pp.hiddenParts.length && pp.title.shown) {   // 单纸、曲段名那一条画了：「隐藏 N」在那一条右边（没画 = 进下面 ⑥½ 的状态提示「隐藏了 N 个声部」；统筹 2026-11-12）
        hiddenChip(pp.id, pp.hiddenParts, `right:${px(-(L.content.right - (CTL_H + 0.6) * sp))};top:${px(y)};height:${px(h)};font-size:${px(CTL_TEXT * sp)}`);
      }
      // 空着的曲段名 / 折叠的隐藏纸（名字 + 说明）/ 本段视图里隐藏纸的说明 / 没有声部的纸
      if (pp.title.shown && !paper.name && !pp.hidden) add(`ph-paper:${pp.id}`, "div", "ov-placeholder ov-ph-paper", text(pp.title.x, pp.title.baseline, pp.title.size), esc(_t("曲段名")));
      if (pp.note) add(`hp-note:${pp.id}`, "div", "ov-stub ov-note", `${box(pp.note.x, pp.note.y, pp.note.w, pp.note.h)};font-size:${px(1.1 * sp)}`, `<span>${esc(_t("这一段隐藏着：不放、不印（「⋯」里能放出来）"))}</span>`);
      if (pp.empty) add(`empty:${pp.id}`, "div", "ov-placeholder ov-ph-empty", text(pp.empty.x, pp.empty.y + 2.2 * sp, 1.3 * sp), esc(_t("（这张纸上没有声部）")));
      // ④ 每张纸底下的虚线框：本段 = 「＋ 声部」「＋ 新曲段」并排；全部 = 一个整宽「＋ 声部」
      if (pp.under && v.edit) {
        const u = pp.under, gap = 0.8 * sp, w2 = (u.w - gap) / 2, fs = `font-size:${px(1.15 * sp)}`;
        if (v.onlyPaper) {
          add(`add:${pp.id}:part`, "button", "ov-i ov-add", `${box(u.x, u.y, w2, u.h)};${fs}`, esc(_t("＋ 声部")), { "data-ov": "add", "data-paper": pp.id, "data-kind": "part" });
          add(`add:${pp.id}:paper`, "button", "ov-i ov-add", `${box(u.x + w2 + gap, u.y, w2, u.h)};${fs}`, esc(_t("＋ 新曲段")), { "data-ov": "add", "data-paper": pp.id, "data-kind": "paper" });
        } else add(`add:${pp.id}:part`, "button", "ov-i ov-add", `${box(u.x, u.y, u.w, u.h)};${fs}`, esc(_t("＋ 声部")), { "data-ov": "add", "data-paper": pp.id, "data-kind": "part" });
      }
    }
    // ③½ 全部视图里隐藏着的整张纸（v0.16.34）：提醒 = 下面 ⑥½ 状态提示里的「隐藏了 N 段」（原来歌名那一条左边的小标，统筹 2026-11-12 收进状态提示）
    this.hiddenPapers = L.papers.filter((pp) => pp.hidden).map((pp) => pp.id);
    if (L.tail && v.edit) add("add:tail", "button", "ov-i ov-add", `${box(L.tail.x, L.tail.y, L.tail.w, L.tail.h)};font-size:${px(1.15 * sp)}`, esc(_t("＋ 新曲段")), { "data-ov": "add", "data-paper": L.tail.paper, "data-kind": "paper" });
    // ⑤ 空着的歌名 / 作者栏 / 编排（歌名、编排点了照旧是谱面的就地改——这几个字不接点；作者栏空着没有点击框 = 字本身接）
    if (!song.title) add("ph-title", "div", "ov-placeholder ov-ph-title", text((L.content.left + L.content.right) / 2, L.title.baseline, L.title.size * 0.8, "middle"), esc(_t("歌名")));
    if (!song.credits) add("ph-credits", "button", "ov-i ov-placeholder ov-ph-credits", text(L.creditsLine.x, L.creditsLine.y, L.creditsLine.size, "end"), esc(_t("作者")), { "data-ov": "credits" });   // 哪个模式都能点（v0.16.85，同歌名）
    if (L.arrangement && !song.arrangement?.trim()) {
      const a = L.arrangement;
      add("ph-arr", "div", "ov-placeholder ov-ph-arr", `${text(L.content.left, a.baseline, a.size)};max-width:${px(L.content.right - L.content.left)}`,
        `<span class="ov-arr-label">${esc(_t("编排　"))}</span><span class="ov-arr-empty">${esc(_t("不写 = 每张纸按顺序各放一遍（例：前奏 (A A1)×3 A A2 [副歌]）"))}</span>`);
    }
    // ⑥ 「1=C」淡提示（专业模式 C 调；小调每一处写「6=X」，v0.16.83；点 = 谱头面板）
    for (const kh of L.keyHints) {
      const sys = L.systems[kh.system]; if (!sys) continue;
      add(`kh:${kh.system}:${kh.index}`, v.marks ? "button" : "div", `${v.marks ? "ov-i " : ""}ov-key-hint`, text(kh.x, kh.y, kh.size, "start", textStyleOf("key-hint")), kh.s,
        v.marks ? { "data-ov": "keyhint", "data-paper": sys.paper, "data-part": sys.part.replace(/~.*$/, ""), "data-index": String(kh.index), title: kh.s.startsWith("6=") ? _t("小调：和弦级数从 la 数。点 = 谱号 / 调号 / 拍号 / 速度") : _t("这里是 C 调（没有升降号）：点 = 谱号 / 调号 / 拍号 / 速度") } : {});
    }
    // ⑥½ 不印的状态提示（统筹 2026-11-12「不印的状态提示都住同一个地方、同一种样子」）：排版挑好的地方（第一行谱头那一行右端，只躲不推），淡色、不印；
    //   一行里几条用「·」隔开、各点各的：隐藏了 N 段（= 原来的「隐藏 N 段」小标）· 隐藏了 N 个声部（= 原来「⋯」右边的「隐藏 N」）· 演奏法和表情：不显示（7-G 重做；
    //   user 11-12「折叠八十…又不好懂，而且位置也错了，又还和别人打架」）。点了做的事和原来一样。点击区按排版给的上下扩到至少 3 个线间距（--hit-up / --hit-down，CSS 的 ::before）
    const ST = textStyleOf("key-hint");
    for (const ln of L.statusHints) {
      const top = boxTopFor(ln.y, ln.size, faceMetrics(ST)), hit = `--hit-up:${px(Math.max(0, top - ln.hit.y0))};--hit-down:${px(Math.max(0, ln.hit.y1 - (top + ln.size)))}`;
      ln.items.forEach((it, k) => {
        // 分隔点画在排版留的那一段（量的是「空格·空格」）正中间：HTML 会吞掉开头的空格，按原样放点就贴着前一条字
        if (k > 0) { const a = ln.items[k - 1]!.dx + ln.items[k - 1]!.w; add(`st-sep:${ln.system}:${k}`, "div", "ov-key-hint ov-status-sep", text(ln.x + (a + it.dx) / 2, ln.y, ln.size, "middle", ST), esc(ln.sep.trim())); }
        const st = `${text(ln.x + it.dx, ln.y, ln.size, "start", ST)};${hit}`;
        if (it.kind === "hiddenPapers") add(`st-hidp:${this.hiddenPapers.join(",")}`, "button", "ov-i ov-key-hint ov-status-hint ov-hidden-papers", st, esc(it.s), { "data-ov": "hidpapers", title: _t("有 {n} 段隐藏着（不放、不印、不占地方）：点开去看或放出来", { n: this.hiddenPapers.length }) });
        else if (it.kind === "hiddenParts") add(`st-hid:${it.paper}`, "button", "ov-i ov-key-hint ov-status-hint ov-hidden", st, esc(it.s), { "data-ov": "hidden", "data-paper": it.paper!, title: _t("这一段有 {n} 位隐藏着（不排、不占地方）：点开看是谁、放出来", { n: this.hiddenOf.get(it.paper!)?.length ?? 0 }) });
        else add(`st-expr:${ln.system}`, "button", "ov-i ov-key-hint ov-status-hint ov-fold-hint", st, esc(it.s), { "data-ov": "folded", title: _t("演奏法和表情现在不显示（页面设置「看谱」里关着；播放照写的来）：点开去打开") });
      });
    }
    // ⑦ 合租展开着的一家：括号（点 = 光标挪出这一家，叠回去）
    for (const f of L.families) add(`fam:${f.paper}:${f.host}`, "button", "ov-i ov-family", box(f.x, f.y, f.w, f.h), "<i></i>", { "data-ov": "family", "data-paper": f.paper, "data-host": f.host, title: _t("这一家展开着：点 = 叠回去（光标挪到下一位）") });

    this.commit(items);
  }

  /** 一次写 DOM：按 key 复用，变了才写。 */
  private commit(items: Item[]): void {
    const keep = new Set<string>();
    let prev: HTMLElement | null = null;
    for (const it of items) {
      keep.add(it.key);
      let el = this.els.get(it.key);
      if (!el || el.tagName.toLowerCase() !== it.tag) {
        el?.remove();
        el = document.createElement(it.tag); if (it.tag === "button") (el as HTMLButtonElement).type = "button";
        this.els.set(it.key, el);
      }
      if (el.className !== it.cls) el.className = it.cls;
      if (el.getAttribute("style") !== it.style) el.setAttribute("style", it.style);
      if (el.dataset.html !== it.html) { el.innerHTML = it.html; el.dataset.html = it.html; }
      for (const [k, val] of Object.entries(it.attrs)) if (el.getAttribute(k) !== val) el.setAttribute(k, val);
      // 顺序 = 表里的顺序（后来的盖在上面）；已经在对的位置就不动
      const want: ChildNode | null = prev ? prev.nextSibling : this.root.firstChild;
      if (want !== el) this.root.insertBefore(el, want);
      prev = el;
    }
    for (const [k, el] of this.els) if (!keep.has(k)) { el.remove(); this.els.delete(k); }
  }

  private down(e: PointerEvent): void {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".ov-i"); if (!el || e.button === 2) return;
    const touch = e.pointerType === "touch";
    this.cancel();
    if (!touch) { e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ } }   // 手指不拦：谱面接着收到这一下（滚动 / 捏合）
    const p = { el, pid: e.pointerId, timer: 0, fired: false, touch, x: e.clientX, y: e.clientY };
    if (el.dataset.ov === "tg") p.timer = window.setTimeout(() => { p.fired = true; this.host.onPartToggle(el.dataset.part!, TG_LONG[el.dataset.kind as "hidden" | "muted"]); }, LONG_MS);   // 长按 = 只看 / 独奏
    this.press = p;
  }
  private up(e: PointerEvent): void {
    const p = this.press; if (!p || p.pid !== e.pointerId) return;
    if (!p.touch) e.stopPropagation();   // 手指的 up 谱面也要收（它那边的滚动 / 捏合要收尾）
    this.cancel();
    if (p.fired || !p.el.isConnected) return;   // 长按已经算过 / 钮在按着的时候被重排拿掉了
    const r = p.el.getBoundingClientRect();
    const inside = p.touch ? Math.hypot(e.clientX - p.x, e.clientY - p.y) <= TOUCH_SLOP
      : e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4;
    if (inside) this.fire(p.el, r);   // 笔 / 鼠标拖出钮外再松手 = 不算；手指动过 = 不算（那是滚动）
  }
  private cancel(): void { if (this.press) { clearTimeout(this.press.timer); this.press = null; } }
  private fire(el: HTMLElement, r: DOMRect): void {
    const d = el.dataset, mid = { x: (r.left + r.right) / 2, y: r.bottom }, top = { x: (r.left + r.right) / 2, y: r.top };
    switch (d.ov) {
      case "tg": this.host.onPartToggle(d.part!, d.kind as PartToggle); break;
      case "chip": this.host.onPaper(); break;
      case "menu": this.host.onPaperMenu(d.paper!); break;
      case "prev": if (!el.classList.contains("off")) this.host.onNavFrom(d.paper!, -1); break;
      case "next": if (!el.classList.contains("off")) this.host.onNavFrom(d.paper!, 1); break;
      case "scope": this.host.onScopeOf(d.paper!); break;
      case "add": this.host.onPaperAdd(d.paper!, d.kind as "part" | "paper", top); break;
      case "credits": this.host.onCredits(); break;
      case "keyhint": this.host.onKeyHint(d.paper!, d.part!, Number(d.index), mid); break;
      case "family": this.host.onLeaveFamily(d.paper!, d.host!); break;
      case "hidden": this.host.onHidden(d.paper!, this.hiddenOf.get(d.paper!) ?? [], mid); break;
      case "hidpapers": this.host.onHiddenPapers(this.hiddenPapers, mid); break;
      case "folded": this.host.onFolded(); break;
    }
  }
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
