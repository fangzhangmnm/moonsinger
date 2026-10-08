// sel-bar.ts —— 选区条：有选区时挂在走带胶囊下面的一条（照 WeebPaint 的上下文条）：全选 / 复制 / 剪切 / 粘贴 / 操作…（选区菜单：移调 / 转调 / 时值…）/ 修 / 删 / ✕。created 2026-10-08 by Claude Fable 5.1
//   user 2026-10-08「有选区时，胶囊下面出一条选区条…对」「快捷键其实现在我都没用过」（触屏优先；快捷键只是顺手）。
//   没选区但剪贴板里有东西 = 只露「粘贴 / ✕」（贴在光标处；✕ = 忘掉剪贴板）。记号（跳音 / 呼吸…）以后也进这里（user「写完改的」）。
import { iconHtml } from "./icon.ts";
import { ARTS, DYNS, type Art, type Dyn } from "../score/song.ts";

export type SelVerb = "all" | "copy" | "cut" | "paste" | "transpose" | "delete" | "clear" | "forget" | "fix" | "fixdone" | "slur" | `art:${Art}` | `dyn:${Dyn}` | "dyn:none";
/** 「修」（2026-10-08 by Claude Opus 5.5；user 拍「挂在音上 + 选区条」）：选区条原地换成一排开关——演奏法（选中的音都有 = 亮；有的有 = 半亮）+ 力度（选区开头那儿写着的亮）。 */
export interface FixState { art: Record<Art, "all" | "some" | "none">; slur?: "all" | "some" | "none"; dyn: Dyn | null; ignores?: readonly string[] }   // ignores = 台上那位不认的（钮上标「不认」，照样能写）；slur = 连线（2026-10-08 连断）
/** 连线的钮面：一道弧（SMuFL 没有单个连线字形）。 */
export const SLUR_SVG = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,9 Q11,1 20,9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const ART_LABEL: Record<Art, [string, string]> = { staccato: ["\u{E4A2}", "跳音"], accent: ["\u{E4A0}", "重音"], tenuto: ["\u{E4A4}", "保持"], breath: ["\u{E4CE}", "呼吸"] };
const DYN_GLYPH: Record<Dyn, string> = { pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}" };
export interface SelBarHost { verb(v: SelVerb): void }

export class SelBar {
  readonly el: HTMLDivElement;
  constructor(parent: HTMLElement, host: SelBarHost) {
    this.el = document.createElement("div"); this.el.className = "sel-bar"; this.el.hidden = true;
    parent.append(this.el);
    this.el.addEventListener("pointerdown", (e) => e.stopPropagation());   // 别让谱面把这一下当点谱
    this.el.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v as SelVerb | undefined; if (v) host.verb(v); });
  }
  /** 画：sel = 有没有选区（几个 token）；clip = 剪贴板里有没有东西；over = 别的全屏视图盖着（藏）；fix = 「修」开着（那一排开关的状态）。 */
  update(sel: number, clip: boolean, over: boolean, fix: FixState | null = null): void {
    if (over || (!sel && !clip)) { this.el.hidden = true; return; }
    const b = (v: SelVerb, label: string, icon?: string, cls = "") => `<button type="button" class="btn ${cls}" data-v="${v}">${icon ? iconHtml(icon) : ""}<span>${label}</span></button>`;
    if (sel && fix) {
      this.el.innerHTML = `<span class="sel-n">修</span>` +
        ARTS.map((a) => `<button type="button" class="btn fix-art${fix.art[a] === "all" ? " is-on" : fix.art[a] === "some" ? " is-some" : ""}" data-v="art:${a}" title="${ART_LABEL[a][1]}：选中的音都有 = 去掉，否则都加上${fix.ignores?.includes(a) ? "（台上这位不认：写在谱上画灰，出声不受影响）" : ""}"><span class="smufl">${ART_LABEL[a][0]}</span><span>${ART_LABEL[a][1]}</span>${fix.ignores?.includes(a) ? `<span class="ign-tag">不认</span>` : ""}</button>`).join("") +
        `<button type="button" class="btn fix-art fix-slur${fix.slur === "all" ? " is-on" : fix.slur === "some" ? " is-some" : ""}" data-v="slur" title="连线：选中的音连起来（不留缝）；都连着 = 去掉${fix.ignores?.includes("slur") ? "（台上这位现在不认：写在谱上画灰，出声不变）" : ""}">${SLUR_SVG}<span>连线</span>${fix.ignores?.includes("slur") ? `<span class="ign-tag">不认</span>` : ""}</button>` +
        `<span class="sel-gap"></span>` +
        DYNS.map((d) => `<button type="button" class="btn fix-dyn${fix.dyn === d ? " is-on" : ""}" data-v="dyn:${d}" title="力度 ${d}：放在选区开头，管到下一个力度"><span class="smufl">${DYN_GLYPH[d]}</span></button>`).join("") +
        (fix.dyn ? b("dyn:none", "去掉力度") : "") + b("fixdone", "完成", "", "primary");
      this.el.hidden = false; return;
    }
    this.el.innerHTML = sel
      ? `<span class="sel-n">${sel} 个</span>` + b("all", "全选") + b("copy", "复制") + b("cut", "剪切") + (clip ? b("paste", "粘贴") : "") + b("transpose", "操作…") + b("fix", "修") + b("delete", "删", "trash-can", "danger") + b("clear", "", "x")
      : b("paste", "粘贴到光标处") + b("forget", "", "x");
    this.el.hidden = false;
  }
}
